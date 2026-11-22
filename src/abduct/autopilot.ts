import type { AbductAutopilotIntent } from '../contracts';
import type { InteriorSimulation } from './interior';
import { clamp, type Ragdoll } from './ragdoll';
import type { Room } from './rooms/layout';

export const PILOT_CRUISE = 41;

export class AbductPilot {
  private index = 0;
  private lastTime = -1;
  private committed = false;
  private trainingSpeed = 0;
  private readonly intent: AbductAutopilotIntent = { dx: 0, dy: 0 };

  constructor(private readonly room: Room) {}

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
      const speed = checkpoint.speed ?? PILOT_CRUISE;
      if (checkpoint.cross && !this.committed) {
        const from = checkpoints[this.index - 1]!;
        if (Math.hypot(body.chestX - from.x, body.chestY - from.y) > 41 ||
            !interior.canCross(from, checkpoint, time, speed)) return intent;
        this.committed = true;
      }
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
