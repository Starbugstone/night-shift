import { building, type Building, type Checkpoint, type Hazard, type InteriorRoom, type Opening, type Sleeper } from './interior';
import { BED_POSE, CHAIR_POSE, prop, sprite, type Area, type Human, type Room, type Sprite } from './layout';
import type { Pose } from '../ragdoll';

const box = (x: number, y: number, w: number, h: number): Area => ({ x, y, w, h });
const art = (key: string, x: number, y: number): Sprite => sprite('room/' + key, x, y);
const fit = (key: string, x: number, y: number, w: number, h: number): Sprite => ({ key: 'room/' + key, x, y, w, h });
const point = (x: number, y: number, cross?: string, speed?: number): Checkpoint => ({ x, y, cross, speed });
const room = (
  name: string, backdrop: string, area: Area, decor: readonly Sprite[] = [], furniture: readonly Sprite[] = [],
): InteriorRoom => ({ ...area, name, backdrop: 'room/bg_' + backdrop, decor, furniture });
const opening = (
  axis: Opening['axis'], at: number, from: number, to: number, trim: Opening['trim'],
): Opening => ({ axis, at, from, to, trim });
const door = (x: number, y: number, h = 345): Opening => opening('vertical', x, y, y + h, 'door');
const hatch = (y: number, x: number, trim: Opening['trim']): Opening => opening('horizontal', y, x, x + 164, trim);
const swing = (name: string, sprite: Sprite, amplitude = 0.55, speed = 1.8, phase = 0): Hazard =>
  ({ kind: 'swing', name, sprite, amplitude, speed, phase });
const fan = (name: string, x: number, y: number, length: number, speed: number, duct = false): Hazard =>
  ({ kind: 'fan', name, x, y, length, speed, phase: 0.6, duct });
const gate = (
  name: string, key: string, area: Area, axis: 'x' | 'y', period: number, open: number, phase: number, hinged = false,
): Hazard => ({ kind: 'gate', name, key: 'room/' + key, area, axis, cycle: { period, open, phase }, hinged });
const laser = (name: string, area: Area, period: number, open: number, phase: number): Hazard =>
  ({ kind: 'laser', name, area, cycle: { period, open, phase } });
const patrol = (name: string, sprite: Sprite, dx: number, dy: number, speed: number, barks = false): Hazard =>
  ({ kind: 'patrol', name, sprite, dx, dy, speed, phase: 0.6, barks });
const camera = (name: string, x: number, y: number, angle: number, sweep: number, speed: number, range: number): Hazard =>
  ({ kind: 'camera', name, x, y, angle, spread: 0.22, sweep, speed, range, phase: 1 });
const fragile = (name: string, sprite: Sprite): Hazard => ({ kind: 'fragile', name, sprite });
const draft = (name: string, area: Area, ax: number, ay: number): Hazard => ({ kind: 'draft', name, area, ax, ay });
const sleeper = (name: string, x: number, feet: number, radius: number): Sleeper => {
  const key = name.toLowerCase();
  const asleep = art(key + '_asleep', x, 0);
  const awake = art(key + '_awake', x, 0);
  asleep.y = feet - asleep.h;
  awake.y = feet - awake.h;
  return { name, asleep, awake, radius };
};

const EXITS = {
  daveRoof: art('exit_roof_hatch', 857, -752),
  davePatio: art('exit_patio_door', 1584, 960),
  barbChimney: art('exit_chimney_top', 639, -1202),
  barbBackdoor: art('exit_back_door', 2228, 393),
  garySkylight: art('exit_skylight', 434, -902),
  garyGaragedoor: art('exit_loading_door', 2044, 369),
  nigelSkylight: art('exit_skylight', 2374, 49),
  nigelLoading: art('exit_loading_door', 1574, 992),
  kevVent: art('exit_vent', 966, -977),
  kevFireescape: art('exit_fire_escape', 2282, 382),
  mayorClocktower: art('clock_face_back', 1260, -1050),
  mayorElevator: art('exit_roof_hatch', 1761, -1307),
} as const;

