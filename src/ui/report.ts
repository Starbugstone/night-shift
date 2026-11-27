import { readSeconds } from '../core/read-time';
import { Container, Graphics } from 'pixi.js';
import type { AbductResult, Assets, FlightResult, Scene } from '../contracts';
import { deepComment, storyFirstClear, sunriseMemo } from '../levels/humor'; // v4 story
import type { DeepRun } from '../levels/run';
import { deepPar } from '../levels/types';
import { VIEW_W } from '../contracts';
import { P_PUFF, P_RING, P_SPARK, P_STAR, P_TWINKLE, PC, Particles, easeOutBack, easeOutCubic } from '../core/fx';
import { ParticleView } from '../core/gfx/particles';
import { ViewSlot, type SceneView } from '../core/gfx/scene';
import { panelPath, roundRect } from '../core/gfx/shapes';
import { Label, Paragraph, measure, wrapLines } from '../core/gfx/text';
import type { Shell } from '../core/shell';
import { itemsPhrase, vrellComment } from '../levels/humor';
import { LEVELS } from '../levels/levels';
import { countStars, isLevelUnlocked, type RunOutcome } from '../levels/progress';
import { fmt, gt, localArt, tr } from '../i18n';
import { fmtTime } from './draw';
import { reportContent } from './report-content';
import { coverStory, mapCollectibleReport, pickupTurn, tabloidHeadline } from './report-extras';
import { CH, CW, CX, CY, GLORB_Y, STAR_Y, stackedRowValue, type ReportLayout, type TextBlock } from './report-layout';
import type { Photo } from './report-photo';
import { C } from './theme';
import { Button } from './widgets';
import { artSprite } from './views/art';
import { NightSky } from './views/backdrop';
import { ButtonView } from './views/button';
import { glorbTexture, iconSprite, starTexture } from './views/icons';
import { VrellPortrait } from './views/portrait';
import { idPhoto } from './views/report-photo';
import { shownStarLabels } from './star-labels';

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
  stamp: 'delivered' | 'failed' | 'sunrise' | 'storm' | 'demolition';
  archive?: string;
  bakerySign?: boolean;
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
  const pickup = lv.map.collectible && mapCollectibleReport(lv.map.collectible.id, flight.mapCollectible, outcome.save.reports);
  const turn = pickupTurn(pickup ? pickup.comment : undefined, outcome.save.reports); // v0.2 follow-up
  return {
    subtitle: fmt(r.subtitle, { name: tr().levels[lv.id].human, route: tr().routes[flight.roomId].route }),
    rows: [
      [r.totalTime, fmt(r.totalTimeValue, { total: fmtTime(total), fly: fmtTime(flight.timeSec), beam: fmtTime(abduct.timeSec) })],
      [r.bonked, String(abduct.bonks)],
      [r.dignity, fmt(r.percent, { n: Math.round(Math.max(0, Math.min(100, abduct.dignity))) })],
      [r.snores, String(abduct.snores)],
      [r.items, itemsPhrase(abduct.itemsStolen)],
      ...(pickup ? [pickup.row] : []),
      [r.spotted, String(flight.spotted)],
    ],
    stamp: abduct.delivered ? 'delivered' : 'failed',
    starLabels: shownStarLabels(lv),
    comment: (abduct.delivered && (
      (outcome.newStarFlags[0] && storyFirstClear(lv.id)) || turn.line
    )) || vrellComment({ abduct, flight, parSec: par, stars: countStars(outcome.stars) }, turn.rest),
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
  const pickup = lv.map.collectible && mapCollectibleReport(lv.map.collectible.id, run.collectible?.collectedId, outcome.save.reports);
  const names = run.order.map((i) => gt(lv.map.targets[i]!.short)).join(r.listSep);
  const n = run.deliveredCount;
  const total = lv.map.targets.length;
  const firstClear = outcome.newStarFlags[0];
  const turn = pickupTurn(pickup ? pickup.comment : undefined, outcome.save.reports); // v0.2 follow-up
  const dignityCount = lv.id === 'level8' ? run.totals.rooms.length : n;
  let time: string;
  if (lv.clockMode === 'elapsed') {
    time = fmt(tr().birch.timeAgainstPar, { used: fmtTime(Math.ceil(run.elapsed)), par: fmtTime(deepPar(lv)) });
  } else if (sunrise) {
    // the deadline row follows the clock (clockMode); 1955's "pass expired at 10:10" is its own story line
    time = lv.clockMode === 'demolition' ? tr().dispatch2199.deadline : lv.id === 'level9' ? tr().crestValley.ranOut
      : lv.clockMode === 'countdown' ? tr().timeTrial.ranOut : fmt(r.ranOut, { h: lv.hours[1] });
  } else {
    // Round down the spare time so a missed par cannot appear to have been met.
    const spare = Math.floor(run.remaining);
    time = fmt(r.usedSpare, { used: fmtTime(run.budget - spare), left: fmtTime(spare) });
  }
  return {
    subtitle: fmt(r.subtitleDeep, { location: tr().levels[lv.id].location }),
    rows: [
      [r.shiftTime, time],
      [r.delivered, lv.id === 'level8' ? fmt(tr().timeTrial.count, { n: run.specimenCount }) : names ? fmt(r.deliveredNames, { n, total, names }) : fmt(r.deliveredValue, { n, total })],
      [r.spotted, String(run.spotted)],
      [r.failedAbductions, String(run.failedAbductions + run.aborts)],
      [r.bonked, String(run.totals.bonks)],
      [r.avgDignity, dignityCount > 0 ? fmt(r.percent, { n: Math.round(run.totals.dignity / dignityCount) }) : tr().common.dash],
      [r.items, itemsPhrase(run.totals.items)],
      ...(pickup ? [pickup.row] : []),
    ],
    stamp: sunrise ? (lv.clockMode === 'demolition' ? 'demolition' : lv.clockMode === 'storm' ? 'storm' : 'sunrise') : 'delivered',
    archive: lv.id === 'level9' ? tr().crestValley.archive : lv.id === 'level10' ? tr().grail.archive : lv.id === 'level11' ? tr().invasion1953.archive : undefined,
    bakerySign: lv.id === 'birch_bakery' && outcome.stars[0],
    starLabels: shownStarLabels(lv),
    comment: sunrise
      ? sunriseMemo(outcome.save.reports, lv.id)
      : (outcome.newStarFlags[0] && storyFirstClear(lv.id)) || turn.line || deepComment( // v4 story
          { levelId: lv.id, stars: countStars(outcome.stars), spotted: run.spotted, failed: run.failedAbductions, bonks: run.totals.bonks, remaining: run.remaining, order: run.order, items: run.totals.items, rooms: run.totals.rooms },
          turn.rest,
        ),
    delivered: !sunrise && n >= total,
    ...(run.photo ? { photo: run.photo } : {}),
    cover: lv.id === 'level10' && !sunrise && run.collectible?.collectedId ? tr().grail.greenery
      : lv.id === 'level10' && outcome.stars[1] ? tr().grail.ghost
      // v0.2 copy: after the first clear, a seen L12 delivery files its own cover causes
      : lv.id === 'level12' && (sunrise || outcome.stars[1] || firstClear) ? sunrise ? tr().dispatch2199.deadline : outcome.stars[1] ? tr().dispatch2199.ghost : tr().dispatch2199.cover
      : lv.id === 'level11' && !sunrise && outcome.newStarFlags[0] ? tr().invasion1953.firstCover
      : lv.id === 'level11' && !sunrise && run.collectible?.collectedId === 'tripod_leg' ? tr().invasion1953.legCover
      : coverStory({ levelId: lv.id, items: run.totals.items, spotted: run.spotted, sunrise, firstClear, seed: outcome.save.reports }),
    headline: lv.id === 'level12' && sunrise && run.spotted >= 2 ? tr().dispatch2199.gazette : tabloidHeadline(lv.id, run.spotted, outcome.save.reports),
    readings: run.probeReadings,
  };
}

