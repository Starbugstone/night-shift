// v4 trophy room: Bureau Evidence Locker scene + retained PixiJS 8 view.
// Room 1 (Souvenirs): abduction souvenirs grouped by level/town.
// Room 2 (Field finds): town map collectibles ordered by level, with animated figures when found
// and still silhouettes + vague memo hints when unfound.
// Room 3 (Specimen Archive): every abducted specimen (humans, dolphin & apes) with animated bust
// portraits, stats, descriptions, and cosmetic Bureau probe status. See docs/GDD-9-trophy-room.md.
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { Assets, MapCollectibleId, PointerState, Scene } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { easeInCubic, easeOutBack, easeOutCubic } from '../core/fx';
import { GLOW, Glow, glowTexture } from '../core/gfx/glow';
import { ViewSlot, type SceneView } from '../core/gfx/scene';
import { Shape, keyOf, roundRect } from '../core/gfx/shapes';
import { Label, Paragraph, measure, wrapLines } from '../core/gfx/text';
import { paintedTexture } from '../core/gfx/textures';
import { formatOrderNumber } from '../levels/levels';
import { clamp } from './draw';
import { C } from './theme';
import { Button } from './widgets';
import { NightSky } from './views/backdrop';
import { ButtonView } from './views/button';
import { highlightedPanel } from './views/menu-decor';
import {
  SpecimenFigure,
  specimenBadgeTexture,
  specimenFitScale,
  specimenFitSize,
  specimenSilhouetteTexture,
} from './views/specimen-figure';
import {
  clockFlyerDetailTexture,
  createTownPickupFigure,
  fieldFindBadgeTexture,
  fitArtSize,
  townPickupFitSize,
  townPickupScale,
  townPickupSilhouetteTexture,
  trophyArtTexture,
  trophyCupTexture,
  trophySilhouetteTexture,
  type PickupFigureHandle,
} from './views/trophy-art';
import {
  CASE_HDR_H,
  CASE_W,
  SLOT_H,
  SLOT_W,
  SPECIMEN_SLOT_H,
  SPECIMEN_SLOT_W,
  TOWN_CARD_H,
  TOWN_CARD_W,
  buildShelfState,
  previewSave,
  buildSpecimenShelfState,
  buildTownShelfState,
  hitTestSpecimenPage,
  hitTestTownRoom,
  hitTestTrophyPage,
  itemTitle,
  layoutSpecimenPage,
  layoutTownRoom,
  layoutTrophyPage,
  provenanceText,
  shortLocation,
  specimenCaptureText,
  specimenCatalog,
  specimenDetailState,
  specimenInfo,
  townCatalog,
  townDescription,
  townHint,
  townItemTitle,
  townStatus,
  trophyDescription,
  type PageLayout,
  type SectionLayout,
  type SlotRect,
  type SpecimenPageLayout,
  type SpecimenSectionLayout,
  type SpecimenShelfState,
  type SpecimenSlotRect,
  type SpecimenSlotState,
  type TownPageLayout,
  type TownShelfState,
  type TownSlotRect,
  type TownTrophySlotState,
  type TrophyRoomTab,
  type TrophyShelfState,
  type TrophySlotState,
} from './trophy-data';
import { fmt, plural, tr } from '../i18n';

export type TrophyReturnTarget = 'title' | 'workorders';

export type SelectedExhibit =
  | { readonly kind: 'souvenir'; readonly item: TrophySlotState }
  | { readonly kind: 'town'; readonly item: TownTrophySlotState }
  | { readonly kind: 'specimen'; readonly item: SpecimenSlotState };

const HEADER_BASE_H = 216;
const WING_BAR_H = 44;
const MODAL_X = 32;
const MODAL_Y = 156;
const MODAL_W = VIEW_W - MODAL_X * 2; // 476
const MODAL_H = 628;
const UNKNOWN_TAG = '???';

// v4 trophy swipe: browse the open exhibit's neighbours in the grid's reading order.
/** Movement (logical px) before a modal gesture picks an axis. */
export const SWIPE_SLOP = 12;
/** A swipe must be this much more horizontal than vertical: |dx| > ratio * |dy|. */
export const SWIPE_RATIO = 1.5;
/** Horizontal distance (logical px) that always counts as a swipe. */
export const SWIPE_MIN = 60;
/** A shorter flick still counts when the finger leaves this fast (logical px per s)... */
export const SWIPE_FLICK_SPEED = 700;
/** ...and has moved at least this far. */
export const SWIPE_FLICK_MIN = 24;
const SWIPE_FOLLOW = 0.45;
const SWIPE_FOLLOW_END = 0.15;
const SWIPE_FOLLOW_MAX = 110;
const NAV_OUT = 0.075;
const NAV_IN = 0.105;
const NAV_SLIDE = 120;
const BUMP_DUR = 0.22;
const BUMP_PX = 18;
const CHEVRON_W = 56;
const CHEVRON_H = 96;

/** One exhibit in a room's reading order (wing by wing, case by case, row by row). */
export interface ExhibitStop {
  readonly sel: SelectedExhibit;
  /** Wing (page) index for souvenirs and specimens; 0 for town. */
  readonly page: number;
  /** Slot rect in its page's list content space, for scrolling it into view. */
  readonly y: number;
  readonly h: number;
  /** "12 / 41", built once. */
  readonly counter: string;
}

export type ExhibitNav = Readonly<Record<TrophyRoomTab, readonly ExhibitStop[]>>;

/** Every slot of every room in the order the player reads the grid, found or not. */
export function buildExhibitNav(
  layouts: readonly PageLayout[],
  townLayout: TownPageLayout,
  specimenLayouts: readonly SpecimenPageLayout[],
): ExhibitNav {
  const souvenirs: Omit<ExhibitStop, 'counter'>[] = [];
  layouts.forEach((pl, page) => {
    for (const sec of pl.sections) for (const r of sec.slots) souvenirs.push({ sel: { kind: 'souvenir', item: r.slot }, page, y: r.y, h: r.h });
  });
  const town: Omit<ExhibitStop, 'counter'>[] = townLayout.slots.map((r) => ({ sel: { kind: 'town', item: r.slot }, page: 0, y: r.y, h: r.h }));
  const specimens: Omit<ExhibitStop, 'counter'>[] = [];
  specimenLayouts.forEach((pl, page) => {
    for (const sec of pl.sections) for (const r of sec.slots) specimens.push({ sel: { kind: 'specimen', item: r.slot }, page, y: r.y, h: r.h });
  });
  const count = (list: Omit<ExhibitStop, 'counter'>[]): readonly ExhibitStop[] =>
    list.map((st, i) => ({ ...st, counter: `${i + 1} / ${list.length}` }));
  return { souvenirs: count(souvenirs), town: count(town), specimens: count(specimens) };
}

/** What the detail modal reads to slide, fade and label itself. */
interface ModalNavLook {
  readonly cardShiftX: number;
  readonly cardFade: number;
  readonly counterText: string;
  readonly hasPrev: boolean;
  readonly hasNext: boolean;
}

export interface TrophiesDebug {
  readonly room: TrophyRoomTab;
  readonly foundCount: number;
  readonly totalCount: number;
  readonly townFoundCount: number;
  readonly townTotalCount: number;
  readonly specimensFound: number;
  readonly specimensTotal: number;
  readonly pageIndex: number;
  readonly pageCount: number;
  readonly selectedId: string | null;
  /** v4 trophy swipe: position of the open exhibit in its room's reading order (-1 when closed). */
  readonly exhibitIndex: number;
  readonly exhibitCount: number;
  setRoom(room: TrophyRoomTab): void;
  select(itemId: string): boolean;
  selectTown(id: MapCollectibleId): boolean;
  selectSpecimen(id: string): boolean;
  close(): void;
  scrollTo(y: number): void;
}

export class TrophiesScene implements Scene, ModalNavLook {
  t = 0;
  activeRoom: TrophyRoomTab = 'souvenirs';
  scroll = 0;
  private readonly scrollByRoom: Record<TrophyRoomTab, number> = { souvenirs: 0, town: 0, specimens: 0 };
  private vel = 0;
  private dragging = false;
  private tracking = false;
  private pressY = 0;
  private pressScroll = 0;
  private lastY = 0;
  private scrimArmed = false;

  readonly shelf: TrophyShelfState;
  readonly layouts: readonly PageLayout[];
  readonly townShelf: TownShelfState;
  readonly townLayout: TownPageLayout;
  readonly specimenShelf: SpecimenShelfState;
  readonly specimenLayouts: readonly SpecimenPageLayout[];
  readonly souvenirListTop: number;
  readonly townListTop = HEADER_BASE_H;
  readonly specimenListTop: number;
  pageIndex = 0;
  specimenPageIndex = 0;
  selected: SelectedExhibit | null = null;
  modalT = 0;
  modalY = MODAL_Y;
  modalH = MODAL_H;

  // v4 trophy swipe
  readonly nav: ExhibitNav;
  selectedIndex = -1;
  cardShiftX = 0;
  cardFade = 1;
  private swTracking = false;
  private swLock: 'none' | 'h' | 'v' = 'none';
  private swPressX = 0;
  private swPressY = 0;
  private swLastX = 0;
  private swVel = 0;
  private swipeX = 0;
  private navPhase: 'idle' | 'out' | 'in' = 'idle';
  private navT = 0;
  private navDir: 1 | -1 = 1;
  private navFrom = 0;
  private navTarget = -1;
  private bumpT = 0;
  private bumpDir: 1 | -1 = 1;

  readonly back = new Button(16, 16, 64, 58, '‹', 'ghost', 40);
  readonly tabSouvenirs = new Button(24, 88, 158, 48, '', 'primary', 14.5);
  readonly tabTown = new Button(191, 88, 158, 48, '', 'ghost', 14.5);
  readonly tabSpecimens = new Button(358, 88, 158, 48, '', 'ghost', 14.5);
  readonly prevWing = new Button(24, HEADER_BASE_H + 4, 88, 36, '‹', 'ghost', 26);
  readonly nextWing = new Button(VIEW_W - 24 - 88, HEADER_BASE_H + 4, 88, 36, '›', 'ghost', 26);
  /** Preprod only: preview every exhibit as found (display only, never saved). */
  readonly previewBtn = new Button(VIEW_W - 24 - 196, VIEW_H - 24 - 52, 196, 52, '', 'ghost', 16);
  readonly closeBtn = new Button(MODAL_X + (MODAL_W - 220) / 2, MODAL_Y + MODAL_H - 74, 220, 56, '', 'primary', 24);
  /** Previous / next exhibit chevrons on the modal's edges (the card is always centred on the screen). */
  readonly prevExhibit = new Button(0, (VIEW_H - CHEVRON_H) / 2, CHEVRON_W, CHEVRON_H, '', 'ghost');
  readonly nextExhibit = new Button(VIEW_W - CHEVRON_W, (VIEW_H - CHEVRON_H) / 2, CHEVRON_W, CHEVRON_H, '', 'ghost');

  /** Showing preprod's everything-found preview instead of the player's save. */
  readonly preview: boolean;
  readonly debug: TrophiesDebug;
  private readonly look = new ViewSlot(() => new TrophiesView(this));

