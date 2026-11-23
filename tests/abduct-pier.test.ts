// L5 "Pier Pressure" abduction proofs and the dolphin's mechanics (docs/GDD-3-new-shifts.md, L5):
// every route delivers asleep under deep rules through real pointer input, the dolphin body plan
// behaves (croissant droop, slippery, softer bonks), the moisture sheath drains, refills and
// fails as `woke`, water floats the dolphin and splashes a human.
import { describe, expect, it, vi } from 'vitest';
import type { GameContext, RoomId } from '../src/contracts';
import { createAbductScene } from '../src/abduct';
import { DOLPHIN_PLAN, Fin, HUMAN_PLAN, bodyPlanFor } from '../src/abduct/body-plan';
import { MOISTURE, MoistureSim } from '../src/abduct/moisture';
import { Ragdoll, STEP, type Rect } from '../src/abduct/ragdoll';
import { ROOMS } from '../src/abduct/rooms';
import { CHAIR_POSE } from '../src/abduct/rooms/layout';
import { AbductSimulation } from '../src/abduct/simulation';
import { WakeMeter } from '../src/abduct/wake';

declare const process: { stdout: { write(message: string): boolean } };

const PIER = ['bubbles_roof', 'bubbles_tunnel', 'pete_gallery', 'pete_slipway', 'sal_loft', 'sal_dock'] as const satisfies readonly RoomId[];
const HARD = { wakeFails: true, hard: true };
const CADENCE = [4, 5, 6, 4, 6, 4, 5, 5];
const FINGER_X = 270;
const FINGER_Y = 480;

function sceneFor(id: RoomId, kind?: 'touch') {
  const onDone = vi.fn();
  const ctx: GameContext = {
    pointer: { x: FINGER_X, y: FINGER_Y, down: false, pressed: false, released: false, ...(kind ? { kind } : {}) },
    assets: { get: () => undefined }, audio: { sfx: vi.fn() }, upgrades: new Set(),
    tutorial: false, reducedMotion: true, time: 0,
  };
  const scene = createAbductScene(ctx, { roomId: id, levelId: 'headless', rules: HARD }, onDone);
  const frame = (dt = 1 / 60): void => {
    ctx.time += dt;
    scene.update(dt);
    ctx.pointer.pressed = ctx.pointer.released = false;
  };
  const press = (): void => {
    ctx.pointer.pressed = ctx.pointer.down = true;
    frame();
  };
  const release = (): void => {
    ctx.pointer.released = true;
    ctx.pointer.down = false;
    frame();
  };
  return { scene, ctx, onDone, frame, press, release };
}

/** The abduction autopilot through relative pointer drags at an uneven 33–50 ms cadence. */
function flyRoute(id: RoomId, delay: number, cadenceShift: number): AbductSimulation {
  const { scene, ctx, onDone, frame, press, release } = sceneFor(id);
  const sim = scene.debug;
  const { pointer } = ctx;
  for (let t = 0; t < delay; t++) frame();
  press();
  let lowest = 1;
  for (let command = 0; sim.elapsed < 100 && !sim.complete; command++) {
    const { dx, dy } = sim.autopilot();
    if (pointer.x + dx < 60 || pointer.x + dx > 480 || pointer.y + dy < 145 || pointer.y + dy > 820) {
      release();
      pointer.x = FINGER_X;
      pointer.y = FINGER_Y;
      press();
    }
    pointer.x += dx;
    pointer.y += dy;
    frame(CADENCE[(command + cadenceShift) % CADENCE.length]! / 120);
    if (sim.wet?.sheathed) lowest = Math.min(lowest, sim.wet.level);
  }
  const result = sim.result();
  const body = sim.body;
  const diagnostic = `${id} delay ${delay / 60}s, ${result.failBy ?? 'no cause'} ${result.failReason ?? ''}, chest ${Math.round(body.chestX)},${Math.round(body.chestY)} beam ${Math.round(body.beamX)},${Math.round(body.beamY)}`;
  expect(result, diagnostic).toMatchObject({ delivered: true, woke: false, aborted: false });
  expect(result.failReason).toBeUndefined();
  expect(onDone).toHaveBeenCalledExactlyOnceWith(result);
  expect(result.timeSec).toBeGreaterThanOrEqual(40);
  expect(result.timeSec).toBeLessThanOrEqual(90);
  if (sim.wet?.sheathed) expect(lowest, `${id}: the bot never lets her dry out`).toBeGreaterThan(0.05);
  return sim;
}

