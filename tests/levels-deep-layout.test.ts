// Spatial checks on the deep flight maps (L3, L4): nothing built on a road, nothing built inside
// something else, every lamp and camera mounted on something, every ring on its painted feature.
import { describe, expect, it } from 'vitest';
import { ART } from '../src/art-manifest';
import { TRAFFIC_LANE, TRAFFIC_SCALE, type HazardDef } from '../src/flight/hazards';
import { ROAD_W } from '../src/flight/draw-common';
import { LEVEL3, LEVEL4 } from '../src/levels/deep-levels';
import type { PropDef, RoadDef } from '../src/levels/types';
import anchorsMd from '../docs/ART_ANCHORS.md?raw';

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const boxOf = (p: PropDef): Box => {
  const s = ART[p.key]!;
  let w = p.w ?? s.w;
  let h = p.h ?? s.h;
  if (p.rot && Math.abs(Math.abs(p.rot) - Math.PI / 2) < 0.01) [w, h] = [h, w];
  return { x0: p.x - w / 2, y0: p.y - h / 2, x1: p.x + w / 2, y1: p.y + h / 2 };
};
const roadBox = (r: RoadDef): Box =>
  r.dir === 'h' ? { x0: Math.min(r.from, r.to), y0: r.at - ROAD_W / 2, x1: Math.max(r.from, r.to), y1: r.at + ROAD_W / 2 } : { x0: r.at - ROAD_W / 2, y0: Math.min(r.from, r.to), x1: r.at + ROAD_W / 2, y1: Math.max(r.from, r.to) };
const grow = (b: Box, m: number): Box => ({ x0: b.x0 - m, y0: b.y0 - m, x1: b.x1 + m, y1: b.y1 + m });
const overlaps = (a: Box, b: Box): boolean => Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0) && Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0);
const inBox = (x: number, y: number, b: Box): boolean => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
/** Distance from a point to a box's outline: negative inside, positive outside. */
const edgeDist = (x: number, y: number, b: Box): number => {
  if (x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1) return -Math.min(x - b.x0, b.x1 - x, y - b.y0, b.y1 - y);
  return Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.y0 - y, 0, y - b.y1));
};

const BUILDING_KINDS = new Set(['suburb_house', 'highrise', 'civic']);
const KERB = 10;

// docs/ART_ANCHORS.md feature for each route's ring
const FEATURE: Record<string, string> = {
  dave_roof: 'roof_hatch',
  dave_patio: 'patio_door',
  barb_chimney: 'chimney',
  barb_backdoor: 'back_door',
  gary_skylight: 'garage_skylight',
  gary_garagedoor: 'garage_door',
  nigel_skylight: 'skylight',
  nigel_loading: 'loading_bay',
  kev_vent: 'roof_vent',
  kev_fireescape: 'fire_escape',
  mayor_clocktower: 'clock_tower',
  mayor_elevator: 'elevator_housing',
};
const ANCHORS = new Map<string, { x: number; y: number }>();
for (const line of anchorsMd.split('\n')) {
  const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*\((\d+),\s*(\d+)\)\s*\|/);
  if (m) ANCHORS.set(`flight/${m[1]}/${m[2]}`, { x: Number(m[3]), y: Number(m[4]) });
}

