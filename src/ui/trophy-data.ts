// v4 trophy room: pure, DOM-free catalogue, shelf state, pagination and layout maths.
// Iterates LEVELS + ROOMS (with SOUVENIR_SWAPS already applied) so new levels and items appear
// automatically. Tested by tests/ui-trophies.test.ts.
import { VIEW_W, type RoomId } from '../contracts';
import { ROOMS } from '../abduct/rooms';
import { LEVELS, isDeep, levelRooms } from '../levels/levels';
import type { LevelId, SaveData, TrophyEntry } from '../levels/save';
import { gt, tr } from '../i18n';

/**
 * Maximum exhibits in a single Trophy Room wing before splitting into Room 2 / Wing 2.
 * 48 = 16 rows of 3 (~3.4 portrait screens of scroll on 375×690). Current catalogue is 35 (1 room).
 */
export const ROOM_CAPACITY = 48;

export const TROPHY_COLS = 3;
export const CASE_X = 24;
export const CASE_W = VIEW_W - CASE_X * 2; // 492
export const SLOT_PAD = 12;
export const SLOT_GAP = 12;
export const SLOT_W = (CASE_W - SLOT_PAD * 2 - SLOT_GAP * (TROPHY_COLS - 1)) / TROPHY_COLS; // 148
export const SLOT_H = 120;
export const ROW_GAP = 10;
export const CASE_HDR_H = 38;
export const CASE_BOT_PAD = 14;
export const CASE_GAP = 16;

export interface TrophySlot {
  /** 1-based Bureau exhibit number across the full catalogue. */
  readonly index: number;
  /** Item id: its English name (key in `tr().items` and `tr().trophies.descriptions`). */
  readonly itemId: string;
  readonly artKey: string;
  readonly artW: number;
  readonly artH: number;
  readonly levelId: LevelId;
  readonly levelNum: number;
  /** All routes in `ROOMS` that can yield this item, in level/route order. */
  readonly rooms: readonly RoomId[];
  /** English source name of the specimen for the primary route (translate via `gt()`). */
  readonly specimenName: string;
}

export interface TrophySection {
  readonly levelId: LevelId;
  readonly levelNum: number;
  readonly slots: readonly TrophySlot[];
}

export interface TrophyRoomPage {
  readonly pageIndex: number;
  readonly sections: readonly TrophySection[];
  readonly count: number;
}

export interface TrophySlotState {
  readonly slot: TrophySlot;
  readonly entry: TrophyEntry | null;
  readonly found: boolean;
}

export interface TrophySectionState {
  readonly section: TrophySection;
  readonly slots: readonly TrophySlotState[];
  readonly foundCount: number;
  readonly totalCount: number;
}

export interface TrophyPageState {
  readonly pageIndex: number;
  readonly sections: readonly TrophySectionState[];
  readonly foundCount: number;
  readonly totalCount: number;
}

export interface TrophyShelfState {
  readonly pages: readonly TrophyPageState[];
  readonly slots: readonly TrophySlotState[];
  readonly foundCount: number;
  readonly totalCount: number;
  readonly totalHauls: number;
}

/** Specimen display name (English source key for `gt()`) that owns `roomId`. */
export function specimenForRoom(roomId: RoomId): string {
  for (const lv of LEVELS) {
    if (isDeep(lv)) {
      for (const target of lv.map.targets) {
        if (target.entries.some((e) => e.roomId === roomId)) return target.human;
      }
    } else if (lv.map.entries.some((e) => e.roomId === roomId)) {
      return lv.human;
    }
  }
  return '';
}

/** Build the ordered catalogue of unique abduction souvenirs across all levels and rooms. */
export function buildTrophyCatalog(): readonly TrophySection[] {
  const seen = new Map<string, { slot: { rooms: RoomId[] } }>();
  const sections: TrophySection[] = [];
  let nextIndex = 1;

  for (const lv of LEVELS) {
    const slots: TrophySlot[] = [];
    for (const roomId of levelRooms(lv)) {
      const room = ROOMS[roomId];
      if (!room) continue;
      const { name: itemId, sprite } = room.item;
      const existing = seen.get(itemId);
      if (existing) {
        if (!existing.slot.rooms.includes(roomId)) existing.slot.rooms.push(roomId);
        continue;
      }
      const rooms: RoomId[] = [roomId];
      const slot: TrophySlot = {
        index: nextIndex++,
        itemId,
        artKey: sprite.key,
        artW: sprite.w,
        artH: sprite.h,
        levelId: lv.id,
        levelNum: lv.num,
        rooms,
        specimenName: specimenForRoom(roomId),
      };
      seen.set(itemId, { slot: { rooms } });
      slots.push(slot);
    }
    if (slots.length > 0) {
      sections.push({ levelId: lv.id, levelNum: lv.num, slots });
    }
  }
  return sections;
}

/** Cached catalogue (room data is immutable after boot). */
let cachedCatalog: readonly TrophySection[] | null = null;
export function trophyCatalog(): readonly TrophySection[] {
  if (!cachedCatalog) cachedCatalog = buildTrophyCatalog();
  return cachedCatalog;
}

/**
 * Pack level sections into rooms of at most `capacity` exhibits without splitting a level across
 * rooms (unless a single level alone exceeds `capacity`).
 */
