// L7 cruise code: the SS Buffet Royale seen from above, and the open sea round it.
//
// The ship runs bow-north down the middle of the map, built from flight/ship_bow_top,
// flight/ship_mid_top (repeated) and flight/ship_stern_top; the sea is flight/ground_sea (shared
// with L5). Every piece has a primitive fallback. The hull is ground: nothing here detects or
// bumps the saucer. Deck bulbs are decor only (no light pools: AGENTS.md tell language).
import type { Assets } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import { drawSprite } from '../core/fx';

/** Hull layout, world px. Sections stack bow → mids → stern. */
export const SHIP = {
  cx: 1080,
  w: 900,
  bowTop: 240,
  bowH: 720,
  midH: 540,
  mids: 3,
  sternH: 600,
} as const;
export const SHIP_LEFT = SHIP.cx - SHIP.w / 2;
export const SHIP_RIGHT = SHIP.cx + SHIP.w / 2;
export const SHIP_MID_TOP = SHIP.bowTop + SHIP.bowH;
export const SHIP_STERN_TOP = SHIP_MID_TOP + SHIP.midH * SHIP.mids;
export const SHIP_BOTTOM = SHIP_STERN_TOP + SHIP.sternH;

const SEA = '#132d33';
const SEA_LINE = 'rgba(200,225,240,0.16)';
const HULL = '#efe6d2';
const HULL_SHADE = '#c9bfa8';
const DECK = '#b9c0cf';
const DECK_LINE = 'rgba(40,40,70,0.18)';
const INK = '#1b1433';
const FOAM = '#e1f0fa';
const BULB_WARM = '#ffd9a0';
const BULB_COOL = '#e8f1ff';
/** Strings of deck bulbs (decor): y of each string across the deck. */
const BULB_ROWS = [1240, 1760, 2300, 2860] as const;

function sea(g: CanvasRenderingContext2D, assets: Assets, cx: number, cy: number, speckles: Float32Array, t: number, rm: boolean): void {
  const img = assets.get('flight/ground_sea');
  if (img) {
    const T = 540;
    const x0 = Math.floor(cx / T) * T;
    const y0 = Math.floor(cy / T) * T;
    for (let y = y0; y < cy + VIEW_H; y += T) for (let x = x0; x < cx + VIEW_W; x += T) drawSprite(g, img, x, y, T + 0.5, T + 0.5, true);
    return;
  }
  g.fillStyle = SEA;
  g.fillRect(cx - 20, cy - 20, VIEW_W + 40, VIEW_H + 40);
  g.fillStyle = SEA_LINE;
  const drift = rm ? 0 : (t * 6) % 40;
  for (let i = 0; i < speckles.length; i += 3) {
    const x = speckles[i]!;
    const y = speckles[i + 1]!;
    if (x < cx - 40 || x > cx + VIEW_W + 10 || y < cy - 10 || y > cy + VIEW_H + 10) continue;
    // Ice wave dashes, drifting slowly
    const r = speckles[i + 2]!;
    g.fillRect(x + drift - 20, y, r * 4, 2);
  }
}

function hullPath(g: CanvasRenderingContext2D, inset: number): void {
  const l = SHIP_LEFT + inset;
  const r = SHIP_RIGHT - inset;
  const top = SHIP.bowTop + inset * 1.6;
  const shoulder = SHIP_MID_TOP;
  const bottom = SHIP_BOTTOM - inset;
  g.beginPath();
  g.moveTo(SHIP.cx, top);
  g.bezierCurveTo(SHIP.cx + 120, top + 120, r, shoulder - 330, r, shoulder);
  g.lineTo(r, bottom - 160);
  g.bezierCurveTo(r, bottom - 30, r - 120, bottom, SHIP.cx, bottom);
  g.bezierCurveTo(l + 120, bottom, l, bottom - 30, l, bottom - 160);
  g.lineTo(l, shoulder);
  g.bezierCurveTo(l, shoulder - 330, SHIP.cx - 120, top + 120, SHIP.cx, top);
  g.closePath();
}

