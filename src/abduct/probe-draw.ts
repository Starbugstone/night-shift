// The clinic's Form 7-B uses mint for a target or completed reading, amber for a pending kick.
import { Container, Graphics } from 'pixi.js';
import { VIEW_H, VIEW_W, type Assets } from '../contracts';
import { GLOW, Glow, glowTexture } from '../core/gfx/glow';
import { Label } from '../core/gfx/text';
import { fmt, gt, localArt, num, tr } from '../i18n';
import { artSprite } from '../ui/views/art';
import { HudPanel } from '../ui/views/hud';
import { PROBE, type ProbeKind, type ProbeSim, type ProbeState } from './probe';
import type { Ragdoll } from './ragdoll';
import type { Area } from './rooms/layout';
import { Arc, DashedRect, Segment, INK, LIGHT, MINT, box, circleInView, dashedRing, disc, ring } from './views/pieces';

const AMBER = '#ffb347';
const PAPER = '#f4efe2';
const DRONE_KEY: Readonly<Record<ProbeKind, string>> = {
  thermo: 'room/probe_drone_thermo',
  hammer: 'room/probe_drone_hammer',
  feather: 'room/probe_drone_feather',
};
const LETTERED = new Set(['room/ticket_sign', 'room/internal_affairs_sign', 'room/saucer_poster']);
const JOINT_TEXT = { size: 12, weight: 850, color: MINT, outline: INK, outlineW: 3 } as const;
const FORM_TEXT = { size: 11, weight: 850, color: AMBER, outline: INK, outlineW: 3 } as const;
const FIELD_TEXT = { size: 12, weight: 850, color: LIGHT, outline: INK, outlineW: 3, align: 'left' } as const;
const DONE_TEXT = { ...FIELD_TEXT, color: MINT };

export function letteredKey(key: string): string {
  return LETTERED.has(key) ? localArt(key) : key;
}

function tick(r: number): Graphics {
  return new Graphics().moveTo(-r, 0).lineTo(-r * 0.3, r * 0.7).lineTo(r, -r * 0.8)
    .stroke({ color: MINT, width: Math.max(2.5, r * 0.45), cap: 'round', join: 'round' });
}

class KickArrow {
  readonly root = new Container();
  private readonly shaft = new Graphics().rect(0, -4.5, 1, 9).fill(INK).rect(0, -2.5, 1, 5).fill(AMBER);
  private readonly head = new Graphics();

  constructor() {
    for (let pass = 0; pass < 2; pass++) {
      this.head.moveTo(-12, 9).lineTo(0, 0).lineTo(-12, -9)
        .stroke({ color: pass ? AMBER : INK, width: pass ? 5 : 9, cap: 'round', join: 'round' });
    }
    this.root.addChild(this.shaft, this.head);
  }

  sync(d: ProbeState, x: number, y: number, t: number, rm: boolean): void {
    this.root.visible = d.kickPending >= 0;
    if (!this.root.visible) return;
    const length = 34 + 16 * (1 - d.kickPending / PROBE.kickTell);
    this.root.position.set(x + d.kx * 18, y + d.ky * 18);
    this.root.rotation = Math.atan2(d.ky, d.kx);
    this.root.alpha = rm ? 1 : 0.6 + 0.4 * Math.abs(Math.sin(t * 18));
    this.shaft.scale.x = length;
    this.head.x = length;
  }
}

class DroneArt {
  readonly root = new Container();
  private readonly rotor?: Graphics;

  constructor(assets: Assets, kind: ProbeKind) {
    this.root.addChild(new Glow(glowTexture(GLOW.mint), true).place(0, 0, 46, 40, 0.35));
    const art = artSprite(assets, DRONE_KEY[kind], 70, 70);
    if (art) {
      this.root.addChild(art);
      return;
    }
    const g = new Graphics().moveTo(0, -20).lineTo(0, -12).stroke({ color: INK, width: 2.5 })
      .roundRect(-18, -12, 36, 24, 10).fill(MINT).stroke({ color: INK, width: 2.5 })
      .circle(6, -1, 4).fill(INK);
    if (kind === 'thermo') {
      g.moveTo(-14, 8).lineTo(-30, 24).stroke({ color: '#c9a24a', width: 4, cap: 'round' })
        .circle(-31, 25, 4).fill('#e8a04a');
    } else if (kind === 'hammer') {
      g.moveTo(-14, 8).lineTo(-28, 22).stroke({ color: '#8a8fa8', width: 4, cap: 'round' })
        .moveTo(-34, 16).lineTo(-22, 28).stroke({ color: '#e46a7a', width: 7, cap: 'round' });
    } else g.moveTo(-14, 8).quadraticCurveTo(-34, 10, -36, 30).stroke({ color: PAPER, width: 3, cap: 'round' });
    this.rotor = new Graphics().ellipse(0, -24, 26, 4).fill('#d9d0ea').stroke({ color: INK, width: 2.5 });
    this.root.addChild(this.rotor, g);
  }

