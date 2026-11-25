import { Container, Graphics, TilingSprite } from 'pixi.js';
import { VIEW_H, VIEW_W, type Assets } from '../../contracts';
import { GLOW, Glow, glowTexture } from '../../core/gfx/glow';
import { Label } from '../../core/gfx/text';
import { paintedTexture } from '../../core/gfx/textures';
import { fmt, tr } from '../../i18n';
import { C } from '../../ui/theme';
import { artSprite, artTex } from '../../ui/views/art';
import { CrestValleyClockHands } from '../../ui/views/crest-valley-clock';
import { HudPanel } from '../../ui/views/hud';
import { TIME_CAR, type TimeCar } from '../time-car';
import { CrestValleyPerson } from './crest-valley-person';
import { CrestValleyStrike, TOWER_CLOCK, TOWER_ROD } from './crest-valley-strike';
import { arc } from './tells';
import type { CameraView } from './world';

const INK = '#232437';
const STEEL = '#a7b7ce';
const GLASS = '#416176';
const LIGHT = '#ffedc9';
const SECTIONS = 12;
const CHIP = { size: 14, weight: 900, color: C.amberHi } as const;
const TITLE = { size: 16, weight: 900, color: INK } as const;
const CAR_KEY = 'flight/pickup_time_car';

export function timeCarWedge(raised = false): Graphics {
  const g = new Graphics()
    .roundRect(-39, -55, 78, 132, 14).fill(INK)
    .poly([-31, -78, 31, -78, 38, -46, 34, 69, 25, 79, -25, 79, -34, 69, -38, -46])
    .fill(STEEL).stroke({ color: INK, width: 4 })
    .poly([-30, -45, 30, -45, 22, -18, -22, -18]).fill(GLASS)
    .poly([-22, 12, 22, 12, 29, 36, -29, 36]).fill(GLASS)
    .moveTo(-30, -45).lineTo(-35, 51).moveTo(30, -45).lineTo(35, 51)
    .stroke({ color: '#dae2eb', width: 2 })
    .roundRect(-29, 40, 21, 30, 4).roundRect(8, 40, 21, 30, 4).fill('#303440')
    .rect(-28, -73, 18, 7).rect(10, -73, 18, 7).fill(LIGHT)
    .rect(-27, 72, 14, 5).rect(13, 72, 14, 5).fill('#e45c5d')
    .moveTo(0, 57).lineTo(0, 83).lineTo(6, 83).stroke({ color: '#d2dbe2', width: 3 });
  for (let i = 0; i < 4; i++) g.rect(-26, 45 + i * 6, 15, 2).rect(11, 45 + i * 6, 15, 2).fill('#556776');
  if (raised) {
    g.poly([-5, -16, -47, -28, -46, 9, -5, 12]).fill(STEEL).stroke({ color: INK, width: 3 })
      .poly([-10, -12, -39, -21, -38, 3, -10, 7]).fill(GLASS);
  }
  return g;
}

const carCoils = () => new Graphics().moveTo(-35, -22).lineTo(-42, 17).lineTo(-37, 55)
  .moveTo(35, -22).lineTo(42, 17).lineTo(37, 55)
  .stroke({ color: '#96cdff', width: 4, cap: 'round' });

const ARC_ANCHORS = [[-39, 46], [37, -39], [40, 25], [-38, -28], [-35, 68], [38, 63],
  [15, -78], [-20, -68], [28, 76], [-28, -46]] as const;

class CarArcs extends Container {
  private readonly arcs: Graphics[];

  constructor() {
    super();
    this.arcs = ARC_ANCHORS.map(([x, y], i) => {
      const shape = [0, 0, -7, -9, 4, -16, -5, -27, 2, -39 - (i % 3) * 8];
      const bolt = new Graphics().poly(shape, false).stroke({ color: '#538eff', width: 6, alpha: 0.7, join: 'round' })
        .poly(shape, false).stroke({ color: '#effdff', width: 2.5, join: 'round' });
      bolt.position.set(x, y);
      return this.addChild(bolt);
    });
  }

