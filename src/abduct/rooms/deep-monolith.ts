import { building, type Checkpoint, type Hazard, type InteriorRoom } from './interior';
import { ART, RETIRED_ART } from '../../art-manifest';
import { prop, type Area, type Room, type Sprite } from './layout';

/** A room sprite at its manifest size; the retired routes' art is listed in `RETIRED_ART`. */
const art = (key: string, x: number, y: number): Sprite => {
  const id = 'room/' + key;
  const { w, h } = ART[id] ?? RETIRED_ART[id]!;
  return { key: id, x, y, w, h };
};
const box = (x: number, y: number, w: number, h: number): Area => ({ x, y, w, h });
const point = (x: number, y: number, cross?: string, speed?: number): Checkpoint => ({ x, y, cross, speed });

interface Witness {
  id: 'flint' | 'reed' | 'echo';
  backdrop: string;
  names: readonly [string, string, string];
  side: string;
  roof: string;
  forkX: number;
  height: number;
  length: number;
  phase: number;
  caption: string;
  mumbles: readonly string[];
}

function routes(w: Witness): [Room, Room] {
  const { forkX, height, length, phase } = w;
  const section = (name: string, area: Area, decor: Sprite[], furniture: Sprite[] = []): InteriorRoom =>
    ({ name, ...area, backdrop: 'room/bg_' + w.backdrop, decor, furniture, supports: [], mounts: [] });
  const mouth = art('exit_stone_door', length - 174, 446);
  const crown = art('exit_stone_hatch', forkX - 80, -height + 14);
  const bench = art('stone_plinth', 34, 576);
  const souvenir = art('patent_bone', 0, 0);
  // v4 items: the free end of the plinth (the other end sat under the specimen's feet)
  souvenir.x = bench.x + 10;
  souvenir.y = bench.y - souvenir.h;
  const launchX = forkX - (w.id === 'flint' ? 280 : 225);
  const fork = forkX + (w.id === 'reed' ? 155 : 260);
  const lintel = w.id === 'echo' ? 132 : 192;
  const climbX = w.id === 'echo' ? forkX + 110 : forkX;
  const shaleTop = w.id === 'reed' ? 320 : 288;
  const shaleStart = w.id === 'echo' ? 245 : 300;
  const lip = w.id === 'flint' ? 130 : 100;
  const launcher = art('stone_plinth', launchX - 51, 616);
  launcher.w = 186;
  launcher.h = 70;
  const sideGate = length - 390;
  const hazards: Hazard[] = [
    { kind: 'toss', name: 'Practice toss', sprite: art('practice_bone', launchX, 582), height: 260, airtime: 2.8, period: 6.7, phase },
    { kind: 'creak', name: 'Loose shale', area: box(shaleStart, shaleTop, launchX - 51 - 80 - shaleStart, 686 - shaleTop) },
    { kind: 'gate', name: 'Stone shutter', area: box(sideGate, lintel, 32, 686 - lintel), axis: 'y', cycle: { period: 7.3, open: 4.4, phase } },
    { kind: 'gate', name: 'Iris stone', dialX: forkX + 106, area: box(forkX - 226, -height + 462, 452, 26), axis: 'x', cycle: { period: 7.1, open: 4.2, phase: phase + 0.8 } },
  ];
  const exhibits: Sprite[] = [];
  if (w.id === 'echo') {
    exhibits.push(art('uplift_slab', length - 905, 476), art('uplift_slab', length - 805, 476));
    hazards.push({ kind: 'swing', name: 'Appeal bell', sprite: art('stone_chime', forkX - 68, -height + 244),
      amplitude: 0.72, speed: 1.7, phase, mountY: -height + 14 });
  } else if (w.id === 'reed') {
    hazards.push({ kind: 'swing', name: 'Flint percussion', sprite: art('stone_chime', fork + 145, 216),
      amplitude: 0.65, speed: 2.3, phase, mountY: 14 });
    hazards.push({ kind: 'draft', name: 'Organ pipes', area: box(forkX - 226, -height + 60, 452, height - 80), ax: 0, ay: 130 });
  } else {
    exhibits.push(art('stone_plinth', length - 769, 576));
    hazards.push({ kind: 'draft', name: 'Crosswind', area: box(forkX - 226, -height + 80, 452, height - 270), ax: 135, ay: 0 });
  }

  const rooms = [
    section(w.names[0], box(0, 0, fork, 700), [], [bench, launcher]),
    section(w.names[1], box(fork, 0, length - fork, 700), [mouth], exhibits),
    section(w.names[2], box(forkX - 240, -height, 480, height), [crown]),
  ];
  const home = building(rooms, [
    { axis: 'vertical', at: fork, from: 195, to: 686, trim: 'door' },
    { axis: 'horizontal', at: 0, from: forkX - lip, to: forkX + lip, trim: 'shaft' },
  ], hazards, w.id === 'reed' ? [{
    name: 'Understudy', asleep: art('understudy_asleep', fork + 108, 602),
    awake: art('understudy_awake', fork + 108, 574), radius: 460,
  }] : []);
  // Echo's trial leads straight from the office into the shaft. Close the old records wing.
  const appeal = w.id === 'echo' ? building([
    { ...rooms[0]!, decor: [art('uplift_slab', fork - 105, 476)] }, rooms[2]!,
  ], [home.openings[1]!], hazards.filter(h => h.name !== 'Stone shutter')) : home;
  const furniture = rooms.flatMap(r => r.furniture.map(s => prop(s)));
  const approach = [point(180, 360), point(330, 303), point(launchX - 140, 300),
    point(launchX + 158, 300, 'Practice toss', 180)];
  const appealFurniture = rooms[0]!.furniture.map(s => prop(s));
  const route = (exit: Sprite, exitZone: Area, exitName: string, checkpoints: Checkpoint[], roofExit: boolean): Room => ({
    human: w.id, backdrop: rooms[0]!.backdrop, pose: {
      neckX: 109, neckY: 462, torso: 0.87, head: -0.98,
      nearArm: 1.56, nearForearm: 2.02, farArm: 1.19, farForearm: 1.79,
      nearThigh: -0.63, nearShin: 1.01, farThigh: -0.77, farShin: 1.27,
    },
    item: { sprite: souvenir, name: 'first-edition bone' },
    furniture: roofExit && w.id === 'echo' ? appealFurniture : furniture, exit, exitZone,
    roofExit, par: 90, route: [], interior: { building: roofExit && w.id === 'echo' ? appeal : roofExit && w.id === 'reed' ? { ...home, sleepers: [] } : home, exitName, caption: w.caption, mumbles: w.mumbles, checkpoints },
  });
  return [
    route(mouth, box(length - 140, 488, 100, 150), w.side, [...approach, point(fork + 85, 310),
      point(sideGate - 156, w.id === 'echo' ? 250 : 310), point(sideGate + 126, 315, 'Stone shutter', 190),
      point(length - 85, 540)], false),
    route(crown, box(forkX - 65, -height + 24, 130, 78), w.roof, [...approach, point(forkX, 240),
      point(forkX, -100), point(climbX, -height + 612), point(climbX, -height + 182, 'Iris stone', 225),
      point(forkX, -height + 56)], true),
  ];
}

