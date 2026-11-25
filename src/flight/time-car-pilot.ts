// Pointer plan for repeatable checks of the west-turnout intercept.
import type { FlightAutopilotIntent } from '../contracts';
import type { DeepFlightSim } from './deep-sim';
import { SAUCER } from './sim';
import { TIME_CAR } from './time-car';

export class TimeCarPilot {
  private west = false;
  mode: 'west' | 'stage' | 'intercept' = 'west';

  constructor(private readonly sim: DeepFlightSim) {}

  intent(): FlightAutopilotIntent {
    const { saucer: s, camX, camY, collectible } = this.sim;
    const car = collectible?.timeCar;
    if (!car?.visible) return { down: false, x: s.x - camX, y: s.y - camY };
    if (s.x < 725) this.west = true;

    let ax: number;
    let ay: number;
    if (this.west && s.y < 1640 && car.elapsed >= TIME_CAR.opens - 0.55) {
      this.mode = 'intercept';
      // Correct both axes while providing the thrust needed to hold the car's pace.
      ax = (car.position.x - s.x) * 11 - s.vx * 5;
      ay = (car.position.y - s.y) * 11 + (-car.speed - s.vy) * 5;
      if (car.phase === 'open') ay -= TIME_CAR.acceleration;
    } else {
      this.mode = this.west ? 'stage' : 'west';
      const targetX = this.west ? TIME_CAR.turnout.x + 92 : TIME_CAR.turnout.x;
      const targetY = this.west ? TIME_CAR.turnout.y - 20 : this.sim.map.start.y;
      const x = targetX - s.x;
      const y = targetY - s.y;
      const pace = Math.min(2.4, 390 / Math.max(1, Math.hypot(x, y)));
      ax = (x * pace - s.vx) * 5;
      ay = (y * pace - s.vy) * 5;
    }
    ax += s.vx * SAUCER.drag;
    ay += s.vy * SAUCER.drag;

    const force = Math.hypot(ax, ay);
    const finger = SAUCER.deadzone + SAUCER.fullAt * Math.min(1, force / SAUCER.accel);
    return {
      down: force > 35,
      x: s.x - camX + ax / Math.max(1, force) * finger,
      y: s.y - camY + ay / Math.max(1, force) * finger,
    };
  }
}
