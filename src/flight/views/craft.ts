import { Container, Graphics, Sprite } from 'pixi.js';
import type { PillAsk } from './clear-of';
import type { Assets } from '../../contracts';
import { VIEW_W } from '../../contracts';
import { easeOutBack } from '../../core/fx';
import { GLOW, glowTexture, Glow } from '../../core/gfx/glow';
import { panelPath } from '../../core/gfx/shapes';
import { Label, measure } from '../../core/gfx/text';
import { tr } from '../../i18n';
import { Pilot, newPilotInput, type PilotPhase } from '../pilot';
import { DOME_R, PilotView } from '../pilot-view';
import type { EntryDef } from '../../levels/types';
import { routeAdvice } from '../../levels/route-advice';
import { HUD_ROW } from '../../ui/hud';
import { C } from '../../ui/theme';
import { artSprite } from '../../ui/views/art';
import { clamp } from '../../ui/draw';
import { drawDogFallback } from '../props';
import { FLIGHT_HUD, RING_R, SAUCER, saucerSpeed, type Saucer } from '../sim';
import { TAU, paintedSprite } from './world';
import { dashedArc, ProgressArc } from './tells';

const SIZE = FLIGHT_HUD.saucer;
const SHIELD_R = SIZE / 2 + 15;
const RIM_COUNT = 10;
/** The cockpit sits a little above the hull's centre (where the art draws its dome). */
const DOME_Y = -2;
const COLLAR_R = DOME_R + 6;
/** Rim lamps: radius and y offset, matching the art's lamp ring. */
const LAMP_R = SIZE / 2 * (58.5 / 80);
const LAMP_Y = -SIZE / 40;

export class SaucerView {
  readonly root = new Container();
  readonly shadow = new Glow(glowTexture(GLOW.dark));
  readonly groundGlow = new Glow(glowTexture(GLOW.mint), true);
  private readonly trails = new Container();
  private readonly bars: Graphics[] = [];
  private readonly aura = new Glow(glowTexture(GLOW.mint), true);
  private readonly charge = new Glow(glowTexture(GLOW.mint), true);
  private readonly core = new Glow(glowTexture(GLOW.white), true);
  private readonly body = new Container();
  private readonly squash = new Container();
  private readonly hull = new Container();
  private readonly rim: Glow[] = [];
  private readonly lamps: Graphics[] = [];
  private readonly sheen: Sprite;
  private readonly bonk = new Glow(glowTexture(GLOW.amber), true);
  private readonly shield = new Container();
  private readonly shieldHalo = new Glow(glowTexture(GLOW.mint), true);
  private readonly countdown = new ProgressArc(SHIELD_R, 5);
  private readonly pilot = new Pilot();
  private readonly pilotIn = newPilotInput();
  private readonly pilotView = new PilotView();
  private lastT = -1;
  private bonkT = 0;
  private lastStun = 0;

