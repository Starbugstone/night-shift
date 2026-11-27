// Lets a test build and sync real Pixi views in node (no DOM, no GPU): Pixi asks this adapter for canvases, and
// every 2D or WebGL call on them is a no-op. Nothing is drawn; the display tree, transforms and Graphics bounds are
// real. Import it before any src/ module. Text widths come from `measure`'s own estimate (no `document`).
import { DOMAdapter } from 'pixi.js';

const noop = (): undefined => undefined;
const special: Record<string, unknown> = {
  measureText: () => ({ width: 10, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2, fontBoundingBoxAscent: 8, fontBoundingBoxDescent: 2 }),
  createRadialGradient: () => ({ addColorStop: noop }),
  createLinearGradient: () => ({ addColorStop: noop }),
  createPattern: () => ({}),
  getImageData: () => ({ data: new Uint8ClampedArray(4) }),
  getShaderPrecisionFormat: () => ({ precision: 23, rangeMin: 127, rangeMax: 127 }),
};
const context = (): object => new Proxy<Record<string | symbol, unknown>>({}, {
  get: (t, k) => (k in t ? t[k] : typeof k === 'string' && k in special ? special[k] : typeof k === 'string' && /^[a-z]/.test(k) ? noop : undefined),
  set: (t, k, v) => {
    t[k] = v;
    return true;
  },
});
const canvas = (): object => ({ width: 1, height: 1, style: {}, getContext: context, addEventListener: noop, removeEventListener: noop });

DOMAdapter.set({ ...DOMAdapter.get(), createCanvas: canvas, getCanvasRenderingContext2D: () => Object } as unknown as Parameters<typeof DOMAdapter.set>[0]);

/** Canvas painters that build a Path2D (the L10 grail art) get a path that records nothing. */
const scope = globalThis as unknown as { Path2D?: unknown };
scope.Path2D ??= class {
  constructor(_d?: unknown) {}
  addPath(): void {}
  moveTo(): void {}
  lineTo(): void {}
  closePath(): void {}
  bezierCurveTo(): void {}
  quadraticCurveTo(): void {}
  arc(): void {}
  rect(): void {}
  ellipse(): void {}
};
