// v4 trophy swipe: previous / next exhibit in the detail modal, driven headless through the pointer.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VIEW_H, VIEW_W } from '../src/contracts';
import type { Shell } from '../src/core/shell';
import { defaultSave, type SaveData } from '../src/levels/save';
import { previewSave } from '../src/ui/trophy-data';

// Small wings so the order can be checked across a wing boundary.
const wings = vi.hoisted(() => ({ capacity: undefined as number | undefined }));
vi.mock('../src/ui/trophy-data', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/ui/trophy-data')>();
  return {
    ...real,
    buildShelfState: (save: SaveData) => real.buildShelfState(save, wings.capacity),
    buildSpecimenShelfState: (save: SaveData) => real.buildSpecimenShelfState(save, wings.capacity),
  };
});

const { TrophiesScene, SWIPE_MIN, SWIPE_SLOP } = await import('../src/ui/trophies');
type Scene = InstanceType<typeof TrophiesScene>;

afterEach(() => { wings.capacity = undefined; });

const DT = 1 / 60;

/** Some of everything found, the rest locked. */
function mixedSave(): SaveData {
  const full = previewSave(defaultSave());
  const save = defaultSave();
  Object.keys(full.trophies).forEach((id, i) => { if (i % 3 !== 1) save.trophies[id] = full.trophies[id]!; });
  Object.keys(full.specimens).forEach((id, i) => { if (i % 4 !== 2) save.specimens[id] = full.specimens[id]!; });
  save.levels.level2.mapCollectible = full.levels.level2.mapCollectible;
  return save;
}

function rig(opts: { reducedMotion?: boolean; capacity?: number } = {}) {
  wings.capacity = opts.capacity;
  const pointer = { x: 0, y: 0, down: false, pressed: false, released: false };
  const sfx: string[] = [];
  const shell = {
    ctx: { pointer, assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(), tutorial: false, time: 0, reducedMotion: opts.reducedMotion ?? false },
    save: mixedSave(),
    preprod: false,
    audio: { sfx(name: string) { sfx.push(name); } },
    input: { wheelDy: 0 },
    assets: { get: () => undefined },
    setSave() {},
    toTitle() {},
    toWorkOrders() {},
    toTrophies() {},
  } as unknown as Shell;
  const scene = new TrophiesScene(shell, 'title');
  const frames = (n: number) => { for (let i = 0; i < n; i++) scene.update(DT); };
  /** Press, move over `steps` frames, release, then let the slide finish. */
  const drag = (x0: number, y0: number, x1: number, y1: number, steps = 8, settle = 30) => {
    Object.assign(pointer, { x: x0, y: y0, down: true, pressed: true, released: false });
    scene.update(DT);
    pointer.pressed = false;
    for (let i = 1; i <= steps; i++) {
      pointer.x = x0 + ((x1 - x0) * i) / steps;
      pointer.y = y0 + ((y1 - y0) * i) / steps;
      scene.update(DT);
    }
    Object.assign(pointer, { down: false, released: true });
    scene.update(DT);
    pointer.released = false;
    frames(settle);
  };
  const tap = (x: number, y: number) => drag(x, y, x, y, 1, 1);
  return { scene, pointer, sfx, frames, drag, tap };
}

const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const swipeLeft = (r: ReturnType<typeof rig>) => r.drag(CX + 90, CY, CX - 90, CY + 10);
const swipeRight = (r: ReturnType<typeof rig>) => r.drag(CX - 90, CY, CX + 90, CY - 10);
const idOf = (s: Scene) => s.debug.selectedId;

