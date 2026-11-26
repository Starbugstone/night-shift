import { building, type Building, type Checkpoint, type Hazard, type InteriorRoom, type Opening, type Sleeper } from './interior';
import { BED_POSE, CHAIR_POSE, prop, sprite, type Area, type Furniture, type Human, type Room, type Sprite } from './layout';
import type { Pose } from '../ragdoll';

const box = (x: number, y: number, w: number, h: number): Area => ({ x, y, w, h });
const art = (key: string, x: number, y: number): Sprite => sprite('room/' + key, x, y);
const fit = (key: string, x: number, y: number, w: number, h: number): Sprite => ({ key: 'room/' + key, x, y, w, h });
const point = (x: number, y: number, cross?: string, speed?: number): Checkpoint => ({ x, y, cross, speed });
const room = (
  name: string, backdrop: string, area: Area, decor: readonly Sprite[] = [], furniture: readonly Sprite[] = [],
  supports: readonly Furniture[] = [], mounts: readonly Sprite[] = [],
): InteriorRoom => ({ ...area, name, backdrop: 'room/bg_' + backdrop, decor, furniture, supports, mounts });
const opening = (
  axis: Opening['axis'], at: number, from: number, to: number, trim: Opening['trim'],
): Opening => ({ axis, at, from, to, trim });
const door = (x: number, top: number, floor = 686): Opening => opening('vertical', x, top, floor, 'door');
const hatch = (y: number, x: number, trim: Opening['trim'], width = 164): Opening => opening('horizontal', y, x, x + width, trim);
const swing = (name: string, sprite: Sprite, amplitude = 0.55, speed = 1.8, mountY?: number): Hazard =>
  ({ kind: 'swing', name, sprite, amplitude, speed, phase: 0, mountY });
const fan = (name: string, x: number, y: number, length: number, speed: number, duct: boolean, mountY?: number): Hazard =>
  ({ kind: 'fan', name, x, y, length, speed, phase: 0.6, duct, mountY });
const gate = (
  name: string, area: Area, axis: 'x' | 'y', period: number, open: number, phase: number, hinged = false,
): Hazard => ({ kind: 'gate', name, area, axis, cycle: { period, open, phase }, hinged });
const laser = (name: string, area: Area, period: number, open: number, phase: number, mountY?: number): Hazard =>
  ({ kind: 'laser', name, area, cycle: { period, open, phase }, mountY });
const patrol = (name: string, sprite: Sprite, dx: number, dy: number, speed: number, barks = false): Hazard =>
  ({ kind: 'patrol', name, sprite, dx, dy, speed, phase: 0.6, barks });
const camera = (name: string, x: number, mountY: number, angle: number, sweep: number, speed: number, range: number): Hazard =>
  ({ kind: 'camera', name, x, y: mountY + 65, mountY, angle, spread: 0.22, sweep, speed, range, phase: 1 });
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

// Spawn furniture has a shaped collider, so the body can sit in front of the backrest
// and a loose item can rest on the actual cushion or tabletop.
function support(key: string, x: number, y: number, ...surfaces: readonly Area[]): Furniture {
  return prop(art(key, x, y), surfaces.map(a => box(x + a.x, y + a.y, a.w, a.h)));
}

const officeChair = (x: number) => support('office_chair', x, 536, box(10, 78, 90, 17), box(45, 95, 20, 48));
const daveBed = support('double_bed', 60, 546, box(15, 58, 288, 56));
const barbCouch = support('couch', 69, 566, box(22, 62, 234, 44));
const garyChair = support('camping_chair', 93, 556, box(25, 78, 77, 16), box(40, 94, 55, 30));
const nigelDesk = support('security_desk', 266, 566, box(7, 26, 247, 87));
const kevDesk = support('dj_booth', 234, 556, box(26, 12, 189, 33), box(7, 45, 224, 82));
const mayorDesk = support('mayor_desk', 234, 556, box(10, 18, 259, 94));

