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

export interface CanvasHost {
  canvas: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  viewport: Viewport;
  /** Clear the letterbox and set the logical transform + clip. Call before rendering. */
  begin(): void;
  /** Undo begin(). */
  end(): void;
}

export function setupCanvas(canvas: HTMLCanvasElement): CanvasHost {
  const g = canvas.getContext('2d', { alpha: false });
  if (!g) throw new Error('Canvas 2D not supported');
  canvas.style.touchAction = 'none';
  canvas.style.width = '100%';
  canvas.style.height = '100%';

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
    const bw = Math.round(cssW * dpr);
    const bh = Math.round(cssH * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    g.imageSmoothingEnabled = true;
  };
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 120));
  window.visualViewport?.addEventListener('resize', resize);

  return {
    canvas,
    g,
    viewport,
    begin() {
      const { dpr, scale, offX, offY } = viewport;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = LETTERBOX_COLOR;
      g.fillRect(0, 0, canvas.width, canvas.height);
      g.save();
      const k = scale * dpr;
      g.setTransform(k, 0, 0, k, offX * dpr, offY * dpr);
      g.beginPath();
      g.rect(0, 0, VIEW_W, VIEW_H);
      g.clip();
    },
    end() {
      g.restore();
    },
  };
}
