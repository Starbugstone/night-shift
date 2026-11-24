import { Container, Graphics, Sprite } from 'pixi.js';
import type { Assets } from '../../contracts';
import { VIEW_W } from '../../contracts';
import { easeOutBack } from '../../core/fx';
import { GLOW, glowTexture, Glow } from '../../core/gfx/glow';
import { panelPath } from '../../core/gfx/shapes';
import { Label, measure } from '../../core/gfx/text';
import { tr } from '../../i18n';
import type { EntryDef } from '../../levels/types';
import { C } from '../../ui/theme';
import { artSprite } from '../../ui/views/art';
import { clamp } from '../../ui/draw';
import { drawDogFallback } from '../props';
import { FLIGHT_HUD, RING_R, SAUCER, saucerSpeed, type Saucer } from '../sim';
import { TAU, paintedSprite } from './world';
import { dashedArc, ProgressArc } from './tells';

const SIZE = FLIGHT_HUD.saucer;
const SHIELD_R = SIZE / 2 + 15;
const RIM_COUNT = 10;

export class SaucerView {
  readonly root = new Container();
  readonly shadow = new Glow(glowTexture(GLOW.dark));
  readonly groundGlow = new Glow(glowTexture(GLOW.mint), true);
  private readonly trails = new Container();
  private readonly bars: Graphics[] = [];
  private readonly charge = new Glow(glowTexture(GLOW.mint), true);
  private readonly core = new Glow(glowTexture(GLOW.white), true);
  private readonly body = new Container();
  private readonly squash = new Container();
  private readonly hull = new Container();
  private readonly rim: (Glow | Graphics)[] = [];
  private readonly fallback: boolean;
  private readonly shield = new Container();
  private readonly shieldHalo = new Glow(glowTexture(GLOW.mint), true);
  private readonly countdown = new ProgressArc(SHIELD_R, 5);

  constructor(assets: Assets) {
    const art = artSprite(assets, 'flight/saucer_top', SIZE, SIZE);
    this.fallback = !art;
    const r = SIZE / 2;
    const hull = art ?? new Graphics()
      .circle(0, 0, r * 0.95).fill('#7d8fb3').stroke({ color: C.ink, width: 4 })
      .circle(0, 0, r * 0.75).fill('#a9b9d8')
      .circle(0, 0, r * 0.42).fill(C.mint).stroke({ color: C.ink, width: 3 })
      .circle(-r * 0.14, -r * 0.16, r * 0.12).fill('rgba(255,255,255,0.6)');
    this.hull.addChild(hull);
    for (let i = 0; i < RIM_COUNT; i++) {
      const a = -Math.PI / 2 + i * TAU / RIM_COUNT;
      const radius = r * (art ? 58.5 / 80 : 0.85);
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius - (art ? SIZE / 40 : 0);
      const light = art
        ? new Glow(glowTexture(i % 2 === 0 ? GLOW.amber : GLOW.mint), true).place(x, y, 11)
        : new Graphics().circle(x, y, r * 0.07).fill(0xffffff);
      this.rim.push(light);
      this.hull.addChild(light);
    }
    for (let i = -1; i <= 1; i++) {
      const bar = new Graphics().roundRect(-1, -2, 102, 4, 2).fill(C.mint);
      bar.position.set(-50, i * 26);
      this.bars.push(bar);
      this.trails.addChild(bar);
    }
    this.squash.addChild(this.hull);
    this.body.addChild(this.squash);
    this.shield.addChild(this.shieldHalo, new Graphics().circle(0, 0, SHIELD_R)
      .fill({ color: C.mint, alpha: 0.14 }).stroke({ color: C.mint, alpha: 0.4, width: 3 }), this.countdown.root);
    this.root.addChild(this.trails, this.charge, this.core, this.body, this.shield);
  }

