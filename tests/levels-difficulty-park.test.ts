// The model-stall watch (tests/difficulty/park.ts, docs/REGRESSIONS.md L21 round 6): what counts as a park.
import { describe, expect, it } from 'vitest';
import { PARK_LIMIT_SEC, PARK_R, ParkWatch } from './difficulty/park';

const DT = 1 / 60;

describe('ParkWatch', () => {
  it('times a saucer that stays put while flying, and the evaluator limit sits above the 20 s re-plan', () => {
    const w = new ParkWatch();
    for (let f = 0; f <= 40 / DT; f++) w.step({ x: 100 + (f % 2) * (PARK_R / 2), y: 100 }, true, f * DT, 1);
    expect(w.longest.seconds).toBeGreaterThan(PARK_LIMIT_SEC);
    expect(PARK_LIMIT_SEC).toBeGreaterThan(20);
  });

  it('does not count time spent moving, in a room, spotted or locking', () => {
    const w = new ParkWatch();
    let t = 0;
    for (let f = 0; f < 10 / DT; f++, t += DT) w.step({ x: f * 2, y: 0 }, true, t, 1);
    for (let f = 0; f < 60 / DT; f++, t += DT) w.step({ x: 500, y: 0 }, false, t, 1);
    expect(w.longest.seconds).toBeLessThan(1);
  });

  it('starts afresh on a new leg, which leaves from the ring the room was entered by', () => {
    const w = new ParkWatch();
    w.step({ x: 300, y: 300 }, true, 0, 1);
    w.step({ x: 300, y: 300 }, false, 1, 1);
    // the room took 40 s of shift clock; the next leg starts on the same spot
    w.step({ x: 300, y: 300 }, true, 41, 2);
    w.step({ x: 300, y: 300 }, true, 42, 2);
    expect(w.longest.seconds).toBeCloseTo(1, 5);
  });
});
