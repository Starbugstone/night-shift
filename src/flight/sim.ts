// Flight simulation pieces: saucer steering, suspicion, lock-on, path following.
// DOM-free so it can be unit tested.
import type { Vec2 } from '../contracts';
import { wrapAngle } from './geometry';

export interface Saucer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds of lost control after bumping a power line. */
  stun: number;
}

export const SAUCER = {
  radius: 44,
  accel: 1500,
  maxSpeed: 430,
  /** Light drag while steering, for inertia. */
  drag: 1.1,
  /** Strong drag after release: brakes into a hover. */
  brake: 4.2,
  /** Finger this close to the saucer = no thrust. */
  deadzone: 16,
  /** Finger this far away = full thrust. */
  fullAt: 170,
};

/**
 * Accelerate toward (dx,dy) — the finger's offset from the saucer — or brake.
 * `steerRot` rotates the thrust (neon scramble).
 */
export function steerSaucer(s: Saucer, down: boolean, dx: number, dy: number, dt: number, steerRot = 0): void {
  const d = Math.hypot(dx, dy);
  if (down && s.stun <= 0 && d > SAUCER.deadzone) {
    const k = Math.min(1, (d - SAUCER.deadzone) / SAUCER.fullAt);
    let ux = dx / d;
    let uy = dy / d;
    if (steerRot !== 0) {
      const c = Math.cos(steerRot);
      const sn = Math.sin(steerRot);
      const rx = ux * c - uy * sn;
      uy = ux * sn + uy * c;
      ux = rx;
    }
    s.vx += ux * SAUCER.accel * k * dt;
    s.vy += uy * SAUCER.accel * k * dt;
    const f = Math.exp(-SAUCER.drag * dt);
    s.vx *= f;
    s.vy *= f;
  } else {
    const f = Math.exp(-(s.stun > 0 ? 1.5 : SAUCER.brake) * dt);
    s.vx *= f;
    s.vy *= f;
  }
  const sp = Math.hypot(s.vx, s.vy);
  if (sp > SAUCER.maxSpeed) {
    s.vx *= SAUCER.maxSpeed / sp;
    s.vy *= SAUCER.maxSpeed / sp;
  }
  if (s.stun > 0) s.stun = Math.max(0, s.stun - dt);
  s.x += s.vx * dt;
  s.y += s.vy * dt;
}

export function saucerSpeed(s: Saucer): number {
  return Math.hypot(s.vx, s.vy);
}

export const SUSPICION = {
  /** Per second while lit by headlights. */
  coneRate: 0.55,
  /** Per second inside a bark radius. */
  barkRate: 0.7,
  decay: 0.28,
  /** Seconds after leaving a hazard before decay starts. */
  grace: 0.6,
};

/** 0..1 meter: rises while exposed, decays after a short grace period. */
export class SuspicionMeter {
  value = 0;
  private cool = 0;

  /** `rate` = rise per second this frame (0 when not exposed); `mult` = upgrade multiplier. */
  update(dt: number, rate: number, mult = 1): void {
    if (rate > 0) {
      this.value += rate * mult * dt;
      this.cool = SUSPICION.grace;
    } else if (this.cool > 0) {
      this.cool -= dt;
    } else {
      this.value -= SUSPICION.decay * dt;
    }
    this.value = this.value < 0 ? 0 : this.value > 1 ? 1 : this.value;
  }

  get full(): boolean {
    return this.value >= 1;
  }

  reset(): void {
    this.value = 0;
    this.cool = 0;
  }
}

export const LOCK = {
  time: 1,
  maxSpeed: 110,
  /** Fraction of the ring radius the saucer centre must be within. */
  insideFrac: 0.8,
  /** Progress drains this many times faster than it fills. */
  drain: 2,
};

/** Returns the index of the ring the saucer is hovering in, or -1. */
export function ringUnder(
  x: number,
  y: number,
  speed: number,
  rings: readonly Vec2[],
  ringRadius: number,
): number {
  if (speed > LOCK.maxSpeed) return -1;
  const r = ringRadius * LOCK.insideFrac;
  for (let i = 0; i < rings.length; i++) {
    const p = rings[i]!;
    const dx = x - p.x;
    const dy = y - p.y;
    if (dx * dx + dy * dy <= r * r) return i;
  }
  return -1;
}

/** Hover in the same ring for LOCK.time seconds to lock on. */
export class LockOn {
  progress = 0;
  ring = -1;

