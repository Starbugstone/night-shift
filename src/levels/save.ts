// Save data: load, validate, migrate. DOM-free (storage is injected).
import type { UpgradeId } from '../contracts';

export const SAVE_KEY = 'night-shift-save-v1';
export const SAVE_VERSION = 1;

export const LEVEL_IDS = ['level1', 'level2', 'level3', 'level4'] as const;
export type LevelId = (typeof LEVEL_IDS)[number];

export const UPGRADE_IDS: readonly UpgradeId[] = ['beam_dampener', 'hush_drive', 'afterburner', 'snooze_ray'];

/** Tutorials: [Delivered, Still asleep, Night owl]. Deep levels: [Delivered all 3, Ghost, Night owl]. */
export type Stars = [boolean, boolean, boolean];

export interface LevelProgress {
  stars: Stars;
  delivered: boolean;
  /** Best combined flight + abduction time of a delivered run (deep: whole-shift time). */
  bestTimeSec: number | null;
  attempts: number;
}

export interface SaveData {
  version: 1;
  glorbs: number;
  levels: Record<LevelId, LevelProgress>;
  upgrades: UpgradeId[];
  muted: boolean;
  /** Debug/cheat flag: every level playable. */
  allUnlocked: boolean;
  /** Reports filed so far; rotates Vrell's comments. */
  reports: number;
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
    levels: { level1: defaultLevel(), level2: defaultLevel(), level3: defaultLevel(), level4: defaultLevel() },
    upgrades: [],
    muted: false,
    allUnlocked: false,
    reports: 0,
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
  return lv;
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
    for (const u of raw.upgrades) if (UPGRADE_IDS.includes(u as UpgradeId)) set.add(u as UpgradeId);
    out.upgrades = [...set];
  }
  out.muted = raw.muted === true;
  out.allUnlocked = raw.allUnlocked === true;
  out.reports = Math.floor(finiteNonNeg(raw.reports, 0));
  return out;
}

export function loadSave(storage: KeyValueStore | null): SaveData {
  if (!storage) return defaultSave();
  try {
    const txt = storage.getItem(SAVE_KEY);
    if (!txt) return defaultSave();
    return validateSave(JSON.parse(txt));
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

export function clearSave(storage: KeyValueStore | null): void {
  if (!storage) return;
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function cloneSave(s: SaveData): SaveData {
  return validateSave(JSON.parse(JSON.stringify(s)));
}
