// Spatial checks on the flight maps: rings sit on their building, hazards leave the rings
// lockable, power lines leave real alternative routes, and the spawn isn't hidden by the HUD.
import { describe, expect, it } from 'vitest';
import { VIEW_H, VIEW_W } from '../src/contracts';
import { ART } from '../src/art-manifest';
import { ROOMS } from '../src/abduct/rooms';
import { circleSegment } from '../src/flight/geometry';
import { FLIGHT_HUD, LOCK, POWER_LINE, RING_R, SAUCER, maxWireOffset } from '../src/flight/sim';
import { LEVELS, isTutorial } from '../src/levels/levels';

const TUTORIALS = LEVELS.filter(isTutorial);
import type { FlightMap, PowerLineDef } from '../src/levels/types';

const LOCK_R = RING_R * LOCK.insideFrac;
const HIT_R = SAUCER.radius * POWER_LINE.hitFrac;

function segDist(px: number, py: number, l: PowerLineDef): number {
  const dx = l.bx - l.ax;
  const dy = l.by - l.ay;
  const t = Math.max(0, Math.min(1, ((px - l.ax) * dx + (py - l.ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (l.ax + dx * t), py - (l.ay + dy * t));
}

/** Grid flood fill over saucer-centre positions the power lines and world edges allow. */
function reachable(m: FlightMap, to: { x: number; y: number }, extraWalls: PowerLineDef[] = []): boolean {
  const CELL = 8;
  const cols = Math.ceil(m.w / CELL);
  const rows = Math.ceil(m.h / CELL);
  const walls = [...m.powerLines, ...extraWalls];
  const hit = { nx: 0, ny: 0, depth: 0 };
  const free = (c: number, r: number): boolean => {
    const x = c * CELL + CELL / 2;
    const y = r * CELL + CELL / 2;
    if (x < SAUCER.radius || x > m.w - SAUCER.radius || y < SAUCER.radius || y > m.h - SAUCER.radius) return false;
    return !walls.some((l) => circleSegment(x, y, HIT_R, l.ax, l.ay, l.bx, l.by, hit));
  };
  const seen = new Uint8Array(cols * rows);
  const sc = Math.floor(m.start.x / CELL);
  const sr = Math.floor(m.start.y / CELL);
  const tc = Math.floor(to.x / CELL);
  const tr = Math.floor(to.y / CELL);
  const q = [sc + sr * cols];
  seen[q[0]!] = 1;
  while (q.length) {
    const i = q.pop()!;
    const c = i % cols;
    const r = (i - c) / cols;
    if (Math.abs(c - tc) <= 1 && Math.abs(r - tr) <= 1) return true;
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const j = nc + nr * cols;
      if (seen[j] || !free(nc, nr)) continue;
      seen[j] = 1;
      q.push(j);
    }
  }
  return false;
}

describe('entry rings', () => {
  it('sit on their target building footprint', () => {
    for (const lv of TUTORIALS) {
      const t = lv.map.target;
      const { w, h } = ART[t.key]!;
      for (const e of lv.map.entries) {
        expect(e.x, `${e.roomId} x`).toBeGreaterThanOrEqual(t.x - w / 2 - 4);
        expect(e.x, `${e.roomId} x`).toBeLessThanOrEqual(t.x + w / 2 + 4);
        expect(e.y, `${e.roomId} y`).toBeGreaterThanOrEqual(t.y - h / 2 - 12);
        expect(e.y, `${e.roomId} y`).toBeLessThanOrEqual(t.y + h / 2 + 4);
      }
    }
  });

  it("keep the whole lock-on circle outside every dog's biggest bark", () => {
    for (const lv of TUTORIALS)
      for (const e of lv.map.entries)
        for (const d of lv.map.dogs) expect(Math.hypot(e.x - d.x, e.y - d.y), e.roomId).toBeGreaterThanOrEqual(d.rMax + LOCK_R);
  });

  it('are at least 120 px from every power line (capsule never reaches the lock circle)', () => {
    for (const lv of TUTORIALS)
      for (const e of lv.map.entries)
        for (const l of lv.map.powerLines) {
          const d = segDist(e.x, e.y, l);
          expect(d, `${e.roomId} vs line ${JSON.stringify(l)}`).toBeGreaterThanOrEqual(120);
          expect(d - HIT_R).toBeGreaterThan(LOCK_R);
        }
  });

  it('are not inside a neon scramble zone', () => {
    for (const lv of TUTORIALS)
      for (const e of lv.map.entries) for (const n of lv.map.neons) expect(Math.hypot(e.x - n.x, e.y - n.y)).toBeGreaterThan(n.r + LOCK_R);
  });

  it('are reachable from the spawn', () => {
    for (const lv of TUTORIALS) for (const e of lv.map.entries) expect(reachable(lv.map, e), e.roomId).toBe(true);
  });
});

describe('level 2 power lines', () => {
  const m = TUTORIALS[1]!.map;
  const [skylight, loading] = m.entries;

  it('draw within a few px of their collision segment, with poles fully on the map', () => {
    expect(maxWireOffset()).toBeLessThanOrEqual(8);
    for (const l of m.powerLines)
      for (const x of [l.ax, l.bx]) {
        expect(x).toBeGreaterThanOrEqual(POWER_LINE.poleR);
        expect(x).toBeLessThanOrEqual(m.w - POWER_LINE.poleR);
      }
  });

  it('every pole is a streetlight or a free-standing pole, never stranded mid-air off a lamp', () => {
    const lights = m.props.filter((p) => p.kind === 'streetlight');
    for (const l of m.powerLines)
      for (const [x, y] of [
        [l.ax, l.ay],
        [l.bx, l.by],
      ] as const) {
        const nearest = Math.min(...lights.map((p) => Math.hypot(p.x - x, p.y - y)));
        // either snapped onto a streetlight, or clearly its own pole (not a near-miss beside one)
        expect(nearest < 1 || nearest > 40, `pole (${x},${y}) is ${nearest.toFixed(1)} px from a streetlight`).toBe(true);
      }
  });

  it('leave two genuinely different ways north: Main St and the east yard', () => {
    // Block Main St: the loading door must still be reachable round the east side.
    const mainSt: PowerLineDef = { ax: 400, ay: 950, bx: 700, by: 950 };
    expect(reachable(m, loading, [mainSt])).toBe(true);
    // Block the east yard: the skylight must still be reachable up Main St.
    const eastYard: PowerLineDef = { ax: 840, ay: 950, bx: 1080, by: 950 };
    expect(reachable(m, skylight, [eastYard])).toBe(true);
    // The east gap is a proper corridor, not a squeeze past a pole.
    const east = Math.max(...m.powerLines.filter((l) => l.ay > 900).map((l) => Math.max(l.ax, l.bx)));
    expect(m.w - SAUCER.radius - (east + HIT_R)).toBeGreaterThanOrEqual(130);
  });
});

describe('spawn framing', () => {
  it('saucer starts clear of the tutorial pill and Zib’s bubble', () => {
    for (const lv of TUTORIALS) {
      const m = lv.map;
      const camY = Math.max(0, Math.min(m.h - VIEW_H, m.start.y - VIEW_H * FLIGHT_HUD.camFrac));
      const sy = m.start.y - camY;
      const top = sy - FLIGHT_HUD.saucer / 2;
      const bottom = sy + FLIGHT_HUD.saucer / 2;
      expect(bottom, lv.id).toBeLessThanOrEqual(FLIGHT_HUD.tutY - FLIGHT_HUD.tutH / 2 - 10);
      expect(bottom).toBeLessThan(FLIGHT_HUD.zibTop);
      expect(top).toBeGreaterThan(180); // below the HUD and work-order banner
      expect(m.start.x).toBeGreaterThan(VIEW_W / 4);
    }
  });
});

describe('par times', () => {
  it('need a clean, decisive run but are achievable', () => {
    for (const lv of TUTORIALS) {
      const m = lv.map;
      const fastestFlight = Math.min(...m.entries.map((e) => Math.hypot(e.x - m.start.x, e.y - m.start.y) / SAUCER.maxSpeed)) + LOCK.time;
      const fastestRoom = Math.min(...m.entries.map((e) => ROOMS[e.roomId].route.reduce((s, w) => s + w.seconds, 0)));
      const floor = fastestFlight + fastestRoom;
      // room for a ~15 s flight and a slightly slower-than-scripted abduction…
      expect(lv.parSec, lv.id).toBeGreaterThanOrEqual(floor + 12);
      // …but not so generous that dawdling earns Night owl
      expect(lv.parSec, lv.id).toBeLessThanOrEqual(floor + 26);
    }
    expect(TUTORIALS.map((l) => l.parSec)).toEqual([42, 48]);
  });
});
