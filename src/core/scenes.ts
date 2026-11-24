import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { VIEW_H, VIEW_W } from '../contracts';
import type { PointerState, Scene } from '../contracts';

const FADE = 0.16;
const IRIS_OUT = 0.34;
const IRIS_IN = 0.46;
const FLASH_OUT = 0.14;
const FLASH_IN = 0.34;
const NIGHT = '#0b0820';
const MINT = '#7CFFCB';
const FLASH = '#d9fff0';
const SUNRISE = '#ffd9a0';
const SUNRISE_OUT = 0.5;
const SUNRISE_IN = 0.6;
/** Longest the cover stays closed waiting for a new view's GPU upload (game seconds). */
const MAX_HOLD = 0.6;
/** Far enough to clear every corner from any point on screen. */
const IRIS_MAX = Math.hypot(VIEW_W, VIEW_H);

/**
 * How one scene hands over to the next.
 * - `fade`: quick fade through night-blue (menus).
 * - `iris`: a mint-rimmed iris closes on (x, y), then opens from (toX, toY) — the saucer's view
 *   diving into the room.
 * - `flash`: a pale mint flash (the specimen leaving the room).
 * - `sunrise`: the view whites out to warm daylight (the sun coming up on a deep shift).
 * With reduced motion everything is a plain fade.
 */
export interface Transition {
  style: 'fade' | 'iris' | 'flash' | 'sunrise';
  x?: number;
  y?: number;
  toX?: number;
  toY?: number;
}

interface Pending {
  name: string;
  make: () => Scene;
}

const PLAIN: Transition = { style: 'fade' };

/** Holds the current scene and swaps scenes with a short transition. */
export class SceneManager {
  name = 'none';
  private current: Scene | null = null;
  /** Live scene, for debug hooks. */
  get active(): Scene | null {
    return this.current;
  }
  private pending: Pending | null = null;
  private phase: 'idle' | 'out' | 'in' = 'idle';
  private t = 0;
  private tr: Transition = PLAIN;

  /** Pixi transition cover, drawn above the scene layer (null in headless tests). */
  private readonly cover: TransitionCover | null;
  /** False while a new view is still uploading behind the closed cover. */
  private ready = true;
  /** Game seconds spent holding the cover closed for the upload. */
  private holdT = 0;
  /** Ignores a late upload result from a scene that was already replaced. */
  private prepareToken = 0;

  /**
   * @param layer Pixi container the live scene's view is mounted in (absent in headless tests,
   *   where views are never built).
   * @param coverLayer Pixi container above it for the transition cover.
   * @param prepare Uploads a freshly built view to the GPU over the next few frames. Without it,
   *   the first frame that shows a new scene uploads every texture at once (a hitch of a few hundred
   *   ms on entering a room); with it, the reveal waits, cover closed, until the upload is done.
   */
  constructor(
    private readonly pointer: PointerState,
    private readonly reducedMotion: () => boolean = () => false,
    private readonly layer: Container | null = null,
    coverLayer: Container | null = null,
    private readonly prepare: ((view: Container) => Promise<void>) | null = null,
  ) {
    this.cover = coverLayer ? new TransitionCover(coverLayer) : null;
  }

  get transitioning(): boolean {
    return this.phase !== 'idle';
  }

  private get outDur(): number {
    const s = this.tr.style;
    return s === 'iris' ? IRIS_OUT : s === 'flash' ? FLASH_OUT : s === 'sunrise' ? SUNRISE_OUT : FADE;
  }

  private get inDur(): number {
    const s = this.tr.style;
    return s === 'iris' ? IRIS_IN : s === 'flash' ? FLASH_IN : s === 'sunrise' ? SUNRISE_IN : FADE;
  }

  /** Queue a scene; `make` runs at the transition midpoint. */
  go(name: string, make: () => Scene, instant = false, transition: Transition = PLAIN): void {
    this.tr = this.reducedMotion() ? PLAIN : transition;
    if (instant || !this.current) {
      this.swap({ name, make });
      this.phase = this.current ? 'in' : 'idle';
      this.t = 0;
      return;
    }
    this.pending = { name, make };
    if (this.phase !== 'out') {
      this.phase = 'out';
      this.t = 0;
    }
  }

  private swap(p: Pending): void {
    const old = this.current;
    if (old && this.layer) this.layer.removeChildren();
    old?.dispose?.();
    this.current = null;
    this.name = p.name;
    const next = p.make();
    this.current = next;
    if (!this.layer) return;
    this.layer.addChild(next.view);
    if (!this.prepare) return;
    // build the display tree now (one frame, behind the cover), then upload it a few items a
    // frame while the cover stays closed and the layer stays hidden
    next.render();
    this.layer.visible = false;
    this.ready = false;
    this.holdT = 0;
    const token = ++this.prepareToken;
    const done = (): void => {
      if (token === this.prepareToken) this.ready = true;
    };
    this.prepare(next.view).then(done, done);
  }

