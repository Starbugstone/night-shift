import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { ART } from '../../art-manifest';
import type { Assets } from '../../contracts';
import { VIEW_H, VIEW_W } from '../../contracts';
import { easeInCubic } from '../../core/fx';
import { Glow, radialTexture, ScreenTint } from '../../core/gfx/glow';
import { ownedTexture, paintedTexture, textureScale, type Painter } from '../../core/gfx/textures';
import type { PropDef, RoadDef } from '../../levels/types';
import { artShadow, artSprite } from '../../ui/views/art';
import { C } from '../../ui/theme';
import { drawJunctions, drawRoad, type GroundTheme } from '../draw-common';
import { drawFallback, propSize } from '../props';
import { paintApeRoof } from './monolith';
import { drawPierProp } from '../pier-ground';

export const TAU = Math.PI * 2;

export function plate(color: string): ScreenTint {
  const s = new ScreenTint(Texture.WHITE);
  s.tint = color;
  return s;
}

export function mapLamp(x: number, y: number): Glow {
  return new Glow(radialTexture('flight-lamp', [
    [0, 'rgba(255,200,110,0.45)'],
    [1, 'rgba(255,200,110,0)'],
  ]), true).place(x, y, 100);
}

export function paintedSprite(id: string, w: number, h: number, painter: Painter): Sprite {
  const sprite = new Sprite(paintedTexture(`flight|${id}`, w, h, (g) => {
    g.translate(w / 2, h / 2);
    painter(g, w, h);
  }));
  sprite.anchor.set(0.5);
  return sprite;
}

export function spriteOr(assets: Assets, key: string, w: number, h: number, fallback: Painter): Sprite {
  return artSprite(assets, key, w, h) ?? paintedSprite(`fallback|${key}|${w}|${h}`, w, h, fallback);
}

export function propSprite(assets: Assets, p: PropDef): Sprite {
  const { w, h } = propSize(p);
  const sprite = artSprite(assets, p.key, w, h) ??
    paintedSprite(`prop|${p.key}|${w}|${h}|${p.tint ?? ''}`, w, h, (g) => {
      if (p.kind === 'terrace') paintApeRoof(g, p.key, w, h);
      else if (p.kind === 'pier') drawPierProp(g, p.key, w, h);
      else drawFallback(g, p.kind, w, h, p.tint);
    });
  sprite.position.set(p.x, p.y);
  sprite.rotation = p.rot ?? 0;
  return sprite;
}

export class CameraView {
  readonly root = new Container();
  readonly world = this.root.addChild(new Container());
  x = 0;
  y = 0;

  sync(x: number, y: number, sx: number, sy: number, shake: number, lock: number, t: number, rm: boolean): void {
    const px = textureScale();
    this.x = Math.round(x * px) / px;
    this.y = Math.round(y * px) / px;
    const shx = rm ? 0 : Math.sin(t * 80) * 7 * shake;
    const shy = rm ? 0 : Math.cos(t * 67) * 5 * shake;
    const z = rm ? 1 : 1 + 0.24 * easeInCubic(lock);
    this.world.scale.set(z);
    this.world.position.set(sx - this.x - z * (sx - shx), sy - this.y - z * (sy - shy));
  }

  sees(x: number, y: number, margin: number): boolean {
    return x > this.x - margin && x < this.x + VIEW_W + margin &&
      y > this.y - margin && y < this.y + VIEW_H + margin;
  }
}

const CHUNK = 540;
const GUTTER = 2;
const EDGE_PAD = 16;

interface Chunk {
  sprite: Sprite;
  x: number;
  y: number;
}

/**
 * The opaque ground, roads and junctions are painted together so no tile edge can expose the stage.
 * The chunk bitmaps belong to this view (a deep level's ground is ~30 MB): call `destroy()` from the
 * scene view's `dispose()`.
 */
export class GroundView {
  readonly root = new Container();
  private readonly chunks: Chunk[] = [];

