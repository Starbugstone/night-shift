// v4 specimens: retained PixiJS 8 bust portraits for the Specimen Archive (Room 3), with idle
// animations (blink, look sideways, yawn, gentle breath) driven by `figurePose` and honouring
// `reducedMotion`, plus crisp dark-lavender silhouettes and the archive summary badge.
// Built once; `sync()` touches only transform & alpha properties (zero per-frame allocations).
import { Container, Sprite, type Texture } from 'pixi.js';
import type { Assets } from '../../contracts';
import { ART, RETIRED_ART } from '../../art-manifest';
import { apeFallback } from '../../abduct/monolith-art';
import { INK } from '../../abduct/views/pieces';
import { paintedTexture } from '../../core/gfx/textures';
import { figurePose, figureSeed, newFigurePose, type FigureBeat } from '../../flight/pickup-pose';
import { C } from '../theme';
import { artSprite } from './art';
import { crestValleyPortrait } from './crest-valley-portrait';

const TAU = Math.PI * 2;
const SILHOUETTE_COLOR = '#463c7a';
const SPECIMEN_PATTERN: readonly FigureBeat[] = ['look', 'yawn', 'look', 'actA', 'actB'] as const;

/** Logical footprint of a specimen bust at scale 1 (humans/apes are portrait; Bubbles is landscape). */
export function specimenFootprint(id: string): readonly [number, number] {
  return id === 'bubbles' ? [146, 94] : [84, 114];
}

/** Uniform scale so a specimen bust fits comfortably inside `maxW × maxH`. */
export function specimenFitScale(id: string, maxW: number, maxH: number, maxScale = 1.6): number {
  const [w, h] = specimenFootprint(id);
  return Math.min(maxW / w, maxH / h, maxScale);
}

/** Fit dimensions for still silhouettes inside `maxW × maxH`. */
export function specimenFitSize(id: string, maxW: number, maxH: number, maxScale = 1.6): { w: number; h: number } {
  const [aw, ah] = specimenFootprint(id);
  const s = Math.min(maxW / aw, maxH / ah, maxScale);
  return { w: Math.max(12, Math.round(aw * s)), h: Math.max(12, Math.round(ah * s)) };
}

function hasLoaded(img: HTMLImageElement | undefined): img is HTMLImageElement {
  return !!img && img.complete && (img.naturalWidth > 0 || img.width > 0);
}

/** Paint a fallback human bust torso when `human/<id>_torso` SVG is unavailable. */
function paintFallbackTorso(g: CanvasRenderingContext2D, w: number, h: number): void {
  g.save();
  g.lineWidth = Math.max(2, w * 0.045);
  g.strokeStyle = INK;
  g.fillStyle = '#5a76b8';
  g.beginPath();
  g.roundRect(w * 0.1, h * 0.04, w * 0.8, h * 0.92, [w * 0.34, w * 0.34, w * 0.24, w * 0.24]);
  g.fill();
  g.stroke();
  // Collar detail
  g.fillStyle = '#dce6f2';
  g.beginPath();
  g.moveTo(w * 0.35, h * 0.06);
  g.lineTo(w * 0.5, h * 0.38);
  g.lineTo(w * 0.65, h * 0.06);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}

/** Paint a fallback human head when `human/<id>_head[_awake]` SVG is unavailable. */
function paintFallbackHead(g: CanvasRenderingContext2D, w: number, h: number, awake: boolean): void {
  g.save();
  g.lineWidth = Math.max(2, w * 0.05);
  g.strokeStyle = INK;
  g.lineCap = 'round';
  g.fillStyle = '#e8ba98';
  g.beginPath();
  g.roundRect(w * 0.16, h * 0.12, w * 0.68, h * 0.78, w * 0.3);
  g.fill();
  g.stroke();
  // Hair cap
  g.fillStyle = '#5a4468';
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.22, w * 0.34, h * 0.16, 0, Math.PI, TAU);
  g.fill();
  g.stroke();
  // Eyes
  g.fillStyle = INK;
  if (awake) {
    for (const ex of [0.44, 0.68]) {
      g.fillStyle = '#ffedc9';
      g.beginPath();
      g.ellipse(w * ex, h * 0.46, w * 0.085, h * 0.085, 0, 0, TAU);
      g.fill();
      g.stroke();
      g.fillStyle = INK;
      g.beginPath();
      g.arc(w * (ex + 0.015), h * 0.46, w * 0.032, 0, TAU);
      g.fill();
    }
    g.beginPath();
    g.ellipse(w * 0.58, h * 0.72, w * 0.08, h * 0.075, 0, 0, TAU);
    g.fillStyle = '#76434c';
    g.fill();
    g.stroke();
  } else {
    g.beginPath();
    g.moveTo(w * 0.36, h * 0.48);
    g.quadraticCurveTo(w * 0.44, h * 0.53, w * 0.51, h * 0.48);
    g.moveTo(w * 0.6, h * 0.48);
    g.quadraticCurveTo(w * 0.67, h * 0.53, w * 0.74, h * 0.48);
    g.stroke();
    g.beginPath();
    g.ellipse(w * 0.58, h * 0.72, w * 0.05, h * 0.04, 0, 0, TAU);
    g.fill();
  }
  g.restore();
}

