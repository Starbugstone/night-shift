import { Container, Graphics, type Sprite as PixiSprite } from 'pixi.js';
import { ART } from '../../art-manifest';
import { VIEW_H, VIEW_W, type Assets } from '../../contracts';
import { GLOW, Glow, ScreenTint, glowTexture } from '../../core/gfx/glow';
import { artSprite } from '../../ui/views/art';
import { getLang } from '../../i18n';
import { letteredKey } from '../probe-draw';
import type { Building, InteriorRoom, Opening } from '../rooms/interior';
import type { Sprite } from '../rooms/layout';
import type { HazardState } from '../interior';
import type { SwingingRect } from '../ragdoll';
import { INK, MINT, RED, TAU, bitmap, box, circleInView, disc, intersects, Segment } from './pieces';

const STAR_COUNT = 39;
const WALL_COLORS = ['#423354', '#5b4b70', '#322943'] as const;
const PALETTES: Record<string, readonly [string, string]> = {
  'room/bg_suburb_bedroom': ['#332749', '#615071'],
  'room/bg_hallway': ['#372c47', '#59486b'],
  'room/bg_stairwell': ['#25384b', '#4c606d'],
  'room/bg_attic': ['#302638', '#564158'],
  'room/bg_living_room': ['#283448', '#475878'],
  'room/bg_kitchen': ['#304153', '#5f717c'],
  'room/bg_utility': ['#30384b', '#62677c'],
  'room/bg_garage': ['#263342', '#535d6c'],
  'room/bg_museum': ['#243745', '#4d6375'],
  'room/bg_vault': ['#273445', '#4d5674'],
  'room/bg_club': ['#2c2143', '#633960'],
  'room/bg_duct': ['#24353b', '#495d67'],
  'room/bg_office': ['#302e45', '#635069'],
  'room/bg_corridor': ['#272d44', '#4d5577'],
  'room/bg_clocktower': ['#302b3e', '#664f63'],
  'room/bg_shaft': ['#282c3c', '#4a5065'],
};
const FALLBACK_NAMES = new Map(Object.keys(ART).filter(key => key.startsWith('room/')).map(key => [key, key.slice(5).replaceAll('_', ' ')]));
const DEFAULT_PALETTE = ['#273347', '#4e5972'] as const;
/** Swinging props that are lamps: their pool of light swings with them. */
const SWING_LAMPS = new Set(['room/hanging_bulb', 'room/work_lamp', 'room/chandelier']);
/** The five screens on room/monitor_bank.svg, in its 200x140 box: x, y, w, h. */
const MONITORS = [[36, 3, 62, 37], [102, 3, 62, 37], [6, 41, 60, 49], [68, 41, 63, 50], [133, 41, 60, 49]] as const;
const DISCO = ['255,110,210', '124,255,203', '255,210,122', '120,170,255', '255,110,210', '124,255,203'] as const;

/** A fixed light in a room. flicker: 0 steady, 1 fire, 2 television, 3 screens. */
interface Light {
  x: number;
  y: number;
  r: number;
  glow: Glow;
  alpha: number;
  flicker: 0 | 1 | 2 | 3;
}

function label(g: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, style: string, maxWidth: number): void {
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = style;
  g.fillText(text, x, y, maxWidth);
}