export class ReportScene implements Scene {
  t = 0;
  private played = { stamp: false, stars: [false, false, false, false], glorbs: false };
  readonly retry = new Button(24, 846, 232, 84, tr().common.retry, 'secondary', 30);
  readonly next = new Button(272, 846, 244, 84, tr().common.next, 'primary', 30);
  /** Star and Glorb bursts, drawn over the card. */
  readonly fx = new Particles(64);
  /** Ink ring and paper dust from the stamp, drawn under it. */
  readonly dust = new Particles(32);
  shake = 0;
  shownGlorbs = -1;
  /** Kicks on every Glorb tick: the coin hops. */
  coinHop = 0;
  private readonly look = new ViewSlot(() => new ReportView(this));
  readonly end: number;
  private readonly hasNext: boolean;
  private playedExtras = { approved: false, tabloid: false };
  private spoke = false; // v4 voices: Vrell says his comment out loud

  constructor(
    readonly shell: Shell,
    private readonly levelIndex: number,
    readonly model: ReportModel,
    readonly outcome: RunOutcome,
    private readonly advance?: () => void,
    private readonly finale?: () => void,
  ) {
    this.end = model.headline ? TABLOID_END : END;
    const successor = levelIndex + 1;
    const branching = LEVELS[levelIndex]?.requires || LEVELS[successor]?.requires;
    // At a fork the report returns to Work Orders so the player chooses the date.
    this.hasNext = !branching && isLevelUnlocked(outcome.save, successor);
    this.next.label = finale ? tr().dispatch2199.replay : advance ? tr().fieldCheckControls.short : model.delivered && this.hasNext ? tr().common.next : tr().common.workOrders;
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
    const ready = this.t > (this.finale ? COMMENT_AT : 0.8);
    this.retry.enabled = ready;
    this.next.enabled = ready;
    if (this.finale && this.t >= this.end + readSeconds(this.model.comment)) return this.finale();
    if (this.retry.update(p, dt)) return this.shell.toFlight(this.levelIndex);
    if (this.next.update(p, dt)) {
      if (this.finale) return this.finale();
      if (this.advance) return this.advance();
      if (this.model.delivered && this.hasNext) return this.shell.toMemo(this.levelIndex + 1);
      return this.shell.toWorkOrders();
    }
    const skipped = p.pressed && !this.retry.contains(p.x, p.y) && !this.next.contains(p.x, p.y) && this.t < this.end;
    if (skipped) this.t = this.end;
    const stampX = this.look.peek()?.layout.stamp.x ?? VIEW_W / 2;
    const stampY = this.look.peek()?.layout.stamp.y ?? CY + 420;

    if (!this.played.stamp && this.t >= STAMP_AT) {
      this.played.stamp = true;
      audio.sfx('stamp');
      if (!this.model.delivered) audio.sfx('fail', 0.8);
      if (!skipped) {
        this.shake = 1;
        // ink ring and paper dust thrown out from under the stamp
        const ink = this.model.delivered ? PC.inkGreen : PC.inkRed;
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
      if (this.model.delivered && this.model.photo && !skipped) audio.sfx('stamp', 0.45);
    }
    if (!this.playedExtras.tabloid && this.t >= TABLOID_AT) {
      this.playedExtras.tabloid = true;
      if (this.model.headline) {
        audio.sfx('stamp', 0.8);
        if (!skipped) this.shake = Math.max(this.shake, 0.6);
      }
    }
    const starCount = this.model.starLabels.length;
    for (let i = 0; i < starCount; i++) {
      if (!this.played.stars[i] && this.t >= STAR_AT + i * STAR_GAP) {
        this.played.stars[i] = true;
        if (this.outcome.stars[i]) {
          audio.sfx('lock_on', 0.5);
          if (!skipped) {
            const sx = starX(i, starCount);
            this.fx.spawn(P_RING, sx, STAR_Y, 0, 0, 0.4, 76, PC.amber);
            this.fx.burst(P_STAR, sx, STAR_Y, rm ? 3 : 6, 150, 280, 0.6, 9, PC.amber, 420, 1.2);
            if (!rm) this.fx.burst(P_TWINKLE, sx, STAR_Y, 5, 60, 160, 0.55, 9, PC.white, 0, 2);
          }
        }
      }
    }
    // v4 voices: Vrell's comment, babbled as it appears (a skip lands here too: it is read then)
    if (!this.spoke && this.t >= COMMENT_AT) {
      this.spoke = true;
      audio.speak(this.model.comment, 'vrell', { within: readSeconds(this.model.comment) });
    }
    if (!this.played.glorbs && this.t >= GLORB_AT) {
      this.played.glorbs = true;
      if (this.model.delivered) audio.sfx('success', 0.7);
    }
    // Glorb counter rolls up to the final payout
    if (this.t >= GLORB_AT) {
      const k = Math.min(1, (this.t - GLORB_AT) / GLORB_COUNT);
      const shown = Math.round(this.outcome.glorbs * easeOutCubic(k));
      if (shown !== this.shownGlorbs) {
        const first = this.shownGlorbs < 0;
        this.shownGlorbs = shown;
        if (!first && !skipped) {
          this.coinHop = 1;
          if (shown === this.outcome.glorbs && shown > 0 && !rm) {
            this.fx.burst(P_TWINKLE, VIEW_W / 2 - 74, GLORB_Y, 6, 60, 170, 0.55, 9, PC.mint, 0, 2);
          }
        }
      }
    }
  }

  get view(): Container {
    return this.look.get().root;
  }

  render(): void {
    this.look.peek()?.sync();
  }

  dispose(): void {
    this.shell.audio.hush('vrell'); // v4 voices
    this.look.destroy();
  }
}

const STAR_EARNED = { size: 16, color: C.paperInk, weight: 800 } as const;
const STAR_EMPTY = { ...STAR_EARNED, color: '#9a92bf' } as const;
const PAYOUT_X = VIEW_W / 2 - 46;

class ReportView implements SceneView {
  readonly root = new Container();
  readonly layout: ReportLayout;
  private readonly sky = new NightSky();
  private readonly paper = new Container();
  private readonly rows: { root: Container; text: Container }[];
  private readonly readings = new Container();
  private readonly photo = new Container();
  private readonly approved: Container | null;
  private readonly cover: Container;
  private readonly stamp: Container;
  private readonly dust: ParticleView;
  private readonly stars: RatingStar[];
  private readonly payout: Payout;
  private readonly vrell: ReportComment;
  private readonly effects: ParticleView;
  private readonly tabloid: Container | null;
  private readonly buttons = new Container();
  private readonly retry: ButtonView;
  private readonly next: ButtonView;
  private readonly skip = new Label({ size: 13, color: C.muted }).set(tr().common.tapToSkip, VIEW_W / 2, 940);

