// "Reset progress" from the title: what counts as progress, and what a reset keeps. DOM-free.
import { LEVEL_IDS, defaultSave, type SaveData } from '../levels/save';

/** True when the save holds anything a reset would erase (the title shows its reset button then). */
export function hasProgress(s: SaveData): boolean {
  if (s.glorbs > 0 || s.reports > 0 || s.upgrades.length > 0) return true;
  if (Object.keys(s.trophies).length > 0 || Object.keys(s.specimens).length > 0) return true;
  return LEVEL_IDS.some((id) => {
    const lv = s.levels[id];
    return lv.attempts > 0 || lv.delivered || lv.bestTimeSec !== null || lv.stars.some(Boolean) || lv.mapCollectible !== undefined;
  });
}

/** A fresh save that keeps the player's settings: sound and language. */
export function resetSave(s: SaveData): SaveData {
  return { ...defaultSave(), muted: s.muted, lang: s.lang };
}
