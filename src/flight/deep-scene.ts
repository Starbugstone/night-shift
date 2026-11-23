// Deep-level flight scene (L3+): renders DeepFlightSim, runs the sunrise clock, the 1-second
// fuse, the photo-flash SPOTTED freeze and respawn at the checkpoint.
import type { FlightAutopilotIntent, GameContext, Scene, Vec2 } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import { ART } from '../art-manifest';
import { DEEP_ZIB, pick, spotCaption, spotShout, SPOT_ZIB, type DeepZibEvent } from '../levels/humor';
import type { DeepRun } from '../levels/run';
import type { DeepLevelDef, PropDef, PropKind } from '../levels/types';
import { GLOW, P_RING, P_SPARK, P_STAR, P_TWINKLE, PC, Particles, drawEdgeTint, drawGlow, drawShadow, drawVignette, easeInCubic, easeOutBack, radialSprite } from '../core/fx';
import { clamp, outlinedText, panel, paragraph, roundRectPath, text } from '../ui/draw';
import { HUD_ROW, hudButton, hudFuse, hudPanel, hudSunClock, type FuseState } from '../ui/hud';
import { C, font } from '../ui/theme';
import { Button } from '../ui/widgets';
import { FlightAutopilot } from './autopilot';
import { DeepFlightSim, SAFE_WINDOW } from './deep-sim';
import { ConeSprites, drawEntryRing, drawJunctions, drawRoad, drawSaucer, drawTargetArrow, drawZibBubble } from './draw-common';
import { PORCH, WATCHER_TELL } from './hazards';
import { drawDog, drawProp, propSize } from './props';
import { FLIGHT_HUD, POWER_LINE, SUSPICION, barkRadius } from './sim';
import { drawPyjamaHuman } from './scene';

const LOCK_ANIM = 0.9;
/** The SPOTTED freeze lasts this long before the respawn (tap skips after SPOT_SKIP). */
const SPOT_HOLD = 1.35;
const SPOT_SKIP = 0.4;
const SHADOW_OFF: Partial<Record<PropKind, number>> = { suburb_house: 13, highrise: 16, civic: 15, tree: 13, hedge: 5, trampoline: 4 };
const MINI_W = 84;

export interface DeepFlightOptions {
  ctx: GameContext;
  level: DeepLevelDef;
  run: DeepRun;
  /** Locked onto (target, entry): the shell starts the abduction. */
  onLocked(target: number, entry: number): void;
  /** The sun came up mid-flight. */
  onSunrise(): void;
  onQuit(): void;
}

type SceneState = 'fly' | 'spotted' | 'locking';

export class DeepFlightScene implements Scene {
  state: SceneState = 'fly';
  readonly sim: DeepFlightSim;
  private readonly ctx: GameContext;
  private readonly level: DeepLevelDef;
  private readonly run: DeepRun;
  private readonly quit = new Button(14, HUD_ROW.y, 64, HUD_ROW.h, '', 'ghost', 30);
  private readonly fx = new Particles(96);
  private readonly cones = new ConeSprites();
  private readonly fuse: FuseState = { value: 0, exposed: false, t: 0, reduced: false, seconds: 1 };
  private readonly seen = new Set<string>();
  private readonly lineFlash: Float32Array;
  private readonly speckles: Float32Array;
  private autopilot: FlightAutopilot | null = null;
  private st = 0;
  private shake = 0;
  private zibText = '';
  private zibT = 0;
  private zibCd = 0;
  private zibN = 0;
  private zibPanic = false;
  private alertT = 0;
  private barkT = 0;
  private flashT = 0;
  private exposedT = 0;
  private wasDawn = false;
  private caption = '';
  private shout = '';
  private spotLine = '';
  private spotCause = '';
  private done = false;
  private bannerT = 0;
  private gagNear = -1;
  private lampGlow: HTMLCanvasElement | null = null;
  private clockText = '';
  private clockSec = -1;

