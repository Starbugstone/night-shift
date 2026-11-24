import { Container, Graphics } from 'pixi.js';
import type { PropKind } from '../../levels/types';
import { VIEW_H, VIEW_W } from '../../contracts';
import { easeOutBack } from '../../core/fx';
import type { Glow } from '../../core/gfx/glow';
import { ParticleView } from '../../core/gfx/particles';
import type { SceneView } from '../../core/gfx/scene';
import { panelPath } from '../../core/gfx/shapes';
import { Label, Paragraph, measure, wrapLines } from '../../core/gfx/text';
import { fmt, gt, tr } from '../../i18n';
import { clamp, fmtTime, roundRectPath } from '../../ui/draw';
import { HUD_ROW, type FuseState } from '../../ui/hud';
import { C } from '../../ui/theme';
import { artTex } from '../../ui/views/art';
import { HudButton, HudFuse, HudPrompt, HudTimer } from '../../ui/views/hud';
import { pointInCone } from '../geometry';
import { drawVehicleFallback } from '../props';
import { LOCK_ANIM, type FlightScene } from '../scene';
import { FLIGHT_HUD, POWER_LINE, SUSPICION, barkRadius, neonOn, suspicionMultiplier } from '../sim';
import { DogView, EntryRingView, SaucerView } from './craft';
import { FlightBanner, FlightTintView, NeonView, TargetArrow, WireView, ZibBubble, woof } from './overlays';
import { ConeView, DiscTell, lamp } from './tells';
import { CameraView, GroundView, PropLayer, ShadowsView, TargetBuilding, VehicleView, basicGround, mapLamp, paintedSprite, plate } from './world';

const SHADOW_OFF: Partial<Record<PropKind, number>> = {
  farmhouse: 14, barn: 14, laundromat: 14, diner: 13, house: 13, tree: 13, tractor: 7, haybale: 7,
};
const ORDER = { size: 15, color: C.mint, weight: 900 } as const;
const COLLECT = { size: 21, color: C.text, weight: 800 } as const;
const MAYBE_BARK = { size: 18, color: C.amberHi, weight: 800, italic: true } as const;
const SLEEP = { size: 18, color: C.text, weight: 800 } as const;
const SPOTTED = { size: 86, color: C.amberHi, outline: C.ink, weight: 900 } as const;
const CAPTION = { size: 20, color: C.paperInk, weight: 700, align: 'center', lineHeight: 26, italic: true } as const;
const CAPTION_SMALL = { ...CAPTION, size: 17, lineHeight: 21 } as const;
const COUNT = { size: 17, color: C.muted, weight: 800 } as const;
const RETRY = { size: 26, color: C.mint, weight: 900 } as const;
const SHOUT = { size: 30, color: C.red, weight: 900 } as const;

export class TutorialFlightView implements SceneView {
  readonly root = new Container();
  private readonly camera = new CameraView();
  private readonly hud = new Container();
  private readonly ground: GroundView;
  private readonly groundProps: PropLayer;
  private readonly props: PropLayer;
  private readonly shadows: ShadowsView;
  private readonly target: TargetBuilding;
  private readonly saucer: SaucerView;
  private readonly fx: ParticleView;
  private readonly tints = new FlightTintView(false);
  private readonly cars: { body: VehicleView; cone: ConeView; head: Glow }[];
  private readonly dogs: { body: DogView; ring: DiscTell; bark: Label; question: Label; sleep: Label }[];
  private readonly neon: NeonView[];
  private readonly wires: WireView[];
  private readonly rings: EntryRingView[];
  private readonly lights: Glow[];
  private readonly quit = new HudButton('close');
  private readonly fuse: HudFuse;
  private readonly fuseState: FuseState = { value: 0, exposed: false, t: 0, reduced: false, seconds: 1 };
  private readonly timer = new HudTimer();
  private clock = '0:00';
  private clockSec = -1;
  private readonly banner: FlightBanner;
  private readonly arrow: TargetArrow;
  private readonly prompt = new HudPrompt();
  private readonly zib: ZibBubble;
  private readonly spotted = new TutorialSpotted();

