// Vector shapes for Pixi scenes. Pixi re-tessellates a Graphics whenever its path changes, which is
// several times dearer than Canvas 2D per shape, so the rule is: build geometry once and move,
// tint, fade or hide the object each frame. `Shape` rebuilds only when its key changes.
import { Graphics, Texture } from 'pixi.js';
import { C } from '../../ui/theme';

/**
 * A Graphics that redraws only when `key` changes. Build the key from the inputs that change the
 * geometry (rounded to what is visible: 0.5 px, 1°), never from time.
 *
 *   this.bar.draw(Math.round(fillW * 2), (g) => g.roundRect(0, 0, fillW, 18, 9).fill(C.mint));
 */
/**
 * A `Shape` leaves its batch when it redraws often: three redraws on three frames within
 * SOLO_WINDOW_MS (an arc that fills, a swinging tell). One that settles for QUIET_MS goes back in.
 */
const SOLO_WINDOW_MS = 1000;
const QUIET_MS = 2500;

/** Render clock the shapes read (ms), advanced once per frame by the render host. */
let clock = 0;

/** Called by the render host before each render. Tests that never render keep the clock at 0. */
export function tickShapeClock(nowMs: number): void {
  clock = nowMs;
}

/** True when every fill and stroke of `g` is a plain colour. */
function untextured(g: Graphics): boolean {
  for (const step of g.context.instructions) {
    if (step.action === 'texture') return false;
    const style = (step.data as { style?: { texture?: Texture } }).style;
    if (style?.texture && style.texture !== Texture.WHITE) return false;
  }
  return true;
}

export class Shape extends Graphics {
  /**
   * Set to false for a shape that should stay batched however often it redraws: a rebuild of its
   * render group is cheap there, or it is rarely on screen, and one draw call of its own isn't.
   */
  canGoSolo = true;
  private key: number | string | undefined;
  /** The key `stale()` last reported as new: `redraw` builds for it. */
  private pending: number | string | undefined;
  /** Clock at the last redraw and the one before it. */
  private last = -Infinity;
  private before = -Infinity;
  private solo = false;

  /**
   * True when `draw(key, …)` would rebuild; `redraw(build)` then rebuilds for that key. A view that draws every
   * frame asks first, so its build closure is only made when the geometry changes (v0.2 council R2: no per-frame
   * closures, tests/shell-hot-alloc.test.ts):
   *
   *   if (this.bar.stale(keyOf(fillW))) this.bar.redraw((g) => g.roundRect(0, 0, fillW, 18, 9).fill(C.mint));
   */
  stale(key: number | string): boolean {
    if (key !== this.key) {
      this.pending = key;
      return true;
    }
    // settled: back into the batch (one rebuild now saves a draw call every frame after)
    if (this.solo && clock - this.last > QUIET_MS) {
      this.solo = false;
      this.context.batchMode = 'auto';
      // same geometry, but Pixi must rebuild the gpu context to see the new batch mode
      (this.context as unknown as { onUpdate(): void }).onUpdate();
    }
    return false;
  }

  draw(key: number | string, build: (g: Graphics) => void): this {
    return this.stale(key) ? this.redraw(build) : this;
  }

  /** Rebuild for the key the last `stale()` call reported as new. */
  redraw(build: (g: Graphics) => void): this {
    this.key = this.pending;
    this.clear();
    build(this);
    // When a batched Graphics changes geometry, Pixi rebuilds every batch of its render group on the
    // next render. A shape that keeps changing is drawn on its own instead: one more draw call, and
    // its redraws stop rebuilding the whole scene. A shape that only redrew a few times (a layout, a
    // language switch) stays batched: a draw call every frame for nothing is the dearer trade. Not
    // one with a texture or gradient fill: Pixi would warn when the scene frees it while still bound.
    const now = clock;
    if (!this.solo && this.canGoSolo && now - this.before <= SOLO_WINDOW_MS && this.before < this.last && this.last < now && untextured(this)) {
      this.solo = true;
      this.context.batchMode = 'no-batch';
    }
    this.before = this.last;
    this.last = now;
    return this;
  }

  /** Forget the key so the next `draw` rebuilds (after a language or art change). */
  invalidate(): void {
    this.key = undefined;
  }
}

