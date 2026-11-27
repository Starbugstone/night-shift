import { en } from '../../i18n/en';
import { building, type Checkpoint, type Hazard, type InteriorRoom, type Opening } from './interior';
import { BED_POSE, prop, shelfProp, sprite, type Area, type Furniture, type Room, type Sprite } from './layout';

const box = (x: number, y: number, w: number, h: number): Area => ({ x, y, w, h });
const art = (key: string, x: number, y: number): Sprite => sprite('room/' + key, x, y);
const fit = (key: string, x: number, y: number, w: number, h: number): Sprite => ({ key: 'room/' + key, ...box(x, y, w, h) });
const point = (x: number, y: number, cross?: string, speed?: number): Checkpoint => ({ x, y, cross, speed });
const side = (at: number, from: number, to: number): Opening => ({ axis: 'vertical', at, from, to, trim: 'door' });
const top = (at: number, from: number, to: number): Opening => ({ axis: 'horizontal', at, from, to, trim: 'shaft' });
/** Decor: the wire ledge under the Geiger counter. It holds nothing, so it is not drawn as a shelf. */
const ledge = (x: number, y: number, w: number): Sprite => fit('invasion_wire_ledge', x, y, w, 18);
const sampleShelf = (x: number, y: number, w: number): Furniture => shelfProp(x, y, w, 18);

const [blink, meteor, interval, fire, peace] = en.invasion1953.mumbles;
const subjects = {
  forester: { pose: { ...BED_POSE, neckX: 126, neckY: 548 }, mumbles: [blink, meteor], room: 'farm' },
  van_bell: { pose: { ...BED_POSE, neckX: 130, neckY: 548 }, mumbles: [interval, fire], room: 'booth' },
  collier: { pose: { ...BED_POSE, neckX: 124, neckY: 548 }, mumbles: [peace], room: 'church' },
} as const;
type Witness = keyof typeof subjects;

function section(name: string, theme: string, area: Area, supports: Furniture[], decor: Sprite[]): InteriorRoom {
  return { ...area, name, backdrop: 'room/bg_invasion_' + theme, supports, decor, furniture: [], mounts: [] };
}

interface EscapeLayout {
  roof?: boolean;
  length?: number;
  lintel?: number;
  rafterPace?: number;
}

function extendEscape(
  room: InteriorRoom, opening: Opening, exit: Sprite, zone: Area, last: Checkpoint,
  { roof = false, length = 1520, lintel = 296, rafterPace = 70 }: EscapeLayout,
) {
  const dx = roof ? 0 : length;
  const dy = roof ? -length : 0;
  const move = <T extends Area>(area: T): T => ({ ...area, x: area.x + dx, y: area.y + dy });
  const supports = [...room.supports];
  const checkpoints: Checkpoint[] = [];
  if (roof) {
    const quarter = length / 4;
    supports.push(
      sampleShelf(room.x, room.y - quarter, 160),
      sampleShelf(room.x + 272, room.y - 2 * quarter, room.w - 272),
      sampleShelf(room.x, room.y - 3 * quarter, 148),
    );
    checkpoints.push(
      point(room.x + 243, room.y - quarter / 2), point(room.x + 285, room.y - 1.5 * quarter, undefined, rafterPace),
      point(room.x + 171, room.y - 2.5 * quarter), point(room.x + 263, room.y - 3.4 * quarter, undefined, rafterPace),
      point(last.x, last.y + dy),
    );
  } else {
    const edge = room.x + room.w;
    supports.push(
      prop(fit('invasion_cupboard', edge + 220, 0, 127, 299)),
      prop(fit('invasion_cupboard', edge + 653, 430, 117, 270), [box(edge + 650, 430, 123, 270)]),
      prop(fit(lintel > 350 ? 'invasion_cupboard_tall' : 'invasion_cupboard', edge + 1050, 0, 128, lintel)),
    );
    checkpoints.push(
      point(edge + 274, 386), point(edge + 445, 333), point(edge + 708, 247),
      point(edge + 917, 371), point(edge + 1135, Math.max(392, lintel + 29)), point(last.x + dx, last.y),
    );
  }
  const movedExit = move(exit);
  return {
    room: {
      ...room, y: room.y + dy, w: room.w + dx, h: room.h - dy,
      supports, decor: room.decor.map(sprite => sprite === exit ? movedExit : sprite),
    },
    opening: { ...opening, at: opening.at + (roof ? dy : dx) },
    exit: movedExit, zone: move(zone), checkpoints,
  };
}

