import { Container, Graphics, Sprite } from 'pixi.js';
import type { Area } from '../rooms/layout';
import { CEILING, FLOOR } from '../rooms/layout';
import { VIEW_H, VIEW_W, type GameContext } from '../../contracts';
import { GLOW, Glow, glowTexture } from '../../core/gfx/glow';
import { Shape, keyOf } from '../../core/gfx/shapes';
import { Label, measure } from '../../core/gfx/text';
import { bump, easeOutBack } from '../../core/fx';
import { artSprite } from '../../ui/views/art';
import { gt, tr } from '../../i18n';
import type { AbductSimulation } from '../simulation';
import { clamp } from '../ragdoll';
import type { TurnControl } from '../turn';
import { AMBER, Arc, INK, LIGHT, MINT, RED, TAU, box, burst, disc, ring } from './pieces';

export interface AbductViewInput {
  dragging: boolean;
  tutorial: boolean;
  turn: TurnControl;
  hint?: string;
}

export class Reticle {
  readonly root = new Container();
  private readonly variants: Container[] = [];
  private readonly ticks: Container[] = [];
  private readonly colors: Container[] = [];
  private readonly offscreen = new Graphics().poly([25, 0, 14, 8, 14, -8]).fill(0xffffff);

  constructor(deep: boolean) {
    for (let i = 0; i < 2; i++) {
      const radius = (deep ? 18 : 19) + i * 5;
      const variant = new Container();
      const ticks = new Container();
      const color = new Container();
      const rimInk = ring(radius, 6, INK);
      const rim = ring(radius, 2.6);
      const marksInk = new Graphics();
      const marks = new Graphics();
      for (let j = 0; j < 4; j++) {
        const a = j * Math.PI / 2;
        const x = Math.cos(a);
        const y = Math.sin(a);
        const end = radius + (deep ? 10 : 11);
        marksInk.moveTo(x * (radius + 4), y * (radius + 4)).lineTo(x * end, y * end);
        marks.moveTo(x * (radius + 4), y * (radius + 4)).lineTo(x * end, y * end);
      }
      marksInk.stroke({ color: INK, width: 6, cap: 'round' });
      marks.stroke({ color: 0xffffff, width: 2.6, cap: 'round' });
      ticks.addChild(marksInk, marks);
      const fill = disc(radius);
      fill.alpha = i ? 0.25 : 0.13;
      const center = deep ? box(-2.5, -2.5, 5, 5, 0xffffff) : disc(3.5);
      color.addChild(rim, fill, center);
      variant.addChild(rimInk, ticks, color);
      this.variants.push(variant);
      this.ticks.push(ticks);
      this.colors.push(color);
      this.root.addChild(variant);
    }
    this.root.addChild(this.offscreen);
  }

  sync(x: number, y: number, beamX: number, beamY: number, dragging: boolean, hot: boolean, spin: number): void {
    this.root.position.set(x, y);
    this.variants[0]!.visible = !dragging;
    this.variants[1]!.visible = dragging;
    const i = dragging ? 1 : 0;
    const color = hot ? AMBER : MINT;
    const ticks = this.ticks[i]!;
    ticks.rotation = spin;
    ticks.children[1]!.tint = color;
    this.colors[i]!.tint = color;
    this.offscreen.visible = x !== beamX || y !== beamY;
    if (this.offscreen.visible) {
      this.offscreen.rotation = Math.atan2(beamY - y, beamX - x);
      this.offscreen.tint = color;
    }
  }
}

export class SpeechBubble {
  readonly root = new Container();
  private readonly edge = new Shape();
  private readonly tail = new Shape();
  private readonly face = new Shape();
  private readonly line: Label;
  private cached = '';
  private shown = '';
  private w = 0;
  private tx = 0;
  private ty = 0;
  private readonly drawTail = (g: Graphics): void => {
    g.moveTo(-11, 0).lineTo(this.tx, this.ty).lineTo(11, 0).closePath()
      .stroke({ color: '#6c5277', width: 5, join: 'round' }).fill('#e9ddd2');
  };
  private readonly drawEdge = (g: Graphics): void => {
    g.roundRect(0, 0, this.w, 42, 15).stroke({ color: '#6c5277', width: 5 });
  };
  private readonly drawFace = (g: Graphics): void => {
    g.roundRect(0, 0, this.w, 42, 15).fill('#e9ddd2');
  };

  constructor(private readonly deep: boolean) {
    this.line = new Label({ size: 16, weight: deep ? 650 : 600, color: INK });
    this.root.addChild(this.edge, this.tail, this.face, this.line);
  }

