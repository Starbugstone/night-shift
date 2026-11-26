import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../../contracts';
import { GLOW, glowTexture, Glow } from '../../core/gfx/glow';
import { Shape, keyOf } from '../../core/gfx/shapes';
import { C } from '../../ui/theme';
import { artShadow, artSprite } from '../../ui/views/art';
import { AMBULANCE, ambulanceReady, ambulanceTrip, type AmbulanceHazard } from '../ambulance';
import { ambulanceFallback, bayFallback, BAY_W, BAY_H, DOOR_W } from '../ambulance-draw';
import type { HazardField } from '../hazards';
import { PHOTO, PhotoPhase, photoPhase, type PhotographerHazard, type StewardHazard } from '../photographer';
import { BeaconView, BLUE } from './detectors';
import { ConeView, ProgressArc, RED, dashedArc, dashedLine, lamp } from './tells';
import { CameraView, spriteOr, TAU, VehicleView } from './world';

export class FlashBar {
  readonly root = new Container();
  private readonly left: Glow;
  private readonly right: Glow;
  private readonly blue = glowTexture(BLUE);
  private readonly other;

  constructor(Y: number, police: boolean) {
    this.other = glowTexture(police ? GLOW.red : GLOW.white);
    this.left = new Glow(this.blue, true).place(-12, Y, 22, 22, 0.9);
    this.right = new Glow(this.other, true).place(12, Y, 22, 22, 0.9);
    this.root.addChild(this.left, this.right);
  }

  sync(t: number, rm: boolean): void {
    const blue = rm || Math.floor(t * 6) % 2 === 0;
    this.left.texture = blue ? this.blue : this.other;
    this.right.texture = blue ? this.other : this.blue;
  }
}

const ARROW_RUN = 420;

export class AmbulanceView {
  readonly ground = new Container();
  readonly detectors = new Container();
  private readonly vehicle: VehicleView;
  private readonly bar = new FlashBar(-18, false);
  private readonly arrows: Graphics[] = [];
  private readonly door = new Graphics().rect(-DOOR_W / 2, 0, DOOR_W, 1).fill('#0b0920');
  private readonly doorLight = new Glow(glowTexture(GLOW.warm), true);
  private readonly cone: ConeView;
  private readonly head = lamp();
  private readonly beacon: BeaconView;
  private readonly ghost: Graphics;
  private readonly standby: Graphics;
  private readonly charge: ProgressArc;
  private readonly doorX: number;
  private readonly returnTime: number;

