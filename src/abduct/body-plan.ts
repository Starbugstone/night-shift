// Per-specimen ragdoll body plans. A plan is the ragdoll's skeleton (joints, bones, bend limits)
// plus how the beam treats each joint. Humans use HUMAN_PLAN, which is exactly the table the
// ragdoll shipped with in v2 (same numbers, same evaluation order), so every L1–L4 proof and
// difficulty number is unchanged. L5's Bubbles uses DOLPHIN_PLAN (docs/GDD-3-new-shifts.md, L5).
//
// Plans are built once at module load into flat typed arrays, so the physics hot path reads plain
// indices and never allocates.
import type { Pose } from './ragdoll';

/** What the beam does to a joint. */
export const ROLE_LIMB = 0;
/** Pulled toward the beam point with the chest spring, plus `bias` along the body's up axis. */
export const ROLE_PULL = 1;
/** The human head: a soft spring toward its rest offset (lifted by `lift`). */
export const ROLE_HEAD = 2;
export type BeamRole = typeof ROLE_LIMB | typeof ROLE_PULL | typeof ROLE_HEAD;

export interface BodyPlanSpec {
  readonly kind: 'human' | 'dolphin';
  /** Joint radii (contact and detector volumes). */
  readonly radii: readonly number[];
  readonly inverseMass: readonly number[];
  /** Bones as [parent, child]; a pose places each child from its parent, in this order. */
  readonly bones: readonly (readonly [number, number])[];
  readonly lengths: readonly number[];
  /** Radius of the volume at each bone's midpoint. */
  readonly midRadii: readonly number[];
  /** [a, b, c, min, max]: the turn at b from bone a→b to bone b→c, radians (screen coords, + = clockwise). */
  readonly limits: readonly (readonly [number, number, number, number, number])[];
  readonly role: readonly BeamRole[];
  /** ROLE_PULL joints: push along the up axis (negative = up), px/s². */
  readonly bias: readonly number[];
  /** Share of the turning push each joint gets (1 = turns with the torso). */
  readonly turnShare: readonly number[];
  /** Joints the Beam Dampener damps (the limbs). */
  readonly damped: readonly number[];
  /** The joint the pose places first, at (pose.neckX, pose.neckY). */
  readonly root: number;
  /** Torso axis, top → bottom: drives `tilt` and turning. */
  readonly axisTop: number;
  readonly axisBottom: number;
  /** chest = top * chestTop + bottom * chestBottom (kept as two literals so humans match v2 bit for bit). */
  readonly chestTop: number;
  readonly chestBottom: number;
  /** ROLE_HEAD joint, or -1. */
  readonly head: number;
  /** Joint whose radius `pose.pelvisRadius` overrides, or -1. */
  readonly pelvis: number;
  /** Rest tilt of the up axis (0 = torso upright; π/2 = lying along +x, nose right). */
  readonly restTilt: number;
  /** Share of gravity on limbs while the beam holds the body. */
  readonly limbGravity: number;
  /** Tangential speed kept on a contact each step (lower = grippier). */
  readonly slip: number;
  /** Bonk wake gain multiplier (the dolphin's wet thwap wakes ~20 % less). */
  readonly bonkGain: number;
  /** Joints that grab furniture when awake (none for a dolphin). */
  readonly hands: readonly number[];
  /** Joints that kick when awake. */
  readonly flail: readonly number[];
  /** Bone angles for a pose in bone order (built once, at construction). */
  readonly angles: (pose: Pose) => readonly number[];
}

/** A plan baked into typed arrays for the hot path. */
export class BodyPlan {
  readonly kind: BodyPlanSpec['kind'];
  readonly joints: number;
  readonly bones: number;
  readonly radii: Float64Array;
  readonly inverseMass: Float64Array;
  readonly boneA: Int32Array;
  readonly boneB: Int32Array;
  readonly lengths: Float64Array;
  readonly midRadii: Float64Array;
  readonly limitCount: number;
  readonly limitA: Int32Array;
  readonly limitB: Int32Array;
  readonly limitC: Int32Array;
  readonly limitMin: Float64Array;
  readonly limitMax: Float64Array;
  readonly role: Uint8Array;
  readonly bias: Float64Array;
  readonly turnShare: Float64Array;
  readonly damped: Uint8Array;
  readonly root: number;
  readonly axisTop: number;
  readonly axisBottom: number;
  readonly chestTop: number;
  readonly chestBottom: number;
  readonly head: number;
  readonly pelvis: number;
  readonly restTilt: number;
  readonly limbGravity: number;
  readonly slip: number;
  readonly bonkGain: number;
  readonly hands: readonly number[];
  readonly flail: readonly number[];
  readonly angles: BodyPlanSpec['angles'];