/** Paint a fallback dolphin torso (horizontal, dorsal fin on top). */
function paintFallbackDolphinTorso(g: CanvasRenderingContext2D, w: number, h: number): void {
  g.save();
  g.lineWidth = Math.max(2, h * 0.05);
  g.strokeStyle = INK;
  // Dorsal fin
  g.fillStyle = '#4a5f8a';
  g.beginPath();
  g.moveTo(w * 0.48, h * 0.28);
  g.quadraticCurveTo(w * 0.42, h * 0.02, w * 0.24, h * 0.04);
  g.quadraticCurveTo(w * 0.3, h * 0.2, w * 0.28, h * 0.34);
  g.closePath();
  g.fill();
  g.stroke();
  // Torso body
  g.fillStyle = '#647899';
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.56, w * 0.46, h * 0.34, 0, 0, TAU);
  g.fill();
  g.stroke();
  // Pale belly
  g.fillStyle = '#c9d3e2';
  g.beginPath();
  g.ellipse(w * 0.54, h * 0.7, w * 0.38, h * 0.16, 0, 0, Math.PI);
  g.fill();
  g.restore();
}

/** Paint a fallback dolphin head (snout pointing right). */
function paintFallbackDolphinHead(g: CanvasRenderingContext2D, w: number, h: number, awake: boolean): void {
  g.save();
  g.lineWidth = Math.max(2, h * 0.055);
  g.strokeStyle = INK;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.fillStyle = '#647899';
  g.beginPath();
  g.moveTo(w * 0.06, h * 0.18);
  g.quadraticCurveTo(w * 0.44, h * 0.04, w * 0.68, h * 0.3);
  g.quadraticCurveTo(w * 0.96, h * 0.4, w * 0.96, h * 0.56);
  g.quadraticCurveTo(w * 0.96, h * 0.74, w * 0.68, h * 0.8);
  g.quadraticCurveTo(w * 0.4, h * 0.94, w * 0.06, h * 0.88);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = INK;
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.42, w * 0.055, awake ? h * 0.08 : h * 0.025, 0, 0, TAU);
  g.fill();
  if (awake) {
    g.fillStyle = '#76434c';
    g.beginPath();
    g.ellipse(w * 0.74, h * 0.72, w * 0.09, h * 0.09, 0, 0, TAU);
    g.fill();
    g.stroke();
  }
  g.restore();
}

/**
 * Cropped upper-bust torso texture (top 54% of `human/<id>_torso` with soft rounded bottom taper)
 * painted once via `paintedTexture` so cards need zero Pixi masks.
 */
function torsoBustTexture(assets: Assets, id: string, w: number, h: number): Texture {
  const key = `human/${id}_torso`;
  const img = assets.get(key);
  const ready = hasLoaded(img);
  const spec = ART[key] ?? RETIRED_ART[key] ?? { w: 80, h: 120 };
  return paintedTexture(`specimen|bust-torso|${ready ? 1 : 0}|${id}|${w}x${h}`, w, h, (g, ww, hh) => {
    g.save();
    // Rounded bust pedestal crop so shoulders read cleanly inside every vitrine without a Pixi mask
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(ww, 0);
    g.lineTo(ww, hh * 0.72);
    g.quadraticCurveTo(ww, hh, ww * 0.5, hh);
    g.quadraticCurveTo(0, hh, 0, hh * 0.72);
    g.closePath();
    g.clip();
    if (ready && img) {
      // Draw full torso aspect-matched to ww so top ~52% fills the bust height
      const drawH = ww * (spec.h / spec.w);
      try {
        g.drawImage(img, 0, -hh * 0.04, ww, drawH);
      } catch {
        paintFallbackTorso(g, ww, hh);
      }
    } else {
      paintFallbackTorso(g, ww, hh);
    }
    g.restore();
  });
}

