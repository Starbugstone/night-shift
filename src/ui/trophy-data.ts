// v4 trophy room: pure, DOM-free catalogue, shelf state, pagination and layout maths.
// Room 1 (Souvenirs): iterates LEVELS + ROOMS (with SOUVENIR_SWAPS already applied).
// Room 2 (Field finds): iterates LEVELS and each level's `map.collectible`.
// Tested by tests/ui-trophies.test.ts.
import { VIEW_W, type MapCollectibleId, type RoomId } from '../contracts';
import { ROOMS } from '../abduct/rooms';
import { LEVELS, isDeep, levelRooms } from '../levels/levels';
import type { LevelId, SaveData, TrophyEntry } from '../levels/save';
import { fmt, gt, tr } from '../i18n';

export type TrophyRoomTab = 'souvenirs' | 'town';

/**
 * Maximum exhibits in a single Souvenirs wing before splitting into Wing 2.
 * 48 = 16 rows of 3 (~3.4 portrait screens of scroll on 375×690). Current catalogue is 35 (1 wing).
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

// Room 2 (Field finds) full-width showcase cards
export const TOWN_CARD_X = CASE_X; // 24
export const TOWN_CARD_W = CASE_W; // 492
export const TOWN_CARD_H = 118;
export const TOWN_CARD_GAP = 12;

export interface TrophySlot {
  /** 1-based Bureau exhibit number across the full souvenir catalogue. */
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

export interface TownTrophySlot {
  /** 1-based exhibit index in the Field Finds annex (ordered by level). */
  readonly index: number;
  readonly id: MapCollectibleId;
  readonly artKey: string;
  readonly levelId: LevelId;
  readonly levelNum: number;
}

export interface TownTrophySlotState {
  readonly slot: TownTrophySlot;
  /** True when `save.levels[levelId].mapCollectible === slot.id`. */
  readonly found: boolean;
}

export interface TownShelfState {
  readonly slots: readonly TownTrophySlotState[];
  readonly foundCount: number;
  readonly totalCount: number;
}

