import { RecitalView } from './recital';
import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../../contracts';
import { VIEW_W } from '../../contracts';
import { GLOW, Glow, glowTexture } from '../../core/gfx/glow';
import { ParticleView } from '../../core/gfx/particles';
import type { SceneView } from '../../core/gfx/scene';
import { Shape, keyOf, panelPath } from '../../core/gfx/shapes';
import { Label, measure } from '../../core/gfx/text';
import { tr } from '../../i18n';
import type { DeepMap, PropKind } from '../../levels/types';
import { clamp } from '../../ui/draw';
import { C } from '../../ui/theme';
import { drawCampusGround } from '../ambulance-draw';
import { LOCK_ANIM, SPOT_HOLD, type DeepFlightScene } from '../deep-scene';
import { SAFE_WINDOW } from '../deep-sim';
import { drawPierGround } from '../pier-ground';
import { propSize } from '../props';
import { BULB_ROWS, SHIP, SHIP_BOTTOM, SHIP_LEFT, SHIP_RIGHT, drawShipGround } from '../ship-hull';
import { FLIGHT_HUD } from '../sim';
import { DeepSpottedView } from '../spotted';
import { AmbientView } from './ambient';
import { EntryRingView, RING_CLEAR, SaucerView } from './craft';
import { placePills, type Box, type PillAsk } from './clear-of';
import { DeepFlightHud } from './deep-hud';
import { DriveInScenery } from './invasion1953';
import { HazardViews } from './hazards';
import { FLIGHT_BUBBLES, FlightTintView, abovePlayer, tick } from './overlays';
import { ProgressArc, RED, dashedArc } from './tells';
import { RoamView } from '../roam-view';
import { paintBadlands } from './monolith';
import { CameraView, GroundView, PropLayer, ShadowsView, TAU, TargetBuilding, basicGround, mapLamp } from './world';
import { EggView } from './eggs'; // v4 easter eggs
import { MapCollectibleToast, MapCollectibleView } from './collectible';
import { BirchFlightDecor } from './birch';
import { grailTerrain, GrailSpeechView } from './grail';
import { CrestValleyView } from './time-car';

const SHADOW_OFF: Partial<Record<PropKind, number>> = {
  suburb_house: 13, highrise: 16, civic: 15, tree: 13, hedge: 5, trampoline: 4,
};
const COLLECTED = { size: 14, color: C.mint, weight: 900 } as const;
const MISSED = { size: 15, color: C.paperInk, weight: 800, italic: true } as const;
const CHECKPOINT = { size: 15, color: C.mint, weight: 900 } as const;
const FUSE_R = FLIGHT_HUD.saucer / 2 + 21;


type Target = DeepMap['targets'][number];

class DeepTargetView {
  readonly root = new Container();
  private readonly building: TargetBuilding;
  /** The COLLECTED pill and the left-behind quip: stacked in the flight's bubble layer. */
  readonly bubble = new Container();
  private readonly collected = new Container();
  private readonly missed = new Container();
  private readonly quips: Container[] = [];
  private readonly y: number;

  constructor(assets: Assets, private readonly d: Target) {
    const b = d.building;
    const { h } = propSize(b);
    this.building = new TargetBuilding(assets, b);
    this.collected.position.set(b.x, b.y);
    this.collected.addChild(panelPath(new Graphics(), -62, -20, 124, 40,
      { fill: 'rgba(27,20,51,0.85)', r: 20, stroke: C.mint, lineW: 2, shadow: 0 }),
      tick(new Graphics(), -44, 0, 7), new Label(COLLECTED).set(tr().flight.collected, 10, 1, 92));
    this.missed.position.set(b.x, b.y - h / 2 - 34);
    this.y = this.missed.y;
    const lines = (tr().flight.missed as Record<string, readonly string[]>)[d.short] ?? [];
    for (const words of lines) {
      const w = Math.min(250, measure(words, 15, 800, true) + 28);
      const quip = new Container();
      quip.addChild(panelPath(new Graphics(), -w / 2, -17, w, 34,
        { fill: C.paper, r: 17, lineW: 2.5, shadow: 3 }).poly([-8, 16, 0, 28, 8, 16]).fill(C.paper),
        new Label(MISSED).set(words, 0, 1, w - 20));
      this.quips.push(quip);
      this.missed.addChild(quip);
    }
    this.root.addChild(this.building.root);
    this.bubble.addChild(this.collected, this.missed);
  }

