import type { Scene } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { outlinedText, sprite, text } from './draw';

/** Moon, top-left; the logo box spans y 130..330 and its built-in saucer sits top-right. */
export const MOON = { x: 92, y: 84, r: 40 };
import { C } from './theme';
import { Button, drawNightSky, drawSkyline, drawSpeaker } from './widgets';

const TAGLINES = [
  'One thumb. No witnesses.',
  'Now hiring: interns with steady thumbs.',
  'Abducting responsibly since 1947.',
  'Your specimen is our priority.',
];

export class TitleScene implements Scene {
  private t = 0;
  private readonly start = new Button(110, 640, 320, 92, 'Clock in', 'primary', 36);
  private readonly mute = new Button(VIEW_W - 92, VIEW_H - 92, 68, 68, '', 'ghost');
  private readonly tagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)]!;

  constructor(private readonly shell: Shell) {}

  update(dt: number): void {
    this.t += dt;
    const p = this.shell.ctx.pointer;
    if (this.mute.update(p, dt)) this.shell.toggleMute();
    if (this.start.update(p, dt, this.shell.audio)) this.shell.toWorkOrders();
  }

  render(g: CanvasRenderingContext2D): void {
    const { ctx } = this.shell;
    const rm = ctx.reducedMotion;
    drawNightSky(g, this.t, rm);

    // moon: top-left, clear of the logo's own saucer (top-right of the logo art)
    g.fillStyle = '#f6edc9';
    g.beginPath();
    g.arc(MOON.x, MOON.y, MOON.r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#e4d9ae';
    g.beginPath();
    g.arc(MOON.x - 13, MOON.y - 9, 8, 0, Math.PI * 2);
    g.arc(MOON.x + 14, MOON.y + 13, 5, 0, Math.PI * 2);
    g.fill();

    drawSkyline(g, this.t, VIEW_H);

    // saucer drifting over the town, beam flickering
    const sx = VIEW_W / 2 + (rm ? 0 : Math.sin(this.t * 0.6) * 120);
    const sy = 470 + (rm ? 0 : Math.sin(this.t * 2.1) * 10);
    const beam = 0.12 + 0.06 * Math.sin(this.t * 5);
    g.fillStyle = `rgba(124,255,203,${beam.toFixed(3)})`;
    g.beginPath();
    g.moveTo(sx - 26, sy + 16);
    g.lineTo(sx + 26, sy + 16);
    g.lineTo(sx + 90, VIEW_H - 120);
    g.lineTo(sx - 90, VIEW_H - 120);
    g.fill();
    // side-view saucer to match the side-view skyline (the flight sprite is top-down)
    drawSideSaucer(g, sx, sy, this.t, rm);

    // logo
    const ly = 230 + (rm ? 0 : Math.sin(this.t * 1.3) * 4);
    if (!sprite(g, ctx.assets, 'ui/logo', VIEW_W / 2, ly, 480, 200)) {
      outlinedText(g, 'NIGHT SHIFT', VIEW_W / 2, ly - 22, 76, C.mint, C.ink, 900);
      outlinedText(g, 'Abductions Dept.', VIEW_W / 2, ly + 46, 32, C.amberHi, C.ink, 800);
    }
    text(g, 'Galactic Census Bureau', VIEW_W / 2, 360, 20, C.muted, 'center', 700);
    text(g, this.tagline, VIEW_W / 2, 600, 21, C.text, 'center', 600, true);

    this.start.render(g);
    this.mute.render(g);
    drawSpeaker(g, this.mute.x + 30, this.mute.y + 34, this.shell.save.muted, C.text);
    text(g, 'v0.1 · night shift build', 24, VIEW_H - 30, 15, 'rgba(169,162,214,0.6)', 'left', 500);
  }
}

/** Side-on flying saucer: hull, rim lights, glass dome with Zib inside. */
function drawSideSaucer(g: CanvasRenderingContext2D, x: number, y: number, t: number, rm: boolean): void {
  g.lineJoin = 'round';
  // dome
  g.fillStyle = 'rgba(124,255,203,0.55)';
  g.beginPath();
  g.ellipse(x, y - 14, 36, 34, 0, Math.PI, 0);
  g.closePath();
  g.fill();
  // Zib peeking
  g.fillStyle = '#7fd27a';
  g.beginPath();
  g.ellipse(x, y - 30, 14, 13, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = C.ink;
  g.beginPath();
  g.ellipse(x - 5, y - 32, 3.5, 4.5, 0, 0, Math.PI * 2);
  g.ellipse(x + 5, y - 32, 3.5, 4.5, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = C.ink;
  g.lineWidth = 4;
  g.beginPath();
  g.ellipse(x, y - 14, 36, 34, 0, Math.PI, 0);
  g.stroke();
  // hull
  g.fillStyle = '#9fb3d6';
  g.beginPath();
  g.ellipse(x, y, 86, 24, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#7b8db3';
  g.beginPath();
  g.ellipse(x, y + 8, 70, 13, 0, 0, Math.PI);
  g.fill();
  g.beginPath();
  g.ellipse(x, y, 86, 24, 0, 0, Math.PI * 2);
  g.stroke();
  // rim lights chase round
  for (let i = 0; i < 7; i++) {
    const lx = x - 60 + i * 20;
    const on = rm ? i % 2 === 0 : Math.floor(t * 6 + i) % 3 === 0;
    g.fillStyle = on ? C.amberHi : '#4a4470';
    g.beginPath();
    g.arc(lx, y + 4 - Math.abs(i - 3) * 1.5, 5, 0, Math.PI * 2);
    g.fill();
  }
}
