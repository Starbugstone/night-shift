export const STEP = 1 / 120;

export enum Joint {
  Head,
  Neck,
  Pelvis,
  NearElbow,
  NearHand,
  FarElbow,
  FarHand,
  NearKnee,
  NearFoot,
  FarKnee,
  FarFoot,
}

export interface Rect {
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

export interface Circle {
  kind: 'circle';
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
}

export interface Blade {
  kind: 'blade';
  x: number;
  y: number;
  angle: number;
  from: number;
  to: number;
  r: number;
  omega: number;
}

export type Solid = Rect | Circle | Blade;

export interface Pose {
  neckX: number;
  neckY: number;
  torso: number;
  head: number;
  nearArm: number;
  nearForearm: number;
  farArm: number;
  farForearm: number;
  nearThigh: number;
  nearShin: number;
  farThigh: number;
  farShin: number;
}

const LENGTHS = [40, 108, 55, 53, 55, 53, 63, 64, 63, 64] as const;
const BONES = [
  [Joint.Neck, Joint.Head], [Joint.Neck, Joint.Pelvis],
  [Joint.Neck, Joint.NearElbow], [Joint.NearElbow, Joint.NearHand],
  [Joint.Neck, Joint.FarElbow], [Joint.FarElbow, Joint.FarHand],
  [Joint.Pelvis, Joint.NearKnee], [Joint.NearKnee, Joint.NearFoot],
  [Joint.Pelvis, Joint.FarKnee], [Joint.FarKnee, Joint.FarFoot],
] as const;

const RADII = [32, 22, 31, 13, 11, 13, 11, 16, 14, 16, 14];
const INVERSE_MASS = [0.65, 0.34, 0.43, 1.15, 1.45, 1.15, 1.45, 0.95, 1.15, 0.95, 1.15];
const ANGLE_LIMITS = [
  // Relative to the direction of the incoming bone, in screen coordinates.
  [Joint.Pelvis, Joint.Neck, Joint.Head, -1.30, 1.30],
  [Joint.Pelvis, Joint.Neck, Joint.NearElbow, 0.85, 4.65],
  [Joint.Pelvis, Joint.Neck, Joint.FarElbow, 0.85, 4.65],
  [Joint.Neck, Joint.NearElbow, Joint.NearHand, -2.28, 0.60],
  [Joint.Neck, Joint.FarElbow, Joint.FarHand, -2.28, 0.60],
  [Joint.Neck, Joint.Pelvis, Joint.NearKnee, -1.95, 0.72],
  [Joint.Neck, Joint.Pelvis, Joint.FarKnee, -1.95, 0.72],
  [Joint.Pelvis, Joint.NearKnee, Joint.NearFoot, -0.45, 2.12],
  [Joint.Pelvis, Joint.FarKnee, Joint.FarFoot, -0.45, 2.12],
] as const;
const MIDPOINT_RADII = [24, 34, 12, 10, 12, 10, 15, 13, 15, 13];
const GRAVITY = 480;
const ITERATIONS = 8;
const TAU = Math.PI * 2;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Scratch result reused for both the ragdoll and loose props. */
export class Contact {
  nx = 0;
  ny = 0;
  depth = 0;
  vx = 0;
  vy = 0;

  private round(px: number, py: number, x: number, y: number, radius: number): boolean {
    const dx = px - x;
    const dy = py - y;
    const d2 = dx * dx + dy * dy;
    if (d2 >= radius * radius) return false;
    const distance = Math.sqrt(d2);
    this.nx = distance > 0.00001 ? dx / distance : 0;
    this.ny = distance > 0.00001 ? dy / distance : -1;
    this.depth = radius - distance;
    return true;
  }

