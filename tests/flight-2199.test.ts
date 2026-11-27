import { describe, expect, it } from 'vitest';
import { LEVEL12 } from '../src/levels/deep-2199';
import { DeepFlightSim, SAFE_WINDOW } from '../src/flight/deep-sim';
import type { Vec2 } from '../src/contracts';
import { BEELINE_DELAYS } from './difficulty/beeline';
import { DeepRun } from '../src/levels/run';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { defaultSave, validateSave } from '../src/levels/save';
import { applyDeepRun, isLevelUnlocked } from '../src/levels/progress';
import { LEVELS } from '../src/levels/levels';
import { HazardField } from '../src/flight/hazards';
import { STEWARD_REACH } from '../src/flight/photographer';
import { GRIMSBY_SET, recitalAt } from '../src/flight/recital';
import { beelineController, runHeadless } from './flight-deep-harness';
import { pointInCone } from '../src/flight/geometry';
import { deepReport } from '../src/ui/report';
import { tr } from '../src/i18n';

const map = LEVEL12.map;
const field = new HazardField(map.hazards);
const index = LEVELS.findIndex(l => l.id === LEVEL12.id);
const dt = 1 / 120;

function diskTouches(x: number, y: number, r: number, ox: number, oy: number, a: number, half: number, range: number) {
  const dx = x - ox, dy = y - oy;
  const along = dx * Math.cos(a) + dy * Math.sin(a);
  const across = Math.abs(dy * Math.cos(a) - dx * Math.sin(a));
  if (Math.atan2(across, along) <= half) return Math.hypot(dx, dy) <= range + r;
  const h = Math.max(0, Math.min(range, along * Math.cos(half) + across * Math.sin(half)));
  return Math.hypot(along - h * Math.cos(half), across - h * Math.sin(half)) <= r;
}
function exposure(x: number, y: number, radius: number) {
  const points: boolean[] = [];
  for (let tick = 0; tick <= 16 / dt; tick++) {
    field.sample(tick * dt);
    points.push(map.hazards.some((d, i) => d.type === 'camera'
      ? diskTouches(x, y, radius, d.x, d.y, field.a[i]!, d.half, d.range)
      : d.type === 'steward' && diskTouches(x, y, radius, field.x2[i]!, field.y2[i]!, field.a[i]!, d.coneHalf, d.coneRange)));
  }
  return points;
}

function steerTo(sim: DeepFlightSim, target: Vec2): void {
  const s = sim.saucer;
  const dx = target.x - s.x, dy = target.y - s.y;
  const distance = Math.hypot(dx, dy);
  const reach = Math.min(175, distance * 1.6) / Math.max(1, distance);
  sim.update(dt, { down: distance > 12, pressed: false, released: false,
    x: s.x - sim.camX + dx * reach - s.vx * 0.24,
    y: s.y - sim.camY + dy * reach - s.vy * 0.24 });
}

