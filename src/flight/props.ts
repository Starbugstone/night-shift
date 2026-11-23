// Top-down sprites with primitive fallbacks.
import type { Assets } from '../contracts';
import { ART } from '../art-manifest';
import type { PropDef, PropKind } from '../levels/types';
import { drawSprite } from '../core/fx';
import { roundRectPath } from '../ui/draw';
import { tr } from '../i18n';

const INK = '#1b1433';

const sizes = new WeakMap<PropDef, { w: number; h: number }>();

/** Draw size of a prop (cached per definition, so render loops don't allocate). */
export function propSize(p: PropDef): { w: number; h: number } {
  let size = sizes.get(p);
  if (!size) {
    const spec = ART[p.key];
    size = { w: p.w ?? spec?.w ?? 100, h: p.h ?? spec?.h ?? 100 };
    sizes.set(p, size);
  }
  return size;
}

export function drawProp(g: CanvasRenderingContext2D, assets: Assets, p: PropDef): void {
  const { w, h } = propSize(p);
  const img = assets.get(p.key);
  g.save();
  g.translate(p.x, p.y);
  if (p.rot) g.rotate(p.rot);
  if (img) drawSprite(g, img, -w / 2, -h / 2, w, h);
  else drawFallback(g, p.kind, w, h, p.tint);
  g.restore();
}

