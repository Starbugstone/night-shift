import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../../contracts';
import { GLOW, Glow, glowTexture } from '../../core/gfx/glow';
import { Shape, keyOf } from '../../core/gfx/shapes';
import { Label } from '../../core/gfx/text';
import { C } from '../../ui/theme';
import { artSprite } from '../../ui/views/art';
import type { CameraHazard, DogHazard, HeliHazard, PorchHazard, WatcherHazard, WindowHazard } from '../hazards';
import { PORCH, WATCHER_TELL } from '../hazards';
import { wrapAngle } from '../geometry';
import { clamp } from '../../ui/draw';
import { ConeView, DiscTell, ProgressArc, RED, arc, dashedArc, dashedLine, sectorPath } from './tells';
import { TAU } from './world';
import { woof } from './overlays';

export const BLUE = '90,140,255';
const LOOK = { size: 24, color: C.amberHi, outline: C.ink, weight: 900 } as const;

export class BeaconView {
  readonly root = new Container();
  private readonly disc = new DiscTell(3, 4.5);
  private readonly sweep: Graphics;

  constructor(private readonly radius: number, private readonly ambulance = false) {
    this.sweep = sectorPath(new Graphics(), radius, 0, 0.6).fill(0xffffff);
    this.root.addChild(this.disc.root, this.sweep);
  }

  sync(x: number, y: number, angle: number, t: number, rm: boolean, hot: number): void {
    // The beacon's fill still alternates while its hard edge shows that it sees the saucer.
    this.root.position.set(x, y);
    const blue = rm || Math.floor(t * 6) % 2 === 0;
    const other = this.ambulance ? '#dce8ff' : RED;
    this.disc.sync(0, 0, this.radius, blue ? '#5a8cff' : other,
      blue && this.ambulance ? 0.15 : !blue && this.ambulance ? 0.12 : 0.14,
      blue ? '#78aaff' : this.ambulance ? other : '#ff6e82', 0.82, hot > 0);
    this.sweep.visible = !rm;
    this.sweep.rotation = angle;
    this.sweep.tint = this.ambulance || blue ? '#5a8cff' : RED;
    this.sweep.alpha = this.ambulance ? 0.2 : 0.22;
  }
}

export class BarkTell {
  readonly root = new Container();
  private readonly disc = new DiscTell(4, 5.5, true);
  private readonly outer: Graphics;
  /** The WOOF label: the owner adds it to the flight's bubble layer (above every map object). */
  readonly shout = woof();

  constructor(private readonly d: DogHazard) {
    this.outer = new Graphics().circle(d.x, d.y, d.rMax).stroke({ color: '#ffffff', width: 1.5, alpha: 0.22 });
    this.shout.position.set(d.x, d.y - 50);
    this.root.addChild(this.disc.root, this.outer);
  }

  sync(r: number, t: number, rm: boolean, hot: number, seen: boolean): void {
    const d = this.d;
    const peak = (r - d.rMin) / (d.rMax - d.rMin);
    this.disc.sync(d.x, d.y, r, hot > 0 ? RED : '#ff8c3c', 0.08 + peak * 0.12,
      '#ffaa5a', 0.5 + peak * 0.5, hot > 0, rm ? 0 : t * 30 / r);
    this.outer.tint = hot > 0 ? RED : '#ffaa5a';
    this.shout.visible = seen && this.root.visible;
  }
}

export class PorchTell {
  readonly root = new Container();
  private readonly light = new Container();
  private readonly litEdge: Graphics;
  private readonly hotEdge: Graphics;
  private readonly sensor: Graphics;
  private readonly ghost = new Container();
  private readonly ghostFill: Graphics;
  private readonly ghostEdge: Graphics;
  private readonly burn: ProgressArc;
  private readonly arm: ProgressArc;
  private readonly standby = new Glow(glowTexture(GLOW.red), true);
  private readonly charging = new Glow(glowTexture(GLOW.amber), true);

