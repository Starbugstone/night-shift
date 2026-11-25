// v4 specimens: HARD RULE tests + save persistence, probe invariance, L8 troop pickup,
// layout geometry and Room 3 (Specimen Archive) scene tests.
// Hard rule (docs/GDD-9-trophy-room.md):
// Every specimen in ROOMS (incl. FIELD_CHECK_ROOM) and every target in LEVELS (incl. outdoor troop
// pickups like L8's Flint and Reed) — iterated from data, never hard-coded — must have:
// 1. An EN and FR display name, age, height, weight and funny description fitting the detail card.
// 2. A slot in the Specimen Archive wing, with zero overlapping slots and every slot inside 540 px.
// 3. Clean save round-trip, unknown ids & malformed shapes dropped, and `probed` fixed after first delivery.
// 4. Zero gameplay effect: stars, glorbs and unlocks are identical whether `probed` rolls true or false.
import { afterEach, describe, expect, it } from 'vitest';
import { ART } from '../src/art-manifest';
import { ROOMS } from '../src/abduct/rooms';
import { VIEW_W, type AbductResult, type FlightResult, type RoomId } from '../src/contracts';
import { setLang, type Lang } from '../src/i18n';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import { FIELD_CHECK_ROOM } from '../src/levels/field-check';
import { LEVELS, isDeep } from '../src/levels/levels';
import { applyDeepRun, applyRun, recordSpecimens } from '../src/levels/progress';
import { DeepRun } from '../src/levels/run';
import { defaultSave, validateSave, type SaveData } from '../src/levels/save';
import {
  ROOM_CAPACITY,
  buildSpecimenCatalog,
  buildSpecimenPages,
  buildSpecimenShelfState,
  hitTestSpecimenPage,
  layoutSpecimenPage,
  specimenCaptureText,
  specimenInfo,
  trophyProgress,
  type SpecimenSection,
  type SpecimenSlot,
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

const abductOk = (o: Partial<AbductResult> = {}): AbductResult => ({
  delivered: true, woke: false, timeSec: 20, bonks: 0, dignity: 100, snores: 3, itemsStolen: [], aborted: false, ...o,
});
const flightOk = (roomId: RoomId = 'farm_window'): FlightResult => ({ roomId, timeSec: 12, spotted: 0 });

describe('HARD RULE: every abductable specimen belongs in Room 3 (Specimen Archive)', () => {
  const sections = buildSpecimenCatalog();
  const slots = sections.flatMap((s) => s.slots);
  const byId = new Map(slots.map((s) => [s.id, s]));

  // Walk every `human` in ROOMS, FIELD_CHECK_ROOM, and every target in LEVELS (incl. outdoor troop targets)
  const expectedIds = new Set<string>();
  for (const room of Object.values(ROOMS)) expectedIds.add(room.human);
  expectedIds.add(FIELD_CHECK_ROOM.human);
  for (const lv of LEVELS) {
    if (isDeep(lv)) {
      for (const t of lv.map.targets) {
        if (t.entries.length > 0) {
          for (const e of t.entries) {
            const room = ROOMS[e.roomId];
            if (room) expectedIds.add(room.human);
          }
        } else {
          const head = t.head ?? `human/${t.short.toLowerCase()}_head`;
          const m = /^human\/(.+)_head$/.exec(head);
          if (m) expectedIds.add(m[1]!);
        }
      }
    } else {
      for (const e of lv.map.entries) {
        const room = ROOMS[e.roomId];
        if (room) expectedIds.add(room.human);
      }
    }
  }

  it('every specimen from ROOMS, FIELD_CHECK_ROOM and LEVELS (including Bubbles and all L8 apes) has a slot', () => {
    expect(expectedIds.has('bubbles')).toBe(true);
    expect(expectedIds.has('flint')).toBe(true);
    expect(expectedIds.has('reed')).toBe(true);
    expect(expectedIds.has('echo')).toBe(true);
    expect(expectedIds.has('doc')).toBe(true);
    expect(expectedIds.has('buff')).toBe(true);
    expect(expectedIds.has('marvin')).toBe(true);

    for (const id of expectedIds) {
      const slot = byId.get(id);
      expect(slot, `missing Specimen Archive slot for "${id}"`).toBeDefined();
      expect(ART[slot!.headKey], `missing ART entry for ${slot!.headKey}`).toBeDefined();
    }
    expect(slots.length).toBe(expectedIds.size);
  });

  it('every specimen has EN & FR name, age, height, weight and funny description fitting the detail card', () => {
    const descW = VIEW_W - 64 - 60; // 416 px modal text width
    for (const slot of slots) {
      for (const [lang, table] of [['en', en], ['fr', fr]] as const) {
        const entries = table.trophies.specimens.entries as Readonly<Record<string, { name: string; age: string; height: string; weight: string; desc: string }>>;
        const entry = entries[slot.id];
        expect(entry, `${lang}.trophies.specimens.entries missing "${slot.id}"`).toBeDefined();
        expect(entry!.name.trim().length, `${lang} name empty for "${slot.id}"`).toBeGreaterThan(1);
        expect(entry!.age.trim().length, `${lang} age empty for "${slot.id}"`).toBeGreaterThan(0);
        expect(entry!.height.trim().length, `${lang} height empty for "${slot.id}"`).toBeGreaterThan(2);
        expect(entry!.weight.trim().length, `${lang} weight empty for "${slot.id}"`).toBeGreaterThan(2);
        expect(entry!.desc.trim().length, `${lang} description too short for "${slot.id}"`).toBeGreaterThan(20);
        // Fits comfortably in <= 4 wrapped lines at 16 px on the detail card
        const lines = wrapWith(measure, entry!.desc, descW, 16, 500, true);
        expect(lines.length, `${lang} description too long for "${slot.id}": ${entry!.desc}`).toBeLessThanOrEqual(4);
      }

      for (const lang of ['en', 'fr'] as Lang[]) {
        setLang(lang);
        const info = specimenInfo(slot.id);
        expect(info.name.length).toBeGreaterThan(1);
        expect(info.desc.length).toBeGreaterThan(20);
      }
    }
  });

  it('fits cleanly in the wing with zero overlapping slots, every slot inside 540 px, and accurate hit-testing', () => {
    const pages = buildSpecimenPages(sections, ROOM_CAPACITY);
    expect(slots.length).toBeLessThanOrEqual(ROOM_CAPACITY);
    expect(pages.length).toBe(1);
    expect(pages[0]!.count).toBe(slots.length);

    const shelf = buildSpecimenShelfState(defaultSave());
    for (const page of shelf.pages) {
      const layout = layoutSpecimenPage(page);
      expect(layout.contentHeight).toBeGreaterThan(0);
      const rects = layout.sections.flatMap((s) => s.slots);
      expect(rects.length).toBe(slots.length);

      for (const r of rects) {
        expect(r.x, r.slot.slot.id).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w, r.slot.slot.id).toBeLessThanOrEqual(VIEW_W);
        expect(r.w).toBeGreaterThanOrEqual(100);
        expect(r.h).toBeGreaterThanOrEqual(120);
        const hit = hitTestSpecimenPage(layout, r.x + r.w / 2, r.y + r.h / 2);
        expect(hit?.slot.id).toBe(r.slot.slot.id);
      }
      expect(hitTestSpecimenPage(layout, 2, 2)).toBeNull();

      // Zero overlaps between any two specimen cards
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i]!;
          const b = rects[j]!;
          const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
          expect(overlap, `overlap between ${a.slot.slot.id} and ${b.slot.slot.id}`).toBe(false);
        }
      }
    }
  });

  it('paginates automatically into multiple wings once specimen count exceeds ROOM_CAPACITY', () => {
    const fakeSlot = (i: number, levelNum: number): SpecimenSlot => ({
      index: i,
      id: `spec_${i}`,
      headKey: 'human/doyle_head',
      levelId: 'level1',
      levelNum,
      rooms: ['farm_window'],
      outdoor: false,
    });
    const fakeSections: SpecimenSection[] = Array.from({ length: 18 }, (_, k) => ({
      levelId: 'level1',
      levelNum: k + 1,
      slots: Array.from({ length: 3 }, (_, j) => fakeSlot(k * 3 + j + 1, k + 1)),
    }));
    // 54 specimens at capacity 48 -> 16 levels (48) in Wing 1, 2 levels (6) in Wing 2
    const pages = buildSpecimenPages(fakeSections, ROOM_CAPACITY);
    expect(pages.length).toBe(2);
    expect(pages[0]!.count).toBe(48);
    expect(pages[1]!.count).toBe(6);
  });
});

