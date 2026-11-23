// Deep-level flight scene (L3+): renders DeepFlightSim, runs the sunrise clock, the 1-second
// fuse, the photo-flash SPOTTED freeze and respawn at the checkpoint.
//
// Everything drawn for a detector reads its shape from the sampled HazardField, so the drawn
// shape is the hit shape; the tells layered on top (ghost cones, arming arcs, countdown rings,
// the tether to whoever sees you) are decoration and never move a detector.
import type { FlightAutopilotIntent, GameContext, Scene, Vec2 } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts';
import { ART } from '../art-manifest';
import { deepZibLine, spotCaption, spotShout, spotZibLine, type DeepZibEvent } from '../levels/humor';
import { fmt, gt, langVersion, localArt, num, tr } from '../i18n';
import type { DeepRun } from '../levels/run';
import type { DeepLevelDef, PropDef, PropKind } from '../levels/types';
import { GLOW, P_RING, P_SPARK, P_STAR, P_TWINKLE, PC, Particles, bitmapPx, drawEdgeTint, drawGlow, drawShadow, drawSprite, drawVignette, drawWash, easeInCubic, easeOutBack, radialSprite } from '../core/fx';
import { clamp, headKey, outlinedText, panel, paragraph, roundRectPath, text } from '../ui/draw';
import { HUD_ROW, hudButton, hudFuse, hudPanel, hudSunClock, type FuseState } from '../ui/hud';
import { C, font } from '../ui/theme';
import { Button } from '../ui/widgets';
import { Ambient } from './ambient';
import { FlightAutopilot } from './autopilot';
import { DeepFlightSim, SAFE_WINDOW } from './deep-sim';
import { ConeSprites, drawEntryRing, drawJunctions, drawRoad, drawSaucer, drawTargetArrow, drawZibBubble } from './draw-common';
import { pointInCone } from './geometry';
import { CRANE_TAIL, PORCH, TRAFFIC_SCALE, WATCHER_TELL, type SpotCause } from './hazards';
import { drawDog, drawProp, propSize } from './props';
import { FLIGHT_HUD, POWER_LINE, RING_R, SUSPICION } from './sim';
import { SpottedPhoto, drawWitness } from './spotted';

const LOCK_ANIM = 0.9;
/** The SPOTTED freeze lasts this long before the respawn (tap skips after SPOT_SKIP). */
const SPOT_HOLD = 1.35;
const SPOT_SKIP = 0.4;
const SHADOW_OFF: Partial<Record<PropKind, number>> = { suburb_house: 13, highrise: 16, civic: 15, tree: 13, hedge: 5, trampoline: 4 };
const MINI_W = 84;
const TAU = Math.PI * 2;
/** Radius of the fuse ring drawn round the saucer while something can see it. */
const FUSE_R = FLIGHT_HUD.saucer / 2 + 21;

// dash patterns and colours, built once
const NO_DASH: number[] = [];
const DASH_SENSOR = [4, 10];
const DASH_GHOST = [14, 10];
const DASH_TELL = [10, 9];
const DASH_BARK = [14, 12];
const DASH_WIRE = [6, 6];
const DASH_TETHER = [3, 9];
const DASH_NEON = [3, 9];
const RED = '#ff5d73';
const NIGHT = '#0a0828';
const CONE_HEAD = '255,236,170';
const CONE_WATCH = '200,220,255';
const CONE_CCTV = '255,150,165';
const BLUE = '90,140,255';

