// Manifest art as Pixi sprites. Every art draw needs a primitive fallback (art may be missing or
// still being made): `artSprite` returns null when the file did not load, so the caller builds its
// fallback instead.
import { Sprite, type Texture } from 'pixi.js';
import type { Assets } from '../../contracts';
import { ART } from '../../art-manifest';
import { artTexture, silhouetteTexture } from '../../core/gfx/textures';

/** Texture of art `key` rasterised at w×h (manifest size by default), or null when it is missing. */
export function artTex(assets: Assets, key: string, w?: number, h?: number): Texture | null {
  const img = assets.get(key);
  if (!img) return null;
  const spec = ART[key];
  return artTexture(img, w ?? spec?.w ?? img.width, h ?? spec?.h ?? img.height);
}

/**
 * A sprite of art `key` sized w×h (manifest size by default) and anchored on its centre, or null
 * when the art is missing.
 */
export function artSprite(assets: Assets, key: string, w?: number, h?: number): Sprite | null {
  const img = assets.get(key);
  if (!img) return null;
  const spec = ART[key];
  const ww = w ?? spec?.w ?? img.width;
  const hh = h ?? spec?.h ?? img.height;
  const tex = artTexture(img, ww, hh);
  if (!tex) return null;
  const s = new Sprite(tex);
  s.anchor.set(0.5);
  s.width = ww;
  s.height = hh;
  return s;
}

/** Soft drop shadow for art `key` drawn centred at w×h; add it under the sprite. Null if missing. */
export function artShadow(assets: Assets, key: string, w: number, h: number, alpha = 0.3): Sprite | null {
  const tex = silhouetteTexture(assets.get(key), w, h);
  if (!tex) return null;
  const s = new Sprite(tex);
  s.anchor.set(0.5);
  s.alpha = alpha;
  return s;
}
