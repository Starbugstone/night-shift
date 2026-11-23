// After a failed (or abandoned) abduction in a deep shift: one big "Retry" and a way out.
import type { Scene } from '../contracts';
import { VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { abductFailLine } from '../levels/humor';
import type { DeepRun } from '../levels/run';
import { GLOW, drawEdgeTint } from '../core/fx';
import { drawPortrait, easeOutBack, headKey, outlinedText, panel, panelHighlight, paragraph, roundRectPath, sprite, text } from './draw';
import { C } from './theme';
import { Button, drawNightSky } from './widgets';

const TITLES: Record<string, string> = {
  woke: 'SPECIMEN AWAKE',
  sleeper: 'SOMEONE WOKE UP',
  alarm: 'ALARM!',
  aborted: 'SHIFT PAUSED',
};

let rotation = 0;

export interface DeepChoiceActions {
  retry(): void;
  backToFlight(): void;
  quit(): void;
}

export class DeepChoiceScene implements Scene {
  private t = 0;
  private readonly line: string;
  private readonly title: string;
  private readonly building: string;
  private readonly status: string;
  private readonly retry: Button;
  private readonly back = new Button(70, 676, VIEW_W - 140, 76, 'Back to flight', 'secondary', 26);
  private readonly quit = new Button(70, 772, VIEW_W - 140, 60, 'Abandon shift', 'ghost', 22);

  constructor(
    private readonly shell: Shell,
    private readonly run: DeepRun,
    private readonly actions: DeepChoiceActions,
  ) {
    const f = run.lastFail!;
    const reason = f.reason ?? 'aborted';
    this.title = TITLES[reason] ?? 'FAILED';
    this.line = abductFailLine(f.reason, f.by, f.roomId, rotation++ + run.failedAbductions);
    const tg = run.level.map.targets[f.target]!;
    this.building = `${tg.short} · ${tg.entries[f.entry]!.route}`;
    this.retry = new Button(50, 540, VIEW_W - 100, 116, `Retry (${tg.short})`, 'primary', 36);
    const left = run.remaining;
    const m = Math.floor(left / 60);
    const sec = Math.floor(left % 60);
    this.status = `Sunrise in ${m}:${sec < 10 ? '0' : ''}${sec}`;
  }

  update(dt: number): void {
    this.t += dt;
    const p = this.shell.ctx.pointer;
    const a = this.shell.audio;
    // a short beat so a panicked tap from the room doesn't land on a button
    const ready = this.t > 0.35;
    this.retry.enabled = ready;
    this.back.enabled = ready;
    this.quit.enabled = ready;
    if (this.retry.update(p, dt, a)) return this.actions.retry();
    if (this.back.update(p, dt, a)) return this.actions.backToFlight();
    if (this.quit.update(p, dt, a)) return this.actions.quit();
  }

  /** Where the shift stands: the three specimens, and the night as a bar running out towards the sun. */
  private shiftStrip(g: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const { assets, ctx } = this.shell;
    const run = this.run;
    const tg = run.level.map.targets;
    for (let i = 0; i < 3; i++) {
      const cx = x + 22 + i * 50;
      const done = run.delivered[i]!;
      const failed = run.lastFail?.target === i;
      g.beginPath();
      g.arc(cx, y + 20, 20, 0, Math.PI * 2);
      g.fillStyle = done ? '#1d5a4a' : '#16102e';
      g.fill();
      g.save();
      g.clip();
      g.globalAlpha = done ? 0.6 : 1;
      const wob = failed && !ctx.reducedMotion ? Math.sin(this.t * 9) * 2 : 0;
      sprite(g, assets, headKey(tg[i]!.short), cx + wob, y + 24, 42, 48);
      g.restore();
      g.beginPath();
      g.arc(cx, y + 20, 20, 0, Math.PI * 2);
      g.lineWidth = 3;
      g.strokeStyle = done ? C.mint : failed ? C.red : '#6b63a3';
      g.stroke();
      if (done) {
        g.lineWidth = 4;
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.strokeStyle = C.mint;
        g.beginPath();
        g.moveTo(cx + 6, y + 30);
        g.lineTo(cx + 11, y + 35);
        g.lineTo(cx + 20, y + 24);
        g.stroke();
        g.lineCap = 'butt';
      }
    }
    // the night: used so far in indigo, what is left in mint, the sun waiting at the end
    const bx = x + 168;
    const bw = w - 168 - 26;
    const k = Math.min(1, run.elapsed / run.budget);
    const hot = run.dawn > 0;
    text(g, this.status, bx, y + 6, 15, hot ? C.amberHi : C.muted, 'left', 800);
    roundRectPath(g, bx, y + 22, bw, 14, 7);
    g.fillStyle = '#16102e';
    g.fill();
    roundRectPath(g, bx + bw * k, y + 22, bw * (1 - k), 14, 7);
    g.fillStyle = hot ? C.amber : C.mint;
    g.fill();
    g.beginPath();
    g.arc(bx + bw + 12, y + 29, 9, 0, Math.PI * 2);
    g.fillStyle = C.amberHi;
    g.fill();
    g.strokeStyle = C.amberHi;
    g.lineWidth = 2;
    g.lineCap = 'round';
    g.beginPath();
    const turn = ctx.reducedMotion ? 0 : this.t * 0.8;
    for (let i = 0; i < 8; i++) {
      const a = turn + (i * Math.PI) / 4;
      g.moveTo(bx + bw + 12 + Math.cos(a) * 12, y + 29 + Math.sin(a) * 12);
      g.lineTo(bx + bw + 12 + Math.cos(a) * 16, y + 29 + Math.sin(a) * 16);
    }
    g.stroke();
    g.lineCap = 'butt';
  }

  render(g: CanvasRenderingContext2D): void {
    const { assets, ctx } = this.shell;
    const rm = ctx.reducedMotion;
    drawNightSky(g, this.t, rm);
    const pop = rm ? 1 : easeOutBack(this.t / 0.3);
    g.save();
    g.translate(VIEW_W / 2, 120);
    g.rotate(-0.05);
    g.scale(pop, pop);
    outlinedText(g, this.title, 0, 0, this.title.length > 13 ? 42 : 50, C.red, C.ink, 900);
    g.restore();
    text(g, this.building, VIEW_W / 2, 178, 18, C.muted, 'center', 800);
    panel(g, 40, 210, VIEW_W - 80, 290, C.panel, 22, C.ink, 4, 6);
    panelHighlight(g, 40, 210, VIEW_W - 80, 22);
    g.save();
    g.beginPath();
    g.arc(116, 290, 56, 0, Math.PI * 2);
    g.clip();
    const furious = sprite(g, assets, 'ui/vrell_furious', 116, 290, 112, 112);
    g.restore();
    if (!furious) drawPortrait(g, assets, 'vrell', 116, 290, 112, this.t);
    paragraph(g, this.line, 190, 236, VIEW_W - 250, 19, C.text, 25, 'left', 600, true);
    this.shiftStrip(g, 60, 404, VIEW_W - 120);
    // the alarm is still ringing in everyone's ears
    if (this.t < 0.6) drawEdgeTint(g, GLOW.red, (1 - this.t / 0.6) * 0.8);
    this.retry.render(g);
    this.back.render(g);
    this.quit.render(g);
  }
}
