// L5 "Pier Pressure" flight signature (docs/GDD-3-new-shifts.md, L5): the lighthouse beam.
//
// A map-wide, hard-edged beam turns from a fixed lamp (one turn ≈ 7 s). Tall props (masts, the
// harbour crane, the marine-park wall, the fish market) cast plain dark shadow wedges the beam does
// not reach. The lamp never moves, so every wedge is precomputed once per hazard: an angular
// interval seen from the lamp and a radial interval behind the caster. The drawn beam is exactly
// the hit area (lit = beam wedge minus shadows), and an amber ghost line leads the beam's front
// edge by `lead` seconds. Pure, allocation-free per frame.
import { wrapAngle } from './geometry';

/** A tall prop that throws a shadow: a disc (x, y, r) seen from the lamp, shadow `len` px long behind it. */
export interface ShadowCaster {
  x: number;
  y: number;
  r: number;
  len: number;
}

export interface LighthouseHazard {
  type: 'lighthouse';
  /** The lamp. */
  x: number;
  y: number;
  /** Seconds per turn; negative turns anticlockwise. */
  period: number;
  /** Beam half-angle, radians. */
  half: number;
  /** Reach of the beam, px (map-wide). */
  range: number;
  /** Beam angle at t = 0, radians. */
  phase: number;
  /** The amber ghost line runs this many seconds ahead of the front edge. */
  lead: number;
  casters: readonly ShadowCaster[];
}

/** Precomputed shadow wedges for one lamp. */
export class ShadowWedges {
  readonly count: number;
  /** Centre angle and angular half-width of each wedge, seen from the lamp. */
  readonly angle: Float64Array;
  readonly width: Float64Array;
  /** Radial interval in shadow, px from the lamp. */
  readonly near: Float64Array;
  readonly far: Float64Array;

  constructor(d: LighthouseHazard) {
    const n = d.casters.length;
    this.count = n;
    this.angle = new Float64Array(n);
    this.width = new Float64Array(n);
    this.near = new Float64Array(n);
    this.far = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const c = d.casters[i]!;
      const dist = Math.max(1, Math.hypot(c.x - d.x, c.y - d.y));
      this.angle[i] = Math.atan2(c.y - d.y, c.x - d.x);
      this.width[i] = Math.asin(Math.min(1, c.r / dist));
      this.near[i] = dist;
      this.far[i] = dist + c.len;
    }
  }

  /** Is (x, y) — given as angle and distance from the lamp — inside any wedge? */
  shades(angle: number, dist: number): boolean {
    for (let i = 0; i < this.count; i++) {
      if (dist < this.near[i]! || dist > this.far[i]!) continue;
      if (Math.abs(wrapAngle(angle - this.angle[i]!)) <= this.width[i]!) return true;
    }
    return false;
  }
}

const wedges = new WeakMap<LighthouseHazard, ShadowWedges>();

export function shadowsOf(d: LighthouseHazard): ShadowWedges {
  let w = wedges.get(d);
  if (!w) {
    w = new ShadowWedges(d);
    wedges.set(d, w);
  }
  return w;
}

/** Beam centre angle at hazard time t. */
export function beamAngle(d: LighthouseHazard, t: number): number {
  return wrapAngle(d.phase + (Math.PI * 2 * t) / d.period);
}

/** Does the beam (centred on `angle`) light (x, y)? The same test the drawing uses. */
export function lighthouseCovers(d: LighthouseHazard, angle: number, x: number, y: number): boolean {
  const dx = x - d.x;
  const dy = y - d.y;
  const d2 = dx * dx + dy * dy;
  if (d2 > d.range * d.range) return false;
  const a = Math.atan2(dy, dx);
  if (Math.abs(wrapAngle(a - angle)) > d.half) return false;
  return !shadowsOf(d).shades(a, Math.sqrt(d2));
}

/** Is (x, y) in a shadow wedge (whatever the beam is doing)? */
export function inLighthouseShadow(d: LighthouseHazard, x: number, y: number): boolean {
  const dx = x - d.x;
  const dy = y - d.y;
  return shadowsOf(d).shades(Math.atan2(dy, dx), Math.hypot(dx, dy));
}

// ------------------------------------------------------------------ drawing

const BEAM_FILL = 'rgba(255,240,205,0.22)';
const BEAM_EDGE = 'rgba(255,240,205,0.75)';
const SHADOW_FILL = 'rgba(6,10,22,0.34)';
const AMBER = '#ffd081';
const RED = '#ff697d';
const GHOST_DASH = [16, 12];
const NO_DASH: number[] = [];
const MAX_BREAKS = 64;
/** Scratch for the beam's angular breakpoints and the radial intervals lit between them. */
const breaks = new Float64Array(MAX_BREAKS);
const litFrom = new Float64Array(MAX_BREAKS);
const litTo = new Float64Array(MAX_BREAKS);
const actNear = new Float64Array(MAX_BREAKS);
const actFar = new Float64Array(MAX_BREAKS);

