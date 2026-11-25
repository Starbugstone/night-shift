// v4 trophy room: HARD RULE tests + shelf model, pagination & Room 2 (Field finds) unit tests.
// Hard rules (docs/GDD-9-trophy-room.md):
// 1. Every souvenir any room can yield (all ROOMS incl. swaps and FIELD_CHECK_ROOM — iterated from
//    data, never hard-coded) must have a Room 1 slot, tr().items entry, catchy EN + FR description,
//    valid art, and fit cleanly in the room layout.
// 2. Every level's map collectible (iterated from LEVELS, never hard-coded) must have a Room 2
//    (Field finds) slot, EN + FR name, catchy EN + FR description (distinct from report comments),
//    funny Bureau status line, and vague memo hint, fitting cleanly in the room layout.
import { afterEach, describe, expect, it } from 'vitest';
import { ART } from '../src/art-manifest';
import { ROOMS } from '../src/abduct/rooms';
import { VIEW_W, type RoomId } from '../src/contracts';
import { setLang, type Lang } from '../src/i18n';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import { FIELD_CHECK_ROOM } from '../src/levels/field-check';
import { LEVELS } from '../src/levels/levels';
import { applyDeepRun, applyRun } from '../src/levels/progress';
import { defaultSave, type SaveData } from '../src/levels/save';
import {
  ROOM_CAPACITY,
  buildShelfState,
  buildSpecimenShelfState,
  buildTownCatalog,
  buildTownShelfState,
  buildTrophyCatalog,
  buildTrophyPages,
  hitTestTownRoom,
  hitTestTrophyPage,
  itemTitle,
  layoutTownRoom,
  layoutTrophyPage,
  provenanceText,
  townDescription,
  townHint,
  townItemTitle,
  townStatus,
  trophyDescription,
  trophyProgress,
  type TrophySection,
  type TrophySlot,
} from '../src/ui/trophy-data';
import { wrapWith, type Measure } from '../src/ui/report-layout';

afterEach(() => setLang('en'));

const measure: Measure = (s, size, weight) => {
  let w = 0;
  for (const ch of s) {
    const caps = (ch >= 'A' && ch <= 'Z') || 'ÀÂÉÈÊÎÔÛÇ'.includes(ch);
    w += size * (ch === ' ' ? 0.28 : caps ? 0.7 : "il.,:;'’!|".includes(ch) ? 0.3 : 0.56);
  }
  return w * (weight >= 800 ? 1.08 : 1);
};

