import { Container, Graphics, Sprite } from 'pixi.js';
import type { Assets } from '../../contracts';
import { paintedTexture } from '../../core/gfx/textures';
import { isBlinking } from '../draw';
import { C } from '../theme';
import { artSprite } from './art';

const VRELL_EYES = 'M49 83Q62 75 80 83Q75 98 58 96Q51 93 49 83ZM95 80Q111 69 131 76Q126 91 109 92Q100 91 95 80Z';
const VRELL_LIDS = 'M51 88Q64 93 78 87M97 85Q112 89 129 80';

function blinkSprite(size: number): Sprite {
  const blink = new Sprite(paintedTexture(`vrell|blink|${size}`, size, size, (g) => {
    g.scale(size / 200, size / 200);
    g.translate(1, -3);
    g.scale(0.994, 1.009);
    const eyes = new Path2D(VRELL_EYES);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.fillStyle = '#a387b1';
    g.fill(eyes);
    g.strokeStyle = C.ink;
    g.lineWidth = 3;
    g.stroke(eyes);
    g.lineWidth = 3.5;
    g.stroke(new Path2D(VRELL_LIDS));
  }));
  blink.anchor.set(0.5);
  return blink;
}

function vrellFallback(size: number): Graphics {
  const g = new Graphics();
  g.scale.set(size / 200);
  g.ellipse(0, 30, 70, 78).fill('#9b7bd8').stroke({ color: C.ink, width: 5 });
  for (const x of [-24, 24]) {
    g.ellipse(x, 0, 14, 9).fill('#fff');
    g.rect(x - 14, -4, 28, 5).circle(x, 3, 4).fill(C.ink);
    g.circle(x, 0, 16).stroke({ color: C.ink, width: 3 });
  }
  g.moveTo(-8, 0).lineTo(8, 0).moveTo(-16, 34).lineTo(16, 30).stroke({ color: C.ink, width: 3 });
  g.rect(34, 40, 50, 64).fill('#c99a5b').rect(40, 50, 38, 48).fill('#f4efe2');
  return g;
}

/** Vrell in his circular frame, with an optional furious expression. */
export class VrellPortrait {
  readonly root = new Container();
  private readonly blink: Sprite | null;
  private readonly fallback: Graphics | null;
  private readonly size: number;

  constructor(assets: Assets, x: number, y: number, size: number, furious = false) {
    this.size = size;
    this.root.position.set(x, y);
    const r = size / 2;
    const clip = new Graphics().circle(0, 0, r).fill('#ffffff');
    const contents = new Container();
    contents.mask = clip;
    this.root.addChild(clip, contents);

    const angry = furious ? artSprite(assets, 'ui/vrell_furious', size, size) : null;
    if (angry) {
      contents.addChild(angry);
      this.blink = null;
      this.fallback = null;
      return;
    }

    contents.addChild(new Graphics().circle(0, 0, r).fill('#3a2f80'));
    const art = artSprite(assets, 'ui/vrell_portrait', size, size);
    this.blink = art ? blinkSprite(size) : null;
    this.fallback = art ? null : vrellFallback(size);
    if (art) contents.addChild(art);
    if (this.blink) contents.addChild(this.blink);
    if (this.fallback) contents.addChild(this.fallback);
    this.root.addChild(new Graphics().circle(0, 0, r).stroke({ color: C.ink, width: 4 }));
  }

  sync(t: number, reduced: boolean): void {
    if (this.blink) this.blink.visible = !reduced && isBlinking(t);
    if (this.fallback) this.fallback.y = reduced ? 0 : Math.sin(t * 2) * this.size / 100;
  }
}
