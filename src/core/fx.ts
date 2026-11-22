import { VIEW_H, VIEW_W } from '../contracts';

let vignette: HTMLCanvasElement | null = null;

/** Soft dark corners over the whole view. Built once at quarter size, then stretched. */
export function drawVignette(g: CanvasRenderingContext2D, strength = 1): void {
  if (!vignette) {
    const c = document.createElement('canvas');
    c.width = VIEW_W / 4;
    c.height = VIEW_H / 4;
    const v = c.getContext('2d');
    if (!v) return;
    const grad = v.createRadialGradient(c.width / 2, c.height * 0.46, c.height * 0.24, c.width / 2, c.height / 2, c.height * 0.68);
    grad.addColorStop(0, 'rgba(8,5,26,0)');
    grad.addColorStop(0.6, 'rgba(8,5,26,0.2)');
    grad.addColorStop(1, 'rgba(8,5,26,0.62)');
    v.fillStyle = grad;
    v.fillRect(0, 0, c.width, c.height);
    vignette = c;
  }
  const alpha = g.globalAlpha;
  g.globalAlpha = alpha * strength;
  g.drawImage(vignette, 0, 0, VIEW_W, VIEW_H);
  g.globalAlpha = alpha;
}

/** A radial glow centred on the origin with radius 100; scale the context to size it. */
export function makeGlow(g: CanvasRenderingContext2D, rgb: string, alpha: number): CanvasGradient {
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, 100);
  grad.addColorStop(0, `rgba(${rgb},${alpha})`);
  grad.addColorStop(0.5, `rgba(${rgb},${alpha * 0.4})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  return grad;
}