function makeHeadNode(assets: Assets, id: string, awake: boolean, w: number, h: number): Container {
  const key = awake ? `human/${id}_head_awake` : `human/${id}_head`;
  const art = artSprite(assets, key, w, h)
    ?? apeFallback(key, w, h)
    ?? (!awake ? crestValleyPortrait(key, w, h) : null);
  if (art) return art;
  const fallbackTex = paintedTexture(`specimen|head-fb|${id}|${awake ? 1 : 0}|${Math.round(w)}x${Math.round(h)}`, Math.max(16, Math.round(w)), Math.max(16, Math.round(h)), (g, ww, hh) => {
    if (id === 'bubbles') paintFallbackDolphinHead(g, ww, hh, awake);
    else paintFallbackHead(g, ww, hh, awake);
  });
  const spr = new Sprite(fallbackTex);
  spr.anchor.set(0.5);
  spr.width = w;
  spr.height = h;
  return spr;
}

/**
 * Retained Pixi bust portrait for a collected specimen (humans, apes, and Bubbles the dolphin).
 * Driven by `figurePose` (`src/flight/pickup-pose.ts`): blinks via alpha (never visible), looks
 * sideways, yawns, and breathes gently. Zero per-frame allocations; honours `reducedMotion`.
 */
export class SpecimenFigure {
  readonly root = new Container();
  private readonly torso = new Container();
  private readonly flipper: Container | null = null;
  private readonly head = new Container();
  private readonly headOpen: Container;
  private readonly headShut: Container;
  private readonly pose = newFigurePose();
  private readonly seed: number;
  private readonly isDolphin: boolean;
  private readonly baseHeadX: number;
  private readonly baseHeadY: number;
  private readonly baseTorsoX: number;
  private readonly baseTorsoY: number;

  constructor(assets: Assets, readonly id: string, private readonly k = 1) {
    this.seed = figureSeed(`specimen:${id}`);
    this.isDolphin = id === 'bubbles';

    if (this.isDolphin) {
      // Bubbles: horizontal dolphin bust (torso with dorsal fin + chest flipper + snout head)
      const tw = 86 * k;
      const th = 72 * k;
      const torsoArt = artSprite(assets, 'human/bubbles_torso', tw, th);
      if (torsoArt) {
        this.torso.addChild(torsoArt);
      } else {
        const fb = new Sprite(paintedTexture(`specimen|dolphin-torso|${Math.round(tw)}x${Math.round(th)}`, Math.max(16, Math.round(tw)), Math.max(16, Math.round(th)), (g, ww, hh) => {
          paintFallbackDolphinTorso(g, ww, hh);
        }));
        fb.anchor.set(0.5);
        fb.width = tw;
        fb.height = th;
        this.torso.addChild(fb);
      }
      this.baseTorsoX = -26 * k;
      this.baseTorsoY = 4 * k;
      this.torso.position.set(this.baseTorsoX, this.baseTorsoY);

      const flipArt = artSprite(assets, 'human/bubbles_flipper', 22 * k, 42 * k);
      if (flipArt) {
        this.flipper = new Container();
        flipArt.position.set(0, 14 * k);
        this.flipper.addChild(flipArt);
        this.flipper.position.set(-10 * k, 18 * k);
        this.flipper.rotation = -0.35;
      }

      const hw = 78 * k;
      const hh = 52 * k;
      this.headOpen = makeHeadNode(assets, id, true, hw, hh);
      this.headShut = makeHeadNode(assets, id, false, hw, hh);
      // Pivot near neck on left side of the horizontal head sprite
      this.headOpen.position.set(hw * 0.36, 0);
      this.headShut.position.set(hw * 0.36, 0);
      this.headShut.alpha = 0;
      this.head.addChild(this.headOpen, this.headShut);
      this.baseHeadX = 2 * k;
      this.baseHeadY = -2 * k;
      this.head.position.set(this.baseHeadX, this.baseHeadY);

      this.root.addChild(this.torso);
      if (this.flipper) this.root.addChild(this.flipper);
      this.root.addChild(this.head);
    } else {
      // Humans & apes: shoulders/torso bust + neck-pivoted head with blink/look/yawn
      const tw = Math.round(78 * k);
      const th = Math.round(52 * k);
      const torsoSpr = new Sprite(torsoBustTexture(assets, id, Math.max(20, tw), Math.max(16, th)));
      torsoSpr.anchor.set(0.5, 0.14);
      torsoSpr.width = tw;
      torsoSpr.height = th;
      this.torso.addChild(torsoSpr);
      this.baseTorsoX = 0;
      this.baseTorsoY = 16 * k;
      this.torso.position.set(this.baseTorsoX, this.baseTorsoY);

      const hw = 68 * k;
      const hh = 78 * k;
      this.headOpen = makeHeadNode(assets, id, true, hw, hh);
      this.headShut = makeHeadNode(assets, id, false, hw, hh);
      // Neck pivot at bottom-centre of head so tilts and yawns look anatomical
      this.headOpen.position.set(0, -hh * 0.44);
      this.headShut.position.set(0, -hh * 0.44);
      this.headShut.alpha = 0;
      this.head.addChild(this.headOpen, this.headShut);
      this.baseHeadX = 0;
      this.baseHeadY = 18 * k;
      this.head.position.set(this.baseHeadX, this.baseHeadY);

      this.root.addChild(this.torso, this.head);
    }
  }

