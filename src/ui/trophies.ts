// v4 trophy room: Bureau Evidence Locker scene + retained PixiJS 8 view.
// Room 1 (Souvenirs): abduction souvenirs grouped by level/town.
// Room 2 (Field finds): town map collectibles ordered by level, with animated figures when found
// and still silhouettes + vague memo hints when unfound. See docs/GDD-9-trophy-room.md.
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { Assets, MapCollectibleId, Scene } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { easeOutBack, easeOutCubic } from '../core/fx';
import { GLOW, Glow, glowTexture } from '../core/gfx/glow';
import { ViewSlot, type SceneView } from '../core/gfx/scene';
import { Shape, keyOf, roundRect } from '../core/gfx/shapes';
import { Label, Paragraph, wrapLines } from '../core/gfx/text';
import { paintedTexture } from '../core/gfx/textures';
import { clamp } from './draw';
import { C } from './theme';
import { Button } from './widgets';
import { NightSky } from './views/backdrop';
import { ButtonView } from './views/button';
import { highlightedPanel } from './views/menu-decor';
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
  TOWN_CARD_H,
  TOWN_CARD_W,
  buildShelfState,
  buildTownShelfState,
  hitTestTownRoom,
  hitTestTrophyPage,
  itemTitle,
  layoutTownRoom,
  layoutTrophyPage,
  provenanceText,
  shortLocation,
  townCatalog,
  townDescription,
  townHint,
  townItemTitle,
  townStatus,
  trophyDescription,
  type PageLayout,
  type SectionLayout,
  type SlotRect,
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
  | { readonly kind: 'town'; readonly item: TownTrophySlotState };

const HEADER_BASE_H = 216;
const WING_BAR_H = 44;
const MODAL_X = 32;
const MODAL_Y = 166;
const MODAL_W = VIEW_W - MODAL_X * 2; // 476
const MODAL_H = 608;
const UNKNOWN_TAG = '???';

export interface TrophiesDebug {
  readonly room: TrophyRoomTab;
  readonly foundCount: number;
  readonly totalCount: number;
  readonly townFoundCount: number;
  readonly townTotalCount: number;
  readonly pageIndex: number;
  readonly pageCount: number;
  readonly selectedId: string | null;
  setRoom(room: TrophyRoomTab): void;
  select(itemId: string): boolean;
  selectTown(id: MapCollectibleId): boolean;
  close(): void;
  scrollTo(y: number): void;
}

export class TrophiesScene implements Scene {
  t = 0;
  activeRoom: TrophyRoomTab = 'souvenirs';
  scroll = 0;
  private readonly scrollByRoom: Record<TrophyRoomTab, number> = { souvenirs: 0, town: 0 };
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
  readonly souvenirListTop: number;
  readonly townListTop = HEADER_BASE_H;
  pageIndex = 0;
  selected: SelectedExhibit | null = null;
  modalT = 0;

  readonly back = new Button(16, 16, 64, 58, '‹', 'ghost', 40);
  readonly tabSouvenirs = new Button(24, 88, 240, 48, '', 'primary', 17);
  readonly tabTown = new Button(276, 88, 240, 48, '', 'ghost', 17);
  readonly prevWing = new Button(24, HEADER_BASE_H + 4, 88, 36, '‹', 'ghost', 26);
  readonly nextWing = new Button(VIEW_W - 24 - 88, HEADER_BASE_H + 4, 88, 36, '›', 'ghost', 26);
  readonly closeBtn = new Button(MODAL_X + (MODAL_W - 220) / 2, MODAL_Y + MODAL_H - 74, 220, 56, '', 'primary', 24);

  readonly debug: TrophiesDebug;
  private readonly look = new ViewSlot(() => new TrophiesView(this));

