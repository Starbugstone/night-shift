// Pixi view of the shared `Particles` pool (src/core/fx.ts keeps the simulation, which stays
// DOM-free and testable). One sprite per pool slot, made up front; each frame only moves, scales,
// tints and fades them. Shapes are white textures painted once and tinted per particle.
import { Container, Sprite, type Texture } from 'pixi.js';
import { P_PUFF, P_RING, P_SPARK, P_STAR, P_TWINKLE, PARTICLE_COLORS, PARTICLE_OUTLINE, type Particles } from '../fx';
import { paintedTexture } from './textures';

const TAU = Math.PI * 2;
/** Logical radius each shape texture is painted at (sprites scale from it). */
const R = 16;

function starTexture(): Texture {
  return paintedTexture('particle|star', R * 2 + 8, R * 2 + 8, (g) => {
    const c = R + 4;
    g.beginPath();
    for (let p = 0; p < 10; p++) {
      const a = -Math.PI / 2 + (p * Math.PI) / 5;
      const r = p % 2 === 0 ? R : R * 0.46;
      const x = c + Math.cos(a) * r;
      const y = c + Math.sin(a) * r;
      if (p === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.lineJoin = 'round';
    g.lineWidth = R * 0.28;
    g.strokeStyle = PARTICLE_OUTLINE;
    g.stroke();
    g.fillStyle = '#ffffff';
    g.fill();
  }, 2);
}

function discTexture(): Texture {
  return paintedTexture('particle|disc', R * 2, R * 2, (g) => {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(R, R, R, 0, TAU);
    g.fill();
  }, 2);
}

/** A horizontal round-capped bar, 4 units tall; sparks stretch it along their velocity. */
function sparkTexture(): Texture {
  return paintedTexture('particle|spark', 32, 4, (g) => {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.roundRect(0, 0, 32, 4, 2);
    g.fill();
  }, 4);
}

function ringTexture(): Texture {
  return paintedTexture('particle|ring', R * 2 + 8, R * 2 + 8, (g) => {
    g.strokeStyle = '#ffffff';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(R + 4, R + 4, R, 0, TAU);
    g.stroke();
  }, 2);
}

function twinkleTexture(): Texture {
  return paintedTexture('particle|twinkle', R * 2, R * 2, (g) => {
    const s = R;
    const w = s * 0.24;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(R, R - s);
    g.lineTo(R + w, R - w);
    g.lineTo(R + s, R);
    g.lineTo(R + w, R + w);
    g.lineTo(R, R + s);
    g.lineTo(R - w, R + w);
    g.lineTo(R - s, R);
    g.lineTo(R - w, R - w);
    g.closePath();
    g.fill();
  }, 2);
}

const TINTS = PARTICLE_COLORS.map((c) => parseInt(c.slice(1), 16));

/** Draws a `Particles` pool. Add it where the old `fx.draw(g)` call was, and call `sync()` each frame. */
export class ParticleView extends Container {
  private readonly sprites: Sprite[] = [];
  private readonly tex: readonly Texture[];

  constructor(private readonly pool: Particles) {
    super();
    // indexed by particle kind
    this.tex = [starTexture(), discTexture(), sparkTexture(), ringTexture(), twinkleTexture()];
    for (let i = 0; i < pool.cap; i++) {
      const s = new Sprite(this.tex[0]);
      s.anchor.set(0.5);
      s.alpha = 0;
      this.sprites.push(s);
      this.addChild(s);
    }
  }

  sync(): void {
    const p = this.pool;
    // slots come and go every few frames, so a free slot is hidden with alpha 0, never `visible`
    // (each visible flip rebuilds the render group); the whole view hides only when the pool is empty
    this.visible = p.active > 0;
    if (!this.visible) return;
    for (let i = 0; i < p.cap; i++) {
      const s = this.sprites[i]!;
      const life = p.life[i]!;
      if (life <= 0) {
        s.alpha = 0;
        continue;
      }
      const k = 1 - life / p.span[i]!;
      const size = p.size[i]!;
      const kind = p.kind[i]!;
      let on = true;
      s.rotation = 0;
      switch (kind) {
        case P_STAR: {
          const r = size * (k < 0.18 ? k / 0.18 : k > 0.6 ? (1 - k) / 0.4 : 1);
          on = r >= 0.4;
          s.scale.set(r / R);
          s.rotation = p.rot[i]!;
          s.alpha = 1;
          break;
        }
        case P_PUFF:
          s.scale.set((size * (0.45 + 0.75 * k)) / R);
          s.alpha = (1 - k) * 0.7;
          break;
        case P_SPARK: {
          const vx = p.vx[i]!;
          const vy = p.vy[i]!;
          const sp = Math.hypot(vx, vy) || 1;
          const len = Math.min(size * 3.2, sp * 0.035) + size * 0.5;
          const w = size * (1 - k * 0.6);
          // the bar trails behind the particle, from its head back along the velocity
          s.anchor.set(1 - w / 2 / (len + w), 0.5);
          s.scale.set((len + w) / 32, w / 4);
          s.rotation = Math.atan2(vy, vx);
          s.alpha = 1 - k * k;
          break;
        }
        case P_RING: {
          const e = 1 - (1 - k) * (1 - k) * (1 - k);
          s.scale.set((size * (0.25 + 0.75 * e)) / R);
          s.alpha = 1 - k;
          break;
        }
        case P_TWINKLE: {
          const r = size * Math.sin(Math.PI * Math.min(1, k * 1.05));
          on = r >= 0.3;
          s.scale.set(r / R);
          s.alpha = 1 - k * 0.5;
          break;
        }
      }
      if (!on) {
        s.alpha = 0;
        continue;
      }
      const tex = this.tex[kind]!;
      if (s.texture !== tex) {
        s.texture = tex;
        if (kind !== P_SPARK) s.anchor.set(0.5);
      }
      s.tint = TINTS[p.color[i]!]!;
      s.position.set(p.x[i]!, p.y[i]!);
    }
  }
}
