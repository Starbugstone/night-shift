import { Container, Graphics } from 'pixi.js';
import type { Assets, Vec2 } from '../../contracts';
import { VIEW_H, VIEW_W } from '../../contracts';
import { GLOW, glowTexture, Glow, ScreenTint } from '../../core/gfx/glow';
import { Shape, keyOf, panelPath } from '../../core/gfx/shapes';
import { Label, Paragraph, measure } from '../../core/gfx/text';
import { tr } from '../../i18n';
import { clamp, drawPortrait, isBlinking } from '../../ui/draw';
import { C } from '../../ui/theme';
import { artSprite } from '../../ui/views/art';
import { HudPanel } from '../../ui/views/hud';
import { dashedArc } from './tells';
import { plate, paintedSprite, TAU } from './world';

const ZIB = { size: 19, color: C.paperInk, align: 'left', weight: 700, lineHeight: 24 } as const;
const ARROW = { size: 15, color: C.mint, weight: 800 } as const;
const DEEP_ARROW = { ...ARROW, italic: true } as const;
const LETTER = { size: 26, color: '#ffe6f7', outline: '#ff4fc8', weight: 900 } as const;
const LETTER_OFF = { ...LETTER, color: '#5a3a5a', outline: undefined } as const;
const LETTER_BUZZ = { ...LETTER_OFF, color: '#8a4a80' } as const;
const SIGN = { ...LETTER, size: 24 } as const;
const SIGN_OFF = { ...SIGN, color: '#6a3a60', outline: undefined } as const;

export class FlightTintView {
  readonly worldWash = plate('#0a0828');
  readonly root = new Container();
  private readonly dawnWash = ScreenTint.wash(GLOW.dawn, 0.05, 1, 0.95, 0);
  readonly dawnDecor = new Container();
  private readonly vignette = ScreenTint.vignette();
  private readonly redEdge = ScreenTint.edge(GLOW.red);
  private readonly warmEdge = ScreenTint.edge(GLOW.warm);
  private readonly mintEdge = ScreenTint.edge(GLOW.mint);
  private readonly flash = plate('#d9fff0');

  constructor(private readonly deep: boolean) {
    this.root.addChild(this.dawnWash, this.dawnDecor, this.vignette, this.redEdge, this.warmEdge, this.mintEdge, this.flash);
  }

  /** Keep the wash covering the viewport while it draws between world layers. */
  placeWorldWash(world: Container): void {
    const z = world.scale.x;
    this.worldWash.position.set(-world.x / z, -world.y / z);
    this.worldWash.width = VIEW_W / z;
    this.worldWash.height = VIEW_H / z;
  }

  sync(dawn: number, flying: boolean, exposed: boolean, sus: number, locking: boolean, lock: number, st: number, t: number, rm: boolean): void {
    this.worldWash.strength = this.deep ? 0.3 - dawn * 0.2 : 0.26;
    this.dawnWash.strength = dawn * 0.62;
    this.vignette.strength = 0.9 - dawn * 0.35;
    const pulse = rm ? 0.6 : 0.45 + 0.55 * Math.abs(Math.sin(t * (8 + sus * 14)));
    this.redEdge.strength = !flying ? 0 : exposed ? (0.45 + sus * 0.6) * pulse : sus > 0.05 ? sus * 0.35 : 0;
    this.warmEdge.strength = dawn * 0.7;
    this.mintEdge.strength = locking ? lock * 0.8 : 0;
    this.flash.strength = locking && st < 0.16 ? (1 - st / 0.16) * (rm ? 0.12 : 0.3) : 0;
  }
}

export class ZibBubble {
  readonly root = new Container();
  private readonly card = new Shape();
  private readonly words = new Paragraph(ZIB);
  private readonly portrait: Container;
  private readonly blink: Container;
  private readonly panic: Container | null;
  private message = '';
  private height = 64;

