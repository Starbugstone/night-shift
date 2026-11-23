// Bureau ID photo (docs/GDD-3-new-shifts.md "Report additions" A): keeps the specimen's pose at the
// wildest moment of the attempt (highest summed limb speed relative to the chest, after the first
// second) so the report can redraw it. Works for any joint count (humans 11, the dolphin fewer).
// No allocation per step: four preallocated buffers, copied out once in result().

/** What the capture reads each physics step: the ragdoll satisfies it. */
export interface PhotoSource {
  readonly x: ArrayLike<number>;
  readonly y: ArrayLike<number>;
  readonly chestX: number;
  readonly chestY: number;
}

export interface IdPhoto {
  human: string;
  x: readonly number[];
  y: readonly number[];
}

/** Seconds into the attempt before a pose can be the photo (the lift-off yank is not "wild"). */
export const PHOTO_DELAY = 1;

export class PhotoCapture {
  private readonly lastX: Float64Array;
  private readonly lastY: Float64Array;
  private readonly bestX: Float64Array;
  private readonly bestY: Float64Array;
  private primed = false;
  /** Summed limb travel (px per step) of the kept pose; -1 = nothing kept yet. */
  best = -1;
  /** Attempt time of the kept pose, seconds. */
  bestAt = 0;

  constructor(readonly joints: number) {
    this.lastX = new Float64Array(joints);
    this.lastY = new Float64Array(joints);
    this.bestX = new Float64Array(joints);
    this.bestY = new Float64Array(joints);
  }

  /** Call once per physics step, after the ragdoll stepped. */
  sample(body: PhotoSource, elapsed: number): void {
    const n = Math.min(this.joints, body.x.length);
    const cx = body.chestX;
    const cy = body.chestY;
    let score = 0;
    for (let i = 0; i < n; i++) {
      const rx = body.x[i]! - cx;
      const ry = body.y[i]! - cy;
      if (this.primed) {
        const dx = rx - this.lastX[i]!;
        const dy = ry - this.lastY[i]!;
        score += Math.sqrt(dx * dx + dy * dy);
      }
      this.lastX[i] = rx;
      this.lastY[i] = ry;
    }
    const first = !this.primed;
    this.primed = true;
    if (first || elapsed < PHOTO_DELAY || !(score > this.best)) return;
    this.best = score;
    this.bestAt = elapsed;
    this.bestX.set(this.lastX);
    this.bestY.set(this.lastY);
  }

  /** The kept pose (or the latest one for a very short attempt), relative to the chest. */
  result(human: string): IdPhoto | undefined {
    if (!this.primed) return undefined;
    const kept = this.best >= 0;
    return { human, x: Array.from(kept ? this.bestX : this.lastX), y: Array.from(kept ? this.bestY : this.lastY) };
  }
}
