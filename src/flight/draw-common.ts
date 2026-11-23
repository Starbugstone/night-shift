// Drawing shared by the tutorial flight scene and the deep-level flight scene.
import type { Assets, Vec2 } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import { GLOW, drawGlow, drawSprite, easeOutBack, rgbOf } from '../core/fx';
import { clamp, drawPortrait, panel, paragraph, text, wrap } from '../ui/draw';
import { C, font } from '../ui/theme';
import type { EntryDef, RoadDef } from '../levels/types';
import { drawSaucerFallback } from './props';
import { DASH, FLIGHT_HUD, RING_R, SAUCER, saucerSpeed, type DashState, type Saucer } from './sim';

export const ROAD_W = 120;
export type GroundTheme = 'farm' | 'town' | 'suburb' | 'city';
/** Plain road surface, used to paint clean junctions (matches road_v/road_h asphalt). */
export const ROAD_BASE: Record<GroundTheme, string> = { farm: '#6e5841', town: '#343756', suburb: '#343756', city: '#2f3150' };
export const CONE_R = 300;
const SAUCER_DRAW = FLIGHT_HUD.saucer;
/** Rim lights on saucer_top.svg: 10 pads on a circle of r 58.5 about (80, 76) in its 160 box. */
const RIM_LIGHTS = 10;
const RIM_R = (58.5 / 160) * SAUCER_DRAW;
const RIM_CY = (-4 / 160) * SAUCER_DRAW;

export function roadRect(r: RoadDef): { x: number; y: number; w: number; h: number } {
  return r.dir === 'h'
    ? { x: r.from, y: r.at - ROAD_W / 2, w: r.to - r.from, h: ROAD_W }
    : { x: r.at - ROAD_W / 2, y: r.from, w: ROAD_W, h: r.to - r.from };
}

