// The SPOTTED moment on a deep shift: "Exhibit A", a flash photo of the saucer taken through
// whatever saw it (a dashcam, Mrs. Pruitt's binoculars, a doorbell, a dog...), and the witness.
// One canvas is allocated the first time you are spotted and reused after that.
import { VIEW_H, VIEW_W } from '../contracts';
import { GLOW, drawGlow, easeOutBack } from '../core/fx';
import { panel, roundRectPath, text } from '../ui/draw';
import { C } from '../ui/theme';
import type { SpotCause } from './hazards';

const TAU = Math.PI * 2;
const INK = '#1b1433';
const SKIN = '#f2c29b';
/** Photo size on screen, logical px. */
const PW = 360;
const PH = 240;
/** The photo shows this much of the view, blown up: a 1.25x zoom on the saucer. */
const SRC_W = 288;
const SRC_H = 192;

const LABELS: Record<SpotCause, string> = {
  police: 'Exhibit A · Unit 4 dashcam',
  patrol: 'Exhibit A · patrol car dashcam',
  traffic: 'Exhibit A · taxi dashcam (1 star)',
  porch: 'Exhibit A · doorbell camera',
  watcher: "Exhibit A · Mrs. Pruitt's binoculars",
  dog: 'Exhibit A · photo taken by a dog',
  heli: 'Exhibit A · Air Unit 1, gun camera',
  camera: 'Exhibit A · CCTV, camera 3',
  window: 'Exhibit A · phone, 14th floor',
};

export class SpottedPhoto {
  private canvas: HTMLCanvasElement | null = null;
  private ok = false;
  /** Where the saucer is in the photo, photo px (0..PW, 0..PH). */
  private px = PW / 2;
  private py = PH / 2;

