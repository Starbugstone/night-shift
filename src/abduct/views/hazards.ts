// Read the hazard state prepared by the simulation. Only genuinely changing edges are rebuilt.
import { Container, Graphics, type Sprite } from 'pixi.js';
import { VIEW_H, VIEW_W, type Assets } from '../../contracts';
import { GLOW, Glow, glowTexture } from '../../core/gfx/glow';
import { Shape, keyOf } from '../../core/gfx/shapes';
import { Label } from '../../core/gfx/text';
import { tr } from '../../i18n';
import { CameraCone } from '../camera-cone';
import { LASER_TELL, type HazardState } from '../interior';
import { clamp, type Blade, type Circle, type Rect, type Ragdoll, type SwingingRect } from '../ragdoll';
import type { Building, Cycle, Hazard } from '../rooms/interior';
import type { Area } from '../rooms/layout';
import { CastorTellView } from '../swell-draw';
import { boneTossView } from './bone-toss';
import { Mount, prop, roomArt } from './building';
import { AMBER, DashedRect, INK, MINT, RED, Segment, TAU, box, circleInView, dashedRing, disc, intersects, placeBox, ring } from './pieces';

interface HazardView {
  readonly root: Container;
  sync(t: number, rm: boolean, cx: number, cy: number, body: Ragdoll): void;
}

const BARK = { size: 22, color: AMBER, weight: 900 } as const;
const CUCKOO = { size: 17, color: AMBER, weight: 900 } as const;
const CREAK = { size: 18, color: '#dc9e66', weight: 800, italic: true } as const;

function areaVisible(area: Area, cx: number, cy: number): boolean {
  return intersects(area, cx - 18, cy - 18, VIEW_W + 36, VIEW_H + 36);
}

function circleVisible(x: number, y: number, r: number, cx: number, cy: number): boolean {
  return circleInView(x, y, r, cx, cy, VIEW_W, VIEW_H);
}

function phase(cycle: Cycle, t: number): number {
  return (t + cycle.phase) % cycle.period;
}

class Dial {
  readonly root = new Container();
  private readonly fill = new Shape();
  private readonly edge = ring(13, 2.5);
  private end = 0;
  private readonly draw = (g: Graphics): void => {
    g.moveTo(0, 0).arc(0, 0, 10, -Math.PI / 2, this.end).closePath().fill(0xffffff);
  };

  constructor(private readonly cycle: Cycle) {
    this.root.addChild(disc(13, '#16102e'), this.fill, this.edge);
  }

  sync(x: number, y: number, t: number, tell: boolean): void {
    const c = this.cycle;
    const p = phase(c, t);
    const open = p < c.open;
    const frac = open ? (c.open - p) / c.open : (c.period - p) / (c.period - c.open);
    this.root.position.set(x, y);
    this.fill.tint = open ? tell ? AMBER : MINT : RED;
    this.edge.tint = open ? tell ? AMBER : '#d9fff0' : RED;
    this.end = -Math.PI / 2 + TAU * clamp(frac, 0, 1);
    this.fill.draw(keyOf(this.end * 30), this.draw);
  }
}

function swing(state: HazardState, spec: Extract<Hazard, { kind: 'swing' }>, assets: Assets): HazardView {
  const root = new Container();
  const shape = state.shapes[0] as SwingingRect;
  const s = roomArt(assets, spec.sprite.key, -shape.w / 2, 0, shape.w, shape.h, true);
  const pivot = new Container();
  const arm = new Container();
  arm.addChild(s);
  pivot.addChild(arm, ring(5, 2.5, AMBER));
  const mount = spec.mountY === undefined ? undefined : new Mount(shape.x, spec.mountY);
  if (mount) {
    mount.sync(shape.x, shape.y);
    root.addChild(mount.root);
  }
  root.addChild(pivot);
  return {
    root,
    sync(_t, _rm, cx, cy) {
      root.visible = circleVisible(shape.x, shape.y, Math.hypot(shape.h, shape.w / 2), cx, cy);
      if (!root.visible) return;
      pivot.position.set(shape.x, shape.y);
      arm.rotation = shape.angle;
    },
  };
}

