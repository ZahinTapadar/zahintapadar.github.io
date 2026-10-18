import React, { useEffect, useRef } from 'react';
import { W, H, FONT, COLORS, setupCanvas, loadBest, saveBest, drawOverlay } from './shared';

// You are the garbage collector. Catch unreachable bytes before they leak,
// dodge NULL pointers, and grab the occasional 0xFF for a bonus.

const BEST_KEY = 'game:garbage_collector:best';
const GC_W = 76;
const GC_H = 14;
const GC_Y = H - 34;
const MAX_LEAK = 8;
const MAX_LIVES = 3;

type Kind = 'byte' | 'null' | 'bonus';
interface Item { x: number; y: number; vy: number; kind: Kind; label: string; }
interface Popup { x: number; y: number; t: number; text: string; color: string; }

const hex = () => '0x' + Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0');

const GarbageCollector: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = setupCanvas(canvas);

        let phase: 'ready' | 'playing' | 'over' = 'ready';
        let gcX = W / 2;
        let pointerX: number | null = null;
        const keys = { left: false, right: false };
        let items: Item[] = [];
        let popups: Popup[] = [];
        let score = 0;
        let lives = MAX_LIVES;
        let leak = 0;
        let elapsed = 0;
        let spawnIn = 0;
        let hurt = 0;
        let reason = '';
        let best = loadBest(BEST_KEY);

        const reset = () => {
            items = [];
            popups = [];
            score = 0;
            lives = MAX_LIVES;
            leak = 0;
            elapsed = 0;
            spawnIn = 0.5;
            gcX = W / 2;
        };

        const end = (why: string) => {
            phase = 'over';
            reason = why;
            if (score > best) {
                best = score;
                saveBest(BEST_KEY, best);
            }
        };

        const spawn = () => {
            const r = Math.random();
            const nullChance = Math.min(0.2 + elapsed * 0.004, 0.38);
            const kind: Kind = r < 0.05 ? 'bonus' : r < 0.05 + nullChance ? 'null' : 'byte';
            items.push({
                x: 30 + Math.random() * (W - 60),
                y: -12,
                vy: Math.min(70 + elapsed * 2.2, 220) + Math.random() * 50,
                kind,
                label: kind === 'null' ? 'NULL' : kind === 'bonus' ? '0xFF' : hex()
            });
        };

        const pop = (x: number, y: number, text: string, color: string) => popups.push({ x, y, t: 0.8, text, color });

        let last = performance.now();
        let raf = 0;
        const frame = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;

            if (phase === 'playing') {
                elapsed += dt;
                if (pointerX !== null) gcX += (pointerX - gcX) * Math.min(dt * 18, 1);
                if (keys.left) gcX -= 380 * dt;
                if (keys.right) gcX += 380 * dt;
                gcX = Math.max(GC_W / 2, Math.min(W - GC_W / 2, gcX));

                spawnIn -= dt;
                if (spawnIn <= 0) {
                    spawn();
                    spawnIn = Math.max(0.85 - elapsed * 0.012, 0.3);
                }

                for (const it of items) it.y += it.vy * dt;
                items = items.filter(it => {
                    const caught = it.y + 8 >= GC_Y && it.y - 8 <= GC_Y + GC_H && Math.abs(it.x - gcX) < GC_W / 2 + 14;
                    if (caught) {
                        if (it.kind === 'null') {
                            lives--;
                            hurt = 0.4;
                            pop(it.x, GC_Y - 10, 'null deref!', COLORS.red);
                            if (lives <= 0) end('kernel panic: NULL pointer dereference');
                        } else if (it.kind === 'bonus') {
                            score += 5;
                            leak = Math.max(0, leak - 2);
                            pop(it.x, GC_Y - 10, '+5 heap compacted', COLORS.yellow);
                        } else {
                            score++;
                            pop(it.x, GC_Y - 10, 'free()', COLORS.green);
                        }
                        return false;
                    }
                    if (it.y > H + 10) {
                        if (it.kind === 'byte') {
                            leak++;
                            pop(it.x, H - 12, 'leaked', COLORS.dim);
                            if (leak >= MAX_LEAK) end('fatal: out of memory');
                        }
                        return false;
                    }
                    return true;
                });
            }
            popups.forEach(p => { p.t -= dt; p.y -= 30 * dt; });
            popups = popups.filter(p => p.t > 0);
            hurt = Math.max(0, hurt - dt);

            ctx.fillStyle = hurt > 0 ? '#1a0b0d' : COLORS.bg;
            ctx.fillRect(0, 0, W, H);

            ctx.font = `12px ${FONT}`;
            ctx.textAlign = 'center';
            for (const it of items) {
                const color = it.kind === 'null' ? COLORS.red : it.kind === 'bonus' ? COLORS.yellow : COLORS.green;
                ctx.strokeStyle = color;
                ctx.strokeRect(it.x - 20, it.y - 9, 40, 18);
                ctx.fillStyle = color;
                ctx.fillText(it.label, it.x, it.y + 4);
            }

            ctx.fillStyle = hurt > 0 ? COLORS.red : COLORS.blue;
            ctx.fillRect(gcX - GC_W / 2, GC_Y, GC_W, GC_H);
            ctx.fillStyle = '#000';
            ctx.font = `11px ${FONT}`;
            ctx.fillText('[ gc ]', gcX, GC_Y + 11);

            ctx.font = `11px ${FONT}`;
            for (const p of popups) {
                ctx.globalAlpha = Math.min(p.t * 2, 1);
                ctx.fillStyle = p.color;
                ctx.fillText(p.text, p.x, p.y);
            }
            ctx.globalAlpha = 1;
            ctx.textAlign = 'left';

            ctx.font = `13px ${FONT}`;
            ctx.fillStyle = COLORS.text;
            ctx.fillText(`freed: ${score}`, 12, 22);
            ctx.fillStyle = COLORS.dim;
            ctx.fillText(`best: ${best}`, 12, 40);
            ctx.textAlign = 'right';
            ctx.fillStyle = COLORS.red;
            ctx.fillText('♥'.repeat(Math.max(lives, 0)) + '♡'.repeat(MAX_LIVES - Math.max(lives, 0)), W - 12, 22);
            ctx.fillStyle = leak >= MAX_LEAK - 2 ? COLORS.red : COLORS.dim;
            ctx.fillText(`heap [${'#'.repeat(leak)}${'.'.repeat(MAX_LEAK - leak)}]`, W - 12, 40);
            ctx.textAlign = 'left';

            if (phase === 'ready') {
                drawOverlay(ctx, '$ ./garbage_collector', ['catch bytes, dodge NULL, don\'t let the heap leak', 'arrows / mouse / drag to move, space or tap to start'], COLORS.green);
            } else if (phase === 'over') {
                drawOverlay(ctx, reason, [`bytes freed: ${score}`, 'press space or tap to run again'], COLORS.red);
            }

            raf = requestAnimationFrame(frame);
        };

        const toCanvasX = (clientX: number) => {
            const rect = canvas.getBoundingClientRect();
            return ((clientX - rect.left) / rect.width) * W;
        };
        const start = () => {
            if (phase !== 'playing') {
                reset();
                phase = 'playing';
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') { keys.left = true; pointerX = null; e.preventDefault(); }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') { keys.right = true; pointerX = null; e.preventDefault(); }
            if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); start(); }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
        };
        const onPointerDown = (e: PointerEvent) => {
            e.preventDefault();
            pointerX = toCanvasX(e.clientX);
            start();
        };
        const onPointerMove = (e: PointerEvent) => {
            pointerX = toCanvasX(e.clientX);
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        raf = requestAnimationFrame(frame);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointermove', onPointerMove);
        };
    }, []);

    return <canvas ref={canvasRef} className="minimal-game-canvas" />;
};

export default GarbageCollector;