  constructor(private readonly s: ReportScene) {
    const { model, outcome, shell } = s;
    const { assets } = shell;
    const strings = tr().report;
    const content = reportContent(model, outcome, measure);
    const L = this.layout = content.layout;
    const sheet = panelPath(new Graphics(), CX, CY, CW, CH, { fill: C.paper, r: 18, shadow: 8 });
    for (let x = CX + 20; x < CX + CW - 10; x += 26) sheet.circle(x, CY + 14, 5);
    sheet.fill(C.night2).rect(CX + 26, CY + 100, CW - 52, 3).fill('#6a3fbf');
    this.paper.addChild(
      sheet,
      new Label({ size: 31, color: C.paperInk, weight: 900 }).set(strings.title, VIEW_W / 2, CY + 52, CW - 40),
      new Label({ size: 15, color: '#6f6597', weight: 700 }).set(model.subtitle, VIEW_W / 2, CY + 83, CW - 40),
    );

    const rowLabel = { size: L.rowSize, color: C.paperInk, align: 'left', weight: 700 } as const;
    const full = CW - 52;
    const values = model.rows.map(([label, value], i) => {
      const room = full - measure(label, L.rowSize, 700) - 14;
      const size = L.rowSize + (i === 0 ? -2 : 1);
      return { room, size, stacked: stackedRowValue(measure, value, room, full, size) };
    });
    const extra = 14;
    const stackedCount = values.filter(v => v.stacked !== null).length;
    const singleHeight = L.rowGap - extra * stackedCount / values.length;
    let top = L.rowY[0]! - L.rowGap / 2;
    this.rows = model.rows.map(([label, value], i) => {
      const { room, size: valueSize, stacked } = values[i]!;
      const height = singleHeight + (stacked === null ? 0 : extra);
      const y = top + height / 2;
      top += height;
      const text = new Container();
      const row = new Container();
      if (stacked !== null) {
        const half = Math.round((L.rowSize + stacked) / 4) + 1;
        text.addChild(
          new Label(rowLabel).set(label, CX + 26, y - half),
          new Label({ size: stacked, color: '#4b2fa0', align: 'right', weight: 800 }).set(value, CX + CW - 26, y + half + 1, CW - 52),
        );
      } else {
        text.addChild(
          new Label(rowLabel).set(label, CX + 26, y),
          new Label({ size: valueSize, color: '#4b2fa0', align: 'right', weight: 800 }).set(value, CX + CW - 26, y, room),
        );
      }
      row.addChild(text, new Graphics().rect(CX + 26, top - 1, full, 2).fill(C.paperLine));
      this.paper.addChild(row);
      return { root: row, text };
    });
    const rd = L.readings;
    if (rd && content.readingsHeading) {
      this.readings.addChild(new Label(rowLabel).set(content.readingsHeading, CX + 26, L.readingsY, CW - 52));
      const look = { size: rd.size, color: '#4b2fa0', align: 'left', weight: 700 } as const;
      for (let i = 0; i < rd.cells.length; i++) {
        const col = Math.floor(i / rd.lines);
        const line = i % rd.lines;
        this.readings.addChild(new Label(look).set(rd.cells[i]!, rd.x + col * (rd.colW + 16), rd.y + rd.lh * (line + 0.5), rd.colW));
      }
    }
    this.paper.addChild(this.readings);

    const ph = L.photo;
    this.photo.pivot.set(ph.box.w / 2, ph.box.h / 2);
    this.photo.rotation = -0.035;
    this.photo.addChild(
      roundRect(new Graphics(), 4, 5, ph.box.w, ph.box.h, 8).fill('rgba(29,22,49,0.16)'),
      idPhoto(assets, model.photo, ph.k),
    );
    if (model.bakerySign) {
      const sign = artSprite(assets, 'ui/bakery_open_sign', 80, 45) ?? new Graphics()
        .roundRect(-40, -19, 80, 37, 6).fill('#385c60').stroke({ color: '#805771', width: 4 })
        .ellipse(23, 5, 5, 3).circle(18, 1, 2).circle(22, -1, 2).circle(26, 0, 2).fill('#f7dfbb');
      sign.position.set(ph.box.w * 0.49, ph.box.h - 9);
      this.photo.addChild(sign, new Label({ size: 14, color: '#fff0c7', weight: 900 })
        .set(tr().birch.open, sign.x - 8, sign.y, 46));
    }
    this.paper.addChild(this.photo);
    this.approved = content.approved ? approvedStamp(assets, L.approved, content.approved) : null;
    if (this.approved) this.paper.addChild(this.approved);
    this.cover = fittedBlock(L.cover, '#5b4a92', 600, true);
    this.dust = new ParticleView(s.dust);
    this.stamp = resultStamp(assets, model.stamp);
    this.stamp.position.set(L.stamp.x, L.stamp.y);
    this.paper.addChild(this.cover, this.dust, this.stamp);

    this.stars = model.starLabels.map((label, i) => new RatingStar(assets, i, model.starLabels.length, label, outcome.stars[i] === true, outcome.newStarFlags[i] === true));
    for (const star of this.stars) this.paper.addChild(star.root);
    this.payout = new Payout(assets, outcome.glorbs > 0, content.payoutExtra);
    this.vrell = new ReportComment(assets, model.comment);
    this.effects = new ParticleView(s.fx);
    this.paper.addChild(this.payout.root, this.vrell.root, this.effects);
    this.tabloid = L.tabloid && L.clip ? tabloidClipping(assets, L.tabloid, L.clip, model.archive) : null;
    if (this.tabloid) this.paper.addChild(this.tabloid);

    this.retry = new ButtonView(s.retry);
    this.next = new ButtonView(s.next);
    this.buttons.addChild(this.retry, this.next);
    this.root.addChild(this.sky, this.paper, this.buttons, this.skip);
  }

