// L5 "Pier Pressure": the seaside ground (sea, sand, boardwalks), primitive fallbacks for the pier
// props and the bunting flags (docs/GDD-3-new-shifts.md L5 "Look"). Sea is dark Pine with sparse
// twinkles, sand a desaturated Ochre, boardwalks Wood. Amber lives only on the lighthouse lamp and
// the chip kiosk. Every draw has a primitive fallback; nothing allocates per frame.
import type { Assets } from '../contracts';
import { drawSprite } from '../core/fx';
import type { WireHazard } from './hazards';

export type GroundKey = 'flight/ground_sea' | 'flight/ground_sand' | 'flight/boardwalk_v' | 'flight/boardwalk_h';

/** A rectangle of ground, tiled with its sprite (540 px tiles; boardwalks 90 px wide). */
export interface GroundPatch {
  key: GroundKey;
  x: number;
  y: number;
  w: number;
  h: number;
}

const INK = '#1b1433';
const PINE = '#16302e';
const PINE_HI = '#1f3d3a';
const ICE = 'rgba(212,236,245,0.35)';
const SAND = '#7f6f52';
const SAND_DOT = '#6c5e45';
const WOOD = '#6a4c36';
const WOOD_LINE = '#4e3727';
const FALLBACK: Record<GroundKey, string> = {
  'flight/ground_sea': PINE,
  'flight/ground_sand': SAND,
  'flight/boardwalk_v': WOOD,
  'flight/boardwalk_h': WOOD,
};

function tile(key: GroundKey): { w: number; h: number } {
  return key === 'flight/boardwalk_v' ? { w: 90, h: 540 } : key === 'flight/boardwalk_h' ? { w: 540, h: 90 } : { w: 540, h: 540 };
}

function patch(g: CanvasRenderingContext2D, assets: Assets, p: GroundPatch, cx: number, cy: number, viewW: number, viewH: number, speckles: Float32Array): void {
  const x0 = Math.max(p.x, cx - 2);
  const y0 = Math.max(p.y, cy - 2);
  const x1 = Math.min(p.x + p.w, cx + viewW + 2);
  const y1 = Math.min(p.y + p.h, cy + viewH + 2);
  if (x1 <= x0 || y1 <= y0) return;
  const img = assets.get(p.key);
  g.save();
  g.beginPath();
  g.rect(x0, y0, x1 - x0, y1 - y0);
  g.clip();
  if (img) {
    const { w, h } = tile(p.key);
    const tx = p.x + Math.floor((x0 - p.x) / w) * w;
    const ty = p.y + Math.floor((y0 - p.y) / h) * h;
    for (let y = ty; y < y1; y += h) for (let x = tx; x < x1; x += w) drawSprite(g, img, x, y, w + 0.5, h + 0.5);
    g.restore();
    return;
  }
  g.fillStyle = FALLBACK[p.key];
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (p.key === 'flight/ground_sea') {
    // faint Ice wave dashes and a few twinkles
    g.fillStyle = ICE;
    for (let i = 0; i < speckles.length; i += 3) {
      const x = speckles[i]!;
      const y = speckles[i + 1]!;
      if (x < x0 - 30 || x > x1 || y < y0 || y > y1) continue;
      const r = speckles[i + 2]!;
      if (r > 6.3) {
        g.globalAlpha = 0.6;
        g.fillRect(x, y, 2, 2);
        g.globalAlpha = 1;
      } else g.fillRect(x, y, r * 4, 1.5);
    }
  } else if (p.key === 'flight/ground_sand') {
    g.fillStyle = SAND_DOT;
    for (let i = 0; i < speckles.length; i += 3) {
      const x = speckles[i]!;
      const y = speckles[i + 1]!;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      g.fillRect(x, y, speckles[i + 2]! * 0.6, speckles[i + 2]! * 0.4);
    }
  } else {
    // planks across the walk, a darker rail each side
    const vertical = p.key === 'flight/boardwalk_v';
    g.fillStyle = WOOD_LINE;
    if (vertical) {
      for (let y = p.y + Math.floor((y0 - p.y) / 18) * 18; y < y1; y += 18) g.fillRect(p.x, y, p.w, 2);
      g.fillRect(p.x, y0, 5, y1 - y0);
      g.fillRect(p.x + p.w - 5, y0, 5, y1 - y0);
    } else {
      for (let x = p.x + Math.floor((x0 - p.x) / 18) * 18; x < x1; x += 18) g.fillRect(x, p.y, 2, p.h);
      g.fillRect(x0, p.y, x1 - x0, 5);
      g.fillRect(x0, p.y + p.h - 5, x1 - x0, 5);
    }
  }
  g.restore();
}

/** Sea everywhere, then the sand and boardwalk patches in order. */
export function drawPierGround(
  g: CanvasRenderingContext2D, assets: Assets, patches: readonly GroundPatch[], cx: number, cy: number,
  viewW: number, viewH: number, speckles: Float32Array,
): void {
  const sea = assets.get('flight/ground_sea');
  if (sea) {
    const T = 540;
    const x0 = Math.floor(cx / T) * T;
    const y0 = Math.floor(cy / T) * T;
    for (let y = y0; y < cy + viewH; y += T) for (let x = x0; x < cx + viewW; x += T) drawSprite(g, sea, x, y, T + 0.5, T + 0.5);
  } else {
    patch(g, assets, { key: 'flight/ground_sea', x: cx - 20, y: cy - 20, w: viewW + 40, h: viewH + 40 }, cx, cy, viewW, viewH, speckles);
  }
  for (const p of patches) patch(g, assets, p, cx, cy, viewW, viewH, speckles);
}

function blob(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string): void {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.stroke();
}

