import { HUMAN_PLAN, ROLE_HEAD, ROLE_PULL, type BodyPlan } from './body-plan';

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
  active?: boolean;
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
  omega?: number;
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

export interface SwingingRect {
  kind: 'swingingRect';
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;
  omega: number;
}

export type Solid = Rect | Circle | Blade | SwingingRect;

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
  pelvisRadius?: number;
  /** Non-human plans: bone angles in the plan's bone order (the named angles above are ignored). */
  bones?: readonly number[];
}

const GRAVITY = 480;
const ITERATIONS = 8;
const TAU = Math.PI * 2;

/**
 * How the beam pulls the chest toward the beam point: spring per px (`k`), damping per px/s (`c`),
 * acceleration cap (`max`), and `lead`, the share of the beam's own velocity fed into the damping
 * (0 = damp toward rest, so the body trails a moving beam; 1 = damp toward the beam's motion, so
 * it keeps up). Then, once the beam has stopped, an optional `hold`: a stiff, near-critically
 * damped spring that closes the last gap fast and stops the body dead instead of letting it drift.
 *
 * Touch keeps the lazy follow: the finger covers the body anyway and the swing is the comedy.
 * A mouse aims with the eye, so the body has to go and stop where the cursor goes and stops.
 * Spring and cap stay the touch ones (a snagged limb is not yanked any harder, a body pressed to a
 * wall never fakes a bonk), and the hold's `drop` keeps the body hanging at the same height under
 * the reticle (~9 px of gravity sag): rooms, cones and lasers were laid out for that height.
 * Only the chest is affected; arms, legs and head still trail and flop.
 *
 * `pilotDelay`: this follow brings the body along that much sooner than touch at crossing speed.
 * The autopilot waits that long after committing to a timed crossing, so the crossing predictor
 * (tuned on the touch lag) still sees the body where it will really be.
 */
export const FOLLOW = {
  touch: { k: 30, c: 7, max: 4800, lead: 0, hold: null, pilotDelay: 0 },
  mouse: { k: 30, c: 12, max: 4800, lead: 1, hold: { k: 220, c: 34, drop: 7.6 }, pilotDelay: 0.18 },
} as const;
export type FollowTuning = {
  readonly k: number; readonly c: number; readonly max: number; readonly lead: number;
  readonly hold: { readonly k: number; readonly c: number; readonly drop: number } | null;
  readonly pilotDelay: number;
};
/** Smoothing of the beam velocity (s): input arrives once per frame, physics runs twice. */
const BEAM_V_SMOOTH = 1 - Math.exp(-STEP / 0.02);
/** The beam counts as stopped below this speed (px/s) ... */
const HOLD_SPEED = 6;
/** ... and the hold fades in over this long once it has been stopped for HOLD_DELAY (s). */
const HOLD_DELAY = 0.025;
const HOLD_RAMP = 0.08;

/**
 * Turning the specimen in the beam. `k`/`c` = angular spring and damping on the torso,
 * `max` = angular acceleration cap (rad/s²), `lead` = how far the target may run ahead of the
 * body (rad) so a blocked turn never winds up. Limbs get `limb` of the turning push, so they
 * trail and swing out instead of turning like a plank.
 */
export const TURN = { k: 34, c: 9, max: 46, lead: 1.4, limb: 0.35 } as const;

/** Wraps an angle into (-π, π]. */
export function wrapPi(a: number): number {
  return a - Math.round(a / TAU) * TAU;
}

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

    if (solid.kind === 'swingingRect') {
      const dx = px - solid.x;
      const dy = py - solid.y;
      const cos = Math.cos(solid.angle);
      const sin = Math.sin(solid.angle);
      const localX = dx * cos + dy * sin;
      const localY = -dx * sin + dy * cos;
      const halfWidth = solid.w / 2;
      if (!this.box(localX, localY, radius, -halfWidth, 0, halfWidth, solid.h)) return false;

      const toSurface = this.depth - radius;
      const offsetX = clamp(localX + this.nx * toSurface, -halfWidth, halfWidth);
      const offsetY = clamp(localY + this.ny * toSurface, 0, solid.h);
      this.vx = -solid.omega * (offsetX * sin + offsetY * cos);
      this.vy = solid.omega * (offsetX * cos - offsetY * sin);
      const nx = this.nx;
      this.nx = nx * cos - this.ny * sin;
      this.ny = nx * sin + this.ny * cos;
      return true;
    }

    this.vx = solid.vx;
    this.vy = solid.vy;
    if (solid.kind === 'circle') {
      if (!this.round(px, py, solid.x, solid.y, radius + solid.r)) return false;
      if (solid.omega) {
        this.vx -= this.ny * solid.r * solid.omega;
        this.vy += this.nx * solid.r * solid.omega;
      }
      return true;
    }
    if (solid.active === false) return false;

    return this.box(px, py, radius, solid.x, solid.y, solid.x + solid.w, solid.y + solid.h);
  }

  private box(px: number, py: number, radius: number, left: number, top: number, right: number, bottom: number): boolean {
    if (px < left || px > right || py < top || py > bottom) {
      return this.round(px, py, clamp(px, left, right), clamp(py, top, bottom), radius);
    }

    const leftDist = px - left;
    const rightDist = right - px;
    const topDist = py - top;
    const bottomDist = bottom - py;
    const nearest = Math.min(leftDist, rightDist, topDist, bottomDist);
    this.nx = nearest === leftDist ? -1 : nearest === rightDist ? 1 : 0;
    this.ny = this.nx !== 0 ? 0 : nearest === topDist ? -1 : 1;
    this.depth = radius + nearest;
    return true;
  }
}