  constructor(assets: Assets) {
    this.portrait = paintedSprite('zib-portrait', 90, 90, (g) => drawPortrait(g, assets, 'zib', 0, 0, 84, 0, false));
    this.blink = paintedSprite('zib-blink', 90, 90, (g) => drawPortrait(g, assets, 'zib', 0, 0, 84, 2.6, true));
    this.panic = artSprite(assets, 'ui/zib_panic', 84, 84);
    this.root.addChild(this.card, this.words, this.portrait, this.blink);
    if (this.panic) this.root.addChild(this.panic);
    this.portrait.position.set(58, VIEW_H - 66);
    this.blink.position.copyFrom(this.portrait.position);
    this.panic?.position.copyFrom(this.portrait.position);
  }

  sync(msg: string, time: number, t: number, rm: boolean, panic = false): void {
    this.root.visible = time > 0;
    if (!this.root.visible) return;
    const a = clamp(Math.min(time * 4, (2.8 - time) * 6), 0, 1);
    this.root.alpha = a;
    this.root.y = rm ? 0 : (1 - a) * 30;
    if (msg !== this.message) {
      this.message = msg;
      this.height = Math.max(64, 24 + this.words.setBlock(msg, 128, 0, 340));
      const y = VIEW_H - 28 - this.height;
      this.words.y = y + 12;
      this.card.draw(keyOf(this.height), (g) => panelPath(g, 112, y, VIEW_W - 136, this.height,
        { fill: C.paper, r: 18, lineW: 3, shadow: 0 }).poly([114, y + this.height - 26, 96, y + this.height - 12, 116, y + this.height - 10]).fill(C.paper));
    }
    const closed = !rm && isBlinking(t, 1.7);
    const alarm = panic && !!this.panic;
    // blink with alpha: a visible flip rebuilds the render group
    this.portrait.alpha = !alarm && !closed ? 1 : 0;
    this.blink.alpha = !alarm && closed ? 1 : 0;
    if (this.panic) this.panic.alpha = alarm ? 1 : 0;
  }
}

export class TargetArrow {
  readonly root = new Container();
  private readonly marker = new Container();
  private readonly words: Label;

  constructor(assets: Assets, word: string, art = true) {
    const sprite = art ? artSprite(assets, 'ui/target_marker', 48, 48) : null;
    if (sprite) sprite.rotation = Math.PI / 2;
    this.marker.addChild(sprite ?? new Graphics().poly([22, 0, -12, -18, -4, 0, -12, 18]).fill(C.mint).stroke({ color: C.ink, width: 3 }));
    this.words = new Label(art ? DEEP_ARROW : ARROW, word);
    this.root.addChild(this.marker, this.words);
  }

  sync(p: Vec2, cx: number, cy: number, t: number, rm: boolean, top: number, bottom: number): void {
    const tx = p.x - cx;
    const ty = p.y - cy;
    const ang = Math.atan2(ty - VIEW_H / 2, tx - VIEW_W / 2);
    const ux = Math.cos(ang);
    const uy = Math.sin(ang);
    const x = clamp(VIEW_W / 2 + ux * 400, 40, VIEW_W - 40);
    const y = clamp(VIEW_H / 2 + uy * 600, top, VIEW_H - bottom);
    const bounce = rm ? 0 : Math.sin(t * 6) * 5;
    this.marker.position.set(x + ux * bounce, y + uy * bounce);
    this.marker.rotation = ang;
    this.words.position.set(x, y + (uy < 0 ? 34 : -34));
  }
}

export class FlightBanner {
  readonly root = new Container();
  readonly card = new HudPanel();

  constructor(y: number, height: number, ...lines: Label[]) {
    this.card.set(VIEW_W - 120, height, C.mint);
    this.card.position.set(60, y);
    this.root.addChild(this.card, ...lines);
  }
}

export class NeonView {
  readonly root = new Container();
  readonly glow: Glow;
  private readonly border: Graphics;
  private readonly glyphs: Label[] = [];
  private readonly lights: Glow[] = [];

