import { en } from '../../i18n/en';
import { building, type Checkpoint, type Hazard, type InteriorRoom } from './interior';
import { BED_POSE, CHAIR_POSE, prop, shelfProp, sprite, type Area, type Furniture, type Room, type Sprite } from './layout';

const box = (x: number, y: number, w: number, h: number): Area => ({ x, y, w, h });
const fit = (key: string, x: number, y: number, w: number, h: number): Sprite => ({ key: 'room/' + key, x, y, w, h });
const p = (x: number, y: number, cross?: string, speed?: number): Checkpoint => ({ x, y, cross, speed });
const section = (name: string, backdrop: string, area: Area, supports: Furniture[], decor: Sprite[] = []): InteriorRoom =>
  ({ name, backdrop: 'room/bg_grail_' + backdrop, ...area, supports, decor, furniture: [], mounts: [] });
const subjects = {
  rodney: { bay: 'Pavilion', backdrop: 'pavilion', rest: 'grail_long_bench', pose: { ...BED_POSE, neckX: 150, neckY: 548 },
    caption: 'Sir Rodney the Not-Quite-So-Brave', mumbles: ['I’ll guard the rear… from home…'] },
  black_knight: { bay: 'Bridge gatehouse', backdrop: 'bridge', rest: 'grail_guard_seat', pose: { ...CHAIR_POSE, neckX: 155, neckY: 486 },
    caption: 'The Black Knight', mumbles: ['‘Tis but a dent.'] },
  tom_enchanter: { bay: 'Candle tower', backdrop: 'tower', rest: 'grail_stone_bench', pose: { ...BED_POSE, neckX: 150, neckY: 548 },
    caption: 'Tom the Enchanter', mumbles: ['Some call me Tim. The sign painter won’t take it back.', 'Just a pilot light… stand back… further…'] },
};

function make(human: keyof typeof subjects, upper: boolean, route: keyof typeof en.routes,
  obstacle: string, itemArt: string, itemName: string, hazards: Hazard[], checkpoints: Checkpoint[]): Room {
  const who = subjects[human];
  const sideEnd = human === 'tom_enchanter' ? 2110 : human === 'black_knight' ? 1980 : 1800;
  const westLoft = upper && human === 'rodney';
  const seatY = human === 'black_knight' ? 590 : 580;
  const seat = prop(fit(who.rest, 48, seatY - (human === 'black_knight' ? 95 : 0), human === 'black_knight' ? 176 : 270, human === 'black_knight' ? 170 : 98),
    [box(56, seatY, human === 'black_knight' ? 162 : 260, 30)]);
  const smokeShelf = upper && human === 'tom_enchanter';
  const shelfX = smokeShelf ? 735 : upper ? 415 : 1010;
  const shelfY = upper ? (smokeShelf ? -373 : -285) : 495;
  const shelf = shelfProp(shelfX, shelfY, 108, 20);
  const bay = section(who.bay, who.backdrop, box(0, 0, 740, 700), [
    ...(upper && !westLoft ? [shelfProp(223, 350, 175, 25)] : []),
    seat, prop(fit(obstacle, 347, upper ? 350 : 384, 200, upper ? 290 : 256)),
  ]);
  const exit = upper ? fit('exit_roof_hatch', westLoft ? -65 : 1018, -737, 190, 80) : fit('door_frame', sideEnd - 130, 299, 120, 220);
  const zone = upper ? box(westLoft ? -45 : 1040, -727, 153, 78) : box(sideEnd - 105, 329, 94, 135);
  const next = section(upper ? 'Upper gallery' : 'West gallery', who.backdrop,
    upper ? box(westLoft ? -230 : 390, -752, westLoft ? 970 : 865, 752) : box(740, 0, sideEnd - 740, 700), [shelf], [exit]);
  // A lip over the loft forces one last traverse before the roof opening. At ground level
  // the corresponding stockpile forms the sill the trailing boots must clear.
  const ledge = prop(fit(upper ? 'grail_flue_hood' : human === 'rodney' ? 'grail_hay' : 'grail_stockpile',
    upper ? (westLoft ? 195 : 390) : sideEnd - 600, upper ? -752 : 508, upper ? 515 : 285, upper ? 166 : 175));
  next.supports = [...next.supports, ledge];
  if (westLoft) checkpoints.push(p(175, -480), p(30, -503), p(30, -694));
  else if (upper) checkpoints.push(p(979, -480), p(1115, -503), p(1116, -694));
  else checkpoints.push(p(sideEnd - 475, 269), p(sideEnd - 230, 274), p(sideEnd - 65, 390));
  const openings = upper
    ? [{ axis: 'horizontal' as const, at: 0, from: 475, to: 705, trim: 'shaft' as const },
      { axis: 'horizontal' as const, at: -752, from: westLoft ? -75 : 1010, to: westLoft ? 145 : 1220, trim: 'shaft' as const }]
    : [740, sideEnd].map(at => ({ axis: 'vertical' as const, at, from: 215, to: 545, trim: 'door' as const }));
  const item = sprite('room/' + itemArt, shelfX + 30, 0);
  item.y = shelfY - item.h;
  return { human, pose: who.pose, item: { sprite: item, name: itemName }, exit, exitZone: zone, exitSettleSec: 1.25, roofExit: upper,
    par: 90, backdrop: bay.backdrop, furniture: [...bay.supports, ...next.supports], route: [],
    interior: { building: building([bay, next], openings, hazards), checkpoints, caption: who.caption, mumbles: who.mumbles,
      exitName: en.routes[route].route.toUpperCase() } };
}