export class Ragdoll {
  readonly x: Float64Array;
  readonly y: Float64Array;
  private readonly oldX: Float64Array;
  private readonly oldY: Float64Array;
  private readonly vx: Float64Array;
  private readonly vy: Float64Array;
  private readonly contact = new Contact();
  private readonly contactX: Float64Array;
  private readonly contactY: Float64Array;
  private readonly surfaceVx: Float64Array;
  private readonly surfaceVy: Float64Array;
  private readonly candidates: Int32Array;
  private candidateCount = 0;
  /** Joint radii for this body (the plan's, with `pose.pelvisRadius` applied). */
  readonly radii: Float64Array;
  /**
   * Extra per-joint acceleration (px/s², + = down), added only while `floating` is set: water
   * buoyancy (src/abduct/moisture.ts). The owner rewrites it before each step.
   */
  readonly floatY: Float64Array;
  floating = false;
  private readonly restHeadX: number;
  private readonly restHeadY: number;
  readonly impacts: Float64Array;
  readonly touched: Uint8Array;
  /** Where the hardest hit on each solid landed this step (valid when `impacts[i] > 0`). */
  readonly impactX: Float64Array;
  readonly impactY: Float64Array;
  beamX: number;
  beamY: number;
  beamActive = true;
  gripJoint: number = Joint.NearHand;
  gripActive = false;
  gripX = 0;
  gripY = 0;
  /** Chest follow spring; the scene switches it to `FOLLOW.mouse` for mouse and pen. */
  follow: FollowTuning = FOLLOW.touch;
  /**
   * Target rotation from upright, radians (+ = clockwise on screen). Only used once `turning`
   * is set (the player rotated at least once); before that the body behaves exactly as v2 shipped.
   */
  turn = 0;
  turning = false;
  private beamVx = 0;
  private beamVy = 0;
  /** Seconds the beam has been (nearly) still; drives the hold blend. */
  private stillFor = 0;
  private lastBeamX = 0;
  private lastBeamY = 0;

  constructor(
    pose: Pose, readonly solids: readonly Solid[], private readonly dampener = false,
    /** The skeleton; humans (the default) are exactly the v2 table. */
    readonly plan: BodyPlan = HUMAN_PLAN,
  ) {
    const n = plan.joints;
    this.x = new Float64Array(n);
    this.y = new Float64Array(n);
    this.oldX = new Float64Array(n);
    this.oldY = new Float64Array(n);
    this.vx = new Float64Array(n);
    this.vy = new Float64Array(n);
    this.contactX = new Float64Array(n);
    this.contactY = new Float64Array(n);
    this.surfaceVx = new Float64Array(n);
    this.surfaceVy = new Float64Array(n);
    this.floatY = new Float64Array(n);
    this.radii = Float64Array.from(plan.radii);
    if (plan.pelvis >= 0 && pose.pelvisRadius !== undefined) this.radii[plan.pelvis] = pose.pelvisRadius;
    this.candidates = new Int32Array(solids.length);
    this.impacts = new Float64Array(solids.length);
    this.touched = new Uint8Array(solids.length);
    this.impactX = new Float64Array(solids.length);
    this.impactY = new Float64Array(solids.length);
    this.x[plan.root] = pose.neckX;
    this.y[plan.root] = pose.neckY;
    const angles = plan.angles(pose);
    for (let i = 0; i < plan.bones; i++) {
      const a = plan.boneA[i]!;
      const b = plan.boneB[i]!;
      this.x[b] = this.x[a]! + Math.cos(angles[i]!) * plan.lengths[i]!;
      this.y[b] = this.y[a]! + Math.sin(angles[i]!) * plan.lengths[i]!;
    }
    this.oldX.set(this.x);
    this.oldY.set(this.y);
    this.beamX = this.chestX;
    this.beamY = this.chestY;
    this.lastBeamX = this.beamX;
    this.lastBeamY = this.beamY;
    const head = plan.head >= 0 ? plan.head : plan.root;
    this.restHeadX = this.x[head]! - this.beamX;
    this.restHeadY = this.y[head]! - this.beamY;
  }

