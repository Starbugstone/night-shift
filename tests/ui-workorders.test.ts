import { expect, it } from 'vitest';
import { ART } from '../src/art-manifest';
import { LEVELS } from '../src/levels/levels';
import { targetHeadKey } from '../src/ui/draw';

for (const level of LEVELS) {
  if (level.kind !== 'deep' || level.map.targets.length !== 3) continue;

  it(`resolves three distinct Work Orders portraits for ${level.id}`, () => {
    const keys = level.map.targets.map(targetHeadKey);
    expect(new Set(keys).size).toBe(3);
    for (const key of keys) expect(ART[key], key).toBeDefined();
  });
}
