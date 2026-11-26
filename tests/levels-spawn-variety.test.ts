// Openings and spawn variety across the whole game (2026-11-26 player report: "a lot of the levels start
// with a big watcher right in front of my ship ... I'm hitting the same town layout way too often").
//
// 1. No spawn gate. The beeline rule (AGENTS.md) must be met on the way, not by a fixed detector parked
//    across every straight line out of the spawn. A level may keep one only with a written reason, and
//    at most two levels in the whole game may do so.
// 2. Spawn variety. Each map's spawn falls in a zone (an edge third, or the centre). Neighbouring levels
//    in LEVELS order use different zones, and the game uses at least four zones.
//
// PENDING lists the levels still waiting for their rework. They shrink to empty: a pending level that
// already passes fails the test until it is taken off the list.
import { describe, expect, it } from 'vitest';
import type { Vec2 } from '../src/contracts';
import { HazardField, type HazardDef } from '../src/flight/hazards';
import { isDeep, LEVELS } from '../src/levels/levels';
import type { LevelDef } from '../src/levels/types';

/** Levels allowed to open on a fixed detector, with the story reason. At most two. */
const GATE_EXEMPT: Readonly<Record<string, string>> = {};

/** Levels whose spawn gate is still to be reworked. */
const PENDING_GATE = new Set(['level7', 'level8', 'level9']);
/** Levels whose spawn zone is still to be moved off their neighbours' zone. */
const PENDING_ZONE = new Set(['level8']);

/** Hazards whose origin travels: a patrol crossing the way out is fine, it is not a gate. */
const MOVING = new Set<HazardDef['type']>(['car', 'traffic', 'steward', 'squire', 'ambulance', 'heli', 'flock', 'wire', 'crane', 'gag']);
/** The opening: the stretch of each straight line out of the spawn that the first screen shows. */
const OPEN_FROM = 120;
const OPEN_TO = 900;
/** A detector further than this from the spawn is not "in front of the ship". */
const NEAR = 1000;

function origin(h: HazardDef): Vec2 | null {
  const o = h as unknown as Record<string, number>;
  if (typeof o.x === 'number' && typeof o.y === 'number') return { x: o.x, y: o.y };
  if (typeof o.wx === 'number') return { x: o.wx, y: o.wy! };
  return null;
}

function rings(l: LevelDef): Vec2[] {
  return isDeep(l) ? l.map.targets.flatMap(t => t.entries) : l.map.entries;
}

/**
 * Fixed detectors near the spawn that, together, cover part of every straight line from the spawn
 * to every ring. Empty when at least one line out of the spawn is clear of them.
 */
export function spawnGates(l: LevelDef): number[] {
  if (!isDeep(l)) return [];
  const { start, hazards } = l.map;
  const lines = rings(l).map(r => {
    const d = Math.hypot(r.x - start.x, r.y - start.y);
    const pts: Vec2[] = [];
    for (let s = OPEN_FROM; s <= Math.min(OPEN_TO, d); s += 20) {
      pts.push({ x: start.x + (r.x - start.x) * s / d, y: start.y + (r.y - start.y) * s / d });
    }
    return pts;
  });
  const lit = new Float64Array(8).fill(1);
  const hit = lines.map(() => false);
  const used = new Set<number>();
  hazards.forEach((h, i) => {
    const o = origin(h);
    if (MOVING.has(h.type) || !o || Math.hypot(o.x - start.x, o.y - start.y) > NEAR) return;
    const field = new HazardField([h]);
    for (let t = 0; t < 30; t += 0.1) {
      field.sample(t);
      lines.forEach((pts, k) => {
        if (!hit[k] && pts.some(p => field.detect(p.x, p.y, lit) === 0)) {
          hit[k] = true;
          used.add(i);
        }
      });
    }
  });
  return hit.every(Boolean) ? [...used].sort((a, b) => a - b) : [];
}

/** The edge third the spawn sits on (`S-mid`, `W-north`...), or `centre`. */
export function spawnZone(l: LevelDef): string {
  const { start, w, h } = l.map;
  const nx = start.x / w;
  const ny = start.y / h;
  const edges = [['W', nx], ['E', 1 - nx], ['N', ny], ['S', 1 - ny]] as const;
  const [edge, dist] = edges.reduce((a, b) => (b[1] < a[1] ? b : a));
  if (dist > 0.25) return 'centre';
  const along = edge === 'N' || edge === 'S' ? nx : ny;
  const third = along < 1 / 3 ? 0 : along < 2 / 3 ? 1 : 2;
  const names = edge === 'N' || edge === 'S' ? ['west', 'mid', 'east'] : ['north', 'mid', 'south'];
  return `${edge}-${names[third]}`;
}

describe('openings: no fixed detector parked in front of the spawn', () => {
  it('allows at most two exempt levels, each with a reason', () => {
    expect(Object.keys(GATE_EXEMPT).length).toBeLessThanOrEqual(2);
    for (const [id, why] of Object.entries(GATE_EXEMPT)) {
      expect(LEVELS.some(l => l.id === id), id).toBe(true);
      expect(why.length, `${id} needs a reason`).toBeGreaterThan(20);
    }
  });

  for (const l of LEVELS) {
    if (l.id in GATE_EXEMPT) continue;
    it(`${l.id}: ${PENDING_GATE.has(l.id) ? 'still waits for its rework (remove it from PENDING_GATE once fixed)' : 'puts the beeline catch on the way, not at the spawn'}`, () => {
      const gates = spawnGates(l).map(i => `#${i} ${(isDeep(l) && l.map.hazards[i]!.type) || ''}`);
      if (PENDING_GATE.has(l.id)) expect(gates, `${l.id} has no spawn gate any more: drop it from PENDING_GATE`).not.toEqual([]);
      else expect(gates, `${l.id} opens on a detector across every line out of the spawn`).toEqual([]);
    });
  }
});

describe('spawn variety', () => {
  it('neighbouring levels spawn in different zones', () => {
    const zones = LEVELS.map(spawnZone);
    const clash = (i: number) => (i > 0 && zones[i] === zones[i - 1]) || (i < LEVELS.length - 1 && zones[i] === zones[i + 1]);
    const bad: string[] = [];
    LEVELS.forEach((l, i) => {
      if (PENDING_ZONE.has(l.id)) {
        expect(clash(i), `${l.id} (${zones[i]}) no longer shares a zone with a neighbour: drop it from PENDING_ZONE`).toBe(true);
        return;
      }
      for (const j of [i - 1, i + 1]) {
        const n = LEVELS[j];
        if (n && !PENDING_ZONE.has(n.id) && zones[j] === zones[i] && j > i) bad.push(`${l.id} and ${n.id} both spawn ${zones[i]}`);
      }
    });
    expect(bad).toEqual([]);
  });

  it('uses at least four spawn zones across the game', () => {
    expect(new Set(LEVELS.map(spawnZone)).size).toBeGreaterThanOrEqual(4);
  });
});
