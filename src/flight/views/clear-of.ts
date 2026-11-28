import { VIEW_H, VIEW_W } from '../../contracts';
import { maxWireOffset, RING_R } from '../sim';

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
  /**
   * Round 5 (Fable): the pill's width with its route name only (no advice), or 0: none. A pill with no room at full width
   * takes this one (L5's "Cold store" ring sits in a wire corner narrower than its full pill).
   */
  short?: number;
  /** Whether it showed short last frame: it then goes back to full width only within PILL_NEAR (no flip-flop). */
  wasShort?: boolean;
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

const NO_LINES: readonly PillLine[] = [];

/**
 * Whether a pill at top-left (x, y) sits across one of `lines[0..lineCount)` from its ring. Round 5 (Fable): such a
 * spot is hidden (`pillReach`), so the placement treats it as taken and tries the next one (L5's "Cold store" ring:
 * the only free spot was across the pier line, and its pill never showed).
 */
function across(a: PillAsk, x: number, y: number, lines: readonly PillLine[], lineCount: number): boolean {
  return lineCount > 0 && pillReach(a, x, y, lines, lineCount) === Infinity;
}

/**
 * The free left edge nearest `a.x` at height `y` (slides past whatever blocks), or NaN. A spot across a solid line from
 * the ring is not free. `skip`: an obstacle to ignore (see `placePills`' `soft`).
 */
