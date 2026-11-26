import { describe, expect, it } from 'vitest';
import { fmt, TABLES, tr } from '../src/i18n';
import { LEVELS, formatOrderNumber, workOrderNumber } from '../src/levels/levels';
import { isLevelUnlocked, nextDispatchIndex } from '../src/levels/progress';
import { defaultLevel, defaultSave, validateSave } from '../src/levels/save';
import { memoAddressee } from '../src/ui/memo';

const original = ['level1', 'level2', 'level3', 'level4', 'level5', 'level6', 'level7', 'level8', 'level9'];
const ids = [...original.slice(0, 2), 'birch_bakery', 'birch_neighbours', ...original.slice(2)];
const order = ids.map(id => ({ id }));
const record = { stars: [true, true, false, true], delivered: true, bestTimeSec: 83, attempts: 4 };

describe('work order insertion', () => {
  it('numbers every English and French order label from its position, including the archive and dossier hints', () => {
    expect(workOrderNumber('level3', order)).toBe(5);
    expect(workOrderNumber('level8', order)).toBe(10);
    expect(workOrderNumber('level9', order)).toBe(11);
    for (const t of Object.values(TABLES)) {
      for (const template of [t.workOrders.orderNo, t.flight.orderNo, t.flight.banner, t.levels.level8.re,
        t.trophies.unfiledHint, t.trophies.specimens.notCollectedDetail, t.trophies.town.unfiledDetail]) {
        expect(fmt(template, { num: formatOrderNumber(workOrderNumber('level8', order)) })).toMatch(/(?:#|°)0010(?!\d)/);
      }
      expect(fmt(t.crestValley.order, { num: formatOrderNumber(workOrderNumber('level9', order)) })).toMatch(/(?:#|°)0011/);
      for (const level of LEVELS) expect(t.levels[level.id].re).toContain('{num}');
    }
  });

  it('addresses Zib as Agent only on orders after the Prior Contact promotion', () => {
    for (const id of ['birch_neighbours', 'level7', 'level8']) expect(memoAddressee(id)).toBe(tr().memo.to);
    for (const id of ['level9', 'level10', 'level11', 'level12']) expect(memoAddressee(id)).toBe(tr().memo.toAgent);
  });

  it('keeps every old star, time and unlock through the bridge without awarding either new delivery', () => {
    const levels = Object.fromEntries(original.map(id => [id, record]));
    const old = { version: 2, levels };
    const migrated = validateSave(old, ids);
    expect(migrated.bridgeAccess).toBe(true);
    expect(order.every((_, i) => isLevelUnlocked(migrated, i, order))).toBe(true);
    expect(migrated.levels).toMatchObject(levels);
    for (const id of ['birch_bakery', 'birch_neighbours']) expect(migrated.levels[id]).toEqual(defaultLevel());
    expect(validateSave(migrated, ids)).toEqual(migrated);
    expect(validateSave(validateSave(old), ids)).toEqual(migrated);

    // This build can be released before the bridge. A v3 player who clears Maple in the meantime qualifies too.
    expect(validateSave({ ...defaultSave(), levels }, ids)).toEqual(migrated);
    migrated.levels.birch_bakery = { ...defaultLevel(), delivered: true, stars: [true, false, false, true] };
    expect(validateSave(validateSave(migrated), ids)).toEqual(migrated);
  });

  it('keeps the sequential path for a fresh or Spin-City-only save and protects a Maple retry', () => {
    const levels = { level1: record, level2: record };
    const fresh = validateSave({ version: 2, levels }, ids);
    expect(order.slice(2, 5).map((_, i) => isLevelUnlocked(fresh, i + 2, order))).toEqual([true, false, false]);
    fresh.levels.birch_bakery!.delivered = true;
    expect(isLevelUnlocked(fresh, 3, order)).toBe(true);
    expect(isLevelUnlocked(fresh, 4, order)).toBe(false);
    fresh.levels.birch_neighbours!.delivered = true;
    expect(isLevelUnlocked(fresh, 4, order)).toBe(true);

    const retry = validateSave({ version: 2, levels: { ...levels, level3: { attempts: 1 } } }, ids);
    expect(order.slice(2, 5).every((_, i) => isLevelUnlocked(retry, i + 2, order))).toBe(true);
    expect(nextDispatchIndex(retry, order)).toBe(2);
    const veteran = validateSave({ version: 2, levels: { level7: record } }, ids);
    expect(order[nextDispatchIndex(veteran, order)]?.id).toBe('level8');
  });

  it('limits the v1 legacy grant to the original five districts', () => {
    const save = validateSave({ version: 1, reports: 1 }, ids);
    const open = order.filter((_, i) => isLevelUnlocked(save, i, order)).map(level => level.id);
    expect(open).toEqual(['level1', 'level3', 'level4', 'level5', 'level6', 'level7']);
  });
});

describe('Temporal Dispatch prerequisites', () => {
  it('numbers 1122, 1953 and 2199 in order and registers the finale prerequisites', () => {
    expect(LEVELS.slice(11, 14).map(level => level.id)).toEqual(['level10', 'level11', 'level12']);
    expect(LEVELS[13]?.requires).toEqual(['level10', 'level11']);
    for (const [id, expected] of [['level10', '0012'], ['level11', '0013'], ['level12', '0014']] as const) {
      const num = formatOrderNumber(workOrderNumber(id));
      expect(num).toBe(expected);
      for (const t of Object.values(TABLES)) {
        expect(fmt(t.workOrders.orderNo, { num })).toMatch(new RegExp(`[#°]${expected}\\b`));
        expect(fmt(t.levels[id].re, { num })).toMatch(new RegExp(`[#°]${expected}\\b`));
      }
    }
  });

  const eras = [{ id: 'level9', requires: [] }, { id: '1122', requires: ['level9'] },
    { id: '1953', requires: ['level9'] }, { id: '2199', requires: ['1122', '1953'] }];
  it.each([['1122', '1953'], ['1953', '1122']])('allows %s first and opens the finale after %s', (first, second) => {
    const s = defaultSave();
    const open = () => eras.map((_, i) => isLevelUnlocked(s, i, eras));
    expect(open()).toEqual([true, false, false, false]);
    s.levels.level9.delivered = true;
    expect(open()).toEqual([true, true, true, false]);
    s.levels[first] = { ...defaultLevel(), delivered: true };
    expect(open()).toEqual([true, true, true, false]);
    s.levels[second] = { ...defaultLevel(), delivered: true };
    expect(open()).toEqual([true, true, true, true]);
    expect(nextDispatchIndex(s, eras)).toBe(3);
  });
});
