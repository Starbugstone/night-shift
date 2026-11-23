import type { Scene } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import { GLOW, drawGlow, drawVignette, easeOutBack, easeOutCubic } from '../core/fx';
import type { Shell } from '../core/shell';
import { outlinedText, sprite, text } from './draw';
import { C } from './theme';
import { Button, drawNightSky, drawSkyline, drawSpeaker } from './widgets';
import { getLang, langVersion, localArt, tr, type Lang } from '../i18n';

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
  private t = 0;
  private readonly start = new Button(110, 640, 320, 92, '', 'primary', 36);
  private readonly mute = new Button(VIEW_W - 92, VIEW_H - 92, 68, 68, '', 'ghost');
  /** Language toggle, bottom right beside the speaker: the active language is lit. */
  private readonly langs: ReadonlyArray<{ lang: Lang; b: Button }> = [
    { lang: 'en', b: new Button(VIEW_W - 92 - 14 - 68 - 8 - 68, VIEW_H - 92, 68, 68, 'EN', 'ghost', 22) },
    { lang: 'fr', b: new Button(VIEW_W - 92 - 14 - 68, VIEW_H - 92, 68, 68, 'FR', 'ghost', 22) },
  ];
  private readonly taglineSeed = Math.random();
  private labelsFor = -1;
  private beamGrad: CanvasGradient | null = null;

  constructor(private readonly shell: Shell) {}

  update(dt: number): void {
    this.t += dt;
    const p = this.shell.ctx.pointer;
    if (this.mute.update(p, dt)) this.shell.toggleMute();
    for (const { lang, b } of this.langs) if (b.update(p, dt, this.shell.audio) && lang !== getLang()) this.shell.setLanguage(lang);
    this.relabel();
    if (this.start.update(p, dt, this.shell.audio)) this.shell.toWorkOrders();
  }

  /** Button labels and toggle state follow the language. */
  private relabel(): void {
    if (this.labelsFor === langVersion()) return;
    this.labelsFor = langVersion();
    const s = tr();
    this.start.label = s.title.clockIn;
    for (const { lang, b } of this.langs) {
      b.kind = lang === getLang() ? 'secondary' : 'ghost';
      b.label = lang === 'en' ? 'EN' : 'FR';
    }
  }

  render(g: CanvasRenderingContext2D): void {
    const { ctx } = this.shell;
    const rm = ctx.reducedMotion;
    const t = this.t;
    drawNightSky(g, t, rm);

    // moon with a halo: top-left, clear of the logo's own saucer (top-right of the logo art)
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, '246,237,201', MOON.x, MOON.y, 150, 150, 0.3);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#f6edc9';
    g.beginPath();
    g.arc(MOON.x, MOON.y, MOON.r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#e4d9ae';
    g.beginPath();
    g.arc(MOON.x - 13, MOON.y - 9, 8, 0, Math.PI * 2);
    g.moveTo(MOON.x + 19, MOON.y + 13);
    g.arc(MOON.x + 14, MOON.y + 13, 5, 0, Math.PI * 2);
    g.moveTo(MOON.x - 2.5, MOON.y + 20);
    g.arc(MOON.x - 6, MOON.y + 20, 3.5, 0, Math.PI * 2);
    g.fill();

    // drifting cloud bands
    for (const [x, y, rx, ry, speed] of CLOUDS) {
      const span = VIEW_W + rx * 2;
      const cx = ((((x + (rm ? 0 : t * speed)) % span) + span) % span) - rx;
      drawGlow(g, '92,84,170', cx, y, rx, ry, 0.34);
      drawGlow(g, '92,84,170', cx + rx * 0.45, y + ry * 0.5, rx * 0.7, ry * 0.8, 0.26);
    }

    // a shooting star now and then
    if (!rm) {
      const c = t % 7.5;
      if (c < 0.55) {
        const k = c / 0.55;
        const x = 470 - k * 260;
        const y = 40 + k * 90;
        g.globalAlpha = Math.sin(Math.PI * k);
        g.strokeStyle = '#ffffff';
        g.lineWidth = 2.5;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 46, y - 16);
        g.stroke();
        g.lineCap = 'butt';
        g.globalAlpha = 1;
      }
    }

    drawSkyline(g, t, VIEW_H);

    // saucer drifting over the town with its beam down on a rooftop
    const sx = VIEW_W / 2 + (rm ? 0 : Math.sin(t * 0.6) * 120);
    const sy = SAUCER_Y + (rm ? 0 : Math.sin(t * 2.1) * 8);
    this.beam(g, sx, sy, rm);
    // side-view saucer to match the side-view skyline (the flight sprite is top-down)
    drawSideSaucer(g, sx, sy, t, rm);

    // logo drops in
    const drop = rm ? 1 : easeOutBack(t / 0.55, 1.2);
    const ly = 230 + (rm ? 0 : Math.sin(t * 1.3) * 4) - (1 - drop) * 260;
    const s = tr();
    if (sprite(g, ctx.assets, localArt('ui/logo'), VIEW_W / 2, ly, 480, 200)) {
      // the logo art is lettered per language (ui/logo_fr from scripts/art-fr.mjs)
    } else if (getLang() !== 'en' && sprite(g, ctx.assets, 'ui/logo', VIEW_W / 2, ly, 480, 200)) {
      // no local logo yet: keep the English wordmark, repaint its ribbon
      drawLogoRibbon(g, VIEW_W / 2 - 240, ly - 100, s.title.logoSub);
    } else {
      outlinedText(g, s.title.logo, VIEW_W / 2, ly - 22, 76, C.mint, C.ink, 900, 'center', 480);
      outlinedText(g, s.title.logoSub, VIEW_W / 2, ly + 46, 32, C.amberHi, C.ink, 800, 'center', 440);
    }
    const fade = rm ? 1 : easeOutCubic((t - 0.35) / 0.4);
    g.globalAlpha = fade;
    text(g, s.title.bureau, VIEW_W / 2, 362, 16, C.muted, 'center', 800, false, 380);
    // rules either side of the bureau line, clear of its (language-dependent) width
    const half = Math.min(190, g.measureText(s.title.bureau).width / 2);
    g.fillStyle = C.muted;
    g.globalAlpha = fade * 0.5;
    g.fillRect(VIEW_W / 2 - half - 48, 361, 34, 2);
    g.fillRect(VIEW_W / 2 + half + 14, 361, 34, 2);
    g.globalAlpha = fade;
    const tags = s.title.taglines;
    outlinedText(g, tags[Math.floor(this.taglineSeed * tags.length)]!, VIEW_W / 2, 600, 21, C.text, C.night, 700, 'center', VIEW_W - 40);
    g.globalAlpha = 1;

    // the one button, breathing a little so the thumb knows where to go
    const pop = rm ? 1 : easeOutBack((t - 0.45) / 0.4);
    if (pop > 0.02) {
      const b = this.start;
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const breathe = rm ? 0 : Math.sin(t * 2.6);
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.mint, cx, cy + 4, 230 + breathe * 12, 96 + breathe * 6, 0.3 + breathe * 0.06);
      g.globalCompositeOperation = 'source-over';
      g.save();
      g.translate(cx, cy);
      g.scale(pop * (1 + breathe * 0.012), pop * (1 + breathe * 0.012));
      g.translate(-cx, -cy);
      b.render(g);
      g.restore();
    }
    drawVignette(g, 0.7);
    this.mute.render(g);
    drawSpeaker(g, this.mute.x + 30, this.mute.y + 34, this.shell.save.muted, C.text);
    this.relabel();
    for (const { b } of this.langs) b.render(g);
    text(g, s.title.build, 24, VIEW_H - 30, 15, 'rgba(169,162,214,0.6)', 'left', 500, false, this.langs[0]!.b.x - 36);
  }

  /** Additive beam with a bright core, a pool on the rooftops and a specimen on the way up. */
  private beam(g: CanvasRenderingContext2D, sx: number, sy: number, rm: boolean): void {
    const t = this.t;
    if (!this.beamGrad) {
      this.beamGrad = g.createLinearGradient(0, SAUCER_Y, 0, BEAM_FLOOR);
      this.beamGrad.addColorStop(0, 'rgba(124,255,203,0.5)');
      this.beamGrad.addColorStop(0.55, 'rgba(124,255,203,0.2)');
      this.beamGrad.addColorStop(0.9, 'rgba(124,255,203,0.07)');
      this.beamGrad.addColorStop(1, 'rgba(124,255,203,0)');
    }
    const flicker = rm ? 1 : 0.9 + 0.1 * Math.sin(t * 5);
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = this.beamGrad;
    for (let pass = 0; pass < 2; pass++) {
      const k = pass === 0 ? 1 : 0.45;
      g.globalAlpha = flicker * (pass === 0 ? 0.85 : 0.6);
      g.beginPath();
      g.moveTo(sx - 26 * k, sy + 14);
      g.lineTo(sx + 26 * k, sy + 14);
      g.lineTo(sx + 96 * k, BEAM_FLOOR);
      g.lineTo(sx - 96 * k, BEAM_FLOOR);
      g.closePath();
      g.fill();
    }
    g.globalAlpha = 1;
    drawGlow(g, GLOW.mint, sx, BEAM_FLOOR, 130, 26, 0.5 * flicker);
    drawGlow(g, GLOW.mint, sx, sy + 16, 50, 20, 0.8);
    // motes rising in the beam
    g.fillStyle = '#eafff4';
    for (let i = 0; i < 12; i++) {
      const k = (((i * 0.618 + (rm ? 0 : t * (0.16 + (i % 3) * 0.03))) % 1) + 1) % 1;
      const spread = 24 + (1 - k) * 66;
      const off = ((i * 0.381) % 1) - 0.5;
      g.globalAlpha = 0.25 + k * 0.5;
      g.fillRect(sx + off * spread * 2, BEAM_FLOOR - k * (BEAM_FLOOR - sy - 20), 2.5, 2.5);
    }
    g.restore();

    // tonight's specimen, fast asleep on the way up
    const hang = sy + 86 + (rm ? 0 : Math.sin(t * 1.7) * 7);
    drawDanglingSleeper(g, sx, hang, rm ? 0.15 : Math.sin(t * 0.9) * 0.28);
  }
}