  sync(s: Saucer, t: number, rm: boolean, locking: boolean, st: number, lockK: number, wobble: number, ghost = 0, ghostMax = 1.6): void {
    const speed = Math.min(1, saucerSpeed(s) / SAUCER.maxSpeed);
    const heading = Math.atan2(s.vy, s.vx);
    const wave = rm ? 0 : Math.sin(t * 2.4);
    const bob = rm ? 0 : wave * 0.5 + 0.5;
    this.shadow.place(s.x + 22 + bob * 5, s.y + 34 + bob * 7, 66 - bob * 5, 58 - bob * 5, 0.7);
    this.groundGlow.place(s.x, s.y + 4, 86, 86, 0.2 + bob * 0.06 + lockK * 0.5);
    this.root.position.set(s.x, s.y);
    this.trails.visible = speed > 0.4 && !rm;
    if (this.trails.visible) {
      this.trails.rotation = heading + Math.PI;
      this.trails.alpha = (speed - 0.4) * 0.8;
      for (let i = 0; i < 3; i++) {
        const bar = this.bars[i]!;
        bar.x = 50;
        bar.scale.x = (40 + speed * 60 - Math.abs(i - 1) * 20) / 100;
      }
    }
    const a = locking ? Math.min(1, st / 0.3) : 0;
    const flick = rm ? 0 : Math.sin(t * 20) * 5;
    this.charge.place(0, 0, 80 + a * 50 + flick, 80 + a * 50 + flick, 0.75 * a);
    this.core.place(0, 0, 40 + a * 16, 40 + a * 16, 0.5 * a);
    const hover = 1 - speed;
    const scale = (1 + wave * 0.028 * hover) * (locking ? 1 - Math.min(0.15, st * 0.2) : 1);
    this.body.y = -(wave * 0.5 + 0.5) * 3 * hover;
    this.body.rotation = rm ? 0 : wobble * 0.3 + (s.stun > 0 ? Math.sin(t * 40) * 0.25 : 0);
    this.body.alpha = ghost > 0 ? rm ? 0.75 : 0.72 + 0.14 * Math.sin(t * 9) : 1;
    this.squash.rotation = heading;
    this.squash.scale.set((1 - 0.14 * speed) * scale, (1 + 0.04 * speed) * scale);
    this.hull.rotation = -heading;
    const head = rm ? -1 : Math.floor(t * (locking ? 26 : 9)) % RIM_COUNT;
    for (let i = 0; i < RIM_COUNT; i++) {
      const light = this.rim[i]!;
      if (this.fallback) {
        light.rotation = rm ? 0 : t * 1.5;
        light.tint = Math.floor((rm ? 0 : t) * 8 + i) % 3 === 0 ? C.amberHi : '#4d5d86';
      } else {
        const back = head < 0 ? 2 : (head - i + RIM_COUNT) % RIM_COUNT;
        light.visible = back <= 2;
        light.alpha = back === 0 ? 1 : back === 1 ? 0.55 : 0.25;
      }
    }
    this.shield.visible = ghost > 0;
    if (this.shield.visible) {
      const left = Math.min(1, ghost / ghostMax);
      this.shieldHalo.place(0, 0, SHIELD_R + 26, SHIELD_R + 26, 0.22 + 0.2 * left);
      this.countdown.sync(left);
    }
  }
}

const ROUTE = { size: 19, weight: 800, color: C.mint, align: 'left' } as const;
const EASY = { ...ROUTE, color: C.text } as const;
const HARD = { ...ROUTE, color: C.amberHi } as const;

export class EntryRingView {
  readonly root = new Container();
  private readonly spin = new Container();
  private readonly tintDisc = new Graphics().circle(0, 0, RING_R).fill(C.mint);
  private readonly art: Sprite | Graphics;
  private readonly progress = new Container();
  private readonly arc = new ProgressArc(RING_R + 10, 10);
  private readonly spark = new Glow(glowTexture(GLOW.white), true);
  private readonly pill = new Container();
  private readonly labelW: number;

