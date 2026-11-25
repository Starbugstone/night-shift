// L6 "Probe Compliance": St. Mildred's General (docs/GDD-3-new-shifts.md, L6). Three buildings,
// two routes each. Every route carries two Form 7-B probe drones (src/abduct/probe.ts): the exit
// stays shut until both readings are in. PG-13 leaning 16 (v4): the joke is the paperwork, the signs and the probe.
import { building, type Building, type Checkpoint, type Hazard, type InteriorRoom, type Opening, type Sleeper } from './interior';
import { BED_POSE, prop, sprite, type Area, type Furniture, type Room, type Sprite } from './layout';
import type { ProbeDrone, ProbeKind } from '../probe';
import type { Pose } from '../ragdoll';

const box = (x: number, y: number, w: number, h: number): Area => ({ x, y, w, h });
const art = (key: string, x: number, y: number): Sprite => sprite('room/' + key, x, y);
const fit = (key: string, x: number, y: number, w: number, h: number): Sprite => ({ key: 'room/' + key, x, y, w, h });
const point = (x: number, y: number, cross?: string, speed?: number): Checkpoint => ({ x, y, cross, speed });
/** A checkpoint that holds the body for probe drone `probe` until its reading is in. */
const probeAt = (x: number, y: number, probe: number): Checkpoint => ({ x, y, probe, speed: 34 });
const room = (
  name: string, backdrop: string, area: Area, decor: readonly Sprite[] = [], furniture: readonly Sprite[] = [],
  supports: readonly Furniture[] = [], mounts: readonly Sprite[] = [],
): InteriorRoom => ({ ...area, name, backdrop: 'room/bg_' + backdrop, decor, furniture, supports, mounts });
const opening = (axis: Opening['axis'], at: number, from: number, to: number, trim: Opening['trim']): Opening => ({ axis, at, from, to, trim });
const door = (x: number, top: number, floor = 686): Opening => opening('vertical', x, top, floor, 'door');
const hatch = (y: number, x: number, trim: Opening['trim'], width = 164): Opening => opening('horizontal', y, x, x + width, trim);
const fan = (name: string, x: number, y: number, length: number, speed: number, mountY?: number): Hazard =>
  ({ kind: 'fan', name, x, y, length, speed, phase: 0.6, duct: false, mountY });
const gate = (name: string, area: Area, axis: 'x' | 'y', period: number, open: number, phase: number, hinged = false): Hazard =>
  ({ kind: 'gate', name, area, axis, cycle: { period, open, phase }, hinged });
const patrol = (name: string, s: Sprite, dx: number, dy: number, speed: number): Hazard =>
  ({ kind: 'patrol', name, sprite: s, dx, dy, speed, phase: 0.6 });
const camera = (name: string, x: number, mountY: number, angle: number, sweep: number, speed: number, range: number): Hazard =>
  ({ kind: 'camera', name, x, y: mountY + 65, mountY, angle, spread: 0.22, sweep, speed, range, phase: 1 });
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
  return prop(art(key, x, y), surfaces.map((a) => box(x + a.x, y + a.y, a.w, a.h)));
}

// ---------------------------------------------------------------- Form 7-B

/** Ring radius per drone kind, tuned with the difficulty evaluator for a one-thumb phone player. */
export const PROBE_RING: Readonly<Record<ProbeKind, number>> = { thermo: 54, hammer: 56, feather: 60 };
const LABEL: Readonly<Record<ProbeKind, string>> = { thermo: 'Temperature', hammer: 'Reflexes', feather: 'Ticklishness' };
/** Form 7-B, per specimen and drone kind: what goes on the clipboard and the report. */
const READINGS = {
  hank: { thermo: 'Temperature: lukewarm', hammer: 'Reflexes: brisk', feather: 'Ticklishness: extreme' },
  osei: { thermo: 'Temperature: running on coffee', hammer: 'Reflexes: on call', feather: 'Ticklishness: professionally denied' },
  pemberton: { thermo: 'Temperature: sedated', hammer: 'Reflexes: eventually', feather: 'Ticklishness: unbothered' },
} as const satisfies Record<string, Record<ProbeKind, string>>;
type Specimen = keyof typeof READINGS;

/**
 * A drone whose ring sits where the named joint hangs when the beam is at (bx, by): the head
 * hangs ~75 px above the beam, a knee ~135 below, a foot ~200 below. `kick` = the reflex direction.
 */
