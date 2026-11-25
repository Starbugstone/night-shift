import { en } from '../../i18n/en';
import { building, type Building, type Checkpoint, type Hazard, type InteriorRoom, type Opening, type Sleeper } from './interior';
import { BED_POSE, CHAIR_POSE, prop, sprite, type Area, type Furniture, type Room, type Sprite } from './layout';

const box = (x: number, y: number, w: number, h: number): Area => ({ x, y, w, h });
const art = (key: string, x: number, y: number): Sprite => sprite('room/' + key, x, y);
const fit = (key: string, x: number, y: number, w: number, h: number): Sprite => ({ key: 'room/' + key, ...box(x, y, w, h) });
const point = (x: number, y: number, cross?: string, speed?: number): Checkpoint => ({ x, y, cross, speed });
const hatch = (y: number, from: number, to: number): Opening => ({ axis: 'horizontal', at: y, from, to, trim: 'shaft' });
const door = (x: number, from: number, to: number): Opening => ({ axis: 'vertical', at: x, from, to, trim: 'door' });
const section = (name: string, backdrop: string, area: Area, supports: Furniture[] = [], decor: Sprite[] = []): InteriorRoom =>
  ({ ...area, name, backdrop: 'room/bg_' + backdrop + '55', supports, decor, furniture: [], mounts: [] });
const swing = (name: string, sprite: Sprite, amplitude: number, speed: number, mountY: number): Hazard =>
  ({ kind: 'swing', name, sprite, amplitude, speed, mountY, phase: 0.6 });
const gate = (name: string, area: Area, axis: 'x' | 'y', period: number, open: number): Hazard =>
  ({ kind: 'gate', name, area, axis, cycle: { period, open, phase: 0.8 } });
const patrol = (name: string, sprite: Sprite, dx: number, dy: number): Hazard =>
  ({ kind: 'patrol', name, sprite, dx, dy, speed: 1.1, phase: 0.6 });
const sleeper = (name: string, x: number, y: number, radius: number): Sleeper => ({
  name, radius,
  asleep: fit('tiny_asleep', x, y, 90, 122),
  awake: fit('tiny_awake', x, y - 8, 90, 130),
});
const floor = (key: string, x: number, y: number, w: number, depth = 24): Furniture =>
  prop(art(key, x, y), [box(x, y, w, depth)]);
const shelf = (x: number, y: number, w = 100): Furniture => prop(fit('shelf', x, y, w, 20));

const SUBJECTS = {
  doc: { ...en.crestValley.sleepers.doc, pose: { ...BED_POSE, neckX: 130, neckY: 548 } },
  buff: { ...en.crestValley.sleepers.buff, pose: { ...CHAIR_POSE, neckX: 155, neckY: 486 } },
  marvin: { ...en.crestValley.sleepers.marvin, pose: { ...BED_POSE, neckX: 162, neckY: 558 } },
};

function route(
  home: Building, human: keyof typeof SUBJECTS, exitName: string, exit: Sprite, exitZone: Area,
  checkpoints: Checkpoint[], itemKey: string, itemName: string, itemX: number, itemBottom: number, roofExit = false,
): Room {
  const { pose, caption, mumbles } = SUBJECTS[human];
  const item = art(itemKey, 0, 0);
  item.x = itemX - item.w / 2;
  item.y = itemBottom - item.h;
  return {
    human, pose, item: { sprite: item, name: itemName }, exit, exitZone, roofExit, par: 90,
    backdrop: home.rooms[0]!.backdrop, furniture: home.rooms.flatMap(s => s.supports), route: [],
    interior: { building: home, checkpoints, caption, mumbles, exitName },
  };
}

export const CLOCK_FACE_55 = fit('clock_face_back', 221, 306, 194, 194);
export const TRUNK_55 = fit('trunk_body55', 45, 546, 336, 158);
export const GYM_DOORS_55 = art('gym_doors55', 530, 498);

const clockBay = section('Clock ledge', 'tower', box(0, 0, 740, 700), [
  floor('tower_ledge55', 36, 580, 322),
  prop(fit('gear_big', 350, 394, 194, 192)),
], [fit('tower_cable55', 85, 175, 438, 56)]);

// The two approaches share their ledge, then branch into the riser or winch gallery.
const balcony = art('exit_roof_hatch', 520, -604);
const towerUpper = building([
  clockBay,
  section('Clock riser', 'tower', box(390, -620, 350, 620), [shelf(408, -325, 108)], [balcony]),
], [hatch(0, 488, 708), hatch(-620, 500, 700)], [
  { kind: 'draft', name: 'Tower draft', area: box(468, -235, 237, 200), ax: 105, ay: 0 },
  swing('Lightning cable', fit('pendulum', 528, -320, 36, 94), 0.35, 1.2, -358),
  { kind: 'gear', name: 'Clock gear', sprite: fit('gear_small', 430, -510, 110, 110), speed: 0.9 },
]);

const service = fit('door_frame', 1370, 335, 120, 210);
const towerSide = building([
  clockBay,
  section('Winch gallery', 'tower', box(740, 0, 760, 700), [shelf(850, 510, 120)], [service]),
], [door(740, 217, 545), door(1500, 335, 545)], [
  patrol('Counterweight', fit('gear_small', 969, 519, 65, 68), 0, 50),
  gate('Service gate', box(1130, 150, 32, 536), 'y', 6.5, 4.7),
  swing('Service bell', fit('pendulum', 1010, 99, 44, 115), 0.4, 1.45, 40),
]);