const EXITS = {
  daveRoof: art('exit_roof_hatch', 857, -766),
  davePatio: art('exit_patio_door', 1584, 1146),
  barbChimney: art('exit_chimney_top', 639, -1206),
  barbBackdoor: art('exit_back_door', 2244, 466),
  garySkylight: art('exit_skylight', 434, -906),
  garyGaragedoor: art('exit_loading_door', 2044, 446),
  nigelSkylight: fit('exit_skylight', 2354, 14, 240, 96),
  nigelLoading: art('exit_loading_door', 1574, 1146),
  kevVent: art('exit_vent', 966, -986),
  kevFireescape: art('exit_fire_escape', 2282, 486),
  mayorClocktower: art('clock_face_back', 1260, -1050),
  mayorElevator: art('exit_roof_hatch', 1761, -1316),
} as const;

const SUBJECTS = {
  dave: {
    pose: { ...BED_POSE, neckX: 131, neckY: 568 },
    // v4 items: at the foot of the bed, past his toes (under the raised knee it was half hidden)
    item: { sprite: art('slipper', 338, 584), name: 'orthodontic slipper' },
    caption: 'The dentist will be billing for this wake-up call.',
    mumbles: ['Floss the moon, please.', 'That’s a load-bearing molar.', 'The plaque has a lawyer.', 'No, the drill dreams about me.', 'The mash needs more altitude.'],
  },
  barb: {
    pose: {
      neckX: 145, neckY: 535, torso: 0.61, head: 2.77,
      nearArm: 1.61, nearForearm: 0.54, farArm: 1.62, farForearm: 0.54,
      nearThigh: -0.06, nearShin: 0.76, farThigh: -0.08, farShin: 0.80,
    },
    // v4 items: up on the mantelpiece, under the chimney climb (on the couch it lay under her)
    item: { sprite: art('slipper', 500, 446), name: 'team-issued slipper' },
    caption: 'Coach is calling a mandatory time-out.',
    mumbles: ['Give me twenty more naps.', 'That’s a foul on the pillow.', 'Stop stretching the mascot.', 'Everybody hydrate the couch.', 'Go Saucers! Defence!'],
  },
  gary: {
    pose: { ...CHAIR_POSE, neckX: 123, neckY: 503 },
    // v4 items: up in the loft, on the bookcase beside the skylight climb
    item: { sprite: art('coffee_mug', 911, -264), name: 'neighbourhood watch mug' },
    caption: 'Gary finally caught something. It was his own abduction.',
    mumbles: ['That squirrel is casing us.', 'Put the begonias on the watchlist.', 'Enhance the wheelie bin.', 'The cul-de-sac needs a password.', 'The truth is out there. Lock the back door.', 'The Hendersons moved the hedge again.'],
  },
  nigel: {
    pose: { ...CHAIR_POSE, neckX: 120, neckY: 507 },
    // v4 items: on the near corner of the security desk, before the dinosaur hall
    item: { sprite: art('coffee_mug', 265, 562), name: 'fossilized coffee' },
    caption: 'The museum has added you to its Incident Collection.',
    mumbles: ['The mummy has a parking pass.', 'Stop feeding the fossils.', 'The T. rex owes me a tenner.', 'Please don’t tap on the sarcophagus.', "Lost property. One umbrella. Still wet."],
  },
  kev: {
    pose: { ...CHAIR_POSE, neckX: 135, neckY: 500 },
    // v4 items: on the far speaker stack on the dance floor, a detour past the vent
    item: { sprite: art('coffee_mug', 1390, 436), name: 'limited-edition DJ mug' },
    caption: 'The beat dropped. So did the performance review.',
    mumbles: ['Next track: ten hours of white noise.', 'Drop the bass gently.', 'My headphones are in a union.', 'This one goes out to the duvet.', 'This one goes out to the Martians.'],
  },
  mayor: {
    pose: { ...CHAIR_POSE, neckX: 124, neckY: 502 },
    // v4 items: at the far end of the desk, by the flag stand
    item: { sprite: art('coffee_mug', 425, 544), name: 'municipal mug' },
    caption: 'You’ve been added to next Tuesday’s agenda.',
    mumbles: ['I hereby declare it bedtime.', 'Motion to table the blanket.', 'The potholes are polling well.', 'My pillow has diplomatic immunity.', 'July 4th speech first. Then upload the virus.'],
  },
} satisfies Record<string, { pose: Pose; item: Room['item']; caption: string; mumbles: readonly string[] }>;

