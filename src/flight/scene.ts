import type { FlightResult, GameContext, Scene, Vec2 } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import { ART } from '../art-manifest';
import { pick, zibLine, type ZibEvent } from '../levels/humor';
import { EggCues } from './easter-eggs'; // v4 easter eggs
import { MapCollectible, mapPickupFeedback } from './collectible';
import { tr } from '../i18n';
import type { TutorialLevelDef, VehicleDef } from '../levels/types';
import { clamp } from '../ui/draw';
import { P_RING, P_SPARK, P_STAR, P_TWINKLE, PC, Particles } from '../core/fx';
import { HUD_ROW } from '../ui/hud';
import { Button } from '../ui/widgets';
import { circleSegment, pointInCircle, pointInCone, type SegHit } from './geometry';
import type { Container } from 'pixi.js';
import { ViewSlot } from '../core/gfx/scene';
import { TutorialFlightView } from './views/tutorial';
import {
  FLIGHT_HUD,
  LockOn,
  POWER_LINE,
  PathFollower,
  RING_R,
  SAUCER,
  SUSPICION,
  SuspicionMeter,
  barkRadius,
  neonOn,
  neonScramble,
  ringUnder,
  saucerSpeed,
  steerSaucer,
  suspicionMultiplier,
  type Saucer,
} from './sim';

export const LOCK_ANIM = 0.9;

interface VehicleRT {
  def: VehicleDef;
  path: PathFollower;
  coneAngle: number;
  ox: number;
  oy: number;
  phase: number;
}

export interface FlightOptions {
  ctx: GameContext;
  level: TutorialLevelDef;
  /** Times already spotted this level attempt (carried across restarts). */
  spotted: number;
  onLocked(result: FlightResult): void;
  onQuit(): void;
}

export class FlightScene implements Scene {
  /** For debug hooks / tests. */
  state: 'fly' | 'spotted' | 'locking' = 'fly';
  readonly ctx: GameContext;
  readonly level: TutorialLevelDef;
  spotted: number;
  readonly saucer: Saucer = { x: 0, y: 0, vx: 0, vy: 0, stun: 0 };
  readonly sus = new SuspicionMeter();
  readonly lock = new LockOn();
  readonly collectible: MapCollectible | null;
  collectibleToastT = 0;
  vehicles: VehicleRT[] = [];
  private readonly ringPts: Vec2[];
  private readonly hit: SegHit = { nx: 0, ny: 0, depth: 0 };
  readonly lineFlash: number[];
  readonly quit = new Button(14, HUD_ROW.y, 64, HUD_ROW.h, '', 'ghost', 30);
  /** Lock-on burst and bump sparks (world space). */
  readonly fx = new Particles(64);
  exposed = false;
  private meterFlash = 0;
  readonly speckles: Float32Array;
  /** Wooden poles to draw: unique power-line ends that are not already a streetlight. */
  readonly poles: [number, number][] = [];

  camX = 0;
  camY = 0;
  time = 0;
  st = 0;
  hazT = 0;
  shake = 0;
  private bumpCd = 0;
  private barkT = 0;
  private alertT = 0;
  zibText = '';
  zibT = 0;
  private zibCd = 0;
  private zibN = 0;
  private inCone = false;
  inBark = false;
  private inNeon = false;
  private wasHighSus = false;
  private saidNearRing = false;
  tutStep = 0;
  private dragDist = 0;
  lockedRing = -1;
  private done = false;
  caption = '';
  shout = '';
  steerWobble = 0;

  private readonly look = new ViewSlot(() => new TutorialFlightView(this));
  private readonly eggs: EggCues; // v4 easter eggs

