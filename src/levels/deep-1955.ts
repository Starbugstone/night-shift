import type { RoomId } from '../contracts';
import type { CameraHazard } from '../flight/hazards';
import { TIME_CAR } from '../flight/time-car';
import { en } from '../i18n/en';
import type { DeepLevelDef, EntryDef, PropDef, PropKind } from './types';

const prop = (name: string, kind: PropKind, x: number, y: number, tint?: string): PropDef =>
  ({ key: 'flight/' + name, kind, x, y, tint });
const entry = (roomId: keyof typeof en.routes & RoomId, x: number, y: number, labelSide: EntryDef['labelSide'], recommended = false): EntryDef =>
  ({ ...en.routes[roomId], roomId, x, y, labelSide, recommended });
const spot = (skin: NonNullable<CameraHazard['skin']>, x: number, y: number, range: number, half: number, base: number, amp = 0): CameraHazard =>
  ({ type: 'camera', skin, x, y, range, half, base, amp, rate: 0.85, phase: 0 });

const copy = en.levels.level9;
const { cable, turnout } = TIME_CAR;

export const LEVEL9: DeepLevelDef = {
  kind: 'deep', id: 'level9', num: 9, title: copy.title, location: copy.location, blurb: copy.blurb,
  human: copy.human, mugshot: 'human/doc_head', memo: { re: copy.re, body: copy.body, joke: copy.joke },
  hours: [22, 22], budgetSec: 380, parMarginSec: 255,
  map: {
    theme: 'storm55', w: 1760, h: 2240, start: { x: 1050, y: 2010 }, fuseSec: 0.86,
    collectible: { id: 'time_car', ...TIME_CAR.bay },
    roads: [
      { dir: 'v', at: 820, from: 755, to: 2240 },
      { dir: 'h', at: TIME_CAR.bay.y, from: 76, to: 1730 },
      { dir: 'h', at: 1140, from: 530, to: 1730 },
      { dir: 'v', at: 590, from: 755, to: 2060 },
      { dir: 'v', at: 1640, from: 755, to: 2130 },
      { dir: 'h', at: 1545, from: 1250, to: 1640 },
      { dir: 'h', at: 2050, from: 420, to: 1710 },
      { dir: 'h', at: 928, from: 228, to: 590 },
      { dir: 'v', at: turnout.x, from: TIME_CAR.bay.y, to: 928 },
      { dir: 'v', at: 1135, from: 755, to: 1140 },
      { dir: 'h', at: 1030, from: 1135, to: 1640 },
    ],
    groundProps: [prop('courthouse_square55', 'civic', 820, 553, '#655447')],
    props: [
      prop('contact_lamp55_top', 'streetlight', cable.x - 10, cable.south + 18),
      prop('picture_house55_top', 'civic', 1370, 893, '#536472'),
      prop('dress_shop55_top', 'diner', 380, 621, '#786273'),
      prop('school55_top', 'civic', 1365, 584, '#8b6862'),
      prop('trunk_sedan55_top', 'sedan55', 1448, 1590, '#7e5d69'),
      prop('sedan55_top', 'sedan55', 297, 1333, '#668076'),
      prop('wagon55_top', 'sedan55', 1070, 1340, '#8a6459'),
      ...[[300, 1780], [330, 1970], [1280, 1850], [1480, 1960], [270, 2170], [1200, 2170], [1450, 2150]].map(
        ([x, y]) => prop('house55_top', 'suburb_house', x!, y!, '#645666'),
      ),
      ...[[445, 1780], [447, 1940], [1310, 1985], [1330, 2090]].map(([x, y]) => prop('hedge_top', 'hedge', x!, y!)),
      ...[[514, 688], [1110, 659], [512, 1188], [1165, 958], [1505, 1448], [690, 1605], [938, 1800]].map(
        ([x, y]) => prop('streetlamp55_top', 'streetlight', x!, y!),
      ),
    ],
    targets: [
      { human: 'Doc', short: 'Doc', building: prop('courthouse55_top', 'civic', 820, 310, '#776b60'),
        entries: [entry('inventor_service', 620, 350, 'below', true), entry('inventor_balcony', 1040, 330, 'above')] },
      { human: 'Buff Tanner', short: 'Buff', building: prop('cafe55_top', 'diner', 390, 1100),
        entries: [entry('bully_kitchen', 235, 1020, 'above', true), entry('bully_transom', 430, 1245, 'below')] },
      { human: 'Marvin Cherry', short: 'Marvin', building: prop('dance_gym55_top', 'civic', 1380, 1320, '#695365'),
        entries: [entry('band_canopy', 1570, 1520, 'above', true), entry('band_hatch', 1250, 1550, 'below')] },
    ],
    hazards: [
      spot('marshal55_torch', 1030, 1940, 440, 0.49, -2.25, 0.06),
      spot('dance_spot55', 1400, 1480, 585, 0.5, 2.145, 0.18),
      spot('worklamp55', 820, 694, 540, 0.52, Math.PI / 2),
      { type: 'car', key: 'flight/police55_top', role: 'police', path: [
        { x: 1135, y: 755 }, { x: 1640, y: 755 }, { x: 1640, y: 1030 }, { x: 1135, y: 1030 },
      ], loop: true, speed: 150, dwell: 0, phase: 450, coneRange: 240, coneHalf: 0.32, sweepAmp: 0, sweepRate: 0, barR: 0 },
      { type: 'watcher', skin: 'cafe55', name: 'Café watcher', x: 555, y: 1100, range: 225, half: 0.35,
        angles: [2.12, 0], hold: 3.2, sweepAmp: 0.08, sweepRate: 0.8 },
      { type: 'wire', kind: 'power', ax: cable.x, ay: cable.north, bx: cable.x, by: cable.south },
    ],
    lamps: [
      { x: 514, y: 688 }, { x: 1110, y: 659 }, { x: 355, y: 1188 }, { x: 1165, y: 958 },
      { x: 1505, y: 1448 }, { x: 267, y: 843 }, { x: 938, y: 1800 },
    ],
  },
};
