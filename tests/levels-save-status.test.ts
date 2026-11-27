// v0.2 damaged save (user, 2026-11-27: "if we can have a damaged save we probably need a delete save button with
// confirmation"): the loader reports what it found, so the title can say the file was damaged and offer a reset.
// Every generated damaged shape, under every key it can sit in (production and preprod), yields a non-'ok' status;
// a save that loads as stored, a migration with nothing broken in the way and an empty store are 'ok'. `loadSave`
// returns exactly the save `loadSaveWithStatus` does.
import { describe, expect, it } from 'vitest';
import { resetSave } from '../src/core/reset';
import { preprodStorage } from '../src/core/storage';
import { LEGACY_SAVE_KEY, LEVEL_IDS, SAVE_KEY, V2_SAVE_KEY, defaultSave, isStoredSave, loadSave, loadSaveWithStatus, validateSave, writeSave, type KeyValueStore } from '../src/levels/save';
import { LEVELS } from '../src/levels/levels';
import { damageCases, damagedOlderShapes, damagedProgressShapes, memStore, nestedDamageShapes, notSaveShapes, okCases, ownKey, storeFor } from './levels-save-shapes';

const cases = damageCases();
/** Thousands of generated cases per test: under a parallel full run the 5 s default is too short (Neon 4, P2). */
const SLOW = 60_000;

describe('the loader reports a damaged save', () => {
  it('generates damaged shapes for every place a save can sit', () => {
    expect(notSaveShapes().length).toBeGreaterThan(400);
    expect(damagedProgressShapes().length).toBeGreaterThan(60);
    expect(cases.length).toBeGreaterThan(3600);
  });

  it('every damaged shape loads with a non-ok status, the same save loadSave returns', () => {
    const misses: string[] = [];
    for (const c of cases) {
      const { status, save } = loadSaveWithStatus(storeFor(c).storage);
      if (!c.want.includes(status)) misses.push(`${c.name} -> ${status}`);
      expect(loadSave(storeFor(c).storage), c.name).toEqual(save);
    }
    expect(misses).toEqual([]);
  }, SLOW);

  it('a reset after damage reloads clean and ok, never touching the older keys', () => {
    for (const c of cases) {
      const { disk, storage } = storeFor(c);
      const { save } = loadSaveWithStatus(storage);
      const own = ownKey(c.preprod);
      const others = Object.fromEntries(Object.entries(disk.data).filter(([k]) => k !== own));
      writeSave(storage, resetSave(save));
      const again = loadSaveWithStatus(c.preprod ? preprodStorage(disk)! : disk);
      expect(again.status, c.name).toBe('ok');
      expect(again.save, c.name).toEqual({ ...defaultSave(), muted: save.muted, lang: save.lang });
      expect(Object.fromEntries(Object.entries(disk.data).filter(([k]) => k !== own)), c.name).toEqual(others);
    }
  }, SLOW);

  it('clean stores load ok, and stay ok on the next load', () => {
    for (const c of okCases()) {
      const { disk } = storeFor(c);
      expect(loadSaveWithStatus(c.preprod ? preprodStorage(disk)! : disk).status, c.name).toBe('ok');
      expect(loadSaveWithStatus(c.preprod ? preprodStorage(disk)! : disk).status, c.name).toBe('ok');
    }
    expect(loadSaveWithStatus(null)).toEqual({ save: defaultSave(), status: 'ok' });
  });

  it('a repaired or recovered save is stored back, so the next load is ok without a reset', () => {
    for (const c of cases) {
      const { disk, storage } = storeFor(c);
      const first = loadSaveWithStatus(storage);
      if (first.status === 'unreadable') continue;
      const again = loadSaveWithStatus(c.preprod ? preprodStorage(disk)! : disk);
      expect(again, c.name).toEqual({ save: first.save, status: 'ok' });
    }
  }, SLOW);

  it('a store that throws on a stored value reports it unreadable', () => {
    const disk = memStore({ [SAVE_KEY]: '{}' });
    const throwing: KeyValueStore = { ...disk, getItem: (k) => { if (k === V2_SAVE_KEY) throw new Error('quota'); return disk.getItem(k); } };
    expect(loadSaveWithStatus(throwing).status).toBe('unreadable');
    const blocked: KeyValueStore = { ...disk, getItem: () => { throw new Error('blocked'); } };
    expect(loadSaveWithStatus(blocked)).toEqual({ save: defaultSave(), status: 'ok' });
  });
});

