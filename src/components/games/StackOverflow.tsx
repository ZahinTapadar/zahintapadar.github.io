import React, { useEffect, useRef } from 'react';
import { W, H, FONT, COLORS, setupCanvas, loadBest, saveBest, drawOverlay } from './shared';

// Drop sliding stack frames onto the call stack. Whatever hangs over the edge
// gets cut off; miss completely and the program segfaults.

const BLOCK_H = 22;
const BASE_W = 200;
const BEST_KEY = 'game:stack_overflow:best';
const PALETTE = [COLORS.blue, COLORS.purple, COLORS.cyan, COLORS.green, COLORS.yellow, COLORS.red];

interface Block { x: number; w: number; }
interface Chunk { x: number; y: number; w: number; vy: number; color: string; }

const StackOverflow: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = setupCanvas(canvas);

        let phase: 'ready' | 'playing' | 'over' = 'ready';
        let stack: Block[] = [];
        let cur = { x: 0, w: BASE_W, dir: 1 };
        let chunks: Chunk[] = [];
        let camera = 0;
        let combo = 0;
        let flash = 0;
        let best = loadBest(BEST_KEY);

        const depth = () => stack.length - 1;
        const colorOf = (i: number) => PALETTE[i % PALETTE.length];
        const speed = () => Math.min(110 + depth() * 7, 420);
        const screenY = (i: number) => H - 30 - (i + 1) * BLOCK_H + camera;

        const spawn = () => {
            const top = stack[stack.length - 1];
            const fromLeft = stack.length % 2 === 0;
            cur = { x: fromLeft ? 0 : W - top.w, w: top.w, dir: fromLeft ? 1 : -1 };
        };

        const reset = () => {
            stack = [{ x: (W - BASE_W) / 2, w: BASE_W }];
            chunks = [];
            camera = 0;
            combo = 0;
            spawn();
        };

        const drop = () => {
            const prev = stack[stack.length - 1];
            const y = screenY(stack.length);
            const color = colorOf(stack.length);

            if (Math.abs(cur.x - prev.x) < 4) {
                // Perfect placement: snap, and reward a streak by growing the frame back
                combo++;
                const w = combo >= 3 ? Math.min(prev.w + 8, BASE_W) : prev.w;
                stack.push({ x: Math.max(0, Math.min(prev.x - (w - prev.w) / 2, W - w)), w });
                flash = 0.6;
            } else {
                combo = 0;
                const left = Math.max(cur.x, prev.x);
                const right = Math.min(cur.x + cur.w, prev.x + prev.w);
                if (right <= left) {
                    chunks.push({ x: cur.x, y, w: cur.w, vy: 0, color });
                    phase = 'over';
                    if (depth() > best) {
                        best = depth();
                        saveBest(BEST_KEY, best);
                    }
                    return;
                }
                const cutX = cur.x < prev.x ? cur.x : right;
                chunks.push({ x: cutX, y, w: cur.w - (right - left), vy: 0, color });
                stack.push({ x: left, w: right - left });
            }
            spawn();
        };

        const act = () => {
            if (phase === 'playing') drop();
            else {
                reset();
                phase = 'playing';
            }
        };

        const drawBlock = (x: number, y: number, w: number, color: string, label: string) => {
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.85;
            ctx.fillRect(x, y, w, BLOCK_H - 2);
            ctx.globalAlpha = 1;
            if (w > 70 && label) {
                ctx.fillStyle = '#000';
                ctx.font = `11px ${FONT}`;
                ctx.fillText(label, x + 6, y + 14);
            }
        };

        let last = performance.now();
        let raf = 0;
        const frame = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;

            if (phase === 'playing') {
                cur.x += cur.dir * speed() * dt;
                if (cur.x <= 0) { cur.x = 0; cur.dir = 1; }
                if (cur.x + cur.w >= W) { cur.x = W - cur.w; cur.dir = -1; }
            }
            const targetCamera = Math.max(0, (stack.length + 1) * BLOCK_H - (H - 150));
            camera += (targetCamera - camera) * Math.min(dt * 6, 1);
            chunks.forEach(c => { c.vy += 900 * dt; c.y += c.vy * dt; });
            chunks = chunks.filter(c => c.y < H + 40);
            flash = Math.max(0, flash - dt);

            ctx.fillStyle = COLORS.bg;
            ctx.fillRect(0, 0, W, H);

            // Faint address grid scrolling with the stack
            ctx.strokeStyle = COLORS.grid;
            ctx.lineWidth = 1;
            for (let y = (camera % BLOCK_H) - BLOCK_H; y < H; y += BLOCK_H) {
                ctx.beginPath();
                ctx.moveTo(0, y + 0.5);
                ctx.lineTo(W, y + 0.5);
                ctx.stroke();
            }

            stack.forEach((b, i) => {
                const y = screenY(i);
                if (y > H || y < -BLOCK_H) return;
                drawBlock(b.x, y, b.w, i === 0 ? COLORS.dim : colorOf(i), i === 0 ? 'main()' : `frame_${i}()`);
            });
            if (phase === 'playing') {
                drawBlock(cur.x, screenY(stack.length), cur.w, colorOf(stack.length), `frame_${stack.length}()`);
            }
            chunks.forEach(c => drawBlock(c.x, c.y, c.w, c.color, ''));

            ctx.fillStyle = COLORS.text;
            ctx.font = `13px ${FONT}`;
            ctx.fillText(`depth: ${Math.max(depth(), 0)}`, 12, 22);
            ctx.fillStyle = COLORS.dim;
            ctx.fillText(`best: ${best}`, 12, 40);
            if (flash > 0) {
                ctx.globalAlpha = Math.min(flash * 2, 1);
                ctx.fillStyle = COLORS.yellow;
                ctx.textAlign = 'right';
                ctx.fillText(combo >= 3 ? `perfect x${combo}  +width` : 'perfect', W - 12, 22);
                ctx.textAlign = 'left';
                ctx.globalAlpha = 1;
            }

            if (phase === 'ready') {
                drawOverlay(ctx, '$ ./stack_overflow', ['drop each frame on the one below', 'space / click / tap to drop'], COLORS.green);
            } else if (phase === 'over') {
                drawOverlay(ctx, 'segmentation fault (core dumped)', [`max recursion depth: ${depth()}`, 'press space or tap to run again'], COLORS.red);
            }

            raf = requestAnimationFrame(frame);
        };

        const onKey = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                if (!e.repeat) act();
            }
        };
        const onPointer = (e: PointerEvent) => {
            e.preventDefault();
            act();
        };

        reset();
        window.addEventListener('keydown', onKey);
        canvas.addEventListener('pointerdown', onPointer);
        raf = requestAnimationFrame(frame);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('keydown', onKey);
            canvas.removeEventListener('pointerdown', onPointer);
        };
    }, []);

    return <canvas ref={canvasRef} className="minimal-game-canvas" />;
};

export default StackOverflow;
