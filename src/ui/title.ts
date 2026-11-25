import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { Scene } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import { easeOutBack, easeOutCubic } from '../core/fx';
import { GLOW, Glow, ScreenTint, glowTexture } from '../core/gfx/glow';
import { ViewSlot, type SceneView } from '../core/gfx/scene';
import { Shape, ellipseArc } from '../core/gfx/shapes';
import { Label, measure } from '../core/gfx/text';
import { paintedTexture } from '../core/gfx/textures';
import type { Shell } from '../core/shell';
import { C } from './theme';
import { Button } from './widgets';
import { artSprite } from './views/art';
import { NightSky, Skyline } from './views/backdrop';
import { ButtonView } from './views/button';
import { SpeakerIcon } from './views/icons';
import { fmt, getLang, langVersion, localArt, tr, type Lang } from '../i18n';
import { trophyProgress } from './trophy-data';

/** Moon, top-left; the logo box spans y 130..330 and its built-in saucer sits top-right. */
export const MOON = { x: 92, y: 84, r: 40 };
/** Where the beam meets the rooftops. */
const BEAM_FLOOR = VIEW_H - 150;
const SAUCER_Y = 446;

/** Slow cloud bands behind the logo: x, y, half-width, half-height, drift speed. */
const CLOUDS = [
  [60, 150, 190, 26, 7],
  [380, 96, 150, 20, -5],
  [300, 392, 230, 30, 4],
  [120, 540, 170, 22, -6],
] as const;

export class TitleScene implements Scene {
  t = 0;
  readonly start = new Button(110, 640, 320, 92, '', 'primary', 36);
  readonly trophies = new Button(135, 748, 270, 58, '', 'secondary', 21);
  readonly mute = new Button(VIEW_W - 92, VIEW_H - 92, 68, 68, '', 'ghost');
  /** Language toggle, bottom right beside the speaker: the active language is lit. */
  readonly langs: ReadonlyArray<{ lang: Lang; b: Button }> = [
    { lang: 'en', b: new Button(VIEW_W - 92 - 14 - 68 - 8 - 68, VIEW_H - 92, 68, 68, 'EN', 'ghost', 22) },
    { lang: 'fr', b: new Button(VIEW_W - 92 - 14 - 68, VIEW_H - 92, 68, 68, 'FR', 'ghost', 22) },
  ];
  readonly taglineSeed = Math.random();
  private labelsFor = -1;
  private readonly look = new ViewSlot(() => new TitleView(this));

  constructor(readonly shell: Shell) {}

  get view(): Container {
    return this.look.get().root;
  }

  update(dt: number): void {
    this.t += dt;
    const p = this.shell.ctx.pointer;
    if (this.mute.update(p, dt)) this.shell.toggleMute();
    for (const { lang, b } of this.langs) if (b.update(p, dt, this.shell.audio) && lang !== getLang()) this.shell.setLanguage(lang);
    this.relabel();
    if (this.start.update(p, dt, this.shell.audio)) this.shell.toWorkOrders();
    if (this.trophies.update(p, dt, this.shell.audio)) this.shell.toTrophies('title');
  }

  /** Button labels and toggle state follow the language. */
  relabel(): void {
    if (this.labelsFor === langVersion()) return;
    this.labelsFor = langVersion();
    const s = tr();
    this.start.label = s.title.clockIn;
    const prog = trophyProgress(this.shell.save);
    this.trophies.label = fmt(s.trophies.buttonCount, { n: prog.found, max: prog.total });
    for (const { lang, b } of this.langs) {
      b.kind = lang === getLang() ? 'secondary' : 'ghost';
      b.label = lang === 'en' ? 'EN' : 'FR';
    }
  }

  render(): void {
    this.look.peek()?.sync();
  }

  dispose(): void {
    this.look.destroy();
  }
}

// ---------------------------------------------------------------- view

const BUREAU = { size: 16, color: C.muted, weight: 800 } as const;
const TAGLINE = { size: 21, color: C.text, weight: 700, outline: C.night } as const;
const BUILD = { size: 15, color: 'rgba(169,162,214,0.6)', weight: 500, align: 'left' } as const;
const LOGO = { size: 76, color: C.mint, weight: 900, outline: C.ink } as const;
const LOGO_SUB = { size: 32, color: C.amberHi, weight: 800, outline: C.ink } as const;
const ZZ_SMALL = { size: 15, color: C.mint, weight: 900, align: 'left' } as const;
const ZZ_BIG = { size: 20, color: C.mint, weight: 900, align: 'left' } as const;