function fan(state: HazardState, spec: Extract<Hazard, { kind: 'fan' }>, assets: Assets): HazardView {
  const root = new Container();
  if (spec.duct) {
    const duct = ring(spec.length + 10, 4, '#6a7585');
    duct.position.set(spec.x, spec.y);
    root.addChild(duct);
  } else if (spec.mountY !== undefined) {
    const mount = new Mount(spec.x, spec.mountY, 9);
    mount.sync(spec.x, spec.y);
    root.addChild(mount.root);
  }
  const sweep = disc(spec.length, AMBER);
  sweep.position.set(spec.x, spec.y);
  sweep.alpha = 0.07;
  root.addChild(sweep);
  const blades: { art: Container; shape: Blade }[] = [];
  for (let i = 1; i < state.shapes.length; i++) {
    const shape = state.shapes[i] as Blade;
    const art = new Container();
    const { from, to, r } = shape;
    const blade = new Container();
    const clip = new Graphics().roundRect(from - r, -r, to - from + 2 * r, 2 * r, r).fill(0xffffff);
    const edge = new Graphics().roundRect(from - r, -r, to - from + 2 * r, 2 * r, r).stroke({ color: AMBER, width: 1.5, alignment: 0 });
    blade.addChild(box(0, -r, to + r, 2 * r, '#967386'), roomArt(assets, 'room/fan_blade', 0, -r, to + r, r * 2), edge);
    art.addChild(clip, blade);
    blade.mask = clip;
    root.addChild(art);
    blades.push({ art, shape });
  }
  const hub = state.shapes[0] as Circle;
  const rim = ring(hub.r - 1, 2, AMBER);
  rim.position.set(hub.x, hub.y);
  root.addChild(roomArt(assets, 'room/fan_hub', hub.x - hub.r, hub.y - hub.r, hub.r * 2, hub.r * 2), rim);
  return {
    root,
    sync(_t, _rm, cx, cy) {
      root.visible = circleVisible(spec.x, spec.y, spec.length + 18, cx, cy);
      if (!root.visible) return;
      for (const { art, shape } of blades) {
        art.position.set(shape.x, shape.y);
        art.rotation = shape.angle;
      }
    },
  };
}

function gear(state: HazardState, spec: Extract<Hazard, { kind: 'gear' }>, assets: Assets): HazardView {
  const c = state.shapes[0] as Circle;
  const root = new Container();
  root.position.set(c.x, c.y);
  const rotor = new Container();
  rotor.addChild(roomArt(assets, spec.sprite.key, -c.r, -c.r, c.r * 2, c.r * 2));
  const mask = disc(c.r);
  const face = ring(c.r - 0.75, 1.5, AMBER);
  root.addChild(disc(c.r, '#6c536b'), mask, rotor, face);
  rotor.mask = mask;
  return {
    root,
    sync(_t, _rm, cx, cy) {
      root.visible = areaVisible(spec.sprite, cx, cy);
      if (root.visible) rotor.rotation = state.angle;
    },
  };
}

class ExpandingRing {
  readonly root = new Shape();
  private r = 0;
  private width = 0;
  private readonly draw = (g: Graphics): void => {
    g.circle(0, 0, this.r).stroke({ color: 0xffffff, width: this.width });
  };

  constructor(color: string, width: number) {
    this.width = width;
    this.root.tint = color;
  }

  sync(x: number, y: number, radius: number): void {
    this.root.position.set(x, y);
    this.r = radius;
    this.root.draw(keyOf(radius), this.draw);
  }
}

function patrol(state: HazardState, spec: Extract<Hazard, { kind: 'patrol' }>, assets: Assets): HazardView {
  const root = new Container();
  const shape = state.shapes[0] as Rect;
  const art = new Container();
  art.addChild(roomArt(assets, spec.sprite.key, -shape.w / 2, 0, shape.w, shape.h));
  root.addChild(art);
  const dog = !!spec.barks;
  const robo = spec.sprite.key === 'room/robot_vacuum';
  const mint = robo ? new Glow(glowTexture(GLOW.mint), true) : undefined;
  const amber = robo ? new Glow(glowTexture(GLOW.amber), true) : undefined;
  if (mint && amber) root.addChild(mint, amber);
  const bark = dog ? new ExpandingRing(AMBER, 3) : undefined;
  const shout = dog ? new Label(BARK) : undefined;
  if (bark && shout) root.addChild(bark.root, shout);
  return {
    root,
    sync(t, rm, cx, cy) {
      root.visible = areaVisible(shape, cx, cy);
      if (!root.visible) return;
      const { x, y, w, h } = shape;
      const center = x + w / 2;
      art.position.set(center, y - (dog && !rm ? Math.abs(Math.sin(t * 11)) * 2.5 : 0));
      art.scale.x = dog && shape.vx < 0 ? -1 : 1;
      if (mint && amber) {
        const on = rm || Math.floor(t * 2.5) % 2 === 0;
        mint.place(center, y + 4, 9, 9, on ? 0.9 : 0);
        amber.place(center, y + 4, 9, 9, on ? 0 : 0.9);
      }
      if (bark && shout) {
        const p = state.pulse;
        bark.root.visible = shout.visible = p > 0;
        if (p > 0) {
          bark.sync(center, y + h / 2, 20 + (1 - p) * 95);
          shout.set(tr().abduct.woof, center, y - 22 - (1 - p) * 14, 100);
          shout.alpha = Math.min(1, p * 2);
        }
      }
    },
  };
}

