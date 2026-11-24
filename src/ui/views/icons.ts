// Small UI icons as cached textures (painted once with Canvas 2D, then used as sprites).
import { Sprite, type Texture } from 'pixi.js';
import type { Assets } from '../../contracts';
import { paintedTexture } from '../../core/gfx/textures';
import { C } from '../theme';
import { artTex } from './art';

/** Speaker icon (muted or not) in `color`, centred on its sprite (a 48×36 box around the old draw origin). */
export function speakerTexture(muted: boolean, color: string): Texture {
  return paintedTexture(`icon|speaker|${muted ? 1 : 0}|${color}`, 48, 36, (g) => {
    const cx = 18;
    const cy = 18;
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(cx - 14, cy - 6);
    g.lineTo(cx - 6, cy - 6);
    g.lineTo(cx + 4, cy - 15);
    g.lineTo(cx + 4, cy + 15);
    g.lineTo(cx - 6, cy + 6);
    g.lineTo(cx - 14, cy + 6);
    g.closePath();
    g.fill();
    g.strokeStyle = color;
    g.lineWidth = 3.5;
    g.lineCap = 'round';
    g.beginPath();
    if (muted) {
      g.moveTo(cx + 10, cy - 7);
      g.lineTo(cx + 22, cy + 7);
      g.moveTo(cx + 22, cy - 7);
      g.lineTo(cx + 10, cy + 7);
    } else {
      g.arc(cx + 6, cy, 8, -0.9, 0.9);
      g.moveTo(cx + 6 + 14 * Math.cos(-0.9), cy + 14 * Math.sin(-0.9));
      g.arc(cx + 6, cy, 14, -0.9, 0.9);
    }
    g.stroke();
  });
}

/** A speaker sprite; `set` places it where the old `drawSpeaker(g, cx, cy, ...)` was drawn. */
export class SpeakerIcon extends Sprite {
  private readonly texOn: Texture;
  private readonly texOff: Texture;

  constructor(color: string) {
    const on = speakerTexture(false, color);
    super(on);
    this.texOn = on;
    this.texOff = speakerTexture(true, color);
    // the texture's (18, 18) is the old drawing origin
    this.anchor.set(18 / 48, 0.5);
  }

  set(cx: number, cy: number, muted: boolean): void {
    this.texture = muted ? this.texOff : this.texOn;
    this.position.set(cx, cy);
  }
}

function starPathTo(g: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
}

/** Rating star (art, or the drawn fallback) at `size`. */
export function starTexture(assets: Assets, size: number, full: boolean): Texture {
  const art = artTex(assets, full ? 'ui/star_full' : 'ui/star_empty', size, size);
  if (art) return art;
  return paintedTexture(`icon|star|${size}|${full ? 1 : 0}`, size, size, (g) => {
    const c = size / 2;
    starPathTo(g, c, c, size * 0.48);
    g.fillStyle = full ? C.amberHi : 'rgba(255,255,255,0.08)';
    g.fill();
    g.lineJoin = 'round';
    g.lineWidth = Math.max(2, size * 0.07);
    g.strokeStyle = full ? C.ink : C.muted;
    g.stroke();
    if (full) {
      starPathTo(g, c - size * 0.06, c - size * 0.08, size * 0.2);
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fill();
    }
  });
}

/** Glorb (the currency blob): art, or the drawn fallback, at `size`. */
export function glorbTexture(assets: Assets, size: number): Texture {
  const art = artTex(assets, 'ui/glorb', size, size);
  if (art) return art;
  return paintedTexture(`icon|glorb|${size}`, size, size, (g) => {
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.42;
    g.beginPath();
    g.ellipse(cx, cy + r * 0.08, r, r * 0.9, 0, 0, Math.PI * 2);
    g.fillStyle = C.mint;
    g.fill();
    g.lineWidth = Math.max(2, size * 0.08);
    g.strokeStyle = C.ink;
    g.stroke();
    g.beginPath();
    g.arc(cx - r * 0.35, cy - r * 0.3, r * 0.22, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.fill();
    g.beginPath();
    g.arc(cx + r * 0.1, cy + r * 0.1, r * 0.12, 0, Math.PI * 2);
    g.fillStyle = C.ink;
    g.fill();
  });
}

/** A centred sprite of `tex` at `size`×`size`. */
export function iconSprite(tex: Texture, size: number): Sprite {
  const s = new Sprite(tex);
  s.anchor.set(0.5);
  s.width = s.height = size;
  return s;
}