  sync(cam: CameraView, done: boolean, i: number, t: number, rm: boolean): void {
    const b = this.d.building;
    this.root.visible = this.bubble.visible = cam.sees(b.x, b.y, 300);
    if (!this.root.visible) return;
    this.building.sync(done, t + i / 3, rm);
    this.collected.visible = done;
    // each quip stays ~4.5 s (long enough to read), then rests ~4.5 s
    const cycle = (t * 0.11 + i * 0.37) % 1;
    // the quip comes and goes on a cycle: fade it out with alpha (a visible flip rebuilds the render group)
    this.missed.visible = done && this.quips.length > 0;
    if (!this.missed.visible) return;
    if (cycle > 0.5) {
      this.missed.alpha = 0;
      return;
    }
    const k = cycle / 0.5;
    this.missed.alpha = Math.min(1, k * 8, (1 - k) * 6);
    this.missed.y = this.y - (rm ? 0 : Math.sin(k * Math.PI) * 6);
    const line = Math.floor(t * 0.11 + i * 0.37) % this.quips.length;
    for (let q = 0; q < this.quips.length; q++) this.quips[q]!.visible = q === line;
  }
}

class CheckpointView {
  readonly root = new Container();
  private readonly glow = new Glow(glowTexture(GLOW.mint), true);
  private readonly ring = dashedArc(new Graphics(), 46, 0, TAU, 4, 10).stroke({ color: C.mint, width: 2.5, alpha: 0.7 });
  private readonly pennant = new Shape();
  private readonly pop = new Container();
  private readonly light = new Glow(glowTexture(GLOW.mint), true);
  private readonly beam = new Glow(glowTexture(GLOW.white), true);
  private readonly label = new Container();

  constructor() {
    const pole = new Graphics().moveTo(-8, 16).lineTo(-8, -22).stroke({ color: C.ink, width: 6, cap: 'round' })
      .moveTo(-8, 16).lineTo(-8, -22).stroke({ color: '#d9d0ea', width: 3, cap: 'round' });
    this.root.addChild(this.glow, this.ring, pole, this.pennant);
    this.label.addChild(panelPath(new Graphics(), -70, -118, 140, 34,
      { fill: 'rgba(27,20,51,0.92)', r: 17, stroke: C.mint, lineW: 2.5, shadow: 3 }),
      new Label(CHECKPOINT).set(tr().flight.checkpoint, 0, -100, 124));
    this.pop.addChild(this.light, this.beam, this.label);
  }

  get arrival(): Container {
    return this.pop;
  }

  sync(s: DeepFlightScene, cam: CameraView, t: number, rm: boolean): void {
    const cp = s.run.checkpoint;
    this.root.visible = Boolean(s.sim.delivered[0] || s.sim.delivered[1] || s.sim.delivered[2]) && cam.sees(cp.x, cp.y, 80);
    if (this.root.visible) {
      this.root.position.set(cp.x, cp.y);
      this.glow.place(0, 0, 54, 54, 0.22 + (rm ? 0 : 0.08 * Math.sin(t * 3)));
      this.ring.rotation = rm ? 0 : t * 14 / 46;
      const wave = rm ? 0 : Math.sin(t * 5) * 3;
      this.pennant.draw(keyOf(wave), (g) => g.moveTo(-7, -22).quadraticCurveTo(8, -24 + wave, 20, -14)
        .quadraticCurveTo(8, -8 - wave, -7, -6).closePath().fill(C.mint)
        .stroke({ color: C.ink, width: 2.5, join: 'round' }));
    }
    const k = s.cpT;
    this.pop.visible = k >= 0;
    if (!this.pop.visible) return;
    const saucer = s.sim.saucer;
    this.pop.position.set(saucer.x, saucer.y);
    const beam = Math.max(0, 1 - k / 0.45);
    this.light.place(0, 0, 110 + 60 * beam, 110 + 60 * beam, 0.7 * beam);
    this.beam.place(0, -110 * beam, 26 * beam + 8, 190 * beam + 40, (rm ? 0.4 : 0.9) * beam);
    const a = clamp(Math.min(k * 6, (1.7 - k) * 3), 0, 1);
    this.label.visible = a > 0;
    this.label.alpha = a;
    this.label.y = rm ? 0 : -Math.min(1, k / 0.3) * 10 - Math.sin(t * 5) * 2;
  }
}

