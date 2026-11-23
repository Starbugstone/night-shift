import type { AbductResult, FlightResult, Scene } from '../contracts';
import { deepComment, sunriseMemo } from '../levels/humor';
import type { DeepRun } from '../levels/run';
import { VIEW_W } from '../contracts';
import { P_PUFF, P_RING, P_SPARK, P_STAR, P_TWINKLE, PC, Particles } from '../core/fx';
import type { Shell } from '../core/shell';
import { itemsPhrase, vrellComment } from '../levels/humor';
import { LEVELS, routeName } from '../levels/levels';
import { DEEP_STAR_LABELS, STAR_LABELS, countStars, type RunOutcome } from '../levels/progress';
import { drawGlorb, drawPortrait, drawStar, easeOutBack, easeOutCubic, fmtTime, panel, paragraph, roundRectPath, sprite, text } from './draw';
import { C } from './theme';
import { Button, drawNightSky } from './widgets';

// Timeline (seconds): rows tick in, the stamp slams, stars pop one by one, Glorbs count up,
// then Vrell stops writing and says his piece. Something is always landing.
const ROW_AT = 0.3;
const ROW_GAP = 0.11;
const STAMP_AT = 1.1;
const STAMP_FALL = 0.16;
const STAR_AT = 1.5;
const STAR_GAP = 0.28;
const GLORB_AT = STAR_AT + 3 * STAR_GAP + 0.05;
const GLORB_COUNT = 0.55;
const COMMENT_AT = GLORB_AT + GLORB_COUNT + 0.1;
const END = COMMENT_AT + 0.4;

// Card geometry
const CX = 24;
const CY = 28;
const CW = VIEW_W - 48;
const CH = 796;
const STAMP_Y = CY + 420;
const STAR_Y = CY + 546;
const GLORB_Y = CY + 636;

export interface ReportModel {
  /** Small line under the title. */
  subtitle: string;
  rows: Array<[string, string]>;
  stamp: 'delivered' | 'failed' | 'sunrise';
  starLabels: readonly string[];
  comment: string;
  delivered: boolean;
}

/** L1 / L2: one flight, one room. */
export function tutorialReport(levelIndex: number, abduct: AbductResult, flight: FlightResult, outcome: RunOutcome): ReportModel {
  const lv = LEVELS[levelIndex]!;
  const par = lv.kind === 'tutorial' ? lv.parSec : 0;
  const total = flight.timeSec + abduct.timeSec;
  return {
    subtitle: `Form 27-B/6 · Subject: ${lv.human} · Via: ${routeName(flight.roomId)}`,
    rows: [
      ['Total time', `${fmtTime(total)}  (fly ${fmtTime(flight.timeSec)} · beam ${fmtTime(abduct.timeSec)})`],
      ['Times bonked', String(abduct.bonks)],
      ['Dignity remaining', `${Math.round(Math.max(0, Math.min(100, abduct.dignity)))}%`],
      ['Snores recorded', String(abduct.snores)],
      ['Items stolen from Earth', itemsPhrase(abduct.itemsStolen)],
      ['Times spotted', String(flight.spotted)],
    ],
    stamp: abduct.delivered ? 'delivered' : 'failed',
    starLabels: STAR_LABELS,
    comment: vrellComment({ abduct, flight, parSec: par, stars: countStars(outcome.stars) }, outcome.save.reports),
    delivered: abduct.delivered,
  };
}