  /** `age` counts down from `total` (the line's reading time, sim.mumbleFor). */
  sync(text: string, age: number, x: number, y: number, camX: number, camY: number, rm: boolean, total = 1.6): void {
    this.root.visible = age > 0;
    if (!this.root.visible) return;
    if (text !== this.cached) {
      this.cached = text;
      this.shown = gt(text);
      this.w = Math.min(VIEW_W - 44, Math.ceil(measure(this.shown, 16, this.deep ? 650 : 600)) + 36);
      this.edge.draw(this.w, this.drawEdge);
      this.face.draw(this.w, this.drawFace);
    }
    const w = this.w;
    const left = clamp(x - w / 2, camX + 22, camX + VIEW_W - 22 - w);
    let top = this.deep ? Math.max(y - 116, camY + 160) : clamp(y < 226 ? y + 58 : y - 116, CEILING + 6, FLOOR - 49);
    const below = this.deep ? top > y - 60 : top > y;
    if (this.deep && below) top = y + 58;
    const baseX = clamp(x, left + 26, left + w - 26);
    const baseY = below ? top + 2 : top + 40;
    const dx = x - baseX;
    const dy = y - baseY;
    const d = Math.hypot(dx, dy) || 1;
    const reach = Math.min(d - 34, 40);
    this.root.alpha = Math.min(1, age / 0.18);
    this.root.position.set(baseX, baseY);
    this.root.scale.set(rm ? 1 : easeOutBack((total - age) / 0.22));
    this.edge.position.set(left - baseX, top - baseY);
    this.face.position.set(left - baseX, top - baseY);
    this.tail.visible = reach > 5;
    if (this.tail.visible) {
      this.tx = dx / d * reach;
      this.ty = dy / d * reach;
      this.tail.draw(keyOf(this.tx, this.ty), this.drawTail);
    }
    this.line.set(this.shown, left + w / 2 - baseX, top + 21 - baseY, w - 36);
  }
}

export class WakeBurst {
  readonly root = new Container();

  constructor(private readonly deep: boolean) {
    this.root.addChild(
      burst(34, 23, deep ? RED : '#ff5d73', 4),
      new Graphics().roundRect(-4.5, -19, 9, 22, 3.5).circle(0, 12, 5).fill(0xffffff),
    );
  }

  sync(awake: boolean, x: number, y: number, age: number, rm: boolean): void {
    this.root.visible = awake;
    if (!awake) return;
    this.root.position.set(this.deep ? x + 34 : clamp(x + 34, 50, VIEW_W - 50), this.deep ? y - 74 : clamp(y - 74, CEILING + 40, FLOOR - 60));
    this.root.rotation = 0.2 + (rm ? 0 : Math.sin(age * 34) * 0.14 * Math.max(0, 1 - age * 1.4) + (this.deep ? 0 : Math.sin(age * 9) * 0.04));
    this.root.scale.set(rm ? 1 : easeOutBack(age / 0.24, 3.2));
  }
}

export class SnoozeView {
  readonly root = new Container();
  private readonly glow = new Glow(glowTexture('200,164,255'), true);
  private readonly rings = new Shape();
  private radius = 0;
  private readonly drawRings = (g: Graphics): void => {
    g.circle(0, 0, this.radius).stroke({ color: '#c8a4ff', width: 5 })
      .circle(0, 0, this.radius * 0.74).stroke({ color: MINT, width: 2.5 });
  };
  private readonly notes: Label[] = [];

  constructor() {
    this.root.addChild(this.glow, this.rings);
    for (let i = 0; i < 3; i++) {
      const note = new Label({ size: 34, weight: 900, color: LIGHT }, i === 1 ? '♪' : '♫');
      this.root.addChild(note);
      this.notes.push(note);
    }
  }

  sync(sim: AbductSimulation, rm: boolean): void {
    this.root.visible = sim.snoozePulse > 0;
    if (!this.root.visible) return;
    const radius = rm ? 112 : 26 + (1 - sim.snoozePulse) * 210;
    this.root.position.set(sim.snoozeX, sim.snoozeY);
    this.root.alpha = Math.min(1, sim.snoozePulse * 1.8);
    this.glow.place(0, 0, radius * 1.1, radius * 1.1, 0.35);
    this.radius = radius;
    this.rings.draw(keyOf(radius), this.drawRings);
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.9;
      this.notes[i]!.position.set(Math.cos(a) * radius * 0.7, Math.sin(a) * radius * 0.7);
    }
  }
}

