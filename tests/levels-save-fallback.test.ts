// v0.2 save migration (council item 7, 2026-11-27): the loader recognises a real save before it imports or stores
// anything, passes over unreadable or empty values to the next older key, and still honours the default record a
// reset stores under the current key. Older keys are never rewritten; preprod keeps its own key.
// Round 2 (Sol P2): a parseable record with a mistyped save field ({"version":2,"glorbs":null,"levels":[]},
// {"muted":"broken"}) used to mask an intact v1 save and import 0 Glorbs; every recognised field is now type-checked.
// Round 3 (Sol P2): well-typed but empty records ({"version":2}, {"levels":{"level1":null}}) still masked it; a
// record now loads only if it carries at least one usable progress or setting value.
import { describe, expect, it } from 'vitest';
import { PREPROD_SAVE_KEY, preprodStorage } from '../src/core/storage';
import { LEGACY_SAVE_KEY, LEVEL_IDS, SAVE_FIELD_TYPES, SAVE_KEY, V2_SAVE_KEY, clearSave, defaultSave, loadSave, type KeyValueStore } from '../src/levels/save';

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

describe('a well-typed record with nothing usable in it is not a save (round 3, Sol P2)', () => {
  const v1Survives = (bad: string) => {
    const store = memStore({ [V2_SAVE_KEY]: bad, [LEGACY_SAVE_KEY]: V1 });
    const save = loadSave(store);
    expect(save.glorbs, bad).toBe(321);
    expect(save.levels.level1.delivered, bad).toBe(true);
    expect(save.levels.level2.delivered, bad).toBe(true);
    expect(store.data[V2_SAVE_KEY], bad).toBe(bad);
    expect(store.data[LEGACY_SAVE_KEY], bad).toBe(V1);
    expect(JSON.parse(store.data[SAVE_KEY]!).glorbs, bad).toBe(321);
  };

  it.each([
    '{"version":2}',
    '{"levels":{"level1":null}}',
    '{"levels":{"level1":{"stars":"broken"}},"upgrades":[null],"lang":"broken"}',
  ])('Sol\'s shape %s under v2 falls through to the intact v1', v1Survives);

  // Empty or null-only values that still pass the type checks, generated per field and per level-record field.
  const emptyLevelFields: Record<string, unknown[]> = {
    stars: [null, 'broken', [], [null], ['x'], {}],
    delivered: [null, 'yes', 1, []],
    attempts: [null, '3', -1, [], {}],
    bestTimeSec: [null, '50', 0, -5, []],
    bestTime: [null, '50', 0],
    mapCollectible: [null, 'not-a-pickup', 3, {}],
  };
  const emptyRecords: unknown[] = [null, 0, 'x', [], {}, ...Object.entries(emptyLevelFields).flatMap(([f, vs]) => vs.map(v => ({ [f]: v })))];
  emptyRecords.push(Object.fromEntries(Object.entries(emptyLevelFields).map(([f, vs]) => [f, vs[0]])));
  const emptyLevels: unknown[] = [{}, ...[...LEVEL_IDS, 'level99'].flatMap(id => emptyRecords.map(r => ({ [id]: r })))];
  const emptyValues: Record<string, unknown[]> = {
    version: [1, 2, 3, 0],
    levels: emptyLevels,
    upgrades: [[], [null], ['warp_drive'], [1, {}]],
    lang: ['', 'broken', 'EN'],
    trophies: [{}, { 'Not an item': { count: 1, room: 'bedroom' } }, { x: null }],
    specimens: [{}, { 'Not a specimen': { count: 1, first: 0, probed: false } }, { x: null }],
  };
  const shapes: string[] = [];
  for (const [field, values] of Object.entries(emptyValues)) {
    for (const value of values) {
      shapes.push(JSON.stringify({ [field]: value }));
      if (field !== 'version') shapes.push(JSON.stringify({ version: 2, [field]: value }));
    }
  }
  // every pair of fields, with their first and last empty value
  const fields = Object.keys(emptyValues);
  for (const a of fields) for (const b of fields) if (a < b) {
    for (const pick of [0, -1]) shapes.push(JSON.stringify({ [a]: emptyValues[a]!.at(pick), [b]: emptyValues[b]!.at(pick) }));
  }
  shapes.push(JSON.stringify(Object.fromEntries(fields.map(f => [f, emptyValues[f]!.at(-1)]))));

  it('generates empty shapes that all pass the type checks', () => {
    expect(shapes.length).toBeGreaterThan(400);
    for (const shape of shapes) {
      const raw = JSON.parse(shape) as Record<string, unknown>;
      for (const [field, value] of Object.entries(raw)) expect(SAVE_FIELD_TYPES[field]!(value), `${field} in ${shape}`).toBe(true);
    }
  });

  it.each(shapes)('%s under v2 falls through to v1', v1Survives);

  it.each(shapes.map(s => JSON.stringify({ ...JSON.parse(s), version: 3 })))('%s under the current key falls through to v2', (bad) => {
    const store = memStore({ [SAVE_KEY]: bad, [V2_SAVE_KEY]: V2 });
    const save = loadSave(store);
    expect(save.glorbs).toBe(140);
    expect(save.levels.level3.delivered).toBe(true);
  });

  it('still loads every sparse save that carries one usable value, and the reset record', () => {
    const sparse: [string, (s: ReturnType<typeof loadSave>) => unknown, unknown][] = [
      ['{"glorbs":0}', s => s.glorbs, 0],
      ['{"glorbs":5}', s => s.glorbs, 5],
      ['{"reports":3}', s => s.reports, 3],
      ['{"muted":false}', s => s.muted, false],
      ['{"muted":true}', s => s.muted, true],
      ['{"lang":"fr"}', s => s.lang, 'fr'],
      ['{"upgrades":["hush_drive"]}', s => s.upgrades, ['hush_drive']],
      ['{"upgrades":["afterburner"]}', s => s.glorbs, 60],
      ['{"allUnlocked":true}', s => s.allUnlocked, true],
      ['{"fieldCheckSeen":true}', s => s.fieldCheckSeen, true],
      ['{"bridgeAccess":true}', s => s.bridgeAccess, true],
      ['{"dispatch2199Finale":true}', s => s.dispatch2199Finale, true],
      ['{"version":2,"levels":{"level1":{"delivered":true}}}', s => s.levels.level1.delivered, true],
      ['{"levels":{"level4":{"stars":2}}}', s => s.levels.level4.stars, [true, true, false, false]],
      ['{"levels":{"level2":{"attempts":4}}}', s => s.levels.level2.attempts, 4],
      ['{"levels":{"level1":{"bestTimeSec":41}}}', s => s.levels.level1.bestTimeSec, 41],
      ['{"levels":{"level1":null,"level2":{"stars":[true]}}}', s => s.levels.level2.delivered, true],
    ];
    for (const [shape, read, want] of sparse) {
      expect(read(loadSave(memStore({ [V2_SAVE_KEY]: shape, [LEGACY_SAVE_KEY]: V1 }))), shape).toEqual(want);
      expect(read(loadSave(memStore({ [SAVE_KEY]: shape, [V2_SAVE_KEY]: V2 }))), shape).toEqual(want);
    }
    const store = memStore({ [V2_SAVE_KEY]: V2, [LEGACY_SAVE_KEY]: V1 });
    clearSave(store);
    expect(loadSave(store)).toEqual(defaultSave());
  });
});

