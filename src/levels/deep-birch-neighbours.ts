import { en } from '../i18n/en';
import { birchEntry, birchProp } from './deep-birch-bakery';
import type { DeepLevelDef } from './types';

const copy = en.levels.birch_neighbours;
export const binLid = { x: 457, y: 1380 };
export const birchWatcher = { x: 720, y: 950 };
export const BIRCH_NEIGHBOURS: DeepLevelDef = {
  kind: 'deep', id: 'birch_neighbours', ...copy, mugshot: 'human/nora_head',
  memo: { re: copy.re, body: copy.body, joke: copy.joke },
  hours: [2, 6], budgetSec: 210, parMarginSec: 110,
  map: {
    theme: 'suburb', w: 1440, h: 1680, start: { x: 720, y: 1570 }, fuseSec: 0.9,
    collectible: { id: 'garden_gnome', x: 1255, y: 610 },
    targets: [
      { human: 'Nora Finch', short: 'Nora', building: birchProp('henderson_garage_top', 'suburb_house', 460, 620),
        entries: [birchEntry('nora_side', 560, 675, 'below', true), birchEntry('nora_loft', 450, 565, 'above')] },
      { human: 'Len Briggs', short: 'Len', building: birchProp('len_workshop_top', 'suburb_house', 1020, 760),
        entries: [birchEntry('len_workshop', 915, 775, 'below', true), birchEntry('len_skylight', 1025, 675, 'above')] },
    ],
    roads: [
      { dir: 'h', at: 1550, from: 0, to: 1440 },
      { dir: 'v', at: 430, from: 800, to: 1340 },
      { dir: 'v', at: 1010, from: 800, to: 1340 },
      { dir: 'h', at: 800, from: 130, to: 1310 },
      { dir: 'v', at: 130, from: 450, to: 1550 },
      { dir: 'v', at: 1310, from: 800, to: 1550 },
    ],
    groundProps: [],
    props: [
      { ...birchProp('pruitt_house_top', 'suburb_house', birchWatcher.x - 35, birchWatcher.y - 28), tint: '#7a5a8a' },
      birchProp('hedge_h', 'hedge', 304, 652, Math.PI / 2),
      birchProp('hedge_h', 'hedge', 610, 1080, Math.PI / 2),
      birchProp('house_suburb_a', 'suburb_house', 298, 345),
      birchProp('house_suburb_c', 'suburb_house', 1172, 339),
      birchProp('house_suburb_b', 'suburb_house', 270, 1030),
      ...[[278, 1180], [1165, 1020], [85, 297], [713, 555], [805, 284], [1360, 449], [81, 1090], [1187, 1385]]
        .map(([x, y]) => birchProp('tree_top', 'tree', x!, y!)),
    ],
    lamps: [{ x: 530, y: 744 }, { x: 940, y: 860 }, { x: 280, y: 1510 }, { x: 1150, y: 1510 }],
    hazards: [{
      type: 'watcher', name: 'Mrs. Pruitt', ...birchWatcher, range: 590, half: 0.88,
      angles: [Math.PI / 2 + 0.20, Math.PI / 2 - 0.20], hold: 3, sweepAmp: 0.06, sweepRate: 1.4,
    }],
  },
};
