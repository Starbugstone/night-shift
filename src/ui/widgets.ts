import type { Audio, PointerState } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import { outlinedText, panel, roundRectPath, text } from './draw';
import { C } from './theme';

export type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'amber';

/** Tap = press inside, release inside. Min 56 logical px tall. */
export class Button {
  enabled = true;
  visible = true;
  private armed = false;
  private flash = 0;

  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public label: string,
    public kind: ButtonKind = 'primary',
    public size = 26,
  ) {}

  contains(px: number, py: number): boolean {
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }

  get pressedDown(): boolean {
    return this.armed;
  }

  /** Returns true when tapped. */
  update(p: PointerState, dt: number, audio?: Audio, dy = 0): boolean {
    this.flash = Math.max(0, this.flash - dt * 4);
    if (!this.visible || !this.enabled) {
      this.armed = false;
      return false;
    }
    const inside = this.contains(p.x, p.y + dy);
    if (p.pressed && inside) this.armed = true;
    if (this.armed && p.down && !inside) this.armed = false;
    if (p.released) {
      const hit = this.armed && inside;
      this.armed = false;
      if (hit) {
        this.flash = 1;
        audio?.sfx('click');
        return true;
      }
    }
    return false;
  }

  cancel(): void {
    this.armed = false;
  }

  render(g: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    const push = this.armed ? 4 : 0;
    const { x, w, h } = this;
    const y = this.y + push;
    let fill: string = C.mint;
    let fg: string = C.ink;
    let stroke: string = C.ink;
    if (this.kind === 'secondary') {
      fill = C.panelHi;
      fg = C.mint;
    } else if (this.kind === 'ghost') {
      fill = 'rgba(20,14,50,0.7)';
      fg = C.text;
      stroke = 'rgba(170,160,220,0.6)';
    } else if (this.kind === 'amber') {
      fill = C.amber;
    }
    if (!this.enabled) {
      fill = '#4a4470';
      fg = '#a09bc4';
    }
    panel(g, x, y, w, h, fill, Math.min(22, h / 2), stroke, 4, this.kind === 'ghost' ? 0 : 6 - push);
    if (this.kind === 'primary' && this.enabled) {
      roundRectPath(g, x + 10, y + 6, w - 20, h * 0.28, h * 0.14);
      g.fillStyle = 'rgba(255,255,255,0.28)';
      g.fill();
    }
    text(g, this.label, x + w / 2, y + h / 2 + 1, this.size, fg, 'center', 800);
    if (this.flash > 0) {
      roundRectPath(g, x, y, w, h, Math.min(22, h / 2));
      g.fillStyle = `rgba(255,255,255,${(this.flash * 0.35).toFixed(3)})`;
      g.fill();
    }
  }
}

/** Speaker icon toggle. */
export function drawSpeaker(g: CanvasRenderingContext2D, cx: number, cy: number, muted: boolean, color: string): void {
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
  g.lineCap = 'butt';
}

// ---------------------------------------------------------------- backgrounds

interface StarPt {
  x: number;
  y: number;
  r: number;
  p: number;
}

const STARS: StarPt[] = (() => {
  let seed = 1337;
  const rnd = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const out: StarPt[] = [];
  for (let i = 0; i < 90; i++) out.push({ x: rnd() * VIEW_W, y: rnd() * VIEW_H, r: 0.6 + rnd() * 1.8, p: rnd() * 6.28 });
  return out;
})();

let skyGrad: CanvasGradient | null = null;

export function drawNightSky(g: CanvasRenderingContext2D, t: number, reduced: boolean): void {
  if (!skyGrad) {
    skyGrad = g.createLinearGradient(0, 0, 0, VIEW_H);
    skyGrad.addColorStop(0, '#0d0924');
    skyGrad.addColorStop(0.6, '#1e1747');
    skyGrad.addColorStop(1, '#33236b');
  }
  g.fillStyle = skyGrad;
  g.fillRect(0, 0, VIEW_W, VIEW_H);
  g.fillStyle = '#ffffff';
  for (const s of STARS) {
    const tw = reduced ? 0.7 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.7 + s.p));
    g.globalAlpha = tw;
    g.fillRect(s.x, s.y, s.r, s.r);
  }
  g.globalAlpha = 1;
}

/** Sleepy town silhouette along the bottom (title / report backgrounds). */
export function drawSkyline(g: CanvasRenderingContext2D, t: number, baseY = VIEW_H): void {
  g.fillStyle = '#150f33';
  const roofs = [
    [0, 120, 90],
    [80, 170, 70],
    [140, 110, 120],
    [250, 200, 80],
    [320, 140, 110],
    [420, 180, 70],
    [480, 130, 80],
  ] as const;
  for (const [x, h, w] of roofs) {
    g.fillRect(x, baseY - h, w, h);
    g.beginPath();
    g.moveTo(x - 6, baseY - h);
    g.lineTo(x + w / 2, baseY - h - 34);
    g.lineTo(x + w + 6, baseY - h);
    g.fill();
  }
  // a few lit windows; one flickers off now and then
  const wins = [
    [30, 70],
    [110, 120],
    [180, 60],
    [280, 150],
    [360, 90],
    [440, 130],
    [510, 70],
  ] as const;
  for (let i = 0; i < wins.length; i++) {
    const [x, h] = wins[i]!;
    const on = i !== 3 || Math.sin(t * 0.7) > -0.3;
    g.fillStyle = on ? 'rgba(255,200,110,0.85)' : 'rgba(80,70,120,0.6)';
    g.fillRect(x, baseY - h + 10, 16, 20);
  }
}

export function drawTitleText(g: CanvasRenderingContext2D, s: string, y: number, size = 40): void {
  outlinedText(g, s, VIEW_W / 2, y, size, C.mint);
}