describe('L5 routes (proof of solvability)', () => {
  it.each(PIER)('%s delivers asleep under hard rules with jittered pointer input', (id) => {
    const runs = [flyRoute(id, 0, 0), flyRoute(id, 31, 3), flyRoute(id, 97, 6), flyRoute(id, 257, 2)];
    process.stdout.write(`[abduction ${id}] ${runs.map(sim => `${sim.elapsed.toFixed(2)}s (${sim.wake.bonks} bonks${sim.wet?.sheathed ? `, ${Math.round(sim.wet.level * 100)}% damp` : ''})`).join(', ')}\n`);
  }, 20_000);

  it.each(PIER)('%s delivers through the touch finger the browser bot uses', (id) => {
    const times: string[] = [];
    for (const delay of [0, 45, 140]) {
      const { scene, ctx, frame } = sceneFor(id, 'touch');
      const sim = scene.debug;
      for (let t = 0; t < delay; t++) frame();
      while (sim.elapsed < 100 && !sim.complete) {
        Object.assign(ctx.pointer, sim.autopilotFinger(1 / 60));
        if (!ctx.pointer.down) ctx.pointer.pressed = ctx.pointer.down = true;
        frame();
      }
      const result = sim.result();
      expect(result, `${id} +${delay}f ${result.failReason ?? ''} ${result.failBy ?? ''}`).toMatchObject({ delivered: true, woke: false });
      times.push(sim.elapsed.toFixed(1));
    }
    process.stdout.write(`[touch ${id}] ${times.join(', ')} s\n`);
  }, 20_000);

  it('a brisk straight-line beeline never delivers an L5 specimen', () => {
    for (const id of PIER) {
      const sim = new AbductSimulation(ROOMS[id], new Set(), { sfx() {} }, () => 0.5, HARD);
      while (sim.elapsed < 90 && !sim.complete) {
        const x = sim.exitX - sim.body.beamX;
        const y = sim.exitY - sim.body.beamY;
        const scale = 1 / Math.max(1, Math.hypot(x, y) / 9);
        sim.moveBeam(sim.body.beamX + x * scale, sim.body.beamY + y * scale);
        sim.update(1 / 60);
      }
      expect(sim.result().delivered, id).toBe(false);
    }
  });

  it('every route has a timing commit and every building a second sleeper or a creak', () => {
    for (const id of PIER) {
      const it = ROOMS[id].interior!;
      expect(it.checkpoints.some(c => c.cross), id).toBe(true);
    }
    expect(ROOMS.bubbles_roof.interior!.building.sleepers.map(s => s.name)).toEqual(['Barnacle']);
    expect(ROOMS.sal_dock.interior!.building.sleepers.map(s => s.name)).toEqual(['Kipper']);
    expect(ROOMS.bubbles_roof.item.name).toBe('sardine tin');
  });
});

describe('body plans', () => {
  it('humans keep the v2 skeleton; Bubbles gets the 7-joint dolphin', () => {
    expect(bodyPlanFor('dave')).toBe(HUMAN_PLAN);
    expect(bodyPlanFor('pete')).toBe(HUMAN_PLAN);
    expect(bodyPlanFor('bubbles')).toBe(DOLPHIN_PLAN);
    expect(HUMAN_PLAN.joints).toBe(11);
    expect(DOLPHIN_PLAN.joints).toBe(7);
    expect(DOLPHIN_PLAN.bones).toBe(6);
    expect(DOLPHIN_PLAN.hands).toEqual([]);
    expect(DOLPHIN_PLAN.bonkGain).toBeCloseTo(0.8);
    const body = new Ragdoll(ROOMS.bubbles_roof.pose, [], false, DOLPHIN_PLAN);
    // snout to fluke ≈ 260 px along the bones, like a 275 px human
    expect(DOLPHIN_PLAN.lengths[0]! + DOLPHIN_PLAN.lengths[1]! + DOLPHIN_PLAN.lengths[2]! + DOLPHIN_PLAN.lengths[3]!).toBe(262);
    const span = body.x[Fin.Snout]! - body.x[Fin.Fluke]!;
    expect(span).toBeGreaterThan(230);
    expect(span).toBeLessThan(262);
    expect(body.maxBoneError()).toBeLessThan(0.001);
  });

  it('the dolphin droops into a croissant in the beam: both ends hang below the chest', () => {
    const body = new Ragdoll({ ...ROOMS.bubbles_roof.pose, neckX: 300, neckY: 300 }, [], false, DOLPHIN_PLAN);
    for (let i = 0; i < 360; i++) body.step(1);
    expect(body.y[Fin.Snout]!).toBeGreaterThan(body.y[Fin.Chest]! - 5);
    expect(body.y[Fin.Fluke]!).toBeGreaterThan(body.y[Fin.Chest]! + 30);
    expect(body.y[Fin.Tail]!).toBeGreaterThan(body.y[Fin.Belly]!);
    expect(Math.hypot(body.chestX - body.beamX, body.chestY - body.beamY)).toBeLessThan(30);
    expect(body.maxBoneError()).toBeLessThan(1);
  });

  it('is slippery: she keeps more of her slide along a floor than a human does', () => {
    const slide = (plan: typeof HUMAN_PLAN, pose: typeof CHAIR_POSE): number => {
      const floor: Rect = { kind: 'rect', x: -1000, y: 420, w: 3000, h: 60, vx: 0, vy: 0 };
      const body = new Ragdoll({ ...pose, neckX: 300, neckY: 300 }, [floor], false, plan);
      body.beamActive = false;
      for (let i = 0; i < 120; i++) body.step(1);
      const x0 = body.chestX;
      for (let i = 0; i < body.joints; i++) body.kick(i, 300, 0);
      for (let i = 0; i < 60; i++) body.step(1);
      return body.chestX - x0;
    };
    expect(slide(DOLPHIN_PLAN, ROOMS.bubbles_roof.pose)).toBeGreaterThan(slide(HUMAN_PLAN, CHAIR_POSE));
  });

  it('a bonk on the dolphin wakes her 20 % less', () => {
    const human = new WakeMeter(false, true);
    const dolphin = new WakeMeter(false, true, DOLPHIN_PLAN.bonkGain);
    human.impact(200);
    dolphin.impact(200);
    expect(dolphin.value).toBeCloseTo(human.value * 0.8, 5);
  });
});

