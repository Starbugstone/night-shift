// Save data: load, validate, migrate. DOM-free (storage is injected).
import type { MapCollectibleId, RoomId, UpgradeId } from '../contracts';
import { isRoomId } from './levels';
import { isLangPref, type LangPref } from '../i18n';
import { en } from '../i18n/en';

/** Older builds on the same origin keep writing their own keys. */
export const SAVE_KEY = 'night-shift-save-v3';
export const V2_SAVE_KEY = 'night-shift-save-v2';
export const LEGACY_SAVE_KEY = 'night-shift-save-v1';
export const SAVE_VERSION = 3;

export const LEVEL_IDS = ['level1', 'level2', 'birch_bakery', 'birch_neighbours', 'level3', 'level4', 'level5', 'level6', 'level7', 'level8', 'level9', 'level10', 'level11', 'level12'] as const;
export type LevelId = (typeof LEVEL_IDS)[number];

export const LEGACY_DISPATCH_IDS = ['level3', 'level4', 'level5', 'level6', 'level7'] as const;
const ORIGINAL_DEEP_IDS = [...LEGACY_DISPATCH_IDS, 'level8', 'level9'] as const;

export const UPGRADE_IDS: readonly UpgradeId[] = ['beam_dampener', 'hush_drive', 'snooze_ray'];

/**
 * Upgrades that were sold and then withdrawn, with what they cost. A save that owns one gets the
 * Glorbs back on load (the Afterburner's flick-to-dash fired on ordinary steering swipes).
 */
const RETIRED_UPGRADES: Readonly<Record<string, number>> = { afterburner: 60 };

/** Tutorials: [Delivered, Still asleep, Night owl]. Deep levels: [Delivered all 3, Ghost, Night owl]. */
/**
 * Delivered, Still asleep / Ghost, Night owl, and (v4) the town pickup star: the level's map
 * collectible taken on a successful run. L1 has no pickup, so its fourth star stays false and unshown.
 */
export type Stars = [boolean, boolean, boolean, boolean];
/** Index of the town pickup star. */
export const PICKUP_STAR = 3;

export interface LevelProgress<Pickup extends string = MapCollectibleId> {
  stars: Stars;
  delivered: boolean;
  /** Best combined flight + abduction time of a delivered run (deep: whole-shift time). */
  bestTimeSec: number | null;
  attempts: number;
  /** The map pickup has appeared on a filed report at least once. */
  mapCollectible?: Pickup;
}

export interface SaveData {
  version: typeof SAVE_VERSION;
  glorbs: number;
  levels: Record<LevelId, LevelProgress> & Partial<Record<string, LevelProgress<string>>>;
  upgrades: UpgradeId[];
  muted: boolean;
  /** Debug/cheat flag: every level playable. */
  allUnlocked: boolean;
  /** Preserve the old open access to L3–L7 once a player had started playing. */
  legacyDispatch: boolean;
  /** The player finished or skipped the Field Check offer. */
  dispatch2199Finale?: true;
  fieldCheckSeen: boolean;
  /** Access to the inserted bridge and Maple Court for returning players. */
  bridgeAccess: boolean;
  /** Reports filed so far; rotates Vrell's comments. */
  reports: number;
  /** Display language; `auto` follows the browser. Older saves have none: auto. */
  lang: LangPref;
  /** v4 trophy room: every souvenir taken home, by item id (its English name, a key of `tr().items`). */
  trophies: Record<string, TrophyEntry>;
  /** v4 specimens: every specimen delivered, by specimen id (`Human`, a key of `en.trophies.specimens.entries`). */
  specimens: Record<string, SpecimenEntry>;
}

/** One souvenir on the trophy shelf. */
export interface TrophyEntry {
  /** Times it was taken home (delivered with its specimen). */
  count: number;
  /** The route it was first taken from. */
  room: RoomId;
  /** Reports filed before it was first taken (`SaveData.reports` then): orders the shelf by find. */
  first: number;
}

