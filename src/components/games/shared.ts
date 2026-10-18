export const W = 480;
export const H = 360;
export const FONT = "'JetBrains Mono', 'IBM Plex Mono', monospace";

export const COLORS = {
    bg: '#0a0a0a',
    grid: '#161b22',
    dim: '#5c6370',
    text: '#dddddd',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    purple: '#c678dd',
    cyan: '#56b6c2'
};

// Size the backing store for the device pixel ratio, keep drawing in W x H units
export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
}

export function loadBest(key: string): number {
    try {
        return Number(localStorage.getItem(key)) || 0;
    } catch {
        return 0;
    }
}

export function saveBest(key: string, score: number) {
    try {
        localStorage.setItem(key, String(score));
    } catch {
        // storage unavailable, best score just won't persist
    }
}

export function drawOverlay(ctx: CanvasRenderingContext2D, title: string, lines: string[], color: string) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = `20px ${FONT}`;
    ctx.fillText(title, W / 2, H / 2 - 20);
    ctx.fillStyle = COLORS.dim;
    ctx.font = `12px ${FONT}`;
    lines.forEach((line, i) => ctx.fillText(line, W / 2, H / 2 + 10 + i * 18));
    ctx.textAlign = 'left';
}