export interface TrophyProgress {
  /** Combined found exhibits across both rooms (souvenirs + town finds). */
  readonly found: number;
  /** Combined total exhibits across both rooms. */
  readonly total: number;
  readonly souvenirsFound: number;
  readonly souvenirsTotal: number;
  readonly townFound: number;
  readonly townTotal: number;
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

/** Cached souvenir catalogue (room data is immutable after boot). */
let cachedCatalog: readonly TrophySection[] | null = null;
export function trophyCatalog(): readonly TrophySection[] {
  if (!cachedCatalog) cachedCatalog = buildTrophyCatalog();
  return cachedCatalog;
}

/** Build the ordered catalogue of town pickups by iterating `LEVELS` (never hard-coded). */
export function buildTownCatalog(): readonly TownTrophySlot[] {
  const slots: TownTrophySlot[] = [];
  let nextIndex = 1;
  for (const lv of LEVELS) {
    const pickup = lv.map.collectible;
    if (!pickup) continue;
    slots.push({
      index: nextIndex++,
      id: pickup.id,
      artKey: `flight/pickup_${pickup.id}`,
      levelId: lv.id,
      levelNum: lv.num,
    });
  }
  return slots;
}

/** Cached town pickup catalogue (level map data is immutable after boot). */
let cachedTownCatalog: readonly TownTrophySlot[] | null = null;
export function townCatalog(): readonly TownTrophySlot[] {
  if (!cachedTownCatalog) cachedTownCatalog = buildTownCatalog();
  return cachedTownCatalog;
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

/** Resolve the full Room 1 (Souvenirs) shelf state from a SaveData. */
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

/** Resolve the full Room 2 (Field finds) shelf state from a SaveData (read-only). */
export function buildTownShelfState(save: SaveData): TownShelfState {
  const catalog = townCatalog();
  let foundCount = 0;
  const slots: TownTrophySlotState[] = catalog.map((slot) => {
    const found = save.levels[slot.levelId]?.mapCollectible === slot.id;
    if (found) foundCount++;
    return { slot, found };
  });
  return { slots, foundCount, totalCount: slots.length };
}

/** Combined progress counter for the Title / Work Orders entry buttons (souvenirs + town finds). */
export function trophyProgress(save: SaveData): TrophyProgress {
  const sections = trophyCatalog();
  let souvenirsFound = 0;
  let souvenirsTotal = 0;
  for (const sec of sections) {
    for (const slot of sec.slots) {
      souvenirsTotal++;
      const e = save.trophies[slot.itemId];
      if (e && e.count > 0) souvenirsFound++;
    }
  }
  const town = townCatalog();
  let townFound = 0;
  for (const slot of town) {
    if (save.levels[slot.levelId]?.mapCollectible === slot.id) townFound++;
  }
  const townTotal = town.length;
  return {
    found: souvenirsFound + townFound,
    total: souvenirsTotal + townTotal,
    souvenirsFound,
    souvenirsTotal,
    townFound,
    townTotal,
  };
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

/** Catchy Bureau catalogue description for souvenir `itemId` in the current language. */
export function trophyDescription(itemId: string): string {
  const map = tr().trophies.descriptions as Readonly<Record<string, string>>;
  return map[itemId] ?? '';
}

/** Localized display name for a town pickup, derived from `tr().mapCollectibles.items[id].name`. */
export function townItemTitle(id: MapCollectibleId): string {
  return tr().mapCollectibles.items[id]?.name ?? id;
}

/** Catchy Bureau catalogue description for a town pickup (distinct from report comments). */
export function townDescription(id: MapCollectibleId): string {
  const map = tr().trophies.town.descriptions as Readonly<Record<string, string>>;
  return map[id] ?? '';
}

/** Funny Bureau status line for a found town pickup (e.g. "Under HR review"). */
export function townStatus(id: MapCollectibleId): string {
  const map = tr().trophies.town.statuses as Readonly<Record<string, string>>;
  return map[id] ?? '';
}

/** Vague, non-spoiling memo hint for an unfound town pickup. */
export function townHint(id: MapCollectibleId): string {
  const map = tr().trophies.town.hints as Readonly<Record<string, string>>;
  const custom = map[id];
  if (custom) return custom;
  const memoHint = tr().mapCollectibles.items[id]?.memoHint;
  return memoHint ? fmt(tr().trophies.town.memoHintFallback, { hint: memoHint }) : '';
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

/** Hit-test a point in list content coordinates against a Room 1 page layout. */
export function hitTestTrophyPage(layout: PageLayout, x: number, contentY: number): TrophySlotState | null {
  for (const sec of layout.sections) {
    if (contentY < sec.y || contentY > sec.y + sec.h) continue;
    for (const r of sec.slots) {
      if (x >= r.x && x <= r.x + r.w && contentY >= r.y && contentY <= r.y + r.h) return r.slot;
    }
  }
  return null;
}

export interface TownSlotRect {
  readonly slot: TownTrophySlotState;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface TownPageLayout {
  readonly slots: readonly TownSlotRect[];
  readonly contentHeight: number;
}

/** Compute deterministic pixel rects (relative to list origin y=0) for every Field Find display card. */
export function layoutTownRoom(shelf: TownShelfState): TownPageLayout {
  let y = 12;
  const slots: TownSlotRect[] = shelf.slots.map((slot) => {
    const r: TownSlotRect = { slot, x: TOWN_CARD_X, y, w: TOWN_CARD_W, h: TOWN_CARD_H };
    y += TOWN_CARD_H + TOWN_CARD_GAP;
    return r;
  });
  return { slots, contentHeight: y + 24 };
}

/** Hit-test a point in list content coordinates against the Room 2 Field Finds layout. */
export function hitTestTownRoom(layout: TownPageLayout, x: number, contentY: number): TownTrophySlotState | null {
  for (const r of layout.slots) {
    if (x >= r.x && x <= r.x + r.w && contentY >= r.y && contentY <= r.y + r.h) return r.slot;
  }
  return null;
}
