// Flight hazard geometry. Pure, allocation-free.

export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** Is (px,py) inside the cone from (ox,oy) facing `angle` with half-angle `half` and length `range`? */
export function pointInCone(
  px: number,
  py: number,
  ox: number,
  oy: number,
  angle: number,
  half: number,
  range: number,
): boolean {
  const dx = px - ox;
  const dy = py - oy;
  const d2 = dx * dx + dy * dy;
  if (d2 > range * range) return false;
  if (d2 < 1e-6) return true;
  return Math.abs(wrapAngle(Math.atan2(dy, dx) - angle)) <= half;
}

export function pointInCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

export interface SegHit {
  /** Unit normal pointing from the segment toward the circle centre. */
  nx: number;
  ny: number;
  /** How far the circle overlaps the segment. */
  depth: number;
}

/** Circle vs segment. Writes into `out` and returns true on overlap. */
export function circleSegment(
  cx: number,
  cy: number,
  r: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  out: SegHit,
): boolean {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby;
  let t = len2 > 0 ? ((cx - ax) * abx + (cy - ay) * aby) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = ax + abx * t;
  const qy = ay + aby * t;
  const dx = cx - qx;
  const dy = cy - qy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return false;
  const d = Math.sqrt(d2);
  if (d > 1e-6) {
    out.nx = dx / d;
    out.ny = dy / d;
  } else {
    // centre exactly on the line: push along the segment's left normal
    const l = Math.sqrt(len2) || 1;
    out.nx = -aby / l;
    out.ny = abx / l;
  }
  out.depth = r - d;
  return true;
}