function route(
  human: Witness, exitName: string, rooms: [InteriorRoom, InteriorRoom], openings: [Opening, Opening], hazards: Hazard[],
  exit: Sprite, exitZone: Area, checkpoints: Checkpoint[], itemKey: string, name: string, x: number, y: number,
  escapeLayout: EscapeLayout = {},
): Room {
  const { pose, mumbles } = subjects[human];
  const item = art('invasion_' + itemKey, 0, 0);
  item.x = x - item.w / 2;
  item.y = y - item.h;
  const escape = extendEscape(rooms[1], openings[1], exit, exitZone, checkpoints.at(-1)!, escapeLayout);
  const roomsWithEscape = [rooms[0], escape.room];
  return {
    human, pose, item: { sprite: item, name }, exit: escape.exit, exitZone: escape.zone, roofExit: escapeLayout.roof ?? false, par: 55,
    backdrop: rooms[0].backdrop, furniture: roomsWithEscape.flatMap(r => r.supports), route: [],
    interior: {
      building: building(roomsWithEscape, [openings[0], escape.opening], hazards),
      checkpoints: [...checkpoints, ...escape.checkpoints],
      caption: mumbles[0], mumbles, exitName,
    },
  };
}

const kitchenDaybed = prop(fit('invasion_daybed', 37, 556, 334, 81), [box(42, 580, 322, 32)]);
const boothBench = prop(fit('invasion_bench', 42, 564, 330, 91), [box(48, 580, 319, 30)]);
const churchPew = prop(fit('invasion_pew', 38, 514, 333, 142), [box(42, 580, 325, 29)]);
const icebox = prop(art('invasion_icebox', 439, 388));
const labCart = prop(art('invasion_lab_cart', 320, 499));
const geiger = art('invasion_geiger_counter', 232, 425);
const windowExit = art('exit_window_narrow', 1783, 350);
const atticExit = fit('exit_roof_hatch', 392, -1620, 186, 81);
const staffExit = fit('door_frame', 1828, 339, 117, 207);
const ventExit = fit('exit_roof_hatch', 389, -873, 186, 81);
const vestryExit = fit('door_frame', 1788, 325, 117, 210);
const bellExit = fit('exit_roof_hatch', 415, -870, 187, 82);

function gallery(name: string, theme: string, x: number, obstacle: string, exit: Sprite): InteriorRoom {
  const block = box(x + 520, 391, 150, 310);
  // The queue rail keeps its own shape (157x307) over the same block.
  const blocker = obstacle === 'invasion_queue_rail' ? art(obstacle, x + 516, 391) : fit(obstacle, block.x, block.y, block.w, block.h);
  return section(name, theme, box(x, 0, 980, 700), [
    prop(fit('invasion_cupboard', x + 186, 0, 118, 274), [box(x + 190, 0, 110, 274)]),
    prop(blocker, [block]),
  ], [exit]);
}

