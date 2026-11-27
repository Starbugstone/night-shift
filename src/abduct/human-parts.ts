// Which art key draws each part of a ragdoll human. This is the only place that builds a limb key, so a new
// character cannot quietly wear another character's limbs (docs/REGRESSIONS.md A4: Artie, Penny and Moe wore
// Doc's, Larry's and Buff's until v0.2). tests/abduct-body-art.test.ts walks every room. Pure data, no DOM.

/** The parts of the human rig (src/abduct/body-plan.ts HUMAN_PLAN); each is `human/<id>_<part>` in the manifest. */
export const HUMAN_PARTS = ['head', 'head_awake', 'torso', 'upper_arm', 'lower_arm', 'upper_leg', 'lower_leg'] as const;
export type HumanPart = (typeof HUMAN_PARTS)[number];

/** Parts a character wears from another character's art set, on purpose. */
export interface SharedParts {
  /** The human whose art is worn. */
  readonly from: string;
  /** Limbs only: a head or a torso is never shared. */
  readonly parts: readonly HumanPart[];
  /** Why the story has them dressed alike (twins, a uniform). "No art yet" is not a reason: draw the limbs. */
  readonly reason: string;
}

/** Declared shared part sets, by human. Empty: every human in the game has their own seven parts. */
export const SHARED_PARTS: Readonly<Record<string, SharedParts>> = {};

/** The art key of one part of `human`: their own, unless `shared` declares that part. */
export function humanPartKey(human: string, part: HumanPart, shared: Readonly<Record<string, SharedParts>> = SHARED_PARTS): string {
  const share = shared[human];
  return `human/${share?.parts.includes(part) ? share.from : human}_${part}`;
}
