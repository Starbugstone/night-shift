// L7 "A Whole Cruise Ship": the swell (src/abduct/swell.ts) and the six ship routes.
import { describe, expect, it, vi } from 'vitest';
import type { GameContext, RoomId } from '../src/contracts';
import { createAbductScene } from '../src/abduct';
import { ROOMS } from '../src/abduct/rooms';
import type { Hazard } from '../src/abduct/rooms/interior';
import type { Rect } from '../src/abduct/ragdoll';
import type { AbductSimulation } from '../src/abduct/simulation';
import {
  SWELL_PERIOD, SWELL_TELL, castorOffset, castorVelocity, findSwell, moveCastor, reversalSoon, swellPull, swellShape, toReversal,
  type CastorSpec, type SwellSpec,
} from '../src/abduct/swell';

declare const process: { stdout: { write(message: string): boolean } };

const SHIP_ROUTES = [
  'captain_mast', 'captain_funnel', 'marco_skylight', 'marco_promenade', 'greg_awning', 'greg_cabin',
] as const satisfies readonly RoomId[];
const HARD = { wakeFails: true, hard: true };
const CADENCE = [4, 5, 6, 4, 6, 4, 5, 5];

const SWELL: SwellSpec = { kind: 'swell', name: 'Ship roll', period: SWELL_PERIOD, pull: 200, phase: 0.3 };
const TROLLEY: CastorSpec = {
  kind: 'castor', name: 'Trolley', sprite: { key: 'room/dessert_trolley', x: 300, y: 566, w: 140, h: 120 },
  travel: 80, period: SWELL_PERIOD, phase: 0.3, lag: 0.35,
};

describe('the swell', () => {
  it('pulls both ways, holds, and turns every half roll', () => {
    let min = 0;
    let max = 0;
    let flips = 0;
    let last = Math.sign(swellPull(SWELL, 0));
    for (let t = 0; t < SWELL_PERIOD * 2; t += 0.01) {
      const p = swellPull(SWELL, t);
      min = Math.min(min, p);
      max = Math.max(max, p);
      const s = Math.sign(p);
      if (s !== 0 && s !== last) {
        flips++;
        last = s;
      }
    }
    expect(max).toBeCloseTo(SWELL.pull, 5);
    expect(min).toBeCloseTo(-SWELL.pull, 5);
    expect(flips).toBe(4);
    // it holds at full lean for a good part of each half roll
    let flat = 0;
    for (let t = 0; t < SWELL_PERIOD; t += 0.01) if (Math.abs(swellShape(SWELL.period, SWELL.phase, t)) === 1) flat += 0.01;
    expect(flat).toBeGreaterThan(SWELL_PERIOD * 0.6);
  });

  it('lights the amber bead just before each reversal, never long before', () => {
    for (let t = 0; t < SWELL_PERIOD * 2; t += 0.01) {
      const next = toReversal(SWELL.period, SWELL.phase, t);
      expect(next).toBeGreaterThan(0);
      expect(next).toBeLessThanOrEqual(SWELL_PERIOD / 2 + 1e-9);
      expect(reversalSoon(SWELL, t)).toBe(next <= SWELL_TELL);
      // the pull really does change sign at the predicted moment
      const before = swellShape(SWELL.period, SWELL.phase, t + next - 0.02);
      const after = swellShape(SWELL.period, SWELL.phase, t + next + 0.02);
      expect(Math.sign(before)).toBe(-Math.sign(after));
    }
  });

  it('rolls castors with the pull, a little late, and their velocity matches their motion', () => {
    const shape: Rect = { kind: 'rect', x: 0, y: 0, w: 140, h: 120, vx: 0, vy: 0 };
    for (let t = 0; t < SWELL_PERIOD; t += 0.05) {
      moveCastor(TROLLEY, shape, t);
      expect(shape.x).toBeCloseTo(TROLLEY.sprite.x + castorOffset(TROLLEY, t), 9);
      expect(Math.abs(shape.x - TROLLEY.sprite.x)).toBeLessThanOrEqual(TROLLEY.travel + 1e-9);
      const numeric = (castorOffset(TROLLEY, t + 1e-4) - castorOffset(TROLLEY, t - 1e-4)) / 2e-4;
      expect(castorVelocity(TROLLEY, t)).toBeCloseTo(numeric, 0);
      // it parks on the side the ship leans to once it has had time to roll
      const lean = swellShape(SWELL.period, SWELL.phase, t - TROLLEY.lag);
      if (Math.abs(lean) === 1) expect(Math.sign(castorOffset(TROLLEY, t))).toBe(Math.sign(lean));
    }
  });

  it('every ship building rolls, and every route has a passage longer than half a roll', () => {
    for (const id of SHIP_ROUTES) {
      const room = ROOMS[id];
      const swell = findSwell(room.interior!.building);
      expect(swell, id).toBeDefined();
      const pts = room.interior!.checkpoints;
      let longest = 0;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]!;
        const b = pts[i]!;
        longest = Math.max(longest, Math.hypot(b.x - a.x, b.y - a.y) / (b.speed ?? 41));
      }
      // the longest single leg at cruise speed already outlasts half a roll
      expect(longest, id).toBeGreaterThan(SWELL_PERIOD / 2);
    }
  });
});

