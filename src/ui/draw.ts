import type { Assets } from '../contracts';
import { ART } from '../art-manifest';
import { C, font } from './theme';

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

export function panel(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  r = 22,
  stroke: string | null = C.ink,
  lineW = 4,
  shadow = 6,
): void {
  if (shadow > 0) {
    roundRectPath(g, x, y + shadow, w, h, r);
    g.fillStyle = 'rgba(5,3,20,0.45)';
    g.fill();
  }
  roundRectPath(g, x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.lineWidth = lineW;
    g.strokeStyle = stroke;
    g.stroke();
  }
}

/** Thin inner highlight along the top edge of a panel drawn at (x, y, w) with corner radius r. */
export function panelHighlight(g: CanvasRenderingContext2D, x: number, y: number, w: number, r = 22, alpha = 0.14): void {
  g.beginPath();
  g.moveTo(x + r, y + 5);
  g.lineTo(x + w - r, y + 5);
  g.lineWidth = 2;
  g.lineCap = 'round';
  g.strokeStyle = '#ffffff';
  const a = g.globalAlpha;
  g.globalAlpha = a * alpha;
  g.stroke();
  g.globalAlpha = a;
  g.lineCap = 'butt';
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

/** Text with a thick outline (titles, captions). */
export function outlinedText(
  g: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size: number,
  color: string,
  outline: string = C.ink,
  weight = 900,
  align: CanvasTextAlign = 'center',
  /** Squeeze to fit this width (only if it would overflow). */
  maxW?: number,
): void {
  g.font = font(size, weight);
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = Math.max(4, size * 0.18);
  g.strokeStyle = outline;
  if (maxW !== undefined) {
    g.strokeText(s, x, y, maxW);
    g.fillStyle = color;
    g.fillText(s, x, y, maxW);
    return;
  }
  g.strokeText(s, x, y);
  g.fillStyle = color;
  g.fillText(s, x, y);
}

const wrapCache = new Map<string, string[]>();

/** Word-wrap with a cache (keyed by text, font and width). */
export function wrap(g: CanvasRenderingContext2D, s: string, maxW: number, size: number, weight = 600, italic = false): string[] {
  const key = `${size}|${weight}|${italic ? 1 : 0}|${maxW}|${s}`;
  const hit = wrapCache.get(key);
  if (hit) return hit;
  g.font = font(size, weight, italic);
  const lines: string[] = [];
  for (const para of s.split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (g.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    lines.push(line);
  }
  if (wrapCache.size > 400) wrapCache.clear();
  wrapCache.set(key, lines);
  return lines;
}

export function paragraph(
  g: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  maxW: number,
  size: number,
  color: string,
  lineH = size * 1.3,
  align: CanvasTextAlign = 'left',
  weight = 500,
  italic = false,
): number {
  const lines = wrap(g, s, maxW, size, weight, italic);
  g.font = font(size, weight, italic);
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  const ax = align === 'center' ? x + maxW / 2 : align === 'right' ? x + maxW : x;
  for (let i = 0; i < lines.length; i++) g.fillText(lines[i]!, ax, y + lineH * (i + 0.5));
  return lines.length * lineH;
}

/** Draw a sprite into a rect (default: manifest size) centred on (cx,cy). Returns false if missing. */
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

export function starPath(g: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
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

export function drawStar(g: CanvasRenderingContext2D, assets: Assets, cx: number, cy: number, size: number, full: boolean): void {
  if (sprite(g, assets, full ? 'ui/star_full' : 'ui/star_empty', cx, cy, size, size)) return;
  starPath(g, cx, cy, size * 0.48);
  g.fillStyle = full ? C.amberHi : 'rgba(255,255,255,0.08)';
  g.fill();
  g.lineJoin = 'round';
  g.lineWidth = Math.max(2, size * 0.07);
  g.strokeStyle = full ? C.ink : C.muted;
  g.stroke();
  if (full) {
    starPath(g, cx - size * 0.06, cy - size * 0.08, size * 0.2);
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.fill();
  }
}

export function drawGlorb(g: CanvasRenderingContext2D, assets: Assets, cx: number, cy: number, size: number): void {
  if (sprite(g, assets, 'ui/glorb', cx, cy, size, size)) return;
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
}

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
