import type { Scene } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { LEVELS } from '../levels/levels';
import { MAX_STARS, RANKS, isLevelUnlocked, nextRank, rankFor, totalStars, type Rank } from '../levels/progress';
import { fmt, langVersion, tr } from '../i18n';
import { GLOW, drawGlow, easeOutCubic } from '../core/fx';
import { clamp, drawGlorb, drawStar, fmtTime, headKey, outlinedText, panel, panelHighlight, paragraph, roundRectPath, sprite, text, wrap } from './draw';
import { C, font } from './theme';
import { Button, drawNightSky } from './widgets';

const LIST_TOP = 262;
const CARD_X = 24;
const CARD_W = VIEW_W - 48;
const CARD_H = 184;
const GAP = 20;

/** Rank title and flavour in the current language. */
function rankText(r: Rank): { title: string; flavour: string } {
  return tr().ranks[RANKS.indexOf(r)] ?? r;
}

interface Card {
  kind: 'level' | 'concept';
  index: number;
  shake: number;
}

export class WorkOrdersScene implements Scene {
  private t = 0;
  private scroll = 0;
  private vel = 0;
  private dragging = false;
  private pressY = 0;
  private pressScroll = 0;
  private lastY = 0;
  private tracking = false;
  private toast = '';
  private toastT = 0;
  private readonly back = new Button(16, 18, 64, 60, '‹', 'ghost', 40);
  private readonly upgrades = new Button(336, 186, 180, 60, tr().workOrders.upgrades, 'amber', 24);
  private readonly cards: Card[] = [];
  private headerGrad: CanvasGradient | null = null;

  constructor(private readonly shell: Shell) {
    for (let i = 0; i < LEVELS.length; i++) this.cards.push({ kind: 'level', index: i, shake: 0 });
    for (let i = 0; i < tr().missionConcepts.length; i++) this.cards.push({ kind: 'concept', index: i, shake: 0 });
  }

  private get maxScroll(): number {
    const content = this.cards.length * (CARD_H + GAP) + 40;
    return Math.max(0, content - (VIEW_H - LIST_TOP));
  }

