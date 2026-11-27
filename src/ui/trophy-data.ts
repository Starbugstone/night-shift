// v4 trophy room: pure, DOM-free catalogue, shelf state, pagination and layout maths.
// Room 1 (Souvenirs): iterates LEVELS + ROOMS (with SOUVENIR_SWAPS already applied).
// Room 2 (Field finds): iterates LEVELS and each level's `map.collectible`.
// Room 3 (Specimen Archive): iterates LEVELS targets + ROOMS (humans, dolphin & apes).
// Tested by tests/ui-trophies.test.ts and tests/ui-trophies-specimens.test.ts.
import { VIEW_W, type MapCollectibleId, type RoomId } from '../contracts';
import { ROOMS } from '../abduct/rooms';
import { LEVELS, isDeep, levelRooms, workOrderNumber } from '../levels/levels';
import { cloneSave, type LevelId, type SaveData, type SpecimenEntry, type TrophyEntry } from '../levels/save';
import { fmt, gt, tr } from '../i18n';

export type TrophyRoomTab = 'souvenirs' | 'town' | 'specimens';

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

// Room 3 (Specimen Archive) 3-column dossier cards grouped by level (every deep level has 3 targets = 1 full row)
export const SPECIMEN_COLS = 3;
export const SPECIMEN_SLOT_W = SLOT_W; // 148
export const SPECIMEN_SLOT_H = 152;

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
  readonly postcards?: readonly string[];
}

export interface TownShelfState {
  readonly slots: readonly TownTrophySlotState[];
  readonly foundCount: number;
  readonly totalCount: number;
}

export interface SpecimenSlot {
  /** 1-based Bureau specimen archive index across the full catalogue. */
  readonly index: number;
  /** Specimen id (`Human`, e.g. 'doyle', 'bubbles', 'flint', 'doc'). */
  readonly id: string;
  readonly headKey: string;
  readonly levelId: LevelId;
  readonly levelNum: number;
  /** Interior routes in `ROOMS` that hold this specimen (empty for outdoor troop pickups like Flint & Reed). */
  readonly rooms: readonly RoomId[];
  readonly outdoor: boolean;
}

export interface SpecimenSection {
  readonly levelId: LevelId;
  readonly levelNum: number;
  readonly slots: readonly SpecimenSlot[];
}

export interface SpecimenRoomPage {
  readonly pageIndex: number;
  readonly sections: readonly SpecimenSection[];
  readonly count: number;
}

export interface SpecimenSlotState {
  readonly slot: SpecimenSlot;
  readonly entry: SpecimenEntry | null;
  readonly found: boolean;
}

export interface SpecimenSectionState {
  readonly section: SpecimenSection;
  readonly slots: readonly SpecimenSlotState[];
  readonly foundCount: number;
  readonly totalCount: number;
}

export interface SpecimenPageState {
  readonly pageIndex: number;
  readonly sections: readonly SpecimenSectionState[];
  readonly foundCount: number;
  readonly totalCount: number;
}

export interface SpecimenShelfState {
  readonly pages: readonly SpecimenPageState[];
  readonly slots: readonly SpecimenSlotState[];
  readonly foundCount: number;
  readonly totalCount: number;
  readonly probedCount: number;
  readonly unprobedCount: number;
}

