// v4: the fourth star is the level's town pickup, taken on a successful run. L1 has none.
import { describe, expect, it } from 'vitest';
import type { AbductResult, FlightResult } from '../src/contracts';
import { LEVELS } from '../src/levels/levels';
import { MAX_STARS, applyDeepRun, applyRun, countStars, levelStarCount, starLabels, totalStars } from '../src/levels/progress';
import { defaultSave, validateSave } from '../src/levels/save';

const abduct = (o: Partial<AbductResult> = {}): AbductResult => ({
  delivered: true, woke: false, timeSec: 20, bonks: 0, dignity: 100, snores: 3, itemsStolen: [], aborted: false, ...o,
});
const flight = (o: Partial<FlightResult> = {}): FlightResult => ({ roomId: 'laundry_skylight', timeSec: 10, spotted: 0, ...o });

describe('town pickup star', () => {
  it('exists on every level with a pickup (all but L1) and is named after the pickup', () => {
    expect(levelStarCount(LEVELS[0]!)).toBe(3);
    for (const l of LEVELS.slice(1)) {
      expect(levelStarCount(l), l.id).toBe(4);
      expect(starLabels(l), l.id).toHaveLength(4);
    }
    expect(MAX_STARS).toBe(LEVELS.reduce((n, l) => n + levelStarCount(l), 0));
  });

  it('is earned by taking the pickup on a delivered run, not by a failed one or another id', () => {
    expect(applyRun(defaultSave(), 'level2', abduct(), flight({ mapCollectible: 'slipper_flyer' })).stars[3]).toBe(true);
    expect(applyRun(defaultSave(), 'level2', abduct(), flight()).stars[3]).toBe(false);
    expect(applyRun(defaultSave(), 'level2', abduct({ delivered: false }), flight({ mapCollectible: 'slipper_flyer' })).stars[3]).toBe(false);
    expect(applyRun(defaultSave(), 'level2', abduct(), flight({ mapCollectible: 'shrimp_tower' })).stars[3]).toBe(false);
  });

  it('on a deep shift needs all three delivered before sunrise, and stays earned once won', () => {
    const won = applyDeepRun(defaultSave(), 'level6', { delivered: 3, elapsedSec: 300, spotted: 2, failedAbductions: 1, sunrise: false, mapCollectible: 'defibrillator' });
    expect(won.stars[3]).toBe(true);
    expect(won.newStarFlags[3]).toBe(true);
    const sunrise = applyDeepRun(defaultSave(), 'level6', { delivered: 2, elapsedSec: 450, spotted: 0, failedAbductions: 0, sunrise: true, mapCollectible: 'defibrillator' });
    expect(sunrise.stars[3]).toBe(false);
    const again = applyDeepRun(won.save, 'level6', { delivered: 3, elapsedSec: 300, spotted: 0, failedAbductions: 0, sunrise: false });
    expect(again.save.levels.level6.stars[3]).toBe(true);
    expect(countStars(again.save.levels.level6.stars)).toBe(4);
    expect(totalStars(again.save)).toBe(4);
  });

  it('is granted on load to a delivered level whose pickup a pre-star save already filed', () => {
    const old = validateSave({ version: 2, levels: { level2: { stars: [true, true, false], delivered: true, mapCollectible: 'slipper_flyer' } } });
    expect(old.levels.level2.stars).toEqual([true, true, false, true]);
    const notDelivered = validateSave({ version: 2, levels: { level2: { stars: [false, false, false], mapCollectible: 'slipper_flyer' } } });
    expect(notDelivered.levels.level2.stars[3]).toBe(false);
  });
});
