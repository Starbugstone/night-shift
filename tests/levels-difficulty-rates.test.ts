// The rate-band rule of the difficulty gate (tests/difficulty/rates.ts, user decision 2026-11-27):
// exact bands from 20 attempts (`npm run difficulty:release`), a one-sided exact binomial sanity check
// below (the six-seed `npm run difficulty` inside `npm test`), so six seeds catch big regressions and not
// seed luck. The counts below are the 2026-11-27 six-seed misses after the touch-path model change and
// their 20-seed counterparts from the release sweep.
import { describe, expect, it } from 'vitest';
import { ALPHA, EXACT_FROM, MIN_BAND_COUNTS, admittedCounts, binomCdf, binomSf, fisherGreater, judgeOrder, judgeRate, narrowBands, widenBand } from './difficulty/rates';
import { BANDS, CASUAL_GHOST_CAP, STAR_FLOORS } from './difficulty/evaluate';
import { FINALE_BANDS } from './difficulty/dispatch2199';
import { GRAIL_TARGETS } from './difficulty/grail';

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

// Round 2 (user decision 2026-11-27): once Pages gated on the sweep, a band that admits one or two counts out of 20
// (the 2199 casual Ghost 33–38% admitted only 7/20) turns seed luck into a red build. Every band admits three.
describe(`every rate band admits at least ${MIN_BAND_COUNTS} counts out of ${EXACT_FROM}`, () => {
  it('widens a narrow band about its centre in whole counts', () => {
    expect(widenBand({ min: 0.33, max: 0.38 })).toEqual({ min: 0.30, max: 0.40 });
    expect(widenBand({ min: 0.50, max: 0.55 })).toEqual({ min: 0.45, max: 0.60 });
    expect(widenBand({ min: 0.85, max: 0.92 })).toEqual({ min: 0.85, max: 0.95 });
    expect(widenBand({ min: 0.67, max: 0.75 })).toEqual({ min: 0.65, max: 0.75 });
    expect(widenBand({ min: 0.40, max: 0.45 })).toEqual({ min: 0.35, max: 0.50 });
    expect(widenBand({ min: 1, max: 1 })).toEqual({ min: 0.9, max: 1 });
    // a wide band stays as it is
    expect(widenBand({ min: 0.55, max: 0.75 })).toEqual({ min: 0.55, max: 0.75 });
  });

  it('the Grail targets and the 2199 finale bands', () => {
    for (const table of [FINALE_BANDS, GRAIL_TARGETS]) {
      for (const [profile, bands] of Object.entries(table)) {
        for (const [i, [lo, hi]] of bands.entries()) {
          const scale = hi > 1 ? 100 : 1;
          const band = { min: lo / scale, max: hi / scale };
          expect(admittedCounts([band]).length, `${profile} star ${i}: ${lo}–${hi}`).toBeGreaterThanOrEqual(MIN_BAND_COUNTS);
          expect(widenBand(band), `${profile} star ${i} is already wide`).toEqual(band);
        }
      }
    }
  });

  it('the tier star floors (with the casual Ghost cap on deep levels) and the deep route, building and flight floors', () => {
    for (const [tier, profiles] of Object.entries(STAR_FLOORS)) {
      for (const [profile, floors] of Object.entries(profiles)) {
        floors.forEach((min, i) => {
          const band = { min, ...(tier !== 'tutorial' && profile === 'casual' && i === 1 ? { max: CASUAL_GHOST_CAP } : {}) };
          expect(admittedCounts([band]).length, `${tier} ${profile} star ${i}`).toBeGreaterThanOrEqual(MIN_BAND_COUNTS);
        });
      }
    }
    for (const [id, band] of Object.entries(BANDS)) {
      for (const key of ['skilledRoute', 'casualRoute', 'casualBuilding', 'flightDone'] as const) {
        expect(admittedCounts([{ min: band![key] }]).length, `${id} ${key}`).toBeGreaterThanOrEqual(MIN_BAND_COUNTS);
      }
    }
  });

  it('the guard counts every band on one count together, and lets a single proof run through (mutation check)', () => {
    const narrow = judgeRate('Finale band: Ghost (casual)', 7, 20, { min: 0.33, max: 0.38 });
    expect(narrowBands([narrow])).toHaveLength(1);
    const floor = { ...judgeRate('Ghost (casual)', 7, 20, { min: 0.33, max: 0.9 }), key: 'star 1 (casual)' };
    const design = { ...judgeRate('Finale band: Ghost (casual)', 7, 20, { min: 0.30, max: 0.40 }), key: 'star 1 (casual)' };
    expect(narrowBands([design])).toEqual([]);
    expect(narrowBands([floor, design])[0]).toMatch(/admit 7, 8 out of 20/);
    expect(narrowBands([judgeRate('Pickup detour (bot)', 1, 1, { min: 1 })])).toEqual([]);
  });
});