export function buildTrophyPages(
  sections: readonly TrophySection[],
  capacity = ROOM_CAPACITY,
): readonly TrophyRoomPage[] {
  const pages: TrophyRoomPage[] = [];
  let cur: TrophySection[] = [];
  let count = 0;

  for (const sec of sections) {
    if (cur.length > 0 && count + sec.slots.length > capacity) {
      pages.push({ pageIndex: pages.length, sections: cur, count });
      cur = [];
      count = 0;
    }
    cur.push(sec);
    count += sec.slots.length;
  }
  if (cur.length > 0) pages.push({ pageIndex: pages.length, sections: cur, count });
  return pages;
}

/** Resolve the full shelf state (found vs unfound, counts, totals, pages) from a SaveData. */
export function buildShelfState(save: SaveData, capacity = ROOM_CAPACITY): TrophyShelfState {
  const sections = trophyCatalog();
  const rawPages = buildTrophyPages(sections, capacity);
  const allSlots: TrophySlotState[] = [];
  let foundCount = 0;
  let totalCount = 0;
  let totalHauls = 0;

  const pages: TrophyPageState[] = rawPages.map((p) => {
    let pageFound = 0;
    let pageTotal = 0;
    const secStates: TrophySectionState[] = p.sections.map((section) => {
      let secFound = 0;
      const slots: TrophySlotState[] = section.slots.map((slot) => {
        const entry = save.trophies[slot.itemId] ?? null;
        const found = entry !== null && entry.count > 0;
        if (found) {
          secFound++;
          foundCount++;
          totalHauls += entry.count;
        }
        totalCount++;
        const st: TrophySlotState = { slot, entry: found ? entry : null, found };
        allSlots.push(st);
        return st;
      });
      pageFound += secFound;
      pageTotal += slots.length;
      return { section, slots, foundCount: secFound, totalCount: slots.length };
    });
    return { pageIndex: p.pageIndex, sections: secStates, foundCount: pageFound, totalCount: pageTotal };
  });

  return { pages, slots: allSlots, foundCount, totalCount, totalHauls };
}

/** Quick counter for the Title / Work Orders entry buttons. */
export function trophyProgress(save: SaveData): { found: number; total: number } {
  const sections = trophyCatalog();
  let found = 0;
  let total = 0;
  for (const sec of sections) {
    for (const slot of sec.slots) {
      total++;
      const e = save.trophies[slot.itemId];
      if (e && e.count > 0) found++;
    }
  }
  return { found, total };
}

/** Capitalized singular item title in the active language, derived automatically from `tr().items`. */
export function itemTitle(itemId: string): string {
  const table = tr().items as Readonly<Record<string, { one: string; other: string }>>;
  const forms = table[itemId];
  const raw = forms ? forms.one.replace(/^\{n\}\s*/, '') : itemId;
  return raw ? raw[0]!.toUpperCase() + raw.slice(1) : itemId;
}

/** Short town/location name for an unfound slot hint ("Doyle Farm · Route 9" → "Doyle Farm"). */
export function shortLocation(levelId: LevelId): string {
  const loc = tr().levels[levelId].location;
  const dot = loc.indexOf(' · ');
  return dot > 0 ? loc.slice(0, dot) : loc;
}

/** Localized provenance string for a found exhibit: "Hank · Rear entrance". */
export function provenanceText(entry: TrophyEntry): string {
  const who = specimenForRoom(entry.room);
  const route = tr().routes[entry.room]?.route ?? entry.room;
  return who ? `${gt(who)} · ${route}` : route;
}

/** Catchy Bureau catalogue description for `itemId` in the current language. */
export function trophyDescription(itemId: string): string {
  const map = tr().trophies.descriptions as Readonly<Record<string, string>>;
  return map[itemId] ?? '';
}

// ---------------------------------------------------------------- layout maths (shared by scene, view & tests)

export interface SlotRect {
  readonly slot: TrophySlotState;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly col: number;
  readonly row: number;
}

export interface SectionLayout {
  readonly section: TrophySectionState;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly rows: number;
  readonly slots: readonly SlotRect[];
}

export interface PageLayout {
  readonly sections: readonly SectionLayout[];
  readonly contentHeight: number;
}

/** Compute deterministic pixel rects (relative to list origin y=0) for every case and slot on a page. */
export function layoutTrophyPage(page: TrophyPageState): PageLayout {
  const sections: SectionLayout[] = [];
  let y = 12;

  for (const sec of page.sections) {
    const rows = Math.max(1, Math.ceil(sec.slots.length / TROPHY_COLS));
    const h = CASE_HDR_H + rows * SLOT_H + Math.max(0, rows - 1) * ROW_GAP + CASE_BOT_PAD;
    const slots: SlotRect[] = sec.slots.map((slot, i) => {
      const col = i % TROPHY_COLS;
      const row = Math.floor(i / TROPHY_COLS);
      return {
        slot,
        x: CASE_X + SLOT_PAD + col * (SLOT_W + SLOT_GAP),
        y: y + CASE_HDR_H + row * (SLOT_H + ROW_GAP),
        w: SLOT_W,
        h: SLOT_H,
        col,
        row,
      };
    });
    sections.push({ section: sec, x: CASE_X, y, w: CASE_W, h, rows, slots });
    y += h + CASE_GAP;
  }

  return { sections, contentHeight: y + 24 };
}

/** Hit-test a point in list content coordinates against a page layout. */
export function hitTestTrophyPage(layout: PageLayout, x: number, contentY: number): TrophySlotState | null {
  for (const sec of layout.sections) {
    if (contentY < sec.y || contentY > sec.y + sec.h) continue;
    for (const r of sec.slots) {
      if (x >= r.x && x <= r.x + r.w && contentY >= r.y && contentY <= r.y + r.h) return r.slot;
    }
  }
  return null;
}
