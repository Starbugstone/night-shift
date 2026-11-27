// v0.2 save migration (council item 7, 2026-11-27): the loader recognises a real save before it imports or stores
// anything, passes over unreadable or empty values to the next older key, and still honours the default record a
// reset stores under the current key. Older keys are never rewritten; preprod keeps its own key.
import { describe, expect, it } from 'vitest';
import { PREPROD_SAVE_KEY, preprodStorage } from '../src/core/storage';
import { LEGACY_SAVE_KEY, SAVE_KEY, V2_SAVE_KEY, clearSave, defaultSave, loadSave, type KeyValueStore } from '../src/levels/save';

function memStore(init: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...init };
  return { data, getItem: (k) => (k in data ? data[k]! : null), setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
}

const cleared = { stars: [true, false, true], delivered: true, bestTimeSec: 50, attempts: 1 };
const V1 = JSON.stringify({ version: 1, glorbs: 321, levels: { level1: cleared, level2: cleared }, reports: 2 });
const V2 = JSON.stringify({ version: 2, glorbs: 140, reports: 5, levels: { level1: cleared, level2: cleared, level3: cleared } });
const UNREADABLE = ['{not json', 'null', '[1,2]', '{}', '"save"', '42'];

describe('save fallback across older keys', () => {
  it('imports an intact v1 save when the v2 key holds an empty record, and stores the import', () => {
    const store = memStore({ [V2_SAVE_KEY]: '{}', [LEGACY_SAVE_KEY]: V1 });
    const save = loadSave(store);
    expect(save.glorbs).toBe(321);
    expect(save.levels.level2.delivered).toBe(true);
    expect(JSON.parse(store.data[SAVE_KEY]!)).toEqual(save);
    expect(store.data[V2_SAVE_KEY]).toBe('{}');
    expect(store.data[LEGACY_SAVE_KEY]).toBe(V1);
    expect(loadSave(store)).toEqual(save);
  });

  it.each(UNREADABLE)('passes over %s under the current key to intact v2 progress', (bad) => {
    const store = memStore({ [SAVE_KEY]: bad, [V2_SAVE_KEY]: V2, [LEGACY_SAVE_KEY]: V1 });
    const save = loadSave(store);
    expect(save.levels.level3.delivered).toBe(true);
    expect(save.glorbs).toBe(140);
    expect(store.data[V2_SAVE_KEY]).toBe(V2);
    expect(store.data[LEGACY_SAVE_KEY]).toBe(V1);
  });

  it.each(UNREADABLE)('passes over %s under both newer keys to the v1 save', (bad) => {
    const save = loadSave(memStore({ [SAVE_KEY]: bad, [V2_SAVE_KEY]: bad, [LEGACY_SAVE_KEY]: V1 }));
    expect(save.glorbs).toBe(321);
  });

  it('starts fresh, writing nothing, when no key holds a save', () => {
    const init = { [SAVE_KEY]: '{not json', [V2_SAVE_KEY]: '{}', [LEGACY_SAVE_KEY]: 'null' };
    const store = memStore(init);
    expect(loadSave(store)).toEqual(defaultSave());
    expect(store.data).toEqual(init);
  });

  it('keeps a reset: the default record under the current key masks every older save', () => {
    const store = memStore({ [V2_SAVE_KEY]: V2, [LEGACY_SAVE_KEY]: V1 });
    expect(loadSave(store).glorbs).toBe(140);
    clearSave(store);
    expect(loadSave(store)).toEqual(defaultSave());
    expect(store.data[V2_SAVE_KEY]).toBe(V2);
    expect(store.data[LEGACY_SAVE_KEY]).toBe(V1);
  });

  it('on preprod, passes over a broken preprod save to the production save without writing it', () => {
    const prod = JSON.stringify({ ...defaultSave(), glorbs: 77 });
    const disk = memStore({ [PREPROD_SAVE_KEY]: '{not json', [SAVE_KEY]: prod });
    const save = loadSave(preprodStorage(disk));
    expect(save.glorbs).toBe(77);
    expect(disk.data[SAVE_KEY]).toBe(prod);
    expect(JSON.parse(disk.data[PREPROD_SAVE_KEY]!)).toEqual(save);
    // a preprod reset still wins over the production save on the next load
    clearSave(preprodStorage(disk));
    expect(loadSave(preprodStorage(disk))).toEqual(defaultSave());
    expect(disk.data[SAVE_KEY]).toBe(prod);
  });
});