  constructor(
    readonly shell: Shell,
    readonly returnTo: TrophyReturnTarget = 'title',
    view?: { preview: boolean; room: TrophyRoomTab },
  ) {
    this.preview = shell.preprod && view?.preview === true;
    const save = this.preview ? previewSave(shell.save) : shell.save;
    this.shelf = buildShelfState(save);
    this.layouts = this.shelf.pages.map((p) => layoutTrophyPage(p));
    this.townShelf = buildTownShelfState(save);
    this.townLayout = layoutTownRoom(this.townShelf);
    this.specimenShelf = buildSpecimenShelfState(save);
    this.specimenLayouts = this.specimenShelf.pages.map((p) => layoutSpecimenPage(p));
    this.souvenirListTop = this.shelf.pages.length > 1 ? HEADER_BASE_H + WING_BAR_H : HEADER_BASE_H;
    this.specimenListTop = this.specimenShelf.pages.length > 1 ? HEADER_BASE_H + WING_BAR_H : HEADER_BASE_H;
    this.nav = buildExhibitNav(this.layouts, this.townLayout, this.specimenLayouts);

    const strings = tr().trophies;
    this.tabSouvenirs.label = fmt(strings.tabSouvenirs, { n: this.shelf.foundCount, max: this.shelf.totalCount });
    this.tabTown.label = fmt(strings.tabTown, { n: this.townShelf.foundCount, max: this.townShelf.totalCount });
    this.tabSpecimens.label = fmt(strings.tabSpecimens, { n: this.specimenShelf.foundCount, max: this.specimenShelf.totalCount });
    this.closeBtn.label = strings.close;
    this.previewBtn.visible = shell.preprod;
    this.previewBtn.label = this.preview ? 'Preprod · my save' : 'Preprod · show all';
    this.previewBtn.kind = this.preview ? 'secondary' : 'ghost';
    if (view) this.switchRoom(view.room);
    this.syncTabStyles();

    const self = this;
    this.debug = {
      get room() { return self.activeRoom; },
      get foundCount() { return self.shelf.foundCount; },
      get totalCount() { return self.shelf.totalCount; },
      get townFoundCount() { return self.townShelf.foundCount; },
      get townTotalCount() { return self.townShelf.totalCount; },
      get specimensFound() { return self.specimenShelf.foundCount; },
      get specimensTotal() { return self.specimenShelf.totalCount; },
      get pageIndex() { return self.activeRoom === 'specimens' ? self.specimenPageIndex : self.pageIndex; },
      get pageCount() { return self.activeRoom === 'specimens' ? self.specimenShelf.pages.length : self.shelf.pages.length; },
      get selectedId() {
        if (!self.selected) return null;
        if (self.selected.kind === 'souvenir') return self.selected.item.slot.itemId;
        return self.selected.item.slot.id;
      },
      get exhibitIndex() { return self.selected ? self.selectedIndex : -1; },
      get exhibitCount() { return self.nav[self.activeRoom].length; },
      setRoom(room: TrophyRoomTab): void {
        self.switchRoom(room);
      },
      select(itemId: string): boolean {
        const i = self.nav.souvenirs.findIndex((st) => st.sel.kind === 'souvenir' && st.sel.item.slot.itemId === itemId);
        if (i < 0) return false;
        self.switchRoom('souvenirs');
        self.openStop(i, true);
        return true;
      },
      selectTown(id: MapCollectibleId): boolean {
        const i = self.nav.town.findIndex((st) => st.sel.kind === 'town' && st.sel.item.slot.id === id);
        if (i < 0) return false;
        self.switchRoom('town');
        self.openStop(i, true);
        return true;
      },
      selectSpecimen(id: string): boolean {
        const i = self.nav.specimens.findIndex((st) => st.sel.kind === 'specimen' && st.sel.item.slot.id === id);
        if (i < 0) return false;
        self.switchRoom('specimens');
        self.openStop(i, true);
        return true;
      },
      close(): void {
        self.closeModal();
      },
      scrollTo(y: number): void {
        self.scroll = clamp(y, 0, self.maxScroll);
        self.scrollByRoom[self.activeRoom] = self.scroll;
        self.vel = 0;
      },
    };
  }

  get listTop(): number {
    if (this.activeRoom === 'souvenirs') return this.souvenirListTop;
    if (this.activeRoom === 'specimens') return this.specimenListTop;
    return this.townListTop;
  }

  get currentLayout(): PageLayout {
    return this.layouts[this.pageIndex] ?? this.layouts[0]!;
  }

  get currentSpecimenLayout(): SpecimenPageLayout {
    return this.specimenLayouts[this.specimenPageIndex] ?? this.specimenLayouts[0]!;
  }

  private get maxScroll(): number {
    const contentHeight = this.activeRoom === 'souvenirs'
      ? this.currentLayout.contentHeight
      : this.activeRoom === 'specimens'
        ? this.currentSpecimenLayout.contentHeight
        : this.townLayout.contentHeight;
    return Math.max(0, contentHeight - (VIEW_H - this.listTop));
  }

  private syncTabStyles(): void {
    this.tabSouvenirs.kind = this.activeRoom === 'souvenirs' ? 'primary' : 'ghost';
    this.tabTown.kind = this.activeRoom === 'town' ? 'primary' : 'ghost';
    this.tabSpecimens.kind = this.activeRoom === 'specimens' ? 'primary' : 'ghost';
  }

  switchRoom(room: TrophyRoomTab): void {
    if (this.activeRoom === room) return;
    this.scrollByRoom[this.activeRoom] = this.scroll;
    this.activeRoom = room;
    this.scroll = clamp(this.scrollByRoom[room], 0, this.maxScroll);
    this.vel = 0;
    this.tracking = false;
    this.dragging = false;
    this.syncTabStyles();
  }

  private goBack(): void {
    if (this.returnTo === 'workorders') this.shell.toWorkOrders();
    else this.shell.toTitle();
  }

  setModalBox(y: number, h: number): void {
    this.modalY = y;
    this.modalH = h;
    this.closeBtn.y = y + h - 74;
  }

  private closeModal(): void {
    if (this.navPhase === 'out' && this.navTarget >= 0) this.showStop(this.navTarget);
    const stop = this.nav[this.activeRoom][this.selectedIndex];
    if (this.selected && stop) this.revealStop(stop);
    this.selected = null;
    this.selectedIndex = -1;
    this.modalT = 0;
    this.scrimArmed = false;
    this.closeBtn.cancel();
    this.prevExhibit.cancel();
    this.nextExhibit.cancel();
    this.resetSwipe();
  }

  // ------------------------------------------------------------ v4 trophy swipe

  get counterText(): string {
    return this.nav[this.activeRoom][this.selectedIndex]?.counter ?? '';
  }

  get hasPrev(): boolean {
    return this.selectedIndex > 0;
  }

  get hasNext(): boolean {
    return this.selectedIndex >= 0 && this.selectedIndex < this.nav[this.activeRoom].length - 1;
  }

  /** Opens the active room's exhibit `index` from the shelf (pops in unless `instant`). */
  openStop(index: number, instant: boolean): void {
    this.resetSwipe();
    this.showStop(index);
    this.modalT = instant || this.shell.ctx.reducedMotion ? 1 : 0;
  }

  private openHit(item: SelectedExhibit['item']): void {
    const stops = this.nav[this.activeRoom];
    for (let i = 0; i < stops.length; i++) {
      if (stops[i]!.sel.item === item) {
        this.openStop(i, false);
        this.shell.audio.sfx('click');
        return;
      }
    }
  }

  /** Shows exhibit `index` in the open modal and moves the shelf behind it to that wing. */
  private showStop(index: number): void {
    const stop = this.nav[this.activeRoom][index];
    if (!stop) return;
    this.selected = stop.sel;
    this.selectedIndex = index;
    if (this.activeRoom === 'souvenirs') this.pageIndex = stop.page;
    else if (this.activeRoom === 'specimens') this.specimenPageIndex = stop.page;
    this.revealStop(stop);
  }

  /** Scrolls the shelf so this exhibit's slot is on screen. */
  private revealStop(stop: ExhibitStop): void {
    const viewH = VIEW_H - this.listTop;
    let y = this.scroll;
    if (stop.y - 12 < y) y = stop.y - 12;
    else if (stop.y + stop.h + 12 > y + viewH) y = stop.y + stop.h + 12 - viewH;
    this.scroll = clamp(y, 0, this.maxScroll);
    this.scrollByRoom[this.activeRoom] = this.scroll;
    this.vel = 0;
  }

  private resetSwipe(): void {
    this.swTracking = false;
    this.swLock = 'none';
    this.swipeX = 0;
    this.navPhase = 'idle';
    this.navTarget = -1;
    this.bumpT = 0;
    this.cardShiftX = 0;
    this.cardFade = 1;
  }

  /** Previous (-1) or next (+1) exhibit. Returns false (and nudges the card) at either end. */
  step(dir: 1 | -1): boolean {
    if (!this.selected) return false;
    if (this.navPhase === 'out' && this.navTarget >= 0) this.showStop(this.navTarget);
    const reduced = this.shell.ctx.reducedMotion;
    const target = this.selectedIndex + dir;
    if (target < 0 || target >= this.nav[this.activeRoom].length) {
      this.navPhase = 'idle';
      this.navTarget = -1;
      if (!reduced) {
        this.bumpT = BUMP_DUR;
        this.bumpDir = dir;
      }
      return false;
    }
    this.bumpT = 0;
    if (reduced) {
      this.showStop(target);
      this.swipeX = 0;
      this.navPhase = 'idle';
      return true;
    }
    this.navFrom = this.navPhase === 'idle' ? this.swipeX : this.cardShiftX;
    this.swipeX = 0;
    this.navPhase = 'out';
    this.navT = 0;
    this.navDir = dir;
    this.navTarget = target;
    return true;
  }

  /** Reads the pointer while the modal is open. Returns true when a horizontal swipe used it. */
  private trackSwipe(p: PointerState, dt: number): boolean {
    if (p.pressed) {
      this.swTracking = true;
      this.swLock = 'none';
      this.swPressX = p.x;
      this.swPressY = p.y;
      this.swLastX = p.x;
      this.swVel = 0;
    }
    if (!this.swTracking) return false;
    const dx = p.x - this.swPressX;
    const dy = p.y - this.swPressY;
    // The lift-off frame repeats the last position, so it keeps the speed the finger had while moving
    if (dt > 0 && p.down && !p.pressed) this.swVel = this.swVel * 0.4 + ((p.x - this.swLastX) / dt) * 0.6;
    this.swLastX = p.x;
    if (this.swLock === 'none' && Math.max(Math.abs(dx), Math.abs(dy)) > SWIPE_SLOP) {
      this.swLock = Math.abs(dx) > SWIPE_RATIO * Math.abs(dy) ? 'h' : 'v';
    }
    if (this.swLock !== 'h') {
      if (p.released) this.swTracking = false;
      return false;
    }
    // A horizontal drag is never a tap: disarm Close, the chevrons and the scrim.
    this.closeBtn.cancel();
    this.prevExhibit.cancel();
    this.nextExhibit.cancel();
    this.scrimArmed = false;
    if (p.down && !this.shell.ctx.reducedMotion && this.navPhase === 'idle') {
      const open = dx < 0 ? this.hasNext : this.hasPrev;
      this.swipeX = clamp(dx * (open ? SWIPE_FOLLOW : SWIPE_FOLLOW_END), -SWIPE_FOLLOW_MAX, SWIPE_FOLLOW_MAX);
    }
    if (p.released) {
      this.swTracking = false;
      this.swLock = 'none';
      const ax = Math.abs(dx);
      const horizontal = ax > SWIPE_RATIO * Math.abs(dy);
      const flick = ax >= SWIPE_FLICK_MIN && Math.abs(this.swVel) >= SWIPE_FLICK_SPEED && Math.sign(this.swVel) === Math.sign(dx);
      if (horizontal && (ax >= SWIPE_MIN || flick)) {
        if (this.step(dx < 0 ? 1 : -1)) this.shell.audio.sfx('click');
      }
    }
    return true;
  }

  /** Advances the slide-out / slide-in, the snap back and the end-of-room nudge. */
  private animateSwipe(dt: number): void {
    if (this.navPhase === 'out') {
      this.navT += dt;
      const k = Math.min(1, this.navT / NAV_OUT);
      this.cardShiftX = this.navFrom + (-this.navDir * NAV_SLIDE - this.navFrom) * easeInCubic(k);
      this.cardFade = 1 - k;
      if (k >= 1) {
        this.showStop(this.navTarget);
        this.navTarget = -1;
        this.navPhase = 'in';
        this.navT = 0;
      }
    } else if (this.navPhase === 'in') {
      this.navT += dt;
      const k = Math.min(1, this.navT / NAV_IN);
      this.cardShiftX = this.navDir * NAV_SLIDE * (1 - easeOutCubic(k));
      this.cardFade = k;
      if (k >= 1) this.navPhase = 'idle';
    } else {
      if (!this.swTracking || this.swLock !== 'h') {
        this.swipeX *= Math.exp(-18 * dt);
        if (Math.abs(this.swipeX) < 0.5) this.swipeX = 0;
      }
      this.cardShiftX = this.swipeX;
      this.cardFade = 1;
    }
    if (this.bumpT > 0) {
      this.bumpT = Math.max(0, this.bumpT - dt);
      this.cardShiftX -= this.bumpDir * BUMP_PX * Math.sin(Math.PI * (1 - this.bumpT / BUMP_DUR));
    }
  }

