// v4 items & recap humour: Vrell's recap line about the souvenir, themed to the room and the level.
// It changes with what happened to the item on the route that was played: `got` lines when it came
// back with the specimen, `missed` lines when it stayed behind; deep levels add `all` (every
// specimen brought one) and `none` (not one). Lines live in `tr().souvenirs`. DOM-free.
import type { RoomId } from '../contracts';
import { ROOMS } from '../abduct/rooms';
import { tr } from '../i18n';

export interface SouvenirInput {
  levelId: string;
  /** The item id on each delivered route (one per delivered specimen). */
  offered: readonly string[];
  /** Item ids that came back, in the order stolen. */
  got: readonly string[];
}

interface ItemLines {
  got: readonly string[];
  missed: readonly string[];
}

/** The item id on each route, in order. */
export function offeredItems(rooms: readonly RoomId[]): string[] {
  return rooms.flatMap((id) => (ROOMS[id] ? [ROOMS[id].item.name] : []));
}

function pickLine(list: readonly string[], seed: number): string {
  return list[Math.abs(Math.floor(seed)) % list.length]!;
}

/** Every line of `kind` for the given items (items without lines add nothing). */
function linesFor(ids: readonly string[], kind: keyof ItemLines): string[] {
  const table = tr().souvenirs.items as Readonly<Record<string, ItemLines>>;
  return [...new Set(ids)].flatMap((id) => table[id]?.[kind] ?? []);
}

/** Vrell's souvenir line, or null when there is nothing themed to say (no lines for these items). */
export function souvenirQuip(q: SouvenirInput, seed: number): string | null {
  const got = q.got.filter((id) => q.offered.includes(id));
  const missed = q.offered.filter((id) => !got.includes(id));
  const levels = tr().souvenirs.levels as Readonly<Record<string, { all: readonly string[]; none: readonly string[] }>>;
  const level = q.offered.length > 1 ? levels[q.levelId] : undefined;
  const s = Math.abs(Math.floor(seed));
  // with level lines: the level's own on even seeds, an item's on odd ones; else always the item's
  const levelFirst = (own: readonly string[] | undefined, items: readonly string[]): string | null => {
    if (!own || own.length === 0) return items.length > 0 ? pickLine(items, s) : null;
    return s % 2 === 0 || items.length === 0 ? pickLine(own, s >> 1) : pickLine(items, s >> 1);
  };
  if (got.length === 0) return levelFirst(level?.none, linesFor(missed, 'missed'));
  if (missed.length === 0) return levelFirst(level?.all, linesFor(got, 'got'));
  // some came back, some did not: mostly about the one that did
  const gotLines = linesFor(got, 'got');
  const missedLines = linesFor(missed, 'missed');
  if (missedLines.length > 0 && (s % 3 === 2 || gotLines.length === 0)) return pickLine(missedLines, Math.floor(s / 3));
  return gotLines.length > 0 ? pickLine(gotLines, s - Math.floor(s / 3)) : null;
}

/**
 * Two reports in three, Vrell talks about the souvenir instead of the outcome. The first of every
 * three (rotation 0, 3, 6…) stays the outcome line: `line` is null and `rest` is the seed for it,
 * so every outcome line still comes round. Null when no souvenir line exists for this run.
 */
export function souvenirTurn(q: SouvenirInput, rotation: number): { line: string | null; rest: number } | null {
  const r = Math.abs(Math.floor(rotation));
  if (souvenirQuip(q, 0) === null) return null;
  if (r % 3 === 0) return { line: null, rest: r / 3 };
  return { line: souvenirQuip(q, r - Math.floor(r / 3) - 1), rest: r };
}