class WorldFuse {
  readonly root = new Container();
  private readonly ring = new Container();
  private readonly cool = new ProgressArc(FUSE_R, 7, C.amberHi);
  private readonly hot = new ProgressArc(FUSE_R, 7, RED);
  private readonly coolSpark = new Glow(glowTexture(GLOW.amber), true);
  private readonly hotSpark = new Glow(glowTexture(GLOW.red), true);
  private readonly spark = new Glow(glowTexture(GLOW.white), true);
  private readonly tether = new Shape();
  private readonly origin = new Graphics().circle(0, 0, 17).stroke({ color: RED, width: 4 });

  constructor() {
    this.ring.addChild(new Graphics().circle(0, 0, FUSE_R).stroke({ color: C.ink, width: 11, alpha: 0.6 }),
      this.cool.root, this.hot.root, this.coolSpark, this.hotSpark, this.spark);
    this.root.addChild(this.ring, this.tether, this.origin);
  }

  sync(s: DeepFlightScene, hazards: HazardViews, cam: CameraView, t: number, rm: boolean): void {
    const st = s.sim.st;
    const v = st.sus;
    this.root.visible = s.state === 'fly' && v > 0.01;
    if (!this.root.visible) return;
    const saucer = st.s;
    this.ring.position.set(saucer.x, saucer.y);
    const exposed = st.cause >= 0;
    const left = 1 - v;
    this.cool.sync(!exposed && left > 0.003 ? left : 0);
    this.hot.sync(exposed && left > 0.003 ? left : 0);
    const a = -Math.PI / 2 + TAU * left;
    const x = Math.cos(a) * FUSE_R;
    const y = Math.sin(a) * FUSE_R;
    const r = 20 * (rm ? 1 : 0.75 + 0.25 * Math.sin(t * 47));
    this.coolSpark.place(x, y, r, r, exposed ? 0 : 1);
    this.hotSpark.place(x, y, r, r, exposed ? 1 : 0);
    this.spark.place(x, y, 8);
    // tether and origin get their final visibility once: a visible flip rebuilds the render group
    const o = exposed ? hazards.causeOrigin(st.cause) : null;
    const dx = o ? o.x - saucer.x : 0;
    const dy = o ? o.y - saucer.y : 0;
    const d = Math.hypot(dx, dy);
    const tethered = o !== null && d >= FUSE_R + 30;
    this.tether.visible = tethered;
    this.origin.visible = tethered && cam.sees(o.x, o.y, 20);
    if (!tethered) return;
    this.tether.position.set(saucer.x, saucer.y);
    this.tether.rotation = Math.atan2(dy, dx);
    this.tether.alpha = 0.5 + 0.5 * v;
    const offset = rm ? 0 : t * 70 % 12;
    this.tether.draw(keyOf(d, offset), (g) => {
      for (let start = FUSE_R + 9 - offset; start < d - 20; start += 12) {
        if (start + 3 <= FUSE_R + 9) continue;
        g.moveTo(Math.max(FUSE_R + 9, start), 0).lineTo(Math.min(start + 3, d - 20), 0);
      }
      g.stroke({ color: RED, width: 3.5, cap: 'round' });
    });
    this.origin.position.set(o.x, o.y);
    this.origin.scale.set(rm ? 1 : 1 + Math.sin(t * 20) * 0.18);
  }
}

