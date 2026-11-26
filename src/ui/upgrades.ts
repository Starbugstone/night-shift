import { Container, Graphics } from 'pixi.js';
import type { Assets, Scene, UpgradeId } from '../contracts';
import { VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { P_RING, P_STAR, P_TWINKLE, PC, Particles, easeOutBack } from '../core/fx';
import { UPGRADES, buyUpgrade, canBuy } from '../levels/progress';
import { ParticleView } from '../core/gfx/particles';
import { ViewSlot, type SceneView } from '../core/gfx/scene';
import { Shape, ellipseArc, keyOf, panelPath, roundRect } from '../core/gfx/shapes';
import { Label, Paragraph, measure, wrapLines } from '../core/gfx/text';
import { C } from './theme';
import { Button } from './widgets';
import { artSprite } from './views/art';
import { NightSky } from './views/backdrop';
import { ButtonView } from './views/button';
import { glorbTexture, iconSprite } from './views/icons';
import { highlightedPanel } from './views/menu-decor';
import { fmt, tr } from '../i18n';

const CARD_Y = 192;
const CARD_H = 172;
const GAP = 12;
const BUY_W = 168;
/** Where each upgrade does its work, shown as a tag on its card. */
const WHERE: Record<UpgradeId, { label: 'whereRoom' | 'whereBoth' | 'whereFlight'; color: string }> = {
  beam_dampener: { label: 'whereRoom', color: '#c8a4ff' },
  hush_drive: { label: 'whereBoth', color: C.mint },
  snooze_ray: { label: 'whereRoom', color: '#c8a4ff' },
};

export class UpgradesScene implements Scene {
  t = 0;
  readonly back = new Button(16, 18, 64, 60, '‹', 'ghost', 40);
  readonly buys: Button[] = [];
  bought = -1;
  boughtT = 0;
  readonly fx = new Particles(64);
  /** The purse counts down to the new balance instead of jumping. */
  shown: number;
  private readonly look = new ViewSlot(() => new UpgradesView(this));
  private readonly buyLabels: { buy: string; need: string }[] = [];

  constructor(readonly shell: Shell) {
    this.shown = shell.save.glorbs;
    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i]!;
      this.buyLabels.push({ buy: fmt(tr().shop.buy, { price: u.price }), need: fmt(tr().shop.need, { price: u.price }) });
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
    if (this.back.update(p, dt)) return this.shell.toWorkOrders();
    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i]!;
      const b = this.buys[i]!;
      const owned = this.shell.save.upgrades.includes(u.id);
      b.visible = !owned;
      b.enabled = canBuy(this.shell.save, u.id);
      const labels = this.buyLabels[i]!;
      b.label = b.enabled ? labels.buy : labels.need;
      if (b.update(p, dt)) {
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

  get view(): Container {
    return this.look.get().root;
  }

  render(): void {
    this.look.peek()?.sync();
  }

  dispose(): void {
    this.look.destroy();
  }
}

const BALANCE = { size: 28, color: C.mint, align: 'left', weight: 900 } as const;
const COUNTING = { ...BALANCE, color: C.amberHi } as const;
const SHOP_NORMAL = { fill: C.panel, r: 20, shadow: 5 } as const;
const SHOP_OWNED = { ...SHOP_NORMAL, fill: '#22404a', stroke: C.mint } as const;

class UpgradesView implements SceneView {
  readonly root = new Container();
  private readonly sky = new NightSky();
  private readonly back: ButtonView;
  private readonly cards: UpgradeCard[];
  private readonly balance = new Label(BALANCE);
  private readonly units = new Label({ size: 18, color: C.muted, align: 'left', weight: 700 });
  private readonly unitText = tr().common.glorbs;
  private shownFor = -1;
  private readonly particles: ParticleView;

  constructor(private readonly s: UpgradesScene) {
    const shop = tr().shop;
    const { assets } = s.shell;
    this.back = new ButtonView(s.back);
    const glorb = iconSprite(glorbTexture(assets, 42), 42);
    glorb.position.set(VIEW_W / 2 - 74, 144);
    this.root.addChild(
      this.sky,
      this.back,
      new Label({ size: 40, weight: 900, color: C.mint, outline: C.ink }).set(shop.title, VIEW_W / 2 + 20, 48, VIEW_W - 150),
      new Label({ size: 17, color: C.muted, italic: true }).set(shop.subtitle, VIEW_W / 2 + 20, 82, VIEW_W - 150),
      panelPath(new Graphics(), VIEW_W / 2 - 120, 112, 240, 64, { fill: C.panel, r: 32, lineW: 3, shadow: 4 }),
      glorb, this.balance, this.units,
    );
    this.cards = UPGRADES.map((u, i) => new UpgradeCard(assets, u, s.buys[i]!, i));
    for (const card of this.cards) this.root.addChild(card.root);
    this.particles = new ParticleView(s.fx);
    this.root.addChild(
      new Label({ size: 15, color: 'rgba(169,162,214,0.7)', italic: true }).set(shop.salesFinal, VIEW_W / 2, 940, VIEW_W - 40),
      this.particles,
    );
  }

  sync(): void {
    const s = this.s;
    const reduced = s.shell.ctx.reducedMotion;
    const save = s.shell.save;
    this.sky.sync(s.t, reduced);
    this.back.sync();
    this.balance.restyle(s.shown === save.glorbs ? BALANCE : COUNTING);
    if (this.shownFor !== s.shown) {
      this.shownFor = s.shown;
      const text = String(s.shown);
      this.balance.set(text, VIEW_W / 2 - 44, 145);
      this.units.set(this.unitText, VIEW_W / 2 - 34 + measure(text, 28, 900), 146);
    }
    for (let i = 0; i < this.cards.length; i++) {
      this.cards[i]!.sync(save.upgrades.includes(UPGRADES[i]!.id), s.t, s.bought === i ? s.boughtT : 0, reduced);
    }
    this.particles.sync();
  }
}

class UpgradeCard {
  readonly root = new Container();
  private readonly frame = new Shape();
  private readonly icon: Container;
  private readonly installed = new Container();
  private readonly installedText = new Label({ size: 21, color: C.mint, weight: 900 });
  private readonly buy: ButtonView;
  private pop = 0;
  private owned = false;

  constructor(assets: Assets, u: typeof UPGRADES[number], private readonly button: Button, private readonly index: number) {
    const y = CARD_Y + index * (CARD_H + GAP);
    this.root.position.set(0, y);
    const shop = tr().shop;
    const where = WHERE[u.id];
    const whereLabel = shop[where.label];
    const ut = shop.upgrades[u.id];
    const ww = measure(whereLabel, 11, 900) + 16;
    const descW = VIEW_W - 84 - BUY_W - 12;
    const size = wrapLines(ut.desc, descW, 14, 500, true).length <= 3 ? 14 : 12.5;
    const desc = new Paragraph({ size, color: C.muted, align: 'left', weight: 500, italic: true, lineHeight: size === 14 ? 19 : 16 });
    desc.setBlock(ut.desc, 42, 108, descW);
    this.icon = artSprite(assets, u.icon, 76, 76) ?? fallbackIcon(u.id);
    this.icon.x = 82;
    this.redrawFrame();

    this.installed.position.set(VIEW_W - 40 - BUY_W / 2, CARD_H - 38);
    this.installed.rotation = -0.12;
    this.installed.addChild(
      roundRect(new Graphics(), -78, -22, 156, 44, 10).stroke({ color: C.mint, width: 4 }),
      this.installedText.set(shop.installed, 0, 2, 140),
    );
    this.buy = new ButtonView(button);
    this.buy.y = -y; // Button retains its screen-space hitbox.
    this.root.addChild(
      this.frame,
      panelPath(new Graphics(), 42, 16, 80, 80, { fill: C.night2, r: 16, lineW: 3, shadow: 0 }),
      this.icon,
      roundRect(new Graphics(), VIEW_W - 40 - ww, 12, ww, 20, 10).fill('rgba(18,13,43,0.6)').stroke({ color: where.color, width: 1.5 }),
      new Label({ size: 11, color: where.color, weight: 900 }).set(whereLabel, VIEW_W - 40 - ww / 2, 23),
      new Label({ size: 25, color: C.text, align: 'left', weight: 900 }).set(ut.name, 140, 44, VIEW_W - 40 - ww - 12 - 140),
      new Label({ size: 16, color: C.mint, align: 'left', weight: 800 }).set(ut.effect, 140, 72, VIEW_W - 190),
      desc, this.installed, this.buy,
    );
  }

  private readonly paintFrame = (g: Graphics): void => {
    const pop = this.pop;
    highlightedPanel(g, 24 - pop, -pop, VIEW_W - 48 + pop * 2, CARD_H + pop * 2, this.owned ? SHOP_OWNED : SHOP_NORMAL);
  };

  private redrawFrame(): void {
    this.frame.draw(keyOf(this.pop, Number(this.owned)), this.paintFrame);
  }

  sync(owned: boolean, t: number, boughtT: number, reduced: boolean): void {
    const animate = boughtT > 0 && !reduced;
    this.owned = owned;
    this.pop = animate ? Math.sin((1.2 - boughtT) * 12) * 4 * boughtT : 0;
    this.redrawFrame();
    this.icon.y = 56 + (!owned && this.button.enabled && !reduced ? Math.sin(t * 3 + this.index) * 2.5 : 0);
    this.installed.visible = owned;
    this.installed.scale.set(animate ? 2.2 - 1.2 * easeOutBack((1.2 - boughtT) / 0.22, 2.4) : 1);
    this.buy.sync();
    this.buy.visible = !owned;
  }
}

function fallbackIcon(id: UpgradeId): Container {
  const icon = new Container();
  const g = new Graphics();
  icon.addChild(g);
  if (id === 'beam_dampener') {
    g.poly([-14, -30, 14, -30, 34, 34, -34, 34]).fill('rgba(124,255,203,0.35)');
    for (let k = 0; k < 4; k++) {
      const y = -18 + k * 14;
      g.moveTo(-20, y).quadraticCurveTo(0, y + 6, 20, y);
    }
    g.stroke({ color: C.mint, width: 4 });
  } else if (id === 'snooze_ray') {
    g.arc(0, 4, 26, 0.2, Math.PI - 0.2).stroke({ color: C.mint, width: 3 });
    icon.addChild(new Label({ size: 30, color: C.mint, weight: 900, italic: true }).set(tr().shop.snoozeIcon, 0, -4));
  } else {
    g.ellipse(0, 0, 38, 14).fill('#9fb3d6').stroke({ color: C.ink, width: 4 });
    ellipseArc(g, 0, -8, 18, 14, Math.PI, 0).closePath().fill(C.mint);
    icon.addChild(new Label({ size: 18, color: C.amberHi, weight: 900, italic: true }).set(tr().shop.hushIcon, 14, -32));
  }
  return icon;
}