/** One road, culled to the view. Farm roads are dirt, everything else asphalt. */
export function drawRoad(g: CanvasRenderingContext2D, assets: Assets, r: RoadDef, theme: GroundTheme, camX: number, camY: number): void {
  const farm = theme === 'farm';
  const W = ROAD_W;
  const { x, y, w, h } = roadRect(r);
  if (x > camX + VIEW_W || x + w < camX || y > camY + VIEW_H || y + h < camY) return;
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
      for (let xx = x0; xx < Math.min(x + w, camX + VIEW_W); xx += 540) drawSprite(g, img, xx, y, 540.5, W);
    } else {
      const y0 = y + Math.max(0, Math.floor((camY - y) / 540)) * 540;
      for (let yy = y0; yy < Math.min(y + h, camY + VIEW_H); yy += 540) drawSprite(g, img, x, yy, W, 540.5);
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

/**
 * Feathered light-cone sprites (one per half-angle and colour), pointing along +x from the
 * left-middle with radius CONE_R. Full strength inside ~80% of the real cone, fading out just
 * past its edge, so what looks lit is what gets you spotted.
 */
export class ConeSprites {
  private readonly cache = new Map<string, HTMLCanvasElement | null>();

  get(half: number, rgb = '255,236,170'): HTMLCanvasElement | null {
    const key = `${Math.round(half * 1000)}|${rgb}`;
    const hit = this.cache.get(key);
    if (hit !== undefined) return hit;
    let c: HTMLCanvasElement | null = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    const outer = Math.min(Math.PI / 2 - 0.02, half * 1.1);
    const inner = half * 0.78;
    const v = c?.getContext('2d') ?? null;
    if (c && v) {
      c.width = CONE_R + 2;
      c.height = Math.ceil(2 * CONE_R * Math.sin(outer)) + 4;
      v.translate(0, c.height / 2);
      const grad = v.createRadialGradient(0, 0, 8, 0, 0, CONE_R);
      grad.addColorStop(0, `rgba(${rgb},0.7)`);
      grad.addColorStop(0.7, `rgba(${rgb},0.27)`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      v.fillStyle = grad;
      v.globalCompositeOperation = 'lighter';
      const layers = 10;
      v.globalAlpha = 1 / layers;
      for (let i = 0; i < layers; i++) {
        const a = outer + (inner - outer) * (i / (layers - 1));
        v.beginPath();
        v.moveTo(0, 0);
        v.arc(0, 0, CONE_R, -a, a);
        v.closePath();
        v.fill();
      }
    } else c = null;
    this.cache.set(key, c);
    return c;
  }

  /**
   * Draw a cone from (x,y) along `angle`, `range` long, with a crisp edge so the hit shape reads.
   * `hot` (0..1): this cone is the one seeing the saucer, so it burns red. `lead` (-1 / 0 / +1):
   * which side it is sweeping towards; that edge is drawn heavier.
   */
  draw(g: CanvasRenderingContext2D, x: number, y: number, angle: number, half: number, range: number, rgb = '255,236,170', edge = 0.35, hot = 0, lead = 0): void {
    const spr = this.get(half, rgb);
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    const k = range / CONE_R;
    if (spr) {
      g.globalCompositeOperation = 'lighter';
      g.scale(k, k);
      g.drawImage(spr, 0, -spr.height / 2);
      if (hot > 0) {
        const red = this.get(half, GLOW.red);
        if (red) {
          g.globalAlpha = Math.min(1, hot);
          g.drawImage(red, 0, -red.height / 2);
          g.globalAlpha = 1;
        }
      }
      g.scale(1 / k, 1 / k);
      g.globalCompositeOperation = 'source-over';
    }
    if (edge > 0) {
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, range, -half, half);
      g.closePath();
      g.lineJoin = 'round';
      if (hot > 0) {
        g.lineWidth = 4.5;
        g.strokeStyle = HOT_EDGE;
        g.globalAlpha = 0.55 + 0.45 * hot;
      } else {
        g.lineWidth = 2.5;
        g.strokeStyle = rgbOf(rgb);
        g.globalAlpha = Math.min(1, edge);
      }
      g.stroke();
      if (lead !== 0) {
        // the edge it is sweeping towards
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(Math.cos(lead * half) * range, Math.sin(lead * half) * range);
        g.lineWidth = 5;
        g.lineCap = 'round';
        g.globalAlpha = Math.min(1, edge * 2.2);
        g.stroke();
        g.lineCap = 'butt';
      }
      g.globalAlpha = 1;
    }
    g.restore();
  }
}

const HOT_EDGE = '#ff5d73';

export interface SaucerLook {
  locking: boolean;
  /** Seconds since lock-on started (locking only). */
  st: number;
  wobble: number;
  /** Afterburner state for the cooldown ring (optional). */
  dash?: DashState | null;
  /** Seconds left of the post-respawn safe window: the saucer sits in a shield bubble. */
  ghost?: number;
  /** Full length of that window, for the bubble's countdown arc. */
  ghostMax?: number;
}

export function drawSaucer(g: CanvasRenderingContext2D, assets: Assets, s: Saucer, t: number, rm: boolean, look: SaucerLook): void {
  const sp = saucerSpeed(s);
  const k = Math.min(1, sp / SAUCER.maxSpeed);
  const dashing = !!look.dash && look.dash.active > 0;
  // streaks
  if (k > 0.4 && !rm) {
    const kk = Math.min(1, k);
    g.strokeStyle = dashing ? '#ffd27a' : C.mint;
    g.globalAlpha = dashing ? 0.85 : (kk - 0.4) * 0.8;
    g.lineWidth = dashing ? 6 : 4;
    g.lineCap = 'round';
    const ux = s.vx / (sp || 1);
    const uy = s.vy / (sp || 1);
    const len = dashing ? 170 : 90 + kk * 60;
    for (let i = -1; i <= 1; i++) {
      const ox = -uy * i * 26;
      const oy = ux * i * 26;
      g.beginPath();
      g.moveTo(s.x - ux * 50 + ox, s.y - uy * 50 + oy);
      g.lineTo(s.x - ux * (len - Math.abs(i) * 20) + ox, s.y - uy * (len - Math.abs(i) * 20) + oy);
      g.stroke();
    }
    g.lineCap = 'butt';
    g.globalAlpha = 1;
  }
  if (look.locking) {
    const a = Math.min(1, look.st / 0.3);
    const flick = rm ? 0 : Math.sin(t * 20) * 5;
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.mint, s.x, s.y, 80 + a * 50 + flick, 80 + a * 50 + flick, 0.75 * a);
    drawGlow(g, GLOW.white, s.x, s.y, 40 + a * 16, 40 + a * 16, 0.5 * a);
    g.globalCompositeOperation = 'source-over';
  }
  const hover = 1 - k;
  const wave = rm ? 0 : Math.sin(t * 2.4);
  const bob = 1 + wave * 0.028 * hover;
  const lockShrink = look.locking ? 1 - Math.min(0.15, look.st * 0.2) : 1;
  const ghost = look.ghost ?? 0;
  if (ghost > 0) g.globalAlpha = rm ? 0.75 : 0.72 + 0.14 * Math.sin(t * 9);
  g.save();
  g.translate(s.x, s.y - (wave * 0.5 + 0.5) * 3 * hover);
  if (look.wobble !== 0 && !rm) g.rotate(look.wobble * 0.3);
  if (s.stun > 0 && !rm) g.rotate(Math.sin(t * 40) * 0.25);
  const va = Math.atan2(s.vy, s.vx);
  g.rotate(va);
  const squash = Math.min(1, k);
  g.scale((1 - 0.14 * squash) * bob * lockShrink, (1 + 0.04 * squash) * bob * lockShrink);
  g.rotate(-va);
  const img = assets.get('flight/saucer_top');
  if (img) {
    drawSprite(g, img, -SAUCER_DRAW / 2, -SAUCER_DRAW / 2, SAUCER_DRAW, SAUCER_DRAW);
    g.globalCompositeOperation = 'lighter';
    const head = rm ? -1 : Math.floor(t * (look.locking ? 26 : 9)) % RIM_LIGHTS;
    for (let i = 0; i < RIM_LIGHTS; i++) {
      const back = head < 0 ? 2 : (head - i + RIM_LIGHTS) % RIM_LIGHTS;
      if (back > 2) continue;
      const a = -Math.PI / 2 + (i / RIM_LIGHTS) * Math.PI * 2;
      drawGlow(g, i % 2 === 0 ? GLOW.amber : GLOW.mint, Math.cos(a) * RIM_R, RIM_CY + Math.sin(a) * RIM_R, 11, 11, back === 0 ? 1 : back === 1 ? 0.55 : 0.25);
    }
    g.globalCompositeOperation = 'source-over';
  } else drawSaucerFallback(g, SAUCER_DRAW, t);
  g.restore();
  g.globalAlpha = 1;
  if (ghost > 0) {
    // checkpoint shield: nothing can see you until the arc runs out
    const r = SAUCER_DRAW / 2 + 15;
    const left = Math.min(1, ghost / (look.ghostMax ?? 1.6));
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.mint, s.x, s.y, r + 26, r + 26, 0.22 + 0.2 * left);
    g.globalCompositeOperation = 'source-over';
    g.beginPath();
    g.arc(s.x, s.y, r, 0, Math.PI * 2);
    g.globalAlpha = 0.14;
    g.fillStyle = C.mint;
    g.fill();
    g.globalAlpha = 0.4;
    g.lineWidth = 3;
    g.strokeStyle = C.mint;
    g.stroke();
    g.globalAlpha = 1;
    g.beginPath();
    g.arc(s.x, s.y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.stroke();
    g.lineCap = 'butt';
  }
  // afterburner cooldown ring: fills back up round the saucer, flashes when ready
  const d = look.dash;
  if (d) {
    const r = SAUCER_DRAW / 2 + 8;
    if (d.cool > 0 && d.active <= 0) {
      const f = 1 - d.cool / DASH.cooldown;
      g.lineWidth = 5;
      g.strokeStyle = 'rgba(27,20,51,0.5)';
      g.beginPath();
      g.arc(s.x, s.y, r, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = C.amber;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(s.x, s.y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, f));
      g.stroke();
      g.lineCap = 'butt';
    } else if (d.active <= 0) {
      g.lineWidth = 2;
      g.strokeStyle = 'rgba(255,210,122,0.45)';
      g.beginPath();
      g.arc(s.x, s.y, r, 0, Math.PI * 2);
      g.stroke();
    }
  }
}

