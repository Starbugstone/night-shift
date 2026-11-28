import { Container, Graphics } from 'pixi.js';
import type { Box } from './clear-of';
import type { Assets, Vec2 } from '../../contracts';
import { VIEW_H, VIEW_W } from '../../contracts';
import { GLOW, glowTexture, Glow, ScreenTint } from '../../core/gfx/glow';
import { Shape, batched, keyOf, panelPath } from '../../core/gfx/shapes';
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

/** Display label of Zib's speech bubble (tests/flight-pill-view.test.ts keeps route pills from under it). */
export const ZIB_BUBBLE = 'zib-bubble';

/** Height of Zib's speech card with one line (it grows with longer lines). */
const CARD_MIN_H = 64;

export class ZibBubble {
  readonly root = new Container({ label: ZIB_BUBBLE });
  private readonly card = new Shape();
  private readonly words = new Paragraph(ZIB);
  private readonly portrait: Container;
  private readonly blink: Container;
  private readonly panic: Container | null;
  private message = '';
  private height = CARD_MIN_H;

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

  /** `time` counts down from `total` (the line's reading time, scene.zibFor). */
  sync(msg: string, time: number, t: number, rm: boolean, panic = false, total = 2.8): void {
    this.root.visible = time > 0;
    if (!this.root.visible) return;
    const a = clamp(Math.min(time * 4, (total - time) * 6), 0, 1);
    this.root.alpha = a;
    this.root.y = rm ? 0 : (1 - a) * 30;
    this.layout(msg);
    const closed = !rm && isBlinking(t, 1.7);
    const alarm = panic && !!this.panic;
    // blink with alpha: a visible flip rebuilds the render group
    this.portrait.alpha = !alarm && !closed ? 1 : 0;
    this.blink.alpha = !alarm && closed ? 1 : 0;
    if (this.panic) this.panic.alpha = alarm ? 1 : 0;
  }

  private layout(msg: string): void {
    if (msg === this.message) return;
    this.message = msg;
    this.height = Math.max(CARD_MIN_H, 24 + this.words.setBlock(msg, 128, 0, 340));
    const y = VIEW_H - 28 - this.height;
    this.words.y = y + 12;
    this.card.draw(keyOf(this.height), (g) => panelPath(g, 112, y, VIEW_W - 136, this.height,
      { fill: C.paper, r: 18, lineW: 3, shadow: 0 }).poly([114, y + this.height - 26, 96, y + this.height - 12, 116, y + this.height - 10]).fill(C.paper));
  }

  /**
   * v0.2 council round 6 (item 5): while a line shows (`time` > 0, as passed to `sync`), the screen box of the portrait
   * and the card with 4 px of air, down to the bottom edge (it slides up as it fades in), written into `out`. Route pills
   * draw under the HUD, so they keep out of it (DeepFlightView): never a sliver of pill beside the portrait.
   */
  avoid(out: Box, msg: string, time: number): boolean {
    if (time <= 0) return false;
    this.layout(msg);
    this.box(out, this.height);
    return true;
  }

  /**
   * Round 7 (Fable finding 3): the least box `avoid` gives (a one-line card), where Zib's bubble may show from any frame
   * on. A new route pill must not drift into it before its hold is over (`EntryLabels.speech`).
   */
  zone(out: Box): void {
    this.box(out, CARD_MIN_H);
  }