  sync(t: number, reduced: boolean): void {
    const k = this.k;
    const pose = figurePose(t, this.seed, reduced, this.pose, SPECIMEN_PATTERN);

    if (reduced) {
      this.torso.position.set(this.baseTorsoX, this.baseTorsoY);
      this.torso.rotation = 0;
      this.torso.scale.set(1);
      this.head.position.set(this.baseHeadX, this.baseHeadY);
      this.head.rotation = 0;
      this.head.scale.set(1);
      if (this.flipper) this.flipper.rotation = -0.35;
      // Calm slow blink only under reduced motion (via alpha, never visible)
      const blink = pose.lid > 0.55;
      this.headOpen.alpha = blink ? 0 : 1;
      this.headShut.alpha = blink ? 1 : 0;
      return;
    }

    const breath = Math.sin(t * 2.0 + this.seed * 0.13) * 0.5 + 0.5;
    const { lookX, yawn, actA, actB, wobble } = pose;

    if (this.isDolphin) {
      const bob = Math.sin(t * 2.2 + this.seed) * 2.2 * k;
      this.torso.position.set(this.baseTorsoX, this.baseTorsoY + bob);
      this.torso.rotation = Math.sin(t * 1.6 + this.seed) * 0.04 + lookX * 0.05;
      this.torso.scale.set(1 + breath * 0.02 + yawn * 0.04, 1 - breath * 0.015 + yawn * 0.04);
      if (this.flipper) this.flipper.rotation = -0.35 + Math.sin(t * 2.6 + this.seed) * 0.14 - actA * 0.25;
      this.head.position.set(this.baseHeadX + lookX * 2.2 * k, this.baseHeadY + bob - yawn * 2.5 * k);
      this.head.rotation = lookX * 0.1 - yawn * 0.18 + actA * 0.08 + wobble * 0.06;
      this.head.scale.set(1 + yawn * 0.04, 1 + yawn * 0.06);
      // Dolphin: smiling closed-mouth head (`headShut`) blinks/rests; wide squeaking beak (`headOpen`) opens on yawn/actA or normally alert
      const shut = pose.lid > 0.45 && yawn < 0.2;
      this.headOpen.alpha = shut ? 0 : 1;
      this.headShut.alpha = shut ? 1 : 0;
    } else {
      this.torso.position.set(this.baseTorsoX, this.baseTorsoY - breath * 0.8 * k);
      this.torso.rotation = lookX * 0.038 + actA * 0.028;
      this.torso.scale.set(1 + breath * 0.022 + yawn * 0.055, 1 - breath * 0.014 + yawn * 0.045);

      this.head.position.set(
        this.baseHeadX + lookX * 4.2 * k,
        this.baseHeadY - breath * 1.3 * k - yawn * 3.6 * k,
      );
      this.head.rotation = lookX * 0.11 - yawn * 0.15 + actA * 0.085 + wobble * 0.065;
      const sx = 1 - Math.abs(lookX) * 0.045 - yawn * 0.04 + actB * 0.02;
      const sy = 1 + yawn * 0.085 - actB * 0.02;
      this.head.scale.set(sx, sy);

      // Blink uses alpha on pre-built head sprites (never toggles visible); yawn keeps open mouth visible
      const shut = pose.lid > 0.45 && yawn < 0.2;
      this.headOpen.alpha = shut ? 0 : 1;
      this.headShut.alpha = shut ? 1 : 0;
    }
  }
}