class DawnBirds {
  readonly root = new Container();
  private readonly birds: Graphics[] = [];

  constructor() {
    for (let i = 0; i < 5; i++) {
      this.birds.push(this.root.addChild(new Graphics().moveTo(-10, -6).lineTo(0, 2).lineTo(10, -6)
        .stroke({ color: '#2b2350', width: 3, cap: 'round', join: 'round' })));
    }
  }

  sync(dawn: number, t: number, rm: boolean): void {
    this.root.visible = dawn >= 0.3 && !rm;
    if (!this.root.visible) return;
    this.root.alpha = Math.min(1, (dawn - 0.3) * 4) * 0.8;
    for (let i = 0; i < this.birds.length; i++) {
      const p = (t * 0.07 + i * 0.21) % 1;
      const bird = this.birds[i]!;
      bird.position.set(-40 + p * (VIEW_W + 80), 330 + i * 86 - p * 190 + Math.sin(t * 2 + i) * 8);
      bird.scale.y = Math.sin(t * 11 + i * 2);
    }
  }
}

class ShipDecor {
  readonly root = new Container();
  private readonly wake = new Container();
  private readonly curves: Graphics[] = [];
  private readonly bulbs: Graphics[][] = [];

  constructor() {
    this.wake.position.set(SHIP.cx, SHIP_BOTTOM - 20);
    for (let k = 0; k < 7; k++) {
      const curve = new Graphics().moveTo(-120, 40).quadraticCurveTo(0, -30, 120, 40)
        .stroke({ color: '#e1f0fa', width: 3 });
      this.wake.addChild(curve);
      this.curves.push(curve);
    }
    this.root.addChild(this.wake);
    for (const y of BULB_ROWS) {
      const row: Graphics[] = [];
      this.bulbs.push(row);
      const cable = new Graphics().moveTo(SHIP_LEFT + 34, y).quadraticCurveTo(SHIP.cx, y + 26, SHIP_RIGHT - 34, y)
        .stroke({ color: 'rgba(20,16,40,0.55)', width: 2 });
      this.root.addChild(cable);
      for (let k = 1; k < 24; k++) {
        const u = k / 24;
        const bulb = new Graphics().rect(-2.5, -2.5, 5, 5).fill(0xffffff);
        bulb.position.set(SHIP_LEFT + 34 + (SHIP.w - 68) * u, y + 52 * u * (1 - u) + 3);
        this.root.addChild(bulb);
        row.push(bulb);
      }
    }
  }

  sync(cam: CameraView, t: number, rm: boolean): void {
    this.wake.visible = cam.sees(SHIP.cx, SHIP_BOTTOM + 160, 540);
    if (this.wake.visible) {
      for (let k = 0; k < 7; k++) {
        const p = rm ? k / 7 : (t * 0.18 + k / 7) % 1;
        const c = this.curves[k]!;
        c.y = 520 * p;
        c.scale.x = 1 + 3.5 * p;
        c.alpha = 0.34 * (1 - p);
      }
    }
    const twinkle = rm ? -1 : Math.floor(t * 3);
    for (let i = 0; i < this.bulbs.length; i++) {
      const row = this.bulbs[i]!;
      for (let k = 0; k < row.length; k++) {
        const g = row[k]!;
        g.visible = cam.sees(g.x, g.y, 5);
        if (g.visible) g.tint = (k + 1 + i + twinkle) % 5 === 0 ? '#e8f1ff' : '#ffd9a0';
      }
    }
  }
}

