import { workOrderNumber } from '../src/levels/levels';
import { describe, expect, it, vi } from 'vitest';
import type { AbductResult, GameContext, PointerState } from '../src/contracts';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { DeepFlightSim } from '../src/flight/deep-sim';
import { type Saucer } from '../src/flight/sim';
import { TIME_CAR, TimeCar } from '../src/flight/time-car';
import { LEVEL9 } from '../src/levels/deep-1955';
import { applyDeepRun, computeDeepStars, isLevelUnlocked } from '../src/levels/progress';
import { DeepRun } from '../src/levels/run';
import { defaultSave, validateSave } from '../src/levels/save';
import { deepReport } from '../src/ui/report';
import { buildTownShelfState, townCatalog } from '../src/ui/trophy-data';
import { playAbduction, PROFILES } from './difficulty/human';
import { evaluateCarFirst } from './difficulty/stars';

const DT = 1 / 60;
const CLOSED: PointerState = { x: 270, y: 480, down: false, pressed: false, released: false };
const CLEAR: AbductResult = { delivered: true, aborted: false, woke: false, bonks: 0, timeSec: 24, snores: 0, dignity: 100, itemsStolen: [] };
const match = (car: TimeCar): Saucer => ({ ...car.position, vx: car.speed, vy: 0, stun: 0 });

function flightAt(elapsed: number, audio: GameContext['audio']): DeepFlightScene {
  const run = new DeepRun(LEVEL9, workOrderNumber(LEVEL9.id) - 1);
  run.tick(elapsed);
  const ctx: GameContext = {
    pointer: { ...CLOSED }, assets: { get: () => undefined }, audio, upgrades: new Set(),
    reducedMotion: true, tutorial: false, time: 0,
  };
  return new DeepFlightScene({ ctx, level: LEVEL9, run, onLocked: vi.fn(), onSunrise: vi.fn(), onQuit: vi.fn() });
}

