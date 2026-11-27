import { VIEW_H, VIEW_W } from '../../contracts';
import { maxWireOffset } from '../sim';

/** A screen-space rectangle. */
export interface Box { x: number; y: number; w: number; h: number }

/** What a route pill wants (screen space). Callers keep one and refill it each frame. */
export interface PillAsk {
  /** Preferred left edge (already clamped to the screen). */
  x: number;
  /** Its own ring's centre. */
  ringX: number;
  ringY: number;
  /** The pill must still overlap `ringX ± reach` horizontally, so it reads as that ring's label. */
  reach: number;
  /** Pill centre to ring centre, vertically. */
  gap: number;
  /** -1: above the ring, 1: below. */
  side: -1 | 1;
  w: number;
  h: number;
  /** Highest top edge allowed (bottom of the top bar). */
  top: number;
}

const MARGIN = 8;

/** Longest piece of a solid line one pill obstacle covers (px), so a slanted cable doesn't block its whole bounding box. */
export const LINE_PIECE = 60;
/**
 * How far a solid line's drawing reaches past its segment beside its own half width (px): the drawn wires sit up to
 * `maxWireOffset()` off it and bunting flags hang 13 px below them, plus their ink.
 */
export const LINE_DRAWN = maxWireOffset() + 14;
/** Air kept round a solid line beside its own half width (px): its drawing and 4 px more. */
export const LINE_AIR = LINE_DRAWN + 4;

/** Obstacle boxes a solid line of this length needs, at most (size the obstacle list with it). */
export function linePieces(length: number): number {
  return Math.max(1, Math.ceil(length / LINE_PIECE));
}

/**
 * A route pill must not hide a solid line, a wire, bunting or a survey cable a player can bump into (v0.2 council
 * round 2, Opus F2: L12's survey cable sat under the "Bathroom hatch" pill at the launch). Writes boxes covering the
 * on-screen part of the world segment (ax, ay)–(bx, by) into `obs` from `n`, the camera at (camX, camY), and returns
 * the new count. No allocation: `obs` is the view's preallocated list.
 */
export function lineObstacles(obs: Box[], n: number, ax: number, ay: number, bx: number, by: number, half: number, camX: number, camY: number): number {
  const pieces = linePieces(Math.hypot(bx - ax, by - ay));
  const air = half + LINE_AIR;
  for (let k = 0; k < pieces && n < obs.length; k++) {
    const x0 = ax + (bx - ax) * k / pieces - camX;
    const y0 = ay + (by - ay) * k / pieces - camY;
    const x1 = ax + (bx - ax) * (k + 1) / pieces - camX;
    const y1 = ay + (by - ay) * (k + 1) / pieces - camY;
    const left = Math.min(x0, x1) - air;
    const top = Math.min(y0, y1) - air;
    const right = Math.max(x0, x1) + air;
    const bottom = Math.max(y0, y1) + air;
    if (right < 0 || left > VIEW_W || bottom < 0 || top > VIEW_H) continue;
    const b = obs[n++]!;
    b.x = left;
    b.y = top;
    b.w = right - left;
    b.h = bottom - top;
  }
  return n;
}

/** Whether the segment (ax, ay)–(bx, by) passes through the box (screen px). */
export function segmentHitsBox(ax: number, ay: number, bx: number, by: number, b: Box): boolean {
  // Liang–Barsky clip of the segment against the box
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dy = by - ay;
  const edges: [number, number][] = [[-dx, ax - b.x], [dx, b.x + b.w - ax], [-dy, ay - b.y], [dy, b.y + b.h - ay]];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const r = q / p;
    if (p < 0) t0 = Math.max(t0, r);
    else t1 = Math.min(t1, r);
    if (t0 > t1) return false;
  }
  return true;
}

/** Whether a w × h box at (x, y) misses every one of `obs[0..n)` (but `skip`, when given). */
export function fits(obs: readonly Box[], n: number, x: number, y: number, w: number, h: number, skip = -1): boolean {
  for (let i = 0; i < n; i++) {
    if (i === skip) continue;
    const b = obs[i]!;
    if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) return false;
  }
  return true;
}