function route(
  home: Building, human: keyof typeof SUBJECTS & Human, exitName: string, exit: Sprite, exitZone: Area,
  checkpoints: readonly Checkpoint[], roofExit = false,
): Room {
  const { pose, item, caption, mumbles } = SUBJECTS[human];
  const furniture = home.rooms.flatMap(section => [...section.furniture.map(piece => prop(piece)), ...section.supports]);
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
    [art('portrait_cow', 205, 150), art('potato_butte', 400, 522)],
    // A low nightstand, not the old wardrobe: the way out of bed to the door is open.
    [art('nightstand', 400, 576)], [daveBed]),
  room('Upstairs hall', 'hallway', box(760, 0, 760, 700),
    [art('grandfather_clock', 878, 426), fit('ladder', 1210, 0, 52, 686)],
    [art('bookcase', 1290, 466)]),
  room('Attic', 'attic', box(760, -780, 760, 780),
    [EXITS.daveRoof, fit('ladder', 1210, -240, 52, 240)], [art('boxes', 842, -124), art('boxes', 1348, -124)]),
  room('Stairwell', 'stairwell', box(0, 700, 760, 700),
    [fit('stairs', 85, 700, 584, 686)]),
  room('Living room', 'living_room', box(760, 700, 1000, 700),
    [EXITS.davePatio], [art('tv_static', 829, 1286), art('couch', 1010, 1266), art('nightstand', 1390, 1276)]),
], [
  door(760, 210), hatch(0, 1110, 'ladder'), hatch(700, 548, 'stairs', 198), door(760, 881, 1386),
], [
  swing('Grandfather clock', art('pendulum', 901, 465), 0.45, 2.1),
  patrol('Hall vacuum', art('robot_vacuum', 1023, 662), 52, 0, 1.65),
  gate('Attic ladder hatch', box(1110, -17, 164, 34), 'x', 6.8, 3.85, 2.25),
  swing('Attic bulb', art('hanging_bulb', 1040, -606), 0.55, 1.9, -766),
  fragile('Dental trophy', art('trophy', 921, -354)),
  { kind: 'creak', name: 'Creaky stairs', area: box(85, 728, 584, 658) },
  fan('Living room fan', 1120, 830, 100, 2.6, false, 714),
  fragile('Fish tank', fit('fish_tank', 1390, 1212, 90, 64)),
  gate('Patio screen', box(1525, 881, 34, 505), 'y', 6.9, 3.85, 1.7),
], [sleeper('Brenda', 62, 562, 310)]);

export const daveRoof = route(daveHome, 'dave', 'ROOF HATCH', EXITS.daveRoof,
  box(883, -755, 106, 97), [...daveHall, point(1192, -250, 'Attic ladder hatch', 195),
    // Pass well below the bulb (the old shelf is gone), then climb outside its leftward swing.
    point(1285, -398), point(1145, -362), point(868, -372), point(868, -681), point(935, -739)], true);
export const davePatio = route(daveHome, 'dave', 'PATIO DOOR', EXITS.davePatio,
  box(1629, 1188, 86, 155), [
    point(330, 328), point(650, 318), point(650, 970, undefined, 36), point(840, 1013),
    point(1000, 1086), point(1245, 1086),
    // Lift the trailing feet over the fish tank before lining up on the screen door.
    point(1330, 980), point(1495, 980), point(1656, 1095, 'Patio screen', 175), point(1670, 1224),
  ]);

