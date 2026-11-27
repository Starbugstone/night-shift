import { crestValleyPortrait } from './views/crest-valley-portrait';
import { apeFallback } from '../abduct/monolith-art';
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Assets, Scene } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { deepPar } from '../levels/types';
import { LEVELS, formatOrderNumber, workOrderNumber } from '../levels/levels';
import { MAX_STARS, RANKS, dispatchRequirements, isLevelUnlocked, levelStarCount, nextDispatchIndex, nextRank, rankFor, totalStars, type Rank } from '../levels/progress';
import { fmt, tr } from '../i18n';
import { readSeconds } from '../core/read-time';
import { easeOutCubic } from '../core/fx';
import { GLOW, Glow, glowTexture } from '../core/gfx/glow';
import { ViewSlot, type SceneView } from '../core/gfx/scene';
import { Shape, panelPath, roundRect } from '../core/gfx/shapes';
import { Label, Paragraph, measure, wrapLines } from '../core/gfx/text';
import { paintedTexture } from '../core/gfx/textures';
import { clamp, fmtTime, targetHeadKey } from './draw';
import { C } from './theme';
import { deadlineLabel } from './deadline';
import { Button } from './widgets';
import { artSprite } from './views/art';
import { NightSky } from './views/backdrop';
import { ButtonView } from './views/button';
import { glorbTexture, iconSprite, starTexture } from './views/icons';
import { highlightedPanel, SunIcon } from './views/menu-decor';
import { trophyCupTexture } from './views/trophy-art';

const LIST_TOP = 262;
const CARD_X = 32;
const CARD_W = VIEW_W - CARD_X - 24;
const CARD_H = 204;
const GAP = 20;

/** Rank title and flavour in the current language. */
function rankText(r: Rank): { title: string; flavour: string } {
  return tr().ranks[RANKS.indexOf(r)] ?? r;
}

/** What the Work Orders rank panel shows for a save. */
export interface RankCard {
  title: string;
  flavour: string;
  /** Stars needed for the next rank, or null at the top. */
  nextAt: number | null;
}

/**
 * v0.2 copy: the rank panel. The 2199 finale gives Zib Bubbles' parking ring, so once L12 is delivered the
 * panel says so at every rank (it used to need exactly Senior Abductor, which no fresh player can hold then).
 */
export function rankCard(save: Shell['save']): RankCard {
  const stars = totalStars(save);
  const rank = rankText(rankFor(stars));
  const next = nextRank(stars);
  return {
    title: rank.title,
    flavour: save.levels.level12.delivered ? tr().dispatch2199.parking : rank.flavour,
    nextAt: next ? next.minStars : null,
  };
}

function outstandingOrders(save: Shell['save'], index: number): string {
  const eras: Record<string, string> = { level10: '1122', level11: '1953' };
  const levels: Record<string, { human: string }> = tr().levels;
  return dispatchRequirements(LEVELS, index)
    .filter(id => !save.levels[id]?.delivered)
    .map(id => levels[id]?.human ?? eras[id] ?? id).join(tr().report.listSep);
}

interface Card {
  kind: 'level' | 'concept';
  index: number;
  shake: number;
}

export class WorkOrdersScene implements Scene {
  t = 0;
  scroll = 0;
  private vel = 0;
  private dragging = false;
  private pressY = 0;
  private pressScroll = 0;
  private lastY = 0;
  tracking = false;
  toast = '';
  toastT = 0;
  readonly back = new Button(16, 18, 64, 60, '‹', 'ghost', 40);
  readonly trophies = new Button(VIEW_W - 80, 18, 64, 60, '', 'ghost', 24);
  readonly upgrades = new Button(336, 186, 180, 60, tr().workOrders.upgrades, 'amber', 24);
  readonly cards: Card[] = [];
  readonly recommended: number;
  private readonly look = new ViewSlot(() => new WorkOrdersView(this));

  constructor(readonly shell: Shell) {
    this.recommended = nextDispatchIndex(shell.save);
    for (let i = 0; i < LEVELS.length; i++) this.cards.push({ kind: 'level', index: i, shake: 0 });
    for (let i = 0; i < tr().missionConcepts.length; i++) this.cards.push({ kind: 'concept', index: i, shake: 0 });
    if (this.recommended >= 3) this.scroll = Math.min(this.maxScroll, (this.recommended - 1) * (CARD_H + GAP));
  }

