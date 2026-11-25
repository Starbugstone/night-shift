// Static road and junction painters shared by the flight maps.
import type { Assets } from '../contracts';
import { drawSprite } from '../core/fx';
import type { RoadDef } from '../levels/types';

export const ROAD_W = 120;
export type GroundTheme = 'farm' | 'town' | 'suburb' | 'city' | 'pier' | 'clinic' | 'ship' | 'badlands';
/** Plain road surface, used to paint clean junctions (matches road_v/road_h asphalt). */
export const ROAD_BASE: Record<GroundTheme, string> = {
  badlands: '#513c42', farm: '#6e5841', town: '#343756', suburb: '#343756', city: '#2f3150',
  // v3 starting values; each level's code owner tunes its own
  pier: '#4a3f3a', clinic: '#343a52', ship: '#3a3550',
};
export function roadRect(r: RoadDef): { x: number; y: number; w: number; h: number } {
  return r.dir === 'h'
    ? { x: r.from, y: r.at - ROAD_W / 2, w: r.to - r.from, h: ROAD_W }
    : { x: r.at - ROAD_W / 2, y: r.from, w: ROAD_W, h: r.to - r.from };
}

/** One road, culled to the view. Farm roads are dirt, everything else asphalt. */
export function drawRoad(g: CanvasRenderingContext2D, assets: Assets, r: RoadDef, theme: GroundTheme, camX: number, camY: number, viewW: number, viewH: number): void {
  const farm = theme === 'farm';
  const W = ROAD_W;
  const { x, y, w, h } = roadRect(r);
  if (x > camX + viewW || x + w < camX || y > camY + viewH || y + h < camY) return;
  const key = farm ? (r.dir === 'h' ? 'flight/dirt_road_h' : 'flight/dirt_road_v') : r.dir === 'h' ? 'flight/road_h' : 'flight/road_v';
  const img = assets.get(key);
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  if (img) {
    // only the tiles in view
    if (r.dir === 'h') {
      const x0 = x + Math.max(0, Math.floor((camX - x) / 540)) * 540;
      for (let xx = x0; xx < Math.min(x + w, camX + viewW); xx += 540) drawSprite(g, img, xx, y, 540.5, W);
    } else {
      const y0 = y + Math.max(0, Math.floor((camY - y) / 540)) * 540;
      for (let yy = y0; yy < Math.min(y + h, camY + viewH); yy += 540) drawSprite(g, img, x, yy, W, 540.5);
    }
  } else if (farm) {
    drawDirtRoad(g, r.dir, x, y, w, h);
  } else {
    g.fillStyle = ROAD_BASE[theme];
    g.fillRect(x, y, w, h);
    g.fillStyle = '#e3c35a';
    if (r.dir === 'h') for (let xx = x + 10; xx < x + w; xx += 70) g.fillRect(xx, y + W / 2 - 3, 36, 6);
    else for (let yy = y + 10; yy < y + h; yy += 70) g.fillRect(x + W / 2 - 3, yy, 6, 36);
  }
  g.restore();
}

/** Paint each road crossing / T-junction as plain surface so curbs and markings don't run through it. */
export function drawJunctions(g: CanvasRenderingContext2D, roads: readonly RoadDef[], theme: GroundTheme): void {
  g.fillStyle = ROAD_BASE[theme];
  for (const a of roads) {
    if (a.dir !== 'h') continue;
    for (const b of roads) {
      if (b.dir !== 'v') continue;
      const ra = roadRect(a);
      const rb = roadRect(b);
      const x0 = Math.max(ra.x, rb.x);
      const y0 = Math.max(ra.y, rb.y);
      const x1 = Math.min(ra.x + ra.w, rb.x + rb.w);
      const y1 = Math.min(ra.y + ra.h, rb.y + rb.h);
      if (x1 > x0 && y1 > y0) g.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  }
}

export function drawDirtRoad(g: CanvasRenderingContext2D, dir: 'h' | 'v', x: number, y: number, w: number, h: number): void {
  const along = dir === 'h' ? w : h;
  // (u, v) → along / across the road
  const rect = (u: number, v: number, du: number, dv: number): void => {
    if (dir === 'h') g.fillRect(x + u, y + v, du, dv);
    else g.fillRect(x + v, y + u, dv, du);
  };
  g.fillStyle = ROAD_BASE.farm;
  rect(0, 0, along, ROAD_W);
  g.fillStyle = '#4f5a3a';
  rect(0, 0, along, 7);
  rect(0, ROAD_W - 7, along, 7);
  g.fillStyle = '#5a4634';
  rect(0, 24, along, 14);
  rect(0, ROAD_W - 38, along, 14);
  g.fillStyle = '#56663e';
  for (let u = 6; u < along; u += 46) rect(u, ROAD_W / 2 - 4, 28, 8);
  g.fillStyle = '#8a7356';
  for (let u = 17; u < along; u += 61) {
    rect(u, 46, 4, 4);
    rect(u + 29, 78, 5, 4);
  }
}