  constructor(assets: Assets) {
    const art = artSprite(assets, 'flight/saucer_top', SIZE, SIZE);
    // the art paints its own lamp housings; the painted hull gets small bulbs
    this.hull.addChild(art ?? paintedSprite('saucer|hull', SIZE, SIZE, paintHull));
    for (let i = 0; i < RIM_COUNT; i++) {
      const a = -Math.PI / 2 + i * TAU / RIM_COUNT;
      const x = Math.cos(a) * LAMP_R;
      const y = Math.sin(a) * LAMP_R + LAMP_Y;
      if (!art) {
        const lamp = new Graphics().circle(x, y, 3.1).fill(0xffffff).stroke({ color: C.ink, width: 1.5 });
        this.lamps.push(lamp);
        this.hull.addChild(lamp);
      }
      const light = new Glow(glowTexture(i % 2 === 0 ? GLOW.amber : GLOW.mint), true).place(x, y, 11);
      this.rim.push(light);
      this.hull.addChild(light);
    }
    // moonlight catching the top-left of the rim, then the cockpit: its dark well covers whatever
    // the hull art painted in the dome, Zib sits in it, and the glass goes over him
    this.sheen = paintedSprite('saucer|sheen', SIZE, SIZE, paintSheen);
    this.sheen.blendMode = 'add';
    const cockpit = paintedSprite('saucer|cockpit', COLLAR_R * 2 + 4, COLLAR_R * 2 + 4, paintCockpit);
    const glass = paintedSprite('saucer|glass', DOME_R * 2 + 2, DOME_R * 2 + 2, paintGlass);
    cockpit.y = glass.y = this.pilotView.root.y = DOME_Y;
    this.pilotView.root.scale.set(1.12);
    this.hull.addChild(this.sheen, cockpit, this.pilotView.root, glass, this.bonk);
    for (let i = -1; i <= 1; i++) {
      const bar = new Graphics().roundRect(-1, -2, 102, 4, 2).fill(C.mint);
      bar.position.set(-50, i * 26);
      this.bars.push(bar);
      this.trails.addChild(bar);
    }
    this.squash.addChild(this.hull);
    this.body.addChild(this.squash);
    this.shield.addChild(this.shieldHalo, new Graphics().circle(0, 0, SHIELD_R)
      .fill({ color: C.mint, alpha: 0.14 }).stroke({ color: C.mint, alpha: 0.4, width: 3 }), this.countdown.root);
    this.root.addChild(this.trails, this.aura, this.charge, this.core, this.body, this.shield);
  }

  /**
   * What the pilot should react to this frame, besides the saucer itself: the scene phase, whether
   * a detector sees the saucer, the fuse (0..1) and whether Zib is talking. Call before `sync`.
   */
  cue(phase: PilotPhase, exposed: boolean, sus: number, talking: boolean, coverEars = false): void {
    const p = this.pilotIn;
    p.phase = phase;
    p.exposed = exposed;
    p.sus = sus;
    this.pilotView.coverEars = coverEars;
    p.talking = talking;
  }

