import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { GLOW, Glow, glowTexture } from '../../core/gfx/glow';
import { Label } from '../../core/gfx/text';
import { C } from '../../ui/theme';
import { CAT_COATS, catPos, type Ambient } from '../ambient';
import type { CameraView } from './world';

const QUESTION = { size: 20, color: C.text, weight: 900, outline: C.ink } as const;

class CatView {
  readonly root = new Container();
  private readonly body = new Container();
  private readonly head = new Container();
  private readonly eyes = new Graphics().circle(4.5, -3, 2.2).circle(4.5, 3, 2.2).fill('#eaffd0');
  private readonly tail = new Container();
  private readonly paws: Graphics[] = [];
  private readonly question = new Label(QUESTION, '?');

  constructor(coat: string) {
    this.tail.position.set(-12, 0);
    this.tail.addChild(new Graphics().moveTo(0, 0).quadraticCurveTo(-10, 1.5, -15, 4.5)
      .stroke({ color: C.ink, width: 6.5, cap: 'round' }).moveTo(0, 0).quadraticCurveTo(-10, 1.5, -15, 4.5)
      .stroke({ color: coat, width: 3.5, cap: 'round' }));
    this.body.addChild(this.tail);
    for (let k = 0; k < 4; k++) {
      const paw = new Graphics().circle(0, 0, 3.2).fill(C.ink);
      paw.y = k % 2 === 0 ? 7.5 : -7.5;
      this.paws.push(paw);
      this.body.addChild(paw);
    }
    this.head.position.set(13, 0);
    this.head.addChild(new Graphics()
      .poly([-3, -8, 3, -10, 4, -4]).poly([-3, 8, 3, 10, 4, 4]).fill(coat)
      .stroke({ color: C.ink, width: 2.6, join: 'round' })
      .circle(1, 0, 7).fill(coat).stroke({ color: C.ink, width: 2.6 }), this.eyes);
    this.body.addChild(new Graphics().ellipse(-1, 0, 14, 8).fill(coat).stroke({ color: C.ink, width: 2.6 }), this.head);
    this.root.addChild(this.body, this.question);
  }

  sync(x: number, y: number, angle: number, look: number, t: number, stare: number, rm: boolean): void {
    const walk = rm ? 0 : Math.sin(t * 9) * (1 - stare);
    this.root.position.set(x, y);
    this.body.rotation = angle;
    this.tail.rotation = rm ? 0 : Math.sin(t * (2.4 + stare * 6)) * (0.5 + stare * 0.5) * 0.72;
    for (let k = 0; k < 4; k++) this.paws[k]!.x = (k < 2 ? 8 : -8) + walk * (k % 2 === 0 ? 1 : -1) * 3.5;
    const delta = look - angle;
    this.head.rotation = Math.max(-1.3, Math.min(1.3, Math.atan2(Math.sin(delta), Math.cos(delta)))) * stare;
    this.eyes.visible = stare > 0.4;
    this.question.visible = stare > 0.6;
    this.question.position.set(4, -26 - (rm ? 0 : Math.sin(t * 5) * 2));
    this.question.alpha = (stare - 0.6) / 0.4;
  }
}

interface Vapor {
  root: Container;
  dots: Graphics[];
}

export class AmbientView {
  readonly ground = new Container();
  readonly steam = new Container();
  readonly lights = new Container();
  readonly critters = new Container();
  private readonly glints: Graphics[] = [];
  private readonly paper = new Graphics().rect(-9, -7, 18, 14).fill('#d8d2c4').stroke({ color: C.ink, width: 1.6 })
    .rect(-6, -4, 12, 1.6).rect(-6, -1, 9, 1.6).rect(-6, 2, 11, 1.6).fill('#8f8aa0');
  private readonly cats: CatView[] = [];
  private readonly chimneyPuffs: Vapor[];
  private readonly gratePuffs: Vapor[];
  private readonly tvs: Glow[] = [];
  private readonly redLights: Glow[] = [];
  private readonly moths: Sprite[] = [];
  private readonly flies: (Glow | Sprite)[] = [];
  private readonly roomLight = glowTexture(GLOW.lamp);
  private readonly tvLight = glowTexture('120,190,255');
  private readonly pos = { x: 0, y: 0, a: 0 };

