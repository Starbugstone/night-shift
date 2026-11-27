import type { Checkpoint, Hazard } from './rooms/interior';

/**
 * The 2199 fixtures with a timed crossing, by art key (src/abduct/rooms/deep-2199.ts draws them with these keys).
 * Round 2: found by key, not by their English hazard names, which are translation keys.
 */
export const DISPATCH_CROSSING_ART = { cart: 'baggage_cart2199', stamp: 'stamp_weight2199', rail: 'shower_rail2199' } as const;

/** The trailing feet reach the moving fixture just after the beam crosses its track. */
export function dispatchCrossing(spec: Hazard, from: Checkpoint, to: Checkpoint, time: number, speed: number): boolean | undefined {
  const key = 'sprite' in spec ? spec.sprite.key : '';
  const cart = spec.kind === 'patrol' && key === `room/${DISPATCH_CROSSING_ART.cart}`;
  const stamp = spec.kind === 'patrol' && key === `room/${DISPATCH_CROSSING_ART.stamp}`;
  const rail = spec.kind === 'swing' && key === `room/${DISPATCH_CROSSING_ART.rail}`;
  if (!cart && !stamp && !rail) return undefined;
  const travel = Math.hypot(to.x - from.x, to.y - from.y) / speed;
  const p = (time + travel * (rail ? 0.6 : 0.55) + 0.44) * spec.speed + spec.phase;
  if (rail) return Math.sin(p) > 0.6;
  return cart ? Math.sin(p) < -0.55 : Math.sin(p) > 0.35 && Math.cos(p) >= 0;
}