describe('1955 time car', () => {
  it('rolls at 13 s, opens at 15 s and arrives at the cable at 20 s', () => {
    const car = new TimeCar(TIME_CAR.bay);
    car.advance(12.99);
    expect(car).toMatchObject({ phase: 'parked', position: { x: 170, y: 755 }, speed: 0 });
    car.advance(13);
    expect(car).toMatchObject({ phase: 'rolling', position: { x: 170, y: 755 }, speed: 70 });
    car.advance(14);
    expect(car).toMatchObject({ phase: 'rolling', position: { x: 240, y: 755 }, speed: 70 });
    car.advance(15);
    expect(car).toMatchObject({ phase: 'open', position: { x: 310, y: 755 }, speed: 70 });
    car.advance(17);
    expect(car.position.x).toBeCloseTo(458.32);
    expect(car.speed).toBeCloseTo(86.64);
    car.advance(20);
    expect(car).toMatchObject({ phase: 'missed', position: { x: 985, y: 755 }, speed: 330, visible: false });
    expect(car.position.x - TIME_CAR.hookOffset).toBe(TIME_CAR.cable.x);
    car.advance(60);
    expect(car.phase).toBe('missed');
  });

  it('uses 64 px and relative speed in both axes, drains at 2× and yields to specimen rings and stun', () => {
    const car = new TimeCar(TIME_CAR.bay);
    car.advance(16);
    const s = match(car);
    expect(car.update(0.15, { ...s, x: s.x + 64.01 }, -1)).toBe(false);
    expect(car.progress).toBe(0);
    const diagonal = TIME_CAR.relativeSpeed * 0.75;
    expect(car.update(0.15, { ...s, vx: s.vx + diagonal, vy: diagonal }, -1)).toBe(false);
    expect(car.matchPrompt).toBe(true);
    expect(car.progress).toBe(0);
    car.update(0.4, { ...s, x: s.x + 64, vy: TIME_CAR.relativeSpeed }, -1);
    expect(car.progress).toBeCloseTo(0.4 / TIME_CAR.hold);
    car.update(0.1, { ...s, stun: 0.1 }, -1);
    expect(car.progress).toBeCloseTo(0.2 / TIME_CAR.hold);
    car.update(0.1, s, 0);
    expect(car.progress).toBe(0);
    expect(car.update(TIME_CAR.hold, s, -1)).toBe(true);
    expect(car.phase).toBe('caught');
    car.advance(20);
    expect(car.phase).toBe('caught');
    expect(car.elapsed).toBe(20);
  });

  it('credits only open time and resolves the exact deadline ahead of the lock', () => {
    const car = new TimeCar(TIME_CAR.bay);
    car.advance(15.05);
    car.update(0.2, match(car), -1);
    expect(car.progress).toBeCloseTo(0.05 / TIME_CAR.hold);
    car.advance(19.98);
    car.update(TIME_CAR.hold - 0.06, match(car), -1);
    expect(car.progress).toBeGreaterThan(0.98);
    car.advance(20);
    expect(car.update(0.02, match(car), -1)).toBe(false);
    expect(car).toMatchObject({ phase: 'missed', progress: 0 });
  });

  it('interrupts a partial lock when a detector fills the fuse on the same frame', () => {
    const map = { ...LEVEL9.map, hazards: [{
      type: 'camera' as const, x: 380, y: 600, range: 300, half: 0.5,
      base: Math.PI / 2, amp: 0, rate: 0, phase: 0,
    }] };
    const sim = new DeepFlightSim(map, new Set(), 16);
    const pickup = sim.collectible!;
    const car = pickup.timeCar!;
    const s = match(car);
    sim.place(s.x, s.y, 0);
    Object.assign(sim.saucer, s);
    pickup.update(TIME_CAR.hold - DT / 2, sim.saucer, car.speed, -1);
    sim.st.sus = 0.998;
    sim.update(DT, CLOSED);
    expect(sim.phase).toBe('spotted');
    expect(sim.justCollected).toBe(false);
    expect(pickup.progress).toBe(0);
    expect(car.phase).toBe('open');
  });

  it('resolves the strike while inside a room and keeps the missed aftermath on return', () => {
    const run = new DeepRun(LEVEL9, workOrderNumber(LEVEL9.id) - 1);
    expect(run.clockText()).toBe('10:03:40');
    run.tick(18);
    expect(run.startAbduct(2, 0)).toBe('band_canopy');
    run.tick(2);
    expect(run.collectible?.timeCar?.phase).toBe('missed');
    expect(run.clockText()).toBe('10:04:00');
    expect(run.clockText('fr')).toBe('22:04:00');
    run.finishAbduct(CLEAR);
    const returning = new DeepFlightSim(run.level.map, new Set(), run.elapsed, run.troops, run.collectible);
    returning.place(run.spawn.x, run.spawn.y);
    expect(returning.collectible?.timeCar?.phase).toBe('missed');
    expect(returning.collectible?.available).toBe(false);
    expect(run.summary()).not.toHaveProperty('mapCollectible');
    run.tick(360);
    expect(run.clockText()).toBe('10:10:00');
    expect(run.dawn).toBe(0);
    const report = deepReport(run, applyDeepRun(defaultSave(), 'level9', run.summary()));
    expect(report.stamp).toBe('storm');
    expect(report.comment).toMatch(/storm/i);
    expect(report.rows.flat().join(' ')).not.toMatch(/sunrise|dawn/i);
    expect(new DeepRun(LEVEL9, workOrderNumber(LEVEL9.id) - 1).collectible?.timeCar?.phase).toBe('parked');
  });

  it('keeps a late catch line visible through the strike with no babble', () => {
    const audio = { speak: vi.fn(), sfx: vi.fn() };
    const scene = flightAt(18.9, audio);
    audio.speak.mockClear();
    const { sim } = scene;
    const car = sim.collectible!.timeCar!;
    sim.place(car.position.x - 40, car.position.y, 2);
    for (let frame = 0; frame < 52 && car.phase !== 'caught'; frame++) {
      Object.assign(sim.saucer, match(car), { x: car.position.x - 40 });
      scene.update(DT);
    }
    expect(car.phase).toBe('caught');
    expect(car.elapsed).toBeGreaterThan(19.5);
    const line = scene.zibText;
    expect(line).toMatch(/Impounded at 87 mph/);
    sim.saucer.vx = 0;
    for (let frame = 0; frame < 34; frame++) scene.update(DT);
    expect(car.elapsed).toBeGreaterThan(TIME_CAR.strike);
    expect(scene.zibText).toBe(line);
    expect(scene.zibT).toBeGreaterThan(0);
    expect(audio.sfx).toHaveBeenCalledWith('crash', 0.36);
    expect(audio.speak).not.toHaveBeenCalled();
  });

  it.each([0.35, DT])('skips strike audio when a sighting is imminent %s seconds before the deadline', (lead) => {
    const audio = { sfx: vi.fn() };
    const scene = flightAt(TIME_CAR.strike - lead, audio);
    scene.sim.place(820, 870, 0);
    scene.sim.st.sus = 0.999;
    for (let frame = 0; frame < 48; frame++) scene.update(DT);
    expect(scene.state).toBe('spotted');
    expect(scene.run.elapsed).toBeGreaterThan(TIME_CAR.strike);
    expect(audio.sfx).toHaveBeenCalledWith('spotted');
    expect(audio.sfx).not.toHaveBeenCalledWith('stamp', 1.1);
    expect(audio.sfx).not.toHaveBeenCalledWith('crash', 0.36);
  });

  it('keeps an impound across a respawn and files it even if the pass expires', () => {
    const run = new DeepRun(LEVEL9, workOrderNumber(LEVEL9.id) - 1);
    run.tick(16);
    const pickup = run.collectible!;
    const car = pickup.timeCar!;
    expect(pickup.update(TIME_CAR.hold, match(car), car.speed, -1)).toBe(true);
    expect(run.onSpotted()).toEqual(LEVEL9.map.start);
    const sim = new DeepFlightSim(run.level.map, new Set(), run.elapsed, run.troops, run.collectible);
    sim.place(run.spawn.x, run.spawn.y);
    run.tick(364);
    expect(car.phase).toBe('caught');
    const outcome = applyDeepRun(defaultSave(), 'level9', run.summary());
    expect(outcome.stars).toEqual([false, false, false, false]);
    expect(townCatalog().find(slot => slot.id === 'time_car')).toMatchObject({ id: 'time_car', levelId: 'level9' });
    const restored = validateSave(JSON.parse(JSON.stringify(outcome.save)));
    expect(buildTownShelfState(restored).slots.find(({ slot }) => slot.id === 'time_car')).toMatchObject({ found: true, slot: { id: 'time_car' } });
    const laterMiss = applyDeepRun(restored, 'level9', new DeepRun(LEVEL9, workOrderNumber(LEVEL9.id) - 1).summary());
    expect(laterMiss.save.levels.level9.mapCollectible).toBe('time_car');
  });

  it('unlocks after any L8 clear and uses 10:05:45 as the exact Night owl par', () => {
    const legacy = validateSave({ version: 1, reports: 1 });
    expect(isLevelUnlocked(legacy, workOrderNumber('level7') - 1)).toBe(true);
    expect(isLevelUnlocked(legacy, workOrderNumber('level9') - 1)).toBe(false);
    const old = validateSave({ version: 2, levels: { level8: { stars: [true, false, false, false] } } });
    expect(old.levels.level9).toEqual(defaultSave().levels.level9);
    expect(isLevelUnlocked(old, workOrderNumber('level9') - 1)).toBe(true);
    const run = new DeepRun(LEVEL9, workOrderNumber(LEVEL9.id) - 1);
    run.tick(125);
    expect(run.clockText()).toBe('10:05:45');
    const summary = { delivered: 3, spotted: 0, failedAbductions: 0, sunrise: false, mapCollectible: 'time_car' as const };
    expect(computeDeepStars(LEVEL9.budgetSec, LEVEL9.parMarginSec, { ...summary, elapsedSec: 125 }, 'level9')).toEqual([true, true, true, true]);
    expect(computeDeepStars(LEVEL9.budgetSec, LEVEL9.parMarginSec, { ...summary, elapsedSec: 125.01 }, 'level9')).toEqual([true, true, false, true]);
  });

  it('a clean pilot at skilled drag speed impounds the car and earns all four stars', () => {
    const result = evaluateCarFirst(LEVEL9, { ...PROFILES.bot, pace: PROFILES.skilled.pace }, 1, playAbduction);
    expect(result, JSON.stringify(result.runs[0])).toMatchObject({ catches: 1, delivered: 1, allFour: 1 });
  }, 20_000);
});