  update(dt: number): void {
    this.t += dt;
    const p = this.shell.ctx.pointer;
    const audio = this.shell.audio;

    // Modal intercepts all input while open
    if (this.selected) {
      this.modalT = Math.min(1, this.modalT + dt * 4.5);
      const swiped = this.trackSwipe(p, dt);
      this.animateSwipe(dt);
      if (swiped) return;
      if (this.closeBtn.update(p, dt, audio)) {
        this.closeModal();
        return;
      }
      if (this.prevExhibit.update(p, dt, audio)) {
        this.scrimArmed = false;
        this.step(-1);
        return;
      }
      if (this.nextExhibit.update(p, dt, audio)) {
        this.scrimArmed = false;
        this.step(1);
        return;
      }
      const inCard = (p.x >= MODAL_X && p.x <= MODAL_X + MODAL_W && p.y >= this.modalY && p.y <= this.modalY + this.modalH)
        || this.prevExhibit.contains(p.x, p.y) || this.nextExhibit.contains(p.x, p.y);
      if (p.pressed && !inCard) this.scrimArmed = true;
      if (p.released) {
        if (this.scrimArmed && !inCard) {
          audio.sfx('click');
          this.closeModal();
        }
        this.scrimArmed = false;
      }
      return;
    }

    if (this.back.update(p, dt, audio)) return this.goBack();
    if (this.shell.preprod && this.previewBtn.update(p, dt, audio)) {
      this.shell.toTrophies(this.returnTo, { preview: !this.preview, room: this.activeRoom });
      return;
    }
    if (this.tabSouvenirs.update(p, dt, audio)) {
      this.switchRoom('souvenirs');
      return;
    }
    if (this.tabTown.update(p, dt, audio)) {
      this.switchRoom('town');
      return;
    }
    if (this.tabSpecimens.update(p, dt, audio)) {
      this.switchRoom('specimens');
      return;
    }

    const activePages = this.activeRoom === 'souvenirs'
      ? this.shelf.pages.length
      : this.activeRoom === 'specimens'
        ? this.specimenShelf.pages.length
        : 1;
    const showWings = activePages > 1;
    if (showWings) {
      const curIdx = this.activeRoom === 'specimens' ? this.specimenPageIndex : this.pageIndex;
      this.prevWing.visible = true;
      this.nextWing.visible = true;
      this.prevWing.enabled = curIdx > 0;
      this.nextWing.enabled = curIdx < activePages - 1;
      if (this.prevWing.update(p, dt, audio)) {
        if (this.activeRoom === 'specimens') this.specimenPageIndex = Math.max(0, this.specimenPageIndex - 1);
        else this.pageIndex = Math.max(0, this.pageIndex - 1);
        this.scroll = 0;
        this.vel = 0;
        return;
      }
      if (this.nextWing.update(p, dt, audio)) {
        if (this.activeRoom === 'specimens') this.specimenPageIndex = Math.min(activePages - 1, this.specimenPageIndex + 1);
        else this.pageIndex = Math.min(activePages - 1, this.pageIndex + 1);
        this.scroll = 0;
        this.vel = 0;
        return;
      }
    } else {
      this.prevWing.visible = false;
      this.nextWing.visible = false;
    }

    // Touch drag + momentum scroll over the active room's shelves
    const top = this.listTop;
    if (p.pressed && p.y >= top) {
      this.tracking = true;
      this.dragging = false;
      this.pressY = p.y;
      this.lastY = p.y;
      this.pressScroll = this.scroll;
      this.vel = 0;
    }
    if (this.tracking && p.down) {
      if (Math.abs(p.y - this.pressY) > 10) this.dragging = true;
      if (this.dragging) {
        this.scroll = this.pressScroll - (p.y - this.pressY);
        this.vel = dt > 0 ? (this.lastY - p.y) / dt : 0;
      }
      this.lastY = p.y;
    }
    if (this.tracking && p.released) {
      this.tracking = false;
      if (!this.dragging && p.y >= top) {
        const contentY = p.y + this.scroll - top;
        if (this.activeRoom === 'souvenirs') {
          const hit = hitTestTrophyPage(this.currentLayout, p.x, contentY);
          if (hit) this.openHit(hit);
        } else if (this.activeRoom === 'specimens') {
          const hit = hitTestSpecimenPage(this.currentSpecimenLayout, p.x, contentY);
          if (hit) this.openHit(hit);
        } else {
          const hit = hitTestTownRoom(this.townLayout, p.x, contentY);
          if (hit) this.openHit(hit);
        }
      }
      this.dragging = false;
    }
    if (!this.tracking) {
      this.scroll += this.vel * dt;
      this.vel *= Math.exp(-4.5 * dt);
      if (Math.abs(this.vel) < 5) this.vel = 0;
    }
    this.scroll += this.shell.input.wheelDy;
    const max = this.maxScroll;
    if (!this.tracking) {
      if (this.scroll < 0) this.scroll += (0 - this.scroll) * Math.min(1, dt * 12);
      if (this.scroll > max) this.scroll += (max - this.scroll) * Math.min(1, dt * 12);
    }
    this.scroll = clamp(this.scroll, -120, max + 120);
    this.scrollByRoom[this.activeRoom] = this.scroll;
  }

  get view(): Container {
    return this.look.get().root;
  }

  render(): void {
    this.look.peek()?.sync();
  }

  dispose(): void {
    this.look.destroy();
  }
}

// ---------------------------------------------------------------- retained Pixi view

const HDR_TITLE = { size: 34, color: C.mint, weight: 900, outline: C.ink } as const;
const HDR_SUB = { size: 15, color: C.muted, italic: true } as const;
const SUM_COUNT = { size: 21, color: C.mint, align: 'left', weight: 900 } as const;
const SUM_COMPLETE = { size: 21, color: C.amberHi, align: 'left', weight: 900 } as const;
const SUM_HINT = { size: 13, color: C.muted, align: 'right', weight: 600 } as const;
const SUM_HINT_GOLD = { size: 13, color: C.amberHi, align: 'right', weight: 800 } as const;
const CASE_TITLE = { size: 15, color: C.text, align: 'left', weight: 800 } as const;
const CASE_COUNT_DONE = { size: 13, color: C.mint, align: 'right', weight: 900 } as const;
const CASE_COUNT_OPEN = { size: 13, color: C.muted, align: 'right', weight: 800 } as const;
const SLOT_NAME = { size: 12.5, color: C.text, weight: 700, lineHeight: 15 } as const;
const SLOT_UNKNOWN = { size: 16, color: 'rgba(169,162,214,0.85)', weight: 900 } as const;
const SLOT_LOC = { size: 11, color: 'rgba(169,162,214,0.65)', weight: 600 } as const;
const SLOT_MULT = { size: 12, color: C.ink, weight: 900 } as const;
const WING_LABEL = { size: 16, color: C.text, weight: 800 } as const;

const TOWN_LOC_FOUND = { size: 13.5, color: C.mint, align: 'left', weight: 800 } as const;
const TOWN_LOC_MISS = { size: 13.5, color: C.muted, align: 'left', weight: 700 } as const;
const TOWN_NAME_FOUND = { size: 21, color: C.text, align: 'left', weight: 900 } as const;
const TOWN_NAME_MISS = { size: 21, color: 'rgba(169,162,214,0.85)', align: 'left', weight: 900 } as const;
const TOWN_STATUS = { size: 14, color: C.amberHi, align: 'left', italic: true, weight: 700 } as const;
const TOWN_HINT = { size: 13, color: 'rgba(169,162,214,0.75)', align: 'left', italic: true, weight: 600 } as const;

const SPEC_CARD_NAME = { size: 13.5, color: C.text, weight: 800, lineHeight: 15 } as const;
const SPEC_CARD_MISS = { size: 12, color: 'rgba(169,162,214,0.85)', weight: 700 } as const;
const SPEC_PROBED_PILL = { size: 11.5, color: '#fff6ec', weight: 900 } as const;
const SPEC_UNPROBED_PILL = { size: 11, color: C.mint, weight: 800 } as const;

class TrophiesView implements SceneView {
  readonly root = new Container();
  private readonly sky = new NightSky();
  private readonly listMask = new Shape();
  private readonly souvenirList = new Container();
  private readonly pages: PageView[] = [];
  private readonly townRoom: TownRoomView;
  private readonly specimenList = new Container();
  private readonly specimenPages: SpecimenPageView[] = [];
  private readonly headerBg = new Sprite(Texture.EMPTY);
  private readonly headerRule = new Graphics();
  private readonly subtitleLabel = new Label(HDR_SUB);
  private readonly souvenirSummary = new Container();
  private readonly townSummary = new Container();
  private readonly specimenSummary = new Container();
  private readonly back: ButtonView;
  private readonly previewBtn: ButtonView;
  private readonly tabSouvenirs: ButtonView;
  private readonly tabTown: ButtonView;
  private readonly tabSpecimens: ButtonView;
  private readonly prevWing: ButtonView;
  private readonly nextWing: ButtonView;
  private readonly wingLabel: Label | null;
  private readonly modal: DetailModalView;
  private lastPage = -1;
  private lastSpecPage = -1;
  private lastWingKey = '';
  private lastRoom: TrophyRoomTab | '' = '';

