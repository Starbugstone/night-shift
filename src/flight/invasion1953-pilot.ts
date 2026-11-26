import type { FlightAutopilotIntent, Vec2 } from '../contracts';
import type { DeepFlightSim } from './deep-sim';
import { TRIPOD_LEG } from './invasion1953';

const APPROACH = [{ x: 258, y: 2185 }, { x: 186, y: 1640 }, TRIPOD_LEG] as const;

/** Optional first leg for the browser replay and the detour difficulty model. */
export class TripodLegPilot {
  private waypoint = 0;
  private readonly finger = { down: false, x: 0, y: 0 };

  constructor(private readonly sim: DeepFlightSim) {}

  get mode(): string { return this.waypoint === APPROACH.length - 1 ? 'hover' : 'go'; }

  intent(): FlightAutopilotIntent {
    const { sim, finger } = this;
    const { saucer, camX, camY } = sim;
    let goal: Vec2 = APPROACH[this.waypoint]!;
    let distance = Math.hypot(goal.x - saucer.x, goal.y - saucer.y);
    if (this.mode === 'go' && distance < 47) {
      goal = APPROACH[++this.waypoint]!;
      distance = Math.hypot(goal.x - saucer.x, goal.y - saucer.y);
    }
    const aim = Math.min(210, distance * 1.45) / Math.max(1, distance);
    const damp = distance < 146 ? 0.4 : 0.14;
    finger.x = saucer.x - camX + (goal.x - saucer.x) * aim - saucer.vx * damp;
    finger.y = saucer.y - camY + (goal.y - saucer.y) * aim - saucer.vy * damp;
    finger.down = !sim.collectible?.collected && sim.phase === 'fly' &&
      (distance > 20 || Math.hypot(saucer.vx, saucer.vy) > 72);
    return finger;
  }
}