  private get maxScroll(): number {
    const content = this.cards.length * (CARD_H + GAP) + 40;
    return Math.max(0, content - (VIEW_H - LIST_TOP));
  }

  update(dt: number): void {
    this.t += dt;
    const p = this.shell.ctx.pointer;
    if (this.back.update(p, dt)) return this.shell.toTitle();
    if (this.trophies.update(p, dt)) return this.shell.toTrophies('workorders');
    if (this.upgrades.update(p, dt)) return this.shell.toUpgrades();

    if (p.pressed && p.y >= LIST_TOP) {
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
      if (!this.dragging && p.y >= LIST_TOP) this.tap(p.x, p.y + this.scroll - LIST_TOP);
      this.dragging = false;
    }
    if (!this.tracking) {
      this.scroll += this.vel * dt;
      this.vel *= Math.exp(-4 * dt);
      if (Math.abs(this.vel) < 5) this.vel = 0;
    }
    this.scroll += this.shell.input.wheelDy;
    // soft clamp
    const max = this.maxScroll;
    if (!this.tracking) {
      if (this.scroll < 0) this.scroll += (0 - this.scroll) * Math.min(1, dt * 12);
      if (this.scroll > max) this.scroll += (max - this.scroll) * Math.min(1, dt * 12);
    }
    this.scroll = clamp(this.scroll, -120, max + 120);
    for (const c of this.cards) c.shake = Math.max(0, c.shake - dt * 2.5);
    this.toastT = Math.max(0, this.toastT - dt);
  }