  constructor(private readonly a: Ambient) {
    for (let i = 0; i < a.pools.length / 3 * 2; i++) {
      const glint = new Graphics().moveTo(-9, 0).quadraticCurveTo(0, -3, 9, 0)
        .stroke({ color: 'rgba(220,255,250,0.5)', width: 2.5, cap: 'round' });
      this.ground.addChild(glint);
      this.glints.push(glint);
    }
    this.ground.addChild(this.paper);
    for (let i = 0; i < a.catCount; i++) {
      const cat = new CatView(CAT_COATS[a.cats[i * 7 + 6]!]!);
      this.cats.push(cat);
      this.critters.addChild(cat.root);
    }
    this.chimneyPuffs = this.makeVapor(a.smoke, 4, '#b9b4cf', this.critters);
    this.gratePuffs = this.makeVapor(a.vents, 3, '#c9cfe6', this.steam, true);
    for (let i = 0; i < a.tvs.length; i += 4) {
      this.tvs.push(this.lights.addChild(new Glow(this.tvLight, true).place(a.tvs[i]!, a.tvs[i + 1]!, 38, 26)));
    }
    const red = glowTexture(GLOW.red);
    for (let i = 0; i < a.beacons.length; i += 3) {
      this.redLights.push(this.lights.addChild(new Glow(red, true).place(a.beacons[i]!, a.beacons[i + 1]!, 20)));
    }
    for (let i = 0; i < a.moths.length; i += 3) {
      const moth = new Sprite(Texture.WHITE);
      moth.anchor.set(0.5);
      moth.tint = '#fff4d6';
      moth.blendMode = 'add';
      moth.height = 3;
      this.moths.push(this.lights.addChild(moth));
    }
    const flyLight = glowTexture('200,255,140');
    for (let i = 0; i < a.flies.length; i += 3) {
      const fly = a.suburb ? new Glow(flyLight, true).place(0, 0, 9) : new Sprite(Texture.WHITE);
      if (!a.suburb) {
        fly.anchor.set(0.5);
        fly.tint = '#bec8ff';
        fly.width = fly.height = 3;
        fly.blendMode = 'add';
      }
      this.flies.push(this.lights.addChild(fly));
    }
  }

  private makeVapor(points: Float32Array, count: number, color: string, layer: Container, grate = false): Vapor[] {
    const puffs: Vapor[] = [];
    for (let i = 0; i < points.length; i += 3) {
      const root = new Container();
      root.position.set(points[i]!, points[i + 1]!);
      if (grate) root.addChild(new Graphics().rect(-11, -7, 22, 14).fill({ color: '#12101f', alpha: 0.5 }));
      const dots: Graphics[] = [];
      for (let k = 0; k < count; k++) dots.push(root.addChild(new Graphics().circle(0, 0, 16).fill(color)));
      puffs.push({ root, dots });
      layer.addChild(root);
    }
    return puffs;
  }

