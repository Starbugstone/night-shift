import type { FlightAutopilotIntent, Vec2 } from '../../src/contracts';
import type { DeepFlightSim } from '../../src/flight/deep-sim';
import { SAUCER } from '../../src/flight/sim';
import type { LevelId } from '../../src/levels/save';
import { humanSteering, rng, type HumanProfile } from './human';

export function isBirch(id: LevelId): id is 'birch_bakery' | 'birch_neighbours' {
  return id === 'birch_bakery' || id === 'birch_neighbours';
}

/** Direct thumb hold used for each marked turnout and for each initial-ring beeline. */
export function steerTo(sim: DeepFlightSim, target: Vec2, hover: boolean): FlightAutopilotIntent {
  const { saucer: s, camX, camY } = sim;
  const dx = target.x - s.x;
  const dy = target.y - s.y;
  const d = Math.hypot(dx, dy) || 1;
  const lead = hover ? Math.min(190, d * 1.4) : SAUCER.deadzone + SAUCER.fullAt;
  const damp = hover && d < 130 ? 0.35 : 0.1;
  return {
    down: !hover || d > 14 || Math.hypot(s.vx, s.vy) > 65,
    x: s.x - camX + dx / d * lead - s.vx * damp,
    y: s.y - camY + dy / d * lead - s.vy * damp,
  };
}

const PIE_APPROACH = [{ x: 140, y: 1250 }, { x: 140, y: 730 }, { x: 180, y: 660 }];
const GNOME_APPROACH = [{ x: 1355, y: 1550 }, { x: 1360, y: 1040 }, { x: 1255, y: 610 }];

export class BirchPickupFirst {
  private readonly hand;
  private readonly route;
  private step = 0;

  constructor(private readonly sim: DeepFlightSim, profile: HumanProfile, seed: number) {
    this.hand = humanSteering(profile, seed);
    this.route = sim.collectible?.def.id === 'cherry_pie' ? PIE_APPROACH : GNOME_APPROACH;
  }

  get active(): boolean {
    return this.sim.collectible?.collected === false;
  }

  steer(): FlightAutopilotIntent {
    const { saucer: s, camX, camY, t } = this.sim;
    let target = this.route[this.step]!;
    if (this.step < this.route.length - 1 && Math.hypot(s.x - target.x, s.y - target.y) < 46) target = this.route[++this.step]!;
    return this.hand(steerTo(this.sim, target, this.step === this.route.length - 1), t, s.x - camX, s.y - camY, 'detour');
  }
}

/**
 * Read the first warning at the point where the memo places it. A first-time
 * player follows the frontage and only corrects once the light has their attention.
 * The usual hand model still drives the correction and the rest of the shift.
 */
export class BakeryFirstRead {
  private readonly hand;
  private step = 0;
  private readonly points;
  private clearSince = -1;

  constructor(private readonly sim: DeepFlightSim, profile: HumanProfile, seed: number) {
    this.hand = humanSteering(profile, seed);
    // Players pick slightly different spots in the apron to inspect the lamp.
    const aim = 1121 + 24 * profile.jitter / 7 * (2 * rng(seed * 7013 + 17)() - 1);
    this.points = [{ x: 540, y: aim }, { x: 540, y: 1330 }, { x: 128, y: 1270 }, { x: 135, y: 700 }];
  }

  get active(): boolean {
    return this.step < this.points.length && this.sim.spottedBy < 0;
  }

  steer(): FlightAutopilotIntent {
    const { saucer: s, camX, camY, t, suspicion } = this.sim;
    if (this.step === 0) {
      if (suspicion > 0) this.step++;
    } else if (Math.hypot(s.x - this.points[this.step]!.x, s.y - this.points[this.step]!.y) < 65) {
      this.step++;
    }
    const safePause = this.step === 2 && (this.clearSince < 0 || t - this.clearSince < 3);
    if (safePause) {
      if (this.clearSince < 0 && suspicion === 0) this.clearSince = t;
      return this.hand({ down: false, x: s.x - camX, y: s.y - camY }, t, s.x - camX, s.y - camY, 'cool');
    }
    const target = this.points[Math.min(this.step, this.points.length - 1)]!;
    return this.hand(steerTo(this.sim, target, this.step === 0), t, s.x - camX, s.y - camY, this.step === 0 ? 'read' : 'retreat');
  }
}

/** Travel the painted cut through Pruitt's sweep using the usual hand wobble. */
export class NeighboursCut {
  private readonly hand;
  private readonly points;
  private step = 0;

  constructor(private readonly sim: DeepFlightSim, profile: HumanProfile, seed: number) {
    this.hand = humanSteering(profile, seed);
    // The thumb leans toward the next ring while straightening out of the turn.
    const x = 430 + Math.max(0, profile.drift - 10) * 1.1;
    this.points = [{ x: 125, y: 1450 }, { x, y: 1200 }, { x, y: 1030 }];
  }

  get active(): boolean {
    return this.step < this.points.length && this.sim.spottedBy < 0;
  }

  steer(): FlightAutopilotIntent {
    const { saucer: s, camX, camY, t } = this.sim;
    if (Math.hypot(s.x - this.points[this.step]!.x, s.y - this.points[this.step]!.y) < 52) this.step++;
    const target = this.points[Math.min(this.step, this.points.length - 1)]!;
    return this.hand(steerTo(this.sim, target, false), t, s.x - camX, s.y - camY, 'cut');
  }
}