  sync(rolling: boolean, charge: number, elapsed: number, reduced: boolean): void {
    this.visible = rolling;
    if (!rolling) return;
    for (let i = 0; i < this.arcs.length; i++) {
      const bolt = this.arcs[i]!;
      const energy = Math.min(1, Math.max(0, (charge * 10 + 2 - i) / 2.3));
      bolt.visible = energy > 0 && (!reduced || i < 3);
      if (!bolt.visible) continue;
      const pulse = reduced ? 1 : 0.73 + 0.27 * Math.sin(elapsed * (18 + i * 2) + i * 1.9);
      bolt.alpha = energy * pulse * (reduced ? 0.38 : 0.8 + charge * 0.2);
      bolt.scale.set(0.5 + charge * (reduced ? 0.25 : 0.95) * pulse);
      bolt.rotation = (ARC_ANCHORS[i]![0] < 0 ? -1 : 1) * (1.1 + i % 3 * 0.32);
    }
  }
}

class TimeCarView {
  readonly root = new Container();
  private readonly lift = new Container();
  private readonly body = new Container();
  private readonly light = new Glow(glowTexture(GLOW.lamp)).place(0, -86, 48, 72, 0.55);
  private readonly beam = new Glow(glowTexture(GLOW.mint));
  private readonly coils: Container;
  private readonly arcs = new CarArcs();
  private readonly ring = new Container();
  private readonly segments: Graphics[] = [];
  private readonly chip = new Container();
  private readonly panel = new HudPanel().set(152, 29, C.amber);
  private readonly label = new Label(CHIP);
  private readonly launch: string[];
  private readonly strike: string[];

  constructor(assets: Assets, private readonly car: TimeCar) {
    this.coils = artSprite(assets, 'flight/pickup_time_car_coils') ?? carCoils();
    // The source art faces north. Only the body and its lights rotate, leaving the countdown upright.
    this.body.rotation = Math.PI / 2;
    this.body.addChild(this.light, artSprite(assets, CAR_KEY) ?? timeCarWedge(), this.coils, this.arcs);
    this.lift.addChild(this.beam, this.body);
    this.ring.addChild(new Graphics().circle(0, 0, TIME_CAR.radius)
      .fill({ color: C.mint, alpha: 0.055 }).stroke({ color: C.mint, alpha: 0.8, width: 2.5 }));
    for (let i = 0; i < SECTIONS; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / SECTIONS;
      const segment = arc(new Graphics(), TIME_CAR.radius - 7, a, a + 0.35)
        .stroke({ color: C.mint, width: 4, cap: 'round' });
      this.segments.push(segment);
      this.ring.addChild(segment);
    }
    const words = tr().crestValley;
    this.launch = Array.from({ length: 14 }, (_, n) => fmt(words.launch, { n }));
    this.strike = Array.from({ length: 8 }, (_, n) => fmt(words.strike, { n }));
    this.chip.position.set(-76, 91);
    this.chip.addChild(this.panel, this.label);
    this.root.addChild(this.lift, this.ring, this.chip);
  }

  sync(cam: CameraView, rm: boolean, toast: number): void {
    const { elapsed, position, phase, progress, speed, matchPrompt } = this.car;
    const pulling = phase === 'caught' && toast > 1.95;
    const amount = pulling ? Math.min(1, (2.4 - toast) / 0.45) : 0;
    const missAge = elapsed - TIME_CAR.strike;
    const dissolving = phase === 'missed' && missAge < 0.16;
    this.root.visible = (this.car.visible || pulling || dissolving) && cam.sees(position.x, position.y, 142);
    if (!this.root.visible) return;
    this.root.position.set(position.x, position.y);
    this.lift.scale.set(rm ? 1 : 1 - amount * 0.56);
    this.lift.y = rm ? 0 : -75 * amount;
    this.lift.alpha = dissolving ? 1 - Math.max(0, (missAge - 0.035) / 0.125) : pulling ? 1 - amount : 1;
    this.beam.place(0, 0, 100, 115, pulling ? 0.85 : 0);
    this.coils.alpha = speed === 0 ? Math.min(0.35, Math.max(0, (elapsed - 9) * 0.1)) : 0.22 + Math.min(0.72, speed / 360);
    this.arcs.sync(phase === 'rolling' || phase === 'open' || dissolving, this.car.charge, elapsed, rm);
    this.chip.visible = this.car.visible;
    this.ring.visible = phase === 'open';
    if (this.chip.visible) {
      this.chip.x = Math.max(cam.x + 8 - position.x, Math.min(-76, cam.x + VIEW_W - 160 - position.x));
      const count = Math.max(0, Math.ceil((phase === 'parked' ? TIME_CAR.launch : TIME_CAR.strike) - elapsed));
      const text = matchPrompt ? tr().crestValley.match : (phase === 'parked' ? this.launch[count] : this.strike[count]);
      this.label.set(text ?? '', 76, 14, 142);
    }
    if (this.ring.visible) {
      for (let i = 0; i < SECTIONS; i++) this.segments[i]!.alpha = Math.max(0, Math.min(1, progress * SECTIONS - i));
    }
  }
}

