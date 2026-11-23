// L6 abduction: Form 7-B probe drones (src/abduct/probe.ts) and the six St. Mildred's routes.
// Solvability: the autopilot delivers every route asleep under deep rules, through real pointer
// input with a jittered frame cadence and with whole-pixel mouse latency.
import { describe, expect, it, vi } from 'vitest';
import type { GameContext, RoomId } from '../src/contracts';
import { createAbductScene } from '../src/abduct';
import { InteriorSimulation } from '../src/abduct/interior';
import { PROBE, type ProbeDrone } from '../src/abduct/probe';
import { Joint, Ragdoll, STEP } from '../src/abduct/ragdoll';
import { ROOMS } from '../src/abduct/rooms';
import type { Building } from '../src/abduct/rooms/interior';
import { CHAIR_POSE, type Room } from '../src/abduct/rooms/layout';
import { AbductSimulation } from '../src/abduct/simulation';

declare const process: { stdout: { write(message: string): boolean } };

const CLINIC = ['hank_front', 'hank_rear', 'osei_helipad', 'osei_pharmacy', 'pemberton_window', 'pemberton_chute'] as const satisfies readonly RoomId[];
const HARD = { wakeFails: true, hard: true };
const CADENCE = [4, 5, 6, 4, 6, 4, 5, 5];
const TIMEOUT_MS = 20_000;

// ---------------------------------------------------------------- probe drones

const EMPTY: Building = { rooms: [], walls: [], openings: [], sleepers: [], hazards: [], bounds: { x: 0, y: 0, w: 2000, h: 2000 } };
const silent = { sfx() {} };

/** A still body with every joint at (x, y), and a probe sim around it. */
function rig(drones: readonly ProbeDrone[], building: Building = EMPTY, audio: { sfx: (name: string) => void } = silent) {
  const body = new Ragdoll(CHAIR_POSE, []);
  body.x.fill(500);
  body.y.fill(500);
  const interior = new InteriorSimulation(building, [], 500, 500, audio as never, false, drones);
  return { body, interior, probes: interior.probes! };
}
const thermo = (x: number, y: number): ProbeDrone => ({ kind: 'thermo', x, y, r: 50, label: 'Temperature', reading: 'Temperature: lukewarm' });
const feather = (x: number, y: number): ProbeDrone =>
  ({ kind: 'feather', x, y, r: 50, label: 'Ticklishness', reading: 'Ticklishness: extreme', kickX: 1, kickY: 0 });

describe('Form 7-B probe drones', () => {
  it('ticks a reading after the named joint has been in the ring for 0.8 s', () => {
    const { body, interior, probes } = rig([thermo(520, 380)]);
    body.x[Joint.Head] = 520;
    body.y[Joint.Head] = 400;
    const frames = Math.round(PROBE.hold / STEP);
    for (let i = 1; i < frames; i++) interior.step(body, i * STEP, false);
    expect(probes.drones[0]!.done).toBe(false);
    expect(probes.drones[0]!.fill).toBeGreaterThan(0.95);
    interior.step(body, frames * STEP, false);
    expect(probes.drones[0]!.done).toBe(true);
    expect(probes.done).toBe(true);
    expect(probes.readings()).toEqual(['Temperature: lukewarm']);
  });

  it('only the named joint counts, and leaving the ring drains it twice as fast as it filled', () => {
    const { body, interior, probes } = rig([thermo(500, 500)]);
    // the head is far away; the chest, hands and feet sitting in the ring don't count
    body.x[Joint.Head] = 900;
    for (let i = 0; i < 200; i++) interior.step(body, i * STEP, false);
    expect(probes.drones[0]!.fill).toBe(0);
    body.x[Joint.Head] = 500;
    for (let i = 0; i < 48; i++) interior.step(body, i * STEP, false); // 0.4 s in
    expect(probes.drones[0]!.fill).toBeCloseTo(0.5, 1);
    body.x[Joint.Head] = 900;
    for (let i = 0; i < 24; i++) interior.step(body, i * STEP, false); // 0.2 s out
    expect(probes.drones[0]!.fill).toBeCloseTo(0, 1);
    expect(probes.done).toBe(false);
  });

  it('the feather giggles (specimen wake, sleepers hear it) and kicks the foot 0.35 s later', () => {
    const building: Building = {
      ...EMPTY,
      sleepers: [{ name: 'Roland', asleep: { key: 'room/roland_asleep', x: 520, y: 560, w: 160, h: 80 }, awake: { key: 'room/roland_awake', x: 520, y: 530, w: 160, h: 110 }, radius: 400 }],
    };
    const { body, interior, probes } = rig([feather(500, 500)], building);
    let giggle = 0;
    for (let i = 0; i < Math.round(PROBE.hold / STEP) + 1; i++) giggle += interior.step(body, i * STEP, false);
    const d = probes.drones[0]!;
    expect(d.done).toBe(true);
    expect(giggle).toBeGreaterThanOrEqual(PROBE.giggleWake);
    expect(interior.sleepers[0]!.wake).toBeGreaterThan(0);
    // the amber arrow is up: the kick has not fired yet
    expect(d.kickPending).toBeGreaterThan(0.3);
    const before = body.x[d.joint]!;
    for (let i = 0; i < Math.round((PROBE.kickTell - 0.05) / STEP); i++) interior.step(body, i * STEP, false);
    expect(d.kicked).toBe(false);
    for (let i = 0; i < 12; i++) interior.step(body, i * STEP, false);
    expect(d.kicked).toBe(true);
    expect(d.kickPending).toBe(-1);
    // one impulse along +x on the foot (no physics step ran, so read the implied velocity)
    body.step(0);
    expect(body.x[d.joint]!).toBeGreaterThan(before);
  });

  it('every L6 route carries two drones of two different kinds, with rings a thumb can hit', () => {
    for (const id of CLINIC) {
      const probes = ROOMS[id].interior!.probes!;
      expect(probes, id).toHaveLength(2);
      expect(new Set(probes.map((p) => p.kind)).size, id).toBe(2);
      for (const p of probes) expect(p.r, id).toBeGreaterThanOrEqual(48);
      // each drone has a checkpoint that serves it
      const served = new Set(ROOMS[id].interior!.checkpoints.flatMap((c) => (c.probe === undefined ? [] : [c.probe])));
      expect(served, id).toEqual(new Set([0, 1]));
    }
  });
});

