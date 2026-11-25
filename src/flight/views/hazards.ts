import { Container, Graphics } from 'pixi.js';
import type { Assets, Vec2 } from '../../contracts';
import { artSprite } from '../../ui/views/art';
import { roundRectPath } from '../../ui/draw';
import { C } from '../../ui/theme';
import { gt } from '../../i18n';
import type { DeepFlightScene } from '../deep-scene';
import { pointInCone } from '../geometry';
import { TRAFFIC_SCALE, type CarKey, type CarRT, type GagHazard, type HazardDef } from '../hazards';
import { DogView } from './craft';
import { BarkTell, BeaconView, CameraTell, PorchTell, SearchlightView, WatcherTell, WindowTell } from './detectors';
import { MonolithView } from './monolith';
import { LighthouseView } from './lighthouse';
import { NeonView } from './overlays';
import { cameraHead, CraneView, FlockView, HelicopterView, post, SkyWire } from './sky';
import { AmbulanceView, FlashBar, PhotographerView, StewardView } from './special-hazards';
import { arc, ConeView, dashedLine, lamp } from './tells';
import { CameraView, VehicleView } from './world';

type Sync = (cam: CameraView, t: number, rm: boolean, hot: number) => void;

function carBody(assets: Assets, key: CarKey, police: boolean, scale: number): VehicleView {
  return new VehicleView(assets, key, scale, (g, w, h) => {
    roundRectPath(g, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 14);
    g.fillStyle = police ? '#20263a' : key.includes('taxi') ? '#f2c230' : '#6a7aa0';
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = C.ink;
    g.stroke();
    roundRectPath(g, -w / 2 + 12, -h / 2 + 22, w - 24, 26, 6);
    g.fillStyle = '#9fd3e6';
    g.fill();
    if (police) {
      g.fillStyle = '#f4efe2';
      g.fillRect(-w / 2 + 8, -8, w - 16, 30);
    }
  });
}

class GagView {
  readonly root = new Container();
  private readonly accent = new Graphics();

  constructor(assets: Assets, private readonly d: GagHazard) {
    if (d.kind === 'sprinkler') {
      const art = artSprite(assets, 'flight/sprinkler_top', 40, 40) ?? new Graphics().circle(0, 0, 7).fill('#a0dcff');
      art.position.set(d.x, d.y);
      this.accent.position.set(d.x, d.y);
      for (let k = 0; k < 6; k++) arc(this.accent, 30 + k * 12, -0.25, 0.25);
      this.accent.stroke({ color: 'rgba(160,220,255,0.55)', width: 3 });
      this.root.addChild(art, this.accent);
    } else if (d.kind === 'tripwire') {
      dashedLine(this.accent, d.x, d.y, d.bx, d.by, 6, 6).stroke({ color: '#ff465a', width: 2 });
      this.root.addChild(this.accent);
      for (const [x, y] of [[d.x, d.y], [d.bx, d.by]] as const) {
        const g = artSprite(assets, 'flight/garden_gnome_top', 30, 30) ?? new Graphics()
          .circle(0, 0, 8).fill('#d94c6a').stroke({ color: C.ink, width: 2 });
        g.position.set(x, y);
        this.root.addChild(g);
      }
    }
  }

  sync(cam: CameraView, t: number, rm: boolean): void {
    this.root.visible = cam.sees(this.d.x, this.d.y, 160);
    if (!this.root.visible) return;
    if (this.d.kind === 'sprinkler') this.accent.rotation = rm ? 0 : t * 2.2;
    else this.accent.alpha = rm || Math.floor(t * 4) % 4 !== 0 ? 0.9 : 0.35;
  }
}

/** Three ordered hazard layers, with one retained view per definition or traffic slot. */
export class HazardViews {
  readonly ground = new Container();
  readonly detectors = new Container();
  readonly sky = new Container();
  readonly origin: Vec2 = { x: 0, y: 0 };
  private readonly each: (Sync | null)[];
  private readonly angle: Float64Array;
  private readonly lead: Int8Array;
  private readonly prevSpot: Float64Array;
  private readonly spotVel: Float64Array;
  private lastTime = -1;

