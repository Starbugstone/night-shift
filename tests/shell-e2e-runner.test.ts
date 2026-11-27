// The browser playthrough proves what it claims (v0.2 council round 2):
// - Opus F1 / Sol P2: it played rooms at the bot's glacial 1× pace, so `ONLY=L10` ended at sunrise. Rooms now go no
//   slower than the game's SLOWEST_HONEST_PACE, read from the build (`__nightShift.honestPace`), not a copy.
// - Sol P2: `ONLY=tutorial RUNS=typo` played nothing and passed, and a full run checked only the deep orders. The
//   tutorial approaches must match every registered tutorial ring, and a typo or an empty selection fails.
// - Round 3 (Sol P2): a tutorial run steered through the wrong ring (L1-window through the chimney) still passed.
//   Right after entering a room the runner checks it is the fixture's ring (tutorial) or the ring the flight
//   locked (deep), read from the scene's own `roomId`.
import { describe, expect, it } from 'vitest';
import approachesSource from '../scripts/tutorial-approaches.cjs?raw';
import runner from '../scripts/e2e-playthrough.cjs?raw';
import game from '../src/core/game.ts?raw';
import { SLOWEST_HONEST_PACE } from '../src/abduct/autopilot';
import { LEVELS } from '../src/levels/levels';
import { createAbductScene } from '../src/abduct';
import { ROOMS } from '../src/abduct/rooms';
import { DeepAbductScene } from '../src/ui/deep-abduct';
import type { GameContext, RoomId } from '../src/contracts';
import type { DeepRun } from '../src/levels/run';

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

/** Every check the runner makes that the room it entered is the ring it meant. */
function ringProblems(src: string): string[] {
  const bad: string[] = [];
  if (!/async function abduct\(room\)/.test(src)) bad.push('the tutorial abduction does not take the ring it flew to');
  if (!/await waitScene\('abduct', 20000\);\s*\n\s*const entered = await enteredRoom\(\);\s*\n\s*if \(entered !== room\) throw/.test(src)) bad.push('the tutorial abduction does not check the room right after entering it');
  if (!/ns\.scene === 'abduct' \? \(ns\.active\?\.roomId \?\? null\) : null/.test(src)) bad.push('the runner does not read the room from the scene');
  const calls = [...src.matchAll(/await abduct\(([^)]*)\)/g)].map(m => m[1]!.trim());
  if (!calls.length || calls.some(arg => !arg)) bad.push('an abduction is played without the ring it should be');
  if (!/await abduct\(r\.room\)/.test(src)) bad.push('the tutorial runs do not pass their fixture ring');
  if (!/drv\.lock = \{ target: ref\.target, entry: ref\.entry \}/.test(src)) bad.push('the deep runs do not record the ring the flight locked');
  if (!/if \(!ring\.intended \|\| ring\.entered !== ring\.intended \|\| ring\.current !== ring\.intended\) \{\s*\n\s*throw/.test(src)) bad.push('the deep runs do not check the room entered against the locked ring');
  return bad;
}

describe('every run enters the ring it meant to (round 3, Sol P2)', () => {
  it('the runner checks the room right after entering it, for tutorial and deep runs', () => {
    expect(ringProblems(runner)).toEqual([]);
  });

  it('catches a runner that skips the check (mutation check)', () => {
    const cases: [string, string][] = [
      [runner.replace('if (entered !== room) throw', 'if (false) throw'), 'the tutorial abduction does not check the room right after entering it'],
      [runner.replace('await abduct(r.room)', 'await abduct()'), 'an abduction is played without the ring it should be'],
      [runner.replace('ring.entered !== ring.intended', 'false'), 'the deep runs do not check the room entered against the locked ring'],
      [runner.replace('drv.lock = { target: ref.target, entry: ref.entry }', 'drv.lock = null'), 'the deep runs do not record the ring the flight locked'],
    ];
    for (const [mutated, problem] of cases) {
      expect(mutated).not.toBe(runner);
      expect(ringProblems(mutated)).toContain(problem);
    }
  });

  it('every room scene, bare or in a deep shift, names the room it plays', () => {
    const ctx: GameContext = {
      pointer: { down: false, pressed: false, released: false, x: 270, y: 480 },
      assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(),
      time: 0, reducedMotion: false, tutorial: false,
    } as unknown as GameContext;
    const ids = Object.keys(ROOMS) as RoomId[];
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) {
      const scene = createAbductScene(ctx, { roomId: id, levelId: 'headless' }, () => {});
      expect(scene.roomId, id).toBe(id);
      const deep = new DeepAbductScene(scene, {} as DeepRun, ctx.assets, () => false, () => {});
      expect(deep.roomId, id).toBe(id);
      scene.dispose?.();
    }
  });
});