describe('2199 harbour approaches', () => {
  it('keeps every 48-pixel recommended ring, staging pocket and quay crossing clear throughout each sweep', () => {
    for (const [x, y] of [[270,795],[1530,795],[1080,1950],[400,660],[1490,560],[760,1945],[1270,130],[180,430],
      [map.start.x, map.start.y], [GRIMSBY_SET.practice.x, GRIMSBY_SET.practice.y]]) {
      expect(exposure(x!, y!, 48).some(Boolean), `pocket at ${x},${y}`).toBe(false);
    }
  });
  it('leaves a shared brake-and-lock interval at every fast ring', () => {
    for (const [x, y] of [[530,675],[1270,675],[900,2040]]) {
      let clear = 0, longest = 0;
      for (const exposed of exposure(x!, y!, 48)) {
        clear = exposed ? 0 : clear + dt;
        longest = Math.max(longest, clear);
      }
      expect(longest, `ring at ${x},${y}`).toBeGreaterThanOrEqual(2.2);
    }
  });
  it('exposes the whole ticket disc and the old crossing longer than a Hush Drive fuse', () => {
    const d = map.hazards[3]!;
    if (d.type !== 'steward') throw new Error('Dozer missing');
    for (const [y, radius] of [[675, 48], [250, 0]] as const) {
      let live = 0, longest = 0;
      for (let t = 0; t < 16; t += dt) {
        field.sample(t);
        const dx = 1270 - field.x2[3]!, dy = y - field.y2[3]!, a = field.a[3]!;
        const along = dx * Math.cos(a) + dy * Math.sin(a);
        const across = Math.abs(dy * Math.cos(a) - dx * Math.sin(a));
        const inside = Math.hypot(dx, dy) + radius <= d.coneRange &&
          along * Math.sin(d.coneHalf) - across * Math.cos(d.coneHalf) >= radius;
        live = inside ? live + dt : 0;
        longest = Math.max(longest, live);
      }
      expect(longest).toBeGreaterThan(1);
      // On the pass the full lock disc must clear both cone edges and the range arc.
      // Exposure at the old crossing continues into the north turn until the lamp rotates past it.
      const distanceToCrossing = d.path[0]!.y - y;
      const expected = radius > 0
        ? (d.coneRange - radius - radius / Math.sin(d.coneHalf)) / d.speed
        : (d.coneRange + STEWARD_REACH - distanceToCrossing) / d.speed +
          d.dwell * (d.coneHalf - Math.asin(STEWARD_REACH * Math.sin(d.coneHalf) / distanceToCrossing)) / Math.PI;
      expect(longest).toBeCloseTo(expected, 1);
    }
  });

  it('launches from the north under the barges, with the avenue recital out of the opening screen', () => {
    expect(map.start.y / map.h).toBeLessThan(0.25);
    const d = map.hazards[0]!;
    if (d.type !== 'camera') throw new Error('Avenue lectern missing');
    expect(d.y - d.range, 'cone tip below the first screen').toBeGreaterThan(960);
  });

  it('catches the blind beeline at every launch phase', () => {
    for (const delay of BEELINE_DELAYS) {
      const run = runHeadless(map, [], beelineController, LEVEL12.budgetSec, true, delay);
      expect(run.done, `delay ${delay}`).toBe(false);
      expect(run.spots.length, `delay ${delay}`).toBe(1);
    }
  });

  // The recommended doors sit on the outer lanes, the designed way down. Everything else meets the poet.
  it('the avenue recital and the cordon alone catch every blind run into Moe’s bureau from the launch and both fast doors', () => {
    const starts = [map.start, ...map.targets.slice(0, 2).flatMap(t => t.entries.filter(e => !e.recommended))];
    const guarded = { ...map, hazards: [map.hazards[0]!, ...map.hazards.filter(d => d.type === 'wire')] };
    for (const delay of BEELINE_DELAYS) for (const from of starts) {
      const sim = new DeepFlightSim(guarded, new Set(), delay);
      sim.markDelivered(0);
      sim.markDelivered(1);
      sim.place(from.x, from.y, 0);
      const ctl = beelineController(sim);
      for (let tick = 0; tick < 12 / dt && sim.phase === 'fly'; tick++) {
        const it = ctl(sim);
        sim.update(dt, { down: it.down, pressed: false, released: false, x: it.x, y: it.y });
      }
      expect(sim.spottedBy, `from ${from.x},${from.y} at ${delay}s`).toBe(0);
    }
  });

  it('can brake and lock each entrance from its turnout and depart inside checkpoint grace', () => {
    const turnouts = [
      [{ x: 310, y: 940 }, { x: 400, y: 660 }],
      [{ x: 1490, y: 940 }, { x: 1490, y: 560 }],
      [{ x: 1080, y: 1770 }, { x: 760, y: 1945 }],
    ];
    for (const [i, target] of map.targets.entries()) for (const [j, entry] of target.entries.entries()) {
      const pocket = turnouts[i]![j]!;
      let cleanLock = false;
      for (let phase = 0; phase < 9 && !cleanLock; phase += 0.15) {
        const sim = new DeepFlightSim(map, new Set(), phase);
        sim.place(pocket.x, pocket.y, 0);
        let exposed = false;
        for (let tick = 0; tick < 4 / dt && sim.phase === 'fly'; tick++) {
          steerTo(sim, entry);
          exposed ||= sim.st.cause >= 0;
        }
        cleanLock = !exposed && sim.phase === 'locking' && sim.ringRef[sim.lockedRing]!.entry === j;
      }
      expect(cleanLock, entry.roomId).toBe(true);
      const back = new DeepFlightSim(map, new Set());
      back.markDelivered(i);
      back.place(entry.x, entry.y);
      for (let tick = 0; tick < SAFE_WINDOW / dt; tick++) steerTo(back, pocket);
      expect(Math.hypot(back.saucer.x - pocket.x, back.saucer.y - pocket.y), entry.roomId).toBeLessThan(48);
    }
  });
  it('runs a stationary listener and the 0.45-second preview from the live camera sampler', () => {
    const d = map.hazards[0]!;
    if (d.type !== 'camera') throw new Error('Avenue lectern missing');
    const { x: lx, y: ly } = GRIMSBY_SET.listeners[0];
    const poses = new Set<boolean>();
    for (let t = 0; t < 12; t += 0.05) {
      field.sample(t + 0.45);
      poses.add(recitalAt(d, t, lx, ly));
      expect(recitalAt(d, t + 0.45, lx, ly)).toBe(pointInCone(lx, ly, d.x, d.y, field.a[0]!, d.half, d.range));
    }
    expect(poses.size).toBe(2);
  });
});

