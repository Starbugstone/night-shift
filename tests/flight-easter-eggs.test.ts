// v4 easter eggs: the L2 time car and the L7 iceberg are scenery. Flying the same inputs with and
// without them gives the same detection, collisions and outcome, frame for frame; Zib mentions each
// once per run, never over a hazard line.
import { describe, expect, it } from 'vitest';
import type { GameContext, Vec2 } from '../src/contracts';
import { ART } from '../src/art-manifest';
import { EGGS, EggCues, eggOf } from '../src/flight/easter-eggs';
import { FlightScene } from '../src/flight/scene';
import { LEVEL7 } from '../src/levels/deep-ship';
import { SHIP_LEFT } from '../src/flight/ship-hull';
import { LEVELS } from '../src/levels/levels';
import type { DeepMap, PropDef, TutorialLevelDef } from '../src/levels/types';
import { en } from '../src/i18n/en';
import { targetHeadKey } from '../src/ui/draw';
import { autopilotController, runHeadless } from './flight-deep-harness';
import { humanFlightController, PROFILES } from './difficulty/human';

const DT = 1 / 60;
const LEVEL2 = LEVELS.find((l) => l.id === 'level2') as TutorialLevelDef;
const noEggs = (props: readonly PropDef[]): PropDef[] => props.filter((p) => !eggOf(p));

describe('the eggs are on the maps', () => {
  it('L2 parks the time car in the back lot, clear of both rings', () => {
    const car = LEVEL2.map.props.find((p) => p.kind === 'timecar')!;
    expect(car.key).toBe('flight/gullwing_car');
    expect(ART[car.key]).toEqual({ w: 144, h: 80 });
    // map-car scale, and its cabin glow sits inside the sprite
    expect(EGGS.timecar.glow!.x).toBeLessThan(144);
    expect(EGGS.timecar.glow!.y).toBeLessThan(80);
    for (const e of LEVEL2.map.entries) expect(Math.hypot(e.x - car.x, e.y - car.y), e.roomId).toBeGreaterThan(160);
  });

  it('L7 floats the iceberg in open water off the bow, clear of the rings', () => {
    const ice = LEVEL7.map.props.find((p) => p.kind === 'iceberg')!;
    expect(ice.key).toBe('flight/iceberg');
    expect(ART[ice.key]).toEqual({ w: 120, h: 90 });
    // open water: west of the hull's full beam (the painted bow is fuller than its fallback curve)
    expect(ice.x + ART[ice.key]!.w / 2 + 90).toBeLessThan(SHIP_LEFT);
    for (const t of LEVEL7.map.targets) for (const e of t.entries) expect(Math.hypot(e.x - ice.x, e.y - ice.y)).toBeGreaterThan(300);
  });
});

