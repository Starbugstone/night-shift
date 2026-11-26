// L7 flight signature: the deck photographer (docs/GDD-3-new-shifts.md, L7), plus the deck
// stewards with their torches.
//
// A photographer half-presses when the saucer comes within `range`: an amber frame locks onto where
// the saucer is *now* and a closing iris previews the shutter (PHOTO.iris s). Then the frame's exact
// border goes solid for a PHOTO.expose s long exposure; being inside it counts as detector exposure.
// After PHOTO.rest s winding on, the next saucer in range is framed again. You break sideways once the
// frame is fixed, then come back between shots. The only state is the trigger time and the frame
// centre, kept per photographer in the flight state (copied for the autopilot's look-ahead like
// porch lights), so the drawn frame is the detecting frame.
//
// A steward walks a deck path back and forth (turning at each end) with a torch cone that sweeps a
// little side to side: a pure function of the hazard clock, like the cars.
//
// DOM-free. Drawing lives in ./photographer-draw.ts.
import type { Vec2 } from '../contracts';
import { pointInCone, wrapAngle } from './geometry';
import type { Route } from './hazards';

export interface PhotographerHazard {
  type: 'photographer';
  x: number;
  y: number;
  /** A saucer this close gets framed. */
  range: number;
  /** Frame half size, world px. */
  halfW: number;
  halfH: number;
  /** Which way the photographer idles (radians), pacing the deck rail. */
  facing: number;
}

export interface StewardHazard {
  type: 'steward';
  /** Walked back and forth. */
  path: Vec2[];
  speed: number;
  /** Seconds turning round at each end (the torch sweeps across). */
  dwell: number;
  /** Start offset along the walk, px. */
  phase: number;
  coneRange: number;
  coneHalf: number;
  sweepAmp: number;
  sweepRate: number;
}

export const PHOTO = {
  /** Amber frame + closing iris: the shutter is coming. Nothing sees you yet. */
  iris: 0.9,
  /** The frame is solid: inside it you are being photographed. */
  expose: 1.0,
  /** Winding on before the next half-press. */
  rest: 1.4,
  /** A saucer slower than this (px/s) in range is worth a picture: slowing down for a ring, hovering. */
  still: 320,
  /** Slots per photographer in the flight state: trigger time, frame x, frame y. */
  stride: 3,
} as const;
const CYCLE = PHOTO.iris + PHOTO.expose + PHOTO.rest;

/** What a photographer is doing `tau` s after its last half-press. */
export const PhotoPhase = {
  Idle: 0,
  Iris: 1,
  Expose: 2,
  Rest: 3,
} as const;
export type PhotoPhase = (typeof PhotoPhase)[keyof typeof PhotoPhase];

export function photoPhase(tau: number): PhotoPhase {
  if (!(tau >= 0)) return PhotoPhase.Idle;
  if (tau < PHOTO.iris) return PhotoPhase.Iris;
  if (tau < PHOTO.iris + PHOTO.expose) return PhotoPhase.Expose;
  if (tau < CYCLE) return PhotoPhase.Rest;
  return PhotoPhase.Idle;
}

/** Fresh photographer state: never pressed. */
export function newPhotoState(count: number): Float64Array {
  const a = new Float64Array(count * PHOTO.stride);
  for (let i = 0; i < count; i++) a[i * PHOTO.stride] = -Infinity;
  return a;
}

/**
 * Half-press for every idle photographer whose range holds the saucer at (x, y), if it is moving
 * slower than PHOTO.still (nobody gets a sharp picture of a saucer at full tilt), at hazard time t.
 * Returns the first hazard index that half-pressed, or -1.
 */
export function triggerPhotographers(
  defs: readonly { type: string }[], slot: Int16Array, photo: Float64Array, x: number, y: number, speed: number, t: number,
): number {
  if (speed > PHOTO.still) return -1;
  let first = -1;
  for (let i = 0; i < defs.length; i++) {
    const d = defs[i]!;
    if (d.type !== 'photographer') continue;
    const p = d as PhotographerHazard;
    const k = slot[i]! * PHOTO.stride;
    if (photoPhase(t - photo[k]!) !== PhotoPhase.Idle) continue;
    const dx = x - p.x;
    const dy = y - p.y;
    if (dx * dx + dy * dy > p.range * p.range) continue;
    photo[k] = t;
    photo[k + 1] = x;
    photo[k + 2] = y;
    if (first < 0) first = i;
  }
  return first;
}

/** The photographer's frame is exposing and (x, y) is inside it. */
export function inFrame(p: PhotographerHazard, photo: Float64Array, k: number, t: number, x: number, y: number): boolean {
  if (photoPhase(t - photo[k]!) !== PhotoPhase.Expose) return false;
  return Math.abs(x - photo[k + 1]!) <= p.halfW && Math.abs(y - photo[k + 2]!) <= p.halfH;
}

export interface StewardPose {
  x: number;
  y: number;
  /** Walking direction. */
  heading: number;
  /** Torch direction. */
  torch: number;
}

/** Where a steward is at hazard time t (allocation-free). */
export function stewardPose(d: Pick<StewardHazard, 'path' | 'speed' | 'dwell' | 'phase' | 'sweepAmp' | 'sweepRate'>, route: Route, t: number, out: StewardPose, tmp: { x: number; y: number }): void {
  const run = route.total / d.speed;
  const period = 2 * (run + d.dwell);
  let tau = (((d.phase / d.speed + t) % period) + period) % period;
  let h: number;
  if (tau < run) h = route.at(tau * d.speed, tmp);
  else if ((tau -= run) < d.dwell) h = wrapAngle(route.at(route.total, tmp) + Math.PI * (tau / d.dwell));
  else if ((tau -= d.dwell) < run) h = wrapAngle(route.at(route.total - tau * d.speed, tmp) + Math.PI);
  else {
    tau -= run;
    h = wrapAngle(route.at(0, tmp) + Math.PI + Math.PI * (tau / d.dwell));
  }
  out.x = tmp.x;
  out.y = tmp.y;
  out.heading = h;
  out.torch = h + d.sweepAmp * Math.sin(t * d.sweepRate + d.phase * 0.01);
}

/** Torch origin: a little in front of the steward. */
export const STEWARD_REACH = 18;

export function stewardSees(d: StewardHazard, x: number, y: number, sx: number, sy: number, torch: number): boolean {
  return pointInCone(x, y, sx + Math.cos(torch) * STEWARD_REACH, sy + Math.sin(torch) * STEWARD_REACH, torch, d.coneHalf, d.coneRange);
}