  find(px: number, py: number, radius: number, solid: Solid): boolean {
    if (solid.kind === 'blade') {
      const x = px - solid.x;
      const y = py - solid.y;
      const cos = Math.cos(solid.angle);
      const sin = Math.sin(solid.angle);
      const along = clamp(x * cos + y * sin, solid.from, solid.to);
      const offsetX = cos * along;
      const offsetY = sin * along;
      if (!this.round(px, py, solid.x + offsetX, solid.y + offsetY, radius + solid.r)) return false;
      this.vx = -solid.omega * offsetY;
      this.vy = solid.omega * offsetX;
      return true;
    }

    this.vx = solid.vx;
    this.vy = solid.vy;
    if (solid.kind === 'circle') return this.round(px, py, solid.x, solid.y, radius + solid.r);

    const right = solid.x + solid.w;
    const bottom = solid.y + solid.h;
    if (px < solid.x || px > right || py < solid.y || py > bottom) {
      return this.round(px, py, clamp(px, solid.x, right), clamp(py, solid.y, bottom), radius);
    }

    const leftDist = px - solid.x;
    const rightDist = right - px;
    const topDist = py - solid.y;
    const bottomDist = bottom - py;
    const nearest = Math.min(leftDist, rightDist, topDist, bottomDist);
    this.nx = nearest === leftDist ? -1 : nearest === rightDist ? 1 : 0;
    this.ny = this.nx !== 0 ? 0 : nearest === topDist ? -1 : 1;
    this.depth = radius + nearest;
    return true;
  }
}

export class Ragdoll {
  readonly x = new Float64Array(RADII.length);
  readonly y = new Float64Array(RADII.length);
  private readonly oldX = new Float64Array(RADII.length);
  private readonly oldY = new Float64Array(RADII.length);
  private readonly vx = new Float64Array(RADII.length);
  private readonly vy = new Float64Array(RADII.length);
  private readonly contact = new Contact();
  private readonly contactX = new Float64Array(RADII.length);
  private readonly contactY = new Float64Array(RADII.length);
  private readonly surfaceVx = new Float64Array(RADII.length);
  private readonly surfaceVy = new Float64Array(RADII.length);
  readonly impacts: Float64Array;
  readonly touched: Uint8Array;
  beamX: number;
  beamY: number;
  beamActive = true;
  gripJoint = Joint.NearHand;
  gripActive = false;
  gripX = 0;
  gripY = 0;

  constructor(pose: Pose, readonly solids: readonly Solid[], private readonly dampener = false) {
    this.impacts = new Float64Array(solids.length);
    this.touched = new Uint8Array(solids.length);
    this.x[Joint.Neck] = pose.neckX;
    this.y[Joint.Neck] = pose.neckY;
    const angles = [
      pose.head, pose.torso, pose.nearArm, pose.nearForearm, pose.farArm,
      pose.farForearm, pose.nearThigh, pose.nearShin, pose.farThigh, pose.farShin,
    ];
    for (let i = 0; i < BONES.length; i++) {
      const [a, b] = BONES[i]!;
      this.x[b] = this.x[a]! + Math.cos(angles[i]!) * LENGTHS[i]!;
      this.y[b] = this.y[a]! + Math.sin(angles[i]!) * LENGTHS[i]!;
    }
    this.oldX.set(this.x);
    this.oldY.set(this.y);
    this.beamX = this.chestX;
    this.beamY = this.chestY;
  }

  get chestX(): number { return this.x[Joint.Neck]! * 0.65 + this.x[Joint.Pelvis]! * 0.35; }
  get chestY(): number { return this.y[Joint.Neck]! * 0.65 + this.y[Joint.Pelvis]! * 0.35; }

  kick(joint: Joint, vx: number, vy: number): void {
    this.oldX[joint] = this.oldX[joint]! - vx * STEP;
    this.oldY[joint] = this.oldY[joint]! - vy * STEP;
  }

  maxBoneError(): number {
    let error = 0;
    for (let i = 0; i < BONES.length; i++) {
      const [a, b] = BONES[i]!;
      error = Math.max(error, Math.abs(Math.hypot(this.x[b]! - this.x[a]!, this.y[b]! - this.y[a]!) - LENGTHS[i]!));
    }
    return error;
  }