  /**
   * Copy the frame that is on the canvas right now (the world, before the HUD is drawn) around
   * the saucer at logical screen position (sx, sy), then give it the look of a flash photo.
   */
  grab(g: CanvasRenderingContext2D, sx: number, sy: number): void {
    this.ok = false;
    try {
      const c = (this.canvas ??= document.createElement('canvas'));
      if (c.width !== PW * 2) {
        c.width = PW * 2;
        c.height = PH * 2;
      }
      const v = c.getContext('2d');
      if (!v) return;
      const m = g.getTransform();
      const x0 = Math.max(0, Math.min(VIEW_W - SRC_W, sx - SRC_W / 2));
      const y0 = Math.max(0, Math.min(VIEW_H - SRC_H, sy - SRC_H / 2));
      v.globalCompositeOperation = 'source-over';
      v.globalAlpha = 1;
      v.drawImage(g.canvas, m.e + x0 * m.a, m.f + y0 * m.d, SRC_W * m.a, SRC_H * m.d, 0, 0, c.width, c.height);
      this.px = ((sx - x0) / SRC_W) * PW;
      this.py = ((sy - y0) / SRC_H) * PH;
      // washed-out colour, a burnt-out middle and dark corners: a flash at night
      v.globalCompositeOperation = 'saturation';
      v.globalAlpha = 0.5;
      v.fillStyle = '#808080';
      v.fillRect(0, 0, c.width, c.height);
      v.globalCompositeOperation = 'lighter';
      v.globalAlpha = 1;
      drawGlow(v, GLOW.white, this.px * 2, this.py * 2, 330, 330, 0.4);
      v.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 4; i++) drawGlow(v, GLOW.dark, i % 2 === 0 ? 0 : c.width, i < 2 ? 0 : c.height, 330, 330, 0.75);
      this.ok = true;
    } catch {
      this.ok = false;
    }
  }

  /** The polaroid, dropped on the screen at (cx, cy). `st` = seconds since you were spotted. */
  draw(g: CanvasRenderingContext2D, cx: number, cy: number, cause: SpotCause, st: number, t: number, rm: boolean, clock: string): void {
    const land = rm ? 1 : easeOutBack((st - 0.06) / 0.32, 1.2);
    if (land <= 0) return;
    const tilt = (cause === 'dog' ? -0.13 : -0.045) + (rm ? 0 : (1 - Math.min(1, st / 0.4)) * 0.2);
    g.save();
    g.translate(cx, cy);
    g.rotate(tilt);
    const s = rm ? 1 : 1.5 - 0.5 * land;
    g.scale(s, s);
    g.globalAlpha = Math.min(1, st / 0.12);
    // card
    g.fillStyle = 'rgba(5,3,20,0.5)';
    g.fillRect(-PW / 2 - 12, -PH / 2 - 8, PW + 36, PH + 96);
    g.fillStyle = '#f4efe2';
    g.fillRect(-PW / 2 - 18, -PH / 2 - 18, PW + 36, PH + 92);
    g.fillStyle = '#17132b';
    g.fillRect(-PW / 2, -PH / 2, PW, PH);
    g.save();
    g.beginPath();
    g.rect(-PW / 2, -PH / 2, PW, PH);
    g.clip();
    g.translate(-PW / 2, -PH / 2);
    if (this.ok && this.canvas) g.drawImage(this.canvas, 0, 0, PW, PH);
    this.overlay(g, cause, st, t, rm, clock);
    g.restore();
    // the damning red marker, drawn on as you watch
    const k = rm ? 1 : Math.max(0, Math.min(1, (st - 0.42) / 0.3));
    if (k > 0) {
      const mx = this.px - PW / 2;
      const my = this.py - PH / 2;
      g.strokeStyle = '#e0304e';
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.beginPath();
      g.ellipse(mx, my, 66, 58, -0.2, -0.4, -0.4 + TAU * 1.08 * k);
      g.stroke();
      if (k >= 1) {
        const left = mx > 0;
        const ax = mx + (left ? -112 : 112);
        const ay = Math.max(-PH / 2 + 34, my - 62);
        g.beginPath();
        g.moveTo(ax, ay + 10);
        g.lineTo(mx + (left ? -62 : 62), my - 26);
        g.moveTo(mx + (left ? -62 : 62), my - 26);
        g.lineTo(mx + (left ? -80 : 80), my - 24);
        g.moveTo(mx + (left ? -62 : 62), my - 26);
        g.lineTo(mx + (left ? -70 : 70), my - 42);
        g.stroke();
        text(g, '?!', ax, ay - 8, 34, '#e0304e', 'center', 900, true);
      }
      g.lineCap = 'butt';
    }
    text(g, LABELS[cause], 0, PH / 2 + 38, 19, C.paperInk, 'center', 800, true, PW);
    g.restore();
  }

  /** What the witness's lens adds, in photo px. */
  private overlay(g: CanvasRenderingContext2D, cause: SpotCause, st: number, t: number, rm: boolean, clock: string): void {
    const rec = rm || Math.floor(t * 2) % 2 === 0;
    switch (cause) {
      case 'police':
      case 'patrol':
      case 'traffic': {
        // dashboard, wheel and whatever hangs off the mirror
        g.fillStyle = '#0c0a18';
        g.beginPath();
        g.moveTo(0, PH);
        g.lineTo(0, PH - 26);
        g.quadraticCurveTo(PW / 2, PH - 52, PW, PH - 26);
        g.lineTo(PW, PH);
        g.fill();
        g.lineWidth = 12;
        g.strokeStyle = '#1e1a30';
        g.beginPath();
        g.arc(96, PH + 34, 70, Math.PI, TAU);
        g.stroke();
        if (cause === 'traffic') {
          g.strokeStyle = '#0c0a18';
          g.lineWidth = 2;
          const sw = rm ? 0 : Math.sin(t * 3) * 8;
          g.beginPath();
          g.moveTo(PW / 2, 0);
          g.lineTo(PW / 2 + sw, 40);
          g.stroke();
          g.fillStyle = '#3f9a4a';
          g.beginPath();
          g.moveTo(PW / 2 + sw, 34);
          g.lineTo(PW / 2 + sw - 13, 66);
          g.lineTo(PW / 2 + sw + 13, 66);
          g.fill();
          text(g, 'FARE 12.40', PW - 12, PH - 12, 13, '#ffcf4a', 'right', 900);
        } else text(g, cause === 'police' ? 'UNIT 4' : 'PATROL 2', PW - 12, PH - 12, 13, '#cfd6ff', 'right', 900);
        if (rec) dot(g, 18, 18);
        text(g, 'REC', 30, 19, 13, '#ffffff', 'left', 900);
        break;
      }
      case 'watcher':
        // two overlapping circles: binoculars
        mask(g, 112, PH / 2, 112, PW - 112, PH / 2, 112);
        break;
      case 'porch':
        mask(g, PW / 2, PH / 2, 140, PW / 2, PH / 2, 140);
        g.fillStyle = 'rgba(224,48,78,0.9)';
        roundRectPath(g, PW / 2 - 92, 10, 184, 24, 12);
        g.fill();
        text(g, 'MOTION AT YOUR DOOR', PW / 2, 23, 13, '#ffffff', 'center', 900);
        break;
      case 'camera': {
        g.fillStyle = 'rgba(80,255,170,0.1)';
        g.fillRect(0, 0, PW, PH);
        g.fillStyle = 'rgba(0,0,0,0.16)';
        for (let y = (rm ? 0 : Math.floor(t * 30) % 6) - 6; y < PH; y += 6) g.fillRect(0, y, PW, 2);
        g.strokeStyle = '#d9fff0';
        g.lineWidth = 3;
        g.beginPath();
        for (let i = 0; i < 4; i++) {
          const x = i % 2 === 0 ? 12 : PW - 12;
          const y = i < 2 ? 12 : PH - 12;
          const dx = i % 2 === 0 ? 22 : -22;
          const dy = i < 2 ? 22 : -22;
          g.moveTo(x + dx, y);
          g.lineTo(x, y);
          g.lineTo(x, y + dy);
        }
        g.stroke();
        if (rec) dot(g, 28, 28);
        text(g, 'CAM 03', 40, 29, 13, '#d9fff0', 'left', 900);
        break;
      }
      case 'heli': {
        g.fillStyle = 'rgba(120,170,255,0.12)';
        g.fillRect(0, 0, PW, PH);
        g.strokeStyle = '#d9e6ff';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(this.px - 110, this.py);
        g.lineTo(this.px - 30, this.py);
        g.moveTo(this.px + 30, this.py);
        g.lineTo(this.px + 110, this.py);
        g.moveTo(this.px, this.py - 96);
        g.lineTo(this.px, this.py - 30);
        g.moveTo(this.px, this.py + 30);
        g.lineTo(this.px, this.py + 96);
        g.stroke();
        text(g, 'AIR-1 · TARGET: UNCLEAR', 12, 20, 13, '#d9e6ff', 'left', 900);
        text(g, 'ALT 300 FT', 12, PH - 14, 13, '#d9e6ff', 'left', 900);
        break;
      }
      case 'dog': {
        // too close to the lens: a nose
        const wob = rm ? 0 : Math.sin(t * 9) * 3;
        g.fillStyle = '#bb9161';
        g.beginPath();
        g.ellipse(PW / 2 + wob, PH + 8, 150, 62, 0, 0, TAU);
        g.fill();
        g.fillStyle = INK;
        g.beginPath();
        g.ellipse(PW / 2 + wob, PH - 20, 56, 38, 0, 0, TAU);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)';
        g.beginPath();
        g.ellipse(PW / 2 - 18 + wob, PH - 36, 16, 7, -0.3, 0, TAU);
        g.fill();
        break;
      }
      case 'window': {
        // filmed upright on a phone
        g.fillStyle = 'rgba(8,6,20,0.9)';
        g.fillRect(0, 0, 96, PH);
        g.fillRect(PW - 96, 0, 96, PH);
        g.fillStyle = '#e0304e';
        roundRectPath(g, 106, 10, 54, 22, 6);
        g.fill();
        text(g, 'LIVE', 133, 22, 13, '#ffffff', 'center', 900);
        text(g, '2 watching', 168, 22, 12, '#ffffff', 'left', 700);
        for (let i = 0; i < 3; i++) {
          const k = rm ? 0.3 + i * 0.2 : (st * 0.7 + i * 0.33) % 1;
          g.globalAlpha = 1 - k;
          heart(g, PW - 116 + Math.sin(k * 6 + i) * 6, PH - 20 - k * 120, 7 + i);
        }
        g.globalAlpha = 1;
        break;
      }
    }
    text(g, `${clock} AM`, PW - (cause === 'window' ? 108 : 12), 20, 13, 'rgba(255,255,255,0.9)', 'right', 800);
  }
}

