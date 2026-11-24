import type { Assets } from '../contracts';
import { ART } from '../art-manifest';
import { C, font } from './theme';

// Canvas 2D helpers for texture painters (`paintedTexture`: Canvas 2D code that runs once to make a
// texture), plus small shared utilities. Screens draw with Pixi; see docs/PIXI-MIGRATION.md.

export function roundRectPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

export function text(
  g: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center',
  weight = 600,
  italic = false,
  /** Squeeze to fit this width (only if it would overflow). */
  maxW?: number,
): void {
  g.font = font(size, weight, italic);
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  if (maxW !== undefined) g.fillText(s, x, y, maxW);
  else g.fillText(s, x, y);
}

/** Draw art `key` into a rect (default: manifest size) centred on (cx, cy). Returns false if missing. */
export function sprite(
  g: CanvasRenderingContext2D,
  assets: Assets,
  key: string,
  cx: number,
  cy: number,
  w?: number,
  h?: number,
): boolean {
  const img = assets.get(key);
  if (!img) return false;
  const spec = ART[key];
  const ww = w ?? spec?.w ?? img.width;
  const hh = h ?? spec?.h ?? img.height;
  g.drawImage(img, cx - ww / 2, cy - hh / 2, ww, hh);
  return true;
}

/** Head sprite of a deep-level specimen from its short name ("Dave" -> human/dave_head). */
export function headKey(short: string): string {
  let key = headKeys.get(short);
  if (!key) {
    key = `human/${short.toLowerCase()}_head`;
    headKeys.set(short, key);
  }
  return key;
}
const headKeys = new Map<string, string>();

// Eye shapes lifted from the portrait SVGs (200×200 box, inside each file's own group transform),
// so a blink can be painted over the sprite without a second image.
const VRELL_EYES = 'M49 83Q62 75 80 83Q75 98 58 96Q51 93 49 83ZM95 80Q111 69 131 76Q126 91 109 92Q100 91 95 80Z';
const VRELL_LIDS = 'M51 88Q64 93 78 87M97 85Q112 89 129 80';
const ZIB_LIDS = 'M54 96Q72 106 91 96M106 93Q123 103 140 92';
let vrellEyes: Path2D | null = null;
let vrellLids: Path2D | null = null;
let zibLids: Path2D | null = null;

/** True for a few frames every few seconds (with the odd double blink). */
export function isBlinking(t: number, offset = 0): boolean {
  const c = (t + offset) % 3.9;
  return c < 0.13 || (c > 0.32 && c < 0.43 && Math.floor((t + offset) / 3.9) % 3 === 1);
}

