import { afterEach, describe, expect, it, vi } from 'vitest';
import { ART } from '../src/art-manifest';
import type { AbductResult, FlightResult, GameContext, MapCollectibleId, Vec2 } from '../src/contracts';
import { CELL, FlightAutopilot, exposureGrid, findPath } from '../src/flight/autopilot';
import { MapCollectible } from '../src/flight/collectible';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { inLighthouseShadow, type LighthouseHazard } from '../src/flight/lighthouse';
import { FlightScene } from '../src/flight/scene';
import { LOCK, RING_R, SAUCER, type Saucer } from '../src/flight/sim';
import { setLang, tr } from '../src/i18n';
import { LEVEL3, LEVEL4 } from '../src/levels/deep-levels';
import { LEVEL5 } from '../src/levels/deep-pier';
import { LEVEL6 } from '../src/levels/deep-clinic';
import { LEVEL7 } from '../src/levels/deep-ship';
import { LEVEL8 } from '../src/levels/deep-monolith';
import { isDeep, isTutorial, LEVELS } from '../src/levels/levels';
import { applyDeepRun, applyRun } from '../src/levels/progress';
import { DeepRun } from '../src/levels/run';
import { defaultSave, loadSave, SAVE_KEY, validateSave, writeSave } from '../src/levels/save';
import type { DeepLevelDef } from '../src/levels/types';
import { deepReport, tutorialReport } from '../src/ui/report';

const DT = 1 / 60;
const tutorial = LEVELS[1]!;
if (!isTutorial(tutorial) || !tutorial.map.collectible) throw new Error('The L2 tutorial needs a map pickup');
const level = tutorial;
const flyer = tutorial.map.collectible;

const delivery: AbductResult = {
  delivered: true, woke: false, timeSec: 12, bonks: 0, dignity: 100, snores: 0, itemsStolen: [], aborted: false,
};

afterEach(() => setLang('en'));

function context(): GameContext {
  return {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false },
    assets: { get: () => undefined },
    audio: { sfx: vi.fn() },
    upgrades: new Set(),
    reducedMotion: true,
    tutorial: false,
    time: 0,
  };
}

function flyL2(detour: boolean): FlightResult {
  const ctx = context();
  const onLocked = vi.fn<(result: FlightResult) => void>();
  const flight = new FlightScene({ ctx, level, spotted: 0, onLocked, onQuit: vi.fn() });
  const route = [
    { point: { x: 540, y: 1400 }, hover: false },
    { point: { x: 540, y: 700 }, hover: false },
    ...(detour ? [{ point: flyer, hover: true }] : []),
    { point: level.map.entries[0], hover: true },
  ];
  let waypoint = 0;
  for (let frame = 0; frame < 60 * 30; frame++) {
    if (flight.state === 'spotted') throw new Error('The L2 pilot was caught');
    const aim = route[waypoint]!;
    const s = flight.saucer;
    const dx = aim.point.x - s.x;
    const dy = aim.point.y - s.y;
    const distance = Math.hypot(dx, dy);
    const lead = aim.hover ? Math.min(170, distance * 0.9) : 170;
    const damp = aim.hover ? 0.35 : 0.1;
    ctx.pointer.down = flight.state === 'fly' && (!aim.hover || distance >= 22);
    ctx.pointer.x = s.x - flight.camX + (dx / Math.max(1, distance)) * lead - s.vx * damp;
    ctx.pointer.y = s.y - flight.camY + (dy / Math.max(1, distance)) * lead - s.vy * damp;
    flight.update(DT);
    if (aim.point === flyer ? flight.collectible?.collected : !aim.hover && distance < 50) waypoint++;
    const result = onLocked.mock.calls[0]?.[0];
    if (result) {
      expect(ctx.audio.sfx).toHaveBeenCalledWith('lock_on');
      const pickupSounds = vi.mocked(ctx.audio.sfx).mock.calls.filter(([sound]) => sound === 'pickup');
      expect(pickupSounds).toHaveLength(detour ? 1 : 0);
      return result;
    }
  }
  throw new Error('The L2 pilot did not reach Larry');
}

