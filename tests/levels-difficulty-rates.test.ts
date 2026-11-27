// The rate-band rule of the difficulty gate (tests/difficulty/rates.ts, user decision 2026-11-27):
// exact bands from 20 attempts (`npm run difficulty:release`), a one-sided exact binomial sanity check
// below (the six-seed `npm run difficulty` inside `npm test`), so six seeds catch big regressions and not
// seed luck. The counts below are the 2026-11-27 six-seed misses after the touch-path model change and
// their 20-seed counterparts from the release sweep.
import { describe, expect, it } from 'vitest';
import { ALPHA, EXACT_FROM, binomCdf, binomSf, fisherGreater, judgeOrder, judgeRate } from './difficulty/rates';

describe('binomial and Fisher tails', () => {
  it('match hand-computed values', () => {
    expect(binomCdf(2, 6, 0.5)).toBeCloseTo(22 / 64, 12);
    expect(binomSf(6, 6, 0.9)).toBeCloseTo(0.9 ** 6, 12);
    expect(binomCdf(6, 6, 0.3)).toBeCloseTo(1, 12);
    expect(binomCdf(-1, 6, 0.3)).toBe(0);
    // 12 attempts, 8 successes, the second row of 6 takes 5 or more: (6·20 + 1·15) / 495
    expect(fisherGreater(3, 6, 5, 6)).toBeCloseTo(135 / 495, 12);
  });
});

describe('six seeds: a sanity check, not a lottery', () => {
  it.each([
    ['Bakery casual Ghost under the 90% cap', 6, 6, { min: 5 / 6, max: 0.9 }],
    ['L4 skilled Ghost', 3, 6, { min: 2 / 3 }],
    ['L5 skilled Ghost', 3, 6, { min: 0.6 }],
    ['L7 skilled Ghost', 2, 6, { min: 0.5 }],
    ['L9 skilled Night owl under the 90% cap', 6, 6, { max: 0.9 }],
  ] as const)('%s at %i/%i is outside the exact band but passes', (_label, k, n, band) => {
    const c = judgeRate('x', k, n, band);
    expect(c.mode).toBe('sanity');
    expect(c.inBand).toBe(false);
    expect(c.pass).toBe(true);
    expect(c.p!).toBeGreaterThanOrEqual(ALPHA);
  });

  it.each([
    ['a 5/6 floor at 2/6', 2, 6, { min: 5 / 6 }],
    ['a 50% floor at 0/6', 0, 6, { min: 0.5 }],
    ['a 2/3 floor at 1/6', 1, 6, { min: 2 / 3 }],
    ['a 100% floor at 5/6', 5, 6, { min: 1 }],
    ['a 10% ceiling at 4/6', 4, 6, { max: 0.1 }],
  ] as const)('a big regression still fails: %s', (_label, k, n, band) => {
    const c = judgeRate('x', k, n, band);
    expect(c.pass).toBe(false);
    expect(c.p!).toBeLessThan(ALPHA);
  });

  it('ties and small inversions in "skilled above casual" pass; a rout fails', () => {
    expect(judgeOrder('x', 6, 6, 6, 6).pass).toBe(true);
    expect(judgeOrder('x', 3, 6, 4, 6).pass).toBe(true);
    expect(judgeOrder('x', 2, 6, 3, 6).pass).toBe(true);
    expect(judgeOrder('x', 0, 6, 5, 6).pass).toBe(false);
  });
});

describe(`from ${EXACT_FROM} attempts the band is exact`, () => {
  it('judges k/n against the band with no tolerance', () => {
    expect(judgeRate('x', 19, 20, { max: 0.9 })).toMatchObject({ mode: 'exact', pass: false, inBand: false });
    expect(judgeRate('x', 18, 20, { max: 0.9 })).toMatchObject({ mode: 'exact', pass: true });
    expect(judgeRate('x', 16, 20, { min: 5 / 6 }).pass).toBe(false);
    expect(judgeRate('x', 17, 20, { min: 5 / 6 }).pass).toBe(true);
    expect(judgeRate('x', 9, 20, { min: 0.5 }).pass).toBe(false);
    expect(judgeRate('x', 7, 20, { min: 0.33, max: 0.38 }).pass).toBe(true);
    expect(judgeRate('x', 8, 20, { min: 0.33, max: 0.38 }).pass).toBe(false);
    expect(judgeRate('x', 20, 20, { min: 1 }).pass).toBe(true);
    expect(judgeOrder('x', 20, 20, 20, 20).pass).toBe(false);
    expect(judgeOrder('x', 16, 20, 12, 20).pass).toBe(true);
  });

  it('a band the old code compared as a share keeps its boundary (5/6 of 24 is 20)', () => {
    expect(judgeRate('x', 20, 24, { min: 5 / 6 }).pass).toBe(true);
    expect(judgeRate('x', 19, 24, { min: 5 / 6 }).pass).toBe(false);
  });
});
