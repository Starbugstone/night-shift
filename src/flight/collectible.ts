import type { GameContext, MapCollectibleId, Vec2 } from '../contracts';
import { P_RING, P_TWINKLE, PC, type Particles } from '../core/fx';
import { TimeCar } from './time-car';
import { LockOn, RING_R, ringUnder, type Saucer } from './sim';

export interface MapCollectibleDef extends Vec2 {
  id: MapCollectibleId;
  /**
   * Optional: someone shouting about the pickup from a nearby window (the tail tip, world px); the
   * line is `tr().mapCollectibles.items[id].shout`. It cycles while the pickup is still there.
   */
  shout?: Vec2;
}

/** One optional pickup per map. Keep the same instance across flight legs within a shift. */
export class MapCollectible {
  private readonly lock = new LockOn();
  private readonly ring: readonly Vec2[];
  readonly timeCar: TimeCar | null;
  collected = false;

  constructor(readonly def: MapCollectibleDef) {
    this.ring = [def];
    this.timeCar = def.id === 'time_car' ? new TimeCar(def) : null;
  }

  get progress(): number {
    return this.timeCar?.progress ?? this.lock.fraction;
  }

  get collectedId(): MapCollectibleId | undefined {
    return this.collected ? this.def.id : undefined;
  }

  get position(): Readonly<Vec2> { return this.timeCar?.position ?? this.def; }

  get available(): boolean { return !this.collected && (this.timeCar?.visible ?? true); }

  resetHover(): void {
    this.timeCar?.resetHover();
    this.lock.reset();
  }

  /** Reuse the ape hover thresholds. An overlapping specimen ring takes priority. */
  update(dt: number, s: Saucer, speed: number, specimenRing: number): boolean {
    if (this.collected) return false;
    if (this.timeCar) {
      this.collected = this.timeCar.update(dt, s, specimenRing);
      return this.collected;
    }
    if (specimenRing >= 0) {
      this.resetHover();
      return false;
    }
    const idx = s.stun > 0 ? -1 : ringUnder(s.x, s.y, speed, this.ring, RING_R);
    this.collected = this.lock.update(dt, idx);
    return this.collected;
  }
}

export function mapPickupFeedback(ctx: GameContext, fx: Particles, { x, y }: Readonly<Vec2>): number {
  ctx.audio.sfx('pickup');
  if (!ctx.reducedMotion) {
    fx.spawn(P_RING, x, y, 0, 0, 0.45, 106, PC.mint);
    fx.burst(P_TWINKLE, x, y, 5, 70, 150, 0.5, 8, PC.mint, 0, 2);
  }
  return 2.4;
}
