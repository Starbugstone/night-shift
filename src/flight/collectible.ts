import type { GameContext, MapCollectibleId, Vec2 } from '../contracts';
import { P_RING, P_TWINKLE, PC, type Particles } from '../core/fx';
import { LockOn, RING_R, ringUnder, type Saucer } from './sim';

export interface MapCollectibleDef extends Vec2 {
  id: MapCollectibleId;
}

/** One optional pickup per map. Keep the same instance across flight legs within a shift. */
export class MapCollectible {
  private readonly lock = new LockOn();
  private readonly ring: readonly Vec2[];
  collected = false;

  constructor(readonly def: MapCollectibleDef) {
    this.ring = [def];
  }

  get progress(): number {
    return this.lock.fraction;
  }

  get collectedId(): MapCollectibleId | undefined {
    return this.collected ? this.def.id : undefined;
  }

  resetHover(): void {
    this.lock.reset();
  }

  /** Reuse the ape hover thresholds. An overlapping specimen ring takes priority. */
  update(dt: number, s: Saucer, speed: number, specimenRing: number): boolean {
    if (this.collected) return false;
    if (specimenRing >= 0) {
      this.resetHover();
      return false;
    }
    const idx = s.stun > 0 ? -1 : ringUnder(s.x, s.y, speed, this.ring, RING_R);
    this.collected = this.lock.update(dt, idx);
    return this.collected;
  }
}

export function mapPickupFeedback(ctx: GameContext, fx: Particles, { x, y }: MapCollectibleDef): number {
  ctx.audio.sfx('pickup');
  if (!ctx.reducedMotion) {
    fx.spawn(P_RING, x, y, 0, 0, 0.45, 106, PC.mint);
    fx.burst(P_TWINKLE, x, y, 5, 70, 150, 0.5, 8, PC.mint, 0, 2);
  }
  return 2.4;
}
