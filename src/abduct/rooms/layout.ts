import { ART } from '../../art-manifest';
import type { Pose } from '../ragdoll';
import type { InteriorRoute } from './interior';

export const CEILING = 133;
export const FLOOR = 846;
export const LEFT_WALL = 20;
export const RIGHT_WALL = 520;

export type Human = 'doyle' | 'larry' | 'dave' | 'barb' | 'gary' | 'nigel' | 'kev' | 'mayor'
  // L5 pier code (bubbles is the dolphin: src/abduct/body-plan.ts)
  | 'bubbles' | 'pete' | 'sal'
  // v4 L8
  | 'flint' | 'reed' | 'echo'
  // L7 cruise code
  | 'sterling' | 'marco' | 'greg'
  // L6 clinic code
  | 'hank' | 'osei' | 'pemberton'
  // v4 L9 1955
  | 'doc' | 'buff' | 'marvin'
  // v4 Birch Lane
  | 'mabel' | 'nora' | 'len'
  // v4 1122
  | 'rodney' | 'black_knight' | 'tom_enchanter'
  // v4 1953
  | 'forester' | 'van_bell' | 'collier'
  // v4 2199
  | 'artie' | 'penny' | 'moe';

export interface Sprite {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Furniture {
  sprite: Sprite;
  colliders?: readonly Area[];
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
  interior?: InteriorRoute;
  backdrop: string;
  human: Human;
  pose: Pose;
  furniture: readonly Furniture[];
  masonry?: readonly Area[];
  flue?: Area;
  exit: Sprite;
  exitZone: Area;
  roofExit?: boolean;
  exitMouthY?: number;
  /** Time the specimen must hang steadily in this exit before extraction. */
  exitSettleSec?: number;
  item: { sprite: Sprite; name: string };
  cat?: Sprite;
  fan?: { x: number; y: number; angle: number; speed: number; bladeLength: number };
  cart?: { sprite: Sprite; travel: number; speed: number };
  sign?: Sprite;
  par: number;
  route: readonly Waypoint[];
  /** v4 council: the scene wrapping this room (Field Check) owns the lesson prompt; the room's own stays off. */
  wrapperLessons?: boolean;
  /** How far right to frame the cutaway until the specimen starts moving. */
  spawnLookAhead?: number;
}

export function sprite(key: string, x: number, y: number): Sprite {
  const { w, h } = ART[key]!;
  return { key, x, y, w, h };
}

export function prop(sprite: Sprite, colliders?: readonly Area[]): Furniture {
  return { sprite, colliders, grabbable: true };
}

/** One plank drawn at four lengths, shortest first (scripts/art-shapes/build.mjs). */
const SHELVES = ['room/shelf_stub', 'room/shelf_short', 'room/shelf', 'room/shelf_long'] as const;

/**
 * Shelf art for a plank w wide and h thick: the longest shelf of the family that still covers the plank,
 * drawn in its own shape (art is never stretched). The art may hang a few px below the plank: its brackets.
 */
export function shelfFit(x: number, y: number, w: number, h: number): Sprite {
  let pick: Sprite | undefined;
  for (const key of SHELVES) {
    const art = ART[key]!;
    const drawn = Math.round(w * art.h / art.w);
    if (!pick || drawn >= 0.93 * h) pick = { key, x, y, w, h: drawn };
  }
  return pick!;
}

/** A solid shelf: it collides as the w x h plank, whichever shelf art covers it. */
export function shelfProp(x: number, y: number, w: number, h: number): Furniture {
  return prop(shelfFit(x, y, w, h), [{ x, y, w, h }]);
}

export function bed(x: number): Furniture {
  const y = FLOOR - 140;
  return prop(sprite('room/bed', x, y), [
    { x: x + 17, y: y + 60, w: 269, h: 53 },
    { x: x + 10, y: y + 20, w: 8, h: 40 },
    { x: x + 27, y: y + 51, w: 49, h: 9 },
  ]);
}

export function chair(x: number): Furniture {
  const y = FLOOR - 150;
  return prop(sprite('room/office_chair', x, y), [
    { x: x + 8, y: y + 75, w: 95, h: 23 },
    { x: x + 46, y: y + 98, w: 14, h: 32 },
    { x: x + 14, y: y + 130, w: 84, h: 16 },
    { x: x + 8, y: y + 10, w: 29, h: 65 },
  ]);
}

export const BED_POSE: Pose = {
  neckX: 112, neckY: 736,
  torso: 0.025, head: 3.25,
  nearArm: -0.10, nearForearm: 0.48,
  farArm: -0.23, farForearm: 0.32,
  nearThigh: -0.64, nearShin: 0.95,
  farThigh: -0.76, farShin: 0.93,
};

export const CHAIR_POSE: Pose = {
  neckX: 94, neckY: 650,
  pelvisRadius: 16,
  torso: 1.30, head: -1.03,
  nearArm: 1.54, nearForearm: 0.54,
  farArm: 1.75, farForearm: 0.61,
  nearThigh: 0.22, nearShin: 1.53,
  farThigh: 0.24, farShin: 1.59,
};