function drawBlink(g: CanvasRenderingContext2D, who: 'vrell' | 'zib', cx: number, cy: number, size: number): void {
  const k = size / 200;
  g.save();
  g.translate(cx - size / 2, cy - size / 2);
  g.scale(k, k);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  if (who === 'vrell') {
    g.translate(1, -3);
    g.scale(0.994, 1.009);
    vrellEyes ??= new Path2D(VRELL_EYES);
    vrellLids ??= new Path2D(VRELL_LIDS);
    g.fillStyle = '#a387b1';
    g.fill(vrellEyes);
    g.lineWidth = 3;
    g.strokeStyle = '#1b1433';
    g.stroke(vrellEyes);
    g.lineWidth = 3.5;
    g.stroke(vrellLids);
  } else {
    g.translate(-10, 0);
    g.scale(1.055, 1);
    zibLids ??= new Path2D(ZIB_LIDS);
    g.fillStyle = '#64c5a1';
    g.strokeStyle = '#1b1433';
    g.lineWidth = 3.5;
    g.beginPath();
    g.ellipse(72, 92, 21, 23, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.beginPath();
    g.ellipse(123, 88, 19, 24, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.lineWidth = 4.5;
    g.stroke(zibLids);
  }
  g.restore();
}

/** Vrell / Zib portrait in a round frame. They blink (pass `blink = false` to hold still). */
export function drawPortrait(
  g: CanvasRenderingContext2D, assets: Assets, who: 'vrell' | 'zib', cx: number, cy: number, size: number, t: number, blink = true,
): void {
  const key = who === 'vrell' ? 'ui/vrell_portrait' : 'ui/zib_portrait';
  g.save();
  g.beginPath();
  g.arc(cx, cy, size / 2, 0, Math.PI * 2);
  g.fillStyle = who === 'vrell' ? '#3a2f80' : '#24385f';
  g.fill();
  g.clip();
  if (sprite(g, assets, key, cx, cy, size, size)) {
    if (blink && isBlinking(t, who === 'vrell' ? 0 : 1.7)) drawBlink(g, who, cx, cy, size);
  } else {
    const s = size / 200;
    const bob = Math.sin(t * 2) * 2 * s;
    if (who === 'vrell') {
      // tired purple blob with reading glasses and clipboard
      g.fillStyle = '#9b7bd8';
      g.beginPath();
      g.ellipse(cx, cy + 30 * s + bob, 70 * s, 78 * s, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 5 * s;
      g.stroke();
      g.fillStyle = '#fff';
      for (const ex of [-24, 24]) {
        g.beginPath();
        g.ellipse(cx + ex * s, cy + bob, 14 * s, 9 * s, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = C.ink;
      for (const ex of [-24, 24]) {
        g.fillRect(cx + (ex - 14) * s, cy - 4 * s + bob, 28 * s, 5 * s); // droopy lids
        g.beginPath();
        g.arc(cx + ex * s, cy + 3 * s + bob, 4 * s, 0, Math.PI * 2);
        g.fill();
      }
      g.lineWidth = 3 * s;
      g.beginPath();
      g.arc(cx - 24 * s, cy + bob, 16 * s, 0, Math.PI * 2);
      g.moveTo(cx + 40 * s, cy + bob);
      g.arc(cx + 24 * s, cy + bob, 16 * s, 0, Math.PI * 2);
      g.moveTo(cx - 8 * s, cy + bob);
      g.lineTo(cx + 8 * s, cy + bob);
      g.stroke();
      g.beginPath();
      g.moveTo(cx - 16 * s, cy + 34 * s + bob);
      g.lineTo(cx + 16 * s, cy + 30 * s + bob);
      g.stroke();
      // clipboard
      g.fillStyle = '#c99a5b';
      g.fillRect(cx + 34 * s, cy + 40 * s, 50 * s, 64 * s);
      g.fillStyle = '#f4efe2';
      g.fillRect(cx + 40 * s, cy + 50 * s, 38 * s, 48 * s);
    } else {
      // small nervous green alien, one antenna drooping
      g.strokeStyle = C.ink;
      g.lineWidth = 5 * s;
      g.beginPath();
      g.moveTo(cx - 20 * s, cy - 40 * s + bob);
      g.quadraticCurveTo(cx - 30 * s, cy - 80 * s + bob, cx - 20 * s, cy - 88 * s + bob);
      g.moveTo(cx + 20 * s, cy - 40 * s + bob);
      g.quadraticCurveTo(cx + 50 * s, cy - 60 * s + bob, cx + 56 * s, cy - 40 * s + bob);
      g.stroke();
      g.fillStyle = C.mint;
      g.beginPath();
      g.arc(cx - 20 * s, cy - 88 * s + bob, 8 * s, 0, Math.PI * 2);
      g.arc(cx + 56 * s, cy - 38 * s + bob, 8 * s, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#8be08f';
      g.beginPath();
      g.ellipse(cx, cy + 14 * s + bob, 62 * s, 70 * s, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = C.ink;
      for (const ex of [-24, 24]) {
        g.beginPath();
        g.ellipse(cx + ex * s, cy + 4 * s + bob, 15 * s, 21 * s, ex < 0 ? 0.3 : -0.3, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#fff';
      for (const ex of [-20, 28]) {
        g.beginPath();
        g.arc(cx + ex * s, cy - 4 * s + bob, 5 * s, 0, Math.PI * 2);
        g.fill();
      }
      g.lineWidth = 4 * s;
      g.beginPath();
      g.moveTo(cx - 12 * s, cy + 44 * s + bob);
      g.quadraticCurveTo(cx, cy + 36 * s + bob, cx + 12 * s, cy + 44 * s + bob);
      g.stroke();
    }
  }
  g.restore();
  g.beginPath();
  g.arc(cx, cy, size / 2, 0, Math.PI * 2);
  g.lineWidth = 4;
  g.strokeStyle = C.ink;
  g.stroke();
}

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v;
}

// Easing lives in core/fx; re-exported here because every screen already imports from this file.
export { easeOutBack, easeOutCubic } from '../core/fx';
