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
/** Far enough to clear every corner from any point on screen. */
const IRIS_MAX = Math.hypot(VIEW_W, VIEW_H);

/**
 * How one scene hands over to the next.
 * - `fade`: quick fade through night-blue (menus).
 * - `iris`: a mint-rimmed iris closes on (x, y), then opens from (toX, toY) — the saucer's view
 *   diving into the room.
 * - `flash`: a pale mint flash (the specimen leaving the room).
 * With reduced motion everything is a plain fade.
 */
export interface Transition {
  style: 'fade' | 'iris' | 'flash';
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

  constructor(
    private readonly pointer: PointerState,
    private readonly reducedMotion: () => boolean = () => false,
  ) {}

  get transitioning(): boolean {
    return this.phase !== 'idle';
  }

  private get outDur(): number {
    return this.tr.style === 'iris' ? IRIS_OUT : this.tr.style === 'flash' ? FLASH_OUT : FADE;
  }

  private get inDur(): number {
    return this.tr.style === 'iris' ? IRIS_IN : this.tr.style === 'flash' ? FLASH_IN : FADE;
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
    this.current?.dispose?.();
    this.current = null;
    this.name = p.name;
    this.current = p.make();
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
    if (this.phase === 'in') {
      this.t += dt;
      if (this.t >= this.inDur) this.phase = 'idle';
      // swallow taps during the transition so a button press doesn't leak into the new scene
      this.pointer.pressed = false;
      this.pointer.released = false;
    }
    this.current?.update(dt);
  }

  render(g: CanvasRenderingContext2D): void {
    if (this.current) {
      g.save();
      this.current.render(g);
      g.restore();
    }
    if (this.phase === 'idle') return;
    // cover: 0 = scene fully visible, 1 = fully hidden
    const cover = this.phase === 'out' ? Math.min(1, this.t / this.outDur) : 1 - Math.min(1, this.t / this.inDur);
    if (cover <= 0) return;
    if (this.tr.style === 'iris') this.iris(g, cover);
    else {
      g.globalAlpha = this.tr.style === 'flash' && this.phase === 'in' ? cover * cover : cover;
      g.fillStyle = this.tr.style === 'flash' ? FLASH : NIGHT;
      g.fillRect(0, 0, VIEW_W, VIEW_H);
      g.globalAlpha = 1;
    }
  }

  private iris(g: CanvasRenderingContext2D, cover: number): void {
    const out = this.phase === 'out';
    const x = (out ? this.tr.x : this.tr.toX ?? this.tr.x) ?? VIEW_W / 2;
    const y = (out ? this.tr.y : this.tr.toY ?? this.tr.y) ?? VIEW_H / 2;
    // closing accelerates into the point; opening bursts out and settles
    const open = 1 - cover;
    const k = out ? open * open : 1 - (1 - open) * (1 - open) * (1 - open);
    const r = IRIS_MAX * k;
    g.fillStyle = NIGHT;
    g.beginPath();
    g.rect(0, 0, VIEW_W, VIEW_H);
    g.arc(x, y, r, 0, Math.PI * 2, true);
    g.fill('evenodd');
    if (r > 1) {
      g.strokeStyle = MINT;
      g.globalAlpha = 0.28;
      g.lineWidth = 22;
      g.beginPath();
      g.arc(x, y, r + 4, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 0.95;
      g.lineWidth = 5;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 1;
    }
  }
}
