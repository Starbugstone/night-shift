// v4 trophy room: cached Pixi textures for souvenir exhibits (full-colour art or painted fallback),
// animated town pickup figures via Fable's `PickupFigure` (`src/flight/views/collectible.ts`),
// crisp dark-lavender silhouettes for unfound slots, and the Work Orders trophy-cup / Field Finds icons.
// Canvas 2D runs only inside `paintedTexture` painters (never per frame).
import { Sprite, type Container, type Texture } from 'pixi.js';
import type { Assets, MapCollectibleId } from '../../contracts';
import { paintCaveProp } from '../../abduct/monolith-art';
import { paintSouvenir } from '../../abduct/souvenir-art';
import { INK } from '../../abduct/views/pieces';
import { artTexture, paintedTexture } from '../../core/gfx/textures';
import { PICKUP_SIZE, pickupKey } from '../../flight/pickup-rig';
import { PickupFigure } from '../../flight/views/collectible';
import { paintTimeCarDisplay } from '../../flight/views/time-car';
import { ART } from '../../art-manifest';
import { getLang, tr } from '../../i18n';
import { artTex } from './art';
import { C } from '../theme';

const TAU = Math.PI * 2;
const SILHOUETTE_COLOR = '#463c7a';

/** Paint any souvenir's primitive fallback into a w×h Canvas 2D context. */
export function paintTrophyFallback(g: CanvasRenderingContext2D, key: string, w: number, h: number): void {
  if (paintSouvenir(g, key, w, h)) return;
  if (paintCaveProp(g, key, w, h)) return;

  g.save();
  g.lineWidth = Math.max(2, Math.min(w, h) * 0.08);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.strokeStyle = INK;

  switch (key) {
    case 'room/slipper': {
      g.fillStyle = '#dc6866';
      g.beginPath();
      g.roundRect(w * 0.05, h * 0.38, w * 0.9, h * 0.56, h * 0.25);
      g.fill();
      g.stroke();
      g.fillStyle = '#eb8d7e';
      g.beginPath();
      g.roundRect(w * 0.14, h * 0.1, w * 0.52, h * 0.52, h * 0.28);
      g.fill();
      g.stroke();
      break;
    }
    case 'room/coffee_mug': {
      g.fillStyle = '#d6c0a5';
      g.beginPath();
      g.ellipse(w * 0.8, h * 0.5, w * 0.16, h * 0.24, 0, 0, TAU);
      g.fill();
      g.stroke();
      g.fillStyle = '#e8d2b5';
      g.beginPath();
      g.roundRect(w * 0.08, h * 0.14, w * 0.68, h * 0.78, w * 0.16);
      g.fill();
      g.stroke();
      g.fillStyle = '#5e3b38';
      g.beginPath();
      g.ellipse(w * 0.42, h * 0.24, w * 0.26, h * 0.1, 0, 0, TAU);
      g.fill();
      break;
    }
    case 'room/sardine_tin': {
      g.fillStyle = '#9aa8bd';
      g.beginPath();
      g.roundRect(w * 0.05, h * 0.24, w * 0.86, h * 0.66, h * 0.28);
      g.fill();
      g.stroke();
      g.fillStyle = '#54738c';
      g.beginPath();
      g.roundRect(w * 0.14, h * 0.34, w * 0.68, h * 0.42, h * 0.18);
      g.fill();
      // rolled lid key on the right
      g.fillStyle = '#dce6f2';
      g.beginPath();
      g.arc(w * 0.9, h * 0.44, h * 0.18, 0, TAU);
      g.fill();
      g.stroke();
      break;
    }
    case 'room/prep_jug': {
      g.fillStyle = '#b9e3ec';
      g.beginPath();
      g.roundRect(w * 0.14, h * 0.26, w * 0.72, h * 0.7, w * 0.14);
      g.fill();
      g.stroke();
      g.fillStyle = '#e7d875';
      g.fillRect(w * 0.2, h * 0.44, w * 0.6, h * 0.46);
      g.fillStyle = '#d94a5a';
      g.beginPath();
      g.roundRect(w * 0.32, h * 0.06, w * 0.36, h * 0.22, 3);
      g.fill();
      g.stroke();
      break;
    }
    case 'room/eclair': {
      g.fillStyle = '#e8c284';
      g.beginPath();
      g.roundRect(w * 0.05, h * 0.24, w * 0.9, h * 0.68, h * 0.32);
      g.fill();
      g.stroke();
      g.fillStyle = '#4a281c';
      g.beginPath();
      g.roundRect(w * 0.08, h * 0.14, w * 0.84, h * 0.42, h * 0.24);
      g.fill();
      g.stroke();
      break;
    }
    case 'room/complimentary_towel': {
      g.fillStyle = '#f5f2eb';
      g.beginPath();
      g.ellipse(w * 0.46, h * 0.72, w * 0.42, h * 0.24, 0, 0, TAU);
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(w * 0.68, h * 0.64);
      g.quadraticCurveTo(w * 0.86, h * 0.1, w * 0.56, h * 0.16);
      g.quadraticCurveTo(w * 0.44, h * 0.2, w * 0.48, h * 0.32);
      g.strokeStyle = INK;
      g.lineWidth = Math.max(6, w * 0.14);
      g.stroke();
      g.strokeStyle = '#f5f2eb';
      g.lineWidth = Math.max(3, w * 0.08);
      g.stroke();
      break;
    }
    default: {
      g.fillStyle = C.mintDeep;
      g.beginPath();
      g.roundRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8, 6);
      g.fill();
      g.stroke();
      break;
    }
  }
  g.restore();
}

