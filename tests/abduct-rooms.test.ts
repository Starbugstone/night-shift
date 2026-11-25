import { describe, expect, it, vi } from 'vitest';
import type { GameContext, RoomId, SfxName } from '../src/contracts';
import { createAbductScene } from '../src/abduct';
import { ROOMS } from '../src/abduct/rooms';
import { Joint, type Rect } from '../src/abduct/ragdoll';
import { CEILING, FLOOR, LEFT_WALL, RIGHT_WALL, type Area, type Waypoint } from '../src/abduct/rooms/layout';
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

function runRoute(id: RoomId, settleSeconds = 0): AbductSimulation {
  const room = ROOMS[id];
  const sim = makeSimulation(id);
  for (let frame = 0; frame < settleSeconds * 60; frame++) sim.update(1 / 60);
  steer(sim, room.route);
  for (let frame = 0; frame < 90 && !sim.complete; frame++) sim.update(1 / 60);
  return sim;
}

function makeSimulation(id: RoomId): AbductSimulation {
  return new AbductSimulation(ROOMS[id], new Set(), { sfx() {} }, () => 0.5);
}

function rects(sim: AbductSimulation): Rect[] {
  return sim.solids.filter(solid => solid.kind === 'rect');
}

function overlap(a: Area, b: Area): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

describe('abduction geometry', () => {
  it.each(ROOM_IDS)('%s settles against its mattress or seat without bonks or item capture', (id) => {
    const sim = makeSimulation(id);
    const { room, body, item } = sim;
    const isBed = room.human === 'doyle';
    const furniture = room.furniture.find(({ sprite }) => sprite.key === (isBed ? 'room/bed' : 'room/office_chair'))!;
    const [support] = furniture.colliders!;
    const { x, y, w } = support!;
    expect(rects(sim)).toContainEqual(expect.objectContaining(support!));

    for (let frame = 0; frame < 120; frame++) sim.update(1 / 60);
    expect(body.x[Joint.Pelvis]!).toBeGreaterThan(x);
    expect(body.x[Joint.Pelvis]!).toBeLessThan(x + w);
    expect(Math.abs(body.y[Joint.Pelvis]! + (isBed ? 31 : 16) - y)).toBeLessThan(3);
    if (isBed) {
      const pillow = furniture.colliders![2]!;
      expect(Math.abs(body.y[Joint.Head]! + 32 - pillow.y)).toBeLessThan(3);
      expect(Math.abs(body.chestY + 34 - y)).toBeLessThan(3);
    }
    for (const foot of [Joint.NearFoot, Joint.FarFoot]) {
      expect(Math.abs(body.y[foot]! + 14 - (isBed ? y : FLOOR))).toBeLessThan(3);
    }
    expect(sim.wake.bonks).toBe(0);
    expect(item.captured).toBe(false);
    const itemBottom = item.y + room.item.sprite.h / 2;
    expect(rects(sim).some(r => item.x > r.x && item.x < r.x + r.w && Math.abs(itemBottom - r.y) < 1)).toBe(true);
  });

  it.each(ROOM_IDS)('%s has no intersecting rectangular solids', (id) => {
    const sim = makeSimulation(id);
    const solids = rects(sim);
    if (sim.sign) {
      const { x, y, w, h } = sim.sign;
      const sweep = Math.hypot(w / 2, h);
      solids.push({ kind: 'rect', x: x - sweep, y: y - sweep, w: sweep * 2, h: sweep * 2, vx: 0, vy: 0 });
    }
    for (const [index, a] of solids.entries()) {
      for (const b of solids.slice(index + 1)) {
        expect(overlap(a, b), JSON.stringify({ a, b })).toBe(false);
      }
    }
  });

  it('keeps the entire cart patrol clear of the fixtures, walls and usable loading door', () => {
    const sim = makeSimulation('laundry_loading');
    const { sprite, travel } = sim.room.cart!;
    const swept = { ...sprite, x: sprite.x - travel, w: sprite.w + travel * 2 };
    expect(swept.x).toBeGreaterThan(LEFT_WALL);
    expect(swept.x + swept.w).toBeLessThan(RIGHT_WALL);
    expect(swept.x + swept.w).toBeLessThan(sim.room.exitZone.x);
    for (const { sprite: furniture } of sim.room.furniture) expect(overlap(swept, furniture)).toBe(false);
    for (const solid of rects(sim)) {
      if (solid !== sim.cart) expect(overlap(swept, solid)).toBe(false);
    }
    expect(sim.room.exit.y + sim.room.exit.h).toBe(FLOOR);
  });

  it('keeps the fan below the skylight through a full turn and leaves room for the ragdoll', () => {
    const sim = makeSimulation('laundry_skylight');
    const { fan, exit } = sim.room;
    for (const blade of sim.fanBlades) {
      const tip = blade.to + blade.r;
      expect(tip).toBe(fan!.bladeLength);
      expect(blade.y - tip).toBeGreaterThanOrEqual(Math.max(CEILING, exit.y + exit.h));
      expect(blade.x - tip - LEFT_WALL).toBeGreaterThan(68);
      expect(RIGHT_WALL - blade.x - tip).toBeGreaterThan(68);
    }
    expect(sim.fanBlades).toHaveLength(2);
  });

  it.each(ROOM_IDS)('%s has a reachable exit zone and a slurp target inside the exit', (id) => {
    const sim = makeSimulation(id);
    const { exit, exitZone: zone, roofExit } = sim.room;
    const right = zone.x + zone.w;
    const bottom = zone.y + zone.h;
    for (const [x, y] of [[zone.x, zone.y], [right, bottom]] as const) {
      sim.moveBeam(x, y);
      expect(sim.body.beamX).toBe(x);
      expect(sim.body.beamY).toBe(y);
    }
    expect(sim.exitX).toBeGreaterThan(exit.x);
    expect(sim.exitX).toBeLessThan(exit.x + exit.w);
    expect(sim.exitY).toBeGreaterThan(exit.y);
    expect(sim.exitY).toBeLessThan(exit.y + exit.h);
    if (roofExit) {
      expect(exit.y).toBe(CEILING);
      expect(sim.emitterX).toBe(exit.x + exit.w / 2);
    }
  });
});