  constructor(private readonly s: DeepFlightScene) {
    const field = s.sim.field;
    const n = field.defs.length;
    this.angle = new Float64Array(n);
    this.lead = new Int8Array(n);
    this.prevSpot = new Float64Array(n * 2);
    this.spotVel = new Float64Array(n * 2);
    this.each = field.defs.map((d, i) => this.build(d, i));
  }

  sync(cam: CameraView, t: number, rm: boolean): void {
    const f = this.s.sim.field;
    const cause = this.s.state === 'fly' ? this.s.sim.st.cause : -1;
    const pulse = cause < 0 ? 0 : rm ? 0.8 : 0.55 + 0.45 * Math.abs(Math.sin(t * 16));
    const dt = this.lastTime < 0 ? 1 / 60 : Math.max(0, Math.min(0.1, t - this.lastTime));
    this.lastTime = t;
    for (let i = 0; i < this.each.length; i++) {
      const view = this.each[i];
      if (!view) continue;
      const d = f.defs[i]!;
      if (d.type === 'camera' || d.type === 'watcher' || d.type === 'car' || d.type === 'steward') {
        const a = d.type === 'car' ? f.cars[i]![0]!.cone : f.a[i]!;
        const da = Math.atan2(Math.sin(a - this.angle[i]!), Math.cos(a - this.angle[i]!));
        if (Math.abs(da) > 0.0004 && Math.abs(da) < 0.3) this.lead[i] = da > 0 ? 1 : -1;
        else if (Math.abs(da) >= 0.3) this.lead[i] = 0;
        this.angle[i] = a;
      } else if (d.type === 'heli') {
        const o = i * 2;
        const x = f.x2[i]!;
        const y = f.y2[i]!;
        if (dt > 0) {
          const vx = (x - this.prevSpot[o]!) / dt;
          const vy = (y - this.prevSpot[o + 1]!) / dt;
          if (Math.abs(vx) < 3000 && Math.abs(vy) < 3000) {
            this.spotVel[o] = this.spotVel[o]! + (vx - this.spotVel[o]!) * 0.25;
            this.spotVel[o + 1] = this.spotVel[o + 1]! + (vy - this.spotVel[o + 1]!) * 0.25;
          }
        }
        this.prevSpot[o] = x;
        this.prevSpot[o + 1] = y;
      }
      view(cam, t, rm, cause === i ? pulse : 0);
    }
  }

  causeOrigin(i: number): Vec2 {
    const f = this.s.sim.field;
    const o = this.origin;
    const s = this.s.sim.saucer;
    const d = f.defs[i]!;
    o.x = s.x;
    o.y = s.y;
    switch (d.type) {
      case 'car':
        o.x = f.cars[i]![0]!.x;
        o.y = f.cars[i]![0]!.y;
        break;
      case 'traffic':
        for (const c of f.cars[i]!) {
          if (!c.live || !pointInCone(s.x, s.y, c.ox, c.oy, c.cone, d.coneHalf, d.coneRange)) continue;
          o.x = c.x;
          o.y = c.y;
          break;
        }
        break;
      case 'heli':
      case 'ambulance':
      case 'photographer':
      case 'steward':
        o.x = f.x[i]!;
        o.y = f.y[i]!;
        break;
      case 'window':
        o.x = d.wx;
        o.y = d.wy;
        break;
      case 'porch':
      case 'watcher':
      case 'dog':
      case 'camera':
      case 'hum':
      case 'lighthouse':
        o.x = d.x;
        o.y = d.y;
        break;
      default:
        break;
    }
    return o;
  }