  update(dt: number): void {
    if (this.phase === 'out') {
      this.t += dt;
      if (this.t >= this.outDur && this.pending) {
        const p = this.pending;
        this.pending = null;
        this.swap(p);
        this.phase = 'in';
        this.t = 0;
      }
      return; // freeze old scene while it is covered
    }
    if (!this.ready) {
      // hold the cover closed (and the new scene frozen) until its view is on the GPU; capped, in
      // case the upload never reports back
      this.holdT += dt;
      this.pointer.pressed = false;
      this.pointer.released = false;
      if (this.holdT < MAX_HOLD) return;
      this.ready = true;
    }
    if (this.layer && !this.layer.visible && this.ready) this.layer.visible = true;
    if (this.phase === 'in') {
      this.t += dt;
      if (this.t >= this.inDur) this.phase = 'idle';
      // swallow taps during the transition so a button press doesn't leak into the new scene
      this.pointer.pressed = false;
      this.pointer.released = false;
    }
    this.current?.update(dt);
  }

  /** Sync the live scene's view, then the transition cover on top of it. */
  render(): void {
    this.current?.render();
    const cover = this.coverAmount();
    if (!this.cover) return;
    this.cover.hide();
    if (cover <= 0) return;
    if (this.tr.style === 'iris') {
      const { x, y, r } = this.irisAt(cover);
      this.cover.iris(x, y, r);
    } else this.cover.fill(this.fillColor, this.fillAlpha(cover));
  }

  /** 0 = scene fully visible, 1 = fully hidden. */
  private coverAmount(): number {
    if (this.phase === 'idle') return 0;
    return this.phase === 'out' ? Math.min(1, this.t / this.outDur) : 1 - Math.min(1, this.t / this.inDur);
  }

  private get fillColor(): string {
    return this.tr.style === 'flash' ? FLASH : this.tr.style === 'sunrise' ? SUNRISE : NIGHT;
  }

  private fillAlpha(cover: number): number {
    const bright = this.tr.style === 'flash' || this.tr.style === 'sunrise';
    return bright && this.phase === 'in' ? cover * cover : cover;
  }

  /** Iris centre and radius: closing accelerates into the point; opening bursts out and settles. */
  private irisAt(cover: number): { x: number; y: number; r: number } {
    const out = this.phase === 'out';
    const x = (out ? this.tr.x : this.tr.toX ?? this.tr.x) ?? VIEW_W / 2;
    const y = (out ? this.tr.y : this.tr.toY ?? this.tr.y) ?? VIEW_H / 2;
    const open = 1 - cover;
    const k = out ? open * open : 1 - (1 - open) * (1 - open) * (1 - open);
    IRIS.x = x;
    IRIS.y = y;
    IRIS.r = IRIS_MAX * k;
    return IRIS;
  }
}

/** Reused result of `irisAt` (no allocation per frame). */
const IRIS = { x: 0, y: 0, r: 0 };

/** The Pixi transition cover: a full-view colour sheet, or the iris (night with a mint-rimmed hole). */
class TransitionCover {
  private readonly sheet = new Sprite(Texture.WHITE);
  /** Rebuilt every frame of an iris: three shapes, only while a transition runs. */
  private readonly ring = new Graphics();

  constructor(layer: Container) {
    this.sheet.width = VIEW_W;
    this.sheet.height = VIEW_H;
    layer.addChild(this.sheet, this.ring);
    this.hide();
  }

  hide(): void {
    this.sheet.visible = false;
    this.ring.visible = false;
  }

  fill(color: string, alpha: number): void {
    this.sheet.visible = true;
    this.sheet.tint = color;
    this.sheet.alpha = alpha;
  }

  iris(x: number, y: number, r: number): void {
    const g = this.ring.clear();
    this.ring.visible = true;
    // night everywhere outside radius r: one stroke wide enough to reach every corner (a rect with
    // a cut-out circle breaks once the circle crosses the rect's edge)
    g.circle(x, y, r + IRIS_MAX).stroke({ color: NIGHT, width: IRIS_MAX * 2 });
    if (r > 1) {
      g.circle(x, y, r + 4).stroke({ color: MINT, alpha: 0.28, width: 22 });
      g.circle(x, y, r).stroke({ color: MINT, alpha: 0.95, width: 5 });
    }
  }
}