  constructor(private readonly d: PorchHazard) {
    this.root.position.set(d.x, d.y);
    this.litEdge = new Graphics().circle(0, 0, d.r).stroke({ color: '#ffe296', width: 2.5 });
    this.hotEdge = new Graphics().circle(0, 0, d.r).stroke({ color: RED, width: 4.5 });
    this.burn = new ProgressArc(d.r - 7, 5, '#fff3c4');
    this.light.addChild(new Glow(glowTexture(GLOW.lamp), true).place(0, 0, d.r * 1.08, d.r * 1.08, 0.7),
      this.litEdge, this.hotEdge, this.burn.root);
    this.sensor = dashedArc(new Graphics(), d.trigger, 0, TAU, 4, 10).stroke({ color: 0xffffff, width: 2 });
    this.ghostFill = new Graphics().circle(0, 0, d.r).fill(C.amber);
    this.ghostEdge = dashedArc(new Graphics(), d.r, 0, TAU, 14, 10).stroke({ color: C.amber, width: 3.5 });
    this.arm = new ProgressArc(d.trigger, 6, C.amber);
    this.ghost.addChild(this.ghostFill, this.ghostEdge, this.arm.root, this.charging);
    this.root.addChild(this.light, this.sensor, this.ghost, this.standby.place(0, 0, 9, 9, 0.9));
  }

  sync(lit: number, arm: number, hot: number, index: number, t: number, rm: boolean): void {
    this.light.visible = lit > 0;
    this.ghost.visible = lit <= 0 && arm > 0;
    // idle blink with alpha: a visible flip rebuilds the render group
    this.standby.visible = lit <= 0 && arm <= 0;
    this.standby.alpha = rm || (t * 0.45 + index * 0.31) % 1 < 0.08 ? 0.9 : 0;
    this.sensor.alpha = arm > 0 ? 0.85 : 0.3;
    this.sensor.tint = arm > 0 ? '#ffbe6e' : '#ffe296';
    if (this.light.visible) {
      this.light.alpha = lit < 0.5 && !rm && Math.floor(t * 20) % 2 === 0 ? 0.5 : 1;
      this.litEdge.visible = hot <= 0;
      this.hotEdge.visible = hot > 0;
      this.litEdge.alpha = this.hotEdge.alpha = 0.85;
      this.burn.root.alpha = 0.75;
      this.burn.sync(lit / PORCH.lit);
    }
    if (this.ghost.visible) {
      const k = Math.min(1, arm / PORCH.arm);
      this.ghostFill.alpha = 0.05 + 0.1 * k;
      this.ghostEdge.alpha = 0.35 + 0.6 * k;
      this.ghostEdge.rotation = rm ? 0 : t * 90 / this.d.r;
      this.arm.sync(k);
      this.charging.place(0, 0, 22 + 20 * k, 22 + 20 * k, 0.95);
    }
  }
}

export class WatcherTell {
  readonly root = new Container();
  private readonly cone: ConeView;
  private readonly ghost = new Container();
  private readonly ghostFill: Graphics;
  private readonly ghostEdge: Graphics;
  private readonly swing = new Shape();
  private readonly head = new Graphics().poly([12, 0, -8.8, 6.6, -8.8, -6.6]).fill(C.amberHi);
  private readonly glint = new Glow(glowTexture(GLOW.white), true);
  private readonly pupil?: Graphics;
  private readonly mark = new Label(LOOK, '!');
  private readonly r: number;

  constructor(private readonly d: WatcherHazard) {
    this.root.position.set(d.x, d.y);
    this.cone = new ConeView(d.half, d.range, '200,220,255', 0.7);
    this.ghostFill = sectorPath(new Graphics(), d.range, -d.half, d.half).fill(C.amber);
    const x = d.range * Math.cos(d.half);
    const y = d.range * Math.sin(d.half);
    this.ghostEdge = dashedLine(new Graphics(), 0, 0, x, -y, 14, 10);
    dashedArc(this.ghostEdge, d.range, -d.half, d.half, 14, 10);
    dashedLine(this.ghostEdge, x, y, 0, 0, 14, 10).stroke({ color: C.amberHi, width: 4, join: 'round' });
    this.ghost.addChild(this.ghostFill, this.ghostEdge);
    this.r = Math.min(150, d.range * 0.3);
    this.mark.position.set(22, -34);
    this.root.addChild(this.cone.root, this.ghost, this.swing, this.head, this.glint,
      new Glow(glowTexture(GLOW.amber), true).place(0, 0, 40, 40, 0.7));
    if (d.skin !== 'cafe55') {
      const eye = new Graphics().moveTo(-13, -28).quadraticCurveTo(0, -40, 13, -28)
        .quadraticCurveTo(0, -16, -13, -28).closePath().fill(C.paper).stroke({ color: C.ink, width: 2.5 });
      this.pupil = new Graphics().circle(0, 0, 5).fill('#3a2f5a').circle(1.5, -1.5, 1.6).fill(C.paper);
      this.root.addChild(eye, this.pupil);
    }
    this.root.addChild(this.mark);
  }

