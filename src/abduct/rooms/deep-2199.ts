import { GATE_TRAVEL } from '../interior';
import { en } from '../../i18n/en';
import { building, type Checkpoint, type Hazard, type InteriorRoom, type Opening } from './interior';
import { BED_POSE, prop, sprite, type Area, type Furniture, type Room, type Sprite } from './layout';

type Resident = 'artie' | 'penny' | 'moe';
const box = (x: number, y: number, w: number, h: number): Area => ({ x, y, w, h });
const fit = (key: string, x: number, y: number, w: number, h: number): Sprite => ({ key: 'room/' + key, ...box(x, y, w, h) });
const step = (x: number, y: number, speed?: number, cross?: string): Checkpoint => ({ x, y, speed, cross });
const homes = {
  artie: { bg: 'duvet', seat: 'robe_sofa2199', x: 40, y: 582, w: 280, neck: 149 },
  penny: { bg: 'transit', seat: 'booth55', x: 47, y: 584, w: 275, neck: 151 },
  moe: { bg: 'complaints', seat: 'charge_cradle2199', x: 55, y: 595, w: 243, neck: 150 },
};

function room(id: keyof typeof en.routes, human: Resident, upper: boolean, obstacle: Sprite,
  hazards: Hazard[], steps: Checkpoint[], item: string, itemName: string, itemX: number, itemY: number): Room {
  const h = homes[human];
  const backdrop = 'room/bg_' + h.bg + '2199';
  // The transit bench's cushion starts 88 px down its 192 px source, behind the tall armrest.
  const seat = human === 'penny' ? fit(h.seat, h.x - 56, h.y - 64, h.w + 57, 140) : fit(h.seat, h.x, h.y - 3, h.w, 110);
  const support = prop(seat, [box(h.x, h.y, h.w, 24)]);
  const shelf = prop(fit('shelf', itemX - 50, itemY + 30, 100, 16));
  const section = (name: string, area: Area, supports: Furniture[], decor: Sprite[] = []): InteriorRoom =>
    ({ name, backdrop, ...area, supports, decor, furniture: [], mounts: [] });
  const exit = upper ? fit('exit_roof_hatch', 485, -487, 202, 82) : fit('door_frame', 1380, 282, 120, 215);
  const exitZone = upper ? box(500, -465, 170, 78) : box(1400, 306, 96, 142);
  const tunnel = upper ? box(365, -515, 375, 515) : box(740, 0, 770, 700);
  const opening = (at: number, from: number, to: number): Opening =>
    ({ at, from, to, axis: upper ? 'horizontal' : 'vertical', trim: upper ? 'shaft' : 'door' });
  const openings = upper ? [opening(0, 475, 700), opening(-515, 475, 700)] : [opening(740, 210, 510), opening(1510, 265, 505)];
  const landing: Furniture[] = [];
  if (!upper) {
    const platform = human === 'artie' ? fit('shelf', 1165, 449, 175, 22) : fit('shelf', 1170, 484, 195, 21);
    landing.push(prop(platform));
  }
  const subject = en.trophies.specimens.entries[human].name;
  const buildingDef = building([section(subject, box(0, 0, 740, 700), [support, prop(obstacle), shelf]),
    { ...section(en.routes[id].route, tunnel, landing, [exit]), wallOnly: upper }], openings, hazards);
  const prize = sprite('room/' + item, 0, 0);
  prize.x = itemX - prize.w / 2;
  prize.y = itemY + 30 - prize.h;
  return { human, backdrop, pose: { ...BED_POSE, neckX: h.neck, neckY: h.y - (human === 'moe' ? 32 : 34) }, exit, exitZone,
    par: 90, roofExit: upper, furniture: buildingDef.rooms.flatMap(r => r.supports), route: [],
    item: { name: itemName, sprite: prize }, interior: { building: buildingDef, checkpoints: steps,
      exitName: en.routes[id].route, caption: subject, mumbles: en.dispatch2199[human] } };
}

const sideSteps = (bendX: number, bendY: number, cross?: string) => [step(170, 275), step(bendX, bendY), step(590, 260),
  step(690, 290), step(777, 290), step(954, 260, 115, cross === 'Baggage cart' ? cross : undefined),
  step(1140, 264, 110, cross === 'Stamp counterweight' ? cross : undefined), step(1275, 285), step(1450, 368)];
const upperSteps = (x: number) => [step(270, 513), step(550, 507), step(x + 65, 285), step(586, 155)];
const cabinet = (key: string) => fit(key, 255, 95, 115, 330);

export const ROOMS_2199 = {
  artie_garden: room('artie_garden', 'artie', false, fit('demolition_blade2199', 355, 414, 246, 115), [],
    sideSteps(370, 300), 'petunias2199', 'bowl of petunias', 415, 390),
  artie_bath: room('artie_bath', 'artie', true, cabinet('wardrobe'), [
    { kind: 'swing', name: 'Shower rail', sprite: fit('lightning_cable55', 480, -165, 56, 115), mountY: -218, amplitude: 0.7, speed: 1.0, phase: 0.2 },
  ], [...upperSteps(490), step(594, -32), step(594, -225, 134, 'Shower rail'), step(590, -435)], 'spare_robe2199', 'spare dressing gown', 413, 395),
  penny_service: room('penny_service', 'penny', false, fit('counter55', 382, 418, 195, 240), [
    { kind: 'patrol', name: 'Baggage cart', sprite: fit('bus_cart55', 860, 394, 110, 195), dx: 120, dy: 0, speed: 0.51, phase: 0.3 },
  ], sideSteps(365, 275, 'Baggage cart'), 'ear_fish2199', 'ear fish', 462, 386),
  penny_loft: room('penny_loft', 'penny', true, cabinet('voice_cabinet2199'), [
    { kind: 'gate', name: 'Luggage shutter', artKey: 'room/luggage_shutter2199', area: box(465, -128, 245, 30), cycle: { period: 7.8, open: 4.2 + 2 * GATE_TRAVEL, phase: 0.5 }, axis: 'x' },
  ], [...upperSteps(525), step(588, -35), step(588, -280, 195, 'Luggage shutter'), step(588, -435)],
  'electronic_guide2199', 'electronic travel guide', 413, 395),
  moe_returns: room('moe_returns', 'moe', false, fit('counter55', 349, 390, 236, 230), [
    { kind: 'patrol', name: 'Stamp counterweight', sprite: fit('counterweight', 1010, 370, 83, 99), dx: 0, dy: 95, speed: 0.47, phase: 0.5 },
  ], sideSteps(465, 265, 'Stamp counterweight'), 'complaint_stamp2199', 'complaint stamp', 455, 394),
  moe_vent: room('moe_vent', 'moe', true, cabinet('voice_cabinet2199'), [
    { kind: 'fan', name: 'Duct fan', x: 693, y: -105, length: 79, speed: 1.2, phase: 0.6, duct: true },
  ], [...upperSteps(565), step(550, -18), step(558, -253, 125, 'Duct fan'), step(588, -435)], 'answer_display2199', 'answer display', 413, 395),
} satisfies Record<string, Room>;
