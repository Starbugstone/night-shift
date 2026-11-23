import type { FlightResult, GameContext, Scene, Vec2 } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import { ART } from '../art-manifest';
import { SPOTTED_CAPTIONS, SPOTTED_SHOUTS, ZIB_LINES, pick, type ZibEvent } from '../levels/humor';
import type { NeonDef, PropDef, PropKind, RoadDef, TutorialLevelDef, VehicleDef } from '../levels/types';
import { clamp, drawPortrait, easeOutBack, fmtTime, outlinedText, panel, paragraph, roundRectPath, text, wrap } from '../ui/draw';
import { GLOW, P_RING, P_SPARK, P_STAR, P_TWINKLE, PC, Particles, drawEdgeTint, drawGlow, drawShadow, drawVignette, easeInCubic, radialSprite } from '../core/fx';
import { HUD_ROW, hudButton, hudFuse, hudPanel, hudPrompt, hudTimer, type FuseState } from '../ui/hud';
import { C, font } from '../ui/theme';
import { Button } from '../ui/widgets';
import { circleSegment, pointInCircle, pointInCone, type SegHit } from './geometry';
import { drawDog, drawProp, drawVehicle, propSize } from './props';
import { ConeSprites, drawEntryRing, drawSaucer as drawSaucerCommon, drawRoad as drawRoadCommon, drawJunctions as drawJunctionsCommon } from './draw-common';
import {
  DASH,
  FLIGHT_HUD,
  FlickDetector,
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
  fireDash,
  newDash,
  tickDash,
  type Saucer,
} from './sim';