const SUBJECTS = {
  dave: {
    pose: { ...BED_POSE, neckX: 131, neckY: 552 },
    item: { sprite: art('slipper', 304, 651), name: 'orthodontic slipper' },
    caption: 'The dentist will be billing for this wake-up call.',
    mumbles: ['Floss the moon, please.', 'That’s a load-bearing molar.', 'The plaque has a lawyer.', 'No, the drill dreams about me.'],
  },
  barb: {
    pose: { ...BED_POSE, neckX: 139, neckY: 558 },
    item: { sprite: art('slipper', 315, 665), name: 'team-issued slipper' },
    caption: 'Coach is calling a mandatory time-out.',
    mumbles: ['Give me twenty more naps.', 'That’s a foul on the pillow.', 'Stop stretching the mascot.', 'Everybody hydrate the couch.'],
  },
  gary: {
    pose: { ...CHAIR_POSE, neckX: 123, neckY: 503 },
    item: { sprite: art('coffee_mug', 258, 577), name: 'neighbourhood watch mug' },
    caption: 'Gary finally caught something. It was his own abduction.',
    mumbles: ['That squirrel is casing us.', 'Put the begonias on the watchlist.', 'Enhance the wheelie bin.', 'The cul-de-sac needs a password.'],
  },
  nigel: {
    pose: { ...CHAIR_POSE, neckX: 120, neckY: 507 },
    item: { sprite: art('coffee_mug', 317, 584), name: 'fossilized coffee' },
    caption: 'The museum has added you to its Incident Collection.',
    mumbles: ['The mummy has a parking pass.', 'Stop feeding the fossils.', 'The T. rex owes me a tenner.', 'Please don’t tap on the sarcophagus.'],
  },
  kev: {
    pose: { ...CHAIR_POSE, neckX: 135, neckY: 500 },
    item: { sprite: art('coffee_mug', 286, 578), name: 'limited-edition DJ mug' },
    caption: 'The beat dropped. So did the performance review.',
    mumbles: ['Next up, forty minutes of beige.', 'Drop the bass gently.', 'My headphones are in a union.', 'This one goes out to the duvet.'],
  },
  mayor: {
    pose: { ...CHAIR_POSE, neckX: 124, neckY: 502 },
    item: { sprite: art('coffee_mug', 300, 582), name: 'municipal mug' },
    caption: 'You’ve been added to next Tuesday’s agenda.',
    mumbles: ['I hereby declare it bedtime.', 'Motion to table the blanket.', 'The potholes are polling well.', 'My pillow has diplomatic immunity.'],
  },
} satisfies Record<string, { pose: Pose; item: Room['item']; caption: string; mumbles: readonly string[] }>;

function route(
  home: Building, human: keyof typeof SUBJECTS & Human, exitName: string, exit: Sprite, exitZone: Area,
  checkpoints: readonly Checkpoint[], roofExit = false,
): Room {
  const { pose, item, caption, mumbles } = SUBJECTS[human];
  const furniture = home.rooms.flatMap(section => section.furniture.map(piece => prop(piece)));
  return {
    human, pose, item, furniture, exit, exitZone, roofExit, backdrop: home.rooms[0]!.backdrop, par: 90, route: [],
    interior: { building: home, checkpoints, caption, mumbles, exitName },
  };
}

const daveHall = [
  point(245, 384), point(580, 312), point(820, 312), point(1040, 365), point(1192, 146),
] as const;
const daveHome = building([
  room('Master bedroom', 'suburb_bedroom', box(0, 0, 760, 700),
    [art('double_bed', 60, 523), art('portrait_cow', 205, 150)],
    [art('wardrobe', 470, 443), art('nightstand', 383, 574)]),
  room('Upstairs hall', 'hallway', box(760, 0, 760, 700),
    [art('grandfather_clock', 878, 416), art('ladder', 1162, 39)],
    [art('bookcase', 1290, 456)]),
  room('Attic', 'attic', box(760, -780, 760, 780),
    [EXITS.daveRoof, art('ladder', 1162, -236)], [art('boxes', 842, -133), art('boxes', 1348, -130), art('shelf', 883, -294)]),
  room('Stairwell', 'stairwell', box(0, 700, 760, 700),
    [fit('stairs', 207, 858, 476, 510)], [art('bookcase', 22, 1156)]),
  room('Living room', 'living_room', box(760, 700, 1000, 700),
    [EXITS.davePatio, art('tv_static', 955, 1282)], [art('couch', 1010, 1262), art('nightstand', 1401, 1276)]),
], [
  door(760, 210), hatch(0, 1110, 'ladder'), hatch(700, 204, 'stairs'), door(760, 881),
], [
  swing('Grandfather clock', art('pendulum', 901, 455), 0.62, 2.5),
  patrol('Hall vacuum', art('robot_vacuum', 983, 654), 118, 0, 1.65),
  gate('Attic ladder hatch', 'exit_roof_hatch', box(1110, -17, 164, 34), 'x', 6.8, 3.85, 2.25),
  swing('Attic bulb', art('hanging_bulb', 1040, -606), 0.72, 2.2),
  fragile('Dental trophy', art('trophy', 921, -354)),
  { kind: 'creak', name: 'Creaky stairs', area: box(195, 728, 540, 575) },
  swing('Living room chandelier', art('chandelier', 942, 715), 0.38, 2.1),
  fan('Living room fan', 1113, 1160, 133, 2.6),
  fragile('Fish tank', art('fish_tank', 1359, 1176)),
  gate('Patio screen', 'garage_door', box(1600, 881, 34, 390), 'y', 6.9, 3.85, 1.7),
], [sleeper('Brenda', 229, 608, 330)]);