  sync(x: number, y: number, t: number, rm: boolean): void {
    this.root.position.set(x, y);
    if (this.rotor) this.rotor.scale.x = (22 * (rm ? 0.6 : Math.abs(Math.sin(t * 22))) + 4) / 26;
  }
}

class ProbeView {
  readonly root = new Container();
  private readonly zone = new Container();
  private readonly effects = new Container();
  private readonly reach = new Segment(box(0, -1, 1, 2, MINT, 0.45));
  private readonly glow = new Glow(glowTexture(GLOW.mint), true);
  private readonly fill: Graphics;
  private readonly open: Graphics;
  private readonly done: Graphics;
  private readonly dash: ReturnType<typeof dashedRing>;
  private readonly arc: Arc;
  private readonly check = tick(13);
  private readonly joint = ring(15, 2.5, MINT);
  private readonly kick = new KickArrow();
  private readonly caption: Label;
  private readonly drone: DroneArt;

  constructor(private readonly d: ProbeState, assets: Assets) {
    const { spec } = d;
    const { x, y, r } = spec;
    this.zone.position.set(x, y);
    this.fill = disc(r, MINT);
    this.open = ring(r, 3.5, MINT);
    this.done = ring(r, 3, MINT);
    this.done.alpha = 0.45;
    this.dash = dashedRing(r, 2.5, 8, 7);
    this.dash.tint = MINT;
    this.arc = new Arc(r - 6, 8);
    this.zone.addChild(this.glow, this.fill, this.open, this.dash, this.done, this.check, this.arc.root);
    const instruction = fmt(tr().lessons.probe, { joint: tr().lessons.probeJoint[spec.kind], seconds: num(PROBE.hold, 1) });
    this.caption = new Label(JOINT_TEXT).set(instruction, 0, 0, 155);
    this.drone = new DroneArt(assets, spec.kind);
    this.effects.addChild(this.joint, this.kick.root);
    this.root.addChild(this.reach.root, this.zone, this.caption, this.effects, this.drone.root);
  }

  sync(body: Ragdoll, t: number, rm: boolean, cx: number, cy: number): void {
    const { d } = this;
    const { spec, done, inside } = d;
    const { x, y, r } = spec;
    const near = circleInView(x, y, 2 * r + 65, cx, cy, VIEW_W, VIEW_H);
    this.reach.root.visible = this.zone.visible = this.drone.root.visible = near;
    this.caption.visible = near && !done;
    if (near) {
      const dx = x + r + 22;
      const dy = y - r * 0.55 - 16 + (rm ? 0 : Math.sin(t * 3.1 + x * 0.01) * 4);
      this.reach.sync(dx - 18, dy + 14, x + r * 0.7, y - r * 0.7);
      this.drone.sync(dx, dy, t, rm);
      this.caption.position.set(dx, dy + 40);
      this.fill.visible = !done;
      this.fill.alpha = inside ? 0.16 : 0.07;
      this.open.visible = !done && inside;
      this.dash.visible = !done && !inside;
      this.dash.rotation = rm ? 0 : t * 12 / r;
      this.done.visible = this.check.visible = done;
      const k = Math.min(1, d.since / 0.5);
      this.glow.place(0, 0, r * (1 + k), r * (1 + k), done ? 0.6 * (1 - k) : 0);
      this.arc.sync(done ? 0 : d.fill, MINT);
    }
    const jx = body.x[d.joint]!;
    const jy = body.y[d.joint]!;
    this.joint.visible = !done;
    this.joint.position.set(jx, jy);
    this.joint.alpha = 0.5 + (rm ? 0.2 : 0.3 * Math.sin(t * 6));
    this.kick.sync(d, jx, jy, t, rm);
  }
}