describe('HARD RULE: every room souvenir belongs in the Trophy Room', () => {
  const sections = buildTrophyCatalog();
  const slots = sections.flatMap((s) => s.slots);
  const byId = new Map(slots.map((s) => [s.itemId, s]));

  // Iterate all ROOMS (with SOUVENIR_SWAPS already applied) + FIELD_CHECK_ROOM
  const allRooms: Array<{ label: string; itemId: string; artKey: string }> = [
    ...(Object.entries(ROOMS) as Array<[RoomId, (typeof ROOMS)[RoomId]]>).map(([id, room]) => ({
      label: id,
      itemId: room.item.name,
      artKey: room.item.sprite.key,
    })),
    { label: 'FIELD_CHECK_ROOM', itemId: FIELD_CHECK_ROOM.item.name, artKey: FIELD_CHECK_ROOM.item.sprite.key },
  ];

  it('every room (including swaps and Field Check) yields a souvenir that has a Trophy Room slot', () => {
    for (const r of allRooms) {
      const slot = byId.get(r.itemId);
      expect(slot, `missing Trophy Room slot for "${r.itemId}" (from ${r.label})`).toBeDefined();
      expect(ART[r.artKey], `missing ART manifest entry for ${r.artKey} (${r.label})`).toBeDefined();
    }
    // Every unique souvenir across ROOMS + Field Check is represented once
    const uniqueNames = new Set(allRooms.map((r) => r.itemId));
    expect(slots.length).toBe(uniqueNames.size);
  });

  it('every souvenir has a name in tr().items and a catchy description in EN and FR that fits the detail card', () => {
    const descW = VIEW_W - 64 - 60; // detail modal text width (416 px)
    for (const slot of slots) {
      for (const [lang, table] of [['en', en], ['fr', fr]] as const) {
        const itemsTable = table.items as Readonly<Record<string, { one: string; other: string }>>;
        expect(itemsTable[slot.itemId], `${lang}.items missing "${slot.itemId}"`).toBeDefined();
        const descs = table.trophies.descriptions as Readonly<Record<string, string>>;
        const desc = descs[slot.itemId];
        expect(desc, `${lang}.trophies.descriptions missing "${slot.itemId}"`).toBeTypeOf('string');
        expect(desc!.trim().length, `${lang} description empty for "${slot.itemId}"`).toBeGreaterThan(15);
        // Fits comfortably in <= 4 wrapped lines at 17 px on the detail card
        const lines = wrapWith(measure, desc!, descW, 17, 500, true);
        expect(lines.length, `${lang} description too long for "${slot.itemId}": ${desc}`).toBeLessThanOrEqual(4);
      }
      // Localized item title works in both languages
      for (const lang of ['en', 'fr'] as Lang[]) {
        setLang(lang);
        expect(itemTitle(slot.itemId).length).toBeGreaterThan(0);
        expect(trophyDescription(slot.itemId).length).toBeGreaterThan(15);
      }
    }
  });

  it('current catalogue fits in one room under ROOM_CAPACITY and lays out without overlaps or overflow', () => {
    const pages = buildTrophyPages(sections);
    expect(slots.length).toBeLessThanOrEqual(ROOM_CAPACITY);
    expect(pages.length).toBe(1);
    expect(pages[0]!.count).toBe(slots.length);

    const shelf = buildShelfState(defaultSave());
    for (const page of shelf.pages) {
      const layout = layoutTrophyPage(page);
      expect(layout.contentHeight).toBeGreaterThan(0);
      const rects = layout.sections.flatMap((s) => s.slots);
      for (const r of rects) {
        expect(r.x, r.slot.slot.itemId).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w, r.slot.slot.itemId).toBeLessThanOrEqual(VIEW_W);
        expect(r.w).toBeGreaterThanOrEqual(100);
        expect(r.h).toBeGreaterThanOrEqual(90);
      }
      // No two slots overlap
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i]!;
          const b = rects[j]!;
          const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
          expect(overlap, `overlap between ${a.slot.slot.itemId} and ${b.slot.slot.itemId}`).toBe(false);
        }
      }
    }
  });
});