function fragile(state: HazardState, spec: Extract<Hazard, { kind: 'fragile' }>, assets: Assets): HazardView {
  const root = new Container();
  const { x, y, w, h } = spec.sprite;
  const art = prop(assets, spec.sprite, true);
  const shards = roomArt(assets, 'room/shards', x + w / 2 - 30, y + h - 20, 60, 20);
  const crash = new ExpandingRing(AMBER, 2);
  const caption = new Label(BARK);
  const fish = spec.sprite.key === 'room/fish_tank' ? new Graphics()
    .ellipse(0, 0, 6, 3.5).poly([-5, 0, -11, -4, -11, 4]).fill('#ffb347') : undefined;
  root.addChild(art, shards, crash.root, caption);
  if (fish) root.addChild(fish);
  return {
    root,
    sync(t, rm, cx, cy) {
      root.visible = areaVisible(spec.sprite, cx, cy);
      if (!root.visible) return;
      art.visible = !state.broken;
      shards.visible = state.broken;
      const p = state.pulse;
      caption.visible = crash.root.visible = state.broken && p > 0;
      if (caption.visible) {
        crash.sync(x + w / 2, y + h / 2, 23 + (1 - p) * 92);
        caption.set(tr().abduct.crash, x + w / 2, y - 12 - (1 - p) * 16, 110);
        caption.alpha = Math.min(1, p * 2);
      }
      if (fish) {
        fish.visible = !state.broken && !rm;
        const k = t * 0.13 % 1;
        fish.position.set(x + w * (0.25 + 0.5 * (k < 0.5 ? k * 2 : 2 - k * 2)), y + h * 0.55 + Math.sin(t * 2) * 4);
        fish.scale.x = k < 0.5 ? 1 : -1;
      }
    },
  };
}

function castor(state: HazardState, spec: Extract<Hazard, { kind: 'castor' }>, assets: Assets): HazardView {
  const root = new Container();
  const art = prop(assets, spec.sprite, true);
  const shape = state.shapes[0] as Rect;
  const tell = new CastorTellView(spec);
  root.addChild(art, tell.root);
  const reach = { x: spec.sprite.x - spec.travel * 2, y: shape.y, w: shape.w + spec.travel * 4, h: shape.h };
  return {
    root,
    sync(t, rm, cx, cy) {
      reach.x = shape.x - spec.travel;
      reach.w = shape.w + spec.travel * 2;
      root.visible = areaVisible(reach, cx, cy);
      if (!root.visible) return;
      art.position.set(shape.x, shape.y);
      tell.sync(shape, t, rm);
    },
  };
}

function speaker(state: HazardState, spec: Extract<Hazard, { kind: 'speaker' }>, assets: Assets): HazardView {
  const root = new Container();
  const { x, y, w, h } = spec.sprite;
  const cx0 = x + w / 2;
  const cy0 = y + h / 2;
  const detail = new Container();
  const pulse = new ExpandingRing('#e2a0ff', 4);
  const dashed = dashedRing(spec.radius, 2.5, 5, 7);
  dashed.tint = '#e2a0ff';
  const glow = new Glow(glowTexture('226,160,255'), true);
  detail.position.set(cx0, cy0);
  detail.addChild(glow, dashed, pulse.root);
  root.addChild(prop(assets, spec.sprite, true), detail);
  return {
    root,
    sync(t, rm, cx, cy) {
      detail.visible = circleVisible(cx0, cy0, spec.radius, cx, cy);
      root.visible = detail.visible || areaVisible(spec.sprite, cx, cy);
      if (!detail.visible) return;
      const p = state.pulse;
      const beat = Math.max(0, 1 - (state.next - t) / 0.38);
      const r = 70 + 60 * p;
      detail.alpha = 1;
      glow.place(0, 0, r, r, 0.5 * p);
      dashed.alpha = pulse.root.alpha = 0.32 + 0.58 * Math.max(beat, p);
      pulse.root.visible = p > 0;
      if (p > 0) pulse.sync(0, 0, rm ? spec.radius * 0.75 : spec.radius * (1 - p * 0.85));
    },
  };
}

