---
title: Making a Wordle Solver That Actually Thinks
subtitle: not a tutorial, just a devlog
date: 2026-10-23
tags: algorithms, c, lua, webassembly
project: https://zahintapadar.github.io/wortraum/
repo: https://github.com/ZahinTapadar/wortraum/tree/lua-implementation
description: A devlog on wortraum, an information-theoretic Wordle solver with a C core, driven from Lua through LuaJIT FFI and compiled to a 3 KB WebAssembly module for the browser.
cover: /blog/wortraum/opening.webp
demo_cmd: ./wortraum
demo_note: loads the C core as WebAssembly · tap tiles or type 0 / 1 / 2, then enter
---

I wanted to make a Wordle solver.

Not one that just checks which letters have appeared, but one that looks at every possible guess and asks:

> Which word gives me the most useful information, even if it is not the answer?

That question turned out to be much more interesting than I expected.

This project is called [wortraum](https://zahintapadar.github.io/wortraum/), German for "word space": the space of possible answers that every guess collapses a little further. It began as a desktop app made with Lua and LÖVE, but the actual solving logic lives in C. Lua talks to it through LuaJIT FFI, and the same C core can also be compiled to WebAssembly and run directly in the browser.

::demo

So it became a small project about Wordle, information theory, C, Lua, FFI, and WebAssembly.

# The basic idea

In Wordle, every guess produces one of three states for each letter:

```
0 = gray
1 = yellow
2 = green
```

Since there are five positions, a guess can produce:

```
3^5 = 243
```

possible feedback patterns.

For example, if the guess is `SALET` and the hidden word is `APPLE`, the game answers:

```
S A L E T
0 1 1 1 0     A, L and E are in the word, just not there. S and T are not.
```

The solver uses that pattern to remove impossible answers.

That is the easy part.

The harder part is deciding what word to guess before knowing the answer.

# Checking a Wordle pattern correctly

One important detail in Wordle is repeated letters.

You cannot simply say:

```
if guessed_letter exists anywhere in answer:
    yellow
```

because letters can only be matched as many times as they actually appear in the answer.

Take the guess `SPEED` against the answer `ABIDE`. There is only one `E` in `ABIDE`, so only one of the two `E`s in `SPEED` is allowed to light up:

```
S P E E D
0 0 1 0 1
```

So I split the comparison into two passes.

First, it checks all green letters:

```c
for (int i = 0; i < 5; ++i) {
    if (guess[i] == answer[i]) {
        pattern += 2 * multiplier[i];
        answer_used |= 1 << i;
        guess_used |= 1 << i;
    }
}
```

Then it checks unmatched letters for yellow matches.

```c
for (int i = 0; i < 5; ++i) {
    if (!(guess_used & (1 << i))) {
        for (int j = 0; j < 5; ++j) {
            if (!(answer_used & (1 << j)) && guess[i] == answer[j]) {
                pattern += multiplier[i];
                answer_used |= 1 << j;
                break;
            }
        }
    }
}
```

The `answer_used` and `guess_used` bitmasks make sure a letter is not matched twice. Greens go first because a green always claims its letter before a yellow can.

This is a small thing, but without it the solver can confidently eliminate the correct word.

# Encoding feedback as one number

Instead of storing feedback as five separate values, I encode the pattern as a base-3 number.

```
pattern = a₀ × 3⁰ + a₁ × 3¹ + a₂ × 3² + a₃ × 3³ + a₄ × 3⁴
```

For example:

```
0 1 2 0 2   →   0 + 3 + 18 + 0 + 162 = 183
```

This is useful because every feedback result becomes an array index from `0` to `242`. "All gray" is `0`, "all green" is `242`, and grouping answers by feedback becomes a single array lookup.

The Lua side has the same conversion:

```lua
function M.FeedbackToPattern(feedback_str)
    local target = 0
    local multipliers = {1, 3, 9, 27, 81}

    for i = 1, 5 do
        local mark = tonumber(feedback_str:sub(i, i)) or 0
        target = target + mark * multipliers[i]
    end

    return target
end
```

It is a very small optimization, but it makes the rest of the algorithm much simpler.

# The solver does not only guess possible answers

At any point in a Wordle game, there are two different sets of words:

- Words that could still be the answer: it starts with the **2,309** official answers
- Words that are legal guesses, even if they cannot be the answer anymore: **12,953** of them

This distinction matters.

Sometimes the best move is a word that cannot possibly be the answer, because it tests useful letters in useful positions. A guess like that might eliminate a huge number of possibilities in one move.

So for every allowed guess, the solver compares it against every remaining possible answer. Then it groups those answers by the feedback pattern they would produce.

```c
int buckets[243] = {0};

for (int j = 0; j < word_count; j++) {
    if (is_possible[j]) {
        int pattern = compare(guess, words[j]);
        buckets[pattern]++;
    }
}
```

On the first move that is 12,953 guesses × 2,309 answers: about **30 million** pattern comparisons, every time the app starts.

If one guess creates a lot of small, balanced buckets, it is good. If another creates one enormous bucket and several tiny ones, it is worse.

# Scoring a guess: I called it minimax

My first description of this was "minimax": pick the guess whose worst outcome is smallest. That is what the project called itself, right up until I wrote this post.

But when I went back to the scoring code for this post, it turned out to be doing something slightly different, and more interesting.

The score adds up a precomputed value for each bucket:

```c
for (int k = 0; k < 243; k++) {
    if (buckets[k]) {
        score += lookup[buckets[k]];
    }
}
```

And the lookup table is built like this:

```c
for (int i = 1; i < 13000; i++) {
    int l = 31 - __builtin_clz(i);       // floor(log2(i))
    L[i] = i * (l * 256 + ((i - (1 << l)) * 256) / (1 << l));
}
```

`31 - __builtin_clz(i)` is the integer part of `log₂ i`, read straight off the leading zeros. The second term linearly interpolates between powers of two for the fractional part. Both are multiplied by 256, so this is a fixed-point approximation of:

```
L[n] ≈ 256 · n · log₂ n
```

So the score is really `Σ n · log₂ n` over the buckets. Minimising that is the same as **maximising the entropy** of the feedback pattern:

```
H = log₂ N − (1/N) · Σ nₖ · log₂ nₖ
```

In plain words: it does not just make the worst bucket small. It picks the guess that tells you the most *on average*, measured in bits. The integer table means there is not a single floating-point `log` in the hot loop.

I still like the name. But the honest description is: it is an information-theoretic solver, and minimax happens to agree with it on the first move.

# The opening move

With every answer still possible, the best guess is `RAISE`.

![The browser version on its first move: RAISE, scored against all 2,309 answers](/blog/wortraum/opening.webp)

`RAISE` splits the 2,309 answers into 132 different feedback buckets, and its largest bucket holds 167 words. Out of all 12,953 guesses, no word has a smaller worst case (`ARISE` ties it), so a true minimax solver would open with the same letters.

The next best openers are close behind:

| Rank | Guess | Buckets | Largest bucket |
| --- | --- | --- | --- |
| 1 | RAISE | 132 | 167 |
| 2 | SLATE | 146 | 221 |
| 3 | IRATE | 124 | 193 |
| 4 | CRATE | 148 | 246 |
| 5 | TRACE | 150 | 246 |
| 6 | ARISE | 123 | 167 |

`SLATE` makes more buckets than `RAISE`, but less evenly. That is exactly the kind of difference the `n · log₂ n` score is sensitive to.

# A small bias toward actual answers

Pure information gain can sometimes suggest a strange word that is technically legal but not very satisfying.

So I added a small modifier.

Words that are still possible answers get a big bonus. Words that are on the official answer list get a smaller extra one on top.

```c
score -= (is_possible[i] ? 200000 : 0)
      + (is_official_answer[i] ? 50000 : 0);
```

For scale, the raw score on the first move is around 3,000,000, so this is enough to reorder the top candidates without overriding the information score.

It is a compromise between "play perfectly" and "play like a human who would like to solve the puzzle."

I wanted to know what that compromise actually costs, so I wrote a small harness that includes the C core directly and plays all 2,309 answers, with and without the bonus:

| | With the bonus | Without it |
| --- | --- | --- |
| Opening word | RAISE | ROATE |
| Average guesses | 3.60 | 3.64 |
| Solved in 1 | 1 | 0 |
| Solved in 2 | 131 | 28 |
| Solved in 3 | 995 | 870 |
| Solved in 4 | 911 | 1,327 |
| Solved in 5 | 212 | 84 |
| Solved in 6 | 47 | 0 |
| Needed 7 or 8 | 12 | 0 |
| Worst game | 8 (GONER) | 5 |

So the bonus does what I wanted: far more games end in two or three guesses, and the average gets better. But it also makes the solver greedy. On words like `GONER`, where many answers share the same pattern (`_O_ER`), it keeps guessing words that *could* be the answer instead of one that splits the group, and 12 games run past Wordle's six-guess limit.

Without the bonus, it never needs more than five guesses. That is a real trade-off, and now that I can measure it, I can tune it properly instead of guessing.

# Why Lua and C?

The first version is a LÖVE application written in Lua.

Lua is great for quickly making an interface. I can display the current suggestion, show all remaining candidates, read keyboard input, and update the screen without writing a huge amount of code.

But the core calculation is expensive. Thirty million comparisons for the first move is not something I wanted to run in an interpreted loop.

So the heavy loop is in C. The word list is a plain global array, `char w[13000][6]`, with two byte flags per word: still possible, and official answer. With the scoring table, everything the solver touches is about 150 KB, small enough to sit in the CPU's cache.

Lua talks to the C library using LuaJIT FFI:

```lua
ffi.cdef[[
    int load_words(const char *allowed_path, const char *possible_path);
    int filter_possible(int guess_idx, int target);
    int calculate_best_move(int *out_score);
    const char* get_word(int idx);
]]
```

Then the app can call the native solver almost like it is ordinary Lua code.

```lua
local best_index, best_score = m.CalculateBestMove()
best_word = string.upper(m.GetWord(best_index))
```

The score comes back through an `int[1]` allocated with `ffi.new`, so C can write into it like an out-parameter.

The UI remains simple, while the brute-force part stays fast. Natively, the opening move takes about **0.45 seconds**, and every later move averages about **50 ms**, because by then only a few dozen answers remain.

# Turning the C core into WebAssembly

After getting the desktop version working, I wanted it to run in the browser too.

The nice part was that the actual algorithm did not need to change much. The interesting part was everything *around* it.

The C file reads its word lists with `fopen` and `fscanf`, and the browser has no file system. So the WebAssembly build is freestanding: no libc at all. Under a `WORDLE_WASM` flag, the file provides its own tiny `memset` and `strcmp`, and instead of opening files, it exposes a 128 KB buffer:

```c
char io_buf[131072];
char *get_io_buf(void) { return io_buf; }
```

JavaScript writes both word lists into that buffer, separated by a null byte, and calls `load_words_buf()` to parse them in place. After loading, the same buffer doubles as scratch space for the score out-parameter.

The build is a single clang call with the `wasm32` target and no standard library, then a WebAssembly linker:

```sh
clang --target=wasm32 -O3 -DWORDLE_WASM -nostdlib -fno-builtin \
  -c wordle_core_c.c -o wordle_core.o
wasm-ld --no-entry --export=calculate_best_move ... -o wordle_core.wasm
```

The result is a **3.2 KB** `.wasm` file. The word lists are bigger than the solver.

The browser loads it inside a Web Worker, so the calculation does not freeze the interface while it thinks.

The browser side sends feedback like this:

```js
worker.postMessage({
    type: 'feedback',
    pattern
});
```

The worker filters the remaining words, finds the next best guess, and sends the result back.

```js
postMessage({
    state: 'WAITING_INPUT',
    best: getWord(bestIdx),
    score,
    ms,
    remaining: list.length,
    words: list
});
```

Reading a word back out is a small lesson in how WebAssembly sees memory: `get_word` returns a pointer, which on the JavaScript side is just an offset into a `Uint8Array`, read until the null byte.

In Chrome, the opening move takes about **720 ms** in WebAssembly against 450 ms native, and later moves about 100 ms. Slower, but the same answer, from the same C.

That was important to me. I did not want a "web demo" with a different, simplified algorithm. I wanted one core that could run in two environments.

# The interface

The interface is intentionally small.

It shows:

- The suggested word
- The number of possible answers left
- The score
- The time taken by WebAssembly
- The remaining candidate words

After playing the suggested guess in Wordle, you click or type the five feedback states.

```
0 = gray
1 = yellow
2 = green
```

![Typing the feedback for RAISE when the answer is PLANT: only the A is yellow](/blog/wortraum/feedback.webp)

Then the solver removes every word that could not have produced that exact feedback.

Here is a real game. The hidden word is `PLANT`. After `RAISE` comes back as `0 1 0 0 0`, only 91 answers are left, and the solver picks `FLOAT`: a word that tests `L`, `O`, `A` and `T` at once.

![After one guess, 91 answers remain and FLOAT is the next best question](/blog/wortraum/second-guess.webp)

`FLOAT` comes back as `0 2 0 1 2`. Exactly one word in the whole list fits both answers.

![Solved in three: PLANT](/blog/wortraum/solved.webp)

Eventually, only one answer remains.

# What I learned

This project looked simple at first because Wordle only has five letters.

But a small game can still have a surprisingly large decision tree.

The interesting part was not the dictionary. It was learning how information can be measured through possible outcomes, and then finding out that my own code was measuring it more carefully than I had described it.

A good Wordle guess is not just a word with useful letters.

It is a question.

And the best question is the one that makes the answer space collapse as quickly as possible.

The project is still small, but I like that it connects a lot of things I wanted to explore:

- Game logic
- Bitmasks
- Base-3 encoding
- Entropy, and fixed-point logarithms
- LuaJIT FFI
- Native C performance
- Freestanding WebAssembly
- Web Workers

Next, I want to replace the fixed bonus with something smarter, so it keeps the fast two- and three-guess wins without ever losing a game.

For a game about guessing five-letter words, it turned into a surprisingly good excuse to learn systems programming.