  step(): void {
    const x = this.x;
    const y = this.y;
    const chestVx = (this.chestX - this.oldX[Joint.Neck]! * 0.65 - this.oldX[Joint.Pelvis]! * 0.35) / STEP;
    const chestVy = (this.chestY - this.oldY[Joint.Neck]! * 0.65 - this.oldY[Joint.Pelvis]! * 0.35) / STEP;
    const pullX = clamp((this.beamX - this.chestX) * 30 - chestVx * 7, -4800, 4800);
    const pullY = clamp((this.beamY - this.chestY) * 30 - chestVy * 7, -4800, 4800);
    this.impacts.fill(0);
    this.touched.fill(0);
    this.contactX.fill(0);
    this.contactY.fill(0);

    for (let i = 0; i < RADII.length; i++) {
      const damping = i > Joint.Pelvis && this.dampener ? 0.956 : 0.989;
      const vx = (x[i]! - this.oldX[i]!) / STEP;
      const vy = (y[i]! - this.oldY[i]!) / STEP;
      let ax = 0;
      let ay = GRAVITY;
      if (this.beamActive) {
        if (i === Joint.Neck || i === Joint.Pelvis) {
          ax = pullX;
          ay = pullY + (i === Joint.Neck ? -280 : 180);
        } else if (i === Joint.Head) {
          ax = clamp((this.beamX - x[i]!) * 8 - vx * 1.9, -1550, 1550);
          ay = clamp((this.beamY - 72 - y[i]!) * 8 - vy * 1.9, -1550, 1550);
        } else {
          ay *= 0.55;
        }
      }

      this.vx[i] = clamp(vx * damping + ax * STEP, -860, 860);
      this.vy[i] = clamp(vy * damping + ay * STEP, -860, 860);
      this.oldX[i] = x[i]!;
      this.oldY[i] = y[i]!;
      x[i] = x[i]! + this.vx[i]! * STEP;
      y[i] = y[i]! + this.vy[i]! * STEP;
    }

    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      for (let i = 0; i < BONES.length; i++) {
        const [a, b] = BONES[i]!;
        const dx = x[b]! - x[a]!;
        const dy = y[b]! - y[a]!;
        const distance = Math.hypot(dx, dy);
        if (distance < 0.00001) continue;
        const weightA = this.weight(a);
        const weightB = this.weight(b);
        const correction = (distance - LENGTHS[i]!) / (distance * (weightA + weightB));
        x[a] = x[a]! + dx * correction * weightA;
        y[a] = y[a]! + dy * correction * weightA;
        x[b] = x[b]! - dx * correction * weightB;
        y[b] = y[b]! - dy * correction * weightB;
      }

      for (const [a, b, c, min, max] of ANGLE_LIMITS) {
        const inX = x[b]! - x[a]!;
        const inY = y[b]! - y[a]!;
        const outX = x[c]! - x[b]!;
        const outY = y[c]! - y[b]!;
        const angle = Math.atan2(inX * outY - inY * outX, inX * outX + inY * outY);
        const middle = (min + max) * 0.5;
        const wrapped = angle - Math.round((angle - middle) / TAU) * TAU;
        const difference = clamp(wrapped, min, max) - wrapped;
        if (Math.abs(difference) < 0.0001) continue;

        // Share the angular correction across all three joints so a joint
        // hitting its limit does not snap the whole limb around its parent.
        const inLengthSq = Math.max(1, inX * inX + inY * inY);
        const outLengthSq = Math.max(1, outX * outX + outY * outY);
        const ax = -inY / inLengthSq;
        const ay = inX / inLengthSq;
        const cx = -outY / outLengthSq;
        const cy = outX / outLengthSq;
        const bx = -ax - cx;
        const by = -ay - cy;
        const wa = this.weight(a);
        const wb = this.weight(b);
        const wc = this.weight(c);
        const weight = wa * (ax * ax + ay * ay) + wb * (bx * bx + by * by) + wc * (cx * cx + cy * cy);
        if (weight < 1e-8) continue;
        const correction = 0.55 * difference / weight;
        x[a] = x[a]! + ax * wa * correction;
        y[a] = y[a]! + ay * wa * correction;
        x[b] = x[b]! + bx * wb * correction;
        y[b] = y[b]! + by * wb * correction;
        x[c] = x[c]! + cx * wc * correction;
        y[c] = y[c]! + cy * wc * correction;
      }

      if (this.gripActive) {
        x[this.gripJoint] = this.gripX;
        y[this.gripJoint] = this.gripY;
      }
      for (let i = 0; i < BONES.length; i++) {
        const [a, b] = BONES[i]!;
        this.collide(a, b, MIDPOINT_RADII[i]!);
      }
      for (let i = 0; i < RADII.length; i++) this.collide(i, i, RADII[i]!);
    }