  constructor(assets: Assets, private readonly entry: EntryDef) {
    this.root.position.set(entry.x, entry.y);
    this.art = artSprite(assets, 'flight/entry_ring', RING_R * 2, RING_R * 2) ??
      dashedArc(new Graphics(), RING_R - 4, 0, TAU, 16, 10).stroke({ color: C.mint, width: 6 })
        .circle(0, 0, RING_R * 0.55).stroke({ color: C.mint, width: 2 });
    this.tintDisc.blendMode = 'add';
    this.spin.addChild(this.tintDisc, this.art);
    this.progress.addChild(new Graphics().circle(0, 0, RING_R + 10).stroke({ color: 'rgba(27,20,51,0.55)', width: 10 }), this.arc.root, this.spark);
    const words = tr().routes[entry.roomId];
    const route = words.route + tr().flight.entrySep;
    const routeW = measure(route, 19, 800);
    this.labelW = routeW + measure(words.difficulty, 19, 800) + 28;
    const calm = /easy|safe|short/.test(entry.difficulty);
    this.pill.addChild(panelPath(new Graphics(), 0, -20, this.labelW, 40,
      { fill: 'rgba(27,20,51,0.9)', r: 20, stroke: C.mint, lineW: 2, shadow: 0 }),
      new Label(ROUTE).set(route, 14, 1), new Label(calm ? EASY : HARD).set(words.difficulty, 14 + routeW, 1));
    this.pill.y = (entry.labelSide === 'above' ? -1 : 1) * (RING_R + 34);
    this.root.addChild(this.spin, this.progress, this.pill);
  }

  sync(i: number, t: number, rm: boolean, active: boolean, fraction: number, locked: boolean, st: number, camX: number): void {
    const snap = locked ? rm ? 1 : easeOutBack(st / 0.28) : 0;
    this.spin.scale.set((rm ? 1 : 1 + Math.sin(t * 3 + i) * 0.05) * (1 - 0.24 * snap));
    this.tintDisc.alpha = locked ? 0.42 : active ? 0.28 : 0.12;
    this.art.rotation = rm ? 0 : t * 0.7 + (locked ? st * 5 : 0);
    this.progress.visible = active && fraction > 0 && !locked;
    if (this.progress.visible) {
      this.arc.sync(fraction);
      const a = -Math.PI / 2 + TAU * fraction;
      this.spark.place(Math.cos(a) * (RING_R + 10), Math.sin(a) * (RING_R + 10), 16, 16, 0.9);
    }
    this.pill.x = clamp(this.entry.x - this.labelW / 2, camX + 8, camX + VIEW_W - 8 - this.labelW) - this.entry.x;
  }
}

export class DogView {
  readonly root = new Container();
  private readonly ear: Graphics | null;

  constructor(assets: Assets, private readonly x: number, y: number) {
    this.root.position.set(x, y);
    const art = artSprite(assets, 'flight/dog_top');
    this.root.addChild(art ?? paintedSprite('dog', 70, 70, drawDogFallback));
    this.ear = art ? new Graphics().moveTo(-6, 4).quadraticCurveTo(-4, -3, 3, -1).lineTo(6, 12)
      .quadraticCurveTo(4, 23, -2, 18).closePath().fill('#895e55').stroke({ color: C.ink, width: 2.5 }) : null;
    if (this.ear) {
      this.ear.position.set(-10, -6);
      this.root.addChild(this.ear);
    }
  }

  sync(t: number, rm: boolean, barking: boolean): void {
    const breath = rm ? 0 : Math.sin(t * 2.2);
    this.root.scale.set(1 + breath * 0.035, 1 + breath * 0.022);
    if (!this.ear) return;
    const cycle = (t + this.x * 0.013) % 3.4;
    const twitch = rm ? 0 : barking ? Math.sin(t * 24) * 0.32 :
      cycle < 0.4 ? Math.sin(cycle / 0.4 * Math.PI * 3) * 0.45 : 0;
    this.ear.visible = twitch !== 0;
    this.ear.rotation = twitch;
  }
}
