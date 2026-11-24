// Water bodies, refill markers, sprays and drips read the moisture simulation.
import { Container, Graphics, type Sprite } from 'pixi.js';
import { VIEW_H, VIEW_W } from '../contracts';
import { Shape, keyOf } from '../core/gfx/shapes';
import { DRIPS, sprinklerOn, type MoistureSim } from './moisture';
import type { Area } from './rooms/layout';
import { INK, MINT, Segment, box, intersects } from './views/pieces';

const PINE = '#1f3d3a';
const ICE = '#d4ecf5';
const WATER = '#8fc3e0';
const DIM = '#6f7d96';
const RING_SECONDS = 2.4;

function droplet(): Graphics {
  return new Graphics()
    .moveTo(0, -15).quadraticCurveTo(11, -1, 9, 4).arc(0, 3, 9, 0.1, Math.PI - 0.1)
    .quadraticCurveTo(-11, -1, 0, -15).closePath().fill(0xffffff)
    .moveTo(-9, 19).lineTo(0, 27).lineTo(9, 19).stroke({ color: 0xffffff, width: 3.5, cap: 'round', join: 'round' });
}

class WaterZone {
  readonly back: Sprite;
  readonly front = new Container();
  private readonly surface = new Shape();
  private left = 0;
  private count = 0;
  private readonly heights = new Float32Array(Math.ceil((VIEW_W + 40) / 12) + 1);
  private readonly wave = (g: Graphics): void => {
    g.moveTo(this.left, this.heights[0]!);
    for (let i = 1; i < this.count; i++) g.lineTo(this.left + i * 12, this.heights[i]!);
    g.stroke({ color: ICE, width: 3, alpha: 0.85 });
  };

  constructor(private readonly area: Area) {
    const { x, y, w, h } = area;
    this.back = box(x, y, w, h, PINE, 0.5);
    this.front.addChild(box(x, y, w, h, PINE, 0.3), this.surface);
  }

  sync(cx: number, cy: number, t: number, rm: boolean): void {
    this.front.visible = this.back.visible = inView(this.area, cx, cy);
    if (!this.front.visible) return;
    const { x, y, w } = this.area;
    const left = this.left = Math.max(x, cx - 20);
    const right = Math.min(x + w, cx + VIEW_W + 20);
    this.count = Math.floor((right - left) / 12) + 1;
    let key = keyOf(left, this.count);
    for (let i = 0; i < this.count; i++) {
      const px = left + i * 12;
      const height = y + (rm ? 0 : Math.sin(px * 0.045 + t * 2.2) * 3 + Math.sin(px * 0.11 - t * 1.4) * 1.5);
      this.heights[i] = height;
      key = keyOf(key, height);
    }
    this.surface.draw(key, this.wave);
  }
}

function inView(a: Area, cx: number, cy: number): boolean {
  return intersects(a, cx - 20, cy - 20, VIEW_W + 40, VIEW_H + 40);
}

class RefillView {
  readonly root = new Container();
  private readonly marker = new Container();
  private readonly drop = droplet();
  private readonly spray: Segment[] = [];

  constructor(private readonly point: MoistureSim['spec']['refills'][number]) {
    const { area, kind } = point;
    const edge = new Graphics().moveTo(0, -15).quadraticCurveTo(11, -1, 9, 4).arc(0, 3, 9, 0.1, Math.PI - 0.1)
      .quadraticCurveTo(-11, -1, 0, -15).closePath().stroke({ color: INK, width: 3 });
    this.root.position.set(area.x + area.w / 2, area.y);
    if (kind === 'sprinkler') {
      for (let i = 0; i < 7; i++) {
        const bit = new Segment(box(0, -1, 1, 2, WATER, 0.55));
        this.spray.push(bit);
        this.root.addChild(bit.root);
      }
    }
    this.marker.addChild(edge, this.drop);
    this.root.addChild(this.marker);
  }

  sync(cx: number, cy: number, t: number, rm: boolean, using: boolean, index: number): void {
    const { point } = this;
    this.root.visible = inView(point.area, cx, cy);
    if (!this.root.visible) return;
    const live = point.kind !== 'sprinkler' || sprinklerOn(point.cycle, t);
    for (let k = 0; k < this.spray.length; k++) {
      const bit = this.spray[k]!;
      bit.root.visible = live;
      if (!live) continue;
      const i = k - 3;
      const off = rm ? 0 : (t * 260 + i * 37) % 60;
      bit.sync(i * 3, off * 0.2, i * point.area.w / 7, point.area.h * 0.6 + off);
    }
    this.marker.y = -30 + (using ? -4 : rm ? 0 : Math.sin(t * 3 + index) * 3);
    this.drop.tint = live ? MINT : DIM;
    this.drop.alpha = live ? 1 : 0.6;
  }
}

export class WetView {
  readonly back = new Container();
  readonly front = new Container();
  private readonly zones: WaterZone[];
  private readonly refills: RefillView[];
  private readonly drips: Graphics[] = [];

  constructor(private readonly wet: MoistureSim) {
    this.zones = wet.spec.water.map(({ area }) => new WaterZone(area));
    this.refills = wet.spec.refills.map(point => new RefillView(point));
    for (const view of this.zones) {
      this.back.addChild(view.back);
      this.front.addChild(view.front);
    }
    for (let i = 0; i < DRIPS; i++) {
      const drip = new Graphics().ellipse(0, 0, 12, 3.5).stroke({ color: WATER, width: 2 });
      this.drips.push(drip);
      this.back.addChild(drip);
    }
    for (const point of this.refills) this.back.addChild(point.root);
  }

  sync(cx: number, cy: number, t: number, rm: boolean): void {
    for (const zone of this.zones) zone.sync(cx, cy, t, rm);
    for (let i = 0; i < this.drips.length; i++) {
      const drip = this.drips[i]!;
      const age = t - this.wet.dripAt[i]!;
      const x = this.wet.dripX[i]!;
      const y = this.wet.dripY[i]!;
      drip.visible = age >= 0 && age <= RING_SECONDS && x >= cx - 40 && x <= cx + VIEW_W + 40 && y >= cy - 40 && y <= cy + VIEW_H + 40;
      if (!drip.visible) continue;
      const p = age / RING_SECONDS;
      drip.position.set(x, y);
      drip.scale.set((6 + p * 22) / 12, (2 + p * 5) / 3.5);
      drip.alpha = (1 - p) * 0.7;
    }
    for (let i = 0; i < this.refills.length; i++) this.refills[i]!.sync(cx, cy, t, rm, this.wet.refilling === i, i);
  }
}
