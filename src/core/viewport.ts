import { VIEW_H, VIEW_W } from '../contracts';

/** How the 540×960 logical space maps onto the window (CSS px). */
export interface Viewport {
  /** CSS px per logical px. */
  scale: number;
  /** Letterbox offset in CSS px. */
  offX: number;
  offY: number;
  dpr: number;
  cssW: number;
  cssH: number;
}

export const LETTERBOX_COLOR = '#120d2b';
const MAX_DPR = 2;

/** Device px per logical px for a viewport: what cached bitmaps and text are rasterised at. */
export function bitmapScaleOf(v: Viewport): number {
  return v.scale * v.dpr;
}

/**
 * Keeps one shared Viewport in step with the window (resize, rotation, the mobile URL bar) and
 * calls `onChange` after each change. Calls it once immediately.
 */
export function watchViewport(onChange: (v: Viewport) => void): Viewport {
  const viewport: Viewport = { scale: 1, offX: 0, offY: 0, dpr: 1, cssW: VIEW_W, cssH: VIEW_H };
  const resize = (): void => {
    const vv = window.visualViewport;
    const cssW = Math.max(1, Math.round(vv?.width ?? window.innerWidth));
    const cssH = Math.max(1, Math.round(vv?.height ?? window.innerHeight));
    const dpr = Math.min(MAX_DPR, Math.max(1, window.devicePixelRatio || 1));
    const scale = Math.min(cssW / VIEW_W, cssH / VIEW_H);
    viewport.cssW = cssW;
    viewport.cssH = cssH;
    viewport.dpr = dpr;
    viewport.scale = scale;
    viewport.offX = (cssW - VIEW_W * scale) / 2;
    viewport.offY = (cssH - VIEW_H * scale) / 2;
    onChange(viewport);
  };
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 120));
  window.visualViewport?.addEventListener('resize', resize);
  return viewport;
}
