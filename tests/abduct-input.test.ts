import { afterEach, describe, expect, it } from 'vitest';
import type { Viewport } from '../src/core/viewport';
import { PointerInput } from '../src/core/input';

type Listener = (e: unknown) => void;

function target() {
  const listeners = new Map<string, Listener[]>();
  return {
    listeners,
    addEventListener(type: string, fn: Listener) {
      listeners.set(type, [...(listeners.get(type) ?? []), fn]);
    },
    fire(type: string, e: Record<string, unknown>) {
      for (const fn of listeners.get(type) ?? []) fn({ type, preventDefault() {}, ...e });
    },
  };
}

const realWindow = (globalThis as { window?: unknown }).window;
afterEach(() => {
  (globalThis as { window?: unknown }).window = realWindow;
});

/** PointerInput on a fake canvas: 2 CSS px per logical px, letterboxed 10 px from the left. */
function rig() {
  const win = target();
  (globalThis as { window?: unknown }).window = win;
  const canvas = Object.assign(target(), {
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
    setPointerCapture() {},
  });
  const vp: Viewport = { scale: 2, offX: 10, offY: 0, dpr: 1, cssW: 1100, cssH: 1920 };
  const input = new PointerInput(canvas as unknown as HTMLCanvasElement, vp);
  const pointer = (type: string, id: number, kind: string, x: number, y: number, extra: Record<string, unknown> = {}) =>
    canvas.fire(type, { pointerId: id, pointerType: kind, clientX: x * 2 + 10, clientY: y * 2, button: 0, buttons: 1, ...extra });
  return { input, win, canvas, pointer };
}

describe('pointer input: second finger, wheel, right drag, keys', () => {
  it('tracks one extra finger as `second` and ignores a third', () => {
    const { input, pointer } = rig();
    pointer('pointerdown', 1, 'touch', 100, 200);
    input.beginFrame();
    expect(input.state).toMatchObject({ down: true, pressed: true, x: 100, y: 200, kind: 'touch' });
    pointer('pointerdown', 2, 'touch', 300, 400);
    pointer('pointerdown', 3, 'touch', 50, 50);
    input.beginFrame();
    expect(input.state.second).toMatchObject({ down: true, pressed: true, x: 300, y: 400 });
    expect(input.state).toMatchObject({ x: 100, y: 200, pressed: false });
    pointer('pointermove', 3, 'touch', 60, 60);
    pointer('pointermove', 2, 'touch', 320, 410);
    input.beginFrame();
    expect(input.state.second).toMatchObject({ x: 320, y: 410, pressed: false });
    expect(input.state).toMatchObject({ x: 100, y: 200 });
    pointer('pointerup', 2, 'touch', 320, 410);
    input.beginFrame();
    expect(input.state.second).toMatchObject({ down: false, released: true });
    expect(input.state.down).toBe(true);
  });

  it('a mouse never makes a second pointer; right-button drag reports travel instead', () => {
    const { input, pointer } = rig();
    pointer('pointermove', 1, 'mouse', 100, 100, { buttons: 0 });
    input.beginFrame();
    expect(input.state.kind).toBe('mouse');
    pointer('pointerdown', 1, 'mouse', 100, 100, { button: 2, buttons: 2 });
    pointer('pointermove', 1, 'mouse', 130, 100, { buttons: 2 });
    pointer('pointermove', 1, 'mouse', 145, 120, { buttons: 2 });
    input.beginFrame();
    expect(input.state.rightDx).toBeCloseTo(45);
    expect(input.state.down).toBe(false);
    expect(input.state.second!.down).toBe(false);
    pointer('pointerup', 1, 'mouse', 145, 120, { button: 2, buttons: 0 });
    pointer('pointermove', 1, 'mouse', 200, 120, { buttons: 0 });
    input.beginFrame();
    expect(input.state.rightDx).toBe(0);
  });

  it('publishes the wheel per frame and the rotate keys while held', () => {
    const { input, canvas, win } = rig();
    canvas.fire('wheel', { deltaY: 100, deltaMode: 0, clientX: 0, clientY: 0 });
    input.beginFrame();
    expect(input.state.wheel).toBe(50);
    input.beginFrame();
    expect(input.state.wheel).toBe(0);
    win.fire('keydown', { code: 'KeyE' });
    input.beginFrame();
    expect(input.state.turnKeys).toBe(1);
    win.fire('keydown', { code: 'KeyQ' });
    input.beginFrame();
    expect(input.state.turnKeys).toBe(0);
    win.fire('keyup', { code: 'KeyE' });
    input.beginFrame();
    expect(input.state.turnKeys).toBe(-1);
    win.fire('blur', {});
    input.beginFrame();
    expect(input.state.turnKeys).toBe(0);
  });
});