describe('trophy swipe order', () => {
  it('follows the grid reading order of each room, every slot found or not', () => {
    const { scene } = rig();
    // Souvenirs: wing by wing, case by case, row by row = the shelf's slot order
    expect(scene.nav.souvenirs.map((st) => st.sel.item)).toEqual(scene.shelf.slots);
    expect(scene.nav.town.map((st) => st.sel.item)).toEqual(scene.townShelf.slots);
    expect(scene.nav.specimens.map((st) => st.sel.item)).toEqual(scene.specimenShelf.slots);
    for (const room of ['souvenirs', 'town', 'specimens'] as const) {
      const stops = scene.nav[room];
      expect(stops.some((st) => st.sel.item.found)).toBe(true);
      expect(stops.some((st) => !st.sel.item.found)).toBe(true);
      expect(stops[0]!.counter).toBe(`1 / ${stops.length}`);
      expect(stops[stops.length - 1]!.counter).toBe(`${stops.length} / ${stops.length}`);
    }
    // Layout order is reading order: rows top to bottom, left to right within a row
    for (let i = 1; i < scene.nav.souvenirs.length; i++) {
      const a = scene.nav.souvenirs[i - 1]!;
      const b = scene.nav.souvenirs[i]!;
      if (b.page === a.page) expect(b.y).toBeGreaterThanOrEqual(a.y);
      else expect(b.page).toBe(a.page + 1);
    }
  });

  it('steps first -> middle -> last and stops at both ends without wrapping', () => {
    for (const room of ['souvenirs', 'town', 'specimens'] as const) {
      const { scene, frames } = rig({ reducedMotion: true });
      const stops = scene.nav[room];
      scene.debug.setRoom(room);
      scene.openStop(0, true);
      expect(scene.step(-1)).toBe(false);
      expect(scene.selectedIndex).toBe(0);
      expect(scene.step(1)).toBe(true);
      expect(scene.selected).toBe(stops[1]!.sel);
      expect(scene.counterText).toBe(`2 / ${stops.length}`);
      expect(scene.step(-1)).toBe(true);
      expect(scene.selectedIndex).toBe(0);
      scene.openStop(stops.length - 1, true);
      expect(scene.hasNext).toBe(false);
      expect(scene.hasPrev).toBe(true);
      expect(scene.step(1)).toBe(false);
      expect(scene.selected).toBe(stops[stops.length - 1]!.sel);
      // a middle item has both neighbours
      scene.openStop(Math.floor(stops.length / 2), true);
      expect(scene.hasPrev && scene.hasNext).toBe(true);
      frames(2);
      expect(scene.selected).not.toBeNull();
    }
  });

  it('crosses wings and leaves the shelf on the last viewed wing, scrolled to it', () => {
    for (const room of ['souvenirs', 'specimens'] as const) {
      const { scene, tap } = rig({ reducedMotion: true, capacity: 12 });
      scene.debug.setRoom(room);
      expect(scene.debug.pageCount).toBeGreaterThan(1);
      const stops = scene.nav[room];
      const lastOfWing0 = stops.findIndex((st, i) => st.page === 0 && stops[i + 1]?.page === 1);
      expect(lastOfWing0).toBeGreaterThan(0);
      scene.openStop(lastOfWing0, true);
      expect(scene.debug.pageIndex).toBe(0);
      expect(scene.step(1)).toBe(true);
      expect(scene.debug.pageIndex).toBe(1);
      expect(scene.selected).toBe(stops[lastOfWing0 + 1]!.sel);
      // walk to the end of the room, then close by tapping outside
      while (scene.step(1));
      const last = stops[stops.length - 1]!;
      expect(scene.selected).toBe(last.sel);
      tap(CX, 8);
      expect(scene.selected).toBeNull();
      expect(scene.debug.pageIndex).toBe(last.page);
      const viewH = VIEW_H - scene.listTop;
      expect(last.y >= scene.scroll).toBe(true);
      expect(last.y + last.h <= scene.scroll + viewH).toBe(true);
      // and back across the boundary
      scene.openStop(lastOfWing0 + 1, true);
      expect(scene.step(-1)).toBe(true);
      expect(scene.debug.pageIndex).toBe(0);
    }
  });
});

