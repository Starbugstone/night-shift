import { GATE_TRAVEL } from '../interior';
import { en } from '../../i18n/en';
import { building, type Checkpoint, type Hazard, type InteriorRoom, type Opening } from './interior';
import { BED_POSE, prop, shelfProp, sprite, type Area, type Furniture, type Room, type Sprite } from './layout';

type Resident = 'artie' | 'penny' | 'moe';
const shaftRise = { artie: 2240, penny: 1460, moe: 2520 };
const sideLength = 1650;
const box = (x: number, y: number, w: number, h: number): Area => ({ x, y, w, h });
const fit = (key: string, x: number, y: number, w: number, h: number): Sprite => ({ key: 'room/' + key, ...box(x, y, w, h) });
const step = (x: number, y: number, speed?: number, cross?: string): Checkpoint => ({ x, y, speed, cross });
const homes = {
  artie: { bg: 'duvet', seat: 'robe_sofa_wide2199', x: 40, y: 582, w: 280, neck: 149 },
  penny: { bg: 'transit', seat: 'transit_bench2199', x: 47, y: 584, w: 275, neck: 151 },
  moe: { bg: 'complaints', seat: 'charge_cradle2199', x: 55, y: 595, w: 243, neck: 150 },
};

function room(id: keyof typeof en.routes, human: Resident, upper: boolean, obstacle: Sprite,
  hazards: Hazard[], steps: Checkpoint[], item: string, itemName: string, itemX: number, itemY: number): Room {
  const h = homes[human];
  const backdrop = 'room/bg_' + h.bg + '2199';
  // The transit bench's cushion starts 88 px down its 192 px source, behind the tall armrest.
  const seat = human === 'penny' ? fit(h.seat, h.x - 56, h.y - 64, h.w + 57, 140) : fit(h.seat, h.x, h.y - 3, h.w, 110);
  const support = prop(seat, [box(h.x, h.y, h.w, 24)]);
  const section = (name: string, area: Area, supports: Furniture[], decor: Sprite[] = []): InteriorRoom =>
    ({ name, backdrop, ...area, supports, decor, furniture: [], mounts: [] });
  const length = upper ? shaftRise[human] : sideLength;
  const exit = upper ? fit('exit_roof_hatch', 485, -490 - length, 202, 88) : fit('door_frame', 1380 + length, 282, 120, 215);
  const exitZone = upper ? box(500, -465 - length, 170, 78) : box(1400 + length, 306, 96, 142);
  const tunnel = upper ? box(365, -515, 375, 515) : box(740, 0, 770, 700);
  const outer = upper ? box(365, -515 - length, 375, length) : box(1510, 0, length, 700);
  const opening = (at: number, from: number, to: number): Opening =>
    ({ at, from, to, axis: upper ? 'horizontal' : 'vertical', trim: upper ? 'shaft' : 'door' });
  const openings = upper
    ? [opening(0, 475, 700), opening(-515, 460, 675), opening(-515 - length, 475, 700)]
    : [opening(740, 210, 510), opening(1510, 205, human === 'artie' ? 430 : 475), opening(1510 + length, 265, 505)];
  const landing: Furniture[] = [];
  if (!upper) {
    landing.push(human === 'artie' ? shelfProp(1165 + length, 449, 175, 22) : shelfProp(1170 + length, 484, 195, 21));
  }
  const subject = en.trophies.specimens.entries[human].name;
  // Artie keeps the petunias on the existing landing at the garden door.
  const furnishings = [support, prop(obstacle)];
  if (id !== 'artie_garden') furnishings.push(shelfProp(itemX - 50, itemY + 30, 100, 16));
  const buildingDef = building([section(subject, box(0, 0, 740, 700), furnishings),
    { ...section(en.routes[id].route, tunnel, []), wallOnly: upper },
    { ...section(en.routes[id].route, outer, landing, [exit]), wallOnly: upper }], openings, hazards);
  const prize = sprite('room/' + item, 0, 0);
  prize.x = itemX - prize.w / 2;
  prize.y = itemY + 30 - prize.h;
  return { human, backdrop, pose: { ...BED_POSE, neckX: h.neck, neckY: h.y - (human === 'moe' ? 32 : 34) }, exit, exitZone,
    par: 90, roofExit: upper, furniture: buildingDef.rooms.flatMap(r => r.supports), route: [],
    item: { name: itemName, sprite: prize }, interior: { building: buildingDef, checkpoints: steps,
      exitName: en.routes[id].route, caption: subject, mumbles: en.dispatch2199[human] } };
}

