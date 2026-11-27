// L7 "A Whole Cruise Ship": the SS Buffet Royale, at sea (docs/GDD-3-new-shifts.md, L7). Map data only.
//
// The ship runs bow-north down the middle of the map (src/flight/ship-hull.ts draws it), open sea all
// round. The flight signature is the deck photographer (src/flight/photographer.ts): stop near one and
// you are framed, the iris closes, then the exact frame exposes for a second. Also a radar mast whose
// two opposite cones turn steadily, deck stewards with torches, gulls, bunting and a casino sign.
import { ART } from '../art-manifest';
import type { HazardDef } from '../flight/hazards';
import { SHIP_LEFT, SHIP_RIGHT } from '../flight/ship-hull';
import { en } from '../i18n/en';
import type { DeepLevelDef, DeepTarget, EntryDef, PropDef } from './types';

const PI = Math.PI;
const L7 = en.levels.level7;

/** World position of a feature on a building sprite (docs/ART_ANCHORS.md "v3 hero buildings", native sprite px). */
function anchor(b: PropDef, ax: number, ay: number): { x: number; y: number } {
  const spec = ART[b.key]!;
  const w = b.w ?? spec.w;
  const h = b.h ?? spec.h;
  return { x: Math.round(b.x - w / 2 + (ax * w) / spec.w), y: Math.round(b.y - h / 2 + (ay * h) / spec.h) };
}

function entry(b: PropDef, roomId: EntryDef['roomId'], a: [number, number], labelSide: 'above' | 'below'): EntryDef {
  const p = anchor(b, a[0], a[1]);
  const { route, difficulty } = en.routes[roomId];
  return { roomId, route, difficulty, x: p.x, y: p.y, labelSide };
}

const lifeboat = (x: number, y: number): PropDef => ({ key: 'flight/lifeboat_top', kind: 'highrise', x, y, tint: '#e07a3a' });
const funnel = (x: number, y: number): PropDef => ({ key: 'flight/funnel_top', kind: 'civic', x, y, tint: '#7a4a6a' });

// ====================================================================== the three hero roofs

const BRIDGE: PropDef = { key: 'flight/ship_bridge_top', kind: 'civic', x: 1080, y: 1060, tint: '#e8e2d4' };
// v4 openings (2026-11-26): the galley sits on the starboard side and the lido further aft, so a boarder from
// the port rail crosses the open deck to reach either.
const GALLEY: PropDef = { key: 'flight/ship_galley_top', kind: 'civic', x: 1280, y: 1850, tint: '#d9d2c4' };
const LIDO: PropDef = { key: 'flight/ship_lido_top', kind: 'civic', x: 1260, y: 2820, tint: '#3f8f8a' };

const L7_TARGETS: [DeepTarget, DeepTarget, DeepTarget] = [
  {
    human: 'Captain Sterling',
    short: 'Captain',
    head: 'human/sterling_head',
    building: BRIDGE,
    entries: [entry(BRIDGE, 'captain_mast', [90, 60], 'above'), entry(BRIDGE, 'captain_funnel', [250, 110], 'below')],
  },
  {
    human: 'Chef Marco',
    short: 'Marco',
    building: GALLEY,
    entries: [entry(GALLEY, 'marco_skylight', [140, 60], 'above'), entry(GALLEY, 'marco_promenade', [268, 160], 'below')],
  },
  {
    human: 'Greg',
    short: 'Greg',
    building: LIDO,
    entries: [entry(LIDO, 'greg_awning', [90, 70], 'above'), entry(LIDO, 'greg_cabin', [300, 206], 'below')],
  },
];

// ====================================================================== hazards

/** A deck photographer at (x, y): the fixed frame leaves a short sideways dodge. */
const photographer = (x: number, y: number, range: number, facing: number): HazardDef =>
  ({ type: 'photographer', x, y, range, halfW: 80, halfH: 64, facing });

