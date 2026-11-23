import { describe, expect, it, vi } from 'vitest';
import type { GameContext, RoomId } from '../src/contracts';
import { createAbductScene } from '../src/abduct';
import { FOLLOW, Ragdoll, STEP, type FollowTuning, type Rect } from '../src/abduct/ragdoll';
import { CHAIR_POSE } from '../src/abduct/rooms/layout';
import type { AbductSimulation } from '../src/abduct/simulation';
import { HARD_BONK_SPEED } from '../src/abduct/wake';

declare const process: { stdout: { write(message: string): boolean } };

const FRAME = 1 / 60;

/**
 * Drives the beam along a straight mouse path (one input per 60 Hz frame, physics at 120 Hz)
 * and reports how far the chest trails the beam when the mouse stops, how far it overshoots
 * and how far it slides afterwards.
 */
function follow(tuning: FollowTuning, dx: number, seconds: number) {
  const body = new Ragdoll({ ...CHAIR_POSE, neckX: 200, neckY: 420 }, []);
  body.follow = tuning;
  body.beamX = 200;
  body.beamY = 450;
  let lift = 0;
  let acc = 0;
  const advance = () => {
    acc += FRAME;
    while (acc + 1e-9 >= STEP) {
      acc -= STEP;
      lift = Math.min(1, lift + STEP * 2);
      body.step(lift);
    }
  };
  for (let t = 0; t < 3; t += FRAME) advance();
  const x0 = body.chestX;
  const frames = Math.max(1, Math.round(seconds / FRAME));
  for (let f = 1; f <= frames; f++) {
    body.beamX = 200 + (dx * f) / frames;
    advance();
  }
  const target = x0 + dx;
  const lagAtStop = target - body.chestX;
  let overshoot = 0;
  let slide = 0;
  let last = body.chestX;
  for (let t = 0; t < 3; t += FRAME) {
    advance();
    overshoot = Math.max(overshoot, body.chestX - target);
    slide += Math.abs(body.chestX - last);
    last = body.chestX;
  }
  return { lagAtStop, overshoot, slide, final: Math.abs(body.chestX - target) };
}

describe('mouse precision', () => {
  it('keeps the touch follow exactly as tuned for the route proofs', () => {
    expect(FOLLOW.touch).toEqual({ k: 30, c: 7, max: 4800, lead: 0, hold: null, pilotDelay: 0 });
    expect(FOLLOW.mouse.max).toBe(FOLLOW.touch.max);
    expect(FOLLOW.mouse.k).toBe(FOLLOW.touch.k);
  });

  it('stops a fast sweep without overshoot', () => {
    const mouse = follow(FOLLOW.mouse, 200, 0.35);
    const touch = follow(FOLLOW.touch, 200, 0.35);
    expect(mouse.overshoot).toBeLessThan(1.5);
    expect(touch.overshoot).toBeGreaterThan(4);
  });

  it.each([
    { dx: 20, seconds: 0.4, lag: 5, slide: 6 },
    { dx: 6, seconds: 0.2, lag: 3, slide: 3.5 },
    { dx: 60, seconds: 0.6, lag: 12, slide: 14 },
  ])('a $dx px mouse move in $seconds s: the body stops where the cursor stops', ({ dx, seconds, lag, slide }) => {
    const mouse = follow(FOLLOW.mouse, dx, seconds);
    const touch = follow(FOLLOW.touch, dx, seconds);
    process.stdout.write(`[precision ${dx}px/${seconds}s] touch lag ${touch.lagAtStop.toFixed(1)} slide ${touch.slide.toFixed(1)} · mouse lag ${mouse.lagAtStop.toFixed(1)} slide ${mouse.slide.toFixed(1)} overshoot ${mouse.overshoot.toFixed(1)}\n`);
    expect(mouse.lagAtStop).toBeLessThan(lag);
    expect(mouse.slide).toBeLessThan(slide);
    expect(mouse.overshoot).toBeLessThan(1);
    expect(mouse.final).toBeLessThan(0.5);
    // and it is a real improvement over the lazy touch follow
    expect(mouse.lagAtStop).toBeLessThan(touch.lagAtStop * 0.5);
    expect(mouse.slide).toBeLessThan(touch.slide * 0.6);
  });

  it('resting the beam against a wall with the mouse follow never counts as a bonk, even on hard rules', () => {
    const wall: Rect = { kind: 'rect', x: 300, y: 0, w: 200, h: 1000, vx: 0, vy: 0 };
    for (const speed of [30, 60]) {
      const body = new Ragdoll({ ...CHAIR_POSE, neckX: 200, neckY: 420 }, [wall]);
      body.follow = FOLLOW.mouse;
      body.beamX = 200;
      body.beamY = 450;
      let lift = 0;
      let hardest = 0;
      for (let i = 0; i < 2 / STEP; i++) {
        lift = Math.min(1, lift + STEP * 2);
        body.step(lift);
      }
      for (let i = 0; i < 5 / STEP; i++) {
        if (i % 2 === 0) body.beamX = Math.min(440, body.beamX + speed / 60);
        body.step(lift);
        hardest = Math.max(hardest, body.impacts[0]!);
      }
      expect(hardest, `${speed} px/s`).toBeLessThan(HARD_BONK_SPEED);
    }
  });
});