  constructor(w: number, h: number, assets: Assets, theme: GroundTheme, roads: readonly RoadDef[], paint: (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void) {
    this.root.addChild(new Graphics().rect(-EDGE_PAD, -EDGE_PAD, w + EDGE_PAD * 2, h + EDGE_PAD * 2).fill('#26343a'));
    for (let y = 0; y < h; y += CHUNK) {
      for (let x = 0; x < w; x += CHUNK) {
        // Paint both sides of the join in world coordinates. Padding the outer chunks
        // covers camera shake at the map boundary without allocating another row of textures.
        const x0 = x - (x === 0 ? EDGE_PAD : GUTTER);
        const y0 = y - (y === 0 ? EDGE_PAD : GUTTER);
        const x1 = x + CHUNK >= w ? w + EDGE_PAD : x + CHUNK + GUTTER;
        const y1 = y + CHUNK >= h ? h + EDGE_PAD : y + CHUNK + GUTTER;
        const width = x1 - x0;
        const height = y1 - y0;
        const tex = ownedTexture(width, height, (g) => {
          g.translate(-x0, -y0);
          g.fillStyle = '#26343a';
          g.fillRect(x0, y0, width, height);
          paint(g, x0, y0, width, height);
          for (const road of roads) drawRoad(g, assets, road, theme, x0, y0, width, height);
          drawJunctions(g, roads, theme, Boolean(assets.get('flight/road_h')));
        }, 1);
        const sprite = new Sprite(tex);
        sprite.position.set(x0, y0);
        this.root.addChild(sprite);
        this.chunks.push({ sprite, x, y });
      }
    }
  }

  /** Free the chunk bitmaps (the sprites go with the scene's display tree). */
  destroy(): void {
    for (const chunk of this.chunks) chunk.sprite.texture.destroy(true);
    this.chunks.length = 0;
  }

  sync(cam: CameraView): void {
    for (const chunk of this.chunks) {
      chunk.sprite.visible = cam.sees(chunk.x + CHUNK / 2, chunk.y + CHUNK / 2, CHUNK / 2 + 24);
    }
  }
}

export function basicGround(g: CanvasRenderingContext2D, assets: Assets, key: string, x0: number, y0: number, w: number, h: number, base: string, dots: string, speckles: Float32Array, grass: boolean): void {
  const img = assets.get(key);
  if (img) {
    for (let y = Math.floor(y0 / CHUNK) * CHUNK; y < y0 + h; y += CHUNK) {
      for (let x = Math.floor(x0 / CHUNK) * CHUNK; x < x0 + w; x += CHUNK) {
        g.drawImage(img, x, y, CHUNK + 0.5, CHUNK + 0.5);
      }
    }
    return;
  }
  g.fillStyle = base;
  g.fillRect(x0, y0, w, h);
  g.fillStyle = dots;
  for (let i = 0; i < speckles.length; i += 3) {
    const x = speckles[i]!;
    const y = speckles[i + 1]!;
    const r = speckles[i + 2]!;
    g.fillRect(x, y, grass ? r : r * 3, grass ? r * 2.4 : r);
  }
}

interface PropShadow {
  sprite: Sprite;
  x: number;
  y: number;
  offset: number;
}

export class PropLayer {
  readonly root = new Container();
  private readonly sprites: Sprite[];
  private readonly margin: number[];

  constructor(assets: Assets, props: readonly PropDef[]) {
    this.sprites = props.map((p) => propSprite(assets, p));
    this.margin = props.map((p) => {
      const { w, h } = propSize(p);
      return Math.hypot(w, h) / 2 + 12;
    });
    for (const sprite of this.sprites) this.root.addChild(sprite);
  }

  sync(cam: CameraView): void {
    for (let i = 0; i < this.sprites.length; i++) {
      const s = this.sprites[i]!;
      s.visible = cam.sees(s.x, s.y, this.margin[i]!);
    }
  }
}

export class ShadowsView {
  readonly root = new Container();
  private readonly shadows: PropShadow[] = [];

  constructor(assets: Assets, props: readonly PropDef[], offsets: Partial<Record<PropDef['kind'], number>>) {
    for (const p of props) {
      const offset = offsets[p.kind] ?? 0;
      if (!offset) continue;
      const { w, h } = propSize(p);
      const sprite = artShadow(assets, p.key, w, h, 0.36);
      if (!sprite) continue;
      sprite.rotation = p.rot ?? 0;
      this.root.addChild(sprite);
      this.shadows.push({ sprite, x: p.x, y: p.y, offset });
    }
  }

  sync(cam: CameraView, dawn: number): void {
    for (const s of this.shadows) {
      const off = s.offset * (1 + dawn * 0.8);
      const x = s.x + off;
      const y = s.y + off * 1.15;
      s.sprite.visible = cam.sees(x, y, Math.max(s.sprite.width, s.sprite.height));
      if (s.sprite.visible) s.sprite.position.set(x, y);
    }
  }
}

export class TargetBuilding {
  readonly root = new Container();
  private readonly halo: Graphics;

  constructor(assets: Assets, p: PropDef) {
    const { w, h } = propSize(p);
    this.halo = new Graphics().roundRect(p.x - w / 2 - 10, p.y - h / 2 - 10, w + 20, h + 20, 20).fill(C.mint);
    this.root.addChild(this.halo, propSprite(assets, p));
  }

  sync(done: boolean, t: number, rm: boolean): void {
    this.halo.visible = !done;
    this.halo.alpha = 0.12 + (rm ? 0 : 0.04 * Math.sin(t * 3));
  }
}

export class VehicleView {
  readonly root = new Container();
  readonly shadow: Sprite | null;

  constructor(assets: Assets, key: string, scale: number, fallback: Painter, alpha = 0.3) {
    const w = (ART[key]?.w ?? 80) * scale;
    const h = (ART[key]?.h ?? 150) * scale;
    this.root.addChild(spriteOr(assets, key, w, h, fallback));
    this.shadow = artShadow(assets, key, w, h, alpha);
  }

  sync(x: number, y: number, heading: number, ox: number, oy: number, visible: boolean): void {
    const a = heading + Math.PI / 2;
    this.root.visible = visible;
    if (this.shadow) this.shadow.visible = visible;
    if (!visible) return;
    this.root.position.set(x, y);
    this.root.rotation = a;
    if (this.shadow) {
      this.shadow.position.set(x + ox, y + oy);
      this.shadow.rotation = a;
    }
  }
}
