import { en } from '../i18n/en';
import type { DeepLevelDef } from './types';
import type { HumSlab } from '../flight/monolith';

const slab = (x: number, y: number, inner: number, outer: number, period: number, sounding: number, phase: number): HumSlab =>
  ({ type: 'hum', x, y, inner, outer, period, sounding, phase });
const trail = (x: number, y: number, toX: number, toY: number) =>
  ({ home: { x, y }, lookout: { x: toX, y: toY } });

const copy = en.levels.level8;
// 2026-11-26 openings (docs/GDD-4-monolith.md): Zib comes down the dry riverbed from upstream, out of the
// north-east, onto a quiet plateau. OBELISK's three slabs hum across the valley below it, a picket line
// every straight run has to cross; the troops and Echo's archive sit downstream of it. A slab's centre is quiet.
export const LEVEL8: DeepLevelDef = {
  kind: 'deep', id: 'level8', title: copy.title, location: copy.location, blurb: copy.blurb,
  human: copy.human, mugshot: 'human/flint_head', memo: { re: copy.re, body: copy.body, joke: copy.joke },
  clockMode: 'countdown', // v0.2 presentation
  hours: [5, 6], budgetSec: 100, parMarginSec: 25,
  map: {
    theme: 'badlands', w: 1440, h: 2200, start: { x: 1250, y: 150 }, fuseSec: 0.9,
    // v4 map collectibles: Krix, the ex-intern in a black turtleneck clutching his toaster, on the west
    // plateau above the picket line: a detour before the crossing.
    collectible: { id: 'krix', x: 180, y: 760 },
    targets: [
      { human: 'Flint', short: 'Flint', building: { kind: 'terrace', key: 'flight/quarry_top', x: 330, y: 1700 }, entries: [],
        troop: { quota: 2, trails: [trail(510,1920,600,1880), trail(300,1750,205,1690), trail(560,1640,695,1660)] } },
      { human: 'Reed', short: 'Reed', building: { kind: 'terrace', key: 'flight/bandstand_top', x: 1050, y: 1800 }, entries: [],
        troop: { quota: 2, fur: 'light', trails: [trail(1080,1940,970,1990), trail(1170,1770,1230,1675), trail(900,1740,775,1780)] } },
      { human: 'Echo', short: 'Echo', building: { kind: 'terrace', key: 'flight/archive_top', x: 760, y: 2040 },
        entries: [{ ...en.routes.echo_appeal, roomId: 'echo_appeal', x: 847, y: 2079, labelSide: 'above' }] },
    ],
    // The picket line: each slab keeps its own beat, so the gaps drift along the line.
    // v0.2 round 6 tuning: each note holds 0.15 s longer (was 5.5, 6, 5.7 s), so the silences are 0.15 s shorter. With the
    // flight model's hold livelock fixed, casual Ghost rose to 19/20 over its 90% cap (docs/REGRESSIONS.md L21).
    hazards: [
      slab(200,1312,75,299,6.7,5.65,2.3),
      slab(754,1300,75,299,6.8,6.15,6.5),
      slab(1180,1314,75,299,6.5,5.85,6.1),
    ],
    groundProps: [], props: [], roads: [], lamps: [],
  },
};