  constructor(
    readonly shell: Shell,
    readonly returnTo: TrophyReturnTarget = 'title',
  ) {
    this.shelf = buildShelfState(shell.save);
    this.layouts = this.shelf.pages.map((p) => layoutTrophyPage(p));
    this.townShelf = buildTownShelfState(shell.save);
    this.townLayout = layoutTownRoom(this.townShelf);
    this.souvenirListTop = this.shelf.pages.length > 1 ? HEADER_BASE_H + WING_BAR_H : HEADER_BASE_H;

    const strings = tr().trophies;
    this.tabSouvenirs.label = fmt(strings.tabSouvenirs, { n: this.shelf.foundCount, max: this.shelf.totalCount });
    this.tabTown.label = fmt(strings.tabTown, { n: this.townShelf.foundCount, max: this.townShelf.totalCount });
    this.closeBtn.label = strings.close;
    this.syncTabStyles();

    const self = this;
    this.debug = {
      get room() { return self.activeRoom; },
      get foundCount() { return self.shelf.foundCount; },
      get totalCount() { return self.shelf.totalCount; },
      get townFoundCount() { return self.townShelf.foundCount; },
      get townTotalCount() { return self.townShelf.totalCount; },
      get pageIndex() { return self.pageIndex; },
      get pageCount() { return self.shelf.pages.length; },
      get selectedId() {
        if (!self.selected) return null;
        return self.selected.kind === 'souvenir' ? self.selected.item.slot.itemId : self.selected.item.slot.id;
      },
      setRoom(room: TrophyRoomTab): void {
        self.switchRoom(room);
      },
      select(itemId: string): boolean {
        for (let pi = 0; pi < self.shelf.pages.length; pi++) {
          const hit = self.shelf.pages[pi]!.sections.flatMap((s) => s.slots).find((s) => s.slot.itemId === itemId);
          if (hit) {
            self.switchRoom('souvenirs');
            self.pageIndex = pi;
            self.selected = { kind: 'souvenir', item: hit };
            self.modalT = 1;
            return true;
          }
        }
        return false;
      },
      selectTown(id: MapCollectibleId): boolean {
        const hit = self.townShelf.slots.find((s) => s.slot.id === id);
        if (!hit) return false;
        self.switchRoom('town');
        self.selected = { kind: 'town', item: hit };
        self.modalT = 1;
        return true;
      },
      close(): void {
        self.selected = null;
        self.modalT = 0;
      },
      scrollTo(y: number): void {
        self.scroll = clamp(y, 0, self.maxScroll);
        self.scrollByRoom[self.activeRoom] = self.scroll;
        self.vel = 0;
      },
    };
  }

  get listTop(): number {
    return this.activeRoom === 'souvenirs' ? this.souvenirListTop : this.townListTop;
  }

  get currentLayout(): PageLayout {
    return this.layouts[this.pageIndex] ?? this.layouts[0]!;
  }

  private get maxScroll(): number {
    const contentHeight = this.activeRoom === 'souvenirs'
      ? this.currentLayout.contentHeight
      : this.townLayout.contentHeight;
    return Math.max(0, contentHeight - (VIEW_H - this.listTop));
  }

