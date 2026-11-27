// Solvability proof for the deep-level flight maps: the hazard-aware autopilot completes every
// flight leg of every deep level in LEVELS without being spotted (abductions stubbed as instant
// successes), and a naive beeline gets caught, so the maps are not trivially open. Levels whose
// flight needs its own driver are named in OWN_DRIVER with the test that proves them.
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels/levels';
import type { DeepLevelDef, LevelDef } from '../src/levels/types';
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

/** Deep levels proved by their own flight driver (pickup detours, roaming targets, troop counts). */
const OWN_DRIVER: Readonly<Record<string, string>> = {
  birch_bakery: 'tests/levels-birch.test.ts',
  birch_neighbours: 'tests/levels-birch.test.ts',
  level8: 'tests/levels-monolith.test.ts',
  level11: 'tests/flight-1953.test.ts',
};

const isDeep = (level: LevelDef): level is DeepLevelDef => level.kind === 'deep';
const DEEP = LEVELS.filter(isDeep);
/** Test files in this folder (paths only, nothing is loaded). */
const TEST_FILES = new Set(Object.keys(import.meta.glob('./*.test.ts')).map((path) => `tests/${path.slice(2)}`));

describe('deep flight coverage', () => {
  it('names only real deep levels in OWN_DRIVER', () => {
    const ids = new Set<string>(DEEP.map((level) => level.id));
    expect(Object.keys(OWN_DRIVER).filter((id) => !ids.has(id))).toEqual([]);
    expect(Object.values(OWN_DRIVER).filter((file) => !TEST_FILES.has(file))).toEqual([]);
  });
});

for (const level of DEEP.filter((l) => !(l.id in OWN_DRIVER))) {
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
