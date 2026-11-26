import type { Checkpoint, Hazard } from './rooms/interior';

/** The trailing feet reach the moving fixture just after the beam crosses its track. */
export function dispatchCrossing(spec: Hazard, from: Checkpoint, to: Checkpoint, time: number, speed: number): boolean | undefined {
  const cart = spec.kind === 'patrol' && spec.name === 'Baggage cart';
  const stamp = spec.kind === 'patrol' && spec.name === 'Stamp counterweight';
  const rail = spec.kind === 'swing' && spec.name === 'Shower rail';
  if (!cart && !stamp && !rail) return undefined;
  const travel = Math.hypot(to.x - from.x, to.y - from.y) / speed;
  const p = (time + travel * (rail ? 0.6 : 0.55) + 0.44) * spec.speed + spec.phase;
  if (rail) return Math.sin(p) > 0.6;
  return cart ? Math.sin(p) < -0.55 : Math.sin(p) > 0.35 && Math.cos(p) >= 0;
}
