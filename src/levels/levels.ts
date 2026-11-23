import type { RoomId } from '../contracts';
import { LEVEL3, LEVEL4 } from './deep-levels';
import type { DeepLevelDef, LevelDef, LockedCard, TutorialLevelDef } from './types';
import { en } from '../i18n/en';

const PI = Math.PI;

export const LEVELS: readonly LevelDef[] = [
  {
    kind: 'tutorial',
    mugshot: 'human/doyle_head',
    id: 'level1',
    num: 1,
    title: en.levels.level1.title,
    location: en.levels.level1.location,
    blurb: en.levels.level1.blurb,
    human: en.levels.level1.human,
    parSec: 42,
    memo: { re: en.levels.level1.re, body: en.levels.level1.body, joke: en.levels.level1.joke },
    map: {
      theme: 'farm',
      w: 1080,
      h: 1920,
      start: { x: 540, y: 1600 },
      roads: [
        { dir: 'h', at: 1240, from: 0, to: 1080 },
        // farm driveway: T-junction into the county road (overlap is painted plain)
        { dir: 'v', at: 620, from: 700, to: 1240 },
      ],
      groundProps: [
        { key: 'flight/field_rows', kind: 'field', x: 210, y: 1570 },
        { key: 'flight/field_rows', kind: 'field', x: 870, y: 1570 },
        { key: 'flight/field_rows', kind: 'field', x: 190, y: 190 },
        { key: 'flight/field_rows', kind: 'field', x: 520, y: 170, rot: PI / 2 },
      ],
      props: [
        { key: 'flight/barn_top', kind: 'barn', x: 850, y: 500 },
        { key: 'flight/tractor_top', kind: 'tractor', x: 870, y: 790, rot: 0.35 },
        { key: 'flight/haybale_top', kind: 'haybale', x: 720, y: 720 },
        { key: 'flight/haybale_top', kind: 'haybale', x: 760, y: 690 },
        { key: 'flight/haybale_top', kind: 'haybale', x: 990, y: 760 },
        { key: 'flight/haybale_top', kind: 'haybale', x: 1010, y: 690 },
        { key: 'flight/tree_top', kind: 'tree', x: 90, y: 880 },
        { key: 'flight/tree_top', kind: 'tree', x: 200, y: 1000 },
        { key: 'flight/tree_top', kind: 'tree', x: 70, y: 1100 },
        { key: 'flight/tree_top', kind: 'tree', x: 990, y: 960 },
        { key: 'flight/tree_top', kind: 'tree', x: 870, y: 1070 },
        { key: 'flight/tree_top', kind: 'tree', x: 110, y: 470 },
        { key: 'flight/tree_top', kind: 'tree', x: 60, y: 620 },
        { key: 'flight/tree_top', kind: 'tree', x: 990, y: 160 },
        { key: 'flight/tree_top', kind: 'tree', x: 850, y: 140 },
        { key: 'flight/tree_top', kind: 'tree', x: 470, y: 1440 },
        { key: 'flight/tree_top', kind: 'tree', x: 630, y: 1420 },
      ],
      target: { key: 'flight/farmhouse_top', kind: 'farmhouse', x: 420, y: 560 },
      entries: [
        // west bedroom window: farmhouse_top.svg local (2, 140)
        { roomId: 'farm_window', route: 'Window', difficulty: 'easy', x: 292, y: 590, labelSide: 'below' },
        // chimney pot: farmhouse_top.svg local (202, 31)
        { roomId: 'farm_chimney', route: 'Chimney', difficulty: 'fast & risky', x: 492, y: 481, labelSide: 'above' },
      ],
      vehicles: [
        {
          key: 'flight/pickup_top',
          kind: 'pickup',
          path: [
            { x: 60, y: 1240 },
            { x: 620, y: 1240 },
            { x: 620, y: 820 },
          ],
          speed: 120,
          dwell: 1.6,
          coneRange: 300,
          coneHalf: 0.36,
          sweepAmp: 0.38,
          sweepRate: 0.9,
        },
      ],
      dogs: [{ x: 410, y: 770, rMin: 70, rMax: 165, period: 3.2 }],
      neons: [],
      powerLines: [],
      // light spilling from the lit west bedroom window and the two south windows
      lamps: [
        { x: 286, y: 590 },
        { x: 332, y: 664 },
        { x: 506, y: 664 },
      ],
    },
  },
  {
    kind: 'tutorial',
    mugshot: 'human/larry_head',
    id: 'level2',
    num: 2,
    title: en.levels.level2.title,
    location: en.levels.level2.location,
    blurb: en.levels.level2.blurb,
    human: en.levels.level2.human,
    parSec: 48,
    memo: { re: en.levels.level2.re, body: en.levels.level2.body, joke: en.levels.level2.joke },
    map: {
      theme: 'town',
      w: 1080,
      h: 1920,
      start: { x: 540, y: 1600 },
      roads: [
        { dir: 'h', at: 860, from: 0, to: 1080 },
        { dir: 'h', at: 1460, from: 0, to: 1080 },
        { dir: 'v', at: 540, from: 0, to: 1920 },
      ],
      groundProps: [],
      props: [
        { key: 'flight/diner_top', kind: 'diner', x: 290, y: 580 },
        { key: 'flight/house_top', kind: 'house', x: 200, y: 1170 },
        { key: 'flight/house_top', kind: 'house', x: 880, y: 1170 },
        { key: 'flight/house_top', kind: 'house', x: 200, y: 1730 },
        { key: 'flight/house_top', kind: 'house', x: 880, y: 1730 },
        { key: 'flight/house_top', kind: 'house', x: 170, y: 190 },
        { key: 'flight/house_top', kind: 'house', x: 880, y: 170 },
        { key: 'flight/tree_top', kind: 'tree', x: 400, y: 1280 },
        { key: 'flight/tree_top', kind: 'tree', x: 690, y: 1260 },
        { key: 'flight/tree_top', kind: 'tree', x: 400, y: 1640 },
        { key: 'flight/tree_top', kind: 'tree', x: 690, y: 1650 },
        { key: 'flight/tree_top', kind: 'tree', x: 400, y: 120 },
        { key: 'flight/tree_top', kind: 'tree', x: 680, y: 130 },
        { key: 'flight/streetlight_top', kind: 'streetlight', x: 455, y: 950 },
        { key: 'flight/streetlight_top', kind: 'streetlight', x: 625, y: 950 },
        { key: 'flight/streetlight_top', kind: 'streetlight', x: 90, y: 950 },
        { key: 'flight/streetlight_top', kind: 'streetlight', x: 990, y: 950 },
        { key: 'flight/streetlight_top', kind: 'streetlight', x: 455, y: 1550 },
        { key: 'flight/streetlight_top', kind: 'streetlight', x: 625, y: 1550 },
      ],
      target: { key: 'flight/laundromat_top', kind: 'laundromat', x: 790, y: 560 },
      entries: [
        // skylight: laundromat_top.svg local (148, 128)
        { roomId: 'laundry_skylight', route: 'Skylight', difficulty: 'short & risky', x: 788, y: 568, labelSide: 'below' },
        // north loading dock: laundromat_top.svg local (225, -4)
        { roomId: 'laundry_loading', route: 'Loading door', difficulty: 'long & safe', x: 865, y: 436, labelSide: 'above' },
      ],
      vehicles: [
        {
          key: 'flight/van_top',
          kind: 'van',
          path: [
            { x: 50, y: 860 },
            { x: 1030, y: 860 },
          ],
          speed: 150,
          dwell: 1.1,
          coneRange: 290,
          coneHalf: 0.4,
          sweepAmp: 0.18,
          sweepRate: 1.4,
        },
      ],
      dogs: [],
      neons: [{ x: 445, y: 655, r: 160, text: 'EAT' }],
      // Strung along the south kerb of Main St's first block, pole to streetlight.
      // Gaps: Main St (455..625, the short way) and the east yard (860..1080, the long way round).
      powerLines: [
        { ax: 16, ay: 950, bx: 90, by: 950 },
        { ax: 90, ay: 950, bx: 455, by: 950 },
        { ax: 625, ay: 950, bx: 860, by: 950 },
        // service drop to the diner
        { ax: 160, ay: 475, bx: 30, by: 340 },
      ],
      lamps: [
        { x: 455, y: 950 },
        { x: 625, y: 950 },
        { x: 90, y: 950 },
        { x: 990, y: 950 },
        { x: 455, y: 1550 },
        { x: 625, y: 1550 },
      ],
    },
  },
  LEVEL3,
  LEVEL4,
];