/** L3+: the whole shift. */
export function deepReport(run: DeepRun, outcome: RunOutcome): ReportModel {
  const lv = run.level;
  const sunrise = run.phase === 'sunrise';
  const names = run.order.map((i) => lv.map.targets[i]!.short).join(', ');
  const n = run.deliveredCount;
  const left = Math.max(0, lv.budgetSec - run.elapsed);
  return {
    subtitle: `Form 27-B/6 (bulk) · ${lv.location}`,
    rows: [
      ['Shift time', sunrise ? `ran out: sun up at ${lv.hours[1]}:00 AM` : `${fmtTime(run.elapsed)} used · ${fmtTime(left)} to spare`],
      ['Specimens delivered', `${n}/3${names ? `  (${names})` : ''}`],
      ['Times spotted', String(run.spotted)],
      ['Failed abductions', String(run.failedAbductions + run.aborts)],
      ['Times bonked', String(run.totals.bonks)],
      ['Avg. dignity remaining', n > 0 ? `${Math.round(run.totals.dignity / n)}%` : '—'],
      ['Items stolen from Earth', itemsPhrase(run.totals.items)],
    ],
    stamp: sunrise ? 'sunrise' : 'delivered',
    starLabels: DEEP_STAR_LABELS,
    comment: sunrise
      ? sunriseMemo(outcome.save.reports)
      : deepComment(
          { levelId: lv.id, stars: countStars(outcome.stars), spotted: run.spotted, failed: run.failedAbductions, bonks: run.totals.bonks, remaining: left, order: run.order },
          outcome.save.reports,
        ),
    delivered: !sunrise && n >= 3,
  };
}

export class ReportScene implements Scene {
  private t = 0;
  private played = { stamp: false, stars: [false, false, false], glorbs: false };
  private readonly retry = new Button(24, 846, 232, 84, 'Retry', 'secondary', 30);
  private readonly next = new Button(272, 846, 244, 84, 'Next', 'primary', 30);
  private readonly comment: string;
  private readonly rows: Array<[string, string]>;
  private readonly delivered: boolean;
  /** Star and Glorb bursts, drawn over the card. */
  private readonly fx = new Particles(64);
  /** Ink ring and paper dust from the stamp, drawn under it. */
  private readonly dust = new Particles(32);
  private shake = 0;
  private shownGlorbs = -1;
  /** Kicks on every Glorb tick: the coin hops. */
  private coinHop = 0;

  constructor(
    private readonly shell: Shell,
    private readonly levelIndex: number,
    private readonly model: ReportModel,
    private readonly outcome: RunOutcome,
  ) {
    this.comment = model.comment;
    this.rows = model.rows;
    this.delivered = model.delivered;
    const hasNext = levelIndex + 1 < LEVELS.length;
    this.next.label = model.delivered && hasNext ? 'Next' : 'Work orders';
    if (this.next.label.length > 6) this.next.size = 26;
  }

  update(dt: number): void {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt * 5);
    this.coinHop = Math.max(0, this.coinHop - dt * 7);
    this.fx.update(dt);
    this.dust.update(dt);
    const p = this.shell.ctx.pointer;
    const audio = this.shell.audio;
    const rm = this.shell.ctx.reducedMotion;
    const ready = this.t > 0.8;
    this.retry.enabled = ready;
    this.next.enabled = ready;
    if (this.retry.update(p, dt, audio)) return this.shell.toFlight(this.levelIndex);
    if (this.next.update(p, dt, audio)) {
      const n = this.levelIndex + 1;
      if (this.delivered && n < LEVELS.length) return this.shell.toMemo(n);
      return this.shell.toWorkOrders();
    }
    const skipped = p.pressed && !this.retry.contains(p.x, p.y) && !this.next.contains(p.x, p.y) && this.t < END;
    if (skipped) this.t = END;

