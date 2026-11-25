// L5 "Pier Pressure" interiors (docs/GDD-3-new-shifts.md, L5): the marine park (Bubbles the
// dolphin, Barnacle the sea lion), the lighthouse (Harbourmaster Pete) and the fish market
// (Sal, Kipper the cat). Two routes per building; each has a timing commit.
import type { Wetness } from '../moisture';
import type { Pose } from '../ragdoll';
import { building, type Building, type Checkpoint, type Hazard, type InteriorRoom, type Opening, type Sleeper } from './interior';
import { CHAIR_POSE, prop, sprite, type Area, type Furniture, type Room, type Sprite } from './layout';

const box = (x: number, y: number, w: number, h: number): Area => ({ x, y, w, h });
const art = (key: string, x: number, y: number): Sprite => sprite('room/' + key, x, y);
const fit = (key: string, x: number, y: number, w: number, h: number): Sprite => ({ key: 'room/' + key, x, y, w, h });
const point = (x: number, y: number, cross?: string, speed?: number): Checkpoint => ({ x, y, cross, speed });
const room = (
  name: string, backdrop: string, area: Area, decor: readonly Sprite[] = [], furniture: readonly Sprite[] = [],
  supports: readonly Furniture[] = [], mounts: readonly Sprite[] = [],
): InteriorRoom => ({ ...area, name, backdrop: 'room/bg_' + backdrop, decor, furniture, supports, mounts });
const opening = (axis: Opening['axis'], at: number, from: number, to: number, trim: Opening['trim']): Opening =>
  ({ axis, at, from, to, trim });
const door = (x: number, top: number, floor = 686): Opening => opening('vertical', x, top, floor, 'door');
const hatch = (y: number, x: number, trim: Opening['trim'], width = 164): Opening => opening('horizontal', y, x, x + width, trim);
const swing = (name: string, s: Sprite, amplitude: number, speed: number, mountY?: number, phase = 0): Hazard =>
  ({ kind: 'swing', name, sprite: s, amplitude, speed, phase, mountY });
const gate = (name: string, area: Area, axis: 'x' | 'y', period: number, open: number, phase: number): Hazard =>
  ({ kind: 'gate', name, area, axis, cycle: { period, open, phase } });
const patrol = (name: string, s: Sprite, dx: number, dy: number, speed: number, phase = 0.6): Hazard =>
  ({ kind: 'patrol', name, sprite: s, dx, dy, speed, phase });
const fragile = (name: string, s: Sprite): Hazard => ({ kind: 'fragile', name, sprite: s });
const draft = (name: string, area: Area, ax: number, ay: number): Hazard => ({ kind: 'draft', name, area, ax, ay });
const sleeper = (name: string, x: number, feet: number, radius: number): Sleeper => {
  const key = name.toLowerCase();
  const asleep = art(key + '_asleep', x, 0);
  const awake = art(key + '_awake', x, 0);
  asleep.y = feet - asleep.h;
  awake.y = feet - awake.h;
  return { name, asleep, awake, radius };
};
function support(key: string, x: number, y: number, ...surfaces: readonly Area[]): Furniture {
  return prop(art(key, x, y), surfaces.map(a => box(x + a.x, y + a.y, a.w, a.h)));
}

/** Bubbles floating at the pool surface, nose right: snout, belly, tail, fluke, flippers. */
const DOLPHIN_POSE: Pose = {
  ...CHAIR_POSE, pelvisRadius: undefined,
  neckX: 200, neckY: 512,
  bones: [-0.12, Math.PI + 0.05, Math.PI + 0.25, Math.PI + 0.45, 2.3, 2.0],
};