function drone(who: Specimen, kind: ProbeKind, bx: number, by: number, kick: [number, number] = [0, -1]): ProbeDrone {
  const dy = kind === 'thermo' ? -78 : kind === 'hammer' ? 132 : 198;
  const dx = kind === 'thermo' ? -4 : kind === 'hammer' ? -14 : -22;
  return { kind, x: bx + dx, y: by + dy, r: PROBE_RING[kind], label: LABEL[kind], reading: READINGS[who][kind], kickX: kick[0], kickY: kick[1] };
}

// ---------------------------------------------------------------- specimens

const SUBJECTS = {
  hank: {
    caption: 'Hank has lost his place in the queue.',
    mumbles: ['Is it my turn yet?', 'Ticket three-four-seven, present.', 'I fasted for this.', 'Four stars. The chairs were comfy.', 'Now serving… me?'],
  },
  osei: {
    caption: 'Dr. Osei has seen things. Now she has seen us.',
    mumbles: ['Page me if it’s interesting.', 'That is not where the appendix goes.', 'My coffee needs a second opinion.', 'Hand me the… sandwich.', 'Thirty-one hours. Thirty-two.'],
  },
  pemberton: {
    caption: 'Mr. Pemberton slept through his own procedure. He will not sleep through this.',
    mumbles: ['Is it over? Lovely.', 'Tell the nurse I was brave.', 'Four stars. Would sleep again.', 'No, the other arm.', 'Initial here to continue dreaming.'],
  },
} satisfies Record<Specimen, { caption: string; mumbles: readonly string[] }>;

function route(
  home: Building, human: Specimen, pose: Pose, item: Room['item'], exitName: string, exit: Sprite, exitZone: Area,
  checkpoints: readonly Checkpoint[], probes: readonly ProbeDrone[], roofExit = false,
): Room {
  const { caption, mumbles } = SUBJECTS[human];
  const furniture = home.rooms.flatMap((section) => [...section.furniture.map((piece) => prop(piece)), ...section.supports]);
  return {
    human, pose, item, furniture, exit, exitZone, roofExit, backdrop: home.rooms[0]!.backdrop, par: 90, route: [],
    interior: { building: home, checkpoints, caption, mumbles, exitName, probes },
  };
}

// ====================================================================== Hank (Endoscopy Wing)
// West: supply room | corridor | waiting room (Hank) | lobby (Nurse Gladys at the station) | vestibule (revolving door) :east

const hankChairs = support('waiting_chairs', 560, 576, box(8, 62, 284, 20), box(20, 82, 12, 28), box(268, 82, 12, 28));
const HANK_POSE: Pose = { ...BED_POSE, neckX: 650, neckY: 602 };
const HANK_EXITS = {
  front: art('exit_patio_door', 2390, 446),
  rear: art('exit_back_door', -1626, 466),
} as const;

const hankHome = building([
  room('Supply room', 'utility', box(-1640, 0, 800, 700),
    [HANK_EXITS.rear, art('internal_affairs_sign', -1400, 92)],
    [art('boxes', -1300, 576), art('boxes', -1060, 576)]),
  room('Endoscopy corridor', 'corridor', box(-840, 0, 840, 700),
    [art('internal_affairs_sign', -560, 92), art('xray_lightbox', -260, 150)], []),
  room('Waiting room', 'waiting_room', box(0, 0, 940, 700),
    [art('ticket_sign', 470, 110)], [], [hankChairs]),
  room('Lobby', 'waiting_room', box(940, 0, 880, 700),
    [art('internal_affairs_sign', 1300, 92)], [art('vending_machine', 1640, 466)]),
  room('Vestibule', 'hallway', box(1820, 0, 760, 700),
    [art('revolving_door', 1960, 446), HANK_EXITS.front]),
], [door(-840, 210), door(0, 210), door(940, 210), door(1820, 150)], [
  // rear: the laundry cart rolls up and down the corridor under you
  patrol('Laundry cart', art('laundry_cart', -470, 576), 150, 0, 1.0),
  { kind: 'creak', name: 'Squeaky lino', area: box(-820, 200, 800, 470) },
  gate('Rear service door', box(-1500, 214, 34, 472), 'y', 7.0, 3.9, 2.0),
  // front
  fragile('Water cooler', art('water_cooler', 1480, 536)),
  fan('Revolving door', 2060, 566, 104, 1.5),
], [sleeper('Gladys', 1100, 686, 380)]);

