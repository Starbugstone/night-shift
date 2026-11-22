import { describe, expect, it, vi } from 'vitest';
import type { GameContext, RoomId, SfxName } from '../src/contracts';
import { createAbductScene } from '../src/abduct';
import { ROOMS } from '../src/abduct/rooms';
import type { Waypoint } from '../src/abduct/rooms/layout';
import { AbductSimulation } from '../src/abduct/simulation';
import { AWAKE_SECONDS, BONK_SPEED, WakeMeter } from '../src/abduct/wake';

const ROOM_IDS = ['farm_window', 'farm_chimney', 'laundry_skylight', 'laundry_loading'] as const;

describe('wake and dignity', () => {
  it('ignores gentle contacts and discounts wake with Hush Drive', () => {
    const normal = new WakeMeter(false);
    const hush = new WakeMeter(true);
    expect(normal.impact(BONK_SPEED)).toBe(false);
    expect(normal.value).toBe(0);
    expect(normal.impact(BONK_SPEED + 70)).toBe(true);
    expect(hush.impact(BONK_SPEED + 70)).toBe(true);
    expect(hush.value).toBeCloseTo(normal.value * 0.75);
    expect(normal.bonks).toBe(1);
    expect(normal.dignity).toBeLessThan(100);
    const rising = normal.value;
    normal.tick(1);
    expect(normal.value).toBeLessThan(rising);
  });

  it('keeps a past wake on the report and drops back to half when a grip breaks', () => {
    const meter = new WakeMeter(false);
    meter.impact(420);
    meter.tick(0.22);
    meter.impact(420);
    meter.tick(0.22);
    meter.impact(420);
    expect(meter.awake).toBe(AWAKE_SECONDS);
    meter.tick(3.5, true);
    expect(meter.awake).toBeGreaterThan(0);
    meter.tick(3.5);
    expect(meter.awake).toBe(0);
    expect(meter.value).toBe(50);
    expect(meter.woke).toBe(true);
  });
});

function steer(sim: AbductSimulation, route: readonly Waypoint[]): void {
  for (const point of route) {
    const x = sim.body.beamX;
    const y = sim.body.beamY;
    const frames = Math.ceil(point.seconds * 60);
    for (let frame = 1; frame <= frames; frame++) {
      const t = frame / frames;
      sim.moveBeam(x + (point.x - x) * t, y + (point.y - y) * t);
      sim.update(1 / 60);
    }
  }
}

function runRoute(id: RoomId): AbductSimulation {
  const room = ROOMS[id];
  const sim = new AbductSimulation(room, new Set(), { sfx() {} }, () => 0.5);
  steer(sim, room.route);
  for (let frame = 0; frame < 90 && !sim.complete; frame++) sim.update(1 / 60);
  return sim;
}

describe('abduction rooms', () => {
  it.each(ROOM_IDS)('%s has a route through the scene within par', (id) => {
    const sim = runRoute(id);
    const result = sim.result();
    expect(result, `chest ended at ${sim.body.chestX.toFixed()}, ${sim.body.chestY.toFixed()}`).toMatchObject({
      delivered: true,
      woke: false,
    });
    expect(result.timeSec).toBeLessThan(ROOMS[id].par);
    expect(result.snores).toBeGreaterThan(1);
    expect(sim.complete).toBe(true);
  });

  it('can take a mug out of the loading door', () => {
    expect(runRoute('laundry_loading').result().itemsStolen).toEqual(['coffee mug']);
  });

  it('can take a slipper out of the bedroom window', () => {
    expect(runRoute('farm_window').result().itemsStolen).toEqual(['slipper']);
  });

  it('wakes on repeated yowls and breaks a pinned hand loose when the beam is yanked', () => {
    const sounds: SfxName[] = [];
    const sim = new AbductSimulation(ROOMS.farm_chimney, new Set(), {
      sfx(name) { sounds.push(name); },
    }, () => 0.5);
    steer(sim, [
      { x: 145, y: 563, seconds: 3 },
      { x: 360, y: 546, seconds: 5 },
      { x: 310, y: 465, seconds: 2 },
      { x: 260, y: 411, seconds: 2 },
    ]);
    expect(sounds).toContain('yowl');
    expect(sim.wake.value).toBeGreaterThan(25);
    for (let i = 0; i < 240 && !sim.body.gripActive; i++) sim.update(1 / 60);
    expect(sounds).toContain('wake');
    expect(sim.body.gripActive).toBe(true);
    const hand = sim.body.gripJoint;
    expect(sim.body.x[hand]).toBeCloseTo(sim.body.gripX);
    expect(sim.body.y[hand]).toBeCloseTo(sim.body.gripY);

    for (let i = 0; i < 4 && sim.body.gripActive; i++) {
      sim.moveBeam(i % 2 ? 190 : 485, i % 2 ? 550 : 240);
      sim.update(1 / 60);
    }
    expect(sim.body.gripActive).toBe(false);
    expect(sim.result().woke).toBe(true);
  });

  it('restarts from the canvas HUD and completes the attempt only once', () => {
    const ctx: GameContext = {
      pointer: { x: 469, y: 50, down: true, pressed: true, released: false },
      assets: { get: () => undefined },
      audio: { sfx: vi.fn() },
      upgrades: new Set(), time: 0, tutorial: true, reducedMotion: true,
    };
    const onDone = vi.fn();
    const scene = createAbductScene(ctx, { roomId: 'farm_window', levelId: 'demo' }, onDone);
    scene.update(1 / 60);
    scene.update(1 / 60);
    expect(onDone).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ aborted: true, delivered: false, timeSec: 0 }));
  });
});