export const daveRoof = route(daveHome, 'dave', 'ROOF HATCH', EXITS.daveRoof,
  box(883, -733, 106, 62), [...daveHall, point(1192, -250, 'Attic ladder hatch', 195),
    point(1285, -414), point(1150, -399), point(935, -422), point(935, -716)], true);
export const davePatio = route(daveHome, 'dave', 'PATIO DOOR', EXITS.davePatio,
  box(1667, 1008, 68, 110), [
    point(286, 429), point(286, 934, undefined, 36), point(392, 1001), point(650, 981), point(856, 981),
    point(991, 912), point(1253, 924, 'Living room fan', 132), point(1470, 985),
    point(1712, 1018, 'Patio screen', 175),
  ]);

const barbHome = building([
  room('Living room', 'living_room', box(0, 0, 800, 700),
    [art('couch', 69, 529), art('fireplace', 478, 26)],
    [art('tv_static', 405, 580), art('bookcase', 659, 458)]),
  room('Fireplace flue', 'duct', box(465, -1220, 370, 1220),
    [EXITS.barbChimney, fit('ladder', 479, -682, 44, 455)]),
  room('Kitchen', 'kitchen', box(800, 0, 760, 700),
    [art('hanging_pans', 1180, 77)],
    [art('counter', 1014, 571), art('fridge', 1350, 479)]),
  room('Utility room', 'utility', box(1560, 0, 820, 700),
    [EXITS.barbBackdoor, art('dog_bed', 1729, 646)], [art('dryer', 1835, 551), art('boxes', 2043, 575)]),
], [hatch(0, 535, 'flue'), door(800, 190), door(1560, 321)], [
  draft('Soot draft', box(479, -1180, 340, 1170), -105, 310),
  gate('Soot damper', 'exit_roof_hatch', box(479, -547, 342, 28), 'x', 7.3, 3.95, 1.25),
  swing('Hanging pans', art('hanging_pans', 964, 115), 0.4, 2.15),
  fragile('Dinner plates', art('plate_stack', 1176, 511)),
  patrol('Kitchen vacuum', art('robot_vacuum', 978, 654), 106, 0, 1.7),
  gate('Swinging back door', 'swing_door', box(2182, 303, 32, 378), 'y', 7, 3.7, 0.7, true),
], [sleeper('Biscuit', 1739, 666, 380)]);

export const barbChimney = route(barbHome, 'barb', 'CHIMNEY', EXITS.barbChimney,
  box(662, -1164, 92, 70), [
    point(282, 350), point(471, 286), point(620, 198), point(620, -114), point(673, -392),
    point(673, -792, 'Soot damper', 200), point(723, -957), point(708, -1140),
  ], true);
export const barbBackdoor = route(barbHome, 'barb', 'BACK DOOR', EXITS.barbBackdoor,
  box(2263, 428, 72, 109), [
    point(317, 351), point(624, 313), point(912, 302), point(1198, 346), point(1438, 442),
    point(1640, 445), point(1805, 350), point(2043, 345), point(2073, 432),
    point(2308, 448, 'Swinging back door', 176),
  ]);

const garyGarage = [
  point(220, 386), point(383, 346), point(711, 341, "Gary's laser", 195),
] as const;
const garyHome = building([
  room('Garage HQ', 'garage', box(0, 0, 1000, 700),
    [art('camping_chair', 93, 554), art('power_tools', 220, 72)],
    [art('monitor_bank', 232, 544)]),
  room('Loft storage', 'attic', box(370, -920, 630, 920),
    [EXITS.garySkylight, art('ladder', 745, -245)], [art('boxes', 489, -250), fit('bookcase', 902, -374, 84, 191)]),
  room('Side workshop', 'garage', box(1000, 0, 1240, 700),
    [EXITS.garyGaragedoor, art('power_tools', 1306, 118)], [art('workbench', 1205, 572), art('boxes', 1642, 572), art('boxes', 1780, 580)]),
], [hatch(0, 694, 'ladder'), door(1000, 282)], [
  laser("Gary's laser", box(535, 14, 10, 672), 6.4, 3.35, 0.4),
  swing('Work lamp', art('work_lamp', 862, 30), 0.65, 2.3),
  camera("Gary's camera", 1226, 119, 0.8, 1.0, 1.1, 380),
  patrol('Watch dog', fit('biscuit_awake', 1950, 607, 89, 62), 30, 0, 1.07, true),
  gate('Garage door', 'garage_door', box(2070, 282, 34, 404), 'y', 7.15, 3.95, 3.4),
]);

