import type { AbductAutopilotIntent } from '../contracts';
import type { InteriorSimulation } from './interior';
import { POINT } from './point';
import { clamp, type Ragdoll } from './ragdoll';
import type { Room } from './rooms/layout';

export const PILOT_CRUISE = 41;
/**
 * The slowest drag pace, as a multiple of PILOT_CRUISE (1.5 × 41 ≈ 62 px/s), that a real player keeps
 * up through a whole shift: slower than every human-model profile, faster than the solvability bot's
 * glacial 1×. Every deep shift played at this pace by the perfect-hand autopilot must end inside its
 * clock with a 5% margin on every tested seed (tests/difficulty/honest-pace.ts, in `npm run difficulty`),
 * and the browser playthrough (scripts/e2e-playthrough.cjs) never drags slower. v0.2 council round 2,
 * Opus F1: at 1× the L10 and L12 clocks ran out on the autopilot.
 */
export const SLOWEST_HONEST_PACE = 1.5;
// v0.2 difficulty: the live touch path caps the beam at POINT.max, so the pilot never plans a faster dart.
const PILOT_DART = POINT.max;

export class AbductPilot {
  private index = 0;
  private lastTime = -1;
  private committed = false;
  /** After committing to a timed crossing, hold still until then (see FOLLOW.pilotDelay). */
  private crossAt = -1;
  private trainingSpeed = 0;
  private readonly intent: AbductAutopilotIntent = { dx: 0, dy: 0 };
  /** L6: checkpoint index whose probe drone is being served (-1 = none), and where to aim the beam. */
  private probing = -1;
  private readonly probeAim = { x: 0, y: 0 };
  /** Where the last move() steers the beam and how fast (px/s; 0 = hold still). For pointing drivers. */
  aimX = 0;
  aimY = 0;
  speed = 0;

  /** `pace` scales every drag speed (difficulty evaluator: people drag faster than the proof bot). */
  constructor(private readonly room: Room, public pace = 1) {}

  /** Index of the checkpoint being steered to (difficulty reports name where a run stalled). */
  get checkpoint(): number { return this.index; }

  /**
   * Go back to the last checkpoint the body actually reached, nearest (x, y): what a person does
   * when the body snags and the beam has run on ahead. Never rewinds past a crossing it committed to.
   */
  rewindTo(x: number, y: number): void {
    const checkpoints = this.room.interior?.checkpoints;
    if (!checkpoints) return;
    let best = this.index;
    let distance = Infinity;
    for (let i = Math.min(this.index, checkpoints.length - 1); i >= 0; i--) {
      const c = checkpoints[i]!;
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < distance) {
        distance = d;
        best = i;
      }
      if (i < this.index && checkpoints[i]!.cross) break;
    }
    if (best < this.index) {
      this.committed = false;
      this.probing = -1;
    }
    this.index = best;
  }

  move(body: Ragdoll, time: number, interior: InteriorSimulation | undefined): AbductAutopilotIntent {
    const dt = this.lastTime < 0 ? 1 / 30 : clamp(time - this.lastTime, 0, 0.075);
    this.lastTime = time;
    const { intent } = this;
    intent.dx = 0;
    intent.dy = 0;
    this.speed = 0;
    if (this.room.interior && interior) {
      const { checkpoints } = this.room.interior;
      let checkpoint = checkpoints[this.index];
      // L6 clinic code: at a probe point, steer the named joint into the drone's ring until the reading is in
      const probes = interior.probes;
      if (checkpoint?.probe !== undefined && probes && (this.probing === this.index || Math.hypot(checkpoint.x - body.beamX, checkpoint.y - body.beamY) < 1)) {
        if (!probes.drones[checkpoint.probe]!.settled) {
          this.probing = this.index;
          probes.aim(checkpoint.probe, body, this.probeAim);
          const base = checkpoint.speed ?? PILOT_CRUISE;
          return this.delta(this.probeAim.x, this.probeAim.y, body, dt, Math.max(base, Math.min(base * this.pace, PILOT_DART)));
        }
        if (this.probing === this.index) {
          this.probing = -1;
          checkpoint = checkpoints[++this.index];
          this.committed = false;
        }
      }
      if (checkpoint && Math.hypot(checkpoint.x - body.beamX, checkpoint.y - body.beamY) < 1) {
        checkpoint = checkpoints[++this.index];
        this.committed = false;
      }
      if (!checkpoint) return intent;
      const base = checkpoint.speed ?? PILOT_CRUISE;
      // A faster hand speeds up the cruise, but no dart beats the touch speed cap (POINT.max).
      const speed = Math.max(base, Math.min(base * this.pace, PILOT_DART));
      if (checkpoint.cross && !this.committed) {
        const from = checkpoints[this.index - 1]!;
        if (Math.hypot(body.chestX - from.x, body.chestY - from.y) > 41 ||
            !interior.canCross(from, checkpoint, time, speed)) return intent;
        this.committed = true;
        this.crossAt = time + body.follow.pilotDelay;
      }
      if (checkpoint.cross && time < this.crossAt) return intent;
      return this.delta(checkpoint.x, checkpoint.y, body, dt, speed);
    }

    let target = this.room.route[this.index];
    if (target && Math.hypot(target.x - body.beamX, target.y - body.beamY) < 1) {
      target = this.room.route[++this.index];
      this.trainingSpeed = 0;
    }
    if (!target) return intent;
    if (this.trainingSpeed === 0) this.trainingSpeed = Math.hypot(target.x - body.beamX, target.y - body.beamY) / target.seconds;
    return this.delta(target.x, target.y, body, dt, this.trainingSpeed);
  }

  private delta(x: number, y: number, body: Ragdoll, dt: number, speed: number): AbductAutopilotIntent {
    this.aimX = x;
    this.aimY = y;
    this.speed = speed;
    const dx = x - body.beamX;
    const dy = y - body.beamY;
    const limit = dt * speed;
    const distance = Math.hypot(dx, dy);
    if (distance > 0) {
      const ratio = Math.min(1, limit / distance);
      this.intent.dx = dx * ratio;
      this.intent.dy = dy * ratio;
    }
    return this.intent;
  }
}