  sync(a: number, b: number, tell: boolean, lead: number, hot: number, t: number, hazardTime: number, rm: boolean): void {
    this.cone.sync(0, 0, a, hot, lead);
    this.ghost.visible = this.swing.visible = this.head.visible = this.glint.visible = this.mark.visible = tell;
    const look = tell ? b : a;
    this.pupil?.position.set(Math.cos(look) * 5, -28 + Math.sin(look) * 2.5);
    if (!tell) return;
    const d = this.d;
    const tau = hazardTime - Math.floor(hazardTime / d.hold) * d.hold;
    const k = clamp((tau - (d.hold - WATCHER_TELL)) / WATCHER_TELL, 0, 1);
    const beat = rm ? 1 : 0.7 + 0.3 * Math.sin(t * 34);
    this.ghost.rotation = b;
    this.ghostFill.alpha = (0.08 + 0.2 * k) * beat;
    this.ghostEdge.alpha = 0.55 + 0.45 * k;
    const da = wrapAngle(b - a) * k;
    this.swing.rotation = a;
    this.swing.alpha = 0.9;
    this.swing.draw(keyOf(da * this.r), (g) => {
      if (Math.abs(da) < 0.001) return;
      g.moveTo(this.r, 0).arc(0, 0, this.r, 0, da, da < 0)
        .stroke({ color: C.amberHi, width: 5, cap: 'round' });
    });
    const ha = a + da;
    this.head.position.set(Math.cos(ha) * this.r, Math.sin(ha) * this.r);
    this.head.rotation = ha + (da < 0 ? -1 : 1) * Math.PI / 2;
    this.glint.place(0, 0, 34 * beat, 34 * beat, 0.95);
  }
}

export class CameraTell {
  readonly root = new Container();
  private readonly cone: ConeView;
  private readonly scan: Graphics | null;
  private readonly rec: Glow | null;

  constructor(d: CameraHazard) {
    this.root.position.set(d.x, d.y);
    this.cone = new ConeView(d.half, d.range, d.skin ? '255,224,168' : '255,150,165', 0.75);
    this.scan = d.skin ? null : arc(new Graphics(), d.range / 2, -d.half, d.half).stroke({ color: '#ffd2d8', width: 2 });
    this.rec = d.skin ? null : new Glow(glowTexture(GLOW.red), true).place(0, 0, 15);
    this.root.addChild(this.cone.root);
    if (this.scan && this.rec) this.root.addChild(this.scan, this.rec);
  }

  sync(a: number, hot: number, lead: number, t: number, i: number, rm: boolean): void {
    this.cone.sync(0, 0, a, hot, lead);
    if (!this.scan || !this.rec) return;
    const k = rm ? 0.6 : (t * 0.9 + i * 0.37) % 1;
    this.scan.scale.set(k * 2);
    this.scan.rotation = a;
    this.scan.alpha = 0.55 * (1 - k);
    this.rec.alpha = rm || Math.floor(t * 2.5 + i) % 2 === 0 ? 1 : 0;
  }
}

export class SearchlightView {
  readonly root = new Container();
  private readonly edge: Graphics;
  private readonly hotEdge: Graphics;
  private readonly ticks = new Graphics();
  private readonly lead = new Graphics();

  constructor(d: HeliHazard) {
    const r = d.spotR;
    this.edge = new Graphics().circle(0, 0, r).stroke({ color: '#eaf2ff', width: 3.5 });
    this.hotEdge = new Graphics().circle(0, 0, r).stroke({ color: RED, width: 5 });
    for (let k = 0; k < 4; k++) {
      const a = k * TAU / 4;
      this.ticks.moveTo(Math.cos(a) * (r - 14), Math.sin(a) * (r - 14))
        .lineTo(Math.cos(a) * (r + 10), Math.sin(a) * (r + 10));
    }
    this.ticks.stroke({ color: 0xffffff, width: 4, cap: 'round' });
    arc(this.lead, r + 16, -0.5, 0.5).stroke({ color: C.amberHi, width: 5, alpha: 0.9, cap: 'round' });
    arc(this.lead, r + 30, -0.34, 0.34).stroke({ color: C.amberHi, width: 5, alpha: 0.5, cap: 'round' });
    this.root.addChild(new Glow(glowTexture(GLOW.cold), true).place(0, 0, r * 1.05, r * 1.05, 0.5),
      new Graphics().circle(0, 0, r).fill({ color: '#dbe8ff', alpha: 0.12 }).stroke({ color: '#0b0818', alpha: 0.5, width: 8 }),
      this.edge, this.hotEdge, this.ticks, this.lead);
  }