for (const lv of [LEVEL3, LEVEL4]) {
  const m = lv.map;
  const roads = m.roads.map(roadBox);
  const solids = [...m.groundProps, ...m.props, ...m.targets.map((t) => t.building)].filter((p) => p.kind !== 'streetlight');
  const buildings = [...m.props, ...m.targets.map((t) => t.building)].filter((p) => BUILDING_KINDS.has(p.kind)).map((p) => ({ p, b: boxOf(p) }));
  const name = (p: PropDef): string => `${p.key.replace('flight/', '')}@(${p.x},${p.y})`;
  const onRoad = (x: number, y: number, margin = 0): boolean => roads.some((r) => inBox(x, y, grow(r, margin)));

  describe(`${lv.id} layout`, () => {
    it('keeps every building, tree, hedge, pool and trampoline off the roads, with a kerb', () => {
      for (const p of solids) for (const [i, r] of roads.entries()) expect(overlaps(boxOf(p), grow(r, KERB)), `${name(p)} on road ${i}`).toBe(false);
    });

    it('never builds one prop inside another', () => {
      for (let i = 0; i < solids.length; i++)
        for (let j = i + 1; j < solids.length; j++) expect(overlaps(boxOf(solids[i]!), boxOf(solids[j]!)), `${name(solids[i]!)} / ${name(solids[j]!)}`).toBe(false);
    });

    it('fills every road corner and junction (no notches)', () => {
      const H = ROAD_W / 2;
      for (const h of m.roads.filter((r) => r.dir === 'h'))
        for (const v of m.roads.filter((r) => r.dir === 'v')) {
          // the centre lines cross (counting a road that stops at the other's centre line)
          if (v.at < Math.min(h.from, h.to) - H || v.at > Math.max(h.from, h.to) + H) continue;
          if (h.at < Math.min(v.from, v.to) - H || h.at > Math.max(v.from, v.to) + H) continue;
          for (const dx of [-1, 0, 1])
            for (const dy of [-1, 0, 1]) {
              const x = v.at + dx * (H - 1);
              const y = h.at + dy * (H - 1);
              expect(onRoad(x, y), `junction (${v.at},${h.at}) corner (${x},${y})`).toBe(true);
            }
        }
    });

    it('drives every car on the asphalt, never through a building', () => {
      for (const d of m.hazards) {
        if (d.type !== 'car') continue;
        const pts = d.loop ? [...d.path, d.path[0]!] : d.path;
        for (let k = 1; k < pts.length; k++) {
          const a = pts[k - 1]!;
          const b = pts[k]!;
          const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 10);
          for (let s = 0; s <= n; s++) {
            const x = a.x + ((b.x - a.x) * s) / n;
            const y = a.y + ((b.y - a.y) * s) / n;
            expect(onRoad(x, y), `car at (${x},${y})`).toBe(true);
            // the car body (80 px wide, half-length 75) clears every building
            const body: Box = { x0: x - 40, y0: y - 40, x1: x + 40, y1: y + 40 };
            for (const { p, b: bb } of buildings) expect(overlaps(body, bb), `car at (${x},${y}) in ${name(p)}`).toBe(false);
          }
        }
      }
    });

    it('mounts every porch light on a house wall or its own garden post', () => {
      for (const d of m.hazards) {
        if (d.type !== 'porch') continue;
        const at = `porch (${d.x},${d.y})`;
        if (d.mount === 'post') {
          for (const { p, b } of buildings) expect(edgeDist(d.x, d.y, b), `${at} vs ${name(p)}`).toBeGreaterThanOrEqual(20);
          expect(onRoad(d.x, d.y, 15), at).toBe(false);
        } else {
          const best = Math.min(...buildings.map(({ b }) => Math.abs(edgeDist(d.x, d.y, b))));
          expect(best, `${at} is ${best} px off any wall`).toBeLessThanOrEqual(2);
          expect(onRoad(d.x, d.y, 15), at).toBe(false);
        }
      }
    });

    it('mounts every camera on a roof or a street pole', () => {
      for (const d of m.hazards) {
        if (d.type !== 'camera') continue;
        const at = `camera (${d.x},${d.y})`;
        if (d.mount === 'pole') {
          for (const { p, b } of buildings) expect(edgeDist(d.x, d.y, b), `${at} vs ${name(p)}`).toBeGreaterThanOrEqual(20);
          expect(onRoad(d.x, d.y, 20), at).toBe(false);
        } else {
          // on a roof, its 40 px body not hanging off the edge
          const roofs = buildings.filter(({ b }) => edgeDist(d.x, d.y, b) <= -8);
          expect(roofs.length, `${at} is not on a roof`).toBeGreaterThan(0);
        }
      }
    });

    it('puts every office window on a facade, lighting the street outside it', () => {
      for (const d of m.hazards) {
        if (d.type !== 'window') continue;
        const at = `window (${d.wx},${d.wy})`;
        const home = buildings.find(({ b }) => edgeDist(d.wx, d.wy, b) <= 0 && edgeDist(d.wx, d.wy, b) >= -16);
        expect(home, `${at} is not on a facade`).toBeDefined();
        // the pool's centre is in the street, clear of the building
        expect(edgeDist(d.x, d.y, home!.b), at).toBeGreaterThanOrEqual(d.r * 0.75);
      }
    });

    it('keeps the yard dogs off the roofs', () => {
      for (const d of m.hazards) {
        if (d.type !== 'dog') continue;
        const body: Box = { x0: d.x - 35, y0: d.y - 35, x1: d.x + 35, y1: d.y + 35 };
        for (const { p, b } of buildings) expect(overlaps(body, b), `dog (${d.x},${d.y}) on ${name(p)}`).toBe(false);
      }
    });

    it('lets opposing traffic pass without touching, inside the road', () => {
      const traffic = m.hazards.filter((d): d is Extract<HazardDef, { type: 'traffic' }> => d.type === 'traffic');
      const carW = ART['flight/sedan_top']!.w * TRAFFIC_SCALE;
      for (const d of traffic) {
        const road = m.roads.find((r) => r.dir === d.dir && Math.abs(r.at - d.at) <= ROAD_W / 2);
        expect(road, `lane ${d.at}`).toBeDefined();
        expect(Math.abs(d.at - road!.at), `lane ${d.at}`).toBe(TRAFFIC_LANE);
        expect(TRAFFIC_LANE + carW / 2, `lane ${d.at}`).toBeLessThanOrEqual(ROAD_W / 2);
      }
      expect(2 * TRAFFIC_LANE - carW).toBeGreaterThanOrEqual(8);
    });

    it('hangs every street glow on a streetlight off the carriageway', () => {
      const lights = m.props.filter((p) => p.kind === 'streetlight');
      const watchers = m.hazards.filter((d) => d.type === 'watcher');
      for (const l of m.lamps) {
        if (watchers.some((w) => w.x === l.x && w.y === l.y)) continue;
        expect(lights.some((p) => p.x === l.x && p.y === l.y), `lamp (${l.x},${l.y}) has no streetlight`).toBe(true);
        expect(onRoad(l.x, l.y), `lamp (${l.x},${l.y}) on the road`).toBe(false);
      }
    });

    it('puts every ring on its ART_ANCHORS feature', () => {
      for (const t of m.targets) {
        const spec = ART[t.building.key]!;
        const b = boxOf(t.building);
        for (const e of t.entries) {
          const a = ANCHORS.get(`${t.building.key}/${FEATURE[e.roomId]}`);
          expect(a, e.roomId).toBeDefined();
          expect(e.x, e.roomId).toBe(Math.round(b.x0 + (a!.x * (b.x1 - b.x0)) / spec.w));
          expect(e.y, e.roomId).toBe(Math.round(b.y0 + (a!.y * (b.y1 - b.y0)) / spec.h));
        }
      }
    });
  });
}