/** World-anchored spectacle and a screen-space rain plate. Neither creates a detector. */
export class CrestValleyView {
  readonly ground = new Container();
  readonly scenery = new Container();
  readonly weather = new Container();
  readonly car: TimeCarView;
  readonly strike: CrestValleyStrike;
  private readonly clockHands = new CrestValleyClockHands(0, 0);
  private readonly warning = new Glow(glowTexture(GLOW.lamp));
  private readonly contact = new Glow(glowTexture(GLOW.lamp));
  private readonly rain: TilingSprite;
  private readonly people: CrestValleyPerson[];

  constructor(assets: Assets, private readonly timeCar: TimeCar) {
    this.car = new TimeCarView(assets, timeCar);
    this.strike = new CrestValleyStrike(assets, timeCar);
    const clock = new Container();
    clock.position.set(TOWER_CLOCK.x, TOWER_CLOCK.y);
    if (!artTex(assets, 'flight/courthouse55_top')) {
      const face = new Graphics().circle(0, 0, 41).fill(LIGHT).stroke({ color: INK, width: 4 });
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        face.circle(34 * Math.cos(a), 34 * Math.sin(a), i % 3 === 0 ? 2.8 : 1.6).fill(INK);
      }
      clock.addChild(face);
    }
    clock.addChild(this.strike.dial, this.clockHands);
    const line = new Graphics().moveTo(TOWER_ROD.x, TOWER_ROD.y).quadraticCurveTo(858, 204, 872, 232)
      .quadraticCurveTo(897, 370, TIME_CAR.cable.x, TIME_CAR.cable.north)
      .stroke({ color: INK, width: 4 });
    const words = tr().crestValley;
    const marquee = new Container();
    marquee.position.set(1370, 956);
    if (!artTex(assets, 'flight/picture_house55_top')) {
      marquee.addChild(new Graphics().roundRect(-74, -16, 148, 32, 4).fill(LIGHT).stroke({ color: INK, width: 2 }));
    }
    marquee.addChild(new Label(TITLE).set(words.marquee, 0, 0, 138));
    // Hang from the eave, above the door and the side wall.
    const banner = new Container();
    banner.addChild(artSprite(assets, 'flight/dance_banner55') ?? new Graphics()
      .roundRect(-112, -24, 224, 48, 6).fill('#cfb69d').stroke({ color: INK, width: 2 }));
    banner.position.set(1380, 1353);
    banner.addChild(new Label(TITLE).set(words.dance, 0, 0, 183));
    this.people = [
      new CrestValleyPerson(assets, false, 1060, 1973),
      new CrestValleyPerson(assets, false, 1263, 1017),
      new CrestValleyPerson(assets, false, 555, 1128),
      new CrestValleyPerson(assets, true, 1323, 1469),
      new CrestValleyPerson(assets, true, 1474, 1479, true),
    ];
    this.scenery.addChild(line, clock, marquee, banner);
    for (const person of this.people) this.scenery.addChild(person.root);
    this.scenery.addChild(this.warning, this.contact);
    const { x, y } = TIME_CAR.turnout;
    const turnout = new Graphics().moveTo(x, y + 29).lineTo(x, y - 17).quadraticCurveTo(x, y - 35, x + 22, y - 35)
      .lineTo(x + 48, y - 35).moveTo(x + 36, y - 47).lineTo(x + 48, y - 35).lineTo(x + 36, y - 23)
      .stroke({ color: '#d9bea0', width: 5, cap: 'round', alpha: 0.58 });
    this.ground.addChild(turnout, this.strike.ground);
    const rainArt = artTex(assets, 'flight/rain_stitch55') ?? paintedTexture('crest-valley|rain', 144, 144, g => {
      g.strokeStyle = '#90acc4';
      g.lineWidth = 1.5;
      g.beginPath();
      for (const [x, y] of [[18, 12], [82, 30], [126, 56], [55, 92], [14, 120], [116, 112]]) {
        g.moveTo(x!, y!);
        g.lineTo(x! - 5, y! + 12);
      }
      g.stroke();
    });
    this.rain = new TilingSprite({ texture: rainArt, width: VIEW_W, height: VIEW_H });
    const cloud = artSprite(assets, 'flight/storm_cloud55') ?? new Glow(glowTexture(GLOW.cold)).place(0, 0, 290, 90, 0.28);
    cloud.position.set(VIEW_W / 2, 80);
    cloud.alpha = 0.19;
    this.weather.addChild(cloud, this.rain, this.strike.screen);
  }

  sync(cam: CameraView, time: number, rm: boolean, toast: number): void {
    const elapsed = this.timeCar.elapsed;
    this.clockHands.sync(elapsed);
    for (const person of this.people) person.sync(cam, time, rm);
    const age = this.strike.age;
    const warning = age >= -2 && age < 0 ? (rm ? 0.48 : 0.42 + 0.18 * Math.sin(elapsed * 12)) : 0;
    this.warning.place(TOWER_ROD.x, TOWER_ROD.y, 95, 110, warning);
    this.contact.place(TIME_CAR.cable.x, TIME_CAR.cable.south, 66, 60, warning);
    this.strike.sync(cam, rm);
    this.rain.alpha = Math.min(0.35, 0.1 + Math.max(0, elapsed - 8) * 0.04);
    this.rain.tilePosition.set(rm ? 0 : -elapsed * 36, rm ? 0 : elapsed * 195);
    this.car.sync(cam, rm, toast);
  }
}

