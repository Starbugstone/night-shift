import type { AbductResult, FlightResult, Scene } from '../contracts';
import { VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { itemsPhrase, vrellComment } from '../levels/humor';
import { LEVELS } from '../levels/levels';
import { STAR_LABELS, countStars, type RunOutcome } from '../levels/progress';
import { drawGlorb, drawPortrait, drawStar, easeOutBack, easeOutCubic, fmtTime, panel, paragraph, roundRectPath, sprite, text } from './draw';
import { C } from './theme';
import { Button, drawNightSky } from './widgets';

const STAMP_AT = 1.25;
const STAR_AT = 1.8;
const STAR_GAP = 0.32;
const GLORB_AT = STAR_AT + 3 * STAR_GAP + 0.1;
const COMMENT_AT = GLORB_AT + 0.35;
const END = COMMENT_AT + 0.4;

export class ReportScene implements Scene {
  private t = 0;
  private played = { stamp: false, stars: [false, false, false], glorbs: false };
  private readonly retry = new Button(24, 846, 232, 84, 'Retry', 'secondary', 30);
  private readonly next = new Button(272, 846, 244, 84, 'Next', 'primary', 30);
  private readonly comment: string;
  private readonly rows: Array<[string, string]>;
  private shake = 0;

  constructor(
    private readonly shell: Shell,
    private readonly levelIndex: number,
    private readonly abduct: AbductResult,
    private readonly flight: FlightResult,
    private readonly outcome: RunOutcome,
  ) {
    const lv = LEVELS[levelIndex]!;
    this.comment = vrellComment(
      { abduct, flight, parSec: lv.parSec, stars: countStars(outcome.stars) },
      outcome.save.reports,
    );
    const total = flight.timeSec + abduct.timeSec;
    this.rows = [
      ['Total time', `${fmtTime(total)}  (fly ${fmtTime(flight.timeSec)} · beam ${fmtTime(abduct.timeSec)})`],
      ['Times bonked', String(abduct.bonks)],
      ['Dignity remaining', `${Math.round(Math.max(0, Math.min(100, abduct.dignity)))}%`],
      ['Snores recorded', String(abduct.snores)],
      ['Items stolen from Earth', itemsPhrase(abduct.itemsStolen)],
      ['Times spotted', String(flight.spotted)],
    ];
    const hasNext = levelIndex + 1 < LEVELS.length;
    this.next.label = abduct.delivered && hasNext ? 'Next' : 'Work orders';
    if (this.next.label.length > 6) this.next.size = 26;
  }

  update(dt: number): void {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt * 5);
    const p = this.shell.ctx.pointer;
    const audio = this.shell.audio;
    const ready = this.t > 0.8;
    this.retry.enabled = ready;
    this.next.enabled = ready;
    if (this.retry.update(p, dt, audio)) return this.shell.toFlight(this.levelIndex);
    if (this.next.update(p, dt, audio)) {
      const n = this.levelIndex + 1;
      if (this.abduct.delivered && n < LEVELS.length) return this.shell.toMemo(n);
      return this.shell.toWorkOrders();
    }
    if (p.pressed && !this.retry.contains(p.x, p.y) && !this.next.contains(p.x, p.y) && this.t < END) this.t = END;

    if (!this.played.stamp && this.t >= STAMP_AT) {
      this.played.stamp = true;
      audio.sfx('stamp');
      this.shake = 1;
      if (!this.abduct.delivered) audio.sfx('fail', 0.8);
    }
    for (let i = 0; i < 3; i++) {
      if (!this.played.stars[i] && this.t >= STAR_AT + i * STAR_GAP) {
        this.played.stars[i] = true;
        if (this.outcome.stars[i]) audio.sfx('lock_on', 0.5);
      }
    }
    if (!this.played.glorbs && this.t >= GLORB_AT) {
      this.played.glorbs = true;
      if (this.abduct.delivered) audio.sfx('success', 0.7);
    }
  }

  render(g: CanvasRenderingContext2D): void {
    const { assets, ctx } = this.shell;
    const rm = ctx.reducedMotion;
    const lv = LEVELS[this.levelIndex]!;
    drawNightSky(g, this.t, rm);
    g.save();
    if (this.shake > 0 && !rm) g.translate(Math.sin(this.t * 90) * 6 * this.shake, Math.cos(this.t * 70) * 4 * this.shake);
    const slide = rm ? 1 : easeOutCubic(this.t / 0.4);
    g.translate(0, (1 - slide) * 900);

    const cx = 24;
    const cy = 28;
    const cw = VIEW_W - 48;
    const ch = 796;
    panel(g, cx, cy, cw, ch, C.paper, 18, C.ink, 4, 8);
    // perforated top
    g.fillStyle = C.night2;
    for (let x = cx + 20; x < cx + cw - 10; x += 26) {
      g.beginPath();
      g.arc(x, cy + 14, 5, 0, Math.PI * 2);
      g.fill();
    }
    text(g, 'SPECIMEN REPORT', VIEW_W / 2, cy + 50, 30, C.paperInk, 'center', 900);
    const route = lv.map.entries.find((e) => e.roomId === this.flight.roomId)?.route ?? '—';
    text(g, `Form 27-B/6 · Subject: ${lv.human} · Via: ${route}`, VIEW_W / 2, cy + 82, 15, '#6f6597', 'center', 700);

    // stats
    for (let i = 0; i < this.rows.length; i++) {
      const at = 0.35 + i * 0.12;
      if (this.t < at) break;
      const a = Math.min(1, (this.t - at) / 0.15);
      g.globalAlpha = a;
      const ry = cy + 124 + i * 42;
      const [label, value] = this.rows[i]!;
      text(g, label, cx + 26, ry, 18, C.paperInk, 'left', 700);
      text(g, value, cx + cw - 26, ry, i === 0 ? 16 : 19, '#4b2fa0', 'right', 800);
      g.fillStyle = C.paperLine;
      g.fillRect(cx + 26, ry + 19, cw - 52, 2);
      g.globalAlpha = 1;
    }

    // stamp
    if (this.t >= STAMP_AT - 0.18) {
      const k = Math.min(1, (this.t - (STAMP_AT - 0.18)) / 0.18);
      const s = rm ? 1 : 2.4 - 1.4 * k;
      g.save();
      g.translate(VIEW_W / 2, cy + 412);
      g.rotate(-0.16);
      g.scale(s, s);
      g.globalAlpha = 0.25 + 0.75 * k;
      const key = this.abduct.delivered ? 'ui/stamp_delivered' : 'ui/stamp_failed';
      if (!sprite(g, assets, key, 0, 0, 240, 120)) {
        const col = this.abduct.delivered ? '#1f9a6c' : '#d33a52';
        roundRectPath(g, -120, -46, 240, 92, 14);
        g.lineWidth = 8;
        g.strokeStyle = col;
        g.stroke();
        roundRectPath(g, -108, -35, 216, 70, 8);
        g.lineWidth = 3;
        g.stroke();
        text(g, this.abduct.delivered ? 'DELIVERED' : 'REJECTED', 0, 2, 40, col, 'center', 900);
      }
      g.restore();
    }

    // stars
    const sy = cy + 540;
    for (let i = 0; i < 3; i++) {
      const sx = VIEW_W / 2 + (i - 1) * 132;
      const at = STAR_AT + i * STAR_GAP;
      const earned = this.outcome.stars[i] === true;
      const k = this.t >= at ? (rm ? 1 : easeOutBack((this.t - at) / 0.3)) : 0;
      drawStar(g, assets, sx, sy, 66, false);
      if (earned && k > 0) {
        g.save();
        g.translate(sx, sy);
        g.scale(k, k);
        drawStar(g, assets, 0, 0, 66, true);
        g.restore();
        if (this.outcome.newStarFlags[i] && this.t >= at + 0.2) text(g, 'NEW!', sx + 30, sy - 34, 14, C.red, 'center', 900);
      }
      text(g, STAR_LABELS[i]!, sx, sy + 46, 16, earned && k > 0 ? C.paperInk : '#9a92bf', 'center', 800);
    }

    // glorbs
    if (this.t >= GLORB_AT) {
      const k = Math.min(1, (this.t - GLORB_AT) / 0.35);
      const shown = Math.round(this.outcome.glorbs * k);
      drawGlorb(g, assets, VIEW_W / 2 - 74, cy + 630, 40);
      text(g, `+${shown} Glorbs`, VIEW_W / 2 - 46, cy + 631, 26, this.outcome.glorbs > 0 ? '#1f9a6c' : '#9a92bf', 'left', 900);
      let extra = '';
      if (this.outcome.rankAfter.title !== this.outcome.rankBefore.title) extra = `PROMOTED: ${this.outcome.rankAfter.title}!`;
      else if (this.outcome.unlockedNext) extra = 'New work order unlocked!';
      if (extra) text(g, extra, VIEW_W / 2, cy + 666, 18, '#c0622a', 'center', 900);
    }

    // Vrell comment
    if (this.t >= COMMENT_AT) {
      g.globalAlpha = Math.min(1, (this.t - COMMENT_AT) / 0.3);
      drawPortrait(g, assets, 'vrell', cx + 58, cy + 734, 76, this.t);
      panel(g, cx + 108, cy + 690, cw - 128, 92, '#ffffff', 14, '#cfc6e6', 2, 0);
      paragraph(g, this.comment, cx + 120, cy + 694, cw - 152, 16, C.paperInk, 21, 'left', 600, true);
      g.globalAlpha = 1;
    }
    g.restore();

    if (slide >= 1) {
      this.retry.render(g);
      this.next.render(g);
    }
    if (this.t < END) text(g, 'tap to skip', VIEW_W / 2, 940, 13, C.muted, 'center', 600);
  }
}