  sync(s: Saucer, t: number, rm: boolean, locking: boolean, st: number, lockK: number, wobble: number, ghost = 0, ghostMax = 1.6): void {
    const speed = Math.min(1, saucerSpeed(s) / SAUCER.maxSpeed);
    const heading = Math.atan2(s.vy, s.vx);
    const wave = rm ? 0 : Math.sin(t * 2.4);
    const bob = rm ? 0 : wave * 0.5 + 0.5;
    const dt = this.lastT < 0 ? 0 : t - this.lastT;
    this.lastT = t;
    this.shadow.place(s.x + 22 + bob * 5, s.y + 34 + bob * 7, 66 - bob * 5, 58 - bob * 5, 0.7);
    this.groundGlow.place(s.x, s.y + 4, 86, 86, 0.2 + bob * 0.06 + lockK * 0.5);
    this.root.position.set(s.x, s.y);
    this.trails.visible = speed > 0.4 && !rm;
    if (this.trails.visible) {
      this.trails.rotation = heading + Math.PI;
      this.trails.alpha = (speed - 0.4) * 0.8;
      for (let i = 0; i < 3; i++) {
        const bar = this.bars[i]!;
        bar.x = 50;
        bar.scale.x = (40 + speed * 60 - Math.abs(i - 1) * 20) / 100;
      }
    }
    // engine halo: a soft mint ring that swells with speed and breathes while hovering
    const hum = rm ? 0 : Math.sin(t * 7.3) * 0.03;
    this.aura.place(0, 0, 74 + speed * 10, 74 + speed * 10, 0.13 + speed * 0.13 + hum);
    const a = locking ? Math.min(1, st / 0.3) : 0;
    const flick = rm ? 0 : Math.sin(t * 20) * 5;
    this.charge.place(0, 0, 80 + a * 50 + flick, 80 + a * 50 + flick, 0.75 * a);
    this.core.place(0, 0, 40 + a * 16, 40 + a * 16, 0.5 * a);
    const hover = 1 - speed;
    const scale = (1 + wave * 0.028 * hover) * (locking ? 1 - Math.min(0.15, st * 0.2) : 1);
    this.body.y = -(wave * 0.5 + 0.5) * 3 * hover;
    this.body.rotation = rm ? 0 : wobble * 0.3 + (s.stun > 0 ? Math.sin(t * 40) * 0.25 : 0);
    this.body.alpha = ghost > 0 ? rm ? 0.75 : 0.72 + 0.14 * Math.sin(t * 9) : 1;
    this.squash.rotation = heading;
    this.squash.scale.set((1 - 0.14 * speed) * scale, (1 + 0.04 * speed) * scale);
    this.hull.rotation = -heading;
    // a bonk lights the hull amber for a moment
    if (s.stun > this.lastStun + 0.01) this.bonkT = 1;
    this.lastStun = s.stun;
    this.bonkT = Math.max(0, this.bonkT - dt * 4);
    this.bonk.place(0, 0, SIZE * 0.55, SIZE * 0.55, this.bonkT * 0.6);
    this.sheen.alpha = 0.7 + (rm ? 0 : 0.2 * Math.sin(t * 1.3));
    const head = rm ? -1 : Math.floor(t * (locking ? 26 : 9)) % RIM_COUNT;
    for (let i = 0; i < RIM_COUNT; i++) {
      const back = head < 0 ? (i % 2 === 0 ? 0 : 2) : (head - i + RIM_COUNT) % RIM_COUNT;
      const light = this.rim[i]!;
      // dark lamps go to alpha 0 (an additive glow then adds nothing) rather than visible = false:
      // flipping `visible` ~18 times a second would rebuild the whole render group each time
      light.alpha = back === 0 ? 1 : back === 1 ? 0.55 : back === 2 ? 0.25 : 0;
      const lamp = this.lamps[i];
      if (lamp) lamp.tint = back === 0 ? C.amberHi : back <= 2 ? '#a7e9c8' : '#7d93b8';
    }
    this.shield.visible = ghost > 0;
    if (this.shield.visible) {
      const left = Math.min(1, ghost / ghostMax);
      this.shieldHalo.place(0, 0, SHIELD_R + 26, SHIELD_R + 26, 0.22 + 0.2 * left);
      this.countdown.sync(left);
    }
    const inp = this.pilotIn;
    inp.vx = s.vx;
    inp.vy = s.vy;
    inp.stun = s.stun;
    inp.ghost = ghost;
    if (locking) inp.phase = 'locking';
    this.pilotView.sync(this.pilot.update(dt, inp, rm), t, rm);
  }
}

