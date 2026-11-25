// L6 "Probe Compliance": St. Mildred's General, the Endoscopy Wing (docs/GDD-3-new-shifts.md, L6).
// Map data only. The flight signature is the ambulance scramble (src/flight/ambulance.ts): three
// bays along the spine road whose ambulances launch when the saucer comes near. No red cross
// anywhere on this campus: the hospital's sign is a crescent moon.
import { ART } from '../art-manifest';
import type { HazardDef } from '../flight/hazards';
import type { DeepLevelDef, DeepTarget, EntryDef, PropDef } from './types';

const PI = Math.PI;

/** World position of a feature on a building sprite (docs/ART_ANCHORS.md, native sprite px). */
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

/** Unrotated footprint of a prop, world px. */
function box(b: PropDef): { x0: number; y0: number; x1: number; y1: number } {
  const spec = ART[b.key]!;
  const w = b.w ?? spec.w;
  const h = b.h ?? spec.h;
  return { x0: b.x - w / 2, y0: b.y - h / 2, x1: b.x + w / 2, y1: b.y + h / 2 };
}

const pine = (x: number, y: number): PropDef => ({ key: 'flight/pine_top', kind: 'tree', x, y });
const annex = (x: number, y: number, rot = 0): PropDef => ({ key: 'flight/clinic_annex_top', kind: 'civic', x, y, rot, tint: '#5f6a80' });
const lamp = (x: number, y: number): PropDef => ({ key: 'flight/streetlight_top', kind: 'streetlight', x, y });

/**
 * An insomniac patient at a window: lights a pool on the lawn in front of one facade on a cycle,
 * flickering first. North/south facades take a world x, east/west facades a world y.
 */
function win(b: PropDef, facade: 'n' | 's' | 'e' | 'w', along: number, period: number, on: number, phase: number, r = 100): HazardDef {
  const q = box(b);
  const INSET = 10;
  const REACH = 92;
  const nx = facade === 'e' ? 1 : facade === 'w' ? -1 : 0;
  const ny = facade === 's' ? 1 : facade === 'n' ? -1 : 0;
  const ex = facade === 'e' ? q.x1 : facade === 'w' ? q.x0 : along;
  const ey = facade === 's' ? q.y1 : facade === 'n' ? q.y0 : along;
  return { type: 'window', wx: ex - nx * INSET, wy: ey - ny * INSET, x: ex + nx * REACH, y: ey + ny * REACH, r, period, on, phase };
}

// ====================================================================== buildings

// Roads: the entry road (y 2780), the spine (x 1080), the ward ring (y 1640, y 400, x 300, x 1860).
const ENDO: PropDef = { key: 'flight/endoscopy_wing_top', kind: 'civic', x: 560, y: 2320, tint: '#8fa3b0' };
const ONCALL: PropDef = { key: 'flight/oncall_block_top', kind: 'civic', x: 1580, y: 1100, tint: '#7f93a6' };
const WARD: PropDef = { key: 'flight/recovery_ward_top', kind: 'civic', x: 600, y: 760, tint: '#93a0b8' };
const ANNEX_SE = annex(1620, 2200);
const ANNEX_MID = annex(600, 1300);
const ANNEX_NE = annex(1420, 640);
const ANNEX_E = annex(1980, 2480);

const L6_TARGETS: [DeepTarget, DeepTarget, DeepTarget] = [
  {
    human: 'Hank',
    short: 'Hank',
    building: ENDO,
    entries: [
      entry(ENDO, 'hank_front', 'Front doors', 'revolving door', [160, 224], 'below'),
      entry(ENDO, 'hank_rear', 'Rear entrance', 'laundry cart', [250, 18], 'above'),
    ],
  },
  {
    human: 'Dr. Osei',
    short: 'Osei',
    building: ONCALL,
    entries: [
      entry(ONCALL, 'osei_helipad', 'Roof helipad', 'lift shaft', [90, 90], 'above'),
      entry(ONCALL, 'osei_pharmacy', 'Pharmacy hatch', 'pill shelves', [246, 160], 'below'),
    ],
  },
  {
    human: 'Mr. Pemberton',
    short: 'Pemberton',
    building: WARD,
    entries: [
      entry(WARD, 'pemberton_window', 'Recovery window', 'past Roland', [230, 204], 'below'),
      entry(WARD, 'pemberton_chute', 'Laundry chute', 'chute draft', [16, 110], 'above'),
    ],
  },
];