  sync(): void {
    const { shell, shake, t } = this.s;
    const rm = shell.ctx.reducedMotion;
    const L = this.layout;
    this.sky.sync(t, rm);
    const slide = rm ? 1 : easeOutCubic(t / 0.4);
    const shaking = !rm && shake > 0;
    this.paper.position.set(
      shaking ? Math.sin(t * 90) * 6 * shake : 0,
      (1 - slide) * 900 + (shaking ? Math.cos(t * 70) * 4 * shake : 0),
    );

    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i]!;
      const at = ROW_AT + i * ROW_GAP;
      row.root.visible = t >= at;
      if (!row.root.visible) continue;
      const a = Math.min(1, (t - at) / 0.16);
      row.root.alpha = a;
      row.text.x = rm ? 0 : (1 - easeOutCubic(a)) * -18;
    }
    const readAt = ROW_AT + this.rows.length * ROW_GAP;
    this.readings.visible = L.readings !== null && t >= readAt;
    if (this.readings.visible) this.readings.alpha = Math.min(1, (t - readAt) / 0.16);

    this.photo.visible = t >= PHOTO_AT;
    if (this.photo.visible) {
      const a = rm ? 1 : easeOutCubic((t - PHOTO_AT) / 0.25);
      const ph = L.photo;
      this.photo.alpha = Math.min(1, a * 1.4);
      this.photo.position.set(ph.x + ph.box.w / 2 + (1 - a) * -60, ph.y + ph.box.h / 2);
    }
    if (this.approved) {
      this.approved.visible = t >= APPROVED_AT;
      if (this.approved.visible) {
        const k = rm ? 1 : Math.min(1, (t - APPROVED_AT) / 0.12);
        this.approved.alpha = 0.35 + 0.6 * k;
        this.approved.scale.set(1.8 - 0.8 * k);
      }
    }
    this.cover.visible = t >= COVER_AT;
    if (this.cover.visible) this.cover.alpha = rm ? 1 : Math.min(1, (t - COVER_AT) / 0.3);
    this.dust.sync();