const SUBJECTS = {
  bubbles: {
    pose: DOLPHIN_POSE,
    // on the pool floor: an optional dive
    item: { sprite: art('sardine_tin', 610, 656), name: 'sardine tin' },
    caption: 'Bubbles woke the other half of her brain. She is filing a complaint.',
    mumbles: ['Eee-ee. Tell the penguins I am busy.', 'The intern thinks I am a fish. Adorable.', 'Two more laps, then the herring.', 'Half my brain is asleep. Still ahead.', 'The bucket is half full. Of fish.'],
  },
  pete: {
    pose: { ...CHAIR_POSE, neckX: 122, neckY: 505 },
    // v4 items: out in the middle of the lamp room, under the lens's sweep
    item: { sprite: art('coffee_mug', 500, 656), name: 'harbourmaster mug' },
    caption: 'The lighthouse has logged you as a hazard to shipping.',
    mumbles: ['Ships ahoy… ships asleep.', 'Who moved the sea again?', "Light's on, nobody's home.", 'Fog’s rolling in. Lovely.', 'Keep the kettle lit for the gulls.'],
  },
  sal: {
    pose: { ...CHAIR_POSE, neckX: 128, neckY: 502 },
    // v4 items: at the far end of the ledger desk
    item: { sprite: art('coffee_mug', 437, 548), name: 'accounts mug' },
    caption: 'Sal has entered you in the ledger under "one outstanding".',
    mumbles: ['One outstanding. Always one outstanding.', 'The cod does not balance.', 'Carry the haddock.', 'Kipper, that is not petty cash.', "Receipts or it didn't swim."],
  },
} satisfies Record<'bubbles' | 'pete' | 'sal', { pose: Pose; item: Room['item']; caption: string; mumbles: readonly string[] }>;

function route(
  home: Building, human: keyof typeof SUBJECTS, exitName: string, exit: Sprite, exitZone: Area,
  checkpoints: readonly Checkpoint[], roofExit = false, wet?: Wetness,
): Room {
  const { pose, item, caption, mumbles } = SUBJECTS[human];
  const furniture = home.rooms.flatMap(section => [...section.furniture.map(piece => prop(piece)), ...section.supports]);
  return {
    human, pose, item, furniture, exit, exitZone, roofExit, backdrop: home.rooms[0]!.backdrop, par: 90, route: [],
    interior: { building: home, checkpoints, caption, mumbles, exitName, wet },
  };
}

// ====================================================================== the marine park (Bubbles)

const PARK_EXITS = {
  roof: fit('exit_skylight', 1510, -286, 280, 90),
  tunnel: art('exit_loading_door', -2100, 446),
} as const;

/** The roof panel's cycle; the jelly-hall sprinkler sprays while the dock door is shut. */
const ROOF_PANEL = { period: 7.2, open: 4, phase: 1.1 };
const DOCK_DOOR = { period: 7, open: 3.9, phase: 2.4 };

const parkHome = building([
  room('Show pool', 'show_pool', box(0, 0, 900, 700),
    [fit('show_pool', 14, 526, 872, 160)], [], [], []),
  room('Sea-lion rocks', 'show_pool', box(900, 0, 1000, 700),
    [], [fit('sea_lion_rocks', 1170, 626, 240, 60)]),
  room('Service roof', 'attic', box(1420, -300, 460, 300),
    [PARK_EXITS.roof]),
  // two glass dividers: over the low one, then push her down under the hanging one
  room('Viewing tunnel', 'aquarium_tunnel', box(-900, 0, 900, 700),
    [], [fit('tunnel_divider', -260, 420, 60, 266), fit('tunnel_divider', -560, 14, 70, 370)]),
  room('Jellyfish hall', 'jelly_hall', box(-2200, 0, 1300, 700),
    [PARK_EXITS.tunnel, art('mop_bucket', -1540, 596), art('sprinkler_head', -1390, 14)]),
], [
  door(900, 150), hatch(0, 1460, 'vent', 380), door(0, 150), door(-900, 150),
], [
  swing('Show hoop', art('hoop', 560, 40), 0.42, 1.55, 14),
  patrol('Beach ball', art('beach_ball', 470, 470), 90, 0, 0.55),
  gate('Roof panel', box(1460, -17, 380, 34), 'x', ROOF_PANEL.period, ROOF_PANEL.open, ROOF_PANEL.phase),
  { kind: 'creak', name: 'Squeaky wet tiles', area: box(1170, 400, 150, 286) },
  patrol('Jellyfish', fit('jellyfish', -1130, 90, 70, 100), 0, 70, 0.7),
  patrol('Jellyfish', fit('jellyfish', -1560, 110, 70, 100), 0, 80, 0.62, 2.1),
  { kind: 'creak', name: 'Squeaky wet tiles', area: box(-1400, 380, 200, 306) },
  gate('Loading dock door', box(-1880, 250, 34, 436), 'y', DOCK_DOOR.period, DOCK_DOOR.open, DOCK_DOOR.phase),
], [sleeper('Barnacle', 1220, 626, 360)]);