describe('HARD RULE: every level map collectible belongs in Room 2 (Field finds)', () => {
  const townSlots = buildTownCatalog();
  const byId = new Map(townSlots.map((s) => [s.id, s]));
  const levelsWithPickup = LEVELS.filter((lv) => lv.map.collectible !== undefined);

  it('every level with map.collectible has a Town Room slot ordered by level', () => {
    expect(levelsWithPickup.length).toBeGreaterThanOrEqual(7);
    expect(townSlots.length).toBe(levelsWithPickup.length);
    for (let i = 0; i < levelsWithPickup.length; i++) {
      const lv = levelsWithPickup[i]!;
      const pickup = lv.map.collectible!;
      const slot = byId.get(pickup.id);
      expect(slot, `missing Town Room slot for "${pickup.id}" (${lv.id})`).toBeDefined();
      expect(slot!.levelId).toBe(lv.id);
      expect(slot!.levelNum).toBe(lv.num);
      expect(slot!.artKey).toBe(`flight/pickup_${pickup.id}`);
      expect(ART[slot!.artKey], `missing ART manifest entry for ${slot!.artKey} (${lv.id})`).toBeDefined();
      expect(townSlots[i]!.id).toBe(pickup.id);
    }
  });

  it('every town pickup has EN & FR name, distinct catchy description, Bureau status, and vague hint fitting the UI', () => {
    const descW = VIEW_W - 64 - 60; // 416 px detail modal text width
    for (const slot of townSlots) {
      for (const [lang, table] of [['en', en], ['fr', fr]] as const) {
        const mc = table.mapCollectibles.items[slot.id];
        expect(mc, `${lang}.mapCollectibles.items missing "${slot.id}"`).toBeDefined();
        expect(mc.name.trim().length, `${lang} name empty for "${slot.id}"`).toBeGreaterThan(2);

        const desc = (table.trophies.town.descriptions as Readonly<Record<string, string>>)[slot.id];
        expect(desc, `${lang}.trophies.town.descriptions missing "${slot.id}"`).toBeTypeOf('string');
        expect(desc!.trim().length, `${lang} town description empty for "${slot.id}"`).toBeGreaterThan(20);
        // Distinct from Vrell's shift-report comments
        expect(desc, `${lang} town description must differ from report comment for "${slot.id}"`).not.toBe(mc.comment);
        expect(desc, `${lang} town description must differ from missed comment for "${slot.id}"`).not.toBe(mc.missedComment);
        const lines = wrapWith(measure, desc!, descW, 17, 500, true);
        expect(lines.length, `${lang} town description too long for "${slot.id}": ${desc}`).toBeLessThanOrEqual(4);

        const status = (table.trophies.town.statuses as Readonly<Record<string, string>>)[slot.id];
        expect(status, `${lang}.trophies.town.statuses missing "${slot.id}"`).toBeTypeOf('string');
        expect(status!.trim().length, `${lang} town status empty for "${slot.id}"`).toBeGreaterThan(5);

        const hint = (table.trophies.town.hints as Readonly<Record<string, string>>)[slot.id];
        expect(hint, `${lang}.trophies.town.hints missing "${slot.id}"`).toBeTypeOf('string');
        expect(hint!.trim().length, `${lang} town hint empty for "${slot.id}"`).toBeGreaterThan(15);
      }

      for (const lang of ['en', 'fr'] as Lang[]) {
        setLang(lang);
        expect(townItemTitle(slot.id).length).toBeGreaterThan(2);
        expect(townDescription(slot.id).length).toBeGreaterThan(20);
        expect(townStatus(slot.id).length).toBeGreaterThan(5);
        expect(townHint(slot.id).length).toBeGreaterThan(15);
      }
    }
  });

  it('lays out all Town Room display cards cleanly within 540 px width without overlaps and hit-tests every card', () => {
    const shelf = buildTownShelfState(defaultSave());
    const layout = layoutTownRoom(shelf);
    expect(layout.contentHeight).toBeGreaterThan(0);
    expect(layout.slots.length).toBe(levelsWithPickup.length);
    for (const r of layout.slots) {
      expect(r.x, r.slot.slot.id).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w, r.slot.slot.id).toBeLessThanOrEqual(VIEW_W);
      expect(r.w).toBeGreaterThanOrEqual(400);
      expect(r.h).toBeGreaterThanOrEqual(96);
      const hit = hitTestTownRoom(layout, r.x + r.w / 2, r.y + r.h / 2);
      expect(hit?.slot.id).toBe(r.slot.slot.id);
    }
    for (let i = 0; i < layout.slots.length; i++) {
      for (let j = i + 1; j < layout.slots.length; j++) {
        const a = layout.slots[i]!;
        const b = layout.slots[j]!;
        const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        expect(overlap, `overlap between ${a.slot.slot.id} and ${b.slot.slot.id}`).toBe(false);
      }
    }
    expect(hitTestTownRoom(layout, 2, 2)).toBeNull();
  });
});

