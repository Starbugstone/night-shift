// Bubbles's art follows the seven-joint body plan. The amber outline and red fuse read moisture.
import { Container, type Graphics } from 'pixi.js';
import type { GameContext } from '../contracts';
import { ART } from '../art-manifest';
import { Shape, keyOf } from '../core/gfx/shapes';
import { artSprite } from '../ui/views/art';
import { Fin } from './body-plan';
import type { SpecimenArt } from './draw';
import { MOISTURE, type MoistureSim } from './moisture';
import type { Ragdoll } from './ragdoll';
import { FuseRing } from './views/effects';
import { AMBER, INK, TAU, bitmap, dashSegment } from './views/pieces';

const ICE = '#d4ecf5';
const WATER = '#8fc3e0';
const SLATE = '#55667f';
const DENIM = '#4a5f8a';
const MIST = '#c9d3e2';
const SPINE = [Fin.Snout, Fin.Chest, Fin.Belly, Fin.Tail, Fin.Fluke] as const;

function piece(ctx: GameContext, part: string, left: number, top: number, paint: (g: CanvasRenderingContext2D, w: number, h: number) => void): Container {
  const key = 'human/bubbles_' + part;
  const { w, h } = ART[key]!;
  const root = new Container();
  const art = artSprite(ctx.assets, key, w, h);
  if (art) {
    art.anchor.set(0);
    art.position.set(left, top);
    root.addChild(art);
  } else root.addChild(bitmap(key, left - 6, top - 6, w + 12, h + 12, g => {
    g.translate(6 - left, 6 - top);
    g.lineWidth = 3;
    g.strokeStyle = INK;
    paint(g, w, h);
  }));
  return root;
}

class Sheath {
  readonly body = new Shape();
  readonly warning = new Shape();
  readonly fuse = new FuseRing(false);
  private readonly spine = new Float64Array(SPINE.length * 2);
  private readonly outline = new Float64Array(SPINE.length * 4);
  private level = 0;
  private phase = 0;
  private readonly paint = (g: Graphics): void => {
    for (let i = 0; i < 2; i++) {
      g.moveTo(this.spine[0]!, this.spine[1]!);
      for (let j = 2; j < this.spine.length; j += 2) g.lineTo(this.spine[j]!, this.spine[j + 1]!);
      g.stroke({
        color: i === 0 ? ICE : WATER,
        width: i === 0 ? 30 + 52 * this.level : 22 + 38 * this.level,
        alpha: i === 0 ? 0.5 : 0.55,
        cap: 'round',
        join: 'round',
      });
    }
  };
  private readonly paintWarning = (g: Graphics): void => {
    let phase = this.phase;
    for (let i = 0; i < this.outline.length; i += 2) {
      const next = (i + 2) % this.outline.length;
      phase = dashSegment(g, this.outline[i]!, this.outline[i + 1]!, this.outline[next]!, this.outline[next + 1]!, 10, 9, phase);
    }
    g.stroke({ color: AMBER, width: 4, cap: 'round', join: 'round' });
  };

  sync(body: Ragdoll, wet: MoistureSim, t: number, rm: boolean): void {
    const { level } = wet;
    this.level = level;
    this.body.visible = level > 0.01;
    if (this.body.visible) {
      let key = keyOf(level * 52);
      for (let i = 0; i < SPINE.length; i++) {
        const j = SPINE[i]!;
        const x = body.x[j]!;
        const y = body.y[j]!;
        this.spine[i * 2] = x;
        this.spine[i * 2 + 1] = y;
        key = keyOf(key, x, y);
      }
      this.body.draw(key, this.paint);
    }
    this.warning.visible = wet.low && level > 0;
    if (this.warning.visible) {
      this.phase = rm ? 0 : (19 - t * 30 % 19) % 19;
      this.warning.alpha = rm ? 1 : 0.55 + 0.45 * Math.sin(t * 9);
      let key = keyOf(this.phase);
      let i = 0;
      for (let side = -1; side <= 1; side += 2) {
        for (let point = 0; point < SPINE.length; point++) {
          const k = side < 0 ? point : SPINE.length - 1 - point;
          const j = SPINE[k]!;
          const a = SPINE[Math.max(0, k - 1)]!;
          const b = SPINE[Math.min(SPINE.length - 1, k + 1)]!;
          const dx = body.x[b]! - body.x[a]!;
          const dy = body.y[b]! - body.y[a]!;
          const n = (body.radii[j]! + 14) / (Math.hypot(dx, dy) || 1) * side;
          const x = body.x[j]! - dy * n;
          const y = body.y[j]! + dx * n;
          this.outline[i++] = x;
          this.outline[i++] = y;
          key = keyOf(key, x, y);
        }
      }
      this.warning.draw(key, this.paintWarning);
    }
    this.fuse.root.visible = level <= 0 && wet.fuse > 0;
    if (this.fuse.root.visible) this.fuse.sync(body.chestX, body.chestY, 1 - wet.fuse / MOISTURE.fuse, true);
  }
}