export const hankFront = route(hankHome, 'hank', HANK_POSE,
  // v4 items: on top of the lobby vending machine
  { sprite: art('prep_jug', 1675, 406), name: 'jug of prep drink' },
  'FRONT DOORS', HANK_EXITS.front, box(2430, 490, 90, 160), [
    point(700, 420), point(780, 340),
    probeAt(860, 340, 0),
    point(1080, 340), point(1260, 330),
    probeAt(1330, 330, 1),
    point(1520, 270), point(1600, 245), point(1820, 245), point(1900, 290),
    point(2240, 290, 'Revolving door', 160),
    point(2400, 360), point(2470, 560),
  ], [
    drone('hank', 'thermo', 860, 340),
    // the feather kick swings the foot back up and away from the water cooler
    drone('hank', 'feather', 1330, 330, [-0.8, -0.6]),
  ]);

export const hankRear = route(hankHome, 'hank', HANK_POSE,
  { sprite: art('prep_jug', 470, 626), name: 'jug of prep drink' },
  'REAR ENTRANCE', HANK_EXITS.rear, box(-1600, 480, 80, 180), [
    point(640, 420), point(560, 340),
    probeAt(480, 340, 0),
    point(150, 345), point(-120, 340),
    probeAt(-260, 330, 1),
    point(-640, 320), point(-900, 340), point(-1200, 350),
    point(-1440, 400), point(-1560, 540, 'Rear service door', 170),
  ], [
    drone('hank', 'thermo', 480, 340),
    drone('hank', 'hammer', -260, 330, [0.7, -0.7]),
  ]);

// ====================================================================== Dr. Osei (on-call block)
// West: lift shaft | on-call room (Osei, the pager) | corridor (camera) | pharmacy (shelves, hatch) :east

const oseiBunk = support('bunk_bed', 230, 466, box(7, 52, 282, 16), box(7, 161, 282, 12));
const OSEI_POSE: Pose = { ...BED_POSE, neckX: 322, neckY: 482 };
const OSEI_EXITS = {
  helipad: art('exit_roof_hatch', -320, -1316),
  pharmacy: art('exit_window', 2440, 240),
} as const;

const oseiHome = building([
  room('Lift shaft', 'shaft', box(-480, -1330, 480, 2030),
    [OSEI_EXITS.helipad, fit('ladder', -60, -453, 46, 1139)]),
  room('On-call room', 'on_call', box(0, 0, 760, 700),
    [art('internal_affairs_sign', 470, 92)], [art('nightstand', 600, 576)], [oseiBunk]),
  room('On-call corridor', 'corridor', box(760, 0, 900, 700),
    [art('xray_lightbox', 1080, 140), art('iv_stand', 1460, 486)], []),
  room('Pharmacy', 'pharmacy', box(1660, 0, 960, 700),
    [OSEI_EXITS.pharmacy], []),
], [opening('vertical', 0, 300, 686, 'shaft'), door(760, 200), door(1660, 200)], [
  // her pager buzzes on a cycle: noise for anything near it
  { kind: 'speaker', name: 'Pager', sprite: art('pager', 626, 546), radius: 300, period: 2.4 },
  // helipad: the lift car rides its track, a safety gate cycles across the shaft
  patrol('Lift car', art('elevator_car', -460, -195), 0, 240, 0.8),
  gate('Lift safety gate', box(-466, -560, 452, 34), 'x', 7.3, 4.0, 1.6),
  // pharmacy
  camera('Corridor camera', 1240, 14, 1.57, 0.6, 1.3, 305),
  { kind: 'creak', name: 'Squeaky lino', area: box(1680, 200, 640, 470) },
  fragile('Pill shelf', art('pill_shelf', 1900, 486)),
  fragile('Pill shelf', art('pill_shelf', 2120, 486)),
  gate('Pharmacy hatch', box(2380, 214, 34, 472), 'y', 7.1, 3.9, 3.0),
]);

export const oseiHelipad = route(oseiHome, 'osei', OSEI_POSE,
  // v4 items: on the lift-shaft floor under the feather probe (it used to drop 140 px off the bunk's end)
  { sprite: art('coffee_mug', -300, 656), name: 'on-call coffee' },
  'ROOF HELIPAD', OSEI_EXITS.helipad, box(-296, -1296, 112, 61), [
    point(330, 250), point(200, 250),
    probeAt(170, 250, 0),
    point(120, 430), point(-80, 440), point(-150, 420),
    probeAt(-150, 400, 1),
    point(-150, 0), point(-150, -360),
    point(-150, -760, 'Lift safety gate', 225),
    point(-200, -1050), point(-240, -1270),
  ], [
    drone('osei', 'thermo', 170, 250),
    drone('osei', 'feather', -150, 400, [0.9, -0.4]),
  ], true);

