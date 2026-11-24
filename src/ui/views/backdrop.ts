// Menu backdrops: the starry night sky and the sleepy skyline along the bottom.
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { VIEW_H, VIEW_W } from '../../contracts';
import { paintedTexture } from '../../core/gfx/textures';

interface StarPt {
  x: number;
  y: number;
  r: number;
  p: number;
}

const STARS: readonly StarPt[] = (() => {
  let seed = 1337;
  const rnd = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const out: StarPt[] = [];
  for (let i = 0; i < 90; i++) out.push({ x: rnd() * VIEW_W, y: rnd() * VIEW_H, r: 0.6 + rnd() * 1.8, p: rnd() * 6.28 });
  return out;
})();

function skyTexture(): Texture {
  return paintedTexture('ui|night-sky', 4, 96, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 96);
    grad.addColorStop(0, '#0d0924');
    grad.addColorStop(0.6, '#1e1747');
    grad.addColorStop(1, '#33236b');
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 96);
  }, 1);
}

/** Night-sky gradient with twinkling stars over the whole view. `sync(t, reduced)` each frame. */
export class NightSky extends Container {
  private readonly stars: Sprite[] = [];

  constructor() {
    super();
    const sky = new Sprite(skyTexture());
    sky.width = VIEW_W;
    sky.height = VIEW_H;
    this.addChild(sky);
    for (const s of STARS) {
      const dot = new Sprite(Texture.WHITE);
      dot.position.set(s.x, s.y);
      dot.width = dot.height = s.r;
      this.stars.push(dot);
      this.addChild(dot);
    }
  }

  sync(t: number, reduced: boolean): void {
    for (let i = 0; i < STARS.length; i++) {
      const s = STARS[i]!;
      this.stars[i]!.alpha = reduced ? 0.7 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.7 + s.p));
    }
  }
}

const ROOFS = [
  [0, 120, 90],
  [80, 170, 70],
  [140, 110, 120],
  [250, 200, 80],
  [320, 140, 110],
  [420, 180, 70],
  [480, 130, 80],
] as const;
/**
 * A few lit windows; one flickers off now and then. Kept above the bottom-left footer text
 * (y > baseY - 50) and out of the bottom-right mute button (x 448..516, y > baseY - 92).
 */
const WINDOWS = [
  [30, 104],
  [110, 120],
  [180, 96],
  [280, 150],
  [360, 90],
  [440, 130],
  [520, 118],
] as const;
const FLICKER = 3;

/** Sleepy town silhouette along the bottom (title / report backgrounds). `sync(t)` each frame. */
export class Skyline extends Container {
  private readonly flicker: Graphics;

  constructor(baseY = VIEW_H) {
    super();
    const g = new Graphics();
    for (const [x, h, w] of ROOFS) {
      g.rect(x, baseY - h, w, h).fill('#150f33');
      g.poly([x - 6, baseY - h, x + w / 2, baseY - h - 34, x + w + 6, baseY - h]).fill('#150f33');
    }
    for (let i = 0; i < WINDOWS.length; i++) {
      if (i === FLICKER) continue;
      const [x, h] = WINDOWS[i]!;
      g.rect(x, baseY - h + 10, 16, 20).fill('rgba(255,200,110,0.85)');
    }
    const [fx, fh] = WINDOWS[FLICKER]!;
    this.flicker = new Graphics().rect(fx, baseY - fh + 10, 16, 20).fill('#ffffff');
    this.addChild(g, this.flicker);
  }

  sync(t: number): void {
    const on = Math.sin(t * 0.7) > -0.3;
    // lit: warm amber; off: a dim lilac pane
    this.flicker.tint = on ? 0xffc86e : 0x504678;
    this.flicker.alpha = on ? 0.85 : 0.6;
  }
}