export class DeliveryView {
  readonly world = new Container();
  readonly flash = box(0, 0, VIEW_W, VIEW_H, '#d9fff0');
  private readonly mint = new Glow(glowTexture(GLOW.mint), true);
  private readonly white = new Glow(glowTexture(GLOW.white), true);

  constructor() {
    this.world.addChild(this.mint, this.white);
  }

  sync(sim: AbductSimulation, rm: boolean): void {
    this.world.visible = this.flash.visible = sim.delivered;
    if (!sim.delivered) return;
    const p = sim.slurp * sim.slurp;
    const b = bump(sim.slurp);
    const { exitX: x, exitY: y } = sim;
    const mintR = 60 + 170 * p;
    const whiteR = 30 + 60 * p;
    this.mint.place(x, y, mintR, mintR, 0.25 + 0.75 * b);
    this.white.place(x, y, whiteR, whiteR, b);
    this.flash.alpha = p * p * (rm ? 0.25 : 0.6);
  }
}

export class SnoreView {
  readonly root = new Container();
  private readonly art: Sprite | null;
  private readonly caption: Label | null;

  constructor(ctx: GameContext, private readonly deep: boolean) {
    this.art = artSprite(ctx.assets, 'ui/zzz');
    this.caption = this.art ? null : new Label({ size: deep ? 21 : 24, color: deep ? '#e0cefc' : MINT, weight: 900 }, deep ? 'Z z' : tr().abduct.zzz);
    this.root.addChild(this.art ?? this.caption!);
  }

  sync(fx: number, x: number, y: number, rm: boolean): void {
    // every snore comes and goes: hide with alpha (a visible flip rebuilds the render group)
    if (fx <= 0) {
      this.root.alpha = 0;
      return;
    }
    const deep = this.deep;
    const k = clamp((1.1 - fx) / 1.1, 0, 1);
    const lift = rm ? 0 : k * (deep ? 32 : 34);
    const base = deep ? 38 : 40;
    const size = base * (rm ? 1 : 0.7 + 0.5 * k);
    this.root.alpha = Math.min(1, fx * (deep ? 2.4 : 2.6));
    const left = deep ? x + 24 : clamp(y < 250 && x < VIEW_W / 2 ? x - 78 : x + 36, 25, VIEW_W - 65);
    const top = deep ? y - 37 - lift : clamp(y - 62 - lift, CEILING + 3, FLOOR - 39);
    if (this.art) {
      this.art.position.set(left + size / 2, top + base - size / 2);
      this.art.width = this.art.height = size;
    } else this.caption?.position.set(left + 23, top + 12);
  }
}

export class FuseRing {
  readonly root = new Container();
  private readonly fill = new Arc(70, 7);
  private readonly endLight = new Glow(glowTexture(GLOW.red), true);
  private readonly endCore = new Glow(glowTexture(GLOW.white), true);
  private readonly amber = glowTexture(GLOW.amber);
  private readonly red = glowTexture(GLOW.red);

  constructor(private readonly lit: boolean) {
    const base = ring(70, 11, '#1a162b');
    base.alpha = 0.6;
    this.root.addChild(base, this.fill.root);
    if (lit) this.root.addChild(this.endLight, this.endCore);
    else {
      this.endLight.destroy();
      this.endCore.destroy();
    }
  }

  sync(x: number, y: number, left: number, red: boolean): void {
    this.root.position.set(x, y);
    this.fill.sync(left, red ? RED : AMBER);
    if (!this.lit) return;
    const a = -Math.PI / 2 + TAU * left;
    const px = Math.cos(a) * 70;
    const py = Math.sin(a) * 70;
    const texture = red ? this.red : this.amber;
    if (this.endLight.texture !== texture) this.endLight.texture = texture;
    this.endLight.place(px, py, 20, 20);
    this.endCore.place(px, py, 8, 8);
  }
}

export class ExitChevrons {
  readonly root = new Graphics();

  constructor() {
    for (let i = 0; i < 2; i++) {
      const y = 4 + i * 11;
      this.root.moveTo(-10, y + 3).lineTo(0, y - 7).lineTo(10, y + 3);
    }
    this.root.stroke({ color: MINT, width: 3.5, cap: 'round', join: 'round' });
  }
}

export function roundedZone(area: Area, radius: number): Graphics {
  const { x, y, w, h } = area;
  return new Graphics().roundRect(x, y, w, h, radius).fill(MINT);
}
