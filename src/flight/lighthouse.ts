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