// v0.2 council round 4 (Sol P1): damage inside a field used to load 'ok', repaired in memory only, with the bad bytes
// left on disk and no notice. The shapes are built by hand (never filtered through isStoredSave).
describe('damage inside a recognised field is reported and stored back clean (round 4, Sol P1)', () => {
  const nested = nestedDamageShapes();

  it('covers every level in LEVELS and LEVEL_IDS, with and without other progress', () => {
    for (const id of new Set([...LEVELS.map(l => l.id), ...LEVEL_IDS])) {
      expect(nested.filter(n => n.name.startsWith(`levels.${id} `) || n.name.startsWith(`levels.${id}.`)).length, id).toBeGreaterThanOrEqual(60);
    }
    expect(nested.some(n => !n.progress)).toBe(true);
    // independent of the loader's own checks: some are sound saves on the outside, every one is kept
    expect(nested.filter(n => isStoredSave(n.value)).length).toBeGreaterThan(nested.length / 2);
  });

  it('every shape loads repaired, keeps the sound records, stores no damage back, then loads ok', () => {
    const misses: string[] = [];
    for (const n of nested) {
      const disk = memStore({ [SAVE_KEY]: n.value });
      const first = loadSaveWithStatus(disk);
      if (first.status !== 'repaired') misses.push(`${n.name} -> ${first.status}`);
      if (n.progress && !LEVEL_IDS.some(id => first.save.levels[id].delivered)) misses.push(`${n.name}: the sound records were lost`);
      const damage: string[] = [];
      validateSave(JSON.parse(disk.data[SAVE_KEY]!), LEVEL_IDS, damage);
      if (damage.length) misses.push(`${n.name}: stored back with ${damage.join(', ')}`);
      const again = loadSaveWithStatus(disk);
      if (again.status !== 'ok') misses.push(`${n.name}: reload ${again.status}`);
      expect(again.save, n.name).toEqual(first.save);
    }
    expect(misses).toEqual([]);
  }, SLOW);

  it('a save a build writes is never reported damaged', () => {
    const played = defaultSave();
    played.levels.level3 = { stars: [true, false, true, false], delivered: true, bestTimeSec: 99, attempts: 4, mapCollectible: undefined };
    for (const save of [defaultSave(), played, { ...defaultSave(), upgrades: ['hush_drive' as const] }]) {
      const damage: string[] = [];
      validateSave(JSON.parse(JSON.stringify(save)), LEVEL_IDS, damage);
      expect(damage).toEqual([]);
    }
  });
});

// v0.2 council round 4 (Opus O2): only the current key used to be salvaged, so a v0.1 save under the older v2 key with
// one wrong-type field loaded 'unreadable' with everything blank, and the first new save hid it for good.
describe('a damaged older save with level progress is salvaged (round 4, Opus O2)', () => {
  it.each(damagedOlderShapes())('%s under the v2 key alone: recovered, the older key untouched', (bad) => {
    for (const key of [V2_SAVE_KEY, LEGACY_SAVE_KEY]) {
      const disk = memStore({ [key]: bad });
      const { save, status } = loadSaveWithStatus(disk);
      expect(status).toBe('recovered');
      expect(save.levels.level3.stars).toEqual([true, true, true, false]);
      expect(save.levels.level2.delivered).toBe(true);
      // the mistyped field defaults; everything else survives
      expect(save.glorbs).toBe(typeof (JSON.parse(bad) as { glorbs: unknown }).glorbs === 'number' ? 420 : 0);
      expect(disk.data[key]).toBe(bad);
      expect(JSON.parse(disk.data[SAVE_KEY]!)).toEqual(save);
      expect(loadSaveWithStatus(disk)).toEqual({ save, status: 'ok' });
    }
    // preprod finds it under the production keys the same way, writing only its own key
    for (const key of [SAVE_KEY, V2_SAVE_KEY]) {
      const disk = memStore({ [key]: bad });
      const { save, status } = loadSaveWithStatus(preprodStorage(disk));
      expect(status).toBe('recovered');
      expect(save.levels.level3.delivered).toBe(true);
      expect(disk.data[key]).toBe(bad);
    }
  });

  it('a sound older save still beats a damaged newer one', () => {
    const bad = damagedOlderShapes()[0]!;
    const v1 = JSON.stringify({ version: 1, glorbs: 321, levels: { level1: { stars: [true, false, true], delivered: true } } });
    expect(loadSaveWithStatus(memStore({ [V2_SAVE_KEY]: bad, [LEGACY_SAVE_KEY]: v1 })).save.glorbs).toBe(321);
  });
});
