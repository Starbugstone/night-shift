// v0.2 damaged save (user, 2026-11-27: "if we can have a damaged save we probably need a delete save button with
// confirmation"): the loader reports what it found, so the title can say the file was damaged and offer a reset.
// Every generated damaged shape, under every key it can sit in (production and preprod), yields a non-'ok' status;
// a save that loads as stored, a migration with nothing broken in the way and an empty store are 'ok'. `loadSave`
// returns exactly the save `loadSaveWithStatus` does.
import { describe, expect, it } from 'vitest';
import { resetSave } from '../src/core/reset';
import { preprodStorage } from '../src/core/storage';
import { SAVE_KEY, V2_SAVE_KEY, defaultSave, loadSave, loadSaveWithStatus, writeSave, type KeyValueStore } from '../src/levels/save';
import { damageCases, damagedProgressShapes, memStore, notSaveShapes, okCases, ownKey, storeFor } from './levels-save-shapes';

const cases = damageCases();

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
  });

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
  });

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
  });

  it('a store that throws on a stored value reports it unreadable', () => {
    const disk = memStore({ [SAVE_KEY]: '{}' });
    const throwing: KeyValueStore = { ...disk, getItem: (k) => { if (k === V2_SAVE_KEY) throw new Error('quota'); return disk.getItem(k); } };
    expect(loadSaveWithStatus(throwing).status).toBe('unreadable');
    const blocked: KeyValueStore = { ...disk, getItem: () => { throw new Error('blocked'); } };
    expect(loadSaveWithStatus(blocked)).toEqual({ save: defaultSave(), status: 'ok' });
  });
});