/** The hull without art: brushed teal metal lit from the top left, seams, a rim band and lamp housings. */
function paintHull(g: CanvasRenderingContext2D, w: number): void {
  const r = w / 2 - 2;
  const metal = g.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, 0, 0, r);
  metal.addColorStop(0, '#9fe6c6');
  metal.addColorStop(0.45, '#5fae9a');
  metal.addColorStop(0.85, '#3b7a78');
  metal.addColorStop(1, '#24525a');
  g.lineJoin = 'round';
  g.beginPath();
  g.arc(0, 0, r, 0, TAU);
  g.fillStyle = metal;
  g.fill();
  // the rim band
  g.beginPath();
  g.arc(0, 0, r, 0, TAU);
  g.arc(0, 0, r * 0.84, 0, TAU, true);
  g.fillStyle = 'rgba(20,40,52,0.28)';
  g.fill();
  // panel seams and rivets
  g.strokeStyle = 'rgba(27,20,51,0.35)';
  g.lineWidth = 1.2;
  for (let i = 0; i < RIM_COUNT; i++) {
    const a = -Math.PI / 2 + (i + 0.5) * TAU / RIM_COUNT;
    g.beginPath();
    g.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62);
    g.lineTo(Math.cos(a) * r * 0.96, Math.sin(a) * r * 0.96);
    g.stroke();
    g.fillStyle = 'rgba(216,255,223,0.5)';
    g.beginPath();
    g.arc(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, 1.1, 0, TAU);
    g.fill();
  }
  g.beginPath();
  g.arc(0, 0, r * 0.84, 0, TAU);
  g.strokeStyle = 'rgba(27,20,51,0.45)';
  g.lineWidth = 1.5;
  g.stroke();
  // lamp housings
  for (let i = 0; i < RIM_COUNT; i++) {
    const a = -Math.PI / 2 + i * TAU / RIM_COUNT;
    g.beginPath();
    g.arc(Math.cos(a) * LAMP_R, Math.sin(a) * LAMP_R + LAMP_Y, 4.6, 0, TAU);
    g.fillStyle = '#1e3f47';
    g.fill();
  }
  // shade on the bottom right, under the lip
  g.beginPath();
  g.arc(0, 0, r, -0.1, Math.PI * 0.95);
  g.arc(r * 0.06, r * 0.08, r * 0.95, Math.PI * 0.95, -0.1, true);
  g.closePath();
  g.fillStyle = 'rgba(12,20,40,0.35)';
  g.fill();
  g.beginPath();
  g.arc(0, 0, r, 0, TAU);
  g.strokeStyle = C.ink;
  g.lineWidth = 3.5;
  g.stroke();
}

/** Additive moonlight along the top-left of the rim, plus a fainter bounce on the far side. */
function paintSheen(g: CanvasRenderingContext2D, w: number): void {
  const r = w / 2 - 4.5;
  g.lineCap = 'round';
  const arc = (a0: number, a1: number, width: number, color: string): void => {
    g.beginPath();
    g.arc(0, 0, r, a0, a1);
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  };
  arc(Math.PI * 1.02, Math.PI * 1.42, 4, 'rgba(216,255,235,0.5)');
  arc(Math.PI * 1.1, Math.PI * 1.32, 2, 'rgba(255,255,255,0.75)');
  arc(Math.PI * 0.12, Math.PI * 0.36, 2.5, 'rgba(124,255,203,0.3)');
}

/** The cockpit well: a raised collar and a dark interior with a little dashboard. */
function paintCockpit(g: CanvasRenderingContext2D): void {
  const R = COLLAR_R;
  const collar = g.createLinearGradient(-R, -R, R, R);
  collar.addColorStop(0, '#7cc9b0');
  collar.addColorStop(1, '#2f6467');
  g.beginPath();
  g.arc(0, 0, R, 0, TAU);
  g.fillStyle = collar;
  g.fill();
  g.strokeStyle = C.ink;
  g.lineWidth = 3;
  g.stroke();
  const well = g.createRadialGradient(0, -DOME_R * 0.3, DOME_R * 0.2, 0, 0, DOME_R);
  well.addColorStop(0, '#2c5f63');
  well.addColorStop(1, '#10282f');
  g.beginPath();
  g.arc(0, 0, DOME_R, 0, TAU);
  g.fillStyle = well;
  g.fill();
  g.strokeStyle = C.ink;
  g.lineWidth = 2;
  g.stroke();
  // dashboard along the bottom of the well, with a few lit buttons
  g.save();
  g.beginPath();
  g.arc(0, 0, DOME_R - 1, 0, TAU);
  g.clip();
  g.fillStyle = '#1b2f45';
  g.fillRect(-DOME_R, DOME_R * 0.55, DOME_R * 2, DOME_R);
  g.fillStyle = '#2d4664';
  g.fillRect(-DOME_R, DOME_R * 0.55, DOME_R * 2, 2);
  const dots: [number, string][] = [[-17, '#FFD27A'], [-12, '#7CFFCB'], [12, '#FF5D73'], [17, '#7CFFCB']];
  for (const [x, c] of dots) {
    g.beginPath();
    g.arc(x, DOME_R * 0.72, 1.6, 0, TAU);
    g.fillStyle = c;
    g.fill();
  }
  g.restore();
}