    this.stamp.visible = t >= STAMP_AT - STAMP_FALL;
    if (this.stamp.visible) {
      const fall = Math.min(1, (t - (STAMP_AT - STAMP_FALL)) / STAMP_FALL);
      const settle = Math.min(1, Math.max(0, (t - STAMP_AT) / 0.22));
      const size = rm ? 1 : fall < 1 ? 2.6 - 1.72 * fall * fall : 0.88 + 0.12 * easeOutBack(settle, 3);
      this.stamp.scale.set(size * L.stamp.scale);
      this.stamp.rotation = -0.16 + (rm ? 0 : (1 - fall) * 0.2);
      this.stamp.alpha = rm ? fall : 0.2 + 0.8 * fall * fall;
    }

    for (let i = 0; i < this.stars.length; i++) this.stars[i]!.sync(t - STAR_AT - i * STAR_GAP, rm);
    this.payout.sync(t, rm ? 0 : this.s.coinHop, this.s.shownGlorbs, rm);
    this.vrell.sync(t, rm);
    this.effects.sync();
    if (this.tabloid) {
      this.tabloid.visible = t >= TABLOID_AT;
      if (this.tabloid.visible) {
        const k = rm ? 1 : Math.min(1, (t - TABLOID_AT) / 0.14);
        this.tabloid.scale.set(1.6 - 0.6 * k * k);
        this.tabloid.alpha = 0.3 + 0.7 * k;
      }
    }
    this.buttons.visible = slide >= 1;
    if (this.buttons.visible) {
      this.retry.sync();
      this.next.sync();
    }
    this.skip.visible = t < this.s.end;
  }
}