/** The free left edge nearest `a.x` at height `y` (slides past whatever blocks), or NaN. */
function slide(obs: readonly Box[], n: number, a: PillAsk, y: number): number {
  const { w, h } = a;
  if (y < a.top || y + h > VIEW_H - MARGIN) return NaN;
  const lo = MARGIN;
  const hi = VIEW_W - MARGIN - w;
  // still under/over its ring; never stricter than where it already is (a ring half off screen)
  const near = Math.min(a.x, Math.max(lo, a.ringX - a.reach - w + 1));
  const far = Math.max(a.x, Math.min(hi, a.ringX + a.reach - 1));
  let best = NaN;
  for (let i = -1; i < n; i++) {
    const b = i < 0 ? null : obs[i]!;
    if (b && (y >= b.y + b.h || y + h <= b.y)) continue;
    for (let e = 0; e < (b ? 2 : 1); e++) {
      const x = !b ? a.x : e === 0 ? b.x - MARGIN - w : b.x + b.w + MARGIN;
      if (x < near || x > far || !fits(obs, n, x, y, w, h)) continue;
      if (Number.isNaN(best) || Math.abs(x - a.x) < Math.abs(best - a.x)) best = x;
    }
  }
  return best;
}

/** Past every obstacle in `side`'s direction that a pill at (a.x, y) touches, or NaN when none does. */
function pushed(obs: readonly Box[], n: number, a: PillAsk, y: number, side: -1 | 1): number {
  let next = NaN;
  for (let i = 0; i < n; i++) {
    const b = obs[i]!;
    if (!(a.x < b.x + b.w && a.x + a.w > b.x && y < b.y + b.h && y + a.h > b.y)) continue;
    const v = side < 0 ? b.y - 6 - a.h : b.y + b.h + 6;
    if (Number.isNaN(next) || (side < 0 ? v < next : v > next)) next = v;
  }
  return next;
}

/**
 * Where a route pill goes so it keeps clear of `obs[0..n)`: the HUD boxes under the top bar and
 * every entry ring on screen, its own included. In order: its labelled side, slid left or right
 * when something is in the way; the ring's other side, slid the same way; then each side pushed
 * further out past what it touches (never back across its ring). Nothing clear: where it asked.
 * Writes the top-left corner into `out`; allocates nothing.
 */