class TitleView implements SceneView {
  readonly root = new Container();
  private readonly sky = new NightSky();
  private readonly clouds: Glow[] = [];
  private readonly shootingStar = new Graphics().moveTo(0, 0).lineTo(46, -16).stroke({ color: '#ffffff', width: 2.5, cap: 'round' });
  private readonly skyline = new Skyline(VIEW_H);
  private readonly beam = new TitleBeam();
  private readonly sleeper = new Container();
  private readonly zz: Container;
  private readonly saucer = new SideSaucer();
  private readonly logo = new Container();
  private logoFor = -1;
  private readonly bureau = new Label(BUREAU);
  private readonly rules = new Shape();
  private readonly tagline = new Label(TAGLINE);
  private readonly startGlow = new Glow(glowTexture(GLOW.mint), true);
  private readonly startPop = new Container();
  private readonly startBtn: ButtonView;
  private readonly trophiesBtn: ButtonView;
  private readonly vignette = ScreenTint.vignette();
  private readonly muteBtn: ButtonView;
  private readonly speaker = new SpeakerIcon(C.text);
  private readonly langBtns: ButtonView[];
  private readonly build = new Label(BUILD);

  constructor(private readonly s: TitleScene) {
    const r = this.root;
    r.addChild(this.sky);

    // moon with a halo: top-left, clear of the logo's own saucer (top-right of the logo art)
    r.addChild(new Glow(glowTexture('246,237,201'), true).place(MOON.x, MOON.y, 150, 150, 0.3));
    r.addChild(
      new Graphics()
        .circle(MOON.x, MOON.y, MOON.r)
        .fill('#f6edc9')
        .circle(MOON.x - 13, MOON.y - 9, 8)
        .circle(MOON.x + 14, MOON.y + 13, 5)
        .circle(MOON.x - 6, MOON.y + 20, 3.5)
        .fill('#e4d9ae'),
    );

    // drifting cloud bands: two blobs each
    const cloud = glowTexture('92,84,170');
    for (let i = 0; i < CLOUDS.length * 2; i++) {
      const g = new Glow(cloud);
      this.clouds.push(g);
      r.addChild(g);
    }
    r.addChild(this.shootingStar, this.skyline, this.beam, this.sleeper, this.saucer);

    // tonight's specimen, fast asleep on the way up
    const body = new Sprite(sleeperTexture());
    body.anchor.set(SLEEPER_OX / SLEEPER_W, SLEEPER_OY / SLEEPER_H);
    this.sleeper.addChild(body);
    const zz = new Container();
    zz.addChild(new Label(ZZ_SMALL, 'z').set('z', 26, -38), new Label(ZZ_BIG, 'Z').set('Z', 36, -52));
    r.addChild(zz);
    this.zz = zz;

    r.addChild(this.logo, this.rules, this.bureau, this.tagline, this.startGlow, this.startPop);
    this.startBtn = new ButtonView(s.start);
    this.startPop.addChild(this.startBtn);
    const b = s.start;
    this.startPop.pivot.set(b.x + b.w / 2, b.y + b.h / 2);
    this.startPop.position.set(b.x + b.w / 2, b.y + b.h / 2);

    this.trophiesBtn = new ButtonView(s.trophies);
    this.muteBtn = new ButtonView(s.mute);
    this.langBtns = s.langs.map(({ b: lb }) => new ButtonView(lb));
    r.addChild(this.vignette, this.trophiesBtn, this.muteBtn, this.speaker, ...this.langBtns, this.build);
    this.vignette.strength = 0.7;
  }

  /** The logo art is lettered per language (ui/logo_fr from scripts/art-fr.mjs). */
  private buildLogo(): void {
    if (this.logoFor === langVersion()) return;
    this.logoFor = langVersion();
    for (const c of this.logo.removeChildren()) c.destroy();
    const { assets } = this.s.shell.ctx;
    const str = tr().title;
    const local = artSprite(assets, localArt('ui/logo'), 480, 200);
    if (local) {
      this.logo.addChild(local);
      return;
    }
    const en = getLang() !== 'en' ? artSprite(assets, 'ui/logo', 480, 200) : null;
    if (en) {
      // no local logo yet: keep the English wordmark, repaint its ribbon
      const ribbon = new Sprite(ribbonTexture(str.logoSub));
      ribbon.position.set(-240, -100);
      this.logo.addChild(en, ribbon);
      return;
    }
    this.logo.addChild(new Label(LOGO).set(str.logo, 0, -22, 480), new Label(LOGO_SUB).set(str.logoSub, 0, 46, 440));
  }

