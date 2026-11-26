import type { FlightAutopilotIntent } from '../../src/contracts';
import type { DeepFlightSim } from '../../src/flight/deep-sim';
import { TripodLegPilot } from '../../src/flight/invasion1953-pilot';
import { humanSteering, type HumanProfile } from './human';

export class LegFirst {
  caught = false;
  private interrupted = false;
  private readonly plan: TripodLegPilot;
  private readonly hand: ReturnType<typeof humanSteering>;

  constructor(private readonly sim: DeepFlightSim, profile: HumanProfile, seed: number) {
    this.plan = new TripodLegPilot(sim);
    this.hand = humanSteering(profile, seed);
  }

  get active(): boolean { return !this.caught && !this.interrupted; }

  steer(): FlightAutopilotIntent {
    const { saucer, camX, camY, t } = this.sim;
    return this.hand(this.plan.intent(), t, saucer.x - camX, saucer.y - camY, this.plan.mode);
  }

  record(): void {
    this.caught ||= this.sim.justCollected;
    this.interrupted ||= this.sim.spottedBy >= 0 || this.sim.justLocked;
  }
}
