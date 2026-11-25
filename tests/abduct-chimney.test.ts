import { expect, it } from 'vitest';
import { playAbduction, PROFILES } from './difficulty/human';

it.each([
  [PROFILES.skilled, 1], [PROFILES.skilled, 10], [PROFILES.skilled, 15],
  [PROFILES.casual, 2], [PROFILES.casual, 10], [PROFILES.casual, 17],
] as const)('clears Doyle’s fireplace in %j seed %i', (profile, seed) => {
  const room = playAbduction('farm_chimney', profile, seed, { hard: false, wakeFails: false });
  expect(room.result).toMatchObject({ delivered: true, woke: false });
});
