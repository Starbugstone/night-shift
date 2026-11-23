// Touch steering in abductions: the beam heads for a held finger (like the saucer in flight), so a
// thumb never has to keep re-swiping. Mouse and headless input keep the 1:1 drag (other suites).
import { describe, expect, it, vi } from 'vitest';
import type { GameContext, RoomId } from '../src/contracts';
import { POINT, createAbductScene, pointReach, pointSpeed } from '../src/abduct';

declare const process: { stdout: { write(message: string): boolean } };

const HARD = { wakeFails: true, hard: true };
const DEEP = [
  'dave_roof', 'dave_patio', 'barb_chimney', 'barb_backdoor', 'gary_skylight', 'gary_garagedoor',
  'nigel_skylight', 'nigel_loading', 'kev_vent', 'kev_fireescape', 'mayor_clocktower', 'mayor_elevator',
] as const satisfies readonly RoomId[];
const TRAINING = ['farm_window', 'farm_chimney', 'laundry_skylight', 'laundry_loading'] as const satisfies readonly RoomId[];
const DT = 1 / 60;

function touchScene(id: RoomId) {
  const onDone = vi.fn();
  const ctx: GameContext = {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false, kind: 'touch' },
    assets: { get: () => undefined }, audio: { sfx: vi.fn() }, upgrades: new Set(),
    tutorial: false, reducedMotion: true, time: 0,
  };
  const scene = createAbductScene(ctx, { roomId: id, levelId: 'headless', rules: HARD }, onDone);
  const sim = scene.debug;
  const camera = () => (sim.interior ? sim.camera : { x: 0, y: 0 });
  function frame(): void {
    ctx.time += DT;
    scene.update(DT);
    ctx.pointer.pressed = ctx.pointer.released = false;
  }
  /** Put the finger on a world point (pressing if it is not down yet) and run one frame. */
  function hold(worldX: number, worldY: number): void {
    const p = ctx.pointer;
    p.x = worldX - camera().x;
    p.y = worldY - camera().y;
    if (!p.down) p.pressed = p.down = true;
    frame();
  }
  function lift(): void {
    ctx.pointer.down = false;
    ctx.pointer.released = true;
    frame();
  }
  return { ctx, sim, onDone, frame, hold, lift, camera };
}

describe('touch steering maps', () => {
  it('pointReach inverts pointSpeed, with a dead zone and a top speed', () => {
    expect(pointSpeed(POINT.dead)).toBe(0);
    expect(pointSpeed(POINT.dead - 5)).toBe(0);
    for (const v of [30, 41, 120, 247]) expect(pointSpeed(pointReach(v))).toBeCloseTo(v, 9);
    expect(pointSpeed(POINT.dead + 1)).toBe(POINT.min);
    expect(pointSpeed(2000)).toBe(POINT.max);
  });
});

describe('holding a finger still', () => {
  it('keeps the body travelling in a house: no re-swiping', () => {
    const { sim, ctx, frame } = touchScene('dave_patio');
    for (let i = 0; i < 30; i++) frame();
    const startX = sim.body.chestX;
    // A thumb held still, 110 px right of the screen centre (where the camera keeps the body).
    Object.assign(ctx.pointer, { x: 270 + 110, y: 470, down: true, pressed: true });
    let x2 = 0;
    for (let i = 0; i < 4 * 60; i++) {
      frame();
      if (i === 2 * 60) x2 = sim.body.chestX;
    }
    expect(x2 - startX).toBeGreaterThan(90);
    // Still going in the second two seconds, with the finger never having moved.
    expect(sim.body.chestX - x2).toBeGreaterThan(120);
  });

  it('heads for the finger and stops there in a one-screen room', () => {
    const { sim, hold } = touchScene('laundry_skylight');
    // Well inside the beam's reach in this room, a long way from where the body starts.
    const tx = 360;
    const ty = 420;
    expect(Math.hypot(sim.body.beamX - tx, sim.body.beamY - ty)).toBeGreaterThan(120);
    for (let i = 0; i < 5 * 60; i++) hold(tx, ty);
    expect(Math.hypot(sim.body.beamX - tx, sim.body.beamY - ty)).toBeLessThanOrEqual(POINT.dead + 1);
  });

  it('a finger resting on the beam holds it still, and lifting stops it', () => {
    const { sim, hold, lift, frame } = touchScene('dave_roof');
    const bx = sim.body.beamX;
    const by = sim.body.beamY;
    for (let i = 0; i < 60; i++) hold(bx + 6, by - 4);
    expect(sim.body.beamX).toBe(bx);
    expect(sim.body.beamY).toBe(by);
    for (let i = 0; i < 20; i++) hold(bx + 200, by);
    lift();
    const after = sim.body.beamX;
    for (let i = 0; i < 60; i++) frame();
    expect(sim.body.beamX).toBe(after);
  });
});

it.each([...TRAINING, ...DEEP])('%s delivers asleep under hard rules by touch pointing alone', (id) => {
  const times: string[] = [];
  for (const wait of [0, 47, 131]) {
    const { sim, hold, frame, onDone, camera } = touchScene(id);
    for (let i = 0; i < wait; i++) frame();
    while (sim.elapsed < 100 && !sim.complete) {
      // A thumb held ahead of the beam by the reach that gives the pilot's planned speed.
      const finger = sim.autopilotFinger(DT);
      hold(finger.x + camera().x, finger.y + camera().y);
    }
    const result = sim.result();
    expect(result, `${id} after ${wait} frames: ${result.failBy ?? 'no failure'}`).toMatchObject({ delivered: true, woke: false, aborted: false });
    expect(onDone).toHaveBeenCalledExactlyOnceWith(result);
    times.push(result.timeSec.toFixed(1));
  }
  process.stdout.write(`[touch ${id}] ${times.join(', ')} s\n`);
}, 10_000);