  tap(x: number, contentY: number): void {
    if (x < CARD_X || x > CARD_X + CARD_W) return;
    const i = Math.floor(contentY / (CARD_H + GAP));
    const within = contentY - i * (CARD_H + GAP);
    if (i < 0 || i >= this.cards.length || within > CARD_H) return;
    const card = this.cards[i]!;
    if (card.kind === 'concept') return;
    if (isLevelUnlocked(this.shell.save, card.index)) {
      this.shell.toMemo(card.index);
      return;
    }
    card.shake = 1;
    const w = tr().workOrders;
    this.toast = fmt(w.deliverFirst, { name: outstandingOrders(this.shell.save, card.index) || w.lastSpecimen });
    this.toastT = readSeconds(this.toast);
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

const TOAST = { size: 20, color: C.amberHi, weight: 700, lineHeight: 26 } as const;

class WorkOrdersView implements SceneView {
  readonly root = new Container();
  private readonly sky = new NightSky();
  private readonly list = new Container();
  private readonly cards: (LevelCard | ConceptCard)[];
  private readonly back: ButtonView;
  private readonly trophies: ButtonView;
  private readonly trophyIcon: Sprite;
  private readonly upgrades: ButtonView;
  private readonly toast = new Container();
  private readonly toastPanel = new Shape();
  private readonly toastText = new Paragraph(TOAST);
  private toastFor = '';

  constructor(private readonly s: WorkOrdersScene) {
    const { assets, save } = s.shell;
    const { workOrders: strings } = tr();
    const mask = new Graphics().rect(0, LIST_TOP - 8, VIEW_W, VIEW_H - LIST_TOP + 8).fill('#ffffff');
    this.list.mask = mask;
    this.cards = s.cards.map((c) => c.kind === 'level' ? new LevelCard(s.shell, c.index, c.index === s.recommended) : new ConceptCard(c.index));
    this.list.addChild(dispatchRoute(save, s.recommended));
    for (const card of this.cards) this.list.addChild(card.root);

    const header = new Sprite(paintedTexture('workorders|header', 2, LIST_TOP - 6, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, LIST_TOP);
      grad.addColorStop(0, '#0d0924');
      grad.addColorStop(1, '#171038');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }, 1));
    header.width = VIEW_W;
    const rule = new Graphics().rect(0, LIST_TOP - 8, VIEW_W, 2).fill('rgba(124,255,203,0.25)');
    this.back = new ButtonView(s.back);
    this.trophies = new ButtonView(s.trophies);
    this.trophyIcon = iconSprite(trophyCupTexture(34, C.amberHi), 34);
    this.trophyIcon.position.set(s.trophies.x + s.trophies.w / 2, s.trophies.y + s.trophies.h / 2);
    this.upgrades = new ButtonView(s.upgrades);

    const stars = totalStars(save);
    const rank = rankCard(save);
    const nr = rank.nextAt;
    const colW = s.upgrades.x - 44 - 12;
    const purse = roundRect(new Graphics(), 384, 114, 118, 48, 24).fill('rgba(18,13,43,0.55)');
    const coin = iconSprite(glorbTexture(assets, 38), 38);
    coin.position.set(410, 138);
    this.toast.addChild(this.toastPanel, this.toastText);
    this.root.addChild(
      this.sky, mask, this.list, header, rule, this.back, this.trophies, this.trophyIcon,
      new Label({ size: 38, color: C.mint, weight: 900, outline: C.ink }).set(strings.title, VIEW_W / 2, 48, VIEW_W - 180),
      new Label({ size: 17, color: C.muted, weight: 600 }).set(strings.subtitle, VIEW_W / 2, 80, VIEW_W - 180),
      highlightedPanel(new Graphics(), 24, 100, VIEW_W - 48, 76, { fill: C.panel, r: 18, lineW: 3, shadow: 4 }),
      new Label({ size: 14, color: C.muted, align: 'left', weight: 800 }).set(strings.rank, 44, 120),
      new Label({ size: rank.title.length > 16 ? 22 : 26, color: C.text, align: 'left', weight: 800 }).set(rank.title, 44, 146, 328),
      purse, coin,
      new Label({ size: 26, color: C.mint, align: 'left', weight: 800 }).set(String(save.glorbs), 434, 139, 62),
      new Label({ size: 22, color: C.amberHi, align: 'left', weight: 800 }).set(fmt(strings.stars, { n: stars, max: MAX_STARS }), 44, 198),
    );
    if (nr !== null) this.root.addChild(new Label({ size: 15, color: C.muted, align: 'left', weight: 700 }).set(fmt(strings.nextRank, { n: nr }), 44, 224, colW));
    const flavour = new Label({ size: nr !== null ? 14 : 15, color: nr !== null ? 'rgba(169,162,214,0.8)' : C.muted, align: 'left', italic: true });
    this.root.addChild(flavour.set(rank.flavour, 44, nr !== null ? 244 : 232, colW), this.upgrades, this.toast);
  }

  sync(): void {
    const { shell, t, scroll, cards, toast, toastT } = this.s;
    const reduced = shell.ctx.reducedMotion;
    this.sky.sync(t, reduced);
    this.back.sync();
    this.trophies.sync();
    this.trophyIcon.y = this.s.trophies.y + this.s.trophies.h / 2 + (this.s.trophies.pressedDown ? 4 : 0);
    this.upgrades.sync();
    this.list.y = LIST_TOP - scroll;
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]!;
      const top = i * (CARD_H + GAP);
      const y = top + this.list.y;
      const deal = reduced ? 1 : easeOutCubic((t - 0.05 - i * 0.07) / 0.32);
      card.root.visible = y <= VIEW_H && y + CARD_H >= LIST_TOP - 20 && deal > 0;
      if (!card.root.visible) continue;
      const shake = cards[i]!.shake;
      card.root.position.set(CARD_X + (shake > 0 && !reduced ? Math.sin(shake * 40) * 10 * shake : 0), top + (1 - deal) * 46);
      card.root.alpha = deal;
      if (card instanceof LevelCard) card.sync(t, reduced);
    }

    this.toast.visible = toastT > 0;
    if (toastT > 0) {
      if (toast !== this.toastFor) {
        this.toastFor = toast;
        const h = 30 + wrapLines(toast, VIEW_W - 100, TOAST.size, TOAST.weight).length * TOAST.lineHeight;
        const y = VIEW_H - 40 - h;
        this.toastPanel.draw(h, (g) => panelPath(g, 30, y, VIEW_W - 60, h, { fill: C.ink, r: 18, stroke: C.amber, lineW: 3, shadow: 0 }));
        this.toastText.setBlock(toast, 50, y + 15, VIEW_W - 100);
      }
      this.toast.alpha = Math.min(1, toastT * 3);
    }
  }
}

