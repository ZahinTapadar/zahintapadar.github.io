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

$$3^5 = 243$$

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

$$\text{pattern} = a_0 \cdot 3^0 + a_1 \cdot 3^1 + a_2 \cdot 3^2 + a_3 \cdot 3^3 + a_4 \cdot 3^4$$

where $a_i$ is the colour of letter $i$: 0, 1 or 2.

For example:

$$(0,1,2,0,2) \;\to\; 0 \cdot 1 + 1 \cdot 3 + 2 \cdot 9 + 0 \cdot 27 + 2 \cdot 81 = 183$$

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

When I went back to the scoring code, it turned out to be doing something slightly different, and much more interesting. It was measuring *information*. To explain what that means, and why one strange line of C is the whole algorithm, I have to start from zero. No maths background needed.

# The math, from zero

## A guess sorts the answers into piles

Imagine writing all 2,309 possible answers on cards. Before you type a guess, you can go through the cards one by one and work out what colours each answer *would* give you, then put cards with the same colours in the same pile.

That is exactly what the bucket loop above does. For `RAISE`, the 2,309 cards land in 132 different piles. These are the biggest:

| Colours for RAISE | Answers in that pile | Share of all answers | A few of them |
| --- | --- | --- | --- |
| `0 0 0 0 0` | 167 | 7.2% | BLOCK, BLOND, BLOOD, BLOOM |
| `0 0 0 0 1` | 120 | 5.2% | BEECH, BEEFY, BEGET, BEGUN |
| `0 0 1 0 0` | 107 | 4.6% | BIDDY, BIGOT, BILLY, BINGO |
| `1 0 0 0 0` | 103 | 4.5% | BLURB, BLURT, BROOD, BROOK |
| `1 0 0 0 1` | 102 | 4.4% | BERET, BERRY, BERTH, BLUER |
| `0 1 0 0 0` | 91 | 3.9% | ABACK, ABBOT, ABOUT, ADAPT |

28 of the piles hold a single word. If you land in one of those, you know the answer.

When the real colours come back, you find out which pile you are in, and every other card goes in the bin. That is all `filter_possible` does: keep the pile that matches.

So the question "which word should I guess?" becomes:

> Which guess sorts the cards into piles that are as small as possible?

## "Small piles" is not one number

The trouble is that "small" can mean different things. Take a toy game with only 8 possible answers, and four different guesses that split them like this:

- Guess A: two piles of 4
- Guess B: four piles of 2
- Guess C: a pile of 7 and a pile of 1
- Guess D: a pile of 5 and three piles of 1

B is obviously the best and C is obviously bad. But is D better than A? D usually leaves you with 5 cards, but sometimes you win on the spot. We need one number that scores a split fairly. That number comes from counting questions.

## Measuring uncertainty in halvings

Play twenty questions with 8 cards. If every yes/no question cuts the pile exactly in half, you go 8 → 4 → 2 → 1. Three questions.

With 16 cards it takes four questions. With 1,024 cards, ten. Every time the pile doubles, you need one more question. The number of halvings from $N$ cards down to 1 is called $\log_2 N$, "log base 2 of $N$", and each halving is one **bit**. Put another way, $\log_2 N$ is the power you have to raise 2 to in order to get $N$:

$$2^{\log_2 N} = N \qquad \text{e.g. } 2^3 = 8, \text{ so } \log_2 8 = 3$$

| Cards | Halvings needed ($\log_2 N$) |
| --- | --- |
| 2 | 1 |
| 8 | 3 |
| 1,024 | 10 |
| 2,309 | 11.17 |

2,309 is not a power of two, so the answer is not a whole number, and that is fine. It just means 2,309 cards hold about 11.17 bits of uncertainty. **Solving Wordle means getting rid of 11.17 bits.** Every guess removes some of them.

## How much did one result tell me?

If a guess takes you from $N$ cards down to a pile of $n$, the number of halvings left went from $\log_2 N$ to $\log_2 n$. The difference is what you learned:

$$\text{bits learned} = \log_2 N - \log_2 n = \log_2 \frac{N}{n}$$

With `RAISE`:

- All gray (2,309 → 167): 3.79 bits
- Only the A is yellow (2,309 → 91): 4.67 bits
- Any pile of 1 (2,309 → 1): 11.17 bits, the whole puzzle in one go

Rare results teach you more. That is the key idea of information theory: **information is surprise**. Since every answer is equally likely, the chance of landing in a pile of $n$ is $p = n/N$, so the same formula can be written as $\log_2(1/p)$. Something with a 1-in-2 chance is worth 1 bit, 1-in-4 is 2 bits, 1-in-2,309 is 11.17 bits.