// ====================================================================== hazards

const AMB = { speed: 420, dwell: 1.2, rest: 4, trigger: 230, coneRange: 300, coneHalf: 0.36, beaconR: 105 } as const;

const L6_HAZARDS: HazardDef[] = [
  // ---- the ambulance scramble: four bays. Each launches when you pass close to it.
  // A&E bay (doors west): along the drop-off lane, pulls up under the Endoscopy Wing's front doors.
  {
    type: 'ambulance',
    bayX: 950,
    bayY: 2550,
    path: [
      { x: 950, y: 2500 },
      { x: 870, y: 2500 },
      { x: 560, y: 2500 },
    ],
    ...AMB,
    trigger: 350,
    speed: 560,
    beaconR: 120,
    dwell: 1.6,
  },
  // Spine bay (doors south): out onto the entry road, then north up the spine behind you.
  {
    type: 'ambulance',
    bayX: 1290,
    bayY: 2590,
    path: [
      { x: 1240, y: 2590 },
      { x: 1240, y: 2748 },
      { x: 1112, y: 2748 },
      { x: 1112, y: 1760 },
    ],
    ...AMB,
    trigger: 195,
  },
  // Ward bay (doors south): out onto the ward road, east, then up the pharmacy drive to the hatch.
  {
    type: 'ambulance',
    bayX: 1290,
    bayY: 1520,
    path: [
      { x: 1240, y: 1520 },
      { x: 1240, y: 1608 },
      { x: 1760, y: 1608 },
      { x: 1760, y: 1225 },
    ],
    ...AMB,
    dwell: 1.6,
  },
  // North bay (doors north): west along the north road, then down to the laundry chute.
  {
    type: 'ambulance',
    bayX: 860,
    bayY: 520,
    path: [
      { x: 910, y: 520 },
      { x: 910, y: 432 },
      { x: 400, y: 432 },
      { x: 400, y: 720 },
    ],
    ...AMB,
    dwell: 1.6,
  },
  // ---- the medevac helicopter, circling the on-call block: its searchlight crosses the helipad
  { type: 'heli', cx: 1560, cy: 1090, rx: 220, ry: 250, period: 22, phase: 0.6, spotR: 136, spotDist: 165, spotRate: 1.4 },
  // ---- CCTV
  // the ward's south-west corner, sweeping the south lawn and the recovery window
  { type: 'camera', x: 462, y: 862, range: 280, half: 0.3, base: 0.35, amp: 0.6, rate: 1.1, phase: 0 },
  // the on-call block's north-west corner, sweeping from the west lawn round onto the helipad
  { type: 'camera', x: 1462, y: 1002, range: 300, half: 0.28, base: 1.9, amp: 1.25, rate: 0.9, phase: 1.3 },
  // car-park pole by the Endoscopy Wing: the rear entrance and the spine
  { type: 'camera', x: 880, y: 2080, range: 290, half: 0.3, base: PI * 0.95, amp: 0.75, rate: 1.0, phase: 2.2, mount: 'pole' },
  // a pole on the west lawn: the laundry chute
  { type: 'camera', x: 360, y: 980, range: 280, half: 0.28, base: -1.0, amp: 0.6, rate: 1.15, phase: 0.7, mount: 'pole' },
  // ---- insomniac patients at their windows
  win(WARD, 's', 560, 4.8, 2.0, 0.4),
  win(ONCALL, 'e', 1150, 5.0, 2.0, 1.2, 110),
  win(ANNEX_MID, 'n', 640, 5.2, 2.1, 1.8),
  win(ANNEX_SE, 'w', 2180, 4.6, 1.9, 2.6),
  win(ANNEX_NE, 'e', 640, 5.0, 2.0, 0.9),
  win(ENDO, 'e', 2290, 5.4, 2.2, 3.1),
  // ---- the ticket display by the drop-off (neon: scrambles steering while lit)
  { type: 'neon', x: 300, y: 2660, r: 110, text: 'NOW SERVING 12', billboard: false },
];

