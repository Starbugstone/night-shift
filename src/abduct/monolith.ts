import type { Rect } from './ragdoll';
import type { Sprite } from './rooms/layout';

export interface BoneToss {
  kind: 'toss';
  name: string;
  sprite: Sprite;
  height: number;
  airtime: number;
  period: number;
  phase: number;
}

export function tossTime(bone: BoneToss, time: number): number {
  return (time + bone.phase) % bone.period;
}

/** A bone returns to its socket with exactly the opposite of its launch velocity. */
export function moveBone(bone: BoneToss, shape: Rect, time: number): void {
  const u = Math.min(1, tossTime(bone, time) / bone.airtime);
  shape.y = bone.sprite.y - 4 * bone.height * u * (1 - u);
  const velocity = -4 * bone.height * (1 - 2 * u) / bone.airtime;
  // The light practice bone yields on contact, like the retracting stone gates.
  shape.vy = u === 1 ? 0 : Math.max(-165, Math.min(165, velocity));
}

export function canPassBone(bone: BoneToss, time: number, duration: number): boolean {
  const t = tossTime(bone, time);
  return t >= bone.airtime && t + duration + 0.6 < bone.period;
}