describe('optional map collectibles', () => {
  it('the L2 pilot can detour beside Spin City for the slipper flyer, then lock onto Larry with time to spare', () => {
    expect(LEVELS[0]!.map.collectible).toBeUndefined(); // L1 has no map pickup
    const detour = flyL2(true);
    expect(detour).toMatchObject({ roomId: 'laundry_skylight', spotted: 0, mapCollectible: 'slipper_flyer' });
    const direct = flyL2(false);
    expect(direct).toMatchObject({ roomId: 'laundry_skylight', spotted: 0 });
    expect(direct.mapCollectible).toBeUndefined();
    expect(detour.timeSec).toBeGreaterThan(direct.timeSec + LOCK.time);
    expect(applyRun(defaultSave(), 'level2', delivery, detour).stars).toEqual([true, true, true]);
  });

  // HARD RULE (applies automatically to every future level added to LEVELS):
  // L1 has no map pickup; every level from L2 onward defines one unique map collectible,
  // and that level's shift memo must hint at it in both English and French.
  it('HARD RULE: every level after L1 defines one unique map collectible hinted in its EN & FR shift memo', () => {
    expect(LEVELS[0]!.map.collectible, 'L1 stays pickup-free').toBeUndefined();
    const seen = new Set<MapCollectibleId>();
    for (const lv of LEVELS.slice(1)) {
      const pickup = lv.map.collectible;
      expect(pickup, `${lv.id} must define a map collectible`).toBeDefined();
      expect(seen.has(pickup!.id), `${lv.id} reuses collectible id "${pickup!.id}"`).toBe(false);
      seen.add(pickup!.id);
    }
    for (const lang of ['en', 'fr'] as const) {
      setLang(lang);
      const strings = tr();
      for (const lv of LEVELS.slice(1)) {
        const pickup = lv.map.collectible!;
        const item = strings.mapCollectibles.items[pickup.id];
        const memo = strings.levels[lv.id];
        const text = `${memo.body} ${memo.joke}`.toLowerCase();
        expect(item.name.length, `${lang}:${lv.id}:${pickup.id} name`).toBeGreaterThan(2);
        expect(item.comment.length, `${lang}:${lv.id}:${pickup.id} comment`).toBeGreaterThan(10);
        expect(item.missedComment.length, `${lang}:${lv.id}:${pickup.id} missedComment`).toBeGreaterThan(10);
        expect(item.memoHint.length, `${lang}:${lv.id}:${pickup.id} memoHint`).toBeGreaterThan(2);
        expect(text, `${lang}:${lv.id} memo must hint at "${item.memoHint}"`).toContain(item.memoHint.toLowerCase());
      }
    }
  });

  it('loses partial progress when flying away and gives a specimen ring priority', () => {
    const pickup = new MapCollectible(flyer);
    const s: Saucer = { ...flyer, vx: 0, vy: 0, stun: 0 };
    expect(pickup.update(LOCK.time, s, LOCK.maxSpeed + 1, -1)).toBe(false);
    expect(pickup.update(LOCK.time / 2, s, 0, -1)).toBe(false);
    expect(pickup.progress).toBeCloseTo(0.5);
    const outside: Saucer = { ...s, x: s.x + 100 };
    expect(pickup.update(LOCK.time / 2, outside, 0, -1)).toBe(false);
    expect(pickup.progress).toBe(0);
    expect(pickup.update(LOCK.time, s, 0, 0)).toBe(false);
    expect(pickup.update(LOCK.time, s, 0, -1)).toBe(true);
    expect(pickup.update(LOCK.time, s, 0, -1)).toBe(false);
  });

  it('keeps a deep pickup across flight legs and leaves the sunrise clock and targets active', () => {
    const start = LEVEL3.map.start;
    const location: Vec2 = { x: start.x + 200, y: start.y };
    const deep = { ...LEVEL3, map: { ...LEVEL3.map, hazards: [], collectible: { ...flyer, ...location } } };
    const ctx = context();
    const run = new DeepRun(deep, 2);
    const onSunrise = vi.fn();
    const onLocked = vi.fn();
    const openLeg = () => new DeepFlightScene({ ctx, level: deep, run, onSunrise, onLocked, onQuit: vi.fn() });
    const first = openLeg();
    first.sim.place(location.x, location.y, 0);
    for (let i = 0; i < 61; i++) first.update(DT);
    expect(run.summary()).toMatchObject({ mapCollectible: 'slipper_flyer', delivered: 0, spotted: 0, sunrise: false });
    expect(run.elapsed).toBeCloseTo(61 * DT);
    expect(run.checkpoint).toEqual(start);
    expect(onLocked).not.toHaveBeenCalled();

    const next = openLeg();
    expect(next.sim.collectible?.collectedId).toBe(flyer.id);
    run.elapsed = run.budget - DT / 2;
    next.update(DT);
    expect(onSunrise).toHaveBeenCalledOnce();
    const outcome = applyDeepRun(defaultSave(), 'level3', run.summary());
    expect(outcome.stars).toEqual([false, false, false]);
    expect(deepReport(run, outcome).rows).toContainEqual(['Town pickup', 'Slipper flyer · collected']);
  });

  it('places every deep pickup safely off detectors, rings, trails, props and map edges', () => {
    const deepLevels: readonly DeepLevelDef[] = [LEVEL3, LEVEL4, LEVEL5, LEVEL6, LEVEL7, LEVEL8];
    const pocket = RING_R * LOCK.insideFrac;
    for (const lv of deepLevels) {
      const m = lv.map;
      const p = m.collectible!;
      const grid = exposureGrid(m);
      // Hover pocket well inside the map bounds
      expect(p.x, `${lv.id} left margin`).toBeGreaterThanOrEqual(SAUCER.radius + pocket);
      expect(p.x, `${lv.id} right margin`).toBeLessThanOrEqual(m.w - SAUCER.radius - pocket);
      expect(p.y, `${lv.id} top margin`).toBeGreaterThanOrEqual(SAUCER.radius + pocket);
      expect(p.y, `${lv.id} bottom margin`).toBeLessThanOrEqual(m.h - SAUCER.radius - pocket);
      // Zero exposure and holdable at the pickup centre
      const c = Math.floor(p.x / CELL);
      const r = Math.floor(p.y / CELL);
      const idx = c + r * grid.cols;
      expect(grid.exposure[idx], `${lv.id} exposure at pickup`).toBe(0);
      expect(grid.blocked[idx], `${lv.id} wire/edge blocked at pickup`).toBe(0);
      expect(grid.hold[idx], `${lv.id} holdable pocket at pickup`).toBe(1);
      // At least 160 px from every fixed entry ring, and clear of L8 ape trails
      for (const tg of m.targets) {
        for (const e of tg.entries) {
          expect(Math.hypot(p.x - e.x, p.y - e.y), `${lv.id} vs ${e.roomId}`).toBeGreaterThanOrEqual(160);
        }
        if (tg.troop) {
          for (const trail of tg.troop.trails) {
            expect(Math.hypot(p.x - trail.home.x, p.y - trail.home.y), `${lv.id} vs trail home`).toBeGreaterThanOrEqual(140);
            expect(Math.hypot(p.x - trail.lookout.x, p.y - trail.lookout.y), `${lv.id} vs trail lookout`).toBeGreaterThanOrEqual(140);
          }
        } else {
          // Minimap separation: >= 12 minimap px from fixed target building dots (MINI_W = 84)
          const miniDist = Math.hypot(p.x - tg.building.x, p.y - tg.building.y) * (84 / m.w);
          expect(miniDist, `${lv.id} minimap dot vs ${tg.short}`).toBeGreaterThanOrEqual(12);
        }
      }
      // Clear of solid buildings and trees
      for (const prop of [...m.props, ...m.targets.map((tg) => tg.building)]) {
        const spec = ART[prop.key];
        if (!spec) continue;
        const hw = (prop.w ?? spec.w) / 2;
        const hh = (prop.h ?? spec.h) / 2;
        const inside = Math.abs(p.x - prop.x) < hw + 18 && Math.abs(p.y - prop.y) < hh + 18;
        expect(inside, `${lv.id} overlaps prop ${prop.key} at (${prop.x},${prop.y})`).toBe(false);
      }
      // L5 crate sits inside a verifiable lighthouse shadow across its hover pocket
      if (lv.id === 'level5') {
        const light = m.hazards.find((h): h is LighthouseHazard => h.type === 'lighthouse')!;
        for (const [ox, oy] of [[0, 0], [pocket, 0], [-pocket, 0], [0, pocket], [0, -pocket]] as const) {
          expect(inLighthouseShadow(light, p.x + ox, p.y + oy), `L5 shadow at (${ox},${oy})`).toBe(true);
        }
      }
    }
  });

  it('every deep map pickup (L3–L8) is reachable by an unspotted autopilot detour and stays optional', () => {
    const deepLevels: readonly DeepLevelDef[] = [LEVEL3, LEVEL4, LEVEL5, LEVEL6, LEVEL7, LEVEL8];
    for (const lv of deepLevels) {
      const pickup = lv.map.collectible!;
      const ctx = context();
      const idx = LEVELS.indexOf(lv);
      const run = new DeepRun(lv, idx);
      const onLocked = vi.fn();
      const onSunrise = vi.fn();
      const scene = new DeepFlightScene({ ctx, level: lv, run, onLocked, onSunrise, onQuit: vi.fn() });
      // Plan a detour using a surrogate target entry right at the pickup so the real FlightAutopilot
      // navigates every hazard cleanly, then switch to the real map autopilot to confirm normal play continues.
      const detourMap: DeepLevelDef['map'] = {
        ...lv.map,
        targets: [{
          human: 'Pickup',
          short: 'Pickup',
          building: lv.map.targets[0]!.building,
          entries: [{ roomId: 'dave_roof', route: 'Pickup', difficulty: 'detour', x: pickup.x, y: pickup.y, labelSide: 'above' }],
        }],
      };
      // Confirm an A* detour path exists from start to pickup
      expect(findPath(exposureGrid(lv.map), lv.map.start, pickup), `${lv.id} path to pickup`).not.toBeNull();
      // Drive the live scene through a FlightAutopilot pointed at the pickup (injecting a synthetic ring into a shadow sim isn't needed: swap a temporary ring on a detour pilot)
      const detourSim = {
        ...scene.sim,
        map: detourMap,
        rings: [{ x: pickup.x, y: pickup.y }],
        ringRef: [{ target: 0, entry: 0 }],
        delivered: [false],
        get saucer() { return scene.sim.saucer; },
        get st() { return scene.sim.st; },
        get phase() { return scene.sim.phase; },
        get t() { return scene.sim.t; },
        get camX() { return scene.sim.camX; },
        get camY() { return scene.sim.camY; },
        get mult() { return scene.sim.mult; },
      };
      const detourPilot = new FlightAutopilot(detourSim as unknown as DeepFlightScene['sim'], [0]);
      let collectedAt = -1;
      for (let frame = 0; frame < 60 * 60; frame++) {
        if (scene.state === 'spotted') throw new Error(`${lv.id} detour pilot was spotted`);
        const intent = detourPilot.intent();
        ctx.pointer.down = intent.down;
        ctx.pointer.x = intent.x;
        ctx.pointer.y = intent.y;
        scene.update(DT);
        if (run.collectible?.collected) {
          collectedAt = frame * DT;
          break;
        }
      }
      expect(collectedAt, `${lv.id} should collect ${pickup.id}`).toBeGreaterThan(LOCK.time);
      expect(run.summary().mapCollectible).toBe(pickup.id);
      expect(run.deliveredCount, `${lv.id} pickup never delivers a target`).toBe(0);
      expect(run.specimenCount, `${lv.id} pickup never counts toward ape/specimen quota`).toBe(0);
      expect(onLocked, `${lv.id} pickup never triggers room lock`).not.toHaveBeenCalled();
      expect(vi.mocked(ctx.audio.sfx)).toHaveBeenCalledWith('pickup');
      // After collecting, the real autopilot can still lock onto a specimen cleanly without getting spotted
      let locked = false;
      for (let frame = 0; frame < 60 * 50; frame++) {
        if (scene.state === 'spotted') throw new Error(`${lv.id} post-pickup pilot was spotted`);
        const intent = scene.autopilotIntent();
        ctx.pointer.down = intent.down;
        ctx.pointer.x = intent.x;
        ctx.pointer.y = intent.y;
        scene.update(DT);
        if (onLocked.mock.calls.length > 0 || run.specimenCount > 0) {
          locked = true;
          break;
        }
      }
      expect(locked, `${lv.id} reaches a specimen after pickup`).toBe(true);
    }
  });

  it('L8 Krix coexists with roaming apes and leaves >= 25 s Night owl margin on a full detour run', () => {
    const ctx = context();
    const run = new DeepRun(LEVEL8, 7);
    const onLocked = vi.fn();
    const scene = new DeepFlightScene({ ctx, level: LEVEL8, run, onLocked, onSunrise: vi.fn(), onQuit: vi.fn() });
    const krix = LEVEL8.map.collectible!;
    const pilot = new FlightAutopilot(scene.sim, [0, 1, 2]);
    // Collect Flint's 2 apes + Reed's 2 apes via normal autopilot, then detour to Krix, then lock Echo
    const detourSim = {
      ...scene.sim,
      map: {
        ...LEVEL8.map,
        targets: [{
          human: 'Krix',
          short: 'Krix',
          building: LEVEL8.map.targets[1]!.building,
          entries: [{ roomId: 'echo_appeal', route: 'Krix', difficulty: 'detour', x: krix.x, y: krix.y, labelSide: 'above' }],
        }],
      },
      rings: [{ x: krix.x, y: krix.y }],
      ringRef: [{ target: 0, entry: 0 }],
      delivered: [false],
      get saucer() { return scene.sim.saucer; },
      get st() { return scene.sim.st; },
      get phase() { return scene.sim.phase; },
      get t() { return scene.sim.t; },
      get camX() { return scene.sim.camX; },
      get camY() { return scene.sim.camY; },
      get mult() { return scene.sim.mult; },
    };
    const krixPilot = new FlightAutopilot(detourSim as unknown as DeepFlightScene['sim'], [0]);
    for (let frame = 0; frame < 60 * 75; frame++) {
      if (scene.state === 'spotted') throw new Error('L8 detour pilot spotted');
      const wantKrix = run.delivered[0] && run.delivered[1] && !run.collectible!.collected;
      const intent = wantKrix ? krixPilot.intent() : pilot.intent();
      ctx.pointer.down = intent.down;
      ctx.pointer.x = intent.x;
      ctx.pointer.y = intent.y;
      scene.update(DT);
      if (onLocked.mock.calls.length > 0) break;
    }
    expect(run.collectible!.collected).toBe(true);
    expect(run.specimenCount).toBe(4);
    expect(onLocked).toHaveBeenCalledWith(2, 0);
    // Echo's cave takes ~21 s for a skilled player; flight + detour should leave plenty of room for >= 25 s margin
    const estimatedRemaining = LEVEL8.budgetSec - run.elapsed - 21;
    expect(estimatedRemaining, `L8 detour leaves ${estimatedRemaining.toFixed(1)}s margin`).toBeGreaterThanOrEqual(LEVEL8.parMarginSec);
  });

  it('shows collected and missed rows and Vrell lines in EN & FR for every deep level (L3–L8)', () => {
    const deepLevels: readonly DeepLevelDef[] = [LEVEL3, LEVEL4, LEVEL5, LEVEL6, LEVEL7, LEVEL8];
    for (const lang of ['en', 'fr'] as const) {
      setLang(lang);
      const words = tr().mapCollectibles;
      for (const lv of deepLevels) {
        const pickup = lv.map.collectible!;
        const item = words.items[pickup.id];
        const idx = LEVELS.indexOf(lv);
        const past = applyDeepRun(defaultSave(), lv.id, { delivered: 3, elapsedSec: 80, spotted: 0, failedAbductions: 0, sunrise: false }).save;

        const runGot = new DeepRun(lv, idx);
        runGot.delivered.fill(true);
        runGot.collectible!.collected = true;
        const outGot = applyDeepRun(past, lv.id, runGot.summary());
        const repGot = deepReport(runGot, outGot);
        expect(repGot.rows, `${lang}:${lv.id} got row`).toContainEqual([words.row, words.found.replace('{name}', item.name)]);
        expect(repGot.comment, `${lang}:${lv.id} got comment`).toBe(item.comment);

        const runMissed = new DeepRun(lv, idx);
        runMissed.delivered.fill(true);
        const outMissed = applyDeepRun(past, lv.id, runMissed.summary());
        const seededMissed = { ...outMissed, save: { ...outMissed.save, reports: 3 } };
        const repMissed = deepReport(runMissed, seededMissed);
        expect(repMissed.rows, `${lang}:${lv.id} missed row`).toContainEqual([words.row, words.missed.replace('{name}', item.name)]);
        expect(repMissed.comment, `${lang}:${lv.id} missed comment`).toBe(item.missedComment);
      }
    }
  });

  it('shows collected and missed rows and Vrell lines in both languages on repeat deliveries', () => {
    const flight: FlightResult = { roomId: 'laundry_skylight', timeSec: 14, spotted: 0 };
    const collected = { ...flight, mapCollectible: flyer.id };
    const past = applyRun(defaultSave(), 'level2', delivery, flight).save;
    const outcome = applyRun(past, 'level2', delivery, collected);
    // seed 3 (3 % 3 === 0) triggers Vrell's missed-pickup line on a missed repeat run
    const missedOutcome = { ...outcome, save: { ...outcome.save, reports: 3 } };
    for (const [lang, label, found, missed, gotQuip, missedQuip] of [
      ['en', 'Town pickup', 'Slipper flyer · collected', 'Slipper flyer · left behind', 'rubbing his nose', 'sitting on my desk'],
      ['fr', 'Trouvaille en ville', 'Avis de chausson · récupéré', 'Avis de chausson · laissé sur place', 'provocation', 'trône sur mon bureau'],
    ] as const) {
      setLang(lang);
      const report = tutorialReport(1, delivery, collected, outcome);
      expect(report.rows).toContainEqual([label, found]);
      expect(report.comment).toContain(gotQuip);

      const missedReport = tutorialReport(1, delivery, flight, missedOutcome);
      expect(missedReport.rows).toContainEqual([label, missed]);
      expect(missedReport.comment).toContain(missedQuip);

      expect(tutorialReport(0, delivery, { ...flight, roomId: 'farm_window' }, outcome).rows.map(([name]) => name))
        .not.toContain(tr().mapCollectibles.row);
    }
  });

  it('round-trips the filed pickup with the v2 key, preserves it on skipped replays, and safely drops retired seti_dish', () => {
    const storage = new Map<string, string>();
    const store = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    };
    const older = defaultSave();
    older.levels.level2.attempts = 3;
    store.setItem(SAVE_KEY, JSON.stringify(older));
    const save = loadSave(store);
    expect(save.levels.level2.mapCollectible).toBeUndefined();
    const flight: FlightResult = { roomId: 'laundry_skylight', timeSec: 14, spotted: 0 };
    const outcome = applyRun(save, 'level2', delivery, { ...flight, mapCollectible: flyer.id });
    expect(writeSave(store, outcome.save)).toBe(true);
    expect([...storage.keys()]).toEqual(['night-shift-save-v2']);
    const reloaded = loadSave(store);
    expect(reloaded.levels.level2).toMatchObject({ attempts: 4, mapCollectible: flyer.id });
    expect(applyRun(reloaded, 'level2', delivery, flight).save.levels.level2.mapCollectible).toBe(flyer.id);
    expect(validateSave({ levels: { level2: { mapCollectible: 'seti_dish' } } }).levels.level2.mapCollectible).toBeUndefined();
    expect(validateSave({ levels: { level2: { mapCollectible: '__proto__' } } }).levels.level2.mapCollectible).toBeUndefined();
    // Every deep level's collectible id round-trips and stays recorded on skipped replays
    let cur = reloaded;
    for (const lv of LEVELS) {
      if (!isDeep(lv) || !lv.map.collectible) continue;
      const id = lv.map.collectible.id;
      const got = applyDeepRun(cur, lv.id, { delivered: 3, elapsedSec: 90, spotted: 0, failedAbductions: 0, sunrise: false, mapCollectible: id });
      expect(writeSave(store, got.save)).toBe(true);
      const back = loadSave(store);
      expect(back.levels[lv.id].mapCollectible, lv.id).toBe(id);
      const skipped = applyDeepRun(back, lv.id, { delivered: 3, elapsedSec: 90, spotted: 0, failedAbductions: 0, sunrise: false });
      expect(skipped.save.levels[lv.id].mapCollectible, `${lv.id} kept after skip`).toBe(id);
      cur = skipped.save;
    }
  });
});