const barbHome = building([
  room('Living room', 'living_room', box(0, 0, 800, 700),
    [fit('chimney_stack', 516, 0, 201, 477), art('roswell_pennant', 156, 253)], [art('tv_static', 357, 586), art('fireplace', 486, 466)], [barbCouch]),
  room('Fireplace flue', 'duct', box(465, -1220, 370, 1220),
    [EXITS.barbChimney, fit('ladder', 479, -519, 44, 505)]),
  room('Kitchen', 'kitchen', box(800, 0, 760, 700),
    [], [art('counter', 1014, 576), art('fridge', 1350, 486)], [], [art('hanging_pans', 1180, 77)]),
  room('Utility room', 'utility', box(1560, 0, 820, 700),
    [EXITS.barbBackdoor], [art('dryer', 1580, 556)]),
], [hatch(0, 535, 'flue'), door(800, 190), door(1560, 321)], [
  draft('Soot draft', box(479, -1180, 340, 1170), -105, 310),
  gate('Soot damper', box(479, -547, 342, 28), 'x', 7.3, 3.95, 1.25),
  swing('Hanging pans', art('hanging_pans', 964, 115), 0.4, 2.15, 14),
  fragile('Dinner plates', art('plate_stack', 1176, 516)),
  patrol('Kitchen vacuum', art('robot_vacuum', 878, 662), 56, 0, 1.7),
  gate('Swinging back door', box(2158, 368, 32, 318), 'y', 7, 3.7, 0.7, true),
], [sleeper('Biscuit', 1710, 686, 380)]);

export const barbChimney = route(barbHome, 'barb', 'CHIMNEY', EXITS.barbChimney,
  box(662, -1164, 92, 70), [
    point(282, 350), point(471, 286), point(620, 198), point(620, -114), point(673, -392),
    point(673, -792, 'Soot damper', 200), point(723, -957), point(708, -1140),
  ], true);
export const barbBackdoor = route(barbHome, 'barb', 'BACK DOOR', EXITS.barbBackdoor,
  box(2260, 503, 88, 141), [
    point(317, 310), point(624, 262), point(912, 302), point(1198, 309), point(1438, 310),
    point(1700, 350), point(1795, 511), point(2308, 543, 'Swinging back door', 247),
  ]);

const garyGarage = [
  point(220, 386), point(415, 346), point(711, 341, "Gary's laser", 195),
] as const;
const garyHome = building([
  room('Garage HQ', 'garage', box(0, 0, 1000, 700),
    [art('saucer_poster', 182, 224), art('power_tools', 220, 72), fit('ladder', 745, 0, 54, 686)],
    [art('monitor_bank', 232, 546)], [garyChair]),
  room('Loft storage', 'attic', box(370, -920, 630, 920),
    [EXITS.garySkylight, fit('ladder', 745, -240, 54, 240)], [art('boxes', 489, -124), art('bookcase', 866, -234)]),
  room('Side workshop', 'garage', box(1000, 0, 1240, 700),
    [EXITS.garyGaragedoor, art('power_tools', 1306, 118)], [art('workbench', 1205, 576), art('boxes', 1524, 576), art('boxes', 1666, 576)]),
], [hatch(0, 694, 'ladder'), door(1000, 282)], [
  laser("Gary's laser", box(535, 14, 10, 672), 6.4, 3.35, 0.4),
  swing('Work lamp', art('work_lamp', 862, 30), 0.65, 2.3, 14),
  camera("Gary's camera", 1226, 14, 1.29, 0.82, 1.38, 355),
  patrol('Watch dog', fit('watch_dog', 1845, 624, 89, 62), 30, 0, 1.07, true),
  gate('Garage door', box(1990, 282, 34, 404), 'y', 7.15, 3.95, 3.4),
]);

export const garySkylight = route(garyHome, 'gary', 'GARAGE SKYLIGHT', EXITS.garySkylight,
  box(467, -885, 134, 65), [
    ...garyGarage, point(776, 206), point(776, -222), point(846, -480), point(674, -558),
    point(535, -705), point(535, -865),
  ], true);
export const garyGaragedoor = route(garyHome, 'gary', 'GARAGE DOOR', EXITS.garyGaragedoor,
  box(2080, 489, 106, 148), [
    ...garyGarage, point(771, 469), point(945, 440), point(1629, 448, "Gary's camera", 240),
    // Wait for the door with Gary's trailing feet above the dog's patrol.
    point(1670, 354, undefined, 29), point(1796, 320, undefined, 29), point(1930, 363, undefined, 29), point(2144, 541, 'Garage door', 186),
  ]);