const boothBay = section("Lyle's booth", 'cafe', box(0, 0, 740, 700), [
  prop(art('booth55', 42, 502), [box(60, 590, 150, 34)]),
  prop(fit('counter55', 355, 403, 192, 194)),
], [art('stool55', 573, 607)]);

const jukebox: Hazard = { kind: 'speaker', name: 'Jukebox', sprite: art('jukebox55', 575, 483), radius: 135, period: 2.4 };
const transom = fit('exit_skylight', 473, -442, 200, 80);
const cafeUpper = building([
  { ...boothBay, supports: [...boothBay.supports, shelf(349, 365, 105)] },
  section('Awning gallery', 'cafe', box(355, -455, 385, 455), [], [transom]),
], [hatch(0, 465, 685), hatch(-455, 465, 685)], [
  jukebox,
  { kind: 'fan', name: 'Ceiling fan', x: 693, y: 155, length: 46, speed: 1.9, phase: 0.6, duct: false, mountY: 28 },
  gate('Hinged sash', box(369, -210, 357, 25), 'x', 5.8, 3.55),
]);

const kitchen = fit('door_frame', 1380, 260, 120, 210);
const cafeSide = building([
  boothBay,
  section('Back kitchen', 'cafe', box(740, 0, 770, 700), [shelf(1115, 490, 130)], [kitchen, art('counter55', 1290, 566)]),
], [door(740, 230, 530), door(1510, 260, 470)], [
  jukebox,
  patrol('Bus cart', fit('laundry_cart', 880, 425, 110, 94), 68, 65),
  { kind: 'fragile', name: 'Pie case', sprite: art('pie_case55', 1030, 520) },
], [sleeper('Lyle', 1235, 452, 155)]);

const trunkBay = section('Trunk bay', 'dance_lot', box(0, 0, 740, 700), [
  prop(TRUNK_55, [box(64, 590, 267, 44), box(331, 563, 39, 77)]),
  prop(fit('amp_case55', 427, 457, 140, 159)),
], [art('trunk_lid55', 33, 432), GYM_DOORS_55]);

const bandstand = fit('exit_roof_hatch', 492, -502, 198, 70);
const danceUpper = building([
  { ...trunkBay, supports: [...trunkBay.supports, shelf(389, 410, 110)] },
  section('Stage rigging', 'dance_lot', box(390, -520, 350, 520), [], [bandstand]),
], [hatch(0, 480, 700), hatch(-520, 480, 700)], [
  swing('Microphone stand', fit('pendulum', 494, -240, 45, 120), 0.35, 1.32, -290),
  { kind: 'pop', name: 'Party balloons', area: box(659, -408, 66, 104), cycle: { period: 5.2, open: 3.3, phase: 1.3 } },
]);

const canopy = fit('door_frame', 1390, 290, 120, 215);
const danceSide = building([
  trunkBay,
  section('Loading bay', 'dance_lot', box(740, 0, 780, 700), [shelf(1118, 520, 116)], [canopy]),
], [door(740, 255, 535), door(1520, 290, 505)], [
  patrol('Amp trolley', art('amp_case55', 987, 460), 65, 66),
  { kind: 'creak', name: 'Canopy floorboards', area: box(1200, 380, 150, 220) },
], [sleeper('Chaperone', 1250, 460, 150)]);

export const ROOMS_1955 = {
  inventor_balcony: route(towerUpper, 'doc', 'CLOCK BALCONY', balcony, box(519, -594, 161, 66), [
    point(194, 300), point(315, 283), point(600, 279), point(599, -120), point(601, -343), point(601, -566),
  ], 'flex_capacitor', 'spare flex capacitor', 460, -325, true),
  inventor_service: route(towerSide, 'doc', 'SERVICE DOOR', service, box(1392, 367, 92, 133), [
    point(184, 254), point(326, 234), point(597, 229), point(657, 317), point(863, 312), point(1030, 304),
    point(1270, 304, 'Service gate', 200), point(1440, 420),
  ], 'hazmat_suit', 'yellow hazmat suit', 910, 510),
  bully_transom: route(cafeUpper, 'buff', 'AWNING TRANSOM', transom, box(493, -420, 160, 67), [
    point(173, 255), point(311, 180), point(575, 185), point(575, -98),
    point(572, -349, 'Hinged sash', 200), point(573, -387),
  ], 'retro_skateboard', 'retro skateboard', 405, 365, true),
  bully_kitchen: route(cafeSide, 'buff', 'KITCHEN DOOR', kitchen, box(1405, 278, 90, 135), [
    point(175, 270), point(320, 218), point(580, 223), point(660, 290), point(855, 296), point(1060, 280),
    point(1298, 271, undefined, 110), point(1450, 341),
  ], 'clock_flyer', 'clock-tower flyer', 1180, 490),
  band_hatch: route(danceUpper, 'marvin', 'BANDSTAND HATCH', bandstand, box(510, -485, 160, 65), [
    point(216, 316), point(365, 247), point(594, 235), point(600, -93),
    point(603, -330, 'Microphone stand', 160), point(590, -451),
  ], 'cherry_guitar', 'cherry electric guitar', 440, 410, true),
  band_canopy: route(danceSide, 'marvin', 'LOADING CANOPY', canopy, box(1413, 312, 98, 133), [
    point(214, 310), point(365, 234), point(596, 228), point(667, 304), point(879, 311),
    point(1110, 305), point(1320, 284, undefined, 115), point(1460, 373),
  ], 'puffy_vest', 'red puffy vest', 1170, 520),
} satisfies Record<string, Room>;