// ---- every route stays solvable when the player uses a mouse (precise follow)

const ROUTES = [
  'farm_window', 'farm_chimney', 'laundry_skylight', 'laundry_loading',
  'dave_roof', 'dave_patio', 'barb_chimney', 'barb_backdoor', 'gary_skylight', 'gary_garagedoor',
  'nigel_skylight', 'nigel_loading', 'kev_vent', 'kev_fireescape', 'mayor_clocktower', 'mayor_elevator',
] as const satisfies readonly RoomId[];
const CADENCE = [4, 5, 6, 4, 6, 4, 5, 5];

function mouseRoute(id: RoomId, delay: number, shift: number): AbductSimulation {
  const onDone = vi.fn();
  const ctx: GameContext = {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false, kind: 'mouse' },
    assets: { get: () => undefined }, audio: { sfx: vi.fn() }, upgrades: new Set(),
    tutorial: false, reducedMotion: true, time: 0,
  };
  const scene = createAbductScene(ctx, { roomId: id, levelId: 'headless', rules: { wakeFails: true, hard: true } }, onDone);
  const sim = (scene as unknown as { debug: AbductSimulation }).debug;
  const { pointer } = ctx;
  const frame = (dt = 1 / 60) => {
    ctx.time += dt;
    scene.update(dt);
    pointer.pressed = pointer.released = false;
  };
  const press = () => {
    pointer.pressed = pointer.down = true;
    frame();
  };
  for (let t = 0; t < delay; t++) frame();
  press();
  for (let command = 0; sim.elapsed < 100 && !sim.complete; command++) {
    const { dx, dy } = sim.autopilot();
    if (pointer.x + dx < 60 || pointer.x + dx > 480 || pointer.y + dy < 160 || pointer.y + dy > 820) {
      pointer.released = true;
      pointer.down = false;
      frame();
      pointer.x = 270;
      pointer.y = 480;
      press();
    }
    pointer.x += dx;
    pointer.y += dy;
    frame(CADENCE[(command + shift) % CADENCE.length]! / 120);
  }
  expect(sim.body.follow).toBe(FOLLOW.mouse);
  const result = sim.result();
  expect(result, `${id} delay ${delay}: ${result.failBy ?? 'no cause'}`).toMatchObject({ delivered: true, woke: false, aborted: false });
  return sim;
}

it.each(ROUTES)('%s delivers asleep under hard rules with the mouse follow', (id) => {
  const runs = [mouseRoute(id, 0, 0), mouseRoute(id, 31, 3), mouseRoute(id, 97, 6), mouseRoute(id, 257, 2)];
  process.stdout.write(`[abduction mouse ${id}] ${runs.map(sim => `${sim.elapsed.toFixed(2)}s (${sim.wake.bonks} bonks)`).join(', ')}\n`);
}, 10_000);