export class DeepFlightView implements SceneView {
  readonly root = new Container();
  private readonly camera = new CameraView();
  private readonly upperWorld = new Container();
  private readonly tints = new FlightTintView(true);
  private readonly ground: GroundView;
  private readonly ship: ShipDecor | null;
  private readonly props: PropLayer;
  private readonly groundProps: PropLayer;
  private readonly ambient: AmbientView;
  private readonly shadows: ShadowsView;
  private readonly eggs: EggView; // v4 easter eggs
  private readonly collectible: MapCollectibleView | null;
  private readonly birch: BirchFlightDecor | null;
  private readonly grail: GrailSpeechView | null;
  private readonly crestValley: CrestValleyView | null;
  private readonly pickupToast: MapCollectibleToast | null;
  private readonly targets: DeepTargetView[];
  private readonly checkpoint = new CheckpointView();
  private readonly recitals?: RecitalView;
  private readonly hazards: HazardViews;
  private readonly driveIn: DriveInScenery | null;
  private readonly lights: Glow[];
  private readonly rings: (EntryRingView | RoamView)[];
  /** v4 council: scratch obstacles for route pills (HUD boxes, the entry rings on screen, then the pills placed). */
  private readonly clear: Box[];
  /** v4 council: route pill scratch, one slot per visible entry ring (`placePills`). */
  private readonly asks: PillAsk[];
  private readonly spots: { x: number; y: number }[];
  private readonly moved: Uint8Array;
  /** Which ring each pill slot belongs to. */
  private readonly pillOf: Uint8Array;
  private readonly saucer: SaucerView;
  private readonly fx: ParticleView;
  private readonly fuse = new WorldFuse();
  private readonly dawn = new DawnBirds();
  private readonly hud: DeepFlightHud;
  private readonly spotted: DeepSpottedView;
  private photoCount = 0;