/** A delivered specimen is missed, eventually (lines by short name, in src/i18n: flight.missed). */
function missedLines(short: string): readonly string[] | undefined {
  return (tr().flight.missed as Record<string, readonly string[]>)[short];
}

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
  private readonly fx = new Particles(128);
  private readonly cones = new ConeSprites();
  private readonly fuse: FuseState = { value: 0, exposed: false, t: 0, reduced: false, seconds: 1 };
  private readonly seen = new Set<string>();
  private readonly lineFlash: Float32Array;
  private readonly speckles: Float32Array;
  private readonly ambient: Ambient;
  private readonly photo = new SpottedPhoto();
  /** Last drawn angle of each cone, and which way it is sweeping (-1 / 0 / +1). */
  private readonly prevA: Float32Array;
  private readonly lead: Int8Array;
  /** Last drawn position and smoothed velocity of each helicopter spot (x, y pairs). */
  private readonly prevSpot: Float32Array;
  private readonly spotVel: Float32Array;
  private readonly chipW = new Float32Array(3);
  private readonly origin = { x: 0, y: 0 };
  private miniLayer: HTMLCanvasElement | null = null;
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
  private wasExposed = false;
  private wasDawn = false;
  private caption = '';
  private shout = '';
  private spotLine = '';
  private spotCause: SpotCause = 'police';
  private photoPending = false;
  private done = false;
  private bannerT = 0;
  private gagNear = -1;
  private lampGlow: HTMLCanvasElement | null = null;
  private clockText = '';
  private clockSec = -1;
  private lastRenderT = -1;
  /** Seconds since the last respawn at a checkpoint, or -1. */
  private cpT = -1;
  /** Counts down after coming back with a specimen: the "n of 3" banner and the chip pop. */
  private deliverT = 0;
  private deliveredIdx = -1;

  constructor(private readonly opts: DeepFlightOptions) {
    this.ctx = opts.ctx;
    this.level = opts.level;
    this.run = opts.run;
    this.sim = new DeepFlightSim(this.level.map, this.ctx.upgrades, this.run.elapsed);
    for (let i = 0; i < 3; i++) if (this.run.delivered[i]) this.sim.markDelivered(i);
    const sp = this.run.spawn;
    this.sim.place(sp.x, sp.y, this.run.legs === 0 && this.run.spotted === 0 ? 0.4 : SAFE_WINDOW);
    this.fuse.seconds = 1 / (SUSPICION.rate * this.sim.mult);
    const n = this.level.map.hazards.length;
    this.lineFlash = new Float32Array(n);
    this.prevA = new Float32Array(n);
    this.lead = new Int8Array(n);
    this.prevSpot = new Float32Array(n * 2);
    this.spotVel = new Float32Array(n * 2);
    const m = this.level.map;
    this.ambient = new Ambient(m);
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
    else if (this.run.legs > 0 && this.run.deliveredCount > 0 && this.run.lastFail === null) {
      this.say('checkpoint', true);
      // back from a successful abduction: count it
      this.deliverT = 2.6;
      this.deliveredIdx = this.run.order[this.run.order.length - 1] ?? -1;
      this.cpT = 0;
      this.checkpointBurst(sp.x, sp.y);
    }
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
    this.zibText = deepZibLine(evt, this.zibN++ + this.run.spotted);
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
    this.deliverT = Math.max(0, this.deliverT - dt);
    if (this.cpT >= 0 && (this.cpT += dt) > 1.7) this.cpT = -1;
    for (let i = 0; i < this.lineFlash.length; i++) this.lineFlash[i] = Math.max(0, this.lineFlash[i]! - dt * 3);
    this.st += dt;
    this.fx.update(dt);
    this.ambient.update(dt, this.sim.saucer.x, this.sim.saucer.y);

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
    const rm = this.ctx.reducedMotion;
    // ---- events
    if (st.dashed) {
      audio.sfx('dash');
      if (!this.seen.has('dash')) {
        this.seen.add('dash');
        this.say('dash', true);
      }
      if (!rm) this.fx.burst(P_SPARK, s.x, s.y, 10, 160, 320, 0.3, 4, PC.amber, 0, 3);
    }
    if (st.click >= 0) {
      audio.sfx('click', 0.9);
      if (!this.seen.has('porch')) {
        this.seen.add('porch');
        this.say('porch', true, true);
      }
      // the click: a ring snaps out to the edge of the light
      const d = field.defs[st.click]!;
      if (d.type === 'porch') {
        this.fx.spawn(P_RING, d.x, d.y, 0, 0, 0.34, d.r, PC.amber);
        if (!rm) this.fx.burst(P_SPARK, d.x, d.y, 6, 120, 220, 0.25, 3, PC.amber, 0, 3);
      }
    }
    if (st.bump >= 0) {
      const cause = field.bumpCause(st.bump);
      this.lineFlash[st.bump] = 1;
      audio.sfx('bonk', 0.8);
      this.fx.burst(P_STAR, s.x, s.y - 30, rm ? 2 : 4, 120, 260, 0.55, 11, PC.amber, 0, 2.2);
      if (!rm) {
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
      // caught in something's sight: a red snap round the saucer
      if (!this.wasExposed) this.fx.spawn(P_RING, s.x, s.y, 0, 0, 0.28, 96, PC.red);
    } else {
      this.exposedT = 0;
      this.alertT = 0;
    }
    this.wasExposed = exposed;
    this.barkT -= dt;

    if (sim.phase === 'spotted') {
      this.state = 'spotted';
      this.st = 0;
      this.flashT = 0.18;
      this.photoPending = true;
      this.wasExposed = false;
      const cause = sim.spottedBy >= 0 ? field.spotCause(sim.spottedBy) : 'police';
      this.spotCause = cause;
      const seed = this.run.spotted * 7 + Math.floor(this.ctx.time * 3);
      this.caption = spotCaption(cause, seed);
      this.shout = spotShout(cause, seed);
      this.spotLine = spotZibLine(cause, seed);
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
    this.cpT = 0;
    this.fx.clear();
    this.checkpointBurst(pos.x, pos.y);
    this.say('respawn', true);
  }

  /** The saucer beams back in at a checkpoint. */
  private checkpointBurst(x: number, y: number): void {
    const fx = this.fx;
    fx.spawn(P_RING, x, y, 0, 0, 0.6, 170, PC.mint);
    fx.spawn(P_RING, x, y, 0, 0, 0.4, 100, PC.white);
    if (this.ctx.reducedMotion) return;
    // sparkles fall back in on the saucer
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const idx = fx.spawn(P_TWINKLE, x + Math.cos(a) * 150, y + Math.sin(a) * 150, -Math.sin(a) * 160, Math.cos(a) * 160, 0.55, 10, i % 3 === 0 ? PC.white : PC.mint, 0, 3);
      fx.home(idx, x, y, 40);
    }
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
    const rdt = this.lastRenderT < 0 ? 0 : Math.min(0.1, Math.max(0, t - this.lastRenderT));
    this.lastRenderT = t;
    this.lampGlow ??= radialSprite('flight-lamp', [
      [0, 'rgba(255,200,110,0.45)'],
      [1, 'rgba(255,200,110,0)'],
    ]);
    const shx = this.shake > 0 && !rm ? Math.sin(t * 80) * 7 * this.shake : 0;
    const shy = this.shake > 0 && !rm ? Math.cos(t * 67) * 5 * this.shake : 0;
    // the camera sits on whole device pixels, so cached sprites and ground tiles copy straight across
    const px = bitmapPx();
    const cx = Math.round(sim.camX * px) / px;
    const cy = Math.round(sim.camY * px) / px;
    const locking = this.state === 'locking';
    const lockK = locking ? Math.min(1, this.st / LOCK_ANIM) : 0;
    const theme = m.theme;
    const dawn = this.run.dawn;
    this.trackSweeps(rdt);

    g.save();
    if (locking && !rm) {
      const z = 1 + 0.24 * easeInCubic(lockK);
      g.translate(s.x - cx, s.y - cy);
      g.scale(z, z);
      g.translate(-(s.x - cx), -(s.y - cy));
    }
    g.translate(-cx + shx, -cy + shy);

    // ground and roads are opaque tiles on the pixel grid: no resampling needed
    g.imageSmoothingEnabled = locking || shx !== 0;
    this.drawGround(g, cx, cy);
    for (const r of m.roads) drawRoad(g, assets, r, theme, cx, cy);
    g.imageSmoothingEnabled = true;
    drawJunctions(g, m.roads, theme);
    for (const p of m.groundProps) if (this.visible(p.x, p.y, 260)) drawProp(g, assets, p);
    this.ambient.drawGround(g, cx, cy, t, rm);

    // shadows, then buildings
    for (const p of m.props) if (this.visible(p.x, p.y, 240)) this.propShadow(g, p);
    for (const tg of m.targets) if (this.visible(tg.building.x, tg.building.y, 300)) this.propShadow(g, tg.building);
    for (const p of m.props) if (this.visible(p.x, p.y, 240)) drawProp(g, assets, p);
    for (let i = 0; i < 3; i++) this.drawTarget(g, i, t);
    this.drawCheckpoint(g, t);

    this.drawGroundHazards(g, t);
    this.ambient.drawSteam(g, cx, cy, t, rm);

    // saucer shadow on the ground
    const bob = rm ? 0 : Math.sin(t * 2.4) * 0.5 + 0.5;
    drawGlow(g, GLOW.dark, s.x + 22 + bob * 5, s.y + 34 + bob * 7, 66 - bob * 5, 58 - bob * 5, 0.7);

    // night wash, thinning as the sky warms
    g.globalAlpha = 0.3 - dawn * 0.2;
    g.fillStyle = NIGHT;
    g.fillRect(cx - 20, cy - 20, VIEW_W + 40, VIEW_H + 40);
    g.globalAlpha = 1;

    // ---- lights (additive)
    g.globalCompositeOperation = 'lighter';
    if (this.lampGlow) {
      g.globalAlpha = 1 - dawn * 0.6;
      for (const l of m.lamps) if (this.visible(l.x, l.y, 120)) g.drawImage(this.lampGlow, l.x - 100, l.y - 100, 200, 200);
      g.globalAlpha = 1;
    }
    this.ambient.drawLights(g, cx, cy, t, rm, dawn);
    drawGlow(g, GLOW.mint, s.x, s.y + 4, 86, 86, 0.2 + bob * 0.06 + lockK * 0.5);
    g.globalCompositeOperation = 'source-over';
    this.ambient.drawCritters(g, cx, cy, t, rm, s.x, s.y);
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

    if (this.cpT >= 0) this.drawBeamIn(g, t);
    drawSaucer(g, assets, s, t, rm, { locking, st: this.st, wobble: sim.field.scramble(s.x, s.y), dash: sim.afterburner ? sim.st.dash : null, ghost: sim.st.safe, ghostMax: SAFE_WINDOW });
    this.drawFuseRing(g, t);
    this.fx.draw(g);
    g.restore();

    if (this.photoPending && this.state === 'spotted') {
      // the frame that got you, before the HUD goes on top of it
      this.photoPending = false;
      this.photo.grab(g, s.x - cx, s.y - cy);
    }

    if (dawn > 0) {
      // first light comes in low from the east
      drawWash(g, GLOW.dawn, 0.05, 1, 0.95, 0, dawn * 0.62);
      this.drawEarlyBirds(g, t, dawn);
    }
    drawVignette(g, 0.9 - dawn * 0.35);
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

  /** Which way each sweeping detector is turning, and how fast each searchlight spot is moving. */
  private trackSweeps(dt: number): void {
    const f = this.sim.field;
    for (let i = 0; i < f.defs.length; i++) {
      const d = f.defs[i]!;
      if (d.type === 'camera' || d.type === 'watcher' || d.type === 'car') {
        const a = d.type === 'car' ? f.cars[i]![0]!.cone : f.a[i]!;
        const da = Math.atan2(Math.sin(a - this.prevA[i]!), Math.cos(a - this.prevA[i]!));
        if (Math.abs(da) > 0.0004 && Math.abs(da) < 0.3) this.lead[i] = da > 0 ? 1 : -1;
        else if (Math.abs(da) >= 0.3) this.lead[i] = 0;
        this.prevA[i] = a;
      } else if (d.type === 'heli') {
        const x = f.x2[i]!;
        const y = f.y2[i]!;
        if (dt > 0) {
          const vx = (x - this.prevSpot[i * 2]!) / dt;
          const vy = (y - this.prevSpot[i * 2 + 1]!) / dt;
          if (Math.abs(vx) < 3000 && Math.abs(vy) < 3000) {
            this.spotVel[i * 2] = this.spotVel[i * 2]! + (vx - this.spotVel[i * 2]!) * 0.25;
            this.spotVel[i * 2 + 1] = this.spotVel[i * 2 + 1]! + (vy - this.spotVel[i * 2 + 1]!) * 0.25;
          }
        }
        this.prevSpot[i * 2] = x;
        this.prevSpot[i * 2 + 1] = y;
      }
    }
  }

  private drawGround(g: CanvasRenderingContext2D, cx: number, cy: number): void {
    const m = this.level.map;
    const img = this.ctx.assets.get(m.theme === 'suburb' ? 'flight/ground_suburb' : 'flight/ground_city');
    if (img) {
      const T = 540;
      const x0 = Math.floor(cx / T) * T;
      const y0 = Math.floor(cy / T) * T;
      for (let y = y0; y < cy + VIEW_H; y += T) for (let x = x0; x < cx + VIEW_W; x += T) drawSprite(g, img, x, y, T + 0.5, T + 0.5, true);
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
    // the low sun stretches the shadows out as dawn comes
    const long = 1 + this.run.dawn * 0.8;
    g.save();
    g.translate(p.x + off * long, p.y + off * 1.15 * long);
    if (p.rot) g.rotate(p.rot);
    drawShadow(g, img, w, h, 0.36);
    g.restore();
  }

  private drawTarget(g: CanvasRenderingContext2D, i: number, t: number): void {
    const tg = this.level.map.targets[i]!;
    const b = tg.building;
    if (!this.visible(b.x, b.y, 300)) return;
    const done = this.sim.delivered[i];
    const rm = this.ctx.reducedMotion;
    const ts = propSize(b);
    if (!done) {
      const pulse = rm ? 0.5 : 0.5 + 0.5 * Math.sin(t * 3 + i);
      roundRectPath(g, b.x - ts.w / 2 - 10, b.y - ts.h / 2 - 10, ts.w + 20, ts.h + 20, 20);
      g.globalAlpha = 0.08 + 0.08 * pulse;
      g.fillStyle = C.mint;
      g.fill();
      g.globalAlpha = 1;
    }
    drawProp(g, this.ctx.assets, b);
    if (!done) return;
    g.globalAlpha = 0.85;
    panel(g, b.x - 62, b.y - 20, 124, 40, 'rgba(27,20,51,0.85)', 20, C.mint, 2, 0);
    g.globalAlpha = 1;
    tick(g, b.x - 44, b.y, 7, C.mint);
    text(g, tr().flight.collected, b.x + 10, b.y + 1, 14, C.mint, 'center', 900, false, 92);
    // somebody has noticed: a worried voice from the house, now and then
    const lines = missedLines(tg.short);
    if (!lines) return;
    const cycle = (t * 0.16 + i * 0.37) % 1;
    if (cycle > 0.36) return;
    const k = cycle / 0.36;
    const a = Math.min(1, k * 8, (1 - k) * 6);
    const line = lines[Math.floor(t * 0.16 + i * 0.37) % lines.length]!;
    const by = b.y - ts.h / 2 - 34 - (rm ? 0 : Math.sin(k * Math.PI) * 6);
    g.globalAlpha = a;
    g.font = font(15, 800, true);
    const w = Math.min(250, g.measureText(line).width + 28);
    panel(g, b.x - w / 2, by - 17, w, 34, C.paper, 17, C.ink, 2.5, 3);
    g.beginPath();
    g.moveTo(b.x - 8, by + 16);
    g.lineTo(b.x, by + 28);
    g.lineTo(b.x + 8, by + 16);
    g.fillStyle = C.paper;
    g.fill();
    text(g, line, b.x, by + 1, 15, C.paperInk, 'center', 800, true, w - 20);
    g.globalAlpha = 1;
  }

  /** A little flag where a spotted saucer comes back: the ring of the last delivery. */
  private drawCheckpoint(g: CanvasRenderingContext2D, t: number): void {
    if (this.run.deliveredCount === 0) return;
    const c = this.run.checkpoint;
    if (!this.visible(c.x, c.y, 80)) return;
    const rm = this.ctx.reducedMotion;
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.mint, c.x, c.y, 54, 54, 0.22 + (rm ? 0 : 0.08 * Math.sin(t * 3)));
    g.globalCompositeOperation = 'source-over';
    g.setLineDash(DASH_SENSOR);
    g.lineDashOffset = rm ? 0 : -t * 14;
    g.beginPath();
    g.arc(c.x, c.y, 46, 0, TAU);
    g.lineWidth = 2.5;
    g.strokeStyle = C.mint;
    g.globalAlpha = 0.7;
    g.stroke();
    g.setLineDash(NO_DASH);
    g.lineDashOffset = 0;
    g.globalAlpha = 1;
    // pole and pennant
    const wave = rm ? 0 : Math.sin(t * 5) * 3;
    g.lineWidth = 6;
    g.strokeStyle = C.ink;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(c.x - 8, c.y + 16);
    g.lineTo(c.x - 8, c.y - 22);
    g.stroke();
    g.lineWidth = 3;
    g.strokeStyle = '#d9d0ea';
    g.stroke();
    g.lineCap = 'butt';
    g.beginPath();
    g.moveTo(c.x - 7, c.y - 22);
    g.quadraticCurveTo(c.x + 8, c.y - 24 + wave, c.x + 20, c.y - 14);
    g.quadraticCurveTo(c.x + 8, c.y - 8 - wave, c.x - 7, c.y - 6);
    g.closePath();
    g.fillStyle = C.mint;
    g.fill();
    g.lineWidth = 2.5;
    g.lineJoin = 'round';
    g.strokeStyle = C.ink;
    g.stroke();
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
          this.drawCar(g, c.key, c.x, c.y, c.heading, d.role === 'police', t, 1);
          break;
        }
        case 'traffic':
          for (const c of f.cars[i]!) if (c.live && this.visible(c.x, c.y, 120)) this.drawCar(g, c.key, c.x, c.y, c.heading, false, t, TRAFFIC_SCALE);
          break;
        case 'dog':
          if (this.visible(d.x, d.y, 80)) drawDog(g, assets, d.x, d.y, t, this.sim.st.cause === i, rm);
          break;
        case 'porch': {
          if (!this.visible(d.x, d.y, d.r)) break;
          if (d.mount === 'post') drawPost(g, d.x, d.y, 34, 5, 11);
          const img = assets.get('flight/porch_light_top');
          if (img) drawSprite(g, img, d.x - 15, d.y - 15, 30, 30);
          else {
            g.beginPath();
            g.arc(d.x, d.y, 9, 0, TAU);
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
          if (d.mount === 'pole') drawPost(g, d.x, d.y, 58, 7, 15);
          g.save();
          g.translate(d.x, d.y);
          g.rotate(f.a[i]! + Math.PI / 2);
          const img = assets.get('flight/security_cam_top');
          if (img) drawSprite(g, img, -20, -20, 40, 40);
          else {
            roundRectPath(g, -9, -16, 18, 28, 4);
            g.fillStyle = '#c9cbd8';
            g.fill();
            g.lineWidth = 3;
            g.strokeStyle = C.ink;
            g.stroke();
            g.fillStyle = RED;
            g.beginPath();
            g.arc(0, -14, 4, 0, TAU);
            g.fill();
          }
          g.restore();
          break;
        }
        case 'gag':
          if (!this.visible(d.x, d.y, 160)) break;
          if (d.kind === 'sprinkler') {
            const img = assets.get('flight/sprinkler_top');
            if (img) drawSprite(g, img, d.x - 20, d.y - 20, 40, 40);
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
            g.setLineDash(DASH_WIRE);
            g.lineWidth = 2;
            g.strokeStyle = on ? 'rgba(255,70,90,0.9)' : 'rgba(255,70,90,0.35)';
            g.beginPath();
            g.moveTo(d.x, d.y);
            g.lineTo(d.bx, d.by);
            g.stroke();
            g.setLineDash(NO_DASH);
            this.drawGnome(g, d.x, d.y);
            this.drawGnome(g, d.bx, d.by);
          }
          break;
        default:
          break;
      }
    }
  }

  private drawGnome(g: CanvasRenderingContext2D, x: number, y: number): void {
    const gnome = this.ctx.assets.get('flight/garden_gnome_top');
    if (gnome) {
      drawSprite(g, gnome, x - 15, y - 15, 30, 30);
      return;
    }
    g.beginPath();
    g.arc(x, y, 8, 0, TAU);
    g.fillStyle = '#d94c6a';
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = C.ink;
    g.stroke();
  }

  private drawCar(g: CanvasRenderingContext2D, key: string, x: number, y: number, heading: number, police: boolean, t: number, scale: number): void {
    const spec = ART[key] ?? { w: 80, h: 150 };
    const img = this.ctx.assets.get(key);
    const w = spec.w * scale;
    const h = spec.h * scale;
    g.save();
    g.translate(x + 6 * scale, y + 8 * scale);
    g.rotate(heading + Math.PI / 2);
    drawShadow(g, img, w, h, 0.3);
    g.restore();
    g.save();
    g.translate(x, y);
    g.rotate(heading + Math.PI / 2);
    if (img) drawSprite(g, img, -w / 2, -h / 2, w, h);
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
      drawGlow(g, blue ? BLUE : GLOW.red, -12, -6, 22, 22, 0.9);
      drawGlow(g, blue ? GLOW.red : BLUE, 12, -6, 22, 22, 0.9);
      g.globalCompositeOperation = 'source-over';
    }
    g.restore();
  }

  /** 0 when hazard i is not the one seeing the saucer; otherwise a 0.55..1 pulse. */
  private hot(i: number, t: number): number {
    if (this.state !== 'fly' || this.sim.st.cause !== i) return 0;
    return this.ctx.reducedMotion ? 0.8 : 0.55 + 0.45 * Math.abs(Math.sin(t * 16));
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
          const hot = this.hot(i, t);
          this.cones.draw(g, c.ox, c.oy, c.cone, d.coneHalf, d.coneRange, CONE_HEAD, 0.5, hot, this.lead[i]!);
          g.globalCompositeOperation = 'lighter';
          drawGlow(g, GLOW.warm, c.ox, c.oy, 34, 34, 0.85);
          g.globalCompositeOperation = 'source-over';
          if (d.barR > 0) {
            // light-bar radius: a red/blue disc with a rotating sweep
            const blue = rm || Math.floor(t * 6) % 2 === 0;
            g.beginPath();
            g.arc(c.x, c.y, d.barR, 0, TAU);
            g.fillStyle = blue ? 'rgba(90,140,255,0.14)' : 'rgba(255,93,115,0.14)';
            g.fill();
            g.lineWidth = hot > 0 ? 4.5 : 3;
            g.strokeStyle = hot > 0 ? RED : blue ? 'rgba(120,170,255,0.8)' : 'rgba(255,110,130,0.8)';
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
        case 'traffic': {
          const hot = this.hot(i, t);
          for (const c of f.cars[i]!) {
            if (!c.live || !this.visible(c.x, c.y, d.coneRange + 80)) continue;
            const mine = hot > 0 && pointInCone(st.s.x, st.s.y, c.ox, c.oy, c.cone, d.coneHalf, d.coneRange) ? hot : 0;
            this.cones.draw(g, c.ox, c.oy, c.cone, d.coneHalf, d.coneRange, CONE_HEAD, 0.4, mine);
          }
          break;
        }
        case 'porch':
          if (this.visible(d.x, d.y, d.r + 20)) this.drawPorch(g, i, t);
          break;
        case 'watcher':
          if (this.visible(d.x, d.y, d.range + 40)) this.drawWatcher(g, i, t);
          break;
        case 'dog': {
          if (!this.visible(d.x, d.y, d.rMax + 20)) break;
          const r = f.a[i]!;
          const peak = (r - d.rMin) / (d.rMax - d.rMin);
          const hot = this.hot(i, t);
          g.beginPath();
          g.arc(d.x, d.y, r, 0, TAU);
          g.globalAlpha = 0.08 + peak * 0.12;
          g.fillStyle = hot > 0 ? RED : '#ff8c3c';
          g.fill();
          g.setLineDash(DASH_BARK);
          g.lineDashOffset = rm ? 0 : -t * 30;
          g.lineWidth = hot > 0 ? 5.5 : 4;
          g.globalAlpha = 0.5 + peak * 0.5;
          g.strokeStyle = hot > 0 ? RED : '#ffaa5a';
          g.stroke();
          g.setLineDash(NO_DASH);
          g.lineDashOffset = 0;
          // the bark's reach at full stretch, so the pulse can be timed
          g.globalAlpha = 0.22;
          g.lineWidth = 1.5;
          g.beginPath();
          g.arc(d.x, d.y, d.rMax, 0, TAU);
          g.stroke();
          g.globalAlpha = 1;
          if (st.cause === i) outlinedText(g, tr().flight.woof, d.x, d.y - 50, 26, C.amberHi, C.ink, 900);
          break;
        }
        case 'heli':
          if (this.visible(f.x2[i]!, f.y2[i]!, d.spotR + 60)) this.drawSearchlight(g, i, t);
          break;
        case 'camera': {
          if (!this.visible(d.x, d.y, d.range + 20)) break;
          const hot = this.hot(i, t);
          const a = f.a[i]!;
          this.cones.draw(g, d.x, d.y, a, d.half, d.range, CONE_CCTV, 0.75, hot, this.lead[i]!);
          // scan line running out along the cone, and the REC light
          const k = rm ? 0.6 : (t * 0.9 + i * 0.37) % 1;
          g.beginPath();
          g.arc(d.x, d.y, d.range * k, a - d.half, a + d.half);
          g.lineWidth = 2;
          g.strokeStyle = '#ffd2d8';
          g.globalAlpha = 0.55 * (1 - k);
          g.stroke();
          g.globalAlpha = 1;
          if (rm || Math.floor(t * 2.5 + i) % 2 === 0) {
            g.globalCompositeOperation = 'lighter';
            drawGlow(g, GLOW.red, d.x, d.y, 15, 15, 1);
            g.globalCompositeOperation = 'source-over';
          }
          break;
        }
        case 'window':
          if (this.visible(d.x, d.y, d.r + 120)) this.drawWindow(g, i, t);
          break;
        case 'neon':
          if (this.visible(d.x, d.y, d.r)) this.drawNeon(g, i, t);
          break;
        default:
          break;
      }
    }
  }

  /**
   * Motion-sensor light. Idle: the dotted sensor range. Arming (0.4 s): an arc fills round the
   * sensor range and the pool it is about to light is ghosted in. Lit: the hard-edged pool, with
   * an arc that runs down the 3 s.
   */
  private drawPorch(g: CanvasRenderingContext2D, i: number, t: number): void {
    const f = this.sim.field;
    const d = f.defs[i]!;
    if (d.type !== 'porch') return;
    const st = this.sim.st;
    const rm = this.ctx.reducedMotion;
    const slot = f.porchSlot[i]!;
    const lit = st.porchLit[slot]!;
    const arm = st.porchArm[slot]!;
    const hot = this.hot(i, t);
    if (lit > 0) {
      const flick = lit < 0.5 && !rm ? (Math.floor(t * 20) % 2 === 0 ? 0.5 : 1) : 1;
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.lamp, d.x, d.y, d.r * 1.08, d.r * 1.08, 0.7 * flick);
      g.globalCompositeOperation = 'source-over';
      g.beginPath();
      g.arc(d.x, d.y, d.r, 0, TAU);
      g.lineWidth = hot > 0 ? 4.5 : 2.5;
      g.strokeStyle = hot > 0 ? RED : '#ffe296';
      g.globalAlpha = 0.85 * flick;
      g.stroke();
      // time left on the timer
      g.beginPath();
      g.arc(d.x, d.y, d.r - 7, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, lit / PORCH.lit));
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.strokeStyle = '#fff3c4';
      g.globalAlpha = 0.75 * flick;
      g.stroke();
      g.lineCap = 'butt';
      g.globalAlpha = 1;
    }
    // motion-sensor range: dotted, and it fills as it arms
    g.setLineDash(DASH_SENSOR);
    g.lineWidth = 2;
    g.strokeStyle = arm > 0 ? '#ffbe6e' : '#ffe296';
    g.globalAlpha = arm > 0 ? 0.85 : 0.3;
    g.beginPath();
    g.arc(d.x, d.y, d.trigger, 0, TAU);
    g.stroke();
    g.setLineDash(NO_DASH);
    g.globalAlpha = 1;
    if (arm > 0 && lit <= 0) {
      const k = Math.min(1, arm / PORCH.arm);
      // the pool it is about to light
      g.beginPath();
      g.arc(d.x, d.y, d.r, 0, TAU);
      g.fillStyle = C.amber;
      g.globalAlpha = 0.05 + 0.1 * k;
      g.fill();
      g.setLineDash(DASH_GHOST);
      g.lineDashOffset = rm ? 0 : -t * 90;
      g.lineWidth = 3.5;
      g.strokeStyle = C.amber;
      g.globalAlpha = 0.35 + 0.6 * k;
      g.stroke();
      g.setLineDash(NO_DASH);
      g.lineDashOffset = 0;
      g.globalAlpha = 1;
      g.lineWidth = 6;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(d.x, d.y, d.trigger, -Math.PI / 2, -Math.PI / 2 + TAU * k);
      g.stroke();
      g.lineCap = 'butt';
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.amber, d.x, d.y, 22 + 20 * k, 22 + 20 * k, 0.95);
      g.globalCompositeOperation = 'source-over';
    } else if (lit <= 0 && (rm || (t * 0.45 + i * 0.31) % 1 < 0.08)) {
      // the sensor's standby blink
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.red, d.x, d.y, 9, 9, 0.9);
      g.globalCompositeOperation = 'source-over';
    }
  }

  /**
   * Mrs. Pruitt. Her binocular cone is what sees you. For the last 0.45 s before she snaps to the
   * next angle, that next cone is ghosted in amber and fills as the snap comes.
   */
  private drawWatcher(g: CanvasRenderingContext2D, i: number, t: number): void {
    const f = this.sim.field;
    const d = f.defs[i]!;
    if (d.type !== 'watcher') return;
    const rm = this.ctx.reducedMotion;
    const hot = this.hot(i, t);
    const a = f.a[i]!;
    this.cones.draw(g, d.x, d.y, a, d.half, d.range, CONE_WATCH, 0.7, hot, this.lead[i]!);
    if (f.tell[i]) {
      const b = f.b[i]!;
      const tau = f.t - Math.floor(f.t / d.hold) * d.hold;
      const k = clamp((tau - (d.hold - WATCHER_TELL)) / WATCHER_TELL, 0, 1);
      const beat = rm ? 1 : 0.7 + 0.3 * Math.sin(t * 34);
      g.beginPath();
      g.moveTo(d.x, d.y);
      g.arc(d.x, d.y, d.range, b - d.half, b + d.half);
      g.closePath();
      g.fillStyle = C.amber;
      g.globalAlpha = (0.08 + 0.2 * k) * beat;
      g.fill();
      g.setLineDash(DASH_GHOST);
      g.lineDashOffset = rm ? 0 : -t * 120;
      g.lineWidth = 4;
      g.lineJoin = 'round';
      g.strokeStyle = C.amberHi;
      g.globalAlpha = 0.55 + 0.45 * k;
      g.stroke();
      g.setLineDash(NO_DASH);
      g.lineDashOffset = 0;
      // the swing she is about to make
      let da = b - a;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      const r = Math.min(150, d.range * 0.3);
      g.beginPath();
      g.arc(d.x, d.y, r, a, a + da * k, da < 0);
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.globalAlpha = 0.9;
      g.stroke();
      const ha = a + da * k;
      const hx = d.x + Math.cos(ha) * r;
      const hy = d.y + Math.sin(ha) * r;
      const dir = ha + (da < 0 ? -1 : 1) * (Math.PI / 2);
      g.beginPath();
      g.moveTo(hx + Math.cos(dir) * 12, hy + Math.sin(dir) * 12);
      g.lineTo(hx + Math.cos(dir + 2.5) * 11, hy + Math.sin(dir + 2.5) * 11);
      g.lineTo(hx + Math.cos(dir - 2.5) * 11, hy + Math.sin(dir - 2.5) * 11);
      g.closePath();
      g.fillStyle = C.amberHi;
      g.fill();
      g.lineCap = 'butt';
      g.globalAlpha = 1;
      // the glint off the lenses
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.white, d.x, d.y, 34 * beat, 34 * beat, 0.95);
      g.globalCompositeOperation = 'source-over';
    }
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.amber, d.x, d.y, 40, 40, 0.7);
    g.globalCompositeOperation = 'source-over';
    if (this.visible(d.x, d.y, 40)) {
      drawEye(g, d.x, d.y - 28, f.tell[i] ? f.b[i]! : a);
      if (f.tell[i]) outlinedText(g, '!', d.x + 22, d.y - 34, 24, C.amberHi, C.ink, 900);
    }
  }

  /**
   * The helicopter's spot: a hard double edge (the hit circle), ticks that turn with it, and an
   * arc on the side it is travelling towards. The glow is kept thin so the ground still reads.
   */
  private drawSearchlight(g: CanvasRenderingContext2D, i: number, t: number): void {
    const f = this.sim.field;
    const d = f.defs[i]!;
    if (d.type !== 'heli') return;
    const rm = this.ctx.reducedMotion;
    const x = f.x2[i]!;
    const y = f.y2[i]!;
    const hot = this.hot(i, t);
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.cold, x, y, d.spotR * 1.05, d.spotR * 1.05, 0.5);
    g.globalCompositeOperation = 'source-over';
    g.beginPath();
    g.arc(x, y, d.spotR, 0, TAU);
    g.globalAlpha = 0.12;
    g.fillStyle = '#dbe8ff';
    g.fill();
    g.globalAlpha = 0.5;
    g.lineWidth = 8;
    g.strokeStyle = '#0b0818';
    g.stroke();
    g.globalAlpha = 1;
    g.lineWidth = hot > 0 ? 5 : 3.5;
    g.strokeStyle = hot > 0 ? RED : '#eaf2ff';
    g.stroke();
    // ticks, turning slowly
    const turn = rm ? 0 : t * 0.8;
    g.lineWidth = 4;
    g.lineCap = 'round';
    g.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = turn + (k * Math.PI) / 2;
      g.moveTo(x + Math.cos(a) * (d.spotR - 14), y + Math.sin(a) * (d.spotR - 14));
      g.lineTo(x + Math.cos(a) * (d.spotR + 10), y + Math.sin(a) * (d.spotR + 10));
    }
    g.stroke();
    // where it is heading
    const vx = this.spotVel[i * 2]!;
    const vy = this.spotVel[i * 2 + 1]!;
    const sp = Math.hypot(vx, vy);
    if (sp > 30) {
      const a = Math.atan2(vy, vx);
      g.strokeStyle = C.amberHi;
      g.lineWidth = 5;
      for (let k = 0; k < 2; k++) {
        const r = d.spotR + 16 + k * 14;
        const w = 0.5 - k * 0.16;
        g.globalAlpha = 0.9 - k * 0.4;
        g.beginPath();
        g.arc(x, y, r, a - w, a + w);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    g.lineCap = 'butt';
  }

  /**
   * Insomniac office window. Off: a faint dotted outline of the pool. Tell (0.6 s): the pool
   * flickers on and off inside an amber dashed ring. On: the hard-edged pool and the shaft of
   * light from the window.
   */
  private drawWindow(g: CanvasRenderingContext2D, i: number, t: number): void {
    const f = this.sim.field;
    const d = f.defs[i]!;
    if (d.type !== 'window') return;
    const rm = this.ctx.reducedMotion;
    const on = f.on[i] === 1;
    const tell = f.tell[i] === 1;
    const flick = tell && !rm ? (Math.sin(t * 40) > 0.2 ? 1 : 0) : tell ? 1 : 0;
    const hot = this.hot(i, t);
    const img = this.ctx.assets.get('flight/office_window_lit');
    if (on || flick) {
      // the shaft from the window to its pool
      const dx = d.x - d.wx;
      const dy = d.y - d.wy;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      g.globalCompositeOperation = 'lighter';
      g.beginPath();
      g.moveTo(d.wx + nx * 16, d.wy + ny * 16);
      g.lineTo(d.x + nx * d.r, d.y + ny * d.r);
      g.lineTo(d.x - nx * d.r, d.y - ny * d.r);
      g.lineTo(d.wx - nx * 16, d.wy - ny * 16);
      g.closePath();
      g.fillStyle = '#ffe9a8';
      g.globalAlpha = on ? 0.16 : 0.1;
      g.fill();
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    // the window lies along its facade: turned a quarter for east and west walls
    g.save();
    g.translate(d.wx, d.wy);
    if (Math.abs(d.x - d.wx) > Math.abs(d.y - d.wy)) g.rotate(Math.PI / 2);
    if (on || flick) {
      g.globalAlpha = on ? 1 : 0.7;
      if (img) drawSprite(g, img, -20, -12, 40, 24);
      else {
        g.fillStyle = '#ffe9a8';
        g.fillRect(-18, -10, 36, 20);
      }
      g.globalAlpha = 1;
      if (on) {
        // somebody is standing there
        g.fillStyle = '#3a2f5a';
        g.beginPath();
        g.arc(rm ? 0 : Math.sin(t * 0.9 + i) * 6, 1, 5.5, 0, TAU);
        g.fill();
      }
    } else {
      g.fillStyle = '#2a2c48';
      g.fillRect(-18, -10, 36, 20);
    }
    g.restore();
    if (on) {
      g.globalCompositeOperation = 'lighter';
      // kept thin, like the searchlight: an entry ring under the pool must still read
      drawGlow(g, '255,233,168', d.x, d.y, d.r * 1.1, d.r * 1.1, 0.46);
      g.globalCompositeOperation = 'source-over';
      g.beginPath();
      g.arc(d.x, d.y, d.r, 0, TAU);
      g.lineWidth = hot > 0 ? 4.5 : 3.5;
      g.strokeStyle = hot > 0 ? RED : '#ffe9a8';
      g.globalAlpha = 0.9;
      g.stroke();
      g.globalAlpha = 1;
    } else if (tell) {
      if (flick) {
        g.globalCompositeOperation = 'lighter';
        drawGlow(g, '255,233,168', d.x, d.y, d.r * 1.05, d.r * 1.05, 0.38);
        g.globalCompositeOperation = 'source-over';
      }
      g.beginPath();
      g.arc(d.x, d.y, d.r, 0, TAU);
      g.fillStyle = C.amber;
      g.globalAlpha = 0.09;
      g.fill();
      g.setLineDash(DASH_TELL);
      g.lineDashOffset = rm ? 0 : -t * 110;
      g.lineWidth = 4;
      g.strokeStyle = C.amberHi;
      g.globalAlpha = 0.95;
      g.stroke();
      g.setLineDash(NO_DASH);
      g.lineDashOffset = 0;
      g.globalAlpha = 1;
    } else {
      g.setLineDash(DASH_SENSOR);
      g.beginPath();
      g.arc(d.x, d.y, d.r, 0, TAU);
      g.lineWidth = 2;
      g.strokeStyle = '#ffe9a8';
      g.globalAlpha = 0.2;
      g.stroke();
      g.setLineDash(NO_DASH);
      g.globalAlpha = 1;
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
    g.arc(d.x, d.y, d.r, 0, TAU);
    g.setLineDash(DASH_NEON);
    g.lineWidth = 2;
    g.strokeStyle = on ? 'rgba(255,110,210,0.6)' : 'rgba(255,110,210,0.2)';
    g.stroke();
    g.setLineDash(NO_DASH);
    const img = this.ctx.assets.get('flight/billboard_top');
    if (img) drawSprite(g, img, d.x - 110, d.y - 25, 220, 50);
    else panel(g, d.x - 110, d.y - 25, 220, 50, '#22102a', 10, C.ink, 3, 3);
    g.font = font(24, 900);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const buzz = !this.ctx.reducedMotion && Math.sin(t * 63) > 0.6;
    if (on && !buzz) {
      g.lineWidth = 4;
      g.strokeStyle = '#ff4fc8';
      g.strokeText(gt(d.text), d.x, d.y + 1, 200);
      g.fillStyle = '#ffe6f7';
    } else g.fillStyle = '#6a3a60';
    g.fillText(gt(d.text), d.x, d.y + 1, 200);
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
          drawPole(g, d.ax, d.ay, tram);
          drawPole(g, d.bx, d.by, tram);
          break;
        }
        case 'crane': {
          if (!this.visible(d.x, d.y, d.len + 40)) break;
          const a = f.a[i]!;
          const base = assets.get('flight/crane_base');
          if (base) drawSprite(g, base, d.x - 60, d.y - 60, 120, 120);
          else {
            g.fillStyle = '#c9a23a';
            g.fillRect(d.x - 40, d.y - 40, 80, 80);
          }
          const tail = d.len * CRANE_TAIL;
          // shadow first: the boom's shape, offset down-right in world space like every other shadow
          g.save();
          g.translate(d.x + 14, d.y + 18);
          g.rotate(a);
          g.fillStyle = 'rgba(0,0,0,0.25)';
          g.fillRect(-tail, -d.width / 2, d.len + tail, d.width);
          g.restore();
          g.save();
          g.translate(d.x, d.y);
          g.rotate(a);
          const boom = assets.get('flight/crane_boom');
          if (boom) drawSprite(g, boom, -tail, -d.width / 2, d.len + tail, d.width);
          else {
            g.fillStyle = '#f2c230';
            g.fillRect(-tail, -d.width / 2, d.len + tail, d.width);
            g.strokeStyle = C.ink;
            g.lineWidth = 3;
            g.strokeRect(-tail, -d.width / 2, d.len + tail, d.width);
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
          if (img) drawSprite(g, img, -60, -45, 120, 90);
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
          g.arc(x, y, d.r * (img ? flap * 0.06 + 0.94 : 1), 0, TAU);
          g.lineWidth = 2;
          g.strokeStyle = 'rgba(241,238,255,0.3)';
          g.stroke();
          break;
        }
        case 'heli': {
          const x = f.x[i]!;
          const y = f.y[i]!;
          // the beam from the helicopter down to its spot, widening as it falls
          const sx = f.x2[i]!;
          const sy = f.y2[i]!;
          if (this.visible(x, y, 160) || this.visible(sx, sy, 160)) {
            const dx = sx - x;
            const dy = sy - y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            g.globalCompositeOperation = 'lighter';
            g.beginPath();
            g.moveTo(x + nx * 9, y + ny * 9);
            g.lineTo(sx + nx * d.spotR * 0.92, sy + ny * d.spotR * 0.92);
            g.lineTo(sx - nx * d.spotR * 0.92, sy - ny * d.spotR * 0.92);
            g.lineTo(x - nx * 9, y - ny * 9);
            g.closePath();
            g.fillStyle = '#c8dcff';
            g.globalAlpha = 0.1;
            g.fill();
            g.globalAlpha = 1;
            g.globalCompositeOperation = 'source-over';
          }
          if (!this.visible(x, y, 160)) break;
          g.save();
          g.translate(x + 30, y + 40);
          g.globalAlpha = 0.3;
          g.fillStyle = '#000';
          g.beginPath();
          g.ellipse(0, 0, 50, 70, f.a[i]! + Math.PI / 2, 0, TAU);
          g.fill();
          g.restore();
          g.save();
          g.translate(x, y);
          g.rotate(f.a[i]! + Math.PI / 2);
          const body = assets.get('flight/helicopter_top');
          if (body) drawSprite(g, body, -100, -100, 200, 200);
          else {
            g.fillStyle = '#2a3048';
            g.beginPath();
            g.ellipse(0, 0, 34, 52, 0, 0, TAU);
            g.fill();
            g.lineWidth = 3;
            g.strokeStyle = C.ink;
            g.stroke();
            g.fillRect(-6, 40, 12, 60);
          }
          // the rotor: a blurred disc with the blades flickering through it
          g.globalAlpha = 0.13;
          g.fillStyle = '#dfe6ff';
          g.beginPath();
          g.arc(0, 0, 104, 0, TAU);
          g.fill();
          g.globalAlpha = rm ? 1 : 0.75;
          const rotor = assets.get('flight/helicopter_rotor');
          g.rotate(rm ? 0.4 : t * 25);
          if (rotor) drawSprite(g, rotor, -110, -110, 220, 220);
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
          g.globalAlpha = 1;
          g.restore();
          break;
        }
        default:
          break;
      }
    }
  }

  /**
   * While something can see the saucer, the 1-second fuse burns round it (the same value as the
   * HUD fuse, where your eyes already are) and a red line runs to whoever is looking.
   */
  private drawFuseRing(g: CanvasRenderingContext2D, t: number): void {
    const st = this.sim.st;
    const v = st.sus;
    if (this.state !== 'fly' || v <= 0.01) return;
    const rm = this.ctx.reducedMotion;
    const s = st.s;
    const exposed = st.cause >= 0;
    const left = 1 - v;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(s.x, s.y, FUSE_R, 0, TAU);
    g.lineWidth = 11;
    g.strokeStyle = C.ink;
    g.globalAlpha = 0.6;
    g.stroke();
    g.globalAlpha = 1;
    if (left > 0.003) {
      g.beginPath();
      g.arc(s.x, s.y, FUSE_R, -Math.PI / 2, -Math.PI / 2 + TAU * left);
      g.lineWidth = 7;
      g.strokeStyle = exposed ? RED : C.amberHi;
      g.stroke();
    }
    // the spark at the burning end
    const ea = -Math.PI / 2 + TAU * left;
    const ex = s.x + Math.cos(ea) * FUSE_R;
    const ey = s.y + Math.sin(ea) * FUSE_R;
    const fl = rm ? 1 : 0.75 + 0.25 * Math.sin(t * 47);
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, exposed ? GLOW.red : GLOW.amber, ex, ey, 20 * fl, 20 * fl, 1);
    drawGlow(g, GLOW.white, ex, ey, 8, 8, 1);
    g.globalCompositeOperation = 'source-over';
    g.lineCap = 'butt';
    if (!exposed) return;
    // who sees you
    this.causeOrigin(st.cause);
    const o = this.origin;
    const dx = o.x - s.x;
    const dy = o.y - s.y;
    const d = Math.hypot(dx, dy);
    if (d < FUSE_R + 30) return;
    const ux = dx / d;
    const uy = dy / d;
    g.setLineDash(DASH_TETHER);
    g.lineDashOffset = rm ? 0 : t * 70;
    g.lineWidth = 3.5;
    g.lineCap = 'round';
    g.strokeStyle = RED;
    g.globalAlpha = 0.5 + 0.5 * v;
    g.beginPath();
    g.moveTo(s.x + ux * (FUSE_R + 9), s.y + uy * (FUSE_R + 9));
    g.lineTo(o.x - ux * 20, o.y - uy * 20);
    g.stroke();
    g.setLineDash(NO_DASH);
    g.lineDashOffset = 0;
    g.lineCap = 'butt';
    g.globalAlpha = 1;
    if (!this.visible(o.x, o.y, 20)) return;
    const pulse = rm ? 1 : 1 + 0.18 * Math.sin(t * 20);
    g.beginPath();
    g.arc(o.x, o.y, 17 * pulse, 0, TAU);
    g.lineWidth = 4;
    g.strokeStyle = RED;
    g.stroke();
  }

  /** Where hazard i is looking from, into `this.origin`. */
  private causeOrigin(i: number): void {
    const f = this.sim.field;
    const d = f.defs[i]!;
    const o = this.origin;
    const s = this.sim.saucer;
    o.x = s.x;
    o.y = s.y;
    switch (d.type) {
      case 'car': {
        const c = f.cars[i]![0]!;
        o.x = c.x;
        o.y = c.y;
        break;
      }
      case 'traffic':
        for (const c of f.cars[i]!) {
          if (!c.live || !pointInCone(s.x, s.y, c.ox, c.oy, c.cone, d.coneHalf, d.coneRange)) continue;
          o.x = c.x;
          o.y = c.y;
          break;
        }
        break;
      case 'heli':
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
        o.x = d.x;
        o.y = d.y;
        break;
      default:
        break;
    }
  }

  /** Respawn: a column of beam light drops the saucer back on its checkpoint. */
  private drawBeamIn(g: CanvasRenderingContext2D, t: number): void {
    const s = this.sim.saucer;
    const k = this.cpT;
    const rm = this.ctx.reducedMotion;
    if (k < 0.45) {
      const a = 1 - k / 0.45;
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.mint, s.x, s.y, 110 + 60 * a, 110 + 60 * a, 0.7 * a);
      drawGlow(g, GLOW.white, s.x, s.y - 110 * a, 26 * a + 8, 190 * a + 40, (rm ? 0.4 : 0.9) * a);
      g.globalCompositeOperation = 'source-over';
    }
    const a = clamp(Math.min(k * 6, (1.7 - k) * 3), 0, 1);
    if (a <= 0) return;
    const lift = rm ? 0 : Math.min(1, k / 0.3) * 10 + Math.sin(t * 5) * 2;
    g.globalAlpha = a;
    panel(g, s.x - 70, s.y - 118 - lift, 140, 34, 'rgba(27,20,51,0.92)', 17, C.mint, 2.5, 3);
    text(g, tr().flight.checkpoint, s.x, s.y - 100 - lift, 15, C.mint, 'center', 900, false, 124);
    g.globalAlpha = 1;
  }

  /** The first birds of the morning cross the screen (screen space). */
  private drawEarlyBirds(g: CanvasRenderingContext2D, t: number, dawn: number): void {
    if (dawn < 0.3 || this.ctx.reducedMotion) return;
    g.strokeStyle = '#2b2350';
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.globalAlpha = Math.min(1, (dawn - 0.3) * 4) * 0.8;
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const k = (t * 0.07 + i * 0.21) % 1;
      const x = -40 + k * (VIEW_W + 80);
      const y = 330 + i * 86 - k * 190 + Math.sin(t * 2 + i) * 8;
      const flap = Math.sin(t * 11 + i * 2) * 6;
      g.moveTo(x - 10, y - flap);
      g.lineTo(x, y + 2);
      g.lineTo(x + 10, y - flap);
    }
    g.stroke();
    g.globalAlpha = 1;
    g.lineCap = 'butt';
  }

  // ================================================================ HUD

  private drawHud(g: CanvasRenderingContext2D, t: number): void {
    const assets = this.ctx.assets;
    const rm = this.ctx.reducedMotion;
    const sim = this.sim;
    const run = this.run;
    hudButton(g, this.quit, 'close', tr().common.quit, this.quit.pressedDown);
    const f = this.fuse;
    f.value = this.state === 'spotted' ? 1 : sim.st.sus;
    f.exposed = this.state === 'spotted' || (this.state === 'fly' && sim.st.cause >= 0);
    f.t = t;
    f.reduced = rm;
    hudFuse(g, 88, HUD_ROW.y, 300, HUD_ROW.h, f, assets.get('ui/eye_closed'), assets.get('ui/eye_open'));
    const sec = Math.floor(run.elapsed * 4);
    if (sec !== this.clockSec) {
      this.clockSec = sec;
      this.clockText = run.clockText();
    }
    hudSunClock(g, 396, HUD_ROW.y, 130, HUD_ROW.h, this.clockText, run.elapsed / run.budget, run.dawn, t, rm, assets.get('ui/sunrise_clock'));

    // specimens: a mugshot each, stamped when collected
    const m = this.level.map;
    const y = HUD_ROW.y + HUD_ROW.h + 10;
    this.drawChips(g, y);
    // minimap
    this.drawMinimap(g, VIEW_W - MINI_W - 14, y, t);

    // Off-screen arrows to the targets that remain: kept below the minimap (marker 48 px, label
    // under it), hidden once any of the building or its rings is on screen, and not over the
    // SPOTTED freeze.
    if (this.state !== 'spotted') {
      const top = Math.max(230, Math.ceil(y + (m.h * MINI_W) / m.w + 3 + 24 + 8));
      for (let i = 0; i < 3; i++) {
        if (sim.delivered[i]) continue;
        const tg = m.targets[i]!;
        if (this.targetOnScreen(tg)) continue;
        drawTargetArrow(g, assets, tg.building, sim.camX, sim.camY, gt(tg.short), C.mint, t + i, rm, top, 180);
      }
    }

    // shift banner
    if (this.bannerT > 0 && this.state === 'fly') {
      const a = clamp(Math.min((3 - this.bannerT) * 4, this.bannerT * 2), 0, 1);
      g.globalAlpha = a;
      hudPanel(g, 60, 400, VIEW_W - 120, 86, C.mint);
      text(g, this.bannerTop(), VIEW_W / 2, 424, 14, C.mint, 'center', 900);
      text(g, tr().flight.collectAll, VIEW_W / 2, 452, 20, C.text, 'center', 800, false, VIEW_W - 150);
      const fuse = Math.round(this.fuse.seconds * 10) / 10;
      text(g, fmt(tr().flight.seenRule, { s: num(fuse, Number.isInteger(fuse) ? 0 : 1) }), VIEW_W / 2, 474, 14, C.amberHi, 'center', 700, false, VIEW_W - 150);
      g.globalAlpha = 1;
    } else if (this.deliverT > 0 && this.state === 'fly') this.drawDeliveredBanner(g);

    if (this.zibT > 0 && this.state !== 'spotted') drawZibBubble(g, assets, this.zibText, this.zibT, t, rm, this.zibPanic);
  }

  private chipLayer: HTMLCanvasElement | null = null;
  private chipKey = -1;

  /**
   * The three specimen chips. They only change when a specimen is collected, so they are painted
   * into a small layer and blitted; the chip that has just been collected is drawn live while it pops.
   */
  private drawChips(g: CanvasRenderingContext2D, y: number): void {
    const sim = this.sim;
    const rm = this.ctx.reducedMotion;
    const assets = this.ctx.assets;
    const popping = this.deliverT > 0 && !rm ? this.deliveredIdx : -1;
    let loaded = 0;
    for (let i = 0; i < 3; i++) if (assets.get(headKey(this.level.map.targets[i]!.short))) loaded++;
    const px = bitmapPx();
    const key = (sim.delivered[0] ? 1 : 0) + (sim.delivered[1] ? 2 : 0) + (sim.delivered[2] ? 4 : 0) + loaded * 8 + (popping + 1) * 64 + Math.round(px * 1000) * 512;
    if (key !== this.chipKey && typeof document !== 'undefined') {
      this.chipKey = key;
      const c = (this.chipLayer ??= document.createElement('canvas'));
      c.width = Math.ceil(400 * px);
      c.height = Math.ceil(46 * px);
      const v = c.getContext('2d');
      if (v) {
        v.scale(px, px);
        let x = 4;
        for (let i = 0; i < 3; i++) {
          if (i !== popping) this.drawChip(v, i, x, 4, 1);
          x += this.chipWidth(v, i) + 8;
        }
      }
    }
    if (this.chipLayer) g.drawImage(this.chipLayer, 10, y - 4, this.chipLayer.width / px, this.chipLayer.height / px);
    if (popping >= 0) {
      let x = 14;
      for (let i = 0; i < popping; i++) x += this.chipWidth(g, i) + 8;
      const pop = 1 + 0.22 * Math.max(0, Math.sin((2.6 - this.deliverT) * 7)) * Math.min(1, this.deliverT);
      this.drawChip(g, popping, x, y, pop);
    }
  }

  private chipWidth(g: CanvasRenderingContext2D, i: number): number {
    if (this.chipW[i] === 0) {
      g.font = font(15, 800);
      this.chipW[i] = g.measureText(gt(this.level.map.targets[i]!.short)).width + 58;
    }
    return this.chipW[i]!;
  }

  private drawChip(g: CanvasRenderingContext2D, i: number, x: number, y: number, pop: number): void {
    const tg = this.level.map.targets[i]!;
    const done = this.sim.delivered[i]!;
    const w = this.chipWidth(g, i);
    g.save();
    g.translate(x + w / 2, y + 17);
    g.scale(pop, pop);
    g.translate(-(x + w / 2), -(y + 17));
    hudPanel(g, x, y, w, 34, done ? C.mint : C.ink);
    g.beginPath();
    g.arc(x + 19, y + 17, 12, 0, TAU);
    g.fillStyle = done ? '#1d5a4a' : '#120d2b';
    g.fill();
    const head = this.ctx.assets.get(headKey(tg.short));
    if (head) {
      g.save();
      g.clip();
      g.globalAlpha = done ? 0.55 : 1;
      g.drawImage(head, x + 19 - 13, y + 17 - 13, 26, 30);
      g.restore();
    }
    g.lineWidth = 2;
    g.strokeStyle = done ? C.mint : '#6b63a3';
    g.beginPath();
    g.arc(x + 19, y + 17, 12, 0, TAU);
    g.stroke();
    if (done) tick(g, x + 27, y + 25, 5.5, C.mint);
    text(g, gt(tg.short), x + 38, y + 18, 15, done ? C.mint : C.text, 'left', 800);
    g.restore();
  }

  private bannerText = '';
  private bannerTop(): string {
    if (!this.bannerText) this.bannerText = fmt(tr().flight.banner, { num: this.level.num, h: this.level.hours[1] });
    return this.bannerText;
  }

  /** Back from a delivery: "2 of 3", three pips, the newest one landing with a pop. */
  private drawDeliveredBanner(g: CanvasRenderingContext2D): void {
    const rm = this.ctx.reducedMotion;
    const age = 2.6 - this.deliverT;
    const a = clamp(Math.min(age * 6, this.deliverT * 2.5), 0, 1);
    const count = this.run.deliveredCount;
    const pop = rm ? 1 : easeOutBack(age / 0.3);
    g.save();
    g.globalAlpha = a;
    g.translate(VIEW_W / 2, 300);
    g.scale(pop, pop);
    hudPanel(g, -150, -42, 300, 84, C.mint);
    text(g, tr().flight.secured, 0, -20, 14, C.mint, 'center', 900, false, 270);
    for (let i = 0; i < 3; i++) {
      const px = -118 + i * 30;
      const landed = i < count - 1 || (i === count - 1 && age > 0.45);
      const hit = i === count - 1 && !rm ? 1 + 0.6 * Math.max(0, 1 - Math.abs(age - 0.5) * 6) : 1;
      g.beginPath();
      g.arc(px, 14, 10 * hit, 0, TAU);
      g.fillStyle = landed ? C.mint : '#120d2b';
      g.fill();
      g.lineWidth = 2.5;
      g.strokeStyle = landed ? C.ink : '#6b63a3';
      g.stroke();
    }
    text(g, countText(Math.min(3, count)), 60, 15, 24, C.text, 'center', 900, false, 150);
    g.restore();
  }

  /** Any part of the target's building, or either of its rings, inside the view. */
  private targetOnScreen(tg: DeepLevelDef['map']['targets'][number]): boolean {
    const { camX, camY } = this.sim;
    const b = tg.building;
    const { w, h } = propSize(b);
    if (b.x + w / 2 > camX && b.x - w / 2 < camX + VIEW_W && b.y + h / 2 > camY && b.y - h / 2 < camY + VIEW_H) return true;
    const e0 = tg.entries[0];
    const e1 = tg.entries[1];
    return (
      (e0.x + RING_R > camX && e0.x - RING_R < camX + VIEW_W && e0.y + RING_R > camY && e0.y - RING_R < camY + VIEW_H) ||
      (e1.x + RING_R > camX && e1.x - RING_R < camX + VIEW_W && e1.y + RING_R > camY && e1.y - RING_R < camY + VIEW_H)
    );
  }

  private drawMinimap(g: CanvasRenderingContext2D, x: number, y: number, t: number): void {
    const m = this.level.map;
    const k = MINI_W / m.w;
    const h = m.h * k;
    // panel and roads never change: painted once at 2x and blitted
    if (!this.miniLayer && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = (MINI_W + 12) * 2;
      c.height = Math.ceil(h + 12) * 2;
      const v = c.getContext('2d');
      if (v) {
        v.scale(2, 2);
        panel(v, 3, 3, MINI_W + 6, h + 6, 'rgba(27,20,51,0.78)', 8, C.ink, 2, 0);
        v.fillStyle = 'rgba(124,255,203,0.09)';
        for (const r of m.roads) {
          if (r.dir === 'h') v.fillRect(6 + r.from * k, 6 + (r.at - 60) * k, (r.to - r.from) * k, 120 * k);
          else v.fillRect(6 + (r.at - 60) * k, 6 + r.from * k, 120 * k, (r.to - r.from) * k);
        }
        this.miniLayer = c;
      }
    }
    if (this.miniLayer) g.drawImage(this.miniLayer, x - 6, y - 6, this.miniLayer.width / 2, this.miniLayer.height / 2);
    // the view
    g.strokeStyle = 'rgba(241,238,255,0.35)';
    g.lineWidth = 1;
    g.strokeRect(x + this.sim.camX * k, y + this.sim.camY * k, VIEW_W * k, VIEW_H * k);
    const rm = this.ctx.reducedMotion;
    for (let i = 0; i < 3; i++) {
      const b = m.targets[i]!.building;
      const done = this.sim.delivered[i];
      g.beginPath();
      g.arc(x + b.x * k, y + b.y * k, done ? 3 : 4 + (rm ? 0 : 0.8 * Math.sin(t * 4 + i)), 0, TAU);
      g.fillStyle = done ? '#4a4470' : C.mint;
      g.fill();
    }
    const s = this.sim.saucer;
    g.beginPath();
    g.arc(x + s.x * k, y + s.y * k, 3.5, 0, TAU);
    g.fillStyle = C.amberHi;
    g.fill();
  }

  /**
   * Photo-flash freeze: the flash, Exhibit A (the shot that got you, through the witness's own
   * lens), the witness, a caption and Zib's excuse.
   */
  private drawSpotted(g: CanvasRenderingContext2D, t: number): void {
    const rm = this.ctx.reducedMotion;
    const st = this.st;
    g.fillStyle = 'rgba(12,6,30,0.62)';
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    this.photo.draw(g, VIEW_W / 2, 420, this.spotCause, st, t, rm, this.clockText);
    const pop = rm ? 1 : easeOutBack((st - 0.04) / 0.3);
    g.save();
    g.translate(VIEW_W / 2, 166);
    g.rotate(-0.08);
    g.scale(pop, pop);
    // lettered stamp art per language (ui/stamp_spotted_fr…); the words alone if it is missing
    const stamp = this.ctx.assets.get(localArt('ui/stamp_spotted'));
    if (stamp) g.drawImage(stamp, -150, -75, 300, 150);
    else outlinedText(g, tr().flight.spotted, 0, 0, 80, C.amberHi, C.ink, 900, 'center', 440);
    g.restore();
    // the witness pops up behind the caption card
    const wk = rm ? 1 : clamp((st - 0.22) / 0.3, 0, 1);
    if (wk > 0) drawWitness(g, this.spotCause, 440, 690, t, rm, rm ? 1 : easeOutBack(wk, 1.1), this.shout);
    if (st > 0.2) {
      panel(g, 40, 750, VIEW_W - 80, 94, C.paper, 18, C.ink, 3, 4);
      paragraph(g, this.caption, 60, 762, VIEW_W - 120, 18, C.paperInk, 24, 'center', 700, true);
    }
    if (st > 0.35) {
      panel(g, 40, 856, VIEW_W - 80, 74, C.ink, 18, C.mint, 2, 0);
      paragraph(g, this.spotLine, 58, 866, VIEW_W - 116, 16, C.mint, 21, 'left', 700);
      // how long until the checkpoint
      const k = clamp(st / SPOT_HOLD, 0, 1);
      g.fillStyle = 'rgba(124,255,203,0.25)';
      g.fillRect(58, 921, VIEW_W - 116, 3);
      g.fillStyle = C.mint;
      g.fillRect(58, 921, (VIEW_W - 116) * k, 3);
    }
    text(g, tr().flight.backToCheckpoint, VIEW_W / 2, 944, 13, C.muted, 'center', 700);
    // the flash goes off over everything
    if (st < 0.22) {
      g.globalAlpha = (1 - st / 0.22) * (rm ? 0.25 : 1);
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, VIEW_W, VIEW_H);
      g.globalAlpha = 1;
    }
  }
}

