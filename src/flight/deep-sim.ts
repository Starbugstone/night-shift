// Deep-level flight simulation (L3+): saucer, hazards, suspicion fuse, lock-on on
// several targets, camera. DOM-free; the scene renders it and the autopilot / tests drive it.
import type { PointerState, UpgradeId, Vec2 } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import type { DeepMap } from '../levels/types';
import type { SegHit } from './geometry';
import { BUMP_STUN, HazardField } from './hazards';
import { newPhotoState } from './photographer'; // L7 cruise code
import {
  FLIGHT_HUD,
  LOCK,
  LockOn,
  RING_R,
  SAUCER,
  SUSPICION,
  ringUnder,
  saucerSpeed,
  steerSaucer,
  suspicionMultiplier,
  type Saucer,
} from './sim';

/** Seconds of invisibility after (re)spawning at a checkpoint. */
export const SAFE_WINDOW = 1.6;
const OFF_MAP = -1e6;

/** Everything that changes frame to frame; copied for look-ahead rollouts. */
export interface FlightState {
  t: number;
  s: Saucer;
  sus: number;
  cool: number;
  porchArm: Float64Array;
  porchLit: Float64Array;
  /** L6 clinic code: hazard time each ambulance was last scrambled (-Infinity = never). */
  ambT: Float64Array;
  /** L7 cruise code: per photographer, the hazard time of its last half-press and the frame centre. */
  photo: Float64Array;
  /** Detection ignored while > 0. */
  safe: number;
  bumpCd: number;
  // ---- per-step outputs
  /** Hazard index detecting the saucer this step, or -1. */
  cause: number;
  /** Hazard index bumped this step (respecting the bump cooldown), or -1. */
  bump: number;
  /** Porch light that clicked on this step, or -1. */
  click: number;
}

export function newFlightState(porches: number, ambulances = 0, photographers = 0): FlightState {
  return {
    t: 0,
    s: { x: 0, y: 0, vx: 0, vy: 0, stun: 0 },
    sus: 0,
    cool: 0,
    porchArm: new Float64Array(porches),
    porchLit: new Float64Array(porches),
    ambT: new Float64Array(ambulances).fill(-Infinity),
    photo: newPhotoState(photographers),
    safe: 0,
    bumpCd: 0,
    cause: -1,
    bump: -1,
    click: -1,
  };
}

export function copyFlightState(dst: FlightState, src: FlightState): void {
  dst.t = src.t;
  dst.s.x = src.s.x;
  dst.s.y = src.s.y;
  dst.s.vx = src.s.vx;
  dst.s.vy = src.s.vy;
  dst.s.stun = src.s.stun;
  dst.sus = src.sus;
  dst.cool = src.cool;
  dst.porchArm.set(src.porchArm);
  dst.porchLit.set(src.porchLit);
  if (dst.ambT.length === src.ambT.length) dst.ambT.set(src.ambT);
  if (dst.photo.length === src.photo.length) dst.photo.set(src.photo);
  dst.safe = src.safe;
  dst.bumpCd = src.bumpCd;
  dst.cause = src.cause;
  dst.bump = src.bump;
  dst.click = src.click;
}

const scratchHit: SegHit = { nx: 0, ny: 0, depth: 0 };

/**
 * One physics step. `fdx, fdy` = finger offset from the saucer (world px). Shared by the live sim
 * and the autopilot's rollouts, so predictions match play exactly.
 */
export function stepFlight(
  field: HazardField,
  m: DeepMap,
  st: FlightState,
  down: boolean,
  fdx: number,
  fdy: number,
  dt: number,
  mult: number,
): void {
  st.t += dt;
  field.ambT = st.ambT;
  field.photo = st.photo;
  field.sample(st.t);
  const s = st.s;
  steerSaucer(s, down, fdx, fdy, dt, field.scramble(s.x, s.y));

  const R = SAUCER.radius;
  if (s.x < R) ((s.x = R), (s.vx = Math.abs(s.vx) * 0.3));
  if (s.x > m.w - R) ((s.x = m.w - R), (s.vx = -Math.abs(s.vx) * 0.3));
  if (s.y < R) ((s.y = R), (s.vy = Math.abs(s.vy) * 0.3));
  if (s.y > m.h - R) ((s.y = m.h - R), (s.vy = -Math.abs(s.vy) * 0.3));

  st.bumpCd = Math.max(0, st.bumpCd - dt);
  st.bump = -1;
  const hit = field.collide(s, scratchHit);
  if (hit >= 0 && st.bumpCd <= 0) {
    st.bump = hit;
    st.bumpCd = 0.4;
    s.stun = field.defs[hit]!.type === 'wire' ? 0.4 : BUMP_STUN;
  }

  st.click = field.stepPorches(s.x, s.y, dt, st.porchArm, st.porchLit);
  field.stepAmbulances(s.x, s.y, st.t);
  field.stepPhotographers(s.x, s.y, saucerSpeed(s), st.t);
  if (st.safe > 0) {
    st.safe = Math.max(0, st.safe - dt);
    st.cause = -1;
  } else st.cause = field.detect(s.x, s.y, st.porchLit);

  if (st.cause >= 0) {
    st.sus += SUSPICION.rate * mult * dt;
    st.cool = SUSPICION.grace;
  } else if (st.cool > 0) st.cool -= dt;
  else st.sus -= SUSPICION.decay * dt;
  st.sus = st.sus < 0 ? 0 : st.sus > 1 ? 1 : st.sus;
}

