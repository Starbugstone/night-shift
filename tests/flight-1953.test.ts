import { describe, expect, it } from 'vitest';
import type { PointerState, Vec2 } from '../src/contracts';
import { FlightAutopilot } from '../src/flight/autopilot';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { DeepFlightSim } from '../src/flight/deep-sim';
import { HazardField } from '../src/flight/hazards';
import { pointInCone } from '../src/flight/geometry';
import { DRIVE_IN_PROJECTOR, PILOT_QUEUE, SNEEZE_SHORTCUT, TRIPOD_LEG, TRIPOD_SNEEZE } from '../src/flight/invasion1953';
import { TripodLegPilot } from '../src/flight/invasion1953-pilot';
import { SAUCER } from '../src/flight/sim';
import { LEVEL11 } from '../src/levels/deep-1953';
import { LEVELS } from '../src/levels/levels';
import { isLevelUnlocked } from '../src/levels/progress';
import { DeepRun } from '../src/levels/run';
import { defaultSave } from '../src/levels/save';
import { PROFILES, playAbduction } from './difficulty/human';
import { evaluateStars, evaluateTripodFirst } from './difficulty/stars';
import { BEELINE_DELAYS } from './difficulty/beeline';
import { autopilotController, beelineController, runHeadless } from './flight-deep-harness';

const { map } = LEVEL11;
const DT = 1 / 60;
const noPorches = new Float64Array(0);
const idle: PointerState = { down: false, x: 0, y: 0, pressed: false, released: false };
const press = (sim: DeepFlightSim, goal: Vec2): PointerState => {
  const s = sim.saucer;
  const distance = Math.hypot(goal.x - s.x, goal.y - s.y);
  const scale = Math.min(186, distance * 1.4) / Math.max(1, distance);
  return {
    ...idle, down: distance > 12 || Math.hypot(s.vx, s.vy) > 60,
    x: s.x - sim.camX + (goal.x - s.x) * scale - s.vx * (distance < 130 ? 0.35 : 0.1),
    y: s.y - sim.camY + (goal.y - s.y) * scale - s.vy * (distance < 130 ? 0.35 : 0.1),
  };
};

