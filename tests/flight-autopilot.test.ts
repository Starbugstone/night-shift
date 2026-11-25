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
import { autopilotController, runHeadless, type HeadlessResult } from './flight-deep-harness';
import { BEELINE_DELAYS, beelineFlight } from './difficulty/beeline';

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

    it('stops a naive beeline at each of the four start times', () => {
      expect(beelineFlight(level)).toBe(BEELINE_DELAYS.length);
    });
  });
}