function sceneFor(id: RoomId) {
  const onDone = vi.fn();
  const ctx: GameContext = {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false },
    assets: { get: () => undefined }, audio: { sfx: vi.fn() }, upgrades: new Set(),
    tutorial: false, reducedMotion: true, time: 0,
  };
  const scene = createAbductScene(ctx, { roomId: id, levelId: 'level7', rules: HARD }, onDone);
  function frame(dt = 1 / 60): void {
    ctx.time += dt;
    scene.update(dt);
    ctx.pointer.pressed = ctx.pointer.released = false;
  }
  return { scene, ctx, onDone, frame };
}

function flyShipRoute(id: RoomId, delay: number, cadenceShift: number): AbductSimulation {
  const { scene, ctx, onDone, frame } = sceneFor(id);
  const sim = scene.debug as AbductSimulation;
  const { pointer } = ctx;
  const press = (): void => {
    pointer.pressed = pointer.down = true;
    frame();
  };
  for (let t = 0; t < delay; t++) frame();
  press();
  for (let command = 0; sim.elapsed < 100 && !sim.complete; command++) {
    const { dx, dy } = sim.autopilot();
    if (pointer.x + dx < 60 || pointer.x + dx > 480 || pointer.y + dy < 145 || pointer.y + dy > 820) {
      pointer.released = true;
      pointer.down = false;
      frame();
      pointer.x = 270;
      pointer.y = 480;
      press();
    }
    pointer.x += dx;
    pointer.y += dy;
    frame(CADENCE[(command + cadenceShift) % CADENCE.length]! / 120);
  }
  const result = sim.result();
  const body = sim.body;
  const diagnostic = `${id} delay ${(delay / 60).toFixed(2)}s, ${result.failReason ?? ''} ${result.failBy ?? 'no cause'} at ${sim.elapsed.toFixed(1)}s, ` +
    `chest ${Math.round(body.chestX)},${Math.round(body.chestY)} beam ${Math.round(body.beamX)},${Math.round(body.beamY)}, wake ${Math.round(sim.wake.value)}`;
  expect(result, diagnostic).toMatchObject({ delivered: true, woke: false, aborted: false });
  expect(result.failReason, diagnostic).toBeUndefined();
  expect(onDone).toHaveBeenCalledExactlyOnceWith(result);
  expect(result.timeSec, diagnostic).toBeGreaterThanOrEqual(40);
  expect(result.timeSec, diagnostic).toBeLessThanOrEqual(90);
  return sim;
}

describe('ship routes', () => {
  it.each(SHIP_ROUTES)('%s delivers asleep under deep rules, whatever the roll is doing at the start', (id) => {
    // starts spread over a whole roll, so the proof does not depend on a lucky phase
    const runs = [0, 31, 97, 163, 257, 331].map((delay, i) => flyShipRoute(id, delay, i % CADENCE.length));
    process.stdout.write(`[ship ${id}] ${runs.map(sim => `${sim.elapsed.toFixed(1)}s/${sim.wake.bonks}b`).join(', ')}\n`);
  }, 20_000);

  it('castors are moving solids that the swell drives', () => {
    const kinds = new Set<Hazard['kind']>();
    for (const id of SHIP_ROUTES) for (const h of ROOMS[id].interior!.building.hazards) kinds.add(h.kind);
    expect(kinds.has('castor')).toBe(true);
    expect(kinds.has('swell')).toBe(true);
  });
});