export const garySkylight = route(garyHome, 'gary', 'GARAGE SKYLIGHT', EXITS.garySkylight,
  box(467, -885, 134, 65), [
    ...garyGarage, point(776, 206), point(776, -222), point(846, -480), point(674, -558),
    point(535, -705), point(535, -865),
  ], true);
export const garyGaragedoor = route(garyHome, 'gary', 'GARAGE DOOR', EXITS.garyGaragedoor,
  box(2138, 411, 78, 116), [
    ...garyGarage, point(919, 399), point(1097, 407), point(1315, 430, "Gary's camera", 188),
    point(1517, 376), point(1796, 320), point(1930, 414), point(2180, 423, 'Garage door', 186),
  ]);

const nigelHome = building([
  room('Security office', 'office', box(0, 0, 760, 700),
    [art('office_chair', 93, 536), art('security_desk', 199, 562)],
    [art('bookcase', 475, 466)]),
  room('Dinosaur hall', 'museum', box(760, 0, 940, 700),
    [], [art('dino_skull', 938, 270), art('dino_ribs', 1183, 481), art('dino_legs', 1456, 413)]),
  room('Laser vault', 'vault', box(1700, 0, 930, 700),
    [EXITS.nigelSkylight], [art('display_case', 1827, 514), art('display_case', 2235, 515)]),
  room('Gift shop', 'museum', box(0, 700, 760, 700),
    [art('shelf', 391, 1135)], [art('bookcase', 460, 1156)]),
  room('Loading bay', 'garage', box(760, 700, 1010, 700),
    [EXITS.nigelLoading], [art('boxes', 905, 1269), art('boxes', 1315, 1269)]),
], [door(760, 175), door(1700, 212), hatch(700, 226, 'ladder'), door(760, 890)], [
  swing('Pterodactyl', art('pterodactyl', 1145, 83), 0.58, 2.0),
  laser('Vault grid', box(2058, 14, 10, 672), 6.1, 3.2, 0.95),
  laser('Skylight grid', box(2298, 178, 318, 10), 5.8, 3.2, 1.8),
  { kind: 'gear', name: 'Postcard rack', sprite: fit('postcard_rack', 544, 1130, 112, 112), speed: -2.2 },
  fragile('Snow globe', art('snow_globe', 457, 1095)),
  gate('Cargo shutter', 'cargo_shutter', box(1532, 887, 34, 479), 'y', 7, 3.85, 2.2),
]);
export const nigelSkylight = route(nigelHome, 'nigel', 'MUSEUM SKYLIGHT', EXITS.nigelSkylight,
  box(2407, 64, 134, 70), [
    point(263, 308), point(560, 260), point(830, 275), point(891, 196), point(1100, 180),
    point(1270, 272), point(1472, 299), point(1750, 311), point(1930, 328), point(2227, 328, 'Vault grid', 197),
    point(2467, 335), point(2474, 78, 'Skylight grid', 177),
  ], true);
export const nigelLoading = route(nigelHome, 'nigel', 'LOADING BAY', EXITS.nigelLoading,
  box(1655, 1020, 77, 115), [
    point(308, 531), point(308, 896), point(391, 969), point(691, 1000), point(858, 1001),
    point(1100, 1020), point(1186, 899), point(1395, 994), point(1684, 1044, 'Cargo shutter', 188),
  ]);