export const oseiPharmacy = route(oseiHome, 'osei', OSEI_POSE,
  { sprite: art('coffee_mug', 640, 516), name: 'on-call coffee' },
  'PHARMACY HATCH', OSEI_EXITS.pharmacy, box(2470, 270, 100, 150), [
    point(330, 250), point(560, 250), point(700, 340), point(780, 340),
    probeAt(830, 330, 0),
    point(860, 330),
    point(1620, 320, 'Corridor camera', 240),
    point(1740, 300),
    probeAt(1790, 290, 1),
    point(1880, 250), point(2280, 250), point(2340, 350),
    point(2510, 350, 'Pharmacy hatch', 175),
  ], [
    drone('osei', 'thermo', 830, 330),
    // the feather kick sends the foot up and back, away from the shelves
    drone('osei', 'feather', 1790, 290, [-0.9, -0.4]),
  ]);

// ====================================================================== Mr. Pemberton (recovery ward)
// West: chute (down) | linen room | recovery bay (Pemberton, Roland, monitors) | corridor | window :east

const pembertonBed = support('hospital_bed', 60, 536, box(12, 48, 296, 50), box(3, 3, 9, 63));
const PEMBERTON_POSE: Pose = { ...BED_POSE, neckX: 144, neckY: 548 };
const PEMBERTON_EXITS = {
  window: art('exit_window', 2340, 200),
  chute: art('exit_vent', -660, 1300),
} as const;

const pembertonHome = building([
  room('Laundry chute', 'duct', box(-760, 700, 360, 960)),
  room('Linen room', 'linen_room', box(-800, 0, 800, 700),
    [], [art('laundry_cart', -300, 576)]),
  room('Recovery bay', 'recovery_bay', box(0, 0, 1000, 700),
    [art('heart_monitor', 400, 536), art('iv_stand', 900, 486)], [], [pembertonBed], [fit('privacy_curtain', 520, 14, 110, 170)]),
  room('Ward corridor', 'corridor', box(1000, 0, 1520, 700),
    [art('internal_affairs_sign', 1500, 92)], []),
], [door(0, 200), door(1000, 200), hatch(700, -700, 'shaft', 220)], [
  // window
  camera('Ward camera', 1560, 14, 1.6, 0.7, 1.3, 305),
  { kind: 'creak', name: 'Squeaky lino', area: box(560, 200, 420, 470) },
  // chute
  gate('Laundry flap', box(-700, 686, 220, 30), 'x', 7.2, 4.4, 1.4),
  draft('Chute draft', box(-746, 716, 332, 930), 0, 260),
  { kind: 'creak', name: 'Squeaky lino', area: box(-780, 200, 560, 470) },
], [sleeper('Roland', 680, 686, 340)]);

export const pembertonWindow = route(pembertonHome, 'pemberton', PEMBERTON_POSE,
  // v4 items: on the bed under his raised knees (on the floor at the bed's foot it was out of reach)
  { sprite: art('hospital_sock', 280, 564), name: 'hospital sock' },
  'RECOVERY WINDOW', PEMBERTON_EXITS.window, box(2370, 230, 100, 140), [
    point(200, 400), point(330, 320),
    probeAt(400, 320, 0),
    point(640, 300), point(900, 330), point(1100, 330),
    probeAt(1170, 320, 1),
    point(1240, 320),
    point(1890, 320, 'Ward camera', 235),
    point(2200, 310), point(2420, 300),
  ], [
    drone('pemberton', 'thermo', 400, 320),
    drone('pemberton', 'hammer', 1170, 320, [0.7, -0.7]),
  ]);

export const pembertonChute = route(pembertonHome, 'pemberton', PEMBERTON_POSE,
  // v4 items: in the laundry cart on the way to the chute (under the bed's head it was out of reach)
  { sprite: art('hospital_sock', -244, 556), name: 'hospital sock' },
  'LAUNDRY CHUTE', PEMBERTON_EXITS.chute, box(-650, 1320, 120, 110), [
    point(180, 400), point(140, 330),
    probeAt(120, 330, 0),
    point(-160, 340), point(-380, 320),
    probeAt(-440, 320, 1),
    point(-590, 330), point(-590, 430),
    point(-590, 850, 'Laundry flap', 240),
    point(-590, 1150, undefined, 30), point(-590, 1370, undefined, 28),
  ], [
    drone('pemberton', 'thermo', 120, 330),
    drone('pemberton', 'hammer', -440, 320, [0.8, -0.6]),
  ]);
