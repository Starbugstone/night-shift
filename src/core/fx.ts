// Shared drawing effects: vignette, cached glows and soft shadows, and one pooled particle system.
// Everything here is allocation-free per frame: canvases and gradients are built once and cached,
// particles live in fixed typed arrays.
import { VIEW_H, VIEW_W } from '../contracts';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- vignette / edge tints

const edges = new Map<string, HTMLCanvasElement>();

/** Quarter-size canvas: clear in the middle, `rgb` towards the corners. */
function edgeCanvas(rgb: string, mid: number, edge: number): HTMLCanvasElement | null {
  const key = `${rgb}|${mid}|${edge}`;
  let c = edges.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = VIEW_W / 4;
  c.height = VIEW_H / 4;
  const v = c.getContext('2d');
  if (!v) return null;
  const grad = v.createRadialGradient(c.width / 2, c.height * 0.46, c.height * 0.24, c.width / 2, c.height / 2, c.height * 0.68);
  grad.addColorStop(0, `rgba(${rgb},0)`);
  grad.addColorStop(0.6, `rgba(${rgb},${mid})`);
  grad.addColorStop(1, `rgba(${rgb},${edge})`);
  v.fillStyle = grad;
  v.fillRect(0, 0, c.width, c.height);
  edges.set(key, c);
  return c;
}

/** Soft dark corners over the whole view. Built once at quarter size, then stretched. */
export function drawVignette(g: CanvasRenderingContext2D, strength = 1): void {
  const c = edgeCanvas('8,5,26', 0.2, 0.62);
  if (!c) return;
  const alpha = g.globalAlpha;
  g.globalAlpha = alpha * strength;
  g.drawImage(c, 0, 0, VIEW_W, VIEW_H);
  g.globalAlpha = alpha;
}

/** Coloured pulse around the screen edge (wake-up alarm, lock-on, delivery). */
export function drawEdgeTint(g: CanvasRenderingContext2D, rgb: string, strength: number): void {
  if (strength <= 0.01) return;
  const c = edgeCanvas(rgb, 0.16, 0.7);
  if (!c) return;
  const alpha = g.globalAlpha;
  g.globalAlpha = alpha * Math.min(1, strength);
  g.drawImage(c, 0, 0, VIEW_W, VIEW_H);
  g.globalAlpha = alpha;
}

// ---------------------------------------------------------------- glows

const radials = new Map<string, HTMLCanvasElement | null>();

/**
 * Cached radial-gradient sprite (centre → edge colour stops). Filling a big radial gradient
 * every frame is one of the most expensive things Canvas 2D can do; stretching a small bitmap
 * of the same gradient looks identical and costs a fraction.
 */
export function radialSprite(id: string, stops: readonly (readonly [number, string])[], size = 128): HTMLCanvasElement | null {
  const hit = radials.get(id);
  if (hit !== undefined) return hit;
  let c: HTMLCanvasElement | null = document.createElement('canvas');
  c.width = c.height = size;
  const v = c.getContext('2d');
  if (v) {
    const grad = v.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [at, color] of stops) grad.addColorStop(at, color);
    v.fillStyle = grad;
    v.fillRect(0, 0, size, size);
  } else c = null;
  radials.set(id, c);
  return c;
}

/** A pool of light: `alpha` at the centre, 40 % of that half-way out, nothing at the rim. */
export function lightSprite(rgb: string, alpha: number): HTMLCanvasElement | null {
  return radialSprite(`light|${rgb}|${alpha}`, [
    [0, `rgba(${rgb},${alpha})`],
    [0.5, `rgba(${rgb},${alpha * 0.4})`],
    [1, `rgba(${rgb},0)`],
  ]);
}

export const GLOW = {
  mint: '124,255,203',
  amber: '255,210,122',
  warm: '255,189,104',
  white: '255,255,255',
  red: '255,93,115',
  pink: '255,110,210',
  dark: '6,4,22',
  cold: '200,222,255',
  lamp: '255,226,150',
  dawn: '255,160,92',
} as const;