// Leave the spawn support, clear the fixed blade or counter, then lift through the inner doorway.
const sideApproach = (bendX: number, bendY: number, clearanceY: number, doorX = 1400) => [
  step(168, 275), step(bendX, bendY), step(590, clearanceY), step(790, 260),
  step(doorX, 285, 65), step(1610, 285),
];
const outerDoor = [step(2940, 266), step(3100, 368)];
const upperSteps = (x: number, rise: number) => [step(270, 513), step(550, 507), step(x + 65, 285), step(586, 155),
  step(575, -425), step(566, -610), step(585, 130 - rise, 62)];
const cabinet = (key: string) => fit(key, 255, 95, 115, 330);

export const ROOMS_2199 = {
  artie_garden: room('artie_garden', 'artie', false, fit('demolition_blade2199', 355, 403, 246, 115), [],
    [...sideApproach(370, 300, 260, 1340), step(2380, 250, 60), step(2385, 242),
      step(2604, 254, 115), step(2650, 250), step(2851, 278, 110), ...outerDoor], 'petunias2199', 'bowl of petunias', 2955, 419),
  artie_bath: room('artie_bath', 'artie', true, cabinet('robe_wardrobe2199'), [
    { kind: 'swing', name: 'Shower rail', sprite: fit('shower_rail2199', 480, -2405, 56, 115), mountY: -2458, amplitude: 0.7, speed: 0.24, phase: 3.7 },
  ], [...upperSteps(490, shaftRise.artie), step(594, -2272), step(594, -2465, 134, 'Shower rail'), step(590, -2675)], 'spare_robe2199', 'spare dressing gown', 413, 395),
  penny_service: room('penny_service', 'penny', false, fit('counter_kiosk2199', 382, 418, 195, 240), [
    { kind: 'patrol', name: 'Baggage cart', sprite: fit('baggage_cart2199', 2510, 394, 110, 195), dx: 120, dy: 0, speed: 0.23, phase: 0.4 },
  ], [...sideApproach(365, 275, 260), step(2200, 250, 60), step(2315, 215),
    step(2710, 220, 115, 'Baggage cart'), step(2760, 250), step(2851, 278, 110), ...outerDoor], 'ear_fish2199', 'ear fish', 462, 386),
  penny_loft: room('penny_loft', 'penny', true, cabinet('voice_cabinet_tall2199'), [
    { kind: 'gate', name: 'Luggage shutter', artKey: 'room/luggage_shutter_short2199', area: box(465, -1588, 136, 30), cycle: { period: 23, open: 2.81 + 2 * GATE_TRAVEL, phase: 7.25 }, axis: 'x' },
  ], [...upperSteps(525, shaftRise.penny), step(588, -1495), step(588, -1740, 195, 'Luggage shutter'), step(588, -1895)],
  'electronic_guide2199', 'electronic travel guide', 413, 395),
  moe_returns: room('moe_returns', 'moe', false, fit('counter_tall55', 349, 390, 236, 230), [
    { kind: 'patrol', name: 'Stamp counterweight', sprite: fit('stamp_weight2199', 2730, 290, 83, 99), dx: 0, dy: 95, speed: 0.31, phase: 0.8 },
  ], [...sideApproach(455, 277, 232), step(2380, 250, 60), step(2385, 242), step(2604, 254, 115),
    step(2650, 250), step(2851, 278, 110, 'Stamp counterweight'), ...outerDoor], 'complaint_stamp2199', 'complaint stamp', 455, 394),
  moe_vent: room('moe_vent', 'moe', true, cabinet('voice_cabinet_tall2199'), [
    { kind: 'fan', name: 'Duct fan', x: 693, y: -2625, length: 79, speed: 0.17, phase: 2.1, duct: true },
  ], [...upperSteps(565, shaftRise.moe), step(550, -2538), step(558, -2773, 125, 'Duct fan'), step(588, -2955)], 'answer_display2199', 'answer display', 413, 395),
} satisfies Record<string, Room>;
