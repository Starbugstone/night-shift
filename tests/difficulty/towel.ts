import type { DeepFlightSim } from '../../src/flight/deep-sim';
import { humanSteering, type HumanProfile } from './human';

/** Follow the memo's west lane and brake at the rack with the same delayed hand as the normal route. */
export function towelDetour(sim: DeepFlightSim, profile: HumanProfile, seed: number) {
  const hand = humanSteering(profile, seed);
  const rack = sim.collectible!.def;
  const route = [{ x: 310, y: 518 }, rack];
  let leg = 0;
  return () => {
    const { saucer: s, camX, camY } = sim;
    const aim = route[leg]!;
    const dx = aim.x - s.x, dy = aim.y - s.y;
    const distance = Math.hypot(dx, dy);
    const hover = leg === route.length - 1;
    const reach = Math.min(165, distance * 1.35) / Math.max(1, distance);
    const damp = distance < 120 ? 0.36 : 0.13;
    if (!hover && distance < 55) leg++;
    const x = s.x - camX, y = s.y - camY;
    return hand({ down: !hover || distance > 17, x: x + dx * reach - s.vx * damp,
      y: y + dy * reach - s.vy * damp }, sim.t, x, y, 'west harbour ' + leg);
  };
}
