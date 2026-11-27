// v0.2 damaged save (2026-11-27): stored values that are not a save, generated from the save's own field tables the
// way tests/levels-save-fallback.test.ts builds them, plus this build's own save with one field damaged.
import { resetSave } from '../src/core/reset';
import { PREPROD_SAVE_KEY, preprodStorage } from '../src/core/storage';
import { LEGACY_SAVE_KEY, LEVEL_IDS, SAVE_FIELD_TYPES, SAVE_KEY, V2_SAVE_KEY, defaultSave, isStoredSave, type KeyValueStore, type SaveStatus } from '../src/levels/save';

export function memStore(init: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...init };
  return { data, getItem: (k) => (k in data ? data[k]! : null), setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
}

const cleared = { stars: [true, false, true], delivered: true, bestTimeSec: 50, attempts: 1 };
export const V1 = JSON.stringify({ version: 1, glorbs: 321, levels: { level1: cleared, level2: cleared }, reports: 2 });
export const V2 = JSON.stringify({ version: 2, glorbs: 140, reports: 5, levels: { level1: cleared, level2: cleared, level3: cleared } });

const SAMPLES: unknown[] = [null, 'x', '', 0, 1.5, -1, true, false, [], [1], {}, { a: 1 }];

/** Unreadable, empty, mistyped and well-typed-but-empty values: none of them is a save. */
export function notSaveShapes(): string[] {
  const out = new Set<string>(['{not json', 'null', '[1,2]', '{}', '"save"', '42', '', ' ', '{"version":3']);
  // every recognised field with every wrong JSON type, alone and beside valid fields
  for (const [field, valid] of Object.entries(SAVE_FIELD_TYPES)) {
    for (const value of SAMPLES.filter(v => !valid(v))) {
      out.add(JSON.stringify({ version: 3, [field]: value }));
      out.add(JSON.stringify({ version: 2, glorbs: 9, reports: 1, [field]: value }));
    }
  }
  // well-typed records with no usable value, per field and per level-record field, for every level id
  const emptyLevelFields: Record<string, unknown[]> = {
    stars: [null, 'broken', [], [null], ['x'], {}],
    delivered: [null, 'yes', 1, []],
    attempts: [null, '3', -1, [], {}],
    bestTimeSec: [null, '50', 0, -5, []],
    mapCollectible: [null, 'not-a-pickup', 3, {}],
  };
  const emptyRecords: unknown[] = [null, 0, 'x', [], {}, ...Object.entries(emptyLevelFields).flatMap(([f, vs]) => vs.map(v => ({ [f]: v })))];
  const emptyValues: Record<string, unknown[]> = {
    version: [1, 2, 3, 0],
    levels: [{}, ...[...LEVEL_IDS, 'level99'].flatMap(id => emptyRecords.map(r => ({ [id]: r })))],
    upgrades: [[], [null], ['warp_drive'], [1, {}]],
    lang: ['', 'broken', 'EN'],
    trophies: [{}, { 'Not an item': { count: 1, room: 'bedroom' } }, { x: null }],
    specimens: [{}, { 'Not a specimen': { count: 1, first: 0, probed: false } }, { x: null }],
  };
  for (const [field, values] of Object.entries(emptyValues)) for (const value of values) out.add(JSON.stringify({ [field]: value }));
  const fields = Object.keys(emptyValues);
  for (const a of fields) for (const b of fields) if (a < b) out.add(JSON.stringify({ [a]: emptyValues[a]!.at(-1), [b]: emptyValues[b]!.at(-1) }));
  return [...out].filter(s => !isStoredSave(s));
}

/** This build's save with real progress and one top-level field of the wrong type: the loader repairs it. */
export function damagedProgressShapes(): string[] {
  const v3 = defaultSave();
  v3.glorbs = 500;
  v3.reports = 40;
  v3.levels.level10 = { stars: [true, true, false, false], delivered: true, bestTimeSec: 140, attempts: 3 };
  const out: string[] = [];
  for (const [field, valid] of Object.entries(SAVE_FIELD_TYPES)) {
    if (field === 'levels') continue;
    for (const value of SAMPLES.filter(v => !valid(v))) out.push(JSON.stringify({ ...v3, [field]: value }));
  }
  return out;
}

const PREPROD_V2_KEY = 'night-shift-save-preprod';
const PROD = JSON.stringify({ ...defaultSave(), glorbs: 77 });

export interface DamageCase {
  name: string;
  init: Record<string, string>;
  preprod: boolean;
  /** The statuses this case may load with (which one depends on whether the shape can be repaired). */
  want: readonly SaveStatus[];
}

