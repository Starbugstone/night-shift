// L5 "Pier Pressure" (Barnacle Bay, seaside): map data (docs/GDD-3-new-shifts.md, L5).
// The sea fills the east and the north, the promenade boardwalk runs down the shore, the pier runs
// out to Pete's lighthouse, whose beam sweeps the whole bay. Hide in the shadows of tall things.
import { ART } from '../art-manifest';
import type { HazardDef } from '../flight/hazards';
import type { LighthouseHazard, ShadowCaster } from '../flight/lighthouse';
import type { GroundPatch } from '../flight/pier-ground';
import type { DeepLevelDef, DeepTarget, EntryDef, PropDef } from './types';

/** World position of a feature on a building sprite (docs/ART_ANCHORS.md "v3 hero buildings"). */
function anchor(b: PropDef, ax: number, ay: number): { x: number; y: number } {
  const spec = ART[b.key]!;
  const w = b.w ?? spec.w;
  const h = b.h ?? spec.h;
  return { x: Math.round(b.x - w / 2 + (ax * w) / spec.w), y: Math.round(b.y - h / 2 + (ay * h) / spec.h) };
}

function entry(b: PropDef, roomId: EntryDef['roomId'], route: string, difficulty: string, a: [number, number], labelSide: 'above' | 'below'): EntryDef {
  const p = anchor(b, a[0], a[1]);
  return { roomId, route, difficulty, x: p.x, y: p.y, labelSide };
}

const pier = (key: string, x: number, y: number, rot = 0): PropDef => ({ key: 'flight/' + key, kind: 'pier', x, y, rot });

// ---------------------------------------------------------------- places

const W = 2160;
const H = 3360;
/** The shore: sand west of the promenade, sea east of it and north of the beach. */
const SHORE_X = 1180;
const BEACH_TOP = 260;
const PIER_Y = 1700;

const PARK: PropDef = { key: 'flight/marine_park_top', kind: 'pier', x: 560, y: 820 };
const LIGHTHOUSE: PropDef = { key: 'flight/lighthouse_top', kind: 'pier', x: 1950, y: PIER_Y };
const MARKET: PropDef = { key: 'flight/fish_market_top', kind: 'pier', x: 700, y: 2560 };

const TARGETS: [DeepTarget, DeepTarget, DeepTarget] = [
  {
    human: 'Bubbles',
    short: 'Bubbles',
    building: PARK,
    entries: [
      entry(PARK, 'bubbles_roof', 'Roof panel', 'sea lion, keep damp', [250, 70], 'above'),
      entry(PARK, 'bubbles_tunnel', 'Service tunnel', 'flooded, jellyfish', [60, 250], 'below'),
    ],
  },
  {
    human: 'Harbourmaster Pete',
    short: 'Pete',
    building: LIGHTHOUSE,
    entries: [
      entry(LIGHTHOUSE, 'pete_gallery', 'Lamp gallery', 'turning lens', [110, 62], 'above'),
      entry(LIGHTHOUSE, 'pete_slipway', 'Down the tower', 'stairs & slipway', [110, 198], 'below'),
    ],
  },
  {
    human: 'Sal',
    short: 'Sal',
    building: MARKET,
    entries: [
      entry(MARKET, 'sal_loft', 'Ice chute', 'climb the draught', [80, 60], 'above'),
      entry(MARKET, 'sal_dock', 'Cold store', 'Kipper & crates', [284, 150], 'below'),
    ],
  },
];

// Tall props: each one throws a shadow wedge away from the lamp.
const BOATS: PropDef[] = [
  pier('boat_moored_top', 1390, 2320, 0.2),
  pier('boat_moored_top', 1460, 2700, -0.1),
  pier('boat_moored_top', 1360, 1240, 0.1),
  pier('boat_moored_top', 1420, 860, -0.2),
  pier('boat_moored_top', 1500, 520, 0.15),
];
const CRANE = pier('harbour_crane_top', 1000, 2240);
const TOWER = pier('lifeguard_tower_top', 1170, 3010);
const MARKET_SHED = pier('beach_hut_top', 930, 2520);

const caster = (p: PropDef, r: number, len: number): ShadowCaster => ({ x: p.x, y: p.y, r, len });
const CASTERS: ShadowCaster[] = [
  caster(PARK, 170, 700),
  caster(MARKET, 150, 700),
  caster(CRANE, 80, 620),
  caster(TOWER, 70, 700),
  caster(MARKET_SHED, 52, 500),
  ...BOATS.map((b) => caster(b, 60, 760)),
];

/** A full pass can fill the fuse. The preview gives enough time to head for the nearest shadow. */
const LIGHT: LighthouseHazard = {
  type: 'lighthouse',
  x: LIGHTHOUSE.x,
  y: LIGHTHOUSE.y,
  period: 7.5,
  half: 0.61,
  range: 3200,
  phase: 2.3,
  lead: 0.65,
  casters: CASTERS,
};