/** "2 of 3", built once per language. */
let counts: string[] = [];
let countsLang = -1;
function countText(n: number): string {
  if (countsLang !== langVersion()) {
    countsLang = langVersion();
    counts = [0, 1, 2, 3].map((k) => fmt(tr().flight.countOf, { n: k }));
  }
  return counts[n]!;
}

/** A tick mark centred on (x, y). */
function tick(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(x - r, y);
  g.lineTo(x - r * 0.25, y + r * 0.7);
  g.lineTo(x + r, y - r * 0.75);
  g.lineWidth = r * 0.75 + 3;
  g.strokeStyle = C.ink;
  g.stroke();
  g.lineWidth = r * 0.75;
  g.strokeStyle = color;
  g.stroke();
  g.lineCap = 'butt';
}

function drawPole(g: CanvasRenderingContext2D, x: number, y: number, tram: boolean): void {
  g.beginPath();
  g.arc(x, y, tram ? 7 : POWER_LINE.poleR, 0, TAU);
  g.fillStyle = tram ? '#7a7f95' : '#6b4a2e';
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = C.ink;
  g.stroke();
}

/**
 * A lamp or camera on its own pole, from straight above: the head hides the pole, so the pole
 * shows as its shadow, cast down-right like every other shadow, ending in the head's shadow.
 */