function slide(obs: readonly Box[], n: number, a: PillAsk, y: number, lines: readonly PillLine[], lineCount: number, skip = -1): number {
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
    if (b && (i === skip || y >= b.y + b.h || y + h <= b.y)) continue;
    for (let e = 0; e < (b ? 2 : 1); e++) {
      const x = !b ? a.x : e === 0 ? b.x - MARGIN - w : b.x + b.w + MARGIN;
      if (x < near || x > far || !fits(obs, n, x, y, w, h, skip) || across(a, x, y, lines, lineCount)) continue;
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
 * A spot across one of `lines[0..lineCount)` from the ring is not clear (round 5, Fable).
 * Writes the top-left corner into `out`; allocates nothing.
 */
export function placePill(obs: readonly Box[], n: number, a: PillAsk, out: { x: number; y: number }, lines = NO_LINES, lineCount = 0): void {
  for (let pass = 0; pass < 2; pass++) {
    const side = pass === 0 ? a.side : -a.side as -1 | 1;
    const y = a.ringY + side * a.gap - a.h / 2;
    const x = slide(obs, n, a, y, lines, lineCount);
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
      const x = slide(obs, n, a, y, lines, lineCount);
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
 * `lines[0..lineCount)` (round 5, Fable): the solid lines on screen; a spot across one from its ring is not free, so the
 * pill tries the other side or slides along instead of hiding there.
 * `short` (round 5): when given, a moved pill that would hide at full width and fits at `asks[i].short` takes that width
 * (`asks[i].w` and `.x` are rewritten) and is flagged by `short[i] === 1`.
 * `first` (round 5): the pill placed before all the others (the ring the saucer is heading for), or -1.
 */
export function placePills(obs: Box[], n: number, asks: readonly PillAsk[], count: number, outs: readonly { x: number; y: number }[], moved: Uint8Array, soft = -1, lines = NO_LINES, lineCount = 0, short?: Uint8Array, first = -1): void {
  if (first >= count) first = -1;
  for (let k = 0; k < count; k++) {
    const i = nth(k, first);
    const a = asks[i]!;
    const o = outs[i]!;
    o.x = a.x;
    o.y = a.ringY + a.side * a.gap - a.h / 2;
    moved[i] = o.y >= a.top && o.y + a.h <= VIEW_H - MARGIN && fits(obs, n, o.x, o.y, a.w, a.h) && !across(a, o.x, o.y, lines, lineCount) ? 0 : 1;
    if (short) short[i] = 0;
    if (!moved[i]) n = keep(obs, n, o.x, o.y, a);
    // `first` finds its spot before any other pill keeps its own
    else if (k === 0 && first >= 0) n = moveOne(obs, n, a, o, soft, lines, lineCount, moved, short, i);
  }
  for (let k = first >= 0 ? 1 : 0; k < count; k++) {
    const i = nth(k, first);
    if (moved[i]) n = moveOne(obs, n, asks[i]!, outs[i]!, soft, lines, lineCount, moved, short, i);
  }
}

/** Places pill `i`, whose own spot is taken, and keeps its box (see `placePills`); returns the new obstacle count. */
function moveOne(obs: Box[], n: number, a: PillAsk, o: { x: number; y: number }, soft: number, lines: readonly PillLine[], lineCount: number, moved: Uint8Array, short: Uint8Array | undefined, i: number): number {
  moved[i] = placeMoved(obs, n, a, o, soft, lines, lineCount);
  // round 5 (Fable): no room at full width (it would hide), so try its route name alone
  const fullOk = a.wasShort ? PILL_NEAR : PILL_FAR;
  if (short && a.short && a.short < a.w && (moved[i] === 2 || pillReach(a, o.x, o.y, lines, lineCount) > fullOk)) {
    const w = a.w, x = a.x, ox = o.x, oy = o.y, m = moved[i]!;
    a.w = a.short;
    a.x = Math.min(Math.max(a.ringX - a.w / 2, MARGIN), VIEW_W - MARGIN - a.w);
    moved[i] = placeMoved(obs, n, a, o, soft, lines, lineCount);
    if (moved[i] !== 2 && pillReach(a, o.x, o.y, lines, lineCount) <= PILL_FAR) short[i] = 1;
    else {
      a.w = w;
      a.x = x;
      o.x = ox;
      o.y = oy;
      moved[i] = m;
    }
  }
  return moved[i] === 2 ? n : keep(obs, n, o.x, o.y, a);
}

/** The k-th pill to place: `first` comes first (when ≥ 0), then the others in order. */
function nth(k: number, first: number): number {
  return first < 0 || k > first ? k : k === 0 ? first : k - 1;
}

/** Places a pill whose own spot is taken (see `placePills`): 1, or 2 when nothing on screen is free. */
function placeMoved(obs: readonly Box[], n: number, a: PillAsk, o: { x: number; y: number }, soft: number, lines: readonly PillLine[], lineCount: number): 1 | 2 {
  let moved: 1 | 2 = 1;
  placePill(obs, n, a, o, lines, lineCount);
  if (o.y < a.top || o.y + a.h > VIEW_H - MARGIN || !fits(obs, n, o.x, o.y, a.w, a.h) || across(a, o.x, o.y, lines, lineCount)) {
    // A crowded screen can leave both preferred sides outside the usable area.
    // Try the top of each free band, keeping the closest one to the ring.
    let distance = Infinity;
    for (let j = -1; j < n; j++) {
      const y = j < 0 ? a.top : obs[j]!.y + obs[j]!.h + 6;
      const d = Math.abs(y + a.h / 2 - a.ringY);
      if (d >= distance) continue;
      const x = slide(obs, n, a, y, lines, lineCount);
      if (!Number.isFinite(x)) continue;
      distance = d;
      o.x = x;
      o.y = y;
    }
    if (distance === Infinity) moved = 2;
  }
  if (soft >= 0 && (moved === 2 || Math.abs(o.y + a.h / 2 - a.ringY) / a.gap > PILL_NEAR) && underSoft(obs, n, a, soft, o, lines, lineCount)) moved = 1;
  return moved;
}

/**
 * A one-gap spot (its labelled side first) blocked by nothing but obstacle `soft`, slid along like any other spot
 * (round 5, Fable: it tried the pill's own x only) and never across a solid line from its ring: written into `o`.
 */
function underSoft(obs: readonly Box[], n: number, a: PillAsk, soft: number, o: { x: number; y: number }, lines: readonly PillLine[], lineCount: number): boolean {
  for (let pass = 0; pass < 2; pass++) {
    const y = a.ringY + (pass === 0 ? a.side : -a.side) * a.gap - a.h / 2;
    const x = slide(obs, n, a, y, lines, lineCount, soft);
    if (Number.isNaN(x)) continue;
    o.x = x;
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

/**
 * Round 7 (Fable finding 3): a held pill (`EntryLabels.place`) keeps its last spot in world space, so the camera can carry
 * it off screen, under the top bar, under a HUD box or onto another held pill. Instead of hiding it there at once (a
 * 2–28 frame flash), this moves `box` (the pill's screen box, without air) to the nearest spot inside the screen and below
 * `a.top` that misses `obs[0..n)` (but `soft`), still under or over its ring (`a.reach`), within PILL_FAR gaps of it and
 * on its side of every one of `lines[0..lineCount)`. `obs[ringsFrom, ringsTo)` are ring boxes (RING_R and 8 px of air):
 * the held pill may come into a ring's air but never over its disc. In order: at its width, then at `a.short` (route name
 * only); 8 px inside the screen, then flush with its edge; the spot pulled inside the screen or that spot mirrored to the
 * ring's other side, each also moved to every side of each obstacle it meets. Writes the spot and width into `box`, or
 * returns false and leaves it as it was when none is free. Rewrites `a.w`. Allocates nothing.
 */
export function refitHeld(obs: readonly Box[], n: number, soft: number, a: PillAsk, box: Box, lines = NO_LINES, lineCount = 0, ringsFrom = n, ringsTo = n): boolean {
  const h = box.h;
  for (let pass = 0; pass < 4; pass++) {
    const w = pass < 2 ? box.w : a.short ?? 0;
    if (pass >= 2 && !(w > 0 && w < box.w)) break;
    const m = pass % 2 === 0 ? MARGIN : 0;
    // the short pill sits centred on its ring, as `placePills` puts it
    const bx = pass < 2 ? box.x : a.ringX - w / 2;
    let bestX = NaN, bestY = NaN, best = Infinity;
    for (let base = 0; base < 2; base++) {
      const x0 = bx < 0 || bx + w > VIEW_W ? clampX(bx, w, m) : bx;
      const by = base === 0 ? box.y : 2 * a.ringY - box.y - h;
      const y0 = by < a.top || by + h > VIEW_H ? clampY(by, h, a.top, m) : by;
      for (let j = -1; j < n; j++) {
        const o = j < 0 ? null : obs[j]!;
        if (o && (j === soft || !hits(obs, j, x0, y0, w, h, ringsFrom, ringsTo))) continue;
        for (let e = 0; e < (o ? 4 : 1); e++) {
          const x = !o || e > 1 ? x0 : clampX(e === 0 ? o.x - w - 0.5 : o.x + o.w + 0.5, w, m);
          const y = !o || e < 2 ? y0 : clampY(e === 2 ? o.y - h - 0.5 : o.y + o.h + 0.5, h, a.top, m);
          const d = (x - bx) ** 2 + (y - box.y) ** 2;
          if (d >= best || x < 0 || x + w > VIEW_W || y < a.top || y + h > VIEW_H) continue;
          if (x >= a.ringX + a.reach || x + w <= a.ringX - a.reach || !heldClear(obs, 0, n, soft, x, y, w, h, ringsFrom, ringsTo)) continue;
          a.w = w;
          if (pillReach(a, x, y, lines, lineCount) > PILL_FAR) continue;
          best = d;
          bestX = x;
          bestY = y;
        }
      }
    }
    if (best === Infinity) continue;
    box.x = bestX;
    box.y = bestY;
    box.w = w;
    return true;
  }
  return false;
}

/** Whether a w × h box at (x, y) meets obstacle `j`: a ring's disc (RING_R + 2) for a ring box, else the box. */
function hits(obs: readonly Box[], j: number, x: number, y: number, w: number, h: number, ringsFrom: number, ringsTo: number): boolean {
  const o = obs[j]!;
  if (!(x < o.x + o.w && x + w > o.x && y < o.y + o.h && y + h > o.y)) return false;
  if (j < ringsFrom || j >= ringsTo) return true;
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
  const dx = cx - Math.min(Math.max(cx, x), x + w), dy = cy - Math.min(Math.max(cy, y), y + h);
  return dx * dx + dy * dy < (RING_R + 2) ** 2;
}

/** Whether a w × h box at (x, y) misses every one of `obs[from..n)` but `soft`, the ring boxes as discs (see `refitHeld`). */
export function heldClear(obs: readonly Box[], from: number, n: number, soft: number, x: number, y: number, w: number, h: number, ringsFrom: number, ringsTo: number): boolean {
  for (let j = from; j < n; j++) if (j !== soft && hits(obs, j, x, y, w, h, ringsFrom, ringsTo)) return false;
  return true;
}

function clampX(x: number, w: number, m: number): number {
  return Math.min(Math.max(x, m), VIEW_W - m - w);
}

function clampY(y: number, h: number, top: number, m: number): number {
  return Math.min(Math.max(y, top), VIEW_H - m - h);
}

function keep(obs: Box[], n: number, x: number, y: number, a: PillAsk): number {
  const b = obs[n]!;
  b.x = x - 4;
  b.y = y - 4;
  b.w = a.w + 8;
  b.h = a.h + 8;
  return n + 1;
}