/** Cockpit glass: a faint mint tint thickening to the edge, a bright curved highlight and a glint. */
function paintGlass(g: CanvasRenderingContext2D): void {
  const R = DOME_R;
  const tint = g.createRadialGradient(-R * 0.25, -R * 0.3, R * 0.2, 0, 0, R);
  tint.addColorStop(0, 'rgba(124,255,203,0.03)');
  tint.addColorStop(0.75, 'rgba(124,255,203,0.1)');
  tint.addColorStop(1, 'rgba(160,255,220,0.32)');
  g.beginPath();
  g.arc(0, 0, R, 0, TAU);
  g.fillStyle = tint;
  g.fill();
  g.lineCap = 'round';
  g.beginPath();
  g.arc(0, 0, R * 0.8, Math.PI * 1.08, Math.PI * 1.42);
  g.strokeStyle = 'rgba(255,255,255,0.6)';
  g.lineWidth = 3.5;
  g.stroke();
  g.beginPath();
  g.arc(0, 0, R * 0.8, Math.PI * 1.5, Math.PI * 1.56);
  g.stroke();
  g.beginPath();
  g.arc(R * 0.42, R * 0.5, 2, 0, TAU);
  g.fillStyle = 'rgba(255,255,255,0.4)';
  g.fill();
  g.beginPath();
  g.arc(0, 0, R, 0, TAU);
  g.strokeStyle = 'rgba(216,255,235,0.55)';
  g.lineWidth = 1.2;
  g.stroke();
}

const ROUTE = { size: 19, weight: 800, color: C.mint, align: 'left' } as const;
const EASY = { ...ROUTE, color: C.text } as const;
const HARD = { ...ROUTE, color: C.amberHi } as const;

/** v4 council: route pill centre to ring centre, vertically. */
const PILL_GAP = RING_R + 34;
/** v4 council: half the side of the square a route pill keeps clear around each entry ring (the ring, its pulse and some air). */
export const RING_CLEAR = RING_R + 8;

export class EntryRingView {
  readonly root = new Container();
  private readonly spin = new Container();
  private readonly tintDisc = new Graphics().circle(0, 0, RING_R).fill(C.mint);
  private readonly art: Sprite | Graphics;
  private readonly progress = new Container();
  private readonly arc = new ProgressArc(RING_R + 10, 10);
  private readonly spark = new Glow(glowTexture(GLOW.white), true);
  private readonly pill = new Container();
  private readonly labelW: number;

  constructor(assets: Assets, private readonly entry: EntryDef) {
    this.root.position.set(entry.x, entry.y);
    this.art = artSprite(assets, 'flight/entry_ring', RING_R * 2, RING_R * 2) ??
      dashedArc(new Graphics(), RING_R - 4, 0, TAU, 16, 10).stroke({ color: C.mint, width: 6 })
        .circle(0, 0, RING_R * 0.55).stroke({ color: C.mint, width: 2 });
    this.tintDisc.blendMode = 'add';
    this.spin.addChild(this.tintDisc, this.art);
    this.progress.addChild(new Graphics().circle(0, 0, RING_R + 10).stroke({ color: 'rgba(27,20,51,0.55)', width: 10 }), this.arc.root, this.spark);
    const words = tr().routes[entry.roomId];
    const route = words.route + tr().flight.entrySep;
    const advice = routeAdvice(entry.roomId);
    const routeW = measure(route, 19, 800);
    this.labelW = routeW + measure(advice, 19, 800) + 28;
    const calm = entry.recommended ?? /easy|safe|short/.test(entry.difficulty);
    this.pill.addChild(panelPath(new Graphics(), 0, -20, this.labelW, 40,
      { fill: 'rgba(27,20,51,0.9)', r: 20, stroke: C.mint, lineW: 2, shadow: 0 }),
      new Label(ROUTE).set(route, 14, 1), new Label(calm ? EASY : HARD).set(advice, 14 + routeW, 1));
    this.pill.y = (entry.labelSide === 'above' ? -1 : 1) * PILL_GAP;
    this.root.addChild(this.spin, this.progress, this.pill);
  }