  constructor(spec: BodyPlanSpec) {
    const n = spec.radii.length;
    if (spec.inverseMass.length !== n || spec.role.length !== n || spec.bias.length !== n || spec.turnShare.length !== n) {
      throw new Error(`body plan ${spec.kind}: per-joint tables disagree`);
    }
    if (spec.lengths.length !== spec.bones.length || spec.midRadii.length !== spec.bones.length) {
      throw new Error(`body plan ${spec.kind}: per-bone tables disagree`);
    }
    this.kind = spec.kind;
    this.joints = n;
    this.bones = spec.bones.length;
    this.radii = Float64Array.from(spec.radii);
    this.inverseMass = Float64Array.from(spec.inverseMass);
    this.boneA = Int32Array.from(spec.bones, b => b[0]);
    this.boneB = Int32Array.from(spec.bones, b => b[1]);
    this.lengths = Float64Array.from(spec.lengths);
    this.midRadii = Float64Array.from(spec.midRadii);
    this.limitCount = spec.limits.length;
    this.limitA = Int32Array.from(spec.limits, l => l[0]);
    this.limitB = Int32Array.from(spec.limits, l => l[1]);
    this.limitC = Int32Array.from(spec.limits, l => l[2]);
    this.limitMin = Float64Array.from(spec.limits, l => l[3]);
    this.limitMax = Float64Array.from(spec.limits, l => l[4]);
    this.role = Uint8Array.from(spec.role);
    this.bias = Float64Array.from(spec.bias);
    this.turnShare = Float64Array.from(spec.turnShare);
    this.damped = new Uint8Array(n);
    for (const j of spec.damped) this.damped[j] = 1;
    this.root = spec.root;
    this.axisTop = spec.axisTop;
    this.axisBottom = spec.axisBottom;
    this.chestTop = spec.chestTop;
    this.chestBottom = spec.chestBottom;
    this.head = spec.head;
    this.pelvis = spec.pelvis;
    this.restTilt = spec.restTilt;
    this.limbGravity = spec.limbGravity;
    this.slip = spec.slip;
    this.bonkGain = spec.bonkGain;
    this.hands = spec.hands;
    this.flail = spec.flail;
    this.angles = spec.angles;
  }
}

// ------------------------------------------------------------------ human (v2, unchanged)

/** Human joints: the indices `Joint` in ragdoll.ts names. */
const H = { Head: 0, Neck: 1, Pelvis: 2, NearElbow: 3, NearHand: 4, FarElbow: 5, FarHand: 6, NearKnee: 7, NearFoot: 8, FarKnee: 9, FarFoot: 10 } as const;

export const HUMAN_PLAN = new BodyPlan({
  kind: 'human',
  radii: [32, 22, 31, 13, 11, 13, 11, 16, 14, 16, 14],
  inverseMass: [0.65, 0.34, 0.43, 1.15, 1.45, 1.15, 1.45, 0.95, 1.15, 0.95, 1.15],
  bones: [
    [H.Neck, H.Head], [H.Neck, H.Pelvis],
    [H.Neck, H.NearElbow], [H.NearElbow, H.NearHand],
    [H.Neck, H.FarElbow], [H.FarElbow, H.FarHand],
    [H.Pelvis, H.NearKnee], [H.NearKnee, H.NearFoot],
    [H.Pelvis, H.FarKnee], [H.FarKnee, H.FarFoot],
  ],
  lengths: [40, 108, 55, 53, 55, 53, 63, 64, 63, 64],
  midRadii: [24, 34, 12, 10, 12, 10, 15, 13, 15, 13],
  limits: [
    // Relative to the direction of the incoming bone, in screen coordinates.
    [H.Pelvis, H.Neck, H.Head, -1.30, 1.30],
    [H.Pelvis, H.Neck, H.NearElbow, 0.85, 4.65],
    [H.Pelvis, H.Neck, H.FarElbow, 0.85, 4.65],
    [H.Neck, H.NearElbow, H.NearHand, -2.28, 0.60],
    [H.Neck, H.FarElbow, H.FarHand, -2.28, 0.60],
    [H.Neck, H.Pelvis, H.NearKnee, -1.95, 0.72],
    [H.Neck, H.Pelvis, H.FarKnee, -1.95, 0.72],
    [H.Pelvis, H.NearKnee, H.NearFoot, -0.45, 2.12],
    [H.Pelvis, H.FarKnee, H.FarFoot, -0.45, 2.12],
  ],
  role: [ROLE_HEAD, ROLE_PULL, ROLE_PULL, ROLE_LIMB, ROLE_LIMB, ROLE_LIMB, ROLE_LIMB, ROLE_LIMB, ROLE_LIMB, ROLE_LIMB, ROLE_LIMB],
  bias: [0, -280, 180, 0, 0, 0, 0, 0, 0, 0, 0],
  // torso and head turn with the body, limbs get TURN.limb (0.35) and trail
  turnShare: [1, 1, 1, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35],
  damped: [3, 4, 5, 6, 7, 8, 9, 10],
  root: H.Neck,
  axisTop: H.Neck,
  axisBottom: H.Pelvis,
  chestTop: 0.65,
  chestBottom: 0.35,
  head: H.Head,
  pelvis: H.Pelvis,
  restTilt: 0,
  limbGravity: 0.55,
  slip: 0.91,
  bonkGain: 1,
  hands: [H.NearHand, H.FarHand],
  flail: [H.NearHand, H.FarHand, H.NearFoot, H.FarFoot],
  angles: p => [
    p.head, p.torso, p.nearArm, p.nearForearm, p.farArm,
    p.farForearm, p.nearThigh, p.nearShin, p.farThigh, p.farShin,
  ],
});