  private box(out: Box, height: number): void {
    out.x = this.portrait.x - 45 - 4;
    out.y = Math.min(this.portrait.y - 45, VIEW_H - 28 - height) - 4;
    out.w = VIEW_W - 24 + 4 - out.x;
    out.h = VIEW_H - out.y;
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

/** How long one spark crackles on a power line (s). */
const SPARK_LEN = 0.4;

/** One crackle of sparks: a soft glow and a burst of zig-zag rays, built once and only moved. */
class WireSpark {
  readonly root = new Container();
  readonly crackle = batched(new Graphics());
  on = false;

  constructor(tram: boolean, readonly seed: number, readonly period: number) {
    for (let pass = 0; pass < 2; pass++) {
      for (let r = 0; r < 6; r++) {
        const a = (r / 6) * TAU + 0.3;
        const l = 15 + (r % 3) * 5;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        this.crackle.moveTo(ca * 3, sa * 3)
          .lineTo(ca * l * 0.4 - sa * 5, sa * l * 0.4 + ca * 5)
          .lineTo(ca * l * 0.7 + sa * 4, sa * l * 0.7 - ca * 4)
          .lineTo(ca * l, sa * l);
      }
      this.crackle.stroke(pass === 0 ? { color: tram ? 'rgba(255,210,140,0.75)' : 'rgba(130,175,255,0.8)', width: 4.5 } : { color: '#ffffff', width: 2 });
    }
    this.root.addChild(new Glow(glowTexture(tram ? GLOW.lamp : GLOW.cold)).place(0, 0, 30, 30, 1), this.crackle);
    this.root.visible = false;
  }
}

/**
 * A power line (or tram wire): two sagging wires over a cold glow band so they read on the night
 * map, a yellow burn when the saucer hits it, and frequent crackles of sparks at random points
 * along the sag, so players see at a glance that the line is live and solid.
 */
export class WireView {
  readonly root = new Container();
  private readonly burn = new Graphics();
  private readonly spark: WireSpark[] = [];
  private readonly ax: number;
  private readonly ay: number;
  private readonly bx: number;
  private readonly by: number;
  private readonly mx: number;
  private readonly my: number;

  constructor(ax: number, ay: number, bx: number, by: number, gap: number, sag: number, tram = false, sparks = true) {
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    this.ax = ax;
    this.ay = ay;
    this.bx = bx;
    this.by = by;
    this.mx = (ax + bx) / 2;
    this.my = (ay + by) / 2 + sag;
    const halo = new Graphics().moveTo(ax, ay).quadraticCurveTo(this.mx, this.my, bx, by)
      .stroke({ color: tram ? 'rgba(255,220,160,0.22)' : 'rgba(150,190,255,0.28)', width: gap * 2 + 14 })
      .moveTo(ax, ay).quadraticCurveTo(this.mx, this.my, bx, by)
      .stroke({ color: tram ? 'rgba(255,220,160,0.22)' : 'rgba(150,190,255,0.3)', width: gap * 2 + 5 });
    const wire = new Graphics();
    for (let pass = 0; pass < 2; pass++) {
      const lift = pass === 0 ? 0 : -1.2;
      const which = pass === 0 ? '#0b0818' : tram ? 'rgba(255,225,170,0.9)' : 'rgba(205,222,255,0.95)';
      for (let k = -1; k <= 1; k += 2) {
        const ox = nx * k * gap + lift;
        const oy = ny * k * gap + lift;
        const mx = this.mx + ox;
        const my = this.my + oy;
        wire.moveTo(ax + ox, ay + oy).quadraticCurveTo(mx, my, bx + ox, by + oy)
          .stroke({ color: which, width: pass === 0 ? tram ? 4 : 3 : 1.8 });
        this.burn.moveTo(ax + ox, ay + oy).quadraticCurveTo(mx, my, bx + ox, by + oy)
          .stroke({ color: '#fff096', width: pass === 0 ? tram ? 4 : 3 : 1 });
      }
    }
    this.root.addChild(halo, wire, this.burn);
    if (sparks) {
      // one spark slot per ~220 px of line, each on its own rhythm
      const slots = Math.min(3, Math.max(1, Math.round(len / 220)));
      for (let i = 0; i < slots; i++) {
        const seed = Math.abs(Math.sin(ax * 12.9898 + ay * 78.233 + bx * 37.719 + by * 4.581 + i * 19.19) * 43758.5453) % 1;
        const spark = new WireSpark(tram, seed, 0.8 + seed * 0.8);
        this.spark.push(spark);
        this.root.addChild(spark.root);
      }
    }
  }

  sync(value: number, t = 0, rm = true): void {
    this.burn.visible = value > 0;
    this.burn.alpha = 0.5 + value * 0.5;
    for (const sp of this.spark) {
      let on = false;
      let local = 0;
      let cycle = 0;
      if (!rm) {
        const time = t + sp.seed * sp.period * 3;
        cycle = Math.floor(time / sp.period);
        local = time - cycle * sp.period;
        on = local < SPARK_LEN;
      }
      if (on !== sp.on) {
        sp.on = on;
        sp.root.visible = on;
      }
      if (!on) continue;
      const h = Math.abs(Math.sin((cycle + 1) * 91.17 + sp.seed * 311.7) * 43758.5453) % 1;
      const u = 0.1 + 0.8 * h;
      const v = 1 - u;
      sp.root.position.set(
        v * v * this.ax + 2 * v * u * this.mx + u * u * this.bx,
        v * v * this.ay + 2 * v * u * this.my + u * u * this.by,
      );
      const k = local / SPARK_LEN;
      const flick = Math.floor(local * 36) % 2 === 0 ? 1 : 0.6;
      sp.root.alpha = (1 - k * k * k) * flick;
      sp.crackle.rotation = h * TAU + Math.floor(local * 24) * 0.9;
      sp.crackle.scale.set(0.85 + 0.45 * k);
    }
  }
}

export function tick(g: Graphics, x: number, y: number, r: number): Graphics {
  return g.moveTo(x - r, y).lineTo(x - r * 0.25, y + r * 0.65).lineTo(x + r, y - r * 0.65)
    .stroke({ color: C.ink, width: 5, cap: 'round', join: 'round' })
    .moveTo(x - r, y).lineTo(x - r * 0.25, y + r * 0.65).lineTo(x + r, y - r * 0.65)
    .stroke({ color: C.mint, width: 2.5, cap: 'round', join: 'round' });
}

export const WOOF = { size: 26, color: C.amberHi, weight: 900, outline: C.ink } as const;
/**
 * Label of the flight world's speech-bubble layer: barks, quips and pills sit in it, above every
 * map object and under the saucer. scripts/pixi/check-bubbles.mjs checks the order on every level.
 */
export const FLIGHT_BUBBLES = 'flight-bubbles';
/** Label of the player's own layers (saucer, fuse ring, particles), the only ones above the bubbles. */
export const FLIGHT_PLAYER = 'flight-player';
export function abovePlayer<T extends Container>(c: T): T {
  c.label = FLIGHT_PLAYER;
  return c;
}

export function woof(): Label {
  return new Label(WOOF, tr().flight.woof);
}