## Expected information: entropy

Before guessing, you do not know which pile you will land in. But you know the chance of each one, so you can work out the *average* number of bits the guess will give you: each pile's bits, weighted by how likely you are to land there.

$$H = \sum_k \frac{n_k}{N} \log_2 \frac{N}{n_k}$$

Here $n_k$ is the size of pile $k$, and $\sum_k$ just means "add this up over every pile". This average is called **entropy**, written $H$. Here are the toy guesses again:

| Guess | Piles | Expected bits ($H$) |
| --- | --- | --- |
| B | 2, 2, 2, 2 | 2.00 |
| D | 5, 1, 1, 1 | 1.55 |
| A | 4, 4 | 1.00 |
| C | 7, 1 | 0.54 |

So D really is better than A: its lucky wins are worth more than A's even split.

For the real game:

| Guess | Expected bits |
| --- | --- |
| ROATE | 5.885 |
| RAISE | 5.878 |
| SLATE | 5.856 |
| FUZZY | 2.304 |

`FUZZY` is a bad first guess because 58% of the time (1,349 answers) it comes back all gray, which tells you very little.

There is also a ceiling. A guess can only produce 243 different colour patterns, so even a perfect split could give at most $\log_2 243 \approx$ **7.92 bits**. Since the puzzle holds 11.17, no guess can always pin the answer down on its own. You need at least two rounds of colours before you can be sure, which is why good solvers average around three to four guesses, not two.

## From entropy to one line of C

Here is the part that surprised me. The solver never computes a probability or divides anything. It just adds up $n \log_2 n$. That turns out to be the same thing.

Split the log in the entropy formula into two pieces:

$$
\begin{aligned}
H &= \sum_k \frac{n_k}{N} \log_2 \frac{N}{n_k} \\
  &= \sum_k \frac{n_k}{N} \left( \log_2 N - \log_2 n_k \right) \\
  &= \log_2 N \cdot \sum_k \frac{n_k}{N} \;-\; \frac{1}{N} \sum_k n_k \log_2 n_k
\end{aligned}
$$

The piles always add back up to all $N$ cards, so $\sum_k n_k / N = 1$:

$$H = \log_2 N - \frac{1}{N} \sum_k n_k \log_2 n_k$$

On a given turn, $N$ is the same for every guess the solver is comparing. So the only part that differs between guesses is $\sum_k n_k \log_2 n_k$, and it is *subtracted*. The smaller it is, the more information the guess gives:

$$\text{maximise } H \iff \text{minimise } \sum_k n_k \log_2 n_k$$

In the toy game, B scores 8, A scores 16, C scores 19.65, and a guess that tells you nothing (one pile of 8) scores 24. Big piles are expensive, and they get more expensive faster than they grow: a pile twice as big costs more than twice as much.

That is exactly the score the C code adds up:

```c
for (int k = 0; k < 243; k++) {
    if (buckets[k]) {
        score += lookup[buckets[k]];
    }
}
```

## Logarithms without floating point

`lookup[n]` has to be $n \log_2 n$, but computing logs with decimals in the innermost loop is slow. So the table is built once, using integers only:

```c
for (int i = 1; i < 13000; i++) {
    int l = 31 - __builtin_clz(i);       // floor(log2(i))
    L[i] = i * (l * 256 + ((i - (1 << l)) * 256) / (1 << l));
}
```

It works in two steps. Take n = 167.

1. **The whole part.** In binary, 167 is `10100111`: eight digits, so it sits between $2^7 = 128$ and $2^8 = 256$, and $\log_2 167$ is 7-point-something. `__builtin_clz` counts the leading zeros of a 32-bit number, so `31 − clz` is the position of the highest 1 bit: 7.
2. **The fraction.** Between 128 and 256 the code draws a straight line: 167 is $(167 - 128)/128 \approx 0.305$ of the way along. So $\log_2 167 \approx 7.305$. The real value is 7.384.

Both parts are multiplied by 256 so the fraction survives as a whole number. That is *fixed point*: storing 7.305 as 1,870 and remembering the scale. Then:

$$L[167] = 167 \times (7 \times 256 + 78) = 312{,}290 \;\approx\; 256 \cdot 167 \cdot \log_2 167$$

In general the table holds

$$L[n] = n \left( 256 \lfloor \log_2 n \rfloor + \left\lfloor \frac{256\,(n - 2^{\lfloor \log_2 n \rfloor})}{2^{\lfloor \log_2 n \rfloor}} \right\rfloor \right) \approx 256\, n \log_2 n$$