  constructor(private readonly s: TrophiesScene) {
    const { assets } = s.shell;
    const strings = tr().trophies;

    // Room 1 (Souvenirs) scrollable pages
    this.souvenirList.mask = this.listMask;
    for (let i = 0; i < s.layouts.length; i++) {
      const pv = new PageView(assets, s.layouts[i]!);
      pv.root.visible = i === s.pageIndex;
      this.pages.push(pv);
      this.souvenirList.addChild(pv.root);
    }

    // Room 2 (Field finds) scrollable display gallery
    this.townRoom = new TownRoomView(assets, s.townLayout);
    this.townRoom.root.mask = this.listMask;
    this.townRoom.root.visible = false;

    // Room 3 (Specimen Archive) scrollable dossier pages
    this.specimenList.mask = this.listMask;
    this.specimenList.visible = false;
    for (let i = 0; i < s.specimenLayouts.length; i++) {
      const spv = new SpecimenPageView(assets, s.specimenLayouts[i]!);
      spv.root.visible = i === s.specimenPageIndex;
      this.specimenPages.push(spv);
      this.specimenList.addChild(spv.root);
    }

    // Header gradient backdrop (stays above scrolling shelves)
    const maxHeaderH = Math.max(s.souvenirListTop, s.townListTop, s.specimenListTop);
    this.headerBg.texture = paintedTexture(`trophies|header|${maxHeaderH}`, 2, maxHeaderH - 2, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, maxHeaderH);
      grad.addColorStop(0, '#0d0924');
      grad.addColorStop(1, '#171038');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }, 1);
    this.headerBg.width = VIEW_W;
    this.headerRule.rect(0, 0, VIEW_W, 2).fill('rgba(124,255,203,0.28)');

    this.back = new ButtonView(s.back);
    this.previewBtn = new ButtonView(s.previewBtn);
    this.tabSouvenirs = new ButtonView(s.tabSouvenirs);
    this.tabTown = new ButtonView(s.tabTown);
    this.tabSpecimens = new ButtonView(s.tabSpecimens);
    this.prevWing = new ButtonView(s.prevWing);
    this.nextWing = new ButtonView(s.nextWing);

    // Summary panels (built once)
    this.buildSouvenirSummary();
    this.buildTownSummary();
    this.buildSpecimenSummary();

    this.root.addChild(
      this.sky,
      this.listMask,
      this.souvenirList,
      this.townRoom.root,
      this.specimenList,
      this.headerBg,
      this.headerRule,
      this.back,
      new Label(HDR_TITLE).set(strings.title, VIEW_W / 2 + 18, 40, VIEW_W - 140),
      this.subtitleLabel,
      this.tabSouvenirs,
      this.tabTown,
      this.tabSpecimens,
      this.souvenirSummary,
      this.townSummary,
      this.specimenSummary,
    );
    if (s.shell.preprod) this.root.addChild(this.previewBtn);

    if (s.shelf.pages.length > 1 || s.specimenShelf.pages.length > 1) {
      this.wingLabel = new Label(WING_LABEL);
      this.root.addChild(this.prevWing, this.nextWing, this.wingLabel);
    } else {
      this.wingLabel = null;
    }

    this.modal = new DetailModalView(assets, s.closeBtn, s.prevExhibit, s.nextExhibit, (y, h) => s.setModalBox(y, h));
    this.root.addChild(this.modal.root);
  }

  private buildSouvenirSummary(): void {
    const strings = tr().trophies;
    const { foundCount, totalCount, totalHauls } = this.s.shelf;
    const allFound = totalCount > 0 && foundCount >= totalCount;

    const panel = highlightedPanel(new Graphics(), 24, 146, VIEW_W - 48, 58, {
      fill: allFound ? '#22404a' : C.panel,
      r: 18,
      stroke: allFound ? C.amberHi : C.ink,
      lineW: 3,
      shadow: 4,
    });
    const cup = new Sprite(trophyCupTexture(32, allFound ? C.amberHi : C.mint));
    cup.anchor.set(0.5);
    cup.position.set(52, 175);

    const counterText = fmt(allFound ? strings.complete : strings.filed, { n: foundCount, max: totalCount });
    const counterLabel = new Label(allFound ? SUM_COMPLETE : SUM_COUNT).set(counterText, 76, 166, 224);

    const barX = 76;
    const barY = 183;
    const barW = 216;
    const barH = 10;
    const frac = totalCount > 0 ? Math.min(1, foundCount / totalCount) : 0;
    const bar = new Graphics();
    roundRect(bar, barX, barY, barW, barH, 5).fill('rgba(14,10,36,0.75)').stroke({ color: 'rgba(169,162,214,0.35)', width: 1.5 });
    if (frac > 0) {
      roundRect(bar, barX + 1, barY + 1, Math.max(8, (barW - 2) * frac), barH - 2, 4).fill(allFound ? C.amberHi : C.mint);
    }

    const rightHint = totalHauls > 0 ? plural(totalHauls, strings.hauled) : strings.emptyHint;
    const subHint = new Label(SUM_HINT).set(rightHint, VIEW_W - 40, 166, 178);
    const tapHint = new Label(SUM_HINT).set(strings.tapHint, VIEW_W - 40, 187, 178);

    this.souvenirSummary.addChild(panel, cup, counterLabel, bar, subHint, tapHint);
  }

  private buildTownSummary(): void {
    const townStr = tr().trophies.town;
    const { foundCount, totalCount } = this.s.townShelf;
    const allFound = totalCount > 0 && foundCount >= totalCount;

    const panel = highlightedPanel(new Graphics(), 24, 146, VIEW_W - 48, 58, {
      fill: allFound ? '#22404a' : C.panel,
      r: 18,
      stroke: allFound ? C.amberHi : C.ink,
      lineW: 3,
      shadow: 4,
    });
    const badge = new Sprite(fieldFindBadgeTexture(32, allFound ? C.amberHi : C.mint));
    badge.anchor.set(0.5);
    badge.position.set(52, 175);

    const counterText = fmt(allFound ? townStr.complete : townStr.logged, { n: foundCount, max: totalCount });
    const counterLabel = new Label(allFound ? SUM_COMPLETE : SUM_COUNT).set(counterText, 76, 166, 224);

    const barX = 76;
    const barY = 183;
    const barW = 216;
    const barH = 10;
    const frac = totalCount > 0 ? Math.min(1, foundCount / totalCount) : 0;
    const bar = new Graphics();
    roundRect(bar, barX, barY, barW, barH, 5).fill('rgba(14,10,36,0.75)').stroke({ color: 'rgba(169,162,214,0.35)', width: 1.5 });
    if (frac > 0) {
      roundRect(bar, barX + 1, barY + 1, Math.max(8, (barW - 2) * frac), barH - 2, 4).fill(allFound ? C.amberHi : C.mint);
    }

    const left = Math.max(0, totalCount - foundCount);
    const rightHint = allFound
      ? townStr.allLogged
      : foundCount === 0
        ? townStr.emptyHint
        : plural(left, townStr.remaining);
    const subHint = new Label(allFound ? SUM_HINT_GOLD : SUM_HINT).set(rightHint, VIEW_W - 40, 166, 184);
    const tapHint = new Label(SUM_HINT).set(townStr.tapHint, VIEW_W - 40, 187, 184);

    this.townSummary.addChild(panel, badge, counterLabel, bar, subHint, tapHint);
  }

  private buildSpecimenSummary(): void {
    const specStr = tr().trophies.specimens;
    const { foundCount, totalCount, probedCount, unprobedCount } = this.s.specimenShelf;
    const allFound = totalCount > 0 && foundCount >= totalCount;

    const panel = highlightedPanel(new Graphics(), 24, 146, VIEW_W - 48, 58, {
      fill: allFound ? '#22404a' : C.panel,
      r: 18,
      stroke: allFound ? C.amberHi : C.ink,
      lineW: 3,
      shadow: 4,
    });
    const badge = new Sprite(specimenBadgeTexture(32, allFound ? C.amberHi : C.mint));
    badge.anchor.set(0.5);
    badge.position.set(52, 175);

    const counterText = fmt(allFound ? specStr.complete : specStr.archived, { n: foundCount, max: totalCount });
    const counterLabel = new Label(allFound ? SUM_COMPLETE : SUM_COUNT).set(counterText, 76, 166, 224);

    const barX = 76;
    const barY = 183;
    const barW = 216;
    const barH = 10;
    const frac = totalCount > 0 ? Math.min(1, foundCount / totalCount) : 0;
    const bar = new Graphics();
    roundRect(bar, barX, barY, barW, barH, 5).fill('rgba(14,10,36,0.75)').stroke({ color: 'rgba(169,162,214,0.35)', width: 1.5 });
    if (frac > 0) {
      roundRect(bar, barX + 1, barY + 1, Math.max(8, (barW - 2) * frac), barH - 2, 4).fill(allFound ? C.amberHi : C.mint);
    }

    const rightHint = foundCount > 0
      ? fmt(specStr.probedSummary, { p: probedCount, u: unprobedCount })
      : specStr.emptyHint;
    const subHint = new Label(allFound ? SUM_HINT_GOLD : SUM_HINT).set(rightHint, VIEW_W - 40, 166, 184);
    const tapHint = new Label(SUM_HINT).set(specStr.tapHint, VIEW_W - 40, 187, 184);

    this.specimenSummary.addChild(panel, badge, counterLabel, bar, subHint, tapHint);
  }

  sync(): void {
    const s = this.s;
    const reduced = s.shell.ctx.reducedMotion;
    this.sky.sync(s.t, reduced);
    this.back.sync();
    this.previewBtn.sync();
    this.tabSouvenirs.sync();
    this.tabTown.sync();
    this.tabSpecimens.sync();

    if (this.lastRoom !== s.activeRoom) {
      this.lastRoom = s.activeRoom;
      const isSouvenirs = s.activeRoom === 'souvenirs';
      const isTown = s.activeRoom === 'town';
      const isSpecimens = s.activeRoom === 'specimens';
      const top = s.listTop;
      this.listMask.draw(top, (g) => g.rect(0, top - 4, VIEW_W, VIEW_H - top + 4).fill('#ffffff'));
      this.headerBg.height = top - 2;
      this.headerRule.y = top - 4;
      const strings = tr().trophies;
      const sub = isSouvenirs ? strings.subtitle : isTown ? strings.town.subtitle : strings.specimens.subtitle;
      this.subtitleLabel.set(sub, VIEW_W / 2 + 18, 70, VIEW_W - 140);
      this.souvenirSummary.visible = isSouvenirs;
      this.townSummary.visible = isTown;
      this.specimenSummary.visible = isSpecimens;
      this.souvenirList.visible = isSouvenirs;
      this.townRoom.root.visible = isTown;
      this.specimenList.visible = isSpecimens;
      if (this.wingLabel) {
        const hasWings = (isSouvenirs && s.shelf.pages.length > 1) || (isSpecimens && s.specimenShelf.pages.length > 1);
        this.wingLabel.visible = hasWings;
      }
    }

    if (this.wingLabel) {
      this.prevWing.sync();
      this.nextWing.sync();
      const totalWings = s.activeRoom === 'specimens' ? s.specimenShelf.pages.length : s.shelf.pages.length;
      const curWing = s.activeRoom === 'specimens' ? s.specimenPageIndex : s.pageIndex;
      const wk = `${s.activeRoom}|${curWing}|${totalWings}`;
      if (wk !== this.lastWingKey && totalWings > 1) {
        this.lastWingKey = wk;
        this.wingLabel.set(fmt(tr().trophies.wing, { n: curWing + 1, total: totalWings }), VIEW_W / 2, HEADER_BASE_H + 22, 240);
      }
    }

    if (this.lastPage !== s.pageIndex) {
      this.lastPage = s.pageIndex;
      for (let i = 0; i < this.pages.length; i++) this.pages[i]!.root.visible = i === s.pageIndex;
    }
    if (this.lastSpecPage !== s.specimenPageIndex) {
      this.lastSpecPage = s.specimenPageIndex;
      for (let i = 0; i < this.specimenPages.length; i++) this.specimenPages[i]!.root.visible = i === s.specimenPageIndex;
    }

    if (s.activeRoom === 'souvenirs') {
      this.souvenirList.y = s.listTop - s.scroll;
      this.pages[s.pageIndex]?.sync(this.souvenirList.y, s.listTop, s.t, reduced);
    } else if (s.activeRoom === 'specimens') {
      this.specimenList.y = s.listTop - s.scroll;
      this.specimenPages[s.specimenPageIndex]?.sync(this.specimenList.y, s.listTop, s.t, reduced);
    } else {
      this.townRoom.root.y = s.listTop - s.scroll;
      this.townRoom.sync(this.townRoom.root.y, s.listTop, s.t, reduced);
    }

    this.modal.sync(s.selected, s.modalT, s.t, reduced, s);
  }
}

// ---------------------------------------------------------------- Room 1 (Souvenirs) views

class PageView {
  readonly root = new Container();
  private readonly sections: CaseSectionView[];

  constructor(assets: Assets, layout: PageLayout) {
    this.sections = layout.sections.map((sec) => new CaseSectionView(assets, sec));
    for (const sec of this.sections) this.root.addChild(sec.root);
  }

  sync(listY: number, listTop: number, t: number, reduced: boolean): void {
    for (let i = 0; i < this.sections.length; i++) {
      const sec = this.sections[i]!;
      const top = sec.y + listY;
      const onScreen = top <= VIEW_H + 20 && top + sec.h >= listTop - 20;
      if (sec.root.visible !== onScreen) sec.root.visible = onScreen;
      if (onScreen) sec.sync(t, reduced);
    }
  }
}

class CaseSectionView {
  readonly root = new Container();
  readonly y: number;
  readonly h: number;

  constructor(assets: Assets, layout: SectionLayout) {
    this.y = layout.y;
    this.h = layout.h;
    this.root.position.set(layout.x, layout.y);

    const { section, foundCount, totalCount } = layout.section;
    const allFound = foundCount >= totalCount && totalCount > 0;
    const lvText = tr().levels[section.levelId];

    // Display cabinet frame
    const frame = highlightedPanel(new Graphics(), 0, 0, CASE_W, layout.h, {
      fill: '#20194b',
      r: 18,
      stroke: allFound ? 'rgba(124,255,203,0.45)' : C.ink,
      lineW: 3,
      shadow: 5,
    }, 0.12);

    // Header strip across top of cabinet
    const hdr = new Graphics();
    roundRect(hdr, 3, 3, CASE_W - 6, CASE_HDR_H - 4, 15).fill(allFound ? 'rgba(47,191,143,0.16)' : 'rgba(18,13,43,0.45)');
    hdr.rect(12, CASE_HDR_H - 2, CASE_W - 24, 1.5).fill(allFound ? 'rgba(124,255,203,0.35)' : 'rgba(169,162,214,0.18)');

    // Shelf ledge behind each row of slots
    const ledges = new Graphics();
    for (let r = 0; r < layout.rows; r++) {
      const ledgeY = CASE_HDR_H + r * (SLOT_H + 10) + 74;
      roundRect(ledges, 10, ledgeY, CASE_W - 20, 6, 3).fill('rgba(12,9,32,0.75)');
      ledges.rect(14, ledgeY, CASE_W - 28, 1.5).fill('rgba(169,162,214,0.16)');
    }

    const numTag = `#${formatOrderNumber(section.levelNum)}`;
    const heading = `${numTag} · ${lvText.location}`;
    const titleLabel = new Label(CASE_TITLE).set(heading, 16, CASE_HDR_H / 2 + 1, CASE_W - 92);
    const countLabel = new Label(allFound ? CASE_COUNT_DONE : CASE_COUNT_OPEN).set(`${foundCount}/${totalCount}`, CASE_W - 16, CASE_HDR_H / 2 + 1);

    this.root.addChild(frame, hdr, ledges, titleLabel, countLabel);

    const softGlow = glowTexture(GLOW.mint);
    for (const sr of layout.slots) {
      const lx = sr.x - layout.x;
      const ly = sr.y - layout.y;
      this.root.addChild(buildSlotCard(assets, softGlow, sr, lx, ly));
    }
  }

  sync(_t: number, _reduced: boolean): void {
    // Static shelves need zero per-frame work!
  }
}

