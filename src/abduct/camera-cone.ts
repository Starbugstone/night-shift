import { clamp, type Ragdoll } from './ragdoll';
import type { Building, Hazard } from './rooms/interior';
import type { Area } from './rooms/layout';

type Camera = Extract<Hazard, { kind: 'camera' }>;
const RAYS = 16;
const CORNER_EPSILON = 0.00001;

/** The wall-clipped polygon used by both the camera fuse and the renderer. */
export class CameraCone {
  readonly points: Float64Array;
  count = 0;
  private angle = NaN;
  private bodyAngle = 0;
  private readonly rays: Float64Array;
  private readonly corners: readonly number[];
  private readonly walls: readonly Area[];
  private left = 0;
  private right = 0;
  private top = 0;
  private bottom = 0;

  constructor(building: Building, private readonly camera: Camera) {
    const { x, y, range } = camera;
    const corners: number[] = [];
    this.walls = building.walls.filter(wall => x + range >= wall.x && x - range <= wall.x + wall.w &&
      y + range >= wall.y && y - range <= wall.y + wall.h);
    for (const wall of this.walls) {
      for (const wx of [wall.x, wall.x + wall.w]) {
        for (const wy of [wall.y, wall.y + wall.h]) {
          corners.push(Math.atan2(wy - y, wx - x));
        }
      }
    }
    this.corners = corners;
    this.rays = new Float64Array(RAYS + 1 + 2 * corners.length);
    this.points = new Float64Array(2 * (this.rays.length + 1));
  }

  update(angle: number): void {
    if (angle === this.angle) return;
    this.angle = angle;
    const { x, y, spread, range } = this.camera;
    const { rays, points } = this;
    let count = RAYS + 1;
    for (let i = 0; i < count; i++) rays[i] = -spread + 2 * spread * i / RAYS;
    for (const corner of this.corners) {
      const delta = Math.atan2(Math.sin(corner - angle), Math.cos(corner - angle));
      if (Math.abs(delta) >= spread - CORNER_EPSILON) continue;
      // Cast immediately to either side of a corner to preserve hard shadows.
      count = this.insertRay(count, delta - CORNER_EPSILON);
      count = this.insertRay(count, delta + CORNER_EPSILON);
    }

    points[0] = x;
    points[1] = y;
    this.left = this.right = x;
    this.top = this.bottom = y;
    for (let i = 0; i < count; i++) {
      const ray = angle + rays[i]!;
      const dx = Math.cos(ray);
      const dy = Math.sin(ray);
      const distance = this.wallDistance(x, y, dx, dy, range);
      const px = x + dx * distance;
      const py = y + dy * distance;
      points[2 * i + 2] = px;
      points[2 * i + 3] = py;
      this.left = Math.min(this.left, px);
      this.right = Math.max(this.right, px);
      this.top = Math.min(this.top, py);
      this.bottom = Math.max(this.bottom, py);
    }
    this.count = count + 1;
  }

  overlapsBody(body: Ragdoll, angle: number): boolean {
    this.bodyAngle = angle;
    return body.overlapsCircles(this.overlapsCircle);
  }

  private overlapsCircle = (x: number, y: number, r: number): boolean => {
    const dx = x - this.camera.x;
    const dy = y - this.camera.y;
    if (dx * dx + dy * dy > (this.camera.range + r) ** 2) return false;
    this.update(this.bodyAngle);
    if (x + r < this.left || x - r > this.right || y + r < this.top || y - r > this.bottom) return false;
    const { points, count } = this;
    let inside = false;
    let ax = points[2 * count - 2]!;
    let ay = points[2 * count - 1]!;
    for (let i = 0; i < count; i++) {
      const bx = points[2 * i]!;
      const by = points[2 * i + 1]!;
      const dx = bx - ax;
      const dy = by - ay;
      const lengthSq = dx * dx + dy * dy;
      if (lengthSq > 0) {
        const t = clamp(((x - ax) * dx + (y - ay) * dy) / lengthSq, 0, 1);
        const ox = x - ax - t * dx;
        const oy = y - ay - t * dy;
        if (ox * ox + oy * oy <= r * r) return true;
      }
      if ((ay > y) !== (by > y) && x < ax + dx * (y - ay) / dy) inside = !inside;
      ax = bx;
      ay = by;
    }
    return inside;
  };

  private insertRay(count: number, angle: number): number {
    let i = count;
    while (i > 0 && this.rays[i - 1]! > angle) {
      this.rays[i] = this.rays[i - 1]!;
      i--;
    }
    this.rays[i] = angle;
    return count + 1;
  }

  private wallDistance(x: number, y: number, dx: number, dy: number, range: number): number {
    let edge = range;
    for (const wall of this.walls) {
      if (dx === 0 && (x <= wall.x || x >= wall.x + wall.w)) continue;
      if (dy === 0 && (y <= wall.y || y >= wall.y + wall.h)) continue;
      const a = dx === 0 ? -Infinity : (wall.x - x) / dx;
      const b = dx === 0 ? Infinity : (wall.x + wall.w - x) / dx;
      const c = dy === 0 ? -Infinity : (wall.y - y) / dy;
      const d = dy === 0 ? Infinity : (wall.y + wall.h - y) / dy;
      const first = Math.max(0, Math.min(a, b), Math.min(c, d));
      if (first < Math.min(edge, Math.max(a, b), Math.max(c, d))) edge = first;
    }
    return edge;
  }
}
