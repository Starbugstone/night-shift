import { describe, expect, it } from 'vitest';
import type { AbductResult, FlightResult } from '../src/contracts';
import { LEVELS } from '../src/levels/levels';
import {
  DELIVERY_PAY,
  NEW_STAR_PAY,
  REPEAT_STAR_PAY,
  applyRun,
  applyDeepRun,
  buyUpgrade,
  canBuy,
  computeStars,
  isLevelUnlocked,
  meterMultiplier,
  nextRank,
  nextDispatchIndex,
  rankFor,
  runReward,
  totalStars,
} from '../src/levels/progress';
import { defaultSave } from '../src/levels/save';
import { commentKey, itemsPhrase, vrellComment, VRELL_COMMENTS } from '../src/levels/humor';

const abduct = (o: Partial<AbductResult> = {}): AbductResult => ({
  delivered: true,
  woke: false,
  timeSec: 20,
  bonks: 1,
  dignity: 80,
  snores: 4,
  itemsStolen: [],
  aborted: false,
  ...o,
});
const flight = (o: Partial<FlightResult> = {}): FlightResult => ({ roomId: 'farm_window', timeSec: 15, spotted: 0, ...o });

describe('stars', () => {
  it('awards delivered / asleep / night owl', () => {
    expect(computeStars(50, abduct(), flight())).toEqual([true, true, true]);
    expect(computeStars(30, abduct(), flight())).toEqual([true, true, false]);
    expect(computeStars(50, abduct({ woke: true }), flight())).toEqual([true, false, true]);
    expect(computeStars(50, abduct({ delivered: false }), flight())).toEqual([false, false, false]);
    expect(computeStars(35, abduct(), flight())).toEqual([true, true, true]); // exactly par counts
  });
});

describe('glorbs and ranks', () => {
  it('pays new stars more than repeats', () => {
    expect(runReward([false, false, false], [true, true, false])).toEqual({ glorbs: DELIVERY_PAY + 2 * NEW_STAR_PAY, newStars: 2 });
    expect(runReward([true, true, false], [true, true, true])).toEqual({
      glorbs: DELIVERY_PAY + 2 * REPEAT_STAR_PAY + NEW_STAR_PAY,
      newStars: 1,
    });
    expect(runReward([true, true, true], [false, false, false])).toEqual({ glorbs: 0, newStars: 0 });
  });

  it('ranks follow total stars', () => {
    expect(rankFor(0).title).toBe('Intern');
    expect(rankFor(2).title).toBe('Intern');
    expect(rankFor(3).title).toBe('Probationary Abductor');
    expect(rankFor(5).title).toBe('Abductor');
    expect(rankFor(7).title).toBe('Abductor');
    expect(rankFor(8).title).toBe('Senior Abductor');
    expect(rankFor(11).title).toBe('Abduction Lead');
    expect(rankFor(12).title).toBe('Abduction Lead');
    expect(nextRank(3)?.title).toBe('Abductor');
    expect(nextRank(8)?.title).toBe('Abduction Lead');
    expect(rankFor(15).title).toBe('Head of Internal Affairs');
    expect(rankFor(21).title).toBe('Fleet Admiral of Naps');
    expect(nextRank(11)?.title).toBe('Head of Internal Affairs');
    expect(nextRank(19)).toBeNull();
  });

  it('applyRun merges best stars, pays, and never mutates the input', () => {
    const s0 = defaultSave();
    const r1 = applyRun(s0, 'level1', abduct({ woke: true }), flight());
    expect(s0.glorbs).toBe(0);
    expect(r1.save.levels.level1.stars).toEqual([true, false, true]);
    expect(r1.glorbs).toBe(DELIVERY_PAY + 2 * NEW_STAR_PAY);
    expect(r1.unlockedNext).toBe(true);
    const r2 = applyRun(r1.save, 'level1', abduct(), flight({ timeSec: 500 }));
    expect(r2.save.levels.level1.stars).toEqual([true, true, true]);
    expect(r2.newStarFlags).toEqual([false, true, false]);
    expect(totalStars(r2.save)).toBe(3);
    expect(r2.rankBefore.title).toBe('Intern');
    expect(r2.rankAfter.title).toBe('Probationary Abductor');
    expect(r2.save.levels.level1.bestTimeSec).toBe(35);
    expect(r2.save.reports).toBe(2);
  });
});