const nigelSkull = art('dino_skull', 938, 345);
const nigelHome = building([
  room('Security office', 'office', box(0, 0, 760, 700),
    [art('lost_umbrella', 221, 230)], [], [officeChair(93), nigelDesk]),
  room('Dinosaur hall', 'museum', box(760, 0, 940, 700),
    [], [nigelSkull, art('dino_ribs', 1138, 486), fit('dino_legs', 1398, 471, 160, 215)], [], [nigelSkull]),
  room('Laser vault', 'vault', box(1700, 0, 930, 700),
    [EXITS.nigelSkylight], [art('display_case', 1827, 526), art('display_case', 2235, 526)]),
  room('Gift shop', 'museum', box(0, 700, 760, 700),
    [fit('ladder', 608, 700, 55, 686)], [art('shelf', 232, 1135), art('bookcase', 416, 1166), art('postcard_rack', 36, 1206)]),
  room('Loading bay', 'garage', box(760, 700, 1010, 700),
    [EXITS.nigelLoading], [art('boxes', 905, 1276), art('boxes', 1315, 1276)]),
], [door(760, 175), door(1700, 212), hatch(700, 555, 'ladder'), door(760, 890, 1386)], [
  swing('Pterodactyl', art('pterodactyl', 1145, 83), 0.58, 2.0, 14),
  laser('Vault grid', box(2058, 14, 10, 672), 6.1, 3.2, 0.95),
  laser('Skylight grid', box(2298, 178, 318, 10), 5.8, 3.2, 1.8, 14),
  fragile('Snow globe', art('snow_globe', 296, 1095)),
  gate('Cargo shutter', box(1520, 887, 34, 499), 'y', 7, 3.85, 2.2),
]);
export const nigelSkylight = route(nigelHome, 'nigel', 'MUSEUM SKYLIGHT', EXITS.nigelSkylight,
  box(2407, 47, 134, 85), [
    point(263, 308), point(560, 260), point(830, 275), point(891, 196), point(1100, 180),
    // Keep Nigel's feet above the skeleton, then descend through the vault doorway.
    point(1270, 220), point(1510, 248), point(1625, 263), point(1750, 303), point(1930, 303),
    point(2227, 303, 'Vault grid', 197),
    point(2467, 301), point(2474, 78, 'Skylight grid', 220),
  ], true);
export const nigelLoading = route(nigelHome, 'nigel', 'LOADING BAY', EXITS.nigelLoading,
  box(1619, 1192, 106, 151), [
    point(305, 372), point(635, 365), point(635, 955), point(858, 1001),
    point(1100, 1020), point(1186, 899), point(1395, 994), point(1666, 1090, 'Cargo shutter', 188), point(1674, 1224),
  ]);

const kevDance = [point(244, 331), point(526, 271), point(760, 271)] as const;
const kevHome = building([
  room('DJ booth', 'club', box(0, 0, 660, 700),
    [art('tripod_single', 212, 232)], [art('speaker_stack', 480, 466)], [officeChair(106), kevDesk]),
  room('Dance floor', 'club', box(660, 0, 900, 700),
    [], [art('speaker_stack', 1350, 466)]),
  room('Vent duct', 'duct', box(880, -1000, 500, 1000),
    [EXITS.kevVent, fit('ladder', 898, -647, 46, 633)]),
  room('Green room', 'club', box(1560, 0, 900, 700),
    [EXITS.kevFireescape], [art('coat_rack', 1691, 486), art('nightstand', 1990, 576), fit('couch', 2090, 626, 140, 60)]),
], [door(660, 185), hatch(0, 1041, 'vent'), door(1560, 274)], [
  swing('Disco ball', art('disco_ball', 1250, 74), 0.69, 1.9, 14),
  { kind: 'speaker', name: 'Bass stack', sprite: art('speaker_stack', 805, 466), radius: 267, period: 1.44 },
  fan('Duct fan', 1245, -451, 102, -2.35, true),
  draft('Vent updraft', box(894, -969, 462, 943), 45, -385),
  gate('Roof vent flap', box(894, -677, 472, 30), 'x', 7.1, 4, 3.7),
  fragile('Champagne tower', fit('champagne_tower', 1990, 468, 90, 108)),
  gate('Fire-escape sash', box(2242, 261, 32, 425), 'y', 7.25, 3.88, 4.15),
], [sleeper('Tiny', 1855, 686, 390)]);
export const kevVent = route(kevHome, 'kev', 'ROOF VENT', EXITS.kevVent,
  box(995, -958, 102, 62), [
    ...kevDance, point(950, 244), point(1123, 190), point(1123, -139),
    point(978, -250), point(975, -500),
    point(1050, -854, 'Roof vent flap', 181), point(1046, -944),
  ], true);