// ---------------------------------------------------------------- the exit stays shut

it('the exit stays shut until Form 7-B is complete: with a drone out of reach the route never delivers', () => {
  for (const id of ['hank_front', 'pemberton_chute'] as const) {
    const base = ROOMS[id];
    const it = base.interior!;
    // the second drone has wandered off to the far end of the building; the pilot skips it
    const probes = it.probes!.map((p, i) => (i === 1 ? { ...p, x: -99_999, y: -99_999 } : p));
    const checkpoints = it.checkpoints.map((c) => (c.probe === 1 ? { x: c.x, y: c.y, speed: c.speed } : c));
    const skip: Room = { ...base, interior: { ...it, probes, checkpoints } };
    const sim = new AbductSimulation(skip, new Set(), silent, () => 0.5, HARD);
    let reached = false;
    while (sim.elapsed < 100 && !sim.complete) {
      const { dx, dy } = sim.autopilot();
      sim.moveBeam(sim.body.beamX + dx, sim.body.beamY + dy);
      sim.update(1 / 60);
      const z = base.exitZone;
      if (sim.body.chestX >= z.x && sim.body.chestX <= z.x + z.w && sim.body.chestY >= z.y && sim.body.chestY <= z.y + z.h) reached = true;
    }
    expect(reached, id).toBe(true);
    expect(sim.delivered, id).toBe(false);
    expect(sim.result().probeReadings, id).toHaveLength(1);
    expect(sim.interior!.probes!.done, id).toBe(false);
  }
}, TIMEOUT_MS);

// ---------------------------------------------------------------- solvability proofs

function sceneFor(id: RoomId) {
  const onDone = vi.fn();
  const ctx: GameContext = {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false },
    assets: { get: () => undefined }, audio: { sfx: vi.fn() }, upgrades: new Set(),
    tutorial: false, reducedMotion: true, time: 0,
  };
  const scene = createAbductScene(ctx, { roomId: id, levelId: 'level6', rules: HARD }, onDone);
  function frame(dt = 1 / 60): void {
    ctx.time += dt;
    scene.update(dt);
    ctx.pointer.pressed = ctx.pointer.released = false;
  }
  function press(): void {
    ctx.pointer.pressed = ctx.pointer.down = true;
    frame();
  }
  function release(): void {
    ctx.pointer.released = true;
    ctx.pointer.down = false;
    frame();
  }
  return { scene, ctx, onDone, frame, press, release };
}

function flyRoute(id: RoomId, delay: number, cadenceShift: number): AbductSimulation {
  const { scene, ctx, onDone, frame, press, release } = sceneFor(id);
  const sim = scene.debug;
  const { pointer } = ctx;
  for (let t = 0; t < delay; t++) frame();
  press();
  for (let command = 0; sim.elapsed < 100 && !sim.complete; command++) {
    const { dx, dy } = sim.autopilot();
    if (pointer.x + dx < 60 || pointer.x + dx > 480 || pointer.y + dy < 145 || pointer.y + dy > 820) {
      release();
      pointer.x = 270;
      pointer.y = 480;
      press();
    }
    pointer.x += dx;
    pointer.y += dy;
    frame(CADENCE[(command + cadenceShift) % CADENCE.length]! / 120);
  }
  const result = sim.result();
  const diagnostic = `${id} delay ${delay / 60}s, ${result.failBy ?? 'no cause'}, chest ${Math.round(sim.body.chestX)},${Math.round(sim.body.chestY)}`;
  expect(result, diagnostic).toMatchObject({ delivered: true, woke: false, aborted: false });
  expect(result.failReason, diagnostic).toBeUndefined();
  expect(onDone).toHaveBeenCalledExactlyOnceWith(result);
  expect(result.probeReadings, diagnostic).toHaveLength(2);
  expect(result.timeSec, diagnostic).toBeGreaterThanOrEqual(40);
  expect(result.timeSec, diagnostic).toBeLessThanOrEqual(90);
  return sim;
}