  private syncTabStyles(): void {
    this.tabSouvenirs.kind = this.activeRoom === 'souvenirs' ? 'primary' : 'ghost';
    this.tabTown.kind = this.activeRoom === 'town' ? 'primary' : 'ghost';
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

  private closeModal(): void {
    this.selected = null;
    this.modalT = 0;
    this.scrimArmed = false;
    this.closeBtn.cancel();
  }

  update(dt: number): void {
    this.t += dt;
    const p = this.shell.ctx.pointer;
    const audio = this.shell.audio;

    // Modal intercepts all input while open
    if (this.selected) {
      this.modalT = Math.min(1, this.modalT + dt * 4.5);
      if (this.closeBtn.update(p, dt, audio)) {
        this.closeModal();
        return;
      }
      const inCard = p.x >= MODAL_X && p.x <= MODAL_X + MODAL_W && p.y >= MODAL_Y && p.y <= MODAL_Y + MODAL_H;
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
    if (this.tabSouvenirs.update(p, dt, audio)) {
      this.switchRoom('souvenirs');
      return;
    }
    if (this.tabTown.update(p, dt, audio)) {
      this.switchRoom('town');
      return;
    }

    const showWings = this.activeRoom === 'souvenirs' && this.shelf.pages.length > 1;
    if (showWings) {
      this.prevWing.visible = true;
      this.nextWing.visible = true;
      this.prevWing.enabled = this.pageIndex > 0;
      this.nextWing.enabled = this.pageIndex < this.shelf.pages.length - 1;
      if (this.prevWing.update(p, dt, audio)) {
        this.pageIndex = Math.max(0, this.pageIndex - 1);
        this.scroll = 0;
        this.vel = 0;
        return;
      }
      if (this.nextWing.update(p, dt, audio)) {
        this.pageIndex = Math.min(this.shelf.pages.length - 1, this.pageIndex + 1);
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
          if (hit) {
            this.selected = { kind: 'souvenir', item: hit };
            this.modalT = this.shell.ctx.reducedMotion ? 1 : 0;
            audio.sfx('click');
          }
        } else {
          const hit = hitTestTownRoom(this.townLayout, p.x, contentY);
          if (hit) {
            this.selected = { kind: 'town', item: hit };
            this.modalT = this.shell.ctx.reducedMotion ? 1 : 0;
            audio.sfx('click');
          }
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

class TrophiesView implements SceneView {
  readonly root = new Container();
  private readonly sky = new NightSky();
  private readonly listMask = new Shape();
  private readonly souvenirList = new Container();
  private readonly pages: PageView[] = [];
  private readonly townRoom: TownRoomView;
  private readonly headerBg = new Sprite(Texture.EMPTY);
  private readonly headerRule = new Graphics();
  private readonly subtitleLabel = new Label(HDR_SUB);
  private readonly souvenirSummary = new Container();
  private readonly townSummary = new Container();
  private readonly back: ButtonView;
  private readonly tabSouvenirs: ButtonView;
  private readonly tabTown: ButtonView;
  private readonly prevWing: ButtonView;
  private readonly nextWing: ButtonView;
  private readonly wingLabel: Label | null;
  private readonly modal: DetailModalView;
  private lastPage = -1;
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

    // Header gradient backdrop (stays above scrolling shelves)
    const maxHeaderH = Math.max(s.souvenirListTop, s.townListTop);
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
    this.tabSouvenirs = new ButtonView(s.tabSouvenirs);
    this.tabTown = new ButtonView(s.tabTown);
    this.prevWing = new ButtonView(s.prevWing);
    this.nextWing = new ButtonView(s.nextWing);

    // Room 1 summary panel (built once)
    this.buildSouvenirSummary();
    // Room 2 summary panel (built once)
    this.buildTownSummary();

    this.root.addChild(
      this.sky,
      this.listMask,
      this.souvenirList,
      this.townRoom.root,
      this.headerBg,
      this.headerRule,
      this.back,
      new Label(HDR_TITLE).set(strings.title, VIEW_W / 2 + 18, 40, VIEW_W - 140),
      this.subtitleLabel,
      this.tabSouvenirs,
      this.tabTown,
      this.souvenirSummary,
      this.townSummary,
    );

    if (s.shelf.pages.length > 1) {
      this.wingLabel = new Label(WING_LABEL);
      this.root.addChild(this.prevWing, this.nextWing, this.wingLabel);
    } else {
      this.wingLabel = null;
    }

    this.modal = new DetailModalView(assets, s.closeBtn);
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

  sync(): void {
    const s = this.s;
    const reduced = s.shell.ctx.reducedMotion;
    this.sky.sync(s.t, reduced);
    this.back.sync();
    this.tabSouvenirs.sync();
    this.tabTown.sync();

    if (this.lastRoom !== s.activeRoom) {
      this.lastRoom = s.activeRoom;
      const isSouvenirs = s.activeRoom === 'souvenirs';
      const top = s.listTop;
      this.listMask.draw(top, (g) => g.rect(0, top - 4, VIEW_W, VIEW_H - top + 4).fill('#ffffff'));
      this.headerBg.height = top - 2;
      this.headerRule.y = top - 4;
      const strings = tr().trophies;
      this.subtitleLabel.set(isSouvenirs ? strings.subtitle : strings.town.subtitle, VIEW_W / 2 + 18, 70, VIEW_W - 140);
      this.souvenirSummary.visible = isSouvenirs;
      this.townSummary.visible = !isSouvenirs;
      this.souvenirList.visible = isSouvenirs;
      this.townRoom.root.visible = !isSouvenirs;
      if (this.wingLabel) this.wingLabel.visible = isSouvenirs;
    }

    if (this.wingLabel) {
      this.prevWing.sync();
      this.nextWing.sync();
      if (this.lastPage !== s.pageIndex) {
        this.wingLabel.set(fmt(tr().trophies.wing, { n: s.pageIndex + 1, total: s.shelf.pages.length }), VIEW_W / 2, HEADER_BASE_H + 22, 240);
      }
    }

    if (this.lastPage !== s.pageIndex) {
      this.lastPage = s.pageIndex;
      for (let i = 0; i < this.pages.length; i++) this.pages[i]!.root.visible = i === s.pageIndex;
    }

    if (s.activeRoom === 'souvenirs') {
      this.souvenirList.y = s.listTop - s.scroll;
      this.pages[s.pageIndex]?.sync(this.souvenirList.y, s.listTop, s.t, reduced);
    } else {
      this.townRoom.root.y = s.listTop - s.scroll;
      this.townRoom.sync(this.townRoom.root.y, s.listTop, s.t, reduced);
    }

    this.modal.sync(s.selected, s.modalT, s.t, reduced);
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

    const numTag = `#0${section.levelNum}`;
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
    const locLine = `#0${slot.levelNum} · ${lvText.location}`;
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

// ---------------------------------------------------------------- Exhibit Tag detail modal

const TAG_BADGE_FOUND = { size: 13, color: C.ink, weight: 900 } as const;
const TAG_BADGE_MISS = { size: 13, color: C.amberHi, weight: 900 } as const;
const TAG_LOC = { size: 13, color: C.muted, align: 'right', weight: 700 } as const;
const MODAL_TITLE = { size: 26, color: C.text, weight: 900, outline: C.ink } as const;
const MODAL_DESC = { size: 17, color: '#e6e0ff', italic: true, weight: 500, lineHeight: 23 } as const;
const PROV_KEY = { size: 14, color: C.muted, align: 'left', weight: 700 } as const;
const PROV_VAL = { size: 15, color: C.mint, align: 'right', weight: 800 } as const;
const PROV_VAL_WARN = { size: 14.5, color: C.amberHi, align: 'right', weight: 700 } as const;

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
  private readonly titleLabel = new Label(MODAL_TITLE);
  private readonly descPara = new Paragraph(MODAL_DESC);
  private readonly divider = new Shape();
  private readonly provBox = new Shape();
  private readonly row1Key = new Label(PROV_KEY);
  private readonly row1Val = new Label(PROV_VAL);
  private readonly row2Key = new Label(PROV_KEY);
  private readonly row2Val = new Label(PROV_VAL);
  private readonly row3Key = new Label(PROV_KEY);
  private readonly row3Val = new Label(PROV_VAL);
  private readonly closeView: ButtonView;

  private shownKey = '';
  private artBaseY = 128;

  constructor(private readonly assets: Assets, closeBtn: Button) {
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
      this.titleLabel,
      this.descPara,
      this.divider,
      this.provBox,
      this.row1Key,
      this.row1Val,
      this.row2Key,
      this.row2Val,
      this.row3Key,
      this.row3Val,
      this.closeView,
    );

    this.root.addChild(scrim, this.card);
  }

  private drawModalChrome(found: boolean, isTown: boolean): void {
    this.cardFrame.draw(keyOf(Number(found)), (g) => {
      highlightedPanel(g, 0, 0, MODAL_W, MODAL_H, {
        fill: C.panel,
        r: 24,
        stroke: found ? C.mint : C.muted,
        lineW: 4,
        shadow: 10,
      }, 0.16);
    });

    // Town modal gives extra height to the animated figure vitrine + description (2 provenance rows instead of 3)
    this.vitrine.draw(keyOf(Number(isTown)), (g) => {
      if (isTown) {
        roundRect(g, 96, 56, 284, 166, 18)
          .fill('#131130')
          .stroke({ color: 'rgba(124,255,203,0.38)', width: 2 });
        roundRect(g, 126, 204, 224, 6, 3).fill('rgba(169,162,214,0.22)');
      } else {
        roundRect(g, 118, 58, 240, 140, 18)
          .fill('#131130')
          .stroke({ color: 'rgba(124,255,203,0.38)', width: 2 });
        roundRect(g, 142, 174, 192, 6, 3).fill('rgba(169,162,214,0.22)');
      }
    });

    this.divider.draw(keyOf(Number(isTown)), (g) => {
      const dy = isTown ? 404 : 366;
      g.rect(28, dy, MODAL_W - 56, 2).fill('rgba(169,162,214,0.2)');
    });

    this.provBox.draw(keyOf(Number(isTown)), (g) => {
      const py = isTown ? 418 : 382;
      const ph = isTown ? 98 : 134;
      roundRect(g, 24, py, MODAL_W - 48, ph, 16)
        .fill(C.night2)
        .stroke({ color: 'rgba(169,162,214,0.24)', width: 2 });
    });
  }

  private populateSouvenir(item: TrophySlotState): void {
    const { slot, entry, found } = item;
    const strings = tr().trophies;
    const lvText = tr().levels[slot.levelId];

    this.drawModalChrome(found, false);
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
    this.locLabel.set(`#0${slot.levelNum} · ${lvText.location}`, MODAL_W - 24, 33, MODAL_W - bw - 60);

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
      : fmt(strings.unfiledHint, { num: slot.levelNum, location: lvText.location });
    this.descPara.setBlock(desc, 30, 252, MODAL_W - 60);

    // Provenance rows
    const leftX = 42;
    const rightX = MODAL_W - 42;
    if (found && entry) {
      this.row1Key.set(strings.takenFrom, leftX, 412, 140);
      this.row1Val.restyle(PROV_VAL).set(provenanceText(entry), rightX, 412, 250);
      this.row2Key.set(strings.filedOn, leftX, 450, 140);
      this.row2Val.restyle(PROV_VAL).set(fmt(strings.reportNo, { n: entry.first + 1 }), rightX, 450, 250);
      this.row3Key.visible = true;
      this.row3Val.visible = true;
      this.row3Key.set(strings.timesHauled, leftX, 488, 140);
      this.row3Val.restyle(PROV_VAL_WARN).set(plural(entry.count, strings.timesCount), rightX, 488, 250);
    } else {
      this.row1Key.set(strings.statusLabel, leftX, 424, 120);
      this.row1Val.restyle(PROV_VAL_WARN).set(strings.stillOnEarth, rightX, 424, 286);
      this.row2Key.set(strings.takenFrom, leftX, 474, 120);
      this.row2Val.restyle(PROV_VAL).set(lvText.title, rightX, 474, 286);
      this.row3Key.visible = false;
      this.row3Val.visible = false;
    }
  }

  private populateTown(item: TownTrophySlotState): void {
    const { slot, found } = item;
    const strings = tr().trophies;
    const townStr = strings.town;
    const lvText = tr().levels[slot.levelId];

    this.drawModalChrome(found, true);

    // Top-left badge
    const badgeText = found
      ? fmt(townStr.exhibitNo, { num: String(slot.index).padStart(2, '0') })
      : townStr.unfiledBadge;
    const bw = found ? 148 : 148;
    this.badgeBg.draw(keyOf(Number(found), bw, 1), (g) => {
      if (found) roundRect(g, 24, 18, bw, 28, 14).fill(C.mint).stroke({ color: C.ink, width: 2 });
      else roundRect(g, 24, 18, bw, 28, 14).fill('rgba(255,179,71,0.16)').stroke({ color: C.amber, width: 1.8 });
    });
    this.badgeLabel.restyle(found ? TAG_BADGE_FOUND : TAG_BADGE_MISS).set(badgeText, 24 + bw / 2, 33, bw - 12);
    this.locLabel.set(`#0${slot.levelNum} · ${lvText.title}`, MODAL_W - 24, 33, MODAL_W - bw - 60);

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
      : fmt(slot.id === 'time_car' ? tr().crestValley.trophyUnfiled : townStr.unfiledDetail, { hint: townHint(slot.id), num: slot.levelNum });
    this.descPara.setBlock(desc, 30, 276, MODAL_W - 60);

    // Two-row provenance inset (where it was found + Bureau status; no star line)
    const leftX = 42;
    const rightX = MODAL_W - 42;
    this.row1Key.set(townStr.foundIn, leftX, 448, 120);
    this.row1Val.restyle(PROV_VAL).set(`#0${slot.levelNum} · ${lvText.location}`, rightX, 448, 286);
    this.row2Key.set(strings.statusLabel, leftX, 488, 120);
    this.row2Val.restyle(PROV_VAL_WARN).set(found ? townStatus(slot.id) : slot.id === 'time_car' ? townStr.stillRacing : townStr.stillInTown, rightX, 488, 286);
    this.row3Key.visible = false;
    this.row3Val.visible = false;
  }

  sync(selected: SelectedExhibit | null, modalT: number, t: number, reduced: boolean): void {
    const show = selected !== null;
    if (this.root.visible !== show) this.root.visible = show;
    if (!show || !selected) {
      this.shownKey = '';
      this.activeTownFig = null;
      return;
    }

    const key = selected.kind === 'souvenir'
      ? `s|${selected.item.slot.itemId}|${selected.item.found ? selected.item.entry?.count ?? 0 : -1}`
      : `t|${selected.item.slot.id}|${selected.item.found ? 1 : 0}`;
    if (key !== this.shownKey) {
      this.shownKey = key;
      if (selected.kind === 'souvenir') this.populateSouvenir(selected.item);
      else this.populateTown(selected.item);
    }

    const k = reduced ? 1 : easeOutBack(modalT, 1.3);
    this.card.scale.set(0.86 + 0.14 * k);
    this.card.alpha = reduced ? 1 : easeOutCubic(Math.min(1, modalT * 2.2));
    if (selected.kind === 'souvenir') {
      this.artSprite.y = this.artBaseY + (selected.item.found && !reduced ? Math.sin(t * 2.6) * 3.5 : 0);
    } else if (selected.item.found && this.activeTownFig) {
      this.activeTownFig.sync(t, reduced);
    }
    this.closeView.sync();
  }
}
