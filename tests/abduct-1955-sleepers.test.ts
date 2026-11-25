import { expect, it } from 'vitest';
import { STEP } from '../src/abduct/ragdoll';
import { ROOMS_1955 } from '../src/abduct/rooms/deep-1955';
import { AbductSimulation } from '../src/abduct/simulation';

it.each([
  ['bully_kitchen', 'Lyle'],
  ['band_canopy', 'Chaperone'],
] as const)('rushing in %s can wake %s before the specimen', (id, name) => {
  const sim = new AbductSimulation(ROOMS_1955[id], new Set(), { sfx() {} }, () => 0.5, { hard: true, wakeFails: true });
  const interior = sim.interior!;
  const sleeper = interior.sleepers[0]!;
  const { body } = sim;
  const baseX = sleeper.x - 34;
  const baseY = sleeper.y - 42;
  let specimenNoise = 0;

  // Move the solved body across the loose surface next to the sleeper. Measure real creak
  // power and falloff through the interior, without adding impact noise from grabbing it.
  for (let f = 1; f < 4 / STEP && !interior.failure; f++) {
    const dx = baseX + Math.sin(f * STEP * 5) * 53 - body.chestX;
    const dy = baseY - body.chestY;
    for (let i = 0; i < body.x.length; i++) {
      body.x[i] = body.x[i]! + dx;
      body.y[i] = body.y[i]! + dy;
    }
    specimenNoise += interior.step(body, f * STEP, false);
  }

  expect(sleeper.wake).toBe(100);
  expect(interior.failure).toEqual({ reason: 'sleeper', by: name });
  expect(specimenNoise).toBeLessThan(100);
});