function buildSlotCard(assets: Assets, softGlow: Texture, sr: SlotRect, lx: number, ly: number): Container {
  const card = new Container();
  card.position.set(lx, ly);
  const { slot, entry, found } = sr.slot;

  const box = new Graphics();
  if (found) {
    roundRect(box, 0, 0, SLOT_W, SLOT_H, 14)
      .fill('#182446')
      .stroke({ color: 'rgba(124,255,203,0.48)', width: 2 });
    // tiny top glass reflection
    box.moveTo(14, 4).lineTo(SLOT_W - 14, 4).stroke({ color: '#ffffff', alpha: 0.16, width: 1.5, cap: 'round' });
  } else {
    roundRect(box, 0, 0, SLOT_W, SLOT_H, 14)
      .fill('#141030')
      .stroke({ color: 'rgba(110,102,160,0.34)', width: 1.5 });
  }
  card.addChild(box);

  if (found) {
    const halo = new Glow(softGlow, false).place(SLOT_W / 2, 42, 50, 34, 0.18);
    card.addChild(halo);
  }

  // Exhibit sprite or crisp silhouette
  const fit = fitArtSize(slot.artW, slot.artH, 104, 54, 2.1);
  const tex = found
    ? trophyArtTexture(assets, slot.artKey, fit.w, fit.h)
    : trophySilhouetteTexture(assets, slot.artKey, fit.w, fit.h);
  const spr = new Sprite(tex);
  spr.anchor.set(0.5);
  spr.width = fit.w;
  spr.height = fit.h;
  spr.position.set(SLOT_W / 2, 42);
  if (!found) spr.alpha = 0.88;
  card.addChild(spr);

  if (found) {
    // Repeat count pill top-right if hauled more than once
    if (entry && entry.count > 1) {
      const badgeText = `×${entry.count}`;
      const bw = Math.max(30, badgeText.length * 9 + 12);
      const pill = roundRect(new Graphics(), SLOT_W - bw - 5, 5, bw, 19, 9)
        .fill(C.amberHi)
        .stroke({ color: C.ink, width: 1.8 });
      const pillLbl = new Label(SLOT_MULT).set(badgeText, SLOT_W - bw / 2 - 5, 15);
      card.addChild(pill, pillLbl);
    }

    // Exhibit name (up to 2 lines, squeezed if very long)
    const name = itemTitle(slot.itemId);
    const lines = wrapLines(name, SLOT_W - 14, SLOT_NAME.size, SLOT_NAME.weight);
    if (lines.length <= 1) {
      card.addChild(new Label(SLOT_NAME).set(name, SLOT_W / 2, 95, SLOT_W - 14));
    } else {
      const l1 = lines[0]!;
      const l2 = lines.slice(1).join(' ');
      card.addChild(
        new Label(SLOT_NAME).set(l1, SLOT_W / 2, 87, SLOT_W - 14),
        new Label(SLOT_NAME).set(l2, SLOT_W / 2, 103, SLOT_W - 14),
      );
    }
  } else {
    // Unfound: "???" + short town/level label
    card.addChild(
      new Label(SLOT_UNKNOWN).set(UNKNOWN_TAG, SLOT_W / 2, 86),
      new Label(SLOT_LOC).set(shortLocation(slot.levelId), SLOT_W / 2, 105, SLOT_W - 14),
    );
  }

  return card;
}

// ---------------------------------------------------------------- Room 2 (Field finds) views

class TownRoomView {
  readonly root = new Container();
  private readonly cards: TownSlotCardView[];

  constructor(assets: Assets, layout: TownPageLayout) {
    const softGlow = glowTexture(GLOW.mint);
    this.cards = layout.slots.map((sr) => new TownSlotCardView(assets, softGlow, sr));
    for (const card of this.cards) this.root.addChild(card.root);
  }

  sync(listY: number, listTop: number, t: number, reduced: boolean): void {
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]!;
      const top = card.y + listY;
      const onScreen = top <= VIEW_H + 20 && top + card.h >= listTop - 20;
      if (card.root.visible !== onScreen) card.root.visible = onScreen;
      if (onScreen) card.sync(t, reduced);
    }
  }
}

class TownSlotCardView {
  readonly root = new Container();
  readonly y: number;
  readonly h: number;
  private readonly figure: PickupFigureHandle | null = null;

  constructor(assets: Assets, softGlow: Texture, sr: TownSlotRect) {
    this.y = sr.y;
    this.h = sr.h;
    this.root.position.set(sr.x, sr.y);

    const { slot, found } = sr.slot;
    const lvText = tr().levels[slot.levelId];

    // Showcase plinth frame
    const frame = highlightedPanel(new Graphics(), 0, 0, TOWN_CARD_W, TOWN_CARD_H, {
      fill: found ? '#1d244e' : '#19143d',
      r: 18,
      stroke: found ? 'rgba(124,255,203,0.5)' : 'rgba(110,102,160,0.34)',
      lineW: found ? 2.5 : 2,
      shadow: 4,
    }, found ? 0.14 : 0.08);
    this.root.addChild(frame);

    // Left illuminated vitrine recess (114 × 94)
    const vit = new Graphics();
    roundRect(vit, 12, 12, 114, 94, 14)
      .fill(found ? '#131d3e' : '#120e2c')
      .stroke({ color: found ? 'rgba(124,255,203,0.38)' : 'rgba(110,102,160,0.28)', width: 1.8 });
    // Shelf ledge inside vitrine
    roundRect(vit, 24, 92, 90, 4, 2).fill('rgba(169,162,214,0.18)');
    this.root.addChild(vit);

    const artX = 69;
    const artY = 55;
    if (found) {
      this.root.addChild(new Glow(softGlow, false).place(artX, artY, 50, 40, 0.22));
      const scale = townPickupScale(slot.id, 94, 78, 1.0);
      this.figure = createTownPickupFigure(assets, slot.id, scale);
      this.figure.root.position.set(artX, artY);
      this.root.addChild(this.figure.root);
    } else {
      const fit = townPickupFitSize(slot.id, 90, 74, 1.0);
      const sil = new Sprite(townPickupSilhouetteTexture(assets, slot.id, fit.w, fit.h));
      sil.anchor.set(0.5);
      sil.width = fit.w;
      sil.height = fit.h;
      sil.position.set(artX, artY);
      sil.alpha = 0.88;
      this.root.addChild(sil);
    }

    // Right info column (x = 140 .. 476, width = 336)
    const textX = 140;
    const textW = TOWN_CARD_W - textX - 16;
    const locLine = `#${formatOrderNumber(slot.levelNum)} · ${lvText.location}`;
    this.root.addChild(new Label(found ? TOWN_LOC_FOUND : TOWN_LOC_MISS).set(locLine, textX, 25, textW));

    if (found) {
      this.root.addChild(
        new Label(TOWN_NAME_FOUND).set(townItemTitle(slot.id), textX, 55, textW),
        new Label(TOWN_STATUS).set(townStatus(slot.id), textX, 86, textW),
      );
    } else {
      this.root.addChild(new Label(TOWN_NAME_MISS).set(UNKNOWN_TAG, textX, 52, textW));
      const hint = townHint(slot.id);
      const lines = wrapLines(hint, textW, TOWN_HINT.size, TOWN_HINT.weight, true);
      if (lines.length <= 1) {
        this.root.addChild(new Label(TOWN_HINT).set(hint, textX, 84, textW));
      } else {
        const l1 = lines[0]!;
        const l2 = lines.slice(1).join(' ');
        this.root.addChild(
          new Label(TOWN_HINT).set(l1, textX, 78, textW),
          new Label(TOWN_HINT).set(l2, textX, 96, textW),
        );
      }
    }
  }

  sync(t: number, reduced: boolean): void {
    this.figure?.sync(t, reduced);
  }
}

// ---------------------------------------------------------------- Room 3 (Specimen Archive) views

class SpecimenPageView {
  readonly root = new Container();
  private readonly sections: SpecimenSectionView[];

  constructor(assets: Assets, layout: SpecimenPageLayout) {
    this.sections = layout.sections.map((sec) => new SpecimenSectionView(assets, sec));
    for (const sec of this.sections) this.root.addChild(sec.root);
  }

  sync(listY: number, listTop: number, t: number, reduced: boolean): void {
    for (let i = 0; i < this.sections.length; i++) {
      const sec = this.sections[i]!;
      const top = sec.y + listY;
      const onScreen = top <= VIEW_H + 20 && top + sec.h >= listTop - 20;
      if (sec.root.visible !== onScreen) sec.root.visible = onScreen;
      if (onScreen) sec.sync(t, reduced);
    }
  }
}

class SpecimenSectionView {
  readonly root = new Container();
  readonly y: number;
  readonly h: number;
  private readonly cards: SpecimenCardView[];

  constructor(assets: Assets, layout: SpecimenSectionLayout) {
    this.y = layout.y;
    this.h = layout.h;
    this.root.position.set(layout.x, layout.y);

    const { section, foundCount, totalCount } = layout.section;
    const allFound = foundCount >= totalCount && totalCount > 0;
    const lvText = tr().levels[section.levelId];

    const frame = highlightedPanel(new Graphics(), 0, 0, CASE_W, layout.h, {
      fill: '#20194b',
      r: 18,
      stroke: allFound ? 'rgba(124,255,203,0.45)' : C.ink,
      lineW: 3,
      shadow: 5,
    }, 0.12);

    const hdr = new Graphics();
    roundRect(hdr, 3, 3, CASE_W - 6, CASE_HDR_H - 4, 15).fill(allFound ? 'rgba(47,191,143,0.16)' : 'rgba(18,13,43,0.45)');
    hdr.rect(12, CASE_HDR_H - 2, CASE_W - 24, 1.5).fill(allFound ? 'rgba(124,255,203,0.35)' : 'rgba(169,162,214,0.18)');

    const numTag = `#${formatOrderNumber(section.levelNum)}`;
    const heading = `${numTag} · ${lvText.location}`;
    const titleLabel = new Label(CASE_TITLE).set(heading, 16, CASE_HDR_H / 2 + 1, CASE_W - 92);
    const countLabel = new Label(allFound ? CASE_COUNT_DONE : CASE_COUNT_OPEN).set(`${foundCount}/${totalCount}`, CASE_W - 16, CASE_HDR_H / 2 + 1);

    this.root.addChild(frame, hdr, titleLabel, countLabel);

    const softGlow = glowTexture(GLOW.mint);
    this.cards = layout.slots.map((sr) => {
      const card = new SpecimenCardView(assets, softGlow, sr, sr.x - layout.x, sr.y - layout.y);
      this.root.addChild(card.root);
      return card;
    });
  }

  sync(t: number, reduced: boolean): void {
    for (let i = 0; i < this.cards.length; i++) this.cards[i]!.sync(t, reduced);
  }
}

class SpecimenCardView {
  readonly root = new Container();
  private readonly figure: SpecimenFigure | null = null;

  constructor(assets: Assets, softGlow: Texture, sr: SpecimenSlotRect, lx: number, ly: number) {
    this.root.position.set(lx, ly);
    const { slot, entry, found } = sr.slot;
    const specStr = tr().trophies.specimens;

    const box = new Graphics();
    if (found) {
      roundRect(box, 0, 0, SPECIMEN_SLOT_W, SPECIMEN_SLOT_H, 14)
        .fill('#182446')
        .stroke({ color: entry?.probed ? 'rgba(255,116,134,0.55)' : 'rgba(124,255,203,0.48)', width: 2 });
      box.moveTo(14, 4).lineTo(SPECIMEN_SLOT_W - 14, 4).stroke({ color: '#ffffff', alpha: 0.16, width: 1.5, cap: 'round' });
    } else {
      roundRect(box, 0, 0, SPECIMEN_SLOT_W, SPECIMEN_SLOT_H, 14)
        .fill('#141030')
        .stroke({ color: 'rgba(110,102,160,0.34)', width: 1.5 });
    }
    // Portrait vitrine recess inside card
    roundRect(box, 8, 8, SPECIMEN_SLOT_W - 16, 74, 10)
      .fill(found ? '#121a38' : '#100c26')
      .stroke({ color: found ? 'rgba(124,255,203,0.28)' : 'rgba(110,102,160,0.22)', width: 1.4 });
    this.root.addChild(box);

    const artX = SPECIMEN_SLOT_W / 2;
    const artY = 45;
    if (found) {
      this.root.addChild(new Glow(softGlow, false).place(artX, artY, 48, 34, 0.18));
      const scale = specimenFitScale(slot.id, 114, 66, 0.72);
      this.figure = new SpecimenFigure(assets, slot.id, scale);
      this.figure.root.position.set(artX, artY + (slot.id === 'bubbles' ? 2 : 0));
      this.root.addChild(this.figure.root);
    } else {
      const fit = specimenFitSize(slot.id, 110, 64, 0.72);
      const sil = new Sprite(specimenSilhouetteTexture(assets, slot.id, fit.w, fit.h));
      sil.anchor.set(0.5);
      sil.width = fit.w;
      sil.height = fit.h;
      sil.position.set(artX, artY);
      sil.alpha = 0.88;
      this.root.addChild(sil);
    }

    if (found && entry) {
      if (entry.count > 1) {
        const badgeText = `×${entry.count}`;
        const bw = Math.max(30, badgeText.length * 9 + 12);
        const pill = roundRect(new Graphics(), SPECIMEN_SLOT_W - bw - 5, 5, bw, 19, 9.5)
          .fill(C.amberHi)
          .stroke({ color: C.ink, width: 1.8 });
        const pillLbl = new Label(SLOT_MULT).set(badgeText, SPECIMEN_SLOT_W - bw / 2 - 5, 15);
        this.root.addChild(pill, pillLbl);
      }

      const info = specimenInfo(slot.id);
      this.root.addChild(new Label(SPEC_CARD_NAME).set(info.name, SPECIMEN_SLOT_W / 2, 100, SPECIMEN_SLOT_W - 14));

      // Probed vs Unprobed stamp pill
      const pillG = new Graphics();
      const py = 120;
      const ph = 22;
      if (entry.probed) {
        roundRect(pillG, 14, py, SPECIMEN_SLOT_W - 28, ph, 11)
          .fill('#c83249')
          .stroke({ color: C.ink, width: 1.8 });
        this.root.addChild(pillG, new Label(SPEC_PROBED_PILL).set(specStr.cardProbed, SPECIMEN_SLOT_W / 2, py + ph / 2 + 0.5, SPECIMEN_SLOT_W - 36));
      } else {
        roundRect(pillG, 14, py, SPECIMEN_SLOT_W - 28, ph, 11)
          .fill('rgba(124,255,203,0.14)')
          .stroke({ color: 'rgba(124,255,203,0.62)', width: 1.5 });
        this.root.addChild(pillG, new Label(SPEC_UNPROBED_PILL).set(specStr.cardUnprobed, SPECIMEN_SLOT_W / 2, py + ph / 2 + 0.5, SPECIMEN_SLOT_W - 36));
      }
    } else {
      // Uncollected: "Not yet collected" + level location
      this.root.addChild(
        new Label(SPEC_CARD_MISS).set(specStr.notCollected, SPECIMEN_SLOT_W / 2, 102, SPECIMEN_SLOT_W - 14),
        new Label(SLOT_LOC).set(`#${formatOrderNumber(slot.levelNum)} · ${shortLocation(slot.levelId)}`, SPECIMEN_SLOT_W / 2, 128, SPECIMEN_SLOT_W - 14),
      );
    }
  }

