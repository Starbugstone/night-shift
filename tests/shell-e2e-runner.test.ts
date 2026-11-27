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
import deliverySource from '../scripts/e2e-delivery.cjs?raw';
import game from '../src/core/game.ts?raw';
import { SLOWEST_HONEST_PACE } from '../src/abduct/autopilot';
import { LEVELS } from '../src/levels/levels';
import { createAbductScene } from '../src/abduct';
import { ROOMS } from '../src/abduct/rooms';
import { DeepAbductScene } from '../src/ui/deep-abduct';
import type { GameContext, RoomId } from '../src/contracts';
import type { DeepRun } from '../src/levels/run';
import type { ReportModel } from '../src/ui/report';

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

// v0.2 council round 5 (Sol P2, docs/REGRESSIONS.md P6): replacing expectDelivered's body with `return end.progress`
// kept every test above green, so a failed shift could pass the browser run again. The checks now live in
// scripts/e2e-delivery.cjs, and this suite runs both that module and the runner's own expectDelivered (cut out of
// the script and evaluated with a fake page) against rejected reports, failed or missing deliveries and failed reloads,
// for every level in LEVELS.
type Progress = { reports: number; level: Record<string, unknown> };
type End = { scene: string; report: { stamp: string; delivered: boolean; stars: boolean[] } | null; progress: Progress | null };
type Delivery = {
  deliveryProblems(before: Progress, end: End, extra?: string[]): string[];
  reloadProblems(after: Progress, reloaded: unknown): string[];
};

function loadDelivery(src: string): Delivery {
  const module = { exports: {} as Delivery };
  new Function('module', src)(module);
  return module.exports;
}

/** Every report stamp but 'delivered': a new stamp fails the typecheck until it is listed here. */
const FAILED_STAMPS: Record<Exclude<ReportModel['stamp'], 'delivered'>, true> = { failed: true, sunrise: true, storm: true, demolition: true };

interface DeliveryCase { name: string; before: Progress; end: End; extra: string[]; reloaded: unknown; pass: boolean }

function deliveryCases(): DeliveryCase[] {
  const out: DeliveryCase[] = [];
  LEVELS.forEach((level, i) => {
    const before: Progress = { reports: 3 + i, level: { stars: [false, false, false, false], delivered: false, bestTimeSec: null, attempts: i } };
    const after: Progress = { reports: 4 + i, level: { stars: [true, false, true, false], delivered: true, bestTimeSec: 60 + i, attempts: i + 1 } };
    const report = { stamp: 'delivered', delivered: true, stars: [true, false, true, false] };
    const good: End = { scene: 'report', report, progress: after };
    // by default the reload reads back exactly what the shift ended with, so only the named check can catch it
    const add = (name: string, end: End, pass = false, reloaded: unknown = end.progress, extra: string[] = []) =>
      out.push({ name: `${level.id}: ${name}`, before, end, extra, reloaded, pass });
    add('a fresh delivery that persisted', good, true);
    for (const scene of ['flight', 'abduct', 'title', 'workorders']) add(`ended on ${scene}`, { ...good, scene });
    add('no report model', { ...good, report: null });
    for (const stamp of Object.keys(FAILED_STAMPS)) {
      add(`a ${stamp} report`, { ...good, report: { stamp, delivered: false, stars: [false, false, false, false] } });
      add(`a ${stamp} stamp on an otherwise delivered report`, { ...good, report: { ...report, stamp } });
    }
    add('a report not delivered', { ...good, report: { ...report, delivered: false } });
    add('a report without the Delivered star', { ...good, report: { ...report, stars: [false, true, true, false] } });
    add('no new report filed', { ...good, progress: { ...after, reports: before.reports } });
    add('two reports filed', { ...good, progress: { ...after, reports: before.reports + 2 } });
    add('no new attempt', { ...good, progress: { ...after, level: { ...after.level, attempts: i } } });
    add('the level not delivered', { ...good, progress: { ...after, level: { ...after.level, delivered: false } } });
    add('no best time', { ...good, progress: { ...after, level: { ...after.level, bestTimeSec: null } } });
    add('no saved progress', { ...good, progress: null });
    add('a problem of the run itself', good, false, after, ['FORCE_SPOT: no SPOTTED card was tapped']);
    add('a reload back to before', good, false, before);
    add('a reload that lost the delivery', good, false, { ...after, level: { ...after.level, delivered: false } });
    add('a reload that lost the report', good, false, { ...after, reports: before.reports });
    add('a reload with no save', good, false, null);
  });
  return out;
}

