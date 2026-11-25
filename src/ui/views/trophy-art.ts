// v4 trophy room: cached Pixi textures for souvenir exhibits (full-colour art or painted fallback),
// crisp dark-lavender silhouettes for unfound slots, and the Work Orders trophy-cup icon.
// Canvas 2D runs only inside `paintedTexture` painters (never per frame).
import type { Texture } from 'pixi.js';
import type { Assets } from '../../contracts';
import { paintCaveProp } from '../../abduct/monolith-art';
import { paintSouvenir } from '../../abduct/souvenir-art';
import { INK } from '../../abduct/views/pieces';
import { artTexture, paintedTexture } from '../../core/gfx/textures';
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