function dot(g: CanvasRenderingContext2D, x: number, y: number): void {
  g.beginPath();
  g.arc(x, y, 6, 0, TAU);
  g.fillStyle = '#ff3355';
  g.fill();
}

function heart(g: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  g.fillStyle = '#ff5d73';
  g.beginPath();
  g.arc(x - r * 0.5, y, r * 0.55, 0, TAU);
  g.arc(x + r * 0.5, y, r * 0.55, 0, TAU);
  g.moveTo(x - r, y + r * 0.2);
  g.lineTo(x, y + r * 1.3);
  g.lineTo(x + r, y + r * 0.2);
  g.fill();
}

/** Black out everything except one or two circles (even-odd fill). */
function mask(g: CanvasRenderingContext2D, ax: number, ay: number, ar: number, bx: number, by: number, br: number): void {
  g.beginPath();
  g.rect(0, 0, PW, PH);
  g.moveTo(ax + ar, ay);
  g.arc(ax, ay, ar, 0, TAU);
  if (bx !== ax || by !== ay) {
    // overlapping lenses: build the union so the overlap is not re-filled
    g.fillStyle = '#07051a';
    g.save();
    g.beginPath();
    g.rect(0, 0, PW, PH);
    g.arc(ax, ay, ar, 0, TAU, true);
    g.clip('evenodd');
    g.beginPath();
    g.rect(0, 0, PW, PH);
    g.arc(bx, by, br, 0, TAU, true);
    g.fill('evenodd');
    g.restore();
    g.lineWidth = 6;
    g.strokeStyle = '#07051a';
    g.beginPath();
    g.arc(ax, ay, ar, 0, TAU);
    g.moveTo(bx + br, by);
    g.arc(bx, by, br, 0, TAU);
    g.globalAlpha = 0.35;
    g.stroke();
    g.globalAlpha = 1;
    return;
  }
  g.fillStyle = '#07051a';
  g.fill('evenodd');
}

