import { describe, expect, it } from 'vitest';
import { SAVE_KEY, defaultSave, loadSave, validateSave, writeSave, clearSave, type KeyValueStore } from '../src/levels/save';

function memStore(init: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...init };
  return {
    data,
    getItem: (k) => (k in data ? data[k]! : null),
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  };
}

describe('save', () => {
  it('missing storage or key gives defaults', () => {
    expect(loadSave(null)).toEqual(defaultSave());
    expect(loadSave(memStore())).toEqual(defaultSave());
  });

  it('round-trips through storage under the v1 key', () => {
    const s = memStore();
    const save = defaultSave();
    save.glorbs = 42;
    save.levels.level1 = { stars: [true, false, true], delivered: true, bestTimeSec: 33.5, attempts: 2 };
    save.upgrades = ['hush_drive'];
    save.muted = true;
    expect(writeSave(s, save)).toBe(true);
    expect(Object.keys(s.data)).toEqual([SAVE_KEY]);
    expect(loadSave(s)).toEqual(save);
    clearSave(s);
    expect(loadSave(s)).toEqual(defaultSave());
  });

  it('corrupt JSON gives defaults', () => {
    expect(loadSave(memStore({ [SAVE_KEY]: '{not json' }))).toEqual(defaultSave());
  });

  it('throwing storage is tolerated', () => {
    const bad: KeyValueStore = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('nope');
      },
    };
    expect(loadSave(bad)).toEqual(defaultSave());
    expect(writeSave(bad, defaultSave())).toBe(false);
    expect(() => clearSave(bad)).not.toThrow();
  });

  it('validates bad field types', () => {
    const v = validateSave({
      glorbs: -5,
      levels: { level1: { stars: 'lots', delivered: 'yes', bestTimeSec: -3, attempts: NaN }, level2: 7 },
      upgrades: ['hush_drive', 'laser_eyes', 'hush_drive', 3],
      muted: 'true',
      reports: Infinity,
    });
    expect(v.glorbs).toBe(0);
    expect(v.levels.level1).toEqual({ stars: [false, false, false], delivered: false, bestTimeSec: null, attempts: 0 });
    expect(v.levels.level2.delivered).toBe(false);
    expect(v.upgrades).toEqual(['hush_drive']);
    expect(v.muted).toBe(false);
    expect(v.reports).toBe(0);
    expect(validateSave(null)).toEqual(defaultSave());
    expect(validateSave([1, 2])).toEqual(defaultSave());
  });

  it('migrates a legacy star-count shape', () => {
    const v = validateSave({ glorbs: 12.7, levels: { level1: { stars: 2, bestTime: 40 } } });
    expect(v.glorbs).toBe(12);
    expect(v.levels.level1.stars).toEqual([true, true, false]);
    expect(v.levels.level1.delivered).toBe(true);
    expect(v.levels.level1.bestTimeSec).toBe(40);
    expect(v.version).toBe(1);
  });

  it('refunds retired upgrades once and ignores inherited names', () => {
    const storage = memStore({ [SAVE_KEY]: JSON.stringify({
      glorbs: 25,
      upgrades: ['afterburner', 'constructor', '__proto__', 'toString', 'afterburner', 'hush_drive'],
    }) });
    const save = loadSave(storage);
    expect(save.glorbs).toBe(85);
    expect(save.upgrades).toEqual(['hush_drive']);
    expect(writeSave(storage, save)).toBe(true);
    expect(loadSave(storage)).toEqual(save);
  });
});