describe('moisture sheath', () => {
  const wetRoom = { water: [{ name: 'Pool', area: { x: 0, y: 400, w: 600, h: 200 } }], refills: [{ name: 'Bucket', kind: 'bucket' as const, area: { x: 700, y: 300, w: 80, h: 100 } }] };

  it('drains over 14 s in air, then the red fuse runs for 1 s and she wakes (woke)', () => {
    const body = new Ragdoll({ ...ROOMS.bubbles_roof.pose, neckX: 300, neckY: 200 }, [], false, DOLPHIN_PLAN);
    const wet = new MoistureSim(wetRoom, true, body.joints, []);
    let t = 0;
    let lowAt = -1;
    while (!wet.dried && t < 30) {
      wet.prepare(body);
      body.step(1);
      wet.step(body, t, STEP);
      if (wet.low && lowAt < 0) lowAt = t;
      t += STEP;
    }
    expect(lowAt).toBeGreaterThan(MOISTURE.drainSec * 0.74);
    expect(lowAt).toBeLessThan(MOISTURE.drainSec * 0.76);
    expect(t).toBeGreaterThan(MOISTURE.drainSec + MOISTURE.fuse - 0.05);
    expect(t).toBeLessThan(MOISTURE.drainSec + MOISTURE.fuse + 0.05);
  });

  it('a dunk in water or a refill point fills her back up, and bonks splash some off', () => {
    const body = new Ragdoll({ ...ROOMS.bubbles_roof.pose, neckX: 300, neckY: 200 }, [], false, DOLPHIN_PLAN);
    const wet = new MoistureSim(wetRoom, true, body.joints, []);
    wet.level = 0.3;
    wet.bonk(1);
    expect(wet.level).toBeCloseTo(0.3 - MOISTURE.splash - MOISTURE.splashPerPower, 5);
    body.beamY = 470;
    for (let i = 0; i < 240; i++) {
      wet.prepare(body);
      body.step(1);
      wet.step(body, i * STEP, STEP);
    }
    expect(wet.wet).toBe(true);
    expect(wet.level).toBe(1);
    // the bucket
    wet.level = 0.2;
    body.beamX = 760;
    body.beamY = 330;
    for (let i = 0; i < 360; i++) {
      wet.prepare(body);
      body.step(1);
      wet.step(body, 10 + i * STEP, STEP);
    }
    expect(wet.level).toBe(1);
  });

  it('water floats the dolphin up off the beam point', () => {
    const body = new Ragdoll({ ...ROOMS.bubbles_roof.pose, neckX: 300, neckY: 500 }, [], false, DOLPHIN_PLAN);
    const wet = new MoistureSim(wetRoom, true, body.joints, []);
    for (let i = 0; i < 360; i++) {
      wet.prepare(body);
      body.step(1);
      wet.step(body, i * STEP, STEP);
    }
    expect(body.floating).toBe(true);
    expect(body.chestY).toBeLessThan(body.beamY - 4);
  });

  it('a human dropped into water splashes (noise), and has no sheath', () => {
    const body = new Ragdoll({ ...CHAIR_POSE, neckX: 300, neckY: 160 }, [], false, HUMAN_PLAN);
    const wet = new MoistureSim(wetRoom, false, body.joints, []);
    body.beamActive = false;
    let noise = 0;
    for (let i = 0; i < 120; i++) {
      wet.prepare(body);
      body.step(1);
      noise += wet.step(body, i * STEP, STEP);
    }
    expect(noise).toBeGreaterThan(5);
    expect(wet.splashSeq).toBeGreaterThan(0);
    expect(wet.level).toBe(1);
    expect(wet.low).toBe(false);
  });

  it('drying out fails the abduction as woke, by Bubbles', () => {
    const sim = new AbductSimulation(ROOMS.bubbles_roof, new Set(), { sfx() {} }, () => 0.5, HARD);
    sim.moveBeam(470, 300);
    for (let i = 0; i < 60; i++) sim.update(1 / 60);
    expect(sim.wet!.wet).toBe(false);
    sim.wet!.level = 0.01;
    for (let i = 0; i < 60 * 3 && !sim.failure; i++) sim.update(1 / 60);
    expect(sim.failure).toEqual({ reason: 'woke', by: 'Bubbles' });
  });
});