  update(dt: number): void {
    this.t += dt;
    const p = this.shell.ctx.pointer;
    const audio = this.shell.audio;
    if (this.back.update(p, dt, audio)) return this.shell.toTitle();
    if (this.upgrades.update(p, dt, audio)) return this.shell.toUpgrades();

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

  private tap(x: number, contentY: number): void {
    if (x < CARD_X || x > CARD_X + CARD_W) return;
    const i = Math.floor(contentY / (CARD_H + GAP));
    const within = contentY - i * (CARD_H + GAP);
    if (i < 0 || i >= this.cards.length || within > CARD_H) return;
    const card = this.cards[i]!;
    if (card.kind === 'concept') return;
    if (isLevelUnlocked(this.shell.save, card.index)) {
      this.shell.audio.sfx('click');
      this.shell.toMemo(card.index);
      return;
    }
    card.shake = 1;
    this.shell.audio.sfx('bonk', 0.4);
    const w = tr().workOrders;
    const prev = LEVELS[card.index - 1];
    this.toast = fmt(w.deliverFirst, { name: prev ? tr().levels[prev.id].human : w.lastSpecimen });
    this.toastT = 2.4;
  }

  render(g: CanvasRenderingContext2D): void {
    const { save, assets } = this.shell;
    const rm = this.shell.ctx.reducedMotion;
    drawNightSky(g, this.t, rm);

    // ---- list (clipped below header)
    g.save();
    g.beginPath();
    g.rect(0, LIST_TOP - 8, VIEW_W, VIEW_H - LIST_TOP + 8);
    g.clip();
    for (let i = 0; i < this.cards.length; i++) {
      const y = LIST_TOP + i * (CARD_H + GAP) - this.scroll;
      if (y > VIEW_H || y + CARD_H < LIST_TOP - 20) continue;
      const c = this.cards[i]!;
      const sx = c.shake > 0 && !rm ? Math.sin(c.shake * 40) * 10 * c.shake : 0;
      // cards deal in from below, one after another
      const deal = rm ? 1 : easeOutCubic((this.t - 0.05 - i * 0.07) / 0.32);
      if (deal <= 0) continue;
      g.globalAlpha = deal;
      const dy = (1 - deal) * 46;
      if (c.kind === 'level') this.levelCard(g, c.index, CARD_X + sx, y + dy);
      else this.conceptCard(g, c.index, CARD_X, y + dy);
      g.globalAlpha = 1;
    }
    g.restore();

    // ---- header
    if (!this.headerGrad) {
      this.headerGrad = g.createLinearGradient(0, 0, 0, LIST_TOP);
      this.headerGrad.addColorStop(0, '#0d0924');
      this.headerGrad.addColorStop(1, '#171038');
    }
    g.fillStyle = this.headerGrad;
    g.fillRect(0, 0, VIEW_W, LIST_TOP - 6);
    g.fillStyle = 'rgba(124,255,203,0.25)';
    g.fillRect(0, LIST_TOP - 8, VIEW_W, 2);
    this.back.render(g);
    const w = tr().workOrders;
    // clear of the back button on the left
    outlinedText(g, w.title, VIEW_W / 2 + 20, 48, 38, C.mint, C.ink, 900, 'center', VIEW_W - 150);
    text(g, w.subtitle, VIEW_W / 2 + 20, 80, 17, C.muted, 'center', 600, false, VIEW_W - 150);

    const stars = totalStars(save);
    const rank = rankText(rankFor(stars));
    panel(g, 24, 100, VIEW_W - 48, 76, C.panel, 18, C.ink, 3, 4);
    panelHighlight(g, 24, 100, VIEW_W - 48, 18);
    text(g, w.rank, 44, 120, 14, C.muted, 'left', 800);
    text(g, rank.title, 44, 146, rank.title.length > 16 ? 22 : 26, C.text, 'left', 800, false, 384 - 44 - 12);
    // glorb purse, set into the rank panel
    roundRectPath(g, 384, 114, 118, 48, 24);
    g.fillStyle = 'rgba(18,13,43,0.55)';
    g.fill();
    drawGlorb(g, assets, 410, 138, 38);
    text(g, String(save.glorbs), 434, 139, 26, C.mint, 'left', 800, false, 62);
    const nr = nextRank(stars);
    // Left column under the rank panel stops short of the Upgrades button.
    const colW = this.upgrades.x - 44 - 12;
    text(g, fmt(w.stars, { n: stars, max: MAX_STARS }), 44, 198, 22, C.amberHi, 'left', 800);
    if (nr) {
      text(g, fmt(w.nextRank, { n: nr.minStars }), 44, 224, 15, C.muted, 'left', 700, false, colW);
      text(g, rank.flavour, 44, 244, 14, 'rgba(169,162,214,0.8)', 'left', 600, true, colW);
    } else text(g, rank.flavour, 44, 232, 15, C.muted, 'left', 600, true, colW);
    this.upgrades.render(g);

    if (this.toastT > 0) {
      const a = Math.min(1, this.toastT * 3);
      g.globalAlpha = a;
      const lines = wrap(g, this.toast, VIEW_W - 100, 20, 700);
      const h = 30 + lines.length * 26;
      panel(g, 30, VIEW_H - 40 - h, VIEW_W - 60, h, C.ink, 18, C.amber, 3, 0);
      paragraph(g, this.toast, 50, VIEW_H - 40 - h + 15, VIEW_W - 100, 20, C.amberHi, 26, 'center', 700);
      g.globalAlpha = 1;
    }
  }

  private levelCard(g: CanvasRenderingContext2D, i: number, x: number, y: number): void {
    const { save, assets } = this.shell;
    const lv = LEVELS[i]!;
    const unlocked = isLevelUnlocked(save, i);
    const prog = save.levels[lv.id];
    const w = tr().workOrders;
    const lt = tr().levels[lv.id];
    panel(g, x, y, CARD_W, CARD_H, unlocked ? C.panel : '#211a4a', 22, C.ink, 4, 6);
    panelHighlight(g, x, y, CARD_W, 22, unlocked ? 0.14 : 0.07);
    const training = lv.kind === 'tutorial';
    // spine: mint for training, hot for the real shifts
    roundRectPath(g, x + 4, y + 4, 12, CARD_H - 8, 6);
    g.fillStyle = !unlocked ? '#4a4470' : training ? C.mint : C.amber;
    g.fill();
    if (unlocked && !training) {
      roundRectPath(g, x + 4, y + 4 + (CARD_H - 8) * 0.5, 12, (CARD_H - 8) * 0.5, 6);
      g.fillStyle = C.red;
      g.fill();
    }
    if (lv.kind === 'deep') {
      // three specimens on this order: three mugshots
      const cx = x + CARD_W - 66;
      const cy = y + 60;
      const tg = lv.map.targets;
      this.mugshot(g, headKey(tg[0].short), cx - 26, cy - 14, unlocked, i, 25);
      this.mugshot(g, headKey(tg[1].short), cx + 24, cy - 16, unlocked, i + 1, 25);
      this.mugshot(g, headKey(tg[2].short), cx - 2, cy + 24, unlocked, i + 2, 25);
    } else this.mugshot(g, lv.mugshot, x + CARD_W - 62, y + 58, unlocked, i, 38);
    const orderNo = fmt(w.orderNo, { num: lv.num });
    text(g, orderNo, x + 34, y + 26, 14, unlocked ? C.mint : C.muted, 'left', 800);
    g.font = font(14, 800);
    const tagX = x + 44 + g.measureText(orderNo).width;
    const tag = training ? w.training : w.deepShift;
    g.font = font(13, 900);
    const tw = g.measureText(tag).width + (training ? 40 : 18);
    roundRectPath(g, tagX, y + 14, tw, 24, 12);
    g.fillStyle = training ? 'rgba(124,255,203,0.16)' : 'rgba(255,93,115,0.24)';
    g.fill();
    g.lineWidth = 1.5;
    g.strokeStyle = training ? 'rgba(124,255,203,0.6)' : 'rgba(255,138,154,0.75)';
    g.stroke();
    if (training) {
      // a learner plate
      roundRectPath(g, tagX + 6, y + 18, 17, 16, 3);
      g.fillStyle = '#f4efe2';
      g.fill();
      text(g, w.learner, tagX + 14.5, y + 27, 13, '#d33a52', 'center', 900);
    }
    text(g, tag, tagX + (training ? 28 : 9), y + 27, 13, training ? C.mint : '#ffa3b0', 'left', 900);
    const titleLines = wrap(g, lt.title, CARD_W - 150, 24, 800);
    g.font = font(24, 800);
    g.fillStyle = unlocked ? C.text : C.muted;
    g.textAlign = 'left';
    for (let k = 0; k < Math.min(2, titleLines.length); k++) g.fillText(titleLines[k]!, x + 34, y + 56 + k * 28);
    const ty = y + 56 + Math.min(2, titleLines.length) * 28;
    text(g, unlocked ? lt.location : w.locked, x + 34, ty, 16, unlocked ? C.muted : C.amber, 'left', 700, false, CARD_W - 150);
    if (unlocked) {
      for (let s = 0; s < 3; s++) drawStar(g, assets, x + 52 + s * 44, y + CARD_H - 32, 38, prog.stars[s] === true);
      if (lv.kind === 'deep') {
        const label = this.sunriseLabel(lv.budgetSec);
        text(g, label, x + CARD_W - 24, y + CARD_H - 44, 16, C.amberHi, 'right', 800);
        // a small sun coming up beside it
        const sx = x + CARD_W - 42 - g.measureText(label).width;
        const sy = y + CARD_H - 43;
        g.strokeStyle = C.amberHi;
        g.lineWidth = 2;
        g.lineCap = 'round';
        g.beginPath();
        const turn = this.shell.ctx.reducedMotion ? 0 : this.t * 0.6;
        for (let k = 0; k < 8; k++) {
          const a = turn + (k * Math.PI) / 4;
          g.moveTo(sx + Math.cos(a) * 8, sy + Math.sin(a) * 8);
          g.lineTo(sx + Math.cos(a) * 11.5, sy + Math.sin(a) * 11.5);
        }
        g.stroke();
        g.lineCap = 'butt';
        g.beginPath();
        g.arc(sx, sy, 5.5, 0, Math.PI * 2);
        g.fillStyle = C.amberHi;
        g.fill();
      } else text(g, fmt(w.par, { time: fmtTime(lv.parSec) }), x + CARD_W - 24, y + CARD_H - 44, 16, C.muted, 'right', 700);
      text(g, prog.bestTimeSec !== null ? fmt(w.best, { time: fmtTime(prog.bestTimeSec) }) : w.notAttempted, x + CARD_W - 24, y + CARD_H - 22, 15, C.amberHi, 'right', 600);
      // "open" badge on the mugshot
      const pulse = this.shell.ctx.reducedMotion ? 0 : Math.sin(this.t * 4 + i) * 2;
      const bx = x + CARD_W - 34;
      const by = lv.kind === 'deep' ? y + 96 : y + 88;
      g.beginPath();
      g.arc(bx, by + 3, 18, 0, Math.PI * 2);
      g.fillStyle = 'rgba(5,3,20,0.45)';
      g.fill();
      g.beginPath();
      g.arc(bx, by, 18, 0, Math.PI * 2);
      g.fillStyle = C.mint;
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = C.ink;
      g.stroke();
      g.lineWidth = 4;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(bx - 4 + pulse, by - 7);
      g.lineTo(bx + 4 + pulse, by);
      g.lineTo(bx - 4 + pulse, by + 7);
      g.stroke();
      g.lineCap = 'butt';
    } else {
      this.padlock(g, x + CARD_W - 34, y + 84);
      const prev = LEVELS[i - 1];
      text(g, fmt(w.deliverToUnlock, { name: prev ? tr().levels[prev.id].human : '…' }), x + 34, y + CARD_H - 30, 17, C.amberHi, 'left', 700, false, CARD_W - 110);
    }
  }

  private conceptCard(g: CanvasRenderingContext2D, i: number, x: number, y: number): void {
    const { missionConcepts, workOrders } = tr();
    const c = missionConcepts[i]!;
    panel(g, x, y, CARD_W, CARD_H, '#1a1440', 22, C.ink, 4, 6);
    g.save();
    roundRectPath(g, x, y, CARD_W, CARD_H, 22);
    g.clip();
    g.strokeStyle = 'rgba(124,255,203,0.05)';
    g.lineWidth = 14;
    for (let k = -4; k < 12; k++) {
      g.beginPath();
      g.moveTo(x + k * 60, y);
      g.lineTo(x + k * 60 + CARD_H, y + CARD_H);
      g.stroke();
    }
    g.restore();
    text(g, workOrders.missionConcept, x + 34, y + 32, 14, C.amberHi, 'left', 900);
    text(g, c.title, x + 34, y + 68, 24, C.muted, 'left', 800, false, CARD_W - 68);
    paragraph(g, c.blurb, x + 34, y + 92, CARD_W - 68, 16, 'rgba(169,162,214,0.85)', 22, 'left', 500, true);
  }

  /** Round mugshot of the specimen, asleep. Locked orders show a redacted silhouette. */
  private mugshot(g: CanvasRenderingContext2D, key: string, cx: number, cy: number, unlocked: boolean, i: number, r: number): void {
    const { assets, ctx } = this.shell;
    if (unlocked) {
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.mint, cx, cy, r + 22, r + 22, 0.22);
      g.globalCompositeOperation = 'source-over';
    }
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fillStyle = unlocked ? '#1b2f55' : '#171233';
    g.fill();
    g.save();
    g.clip();
    // snoring: the head rocks a little
    const rock = ctx.reducedMotion || !unlocked ? 0 : Math.sin(this.t * 1.8 + i * 2) * 0.06;
    g.translate(cx, cy + r * 0.21);
    g.rotate(-0.12 + rock);
    g.scale(r / 38, r / 38);
    if (!unlocked) g.globalAlpha *= 0.28;
    if (!sprite(g, assets, key, 0, 0, 70, 80)) {
      g.beginPath();
      g.arc(0, -4, 26, 0, Math.PI * 2);
      g.fillStyle = '#d5a182';
      g.fill();
    }
    g.restore();
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.lineWidth = 4;
    g.strokeStyle = unlocked ? C.mint : '#4a4470';
    g.stroke();
    g.lineWidth = 2;
    g.strokeStyle = C.ink;
    g.beginPath();
    g.arc(cx, cy, r + 3, 0, Math.PI * 2);
    g.stroke();
    if (unlocked && !ctx.reducedMotion) {
      // a little z drifting off the mugshot
      const k = (this.t * 0.5 + i * 0.4) % 1;
      const alpha = g.globalAlpha;
      g.globalAlpha = alpha * Math.sin(Math.PI * k);
      text(g, 'z', cx - r + 2 - k * 6, cy - r + 8 - k * 14, 15 + k * 6, C.mint, 'center', 900);
      g.globalAlpha = alpha;
    }
  }

  private readonly sunriseLabels = new Map<string, string>();
  private sunriseLabel(sec: number): string {
    const key = `${langVersion()}|${sec}`;
    let s = this.sunriseLabels.get(key);
    if (!s) {
      s = fmt(tr().workOrders.sunriseIn, { time: fmtTime(sec) });
      this.sunriseLabels.set(key, s);
    }
    return s;
  }

  private padlock(g: CanvasRenderingContext2D, cx: number, cy: number): void {
    g.strokeStyle = C.muted;
    g.lineWidth = 6;
    g.beginPath();
    g.arc(cx, cy - 6, 14, Math.PI, 0);
    g.stroke();
    panel(g, cx - 22, cy - 6, 44, 36, '#6b63a3', 8, C.ink, 3, 0);
    g.fillStyle = C.ink;
    g.beginPath();
    g.arc(cx, cy + 8, 5, 0, Math.PI * 2);
    g.fill();
    g.fillRect(cx - 2, cy + 8, 4, 12);
  }
}
