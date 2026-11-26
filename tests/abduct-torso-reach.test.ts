// "This body has a problem" (2026-11-26): the 2199 residents' torsos were 88 px tall, so the art stopped
// ~25 px short of the pelvis and the legs floated free of the body. See docs/REGRESSIONS.md (E9).
//
// Rule: HumanArt hangs the torso from the neck (anchored 5 px below its top edge) along the neck→pelvis
// bone, so every humanoid sleeper's torso art must reach the pelvis.
import { describe, expect, it } from 'vitest';
import { ART } from '../src/art-manifest';
import { bodyPlanFor, HUMAN_PLAN } from '../src/abduct/body-plan';
import { ROOMS } from '../src/abduct/rooms';

const NECK = 1;
const PELVIS = 2;
const ANCHOR = 5;

function torsoBone(): number {
  for (let b = 0; b < HUMAN_PLAN.bones; b++) {
    const a = HUMAN_PLAN.boneA[b]!;
    const c = HUMAN_PLAN.boneB[b]!;
    if ((a === NECK && c === PELVIS) || (a === PELVIS && c === NECK)) return HUMAN_PLAN.lengths[b]!;
  }
  throw new Error('no neck→pelvis bone in HUMAN_PLAN');
}

const humans = [...new Set(Object.values(ROOMS).map(r => r.human))].filter(h => bodyPlanFor(h) === HUMAN_PLAN);

describe('every humanoid torso reaches the pelvis', () => {
  const length = torsoBone();
  it('finds the bone and the sleepers', () => {
    expect(length).toBeGreaterThan(80);
    expect(humans.length).toBeGreaterThan(20);
  });
  it.each(humans)('%s', human => {
    const art = ART[`human/${human}_torso`];
    expect(art, `human/${human}_torso is in the manifest`).toBeDefined();
    expect(art!.h - ANCHOR, `human/${human}_torso reach (manifest h ${art!.h})`).toBeGreaterThanOrEqual(length);
  });
});
