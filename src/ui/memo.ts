import type { Scene } from '../contracts';
import { VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { LEVELS } from '../levels/levels';
import { fmt, tr } from '../i18n';
import { drawPortrait, drawStar, easeOutBack, fmtTime, panel, text, wrap } from './draw';
import { C, font } from './theme';
import { Button, drawNightSky } from './widgets';

const PX = 24;
const PW = VIEW_W - 48;
const BODY_SIZE = 20;
const BODY_LH = 27;
const JOKE_SIZE = 18;
const JOKE_LH = 24;
const CPS = 70;

export class MemoScene implements Scene {
  private t = 0;
  private chars = 0;
  private readonly back = new Button(16, 18, 64, 60, '‹', 'ghost', 40);
  private readonly start = new Button(90, 852, VIEW_W - 180, 84, tr().memo.startShift, 'primary', 32);
  private bodyLines: string[] | null = null;
  private jokeLines: string[] | null = null;
  private totalChars = 0;
  private bodySize = BODY_SIZE;
  private bodyLH = BODY_LH;

  constructor(
    private readonly shell: Shell,
    private readonly levelIndex: number,
  ) {}

  private get level() {
    return LEVELS[this.levelIndex]!;
  }

  update(dt: number): void {
    this.t += dt;
    const p = this.shell.ctx.pointer;
    const audio = this.shell.audio;
    if (this.back.update(p, dt, audio)) return this.shell.toWorkOrders();
    if (this.start.update(p, dt, audio)) return this.shell.toFlight(this.levelIndex);
    const before = Math.floor(this.chars);
    this.chars += dt * CPS;
    if (this.totalChars > 0 && before < this.totalChars && Math.floor(this.chars / 6) !== Math.floor(before / 6)) audio.sfx('click', 0.25);
    if (p.pressed && !this.start.contains(p.x, p.y) && !this.back.contains(p.x, p.y)) this.chars = 1e6; // tap: finish typing
  }

  render(g: CanvasRenderingContext2D): void {
    const { assets, ctx } = this.shell;
    drawNightSky(g, this.t, ctx.reducedMotion);
    const lv = this.level;
    const m = tr().memo;
    const lt = tr().levels[lv.id];
    this.back.render(g);
    text(g, m.incoming, VIEW_W / 2 + 20, 48, 22, C.mint, 'center', 900, false, 230);
    // "new mail" dot
    g.beginPath();
    g.arc(VIEW_W / 2 - 108, 47, 5, 0, Math.PI * 2);
    g.fillStyle = C.red;
    g.globalAlpha = ctx.reducedMotion ? 1 : 0.55 + 0.45 * Math.sin(this.t * 5);
    g.fill();
    g.globalAlpha = 1;

    // paper: slaps down onto the desk, a touch crooked, then straightens
    const py = 92;
    const ph = 736;
    const land = ctx.reducedMotion ? 1 : easeOutBack(this.t / 0.42, 1.1);
    g.save();
    g.translate(VIEW_W / 2, py + ph / 2 + (1 - land) * 620);
    g.rotate((1 - land) * 0.09);
    g.translate(-VIEW_W / 2, -(py + ph / 2));
    panel(g, PX, py, PW, ph, C.paper, 20, C.ink, 4, 8);
    // clip at top
    panel(g, VIEW_W / 2 - 70, py - 14, 140, 30, '#b9a58a', 10, C.ink, 3, 0);
    g.strokeStyle = C.paperLine;
    g.lineWidth = 2;
    for (let y = py + 240; y < py + ph - 20; y += 27) {
      g.beginPath();
      g.moveTo(PX + 20, y);
      g.lineTo(PX + PW - 20, y);
      g.stroke();
    }

    drawPortrait(g, assets, 'vrell', PX + 76, py + 86, 112, this.t);
    text(g, m.to, PX + 148, py + 46, 17, C.paperInk, 'left', 700, false, PW - 168);
    text(g, m.from, PX + 148, py + 72, 17, C.paperInk, 'left', 700, false, PW - 168);
    const reLines = wrap(g, fmt(m.re, { re: lt.re }), PW - 168, 17, 800);
    g.font = font(17, 800);
    g.fillStyle = '#6a3fbf';
    g.textAlign = 'left';
    for (let i = 0; i < Math.min(2, reLines.length); i++) g.fillText(reLines[i]!, PX + 148, py + 98 + i * 22);
    text(g, lt.title, PX + 28, py + 182, 21, C.paperInk, 'left', 900, false, PW - 56);
    g.fillStyle = '#6a3fbf';
    g.fillRect(PX + 28, py + 198, PW - 56, 3);

    // typewriter body + joke
    if (!this.bodyLines) {
      // French runs longer: step the body down a size if body + joke would reach the goals block
      this.bodySize = BODY_SIZE;
      this.bodyLH = BODY_LH;
      for (;;) {
        this.bodyLines = wrap(g, lt.body, PW - 56, this.bodySize, 500);
        this.jokeLines = wrap(g, lt.joke, PW - 84, JOKE_SIZE, 600, true);
        const bottom = 228 + this.bodyLines.length * this.bodyLH + 6 - 14 + this.jokeLines.length * JOKE_LH + 20;
        if (bottom <= 736 - 160 - 22 || this.bodySize <= 16) break;
        this.bodySize -= 1;
        this.bodyLH = Math.round(this.bodySize * 1.35);
      }
      this.totalChars = lt.body.length + lt.joke.length;
    }
    let budget = Math.floor(this.chars);
    let y = py + 228;
    g.font = font(this.bodySize, 500);
    g.fillStyle = C.paperInk;
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    for (const line of this.bodyLines) {
      if (budget <= 0) break;
      g.fillText(budget >= line.length ? line : line.slice(0, budget), PX + 28, y);
      budget -= line.length + 1;
      y += this.bodyLH;
    }
    const jokeTop = py + 228 + this.bodyLines.length * this.bodyLH + 6;
    if (budget > 0 && this.jokeLines) {
      const jh = this.jokeLines.length * JOKE_LH + 20;
      panel(g, PX + 18, jokeTop - 14, PW - 36, jh, '#fff6c9', 12, '#d8c48a', 2, 0);
      g.font = font(JOKE_SIZE, 600, true);
      g.fillStyle = '#5a4a1a';
      let jy = jokeTop + 8;
      for (const line of this.jokeLines) {
        if (budget <= 0) break;
        g.fillText(budget >= line.length ? line : line.slice(0, budget), PX + 32, jy);
        budget -= line.length + 1;
        jy += JOKE_LH;
      }
    }
    const typing = this.chars < this.totalChars;
    if (typing && Math.floor(this.t * 3) % 2 === 0) {
      g.fillStyle = C.paperInk;
      g.fillRect(PX + PW - 44, py + ph - 40, 12, 3);
    }

    // star goals
    const gy = py + ph - 160;
    text(g, m.goals, PX + 28, gy, 15, '#6a3fbf', 'left', 900);
    const labels = lv.kind === 'deep' ? tr().starLabels.deep : tr().starLabels.tutorial;
    const lines = lv.kind === 'deep' ? m.deepGoals : m.tutorialGoals;
    const times = lv.kind === 'deep' ? [fmtTime(lv.budgetSec), '', fmtTime(lv.parMarginSec)] : ['', '', fmtTime(lv.parSec)];
    const goals = [0, 1, 2].map((k) => fmt(lines[k]!, { star: labels[k]!, time: times[k]! }));
    const best = this.shell.save.levels[lv.id].stars;
    for (let i = 0; i < 3; i++) {
      drawStar(g, assets, PX + 46, gy + 34 + i * 38, 30, best[i] === true);
      text(g, goals[i]!, PX + 72, gy + 34 + i * 38, 17, C.paperInk, 'left', 700, false, PW - 72 - 20);
    }
    text(g, m.signoff, PX + PW - 24, py + ph - 22, 14, '#7a70a0', 'right', 600, true, PW - 48);
    g.restore();

    this.start.render(g);
    if (typing) text(g, tr().common.tapToSkip, VIEW_W / 2, 838, 14, C.muted, 'center', 600);
  }
}