function zone(state: HazardState, spec: Extract<Hazard, { kind: 'draft' | 'creak' }>): HazardView {
  const root = new Container();
  const { area } = spec;
  const { x, y, w, h } = area;
  const creak = spec.kind === 'creak';
  const color = creak ? CREAK.color : spec.ay < 0 ? MINT : AMBER;
  const edge = new DashedRect(area, 5, 7, color);
  edge.sync(1);
  const arrows: Graphics[] = [];
  const markings = new Graphics();
  const caption = new Label(CREAK, 'creeeak');
  root.addChild(edge.root, markings, caption);
  if (spec.kind === 'draft' && spec.ay === 0) {
    const direction = Math.sign(spec.ax);
    for (let yy = y + 44; yy < y + h; yy += 78) {
      for (let xx = x + 50; xx < x + w - 20; xx += 100) {
        markings.moveTo(xx - direction * 9, yy - 7).lineTo(xx, yy).lineTo(xx - direction * 9, yy + 7)
          .moveTo(xx - direction * 17, yy).lineTo(xx, yy);
      }
    }
    markings.stroke({ color, width: 2.5 });
    caption.visible = false;
    root.alpha = 0.35;
    return { root, sync(_t, _rm, cx, cy) { root.visible = areaVisible(area, cx, cy); } };
  }
  if (creak) {
    for (let yy = 22; yy < h; yy += 78) {
      for (let xx = 20; xx < w; xx += 61) markings.rect(x + xx, y + yy, 12, 2).rect(x + xx + 4, y + yy - 4, 13, 2);
    }
    markings.fill(color);
  } else {
    const direction = spec.ay > 0 ? 1 : -1;
    for (let i = 0; i < Math.ceil(h / 78); i++) {
      const arrow = new Graphics();
      for (let col = 1; col <= 3; col++) {
        const xx = x + w * col * 0.25;
        arrow.moveTo(xx - 7, -direction * 9).lineTo(xx, 0).lineTo(xx + 7, -direction * 9)
          .moveTo(xx, -direction * 17).lineTo(xx, 0);
      }
      arrow.stroke({ color, width: 2.5 });
      arrows.push(arrow);
      root.addChild(arrow);
    }
    root.alpha = 0.35;
  }
  return {
    root,
    sync(t, rm, cx, cy, body) {
      root.visible = areaVisible(area, cx, cy);
      if (!root.visible) return;
      if (creak) {
        const p = state.pulse;
        edge.root.alpha = markings.alpha = 0.16 + p * 0.52;
        caption.visible = p > 0.3;
        if (caption.visible) {
          caption.position.set(body.chestX + 60, body.chestY + 96 - (1 - p) * 18);
          caption.alpha = Math.min(1, p * 1.4);
        }
      } else {
        caption.visible = false;
        const d = spec.ay > 0 ? 1 : -1;
        const offset = rm ? 0 : ((t * 79 * d) % 78 + 78) % 78;
        for (let i = 0; i < arrows.length; i++) {
          const arrow = arrows[i]!;
          const yy = y + i * 78 + offset;
          arrow.visible = yy > y + 24 && yy < y + h - 24 && yy > cy - 40 && yy < cy + VIEW_H + 40;
          arrow.y = yy;
        }
      }
    },
  };
}

class CameraView implements HazardView {
  readonly root = new Container();
  private readonly fill = new Shape();
  private readonly outline = new Shape();
  private readonly lead = new Segment(box(0, -2.5, 1, 5, 0xffffff));
  private readonly mount: Mount | undefined;
  private readonly camera: Container | undefined;
  private readonly ring = ring(6, 3);
  private readonly glow = new Glow(glowTexture(GLOW.amber), true);
  private readonly amber = glowTexture(GLOW.amber);
  private readonly red = glowTexture(GLOW.red);
  private readonly rec = new Glow(glowTexture(GLOW.red), true);
  // The sim's own cone (its polygon is cached per angle, so collision and drawing share one raycast).
  private readonly cone: CameraCone;
  private lastAngle = 0;
  private leadSide = 0;
  private active = false;
  private readonly fillCone = (g: Graphics): void => { this.path(g).fill(0xffffff); };
  private readonly drawOutline = (g: Graphics): void => {
    this.path(g).stroke({ color: 0xffffff, width: this.active ? 4.5 : 2.5, join: 'round' });
  };

