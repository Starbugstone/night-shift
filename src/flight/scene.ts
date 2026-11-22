import type { FlightResult, GameContext, Scene, Vec2 } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import { ART } from '../art-manifest';
import { SPOTTED_CAPTIONS, SPOTTED_SHOUTS, ZIB_LINES, pick, type ZibEvent } from '../levels/humor';
import { meterMultiplier } from '../levels/progress';
import type { LevelDef, RoadDef, VehicleDef } from '../levels/types';
import { clamp, drawPortrait, easeOutBack, fmtTime, outlinedText, panel, paragraph, roundRectPath, text, wrap } from '../ui/draw';
import { C, font } from '../ui/theme';
import { Button } from '../ui/widgets';
import { circleSegment, pointInCircle, pointInCone, type SegHit } from './geometry';
import { drawDog, drawProp, drawSaucerFallback, drawVehicle, propSize } from './props';
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
  type Saucer,
} from './sim';

const SAUCER_DRAW = FLIGHT_HUD.saucer;
const LOCK_ANIM = 0.9;
const ROAD_W = 120;
/** Plain road surface, used to paint clean junctions (matches road_v/road_h asphalt). */
const ROAD_BASE = { farm: '#6e5841', town: '#343756' } as const;

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
  level: LevelDef;
  /** Times already spotted this level attempt (carried across restarts). */
  spotted: number;
  onLocked(result: FlightResult): void;
  onQuit(): void;
}

