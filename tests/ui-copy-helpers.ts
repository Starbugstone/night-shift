// Shared helpers for the copy regression tests (tests/ui-copy-repeats.test.ts, tests/ui-copy-continuity.test.ts):
// walk a string table, normalise text, and tie each player-facing string to the level where the player
// first meets it. Everything is derived from game data (LEVELS, ROOMS, the trophy catalogues, the loading
// tip gates, the rank thresholds), never from a hand-kept list.
import { ROOMS } from '../src/abduct/rooms';
import { gt, setLang, tr, type Lang } from '../src/i18n';
import { deepStartEvent, loadingTips } from '../src/levels/humor';
import { isDeep, LEVELS, levelRooms } from '../src/levels/levels';
import { levelStarCount, RANKS } from '../src/levels/progress';
import { defaultSave, type LevelId } from '../src/levels/save';
import { buildSpecimenCatalog, buildTownCatalog, buildTrophyCatalog } from '../src/ui/trophy-data';

export interface Leaf {
  path: string;
  value: string;
}

/** Every string in a table (or a sub-tree), with its dotted path. */
export function leaves(v: unknown, path = ''): Leaf[] {
  if (typeof v === 'string') return [{ path, value: v }];
  if (Array.isArray(v)) return v.flatMap((x, i) => leaves(x, path ? `${path}.${i}` : String(i)));
  if (typeof v === 'object' && v !== null) return Object.entries(v).flatMap(([k, x]) => leaves(x, path ? `${path}.${k}` : k));
  return [];
}

/** Lowercase words with placeholders, apostrophes and punctuation removed. */
export function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9à-ÿœæ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * When in the story the player first reads a string: `during` a level (memo, map, room, flight barks,
 * loading tips shown before it) or `after` its first delivery (report, first-clear line, trophy shelf).
 */
export type When = 'during' | 'after';

export interface TiedString {
  level: LevelId;
  /** Index in LEVELS. */
  index: number;
  when: When;
  /** index * 2 (+1 when `after`): a single number to compare story moments. */
  pos: number;
  path: string;
  text: string;
}

export function levelIndex(id: string): number {
  const i = LEVELS.findIndex((l) => l.id === id);
  if (i < 0) throw new Error(`unknown level ${id}`);
  return i;
}

export function momentOf(level: string, when: When): number {
  return levelIndex(level) * 2 + (when === 'after' ? 1 : 0);
}

/** Level-only tables: everything in them is shown during that level. */
export const LEVEL_TABLES: Readonly<Record<string, string>> = {
  level8: 'timeTrial',
  level9: 'crestValley',
  level10: 'grail',
  level11: 'invasion1953',
  level12: 'dispatch2199',
};

/**
 * Every string the game ties to one level, in the current language (call after `setLang`). A string tied
 * to several levels (an item two rooms can yield, a tip) is listed at the earliest one.
 */
export function tiedStrings(lang: Lang): TiedString[] {
  setLang(lang);
  const t = tr();
  const out: TiedString[] = [];
  const add = (level: LevelId, when: When, path: string, v: unknown): void => {
    const index = levelIndex(level);
    for (const leaf of leaves(v, path)) out.push({ level, index, when, pos: index * 2 + (when === 'after' ? 1 : 0), path: leaf.path, text: leaf.value });
  };
  const tables = t as unknown as Record<string, unknown>;
  for (const lv of LEVELS) {
    const id = lv.id as LevelId;
    add(id, 'during', `levels.${id}`, t.levels[id]);
    const ev = deepStartEvent(id);
    if (ev) add(id, 'during', `humor.deepZib.${ev}`, (t.humor.deepZib as Record<string, unknown>)[ev]);
    if (LEVEL_TABLES[id]) add(id, 'during', LEVEL_TABLES[id]!, tables[LEVEL_TABLES[id]!]);
    add(id, 'after', `reportExtras.headlines.${id}`, (t.reportExtras.headlines as Record<string, unknown>)[id]);
    add(id, 'after', `reportExtras.causes.${id}`, (t.reportExtras.causes as Record<string, unknown>)[id]);
    add(id, 'after', `humor.storyFirstClear.${id}`, (t.humor.storyFirstClear as Record<string, unknown>)[id]);
    add(id, 'after', `souvenirs.levels.${id}`, (t.souvenirs.levels as Record<string, unknown>)[id]);
    const shorts = isDeep(lv) ? lv.map.targets.map((tg) => tg.short) : [];
    for (const s of shorts) add(id, 'during', `flight.missed.${s}`, (t.flight.missed as Record<string, unknown>)[s]);
    for (const roomId of levelRooms(lv)) {
      const it = ROOMS[roomId]?.interior;
      if (!it) continue;
      add(id, 'during', `room ${roomId} caption`, gt(it.caption));
      add(id, 'during', `room ${roomId} mumbles`, it.mumbles.map((m) => gt(m)));
    }
  }
  const items = t.items as Record<string, unknown>;
  const souvenirItems = t.souvenirs.items as Record<string, unknown>;
  const descriptions = t.trophies.descriptions as Record<string, unknown>;
  for (const section of buildTrophyCatalog()) {
    for (const slot of section.slots) {
      add(slot.levelId, 'after', `items.${slot.itemId}`, items[slot.itemId]);
      add(slot.levelId, 'after', `souvenirs.items.${slot.itemId}`, souvenirItems[slot.itemId]);
      add(slot.levelId, 'after', `trophies.descriptions.${slot.itemId}`, descriptions[slot.itemId]);
    }
  }
  const spec = t.trophies.specimens as unknown as { entries: Record<string, { desc: string }>; repeats: Record<string, unknown> };
  for (const section of buildSpecimenCatalog()) {
    for (const slot of section.slots) {
      add(slot.levelId, 'after', `trophies.specimens.entries.${slot.id}.desc`, spec.entries[slot.id]?.desc);
      add(slot.levelId, 'after', `trophies.specimens.repeats.${slot.id}`, spec.repeats[slot.id]);
    }
  }
  const town = t.trophies.town as unknown as Record<'descriptions' | 'statuses' | 'hints', Record<string, unknown>>;
  for (const slot of buildTownCatalog()) {
    add(slot.levelId, 'during', `mapCollectibles.items.${slot.id}`, (t.mapCollectibles.items as Record<string, unknown>)[slot.id]);
    for (const k of ['descriptions', 'statuses', 'hints'] as const) add(slot.levelId, 'during', `trophies.town.${k}.${slot.id}`, town[k][slot.id]);
  }
  // loading tips: first shown on the loading screen before the earliest level whose gate they pass
  const save = defaultSave();
  const seenTips = new Set<string>();
  LEVELS.forEach((lv, i) => {
    if (i > 0) save.levels[LEVELS[i - 1]!.id as LevelId].delivered = true;
    for (const tip of loadingTips(save)) {
      if (seenTips.has(tip)) continue;
      seenTips.add(tip);
      add(lv.id as LevelId, 'during', 'loading tip', tip);
    }
  });
  // ranks: reachable once the stars on offer up to some level reach the rank's threshold
  RANKS.forEach((rank, r) => {
    let stars = 0;
    let at = -1;
    for (let i = 0; i < LEVELS.length && at < 0; i++) {
      if (rank.minStars <= stars) at = i;
      stars += levelStarCount(LEVELS[i]!);
    }
    const level = (at < 0 ? LEVELS[LEVELS.length - 1]! : LEVELS[at]!).id as LevelId;
    add(level, 'during', `ranks.${r}`, t.ranks[r]);
  });
  setLang('en');
  return out.filter((s) => s.text.trim().length > 0);
}
