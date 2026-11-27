import type { HuntTarget } from '../flight/hunt';
import { Container, Graphics } from 'pixi.js';
import type { Scene } from '../contracts';
import { VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { LEVELS, formatOrderNumber, workOrderNumber } from '../levels/levels';
import { deepPar } from '../levels/types';
import { routeAdvice } from '../levels/route-advice';
import { fmt, tr } from '../i18n';
import { easeOutBack } from '../core/fx';
import { ViewSlot, type SceneView } from '../core/gfx/scene';
import { panelPath } from '../core/gfx/shapes';
import { Label, measure, wrapLines, type LabelStyle } from '../core/gfx/text';
import { fmtTime } from './draw';
import { C } from './theme';
import { Button } from './widgets';
import { NightSky } from './views/backdrop';
import { ButtonView } from './views/button';
import { iconSprite, starTexture } from './views/icons';
import { VrellPortrait } from './views/portrait';
import { shownStarLabels } from './star-labels';

const PX = 24;
const PW = VIEW_W - 48;
const BODY_SIZE = 20;
const BODY_LH = 27;
const JOKE_SIZE = 18;
const JOKE_LH = 24;
const CPS = 70;

/** Temporal Dispatch orders written after Zib's promotion at the end of Prior Contact. */
const STAFF_MEMOS: ReadonlySet<string> = new Set(['level9', 'level10', 'level11', 'level12']);

export function memoAddressee(id: string, promoted = false): string {
  const { memo } = tr();
  if (!STAFF_MEMOS.has(id)) return memo.to;
  return promoted ? memo.toAgentSenior : memo.toAgent;
}

export class MemoScene implements Scene {
  t = 0;
  chars = 0;
  readonly back = new Button(16, 18, 64, 60, '‹', 'ghost', 40);
  readonly start = new Button(90, 852, VIEW_W - 180, 84, tr().memo.startShift, 'primary', 32);
  readonly replay?: Button;
  readonly practice?: Button;
  readonly totalChars: number;
  private readonly look = new ViewSlot(() => new MemoView(this));

  constructor(
    readonly shell: Shell,
    private readonly levelIndex: number,
    private readonly openPractice?: () => void,
    private readonly openReplay?: () => void,
    private readonly hunt?: HuntTarget,
  ) {
    const level = tr().levels[this.level.id];
    this.totalChars = level.body.length + level.joke.length;
    if (openReplay) this.replay = new Button(16, 852, 145, 84, tr().dispatch2199.replay, 'secondary', 18);
    if (openPractice) {
      const words = tr().fieldCheck;
      const label = this.level.id === 'level12' ? tr().dispatch2199.practice : shell.save.fieldCheckSeen ? words.replay : words.start;
      // v4 council: a long label (« Lancer le test terrain ») gets a smaller size, not a squeeze
      const size = Math.max(17, Math.min(22, Math.floor(22 * 208 / measure(label, 22, 800))));
      this.practice = new Button(24, 852, 236, 84, label, 'secondary', size);
      this.start.x = 272;
      this.start.w = 244;
      this.start.size = 24;
      if (this.replay) {
        this.practice.x = 169;
        this.practice.w = 159;
        this.practice.size = 18;
        this.start.x = 336;
        this.start.w = 188;
      }
    }
  }

  get level() {
    return LEVELS[this.levelIndex]!;
  }

  update(dt: number): void {
    this.t += dt;
    const p = this.shell.ctx.pointer;
    const audio = this.shell.audio;
    if (this.back.update(p, dt)) return this.shell.toWorkOrders();
    if (this.start.update(p, dt)) return this.shell.toFlight(this.levelIndex, 0, this.hunt);
    if (this.replay?.update(p, dt)) return this.openReplay?.();
    if (this.practice?.update(p, dt)) return this.openPractice?.();
    // v4 voices: Vrell babbles the memo while it types (in place of the old key clicks)
    if (this.chars === 0 && this.totalChars > 0) {
      const lt = tr().levels[this.level.id];
      audio.speak(`${lt.body} ${lt.joke}`, 'vrell', { within: this.totalChars / CPS });
    }
    this.chars += dt * CPS;
    if (p.pressed && !this.start.contains(p.x, p.y) && !this.back.contains(p.x, p.y) && !this.practice?.contains(p.x, p.y) && !this.replay?.contains(p.x, p.y)) {
      if (this.chars < this.totalChars) audio.hush('vrell');
      this.chars = 1e6; // tap: finish typing
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

const PAPER_Y = 92;
const PAPER_H = 736;
const BODY_Y = PAPER_Y + 228;
const JOKE = { size: JOKE_SIZE, color: '#5a4a1a', align: 'left', weight: 600, italic: true } as const;

interface TypedLine {
  full: string;
  label: Label;
  count: number;
}

function typedLines(parent: Container, lines: readonly string[], look: LabelStyle, x: number, y: number, lh: number): TypedLine[] {
  return lines.map((full, i) => {
    const label = new Label(look).set('', x, y + i * lh);
    parent.addChild(label);
    return { full, label, count: 0 };
  });
}

function syncTyped(lines: TypedLine[], budget: number): number {
  for (const line of lines) {
    const count = Math.max(0, Math.min(budget, line.full.length));
    if (line.count !== count) {
      line.count = count;
      line.label.text = count === line.full.length ? line.full : line.full.slice(0, count);
    }
    line.label.visible = count > 0;
    budget -= line.full.length + 1;
  }
  return budget;
}

class MemoView implements SceneView {
  readonly root = new Container();
  private readonly sky = new NightSky();
  private readonly dot = new Graphics().circle(VIEW_W / 2 - 108, 47, 5).fill(C.red);
  private readonly paper = new Container();
  private readonly portrait: VrellPortrait;
  private readonly body: TypedLine[];
  private readonly joke: TypedLine[];
  private readonly jokeBox = new Container();
  private readonly cursor = new Graphics().rect(PX + PW - 44, PAPER_Y + PAPER_H - 40, 12, 3).fill(C.paperInk);
  private readonly back: ButtonView;
  private readonly start: ButtonView;
  private readonly replay?: ButtonView;
  private readonly practice?: ButtonView;
  private readonly skip = new Label({ size: 14, color: C.muted, weight: 600 }).set(tr().common.tapToSkip, VIEW_W / 2, 838);
  private typedCount = -1;

  constructor(private readonly s: MemoScene) {
    const { assets, save } = s.shell;
    const lv = s.level;
    const m = tr().memo;
    const lt = tr().levels[lv.id];
    this.back = new ButtonView(s.back);
    this.start = new ButtonView(s.start);
    if (s.replay) this.replay = new ButtonView(s.replay);
    if (s.practice) this.practice = new ButtonView(s.practice);
    const page = panelPath(new Graphics(), PX, PAPER_Y, PW, PAPER_H, { fill: C.paper, r: 20, shadow: 8 });
    panelPath(page, VIEW_W / 2 - 70, PAPER_Y - 14, 140, 30, { fill: '#b9a58a', r: 10, lineW: 3, shadow: 0 });
    for (let y = PAPER_Y + 240; y < PAPER_Y + PAPER_H - 20; y += 27) {
      page.moveTo(PX + 20, y).lineTo(PX + PW - 20, y).stroke({ color: C.paperLine, width: 2 });
    }
    page.rect(PX + 28, PAPER_Y + 198, PW - 56, 3).fill('#6a3fbf');
    this.portrait = new VrellPortrait(assets, PX + 76, PAPER_Y + 86, 112);
    const address = { size: 17, color: C.paperInk, align: 'left', weight: 700 } as const;
    const subject = { size: 17, color: '#6a3fbf', align: 'left', weight: 800 } as const;
    const reLines = wrapLines(fmt(m.re, { re: fmt(lt.re, { num: formatOrderNumber(workOrderNumber(lv.id)) }) }), PW - 168, 17, 800);
    this.paper.pivot.set(VIEW_W / 2, PAPER_Y + PAPER_H / 2);
    this.paper.addChild(
      page, this.portrait.root,
      new Label(address).set(memoAddressee(lv.id, save.levels.level12?.delivered), PX + 148, PAPER_Y + 46, PW - 168),
      new Label(address).set(m.from, PX + 148, PAPER_Y + 72, PW - 168),
      new Label({ size: 21, color: C.paperInk, align: 'left', weight: 900 }).set(lt.title, PX + 28, PAPER_Y + 182, PW - 56),
    );
    for (let i = 0; i < Math.min(2, reLines.length); i++) {
      this.paper.addChild(new Label(subject).set(reLines[i]!, PX + 148, PAPER_Y + 98 + i * 22));
    }
    const entries = lv.kind === 'deep' ? lv.map.targets.flatMap((target) => target.entries) : lv.map.entries;
    const first = entries.find((entry) => entry.recommended);
    if (first) {
      const hint = fmt(m.recommended, { route: tr().routes[first.roomId].route, tip: routeAdvice(first.roomId) });
      this.paper.addChild(new Label(subject).set(hint, PX + 28, PAPER_Y + 214, PW - 56));
    }

    // Step down the body size when the copy would reach the goals block.
    const bodyOffset = first ? 24 : 0;
    const bodyY = BODY_Y + bodyOffset;
    const { joke, bodySize, bodyLH, body } = memoBodyLayout(lt.body, lt.joke, bodyOffset);
    this.body = typedLines(this.paper, body, { size: bodySize, color: C.paperInk, align: 'left', weight: 500 }, PX + 28, bodyY, bodyLH);
    const jokeTop = bodyY + body.length * bodyLH + 6;
    this.jokeBox.addChild(panelPath(new Graphics(), PX + 18, jokeTop - 14, PW - 36, joke.length * JOKE_LH + 20, { fill: '#fff6c9', r: 12, stroke: '#d8c48a', lineW: 2, shadow: 0 }));
    this.joke = typedLines(this.jokeBox, joke, JOKE, PX + 32, jokeTop + 8, JOKE_LH);
    this.paper.addChild(this.jokeBox, this.cursor);

    // a fourth goal (the town pickup star) packs the lines a little tighter in the same space
    const labels = shownStarLabels(lv);
    const goals = labels.length;
    const pitch = goals > 3 ? 30 : 38;
    const gy = PAPER_Y + PAPER_H - (goals > 3 ? 166 : 160);
    this.paper.addChild(new Label({ size: 15, color: '#6a3fbf', align: 'left', weight: 900 }).set(m.goals, PX + 28, gy));
    const words = tr().crestValley;
    const birch = tr().birch;
    const deepGoals = lv.id === 'birch_bakery' ? [birch.deliverGoal, m.deepGoals[1]!, birch.owlGoal]
      : lv.id === 'birch_neighbours' ? [birch.neighboursGoal, m.deepGoals[1]!, m.deepGoals[2]!]
      : lv.id === 'level12' ? [tr().dispatch2199.deliverGoal, m.deepGoals[1]!, tr().dispatch2199.owlGoal]
      : lv.id === 'level9' ? [words.deliverGoal, m.deepGoals[1]!, words.owlGoal]
      : lv.id === 'level8' ? [tr().timeTrial.deliverGoal, tr().timeTrial.ghost, m.deepGoals[2]!] : m.deepGoals;
    const lines = [...(lv.kind === 'deep' ? deepGoals : m.tutorialGoals), lv.id === 'level9' ? words.carGoal : m.pickupGoal];
    const times = lv.kind === 'deep' && lv.clockMode !== 'elapsed'
      ? [fmtTime(lv.budgetSec), '', fmtTime(lv.parMarginSec), '']
      : ['', '', fmtTime(lv.kind === 'deep' ? deepPar(lv) : lv.parSec), ''];
    const best = save.levels[lv.id].stars;
    const goalLook = { size: goals > 3 ? 16 : 17, color: C.paperInk, align: 'left', weight: 700 } as const;
    const starPx = goals > 3 ? 26 : 30;
    for (let i = 0; i < goals; i++) {
      const star = iconSprite(starTexture(assets, starPx, best[i] === true), starPx);
      const y = gy + (goals > 3 ? 30 : 34) + i * pitch;
      star.position.set(PX + 46, y);
      this.paper.addChild(star, new Label(goalLook).set(fmt(lines[i]!, { star: labels[i]!, time: times[i]! }), PX + 72, y, PW - 72 - 20));
    }
    this.paper.addChild(new Label({ size: 14, color: '#7a70a0', align: 'right', weight: 600, italic: true }).set(lt.signoff ?? m.signoff, PX + PW - 24, PAPER_Y + PAPER_H - 22, PW - 48)); // v4 story
    this.root.addChild(
      this.sky, this.back,
      new Label({ size: 22, color: C.mint, weight: 900 }).set(m.incoming, VIEW_W / 2 + 20, 48, 230),
      this.dot, this.paper, this.start, this.skip,
    );
    if (this.replay) this.root.addChild(this.replay);
    if (this.practice) this.root.addChild(this.practice);
  }

  sync(): void {
    const { t, chars, shell, totalChars } = this.s;
    const reduced = shell.ctx.reducedMotion;
    const typing = chars < totalChars;
    this.sky.sync(t, reduced);
    this.back.sync();
    this.start.sync();
    this.replay?.sync();
    this.practice?.sync();
    this.portrait.sync(t, reduced);
    this.dot.alpha = reduced ? 1 : 0.55 + 0.45 * Math.sin(t * 5);
    const land = reduced ? 1 : easeOutBack(t / 0.42, 1.1);
    this.paper.position.set(VIEW_W / 2, PAPER_Y + PAPER_H / 2 + (1 - land) * 620);
    this.paper.rotation = (1 - land) * 0.09;
    const count = Math.min(totalChars + this.body.length + this.joke.length, Math.floor(chars));
    if (count !== this.typedCount) {
      this.typedCount = count;
      const rest = syncTyped(this.body, count);
      this.jokeBox.visible = rest > 0;
      syncTyped(this.joke, rest);
    }
    this.cursor.visible = typing && (reduced || Math.floor(t * 3) % 2 === 0);
    this.skip.visible = typing;
  }
}

/** Space the memo body and joke box may use before the goals block (v0.2: guarded by tests/ui-memo-fit.test.ts). */
export const MEMO_TEXT_BUDGET = PAPER_H - 160 - 22;
export const MEMO_BODY_FLOOR = 16;

/**
 * The memo body steps its font down until body + joke clear the goals block, never below MEMO_BODY_FLOOR.
 * `overflow` > 0 means the copy still reaches the goals block at the floor: the copy must be cut.
 */
export function memoBodyLayout(bodyText: string, jokeText: string, bodyOffset: number) {
  const joke = wrapLines(jokeText, PW - 84, JOKE_SIZE, 600, true);
  let bodySize = BODY_SIZE;
  let bodyLH = BODY_LH;
  let body = wrapLines(bodyText, PW - 56, bodySize, 500);
  const used = () => 228 + bodyOffset + body.length * bodyLH + 12 + joke.length * JOKE_LH;
  while (bodySize > MEMO_BODY_FLOOR && used() > MEMO_TEXT_BUDGET) {
    bodySize--;
    bodyLH = Math.round(bodySize * 1.35);
    body = wrapLines(bodyText, PW - 56, bodySize, 500);
  }
  return { joke, bodySize, bodyLH, body, used: used(), overflow: used() - MEMO_TEXT_BUDGET };
}