function wake(g: CanvasRenderingContext2D, t: number, rm: boolean): void {
  // a foam wake trailing south from the stern
  const y0 = SHIP_BOTTOM - 20;
  for (let k = 0; k < 7; k++) {
    const p = rm ? k / 7 : ((t * 0.18 + k / 7) % 1);
    const y = y0 + p * 520;
    const spread = 120 + p * 420;
    g.strokeStyle = FOAM;
    g.globalAlpha = 0.34 * (1 - p);
    g.lineWidth = 5 - p * 3;
    g.beginPath();
    g.moveTo(SHIP.cx - spread, y + 40);
    g.quadraticCurveTo(SHIP.cx, y - 30, SHIP.cx + spread, y + 40);
    g.stroke();
  }
  g.globalAlpha = 0.12;
  g.fillStyle = FOAM;
  g.beginPath();
  g.moveTo(SHIP.cx - 170, y0);
  g.lineTo(SHIP.cx + 170, y0);
  g.lineTo(SHIP.cx + 520, y0 + 560);
  g.lineTo(SHIP.cx - 520, y0 + 560);
  g.closePath();
  g.fill();
  g.globalAlpha = 1;
}

function section(g: CanvasRenderingContext2D, assets: Assets, key: string, y: number, h: number, cy: number): boolean {
  if (y > cy + VIEW_H + 20 || y + h < cy - 20) return true;
  const img = assets.get(key);
  if (!img) return false;
  drawSprite(g, img, SHIP_LEFT, y, SHIP.w, h);
  return true;
}

/** Sea, wake and hull: the ground of the ship theme. */
export function drawShipGround(g: CanvasRenderingContext2D, assets: Assets, cx: number, cy: number, speckles: Float32Array, t: number, rm: boolean): void {
  sea(g, assets, cx, cy, speckles, t, rm);
  if (cy + VIEW_H > SHIP_BOTTOM - 40) wake(g, t, rm);
  if (cx > SHIP_RIGHT + 40 || cx + VIEW_W < SHIP_LEFT - 40) return;
  // the sprites, where they have loaded; the primitive hull under anything missing
  let all = section(g, assets, 'flight/ship_bow_top', SHIP.bowTop, SHIP.bowH, cy);
  for (let k = 0; k < SHIP.mids; k++) all = section(g, assets, 'flight/ship_mid_top', SHIP_MID_TOP + k * SHIP.midH, SHIP.midH, cy) && all;
  all = section(g, assets, 'flight/ship_stern_top', SHIP_STERN_TOP, SHIP.sternH, cy) && all;
  if (!all) {
    // a dark waterline shadow, the cream hull, then the moonlit deck
    g.save();
    g.translate(14, 18);
    hullPath(g, 0);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fill();
    g.restore();
    hullPath(g, 0);
    g.fillStyle = HULL;
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = INK;
    g.stroke();
    hullPath(g, 26);
    g.fillStyle = DECK;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = HULL_SHADE;
    g.stroke();
    // deck planking, only where it is on screen
    g.fillStyle = DECK_LINE;
    const y0 = Math.max(SHIP_MID_TOP - 200, Math.floor((cy - 20) / 36) * 36);
    const y1 = Math.min(SHIP_BOTTOM - 80, cy + VIEW_H + 20);
    for (let y = y0; y < y1; y += 36) g.fillRect(SHIP_LEFT + 30, y, SHIP.w - 60, 2);
  }
  // strings of deck bulbs across the deck (decor)
  const twinkle = rm ? -1 : Math.floor(t * 3);
  for (let r = 0; r < BULB_ROWS.length; r++) {
    const y = BULB_ROWS[r]!;
    if (y < cy - 20 || y > cy + VIEW_H + 20) continue;
    g.strokeStyle = 'rgba(20,16,40,0.55)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(SHIP_LEFT + 34, y);
    g.quadraticCurveTo(SHIP.cx, y + 26, SHIP_RIGHT - 34, y);
    g.stroke();
    for (let k = 1; k < 24; k++) {
      const u = k / 24;
      const x = SHIP_LEFT + 34 + (SHIP.w - 68) * u;
      const by = y + 26 * 4 * u * (1 - u) * 0.5 + 3;
      g.fillStyle = (k + r + twinkle) % 5 === 0 ? BULB_COOL : BULB_WARM;
      g.fillRect(x - 2.5, by - 2.5, 5, 5);
    }
  }
}
