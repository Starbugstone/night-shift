import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../../contracts';
import { GLOW, glowTexture, Glow } from '../../core/gfx/glow';
import { C } from '../../ui/theme';
import { artSprite } from '../../ui/views/art';
import { CRANE_TAIL, type CraneHazard, type FlockHazard, type HeliHazard, type WireHazard } from '../hazards';
import { drawBuntingFlags } from '../pier-ground';
import { POWER_LINE } from '../sim';
import { WireView } from './overlays';
import { RED } from './tells';
import { CameraView, paintedSprite, TAU } from './world';

export class SkyWire {
  readonly root = new Container();
  private readonly wire: WireView;
  private readonly x: number;
  private readonly y: number;
  private readonly margin: number;

  constructor(d: WireHazard) {
    const tram = d.kind === 'tram';
    this.wire = new WireView(d.ax, d.ay, d.bx, d.by, POWER_LINE.wireGap, POWER_LINE.sag, tram);
    const poles = new Graphics();
    const r = tram ? 7 : POWER_LINE.poleR;
    for (const [x, y] of [[d.ax, d.ay], [d.bx, d.by]] as const) {
      poles.circle(x, y, r).fill(tram ? '#7a7f95' : '#6b4a2e').stroke({ color: C.ink, width: 3 });
    }
    this.x = (d.ax + d.bx) / 2;
    this.y = (d.ay + d.by) / 2;
    this.margin = Math.hypot(d.bx - d.ax, d.by - d.ay) / 2 + 24;
    this.root.addChild(this.wire.root, poles);
    if (d.kind === 'bunting') {
      const flags = paintedSprite(`bunting|${d.ax}|${d.ay}|${d.bx}|${d.by}`, Math.abs(d.ax - d.bx) + 24, Math.abs(d.ay - d.by) + 68, (g) => {
        g.translate(-this.x, -this.y);
        drawBuntingFlags(g, d, POWER_LINE.sag);
      });
      flags.position.set(this.x, this.y);
      this.root.addChild(flags);
    }
  }

  sync(cam: CameraView, flash: number): void {
    this.root.visible = cam.sees(this.x, this.y, this.margin);
    if (this.root.visible) this.wire.sync(flash);
  }
}

export class CraneView {
  readonly root = new Container();
  private readonly shadow: Graphics;
  private readonly arm = new Container();
  private readonly hook: Glow;

  constructor(assets: Assets, private readonly d: CraneHazard) {
    const base = artSprite(assets, 'flight/crane_base', 120, 120) ?? new Graphics().rect(-40, -40, 80, 80).fill('#c9a23a');
    const tail = d.len * CRANE_TAIL;
    this.shadow = new Graphics().rect(-tail, -d.width / 2, d.len + tail, d.width).fill({ color: '#000000', alpha: 0.25 });
    this.shadow.position.set(14, 18);
    let boom: Container;
    const art = artSprite(assets, 'flight/crane_boom', d.len + tail, d.width);
    if (art) {
      art.x = (d.len - tail) / 2;
      boom = art;
    } else {
      const line = new Graphics().rect(-tail, -d.width / 2, d.len + tail, d.width)
        .fill('#f2c230').stroke({ color: C.ink, width: 3 });
      for (let x = 0; x < d.len; x += 26) line.moveTo(x, -d.width / 2).lineTo(x + 13, d.width / 2).lineTo(x + 26, -d.width / 2);
      line.stroke({ color: C.ink, width: 2 });
      boom = line;
    }
    this.hook = new Glow(glowTexture(GLOW.red), true).place(d.len, 0, 18);
    this.arm.addChild(boom, this.hook);
    this.root.position.set(d.x, d.y);
    this.root.addChild(base, this.shadow, this.arm);
  }

  sync(cam: CameraView, a: number, t: number, rm: boolean): void {
    this.root.visible = cam.sees(this.d.x, this.d.y, this.d.len + 40);
    if (!this.root.visible) return;
    this.shadow.rotation = this.arm.rotation = a;
    this.hook.alpha = rm || Math.floor(t * 2) % 2 === 0 ? 0.9 : 0.3;
  }
}

export class FlockView {
  readonly root = new Container();
  private readonly birds: Container;
  private readonly edge: Graphics;
  private readonly wings: Graphics[] = [];

