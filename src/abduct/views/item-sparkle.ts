// v4 items & recap humour: the loose souvenir reads as collectable. Until the beam grabs it, the item
// has a faint mint halo (mint = your goals) and three small white twinkles at its corners that
// blink in turn. Reduced motion keeps a still halo and no twinkles. Built once; sync() only sets
// position and alpha, and `visible` changes only when the item is grabbed, delivered or culled.
// Halo and twinkles use the normal blend and sit just behind the item, so they batch with it (an
// additive run there cost 3-4 draw calls per frame).
import { Container, Sprite, type Texture } from 'pixi.js';
import { GLOW } from '../../core/fx';
import { Glow, glowTexture } from '../../core/gfx/glow';
import { paintedTexture } from '../../core/gfx/textures';

const STAR = 16;
/** Corner offsets (share of the item's half size) and blink phases of the twinkles. */
const TWINKLES = [
  { dx: -1.05, dy: -0.95, phase: 0 },
  { dx: 1.1, dy: -0.35, phase: 2.1 },
  { dx: -0.55, dy: 1.05, phase: 4.2 },
] as const;
/** Blink with alpha, not `visible` (docs/PIXI-MIGRATION.md): a star between flashes stays faintly on. */
const TWINKLE_FLOOR = 0.03;

/** A small four-point star: white core, mint fringe. Painted once. */
function starTexture(): Texture {
  return paintedTexture('item-sparkle|star', STAR, STAR, (g) => {
    const c = STAR / 2;
    const glow = g.createRadialGradient(c, c, 0, c, c, c);
    glow.addColorStop(0, `rgba(${GLOW.white},0.9)`);
    glow.addColorStop(0.4, `rgba(${GLOW.mint},0.35)`);
    glow.addColorStop(1, `rgba(${GLOW.mint},0)`);
    g.fillStyle = glow;
    g.fillRect(0, 0, STAR, STAR);
    g.fillStyle = `rgba(${GLOW.white},1)`;
    g.beginPath();
    g.moveTo(c, 0);
    g.quadraticCurveTo(c, c, STAR, c);
    g.quadraticCurveTo(c, c, c, STAR);
    g.quadraticCurveTo(c, c, 0, c);
    g.quadraticCurveTo(c, c, c, 0);
    g.fill();
  });
}

export class ItemSparkle {
  readonly root = new Container();
  private readonly halo = new Glow(glowTexture(GLOW.mint));
  private readonly stars: Sprite[] = [];
  private shown = true;
  private still: boolean | undefined;

  constructor() {
    this.root.addChild(this.halo);
    const texture = starTexture();
    for (let i = 0; i < TWINKLES.length; i++) {
      const star = new Sprite(texture);
      star.anchor.set(0.5);
      star.alpha = TWINKLE_FLOOR;
      this.stars.push(star);
      this.root.addChild(star);
    }
  }

  /**
   * Item centre (x, y) and art size; `on` while the item lies loose and in view. `time` drives the
   * blink (seconds); `reducedMotion` holds a still halo with no twinkles.
   */
  sync(on: boolean, x: number, y: number, w: number, h: number, time: number, reducedMotion: boolean): void {
    if (on !== this.shown) {
      this.shown = on;
      this.root.visible = on;
    }
    if (!on) return;
    if (reducedMotion !== this.still) {
      this.still = reducedMotion;
      for (const star of this.stars) star.visible = !reducedMotion;
    }
    const r = Math.max(w, h) * 0.95;
    const pulse = reducedMotion ? 0 : Math.sin(time * 2.3);
    this.halo.position.set(x, y);
    this.halo.width = r * 2;
    this.halo.height = r * 2;
    this.halo.alpha = 0.34 + pulse * 0.08;
    if (reducedMotion) return;
    for (let i = 0; i < TWINKLES.length; i++) {
      const spec = TWINKLES[i]!;
      const star = this.stars[i]!;
      // a short flash every ~2.7 s per star, staggered
      const s = Math.sin(time * 2.3 + spec.phase);
      const flash = s > 0 ? s * s * s * s * s * s : 0;
      star.position.set(x + spec.dx * w * 0.5, y + spec.dy * h * 0.5);
      star.alpha = TWINKLE_FLOOR + flash * 0.85;
      star.scale.set(0.55 + flash * 0.45);
    }
  }
}
