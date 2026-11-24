// Deep-level flight scene (L3+): renders DeepFlightSim, runs the sunrise clock, the 1-second
// fuse, the photo-flash SPOTTED freeze and respawn at the checkpoint.
//
// Everything drawn for a detector reads its shape from the sampled HazardField, so the drawn
// shape is the hit shape; the tells layered on top (ghost cones, arming arcs, countdown rings,
// the tether to whoever sees you) are decoration and never move a detector.
import type { Container } from 'pixi.js';
import type { FlightAutopilotIntent, GameContext, Scene, Vec2 } from '../contracts';
import { P_RING, P_SPARK, P_STAR, P_TWINKLE, PC, Particles } from '../core/fx';
import { ViewSlot } from '../core/gfx/scene';
import { deepZibLine, spotCaption, spotShout, spotZibLine, type DeepZibEvent } from '../levels/humor';
import type { DeepRun } from '../levels/run';
import type { DeepLevelDef } from '../levels/types';
import { HUD_ROW } from '../ui/hud';
import { Button } from '../ui/widgets';
import { Ambient } from './ambient';
import { FlightAutopilot } from './autopilot';
import { DeepFlightSim, SAFE_WINDOW } from './deep-sim';
import type { SpotCause } from './hazards';
// L6 clinic code
import { ambulanceScrambled } from './ambulance-draw';
// L7 cruise code
import { photoHalfPressed } from './photographer-draw';
import { DeepFlightView } from './views/deep';

export const LOCK_ANIM = 0.9;
/** The SPOTTED freeze lasts this long before the respawn (tap skips after SPOT_SKIP). */
export const SPOT_HOLD = 1.35;
const SPOT_SKIP = 0.4;
const TAU = Math.PI * 2;

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
  readonly ctx: GameContext;
  readonly level: DeepLevelDef;
  readonly run: DeepRun;
  readonly quit = new Button(14, HUD_ROW.y, 64, HUD_ROW.h, '', 'ghost', 30);
  readonly fx = new Particles(128);
  private readonly seen = new Set<string>();
  readonly lineFlash: Float32Array;
  /** L6: per hazard, the ambulance's tell flag last frame (to catch a scramble). */
  private readonly ambTell: Uint8Array;
  /** L7: per hazard, the photographer's phase last frame (to catch a half-press). */
  private readonly photoPrev: Uint8Array;
  readonly speckles: Float32Array;
  readonly ambient: Ambient;
  private autopilot: FlightAutopilot | null = null;
  st = 0;
  shake = 0;
  zibText = '';
  zibT = 0;
  private zibCd = 0;
  private zibN = 0;
  zibPanic = false;
  private alertT = 0;
  private barkT = 0;
  private flashT = 0;
  private exposedT = 0;
  private wasExposed = false;
  private wasDawn = false;
  caption = '';
  shout = '';
  spotLine = '';
  spotCause: SpotCause = 'police';
  photoCount = 0;
  private done = false;
  bannerT = 0;
  private gagNear = -1;
  /** Seconds since the last respawn at a checkpoint, or -1. */
  cpT = -1;
  /** Counts down after coming back with a specimen: the "n of 3" banner and the chip pop. */
  deliverT = 0;
  deliveredIdx = -1;

  private readonly look = new ViewSlot(() => new DeepFlightView(this));

  constructor(private readonly opts: DeepFlightOptions) {
    this.ctx = opts.ctx;
    this.level = opts.level;
    this.run = opts.run;
    this.sim = new DeepFlightSim(this.level.map, this.ctx.upgrades, this.run.elapsed);
    for (let i = 0; i < 3; i++) if (this.run.delivered[i]) this.sim.markDelivered(i);
    const sp = this.run.spawn;
    this.sim.place(sp.x, sp.y, this.run.legs === 0 && this.run.spotted === 0 ? 0.4 : SAFE_WINDOW);
    const n = this.level.map.hazards.length;
    this.lineFlash = new Float32Array(n);
    this.ambTell = new Uint8Array(n);
    this.photoPrev = new Uint8Array(n);
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
    // L6 clinic code: an ambulance bay door goes up
    if (ambulanceScrambled(field, this.ambTell) >= 0) {
      audio.sfx('siren', 0.35);
      this.say('scramble', !this.seen.has('scramble'), true);
      this.seen.add('scramble');
    }
    // L7 cruise code: a photographer half-presses on the saucer
    if (photoHalfPressed(field, this.photoPrev) >= 0) {
      audio.sfx('click', 0.5);
      this.say('framed', !this.seen.has('framed'), true);
      this.seen.add('framed');
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
    // gags: the sprinkler, Gary's tripwire and the crop circle only ever produce jokes. A tripwire
    // is measured from its middle; the others sit at (x, y).
    let near = -1;
    for (let i = 0; i < field.defs.length; i++) {
      const d = field.defs[i]!;
      if (d.type !== 'gag') continue;
      const wire = d.kind === 'tripwire';
      const cx = wire ? (d.x + d.bx) / 2 : d.x;
      const cy = wire ? (d.y + d.by) / 2 : d.y;
      if (Math.hypot(s.x - cx, s.y - cy) < (wire ? 90 : d.kind === 'cropcircle' ? 150 : 120)) near = i;
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
      this.photoCount++;
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

  get view(): Container {
    return this.look.get().root;
  }

  render(): void {
    this.look.peek()?.sync();
  }

  dispose(): void {
    this.look.destroy();
  }
}
