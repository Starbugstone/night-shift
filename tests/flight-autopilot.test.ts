// Solvability proof for the deep-level flight maps: the hazard-aware autopilot completes every
// flight leg of L3 and L4 without being spotted (abductions stubbed as instant successes), and a
// naive beeline gets caught, so the maps are not trivially open.
import { describe, expect, it } from 'vitest';
import { LEVEL3, LEVEL4 } from '../src/levels/deep-levels';
// L5 pier code
import { LEVEL5 } from '../src/levels/deep-pier';
// L6 clinic code
import { LEVEL6 } from '../src/levels/deep-clinic';
// L7 cruise code
import { LEVEL7 } from '../src/levels/deep-ship';
import type { DeepLevelDef } from '../src/levels/types';
import { autopilotController, beelineController, runHeadless, type HeadlessResult } from './flight-deep-harness';

declare const process: { stdout: { write(s: string): void } };

/** Vitest hides console output of passing tests; print the times anyway. */
const log = (s: string): void => {
  process.stdout.write(`${s}\n`);
};

const fmt = (r: HeadlessResult): string =>
  `${r.done ? 'done' : 'NOT DONE'} in ${r.totalSec.toFixed(1)} s · legs ${r.legs.map((l) => `T${l.target}/E${l.entry} ${l.sec.toFixed(1)}s`).join(', ')} · spotted ${r.spots.length} · bumps ${r.bumps}`;

function overview(_level: DeepLevelDef, _name: string, _r: HeadlessResult): void {
  // map + exposure + trail SVG dump lives in a scratch tool; no-op here
}

for (const level of [LEVEL3, LEVEL4, LEVEL5, LEVEL6, LEVEL7]) {
  describe(`${level.id} ${level.title}: flight legs`, () => {
    it('the autopilot visits all three targets without being spotted', () => {
      const r = runHeadless(level.map, [], autopilotController(), 400);
      log(`[autopilot ${level.id}] ${fmt(r)}`);
      overview(level, level.id, r);
      expect(r.spots, JSON.stringify(r.spots, null, 1)).toEqual([]);
      expect(r.done).toBe(true);
      expect(new Set(r.legs.map((l) => l.target)).size).toBe(3);
    });

    // L3 was softened after playtesting (2026-11-23): a lucky beeline may slip through, but not
    // usually. L4 still catches it at every start time. The L3 rule matches its difficulty band.
    // L5 pier code: the lighthouse catches a beeline in 3 of 4 (its band asks for 2)
  // L7: the ship's rings are guarded by timing (photographers, a lit porthole), so a lucky beeline can slip through
  const mustCatch = level.id === 'level3' || level.id === 'level7' ? 2 : level.id === 'level5' ? 3 : 4;
    it(`a naive beeline at each target gets spotted in at least ${mustCatch} of 4 start times`, () => {
      // same naive route, started 0..8 s into the hazard cycles
      let caught = 0;
      for (const delay of [0, 2.5, 5, 8]) {
        const r = runHeadless(level.map, [], beelineController, 240, false, delay);
        log(`[beeline ${level.id} +${delay}s] ${fmt(r)} · first spot: ${r.spots[0] ? `${r.spots[0].cause} at ${r.spots[0].t.toFixed(1)} s` : 'none'}`);
        if (delay === 0) overview(level, `${level.id}-beeline`, r);
        if (r.spots.length > 0) caught++;
      }
      expect(caught).toBeGreaterThanOrEqual(mustCatch);
    });
  });
}