describe('trophy swipe gesture', () => {
  it('a horizontal swipe changes the exhibit, slides, and never closes the modal', () => {
    const r = rig();
    const { scene } = r;
    scene.openStop(3, true);
    const before = scene.selected;
    // follow the finger while dragging
    Object.assign(r.pointer, { x: CX + 80, y: CY, down: true, pressed: true, released: false });
    scene.update(DT);
    r.pointer.pressed = false;
    r.pointer.x = CX - 20;
    scene.update(DT);
    expect(scene.cardShiftX).toBeLessThan(-20);
    r.pointer.x = CX - 80;
    scene.update(DT);
    Object.assign(r.pointer, { down: false, released: true });
    scene.update(DT);
    r.pointer.released = false;
    // still sliding out: old exhibit, fading
    expect(scene.selected).toBe(before);
    expect(scene.cardFade).toBeLessThan(1);
    r.frames(20);
    expect(scene.selectedIndex).toBe(4);
    expect(scene.cardShiftX).toBe(0);
    expect(scene.cardFade).toBe(1);
    swipeRight(r);
    expect(scene.selectedIndex).toBe(3);
    expect(r.sfx.filter((s) => s === 'click').length).toBe(2);
  });

  it('a swipe that starts on the scrim or on Close is not a tap', () => {
    const r = rig();
    const { scene } = r;
    scene.openStop(5, true);
    r.frames(1);
    // starts on the scrim above the card, ends on the scrim
    r.drag(CX + 100, 6, CX - 100, 14);
    expect(scene.selected).not.toBeNull();
    expect(scene.selectedIndex).toBe(6);
    // starts and ends on the Close button
    const c = scene.closeBtn;
    r.drag(c.x + c.w - 10, c.y + c.h / 2, c.x + 10, c.y + c.h / 2);
    expect(scene.selected).not.toBeNull();
    expect(scene.selectedIndex).toBe(7);
  });

  it('a short tap outside still closes, and Close still works', () => {
    const r = rig();
    r.scene.openStop(2, true);
    r.frames(1);
    r.tap(CX, 8);
    expect(r.scene.selected).toBeNull();
    r.scene.openStop(2, true);
    r.frames(1);
    const c = r.scene.closeBtn;
    r.tap(c.x + c.w / 2, c.y + c.h / 2);
    expect(r.scene.selected).toBeNull();
  });

  it('vertical, diagonal, short or slow drags do not navigate', () => {
    const r = rig();
    const { scene } = r;
    scene.openStop(4, true);
    r.drag(CX, CY - 120, CX + 10, CY + 120);
    expect(scene.selectedIndex).toBe(4);
    r.drag(CX + 70, CY - 70, CX - 70, CY + 70); // 45 degrees
    expect(scene.selectedIndex).toBe(4);
    r.drag(CX + 25, CY, CX - 25, CY, 30); // 50 px, slow
    expect(scene.selectedIndex).toBe(4);
    expect(scene.selected).not.toBeNull();
    expect(SWIPE_SLOP).toBeLessThan(SWIPE_MIN);
  });

  it('a fast flick shorter than the swipe distance navigates', () => {
    const r = rig();
    r.scene.openStop(4, true);
    r.drag(CX + 20, CY, CX - 20, CY, 2); // 40 px in two frames = 1200 px/s
    expect(r.scene.selectedIndex).toBe(5);
  });

  it('stops at the ends with a nudge, and the chevrons step too', () => {
    const r = rig();
    const { scene } = r;
    scene.openStop(0, true);
    r.frames(1);
    swipeRight(r);
    expect(scene.selectedIndex).toBe(0);
    expect(scene.selected).not.toBeNull();
    // the nudge plays and settles
    scene.step(-1);
    r.frames(6);
    expect(scene.cardShiftX).not.toBe(0);
    r.frames(30);
    expect(scene.cardShiftX).toBe(0);
    // tapping the dimmed ‹ does nothing (and does not count as a tap outside)
    const prev = scene.prevExhibit;
    r.tap(prev.x + 8, prev.y + prev.h / 2);
    expect(scene.selectedIndex).toBe(0);
    expect(scene.selected).not.toBeNull();
    const next = scene.nextExhibit;
    r.tap(next.x + next.w - 8, next.y + next.h / 2);
    r.frames(20);
    expect(scene.selectedIndex).toBe(1);
    r.tap(prev.x + 8, prev.y + prev.h / 2);
    r.frames(20);
    expect(scene.selectedIndex).toBe(0);
    // last item: swipe left stays put
    scene.openStop(scene.nav.souvenirs.length - 1, true);
    swipeLeft(r);
    expect(scene.selectedIndex).toBe(scene.nav.souvenirs.length - 1);
  });

  it('works in every room, from a tapped slot', () => {
    const r = rig();
    const { scene } = r;
    r.tap(scene.tabSpecimens.x + scene.tabSpecimens.w / 2, scene.tabSpecimens.y + scene.tabSpecimens.h / 2);
    const card = scene.currentSpecimenLayout.sections[0]!.slots[0]!;
    r.tap(card.x + card.w / 2, scene.listTop + card.y + card.h / 2);
    r.frames(20);
    expect(idOf(scene)).toBe(card.slot.slot.id);
    swipeLeft(r);
    expect(scene.selected).toBe(scene.nav.specimens[1]!.sel);
    r.tap(CX, 8);
    r.tap(scene.tabTown.x + scene.tabTown.w / 2, scene.tabTown.y + scene.tabTown.h / 2);
    const town = scene.townLayout.slots[2]!;
    r.tap(town.x + town.w / 2, scene.listTop + town.y + town.h / 2);
    r.frames(20);
    expect(scene.selectedIndex).toBe(2);
    swipeLeft(r);
    expect(scene.selected).toBe(scene.nav.town[3]!.sel);
    expect(scene.debug.exhibitIndex).toBe(3);
    expect(scene.debug.exhibitCount).toBe(scene.nav.town.length);
  });
});

describe('trophy swipe under reduced motion', () => {
  it('swaps on release with no follow, no slide and no nudge', () => {
    const r = rig({ reducedMotion: true });
    const { scene } = r;
    scene.openStop(3, true);
    Object.assign(r.pointer, { x: CX + 90, y: CY, down: true, pressed: true, released: false });
    scene.update(DT);
    r.pointer.pressed = false;
    for (let i = 0; i < 6; i++) {
      r.pointer.x -= 30;
      scene.update(DT);
      expect(scene.cardShiftX).toBe(0);
    }
    Object.assign(r.pointer, { down: false, released: true });
    scene.update(DT);
    r.pointer.released = false;
    expect(scene.selectedIndex).toBe(4);
    expect(scene.cardShiftX).toBe(0);
    expect(scene.cardFade).toBe(1);
    scene.openStop(0, true);
    swipeRight(r);
    expect(scene.selectedIndex).toBe(0);
    for (let i = 0; i < 10; i++) {
      scene.update(DT);
      expect(scene.cardShiftX).toBe(0);
    }
  });
});