const LOCK_ANIM = 0.9;
/** How far each kind of prop throws its shadow (moon top-left → shadow down-right); 0 = flat. */
const SHADOW_OFF: Partial<Record<PropKind, number>> = {
  farmhouse: 14, barn: 14, laundromat: 14, diner: 13, house: 13, tree: 13, tractor: 7, haybale: 7, streetlight: 0, field: 0,
};
const BARK_DASH = [14, 12];
const NO_DASH: number[] = [];
const CONE_R = 300;

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
  private readonly ctx: GameContext;
  private readonly level: TutorialLevelDef;
  private spotted: number;
  private readonly saucer: Saucer = { x: 0, y: 0, vx: 0, vy: 0, stun: 0 };
  private readonly sus = new SuspicionMeter();
  private readonly lock = new LockOn();
  private vehicles: VehicleRT[] = [];
  private readonly ringPts: Vec2[];
  private readonly hit: SegHit = { nx: 0, ny: 0, depth: 0 };
  private readonly lineFlash: number[];
  private readonly quit = new Button(14, HUD_ROW.y, 64, HUD_ROW.h, '', 'ghost', 30);
  /** Lock-on burst and bump sparks (world space). */
  private readonly fx = new Particles(64);
  private readonly fuse: FuseState = { value: 0, exposed: false, t: 0, reduced: false, seconds: 1 };
  private readonly flick = new FlickDetector();
  private readonly dash = newDash();
  private readonly coneSprites = new ConeSprites();
  private exposed = false;
  private meterFlash = 0;
  private clock = '0:00';
  private clockSec = -1;
  /** Per-neon letter x offsets (measured once). */
  private readonly neonX: Float32Array[] = [];
  private readonly speckles: Float32Array;
  /** Wooden poles to draw: unique power-line ends that are not already a streetlight. */
  private readonly poles: [number, number][] = [];

  private camX = 0;
  private camY = 0;
  private time = 0;
  private st = 0;
  private hazT = 0;
  private shake = 0;
  private bumpCd = 0;
  private barkT = 0;
  private alertT = 0;
  private zibText = '';
  private zibT = 0;
  private zibCd = 0;
  private zibN = 0;
  private inCone = false;
  private inBark = false;
  private inNeon = false;
  private wasHighSus = false;
  private saidNearRing = false;
  private tutStep = 0;
  private dragDist = 0;
  private lockedRing = -1;
  private done = false;
  private caption = '';
  private shout = '';
  private steerWobble = 0;

  private coneGrad: CanvasGradient | null = null;
  private lampGlow: HTMLCanvasElement | null = null;
  private neonGlow: HTMLCanvasElement | null = null;

  constructor(private readonly opts: FlightOptions) {
    this.ctx = opts.ctx;
    this.level = opts.level;
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
    this.dash.active = 0;
    this.dash.cool = 0;
    this.flick.reset();
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
    this.zibText = pick(ZIB_LINES[evt], this.zibN++ + (evt.length % 2));
    this.zibT = 2.8;
    this.zibCd = 3.4;
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
    this.zibCd = Math.max(0, this.zibCd - dt);
    this.shake = Math.max(0, this.shake - dt * 3);
    for (let i = 0; i < this.lineFlash.length; i++) this.lineFlash[i] = Math.max(0, this.lineFlash[i]! - dt * 3);
    this.st += dt;
    this.meterFlash = Math.max(0, this.meterFlash - dt * 3);
    this.fx.update(dt);

    if (this.state === 'spotted') {
      if ((this.st > 0.9 && p.pressed) || this.st > 3.4) {
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
        this.opts.onLocked({ roomId: this.level.map.entries[this.lockedRing]!.roomId, timeSec: this.time, spotted: this.spotted });
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
    if (this.ctx.upgrades.has('afterburner')) {
      const fs = this.flick.push(down, p.pressed, p.x, p.y, this.time);
      if (fs >= DASH.flickSpeed && s.stun <= 0 && fireDash(this.dash, this.flick.dx, this.flick.dy)) {
        this.ctx.audio.sfx('dash');
        if (!this.ctx.reducedMotion) this.fx.burst(P_SPARK, s.x, s.y, 10, 160, 320, 0.3, 4, PC.amber, 0, 3);
      }
    }
    const dashing = this.dash.active > 0;
    tickDash(this.dash, s, dt);
    steerSaucer(s, down, p.x - sx, p.y - sy, dt, rot, dashing);
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
    this.sus.update(dt, rate, suspicionMultiplier(this.ctx.upgrades));
    const high = this.sus.value > 0.7;
    if (high && !this.wasHighSus) {
      this.say('highSus', true);
      this.meterFlash = 1;
    }
    this.wasHighSus = high;
    if (this.sus.full) {
      this.state = 'spotted';
      this.st = 0;
      this.caption = pick(SPOTTED_CAPTIONS, Math.random() * 1000);
      this.shout = pick(SPOTTED_SHOUTS, Math.random() * 1000);
      this.ctx.audio.sfx('spotted');
      return;
    }

    // lock-on
    const idx = ringUnder(s.x, s.y, saucerSpeed(s), this.ringPts, RING_R);
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

  // ================================================================ render

  render(g: CanvasRenderingContext2D): void {
    const m = this.level.map;
    const assets = this.ctx.assets;
    const t = this.ctx.time;
    const rm = this.ctx.reducedMotion;
    if (!this.coneGrad) {
      this.coneGrad = g.createRadialGradient(0, 0, 8, 0, 0, 300);
      this.coneGrad.addColorStop(0, 'rgba(255,244,190,0.62)');
      this.coneGrad.addColorStop(0.7, 'rgba(255,230,150,0.25)');
      this.coneGrad.addColorStop(1, 'rgba(255,230,150,0)');
      this.lampGlow = radialSprite('flight-lamp', [
        [0, 'rgba(255,200,110,0.45)'],
        [1, 'rgba(255,200,110,0)'],
      ]);
      this.neonGlow = radialSprite('flight-neon', [
        [0, 'rgba(255,90,200,0.5)'],
        [0.75, 'rgba(255,90,200,0.16)'],
        [1, 'rgba(255,90,200,0)'],
      ]);
    }
    const shx = this.shake > 0 ? Math.sin(t * 80) * 7 * this.shake : 0;
    const shy = this.shake > 0 ? Math.cos(t * 67) * 5 * this.shake : 0;
    const cx = Math.round(this.camX * 2) / 2;
    const cy = Math.round(this.camY * 2) / 2;
    const s = this.saucer;
    const locking = this.state === 'locking';
    const lockK = locking ? Math.min(1, this.st / LOCK_ANIM) : 0;

    g.save();
    if (locking && !rm) {
      // the view dives in on the saucer while the beam charges
      const z = 1 + 0.24 * easeInCubic(lockK);
      g.translate(s.x - cx, s.y - cy);
      g.scale(z, z);
      g.translate(-(s.x - cx), -(s.y - cy));
    }
    g.translate(-cx + shx, -cy + shy);

    this.drawGround(g, cx, cy);
    for (const r of m.roads) this.drawRoad(g, r);
    this.drawJunctions(g);
    for (const p of m.groundProps) if (this.visible(p.x, p.y, 220)) drawProp(g, assets, p);

    // soft shadows first, so no shadow lands on top of a neighbouring roof
    const tgt = m.target;
    this.propShadow(g, tgt);
    for (const p of m.props) if (this.visible(p.x, p.y, 220)) this.propShadow(g, p);
    for (const v of this.vehicles) {
      const spec = ART[v.def.key];
      if (!spec) continue;
      g.save();
      g.translate(v.path.x + 7, v.path.y + 9);
      g.rotate(v.path.heading + Math.PI / 2);
      drawShadow(g, assets.get(v.def.key), spec.w, spec.h, 0.34);
      g.restore();
    }

    // target building with a soft pulse outline
    const ts = propSize(tgt);
    const pulse = rm ? 0.5 : 0.5 + 0.5 * Math.sin(t * 3);
    roundRectPath(g, tgt.x - ts.w / 2 - 10, tgt.y - ts.h / 2 - 10, ts.w + 20, ts.h + 20, 20);
    g.globalAlpha = 0.08 + 0.08 * pulse;
    g.fillStyle = C.mint;
    g.fill();
    g.globalAlpha = 1;
    drawProp(g, assets, tgt);
    for (const p of m.props) if (this.visible(p.x, p.y, 200)) drawProp(g, assets, p);
    for (const d of m.dogs) drawDog(g, assets, d.x, d.y, t, this.inBark, rm);
    for (const v of this.vehicles) {
      g.save();
      g.translate(v.path.x, v.path.y);
      g.rotate(v.path.heading + Math.PI / 2);
      drawVehicle(g, assets, v.def.key, v.def.kind);
      g.restore();
    }

    // saucer shadow on the ground: drifts and shrinks as the saucer bobs up
    const bob = rm ? 0 : Math.sin(t * 2.4) * 0.5 + 0.5;
    drawGlow(g, GLOW.dark, s.x + 22 + bob * 5, s.y + 34 + bob * 7, 66 - bob * 5, 58 - bob * 5, 0.7);

    // night wash
    g.fillStyle = 'rgba(10,8,40,0.26)';
    g.fillRect(cx - 20, cy - 20, VIEW_W + 40, VIEW_H + 40);

    // lights
    g.globalCompositeOperation = 'lighter';
    if (this.lampGlow) {
      for (const l of m.lamps) if (this.visible(l.x, l.y, 120)) g.drawImage(this.lampGlow, l.x - 100, l.y - 100, 200, 200);
    }
    if (this.neonGlow) {
      g.globalAlpha = neonOn(this.hazT) ? 1 : 0.25;
      for (const n of m.neons) if (this.visible(n.x, n.y, n.r)) g.drawImage(this.neonGlow, n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
      g.globalAlpha = 1;
    }
    for (const v of this.vehicles) {
      // feathered cone: soft at the sides, bright at the lamps
      const cone = this.coneSprite(v.def.coneHalf);
      g.save();
      g.translate(v.ox, v.oy);
      g.rotate(v.coneAngle);
      const k = v.def.coneRange / CONE_R;
      g.scale(k, k);
      if (cone) g.drawImage(cone, 0, -cone.height / 2);
      else {
        g.beginPath();
        g.moveTo(0, 0);
        g.arc(0, 0, CONE_R, -v.def.coneHalf, v.def.coneHalf);
        g.closePath();
        g.fillStyle = this.coneGrad!;
        g.fill();
      }
      g.restore();
      drawGlow(g, GLOW.warm, v.ox, v.oy, 34, 34, 0.85);
    }
    // the saucer's own glow on the ground
    drawGlow(g, GLOW.mint, s.x, s.y + 4, 86, 86, 0.2 + bob * 0.06 + lockK * 0.5);
    g.globalCompositeOperation = 'source-over';

    // neon sign itself
    for (let i = 0; i < m.neons.length; i++) this.drawNeon(g, m.neons[i]!, i);

    // bark radius
    for (const d of m.dogs) {
      const r = barkRadius(this.hazT, d.rMin, d.rMax, d.period);
      const peak = (r - d.rMin) / (d.rMax - d.rMin);
      g.beginPath();
      g.arc(d.x, d.y, r, 0, Math.PI * 2);
      g.globalAlpha = 0.06 + peak * 0.1;
      g.fillStyle = '#ff8c3c';
      g.fill();
      g.setLineDash(BARK_DASH);
      g.lineDashOffset = rm ? 0 : -t * 30;
      g.lineWidth = 4;
      g.globalAlpha = 0.35 + peak * 0.5;
      g.strokeStyle = '#ffaa5a';
      g.stroke();
      g.setLineDash(NO_DASH);
      g.globalAlpha = 1;
      if (this.inBark) outlinedText(g, 'WOOF!', d.x, d.y - 50, 26, C.amberHi, C.ink, 900);
      else if (peak > 0.85) text(g, 'woof?', d.x + 34, d.y - 34, 18, C.amberHi, 'center', 800, true);
      else {
        g.globalAlpha = 0.8;
        text(g, 'z', d.x + 28, d.y - 28 - ((t * 12) % 14), 18, C.text, 'center', 800);
        g.globalAlpha = 1;
      }
    }

    // power lines (above everything on the ground)
    // Wires sit ±wireGap around the collision segment (offset along its normal) with a small sag.
    for (let i = 0; i < m.powerLines.length; i++) {
      const l = m.powerLines[i]!;
      const len = Math.hypot(l.bx - l.ax, l.by - l.ay) || 1;
      const nx = -(l.by - l.ay) / len;
      const ny = (l.bx - l.ax) / len;
      const midx = (l.ax + l.bx) / 2;
      const midy = (l.ay + l.by) / 2 + POWER_LINE.sag;
      const flash = this.lineFlash[i]!;
      // dark wire, then a thin moonlit edge on its upper-left side so it reads before the first bonk
      for (let pass = 0; pass < 2; pass++) {
        const lift = pass === 0 ? 0 : -1.2;
        g.lineWidth = pass === 0 ? 3 : 1;
        g.strokeStyle = pass === 0 ? '#0b0818' : 'rgba(176,186,255,0.5)';
        if (flash > 0) {
          g.strokeStyle = '#fff096';
          g.globalAlpha = pass === 0 ? 0.5 + flash * 0.5 : flash;
        }
        for (let k = -1; k <= 1; k += 2) {
          const ox = nx * k * POWER_LINE.wireGap + lift;
          const oy = ny * k * POWER_LINE.wireGap + lift;
          g.beginPath();
          g.moveTo(l.ax + ox, l.ay + oy);
          g.quadraticCurveTo(midx + ox, midy + oy, l.bx + ox, l.by + oy);
          g.stroke();
        }
        g.globalAlpha = 1;
      }
    }
    for (const [px, py] of this.poles) {
      g.beginPath();
      g.arc(px, py, POWER_LINE.poleR, 0, Math.PI * 2);
      g.fillStyle = '#6b4a2e';
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = C.ink;
      g.stroke();
    }

    // entry rings
    for (let i = 0; i < m.entries.length; i++) this.drawRing(g, i, t);

    // saucer
    this.drawSaucer(g, t);
    this.fx.draw(g);

    g.restore();
    drawVignette(g, 0.9);
    if (this.state === 'fly' && this.exposed) {
      const pulse = rm ? 0.6 : 0.45 + 0.55 * Math.abs(Math.sin(t * (8 + this.sus.value * 14)));
      drawEdgeTint(g, GLOW.red, (0.45 + this.sus.value * 0.6) * pulse);
    } else if (this.state === 'fly' && this.sus.value > 0.05) drawEdgeTint(g, GLOW.red, this.sus.value * 0.35);
    if (locking) {
      drawEdgeTint(g, GLOW.mint, lockK * 0.8);
      if (this.st < 0.16) {
        g.globalAlpha = (1 - this.st / 0.16) * (rm ? 0.12 : 0.3);
        g.fillStyle = '#d9fff0';
        g.fillRect(0, 0, VIEW_W, VIEW_H);
        g.globalAlpha = 1;
      }
    }
    this.drawHud(g, t);
    if (this.state === 'spotted') this.drawSpotted(g, t);
  }

  private visible(x: number, y: number, margin: number): boolean {
    return x > this.camX - margin && x < this.camX + VIEW_W + margin && y > this.camY - margin && y < this.camY + VIEW_H + margin;
  }

  private propShadow(g: CanvasRenderingContext2D, p: PropDef): void {
    const off = SHADOW_OFF[p.kind] ?? 0;
    if (off === 0) return;
    const img = this.ctx.assets.get(p.key);
    if (!img) return;
    const { w, h } = propSize(p);
    g.save();
    g.translate(p.x + off, p.y + off * 1.15);
    if (p.rot) g.rotate(p.rot);
    drawShadow(g, img, w, h, 0.36);
    g.restore();
  }

  private coneSprite(half: number): HTMLCanvasElement | null {
    return this.coneSprites.get(half, '255,230,150');
  }

  /** Neon sign: glowing tube letters; one letter buzzes, and the whole sign drops out with the hazard. */
  private drawNeon(g: CanvasRenderingContext2D, n: NeonDef, index: number): void {
    const on = neonOn(this.hazT);
    const rm = this.ctx.reducedMotion;
    const len = n.text.length;
    g.font = font(26, 900);
    let xs = this.neonX[index];
    if (!xs) {
      // letter centres, laid out from the measured advance of each glyph
      xs = new Float32Array(len);
      let total = 0;
      for (let i = 0; i < len; i++) total += g.measureText(n.text[i]!).width + 3;
      let x = -total / 2;
      for (let i = 0; i < len; i++) {
        const w = g.measureText(n.text[i]!).width + 3;
        xs[i] = x + w / 2;
        x += w;
      }
      this.neonX[index] = xs;
    }
    panel(g, n.x - 48, n.y - 25, 96, 50, '#22102a', 12, C.ink, 3, 4);
    roundRectPath(g, n.x - 41, n.y - 18, 82, 36, 8);
    g.lineWidth = 2;
    g.strokeStyle = on ? '#ff7ad9' : '#4b2f4d';
    g.stroke();
    const buzz = rm ? -1 : Math.floor(this.hazT * 0.8) % (len + 2);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    for (let i = 0; i < len; i++) {
      const lx = n.x + xs[i]!;
      const lit = on && !(i === buzz && Math.sin(this.hazT * 63) > 0.15);
      if (lit) {
        g.globalCompositeOperation = 'lighter';
        drawGlow(g, GLOW.pink, lx, n.y, 24, 24, 0.5);
        g.globalCompositeOperation = 'source-over';
        g.lineWidth = 4;
        g.strokeStyle = '#ff4fc8';
        g.strokeText(n.text[i]!, lx, n.y + 1);
        g.fillStyle = '#ffe6f7';
      } else g.fillStyle = on ? '#8a4a80' : '#5a3a5a';
      g.fillText(n.text[i]!, lx, n.y + 1);
    }
  }

  private drawGround(g: CanvasRenderingContext2D, cx: number, cy: number): void {
    const m = this.level.map;
    const key = m.theme === 'farm' ? 'flight/ground_farm' : 'flight/ground_town';
    const img = this.ctx.assets.get(key);
    if (img) {
      const T = 540;
      const x0 = Math.floor(cx / T) * T;
      const y0 = Math.floor(cy / T) * T;
      for (let y = y0; y < cy + VIEW_H; y += T) for (let x = x0; x < cx + VIEW_W; x += T) g.drawImage(img, x, y, T + 0.5, T + 0.5);
      return;
    }
    g.fillStyle = m.theme === 'farm' ? '#2d4636' : '#2b2c4a';
    g.fillRect(cx - 20, cy - 20, VIEW_W + 40, VIEW_H + 40);
    g.fillStyle = m.theme === 'farm' ? '#355440' : '#33355a';
    const sp = this.speckles;
    for (let i = 0; i < sp.length; i += 3) {
      const x = sp[i]!;
      const y = sp[i + 1]!;
      if (x < cx - 10 || x > cx + VIEW_W + 10 || y < cy - 10 || y > cy + VIEW_H + 10) continue;
      const r = sp[i + 2]!;
      if (m.theme === 'farm') g.fillRect(x, y, r, r * 2.4);
      else g.fillRect(x, y, r * 3, r);
    }
  }

  /**
   * Farm roads are dirt: `flight/dirt_road_h` / `flight/dirt_road_v` if an art pass provides them,
   * otherwise drawn here. Town roads use the asphalt sprites.
   */
  private drawRoad(g: CanvasRenderingContext2D, r: RoadDef): void {
    drawRoadCommon(g, this.ctx.assets, r, this.level.map.theme, this.camX, this.camY);
  }

  private drawJunctions(g: CanvasRenderingContext2D): void {
    drawJunctionsCommon(g, this.level.map.roads, this.level.map.theme);
  }

  private drawRing(g: CanvasRenderingContext2D, i: number, t: number): void {
    const e = this.level.map.entries[i]!;
    drawEntryRing(g, this.ctx.assets, e, i, t, this.ctx.reducedMotion, { active: this.lock.ring === i, fraction: this.lock.fraction, locked: this.lockedRing === i, st: this.st }, this.camX);
  }

  private drawSaucer(g: CanvasRenderingContext2D, t: number): void {
    drawSaucerCommon(g, this.ctx.assets, this.saucer, t, this.ctx.reducedMotion, {
      locking: this.state === 'locking',
      st: this.st,
      wobble: this.steerWobble,
      dash: this.ctx.upgrades.has('afterburner') ? this.dash : null,
    });
  }

  // ================================================================ HUD

  private drawHud(g: CanvasRenderingContext2D, t: number): void {
    const assets = this.ctx.assets;
    const rm = this.ctx.reducedMotion;

    // shared HUD row: quit · suspicion · time
    hudButton(g, this.quit, 'close', 'QUIT', this.quit.pressedDown);
    const f = this.fuse;
    f.value = this.sus.value;
    f.exposed = this.exposed && this.state === 'fly';
    f.t = t;
    f.reduced = rm;
    f.seconds = 1 / (SUSPICION.rate * suspicionMultiplier(this.ctx.upgrades));
    hudFuse(g, 90, HUD_ROW.y, 330, HUD_ROW.h, f, assets.get('ui/eye_closed'), assets.get('ui/eye_open'));
    const sec = Math.floor(this.time);
    if (sec !== this.clockSec) {
      this.clockSec = sec;
      this.clock = fmtTime(sec);
    }
    hudTimer(g, 430, HUD_ROW.y, 96, HUD_ROW.h, this.clock);

    // banner
    if (this.time < 2.4 && this.spotted === 0 && this.state === 'fly') {
      const a = clamp(Math.min(this.time * 4, (2.4 - this.time) * 2), 0, 1);
      g.globalAlpha = a;
      hudPanel(g, 60, 100 - (rm ? 0 : (1 - a) * 14), VIEW_W - 120, 70, C.mint);
      text(g, `WORK ORDER #000${this.level.num}`, VIEW_W / 2, 122, 15, C.mint, 'center', 900);
      text(g, this.level.map.theme === 'farm' ? 'Collect: Farmer Doyle' : 'Collect: Laundromat Larry', VIEW_W / 2, 148, 21, C.text, 'center', 800);
      g.globalAlpha = 1;
    }

    // off-screen pointer to the target
    const tgt = this.level.map.target;
    const tx = tgt.x - this.camX;
    const ty = tgt.y - this.camY;
    if (tx < -40 || tx > VIEW_W + 40 || ty < -40 || ty > VIEW_H + 40) {
      const ang = Math.atan2(ty - VIEW_H / 2, tx - VIEW_W / 2);
      const ex = clamp(VIEW_W / 2 + Math.cos(ang) * 400, 40, VIEW_W - 40);
      const ey = clamp(VIEW_H / 2 + Math.sin(ang) * 600, 210, VIEW_H - 170);
      const bounce = rm ? 0 : Math.sin(t * 6) * 5;
      g.save();
      g.translate(ex + Math.cos(ang) * bounce, ey + Math.sin(ang) * bounce);
      g.rotate(ang);
      g.beginPath();
      g.moveTo(22, 0);
      g.lineTo(-12, -18);
      g.lineTo(-4, 0);
      g.lineTo(-12, 18);
      g.closePath();
      g.fillStyle = C.mint;
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = C.ink;
      g.stroke();
      g.restore();
      text(g, 'specimen', ex, ey + (Math.sin(ang) < 0 ? 34 : -34), 15, C.mint, 'center', 800);
    }

    // tutorial prompt
    if (this.ctx.tutorial && this.tutStep < 3 && this.state === 'fly') {
      const msg = this.tutStep === 0 ? 'Drag anywhere to fly' : this.tutStep === 1 ? 'Let go to hover' : 'Hover in a ring for 1 s to lock on';
      hudPrompt(g, VIEW_W / 2, FLIGHT_HUD.tutY, FLIGHT_HUD.tutH, msg, 24, this.tutStep === 0 ? 'drag' : this.tutStep === 1 ? 'release' : 'hold', t, rm, 510);
    }

    // Zib bubble (hidden behind the SPOTTED! overlay — the witness has the floor)
    if (this.zibT > 0 && this.state !== 'spotted') {
      const a = clamp(Math.min(this.zibT * 4, (2.8 - this.zibT) * 6), 0, 1);
      const slide = rm ? 0 : (1 - a) * 30;
      g.globalAlpha = a;
      const lines = wrap(g, this.zibText, 340, 19, 700);
      const h = Math.max(64, 24 + lines.length * 24);
      const by = VIEW_H - 28 - h + slide;
      panel(g, 112, by, VIEW_W - 136, h, C.paper, 18, C.ink, 3, 0);
      g.beginPath();
      g.moveTo(114, by + h - 26);
      g.lineTo(96, by + h - 12);
      g.lineTo(116, by + h - 10);
      g.fillStyle = C.paper;
      g.fill();
      paragraph(g, this.zibText, 128, by + 12, 340, 19, C.paperInk, 24, 'left', 700);
      drawPortrait(g, assets, 'zib', 58, VIEW_H - 66 + slide, 84, t);
      g.globalAlpha = 1;
    }
  }

  private drawSpotted(g: CanvasRenderingContext2D, t: number): void {
    const rm = this.ctx.reducedMotion;
    const st = this.st;
    g.fillStyle = 'rgba(12,6,30,0.6)';
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    const flashDur = 0.14;
    if (st < flashDur) {
      g.fillStyle = `rgba(255,255,255,${((1 - st / flashDur) * (rm ? 0.25 : 0.85)).toFixed(3)})`;
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    // the witness
    const k = rm ? 1 : easeOutBack(st / 0.4);
    drawPyjamaHuman(g, 380, 980 - k * 330, t, this.shout);

    const pop = rm ? 1 : easeOutBack((st - 0.05) / 0.35);
    g.save();
    g.translate(VIEW_W / 2, 220);
    g.rotate(-0.08);
    g.scale(pop, pop);
    outlinedText(g, 'SPOTTED!', 0, 0, 86, C.amberHi, C.ink, 900);
    g.restore();
    if (st > 0.3) {
      panel(g, 50, 290, VIEW_W - 100, 96, C.paper, 18, C.ink, 3, 4);
      paragraph(g, this.caption, 70, 302, VIEW_W - 140, 20, C.paperInk, 26, 'center', 700, true);
      text(g, `Times spotted tonight: ${this.spotted + 1}`, VIEW_W / 2, 410, 17, C.muted, 'center', 800);
    }
    // Retry prompt: a pill at the bottom, drawn over the witness so the shout bubble can't hide it.
    if (st > 0.9) {
      const a = rm ? 1 : 0.75 + 0.25 * Math.sin(t * 5);
      g.font = font(26, 900);
      const w = g.measureText('Tap to try again').width + 64;
      panel(g, (VIEW_W - w) / 2, SPOTTED_RETRY_Y - 32, w, 64, C.ink, 32, C.mint, 3, 4);
      g.globalAlpha = a;
      text(g, 'Tap to try again', VIEW_W / 2, SPOTTED_RETRY_Y + 1, 26, C.mint, 'center', 900);
      g.globalAlpha = 1;
    }
  }
}

/** Centre y of the SPOTTED! retry pill (below the witness's shout bubble at rest). */
export const SPOTTED_RETRY_Y = 884;

/** A startled human in striped pyjamas and a nightcap, pointing up-left. */
export function drawPyjamaHuman(g: CanvasRenderingContext2D, x: number, y: number, t: number, shout: string): void {
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
  const wob = Math.sin(t * 18) * 2;
  g.beginPath();
  g.arc(x + wob, y - 20, 60, 0, Math.PI * 2);
  g.fillStyle = '#f2c29b';
  g.fill();
  g.lineWidth = 5;
  g.stroke();
  // nightcap
  g.beginPath();
  g.moveTo(x - 62 + wob, y - 40);
  g.quadraticCurveTo(x + wob, y - 130, x + 64 + wob, y - 44);
  g.quadraticCurveTo(x + 120 + wob, y - 60, x + 130 + wob, y - 10 + Math.sin(t * 6) * 6);
  g.quadraticCurveTo(x + 90 + wob, y - 70, x + 40 + wob, y - 60);
  g.closePath();
  g.fillStyle = '#d94c6a';
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(x + 132 + wob, y - 6 + Math.sin(t * 6) * 6, 14, 0, Math.PI * 2);
  g.fillStyle = '#ffffff';
  g.fill();
  g.stroke();
  // eyes looking up-left
  for (const ex of [-24, 18]) {
    g.beginPath();
    g.arc(x + ex + wob, y - 22, 18, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();
    g.lineWidth = 3;
    g.stroke();
    g.beginPath();
    g.arc(x + ex - 7 + wob, y - 29, 6, 0, Math.PI * 2);
    g.fillStyle = INK;
    g.fill();
  }
  // mouth
  g.beginPath();
  g.ellipse(x - 4 + wob, y + 18, 14, 18, 0, 0, Math.PI * 2);
  g.fillStyle = '#5a1f2a';
  g.fill();
  g.stroke();
  // shout bubble
  if (shout) {
    g.font = font(30, 900);
    const w = g.measureText(shout).width + 36;
    const bx = Math.min(VIEW_W - w - 16, x - 40);
    const by = y - 210;
    panel(g, bx, by, w, 56, '#ffffff', 22, INK, 4, 0);
    text(g, shout, bx + w / 2, by + 29, 30, C.red, 'center', 900);
  }
}