export interface TrophyProgress {
  /** Combined found exhibits across all three rooms (souvenirs + town finds + specimens). */
  readonly found: number;
  /** Combined total exhibits across all three rooms. */
  readonly total: number;
  readonly souvenirsFound: number;
  readonly souvenirsTotal: number;
  readonly townFound: number;
  readonly townTotal: number;
  readonly specimensFound: number;
  readonly specimensTotal: number;
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
        levelNum: workOrderNumber(lv.id),
        rooms,
        specimenName: specimenForRoom(roomId),
      };
      seen.set(itemId, { slot: { rooms } });
      slots.push(slot);
    }
    if (slots.length > 0) {
      sections.push({ levelId: lv.id, levelNum: workOrderNumber(lv.id), slots });
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
      levelNum: workOrderNumber(lv.id),
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
 * Build the ordered catalogue of unique abductable specimens by walking `LEVELS` and `ROOMS`
 * (never hard-coded). Includes tutorial humans, deep targets, Bubbles the dolphin, L8's outdoor
 * roaming apes (Flint & Reed) + Echo, and any future level's sleepers automatically.
 */
export function buildSpecimenCatalog(): readonly SpecimenSection[] {
  const seen = new Map<string, RoomId[]>();
  const sections: SpecimenSection[] = [];
  let nextIndex = 1;

  const pushSpecimen = (
    slots: SpecimenSlot[],
    id: string,
    levelId: LevelId,
    levelNum: number,
    rooms: readonly RoomId[],
  ): void => {
    const existing = seen.get(id);
    if (existing) {
      for (const r of rooms) if (!existing.includes(r)) existing.push(r);
      return;
    }
    const ownRooms = [...rooms];
    seen.set(id, ownRooms);
    slots.push({
      index: nextIndex++,
      id,
      headKey: `human/${id}_head`,
      levelId,
      levelNum,
      rooms: ownRooms,
      outdoor: ownRooms.length === 0,
    });
  };

  for (const lv of LEVELS) {
    const slots: SpecimenSlot[] = [];
    if (isDeep(lv)) {
      for (const target of lv.map.targets) {
        const entryRooms = target.entries.map((e) => e.roomId);
        let id: string | null = null;
        for (const rId of entryRooms) {
          const room = ROOMS[rId];
          if (room) {
            id = room.human;
            break;
          }
        }
        if (!id) {
          const head = target.head ?? `human/${target.short.toLowerCase()}_head`;
          const m = /^human\/(.+)_head$/.exec(head);
          if (m) id = m[1]!;
        }
        if (id) pushSpecimen(slots, id, lv.id, workOrderNumber(lv.id), entryRooms);
      }
    } else {
      const entryRooms = lv.map.entries.map((e) => e.roomId);
      for (const rId of entryRooms) {
        const room = ROOMS[rId];
        if (room) pushSpecimen(slots, room.human, lv.id, workOrderNumber(lv.id), entryRooms);
      }
    }
    if (slots.length > 0) sections.push({ levelId: lv.id, levelNum: workOrderNumber(lv.id), slots });
  }

  // Catch any room in ROOMS whose specimen was not attached to a level entry
  const extraSlots: SpecimenSlot[] = [];
  for (const [roomId, room] of Object.entries(ROOMS) as Array<[RoomId, (typeof ROOMS)[RoomId]]>) {
    if (!seen.has(room.human)) {
      pushSpecimen(extraSlots, room.human, LEVELS[0]!.id, 1, [roomId]);
    }
  }
  if (extraSlots.length > 0) {
    sections.push({ levelId: LEVELS[0]!.id, levelNum: 1, slots: extraSlots });
  }

  return sections;
}

/** Cached specimen catalogue (level & room data are immutable after boot). */
let cachedSpecimenCatalog: readonly SpecimenSection[] | null = null;
export function specimenCatalog(): readonly SpecimenSection[] {
  if (!cachedSpecimenCatalog) cachedSpecimenCatalog = buildSpecimenCatalog();
  return cachedSpecimenCatalog;
}

/** Pack specimen level sections into wings of at most `capacity` without splitting a level. */
export function buildSpecimenPages(
  sections: readonly SpecimenSection[],
  capacity = ROOM_CAPACITY,
): readonly SpecimenRoomPage[] {
  const pages: SpecimenRoomPage[] = [];
  let cur: SpecimenSection[] = [];
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

/** Resolve the full Room 3 (Specimen Archive) shelf state from a SaveData. */
export function buildSpecimenShelfState(save: SaveData, capacity = ROOM_CAPACITY): SpecimenShelfState {
  const sections = specimenCatalog();
  const rawPages = buildSpecimenPages(sections, capacity);
  const allSlots: SpecimenSlotState[] = [];
  let foundCount = 0;
  let totalCount = 0;
  let probedCount = 0;
  let unprobedCount = 0;

  const pages: SpecimenPageState[] = rawPages.map((p) => {
    let pageFound = 0;
    let pageTotal = 0;
    const secStates: SpecimenSectionState[] = p.sections.map((section) => {
      let secFound = 0;
      const slots: SpecimenSlotState[] = section.slots.map((slot) => {
        const entry = save.specimens[slot.id] ?? null;
        const found = entry !== null && entry.count > 0;
        if (found) {
          secFound++;
          foundCount++;
          if (entry.probed) probedCount++;
          else unprobedCount++;
        }
        totalCount++;
        const st: SpecimenSlotState = { slot, entry: found ? entry : null, found };
        allSlots.push(st);
        return st;
      });
      pageFound += secFound;
      pageTotal += slots.length;
      return { section, slots, foundCount: secFound, totalCount: slots.length };
    });
    return { pageIndex: p.pageIndex, sections: secStates, foundCount: pageFound, totalCount: pageTotal };
  });

  return { pages, slots: allSlots, foundCount, totalCount, probedCount, unprobedCount };
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

/** Gnome postcards follow the era dial, regardless of delivery order. */
export function gnomePostcards(save: SaveData): string[] {
  if (save.levels.birch_neighbours.mapCollectible !== 'garden_gnome') return [];
  const words = tr().birch;
  const cards = [];
  if (save.levels.level10?.delivered) cards.push('1122 · ' + words.post1122);
  if (save.levels.level11?.delivered) cards.push('1953 · ' + words.post1953);
  if (save.levels.level12?.delivered) cards.push('2199 · ' + words.post2199);
  return cards;
}

/**
 * v0.2: a town find is filed on any report, even a failed shift, but its star needs a delivered shift with
 * it aboard. True while the find is filed and that level's pickup star is still unearned.
 */
export function townStarOpen(save: SaveData, slot: TownTrophySlot): boolean {
  const lv = save.levels[slot.levelId];
  return lv?.mapCollectible === slot.id && !lv.stars[3];
}

/** Resolve the full Room 2 (Field finds) shelf state from a SaveData (read-only). */
export function buildTownShelfState(save: SaveData): TownShelfState {
  const catalog = townCatalog();
  let foundCount = 0;
  const slots: TownTrophySlotState[] = catalog.map((slot) => {
    const found = save.levels[slot.levelId]?.mapCollectible === slot.id;
    if (found) foundCount++;
    return { slot, found, ...(found && slot.id === 'garden_gnome' ? { postcards: gnomePostcards(save) } : {}) };
  });
  return { slots, foundCount, totalCount: slots.length };
}

/** Combined progress counter for the Title / Work Orders entry buttons (souvenirs + town finds + specimens). */
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
  const specSections = specimenCatalog();
  let specimensFound = 0;
  let specimensTotal = 0;
  for (const sec of specSections) {
    for (const slot of sec.slots) {
      specimensTotal++;
      const e = save.specimens[slot.id];
      if (e && e.count > 0) specimensFound++;
    }
  }
  return {
    found: souvenirsFound + townFound + specimensFound,
    total: souvenirsTotal + townTotal + specimensTotal,
    souvenirsFound,
    souvenirsTotal,
    townFound,
    townTotal,
    specimensFound,
    specimensTotal,
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

export const SPECIMEN_REPEAT_THRESHOLDS = [3, 10] as const;

export interface SpecimenCopy {
  readonly name: string;
  readonly age: string;
  readonly height: string;
  readonly weight: string;
  readonly desc: string;
  readonly at3: string;
  readonly at10: string;
}

export interface SpecimenAddendum {
  readonly threshold: 3 | 10;
  readonly heading: string;
  readonly text: string;
}

export interface SpecimenDetailState {
  readonly found: boolean;
  readonly count: number;
  readonly probes: number;
  readonly probed: boolean;
  readonly abductedLabel: string;
  readonly probeNote: string;
  readonly probeTagLabel: string;
  readonly probeStampLabel: string;
  readonly addenda: readonly SpecimenAddendum[];
}

/** Localized specimen stats, bio & repeat-visit notes in the active language. */
export function specimenInfo(id: string): SpecimenCopy {
  const entries = tr().trophies.specimens.entries as Readonly<Record<string, Omit<SpecimenCopy, 'at3' | 'at10'>>>;
  const repeats = tr().trophies.specimens.repeats as Readonly<Record<string, { readonly at3: string; readonly at10: string }>>;
  const base = entries[id];
  const rep = repeats[id];
  if (!base) return { name: id, age: '—', height: '—', weight: '—', desc: '', at3: '', at10: '' };
  return { ...base, at3: rep?.at3 ?? '', at10: rep?.at10 ?? '' };
}

/** Reached repeat-visit Bureau addenda for specimen `id` at abduction `count` (0 before 3, 1 at 3..9, 2 at 10+). */
export function specimenAddenda(id: string, count: number): readonly SpecimenAddendum[] {
  if (count < 3) return [];
  const specStr = tr().trophies.specimens;
  const info = specimenInfo(id);
  const out: SpecimenAddendum[] = [];
  if (count >= 3 && info.at3) {
    out.push({ threshold: 3, heading: specStr.addendum3, text: info.at3 });
  }
  if (count >= 10 && info.at10) {
    out.push({ threshold: 10, heading: specStr.addendum10, text: info.at10 });
  }
  return out;
}

/** Pure detail-modal state for a specimen slot (shared by DetailModalView and tests). */
export function specimenDetailState(item: SpecimenSlotState): SpecimenDetailState {
  const specStr = tr().trophies.specimens;
  const entry = item.found ? item.entry : null;
  if (!entry) {
    return {
      found: false,
      count: 0,
      probes: 0,
      probed: false,
      abductedLabel: '',
      probeNote: '',
      probeTagLabel: specStr.unprobedTag,
      probeStampLabel: specStr.probedStamp,
      addenda: [],
    };
  }
  const probes = entry.probes;
  const probed = probes > 0;
  const notes: Readonly<Record<string, string | undefined>> = specStr.probeNotes;
  const stampLabel = probes > 1 ? fmt(specStr.probedStampCount, { count: probes }) : specStr.probedStamp;
  return {
    found: true,
    count: entry.count,
    probes,
    probed,
    abductedLabel: fmt(specStr.abductedCount, { count: entry.count }),
    probeNote: probed ? (notes[item.slot.id] ?? specStr.probedNote) : specStr.unprobedNote,
    probeTagLabel: probed ? stampLabel : specStr.unprobedTag,
    probeStampLabel: stampLabel,
    addenda: specimenAddenda(item.slot.id, entry.count),
  };
}

/** Localized capture route label for a collected specimen ("Window", or "Outdoor beam-up" for Flint/Reed). */
export function specimenCaptureText(entry: SpecimenEntry): string {
  if (!entry.room) return tr().trophies.specimens.outdoorCapture;
  return tr().routes[entry.room]?.route ?? entry.room;
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

export interface SpecimenSlotRect {
  readonly slot: SpecimenSlotState;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly col: number;
  readonly row: number;
}

export interface SpecimenSectionLayout {
  readonly section: SpecimenSectionState;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly rows: number;
  readonly slots: readonly SpecimenSlotRect[];
}

export interface SpecimenPageLayout {
  readonly sections: readonly SpecimenSectionLayout[];
  readonly contentHeight: number;
}

/** Compute deterministic pixel rects (relative to list origin y=0) for every Specimen Archive case and card. */
export function layoutSpecimenPage(page: SpecimenPageState): SpecimenPageLayout {
  const sections: SpecimenSectionLayout[] = [];
  let y = 12;

  for (const sec of page.sections) {
    const rows = Math.max(1, Math.ceil(sec.slots.length / SPECIMEN_COLS));
    const h = CASE_HDR_H + rows * SPECIMEN_SLOT_H + Math.max(0, rows - 1) * ROW_GAP + CASE_BOT_PAD;
    const slots: SpecimenSlotRect[] = sec.slots.map((slot, i) => {
      const col = i % SPECIMEN_COLS;
      const row = Math.floor(i / SPECIMEN_COLS);
      return {
        slot,
        x: CASE_X + SLOT_PAD + col * (SPECIMEN_SLOT_W + SLOT_GAP),
        y: y + CASE_HDR_H + row * (SPECIMEN_SLOT_H + ROW_GAP),
        w: SPECIMEN_SLOT_W,
        h: SPECIMEN_SLOT_H,
        col,
        row,
      };
    });
    sections.push({ section: sec, x: CASE_X, y, w: CASE_W, h, rows, slots });
    y += h + CASE_GAP;
  }

  return { sections, contentHeight: y + 24 };
}

/** Hit-test a point in list content coordinates against a Room 3 Specimen Archive page layout. */
export function hitTestSpecimenPage(layout: SpecimenPageLayout, x: number, contentY: number): SpecimenSlotState | null {
  for (const sec of layout.sections) {
    if (contentY < sec.y || contentY > sec.y + sec.h) continue;
    for (const r of sec.slots) {
      if (x >= r.x && x <= r.x + r.w && contentY >= r.y && contentY <= r.y + r.h) return r.slot;
    }
  }
  return null;
}

/**
 * Preprod preview: a copy of the save with every exhibit found, so testers can inspect all three
 * rooms. Specimens cycle through 1, 3 and 10 visits (to show both addenda) and 0, 1 and 4 probes.
 * Display only: the scene never writes it back.
 */
export function previewSave(save: SaveData): SaveData {
  const out = cloneSave(save);
  for (const sec of trophyCatalog()) {
    for (const slot of sec.slots) {
      const room = slot.rooms[0];
      if (room && !out.trophies[slot.itemId]) out.trophies[slot.itemId] = { count: 1, room, first: 0 };
    }
  }
  for (const slot of townCatalog()) out.levels[slot.levelId].mapCollectible = slot.id;
  const visits = [1, 3, 10];
  const probes = [0, 1, 4];
  let i = 0;
  for (const sec of specimenCatalog()) {
    for (const slot of sec.slots) {
      const room = slot.rooms[0];
      const n = probes[i % 3]!;
      out.specimens[slot.id] = { count: visits[i % 3]!, ...(room ? { room } : {}), first: i, probes: n, probed: n > 0 };
      i++;
    }
  }
  return out;
}