function drawPost(g: CanvasRenderingContext2D, x: number, y: number, len: number, w: number, head: number): void {
  const sx = x + len * 0.6;
  const sy = y + len * 0.8;
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(5,3,20,0.42)';
  g.lineWidth = w;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(sx, sy);
  g.stroke();
  g.lineCap = 'butt';
  g.beginPath();
  g.arc(sx, sy, head, 0, TAU);
  g.fillStyle = 'rgba(5,3,20,0.32)';
  g.fill();
}

/** Mrs. Pruitt's watching eye, drawn (emoji fonts are missing on some systems); it looks along `look`. */
function drawEye(g: CanvasRenderingContext2D, x: number, y: number, look: number): void {
  g.beginPath();
  g.moveTo(x - 13, y);
  g.quadraticCurveTo(x, y - 12, x + 13, y);
  g.quadraticCurveTo(x, y + 12, x - 13, y);
  g.closePath();
  g.fillStyle = '#f4efe2';
  g.fill();
  g.lineWidth = 2.5;
  g.strokeStyle = C.ink;
  g.stroke();
  const px = x + Math.cos(look) * 5;
  const py = y + Math.sin(look) * 2.5;
  g.beginPath();
  g.arc(px, py, 5, 0, TAU);
  g.fillStyle = '#3a2f5a';
  g.fill();
  g.beginPath();
  g.arc(px + 1.5, py - 1.5, 1.6, 0, TAU);
  g.fillStyle = '#f4efe2';
  g.fill();
}