export interface RingLook {
  /** Saucer is in this ring (lock progress > 0). */
  active: boolean;
  fraction: number;
  locked: boolean;
  /** Seconds since lock-on (locked only). */
  st: number;
  /** Dimmed (e.g. another target is the one you're heading for). */
  dim?: number;
}

export function drawEntryRing(g: CanvasRenderingContext2D, assets: Assets, e: EntryDef, i: number, t: number, rm: boolean, look: RingLook, camX: number): void {
  const snap = look.locked ? (rm ? 1 : easeOutBack(look.st / 0.28)) : 0;
  const pulse = (rm ? 1 : 1 + Math.sin(t * 3 + i) * 0.05) * (1 - 0.24 * snap);
  g.save();
  g.translate(e.x, e.y);
  g.scale(pulse, pulse);
  g.globalCompositeOperation = 'lighter';
  g.beginPath();
  g.arc(0, 0, RING_R, 0, Math.PI * 2);
  g.fillStyle = look.locked ? 'rgba(124,255,203,0.42)' : look.active ? 'rgba(124,255,203,0.28)' : 'rgba(124,255,203,0.12)';
  g.fill();
  g.globalCompositeOperation = 'source-over';
  g.rotate(rm ? 0 : t * 0.7 + (look.locked ? look.st * 5 : 0));
  const img = assets.get('flight/entry_ring');
  if (img) drawSprite(g, img, -RING_R, -RING_R, RING_R * 2, RING_R * 2);
  else {
    g.setLineDash(RING_DASH);
    g.lineWidth = 6;
    g.strokeStyle = C.mint;
    g.beginPath();
    g.arc(0, 0, RING_R - 4, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash(NO_DASH);
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, 0, RING_R * 0.55, 0, Math.PI * 2);
    g.stroke();
  }
  g.restore();
  if (look.active && look.fraction > 0 && !look.locked) {
    const f = look.fraction;
    g.lineWidth = 10;
    g.beginPath();
    g.arc(e.x, e.y, RING_R + 10, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(27,20,51,0.55)';
    g.stroke();
    g.beginPath();
    g.arc(e.x, e.y, RING_R + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f);
    g.lineCap = 'round';
    g.strokeStyle = C.mint;
    g.stroke();
    g.lineCap = 'butt';
    const ha = -Math.PI / 2 + Math.PI * 2 * f;
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.white, e.x + Math.cos(ha) * (RING_R + 10), e.y + Math.sin(ha) * (RING_R + 10), 16, 16, 0.9);
    g.globalCompositeOperation = 'source-over';
  }
  // label pill (text and widths measured once per entry)
  let lab = labels.get(e);
  if (!lab) {
    const a = `${e.route} — `;
    g.font = font(19, 800);
    lab = {
      a,
      wa: g.measureText(a).width,
      wb: g.measureText(e.difficulty).width,
      calm: e.difficulty.includes('easy') || e.difficulty.includes('safe') || e.difficulty.includes('short'),
    };
    labels.set(e, lab);
  }
  const w = lab.wa + lab.wb + 28;
  const ly = e.labelSide === 'above' ? e.y - RING_R - 34 : e.y + RING_R + 34;
  const x0 = clamp(e.x - w / 2, camX + 8, camX + VIEW_W - 8 - w);
  panel(g, x0, ly - 20, w, 40, 'rgba(27,20,51,0.9)', 20, C.mint, 2, 0);
  text(g, lab.a, x0 + 14, ly + 1, 19, C.mint, 'left', 800);
  text(g, e.difficulty, x0 + 14 + lab.wa, ly + 1, 19, lab.calm ? C.text : C.amberHi, 'left', 800);
}