/** Radial intervals lit at relative angle `a` (absolute angle), into litFrom/litTo; returns the count. */
function litAt(d: LighthouseHazard, w: ShadowWedges, a: number): number {
  let n = 0;
  for (let i = 0; i < w.count && n < MAX_BREAKS; i++) {
    if (Math.abs(wrapAngle(a - w.angle[i]!)) > w.width[i]!) continue;
    // insertion sort by near edge
    let k = n++;
    while (k > 0 && actNear[k - 1]! > w.near[i]!) {
      actNear[k] = actNear[k - 1]!;
      actFar[k] = actFar[k - 1]!;
      k--;
    }
    actNear[k] = w.near[i]!;
    actFar[k] = w.far[i]!;
  }
  let count = 0;
  let r = 0;
  for (let i = 0; i < n; i++) {
    const s = Math.min(actNear[i]!, d.range);
    if (s > r) {
      litFrom[count] = r;
      litTo[count++] = s;
    }
    r = Math.max(r, actFar[i]!);
  }
  if (r < d.range) {
    litFrom[count] = r;
    litTo[count++] = d.range;
  }
  return count;
}

function sector(g: CanvasRenderingContext2D, x: number, y: number, r0: number, r1: number, a0: number, a1: number): void {
  g.moveTo(x + Math.cos(a0) * r0, y + Math.sin(a0) * r0);
  g.arc(x, y, r1, a0, a1);
  if (r0 > 0.5) g.arc(x, y, r0, a1, a0, true);
  else g.lineTo(x, y);
  g.closePath();
}

/** Stroke the lit parts of the ray at `a`. */
function ray(g: CanvasRenderingContext2D, d: LighthouseHazard, w: ShadowWedges, a: number): void {
  const n = litAt(d, w, a);
  const c = Math.cos(a);
  const s = Math.sin(a);
  for (let i = 0; i < n; i++) {
    g.moveTo(d.x + c * litFrom[i]!, d.y + s * litFrom[i]!);
    g.lineTo(d.x + c * litTo[i]!, d.y + s * litTo[i]!);
  }
}

/** Plain dark shadow wedges (always there: they are where you hide). */
export function drawLighthouseShadows(g: CanvasRenderingContext2D, d: LighthouseHazard): void {
  const w = shadowsOf(d);
  g.beginPath();
  for (let i = 0; i < w.count; i++) {
    sector(g, d.x, d.y, w.near[i]!, w.far[i]!, w.angle[i]! - w.width[i]!, w.angle[i]! + w.width[i]!);
  }
  g.fillStyle = SHADOW_FILL;
  g.fill();
}

/**
 * The beam at `angle`: lit sectors (beam minus shadows), hard edges, the amber ghost of the front
 * edge `d.lead` seconds ahead, and red edges while it has the saucer (`hot` > 0).
 */
export function drawLighthouseBeam(g: CanvasRenderingContext2D, d: LighthouseHazard, angle: number, hot: number, t: number, rm: boolean): void {
  const w = shadowsOf(d);
  const a0 = angle - d.half;
  const a1 = angle + d.half;
  // breakpoints: the beam edges and every shadow edge inside the beam
  let n = 0;
  breaks[n++] = a0;
  for (let i = 0; i < w.count && n < MAX_BREAKS - 2; i++) {
    for (let side = -1; side <= 1; side += 2) {
      const e = angle + wrapAngle(w.angle[i]! + side * w.width[i]! - angle);
      if (e > a0 && e < a1) breaks[n++] = e;
    }
  }
  breaks[n++] = a1;
  for (let i = 1; i < n; i++) {
    const v = breaks[i]!;
    let k = i;
    while (k > 0 && breaks[k - 1]! > v) {
      breaks[k] = breaks[k - 1]!;
      k--;
    }
    breaks[k] = v;
  }
  g.beginPath();
  for (let i = 0; i + 1 < n; i++) {
    const s0 = breaks[i]!;
    const s1 = breaks[i + 1]!;
    if (s1 - s0 < 1e-5) continue;
    const m = litAt(d, w, (s0 + s1) * 0.5);
    for (let k = 0; k < m; k++) sector(g, d.x, d.y, litFrom[k]!, litTo[k]!, s0, s1);
  }
  g.fillStyle = BEAM_FILL;
  g.globalCompositeOperation = 'lighter';
  g.fill();
  g.globalCompositeOperation = 'source-over';
  // hard edges (red where it has you)
  g.beginPath();
  ray(g, d, w, a0);
  ray(g, d, w, a1);
  g.lineWidth = hot > 0 ? 5.5 : 3.5;
  g.strokeStyle = hot > 0 ? RED : BEAM_EDGE;
  g.globalAlpha = hot > 0 ? hot : 1;
  g.stroke();
  g.globalAlpha = 1;
  // the amber ghost: where the front edge will be in `lead` seconds
  const turn = (Math.PI * 2) / d.period;
  const front = turn > 0 ? a1 : a0;
  g.beginPath();
  ray(g, d, w, front + turn * d.lead);
  g.setLineDash(GHOST_DASH);
  g.lineDashOffset = rm ? 0 : -t * 60;
  g.lineWidth = 3;
  g.strokeStyle = AMBER;
  g.globalAlpha = 0.85;
  g.stroke();
  g.globalAlpha = 1;
  g.setLineDash(NO_DASH);
  g.lineDashOffset = 0;
}