  constructor(private readonly s: FlightScene) {
    const { assets } = s.ctx;
    const m = s.level.map;
    const farm = m.theme === 'farm';
    this.ground = new GroundView(m.w, m.h, assets, m.theme, m.roads, (g, x, y, w, h) => {
      basicGround(g, assets, farm ? 'flight/ground_farm' : 'flight/ground_town', x, y, w, h,
        farm ? '#2d4636' : '#2b2c4a', farm ? '#355440' : '#33355a', s.speckles, farm);
    });
    this.groundProps = new PropLayer(assets, m.groundProps);
    this.props = new PropLayer(assets, m.props);
    this.shadows = new ShadowsView(assets, [m.target, ...m.props], SHADOW_OFF);
    this.target = new TargetBuilding(assets, m.target);
    this.saucer = new SaucerView(assets);
    this.fx = new ParticleView(s.fx);
    this.cars = m.vehicles.map((d) => ({
      body: new VehicleView(assets, d.key, 1, (g, w, h) => drawVehicleFallback(g, d.kind, w, h), 0.34),
      cone: new ConeView(d.coneHalf, d.coneRange, '255,230,150', 0.28),
      head: lamp(),
    }));
    this.dogs = m.dogs.map((d) => ({
      body: new DogView(assets, d.x, d.y),
      ring: new DiscTell(4, 4.5, true),
      bark: woof().set(tr().flight.woof, d.x, d.y - 50),
      question: new Label(MAYBE_BARK).set(tr().flight.woofQ, d.x + 34, d.y - 34),
      sleep: new Label(SLEEP).set('z', d.x + 28, d.y - 28),
    }));
    this.neon = m.neons.map((n) => new NeonView(assets, n.x, n.y, n.r, gt(n.text), false));
    this.wires = m.powerLines.map((l) => new WireView(l.ax, l.ay, l.bx, l.by, POWER_LINE.wireGap, POWER_LINE.sag));
    const poles = new Graphics();
    for (const [x, y] of s.poles) poles.circle(x, y, POWER_LINE.poleR).fill('#6b4a2e').stroke({ color: C.ink, width: 3 });
    this.rings = m.entries.map((e) => new EntryRingView(assets, e));
    this.lights = m.lamps.map((l) => mapLamp(l.x, l.y));

    const world = this.camera.world;
    world.addChild(this.ground.root, this.groundProps.root, this.shadows.root);
    for (const { body } of this.cars) if (body.shadow) world.addChild(body.shadow);
    world.addChild(this.target.root, this.props.root);
    for (const { body } of this.dogs) world.addChild(body.root);
    for (const { body } of this.cars) world.addChild(body.root);
    world.addChild(this.saucer.shadow);
    // Upper-world lighting is composited after the wash.
    for (const light of this.lights) this.upperWorld.addChild(light);
    for (const n of this.neon) this.upperWorld.addChild(n.glow);
    for (const c of this.cars) this.upperWorld.addChild(c.cone.root, c.head);
    this.upperWorld.addChild(this.saucer.groundGlow);
    for (const n of this.neon) this.upperWorld.addChild(n.root);
    for (const d of this.dogs) this.upperWorld.addChild(d.ring.root, d.bark, d.question, d.sleep);
    for (const l of this.wires) this.upperWorld.addChild(l.root);
    this.upperWorld.addChild(poles);
    for (const r of this.rings) this.upperWorld.addChild(r.root);
    this.upperWorld.addChild(this.saucer.root, this.fx);

    this.fuse = new HudFuse(artTex(assets, 'ui/eye_closed'), artTex(assets, 'ui/eye_open'));
    const words = tr().flight;
    this.banner = new FlightBanner(100, 70,
      new Label(ORDER).set(fmt(words.orderNo, { num: s.level.num }), VIEW_W / 2, 122, VIEW_W - 150),
      new Label(COLLECT).set(fmt(words.collect, { name: tr().levels[s.level.id].collect }), VIEW_W / 2, 148, VIEW_W - 150),
    );
    this.arrow = new TargetArrow(assets, words.specimen, false);
    this.zib = new ZibBubble(assets);
    this.hud.addChild(this.quit, this.fuse, this.timer, this.banner.root, this.arrow.root, this.prompt, this.zib.root, this.spotted.root);
    world.addChild(this.tints.worldWash, this.upperWorld);
    this.root.addChild(this.camera.root, this.tints.root, this.hud);
  }

  private readonly upperWorld = new Container();