const solids = new Map<string, string>();

/** `rgb(r,g,b)` for one of the "r,g,b" triplets used here, built once (no per-frame strings). */
export function rgbOf(rgb: string): string {
  let s = solids.get(rgb);
  if (!s) {
    s = `rgb(${rgb})`;
    solids.set(rgb, s);
  }
  return s;
}

function glowSprite(rgb: string): HTMLCanvasElement | null {
  return radialSprite(`glow|${rgb}`, [
    [0, `rgba(${rgb},1)`],
    [0.35, `rgba(${rgb},0.55)`],
    [0.7, `rgba(${rgb},0.16)`],
    [1, `rgba(${rgb},0)`],
  ], 96);
}

/**
 * Soft blob of light (or shadow, with `GLOW.dark`) as one cached drawImage. Uses the current
 * composite mode, so set `lighter` first for additive light.
 */
export function drawGlow(g: CanvasRenderingContext2D, rgb: string, x: number, y: number, rx: number, ry = rx, alpha = 1): void {
  if (alpha <= 0.004) return;
  const c = glowSprite(rgb);
  if (!c) return;
  const a = g.globalAlpha;
  g.globalAlpha = a * Math.min(1, alpha);
  g.drawImage(c, x - rx, y - ry, rx * 2, ry * 2);
  g.globalAlpha = a;
}

// ---------------------------------------------------------------- soft silhouette shadows

const SHADOW_PAD = 8;
/** Per image, per draw size (w * 8192 + h): no string keys, so lookups don't allocate. */
const shadows = new WeakMap<HTMLImageElement, Map<number, HTMLCanvasElement | null>>();

/**
 * Soft drop shadow of a sprite: its silhouette tinted night-blue at quarter resolution (the
 * upscale blurs the edge). Draw with `drawShadow`. Null until the image is usable.
 */
