// L7 cruise code: the SS Buffet Royale seen from above, and the open sea round it.
//
// The ship runs bow-north down the middle of the map, built from flight/ship_bow_top,
// flight/ship_mid_top (repeated) and flight/ship_stern_top; the sea is flight/ground_sea (shared
// with L5). Every piece has a primitive fallback. The hull is ground: nothing here detects or
// bumps the saucer. Deck bulbs are decor only (no light pools: AGENTS.md tell language).
import type { Assets } from '../contracts';
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
/** Strings of deck bulbs (decor): y of each string across the deck. */
export const BULB_ROWS = [1240, 1760, 2300, 2860] as const;

function sea(g: CanvasRenderingContext2D, assets: Assets, cx: number, cy: number, speckles: Float32Array, viewW: number, viewH: number): void {
  const img = assets.get('flight/ground_sea');
  if (img) {
    const T = 540;
    const x0 = Math.floor(cx / T) * T;
    const y0 = Math.floor(cy / T) * T;
    for (let y = y0; y < cy + viewH; y += T) for (let x = x0; x < cx + viewW; x += T) drawSprite(g, img, x, y, T + 0.5, T + 0.5);
    return;
  }
  g.fillStyle = SEA;
  g.fillRect(cx - 20, cy - 20, viewW + 40, viewH + 40);
  g.fillStyle = SEA_LINE;
  for (let i = 0; i < speckles.length; i += 3) {
    const x = speckles[i]!;
    const y = speckles[i + 1]!;
    if (x < cx - 40 || x > cx + viewW + 10 || y < cy - 10 || y > cy + viewH + 10) continue;
    // Ice wave dashes, drifting slowly
    const r = speckles[i + 2]!;
    g.fillRect(x - 20, y, r * 4, 2);
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

function wake(g: CanvasRenderingContext2D): void {
  // a foam wake trailing south from the stern
  const y0 = SHIP_BOTTOM - 20;
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

function section(g: CanvasRenderingContext2D, assets: Assets, key: string, y: number, h: number, cy: number, viewH: number): boolean {
  if (y > cy + viewH + 20 || y + h < cy - 20) return true;
  const img = assets.get(key);
  if (!img) return false;
  drawSprite(g, img, SHIP_LEFT, y, SHIP.w, h);
  return true;
}

/** Sea, wake and hull: the ground of the ship theme. */
export function drawShipGround(g: CanvasRenderingContext2D, assets: Assets, cx: number, cy: number, speckles: Float32Array, viewW: number, viewH: number): void {
  sea(g, assets, cx, cy, speckles, viewW, viewH);
  if (cy + viewH > SHIP_BOTTOM - 40) wake(g);
  if (cx > SHIP_RIGHT + 40 || cx + viewW < SHIP_LEFT - 40) return;
  // the sprites, where they have loaded; the primitive hull under anything missing
  let all = section(g, assets, 'flight/ship_bow_top', SHIP.bowTop, SHIP.bowH, cy, viewH);
  for (let k = 0; k < SHIP.mids; k++) all = section(g, assets, 'flight/ship_mid_top', SHIP_MID_TOP + k * SHIP.midH, SHIP.midH, cy, viewH) && all;
  all = section(g, assets, 'flight/ship_stern_top', SHIP_STERN_TOP, SHIP.sternH, cy, viewH) && all;
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
    const y1 = Math.min(SHIP_BOTTOM - 80, cy + viewH + 20);
    for (let y = y0; y < y1; y += 36) g.fillRect(SHIP_LEFT + 30, y, SHIP.w - 60, 2);
  }
}
