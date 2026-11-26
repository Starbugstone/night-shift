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
import { autopilotController, runHeadless } from './flight-deep-harness';

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

  it('cues Zib’s recognition on the first queue approach, even during the launch banner', () => {
    const run = new DeepRun(LEVEL11, LEVELS.indexOf(LEVEL11));
    const ctx = {
      pointer: { ...idle }, assets: { get: () => undefined }, audio: { sfx() {} },
      upgrades: new Set<never>(), tutorial: false, time: 0, reducedMotion: true,
    };
    const opts = { ctx, level: LEVEL11, run, onLocked() {}, onSunrise() {}, onQuit() {} };
    const first = new DeepFlightScene(opts);
    first.sim.place(PILOT_QUEUE.x, PILOT_QUEUE.y, 0);
    first.update(DT);
    expect(first.bannerT).toBeGreaterThan(0);
    expect(first.queueBarkT).toBeGreaterThan(0);
    const next = new DeepFlightScene(opts);
    next.sim.place(PILOT_QUEUE.x, PILOT_QUEUE.y, 0);
    next.update(DT);
    expect(next.queueBarkT).toBe(0);
  });

  it('the projector alone catches a direct launch to each entry at every tested phase', () => {
    for (const delay of BEELINE_DELAYS) {
      for (const entry of map.targets.flatMap(t => t.entries)) {
        const sim = new DeepFlightSim({ ...map, hazards: [DRIVE_IN_PROJECTOR] }, new Set(), delay);
        while (sim.phase === 'fly' && sim.t < delay + 14) sim.update(DT, press(sim, entry));
        expect(sim.phase, `${entry.roomId} from ${delay}s`).toBe('spotted');
        expect(sim.spottedBy).toBe(0);
      }
    }
  });

  it('keeps the entire wait pocket, west road, queue, pickup and Church Lane dark', () => {
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
    for (let y = 235; y <= 355; y += 12) {
      for (let x = 255; x <= 1620; x += 15) points.push({ x, y });
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
    field.sample(5);
    expect(field.tell[0]).toBe(1);
    expect(field.detect(550, 1300, noPorches)).toBe(-1);
    field.sample(6.1);
    expect(field.tell[0]).toBe(0);
    expect(field.detect(550, 1300, noPorches)).toBe(0);
    const bend = SNEEZE_SHORTCUT[1];
    const finish = SNEEZE_SHORTCUT[2];
    const angle = Math.atan2(finish.y - bend.y, finish.x - bend.x);
    for (const offset of [-28, -21, -14, -7, 0, 7, 14, 21, 28]) {
      const y = bend.y + offset;
      const capX = ray.x - Math.sqrt(ray.range ** 2 - (ray.y - y) ** 2);
      for (const fuse of [0.8, 1]) {
        let exposure = 0;
        let clearExposure = 0;
        for (let i = 0; i < 1000; i++) {
          const sec = i / 1000 * 1.5;
          const dx = SAUCER.maxSpeed * sec;
          const pastBend = Math.max(0, dx - (bend.x - capX));
          const wx = Math.min(bend.x, capX + dx) + pastBend * Math.cos(angle);
          const wy = y + pastBend * Math.sin(angle);
          field.sample(6 + sec);
          if (field.on[0] && pointInCone(wx, wy, ray.x, ray.y, ray.base, ray.half, ray.range)) exposure += 0.0015;
          field.sample(8 + sec);
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
    expect(standard.stars.slice(0, 2)).toEqual([true, true]);
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
