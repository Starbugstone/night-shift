// L7 "A Whole Cruise Ship" (docs/GDD-3-new-shifts.md): the SS Buffet Royale's interiors.
//
// Every building rolls (a 'swell' hazard, src/abduct/swell.ts): a slow sideways pull on the whole
// body that turns every 3.5 s. The camera stays level; the plumb dial and the soup show the pull.
// Things on castors (the dessert trolley, the deckchair stack) slide with the roll as moving solids.
// Every route has at least one passage longer than half a roll, so no lucky start carries you across.
import { building, type Building, type Checkpoint, type Hazard, type InteriorRoom, type Opening, type Sleeper } from './interior';
import { BED_POSE, CHAIR_POSE, prop, sprite, type Area, type Furniture, type Human, type Room, type Sprite } from './layout';
import type { Pose } from '../ragdoll';
import { CASTOR_LAG, SWELL_PERIOD } from '../swell';

const box = (x: number, y: number, w: number, h: number): Area => ({ x, y, w, h });
const art = (key: string, x: number, y: number): Sprite => sprite('room/' + key, x, y);
const fit = (key: string, x: number, y: number, w: number, h: number): Sprite => ({ key: 'room/' + key, x, y, w, h });
const point = (x: number, y: number, cross?: string, speed?: number): Checkpoint => ({ x, y, cross, speed });
const room = (
  name: string, backdrop: string, area: Area, decor: readonly Sprite[] = [], furniture: readonly Sprite[] = [],
  supports: readonly Furniture[] = [], mounts: readonly Sprite[] = [],
): InteriorRoom => ({ ...area, name, backdrop: 'room/bg_' + backdrop, decor, furniture, supports, mounts });
const opening = (axis: Opening['axis'], at: number, from: number, to: number, trim: Opening['trim']): Opening => ({ axis, at, from, to, trim });
const door = (x: number, top: number, floor = 686): Opening => opening('vertical', x, top, floor, 'door');
const hatch = (y: number, x: number, trim: Opening['trim'], width = 164): Opening => opening('horizontal', y, x, x + width, trim);
const swing = (name: string, s: Sprite, amplitude = 0.55, speed = 1.8, mountY?: number, phase = 0): Hazard =>
  ({ kind: 'swing', name, sprite: s, amplitude, speed, phase, mountY });
const fan = (name: string, x: number, y: number, length: number, speed: number, duct: boolean, mountY?: number): Hazard =>
  ({ kind: 'fan', name, x, y, length, speed, phase: 0.6, duct, mountY });
const gate = (name: string, area: Area, axis: 'x' | 'y', period: number, open: number, phase: number, hinged = false): Hazard =>
  ({ kind: 'gate', name, area, axis, cycle: { period, open, phase }, hinged });
const patrol = (name: string, s: Sprite, dx: number, dy: number, speed: number): Hazard =>
  ({ kind: 'patrol', name, sprite: s, dx, dy, speed, phase: 0.6 });
const camera = (name: string, x: number, mountY: number, angle: number, sweep: number, speed: number, range: number): Hazard =>
  ({ kind: 'camera', name, x, y: mountY + 65, mountY, angle, spread: 0.22, sweep, speed, range, phase: 1 });
const fragile = (name: string, s: Sprite): Hazard => ({ kind: 'fragile', name, sprite: s });
const draft = (name: string, area: Area, ax: number, ay: number): Hazard => ({ kind: 'draft', name, area, ax, ay });
/** The ship's roll: `pull` px/s² sideways at full lean, SWELL_PERIOD s per roll. */
const swell = (pull: number, phase: number): Hazard => ({ kind: 'swell', name: 'Ship roll', period: SWELL_PERIOD, pull, phase });
/** Something on castors that rolls `travel` px either way of where it is drawn, with the same roll. */
const castor = (name: string, s: Sprite, travel: number, phase: number): Hazard =>
  ({ kind: 'castor', name, sprite: s, travel, period: SWELL_PERIOD, phase, lag: CASTOR_LAG });
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

type ShipHuman = Extract<Human, 'sterling' | 'marco' | 'greg'>;

const captainChair = support('captains_chair', 60, 536, box(12, 84, 96, 16), box(48, 100, 24, 50));
const marcoCrate = support('boxes', 40, 576, box(4, 0, 132, 110));
const gregLounger = support('lounger', 40, 586, box(10, 38, 262, 26), box(20, 64, 20, 36), box(242, 64, 20, 36));

const EXITS = {
  captainMast: art('exit_roof_hatch', 1290, -886),
  captainFunnel: art('exit_chimney_top', -274, -286),
  marcoSkylight: art('exit_skylight', 600, -1086),
  marcoPromenade: art('exit_patio_door', 1826, 446),
  gregAwning: fit('exit_skylight', 1300, -706, 220, 80),
  gregCabin: art('exit_porthole', 1726, 966),
} as const;

