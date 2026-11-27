// Pointing: how a held finger or mouse button steers the beam in an abduction. Like the saucer in
// flight, the beam heads for the point under the pointer, faster the further away it is (a
// joystick centred on the beam). The camera follows the body in the houses, so a pointer held to
// one side keeps it travelling; on the beam, or released, it stops. DOM-free.
import { VIEW_H, VIEW_W } from '../contracts';
import { clamp } from './ragdoll';

export const POINT = {
  /** No movement this close to the pointer (logical px), so a resting thumb holds still. */
  dead: 14,
  /** Beam speed per px of distance beyond the dead zone (1/s). */
  gain: 1.7,
  /** Slowest creep outside the dead zone (px/s), so the last few px don't take forever. */
  min: 30,
  /** Top beam speed (px/s): quick enough to dart past a camera, short of a wall-smashing fling. */
  max: 260,
} as const;

/** Beam speed for a pointer `distance` px away (px/s); 0 inside the dead zone. */
export function pointSpeed(distance: number): number {
  return distance <= POINT.dead ? 0 : clamp((distance - POINT.dead) * POINT.gain, POINT.min, POINT.max);
}

/** How far ahead of the beam to hold the pointer for it to travel at `speed` px/s. */
export function pointReach(speed: number): number {
  return POINT.dead + clamp(speed, POINT.min, POINT.max) / POINT.gain;
}

/** How far the beam moves this frame toward a pointer `distance` px away. Never past the dead zone. */
export function pointStep(distance: number, dt: number): number {
  return Math.max(0, Math.min(distance - POINT.dead, pointSpeed(distance) * dt));
}

/**
 * Where a finger or cursor can press: the 540×960 logical canvas the input maps it into. (A phone
 * that isn't 9:16 adds thin letterbox bars; no route relies on them.) Anything that drives the beam
 * by pointing without a real screen, the difficulty model's hand and the browser bot's finger, holds
 * its point inside it, so it never steers with a position a phone can't produce (v0.2 council round
 * 2, Sol P1).
 */
export function onScreen(x: number, y: number): boolean {
  return x >= 0 && x <= VIEW_W && y >= 0 && y <= VIEW_H;
}

/** The nearest point a finger can press (see onScreen). */
export function clampToScreen(x: number, y: number): { x: number; y: number } {
  return { x: clamp(x, 0, VIEW_W), y: clamp(y, 0, VIEW_H) };
}
