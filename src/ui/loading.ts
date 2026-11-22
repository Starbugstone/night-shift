import type { Scene } from '../contracts';
import { VIEW_W } from '../contracts';
import type { AssetLoader } from '../core/assets';
import { LOADING_TIPS } from '../levels/humor';
import { outlinedText, panel, paragraph, roundRectPath, text } from './draw';
import { C } from './theme';
import { drawNightSky } from './widgets';

const MIN_TIME = 0.7;
const MAX_TIME = 8;

export class LoadingScene implements Scene {
  private t = 0;
  private shown = 0;
  private finished = false;
  private readonly tip = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]!;

  constructor(
    private readonly assets: AssetLoader,
    private readonly onReady: () => void,
    private readonly reduced: () => boolean,
  ) {}

  update(dt: number): void {
    this.t += dt;
    this.shown += (this.assets.progress - this.shown) * Math.min(1, dt * 10);
    if (!this.finished && ((this.assets.done && this.t >= MIN_TIME) || this.t >= MAX_TIME)) {
      this.finished = true;
      this.onReady();
    }
  }

  render(g: CanvasRenderingContext2D): void {
    drawNightSky(g, this.t, this.reduced());
    const bob = this.reduced() ? 0 : Math.sin(this.t * 3) * 8;
    // little saucer
    const cx = VIEW_W / 2;
    const cy = 360 + bob;
    g.fillStyle = 'rgba(124,255,203,0.16)';
    g.beginPath();
    g.moveTo(cx - 30, cy + 10);
    g.lineTo(cx + 30, cy + 10);
    g.lineTo(cx + 70, cy + 170);
    g.lineTo(cx - 70, cy + 170);
    g.fill();
    g.fillStyle = '#8fa6c8';
    g.beginPath();
    g.ellipse(cx, cy, 80, 22, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = C.ink;
    g.lineWidth = 4;
    g.stroke();
    g.fillStyle = C.mint;
    g.beginPath();
    g.ellipse(cx, cy - 12, 36, 26, 0, Math.PI, 0);
    g.fill();
    g.stroke();
    for (let i = 0; i < 5; i++) {
      const on = Math.floor(this.t * 6) % 5 === i;
      g.fillStyle = on ? C.amberHi : '#4d5d86';
      g.beginPath();
      g.arc(cx - 52 + i * 26, cy + 4, 5, 0, Math.PI * 2);
      g.fill();
    }

    outlinedText(g, 'Clocking in…', VIEW_W / 2, 600, 40, C.mint);
    const bw = 380;
    const bx = (VIEW_W - bw) / 2;
    roundRectPath(g, bx, 640, bw, 24, 12);
    g.fillStyle = C.night3;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = C.ink;
    g.stroke();
    roundRectPath(g, bx + 3, 643, Math.max(18, (bw - 6) * this.shown), 18, 9);
    g.fillStyle = C.mint;
    g.fill();
    text(g, `Calibrating tractor beam · ${Math.round(this.shown * 100)}%`, VIEW_W / 2, 690, 18, C.muted);

    panel(g, 50, 760, VIEW_W - 100, 110, 'rgba(42,33,96,0.92)', 20, C.ink, 3, 4);
    paragraph(g, this.tip, 74, 778, VIEW_W - 148, 21, C.text, 27, 'center', 600);
  }
}