  constructor(assets: Assets, private readonly d: AmbulanceHazard, field: HazardField, i: number) {
    const route = field.routes[i]!;
    this.returnTime = ambulanceTrip(d, route);
    const first = d.path[0]!;
    const out = d.path[1] ?? first;
    const a = Math.atan2(out.y - first.y, out.x - first.x) - Math.PI / 2;
    this.doorX = (first.x - d.bayX) * Math.cos(a) + (first.y - d.bayY) * Math.sin(a);
    const pos = { x: 0, y: 0 };
    for (let s = 60; s <= Math.min(ARROW_RUN, route.total); s += 64) {
      const h = route.at(s, pos, 40);
      const arrow = new Graphics().moveTo(-10, 18).lineTo(12, 0).lineTo(-10, -18)
        .stroke({ color: C.amber, width: 7, join: 'round', cap: 'round' });
      arrow.rotation = h;
      arrow.position.set(pos.x, pos.y);
      this.arrows.push(arrow);
      this.ground.addChild(arrow);
    }
    this.vehicle = new VehicleView(assets, 'flight/ambulance_top', 1, ambulanceFallback);
    this.vehicle.root.addChild(this.bar.root);
    if (this.vehicle.shadow) this.ground.addChild(this.vehicle.shadow);
    this.ground.addChild(this.vehicle.root);
    const roofShadow = artShadow(assets, 'flight/ambulance_bay_top', BAY_W, BAY_H, 0.36);
    if (roofShadow) {
      roofShadow.position.set(d.bayX + 12, d.bayY + 14);
      roofShadow.rotation = a;
      this.ground.addChild(roofShadow);
    }
    const bay = new Container();
    bay.position.set(d.bayX, d.bayY);
    bay.rotation = a;
    this.door.position.set(this.doorX, BAY_H / 2 - 10);
    bay.addChild(spriteOr(assets, 'flight/ambulance_bay_top', BAY_W, BAY_H, bayFallback), this.door, this.doorLight);
    this.ground.addChild(bay);

    this.cone = new ConeView(d.coneHalf, d.coneRange);
    this.beacon = new BeaconView(d.beaconR, true);
    this.ghost = dashedArc(new Graphics(), d.beaconR, 0, TAU, 14, 10).stroke({ color: C.amber, width: 3.5 });
    this.ghost.position.set(out.x, out.y);
    this.standby = dashedArc(new Graphics(), d.trigger, 0, TAU, 4, 10).stroke({ color: '#ffe296', width: 2, alpha: 0.3 });
    this.standby.position.set(d.bayX, d.bayY);
    this.charge = new ProgressArc(d.trigger, 6, C.amber);
    this.charge.root.position.set(d.bayX, d.bayY);
    this.charge.root.alpha = 0.9;
    this.detectors.addChild(this.cone.root, this.head, this.beacon.root, this.ghost, this.standby, this.charge.root);
  }

  sync(cam: CameraView, f: HazardField, i: number, t: number, rm: boolean, hot: number): void {
    const d = this.d;
    const x = f.x[i]!;
    const y = f.y[i]!;
    const a = f.a[i]!;
    const tau = f.b[i]!;
    const driving = f.on[i] === 1;
    const tell = f.tell[i] === 1;
    const k = Math.min(1, tau / AMBULANCE.tell);
    this.ground.visible = cam.sees(x, y, 200) || cam.sees(d.bayX, d.bayY, 160);
    if (this.ground.visible) {
      this.vehicle.sync(x, y, a, 6, 8, driving || tau < this.returnTime + AMBULANCE.doorDown);
      this.bar.root.visible = driving;
      if (driving) this.bar.sync(t, rm);
      const up = tau < 0 ? 0 : tau < this.returnTime ? Math.min(1, tau / 0.45) :
        Math.max(0, 1 - (tau - this.returnTime) / AMBULANCE.doorDown);
      this.door.visible = up > 0;
      this.door.scale.y = 10 * up + 2;
      this.doorLight.place(this.doorX, BAY_H / 2 + 6, 46 * up, 30 * up, tell ? 0.8 : 0);
      const run = 60 + (ARROW_RUN - 60) * Math.min(1, k * 1.6);
      const flash = rm || Math.floor(t * 8) % 2 === 0 ? 1 : 0.45;
      for (let j = 0; j < this.arrows.length; j++) {
        const arrow = this.arrows[j]!;
        const at = 60 + j * 64;
        arrow.visible = tell && at <= run;
        arrow.alpha = flash * (1 - 0.45 * at / ARROW_RUN);
      }
    }
    this.detectors.visible = cam.sees(x, y, d.coneRange + 120) || cam.sees(d.bayX, d.bayY, d.trigger + 20);
    if (!this.detectors.visible) return;
    this.cone.root.visible = this.head.visible = this.beacon.root.visible = driving;
    if (driving) {
      this.cone.sync(f.x2[i]!, f.y2[i]!, a, hot);
      this.head.position.set(f.x2[i]!, f.y2[i]!);
      this.beacon.sync(x, y, t * 9, t, rm, hot);
    }
    this.ghost.visible = !driving && tell;
    if (this.ghost.visible) {
      this.ghost.alpha = 0.4 + 0.5 * k;
      this.ghost.rotation = rm ? 0 : t * 90 / d.beaconR;
    }
    this.charge.sync(this.ghost.visible ? k : 0);
    this.standby.visible = !driving && !tell && ambulanceReady(d, f.routes[i]!, f.t - tau, f.t);
  }
}

