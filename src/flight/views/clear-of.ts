import { VIEW_H, VIEW_W } from '../../contracts';

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

/** Whether a w × h box at (x, y) misses every one of `obs[0..n)`. */
export function fits(obs: readonly Box[], n: number, x: number, y: number, w: number, h: number): boolean {
  for (let i = 0; i < n; i++) {
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
 */
export function placePills(obs: Box[], n: number, asks: readonly PillAsk[], count: number, outs: readonly { x: number; y: number }[], moved: Uint8Array): void {
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
      if (distance === Infinity) {
        moved[i] = 2;
        continue;
      }
    }
    n = keep(obs, n, o.x, o.y, a);
  }
}

function keep(obs: Box[], n: number, x: number, y: number, a: PillAsk): number {
  const b = obs[n]!;
  b.x = x - 4;
  b.y = y - 4;
  b.w = a.w + 8;
  b.h = a.h + 8;
  return n + 1;
}
