// L7 "A Whole Cruise Ship": the swell (docs/GDD-3-new-shifts.md, L7 "Abduction signature").
//
// A slow roll gives the whole ship a signed, time-varying sideways pull. The camera and HUD stay
// level; the tells are a fixed plumb dial (needle = the pull right now, amber bead at the outer
// tick ~0.55 s before each reversal) and tilting soup surfaces. Things on castors (the dessert
// trolley, the deckchair stack) slide with the roll as moving solids.
//
// Everything here is a pure function of the abduction clock, so the simulation, the view and the
// autopilot read the same pull and the same castor positions. No allocation in the per-step paths.
import type { Checkpoint, Hazard } from './rooms/interior';
import type { Building } from './rooms/interior';
import type { Rect } from './ragdoll';
import type { Area } from './rooms/layout';

export type SwellSpec = Extract<Hazard, { kind: 'swell' }>;
export type CastorSpec = Extract<Hazard, { kind: 'castor' }>;

const TAU = Math.PI * 2;

/** The roll's period, seconds (GDD-3: ≈ 7 s). */
export const SWELL_PERIOD = 7;
/** How steep the shape is: the pull holds flat, then ramps to the other side through ±1/SHARP. */
const SHARP = 2.4;
/** The dial's amber bead lights this long before each reversal. */
export const SWELL_TELL = 0.55;
/** Castors start rolling this long after the pull turns (they need a moment to get going). */
export const CASTOR_LAG = 0.35;
/** Dial needle swing at full pull, radians. */
export const DIAL_SWING = 0.42;

/** Castors roll over a longer stretch of the turn than the pull itself takes to turn. */
const CASTOR_SHARP = 1.6;
/** A castor rolls for this long either side of its own zero crossing. */
const CASTOR_ROLL = (Math.asin(1 / CASTOR_SHARP) / TAU) * SWELL_PERIOD;

/** -1..1: which way and how hard the ship leans at time t (+1 = everything slides right). */
export function swellShape(period: number, phase: number, t: number, sharp = SHARP): number {
  const s = sharp * Math.sin((TAU * (t + phase)) / period);
  return s > 1 ? 1 : s < -1 ? -1 : s;
}

/** Sideways acceleration, px/s², applied to every joint. */
export function swellPull(spec: SwellSpec, t: number): number {
  return spec.pull * swellShape(spec.period, spec.phase, t);
}

/** Seconds until the pull next changes sign. */
export function toReversal(period: number, phase: number, t: number): number {
  const half = period / 2;
  const u = (((t + phase) % half) + half) % half;
  return half - u;
}

/** The roll is about to turn: the dial's amber bead is lit. */
export function reversalSoon(spec: SwellSpec, t: number): boolean {
  return toReversal(spec.period, spec.phase, t) <= SWELL_TELL;
}

/** Castor offset from its home x at time t, px. */
export function castorOffset(spec: CastorSpec, t: number): number {
  return spec.travel * swellShape(spec.period, spec.phase, t - spec.lag, CASTOR_SHARP);
}

/** Castor velocity, px/s (analytic derivative of castorOffset). */
export function castorVelocity(spec: CastorSpec, t: number): number {
  const a = (TAU * (t - spec.lag + spec.phase)) / spec.period;
  const s = CASTOR_SHARP * Math.sin(a);
  if (s >= 1 || s <= -1) return 0;
  return spec.travel * CASTOR_SHARP * Math.cos(a) * (TAU / spec.period);
}

/** Move a castor's collider to where it is at time t. */
export function moveCastor(spec: CastorSpec, shape: Rect, t: number): void {
  shape.x = spec.sprite.x + castorOffset(spec, t);
  shape.y = spec.sprite.y;
  shape.vx = castorVelocity(spec, t);
  shape.vy = 0;
}

/** 'Starting to roll' tell for a castor: the roll is about to push it the other way. */
export function castorTell(spec: CastorSpec, t: number): number {
  if (castorVelocity(spec, t) !== 0) return 1;
  // parked: light up SWELL_TELL before it starts to roll
  const k = toReversal(spec.period, spec.phase, t - spec.lag) - CASTOR_ROLL;
  return k <= SWELL_TELL ? 1 - Math.max(0, k) / SWELL_TELL : 0;
}

/** Which way a castor is rolling, or about to roll (-1 / +1). */
export function castorHeading(spec: CastorSpec, t: number): number {
  const v = castorVelocity(spec, t);
  if (v !== 0) return v > 0 ? 1 : -1;
  return castorOffset(spec, t) > 0 ? -1 : 1;
}

const swells = new WeakMap<Building, SwellSpec | null>();

/** The building's swell, if it rolls. */
export function findSwell(building: Building): SwellSpec | undefined {
  let s = swells.get(building);
  if (s === undefined) {
    s = (building.hazards.find((h) => h.kind === 'swell') as SwellSpec | undefined) ?? null;
    swells.set(building, s);
  }
  return s ?? undefined;
}

// ------------------------------------------------------------------ autopilot

/** Rough extent of a hanging body around its chest: head and arms, then the dangling legs. */
const ARMS_HALF_W = 70;
const BODY_UP = 95;
const HIPS = 50;
const LEGS_HALF_W = 40;
const BODY_DOWN = 185;
/** How far the dangling feet swing downhill at full lean, px. */
const LEG_SWING = 55;
const CLEAR = 14;
const SAMPLE = 0.04;
/** Extra time a crossing must stay clear after the beam arrives (the body trails it). */
const SETTLE = 0.6;
const probe: Area = { x: 0, y: 0, w: 0, h: 0 };

function overlaps(a: Area, x0: number, y0: number, x1: number, y1: number): boolean {
  return a.x < x1 && a.x + a.w > x0 && a.y < y1 && a.y + a.h > y0;
}

/**
 * Whether a competent pilot can start the crossing `from` → `target` now. For a castor: the
 * trolley's swept box stays clear of the body's box all the way across. For the swell itself: the
 * roll does not turn during the crossing (used for short squeezes, never for a whole route).
 */
export function swellCanCross(spec: SwellSpec | CastorSpec, from: Checkpoint, target: Checkpoint, time: number, speed: number): boolean {
  const duration = Math.hypot(target.x - from.x, target.y - from.y) / speed;
  if (spec.kind === 'swell') return toReversal(spec.period, spec.phase, time) >= duration + SETTLE * 0.5;
  const { sprite } = spec;
  probe.y = sprite.y - CLEAR;
  probe.w = sprite.w + CLEAR * 2;
  probe.h = sprite.h + CLEAR * 2;
  for (let t = 0; t <= duration + SETTLE; t += SAMPLE) {
    const k = Math.min(1, t / duration);
    const x = from.x + (target.x - from.x) * k;
    const y = from.y + (target.y - from.y) * k;
    probe.x = sprite.x + castorOffset(spec, time + t) - CLEAR;
    // a castor rolls with its building's swell (same period and phase): the feet swing the same way
    const swing = LEG_SWING * swellShape(spec.period, spec.phase, time + t);
    if (overlaps(probe, x - ARMS_HALF_W, y - BODY_UP, x + ARMS_HALF_W, y + HIPS) ||
        overlaps(probe, x - LEGS_HALF_W + Math.min(0, swing), y + HIPS, x + LEGS_HALF_W + Math.max(0, swing), y + BODY_DOWN)) return false;
  }
  return true;
}
