import type { FlightAutopilotIntent, Vec2 } from '../../src/contracts';
import type { DeepFlightSim } from '../../src/flight/deep-sim';
import { SAUCER } from '../../src/flight/sim';
import type { LevelId } from '../../src/levels/save';
import { bakeryGate, bakeryPie } from '../../src/levels/deep-birch-bakery';
import { BIRCH_CUT } from '../../src/levels/deep-birch-neighbours';
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

const PIE_APPROACH = [{ x: 140, y: 1250 }, { x: 140, y: 560 }, bakeryPie];
// 2026-11-26 openings: up the east verge, then along the top of Mrs. Pruitt's sweep to the gnome.
const GNOME_APPROACH = [{ x: 1620, y: 1520 }, { x: 1620, y: 560 }, { x: 1275, y: 560 }, { x: 1275, y: 605 }];

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
    // 2026-11-26 openings: they come up Birch Lane from Main Street and inspect the lamp from just inside its trigger.
    const aim = bakeryGate.y + 211 + 24 * profile.jitter / 7 * (2 * rng(seed * 7013 + 17)() - 1);
    this.points = [{ x: bakeryGate.x, y: aim }, { x: bakeryGate.x, y: 1300 }, { x: 128, y: 1240 }, { x: 135, y: 700 }];
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

/**
 * Follow the painted east verge and the cut into Len's yard with the usual hand wobble. A practised
 * player waits at the mouth of the cut for Mrs. Pruitt to look south ("Cross when she looks away") and
 * also waits out her amber page-turn tell. A first evening follows the paint straight through and is
 * caught when she happens to look north.
 */
export class NeighboursCut {
  private readonly hand;
  private readonly points;
  private readonly readsTell: boolean;
  private readonly reaction: number;
  private goAt = Infinity;
  private step = 0;

  constructor(private readonly sim: DeepFlightSim, profile: HumanProfile, seed: number) {
    this.hand = humanSteering(profile, seed);
    this.readsTell = profile.reaction < 0.25;
    this.reaction = profile.reaction;
    // The thumb leans toward the rings (west) while running up the verge, then follows the painted cut.
    const lean = Math.max(0, profile.drift - 10) * 1.1;
    const x = 1615 - lean;
    this.points = [{ x: 1620, y: 1480 }, { x, y: 1000 }, { x, y: 720 }, BIRCH_CUT.from, { x: BIRCH_CUT.to.x, y: BIRCH_CUT.to.y + lean }];
  }

  get active(): boolean {
    return this.step < this.points.length && this.sim.spottedBy < 0;
  }

  steer(): FlightAutopilotIntent {
    const { saucer: s, camX, camY, t, field } = this.sim;
    const mouth = this.step === 3;
    if (Math.hypot(s.x - this.points[this.step]!.x, s.y - this.points[this.step]!.y) < 52) {
      if (!mouth) this.step++;
      else {
        // She looks south on her first bearing (BIRCH_NEIGHBOURS hazard 0, angles[0]).
        const away = !this.readsTell || (field.a[0]! > 0.14 && !field.tell[0]);
        if (!away) this.goAt = Infinity;
        else if (this.goAt === Infinity) this.goAt = t + this.reaction;
        if (t >= this.goAt) this.step++;
      }
    }
    const target = this.points[Math.min(this.step, this.points.length - 1)]!;
    return this.hand(steerTo(this.sim, target, this.step === 3 && this.readsTell), t, s.x - camX, s.y - camY, 'cut');
  }
}