const HAZARDS: HazardDef[] = [
  LIGHT,
  // the harbour patrol boat: a loop of the inner harbour north of the pier, headlight forward
  {
    type: 'car',
    key: 'flight/patrol_boat_top',
    role: 'patrol',
    path: [
      { x: 1420, y: 380 },
      { x: 2060, y: 380 },
      { x: 2060, y: 1460 },
      { x: 1420, y: 1460 },
    ],
    loop: true,
    speed: 190,
    dwell: 0,
    phase: 0,
    coneRange: 300,
    coneHalf: 0.34,
    sweepAmp: 0.18,
    sweepRate: 1.4,
    barR: 0,
  },
  // gulls: one loop over the beach, one over the outer harbour
  {
    type: 'flock',
    kind: 'gull',
    path: [
      { x: 220, y: 1300 },
      { x: 1080, y: 1200 },
      { x: 1100, y: 1960 },
      { x: 260, y: 2050 },
    ],
    speed: 230,
    r: 48,
    phase: 0,
  },
  {
    type: 'flock',
    kind: 'gull',
    path: [
      { x: 1380, y: 1950 },
      { x: 2080, y: 2050 },
      { x: 2040, y: 3000 },
      { x: 1400, y: 2900 },
    ],
    speed: 250,
    r: 48,
    phase: 700,
  },
  // bunting along the pier rails and across the promenade (gaps to fly through)
  { type: 'wire', kind: 'bunting', ax: 1290, ay: PIER_Y - 70, bx: 1560, by: PIER_Y - 70 },
  { type: 'wire', kind: 'bunting', ax: 1290, ay: PIER_Y + 70, bx: 1560, by: PIER_Y + 70 },
  { type: 'wire', kind: 'bunting', ax: 900, ay: 2050, bx: 1150, by: 2050 },
  { type: 'wire', kind: 'bunting', ax: 1300, ay: 2050, bx: 1560, by: 2050 },
  // the chip kiosk's sign scrambles steering
  { type: 'neon', x: 960, y: 2920, r: 120, text: 'CHIPS', billboard: false },
];

const GROUND: GroundPatch[] = [
  { key: 'flight/ground_sand', x: 0, y: BEACH_TOP, w: SHORE_X, h: H - BEACH_TOP },
  { key: 'flight/boardwalk_v', x: SHORE_X, y: BEACH_TOP, w: 90, h: H - BEACH_TOP },
  { key: 'flight/boardwalk_h', x: SHORE_X + 90, y: PIER_Y - 45, w: LIGHTHOUSE.x - 110 - SHORE_X - 90, h: 90 },
];

const LAMPS = [
  { x: SHORE_X + 45, y: 760 },
  { x: SHORE_X + 45, y: 1400 },
  { x: SHORE_X + 45, y: 2000 },
  { x: SHORE_X + 45, y: 2640 },
  { x: SHORE_X + 45, y: 3200 },
];

export const LEVEL5: DeepLevelDef = {
  kind: 'deep',
  id: 'level5',
  title: 'Pier Pressure',
  location: 'Barnacle Bay · seaside',
  blurb: 'A dolphin, a lighthouse and a fish accountant.',
  human: 'Bubbles, Pete & Sal',
  mugshot: 'human/bubbles_head',
  budgetSec: 450,
  parMarginSec: 140,
  hours: [1, 6],
  memo: {
    re: 'Work Order #{num} — Barnacle Bay (species revision)',
    body:
      "The Mayor's desk flagged an unaccounted crate down at Barnacle Bay—and Head Office now doubts humans are even the second-smartest species here. Grab Bubbles the dolphin, Harbourmaster Pete, and Sal. Hide behind tall things from the lighthouse. Keep the mammal damp.",
    joke:
      'We tried whales once; the paperwork ran four volumes. If Bubbles offers legal advice, ignore her—you are not authorised to lose an argument to a mammal who outranks you.',
  },
  map: {
    theme: 'pier',
    // v4 map collectibles: the unaccounted OBELISK™ shipping crate on the boardwalk slip in a boat's lighthouse shadow.
    collectible: { id: 'obelisk_crate', x: 1225, y: 2505 },
    w: W,
    h: H,
    start: { x: 1070, y: 3200 },
    roads: [],
    ground: GROUND,
    groundProps: [],
    props: [
      ...BOATS,
      CRANE,
      TOWER,
      MARKET_SHED,
      pier('chip_kiosk_top', 960, 2920),
      pier('beach_hut_top', 220, 1600),
      pier('beach_hut_top', 330, 1600),
      pier('beach_hut_top', 440, 1600),
      pier('beach_hut_top', 280, 3000),
      pier('beach_hut_top', 390, 3000),
      ...LAMPS.map((l): PropDef => ({ key: 'flight/streetlight_top', kind: 'streetlight', x: l.x, y: l.y })),
    ],
    targets: TARGETS,
    hazards: HAZARDS,
    lamps: LAMPS,
  },
};