function box(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string): void {
  roundRectPath(g, x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.stroke();
}

/** Draws centred on the origin into a w×h box. */
export function drawFallback(g: CanvasRenderingContext2D, kind: PropKind, w: number, h: number, tint?: string): void {
  const x = -w / 2;
  const y = -h / 2;
  switch (kind) {
    case 'suburb_house': {
      box(g, x + 6, y + h * 0.74, w - 12, h * 0.24, 4, '#c7b49a');
      box(g, x + 4, y + 4, w - 8, h * 0.74, 8, tint ?? '#5a6aa0');
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(x + 8, y + h * 0.37 - 3, w - 16, 6);
      g.fillStyle = '#ffcf7a';
      g.fillRect(x + w * 0.3, y + h * 0.82, 20, 12);
      break;
    }
    case 'highrise':
    case 'civic': {
      box(g, x + 4, y + 4, w - 8, h - 8, kind === 'civic' ? 14 : 6, tint ?? '#3d4466');
      g.strokeStyle = 'rgba(255,255,255,0.08)';
      g.lineWidth = 2;
      g.strokeRect(x + 18, y + 18, w - 36, h - 36);
      g.fillStyle = 'rgba(0,0,0,0.22)';
      for (let k = 0; k < 3; k++) g.fillRect(x + 30 + k * 48, y + 30, 30, 22); // roof units
      break;
    }
    case 'pool': {
      box(g, x + 4, y + 4, w - 8, h - 8, 18, '#5fc3e4');
      g.strokeStyle = 'rgba(255,255,255,0.45)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x + 20, y + h / 2);
      g.quadraticCurveTo(0, y + h / 2 - 10, w / 2 - 20, y + h / 2);
      g.stroke();
      break;
    }
    case 'trampoline': {
      g.beginPath();
      g.arc(0, 0, w * 0.45, 0, Math.PI * 2);
      g.fillStyle = '#1b1d2e';
      g.fill();
      g.lineWidth = 5;
      g.strokeStyle = '#3a7ad9';
      g.stroke();
      break;
    }
    case 'hedge':
      box(g, x + 2, y + 2, w - 4, h - 4, h / 2, '#2f5a3e');
      break;
    case 'park': {
      box(g, x + 4, y + 4, w - 8, h - 8, 20, '#355a3e');
      g.strokeStyle = '#a89878';
      g.lineWidth = 14;
      g.beginPath();
      g.moveTo(x + 10, 0);
      g.lineTo(x + w - 10, 0);
      g.moveTo(0, y + 10);
      g.lineTo(0, y + h - 10);
      g.stroke();
      g.beginPath();
      g.arc(0, 0, 36, 0, Math.PI * 2);
      g.fillStyle = '#5fc3e4';
      g.fill();
      break;
    }
    case 'farmhouse': {
      box(g, x + 4, y + h * 0.72, w - 8, h * 0.26, 6, '#a7876a'); // south wall
      box(g, x + 4, y + 4, w - 8, h * 0.74, 10, '#8a4a3c');
      g.strokeStyle = '#6c372c';
      g.lineWidth = 3;
      for (let k = 1; k < 6; k++) {
        g.beginPath();
        g.moveTo(x + 10, y + 4 + (h * 0.74 * k) / 6);
        g.lineTo(x + w - 10, y + 4 + (h * 0.74 * k) / 6);
        g.stroke();
      }
      g.fillStyle = '#5a2c22';
      g.fillRect(x + 8, y + h * 0.37 - 3, w - 16, 6); // ridge
      box(g, x + w * 0.62, y + h * 0.16, 30, 30, 4, '#6d6170'); // chimney
      g.fillStyle = '#ffcf7a';
      g.fillRect(x + w * 0.2, y + h * 0.8, 26, 18);
      g.fillRect(x + w * 0.62, y + h * 0.8, 26, 18);
      break;
    }
    case 'barn': {
      box(g, x + 4, y + 4, w - 8, h - 8, 8, '#a8322e');
      g.strokeStyle = '#f0e6d2';
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(x + 24, y + 24);
      g.lineTo(x + w - 24, y + h - 24);
      g.moveTo(x + w - 24, y + 24);
      g.lineTo(x + 24, y + h - 24);
      g.stroke();
      g.fillStyle = '#7a1f1d';
      g.fillRect(x + w / 2 - 4, y + 8, 8, h - 16);
      break;
    }
    case 'crop_field': {
      // fenced wheat with a pale flattened ring, a centre disc and a trailing chain of dots
      box(g, x + 2, y + 2, w - 4, h - 4, 14, '#a07a4a');
      g.strokeStyle = '#7d5c3c';
      g.lineWidth = 3;
      for (let k = 16; k < h - 8; k += 14) {
        g.beginPath();
        g.moveTo(x + 12, y + k);
        g.lineTo(x + w - 12, y + k);
        g.stroke();
      }
      const cx = x + w * 0.49;
      const cy = y + h * 0.48;
      g.strokeStyle = '#e5cc9f';
      g.lineWidth = 15;
      g.beginPath();
      g.arc(cx, cy, h * 0.28, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = '#e5cc9f';
      g.beginPath();
      g.arc(cx, cy, h * 0.13, 0, Math.PI * 2);
      for (const [dx, r] of [[0.28, 14], [0.36, 9], [0.42, 6]] as const) {
        g.moveTo(cx + w * dx + r, cy);
        g.arc(cx + w * dx, cy, r, 0, Math.PI * 2);
      }
      g.fill();
      break;
    }
    case 'field': {
      box(g, x + 2, y + 2, w - 4, h - 4, 10, '#4a5a30');
      g.strokeStyle = '#6b7a3c';
      g.lineWidth = 8;
      for (let k = 18; k < h - 10; k += 22) {
        g.beginPath();
        g.moveTo(x + 14, y + k);
        g.lineTo(x + w - 14, y + k);
        g.stroke();
      }
      break;
    }
    case 'tractor': {
      box(g, x + 4, y + h * 0.55, 24, 50, 6, '#2a2a2a');
      box(g, x + w - 28, y + h * 0.55, 24, 50, 6, '#2a2a2a');
      box(g, x + 10, y + 8, 18, 30, 5, '#2a2a2a');
      box(g, x + w - 28, y + 8, 18, 30, 5, '#2a2a2a');
      box(g, x + 22, y + 14, w - 44, h - 24, 10, '#3f9a4a');
      box(g, x + 26, y + h * 0.55, w - 52, 34, 6, '#c9e6f2');
      break;
    }
    case 'tree': {
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.beginPath();
      g.arc(8, 10, w * 0.44, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#244b38';
      g.beginPath();
      g.arc(-w * 0.16, -h * 0.08, w * 0.3, 0, Math.PI * 2);
      g.arc(w * 0.16, -h * 0.12, w * 0.28, 0, Math.PI * 2);
      g.arc(0, h * 0.16, w * 0.32, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = INK;
      g.stroke();
      g.fillStyle = '#2f6247';
      g.beginPath();
      g.arc(-w * 0.1, -h * 0.12, w * 0.16, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'haybale': {
      g.fillStyle = '#d9b24c';
      g.beginPath();
      g.arc(0, 0, w * 0.44, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = INK;
      g.stroke();
      g.strokeStyle = '#a8862e';
      g.beginPath();
      g.arc(0, 0, w * 0.28, 0, 5);
      g.arc(0, 0, w * 0.12, 0, 5);
      g.stroke();
      break;
    }
    case 'laundromat': {
      box(g, x + 4, y + h * 0.78, w - 8, h * 0.2, 4, '#9aa4c4');
      box(g, x + 4, y + 4, w - 8, h * 0.8, 8, '#5b6688');
      g.fillStyle = '#48526f';
      for (let k = 0; k < 3; k++) g.fillRect(x + 20 + k * 40, y + 20, 26, 20); // vents
      box(g, -40, -36, 80, 46, 6, '#9fe6ff'); // skylight
      box(g, x + w * 0.62, y + 10, 70, 40, 4, '#7a7f95'); // loading bay roof
      g.fillStyle = '#ff7ad9';
      g.font = '800 20px system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(tr().flight.spinCity, 0, y + h * 0.88);
      break;
    }
    case 'diner': {
      box(g, x + 4, y + h * 0.78, w - 8, h * 0.2, 4, '#e8e2d0');
      box(g, x + 4, y + 4, w - 8, h * 0.8, 12, '#3a8c8c');
      g.strokeStyle = '#2b6b6b';
      g.lineWidth = 10;
      for (let k = 30; k < w - 20; k += 40) {
        g.beginPath();
        g.moveTo(x + k, y + 12);
        g.lineTo(x + k, y + h * 0.78);
        g.stroke();
      }
      g.fillStyle = '#ffcf7a';
      for (let k = 0; k < 4; k++) g.fillRect(x + 24 + k * 56, y + h * 0.83, 34, 14);
      break;
    }
    case 'house': {
      box(g, x + 6, y + h * 0.74, w - 12, h * 0.24, 4, '#c7b49a');
      box(g, x + 4, y + 4, w - 8, h * 0.74, 8, '#4c4f86');
      g.fillStyle = '#3a3c6a';
      g.fillRect(x + 8, y + h * 0.37 - 3, w - 16, 6);
      g.fillStyle = '#ffcf7a';
      g.fillRect(x + w * 0.25, y + h * 0.82, 22, 14);
      break;
    }
    case 'streetlight': {
      g.fillStyle = '#4a4a5e';
      g.beginPath();
      g.arc(0, 0, w * 0.4, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = INK;
      g.stroke();
      g.fillStyle = '#ffe0a0';
      g.beginPath();
      g.arc(0, 0, w * 0.2, 0, Math.PI * 2);
      g.fill();
      break;
    }
  }
}

/** Vehicle centred on origin, nose pointing up (north). */
export function drawVehicle(g: CanvasRenderingContext2D, assets: Assets, key: string, kind: 'pickup' | 'van'): void {
  const spec = ART[key]!;
  const img = assets.get(key);
  const w = spec.w;
  const h = spec.h;
  if (img) {
    g.drawImage(img, -w / 2, -h / 2, w, h);
    return;
  }
  const x = -w / 2;
  const y = -h / 2;
  if (kind === 'pickup') {
    box(g, x + 4, y + 4, w - 8, h - 8, 16, '#c0392b');
    box(g, x + 12, y + 26, w - 24, 26, 6, '#9fd3e6'); // windscreen
    box(g, x + 12, y + h * 0.48, w - 24, h * 0.44, 4, '#7a2219'); // bed
  } else {
    box(g, x + 4, y + 4, w - 8, h - 8, 14, '#e6e6ee');
    box(g, x + 12, y + 18, w - 24, 26, 6, '#9fd3e6');
    g.fillStyle = '#ff7a4a';
    g.fillRect(x + 10, y + h * 0.55, w - 20, 10);
  }
  g.fillStyle = '#fff6b0';
  g.fillRect(x + 8, y + 2, 14, 7);
  g.fillRect(x + w - 22, y + 2, 14, 7);
}

/** dog_top.svg's ear, in its 70×70 box (redrawn on top of the sprite to twitch it). */
const EAR = 'M19 33Q21 26 28 28L31 41Q29 52 23 47Z';
let earPath: Path2D | null = null;

/** Sleeping dog: slow breathing, an ear that twitches now and then (and flaps while it barks). */
export function drawDog(g: CanvasRenderingContext2D, assets: Assets, x: number, y: number, t: number, barking = false, reduced = false): void {
  const img = assets.get('flight/dog_top');
  const breath = reduced ? 0 : Math.sin(t * 2.2);
  g.save();
  g.translate(x, y);
  if (img) {
    g.scale(1 + breath * 0.035, 1 + breath * 0.022);
    drawSprite(g, img, -35, -35, 70, 70);
    const cycle = (t + x * 0.013) % 3.4;
    const twitch = reduced ? 0 : barking ? Math.sin(t * 24) * 0.32 : cycle < 0.4 ? Math.sin((cycle / 0.4) * Math.PI * 3) * 0.45 : 0;
    if (twitch !== 0) {
      earPath ??= new Path2D(EAR);
      g.translate(-35 + 25, -35 + 29);
      g.rotate(twitch);
      g.translate(-25, -29);
      g.fillStyle = '#895e55';
      g.fill(earPath);
      g.lineWidth = 2.5;
      g.lineJoin = 'round';
      g.strokeStyle = INK;
      g.stroke(earPath);
    }
    g.restore();
    return;
  }
  const b = 1 + breath * 0.04;
  g.scale(b, b);
  g.fillStyle = '#a8703c';
  g.beginPath();
  g.arc(0, 0, 26, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.stroke();
  g.fillStyle = '#7a4a22';
  g.beginPath();
  g.ellipse(-14, -14, 9, 13, -0.6, 0, Math.PI * 2);
  g.ellipse(4, -22, 9, 12, 0.3, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = INK;
  g.beginPath();
  g.arc(-6, -6, 3, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

export function drawSaucerFallback(g: CanvasRenderingContext2D, size: number, t: number): void {
  const r = size / 2;
  g.fillStyle = '#7d8fb3';
  g.beginPath();
  g.arc(0, 0, r * 0.95, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = INK;
  g.stroke();
  g.fillStyle = '#a9b9d8';
  g.beginPath();
  g.arc(0, 0, r * 0.75, 0, Math.PI * 2);
  g.fill();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + t * 1.5;
    const on = Math.floor(t * 8 + i) % 3 === 0;
    g.fillStyle = on ? '#FFD27A' : '#4d5d86';
    g.beginPath();
    g.arc(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, r * 0.07, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#7CFFCB';
  g.beginPath();
  g.arc(0, 0, r * 0.42, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.6)';
  g.beginPath();
  g.arc(-r * 0.14, -r * 0.16, r * 0.12, 0, Math.PI * 2);
  g.fill();
}