function shadowSprite(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement | null {
  let sized = shadows.get(img);
  if (!sized) {
    sized = new Map();
    shadows.set(img, sized);
  }
  const id = Math.round(w) * 8192 + Math.round(h);
  const hit = sized.get(id);
  if (hit !== undefined) return hit;
  let c: HTMLCanvasElement | null = null;
  try {
    c = document.createElement('canvas');
    c.width = Math.ceil((w + SHADOW_PAD * 2) / 4);
    c.height = Math.ceil((h + SHADOW_PAD * 2) / 4);
    const v = c.getContext('2d');
    if (!v) throw new Error('no 2d');
    v.drawImage(img, SHADOW_PAD / 4, SHADOW_PAD / 4, w / 4, h / 4);
    v.globalCompositeOperation = 'source-in';
    v.fillStyle = '#07051a';
    v.fillRect(0, 0, c.width, c.height);
  } catch {
    c = null;
  }
  sized.set(id, c);
  return c;
}

/** Shadow for a sprite drawn centred on the origin into w×h (call inside the sprite's transform). */
export function drawShadow(g: CanvasRenderingContext2D, img: HTMLImageElement | undefined, w: number, h: number, alpha = 0.3): void {
  if (!img) return;
  const c = shadowSprite(img, w, h);
  if (!c) return;
  const a = g.globalAlpha;
  g.globalAlpha = a * alpha;
  g.drawImage(c, -w / 2 - SHADOW_PAD, -h / 2 - SHADOW_PAD, c.width * 4, c.height * 4);
  g.globalAlpha = a;
}

// ---------------------------------------------------------------- pre-rasterised sprites

/**
 * Device px per logical px that sprite bitmaps are kept at. The canvas host sets it to the
 * backing store's own scale, so a cached sprite blits 1:1 (no resampling) at any screen size.
 */
let bitmapScale = 2;
/** Don't cache anything bigger than this many bitmap pixels (a 540x540 tile at 3x is 2.6 M). */
const BITMAP_MAX_PX = 3_000_000;
let bitmaps = new WeakMap<HTMLImageElement, Map<number, HTMLCanvasElement | null>>();

/** Called when the canvas is (re)sized. A new scale drops every cached bitmap. */
export function setBitmapScale(k: number): void {
  const next = Math.max(0.5, Math.min(3, k));
  if (Math.abs(next - bitmapScale) < 0.0005) return;
  bitmapScale = next;
  bitmaps = new WeakMap();
}

/** Bitmap px per logical px of everything `bitmapOf` returns. */
export function bitmapPx(): number {
  return bitmapScale;
}

/**
 * A sprite's bitmap at its draw size. Browsers replay an SVG image as vectors on every
 * drawImage; a big map draws dozens of them a frame, so each (image, size) is rasterised once
 * and blitted from then on. The image fills (0, 0, w, h) x `bitmapPx()` of the canvas, which is
 * rounded up to whole pixels. Null when the image is too big to cache or cannot be drawn.
 */
export function bitmapOf(img: HTMLImageElement, w: number, h: number, opaque = false): HTMLCanvasElement | null {
  let sized = bitmaps.get(img);
  if (!sized) {
    sized = new Map();
    bitmaps.set(img, sized);
  }
  const id = Math.round(w * 4) * 16384 + Math.round(h * 4);
  const hit = sized.get(id);
  if (hit !== undefined) return hit;
  let c: HTMLCanvasElement | null = null;
  const bw = Math.ceil(w * bitmapScale);
  const bh = Math.ceil(h * bitmapScale);
  if (bw > 0 && bh > 0 && bw * bh <= BITMAP_MAX_PX && typeof document !== 'undefined') {
    try {
      c = document.createElement('canvas');
      c.width = bw;
      c.height = bh;
      // a tile with no see-through pixels can be copied without blending
      const v = c.getContext('2d', { alpha: !opaque });
      if (!v) throw new Error('no 2d');
      v.drawImage(img, 0, 0, w * bitmapScale, h * bitmapScale);
    } catch {
      c = null;
    }
  }
  sized.set(id, c);
  return c;
}

/** drawImage(img, x, y, w, h) through the bitmap cache. `opaque`: the art covers its whole box. */
export function drawSprite(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, opaque = false): void {
  const c = bitmapOf(img, w, h, opaque);
  // drawn at the bitmap's own size, so an unrotated sprite maps pixel for pixel
  if (c) g.drawImage(c, x, y, c.width / bitmapScale, c.height / bitmapScale);
  else g.drawImage(img, x, y, w, h);
}

// ---------------------------------------------------------------- directional washes

const washes = new Map<string, HTMLCanvasElement | null>();

/**
 * Screen-wide linear wash (dawn light, a searchlight sweep): nothing at (x0, y0), `rgb` at full
 * alpha at (x1, y1), both in 0..1 of the view. Cached as a tiny bitmap and stretched.
 */
export function drawWash(g: CanvasRenderingContext2D, rgb: string, x0: number, y0: number, x1: number, y1: number, alpha: number): void {
  if (alpha <= 0.004) return;
  const key = `${rgb}|${x0}|${y0}|${x1}|${y1}`;
  let c = washes.get(key);
  if (c === undefined) {
    c = document.createElement('canvas');
    c.width = 36;
    c.height = 64;
    const v = c.getContext('2d');
    if (v) {
      const grad = v.createLinearGradient(x0 * 36, y0 * 64, x1 * 36, y1 * 64);
      grad.addColorStop(0, `rgba(${rgb},0)`);
      grad.addColorStop(0.55, `rgba(${rgb},0.38)`);
      grad.addColorStop(1, `rgba(${rgb},1)`);
      v.fillStyle = grad;
      v.fillRect(0, 0, 36, 64);
    } else c = null;
    washes.set(key, c);
  }
  if (!c) return;
  const a = g.globalAlpha;
  g.globalAlpha = a * Math.min(1, alpha);
  g.drawImage(c, 0, 0, VIEW_W, VIEW_H);
  g.globalAlpha = a;
}

// ---------------------------------------------------------------- cached static layer

/**
 * A snapshot of something that never changes (an SVG backdrop, static walls), kept at the
 * canvas's own pixel size and blitted 1:1 each frame. Browsers re-paint SVG images as vectors on
 * every drawImage, so a full-screen backdrop is far cheaper as one bitmap copy. The snapshot is
 * rebuilt if the canvas is resized.
 */
export class CachedLayer {
  private canvas: HTMLCanvasElement | null = null;

  /** `paint` draws the layer in logical units; it only runs when the snapshot is (re)built. */
  draw(g: CanvasRenderingContext2D, paint: (layer: CanvasRenderingContext2D) => void): void {
    const target = g.canvas;
    let c = this.canvas;
    if (!c || c.width !== target.width || c.height !== target.height) {
      c ??= document.createElement('canvas');
      c.width = target.width;
      c.height = target.height;
      const layer = c.getContext('2d');
      if (!layer) {
        paint(g);
        return;
      }
      layer.setTransform(g.getTransform());
      paint(layer);
      this.canvas = c;
    }
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(c, 0, 0);
    g.restore();
  }
}

// ---------------------------------------------------------------- easing

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function easeOutCubic(t: number): number {
  const x = 1 - clamp01(t);
  return 1 - x * x * x;
}

export function easeInCubic(t: number): number {
  const x = clamp01(t);
  return x * x * x;
}

/** Overshooting ease for pop-ins. */
export function easeOutBack(t: number, overshoot = 1.70158): number {
  const x = clamp01(t) - 1;
  return 1 + (overshoot + 1) * x * x * x + overshoot * x * x;
}

/** 0 → 1 → 0 bump over t in 0..1 (fast up, slow down). */
export function bump(t: number): number {
  const x = clamp01(t);
  return Math.sin(Math.PI * Math.sqrt(x));
}

// ---------------------------------------------------------------- particles

export const P_STAR = 0;
export const P_PUFF = 1;
export const P_SPARK = 2;
export const P_RING = 3;
export const P_TWINKLE = 4;
export type ParticleKind = typeof P_STAR | typeof P_PUFF | typeof P_SPARK | typeof P_RING | typeof P_TWINKLE;

/** Particle colours, by index (strings are built once). */
export const PC = {
  amber: 0,
  mint: 1,
  white: 2,
  red: 3,
  dust: 4,
  paper: 5,
  inkGreen: 6,
  inkRed: 7,
  pink: 8,
  sweat: 9,
  soot: 10,
  lilac: 11,
} as const;
const COLORS = ['#FFD27A', '#7CFFCB', '#ffffff', '#FF5D73', '#d9ccc0', '#F4EFE2', '#1f9a6c', '#d33a52', '#ff7ad9', '#a8dcff', '#3a3348', '#c8a4ff'] as const;
const OUTLINE = '#1b1433';

// unit 5-point star, precomputed
const STAR_X = new Float32Array(10);
const STAR_Y = new Float32Array(10);
for (let i = 0; i < 10; i++) {
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  const r = i % 2 === 0 ? 1 : 0.46;
  STAR_X[i] = Math.cos(a) * r;
  STAR_Y[i] = Math.sin(a) * r;
}

/**
 * Fixed-size particle pool. Spawning past the cap recycles the oldest slot; nothing is
 * allocated after construction. Coordinates are whatever space you draw it in.
 */
export class Particles {
  private readonly kind: Uint8Array;
  private readonly color: Uint8Array;
  private readonly x: Float32Array;
  private readonly y: Float32Array;
  private readonly vx: Float32Array;
  private readonly vy: Float32Array;
  private readonly life: Float32Array;
  private readonly span: Float32Array;
  private readonly size: Float32Array;
  private readonly rot: Float32Array;
  private readonly spin: Float32Array;
  private readonly grav: Float32Array;
  private readonly drag: Float32Array;
  /** Homing target (delivery sparkles); pull 0 = none. */
  private readonly tx: Float32Array;
  private readonly ty: Float32Array;
  private readonly pull: Float32Array;
  private cursor = 0;
  private live = 0;
  private seed = 9973;

  constructor(readonly cap = 96) {
    this.kind = new Uint8Array(cap);
    this.color = new Uint8Array(cap);
    this.x = new Float32Array(cap);
    this.y = new Float32Array(cap);
    this.vx = new Float32Array(cap);
    this.vy = new Float32Array(cap);
    this.life = new Float32Array(cap);
    this.span = new Float32Array(cap);
    this.size = new Float32Array(cap);
    this.rot = new Float32Array(cap);
    this.spin = new Float32Array(cap);
    this.grav = new Float32Array(cap);
    this.drag = new Float32Array(cap);
    this.tx = new Float32Array(cap);
    this.ty = new Float32Array(cap);
    this.pull = new Float32Array(cap);
  }

  get active(): number {
    return this.live;
  }

  /** Cheap deterministic 0..1 (visual only). */
  rnd(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  clear(): void {
    this.life.fill(0);
    this.live = 0;
  }

  spawn(kind: ParticleKind, x: number, y: number, vx: number, vy: number, life: number, size: number, color: number, grav = 0, drag = 0, spin = 0): number {
    const i = this.cursor;
    this.cursor = (i + 1) % this.cap;
    if (this.life[i]! <= 0) this.live++;
    this.kind[i] = kind;
    this.color[i] = color;
    this.x[i] = x;
    this.y[i] = y;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.life[i] = life;
    this.span[i] = life;
    this.size[i] = size;
    this.rot[i] = this.rnd() * TAU;
    this.spin[i] = spin;
    this.grav[i] = grav;
    this.drag[i] = drag;
    this.pull[i] = 0;
    return i;
  }

  /** `count` particles thrown outward in an arc (default: all round). */
  burst(
    kind: ParticleKind, x: number, y: number, count: number,
    speedMin: number, speedMax: number, life: number, size: number, color: number,
    grav = 0, drag = 0, angle = 0, arc = TAU,
  ): void {
    for (let n = 0; n < count; n++) {
      const a = angle + (arc === TAU ? (n + this.rnd() * 0.7) / count : this.rnd() - 0.5) * arc;
      const sp = speedMin + (speedMax - speedMin) * this.rnd();
      this.spawn(kind, x, y, Math.cos(a) * sp, Math.sin(a) * sp, life * (0.75 + this.rnd() * 0.5), size * (0.75 + this.rnd() * 0.5), color, grav, drag, (this.rnd() - 0.5) * 9);
    }
  }

  /** Make the particle spawned as `index` steer towards a point (used for the slurp). */
  home(index: number, tx: number, ty: number, pull: number): void {
    this.tx[index] = tx;
    this.ty[index] = ty;
    this.pull[index] = pull;
  }

  update(dt: number): void {
    if (this.live === 0) return;
    let live = 0;
    for (let i = 0; i < this.cap; i++) {
      let life = this.life[i]!;
      if (life <= 0) continue;
      life -= dt;
      this.life[i] = life;
      if (life <= 0) continue;
      live++;
      const pull = this.pull[i]!;
      if (pull > 0) {
        this.vx[i] = this.vx[i]! + (this.tx[i]! - this.x[i]!) * pull * dt;
        this.vy[i] = this.vy[i]! + (this.ty[i]! - this.y[i]!) * pull * dt;
      }
      const drag = this.drag[i]!;
      if (drag > 0) {
        const f = 1 - Math.min(1, drag * dt);
        this.vx[i] = this.vx[i]! * f;
        this.vy[i] = this.vy[i]! * f;
      }
      this.vy[i] = this.vy[i]! + this.grav[i]! * dt;
      this.x[i] = this.x[i]! + this.vx[i]! * dt;
      this.y[i] = this.y[i]! + this.vy[i]! * dt;
      this.rot[i] = this.rot[i]! + this.spin[i]! * dt;
    }
    this.live = live;
  }

  draw(g: CanvasRenderingContext2D): void {
    if (this.live === 0) return;
    const alpha = g.globalAlpha;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    for (let i = 0; i < this.cap; i++) {
      const life = this.life[i]!;
      if (life <= 0) continue;
      const k = 1 - life / this.span[i]!; // 0 → 1 over the particle's life
      const x = this.x[i]!;
      const y = this.y[i]!;
      const size = this.size[i]!;
      const color = COLORS[this.color[i]!]!;
      switch (this.kind[i]) {
        case P_STAR: {
          // pop in, hold, shrink away
          const s = size * (k < 0.18 ? k / 0.18 : k > 0.6 ? (1 - k) / 0.4 : 1);
          if (s < 0.4) break;
          const c = Math.cos(this.rot[i]!) * s;
          const sn = Math.sin(this.rot[i]!) * s;
          g.beginPath();
          for (let p = 0; p < 10; p++) {
            const px = x + STAR_X[p]! * c - STAR_Y[p]! * sn;
            const py = y + STAR_X[p]! * sn + STAR_Y[p]! * c;
            if (p === 0) g.moveTo(px, py);
            else g.lineTo(px, py);
          }
          g.closePath();
          g.globalAlpha = alpha;
          g.lineWidth = Math.max(1.5, s * 0.28);
          g.strokeStyle = OUTLINE;
          g.stroke();
          g.fillStyle = color;
          g.fill();
          break;
        }
        case P_PUFF: {
          g.globalAlpha = alpha * (1 - k) * 0.7;
          g.fillStyle = color;
          g.beginPath();
          g.arc(x, y, size * (0.45 + 0.75 * k), 0, TAU);
          g.fill();
          break;
        }
        case P_SPARK: {
          const vx = this.vx[i]!;
          const vy = this.vy[i]!;
          const sp = Math.hypot(vx, vy) || 1;
          const len = Math.min(size * 3.2, sp * 0.035) + size * 0.5;
          g.globalAlpha = alpha * (1 - k * k);
          g.strokeStyle = color;
          g.lineWidth = size * (1 - k * 0.6);
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x - (vx / sp) * len, y - (vy / sp) * len);
          g.stroke();
          break;
        }
        case P_RING: {
          const e = 1 - (1 - k) * (1 - k) * (1 - k);
          g.globalAlpha = alpha * (1 - k);
          g.strokeStyle = color;
          g.lineWidth = Math.max(1, 7 * (1 - k));
          g.beginPath();
          g.arc(x, y, size * (0.25 + 0.75 * e), 0, TAU);
          g.stroke();
          break;
        }
        case P_TWINKLE: {
          // four-point glint that swells then fades
          const s = size * Math.sin(Math.PI * Math.min(1, k * 1.05));
          if (s < 0.3) break;
          const w = s * 0.24;
          g.globalAlpha = alpha * (1 - k * 0.5);
          g.fillStyle = color;
          g.beginPath();
          g.moveTo(x, y - s);
          g.lineTo(x + w, y - w);
          g.lineTo(x + s, y);
          g.lineTo(x + w, y + w);
          g.lineTo(x, y + s);
          g.lineTo(x - w, y + w);
          g.lineTo(x - s, y);
          g.lineTo(x - w, y - w);
          g.closePath();
          g.fill();
          break;
        }
      }
    }
    g.globalAlpha = alpha;
    g.lineCap = 'butt';
  }
}