/** Primitive fallback for a pier prop (PropKind 'pier'), centred on the origin in a w×h box. */
export function drawPierProp(g: CanvasRenderingContext2D, key: string, w: number, h: number): void {
  const x = -w / 2;
  const y = -h / 2;
  switch (key) {
    case 'flight/marine_park_top': {
      blob(g, x + 4, y + 4, w - 8, h - 8, 18, '#5f6f86');
      // flat service roof (north), round show pool, bleachers (south)
      blob(g, x + 150, y + 20, 200, 90, 8, '#7d8aa0');
      g.beginPath();
      g.ellipse(-20, 20, w * 0.3, h * 0.26, 0, 0, Math.PI * 2);
      g.fillStyle = PINE_HI;
      g.fill();
      g.stroke();
      g.strokeStyle = ICE;
      g.lineWidth = 2;
      for (let r = 18; r < 70; r += 22) {
        g.beginPath();
        g.ellipse(-20, 20, r * 1.3, r, 0, 0, Math.PI * 2);
        g.stroke();
      }
      g.fillStyle = '#9a6a6a';
      for (let i = 0; i < 4; i++) g.fillRect(x + 30, y + h - 60 + i * 12, w - 60, 6);
      break;
    }
    case 'flight/lighthouse_top': {
      g.beginPath();
      g.ellipse(0, 0, w * 0.48, h * 0.46, 0, 0, Math.PI * 2);
      g.fillStyle = '#4a4f5e';
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = INK;
      g.stroke();
      g.beginPath();
      g.arc(0, 0, w * 0.3, 0, Math.PI * 2);
      g.fillStyle = '#e9e4da';
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(0, 0, w * 0.13, 0, Math.PI * 2);
      g.fillStyle = '#c9a25a';
      g.fill();
      g.stroke();
      break;
    }
    case 'flight/fish_market_top': {
      blob(g, x + 4, y + 4, w - 8, h - 8, 8, '#6d7a84');
      g.fillStyle = 'rgba(255,255,255,0.12)';
      for (let xx = x + 16; xx < x + w - 10; xx += 16) g.fillRect(xx, y + 8, 4, h - 16);
      blob(g, x + 50, y + 34, 60, 50, 4, '#4a545c');
      blob(g, x + w - 30, y + 110, 24, 80, 3, '#3e4850');
      break;
    }
    case 'flight/boat_moored_top': {
      g.beginPath();
      g.moveTo(0, y + 4);
      g.quadraticCurveTo(w * 0.5, y + h * 0.35, w * 0.4, y + h - 8);
      g.lineTo(-w * 0.4, y + h - 8);
      g.quadraticCurveTo(-w * 0.5, y + h * 0.35, 0, y + 4);
      g.closePath();
      g.fillStyle = '#ddd6c8';
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = INK;
      g.stroke();
      g.fillStyle = '#7d6a5a';
      g.fillRect(-4, y + h * 0.3, 8, h * 0.45);
      g.beginPath();
      g.arc(0, y + h * 0.38, 6, 0, Math.PI * 2);
      g.fillStyle = INK;
      g.fill();
      break;
    }
    case 'flight/harbour_crane_top':
    case 'flight/lifeguard_tower_top': {
      blob(g, x + w * 0.2, y + h * 0.2, w * 0.6, h * 0.6, 6, key === 'flight/harbour_crane_top' ? '#b08a3a' : '#c8c0b0');
      g.lineWidth = 6;
      g.strokeStyle = INK;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(key === 'flight/harbour_crane_top' ? w * 0.5 : 0, key === 'flight/harbour_crane_top' ? -h * 0.5 : -h * 0.1);
      g.stroke();
      break;
    }
    case 'flight/chip_kiosk_top': {
      blob(g, x + 4, y + 4, w - 8, h - 8, 10, '#8a5a4a');
      g.fillStyle = '#f2d6a0';
      for (let i = 0; i < 4; i++) g.fillRect(x + 10 + i * ((w - 20) / 4), y + 8, (w - 20) / 8, h - 16);
      break;
    }
    case 'flight/beach_hut_top': {
      blob(g, x + 4, y + 4, w - 8, h - 8, 6, '#c8c0d8');
      g.fillStyle = '#6f86a8';
      for (let xx = x + 10; xx < x + w - 10; xx += 16) g.fillRect(xx, y + 6, 8, h - 12);
      break;
    }
    default:
      blob(g, x + 4, y + 4, w - 8, h - 8, 10, '#5c6478');
  }
}

const FLAGS = ['#d0607a', '#6f86a8', '#b9a0d0', '#c8c0d8'] as const;

/** Little pennants hanging off a bunting line (the line itself is drawn like a power line). */
export function drawBuntingFlags(g: CanvasRenderingContext2D, d: WireHazard, sag: number): void {
  const len = Math.hypot(d.bx - d.ax, d.by - d.ay);
  const n = Math.max(2, Math.floor(len / 34));
  const midx = (d.ax + d.bx) / 2;
  const midy = (d.ay + d.by) / 2 + sag;
  g.lineWidth = 1.5;
  g.strokeStyle = INK;
  for (let i = 1; i < n; i++) {
    const k = i / n;
    // point on the quadratic sag curve
    const u = 1 - k;
    const x = u * u * d.ax + 2 * u * k * midx + k * k * d.bx;
    const y = u * u * d.ay + 2 * u * k * midy + k * k * d.by;
    g.beginPath();
    g.moveTo(x - 7, y);
    g.lineTo(x + 7, y);
    g.lineTo(x, y + 13);
    g.closePath();
    g.fillStyle = FLAGS[i % FLAGS.length]!;
    g.fill();
    g.stroke();
  }
}
