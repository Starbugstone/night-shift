import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { Area } from '../rooms/layout';
import { Shape, keyOf } from '../../core/gfx/shapes';
import { paintedTexture, type Painter } from '../../core/gfx/textures';

export const TAU = Math.PI * 2;
export const INK = '#1d1631';
export const MINT = '#7cffcb';
export const AMBER = '#ffd081';
export const RED = '#ff697d';
export const LIGHT = '#f1eeff';

export function bitmap(key: string, x: number, y: number, w: number, h: number, paint: Painter): Sprite {
  const sprite = new Sprite(paintedTexture('abduct|' + key, Math.ceil(w), Math.ceil(h), paint));
  sprite.position.set(x, y);
  return sprite;
}

export function box(x: number, y: number, w: number, h: number, color: string | number, alpha = 1): Sprite {
  const sprite = new Sprite(Texture.WHITE);
  sprite.tint = color;
  sprite.alpha = alpha;
  placeBox(sprite, x, y, w, h);
  return sprite;
}

export function placeBox(sprite: Sprite, x: number, y: number, w: number, h: number): void {
  sprite.position.set(x, y);
  sprite.width = w;
  sprite.height = h;
}

export function disc(radius: number, color: string | number = 0xffffff): Graphics {
  return new Graphics().circle(0, 0, radius).fill(color);
}

export function ring(radius: number, width: number, color: string | number = 0xffffff): Graphics {
  return new Graphics().circle(0, 0, radius).stroke({ color, width });
}

export function intersects(a: Area, x: number, y: number, w: number, h: number): boolean {
  return a.x < x + w && a.x + a.w > x && a.y < y + h && a.y + a.h > y;
}

export function circleInView(x: number, y: number, r: number, left: number, top: number, w: number, h: number): boolean {
  return x + r > left && x - r < left + w && y + r > top && y - r < top + h;
}

export class Segment {
  readonly root = new Container();

  constructor(private readonly bar: Sprite | Graphics) {
    this.root.addChild(bar);
  }

  sync(x: number, y: number, endX: number, endY: number): void {
    const dx = endX - x;
    const dy = endY - y;
    this.root.position.set(x, y);
    this.root.rotation = Math.atan2(dy, dx);
    this.bar.scale.x = Math.hypot(dx, dy);
  }
}

export class DashedLine {
  readonly root = new Container();
  private readonly dashes: Sprite[] = [];
  private shown = 0;

  constructor(maxLength: number, private readonly dash: number, private readonly gap: number, width: number) {
    for (let i = 0; i < Math.ceil(maxLength / (dash + gap)) + 1; i++) {
      const bit = box(0, -width / 2, dash, width, 0xffffff);
      bit.visible = false;
      this.dashes.push(bit);
      this.root.addChild(bit);
    }
  }

  sync(x: number, y: number, endX: number, endY: number, color: string | number, offset = 0): void {
    const dx = endX - x;
    const dy = endY - y;
    const length = Math.hypot(dx, dy);
    this.root.visible = length > 0.25;
    if (!this.root.visible) return;
    this.root.position.set(x, y);
    this.root.rotation = Math.atan2(dy, dx);
    this.root.tint = color;
    const step = this.dash + this.gap;
    let from = -((offset % step + step) % step);
    let i = 0;
    for (; i < this.dashes.length && from < length; i++, from += step) {
      const bit = this.dashes[i]!;
      const left = Math.max(0, from);
      const right = Math.min(length, from + this.dash);
      bit.visible = right > left;
      if (bit.visible) {
        bit.x = left;
        bit.width = right - left;
      }
    }
    for (let j = i; j < this.shown; j++) this.dashes[j]!.visible = false;
    this.shown = i;
  }
}

export class Arc {
  readonly root = new Shape();
  private end = 0;
  private readonly redraw = (g: Graphics): void => {
    g.arc(0, 0, this.radius, this.start, this.end).stroke({ color: 0xffffff, width: this.width, cap: 'round' });
  };

  constructor(private readonly radius: number, private readonly width: number, private readonly start = -Math.PI / 2, private readonly span = TAU) {}

  sync(frac: number, color: string | number): void {
    this.root.visible = frac > 0.003;
    if (!this.root.visible) return;
    this.root.tint = color;
    this.end = this.start + Math.min(1, frac) * this.span;
    this.root.draw(keyOf(this.end * this.radius), this.redraw);
  }
}

export function burst(radius: number, inner: number, color: string, width: number): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 18; i++) {
    const a = i * TAU / 18;
    const r = i % 2 === 0 ? radius : inner;
    if (i === 0) g.moveTo(r, 0);
    else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return g.closePath().fill(color).stroke({ color: INK, width, join: 'round' });
}

export function dashedRing(radius: number, width: number, dash: number, gap: number): Sprite {
  const size = Math.ceil((radius + width) * 2);
  const s = bitmap(`ring|${radius}|${width}|${dash}|${gap}`, 0, 0, size, size, (g) => {
    g.setLineDash([dash, gap]);
    g.lineWidth = width;
    g.strokeStyle = '#ffffff';
    g.beginPath();
    g.arc(size / 2, size / 2, radius, 0, TAU);
    g.stroke();
  });
  s.anchor.set(0.5);
  return s;
}

/** Dash phase in units along the path, carried over corners. */
export function dashSegment(
  g: Graphics, x: number, y: number, endX: number, endY: number, dash: number, gap: number, offset: number,
): number {
  const dx = endX - x;
  const dy = endY - y;
  const d = Math.hypot(dx, dy);
  if (d <= 0) return offset;
  for (let from = -offset; from < d; from += dash + gap) {
    const l = Math.max(0, from) / d;
    const r = Math.min(d, from + dash) / d;
    if (r > l) g.moveTo(x + dx * l, y + dy * l).lineTo(x + dx * r, y + dy * r);
  }
  return (offset + d) % (dash + gap);
}

export class DashedRect {
  readonly root = new Shape();
  private width = 0;
  private offset = 0;
  private readonly paint = (g: Graphics): void => {
    const { w, h } = this.area;
    const phase = dashSegment(g, 0, 0, w, 0, this.dash, this.gap, this.offset);
    const right = dashSegment(g, w, 0, w, h, this.dash, this.gap, phase);
    const bottom = dashSegment(g, w, h, 0, h, this.dash, this.gap, right);
    dashSegment(g, 0, h, 0, 0, this.dash, this.gap, bottom);
    g.stroke({ color: 0xffffff, width: this.width });
  };

  constructor(private readonly area: Area, private readonly dash: number, private readonly gap: number, color: string) {
    this.root.position.set(area.x, area.y);
    this.root.tint = color;
  }

  sync(width: number, offset = 0): void {
    const step = this.dash + this.gap;
    this.offset = (offset % step + step) % step;
    this.width = width;
    this.root.draw(keyOf(width, this.offset), this.paint);
  }
}