describe('specimen save round-trip, validation, probe persistence & cosmetic invariance', () => {
  it('survives a save round-trip, starts empty on old saves, and drops unknown ids and malformed shapes', () => {
    const saved = applyRun(defaultSave(), 'level1', abductOk(), flightOk('farm_window'), () => 0.1).save;
    expect(saved.specimens.doyle).toEqual({ count: 1, room: 'farm_window', first: 0, probed: true });
    expect(validateSave(JSON.parse(JSON.stringify(saved))).specimens).toEqual(saved.specimens);

    // Old saves without `specimens` load cleanly with `{}`
    expect(validateSave({ version: 2, levels: {} }).specimens).toEqual({});

    // Unknown ids and bad shapes drop out; valid indoor & outdoor entries survive
    expect(validateSave({
      version: 2,
      specimens: {
        doyle: { count: 2, room: 'farm_window', first: 1, probed: true },
        flint: { count: 1, first: 4, probed: false }, // outdoor pickup: no room
        unknown_alien: { count: 1, room: 'farm_window', first: 0, probed: true },
        larry: { count: 0, room: 'laundry_skylight', first: 0, probed: false }, // count < 1
        dave: { count: 1, room: 'not_a_room', first: 0, probed: true }, // invalid room
        barb: { count: 1, room: 'barb_chimney', first: 0, probed: 'yes' }, // non-boolean probed
        gary: { count: 1, room: 123, first: 0, probed: false }, // bad room type
        nigel: null,
      },
    }).specimens).toEqual({
      doyle: { count: 2, room: 'farm_window', first: 1, probed: true },
      flint: { count: 1, first: 4, probed: false },
    });
  });

  it('keeps `probed`, `room`, and `first` fixed after first delivery across repeated abductions', () => {
    // First delivery rolls probed = true (0.2 < 0.5)
    const firstTrue = applyRun(defaultSave(), 'level1', abductOk(), flightOk('farm_window'), () => 0.2).save;
    expect(firstTrue.specimens.doyle).toEqual({ count: 1, room: 'farm_window', first: 0, probed: true });

    // Second delivery tries rng = 0.99 (would be false) and a different route -> probed, room, first MUST NOT change
    const secondTrue = applyRun(firstTrue, 'level1', abductOk(), flightOk('farm_chimney'), () => 0.99).save;
    expect(secondTrue.specimens.doyle).toEqual({ count: 2, room: 'farm_window', first: 0, probed: true });

    // First delivery rolls probed = false (0.8 >= 0.5)
    const firstFalse = applyRun(defaultSave(), 'level2', abductOk(), flightOk('laundry_skylight'), () => 0.8).save;
    expect(firstFalse.specimens.larry).toEqual({ count: 1, room: 'laundry_skylight', first: 0, probed: false });

    // Second delivery tries rng = 0.01 (would be true) -> stays false!
    const secondFalse = applyRun(firstFalse, 'level2', abductOk(), flightOk('laundry_loading'), () => 0.01).save;
    expect(secondFalse.specimens.larry).toEqual({ count: 2, room: 'laundry_skylight', first: 0, probed: false });
  });

  it('records nothing on failed or aborted runs', () => {
    expect(applyRun(defaultSave(), 'level1', abductOk({ aborted: true }), flightOk()).save.specimens).toEqual({});
    expect(applyRun(defaultSave(), 'level1', abductOk({ delivered: false }), flightOk()).save.specimens).toEqual({});
  });

  it('leaves stars, glorbs, rank and unlocks identical whether the probe roll is true or false', () => {
    const tutProbed = applyRun(defaultSave(), 'level1', abductOk({ itemsStolen: ['slipper'] }), flightOk('farm_window'), () => 0.1);
    const tutUnprobed = applyRun(defaultSave(), 'level1', abductOk({ itemsStolen: ['slipper'] }), flightOk('farm_window'), () => 0.9);
    expect(tutProbed.save.specimens.doyle?.probed).toBe(true);
    expect(tutUnprobed.save.specimens.doyle?.probed).toBe(false);
    expect(tutProbed.stars).toEqual(tutUnprobed.stars);
    expect(tutProbed.glorbs).toBe(tutUnprobed.glorbs);
    expect(tutProbed.save.glorbs).toBe(tutUnprobed.save.glorbs);
    expect(tutProbed.unlockedNext).toBe(tutUnprobed.unlockedNext);
    expect(tutProbed.rankAfter).toEqual(tutUnprobed.rankAfter);

    const summary = {
      delivered: 3,
      elapsedSec: 210,
      spotted: 0,
      failedAbductions: 0,
      sunrise: false,
      trophies: [{ item: 'sardine tin', room: 'bubbles_roof' as RoomId }],
      specimens: [
        { id: 'bubbles', room: 'bubbles_roof' as RoomId },
        { id: 'pete', room: 'pete_gallery' as RoomId },
        { id: 'sal', room: 'sal_loft' as RoomId },
      ],
    };
    const deepProbed = applyDeepRun(defaultSave(), 'level5', summary, () => 0.1);
    const deepUnprobed = applyDeepRun(defaultSave(), 'level5', summary, () => 0.9);
    expect(deepProbed.save.specimens.bubbles?.probed).toBe(true);
    expect(deepUnprobed.save.specimens.bubbles?.probed).toBe(false);
    expect(deepProbed.stars).toEqual(deepUnprobed.stars);
    expect(deepProbed.glorbs).toBe(deepUnprobed.glorbs);
    expect(deepProbed.save.glorbs).toBe(deepUnprobed.save.glorbs);
    expect(deepProbed.unlockedNext).toBe(deepUnprobed.unlockedNext);
  });

  it('collects indoor specimens and L8 outdoor ape troops via DeepRun.summary()', () => {
    const l8 = LEVELS.find((l) => l.id === 'level8')!;
    if (!isDeep(l8)) throw new Error('expected deep level8');
    const run = new DeepRun(l8, LEVELS.indexOf(l8));

    // Catch 2 apes from Flint's troop (target 0)
    run.troops[0]!.catch(0);
    run.finishPickup(0, { x: 540, y: 1520 });
    expect(run.specimens).toEqual([]); // quota not met yet
    run.troops[0]!.catch(1);
    run.finishPickup(0, { x: 330, y: 1350 });
    expect(run.specimens).toEqual([{ id: 'flint' }]);

    // Catch 2 apes from Reed's troop (target 1)
    run.troops[1]!.catch(0);
    run.finishPickup(1, { x: 1040, y: 980 });
    run.troops[1]!.catch(1);
    run.finishPickup(1, { x: 1130, y: 810 });
    expect(run.specimens).toEqual([{ id: 'flint' }, { id: 'reed' }]);

    // Abduct Echo indoors (target 2, entry 0 = echo_appeal)
    run.startAbduct(2, 0);
    run.finishAbduct(abductOk({ itemsStolen: ['first-edition bone'] }));
    expect(run.phase).toBe('done');
    expect(run.summary().specimens).toEqual([
      { id: 'flint' },
      { id: 'reed' },
      { id: 'echo', room: 'echo_appeal' },
    ]);

    let seq = 0;
    const rolls = [0.2, 0.8, 0.3];
    const outcome = applyDeepRun(defaultSave(), 'level8', run.summary(), () => rolls[seq++] ?? 0.5);
    expect(outcome.save.specimens.flint).toEqual({ count: 1, first: 0, probed: true });
    expect(outcome.save.specimens.reed).toEqual({ count: 1, first: 0, probed: false });
    expect(outcome.save.specimens.echo).toEqual({ count: 1, room: 'echo_appeal', first: 0, probed: true });

    setLang('en');
    expect(specimenCaptureText(outcome.save.specimens.flint!)).toBe('Outdoor beam-up');
    expect(specimenCaptureText(outcome.save.specimens.echo!)).toBe('Appeals hatch');
    setLang('fr');
    expect(specimenCaptureText(outcome.save.specimens.flint!)).toBe('Enlèvement en plein air');
    expect(specimenCaptureText(outcome.save.specimens.echo!)).toBe('Trappe des recours');
  });

  it('updates trophyProgress totals and Room 3 navigation cleanly in TrophiesScene', async () => {
    const save: SaveData = defaultSave();
    recordSpecimens(save, [
      { id: 'doyle', room: 'farm_window' },
      { id: 'bubbles', room: 'bubbles_roof' },
      { id: 'flint' },
    ], () => 0.1);
    const prog = trophyProgress(save);
    expect(prog.specimensFound).toBe(3);
    expect(prog.specimensTotal).toBe(23);
    expect(prog.found).toBe(3);
    expect(prog.total).toBe(prog.souvenirsTotal + prog.townTotal + prog.specimensTotal);

    const { TrophiesScene } = await import('../src/ui/trophies');
    const pointer = { x: 0, y: 0, down: false, pressed: false, released: false };
    const shell = {
      ctx: { pointer, assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(), tutorial: false, time: 0, reducedMotion: true },
      save,
      audio: { sfx() {} },
      input: { wheelDy: 0 },
      assets: { get: () => undefined },
      setSave() {},
      toggleMute() {},
      setLanguage() {},
      toTitle() {},
      toWorkOrders() {},
      toUpgrades() {},
      toTrophies() {},
      toMemo() {},
      toFlight() {},
      toAbduct() {},
      toReport() {},
      toAbortChoice() {},
    } as unknown as import('../src/core/shell').Shell;

    const tap = (scene: InstanceType<typeof TrophiesScene>, x: number, y: number) => {
      pointer.x = x; pointer.y = y; pointer.down = true; pointer.pressed = true; pointer.released = false;
      scene.update(1 / 60);
      pointer.pressed = false; pointer.down = false; pointer.released = true;
      scene.update(1 / 60);
      pointer.released = false;
    };

    const scene = new TrophiesScene(shell, 'title');
    tap(scene, scene.tabSpecimens.x + scene.tabSpecimens.w / 2, scene.tabSpecimens.y + scene.tabSpecimens.h / 2);
    expect(scene.debug.room).toBe('specimens');
    expect(scene.debug.specimensFound).toBe(3);
    expect(scene.debug.specimensTotal).toBe(23);
    expect(scene.tabSpecimens.kind).toBe('primary');

    // Tap first specimen card (doyle) -> opens specimen detail modal
    const firstCard = scene.currentSpecimenLayout.sections[0]!.slots[0]!;
    tap(scene, firstCard.x + firstCard.w / 2, scene.listTop + firstCard.y + firstCard.h / 2);
    expect(scene.debug.selectedId).toBe('doyle');

    // Debug selectSpecimen jumps straight to Bubbles
    expect(scene.debug.selectSpecimen('bubbles')).toBe(true);
    expect(scene.debug.selectedId).toBe('bubbles');
    expect(scene.debug.selectSpecimen('nonexistent')).toBe(false);
    scene.debug.close();
    expect(scene.debug.selectedId).toBeNull();
  });
});