function dispatchRoute(save: Shell['save'], recommended: number): Graphics {
  const route = new Graphics();
  const x = 16;
  const stride = CARD_H + GAP;
  for (let i = 0; i < LEVELS.length; i++) {
    const y = i * stride + CARD_H / 2;
    const unlocked = isLevelUnlocked(save, i);
    if (i > 0) {
      const color = LEVELS[i]!.id === 'level8' ? C.amber : C.mint;
      for (let t = y - stride + 12; t < y - 9; t += 11) route.circle(x, t, 1.9).fill({ color, alpha: unlocked ? 0.65 : 0.28 });
    }
    const delivered = save.levels[LEVELS[i]!.id].delivered;
    route.circle(x, y, i === recommended ? 7 : 5).fill(delivered || i === recommended ? C.mint : C.panel)
      .stroke({ color: unlocked ? C.mint : C.muted, width: 2 });
  }
  return route;
}

class LevelCard {
  readonly root = new Container();
  private readonly photos: Mugshot[] = [];
  private readonly arrow: Graphics | null;
  private readonly sun: SunIcon | null;

  constructor(shell: Shell, private readonly index: number, recommended: boolean) {
    const { assets, save } = shell;
    const lv = LEVELS[index]!;
    const unlocked = isLevelUnlocked(save, index);
    const training = lv.kind === 'tutorial';
    const prog = save.levels[lv.id];
    const { workOrders: strings, levels } = tr();
    const lt = levels[lv.id];

    const card = highlightedPanel(new Graphics(), 0, 0, CARD_W, CARD_H, { fill: unlocked ? C.panel : '#211a4a' }, unlocked ? 0.14 : 0.07);
    roundRect(card, 4, 4, 12, CARD_H - 8, 6).fill(!unlocked ? '#4a4470' : training ? C.mint : C.amber);
    if (unlocked && !training) roundRect(card, 4, CARD_H / 2, 12, (CARD_H - 8) / 2, 6).fill(C.red);
    this.root.addChild(card);
    if (lv.id === 'birch_neighbours') {
      this.photos.push(new Mugshot(assets, 'human/len_head', CARD_W - 47, 52, unlocked, index + 1, 29));
      this.photos.push(new Mugshot(assets, lv.mugshot, CARD_W - 82, 64, unlocked, index, 37));
    } else if (lv.kind === 'deep' && lv.map.targets.length === 3) {
      const cx = CARD_W - 66;
      const anchors = [[cx - 26, 46], [cx + 24, 44], [cx - 2, 84]] as const;
      for (const [i, target] of lv.map.targets.entries()) {
        const [x, y] = anchors[i]!;
        this.photos.push(new Mugshot(assets, targetHeadKey(target), x, y, unlocked, index + i, 25));
      }
    } else this.photos.push(new Mugshot(assets, lv.mugshot, CARD_W - 62, 58, unlocked, index, 38));
    for (const photo of this.photos) this.root.addChild(photo.root);

    const order = fmt(strings.orderNo, { num: formatOrderNumber(workOrderNumber(lv.id)) });
    const tagX = 44 + measure(order, 14, 800);
    const learner = training && !recommended;
    const mint = training || recommended;
    const tag = recommended ? strings.nextDispatch : training ? strings.training : lv.id === 'level8' ? tr().timeTrial.badge
      : fmt(strings.deepShift, { n: lv.map.targets.length });
    const tw = measure(tag, 13, 900) + (learner ? 40 : 18);
    const badge = roundRect(new Graphics(), tagX, 14, tw, 24, 12)
      .fill(mint ? 'rgba(124,255,203,0.16)' : 'rgba(255,93,115,0.24)')
      .stroke({ color: mint ? 'rgba(124,255,203,0.6)' : 'rgba(255,138,154,0.75)', width: 1.5 });
    if (learner) roundRect(badge, tagX + 6, 18, 17, 16, 3).fill('#f4efe2');
    this.root.addChild(
      new Label({ size: 14, color: unlocked ? C.mint : C.muted, align: 'left', weight: 800 }).set(order, 34, 26),
      badge,
      new Label({ size: 13, color: mint ? C.mint : '#ffa3b0', align: 'left', weight: 900 }).set(tag, tagX + (learner ? 28 : 9), 27),
    );
    if (learner) this.root.addChild(new Label({ size: 13, color: '#d33a52', weight: 900 }).set(strings.learner, tagX + 14.5, 27));
    const title = wrapLines(lt.title, CARD_W - 150, 24, 800);
    const titleLook = { size: 24, color: unlocked ? C.text : C.muted, align: 'left', weight: 800 } as const;
    const lines = Math.min(2, title.length);
    for (let i = 0; i < lines; i++) this.root.addChild(new Label(titleLook).set(title[i]!, 34, 56 + i * 28));
    this.root.addChild(new Label({ size: 16, color: unlocked ? C.muted : C.amber, align: 'left', weight: 700 })
      .set(lt.location, 34, 56 + lines * 28, CARD_W - 150));

    this.sun = unlocked && lv.kind === 'deep' && lv.clockMode !== 'elapsed' && lv.id !== 'level9' && lv.id !== 'level12' ? new SunIcon(5.5, 8, 11.5) : null;
    this.arrow = unlocked ? this.openBadge(training) : null;
    if (!unlocked) {
      this.root.addChild(
        padlock(CARD_W - 34, 84),
        new Label({ size: 17, color: C.amberHi, align: 'left', weight: 700 })
          .set(fmt(strings.deliverToUnlock, { name: outstandingOrders(save, index) }), 34, CARD_H - 30, CARD_W - 110),
      );
      return;
    }

    this.root.addChild(new Label({ size: 15, color: C.muted, align: 'left', italic: true })
      .set(lt.blurb, 34, 78 + lines * 28, CARD_W - 145));

    const empty = starTexture(assets, 38, false);
    const full = starTexture(assets, 38, true);
    // three stars, plus the town pickup star where the map has a pickup
    for (let i = 0; i < levelStarCount(lv); i++) {
      const star = iconSprite(prog.stars[i] ? full : empty, 38);
      star.position.set(52 + i * 44, CARD_H - 32);
      this.root.addChild(star);
    }
    if (lv.kind === 'deep' && lv.clockMode !== 'elapsed') {
      const label = deadlineLabel(lv, fmtTime(lv.budgetSec), 'card');
      this.root.addChild(new Label({ size: 16, color: C.amberHi, align: 'right', weight: 800 }).set(label, CARD_W - 24, CARD_H - 44, CARD_W - 230));
      if (this.sun) {
        this.sun.root.position.set(CARD_W - 42 - measure(label, 16, 800), CARD_H - 43);
        this.root.addChild(this.sun.root);
      }
    } else {
      this.root.addChild(new Label({ size: 16, color: C.muted, align: 'right', weight: 700 })
        .set(fmt(strings.par, { time: fmtTime(lv.kind === 'deep' ? deepPar(lv) : lv.parSec) }), CARD_W - 24, CARD_H - 44));
    }
    this.root.addChild(new Label({ size: 15, color: C.amberHi, align: 'right', weight: 600 })
      .set(prog.bestTimeSec === null ? strings.notAttempted : fmt(strings.best, { time: fmtTime(prog.bestTimeSec) }), CARD_W - 24, CARD_H - 22));
  }