it.each(CLINIC)('%s delivers asleep under hard rules with Form 7-B complete, jittered pointer input', (id) => {
  const runs = [flyRoute(id, 0, 0), flyRoute(id, 31, 3), flyRoute(id, 97, 6), flyRoute(id, 257, 2)];
  process.stdout.write(`[abduction ${id}] ${runs.map((sim) => `${sim.elapsed.toFixed(2)}s (${sim.wake.bonks} bonks)`).join(', ')}\n`);
}, TIMEOUT_MS);

function flyWithMouseLatency(id: RoomId, latency: number): AbductSimulation {
  const { scene, ctx, onDone, frame, press, release } = sceneFor(id);
  const sim = scene.debug;
  const { pointer } = ctx;
  const scale = 375 / 540;
  const top = (690 - 960 * scale) / 2;
  const mouse = (x: number, y: number) => ({ x: Math.round(x * scale) / scale, y: (Math.round(y * scale + top) - top) / scale });
  const anchor = { x: 270, y: 520 };
  const quantized = mouse(anchor.x, anchor.y);
  let target = { ...anchor };
  const pending = Array.from({ length: latency }, () => quantized);
  for (let t = 0; t < 30; t++) frame();
  Object.assign(pointer, quantized);
  press();
  for (let i = 0; sim.elapsed < 100 && !sim.complete; i++) {
    const body = sim.body;
    const { beamX, beamY } = body;
    body.beamX += target.x - pointer.x;
    body.beamY += target.y - pointer.y;
    const { dx, dy } = sim.autopilot();
    body.beamX = beamX;
    body.beamY = beamY;
    target.x += dx;
    target.y += dy;
    if (target.x < 30 || target.x > 510 || target.y < 170 || target.y > 900) {
      release();
      for (let gap = 0; gap < 3; gap++) frame();
      target = { ...anchor };
      pending.fill(quantized);
      Object.assign(pointer, quantized);
      press();
    } else {
      pending.push(mouse(target.x, target.y));
      Object.assign(pointer, pending.shift()!);
      frame(CADENCE[(i + latency) % CADENCE.length]! / 240);
    }
  }
  const result = sim.result();
  expect(result, `${id}: ${latency} frames of mouse latency, ${result.failBy ?? 'no failure'}`).toMatchObject({ delivered: true, woke: false, aborted: false });
  expect(onDone).toHaveBeenCalledExactlyOnceWith(result);
  return sim;
}

it.each(CLINIC)('%s delivers with whole CSS-pixel mouse input delayed by 1–3 frames', (id) => {
  const times = [1, 2, 3].map((delay) => flyWithMouseLatency(id, delay).elapsed.toFixed(2));
  process.stdout.write(`[abduction mouse latency ${id}] ${times.join(', ')}s\n`);
}, TIMEOUT_MS);

it('a brisk straight-line beeline never delivers an L6 specimen', () => {
  for (const id of CLINIC) {
    const sim = new AbductSimulation(ROOMS[id], new Set(), silent, () => 0.5, HARD);
    while (sim.elapsed < 90 && !sim.complete) {
      const x = sim.exitX - sim.body.beamX;
      const y = sim.exitY - sim.body.beamY;
      const scale = 1 / Math.max(1, Math.hypot(x, y) / 9);
      sim.moveBeam(sim.body.beamX + x * scale, sim.body.beamY + y * scale);
      sim.update(1 / 60);
    }
    expect(sim.result().delivered, id).toBe(false);
  }
}, TIMEOUT_MS);

it('Hank floats past the ticket display and asks if it is his turn, once', () => {
  for (const id of ['hank_front', 'hank_rear'] as const) {
    const sim = new AbductSimulation(ROOMS[id], new Set(), silent, () => 0, HARD);
    let said = 0;
    let last = '';
    while (sim.elapsed < 100 && !sim.complete) {
      const { dx, dy } = sim.autopilot();
      sim.moveBeam(sim.body.beamX + dx, sim.body.beamY + dy);
      sim.update(1 / 60);
      if (sim.mumble !== last && sim.mumbleFx > 1.5) {
        last = sim.mumble;
        if (sim.mumble === 'Now serving… me?') said++;
      }
    }
    expect(said, id).toBe(1);
  }
}, TIMEOUT_MS);