// Each silhouette is drawn in the native coordinates of its room prop.
const DECOR_FALLBACKS: Readonly<Record<string, (g: CanvasRenderingContext2D, french: boolean) => void>> = {
  'room/potato_butte': g => {
    g.fillStyle = '#a7b7ce';
    g.beginPath();
    g.ellipse(43, 49, 40, 11, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#e5cc9f';
    g.beginPath();
    g.moveTo(12, 49);
    g.lineTo(26, 33);
    g.lineTo(33, 12);
    g.lineTo(53, 11);
    g.lineTo(61, 34);
    g.lineTo(73, 49);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#ffbd68';
    g.fillRect(39, 7, 12, 6);
  },
  'room/roswell_pennant': g => {
    g.fillStyle = '#426f73';
    g.beginPath();
    g.moveTo(20, 5);
    g.lineTo(181, 40);
    g.lineTo(20, 81);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#e5cc9f';
    g.fillRect(20, 6, 7, 74);
    label(g, 'ROSWELL', 80, 43, 'bold 18px system-ui', '#ffedc9', 88);
  },
  'room/saucer_poster': (g, french) => {
    g.fillStyle = '#d6bb94';
    g.fillRect(5, 4, 134, 114);
    g.fillStyle = '#425664';
    g.fillRect(12, 11, 120, 58);
    g.fillStyle = '#c4c7b6';
    g.beginPath();
    g.ellipse(75, 36, 25, 7, -0.18, 0, TAU);
    g.fill();
    label(g, french ? 'LA VÉRITÉ' : 'I WANT TO', 72, 80, 'bold 16px system-ui', INK, 123);
    label(g, french ? 'S’EST TIRÉE' : 'BE LEAVING', 72, 101, 'bold 20px system-ui', INK, 123);
  },
  'room/towel_42': g => {
    g.fillStyle = '#bb9161';
    g.beginPath();
    g.arc(43, 12, 8, 0, TAU);
    g.fill();
    g.fillStyle = '#b86f69';
    g.beginPath();
    g.moveTo(37, 20);
    g.quadraticCurveTo(48, 10, 54, 32);
    g.lineTo(66, 91);
    g.quadraticCurveTo(42, 103, 12, 92);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#ffdfac';
    g.fillRect(17, 84, 44, 4);
    label(g, '42', 39, 59, 'bold 28px system-ui', '#ffedc9', 38);
  },
  'room/tripod_single': g => {
    g.fillStyle = '#26263f';
    g.beginPath();
    g.arc(82, 51, 47, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#e5cc9f';
    g.fillRect(5, 8, 82, 88);
    g.fillStyle = '#c77670';
    g.fillRect(10, 13, 72, 78);
    g.beginPath();
    g.moveTo(20, 66);
    g.lineTo(43, 40);
    g.lineTo(46, 72);
    g.moveTo(43, 40);
    g.lineTo(73, 58);
    g.stroke();
    g.fillStyle = '#81a49b';
    g.beginPath();
    g.arc(43, 37, 13, 0, TAU);
    g.fill();
    g.stroke();
  },
  'room/pilot_bobblehead': g => {
    g.fillStyle = '#895e55';
    g.fillRect(7, 64, 39, 7);
    g.fillStyle = '#648b82';
    g.fillRect(17, 45, 18, 18);
    g.fillStyle = '#a7b7ce';
    g.fillRect(23, 29, 5, 16);
    g.fillStyle = '#e5cc9f';
    g.beginPath();
    g.ellipse(27, 20, 19, 17, 0.12, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#495374';
    g.fillRect(16, 17, 30, 8);
  },
};

function chimney(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  g.fillStyle = '#545168';
  g.fillRect(x, y, w, h);
  g.strokeStyle = '#454157';
  g.lineWidth = 3;
  g.beginPath();
  for (let row = 0; row < h; row += 23) {
    g.moveTo(x, y + row);
    g.lineTo(x + w, y + row);
    const offset = row % 46 === 0 ? 26 : 57;
    for (let mortar = offset; mortar < w; mortar += 62) {
      g.moveTo(x + mortar, y + row);
      g.lineTo(x + mortar, y + Math.min(row + 23, h));
    }
  }
  g.stroke();
  g.fillStyle = '#68637a';
  g.fillRect(x + w - 11, y, 3, h);
}

function watchDog(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  g.save();
  g.translate(x, y);
  g.scale(w / 89, h / 62);
  g.fillStyle = '#bb9161';
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(14, 50);
  g.quadraticCurveTo(13, 35, 2, 27);
  g.quadraticCurveTo(16, 29, 22, 34);
  g.quadraticCurveTo(38, 25, 56, 34);
  g.quadraticCurveTo(60, 23, 67, 21);
  g.lineTo(68, 4);
  g.lineTo(78, 19);
  g.quadraticCurveTo(86, 20, 88, 34);
  g.lineTo(73, 39);
  g.lineTo(68, 60);
  g.lineTo(58, 60);
  g.lineTo(56, 49);
  g.lineTo(27, 49);
  g.lineTo(24, 60);
  g.lineTo(14, 60);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#594050';
  g.fillRect(58, 31, 6, 14);
  g.fillStyle = INK;
  g.fillRect(75, 25, 3, 3);
  g.fillRect(84, 29, 4, 5);
  g.restore();
}

/**
 * A pulsing laser. Off: a faint dotted sight line. Tell (0.35 s): the emitters charge and the
 * line flickers amber, thickening. On: a red bar with a white core and a glow. The bar drawn is
 * the bar that trips the alarm.
 */

export function roomArt(assets: Assets, key: string, x: number, y: number, w: number, h: number, solid = false): Container {
  const lang = getLang();
  const drawKey = letteredKey(key);
  const image = artSprite(assets, drawKey, w, h);
  const root = new Container();
  root.position.set(x, y);
  if (image) {
    image.anchor.set(0);
    root.addChild(image);
  } else {
    root.addChild(bitmap(`room|${drawKey}|${lang}|${w}|${h}|${solid}`, 0, 0, w, h, g => {
      const fallback = DECOR_FALLBACKS[key];
      if (fallback) {
        g.lineWidth = 2.5;
        g.lineJoin = 'round';
        g.strokeStyle = INK;
        fallback(g, lang === 'fr');
      } else if (key === 'room/watch_dog') {
        watchDog(g, 0, 0, w, h);
      } else if (key === 'room/chimney_stack') {
        chimney(g, 0, 0, w, h);
      } else {
        g.fillStyle = solid ? '#594a68' : '#554361';
        g.lineWidth = 2.5;
        g.strokeStyle = INK;
        g.beginPath();
        g.roundRect(1, 1, Math.max(1, w - 2), Math.max(1, h - 2), Math.min(8, w / 3, h / 3));
        g.fill();
        g.stroke();
        g.fillStyle = '#a592ac';
        g.globalAlpha = 0.5;
        g.fillRect(w * 0.13, h * 0.15, w * 0.74, Math.min(5, h * 0.16));
        g.globalAlpha = 1;
        if (w >= 87 && h >= 30) label(g, FALLBACK_NAMES.get(key) ?? '', w / 2, h * 0.52, '750 12px system-ui', '#e2cce3', w - 14);
      }
    }));
  }
  if (solid) root.addChild(new Graphics().rect(0.7, 0.7, w - 1.4, h - 1.4).stroke({ color: 'rgba(235,207,172,0.38)', width: 1.4 }));
  return root;
}

export function prop(assets: Assets, s: Sprite, solid = false): Container {
  if (s.key !== 'room/ladder') return roomArt(assets, s.key, s.x, s.y, s.w, s.h, solid);
  const { x, y, w, h } = s;
  return bitmap(`ladder|${w}|${h}`, x, y, w, h, (g) => {
    g.fillStyle = INK;
    g.fillRect(0, 0, 12, h);
    g.fillRect(w - 12, 0, 12, h);
    g.fillStyle = '#bb9161';
    g.fillRect(2, 0, 8, h);
    g.fillRect(w - 10, 0, 8, h);
    for (let rung = 16; rung < h - 6; rung += 28) {
      g.fillStyle = INK;
      g.fillRect(9, rung, w - 18, 8);
      g.fillStyle = '#e5cc9f';
      g.fillRect(10, rung + 2, w - 20, 3);
    }
  });
}

export class Mount {
  readonly root = new Container();
  private readonly line: Segment;

  constructor(x: number, y: number, width = 4) {
    const bar = new Graphics().rect(0, -width / 2, 1, width).fill(INK)
      .rect(0, -Math.max(1, width - 3) / 2, 1, Math.max(1, width - 3)).fill('#a398ad');
    this.line = new Segment(bar);
    this.root.position.set(x, y);
    this.root.addChild(box(-10, 0, 20, 6, '#756986'), this.line.root);
  }

  sync(x: number, y: number): void {
    this.line.sync(0, 5, x - this.root.x, y - this.root.y);
  }
}

function backdrop(assets: Assets, room: InteriorRoom): Container {
  const { x, y, w, h } = room;
  const root = new Container();
  root.position.set(x, y);
  const image = assets.get(room.backdrop);
  if (!image) {
    const palette = PALETTES[room.backdrop] ?? DEFAULT_PALETTE;
    const g = new Graphics().rect(0, 0, w, h).fill(palette[0]);
    for (let line = 25; line < w - 15; line += 58) g.rect(line, 0, 2, h);
    g.rect(0, h - 46, w, 32).fill({ color: palette[1], alpha: 0.14 });
    g.rect(0, h - 46, w, 3).fill({ color: palette[1], alpha: 0.6 });
    root.addChild(g);
    return root;
  }
  const spec = ART[room.backdrop]!;
  const scale = Math.min(1, w / spec.w);
  const tileW = spec.w * scale;
  const baseboard = h - 46;
  const tileH = h > 800 ? 600 * scale : baseboard;
  for (let tileX = 0, col = 0; tileX < w; tileX += tileW, col++) {
    const drawW = Math.min(tileW, w - tileX);
    const flipX = col % 2 !== 0;
    const sx = flipX ? spec.w - drawW / scale : 0;
    for (let tileY = 0, row = 0; tileY < baseboard; tileY += tileH, row++) {
      const drawH = Math.min(tileH, baseboard - tileY);
      const slice = 600 * drawH / tileH;
      const flipY = row % 2 !== 0;
      root.addChild(bitmap(`wall|${room.backdrop}|${drawW}|${drawH}|${sx}|${slice}|${flipY}`, 0, 0, drawW, drawH, g => {
        g.drawImage(image, sx, flipY ? 600 - slice : 0, drawW / scale, slice, 0, 0, drawW, drawH);
      }));
      const tile = root.children[root.children.length - 1]!;
      tile.position.set(flipX ? tileX + drawW : tileX, flipY ? tileY + drawH : tileY);
      tile.scale.set(flipX ? -1 : 1, flipY ? -1 : 1);
    }
    const floor = bitmap(`floor|${room.backdrop}|${drawW}|${sx}`, flipX ? tileX + drawW : tileX, baseboard, drawW, 46, g => {
      g.drawImage(image, sx, 600, drawW / scale, 67, 0, 0, drawW, 46);
    });
    floor.scale.x = flipX ? -1 : 1;
    root.addChild(floor);
  }
  return root;
}

function trim(g: Graphics, opening: Opening): void {
  const { axis, at, from, to } = opening;
  if (axis === 'vertical') {
    g.rect(at - 19, from - 7, 38, 7).rect(at - 19, to, 38, 7).fill('#a68896')
      .rect(at - 5, from, 10, to - from).fill('rgba(62,47,74,0.52)')
      .rect(at - 7, from, 2, to - from).rect(at + 5, from, 2, to - from).fill('rgba(212,181,174,0.48)');
  } else {
    g.rect(from - 7, at - 16, 7, 32).rect(to, at - 16, 7, 32).fill('#867e9d')
      .rect(from, at - 4, to - from, 8).fill(opening.trim === 'flue' ? '#906b65' : 'rgba(152,134,185,0.2)');
  }
}

export class DeepNight {
  readonly root = new Container();
  private readonly stars = new Container();
  private readonly starDots: PixiSprite[] = [];
  private lastX = NaN;
  private lastY = NaN;
  private readonly street = new Container();
  private readonly rooftops = new Graphics();
  private readonly dawn = ScreenTint.wash('255,150,110', 0.5, 0.1, 0.5, 1);

  constructor(private readonly ground: number) {
    this.root.addChild(bitmap('deep-night', 0, 0, 4, VIEW_H, (g) => {
      const sky = g.createLinearGradient(0, 0, 0, VIEW_H);
      sky.addColorStop(0, '#0d0a24');
      sky.addColorStop(1, '#1d1746');
      g.fillStyle = sky;
      g.fillRect(0, 0, 4, VIEW_H);
    }), this.dawn);
    this.root.children[0]!.scale.x = VIEW_W / 4;
    for (let i = 0; i < STAR_COUNT; i++) {
      const d = i % 7 === 0 ? 2.5 : 1.4;
      const star = box(0, 0, d, d, '#8f83b4');
      this.starDots.push(star);
      this.stars.addChild(star);
    }
    for (let x = -150; x < VIEW_W + 150; x += 150) {
      this.rooftops.rect(x, -46, 64, 46).rect(x + 78, -26, 50, 26).rect(x + 14, -60, 16, 14);
    }
    this.rooftops.fill('#17123a');
    this.street.addChild(this.rooftops, box(0, 0, VIEW_W, VIEW_H * 2, '#1c1830'), box(0, 0, VIEW_W, 7, '#2d4a3c'));
    const lines = new Graphics();
    for (let y = 46; y < VIEW_H * 2; y += 58) lines.rect(0, y, VIEW_W, 3);
    this.street.addChild(lines.fill('#241f3c'));
    this.root.addChild(this.stars, this.street);
  }

  sync(cx: number, cy: number, dawn: number): void {
    this.dawn.strength = dawn * 0.75;
    this.stars.alpha = 1 - dawn * 0.8;
    // Far-off stars need no transform updates for subpixel camera jitter.
    const shiftX = Math.round(cx * 0.16 * 8) / 8;
    const shiftY = Math.round(cy * 0.13 * 8) / 8;
    if (shiftX !== this.lastX || shiftY !== this.lastY) {
      this.lastX = shiftX;
      this.lastY = shiftY;
      for (let i = 0; i < this.starDots.length; i++) {
        const x = (i * 0.61803398875 % 1) * VIEW_W - shiftX;
        const y = (i * 0.38196601125 + i * i * 0.013) % 1 * VIEW_H - shiftY;
        this.starDots[i]!.position.set((x % VIEW_W + VIEW_W) % VIEW_W, (y % VIEW_H + VIEW_H) % VIEW_H);
      }
    }
    const ground = this.ground - cy;
    this.street.visible = ground < VIEW_H;
    if (this.street.visible) {
      this.street.y = ground;
      this.rooftops.x = -((cx * 0.35 % 150 + 150) % 150);
    }
  }
}

class Furnishing {
  readonly root = new Container();
  private readonly gag: 'tv' | 'monitors' | 'booth' | 'cooler';
  private readonly parts: (Graphics | PixiSprite)[] = [];

  constructor(private readonly s: Sprite, gag: Furnishing['gag']) {
    this.gag = gag;
    this.root.position.set(s.x, s.y);
    const { w, h } = s;
    if (gag === 'tv') {
      for (let i = 0; i < 4; i++) this.parts.push(box(w * 0.16, 0, w * 0.68, 3, '#eaf4ff'));
    } else if (gag === 'monitors') {
      const kx = w / 200;
      const ky = h / 140;
      for (const [x, y, mw, mh] of MONITORS) this.parts.push(new Graphics().rect((x + 3) * kx, (y + 3) * ky, (mw - 6) * kx, (mh - 8) * ky).stroke({ color: RED, width: 2.5 }));
    } else if (gag === 'booth') {
      for (let i = 0; i < 7; i++) {
        const bar = box(w * 0.62 + i * 7, h * 0.3, 4.5, 14, MINT, 0.85);
        bar.anchor.y = 1;
        this.parts.push(bar);
      }
    } else this.parts.push(disc(1, '#d9f4ff'));
    this.root.addChild(...this.parts);
  }

  sync(t: number, rm: boolean, cx: number, cy: number): void {
    this.root.visible = intersects(this.s, cx, cy, VIEW_W, VIEW_H);
    if (!this.root.visible) return;
    const { w, h } = this.s;
    if (this.gag === 'tv') {
      for (let i = 0; i < this.parts.length; i++) {
        const k = rm ? i / 4 : (t * 1.7 + i / 4) % 1;
        const part = this.parts[i]!;
        part.y = h * 0.22 + h * 0.5 * (1 - k);
        part.alpha = rm ? 0.22 : 0.16 + 0.12 * Math.sin(t * 31 + i * 2);
      }
    } else if (this.gag === 'monitors') {
      const n = rm ? 2 : Math.floor(t * 0.8) % MONITORS.length;
      const on = rm || (t * 0.8) % 1 < 0.6;
      for (let i = 0; i < this.parts.length; i++) this.parts[i]!.visible = i === n && on;
    } else if (this.gag === 'booth') {
      for (let i = 0; i < this.parts.length; i++) this.parts[i]!.scale.y = 14 * (rm ? 0.5 : 0.25 + 0.75 * Math.abs(Math.sin(t * (3 + i * 0.7) + i)));
    } else {
      const k = rm ? 0.4 : (t * 0.45) % 1;
      const bubble = this.parts[0]!;
      bubble.visible = k < 0.5;
      bubble.position.set(w * 0.5 + Math.sin(k * 20) * 3, h * 0.3 - k * 44);
      bubble.scale.set(3 + k * 5);
      bubble.alpha = 0.8 * (1 - k * 2);
    }
  }
}

class HazardLights {
  readonly root = new Container();
  private readonly lights: Glow[] = [];

  constructor(private readonly state: HazardState) {
    const { spec } = state;
    let rgb: readonly string[] = [];
    if (spec.kind === 'swing') {
      if (SWING_LAMPS.has(spec.sprite.key)) rgb = [GLOW.warm, GLOW.amber];
      else if (spec.sprite.key === 'room/disco_ball') rgb = [...DISCO, GLOW.white];
    } else if (spec.kind === 'fragile' && spec.sprite.key === 'room/fish_tank') rgb = ['110,230,255'];
    for (const color of rgb) {
      const light = new Glow(glowTexture(color), true);
      this.lights.push(light);
      this.root.addChild(light);
    }
  }

  sync(t: number, rm: boolean, cx: number, cy: number): void {
    const { spec, shapes, broken } = this.state;
    if (spec.kind === 'swing') {
      const shape = shapes[0] as SwingingRect;
      const x = shape.x - Math.sin(shape.angle) * shape.h * 0.86;
      const y = shape.y + Math.cos(shape.angle) * shape.h * 0.86;
      this.root.visible = circleInView(x, y, this.lights.length === 2 ? 190 : 330, cx, cy, VIEW_W, VIEW_H);
      if (!this.root.visible) return;
      if (this.lights.length === 2) {
        this.lights[0]!.place(x, y + 40, 190, 190, 0.5);
        this.lights[1]!.place(x, y, 34, 34, 0.9);
      } else {
        const turn = rm ? 0.4 : t * 0.7;
        for (let k = 0; k < DISCO.length; k++) {
          const a = turn * (k % 2 === 0 ? 1 : -0.8) + k * 1.05;
          const r = 150 + (k % 3) * 60;
          this.lights[k]!.place(x + Math.cos(a) * r, y + 80 + Math.sin(a) * r * 0.55, 34, 26, 0.5);
        }
        this.lights[6]!.place(x, y - 30, 46, 46, 0.35);
      }
    } else if (spec.kind === 'fragile') {
      const s = spec.sprite;
      const x = s.x + s.w / 2;
      const y = s.y + s.h / 2;
      this.root.visible = !broken && circleInView(x, y, 130, cx, cy, VIEW_W, VIEW_H);
      if (this.root.visible) this.lights[0]!.place(x, y, 130, 110, 0.4);
    }
  }
}

export class BuildingView {
  readonly root = new Container();
  private readonly rooms: { spec: InteriorRoom; root: Container }[] = [];
  private readonly gags: Furnishing[] = [];
  private readonly lights: Light[] = [];
  private readonly hazardLights: HazardLights[] = [];
  private readonly dim = box(0, 0, VIEW_W + 16, VIEW_H + 16, '#0a0828');
  private readonly dawn = new Glow(glowTexture(GLOW.dawn), true);

  constructor(building: Building, hazards: readonly HazardState[], exit: Sprite, assets: Assets) {
    const gags = new Container();
    const lights = new Container();
    for (const room of building.rooms) {
      const layer = new Container();
      layer.addChild(backdrop(assets, room));
      for (const sprite of room.mounts) {
        const x = sprite.x + sprite.w / 2;
        const dual = sprite.key === 'room/dino_skull';
        for (let i = 0; i < (dual ? 2 : 1); i++) {
          const attach = x + (dual ? i === 0 ? -49 : 49 : 0);
          const mount = new Mount(attach, room.y + 14);
          mount.sync(attach, sprite.y + (dual ? 28 : 17));
          layer.addChild(mount.root);
        }
        if (!room.furniture.includes(sprite)) layer.addChild(prop(assets, sprite));
      }
      for (const s of room.decor) if (s !== exit) layer.addChild(prop(assets, s));
      for (const { sprite } of room.supports) layer.addChild(prop(assets, sprite));
      for (const s of room.furniture) layer.addChild(prop(assets, s));
      this.rooms.push({ root: layer, spec: room });
      this.root.addChild(layer);
      for (const s of room.furniture) this.furnish(s, gags, lights);
      for (const { sprite } of room.supports) this.furnish(sprite, gags, lights);
      for (const s of room.decor) this.furnish(s, gags, lights);
    }
    const edges = new Graphics();
    for (const { x, y, w, h } of building.walls) {
      edges.rect(x, y, w, h).fill(WALL_COLORS[0]).rect(x, y, Math.max(2, w - 10), 3).fill(WALL_COLORS[1])
        .rect(x + w - 3, y + 3, 3, h - 3).fill(WALL_COLORS[2]);
    }
    for (const opening of building.openings) trim(edges, opening);
    this.root.addChild(gags, edges, this.dim, lights);
    lights.addChild(this.dawn);
    this.addLight(lights, exit.x + exit.w / 2, exit.y + exit.h / 2, 250, '150,170,255', 0.5, 0);
    for (const state of hazards) {
      const { spec } = state;
      if ((spec.kind === 'swing' && (SWING_LAMPS.has(spec.sprite.key) || spec.sprite.key === 'room/disco_ball')) ||
          (spec.kind === 'fragile' && spec.sprite.key === 'room/fish_tank')) {
        const effect = new HazardLights(state);
        this.hazardLights.push(effect);
        lights.addChild(effect.root);
      }
    }
  }

  private addLight(layer: Container, x: number, y: number, r: number, rgb: string, alpha: number, flicker: Light['flicker']): void {
    const glow = new Glow(glowTexture(rgb), true);
    this.lights.push({ x, y, r, alpha, flicker, glow });
    layer.addChild(glow);
  }

  private furnish(s: Sprite, gags: Container, lights: Container): void {
    const x = s.x + s.w / 2;
    let gag: Furnishing['gag'] | undefined;
    switch (s.key) {
      case 'room/tv_static':
        this.addLight(lights, x, s.y + s.h / 2, 190, '140,190,255', 0.5, 2);
        gag = 'tv';
        break;
      case 'room/fireplace':
        this.addLight(lights, x, s.y + s.h - 50, 210, GLOW.warm, 0.6, 1);
        break;
      case 'room/monitor_bank':
        this.addLight(lights, x, s.y + 40, 200, '110,255,200', 0.36, 3);
        gag = 'monitors';
        break;
      case 'room/dj_booth':
        this.addLight(lights, x, s.y + 30, 180, GLOW.pink, 0.34, 3);
        gag = 'booth';
        break;
      case 'room/security_desk':
      case 'room/mayor_desk':
        this.addLight(lights, x, s.y + 10, 170, GLOW.warm, 0.36, 0);
        break;
      case 'room/water_cooler':
        gag = 'cooler';
        break;
      case 'room/vending_machine':
        this.addLight(lights, x, s.y + 70, 170, GLOW.amber, 0.42, 3);
        break;
      case 'room/heart_monitor':
        this.addLight(lights, x, s.y + 30, 110, GLOW.amber, 0.36, 3);
        break;
    }
    if (gag) {
      const view = new Furnishing(s, gag);
      this.gags.push(view);
      gags.addChild(view.root);
    }
  }

  sync(cx: number, cy: number, t: number, rm: boolean, dawn: number): void {
    for (const { spec, root } of this.rooms) root.visible = intersects(spec, cx - 18, cy - 18, VIEW_W + 36, VIEW_H + 36);
    for (const gag of this.gags) gag.sync(t, rm, cx, cy);
    this.dim.position.set(cx - 8, cy - 8);
    this.dim.alpha = 0.26 * (1 - dawn * 0.6);
    this.dawn.visible = false;
    for (let i = 0; i < this.lights.length; i++) {
      const { x, y, r, flicker, glow, alpha } = this.lights[i]!;
      if (!circleInView(x, y, r, cx, cy, VIEW_W, VIEW_H)) {
        glow.visible = false;
        continue;
      }
      let k = 1;
      if (!rm) {
        if (flicker === 1) k = 0.82 + 0.18 * Math.sin(t * 9) * Math.sin(t * 5.3);
        else if (flicker === 2) k = 0.55 + 0.45 * Math.abs(Math.sin(t * 13.1) * Math.sin(t * 4.7 + 1));
        else if (flicker === 3) k = 0.85 + 0.15 * Math.sin(t * 3.1 + i);
      }
      const last = i === this.lights.length - 1;
      if (last) this.dawn.place(x, y, r * 1.2, r * 1.2, dawn * 0.7);
      glow.place(x, y, r, r, alpha * k * (last ? 1 - dawn * 0.6 : 1));
    }
    for (const group of this.hazardLights) group.sync(t, rm, cx, cy);
  }
}
