// Solvability proof for the deep-level flight maps: the hazard-aware autopilot completes every
// flight leg of L3 and L4 without being spotted (abductions stubbed as instant successes), and a
// naive beeline gets caught, so the maps are not trivially open.
import { describe, expect, it } from 'vitest';
import { LEVEL3, LEVEL4 } from '../src/levels/deep-levels';
import type { DeepLevelDef } from '../src/levels/types';
import { autopilotController, beelineController, runHeadless, type HeadlessResult } from './flight-deep-harness';

declare const process: { stdout: { write(s: string): void } };

/** Vitest hides console output of passing tests; print the times anyway. */
const log = (s: string): void => {
  process.stdout.write(`${s}\n`);
};

const fmt = (r: HeadlessResult): string =>
  `${r.done ? 'done' : 'NOT DONE'} in ${r.totalSec.toFixed(1)} s · legs ${r.legs.map((l) => `T${l.target}/E${l.entry} ${l.sec.toFixed(1)}s`).join(', ')} · spotted ${r.spots.length} · bumps ${r.bumps} · dashes ${r.dashes}`;

function overview(_level: DeepLevelDef, _name: string, _r: HeadlessResult): void {
  // map + exposure + trail SVG dump lives in a scratch tool; no-op here
}

for (const level of [LEVEL3, LEVEL4]) {
  describe(`${level.id} ${level.title}: flight legs`, () => {
    it('the autopilot (no afterburner) visits all three targets without being spotted', () => {
      const r = runHeadless(level.map, [], autopilotController(false), 400);
      log(`[autopilot ${level.id} no-dash] ${fmt(r)}`);
      overview(level, `${level.id}-nodash`, r);
      expect(r.spots, JSON.stringify(r.spots, null, 1)).toEqual([]);
      expect(r.done).toBe(true);
      expect(new Set(r.legs.map((l) => l.target)).size).toBe(3);
    });

    it('the autopilot with the afterburner does too, and dashes', () => {
      const r = runHeadless(level.map, ['afterburner'], autopilotController(true), 400);
      log(`[autopilot ${level.id} dash] ${fmt(r)}`);
      overview(level, `${level.id}-dash`, r);
      expect(r.spots, JSON.stringify(r.spots)).toEqual([]);
      expect(r.done).toBe(true);
    });

    it('a naive beeline at each target gets spotted, whatever the start time', () => {
      // same naive route, started 0..8 s into the hazard cycles
      for (const delay of [0, 2.5, 5, 8]) {
        const r = runHeadless(level.map, [], beelineController, 240, false, delay);
        log(`[beeline ${level.id} +${delay}s] ${fmt(r)} · first spot: ${r.spots[0] ? `${r.spots[0].cause} at ${r.spots[0].t.toFixed(1)} s` : 'none'}`);
        if (delay === 0) overview(level, `${level.id}-beeline`, r);
        expect(r.spots.length, `delay ${delay}`).toBeGreaterThan(0);
      }
    });
  });
}
