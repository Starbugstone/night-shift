// After a failed (or abandoned) abduction in a deep shift: one big "Retry" and a way out.
import type { Scene } from '../contracts';
import { VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { abductFailLine } from '../levels/humor';
import type { DeepRun } from '../levels/run';
import { drawPortrait, easeOutBack, outlinedText, panel, panelHighlight, paragraph, sprite, text } from './draw';
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
    const left = this.run.remaining;
    const m = Math.floor(left / 60);
    const s = Math.floor(left % 60);
    text(g, `Sunrise in ${m}:${s < 10 ? '0' : ''}${s} of shift time · ${this.run.deliveredCount}/3 collected`, VIEW_W / 2, 470, 16, this.run.dawn > 0 ? C.amberHi : C.muted, 'center', 700);
    this.retry.render(g);
    this.back.render(g);
    this.quit.render(g);
  }
}