export function placePill(obs: readonly Box[], n: number, a: PillAsk, out: { x: number; y: number }): void {
  for (let pass = 0; pass < 2; pass++) {
    const side = pass === 0 ? a.side : -a.side as -1 | 1;
    const y = a.ringY + side * a.gap - a.h / 2;
    const x = slide(obs, n, a, y);
    if (!Number.isNaN(x)) {
      out.x = x;
      out.y = y;
      return;
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    const side = pass === 0 ? a.side : -a.side as -1 | 1;
    let y = a.ringY + side * a.gap - a.h / 2;
    for (let k = 0; k < n; k++) {
      y = pushed(obs, n, a, y, side);
      if (Number.isNaN(y) || y < a.top || y + a.h > VIEW_H - MARGIN) break;
      const x = slide(obs, n, a, y);
      if (!Number.isNaN(x)) {
        out.x = x;
        out.y = y;
        return;
      }
    }
  }
  out.x = a.x;
  out.y = a.ringY + a.side * a.gap - a.h / 2;
}

/**
 * Places `count` route pills at once. Pills whose own spot (`asks[i].x`, on their labelled side)
 * is on screen below the top bar and misses `obs[0..n)` and the pills kept before them stay there; the rest then go where
 * `placePill` finds room round all of those and each other. `obs` needs `count` spare boxes after
 * `n` (they are overwritten). Writes each pill's top-left corner into `outs[i]`; allocates nothing.
 * A pill with no free space is flagged by `moved[i] === 2`.
 * `soft` (v0.2 council round 4, Fable F2) is the index of an obstacle drawn above the pills (the saucer's fuse box):
 * a pill the placement would push past PILL_NEAR gaps, or find no room for, takes its one-gap spot instead when that
 * obstacle is the only thing in the way there.
 */
export function placePills(obs: Box[], n: number, asks: readonly PillAsk[], count: number, outs: readonly { x: number; y: number }[], moved: Uint8Array, soft = -1): void {
  for (let i = 0; i < count; i++) {
    const a = asks[i]!;
    const o = outs[i]!;
    o.x = a.x;
    o.y = a.ringY + a.side * a.gap - a.h / 2;
    moved[i] = o.y >= a.top && o.y + a.h <= VIEW_H - MARGIN && fits(obs, n, o.x, o.y, a.w, a.h) ? 0 : 1;
    if (!moved[i]) n = keep(obs, n, o.x, o.y, a);
  }
  for (let i = 0; i < count; i++) {
    if (!moved[i]) continue;
    const a = asks[i]!;
    const o = outs[i]!;
    placePill(obs, n, a, o);
    if (o.y < a.top || o.y + a.h > VIEW_H - MARGIN || !fits(obs, n, o.x, o.y, a.w, a.h)) {
      // A crowded screen can leave both preferred sides outside the usable area.
      // Try the top of each free band, keeping the closest one to the ring.
      let distance = Infinity;
      for (let j = -1; j < n; j++) {
        const y = j < 0 ? a.top : obs[j]!.y + obs[j]!.h + 6;
        const d = Math.abs(y + a.h / 2 - a.ringY);
        if (d >= distance) continue;
        const x = slide(obs, n, a, y);
        if (!Number.isFinite(x)) continue;
        distance = d;
        o.x = x;
        o.y = y;
      }
      if (distance === Infinity) moved[i] = 2;
    }
    if (soft >= 0 && (moved[i] === 2 || Math.abs(o.y + a.h / 2 - a.ringY) / a.gap > PILL_NEAR) && underSoft(obs, n, a, soft, o)) moved[i] = 1;
    if (moved[i] === 2) continue;
    n = keep(obs, n, o.x, o.y, a);
  }
}

/** A one-gap spot (its labelled side first, at its own x) blocked by nothing but obstacle `soft`: written into `o`. */
function underSoft(obs: readonly Box[], n: number, a: PillAsk, soft: number, o: { x: number; y: number }): boolean {
  for (let pass = 0; pass < 2; pass++) {
    const y = a.ringY + (pass === 0 ? a.side : -a.side) * a.gap - a.h / 2;
    if (y < a.top || y + a.h > VIEW_H - MARGIN || !fits(obs, n, a.x, y, a.w, a.h, soft)) continue;
    o.x = a.x;
    o.y = y;
    return true;
  }
  return false;
}

/** A solid line on screen (px), as the deep view passes it to the pill check. */
export interface PillLine { ax: number; ay: number; bx: number; by: number }

/** A shown pill may sit this many of its gaps from its ring, at most (v0.2 council round 3, Fable F2)... */
export const PILL_FAR = 1.5;
/** ...and a hidden one comes back only under this many, after PILL_HOLD_FRAMES hidden (no flicker at the edge). */
export const PILL_NEAR = 1.3;
export const PILL_HOLD_FRAMES = 30;

function crosses(ax: number, ay: number, bx: number, by: number, l: PillLine): boolean {
  const d = (bx - ax) * (l.by - l.ay) - (by - ay) * (l.bx - l.ax);
  if (d === 0) return false;
  const t = ((l.ax - ax) * (l.by - l.ay) - (l.ay - ay) * (l.bx - l.ax)) / d;
  const u = ((l.ax - ax) * (by - ay) - (l.ay - ay) * (bx - ax)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/**
 * How far a pill placed at top-left (x, y) is from its ring, in pill gaps (vertical, centre to centre), or Infinity
 * when a solid line runs between the ring's centre and the pill's (it would read as the label of whatever is beyond
 * the cable). L12's "Bathroom hatch" pill was pushed 165–310 px off its ring, over the barge (Fable F2).
 */
export function pillReach(a: PillAsk, x: number, y: number, lines: readonly PillLine[], lineCount: number): number {
  const cx = x + a.w / 2;
  const cy = y + a.h / 2;
  const px = Math.min(Math.max(a.ringX, x), x + a.w);
  for (let i = 0; i < lineCount; i++) if (crosses(a.ringX, a.ringY, px, cy, lines[i]!) || crosses(a.ringX, a.ringY, cx, cy, lines[i]!)) return Infinity;
  return Math.abs(cy - a.ringY) / a.gap;
}

/** Whether a pill at `reach` gaps shows, given whether it showed last frame and how many frames it has been hidden. */
export function pillShown(reach: number, wasShown: boolean, hiddenFrames: number): boolean {
  return wasShown ? reach <= PILL_FAR : reach <= PILL_NEAR && hiddenFrames >= PILL_HOLD_FRAMES;
}

function keep(obs: Box[], n: number, x: number, y: number, a: PillAsk): number {
  const b = obs[n]!;
  b.x = x - 4;
  b.y = y - 4;
  b.w = a.w + 8;
  b.h = a.h + 8;
  return n + 1;
}