/**
 * The logo's department ribbon, repainted with `label`: same shape and transforms as
 * public/art/ui/logo.svg (its 480x200 box has its top-left at x, y).
 */
function drawLogoRibbon(g: CanvasRenderingContext2D, x: number, y: number, label: string): void {
  g.save();
  g.translate(x + 2, y - 10);
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
  g.restore();
}

/** Small sleeper in a nightcap, limp in the beam (drawn as a dark teal silhouette with a mint rim). */
function drawDanglingSleeper(g: CanvasRenderingContext2D, x: number, y: number, tilt: number): void {
  g.save();
  g.translate(x, y);
  g.rotate(tilt);
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
  g.restore();
  // Zzz
  g.font = '900 15px system-ui, sans-serif';
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = C.mint;
  g.fillText('z', x + 26, y - 38);
  g.font = '900 20px system-ui, sans-serif';
  g.fillText('Z', x + 36, y - 52);
}

/** Side-on flying saucer: hull, rim lights, glass dome with Zib inside. */
function drawSideSaucer(g: CanvasRenderingContext2D, x: number, y: number, t: number, rm: boolean): void {
  g.lineJoin = 'round';
  // dome
  g.fillStyle = 'rgba(124,255,203,0.55)';
  g.beginPath();
  g.ellipse(x, y - 14, 36, 34, 0, Math.PI, 0);
  g.closePath();
  g.fill();
  // Zib peeking (blinks)
  g.fillStyle = '#7fd27a';
  g.beginPath();
  g.ellipse(x, y - 30, 14, 13, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = C.ink;
  const shut = !rm && t % 3.3 < 0.12;
  g.beginPath();
  g.ellipse(x - 5, y - 32, 3.5, shut ? 0.8 : 4.5, 0, 0, Math.PI * 2);
  g.ellipse(x + 5, y - 32, 3.5, shut ? 0.8 : 4.5, 0, 0, Math.PI * 2);
  g.fill();
  // glass highlight
  g.strokeStyle = 'rgba(255,255,255,0.6)';
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.beginPath();
  g.ellipse(x, y - 14, 27, 26, 0, Math.PI * 1.12, Math.PI * 1.36);
  g.stroke();
  g.lineCap = 'butt';
  g.strokeStyle = C.ink;
  g.lineWidth = 4;
  g.beginPath();
  g.ellipse(x, y - 14, 36, 34, 0, Math.PI, 0);
  g.stroke();
  // hull
  g.fillStyle = '#9fb3d6';
  g.beginPath();
  g.ellipse(x, y, 86, 24, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#7b8db3';
  g.beginPath();
  g.ellipse(x, y + 8, 70, 13, 0, 0, Math.PI);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.3)';
  g.beginPath();
  g.ellipse(x - 8, y - 11, 56, 6, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(x, y, 86, 24, 0, 0, Math.PI * 2);
  g.stroke();
  // rim lights chase round
  for (let i = 0; i < 7; i++) {
    const lx = x - 60 + i * 20;
    const ly = y + 4 - Math.abs(i - 3) * 1.5;
    const on = rm ? i % 2 === 0 : Math.floor(t * 6 + i) % 3 === 0;
    g.fillStyle = on ? C.amberHi : '#4a4470';
    g.beginPath();
    g.arc(lx, ly, 5, 0, Math.PI * 2);
    g.fill();
    if (on) {
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.amber, lx, ly, 14, 14, 0.6);
      g.globalCompositeOperation = 'source-over';
    }
  }
}
