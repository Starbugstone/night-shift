import { expect, it, vi } from 'vitest';
import type { GameContext, RoomId } from '../src/contracts';
import { createAbductScene } from '../src/abduct';
import type { AbductSimulation } from '../src/abduct/simulation';

/**
 * The difficulty model knows each planned route, so it can't see a snag that a first-time
 * player hits (preprod v4: a ledge inside Doyle's flue stopped every climb up the middle).
 * This drives what a person does in a tutorial room: lift, move over the obstacle, head for
 * the exit they can see, hold, release. No route knowledge, no corrections.
 */
function plainDrag(roomId: RoomId, path: readonly (readonly [number, number])[], speed: number, kind: 'mouse' | 'touch') {
  const ctx = {
    pointer: { x: path[0]![0], y: path[0]![1], down: false, pressed: false, released: false, kind },
    assets: { get: () => undefined }, audio: { sfx: vi.fn() }, upgrades: new Set(),
    tutorial: false, reducedMotion: true, time: 0,
  } as unknown as GameContext;
  const scene = createAbductScene(ctx, { roomId, levelId: 'headless', rules: { wakeFails: false, hard: false } }, vi.fn());
  const sim = (scene as unknown as { debug: AbductSimulation }).debug;
  const p = ctx.pointer;
  const dt = 1 / 60;
  const frame = () => { ctx.time += dt; scene.update(dt); p.pressed = p.released = false; };
  frame();
  p.pressed = p.down = true;
  frame();
  for (let i = 1; i < path.length && !sim.complete; i++) {
    const [x0, y0] = path[i - 1]!;
    const [x1, y1] = path[i]!;
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / speed / dt));
    for (let f = 1; f <= n; f++) {
      p.x = x0 + ((x1 - x0) * f) / n;
      p.y = y0 + ((y1 - y0) * f) / n;
      frame();
    }
    for (let f = 0; f < 30; f++) frame();
  }
  for (let f = 0; f < 180 && !sim.complete; f++) frame();
  p.down = false;
  p.released = true;
  frame();
  for (let f = 0; f < 90 && !sim.complete; f++) frame();
  return sim.result();
}

const PLAIN: Partial<Record<RoomId, Record<string, readonly (readonly [number, number])[]>>> = {
  farm_chimney: {
    'up the middle': [[155, 650], [155, 500], [414, 500], [414, 160]],
    'up the right': [[155, 650], [155, 500], [440, 500], [440, 160]],
    'low then up': [[155, 650], [155, 560], [414, 560], [414, 160]],
  },
  laundry_loading: {
    'over and down': [[94, 620], [94, 500], [466, 500], [466, 711]],
    'diagonal to the door': [[94, 620], [250, 520], [466, 711]],
  },
};

it.each(Object.keys(PLAIN) as RoomId[])('plain drags deliver in %s with mouse and touch', roomId => {
  for (const kind of ['mouse', 'touch'] as const) {
    for (const speed of [200, 350]) {
      for (const [name, path] of Object.entries(PLAIN[roomId]!)) {
        expect(plainDrag(roomId, path, speed, kind).delivered, `${name}, ${kind} at ${speed} px/s`).toBe(true);
      }
    }
  }
}, 30_000);
