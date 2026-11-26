import type { RoomId } from '../contracts';
import { COW, GRAIL_LAUNCH, GRAIL_SENTRY, NI_KNIGHTS } from '../flight/grail';
import { en } from '../i18n/en';
import type { DeepLevelDef, EntryDef, PropDef } from './types';

const prop = (name: string, x: number, y: number, kind: PropDef['kind'] = 'civic'): PropDef =>
  ({ key: 'flight/' + name, x, y, kind });
const entry = (roomId: RoomId, x: number, y: number, labelSide: EntryDef['labelSide'], recommended = false): EntryDef =>
  ({ ...en.routes[roomId], roomId, x, y, labelSide, recommended });
const copy = en.levels.level10;

export const LEVEL10: DeepLevelDef = {
  kind: 'deep', id: 'level10', requires: ['level9'], title: copy.title, location: copy.location,
  blurb: copy.blurb, human: copy.human, mugshot: 'human/rodney_head',
  memo: { re: copy.re, body: copy.body, joke: copy.joke },
  hours: [2, 6], budgetSec: 330, parMarginSec: 202,
  map: {
    theme: 'grail', w: 1800, h: 2320, start: GRAIL_LAUNCH, fuseSec: 0.75,
    collectible: { id: 'shrubbery', x: 100, y: 805 },
    // The banks, bridge and winding cart tracks are painted together in the terrain tile.
    roads: [], groundProps: [],
    props: [
      // The French have rolled their wooden rabbit up to Rodney's tent; the taunter perches on it.
      prop('grail_battlement_top', 900, 1450), prop('grail_wooden_rabbit_top', GRAIL_SENTRY.x - 6, GRAIL_SENTRY.y + 22),
      prop('grail_cave_top', 1190, 922), prop('grail_ni_knights_top', NI_KNIGHTS.x, NI_KNIGHTS.y),
      prop('hedge_top', 95, 700, 'hedge'), prop('hedge_top', 85, 915, 'hedge'),
      { key: 'room/coconut_halves', x: GRAIL_LAUNCH.x - 40, y: GRAIL_LAUNCH.y + 85, kind: 'haybale' },
    ],
    targets: [
      { human: 'Sir Rodney the Not-Quite-So-Brave', short: 'Rodney', building: prop('grail_pavilion_top', 445, 955, 'barn'),
        entries: [entry('rodney_flap', 315, 990, 'below', true), entry('rodney_loft', 495, 790, 'above')] },
      { human: 'The Black Knight', short: 'Black Knight', head: 'human/black_knight_head', building: prop('grail_bridge_top', 900, 735),
        entries: [entry('black_knight_arch', 785, 855, 'below', true), entry('black_knight_loft', 1020, 650, 'above')] },
      { human: 'Tom the Enchanter', short: 'Tom', head: 'human/tom_enchanter_head', building: prop('grail_tower_top', 1405, 560),
        entries: [entry('tom_stair', 1550, 620, 'below', true), entry('tom_smoke', 1325, 390, 'above')] },
    ],
    hazards: [
      GRAIL_SENTRY,
      { type: 'cow', x: 460, y: 1125, offset: 0 }, { type: 'cow', x: 1010, y: 1090, offset: COW.cycle / 2 },
      { type: 'squire', path: [{ x: 605, y: 920 }, { x: 630, y: 590 }], speed: 82, dwell: 1, phase: 0, sweepAmp: 0, sweepRate: 0 },
      { type: 'rabbit', x: 1190, y: 970 },
    ],
    lamps: [{ x: 265, y: 1930 }, { x: 265, y: 1210 }, { x: 330, y: 920 }, { x: 1525, y: 1900 },
      { x: 1515, y: 1230 }, { x: 1530, y: 660 }, { x: 700, y: 1300 }, { x: 1030, y: 930 }],
  },
};