/** v4 specimens: one delivered specimen in the Specimen Archive. */
export interface SpecimenEntry {
  /** Times this specimen was successfully delivered. */
  count: number;
  /** The route it was first taken from (omitted for outdoor troop pickups such as Flint & Reed). */
  room?: RoomId;
  /** Reports filed before it was first delivered (`SaveData.reports` then). */
  first: number;
  /** Purely cosmetic Bureau probe flag (`probes > 0`): once probed, never reverts. */
  probed: boolean;
  /** Purely cosmetic count of Bureau probes accumulated across deliveries (~50% roll each visit). */
  probes: number;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function defaultLevel(): LevelProgress {
  return { stars: [false, false, false, false], delivered: false, bestTimeSec: null, attempts: 0 };
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    glorbs: 0,
    levels: Object.fromEntries(LEVEL_IDS.map(id => [id, defaultLevel()])) as SaveData['levels'],
    upgrades: [],
    muted: false,
    allUnlocked: false,
    legacyDispatch: false,
    bridgeAccess: false,
    fieldCheckSeen: false,
    reports: 0,
    lang: 'auto',
    trophies: {},
    specimens: {},
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function finiteNonNeg(v: unknown, fallback: number, max = 1e9): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(max, v) : fallback;
}

/**
 * v0.2 council round 4 (Sol P1): the recognised level-record fields a build writes, each with the values it may hold.
 * A value outside them (`"stars": [null]`, `"attempts": "3"`, `"delivered": 1`) is damage the reader throws away.
 */
const isLevelTime = (v: unknown): boolean => v === undefined || v === null || (typeof v === 'number' && Number.isFinite(v) && v > 0);
const LEVEL_FIELD_SOUND: Readonly<Record<string, (value: unknown) => boolean>> = {
  stars: v => v === undefined || (Array.isArray(v) ? v.every(isBool) : typeof v === 'number' && Number.isFinite(v)),
  delivered: v => v === undefined || isBool(v),
  bestTimeSec: isLevelTime,
  bestTime: isLevelTime,
  attempts: v => v === undefined || (typeof v === 'number' && Number.isFinite(v) && v >= 0),
  mapCollectible: v => v === undefined || typeof v === 'string',
};

/** `damage` collects the path of every malformed recognised value the reader discards (see validateSave). */
function readLevel(raw: unknown, path = 'level', damage?: string[]): LevelProgress {
  const lv = defaultLevel();
  if (!isObj(raw)) {
    damage?.push(path);
    return lv;
  }
  if (damage) for (const [field, sound] of Object.entries(LEVEL_FIELD_SOUND)) if (!sound(raw[field])) damage.push(`${path}.${field}`);
  const s = raw.stars;
  if (Array.isArray(s)) {
    lv.stars = [s[0] === true, s[1] === true, s[2] === true, s[3] === true];
  } else if (typeof s === 'number' && Number.isFinite(s)) {
    // legacy shape: star count only
    const n = Math.max(0, Math.min(3, Math.floor(s)));
    lv.stars = [n >= 1, n >= 2, n >= 3, false];
  }
  lv.delivered = raw.delivered === true || lv.stars[0];
  const bt = raw.bestTimeSec ?? raw.bestTime;
  lv.bestTimeSec = typeof bt === 'number' && Number.isFinite(bt) && bt > 0 ? bt : null;
  lv.attempts = Math.floor(finiteNonNeg(raw.attempts, 0));
  const collectible = raw.mapCollectible;
  if (isMapCollectibleId(collectible)) lv.mapCollectible = collectible;
  // saves from before the pickup star: a delivered level whose pickup was already filed earns it
  if (Array.isArray(s) && s.length < 4 && lv.mapCollectible && lv.delivered) lv.stars[3] = true;
  return lv;
}

/**
 * v0.2 council round 5 (Sol P3): a kept shelf entry whose `first` is not a count (`"broken"`, `null`, `-1`) is damage:
 * the reader defaults it, so the entry is stored back repaired. A missing `first` is not.
 */
function shelfFirst(e: Record<string, unknown>, path: string, damage?: string[]): number {
  if (e.first !== undefined && !(isFiniteNumber(e.first) && (e.first as number) >= 0)) damage?.push(`${path}.first`);
  return Math.floor(finiteNonNeg(e.first, 0, 1e9));
}

/** Keep only well-formed entries for known souvenirs (unknown or retired items drop out). */
function readTrophies(raw: unknown, damage?: string[]): Record<string, TrophyEntry> {
  const out: Record<string, TrophyEntry> = {};
  if (!isObj(raw)) return out;
  for (const [item, e] of Object.entries(raw)) {
    if (!Object.hasOwn(en.items, item) || !isObj(e)) continue;
    const count = Math.floor(finiteNonNeg(e.count, 0, 1e6));
    if (count < 1 || typeof e.room !== 'string' || !isRoomId(e.room)) continue;
    out[item] = { count, room: e.room, first: shelfFirst(e, `trophies.${item}`, damage) };
  }
  return out;
}

export function isSpecimenId(value: unknown): value is string {
  return typeof value === 'string' && Object.hasOwn(en.trophies.specimens.entries, value);
}

/** v4 specimens: keep only well-formed entries for known specimens (unknown ids and bad shapes drop out). */
export function readSpecimens(raw: unknown, damage?: string[]): Record<string, SpecimenEntry> {
  const out: Record<string, SpecimenEntry> = {};
  if (!isObj(raw)) return out;
  for (const [id, e] of Object.entries(raw)) {
    if (!isSpecimenId(id) || !isObj(e)) continue;
    const count = Math.floor(finiteNonNeg(e.count, 0, 1e6));
    if (count < 1) continue;
    if (e.room !== undefined && (typeof e.room !== 'string' || !isRoomId(e.room))) continue;
    let probes: number;
    if (e.probes === undefined) {
      if (typeof e.probed !== 'boolean') continue;
      probes = e.probed ? 1 : 0;
    } else {
      if (typeof e.probes !== 'number' || !Number.isFinite(e.probes) || e.probes < 0) continue;
      if (e.probed !== undefined && typeof e.probed !== 'boolean') continue;
      probes = Math.floor(Math.min(1e6, e.probes));
    }
    const probed = probes > 0;
    const first = shelfFirst(e, `specimens.${id}`, damage);
    out[id] = e.room !== undefined
      ? { count, room: e.room, first, probed, probes }
      : { count, first, probed, probes };
  }
  return out;
}

function isMapCollectibleId(value: unknown): value is MapCollectibleId {
  return typeof value === 'string' && Object.hasOwn(en.mapCollectibles.items, value);
}

/**
 * Turn anything (parsed JSON, garbage, older shapes) into a valid SaveData. v0.2 council round 4 (Sol P1): `damage`,
 * when given, collects the path of every malformed recognised value the result leaves out (a mistyped field, a level
 * record that is not an object or holds a mistyped field, a non-string upgrade, an unreadable shelf entry for a known
 * souvenir or specimen). Unknown fields, ids and items are not damage: older and newer builds write them.
 */
export function validateSave(raw: unknown, levelIds: readonly string[] = LEVEL_IDS, damage?: string[]): SaveData {
  const out = defaultSave();
  for (const id of levelIds) out.levels[id] ??= defaultLevel();
  if (!isObj(raw)) return out;
  if (damage) for (const [field, valid] of Object.entries(SAVE_FIELD_TYPES)) if (Object.hasOwn(raw, field) && !valid(raw[field])) damage.push(field);
  // v0.2 council round 5 (Neon 4): a negative count has the right type but is clamped to 0 below
  if (damage) for (const field of ['glorbs', 'reports'] as const) if (isFiniteNumber(raw[field]) && (raw[field] as number) < 0) damage.push(field);
  out.glorbs = Math.floor(finiteNonNeg(raw.glorbs, 0, 999999));
  const levels = isObj(raw.levels) ? raw.levels : {};
  // Preserve unregistered level records when an older build reopens this save.
  for (const [id, record] of Object.entries(levels)) {
    if (Object.hasOwn(Object.prototype, id)) continue;
    if (!isObj(record)) {
      damage?.push(`levels.${id}`);
      continue;
    }
    const progress = readLevel(record, `levels.${id}`, damage);
    out.levels[id] = !LEVEL_IDS.some(known => known === id) && typeof record.mapCollectible === 'string'
      ? { ...progress, mapCollectible: record.mapCollectible }
      : progress;
  }
  const predatesBridge = !Object.hasOwn(levels, 'birch_bakery') && !Object.hasOwn(levels, 'birch_neighbours');
  out.bridgeAccess = raw.bridgeAccess === true || (predatesBridge &&
    (out.levels.level3.attempts > 0 || ORIGINAL_DEEP_IDS.some(id => out.levels[id].delivered)));
  if (Array.isArray(raw.upgrades)) {
    const set = new Set<UpgradeId>();
    const refunded = new Set<string>();
    for (const [i, u] of raw.upgrades.entries()) {
      if (typeof u !== 'string') damage?.push(`upgrades[${i}]`);
      if (UPGRADE_IDS.includes(u as UpgradeId)) set.add(u as UpgradeId);
      else if (typeof u === 'string' && Object.hasOwn(RETIRED_UPGRADES, u) && !refunded.has(u)) {
        refunded.add(u);
        out.glorbs = Math.min(999999, out.glorbs + RETIRED_UPGRADES[u]!);
      }
    }
    out.upgrades = [...set];
  }
  out.muted = raw.muted === true;
  out.allUnlocked = raw.allUnlocked === true;
  out.reports = Math.floor(finiteNonNeg(raw.reports, 0));
  const oldDispatch = raw.version === undefined || raw.version === 1;
  const played = out.reports > 0 || LEVEL_IDS.some((id) => {
    const level = out.levels[id];
    return level.delivered || level.attempts > 0 || level.bestTimeSec !== null || level.stars.some(Boolean);
  });
  out.legacyDispatch = raw.legacyDispatch === true || (oldDispatch && played);
  out.fieldCheckSeen = raw.fieldCheckSeen === true || (oldDispatch && out.levels.level2.delivered);
  if (raw.dispatch2199Finale === true) out.dispatch2199Finale = true;
  out.lang = isLangPref(raw.lang) ? raw.lang : 'auto';
  out.trophies = readTrophies(raw.trophies, damage);
  out.specimens = readSpecimens(raw.specimens, damage);
  if (damage) {
    // a shelf entry for a known souvenir or specimen that the reader could not keep
    const dropped = (field: string, known: (id: string) => boolean, kept: Record<string, unknown>) => {
      const stored = raw[field];
      if (isObj(stored)) for (const id of Object.keys(stored)) if (known(id) && !Object.hasOwn(kept, id)) damage.push(`${field}.${id}`);
    };
    dropped('trophies', id => Object.hasOwn(en.items, id), out.trophies);
    dropped('specimens', isSpecimenId, out.specimens);
  }
  return out;
}

const isFiniteNumber = (v: unknown): boolean => typeof v === 'number' && Number.isFinite(v);
const isBool = (v: unknown): boolean => typeof v === 'boolean';

/**
 * The type every recognised top-level save field has in a save some build wrote (v0.2 council round 2, Sol P2).
 * A record with one of them mistyped (`"glorbs": null`, `"levels": []`, `"muted": "broken"`) is not a save.
 */
export const SAVE_FIELD_TYPES: Readonly<Record<string, (value: unknown) => boolean>> = {
  version: v => typeof v === 'number' && Number.isInteger(v),
  glorbs: isFiniteNumber,
  levels: isObj,
  upgrades: Array.isArray,
  muted: isBool,
  allUnlocked: isBool,
  reports: isFiniteNumber,
  lang: v => typeof v === 'string',
  legacyDispatch: isBool,
  bridgeAccess: isBool,
  fieldCheckSeen: isBool,
  dispatch2199Finale: isBool,
  trophies: isObj,
  specimens: isObj,
};

/**
 * A level record that holds at least one value `readLevel` keeps. v0.2 council round 5 (Sol P2): that includes an
 * earned star in one of the four slots of a damaged star list (`[true, true, null, false]`), which `readLevel` keeps.
 */
function isUsableLevel(record: unknown): boolean {
  if (!isObj(record)) return false;
  const s = record.stars;
  if (Array.isArray(s) ? (s.length > 0 && s.every(isBool)) || s.slice(0, 4).includes(true) : isFiniteNumber(s)) return true;
  if (isBool(record.delivered)) return true;
  if (typeof record.attempts === 'number' && Number.isFinite(record.attempts) && record.attempts >= 0) return true;
  const bt = record.bestTimeSec ?? record.bestTime;
  if (typeof bt === 'number' && Number.isFinite(bt) && bt > 0) return true;
  return isMapCollectibleId(record.mapCollectible);
}

/**
 * The fields whose value is progress or a setting, and when that value is usable (v0.2 council round 3, Sol P2).
 * `version` alone is not a save, and neither is a level map with only `null` or broken records, an upgrade list
 * with no known upgrade, an unknown language or a shelf with no readable entry.
 */
const SAVE_FIELD_USABLE: Readonly<Record<string, (value: unknown) => boolean>> = {
  glorbs: v => typeof v === 'number' && Number.isFinite(v) && v >= 0,
  levels: v => isObj(v) && Object.entries(v).some(([id, record]) => !Object.hasOwn(Object.prototype, id) && isUsableLevel(record)),
  upgrades: v => Array.isArray(v) && v.some(u => typeof u === 'string' && (UPGRADE_IDS.includes(u as UpgradeId) || Object.hasOwn(RETIRED_UPGRADES, u))),
  muted: isBool,
  allUnlocked: isBool,
  reports: v => typeof v === 'number' && Number.isFinite(v) && v >= 0,
  lang: isLangPref,
  legacyDispatch: isBool,
  bridgeAccess: isBool,
  fieldCheckSeen: isBool,
  dispatch2199Finale: isBool,
  trophies: v => Object.keys(readTrophies(v)).length > 0,
  specimens: v => Object.keys(readSpecimens(v)).length > 0,
};

/**
 * A stored value worth loading: an object with every recognised field of the type a build writes, carrying at
 * least one usable progress or setting value. Unreadable JSON, `null`, arrays, an empty `{}`, a record with a
 * mistyped field and a well-typed record with nothing usable in it (`{"version":2}`, `{"levels":{"level1":null}}`)
 * are not saves, so the loader passes over them to an older key instead of importing nothing. A sparse record
 * with one usable value (`{"glorbs": 5}`, `{"lang": "fr"}`) and the default record a reset stores still load.
 */
function readSaveShape(stored: string | null): Record<string, unknown> | null {
  if (!stored) return null;
  let raw: unknown;
  try { raw = JSON.parse(stored); } catch { return null; }
  if (!isObj(raw)) return null;
  for (const [field, valid] of Object.entries(SAVE_FIELD_TYPES)) {
    if (Object.hasOwn(raw, field) && !valid(raw[field])) return null;
  }
  const usable = Object.entries(SAVE_FIELD_USABLE).some(([field, ok]) => Object.hasOwn(raw, field) && ok(raw[field]));
  return usable ? raw : null;
}

/**
 * The current key only (v0.2 council round 3, Fable F4): a record that fails the type checks but whose `levels`
 * holds at least one usable level record is this build's own save with a damaged field, not an empty value.
 * `validateSave` keeps its progress and defaults the bad field, so an older key never replaces it.
 */
function salvageCurrent(stored: string | null, anyValue = false): Record<string, unknown> | null {
  if (!stored) return null;
  let raw: unknown;
  try { raw = JSON.parse(stored); } catch { return null; }
  if (!isObj(raw)) return null;
  if (SAVE_FIELD_USABLE.levels!(raw.levels)) return raw;
  // Opus O6: with no older save to fall back to, any usable value is repaired rather than thrown away
  return anyValue && Object.entries(SAVE_FIELD_USABLE).some(([field, ok]) => Object.hasOwn(raw, field) && ok(raw[field])) ? raw : null;
}

/** True when a stored string holds a loadable save (see readSaveShape). */
export function isStoredSave(stored: string | null): boolean {
  return readSaveShape(stored) !== null;
}

/**
 * v0.2 council round 4 (Opus O2): not a save, but a damaged one whose level records survive (salvageCurrent's rule).
 * The loader salvages the newest such older value before it gives up on the file.
 */
export function isSalvageableSave(stored: string | null): boolean {
  return salvageCurrent(stored) !== null;
}

// v0.2 damaged save (2026-11-27): the loader says what it found, so the title can offer a reset for a damaged file.
/**
 * `ok`: a save loaded as stored (or an older save migrated with nothing broken in the way), or there was nothing
 * stored at all. `repaired`: the save was damaged (a mistyped field, or malformed data inside one, round 4 Sol P1)
 * and loaded repaired. `recovered`: an older save loaded past a newer stored value that was not a save, or a damaged
 * older save was salvaged (round 4, Opus O2). `unreadable`: something is stored but nothing in it is usable, so the
 * game starts fresh.
 */
export type SaveStatus = 'ok' | 'repaired' | 'recovered' | 'unreadable';

/** A store that answers one key from several stored keys (preprod) says when it passed over a stored non-save. */
export interface MergingStore extends KeyValueStore {
  passedOverDamage(key: string): boolean;
}

function passedOverDamage(storage: KeyValueStore, key: string): boolean {
  const merged = (storage as Partial<MergingStore>).passedOverDamage;
  return typeof merged === 'function' && merged.call(storage, key) === true;
}

/**
 * The current key wins whenever it holds a save, including the default record a reset stores, or a damaged save
 * whose level records survive (salvageCurrent; it is stored back repaired). Otherwise the newest older save is
 * imported and stored under the current key at once (the older keys are never rewritten). With no older save, the
 * newest damaged older save whose level records survive is salvaged the same way (round 4, Opus O2), and failing
 * that a damaged current save that still holds any usable value is repaired rather than thrown away (Opus O6).
 * A save with malformed data inside a field is stored back repaired too, so the bad bytes leave the disk (Sol P1).
 */
export function loadSave(storage: KeyValueStore | null): SaveData {
  return loadSaveWithStatus(storage).save;
}

/** `loadSave`, plus what the loader found on the way (see SaveStatus). */
export function loadSaveWithStatus(storage: KeyValueStore | null): { save: SaveData; status: SaveStatus } {
  if (!storage) return { save: defaultSave(), status: 'ok' };
  // a stored value that was not a save, passed over on the way; anything stored at all (a throw past it is damage)
  let damaged = false;
  let seen = false;
  const read = (key: string): string | null => {
    const value = storage.getItem(key);
    if (value !== null) seen = true;
    return value;
  };
  try {
    const stored = read(SAVE_KEY);
    const sound = readSaveShape(stored);
    const own = sound ?? salvageCurrent(stored);
    if (own) {
      const damage: string[] = [];
      const current = validateSave(own, LEVEL_IDS, damage);
      const clean = sound !== null && damage.length === 0;
      if (!clean || (isObj(own.levels) && !Object.hasOwn(own.levels, 'birch_bakery'))) writeSave(storage, current);
      return { save: current, status: clean ? 'ok' : 'repaired' };
    }
    if (stored !== null) damaged = true;
    // Newest key first, and each key settles before an older one is read (v0.2 council round 5, Opus 2): a sound save
    // imports, and failing that a damaged one whose level records survive is salvaged (Opus O2; the older key stays
    // as it was), so a salvageable v0.1 save is never passed over for an older sound one. A value with nothing to
    // salvage (garbage, an empty record) still falls through to the next key.
    for (const key of [V2_SAVE_KEY, LEGACY_SAVE_KEY] as const) {
      const value = read(key);
      if (passedOverDamage(storage, key)) damaged = true;
      const raw = readSaveShape(value);
      if (raw) {
        const damage: string[] = [];
        const imported = validateSave(raw, LEVEL_IDS, damage);
        writeSave(storage, imported);
        return { save: imported, status: damaged ? 'recovered' : damage.length > 0 ? 'repaired' : 'ok' };
      }
      const salvaged = salvageCurrent(value);
      if (salvaged) {
        const imported = validateSave(salvaged);
        writeSave(storage, imported);
        return { save: imported, status: 'recovered' };
      }
      if (value !== null) damaged = true;
    }
    const repaired = salvageCurrent(stored, true);
    if (repaired) {
      const current = validateSave(repaired);
      writeSave(storage, current);
      return { save: current, status: 'repaired' };
    }
    return { save: defaultSave(), status: damaged ? 'unreadable' : 'ok' };
  } catch {
    return { save: defaultSave(), status: damaged || seen ? 'unreadable' : 'ok' };
  }
}

export function writeSave(storage: KeyValueStore | null, data: SaveData): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Reset progress. Stores an empty current save so old progress stays cleared. */
export function clearSave(storage: KeyValueStore | null): void {
  writeSave(storage, defaultSave());
}

export function cloneSave(s: SaveData): SaveData {
  return validateSave(JSON.parse(JSON.stringify(s)));
}