  sync(i: number, t: number, rm: boolean, active: boolean, fraction: number, locked: boolean, st: number, camX: number): void {
    const snap = locked ? rm ? 1 : easeOutBack(st / 0.28) : 0;
    this.spin.scale.set((rm ? 1 : 1 + Math.sin(t * 3 + i) * 0.05) * (1 - 0.24 * snap));
    this.tintDisc.alpha = locked ? 0.42 : active ? 0.28 : 0.12;
    this.art.rotation = rm ? 0 : t * 0.7 + (locked ? st * 5 : 0);
    this.progress.visible = active && fraction > 0 && !locked;
    if (this.progress.visible) {
      this.arc.sync(fraction);
      const a = -Math.PI / 2 + TAU * fraction;
      this.spark.place(Math.cos(a) * (RING_R + 10), Math.sin(a) * (RING_R + 10), 16, 16, 0.9);
    }
    this.pill.x = clamp(this.entry.x - this.labelW / 2, camX + 8, camX + VIEW_W - 8 - this.labelW) - this.entry.x;
    this.pill.y = (this.entry.labelSide === 'above' ? -1 : 1) * PILL_GAP;
  }

  /** v4 council: what the route pill wants this frame, in screen space (see `placePills`). Call after `sync`. */
  ask(camX: number, camY: number, a: PillAsk): void {
    a.x = this.entry.x + this.pill.x - camX;
    a.ringX = this.entry.x - camX;
    a.ringY = this.entry.y - camY;
    a.reach = RING_R;
    a.gap = PILL_GAP;
    a.side = this.entry.labelSide === 'above' ? -1 : 1;
    a.w = this.labelW;
    a.h = 40;
    a.top = HUD_ROW.y + HUD_ROW.h + 2;
  }

  /** v4 council: puts the route pill's top-left corner at screen (x, y). */
  putPill(x: number, y: number, camX: number, camY: number): void {
    this.pill.position.set(x + camX - this.entry.x, y + 20 + camY - this.entry.y);
  }

  showPill(visible: boolean): void {
    this.pill.visible = visible;
  }


}

export class DogView {
  readonly root = new Container();
  private readonly ear: Graphics | null;

  constructor(assets: Assets, private readonly x: number, y: number) {
    this.root.position.set(x, y);
    const art = artSprite(assets, 'flight/dog_top');
    this.root.addChild(art ?? paintedSprite('dog', 70, 70, drawDogFallback));
    this.ear = art ? new Graphics().moveTo(-6, 4).quadraticCurveTo(-4, -3, 3, -1).lineTo(6, 12)
      .quadraticCurveTo(4, 23, -2, 18).closePath().fill('#895e55').stroke({ color: C.ink, width: 2.5 }) : null;
    if (this.ear) {
      this.ear.position.set(-10, -6);
      this.root.addChild(this.ear);
    }
  }

  sync(t: number, rm: boolean, barking: boolean): void {
    const breath = rm ? 0 : Math.sin(t * 2.2);
    this.root.scale.set(1 + breath * 0.035, 1 + breath * 0.022);
    if (!this.ear) return;
    const cycle = (t + this.x * 0.013) % 3.4;
    const twitch = rm ? 0 : barking ? Math.sin(t * 24) * 0.32 :
      cycle < 0.4 ? Math.sin(cycle / 0.4 * Math.PI * 3) * 0.45 : 0;
    // alpha, not visible: the ear blinks in and out, and a visible flip rebuilds the render group
    this.ear.alpha = twitch !== 0 ? 1 : 0;
    this.ear.rotation = twitch;
  }
}