    if (!this.played.stamp && this.t >= STAMP_AT) {
      this.played.stamp = true;
      audio.sfx('stamp');
      if (!this.delivered) audio.sfx('fail', 0.8);
      if (!skipped) {
        this.shake = 1;
        // ink ring and paper dust thrown out from under the stamp
        const ink = this.delivered ? PC.inkGreen : PC.inkRed;
        const dust = this.dust;
        dust.spawn(P_RING, VIEW_W / 2, STAMP_Y, 0, 0, 0.45, 210, ink);
        if (!rm) {
          for (let i = 0; i < 12; i++) {
            const side = i % 2 === 0 ? -1 : 1;
            const x = VIEW_W / 2 + side * (80 + dust.rnd() * 50);
            const y = STAMP_Y + (dust.rnd() - 0.5) * 90;
            dust.spawn(P_PUFF, x, y, side * (90 + dust.rnd() * 150), -30 - dust.rnd() * 80, 0.5 + dust.rnd() * 0.3, 13 + dust.rnd() * 9, PC.dust, 60, 2.4);
          }
          dust.burst(P_SPARK, VIEW_W / 2, STAMP_Y, 12, 420, 640, 0.34, 3.5, ink, 0, 3);
        }
      }
    }
    for (let i = 0; i < 3; i++) {
      if (!this.played.stars[i] && this.t >= STAR_AT + i * STAR_GAP) {
        this.played.stars[i] = true;
        if (this.outcome.stars[i]) {
          audio.sfx('lock_on', 0.5);
          if (!skipped) {
            const sx = VIEW_W / 2 + (i - 1) * 132;
            this.fx.spawn(P_RING, sx, STAR_Y, 0, 0, 0.4, 76, PC.amber);
            this.fx.burst(P_STAR, sx, STAR_Y, rm ? 3 : 6, 150, 280, 0.6, 9, PC.amber, 420, 1.2);
            if (!rm) this.fx.burst(P_TWINKLE, sx, STAR_Y, 5, 60, 160, 0.55, 9, PC.white, 0, 2);
          }
        }
      }
    }
    if (!this.played.glorbs && this.t >= GLORB_AT) {
      this.played.glorbs = true;
      if (this.delivered) audio.sfx('success', 0.7);
    }
    // Glorb counter ticks up (with a click per step, capped so big payouts don't machine-gun)
    if (this.t >= GLORB_AT) {
      const k = Math.min(1, (this.t - GLORB_AT) / GLORB_COUNT);
      const shown = Math.round(this.outcome.glorbs * easeOutCubic(k));
      if (shown !== this.shownGlorbs) {
        const first = this.shownGlorbs < 0;
        this.shownGlorbs = shown;
        if (!first && !skipped) {
          this.coinHop = 1;
          audio.sfx('click', 0.3);
          if (shown === this.outcome.glorbs && shown > 0 && !rm) {
            this.fx.burst(P_TWINKLE, VIEW_W / 2 - 74, GLORB_Y, 6, 60, 170, 0.55, 9, PC.mint, 0, 2);
          }
        }
      }
    }
  }

  render(g: CanvasRenderingContext2D): void {
    const { assets, ctx } = this.shell;
    const rm = ctx.reducedMotion;
    const t = this.t;
    drawNightSky(g, t, rm);
    g.save();
    if (this.shake > 0 && !rm) g.translate(Math.sin(t * 90) * 6 * this.shake, Math.cos(t * 70) * 4 * this.shake);
    const slide = rm ? 1 : easeOutCubic(t / 0.4);
    g.translate(0, (1 - slide) * 900);

    panel(g, CX, CY, CW, CH, C.paper, 18, C.ink, 4, 8);
    // perforated top
    g.fillStyle = C.night2;
    for (let x = CX + 20; x < CX + CW - 10; x += 26) {
      g.beginPath();
      g.arc(x, CY + 14, 5, 0, Math.PI * 2);
      g.fill();
    }
    text(g, 'SPECIMEN REPORT', VIEW_W / 2, CY + 52, 31, C.paperInk, 'center', 900);
    text(g, this.model.subtitle, VIEW_W / 2, CY + 83, 15, '#6f6597', 'center', 700, false, CW - 40);
    g.fillStyle = '#6a3fbf';
    g.fillRect(CX + 26, CY + 100, CW - 52, 3);

    // stats: each row slides in from the left
    for (let i = 0; i < this.rows.length; i++) {
      const at = ROW_AT + i * ROW_GAP;
      if (t < at) break;
      const a = Math.min(1, (t - at) / 0.16);
      const dx = rm ? 0 : (1 - easeOutCubic(a)) * -18;
      g.globalAlpha = a;
      const ry = CY + 128 + i * (this.rows.length > 6 ? 35 : 42);
      const [label, value] = this.rows[i]!;
      text(g, label, CX + 26 + dx, ry, 18, C.paperInk, 'left', 700);
      // the value squeezes into whatever the label leaves (long name lists on deep shifts)
      const room = CW - 52 - g.measureText(label).width - 14;
      text(g, value, CX + CW - 26 + dx, ry, i === 0 ? 16 : 19, '#4b2fa0', 'right', 800, false, room);
      g.fillStyle = C.paperLine;
      g.fillRect(CX + 26, ry + 19, CW - 52, 2);
      g.globalAlpha = 1;
    }

    // stamp: falls from above the page, lands with a squash, then settles
    this.dust.draw(g);
    if (t >= STAMP_AT - STAMP_FALL) {
      const fall = Math.min(1, (t - (STAMP_AT - STAMP_FALL)) / STAMP_FALL);
      const settle = Math.min(1, Math.max(0, (t - STAMP_AT) / 0.22));
      // 2.6× in the air → 0.88 on impact → overshoots back to 1
      const s = rm ? 1 : fall < 1 ? 2.6 - 1.72 * fall * fall : 0.88 + 0.12 * easeOutBack(settle, 3);
      g.save();
      g.translate(VIEW_W / 2, STAMP_Y);
      g.rotate(-0.16 + (rm ? 0 : (1 - fall) * 0.2));
      g.scale(s, s);
      g.globalAlpha = rm ? fall : 0.2 + 0.8 * fall * fall;
      const stamp = this.model.stamp;
      const key = stamp === 'delivered' ? 'ui/stamp_delivered' : stamp === 'sunrise' ? 'ui/stamp_sunrise' : 'ui/stamp_failed';
      if (!sprite(g, assets, key, 0, 0, 240, 120)) {
        const col = stamp === 'delivered' ? '#1f9a6c' : stamp === 'sunrise' ? '#d9782a' : '#d33a52';
        roundRectPath(g, -120, -46, 240, 92, 14);
        g.lineWidth = 8;
        g.strokeStyle = col;
        g.stroke();
        roundRectPath(g, -108, -35, 216, 70, 8);
        g.lineWidth = 3;
        g.stroke();
        text(g, stamp === 'delivered' ? 'DELIVERED' : stamp === 'sunrise' ? 'SUNRISE' : 'REJECTED', 0, 2, 40, col, 'center', 900);
      }
      g.restore();
    }

    // stars
    for (let i = 0; i < 3; i++) {
      const sx = VIEW_W / 2 + (i - 1) * 132;
      const at = STAR_AT + i * STAR_GAP;
      const earned = this.outcome.stars[i] === true;
      const age = t - at;
      const k = age >= 0 ? (rm ? 1 : easeOutBack(age / 0.32, 2.6)) : 0;
      drawStar(g, assets, sx, STAR_Y, 66, false);
      if (earned && k > 0) {
        g.save();
        g.translate(sx, STAR_Y);
        g.rotate(rm ? 0 : (1 - Math.min(1, age / 0.32)) * -0.5);
        g.scale(k, k);
        drawStar(g, assets, 0, 0, 66, true);
        g.restore();
        if (this.outcome.newStarFlags[i] && age >= 0.2) {
          const pop = rm ? 1 : easeOutBack((age - 0.2) / 0.2);
          g.save();
          g.translate(sx + 32, STAR_Y - 36);
          g.rotate(0.2);
          g.scale(pop, pop);
          panel(g, -25, -11, 50, 22, C.red, 11, C.ink, 2, 0);
          text(g, 'NEW!', 0, 1, 13, '#ffffff', 'center', 900);
          g.restore();
        }
      } else if (!earned && age > 0 && age < 0.3 && !rm) {
        // a missed star gives a little shrug
        g.globalAlpha = 1 - age / 0.3;
        text(g, '—', sx, STAR_Y - 44 - age * 30, 18, '#9a92bf', 'center', 900);
        g.globalAlpha = 1;
      }
      text(g, this.model.starLabels[i]!, sx, STAR_Y + 46, 16, earned && k > 0 ? C.paperInk : '#9a92bf', 'center', 800);
    }

    // glorbs: the payout sits in its own pill and counts up
    if (t >= GLORB_AT) {
      const got = this.outcome.glorbs > 0;
      const a = Math.min(1, (t - GLORB_AT) / 0.15);
      g.globalAlpha = a;
      roundRectPath(g, VIEW_W / 2 - 122, GLORB_Y - 25, 244, 50, 25);
      g.fillStyle = got ? 'rgba(31,154,108,0.14)' : 'rgba(154,146,191,0.14)';
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = got ? 'rgba(31,154,108,0.45)' : 'rgba(154,146,191,0.4)';
      g.stroke();
      const hop = rm ? 0 : this.coinHop;
      drawGlorb(g, assets, VIEW_W / 2 - 74, GLORB_Y - 1 - hop * 7, 40 + hop * 5);
      text(g, `+${Math.max(0, this.shownGlorbs)} Glorbs`, VIEW_W / 2 - 46, GLORB_Y, 26 + hop * 1.5, got ? '#1f9a6c' : '#9a92bf', 'left', 900);
      g.globalAlpha = 1;
      let extra = '';
      if (this.outcome.rankAfter.title !== this.outcome.rankBefore.title) extra = `PROMOTED: ${this.outcome.rankAfter.title}!`;
      else if (this.outcome.unlockedNext) extra = 'New work order unlocked!';
      if (extra && t >= GLORB_AT + GLORB_COUNT) {
        const pop = rm ? 1 : easeOutBack((t - GLORB_AT - GLORB_COUNT) / 0.25);
        g.save();
        g.translate(VIEW_W / 2, GLORB_Y + 39);
        g.scale(pop, pop);
        text(g, extra, 0, 0, 17, '#c0622a', 'center', 900, false, CW - 60);
        g.restore();
      }
    }

    // Vrell: at his desk from the start, scribbling until the numbers are in
    const vrellIn = rm ? 1 : easeOutCubic((t - 0.45) / 0.3);
    if (vrellIn > 0) {
      g.globalAlpha = vrellIn;
      const writing = t < COMMENT_AT;
      drawPortrait(g, assets, 'vrell', CX + 58, CY + 734 + (writing && !rm ? Math.sin(t * 9) * 1.2 : 0), 76, t);
      panel(g, CX + 108, CY + 690, CW - 128, 92, '#ffffff', 14, '#cfc6e6', 2, 0);
      // bubble tail towards Vrell
      g.beginPath();
      g.moveTo(CX + 110, CY + 722);
      g.lineTo(CX + 98, CY + 734);
      g.lineTo(CX + 110, CY + 744);
      g.closePath();
      g.fillStyle = '#ffffff';
      g.fill();
      if (writing) {
        for (let i = 0; i < 3; i++) {
          const up = rm ? 0 : Math.max(0, Math.sin(t * 7 - i * 0.9)) * 6;
          g.beginPath();
          g.arc(CX + 136 + i * 18, CY + 736 - up, 5, 0, Math.PI * 2);
          g.fillStyle = '#b3a9d6';
          g.fill();
        }
      } else {
        g.globalAlpha = vrellIn * Math.min(1, (t - COMMENT_AT) / 0.25);
        paragraph(g, this.comment, CX + 122, CY + 696, CW - 154, 16, C.paperInk, 21, 'left', 600, true);
      }
      g.globalAlpha = 1;
    }

    this.fx.draw(g);
    g.restore();

    if (slide >= 1) {
      this.retry.render(g);
      this.next.render(g);
    }
    if (t < END) text(g, 'tap to skip', VIEW_W / 2, 940, 13, C.muted, 'center', 600);
  }
}
