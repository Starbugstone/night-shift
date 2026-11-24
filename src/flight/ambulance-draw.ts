import type { Assets } from '../contracts';
import { drawSprite } from '../core/fx';
import { roundRectPath } from '../ui/draw';
import type { HazardField } from './hazards';

const TAU = Math.PI * 2;
const INK = '#1b1433';
export const BAY_W = 200;
export const BAY_H = 120;
export const DOOR_W = 74;

export function ambulanceFallback(g: CanvasRenderingContext2D, w: number, l: number): void {
  roundRectPath(g, -w / 2 + 4, -l / 2 + 4, w - 8, l - 8, 12);
  g.fillStyle = '#eef0f6';
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.stroke();
  // windscreen at the nose (north), a teal stripe, a crescent moon on the roof (no cross)
  roundRectPath(g, -w / 2 + 12, -l / 2 + 14, w - 24, 22, 6);
  g.fillStyle = '#9fd3e6';
  g.fill();
  g.fillStyle = '#3f9a9a';
  g.fillRect(-w / 2 + 6, 6, w - 12, 10);
  g.beginPath();
  g.arc(0, 40, 14, 0, TAU);
  g.fillStyle = '#5a6aa0';
  g.fill();
  g.beginPath();
  g.arc(6, 36, 12, 0, TAU);
  g.fillStyle = '#eef0f6';
  g.fill();
}

export function bayFallback(g: CanvasRenderingContext2D): void {
  roundRectPath(g, -BAY_W / 2 + 4, -BAY_H / 2 + 4, BAY_W - 8, BAY_H - 8, 8);
  g.fillStyle = '#7a8296';
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.stroke();
  g.fillStyle = '#c9ccd8';
  for (const x of [-50, 50]) g.fillRect(x - DOOR_W / 2, BAY_H / 2 - 14, DOOR_W, 10);
  g.fillStyle = 'rgba(0,0,0,0.2)';
  g.fillRect(-BAY_W / 2 + 18, -BAY_H / 2 + 18, 40, 26);
}

/** Index of an ambulance whose tell started since the last call (bay door going up), or -1. `prev` holds last frame's flags. */
export function ambulanceScrambled(f: HazardField, prev: Uint8Array): number {
  let hit = -1;
  for (let i = 0; i < f.defs.length; i++) {
    if (f.defs[i]!.type !== 'ambulance') continue;
    const now = f.tell[i]!;
    if (now && !prev[i] && hit < 0) hit = i;
    prev[i] = now;
  }
  return hit;
}

/**
 * The L6 campus lawn: `flight/ground_campus` tiled, or a cool dark lawn with pine needles.
 * `speckles` = x, y, size triples spread over the map (the scene's own).
 */
export function drawCampusGround(g: CanvasRenderingContext2D, assets: Assets, cx: number, cy: number, speckles: Float32Array, viewW: number, viewH: number): void {
  const img = assets.get('flight/ground_campus');
  if (img) {
    const T = 540;
    const x0 = Math.floor(cx / T) * T;
    const y0 = Math.floor(cy / T) * T;
    for (let y = y0; y < cy + viewH; y += T) for (let x = x0; x < cx + viewW; x += T) drawSprite(g, img, x, y, T + 0.5, T + 0.5);
    return;
  }
  g.fillStyle = '#263f3c';
  g.fillRect(cx - 20, cy - 20, viewW + 40, viewH + 40);
  g.fillStyle = '#2e4b46';
  for (let i = 0; i < speckles.length; i += 3) {
    const x = speckles[i]!;
    const y = speckles[i + 1]!;
    if (x < cx - 10 || x > cx + viewW + 10 || y < cy - 10 || y > cy + viewH + 10) continue;
    const r = speckles[i + 2]!;
    // pine needles: short slanted strokes
    g.fillRect(x, y, r * 2.2, 2);
    g.fillRect(x + r, y + 3, 2, r * 1.6);
  }
}