const [flint_split, flint_summit] = routes({
  id: 'flint', backdrop: 'quarry_cave', names: ['Drafting cave', 'Tally gallery', 'Summit chimney'],
  side: 'SPLIT ROCK', roof: 'SUMMIT CLEFT', forkX: 890, height: 920, length: 2020, phase: 0.2,
  caption: 'Flint would like his invention back.',
  mumbles: ['It went up. Write that down.', 'Try letting go this time.', 'My thumb did most of the work.', 'I call it throwing.'],
});
const [reed_stage, reed_loft] = routes({
  id: 'reed', backdrop: 'reed_cave', names: ['Rehearsal pit', 'Echo gallery', 'Organ loft'],
  side: 'STAGE DOOR', roof: 'REED HATCH', forkX: 960, height: 1060, length: 2180, phase: 2.1,
  caption: 'Reed is saving the fourth note for the encore.',
  mumbles: ['Two drums. One dramatic pause.', 'Again from the big noise.', 'Who tuned this mammoth?', 'Nobody clap yet.'],
});
const [echo_records, echo_appeal] = routes({
  id: 'echo', backdrop: 'patent_cave', names: ['Patent office', 'Evidence vault', 'Appeal shaft'],
  side: 'RECORDS DOOR', roof: 'APPEALS HATCH', forkX: 818, height: 960, length: 2220, phase: 3.7,
  caption: 'Echo has filed a claim on the beam.',
  mumbles: ['Patent pending. Gravity contested.', 'Please initial the rock.', 'Prior art is still art.', 'The slab declines to comment.'],
});

/** The L8 room in play: Flint and Reed are outdoor pickups, so Echo's appeal shaft is the only cave. */
export const MONOLITH_ROOMS = { echo_appeal };
/**
 * Retired L8 routes, kept for reuse but not registered in ROOMS (their ids are not `RoomId`s and their
 * art is in `RETIRED_ART`, not preloaded). Register one again by adding its id, strings and art back.
 */
export const RETIRED_MONOLITH_ROOMS = { flint_split, flint_summit, reed_stage, reed_loft, echo_records };
