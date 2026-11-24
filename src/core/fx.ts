// Shared effect data and maths: the glow colour triplets, easing curves and the pooled particle
// simulation (drawn by ParticleView in src/core/gfx/particles.ts). DOM-free: particles live in
// fixed typed arrays and nothing allocates per frame.
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- colours

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

// ---------------------------------------------------------------- painter helpers

/**
 * drawImage(img, x, y, w, h), for Canvas 2D painters (`paintedTexture`) that draw art. Kept as a
 * named helper so painters read like the rest of the drawing code.
 */
export function drawSprite(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number): void {
  g.drawImage(img, x, y, w, h);
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
export const PARTICLE_COLORS = ['#FFD27A', '#7CFFCB', '#ffffff', '#FF5D73', '#d9ccc0', '#F4EFE2', '#1f9a6c', '#d33a52', '#ff7ad9', '#a8dcff', '#3a3348', '#c8a4ff'] as const;
export const PARTICLE_OUTLINE = '#1b1433';

/**
 * Fixed-size particle pool. Spawning past the cap recycles the oldest slot; nothing is
 * allocated after construction. Coordinates are whatever space you draw it in.
 */
export class Particles {
  readonly kind: Uint8Array;
  readonly color: Uint8Array;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly life: Float32Array;
  readonly span: Float32Array;
  readonly size: Float32Array;
  readonly rot: Float32Array;
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
}
