import { en } from '../../i18n/en';
import { building, type Building, type Checkpoint, type InteriorRoom, type Opening, type Sleeper } from './interior';
import { BED_POSE, prop, shelfProp, sprite, type Area, type Human, type Room, type Sprite } from './layout';
import type { Pose } from '../ragdoll';

export function roomArt(key: string, x: number, y: number): Sprite {
  return sprite('room/' + key, x, y);
}

export function roomFit(key: string, x: number, y: number, w: number, h: number): Sprite {
  return { key: 'room/' + key, x, y, w, h };
}

export function birchSection(name: string, backdrop: string, area: Area, supports: InteriorRoom['supports'], decor: Sprite[]): InteriorRoom {
  return { ...area, name, backdrop: 'room/bg_birch_' + backdrop, supports, decor, furniture: [], mounts: [] };
}

export function birchRoom(
  home: Building, human: Human, pose: Pose, room: keyof typeof en.routes, mumble: string, exit: Sprite, exitZone: Area,
  checkpoints: Checkpoint[], name: string, itemKey: string, x: number, bottom: number, roofExit = false,
): Room {
  const item = roomArt(itemKey, 0, 0);
  item.x = x - item.w / 2;
  item.y = bottom - item.h;
  const { route } = en.routes[room];
  const backdrop = home.rooms[0]!.backdrop;
  return {
    human, pose, backdrop, exit, exitZone, roofExit,
    ...(human === 'mabel' ? { spawnLookAhead: 94 } : {}),
    item: { name, sprite: item },
    furniture: home.rooms.flatMap(section => section.supports), par: 56, route: [],
    interior: { building: home, checkpoints, caption: route, exitName: route, mumbles: [mumble] },
  };
}

const pose: Pose = { ...BED_POSE, neckX: 114, neckY: 550 };
const bench = prop(roomArt('bakery_bench', 34, 528), [{ x: 49, y: 576, w: 282, h: 15 }]);
const crumb: Sleeper = {
  name: en.birch.crumb, radius: 237,
  asleep: roomArt('cat_sleeping', 432, 628), awake: roomArt('cat_awake', 432, 608),
};
const stockExit = roomArt('door_frame_tall', 670, 301);
const stockroom = birchSection('Stockroom', 'bakery', { x: 0, y: 0, w: 780, h: 700 }, [
  bench,
  prop(roomArt('cooling_rack', 376, 495)),
  shelfProp(284, 435, 91, 22),
], [
  stockExit, roomArt('bakery_roll_bag', 524, 608),
]);

const ventExit = roomArt('exit_vent_wide', 461, 12);
const ventBay = birchSection('Service bay', 'bakery', { x: 0, y: 0, w: 730, h: 700 }, [
  bench,
  prop(roomArt('bakery_flue', 350, 14)),
  prop(roomFit('flour_trolley', 355, 275, 142, 124), [{ x: 355, y: 277, w: 139, h: 121 }]),
  shelfProp(666, 642, 54, 16),
], [
  ventExit, roomArt('bakery_roll_bag', 524, 608),
]);

const stockOpening: Opening = { axis: 'vertical', at: 780, from: 301, to: 569, trim: 'door' };
const ventOpening: Opening = { axis: 'horizontal', at: 0, from: 461, to: 706, trim: 'vent' };

export const BAKERY_ROOMS = {
  mabel_stockroom: birchRoom(
    building([stockroom], [stockOpening], [], [crumb]), 'mabel', pose, 'mabel_stockroom', en.birch.mabelMumble,
    stockExit, { x: 690, y: 346, w: 85, h: 155 },
    [{ x: 163, y: 398 }, { x: 280, y: 365 }, { x: 501, y: 378 }, { x: 727, y: 405 }],
    'sourdough starter', 'sourdough_starter', 326, 435,
  ),
  mabel_vent: birchRoom(
    building([ventBay], [ventOpening], [], [crumb]), 'mabel', pose, 'mabel_vent', en.birch.mabelMumble,
    ventExit, { x: 475, y: 24, w: 216, h: 68 },
    [{ x: 174, y: 475 }, { x: 300, y: 500 }, { x: 638, y: 501, speed: 33 }, { x: 625, y: 206 }, { x: 625, y: 65 }],
    'kitchen timer', 'kitchen_timer', 691, 642, true,
  ),
} satisfies Record<string, Room>;
