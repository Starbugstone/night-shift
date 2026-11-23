import { expect, it, vi } from 'vitest';
import type { GameContext, RoomId, UpgradeId } from '../src/contracts';
import { createAbductScene } from '../src/abduct';
import { CAMERA_FUSE, InteriorSimulation } from '../src/abduct/interior';
import { Joint, Ragdoll, STEP } from '../src/abduct/ragdoll';
import { ROOMS } from '../src/abduct/rooms';
import type { Building } from '../src/abduct/rooms/interior';
import { CHAIR_POSE } from '../src/abduct/rooms/layout';
import { AbductSimulation } from '../src/abduct/simulation';

// The Node runner provides stdout; the browser project does not load Node's types.
declare const process: { stdout: { write(message: string): boolean } };

const TRAINING = ['farm_window', 'farm_chimney', 'laundry_skylight', 'laundry_loading'] as const;
const DEEP = [
  'dave_roof', 'dave_patio', 'barb_chimney', 'barb_backdoor', 'gary_skylight', 'gary_garagedoor',
  'nigel_skylight', 'nigel_loading', 'kev_vent', 'kev_fireescape', 'mayor_clocktower', 'mayor_elevator',
] as const satisfies readonly RoomId[];
const HARD = { wakeFails: true, hard: true };
const CADENCE = [4, 5, 6, 4, 6, 4, 5, 5]; // 33–50 ms, simulated at 120 Hz
const FINGER_X = 270;
const FINGER_Y = 480;

function sceneFor(id: RoomId, upgrades: readonly UpgradeId[] = []) {
  const onDone = vi.fn();
  const ctx: GameContext = {
    pointer: { x: FINGER_X, y: FINGER_Y, down: false, pressed: false, released: false },
    assets: { get: () => undefined }, audio: { sfx: vi.fn() }, upgrades: new Set(upgrades),
    tutorial: false, reducedMotion: true, time: 0,
  };
  const scene = createAbductScene(ctx, { roomId: id, levelId: 'headless', rules: HARD }, onDone);
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
      pointer.x = FINGER_X;
      pointer.y = FINGER_Y;
      press();
    }
    pointer.x += dx;
    pointer.y += dy;
    frame(CADENCE[(command + cadenceShift) % CADENCE.length]! / 120);
  }
  const result = sim.result();
  const body = sim.body;
  const diagnostic = `delay ${delay / 60}s, ${result.failBy ?? 'no cause'}, chest ${Math.round(body.chestX)},${Math.round(body.chestY)} beam ${Math.round(body.beamX)},${Math.round(body.beamY)}`;
  expect(result, diagnostic).toMatchObject({ delivered: true, woke: false, aborted: false });
  expect(result.failReason).toBeUndefined();
  expect(onDone).toHaveBeenCalledExactlyOnceWith(result);
  if (sim.interior) {
    expect(result.timeSec).toBeGreaterThanOrEqual(40);
    expect(result.timeSec).toBeLessThanOrEqual(90);
  }
  return sim;
}

it.each([...TRAINING, ...DEEP])('%s delivers asleep under hard rules with jittered pointer input', (id) => {
  const runs = [flyRoute(id, 0, 0), flyRoute(id, 31, 3), flyRoute(id, 97, 6), flyRoute(id, 257, 2)];
  process.stdout.write(`[abduction ${id}] ${runs.map(sim => `${sim.elapsed.toFixed(2)}s (${sim.wake.bonks} bonks)`).join(', ')}\n`);
});

it('a brisk straight-line beeline causes an actual failure on most deep routes', () => {
  const failures: RoomId[] = [];
  for (const id of DEEP) {
    const sim = new AbductSimulation(ROOMS[id], new Set(), { sfx() {} }, () => 0.5, HARD);
    while (sim.elapsed < 24 && !sim.complete) {
      const x = sim.exitX - sim.body.beamX;
      const y = sim.exitY - sim.body.beamY;
      const scale = 1 / Math.max(1, Math.hypot(x, y) / 9);
      sim.moveBeam(sim.body.beamX + x * scale, sim.body.beamY + y * scale);
      sim.update(1 / 60);
    }
    if (sim.result().failReason) failures.push(id);
  }
  process.stdout.write(`[abduction beeline] ${failures.length}/${DEEP.length} failures · ${failures.join(', ')}\n`);
  expect(failures.length).toBeGreaterThan(DEEP.length / 2);
});

it('freezes the scene on a secondary sleeper waking and reports the named cause once', () => {
  const { scene, ctx, onDone, frame } = sceneFor('dave_roof');
  const sim = scene.debug;
  const brenda = sim.interior!.sleepers[0]!;
  sim.interior!.noise(100, brenda.x, brenda.y);
  frame();
  const failedAt = sim.elapsed;
  expect(sim.failure).toEqual({ reason: 'sleeper', by: 'Brenda' });
  expect(brenda.wake).toBe(100);
  expect(onDone).not.toHaveBeenCalled();
  expect(ctx.audio.sfx).toHaveBeenCalledWith('scream');
  for (let i = 0; i < 72; i++) frame();
  expect(sim.elapsed).toBe(failedAt);
  expect(onDone).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
    delivered: false, failReason: 'sleeper', failBy: 'Brenda',
  }));
});

