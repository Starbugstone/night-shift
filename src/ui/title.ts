import type { Scene } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { outlinedText, sprite, text } from './draw';
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

    // moon
    g.fillStyle = '#f6edc9';
    g.beginPath();
    g.arc(430, 130, 46, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#e4d9ae';
    g.beginPath();
    g.arc(415, 120, 9, 0, Math.PI * 2);
    g.arc(446, 146, 6, 0, Math.PI * 2);
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
    if (!sprite(g, ctx.assets, 'flight/saucer_top', sx, sy, 130, 130)) {
      g.fillStyle = '#9fb3d6';
      g.beginPath();
      g.ellipse(sx, sy, 84, 24, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = C.ink;
      g.lineWidth = 4;
      g.stroke();
      g.fillStyle = C.mint;
      g.beginPath();
      g.ellipse(sx, sy - 12, 38, 28, 0, Math.PI, 0);
      g.fill();
      g.stroke();
    }

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