  private build(d: HazardDef, i: number): Sync | null {
    const s = this.s;
    const { assets } = s.ctx;
    const f = s.sim.field;
    switch (d.type) {
      case 'hum': {
        const view = new MonolithView(assets, d);
        this.detectors.addChild(view.root);
        return (cam, _t, _rm, hot) => {
          view.root.visible = cam.sees(d.x, d.y, d.outer);
          if (view.root.visible) view.sync(!!f.on[i], !!f.tell[i], hot);
        };
      }
      case 'car': {
        const car = f.cars[i]![0]!;
        const body = carBody(assets, car.key, d.role === 'police', 1);
        const bar = d.role === 'police' ? new FlashBar(-6, true) : null;
        if (bar) body.root.addChild(bar.root);
        if (body.shadow) this.ground.addChild(body.shadow);
        this.ground.addChild(body.root);
        const lights = new Container();
        const cone = new ConeView(d.coneHalf, d.coneRange);
        const head = lamp();
        const beacon = d.barR > 0 ? new BeaconView(d.barR) : null;
        lights.addChild(cone.root, head);
        if (beacon) lights.addChild(beacon.root);
        this.detectors.addChild(lights);
        return (cam, t, rm, hot) => {
          body.sync(car.x, car.y, car.heading, 6, 8, cam.sees(car.x, car.y, 120));
          if (body.root.visible) bar?.sync(t, rm);
          lights.visible = cam.sees(car.x, car.y, d.coneRange + 120);
          if (!lights.visible) return;
          cone.sync(car.ox, car.oy, car.cone, hot, this.lead[i]!);
          head.position.set(car.ox, car.oy);
          beacon?.sync(car.x, car.y, f.a[i]!, t, rm, hot);
        };
      }
      case 'traffic': {
        const cars = f.cars[i]!.map((car: CarRT) => {
          const body = carBody(assets, car.key, false, TRAFFIC_SCALE);
          if (body.shadow) this.ground.addChild(body.shadow);
          this.ground.addChild(body.root);
          const cone = new ConeView(d.coneHalf, d.coneRange, undefined, 0.4);
          this.detectors.addChild(cone.root);
          return { car, body, cone };
        });
        return (cam, _t, _rm, hot) => {
          const saucer = s.sim.saucer;
          for (const { car, body, cone } of cars) {
            body.sync(car.x, car.y, car.heading, 6 * TRAFFIC_SCALE, 8 * TRAFFIC_SCALE,
              car.live && cam.sees(car.x, car.y, 120));
            cone.root.visible = car.live && cam.sees(car.x, car.y, d.coneRange + 80);
            if (!cone.root.visible) continue;
            const seen = hot > 0 && pointInCone(saucer.x, saucer.y, car.ox, car.oy, car.cone, d.coneHalf, d.coneRange);
            cone.sync(car.ox, car.oy, car.cone, seen ? hot : 0);
          }
        };
      }
      case 'dog': {
        const body = new DogView(assets, d.x, d.y);
        const bark = new BarkTell(d);
        this.ground.addChild(body.root);
        this.detectors.addChild(bark.root);
        return (cam, t, rm, hot) => {
          const seen = s.sim.st.cause === i;
          body.root.visible = cam.sees(d.x, d.y, 80);
          if (body.root.visible) body.sync(t, rm, seen);
          bark.root.visible = cam.sees(d.x, d.y, d.rMax + 20);
          if (bark.root.visible) bark.sync(f.a[i]!, t, rm, hot, seen);
        };
      }
      case 'porch': {
        const mount = new Container();
        if (d.mount === 'post') mount.addChild(post(0, 0, 34, 5, 11));
        mount.addChild(artSprite(assets, 'flight/porch_light_top', 30, 30) ??
          new Graphics().circle(0, 0, 9).fill('#d8d2b8').stroke({ color: C.ink, width: 3 }));
        mount.position.set(d.x, d.y);
        const light = new PorchTell(d);
        this.ground.addChild(mount);
        this.detectors.addChild(light.root);
        const slot = f.porchSlot[i]!;
        return (cam, t, rm, hot) => {
          mount.visible = cam.sees(d.x, d.y, 50);
          light.root.visible = cam.sees(d.x, d.y, d.r + 20);
          if (light.root.visible) light.sync(s.sim.st.porchLit[slot]!, s.sim.st.porchArm[slot]!, hot, i, t, rm);
        };
      }
      case 'watcher': {
        const watcher = new WatcherTell(d);
        this.detectors.addChild(watcher.root);
        return (cam, t, rm, hot) => {
          watcher.root.visible = cam.sees(d.x, d.y, d.range + 40);
          if (watcher.root.visible) watcher.sync(f.a[i]!, f.b[i]!, f.tell[i] === 1, this.lead[i]!, hot, t, f.t, rm);
        };
      }
      case 'camera': {
        const body = cameraHead(assets, d.x, d.y, d.mount);
        const head = body.children[body.children.length - 1]!;
        const camera = new CameraTell(d);
        this.ground.addChild(body);
        this.detectors.addChild(camera.root);
        return (cam, t, rm, hot) => {
          const a = f.a[i]!;
          body.visible = cam.sees(d.x, d.y, 60);
          head.rotation = a + (d.mount === 'radar' ? 0 : Math.PI / 2);
          camera.root.visible = cam.sees(d.x, d.y, d.range + 20);
          if (camera.root.visible) camera.sync(a, hot, this.lead[i]!, t, i, rm);
        };
      }
      case 'window': {
        const window = new WindowTell(assets, d);
        this.detectors.addChild(window.root);
        return (cam, t, rm, hot) => {
          window.root.visible = cam.sees(d.x, d.y, d.r + 120);
          if (window.root.visible) window.sync(f.on[i] === 1, f.tell[i] === 1, hot, t, i, rm);
        };
      }
      case 'neon': {
        const neon = new NeonView(assets, d.x, d.y, d.r, gt(d.text), true);
        this.detectors.addChild(neon.glow, neon.root);
        return (cam, t, rm) => {
          neon.root.visible = neon.glow.visible = cam.sees(d.x, d.y, d.r);
          if (neon.root.visible) neon.sync(f.on[i] === 1, t, rm);
        };
      }
      case 'heli': {
        const craft = new HelicopterView(assets, d);
        const spot = new SearchlightView(d);
        this.detectors.addChild(spot.root);
        this.sky.addChild(craft.root);
        return (cam, t, rm, hot) => {
          const sx = f.x2[i]!;
          const sy = f.y2[i]!;
          spot.root.visible = cam.sees(sx, sy, d.spotR + 60);
          if (spot.root.visible) spot.sync(sx, sy, this.spotVel[i * 2]!, this.spotVel[i * 2 + 1]!, hot, t, rm);
          craft.sync(cam, f.x[i]!, f.y[i]!, f.a[i]!, sx, sy, t, rm);
        };
      }
      case 'wire': {
        const wire = new SkyWire(d);
        this.sky.addChild(wire.root);
        return (cam, t, rm) => wire.sync(cam, s.lineFlash[i]!, t, rm);
      }
      case 'flock': {
        const flock = new FlockView(assets, d);
        this.sky.addChild(flock.root);
        return (cam, t, rm) => flock.sync(cam, f.x[i]!, f.y[i]!, f.a[i]!, i, t, rm);
      }
      case 'crane': {
        const crane = new CraneView(assets, d);
        this.sky.addChild(crane.root);
        return (cam, t, rm) => crane.sync(cam, f.a[i]!, t, rm);
      }
      case 'gag': {
        if (d.kind === 'cropcircle') return null;
        const gag = new GagView(assets, d);
        this.ground.addChild(gag.root);
        return (cam, t, rm) => gag.sync(cam, t, rm);
      }
      case 'lighthouse': {
        const light = new LighthouseView(d);
        this.ground.addChild(light.shadows);
        this.detectors.addChild(light.root);
        return (_cam, _t, _rm, hot) => light.sync(f.a[i]!, hot);
      }
      case 'ambulance': {
        const vehicle = new AmbulanceView(assets, d, f, i);
        this.ground.addChild(vehicle.ground);
        this.detectors.addChild(vehicle.detectors);
        return (cam, t, rm, hot) => vehicle.sync(cam, f, i, t, rm, hot);
      }
      case 'photographer': {
        const camera = new PhotographerView(assets, d);
        this.ground.addChild(camera.body);
        this.detectors.addChild(camera.detectors);
        return (cam, t, rm, hot) => camera.sync(cam, f, i, t, rm, hot);
      }
      case 'steward': {
        const steward = new StewardView(assets, d);
        this.ground.addChild(steward.body);
        this.detectors.addChild(steward.detectors);
        return (cam, _t, _rm, hot) => steward.sync(cam, f, i, hot, this.lead[i]!);
      }
    }
  }
}