const SUBJECTS = {
  sterling: {
    pose: { ...CHAIR_POSE, neckX: 162, neckY: 489, torso: 1.65 },
    item: { sprite: art('coffee_mug', 196, 512), name: "captain's mug" },
    caption: 'The captain has gone down with the nap.',
    mumbles: ['Make it so… comfy.', 'Engage the snooze button.', 'Set a course for the buffet. Warp nine.', 'Iceberg? Tell it to make an appointment.', 'All hands to the hammocks.'],
  },
  marco: {
    pose: { ...CHAIR_POSE, neckX: 134, neckY: 449, nearThigh: 0.30, farThigh: 0.32 },
    item: { sprite: art('eclair', 196, 560), name: 'chocolate éclair' },
    caption: 'The chef has sent your compliments back to the kitchen.',
    mumbles: ['More butter. No. More.', 'The soufflé can hear us.', 'Yes chef. No chef. Nap chef.', 'Fold the meringue, not the captain.', 'The jelly wobbles for no one.'],
  },
  greg: {
    pose: { ...BED_POSE, neckX: 119, neckY: 588 },
    item: { sprite: art('complimentary_towel', 330, 584), name: 'complimentary towel swan' },
    caption: 'Greg would like to speak to the manager of the sky.',
    mumbles: ['Is the tractor beam all-inclusive?', 'I paid for the premium sunset.', 'Three towels is the legal limit.', 'Is there a buffet on the mothership?', 'I want a refund on gravity.'],
  },
} satisfies Record<ShipHuman, { pose: Pose; item: Room['item']; caption: string; mumbles: readonly string[] }>;

function route(home: Building, human: ShipHuman, exitName: string, exit: Sprite, exitZone: Area, checkpoints: readonly Checkpoint[], roofExit = false): Room {
  const { pose, item, caption, mumbles } = SUBJECTS[human];
  const furniture = home.rooms.flatMap(section => [...section.furniture.map(piece => prop(piece)), ...section.supports]);
  return {
    human, pose, item, furniture, exit, exitZone, roofExit, backdrop: home.rooms[0]!.backdrop, par: 90, route: [],
    interior: { building: home, checkpoints, caption, mumbles, exitName },
  };
}

// ====================================================================== Captain Sterling

const captainHome = building([
  room('Bridge', 'bridge', box(0, 0, 760, 700),
    [art('ships_wheel', 250, 470), art('porthole', 440, 150), art('porthole', 600, 150)],
    [art('counter', 470, 576)], [captainChair]),
  room('Chart room', 'stairwell', box(760, 0, 720, 700),
    [fit('stairs', 820, 386, 300, 300), fit('ladder', 1244, 0, 56, 686), art('porthole', 900, 140)],
    [art('bookcase', 1330, 466)]),
  room('Mast', 'shaft', box(1180, -900, 380, 900),
    [EXITS.captainMast, fit('ladder', 1244, -560, 56, 560)]),
  room('Engine casing', 'engine_casing', box(0, 700, 760, 700),
    [], [art('boxes', 40, 1276)]),
  room('Funnel', 'duct', box(-420, -300, 420, 1700),
    [EXITS.captainFunnel, fit('ladder', -400, 600, 44, 786)]),
], [
  door(760, 200), hatch(0, 1214, 'ladder', 172), hatch(700, 220, 'stairs', 200), door(0, 900, 1386),
], [
  swell(230, 0.4),
  swing('Chart lamp', fit('chart_lamp', 345, 60, 40, 88), 0.62, 1.9, 14),
  fragile('Brass compass', art('brass_compass', 480, 516)),
  { kind: 'creak', name: 'Chart-room stairs', area: box(800, 200, 380, 420) },
  gate('Mast hatch', box(1194, -560, 352, 28), 'x', 7.2, 3.9, 1.3),
  fan('Engine fan', 600, 1180, 90, 2.4, true),
  draft('Steam updraft', box(-406, -286, 392, 1672), 0, -120),
  gate('Soot damper', box(-406, 200, 392, 28), 'x', 7.3, 3.95, 1.25),
], [sleeper('Anchovy', 660, 576, 300)]);

const captainDeck = [point(196, 330), point(470, 290)] as const;

export const captainMast = route(captainHome, 'sterling', 'MAST HATCH', EXITS.captainMast,
  box(1316, -876, 106, 60), [
    ...captainDeck, point(700, 300), point(900, 300), point(1100, 260), point(1300, 160), point(1300, -150),
    point(1300, -420), point(1370, -700, 'Mast hatch', 190), point(1369, -846),
  ], true);
export const captainFunnel = route(captainHome, 'sterling', 'FUNNEL', EXITS.captainFunnel,
  box(-250, -266, 92, 70), [
    point(196, 330), point(320, 420), point(320, 820), point(200, 1000), point(40, 1060), point(-210, 1080),
    point(-210, 330), point(-210, 60, 'Soot damper', 200), point(-204, -231),
  ], true);

// ====================================================================== Chef Marco

