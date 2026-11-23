// Headless driver for deep-level flight legs: real DeepFlightSim, finger from a controller,
// abductions stubbed as instant successes. Shared by the autopilot and difficulty tests.
import type { PointerState, UpgradeId, Vec2 } from '../src/contracts';
import { FlightAutopilot, exposureGrid, findPath, type ExposureGrid } from '../src/flight/autopilot';
import { DeepFlightSim, SAFE_WINDOW } from '../src/flight/deep-sim';
import type { DeepMap } from '../src/levels/types';

export interface SpotRecord {
  t: number;
  x: number;
  y: number;
  cause: string;
  hazard: number;
  /** Autopilot's last decision before the spot (debug). */
  note?: string;
}

export interface LegRecord {
  target: number;
  entry: number;
  /** Seconds of flight for this leg. */
  sec: number;
}

export interface HeadlessResult {
  done: boolean;
  totalSec: number;
  legs: LegRecord[];
  spots: SpotRecord[];
  bumps: number;
  dashes: number;
  trail: Vec2[];
}

export type Controller = ((sim: DeepFlightSim) => { down: boolean; x: number; y: number }) & { note?: () => string };

export function runHeadless(map: DeepMap, upgrades: UpgradeId[], make: (sim: DeepFlightSim) => Controller, limitSec = 400, stopOnSpot = false, t0 = 0): HeadlessResult {
  const sim = new DeepFlightSim(map, new Set(upgrades), t0);
  const ctl = make(sim);
  const p: PointerState = { down: false, x: 0, y: 0, pressed: false, released: false };
  const dt = 1 / 60;
  const res: HeadlessResult = { done: false, totalSec: 0, legs: [], spots: [], bumps: 0, dashes: 0, trail: [] };
  let legStart = 0;
  let lockT = -1;
  let spotT = -1;
  let checkpoint = { ...map.start };
  for (let f = 0; f < limitSec * 60; f++) {
    const t = f * dt;
    if (sim.phase === 'fly') {
      const it = ctl(sim);
      p.pressed = it.down && !p.down;
      p.released = !it.down && p.down;
      p.down = it.down;
      p.x = it.x;
      p.y = it.y;
    } else {
      p.pressed = false;
      p.released = p.down;
      p.down = false;
    }
    sim.update(dt, p);
    if (sim.st.bump >= 0) res.bumps++;
    if (sim.st.dashed) res.dashes++;
    if (f % 15 === 0) res.trail.push({ x: sim.saucer.x, y: sim.saucer.y });
    if (sim.phase === 'spotted' && spotT < 0) {
      spotT = t;
      const h = sim.spottedBy;
      res.spots.push({ t, x: Math.round(sim.saucer.x), y: Math.round(sim.saucer.y), cause: h >= 0 ? sim.field.spotCause(h) : '?', hazard: h, note: ctl.note?.() });
      if (stopOnSpot) break;
    }
    if (spotT >= 0 && t - spotT > 1.2) {
      spotT = -1;
      sim.place(checkpoint.x, checkpoint.y, SAFE_WINDOW);
    }
    if (sim.justLocked) lockT = t;
    if (lockT >= 0 && t - lockT > 0.9) {
      lockT = -1;
      const ref = sim.ringRef[sim.lockedRing]!;
      res.legs.push({ target: ref.target, entry: ref.entry, sec: t - legStart });
      const ring = sim.ringPos(ref.target, ref.entry);
      sim.markDelivered(ref.target);
      checkpoint = ring;
      if (sim.delivered.every(Boolean)) {
        res.done = true;
        res.totalSec = t;
        break;
      }
      sim.place(ring.x, ring.y, SAFE_WINDOW);
      legStart = t;
    }
    res.totalSec = t;
  }
  return res;
}

export function autopilotController(dash: boolean, order?: number[]): (sim: DeepFlightSim) => Controller {
  return (sim) => {
    const ap = new FlightAutopilot(sim, order, dash);
    const c: Controller = () => ap.intent();
    c.note = () => JSON.stringify(ap.last);
    return c;
  };
}

/**
 * Naive player: takes the shortest path round the solid things (wires, map edges) to the nearest
 * remaining ring at full speed, never waits, then brakes onto the ring and hovers to lock on.
 */
export function beelineController(sim: DeepFlightSim): Controller {
  const g = exposureGrid(sim.map);
  const blind: ExposureGrid = { ...g, exposure: new Float32Array(g.exposure.length), extra: new Float32Array(g.extra.length) };
  let path: Vec2[] = [];
  let k = 0;
  let goal: Vec2 | null = null;
  return () => {
    const s = sim.saucer;
    if (!goal || goal.x < -1e5 || Math.hypot((path[k]?.x ?? 0) - s.x, (path[k]?.y ?? 0) - s.y) > 400) {
      let best: { pts: Vec2[]; cost: number } | null = null;
      for (const r of sim.rings) {
        if (r.x < -1e5) continue;
        const p = findPath(blind, s, r);
        if (p && (!best || p.cost < best.cost)) {
          best = p;
          goal = r;
        }
      }
      if (!best) return { down: false, x: 0, y: 0 };
      path = best.pts;
      k = 0;
    }
    while (k < path.length - 1 && Math.hypot(path[k]!.x - s.x, path[k]!.y - s.y) < 70) k++;
    const q = path[k]!;
    const dx = q.x - s.x;
    const dy = q.y - s.y;
    const d = Math.hypot(dx, dy) || 1;
    const sx = s.x - sim.camX;
    const sy = s.y - sim.camY;
    const last = k === path.length - 1;
    if (last && d < 12 && Math.hypot(s.vx, s.vy) < 60) return { down: false, x: sx, y: sy };
    const lead = last ? Math.min(190, d * 1.4) : 190;
    const damp = last ? 0.35 : 0.1;
    return { down: true, x: sx + (dx / d) * lead - s.vx * damp, y: sy + (dy / d) * lead - s.vy * damp };
  };
}