/**
 * Keep a Graphics in its batch past Pixi's automatic limit (200 vertices: one stroked circle).
 * Above it Pixi draws the Graphics on its own and splits the batch around it, three draw calls
 * where one would do. Use it for small static shapes: a batched Graphics that moves has its
 * vertices re-packed on the CPU, which only stays cheap while there are a few hundred of them.
 */
export function batched<T extends Graphics>(g: T): T {
  g.context.batchMode = 'batch';
  return g;
}

/**
 * A numeric key for `Shape.draw` from up to eight geometry inputs, without allocating. Values are
 * rounded to 1/4 unit first (pass angles in degrees or pre-scaled), so sub-pixel jitter does not
 * rebuild. A 32-bit hash: a collision (a missed rebuild) is a one-in-billions event per change.
 */
export function keyOf(a: number, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0): number {
  // FNV-1a over the rounded inputs, kept to 32 bits so it stays exact
  let k = 0x811c9dc5;
  k = Math.imul(k ^ Math.round(a * 4), 16777619);
  k = Math.imul(k ^ Math.round(b * 4), 16777619);
  k = Math.imul(k ^ Math.round(c * 4), 16777619);
  k = Math.imul(k ^ Math.round(d * 4), 16777619);
  k = Math.imul(k ^ Math.round(e * 4), 16777619);
  k = Math.imul(k ^ Math.round(f * 4), 16777619);
  k = Math.imul(k ^ Math.round(g * 4), 16777619);
  return Math.imul(k ^ Math.round(h * 4), 16777619) >>> 0;
}

/** Corner radius clamped to the box, as the Canvas 2D `roundRectPath` did. */
export function clampRadius(w: number, h: number, r: number): number {
  return Math.max(0, Math.min(r, w / 2, h / 2));
}

/** Rounded rectangle path (no fill) with the radius clamped to the box. */
export function roundRect(g: Graphics, x: number, y: number, w: number, h: number, r: number): Graphics {
  return g.roundRect(x, y, w, h, clampRadius(w, h, r));
}

export interface PanelLook {
  fill: string;
  /** Corner radius (default 22). */
  r?: number;
  /** Outline colour, or null for none (default ink). */
  stroke?: string | null;
  /** Outline width (default 4). */
  lineW?: number;
  /** Drop-shadow offset below the panel (default 6, 0 = none). */
  shadow?: number;
}

/** The menu panel: drop shadow, rounded fill and ink outline (the old `panel` helper), at (x, y). */
export function panelPath(g: Graphics, x: number, y: number, w: number, h: number, look: PanelLook): Graphics {
  const r = clampRadius(w, h, look.r ?? 22);
  const shadow = look.shadow ?? 6;
  if (shadow > 0) g.roundRect(x, y + shadow, w, h, r).fill('rgba(5,3,20,0.45)');
  g.roundRect(x, y, w, h, r).fill(look.fill);
  const stroke = look.stroke === undefined ? C.ink : look.stroke;
  if (stroke) g.stroke({ color: stroke, width: look.lineW ?? 4 });
  return g;
}

/** Thin inner highlight along the top edge of a panel at (x, y, w) with corner radius r. */
export function panelHighlightPath(g: Graphics, x: number, y: number, w: number, r = 22, alpha = 0.14): Graphics {
  return g.moveTo(x + r, y + 5).lineTo(x + w - r, y + 5).stroke({ color: '#ffffff', alpha, width: 2, cap: 'round' });
}

/** Five-point star path centred on (cx, cy). */
export function starPath(g: Graphics, cx: number, cy: number, r: number): Graphics {
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  return g.closePath();
}

/**
 * Elliptical arc path from angle a0 to a1 (radians, clockwise in screen space like Canvas 2D's
 * `ellipse`), as a polyline: Pixi only has whole ellipses. Starts with a moveTo unless `join`.
 */
export function ellipseArc(g: Graphics, cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, join = false): Graphics {
  let span = a1 - a0;
  if (span <= 0) span += Math.PI * 2;
  const steps = Math.max(8, Math.ceil((span / (Math.PI * 2)) * 48));
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (span * i) / steps;
    const x = cx + Math.cos(a) * rx;
    const y = cy + Math.sin(a) * ry;
    if (i === 0 && !join) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  return g;
}