  constructor(
    building: Building, assets: Assets, private readonly spec: Extract<Hazard, { kind: 'camera' }>,
    private readonly state: HazardState, private readonly index: number,
  ) {
    this.cone = state.cone ?? new CameraCone(building, spec);
    const { x, y, mountY, lens } = spec;
    this.root.addChild(this.fill, this.outline, this.lead.root);
    if (mountY !== undefined) {
      this.mount = new Mount(x, mountY, 9);
      this.root.addChild(this.mount.root);
    }
    if (!lens) {
      this.camera = new Container();
      this.camera.position.set(x, y);
      this.camera.addChild(roomArt(assets, 'room/security_camera', -61, -20, 67, 38));
      this.root.addChild(this.camera);
    }
    this.ring.position.set(x, y);
    this.root.addChild(this.ring, this.glow, this.rec);
  }

  sync(t: number, rm: boolean, cx: number, cy: number): void {
    const { x, y, range } = this.spec;
    this.root.visible = circleVisible(x, y, range, cx, cy);
    if (!this.root.visible) return;
    const { angle, detecting } = this.state;
    this.active = detecting;
    const da = angle - this.lastAngle;
    if (Math.abs(da) > 0.0003) this.leadSide = da > 0 ? 1 : -1;
    this.lastAngle = angle;
    this.cone.update(angle);
    const beat = rm ? 1 : 0.7 + 0.3 * Math.sin(t * 22);
    const edge = detecting ? RED : '#f0b574';
    // A wall corner can create a new edge at a sub-pixel change in angle.
    this.fill.draw(angle, this.fillCone);
    this.fill.tint = detecting ? RED : '#ffbc69';
    this.fill.alpha = detecting ? 0.34 * beat : 0.2;
    this.outline.draw(angle + (detecting ? TAU * 4 : 0), this.drawOutline);
    this.outline.tint = edge;
    const lead = this.lead;
    lead.root.visible = this.leadSide !== 0 && this.cone.count > 2;
    if (lead.root.visible) {
      const point = this.leadSide > 0 ? this.cone.count - 1 : 1;
      lead.sync(x, y, this.cone.points[point * 2]!, this.cone.points[point * 2 + 1]!);
      lead.root.scale.y = detecting ? 1.3 : 1;
      lead.root.tint = edge;
    }
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.mount?.sync(x - cos * 36, y - sin * 36);
    if (this.camera) this.camera.rotation = angle;
    this.ring.tint = detecting ? RED : AMBER;
    this.glow.texture = detecting ? this.red : this.amber;
    const r = detecting ? 30 * beat : 16;
    this.glow.place(x, y, r, r, 0.95);
    this.rec.place(x - cos * 44, y - sin * 44 - 14, 11, 11,
      this.camera && (detecting || rm || Math.floor(t * 2.5 + this.index) % 2 === 0) ? 1 : 0);
  }

  private path(g: Graphics): Graphics {
    const { points, count } = this.cone;
    g.moveTo(points[0]!, points[1]!);
    for (let i = 1; i < count; i++) g.lineTo(points[2 * i]!, points[2 * i + 1]!);
    return g.closePath();
  }
}

class LaserView implements HazardView {
  readonly root = new Container();
  private readonly active = new Container();
  private readonly charging = new Container();
  private readonly off = new Graphics();
  private readonly marquee: Sprite;
  private readonly hot = [new Glow(glowTexture(GLOW.red), true), new Glow(glowTexture(GLOW.red), true)];
  private readonly warm = [new Glow(glowTexture(GLOW.amber), true), new Glow(glowTexture(GLOW.amber), true)];
  private readonly rims: Graphics[] = [];
  private readonly beads: Sprite[] = [];
  private readonly vertical: boolean;
  private readonly nearX: number;
  private readonly nearY: number;
  private readonly farX: number;
  private readonly farY: number;
  private readonly dial: Dial;

