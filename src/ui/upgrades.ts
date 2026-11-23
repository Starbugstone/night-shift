import type { Scene } from '../contracts';
import { VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { UPGRADES, buyUpgrade, canBuy } from '../levels/progress';
import { drawGlorb, outlinedText, panel, panelHighlight, paragraph, sprite, text } from './draw';
import { C } from './theme';
import { Button, drawNightSky } from './widgets';

const CARD_Y = 192;
const CARD_H = 172;
const GAP = 12;
const BUY_W = 168;

export class UpgradesScene implements Scene {
  private t = 0;
  private readonly back = new Button(16, 18, 64, 60, '‹', 'ghost', 40);
  private readonly buys: Button[] = [];
  private bought = -1;
  private boughtT = 0;

  constructor(private readonly shell: Shell) {
    for (let i = 0; i < UPGRADES.length; i++) {
      this.buys.push(new Button(VIEW_W - 24 - 16 - BUY_W, CARD_Y + i * (CARD_H + GAP) + CARD_H - 64, BUY_W, 52, 'Buy', 'primary', 21));
    }
  }

  update(dt: number): void {
    this.t += dt;
    this.boughtT = Math.max(0, this.boughtT - dt);
    const p = this.shell.ctx.pointer;
    if (this.back.update(p, dt, this.shell.audio)) return this.shell.toWorkOrders();
    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i]!;
      const b = this.buys[i]!;
      const owned = this.shell.save.upgrades.includes(u.id);
      b.visible = !owned;
      b.enabled = canBuy(this.shell.save, u.id);
      b.label = b.enabled ? `Buy · ${u.price}` : `Need ${u.price}`;
      if (b.update(p, dt, this.shell.audio)) {
        const next = buyUpgrade(this.shell.save, u.id);
        if (next) {
          this.shell.setSave(next);
          this.shell.audio.sfx('success');
          this.bought = i;
          this.boughtT = 1.2;
        }
      }
    }
  }

  render(g: CanvasRenderingContext2D): void {
    const { assets, save, ctx } = this.shell;
    drawNightSky(g, this.t, ctx.reducedMotion);
    this.back.render(g);
    outlinedText(g, 'BEAM SHOP', VIEW_W / 2 + 20, 48, 40, C.mint);
    text(g, 'Supplies for the discerning abductor', VIEW_W / 2 + 20, 82, 17, C.muted, 'center', 600, true);
    panel(g, VIEW_W / 2 - 120, 112, 240, 64, C.panel, 32, C.ink, 3, 4);
    drawGlorb(g, assets, VIEW_W / 2 - 74, 144, 42);
    text(g, `${save.glorbs}`, VIEW_W / 2 - 44, 145, 28, C.mint, 'left', 900);
    const nw = g.measureText(`${save.glorbs}`).width;
    text(g, 'Glorbs', VIEW_W / 2 - 34 + nw, 146, 18, C.muted, 'left', 700);

    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i]!;
      const y = CARD_Y + i * (CARD_H + GAP);
      const owned = save.upgrades.includes(u.id);
      const pop = this.bought === i && this.boughtT > 0 && !ctx.reducedMotion ? Math.sin((1.2 - this.boughtT) * 12) * 4 * this.boughtT : 0;
      panel(g, 24 - pop, y - pop, VIEW_W - 48 + pop * 2, CARD_H + pop * 2, owned ? '#22404a' : C.panel, 20, owned ? C.mint : C.ink, 4, 5);
      panelHighlight(g, 24 - pop, y - pop, VIEW_W - 48 + pop * 2, 20);
      // icon
      panel(g, 42, y + 16, 80, 80, C.night2, 16, C.ink, 3, 0);
      if (!sprite(g, assets, u.icon, 82, y + 56, 76, 76)) this.fallbackIcon(g, u.id, 82, y + 56);
      text(g, u.name, 140, y + 36, 25, C.text, 'left', 900);
      text(g, u.effect, 140, y + 66, 16, C.mint, 'left', 800, false, VIEW_W - 190);
      paragraph(g, u.desc, 42, y + 108, VIEW_W - 84 - BUY_W - 12, 14, C.muted, 19, 'left', 500, true);
      if (owned) {
        g.save();
        g.translate(VIEW_W - 40 - BUY_W / 2, y + CARD_H - 38);
        g.rotate(-0.12);
        panel(g, -78, -22, 156, 44, 'rgba(0,0,0,0)', 10, C.mint, 4, 0);
        text(g, 'INSTALLED', 0, 2, 21, C.mint, 'center', 900);
        g.restore();
      }
      this.buys[i]!.render(g);
    }
    text(g, 'All sales final. Refunds are a human concept.', VIEW_W / 2, 940, 15, 'rgba(169,162,214,0.7)', 'center', 600, true);
  }

  private fallbackIcon(g: CanvasRenderingContext2D, id: string, cx: number, cy: number): void {
    g.lineWidth = 4;
    g.strokeStyle = C.ink;
    if (id === 'beam_dampener') {
      g.fillStyle = 'rgba(124,255,203,0.35)';
      g.beginPath();
      g.moveTo(cx - 14, cy - 30);
      g.lineTo(cx + 14, cy - 30);
      g.lineTo(cx + 34, cy + 34);
      g.lineTo(cx - 34, cy + 34);
      g.fill();
      g.strokeStyle = C.mint;
      g.beginPath();
      for (let k = 0; k < 4; k++) {
        const yy = cy - 18 + k * 14;
        g.moveTo(cx - 20, yy);
        g.quadraticCurveTo(cx, yy + 6, cx + 20, yy);
      }
      g.stroke();
    } else if (id === 'afterburner') {
      g.fillStyle = '#9fb3d6';
      g.beginPath();
      g.ellipse(cx + 8, cy, 30, 12, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.strokeStyle = C.amber;
      g.lineWidth = 5;
      g.lineCap = 'round';
      for (let k = -1; k <= 1; k++) {
        g.beginPath();
        g.moveTo(cx - 26, cy + k * 9);
        g.lineTo(cx - 40 - Math.abs(k) * -6, cy + k * 9);
        g.stroke();
      }
      g.lineCap = 'butt';
    } else if (id === 'snooze_ray') {
      text(g, 'Zz', cx, cy - 4, 30, C.mint, 'center', 900, true);
      g.strokeStyle = C.mint;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(cx, cy + 4, 26, 0.2, Math.PI - 0.2);
      g.stroke();
    } else {
      g.fillStyle = '#9fb3d6';
      g.beginPath();
      g.ellipse(cx, cy, 38, 14, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = C.mint;
      g.beginPath();
      g.ellipse(cx, cy - 8, 18, 14, 0, Math.PI, 0);
      g.fill();
      text(g, 'shh', cx + 14, cy - 32, 18, C.amberHi, 'center', 900, true);
    }
  }
}