  constructor(private readonly opts: FlightOptions) {
    this.ctx = opts.ctx;
    this.level = opts.level;
    this.collectible = this.level.map.collectible ? new MapCollectible(this.level.map.collectible) : null;
    this.eggs = new EggCues(this.level.map.props, this); // v4 easter eggs
    this.spotted = opts.spotted;
    this.ringPts = this.level.map.entries.map((e) => ({ x: e.x, y: e.y }));
    this.lineFlash = this.level.map.powerLines.map(() => 0);
    for (const l of this.level.map.powerLines) {
      for (const [px, py] of [
        [l.ax, l.ay],
        [l.bx, l.by],
      ] as const) {
        const near = (x: number, y: number): boolean => Math.hypot(px - x, py - y) < 8;
        if (this.poles.some(([x, y]) => near(x, y))) continue;
        if (this.level.map.props.some((p) => p.kind === 'streetlight' && near(p.x, p.y))) continue;
        this.poles.push([px, py]);
      }
    }
    // ground speckles for the no-art fallback (generated once)
    const m = this.level.map;
    let seed = m.theme === 'farm' ? 7 : 11;
    const rnd = (): number => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    this.speckles = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i++) {
      this.speckles[i * 3] = rnd() * m.w;
      this.speckles[i * 3 + 1] = rnd() * m.h;
      this.speckles[i * 3 + 2] = 2 + rnd() * 5;
    }
    this.reset(false);
  }

  get suspicion(): number {
    return this.sus.value;
  }

  private reset(respawn: boolean): void {
    const m = this.level.map;
    this.saucer.x = m.start.x;
    this.saucer.y = m.start.y;
    this.saucer.vx = 0;
    this.saucer.vy = 0;
    this.saucer.stun = 0;
    this.sus.reset();
    this.lock.reset();
    this.collectible?.resetHover();
    this.collectibleToastT = 0;
    this.vehicles = m.vehicles.map((def, i) => ({
      def,
      path: new PathFollower(def.path, def.speed, def.dwell),
      coneAngle: 0,
      ox: 0,
      oy: 0,
      phase: i * 1.7,
    }));
    this.updateVehicles(0);
    this.time = 0;
    this.st = 0;
    this.state = 'fly';
    this.inCone = this.inBark = this.inNeon = false;
    this.wasHighSus = false;
    this.saidNearRing = false;
    this.lockedRing = -1;
    this.snapCamera();
    if (respawn) this.say('respawn', true);
  }

  private snapCamera(): void {
    const s = this.saucer;
    const m = this.level.map;
    this.camX = clamp(s.x - VIEW_W / 2, 0, m.w - VIEW_W);
    this.camY = clamp(s.y - VIEW_H * FLIGHT_HUD.camFrac, 0, m.h - VIEW_H);
  }

  private say(evt: ZibEvent, force = false): void {
    if (!force && this.zibCd > 0) return;
    this.zibText = zibLine(evt, this.zibN++ + (evt.length % 2));
    this.zibT = 2.8;
    this.zibCd = 3.4;
    this.ctx.audio.speak?.(this.zibText, 'zib'); // v4 voices
  }

  /** v4 easter eggs: a scenery line, said like any other. */
  private sayLine(text: string): void {
    this.zibText = text;
    this.zibT = 2.8;
    this.zibCd = 3.4;
    this.ctx.audio.speak?.(text, 'zib');
  }

  /** Where the saucer is on screen (the scene transition irises in on it). */
  screenFocus(): Vec2 {
    return { x: this.saucer.x - this.camX, y: this.saucer.y - this.camY };
  }

  private updateVehicles(dt: number): void {
    const t = this.hazT;
    for (const v of this.vehicles) {
      v.path.update(dt);
      const len = ART[v.def.key]?.h ?? 150;
      const h = v.path.heading;
      v.ox = v.path.x + Math.cos(h) * len * 0.45;
      v.oy = v.path.y + Math.sin(h) * len * 0.45;
      v.coneAngle = h + v.def.sweepAmp * Math.sin(t * v.def.sweepRate + v.phase);
    }
  }

  update(dt: number): void {
    const p = this.ctx.pointer;
    this.zibT = Math.max(0, this.zibT - dt);
    this.collectibleToastT = Math.max(0, this.collectibleToastT - dt);
    this.zibCd = Math.max(0, this.zibCd - dt);
    this.shake = Math.max(0, this.shake - dt * 3);
    for (let i = 0; i < this.lineFlash.length; i++) this.lineFlash[i] = Math.max(0, this.lineFlash[i]! - dt * 3);
    this.st += dt;
    this.meterFlash = Math.max(0, this.meterFlash - dt * 3);
    this.fx.update(dt);

    if (this.state === 'spotted') {
      // the card waits for a tap: reading the witness's line is part of the joke
      if (this.st > 0.9 && p.pressed) {
        this.spotted++;
        this.reset(true);
      }
      return;
    }

    if (this.quit.update(p, dt, this.ctx.audio)) {
      this.opts.onQuit();
      return;
    }

    if (this.state === 'locking') {
      const ring = this.ringPts[this.lockedRing]!;
      const k = 1 - Math.exp(-8 * dt);
      this.saucer.x += (ring.x - this.saucer.x) * k;
      this.saucer.y += (ring.y - this.saucer.y) * k;
      this.followCamera(dt);
      this.hazT += dt;
      this.updateVehicles(dt);
      const dur = this.ctx.reducedMotion ? 0.5 : LOCK_ANIM;
      if (this.st >= dur && !this.done) {
        this.done = true;
        const mapCollectible = this.collectible?.collectedId;
        this.opts.onLocked({
          roomId: this.level.map.entries[this.lockedRing]!.roomId,
          timeSec: this.time,
          spotted: this.spotted,
          ...(mapCollectible ? { mapCollectible } : {}),
        });
      }
      return;
    }

    // ---------------------------------------------------------------- fly
    this.time += dt;
    this.hazT += dt;
    if (this.time > 0.6 && this.time - dt <= 0.6 && this.spotted === 0) this.say('start');
    const s = this.saucer;
    const m = this.level.map;

    // neon scramble
    let rot = 0;
    let inNeon = false;
    for (const n of m.neons) {
      if (neonOn(this.hazT) && pointInCircle(s.x, s.y, n.x, n.y, n.r)) {
        inNeon = true;
        rot += neonScramble(this.hazT);
      }
    }
    if (inNeon && !this.inNeon) this.say('neon');
    this.inNeon = inNeon;
    this.steerWobble = rot;

    const sx = s.x - this.camX;
    const sy = s.y - this.camY;
    const pointerFree = !this.quit.pressedDown;
    const down = p.down && pointerFree;
    const before = saucerSpeed(s);
    steerSaucer(s, down, p.x - sx, p.y - sy, dt, rot);
    if (down) this.dragDist += before * dt;

    // world bounds
    const R = SAUCER.radius;
    if (s.x < R) ((s.x = R), (s.vx = Math.abs(s.vx) * 0.3));
    if (s.x > m.w - R) ((s.x = m.w - R), (s.vx = -Math.abs(s.vx) * 0.3));
    if (s.y < R) ((s.y = R), (s.vy = Math.abs(s.vy) * 0.3));
    if (s.y > m.h - R) ((s.y = m.h - R), (s.vy = -Math.abs(s.vy) * 0.3));

    // power lines
    this.bumpCd = Math.max(0, this.bumpCd - dt);
    for (let i = 0; i < m.powerLines.length; i++) {
      const l = m.powerLines[i]!;
      if (circleSegment(s.x, s.y, R * POWER_LINE.hitFrac, l.ax, l.ay, l.bx, l.by, this.hit)) {
        const h = this.hit;
        s.x += h.nx * h.depth;
        s.y += h.ny * h.depth;
        const vn = s.vx * h.nx + s.vy * h.ny;
        if (vn < 0) {
          s.vx -= 1.7 * vn * h.nx;
          s.vy -= 1.7 * vn * h.ny;
        }
        if (this.bumpCd <= 0) {
          s.stun = 0.4;
          this.bumpCd = 0.4;
          this.lineFlash[i] = 1;
          this.fx.burst(P_STAR, s.x - h.nx * R * 0.7, s.y - h.ny * R * 0.7, this.ctx.reducedMotion ? 2 : 4, 120, 260, 0.55, 11, PC.amber, 0, 2.2);
          if (!this.ctx.reducedMotion) {
            this.shake = 1;
            this.fx.burst(P_SPARK, s.x - h.nx * R * 0.7, s.y - h.ny * R * 0.7, 8, 200, 420, 0.3, 3.5, PC.white, 0, 3);
          }
          this.ctx.audio.sfx('bonk', 0.8);
          this.say('powerline', true);
        }
      }
    }

    // hazards
    this.updateVehicles(dt);
    // 1-second fuse: any detector fills the meter at the same rate; they don't stack
    let cone = false;
    for (const v of this.vehicles) {
      if (pointInCone(s.x, s.y, v.ox, v.oy, v.coneAngle, v.def.coneHalf, v.def.coneRange)) cone = true;
    }
    let bark = false;
    for (const d of m.dogs) {
      if (pointInCircle(s.x, s.y, d.x, d.y, barkRadius(this.hazT, d.rMin, d.rMax, d.period))) bark = true;
    }
    const rate = cone || bark ? SUSPICION.rate : 0;
    this.exposed = rate > 0;
    if (cone && !this.inCone) this.say('cone');
    this.barkT -= dt;
    if (bark && (!this.inBark || this.barkT <= 0)) {
      this.ctx.audio.sfx('bark', 0.8);
      this.barkT = 1.0;
      if (!this.inBark) this.say('bark');
    }
    this.inCone = cone;
    this.inBark = bark;
    this.alertT -= dt;
    if (rate > 0 && this.alertT <= 0) {
      // rising tick: louder and higher-pitched as the fuse burns down
      this.ctx.audio.sfx('alert', 0.4 + this.sus.value * 0.8);
      this.alertT = 0.2 - this.sus.value * 0.1;
    }
    if (rate <= 0) this.alertT = 0;
    this.sus.update(dt, rate, suspicionMultiplier(this.ctx.upgrades) / (m.fuseSec ?? 1));
    const high = this.sus.value > 0.7;
    if (high && !this.wasHighSus) {
      this.say('highSus', true);
      this.meterFlash = 1;
    }
    this.wasHighSus = high;
    if (this.sus.full) {
      this.state = 'spotted';
      this.st = 0;
      this.caption = pick(tr().humor.spottedCaptions, Math.random() * 1000);
      this.shout = pick(tr().humor.spottedShouts, Math.random() * 1000);
      this.ctx.audio.sfx('spotted');
      return;
    }

    // v4 easter eggs: a film cameo on the map, once per run, never over a hazard line
    const egg = this.eggs.check(s.x, s.y, this.camX, this.camY, this.zibCd <= 0 && !this.exposed && this.sus.value === 0);
    if (egg) this.sayLine(egg);

    // lock-on
    const speed = saucerSpeed(s);
    const idx = ringUnder(s.x, s.y, speed, this.ringPts, RING_R);
    if (this.collectible?.update(dt, s, speed, idx)) {
      this.collectibleToastT = mapPickupFeedback(this.ctx, this.fx, this.collectible.def);
    }
    if (idx >= 0 && !this.saidNearRing) {
      this.saidNearRing = true;
      this.say('nearRing', true);
    }
    const before01 = this.lock.fraction;
    if (this.lock.update(dt, idx)) {
      this.state = 'locking';
      this.st = 0;
      this.lockedRing = idx;
      this.ctx.audio.sfx('lock_on');
      this.ctx.audio.sfx('beam_on', 0.6);
      this.say('locked', true);
      if (this.tutStep < 3) this.tutStep = 3;
      this.lockBurst(this.ringPts[idx]!);
    } else if (idx >= 0 && Math.floor(before01 * 4) !== Math.floor(this.lock.fraction * 4)) {
      this.ctx.audio.sfx('click', 0.4);
    }

    // tutorial
    if (this.ctx.tutorial) {
      if (this.tutStep === 0 && this.dragDist > 200) this.tutStep = 1;
      if (this.tutStep === 1 && p.released) this.tutStep = 2;
      if (this.tutStep === 2 && this.lock.fraction > 0) this.tutStep = 3;
    }

    this.followCamera(dt);
  }

  /** The moment of lock-on: the ring snaps shut and throws light. */
  private lockBurst(ring: Vec2): void {
    const fx = this.fx;
    fx.spawn(P_RING, ring.x, ring.y, 0, 0, 0.55, 170, PC.mint);
    fx.spawn(P_RING, ring.x, ring.y, 0, 0, 0.36, 100, PC.white);
    if (this.ctx.reducedMotion) return;
    fx.burst(P_SPARK, ring.x, ring.y, 16, 260, 480, 0.42, 4, PC.mint, 0, 3);
    fx.burst(P_TWINKLE, ring.x, ring.y, 9, 70, 210, 0.7, 10, PC.white, 0, 2);
  }

  private followCamera(dt: number): void {
    const s = this.saucer;
    const m = this.level.map;
    const tx = clamp(s.x - VIEW_W / 2 + s.vx * 0.3, 0, m.w - VIEW_W);
    const ty = clamp(s.y - VIEW_H * FLIGHT_HUD.camFrac + s.vy * 0.3, 0, m.h - VIEW_H);
    const k = 1 - Math.exp(-5 * dt);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
  }

  get view(): Container {
    return this.look.get().root;
  }

  render(): void {
    this.look.peek()?.sync();
  }

  dispose(): void {
    this.ctx.audio.hush?.(); // v4 voices
    this.look.destroy();
  }
}