function approvedStamp(assets: Assets, ap: ReportLayout['approved'], caption: string): Container {
  const stamp = new Container();
  stamp.position.set(ap.x, ap.y);
  stamp.rotation = -0.28;
  const art = artSprite(assets, localArt('ui/stamp_approved'), ap.w, ap.h);
  if (art) stamp.addChild(art);
  else {
    stamp.addChild(
      roundRect(new Graphics(), -ap.w / 2, -ap.h * 0.36, ap.w, ap.h * 0.72, 6).stroke({ color: '#1f9a6c', width: 3 }),
      new Label({ size: 17, color: '#1f9a6c', weight: 900 }).set(caption, 0, 1, ap.w - 12),
    );
  }
  return stamp;
}

function resultStamp(assets: Assets, result: ReportModel['stamp']): Container {
  const key = result === 'delivered' ? 'ui/stamp_delivered' : result === 'sunrise' ? 'ui/stamp_sunrise' : 'ui/stamp_failed';
  const art = result === 'demolition' || result === 'storm' ? null : artSprite(assets, localArt(key), 240, 120);
  if (art) return art;
  const root = new Container();
  const col = result === 'delivered' ? '#1f9a6c' : result === 'failed' ? '#d33a52' : '#d9782a';
  const r = tr().report;
  const caption = result === 'demolition' ? tr().dispatch2199.deadline : result === 'storm' ? tr().crestValley.stamp : result === 'delivered' ? r.stampDelivered : result === 'sunrise' ? r.stampSunrise : r.stampRejected;
  const outline = roundRect(new Graphics(), -120, -46, 240, 92, 14).stroke({ color: col, width: 8 });
  roundRect(outline, -108, -35, 216, 70, 8).stroke({ color: col, width: 3 });
  root.addChild(outline, new Label({ size: 40, color: col, weight: 900 }).set(caption, 0, 2, 196));
  return root;
}

/** Spacing of the report's rating stars: three at 132 px, four (with the town pickup star) at 112. */
function starGap(n: number): number {
  return n > 3 ? 112 : 132;
}
function starX(i: number, n: number): number {
  return VIEW_W / 2 + (i - (n - 1) / 2) * starGap(n);
}

class RatingStar {
  readonly root = new Container();
  private readonly full: Container;
  private readonly badge = new Container();
  private readonly shrug = new Label({ size: 18, color: '#9a92bf', weight: 900 }, '—');
  private readonly caption: Label;