export interface RingRef {
  target: number;
  entry: 0 | 1;
}

export type DeepFlightPhase = 'fly' | 'spotted' | 'locking';

/** The live deep-level flight: state + camera + lock-on + finger handling. */
export class DeepFlightSim {
  readonly field: HazardField;
  readonly st: FlightState;
  readonly lock = new LockOn();
  /** All entry rings, two per target, in target order. Delivered targets' rings move off-map. */
  readonly rings: Vec2[] = [];
  readonly ringRef: RingRef[] = [];
  readonly delivered: boolean[] = [false, false, false];
  readonly mult: number;
  phase: DeepFlightPhase = 'fly';
  camX = 0;
  camY = 0;
  /** Ring locked onto (index into rings), when phase = 'locking'. */
  lockedRing = -1;
  /** Hazard that filled the meter. */
  spottedBy = -1;
  /** Set on the step lock-on completed. */
  justLocked = false;
  /** Saucer was in a ring (for Zib) */
  inRing = -1;

  constructor(
    readonly map: DeepMap,
    upgrades: ReadonlySet<UpgradeId>,
    t0 = 0,
  ) {
    this.field = new HazardField(map.hazards);
    this.st = newFlightState(this.field.porchCount, this.field.ambCount, this.field.photoCount);
    this.field.ambT = this.st.ambT;
    this.field.photo = this.st.photo;
    this.mult = suspicionMultiplier(upgrades) / (map.fuseSec ?? 1);
    map.targets.forEach((tg, ti) =>
      tg.entries.forEach((e, ei) => {
        this.rings.push({ x: e.x, y: e.y });
        this.ringRef.push({ target: ti, entry: ei as 0 | 1 });
      }),
    );
    this.st.t = t0;
    this.field.sample(t0);
    this.place(map.start.x, map.start.y, 0);
  }

  get saucer(): Saucer {
    return this.st.s;
  }

  get suspicion(): number {
    return this.st.sus;
  }

  /** Hazard time (shared with the sunrise clock by the runner). */
  get t(): number {
    return this.st.t;
  }

  /** Put the saucer at (x,y), stopped, with a safe window. */
  place(x: number, y: number, safe = SAFE_WINDOW): void {
    const s = this.st.s;
    s.x = x;
    s.y = y;
    s.vx = s.vy = s.stun = 0;
    this.st.sus = 0;
    this.st.cool = 0;
    this.st.safe = safe;
    this.st.porchArm.fill(0);
    this.lock.reset();
    this.phase = 'fly';
    this.lockedRing = -1;
    this.spottedBy = -1;
    this.snapCamera();
  }

  markDelivered(target: number): void {
    this.delivered[target] = true;
    for (let i = 0; i < this.rings.length; i++) {
      if (this.ringRef[i]!.target === target) {
        this.rings[i]!.x = OFF_MAP;
        this.rings[i]!.y = OFF_MAP;
      }
    }
  }

  /** Ring position for (target, entry) from the map (stable even after delivery). */
  ringPos(target: number, entry: number): Vec2 {
    const e = this.map.targets[target]!.entries[entry]!;
    return { x: e.x, y: e.y };
  }

  snapCamera(): void {
    const s = this.st.s;
    this.camX = clampN(s.x - VIEW_W / 2, 0, this.map.w - VIEW_W);
    this.camY = clampN(s.y - VIEW_H * FLIGHT_HUD.camFrac, 0, this.map.h - VIEW_H);
  }

  private followCamera(dt: number): void {
    const s = this.st.s;
    const tx = clampN(s.x - VIEW_W / 2 + s.vx * 0.3, 0, this.map.w - VIEW_W);
    const ty = clampN(s.y - VIEW_H * FLIGHT_HUD.camFrac + s.vy * 0.3, 0, this.map.h - VIEW_H);
    const k = 1 - Math.exp(-5 * dt);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
  }

  /** Advance one frame. `pointer` is in logical screen coords; `pointerFree` = not on a HUD button. */
  update(dt: number, pointer: PointerState, pointerFree = true): void {
    this.justLocked = false;
    if (this.phase === 'spotted') {
      // the world keeps moving behind the photo-flash freeze (the clock is running)
      this.st.t += dt;
      this.field.sample(this.st.t);
      return;
    }
    if (this.phase === 'locking') {
      this.st.t += dt;
      this.field.sample(this.st.t);
      const ring = this.rings[this.lockedRing]!;
      const k = 1 - Math.exp(-8 * dt);
      const s = this.st.s;
      s.x += (ring.x - s.x) * k;
      s.y += (ring.y - s.y) * k;
      this.followCamera(dt);
      return;
    }
    const s = this.st.s;
    const down = pointer.down && pointerFree;
    const sx = s.x - this.camX;
    const sy = s.y - this.camY;
    stepFlight(this.field, this.map, this.st, down, pointer.x - sx, pointer.y - sy, dt, this.mult);
    if (this.st.sus >= 1) {
      this.phase = 'spotted';
      this.spottedBy = this.st.cause;
      return;
    }
    const idx = ringUnder(s.x, s.y, saucerSpeed(s), this.rings, RING_R);
    this.inRing = idx;
    if (this.lock.update(dt, idx)) {
      this.phase = 'locking';
      this.lockedRing = idx;
      this.justLocked = true;
    }
    this.followCamera(dt);
  }
}

function clampN(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export { LOCK, RING_R };
