// Road corners on every flight map, present and future (all of LEVELS): where roads meet they
// overlap in a full road-wide square, and the square gets the road art's outer edge and kerb on
// every side no road carries on through (a bare patch at an L-corner was reported on L3).
import { describe, expect, it } from 'vitest';
import { JUNCTION_ART_SURFACE, ROAD_W, drawJunctions, roadRect } from '../src/flight/draw-common';
import { LEVELS } from '../src/levels/levels';

const EDGE = '#222440';
type Rect = { x: number; y: number; w: number; h: number };

function overlap(a: Rect, b: Rect): Rect | null {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

/** A canvas stand-in that records each fillRect with the fill colour at the time. */
function recorder() {
  const fills: (Rect & { color: string })[] = [];
  const g = {
    fillStyle: '',
    fillRect(x: number, y: number, w: number, h: number) { fills.push({ x, y, w, h, color: String(this.fillStyle) }); },
  };
  return { g: g as unknown as CanvasRenderingContext2D, fills };
}

describe.each(LEVELS.map(l => [l.id, l] as const))('%s roads', (_id, level) => {
  const roads = level.map.roads;
  const rects = roads.map(roadRect);
  // every place a horizontal and a vertical road meet, and every place they nearly meet
  const meets: { a: Rect; b: Rect; square: Rect; touching: boolean }[] = [];
  for (const a of roads) {
    if (a.dir !== 'h') continue;
    for (const b of roads) {
      if (b.dir !== 'v') continue;
      const ra = roadRect(a);
      const rb = roadRect(b);
      const grown = { x: rb.x - ROAD_W / 2, y: rb.y - ROAD_W / 2, w: rb.w + ROAD_W, h: rb.h + ROAD_W };
      if (!overlap(ra, grown)) continue;
      meets.push({ a: ra, b: rb, square: { x: rb.x, y: ra.y, w: ROAD_W, h: ROAD_W }, touching: Boolean(overlap(ra, rb)) });
    }
  }
  const junctions = meets.filter(m => m.touching).map(m => m.square);

  it('has no roads that stop just short of each other', () => {
    for (const m of meets) expect(m.touching, `roads near ${m.square.x},${m.square.y} leave a gap`).toBe(true);
  });

  it('paints every junction as a full road-wide square', () => {
    const { g, fills } = recorder();
    drawJunctions(g, roads, level.map.theme, true);
    const surface = level.map.theme === 'farm' ? null : JUNCTION_ART_SURFACE;
    for (const j of junctions) {
      expect(fills.some(f => (surface === null || f.color === surface) && f.x === j.x && f.y === j.y && f.w === ROAD_W && f.h === ROAD_W),
        `junction at ${j.x},${j.y}`).toBe(true);
    }
  });

  it("edges and kerbs every junction side that no road carries on through", () => {
    if (level.map.theme === 'farm') return; // dirt roads have no kerb
    const { g, fills } = recorder();
    drawJunctions(g, roads, level.map.theme, true);
    const edges = fills.filter(f => f.color === EDGE);
    for (const j of junctions) {
      const spansX = (r: Rect) => r.x <= j.x + 1 && r.x + r.w >= j.x + j.w - 1;
      const spansY = (r: Rect) => r.y <= j.y + 1 && r.y + r.h >= j.y + j.h - 1;
      const sides = {
        top: !rects.some(r => spansX(r) && r.y < j.y - 1),
        bottom: !rects.some(r => spansX(r) && r.y + r.h > j.y + j.h + 1),
        left: !rects.some(r => spansY(r) && r.x < j.x - 1),
        right: !rects.some(r => spansY(r) && r.x + r.w > j.x + j.w + 1),
      };
      const has = {
        top: edges.some(e => e.y === j.y && e.w >= j.w * 0.9 && e.x >= j.x - 1 && e.x + e.w <= j.x + j.w + 1),
        bottom: edges.some(e => e.y + e.h === j.y + j.h && e.w >= j.w * 0.9 && e.x >= j.x - 1 && e.x + e.w <= j.x + j.w + 1),
        left: edges.some(e => e.x === j.x && e.h >= j.h * 0.9 && e.y >= j.y - 1 && e.y + e.h <= j.y + j.h + 1),
        right: edges.some(e => e.x + e.w === j.x + j.w && e.h >= j.h * 0.9 && e.y >= j.y - 1 && e.y + e.h <= j.y + j.h + 1),
      };
      expect(has, `junction at ${j.x},${j.y}`).toEqual(sides);
    }
  });
});