const RING_DASH = [16, 10];
const NO_DASH: number[] = [];
const labels = new WeakMap<EntryDef, { a: string; wa: number; wb: number; calm: boolean }>();

/** Zib's speech bubble in the bottom-left corner (screen space). */
export function drawZibBubble(g: CanvasRenderingContext2D, assets: Assets, msg: string, zibT: number, t: number, rm: boolean, panic = false): void {
  const a = clamp(Math.min(zibT * 4, (2.8 - zibT) * 6), 0, 1);
  const slide = rm ? 0 : (1 - a) * 30;
  g.globalAlpha = a;
  const lines = wrap(g, msg, 340, 19, 700);
  const h = Math.max(64, 24 + lines.length * 24);
  const by = VIEW_H - 28 - h + slide;
  panel(g, 112, by, VIEW_W - 136, h, C.paper, 18, C.ink, 3, 0);
  g.beginPath();
  g.moveTo(114, by + h - 26);
  g.lineTo(96, by + h - 12);
  g.lineTo(116, by + h - 10);
  g.fillStyle = C.paper;
  g.fill();
  paragraph(g, msg, 128, by + 12, 340, 19, C.paperInk, 24, 'left', 700);
  if (!(panic && assets.get('ui/zib_panic') && drawPanic(g, assets, 58, VIEW_H - 66 + slide, 84))) drawPortrait(g, assets, 'zib', 58, VIEW_H - 66 + slide, 84, t);
  g.globalAlpha = 1;
}