/** Every damaged shape in every place a damaged value can sit, with the statuses each may load with. */
export function damageCases(): DamageCase[] {
  const out: DamageCase[] = [];
  for (const bad of notSaveShapes()) {
    const add = (where: string, init: Record<string, string>, preprod: boolean, want: readonly SaveStatus[]) =>
      out.push({ name: `${where}: ${JSON.stringify(bad)}`, init, preprod, want });
    add('current key alone', { [SAVE_KEY]: bad }, false, ['repaired', 'unreadable']);
    add('current key over v2 and v1', { [SAVE_KEY]: bad, [V2_SAVE_KEY]: V2, [LEGACY_SAVE_KEY]: V1 }, false, ['repaired', 'recovered']);
    add('v2 over v1', { [V2_SAVE_KEY]: bad, [LEGACY_SAVE_KEY]: V1 }, false, ['recovered']);
    add('v2 alone', { [V2_SAVE_KEY]: bad }, false, ['unreadable']);
    add('v1 alone', { [LEGACY_SAVE_KEY]: bad }, false, ['unreadable']);
    add('preprod key over production', { [PREPROD_SAVE_KEY]: bad, [SAVE_KEY]: PROD }, true, ['repaired', 'recovered']);
    add('preprod v2 key over production', { [PREPROD_V2_KEY]: bad, [SAVE_KEY]: PROD }, true, ['recovered']);
    add('production key under preprod, over v2', { [SAVE_KEY]: bad, [V2_SAVE_KEY]: V2 }, true, ['recovered']);
    add('production key under preprod, alone', { [SAVE_KEY]: bad }, true, ['unreadable']);
  }
  for (const bad of damagedProgressShapes()) {
    out.push({ name: `damaged progress: ${bad}`, init: { [SAVE_KEY]: bad, [V2_SAVE_KEY]: V2 }, preprod: false, want: ['repaired'] });
    out.push({ name: `damaged progress, preprod: ${bad}`, init: { [PREPROD_SAVE_KEY]: bad, [SAVE_KEY]: PROD }, preprod: true, want: ['repaired'] });
  }
  return out;
}

/** Stores that load cleanly: nothing stored, sound saves, migrations and a reset record over older saves. */
export function okCases(): { name: string; init: Record<string, string>; preprod: boolean }[] {
  const full = JSON.stringify({ ...defaultSave(), glorbs: 12, lang: 'fr', muted: true });
  const reset = JSON.stringify(resetSave({ ...defaultSave(), muted: true, lang: 'fr' }));
  const cases: { name: string; init: Record<string, string>; preprod: boolean }[] = [
    { name: 'nothing stored', init: {}, preprod: false },
    { name: 'a full current save', init: { [SAVE_KEY]: full }, preprod: false },
    { name: 'a full current save over broken older keys', init: { [SAVE_KEY]: full, [V2_SAVE_KEY]: '{not json', [LEGACY_SAVE_KEY]: '{}' }, preprod: false },
    { name: 'the reset record over older saves', init: { [SAVE_KEY]: reset, [V2_SAVE_KEY]: V2, [LEGACY_SAVE_KEY]: V1 }, preprod: false },
    { name: 'v2 migrated', init: { [V2_SAVE_KEY]: V2 }, preprod: false },
    { name: 'v2 migrated over a broken v1', init: { [V2_SAVE_KEY]: V2, [LEGACY_SAVE_KEY]: 'null' }, preprod: false },
    { name: 'v1 migrated', init: { [LEGACY_SAVE_KEY]: V1 }, preprod: false },
    { name: 'preprod, nothing stored', init: {}, preprod: true },
    { name: 'preprod copies production', init: { [SAVE_KEY]: PROD }, preprod: true },
    { name: 'preprod copies production over a broken v2', init: { [SAVE_KEY]: PROD, [V2_SAVE_KEY]: '{}' }, preprod: true },
    { name: 'preprod reset record', init: { [PREPROD_SAVE_KEY]: reset, [SAVE_KEY]: PROD }, preprod: true },
  ];
  for (const sparse of ['{"glorbs":0}', '{"muted":true}', '{"lang":"fr"}', '{"levels":{"level2":{"attempts":4}}}']) {
    cases.push({ name: `sparse ${sparse}`, init: { [SAVE_KEY]: sparse, [V2_SAVE_KEY]: V2 }, preprod: false });
  }
  return cases;
}

export function storeFor(c: { init: Record<string, string>; preprod: boolean }): { disk: ReturnType<typeof memStore>; storage: KeyValueStore } {
  const disk = memStore(c.init);
  return { disk, storage: c.preprod ? preprodStorage(disk)! : disk };
}

/** The key this build writes, as seen on disk. */
export const ownKey = (preprod: boolean): string => (preprod ? PREPROD_SAVE_KEY : SAVE_KEY);

