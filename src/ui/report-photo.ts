import type { AbductResult } from '../contracts';

export type Photo = NonNullable<AbductResult['photo']>;

/** Card art size (manifest `ui/id_photo_frame`) and its photo window, in card px. */
export const CARD_W = 220;
export const CARD_H = 260;
export const WINDOW = { x: 22, y: 22, w: 176, h: 176 } as const;

/** Scale and offset that fit the pose into the photo window (computed once per report). */
export interface PhotoFit {
  scale: number;
  /** Window-space position of the pose origin (the chest). */
  ox: number;
  oy: number;
}

/** Fit the pose's joints (plus a margin for limb sprites) into a `w`×`h` window. */
export function fitPhoto(photo: Photo, w: number, h: number): PhotoFit {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const n = Math.min(photo.x.length, photo.y.length);
  for (let i = 0; i < n; i++) {
    const x = photo.x[i]!;
    const y = photo.y[i]!;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  if (minX > maxX) return { scale: 0.5, ox: w / 2, oy: h / 2 };
  // the head sprite reaches ~80 px past the head joint; limbs are ~30 px wide
  const pad = 46;
  const bw = maxX - minX + pad * 2;
  const bh = maxY - minY + pad * 2;
  const scale = Math.min(0.62, (w * 0.96) / bw, (h * 0.96) / bh);
  return { scale, ox: w / 2 - ((minX + maxX) / 2) * scale, oy: h / 2 - ((minY + maxY) / 2) * scale };
}