function torsoPaint(g: CanvasRenderingContext2D, w: number, h: number): void {
  g.beginPath();
  g.moveTo(-6, -30);
  g.quadraticCurveTo(-10, -52, -26, -54);
  g.quadraticCurveTo(-22, -40, -24, -28);
  g.closePath();
  g.fillStyle = DENIM;
  g.fill();
  g.stroke();
  g.beginPath();
  g.ellipse(0, 0, w / 2, h * 0.4, 0, 0, TAU);
  g.fillStyle = SLATE;
  g.fill();
  g.stroke();
  g.beginPath();
  g.ellipse(4, h * 0.13, w * 0.42, h * 0.2, 0, 0, Math.PI);
  g.fillStyle = MIST;
  g.fill();
  g.globalAlpha *= 0.6;
  g.beginPath();
  g.ellipse(14, -h * 0.2, w * 0.2, 4, -0.15, 0, TAU);
  g.fillStyle = ICE;
  g.fill();
  g.globalAlpha = 1;
}

function headPaint(g: CanvasRenderingContext2D, awake: boolean): void {
  g.beginPath();
  g.moveTo(-8, -24);
  g.quadraticCurveTo(26, -34, 46, -14);
  g.quadraticCurveTo(66, -8, 80, -2);
  g.quadraticCurveTo(84, 6, 74, 8);
  g.quadraticCurveTo(40, 16, -8, 22);
  g.closePath();
  g.fillStyle = SLATE;
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(44, 6);
  g.quadraticCurveTo(60, 12, 76, 6);
  g.lineWidth = 2.5;
  g.stroke();
  g.fillStyle = INK;
  g.beginPath();
  g.ellipse(36, -8, 4, awake ? 5 : 1.3, 0, 0, TAU);
  g.fill();
  if (awake) {
    g.beginPath();
    g.ellipse(62, 9, 7, 5, 0, 0, TAU);
    g.fillStyle = '#76434c';
    g.fill();
  }
}

function limbPaint(g: CanvasRenderingContext2D, w: number, h: number, part: string): void {
  g.fillStyle = part === 'flipper' ? DENIM : SLATE;
  g.beginPath();
  if (part === 'fluke') {
    g.moveTo(0, -4);
    g.quadraticCurveTo(-w * 0.5, h * 0.5, -w * 0.5, h);
    g.quadraticCurveTo(-w * 0.2, h * 0.7, 0, h * 0.55);
    g.quadraticCurveTo(w * 0.2, h * 0.7, w * 0.5, h);
    g.quadraticCurveTo(w * 0.5, h * 0.5, 0, -4);
  } else {
    g.moveTo(-w * 0.5 + 2, -4);
    g.quadraticCurveTo(-w * 0.25, h, 0, h - 2);
    g.quadraticCurveTo(w * 0.25, h, w * 0.5 - 2, -4);
  }
  g.closePath();
  g.fill();
  g.stroke();
}

export class DolphinArt implements SpecimenArt {
  readonly root = new Container();
  private readonly sheath = new Sheath();
  private readonly neck = new Container();
  private readonly torso: Container;
  private readonly head: Container;
  private readonly awakeHead: Container;
  private readonly limbs: { a: Fin; b: Fin; root: Container }[] = [];

  constructor(private readonly ctx: GameContext, private readonly wet?: MoistureSim) {
    this.torso = piece(ctx, 'torso', -ART['human/bubbles_torso']!.w / 2, -ART['human/bubbles_torso']!.h / 2, torsoPaint);
    this.head = piece(ctx, 'head', -8, -ART['human/bubbles_head']!.h / 2, g => headPaint(g, false));
    this.awakeHead = piece(ctx, 'head_awake', -8, -ART['human/bubbles_head_awake']!.h / 2, g => headPaint(g, true));
    this.neck.addChild(this.head, this.awakeHead);
    this.root.addChild(this.sheath.body);
    this.addLimb('flipper', Fin.Chest, Fin.FarFlipper).alpha = 0.73;
    this.addLimb('tail', Fin.Belly, Fin.Tail);
    this.addLimb('fluke', Fin.Tail, Fin.Fluke);
    this.root.addChild(this.torso);
    this.addLimb('flipper', Fin.Chest, Fin.NearFlipper);
    this.root.addChild(this.neck, this.sheath.warning, this.sheath.fuse.root);
    this.sheath.body.visible = this.sheath.warning.visible = this.sheath.fuse.root.visible = false;
  }

  private addLimb(part: string, a: Fin, b: Fin): Container {
    const root = piece(this.ctx, part, -ART['human/bubbles_' + part]!.w / 2, -5, (g, w, h) => limbPaint(g, w, h, part));
    this.limbs.push({ a, b, root });
    this.root.addChild(root);
    return root;
  }

  sync(body: Ragdoll, awake: boolean, breath: number): void {
    const cx = body.x[Fin.Chest]!;
    const cy = body.y[Fin.Chest]!;
    const bx = body.x[Fin.Belly]!;
    const by = body.y[Fin.Belly]!;
    if (this.wet) this.sheath.sync(body, this.wet, this.ctx.time, this.ctx.reducedMotion);
    this.torso.position.set((cx + bx) / 2, (cy + by) / 2);
    this.torso.rotation = Math.atan2(cy - by, cx - bx);
    this.torso.scale.set(1 - breath * 0.012, 1 + breath * 0.06);
    for (const { a, b, root } of this.limbs) {
      const x = body.x[a]!;
      const y = body.y[a]!;
      root.position.set(x, y);
      root.rotation = Math.atan2(body.y[b]! - y, body.x[b]! - x) - Math.PI / 2;
    }
    this.neck.position.set(cx, cy);
    this.neck.rotation = Math.atan2(body.y[Fin.Snout]! - cy, body.x[Fin.Snout]! - cx);
    this.head.visible = !awake;
    this.awakeHead.visible = awake;
  }
}