  private openBadge(training: boolean): Graphics {
    const badge = new Container();
    badge.position.set(CARD_W - 34, training ? 88 : 125);
    const backing = new Graphics().circle(0, 3, 18).fill('rgba(5,3,20,0.45)')
      .circle(0, 0, 18).fill(C.mint).stroke({ color: C.ink, width: 3 });
    const chevron = new Graphics().moveTo(-4, -7).lineTo(4, 0).lineTo(-4, 7)
      .stroke({ color: C.ink, width: 4, cap: 'round', join: 'round' });
    badge.addChild(backing, chevron);
    this.root.addChild(badge);
    return chevron;
  }

  sync(t: number, reduced: boolean): void {
    if (this.arrow) this.arrow.x = reduced ? 0 : Math.sin(t * 4 + this.index) * 2;
    this.sun?.sync(reduced ? 0 : t * 0.6);
    for (const photo of this.photos) photo.sync(t, reduced);
  }
}

class ConceptCard {
  readonly root = new Container();

  constructor(i: number) {
    const { missionConcepts, workOrders } = tr();
    const c = missionConcepts[i]!;
    const stripes = new Sprite(paintedTexture('workorders|concept-stripes', CARD_W, CARD_H, (g, w, h) => {
      g.beginPath();
      g.roundRect(0, 0, w, h, 22);
      g.clip();
      g.strokeStyle = 'rgba(124,255,203,0.05)';
      g.lineWidth = 14;
      g.beginPath();
      for (let k = -4; k < 12; k++) {
        g.moveTo(k * 60, 0);
        g.lineTo(k * 60 + h, h);
      }
      g.stroke();
    }));
    const blurb = new Paragraph({ size: 16, weight: 500, color: 'rgba(169,162,214,0.85)', align: 'left', italic: true, lineHeight: 22 });
    blurb.setBlock(c.blurb, 34, 92, CARD_W - 68);
    this.root.addChild(
      panelPath(new Graphics(), 0, 0, CARD_W, CARD_H, { fill: '#1a1440' }),
      stripes,
      new Label({ size: 14, weight: 900, color: C.amberHi, align: 'left' }).set(workOrders.missionConcept, 34, 32),
      new Label({ size: 24, weight: 800, color: C.muted, align: 'left' }).set(c.title, 34, 68, CARD_W - 68),
      blurb,
    );
  }
}