  /** The baked ground bitmaps are this view's own; the rest goes with the display tree. */
  dispose(): void {
    this.ground.destroy();
  }

  sync(): void {
    const s = this.s;
    const { time: t, reducedMotion: rm } = s.ctx;
    const m = s.level.map;
    const cam = this.camera;
    const locking = s.state === 'locking';
    const lock = locking ? Math.min(1, s.st / LOCK_ANIM) : 0;
    cam.sync(s.camX, s.camY, s.saucer.x, s.saucer.y, s.shake, lock, t, rm);
    this.tints.placeWorldWash(cam.world);
    this.ground.sync(cam);
    this.groundProps.sync(cam);
    this.props.sync(cam);
    this.shadows.sync(cam, 0);
    this.target.sync(false, t, rm);
    this.saucer.sync(s.saucer, t, rm, locking, s.st, lock, s.steerWobble);
    this.fx.sync();
    this.tints.sync(0, s.state === 'fly', s.exposed, s.sus.value, locking, lock, s.st, t, rm);

    for (const l of this.lights) l.visible = cam.sees(l.x, l.y, 120);
    for (let i = 0; i < this.cars.length; i++) {
      const c = this.cars[i]!;
      const v = s.vehicles[i]!;
      c.body.sync(v.path.x, v.path.y, v.path.heading, 7, 9, cam.sees(v.path.x, v.path.y, 120));
      const visible = cam.sees(v.ox, v.oy, v.def.coneRange + 40);
      c.cone.root.visible = c.head.visible = visible;
      if (visible) {
        c.cone.sync(v.ox, v.oy, v.coneAngle, s.state === 'fly' && s.exposed &&
          pointInCone(s.saucer.x, s.saucer.y, v.ox, v.oy, v.coneAngle, v.def.coneHalf, v.def.coneRange) ? 0.8 : 0);
        c.head.position.set(v.ox, v.oy);
      }
    }
    for (let i = 0; i < this.dogs.length; i++) {
      const d = m.dogs[i]!;
      const dog = this.dogs[i]!;
      dog.body.root.visible = cam.sees(d.x, d.y, 50);
      if (dog.body.root.visible) dog.body.sync(t, rm, s.inBark);
      const r = barkRadius(s.hazT, d.rMin, d.rMax, d.period);
      const peak = (r - d.rMin) / (d.rMax - d.rMin);
      dog.ring.root.visible = cam.sees(d.x, d.y, r + 20);
      const hot = s.state === 'fly' && Math.hypot(s.saucer.x - d.x, s.saucer.y - d.y) <= r;
      if (dog.ring.root.visible) dog.ring.sync(d.x, d.y, r, hot ? '#ff5d73' : '#ff8c3c', 0.06 + peak * 0.1, '#ffaa5a',
        0.35 + peak * 0.5, hot, rm ? 0 : t * 30 / r);
      dog.bark.visible = dog.ring.root.visible && s.inBark;
      dog.question.visible = dog.ring.root.visible && !s.inBark && peak > 0.85;
      dog.sleep.visible = dog.ring.root.visible && !s.inBark && peak <= 0.85;
      dog.sleep.alpha = 0.8;
      dog.sleep.y = d.y - 28 - (rm ? 0 : t * 12 % 14);
    }
    const on = neonOn(s.hazT);
    for (let i = 0; i < this.neon.length; i++) {
      const n = this.neon[i]!;
      n.root.visible = n.glow.visible = cam.sees(n.root.x, n.root.y, m.neons[i]!.r);
      if (n.root.visible) n.sync(on, s.hazT, rm);
    }
    for (let i = 0; i < this.wires.length; i++) this.wires[i]!.sync(s.lineFlash[i]!);
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i]!;
      ring.root.visible = cam.sees(ring.root.x, ring.root.y, 180);
      if (ring.root.visible) ring.sync(i, t, rm, s.lock.ring === i, s.lock.fraction, s.lockedRing === i, s.st, s.camX);
    }

    this.quit.sync(s.quit, tr().common.quit, s.quit.pressedDown);
    const f = this.fuseState;
    f.value = s.sus.value;
    f.exposed = s.exposed && s.state === 'fly';
    f.t = t;
    f.reduced = rm;
    f.seconds = 1 / (SUSPICION.rate * suspicionMultiplier(s.ctx.upgrades));
    this.fuse.sync(90, HUD_ROW.y, 330, HUD_ROW.h, f);
    const sec = Math.floor(s.time);
    if (sec !== this.clockSec) {
      this.clockSec = sec;
      this.clock = fmtTime(sec);
    }
    this.timer.sync(430, HUD_ROW.y, 96, HUD_ROW.h, this.clock);
    this.banner.root.visible = s.time < 2.4 && s.spotted === 0 && s.state === 'fly';
    if (this.banner.root.visible) {
      const a = clamp(Math.min(s.time * 4, (2.4 - s.time) * 2), 0, 1);
      this.banner.root.alpha = a;
      this.banner.card.y = 100 - (rm ? 0 : (1 - a) * 14);
    }
    const tx = m.target.x - s.camX;
    const ty = m.target.y - s.camY;
    this.arrow.root.visible = tx < -40 || tx > VIEW_W + 40 || ty < -40 || ty > VIEW_H + 40;
    if (this.arrow.root.visible) this.arrow.sync(m.target, s.camX, s.camY, t, rm, 210, 170);
    this.prompt.visible = s.ctx.tutorial && s.tutStep < 3 && s.state === 'fly';
    if (this.prompt.visible) {
      const w = tr().flight;
      this.prompt.sync(VIEW_W / 2, FLIGHT_HUD.tutY, FLIGHT_HUD.tutH,
        s.tutStep === 0 ? w.tutDrag : s.tutStep === 1 ? w.tutRelease : w.tutHold,
        24, s.tutStep === 0 ? 'drag' : s.tutStep === 1 ? 'release' : 'hold', t, rm, 510);
    }
    this.zib.sync(s.zibText, s.state === 'spotted' ? 0 : s.zibT, t, rm);
    this.spotted.root.visible = s.state === 'spotted';
    if (this.spotted.root.visible) this.spotted.sync(s.st, t, rm, s.shout, s.caption, s.spotted + 1);
  }
}