const L6_LAMPS = [
  { x: 1000, y: 2700 },
  { x: 1160, y: 2700 },
  { x: 1000, y: 1720 },
  { x: 1160, y: 1560 },
  { x: 1000, y: 480 },
  { x: 380, y: 1560 },
  { x: 1780, y: 480 },
  // the crescent-moon canopy over the Endoscopy Wing's front doors
  { x: 560, y: 2460 },
];

export const LEVEL6: DeepLevelDef = {
  kind: 'deep',
  id: 'level6',
  num: 6,
  title: 'Probe Compliance',
  location: "St. Mildred's General · Endoscopy Wing",
  blurb: 'Form 7-B. Two readings each. Nobody wakes up.',
  human: 'Hank, Dr. Osei & Mr. Pemberton',
  mugshot: 'human/hank_head',
  budgetSec: 450,
  parMarginSec: 140,
  hours: [1, 6],
  memo: {
    re: 'Work Order #0006 — Mandatory Form 7-B Audit',
    body:
      "Pete's lighthouse log reached Head Office, and Compliance noticed zero probes logged all quarter. Worse: humans queue voluntarily to be probed here and leave four-star reviews. Collect Hank, Dr. Osei and Mr. Pemberton with Form 7-B ticked en route.",
    joke:
      "Our probe has been a brass thermometer and a clipboard since 1953. Frankly, we're insulted by their other theories. (A stray defibrillator marked FOR THE MACHINE is parked off the drop-off lane—grab it only if you've time.)",
  },
  map: {
    theme: 'clinic',
    // v4 map collectibles: stray defibrillator trolley off the southern drop-off lane across from the Endoscopy Wing.
    // "It's alive!" from the Endoscopy Wing's south windows, across the lane, so the Frankenstein nod reads
    collectible: { id: 'defibrillator', x: 495, y: 2675, shout: { x: 470, y: 2428 } },
    w: 2160,
    h: 3120,
    start: { x: 1080, y: 2960 },
    roads: [
      { dir: 'h', at: 2780, from: 0, to: 2160 },
      // the drop-off lane under the Endoscopy Wing's front doors, out of the A&E bay
      { dir: 'h', at: 2500, from: 200, to: 890 },
      { dir: 'v', at: 1080, from: 340, to: 2780 },
      { dir: 'h', at: 1640, from: 240, to: 1920 },
      { dir: 'h', at: 400, from: 240, to: 1920 },
      { dir: 'v', at: 300, from: 340, to: 1700 },
      { dir: 'v', at: 1860, from: 340, to: 1700 },
    ],
    groundProps: [],
    props: [
      ANNEX_SE,
      ANNEX_MID,
      ANNEX_NE,
      ANNEX_E,
      annex(220, 2060, PI / 2),
      annex(1640, 160),
      annex(560, 160),
      // pines: the campus edges and the gaps between the wings
      pine(120, 2400),
      pine(170, 2560),
      pine(820, 2560),
      pine(900, 1900),
      pine(420, 1960),
      pine(1300, 2000),
      pine(1880, 2140),
      pine(2060, 2000),
      pine(1460, 2700),
      pine(1860, 2700),
      pine(120, 1200),
      pine(150, 800),
      pine(2040, 1300),
      pine(2050, 900),
      pine(1240, 1100),
      pine(1360, 1340),
      pine(900, 1060),
      pine(460, 1060),
      pine(1980, 300),
      pine(300, 220),
      pine(1080, 200),
      pine(620, 3000),
      pine(1560, 3000),
      pine(2060, 2960),
      ...L6_LAMPS.slice(0, -1).map((l) => lamp(l.x, l.y)),
    ],
    targets: L6_TARGETS,
    hazards: L6_HAZARDS,
    lamps: L6_LAMPS,
  },
};
