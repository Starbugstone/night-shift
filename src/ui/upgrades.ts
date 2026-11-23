import type { Scene } from '../contracts';
import { VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import type { UpgradeId } from '../contracts';
import { P_RING, P_STAR, P_TWINKLE, PC, Particles, easeOutBack } from '../core/fx';
import { UPGRADES, buyUpgrade, canBuy } from '../levels/progress';
import { drawGlorb, outlinedText, panel, panelHighlight, paragraph, roundRectPath, sprite, text, wrap } from './draw';
import { C } from './theme';
import { Button, drawNightSky } from './widgets';
import { fmt, tr } from '../i18n';

const CARD_Y = 192;
const CARD_H = 172;
const GAP = 12;
const BUY_W = 168;
/** Where each upgrade does its work, shown as a tag on its card. */
const WHERE: Record<UpgradeId, { label: 'whereRoom' | 'whereBoth' | 'whereFlight'; color: string }> = {
  beam_dampener: { label: 'whereRoom', color: '#c8a4ff' },
  hush_drive: { label: 'whereBoth', color: C.mint },
  afterburner: { label: 'whereFlight', color: C.amberHi },
  snooze_ray: { label: 'whereRoom', color: '#c8a4ff' },
};

export class UpgradesScene implements Scene {
  private t = 0;
  private readonly back = new Button(16, 18, 64, 60, '‹', 'ghost', 40);
  private readonly buys: Button[] = [];
  private bought = -1;
  private boughtT = 0;
  private readonly fx = new Particles(64);
  /** The purse counts down to the new balance instead of jumping. */
  private shown: number;
  private shownText = '';
  private shownFor = -1;

  constructor(private readonly shell: Shell) {
    this.shown = shell.save.glorbs;
    for (let i = 0; i < UPGRADES.length; i++) {
      this.buys.push(new Button(VIEW_W - 24 - 16 - BUY_W, CARD_Y + i * (CARD_H + GAP) + CARD_H - 64, BUY_W, 52, 'Buy', 'primary', 21));
    }
  }

  update(dt: number): void {
    this.t += dt;
    this.boughtT = Math.max(0, this.boughtT - dt);
    this.fx.update(dt);
    const target = this.shell.save.glorbs;
    if (this.shown !== target) {
      const step = Math.max(1, Math.ceil(Math.abs(target - this.shown) * dt * 6));
      this.shown += Math.sign(target - this.shown) * Math.min(step, Math.abs(target - this.shown));
    }
    const p = this.shell.ctx.pointer;
    if (this.back.update(p, dt, this.shell.audio)) return this.shell.toWorkOrders();
    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i]!;
      const b = this.buys[i]!;
      const owned = this.shell.save.upgrades.includes(u.id);
      b.visible = !owned;
      b.enabled = canBuy(this.shell.save, u.id);
      b.label = fmt(b.enabled ? tr().shop.buy : tr().shop.need, { price: u.price });
      if (b.update(p, dt, this.shell.audio)) {
        const next = buyUpgrade(this.shell.save, u.id);
        if (next) {
          this.shell.setSave(next);
          this.shell.audio.sfx('success');
          this.bought = i;
          this.boughtT = 1.2;
          // installed: a ring and a spray of stars off the button
          const cx = b.x + b.w / 2;
          const cy = b.y + b.h / 2;
          this.fx.spawn(P_RING, cx, cy, 0, 0, 0.5, 150, PC.mint);
          if (!this.shell.ctx.reducedMotion) {
            this.fx.burst(P_STAR, cx, cy, 7, 160, 340, 0.7, 12, PC.amber, 420, 1.2, -Math.PI / 2, Math.PI * 1.4);
            this.fx.burst(P_TWINKLE, cx, cy, 8, 60, 220, 0.7, 10, PC.mint, 0, 2);
          }
        }
      }
    }
  }

  render(g: CanvasRenderingContext2D): void {
    const { assets, save, ctx } = this.shell;
    drawNightSky(g, this.t, ctx.reducedMotion);
    this.back.render(g);
    const shop = tr().shop;
    outlinedText(g, shop.title, VIEW_W / 2 + 20, 48, 40, C.mint, C.ink, 900, 'center', VIEW_W - 150);
    text(g, shop.subtitle, VIEW_W / 2 + 20, 82, 17, C.muted, 'center', 600, true, VIEW_W - 150);
    panel(g, VIEW_W / 2 - 120, 112, 240, 64, C.panel, 32, C.ink, 3, 4);
    drawGlorb(g, assets, VIEW_W / 2 - 74, 144, 42);
    if (this.shownFor !== this.shown) {
      this.shownFor = this.shown;
      this.shownText = String(this.shown);
    }
    text(g, this.shownText, VIEW_W / 2 - 44, 145, 28, this.shown !== save.glorbs ? C.amberHi : C.mint, 'left', 900);
    const nw = g.measureText(this.shownText).width;
    text(g, tr().common.glorbs, VIEW_W / 2 - 34 + nw, 146, 18, C.muted, 'left', 700);

    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i]!;
      const y = CARD_Y + i * (CARD_H + GAP);
      const owned = save.upgrades.includes(u.id);
      const pop = this.bought === i && this.boughtT > 0 && !ctx.reducedMotion ? Math.sin((1.2 - this.boughtT) * 12) * 4 * this.boughtT : 0;
      panel(g, 24 - pop, y - pop, VIEW_W - 48 + pop * 2, CARD_H + pop * 2, owned ? '#22404a' : C.panel, 20, owned ? C.mint : C.ink, 4, 5);
      panelHighlight(g, 24 - pop, y - pop, VIEW_W - 48 + pop * 2, 20);
      // icon
      panel(g, 42, y + 16, 80, 80, C.night2, 16, C.ink, 3, 0);
      // what you can afford bobs gently; the rest sits still
      const bob = !owned && this.buys[i]!.enabled && !ctx.reducedMotion ? Math.sin(this.t * 3 + i) * 2.5 : 0;
      if (!sprite(g, assets, u.icon, 82, y + 56 + bob, 76, 76)) this.fallbackIcon(g, u.id, 82, y + 56 + bob);
      // where it works
      const where = WHERE[u.id];
      const whereLabel = shop[where.label];
      const ut = shop.upgrades[u.id];
      g.font = '900 11px system-ui, sans-serif';
      const ww = g.measureText(whereLabel).width + 16;
      roundRectPath(g, VIEW_W - 40 - ww, y + 12, ww, 20, 10);
      g.fillStyle = 'rgba(18,13,43,0.6)';
      g.fill();
      g.lineWidth = 1.5;
      g.strokeStyle = where.color;
      g.stroke();
      text(g, whereLabel, VIEW_W - 40 - ww / 2, y + 23, 11, where.color, 'center', 900);
      // the name stops short of the where-tag
      text(g, ut.name, 140, y + 44, 25, C.text, 'left', 900, false, VIEW_W - 40 - ww - 12 - 140);
      text(g, ut.effect, 140, y + 72, 16, C.mint, 'left', 800, false, VIEW_W - 190);
      // the blurb gets the card's width below the button's top edge; a long one steps down a size
      const descW = VIEW_W - 84 - BUY_W - 12;
      const descSize = wrap(g, ut.desc, descW, 14, 500, true).length <= 3 ? 14 : 12.5;
      paragraph(g, ut.desc, 42, y + 108, descW, descSize, C.muted, descSize === 14 ? 19 : 16, 'left', 500, true);
      if (owned) {
        g.save();
        g.translate(VIEW_W - 40 - BUY_W / 2, y + CARD_H - 38);
        g.rotate(-0.12);
        // the stamp comes down hard on a fresh purchase
        if (this.bought === i && this.boughtT > 0 && !ctx.reducedMotion) {
          const k = 2.2 - 1.2 * easeOutBack((1.2 - this.boughtT) / 0.22, 2.4);
          g.scale(k, k);
        }
        panel(g, -78, -22, 156, 44, 'rgba(0,0,0,0)', 10, C.mint, 4, 0);
        text(g, shop.installed, 0, 2, 21, C.mint, 'center', 900, false, 140);
        g.restore();
      }
      this.buys[i]!.render(g);
    }
    text(g, shop.salesFinal, VIEW_W / 2, 940, 15, 'rgba(169,162,214,0.7)', 'center', 600, true, VIEW_W - 40);
    this.fx.draw(g);
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
      text(g, tr().shop.snoozeIcon, cx, cy - 4, 30, C.mint, 'center', 900, true);
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
      text(g, tr().shop.hushIcon, cx + 14, cy - 32, 18, C.amberHi, 'center', 900, true);
    }
  }
}