/** Fit `artW × artH` proportionally into `maxW × maxH`, capped at `maxScale`. */
export function fitArtSize(artW: number, artH: number, maxW: number, maxH: number, maxScale: number): { w: number; h: number } {
  const s = Math.min(maxW / Math.max(1, artW), maxH / Math.max(1, artH), maxScale);
  return { w: Math.max(8, Math.round(artW * s)), h: Math.max(8, Math.round(artH * s)) };
}

/** Full-colour exhibit texture (SVG art if loaded, else crisp painted fallback) at w×h. */
export function trophyArtTexture(assets: Assets, key: string, w: number, h: number): Texture {
  const img = assets.get(key);
  const svgTex = artTexture(img, w, h);
  if (svgTex) return svgTex;
  return paintedTexture(`trophy|art|${key}|${w}x${h}`, w, h, (g, ww, hh) => {
    paintTrophyFallback(g, key, ww, hh);
  });
}

export function clockFlyerDetailTexture(assets: Assets, w: number, h: number): Texture {
  const key = 'room/clock_flyer';
  const img = assets.get(key);
  const ready = !!img && img.complete && img.naturalWidth > 0;
  const [first, second] = tr().crestValley.flyerHeadline;
  return paintedTexture(`trophy|clock-flyer|${ready}|${getLang()}|${w}x${h}`, w, h, g => {
    if (ready) g.drawImage(img, 0, 0, w, h);
    else paintTrophyFallback(g, key, w, h);
    g.save();
    g.scale(w / 40, h / 44);
    g.fillStyle = '#ffedc9';
    g.fillRect(7, 5, 24, 9);
    g.fillStyle = '#613b45';
    g.font = '900 4.6px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(first!, 19, 7.7, 24);
    g.fillText(second!, 19, 12, 24);
    g.restore();
  });
}

/** Crisp dark-lavender silhouette texture of an exhibit (from SVG art or painted fallback) at w×h. */
export function trophySilhouetteTexture(assets: Assets, key: string, w: number, h: number): Texture {
  const img = assets.get(key);
  const hasImg = !!img && img.complete && (img.naturalWidth > 0 || img.width > 0);
  return paintedTexture(`trophy|sil|${hasImg ? 1 : 0}|${key}|${w}x${h}`, w, h, (g, ww, hh) => {
    if (hasImg && img) {
      try {
        g.drawImage(img, 0, 0, ww, hh);
      } catch {
        paintTrophyFallback(g, key, ww, hh);
      }
    } else {
      paintTrophyFallback(g, key, ww, hh);
    }
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = SILHOUETTE_COLOR;
    g.fillRect(0, 0, ww, hh);
    g.globalCompositeOperation = 'source-over';
  });
}

// ---------------------------------------------------------------- Room 2 (Field finds) figures & silhouettes

/** Contract implemented by `PickupFigure` in `src/flight/views/collectible.ts`. */
export interface PickupFigureHandle {
  readonly root: Container;
  sync(t: number, reducedMotion: boolean): void;
}

