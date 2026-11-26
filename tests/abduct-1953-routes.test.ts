import { describe, expect, it } from 'vitest';
import { ROOMS_1953 } from '../src/abduct/rooms/deep-1953';
import { PROFILES, playAbduction } from './difficulty/human';
import { BEELINE_DELAYS, naiveRoomWins } from './difficulty/beeline';

for (const id of Object.keys(ROOMS_1953) as (keyof typeof ROOMS_1953)[]) {
  describe(id, () => {
    it('delivers without waking at several hazard phases', () => {
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        const r = playAbduction(id, PROFILES.bot, seed);
        expect(r.delivered, `${id} seed ${seed}: ${r.failReason}, ${r.failBy}, peak wake ${r.peakWake}`).toBe(true);
      }
    }, 30_000);

    it(`blocks a straight pull at all ${BEELINE_DELAYS.length} phases`, () => {
      expect(naiveRoomWins(id, true)).toBe(0);
    }, 20_000);
  });
}
