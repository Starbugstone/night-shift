import type { AbductAutopilotIntent } from '../contracts';
import type { InteriorSimulation } from './interior';
import { clamp, type Ragdoll } from './ragdoll';
import type { Room } from './rooms/layout';

export const PILOT_CRUISE = 41;
const PILOT_DART = 320;

export class AbductPilot {
  private index = 0;
  private lastTime = -1;
  private committed = false;
  /** After committing to a timed crossing, hold still until then (see FOLLOW.pilotDelay). */
  private crossAt = -1;
  private trainingSpeed = 0;
  private readonly intent: AbductAutopilotIntent = { dx: 0, dy: 0 };

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
    for (let i = this.index; i >= 0; i--) {
      const c = checkpoints[i]!;
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < distance) {
        distance = d;
        best = i;
      }
      if (i < this.index && checkpoints[i]!.cross) break;
    }
    if (best < this.index) this.committed = false;
    this.index = best;
  }

  move(body: Ragdoll, time: number, interior: InteriorSimulation | undefined): AbductAutopilotIntent {
    const dt = this.lastTime < 0 ? 1 / 30 : clamp(time - this.lastTime, 0, 0.075);
    this.lastTime = time;
    const { intent } = this;
    intent.dx = 0;
    intent.dy = 0;
    if (this.room.interior && interior) {
      const { checkpoints } = this.room.interior;
      let checkpoint = checkpoints[this.index];
      if (checkpoint && Math.hypot(checkpoint.x - body.beamX, checkpoint.y - body.beamY) < 1) {
        checkpoint = checkpoints[++this.index];
        this.committed = false;
      }
      if (!checkpoint) return intent;
      const base = checkpoint.speed ?? PILOT_CRUISE;
      // A faster hand speeds up the cruise, but nobody darts much faster than ~320 px/s.
      const speed = Math.max(base, Math.min(base * this.pace, PILOT_DART));
      if (checkpoint.cross && !this.committed) {
        const from = checkpoints[this.index - 1]!;
        if (Math.hypot(body.chestX - from.x, body.chestY - from.y) > 41 ||
            !interior.canCross(from, checkpoint, time, speed)) return intent;
        this.committed = true;
        this.crossAt = time + body.follow.pilotDelay;
      }
      if (checkpoint.cross && time < this.crossAt) return intent;
      return this.delta(checkpoint.x - body.beamX, checkpoint.y - body.beamY, dt * speed);
    }

    let target = this.room.route[this.index];
    if (target && Math.hypot(target.x - body.beamX, target.y - body.beamY) < 0.01) {
      target = this.room.route[++this.index];
      this.trainingSpeed = 0;
    }
    if (!target) return intent;
    const dx = target.x - body.beamX;
    const dy = target.y - body.beamY;
    if (this.trainingSpeed === 0) this.trainingSpeed = Math.hypot(dx, dy) / target.seconds;
    return this.delta(dx, dy, dt * this.trainingSpeed);
  }

  private delta(dx: number, dy: number, limit: number): AbductAutopilotIntent {
    const distance = Math.hypot(dx, dy);
    if (distance > 0) {
      const ratio = Math.min(1, limit / distance);
      this.intent.dx = dx * ratio;
      this.intent.dy = dy * ratio;
    }
    return this.intent;
  }
}
