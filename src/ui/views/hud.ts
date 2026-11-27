// The in-game HUD kit as Pixi components (the Canvas 2D originals are in src/ui/hud.ts until the
// migration ends). Build each piece once and add it to the view; call its `sync(...)` every frame
// with the same arguments the old draw function took. Geometry is rebuilt only when a size or a
// shape input changes; blinking outlines, jitter and fades are tint / position / alpha changes.
import { Color, Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { Shape, keyOf, roundRect } from '../../core/gfx/shapes';
import { Label, measure, type LabelStyle } from '../../core/gfx/text';
import { paintedTexture } from '../../core/gfx/textures';
import { fmt, getLang, langVersion, num, tr } from '../../i18n';
import { HUD_ROW, type FuseState, type HudIcon, type HudRect, type MeterState, type PromptGlyph } from '../hud';
import { C } from '../theme';

export { HUD_ROW };
export type { FuseState, HudIcon, HudRect, MeterState, PromptGlyph };

const PANEL_FILL = 'rgba(38,30,88,0.93)';
const TRACK = '#120d2b';
const R = 18;

const tints = new Map<string, { color: number; alpha: number }>();

/** A CSS colour as a tint number + alpha (cached: no allocation after the first call per colour). */
export function tintOf(css: string): { color: number; alpha: number } {
  let t = tints.get(css);
  if (!t) {
    const c = new Color(css);
    t = { color: c.toNumber(), alpha: c.alpha };
    tints.set(css, t);
  }
  return t;
}

/** Colour a white display object with a CSS colour (alpha included). */
function paint(o: Container, css: string): void {
  const t = tintOf(css);
  o.tint = t.color;
  o.alpha = t.alpha;
}

// ---------------------------------------------------------------- panel

/**
 * The HUD pill: drop shadow, indigo fill, outline in `accent` and an inner top highlight. Local
 * origin = the panel's top-left. `pushed` sinks the face (not the shadow) by that many px.
 */
export class HudPanel extends Container {
  private readonly body = new Shape();
  private readonly face = new Container();
  private readonly fill = new Shape();
  private readonly outline = new Shape();

  constructor() {
    super();
    this.face.addChild(this.fill, this.outline);
    this.addChild(this.body, this.face);
  }

  set(w: number, h: number, accent: string = C.ink, pushed = 0): this {
    // round 3 (Opus O3): HUD clocks call this every frame, so the closures only when the size changes
    const key = keyOf(w, h);
    if (this.body.stale(key)) this.body.redraw((g) => roundRect(g, 0, 4, w, h, R).fill('rgba(5,3,20,0.45)'));
    if (this.fill.stale(key)) this.fill.redraw((g) => {
      roundRect(g, 0, 0, w, h, R).fill(PANEL_FILL);
      g.moveTo(R, 3.5).lineTo(w - R, 3.5).stroke({ color: 'rgba(255,255,255,0.13)', width: 1.5 });
    });
    if (this.outline.stale(key)) this.outline.redraw((g) => roundRect(g, 0, 0, w, h, R).stroke({ color: '#ffffff', width: 3 }));
    paint(this.outline, accent);
    this.face.y = pushed;
    return this;
  }
}

// ---------------------------------------------------------------- meter

const METER_LABEL: LabelStyle = { size: 14, color: C.muted, weight: 900, align: 'left' };
const METER_LABEL_HOT: LabelStyle = { size: 14, color: C.red, weight: 900, align: 'left' };

/** Icon + label + bar: Suspicion (tutorial flight) and Wake (abduction). Place with `position`. */
export class HudMeter extends Container {
  private readonly panel = new HudPanel();
  private readonly eye = new Shape();
  private readonly pupil = new Graphics();
  private readonly badge = new Graphics().circle(30, 0, 17).fill(TRACK);
  /** Two little Z's that bob apart: the low one down, the high one up. */
  private readonly zLow = new Graphics().moveTo(-9, -1).lineTo(-1, -1).lineTo(-9, 9).lineTo(-1, 9).stroke({ color: '#ffffff', width: 2.6, cap: 'round', join: 'round' });
  private readonly zHigh = new Graphics().moveTo(3, -10).lineTo(9, -10).lineTo(3, -3).lineTo(9, -3).stroke({ color: '#ffffff', width: 2.6, cap: 'round', join: 'round' });
  private readonly alarm = new Container();
  private readonly caption = new Label(METER_LABEL);
  private readonly track = new Shape();
  private readonly bar = new Shape();
  private readonly gloss = new Shape();
  private readonly ticks = new Shape();
  private readonly flash = new Shape();
  constructor() {
    super();
    this.pupil.circle(0, 0, 1).fill('#ffffff');
    // awake: an exclamation mark
    this.alarm.addChild(new Graphics().roundRect(-2.6, -11, 5.2, 13, 2.4).circle(0, 8, 3).fill('#ffffff'));
    this.addChild(this.panel, this.badge, this.eye, this.pupil, this.zLow, this.zHigh, this.alarm, this.caption, this.track, this.bar, this.gloss, this.ticks, this.flash);
  }

  /** Same arguments as the old `hudMeter(g, x, y, w, h, m)`. */
  sync(x: number, y: number, w: number, h: number, m: MeterState): void {
    const hot = m.value >= m.danger || m.alarm;
    const jitter = hot && !m.reduced ? Math.sin(m.t * 50) * 2 : 0;
    this.position.set(x + jitter, y);
    const blink = m.reduced || Math.floor(m.t * 8) % 2 === 0;
    this.panel.set(w, h, hot && blink ? C.red : C.ink);

    const cy = h / 2;
    this.badge.y = cy;
    const tone = hot ? C.red : m.value >= m.warn ? C.amber : C.mint;
    const isEye = m.icon === 'eye';
    this.eye.visible = isEye;
    const open = m.value >= m.warn ? 1 : m.value > 0.02 ? 0.55 : 0.12;
    // set once to its final value: a visible flip rebuilds the render group
    this.pupil.visible = isEye && open > 0.3;
    const asleep = !isEye && !m.alarm;
    this.zLow.visible = asleep;
    this.zHigh.visible = asleep;
    this.alarm.visible = !isEye && m.alarm;
    if (isEye) {
      const lid = 2 + 8 * open;
      if (this.eye.stale(keyOf(lid, cy))) this.eye.redraw((g) =>
        g.moveTo(19, cy).quadraticCurveTo(30, cy - lid * 1.5, 41, cy).quadraticCurveTo(30, cy + lid * 1.5, 19, cy).stroke({ color: '#ffffff', width: 2.6, cap: 'round' }));
      paint(this.eye, tone);
      if (this.pupil.visible) {
        this.pupil.position.set(30, cy);
        this.pupil.scale.set(2.2 + open * 2.2);
        paint(this.pupil, tone);
      }
    } else if (m.alarm) {
      const s = m.reduced ? 1 : 1 + Math.sin(m.t * 16) * 0.12;
      this.alarm.position.set(30, cy);
      this.alarm.scale.set(s);
      paint(this.alarm, tone);
    } else {
      const d = m.reduced ? 0 : Math.sin(m.t * 2.2) * 1.2;
      this.zLow.position.set(30, cy + d);
      this.zHigh.position.set(30, cy - d);
      paint(this.zLow, tone);
      paint(this.zHigh, tone);
    }

    // squeeze long captions (« LEURRE D'ENTRAÎNEMENT ») inside the pill instead of spilling past it
    this.caption.restyle(hot ? METER_LABEL_HOT : METER_LABEL).set(m.label, 56, 19, w - 68);

    const bx = 56;
    const by = 32;
    const bw = w - 72;
    const bh = 18;
    if (this.track.stale(keyOf(bw))) this.track.redraw((g) => roundRect(g, bx, by, bw, bh, bh / 2).fill(TRACK));
    const v = m.value < 0 ? 0 : m.value > 1 ? 1 : m.value;
    const on = v > 0.005;
    this.bar.visible = on;
    this.gloss.visible = on;
    if (on) {
      const fw = Math.max(bh, bw * v);
      if (this.bar.stale(keyOf(fw))) this.bar.redraw((g) => roundRect(g, bx, by, fw, bh, bh / 2).fill('#ffffff'));
      paint(this.bar, hot ? (blink ? C.red : C.amber) : v >= m.warn ? C.amber : C.mint);
      if (this.gloss.stale(keyOf(fw))) this.gloss.redraw((g) => roundRect(g, bx + 5, by + 3, fw - 10, 5, 2.5).fill('rgba(255,255,255,0.35)'));
    }
    // threshold ticks
    if (this.ticks.stale(keyOf(bw, m.warn * 1000, m.danger * 1000))) this.ticks.redraw((g) =>
      g.rect(bx + bw * m.warn - 1, by + 3, 2, bh - 6).rect(bx + bw * m.danger - 1, by + 3, 2, bh - 6).fill('rgba(241,238,255,0.28)'));
    this.flash.visible = m.flash > 0.01;
    if (this.flash.visible) {
      if (this.flash.stale(keyOf(bw))) this.flash.redraw((g) => roundRect(g, bx - 3, by - 3, bw + 6, bh + 6, bh / 2 + 3).fill('#ffffff'));
      this.flash.alpha = Math.min(1, m.flash) * 0.75;
    }
  }
}

// ---------------------------------------------------------------- timer

const DIGIT_W = 15;
const COLON_W = 8;
const SLOTS = 8;
const TIMER_LABEL: LabelStyle = { size: 13, color: C.muted, weight: 900 };
const DIGIT: LabelStyle = { size: 24, color: C.text, weight: 800 };
const CHARS = new Map<number, string>();

function charOf(code: number): string {
  let s = CHARS.get(code);
  if (!s) {
    s = String.fromCharCode(code);
    CHARS.set(code, s);
  }
  return s;
}

/** Timer chip. Digits sit in fixed cells so the clock doesn't shimmy as numbers change. */
export class HudTimer extends Container {
  private readonly panel = new HudPanel();
  private readonly caption = new Label(TIMER_LABEL);
  private readonly digits: Label[] = [];

  constructor() {
    super();
    this.addChild(this.panel, this.caption);
    for (let i = 0; i < SLOTS; i++) {
      const d = new Label(DIGIT);
      this.digits.push(d);
      this.addChild(d);
    }
  }

  /** Same arguments as the old `hudTimer(g, x, y, w, h, time)`. */
  sync(x: number, y: number, w: number, h: number, time: string): void {
    this.position.set(x, y);
    this.panel.set(w, h);
    this.caption.set(tr().hud.time, w / 2, 19, w - 12);
    let total = 0;
    for (let i = 0; i < time.length; i++) total += time.charCodeAt(i) === 58 ? COLON_W : DIGIT_W;
    let cx = w / 2 - total / 2;
    for (let i = 0; i < SLOTS; i++) {
      const d = this.digits[i]!;
      d.visible = i < time.length;
      if (!d.visible) continue;
      const code = time.charCodeAt(i);
      const cw = code === 58 ? COLON_W : DIGIT_W;
      d.set(charOf(code), cx + cw / 2, 42);
      cx += cw;
    }
  }
}

// ---------------------------------------------------------------- button

const BTN_LABEL: LabelStyle = { size: 11, color: C.muted, weight: 900 };

/** The HUD button icons, painted once (white; 40×40, centred). */
function iconTexture(icon: HudIcon): Texture {
  return paintedTexture(`hud|icon|${icon}`, 40, 40, (g) => {
    const cx = 20;
    const cy = 20;
    g.strokeStyle = C.text;
    g.fillStyle = C.text;
    g.lineWidth = 3.4;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    if (icon === 'close') {
      g.moveTo(cx - 8, cy - 8);
      g.lineTo(cx + 8, cy + 8);
      g.moveTo(cx + 8, cy - 8);
      g.lineTo(cx - 8, cy + 8);
      g.stroke();
    } else if (icon === 'turn_left' || icon === 'turn_right') {
      // an arc over the top, head at the leading end; anticlockwise is the mirror image
      if (icon === 'turn_left') {
        g.translate(cx * 2, 0);
        g.scale(-1, 1);
      }
      const end = -0.12;
      g.arc(cx, cy + 3, 11, Math.PI + 0.12, Math.PI * 2 + end);
      g.stroke();
      const ax = cx + Math.cos(end) * 11;
      const ay = cy + 3 + Math.sin(end) * 11;
      g.beginPath();
      g.moveTo(ax - 6.5, ay - 1);
      g.lineTo(ax + 6.5, ay - 1);
      g.lineTo(ax, ay + 7);
      g.closePath();
      g.fill();
    } else {
      g.arc(cx, cy, 9.5, -0.35, Math.PI * 1.45);
      g.stroke();
      // arrow head at the open end of the arc
      const ax = cx + Math.cos(-0.35) * 9.5;
      const ay = cy + Math.sin(-0.35) * 9.5;
      g.beginPath();
      g.moveTo(ax + 5.5, ay + 4.5);
      g.lineTo(ax - 6.5, ay + 3);
      g.lineTo(ax + 2, ay - 7);
      g.closePath();
      g.fill();
    }
  });
}

/** Square-ish HUD button: vector icon over a tiny caps label. */
export class HudButton extends Container {
  private readonly panel = new HudPanel();
  private readonly icon: Sprite;
  private readonly caption = new Label(BTN_LABEL);
  private kind: HudIcon;

  constructor(icon: HudIcon) {
    super();
    this.kind = icon;
    this.icon = new Sprite(iconTexture(icon));
    this.icon.anchor.set(0.5);
    this.addChild(this.panel, this.icon, this.caption);
  }

  /** Same arguments as the old `hudButton(g, r, icon, label, pressed)`, icon last (it is set at construction). */
  sync(r: HudRect, label: string, pressed: boolean, icon: HudIcon = this.kind): void {
    if (icon !== this.kind) {
      this.kind = icon;
      this.icon.texture = iconTexture(icon);
    }
    const push = pressed ? 3 : 0;
    this.position.set(r.x, r.y);
    this.panel.set(r.w, r.h, 'rgba(170,160,220,0.65)', push);
    this.icon.position.set(r.w / 2, push + r.h / 2 - 7);
    this.caption.set(label, r.w / 2, push + r.h - 14);
  }
}

// ---------------------------------------------------------------- prompt

const promptLooks = new Map<number, LabelStyle>();

function promptLook(size: number): LabelStyle {
  let l = promptLooks.get(size);
  if (!l) {
    l = { size, color: C.ink, weight: 800 };
    promptLooks.set(size, l);
  }
  return l;
}

/** Tutorial / instruction pill: solid mint, ink text, finger glyph on the left. */
export class HudPrompt extends Container {
  private readonly pill = new Shape();
  private readonly caption = new Label(promptLook(20));
  private readonly ring = new Graphics().circle(0, 0, 15).stroke({ color: '#ffffff', width: 2.5 });
  private readonly dot = new Graphics().circle(0, 0, 1).fill('#ffffff');
  /** Last measured message and size: `measure` builds a key string, so skip it when unchanged. */
  private lastMsg = '';
  private lastSize = 0;
  private textW = 0;

  constructor() {
    super();
    this.addChild(this.pill, this.caption, this.ring, this.dot);
  }

  /** Same arguments as the old `hudPrompt(g, cx, cy, h, msg, size, glyph, t, reduced, maxW)`. */
  sync(cx: number, cy: number, h: number, msg: string, size: number, glyph: PromptGlyph, t: number, reduced: boolean, maxW = 500): void {
    if (msg !== this.lastMsg || size !== this.lastSize) {
      this.lastMsg = msg;
      this.lastSize = size;
      this.textW = measure(msg, size, 800);
    }
    const w = Math.min(maxW, this.textW + 86);
    const x = cx - w / 2;
    if (this.pill.stale(keyOf(x, cy, w, h))) this.pill.redraw((g) => {
      roundRect(g, x, cy - h / 2 + 4, w, h, h / 2).fill('rgba(5,3,20,0.45)');
      roundRect(g, x, cy - h / 2, w, h, h / 2).fill(C.mint).stroke({ color: C.ink, width: 3 });
      roundRect(g, x + 14, cy - h / 2 + 6, w - 28, h * 0.22, h * 0.11).fill('rgba(255,255,255,0.3)');
    });
    this.caption.restyle(promptLook(size)).set(msg, cx + 18, cy + 1, w - 78);

    // finger glyph
    const fx = x + 32;
    let fy = cy;
    let dx = 0;
    if (!reduced) {
      if (glyph === 'drag') fy += Math.sin(t * 4) * 6;
      else if (glyph === 'shake') dx = Math.sin(t * 18) * 5;
    }
    this.ring.visible = glyph === 'hold' || glyph === 'release';
    if (this.ring.visible) {
      this.ring.position.set(fx, fy);
      paint(this.ring, glyph === 'hold' ? C.ink : 'rgba(27,20,51,0.35)');
    }
    this.dot.position.set(fx + dx, fy);
    this.dot.scale.set(glyph === 'release' ? 8 : 11);
    paint(this.dot, glyph === 'release' ? 'rgba(27,20,51,0.35)' : C.ink);
  }
}

// ---------------------------------------------------------------- fuse

/** "0.0" .. "2.0", so the countdown never builds a string per frame. */
const TENTHS: string[] = [];
for (let i = 0; i <= 20; i++) TENTHS.push((i / 10).toFixed(1));
/** The same with a decimal comma (French). */
const TENTHS_COMMA = TENTHS.map((s) => s.replace('.', ','));

const FUSE_SEEN: LabelStyle = { size: 17, color: '#ffd9de', weight: 900, align: 'left' };
const FUSE_COOLING: LabelStyle = { size: 14, color: C.amberHi, weight: 900, align: 'left' };
const FUSE_IDLE: LabelStyle = { size: 14, color: C.muted, weight: 900, align: 'left' };
const FUSE_DIGITS: LabelStyle = { size: 22, color: C.amberHi, weight: 900, align: 'right' };
const FUSE_DIGITS_SEEN: LabelStyle = { size: 22, color: '#ffffff', weight: 900, align: 'right' };
const FUSE_UNIT: LabelStyle = { size: 14, color: C.amberHi, weight: 900, align: 'right' };
const FUSE_UNIT_SEEN: LabelStyle = { size: 14, color: '#ffd9de', weight: 900, align: 'right' };
const FUSE_CAPTION: LabelStyle = { size: 12, color: 'rgba(169,162,214,0.8)', weight: 700, align: 'right' };

/** The fuse eye's almond outline, `lid` half-open, centred on (ex, ey). */
function almond(g: Graphics, ex: number, ey: number, lid: number): Graphics {
  return g.moveTo(ex - 20, ey).quadraticCurveTo(ex, ey - lid * 1.4, ex + 20, ey).quadraticCurveTo(ex, ey + lid * 1.4, ex - 20, ey).closePath();
}

/**
 * Suspicion as a 1-second fuse: an eye that opens as the meter fills, a fuse cord that burns
 * down from the right with a spark at the burning end, and the seconds left in big digits.
 */
export class HudFuse extends Container {
  private readonly panel = new HudPanel();
  private readonly flood = new Shape();
  private readonly eyeBack = new Shape();
  private readonly eyeImg = new Sprite();
  private readonly lid = new Shape();
  private readonly lidFill = new Shape();
  private readonly irisBox = new Container();
  private readonly iris = new Graphics().circle(0, 0, 1).fill('#ffffff');
  private readonly pupil = new Graphics().circle(0, 0, 1).fill(C.ink);
  private readonly irisMask = new Shape();
  private readonly lashes = new Shape();
  private readonly status = new Label(FUSE_IDLE);
  private readonly digits = new Label(FUSE_DIGITS);
  private readonly unit = new Label(FUSE_UNIT);
  private readonly caption = new Label(FUSE_CAPTION);
  private readonly cordBack = new Shape();
  private readonly ember = new Shape();
  private readonly cord = new Shape();
  private readonly spark = new Container();
  private readonly sparkGlow = new Graphics().circle(0, 0, 1).fill('#ffffff');
  private readonly rays = new Shape();
  private readonly sparkCore = new Graphics().circle(0, 0, 4.5).fill('#fff6c9');
  private captionFor = -1;
  private captionLang = -1;

  constructor(
    private readonly eyeClosed?: Texture | null,
    private readonly eyeOpen?: Texture | null,
  ) {
    super();
    this.irisBox.addChild(this.iris, this.pupil);
    this.irisBox.mask = this.irisMask;
    this.eyeImg.anchor.set(0.5);
    this.spark.addChild(this.sparkGlow, this.rays, this.sparkCore);
    this.sparkGlow.blendMode = 'add';
    this.rays.blendMode = 'add';
    this.sparkCore.blendMode = 'add';
    this.addChild(
      this.panel, this.flood, this.eyeBack, this.eyeImg, this.lidFill, this.irisBox, this.irisMask, this.lid, this.lashes,
      this.status, this.digits, this.unit, this.caption, this.cordBack, this.ember, this.cord, this.spark,
    );
  }

  /** Same arguments as the old `hudFuse(g, x, y, w, h, f, ...)` (the eye art goes to the constructor). */
  sync(x: number, y: number, w: number, h: number, f: FuseState): void {
    const v = f.value < 0 ? 0 : f.value > 1 ? 1 : f.value;
    const hot = v > 0.6 || (f.exposed && v > 0.25);
    const jitter = hot && !f.reduced ? Math.sin(f.t * 55) * 2.5 * v : 0;
    this.position.set(x + jitter, y);
    const blink = f.reduced || Math.floor(f.t * 10) % 2 === 0;
    this.panel.set(w, h, f.exposed && blink ? C.red : hot ? C.amber : C.ink);
    // the whole chip floods red while something can see you
    this.flood.visible = f.exposed;
    if (f.exposed) {
      if (this.flood.stale(keyOf(w, h))) this.flood.redraw((g) => roundRect(g, 2, 2, w - 4, h - 4, R - 2).fill(C.red));
      this.flood.alpha = (f.reduced ? 0.3 : 0.2 + 0.2 * Math.abs(Math.sin(f.t * (8 + v * 14)))) * (0.5 + v * 0.5);
    }

    // the eye: opens with the meter
    const ex = 38;
    const ey = h / 2;
    const open = v < 0.02 ? 0 : 0.25 + 0.75 * v;
    if (this.eyeBack.stale(keyOf(ey))) this.eyeBack.redraw((g) => g.ellipse(ex, ey, 27, 20).fill(TRACK));
    const img = v > 0.55 ? this.eyeOpen : this.eyeClosed;
    const useImg = !!img && (v <= 0.02 || v > 0.55);
    this.eyeImg.visible = useImg;
    this.lid.visible = !useImg;
    this.lidFill.visible = !useImg && open > 0;
    this.irisBox.visible = !useImg && open > 0.15;
    this.irisMask.visible = this.irisBox.visible;
    this.lashes.visible = !useImg && open <= 0.15;
    if (useImg && img) {
      const s = v > 0.55 && !f.reduced ? 1 + 0.08 * Math.sin(f.t * 30) : 1;
      this.eyeImg.texture = img;
      this.eyeImg.position.set(ex, ey);
      this.eyeImg.width = 50 * s;
      this.eyeImg.height = 32 * s;
    } else {
      const lid = 2 + 13 * open;
      const tone = v > 0.6 ? C.red : v > 0.02 ? C.amber : C.mint;
      const key = keyOf(lid * 4, ey);
      if (this.lid.stale(key)) this.lid.redraw((g) => almond(g, ex, ey, lid).stroke({ color: '#ffffff', width: 3, join: 'round' }));
      paint(this.lid, tone);
      if (this.lidFill.visible && this.lidFill.stale(key)) this.lidFill.redraw((g) => almond(g, ex, ey, lid).fill('#f4efe2'));
      if (this.irisBox.visible) {
        if (this.irisMask.stale(key)) this.irisMask.redraw((g) => almond(g, ex, ey, lid).fill('#ffffff'));
        this.iris.position.set(ex, ey);
        this.iris.scale.set(4 + 4 * open);
        this.iris.tint = v > 0.6 ? 0xff5d73 : 0x3a2a6a;
        this.pupil.position.set(ex, ey);
        this.pupil.scale.set(2.2 + 1.6 * open);
      }
      if (this.lashes.visible) {
        if (this.lashes.stale(keyOf(ey))) this.lashes.redraw((g) => {
          for (let k = -1; k <= 1; k++) g.moveTo(ex + k * 9, ey + 3).lineTo(ex + k * 11, ey + 8);
          g.stroke({ color: '#ffffff', width: 2 });
        });
        paint(this.lashes, tone);
      }
    }

    const burning = v > 0.005;
    const hs = tr().hud;
    // the label keeps clear of the digits / fuse caption at the right end
    // the old code squeezed to (x + w) - (x + jitter) - 150: the jitter eats into the width
    const px = jitter;
    this.status
      .restyle(f.exposed ? FUSE_SEEN : burning ? FUSE_COOLING : FUSE_IDLE)
      .set(f.exposed ? hs.seen : burning ? hs.cooling : hs.suspicion, 74, 18, w - px - 74 - 76);
    this.digits.visible = burning;
    this.unit.visible = burning;
    this.caption.visible = !burning;
    if (burning) {
      // seconds left before SPOTTED, in tenths
      const left = Math.max(0, Math.min(20, Math.ceil((1 - v) * f.seconds * 10)));
      this.digits.restyle(f.exposed ? FUSE_DIGITS_SEEN : FUSE_DIGITS).set((getLang() === 'fr' ? TENTHS_COMMA : TENTHS)[left]!, w - 30, 19);
      this.unit.restyle(f.exposed ? FUSE_UNIT_SEEN : FUSE_UNIT).set(hs.seconds, w - 15, 21);
    } else {
      if (this.captionFor !== f.seconds || this.captionLang !== langVersion()) {
        this.captionFor = f.seconds;
        this.captionLang = langVersion();
        this.caption.set(fmt(hs.fuse, { s: num(f.seconds, f.seconds % 1 === 0 ? 1 : 2) }), w - 14, 18);
      }
    }

    // fuse cord: full length = time left; burns from the right towards the bomb (the eye)
    const bx = 76;
    const by = 42;
    const bw = w - 94;
    const left = 1 - v;
    if (this.cordBack.stale(keyOf(bw))) this.cordBack.redraw((g) => g.moveTo(bx, by).lineTo(bx + bw, by).stroke({ color: 'rgba(18,13,43,0.9)', width: 11, cap: 'round' }));
    const endX = bx + bw * left;
    this.ember.visible = burning;
    if (burning) {
      // what has burnt away: a dying ember trail (2 on, 7 off)
      const from = Math.min(bx + bw, endX + 9);
      if (this.ember.stale(keyOf(from, bw))) this.ember.redraw((g) => {
        for (let k = from; k < bx + bw; k += 9) g.moveTo(k, by).lineTo(Math.min(k + 2, bx + bw), by);
        g.stroke({ color: '#ffffff', width: 3, cap: 'round' });
      });
      this.ember.tint = f.exposed ? 0xff5d73 : 0x8a4a52;
    }
    this.cord.visible = left > 0.002;
    if (this.cord.visible) {
      if (this.cord.stale(keyOf(endX))) this.cord.redraw((g) => {
        g.moveTo(bx, by).lineTo(endX, by).stroke({ color: '#c9a574', width: 8, cap: 'round' });
        // twist marks
        for (let k = bx + 6; k < endX - 4; k += 10) g.moveTo(k, by - 3.5).lineTo(k + 4, by + 3.5);
        g.stroke({ color: '#8a6a44', width: 2, cap: 'round' });
      });
    }
    // the spark: only while it is burning (exposed or not yet cooled)
    this.spark.visible = burning;
    if (burning) {
      const fl = f.reduced ? 1 : 0.75 + 0.25 * Math.sin(f.t * 47) + (f.exposed ? 0.3 : 0);
      this.spark.position.set(endX, by);
      this.sparkGlow.scale.set(11 * fl);
      paint(this.sparkGlow, f.exposed ? 'rgba(255,120,80,0.75)' : 'rgba(255,190,110,0.5)');
      this.rays.visible = f.exposed;
      if (f.exposed) {
        // crackle: six rays turning with the clock
        if (this.rays.stale(keyOf(fl * 8))) this.rays.redraw((g) => {
          for (let k = 0; k < 6; k++) {
            const a = (k * Math.PI) / 3;
            const r1 = 13 + (k % 2) * 5 * fl;
            g.moveTo(Math.cos(a) * 7, Math.sin(a) * 7).lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          }
          g.stroke({ color: '#ffe9a8', width: 2.5, cap: 'round' });
        });
        this.rays.rotation = f.reduced ? 0 : f.t * 9;
      }
    }
  }
}

// ---------------------------------------------------------------- sunrise clock

const SUN_LABEL: LabelStyle = { size: 12, color: C.muted, weight: 900, align: 'left' };
const SUN_LABEL_HOT: LabelStyle = { size: 12, color: C.amberHi, weight: 900, align: 'left' };
const SUN_TIME: LabelStyle = { size: 22, color: C.text, weight: 800, align: 'left' };
const SUN_TIME_HOT: LabelStyle = { size: 22, color: C.amberHi, weight: 800, align: 'left' };
const DIAL = 20;

/** Sunrise clock chip: a little clock face and the time; warms up near sunrise. */
export class HudSunClock extends Container {
  private readonly panel = new HudPanel();
  private readonly warm = new Shape();
  private readonly rays = new Shape();
  private readonly face: Sprite | null;
  private readonly dial = new Graphics();
  private readonly dialHot = new Graphics();
  private readonly wedge = new Shape();
  private readonly hand = new Graphics();
  private readonly caption = new Label(SUN_LABEL);
  private readonly time = new Label(SUN_TIME);

  constructor(face?: Texture | null, private readonly clockLabel?: string, private readonly storm = false) {
    super();
    this.face = face ? new Sprite(face) : null;
    this.dial.circle(0, 0, DIAL).fill(TRACK).stroke({ color: C.muted, width: 2 });
    this.dialHot.circle(0, 0, DIAL).fill('#5a3a40').stroke({ color: C.muted, width: 2 });
    this.hand.moveTo(0, 0).lineTo(DIAL - 5, 0).stroke({ color: C.text, width: 3, cap: 'round' });
    this.rays.alpha = 0;
    this.addChild(this.panel, this.warm, this.rays);
    if (this.face) {
      this.face.anchor.set(0.5);
      this.face.width = this.face.height = (DIAL + 2) * 2;
      this.addChild(this.face);
    } else this.addChild(this.dial, this.dialHot);
    this.addChild(this.wedge, this.hand, this.caption, this.time);
  }

  /** Same arguments as the old `hudSunClock(g, x, y, w, h, time, k, dawn, t, reduced, face)` (face art goes to the constructor). */
  sync(x: number, y: number, w: number, h: number, time: string, k: number, dawn: number, t: number, reduced: boolean): void {
    this.position.set(x, y);
    const hot = dawn > 0;
    const blink = reduced || Math.floor(t * 3) % 2 === 0;
    this.panel.set(w, h, hot && blink ? C.amber : C.ink);
    const cx = 30;
    const cy = h / 2;
    this.warm.visible = hot && !this.storm;
    this.rays.visible = hot && !this.storm;
    if (hot && !this.storm) {
      // the chip itself warms up, and the sun comes up behind the dial
      if (this.warm.stale(keyOf(w, h))) this.warm.redraw((g) => roundRect(g, 2, 2, w - 4, h - 4, R - 2).fill('#ff9a55'));
      this.warm.alpha = 0.12 + 0.3 * dawn;
      if (this.rays.stale(keyOf(dawn * 20))) this.rays.redraw((g) => {
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5;
          const r1 = DIAL + 4 + (i % 2 === 0 ? 5 : 2) * dawn;
          g.moveTo(Math.cos(a) * (DIAL + 2), Math.sin(a) * (DIAL + 2)).lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
        }
        g.stroke({ color: C.amberHi, width: 3, cap: 'round' });
      });
      this.rays.position.set(cx, cy);
      this.rays.rotation = reduced ? 0 : t * 0.9;
      this.rays.alpha = 0.35 + 0.65 * dawn;
    }
    if (this.face) this.face.position.set(cx, cy);
    else {
      this.dial.position.set(cx, cy);
      this.dialHot.position.set(cx, cy);
      this.dial.visible = !hot;
      this.dialHot.visible = hot;
    }
    // the night used so far, as a wedge
    const deg = Math.round(k * 720) / 2;
    if (this.wedge.stale(keyOf(deg, hot ? 1 : 0))) this.wedge.redraw((g) => {
      if (deg <= 0) return;
      g.moveTo(0, 0).arc(0, 0, DIAL - 4, -Math.PI / 2, -Math.PI / 2 + (deg * Math.PI) / 180).closePath().fill(hot ? 'rgba(255,170,90,0.55)' : 'rgba(124,255,203,0.28)');
    });
    this.wedge.position.set(cx, cy);
    this.hand.position.set(cx, cy);
    this.hand.rotation = -Math.PI / 2 + Math.PI * 2 * k;
    // Label and digits sit on the chip's centre line so any height >= 52 keeps the 22 px digits
    // inside the border, and both squeeze to the width right of the dial.
    const tx = 58;
    const tw = Math.max(20, w - 58 - 10);
    this.caption.restyle(hot ? SUN_LABEL_HOT : SUN_LABEL).set(this.clockLabel ?? (hot ? tr().hud.sunrise : tr().hud.shift), tx, cy - 11, tw);
    this.time.restyle(hot ? SUN_TIME_HOT : SUN_TIME).set(time, tx, cy + 9, tw);
  }
}