  constructor(private readonly opts: DeepFlightOptions) {
    this.ctx = opts.ctx;
    this.level = opts.level;
    this.run = opts.run;
    this.sim = new DeepFlightSim(this.level.map, this.ctx.upgrades, this.run.elapsed);
    for (let i = 0; i < 3; i++) if (this.run.delivered[i]) this.sim.markDelivered(i);
    const sp = this.run.spawn;
    this.sim.place(sp.x, sp.y, this.run.legs === 0 && this.run.spotted === 0 ? 0.4 : SAFE_WINDOW);
    this.fuse.seconds = 1 / (SUSPICION.rate * this.sim.mult);
    this.lineFlash = new Float32Array(this.level.map.hazards.length);
    const m = this.level.map;
    let seed = m.theme === 'suburb' ? 13 : 17;
    const rnd = (): number => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    this.speckles = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      this.speckles[i * 3] = rnd() * m.w;
      this.speckles[i * 3 + 1] = rnd() * m.h;
      this.speckles[i * 3 + 2] = 2 + rnd() * 5;
    }
    if (this.run.legs === 0 && this.run.spotted === 0) this.bannerT = 3;
    else if (this.run.legs > 0 && this.run.deliveredCount > 0 && this.run.lastFail === null) this.say('checkpoint', true);
  }

  /** For test scripts: window.__nightShift.active.debug */
  get debug(): { autopilot: () => FlightAutopilotIntent; sim: DeepFlightSim; run: DeepRun; state: string; ap: FlightAutopilot | null } {
    const self = this;
    return {
      autopilot: () => self.autopilotIntent(),
      sim: self.sim,
      run: self.run,
      state: self.state,
      ap: self.autopilot,
    };
  }

  /** The finger a competent player would hold this frame (logical screen coords). */
  autopilotIntent(): FlightAutopilotIntent {
    this.autopilot ??= new FlightAutopilot(this.sim);
    return this.autopilot.intent();
  }

  /** Where the saucer is on screen (the iris transition closes on it). */
  screenFocus(): Vec2 {
    return { x: this.sim.saucer.x - this.sim.camX, y: this.sim.saucer.y - this.sim.camY };
  }

  get suspicion(): number {
    return this.sim.suspicion;
  }

  private say(evt: DeepZibEvent, force = false, panic = false): void {
    if (!force && this.zibCd > 0) return;
    this.zibText = pick(DEEP_ZIB[evt], this.zibN++ + this.run.spotted);
    this.zibT = 2.8;
    this.zibCd = 3.2;
    this.zibPanic = panic;
  }

  update(dt: number): void {
    const p = this.ctx.pointer;
    const audio = this.ctx.audio;
    this.zibT = Math.max(0, this.zibT - dt);
    this.zibCd = Math.max(0, this.zibCd - dt);
    this.shake = Math.max(0, this.shake - dt * 3);
    this.flashT = Math.max(0, this.flashT - dt);
    this.bannerT = Math.max(0, this.bannerT - dt);
    for (let i = 0; i < this.lineFlash.length; i++) this.lineFlash[i] = Math.max(0, this.lineFlash[i]! - dt * 3);
    this.st += dt;
    this.fx.update(dt);

    if (this.done) return;
    // the sunrise clock runs through everything, the SPOTTED freeze included
    if (this.run.tick(dt)) {
      this.done = true;
      audio.sfx('sunrise');
      this.opts.onSunrise();
      return;
    }
    const dawn = this.run.dawn > 0;
    if (dawn && !this.wasDawn) {
      this.say('dawn', true, true);
      audio.sfx('sunrise', 0.6);
    }
    this.wasDawn = dawn;

    if (this.state === 'spotted') {
      if (this.st > SPOT_HOLD || (this.st > SPOT_SKIP && p.pressed)) this.respawn();
      return;
    }

    if (this.state !== 'locking' && this.quit.update(p, dt, audio)) {
      this.done = true;
      this.opts.onQuit();
      return;
    }

    const sim = this.sim;
    sim.update(dt, p, !this.quit.pressedDown);

    if (this.state === 'locking') {
      if (this.st >= (this.ctx.reducedMotion ? 0.5 : LOCK_ANIM)) {
        this.done = true;
        const ref = sim.ringRef[sim.lockedRing]!;
        this.opts.onLocked(ref.target, ref.entry);
      }
      return;
    }

    const st = sim.st;
    const s = sim.saucer;
    const field = sim.field;
    // ---- events
    if (st.dashed) {
      audio.sfx('dash');
      if (!this.seen.has('dash')) {
        this.seen.add('dash');
        this.say('dash', true);
      }
      if (!this.ctx.reducedMotion) this.fx.burst(P_SPARK, s.x, s.y, 10, 160, 320, 0.3, 4, PC.amber, 0, 3);
    }
    if (st.click >= 0) {
      audio.sfx('click', 0.9);
      if (!this.seen.has('porch')) {
        this.seen.add('porch');
        this.say('porch', true, true);
      }
    }
    if (st.bump >= 0) {
      const cause = field.bumpCause(st.bump);
      this.lineFlash[st.bump] = 1;
      audio.sfx('bonk', 0.8);
      this.fx.burst(P_STAR, s.x, s.y - 30, this.ctx.reducedMotion ? 2 : 4, 120, 260, 0.55, 11, PC.amber, 0, 2.2);
      if (!this.ctx.reducedMotion) {
        this.shake = 1;
        this.fx.burst(P_SPARK, s.x, s.y, 8, 200, 420, 0.3, 3.5, PC.white, 0, 3);
      }
      this.say(cause, !this.seen.has(cause), true);
      this.seen.add(cause);
    }
    // gags: the sprinkler and Gary's tripwire only ever produce jokes
    let near = -1;
    for (let i = 0; i < field.defs.length; i++) {
      const d = field.defs[i]!;
      if (d.type === 'gag' && Math.hypot(s.x - (d.x + d.bx) / 2, s.y - (d.y + d.by) / 2) < (d.kind === 'tripwire' ? 90 : 120)) near = i;
    }
    if (near >= 0 && near !== this.gagNear) {
      const d = field.defs[near]!;
      if (d.type === 'gag') {
        this.say(d.kind, true);
        if (d.kind === 'tripwire') audio.sfx('alarm', 0.25);
      }
    }
    this.gagNear = near;

    // ---- the fuse
    const exposed = st.cause >= 0;
    if (exposed) {
      this.exposedT += dt;
      const cause = field.spotCause(st.cause);
      if (!this.seen.has(cause)) {
        this.seen.add(cause);
        this.say(cause, true, true);
        if (cause === 'police' || cause === 'patrol' || cause === 'heli') audio.sfx('siren', 0.5);
      }
      if (cause === 'dog' && this.barkT <= 0) {
        audio.sfx('bark', 0.8);
        this.barkT = 0.9;
      }
      this.alertT -= dt;
      if (this.alertT <= 0) {
        // rising tick: louder and higher as the fuse burns
        audio.sfx('alert', 0.4 + st.sus * 0.8);
        this.alertT = 0.2 - st.sus * 0.1;
      }
    } else {
      this.exposedT = 0;
      this.alertT = 0;
    }
    this.barkT -= dt;

    if (sim.phase === 'spotted') {
      this.state = 'spotted';
      this.st = 0;
      this.flashT = 0.18;
      const cause = sim.spottedBy >= 0 ? field.spotCause(sim.spottedBy) : 'police';
      this.spotCause = cause;
      const seed = this.run.spotted * 7 + Math.floor(this.ctx.time * 3);
      this.caption = spotCaption(cause, seed);
      this.shout = spotShout(cause, seed);
      this.spotLine = pick(SPOT_ZIB[cause] ?? SPOT_ZIB.police!, seed);
      audio.sfx('spotted');
      if (cause === 'police' || cause === 'patrol') audio.sfx('siren', 0.8);
      return;
    }

    if (sim.inRing >= 0 && !this.seen.has('ring')) {
      this.seen.add('ring');
      this.say('nearRing', true);
    }
    if (sim.justLocked) {
      this.state = 'locking';
      this.st = 0;
      audio.sfx('lock_on');
      audio.sfx('beam_on', 0.6);
      this.say('locked', true);
      this.lockBurst(sim.rings[sim.lockedRing]!);
    }
  }

  private respawn(): void {
    const pos = this.run.onSpotted();
    // the world kept turning while the photo developed
    this.sim.st.t = this.run.elapsed;
    this.sim.place(pos.x, pos.y, SAFE_WINDOW);
    this.state = 'fly';
    this.st = 0;
    this.exposedT = 0;
    this.say('respawn', true);
  }

  private lockBurst(ring: Vec2): void {
    const fx = this.fx;
    fx.spawn(P_RING, ring.x, ring.y, 0, 0, 0.55, 170, PC.mint);
    fx.spawn(P_RING, ring.x, ring.y, 0, 0, 0.36, 100, PC.white);
    if (this.ctx.reducedMotion) return;
    fx.burst(P_SPARK, ring.x, ring.y, 16, 260, 480, 0.42, 4, PC.mint, 0, 3);
    fx.burst(P_TWINKLE, ring.x, ring.y, 9, 70, 210, 0.7, 10, PC.white, 0, 2);
  }

  // ================================================================ render

  private visible(x: number, y: number, margin: number): boolean {
    const cx = this.sim.camX;
    const cy = this.sim.camY;
    return x > cx - margin && x < cx + VIEW_W + margin && y > cy - margin && y < cy + VIEW_H + margin;
  }

  render(g: CanvasRenderingContext2D): void {
    const m = this.level.map;
    const sim = this.sim;
    const assets = this.ctx.assets;
    const t = this.ctx.time;
    const rm = this.ctx.reducedMotion;
    const s = sim.saucer;
    this.lampGlow ??= radialSprite('flight-lamp', [
      [0, 'rgba(255,200,110,0.45)'],
      [1, 'rgba(255,200,110,0)'],
    ]);
    const shx = this.shake > 0 && !rm ? Math.sin(t * 80) * 7 * this.shake : 0;
    const shy = this.shake > 0 && !rm ? Math.cos(t * 67) * 5 * this.shake : 0;
    const cx = Math.round(sim.camX * 2) / 2;
    const cy = Math.round(sim.camY * 2) / 2;
    const locking = this.state === 'locking';
    const lockK = locking ? Math.min(1, this.st / LOCK_ANIM) : 0;
    const theme = m.theme;

    g.save();
    if (locking && !rm) {
      const z = 1 + 0.24 * easeInCubic(lockK);
      g.translate(s.x - cx, s.y - cy);
      g.scale(z, z);
      g.translate(-(s.x - cx), -(s.y - cy));
    }
    g.translate(-cx + shx, -cy + shy);

    this.drawGround(g, cx, cy);
    for (const r of m.roads) drawRoad(g, assets, r, theme, cx, cy);
    drawJunctions(g, m.roads, theme);
    for (const p of m.groundProps) if (this.visible(p.x, p.y, 260)) drawProp(g, assets, p);

    // shadows, then buildings
    for (const p of m.props) if (this.visible(p.x, p.y, 240)) this.propShadow(g, p);
    for (const tg of m.targets) this.propShadow(g, tg.building);
    for (const p of m.props) if (this.visible(p.x, p.y, 240)) drawProp(g, assets, p);
    for (let i = 0; i < 3; i++) this.drawTarget(g, i, t);

    this.drawGroundHazards(g, t);

    // saucer shadow on the ground
    const bob = rm ? 0 : Math.sin(t * 2.4) * 0.5 + 0.5;
    drawGlow(g, GLOW.dark, s.x + 22 + bob * 5, s.y + 34 + bob * 7, 66 - bob * 5, 58 - bob * 5, 0.7);

    // night wash, warming towards sunrise
    const dawn = this.run.dawn;
    g.fillStyle = `rgba(10,8,40,${(0.3 - dawn * 0.18).toFixed(3)})`;
    g.fillRect(cx - 20, cy - 20, VIEW_W + 40, VIEW_H + 40);
    if (dawn > 0) {
      g.fillStyle = `rgba(255,150,90,${(dawn * 0.22).toFixed(3)})`;
      g.fillRect(cx - 20, cy - 20, VIEW_W + 40, VIEW_H + 40);
    }

    // ---- lights (additive)
    g.globalCompositeOperation = 'lighter';
    if (this.lampGlow) for (const l of m.lamps) if (this.visible(l.x, l.y, 120)) g.drawImage(this.lampGlow, l.x - 100, l.y - 100, 200, 200);
    drawGlow(g, GLOW.mint, s.x, s.y + 4, 86, 86, 0.2 + bob * 0.06 + lockK * 0.5);
    g.globalCompositeOperation = 'source-over';
    this.drawDetectors(g, t);

    this.drawSkyHazards(g, t);

    // rings of the specimens still to collect
    for (let i = 0; i < sim.rings.length; i++) {
      const ref = sim.ringRef[i]!;
      if (sim.delivered[ref.target]) continue;
      const e = m.targets[ref.target]!.entries[ref.entry]!;
      if (!this.visible(e.x, e.y, 160)) continue;
      drawEntryRing(g, assets, e, i, t, rm, { active: sim.lock.ring === i, fraction: sim.lock.fraction, locked: sim.lockedRing === i, st: this.st }, cx);
    }

    drawSaucer(g, assets, s, t, rm, { locking, st: this.st, wobble: sim.field.scramble(s.x, s.y), dash: sim.afterburner ? sim.st.dash : null, ghost: sim.st.safe });
    this.fx.draw(g);
    g.restore();

    drawVignette(g, 0.9);
    // exposed: the screen edge flashes red, faster as the fuse burns
    if (this.state === 'fly' && sim.st.cause >= 0) {
      const pulse = rm ? 0.6 : 0.45 + 0.55 * Math.abs(Math.sin(t * (8 + sim.st.sus * 14)));
      drawEdgeTint(g, GLOW.red, (0.45 + sim.st.sus * 0.6) * pulse);
    } else if (sim.st.sus > 0.05 && this.state === 'fly') drawEdgeTint(g, GLOW.red, sim.st.sus * 0.35);
    if (dawn > 0) drawEdgeTint(g, GLOW.warm, dawn * 0.7);
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

  private drawGround(g: CanvasRenderingContext2D, cx: number, cy: number): void {
    const m = this.level.map;
    const img = this.ctx.assets.get(m.theme === 'suburb' ? 'flight/ground_suburb' : 'flight/ground_city');
    if (img) {
      const T = 540;
      const x0 = Math.floor(cx / T) * T;
      const y0 = Math.floor(cy / T) * T;
      for (let y = y0; y < cy + VIEW_H; y += T) for (let x = x0; x < cx + VIEW_W; x += T) g.drawImage(img, x, y, T + 0.5, T + 0.5);
      return;
    }
    g.fillStyle = m.theme === 'suburb' ? '#2b4a3a' : '#2a2a40';
    g.fillRect(cx - 20, cy - 20, VIEW_W + 40, VIEW_H + 40);
    g.fillStyle = m.theme === 'suburb' ? '#335644' : '#33334c';
    const sp = this.speckles;
    for (let i = 0; i < sp.length; i += 3) {
      const x = sp[i]!;
      const y = sp[i + 1]!;
      if (x < cx - 10 || x > cx + VIEW_W + 10 || y < cy - 10 || y > cy + VIEW_H + 10) continue;
      const r = sp[i + 2]!;
      if (m.theme === 'suburb') g.fillRect(x, y, r, r * 2.4);
      else g.fillRect(x, y, r * 3, r);
    }
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

  private drawTarget(g: CanvasRenderingContext2D, i: number, t: number): void {
    const tg = this.level.map.targets[i]!;
    const b = tg.building;
    if (!this.visible(b.x, b.y, 260)) return;
    const done = this.sim.delivered[i];
    const ts = propSize(b);
    if (!done) {
      const pulse = this.ctx.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 3 + i);
      roundRectPath(g, b.x - ts.w / 2 - 10, b.y - ts.h / 2 - 10, ts.w + 20, ts.h + 20, 20);
      g.globalAlpha = 0.08 + 0.08 * pulse;
      g.fillStyle = C.mint;
      g.fill();
      g.globalAlpha = 1;
    }
    drawProp(g, this.ctx.assets, b);
    if (done) {
      g.globalAlpha = 0.85;
      panel(g, b.x - 54, b.y - 20, 108, 40, 'rgba(27,20,51,0.85)', 20, C.mint, 2, 0);
      text(g, '✓ COLLECTED', b.x, b.y + 1, 14, C.mint, 'center', 900);
      g.globalAlpha = 1;
    }
  }

  /** Things on the ground: cars, dogs, lamps, cameras, gags. */
  private drawGroundHazards(g: CanvasRenderingContext2D, t: number): void {
    const f = this.sim.field;
    const assets = this.ctx.assets;
    const rm = this.ctx.reducedMotion;
    for (let i = 0; i < f.defs.length; i++) {
      const d = f.defs[i]!;
      switch (d.type) {
        case 'car': {
          const c = f.cars[i]![0]!;
          if (!this.visible(c.x, c.y, 120)) break;
          this.drawCar(g, c.key, c.x, c.y, c.heading, d.role === 'police', t);
          break;
        }
        case 'traffic':
          for (const c of f.cars[i]!) if (c.live && this.visible(c.x, c.y, 120)) this.drawCar(g, c.key, c.x, c.y, c.heading, false, t);
          break;
        case 'dog':
          if (this.visible(d.x, d.y, 80)) drawDog(g, assets, d.x, d.y, t, this.sim.st.cause === i, rm);
          break;
        case 'porch': {
          if (!this.visible(d.x, d.y, d.r)) break;
          const img = assets.get('flight/porch_light_top');
          if (img) g.drawImage(img, d.x - 15, d.y - 15, 30, 30);
          else {
            g.beginPath();
            g.arc(d.x, d.y, 9, 0, Math.PI * 2);
            g.fillStyle = '#d8d2b8';
            g.fill();
            g.lineWidth = 3;
            g.strokeStyle = C.ink;
            g.stroke();
          }
          break;
        }
        case 'camera': {
          if (!this.visible(d.x, d.y, 60)) break;
          g.save();
          g.translate(d.x, d.y);
          g.rotate(f.a[i]! + Math.PI / 2);
          const img = assets.get('flight/security_cam_top');
          if (img) g.drawImage(img, -20, -20, 40, 40);
          else {
            roundRectPath(g, -9, -16, 18, 28, 4);
            g.fillStyle = '#c9cbd8';
            g.fill();
            g.lineWidth = 3;
            g.strokeStyle = C.ink;
            g.stroke();
            g.fillStyle = '#ff5d73';
            g.beginPath();
            g.arc(0, -14, 4, 0, Math.PI * 2);
            g.fill();
          }
          g.restore();
          break;
        }
        case 'gag':
          if (!this.visible(d.x, d.y, 160)) break;
          if (d.kind === 'sprinkler') {
            const img = assets.get('flight/sprinkler_top');
            if (img) g.drawImage(img, d.x - 20, d.y - 20, 40, 40);
            const a = rm ? 0 : t * 2.2;
            g.strokeStyle = 'rgba(160,220,255,0.55)';
            g.lineWidth = 3;
            for (let k = 0; k < 6; k++) {
              g.beginPath();
              g.arc(d.x, d.y, 30 + k * 12, a - 0.25, a + 0.25);
              g.stroke();
            }
          } else {
            // Gary's tripwire: two garden gnomes and a red laser between them
            const on = rm || Math.floor(t * 4) % 4 !== 0;
            g.setLineDash([6, 6]);
            g.lineWidth = 2;
            g.strokeStyle = on ? 'rgba(255,70,90,0.9)' : 'rgba(255,70,90,0.35)';
            g.beginPath();
            g.moveTo(d.x, d.y);
            g.lineTo(d.bx, d.by);
            g.stroke();
            g.setLineDash([]);
            for (const [gx, gy] of [
              [d.x, d.y],
              [d.bx, d.by],
            ] as const) {
              const gnome = assets.get('flight/garden_gnome_top');
              if (gnome) {
                g.drawImage(gnome, gx - 15, gy - 15, 30, 30);
                continue;
              }
              g.beginPath();
              g.arc(gx, gy, 8, 0, Math.PI * 2);
              g.fillStyle = '#d94c6a';
              g.fill();
              g.lineWidth = 2;
              g.strokeStyle = C.ink;
              g.stroke();
            }
          }
          break;
        default:
          break;
      }
    }
  }

  private drawCar(g: CanvasRenderingContext2D, key: string, x: number, y: number, heading: number, police: boolean, t: number): void {
    const spec = ART[key] ?? { w: 80, h: 150 };
    const img = this.ctx.assets.get(key);
    g.save();
    g.translate(x + 6, y + 8);
    g.rotate(heading + Math.PI / 2);
    drawShadow(g, img, spec.w, spec.h, 0.3);
    g.restore();
    g.save();
    g.translate(x, y);
    g.rotate(heading + Math.PI / 2);
    const w = spec.w;
    const h = spec.h;
    if (img) g.drawImage(img, -w / 2, -h / 2, w, h);
    else {
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
    }
    if (police) {
      // light bar: alternating red / blue
      const blue = this.ctx.reducedMotion || Math.floor(t * 6) % 2 === 0;
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, blue ? '90,140,255' : GLOW.red, -12, -6, 22, 22, 0.9);
      drawGlow(g, blue ? GLOW.red : '90,140,255', 12, -6, 22, 22, 0.9);
      g.globalCompositeOperation = 'source-over';
    }
    g.restore();
  }

  /** Every detector's honest shape: what is drawn lit is what sees you. */
  private drawDetectors(g: CanvasRenderingContext2D, t: number): void {
    const f = this.sim.field;
    const rm = this.ctx.reducedMotion;
    const st = this.sim.st;
    for (let i = 0; i < f.defs.length; i++) {
      const d = f.defs[i]!;
      switch (d.type) {
        case 'car': {
          const c = f.cars[i]![0]!;
          if (!this.visible(c.x, c.y, d.coneRange + 120)) break;
          this.cones.draw(g, c.ox, c.oy, c.cone, d.coneHalf, d.coneRange);
          g.globalCompositeOperation = 'lighter';
          drawGlow(g, GLOW.warm, c.ox, c.oy, 34, 34, 0.85);
          g.globalCompositeOperation = 'source-over';
          if (d.barR > 0) {
            // light-bar radius: a red/blue disc with a rotating sweep
            const blue = rm || Math.floor(t * 6) % 2 === 0;
            g.beginPath();
            g.arc(c.x, c.y, d.barR, 0, Math.PI * 2);
            g.fillStyle = blue ? 'rgba(90,140,255,0.14)' : 'rgba(255,93,115,0.14)';
            g.fill();
            g.lineWidth = 3;
            g.strokeStyle = blue ? 'rgba(120,170,255,0.75)' : 'rgba(255,110,130,0.75)';
            g.stroke();
            if (!rm) {
              const a = f.a[i]!;
              g.beginPath();
              g.moveTo(c.x, c.y);
              g.arc(c.x, c.y, d.barR, a, a + 0.6);
              g.closePath();
              g.fillStyle = blue ? 'rgba(90,140,255,0.22)' : 'rgba(255,93,115,0.22)';
              g.fill();
            }
          }
          break;
        }
        case 'traffic':
          for (const c of f.cars[i]!) {
            if (!c.live || !this.visible(c.x, c.y, d.coneRange + 80)) continue;
            this.cones.draw(g, c.ox, c.oy, c.cone, d.coneHalf, d.coneRange, '255,236,170', 0.25);
          }
          break;
        case 'porch': {
          if (!this.visible(d.x, d.y, d.r + 20)) break;
          const slot = f.porchSlot[i]!;
          const lit = st.porchLit[slot]!;
          const arm = st.porchArm[slot]!;
          if (lit > 0) {
            const flick = lit < 0.5 && !rm ? (Math.floor(t * 20) % 2 === 0 ? 0.5 : 1) : 1;
            g.globalCompositeOperation = 'lighter';
            drawGlow(g, '255,226,150', d.x, d.y, d.r * 1.08, d.r * 1.08, 0.75 * flick);
            g.globalCompositeOperation = 'source-over';
            g.beginPath();
            g.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            g.lineWidth = 3;
            g.strokeStyle = `rgba(255,226,150,${(0.8 * flick).toFixed(2)})`;
            g.stroke();
          }
          // motion-sensor range: dotted, and it fills as it arms
          g.setLineDash([4, 10]);
          g.lineWidth = 2;
          g.strokeStyle = arm > 0 ? 'rgba(255,190,110,0.8)' : 'rgba(255,226,150,0.28)';
          g.beginPath();
          g.arc(d.x, d.y, d.trigger, 0, Math.PI * 2);
          g.stroke();
          g.setLineDash([]);
          if (arm > 0 && lit <= 0) {
            g.lineWidth = 5;
            g.strokeStyle = C.amber;
            g.beginPath();
            g.arc(d.x, d.y, d.trigger, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, arm / PORCH.arm));
            g.stroke();
          }
          break;
        }
        case 'watcher': {
          if (!this.visible(d.x, d.y, d.range + 40)) break;
          // binocular cone, cold white; the glint warns of the snap to the next angle
          this.cones.draw(g, d.x, d.y, f.a[i]!, d.half, d.range, '200,220,255', 0.55);
          if (f.tell[i]) {
            const a = f.b[i]!;
            g.setLineDash([10, 10]);
            g.lineWidth = 2;
            g.strokeStyle = 'rgba(200,220,255,0.55)';
            g.beginPath();
            g.moveTo(d.x, d.y);
            g.arc(d.x, d.y, d.range, a - d.half, a + d.half);
            g.closePath();
            g.stroke();
            g.setLineDash([]);
            const k = rm ? 1 : 0.6 + 0.4 * Math.sin(t * 30);
            g.globalCompositeOperation = 'lighter';
            drawGlow(g, GLOW.white, d.x, d.y, 30 * k, 30 * k, 0.9);
            g.globalCompositeOperation = 'source-over';
          }
          g.globalCompositeOperation = 'lighter';
          drawGlow(g, GLOW.amber, d.x, d.y, 40, 40, 0.7);
          g.globalCompositeOperation = 'source-over';
          if (this.visible(d.x, d.y, 40)) text(g, '👁', d.x, d.y - 28, 20, C.text, 'center', 700);
          void WATCHER_TELL;
          break;
        }
        case 'dog': {
          if (!this.visible(d.x, d.y, d.rMax + 20)) break;
          const r = f.a[i]!;
          const peak = (r - d.rMin) / (d.rMax - d.rMin);
          g.beginPath();
          g.arc(d.x, d.y, r, 0, Math.PI * 2);
          g.globalAlpha = 0.08 + peak * 0.12;
          g.fillStyle = '#ff8c3c';
          g.fill();
          g.setLineDash([14, 12]);
          g.lineDashOffset = rm ? 0 : -t * 30;
          g.lineWidth = 4;
          g.globalAlpha = 0.45 + peak * 0.5;
          g.strokeStyle = '#ffaa5a';
          g.stroke();
          g.setLineDash([]);
          g.globalAlpha = 1;
          if (st.cause === i) outlinedText(g, 'WOOF!', d.x, d.y - 50, 26, C.amberHi, C.ink, 900);
          void barkRadius;
          break;
        }
        case 'heli': {
          const x = f.x2[i]!;
          const y = f.y2[i]!;
          if (!this.visible(x, y, d.spotR + 40)) break;
          g.globalCompositeOperation = 'lighter';
          drawGlow(g, '210,230,255', x, y, d.spotR * 1.12, d.spotR * 1.12, 0.85);
          g.globalCompositeOperation = 'source-over';
          g.beginPath();
          g.arc(x, y, d.spotR, 0, Math.PI * 2);
          g.lineWidth = 3;
          g.strokeStyle = 'rgba(220,235,255,0.85)';
          g.stroke();
          break;
        }
        case 'camera':
          if (!this.visible(d.x, d.y, d.range + 20)) break;
          this.cones.draw(g, d.x, d.y, f.a[i]!, d.half, d.range, '190,255,220', 0.5);
          break;
        case 'window': {
          if (!this.visible(d.x, d.y, d.r + 120)) break;
          const on = f.on[i] === 1;
          const tell = f.tell[i] === 1;
          const flick = tell && !rm ? (Math.sin(t * 40) > 0.2 ? 1 : 0) : tell ? 1 : 0;
          const img = this.ctx.assets.get('flight/office_window_lit');
          if (on || flick) {
            g.globalAlpha = on ? 1 : 0.6;
            if (img) g.drawImage(img, d.wx - 20, d.wy - 12, 40, 24);
            else {
              g.fillStyle = '#ffe9a8';
              g.fillRect(d.wx - 18, d.wy - 10, 36, 20);
            }
            g.globalAlpha = 1;
          } else {
            g.fillStyle = '#2a2c48';
            g.fillRect(d.wx - 18, d.wy - 10, 36, 20);
          }
          if (on) {
            g.globalCompositeOperation = 'lighter';
            drawGlow(g, '255,233,168', d.x, d.y, d.r * 1.1, d.r * 1.1, 0.7);
            g.globalCompositeOperation = 'source-over';
            g.beginPath();
            g.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            g.lineWidth = 3;
            g.strokeStyle = 'rgba(255,233,168,0.8)';
            g.stroke();
          } else if (tell) {
            g.setLineDash([8, 10]);
            g.beginPath();
            g.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            g.lineWidth = 2;
            g.strokeStyle = 'rgba(255,233,168,0.5)';
            g.stroke();
            g.setLineDash([]);
          }
          break;
        }
        case 'neon':
          if (this.visible(d.x, d.y, d.r)) this.drawNeon(g, i, t);
          break;
        default:
          break;
      }
    }
  }

  private drawNeon(g: CanvasRenderingContext2D, i: number, t: number): void {
    const f = this.sim.field;
    const d = f.defs[i]!;
    if (d.type !== 'neon') return;
    const on = f.on[i] === 1;
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.pink, d.x, d.y, d.r, d.r, on ? 0.55 : 0.12);
    g.globalCompositeOperation = 'source-over';
    g.beginPath();
    g.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    g.setLineDash([3, 9]);
    g.lineWidth = 2;
    g.strokeStyle = on ? 'rgba(255,110,210,0.6)' : 'rgba(255,110,210,0.2)';
    g.stroke();
    g.setLineDash([]);
    const img = this.ctx.assets.get('flight/billboard_top');
    if (img) g.drawImage(img, d.x - 110, d.y - 25, 220, 50);
    else panel(g, d.x - 110, d.y - 25, 220, 50, '#22102a', 10, C.ink, 3, 3);
    g.font = font(24, 900);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const buzz = !this.ctx.reducedMotion && Math.sin(t * 63) > 0.6;
    if (on && !buzz) {
      g.lineWidth = 4;
      g.strokeStyle = '#ff4fc8';
      g.strokeText(d.text, d.x, d.y + 1);
      g.fillStyle = '#ffe6f7';
    } else g.fillStyle = '#6a3a60';
    g.fillText(d.text, d.x, d.y + 1);
  }

  /** Things above the street: wires, the crane boom, flocks, the helicopter. */
  private drawSkyHazards(g: CanvasRenderingContext2D, t: number): void {
    const f = this.sim.field;
    const assets = this.ctx.assets;
    const rm = this.ctx.reducedMotion;
    for (let i = 0; i < f.defs.length; i++) {
      const d = f.defs[i]!;
      switch (d.type) {
        case 'wire': {
          const minX = Math.min(d.ax, d.bx);
          const maxX = Math.max(d.ax, d.bx);
          const minY = Math.min(d.ay, d.by);
          const maxY = Math.max(d.ay, d.by);
          if (maxX < this.sim.camX - 20 || minX > this.sim.camX + VIEW_W + 20 || maxY < this.sim.camY - 20 || minY > this.sim.camY + VIEW_H + 20) break;
          const len = Math.hypot(d.bx - d.ax, d.by - d.ay) || 1;
          const nx = -(d.by - d.ay) / len;
          const ny = (d.bx - d.ax) / len;
          const midx = (d.ax + d.bx) / 2;
          const midy = (d.ay + d.by) / 2 + POWER_LINE.sag;
          const flash = this.lineFlash[i]!;
          const tram = d.kind === 'tram';
          for (let pass = 0; pass < 2; pass++) {
            const lift = pass === 0 ? 0 : -1.2;
            g.lineWidth = pass === 0 ? (tram ? 4 : 3) : 1;
            g.strokeStyle = pass === 0 ? '#0b0818' : tram ? 'rgba(255,220,160,0.55)' : 'rgba(176,186,255,0.5)';
            if (flash > 0) {
              g.strokeStyle = '#fff096';
              g.globalAlpha = pass === 0 ? 0.5 + flash * 0.5 : flash;
            }
            for (let k = -1; k <= 1; k += 2) {
              const ox = nx * k * POWER_LINE.wireGap + lift;
              const oy = ny * k * POWER_LINE.wireGap + lift;
              g.beginPath();
              g.moveTo(d.ax + ox, d.ay + oy);
              g.quadraticCurveTo(midx + ox, midy + oy, d.bx + ox, d.by + oy);
              g.stroke();
            }
            g.globalAlpha = 1;
          }
          for (const [px, py] of [
            [d.ax, d.ay],
            [d.bx, d.by],
          ] as const) {
            g.beginPath();
            g.arc(px, py, tram ? 7 : POWER_LINE.poleR, 0, Math.PI * 2);
            g.fillStyle = tram ? '#7a7f95' : '#6b4a2e';
            g.fill();
            g.lineWidth = 3;
            g.strokeStyle = C.ink;
            g.stroke();
          }
          break;
        }
        case 'crane': {
          if (!this.visible(d.x, d.y, d.len + 40)) break;
          const a = f.a[i]!;
          const base = assets.get('flight/crane_base');
          if (base) g.drawImage(base, d.x - 60, d.y - 60, 120, 120);
          else {
            g.fillStyle = '#c9a23a';
            g.fillRect(d.x - 40, d.y - 40, 80, 80);
          }
          g.save();
          g.translate(d.x, d.y);
          g.rotate(a);
          const boom = assets.get('flight/crane_boom');
          // shadow first
          g.fillStyle = 'rgba(0,0,0,0.25)';
          g.fillRect(14, -d.width / 2 + 18, d.len, d.width);
          if (boom) g.drawImage(boom, -60 * (d.len / 460), -25 * (d.width / 50) * 1, 520 * (d.len / 460), 50 * (d.width / 50));
          else {
            g.fillStyle = '#f2c230';
            g.fillRect(-30, -d.width / 2, d.len + 30, d.width);
            g.strokeStyle = C.ink;
            g.lineWidth = 3;
            g.strokeRect(-30, -d.width / 2, d.len + 30, d.width);
            g.lineWidth = 2;
            g.beginPath();
            for (let k = 0; k < d.len; k += 26) {
              g.moveTo(k, -d.width / 2);
              g.lineTo(k + 13, d.width / 2);
              g.lineTo(k + 26, -d.width / 2);
            }
            g.stroke();
          }
          // hook light at the tip
          g.globalCompositeOperation = 'lighter';
          drawGlow(g, GLOW.red, d.len, 0, 18, 18, rm || Math.floor(t * 2) % 2 === 0 ? 0.9 : 0.3);
          g.globalCompositeOperation = 'source-over';
          g.restore();
          break;
        }
        case 'flock': {
          const x = f.x[i]!;
          const y = f.y[i]!;
          if (!this.visible(x, y, d.r + 60)) break;
          const key = d.kind === 'bat' ? 'flight/bat_flock' : 'flight/pigeon_flock';
          const img = assets.get(key);
          g.save();
          g.translate(x, y);
          g.rotate(f.a[i]! + Math.PI / 2);
          const flap = rm ? 1 : 0.8 + 0.2 * Math.sin(t * 22 + i);
          if (img) g.drawImage(img, -60, -45 * flap, 120, 90 * flap);
          else {
            g.strokeStyle = d.kind === 'bat' ? '#1b1433' : '#8a8fa8';
            g.lineWidth = 4;
            g.lineCap = 'round';
            for (let k = 0; k < 7; k++) {
              const bx = ((k * 37) % 70) - 35;
              const by = ((k * 23) % 60) - 30;
              const w = 12 * flap;
              g.beginPath();
              g.moveTo(bx - w, by - 4 * flap);
              g.lineTo(bx, by + 3);
              g.lineTo(bx + w, by - 4 * flap);
              g.stroke();
            }
            g.lineCap = 'butt';
          }
          g.restore();
          // honest bump radius
          g.beginPath();
          g.arc(x, y, d.r, 0, Math.PI * 2);
          g.lineWidth = 2;
          g.strokeStyle = 'rgba(241,238,255,0.25)';
          g.stroke();
          break;
        }
        case 'heli': {
          const x = f.x[i]!;
          const y = f.y[i]!;
          // beam from the heli to its spot
          const sx = f.x2[i]!;
          const sy = f.y2[i]!;
          if (this.visible(x, y, 160) || this.visible(sx, sy, 160)) {
            g.globalCompositeOperation = 'lighter';
            g.strokeStyle = 'rgba(200,220,255,0.18)';
            g.lineWidth = 26;
            g.beginPath();
            g.moveTo(x, y);
            g.lineTo(sx, sy);
            g.stroke();
            g.globalCompositeOperation = 'source-over';
          }
          if (!this.visible(x, y, 160)) break;
          g.save();
          g.translate(x + 30, y + 40);
          g.globalAlpha = 0.3;
          g.fillStyle = '#000';
          g.beginPath();
          g.ellipse(0, 0, 50, 70, f.a[i]! + Math.PI / 2, 0, Math.PI * 2);
          g.fill();
          g.restore();
          g.save();
          g.translate(x, y);
          g.rotate(f.a[i]! + Math.PI / 2);
          const body = assets.get('flight/helicopter_top');
          if (body) g.drawImage(body, -100, -100, 200, 200);
          else {
            g.fillStyle = '#2a3048';
            g.beginPath();
            g.ellipse(0, 0, 34, 52, 0, 0, Math.PI * 2);
            g.fill();
            g.lineWidth = 3;
            g.strokeStyle = C.ink;
            g.stroke();
            g.fillRect(-6, 40, 12, 60);
          }
          const rotor = assets.get('flight/helicopter_rotor');
          g.rotate(rm ? 0.4 : t * 25);
          if (rotor) g.drawImage(rotor, -110, -110, 220, 220);
          else {
            g.strokeStyle = 'rgba(200,210,230,0.5)';
            g.lineWidth = 8;
            g.beginPath();
            g.moveTo(-100, 0);
            g.lineTo(100, 0);
            g.moveTo(0, -100);
            g.lineTo(0, 100);
            g.stroke();
          }
          g.restore();
          break;
        }
        default:
          break;
      }
    }
  }

  // ================================================================ HUD

  private drawHud(g: CanvasRenderingContext2D, t: number): void {
    const assets = this.ctx.assets;
    const rm = this.ctx.reducedMotion;
    const sim = this.sim;
    const run = this.run;
    hudButton(g, this.quit, 'close', 'QUIT', this.quit.pressedDown);
    const f = this.fuse;
    f.value = sim.st.sus;
    f.exposed = this.state === 'fly' && sim.st.cause >= 0;
    f.t = t;
    f.reduced = rm;
    hudFuse(g, 88, HUD_ROW.y, 300, HUD_ROW.h, f, assets.get('ui/eye_closed'), assets.get('ui/eye_open'));
    const sec = Math.floor(run.elapsed * 4);
    if (sec !== this.clockSec) {
      this.clockSec = sec;
      this.clockText = run.clockText();
    }
    hudSunClock(g, 396, HUD_ROW.y, 130, HUD_ROW.h, this.clockText, run.elapsed / run.budget, run.dawn, t, rm, assets.get('ui/sunrise_clock'));

    // target list
    const m = this.level.map;
    let x = 14;
    const y = HUD_ROW.y + HUD_ROW.h + 10;
    for (let i = 0; i < 3; i++) {
      const tg = m.targets[i]!;
      const done = sim.delivered[i];
      g.font = font(15, 800);
      const w = g.measureText(tg.short).width + 40;
      hudPanel(g, x, y, w, 34, done ? C.mintDeep : C.ink);
      g.beginPath();
      g.arc(x + 15, y + 17, 7, 0, Math.PI * 2);
      if (done) {
        g.fillStyle = C.mint;
        g.fill();
      } else {
        g.lineWidth = 2.5;
        g.strokeStyle = C.mint;
        g.stroke();
      }
      text(g, tg.short, x + 27, y + 18, 15, done ? C.muted : C.text, 'left', 800);
      x += w + 8;
    }
    // minimap
    this.drawMinimap(g, VIEW_W - MINI_W - 14, y);

    // off-screen arrows to the targets that remain
    for (let i = 0; i < 3; i++) {
      if (sim.delivered[i]) continue;
      const b = m.targets[i]!.building;
      drawTargetArrow(g, assets, b, sim.camX, sim.camY, m.targets[i]!.short, C.mint, t + i, rm, 230, 180);
    }

    // shift banner
    if (this.bannerT > 0 && this.state === 'fly') {
      const a = clamp(Math.min((3 - this.bannerT) * 4, this.bannerT * 2), 0, 1);
      g.globalAlpha = a;
      hudPanel(g, 60, 400, VIEW_W - 120, 86, C.mint);
      text(g, `WORK ORDER #000${this.level.num} · SUNRISE AT ${this.level.hours[1]}:00`, VIEW_W / 2, 424, 14, C.mint, 'center', 900);
      text(g, 'Collect all three before dawn', VIEW_W / 2, 452, 20, C.text, 'center', 800);
      text(g, 'Seen for 1 second = spotted', VIEW_W / 2, 474, 14, C.amberHi, 'center', 700);
      g.globalAlpha = 1;
    }

    if (this.zibT > 0 && this.state !== 'spotted') drawZibBubble(g, assets, this.zibText, this.zibT, t, rm, this.zibPanic);
  }

  private drawMinimap(g: CanvasRenderingContext2D, x: number, y: number): void {
    const m = this.level.map;
    const k = MINI_W / m.w;
    const h = m.h * k;
    panel(g, x - 3, y - 3, MINI_W + 6, h + 6, 'rgba(27,20,51,0.78)', 8, C.ink, 2, 0);
    g.fillStyle = 'rgba(124,255,203,0.07)';
    for (const r of m.roads) {
      if (r.dir === 'h') g.fillRect(x + r.from * k, y + (r.at - 60) * k, (r.to - r.from) * k, 120 * k);
      else g.fillRect(x + (r.at - 60) * k, y + r.from * k, 120 * k, (r.to - r.from) * k);
    }
    // the view
    g.strokeStyle = 'rgba(241,238,255,0.35)';
    g.lineWidth = 1;
    g.strokeRect(x + this.sim.camX * k, y + this.sim.camY * k, VIEW_W * k, VIEW_H * k);
    for (let i = 0; i < 3; i++) {
      const b = m.targets[i]!.building;
      g.beginPath();
      g.arc(x + b.x * k, y + b.y * k, 4, 0, Math.PI * 2);
      g.fillStyle = this.sim.delivered[i] ? '#4a4470' : C.mint;
      g.fill();
    }
    const s = this.sim.saucer;
    g.beginPath();
    g.arc(x + s.x * k, y + s.y * k, 3.5, 0, Math.PI * 2);
    g.fillStyle = C.amberHi;
    g.fill();
  }

  /** Photo-flash freeze: the shot that got you, a caption and Zib's excuse. */
  private drawSpotted(g: CanvasRenderingContext2D, t: number): void {
    const rm = this.ctx.reducedMotion;
    const st = this.st;
    g.fillStyle = 'rgba(12,6,30,0.45)';
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    if (st < 0.18) {
      g.fillStyle = `rgba(255,255,255,${((1 - st / 0.18) * (rm ? 0.25 : 0.95)).toFixed(3)})`;
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    // polaroid frame round the middle of the view
    g.save();
    g.translate(VIEW_W / 2, 430);
    g.rotate(rm ? 0 : -0.05 + 0.05 * easeOutBack(Math.min(1, st / 0.3)));
    g.lineWidth = 16;
    g.strokeStyle = '#f4efe2';
    g.strokeRect(-190, -150, 380, 270);
    g.fillStyle = '#f4efe2';
    g.fillRect(-198, 120, 396, 56);
    text(g, this.spotCause === 'watcher' ? 'EXHIBIT A (Mrs. Pruitt)' : 'EXHIBIT A', 0, 148, 19, C.paperInk, 'center', 800, true);
    g.restore();
    const k = rm ? 1 : easeOutBack(st / 0.35);
    drawPyjamaHuman(g, 420, 1060 - k * 250, t, this.shout);
    const pop = rm ? 1 : easeOutBack((st - 0.04) / 0.3);
    g.save();
    g.translate(VIEW_W / 2, 176);
    g.rotate(-0.08);
    g.scale(pop, pop);
    const stamp = this.ctx.assets.get('ui/stamp_spotted');
    if (stamp) g.drawImage(stamp, -150, -75, 300, 150);
    else outlinedText(g, 'SPOTTED!', 0, 0, 80, C.amberHi, C.ink, 900);
    g.restore();
    if (st > 0.2) {
      panel(g, 40, 750, VIEW_W - 80, 94, C.paper, 18, C.ink, 3, 4);
      paragraph(g, this.caption, 60, 762, VIEW_W - 120, 18, C.paperInk, 24, 'center', 700, true);
    }
    if (st > 0.35) {
      panel(g, 40, 856, VIEW_W - 80, 74, C.ink, 18, C.mint, 2, 0);
      paragraph(g, `Zib: ${this.spotLine}`, 58, 866, VIEW_W - 116, 16, C.mint, 21, 'left', 700);
    }
    // respawn countdown under the stamp
    const left = Math.max(0, SPOT_HOLD - st);
    if (left > 0) text(g, 'back to the last checkpoint…', VIEW_W / 2, 262, 15, C.text, 'center', 700);
    void FLIGHT_HUD;
  }
}
