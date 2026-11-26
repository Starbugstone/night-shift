// L6 flight signature: the ambulance scramble (docs/GDD-3-new-shifts.md, L6).
//
// An ambulance waits dark in its bay. When the saucer comes within `trigger` px of the bay it is
// scrambled: the bay door rolls up and the lane arrows flash amber for AMBULANCE.tell s (the tell,
// nothing can see you yet), then it launches down the access road with a headlight cone and a
// beacon radius, turns round at the end of its run, drives back and parks. After `rest` s parked
// it can be scrambled again. Deterministic: the only state is the hazard time it was triggered,
// kept per ambulance in the flight state (copied for the autopilot's look-ahead like porch lights).
//
// DOM-free. The pose is a pure function of the time since the trigger, so the drawn ambulance is
// the detecting ambulance. Drawing lives in ./ambulance-draw.ts.
import type { Vec2 } from '../contracts';
import type { Route } from './hazards';

export interface AmbulanceHazard {
  type: 'ambulance';
  /** Centre of the bay building (its roof is drawn over the parked ambulance). */
  bayX: number;
  bayY: number;
  /** path[0] = parked inside the bay; path[1] = out through the roll door; then the access road. */
  path: Vec2[];
  /** Saucer within this many px of the bay centre scrambles the ambulance. */
  trigger: number;
  /** px/s along the road. */
  speed: number;
  /** Seconds turning round at the far end of the run (still lit). */
  dwell: number;
  /** Seconds parked before it can be scrambled again. */
  rest: number;
  coneRange: number;
  coneHalf: number;
  /** Rotating beacon detection radius round the ambulance. */
  beaconR: number;
}

export const AMBULANCE = {
  /** Bay door up + amber lane arrows, before the launch. */
  tell: 0.9, // v4 difficulty curve (Neon P5): was 1.2; the scramble should be able to catch a careless pass
  /** Sprite length (flight/ambulance_top is 80x160, nose north). */
  len: 160,
  w: 80,
  /** The door rolls back down over this long after it parks. */
  doorDown: 0.6,
} as const;

/** What an ambulance is doing at a given time since its trigger. */
export const AmbPhase = {
  /** In the bay, door down. */
  Parked: 0,
  /** Door rolling up, lane arrows amber: launching in < AMBULANCE.tell s. */
  Tell: 1,
  /** On the road, lights on: it can see you. */
  Driving: 2,
} as const;
export type AmbPhase = (typeof AmbPhase)[keyof typeof AmbPhase];

export interface AmbulancePose {
  x: number;
  y: number;
  heading: number;
  /** Headlight cone origin (the nose). */
  ox: number;
  oy: number;
  phase: AmbPhase;
}

/** Seconds from trigger until it is parked again. */
export function ambulanceTrip(d: AmbulanceHazard, route: Route): number {
  return AMBULANCE.tell + (2 * route.total) / d.speed + d.dwell;
}

/** Heading of a parked ambulance: nose out of the door. */
function parkedHeading(d: AmbulanceHazard): number {
  const a = d.path[0]!;
  const b = d.path[1] ?? a;
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/**
 * Pose for `tau` seconds after the trigger (Infinity = never triggered / long parked).
 * Allocation-free: writes into `out`.
 */
export function ambulancePose(d: AmbulanceHazard, route: Route, tau: number, out: AmbulancePose): AmbPhase {
  const run = route.total / d.speed;
  let h: number;
  let phase: AmbPhase;
  if (!(tau >= 0) || tau >= AMBULANCE.tell + 2 * run + d.dwell) {
    route.at(0, out);
    h = parkedHeading(d);
    phase = AmbPhase.Parked;
  } else if (tau < AMBULANCE.tell) {
    route.at(0, out);
    h = parkedHeading(d);
    phase = AmbPhase.Tell;
  } else {
    let k = tau - AMBULANCE.tell;
    phase = AmbPhase.Driving;
    if (k < run) h = route.at(k * d.speed, out, 50);
    else if ((k -= run) < d.dwell) {
      const h0 = route.at(route.total, out);
      h = h0 + Math.PI * (k / d.dwell);
    } else {
      k -= d.dwell;
      h = route.at(route.total - k * d.speed, out, 50) + Math.PI;
    }
  }
  out.heading = h;
  out.ox = out.x + Math.cos(h) * AMBULANCE.len * 0.45;
  out.oy = out.y + Math.sin(h) * AMBULANCE.len * 0.45;
  out.phase = phase;
  return phase;
}

/** True when an ambulance triggered at `trig` is back, rested and can be scrambled again at `t`. */
export function ambulanceReady(d: AmbulanceHazard, route: Route, trig: number, t: number): boolean {
  return !(t - trig < ambulanceTrip(d, route) + d.rest);
}

/**
 * Scramble any ready ambulance whose bay the saucer at (x, y) is near. `trig[slot]` = hazard time
 * of its last trigger (-Infinity = never). Returns the first hazard index scrambled, or -1.
 */
export function triggerAmbulances(
  defs: readonly { type: string }[],
  routes: readonly (Route | null)[],
  slots: Int16Array,
  trig: Float64Array,
  x: number,
  y: number,
  t: number,
): number {
  let fired = -1;
  for (let i = 0; i < defs.length; i++) {
    const s = slots[i]!;
    if (s < 0) continue;
    const d = defs[i] as AmbulanceHazard;
    const dx = x - d.bayX;
    const dy = y - d.bayY;
    if (dx * dx + dy * dy > d.trigger * d.trigger) continue;
    if (!ambulanceReady(d, routes[i]!, trig[s]!, t)) continue;
    trig[s] = t;
    if (fired < 0) fired = i;
  }
  return fired;
}
