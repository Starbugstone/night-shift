// L5: Bubbles the dolphin, drawn on her 7-joint body plan (src/abduct/body-plan.ts) with the
// `human/bubbles_*` sprites, a primitive fallback for each part, and the moisture sheath
// (docs/GDD-3-new-shifts.md L5): two fat round-capped strokes along the spine, Ice outside and
// pale water blue inside, thinner as she dries; a dashed amber outline below 25 %; the red fuse
// ring once she is dry. Allocation-free per frame.
import { ART } from '../art-manifest';
import type { GameContext } from '../contracts';
import { Fin } from './body-plan';
import { MOISTURE, type MoistureSim } from './moisture';
import type { Ragdoll } from './ragdoll';

const INK = '#1a162b';
const ICE = '#d4ecf5';
const WATER = '#8fc3e0';
const SLATE = '#55667f';
const DENIM = '#4a5f8a';
const MIST = '#c9d3e2';
const AMBER = '#ffd081';
const RED = '#ff697d';
const TAU = Math.PI * 2;
const LOW_DASH = [10, 9];
const NO_DASH: number[] = [];
/** Spine from snout to fluke, for the sheath strokes. */
const SPINE = [Fin.Snout, Fin.Chest, Fin.Belly, Fin.Tail, Fin.Fluke] as const;
/** Red fuse ring radius round the chest (matches the camera fuse ring in deep-view). */
const FUSE_R = 70;

interface Part {
  key: string;
  w: number;
  h: number;
}

function part(key: string): Part {
  const spec = ART[key];
  return { key, w: spec?.w ?? 60, h: spec?.h ?? 60 };
}

/** Anything that draws a specimen on its ragdoll (HumanArt, DolphinArt). */
export interface SpecimenArt {
  draw(g: CanvasRenderingContext2D, body: Ragdoll, awake: boolean, breath?: number): void;
}

export class DolphinArt implements SpecimenArt {
  private readonly head = part('human/bubbles_head');
  private readonly headAwake = part('human/bubbles_head_awake');
  private readonly torso = part('human/bubbles_torso');
  private readonly tail = part('human/bubbles_tail');
  private readonly fluke = part('human/bubbles_fluke');
  private readonly flipper = part('human/bubbles_flipper');

  constructor(private readonly ctx: GameContext, private readonly wet?: MoistureSim) {}

  draw(g: CanvasRenderingContext2D, body: Ragdoll, awake: boolean, breath = 0): void {
    const wet = this.wet;
    if (wet) this.sheath(g, body, wet);
    g.save();
    g.globalAlpha *= 0.73;
    this.limb(g, body, this.flipper, Fin.Chest, Fin.FarFlipper);
    g.restore();
    this.limb(g, body, this.tail, Fin.Belly, Fin.Tail);
    this.limb(g, body, this.fluke, Fin.Tail, Fin.Fluke);
    this.body(g, body, breath);
    this.limb(g, body, this.flipper, Fin.Chest, Fin.NearFlipper);
    this.snout(g, body, awake ? this.headAwake : this.head, awake);
    if (wet) this.tells(g, body, wet);
  }

  /** The water sheath, under the body: width shrinks with moisture. */
  private sheath(g: CanvasRenderingContext2D, body: Ragdoll, wet: MoistureSim): void {
    const level = wet.level;
    if (level <= 0.01) return;
    g.save();
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    for (let i = 0; i < SPINE.length; i++) {
      const j = SPINE[i]!;
      if (i === 0) g.moveTo(body.x[j]!, body.y[j]!);
      else g.lineTo(body.x[j]!, body.y[j]!);
    }
    g.globalAlpha = 0.5;
    g.strokeStyle = ICE;
    g.lineWidth = 30 + 52 * level;
    g.stroke();
    g.globalAlpha = 0.55;
    g.strokeStyle = WATER;
    g.lineWidth = 22 + 38 * level;
    g.stroke();
    g.restore();
  }

  /** Amber dashed outline when low, the red fuse ring once dry. Honest: drawn exactly on the state. */
  private tells(g: CanvasRenderingContext2D, body: Ragdoll, wet: MoistureSim): void {
    const rm = this.ctx.reducedMotion;
    if (wet.low && wet.level > 0) {
      const beat = rm ? 1 : 0.55 + 0.45 * Math.sin(this.ctx.time * 9);
      g.save();
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.setLineDash(LOW_DASH);
      g.lineDashOffset = rm ? 0 : -this.ctx.time * 30;
      g.globalAlpha = beat;
      g.strokeStyle = AMBER;
      g.lineWidth = 4;
      g.beginPath();
      // outline: a loop just outside the spine strokes, offset along each segment's normal
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < SPINE.length; i++) {
          const k = side < 0 ? i : SPINE.length - 1 - i;
          const j = SPINE[k]!;
          const a = SPINE[Math.max(0, k - 1)]!;
          const b = SPINE[Math.min(SPINE.length - 1, k + 1)]!;
          const dx = body.x[b]! - body.x[a]!;
          const dy = body.y[b]! - body.y[a]!;
          const d = Math.hypot(dx, dy) || 1;
          const r = body.radii[j]! + 14;
          const x = body.x[j]! - (dy / d) * r * side;
          const y = body.y[j]! + (dx / d) * r * side;
          if (side < 0 && i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
      }
      g.closePath();
      g.stroke();
      g.setLineDash(NO_DASH);
      g.restore();
    }
    if (wet.level <= 0 && wet.fuse > 0) {
      const left = 1 - wet.fuse / MOISTURE.fuse;
      const cx = body.chestX;
      const cy = body.chestY;
      g.save();
      g.lineCap = 'round';
      g.beginPath();
      g.arc(cx, cy, FUSE_R, 0, TAU);
      g.lineWidth = 11;
      g.strokeStyle = INK;
      g.globalAlpha = 0.6;
      g.stroke();
      g.globalAlpha = 1;
      if (left > 0.003) {
        g.beginPath();
        g.arc(cx, cy, FUSE_R, -Math.PI / 2, -Math.PI / 2 + TAU * left);
        g.lineWidth = 7;
        g.strokeStyle = RED;
        g.stroke();
      }
      g.restore();
    }
  }