describe('abduction rooms', () => {
  it.each(ROOM_IDS)('%s has a route through the scene within par', (id) => {
    for (const settleSeconds of [0, 2]) {
      const sim = runRoute(id, settleSeconds);
      const result = sim.result();
      expect(result, `chest ended at ${sim.body.chestX.toFixed()}, ${sim.body.chestY.toFixed()}`).toMatchObject({
        delivered: true,
        woke: false,
      });
      expect(result.timeSec).toBeLessThan(ROOMS[id].par);
      expect(result.snores).toBeGreaterThan(1);
      if (id === 'laundry_skylight') expect(result.bonks).toBeLessThanOrEqual(3);
      expect(sim.complete).toBe(true);
    }
  });

  // v4 items & recap humour: the loading door's souvenir is Larry's boxers (src/abduct/souvenir-items.ts)
  it('can take the boxers out of the loading door', () => {
    expect(runRoute('laundry_loading').result().itemsStolen).toEqual(['heart-print boxers']);
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
      { x: 145, y: 560, seconds: 3 },
      { x: 306, y: 515, seconds: 3 },
      { x: 306, y: 370, seconds: 3 },
      { x: 192, y: 370, seconds: 2 },
    ]);
    expect(sounds).toContain('yowl');
    expect(sim.wake.value).toBeGreaterThan(25);
    for (let i = 0; i < 360 && !sim.body.gripActive; i++) sim.update(1 / 60);
    expect(sounds.filter(sound => sound === 'yowl')).toHaveLength(3);
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
