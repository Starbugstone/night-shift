import { DRIVE_IN_PROJECTOR, SNEEZE_SHORTCUT, TRIPOD_LEG, TRIPOD_SNEEZE } from '../flight/invasion1953';
import { TRAFFIC_LANE, type TrafficHazard } from '../flight/hazards';
import type { StewardHazard } from '../flight/photographer';
import { en } from '../i18n/en';
import type { DeepLevelDef, EntryDef, PropDef, PropKind } from './types';

type Route = Extract<keyof typeof en.routes, `forester_${string}` | `van_bell_${string}` | `collier_${string}`>;
const prop = (name: string, kind: PropKind, x: number, y: number, tint?: string): PropDef =>
  ({ key: 'flight/' + name, kind, x, y, tint });
const entry = (roomId: Route, x: number, y: number, labelSide: EntryDef['labelSide'], recommended = false): EntryDef =>
  ({ ...en.routes[roomId], roomId, x, y, labelSide, recommended });

const crowd = (ax: number, ay: number, bx: number, by: number, speed: number, coneRange: number, offset: number): StewardHazard => ({
  type: 'steward', skin: 'invasion', path: [{ x: ax, y: ay }, { x: bx, y: by }], speed, dwell: 1,
  phase: Math.hypot(bx - ax, by - ay) + offset * speed,
  coneRange, coneHalf: 0.34, sweepAmp: 0, sweepRate: 0,
});

const copy = en.levels.level11;

// v4 openings: the evacuation leaves by the drive-in's north exit, turns east along the middle road and
// heads north up East Service Road. Three chained lanes; each car hands over at the junction.
const GAP = 360;
const SPEED = 110;
const CARS = ['flight/sedan55_top', 'flight/wagon55_top', 'flight/sedan55_top'] as const;
const lane = (dir: 'h' | 'v', at: number, from: number, to: number, sign: 1 | -1, offset: number, coneRange: number): TrafficHazard =>
  ({ type: 'traffic', dir, at, from, to, sign, speed: SPEED, gap: GAP, offset, coneRange, coneHalf: 0.3, keys: CARS });
const EXIT_OFF = 0;
const EVACUATION: TrafficHazard[] = [
  lane('v', 1150 - TRAFFIC_LANE, 1307, 1530, -1, EXIT_OFF, 260),
  lane('h', 1125 + TRAFFIC_LANE, 1268, 1438, 1, EXIT_OFF + 37, 70), // dipped lights through the turn: the east verge stays dark
  // v0.2 difficulty: 270 px headlights (was 300). At 300 the 0.55 s gaps between cars left a saucer on the east
  // verge no safe crossing to Sylvie, and 5 of 20 casual flights held there until sunrise.
  lane('v', 1620 - TRAFFIC_LANE, 0, 1007, -1, EXIT_OFF + 37 - 110 + 360, 270),
];

export const LEVEL11: DeepLevelDef = {
  kind: 'deep', id: 'level11', requires: ['level9'], title: copy.title, location: copy.location,
  blurb: copy.blurb, human: copy.human, mugshot: 'human/forester_head',
  memo: { re: copy.re, body: copy.body, joke: copy.joke },
  hours: [1, 6], budgetSec: 292, parMarginSec: 118,
  map: {
    theme: 'invasion53', w: 1800, h: 2280, start: { x: 1588, y: 1980 }, fuseSec: 0.76,
    collectible: TRIPOD_LEG,
    roads: [
      { dir: 'v', at: 255, from: 295, to: 2180 },
      { dir: 'v', at: 1620, from: 0, to: 2280 },
      { dir: 'h', at: 295, from: 255, to: 1620 },
      { dir: 'h', at: 2180, from: 255, to: 1620 },
      { dir: 'h', at: 1125, from: SNEEZE_SHORTCUT[2].x, to: 1620 },
      { dir: 'v', at: 1150, from: 1125, to: 1760 }, // v4 openings: the drive-in's north exit
    ],
    groundProps: [
      prop('invasion_crater_top', 'field', 475, 1213),
      prop('invasion_field_rows_wide', 'field', 555, 1670),
      { ...prop('invasion_field_rows_strip', 'field', 1330, 900), rot: 0.17 },
      { ...prop('invasion_field_rows_patch', 'field', 500, 430), rot: 0.12 },
    ],
    props: [
      prop('invasion_screen_top', 'civic', 900, 2030, '#5c6379'),
      prop('barn_top', 'barn', 125, 1040),
      { ...prop('wagon55_top', 'sedan55', 560, 1850), rot: Math.PI },
      { ...prop('sedan55_top', 'sedan55', 710, 1890), rot: Math.PI },
      { ...prop('sedan55_top', 'sedan55', 860, 1860), rot: Math.PI },
      { ...prop('wagon55_top', 'sedan55', 995, 1910), rot: Math.PI },
      { ...prop('sedan55_top', 'sedan55', 1170, 1880), rot: Math.PI },
      { ...prop('sedan55_top', 'sedan55', 705, 1710), rot: Math.PI },
      { ...prop('wagon55_top', 'sedan55', 1000, 1735), rot: Math.PI },
      ...[[130, 555], [145, 785], [460, 965], [648, 470], [1255, 310], [1190, 1010], [1695, 1240], [1690, 1770], [100, 1630], [130, 1890]]
        .map(([x, y]) => prop('tree_top', 'tree', x!, y!)),
    ],
    targets: [
      { human: 'Clive Forester', short: 'Clive', head: 'human/forester_head', building: prop('invasion_farm_top', 'farmhouse', 430, 720),
        entries: [entry('forester_kitchen', 285, 750, 'below', true), entry('forester_attic', 485, 515, 'above')] },
      { human: 'Sylvie Van Bell', short: 'Sylvie', head: 'human/van_bell_head', building: prop('invasion_booth_top', 'diner', 1290, 650),
        entries: [entry('van_bell_staff', 1450, 670, 'below', true), entry('van_bell_vent', 1295, 450, 'above')] },
      { human: 'Pastor Matt Collier', short: 'Matt', head: 'human/collier_head', building: prop('invasion_church_top', 'civic', 930, 510, '#746b75'),
        entries: [entry('collier_vestry', 755, 535, 'below', true), entry('collier_bell', 1060, 385, 'above')] },
    ],
    hazards: [
      DRIVE_IN_PROJECTOR, TRIPOD_SNEEZE,
      ...EVACUATION,
      crowd(1250, 880, 1390, 980, 90, 178, 0.1),
      crowd(1140, 795, 1120, 600, 82, 165, 0.65),
      { type: 'watcher', name: 'Edna Pruitt', skin: 'spotter53', x: 950, y: 620, range: 650, half: 0.9, angles: [1.44, 1.52], hold: 3.2, sweepAmp: 0.05, sweepRate: 0.7 },
      { type: 'dog', x: 1400, y: 940, rMin: 205, rMax: 230, period: 2.2, phase: 0 },
    ],
    lamps: [{ x: 318, y: 752 }, { x: 1474, y: 1110 }, { x: 833, y: 570 }, { x: 155, y: 1170 }],
  },
};