/**
 * Whoever saw you, head and shoulders, popping up with a shout. (x, y) is the centre of the head;
 * `k` 0..1 is how far they have popped up.
 */
export function drawWitness(g: CanvasRenderingContext2D, cause: SpotCause, x: number, y: number, t: number, rm: boolean, k: number, shout: string): void {
  const rise = (1 - k) * 150;
  const wob = rm ? 0 : Math.sin(t * 18) * 1.6;
  g.save();
  g.translate(x + wob, y + rise);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.lineWidth = 4;
  g.strokeStyle = INK;
  if (cause === 'camera') cctv(g, t, rm);
  else if (cause === 'dog') dogHead(g, t, rm);
  else person(g, cause, t, rm);
  g.restore();
  g.lineCap = 'butt';
  if (k < 0.6) return;
  // shout bubble to the left, tail to the mouth
  const a = Math.min(1, (k - 0.6) / 0.3);
  const pop = rm ? 1 : easeOutBack(a);
  g.save();
  g.translate(x - 62, y - 6);
  g.scale(pop, pop);
  g.globalAlpha = Math.min(1, a * 1.5);
  g.beginPath();
  g.moveTo(-18, -8);
  g.lineTo(14, 4);
  g.lineTo(-18, 12);
  g.fillStyle = '#ffffff';
  g.fill();
  panel(g, -262, -34, 248, 62, '#ffffff', 26, INK, 4, 4);
  g.beginPath();
  g.moveTo(-17, -6);
  g.lineTo(10, 4);
  g.lineTo(-17, 10);
  g.fillStyle = '#ffffff';
  g.fill();
  text(g, shout, -138, -2, 26, C.red, 'center', 900, false, 224);
  g.restore();
}

function shoulders(g: CanvasRenderingContext2D, fill: string): void {
  roundRectPath(g, -62, 36, 124, 150, 40);
  g.fillStyle = fill;
  g.fill();
  g.stroke();
}

function face(g: CanvasRenderingContext2D, eyes: boolean): void {
  g.beginPath();
  g.arc(0, 0, 42, 0, TAU);
  g.fillStyle = SKIN;
  g.fill();
  g.stroke();
  if (eyes) {
    for (let i = -1; i <= 1; i += 2) {
      g.beginPath();
      g.arc(i * 16 - 3, -6, 11, 0, TAU);
      g.fillStyle = '#ffffff';
      g.fill();
      g.lineWidth = 3;
      g.stroke();
      g.beginPath();
      g.arc(i * 16 - 7, -10, 4.5, 0, TAU);
      g.fillStyle = INK;
      g.fill();
    }
  }
  // mouth, wide open
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(-2, 22, 10, 11, 0, 0, TAU);
  g.fillStyle = '#7a2a3a';
  g.fill();
  g.stroke();
  g.lineWidth = 4;
}

