import { ART } from '../../art-manifest';
import type { Pose } from '../ragdoll';

export type Human = 'doyle' | 'larry';

export interface Sprite {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Furniture {
  sprite: Sprite;
  solid: boolean;
  grabbable: boolean;
}

export interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Waypoint {
  x: number;
  y: number;
  seconds: number;
}

export interface Room {
  backdrop: string;
  human: Human;
  pose: Pose;
  furniture: readonly Furniture[];
  masonry?: readonly Area[];
  exit: Sprite;
  exitZone: Area;
  item: { sprite: Sprite; name: string };
  cat?: Sprite;
  fan?: { x: number; y: number; angle: number; speed: number };
  cart?: { sprite: Sprite; travel: number; speed: number };
  sign?: Sprite;
  par: number;
  route: readonly Waypoint[];
}

export function sprite(key: string, x: number, y: number): Sprite {
  const { w, h } = ART[key]!;
  return { key, x, y, w, h };
}

export function prop(key: string, x: number, y: number, solid = true): Furniture {
  return { sprite: sprite(key, x, y), solid, grabbable: solid };
}

export const BED_POSE: Pose = {
  neckX: 126, neckY: 660,
  torso: 0.13, head: 3.34,
  nearArm: 1.08, nearForearm: 0.60,
  farArm: 1.10, farForearm: 0.08,
  nearThigh: 0.02, nearShin: 0.2,
  farThigh: 0.42, farShin: 0.27,
};

export const CHAIR_POSE: Pose = {
  neckX: 112, neckY: 585,
  torso: 1.38, head: -1.23,
  nearArm: 1.82, nearForearm: 0.04,
  farArm: 1.72, farForearm: 0.43,
  nearThigh: 0.09, nearShin: 1.31,
  farThigh: 0.27, farShin: 1.44,
};