/** Coming-soon cards (English; shown via tr().lockedCards). */
export const LOCKED_CARDS: readonly LockedCard[] = en.lockedCards;

export function isDeep(l: LevelDef): l is DeepLevelDef {
  return l.kind === 'deep';
}

export function isTutorial(l: LevelDef): l is TutorialLevelDef {
  return l.kind === 'tutorial';
}

export const ROOM_IDS: readonly RoomId[] = [
  'farm_window',
  'farm_chimney',
  'laundry_skylight',
  'laundry_loading',
  'dave_roof',
  'dave_patio',
  'barb_chimney',
  'barb_backdoor',
  'gary_skylight',
  'gary_garagedoor',
  'nigel_skylight',
  'nigel_loading',
  'kev_vent',
  'kev_fireescape',
  'mayor_clocktower',
  'mayor_elevator',
];

export function isRoomId(s: string): s is RoomId {
  return (ROOM_IDS as readonly string[]).includes(s);
}

/** Every route of a level: tutorial = its two entries, deep = 2 per target. */
export function levelRooms(l: LevelDef): RoomId[] {
  return isDeep(l) ? l.map.targets.flatMap((t) => t.entries.map((e) => e.roomId)) : l.map.entries.map((e) => e.roomId);
}

export function levelIndexForRoom(room: RoomId): number {
  const i = LEVELS.findIndex((l) => levelRooms(l).includes(room));
  return i < 0 ? 0 : i;
}

/** Deep levels: which target (0..2) and entry (0..1) a route belongs to. */
export function deepSlot(l: DeepLevelDef, room: RoomId): { target: number; entry: number } | null {
  for (let t = 0; t < 3; t++)
    for (let e = 0; e < 2; e++) if (l.map.targets[t]!.entries[e]!.roomId === room) return { target: t, entry: e };
  return null;
}

/** Route label ("Window", "Roof hatch"...) for a room in any level. */
export function routeName(room: RoomId): string {
  for (const l of LEVELS) {
    const entries = isDeep(l) ? l.map.targets.flatMap((t) => t.entries) : l.map.entries;
    const e = entries.find((x) => x.roomId === room);
    if (e) return e.route;
  }
  return '—';
}
