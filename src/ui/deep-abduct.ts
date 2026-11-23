// Wraps an abduction scene during a deep shift: the sunrise clock keeps running, shown in a small
// chip under the abduction HUD row, and the room warms up in the last 30 s.
import type { Assets, Scene } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import { GLOW, drawEdgeTint } from '../core/fx';
import type { DeepRun } from '../levels/run';
import { HUD_ROW, hudSunClock } from './hud';
import { text } from './draw';
import { C } from './theme';

export interface InnerScene extends Scene {
  debug?: unknown;
}

export class DeepAbductScene implements Scene {
  private done = false;
  private clock = '';
  private clockKey = -1;
  private t = 0;

  constructor(
    readonly inner: InnerScene,
    private readonly run: DeepRun,
    private readonly assets: Assets,
    private readonly reduced: () => boolean,
    private readonly onSunrise: () => void,
  ) {}

  /** The abduction's own debug object (its autopilot lives there). */
  get debug(): unknown {
    return this.inner.debug;
  }

  update(dt: number): void {
    this.t += dt;
    if (this.done) return;
    if (this.run.tick(dt)) {
      this.done = true;
      this.onSunrise();
      return;
    }
    this.inner.update(dt);
  }

  render(g: CanvasRenderingContext2D): void {
    this.inner.render(g);
    const dawn = this.run.dawn;
    if (dawn > 0) drawEdgeTint(g, GLOW.warm, dawn * 0.8);
    const key = Math.floor(this.run.elapsed * 4);
    if (key !== this.clockKey) {
      this.clockKey = key;
      this.clock = this.run.clockText();
    }
    const w = 130;
    const x = VIEW_W - w - 14;
    const y = HUD_ROW.y + HUD_ROW.h + 10;
    g.globalAlpha = 0.92;
    hudSunClock(g, x, y, w, 52, this.clock, this.run.elapsed / this.run.budget, dawn, this.t, this.reduced(), this.assets.get('ui/sunrise_clock'));
    g.globalAlpha = 1;
    if (dawn > 0.5 && !this.reduced() && Math.floor(this.t * 2) % 2 === 0) text(g, 'SUN\'S COMING UP!', VIEW_W / 2, VIEW_H - 24, 16, C.amberHi, 'center', 900);
  }

  dispose(): void {
    this.inner.dispose?.();
  }
}
