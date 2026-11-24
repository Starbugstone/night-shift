// Light and tint sprites: soft glow blobs, light pools, screen-edge tints, the vignette and
// directional washes. Each texture is a small gradient painted once and stretched by the sprite
// (a stretched gradient bitmap looks the same as a live gradient and costs nothing per frame).
import { Sprite, type Texture } from 'pixi.js';
import { VIEW_H, VIEW_W } from '../../contracts';
import { paintedTexture } from './textures';

export { GLOW } from '../fx';

type Stops = readonly (readonly [number, string])[];

/** Radial gradient (centre → rim colour stops) on a `size`² bitmap, cached by `id`. */
export function radialTexture(id: string, stops: Stops, size = 128): Texture {
  return paintedTexture(`radial|${id}`, size, size, (g) => {
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [at, color] of stops) grad.addColorStop(at, color);
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  }, 1);
}

/** Soft blob of light (or of shadow, with `GLOW.dark`). */
export function glowTexture(rgb: string): Texture {
  return radialTexture(`glow|${rgb}`, [
    [0, `rgba(${rgb},1)`],
    [0.35, `rgba(${rgb},0.55)`],
    [0.7, `rgba(${rgb},0.16)`],
    [1, `rgba(${rgb},0)`],
  ], 96);
}

/** A pool of light: `alpha` at the centre, 40 % of that half-way out, nothing at the rim. */
export function lightTexture(rgb: string, alpha: number): Texture {
  return radialTexture(`light|${rgb}|${alpha}`, [
    [0, `rgba(${rgb},${alpha})`],
    [0.5, `rgba(${rgb},${alpha * 0.4})`],
    [1, `rgba(${rgb},0)`],
  ]);
}

/** Quarter-view bitmap: clear in the middle, `rgb` towards the corners. */
export function edgeTexture(rgb: string, mid: number, edge: number): Texture {
  const w = VIEW_W / 4;
  const h = VIEW_H / 4;
  return paintedTexture(`edge|${rgb}|${mid}|${edge}`, w, h, (g) => {
    const grad = g.createRadialGradient(w / 2, h * 0.46, h * 0.24, w / 2, h / 2, h * 0.68);
    grad.addColorStop(0, `rgba(${rgb},0)`);
    grad.addColorStop(0.6, `rgba(${rgb},${mid})`);
    grad.addColorStop(1, `rgba(${rgb},${edge})`);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, 1);
}

/** Screen-wide linear wash: nothing at (x0, y0), `rgb` at full alpha at (x1, y1), in 0..1 of the view. */
export function washTexture(rgb: string, x0: number, y0: number, x1: number, y1: number): Texture {
  return paintedTexture(`wash|${rgb}|${x0}|${y0}|${x1}|${y1}`, 36, 64, (g) => {
    const grad = g.createLinearGradient(x0 * 36, y0 * 64, x1 * 36, y1 * 64);
    grad.addColorStop(0, `rgba(${rgb},0)`);
    grad.addColorStop(0.55, `rgba(${rgb},0.38)`);
    grad.addColorStop(1, `rgba(${rgb},1)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 36, 64);
  }, 1);
}

/**
 * A soft blob centred on a point. `place` sets centre, radii and alpha in one call; it hides
 * itself when it would be invisible. `additive` = Canvas 2D's `lighter`.
 */
export class Glow extends Sprite {
  constructor(texture: Texture, additive = false) {
    super(texture);
    this.anchor.set(0.5);
    if (additive) this.blendMode = 'add';
  }

  /** Centre (x, y), radii rx × ry, alpha (clamped to 1). */
  place(x: number, y: number, rx: number, ry = rx, alpha = 1): this {
    const on = alpha > 0.004 && rx > 0 && ry > 0;
    this.visible = on;
    if (!on) return this;
    this.position.set(x, y);
    this.width = rx * 2;
    this.height = ry * 2;
    this.alpha = alpha > 1 ? 1 : alpha;
    return this;
  }
}

/** A full-view overlay sprite (vignette, edge tint, wash). Set `strength` each frame. */
export class ScreenTint extends Sprite {
  constructor(texture: Texture, additive = false) {
    super(texture);
    this.width = VIEW_W;
    this.height = VIEW_H;
    if (additive) this.blendMode = 'add';
  }

  /** Soft dark corners over the whole view. */
  static vignette(): ScreenTint {
    return new ScreenTint(edgeTexture('8,5,26', 0.2, 0.62));
  }

  /** Coloured pulse around the screen edge (wake-up alarm, lock-on, delivery). */
  static edge(rgb: string): ScreenTint {
    return new ScreenTint(edgeTexture(rgb, 0.16, 0.7));
  }

  /** Directional wash (dawn light, a searchlight sweep). */
  static wash(rgb: string, x0: number, y0: number, x1: number, y1: number): ScreenTint {
    return new ScreenTint(washTexture(rgb, x0, y0, x1, y1));
  }

  /** 0..1 opacity; hidden at ~0 so it costs nothing. */
  set strength(v: number) {
    const on = v > 0.01;
    this.visible = on;
    if (on) this.alpha = v > 1 ? 1 : v;
  }
}
