import { workOrderNumber } from '../src/levels/levels';
import { describe, expect, it, vi } from 'vitest';
import { ART } from '../src/art-manifest';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { MONOLITH_ROOMS } from '../src/abduct/rooms/deep-monolith';
import { AbductPilot } from '../src/abduct/autopilot';
import { AbductSimulation } from '../src/abduct/simulation';
import { DeepRun } from '../src/levels/run';
import { levelRooms } from '../src/levels/levels';
import { DeepFlightSim } from '../src/flight/deep-sim';
import { RoamingApe, TroopTally } from '../src/flight/roam';
import { evaluateStars } from './difficulty/stars';
import { RING_R } from '../src/flight/sim';
import { moveBone } from '../src/abduct/monolith';
import type { Rect } from '../src/abduct/ragdoll';
import { HazardField } from '../src/flight/hazards';
import { nearHumOnset, type HumSlab } from '../src/flight/monolith';
import { LEVEL8 } from '../src/levels/deep-monolith';
import { applyDeepRun, computeDeepStars, isLevelUnlocked } from '../src/levels/progress';
import { validateSave } from '../src/levels/save';
import { autopilotController, runHeadless } from './flight-deep-harness';
import { playAbduction, PROFILES } from './difficulty/human';

describe('Prior Contact', () => {
  it('unlocks on the first completed cruise, including a migrated save', () => {
    const save = validateSave({ levels: { level7: { attempts: 3 } } });
    expect(isLevelUnlocked(save, workOrderNumber('level8') - 1)).toBe(false);
    const cruise = applyDeepRun(save, 'level7', { delivered: 3, failedAbductions: 1, spotted: 1, elapsedSec: 410, sunrise: false });
    expect(cruise.unlockedNext).toBe(true);
    expect(isLevelUnlocked(validateSave(cruise.save), workOrderNumber('level8') - 1)).toBe(true);
  });

  it('detects exactly between the edges during the note, with a silent warning', () => {
    const slab: HumSlab = { type: 'hum', x: 200, y: 300, inner: 90, outer: 230, period: 7, sounding: 3, phase: 0 };
    const field = new HazardField([slab]);
    const lights = new Float64Array(0);
    field.sample(0);
    for (const [r, expected] of [[0,-1],[89,-1],[90,0],[230,0],[231,-1]] as const)
      expect(field.detect(slab.x + r, slab.y, lights)).toBe(expected);
    field.sample(6.6);
    expect(field.tell[0]).toBe(1);
    expect(field.detect(slab.x + 90, slab.y, lights)).toBe(-1);
    expect(nearHumOnset([slab], 200, 300, 6.99, 7)).toBe(true);
    expect(nearHumOnset([slab], 200, 300, 7, 7.02)).toBe(false);
    expect(nearHumOnset([slab], 1200, 300, 6.99, 7)).toBe(false);
    field.sample(7);
    expect(field.detect(slab.x + 90, slab.y, lights)).toBe(0);
  });

  it('keeps every landing disc clear of the sounding belts', () => {
    for (const target of LEVEL8.map.targets) for (const e of target.entries) {
      for (const d of LEVEL8.map.hazards) {
        if (d.type === 'hum') expect(Math.hypot(e.x - d.x, e.y - d.y) - RING_R, e.roomId).toBeGreaterThan(d.outer);
      }
    }
  });

  it('keeps the quarry landmark visible next to the slab', () => {
    const quarry = LEVEL8.map.targets[0]!.building;
    const roof = ART['flight/quarry_top']!;
    const slab = ART['flight/hum_slab_top']!;
    for (const hazard of LEVEL8.map.hazards) {
      if (hazard.type !== 'hum') continue;
      const dx = Math.abs(hazard.x - quarry.x);
      const dy = Math.abs(hazard.y - quarry.y);
      expect(dx >= (slab.w + roof.w) / 2 || dy >= (slab.h + roof.h) / 2).toBe(true);
    }
  });

  it('seats the souvenir on its plinth and frames cave exits in stone', () => {
    for (const room of Object.values(MONOLITH_ROOMS)) {
      const bone = room.item.sprite;
      const plinth = room.furniture.find(p => p.sprite.key === 'room/stone_plinth')!.sprite;
      expect(bone.y + bone.h).toBe(plinth.y);
      expect(bone.x).toBeGreaterThanOrEqual(plinth.x);
      expect(bone.x + bone.w).toBeLessThanOrEqual(plinth.x + plinth.w);
      expect(room.exit).toMatchObject(room.roofExit
        ? { key: 'room/exit_stone_hatch', w: 160, h: 70 }
        : { key: 'room/exit_stone_door', w: 160, h: 240 });
    }
  });

  it.each(['ape', 'cave'])('cancels a pending %s lock when the saucer teleports', kind => {
    const run = new DeepRun(LEVEL8, workOrderNumber(LEVEL8.id) - 1);
    const onLocked = vi.fn();
    const scene = new DeepFlightScene({
      run, level: LEVEL8, onLocked, onSunrise: vi.fn(), onQuit: vi.fn(),
      ctx: {
        pointer: { x: 0, y: 0, down: false, pressed: false, released: false },
        assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(),
        reducedMotion: true, tutorial: false, time: 0,
      },
    });
    const index = scene.sim.ringRef.findIndex(r => Boolean(r.ape) === (kind === 'ape'));
    const ring = scene.sim.rings[index]!;
    scene.debug.sim.place(ring.x, ring.y);
    for (let i = 0; i < 120 && scene.state === 'fly'; i++) scene.update(1 / 60);
    expect(scene.state).toBe('locking');
    expect(scene.sim.lockedRing).toBe(index);
    const start = LEVEL8.map.start;
    scene.debug.sim.place(start.x, start.y);
    for (let i = 0; i < 60; i++) scene.update(1 / 60);
    expect(scene.state).toBe('fly');
    expect(run.specimenCount).toBe(0);
    expect(onLocked).not.toHaveBeenCalled();
  });

  it('breaks a struck practice bone and clears its flight path for the rest of the room', () => {
    const sim = new AbductSimulation(MONOLITH_ROOMS.echo_appeal, new Set(), { sfx() {} }, () => 0.5);
    const interior = sim.interior!;
    const bone = interior.hazards.find(h => h.spec.kind === 'toss')!;
    sim.body.impacts[bone.firstSolid] = 165;
    interior.step(sim.body, 1, false);
    interior.prepare(8, sim.body.chestX, sim.body.chestY);
    expect(bone.broken).toBe(true);
    expect(bone.shapes[0]).toMatchObject({ kind: 'rect', active: false });
    expect(interior.canCross({ x: 0, y: 0 }, { x: 10, y: 0, cross: 'Practice toss' }, 0, 100)).toBe(true);
  });

  it('locks four different moving witnesses and Echo’s entrance without a sighting or an upgrade', () => {
    const flight = runHeadless(LEVEL8.map, [], autopilotController(), 240);
    expect(flight.spots).toEqual([]);
    expect(flight.done).toBe(true);
    expect(flight.legs).toHaveLength(5);
    expect(new Set(flight.legs.map(l => l.target + '/' + l.entry)).size).toBe(5);
  });

  it('scratches at home, walks to the lookout, gawks, and only bolts once per approach', () => {
    const ape = new RoamingApe({ x: 50, y: 50 }, { x: 150, y: 50 }, 0, 0);
    const distant = { x: 500, y: 500 };
    expect(ape.pose).toBe('scratch');
    for (let f = 0; f <= 480; f++) ape.step(f / 60, 1 / 60, distant);
    expect(ape.pose).toBe('gawk');
    expect(ape.x).toBeCloseTo(150);
    const shadow = { x: 145, y: 50 };
    ape.step(8.02, 0.02, shadow);
    expect(ape.pose).toBe('bolt');
    expect(ape.x).toBeGreaterThan(150);
    for (let f = 0; f < 40; f++) ape.step(8.03 + f / 60, 1 / 60, shadow);
    expect(ape.pose).toBe('gawk');
  });

  it('keeps partial troops across cave visits and sightings, and closes a full troop', () => {
    const run = new DeepRun(LEVEL8, workOrderNumber(LEVEL8.id) - 1);
    const first = run.troops[0]!;
    expect(first.catch(1)).toBe(true);
    expect(first.catch(1)).toBe(false);
    run.finishPickup(0, { x: 330, y: 1350 });
    expect(run.deliveredCount).toBe(0);
    expect(run.onSpotted()).toEqual({ x: 330, y: 1350 });
    run.startAbduct(2, 0);
    run.finishAbduct(playAbduction('echo_appeal', PROFILES.bot, 1).result);
    const next = new DeepFlightSim(LEVEL8.map, new Set(), 35, run.troops);
    expect(next.rings[1]!.x).toBeLessThan(0);
    expect(next.rings[0]!.x).toBeGreaterThan(0);
    expect(first.catch(2)).toBe(true);
    expect(first.catch(0)).toBe(false);
    run.finishPickup(0, { x: 600, y: 1250 });
    expect(run.specimenCount).toBe(3);
    expect(run.deliveredCount).toBe(2);
    const second = run.troops[1]!;
    for (const entry of [0, 2]) {
      second.catch(entry);
      run.finishPickup(1, second.troop.trails[entry]!.home);
    }
    expect(run.phase).toBe('done');
    expect(run.specimenCount).toBe(5);
    expect(new TroopTally(first.troop).caught.size).toBe(0);
  });

  it('files the final witness at the same shift time and score with either motion setting', () => {
    const results = [false, true].map(reducedMotion => {
      const run = new DeepRun(LEVEL8, workOrderNumber(LEVEL8.id) - 1);
      run.troops[0]!.catch(0);
      run.troops[0]!.catch(1);
      run.troops[1]!.catch(0);
      run.delivered[0] = run.delivered[2] = true;
      const scene = new DeepFlightScene({
        run, level: LEVEL8, onLocked: vi.fn(), onSunrise: vi.fn(), onQuit: vi.fn(),
        ctx: { pointer: { x: 0, y: 0, down: false, pressed: false, released: false },
          assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(), reducedMotion, tutorial: false, time: 0 },
      });
      const ring = scene.sim.ringRef.findIndex(r => r.ape && r.target === 1 && r.entry === 1);
      scene.sim.place(scene.sim.rings[ring]!.x, scene.sim.rings[ring]!.y);
      for (let i = 0; i < 120 && scene.state === 'fly'; i++) scene.update(1 / 60);
      expect(scene.state).toBe('locking');
      run.elapsed = 74.25;
      for (let i = 0; i < 120 && run.phase === 'flight'; i++) scene.update(1 / 60);
      expect(run.specimenCount).toBe(5);
      expect(run.phase).toBe('done');
      return { time: run.elapsed, stars: computeDeepStars(run.budget, LEVEL8.parMarginSec, run.summary(), LEVEL8.id) };
    });
    expect(results[1]).toEqual(results[0]);
  });

  it('cannot earn quota at sunrise, and scores the exact Night owl margin and Ghost rule', () => {
    const run = new DeepRun(LEVEL8, workOrderNumber(LEVEL8.id) - 1);
    run.delivered.fill(true);
    run.failedAbductions++;
    const score = () => computeDeepStars(run.budget, LEVEL8.parMarginSec, run.summary(), LEVEL8.id);
    run.tick(run.budget - LEVEL8.parMarginSec);
    expect(score()).toEqual([true, true, true, false]);
    run.tick(0.01);
    run.onSpotted();
    expect(score()).toEqual([true, false, false, false]);
    expect(run.tick(run.remaining)).toBe(true);
    expect(score()).toEqual([false, false, false, false]);
  });

  it('completes the live timed shift and its sole cave with the headless pilot', () => {
    const row = evaluateStars(LEVEL8, PROFILES.bot, 1, playAbduction);
    expect(row.runs[0]!.rooms).toEqual(['echo_appeal']);
    expect(row.runs[0]!.stars[0]).toBe(true);
    expect(row.runs[0]!.seconds).toBeLessThan(LEVEL8.budgetSec);
  });

  it('lands the practice bone on its plinth and holds it there between throws', () => {
    const bone = MONOLITH_ROOMS.echo_appeal.interior!.building.hazards.find(h => h.kind === 'toss')!;
    const shape: Rect = { ...bone.sprite, kind: 'rect', vx: 0, vy: 0 };
    moveBone(bone, shape, bone.airtime / 2 - bone.phase);
    expect(shape.y).toBeCloseTo(bone.sprite.y - bone.height);
    expect(shape.vy).toBeCloseTo(0);
    moveBone(bone, shape, bone.period - 0.1 - bone.phase);
    expect(shape.y).toBe(bone.sprite.y);
    expect(shape.vy).toBe(0);
  });

  it('can re-grip after the beam reaches its last checkpoint ahead of the body', () => {
    const room = MONOLITH_ROOMS.echo_appeal;
    const sim = new AbductSimulation(room, new Set(), { sfx() {} }, () => 0.5);
    const point = { x: sim.body.beamX, y: sim.body.beamY };
    const pilot = new AbductPilot({ ...room, interior: { ...room.interior!, checkpoints: [point] } });
    pilot.move(sim.body, 1, sim.interior);
    expect(pilot.checkpoint).toBe(1);
    pilot.rewindTo(point.x, point.y);
    expect(pilot.checkpoint).toBe(0);
  });

  it.each(levelRooms(LEVEL8))('%s delivers under the hard rules without upgrades', id => {
    for (const seed of [1, 3, 5]) {
      const run = playAbduction(id, PROFILES.bot, seed);
      expect(run.delivered, JSON.stringify(run)).toBe(true);
      expect(run.timeSec).toBeLessThan(90);
    }
  });
});