  constructor(assets: Assets, x: number, y: number, radius: number, private readonly word: string, private readonly deep: boolean) {
    this.root.position.set(x, y);
    this.glow = new Glow(glowTexture(GLOW.pink), true).place(x, y, radius);
    this.border = deep
      ? dashedArc(new Graphics(), radius, 0, TAU, 3, 9).stroke({ color: '#ff6ed2', width: 2 })
      : new Graphics().roundRect(-41, -18, 82, 36, 8).stroke({ color: '#ffffff', width: 2 });
    const w = deep ? 220 : 96;
    const card = (deep ? artSprite(assets, 'flight/billboard_top', 220, 50) : null) ??
      panelPath(new Graphics(), -w / 2, -25, w, 50, { fill: '#22102a', r: deep ? 10 : 12, lineW: 3, shadow: deep ? 3 : 4 });
    if (deep) this.root.addChild(this.border, card);
    else this.root.addChild(card, this.border);
    if (deep) {
      const label = new Label(SIGN).set(word, 0, 1, 200);
      this.glyphs.push(label);
      this.root.addChild(label);
    } else {
      const widths = Array.from(word, (char) => measure(char, 26, 900) + 3);
      let x = -widths.reduce((sum, width) => sum + width, 0) / 2;
      for (let i = 0; i < word.length; i++) {
        const width = widths[i]!;
        const cx = x + width / 2;
        const label = new Label(LETTER).set(word[i]!, cx, 1);
        const light = new Glow(glowTexture(GLOW.pink), true).place(cx, 0, 24, 24, 0.5);
        this.glyphs.push(label);
        this.lights.push(light);
        this.root.addChild(light, label);
        x += width;
      }
    }
  }

  sync(on: boolean, t: number, rm: boolean): void {
    this.glow.alpha = this.deep ? on ? 0.55 : 0.12 : on ? 0.5 : 0.125;
    if (this.deep) {
      this.border.alpha = on ? 0.6 : 0.2;
      this.glyphs[0]!.restyle(on && (rm || Math.sin(t * 63) <= 0.6) ? SIGN : SIGN_OFF).set(this.word, 0, 1, 200);
      return;
    }
    this.border.tint = on ? '#ff7ad9' : '#4b2f4d';
    const buzz = rm ? -1 : Math.floor(t * 0.8) % (this.word.length + 2);
    for (let i = 0; i < this.glyphs.length; i++) {
      const lit = on && !(i === buzz && Math.sin(t * 63) > 0.15);
      this.lights[i]!.visible = lit;
      this.glyphs[i]!.restyle(lit ? LETTER : on ? LETTER_BUZZ : LETTER_OFF);
    }
  }
}

export class WireView {
  readonly root = new Container();
  private readonly burn = new Graphics();

  constructor(ax: number, ay: number, bx: number, by: number, gap: number, sag: number, tram = false) {
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    const wire = new Graphics();
    for (let pass = 0; pass < 2; pass++) {
      const lift = pass === 0 ? 0 : -1.2;
      const which = pass === 0 ? '#0b0818' : tram ? 'rgba(255,220,160,0.55)' : 'rgba(176,186,255,0.5)';
      for (let k = -1; k <= 1; k += 2) {
        const ox = nx * k * gap + lift;
        const oy = ny * k * gap + lift;
        const mx = (ax + bx) / 2 + ox;
        const my = (ay + by) / 2 + sag + oy;
        wire.moveTo(ax + ox, ay + oy).quadraticCurveTo(mx, my, bx + ox, by + oy)
          .stroke({ color: which, width: pass === 0 ? tram ? 4 : 3 : 1 });
        this.burn.moveTo(ax + ox, ay + oy).quadraticCurveTo(mx, my, bx + ox, by + oy)
          .stroke({ color: '#fff096', width: pass === 0 ? tram ? 4 : 3 : 1 });
      }
    }
    this.root.addChild(wire, this.burn);
  }

  sync(value: number): void {
    this.burn.visible = value > 0;
    this.burn.alpha = 0.5 + value * 0.5;
  }
}

export function tick(g: Graphics, x: number, y: number, r: number): Graphics {
  return g.moveTo(x - r, y).lineTo(x - r * 0.25, y + r * 0.65).lineTo(x + r, y - r * 0.65)
    .stroke({ color: C.ink, width: 5, cap: 'round', join: 'round' })
    .moveTo(x - r, y).lineTo(x - r * 0.25, y + r * 0.65).lineTo(x + r, y - r * 0.65)
    .stroke({ color: C.mint, width: 2.5, cap: 'round', join: 'round' });
}

export const WOOF = { size: 26, color: C.amberHi, weight: 900, outline: C.ink } as const;
export function woof(): Label {
  return new Label(WOOF, tr().flight.woof);
}
