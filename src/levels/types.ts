import type { RoomId, Vec2 } from '../contracts';
import type { HazardDef } from '../flight/hazards';
import type { LevelId } from './save';

/** What to draw when a sprite is missing. */
export type PropKind =
  | 'farmhouse'
  | 'barn'
  | 'field'
  | 'tractor'
  | 'tree'
  | 'haybale'
  | 'laundromat'
  | 'diner'
  | 'house'
  | 'streetlight'
  // v2
  | 'suburb_house'
  | 'highrise'
  | 'civic'
  | 'pool'
  | 'trampoline'
  | 'hedge'
  | 'park';

/** A sprite placed by its centre. Size defaults to the manifest size. */
export interface PropDef {
  key: string;
  kind: PropKind;
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** Radians, clockwise. */
  rot?: number;
  /** Fallback roof colour (v2 primitives). */
  tint?: string;
}

/** Horizontal road: centre line y = at, from x = from..to. Vertical: x = at, y = from..to. */
export interface RoadDef {
  dir: 'h' | 'v';
  at: number;
  from: number;
  to: number;
}

export interface EntryDef {
  roomId: RoomId;
  /** e.g. "Window" */
  route: string;
  /** e.g. "easy" */
  difficulty: string;
  x: number;
  y: number;
  /** Where the label pill sits relative to the ring. */
  labelSide: 'above' | 'below';
}

export interface VehicleDef {
  key: 'flight/pickup_top' | 'flight/van_top';
  kind: 'pickup' | 'van';
  /** Polyline driven back and forth. */
  path: Vec2[];
  speed: number;
  /** Seconds paused (turning round, headlights sweeping) at each end. */
  dwell: number;
  coneRange: number;
  /** Half-angle of the headlight cone, radians. */
  coneHalf: number;
  /** Extra side-to-side sweep, radians. */
  sweepAmp: number;
  sweepRate: number;
}

export interface DogDef {
  x: number;
  y: number;
  rMin: number;
  rMax: number;
  /** Seconds per pulse. */
  period: number;
}

export interface NeonDef {
  x: number;
  y: number;
  r: number;
  text: string;
}

export interface PowerLineDef {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export interface FlightMap {
  theme: 'farm' | 'town';
  w: number;
  h: number;
  start: Vec2;
  roads: RoadDef[];
  /** Drawn first (fields, ground-level stuff). */
  groundProps: PropDef[];
  props: PropDef[];
  target: PropDef;
  entries: [EntryDef, EntryDef];
  vehicles: VehicleDef[];
  dogs: DogDef[];
  neons: NeonDef[];
  powerLines: PowerLineDef[];
  /** Warm light pools (decor). */
  lamps: Vec2[];
}

export interface LockedCard {
  title: string;
  requires: string;
  blurb: string;
}

interface LevelBase {
  id: LevelId;
  num: number;
  title: string;
  location: string;
  /** Card blurb on Work Orders. */
  blurb: string;
  human: string;
  /** Head sprite for the Work Orders mugshot. */
  mugshot: string;
  memo: { re: string; body: string; joke: string };
}

/** L1, L2: one target, one flight, one room. */
export interface TutorialLevelDef extends LevelBase {
  kind: 'tutorial';
  parSec: number;
  map: FlightMap;
}

/** One specimen's building in a deep level. */
export interface DeepTarget {
  /** Full name for the HUD list, e.g. "Dentist Dave". */
  human: string;
  /** Short name, e.g. "Dave". */
  short: string;
  building: PropDef;
  /** Both rings lead into the same interior. */
  entries: [EntryDef, EntryDef];
}

export interface DeepMap {
  theme: 'suburb' | 'city';
  w: number;
  h: number;
  start: Vec2;
  roads: RoadDef[];
  groundProps: PropDef[];
  props: PropDef[];
  targets: [DeepTarget, DeepTarget, DeepTarget];
  hazards: HazardDef[];
  /** Warm light pools (decor). */
  lamps: Vec2[];
  /** Seconds of continuous exposure that fill the Suspicion fuse (before Hush Drive). Default 1. */
  fuseSec?: number;
}

/** L3+: three specimens, one big map, a sunrise clock. */
export interface DeepLevelDef extends LevelBase {
  kind: 'deep';
  /** Real seconds from the start of the shift to sunrise. */
  budgetSec: number;
  /** Night owl star: finish with at least this many seconds left. */
  parMarginSec: number;
  /** Clock face hours: shift start .. sunrise, e.g. [2, 6]. */
  hours: [number, number];
  map: DeepMap;
}

export type LevelDef = TutorialLevelDef | DeepLevelDef;