// ------------------------------------------------------------------ dolphin (L5 Bubbles)

/** Dolphin joints. Snout sits where a human head is (index 0), chest and belly where neck and pelvis are. */
export enum Fin {
  Snout,
  Chest,
  Belly,
  Tail,
  Fluke,
  NearFlipper,
  FarFlipper,
}

/**
 * Bubbles, side view, nose pointing right, belly down (GDD-3 L5): 7 joints, 6 bones, ≈ 260 px
 * long. The beam holds chest and belly like a human torso, with a gentle bias that keeps her
 * lying along her rest axis; snout and tail droop. Limits are asymmetric: she bends a lot
 * ventrally (screen-negative when facing right) and little dorsally, so in the beam she droops
 * into a croissant. Slippery (keeps more slide on contact), and a bonk is a wet thwap.
 */
export const DOLPHIN_PLAN = new BodyPlan({
  kind: 'dolphin',
  radii: [20, 34, 30, 16, 20, 10, 10],
  inverseMass: [0.9, 0.34, 0.43, 0.85, 1.1, 1.4, 1.4],
  bones: [
    [Fin.Chest, Fin.Snout], [Fin.Chest, Fin.Belly], [Fin.Belly, Fin.Tail], [Fin.Tail, Fin.Fluke],
    [Fin.Chest, Fin.NearFlipper], [Fin.Chest, Fin.FarFlipper],
  ],
  lengths: [62, 84, 70, 46, 44, 44],
  midRadii: [24, 32, 22, 17, 8, 8],
  limits: [
    // snout off the body line ±0.5 (incoming: belly → chest)
    [Fin.Belly, Fin.Chest, Fin.Snout, -0.5, 0.5],
    // tail stock: 0.8 ventral / 0.3 dorsal; fluke ±0.9
    [Fin.Chest, Fin.Belly, Fin.Tail, -0.8, 0.3],
    [Fin.Belly, Fin.Tail, Fin.Fluke, -0.9, 0.9],
    // flippers hang down-back (−0.8 from the snout → chest line), ±1.4, loose
    [Fin.Snout, Fin.Chest, Fin.NearFlipper, -2.2, 0.6],
    [Fin.Snout, Fin.Chest, Fin.FarFlipper, -2.2, 0.6],
  ],
  role: [ROLE_LIMB, ROLE_PULL, ROLE_PULL, ROLE_LIMB, ROLE_LIMB, ROLE_LIMB, ROLE_LIMB],
  bias: [0, -120, 90, 0, 0, 0, 0],
  turnShare: [1, 1, 1, 0.6, 0.35, 0.35, 0.35],
  damped: [Fin.Tail, Fin.Fluke, Fin.NearFlipper, Fin.FarFlipper],
  root: Fin.Chest,
  axisTop: Fin.Chest,
  axisBottom: Fin.Belly,
  chestTop: 0.65,
  chestBottom: 0.35,
  head: -1,
  pelvis: -1,
  restTilt: Math.PI / 2,
  limbGravity: 0.55,
  slip: 0.97,
  bonkGain: 0.8,
  hands: [],
  flail: [Fin.Fluke, Fin.NearFlipper, Fin.FarFlipper, Fin.Snout],
  angles: p => p.bones ?? DOLPHIN_REST,
});

/** Lying flat, nose right: snout, belly, tail, fluke, near and far flipper. */
const DOLPHIN_REST = [0, Math.PI, Math.PI, Math.PI, 2.3, 2.1] as const;

/** Which plan a specimen uses (by art prefix). */
export function bodyPlanFor(human: string): BodyPlan {
  return human === 'bubbles' ? DOLPHIN_PLAN : HUMAN_PLAN;
}
