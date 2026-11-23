// Wraps an abduction scene during a deep shift: the sunrise clock keeps running, shown in the chip
// slot the abduction view leaves free on its second HUD row, and the room warms up in the last 30 s.
import type { Assets, Scene } from '../contracts';
import { DEEP_HUD_SUNRISE_SLOT, DEEP_HUD_WARNING_SLOT } from '../abduct/deep-view';
import { GLOW, drawEdgeTint } from '../core/fx';
import type { DeepRun } from '../levels/run';
import { hudPanel, hudSunClock } from './hud';
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
    const sun = DEEP_HUD_SUNRISE_SLOT;
    g.globalAlpha = 0.92;
    hudSunClock(g, sun.x, sun.y, sun.w, sun.h, this.clock, this.run.elapsed / this.run.budget, dawn, this.t, this.reduced(), this.assets.get('ui/sunrise_clock'));
    g.globalAlpha = 1;
    if (dawn > 0.5) {
      // The last 15 s: a steady pill (reduced motion) or a blinking one, in the slot beside the
      // Snooze Ray chip, clear of the room/exit bar below.
      const warn = DEEP_HUD_WARNING_SLOT;
      const on = this.reduced() || Math.floor(this.t * 2) % 2 === 0;
      hudPanel(g, warn.x, warn.y, warn.w, warn.h, on ? C.amber : C.ink);
      text(g, 'SUN\'S COMING UP!', warn.x + warn.w / 2, warn.y + warn.h / 2, 16, on ? C.amberHi : C.muted, 'center', 900, false, warn.w - 20);
    }
  }

  dispose(): void {
    this.inner.dispose?.();
  }
}
