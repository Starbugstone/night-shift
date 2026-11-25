import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AbductResult, FlightResult, GameContext, Vec2 } from '../src/contracts';
import { MapCollectible } from '../src/flight/collectible';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { FlightScene } from '../src/flight/scene';
import { LOCK, type Saucer } from '../src/flight/sim';
import { setLang, tr } from '../src/i18n';
import { LEVEL3 } from '../src/levels/deep-levels';
import { isTutorial, LEVELS } from '../src/levels/levels';
import { applyDeepRun, applyRun } from '../src/levels/progress';
import { DeepRun } from '../src/levels/run';
import { defaultSave, loadSave, SAVE_KEY, validateSave, writeSave } from '../src/levels/save';
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
    expect(LEVELS.filter((l) => l.map.collectible).map((l) => l.id)).toEqual(['level2']);
    const detour = flyL2(true);
    expect(detour).toMatchObject({ roomId: 'laundry_skylight', spotted: 0, mapCollectible: 'slipper_flyer' });
    const direct = flyL2(false);
    expect(direct).toMatchObject({ roomId: 'laundry_skylight', spotted: 0 });
    expect(direct.mapCollectible).toBeUndefined();
    expect(detour.timeSec).toBeGreaterThan(direct.timeSec + LOCK.time);
    expect(applyRun(defaultSave(), 'level2', delivery, detour).stars).toEqual([true, true, true]);
  });

  it('every map collectible defined in a level is hinted in that level’s shift memo (EN and FR)', () => {
    for (const lang of ['en', 'fr'] as const) {
      setLang(lang);
      const strings = tr();
      for (const lv of LEVELS) {
        const pickup = lv.map.collectible;
        if (!pickup) continue; // skip levels without a collectible (e.g. L1)
        const item = strings.mapCollectibles.items[pickup.id];
        const memo = strings.levels[lv.id];
        const text = `${memo.body} ${memo.joke}`.toLowerCase();
        expect(item.memoHint.length, `${lang}:${lv.id}:${pickup.id}`).toBeGreaterThan(2);
        expect(text, `${lang}:${lv.id} memo should mention "${item.memoHint}"`).toContain(item.memoHint.toLowerCase());
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
  });
});