  constructor(private readonly state: HazardState, private readonly spec: Extract<Hazard, { kind: 'laser' }>, assets: Assets) {
    const { x, y, w, h } = spec.area;
    const vertical = this.vertical = h > w;
    this.nearX = vertical ? x + w / 2 : x;
    this.nearY = vertical ? y : y + h / 2;
    this.farX = vertical ? this.nearX : x + w;
    this.farY = vertical ? y + h : this.nearY;
    for (const margin of [12, 5]) {
      const glow = box(x - (vertical ? margin : 0), y - (vertical ? 0 : margin), w + (vertical ? margin * 2 : 0), h + (vertical ? 0 : margin * 2), RED, margin === 12 ? 0.16 : 0.3);
      glow.blendMode = 'add';
      this.active.addChild(glow);
    }
    this.active.addChild(box(x, y, w, h, RED),
      box(x + (vertical ? w * 0.35 : 0), y + (vertical ? 0 : h * 0.35), vertical ? w * 0.3 : w, vertical ? h : h * 0.3, '#fff1f3'));
    for (let i = 0; i < 3; i++) {
      const bead = box(0, 0, 6, 6, '#ffffff');
      this.beads.push(bead);
      this.active.addChild(bead);
    }
    this.marquee = box(x, y, w, h, AMBER);
    this.charging.addChild(this.marquee, ...this.warm);
    const length = vertical ? h : w;
    for (let i = 0; i < length; i += 12) {
      const dash = Math.min(3, length - i);
      if (vertical) this.off.rect(this.nearX - 1, y + i, 2, dash);
      else this.off.rect(x + i, this.nearY - 1, dash, 2);
    }
    this.off.fill({ color: MINT, alpha: 0.4 });
    this.root.addChild(this.active, this.charging, this.off);
    if (spec.mountY !== undefined) {
      const mount = new Mount(this.nearX - 9, spec.mountY, 6);
      mount.sync(this.nearX - 9, this.nearY);
      this.root.addChild(mount.root);
    }
    for (let i = 0; i < 2; i++) {
      const emitter = new Container();
      const ex = i === 0 ? this.nearX : this.farX;
      const ey = i === 0 ? this.nearY : this.farY;
      emitter.position.set(ex, ey);
      emitter.rotation = vertical ? (i === 0 ? Math.PI / 2 : -Math.PI / 2) : i * Math.PI;
      emitter.addChild(roomArt(assets, 'room/laser_emitter', -19, -14, 24, 28));
      const rim = ring(5, 2.5);
      rim.position.set(ex, ey);
      this.hot[i]!.place(ex, ey, 26, 26, 0.9);
      this.rims.push(rim);
      this.root.addChild(emitter, rim);
    }
    this.dial = new Dial(spec.cycle);
    this.root.addChild(...this.hot, this.dial.root);
  }

  sync(t: number, rm: boolean, cx: number, cy: number): void {
    const { spec, state, vertical, nearX: nx, nearY: ny, farX: fx, farY: fy } = this;
    this.root.visible = areaVisible(spec.area, cx, cy);
    if (!this.root.visible) return;
    const on = state.level === 1;
    const tell = !on && state.tell;
    this.active.visible = on;
    this.charging.visible = tell;
    this.off.visible = !on && !tell;
    for (const light of this.hot) light.visible = on;
    for (const rim of this.rims) rim.tint = on ? RED : tell ? AMBER : MINT;
    if (on) {
      for (let i = 0; i < this.beads.length; i++) {
        const b = this.beads[i]!;
        b.visible = !rm;
        const k = (t * 1.6 + i / 3) % 1;
        b.position.set(nx + (fx - nx) * k - 3, ny + (fy - ny) * k - 3);
      }
    } else if (tell) {
      const k = clamp((phase(spec.cycle, t) - (spec.cycle.open - LASER_TELL)) / LASER_TELL, 0, 1);
      const fat = 2 + 5 * k;
      const { x, y, w, h } = spec.area;
      placeBox(this.marquee, x - (vertical ? fat : 0), y - (vertical ? 0 : fat), w + (vertical ? 2 * fat : 0), h + (vertical ? 0 : 2 * fat));
      this.marquee.alpha = rm || Math.floor(t * 21) % 2 === 0 ? 1 : 0.35;
      this.warm[0]!.place(nx, ny, 18 + 26 * k, 18 + 26 * k, 0.95);
      this.warm[1]!.place(fx, fy, 18 + 26 * k, 18 + 26 * k, 0.95);
    }
    const inX = cx + VIEW_W / 2;
    const inY = cy + VIEW_H / 2;
    const far = Math.hypot(fx - inX, fy - inY) < Math.hypot(nx - inX, ny - inY);
    const d = far ? -24 : 24;
    this.dial.sync((far ? fx : nx) + (vertical ? 28 : d), (far ? fy : ny) + (vertical ? d : -28), t, state.tell);
  }
}

class Shutter {
  readonly root = new Container();
  private readonly base = box(0, 0, 1, 1, '#495374');
  private readonly edge = box(0, 0, 1, 1, '#e8b84a');
  private readonly outline: readonly Graphics[];
  private readonly slats: Sprite[] = [];
  private readonly stripes: Graphics;