function drawPanic(g: CanvasRenderingContext2D, assets: Assets, x: number, y: number, size: number): boolean {
  const img = assets.get('ui/zib_panic');
  if (!img) return false;
  g.drawImage(img, x - size / 2, y - size / 2, size, size);
  return true;
}

/** Off-screen arrow at the screen edge pointing at world point p, with a label. */
export function drawTargetArrow(g: CanvasRenderingContext2D, assets: Assets, p: Vec2, camX: number, camY: number, label: string, color: string, t: number, rm: boolean, top = 150, bottom = 170): boolean {
  const tx = p.x - camX;
  const ty = p.y - camY;
  if (tx > -30 && tx < VIEW_W + 30 && ty > -30 && ty < VIEW_H + 30) return false;
  const ang = Math.atan2(ty - VIEW_H / 2, tx - VIEW_W / 2);
  const ex = clamp(VIEW_W / 2 + Math.cos(ang) * 400, 40, VIEW_W - 40);
  const ey = clamp(VIEW_H / 2 + Math.sin(ang) * 600, top, VIEW_H - bottom);
  const bounce = rm ? 0 : Math.sin(t * 6) * 5;
  g.save();
  g.translate(ex + Math.cos(ang) * bounce, ey + Math.sin(ang) * bounce);
  g.rotate(ang);
  const img = assets.get('ui/target_marker');
  if (img) {
    g.rotate(Math.PI / 2);
    g.drawImage(img, -24, -24, 48, 48);
  } else {
    g.beginPath();
    g.moveTo(22, 0);
    g.lineTo(-12, -18);
    g.lineTo(-4, 0);
    g.lineTo(-12, 18);
    g.closePath();
    g.fillStyle = color;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = C.ink;
    g.stroke();
  }
  g.restore();
  text(g, label, ex, ey + (Math.sin(ang) < 0 ? 34 : -34), 15, color, 'center', 800, true);
  return true;
}
