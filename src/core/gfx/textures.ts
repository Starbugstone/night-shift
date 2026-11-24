// Textures the game paints itself: SVG art rasterised at its draw size, procedural sprites
// (gradients, glows, particle shapes) and soft silhouettes. Each is painted once into a canvas and
// handed to Pixi; the art ones are re-painted in place (same Texture object) when the backing
// store's scale changes, so display objects never need to swap textures on resize.
import { CanvasSource, Texture } from 'pixi.js';

/** Paints into a 2D context already scaled so that 1 unit = 1 logical px. */
export type Painter = (g: CanvasRenderingContext2D, w: number, h: number) => void;

interface Painted {
  readonly source: CanvasSource;
  readonly w: number;
  readonly h: number;
  readonly paint: Painter;
}

/** Device px per logical px that scale-following textures are kept at (set by the host). */
let scale = 2;
/** Biggest bitmap we rasterise (px); bigger art is painted at a lower resolution instead. */
const MAX_PX = 3_000_000;
/** Scale-following textures, re-painted when the scale changes. Textures are caches: they live for the session. */
const following = new Set<Painted>();

function clampScale(k: number): number {
  return Math.max(0.5, Math.min(3, k));
}

/** Resolution for a w×h texture at scale k, lowered for oversized bitmaps. */
function resFor(w: number, h: number, k: number): number {
  const px = w * k * h * k;
  return px > MAX_PX ? k * Math.sqrt(MAX_PX / px) : k;
}

function repaint(p: Painted): void {
  const g = p.source.context2D as CanvasRenderingContext2D;
  const r = p.source.resolution;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, p.source.pixelWidth, p.source.pixelHeight);
  g.setTransform(r, 0, 0, r, 0, 0);
  p.paint(g, p.w, p.h);
  p.source.update();
}

function create(w: number, h: number, paint: Painter, resolution: number, follow: boolean): Texture {
  const source = new CanvasSource({ width: w, height: h, resolution, autoDensity: false });
  source.resize(w, h, resolution);
  const p: Painted = { source, w, h, paint };
  repaint(p);
  if (follow) following.add(p);
  return new Texture({ source });
}

/** Device px per logical px of the scale-following textures. */
export function textureScale(): number {
  return scale;
}

/** Called by the host when the viewport changes. Re-paints every scale-following texture in place. */
export function setTextureScale(k: number): void {
  const next = clampScale(k);
  if (Math.abs(next - scale) < 0.0005) return;
  scale = next;
  for (const p of following) {
    p.source.resize(p.w, p.h, resFor(p.w, p.h, scale));
    repaint(p);
  }
}

/** True when the image can be drawn (loaded and not broken). */
function usable(img: HTMLImageElement): boolean {
  return img.complete && (img.naturalWidth > 0 || img.width > 0);
}

/** Per image, per draw size (w * 4 · 16384 + h * 4): no string keys. */
const art = new WeakMap<HTMLImageElement, Map<number, Texture | null>>();

/**
 * An art sprite rasterised at its logical draw size (w×h), kept at the backing store's scale so it
 * maps pixel for pixel. Size the sprite to w×h. Null if the image cannot be drawn (missing art:
 * draw the primitive fallback).
 */
export function artTexture(img: HTMLImageElement | undefined, w: number, h: number): Texture | null {
  if (!img || w <= 0 || h <= 0) return null;
  let sized = art.get(img);
  if (!sized) {
    sized = new Map();
    art.set(img, sized);
  }
  const id = Math.round(w * 4) * 16384 + Math.round(h * 4);
  const hit = sized.get(id);
  if (hit !== undefined) return hit;
  let tex: Texture | null = null;
  if (usable(img)) {
    try {
      tex = create(w, h, (g) => g.drawImage(img, 0, 0, w, h), resFor(w, h, scale), true);
    } catch {
      tex = null;
    }
  }
  sized.set(id, tex);
  return tex;
}

const painted = new Map<string, Texture>();

/**
 * A procedural texture painted once (gradients, glow blobs, particle shapes, icons), cached by `id`.
 * `w`×`h` is its logical size. Pass `resolution` to fix its pixel density (small blobs that get
 * stretched); leave it out to follow the backing store's scale (crisp shapes drawn at that size).
 */
export function paintedTexture(id: string, w: number, h: number, paint: Painter, resolution?: number): Texture {
  let tex = painted.get(id);
  if (!tex) {
    tex = create(w, h, paint, resolution ?? resFor(w, h, scale), resolution === undefined);
    painted.set(id, tex);
  }
  return tex;
}

/**
 * A procedural texture the caller OWNS: not cached, fixed resolution. For big one-off bitmaps that
 * belong to one scene (a level's baked ground). Free it with `texture.destroy(true)` in the view's
 * `dispose()`, or it stays in memory.
 */
export function ownedTexture(w: number, h: number, paint: Painter, resolution: number): Texture {
  return create(w, h, paint, resolution, false);
}

/** Padding round a silhouette, in logical px: the blur spills this far past the sprite. */
export const SHADOW_PAD = 8;
const silhouettes = new WeakMap<HTMLImageElement, Map<number, Texture | null>>();

/**
 * Soft drop shadow of an art sprite drawn at w×h: its silhouette in night-blue at quarter
 * resolution (the upscale blurs the edge). The texture is (w + 2·SHADOW_PAD)×(h + 2·SHADOW_PAD)
 * logical px, centred on the sprite. Null if the image cannot be drawn.
 */
export function silhouetteTexture(img: HTMLImageElement | undefined, w: number, h: number): Texture | null {
  if (!img || w <= 0 || h <= 0) return null;
  let sized = silhouettes.get(img);
  if (!sized) {
    sized = new Map();
    silhouettes.set(img, sized);
  }
  const id = Math.round(w) * 8192 + Math.round(h);
  const hit = sized.get(id);
  if (hit !== undefined) return hit;
  let tex: Texture | null = null;
  if (usable(img)) {
    try {
      const tw = w + SHADOW_PAD * 2;
      const th = h + SHADOW_PAD * 2;
      tex = create(tw, th, (g) => {
        g.drawImage(img, SHADOW_PAD, SHADOW_PAD, w, h);
        g.globalCompositeOperation = 'source-in';
        g.fillStyle = '#07051a';
        g.fillRect(0, 0, tw, th);
        g.globalCompositeOperation = 'source-over';
      }, 0.25, false);
    } catch {
      tex = null;
    }
  }
  sized.set(id, tex);
  return tex;
}