export class FlightScene implements Scene {
  /** For debug hooks / tests. */
  state: 'fly' | 'spotted' | 'locking' = 'fly';
  private readonly ctx: GameContext;
  private readonly level: LevelDef;
  private spotted: number;
  private readonly saucer: Saucer = { x: 0, y: 0, vx: 0, vy: 0, stun: 0 };
  private readonly sus = new SuspicionMeter();
  private readonly lock = new LockOn();
  private vehicles: VehicleRT[] = [];
  private readonly ringPts: Vec2[];
  private readonly hit: SegHit = { nx: 0, ny: 0, depth: 0 };
  private readonly lineFlash: number[];
  private readonly quit = new Button(14, 14, 64, 64, '✕', 'ghost', 30);
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
  private lampGrad: CanvasGradient | null = null;
  private neonGrad: CanvasGradient | null = null;

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
          if (!this.ctx.reducedMotion) this.shake = 1;
          this.ctx.audio.sfx('bonk', 0.8);
          this.say('powerline', true);
        }
      }
    }

    // hazards
    this.updateVehicles(dt);
    let rate = 0;
    let cone = false;
    for (const v of this.vehicles) {
      if (pointInCone(s.x, s.y, v.ox, v.oy, v.coneAngle, v.def.coneHalf, v.def.coneRange)) {
        cone = true;
        rate += SUSPICION.coneRate;
      }
    }
    let bark = false;
    for (const d of m.dogs) {
      if (pointInCircle(s.x, s.y, d.x, d.y, barkRadius(this.hazT, d.rMin, d.rMax, d.period))) {
        bark = true;
        rate += SUSPICION.barkRate;
      }
    }
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
      this.ctx.audio.sfx('alert', 0.5 + this.sus.value * 0.6);
      this.alertT = 0.42 - this.sus.value * 0.2;
    }
    this.sus.update(dt, rate, meterMultiplier(this.ctx.upgrades));
    const high = this.sus.value > 0.7;
    if (high && !this.wasHighSus) this.say('highSus', true);
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
      this.lampGrad = g.createRadialGradient(0, 0, 0, 0, 0, 100);
      this.lampGrad.addColorStop(0, 'rgba(255,200,110,0.45)');
      this.lampGrad.addColorStop(1, 'rgba(255,200,110,0)');
      this.neonGrad = g.createRadialGradient(0, 0, 0, 0, 0, 100);
      this.neonGrad.addColorStop(0, 'rgba(255,90,200,0.5)');
      this.neonGrad.addColorStop(0.75, 'rgba(255,90,200,0.16)');
      this.neonGrad.addColorStop(1, 'rgba(255,90,200,0)');
    }
    const shx = this.shake > 0 ? Math.sin(t * 80) * 7 * this.shake : 0;
    const shy = this.shake > 0 ? Math.cos(t * 67) * 5 * this.shake : 0;
    const cx = Math.round(this.camX * 2) / 2;
    const cy = Math.round(this.camY * 2) / 2;

    g.save();
    g.translate(-cx + shx, -cy + shy);

    this.drawGround(g, cx, cy);
    for (const r of m.roads) this.drawRoad(g, r);
    this.drawJunctions(g);
    for (const p of m.groundProps) if (this.visible(p.x, p.y, 220)) drawProp(g, assets, p);

    // target building with a soft pulse outline
    const tgt = m.target;
    const ts = propSize(tgt);
    const pulse = rm ? 0.5 : 0.5 + 0.5 * Math.sin(t * 3);
    roundRectPath(g, tgt.x - ts.w / 2 - 10, tgt.y - ts.h / 2 - 10, ts.w + 20, ts.h + 20, 20);
    g.fillStyle = `rgba(124,255,203,${(0.08 + 0.08 * pulse).toFixed(3)})`;
    g.fill();
    drawProp(g, assets, tgt);
    for (const p of m.props) if (this.visible(p.x, p.y, 200)) drawProp(g, assets, p);
    for (const d of m.dogs) drawDog(g, assets, d.x, d.y, t);
    for (const v of this.vehicles) {
      g.save();
      g.translate(v.path.x, v.path.y);
      g.rotate(v.path.heading + Math.PI / 2);
      drawVehicle(g, assets, v.def.key, v.def.kind);
      g.restore();
    }

    // saucer shadow on the ground
    const s = this.saucer;
    const bob = rm ? 0 : Math.sin(t * 3) * 0.5 + 0.5;
    g.fillStyle = 'rgba(5,3,20,0.35)';
    g.beginPath();
    g.ellipse(s.x + 22 + bob * 6, s.y + 34 + bob * 8, 46, 40, 0, 0, Math.PI * 2);
    g.fill();

    // night wash
    g.fillStyle = 'rgba(10,8,40,0.26)';
    g.fillRect(cx - 20, cy - 20, VIEW_W + 40, VIEW_H + 40);

    // lights
    g.globalCompositeOperation = 'lighter';
    for (const l of m.lamps) {
      if (!this.visible(l.x, l.y, 120)) continue;
      g.save();
      g.translate(l.x, l.y);
      g.fillStyle = this.lampGrad!;
      g.fillRect(-100, -100, 200, 200);
      g.restore();
    }
    for (const n of m.neons) {
      const on = neonOn(this.hazT);
      g.save();
      g.translate(n.x, n.y);
      const k = n.r / 100;
      g.scale(k, k);
      g.globalAlpha = on ? 1 : 0.25;
      g.fillStyle = this.neonGrad!;
      g.fillRect(-100, -100, 200, 200);
      g.restore();
      g.globalAlpha = 1;
    }
    for (const v of this.vehicles) {
      g.save();
      g.translate(v.ox, v.oy);
      g.rotate(v.coneAngle);
      const k = v.def.coneRange / 300;
      g.scale(k, k);
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, 300, -v.def.coneHalf, v.def.coneHalf);
      g.closePath();
      g.fillStyle = this.coneGrad!;
      g.fill();
      g.restore();
    }
    g.globalCompositeOperation = 'source-over';

    // neon sign itself
    for (const n of m.neons) {
      const on = neonOn(this.hazT);
      panel(g, n.x - 44, n.y - 22, 88, 44, '#2a1430', 10, C.ink, 3, 0);
      text(g, n.text, n.x, n.y + 1, 26, on ? '#ff7ad9' : '#5a3a5a', 'center', 900);
    }

    // bark radius
    for (const d of m.dogs) {
      const r = barkRadius(this.hazT, d.rMin, d.rMax, d.period);
      const peak = (r - d.rMin) / (d.rMax - d.rMin);
      g.beginPath();
      g.arc(d.x, d.y, r, 0, Math.PI * 2);
      g.fillStyle = `rgba(255,140,60,${(0.06 + peak * 0.1).toFixed(3)})`;
      g.fill();
      g.setLineDash([14, 12]);
      g.lineDashOffset = -t * 30;
      g.lineWidth = 4;
      g.strokeStyle = `rgba(255,170,90,${(0.35 + peak * 0.5).toFixed(3)})`;
      g.stroke();
      g.setLineDash([]);
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
      g.lineWidth = 3;
      g.strokeStyle = flash > 0 ? `rgba(255,240,150,${(0.5 + flash * 0.5).toFixed(3)})` : '#0b0818';
      for (let k = -1; k <= 1; k += 2) {
        const ox = nx * k * POWER_LINE.wireGap;
        const oy = ny * k * POWER_LINE.wireGap;
        g.beginPath();
        g.moveTo(l.ax + ox, l.ay + oy);
        g.quadraticCurveTo(midx + ox, midy + oy, l.bx + ox, l.by + oy);
        g.stroke();
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

    g.restore();
    this.drawHud(g, t);
    if (this.state === 'spotted') this.drawSpotted(g, t);
  }

  private visible(x: number, y: number, margin: number): boolean {
    return x > this.camX - margin && x < this.camX + VIEW_W + margin && y > this.camY - margin && y < this.camY + VIEW_H + margin;
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

  private roadRect(r: RoadDef): { x: number; y: number; w: number; h: number } {
    return r.dir === 'h'
      ? { x: r.from, y: r.at - ROAD_W / 2, w: r.to - r.from, h: ROAD_W }
      : { x: r.at - ROAD_W / 2, y: r.from, w: ROAD_W, h: r.to - r.from };
  }

  /**
   * Farm roads are dirt: `flight/dirt_road_h` / `flight/dirt_road_v` if an art pass provides them,
   * otherwise drawn here. Town roads use the asphalt sprites.
   */
  private drawRoad(g: CanvasRenderingContext2D, r: RoadDef): void {
    const farm = this.level.map.theme === 'farm';
    const W = ROAD_W;
    const { x, y, w, h } = this.roadRect(r);
    if (x > this.camX + VIEW_W || x + w < this.camX || y > this.camY + VIEW_H || y + h < this.camY) return;
    const key = farm ? (r.dir === 'h' ? 'flight/dirt_road_h' : 'flight/dirt_road_v') : r.dir === 'h' ? 'flight/road_h' : 'flight/road_v';
    const img = this.ctx.assets.get(key);
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    if (img) {
      if (r.dir === 'h') for (let xx = x; xx < x + w; xx += 540) g.drawImage(img, xx, y, 540.5, W);
      else for (let yy = y; yy < y + h; yy += 540) g.drawImage(img, x, yy, W, 540.5);
    } else if (farm) {
      drawDirtRoad(g, r.dir, x, y, w, h);
    } else {
      g.fillStyle = ROAD_BASE.town;
      g.fillRect(x, y, w, h);
      g.fillStyle = '#e3c35a';
      if (r.dir === 'h') for (let xx = x + 10; xx < x + w; xx += 70) g.fillRect(xx, y + W / 2 - 3, 36, 6);
      else for (let yy = y + 10; yy < y + h; yy += 70) g.fillRect(x + W / 2 - 3, yy, 6, 36);
    }
    g.restore();
  }

  /** Paint each road crossing / T-junction as plain surface so curbs and markings don't run through it. */
  private drawJunctions(g: CanvasRenderingContext2D): void {
    const m = this.level.map;
    g.fillStyle = m.theme === 'farm' ? ROAD_BASE.farm : ROAD_BASE.town;
    for (const a of m.roads) {
      if (a.dir !== 'h') continue;
      for (const b of m.roads) {
        if (b.dir !== 'v') continue;
        const ra = this.roadRect(a);
        const rb = this.roadRect(b);
        const x0 = Math.max(ra.x, rb.x);
        const y0 = Math.max(ra.y, rb.y);
        const x1 = Math.min(ra.x + ra.w, rb.x + rb.w);
        const y1 = Math.min(ra.y + ra.h, rb.y + rb.h);
        if (x1 > x0 && y1 > y0) g.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
    }
  }

  private drawRing(g: CanvasRenderingContext2D, i: number, t: number): void {
    const e = this.level.map.entries[i]!;
    const active = this.lock.ring === i;
    const locked = this.lockedRing === i;
    const rm = this.ctx.reducedMotion;
    const pulse = rm ? 1 : 1 + Math.sin(t * 3 + i) * 0.05;
    g.save();
    g.translate(e.x, e.y);
    g.scale(pulse, pulse);
    g.globalCompositeOperation = 'lighter';
    g.beginPath();
    g.arc(0, 0, RING_R, 0, Math.PI * 2);
    g.fillStyle = active || locked ? 'rgba(124,255,203,0.28)' : 'rgba(124,255,203,0.12)';
    g.fill();
    g.globalCompositeOperation = 'source-over';
    g.rotate(rm ? 0 : t * 0.7);
    const img = this.ctx.assets.get('flight/entry_ring');
    if (img) g.drawImage(img, -RING_R, -RING_R, RING_R * 2, RING_R * 2);
    else {
      g.setLineDash([16, 10]);
      g.lineWidth = 6;
      g.strokeStyle = C.mint;
      g.beginPath();
      g.arc(0, 0, RING_R - 4, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      g.lineWidth = 2;
      g.beginPath();
      g.arc(0, 0, RING_R * 0.55, 0, Math.PI * 2);
      g.stroke();
    }
    g.restore();
    if (active && this.lock.fraction > 0) {
      g.beginPath();
      g.arc(e.x, e.y, RING_R + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.lock.fraction);
      g.lineWidth = 10;
      g.lineCap = 'round';
      g.strokeStyle = C.mint;
      g.stroke();
      g.lineCap = 'butt';
    }
    // label pill
    const a = `${e.route} — `;
    g.font = font(19, 800);
    const wa = g.measureText(a).width;
    const wb = g.measureText(e.difficulty).width;
    const w = wa + wb + 28;
    const ly = e.labelSide === 'above' ? e.y - RING_R - 34 : e.y + RING_R + 34;
    const x0 = clamp(e.x - w / 2, this.camX + 8, this.camX + VIEW_W - 8 - w);
    panel(g, x0, ly - 20, w, 40, 'rgba(27,20,51,0.9)', 20, C.mint, 2, 0);
    text(g, a, x0 + 14, ly + 1, 19, C.mint, 'left', 800);
    const calm = e.difficulty.includes('easy') || e.difficulty.includes('safe');
    text(g, e.difficulty, x0 + 14 + wa, ly + 1, 19, calm ? C.text : C.amberHi, 'left', 800);
  }

  private drawSaucer(g: CanvasRenderingContext2D, t: number): void {
    const s = this.saucer;
    const rm = this.ctx.reducedMotion;
    const sp = saucerSpeed(s);
    const k = Math.min(1, sp / SAUCER.maxSpeed);
    // streaks
    if (k > 0.4 && !rm) {
      g.strokeStyle = `rgba(124,255,203,${((k - 0.4) * 0.8).toFixed(3)})`;
      g.lineWidth = 4;
      g.lineCap = 'round';
      const ux = s.vx / (sp || 1);
      const uy = s.vy / (sp || 1);
      for (let i = -1; i <= 1; i++) {
        const ox = -uy * i * 26;
        const oy = ux * i * 26;
        g.beginPath();
        g.moveTo(s.x - ux * 50 + ox, s.y - uy * 50 + oy);
        g.lineTo(s.x - ux * (90 + k * 60 - Math.abs(i) * 20) + ox, s.y - uy * (90 + k * 60 - Math.abs(i) * 20) + oy);
        g.stroke();
      }
      g.lineCap = 'butt';
    }
    // beam while locking
    if (this.state === 'locking') {
      const a = Math.min(1, this.st / 0.3);
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(124,255,203,${(0.35 * a).toFixed(3)})`;
      g.beginPath();
      g.arc(s.x, s.y, 40 + a * 30 + Math.sin(t * 20) * 4, 0, Math.PI * 2);
      g.fill();
      g.globalCompositeOperation = 'source-over';
    }
    const hover = 1 - k;
    const bob = rm ? 1 : 1 + Math.sin(t * 3) * 0.03 * hover;
    const lockShrink = this.state === 'locking' ? 1 - Math.min(0.15, this.st * 0.2) : 1;
    g.save();
    g.translate(s.x, s.y);
    if (this.steerWobble !== 0 && !rm) g.rotate(this.steerWobble * 0.3);
    if (s.stun > 0 && !rm) g.rotate(Math.sin(t * 40) * 0.25);
    const va = Math.atan2(s.vy, s.vx);
    g.rotate(va);
    g.scale((1 - 0.14 * k) * bob * lockShrink, (1 + 0.04 * k) * bob * lockShrink);
    g.rotate(-va);
    const img = this.ctx.assets.get('flight/saucer_top');
    if (img) g.drawImage(img, -SAUCER_DRAW / 2, -SAUCER_DRAW / 2, SAUCER_DRAW, SAUCER_DRAW);
    else drawSaucerFallback(g, SAUCER_DRAW, t);
    g.restore();
  }

  // ================================================================ HUD

  private drawHud(g: CanvasRenderingContext2D, t: number): void {
    const assets = this.ctx.assets;
    const rm = this.ctx.reducedMotion;
    this.quit.render(g);

    // suspicion meter
    const v = this.sus.value;
    const shake = v > 0.7 && !rm ? Math.sin(t * 50) * 2 : 0;
    panel(g, 90 + shake, 16, 330, 62, 'rgba(27,20,51,0.88)', 18, C.ink, 3, 0);
    text(g, 'SUSPICION', 108 + shake, 34, 14, v > 0.7 ? C.red : C.muted, 'left', 900);
    roundRectPath(g, 108 + shake, 46, 294, 20, 10);
    g.fillStyle = '#120d2b';
    g.fill();
    if (v > 0.005) {
      roundRectPath(g, 108 + shake, 46, Math.max(20, 294 * v), 20, 10);
      g.fillStyle = v > 0.7 ? (Math.floor(t * 8) % 2 === 0 || rm ? C.red : C.amber) : v > 0.4 ? C.amber : C.mint;
      g.fill();
    }
    const eye = v > 0.4 ? '◉' : '◡';
    text(g, eye, 398 + shake, 33, 18, v > 0.7 ? C.red : C.muted, 'center', 900);

    // timer
    panel(g, 430, 16, 96, 62, 'rgba(27,20,51,0.88)', 18, C.ink, 3, 0);
    text(g, 'TIME', 478, 32, 13, C.muted, 'center', 900);
    text(g, fmtTime(this.time), 478, 56, 24, C.text, 'center', 800);

    // banner
    if (this.time < 2.4 && this.spotted === 0 && this.state === 'fly') {
      const a = clamp(Math.min(this.time * 4, (2.4 - this.time) * 2), 0, 1);
      g.globalAlpha = a;
      panel(g, 60, 100, VIEW_W - 120, 70, 'rgba(27,20,51,0.9)', 20, C.mint, 2, 0);
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
      g.font = font(24, 800);
      const w = g.measureText(msg).width + 80;
      const y = FLIGHT_HUD.tutY;
      panel(g, (VIEW_W - w) / 2, y - FLIGHT_HUD.tutH / 2, w, FLIGHT_HUD.tutH, C.mint, 30, C.ink, 3, 4);
      text(g, msg, VIEW_W / 2 + 18, y + 1, 24, C.ink, 'center', 800);
      // finger glyph
      const fx = (VIEW_W - w) / 2 + 30;
      const fy = y + (this.tutStep === 0 && !rm ? Math.sin(t * 4) * 6 : 0);
      g.beginPath();
      g.arc(fx, fy, 12, 0, Math.PI * 2);
      g.fillStyle = this.tutStep === 1 ? 'rgba(27,20,51,0.3)' : C.ink;
      g.fill();
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

function drawDirtRoad(g: CanvasRenderingContext2D, dir: 'h' | 'v', x: number, y: number, w: number, h: number): void {
  const along = dir === 'h' ? w : h;
  // (u, v) → along / across the road
  const rect = (u: number, v: number, du: number, dv: number): void => {
    if (dir === 'h') g.fillRect(x + u, y + v, du, dv);
    else g.fillRect(x + v, y + u, dv, du);
  };
  g.fillStyle = ROAD_BASE.farm;
  rect(0, 0, along, ROAD_W);
  // grassy verges
  g.fillStyle = '#4f5a3a';
  rect(0, 0, along, 7);
  rect(0, ROAD_W - 7, along, 7);
  // packed wheel ruts
  g.fillStyle = '#5a4634';
  rect(0, 24, along, 14);
  rect(0, ROAD_W - 38, along, 14);
  // grass strip down the middle, patchy
  g.fillStyle = '#56663e';
  for (let u = 6; u < along; u += 46) rect(u, ROAD_W / 2 - 4, 28, 8);
  // pebbles
  g.fillStyle = '#8a7356';
  for (let u = 17; u < along; u += 61) {
    rect(u, 46, 4, 4);
    rect(u + 29, 78, 5, 4);
  }
}

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
