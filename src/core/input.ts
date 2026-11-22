import type { PointerState } from '../contracts';
import type { Viewport } from './canvas';

/**
 * One active pointer (first finger / mouse) mapped into logical coordinates.
 * Events are buffered; `beginFrame()` publishes them once per frame so every
 * scene sees `pressed` / `released` for exactly one frame.
 */
export class PointerInput {
  readonly state: PointerState = { down: false, x: 0, y: 0, pressed: false, released: false };
  /** Mouse-wheel scroll accumulated this frame (logical px, + = down). */
  wheelDy = 0;
  private activeId: number | null = null;
  private pendPressed = false;
  private pendReleased = false;
  private rawX = 0;
  private rawY = 0;
  private pendWheel = 0;
  private firstDownHandlers: Array<() => void> = [];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly vp: Viewport,
  ) {
    canvas.addEventListener('pointerdown', this.onDown, { passive: false });
    canvas.addEventListener('pointermove', this.onMove, { passive: false });
    canvas.addEventListener('pointerup', this.onUp, { passive: false });
    canvas.addEventListener('pointercancel', this.onUp, { passive: false });
    canvas.addEventListener('lostpointercapture', this.onUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('blur', () => this.forceRelease());
  }

  /** Runs callbacks on every pointerdown (used to unlock audio inside a user gesture). */
  onAnyDown(fn: () => void): void {
    this.firstDownHandlers.push(fn);
  }

  beginFrame(): void {
    const s = this.state;
    s.pressed = this.pendPressed;
    s.released = this.pendReleased;
    this.pendPressed = false;
    this.pendReleased = false;
    s.down = this.activeId !== null;
    s.x = this.rawX;
    s.y = this.rawY;
    this.wheelDy = this.pendWheel;
    this.pendWheel = 0;
  }

  forceRelease(): void {
    if (this.activeId !== null) {
      this.activeId = null;
      this.pendReleased = true;
    }
  }

  private map(e: PointerEvent | WheelEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.rawX = (e.clientX - rect.left - this.vp.offX) / this.vp.scale;
    this.rawY = (e.clientY - rect.top - this.vp.offY) / this.vp.scale;
  }

  private onDown = (e: PointerEvent): void => {
    e.preventDefault();
    for (const fn of this.firstDownHandlers) fn();
    if (this.activeId !== null) return; // ignore extra fingers
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.activeId = e.pointerId;
    this.map(e);
    this.pendPressed = true;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      /* not fatal */
    }
  };

  private onMove = (e: PointerEvent): void => {
    if (this.activeId === null) {
      if (e.pointerType === 'mouse') this.map(e);
      return;
    }
    if (e.pointerId !== this.activeId) return;
    e.preventDefault();
    this.map(e);
  };

  private onUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.activeId) return;
    this.map(e);
    this.activeId = null;
    this.pendReleased = true;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const k = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? 600 : 1;
    this.pendWheel += (e.deltaY * k) / this.vp.scale;
  };
}