export const kevFireescape = route(kevHome, 'kev', 'FIRE ESCAPE', EXITS.kevFireescape,
  box(2325, 527, 98, 122), [
    ...kevDance, point(1010, 270), point(1266, 270),
    // Keep the feet above the stacks, dip through the doorway, then lift above the glass.
    point(1445, 270), point(1545, 352), point(1630, 352), point(1710, 260),
    point(1822, 242), point(2163, 242), point(2163, 397), point(2377, 541, 'Fire-escape sash', 187),
  ]);

const mayorHall = [point(260, 311), point(664, 253), point(1288, 389, 'City hall camera', 237)] as const;
const mayorHome = building([
  room('Mayor’s office', 'office', box(0, 0, 760, 700),
    [art('mayor_portrait', 367, 76), art('pilot_bobblehead', 293, 502)], [art('flag_stand', 574, 466)], [officeChair(95), mayorDesk]),
  room('City hall corridor', 'corridor', box(760, 0, 880, 700),
    [], [art('water_cooler', 1038, 536)]),
  room('Clock tower', 'clocktower', box(1120, -1070, 520, 1070),
    [EXITS.mayorClocktower, fit('ladder', 1244, -230, 56, 230)]),
  room('Elevator shaft', 'shaft', box(1640, -1330, 480, 2030),
    [EXITS.mayorElevator, fit('ladder', 1674, -453, 46, 1139)]),
], [door(760, 174), hatch(0, 1190, 'ladder'), opening('vertical', 1640, 300, 686, 'shaft')], [
  fragile('Vase', art('vase', 1404, 616)),
  camera('City hall camera', 1021, 14, 1.63, 0.67, 2.36, 322),
  camera('Elevator lobby camera', 1568, 14, 1.3, 0.65, 1.47, 335),
  { kind: 'gear', name: 'Drive gear', sprite: art('gear_big', 1379, -435), speed: 1.8 },
  { kind: 'gear', name: 'Idle gear', sprite: art('gear_small', 1138, -472), speed: -3.6 },
  swing('Tower pendulum', art('pendulum', 1370, -920), 0.87, 2.05),
  gate('Clock service hatch', box(1134, -671, 492, 27), 'x', 7.5, 4.05, 1.1),
  gate('Shaft safety shutter', box(1654, -488, 452, 35), 'x', 7.35, 4.05, 1.9),
  // Car and counterweight travel on separate tracks on opposite sides of the shutter.
  patrol('Elevator car', art('elevator_car', 1830, -195), 0, 240, 0.8),
  patrol('Counterweight', art('counterweight', 2044, -876), 0, 210, 1.5),
  { kind: 'pop', name: 'Cuckoo bird', area: box(1514, -841, 86, 44), cycle: { period: 3.6, open: 2.52, phase: 2.5 } },
]);
export const mayorClocktower = route(mayorHome, 'mayor', 'CLOCK TOWER', EXITS.mayorClocktower,
  box(1332, -1004, 106, 92), [
    ...mayorHall, point(1272, 175), point(1272, -199), point(1304, -410), point(1311, -524),
    point(1330, -843, 'Clock service hatch', 185), point(1382, -969),
  ], true);
export const mayorElevator = route(mayorHome, 'mayor', 'ELEVATOR ROOF', EXITS.mayorElevator,
  box(1784, -1296, 114, 61), [
    ...mayorHall, point(1339, 442), point(1745, 464, 'Elevator lobby camera', 203),
    // Stage below the shutter, then keep climbing until the trailing feet clear it.
    point(1735, 190), point(1730, -315), point(1730, -771, 'Shaft safety shutter', 225),
    point(1779, -1050), point(1840, -1273),
  ], true);