/** Compute uniform scale for a `PickupFigure` to fit cleanly inside `maxW × maxH`. */
const TIME_CAR_EXHIBIT = 'flight/time_car_display';
const { w: exhibitW, h: exhibitH } = ART[TIME_CAR_EXHIBIT]!;
const timeCarFootprint = [exhibitW, exhibitH] as const;

export function townPickupScale(id: MapCollectibleId, maxW: number, maxH: number, maxScale: number): number {
  const [aw, ah] = id === 'time_car' ? timeCarFootprint : PICKUP_SIZE[id];
  return Math.min(maxW / Math.max(1, aw), maxH / Math.max(1, ah), maxScale);
}

/** Fit a town pickup's footprint proportionally into `maxW × maxH` (for still silhouettes). */
export function townPickupFitSize(id: MapCollectibleId, maxW: number, maxH: number, maxScale: number): { w: number; h: number } {
  const [aw, ah] = id === 'time_car' ? timeCarFootprint : PICKUP_SIZE[id];
  return fitArtSize(aw, ah, maxW, maxH, maxScale);
}

/** Paint a crisp Canvas 2D fallback shape for an unfound town pickup silhouette when SVG art is missing. */
function paintTownPickupShape(g: CanvasRenderingContext2D, id: MapCollectibleId, w: number, h: number): void {
  if (id === 'time_car') {
    paintTimeCarDisplay(g, w, h);
    return;
  }
  const s = Math.min(w, h) / 60;
  g.save();
  g.translate(w / 2, h / 2);
  g.scale(s, s);
  g.fillStyle = SILHOUETTE_COLOR;

  switch (id) {
    case 'slipper_flyer': {
      g.rotate(-0.12);
      g.beginPath();
      g.roundRect(-20, -24, 40, 48, 3);
      g.fill();
      g.beginPath();
      g.arc(0, -23, 5, 0, TAU);
      g.fill();
      break;
    }
    case 'astronomer': {
      g.beginPath();
      g.roundRect(-25, -18, 50, 36, 7);
      g.fill();
      g.beginPath();
      g.ellipse(-11, -8, 14, 11, 0, 0, TAU);
      g.fill();
      g.beginPath();
      g.arc(11, -5, 9, 0, TAU);
      g.fill();
      break;
    }
    case 'saucer_photo': {
      g.rotate(0.08);
      g.beginPath();
      g.roundRect(-24, -20, 48, 40, 4);
      g.fill();
      break;
    }
    case 'obelisk_crate': {
      g.rotate(-0.08);
      g.beginPath();
      g.roundRect(-22, -18, 44, 36, 3);
      g.fill();
      break;
    }
    case 'defibrillator': {
      g.rotate(0.06);
      g.beginPath();
      g.roundRect(-22, -16, 44, 32, 6);
      g.fill();
      break;
    }
    case 'shrimp_tower': {
      g.beginPath();
      g.roundRect(-23, -19, 46, 38, 7);
      g.fill();
      g.beginPath();
      g.arc(0, 0, 18, 0, TAU);
      g.fill();
      break;
    }
    case 'krix': {
      g.beginPath();
      g.roundRect(-16, 2, 32, 22, 8);
      g.fill();
      g.beginPath();
      g.ellipse(0, -8, 13, 12, 0, 0, TAU);
      g.fill();
      g.lineWidth = 5;
      g.strokeStyle = SILHOUETTE_COLOR;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-6, -15);
      g.lineTo(-14, -24);
      g.moveTo(6, -15);
      g.lineTo(14, -24);
      g.stroke();
      break;
    }
  }
  g.restore();
}

/** Crisp dark-lavender silhouette texture for an unfound town pickup (still, never animated). */
export function townPickupSilhouetteTexture(assets: Assets, id: MapCollectibleId, w: number, h: number): Texture {
  const key = id === 'time_car' ? TIME_CAR_EXHIBIT : pickupKey(id);
  const img = assets.get(key);
  const hasImg = !!img && img.complete && (img.naturalWidth > 0 || img.width > 0);
  return paintedTexture(`trophy|town-sil|${hasImg ? 1 : 0}|${id}|${w}x${h}`, w, h, (g, ww, hh) => {
    if (hasImg && img) {
      try {
        g.drawImage(img, 0, 0, ww, hh);
      } catch {
        paintTownPickupShape(g, id, ww, hh);
      }
    } else {
      paintTownPickupShape(g, id, ww, hh);
    }
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = SILHOUETTE_COLOR;
    g.fillRect(0, 0, ww, hh);
    g.globalCompositeOperation = 'source-over';
  });
}

