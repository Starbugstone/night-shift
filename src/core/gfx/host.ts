// The Pixi renderer: one WebGL canvas, letterboxed 540×960 logical root, driven by our own loop
// (no Pixi ticker, no Pixi pointer events: input stays in src/core/input.ts so it is testable and
// the e2e scripts keep working).
import { autoDetectRenderer, Container, Graphics, type Renderer } from 'pixi.js';
// registers renderer.prepare (incremental GPU upload of a new scene's view; see SceneManager)
import 'pixi.js/prepare';
import { VIEW_H, VIEW_W } from '../../contracts';
import { LETTERBOX_COLOR, bitmapScaleOf, type Viewport } from '../viewport';
import { applyPixiFixes } from './pixi-fixes';
import { setTextureScale } from './textures';
import { tickShapeClock } from './shapes';

export interface RenderHost {
  readonly renderer: Renderer;
  readonly canvas: HTMLCanvasElement;
  /** Whole canvas (letterbox included). */
  readonly stage: Container;
  /** The logical 540×960 space, scaled and clipped into the letterbox. Scenes live in here. */
  readonly root: Container;
  /** Re-fit to the viewport (the shared viewport watcher calls this). */
  resize(viewport: Viewport): void;
  render(): void;
  /**
   * Frames so far whose render rebuilt every batch of the root render group (a `visible` flip, an
   * add or a remove anywhere in the tree, a batched Graphics that changed geometry). Flipping
   * `visible` each frame makes this every frame. Counted only in dev and e2e builds (0 elsewhere).
   */
  readonly rebuilds: number;
}

/** Same gate as the game's test fixtures: production builds don't patch Pixi just to count. */
const COUNT_REBUILDS = import.meta.env.DEV || import.meta.env.MODE === 'e2e';

let active: RenderHost | null = null;

/** The live host, once booted (null in tests). */
export function renderHost(): RenderHost | null {
  return active;
}

export async function createRenderHost(canvas: HTMLCanvasElement, viewport: Viewport): Promise<RenderHost> {
  const renderer = await autoDetectRenderer({
    canvas,
    preference: 'webgl',
    width: viewport.cssW,
    height: viewport.cssH,
    resolution: viewport.dpr,
    autoDensity: false,
    antialias: true,
    background: LETTERBOX_COLOR,
    eventMode: 'none',
    eventFeatures: { move: false, globalMove: false, click: false, wheel: false },
  });
  applyPixiFixes(renderer);
  // our own PointerInput owns the canvas events
  (renderer as { events?: { setTargetElement(el: HTMLElement | null): void } }).events?.setTargetElement(null);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.touchAction = 'none';

  const stage = new Container();
  stage.eventMode = 'none';
  const root = new Container();
  const clip = new Graphics().rect(0, 0, VIEW_W, VIEW_H).fill(0xffffff);
  root.addChild(clip);
  root.mask = clip;
  stage.addChild(root);

  /** Rebuilds are only counted where the test fixtures exist (dev and e2e builds): it patches Pixi. */
  let rebuilds = 0;
  /** A rebuild was asked for this frame: a `visible` flip before the render, or a renderable inside it. */
  let flagged = false;
  let watched = false;
  /**
   * Pixi also asks for a rebuild during `render()` (a batched Graphics that changed geometry, a
   * texture that left its batch) and clears the flag in the same call, so watch the flag itself.
   */
  const watchRebuilds = (group: { structureDidChange: boolean }): boolean => {
    let value = group.structureDidChange;
    Object.defineProperty(group, 'structureDidChange', {
      configurable: true,
      get: () => value,
      set: (v: boolean) => {
        value = v;
        if (v) flagged = true;
      },
    });
    return true;
  };
  const host: RenderHost = {
    renderer,
    canvas,
    stage,
    root,
    resize(v) {
      renderer.resize(v.cssW, v.cssH, v.dpr);
      root.scale.set(v.scale);
      root.position.set(v.offX, v.offY);
      setTextureScale(bitmapScaleOf(v));
    },
    render() {
      tickShapeClock(performance.now());
      flagged = false;
      // the root render group exists from the first render on
      if (COUNT_REBUILDS && stage.renderGroup?.structureDidChange) flagged = true;
      renderer.render(stage);
      if (!watched && COUNT_REBUILDS && stage.renderGroup) watched = watchRebuilds(stage.renderGroup);
      if (flagged) rebuilds++;
    },
    get rebuilds() {
      return rebuilds;
    },
  };
  host.resize(viewport);
  active = host;
  return host;
}

/** Data URL of the frame as it is on screen (debug captures; renders first so the buffer is fresh). */
export function captureFrame(): string | null {
  if (!active) return null;
  active.render();
  return active.canvas.toDataURL('image/png');
}

