// L5 "Pier Pressure": the dolphin's moisture sheath, refill points and water zones
// (docs/GDD-3-new-shifts.md, L5 "Abduction signature").
//
// - Moisture drains over MOISTURE.drainSec in air; each bonk splashes a chunk off. Below
//   MOISTURE.low the view pulses a dashed amber outline; at 0 the standard red 1 s fuse runs round
//   the specimen, then she wakes squeaking (fail reason `woke`).
// - Refill points (pool surface, mop bucket, sink, a cycling sprinkler) fill her back to full while
//   any joint is in one. Water zones refill too, and make her float up gently.
// - For a human a water zone is only a splash: noise on the way in.
//
// DOM-free and allocation-free per step: the view (src/abduct/wet-view.ts) reads this state.
import { ROLE_PULL } from './body-plan';
import type { Ragdoll } from './ragdoll';
import type { Cycle } from './rooms/interior';
import type { Area } from './rooms/layout';

export interface WaterZone {
  name: string;
  /** The water; its surface is the top edge. */
  area: Area;
}

export type RefillKind = 'pool' | 'bucket' | 'sink' | 'sprinkler';

export interface RefillPoint {
  name: string;
  kind: RefillKind;
  /** Where the body has to be to refill. */
  area: Area;
  /** Sprinkler only: sprays for `open` s of every `period` (phase offsets the room clock). */
  cycle?: Cycle;
}

/** The wet parts of a building (InteriorRoute.wet). */
export interface Wetness {
  water: readonly WaterZone[];
  refills: readonly RefillPoint[];
}

export const MOISTURE = {
  /** Seconds from full to dry in air, held still. */
  drainSec: 14,
  /**
   * Wind-drying: dragged through the air at speed v (px/s) she dries (1 + (v / windSpeed)²) times
   * as fast, up to windMax. A calm drag barely matters; a flat-out yank strips her dry.
   */
  windSpeed: 110,
  windMax: 4,
  /** Smoothing of the chest speed for wind-drying, s. */
  windSmooth: 0.15,
  /** Share lost per bonk: base + power (0.3..1) × perPower. */
  splash: 0.05,
  splashPerPower: 0.12,
  /** Below this the amber outline pulses. */
  low: 0.25,
  /** Refill speed, share per second (a quick dunk fills her). */
  refill: 3.2,
  /** Seconds of the red fuse once dry. */
  fuse: 1,
  /** Fuse cools this fast once she is wet again (per s). */
  fuseCool: 3,
  /** Upward acceleration at full depth, px/s²: torso joints (beam-held) and the rest. */
  floatTorso: 330,
  floatLimb: 400,
  /** Depth below the surface at which buoyancy is full, px. */
  floatDepth: 36,
  /** A human going into water: minimum entry speed (px/s) and noise per px/s over it. */
  splashSpeed: 55,
  splashNoise: 0.09,
  splashMax: 22,
  /** Drip from the lowest joint every so often while wet in air (view only). */
  dripEvery: 0.42,
} as const;

/** Fixed ring of recent drips (view only): world x, floor y and the time they landed. */
export const DRIPS = 10;

export function sprinklerOn(cycle: Cycle | undefined, time: number): boolean {
  if (!cycle) return true;
  return (time + cycle.phase) % cycle.period < cycle.open;
}

function within(a: Area, x: number, y: number, margin = 0): boolean {
  return x >= a.x - margin && x <= a.x + a.w + margin && y >= a.y - margin && y <= a.y + a.h + margin;
}

export class MoistureSim {
  /** 0..1; only drains for a sheathed specimen (the dolphin). */
  level = 1;
  /** Red fuse once dry, 0..MOISTURE.fuse. */
  fuse = 0;
  dried = false;
  /** Refill point the body is in this step, or -1 (water zones count as -2). */
  refilling = -1;
  /** Seconds since the last refill started (view: the droplet pop). */
  refillAge = 99;
  /** Some joint is in water. */
  wet = false;
  /** Joint in water, per joint. */
  readonly inWater: Uint8Array;
  readonly dripX = new Float64Array(DRIPS);
  readonly dripY = new Float64Array(DRIPS);
  readonly dripAt = new Float64Array(DRIPS).fill(-99);
  dripSeq = 0;
  /** Human splashes, for the view and sfx: counter, where, how hard (0..1). */
  splashSeq = 0;
  splashX = 0;
  splashY = 0;
  splashPower = 0;
  /** Smoothed chest speed, px/s (drives wind-drying and the view's spray). */
  speed = 0;
  private lastX = NaN;
  private lastY = NaN;
  private nextDrip = 0;
  private splashCooldown = 0;
  private readonly wasWet: Uint8Array;

  constructor(
    readonly spec: Wetness,
    /** Has a moisture sheath and floats (the dolphin); else only splashes. */
    readonly sheathed: boolean,
    joints: number,
    /** Floors for drip rings: the building's rooms. */
    private readonly rooms: readonly Area[],
  ) {
    this.inWater = new Uint8Array(joints);
    this.wasWet = new Uint8Array(joints);
  }