/** Front-left exhibit fallback, painted once at the requested trophy size. */
export function paintTimeCarDisplay(g: CanvasRenderingContext2D, w: number, h: number): void {
  g.save();
  g.scale(w / 320, h / 200);
  const polygon = (color: string, points: readonly number[]) => {
    g.beginPath();
    g.moveTo(points[0]!, points[1]!);
    for (let i = 2; i < points.length; i += 2) g.lineTo(points[i]!, points[i + 1]!);
    g.closePath();
    g.fillStyle = color;
    g.fill();
    g.strokeStyle = INK;
    g.lineJoin = 'round';
    g.lineWidth = 4;
    g.stroke();
  };
  for (const [x, y] of [[91, 145], [249, 131]] as const) {
    g.beginPath();
    g.ellipse(x, y, 29, 35, -0.2, 0, Math.PI * 2);
    g.fillStyle = INK;
    g.fill();
    g.beginPath();
    g.ellipse(x, y, 16, 22, -0.2, 0, Math.PI * 2);
    g.fillStyle = '#c8d0d7';
    g.fill();
  }
  polygon('#8a9aa8', [15, 128, 86, 84, 153, 77, 219, 49, 283, 57, 306, 105, 279, 137, 225, 137, 183, 155, 101, 151, 73, 161, 16, 152]);
  polygon(STEEL, [18, 128, 86, 84, 158, 79, 211, 76, 177, 108, 106, 132, 54, 142]);
  polygon(GLASS, [99, 85, 139, 62, 215, 62, 185, 90, 150, 101]);
  polygon('#303440', [183, 110, 228, 76, 276, 75, 297, 103, 260, 113]);
  polygon(STEEL, [167, 85, 161, 36, 203, 15, 253, 24, 235, 60, 198, 82]);
  polygon(GLASS, [175, 71, 172, 40, 205, 24, 240, 30, 224, 55]);
  polygon('#f7e2b3', [19, 129, 49, 135, 46, 145, 19, 141]);
  polygon('#f7e2b3', [55, 137, 91, 130, 90, 141, 56, 148]);
  g.restore();
}
