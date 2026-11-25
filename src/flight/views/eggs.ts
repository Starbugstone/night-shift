// v4 easter eggs: what the flight-map cameos add round their sprite (src/flight/easter-eggs.ts). The
// time car gets two scorched tyre streaks on the ground behind it and a soft instrument glow in its
// cabin, pulsing slowly (steady with reduced motion). Decor: a borderless radial glow, never an
// edged pool of light, and nothing here is read by the flight sims.
import { Container, Sprite } from 'pixi.js';
import { Glow, radialTexture } from '../../core/gfx/glow';
import type { PropDef } from '../../levels/types';
import { eggOf } from '../easter-eggs';
import { propSize } from '../props';
import { paintedSprite, type CameraView } from './world';

const GLOW_STOPS = [
  [0, 'rgba(150,230,255,0.9)'],
  [0.45, 'rgba(120,200,255,0.35)'],
  [1, 'rgba(120,200,255,0)'],
] as const;

/** Two warm scuffs fading out behind the car (local -x), painted once. */
function streakSprite(len: number, w: number, h: number): Sprite {
  const W = len + 8;
  const H = h;
  const s = paintedSprite(`egg|streaks|${len}|${h}`, W, H, (g) => {
    for (const ty of [-0.3, 0.3]) {
      const y = ty * h;
      const grad = g.createLinearGradient(W / 2, 0, -W / 2, 0);
      grad.addColorStop(0, 'rgba(255,140,60,0.55)');
      grad.addColorStop(0.18, 'rgba(70,40,30,0.75)');
      grad.addColorStop(1, 'rgba(40,30,30,0)');
      g.fillStyle = grad;
      g.beginPath();
      const t = h * 0.17;
      g.roundRect(-W / 2, y - t / 2, W, t, t / 2);
      g.fill();
    }
  });
  s.anchor.set(1, 0.5);
  s.position.set(-w / 2 + 6, 0);
  return s;
}

interface EggParts {
  x: number;
  y: number;
  glow: Glow | null;
  glowR: number;
}

export class EggView {
  /** Under the props: tyre streaks. */
  readonly ground = new Container();
  /** Over the night wash: the instrument glow. */
  readonly lights = new Container();
  private readonly eggs: EggParts[] = [];

  constructor(props: readonly PropDef[]) {
    for (const p of props) {
      const spec = eggOf(p);
      if (!spec) continue;
      const { w, h } = propSize(p);
      const rot = p.rot ?? 0;
      if (spec.streaks) {
        const holder = new Container();
        holder.position.set(p.x, p.y);
        holder.rotation = rot;
        holder.addChild(streakSprite(spec.streaks, w, h));
        this.ground.addChild(holder);
      }
      let glow: Glow | null = null;
      if (spec.glow) {
        glow = new Glow(radialTexture('egg-cabin', GLOW_STOPS, 64), true);
        const lx = spec.glow.x - w / 2;
        const ly = spec.glow.y - h / 2;
        glow.position.set(p.x + lx * Math.cos(rot) - ly * Math.sin(rot), p.y + lx * Math.sin(rot) + ly * Math.cos(rot));
        this.lights.addChild(glow);
      }
      this.eggs.push({ x: p.x, y: p.y, glow, glowR: spec.glow?.r ?? 0 });
    }
  }

  sync(cam: CameraView, t: number, rm: boolean): void {
    for (const e of this.eggs) {
      const on = cam.sees(e.x, e.y, 200);
      if (!e.glow) continue;
      if (!on) {
        e.glow.visible = false;
        continue;
      }
      // a slow three-second breath; steady with reduced motion
      const k = rm ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.1);
      e.glow.place(e.glow.x, e.glow.y, e.glowR * (0.9 + 0.2 * k), e.glowR * (0.9 + 0.2 * k), 0.45 + 0.4 * k);
    }
    this.ground.visible = this.eggs.length > 0;
  }
}