/** Crisp dark-lavender still silhouette of a specimen bust (never animated) for uncollected slots. */
export function specimenSilhouetteTexture(assets: Assets, id: string, w: number, h: number): Texture {
  const headKey = `human/${id}_head`;
  const torsoKey = `human/${id}_torso`;
  const headImg = assets.get(headKey);
  const torsoImg = assets.get(torsoKey);
  const hasH = hasLoaded(headImg);
  const hasT = hasLoaded(torsoImg);
  const isDolphin = id === 'bubbles';
  const [fw, fh] = specimenFootprint(id);

  return paintedTexture(`specimen|sil|${hasH ? 1 : 0}${hasT ? 1 : 0}|${id}|${w}x${h}`, w, h, (g, ww, hh) => {
    const s = Math.min(ww / fw, hh / fh);
    g.save();
    g.translate(ww / 2, hh / 2);
    g.scale(s, s);

    if (isDolphin) {
      if (hasT && torsoImg) {
        try { g.drawImage(torsoImg, -26 - 43, 4 - 36, 86, 72); } catch {
          g.save(); g.translate(-69, -32); paintFallbackDolphinTorso(g, 86, 72); g.restore();
        }
      } else {
        g.save(); g.translate(-69, -32); paintFallbackDolphinTorso(g, 86, 72); g.restore();
      }
      if (hasH && headImg) {
        try { g.drawImage(headImg, -8, -28, 78, 52); } catch {
          g.save(); g.translate(-8, -28); paintFallbackDolphinHead(g, 78, 52, false); g.restore();
        }
      } else {
        g.save(); g.translate(-8, -28); paintFallbackDolphinHead(g, 78, 52, false); g.restore();
      }
    } else {
      // Torso bust cropped nicely
      g.save();
      g.beginPath();
      g.moveTo(-39, 9);
      g.lineTo(39, 9);
      g.lineTo(39, 44);
      g.quadraticCurveTo(39, 58, 0, 58);
      g.quadraticCurveTo(-39, 58, -39, 44);
      g.closePath();
      g.clip();
      if (hasT && torsoImg) {
        const spec = ART[torsoKey] ?? RETIRED_ART[torsoKey] ?? { w: 80, h: 120 };
        try { g.drawImage(torsoImg, -39, 7, 78, 78 * (spec.h / spec.w)); } catch {
          g.save(); g.translate(-39, 9); paintFallbackTorso(g, 78, 50); g.restore();
        }
      } else {
        g.save(); g.translate(-39, 9); paintFallbackTorso(g, 78, 50); g.restore();
      }
      g.restore();

      // Head
      if (hasH && headImg) {
        try { g.drawImage(headImg, -34, -55, 68, 78); } catch {
          g.save(); g.translate(-34, -55); paintFallbackHead(g, 68, 78, false); g.restore();
        }
      } else {
        g.save(); g.translate(-34, -55); paintFallbackHead(g, 68, 78, false); g.restore();
      }
    }

    g.restore();
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = SILHOUETTE_COLOR;
    g.fillRect(0, 0, ww, hh);
    g.globalCompositeOperation = 'source-over';
  });
}

/** Crisp Bureau specimen dossier badge icon for the Room 3 summary bar. */
export function specimenBadgeTexture(size: number, color: string = C.mint): Texture {
  return paintedTexture(`icon|specimen-badge|${size}|${color}`, size, size, (g, w, h) => {
    const s = Math.min(w, h);
    g.save();
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.lineWidth = Math.max(2, s * 0.075);
    g.strokeStyle = C.ink;
    // Dossier card frame
    g.fillStyle = color;
    g.beginPath();
    g.roundRect(s * 0.14, s * 0.1, s * 0.72, s * 0.8, s * 0.14);
    g.fill();
    g.stroke();
    // Bust silhouette inside card
    g.fillStyle = C.ink;
    g.beginPath();
    g.arc(s * 0.5, s * 0.38, s * 0.14, 0, TAU);
    g.fill();
    g.beginPath();
    g.moveTo(s * 0.27, s * 0.76);
    g.quadraticCurveTo(s * 0.27, s * 0.56, s * 0.5, s * 0.56);
    g.quadraticCurveTo(s * 0.73, s * 0.56, s * 0.73, s * 0.76);
    g.closePath();
    g.fill();
    g.restore();
  });
}