/**
 * Water floats and refills her; everything else dries her (≈ 700 px of drag on a full sheath).
 * Refills are detours: the rock pool by the door, the drip under the leaky roof panel, the mop
 * bucket, and a sprinkler by the dock door that only sprays while the door is shut.
 */
const PARK_WET: Wetness = {
  water: [
    { name: 'Show pool', area: box(14, 500, 872, 186) },
    { name: 'Viewing tunnel', area: box(-886, 150, 872, 536) },
    { name: 'Rock pool', area: box(914, 580, 176, 106) },
  ],
  refills: [
    { name: 'Leaky roof panel', kind: 'sprinkler', area: box(1590, 40, 220, 230) },
    { name: 'Mop bucket', kind: 'bucket', area: box(-1560, 560, 120, 126) },
    // optional: a quick spray on the way, if you catch it
    { name: 'Hall sprinkler', kind: 'sprinkler', area: box(-1440, 40, 140, 520), cycle: { period: 5, open: 2, phase: 0 } },
  ],
};

export const bubblesRoof = route(parkHome, 'bubbles', 'ROOF PANEL', PARK_EXITS.roof, box(1580, -270, 140, 80), [
  point(200, 600, undefined, 30), point(760, 600, undefined, 30), point(975, 615, undefined, 50),
  point(1180, 440, undefined, 70), point(1580, 230, undefined, 70), point(1670, 150, undefined, 40),
  point(1670, -170, 'Roof panel', 150), point(1660, -230),
], true, PARK_WET);

export const bubblesTunnel = route(parkHome, 'bubbles', 'LOADING DOCK', PARK_EXITS.tunnel, box(-2050, 460, 120, 160), [
  point(160, 580, undefined, 30), point(-100, 520, undefined, 35), point(-180, 330, undefined, 35),
  point(-330, 330, undefined, 35), point(-420, 470, undefined, 35), point(-760, 520, undefined, 35),
  point(-1050, 470, undefined, 70), point(-1300, 470, undefined, 70), point(-1500, 575, undefined, 60),
  point(-1760, 470, undefined, 60), point(-1990, 540, 'Loading dock door', 200),
], false, PARK_WET);

// ====================================================================== the lighthouse (Pete)

/**
 * The turning lens hangs from the lamp-room ceiling and sweeps its light cone across the room on
 * a ≈ 7 s clock (the flight beam's turn). Pete's chair and the stair head are outside its reach.
 */
const LENS: Hazard = {
  kind: 'camera', name: 'Lighthouse lens', x: 520, y: 122, angle: Math.PI / 2,
  spread: 0.26, range: 310, sweep: 1.0, speed: 0.9, phase: 0, lens: true,
};

const LIGHT_EXITS = {
  gallery: art('exit_window', 1726, 190),
  slipway: art('exit_loading_door', 2030, 1546),
} as const;

const lighthouse = building([
  room('Lamp room', 'lamp_room', box(0, 0, 900, 700),
    [fit('fresnel_lens', 465, 14, 110, 140)], [], [support('rocking_chair', 52, 536, box(14, 78, 104, 18), box(30, 96, 70, 40))]),
  room('Lamp gallery', 'lamp_room', box(900, 0, 1000, 700),
    [LIGHT_EXITS.gallery], []),
  room('Spiral stairs', 'lighthouse_stairs', box(0, 700, 900, 700),
    [fit('stairs', 85, 700, 584, 686)]),
  room('Weight shaft', 'lighthouse_stairs', box(900, 700, 420, 1100)),
  room('Boat shed', 'boat_shed', box(1320, 1100, 900, 700),
    [LIGHT_EXITS.slipway]),
], [
  // the gallery door has a high sill: climb out of the lens sweep, then step over it
  door(900, 120, 358), hatch(700, 640, 'stairs', 200), door(900, 1000, 1386), door(1320, 1400, 1786),
], [
  LENS,
  swing('Storm lantern', fit('hanging_bulb', 1180, 14, 30, 150), 0.6, 1.9, 14),
  fragile('Spare lamp bulbs', fit('fish_crates', 1250, 596, 90, 90)),
  swing('Storm lantern', fit('hanging_bulb', 1560, 14, 30, 150), 0.6, 1.75, 14, 1.3),
  fragile('Spare lamp bulbs', fit('fish_crates', 1630, 596, 90, 90)),
  { kind: 'creak', name: 'Creaky spiral stairs', area: box(85, 728, 730, 644) },
  patrol('Clockwork weight', art('counterweight_lighthouse', 1240, 950), 0, 200, 1.15),
  gate('Slipway door', box(1960, 1350, 34, 436), 'y', 7.1, 3.9, 0.9),
]);