  /** Chest + belly, dorsal fin up: centred between the two, nose toward the chest. */
  private body(g: CanvasRenderingContext2D, body: Ragdoll, breath: number): void {
    const cx = body.x[Fin.Chest]!;
    const cy = body.y[Fin.Chest]!;
    const bx = body.x[Fin.Belly]!;
    const by = body.y[Fin.Belly]!;
    const p = this.torso;
    g.save();
    g.translate((cx + bx) * 0.5, (cy + by) * 0.5);
    g.rotate(Math.atan2(cy - by, cx - bx));
    if (breath !== 0) g.scale(1 - breath * 0.012, 1 + breath * 0.06);
    const image = this.ctx.assets.get(p.key);
    if (image) {
      g.drawImage(image, -p.w / 2, -p.h / 2, p.w, p.h);
    } else {
      g.lineWidth = 3;
      g.strokeStyle = INK;
      // dorsal fin
      g.beginPath();
      g.moveTo(-6, -30);
      g.quadraticCurveTo(-10, -52, -26, -54);
      g.quadraticCurveTo(-22, -40, -24, -28);
      g.closePath();
      g.fillStyle = DENIM;
      g.fill();
      g.stroke();
      // body: slate back, mist belly
      g.beginPath();
      g.ellipse(0, 0, p.w / 2, p.h * 0.4, 0, 0, TAU);
      g.fillStyle = SLATE;
      g.fill();
      g.stroke();
      g.beginPath();
      g.ellipse(4, p.h * 0.13, p.w * 0.42, p.h * 0.2, 0, 0, Math.PI);
      g.fillStyle = MIST;
      g.fill();
      g.globalAlpha *= 0.6;
      g.beginPath();
      g.ellipse(14, -p.h * 0.2, p.w * 0.2, 4, -0.15, 0, TAU);
      g.fillStyle = ICE;
      g.fill();
    }
    g.restore();
  }

  /** Snout + melon, from the chest out to the snout joint. */
  private snout(g: CanvasRenderingContext2D, body: Ragdoll, p: Part, awake: boolean): void {
    const x = body.x[Fin.Chest]!;
    const y = body.y[Fin.Chest]!;
    const sx = body.x[Fin.Snout]!;
    const sy = body.y[Fin.Snout]!;
    g.save();
    g.translate(x, y);
    g.rotate(Math.atan2(sy - y, sx - x));
    const image = this.ctx.assets.get(p.key);
    const left = -8;
    if (image) {
      g.drawImage(image, left, -p.h / 2, p.w, p.h);
    } else {
      g.lineWidth = 3;
      g.strokeStyle = INK;
      g.beginPath();
      g.moveTo(left, -24);
      g.quadraticCurveTo(26, -34, 46, -14);
      g.quadraticCurveTo(66, -8, 80, -2);
      g.quadraticCurveTo(84, 6, 74, 8);
      g.quadraticCurveTo(40, 16, left, 22);
      g.closePath();
      g.fillStyle = SLATE;
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(44, 6);
      g.quadraticCurveTo(60, 12, 76, 6);
      g.strokeStyle = INK;
      g.lineWidth = 2.5;
      g.stroke();
      // one eye shut, one half-lidded (asleep); both wide awake
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
    g.restore();
  }

  /** Tail stock, fluke, flippers: joint at the sprite's top-centre, hanging along the bone. */
  private limb(g: CanvasRenderingContext2D, body: Ragdoll, p: Part, a: number, b: number): void {
    const x = body.x[a]!;
    const y = body.y[a]!;
    g.save();
    g.translate(x, y);
    g.rotate(Math.atan2(body.y[b]! - y, body.x[b]! - x) - Math.PI / 2);
    const image = this.ctx.assets.get(p.key);
    if (image) {
      g.drawImage(image, -p.w / 2, -5, p.w, p.h);
    } else {
      g.lineWidth = 3;
      g.strokeStyle = INK;
      g.fillStyle = p === this.flipper ? DENIM : SLATE;
      g.beginPath();
      if (p === this.fluke) {
        g.moveTo(0, -4);
        g.quadraticCurveTo(-p.w * 0.5, p.h * 0.5, -p.w * 0.5, p.h);
        g.quadraticCurveTo(-p.w * 0.2, p.h * 0.7, 0, p.h * 0.55);
        g.quadraticCurveTo(p.w * 0.2, p.h * 0.7, p.w * 0.5, p.h);
        g.quadraticCurveTo(p.w * 0.5, p.h * 0.5, 0, -4);
      } else {
        g.moveTo(-p.w * 0.5 + 2, -4);
        g.quadraticCurveTo(-p.w * 0.25, p.h, 0, p.h - 2);
        g.quadraticCurveTo(p.w * 0.25, p.h, p.w * 0.5 - 2, -4);
      }
      g.closePath();
      g.fill();
      g.stroke();
    }
    g.restore();
  }
}