describe('a damaged current save keeps its level progress (round 3, Fable F4)', () => {
  // this build's own save with real progress; then one top-level field gets every wrong JSON type
  const progress = () => {
    const v3 = defaultSave();
    v3.glorbs = 500;
    v3.reports = 40;
    v3.levels.level10 = { stars: [true, true, false, false], delivered: true, bestTimeSec: 140, attempts: 3 };
    return v3;
  };
  const samples: unknown[] = [null, 'x', '', 0, 1.5, -1, true, false, [], [1], {}, { a: 1 }];
  const fields = Object.keys(SAVE_FIELD_TYPES).filter(f => f !== 'levels');
  const cases = fields.flatMap(field => samples.filter(v => !SAVE_FIELD_TYPES[field]!(v)).map(value => [field, value] as const));

  it('covers every top-level field but levels', () => {
    for (const field of fields) expect(cases.some(([f]) => f === field), field).toBe(true);
    expect(cases.length).toBeGreaterThan(60);
  });

  it.each(cases.map(([f, v]) => [f, JSON.stringify(v)] as const))('%s = %s under the current key: the level progress loads, the field defaults', (field, value) => {
    const damaged = JSON.stringify({ ...progress(), [field]: JSON.parse(value) });
    const store = memStore({ [SAVE_KEY]: damaged, [V2_SAVE_KEY]: V2, [LEGACY_SAVE_KEY]: V1 });
    const save = loadSave(store);
    expect(save.levels.level10.delivered).toBe(true);
    expect(save.levels.level10.stars).toEqual([true, true, false, false]);
    expect(save.levels.level3.delivered).toBe(false);
    if (field !== 'glorbs' && field !== 'upgrades') expect(save.glorbs).toBe(500);
    if (field !== 'reports') expect(save.reports).toBe(40);
    // stored back repaired; the older keys stay as they were
    const stored = JSON.parse(store.data[SAVE_KEY]!) as Record<string, unknown>;
    for (const [f, valid] of Object.entries(SAVE_FIELD_TYPES)) if (Object.hasOwn(stored, f)) expect(valid(stored[f]), f).toBe(true);
    expect(store.data[V2_SAVE_KEY]).toBe(V2);
    expect(store.data[LEGACY_SAVE_KEY]).toBe(V1);
    expect(loadSave(store)).toEqual(save);
    // with no older key at all, the same save loads
    expect(loadSave(memStore({ [SAVE_KEY]: damaged })).levels.level10.delivered).toBe(true);
  });

  it('a damaged current save with no usable level record still falls through', () => {
    for (const levels of [[], null, {}, { level1: null }, { level10: { stars: 'broken' } }]) {
      const bad = JSON.stringify({ version: 3, glorbs: null, reports: 40, levels });
      expect(loadSave(memStore({ [SAVE_KEY]: bad, [V2_SAVE_KEY]: V2 })).glorbs, JSON.stringify(levels)).toBe(140);
    }
  });

  it('a sound v1 still beats a damaged v2: an older key is salvaged only when no key holds a save', () => {
    const bad = JSON.stringify({ version: 2, glorbs: null, levels: { level3: cleared } });
    expect(loadSave(memStore({ [V2_SAVE_KEY]: bad, [LEGACY_SAVE_KEY]: V1 })).glorbs).toBe(321);
  });

  // round 4 (Opus O2): a v0.1 save under the v2 key with one wrong-type field used to load blank, and the first new
  // save hid it for good
  it.each([['glorbs', null], ['upgrades', {}], ['muted', 'x'], ['reports', []]] as const)('%s = %j under the v2 key alone: its level progress is salvaged', (field, value) => {
    const bad = JSON.stringify({ version: 2, glorbs: 420, reports: 6, levels: { level1: cleared, level3: cleared }, [field]: value });
    const store = memStore({ [V2_SAVE_KEY]: bad });
    const save = loadSave(store);
    expect(save.levels.level3.delivered).toBe(true);
    expect(save.glorbs).toBe(field === 'glorbs' ? 0 : 420);
    expect(store.data[V2_SAVE_KEY]).toBe(bad);
    expect(JSON.parse(store.data[SAVE_KEY]!)).toEqual(save);
  });
});

