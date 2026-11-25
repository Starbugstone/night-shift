// L9's optional pickup. All times are seconds since the shift started.
import type { Vec2 } from '../contracts';
import { LOCK, LockOn, type Saucer } from './sim';

export const TIME_CAR = {
  bay: { x: 820, y: 1740 },
  turnout: { x: 650, y: 1550 },
  launch: 13,
  opens: 15,
  strike: 20,
  launchSpeed: 70,
  acceleration: 52,
  radius: 80,
  relativeSpeed: 55,
  hold: 0.85,
} as const;

const CLOCK_START = 22 * 3600 + 3 * 60 + 40;
const CLOCK_EPSILON = 1e-9;

export function crestValleyClock(elapsed: number): number {
  return CLOCK_START + Math.floor(elapsed + CLOCK_EPSILON);
}

export type TimeCarPhase = 'parked' | 'rolling' | 'open' | 'caught' | 'missed';

export class TimeCar {
  readonly position: Vec2;
  speed = 0;
  elapsed = 0;
  phase: TimeCarPhase = 'parked';
  matchPrompt = false;
  matching = false;
  private readonly lock = new LockOn(TIME_CAR.hold);

  constructor(private readonly bay: Readonly<Vec2>) {
    this.position = { ...bay };
  }

  get progress(): number { return this.lock.fraction; }
  get visible(): boolean { return this.phase !== 'caught' && this.phase !== 'missed'; }

  /** Called by the shift even when flight control is suspended. */
  advance(elapsed: number): void {
    this.elapsed = Math.max(this.elapsed, elapsed);
    if (this.elapsed < TIME_CAR.strike && this.elapsed + CLOCK_EPSILON >= TIME_CAR.strike) this.elapsed = TIME_CAR.strike;
    if (!this.visible) return;
    const t = this.elapsed + CLOCK_EPSILON;
    const motionTime = Math.max(0, Math.min(TIME_CAR.strike, this.elapsed) - TIME_CAR.launch);
    const accelTime = Math.max(0, motionTime - (TIME_CAR.opens - TIME_CAR.launch));
    this.position.y = this.bay.y - motionTime * TIME_CAR.launchSpeed - TIME_CAR.acceleration * accelTime ** 2 / 2;
    this.speed = t < TIME_CAR.launch ? 0 : TIME_CAR.launchSpeed + TIME_CAR.acceleration * accelTime;
    this.phase = t >= TIME_CAR.strike ? 'missed' : t >= TIME_CAR.opens ? 'open' : t >= TIME_CAR.launch ? 'rolling' : 'parked';
    if (this.phase === 'missed') this.resetHover();
  }

  resetHover(): void {
    this.lock.reset();
    this.matchPrompt = false;
    this.matching = false;
  }

  update(dt: number, saucer: Saucer, specimenRing: number): boolean {
    if (this.phase !== 'open') return false;
    if (specimenRing >= 0) {
      this.resetHover();
      return false;
    }
    const inside = saucer.stun <= 0
      && Math.hypot(saucer.x - this.position.x, saucer.y - this.position.y) <= TIME_CAR.radius * LOCK.insideFrac;
    const matched = inside && Math.hypot(saucer.vx, saucer.vy + this.speed) <= TIME_CAR.relativeSpeed;
    this.matching = matched;
    this.matchPrompt = inside && !matched;
    // The opening frame cannot credit time from before the ring opened.
    if (!this.lock.update(Math.min(dt, this.elapsed - TIME_CAR.opens + CLOCK_EPSILON), matched ? 0 : -1)) return false;
    this.phase = 'caught';
    return true;
  }
}
