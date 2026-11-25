import type { Vec2 } from '../contracts';
import { LOCK, RING_R } from './sim';

export interface RoamingTroop {
  quota: number;
  trails: readonly { home: Vec2; lookout: Vec2 }[];
}

/** A single shift owns the tally, including through cave visits and sightings. */
export class TroopTally {
  readonly caught = new Set<number>();

  constructor(readonly troop: RoamingTroop) {}

  get full(): boolean {
    return this.caught.size >= this.troop.quota;
  }

  catch(index: number): boolean {
    if (this.full || !this.troop.trails[index] || this.caught.has(index)) return false;
    this.caught.add(index);
    return true;
  }
}

export function troopTallies(targets: readonly { troop?: RoamingTroop }[]): (TroopTally | undefined)[] {
  return targets.map(t => t.troop && new TroopTally(t.troop));
}

export class RoamingApe {
  x: number;
  y: number;
  facing = 0;
  pose: 'walk' | 'scratch' | 'gawk' | 'bolt' = 'walk';
  private dash = 0;
  private awayX = 0;
  private awayY = 0;
  private startled = false;

  constructor(readonly home: Vec2, readonly lookout: Vec2, readonly offset: number, t: number) {
    const k = this.trailFraction(t);
    this.x = home.x + (lookout.x - home.x) * k;
    this.y = home.y + (lookout.y - home.y) * k;
  }

  private trailFraction(t: number): number {
    const beat = (t + this.offset) % 14;
    if (beat < 2) { this.pose = 'scratch'; return 0; }
    if (beat < 7) { this.pose = 'walk'; return (beat - 2) / 5; }
    if (beat < 9) { this.pose = 'gawk'; return 1; }
    this.pose = 'walk';
    return (14 - beat) / 5;
  }

  step(t: number, dt: number, ship: Vec2): void {
    const k = this.trailFraction(t);
    const dx = this.x - ship.x;
    const dy = this.y - ship.y;
    const distance = Math.hypot(dx, dy);
    if (distance > RING_R * 2) this.startled = false;
    if (!this.startled && distance <= RING_R * LOCK.insideFrac) {
      this.startled = true;
      this.dash = 0.26;
      this.awayX = distance > 1 ? dx / distance : 1;
      this.awayY = distance > 1 ? dy / distance : 0;
    }
    let vx = this.home.x + (this.lookout.x - this.home.x) * k - this.x;
    let vy = this.home.y + (this.lookout.y - this.home.y) * k - this.y;
    const step = Math.min(1, 42 * dt / (Math.hypot(vx, vy) || 1));
    vx *= step;
    vy *= step;
    if (this.dash > 0) {
      const dashStep = 105 * Math.min(dt, this.dash);
      this.dash -= dt;
      this.pose = 'bolt';
      vx = this.awayX * dashStep;
      vy = this.awayY * dashStep;
    }
    this.x += vx;
    this.y += vy;
    if (vx || vy) this.facing = Math.atan2(vy, vx) + Math.PI / 2;
  }
}
