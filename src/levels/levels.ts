import type { RoomId } from '../contracts';
import type { LevelDef, LockedCard } from './types';

const PI = Math.PI;

export const LEVELS: readonly LevelDef[] = [
  {
    id: 'level1',
    num: 1,
    title: 'Farmer Doyle Sleeps Like a Log',
    location: 'Doyle Farm · Route 9',
    blurb: 'Big man. Bigger snore. Light-sleeper dog.',
    human: 'Farmer Doyle',
    parSec: 50,
    memo: {
      re: 'Work Order #0001 — Farmer Doyle',
      body:
        'Welcome to the night shift, Zib. Your first specimen is Farmer Doyle, 58: sleeps like a log, snores like a chainsaw. Avoid the pickup\'s headlights and the dog by the porch. The dog is a light sleeper and a heavy gossip.',
      joke:
        'Reminder: specimens must arrive undamaged, unbruised and ideally unaware. Last quarter\'s intern returned a man still holding his toaster.',
    },
    map: {
      theme: 'farm',
      w: 1080,
      h: 1920,
      start: { x: 540, y: 1790 },
      roads: [
        { dir: 'h', at: 1240, from: 0, to: 1080 },
        { dir: 'v', at: 620, from: 700, to: 1185 },
      ],
      groundProps: [
        { key: 'flight/field_rows', kind: 'field', x: 210, y: 1570 },
        { key: 'flight/field_rows', kind: 'field', x: 870, y: 1570 },
        { key: 'flight/field_rows', kind: 'field', x: 190, y: 190 },
        { key: 'flight/field_rows', kind: 'field', x: 520, y: 170, rot: PI / 2 },
      ],
      props: [
        { key: 'flight/barn_top', kind: 'barn', x: 850, y: 500 },
        { key: 'flight/tractor_top', kind: 'tractor', x: 870, y: 790, rot: 0.35 },
        { key: 'flight/haybale_top', kind: 'haybale', x: 720, y: 720 },
        { key: 'flight/haybale_top', kind: 'haybale', x: 760, y: 690 },
        { key: 'flight/haybale_top', kind: 'haybale', x: 990, y: 760 },
        { key: 'flight/haybale_top', kind: 'haybale', x: 1010, y: 690 },
        { key: 'flight/tree_top', kind: 'tree', x: 90, y: 880 },
        { key: 'flight/tree_top', kind: 'tree', x: 200, y: 1000 },
        { key: 'flight/tree_top', kind: 'tree', x: 70, y: 1100 },
        { key: 'flight/tree_top', kind: 'tree', x: 990, y: 960 },
        { key: 'flight/tree_top', kind: 'tree', x: 870, y: 1070 },
        { key: 'flight/tree_top', kind: 'tree', x: 110, y: 470 },
        { key: 'flight/tree_top', kind: 'tree', x: 60, y: 620 },
        { key: 'flight/tree_top', kind: 'tree', x: 990, y: 160 },
        { key: 'flight/tree_top', kind: 'tree', x: 850, y: 140 },
        { key: 'flight/tree_top', kind: 'tree', x: 470, y: 1440 },
        { key: 'flight/tree_top', kind: 'tree', x: 630, y: 1420 },
      ],
      target: { key: 'flight/farmhouse_top', kind: 'farmhouse', x: 420, y: 560 },
      entries: [
        { roomId: 'farm_window', route: 'Window', difficulty: 'easy', x: 292, y: 610, labelSide: 'below' },
        { roomId: 'farm_chimney', route: 'Chimney', difficulty: 'fast & risky', x: 480, y: 495, labelSide: 'above' },
      ],
      vehicles: [
        {
          key: 'flight/pickup_top',
          kind: 'pickup',
          path: [
            { x: 60, y: 1240 },
            { x: 620, y: 1240 },
            { x: 620, y: 820 },
          ],
          speed: 120,
          dwell: 1.6,
          coneRange: 300,
          coneHalf: 0.36,
          sweepAmp: 0.38,
          sweepRate: 0.9,
        },
      ],
      dogs: [{ x: 400, y: 740, rMin: 70, rMax: 165, period: 3.2 }],
      neons: [],
      powerLines: [],
      lamps: [{ x: 560, y: 700 }],
    },
  },
  {
    id: 'level2',
    num: 2,
    title: 'Laundromat Larry, Night Attendant',
    location: 'Spin City Laundromat · Main St',
    blurb: 'Asleep in a rolling chair. Holding coffee.',
    human: 'Larry',
    parSec: 60,
    memo: {
      re: 'Work Order #0002 — Laundromat Larry',
      body:
        'Larry is the night attendant at Spin City Laundromat. He has been asleep on duty for six years; we admire the commitment. Avoid the delivery van. The diner\'s neon sign scrambles steering. Power lines are solid. I cannot stress this enough.',
      joke:
        'If Larry\'s coffee mug comes along, log it as an "Earth artefact". Do not drink it. We still don\'t know what decaf is.',
    },
    map: {
      theme: 'town',
      w: 1080,
      h: 1920,
      start: { x: 540, y: 1790 },
      roads: [
        { dir: 'h', at: 860, from: 0, to: 1080 },
        { dir: 'h', at: 1460, from: 0, to: 1080 },
        { dir: 'v', at: 540, from: 0, to: 1920 },
      ],
      groundProps: [],
      props: [
        { key: 'flight/diner_top', kind: 'diner', x: 290, y: 580 },
        { key: 'flight/house_top', kind: 'house', x: 200, y: 1170 },
        { key: 'flight/house_top', kind: 'house', x: 880, y: 1170 },
        { key: 'flight/house_top', kind: 'house', x: 200, y: 1730 },
        { key: 'flight/house_top', kind: 'house', x: 880, y: 1730 },
        { key: 'flight/house_top', kind: 'house', x: 170, y: 190 },
        { key: 'flight/house_top', kind: 'house', x: 880, y: 170 },
        { key: 'flight/tree_top', kind: 'tree', x: 400, y: 1280 },
        { key: 'flight/tree_top', kind: 'tree', x: 690, y: 1260 },
        { key: 'flight/tree_top', kind: 'tree', x: 400, y: 1640 },
        { key: 'flight/tree_top', kind: 'tree', x: 690, y: 1650 },
        { key: 'flight/tree_top', kind: 'tree', x: 400, y: 120 },
        { key: 'flight/tree_top', kind: 'tree', x: 680, y: 130 },
        { key: 'flight/streetlight_top', kind: 'streetlight', x: 455, y: 950 },
        { key: 'flight/streetlight_top', kind: 'streetlight', x: 625, y: 950 },
        { key: 'flight/streetlight_top', kind: 'streetlight', x: 90, y: 950 },
        { key: 'flight/streetlight_top', kind: 'streetlight', x: 990, y: 950 },
        { key: 'flight/streetlight_top', kind: 'streetlight', x: 455, y: 1550 },
        { key: 'flight/streetlight_top', kind: 'streetlight', x: 625, y: 1550 },
      ],
      target: { key: 'flight/laundromat_top', kind: 'laundromat', x: 790, y: 560 },
      entries: [
        { roomId: 'laundry_skylight', route: 'Skylight', difficulty: 'short & risky', x: 760, y: 570, labelSide: 'below' },
        { roomId: 'laundry_loading', route: 'Loading door', difficulty: 'long & safe', x: 870, y: 420, labelSide: 'above' },
      ],
      vehicles: [
        {
          key: 'flight/van_top',
          kind: 'van',
          path: [
            { x: 50, y: 860 },
            { x: 1030, y: 860 },
          ],
          speed: 150,
          dwell: 1.1,
          coneRange: 290,
          coneHalf: 0.4,
          sweepAmp: 0.18,
          sweepRate: 1.4,
        },
      ],
      dogs: [],
      neons: [{ x: 445, y: 655, r: 160, text: 'EAT' }],
      powerLines: [
        { ax: 0, ay: 1010, bx: 400, by: 995 },
        { ax: 680, ay: 995, bx: 1080, by: 1010 },
        { ax: 940, ay: 455, bx: 1070, by: 330 },
        { ax: 160, ay: 475, bx: 30, by: 340 },
      ],
      lamps: [
        { x: 455, y: 950 },
        { x: 625, y: 950 },
        { x: 90, y: 950 },
        { x: 990, y: 950 },
        { x: 455, y: 1550 },
        { x: 625, y: 1550 },
      ],
    },
  },
];

export const LOCKED_CARDS: readonly LockedCard[] = [
  {
    title: 'The Gym Bro',
    requires: 'Requires: Beam Strength II',
    blurb: 'Bench-presses 140 kg. Mostly protein shake by weight.',
  },
  {
    title: "Grandma's Bingo Night",
    requires: 'Requires: Hearing Aid Jammer',
    blurb: 'Forty grandmas. One of them is armed with a dabber.',
  },
  {
    title: 'A Whole Cruise Ship',
    requires: 'Requires: A Much Bigger Saucer',
    blurb: 'Budget approved by nobody. Buffet included.',
  },
];

export function levelIndexForRoom(room: RoomId): number {
  return room.startsWith('farm') ? 0 : 1;
}

export const ROOM_IDS: readonly RoomId[] = ['farm_window', 'farm_chimney', 'laundry_skylight', 'laundry_loading'];

export function isRoomId(s: string): s is RoomId {
  return (ROOM_IDS as readonly string[]).includes(s);
}
