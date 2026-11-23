// L3 and L4: the deep levels (docs/GDD-2-deeper.md). Map data only.
import { ART } from '../art-manifest';
import { TRAFFIC_LANE, type HazardDef } from '../flight/hazards';
import type { DeepLevelDef, DeepTarget, EntryDef, PropDef } from './types';

const PI = Math.PI;

/**
 * World position of a feature on a building sprite, from docs/ART_ANCHORS.md (native sprite px,
 * top-left origin), so each entry ring sits on something you can see.
 */
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

const tree = (x: number, y: number): PropDef => ({ key: 'flight/tree_top', kind: 'tree', x, y });
const sub = (k: 'a' | 'b' | 'c', x: number, y: number, rot = 0): PropDef => ({
  key: `flight/house_suburb_${k}`,
  kind: 'suburb_house',
  x,
  y,
  rot,
  tint: k === 'a' ? '#5a6aa0' : k === 'b' ? '#8a5a6a' : '#5f7f70',
});
const hedge = (x: number, y: number, rot = 0): PropDef => ({ key: 'flight/hedge_h', kind: 'hedge', x, y, rot });

/** Unrotated footprint of a prop, world px. */
function box(b: PropDef): { x0: number; y0: number; x1: number; y1: number } {
  const spec = ART[b.key]!;
  const w = b.w ?? spec.w;
  const h = b.h ?? spec.h;
  return { x0: b.x - w / 2, y0: b.y - h / 2, x1: b.x + w / 2, y1: b.y + h / 2 };
}

/**
 * Motion-sensor light on a house wall: trips if you linger 0.4 s within 110 px, then lights
 * 200 px for 3 s. North/south walls take a world x along the wall, east/west walls a world y.
 */
function porch(house: PropDef, wall: 'n' | 's' | 'e' | 'w', along: number): HazardDef {
  const b = box(house);
  const x = wall === 'e' ? b.x1 : wall === 'w' ? b.x0 : along;
  const y = wall === 'n' ? b.y0 : wall === 's' ? b.y1 : along;
  return { type: 'porch', x, y, trigger: 110, r: 200 };
}
/** The same light on its own garden post, out in a yard or a drive. */
const yardLight = (x: number, y: number): HazardDef => ({ type: 'porch', x, y, trigger: 110, r: 200, mount: 'post' });

// ====================================================================== L3

const DAVE: PropDef = { key: 'flight/dave_house_top', kind: 'suburb_house', x: 620, y: 820, tint: '#6b5f9a' };
const BARB: PropDef = { key: 'flight/barb_house_top', kind: 'suburb_house', x: 1620, y: 760, tint: '#9a6a4a' };
const GARY: PropDef = { key: 'flight/gary_house_top', kind: 'suburb_house', x: 1560, y: 2010, tint: '#5a7a5a' };
const PRUITT: PropDef = { key: 'flight/pruitt_house_top', kind: 'suburb_house', x: 790, y: 1240, tint: '#7a5a8a' };
const PRUITT_WIN = anchor(PRUITT, 145, 123);
// houses that carry porch lights
const N_A = sub('a', 1360, 1240);
const SW_B = sub('b', 860, 1720);
const SE_B = sub('b', 1340, 1730);
const SE_A = sub('a', 1340, 2240);
const E_B = sub('b', 2040, 1900);

const L3_TARGETS: [DeepTarget, DeepTarget, DeepTarget] = [
  {
    human: 'Dentist Dave',
    short: 'Dave',
    building: DAVE,
    entries: [
      entry(DAVE, 'dave_roof', 'Roof hatch', 'attic, swingy', [73, 69], 'above'),
      entry(DAVE, 'dave_patio', 'Patio door', 'creaky stairs', [188, 189], 'below'),
    ],
  },
  {
    human: 'Coach Barb',
    short: 'Barb',
    building: BARB,
    entries: [
      entry(BARB, 'barb_chimney', 'Chimney', 'short, sooty', [70, 116], 'below'),
      entry(BARB, 'barb_backdoor', 'Back door', 'long, Biscuit', [199, 25], 'above'),
    ],
  },
  {
    human: 'Gary, Neighbourhood Watch',
    short: 'Gary',
    building: GARY,
    entries: [
      entry(GARY, 'gary_skylight', 'Skylight', 'lasers', [199, 77], 'above'),
      entry(GARY, 'gary_garagedoor', 'Garage door', 'timed door', [225, 183], 'below'),
    ],
  },
];