function person(g: CanvasRenderingContext2D, cause: SpotCause, t: number, rm: boolean): void {
  switch (cause) {
    case 'police':
    case 'patrol': {
      shoulders(g, '#2a3566');
      g.fillStyle = '#ffd27a';
      g.beginPath();
      g.arc(-30, 70, 9, 0, TAU);
      g.fill();
      g.stroke();
      face(g, true);
      // moustache
      g.beginPath();
      g.moveTo(-20, 9);
      g.quadraticCurveTo(-2, 0, 16, 9);
      g.quadraticCurveTo(-2, 16, -20, 9);
      g.fillStyle = '#5a3a2a';
      g.fill();
      g.stroke();
      // peaked cap
      g.beginPath();
      g.moveTo(-44, -18);
      g.quadraticCurveTo(-46, -60, 0, -62);
      g.quadraticCurveTo(46, -60, 44, -18);
      g.closePath();
      g.fillStyle = '#1e2750';
      g.fill();
      g.stroke();
      g.beginPath();
      g.ellipse(-8, -19, 46, 9, -0.06, 0, TAU);
      g.fillStyle = '#12183a';
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(0, -40, 8, 0, TAU);
      g.fillStyle = '#ffd27a';
      g.fill();
      g.stroke();
      break;
    }
    case 'traffic': {
      shoulders(g, '#f2c230');
      g.fillStyle = INK;
      for (let i = 0; i < 6; i++) if (i % 2 === 0) g.fillRect(-54 + i * 18, 46, 18, 12);
      face(g, true);
      g.beginPath();
      g.moveTo(-44, -14);
      g.quadraticCurveTo(-40, -52, 4, -50);
      g.quadraticCurveTo(44, -48, 42, -16);
      g.lineTo(-58, -8);
      g.closePath();
      g.fillStyle = '#6b6f86';
      g.fill();
      g.stroke();
      break;
    }
    case 'watcher': {
      shoulders(g, '#e79ac0');
      // hair in curlers
      g.fillStyle = '#c9c4dd';
      for (let i = 0; i < 5; i++) {
        const a = Math.PI + 0.25 + i * 0.66;
        g.beginPath();
        g.arc(Math.cos(a) * 40, Math.sin(a) * 40 + 2, 13, 0, TAU);
        g.fill();
        g.stroke();
      }
      face(g, false);
      // binoculars
      for (let i = -1; i <= 1; i += 2) {
        g.beginPath();
        g.arc(i * 17 - 2, -6, 16, 0, TAU);
        g.fillStyle = '#2a2438';
        g.fill();
        g.stroke();
        g.beginPath();
        g.arc(i * 17 - 2, -6, 10, 0, TAU);
        g.fillStyle = '#8fd8ff';
        g.fill();
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(i * 17 - 6, -10, 3.5, 0, TAU);
        g.fill();
      }
      break;
    }
    case 'heli': {
      shoulders(g, '#4b5a3c');
      face(g, true);
      // helmet and a boom mic
      g.beginPath();
      g.arc(0, -4, 46, Math.PI * 0.98, Math.PI * 2.02);
      g.lineTo(46, 8);
      g.lineTo(34, 8);
      g.quadraticCurveTo(0, -26, -34, 8);
      g.lineTo(-46, 8);
      g.closePath();
      g.fillStyle = '#6f7f52';
      g.fill();
      g.stroke();
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(40, 6);
      g.quadraticCurveTo(34, 34, 10, 26);
      g.stroke();
      g.beginPath();
      g.arc(10, 26, 5, 0, TAU);
      g.fillStyle = INK;
      g.fill();
      break;
    }
    case 'window': {
      shoulders(g, '#dfe6f5');
      // tie
      g.beginPath();
      g.moveTo(-8, 40);
      g.lineTo(8, 40);
      g.lineTo(12, 110);
      g.lineTo(0, 124);
      g.lineTo(-12, 110);
      g.closePath();
      g.fillStyle = '#d94c6a';
      g.fill();
      g.stroke();
      face(g, true);
      // bags under the eyes, hair on end
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(-19, 6, 9, 0.3, Math.PI - 0.3);
      g.moveTo(22, 6);
      g.arc(13, 6, 9, 0.3, Math.PI - 0.3);
      g.stroke();
      g.lineWidth = 4;
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * 1.12 + i * 0.3;
        g.moveTo(Math.cos(a) * 40, Math.sin(a) * 40);
        g.lineTo(Math.cos(a) * (54 + (i % 2) * 8), Math.sin(a) * (54 + (i % 2) * 8));
      }
      g.stroke();
      // the fourth coffee
      roundRectPath(g, 44, 26, 30, 34, 6);
      g.fillStyle = '#f4efe2';
      g.fill();
      g.stroke();
      g.lineWidth = 2.5;
      g.strokeStyle = 'rgba(255,255,255,0.7)';
      const s = rm ? 0 : Math.sin(t * 4) * 3;
      g.beginPath();
      g.moveTo(54, 20);
      g.quadraticCurveTo(48 + s, 10, 56, 0);
      g.moveTo(64, 20);
      g.quadraticCurveTo(70 - s, 10, 62, 0);
      g.stroke();
      break;
    }
    default: {
      // the neighbour, in pyjamas and a nightcap
      roundRectPath(g, -62, 36, 124, 150, 40);
      g.fillStyle = '#6f8fd8';
      g.fill();
      g.save();
      g.clip();
      g.fillStyle = '#e8eefc';
      for (let k = -62; k < 62; k += 24) g.fillRect(k + 6, 36, 9, 150);
      g.restore();
      g.stroke();
      face(g, true);
      const bob = rm ? 0 : Math.sin(t * 6) * 5;
      g.beginPath();
      g.moveTo(-44, -14);
      g.quadraticCurveTo(0, -84, 46, -16);
      g.quadraticCurveTo(84, -28, 92, 8 + bob);
      g.quadraticCurveTo(64, -40, 28, -32);
      g.closePath();
      g.fillStyle = '#d94c6a';
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(93, 12 + bob, 10, 0, TAU);
      g.fillStyle = '#ffffff';
      g.fill();
      g.stroke();
    }
  }
}