The straight line always sits slightly under the real curve, so the estimate is never too high, is exact at powers of two, and is off by at most 0.09 bits. Every guess gets the same kind of error, so the ranking almost never changes. Almost: by true entropy `CRATE` (5.835 bits) edges out `IRATE` (5.833), but the integer version ranks `IRATE` first. That is the price of never touching a float.

## Reading the number on screen

When the app shows `score 2843242` for `RAISE`, that is:

```
3,093,242   Σ L[n] over RAISE's 132 piles  (256 × Σ n·log₂ n, integer logs)
−  200,000   RAISE could still be the answer
−   50,000   RAISE is on the official answer list
= 2,843,242
```

Lower is better. The bonuses are explained further down.

## Why not just minimise the worst pile?

There are three natural ways to judge a split, and they disagree:

| Guess | Worst pile (minimax) | Average pile you land in | Expected bits |
| --- | --- | --- | --- |
| RAISE | **167** | 60.7 | 5.878 |
| ROATE | 194 | **60.1** | **5.885** |
| SLATE | 221 | 71.3 | 5.856 |
| ARISE | **167** | 63.5 | 5.821 |

Minimax only looks at the single worst pile and ignores everything else. The average pile size is closer, but entropy has one property the others do not: **bits add up.** Information from one guess plus information from the next equals the total you needed. That makes it the right thing to optimise one step at a time.

I still like the name minimax. But the honest description is: it is an information-theoretic solver, and minimax happens to agree with it on the first move.

# The opening move

With every answer still possible, the best guess is `RAISE`.

![The browser version on its first move: RAISE, scored against all 2,309 answers](/blog/wortraum/opening.webp)

`RAISE` splits the 2,309 answers into 132 different feedback buckets, and its largest bucket holds 167 words. Out of all 12,953 guesses, no word has a smaller worst case (`ARISE` ties it), so a true minimax solver would open with the same letters.

The next best openers are close behind:

| Rank | Guess | Buckets | Largest bucket | Expected bits |
| --- | --- | --- | --- | --- |
| 1 | RAISE | 132 | 167 | 5.878 |
| 2 | SLATE | 146 | 221 | 5.856 |
| 3 | IRATE | 124 | 193 | 5.833 |
| 4 | CRATE | 148 | 246 | 5.835 |
| 5 | TRACE | 150 | 246 | 5.830 |
| 6 | ARISE | 123 | 167 | 5.821 |

`SLATE` makes more buckets than `RAISE`, but less evenly. That is exactly the kind of difference the $n \log_2 n$ score is sensitive to.

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

## What the bonus is worth, in bits

The entropy formula explains *why* the bonus turns greedy. The score is about $256 \sum_k n_k \log_2 n_k$, and $H = \log_2 N - \frac{1}{N} \sum_k n_k \log_2 n_k$. So a bonus of $B$ points is worth

$$\Delta H = \frac{B}{256\,N} \text{ bits}$$

Every word that could still be the answer is also on the official list, so it collects both bonuses: 250,000 points.

| Answers left ($N$) | What 250,000 points is worth | Most a guess could ever give ($\log_2 N$) |
| --- | --- | --- |
| 2,309 | 0.42 bits | 11.17 bits |
| 137 | 7.13 bits | 7.10 bits |
| 91 | 10.73 bits | 6.51 bits |
| 20 | 48.83 bits | 4.32 bits |

On the first move the bonus is a gentle nudge. But the same fixed number of points is worth more and more as N shrinks. Once 137 or fewer answers are left, it is worth more than any guess could possibly tell you, so a word that cannot be the answer will never be chosen again, however cleverly it splits the piles. That is exactly what happens on `GONER`.

A fairer bonus would scale with N. Guessing a candidate gives you a $1/N$ chance of winning right now, and that chance is what should be weighed against the bits you give up.

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

In bits: `RAISE` took 2,309 answers down to 91, which is $\log_2(2309/91) \approx 4.67$ bits. `FLOAT` took 91 down to 1, which is $\log_2 91 \approx 6.51$ bits. Together that is exactly the uncertainty the game started with:

$$\log_2 \frac{2309}{91} + \log_2 91 = \log_2 2309 \approx 11.17 \text{ bits}$$
 The bits really do add up.

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
- Information theory: bits, surprise and entropy
- Fixed-point logarithms
- LuaJIT FFI
- Native C performance
- Freestanding WebAssembly
- Web Workers

Next, I want to replace the fixed bonus with something smarter, so it keeps the fast two- and three-guess wins without ever losing a game.

For a game about guessing five-letter words, it turned into a surprisingly good excuse to learn systems programming.
