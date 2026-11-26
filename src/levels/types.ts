import type { RoomId, Vec2 } from '../contracts';
import type { MapCollectibleDef } from '../flight/collectible';
import type { HazardDef } from '../flight/hazards';
import type { RoamingTroop } from '../flight/roam';
import type { GroundPatch } from '../flight/pier-ground'; // L5 pier code
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
  | 'park'
  | 'crop_field'
  // L5 pier code: every seaside prop (fallback drawn by key in src/flight/pier-ground.ts)
  | 'pier' | 'terrace'
  // v4 easter eggs: decor only (src/flight/easter-eggs.ts), never a detector or a collider
  | 'timecar' | 'iceberg'
  // v4 L9 1955
  | 'sedan55';

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
  recommended?: boolean;
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
  collectible?: MapCollectibleDef;
  fuseSec?: number;
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

interface LevelBase {
  id: LevelId;
  /** All listed orders must be delivered. Omit to use the preceding order. */
  requires?: readonly (LevelId | 'level10' | 'level11')[];
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
export interface DeepTarget<Entries extends EntryDef[] = [EntryDef, EntryDef]> {
  /** Full name for the HUD list, e.g. "Dentist Dave". */
  human: string;
  /** Short name, e.g. "Dave". */
  short: string;
  building: PropDef;
  /** Portrait art key when it is not `human/<short>_head` (the Captain's art is `sterling`). */
  head?: string;
  /** Outdoor troops are collected directly at moving hover rings. */
  troop?: RoamingTroop;
  entries: Entries;
}

type MapTarget = DeepTarget<EntryDef[]>;

export interface DeepMap {
  /** v3 (docs/GDD-3-new-shifts.md): pier = L5 seaside, clinic = L6 hospital campus, ship = L7 cruise ship at sea. */
  theme: 'suburb' | 'city' | 'pier' | 'clinic' | 'ship' | 'badlands' | 'storm55' | 'grail' | 'grimsby2199';
  collectible?: MapCollectibleDef;
  w: number;
  h: number;
  start: Vec2;
  roads: RoadDef[];
  groundProps: PropDef[];
  props: PropDef[];
  targets: [MapTarget] | [MapTarget, MapTarget] | [MapTarget, MapTarget, MapTarget];
  hazards: HazardDef[];
  /** Warm light pools (decor). */
  lamps: Vec2[];
  /** Seconds of continuous exposure that fill the Suspicion fuse (before Hush Drive). Default 1. */
  fuseSec?: number;
  /** L5 pier code: sand and boardwalk patches over the sea (theme 'pier'). */
  ground?: readonly GroundPatch[];
}

/** A live shift with one to three targets and an elapsed or deadline clock. */
export interface DeepLevelDef extends LevelBase {
  kind: 'deep';
  /** Elapsed-time shift with a par and no deadline. */
  clockMode?: 'elapsed';
  elapsedParSec?: number;
  /** Real seconds from the start of the shift to sunrise. */
  budgetSec: number;
  /** Night owl star: finish with at least this many seconds left. */
  parMarginSec: number;
  /** Clock face hours: shift start .. sunrise, e.g. [2, 6]. */
  hours: [number, number];
  map: DeepMap;
}

export function deepPar(level: DeepLevelDef): number {
  return level.elapsedParSec ?? level.budgetSec - level.parMarginSec;
}

export type LevelDef = TutorialLevelDef | DeepLevelDef;