  sync(t: number, reduced: boolean): void {
    this.figure?.sync(t, reduced);
  }
}

// ---------------------------------------------------------------- Exhibit Tag detail modal

const TAG_BADGE_FOUND = { size: 13, color: C.ink, weight: 900 } as const;
const TAG_BADGE_MISS = { size: 13, color: C.amberHi, weight: 900 } as const;
const TAG_LOC = { size: 13, color: C.muted, align: 'right', weight: 700 } as const;
const MODAL_TITLE = { size: 26, color: C.text, weight: 900, outline: C.ink } as const;
const MODAL_DESC = { size: 17, color: '#e6e0ff', italic: true, weight: 500, lineHeight: 23 } as const;
const MODAL_SPEC_DESC = { size: 15.5, color: '#e6e0ff', italic: true, weight: 500, lineHeight: 20 } as const;
const ADDENDUM_HDR_3 = { size: 11.5, color: C.amberHi, align: 'left', weight: 900 } as const;
const ADDENDUM_HDR_10 = { size: 11.5, color: '#ff8ea0', align: 'left', weight: 900 } as const;
const ADDENDUM_BODY = { size: 14.5, color: '#e6e0ff', align: 'left', weight: 500, lineHeight: 19 } as const;
const ABDUCTED_PILL_TXT = { size: 12.5, color: C.amberHi, weight: 900 } as const;
const PROV_KEY = { size: 14, color: C.muted, align: 'left', weight: 700 } as const;
const PROV_VAL = { size: 15, color: C.mint, align: 'right', weight: 800 } as const;
const PROV_VAL_WARN = { size: 14.5, color: C.amberHi, align: 'right', weight: 700 } as const;
const STAT_KEY = { size: 11, color: C.muted, weight: 800 } as const;
const STAT_VAL = { size: 15, color: C.text, weight: 800 } as const;
const STAT_VAL_MISS = { size: 15, color: 'rgba(169,162,214,0.55)', weight: 700 } as const;
const PROBE_STAMP_TXT = { size: 15.5, color: '#ff7086', weight: 900 } as const;
const PROBE_TAG_RED = { size: 12.5, color: '#fff6ec', weight: 900 } as const;
const PROBE_TAG_MINT = { size: 12, color: C.mint, weight: 800 } as const;
const PROBE_NOTE_RED = { size: 13.5, color: '#ffb3bf', align: 'left', italic: true, weight: 600 } as const;
const PROBE_NOTE_MINT = { size: 13.5, color: '#b7f5de', align: 'left', italic: true, weight: 600 } as const;
const NAV_COUNTER = { size: 15, color: C.muted, weight: 800 } as const;
const NAV_CHEVRON = { size: 34, color: C.mint, weight: 900 } as const;
/** Centre of the free corner right of the 220-wide Close button (card-local x 348..476). */
const NAV_COUNTER_X = MODAL_W - (MODAL_W - 220) / 4;

/** v4 trophy swipe: a ‹ or › tab on the modal's edge, dimmed at the end of the room. */
class ExhibitChevron {
  readonly root = new Container();

  constructor(private readonly b: Button, glyph: string, cx: number) {
    const pill = new Graphics();
    roundRect(pill, -17, -32, 34, 64, 17)
      .fill('rgba(18,13,46,0.94)')
      .stroke({ color: 'rgba(124,255,203,0.6)', width: 2 });
    this.root.addChild(pill, new Label(NAV_CHEVRON).set(glyph, 0, -3));
    this.root.position.set(cx, VIEW_H / 2);
  }

  sync(alpha: number, open: boolean): void {
    this.root.alpha = alpha * (open ? 1 : 0.3);
    this.root.scale.set(this.b.pressedDown && open ? 0.9 : 1);
  }
}

type ModalMode = 'souvenir' | 'town' | 'specimen';

class DetailModalView {
  readonly root = new Container();
  private readonly card = new Container();
  private readonly cardFrame = new Shape();
  private readonly badgeBg = new Shape();
  private readonly badgeLabel = new Label(TAG_BADGE_FOUND);
  private readonly locLabel = new Label(TAG_LOC);
  private readonly vitrine = new Shape();
  private readonly stageGlow = new Glow(glowTexture(GLOW.mint), false);
  private readonly artSprite = new Sprite(Texture.EMPTY);
  private readonly townStage = new Container();
  private readonly townFigures = new Map<MapCollectibleId, PickupFigureHandle>();
  private activeTownFig: PickupFigureHandle | null = null;
  private readonly specimenStage = new Container();
  private readonly specimenFigures = new Map<string, SpecimenFigure>();
  private activeSpecimenFig: SpecimenFigure | null = null;
  private readonly probeStamp = new Container();
  private readonly probeStampLabel = new Label(PROBE_STAMP_TXT);
  private readonly titleLabel = new Label(MODAL_TITLE);
  private readonly statsGroup = new Container();
  private readonly ageKey = new Label(STAT_KEY);
  private readonly ageVal = new Label(STAT_VAL);
  private readonly heightKey = new Label(STAT_KEY);
  private readonly heightVal = new Label(STAT_VAL);
  private readonly weightKey = new Label(STAT_KEY);
  private readonly weightVal = new Label(STAT_VAL);
  private readonly descPara = new Paragraph(MODAL_DESC);
  private readonly specDescPara = new Paragraph(MODAL_SPEC_DESC);
  private readonly addendum3Bg = new Shape();
  private readonly addendum3Title = new Label(ADDENDUM_HDR_3);
  private readonly addendum3Para = new Paragraph(ADDENDUM_BODY);
  private readonly addendum10Bg = new Shape();
  private readonly addendum10Title = new Label(ADDENDUM_HDR_10);
  private readonly addendum10Para = new Paragraph(ADDENDUM_BODY);
  private readonly divider = new Shape();
  private readonly provBox = new Shape();
  private readonly probeBadgeBg = new Shape();
  private readonly probeBadgeLabel = new Label(PROBE_TAG_RED);
  private readonly abductedBadgeBg = new Shape();
  private readonly abductedBadgeLabel = new Label(ABDUCTED_PILL_TXT);
  private readonly probeNoteLabel = new Label(PROBE_NOTE_RED);
  private readonly row1Key = new Label(PROV_KEY);
  private readonly row1Val = new Label(PROV_VAL);
  private readonly row2Key = new Label(PROV_KEY);
  private readonly row2Val = new Label(PROV_VAL);
  private readonly postcards = new Paragraph({ size: 16, lineHeight: 22, color: C.text, weight: 650 });
  private readonly row3Key = new Label(PROV_KEY);
  private readonly row3Val = new Label(PROV_VAL);
  private readonly closeView: ButtonView;
  private readonly counterLabel = new Label(NAV_COUNTER);
  private readonly prevChevron: ExhibitChevron;
  private readonly nextChevron: ExhibitChevron;
  private shownCounter = '';

  private shownKey = '';
  private artBaseY = 128;
  private curModalH = MODAL_H;

  constructor(
    private readonly assets: Assets,
    closeBtn: Button,
    prevBtn: Button,
    nextBtn: Button,
    private readonly onResize: (y: number, h: number) => void,
  ) {
    this.root.visible = false;

    const scrim = new Graphics().rect(0, 0, VIEW_W, VIEW_H).fill('rgba(8,5,24,0.8)');

    // Card pivot at its centre so easeOutBack pop scales symmetrically
    this.card.pivot.set(MODAL_W / 2, MODAL_H / 2);
    this.card.position.set(MODAL_X + MODAL_W / 2, MODAL_Y + MODAL_H / 2);

    this.stageGlow.place(MODAL_W / 2, 128, 92, 60, 0.25);
    this.artSprite.anchor.set(0.5);
    this.artSprite.position.set(MODAL_W / 2, this.artBaseY);

    // Pre-build one animated PickupFigure per town pickup so sync() allocates zero display objects
    this.townStage.position.set(MODAL_W / 2, 134);
    this.townStage.visible = false;
    for (const slot of townCatalog()) {
      const scale = townPickupScale(slot.id, 210, 134, 1.55);
      const fig = createTownPickupFigure(assets, slot.id, scale);
      fig.root.visible = false;
      this.townFigures.set(slot.id, fig);
      this.townStage.addChild(fig.root);
    }

    // Pre-build one animated SpecimenFigure per catalogued specimen so sync() allocates zero display objects
    this.specimenStage.position.set(MODAL_W / 2, 118);
    this.specimenStage.visible = false;
    for (const sec of specimenCatalog()) {
      for (const slot of sec.slots) {
        const scale = specimenFitScale(slot.id, 174, 108, 1.05);
        const fig = new SpecimenFigure(assets, slot.id, scale);
        fig.root.visible = false;
        this.specimenFigures.set(slot.id, fig);
        this.specimenStage.addChild(fig.root);
      }
    }

    // Tilted Bureau rubber stamp beside the vitrine for probed specimens
    const stampBox = new Graphics();
    roundRect(stampBox, -52, -17, 104, 34, 6)
      .fill('rgba(200,40,65,0.16)')
      .stroke({ color: '#ff5d73', width: 2.6 });
    roundRect(stampBox, -47, -12, 94, 24, 4).stroke({ color: 'rgba(255,112,134,0.55)', width: 1.2 });
    this.probeStampLabel.set(tr().trophies.specimens.probedStamp, 0, 1, 90);
    this.probeStamp.addChild(stampBox, this.probeStampLabel);
    this.probeStamp.position.set(MODAL_W - 64, 106);
    this.probeStamp.rotation = -0.16;
    this.probeStamp.visible = false;

    // 3-cell vital stats strip for Specimen Archive detail view (x = 24, y = 224, w = 428, h = 48)
    const statsBg = new Graphics();
    roundRect(statsBg, 24, 224, MODAL_W - 48, 48, 14)
      .fill('#151034')
      .stroke({ color: 'rgba(169,162,214,0.28)', width: 1.8 });
    statsBg.rect(144, 232, 1.5, 32).rect(304, 232, 1.5, 32).fill('rgba(169,162,214,0.22)');
    this.statsGroup.addChild(statsBg, this.ageKey, this.ageVal, this.heightKey, this.heightVal, this.weightKey, this.weightVal);
    this.statsGroup.visible = false;

    this.specDescPara.visible = false;
    this.addendum3Bg.visible = false;
    this.addendum3Title.visible = false;
    this.addendum3Para.visible = false;
    this.addendum10Bg.visible = false;
    this.addendum10Title.visible = false;
    this.addendum10Para.visible = false;
    this.probeBadgeBg.visible = false;
    this.probeBadgeLabel.visible = false;
    this.abductedBadgeBg.visible = false;
    this.abductedBadgeLabel.visible = false;
    this.probeNoteLabel.visible = false;

    this.closeView = new ButtonView(closeBtn);
    // closeBtn uses screen-space coords; shift into card-local space
    this.closeView.position.set(-MODAL_X, -MODAL_Y);

    this.card.addChild(
      this.cardFrame,
      this.badgeBg,
      this.badgeLabel,
      this.locLabel,
      this.vitrine,
      this.stageGlow,
      this.artSprite,
      this.townStage,
      this.specimenStage,
      this.probeStamp,
      this.titleLabel,
      this.statsGroup,
      this.descPara,
      this.specDescPara,
      this.addendum3Bg,
      this.addendum3Title,
      this.addendum3Para,
      this.addendum10Bg,
      this.addendum10Title,
      this.addendum10Para,
      this.divider,
      this.provBox,
      this.probeBadgeBg,
      this.probeBadgeLabel,
      this.abductedBadgeBg,
      this.abductedBadgeLabel,
      this.probeNoteLabel,
      this.row1Key,
      this.row1Val,
      this.row2Key,
      this.row2Val,
      this.postcards,
      this.row3Key,
      this.row3Val,
      this.closeView,
      this.counterLabel,
    );

    // Chevrons stay put on the card's edges while the card slides (the card is always centred on screen)
    this.prevChevron = new ExhibitChevron(prevBtn, '‹', MODAL_X);
    this.nextChevron = new ExhibitChevron(nextBtn, '›', MODAL_X + MODAL_W);

    this.root.addChild(scrim, this.card, this.prevChevron.root, this.nextChevron.root);
  }