class TutorialSpotted {
  readonly root = new Container();
  private readonly flash = plate('#ffffff');
  private readonly witness = paintedSprite('pyjamas', 480, 620, paintPyjamaHuman);
  private readonly shout = new Label(SHOUT);
  private readonly speech = new Graphics();
  private readonly stamp = new Container();
  private readonly caption = new Paragraph(CAPTION);
  private readonly count = new Label(COUNT);
  private readonly retry = new Container();
  private readonly tap: Label;
  private cachedCaption = '';
  private cachedShout = '';
  private cachedCount = 0;

  constructor() {
    const tap = tr().flight.tapRetry;
    const w = Math.min(VIEW_W - 40, measure(tap, 26, 900) + 64);
    this.tap = new Label(RETRY).set(tap, VIEW_W / 2, SPOTTED_RETRY_Y + 1, w - 40);
    this.retry.addChild(panelPath(new Graphics(), (VIEW_W - w) / 2, SPOTTED_RETRY_Y - 32, w, 64,
      { fill: C.ink, r: 32, stroke: C.mint, lineW: 3, shadow: 4 }), this.tap);
    const shade = plate('#0c061e');
    shade.alpha = 0.6;
    this.stamp.position.set(VIEW_W / 2, 220);
    this.stamp.rotation = -0.08;
    this.stamp.addChild(new Label(SPOTTED).set(tr().flight.spotted, 0, 0, VIEW_W - 60));
    this.root.addChild(shade, this.flash, this.witness, this.speech, this.shout, this.stamp, this.caption, this.count, this.retry);
  }