  constructor(assets: Assets, i: number, n: number, text: string, private readonly earned: boolean, private readonly isNew: boolean) {
    this.root.position.set(starX(i, n), STAR_Y);
    const px = n > 3 ? 58 : 66;
    this.full = iconSprite(starTexture(assets, px, true), px);
    this.caption = new Label(STAR_EMPTY).set(text, 0, 46, starGap(n) - 8);
    this.badge.position.set(32, -36);
    this.badge.rotation = 0.2;
    this.badge.addChild(
      panelPath(new Graphics(), -25, -11, 50, 22, { fill: C.red, r: 11, lineW: 2, shadow: 0 }),
      new Label({ size: 13, color: '#ffffff', weight: 900 }).set(tr().report.newStar, 0, 1, 44),
    );
    this.root.addChild(iconSprite(starTexture(assets, px, false), px), this.full, this.badge, this.shrug, this.caption);
  }

  sync(age: number, rm: boolean): void {
    const pop = age >= 0 ? (rm ? 1 : easeOutBack(age / 0.32, 2.6)) : 0;
    const on = this.earned && pop > 0;
    this.full.visible = on;
    if (on) {
      this.full.scale.set(pop);
      this.full.rotation = rm ? 0 : (1 - Math.min(1, age / 0.32)) * -0.5;
    }
    this.badge.visible = on && this.isNew && age >= 0.2;
    if (this.badge.visible) this.badge.scale.set(rm ? 1 : easeOutBack((age - 0.2) / 0.2));
    this.shrug.visible = !this.earned && age > 0 && age < 0.3 && !rm;
    if (this.shrug.visible) {
      this.shrug.y = -44 - age * 30;
      this.shrug.alpha = 1 - age / 0.3;
    }
    this.caption.restyle(on ? STAR_EARNED : STAR_EMPTY);
  }
}

class Payout {
  readonly root = new Container();
  private readonly pill = new Container();
  private readonly coin: Container;
  private readonly amount: Label;
  private readonly extra: Label;
  private readonly extraText: string;
  private readonly template = tr().report.plusGlorbs;
  private readonly amountBox = new Container();
  private lastShown = -1;
  private lastHop = -1;
  private amountText = '';

  constructor(assets: Assets, got: boolean, extra: string) {
    this.extraText = extra;
    const bg = roundRect(new Graphics(), VIEW_W / 2 - 122, GLORB_Y - 25, 244, 50, 25)
      .fill(got ? 'rgba(31,154,108,0.14)' : 'rgba(154,146,191,0.14)')
      .stroke({ color: got ? 'rgba(31,154,108,0.45)' : 'rgba(154,146,191,0.4)', width: 2 });
    this.coin = iconSprite(glorbTexture(assets, 40), 40);
    this.amount = new Label({ size: 26, color: got ? '#1f9a6c' : '#9a92bf', align: 'left', weight: 900 });
    this.amountBox.position.set(PAYOUT_X, GLORB_Y);
    this.amountBox.addChild(this.amount);
    this.extra = new Label({ size: 17, color: '#c0622a', weight: 900 }).set(extra, VIEW_W / 2, GLORB_Y + 39, CW - 60);
    this.extraSqueeze = this.extra.scale.x;
    this.pill.addChild(bg, this.coin, this.amountBox);
    this.root.addChild(this.pill, this.extra);
  }

  private readonly extraSqueeze: number;

  sync(t: number, hop: number, shown: number, rm: boolean): void {
    this.root.visible = t >= GLORB_AT;
    if (!this.root.visible) return;
    this.pill.alpha = Math.min(1, (t - GLORB_AT) / 0.15);
    if (this.lastShown !== shown) this.amountText = fmt(this.template, { n: Math.max(0, shown) });
    if (this.lastHop !== hop || this.lastShown !== shown) {
      this.lastHop = hop;
      this.lastShown = shown;
      const scale = 1 + (hop * 1.5) / 26;
      this.amountBox.scale.set(scale);
      this.amount.set(this.amountText, 0, 0, 160 / scale);
      this.coin.position.set(VIEW_W / 2 - 74, GLORB_Y - 1 - hop * 7);
      this.coin.scale.set(1 + hop * 5 / 40);
    }
    this.extra.visible = this.extraText.length > 0 && t >= GLORB_AT + GLORB_COUNT;
    if (this.extra.visible) {
      const pop = rm ? 1 : easeOutBack((t - GLORB_AT - GLORB_COUNT) / 0.25);
      this.extra.scale.set(pop * this.extraSqueeze, pop);
    }
  }
}