describe('decor only: same detection and collision with and without the eggs', () => {
  const ship: DeepMap = { ...LEVEL7.map, props: noEggs(LEVEL7.map.props) };

  it('L7 autopilot: identical run', () => {
    const a = runHeadless(LEVEL7.map, [], autopilotController(), 400);
    const b = runHeadless(ship, [], autopilotController(), 400);
    expect(a.done).toBe(true);
    expect(a.spots).toEqual(b.spots);
    expect(a.bumps).toBe(b.bumps);
    expect(a.legs).toEqual(b.legs);
    expect(a.trail).toEqual(b.trail);
  }, 30_000);

  it('L7 casual human model: identical sightings and bumps', () => {
    const a = runHeadless(LEVEL7.map, [], humanFlightController(PROFILES.casual, 1), 120);
    const b = runHeadless(ship, [], humanFlightController(PROFILES.casual, 1), 120);
    expect(a.spots).toEqual(b.spots);
    expect(a.bumps).toBe(b.bumps);
    expect(a.trail).toEqual(b.trail);
  }, 30_000);

  /** Fly L2 up the east yard, over the car, to the loading door; every frame's state. */
  function flyL2(level: TutorialLevelDef): { frames: string[]; zib: string[]; locked: string | null } {
    const ctx: GameContext = {
      pointer: { down: false, x: 270, y: 480, pressed: false, released: false },
      assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(), reducedMotion: true, time: 0, tutorial: false,
    };
    let locked: string | null = null;
    const scene = new FlightScene({ ctx, level, spotted: 0, onLocked: (r) => { locked = r.roomId; }, onQuit() { throw new Error('quit'); } });
    const route: Vec2[] = [{ x: 975, y: 1200 }, { x: 975, y: 1010 }, { x: 975, y: 800 }, { x: 1010, y: 620 }, { x: 900, y: 470 }, { x: 865, y: 436 }];
    const frames: string[] = [];
    const zib: string[] = [];
    let wp = 0;
    for (let f = 0; f < 60 * 60 && !locked; f++) {
      const s = scene.saucer;
      const aim = route[wp]!;
      const d = Math.hypot(aim.x - s.x, aim.y - s.y);
      const last = wp === route.length - 1;
      if (!last && d < 40) wp++;
      const p = ctx.pointer;
      // the SPOTTED card waits for a tap
      const down = (scene.state === 'fly' && (!last || d > 18)) || (scene.state === 'spotted' && scene.st > 3.4);
      p.pressed = down && !p.down;
      p.released = !down && p.down;
      p.down = down;
      p.x = s.x - scene.camX + ((aim.x - s.x) / Math.max(1, d)) * Math.min(160, d) - s.vx * 0.2;
      p.y = s.y - scene.camY + ((aim.y - s.y) / Math.max(1, d)) * Math.min(160, d) - s.vy * 0.2;
      scene.update(DT);
      if (scene.state === 'spotted') wp = 0;
      frames.push(`${s.x.toFixed(2)},${s.y.toFixed(2)} ${scene.state} sus ${scene.suspicion.toFixed(4)} exp ${scene.exposed} spotted ${scene.spotted}`);
      if (scene.zibT === scene.zibFor) zib.push(scene.zibText);
    }
    return { frames, zib, locked };
  }

  it('L2: the same flight over the time car, frame for frame', () => {
    const a = flyL2(LEVEL2);
    const b = flyL2({ ...LEVEL2, map: { ...LEVEL2.map, props: noEggs(LEVEL2.map.props) } });
    expect(a.locked).toBe('laundry_loading');
    expect(a.frames).toEqual(b.frames);
    // and Zib noticed the car, once
    const said = a.zib.filter((l) => en.easterEggs.zib.timeCar.includes(l));
    expect(said).toHaveLength(1);
    expect(b.zib.some((l) => en.easterEggs.zib.timeCar.includes(l))).toBe(false);
  });
});

describe('once per run, never over a hazard line', () => {
  const ice = LEVEL7.map.props.find((p) => p.kind === 'iceberg')!;
  // a camera that frames the iceberg
  const camX = ice.x - 270;
  const camY = ice.y - 480;

  it('waits while a hazard line has the floor, then speaks once per run, across flight legs', () => {
    const run = {};
    const leg1 = new EggCues(LEVEL7.map.props, run);
    expect(leg1.check(0, 0, camX, camY, false)).toBeNull();
    const line = leg1.check(0, 0, camX, camY, true);
    expect(en.easterEggs.zib.iceberg).toContain(line);
    expect(leg1.check(0, 0, camX, camY, true)).toBeNull();
    // the next flight leg of the same shift stays quiet; a new shift speaks again
    expect(new EggCues(LEVEL7.map.props, run).check(0, 0, camX, camY, true)).toBeNull();
    expect(new EggCues(LEVEL7.map.props, {}).check(0, 0, camX, camY, true)).not.toBeNull();
  });

  it('the iceberg is quiet off screen; the car only when flown over', () => {
    expect(new EggCues(LEVEL7.map.props, {}).check(0, 0, camX, camY + 900, true)).toBeNull();
    // on screen but under the HUD rows: not yet
    expect(new EggCues(LEVEL7.map.props, {}).check(0, 0, camX, ice.y - 100, true)).toBeNull();
    const car = LEVEL2.map.props.find((p) => p.kind === 'timecar')!;
    const cues = new EggCues(LEVEL2.map.props, {});
    expect(cues.check(car.x + EGGS.timecar.r + 5, car.y, 0, 0, true)).toBeNull();
    expect(en.easterEggs.zib.timeCar).toContain(cues.check(car.x + 20, car.y, 0, 0, true));
  });
});

// Every deep target's HUD chip, Work Orders mugshot and retry card find a portrait (the Captain's
// art is `human/sterling_head`, not `human/captain_head`: his chip was blank).
describe('deep target portraits', () => {
  it('every deep target names a head that is in the manifest', () => {
    for (const lv of LEVELS) {
      if (lv.kind !== 'deep') continue;
      for (const t of lv.map.targets) expect(ART[targetHeadKey(t)], `${lv.id} ${t.short}`).toBeDefined();
    }
  });
});
