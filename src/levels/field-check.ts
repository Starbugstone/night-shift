import type { AbductRules } from '../contracts';
import { sprite, type Room } from '../abduct/rooms/layout';
import { building, type InteriorRoom } from '../abduct/rooms/interior';
import { davePatio } from '../abduct/rooms/deep';
import { LEVEL3 } from './deep-levels';
import { LEVELS } from './levels';
import type { DeepLevelDef } from './types';

export const FIELD_CHECK_INDEX = LEVELS.findIndex(level => level.id === 'level2') + 1;
export const FIELD_CHECK_RULES: AbductRules = { hard: true, wakeFails: false };

const dave = LEVEL3.map.targets[0];
const house = { ...dave.building, x: 600, y: 420 };
const patio = { ...dave.entries[1], x: 658, y: 499, recommended: false };
export const FIELD_CHECK: DeepLevelDef = {
  ...LEVEL3,
  map: {
    theme: 'suburb', w: 1080, h: 1450, start: { x: 540, y: 1300 }, fuseSec: 1.2,
    targets: [{ ...dave, building: house, entries: [patio] }],
    roads: [{ dir: 'h', at: 850, from: 0, to: 1080 }],
    props: [{ key: 'flight/van_top', kind: 'diner', x: 244, y: 856, rot: Math.PI / 2 }],
    groundProps: [], lamps: [],
    hazards: [{ type: 'porch', x: 590, y: 880, trigger: 320, r: 340, mount: 'post' }],
  },
};

const bedroom = davePatio.interior!.building.rooms[0]!;
const decoy = davePatio.interior!.building.sleepers[0]!;
const exit = sprite('room/exit_patio_door', 741, 350);
const landing: InteriorRoom = {
  name: 'Landing', backdrop: 'room/bg_hallway', x: 540, y: 0, w: 400, h: 700,
  decor: [exit], furniture: [], supports: [], mounts: [],
};

export const FIELD_CHECK_ROOM: Room = {
  ...davePatio,
  wrapperLessons: true,
  furniture: [...bedroom.supports],
  exit,
  exitZone: { x: 776, y: 380, w: 120, h: 166 },
  interior: {
    ...davePatio.interior!,
    building: building(
      [{ ...bedroom, w: 540, decor: [], furniture: [] }, landing],
      [{ axis: 'vertical', at: 540, from: 220, to: 600, trim: 'door' }],
      [], [{ ...decoy, name: 'Practice decoy', radius: 340 }],
    ),
    checkpoints: [{ x: 254, y: 362 }, { x: 450, y: 337 }, { x: 624, y: 355 }, { x: 835, y: 420 }],
  },
};