const kevDance = [point(244, 331), point(526, 309), point(760, 311)] as const;
const kevHome = building([
  room('DJ booth', 'club', box(0, 0, 660, 700),
    [art('office_chair', 106, 536), art('dj_booth', 210, 550)],
    [art('speaker_stack', 480, 461)]),
  room('Dance floor', 'club', box(660, 0, 900, 700),
    [], [art('speaker_stack', 1350, 463)]),
  room('Vent duct', 'duct', box(880, -1000, 500, 1000),
    [EXITS.kevVent, fit('ladder', 890, -622, 46, 440)]),
  room('Green room', 'club', box(1560, 0, 900, 700),
    [EXITS.kevFireescape], [art('coat_rack', 1691, 485), fit('couch', 2047, 606, 174, 80)]),
], [door(660, 185), hatch(0, 1041, 'vent'), door(1560, 274)], [
  swing('Disco ball', fit('disco_ball', 1148, 74, 87, 92), 0.69, 1.9),
  { kind: 'speaker', name: 'Bass stack', sprite: art('speaker_stack', 805, 462), radius: 267, period: 1.44 },
  fan('Duct fan', 1273, -451, 108, -2.35, true),
  draft('Vent updraft', box(894, -969, 462, 943), 75, -385),
  gate('Roof vent flap', 'exit_vent', box(894, -677, 472, 30), 'x', 7.1, 4, 3.7),
  fragile('Champagne tower', art('champagne_tower', 1952, 470)),
  gate('Fire-escape sash', 'swing_door', box(2266, 261, 32, 421), 'y', 7.25, 3.88, 4.15),
], [sleeper('Tiny', 1855, 686, 390)]);
export const kevVent = route(kevHome, 'kev', 'ROOF VENT', EXITS.kevVent,
  box(995, -958, 102, 62), [
    ...kevDance, point(955, 289), point(1123, 214), point(1123, -207),
    point(1023, -333), point(1027, -531, 'Duct fan', 142),
    point(1050, -854, 'Roof vent flap', 181), point(1046, -944),
  ], true);
export const kevFireescape = route(kevHome, 'kev', 'FIRE ESCAPE', EXITS.kevFireescape,
  box(2350, 406, 76, 115), [
    ...kevDance, point(1010, 371), point(1266, 362), point(1455, 395), point(1650, 405),
    point(1822, 292), point(2068, 281), point(2131, 397), point(2397, 422, 'Fire-escape sash', 187),
  ]);

const mayorHall = [point(260, 321), point(527, 309), point(828, 318), point(1174, 309, 'City hall camera', 196)] as const;
const mayorHome = building([
  room('Mayor’s office', 'office', box(0, 0, 760, 700),
    [art('office_chair', 95, 532), art('mayor_desk', 185, 552), art('mayor_portrait', 367, 76)],
    [art('flag_stand', 574, 465)]),
  room('City hall corridor', 'corridor', box(760, 0, 880, 700),
    [], [art('water_cooler', 1142, 550), art('vase', 1404, 618)]),
  room('Clock tower', 'clocktower', box(1120, -1070, 520, 1070),
    [EXITS.mayorClocktower, fit('ladder', 1244, -230, 56, 245)]),
  room('Elevator shaft', 'shaft', box(1640, -1330, 480, 2030),
    [EXITS.mayorElevator, fit('ladder', 1664, -186, 46, 595)]),
], [door(760, 174, 420), hatch(0, 1190, 'ladder'), opening('vertical', 1640, 300, 653, 'shaft')], [
  camera('City hall camera', 1021, 112, 1.58, 0.61, 1.6, 354),
  camera('Elevator lobby camera', 1568, 121, 1.3, 0.62, 1.47, 325),
  { kind: 'gear', name: 'Drive gear', sprite: art('gear_big', 1379, -435), speed: 1.8 },
  { kind: 'gear', name: 'Idle gear', sprite: art('gear_small', 1138, -472), speed: -3.6 },
  swing('Tower pendulum', fit('pendulum', 1465, -900, 54, 187), 0.87, 2.05),
  gate('Clock service hatch', 'exit_roof_hatch', box(1134, -671, 492, 27), 'x', 7.5, 4.05, 1.1),
  gate('Shaft safety shutter', 'cargo_shutter', box(1654, -488, 452, 35), 'x', 7.35, 4.05, 1.9),
  patrol('Elevator car', fit('elevator_car', 1912, -677, 182, 181), 0, 261, 0.8),
  patrol('Counterweight', art('counterweight', 2027, -854), 0, 190, 1.5),
  { kind: 'pop', name: 'Cuckoo bird', area: box(1314, -942, 93, 44), cycle: { period: 3.6, open: 2.52, phase: 2.5 } },
]);
export const mayorClocktower = route(mayorHome, 'mayor', 'CLOCK TOWER', EXITS.mayorClocktower,
  box(1332, -1004, 106, 92), [
    ...mayorHall, point(1272, 175), point(1272, -199), point(1304, -410), point(1311, -524),
    point(1330, -843, 'Clock service hatch', 185), point(1382, -969),
  ], true);
export const mayorElevator = route(mayorHome, 'mayor', 'ELEVATOR ROOF', EXITS.mayorElevator,
  box(1784, -1296, 114, 61), [
    ...mayorHall, point(1368, 399), point(1737, 421, 'Elevator lobby camera', 191),
    point(1841, 188), point(1785, -183), point(1785, -741, 'Shaft safety shutter', 225),
    point(1779, -1050), point(1840, -1273),
  ], true);
