import { describe, expect, it } from 'vitest';
import { setLang, tr } from '../src/i18n';
import { FIELD_CHECK_INDEX } from '../src/levels/field-check';
import { BIRCH_BAKERY } from '../src/levels/deep-birch-bakery';
import { BIRCH_NEIGHBOURS } from '../src/levels/deep-birch-neighbours';
import { LEVELS, workOrderNumber } from '../src/levels/levels';
import { applyDeepRun, computeDeepStars, isLevelUnlocked, levelStarCount, nextDispatchIndex } from '../src/levels/progress';
import { loadingTips } from '../src/levels/humor';
import { DeepRun } from '../src/levels/run';
import { defaultSave, validateSave } from '../src/levels/save';
import { memoAddressee } from '../src/ui/memo';
import { gnomePostcards } from '../src/ui/trophy-data';
import { autopilotController, runHeadless } from './flight-deep-harness';
import { BEELINE_DELAYS, beelineFlight } from './difficulty/beeline';
import { playAbduction, PROFILES } from './difficulty/human';
import { evaluateStars } from './difficulty/stars';

describe('Birch Lane dispatch', () => {
  it('inserts orders #0003 and #0004 before Maple Court and makes bakery the Field Check destination', () => {
    expect(LEVELS[FIELD_CHECK_INDEX]?.id).toBe('birch_bakery');
    expect(workOrderNumber('birch_bakery')).toBe(3);
    expect(workOrderNumber('birch_neighbours')).toBe(4);
    expect(workOrderNumber('level3')).toBe(5);
    expect(LEVELS.slice(0, workOrderNumber('level9')).reduce((sum, level) => sum + levelStarCount(level), 0)).toBe(43);
    const save = defaultSave();
    save.levels.level1.delivered = save.levels.level2.delivered = true;
    expect(nextDispatchIndex(save)).toBe(FIELD_CHECK_INDEX);
    expect(loadingTips(save)).not.toContain(tr().birch.pruittTip);
    expect(isLevelUnlocked(save, FIELD_CHECK_INDEX + 1)).toBe(false);
    save.levels.birch_bakery.delivered = true;
    expect(nextDispatchIndex(save)).toBe(FIELD_CHECK_INDEX + 1);
    expect(isLevelUnlocked(save, FIELD_CHECK_INDEX + 2)).toBe(false);
    save.levels.birch_neighbours.delivered = true;
    expect(loadingTips(save)).toContain(tr().birch.pruittTip);
    expect(nextDispatchIndex(save)).toBe(FIELD_CHECK_INDEX + 2);
  });

  it('grants bridge access on an old Maple attempt and preserves a veteran’s forward dispatch', () => {
    const started = { level1: { delivered: true }, level2: { delivered: true } };
    const returning = validateSave({ version: 2, levels: { ...started, level3: { attempts: 1 } } });
    expect(returning.bridgeAccess).toBe(true);
    expect(returning.levels.birch_bakery.attempts).toBe(0);
    expect(nextDispatchIndex(returning)).toBe(FIELD_CHECK_INDEX);
    expect(isLevelUnlocked(returning, FIELD_CHECK_INDEX + 2)).toBe(true);
    const veteran = validateSave({ version: 3, levels: { ...started, level3: { delivered: true }, level4: { delivered: true } } });
    expect(veteran.bridgeAccess).toBe(true);
    expect(LEVELS[nextDispatchIndex(veteran)]?.id).toBe('level5');
  });

  it('rotates junior dispatch stationery and collected gnome postcards with the stable era flags', () => {
    setLang('en');
    const save = defaultSave();
    const era = { stars: [true, false, false, false] as const, delivered: true, attempts: 1 };
    for (const [key, delivery] of Object.entries({ level11: era, level12: era, level10: era })) {
      const next = validateSave({ ...save, levels: { ...save.levels, [key]: delivery } });
      expect(gnomePostcards(next)).toEqual([]);
    }
    save.levels.birch_neighbours.mapCollectible = 'garden_gnome';
    const late = validateSave({ ...save, levels: { ...save.levels, level11: era } });
    expect(gnomePostcards(late)).toEqual(['1953 · ' + tr().birch.post1953]);
    const both = validateSave({ ...late, levels: { ...late.levels, level10: era } });
    const done = validateSave({ ...both, levels: { ...both.levels, level12: era } });
    expect(gnomePostcards(validateSave(JSON.parse(JSON.stringify(done))))).toEqual([
      '1122 · ' + tr().birch.post1122, '1953 · ' + tr().birch.post1953, '2199 · ' + tr().birch.post2199,
    ]);
    expect(memoAddressee('level7', true)).toBe(tr().memo.to);
    expect(memoAddressee('level9')).toBe(tr().memo.toAgent);
    expect(memoAddressee('level12', done.levels.level12?.delivered)).toBe(tr().memo.toAgentSenior);
  });
});

describe('Birch Lane shift rules', () => {
  const base = { delivered: 1, elapsedSec: 56, spotted: 0, failedAbductions: 0, sunrise: false };
  it('scores the bakery at 56 seconds and keeps ticking without sunrise', () => {
    const run = new DeepRun(BIRCH_BAKERY, FIELD_CHECK_INDEX);
    expect(run.tick(220)).toBe(false);
    expect(run.clockText()).toBe('3:40');
    expect(run.dawn).toBe(0);
    expect(computeDeepStars(Infinity, 0, base, 'birch_bakery')).toEqual([true, true, true, false]);
    const late = { ...base, elapsedSec: 56.01, spotted: 1, mapCollectible: 'cherry_pie' as const };
    expect(applyDeepRun(defaultSave(), 'birch_bakery', late).stars).toEqual([true, false, false, true]);
  });

  it('scores both neighbours at 100 seconds and keeps a filed pickup after sunrise', () => {
    expect(computeDeepStars(210, 110, base, 'birch_neighbours')).toEqual([false, false, false, false]);
    const full = { ...base, delivered: 2, elapsedSec: 100, mapCollectible: 'garden_gnome' as const };
    expect(computeDeepStars(210, 110, full, 'birch_neighbours')).toEqual([true, true, true, true]);
    const expired = applyDeepRun(defaultSave(), 'birch_neighbours', { ...full, elapsedSec: 210, sunrise: true });
    expect(expired.stars).toEqual([false, false, false, false]);
    expect(expired.save.levels.birch_neighbours.mapCollectible).toBe('garden_gnome');
    const run = new DeepRun(BIRCH_NEIGHBOURS, FIELD_CHECK_INDEX + 1);
    expect(run.clockText()).toBe('2:00');
    expect(run.tick(210)).toBe(true);
    expect(run.clockText()).toBe('6:00');
  });

  it('flies both Birch Lane maps cleanly and delivers the neighbours in either order', () => {
    const bakery = runHeadless(BIRCH_BAKERY.map, [], autopilotController(), 60, true);
    expect(bakery.done).toBe(true);
    expect(bakery.spots).toEqual([]);
    for (const order of [[0, 1], [1, 0]]) {
      const [run] = evaluateStars(BIRCH_NEIGHBOURS, PROFILES.bot, 1, playAbduction, order).runs;
      expect(run?.stars.slice(0, 2)).toEqual([true, true]);
      expect(run?.rooms.map(room => room.split('_')[0])).toEqual(order.map(target => ['nora', 'len'][target]));
    }
    for (const level of [BIRCH_BAKERY, BIRCH_NEIGHBOURS]) expect(beelineFlight(level)).toBe(BEELINE_DELAYS.length);
  }, 20_000);
});