  constructor(private readonly s: DeepFlightScene) {
    const { assets } = s.ctx;
    const m = s.level.map;
    this.ground = new GroundView(m.w, m.h, assets, m.theme, m.roads, (g, x, y, w, h) => {
      switch (m.theme) {
        case 'pier':
          drawPierGround(g, assets, m.ground ?? [], x, y, w, h, s.speckles);
          break;
        case 'clinic':
          drawCampusGround(g, assets, x, y, s.speckles, w, h);
          break;
        case 'badlands':
          basicGround(g, assets, 'flight/ground_badlands', x, y, w, h, '#493743', '#614951', s.speckles, false);
          if (!assets.get('flight/ground_badlands')) paintBadlands(g, x, y, w, h);
          break;
        case 'grail':
          basicGround(g, assets, 'flight/ground_farm', x, y, w, h, '#374c42', '#4e6350', s.speckles, true);
          grailTerrain(g);
          break;
        case 'invasion53':
          basicGround(g, assets, 'flight/ground_invasion53', x, y, w, h, '#2e2946', '#403652', s.speckles, false);
          break;
        case 'grimsby2199':
          basicGround(g, assets, 'flight/ground_grimsby2199', x, y, w, h, '#29323d', '#34424c', s.speckles, false);
          break;
        case 'storm55':
          basicGround(g, assets, 'flight/ground_storm55', x, y, w, h, '#303849', '#3b4253', s.speckles, false);
          break;
        case 'ship':
          drawShipGround(g, assets, x, y, s.speckles, w, h);
          break;
        default: {
          const grass = m.theme === 'suburb';
          basicGround(g, assets, grass ? 'flight/ground_suburb' : 'flight/ground_city', x, y, w, h,
            grass ? '#2b4a3a' : '#2a2a40', grass ? '#335644' : '#33334c', s.speckles, grass);
        }
      }
    });
    this.ship = m.theme === 'ship' ? new ShipDecor() : null;
    this.birch = s.level.id === 'birch_bakery' || s.level.id === 'birch_neighbours' ? new BirchFlightDecor(s) : null;
    this.groundProps = new PropLayer(assets, m.groundProps);
    this.props = new PropLayer(assets, m.props);
    this.shadows = new ShadowsView(assets, [...m.props, ...m.targets.map((tg) => tg.building)], SHADOW_OFF);
    this.eggs = new EggView(m.props); // v4 easter eggs
    const pickup = s.sim.collectible;
    this.crestValley = pickup?.timeCar ? new CrestValleyView(assets, pickup.timeCar) : null;
    this.collectible = pickup && !pickup.timeCar ? new MapCollectibleView(assets, pickup) : null;
    this.pickupToast = s.sim.collectible ? new MapCollectibleToast(s.sim.collectible.def.id) : null;
    this.targets = m.targets.map((tg) => new DeepTargetView(assets, tg));
    this.ambient = new AmbientView(s.ambient);
    this.hazards = new HazardViews(s);
    this.driveIn = m.theme === 'invasion53' ? new DriveInScenery(assets) : null;
    this.saucer = new SaucerView(assets);
    this.fx = new ParticleView(s.fx);
    this.lights = m.lamps.map((l) => mapLamp(l.x, l.y));
    this.rings = s.sim.ringRef.map((r) => r.ape ? new RoamView(assets, r.ape, m.targets[r.target]!.short) : new EntryRingView(assets, m.targets[r.target]!.entries[r.entry]!));
    const world = this.camera.world;
    world.addChild(this.ground.root);
    if (m.theme === 'grimsby2199') {
      this.recitals = new RecitalView(s);
      this.hazards.detectors.addChildAt(this.recitals.sectors, 0);
      this.hazards.bubbles.addChild(this.recitals.bubble);
    }
    if (this.ship) world.addChild(this.ship.root);
    if (this.birch) world.addChild(this.birch.ground);
    world.addChild(this.groundProps.root, this.ambient.ground, this.eggs.ground, this.shadows.root, this.props.root); // v4 easter eggs: streaks
    if (this.recitals) world.addChild(this.recitals.ground);
    for (const target of this.targets) world.addChild(target.root);
    if (this.crestValley) {
      this.camera.root.addChildAt(this.crestValley.strike.sky, 0);
      world.addChildAt(this.crestValley.ground, 2);
      world.addChild(this.crestValley.scenery);
    }
    if (this.birch) world.addChild(this.birch.foreground);
    if (this.driveIn) {
      world.addChildAt(this.driveIn.ground, 2);
      world.addChild(this.driveIn.root);
    }
    world.addChild(this.checkpoint.root, this.hazards.ground, this.ambient.steam, this.saucer.shadow);
    for (const light of this.lights) this.upperWorld.addChild(light);
    this.upperWorld.addChild(this.eggs.lights); // v4 easter eggs
    this.upperWorld.addChild(this.ambient.lights, this.saucer.groundGlow, this.ambient.critters, this.hazards.detectors, this.hazards.sky);
    for (const ring of this.rings) this.upperWorld.addChild(ring.root);
    if (this.collectible) this.upperWorld.addChild(this.collectible.root);
    if (this.crestValley) this.upperWorld.addChild(this.crestValley.car.root, this.crestValley.strike.world);
    // speech bubbles above every map object (houses, dogs, critters, rings), under the saucer
    const bubbles = new Container();
    bubbles.label = FLIGHT_BUBBLES;
    this.grail = m.theme === 'grail' ? new GrailSpeechView() : null;
    if (this.grail) bubbles.addChild(this.grail.root);
    for (const target of this.targets) bubbles.addChild(target.bubble);
    bubbles.addChild(this.hazards.bubbles);
    if (this.driveIn) bubbles.addChild(this.driveIn.bubbles);
    if (this.collectible) bubbles.addChild(this.collectible.bubbles);
    this.upperWorld.addChild(bubbles);
    this.clear = Array.from({ length: this.rings.length * 2 + 7 }, () => ({ x: 0, y: 0, w: 0, h: 0 }));
    this.moved = new Uint8Array(this.rings.length);
    this.pillOf = new Uint8Array(this.rings.length);
    this.asks = this.rings.map(() => ({ x: 0, ringX: 0, ringY: 0, reach: 0, gap: 0, side: 1, w: 0, h: 0, top: 0 }));
    this.spots = this.rings.map(() => ({ x: 0, y: 0 }));
    this.upperWorld.addChild(abovePlayer(this.checkpoint.arrival), abovePlayer(this.saucer.root), abovePlayer(this.fuse.root), abovePlayer(this.fx));
    world.addChild(this.tints.worldWash, this.upperWorld);
    this.tints.dawnDecor.addChild(this.dawn.root);
    this.hud = new DeepFlightHud(s);
    this.spotted = new DeepSpottedView(assets);
    this.spotted.photo.pm = s.level.id === 'level9';
    this.root.addChild(this.camera.root, this.tints.root);
    if (this.crestValley) this.root.addChild(this.crestValley.weather);
    this.root.addChild(this.hud.root);
    if (this.pickupToast) this.root.addChild(this.pickupToast);
    this.root.addChild(this.spotted.root);
  }