  sync(): void {
    const s = this.s;
    const rm = s.shell.ctx.reducedMotion;
    const t = s.t;
    const str = tr().title;
    s.relabel();
    this.sky.sync(t, rm);

    for (let i = 0; i < CLOUDS.length; i++) {
      const [x, y, rx, ry, speed] = CLOUDS[i]!;
      const span = VIEW_W + rx * 2;
      const cx = ((((x + (rm ? 0 : t * speed)) % span) + span) % span) - rx;
      this.clouds[i * 2]!.place(cx, y, rx, ry, 0.34);
      this.clouds[i * 2 + 1]!.place(cx + rx * 0.45, y + ry * 0.5, rx * 0.7, ry * 0.8, 0.26);
    }

    // a shooting star now and then
    const c = t % 7.5;
    this.shootingStar.visible = !rm && c < 0.55;
    if (this.shootingStar.visible) {
      const k = c / 0.55;
      this.shootingStar.position.set(470 - k * 260, 40 + k * 90);
      this.shootingStar.alpha = Math.sin(Math.PI * k);
    }
    this.skyline.sync(t);

    // saucer drifting over the town with its beam down on a rooftop
    const sx = VIEW_W / 2 + (rm ? 0 : Math.sin(t * 0.6) * 120);
    const sy = SAUCER_Y + (rm ? 0 : Math.sin(t * 2.1) * 8);
    this.beam.sync(sx, sy, t, rm);
    const hang = sy + 86 + (rm ? 0 : Math.sin(t * 1.7) * 7);
    this.sleeper.position.set(sx, hang);
    this.sleeper.rotation = rm ? 0.15 : Math.sin(t * 0.9) * 0.28;
    this.zz.position.set(sx, hang);
    // side-view saucer to match the side-view skyline (the flight sprite is top-down)
    this.saucer.sync(sx, sy, t, rm);

    // logo drops in
    this.buildLogo();
    const drop = rm ? 1 : easeOutBack(t / 0.55, 1.2);
    this.logo.position.set(VIEW_W / 2, 230 + (rm ? 0 : Math.sin(t * 1.3) * 4) - (1 - drop) * 260);

    const fade = rm ? 1 : easeOutCubic((t - 0.35) / 0.4);
    this.bureau.set(str.bureau, VIEW_W / 2, 362, 380);
    this.bureau.alpha = fade;
    // rules either side of the bureau line, clear of its (language-dependent) width
    const half = Math.min(190, measure(str.bureau, 16, 800) / 2);
    this.rules.draw(half, (g) => g.rect(VIEW_W / 2 - half - 48, 361, 34, 2).rect(VIEW_W / 2 + half + 14, 361, 34, 2).fill(C.muted));
    this.rules.alpha = fade * 0.5;
    const tags = str.taglines;
    this.tagline.set(tags[Math.floor(s.taglineSeed * tags.length)]!, VIEW_W / 2, 600, VIEW_W - 40);
    this.tagline.alpha = fade;

    // the one button, breathing a little so the thumb knows where to go
    const pop = rm ? 1 : easeOutBack((t - 0.45) / 0.4);
    const on = pop > 0.02;
    this.startPop.visible = on;
    this.startGlow.visible = on;
    if (on) {
      const b = s.start;
      const breathe = rm ? 0 : Math.sin(t * 2.6);
      this.startGlow.place(b.x + b.w / 2, b.y + b.h / 2 + 4, 230 + breathe * 12, 96 + breathe * 6, 0.3 + breathe * 0.06);
      this.startPop.scale.set(pop * (1 + breathe * 0.012));
      this.startBtn.sync();
    }
    this.trophiesBtn.alpha = fade;
    this.trophiesBtn.sync();
    this.muteBtn.sync();
    this.speaker.set(s.mute.x + 30, s.mute.y + 34, s.shell.save.muted);
    for (const v of this.langBtns) v.sync();
    this.build.set(str.build, 24, VIEW_H - 30, s.langs[0]!.b.x - 36);
  }
}

// ---------------------------------------------------------------- beam