/** The runner's own expectDelivered, cut out of the script and bound to a fake page. */
function runnerExpectDelivered(src: string, delivery: Delivery, page: { reloads: number; reloaded: unknown }) {
  const start = src.indexOf('async function expectDelivered(');
  if (start < 0) return null;
  let depth = 0;
  let end = src.indexOf('{', start);
  for (; end < src.length; end++) {
    if (src[end] === '{') depth++;
    else if (src[end] === '}' && --depth === 0) break;
  }
  const body = src.slice(start, end + 1);
  const make = new Function('deliveryProblems', 'reloadProblems', 'openFixture', 'progressOf', `${body}\nreturn expectDelivered;`);
  return make(delivery.deliveryProblems, delivery.reloadProblems, async () => { page.reloads++; }, async () => page.reloaded) as
    (id: string, before: Progress, end: End, extra?: string[]) => Promise<Progress>;
}

/** Every case the module or the runner gets wrong. */
async function deliveryMisses(runnerSrc: string, deliverySrc: string): Promise<string[]> {
  const delivery = loadDelivery(deliverySrc);
  const misses: string[] = [];
  for (const c of deliveryCases()) {
    const problems = [...delivery.deliveryProblems(c.before, c.end, c.extra), ...(c.end.progress ? delivery.reloadProblems(c.end.progress, c.reloaded) : [])];
    if (c.pass !== (problems.length === 0)) misses.push(`module: ${c.name} -> ${problems.join('; ') || 'accepted'}`);
    const page = { reloads: 0, reloaded: c.reloaded };
    const expectDelivered = runnerExpectDelivered(runnerSrc, delivery, page);
    if (!expectDelivered) return ['the runner has no expectDelivered'];
    const id = c.name.slice(0, c.name.indexOf(':'));
    try {
      const result = await expectDelivered(id, c.before, c.end, c.extra);
      if (!c.pass) misses.push(`runner accepted ${c.name}`);
      else if (JSON.stringify(result) !== JSON.stringify(c.end.progress) || page.reloads !== 1) misses.push(`runner: ${c.name} returned ${JSON.stringify(result)} after ${page.reloads} reloads`);
    } catch (e) {
      if (c.pass) misses.push(`runner rejected ${c.name}: ${String(e)}`);
      else if (!String(e).includes(`${id}: `)) misses.push(`runner: ${c.name} failed without naming the level: ${String(e)}`);
    }
  }
  return misses;
}

describe('a shift passes only on a fresh, persisted delivery (round 5, Sol P2)', () => {
  it('covers every level in LEVELS with rejected reports, failed deliveries and failed reloads', () => {
    const cases = deliveryCases();
    for (const level of LEVELS) {
      const mine = cases.filter(c => c.name.startsWith(`${level.id}: `));
      expect(mine.filter(c => c.pass).length, level.id).toBe(1);
      expect(mine.filter(c => !c.pass).length, level.id).toBeGreaterThanOrEqual(20);
    }
    expect(runner).toMatch(/require\('\.\/e2e-delivery\.cjs'\)/);
  });

  it('the checks and the runner accept only the fresh delivery that persisted', async () => {
    expect(await deliveryMisses(runner, deliverySource)).toEqual([]);
  });

  it('catches a runner or a check that lets a failed shift through (mutation check)', async () => {
    const body = runner.slice(runner.indexOf('async function expectDelivered('));
    const bodyEnd = body.indexOf('\n  }\n') + 4;
    const mutations: [string, string, string][] = [
      ['runner', 'expectDelivered returns the progress unchecked', runner.replace(body.slice(0, bodyEnd), 'async function expectDelivered(id, before, end) {\n    return end.progress;\n  }\n')],
      ['runner', 'no reload', runner.replace('problems.push(...reloadProblems(end.progress, await progressOf(id)));', '')],
      ['runner', 'problems never thrown', runner.replace('if (problems.length) throw', 'if (false) throw')],
      ['runner', 'the run\'s own problems dropped', runner.replace('deliveryProblems(before, end, extra)', 'deliveryProblems(before, end)')],
      ['delivery', 'any stamp passes', deliverySource.replace("report.stamp !== 'delivered' || ", '')],
      ['delivery', 'the Delivered star is not read', deliverySource.replace(" || !Array.isArray(report.stars) || report.stars[0] !== true", '')],
      ['delivery', 'reports are not counted', deliverySource.replace('after.reports !== before.reports + 1', 'false')],
      ['delivery', 'attempts are not counted', deliverySource.replace('after.level.attempts !== before.level.attempts + 1', 'false')],
      ['delivery', 'the best time is not read', deliverySource.replace(' || after.level.bestTimeSec === null || after.level.bestTimeSec === undefined', '')],
      ['delivery', 'the reload is not compared', deliverySource.replace("return ['save changed on reload: ' + JSON.stringify({ after, reloaded })];", 'return [];')],
    ];
    for (const [file, name, mutated] of mutations) {
      expect(mutated, name).not.toBe(file === 'runner' ? runner : deliverySource);
      const misses = await deliveryMisses(file === 'runner' ? mutated : runner, file === 'delivery' ? mutated : deliverySource);
      expect(misses.length, name).toBeGreaterThan(0);
    }
  });
});
