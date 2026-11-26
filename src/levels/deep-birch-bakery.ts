import type { RoomId } from '../contracts';
import { en } from '../i18n/en';
import type { DeepLevelDef, EntryDef, PropDef, PropKind } from './types';

export const bakeryGate = { x: 466, y: 895 };
export const bakeryPie = { x: 195, y: 425 };
export const bakeryLaunch = { x: 330, y: 2060 };

export function birchProp(name: string, kind: PropKind, x: number, y: number, rot?: number): PropDef {
  return { key: 'flight/' + name, kind, x, y, rot };
}

export function birchEntry(roomId: RoomId, x: number, y: number, labelSide: EntryDef['labelSide'], recommended = false): EntryDef {
  return { ...en.routes[roomId], roomId, x, y, labelSide, recommended };
}

const copy = en.levels.birch_bakery;
export const BIRCH_BAKERY: DeepLevelDef = {
  kind: 'deep', id: 'birch_bakery', ...copy, mugshot: 'human/mabel_head',
  memo: { re: copy.re, body: copy.body, joke: copy.joke },
  clockMode: 'elapsed', hours: [2, 2], budgetSec: Infinity, parMarginSec: 0, elapsedParSec: 56,
  map: {
    // 2026-11-26 openings: Zib turns in from Main Street at the foot of Birch Lane, behind Larry's parked
    // Spin City van. The gate light guards the loading yard a block up the lane, off the first screen.
    theme: 'suburb', w: 1080, h: 2150, start: bakeryLaunch, fuseSec: 0.95,
    collectible: { id: 'cherry_pie', ...bakeryPie },
    roads: [
      { dir: 'h', at: 1250, from: 0, to: 1080 },
      { dir: 'v', at: bakeryGate.x, from: bakeryGate.y, to: 1250 },
      { dir: 'v', at: 74, from: 520, to: 2060 },
      { dir: 'h', at: 2060, from: 0, to: 1080 },
      { dir: 'v', at: 880, from: 1250, to: 2060 },
      { dir: 'h', at: 520, from: 74, to: 405 },
    ],
    targets: [{
      human: copy.human, short: 'Mabel',
      building: { ...birchProp('birch_bakery_top', 'suburb_house', 540, 460), tint: '#c7a77a' },
      entries: [birchEntry('mabel_stockroom', 615, 505, 'below', true), birchEntry('mabel_vent', 470, 400, 'above')],
    }],
    groundProps: [birchProp('bakery_back_windowsill_top', 'suburb_house', bakeryPie.x + 12, bakeryPie.y - 52)],
    props: [
      birchProp('bakery_loading_gate_top', 'hedge', bakeryGate.x, bakeryGate.y),
      birchProp('van_top', 'diner', 200, 2060, -Math.PI / 2),
      birchProp('house_suburb_a', 'suburb_house', 900, 925),
      birchProp('house_suburb_c', 'suburb_house', 890, 510),
      birchProp('house_suburb_b', 'suburb_house', 240, 274),
      birchProp('house_suburb_a', 'suburb_house', 775, 228),
      birchProp('hedge_h', 'hedge', 288, 848),
      birchProp('hedge_h', 'hedge', 645, 848),
      birchProp('house_suburb_b', 'suburb_house', 300, 1480),
      birchProp('house_suburb_c', 'suburb_house', 640, 1470),
      birchProp('house_suburb_a', 'suburb_house', 640, 1830),
      birchProp('hedge_h', 'hedge', 330, 1700),
      ...[[40, 1060], [284, 1120], [1007, 687], [74, 329], [415, 208], [988, 231], [1010, 1880], [1010, 1500], [400, 1900], [740, 1680]]
        .map(([x, y]) => birchProp('tree_top', 'tree', x!, y!)),
    ],
    lamps: [{ x: 615, y: 525 }, { x: 390, y: 1230 }, { x: 140, y: 1000 }, { x: 140, y: 1640 }, { x: 760, y: 2030 }],
    hazards: [{ type: 'porch', ...bakeryGate, trigger: 310, r: 360, mount: 'post' }],
  },
};