const L3_HAZARDS: HazardDef[] = [
  // the cruiser's loop: Birch Lane, up Maple Court, Court Road, all of East St, back along Elm Ave
  {
    type: 'car',
    key: 'flight/police_top',
    role: 'police',
    path: [
      { x: 300, y: 1500 },
      { x: 1080, y: 1500 },
      { x: 1080, y: 420 },
      { x: 1860, y: 420 },
      { x: 1860, y: 2460 },
      { x: 300, y: 2460 },
    ],
    loop: true,
    speed: 380,
    dwell: 0,
    phase: 5200,
    coneRange: 340,
    coneHalf: 0.38,
    sweepAmp: 0.16,
    sweepRate: 2.2,
    barR: 110,
  },
  // Mrs. Pruitt, binoculars at the upstairs window: snaps between the street, Dave's roof and the park
  {
    type: 'watcher',
    name: 'Mrs. Pruitt',
    x: PRUITT_WIN.x,
    y: PRUITT_WIN.y,
    range: 640,
    half: 0.22,
    angles: [0.1, -2.05, 0.8, -0.45, -1.9, 1.35, 0.35, -0.9],
    hold: 1.8,
    sweepAmp: 0.3,
    sweepRate: 1.9,
  },
  // Gary's own CCTV, on the garage corner, sweeping his drive and roof
  { type: 'camera', x: 1440, y: 1930, range: 300, half: 0.3, base: 0.35, amp: 0.6, rate: 1.3, phase: 0 },
  // motion-sensor lights on the walls along the way
  porch(SE_A, 'w', 2290),
  porch(SW_B, 'n', 820),
  porch(SE_B, 'n', 1370),
  porch(N_A, 'n', 1300),
  yardLight(860, 560),
  porch(N_A, 'e', 1250),
  yardLight(420, 2000),
  porch(E_B, 'n', 2000),
  porch(PRUITT, 'w', 1300),
  // Lights by the doors: each lights its ring (~170-200 px) without being tripped from it, and its
  // trigger sits across the obvious way in. Come in from the side or wait out the 3 s.
  yardLight(718, 1080),
  yardLight(859, 861),
  porch(DAVE, 'e', 741),
  yardLight(1560, 961),
  porch(BARB, 'e', 840),
  // Gary's own motion lights on posts: the drive, the side return and the back garden
  yardLight(1515, 2205),
  yardLight(1780, 1960),
  yardLight(1600, 1785),
  // yard dogs: one in Dave's garden by the patio, one on Barb's back step between her chimney and back door
  { type: 'dog', x: 760, y: 968, rMin: 55, rMax: 175, period: 1.9, phase: 0 },
  { type: 'dog', x: 1589, y: 620, rMin: 55, rMax: 175, period: 2.0, phase: 0.8 },
  // bats: one loop round the north houses, one zig-zag over the south blocks
  {
    type: 'flock',
    kind: 'bat',
    path: [
      { x: 160, y: 320 },
      { x: 2000, y: 360 },
      { x: 1960, y: 1220 },
      { x: 220, y: 1120 },
    ],
    speed: 280,
    r: 46,
    phase: 0,
  },
  {
    type: 'flock',
    kind: 'bat',
    path: [
      { x: 180, y: 1780 },
      { x: 1980, y: 2240 },
      { x: 1980, y: 1720 },
      { x: 180, y: 2260 },
    ],
    speed: 300,
    r: 46,
    phase: 900,
  },
  {
    type: 'flock',
    kind: 'bat',
    path: [
      { x: 1300, y: 1250 },
      { x: 2040, y: 1350 },
      { x: 1500, y: 2700 },
      { x: 1200, y: 2000 },
    ],
    speed: 320,
    r: 50,
    phase: 300,
  },
  // power lines along the north kerb of Birch Lane and Elm Avenue (gaps at Maple Court and the ends)
  { type: 'wire', kind: 'power', ax: 20, ay: 1420, bx: 480, by: 1420 },
  { type: 'wire', kind: 'power', ax: 480, ay: 1420, bx: 960, by: 1420 },
  { type: 'wire', kind: 'power', ax: 1200, ay: 1420, bx: 1640, by: 1420 },
  { type: 'wire', kind: 'power', ax: 20, ay: 2380, bx: 520, by: 2380 },
  { type: 'wire', kind: 'power', ax: 520, ay: 2380, bx: 940, by: 2380 },
  { type: 'wire', kind: 'power', ax: 1220, ay: 2380, bx: 1700, by: 2380 },
  { type: 'wire', kind: 'power', ax: 1700, ay: 2380, bx: 2140, by: 2380 },
  // service drop into Gary's garage (he wired the monitors himself)
  { type: 'wire', kind: 'power', ax: 1700, ay: 2380, bx: 1760, by: 2130 },
  // jokes
  { type: 'gag', kind: 'sprinkler', x: 640, y: 2080, bx: 0, by: 0 },
  { type: 'gag', kind: 'tripwire', x: 1470, y: 2150, bx: 1560, by: 2150 },
];

