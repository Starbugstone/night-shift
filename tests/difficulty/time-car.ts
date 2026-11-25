import type { FlightAutopilotIntent, Vec2 } from '../../src/contracts';
import { DeepFlightSim } from '../../src/flight/deep-sim';
import { LOCK, SAUCER } from '../../src/flight/sim';
import { TIME_CAR } from '../../src/flight/time-car';
import { TimeCarPilot } from '../../src/flight/time-car-pilot';
import type { DeepLevelDef } from '../../src/levels/types';
import { BEELINE_DELAYS } from './beeline';
import { humanSteering, type HumanProfile } from './human';

const DT = 1 / 60;
export interface CarAttempt {
  contact: boolean;
  qualifyingSec: number;
  peak: number;
  caughtAt?: number;
  firstDetector?: number;
  miss?: 'spotted' | 'no intercept' | 'speed mismatch' | 'partial lock';
}

export class CarFirst {
  readonly attempt: CarAttempt = { contact: false, qualifyingSec: 0, peak: 0 };
  private readonly plan: TimeCarPilot;
  private interrupted = false;
  private readonly hand: ReturnType<typeof humanSteering>;

  constructor(private readonly sim: DeepFlightSim, profile: HumanProfile, seed: number) {
    this.plan = new TimeCarPilot(sim);
    this.hand = humanSteering(profile, seed);
  }

  get active(): boolean {
    return !this.interrupted && !!this.sim.collectible?.timeCar?.visible;
  }

  steer(): FlightAutopilotIntent {
    const { saucer: s, camX, camY, t } = this.sim;
    return this.hand(this.plan.intent(), t, s.x - camX, s.y - camY, this.plan.mode);
  }

  record(): void {
    const sim = this.sim;
    const car = sim.collectible!.timeCar!;
    if (sim.justCollected) this.attempt.caughtAt = sim.t;
    if (sim.st.cause >= 0) this.attempt.firstDetector ??= sim.st.cause;
    if (sim.spottedBy >= 0) this.interrupted = true;
    if (car.phase === 'open' || sim.justCollected) {
      const { saucer } = sim;
      if (Math.hypot(saucer.x - car.position.x, saucer.y - car.position.y) <= TIME_CAR.radius * LOCK.insideFrac) {
        this.attempt.contact = true;
        if (car.matching) this.attempt.qualifyingSec += DT;
      }
      this.attempt.peak = Math.max(this.attempt.peak, car.progress);
    }
  }

  result(): CarAttempt {
    const a = this.attempt;
    if (a.caughtAt === undefined) {
      a.miss = this.interrupted ? 'spotted' : !a.contact ? 'no intercept'
        : a.peak > 0 ? 'partial lock' : 'speed mismatch';
    }
    return a;
  }
}

const direct = (sim: DeepFlightSim, target: Vec2, hover = false): FlightAutopilotIntent => {
  const { saucer: s, camX, camY } = sim;
  const dx = target.x - s.x;
  const dy = target.y - s.y;
  const d = Math.hypot(dx, dy);
  const lead = Math.min(SAUCER.deadzone + SAUCER.fullAt, d * 1.4);
  return {
    down: !hover || d > 14 || Math.hypot(s.vx, s.vy) > 65,
    x: s.x - camX + dx * lead / Math.max(1, d) - s.vx * (d < 130 ? 0.35 : 0.1),
    y: s.y - camY + dy * lead / Math.max(1, d) - s.vy * (d < 130 ? 0.35 : 0.1),
  };
};

export function naiveCarCatches(level: DeepLevelDef): { mode: string; delay: number; caught: boolean }[] {
  return BEELINE_DELAYS.flatMap(delay => (['direct', 'at launch', 'park on path'] as const).map(mode => {
    const sim = new DeepFlightSim(level.map, new Set(), delay);
    const car = sim.collectible!.timeCar!;
    while (car.visible && sim.phase === 'fly') {
      const intent = mode === 'at launch' && sim.t < TIME_CAR.launch
        ? { down: false, x: 270, y: 480 }
        : direct(sim, mode === 'park on path' ? { x: TIME_CAR.bay.x, y: 1490 } : car.position, mode === 'park on path');
      sim.update(DT, { ...intent, pressed: false, released: false });
    }
    return { mode, delay, caught: car.phase === 'caught' };
  }));
}