  private applyModalHeight(h: number): void {
    const clampedH = Math.min(VIEW_H - 32, Math.max(MODAL_H, Math.ceil(h)));
    const my = Math.round((VIEW_H - clampedH) / 2);
    this.curModalH = clampedH;
    this.card.pivot.set(MODAL_W / 2, clampedH / 2);
    this.card.position.set(MODAL_X + MODAL_W / 2, my + clampedH / 2);
    this.onResize(my, clampedH);
    this.closeView.position.set(-MODAL_X, -my);
    // Counter in the free corner right of Close, on the Close button's centre line
    this.counterLabel.position.y = clampedH - 46;
    this.shownCounter = '';
  }

  private drawModalChrome(
    found: boolean,
    mode: ModalMode,
    divY: number,
    provY: number,
    provH: number,
    innerRuleY = 0,
  ): void {
    const modeNum = mode === 'souvenir' ? 0 : mode === 'town' ? 1 : 2;
    this.cardFrame.draw(keyOf(Number(found), this.curModalH), (g) => {
      highlightedPanel(g, 0, 0, MODAL_W, this.curModalH, {
        fill: C.panel,
        r: 24,
        stroke: found ? C.mint : C.muted,
        lineW: 4,
        shadow: 10,
      }, 0.16);
    });

    this.vitrine.draw(keyOf(modeNum), (g) => {
      if (mode === 'town') {
        roundRect(g, 96, 56, 284, 166, 18)
          .fill('#131130')
          .stroke({ color: 'rgba(124,255,203,0.38)', width: 2 });
        roundRect(g, 126, 204, 224, 6, 3).fill('rgba(169,162,214,0.22)');
      } else if (mode === 'specimen') {
        roundRect(g, 128, 54, 220, 128, 18)
          .fill('#131130')
          .stroke({ color: 'rgba(124,255,203,0.38)', width: 2 });
        roundRect(g, 154, 166, 168, 5, 2.5).fill('rgba(169,162,214,0.22)');
      } else {
        roundRect(g, 118, 58, 240, 140, 18)
          .fill('#131130')
          .stroke({ color: 'rgba(124,255,203,0.38)', width: 2 });
        roundRect(g, 142, 174, 192, 6, 3).fill('rgba(169,162,214,0.22)');
      }
    });

    this.divider.draw(keyOf(divY), (g) => {
      g.rect(28, divY, MODAL_W - 56, 2).fill('rgba(169,162,214,0.2)');
    });

    this.provBox.draw(keyOf(provY, provH, innerRuleY), (g) => {
      roundRect(g, 24, provY, MODAL_W - 48, provH, 16)
        .fill(C.night2)
        .stroke({ color: 'rgba(169,162,214,0.24)', width: 2 });
      if (innerRuleY > 0) {
        g.rect(38, innerRuleY, MODAL_W - 76, 1.5).fill('rgba(169,162,214,0.18)');
      }
    });
  }

  private setSpecimenOnlyVisible(on: boolean): void {
    this.statsGroup.visible = on;
    this.specDescPara.visible = on;
    this.descPara.visible = !on;
    if (!on) {
      this.specimenStage.visible = false;
      this.activeSpecimenFig = null;
      this.probeStamp.visible = false;
      this.addendum3Bg.visible = false;
      this.addendum3Title.visible = false;
      this.addendum3Para.visible = false;
      this.addendum10Bg.visible = false;
      this.addendum10Title.visible = false;
      this.addendum10Para.visible = false;
      this.probeBadgeBg.visible = false;
      this.probeBadgeLabel.visible = false;
      this.abductedBadgeBg.visible = false;
      this.abductedBadgeLabel.visible = false;
      this.probeNoteLabel.visible = false;
    }
  }

  private populateSouvenir(item: TrophySlotState): void {
    const { slot, entry, found } = item;
    const strings = tr().trophies;
    const lvText = tr().levels[slot.levelId];

    this.applyModalHeight(MODAL_H);
    this.postcards.visible = false;
    this.drawModalChrome(found, 'souvenir', 374, 390, 138);
    this.setSpecimenOnlyVisible(false);
    this.townStage.visible = false;
    this.activeTownFig = null;
    this.artSprite.visible = true;
    this.artBaseY = 128;

    // Top-left badge
    const badgeText = found
      ? fmt(strings.exhibitNo, { num: String(slot.index).padStart(2, '0') })
      : strings.unfiledBadge;
    const bw = found ? 136 : 168;
    this.badgeBg.draw(keyOf(Number(found), bw), (g) => {
      if (found) roundRect(g, 24, 18, bw, 28, 14).fill(C.mint).stroke({ color: C.ink, width: 2 });
      else roundRect(g, 24, 18, bw, 28, 14).fill('rgba(255,179,71,0.16)').stroke({ color: C.amber, width: 1.8 });
    });
    this.badgeLabel.restyle(found ? TAG_BADGE_FOUND : TAG_BADGE_MISS).set(badgeText, 24 + bw / 2, 33, bw - 12);
    this.locLabel.set(`#${formatOrderNumber(slot.levelNum)} · ${lvText.location}`, MODAL_W - 24, 33, MODAL_W - bw - 60);

    // Exhibit art (reusing cached Texture — zero display-object allocations)
    const clockFlyer = found && slot.artKey === 'room/clock_flyer';
    const fit = fitArtSize(slot.artW, slot.artH, 168, clockFlyer ? 122 : 94, 3.0);
    const tex = !found
      ? trophySilhouetteTexture(this.assets, slot.artKey, fit.w, fit.h)
      : clockFlyer ? clockFlyerDetailTexture(this.assets, fit.w, fit.h)
        : trophyArtTexture(this.assets, slot.artKey, fit.w, fit.h);
    this.artSprite.texture = tex;
    this.artSprite.width = fit.w;
    this.artSprite.height = fit.h;
    this.artSprite.position.set(MODAL_W / 2, this.artBaseY);
    this.artSprite.alpha = found ? 1 : 0.85;
    this.stageGlow.place(MODAL_W / 2, 128, 92, 60, found ? 0.28 : 0.06);

    // Title & catchy catalogue description
    const title = found ? itemTitle(slot.itemId) : UNKNOWN_TAG;
    this.titleLabel.set(title, MODAL_W / 2, 224, MODAL_W - 48);

    const desc = found
      ? trophyDescription(slot.itemId)
      : fmt(strings.unfiledHint, { num: formatOrderNumber(slot.levelNum), location: lvText.location });
    this.descPara.setBlock(desc, 30, 252, MODAL_W - 60);

    // Provenance rows
    const leftX = 42;
    const rightX = MODAL_W - 42;
    if (found && entry) {
      this.row1Key.set(strings.takenFrom, leftX, 422, 140);
      this.row1Val.restyle(PROV_VAL).set(provenanceText(entry), rightX, 422, 250);
      this.row2Key.set(strings.filedOn, leftX, 460, 140);
      this.row2Val.restyle(PROV_VAL).set(fmt(strings.reportNo, { n: entry.first + 1 }), rightX, 460, 250);
      this.row3Key.visible = true;
      this.row3Val.visible = true;
      this.row3Key.set(strings.timesHauled, leftX, 498, 140);
      this.row3Val.restyle(PROV_VAL_WARN).set(plural(entry.count, strings.timesCount), rightX, 498, 250);
    } else {
      this.row1Key.set(strings.statusLabel, leftX, 434, 120);
      this.row1Val.restyle(PROV_VAL_WARN).set(strings.stillOnEarth, rightX, 434, 286);
      this.row2Key.set(strings.takenFrom, leftX, 484, 120);
      this.row2Val.restyle(PROV_VAL).set(lvText.title, rightX, 484, 286);
      this.row3Key.visible = false;
      this.row3Val.visible = false;
    }
  }

  private populateTown(item: TownTrophySlotState): void {
    const { slot, found, postcards } = item;
    const strings = tr().trophies;
    const townStr = strings.town;
    const lvText = tr().levels[slot.levelId];

    this.postcards.visible = !!postcards?.length;
    const postcardH = this.postcards.visible
      ? this.postcards.setBlock(postcards!.join('\n'), 42, 520, MODAL_W - 84) + 14 : 0;
    this.applyModalHeight(MODAL_H + postcardH);
    this.drawModalChrome(found, 'town', 412, 426, 102 + postcardH);
    this.setSpecimenOnlyVisible(false);

    // Top-left badge
    const badgeText = found
      ? fmt(townStr.exhibitNo, { num: String(slot.index).padStart(2, '0') })
      : townStr.unfiledBadge;
    const bw = 148;
    this.badgeBg.draw(keyOf(Number(found), bw, 1), (g) => {
      if (found) roundRect(g, 24, 18, bw, 28, 14).fill(C.mint).stroke({ color: C.ink, width: 2 });
      else roundRect(g, 24, 18, bw, 28, 14).fill('rgba(255,179,71,0.16)').stroke({ color: C.amber, width: 1.8 });
    });
    this.badgeLabel.restyle(found ? TAG_BADGE_FOUND : TAG_BADGE_MISS).set(badgeText, 24 + bw / 2, 33, bw - 12);
    this.locLabel.set(`#${formatOrderNumber(slot.levelNum)} · ${lvText.title}`, MODAL_W - 24, 33, MODAL_W - bw - 60);

    // Showcase figure: animated PickupFigure when found; still silhouette when unfound
    this.stageGlow.place(MODAL_W / 2, 134, 108, 72, found ? 0.3 : 0.06);
    if (found) {
      this.artSprite.visible = false;
      this.townStage.visible = true;
      for (const [id, fig] of this.townFigures) {
        const match = id === slot.id;
        fig.root.visible = match;
        if (match) this.activeTownFig = fig;
      }
    } else {
      this.townStage.visible = false;
      this.activeTownFig = null;
      this.artSprite.visible = true;
      this.artBaseY = 136;
      const fit = townPickupFitSize(slot.id, 198, 128, 1.5);
      this.artSprite.texture = townPickupSilhouetteTexture(this.assets, slot.id, fit.w, fit.h);
      this.artSprite.width = fit.w;
      this.artSprite.height = fit.h;
      this.artSprite.position.set(MODAL_W / 2, this.artBaseY);
      this.artSprite.alpha = 0.85;
    }

    // Title & spacious description block
    const title = found ? townItemTitle(slot.id) : UNKNOWN_TAG;
    this.titleLabel.set(title, MODAL_W / 2, 248, MODAL_W - 48);

    const desc = found
      ? townDescription(slot.id)
      : fmt(slot.id === 'time_car' ? tr().crestValley.trophyUnfiled : townStr.unfiledDetail, { hint: townHint(slot.id), num: formatOrderNumber(slot.levelNum) });
    this.descPara.setBlock(desc, 30, 276, MODAL_W - 60);

    // Two-row provenance inset (where it was found + Bureau status; no star line)
    const leftX = 42;
    const rightX = MODAL_W - 42;
    this.row1Key.set(townStr.foundIn, leftX, 456, 120);
    this.row1Val.restyle(PROV_VAL).set(`#${formatOrderNumber(slot.levelNum)} · ${lvText.location}`, rightX, 456, 286);
    this.row2Key.set(strings.statusLabel, leftX, 496, 120);
    this.row2Val.restyle(PROV_VAL_WARN).set(found ? townStatus(slot.id) : slot.id === 'time_car' ? townStr.stillRacing : townStr.stillInTown, rightX, 496, 286);
    this.row3Key.visible = false;
    this.row3Val.visible = false;
  }