export const LEVEL3: DeepLevelDef = {
  kind: 'deep',
  id: 'level3',
  num: 3,
  title: 'Cul-de-Sac Sweep',
  location: 'Maple Court · suburbia',
  blurb: 'Three specimens. One cruiser. One Mrs. Pruitt.',
  human: 'Dave, Barb & Gary',
  mugshot: 'human/gary_head',
  // A perfect bot needs ~220 s; humans need room for a retry or two. Night owl = done by 260 s.
  budgetSec: 420,
  parMarginSec: 160,
  hours: [2, 6],
  memo: {
    re: 'Work Order #0003 — Maple Court (bulk order)',
    body:
      'Training is over. Maple Court has three specimens: Dentist Dave, Coach Barb and Gary, who runs the Neighbourhood Watch from his garage. Collect all three before sunrise. A police cruiser circles the block. Mrs. Pruitt watches the street through binoculars. She has not slept since 1994.',
    joke:
      'Gary has rigged his garage with laser tripwires to catch prowlers. In eleven years they have caught Gary eleven times. Please do not be the twelfth thing.',
  },
  map: {
    theme: 'suburb',
    w: 2160,
    h: 2880,
    start: { x: 1080, y: 2700 },
    roads: [
      { dir: 'h', at: 2460, from: 0, to: 2160 },
      // L-corners run on to the far kerb so the corner square is filled
      { dir: 'v', at: 1080, from: 360, to: 2460 },
      { dir: 'h', at: 1500, from: 240, to: 1860 },
      { dir: 'v', at: 300, from: 1440, to: 2460 },
      { dir: 'v', at: 1860, from: 420, to: 2460 },
      { dir: 'h', at: 420, from: 1020, to: 1920 },
    ],
    groundProps: [
      { key: 'flight/pool_top', kind: 'pool', x: 400, y: 1080 },
      { key: 'flight/pool_top', kind: 'pool', x: 1700, y: 1000 },
      { key: 'flight/pool_top', kind: 'pool', x: 680, y: 1880 },
      { key: 'flight/trampoline_top', kind: 'trampoline', x: 1500, y: 2320 },
      { key: 'flight/trampoline_top', kind: 'trampoline', x: 1700, y: 1280 },
    ],
    props: [
      // north of Birch Lane
      sub('a', 300, 560),
      sub('c', 1380, 200),
      sub('b', 2000, 200),
      sub('b', 300, 1250),
      N_A,
      sub('c', 2030, 1300),
      PRUITT,
      // south-west block
      sub('a', 520, 1720),
      SW_B,
      sub('c', 520, 2230),
      sub('a', 860, 2230),
      // south-east block
      SE_B,
      SE_A,
      // outside the loop
      sub('c', 120, 1900),
      E_B,
      sub('a', 500, 2700),
      sub('c', 1640, 2700),
      hedge(620, 1980),
      hedge(860, 1980),
      hedge(1300, 1985),
      hedge(990, 1180, PI / 2),
      tree(140, 760),
      tree(940, 760),
      tree(1220, 700),
      tree(2040, 700),
      tree(560, 1060),
      tree(2000, 2180),
      tree(160, 2200),
      tree(300, 2700),
      tree(820, 2680),
      tree(1380, 2700),
      tree(1900, 2700),
      tree(1080, 220),
      tree(760, 280),
      tree(1600, 240),
      { key: 'flight/streetlight_top', kind: 'streetlight', x: 980, y: 1420 },
      { key: 'flight/streetlight_top', kind: 'streetlight', x: 1180, y: 1420 },
      { key: 'flight/streetlight_top', kind: 'streetlight', x: 960, y: 2380 },
      { key: 'flight/streetlight_top', kind: 'streetlight', x: 1200, y: 2380 },
    ],
    targets: L3_TARGETS,
    hazards: L3_HAZARDS,
    lamps: [
      { x: 980, y: 1420 },
      { x: 1180, y: 1420 },
      { x: 960, y: 2380 },
      { x: 1200, y: 2380 },
      PRUITT_WIN,
    ],
  },
};