  sync(cam: CameraView, t: number, rm: boolean, dawn: number, sx: number, sy: number): void {
    const a = this.a;
    for (let i = 0; i < a.pools.length; i += 3) {
      const x = a.pools[i]!;
      const y = a.pools[i + 1]!;
      const hw = a.pools[i + 2]!;
      const seen = cam.sees(x, y, 90);
      for (let k = 0; k < 2; k++) {
        const glint = this.glints[i / 3 * 2 + k]!;
        glint.visible = seen;
        if (!seen) continue;
        const p = rm ? k * 0.5 : (t * 0.22 + k * 0.5 + i) % 1;
        glint.position.set(x - hw + p * hw * 2, y - 14 + k * 26);
        glint.scale.x = Math.sin(Math.PI * p);
      }
    }
    const len = a.paper[2]!;
    const px = a.paper[0]! + t * 34 % (len + 200) - 100;
    const py = a.paper[1]! + Math.sin(t * 1.3) * 14;
    this.paper.visible = len > 0 && !rm && cam.sees(px, py, 30);
    if (this.paper.visible) {
      this.paper.position.set(px, py);
      this.paper.rotation = t * 2.2;
      this.paper.scale.y = 0.55 + 0.45 * Math.abs(Math.sin(t * 3.1));
    }
    for (let i = 0; i < this.cats.length; i++) {
      const c = a.cats;
      const o = i * 7;
      const p = this.pos;
      catPos(c[o]!, c[o + 1]!, c[o + 2]!, c[o + 3]!, c[o + 4]!, p);
      const cat = this.cats[i]!;
      cat.root.visible = cam.sees(p.x, p.y, 60);
      if (cat.root.visible) cat.sync(p.x, p.y, p.a, Math.atan2(sy - p.y, sx - p.x), t + i * 1.7, c[o + 5]!, rm);
    }
    this.syncVapor(this.chimneyPuffs, a.smoke, cam, t, rm, false);
    this.syncVapor(this.gratePuffs, a.vents, cam, t, rm, true);
    for (let i = 0; i < this.tvs.length; i++) {
      const g = this.tvs[i]!;
      const j = i * 4;
      // `place` sets the final visibility: showing it first and letting place hide a dark window
      // would flip `visible` twice a frame and rebuild the whole render group every frame
      if (!cam.sees(g.x, g.y, 44)) {
        g.visible = false;
        continue;
      }
      if (dawn > a.tvs[j + 3]!) {
        g.texture = this.roomLight;
        g.place(g.x, g.y, 44, 30, 0.9);
      } else {
        const ph = a.tvs[j + 2]!;
        g.texture = this.tvLight;
        const k = rm ? 0.5 : 0.35 + 0.65 * Math.abs(Math.sin(t * 7.3 + ph) * Math.sin(t * 2.9 + ph * 2));
        g.place(g.x, g.y, 38, 26, ph < 0 ? 0 : 0.9 * k);
      }
    }
    for (let i = 0; i < this.redLights.length; i++) {
      const g = this.redLights[i]!;
      const on = rm || (t + a.beacons[i * 3 + 2]!) % 1.6 < 0.28;
      const r = on ? 20 : 8;
      g.visible = cam.sees(g.x, g.y, 30);
      if (g.visible) g.place(g.x, g.y, r, r, on ? 0.95 : 0.5);
    }
    for (let i = 0; i < this.moths.length; i++) {
      const moth = this.moths[i]!;
      const j = i * 3;
      const x = a.moths[j]!;
      const y = a.moths[j + 1]!;
      moth.visible = cam.sees(x, y, 60);
      if (!moth.visible) continue;
      const ph = a.moths[j + 2]!;
      const angle = rm ? ph : t * (1.6 + j % 5 * 0.23) + ph;
      const r = 22 + 14 * Math.sin(angle * 0.7 + ph);
      const flap = rm ? 1 : 0.5 + 0.5 * Math.sin(t * 40 + ph);
      moth.position.set(x + Math.cos(angle) * r, y + Math.sin(angle * 1.3) * r * 0.8);
      moth.width = 4 + flap * 4;
    }
    for (let i = 0; i < this.flies.length; i++) {
      const fly = this.flies[i]!;
      const j = i * 3;
      const ph = a.flies[j + 2]!;
      const x = a.flies[j]! + (rm ? 0 : Math.sin(t * 0.31 + ph) * 46);
      const y = a.flies[j + 1]! + (rm ? 0 : Math.cos(t * 0.23 + ph * 1.7) * 38);
      const blink = rm ? 0.6 : Math.max(0, Math.sin(t * 1.4 + ph * 3));
      // the blink goes through alpha (0 between blinks), not `visible`, so it never changes the
      // render group's structure
      fly.visible = cam.sees(x, y, 12);
      if (!fly.visible) continue;
      fly.position.set(x, y);
      fly.alpha = blink >= 0.08 ? blink * (a.suburb ? 1 - dawn : 0.35) : 0;
    }
  }

  private syncVapor(groups: readonly Vapor[], points: Float32Array, cam: CameraView, t: number, rm: boolean, grate: boolean): void {
    for (let i = 0; i < groups.length; i++) {
      const { root, dots } = groups[i]!;
      root.visible = cam.sees(root.x, root.y, grate ? 70 : 90);
      if (!root.visible) continue;
      for (let k = 0; k < dots.length; k++) {
        const dot = dots[k]!;
        const p = rm ? (grate ? 0.3 : 0.2) + k * 0.2 :
          (t * (grate ? 0.33 : 0.22) + points[i * 3 + 2]! + k / dots.length) % 1;
        dot.position.set(grate ? Math.sin(p * 5 + k) * 9 + p * 16 : p * 46 + Math.sin(p * 6 + k) * 6, -p * (grate ? 46 : 58));
        dot.scale.set((grate ? 7 + p * 17 : 6 + p * 15) / 16);
        dot.alpha = (grate ? 0.2 : 0.3) * Math.sin(Math.PI * p);
      }
    }
  }
}