/** A steward walking a promenade with a torch. */
const steward = (x0: number, y0: number, x1: number, y1: number, phase: number): HazardDef => ({
  type: 'steward',
  path: [{ x: x0, y: y0 }, { x: x1, y: y1 }],
  speed: 75,
  dwell: 1.4,
  phase,
  coneRange: 210,
  coneHalf: 0.42,
  sweepAmp: 0.35,
  sweepRate: 1.6,
});

// The radar mast, aft of the bridge: two opposite cones turning steadily (one turn ≈ 12.6 s, so any
// one spot is swept every 6.3 s for about 1.2 s).
const RADAR = { x: 1080, y: 1270, range: 330, half: 0.3, amp: 0, rate: 0, phase: 0, mount: 'radar', spin: 0.5 } as const;

/**
 * An insomniac passenger's cabin window on the hull side: lights a pool on the sea beside the ship on
 * a cycle, flickering first. `side` -1 = port (west), +1 = starboard (east).
 */
function porthole(side: -1 | 1, y: number, period: number, on: number, phase: number): HazardDef {
  const edge = side < 0 ? SHIP_LEFT : SHIP_RIGHT;
  return { type: 'window', wx: edge - side * 8, wy: y, x: edge + side * 100, y, r: 105, period, on, phase };
}

const L7_HAZARDS: HazardDef[] = [
  // Doris, Mrs. Pruitt's sister, on her lido lounger with the family binoculars, all night, every night.
  // v4 openings (2026-11-26): she watches the deck lane from the port rail to Greg's lido, the way on,
  // not the arrival (the saucer now comes alongside from the open sea, off the port rail).
  {
    type: 'watcher',
    name: 'Doris',
    x: 1020,
    y: 2710,
    range: 480,
    half: 0.57,
    angles: [-2.81],
    hold: 3,
    sweepAmp: 0.3,
    sweepRate: 0.8,
  },
  // cabin windows along both sides of the hull: the sea lanes beside the ship are not free
  porthole(-1, 1180, 4.8, 2.0, 0.4),
  porthole(-1, 1650, 5.2, 2.2, 2.1),
  porthole(-1, 2840, 4.6, 2.0, 3.3),
  porthole(-1, 3020, 5.0, 2.2, 1.2),
  porthole(1, 1180, 5.0, 2.0, 2.8),
  porthole(1, 1650, 4.6, 2.2, 0.9),
  porthole(1, 2120, 5.2, 2.0, 1.7),
  porthole(1, 2600, 4.8, 2.2, 3.6),
  // deck CCTV on both funnels, sweeping the open deck between the three roofs
  { type: 'camera', x: 1080, y: 1540, range: 300, half: 0.3, base: PI / 2, amp: 1.15, rate: 0.95, phase: 0 },
  { type: 'camera', x: 1080, y: 2190, range: 300, half: 0.3, base: -PI / 2, amp: 1.15, rate: 1.05, phase: 1.7 },
  // the galley's own CCTV on its roof corner, sweeping the promenade door (the skylight is the photographer's)
  // v4 difficulty curve (Neon P7): 245 px so it no longer stacks onto the aft funnel camera's sweep
  // v0.2 council round 2: half-angle 0.28 → 0.25 (skilled Ghost above casual again)
  { type: 'camera', x: 1410, y: 1762, range: 265, half: 0.25, base: 1.65, amp: 0.7, rate: 0.9, phase: 0.6 },
  // Greg's neighbour in the next cabin keeps switching the light on: it lights the porthole ring
  { type: 'window', wx: 1412, wy: 2932, x: 1400, y: 2920, r: 95, period: 5.0, on: 4.15, phase: 1.1 },
  // v4 openings (2026-11-26): the officers of the watch on the port bridge wing and the deck below it look
  // aft down the port deck, the way a boarder from the port rail comes to the bridge (the clean way in is
  // up the starboard side or round the bow).
  { type: 'camera', x: 872, y: 1016, range: 400, half: 0.45, base: 1.46, amp: 0, rate: 0, phase: 0 },
  { type: 'camera', x: 872, y: 1236, range: 400, half: 0.45, base: 1.94, amp: 0, rate: 0, phase: 0 },
  // v4 openings: the galley's west-door CCTV looks across the open deck towards the port rail.
  { type: 'camera', x: 1100, y: 1850, range: 450, half: 0.65, base: 2.1, amp: 0, rate: 0, phase: 0 },
  { type: 'camera', ...RADAR, base: 0 },
  { type: 'camera', ...RADAR, base: PI },
  // photographers: on the foredeck by the bridge, midships by the galley, aft by the lido
  // v4 difficulty curve (Neon P7): the foredeck frame stops at 275 px, clear of the bridge radar's sweep
  photographer(1080, 760, 275, PI / 2),
  photographer(1120, 1640, 320, 0),
  photographer(1180, 3190, 290, PI / 2),
  // stewards on both promenades, out of step
  steward(700, 1300, 700, 2480, 0),
  steward(1460, 2480, 1460, 1300, 520),
  // and one crossing the aft deck in front of the lido
  steward(720, 2400, 1440, 2400, 300),
  // bunting strung from the funnel to both rails, a gap in the middle
  { type: 'wire', kind: 'bunting', ax: SHIP_LEFT + 30, ay: 2250, bx: 1000, by: 2250 },
  { type: 'wire', kind: 'bunting', ax: 1160, ay: 2250, bx: SHIP_RIGHT - 30, by: 2250 },
  // the casino sign, starboard, between the galley and the lido
  { type: 'neon', x: 1330, y: 2160, r: 115, text: 'CASINO', billboard: false },
  // gulls circling the ship
  {
    type: 'flock',
    kind: 'gull',
    path: [
      { x: 300, y: 420 },
      { x: 1880, y: 700 },
      { x: 1900, y: 3000 },
      { x: 260, y: 2700 },
    ],
    speed: 260,
    r: 50,
    phase: 0,
  },
];