// ====================================================================== L4

// West Ave and East Ave run 480..600 and 1560..1680: the museum and the club stand 10 px off them
const MUSEUM: PropDef = { key: 'flight/museum_top', kind: 'civic', x: 790, y: 2960, tint: '#b8ad94' };
const CLUB: PropDef = { key: 'flight/club_top', kind: 'civic', x: 1410, y: 2060, tint: '#3a2f5a' };
const CITYHALL: PropDef = { key: 'flight/cityhall_top', kind: 'civic', x: 1080, y: 430, tint: '#8f8a7a' };

const L4_TARGETS: [DeepTarget, DeepTarget, DeepTarget] = [
  {
    human: 'Night Guard Nigel',
    short: 'Nigel',
    building: MUSEUM,
    entries: [
      entry(MUSEUM, 'nigel_skylight', 'Skylight', 'dino maze, lasers', [122, 94], 'above'),
      entry(MUSEUM, 'nigel_loading', 'Loading bay', 'gift shop', [332, 161], 'below'),
    ],
  },
  {
    human: 'DJ Kev',
    short: 'Kev',
    building: CLUB,
    entries: [
      entry(CLUB, 'kev_vent', 'Roof vent', 'bass & fans', [195, 76], 'above'),
      entry(CLUB, 'kev_fireescape', 'Fire escape', 'past Tiny', [27, 162], 'below'),
    ],
  },
  {
    human: 'Mayor Whitlock',
    short: 'Mayor',
    building: CITYHALL,
    entries: [
      entry(CITYHALL, 'mayor_clocktower', 'Clock tower', 'gears', [250, 84], 'above'),
      entry(CITYHALL, 'mayor_elevator', 'Elevator shaft', 'moving car', [83, 184], 'below'),
    ],
  },
];

const hr = (k: 'a' | 'b' | 'c', x: number, y: number): PropDef => ({
  key: `flight/highrise_${k}`,
  kind: 'highrise',
  x,
  y,
  tint: k === 'a' ? '#3d4466' : k === 'b' ? '#4a3d5e' : '#35505a',
});

// highrises that carry cameras or insomniac windows
const HR_SE = hr('a', 1880, 2840);
const HR_W = hr('b', 240, 2240);
const HR_E = hr('c', 1880, 1300);
const HR_MID = hr('a', 730, 1300);
const HR_NW = hr('c', 260, 960);
const HR_NE = hr('b', 1900, 1000);
const HR_PLAZA = hr('c', 1060, 2150);

/**
 * An insomniac office window on one facade of a highrise, lighting a pool on the street in front
 * of that facade. North/south facades take a world x, east/west facades a world y.
 */
function win(b: PropDef, facade: 'n' | 's' | 'e' | 'w', along: number, period: number, on: number, phase: number): HazardDef {
  const r = box(b);
  const INSET = 10;
  const REACH = 95;
  const nx = facade === 'e' ? 1 : facade === 'w' ? -1 : 0;
  const ny = facade === 's' ? 1 : facade === 'n' ? -1 : 0;
  const ex = facade === 'e' ? r.x1 : facade === 'w' ? r.x0 : along;
  const ey = facade === 's' ? r.y1 : facade === 'n' ? r.y0 : along;
  return { type: 'window', wx: ex - nx * INSET, wy: ey - ny * INSET, x: ex + nx * REACH, y: ey + ny * REACH, r: 105, period, on, phase };
}

/** A sweeping camera on a roof, `inset` px in from the given corner's parapets. */
function roofCam(b: PropDef, corner: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's', cam: Omit<Extract<HazardDef, { type: 'camera' }>, 'type' | 'x' | 'y'>, inset = 14): HazardDef {
  const r = box(b);
  const x = corner === 'n' || corner === 's' ? (r.x0 + r.x1) / 2 : corner.endsWith('w') ? r.x0 + inset : r.x1 - inset;
  const y = corner.startsWith('n') ? r.y0 + inset : r.y1 - inset;
  return { type: 'camera', x, y, ...cam };
}

