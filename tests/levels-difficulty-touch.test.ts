// The human-model players drive the beam through the live touch path (src/abduct/index.ts pointing),
// so no frame moves the beam faster than the touch speed cap, POINT.max (v0.2 council, Sol P2: the
// model used to write world coordinates straight into the beam and beat the cap on 104 of 1,294
// moves in Artie's garden). Walks every room in ROOMS and the Field Check room, both human profiles.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RoomId } from '../src/contracts';
import { POINT } from '../src/abduct/point';
import { ROOMS } from '../src/abduct/rooms';
import { AbductSimulation } from '../src/abduct/simulation';
import { FIELD_CHECK_ROOM, FIELD_CHECK_RULES } from '../src/levels/field-check';
import { HARD_RULES, PROFILES, playAbduction } from './difficulty/human';

const FRAME = 1 / 60;
const LIMIT = POINT.max * FRAME + 1e-9;

let fastest = 0;
let over = 0;
const original = AbductSimulation.prototype.moveBeam;

beforeAll(() => {
  AbductSimulation.prototype.moveBeam = function (this: AbductSimulation, x: number, y: number) {
    const step = Math.hypot(x - this.body.beamX, y - this.body.beamY);
    fastest = Math.max(fastest, step);
    if (step > LIMIT) over++;
    original.call(this, x, y);
  };
});
afterAll(() => {
  AbductSimulation.prototype.moveBeam = original;
});

describe('route plans stay inside the touch speed cap', () => {
  it('no room checkpoint asks for a drag faster than POINT.max', () => {
    const fast: string[] = [];
    for (const [id, room] of [...Object.entries(ROOMS), ['field_check', FIELD_CHECK_ROOM] as const]) {
      for (const point of room.interior?.checkpoints ?? []) {
        if ((point.speed ?? 0) > POINT.max) fast.push(`${id} (${point.x}, ${point.y}) at ${point.speed} px/s`);
      }
    }
    expect(fast).toEqual([]);
  });
});

describe('difficulty model respects the touch speed cap', () => {
  const rooms = [...(Object.keys(ROOMS) as RoomId[]).map(id => ({ id: id as string, room: ROOMS[id], rules: HARD_RULES })),
    { id: 'field_check', room: FIELD_CHECK_ROOM, rules: FIELD_CHECK_RULES }];
  for (const { id, room, rules } of rooms) {
    it(`${id}: no beam move beats ${POINT.max} px/s`, () => {
      fastest = 0;
      over = 0;
      for (const profile of [PROFILES.skilled, PROFILES.casual]) playAbduction(room, profile, 1, rules);
      expect(over, `${id}: ${over} moves over the cap, fastest ${(fastest / FRAME).toFixed(0)} px/s`).toBe(0);
    }, 60_000);
  }
});