function crewBody(assets: Assets, photo: boolean): Container {
  const size = photo ? 50 : 44;
  return artSprite(assets, photo ? 'flight/photographer_top' : 'flight/steward_top', size, size) ??
    new Graphics().ellipse(0, 2, 15, 10).fill(photo ? '#5d6a8a' : '#eef0f4').stroke({ color: C.ink, width: 2.5 })
      .circle(0, 0, 8).fill(photo ? '#2c2a3a' : '#f8f8ff').stroke({ color: C.ink, width: 2.5 })
      .rect(-6, -19, 12, photo ? 10 : 7).fill(photo ? C.ink : '#c9a25a');
}

export class StewardView {
  readonly body: Container;
  readonly detectors = new Container();
  private readonly cone: ConeView;
  private readonly torch = new Glow(glowTexture(GLOW.warm), true).place(0, 0, 20, 20, 0.8);

  constructor(assets: Assets, private readonly d: StewardHazard) {
    this.body = d.skin === 'dozer2199'
      ? artSprite(assets, 'flight/demolition_dozer2199_top') ?? new Graphics().roundRect(-35, -22, 70, 59, 6).fill('#a18a65')
        .roundRect(-48, -36, 96, 19, 5).fill('#d6c498').stroke({ color: C.ink, width: 3 })
      : crewBody(assets, false);
    this.cone = new ConeView(d.coneHalf, d.coneRange, '255,236,190');
    this.detectors.addChild(this.cone.root, this.torch);
  }

  sync(cam: CameraView, f: HazardField, i: number, hot: number, lead: number): void {
    const x = f.x[i]!;
    const y = f.y[i]!;
    this.body.visible = cam.sees(x, y, 60);
    this.body.position.set(x, y);
    this.body.rotation = f.b[i]! + Math.PI / 2;
    this.detectors.visible = cam.sees(x, y, this.d.coneRange + 40);
    if (!this.detectors.visible) return;
    this.cone.sync(f.x2[i]!, f.y2[i]!, f.a[i]!, hot, lead);
    this.torch.position.set(f.x2[i]!, f.y2[i]!);
  }
}

export class PhotographerView {
  readonly body = new Container();
  readonly detectors = new Container();
  private readonly crew: Container;
  private readonly charge = new Glow(glowTexture(GLOW.amber), true);
  private readonly flash = new Glow(glowTexture(GLOW.white), true);
  private readonly standby: Graphics;
  private readonly frame = new Container();
  private readonly focus = new Container();
  private readonly brackets = new Graphics();
  private readonly iris = new Shape();
  private readonly blades = new Graphics();
  private readonly sight = new Shape();
  private readonly expose = new Container();
  private readonly wash: Graphics;
  private readonly rim: Graphics;
  private readonly hotRim: Graphics;
  private readonly meter: Graphics;
  private readonly diagonal: number;