const SLIPWAY_WET: Wetness = {
  water: [{ name: 'Slipway', area: box(1480, 1720, 440, 66) }],
  refills: [],
};

export const peteGallery = route(lighthouse, 'pete', 'GALLERY WINDOW', LIGHT_EXITS.gallery, box(1780, 240, 90, 130), [
  point(230, 410), point(210, 400), point(840, 420, 'Lighthouse lens', 200),
  point(860, 202, undefined, 32), point(1060, 212, undefined, 32),
  point(1300, 330, undefined, 32), point(1460, 300, undefined, 32),
  point(1700, 330, undefined, 32), point(1830, 300, undefined, 32),
]);

export const peteSlipway = route(lighthouse, 'pete', 'SLIPWAY DOOR', LIGHT_EXITS.slipway, box(2070, 1540, 90, 130), [
  point(230, 410), point(210, 400), point(800, 450, 'Lighthouse lens', 200), point(740, 560), point(740, 900),
  point(700, 1160), point(1080, 1160), point(1080, 1560, undefined, 60), point(1440, 1530),
  point(1800, 1510), point(2110, 1590, 'Slipway door', 190),
], false, SLIPWAY_WET);

// ====================================================================== the fish market (Sal)

const MARKET_EXITS = {
  loft: art('exit_roof_hatch', 890, -990),
  dock: art('exit_loading_door', 1905, 446),
} as const;

const ledgerChair = support('office_chair', 86, 536, box(10, 78, 90, 17), box(45, 95, 20, 48));
const ledgerDesk = support('ledger_desk', 218, 556, box(8, 22, 244, 94));

const market = building([
  room('Market floor', 'fish_market', box(0, 0, 1100, 700),
    [], [], [ledgerChair, ledgerDesk]),
  room('Ice chute', 'cold_store', box(820, -1000, 300, 1000),
    [MARKET_EXITS.loft]),
  room('Cold store', 'cold_store', box(1100, 0, 1000, 700),
    [MARKET_EXITS.dock], [fit('fish_crates', 1520, 586, 100, 100)]),
], [hatch(0, 848, 'shaft', 244), door(1100, 180)], [
  swing('Hanging scales', art('hanging_scales', 520, 30), 0.5, 1.7, 14),
  { kind: 'creak', name: 'Wet duckboards', area: box(420, 250, 300, 436) },
  swing('Crab pots', art('crab_pots', 690, 30), 0.45, 1.45, 14, 1.4),
  draft('Ice chute draught', box(834, -986, 272, 972), 0, 300),
  gate('Chute flap', box(834, -520, 272, 28), 'x', 7.2, 4, 2.0),
  patrol('Freezer hook', art('freezer_hook', 1330, 14), 150, 0, 0.85),
  { kind: 'creak', name: 'Frosty floor', area: box(1390, 250, 90, 436) },
  fragile('Fish-crate tower', art('fish_crates', 1660, 576)),
  gate('Cold-store dock door', box(1880, 250, 34, 436), 'y', 7, 3.9, 3.0),
], [sleeper('Kipper', 1340, 686, 360)]);

export const salLoft = route(market, 'sal', 'LOFT HATCH', MARKET_EXITS.loft, box(915, -920, 110, 90), [
  point(240, 340), point(470, 320), point(870, 330), point(970, 170), point(970, -330),
  point(970, -760, 'Chute flap', 200), point(970, -890),
], true);

export const salDock = route(market, 'sal', 'DOCK DOOR', MARKET_EXITS.dock, box(1980, 470, 90, 150), [
  point(240, 340), point(470, 330), point(900, 330), point(1180, 300), point(1500, 300),
  point(1760, 330), point(1850, 380), point(2025, 500, 'Cold-store dock door', 200),
]);