it('casts the Snooze Ray once after two taps and removes 40 from both wake meters', () => {
  const { scene, ctx, press, release } = sceneFor('dave_roof', ['snooze_ray']);
  const sim = scene.debug;
  const brenda = sim.interior!.sleepers[0]!;
  sim.wake.noise(90);
  sim.interior!.noise(89, brenda.x, brenda.y);
  press();
  release();
  expect(sim.wake.value).toBeGreaterThan(89);
  press();
  release();
  expect(sim.wake.value).toBeCloseTo(50, 0);
  expect(brenda.wake).toBeCloseTo(49, 0);
  expect(sim.snoozePulse).toBeGreaterThan(0);
  press();
  release();
  press();
  release();
  expect(sim.wake.value).toBeGreaterThan(48);
  expect(ctx.audio.sfx).toHaveBeenCalledWith('lullaby');
  expect(vi.mocked(ctx.audio.sfx).mock.calls.filter(([name]) => name === 'lullaby')).toHaveLength(1);
});

it('requires a full second of continuous camera exposure to trip the alarm', () => {
  const body = new Ragdoll(CHAIR_POSE, []);
  const home: Building = {
    rooms: [], walls: [], openings: [], sleepers: [], bounds: { x: 0, y: 0, w: 540, h: 960 },
    hazards: [{ kind: 'camera', name: 'Fixed camera', x: body.chestX, y: body.chestY - 170,
      angle: Math.PI / 2, spread: 0.3, range: 240, sweep: 0, speed: 0, phase: 0 }],
  };
  const sim = new InteriorSimulation(home, [], body.chestX, body.chestY, { sfx() {} }, false);
  const frames = Math.round(CAMERA_FUSE / STEP);
  for (let i = 1; i < frames; i++) sim.step(body, i * STEP, false);
  expect(sim.failure).toBeUndefined();
  sim.step(body, frames * STEP, false);
  expect(sim.failure).toEqual({ reason: 'alarm', by: 'Fixed camera' });
});

it('detects a foot that enters the visible camera cone with the chest outside', () => {
  const camera = {
    kind: 'camera', name: 'Fixed camera', x: 100, y: 240,
    angle: 0, spread: 0.22, range: 240, sweep: 0, speed: 0, phase: 0,
  } as const;
  const body = new Ragdoll(CHAIR_POSE, []);
  body.x.fill(230);
  body.y.fill(395);
  // The foot centre is just below the cone and its collision radius crosses the edge.
  body.y[Joint.NearFoot] = 279;
  const home: Building = {
    rooms: [], openings: [], sleepers: [], bounds: { x: 0, y: 0, w: 540, h: 960 },
    walls: [], hazards: [camera],
  };
  const sim = new InteriorSimulation(home, [], body.chestX, body.chestY, { sfx() {} }, false);
  sim.step(body, STEP, false);
  expect(sim.watching?.spec).toBe(camera);
  expect(sim.exposure).toBeCloseTo(STEP);

  const behindWall = new InteriorSimulation({
    ...home, walls: [{ x: 167, y: 180, w: 14, h: 134 }],
  }, [], body.chestX, body.chestY, { sfx() {} }, false);
  behindWall.step(body, STEP, false);
  expect(behindWall.watching).toBeUndefined();
  expect(behindWall.exposure).toBe(0);
});

it.each(['dave_roof', 'barb_chimney', 'gary_skylight', 'nigel_loading', 'kev_vent', 'mayor_elevator'] as const)(
  '%s keeps its loose item on the spawn furniture while the beam is idle', (id) => {
    const sim = new AbductSimulation(ROOMS[id], new Set(), { sfx() {} }, () => 0.5, HARD);
    const { x, y } = sim.item;
    for (let step = 0; step < 240; step++) sim.update(STEP);
    expect(sim.item.x).toBeCloseTo(x);
    expect(sim.item.y).toBeCloseTo(y, 0);
    expect(sim.failure).toBeUndefined();
  },
);

it('shows the laser tell for its last 0.35 seconds of clearance', () => {
  const sim = new AbductSimulation(ROOMS.gary_skylight, new Set(), { sfx() {} }, () => 0.5, HARD);
  const interior = sim.interior!;
  const laser = interior.hazards.find(state => state.spec.name === "Gary's laser")!;
  interior.prepare(2.59, 300, 360);
  expect(laser).toMatchObject({ tell: false, level: 0 });
  interior.prepare(2.61, 300, 360);
  expect(laser).toMatchObject({ tell: true, level: 0 });
  interior.prepare(2.94, 300, 360);
  expect(laser).toMatchObject({ tell: true, level: 0 });
  interior.prepare(2.96, 300, 360);
  expect(laser).toMatchObject({ tell: false, level: 1 });
});