  constructor(assets: Assets, private readonly d: PhotographerHazard) {
    this.crew = crewBody(assets, true);
    this.body.addChild(this.crew, this.charge, this.flash);
    this.standby = dashedArc(new Graphics(), d.range, 0, TAU, 4, 10).stroke({ color: C.amber, width: 2, alpha: 0.28 });
    this.standby.position.set(d.x, d.y);
    const w = d.halfW;
    const h = d.halfH;
    for (let c = 0; c < 4; c++) {
      const sx = c & 1 ? 1 : -1;
      const sy = c & 2 ? 1 : -1;
      this.brackets.moveTo(sx * (w - 26), sy * h).lineTo(sx * w, sy * h).lineTo(sx * w, sy * (h - 26));
    }
    this.brackets.stroke({ color: C.amber, width: 4, cap: 'round' });
    const R = 100;
    for (let b = 0; b < 6; b++) {
      const a = b * TAU / 6;
      this.blades.moveTo(Math.cos(a) * R, Math.sin(a) * R)
        .lineTo(Math.cos(a + 1.2) * R * 0.55, Math.sin(a + 1.2) * R * 0.55);
    }
    this.blades.stroke({ color: C.amber, width: 2.5, alpha: 0.55 });
    this.diagonal = Math.hypot(w, h);
    this.focus.addChild(this.brackets, this.iris, this.blades, this.sight);
    this.wash = new Graphics().rect(-w, -h, w * 2, h * 2).fill(0xffffff);
    this.rim = new Graphics().rect(-w, -h, w * 2, h * 2).stroke({ color: '#ff788c', width: 3.5, alpha: 0.95 });
    this.hotRim = new Graphics().rect(-w, -h, w * 2, h * 2).stroke({ color: RED, width: 5 });
    this.meter = new Graphics().moveTo(0, 0).lineTo(w * 2, 0).stroke({ color: RED, width: 5 });
    this.meter.position.set(-w, -h - 9);
    this.expose.addChild(this.wash, this.rim, this.hotRim, this.meter);
    this.frame.addChild(this.focus, this.expose);
    this.detectors.addChild(this.standby, this.frame);
  }

  sync(cam: CameraView, f: HazardField, i: number, t: number, rm: boolean, hot: number): void {
    const d = this.d;
    const x = f.x[i]!;
    const y = f.y[i]!;
    const face = f.a[i]!;
    const tau = f.b[i]!;
    const phase = photoPhase(tau);
    const iris = phase === PhotoPhase.Iris;
    const expose = phase === PhotoPhase.Expose;
    const k = iris ? tau / PHOTO.iris : 1;
    this.body.visible = cam.sees(x, y, 60);
    if (this.body.visible) {
      this.body.position.set(x, y);
      this.crew.rotation = face + Math.PI / 2;
      const fx = Math.cos(face) * 16;
      const fy = Math.sin(face) * 16;
      const r = 14 + 16 * k;
      this.charge.place(fx, fy, r, r, iris ? rm ? 0.7 : 0.5 + 0.5 * k : 0);
      this.flash.place(fx, fy, r, r, expose ? rm ? 0.7 : 1 : 0);
    }
    this.detectors.visible = cam.sees(d.x, d.y, d.range + 120);
    if (!this.detectors.visible) return;
    this.standby.visible = !iris && !expose;
    this.standby.rotation = rm ? 0 : t * 12 / d.range;
    this.frame.visible = iris || expose;
    if (!this.frame.visible) return;
    const slot = f.photoSlot[i]! * PHOTO.stride;
    const fx = f.photo[slot + 1]!;
    const fy = f.photo[slot + 2]!;
    this.frame.position.set(fx, fy);
    this.focus.visible = iris;
    this.expose.visible = expose;
    if (iris) {
      this.brackets.alpha = 0.75 + 0.25 * k;
      const r = this.diagonal * (1 - k) + 6;
      this.iris.draw(keyOf(r), (g) => g.circle(0, 0, r).stroke({ color: C.amber, width: 2.5, alpha: 0.55 }));
      this.blades.visible = !rm;
      this.blades.rotation = k * 1.4;
      this.blades.scale.set(r / 100);
      const dx = d.x - fx;
      const dy = d.y - fy;
      this.sight.draw(keyOf(dx, dy), (g) => dashedLine(g, dx, dy, 0, 0, 4, 10)
        .stroke({ color: C.amber, width: 1.5, alpha: 0.5 }));
    } else {
      const e = (tau - PHOTO.iris) / PHOTO.expose;
      this.wash.alpha = (rm ? 0.12 : 0.22 * (1 - e) + 0.08) + hot * 0.08;
      this.rim.visible = hot <= 0;
      this.hotRim.visible = hot > 0;
      this.meter.scale.x = 1 - e;
    }
  }
}
