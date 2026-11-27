// Wrap an abduction during a deep shift, with the sunrise clock and warning over the room.
import { Container } from 'pixi.js';
import { getLang } from '../i18n';
import type { Assets, RoomId, Scene } from '../contracts';
import { DEEP_HUD_SUNRISE_SLOT, DEEP_HUD_WARNING_SLOT, deepShift } from '../abduct/deep-view';
import { GLOW, ScreenTint } from '../core/gfx/glow';
import { ViewSlot, type SceneView } from '../core/gfx/scene';
import { Label } from '../core/gfx/text';
import { roomChargesShift, type DeepRun } from '../levels/run';
import { artTex } from './views/art';
import { HudPanel, HudSunClock, HudTimer } from './views/hud';
import { C } from './theme';
import { clockLook, deadlineWarning as deadlineCaption, type ClockLook } from './deadline';

export interface InnerScene extends Scene {
  readonly view: Container;
  render(): void;
  /** The room (an AbductSimulation): `delivered` once it has accepted the specimen. */
  debug?: { readonly delivered?: boolean };
  /** The room it plays, for test scripts. */
  readonly roomId?: RoomId;
}

export class DeepAbductScene implements Scene {
  private done = false;
  private t = 0;
  private readonly look: ViewSlot<DeepShiftView>;

  constructor(
    readonly inner: InnerScene,
    private readonly run: DeepRun,
    assets: Assets,
    reduced: () => boolean,
    private readonly onSunrise: () => void,
  ) {
    this.look = new ViewSlot(() => new DeepShiftView(inner.view, assets, run, reduced, () => this.t));
  }

  get view(): Container {
    return this.look.get().root;
  }

  get debug(): InnerScene['debug'] {
    return this.inner.debug;
  }

  get roomId(): RoomId | undefined {
    return this.inner.roomId;
  }

  update(dt: number): void {
    this.t += dt;
    if (this.done) return;
    // v0.2 presentation: a delivery the room accepted is safe; its exit animation costs no shift time
    if (roomChargesShift(this.inner.debug) && this.run.tick(dt)) {
      this.done = true;
      this.onSunrise();
      return;
    }
    this.inner.update(dt);
  }

  render(): void {
    deepShift.dawn = this.run.dawn;
    deepShift.delivered = this.run.deliveredCount;
    deepShift.total = this.run.level.map.targets.length;
    deepShift.sharedTimer = this.run.level.id === 'birch_bakery' || this.run.level.id === 'birch_neighbours';
    deepShift.elapsed = this.run.elapsed;
    this.inner.render();
    this.look.peek()?.sync();
  }

  dispose(): void {
    deepShift.dawn = 0;
    deepShift.delivered = -1;
    deepShift.total = 3;
    deepShift.sharedTimer = false;
    deepShift.elapsed = undefined;
    this.look.destroy();
    this.inner.dispose?.();
  }
}

class DeepShiftView implements SceneView {
  readonly root = new Container();
  private readonly tint = ScreenTint.edge(GLOW.warm);
  private readonly sun: HudSunClock | HudTimer;
  private readonly look: ClockLook;
  private readonly warning = new Container();
  private readonly panel = new HudPanel();
  private readonly caption = new Label({ size: 16, weight: 900, color: '#ffffff' });
  private clock = '';
  private clockKey = -1;
  private readonly clockX: number;

  constructor(
    private readonly inner: Container,
    assets: Assets,
    private readonly run: DeepRun,
    private readonly reduced: () => boolean,
    private readonly time: () => number,
  ) {
    const look = (this.look = clockLook(run.level));
    const room = run.current?.roomId;
    this.clockX = room === 'inventor_balcony' || room === 'bully_transom' || room === 'band_hatch' ? 14 : DEEP_HUD_SUNRISE_SLOT.x;
    // v0.2: the same clock look as the flight HUD, from the level's clockMode
    this.sun = look.timer ? new HudTimer() : new HudSunClock(look.sunFace ? artTex(assets, 'ui/sunrise_clock', DEEP_HUD_SUNRISE_SLOT.w, DEEP_HUD_SUNRISE_SLOT.h) : null,
      look.label, look.noDawnGlow);
    this.sun.alpha = 0.92;
    this.warning.position.set(DEEP_HUD_WARNING_SLOT.x, DEEP_HUD_WARNING_SLOT.y);
    this.warning.addChild(this.panel, this.caption);
    this.root.addChild(inner, this.tint, this.sun, this.warning);
  }

  sync(): void {
    const { dawn, deadlineWarning, elapsed, budget } = this.run;
    const t = this.time();
    const rm = this.reduced();
    this.tint.strength = dawn * 0.8;
    const key = Math.floor(elapsed * 4);
    if (key !== this.clockKey) {
      this.clockKey = key;
      this.clock = this.run.clockText(getLang());
    }
    const { y, w, h } = DEEP_HUD_SUNRISE_SLOT;
    if (this.sun instanceof HudTimer) this.sun.sync(this.clockX, y, w, h, this.clock);
    else this.sun.sync(this.clockX, y, w, h, this.clock, elapsed / budget, deadlineWarning, t, rm || this.look.steady);
    this.warning.visible = deadlineWarning > (this.look.steady ? 0 : 0.5);
    if (this.warning.visible) {
      const warn = DEEP_HUD_WARNING_SLOT;
      const on = this.look.steady || rm || Math.floor(t * 2) % 2 === 0;
      this.panel.set(warn.w, warn.h, on ? C.amber : C.ink);
      this.caption.tint = on ? C.amberHi : C.muted;
      this.caption.set(deadlineCaption(this.run.level), warn.w / 2, warn.h / 2, warn.w - 20);
    }
  }

  dispose(): void {
    this.root.removeChild(this.inner);
  }
}