describe('unlocks', () => {
  it('opens each next district on its predecessor’s delivery star alone', () => {
    let save = defaultSave();
    for (const [index, level] of LEVELS.entries()) {
      expect(nextDispatchIndex(save)).toBe(index);
      expect(LEVELS.map((_, i) => isLevelUnlocked(save, i))).toEqual(LEVELS.map((_, i) => i <= index));
      const outcome = level.kind === 'tutorial'
        ? applyRun(save, level.id, abduct({ woke: true, timeSec: 999 }), flight())
        : applyDeepRun(save, level.id, { delivered: 3, spotted: 1, failedAbductions: 1, elapsedSec: level.budgetSec - 1, sunrise: false });
      expect(outcome.stars).toEqual([true, false, false]);
      expect(outcome.unlockedNext).toBe(index < LEVELS.length - 1);
      save = outcome.save;
    }
    expect(nextDispatchIndex(save)).toBe(-1);
  });

  it('level 2 unlocks only after level 1 is delivered', () => {
    const s = defaultSave();
    expect(isLevelUnlocked(s, 0)).toBe(true);
    expect(isLevelUnlocked(s, 1)).toBe(false);
    const failed = applyRun(s, 'level1', abduct({ delivered: false }), flight()).save;
    expect(isLevelUnlocked(failed, 1)).toBe(false);
    const ok = applyRun(s, 'level1', abduct({ woke: true, timeSec: 999 }), flight()).save;
    expect(isLevelUnlocked(ok, 1)).toBe(true);
    expect(isLevelUnlocked(ok, LEVELS.length)).toBe(false);
    expect(isLevelUnlocked({ ...s, allUnlocked: true }, 1)).toBe(true);
  });
});

describe('upgrades', () => {
  it('buys when affordable, once', () => {
    const s = { ...defaultSave(), glorbs: 30 };
    expect(canBuy(s, 'hush_drive')).toBe(false);
    const after = buyUpgrade(s, 'beam_dampener');
    expect(after?.glorbs).toBe(5);
    expect(after?.upgrades).toEqual(['beam_dampener']);
    expect(buyUpgrade(after!, 'beam_dampener')).toBeNull();
    expect(meterMultiplier(new Set(['hush_drive']))).toBe(0.75);
    expect(meterMultiplier(new Set())).toBe(1);
  });
});

describe('Vrell comments', () => {
  it('has at least 12 lines and picks by outcome', () => {
    const n = Object.values(VRELL_COMMENTS).reduce((a, l) => a + l.length, 0);
    expect(n).toBeGreaterThanOrEqual(12);
    const base = { flight: flight(), parSec: 50, stars: 2 };
    expect(commentKey({ ...base, abduct: abduct({ delivered: false }) })).toBe('rejected');
    expect(commentKey({ ...base, abduct: abduct({ woke: true }) })).toBe('woke');
    expect(commentKey({ ...base, stars: 3, abduct: abduct() })).toBe('perfect');
    expect(commentKey({ ...base, flight: flight({ spotted: 3 }), abduct: abduct() })).toBe('spotted');
    expect(commentKey({ ...base, abduct: abduct({ bonks: 6 }) })).toBe('bonks');
    expect(commentKey({ ...base, abduct: abduct({ itemsStolen: ['mug'] }) })).toBe('stole');
    expect(commentKey({ ...base, abduct: abduct({ bonks: 0, timeSec: 10 }) })).toBe('clean');
    const line = vrellComment({ ...base, abduct: abduct({ bonks: 6 }) }, 0);
    expect(line).toContain('6');
    expect(itemsPhrase(['mug', 'slipper', 'slipper'])).toBe('1 mug, 2 slippers');
  });
});
