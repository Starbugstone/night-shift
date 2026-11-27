// Every level has a save slot that keeps its progress (docs/NEW-LEVEL-CHECKLIST.md, "save shape"): a new level in
// LEVELS must have its id in LEVEL_IDS (src/levels/save.ts), and its stars, delivery, best time and attempts must
// survive a write and a reload like every other level's.
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels/levels';
import { LEVEL_IDS, defaultSave, loadSave, writeSave, type KeyValueStore } from '../src/levels/save';

function memStore(): KeyValueStore {
  const data: Record<string, string> = {};
  return { getItem: (k) => (k in data ? data[k]! : null), setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
}

describe('every level in LEVELS has a save slot', () => {
  it('LEVEL_IDS names every level, and nothing else', () => {
    expect([...LEVEL_IDS].sort()).toEqual(LEVELS.map((l) => l.id as string).sort());
  });

  it('a fresh save has a slot for every level', () => {
    const save = defaultSave();
    for (const l of LEVELS) expect(save.levels[l.id], l.id).toEqual({ stars: [false, false, false, false], delivered: false, bestTimeSec: null, attempts: 0 });
  });

  it('progress on every level survives a write and a reload', () => {
    const store = memStore();
    const save = defaultSave();
    LEVELS.forEach((l, i) => {
      save.levels[l.id] = { stars: [true, i % 2 === 0, i % 3 === 0, i % 4 === 0], delivered: true, bestTimeSec: 30 + i, attempts: i + 1 };
    });
    expect(writeSave(store, save)).toBe(true);
    const back = loadSave(store);
    for (const l of LEVELS) expect(back.levels[l.id], l.id).toEqual(save.levels[l.id]);
  });
});
