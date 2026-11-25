import { en } from '../i18n/en';
import type { DeepLevelDef } from './types';
import type { HumSlab } from '../flight/monolith';

const slab = (x: number, y: number, inner: number, outer: number, period: number, sounding: number, phase: number): HumSlab =>
  ({ type: 'hum', x, y, inner, outer, period, sounding, phase });
const trail = (x: number, y: number, toX: number, toY: number) =>
  ({ home: { x, y }, lookout: { x: toX, y: toY } });

const copy = en.levels.level8;
export const LEVEL8: DeepLevelDef = {
  kind: 'deep', id: 'level8', num: 8, title: copy.title, location: copy.location, blurb: copy.blurb,
  human: copy.human, mugshot: 'human/flint_head', memo: { re: copy.re, body: copy.body, joke: copy.joke },
  hours: [5, 6], budgetSec: 100, parMarginSec: 25,
  map: {
    theme: 'badlands', w: 1440, h: 1920, start: { x: 520, y: 1700 },
    // v4 map collectibles: Krix, the ex-intern in a black turtleneck clutching his toaster, on the east ridge north of Reed.
    collectible: { id: 'krix', x: 1290, y: 570 },
    targets: [
      { human: 'Flint', short: 'Flint', building: { kind: 'terrace', key: 'flight/quarry_top', x: 360, y: 1300 }, entries: [],
        troop: { quota: 2, trails: [trail(540,1520,630,1480), trail(330,1350,235,1290), trail(590,1240,725,1260)] } },
      { human: 'Reed', short: 'Reed', building: { kind: 'terrace', key: 'flight/bandstand_top', x: 1010, y: 840 }, entries: [],
        troop: { quota: 2, trails: [trail(1040,980,930,1030), trail(1130,810,1190,715), trail(860,780,735,820)] } },
      { human: 'Echo', short: 'Echo', building: { kind: 'terrace', key: 'flight/archive_top', x: 465, y: 395 },
        entries: [{ ...en.routes.echo_appeal, roomId: 'echo_appeal', x: 552, y: 434, labelSide: 'below' }] },
    ],
    hazards: [
      slab(580,1280,85,218,6.7,4.7,1.5),
      slab(745,1140,95,195,7.7,4.8,3.2),
      slab(770,650,85,185,6.9,4.4,0.8),
    ],
    groundProps: [], props: [], roads: [], lamps: [],
  },
};
