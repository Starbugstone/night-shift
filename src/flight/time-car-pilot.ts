// Pointer plan for repeatable checks of the west-turnout intercept.
import type { FlightAutopilotIntent } from '../contracts';
import type { DeepFlightSim } from './deep-sim';
import { SAUCER } from './sim';
import { TIME_CAR } from './time-car';

/** The west verge run to the turnout; a leg without `y` stays level with the launch. */
const VERGE: readonly { x: number; y?: number }[] = [{ x: 140 }, { x: 140, y: 980 }];

export class TimeCarPilot {
  private west = false;
  private verge = 0;
  mode: 'west' | 'stage' | 'intercept' = 'west';

  constructor(private readonly sim: DeepFlightSim) {}

  intent(): FlightAutopilotIntent {
    const { saucer: s, camX, camY, collectible } = this.sim;
    const car = collectible?.timeCar;
    if (!car?.visible) return { down: false, x: s.x - camX, y: s.y - camY };
    // 2026-11-26 openings: from Main Street's south end, cut over to the west verge and run up it, clear of
    // the Marshal's torch over the café's back lot, then stage at the turnout.
    const leg = this.verge < VERGE.length ? VERGE[this.verge]! : null;
    if (leg) {
      const ly = leg.y ?? this.sim.map.start.y;
      if (Math.abs(s.x - leg.x) < 70 && Math.abs(s.y - ly) < 90) this.verge++;
    }
    if (this.verge >= VERGE.length) this.west = true;

    let ax: number;
    let ay: number;
    if (this.west && s.y < TIME_CAR.turnout.y + 100 && car.elapsed >= TIME_CAR.opens - 0.55) {
      this.mode = 'intercept';
      // Correct both axes while providing the thrust needed to hold the car's pace.
      ax = (car.position.x - s.x) * 11 + (car.speed - s.vx) * 5 + car.acceleration;
      ay = (car.position.y - s.y) * 11 - s.vy * 5;
    } else {
      this.mode = this.west ? 'stage' : 'west';
      const next = VERGE[Math.min(this.verge, VERGE.length - 1)]!;
      const targetX = this.west ? TIME_CAR.turnout.x : next.x;
      const targetY = this.west ? TIME_CAR.turnout.y : next.y ?? this.sim.map.start.y;
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
