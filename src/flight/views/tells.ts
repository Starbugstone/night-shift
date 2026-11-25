import { Container, Graphics, Sprite } from 'pixi.js';
import { GLOW, glowTexture, Glow } from '../../core/gfx/glow';
import { Shape, batched, keyOf } from '../../core/gfx/shapes';
import { paintedTexture } from '../../core/gfx/textures';
import { rgbOf } from '../../core/fx';
import { C } from '../../ui/theme';
import { TAU } from './world';

export const RED = '#ff5d73';
export const CONE_HEAD = '255,236,170';

function coneFill(half: number, rgb: string, range: number): Sprite {
  const r = 300;
  const outer = Math.min(Math.PI / 2 - 0.02, half * 1.1);
  const h = Math.ceil(2 * r * Math.sin(outer)) + 4;
  const tex = paintedTexture(`flight|cone|${half}|${rgb}`, r + 2, h, (g) => {
    g.translate(0, h / 2);
    const grad = g.createRadialGradient(0, 0, 8, 0, 0, r);
    grad.addColorStop(0, `rgba(${rgb},0.7)`);
    grad.addColorStop(0.7, `rgba(${rgb},0.27)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.1;
    for (let i = 0; i < 10; i++) {
      const a = outer + (half * 0.78 - outer) * i / 9;
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, r, -a, a);
      g.closePath();
      g.fill();
    }
  }, 1);
  const sprite = new Sprite(tex);
  sprite.anchor.set(0, 0.5);
  sprite.scale.set(range / r);
  sprite.blendMode = 'add';
  return sprite;
}

export function sectorPath(g: Graphics, r: number, a0: number, a1: number): Graphics {
  return g.moveTo(0, 0).lineTo(r * Math.cos(a0), r * Math.sin(a0)).arc(0, 0, r, a0, a1).closePath();
}

/** The feather is decoration. The hard edge uses the detector's exact half-angle and range. */
export class ConeView {
  readonly root = new Container();
  private readonly heat: Sprite;
  private readonly rim: Graphics;
  private readonly hotRim: Graphics;
  private readonly left: Graphics;
  private readonly right: Graphics;
  private readonly color: string;

  constructor(half: number, range: number, rgb = CONE_HEAD, private readonly edge = 0.5) {
    this.color = rgbOf(rgb);
    this.heat = coneFill(half, GLOW.red, range);
    this.rim = sectorPath(new Graphics(), range, -half, half).stroke({ color: this.color, width: 2.5, join: 'round' });
    this.hotRim = sectorPath(new Graphics(), range, -half, half).stroke({ color: RED, width: 4.5, join: 'round' });
    this.rim.alpha = edge;
    this.left = new Graphics().moveTo(0, 0).lineTo(Math.cos(half) * range, -Math.sin(half) * range)
      .stroke({ color: '#ffffff', width: 5, cap: 'round' });
    this.right = new Graphics().moveTo(0, 0).lineTo(Math.cos(half) * range, Math.sin(half) * range)
      .stroke({ color: '#ffffff', width: 5, cap: 'round' });
    this.left.alpha = this.right.alpha = Math.min(1, edge * 2.2);
    this.root.addChild(coneFill(half, rgb, range), this.heat, this.rim, this.hotRim, this.left, this.right);
  }

  sync(x: number, y: number, angle: number, hot: number, lead = 0): void {
    this.root.position.set(x, y);
    this.root.rotation = angle;
    this.heat.visible = this.hotRim.visible = hot > 0;
    this.rim.visible = this.edge > 0 && hot <= 0;
    this.heat.alpha = hot;
    this.hotRim.alpha = 0.55 + 0.45 * hot;
    this.left.visible = lead < 0;
    this.right.visible = lead > 0;
    if (lead < 0) this.left.tint = hot > 0 ? RED : this.color;
    if (lead > 0) this.right.tint = hot > 0 ? RED : this.color;
  }
}

export function arc(g: Graphics, r: number, a0: number, a1: number): Graphics {
  return g.moveTo(r * Math.cos(a0), r * Math.sin(a0)).arc(0, 0, r, a0, a1);
}

export function dashedArc(g: Graphics, r: number, a0: number, a1: number, on: number, off: number): Graphics {
  const d = on / r;
  const step = (on + off) / r;
  for (let a = a0; a < a1; a += step) arc(g, r, a, Math.min(a + d, a1));
  return g;
}

export function dashedLine(g: Graphics, ax: number, ay: number, bx: number, by: number, on: number, off: number): Graphics {
  const len = Math.hypot(bx - ax, by - ay);
  for (let d = 0; d < len; d += on + off) {
    const k = d / len;
    const end = Math.min(d + on, len) / len;
    g.moveTo(ax + (bx - ax) * k, ay + (by - ay) * k).lineTo(ax + (bx - ax) * end, ay + (by - ay) * end);
  }
  return g;
}

/** A filled detector disc and two fixed-width borders, all scaling from the live radius. */
export class DiscTell {
  readonly root = new Container();
  private readonly disc = new Graphics().circle(0, 0, 100).fill(0xffffff);
  private readonly rim: Graphics;
  private readonly hotRim: Graphics;

  constructor(width: number, hotWidth: number, dashed = false) {
    // the dashed rims (~450 vertices, fixed geometry: sync only moves, tints and fades them) stay
    // in their batch past Pixi's 200-vertex limit: one draw call instead of three
    this.rim = dashed
      ? dashedArc(batched(new Graphics()), 100, 0, TAU, 14, 12).stroke({ color: 0xffffff, width })
      : new Graphics().circle(0, 0, 100).stroke({ color: 0xffffff, width });
    this.hotRim = dashed
      ? dashedArc(batched(new Graphics()), 100, 0, TAU, 14, 12).stroke({ color: RED, width: hotWidth })
      : new Graphics().circle(0, 0, 100).stroke({ color: RED, width: hotWidth });
    this.root.addChild(this.disc, this.rim, this.hotRim);
  }

  sync(x: number, y: number, radius: number, fill: number | string, fillAlpha: number, edge: number | string, edgeAlpha: number, hot = false, angle = 0): void {
    this.root.position.set(x, y);
    this.root.scale.set(radius / 100);
    this.root.rotation = angle;
    this.disc.tint = fill;
    this.disc.alpha = fillAlpha;
    this.rim.visible = !hot;
    this.rim.tint = edge;
    this.rim.alpha = this.hotRim.alpha = edgeAlpha;
    this.hotRim.visible = hot;
  }
}

export class ProgressArc {
  readonly root = new Container();
  private readonly line = new Shape();

  constructor(private readonly r: number, private readonly width: number, private readonly color: string = C.mint) {
    this.root.addChild(this.line);
  }

  sync(fraction: number): void {
    this.root.visible = fraction > 0;
    if (!this.root.visible) return;
    this.line.draw(keyOf(fraction * 360), (g) => {
      arc(g, this.r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, fraction))
        .stroke({ color: this.color, width: this.width, cap: 'round' });
    });
  }
}

export function lamp(): Glow {
  return new Glow(glowTexture(GLOW.warm), true).place(0, 0, 34, 34, 0.85);
}
