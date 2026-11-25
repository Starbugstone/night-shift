import { expect, it } from 'vitest';
import { STEP } from '../src/abduct/ragdoll';
import { ROOMS } from '../src/abduct/rooms';
import { AbductSimulation } from '../src/abduct/simulation';
import { FIELD_CHECK_ROOM, FIELD_CHECK_RULES } from '../src/levels/field-check';
import { createAbductScene } from '../src/abduct';
import type { GameContext } from '../src/contracts';
import { FieldCheckAbduction } from '../src/ui/field-check';

it.each(Object.entries(ROOMS))('%s spends its first ten seconds without a bonk or wake from its spawn pose', (_, room) => {
  const deep = Boolean(room.interior);
  const rules = { hard: deep, wakeFails: deep };
  const sim = new AbductSimulation(room, new Set(), { sfx() {} }, () => 0.5, rules);
  let peakWake = 0;
  for (let tick = 0; tick < 10 / STEP; tick++) {
    sim.update(STEP);
    peakWake = Math.max(peakWake, sim.wake.value);
  }
  expect({ bonks: sim.wake.bonks, peakWake }).toEqual({ bonks: 0, peakWake: 0 });
});

it('keeps both wake meters at zero for ten untouched seconds in the playable Field Check', () => {
  const ctx: GameContext = {
    pointer: { down: false, pressed: false, released: false, x: 270, y: 480 },
    assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(),
    time: 0, reducedMotion: false, tutorial: false,
  };
  const inner = createAbductScene(ctx, { levelId: 'level3', roomId: 'dave_patio', rules: FIELD_CHECK_RULES }, () => {}, FIELD_CHECK_ROOM);
  const scene = new FieldCheckAbduction(inner, ctx);
  let peakWake = 0;
  let peakDecoy = 0;
  for (let frame = 0; frame < 600; frame++) {
    scene.update(1 / 60);
    peakWake = Math.max(peakWake, scene.debug.wake.value);
    peakDecoy = Math.max(peakDecoy, scene.debug.interior!.sleepers[0]!.wake);
  }
  expect({ peakWake, peakDecoy, bonks: scene.debug.wake.bonks }).toEqual({ peakWake: 0, peakDecoy: 0, bonks: 0 });
});