describe('trophy shelf model, Town Finds state & pagination', () => {
  it('starts empty from defaultSave with every exhibit unfound and ordered by level', () => {
    const shelf = buildShelfState(defaultSave());
    const town = buildTownShelfState(defaultSave());
    expect(shelf.foundCount).toBe(0);
    expect(shelf.totalCount).toBeGreaterThanOrEqual(35);
    expect(shelf.totalHauls).toBe(0);
    expect(shelf.slots.every((s) => !s.found && s.entry === null)).toBe(true);
    expect(town.foundCount).toBe(0);
    expect(town.totalCount).toBeGreaterThanOrEqual(7);
    expect(town.slots.every((s) => !s.found)).toBe(true);
    // Levels are monotonically non-decreasing across slots
    for (let i = 1; i < shelf.slots.length; i++) {
      expect(shelf.slots[i]!.slot.levelNum).toBeGreaterThanOrEqual(shelf.slots[i - 1]!.slot.levelNum);
    }
    for (let i = 1; i < town.slots.length; i++) {
      expect(town.slots[i]!.slot.levelNum).toBeGreaterThan(town.slots[i - 1]!.slot.levelNum);
    }
    const spec = buildSpecimenShelfState(defaultSave());
    expect(trophyProgress(defaultSave())).toEqual({
      found: 0,
      total: shelf.totalCount + town.totalCount + spec.totalCount,
      souvenirsFound: 0,
      souvenirsTotal: shelf.totalCount,
      townFound: 0,
      townTotal: town.totalCount,
      specimensFound: 0,
      specimensTotal: spec.totalCount,
    });
  });

  it('tracks found vs unfound, repeat haul counts, provenance, and town pickups from SaveData', () => {
    let save: SaveData = defaultSave();
    save = applyRun(
      save,
      'level1',
      { delivered: true, woke: false, timeSec: 20, bonks: 0, dignity: 100, snores: 3, itemsStolen: ['slipper'], aborted: false },
      { roomId: 'farm_window', timeSec: 12, spotted: 0 },
    ).save;
    save = applyRun(
      save,
      'level1',
      { delivered: true, woke: false, timeSec: 18, bonks: 0, dignity: 100, snores: 2, itemsStolen: ['slipper'], aborted: false },
      { roomId: 'farm_window', timeSec: 10, spotted: 0 },
    ).save;
    save = applyRun(
      save,
      'level2',
      { delivered: true, woke: false, timeSec: 22, bonks: 0, dignity: 100, snores: 1, itemsStolen: [], aborted: false },
      { roomId: 'laundry_skylight', timeSec: 15, spotted: 0, mapCollectible: 'slipper_flyer' },
    ).save;
    save = applyDeepRun(save, 'level6', {
      delivered: 3,
      elapsedSec: 290,
      spotted: 0,
      failedAbductions: 0,
      sunrise: false,
      mapCollectible: 'defibrillator',
      trophies: [{ item: 'silver butt plug', room: 'hank_rear' }],
    }).save;

    const shelf = buildShelfState(save);
    const town = buildTownShelfState(save);
    expect(shelf.foundCount).toBe(2);
    expect(shelf.totalHauls).toBe(3);
    expect(town.foundCount).toBe(2);
    expect(town.slots.find((s) => s.slot.id === 'slipper_flyer')?.found).toBe(true);
    expect(town.slots.find((s) => s.slot.id === 'defibrillator')?.found).toBe(true);
    expect(town.slots.find((s) => s.slot.id === 'krix')?.found).toBe(false);

    const spec = buildSpecimenShelfState(save);
    expect(trophyProgress(save)).toEqual({
      found: 6, // 2 souvenirs + 2 town pickups + 2 specimens (doyle & larry from applyRun)
      total: shelf.totalCount + town.totalCount + spec.totalCount,
      souvenirsFound: 2,
      souvenirsTotal: shelf.totalCount,
      townFound: 2,
      townTotal: town.totalCount,
      specimensFound: 2,
      specimensTotal: spec.totalCount,
    });

    const slipper = shelf.slots.find((s) => s.slot.itemId === 'slipper')!;
    expect(slipper.found).toBe(true);
    expect(slipper.entry).toEqual({ count: 2, room: 'farm_window', first: 0 });

    const plug = shelf.slots.find((s) => s.slot.itemId === 'silver butt plug')!;
    expect(plug.found).toBe(true);
    expect(plug.entry).toEqual({ count: 1, room: 'hank_rear', first: 3 });

    setLang('en');
    expect(provenanceText(plug.entry!)).toBe('Hank · Rear entrance');
    setLang('fr');
    expect(provenanceText(plug.entry!)).toBe('Hank · Entrée arrière');
  });

  it('hit-tests every souvenir slot centre back to its own exhibit', () => {
    const shelf = buildShelfState(defaultSave());
    const layout = layoutTrophyPage(shelf.pages[0]!);
    for (const sec of layout.sections) {
      for (const r of sec.slots) {
        const hit = hitTestTrophyPage(layout, r.x + r.w / 2, r.y + r.h / 2);
        expect(hit?.slot.itemId).toBe(r.slot.slot.itemId);
      }
    }
    expect(hitTestTrophyPage(layout, 2, 2)).toBeNull();
  });

  it('splits into multiple rooms automatically when souvenir catalogue exceeds capacity without splitting levels', () => {
    const fakeSlot = (i: number, levelNum: number): TrophySlot => ({
      index: i,
      itemId: `item_${i}`,
      artKey: 'room/slipper',
      artW: 40,
      artH: 20,
      levelId: 'level1',
      levelNum,
      rooms: ['farm_window'],
      specimenName: 'Farmer Doyle',
    });
    const fakeSections: TrophySection[] = Array.from({ length: 10 }, (_, k) => ({
      levelId: 'level1',
      levelNum: k + 1,
      slots: Array.from({ length: 6 }, (_, j) => fakeSlot(k * 6 + j + 1, k + 1)),
    }));
    // 60 items at capacity 48 -> 8 levels (48) in Wing 1, 2 levels (12) in Wing 2
    const pages = buildTrophyPages(fakeSections, ROOM_CAPACITY);
    expect(pages.length).toBe(2);
    expect(pages[0]!.count).toBe(48);
    expect(pages[1]!.count).toBe(12);
    expect(pages[0]!.sections.length).toBe(8);
    expect(pages[1]!.sections.length).toBe(2);
  });
});

