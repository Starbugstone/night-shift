import { en } from '../i18n/en';
import { Joint, STEP, type Ragdoll } from './ragdoll';

const TELL = 0.50;
const STRIDE = 0.40;
const ARMOUR = [Joint.NearHand, Joint.FarHand, Joint.NearElbow, Joint.FarElbow] as const;

/** Every piece remains attached to its original joint until a registered impact releases it. */
export class GrailReaction {
  readonly plates = ARMOUR;
  readonly dropped = new Float64Array(8).fill(-Infinity);
  readonly x = new Float64Array(8);
  readonly y = new Float64Array(8);
  private bonks = 0;
  private pending = '';
  private armed = true;
  private grounded = false;
  retreat = 0;

  constructor(readonly knight: boolean) {}

  position(axis: Float64Array, slot: number): number {
    const joint = axis[ARMOUR[slot % 4]!]!;
    return slot % 4 < 2 ? joint : axis[Joint.Neck]! * 0.65 + joint * 0.35;
  }

  impact(body: Ragdoll, hitX: number, t: number): void {
    if (!this.knight) return;
    let slot = -1, nearest = Infinity;
    for (let i = 0; i < ARMOUR.length; i++) {
      const distance = Math.abs(this.position(body.x, i) - hitX);
      if (this.dropped[i] === -Infinity && distance < nearest) { slot = i; nearest = distance; }
    }
    if (slot < 0) slot = 4 + this.bonks % 4;
    this.dropped[slot] = t;
    this.x[slot] = this.position(body.x, slot);
    this.y[slot] = this.position(body.y, slot);
    this.pending = en.grail.knight[Math.min(this.bonks++, 2)]!;
  }

  step(body: Ragdoll, moved: boolean, wake: number, speaking: boolean): string {
    if (!this.knight && moved) {
      if (wake < 35) this.armed = true;
      if (this.armed && wake >= 55 && this.retreat === 0) {
        this.armed = false;
        this.retreat = TELL + STRIDE;
      }
      if (this.retreat > 0) {
        const before = this.retreat;
        this.retreat = Math.max(0, before - STEP);
        if (before > STRIDE && this.retreat <= STRIDE) {
          this.pending = en.grail.retreat;
          this.grounded = body.supported(Joint.NearFoot) || body.supported(Joint.FarFoot);
        }
        if (this.retreat <= STRIDE) {
          if (this.grounded) {
            for (let j = 0; j < body.x.length; j++) body.kick(j, -22.5, 0);
          } else {
            const kick = Math.sin(this.retreat * 39) * 8;
            body.kick(Joint.NearFoot, kick, 0);
            body.kick(Joint.FarFoot, -kick, 0);
          }
        }
      }
    }
    if (speaking) return '';
    const line = this.pending;
    this.pending = '';
    return line;
  }

  cancel(): void { this.pending = ''; this.retreat = 0; }
}

const SETTLE_SPEED = 28;
const SPEED_SMOOTHING = 1 - Math.exp(-STEP / 0.2);

/** The existing opening takes a steady passenger. Letting go parks the beam. */
export class GrailExit {
  progress = 0;
  inside = false;
  private speed = 0;

  constructor(private x: number, private y: number, private readonly seconds: number) {}

  /** The torso is still enough for the bar to fill rather than drain. */
  get steady(): boolean { return this.speed <= SETTLE_SPEED; }

  step(x: number, y: number, inside: boolean): boolean {
    const speed = Math.hypot(x - this.x, y - this.y) / STEP;
    this.speed += (speed - this.speed) * SPEED_SMOOTHING;
    this.x = x;
    this.y = y;
    this.inside = inside;
    const delta = (this.speed <= SETTLE_SPEED ? STEP : -STEP) / this.seconds;
    this.progress = inside ? Math.min(1, Math.max(0, this.progress + delta)) : 0;
    return this.progress >= 1;
  }
}