  sync(): void {
    const s = this.s;
    const { sim, run } = s;
    const t = s.ctx.time;
    const rm = s.ctx.reducedMotion;
    const dawn = run.dawn;
    const cam = this.camera;
    const saucer = sim.saucer;
    const lifting = s.state === 'locking' && !!sim.ringRef[sim.lockedRing]?.ape;
    const locking = s.state === 'locking' && !lifting;
    // A pickup holds its lifted pose (static under reduced motion) for the whole gameplay lock: the
    // ape is only collected at LOCK_ANIM, so ending the visual earlier left the saucer looking stuck.
    const lock = locking ? Math.min(1, s.st / (rm ? 0.5 : LOCK_ANIM)) : 0;
    const strike = this.crestValley?.strike;
    const reveal = strike && !rm && s.state === 'fly' && sim.lock.fraction === 0
      ? strike.revealScale(sim.camX, sim.camY, saucer.x, saucer.y, sim.field) : 1;
    if (strike) strike.sky.visible = reveal < 1;
    cam.sync(sim.camX, sim.camY, saucer.x, saucer.y, s.shake, lock, t, rm, reveal);
    this.tints.placeWorldWash(cam.world);
    this.ground.sync(cam);
    this.ship?.sync(cam, t, rm);
    this.groundProps.sync(cam);
    this.ambient.sync(cam, t, rm, dawn, saucer.x, saucer.y);
    this.props.sync(cam);
    this.birch?.sync(t, rm);
    this.eggs.sync(cam, t, rm); // v4 easter eggs
    this.collectible?.sync(cam, t, rm, saucer.x, saucer.y);
    this.crestValley?.sync(cam, t, rm, s.collectibleToastT);
    this.pickupToast?.sync(s.collectibleToastT, rm);
    this.shadows.sync(cam, dawn);
    for (let i = 0; i < this.targets.length; i++) this.targets[i]!.sync(cam, sim.delivered[i]!, i, t, rm);
    this.checkpoint.sync(s, cam, t, rm);
    for (const l of this.lights) {
      l.visible = cam.sees(l.x, l.y, 120);
      l.alpha = 1 - dawn * 0.6;
    }
    this.grail?.sync(s);
    this.recitals?.sync(cam);
    this.hazards.sync(cam, t, rm);
    this.driveIn?.sync(cam, sim.field.t, rm, sim.collectible?.collected ?? false, sim.st.cause === 0, s.queueBarkT);
    // v4 council: route pills keep clear of the HUD boxes and of every entry ring on screen
    const quietPills = !!strike && strike.age < 1.12;
    const striking = !!strike && strike.age >= -0.12 && strike.age < 0.75;
    const avoid = this.hud.avoid;
    let n = avoid.length;
    for (let i = 0; i < n; i++) {
      // 4 px of air round each HUD box, so a pill never sits flush against the minimap or a chip
      const a = avoid[i]!, b = this.clear[i]!;
      b.x = a.x - 4;
      b.y = a.y - 4;
      b.w = a.w + 8;
      b.h = a.h + 8;
    }
    if (this.collectible?.avoid(this.clear[n]!, cam.x, cam.y)) n++;
    if (this.crestValley?.car.root.visible) {
      const b = this.clear[n++]!;
      b.x = this.crestValley.car.root.x - cam.x - 96;
      b.y = this.crestValley.car.root.y - cam.y - 88;
      b.w = 192;
      b.h = 209;
    }
    if (quietPills) {
      const b = this.clear[n++]!;
      b.x = saucer.x - cam.x - FUSE_R - 8;
      b.y = saucer.y - cam.y - FUSE_R - 8;
      b.w = b.h = (FUSE_R + 8) * 2;
    }
    if (this.pickupToast && s.collectibleToastT > 0) {
      const b = this.clear[n++]!;
      b.x = VIEW_W / 2 - 162;
      b.y = 212;
      b.w = 324;
      b.h = 52;
    }
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i]!;
      const p = sim.rings[i]!;
      ring.root.visible = !sim.delivered[sim.ringRef[i]!.target] && cam.sees(p.x, p.y, 160);
      if (ring.root.visible && ring instanceof EntryRingView) {
        const b = this.clear[n++]!;
        b.x = p.x - cam.x - RING_CLEAR;
        b.y = p.y - cam.y - RING_CLEAR;
        b.w = b.h = RING_CLEAR * 2;
      }
    }
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i]!;
      if (ring.root.visible) ring.sync(i, t, rm, sim.lock.ring === i, sim.lock.fraction, sim.lockedRing === i, s.st, cam.x);
    }
    // pills whose own spot is free stay there; the others find room round them and each other
    let count = 0;
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i]!;
      if (ring.root.visible && ring instanceof EntryRingView) {
        const p = sim.rings[i]!;
        const nearby = sim.lock.ring === i || sim.lockedRing === i ||
          (!striking && Math.hypot(p.x - saucer.x, p.y - saucer.y) < 176);
        if (quietPills && (!nearby || reveal < 1)) {
          ring.showPill(false);
          continue;
        }
        ring.ask(cam.x, cam.y, this.asks[count]!);
        this.pillOf[count++] = i;
      }
    }
    placePills(this.clear, n, this.asks, count, this.spots, this.moved, quietPills);
    for (let k = 0; k < count; k++) {
      const ring = this.rings[this.pillOf[k]!] as EntryRingView;
      ring.showPill(this.moved[k] !== 2);
      ring.putPill(this.spots[k]!.x, this.spots[k]!.y, cam.x, cam.y);
    }
    this.saucer.cue(s.state, s.state === 'fly' && sim.st.cause >= 0, sim.st.sus, s.zibT > 0, this.recitals?.coverEars); // v4 UFO pilot
    this.saucer.sync(saucer, t, rm, locking, s.st, lock, sim.field.scramble(saucer.x, saucer.y), sim.st.safe, SAFE_WINDOW);
    if (lifting && !rm) this.saucer.root.y -= Math.min(1, s.st * 6) * 36;
    this.saucer.root.alpha = lifting ? 0.32 : sim.ringRef[sim.inRing]?.ape ? 0.65 : 1;
    this.fuse.sync(s, this.hazards, cam, t, rm);
    this.fx.sync();
    this.tints.sync(dawn, s.state === 'fly', sim.st.cause >= 0, sim.st.sus, locking, lock, s.st, t, rm);
    this.dawn.sync(dawn, t, rm);
    this.hud.sync(t, rm);
    this.spotted.root.visible = s.state === 'spotted';
    if (!this.spotted.root.visible) return;
    if (this.photoCount !== s.photoCount) {
      this.photoCount = s.photoCount;
      this.spotted.photo.grab(cam.root, saucer.x - cam.x, saucer.y - cam.y);
    }
    this.spotted.sync(s.st, t, rm, s.spotCause, s.shout, s.caption, s.spotLine, this.hud.clock, SPOT_HOLD);
  }

  /** The photo snapshot and the baked ground bitmaps are this view's own; the rest goes with the display tree. */
  dispose(): void {
    this.spotted.photo.dispose();
    this.ground.destroy();
  }
}