  private populateSpecimen(item: SpecimenSlotState): void {
    this.postcards.visible = false;
    const { slot, entry, found } = item;
    const strings = tr().trophies;
    const specStr = strings.specimens;
    const lvText = tr().levels[slot.levelId];
    const info = specimenInfo(slot.id);
    const detail = specimenDetailState(item);

    this.setSpecimenOnlyVisible(true);
    this.townStage.visible = false;
    this.activeTownFig = null;

    // Top-left badge
    const badgeText = found
      ? fmt(specStr.exhibitNo, { num: String(slot.index).padStart(2, '0') })
      : specStr.unfiledBadge;
    const bw = found ? 148 : 162;
    this.badgeBg.draw(keyOf(Number(found), bw, 2), (g) => {
      if (found) roundRect(g, 24, 18, bw, 28, 14).fill(C.mint).stroke({ color: C.ink, width: 2 });
      else roundRect(g, 24, 18, bw, 28, 14).fill('rgba(255,179,71,0.16)').stroke({ color: C.amber, width: 1.8 });
    });
    this.badgeLabel.restyle(found ? TAG_BADGE_FOUND : TAG_BADGE_MISS).set(badgeText, 24 + bw / 2, 33, bw - 12);
    this.locLabel.set(`#${formatOrderNumber(slot.levelNum)} · ${lvText.location}`, MODAL_W - 24, 33, MODAL_W - bw - 60);

    // Showcase portrait: animated SpecimenFigure when collected, still silhouette when uncollected
    this.stageGlow.place(MODAL_W / 2, 118, 88, 56, found ? 0.28 : 0.06);
    if (found) {
      this.artSprite.visible = false;
      this.specimenStage.visible = true;
      for (const [id, fig] of this.specimenFigures) {
        const match = id === slot.id;
        fig.root.visible = match;
        if (match) this.activeSpecimenFig = fig;
      }
      this.probeStamp.visible = detail.probed;
      if (detail.probed) this.probeStampLabel.set(detail.probeStampLabel, 0, 1, 90);
    } else {
      this.specimenStage.visible = false;
      this.activeSpecimenFig = null;
      this.probeStamp.visible = false;
      this.artSprite.visible = true;
      this.artBaseY = 118;
      const fit = specimenFitSize(slot.id, 174, 106, 1.05);
      this.artSprite.texture = specimenSilhouetteTexture(this.assets, slot.id, fit.w, fit.h);
      this.artSprite.width = fit.w;
      this.artSprite.height = fit.h;
      this.artSprite.position.set(MODAL_W / 2, this.artBaseY);
      this.artSprite.alpha = 0.86;
    }

    // Name & 3-cell vital stats strip
    this.titleLabel.set(found ? info.name : UNKNOWN_TAG, MODAL_W / 2, 203, MODAL_W - 48);

    const dash = tr().common.dash;
    const valLook = found ? STAT_VAL : STAT_VAL_MISS;
    this.ageKey.set(specStr.ageLabel, 84, 236, 108);
    this.ageVal.restyle(valLook).set(found ? info.age : dash, 84, 257, 108);
    this.heightKey.set(specStr.heightLabel, 224, 236, 148);
    this.heightVal.restyle(valLook).set(found ? info.height : dash, 224, 257, 148);
    this.weightKey.set(specStr.weightLabel, 378, 236, 136);
    this.weightVal.restyle(valLook).set(found ? info.weight : dash, 378, 257, 136);

    // Funny Bureau bio (or uncollected shift hint)
    const desc = found
      ? info.desc
      : fmt(specStr.notCollectedDetail, { num: formatOrderNumber(slot.levelNum), location: lvText.location });
    const descH = this.specDescPara.setBlock(desc, 30, 284, MODAL_W - 60);
    let cursorY = 284 + descH;

    // Dated Bureau addenda at repeat-visit thresholds (3rd and 10th abduction)
    const add3 = detail.addenda[0] ?? null;
    const add10 = detail.addenda[1] ?? null;
    const addBoxX = 24;
    const addBoxW = MODAL_W - 48;
    if (add3) {
      cursorY += 10;
      const boxY = cursorY;
      this.addendum3Bg.visible = true;
      this.addendum3Title.visible = true;
      this.addendum3Para.visible = true;
      this.addendum3Title.set(add3.heading, addBoxX + 16, boxY + 14, addBoxW - 28);
      const bodyH = this.addendum3Para.setBlock(add3.text, addBoxX + 16, boxY + 24, addBoxW - 28);
      const boxH = 24 + bodyH + 9;
      this.addendum3Bg.draw(keyOf(boxY, boxH, 3), (g) => {
        roundRect(g, addBoxX, boxY, addBoxW, boxH, 12)
          .fill('rgba(17,13,44,0.72)')
          .stroke({ color: 'rgba(255,197,94,0.34)', width: 1.5 });
        roundRect(g, addBoxX + 2, boxY + 6, 4, boxH - 12, 2).fill(C.amberHi);
      });
      cursorY += boxH;
    } else {
      this.addendum3Bg.visible = false;
      this.addendum3Title.visible = false;
      this.addendum3Para.visible = false;
    }

    if (add10) {
      cursorY += 8;
      const boxY = cursorY;
      this.addendum10Bg.visible = true;
      this.addendum10Title.visible = true;
      this.addendum10Para.visible = true;
      this.addendum10Title.set(add10.heading, addBoxX + 16, boxY + 14, addBoxW - 28);
      const bodyH = this.addendum10Para.setBlock(add10.text, addBoxX + 16, boxY + 24, addBoxW - 28);
      const boxH = 24 + bodyH + 9;
      this.addendum10Bg.draw(keyOf(boxY, boxH, 10), (g) => {
        roundRect(g, addBoxX, boxY, addBoxW, boxH, 12)
          .fill('rgba(28,12,42,0.76)')
          .stroke({ color: 'rgba(255,112,134,0.4)', width: 1.5 });
        roundRect(g, addBoxX + 2, boxY + 6, 4, boxH - 12, 2).fill('#ff7086');
      });
      cursorY += boxH;
    } else {
      this.addendum10Bg.visible = false;
      this.addendum10Title.visible = false;
      this.addendum10Para.visible = false;
    }

    // Dynamic modal height so both addenda + dossier box fit cleanly with zero clip or overlap
    const divY = detail.addenda.length > 0 ? cursorY + 11 : Math.max(384, cursorY + 12);
    const provY = divY + 10;
    const provH = 136;
    const modalH = Math.max(MODAL_H, provY + provH + 90);
    this.applyModalHeight(modalH);
    this.drawModalChrome(found, 'specimen', divY, provY, provH, found && entry !== null ? provY + 68 : 0);

    // Probe status + abduction count + intake provenance rows
    const leftX = 40;
    const rightX = MODAL_W - 40;
    this.row3Key.visible = false;
    this.row3Val.visible = false;
    if (found && entry) {
      const probed = detail.probed;
      const tagText = detail.probeTagLabel;
      const pw = probed
        ? Math.max(106, Math.min(184, Math.ceil(measure(tagText, PROBE_TAG_RED.size, PROBE_TAG_RED.weight) + 28)))
        : Math.max(168, Math.min(228, Math.ceil(measure(tagText, PROBE_TAG_MINT.size, PROBE_TAG_MINT.weight) + 24)));
      const pillY = provY + 10;

      this.probeBadgeBg.visible = true;
      this.probeBadgeLabel.visible = true;
      this.abductedBadgeBg.visible = true;
      this.abductedBadgeLabel.visible = true;
      this.probeNoteLabel.visible = true;
      this.probeBadgeBg.draw(keyOf(Number(probed), pw, pillY), (g) => {
        if (probed) {
          roundRect(g, 38, pillY, pw, 24, 12).fill('#c83249').stroke({ color: C.ink, width: 1.8 });
        } else {
          roundRect(g, 38, pillY, pw, 24, 12).fill('rgba(124,255,203,0.16)').stroke({ color: 'rgba(124,255,203,0.7)', width: 1.6 });
        }
      });
      this.probeBadgeLabel.restyle(probed ? PROBE_TAG_RED : PROBE_TAG_MINT).set(tagText, 38 + pw / 2, pillY + 12.5, pw - 14);

      const abText = detail.abductedLabel;
      const abW = Math.max(104, Math.min(156, Math.ceil(measure(abText, ABDUCTED_PILL_TXT.size, ABDUCTED_PILL_TXT.weight) + 24)));
      const abX = MODAL_W - 38 - abW;
      this.abductedBadgeBg.draw(keyOf(abX, abW, pillY), (g) => {
        roundRect(g, abX, pillY, abW, 24, 12)
          .fill('rgba(255,197,94,0.16)')
          .stroke({ color: 'rgba(255,197,94,0.75)', width: 1.6 });
      });
      this.abductedBadgeLabel.set(abText, abX + abW / 2, pillY + 12.5, abW - 14);

      this.probeNoteLabel
        .restyle(probed ? PROBE_NOTE_RED : PROBE_NOTE_MINT)
        .set(probed ? specStr.probedNote : specStr.unprobedNote, 38, provY + 50, MODAL_W - 76);

      this.row1Key.set(specStr.capturedVia, leftX, provY + 89, 136);
      this.row1Val.restyle(PROV_VAL).set(specimenCaptureText(entry), rightX, provY + 89, 250);
      this.row2Key.set(specStr.firstLogged, leftX, provY + 117, 136);
      this.row2Val.restyle(PROV_VAL).set(fmt(strings.reportNo, { n: entry.first + 1 }), rightX, provY + 117, 250);
    } else {
      this.probeBadgeBg.visible = false;
      this.probeBadgeLabel.visible = false;
      this.abductedBadgeBg.visible = false;
      this.abductedBadgeLabel.visible = false;
      this.probeNoteLabel.visible = false;
      this.row1Key.set(strings.statusLabel, leftX, provY + 44, 120);
      this.row1Val.restyle(PROV_VAL_WARN).set(specStr.notCollected, rightX, provY + 44, 286);
      this.row2Key.set(specStr.workOrderLabel, leftX, provY + 92, 120);
      this.row2Val.restyle(PROV_VAL).set(`#${formatOrderNumber(slot.levelNum)} · ${lvText.title}`, rightX, provY + 92, 286);
    }
  }

  sync(selected: SelectedExhibit | null, modalT: number, t: number, reduced: boolean, nav: ModalNavLook): void {
    const show = selected !== null;
    if (this.root.visible !== show) this.root.visible = show;
    if (!show || !selected) {
      this.shownKey = '';
      this.activeTownFig = null;
      this.activeSpecimenFig = null;
      return;
    }

    const key = selected.kind === 'souvenir'
      ? `s|${selected.item.slot.itemId}|${selected.item.found ? selected.item.entry?.count ?? 0 : -1}`
      : selected.kind === 'specimen'
        ? `p|${selected.item.slot.id}|${selected.item.found ? `${selected.item.entry?.count ?? 0}|${selected.item.entry?.probes ?? 0}` : -1}`
        : `t|${selected.item.slot.id}|${selected.item.found ? 1 : 0}`;
    if (key !== this.shownKey) {
      this.shownKey = key;
      if (selected.kind === 'souvenir') this.populateSouvenir(selected.item);
      else if (selected.kind === 'specimen') this.populateSpecimen(selected.item);
      else this.populateTown(selected.item);
    }

    if (nav.counterText !== this.shownCounter) {
      this.shownCounter = nav.counterText;
      this.counterLabel.set(nav.counterText, NAV_COUNTER_X, this.counterLabel.position.y, 96);
    }

    const k = reduced ? 1 : easeOutBack(modalT, 1.3);
    this.card.scale.set(0.86 + 0.14 * k);
    const popAlpha = reduced ? 1 : easeOutCubic(Math.min(1, modalT * 2.2));
    this.card.alpha = popAlpha * nav.cardFade;
    this.card.x = MODAL_X + MODAL_W / 2 + nav.cardShiftX;
    this.prevChevron.sync(popAlpha, nav.hasPrev);
    this.nextChevron.sync(popAlpha, nav.hasNext);
    if (selected.kind === 'souvenir') {
      this.artSprite.y = this.artBaseY + (selected.item.found && !reduced ? Math.sin(t * 2.6) * 3.5 : 0);
    } else if (selected.kind === 'specimen') {
      if (selected.item.found && this.activeSpecimenFig) this.activeSpecimenFig.sync(t, reduced);
    } else if (selected.item.found && this.activeTownFig) {
      this.activeTownFig.sync(t, reduced);
    }
    this.closeView.sync();
  }
}
