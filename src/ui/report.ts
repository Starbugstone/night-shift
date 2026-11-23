import type { AbductResult, FlightResult, Scene } from '../contracts';
import { deepComment, sunriseMemo } from '../levels/humor';
import type { DeepRun } from '../levels/run';
import { VIEW_W } from '../contracts';
import { P_PUFF, P_RING, P_SPARK, P_STAR, P_TWINKLE, PC, Particles } from '../core/fx';
import type { Shell } from '../core/shell';
import { itemsPhrase, vrellComment } from '../levels/humor';
import { LEVELS } from '../levels/levels';
import { RANKS, countStars, type RunOutcome } from '../levels/progress';
import { fmt, gt, localArt, tr } from '../i18n';
import { drawGlorb, drawPortrait, drawStar, easeOutBack, easeOutCubic, fmtTime, panel, paragraph, roundRectPath, sprite, text, wrap } from './draw';
import { coverStory, tabloidHeadline } from './report-extras';
import { CH, CW, CX, CY, GLORB_Y, STAR_Y, layoutReport, type ReportLayout, type TextBlock } from './report-layout';
import { drawIdPhoto, fitPhoto, WINDOW, type Photo, type PhotoFit } from './report-photo';
import { C, font } from './theme';
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
// v3: the ID card slides in just before the stamp, the cover story is typed after it, the tabloid
// clipping slaps down last (only when the saucer was seen twice or more).
const PHOTO_AT = STAMP_AT - 0.3;
const APPROVED_AT = STAMP_AT + 0.2;
const COVER_AT = STAMP_AT + 0.3;
const TABLOID_AT = COMMENT_AT + 0.2;
const TABLOID_END = TABLOID_AT + 0.45;

export interface ReportModel {
  /** Small line under the title. */
  subtitle: string;
  rows: Array<[string, string]>;
  stamp: 'delivered' | 'failed' | 'sunrise';
  starLabels: readonly string[];
  comment: string;
  delivered: boolean;
  /** v3: Bureau ID photo pose (missing = empty window). */
  photo?: Photo;
  /** v3: Vrell's cover story line. */
  cover: string;
  /** v3: tabloid headline (spotted twice or more), else null. */
  headline: string | null;
  /** v3 L6: Form 7-B readings (English source strings). */
  readings: readonly string[];
}

/** L1 / L2: one flight, one room. */
export function tutorialReport(levelIndex: number, abduct: AbductResult, flight: FlightResult, outcome: RunOutcome): ReportModel {
  const lv = LEVELS[levelIndex]!;
  const par = lv.kind === 'tutorial' ? lv.parSec : 0;
  const total = flight.timeSec + abduct.timeSec;
  const r = tr().report;
  return {
    subtitle: fmt(r.subtitle, { name: tr().levels[lv.id].human, route: tr().routes[flight.roomId].route }),
    rows: [
      [r.totalTime, fmt(r.totalTimeValue, { total: fmtTime(total), fly: fmtTime(flight.timeSec), beam: fmtTime(abduct.timeSec) })],
      [r.bonked, String(abduct.bonks)],
      [r.dignity, fmt(r.percent, { n: Math.round(Math.max(0, Math.min(100, abduct.dignity))) })],
      [r.snores, String(abduct.snores)],
      [r.items, itemsPhrase(abduct.itemsStolen)],
      [r.spotted, String(flight.spotted)],
    ],
    stamp: abduct.delivered ? 'delivered' : 'failed',
    starLabels: tr().starLabels.tutorial,
    comment: vrellComment({ abduct, flight, parSec: par, stars: countStars(outcome.stars) }, outcome.save.reports),
    delivered: abduct.delivered,
    ...(abduct.photo ? { photo: abduct.photo } : {}),
    cover: coverStory({ levelId: lv.id, items: abduct.itemsStolen, spotted: flight.spotted, sunrise: false, seed: outcome.save.reports }),
    headline: tabloidHeadline(lv.id, flight.spotted, outcome.save.reports),
    readings: abduct.probeReadings ?? [],
  };
}