  /** Number of joints (11 for a human). */
  get joints(): number { return this.plan.joints; }

  get chestX(): number { return this.x[this.plan.axisTop]! * this.plan.chestTop + this.x[this.plan.axisBottom]! * this.plan.chestBottom; }
  get chestY(): number { return this.y[this.plan.axisTop]! * this.plan.chestTop + this.y[this.plan.axisBottom]! * this.plan.chestBottom; }

  /** Current torso rotation from upright (axis top straight above axis bottom), radians, + = clockwise. */
  get tilt(): number {
    const { axisTop: top, axisBottom: bottom } = this.plan;
    return wrapPi(Math.atan2(this.y[bottom]! - this.y[top]!, this.x[bottom]! - this.x[top]!) - Math.PI / 2);
  }

  /** Turns the target by `radians` (+ = clockwise). The target never leads the body by more than `TURN.lead`. */
  rotate(radians: number): void {
    if (radians === 0 || !Number.isFinite(radians)) return;
    const tilt = this.tilt;
    const from = this.turning ? this.turn : tilt;
    this.turning = true;
    this.turn = tilt + clamp(wrapPi(from - tilt) + radians, -TURN.lead, TURN.lead);
  }

  /** Downward speed of a joint over the last step, px/s. */
  speedY(joint: number): number {
    return this.vy[joint]!;
  }

  supported(joint: number): boolean { return this.contactY[joint]! < -0.5; }

  kick(joint: number, vx: number, vy: number): void {
    this.oldX[joint] = this.oldX[joint]! - vx * STEP;
    this.oldY[joint] = this.oldY[joint]! - vy * STEP;
  }

  maxBoneError(): number {
    const plan = this.plan;
    let error = 0;
    for (let i = 0; i < plan.bones; i++) {
      const a = plan.boneA[i]!;
      const b = plan.boneB[i]!;
      error = Math.max(error, Math.abs(Math.hypot(this.x[b]! - this.x[a]!, this.y[b]! - this.y[a]!) - plan.lengths[i]!));
    }
    return error;
  }

  overlaps(solid: Solid): boolean {
    const plan = this.plan;
    for (let i = 0; i < plan.joints; i++) {
      if (this.contact.find(this.x[i]!, this.y[i]!, this.radii[i]!, solid)) return true;
    }
    for (let i = 0; i < plan.bones; i++) {
      const a = plan.boneA[i]!;
      const b = plan.boneB[i]!;
      if (this.contact.find((this.x[a]! + this.x[b]!) * 0.5, (this.y[a]! + this.y[b]!) * 0.5, plan.midRadii[i]!, solid)) return true;
    }
    return false;
  }

  /** Samples the same joint and bone volumes used for contact physics. */
  overlapsCircles(test: (x: number, y: number, radius: number) => boolean): boolean {
    const plan = this.plan;
    for (let i = 0; i < plan.joints; i++) {
      if (test(this.x[i]!, this.y[i]!, this.radii[i]!)) return true;
    }
    for (let i = 0; i < plan.bones; i++) {
      const a = plan.boneA[i]!;
      const b = plan.boneB[i]!;
      if (test((this.x[a]! + this.x[b]!) * 0.5, (this.y[a]! + this.y[b]!) * 0.5, plan.midRadii[i]!)) return true;
    }
    return false;
  }

