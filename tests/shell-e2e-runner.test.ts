// The browser playthrough proves what it claims (v0.2 council round 2):
// - Opus F1 / Sol P2: it played rooms at the bot's glacial 1× pace, so `ONLY=L10` ended at sunrise. Rooms now go no
//   slower than the game's SLOWEST_HONEST_PACE, read from the build (`__nightShift.honestPace`), not a copy.
// - Sol P2: `ONLY=tutorial RUNS=typo` played nothing and passed, and a full run checked only the deep orders. The
//   tutorial approaches must match every registered tutorial ring, and a typo or an empty selection fails.
import { describe, expect, it } from 'vitest';
import approachesSource from '../scripts/tutorial-approaches.cjs?raw';
import runner from '../scripts/e2e-playthrough.cjs?raw';
import game from '../src/core/game.ts?raw';
import { SLOWEST_HONEST_PACE } from '../src/abduct/autopilot';
import { LEVELS } from '../src/levels/levels';

interface Approach { room: string; level: number; ring: number; name: string }

function approaches(): Approach[] {
  const module = { exports: [] as Approach[] };
  new Function('module', approachesSource)(module);
  return module.exports;
}

describe('the e2e runner plays at an honest pace', () => {
  it('the game exposes SLOWEST_HONEST_PACE to bots, and it is the 1.5 the clocks are proved against', () => {
    expect(SLOWEST_HONEST_PACE).toBe(1.5);
    expect(game).toMatch(/honestPace: SLOWEST_HONEST_PACE/);
  });

  it('the runner sets every room pilot from the build, never below it', () => {
    expect(runner).toMatch(/a\.debug\.pilot\.pace = Math\.max\(ns\.honestPace,/);
    expect(runner).toMatch(/window\.__nightShift\.honestPace/);
    // no fixed pace of its own below the honest one
    for (const m of runner.matchAll(/pilot\.pace\s*=\s*([0-9.]+)/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(SLOWEST_HONEST_PACE);
  });
});

describe('the tutorial approaches match the registered tutorial rings', () => {
  const runs = approaches();
  it('every tutorial ring in LEVELS has exactly one approach, and every approach names one', () => {
    const want = LEVELS.flatMap((level, i) => level.kind === 'tutorial'
      ? level.map.entries.map((e, ring) => `${i + 1}/${ring}/${e.roomId}`) : []);
    expect(want.length).toBeGreaterThan(0);
    expect(runs.map(r => `${r.level}/${r.ring}/${r.room}`).sort()).toEqual(want.sort());
    expect(new Set(runs.map(r => r.name)).size).toBe(runs.length);
  });

  it('the runner checks its fixtures, rejects typos and empty selections, and a full run plays every ring', () => {
    expect(runner).toMatch(/tutorial approaches out of date/);
    expect(runner).toMatch(/RUNS names no tutorial route/);
    expect(runner).toMatch(/the selection plays nothing/);
    expect(runner).toMatch(/if \(playTutorial && !ONLY_RUNS\) for \(const r of runs\) if \(!results\[r\.name\] && !failures\[r\.name\]\) failures\[r\.name\] = 'not played'/);
  });
});