  constructor(private readonly maxW: number, private readonly maxH: number, private readonly vertical: boolean) {
    const length = vertical ? maxH : maxW;
    const breadth = vertical ? maxW : maxH;
    this.root.addChild(this.base);
    for (let i = 5; i < length - 2; i += 15) {
      const slat = vertical ? box(3, i, maxW - 6, 2, '#a7b7ce') : box(i, 3, 2, maxH - 6, '#a7b7ce');
      this.slats.push(slat);
      this.root.addChild(slat);
    }
    this.stripes = new Graphics();
    for (let k = 3; k < breadth - 4; k += 12) {
      if (vertical) this.stripes.rect(k, 0, 5, 1);
      else this.stripes.rect(0, k, 1, 5);
    }
    this.stripes.fill(INK);
    const off = new Graphics().rect(0, 0, maxW, maxH).stroke({ color: '#a791bc', width: 1.5 });
    const on = new Graphics().rect(0, 0, maxW, maxH).stroke({ color: AMBER, width: 3.5 });
    this.outline = [off, on];
    this.root.addChild(this.edge, this.stripes, off, on);
  }

  sync(x: number, y: number, w: number, h: number, tell: boolean, frame: boolean): void {
    this.root.position.set(x, y);
    placeBox(this.base, 0, 0, w, h);
    const length = this.vertical ? h : w;
    for (let i = 0; i < this.slats.length; i++) this.slats[i]!.visible = 5 + i * 15 < length - 2;
    const inset = Math.max(0, length - 6);
    const size = Math.min(length, 6);
    placeBox(this.edge, this.vertical ? 0 : inset, this.vertical ? inset : 0, this.vertical ? w : size, this.vertical ? size : h);
    this.edge.tint = tell ? '#fff0b8' : '#e8b84a';
    this.stripes.position.copyFrom(this.edge.position);
    this.stripes.scale.set(this.vertical ? 1 : size, this.vertical ? size : 1);
    this.outline[0]!.visible = frame && !tell;
    this.outline[1]!.visible = frame && tell;
    this.outline[tell ? 1 : 0]!.scale.set(w / this.maxW, h / this.maxH);
  }
}

function hingedGate(state: HazardState, spec: Extract<Hazard, { kind: 'gate' }>): HazardView {
  const root = new Container();
  const shape = state.shapes[0] as SwingingRect;
  const sw = new Container();
  const panel = new Shutter(shape.w, shape.h, true);
  sw.addChild(panel.root);
  const pivot = ring(6, 2.5);
  const dial = new Dial(spec.cycle);
  root.addChild(sw, pivot, dial.root);
  return {
    root,
    sync(t, _rm, cx, cy) {
      root.visible = circleVisible(shape.x, shape.y, shape.w + shape.h, cx, cy);
      if (!root.visible) return;
      sw.position.set(shape.x, shape.y);
      sw.rotation = shape.angle;
      panel.sync(-shape.w / 2, 0, shape.w, shape.h, state.tell, false);
      pivot.position.copyFrom(sw.position);
      pivot.tint = state.tell ? AMBER : MINT;
      dial.sync(shape.x, shape.y - 24, t, state.tell);
    },
  };
}