class ReportComment {
  readonly root = new Container();
  private readonly portrait: VrellPortrait;
  private readonly dots: Graphics[];
  private readonly comment: Paragraph;

  constructor(assets: Assets, text: string) {
    this.portrait = new VrellPortrait(assets, CX + 58, CY + 734, 76);
    const bubble = panelPath(new Graphics(), CX + 108, CY + 690, CW - 128, 92, { fill: '#ffffff', r: 14, stroke: '#cfc6e6', lineW: 2, shadow: 0 })
      .poly([CX + 110, CY + 722, CX + 98, CY + 734, CX + 110, CY + 744]).fill('#ffffff');
    const w = CW - 154;
    const size = wrapLines(text, w, 16, 600, true).length <= 4 ? 16 : wrapLines(text, w, 14, 600, true).length <= 5 ? 14 : 13;
    const lh = size === 16 ? 21 : size === 14 ? 17 : 16;
    const lines = wrapLines(text, w, size, 600, true).length;
    this.comment = new Paragraph({ size, color: C.paperInk, align: 'left', weight: 600, italic: true, lineHeight: lh });
    this.comment.setBlock(text, CX + 122, CY + 736 - lines * lh / 2, w);
    this.dots = [0, 1, 2].map((i) => new Graphics().circle(CX + 136 + i * 18, CY + 736, 5).fill('#b3a9d6'));
    this.root.addChild(this.portrait.root, bubble, ...this.dots, this.comment);
  }

  sync(t: number, rm: boolean): void {
    const a = rm ? 1 : easeOutCubic((t - 0.45) / 0.3);
    this.root.visible = a > 0;
    if (!this.root.visible) return;
    this.root.alpha = a;
    this.portrait.sync(t, rm);
    const writing = t < COMMENT_AT;
    this.portrait.root.y = CY + 734 + (writing && !rm ? Math.sin(t * 9) * 1.2 : 0);
    for (let i = 0; i < this.dots.length; i++) {
      const dot = this.dots[i]!;
      dot.visible = writing;
      if (writing) dot.y = rm ? 0 : -Math.max(0, Math.sin(t * 7 - i * 0.9)) * 6;
    }
    this.comment.visible = !writing;
    if (!writing) this.comment.alpha = Math.min(1, (t - COMMENT_AT) / 0.25);
  }
}

function fittedBlock(b: TextBlock, color: string, weight: number, italic: boolean, align: 'left' | 'center' = 'left'): Container {
  const root = new Container();
  const top = b.y + Math.max(0, (b.h - b.lines.length * b.lh) / 2);
  const x = align === 'center' ? b.x + b.w / 2 : b.x;
  const look = { size: b.size, color, weight, italic, align };
  for (let i = 0; i < b.lines.length; i++) root.addChild(new Label(look).set(b.lines[i]!, x, top + b.lh * (i + 0.5), b.w));
  return root;
}

function tabloidClipping(assets: Assets, headline: TextBlock, clip: NonNullable<ReportLayout['clip']>, archive?: string): Container {
  const root = new Container();
  const mx = clip.x + clip.w / 2;
  const my = clip.y + 26;
  root.pivot.set(mx, clip.y + clip.h / 2);
  root.position.copyFrom(root.pivot);
  root.rotation = -0.03;
  const paper = new Graphics()
    .rect(clip.x + 4, clip.y + 6, clip.w, clip.h).fill('rgba(29,22,49,0.25)')
    .rect(clip.x, clip.y, clip.w, clip.h).fill(archive ? '#e9d8b9' : '#f3efe4').stroke({ color: '#3a3350', width: 2 });
  root.addChild(paper);
  const art = artSprite(assets, localArt('ui/tabloid_masthead'), 200, 40);
  if (art) {
    art.position.set(mx, my);
    root.addChild(art);
  } else root.addChild(
    new Graphics().rect(mx - 100, my - 16, 200, 32).fill('#c8323f'),
    new Label({ size: 17, color: '#ffffff', weight: 900 }).set(tr().reportExtras.masthead, mx, my, 186),
  );
  // the 1955 stamp sits right of the masthead, clear of the two headline lines below it
  if (archive) root.addChild(new Label({ size: 11, weight: 900, color: '#63462f' }).set(archive, (mx + 100 + clip.x + clip.w) / 2, my, clip.x + clip.w - mx - 112));
  root.addChild(fittedBlock(headline, '#1d1631', 900, false, 'center'));
  return root;
}