/** Create an animated `PickupFigure` for a found town pickup in the Trophy Room. */
export function createTownPickupFigure(assets: Assets, id: MapCollectibleId, scale: number): PickupFigureHandle {
  if (id !== 'time_car') return new PickupFigure(assets, id, scale);
  const w = exhibitW * scale;
  const h = exhibitH * scale;
  const texture = artTex(assets, TIME_CAR_EXHIBIT, w, h)
    ?? paintedTexture(`trophy|time-car|${w}x${h}`, w, h, paintTimeCarDisplay);
  const root = new Sprite(texture);
  root.anchor.set(0.5);
  root.width = w;
  root.height = h;
  return { root, sync() {} };
}

/** Crisp Bureau trophy-cup icon (for Work Orders header button & Trophy Room badges). */
export function trophyCupTexture(size: number, color: string = C.amberHi): Texture {
  return paintedTexture(`icon|trophy-cup|${size}|${color}`, size, size, (g, w, h) => {
    const s = Math.min(w, h);
    g.save();
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.lineWidth = Math.max(2, s * 0.075);
    g.strokeStyle = C.ink;

    // side handles
    g.beginPath();
    g.moveTo(s * 0.25, s * 0.24);
    g.bezierCurveTo(s * 0.06, s * 0.24, s * 0.08, s * 0.52, s * 0.3, s * 0.52);
    g.moveTo(s * 0.75, s * 0.24);
    g.bezierCurveTo(s * 0.94, s * 0.24, s * 0.92, s * 0.52, s * 0.7, s * 0.52);
    g.strokeStyle = color;
    g.lineWidth = Math.max(2.5, s * 0.09);
    g.stroke();

    // cup bowl
    g.strokeStyle = C.ink;
    g.lineWidth = Math.max(2, s * 0.075);
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(s * 0.24, s * 0.16);
    g.lineTo(s * 0.76, s * 0.16);
    g.quadraticCurveTo(s * 0.75, s * 0.62, s * 0.5, s * 0.66);
    g.quadraticCurveTo(s * 0.25, s * 0.62, s * 0.24, s * 0.16);
    g.closePath();
    g.fill();
    g.stroke();

    // stem + base
    g.fillStyle = color;
    g.fillRect(s * 0.43, s * 0.64, s * 0.14, s * 0.15);
    g.strokeRect(s * 0.43, s * 0.64, s * 0.14, s * 0.15);
    g.beginPath();
    g.roundRect(s * 0.28, s * 0.77, s * 0.44, s * 0.12, 3);
    g.fill();
    g.stroke();

    // shine stripe
    g.strokeStyle = 'rgba(255,255,255,0.65)';
    g.lineWidth = Math.max(1.5, s * 0.055);
    g.beginPath();
    g.moveTo(s * 0.34, s * 0.25);
    g.quadraticCurveTo(s * 0.35, s * 0.44, s * 0.42, s * 0.52);
    g.stroke();
    g.restore();
  });
}

/** Crisp 4-point mint glint / compass-diamond badge icon for the Field Finds annex summary bar. */
export function fieldFindBadgeTexture(size: number, color: string = C.mint): Texture {
  return paintedTexture(`icon|field-find|${size}|${color}`, size, size, (g, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.42;
    g.save();
    g.lineJoin = 'round';
    g.lineWidth = Math.max(2, size * 0.075);
    g.strokeStyle = C.ink;
    g.fillStyle = color;
    // Outer Bureau compass diamond
    g.beginPath();
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r * 0.34, cy - r * 0.34);
    g.lineTo(cx + r, cy);
    g.lineTo(cx + r * 0.34, cy + r * 0.34);
    g.lineTo(cx, cy + r);
    g.lineTo(cx - r * 0.34, cy + r * 0.34);
    g.lineTo(cx - r, cy);
    g.lineTo(cx - r * 0.34, cy - r * 0.34);
    g.closePath();
    g.fill();
    g.stroke();
    // Bright centre dot
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(cx, cy, r * 0.18, 0, TAU);
    g.fill();
    g.restore();
  });
}