describe('2199 opener', () => {
  it('Zib names the poets when the first one comes on screen, not at the launch', () => {
    const ctx = {
      pointer: { down: false, x: 0, y: 0, pressed: false, released: false }, assets: { get: () => undefined },
      audio: { sfx() {} }, upgrades: new Set<never>(), tutorial: false, time: 0, reducedMotion: true,
    };
    const scene = new DeepFlightScene({ ctx, level: LEVEL12, run: new DeepRun(LEVEL12, index), onLocked() {}, onSunrise() {}, onQuit() {} });
    const line = tr().humor.deepZib.start12[0];
    for (let i = 0; i < 30; i++) scene.update(1 / 60);
    expect(scene.zibText).not.toBe(line);
    scene.sim.place(600, 860, 3); // the west lectern's poet is now in view
    let said = false;
    for (let i = 0; i < 120 && !said; i++) {
      scene.update(1 / 60);
      said = scene.zibText === line;
    }
    expect(said).toBe(true);
  });
});

describe('Dispatch census filing', () => {
  it('requires both sibling deliveries in either order', () => {
    for (const order of [['level10','level11'],['level11','level10']]) {
      const save = defaultSave();
      save.levels[order[0]!] = { ...save.levels.level12, delivered: true };
      expect(isLevelUnlocked(save, index)).toBe(false);
      save.levels[order[1]!] = { ...save.levels.level12, delivered: true };
      expect(isLevelUnlocked(save, index)).toBe(true);
    }
  });
  it('accepts the third result before zero, rejects it at zero, and starts a fresh order on replay', () => {
    const delivery = { delivered: true, woke: false, aborted: false, timeSec: 10, bonks: 0, snores: 1, dignity: 100, itemsStolen: [] };
    for (const margin of [0.01, 0]) {
      const run = new DeepRun(LEVEL12, index);
      run.collectible!.collected = true;
      for (const target of [0, 1]) {
        run.startAbduct(target, 0);
        run.finishAbduct(delivery);
      }
      run.startAbduct(2, 1);
      run.tick(LEVEL12.budgetSec - margin);
      run.finishAbduct(delivery);
      const filed = applyDeepRun(defaultSave(), 'level12', run.summary());
      expect(filed.stars).toEqual([margin > 0, margin > 0, false, margin > 0]);
      expect(run.deliveredCount).toBe(margin > 0 ? 3 : 2);
    }
    const replay = new DeepRun(LEVEL12, index);
    expect(replay.remaining).toBe(LEVEL12.budgetSec);
    expect(replay.deliveredCount).toBe(0);
    expect(replay.recitalVerse).toBe(0);
    expect(replay.collectible!.collected).toBe(false);
  });

  it.each(['flight','abduct'] as const)('files the towel at demolition in %s and keeps the deadline dark', phase => {
    const run = new DeepRun(LEVEL12, index);
    run.collectible!.collected = true;
    run.spotted = 2;
    if (phase === 'abduct') run.startAbduct(0, 0);
    run.tick(LEVEL12.budgetSec - 1);
    expect(run.dawn).toBe(0);
    expect(run.clockText()).toBe('0:01');
    expect(run.tick(1)).toBe(true);
    const outcome = applyDeepRun(defaultSave(), 'level12', run.summary());
    expect(outcome.stars).toEqual([false,false,false,false]);
    expect(outcome.save.levels.level12.mapCollectible).toBe('bypass_towel');
    expect(deepReport(run, outcome)).toMatchObject({ stamp: 'demolition', headline: tr().dispatch2199.gazette, comment: tr().dispatch2199.lost });
    expect(validateSave({ ...outcome.save, dispatch2199Finale: true }).dispatch2199Finale).toBe(true);
  });
});