  private collectCandidates(): void {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (let i = 0; i < this.plan.joints; i++) {
      left = Math.min(left, this.x[i]!);
      right = Math.max(right, this.x[i]!);
      top = Math.min(top, this.y[i]!);
      bottom = Math.max(bottom, this.y[i]!);
    }
    const margin = 94;
    this.candidateCount = 0;
    for (let i = 0; i < this.solids.length; i++) {
      const solid = this.solids[i]!;
      if (solid.kind === 'rect') {
        if (solid.active === false || solid.x + solid.w < left - margin || solid.x > right + margin ||
            solid.y + solid.h < top - margin || solid.y > bottom + margin) continue;
      } else {
        const r = solid.kind === 'circle' ? solid.r : solid.kind === 'blade' ? solid.to + solid.r : Math.hypot(solid.w * 0.5, solid.h);
        if (solid.x + r < left - margin || solid.x - r > right + margin ||
            solid.y + r < top - margin || solid.y - r > bottom + margin) continue;
      }
      this.candidates[this.candidateCount++] = i;
    }
  }

  step(lift = 1, draftX = 0, draftY = 0): void {
    const x = this.x;
    const y = this.y;
    const plan = this.plan;
    const top = plan.axisTop;
    const bottom = plan.axisBottom;
    const chestVx = (this.chestX - this.oldX[top]! * plan.chestTop - this.oldX[bottom]! * plan.chestBottom) / STEP;
    const chestVy = (this.chestY - this.oldY[top]! * plan.chestTop - this.oldY[bottom]! * plan.chestBottom) / STEP;
    const follow = this.follow;
    let { k, c } = follow;
    let drop = 0;
    if (follow.hold || follow.lead !== 0) {
      this.beamVx += (clamp((this.beamX - this.lastBeamX) / STEP, -1500, 1500) - this.beamVx) * BEAM_V_SMOOTH;
      this.beamVy += (clamp((this.beamY - this.lastBeamY) / STEP, -1500, 1500) - this.beamVy) * BEAM_V_SMOOTH;
      this.stillFor = Math.hypot(this.beamVx, this.beamVy) < HOLD_SPEED ? this.stillFor + STEP : 0;
      if (follow.hold) {
        const h = clamp((this.stillFor - HOLD_DELAY) / HOLD_RAMP, 0, 1);
        k += (follow.hold.k - k) * h;
        c += (follow.hold.c - c) * h;
        drop = follow.hold.drop * h;
      }
    }
    const leadX = this.beamVx * follow.lead;
    const leadY = this.beamVy * follow.lead;
    this.lastBeamX = this.beamX;
    this.lastBeamY = this.beamY;
    const pullX = clamp((this.beamX - this.chestX) * k + (leadX - chestVx) * c, -follow.max, follow.max);
    const pullY = clamp((this.beamY + drop - this.chestY) * k + (leadY - chestVy) * c, -follow.max, follow.max);
    // Upright bias (neck lifted, pelvis pushed down) and the head's lift, turned to the target.
    // At turn = 0 these are exactly the untouched numbers: (0, -280), (0, 180), (0, -72).
    // A plan resting on its side (the dolphin) biases along its rest axis instead.
    const turned = this.beamActive && this.turning;
    const rest = plan.restTilt;
    const upX = turned ? -Math.sin(this.turn) : rest === 0 ? 0 : -Math.sin(rest);
    const upY = turned ? Math.cos(this.turn) : rest === 0 ? 1 : Math.cos(rest);
    let spin = 0;
    const cx = this.chestX;
    const cy = this.chestY;
    if (turned) {
      const nx = x[bottom]! - x[top]!;
      const ny = y[bottom]! - y[top]!;
      const ox = this.oldX[bottom]! - this.oldX[top]!;
      const oy = this.oldY[bottom]! - this.oldY[top]!;
      const omega = Math.atan2(ox * ny - oy * nx, ox * nx + oy * ny) / STEP;
      const tilt = wrapPi(Math.atan2(ny, nx) - Math.PI / 2);
      const error = clamp(wrapPi(this.turn - tilt), -TURN.lead, TURN.lead);
      this.turn = tilt + error;
      spin = clamp(error * TURN.k - omega * TURN.c, -TURN.max, TURN.max);
    }
    this.impacts.fill(0);
    this.touched.fill(0);
    this.contactX.fill(0);
    this.contactY.fill(0);

    const floatY = this.floating ? this.floatY : null;
    for (let i = 0; i < plan.joints; i++) {
      const damping = plan.damped[i] && this.dampener ? 0.956 : 0.989;
      const vx = (x[i]! - this.oldX[i]!) / STEP;
      const vy = (y[i]! - this.oldY[i]!) / STEP;
      let ax = 0;
      let ay = GRAVITY;
      if (this.beamActive) {
        const role = plan.role[i];
        if (role === ROLE_PULL) {
          const bias = plan.bias[i]!;
          ax = pullX + upX * bias;
          ay = pullY + upY * bias;
        } else if (role === ROLE_HEAD) {
          const targetX = this.beamX + this.restHeadX * (1 - lift) - 72 * lift * upX;
          const targetY = this.beamY + this.restHeadY * (1 - lift) - 72 * lift * upY;
          ax = clamp((targetX - x[i]!) * 8 - vx * 1.9, -1550, 1550);
          ay = clamp((targetY - y[i]!) * 8 - vy * 1.9, -1550, 1550);
        } else {
          ay *= plan.limbGravity;
        }
        if (spin !== 0) {
          // tangential push about the chest: the torso turns, the limbs come along late
          const share = plan.turnShare[i]!;
          ax -= spin * (y[i]! - cy) * share;
          ay += spin * (x[i]! - cx) * share;
        }
      }
      if (floatY !== null) ay += floatY[i]!;

      this.vx[i] = clamp(vx * damping + (ax + draftX) * STEP, -860, 860);
      this.vy[i] = clamp(vy * damping + (ay + draftY) * STEP, -860, 860);
      this.oldX[i] = x[i]!;
      this.oldY[i] = y[i]!;
      x[i] = x[i]! + this.vx[i]! * STEP;
      y[i] = y[i]! + this.vy[i]! * STEP;
    }

    this.collectCandidates();
    const boneA = plan.boneA;
    const boneB = plan.boneB;
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      for (let i = 0; i < plan.bones; i++) {
        const a = boneA[i]!;
        const b = boneB[i]!;
        const dx = x[b]! - x[a]!;
        const dy = y[b]! - y[a]!;
        const distance = Math.hypot(dx, dy);
        if (distance < 0.00001) continue;
        const weightA = this.weight(a);
        const weightB = this.weight(b);
        const correction = (distance - plan.lengths[i]!) / (distance * (weightA + weightB));
        x[a] = x[a]! + dx * correction * weightA;
        y[a] = y[a]! + dy * correction * weightA;
        x[b] = x[b]! - dx * correction * weightB;
        y[b] = y[b]! - dy * correction * weightB;
      }

      for (let l = 0; l < plan.limitCount; l++) {
        const a = plan.limitA[l]!;
        const b = plan.limitB[l]!;
        const c = plan.limitC[l]!;
        const min = plan.limitMin[l]!;
        const max = plan.limitMax[l]!;
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
      for (let i = 0; i < plan.bones; i++) {
        this.collide(boneA[i]!, boneB[i]!, plan.midRadii[i]!);
      }
      for (let i = 0; i < plan.joints; i++) {
        this.collide(i, i, this.radii[i]!);
      }
    }

    for (let i = 0; i < plan.joints; i++) this.resolveVelocity(i);
  }