/** One beam pass: a trapezoid filled with the beam's top-to-floor gradient, top width ±26k. */
function beamTexture(k: number): Texture {
  const w = Math.ceil(96 * k * 2 + 4);
  const h = BEAM_FLOOR - (SAUCER_Y + 14);
  return paintedTexture(`title|beam|${k}`, w, h, (g) => {
    const grad = g.createLinearGradient(0, -14, 0, h);
    grad.addColorStop(0, 'rgba(124,255,203,0.5)');
    grad.addColorStop(0.55, 'rgba(124,255,203,0.2)');
    grad.addColorStop(0.9, 'rgba(124,255,203,0.07)');
    grad.addColorStop(1, 'rgba(124,255,203,0)');
    g.fillStyle = grad;
    const c = w / 2;
    g.beginPath();
    g.moveTo(c - 26 * k, 0);
    g.lineTo(c + 26 * k, 0);
    g.lineTo(c + 96 * k, h);
    g.lineTo(c - 96 * k, h);
    g.closePath();
    g.fill();
  }, 1);
}

/** Additive beam with a bright core, a pool on the rooftops and motes on the way up. */
class TitleBeam extends Container {
  private readonly passes: Sprite[] = [];
  private readonly pool = new Glow(glowTexture(GLOW.mint), true);
  private readonly mouth = new Glow(glowTexture(GLOW.mint), true);
  private readonly motes: Sprite[] = [];

  constructor() {
    super();
    for (const k of [1, 0.45]) {
      const p = new Sprite(beamTexture(k));
      p.anchor.set(0.5, 1);
      p.blendMode = 'add';
      this.passes.push(p);
      this.addChild(p);
    }
    this.addChild(this.pool, this.mouth);
    for (let i = 0; i < 12; i++) {
      const m = new Sprite(Texture.WHITE);
      m.width = m.height = 2.5;
      m.tint = 0xeafff4;
      m.blendMode = 'add';
      this.motes.push(m);
      this.addChild(m);
    }
  }

  sync(sx: number, sy: number, t: number, rm: boolean): void {
    const flicker = rm ? 1 : 0.9 + 0.1 * Math.sin(t * 5);
    const len = BEAM_FLOOR - (sy + 14);
    for (let i = 0; i < 2; i++) {
      const p = this.passes[i]!;
      p.position.set(sx, BEAM_FLOOR);
      p.height = len;
      p.alpha = flicker * (i === 0 ? 0.85 : 0.6);
    }
    this.pool.place(sx, BEAM_FLOOR, 130, 26, 0.5 * flicker);
    this.mouth.place(sx, sy + 16, 50, 20, 0.8);
    for (let i = 0; i < 12; i++) {
      const k = (((i * 0.618 + (rm ? 0 : t * (0.16 + (i % 3) * 0.03))) % 1) + 1) % 1;
      const spread = 24 + (1 - k) * 66;
      const off = ((i * 0.381) % 1) - 0.5;
      const m = this.motes[i]!;
      m.position.set(sx + off * spread * 2, BEAM_FLOOR - k * (BEAM_FLOOR - sy - 20));
      m.alpha = 0.25 + k * 0.5;
    }
  }
}

// ---------------------------------------------------------------- side saucer

const RIM = 7;

/** Side-on flying saucer: hull, rim lights, glass dome with Zib inside (who blinks). */
class SideSaucer extends Container {
  private readonly eyesOpen: Graphics;
  private readonly eyesShut: Graphics;
  private readonly lights: Graphics[] = [];
  private readonly glows: Glow[] = [];

  constructor() {
    super();
    // dome glass behind Zib
    const dome = new Graphics();
    ellipseArc(dome, 0, -14, 36, 34, Math.PI, 0).closePath().fill('rgba(124,255,203,0.55)');
    const zib = new Graphics().ellipse(0, -30, 14, 13).fill('#7fd27a');
    this.eyesOpen = new Graphics().ellipse(-5, -32, 3.5, 4.5).ellipse(5, -32, 3.5, 4.5).fill(C.ink);
    this.eyesShut = new Graphics().ellipse(-5, -32, 3.5, 0.8).ellipse(5, -32, 3.5, 0.8).fill(C.ink);
    const glass = new Graphics();
    ellipseArc(glass, 0, -14, 27, 26, Math.PI * 1.12, Math.PI * 1.36).stroke({ color: 'rgba(255,255,255,0.6)', width: 3, cap: 'round' });
    ellipseArc(glass, 0, -14, 36, 34, Math.PI, 0).stroke({ color: C.ink, width: 4, join: 'round' });
    const hull = new Graphics()
      .ellipse(0, 0, 86, 24)
      .fill('#9fb3d6');
    ellipseArc(hull, 0, 8, 70, 13, 0, Math.PI).closePath().fill('#7b8db3');
    hull.ellipse(-8, -11, 56, 6).fill('rgba(255,255,255,0.3)').ellipse(0, 0, 86, 24).stroke({ color: C.ink, width: 4 });
    this.addChild(dome, zib, this.eyesOpen, this.eyesShut, glass, hull);
    for (let i = 0; i < RIM; i++) {
      const lx = -60 + i * 20;
      const ly = 4 - Math.abs(i - 3) * 1.5;
      const dot = new Graphics().circle(lx, ly, 5).fill('#ffffff');
      const glow = new Glow(glowTexture(GLOW.amber), true).place(lx, ly, 14, 14, 0.6);
      this.lights.push(dot);
      this.glows.push(glow);
    }
    // all dots, then all glows: interleaved, each additive glow split the batch twice (14 draw calls)
    this.addChild(...this.lights, ...this.glows);
  }