  sync(st: number, t: number, rm: boolean, shout: string, caption: string, count: number): void {
    this.flash.strength = Math.max(0, 1 - st / 0.14) * (rm ? 0.25 : 0.85);
    const y = 980 - (rm ? 1 : easeOutBack(st / 0.4)) * 330;
    this.witness.position.set(300 + (rm ? 0 : Math.sin(t * 18) * 1.5), y + 70);
    this.shout.y = y - 181;
    this.speech.y = y - 210;
    if (this.cachedShout !== shout) {
      this.cachedShout = shout;
      const w = Math.min(VIEW_W - 32, measure(shout, 30, 900) + 36);
      const x = Math.min(VIEW_W - w - 16, 340);
      this.shout.set(shout, x + w / 2, y - 181, w - 24);
      panelPath(this.speech.clear(), x, 0, w, 56, { fill: '#ffffff', r: 22, lineW: 4, shadow: 0 });
    }
    const pop = rm ? 1 : easeOutBack((st - 0.05) / 0.35);
    this.stamp.visible = pop > 0;
    this.stamp.scale.set(pop);
    this.caption.visible = this.count.visible = st > 0.3;
    if (this.cachedCaption !== caption) {
      this.cachedCaption = caption;
      this.caption.restyle(wrapLines(caption, VIEW_W - 140, 20, 700, true).length <= 3 ? CAPTION : CAPTION_SMALL)
        .setBlock(caption, 70, 302, VIEW_W - 140);
    }
    if (this.cachedCount !== count) {
      this.cachedCount = count;
      this.count.set(fmt(tr().flight.timesSpotted, { n: count }), VIEW_W / 2, 410, VIEW_W - 80);
    }
    this.retry.visible = st > 0.9;
    this.tap.alpha = rm ? 1 : 0.75 + 0.25 * Math.sin(t * 5);
  }
}

/** Centre y of the SPOTTED! retry pill (below the witness's shout bubble at rest). */
const SPOTTED_RETRY_Y = 884;

/** A startled human in striped pyjamas and a nightcap, pointing up-left. */
function paintPyjamaHuman(g: CanvasRenderingContext2D): void {
  const x = 80;
  const y = -70;
  const INK = C.ink;
  g.lineJoin = 'round';
  // body
  roundRectPath(g, x - 80, y + 30, 160, 320, 50);
  g.fillStyle = '#6f8fd8';
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = '#e8eefc';
  for (let k = -80; k < 80; k += 30) g.fillRect(x + k + 8, y + 30, 10, 320);
  g.restore();
  roundRectPath(g, x - 80, y + 30, 160, 320, 50);
  g.lineWidth = 5;
  g.strokeStyle = INK;
  g.stroke();
  // pointing arm
  const hx = x - 200;
  const hy = y - 150;
  g.lineCap = 'round';
  g.lineWidth = 44;
  g.strokeStyle = INK;
  g.beginPath();
  g.moveTo(x - 50, y + 70);
  g.lineTo(hx + 20, hy + 26);
  g.stroke();
  g.lineWidth = 36;
  g.strokeStyle = '#6f8fd8';
  g.stroke();
  g.lineWidth = 12;
  g.strokeStyle = INK;
  g.beginPath();
  g.moveTo(hx + 10, hy + 14);
  g.lineTo(hx - 26, hy - 20);
  g.stroke();
  g.lineWidth = 7;
  g.strokeStyle = '#f2c29b';
  g.stroke();
  g.beginPath();
  g.arc(hx + 14, hy + 20, 20, 0, Math.PI * 2);
  g.fillStyle = '#f2c29b';
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = INK;
  g.stroke();
  g.lineCap = 'butt';
  // head
  g.beginPath();
  g.arc(x, y - 20, 60, 0, Math.PI * 2);
  g.fillStyle = '#f2c29b';
  g.fill();
  g.lineWidth = 5;
  g.stroke();
  // nightcap
  g.beginPath();
  g.moveTo(x - 62, y - 40);
  g.quadraticCurveTo(x, y - 130, x + 64, y - 44);
  g.quadraticCurveTo(x + 120, y - 60, x + 130, y - 10);
  g.quadraticCurveTo(x + 90, y - 70, x + 40, y - 60);
  g.closePath();
  g.fillStyle = '#d94c6a';
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(x + 132, y - 6, 14, 0, Math.PI * 2);
  g.fillStyle = '#ffffff';
  g.fill();
  g.stroke();
  // eyes looking up-left
  for (const ex of [-24, 18]) {
    g.beginPath();
    g.arc(x + ex, y - 22, 18, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();
    g.lineWidth = 3;
    g.stroke();
    g.beginPath();
    g.arc(x + ex - 7, y - 29, 6, 0, Math.PI * 2);
    g.fillStyle = INK;
    g.fill();
  }
  // mouth
  g.beginPath();
  g.ellipse(x - 4, y + 18, 14, 18, 0, 0, Math.PI * 2);
  g.fillStyle = '#5a1f2a';
  g.fill();
  g.stroke();
}