  /** Returns true on the frame lock-on completes. */
  update(dt: number, ringIndex: number): boolean {
    if (ringIndex >= 0) {
      if (ringIndex !== this.ring) {
        this.ring = ringIndex;
        this.progress = 0;
      }
      this.progress += dt;
      if (this.progress >= LOCK.time) {
        this.progress = LOCK.time;
        return true;
      }
    } else if (this.ring >= 0) {
      this.progress -= dt * LOCK.drain;
      if (this.progress <= 0) {
        this.progress = 0;
        this.ring = -1;
      }
    }
    return false;
  }

  get fraction(): number {
    return this.progress / LOCK.time;
  }

  reset(): void {
    this.progress = 0;
    this.ring = -1;
  }
}

/** Drives a polyline back and forth, pausing (and turning round) at each end. */
export class PathFollower {
  x = 0;
  y = 0;
  /** Facing, radians (atan2 convention; -PI/2 = north). */
  heading = 0;
  private s = 0;
  private dir = 1;
  private dwellT = 0;
  private readonly lens: number[] = [];
  readonly total: number;

  constructor(
    private readonly pts: readonly Vec2[],
    private readonly speed: number,
    private readonly dwell: number,
    private readonly turnRate = 2.6,
  ) {
    let t = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!;
      const b = pts[i]!;
      const l = Math.hypot(b.x - a.x, b.y - a.y);
      this.lens.push(l);
      t += l;
    }
    this.total = t;
    this.place();
    this.heading = this.travelHeading();
  }

  update(dt: number): void {
    if (this.dwellT > 0) {
      this.dwellT -= dt;
    } else {
      this.s += this.dir * this.speed * dt;
      if (this.s >= this.total) {
        this.s = this.total;
        this.dir = -1;
        this.dwellT = this.dwell;
      } else if (this.s <= 0) {
        this.s = 0;
        this.dir = 1;
        this.dwellT = this.dwell;
      }
    }
    this.place();
    const target = this.travelHeading();
    const diff = wrapAngle(target - this.heading);
    const step = this.turnRate * dt;
    this.heading = wrapAngle(this.heading + (Math.abs(diff) <= step ? diff : Math.sign(diff) * step));
  }

  private segIndex(): number {
    let acc = 0;
    for (let i = 0; i < this.lens.length; i++) {
      const l = this.lens[i]!;
      // when driving backwards, prefer the earlier segment at a shared vertex
      if (this.s < acc + l || (this.dir < 0 && this.s <= acc + l) || i === this.lens.length - 1) return i;
      acc += l;
    }
    return 0;
  }

  private place(): void {
    if (this.pts.length === 1 || this.total === 0) {
      this.x = this.pts[0]?.x ?? 0;
      this.y = this.pts[0]?.y ?? 0;
      return;
    }
    let acc = 0;
    for (let i = 0; i < this.lens.length; i++) {
      const l = this.lens[i]!;
      if (this.s <= acc + l || i === this.lens.length - 1) {
        const t = l > 0 ? (this.s - acc) / l : 0;
        const a = this.pts[i]!;
        const b = this.pts[i + 1]!;
        this.x = a.x + (b.x - a.x) * t;
        this.y = a.y + (b.y - a.y) * t;
        return;
      }
      acc += l;
    }
  }

  private travelHeading(): number {
    if (this.pts.length < 2) return -Math.PI / 2;
    const i = this.segIndex();
    const a = this.pts[i]!;
    const b = this.pts[i + 1]!;
    const h = Math.atan2(b.y - a.y, b.x - a.x);
    return this.dir > 0 ? h : wrapAngle(h + Math.PI);
  }
}

/** Dog bark radius: smooth pulse between rMin and rMax. */
export function barkRadius(t: number, rMin: number, rMax: number, period: number): number {
  const p = 0.5 - 0.5 * Math.cos((t / period) * Math.PI * 2);
  return rMin + (rMax - rMin) * p * p;
}

/** Neon flicker: mostly on, with stutters. */
export function neonOn(t: number): boolean {
  const cyc = t % 2.7;
  if (cyc > 2.2 && cyc < 2.35) return false;
  if (cyc > 2.42 && cyc < 2.5) return false;
  return Math.sin(t * 31) > -0.92;
}

/** Steering scramble angle while inside an active neon glow (radians). */
export function neonScramble(t: number): number {
  return 0.45 * Math.sin(t * 5.3) + 0.25 * Math.sin(t * 12.7 + 1.3);
}
