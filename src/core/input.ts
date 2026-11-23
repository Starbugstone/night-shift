import type { PointerKind, PointerState, SecondPointer } from '../contracts';
import type { Viewport } from './canvas';

/** Q / A turn anticlockwise, E / D clockwise (KeyboardEvent.code, so it follows the key position). */
const TURN_LEFT_KEYS = new Set(['KeyQ', 'KeyA']);
const TURN_RIGHT_KEYS = new Set(['KeyE', 'KeyD']);

function kindOf(e: PointerEvent): PointerKind {
  return e.pointerType === 'mouse' ? 'mouse' : e.pointerType === 'pen' ? 'pen' : 'touch';
}

/**
 * One active pointer (first finger / mouse) mapped into logical coordinates.
 * Events are buffered; `beginFrame()` publishes them once per frame so every
 * scene sees `pressed` / `released` for exactly one frame.
 * Also tracked, for the scenes that want them: a second finger (`state.second`),
 * the wheel, a right-button drag and the rotate keys.
 */
export class PointerInput {
  private readonly second: SecondPointer = { down: false, x: 0, y: 0, pressed: false, released: false };
  readonly state: PointerState = {
    down: false, x: 0, y: 0, pressed: false, released: false,
    second: this.second, wheel: 0, rightDx: 0, turnKeys: 0,
  };
  /** Mouse-wheel scroll accumulated this frame (logical px, + = down). */
  wheelDy = 0;
  private activeId: number | null = null;
  private pendPressed = false;
  private pendReleased = false;
  private rawX = 0;
  private rawY = 0;
  private pendWheel = 0;
  private kind: PointerKind | undefined;
  private secondId: number | null = null;
  private pendSecondPressed = false;
  private pendSecondReleased = false;
  private rawX2 = 0;
  private rawY2 = 0;
  /** Last clientX of a right-button drag, or null when the right button is up. */
  private rightX: number | null = null;
  private pendRightDx = 0;
  private turnLeft = false;
  private turnRight = false;
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
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
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
    s.wheel = this.wheelDy;
    s.rightDx = this.pendRightDx;
    this.pendRightDx = 0;
    s.turnKeys = (this.turnRight ? 1 : 0) - (this.turnLeft ? 1 : 0);
    if (this.kind) s.kind = this.kind;
    const two = this.second;
    two.pressed = this.pendSecondPressed;
    two.released = this.pendSecondReleased;
    this.pendSecondPressed = false;
    this.pendSecondReleased = false;
    two.down = this.secondId !== null;
    two.x = this.rawX2;
    two.y = this.rawY2;
  }

  forceRelease(): void {
    if (this.activeId !== null) {
      this.activeId = null;
      this.pendReleased = true;
    }
    if (this.secondId !== null) {
      this.secondId = null;
      this.pendSecondReleased = true;
    }
    this.rightX = null;
    this.turnLeft = false;
    this.turnRight = false;
  }

  private map(e: PointerEvent | WheelEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.rawX = (e.clientX - rect.left - this.vp.offX) / this.vp.scale;
    this.rawY = (e.clientY - rect.top - this.vp.offY) / this.vp.scale;
  }

  private mapSecond(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.rawX2 = (e.clientX - rect.left - this.vp.offX) / this.vp.scale;
    this.rawY2 = (e.clientY - rect.top - this.vp.offY) / this.vp.scale;
  }

  private capture(id: number): void {
    try {
      this.canvas.setPointerCapture(id);
    } catch {
      /* not fatal */
    }
  }

  private onDown = (e: PointerEvent): void => {
    e.preventDefault();
    for (const fn of this.firstDownHandlers) fn();
    if (e.pointerType === 'mouse' && e.button === 2) {
      this.rightX = e.clientX;
      this.capture(e.pointerId);
      return;
    }
    if (this.activeId !== null) {
      // one extra finger is tracked as `second`; any more are ignored
      if (e.pointerType !== 'mouse' && this.secondId === null && e.pointerId !== this.activeId) {
        this.secondId = e.pointerId;
        this.mapSecond(e);
        this.pendSecondPressed = true;
        this.capture(e.pointerId);
      }
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.pointerId === this.secondId) return;
    this.activeId = e.pointerId;
    this.kind = kindOf(e);
    this.map(e);
    this.pendPressed = true;
    this.capture(e.pointerId);
  };

  private onMove = (e: PointerEvent): void => {
    if (e.pointerId === this.secondId) {
      e.preventDefault();
      this.mapSecond(e);
      return;
    }
    if (e.pointerType === 'mouse') {
      if ((e.buttons & 2) === 0) this.rightX = null;
      else if (this.rightX === null) this.rightX = e.clientX; // right button chorded onto a left drag
      else {
        this.pendRightDx += (e.clientX - this.rightX) / this.vp.scale;
        this.rightX = e.clientX;
      }
    }
    if (this.activeId === null) {
      if (e.pointerType === 'mouse') {
        this.map(e);
        this.kind = 'mouse';
      }
      return;
    }
    if (e.pointerId !== this.activeId) return;
    e.preventDefault();
    this.map(e);
  };

  private onUp = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && (e.buttons & 2) === 0) this.rightX = null;
    if (e.pointerId === this.secondId) {
      this.mapSecond(e);
      this.secondId = null;
      this.pendSecondReleased = true;
      return;
    }
    if (e.pointerId !== this.activeId) return;
    this.map(e);
    this.activeId = null;
    this.pendReleased = true;
  };

  private onKey = (e: KeyboardEvent): void => {
    const down = e.type === 'keydown';
    if (TURN_LEFT_KEYS.has(e.code)) this.turnLeft = down;
    else if (TURN_RIGHT_KEYS.has(e.code)) this.turnRight = down;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const k = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? 600 : 1;
    this.pendWheel += (e.deltaY * k) / this.vp.scale;
  };
}