  sync(x: number, y: number, vx: number, vy: number, hot: number, t: number, rm: boolean): void {
    this.root.position.set(x, y);
    this.edge.visible = hot <= 0;
    this.hotEdge.visible = hot > 0;
    this.ticks.tint = hot > 0 ? RED : '#eaf2ff';
    this.ticks.rotation = rm ? 0 : t * 0.8;
    this.lead.visible = Math.hypot(vx, vy) > 30;
    this.lead.rotation = Math.atan2(vy, vx);
  }
}

export class WindowTell {
  readonly root = new Container();
  private readonly lamp: Container;
  private readonly dark = new Graphics().rect(-18, -10, 36, 20).fill('#2a2c48');
  private readonly silhouette = new Graphics().circle(0, 1, 5.5).fill('#3a2f5a');
  private readonly shaft: Graphics;
  private readonly glow: Glow;
  private readonly idle: Graphics;
  private readonly warm: Graphics;
  private readonly lit: Graphics;
  private readonly seen: Graphics;

  constructor(assets: Assets, private readonly d: WindowHazard) {
    const dx = d.x - d.wx;
    const dy = d.y - d.wy;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    this.root.position.set(d.x, d.y);
    this.shaft = new Graphics().poly([-dx + nx * 16, -dy + ny * 16, nx * d.r, ny * d.r,
      -nx * d.r, -ny * d.r, -dx - nx * 16, -dy - ny * 16]).fill('#ffe9a8');
    this.shaft.blendMode = 'add';
    this.lamp = artSprite(assets, 'flight/office_window_lit', 40, 24) ?? new Graphics().rect(-18, -10, 36, 20).fill('#ffe9a8');
    const facade = new Container();
    facade.position.set(-dx, -dy);
    facade.rotation = Math.abs(dx) > Math.abs(dy) ? Math.PI / 2 : 0;
    facade.addChild(this.dark, this.lamp, this.silhouette);
    this.glow = new Glow(glowTexture('255,233,168'), true);
    this.idle = dashedArc(new Graphics(), d.r, 0, TAU, 4, 10).stroke({ color: '#ffe9a8', width: 2, alpha: 0.2 });
    this.warm = new Graphics().circle(0, 0, d.r).fill({ color: C.amber, alpha: 0.09 });
    dashedArc(this.warm, d.r, 0, TAU, 10, 9).stroke({ color: C.amberHi, width: 4, alpha: 0.95 });
    this.lit = new Graphics().circle(0, 0, d.r).stroke({ color: '#ffe9a8', width: 3.5, alpha: 0.9 });
    this.seen = new Graphics().circle(0, 0, d.r).stroke({ color: RED, width: 4.5, alpha: 0.9 });
    this.root.addChild(this.shaft, facade, this.glow, this.idle, this.warm, this.lit, this.seen);
  }

  sync(on: boolean, tell: boolean, hot: number, t: number, i: number, rm: boolean): void {
    const flicker = tell && (rm || Math.sin(t * 40) > 0.2);
    // the warning flicker runs on alpha; visible only follows on / tell (a visible flip rebuilds
    // the render group, and the flicker would flip it a dozen times a second)
    const shown = on || tell;
    const lampOn = on || flicker;
    this.lamp.visible = this.shaft.visible = shown;
    this.lamp.alpha = on ? 1 : lampOn ? 0.7 : 0;
    this.shaft.alpha = on ? 0.16 : lampOn ? 0.1 : 0;
    this.dark.alpha = lampOn ? 0 : 1;
    this.silhouette.visible = on;
    this.silhouette.x = rm ? 0 : Math.sin(t * 0.9 + i) * 6;
    const r = this.d.r * (on ? 1.1 : 1.05);
    this.glow.place(0, 0, r, r, on ? 0.46 : tell ? 0.38 : 0);
    if (!lampOn) this.glow.alpha = 0;
    this.idle.visible = !on && !tell;
    this.warm.visible = !on && tell;
    this.warm.rotation = rm ? 0 : t * 110 / this.d.r;
    this.lit.visible = on && hot <= 0;
    this.seen.visible = on && hot > 0;
  }
}