describe('a damaged current save with no older save to fall back to is repaired (round 3, Opus O6)', () => {
  const samples: unknown[] = [null, 'x', 0, [], {}];
  const fields = Object.keys(SAVE_FIELD_TYPES).filter(f => f !== 'levels' && f !== 'glorbs');
  const cases = fields.flatMap(field => samples.filter(v => !SAVE_FIELD_TYPES[field]!(v)).map(value => [field, JSON.stringify(value)] as const));

  it.each(cases)('%s = %s beside 500 Glorbs, no level records, no older key: repaired', (field, value) => {
    const damaged = JSON.stringify({ version: 3, glorbs: 500, [field]: JSON.parse(value) });
    const store = memStore({ [SAVE_KEY]: damaged });
    expect(loadSave(store).glorbs).toBe(500);
    const stored = JSON.parse(store.data[SAVE_KEY]!) as Record<string, unknown>;
    for (const [f, valid] of Object.entries(SAVE_FIELD_TYPES)) if (Object.hasOwn(stored, f)) expect(valid(stored[f]), f).toBe(true);
    // an older save exists: the damaged record without level progress falls through to it
    expect(loadSave(memStore({ [SAVE_KEY]: damaged, [V2_SAVE_KEY]: V2 })).glorbs).toBe(140);
  });

  it('a damaged record with nothing usable is still not a save', () => {
    for (const bad of ['{"version":3,"glorbs":null}', '{"version":"3","lang":"broken"}', '{"muted":"x","levels":{"level1":null}}']) {
      const store = memStore({ [SAVE_KEY]: bad });
      expect(loadSave(store), bad).toEqual(defaultSave());
      expect(store.data[SAVE_KEY], bad).toBe(bad);
    }
  });
});