const rise = [p(190, 265), p(277, 172), p(592, 172), p(595, 42)];
const side = [p(185, 248), p(300, 209), p(592, 206), p(678, 317), p(875, 314)];
const sparks = (area: Area, period: number, open: number, phase = 1.2): Hazard =>
  ({ kind: 'laser', name: 'Sleep-sparks', area, cycle: { period, open, phase } });

export const GRAIL_ROOMS = {
  rodney_flap: make('rodney', false, 'rodney_flap', 'grail_shield_rack', 'coconut_halves', 'coconut halves', [],
    [...side, p(1030, 336), p(1175, 332)]),
  rodney_loft: make('rodney', true, 'rodney_loft', 'grail_strongbox', 'stuffed_swallow', 'stuffed swallow',
    [{ kind: 'swing', name: 'Hanging shield', sprite: fit('grail_hanging_shield', 487, -242, 79, 96), amplitude: 0.65, speed: 1.2, phase: 0.6, mountY: -333 }],
    [...rise, p(610, -105), p(606, -335, 'Hanging shield', 175), p(598, -490)]),
  black_knight_arch: make('black_knight', false, 'black_knight_arch', 'grail_toll_desk', 'black_knight_arm', 'black knight’s arm', [],
    [...side, p(1054, 276), p(1304, 292), p(1365, 303)]),
  black_knight_loft: make('black_knight', true, 'black_knight_loft', 'grail_winch', 'black_knight_shield', 'black knight’s shield',
    [{ kind: 'gate', name: 'Portcullis', area: box(390, -198, 350, 22), axis: 'x', cycle: { period: 7.2, open: 4.1, phase: 0.8 } }],
    [...rise, p(597, -88), p(597, -360, 'Portcullis', 205), p(598, -490)]),
  tom_stair: make('tom_enchanter', false, 'tom_stair', 'grail_book_stand', 'holy_hand_grenade', 'holy hand grenade',
    [sparks(box(1155, 171, 10, 415), 11.5, 4.6)], [...side, p(981, 325), p(1405, 323, 'Sleep-sparks', 248), p(1502, 373)]),
  tom_smoke: make('tom_enchanter', true, 'tom_smoke', 'grail_chimney', 'enchanter_horns', 'enchanter’s horns',
    [sparks(box(404, -200, 323, 10), 6.3, 3.7, 4)], [...rise, p(598, -79), p(598, -486, 'Sleep-sparks', 257), p(598, -490)]),
};
