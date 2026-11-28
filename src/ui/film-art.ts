// Story film keyframes: big painted images (896×1200 webp, ~100 KB each), so they stay out of the
// art manifest that loads at boot. A film's frames load when it is about to play (preloadFilm, from
// the report or memo that leads into it) and stay cached for the session.
import type { FilmId } from './films';
import { filmById } from './films';

/** Keyframe size (px). Every film frame is painted at this size. */
export const FRAME_W = 896;
export const FRAME_H = 1200;

const images = new Map<string, HTMLImageElement>();
const settled = new Set<string>();

export function framePath(film: FilmId, shot: string): string {
  return `film/${film}/${shot}.webp`;
}

function load(path: string): HTMLImageElement | undefined {
  if (typeof Image === 'undefined') return undefined;
  let img = images.get(path);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.onload = img.onerror = () => settled.add(path);
    img.src = `${import.meta.env.BASE_URL}${path}`;
    images.set(path, img);
  }
  return img;
}

/** Start loading a film's frames (no-op when they are loading or loaded, or without a DOM). */
export function preloadFilm(film: FilmId): void {
  for (const s of filmById(film).shots) load(framePath(film, s.id));
}

/** True once every frame of the film has loaded or failed. */
export function filmReady(film: FilmId): boolean {
  if (typeof Image === 'undefined') return true;
  return filmById(film).shots.every((s) => settled.has(framePath(film, s.id)));
}

/** The frame, if it loaded and can be drawn. */
export function filmFrame(film: FilmId, shot: string): HTMLImageElement | undefined {
  const img = images.get(framePath(film, shot));
  return img && img.complete && img.naturalWidth > 0 ? img : undefined;
}