describe('1953 · Route 9 Drive-In', () => {
  it('unlocks when 1955 is delivered', () => {
    const save = defaultSave();
    const index = LEVELS.indexOf(LEVEL11);
    expect(isLevelUnlocked(save, index)).toBe(false);
    save.levels.level9.delivered = true;
    expect(isLevelUnlocked(save, index)).toBe(true);
  });

  it('cues Zib’s recognition at the queue once the launch banner clears, once per shift', () => {
    const run = new DeepRun(LEVEL11, LEVELS.indexOf(LEVEL11));
    const ctx = {
      pointer: { ...idle }, assets: { get: () => undefined }, audio: { sfx() {} },
      upgrades: new Set<never>(), tutorial: false, time: 0, reducedMotion: true,
    };
    const opts = { ctx, level: LEVEL11, run, onLocked() {}, onSunrise() {}, onQuit() {} };
    const first = new DeepFlightScene(opts);
    first.sim.place(PILOT_QUEUE.x, PILOT_QUEUE.y, 0);
    first.update(DT);
    // v4 openings: the launch sits beside the queue, so the bubble waits for the banner instead of hiding under it.
    expect(first.bannerT).toBeGreaterThan(0);
    expect(first.queueBarkT).toBe(0);
    for (let i = 0; i < 400 && first.queueBarkT === 0; i++) {
      first.sim.place(PILOT_QUEUE.x, PILOT_QUEUE.y, 0);
      first.update(DT);
    }
    expect(first.bannerT).toBe(0);
    expect(first.queueBarkT).toBeGreaterThan(0);
    const next = new DeepFlightScene(opts);
    for (let i = 0; i < 400; i++) {
      next.sim.place(PILOT_QUEUE.x, PILOT_QUEUE.y, 0);
      next.update(DT);
    }
    expect(next.queueBarkT).toBe(0);
  });

  // v4 openings (2026-11-26): no spawn gate, and no free straight line either. A finger held straight at any
  // of the six rings is caught on the way, beyond the opening: the sky-watch on the church tower covers the
  // middle fields (Clive and Matt), the evacuation desk's dog covers the approach to Sylvie.
  it('catches a straight run from the launch to every ring at every tested phase, beyond the opening', () => {
    const { start } = map;
    const opening = new DeepFlightSim(map, new Set(), 0);
    const screen = { x: opening.camX, y: opening.camY };
    for (const entry of map.targets.flatMap(t => t.entries)) {
      for (const delay of BEELINE_DELAYS) {
        const sim = new DeepFlightSim(map, new Set(), delay);
        while (sim.phase === 'fly' && sim.t < delay + 16) sim.update(DT, press(sim, entry));
        const at = `${entry.roomId} from ${delay}s`;
        expect(sim.phase, at).toBe('spotted');
        const { x, y } = sim.saucer;
        expect(Math.hypot(x - start.x, y - start.y), at).toBeGreaterThan(600);
        expect(x >= screen.x && x <= screen.x + 540 && y >= screen.y && y <= screen.y + 960, `${at}: caught on the first screen`).toBe(false);
      }
    }
  });

  it('the naive beeline is caught at every tested phase, beyond the opening', () => {
    const { start } = map;
    for (const delay of BEELINE_DELAYS) {
      const run = runHeadless(map, [], beelineController, LEVEL11.budgetSec, true, delay);
      expect(run.done, `beeline from ${delay}s`).toBe(false);
      const spot = run.spots[0]!;
      expect(spot, `beeline from ${delay}s`).toBeDefined();
      expect(Math.hypot(spot.x - start.x, spot.y - start.y)).toBeGreaterThan(600);
    }
  });

  it('shows no detector ahead of the saucer on the first screen at launch', () => {
    const { start } = map;
    const opening = new DeepFlightSim(map, new Set(), 0);
    const field = new HazardField(map.hazards);
    const lit = new Float64Array(8).fill(1);
    for (let t = 0; t < 12; t += 0.1) {
      field.sample(t);
      for (let x = start.x - 160; x <= start.x + 160; x += 16) {
        for (let y = opening.camY; y <= start.y; y += 16) {
          if (field.detect(x, y, lit) !== -1) throw new Error(`detector ahead of the launch at ${x},${y}, t=${t.toFixed(1)}`);
        }
      }
    }
  });

  it('opens beside the saucer queue with no fixed detector reaching the launch', () => {
    const { start } = map;
    expect(Math.hypot(start.x - PILOT_QUEUE.x, start.y - PILOT_QUEUE.y)).toBeLessThan(265);
    const field = new HazardField(map.hazards);
    for (let t = 0; t < 25; t += 0.05) {
      field.sample(t);
      for (let x = start.x - 60; x <= start.x + 60; x += 10) {
        for (let y = start.y - 60; y <= start.y + 80; y += 10) {
          if (field.detect(x, y, noPorches) !== -1) throw new Error(`launch exposed at ${x},${y}, t=${t.toFixed(2)}`);
        }
      }
    }
    // The projector still lights the parking rows, off to the side of the launch.
    expect(new HazardField([DRIVE_IN_PROJECTOR]).detect(900, 1900, noPorches)).toBe(0);
  });

  it('keeps the entire wait pocket, west road, queue, pickup, east verge and Church Lane dark', () => {
    const field = new HazardField(map.hazards);
    const points: Vec2[] = [TRIPOD_LEG];
    for (let x = 275; x <= 325; x += 5) {
      for (let y = 1275; y <= 1325; y += 5) points.push({ x, y });
    }
    for (let x = 1400; x <= 1520; x += 10) {
      for (let y = 1880; y <= 1940; y += 10) points.push({ x, y });
    }
    for (let x = 85; x <= 185; x += 10) {
      for (let y = 1180; y <= 1280; y += 10) points.push({ x, y });
    }
    for (let x = 195; x <= 315; x += 12) {
      for (let y = 295; y <= 2185; y += 12) points.push({ x, y });
    }
    // Church Lane up to Sylvie's desk (the evacuation crosses its east end), and the east verge.
    for (let y = 235; y <= 355; y += 12) {
      for (let x = 255; x <= 1440; x += 15) points.push({ x, y });
    }
    for (let x = 1710; x <= 1780; x += 14) {
      for (let y = 300; y <= 2200; y += 15) points.push({ x, y });
    }
    for (let t = 0; t < 25; t += 0.05) {
      field.sample(t);
      for (const p of points) {
        if (field.detect(p.x, p.y, noPorches) !== -1) {
          throw new Error(`safe point exposed at ${p.x},${p.y}, t=${t.toFixed(2)}`);
        }
      }
    }
  });

  it('shows a warning with no exposure and catches the full-speed cut in its live window, including Hush Drive', () => {
    const ray = TRIPOD_SNEEZE;
    const field = new HazardField([ray]);
    const { period, warning, live } = ray.burst;
    field.sample(period - warning / 2);
    expect(field.tell[0]).toBe(1);
    expect(field.detect(550, 1300, noPorches)).toBe(-1);
    field.sample(period + live / 2);
    expect(field.tell[0]).toBe(0);
    expect(field.detect(550, 1300, noPorches)).toBe(0);
    const bend = SNEEZE_SHORTCUT[1];
    const finish = SNEEZE_SHORTCUT[2];
    const angle = Math.atan2(finish.y - bend.y, finish.x - bend.x);
    const fuseSec = map.fuseSec ?? 1;
    for (const offset of [-28, -21, -14, -7, 0, 7, 14, 21, 28]) {
      const y = bend.y + offset;
      const capX = ray.x - Math.sqrt(ray.range ** 2 - (ray.y - y) ** 2);
      for (const fuse of [fuseSec, fuseSec / 0.8]) {
        let exposure = 0;
        let clearExposure = 0;
        for (let i = 0; i < 1000; i++) {
          const sec = i / 1000 * 1.5;
          const dx = SAUCER.maxSpeed * sec;
          const pastBend = Math.max(0, dx - (bend.x - capX));
          const wx = Math.min(bend.x, capX + dx) + pastBend * Math.cos(angle);
          const wy = y + pastBend * Math.sin(angle);
          field.sample(period + sec);
          if (field.on[0] && pointInCone(wx, wy, ray.x, ray.y, ray.base, ray.half, ray.range)) exposure += 0.0015;
          field.sample(period + live + 0.1 + sec);
          if (field.on[0] && pointInCone(wx, wy, ray.x, ray.y, ray.base, ray.half, ray.range)) clearExposure += 0.0015;
        }
        expect(exposure, `offset ${offset}, fuse ${fuse}`).toBeGreaterThan(fuse);
        expect(clearExposure).toBe(0);
      }
    }
  });

  it('autopilot locks each entry from launch and completes the three-leg map', () => {
    for (const target of map.targets) {
      for (const entry of target.entries) {
        const sim = new DeepFlightSim({ ...map, targets: [{ ...target, entries: [entry] }] }, new Set(), 5);
        const pilot = new FlightAutopilot(sim);
        while (sim.phase === 'fly' && sim.t < 80) sim.update(DT, { ...idle, ...pilot.intent() });
        expect(sim.phase, entry.roomId).toBe('locking');
      }
    }
    const result = runHeadless(map, [], autopilotController(), 80, true);
    expect(result.spots).toEqual([]);
    expect(result.done).toBe(true);
  }, 30_000);

  it('files three real room results in a full shift, with and without the west-farm detour', () => {
    const standard = evaluateStars(LEVEL11, PROFILES.bot, 1, playAbduction).runs[0]!;
    expect(standard.stars.slice(0, 2), JSON.stringify(standard)).toEqual([true, true]);
    expect(standard.rooms).toHaveLength(3);
    expect(standard.roomFailures).toEqual([]);
    const detour = evaluateTripodFirst(LEVEL11, PROFILES.bot, 1, playAbduction).runs[0]!;
    expect(detour.stars.slice(0, 2), JSON.stringify(detour)).toEqual([true, true]);
    expect(detour.roomFailures).toEqual([]);
    expect(detour.stars[3]).toBe(true);
  }, 45_000);

  it('hands off from the northbound leg detour to the normal pickup and map logic', () => {
    const sim = new DeepFlightSim(map, new Set());
    const pilot = new TripodLegPilot(sim);
    while (!sim.collectible?.collected && sim.phase === 'fly' && sim.t < 40) sim.update(DT, { ...idle, ...pilot.intent() });
    expect(sim.collectible?.collectedId).toBe('tripod_leg');
    expect(sim.spottedBy).toBe(-1);
    const ap = new FlightAutopilot(sim);
    while (sim.phase === 'fly' && sim.t < 75) sim.update(DT, { ...idle, ...ap.intent() });
    expect(sim.phase).toBe('locking');
  }, 15_000);
});