function gateOrPop(state: HazardState, spec: Extract<Hazard, { kind: 'gate' | 'pop' }>, assets: Assets): HazardView {
  const root = new Container();
  const a = spec.area;
  const { x, y, w, h } = a;
  const vertical = spec.kind === 'gate' && spec.axis === 'y';
  const shape = state.shapes[0] as Rect;
  const fill = box(x, y, w, h, '#8870ba', 0.14);
  const edge = [
    new Graphics().rect(x, y, w, h).stroke({ color: '#a791bc', width: 1.5 }),
    new Graphics().rect(x, y, w, h).stroke({ color: AMBER, width: 3.5 }),
  ];
  const dial = new Dial(spec.cycle);
  root.addChild(fill, ...edge);
  if (spec.kind === 'gate') {
    const panel = new Shutter(w, h, vertical);
    root.addChild(panel.root,
      vertical ? box(x - 4, y - 8, w + 8, 11, '#796b89') : box(x - 8, y - 4, 11, h + 8, '#796b89'), dial.root);
    return {
      root,
      sync(t, rm, cx, cy) {
        root.visible = areaVisible(a, cx, cy);
        if (!root.visible) return;
        const tell = state.tell;
        const flash = tell && (rm || Math.floor(t * 9) % 2 === 0);
        fill.tint = tell ? AMBER : '#8870ba';
        fill.alpha = flash ? 0.3 : 0.14;
        panel.root.visible = !!shape.active;
        edge[0]!.visible = !shape.active && !tell;
        edge[1]!.visible = !shape.active && tell;
        if (shape.active) panel.sync(shape.x, shape.y, shape.w, shape.h, tell, true);
        dial.sync(spec.dialX ?? (vertical ? x + w / 2 : x + 26), vertical ? y - 26 : y - 20, t, tell);
      },
    };
  }
  if (spec.artKey) {
    const art = roomArt(assets, spec.artKey, x, y, w, h);
    const mask = new Graphics().rect(0, 0, 1, 1).fill(0xffffff);
    art.mask = mask;
    root.addChild(mask, art, dial.root);
    return {
      root,
      sync(t, rm, cx, cy) {
        root.visible = areaVisible(a, cx, cy);
        if (!root.visible) return;
        const tell = state.tell;
        fill.tint = tell ? AMBER : '#8870ba';
        fill.alpha = tell && (rm || Math.floor(t * 9) % 2 === 0) ? 0.3 : 0.14;
        edge[0]!.visible = !shape.active && !tell;
        edge[1]!.visible = !shape.active && tell;
        art.visible = !!shape.active;
        if (shape.active) {
          art.x = shape.x;
          mask.position.set(shape.x, y);
          mask.scale.set(shape.w, h);
        }
        dial.sync(x + w / 2, y - 24, t, tell);
      },
    };
  }
  const hx = x + w - 3;
  const house = new Container();
  house.y = y;
  const door = box(6, 6, 18, h - 10, '#2a1f38');
  house.addChild(new Graphics().poly([0, -4, 15, -20, 30, -4, 30, h + 8, 0, h + 8])
    .fill('#7a4e58').stroke({ color: INK, width: 3 }), door);
  const bird = new Container();
  const mask = new Graphics().rect(0, 0, 1, 1).fill(0xffffff);
  bird.mask = mask;
  const art = assets.get('room/cuckoo_bird') ? roomArt(assets, 'room/cuckoo_bird', 0, 0, w, h) : new Graphics()
    .ellipse(w * 0.6, h * 0.62, w * 0.55, h * 0.38).ellipse(23, 12, 15, 12).fill('#bc795e')
    .poly([13, 12, 0, 19, 13, 23]).fill(AMBER).rect(13, 9, 4, 4).fill(INK);
  bird.addChild(art);
  const shout = new Label(CUCKOO);
  root.addChild(mask, bird, box(hx + 24, y + h / 2 - 5, 26, 10, '#796b89'), house, dial.root, shout);
  return {
    root,
    sync(t, rm, cx, cy) {
      root.visible = areaVisible(a, cx, cy);
      if (!root.visible) return;
      const tell = state.tell;
      fill.tint = tell ? AMBER : '#8870ba';
      fill.alpha = tell && (rm || Math.floor(t * 9) % 2 === 0) ? 0.3 : 0.14;
      edge[0]!.visible = !shape.active && !tell;
      edge[1]!.visible = !shape.active && tell;
      bird.visible = !!shape.active;
      if (shape.active) {
        bird.position.set(shape.x, y);
        mask.position.set(shape.x, shape.y);
        mask.scale.set(shape.w, shape.h);
      }
      door.tint = tell ? AMBER : '#2a1f38';
      house.x = hx + (tell && !rm ? Math.sin(t * 60) * 1.5 : 0);
      dial.sync(x + w + 12, y - 30, t, tell);
      shout.visible = !!shape.active && state.level > 0.6 && shape.w > w * 0.8;
      if (shout.visible) shout.set(tr().abduct.cuckoo, x + w / 2, y - 16, 110);
    },
  };
}

export function hazardView(building: Building, state: HazardState, assets: Assets, index: number): HazardView | undefined {
  const { spec } = state;
  switch (spec.kind) {
    case 'camera': return new CameraView(building, assets, spec, state, index);
    case 'swing': return swing(state, spec, assets);
    case 'fan': return fan(state, spec, assets);
    case 'gear': return gear(state, spec, assets);
    case 'toss': return boneTossView(state, spec, assets);
    case 'patrol': return patrol(state, spec, assets);
    case 'fragile': return fragile(state, spec, assets);
    case 'castor': return castor(state, spec, assets);
    case 'speaker': return speaker(state, spec, assets);
    case 'creak':
    case 'draft': return zone(state, spec);
    case 'laser': return new LaserView(state, spec, assets);
    case 'gate': return spec.hinged ? hingedGate(state, spec) : gateOrPop(state, spec, assets);
    case 'pop': return gateOrPop(state, spec, assets);
    case 'swell': return undefined;
  }
}
