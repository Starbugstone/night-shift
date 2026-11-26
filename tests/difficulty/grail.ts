import type { FlightAutopilotIntent } from '../../src/contracts';
import type { DeepFlightSim } from '../../src/flight/deep-sim';
import { humanSteering, type HumanProfile } from './human';

/**
 * After Rodney, slip west behind the French lookout to the hedge, then hand control back to the regular
 * ring planner. The lookout watches the cart track south of the tent, so the detour waits for the first leg.
 */
export function shrubberyDetour(sim: DeepFlightSim, profile: HumanProfile, seed: number): () => FlightAutopilotIntent {
  const route = [{ x: 220, y: 900 }, sim.collectible!.def];
  let i = 0;
  const hand = humanSteering(profile, seed);
  return () => {
    const aim = route[i]!, s = sim.saucer;
    const dx = aim.x - s.x, dy = aim.y - s.y, distance = Math.hypot(dx, dy);
    const last = i === route.length - 1, down = !last || distance > 16;
    const lead = last ? Math.min(170, distance * 0.9) : 170;
    const damp = last ? 0.35 : 0.1, sx = s.x - sim.camX, sy = s.y - sim.camY;
    if (!last && distance < 52) i++;
    return hand({ down, x: sx + dx / Math.max(distance, 1) * lead - s.vx * damp,
      y: sy + dy / Math.max(distance, 1) * lead - s.vy * damp }, sim.t, sx, sy, down ? String(i) : 'hover');
  };
}

/** GDD-12's percentage bands for 20 matched seeds, in star order. */
export const GRAIL_TARGETS = {
  skilled: [[90, 100], [65, 80], [75, 85], [90, 100]],
  casual: [[80, 95], [40, 45], [50, 55], [75, 90]],
} as const;