/** L3+: the whole shift. */
export function deepReport(run: DeepRun, outcome: RunOutcome): ReportModel {
  const lv = run.level;
  const sunrise = run.phase === 'sunrise';
  const r = tr().report;
  const names = run.order.map((i) => gt(lv.map.targets[i]!.short)).join(r.listSep);
  const n = run.deliveredCount;
  const left = Math.max(0, lv.budgetSec - run.elapsed);
  return {
    subtitle: fmt(r.subtitleDeep, { location: tr().levels[lv.id].location }),
    rows: [
      [r.shiftTime, sunrise ? fmt(r.ranOut, { h: lv.hours[1] }) : fmt(r.usedSpare, { used: fmtTime(run.elapsed), left: fmtTime(left) })],
      [r.delivered, names ? fmt(r.deliveredNames, { n, names }) : fmt(r.deliveredValue, { n })],
      [r.spotted, String(run.spotted)],
      [r.failedAbductions, String(run.failedAbductions + run.aborts)],
      [r.bonked, String(run.totals.bonks)],
      [r.avgDignity, n > 0 ? fmt(r.percent, { n: Math.round(run.totals.dignity / n) }) : tr().common.dash],
      [r.items, itemsPhrase(run.totals.items)],
    ],
    stamp: sunrise ? 'sunrise' : 'delivered',
    starLabels: tr().starLabels.deep,
    comment: sunrise
      ? sunriseMemo(outcome.save.reports)
      : deepComment(
          { levelId: lv.id, stars: countStars(outcome.stars), spotted: run.spotted, failed: run.failedAbductions, bonks: run.totals.bonks, remaining: left, order: run.order },
          outcome.save.reports,
        ),
    delivered: !sunrise && n >= 3,
    ...(run.photo ? { photo: run.photo } : {}),
    cover: coverStory({ levelId: lv.id, items: run.totals.items, spotted: run.spotted, sunrise, seed: outcome.save.reports }),
    headline: tabloidHeadline(lv.id, run.spotted, outcome.save.reports),
    readings: run.probeReadings,
  };
}

export class ReportScene implements Scene {
  private t = 0;
  private played = { stamp: false, stars: [false, false, false], glorbs: false };
  private readonly retry = new Button(24, 846, 232, 84, tr().common.retry, 'secondary', 30);
  private readonly next = new Button(272, 846, 244, 84, tr().common.next, 'primary', 30);
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
  /** v3 layout (built on the first frame: it measures text). */
  private layout: ReportLayout | null = null;
  private readonly fit: PhotoFit | null;
  private readonly end: number;
  private playedExtras = { approved: false, tabloid: false };