const L4_HAZARDS: HazardDef[] = [
  // police helicopter: a big loop over the middle of town, searchlight circling
  { type: 'heli', cx: 1080, cy: 1800, rx: 620, ry: 1000, period: 22, phase: 0, spotR: 150, spotDist: 210, spotRate: 1.6 },
  // two patrol cars up and down the avenues
  {
    type: 'car',
    key: 'flight/police_top',
    role: 'patrol',
    // turns round north of the ring road, never parked across its traffic
    path: [
      { x: 540, y: 760 },
      { x: 540, y: 3280 },
    ],
    loop: false,
    speed: 340,
    dwell: 0.9,
    phase: 0,
    coneRange: 320,
    coneHalf: 0.36,
    sweepAmp: 0.12,
    sweepRate: 2,
    barR: 0,
  },
  {
    type: 'car',
    key: 'flight/police_top',
    role: 'patrol',
    path: [
      { x: 1620, y: 3280 },
      { x: 1620, y: 760 },
    ],
    loop: false,
    speed: 320,
    dwell: 0.9,
    phase: 1400,
    coneRange: 320,
    coneHalf: 0.36,
    sweepAmp: 0.12,
    sweepRate: 2,
    barR: 0,
  },
  // traffic: the ring road (south) and Market St (middle), both ways, one lane either side of the line
  { type: 'traffic', dir: 'h', at: 3420 - TRAFFIC_LANE, from: 0, to: 2160, sign: 1, speed: 380, gap: 560, offset: 0, coneRange: 210, coneHalf: 0.32, keys: ['flight/taxi_top', 'flight/sedan_top'] },
  { type: 'traffic', dir: 'h', at: 3420 + TRAFFIC_LANE, from: 0, to: 2160, sign: -1, speed: 340, gap: 640, offset: 200, coneRange: 210, coneHalf: 0.32, keys: ['flight/sedan_top', 'flight/taxi_top', 'flight/sedan_top'] },
  { type: 'traffic', dir: 'h', at: 1600 - TRAFFIC_LANE, from: 0, to: 2160, sign: 1, speed: 360, gap: 600, offset: 120, coneRange: 200, coneHalf: 0.32, keys: ['flight/taxi_top'] },
  { type: 'traffic', dir: 'h', at: 1600 + TRAFFIC_LANE, from: 0, to: 2160, sign: -1, speed: 360, gap: 620, offset: 400, coneRange: 200, coneHalf: 0.32, keys: ['flight/sedan_top'] },
  // rooftop cameras: the museum roof (sweeps skylight and loading bay), City Hall, and the route
  roofCam(MUSEUM, 'ne', { range: 300, half: 0.3, base: 2.25, amp: 0.65, rate: 1.2, phase: 0 }, 15),
  roofCam(CITYHALL, 'se', { range: 300, half: 0.3, base: -2.3, amp: 0.55, rate: 1.4, phase: 1 }),
  // the Bassment's own camera, on its north-west corner, sweeping the roof vent and the fire escape
  roofCam(CLUB, 'nw', { range: 300, half: 0.3, base: 0.9, amp: 0.6, rate: 1.3, phase: 0.4 }, 15),
  // mid-town: CCTV poles in the plaza between the club and Market St
  { type: 'camera', x: 1080, y: 1900, range: 300, half: 0.32, base: PI / 2, amp: 1.1, rate: 0.9, phase: 0, mount: 'pole' },
  { type: 'camera', x: 860, y: 2300, range: 280, half: 0.3, base: -0.6, amp: 0.8, rate: 1.2, phase: 2, mount: 'pole' },
  { type: 'camera', x: 1880, y: 2860, range: 300, half: 0.3, base: PI, amp: 0.75, rate: 1.2, phase: 0 },
  roofCam(HR_W, 'n', { range: 300, half: 0.3, base: 0.2, amp: 0.8, rate: 1.1, phase: 1 }, 12),
  roofCam(HR_E, 'n', { range: 300, half: 0.3, base: PI * 0.85, amp: 0.7, rate: 1.3, phase: 2 }, 12),
  { type: 'camera', x: 700, y: HR_MID.y - 108, range: 280, half: 0.3, base: PI / 2, amp: 0.8, rate: 1.0, phase: 0.5 },
  // billboards: neon scrambles steering
  { type: 'neon', x: 1080, y: 2700, r: 150, text: 'BURGERS', billboard: true },
  { type: 'neon', x: 1260, y: 1250, r: 140, text: 'OPEN 24H', billboard: true },
  // the crane: rotating boom, solid
  { type: 'crane', x: 380, y: 1330, len: 430, rate: 0.6, a0: 0, width: 26 },
  // pigeons
  {
    type: 'flock',
    kind: 'pigeon',
    path: [
      { x: 160, y: 2300 },
      { x: 2000, y: 2200 },
      { x: 1900, y: 3000 },
      { x: 200, y: 3150 },
    ],
    speed: 270,
    r: 50,
    phase: 0,
  },
  {
    type: 'flock',
    kind: 'pigeon',
    path: [
      { x: 1980, y: 300 },
      { x: 1800, y: 1300 },
      { x: 200, y: 1000 },
      { x: 300, y: 250 },
    ],
    speed: 290,
    r: 50,
    phase: 500,
  },
  // insomniac office windows (the first one, across the alley, lights the club's fire escape)
  win(HR_PLAZA, 'e', 2092, 4.6, 2.0, 0.7),
  win(HR_SE, 'n', 1880, 5.2, 2.2, 0),
  win(HR_W, 's', 260, 4.6, 2.0, 1.3),
  win(HR_E, 's', 1860, 5.0, 2.4, 2.1),
  win(HR_MID, 's', 700, 4.4, 1.8, 0.4),
  win(HR_NW, 'n', 240, 4.8, 2.2, 3.0),
  win(HR_NE, 'n', 1900, 5.4, 2.0, 1.0),
  // tram wires over Market St's north kerb (gaps at the middle and the east end)
  { type: 'wire', kind: 'tram', ax: 20, ay: 2440, bx: 560, by: 2440 },
  { type: 'wire', kind: 'tram', ax: 560, ay: 2440, bx: 960, by: 2440 },
  { type: 'wire', kind: 'tram', ax: 1200, ay: 2440, bx: 1640, by: 2440 },
  { type: 'wire', kind: 'tram', ax: 1640, ay: 2440, bx: 1900, by: 2440 },
];