export const ROOMS_1953 = {
  forester_kitchen: route('forester', en.routes.forester_kitchen.route, [
    section('Farmhouse laboratory', subjects.forester.room, box(0, 0, 920, 700),
      [kitchenDaybed, labCart, icebox, sampleShelf(592, 377, 82)], [geiger, ledge(211, 457, 98)]),
    gallery('Kitchen passage', 'farm', 920, 'invasion_hutch', windowExit),
  ], [side(920, 273, 558), side(1900, 350, 557)], [
    { kind: 'creak', name: 'Creaky boards', area: box(295, 574, 238, 126) },
  ], windowExit, box(1815, 370, 80, 142), [
    point(168, 333), point(335, 250), point(507, 241), point(650, 281), point(815, 371), point(1245, 381), point(1369, 235),
    point(1585, 229), point(1740, 319), point(1855, 417),
  ], 'meteor_fragment', 'meteor fragment', 636, 377, { lintel: 410 }),

  forester_attic: route('forester', en.routes.forester_attic.route, [
    section('Attic laboratory', subjects.forester.room, box(0, -832, 820, 1532), [
      kitchenDaybed, prop(fit('invasion_attic_shelf_deep', 306, 270, 209, 95)),
      sampleShelf(290, -55, 230), sampleShelf(678, -320, 142), sampleShelf(680, -583, 140),
    ],
      [geiger, ledge(218, 457, 94)]),
    section('Attic rafters', 'farm', box(335, -1636, 485, 804), [
      prop(fit('invasion_attic_shelf_deep', 335, -1235, 191, 86)),
      prop(art('invasion_rafter_beam', 577, -1440)), sampleShelf(663, -1221, 75),
    ], [atticExit]),
  ], [top(-832, 502, 712), top(-1636, 391, 578)], [
    { kind: 'camera', name: 'Martian probe', skin: 'invasion', x: 798, y: -550, angle: 3.22, spread: 0.19,
      range: 233, sweep: 1.08, speed: 0.67, phase: 0.4 },
  ], atticExit, box(411, -1603, 155, 62), [
    point(175, 426), point(315, 450), point(588, 460), point(604, 146), point(621, -91), point(588, -280),
    // v0.2 difficulty: 260 px/s (was 282), the touch speed cap POINT.max; tests/levels-difficulty-touch.test.ts
    point(606, -850, 'Martian probe', 260), point(615, -986), point(632, -1281),
    point(496, -1329, undefined, 29), point(477, -1495), point(480, -1565),
  ], 'martian_lens', 'three-colour martian lens', 697, -1221, { roof: true, length: 780, rafterPace: 60 }),

  van_bell_staff: route('van_bell', en.routes.van_bell_staff.route, [
    section('Ticket office', subjects.van_bell.room, box(0, 0, 965, 700),
      [boothBench, prop(fit('invasion_queue_rail', 384, 352, 157, 307)), sampleShelf(744, 438, 91)],
      []),
    gallery('Office service passage', 'booth', 965, 'invasion_queue_rail', staffExit),
  ], [side(965, 280, 561), side(1945, 339, 546)], [
    { kind: 'castor', name: 'Film-can trolley', sprite: fit('amp_trolley55', 2365, 484, 99, 194), travel: 42, period: 3.8, phase: 0.8, lag: 0.12 },
  ], staffExit, box(1854, 369, 85, 140), [
    point(179, 301), point(325, 221), point(521, 219), point(733, 285), point(870, 378), point(1284, 380), point(1430, 237),
    point(1658, 223), point(1795, 330), point(1899, 410),
  ], 'programme', 'drive-in programme', 797, 438),

  van_bell_vent: route('van_bell', en.routes.van_bell_vent.route, [
    section('Projection booth', subjects.van_bell.room, box(0, -92, 820, 792),
      [boothBench, prop(fit('invasion_attic_shelf', 295, 264, 224, 98)), prop(fit('amp_case55', 680, 345, 116, 81))],
      []),
    section('Projector duct', 'booth', box(337, -891, 483, 799), [
      prop(fit('invasion_attic_shelf', 337, -451, 193, 83)),
      prop(fit('invasion_attic_shelf_low', 609, -664, 211, 78)), sampleShelf(713, -300, 85),
    ], [ventExit]),
  ], [top(-92, 487, 753), top(-891, 386, 575)], [
    { kind: 'laser', name: 'Inspection lamp', skin: 'invasion', area: box(544, 145, 276, 12),
      cycle: { period: 9, open: 4.2, phase: 0.6 } },
  ], ventExit, box(409, -856, 153, 62), [
    point(176, 426), point(318, 412), point(615, 443), point(615, 316),
    point(621, -190, 'Inspection lamp', 171), point(629, -263), point(644, -503),
    point(491, -560, undefined, 29), point(477, -732), point(480, -820),
  ], 'reel', 'invasion reel', 748, -300, { roof: true }),

  collier_vestry: route('collier', en.routes.collier_vestry.route, [
    section('Church vestry', subjects.collier.room, box(0, 0, 925, 700),
      [churchPew, prop(fit('invasion_pew_end', 390, 365, 125, 294)), sampleShelf(727, 530, 78)],
      []),
    gallery('Vestry passage', 'church', 925, 'invasion_confessional', vestryExit),
  ], [side(925, 275, 562), side(1905, 325, 535)], [
    { kind: 'creak', name: 'Loose boards', area: box(447, 555, 469, 145) },
  ], vestryExit, box(1815, 348, 85, 144), [
    point(171, 333), point(314, 221), point(503, 231), point(673, 323), point(832, 350), point(1249, 379), point(1382, 232),
    point(1588, 227), point(1752, 320), point(1857, 400),
  ], 'truce_flag', 'white truce flag', 765, 530, { lintel: 420 }),

  collier_bell: route('collier', en.routes.collier_bell.route, [
    section('Church belfry', subjects.collier.room, box(0, -92, 820, 792),
      [churchPew, prop(fit('invasion_attic_shelf_low', 298, 264, 232, 84)), sampleShelf(694, 318, 70)],
      []),
    section('Bell loft', 'church', box(362, -888, 458, 796), [
      prop(art('invasion_rafter_crate', 362, -436)),
      prop(fit('invasion_attic_shelf_low', 608, -655, 212, 83)),
    ], [bellExit]),
  ], [top(-92, 522, 731), top(-888, 412, 606)], [
    { kind: 'swing', name: 'Bell clapper', sprite: art('invasion_bell_clapper', 579, 33),
      amplitude: 0.62, speed: 1.2, phase: 0.6, mountY: -76 },
  ], bellExit, box(435, -850, 156, 62), [
    point(176, 414), point(330, 407), point(647, 402), point(681, 237),
    point(680, 104), point(634, -135), point(654, -252), point(654, -485),
    point(515, -553, undefined, 29), point(499, -718), point(505, -816),
  ], 'clapper_souvenir', 'church bell clapper', 733, 318, { roof: true }),
} satisfies Record<string, Room>;
