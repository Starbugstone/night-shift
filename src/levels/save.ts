// Save data: load, validate, migrate. DOM-free (storage is injected).
import type { MapCollectibleId, UpgradeId } from '../contracts';
import { isLangPref, type LangPref } from '../i18n';
import { en } from '../i18n/en';

/**
 * Where this build keeps its save. The production build (/night-shift/) and preprod
 * (/night-shift/preprod/) share one origin, so each save format needs its own key: production still
 * reads and rewrites the v1 key in the v1 format, which drops L8, its stars and the Field Check.
 */
export const SAVE_KEY = 'night-shift-save-v2';
/** The v1 save: imported once when there is no v2 save yet, never written or removed. */
export const LEGACY_SAVE_KEY = 'night-shift-save-v1';
export const SAVE_VERSION = 2;

export const LEVEL_IDS = ['level1', 'level2', 'level3', 'level4', 'level5', 'level6', 'level7', 'level8'] as const;
export type LevelId = (typeof LEVEL_IDS)[number];

export const UPGRADE_IDS: readonly UpgradeId[] = ['beam_dampener', 'hush_drive', 'snooze_ray'];

/**
 * Upgrades that were sold and then withdrawn, with what they cost. A save that owns one gets the
 * Glorbs back on load (the Afterburner's flick-to-dash fired on ordinary steering swipes).
 */
const RETIRED_UPGRADES: Readonly<Record<string, number>> = { afterburner: 60 };

/** Tutorials: [Delivered, Still asleep, Night owl]. Deep levels: [Delivered all 3, Ghost, Night owl]. */
export type Stars = [boolean, boolean, boolean];

export interface LevelProgress {
  stars: Stars;
  delivered: boolean;
  /** Best combined flight + abduction time of a delivered run (deep: whole-shift time). */
  bestTimeSec: number | null;
  attempts: number;
  /** The map pickup has appeared on a filed report at least once. */
  mapCollectible?: MapCollectibleId;
}

export interface SaveData {
  version: typeof SAVE_VERSION;
  glorbs: number;
  levels: Record<LevelId, LevelProgress>;
  upgrades: UpgradeId[];
  muted: boolean;
  /** Debug/cheat flag: every level playable. */
  allUnlocked: boolean;
  /** Preserve the old open access to L3–L7 once a player had started playing. */
  legacyDispatch: boolean;
  /** The player finished or skipped the Field Check offer. */
  fieldCheckSeen: boolean;
  /** Reports filed so far; rotates Vrell's comments. */
  reports: number;
  /** Display language; `auto` follows the browser. Older saves have none: auto. */
  lang: LangPref;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function defaultLevel(): LevelProgress {
  return { stars: [false, false, false], delivered: false, bestTimeSec: null, attempts: 0 };
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    glorbs: 0,
    levels: {
      level1: defaultLevel(), level2: defaultLevel(), level3: defaultLevel(), level4: defaultLevel(),
      level5: defaultLevel(), level6: defaultLevel(), level7: defaultLevel(), level8: defaultLevel(),
    },
    upgrades: [],
    muted: false,
    allUnlocked: false,
    legacyDispatch: false,
    fieldCheckSeen: false,
    reports: 0,
    lang: 'auto',
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function finiteNonNeg(v: unknown, fallback: number, max = 1e9): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(max, v) : fallback;
}

function readLevel(raw: unknown): LevelProgress {
  const lv = defaultLevel();
  if (!isObj(raw)) return lv;
  const s = raw.stars;
  if (Array.isArray(s)) {
    lv.stars = [s[0] === true, s[1] === true, s[2] === true];
  } else if (typeof s === 'number' && Number.isFinite(s)) {
    // legacy shape: star count only
    const n = Math.max(0, Math.min(3, Math.floor(s)));
    lv.stars = [n >= 1, n >= 2, n >= 3];
  }
  lv.delivered = raw.delivered === true || lv.stars[0];
  const bt = raw.bestTimeSec ?? raw.bestTime;
  lv.bestTimeSec = typeof bt === 'number' && Number.isFinite(bt) && bt > 0 ? bt : null;
  lv.attempts = Math.floor(finiteNonNeg(raw.attempts, 0));
  const collectible = raw.mapCollectible;
  if (isMapCollectibleId(collectible)) lv.mapCollectible = collectible;
  return lv;
}

function isMapCollectibleId(value: unknown): value is MapCollectibleId {
  return typeof value === 'string' && Object.hasOwn(en.mapCollectibles.items, value);
}

/** Turn anything (parsed JSON, garbage, older shapes) into a valid SaveData. */
export function validateSave(raw: unknown): SaveData {
  const out = defaultSave();
  if (!isObj(raw)) return out;
  out.glorbs = Math.floor(finiteNonNeg(raw.glorbs, 0, 999999));
  const levels = isObj(raw.levels) ? raw.levels : {};
  for (const id of LEVEL_IDS) out.levels[id] = readLevel(levels[id]);
  if (Array.isArray(raw.upgrades)) {
    const set = new Set<UpgradeId>();
    const refunded = new Set<string>();
    for (const u of raw.upgrades) {
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
  out.lang = isLangPref(raw.lang) ? raw.lang : 'auto';
  return out;
}

export function loadSave(storage: KeyValueStore | null): SaveData {
  if (!storage) return defaultSave();
  try {
    const own = storage.getItem(SAVE_KEY);
    if (own) return validateSave(JSON.parse(own));
    // no v2 save yet: start from the v1 one (validateSave migrates it, keeping unlocks and stars)
    const legacy = storage.getItem(LEGACY_SAVE_KEY);
    if (!legacy) return defaultSave();
    const imported = validateSave(JSON.parse(legacy));
    // Write the import straight away: the v1 build shares this origin and rewrites the v1 key in
    // its own format (no L8, no Field Check) the next time it saves, so waiting for a setting
    // change to write v2 would let it drop what the v1 key held now.
    writeSave(storage, imported);
    return imported;
  } catch {
    return defaultSave();
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

/** Reset progress. Stores an empty v2 save rather than removing it, so the v1 save is not imported again. */
export function clearSave(storage: KeyValueStore | null): void {
  writeSave(storage, defaultSave());
}

export function cloneSave(s: SaveData): SaveData {
  return validateSave(JSON.parse(JSON.stringify(s)));
}