/** Streetlights on the pavement at the avenue corners, 80 px off both centre lines. */
const L4_LAMPS = [
  { x: 620, y: 3340 },
  { x: 1700, y: 3340 },
  { x: 620, y: 2420 },
  { x: 1700, y: 2420 },
  { x: 620, y: 1680 },
  { x: 1700, y: 1680 },
  { x: 1160, y: 840 },
];

export const LEVEL4: DeepLevelDef = {
  kind: 'deep',
  id: 'level4',
  num: 4,
  title: 'Downtown Graveyard Shift',
  location: 'Grimsby city centre',
  blurb: 'A museum, a nightclub and City Hall. A helicopter.',
  human: 'Nigel, Kev & the Mayor',
  mugshot: 'human/mayor_head',
  // A perfect bot needs ~225 s. Night owl = done by 310 s.
  budgetSec: 480,
  parMarginSec: 170,
  hours: [1, 6],
  memo: {
    re: 'Work Order #0004 — Grimsby city centre',
    body:
      'Head Office wants a vertical slice of civic life: Night Guard Nigel from the museum, DJ Kev from the Bassment, and Mayor Whitlock, who is "working late" at City Hall. The police helicopter has a searchlight and no hobbies. Rooftop cameras, traffic, a crane. Billboards scramble steering.',
    joke:
      'The Mayor is technically an elected official, so this counts as a constituency visit. Please file Form 9-V (Votes, Alien). We have never needed Form 9-V before.',
  },
  map: {
    theme: 'city',
    w: 2160,
    h: 3840,
    start: { x: 1080, y: 3640 },
    roads: [
      { dir: 'h', at: 3420, from: 0, to: 2160 },
      { dir: 'h', at: 2500, from: 0, to: 2160 },
      { dir: 'h', at: 1600, from: 0, to: 2160 },
      { dir: 'h', at: 760, from: 0, to: 2160 },
      { dir: 'v', at: 540, from: 760, to: 3420 },
      { dir: 'v', at: 1620, from: 760, to: 3420 },
      { dir: 'v', at: 1080, from: 760, to: 1600 },
    ],
    groundProps: [{ key: 'flight/park_top', kind: 'park', x: 1200, y: 3080 }],
    props: [
      HR_SE,
      HR_W,
      HR_E,
      HR_MID,
      HR_NW,
      HR_NE,
      hr('a', 1350, 1080),
      hr('c', 250, 3020),
      hr('b', 1900, 2140),
      HR_PLAZA,
      hr('a', 260, 400),
      hr('c', 1880, 420),
      hr('b', 1350, 3700),
      hr('c', 700, 3700),
      ...L4_LAMPS.map((l): PropDef => ({ key: 'flight/streetlight_top', kind: 'streetlight', x: l.x, y: l.y })),
    ],
    targets: L4_TARGETS,
    hazards: L4_HAZARDS,
    lamps: L4_LAMPS,
  },
};
