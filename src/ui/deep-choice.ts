// After a failed (or abandoned) abduction in a deep shift: one big "Retry" and a way out.
import { Container, Graphics } from 'pixi.js';
import { apeFallback } from '../abduct/monolith-art';
import type { Scene } from '../contracts';
import { VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { abductFailLine } from '../levels/humor';
import type { DeepRun } from '../levels/run';
import { easeOutBack } from '../core/fx';
import { GLOW, ScreenTint } from '../core/gfx/glow';
import { ViewSlot, type SceneView } from '../core/gfx/scene';
import { roundRect } from '../core/gfx/shapes';
import { Label, Paragraph } from '../core/gfx/text';
import { targetHeadKey } from './draw';
import { artSprite } from './views/art';
import { NightSky } from './views/backdrop';
import { ButtonView } from './views/button';
import { highlightedPanel, SunIcon } from './views/menu-decor';
import { VrellPortrait } from './views/portrait';
import { C } from './theme';
import { Button } from './widgets';

import { fmt, gt, tr } from '../i18n';

let rotation = 0;

export interface DeepChoiceActions {
  retry(): void;
  backToFlight(): void;
  quit(): void;
}

export class DeepChoiceScene implements Scene {
  t = 0;
  readonly line: string;
  readonly title: string;
  readonly building: string;
  readonly status: string;
  readonly retry: Button;
  readonly back = new Button(70, 676, VIEW_W - 140, 76, tr().common.backToFlight, 'secondary', 26);
  readonly quit = new Button(70, 772, VIEW_W - 140, 60, tr().deepChoice.abandon, 'ghost', 22);

  private readonly look = new ViewSlot(() => new DeepChoiceView(this));

  constructor(
    readonly shell: Shell,
    readonly run: DeepRun,
    private readonly actions: DeepChoiceActions,
  ) {
    const f = run.lastFail!;
    const reason = f.reason ?? 'aborted';
    const d = tr().deepChoice;
    this.title = (d.titles as Record<string, string>)[reason] ?? d.failed;
    this.line = abductFailLine(f.reason, f.by, f.roomId, rotation++ + run.failedAbductions);
    const tg = run.level.map.targets[f.target]!;
    const entry = tg.entries[f.entry]!;
    this.building = fmt(d.building, { name: gt(tg.short), route: tr().routes[entry.roomId].route });
    this.retry = new Button(50, 540, VIEW_W - 100, 116, fmt(d.retry, { name: gt(tg.short) }), 'primary', 36);
    const left = run.remaining;
    const m = Math.floor(left / 60);
    const sec = Math.floor(left % 60);
    this.status = fmt(run.level.id === 'level9' ? d.stormIn : d.sunriseIn, { time: `${m}:${sec < 10 ? '0' : ''}${sec}` });
  }

  update(dt: number): void {
    if (this.t === 0) this.shell.audio.speak(this.line, 'vrell', { within: 3 }); // v4 voices: Vrell says it
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

class DeepChoiceView implements SceneView {
  readonly root = new Container();
  private readonly sky = new NightSky();
  private readonly title: Label;
  private readonly portrait: VrellPortrait;
  private readonly sun: SunIcon | null;
  private readonly alarm = ScreenTint.edge(GLOW.red);
  private readonly buttons: ButtonView[];
  private readonly failedFace: Container | Graphics | null;

  constructor(private readonly s: DeepChoiceScene) {
    this.sun = s.run.level.id === 'level9' ? null : new SunIcon(9, 12, 16);
    this.title = new Label({ size: s.title.length > 13 ? 42 : 50, color: C.red, weight: 900, outline: C.ink });
    this.title.set(s.title, VIEW_W / 2, 120, VIEW_W - 60);
    this.title.rotation = -0.05;
    this.titleSqueeze = this.title.scale.x;
    this.portrait = new VrellPortrait(s.shell.assets, 116, 290, 112, true);
    const line = new Paragraph({ size: 19, color: C.text, weight: 600, lineHeight: 25, align: 'left', italic: true });
    line.setBlock(s.line, 190, 236, VIEW_W - 250);
    this.buttons = [s.retry, s.back, s.quit].map((button) => new ButtonView(button));
    this.root.addChild(
      this.sky, this.title,
      new Label({ size: 18, color: C.muted, weight: 800 }).set(s.building, VIEW_W / 2, 178, VIEW_W - 60),
      highlightedPanel(new Graphics(), 40, 210, VIEW_W - 80, 290, { fill: C.panel }),
      this.portrait.root, line,
    );
    this.failedFace = this.buildShiftStrip();
    this.root.addChild(this.alarm, ...this.buttons);
  }

  private readonly titleSqueeze: number;

  /** The shift clock and the three specimens at the moment the attempt ended. */
  private buildShiftStrip(): Container | Graphics | null {
    const { shell, run, status } = this.s;
    let failedFace: Container | Graphics | null = null;
    for (const [i, target] of run.level.map.targets.entries()) {
      const x = 82 + i * 50;
      const done = run.delivered[i]!;
      const failed = run.lastFail?.target === i;
      const headKey = targetHeadKey(target);
      const face = artSprite(shell.assets, headKey, 42, 48) ?? apeFallback(headKey, 42, 48) ?? new Graphics().circle(0, -2, 16).fill('#d5a182');
      face.y = 4;
      face.alpha = done ? 0.6 : 1;
      if (failed) failedFace = face;
      const photo = new Container();
      const mask = new Graphics().circle(0, 0, 20).fill('#ffffff');
      photo.addChild(face);
      photo.mask = mask;
      const badge = new Container();
      badge.position.set(x, 424);
      badge.addChild(
        new Graphics().circle(0, 0, 20).fill(done ? '#1d5a4a' : '#16102e'),
        mask, photo,
        new Graphics().circle(0, 0, 20).stroke({ color: done ? C.mint : failed ? C.red : '#6b63a3', width: 3 }),
      );
      if (done) badge.addChild(new Graphics().moveTo(6, 10).lineTo(11, 15).lineTo(20, 4).stroke({ color: C.mint, width: 4, cap: 'round', join: 'round' }));
      this.root.addChild(badge);
    }

    const x = 228;
    const w = VIEW_W - 120 - 168 - 26;
    const used = w * Math.min(1, run.elapsed / run.budget);
    const hot = run.deadlineWarning > 0;
    const bar = roundRect(new Graphics(), x, 426, w, 14, 7).fill('#16102e');
    if (used < w) roundRect(bar, x + used, 426, w - used, 14, 7).fill(hot ? C.amber : C.mint);
    const deadline = this.sun?.root ?? new Graphics().poly([1, -14, -9, 1, -2, 1, -5, 14, 9, -4, 2, -4])
      .fill(hot ? C.amberHi : C.muted);
    deadline.position.set(x + w + 12, 433);
    this.root.addChild(new Label({ size: 15, color: hot ? C.amberHi : C.muted, weight: 800, align: 'left' }).set(status, x, 410, w), bar, deadline);
    return failedFace;
  }

  sync(): void {
    const { t, shell } = this.s;
    const reduced = shell.ctx.reducedMotion;
    const pop = reduced ? 1 : easeOutBack(t / 0.3);
    this.sky.sync(t, reduced);
    this.title.scale.set(pop * this.titleSqueeze, pop);
    this.portrait.sync(t, reduced);
    if (this.failedFace) this.failedFace.x = reduced ? 0 : Math.sin(t * 9) * 2;
    this.sun?.sync(reduced ? 0 : t * 0.8);
    this.alarm.strength = t < 0.6 ? (1 - t / 0.6) * 0.8 : 0;
    for (const button of this.buttons) button.sync();
  }
}