  sync(x: number, y: number, t: number, rm: boolean): void {
    this.position.set(x, y);
    const shut = !rm && t % 3.3 < 0.12;
    this.eyesOpen.alpha = shut ? 0 : 1;
    this.eyesShut.alpha = shut ? 1 : 0;
    // rim lights chase round
    for (let i = 0; i < RIM; i++) {
      const on = rm ? i % 2 === 0 : Math.floor(t * 6 + i) % 3 === 0;
      this.lights[i]!.tint = on ? 0xffd27a : 0x4a4470;
      // chase with alpha: a visible flip rebuilds the render group
      this.glows[i]!.alpha = on ? 0.6 : 0;
    }
  }
}

// ---------------------------------------------------------------- painted pieces

const SLEEPER_W = 70;
const SLEEPER_H = 112;
/** The sleeper's hang point inside its texture. */
const SLEEPER_OX = 30;
const SLEEPER_OY = 58;

/** Small sleeper in a nightcap, limp in the beam: a dark teal silhouette with a mint rim. */
function sleeperTexture(): Texture {
  return paintedTexture('title|sleeper', SLEEPER_W, SLEEPER_H, (g) => {
    g.translate(SLEEPER_OX, SLEEPER_OY);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      g.strokeStyle = pass === 0 ? 'rgba(124,255,203,0.9)' : '#173a40';
      g.fillStyle = g.strokeStyle;
      const grow = pass === 0 ? 4 : 0;
      // arms and legs hanging down
      g.lineWidth = 8 + grow;
      g.beginPath();
      g.moveTo(-12, -2);
      g.lineTo(-22, 16);
      g.moveTo(12, -2);
      g.lineTo(20, 17);
      g.moveTo(-6, 16);
      g.lineTo(-11, 38);
      g.moveTo(6, 16);
      g.lineTo(9, 39);
      g.stroke();
      // body and head
      g.lineWidth = 22 + grow;
      g.beginPath();
      g.moveTo(0, -4);
      g.lineTo(0, 14);
      g.stroke();
      g.beginPath();
      g.arc(0, -24, 12 + grow / 2, 0, Math.PI * 2);
      g.fill();
      // nightcap, flopped to one side
      g.lineWidth = 7 + grow;
      g.beginPath();
      g.moveTo(-9, -32);
      g.quadraticCurveTo(4, -48, 20, -34);
      g.stroke();
      g.beginPath();
      g.arc(22, -31, 4 + grow / 2, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/**
 * The logo's department ribbon, repainted with `label`: same shape and transforms as
 * public/art/ui/logo.svg (a 480×200 texture laid over the logo's box).
 */
function ribbonTexture(label: string): Texture {
  return paintedTexture(`title|ribbon|${label}`, 480, 200, (g) => {
    g.translate(2, -10);
    g.scale(1.012, 1.085);
    g.translate(240, 153);
    g.rotate((-4 * Math.PI) / 180);
    g.translate(-240, -153);
    g.lineJoin = 'round';
    g.lineWidth = 3.5;
    g.strokeStyle = C.ink;
    g.beginPath();
    g.moveTo(94, 134);
    g.lineTo(384, 134);
    g.lineTo(367, 170);
    g.lineTo(77, 170);
    g.closePath();
    g.fillStyle = '#ffbd68';
    g.fill();
    g.stroke();
    g.fillStyle = '#b56b49';
    g.beginPath();
    g.arc(101, 152, 3, 0, Math.PI * 2);
    g.moveTo(364, 152);
    g.arc(361, 152, 3, 0, Math.PI * 2);
    g.fill();
    g.font = '700 25px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.fillStyle = C.ink;
    g.fillText(label, 229, 160, 244);
  });
}
