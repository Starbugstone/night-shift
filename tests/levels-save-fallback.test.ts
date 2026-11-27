// v0.2 save migration (council item 7, 2026-11-27): the loader recognises a real save before it imports or stores
// anything, passes over unreadable or empty values to the next older key, and still honours the default record a
// reset stores under the current key. Older keys are never rewritten; preprod keeps its own key.
// Round 2 (Sol P2): a parseable record with a mistyped save field ({"version":2,"glorbs":null,"levels":[]},
// {"muted":"broken"}) used to mask an intact v1 save and import 0 Glorbs; every recognised field is now type-checked.
import { describe, expect, it } from 'vitest';
import { PREPROD_SAVE_KEY, preprodStorage } from '../src/core/storage';
import { LEGACY_SAVE_KEY, SAVE_FIELD_TYPES, SAVE_KEY, V2_SAVE_KEY, clearSave, defaultSave, loadSave, type KeyValueStore } from '../src/levels/save';

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

  it('preprod falls through an unreadable production save to production\'s intact v2', () => {
    for (const bad of UNREADABLE) {
      const disk = memStore({ [SAVE_KEY]: bad, [V2_SAVE_KEY]: V2 });
      const save = loadSave(preprodStorage(disk));
      expect(save.glorbs, bad).toBe(140);
      expect(save.levels.level3.delivered, bad).toBe(true);
      // production's keys stay untouched
      expect(disk.data[SAVE_KEY]).toBe(bad);
      expect(disk.data[V2_SAVE_KEY]).toBe(V2);
    }
  });
});

describe('a parseable record with a mistyped save field is not a save (round 2, Sol P2)', () => {
  it.each(['{"version":2,"glorbs":null,"levels":[]}', '{"muted":"broken"}'])('%s under v2 falls through to the intact v1', (bad) => {
    const store = memStore({ [V2_SAVE_KEY]: bad, [LEGACY_SAVE_KEY]: V1 });
    const save = loadSave(store);
    expect(save.glorbs).toBe(321);
    expect(save.levels.level2.delivered).toBe(true);
    expect(store.data[V2_SAVE_KEY]).toBe(bad);
  });

  // every recognised field, with every JSON value of the wrong type, alone and beside valid fields
  const wrong: Record<string, unknown[]> = {};
  const samples: unknown[] = [null, 'x', '', 0, 1.5, -1, true, false, [], [1], {}, { a: 1 }];
  for (const [field, valid] of Object.entries(SAVE_FIELD_TYPES)) wrong[field] = samples.filter(v => !valid(v));
  const cases = Object.entries(wrong).flatMap(([field, values]) => values.flatMap(value => [
    { field, record: { version: 2, [field]: value } },
    { field, record: { version: 2, glorbs: 9, reports: 1, [field]: value } },
  ]));

  it('generates a wrong value for every recognised field', () => {
    for (const field of Object.keys(SAVE_FIELD_TYPES)) expect(wrong[field]!.length, field).toBeGreaterThan(0);
    expect(cases.length).toBeGreaterThan(60);
  });

  it.each(cases.map(c => [c.field, JSON.stringify(c.record)] as const))('%s mistyped: %s under v2 falls through to v1', (_field, bad) => {
    expect(loadSave(memStore({ [V2_SAVE_KEY]: bad, [LEGACY_SAVE_KEY]: V1 })).glorbs).toBe(321);
  });

  it.each(cases.map(c => [c.field, JSON.stringify(c.field === 'version' ? c.record : { ...c.record, version: 3 })] as const))('%s mistyped: %s under the current key falls through to v2', (_field, bad) => {
    const store = memStore({ [SAVE_KEY]: bad, [V2_SAVE_KEY]: V2 });
    expect(loadSave(store).glorbs).toBe(140);
  });

  it('keeps valid sparse saves and the reset record', () => {
    expect(loadSave(memStore({ [SAVE_KEY]: '{"glorbs":5}', [V2_SAVE_KEY]: V2 })).glorbs).toBe(5);
    expect(loadSave(memStore({ [V2_SAVE_KEY]: '{"muted":true}', [LEGACY_SAVE_KEY]: V1 })).muted).toBe(true);
    expect(loadSave(memStore({ [SAVE_KEY]: JSON.stringify(defaultSave()), [V2_SAVE_KEY]: V2 }))).toEqual(defaultSave());
    // a full save as the game writes it passes every type check
    const full = { ...defaultSave(), glorbs: 12, dispatch2199Finale: true as const, legacyDispatch: true, lang: 'fr' as const };
    expect(loadSave(memStore({ [SAVE_KEY]: JSON.stringify(full) }))).toEqual(full);
  });
});