class Checkbox {
  readonly root = new Container();
  private readonly edge: Graphics;
  private readonly check: Graphics;

  constructor(x: number, y: number, size: number, filled: boolean) {
    this.root.position.set(x, y);
    this.edge = new Graphics().roundRect(0, 0, size, size, size === 22 ? 4 : 3);
    if (filled) this.root.addChild(new Graphics().roundRect(0, 0, size, size, 4).fill('#16102e'));
    this.edge.stroke({ color: 0xffffff, width: size === 22 ? 2.5 : 2 });
    this.check = tick(size === 22 ? 7 : 5);
    this.check.position.set(size / 2, size / 2);
    this.root.addChild(this.edge, this.check);
  }

  sync(done: boolean): void {
    this.edge.tint = done ? MINT : AMBER;
    this.check.visible = done;
  }
}

export class ProbePaperwork {
  readonly world = new Container();
  readonly lock = new Container();
  readonly clipboard = new Container();
  private readonly views: ProbeView[];
  private readonly lockBoxes: Checkbox[] = [];
  private readonly listBoxes: Checkbox[] = [];
  private readonly fields: Label[] = [];
  private readonly exitDashes: DashedRect;
  private readonly names: string[];
  private readonly readings: string[];

  constructor(private readonly probes: ProbeSim, assets: Assets, zone: Area) {
    this.views = probes.drones.map(d => new ProbeView(d, assets));
    this.names = probes.drones.map(d => gt(d.spec.label));
    this.readings = probes.drones.map(d => gt(d.spec.reading));
    for (const v of this.views) this.world.addChild(v.root);
    const n = probes.drones.length;
    const w = n * 22 + (n - 1) * 10;
    const cx = zone.x + zone.w / 2;
    const cy = zone.y + zone.h / 2;
    this.exitDashes = new DashedRect(zone, 8, 7, AMBER);
    this.exitDashes.root.alpha = 0.85;
    const face = new HudPanel().set(w + 20, 58, AMBER);
    face.position.set(cx - w / 2 - 10, cy - 37);
    this.lock.addChild(box(zone.x, zone.y, zone.w, zone.h, '#0a0828', 0.5), this.exitDashes.root, face,
      new Label(FORM_TEXT).set(gt('FORM 7-B'), cx, cy - 25));
    this.clipboard.position.set(312, 158);
    this.clipboard.addChild(new HudPanel().set(214, 30 + n * 20));
    const art = artSprite(assets, 'ui/clipboard_7b', 34, 42);
    if (art) {
      art.position.set(25, 28);
      this.clipboard.addChild(art);
    } else {
      const fallback = new Graphics().roundRect(10, 9, 30, 38, 4).fill('#8a6f4a').stroke({ color: INK, width: 2 })
        .rect(14, 15, 22, 28).fill(PAPER).rect(19, 7, 12, 6).fill('#c9cbd8');
      for (let i = 0; i < 4; i++) fallback.rect(17, 20 + i * 6, 14, 1.5);
      this.clipboard.addChild(fallback.fill('#2a2440'));
    }
    this.clipboard.addChild(new Label({ ...FIELD_TEXT, size: 11 }).set(gt('FORM 7-B'), 50, 15));
    for (let i = 0; i < n; i++) {
      const lock = new Checkbox(cx - w / 2 + i * 32, cy - 9, 22, true);
      const checkbox = new Checkbox(50, 27 + i * 20, 14, false);
      const field = new Label(FIELD_TEXT);
      this.lockBoxes.push(lock);
      this.listBoxes.push(checkbox);
      this.fields.push(field);
      this.lock.addChild(lock.root);
      this.clipboard.addChild(checkbox.root, field);
    }
  }

  sync(body: Ragdoll, t: number, rm: boolean, cx: number, cy: number): void {
    this.lock.visible = !this.probes.done;
    if (this.lock.visible && this.lock.parent?.visible) this.exitDashes.sync(3, rm ? 0 : -t * 10);
    for (let i = 0; i < this.views.length; i++) {
      this.views[i]!.sync(body, t, rm, cx, cy);
      const done = this.probes.drones[i]!.done;
      this.lockBoxes[i]!.sync(done);
      this.listBoxes[i]!.sync(done);
      this.fields[i]!.restyle(done ? DONE_TEXT : FIELD_TEXT).set(done ? this.readings[i]! : this.names[i]!, 70, 34 + i * 20, 138);
    }
  }
}