// The 24-hour dessert trolley rolls up to the dining-room doorway and back with every roll. Parked
// against the doorway it blocks the way through; parked back by the counter it leaves it clear, but
// the dangling feet swing towards it with the same lean, so you go through close to the door frame.
const marcoHome = building([
  room('Galley', 'galley', box(0, 0, 900, 700),
    [art('soup_pot', 310, 466), art('porthole', 640, 150)],
    [art('counter', 240, 576)], [marcoCrate]),
  room('Galley hood', 'duct', box(380, -1100, 640, 1100),
    [EXITS.marcoSkylight]),
  room('Dining room', 'dining_room', box(900, 0, 1100, 700),
    [art('porthole', 1060, 150), art('porthole', 1640, 150)],
    [art('counter', 1450, 576)]),
], [hatch(0, 560, 'vent', 180), door(900, 260)], [
  swell(230, 2.1),
  castor('Dessert trolley', art('dessert_trolley', 626, 566), 120, 2.1),
  swing('Hanging ladles', art('hanging_ladles', 300, 96), 0.35, 2.0, 14),
  fan('Hood fan', 930, -230, 80, 2.5, true),
  fan('Upper hood fan', 480, -430, 80, -2.3, true),
  gate('Hood damper', box(394, -700, 612, 26), 'x', 7.2, 3.9, 0.6),
  swing('Chandelier', art('chandelier', 1180, 40), 0.5, 1.75, 14),
  patrol('Busboy bot', art('busboy_bot', 1300, 596), 80, 0, 1.1),
  fragile('Chocolate fountain', art('chocolate_fountain', 1520, 446)),
  gate('Promenade door', box(1790, 330, 34, 356), 'y', 7, 3.85, 2.0),
]);

export const marcoSkylight = route(marcoHome, 'marco', 'GALLEY SKYLIGHT', EXITS.marcoSkylight,
  box(642, -1010, 116, 70), [
    point(196, 340), point(420, 320), point(650, 330), point(650, 40), point(650, -200), point(720, -330),
    point(740, -560), point(700, -970, 'Hood damper', 190),
  ], true);
export const marcoPromenade = route(marcoHome, 'marco', 'PROMENADE DOOR', EXITS.marcoPromenade,
  box(1860, 488, 90, 150), [
    point(196, 340), point(420, 310), point(760, 320), point(1010, 470, 'Dessert trolley', 170), point(1010, 320, undefined, 120),
    point(1350, 310), point(1550, 240), point(1720, 300), point(1720, 500),
    point(1906, 560, 'Promenade door', 190),
  ]);

// ====================================================================== Greg

// The deckchair stack rolls up to the sun-deck doorway and the room-service trolley up to the cabin
// door, with the same rule as Marco's trolley.
const gregHome = building([
  room('Lido bar', 'lido_bar', box(0, 0, 1200, 700),
    [art('porthole', 760, 150)],
    [art('counter', 540, 576)], [gregLounger]),
  room('Sun deck', 'lido_bar', box(1200, -720, 420, 1420),
    [EXITS.gregAwning, fit('ladder', 1540, -300, 56, 986)]),
  room('Cabin corridor', 'cabin_corridor', box(0, 700, 1240, 700),
    [art('porthole', 300, 860), art('porthole', 700, 860)]),
  room('Cabin 404', 'cabin_corridor', box(1240, 700, 660, 700),
    [EXITS.gregCabin], [fit('double_bed', 1566, 1246, 320, 140)]),
], [
  door(1200, 260), hatch(700, 330, 'stairs', 200), door(1240, 960, 1386),
], [
  swell(230, 1.2),
  castor('Deckchair stack', art('deckchair_stack', 946, 546), 120, 1.2),
  swing('Lifebuoy', art('lifebuoy', 700, 100), 0.62, 2.1, 14),
  gate('Awning flap', box(1214, -380, 392, 28), 'x', 7.1, 3.9, 2.7),
  camera('Steward camera', 760, 714, 1.57, 0.75, 1.45, 320),
  castor('Room-service trolley', fit('dessert_trolley', 960, 1266, 140, 120), 120, 1.2),
]);

const gregBar = [point(200, 360), point(430, 330)] as const;

export const gregAwning = route(gregHome, 'greg', 'SUN-DECK AWNING', EXITS.gregAwning,
  box(1360, -690, 100, 60), [
    ...gregBar, point(700, 300), point(1060, 320), point(1300, 470, 'Deckchair stack', 170), point(1300, 300, undefined, 120),
    point(1410, 0), point(1410, -260), point(1410, -500, 'Awning flap', 200), point(1410, -660),
  ], true);
export const gregCabin = route(gregHome, 'greg', 'PORTHOLE', EXITS.gregCabin,
  box(1746, 986, 80, 80), [
    ...gregBar, point(430, 860), point(470, 1000), point(1000, 1010, 'Steward camera', 240),
    point(1110, 1000), point(1340, 1170, 'Room-service trolley', 170), point(1340, 1040, undefined, 120), point(1500, 1030), point(1786, 1026),
  ]);