  constructor(assets: Assets, private readonly d: FlockHazard) {
    const key = d.kind === 'bat' ? 'flight/bat_flock' : d.kind === 'gull' ? 'flight/gull_flock' : 'flight/pigeon_flock';
    const art = artSprite(assets, key, 120, 90);
    if (art) this.birds = art;
    else {
      this.birds = new Container();
      for (let k = 0; k < 7; k++) {
        const mark = new Graphics().moveTo(-12, -4).lineTo(0, 3).lineTo(12, -4)
          .stroke({ color: d.kind === 'bat' ? C.ink : '#8a8fa8', width: 4, cap: 'round' });
        mark.position.set((k * 37) % 70 - 35, (k * 23) % 60 - 30);
        this.wings.push(mark);
        this.birds.addChild(mark);
      }
    }
    this.edge = new Graphics().circle(0, 0, d.r).stroke({ color: 'rgba(241,238,255,0.3)', width: 2 });
    this.root.addChild(this.birds, this.edge);
  }

  sync(cam: CameraView, x: number, y: number, a: number, i: number, t: number, rm: boolean): void {
    this.root.visible = cam.sees(x, y, this.d.r + 60);
    if (!this.root.visible) return;
    this.root.position.set(x, y);
    this.birds.rotation = a + Math.PI / 2;
    const flap = rm ? 1 : 0.8 + 0.2 * Math.sin(t * 22 + i);
    for (const wing of this.wings) wing.scale.set(flap);
  }
}

export class HelicopterView {
  readonly root = new Container();
  private readonly shaft: Graphics;
  private readonly shadow = new Graphics().ellipse(0, 0, 50, 70).fill({ color: '#000000', alpha: 0.3 });
  private readonly craft = new Container();
  private readonly rotor: Container;

  constructor(assets: Assets, private readonly d: HeliHazard) {
    const body = artSprite(assets, 'flight/helicopter_top', 200, 200) ?? new Graphics()
      .ellipse(0, 0, 34, 52).fill('#2a3048').stroke({ color: C.ink, width: 3 })
      .rect(-6, 40, 12, 60).fill('#2a3048');
    this.rotor = artSprite(assets, 'flight/helicopter_rotor', 220, 220) ?? new Graphics()
      .moveTo(-100, 0).lineTo(100, 0).moveTo(0, -100).lineTo(0, 100)
      .stroke({ color: 'rgba(200,210,230,0.5)', width: 8 });
    const radius = d.spotR * 0.92;
    this.shaft = new Graphics().poly([0, 9, 1, radius, 1, -radius, 0, -9])
      .fill({ color: '#c8dcff', alpha: 0.1 });
    this.shaft.blendMode = 'add';
    this.craft.addChild(body, new Graphics().circle(0, 0, 104).fill({ color: '#dfe6ff', alpha: 0.13 }), this.rotor);
    this.root.addChild(this.shaft, this.shadow, this.craft);
  }

  sync(cam: CameraView, x: number, y: number, a: number, sx: number, sy: number, t: number, rm: boolean): void {
    const craft = cam.sees(x, y, 160);
    this.root.visible = craft || cam.sees(sx, sy, this.d.spotR + 60);
    if (!this.root.visible) return;
    this.craft.visible = this.shadow.visible = craft;
    this.shaft.position.set(x, y);
    const dx = sx - x;
    const dy = sy - y;
    this.shaft.scale.x = Math.hypot(dx, dy);
    this.shaft.rotation = Math.atan2(dy, dx);
    if (!craft) return;
    this.craft.position.set(x, y);
    this.shadow.position.set(x + 30, y + 40);
    this.craft.rotation = this.shadow.rotation = a + TAU / 4;
    this.rotor.rotation = rm ? 0.4 : t * 25;
    this.rotor.alpha = rm ? 1 : 0.75;
  }
}

export function post(x: number, y: number, len: number, width: number, head: number): Graphics {
  const sx = x + len * 0.6;
  const sy = y + len * 0.8;
  return new Graphics().moveTo(x, y).lineTo(sx, sy).stroke({ color: 'rgba(5,3,20,0.42)', width, cap: 'round' })
    .circle(sx, sy, head).fill('rgba(5,3,20,0.32)');
}

export function cameraHead(assets: Assets, x: number, y: number, mount: 'roof' | 'pole' | 'radar' | undefined): Container {
  const root = new Container();
  root.position.set(x, y);
  if (mount === 'radar') {
    root.addChild(artSprite(assets, 'flight/radar_mast_top', 60, 60) ?? new Graphics()
      .circle(0, 0, 16).fill('#8a92a8').stroke({ color: C.ink, width: 3 }));
    root.addChild(new Graphics().rect(-4, -24, 8, 48).fill('#d8dce8').stroke({ color: C.ink, width: 2 }));
    return root;
  }
  if (mount === 'pole') root.addChild(post(0, 0, 58, 7, 15));
  root.addChild(artSprite(assets, 'flight/security_cam_top', 40, 40) ?? new Graphics()
    .roundRect(-9, -16, 18, 28, 4).fill('#c9cbd8').stroke({ color: C.ink, width: 3 }).circle(0, -14, 4).fill(RED));
  return root;
}
