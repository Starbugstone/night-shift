import type { CameraHazard } from '../flight/hazards';
import { en } from '../i18n/en';
import type { DeepLevelDef, EntryDef, PropDef, PropKind } from './types';

const words = en.levels.level12;
const prop = (key: string, kind: PropKind, x: number, y: number): PropDef => ({ key: 'flight/' + key, kind, x, y });
const entry = (roomId: keyof typeof en.routes, x: number, y: number, labelSide: EntryDef['labelSide'], recommended = false): EntryDef =>
  ({ roomId, x, y, labelSide, recommended, ...en.routes[roomId] });
const recital = (x: number, y: number, range: number, half: number, base: number, amp: number, rate: number, phase: number): CameraHazard =>
  ({ type: 'camera', skin: 'reciter2199_top', x, y, range, half, base, amp, rate, phase });

export const LEVEL12: DeepLevelDef = {
  kind: 'deep', id: 'level12', requires: ['level10', 'level11'], title: words.title,
  location: words.location, blurb: words.blurb, human: words.human, mugshot: 'human/artie_head',
  memo: { re: words.re, body: words.body, joke: words.joke },
  clockMode: 'demolition', // v0.2 presentation
  hours: [0, 0], budgetSec: 175, parMarginSec: 26, // v0.2 openings: the cordon detours retuned the clock (was 192 s)
  map: {
    // v4 openings: Zib slips in from the north under the west demolition barge and flies south. The big
    // recital no longer faces the launch: it guards Moe's bureau at the far end of the avenue.
    theme: 'grimsby2199', w: 1800, h: 2320, start: { x: 300, y: 250 }, fuseSec: 0.61,
    collectible: { id: 'bypass_towel', x: 180, y: 430 },
    roads: [
      { dir: 'h', at: 130, from: 310, to: 1490 },
      { dir: 'v', at: 900, from: 130, to: 1700 },
      { dir: 'v', at: 310, from: 130, to: 2260 }, { dir: 'v', at: 1490, from: 130, to: 2260 },
      { dir: 'h', at: 518, from: 150, to: 310 }, { dir: 'h', at: 1700, from: 310, to: 1490 },
      { dir: 'v', at: 1080, from: 1700, to: 1950 },
      { dir: 'v', at: 1270, from: 400, to: 675 }, { dir: 'h', at: 560, from: 1270, to: 1490 },
    ],
    groundProps: [prop('towel_rack2199_top', 'hedge', 175, 480),
      prop('demolition_barge2199_top', 'civic', 400, 330), prop('demolition_barge2199_top', 'civic', 1510, 287),
      prop('lighthouse_top', 'civic', 90, 995)],
    props: [], lamps: [],
    targets: [
      { human: 'Artie Duvet', short: 'Artie', building: prop('duvet_house2199_top', 'suburb_house', 425, 795),
        entries: [entry('artie_garden', 270, 795, 'below', true), entry('artie_bath', 530, 675, 'above')] },
      { human: 'Penny Thumb', short: 'Penny', building: prop('transit2199_top', 'civic', 1375, 795),
        entries: [entry('penny_service', 1530, 795, 'below', true), entry('penny_loft', 1270, 675, 'above')] },
      { human: 'Moe Dread', short: 'Moe', building: prop('complaints2199_top', 'civic', 900, 1935),
        entries: [entry('moe_returns', 1080, 1950, 'above', true), entry('moe_vent', 900, 2040, 'below')] },
    ],
    hazards: [
      recital(900, 1640, 660, 0.91, -1.57, 0.14, 0.65, 0.35),
      recital(655, 965, 340, 0.36, -2.17, 0.55, 0.70, 0.4),
      recital(900, 2260, 285, 0.32, -1.36, 0.58, 0.70, 4.3),
      { type: 'steward', skin: 'dozer2199', path: [{ x: 1270, y: 400 }, { x: 1270, y: 600 }],
        speed: 72, dwell: 1.8, phase: 220, coneRange: 195, coneHalf: 0.80, sweepAmp: 0, sweepRate: 0 },
      // The bypass cordon: flagged cable across the gardens, open only at the avenue where the poet reads.
      { type: 'wire', kind: 'bunting', ax: 400, ay: 1240, bx: 760, by: 1240 },
      { type: 'wire', kind: 'bunting', ax: 1040, ay: 1240, bx: 1400, by: 1240 },
      // v0.2 openings: the bypass survey has reached the north of town. Artie's lane is closed under the
      // DON'T PANIC sign (the diversion runs west through the harbour bay, past the towel), and a survey
      // line crosses the gardens between the quay and Penny's. A thumb held straight from the launch at
      // Artie's or Penny's doors stalls on the cable (docs/GDD-14-2199-hitchhiker.md, "No straight-line win").
      { type: 'wire', kind: 'bunting', ax: 230, ay: 560, bx: 600, by: 560 },
      { type: 'wire', kind: 'bunting', ax: 892, ay: 328, bx: 788, by: 566 },
    ],
  },
};
