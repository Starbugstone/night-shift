import { describe, expect, it } from 'vitest';
import { isLevelUnlocked, nextDispatchIndex, rankFor, totalStars } from '../src/levels/progress';
import { LEGACY_SAVE_KEY, LEVEL_IDS, SAVE_KEY, SAVE_VERSION, defaultSave, loadSave, validateSave, writeSave, clearSave, type KeyValueStore } from '../src/levels/save';

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

  it('round-trips through storage under the v2 key', () => {
    const s = memStore();
    const save = defaultSave();
    save.glorbs = 42;
    save.levels.level1 = { stars: [true, false, true, false], delivered: true, bestTimeSec: 33.5, attempts: 2 };
    save.upgrades = ['hush_drive'];
    save.muted = true;
    expect(writeSave(s, save)).toBe(true);
    expect(Object.keys(s.data)).toEqual([SAVE_KEY]);
    expect(loadSave(s)).toEqual(save);
    clearSave(s);
    expect(loadSave(s)).toEqual(defaultSave());
  });

  it('imports the v1 save once and never writes the v1 key', () => {
    const v1 = JSON.stringify({ version: 1, glorbs: 30, levels: { level1: { stars: [true, true, false] } }, muted: true, lang: 'fr' });
    const s = memStore({ [LEGACY_SAVE_KEY]: v1 });
    const save = loadSave(s);
    expect(save).toMatchObject({ version: SAVE_VERSION, glorbs: 30, muted: true, lang: 'fr' });
    expect(save.levels.level1.stars).toEqual([true, true, false, false]);
    save.glorbs = 31;
    expect(writeSave(s, save)).toBe(true);
    expect(s.data[LEGACY_SAVE_KEY]).toBe(v1);
    expect(loadSave(s)).toEqual(save);
    // a reset does not bring the v1 progress back, and leaves the v1 save to its own build
    clearSave(s);
    expect(loadSave(s)).toEqual(defaultSave());
    expect(s.data[LEGACY_SAVE_KEY]).toBe(v1);
  });

  it('a v1 build writing after the v2 save does not wipe it (production and preprod share an origin)', () => {
    const s = memStore();
    const save = defaultSave();
    save.glorbs = 88;
    save.levels.level8 = { stars: [true, true, true, false], delivered: true, bestTimeSec: 44, attempts: 1 };
    save.fieldCheckSeen = true;
    save.muted = true;
    save.lang = 'fr';
    expect(writeSave(s, save)).toBe(true);
    // what the production build writes on its next save: the v1 format, without L8 or the Field Check
    const v1Levels = Object.fromEntries(LEVEL_IDS.slice(0, 7).map((id) => [id, { stars: [false, false, false], delivered: false, bestTimeSec: null, attempts: 0 }]));
    s.data[LEGACY_SAVE_KEY] = JSON.stringify({ version: 1, glorbs: 88, levels: v1Levels, upgrades: [], muted: false, allUnlocked: false });
    const back = loadSave(s);
    expect(back).toEqual(save);
    expect(back.levels.level8.stars).toEqual([true, true, true, false]);
    expect(back).toMatchObject({ fieldCheckSeen: true, muted: true, lang: 'fr' });
  });

  it('persists a v1 import at once, so a later v1 write cannot drop it (same origin, no setting changed)', () => {
    // the v1 key as an older preprod build left it: v1 key, but holding L8 and the Field Check
    const v1Levels = Object.fromEntries(LEVEL_IDS.slice(0, 7).map((id) => [id, { stars: [false, false, false], delivered: false, bestTimeSec: null, attempts: 0 }]));
    const legacy = { version: 2, glorbs: 88, reports: 8, lang: 'en', fieldCheckSeen: true, muted: false,
      levels: { ...v1Levels, level8: { stars: [true, true, true], delivered: true, bestTimeSec: 44, attempts: 0 } } };
    const s = memStore({ [LEGACY_SAVE_KEY]: JSON.stringify(legacy) });
    // preprod opens once and the player leaves without touching a setting
    const first = loadSave(s);
    expect(first.levels.level8.bestTimeSec).toBe(44);
    expect(s.data[SAVE_KEY]).toBeDefined();
    // production then saves (a mute toggle) in its own format, without L8
    s.data[LEGACY_SAVE_KEY] = JSON.stringify({ version: 1, glorbs: 88, levels: v1Levels, upgrades: [], muted: true, allUnlocked: false, reports: 8, lang: 'en' });
    // preprod reloads: progress intact, and the production write is not imported again
    const back = loadSave(s);
    expect(back).toEqual(first);
    expect(back.levels.level8).toEqual({ stars: [true, true, true, false], delivered: true, bestTimeSec: 44, attempts: 0 });
    expect(back).toMatchObject({ fieldCheckSeen: true, glorbs: 88, muted: false });
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
    expect(v.levels.level1).toEqual({ stars: [false, false, false, false], delivered: false, bestTimeSec: null, attempts: 0 });
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
    expect(v.levels.level1.stars).toEqual([true, true, false, false]);
    expect(v.levels.level1.delivered).toBe(true);
    expect(v.levels.level1.bestTimeSec).toBe(40);
    expect(v.version).toBe(SAVE_VERSION);
  });

  it.each([0, 1, 2, 3, 4, 5, 6, 7, 8])('migrates a v1 save with %s deliveries and retains its access', (clears) => {
    const completed = LEVEL_IDS.slice(0, clears);
    const record = { stars: [true, false, true], bestTimeSec: 40, attempts: 3 };
    const levels = Object.fromEntries(completed.map(id => [id, record]));
    const storage = memStore({ [LEGACY_SAVE_KEY]: JSON.stringify({ version: 1, levels, glorbs: clears * 15, reports: clears }) });
    const save = loadSave(storage);
    expect(save.glorbs).toBe(clears * 15);
    expect(save.reports).toBe(clears);
    expect(totalStars(save)).toBe(clears * 2);
    expect(rankFor(totalStars(save))).toBe(rankFor(clears * 2));
    for (const id of completed) expect(save.levels[id]).toEqual({ ...record, stars: [...record.stars, false], delivered: true });
    expect(LEVEL_IDS.map((_, i) => isLevelUnlocked(save, i))).toEqual([
      true, clears >= 1, clears > 0, clears > 0, clears > 0, clears > 0, clears > 0, clears >= 7,
    ]);
    expect(nextDispatchIndex(save)).toBe(clears === LEVEL_IDS.length ? -1 : clears);
    expect(save.fieldCheckSeen).toBe(clears >= 2);
    expect(writeSave(storage, save)).toBe(true);
    expect(loadSave(storage)).toEqual(save);
  });

  it('preserves out-of-order progress and keeps L8 after a delivered cruise', () => {
    const old = validateSave({ version: 1, level: 'ignored', glorbs: 81, levels: { level5: { attempts: 2 }, level7: { stars: 2, bestTime: 170 } } });
    expect(isLevelUnlocked(old, 1)).toBe(false);
    expect(isLevelUnlocked(old, 4)).toBe(true);
    expect(isLevelUnlocked(old, 7)).toBe(true);
    expect(old.levels.level7).toMatchObject({ stars: [true, true, false, false], bestTimeSec: 170 });
    expect(old.levels.level5.attempts).toBe(2);
    expect(nextDispatchIndex(old)).toBe(0);
  });

  it('retains an old debug unlock and keeps an unplayed preference-only save on the new route', () => {
    expect(LEVEL_IDS.every((_, i) => isLevelUnlocked(validateSave({ version: 1, allUnlocked: true }), i))).toBe(true);
    const old = validateSave({ version: 1, muted: true, lang: 'fr' });
    expect(old).toMatchObject({ legacyDispatch: false, muted: true, lang: 'fr' });
    expect(isLevelUnlocked(old, 2)).toBe(false);
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
