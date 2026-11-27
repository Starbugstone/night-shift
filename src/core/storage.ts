import { SAVE_KEY, V2_SAVE_KEY, isSalvageableSave, isStoredSave, type KeyValueStore, type MergingStore } from '../levels/save';

/** localStorage, or null when blocked (private mode, sandboxed iframe…). */
export function browserStorage(): KeyValueStore | null {
  try {
    const s = window.localStorage;
    const probe = '__ns_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function watchReducedMotion(onChange: (reduced: boolean) => void): boolean {
  try {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener?.('change', () => onChange(mq.matches));
    return mq.matches;
  } catch {
    return false;
  }
}

/** Preprod keeps its own save so testing there never writes the save production reads. */
export const PREPROD_SAVE_KEY = 'night-shift-save-preprod-v3';
const PREPROD_V2_KEY = 'night-shift-save-preprod';

/** True on the preprod deploy (/night-shift/preprod/), never on production. */
export function isPreprodPath(pathname: string): boolean {
  return /\/preprod\//.test(pathname);
}

/**
 * Preprod's view of storage: the save lives under its own key. The first load starts from a copy
 * of the shared save (read only), and every write goes to the preprod key.
 */
export function preprodStorage(inner: KeyValueStore | null): MergingStore | null {
  if (!inner) return null;
  const map = (key: string): string => (key === SAVE_KEY ? PREPROD_SAVE_KEY : key);
  // v0.2 damaged save: the last V2_SAVE_KEY read passed over a stored value that was not a save
  let passedOver = false;
  return {
    getItem: (key) => {
      if (key === SAVE_KEY) return inner.getItem(PREPROD_SAVE_KEY);
      if (key === V2_SAVE_KEY) {
        passedOver = false;
        // The newest loadable candidate: a save, or (v0.2 council round 4, Opus O2) a damaged save whose level records
        // survive, to salvage. Each key settles before an older one is read (round 5, Opus 2: a salvageable production
        // save beats an older sound one), and an unreadable or empty newer value never hides an intact older save.
        for (const k of [PREPROD_V2_KEY, SAVE_KEY, V2_SAVE_KEY]) {
          const v = inner.getItem(k);
          if (isStoredSave(v) || isSalvageableSave(v)) return v;
          if (v !== null) passedOver = true;
        }
        return null;
      }
      return inner.getItem(key);
    },
    setItem: (key, value) => inner.setItem(map(key), value),
    removeItem: (key) => inner.removeItem(map(key)),
    passedOverDamage: (key) => key === V2_SAVE_KEY && passedOver,
  };
}