export const LEVEL7: DeepLevelDef = {
  kind: 'deep',
  id: 'level7',
  title: L7.title,
  location: L7.location,
  blurb: L7.blurb,
  human: L7.human,
  mugshot: 'human/sterling_head',
  budgetSec: 480,
  parMarginSec: 134,
  hours: [1, 6],
  memo: { re: L7.re, body: L7.body, joke: L7.joke },
  map: {
    theme: 'ship',
    fuseSec: 0.9, // v4 difficulty curve (Neon P1)
    // v4 map collectibles: the shrimp tower buffet cart on the aft port promenade.
    collectible: { id: 'shrimp_tower', x: 758, y: 2962 },
    w: 2160,
    h: 3600,
    start: { x: 170, y: 2330 },
    roads: [],
    groundProps: [],
    props: [
      funnel(1080, 1480),
      funnel(1080, 2250),
      lifeboat(SHIP_LEFT + 36, 1380),
      lifeboat(SHIP_LEFT + 36, 1700),
      lifeboat(SHIP_LEFT + 36, 2100),
      lifeboat(SHIP_LEFT + 36, 2440),
      lifeboat(SHIP_RIGHT - 36, 1380),
      lifeboat(SHIP_RIGHT - 36, 1700),
      lifeboat(SHIP_RIGHT - 36, 2100),
      lifeboat(SHIP_RIGHT - 36, 2440),
      // v4 easter eggs: a small iceberg in open water off the port bow, well clear of the painted hull,
      // seen from the port rail on the way to the bridge (decor, src/flight/easter-eggs.ts)
      { key: 'flight/iceberg', kind: 'iceberg', x: 470, y: 700 },
    ],
    targets: L7_TARGETS,
    hazards: L7_HAZARDS,
    lamps: [],
  },
};