  constructor(
    private readonly shell: Shell,
    private readonly levelIndex: number,
    private readonly model: ReportModel,
    private readonly outcome: RunOutcome,
  ) {
    this.comment = model.comment;
    this.rows = model.rows;
    this.delivered = model.delivered;
    this.fit = model.photo ? fitPhoto(model.photo, WINDOW.w, WINDOW.h) : null;
    this.end = model.headline ? TABLOID_END : END;
    const hasNext = levelIndex + 1 < LEVELS.length;
    this.next.label = model.delivered && hasNext ? tr().common.next : tr().common.workOrders;
    if (this.next.label.length > 9) this.next.size = 26;
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
    const skipped = p.pressed && !this.retry.contains(p.x, p.y) && !this.next.contains(p.x, p.y) && this.t < this.end;
    if (skipped) this.t = this.end;
    const stampX = this.layout?.stamp.x ?? VIEW_W / 2;
    const stampY = this.layout?.stamp.y ?? CY + 420;

    if (!this.played.stamp && this.t >= STAMP_AT) {
      this.played.stamp = true;
      audio.sfx('stamp');
      if (!this.delivered) audio.sfx('fail', 0.8);
      if (!skipped) {
        this.shake = 1;
        // ink ring and paper dust thrown out from under the stamp
        const ink = this.delivered ? PC.inkGreen : PC.inkRed;
        const dust = this.dust;
        dust.spawn(P_RING, stampX, stampY, 0, 0, 0.45, 160, ink);
        if (!rm) {
          for (let i = 0; i < 12; i++) {
            const side = i % 2 === 0 ? -1 : 1;
            const x = stampX + side * (60 + dust.rnd() * 40);
            const y = stampY + (dust.rnd() - 0.5) * 70;
            dust.spawn(P_PUFF, x, y, side * (90 + dust.rnd() * 150), -30 - dust.rnd() * 80, 0.5 + dust.rnd() * 0.3, 13 + dust.rnd() * 9, PC.dust, 60, 2.4);
          }
          dust.burst(P_SPARK, stampX, stampY, 12, 420, 640, 0.34, 3.5, ink, 0, 3);
        }
      }
    }
    if (!this.playedExtras.approved && this.t >= APPROVED_AT) {
      this.playedExtras.approved = true;
      if (this.delivered && this.model.photo && !skipped) audio.sfx('stamp', 0.45);
    }
    if (!this.playedExtras.tabloid && this.t >= TABLOID_AT) {
      this.playedExtras.tabloid = true;
      if (this.model.headline) {
        audio.sfx('stamp', 0.8);
        if (!skipped) this.shake = Math.max(this.shake, 0.6);
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

  private buildLayout(g: CanvasRenderingContext2D): ReportLayout {
    const measure = (s: string, size: number, weight: number, italic: boolean): number => {
      g.font = font(size, weight, italic);
      return g.measureText(s).width;
    };
    const readings = this.model.readings.map((x) => gt(x));
    return layoutReport(measure, { rows: this.rows.length, readings, cover: this.model.cover, headline: this.model.headline });
  }

  render(g: CanvasRenderingContext2D): void {
    const { assets, ctx } = this.shell;
    const rm = ctx.reducedMotion;
    const t = this.t;
    const L = (this.layout ??= this.buildLayout(g));
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
    const r = tr().report;
    text(g, r.title, VIEW_W / 2, CY + 52, 31, C.paperInk, 'center', 900, false, CW - 40);
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
      const ry = L.rowY[i]!;
      const [label, value] = this.rows[i]!;
      text(g, label, CX + 26 + dx, ry, L.rowSize, C.paperInk, 'left', 700);
      // the value squeezes into whatever the label leaves (long name lists on deep shifts)
      const room = CW - 52 - g.measureText(label).width - 14;
      text(g, value, CX + CW - 26 + dx, ry, i === 0 ? L.rowSize - 2 : L.rowSize + 1, '#4b2fa0', 'right', 800, false, room);
      g.fillStyle = C.paperLine;
      g.fillRect(CX + 26, ry + L.rowLine, CW - 52, 2);
      g.globalAlpha = 1;
    }
    // L6: the Form 7-B readings, typed under the stats
    const rd = L.readings;
    const readAt = ROW_AT + this.rows.length * ROW_GAP;
    if (rd && t >= readAt) {
      g.globalAlpha = Math.min(1, (t - readAt) / 0.16);
      text(g, tr().reportExtras.readings, CX + 26, L.readingsY, L.rowSize, C.paperInk, 'left', 700, false, CW - 52);
      // column-major grid: each specimen's two readings sit together
      for (let i = 0; i < rd.cells.length; i++) {
        const col = Math.floor(i / rd.lines);
        const line = i % rd.lines;
        text(g, rd.cells[i]!, rd.x + col * (rd.colW + 16), rd.y + rd.lh * (line + 0.5), rd.size, '#4b2fa0', 'left', 700, false, rd.colW);
      }
      g.globalAlpha = 1;
    }

    // Bureau ID photo: the card slides in from the left, APPROVED thumps onto its corner
    if (t >= PHOTO_AT) {
      const a = rm ? 1 : easeOutCubic(Math.min(1, (t - PHOTO_AT) / 0.25));
      const ph = L.photo;
      g.save();
      g.globalAlpha = Math.min(1, a * 1.4);
      g.translate((1 - a) * -60, 0);
      g.translate(ph.x + ph.box.w / 2, ph.y + ph.box.h / 2);
      g.rotate(-0.035);
      g.translate(-ph.box.w / 2, -ph.box.h / 2);
      // soft drop shadow
      g.fillStyle = 'rgba(29,22,49,0.16)';
      roundRectPath(g, 4, 5, ph.box.w, ph.box.h, 8);
      g.fill();
      drawIdPhoto(g, assets, this.model.photo, this.fit, 0, 0, ph.k);
      g.restore();
      if (this.delivered && this.model.photo && t >= APPROVED_AT) {
        const k = rm ? 1 : Math.min(1, (t - APPROVED_AT) / 0.12);
        const s = rm ? 1 : k < 1 ? 1.8 - 0.8 * k : 1;
        const ap = L.approved;
        g.save();
        g.translate(ap.x, ap.y);
        g.rotate(-0.28);
        g.scale(s, s);
        g.globalAlpha = 0.35 + 0.6 * k;
        if (!sprite(g, assets, localArt('ui/stamp_approved'), 0, 0, ap.w, ap.h)) {
          roundRectPath(g, -ap.w / 2, -ap.h * 0.36, ap.w, ap.h * 0.72, 6);
          g.lineWidth = 3;
          g.strokeStyle = '#1f9a6c';
          g.stroke();
          text(g, tr().reportExtras.approved, 0, 1, 17, '#1f9a6c', 'center', 900, false, ap.w - 12);
        }
        g.restore();
      }
    }

    // Vrell's cover story, under the stamp
    if (t >= COVER_AT) {
      g.globalAlpha = rm ? 1 : Math.min(1, (t - COVER_AT) / 0.3);
      drawBlock(g, L.cover, '#5b4a92', 600, true);
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
      g.translate(L.stamp.x, L.stamp.y);
      g.rotate(-0.16 + (rm ? 0 : (1 - fall) * 0.2));
      g.scale(s * L.stamp.scale, s * L.stamp.scale);
      g.globalAlpha = rm ? fall : 0.2 + 0.8 * fall * fall;
      const stamp = this.model.stamp;
      const key = stamp === 'delivered' ? 'ui/stamp_delivered' : stamp === 'sunrise' ? 'ui/stamp_sunrise' : 'ui/stamp_failed';
      // lettered stamp art per language (ui/stamp_delivered_fr…); ink the words if it is missing
      if (!sprite(g, assets, localArt(key), 0, 0, 240, 120)) {
        const col = stamp === 'delivered' ? '#1f9a6c' : stamp === 'sunrise' ? '#d9782a' : '#d33a52';
        roundRectPath(g, -120, -46, 240, 92, 14);
        g.lineWidth = 8;
        g.strokeStyle = col;
        g.stroke();
        roundRectPath(g, -108, -35, 216, 70, 8);
        g.lineWidth = 3;
        g.stroke();
        text(g, stamp === 'delivered' ? r.stampDelivered : stamp === 'sunrise' ? r.stampSunrise : r.stampRejected, 0, 2, 40, col, 'center', 900, false, 196);
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
          text(g, r.newStar, 0, 1, 13, '#ffffff', 'center', 900, false, 44);
          g.restore();
        }
      } else if (!earned && age > 0 && age < 0.3 && !rm) {
        // a missed star gives a little shrug
        g.globalAlpha = 1 - age / 0.3;
        text(g, '—', sx, STAR_Y - 44 - age * 30, 18, '#9a92bf', 'center', 900);
        g.globalAlpha = 1;
      }
      text(g, this.model.starLabels[i]!, sx, STAR_Y + 46, 16, earned && k > 0 ? C.paperInk : '#9a92bf', 'center', 800, false, 124);
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
      text(g, fmt(r.plusGlorbs, { n: Math.max(0, this.shownGlorbs) }), VIEW_W / 2 - 46, GLORB_Y, 26 + hop * 1.5, got ? '#1f9a6c' : '#9a92bf', 'left', 900, false, 160);
      g.globalAlpha = 1;
      let extra = '';
      if (this.outcome.rankAfter.title !== this.outcome.rankBefore.title) {
        const rank = tr().ranks[RANKS.indexOf(this.outcome.rankAfter)] ?? this.outcome.rankAfter;
        extra = fmt(r.promoted, { rank: rank.title });
      } else if (this.outcome.unlockedNext) extra = r.unlocked;
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
        // the bubble holds four lines: a long quip (French) steps down a size
        const size = wrap(g, this.comment, CW - 154, 16, 600, true).length <= 4 ? 16 : wrap(g, this.comment, CW - 154, 14, 600, true).length <= 5 ? 14 : 13;
        const lh = size === 16 ? 21 : size === 14 ? 17 : 16;
        const lines = wrap(g, this.comment, CW - 154, size, 600, true).length;
        paragraph(g, this.comment, CX + 122, CY + 736 - (lines * lh) / 2, CW - 154, size, C.paperInk, lh, 'left', 600, true);
      }
      g.globalAlpha = 1;
    }

    this.fx.draw(g);

    // tabloid clipping: slaps down across the title strip
    const tb = L.tabloid;
    const clip = L.clip;
    if (tb && clip && t >= TABLOID_AT) {
      const k = rm ? 1 : Math.min(1, (t - TABLOID_AT) / 0.14);
      const s = rm ? 1 : k < 1 ? 1.6 - 0.6 * k * k : 1;
      g.save();
      g.translate(clip.x + clip.w / 2, clip.y + clip.h / 2);
      g.rotate(-0.03);
      g.scale(s, s);
      g.globalAlpha = rm ? 1 : 0.3 + 0.7 * k;
      g.translate(-clip.x - clip.w / 2, -clip.y - clip.h / 2);
      g.fillStyle = 'rgba(29,22,49,0.25)';
      g.fillRect(clip.x + 4, clip.y + 6, clip.w, clip.h);
      g.fillStyle = '#f3efe4';
      g.fillRect(clip.x, clip.y, clip.w, clip.h);
      g.lineWidth = 2;
      g.strokeStyle = '#3a3350';
      g.strokeRect(clip.x, clip.y, clip.w, clip.h);
      // masthead banner
      const mw = 200;
      const mh = 40;
      const mx = clip.x + clip.w / 2;
      const my = clip.y + 6 + mh / 2;
      if (!sprite(g, assets, localArt('ui/tabloid_masthead'), mx, my, mw, mh)) {
        g.fillStyle = '#c8323f';
        g.fillRect(mx - mw / 2, my - mh / 2 + 4, mw, mh - 8);
        text(g, tr().reportExtras.masthead, mx, my, 17, '#ffffff', 'center', 900, false, mw - 14);
      }
      drawBlock(g, tb, '#1d1631', 900, false, 'center');
      g.restore();
    }
    g.restore();

    if (slide >= 1) {
      this.retry.render(g);
      this.next.render(g);
    }
    if (t < this.end) text(g, tr().common.tapToSkip, VIEW_W / 2, 940, 13, C.muted, 'center', 600);
  }
}

/** A fitted text block, lines centred vertically in its box. */
function drawBlock(g: CanvasRenderingContext2D, b: TextBlock, color: string, weight: number, italic: boolean, align: CanvasTextAlign = 'left'): void {
  const top = b.y + Math.max(0, (b.h - b.lines.length * b.lh) / 2);
  const x = align === 'center' ? b.x + b.w / 2 : b.x;
  for (let i = 0; i < b.lines.length; i++) text(g, b.lines[i]!, x, top + b.lh * (i + 0.5), b.size, color, align, weight, italic, b.w);
}