describe('TrophiesScene headless navigation, room switching & modal interaction', () => {
  it('switches between Souvenirs and Field finds rooms, opens/closes detail modals, and returns on Back', async () => {
    const { TrophiesScene } = await import('../src/ui/trophies');
    const calls: string[] = [];
    const pointer = { x: 0, y: 0, down: false, pressed: false, released: false };
    const makeShell = (save: SaveData) => ({
      ctx: { pointer, assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(), tutorial: false, time: 0, reducedMotion: true },
      save,
      audio: { sfx() {} },
      input: { wheelDy: 0 },
      assets: { get: () => undefined },
      setSave() {},
      toggleMute() {},
      setLanguage() {},
      toTitle: () => { calls.push('title'); },
      toWorkOrders: () => { calls.push('workorders'); },
      toUpgrades() {},
      toTrophies() {},
      toMemo() {},
      toFlight() {},
      toAbduct() {},
      toReport() {},
      toAbortChoice() {},
    }) as unknown as import('../src/core/shell').Shell;

    const tap = (scene: InstanceType<typeof TrophiesScene>, x: number, y: number) => {
      pointer.x = x; pointer.y = y; pointer.down = true; pointer.pressed = true; pointer.released = false;
      scene.update(1 / 60);
      pointer.pressed = false; pointer.down = false; pointer.released = true;
      scene.update(1 / 60);
      pointer.released = false;
    };

    const s1 = new TrophiesScene(makeShell(defaultSave()), 'workorders');
    expect(s1.debug.room).toBe('souvenirs');

    // Tap first souvenir slot (L1 slipper) -> opens modal
    const firstRect = s1.currentLayout.sections[0]!.slots[0]!;
    tap(s1, firstRect.x + firstRect.w / 2, s1.listTop + firstRect.y + firstRect.h / 2);
    expect(s1.debug.selectedId).toBe(firstRect.slot.slot.itemId);
    // Tap Close button -> closes modal
    tap(s1, s1.closeBtn.x + s1.closeBtn.w / 2, s1.closeBtn.y + s1.closeBtn.h / 2);
    expect(s1.debug.selectedId).toBeNull();

    // Switch to Room 2 (Field finds) by tapping tabTown
    tap(s1, s1.tabTown.x + s1.tabTown.w / 2, s1.tabTown.y + s1.tabTown.h / 2);
    expect(s1.debug.room).toBe('town');
    expect(s1.tabTown.kind).toBe('primary');
    expect(s1.tabSouvenirs.kind).toBe('ghost');

    // Tap first town slot (L2 slipper_flyer) -> opens town detail modal
    const firstTown = s1.townLayout.slots[0]!;
    tap(s1, firstTown.x + firstTown.w / 2, s1.listTop + firstTown.y + firstTown.h / 2);
    expect(s1.debug.selectedId).toBe('slipper_flyer');
    // Close modal -> back to town room
    tap(s1, s1.closeBtn.x + s1.closeBtn.w / 2, s1.closeBtn.y + s1.closeBtn.h / 2);
    expect(s1.debug.selectedId).toBeNull();
    expect(s1.debug.room).toBe('town');

    // Switch back to Souvenirs via tabSouvenirs
    tap(s1, s1.tabSouvenirs.x + s1.tabSouvenirs.w / 2, s1.tabSouvenirs.y + s1.tabSouvenirs.h / 2);
    expect(s1.debug.room).toBe('souvenirs');

    // Tap Back -> returns to workorders
    tap(s1, s1.back.x + s1.back.w / 2, s1.back.y + s1.back.h / 2);
    expect(calls).toEqual(['workorders']);

    // Opened from title -> Back returns to title
    const s2 = new TrophiesScene(makeShell(defaultSave()), 'title');
    tap(s2, s2.back.x + s2.back.w / 2, s2.back.y + s2.back.h / 2);
    expect(calls).toEqual(['workorders', 'title']);
  });
});
