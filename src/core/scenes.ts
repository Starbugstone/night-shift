import { VIEW_H, VIEW_W } from '../contracts';
import type { PointerState, Scene } from '../contracts';

const FADE = 0.16;

interface Pending {
  name: string;
  make: () => Scene;
}

/** Holds the current scene and swaps scenes with a quick fade through night-blue. */
export class SceneManager {
  name = 'none';
  private current: Scene | null = null;
  private pending: Pending | null = null;
  private phase: 'idle' | 'out' | 'in' = 'idle';
  private t = 0;

  constructor(private readonly pointer: PointerState) {}

  get transitioning(): boolean {
    return this.phase !== 'idle';
  }

  /** Queue a scene; `make` runs at the fade midpoint. */
  go(name: string, make: () => Scene, instant = false): void {
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
      if (this.t >= FADE && this.pending) {
        const p = this.pending;
        this.pending = null;
        this.swap(p);
        this.phase = 'in';
        this.t = 0;
      }
      return; // freeze old scene while fading out
    }
    if (this.phase === 'in') {
      this.t += dt;
      if (this.t >= FADE) this.phase = 'idle';
      // swallow taps during the fade so a button press doesn't leak into the new scene
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
    let a = 0;
    if (this.phase === 'out') a = Math.min(1, this.t / FADE);
    else if (this.phase === 'in') a = 1 - Math.min(1, this.t / FADE);
    if (a > 0) {
      g.globalAlpha = a;
      g.fillStyle = '#0b0820';
      g.fillRect(0, 0, VIEW_W, VIEW_H);
      g.globalAlpha = 1;
    }
  }
}