    for (let i = 0; i < RADII.length; i++) this.resolveVelocity(i);
  }

  private weight(joint: Joint): number {
    return this.gripActive && this.gripJoint === joint ? 0 : INVERSE_MASS[joint]!;
  }

  private collide(a: Joint, b: Joint, radius: number): void {
    const x = this.x;
    const y = this.y;
    const c = this.contact;
    const wa = this.weight(a);
    const wb = this.weight(b);
    const weight = wa + wb;
    if (weight === 0) return;

    for (let i = 0; i < this.solids.length; i++) {
      if (!c.find((x[a]! + x[b]!) * 0.5, (y[a]! + y[b]!) * 0.5, radius, this.solids[i]!)) continue;

      const vx = (this.vx[a]! + this.vx[b]!) * 0.5 - c.vx;
      const vy = (this.vy[a]! + this.vy[b]!) * 0.5 - c.vy;
      const inward = Math.max(0, -(vx * c.nx + vy * c.ny));
      this.impacts[i] = Math.max(this.impacts[i]!, inward);
      this.touched[i] = 1;

      const dx = c.nx * c.depth;
      const dy = c.ny * c.depth;
      x[a] = x[a]! + dx * (2 * wa / weight);
      y[a] = y[a]! + dy * (2 * wa / weight);
      if (a !== b) {
        x[b] = x[b]! + dx * (2 * wb / weight);
        y[b] = y[b]! + dy * (2 * wb / weight);
      }

      if (wa > 0) this.rememberContact(a, c);
      if (a !== b && wb > 0) this.rememberContact(b, c);
    }
  }

  private rememberContact(joint: Joint, contact: Contact): void {
    this.contactX[joint] = contact.nx;
    this.contactY[joint] = contact.ny;
    this.surfaceVx[joint] = contact.vx;
    this.surfaceVy[joint] = contact.vy;
  }

  private resolveVelocity(joint: Joint): void {
    const x = this.x[joint]!;
    const y = this.y[joint]!;
    const nx = this.contactX[joint]!;
    const ny = this.contactY[joint]!;
    if (nx !== 0 || ny !== 0) {
      // Collision correction moves positions immediately. Retain incoming
      // tangential motion, so the correction cannot turn into a new impact.
      const sx = this.surfaceVx[joint]!;
      const sy = this.surfaceVy[joint]!;
      const vx = this.vx[joint]! - sx;
      const vy = this.vy[joint]! - sy;
      const normal = vx * nx + vy * ny;
      this.oldX[joint] = x - (sx + (vx - normal * nx) * 0.91) * STEP;
      this.oldY[joint] = y - (sy + (vy - normal * ny) * 0.91) * STEP;
    } else {
      // Keep large pose repairs, including the first frame of a grab, out of
      // the next step's velocity while retaining momentum from the beam.
      const expectedX = x - this.vx[joint]! * STEP;
      const expectedY = y - this.vy[joint]! * STEP;
      this.oldX[joint] = this.weight(joint) === 0 ? x : clamp(this.oldX[joint]!, expectedX - 0.75, expectedX + 0.75);
      this.oldY[joint] = this.weight(joint) === 0 ? y : clamp(this.oldY[joint]!, expectedY - 0.75, expectedY + 0.75);
    }
  }
}