/** Asleep specimen, redacted on locked orders. */
class Mugshot {
  readonly root = new Container();
  private readonly head = new Container();
  private readonly z: Label;

  constructor(assets: Assets, key: string, x: number, y: number, private readonly unlocked: boolean, private readonly index: number, private readonly radius: number) {
    this.root.position.set(x, y);
    const r = radius;
    if (unlocked) this.root.addChild(new Glow(glowTexture(GLOW.mint), true).place(0, 0, r + 22, r + 22, 0.22));
    const rim = new Graphics().circle(0, 0, r).stroke({ color: unlocked ? C.mint : '#4a4470', width: 4 })
      .circle(0, 0, r + 3).stroke({ color: C.ink, width: 2 });
    const mask = new Graphics().circle(0, 0, r).fill('#ffffff');
    const art = artSprite(assets, key, 70 * r / 38, 80 * r / 38) ?? apeFallback(key, 70 * r / 38, 80 * r / 38) ?? crestValleyPortrait(key, 70 * r / 38, 80 * r / 38) ?? new Graphics().circle(0, -4 * r / 38, 26 * r / 38).fill('#d5a182');
    this.head.addChild(art);
    this.head.y = r * 0.21;
    this.head.alpha = unlocked ? 1 : 0.28;
    this.head.mask = mask;
    this.z = new Label({ size: 15, color: C.mint, weight: 900 }, 'z');
    this.root.addChild(new Graphics().circle(0, 0, r).fill(unlocked ? '#1b2f55' : '#171233'), mask, this.head, rim, this.z);
  }

  sync(t: number, reduced: boolean): void {
    const animate = this.unlocked && !reduced;
    this.head.rotation = -0.12 + (animate ? Math.sin(t * 1.8 + this.index * 2) * 0.06 : 0);
    this.z.visible = animate;
    if (animate) {
      const k = (t * 0.5 + this.index * 0.4) % 1;
      this.z.position.set(-this.radius + 2 - k * 6, -this.radius + 8 - k * 14);
      this.z.alpha = Math.sin(Math.PI * k);
      this.z.scale.set(1 + k * 0.4);
    }
  }
}

function padlock(x: number, y: number): Graphics {
  const g = new Graphics().arc(x, y - 6, 14, Math.PI, 0).stroke({ color: C.muted, width: 6 });
  panelPath(g, x - 22, y - 6, 44, 36, { fill: '#6b63a3', r: 8, lineW: 3, shadow: 0 });
  return g.circle(x, y + 8, 5).rect(x - 2, y + 8, 4, 12).fill(C.ink);
}
