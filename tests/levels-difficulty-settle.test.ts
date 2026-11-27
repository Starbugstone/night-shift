// Settle exits (the Grail's time window, `exitSettleSec`) take a still passenger, and the room tells the
// player to let go in the opening. The human-model hand used to keep the thumb down at the exit, and its
// tremor and drift moved the beam about 70 px/s, so on unlucky seeds the chest never stayed under the
// settle speed: casual seed 5 sat in the exit zone for 180 s in five Grail rooms (v0.2, 2026-11-27).
// Rule: walks every room in ROOMS with a settle exit, both human profiles and every release seed. Each
// run reaches an outcome before the 180 s room limit (a delivery or a real failure, never a timeout).
import { describe, expect, it } from 'vitest';
import type { RoomId } from '../src/contracts';
import { ROOMS } from '../src/abduct/rooms';
import { PROFILES, playAbduction } from './difficulty/human';

const SEEDS = 20;
const settleRooms = (Object.keys(ROOMS) as RoomId[]).filter(id => ROOMS[id].exitSettleSec);

describe('the human model lets the passenger settle at a settle exit', () => {
  it('finds the settle-exit rooms', () => {
    expect(settleRooms.length).toBeGreaterThan(0);
  });

  for (const id of settleRooms) {
    it(`${id}: no run waits out the room limit in the exit`, () => {
      const stuck: string[] = [];
      for (const profile of [PROFILES.skilled, PROFILES.casual]) {
        for (let seed = 1; seed <= SEEDS; seed++) {
          const run = playAbduction(id, profile, seed);
          if (run.failReason === 'timeout') stuck.push(`${profile.name} seed ${seed} at checkpoint ${run.stall.checkpoint}`);
        }
      }
      expect(stuck).toEqual([]);
    }, 120_000);
  }
});