function dogHead(g: CanvasRenderingContext2D, t: number, rm: boolean): void {
  const flap = rm ? 0 : Math.sin(t * 16) * 0.25;
  // ears
  for (let i = -1; i <= 1; i += 2) {
    g.save();
    g.translate(i * 34, -22);
    g.rotate(i * (0.5 + flap));
    g.beginPath();
    g.ellipse(0, 24, 15, 30, 0, 0, TAU);
    g.fillStyle = '#895e55';
    g.fill();
    g.stroke();
    g.restore();
  }
  g.beginPath();
  g.arc(0, 0, 42, 0, TAU);
  g.fillStyle = '#bb9161';
  g.fill();
  g.stroke();
  // muzzle, nose, tongue
  g.beginPath();
  g.ellipse(0, 18, 26, 20, 0, 0, TAU);
  g.fillStyle = '#e5cc9f';
  g.fill();
  g.stroke();
  g.beginPath();
  g.ellipse(0, 28, 9, 12, 0, 0, TAU);
  g.fillStyle = '#e8748a';
  g.fill();
  g.stroke();
  g.beginPath();
  g.ellipse(0, 6, 10, 7, 0, 0, TAU);
  g.fillStyle = INK;
  g.fill();
  for (let i = -1; i <= 1; i += 2) {
    g.beginPath();
    g.arc(i * 17, -12, 9, 0, TAU);
    g.fillStyle = '#ffffff';
    g.fill();
    g.lineWidth = 3;
    g.stroke();
    g.beginPath();
    g.arc(i * 17 - 2, -15, 4, 0, TAU);
    g.fillStyle = INK;
    g.fill();
  }
  // paws on the edge of the caption card
  g.lineWidth = 4;
  for (let i = -1; i <= 1; i += 2) {
    g.beginPath();
    g.ellipse(i * 44, 56, 16, 11, 0, 0, TAU);
    g.fillStyle = '#e5cc9f';
    g.fill();
    g.stroke();
  }
}

function cctv(g: CanvasRenderingContext2D, t: number, rm: boolean): void {
  // a camera on its bracket, nodding
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(20, 150);
  g.lineTo(20, 34);
  g.stroke();
  g.lineWidth = 5;
  g.strokeStyle = '#8f93a8';
  g.stroke();
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.rotate(rm ? -0.2 : -0.2 + Math.sin(t * 5) * 0.12);
  roundRectPath(g, -58, -28, 104, 56, 12);
  g.fillStyle = '#c9cbd8';
  g.fill();
  g.stroke();
  roundRectPath(g, -74, -20, 22, 40, 6);
  g.fillStyle = '#2a2438';
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(-64, 0, 9, 0, TAU);
  g.fillStyle = '#8fd8ff';
  g.fill();
  g.beginPath();
  g.arc(30, -12, 6, 0, TAU);
  g.fillStyle = rm || Math.floor(t * 4) % 2 === 0 ? '#ff3355' : '#6a2030';
  g.fill();
}
