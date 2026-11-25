// The flash photo captures the world layer at the detection frame, then adds the witness's lens.
import { ColorMatrixFilter, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import type { Assets } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import { easeOutBack } from '../core/fx';
import { GLOW, glowTexture, Glow } from '../core/gfx/glow';
import { renderHost } from '../core/gfx/host';
import { Shape, ellipseArc, keyOf, panelPath } from '../core/gfx/shapes';
import { Label, Paragraph } from '../core/gfx/text';
import { fmt, getLang, localArt, tr, type Strings } from '../i18n';
import { clamp, roundRectPath, text } from '../ui/draw';
import { C } from '../ui/theme';
import { artSprite } from '../ui/views/art';
import type { SpotCause } from './hazards';
import { paintedSprite, plate, TAU } from './views/world';

const INK = '#1b1433';
const SKIN = '#f2c29b';
const PW = 360;
const PH = 240;
const SRC_W = 288;
const SRC_H = 192;

const CAUSES: readonly SpotCause[] = ['police', 'patrol', 'traffic', 'porch', 'watcher', 'dog', 'heli',
  'camera', 'window', 'lighthouse', 'ambulance', 'photographer', 'steward', 'hum'];
const PHOTO_LABEL = { size: 19, color: C.paperInk, weight: 800, italic: true } as const;
const CLOCK = { size: 13, color: 'rgba(255,255,255,0.9)', align: 'right', weight: 800 } as const;
const QUESTION = { size: 34, color: '#e0304e', weight: 900, italic: true } as const;
const SHOUT = { size: 26, color: C.red, weight: 900 } as const;
const STAMP = { size: 80, color: C.amberHi, outline: C.ink, weight: 900 } as const;
const CAPTION = { size: 18, color: C.paperInk, weight: 700, italic: true, align: 'center', lineHeight: 24 } as const;
const EXCUSE = { size: 16, color: C.mint, weight: 700, align: 'left', lineHeight: 21 } as const;
const BACK = { size: 13, color: C.muted, weight: 700 } as const;

function photoLabel(cause: SpotCause): string {
  return (tr().flight.photo.labels as Record<string, string>)[cause] ?? '';
}

export class SpottedPhoto {
  readonly root = new Container();
  private readonly image = new Sprite(Texture.EMPTY);
  private readonly grade = new ColorMatrixFilter();
  private readonly flash = new Glow(glowTexture(GLOW.white), true);
  private readonly mark = new Shape();
  private readonly arrow = new Graphics();
  private readonly question = new Label(QUESTION, '?!');
  private readonly lens = new Map<SpotCause, Sprite>();
  private readonly lensClock = new Label(CLOCK);
  private readonly rec = new Graphics().circle(0, 0, 6).fill('#ff3355');
  private readonly reticle = new Graphics().moveTo(-110, 0).lineTo(-30, 0).moveTo(30, 0).lineTo(110, 0)
    .moveTo(0, -96).lineTo(0, -30).moveTo(0, 30).lineTo(0, 96).stroke({ color: '#d9e6ff', width: 2 });
  private readonly hearts: Graphics[] = [];
  private readonly caption = new Label(PHOTO_LABEL);
  private texture: Texture | null = null;
  private px = PW / 2;
  private py = PH / 2;
  private lastCause: SpotCause | null = null;
  private lastClock = '';

  constructor() {
    this.grade.desaturate();
    this.grade.alpha = 0.5;
    this.image.filters = [this.grade];
    const imagePlane = new Container();
    imagePlane.position.set(-PW / 2, -PH / 2);
    const clip = new Graphics().rect(0, 0, PW, PH).fill(0xffffff);
    imagePlane.mask = clip;
    const card = new Graphics().rect(-PW / 2 - 12, -PH / 2 - 8, PW + 36, PH + 96)
      .fill('rgba(5,3,20,0.5)').rect(-PW / 2 - 18, -PH / 2 - 18, PW + 36, PH + 92).fill('#f4efe2')
      .rect(-PW / 2, -PH / 2, PW, PH).fill('#17132b');
    imagePlane.addChild(clip, this.image, this.flash);
    for (let i = 0; i < 4; i++) {
      imagePlane.addChild(new Glow(glowTexture(GLOW.dark)).place(i % 2 === 0 ? 0 : PW, i < 2 ? 0 : PH, 165, 165, 0.75));
    }
    const lang = getLang();
    const lensText = tr().flight.photo;
    for (const cause of CAUSES) {
      const layer = paintedSprite(`camera-lens|${cause}|${lang}`, PW, PH, (g) => {
        g.translate(-PW / 2, -PH / 2);
        paintLens(g, cause, lensText);
      });
      layer.position.set(PW / 2, PH / 2);
      this.lens.set(cause, layer);
      imagePlane.addChild(layer);
    }
    for (let i = 0; i < 3; i++) {
      const r = 7 + i;
      const h = new Graphics().circle(-r * 0.5, 0, r * 0.55).circle(r * 0.5, 0, r * 0.55)
        .poly([-r, r * 0.2, 0, r * 1.3, r, r * 0.2]).fill('#ff5d73');
      this.hearts.push(h);
      imagePlane.addChild(h);
    }
    imagePlane.addChild(this.reticle, this.rec, this.lensClock);
    this.root.position.set(VIEW_W / 2, 420);
    this.root.addChild(card, imagePlane, this.mark, this.arrow, this.question, this.caption);
  }

  /** Capture without the HUD or screen tints, using the world-only container in logical screen space. */
  grab(world: Container, sx: number, sy: number): void {
    this.texture?.destroy(true);
    this.texture = null;
    this.image.texture = Texture.EMPTY;
    const host = renderHost();
    const x = clamp(sx - SRC_W / 2, 0, VIEW_W - SRC_W);
    const y = clamp(sy - SRC_H / 2, 0, VIEW_H - SRC_H);
    this.px = (sx - x) / SRC_W * PW;
    this.py = (sy - y) / SRC_H * PH;
    this.image.visible = false;
    if (host) {
      this.texture = host.renderer.generateTexture({
        target: world,
        frame: new Rectangle(x, y, SRC_W, SRC_H),
        resolution: 2,
        clearColor: '#17132b',
      });
      this.image.texture = this.texture;
      this.image.width = PW;
      this.image.height = PH;
      this.image.visible = true;
    }
    this.flash.place(this.px, this.py, 165, 165, 0.4);
    this.reticle.position.set(this.px, this.py);
    this.mark.position.set(this.px - PW / 2, this.py - PH / 2);
    this.mark.invalidate();
    const x0 = this.mark.x;
    const y0 = this.mark.y;
    const sign = x0 > 0 ? -1 : 1;
    const ax = x0 + sign * 112;
    const ay = Math.max(-PH / 2 + 34, y0 - 62);
    const hx = x0 + sign * 62;
    this.arrow.clear().moveTo(ax, ay + 10).lineTo(hx, y0 - 26)
      .lineTo(x0 + sign * 80, y0 - 24).moveTo(hx, y0 - 26).lineTo(x0 + sign * 70, y0 - 42)
      .stroke({ color: '#e0304e', width: 5, cap: 'round' });
    this.question.position.set(ax, ay - 8);
  }

  sync(cause: SpotCause, st: number, t: number, rm: boolean, clock: string): void {
    const land = rm ? 1 : easeOutBack((st - 0.06) / 0.32, 1.2);
    this.root.visible = land > 0;
    if (!this.root.visible) return;
    this.root.rotation = (cause === 'dog' ? -0.13 : -0.045) + (rm ? 0 : (1 - Math.min(1, st / 0.4)) * 0.2);
    this.root.scale.set(rm ? 1 : 1.5 - 0.5 * land);
    this.root.alpha = Math.min(1, st / 0.12);
    const changed = this.lastCause !== cause;
    if (changed) {
      this.lastCause = cause;
      for (const [key, lens] of this.lens) lens.visible = key === cause;
      this.caption.set(photoLabel(cause), 0, PH / 2 + 38, PW);
      this.rec.position.set(cause === 'camera' ? 28 : 18, cause === 'camera' ? 28 : 18);
      this.reticle.visible = cause === 'heli';
    }
    if (changed || clock !== this.lastClock) {
      this.lastClock = clock;
      this.lensClock.set(fmt(tr().flight.photo.clock, { clock }), PW - (cause === 'window' ? 108 : 12), 20);
    }
    this.rec.visible = (rm || Math.floor(t * 2) % 2 === 0) &&
      (cause === 'camera' || cause === 'police' || cause === 'patrol' || cause === 'traffic');
    for (let i = 0; i < this.hearts.length; i++) {
      const h = this.hearts[i]!;
      h.visible = cause === 'window';
      if (!h.visible) continue;
      const k = rm ? 0.3 + i * 0.2 : (st * 0.7 + i * 0.33) % 1;
      h.position.set(PW - 116 + Math.sin(k * 6 + i) * 6, PH - 20 - k * 120);
      h.alpha = 1 - k;
    }
    const k = rm ? 1 : clamp((st - 0.42) / 0.3, 0, 1);
    this.mark.visible = k > 0;
    this.arrow.visible = this.question.visible = k >= 1;
    if (this.mark.visible) {
      this.mark.rotation = -0.2;
      this.mark.draw(keyOf(k * 360), (g) => ellipseArc(g, 0, 0, 66, 58, -0.4, -0.4 + TAU * 1.08 * k)
        .stroke({ color: '#e0304e', width: 5, cap: 'round' }));
    }
  }

  dispose(): void {
    this.grade.destroy();
    this.texture?.destroy(true);
  }
}

class WitnessView {
  readonly root = new Container();
  private readonly person = new Container();
  private readonly bubble = new Container();
  private readonly shout = new Label(SHOUT);
  private readonly people = new Map<SpotCause, Sprite>();
  private cause: SpotCause | null = null;

  constructor() {
    for (const cause of CAUSES) {
      const sprite = paintedSprite(`witness|${cause}`, 240, 260, (g) => {
        g.translate(0, -28);
        g.lineJoin = 'round';
        g.lineCap = 'round';
        g.lineWidth = 4;
        g.strokeStyle = INK;
        if (cause === 'camera') cctv(g, 0, true);
        else if (cause === 'dog') dogHead(g, 0, true);
        else person(g, cause, 0, true);
      });
      sprite.y = 28;
      this.people.set(cause, sprite);
      this.person.addChild(sprite);
    }
    const balloon = panelPath(new Graphics(), -262, -34, 248, 62, { fill: '#ffffff', r: 26, lineW: 4, shadow: 4 })
      .poly([-18, -8, 14, 4, -18, 12]).fill('#ffffff');
    this.shout.position.set(-138, -2);
    this.bubble.position.set(-62, -6);
    this.bubble.addChild(balloon, this.shout);
    this.root.position.set(440, 690);
    this.root.addChild(this.person, this.bubble);
  }

  sync(cause: SpotCause, k: number, t: number, rm: boolean, words: string): void {
    if (this.cause !== cause) {
      if (this.cause) this.people.get(this.cause)!.visible = false;
      this.cause = cause;
      for (const [key, sprite] of this.people) sprite.visible = key === cause;
    }
    this.root.visible = k > 0;
    if (!this.root.visible) return;
    this.person.position.set(rm ? 0 : Math.sin(t * 18) * 1.6, (1 - k) * 150);
    this.bubble.visible = k >= 0.6;
    if (!this.bubble.visible) return;
    const a = Math.min(1, (k - 0.6) / 0.3);
    this.bubble.scale.set(rm ? 1 : easeOutBack(a));
    this.bubble.alpha = Math.min(1, a * 1.5);
    this.shout.set(words, -138, -2, 224);
  }
}

export class DeepSpottedView {
  readonly root = new Container();
  readonly photo = new SpottedPhoto();
  private readonly stamp = new Container();
  private readonly witness = new WitnessView();
  private readonly caption = new Container();
  private readonly captionText = new Paragraph(CAPTION);
  private readonly excuse = new Container();
  private readonly excuseText = new Paragraph(EXCUSE);
  private readonly meter = new Graphics().rect(58, 921, VIEW_W - 116, 3).fill(C.mint);
  private readonly flash = plate('#ffffff');
  private oldCaption = '';
  private oldExcuse = '';

  constructor(assets: Assets) {
    const shade = plate('#0c061e');
    shade.alpha = 0.62;
    this.stamp.position.set(VIEW_W / 2, 166);
    this.stamp.rotation = -0.08;
    this.stamp.addChild(artSprite(assets, localArt('ui/stamp_spotted'), 300, 150) ??
      new Label(STAMP).set(tr().flight.spotted, 0, 0, 440));
    this.caption.addChild(panelPath(new Graphics(), 40, 750, VIEW_W - 80, 94,
      { fill: C.paper, r: 18, lineW: 3, shadow: 4 }), this.captionText);
    this.meter.pivot.x = 58;
    this.meter.x = 58;
    this.excuse.addChild(panelPath(new Graphics(), 40, 856, VIEW_W - 80, 74,
      { fill: C.ink, r: 18, stroke: C.mint, lineW: 2, shadow: 0 }), this.excuseText,
      new Graphics().rect(58, 921, VIEW_W - 116, 3).fill({ color: C.mint, alpha: 0.25 }), this.meter);
    this.root.addChild(shade, this.photo.root, this.stamp, this.witness.root, this.caption, this.excuse,
      new Label(BACK).set(tr().flight.backToCheckpoint, VIEW_W / 2, 944), this.flash);
  }

  sync(st: number, t: number, rm: boolean, cause: SpotCause, shout: string, caption: string, excuse: string, clock: string, hold: number): void {
    this.photo.sync(cause, st, t, rm, clock);
    const scale = rm ? 1 : easeOutBack((st - 0.04) / 0.3);
    this.stamp.scale.set(scale);
    this.stamp.visible = scale > 0;
    const wk = rm ? 1 : clamp((st - 0.22) / 0.3, 0, 1);
    this.witness.sync(cause, rm ? 1 : easeOutBack(wk, 1.1), t, rm, shout);
    this.caption.visible = st > 0.2;
    this.excuse.visible = st > 0.35;
    if (this.oldCaption !== caption) {
      this.oldCaption = caption;
      this.captionText.setBlock(caption, 60, 762, VIEW_W - 120);
    }
    if (this.oldExcuse !== excuse) {
      this.oldExcuse = excuse;
      this.excuseText.setBlock(excuse, 58, 866, VIEW_W - 116);
    }
    this.meter.scale.x = clamp(st / hold, 0, 1);
    this.flash.strength = (1 - st / 0.22) * (rm ? 0.25 : 1);
  }
}

/** Static frame of the witness's lens, in photo coordinates. */
function paintLens(g: CanvasRenderingContext2D, cause: SpotCause, words: Strings['flight']['photo']): void {
  switch (cause) {
    case 'police':
    case 'patrol':
    case 'traffic': {
      // dashboard, wheel and whatever hangs off the mirror
      g.fillStyle = '#0c0a18';
      g.beginPath();
      g.moveTo(0, PH);
      g.lineTo(0, PH - 26);
      g.quadraticCurveTo(PW / 2, PH - 52, PW, PH - 26);
      g.lineTo(PW, PH);
      g.fill();
      g.lineWidth = 12;
      g.strokeStyle = '#1e1a30';
      g.beginPath();
      g.arc(96, PH + 34, 70, Math.PI, TAU);
      g.stroke();
      if (cause === 'traffic') {
        g.strokeStyle = '#0c0a18';
        g.lineWidth = 2;
        const sw = 0;
        g.beginPath();
        g.moveTo(PW / 2, 0);
        g.lineTo(PW / 2 + sw, 40);
        g.stroke();
        g.fillStyle = '#3f9a4a';
        g.beginPath();
        g.moveTo(PW / 2 + sw, 34);
        g.lineTo(PW / 2 + sw - 13, 66);
        g.lineTo(PW / 2 + sw + 13, 66);
        g.fill();
        text(g, words.fare, PW - 12, PH - 12, 13, '#ffcf4a', 'right', 900);
      } else text(g, cause === 'police' ? words.unit4 : words.patrol2, PW - 12, PH - 12, 13, '#cfd6ff', 'right', 900);
      text(g, words.rec, 30, 19, 13, '#ffffff', 'left', 900);
      break;
    }
    case 'watcher':
      // two overlapping circles: binoculars
      mask(g, 112, PH / 2, 112, PW - 112, PH / 2, 112);
      break;
    case 'porch':
      mask(g, PW / 2, PH / 2, 140, PW / 2, PH / 2, 140);
      g.fillStyle = 'rgba(224,48,78,0.9)';
      roundRectPath(g, PW / 2 - 92, 10, 184, 24, 12);
      g.fill();
      text(g, words.motion, PW / 2, 23, 13, '#ffffff', 'center', 900);
      break;
    case 'camera': {
      g.fillStyle = 'rgba(80,255,170,0.1)';
      g.fillRect(0, 0, PW, PH);
      g.fillStyle = 'rgba(0,0,0,0.16)';
      for (let y = -6; y < PH; y += 6) g.fillRect(0, y, PW, 2);
      g.strokeStyle = '#d9fff0';
      g.lineWidth = 3;
      g.beginPath();
      for (let i = 0; i < 4; i++) {
        const x = i % 2 === 0 ? 12 : PW - 12;
        const y = i < 2 ? 12 : PH - 12;
        const dx = i % 2 === 0 ? 22 : -22;
        const dy = i < 2 ? 22 : -22;
        g.moveTo(x + dx, y);
        g.lineTo(x, y);
        g.lineTo(x, y + dy);
      }
      g.stroke();
      text(g, words.cam, 40, 29, 13, '#d9fff0', 'left', 900);
      break;
    }
    case 'heli': {
      g.fillStyle = 'rgba(120,170,255,0.12)';
      g.fillRect(0, 0, PW, PH);
      text(g, words.air, 12, 20, 13, '#d9e6ff', 'left', 900);
      text(g, words.alt, 12, PH - 14, 13, '#d9e6ff', 'left', 900);
      break;
    }
    case 'dog': {
      // too close to the lens: a nose
      const wob = 0;
      g.fillStyle = '#bb9161';
      g.beginPath();
      g.ellipse(PW / 2 + wob, PH + 8, 150, 62, 0, 0, TAU);
      g.fill();
      g.fillStyle = INK;
      g.beginPath();
      g.ellipse(PW / 2 + wob, PH - 20, 56, 38, 0, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.beginPath();
      g.ellipse(PW / 2 - 18 + wob, PH - 36, 16, 7, -0.3, 0, TAU);
      g.fill();
      break;
    }
    case 'window': {
      // filmed upright on a phone
      g.fillStyle = 'rgba(8,6,20,0.9)';
      g.fillRect(0, 0, 96, PH);
      g.fillRect(PW - 96, 0, 96, PH);
      g.fillStyle = '#e0304e';
      roundRectPath(g, 106, 10, 54, 22, 6);
      g.fill();
      text(g, words.live, 133, 22, 13, '#ffffff', 'center', 900);
      text(g, words.watching, 168, 22, 12, '#ffffff', 'left', 700);
      break;
    }
  }
}

/** Black out everything except one or two circles (even-odd fill). */
function mask(g: CanvasRenderingContext2D, ax: number, ay: number, ar: number, bx: number, by: number, br: number): void {
  g.beginPath();
  g.rect(0, 0, PW, PH);
  g.moveTo(ax + ar, ay);
  g.arc(ax, ay, ar, 0, TAU);
  if (bx !== ax || by !== ay) {
    // overlapping lenses: build the union so the overlap is not re-filled
    g.fillStyle = '#07051a';
    g.save();
    g.beginPath();
    g.rect(0, 0, PW, PH);
    g.arc(ax, ay, ar, 0, TAU, true);
    g.clip('evenodd');
    g.beginPath();
    g.rect(0, 0, PW, PH);
    g.arc(bx, by, br, 0, TAU, true);
    g.fill('evenodd');
    g.restore();
    g.lineWidth = 6;
    g.strokeStyle = '#07051a';
    g.beginPath();
    g.arc(ax, ay, ar, 0, TAU);
    g.moveTo(bx + br, by);
    g.arc(bx, by, br, 0, TAU);
    g.globalAlpha = 0.35;
    g.stroke();
    g.globalAlpha = 1;
    return;
  }
  g.fillStyle = '#07051a';
  g.fill('evenodd');
}

function shoulders(g: CanvasRenderingContext2D, fill: string): void {
  roundRectPath(g, -62, 36, 124, 150, 40);
  g.fillStyle = fill;
  g.fill();
  g.stroke();
}

function face(g: CanvasRenderingContext2D, eyes: boolean): void {
  g.beginPath();
  g.arc(0, 0, 42, 0, TAU);
  g.fillStyle = SKIN;
  g.fill();
  g.stroke();
  if (eyes) {
    for (let i = -1; i <= 1; i += 2) {
      g.beginPath();
      g.arc(i * 16 - 3, -6, 11, 0, TAU);
      g.fillStyle = '#ffffff';
      g.fill();
      g.lineWidth = 3;
      g.stroke();
      g.beginPath();
      g.arc(i * 16 - 7, -10, 4.5, 0, TAU);
      g.fillStyle = INK;
      g.fill();
    }
  }
  // mouth, wide open
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(-2, 22, 10, 11, 0, 0, TAU);
  g.fillStyle = '#7a2a3a';
  g.fill();
  g.stroke();
  g.lineWidth = 4;
}

function person(g: CanvasRenderingContext2D, cause: SpotCause, t: number, rm: boolean): void {
  switch (cause) {
    case 'hum':
      g.fillStyle = '#181522';
      g.fillRect(-30, -60, 60, 146);
      g.fillStyle = '#8b829b';
      g.fillRect(26, -60, 4, 146);
      break;
    case 'police':
    case 'patrol': {
      shoulders(g, '#2a3566');
      g.fillStyle = '#ffd27a';
      g.beginPath();
      g.arc(-30, 70, 9, 0, TAU);
      g.fill();
      g.stroke();
      face(g, true);
      // moustache
      g.beginPath();
      g.moveTo(-20, 9);
      g.quadraticCurveTo(-2, 0, 16, 9);
      g.quadraticCurveTo(-2, 16, -20, 9);
      g.fillStyle = '#5a3a2a';
      g.fill();
      g.stroke();
      // peaked cap
      g.beginPath();
      g.moveTo(-44, -18);
      g.quadraticCurveTo(-46, -60, 0, -62);
      g.quadraticCurveTo(46, -60, 44, -18);
      g.closePath();
      g.fillStyle = '#1e2750';
      g.fill();
      g.stroke();
      g.beginPath();
      g.ellipse(-8, -19, 46, 9, -0.06, 0, TAU);
      g.fillStyle = '#12183a';
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(0, -40, 8, 0, TAU);
      g.fillStyle = '#ffd27a';
      g.fill();
      g.stroke();
      break;
    }
    case 'traffic': {
      shoulders(g, '#f2c230');
      g.fillStyle = INK;
      for (let i = 0; i < 6; i++) if (i % 2 === 0) g.fillRect(-54 + i * 18, 46, 18, 12);
      face(g, true);
      g.beginPath();
      g.moveTo(-44, -14);
      g.quadraticCurveTo(-40, -52, 4, -50);
      g.quadraticCurveTo(44, -48, 42, -16);
      g.lineTo(-58, -8);
      g.closePath();
      g.fillStyle = '#6b6f86';
      g.fill();
      g.stroke();
      break;
    }
    case 'watcher': {
      shoulders(g, '#e79ac0');
      // hair in curlers
      g.fillStyle = '#c9c4dd';
      for (let i = 0; i < 5; i++) {
        const a = Math.PI + 0.25 + i * 0.66;
        g.beginPath();
        g.arc(Math.cos(a) * 40, Math.sin(a) * 40 + 2, 13, 0, TAU);
        g.fill();
        g.stroke();
      }
      face(g, false);
      // binoculars
      for (let i = -1; i <= 1; i += 2) {
        g.beginPath();
        g.arc(i * 17 - 2, -6, 16, 0, TAU);
        g.fillStyle = '#2a2438';
        g.fill();
        g.stroke();
        g.beginPath();
        g.arc(i * 17 - 2, -6, 10, 0, TAU);
        g.fillStyle = '#8fd8ff';
        g.fill();
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(i * 17 - 6, -10, 3.5, 0, TAU);
        g.fill();
      }
      break;
    }
    case 'heli': {
      shoulders(g, '#4b5a3c');
      face(g, true);
      // helmet and a boom mic
      g.beginPath();
      g.arc(0, -4, 46, Math.PI * 0.98, Math.PI * 2.02);
      g.lineTo(46, 8);
      g.lineTo(34, 8);
      g.quadraticCurveTo(0, -26, -34, 8);
      g.lineTo(-46, 8);
      g.closePath();
      g.fillStyle = '#6f7f52';
      g.fill();
      g.stroke();
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(40, 6);
      g.quadraticCurveTo(34, 34, 10, 26);
      g.stroke();
      g.beginPath();
      g.arc(10, 26, 5, 0, TAU);
      g.fillStyle = INK;
      g.fill();
      break;
    }
    case 'window': {
      shoulders(g, '#dfe6f5');
      // tie
      g.beginPath();
      g.moveTo(-8, 40);
      g.lineTo(8, 40);
      g.lineTo(12, 110);
      g.lineTo(0, 124);
      g.lineTo(-12, 110);
      g.closePath();
      g.fillStyle = '#d94c6a';
      g.fill();
      g.stroke();
      face(g, true);
      // bags under the eyes, hair on end
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(-19, 6, 9, 0.3, Math.PI - 0.3);
      g.moveTo(22, 6);
      g.arc(13, 6, 9, 0.3, Math.PI - 0.3);
      g.stroke();
      g.lineWidth = 4;
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * 1.12 + i * 0.3;
        g.moveTo(Math.cos(a) * 40, Math.sin(a) * 40);
        g.lineTo(Math.cos(a) * (54 + (i % 2) * 8), Math.sin(a) * (54 + (i % 2) * 8));
      }
      g.stroke();
      // the fourth coffee
      roundRectPath(g, 44, 26, 30, 34, 6);
      g.fillStyle = '#f4efe2';
      g.fill();
      g.stroke();
      g.lineWidth = 2.5;
      g.strokeStyle = 'rgba(255,255,255,0.7)';
      const s = rm ? 0 : Math.sin(t * 4) * 3;
      g.beginPath();
      g.moveTo(54, 20);
      g.quadraticCurveTo(48 + s, 10, 56, 0);
      g.moveTo(64, 20);
      g.quadraticCurveTo(70 - s, 10, 62, 0);
      g.stroke();
      break;
    }
    default: {
      // the neighbour, in pyjamas and a nightcap
      roundRectPath(g, -62, 36, 124, 150, 40);
      g.fillStyle = '#6f8fd8';
      g.fill();
      g.save();
      g.clip();
      g.fillStyle = '#e8eefc';
      for (let k = -62; k < 62; k += 24) g.fillRect(k + 6, 36, 9, 150);
      g.restore();
      g.stroke();
      face(g, true);
      const bob = rm ? 0 : Math.sin(t * 6) * 5;
      g.beginPath();
      g.moveTo(-44, -14);
      g.quadraticCurveTo(0, -84, 46, -16);
      g.quadraticCurveTo(84, -28, 92, 8 + bob);
      g.quadraticCurveTo(64, -40, 28, -32);
      g.closePath();
      g.fillStyle = '#d94c6a';
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(93, 12 + bob, 10, 0, TAU);
      g.fillStyle = '#ffffff';
      g.fill();
      g.stroke();
    }
  }
}

function dogHead(g: CanvasRenderingContext2D, t: number, rm: boolean): void {
  const flap = rm ? 0 : Math.sin(t * 16) * 0.25;
  // ears
  for (let i = -1; i <= 1; i += 2) {
    g.save();
    g.translate(i * 34, -22);
    g.rotate(i * (0.5 + flap));
    g.beginPath();
    g.ellipse(0, 24, 15, 30, 0, 0, TAU);
    g.fillStyle = '#895e55';
    g.fill();
    g.stroke();
    g.restore();
  }
  g.beginPath();
  g.arc(0, 0, 42, 0, TAU);
  g.fillStyle = '#bb9161';
  g.fill();
  g.stroke();
  // muzzle, nose, tongue
  g.beginPath();
  g.ellipse(0, 18, 26, 20, 0, 0, TAU);
  g.fillStyle = '#e5cc9f';
  g.fill();
  g.stroke();
  g.beginPath();
  g.ellipse(0, 28, 9, 12, 0, 0, TAU);
  g.fillStyle = '#e8748a';
  g.fill();
  g.stroke();
  g.beginPath();
  g.ellipse(0, 6, 10, 7, 0, 0, TAU);
  g.fillStyle = INK;
  g.fill();
  for (let i = -1; i <= 1; i += 2) {
    g.beginPath();
    g.arc(i * 17, -12, 9, 0, TAU);
    g.fillStyle = '#ffffff';
    g.fill();
    g.lineWidth = 3;
    g.stroke();
    g.beginPath();
    g.arc(i * 17 - 2, -15, 4, 0, TAU);
    g.fillStyle = INK;
    g.fill();
  }
  // paws on the edge of the caption card
  g.lineWidth = 4;
  for (let i = -1; i <= 1; i += 2) {
    g.beginPath();
    g.ellipse(i * 44, 56, 16, 11, 0, 0, TAU);
    g.fillStyle = '#e5cc9f';
    g.fill();
    g.stroke();
  }
}

function cctv(g: CanvasRenderingContext2D, t: number, rm: boolean): void {
  // a camera on its bracket, nodding
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(20, 150);
  g.lineTo(20, 34);
  g.stroke();
  g.lineWidth = 5;
  g.strokeStyle = '#8f93a8';
  g.stroke();
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.rotate(rm ? -0.2 : -0.2 + Math.sin(t * 5) * 0.12);
  roundRectPath(g, -58, -28, 104, 56, 12);
  g.fillStyle = '#c9cbd8';
  g.fill();
  g.stroke();
  roundRectPath(g, -74, -20, 22, 40, 6);
  g.fillStyle = '#2a2438';
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(-64, 0, 9, 0, TAU);
  g.fillStyle = '#8fd8ff';
  g.fill();
  g.beginPath();
  g.arc(30, -12, 6, 0, TAU);
  g.fillStyle = rm || Math.floor(t * 4) % 2 === 0 ? '#ff3355' : '#6a2030';
  g.fill();
}