  /** Before the ragdoll steps: buoyancy for the joints in water. */
  prepare(body: Ragdoll): void {
    if (!this.sheathed || this.spec.water.length === 0) return;
    const plan = body.plan;
    let any = false;
    for (let i = 0; i < plan.joints; i++) {
      let lift = 0;
      for (const zone of this.spec.water) {
        const a = zone.area;
        if (!within(a, body.x[i]!, body.y[i]!)) continue;
        const depth = Math.min(1, (body.y[i]! - a.y) / MOISTURE.floatDepth);
        lift = Math.max(lift, depth);
      }
      body.floatY[i] = -lift * (plan.role[i] === ROLE_PULL ? MOISTURE.floatTorso : MOISTURE.floatLimb);
      if (lift > 0) any = true;
    }
    body.floating = any;
  }

  /**
   * After the ragdoll steps. Returns specimen wake gained from splashes (humans), and sets `dried`
   * once the red fuse has run out.
   */
  step(body: Ragdoll, time: number, dt: number): number {
    const plan = body.plan;
    let noise = 0;
    this.splashCooldown = Math.max(0, this.splashCooldown - dt);
    let wet = false;
    for (let i = 0; i < plan.joints; i++) {
      let inside = 0;
      for (const zone of this.spec.water) if (within(zone.area, body.x[i]!, body.y[i]!)) inside = 1;
      this.inWater[i] = inside;
      if (inside) wet = true;
    }
    if (!this.sheathed) {
      // a human splashing in: noise from the fastest joint that just went in
      let speed = 0;
      for (let i = 0; i < plan.joints; i++) {
        if (this.inWater[i] && !this.wasWet[i]) speed = Math.max(speed, body.speedY(i));
      }
      if (speed > MOISTURE.splashSpeed && this.splashCooldown === 0) {
        this.splashCooldown = 0.6;
        noise = Math.min(MOISTURE.splashMax, 6 + (speed - MOISTURE.splashSpeed) * MOISTURE.splashNoise);
        this.splashSeq++;
        this.splashX = body.chestX;
        this.splashY = body.chestY;
        this.splashPower = Math.min(1, noise / MOISTURE.splashMax);
      }
    }
    this.wasWet.set(this.inWater);
    this.wet = wet;
    if (!this.sheathed) return noise;

    let refill = wet ? -2 : -1;
    for (let r = 0; r < this.spec.refills.length && refill === -1; r++) {
      const point = this.spec.refills[r]!;
      if (point.kind === 'sprinkler' && !sprinklerOn(point.cycle, time)) continue;
      for (let i = 0; i < plan.joints; i++) {
        if (within(point.area, body.x[i]!, body.y[i]!)) {
          refill = r;
          break;
        }
      }
    }
    if (refill !== -1 && this.refilling === -1) this.refillAge = 0;
    this.refilling = refill;
    this.refillAge += dt;
    const cx = body.chestX;
    const cy = body.chestY;
    if (Number.isFinite(this.lastX) && dt > 0) {
      const v = Math.hypot(cx - this.lastX, cy - this.lastY) / dt;
      this.speed += (v - this.speed) * Math.min(1, dt / MOISTURE.windSmooth);
    }
    this.lastX = cx;
    this.lastY = cy;
    if (refill !== -1) this.level = Math.min(1, this.level + MOISTURE.refill * dt);
    else this.level = Math.max(0, this.level - (dt / MOISTURE.drainSec) * this.wind);

    if (this.level <= 0) {
      this.fuse = Math.min(MOISTURE.fuse, this.fuse + dt);
      if (this.fuse >= MOISTURE.fuse - 1e-9) this.dried = true;
    } else {
      this.fuse = Math.max(0, this.fuse - MOISTURE.fuseCool * dt);
    }

    // drips off the lowest joint while she is wet and in the air
    if (!wet && this.level > 0.15 && time >= this.nextDrip) {
      this.nextDrip = time + MOISTURE.dripEvery;
      let low = 0;
      for (let i = 1; i < plan.joints; i++) if (body.y[i]! > body.y[low]!) low = i;
      const x = body.x[low]!;
      const y = body.y[low]!;
      let floor = y + 260;
      for (const room of this.rooms) {
        if (within(room, x, y)) {
          floor = room.y + room.h - 14;
          break;
        }
      }
      const k = this.dripSeq++ % DRIPS;
      this.dripX[k] = x;
      this.dripY[k] = floor;
      this.dripAt[k] = time + Math.min(0.9, Math.sqrt(Math.max(0, floor - y) / 240));
    }
    return 0;
  }

  /** A bonk splashes a chunk of the sheath off. `power` 0.3..1. */
  bonk(power: number): void {
    if (!this.sheathed) return;
    this.level = Math.max(0, this.level - (MOISTURE.splash + MOISTURE.splashPerPower * power));
  }

  /** Drying multiplier from the current drag speed (1 when still). */
  get wind(): number {
    const k = this.speed / MOISTURE.windSpeed;
    return Math.min(MOISTURE.windMax, 1 + k * k);
  }

  /** Low enough for the amber tell. */
  get low(): boolean {
    return this.sheathed && this.level < MOISTURE.low;
  }
}