  private weight(joint: number): number {
    return this.gripActive && this.gripJoint === joint ? 0 : this.plan.inverseMass[joint]!;
  }

  private collide(a: number, b: number, radius: number): void {
    const x = this.x;
    const y = this.y;
    const c = this.contact;
    const wa = this.weight(a);
    const wb = this.weight(b);
    const weight = wa + wb;
    if (weight === 0) return;

    for (let index = 0; index < this.candidateCount; index++) {
      const i = this.candidates[index]!;
      if (!c.find((x[a]! + x[b]!) * 0.5, (y[a]! + y[b]!) * 0.5, radius, this.solids[i]!)) continue;

      const vx = (this.vx[a]! + this.vx[b]!) * 0.5 - c.vx;
      const vy = (this.vy[a]! + this.vy[b]!) * 0.5 - c.vy;
      const inward = Math.max(0, -(vx * c.nx + vy * c.ny));
      if (inward > this.impacts[i]!) {
        this.impacts[i] = inward;
        this.impactX[i] = (x[a]! + x[b]!) * 0.5 - c.nx * (radius - c.depth);
        this.impactY[i] = (y[a]! + y[b]!) * 0.5 - c.ny * (radius - c.depth);
      }
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

  private rememberContact(joint: number, contact: Contact): void {
    this.contactX[joint] = contact.nx;
    this.contactY[joint] = contact.ny;
    this.surfaceVx[joint] = contact.vx;
    this.surfaceVy[joint] = contact.vy;
  }

  private resolveVelocity(joint: number): void {
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
      const slip = this.plan.slip;
      this.oldX[joint] = x - (sx + (vx - normal * nx) * slip) * STEP;
      this.oldY[joint] = y - (sy + (vy - normal * ny) * slip) * STEP;
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
