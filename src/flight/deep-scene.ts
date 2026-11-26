import { pointInCone } from './geometry';
// Deep-level flight scene (L3+): renders DeepFlightSim, runs the sunrise clock, the 1-second
// fuse, the photo-flash SPOTTED freeze and respawn at the checkpoint.
//
// Everything drawn for a detector reads its shape from the sampled HazardField, so the drawn
// shape is the hit shape; the tells layered on top (ghost cones, arming arcs, countdown rings,
// the tether to whoever sees you) are decoration and never move a detector.
import { huntPickup } from './hunt';
import { deepSlot } from '../levels/levels';
import type { Container } from 'pixi.js';
import { FRESH_LINE_SECONDS, readSeconds } from '../core/read-time';

/** Zib lines that comment rather than warn. */
const FLAVOUR: ReadonlySet<string> = new Set(['nearRing', 'locked', 'checkpoint', 'twoOfThree']);
import type { FlightAutopilotIntent, GameContext, Scene, Vec2 } from '../contracts';
import { VIEW_H, VIEW_W } from '../contracts'; // v4 openings
import { P_RING, P_SPARK, P_STAR, P_TWINKLE, PC, Particles } from '../core/fx';
import { ViewSlot } from '../core/gfx/scene';
import { binLid } from '../levels/deep-birch-neighbours';
import { deepStartEvent, deepZibLine, spotCaption, spotShout, spotZibLine, type DeepZibEvent } from '../levels/humor'; // v4 story
import { EggCues } from './easter-eggs'; // v4 easter eggs
import { mapPickupFeedback } from './collectible';
import { TripodLegPilot } from './invasion1953-pilot';
import { greetedPilotQueues, PILOT_QUEUE } from './invasion1953';
import { GRIMSBY_SET } from './recital'; // v4 openings
import { TIME_CAR } from './time-car';
import { TimeCarPilot } from './time-car-pilot';
import { fmt, tr } from '../i18n'; // v4 voices
import { formatOrderNumber, workOrderNumber } from '../levels/levels';
import type { DeepRun } from '../levels/run';
import type { DeepLevelDef } from '../levels/types';
import { HUD_ROW } from '../ui/hud';
import { Button } from '../ui/widgets';
import { Ambient } from './ambient';
import { FlightAutopilot } from './autopilot';
import { DeepFlightSim, SAFE_WINDOW } from './deep-sim';
import { nearHumOnset } from './monolith';
import type { SpotCause } from './hazards';
// L6 clinic code
import { ambulanceScrambled } from './ambulance-draw';
// L7 cruise code
import { photoHalfPressed } from './photographer-draw';
import { DeepFlightView } from './views/deep';

export const LOCK_ANIM = 0.9;
/**
 * The SPOTTED card stays up until the player taps (from SPOT_SKIP on). The sunrise clock charges
 * the first SPOT_HOLD seconds of it, the same penalty as when the card closed by itself; reading
 * the joke after that costs nothing.
 */
export const SPOT_HOLD = 1.35;
export const SPOT_SKIP = 0.9;
const TAU = Math.PI * 2;

export interface DeepFlightOptions {
  ctx: GameContext;
  level: DeepLevelDef;
  run: DeepRun;
  practice?: boolean;
  /** Locked onto (target, entry): the shell starts the abduction. */
  onLocked(target: number, entry: number): void;
  /** The sun came up mid-flight. */
  onSunrise(): void;
  onQuotaMet?(): void;
  onQuit(): void;
}

type SceneState = 'fly' | 'spotted' | 'locking';

export class DeepFlightScene implements Scene {
  state: SceneState = 'fly';
  private readonly huntRing: number;

  get huntPosition() {
    if (this.ctx.hunt?.kind === 'souvenir') {
      const ring = this.sim.rings[this.huntRing];
      return ring && ring.x >= 0 ? ring : undefined;
    }
    return huntPickup(this.ctx.hunt, this.sim.collectible);
  }

  readonly sim: DeepFlightSim;
  readonly ctx: GameContext;
  readonly level: DeepLevelDef;
  readonly run: DeepRun;
  readonly practice: boolean;
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
  private timeCarPilot?: TimeCarPilot;
  private tripodLegPilot?: TripodLegPilot;
  st = 0;
  shake = 0;
  zibText = '';
  zibT = 0;
  /** How long the current Zib line stays up (s): its reading time. */
  zibFor = 0;
  collectibleToastT = 0;
  queueBarkT = 0;
  private zibCd = 0;
  private zibN = 0;
  private zibEvent?: DeepZibEvent;
  zibPanic = false;
  private alertT = 0;
  private barkT = 0;
  private flashT = 0;
  private exposedT = 0;
  private wasExposed = false;
  caption = '';
  shout = '';
  spotLine = '';
  spotCause: SpotCause = 'police';
  photoCount = 0;
  private done = false;
  bannerT = 0;
  private pendingOpener: DeepZibEvent | null = null; // v4 story
  verseT = 0;
  verse = '';
  reciterIndex = -1;
  /** v4 openings: L12's opener waits until a poet is on screen. */
  private poetsUnseen = false;
  private versePending = false;
  private gagNear = -1;
  /** Seconds since the last respawn at a checkpoint, or -1. */
  cpT = -1;
  /** Counts down after coming back with a specimen: the "n of 3" banner and the chip pop. */
  deliverT = 0;
  deliveredIdx = -1;

  private readonly look = new ViewSlot(() => new DeepFlightView(this));
  private eggs: EggCues | null = null; // v4 easter eggs

  constructor(private readonly opts: DeepFlightOptions) {
    this.ctx = opts.ctx;
    this.level = opts.level;
    this.run = opts.run;
    this.practice = opts.practice ?? false;
    this.sim = new DeepFlightSim(this.level.map, this.ctx.upgrades, this.run.elapsed, this.run.troops, this.run.collectible);
    for (let i = 0; i < this.run.delivered.length; i++) if (this.run.delivered[i]) this.sim.markDelivered(i);
    const hunt = this.ctx.hunt;
    const slot = hunt?.kind === 'souvenir' ? deepSlot(this.level, hunt.room) : null;
    this.huntRing = slot ? this.sim.ringRef.findIndex(ref => ref.target === slot.target && ref.entry === slot.entry) : -1;
    const sp = this.run.spawn;
    this.sim.place(sp.x, sp.y, this.run.legs === 0 && this.run.spotted === 0 ? 0.4 : SAFE_WINDOW);
    if (this.practice && this.level.id === 'level12') this.sim.place(GRIMSBY_SET.practice.x, GRIMSBY_SET.practice.y, 0.4); // v4 openings
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
    if (!this.practice && this.run.legs === 0 && this.run.spotted === 0) {
      this.bannerT = 3;
      this.pendingOpener = deepStartEvent(this.level.id); // v4 story
      if (this.pendingOpener === 'start12') {
        // v4 openings: the poets are no longer at the launch, so Zib names them on first sight.
        this.pendingOpener = null;
        this.poetsUnseen = true;
      }
    }
    else if (this.run.legs > 0 && this.run.deliveredCount > 0 && this.run.lastFail === null) {
      this.say(this.level.id === 'birch_neighbours' ? 'birchReturned'
        : this.level.id !== 'level8' && this.run.deliveredCount === 2 ? 'twoOfThree' : 'checkpoint', true); // v4 story
      // back from a successful abduction: count it
      this.deliverT = 2.6;
      this.deliveredIdx = this.run.order[this.run.order.length - 1] ?? -1;
      this.cpT = 0;
      this.checkpointBurst(sp.x, sp.y);
    }
  }

  get bannerBody(): string {
    const words = tr();
    switch (this.level.id) {
      case 'birch_bakery': return words.birch.collectBakery;
      case 'birch_neighbours': return words.birch.collectNeighbours;
      case 'level8': return words.timeTrial.banner;
      case 'level9': return words.crestValley.banner;
      default: return words.flight.collectAll;
    }
  }

  get bannerHeading(): string {
    const words = tr();
    if (this.practice && this.level.id === 'level12') return words.dispatch2199.practice;
    if (this.practice) return fmt(words.fieldCheck.re, { num: formatOrderNumber(workOrderNumber('level2')) });
    const num = formatOrderNumber(workOrderNumber(this.level.id));
    if (this.level.id === 'level12') return fmt(words.levels.level12.re, { num });
    if (this.level.id === 'level9') return fmt(words.crestValley.order, { num });
    return this.level.id === 'level8' || this.level.clockMode === 'elapsed'
      ? fmt(words.workOrders.orderNo, { num })
      : fmt(words.flight.banner, { num, h: this.level.hours[1] });
  }

  /** For test scripts: window.__nightShift.active.debug */
  get debug(): { autopilot: () => FlightAutopilotIntent; timeCarAutopilot: () => FlightAutopilotIntent; tripodLegAutopilot: () => FlightAutopilotIntent; sim: DeepFlightSim; run: DeepRun; state: string; ap: FlightAutopilot | null } {
    const self = this;
    return {
      autopilot: () => self.autopilotIntent(),
      timeCarAutopilot: () => (self.timeCarPilot ??= new TimeCarPilot(self.sim)).intent(),
      tripodLegAutopilot: () => (self.tripodLegPilot ??= new TripodLegPilot(self.sim)).intent(),
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
    if (evt !== 'start12' && (this.pendingOpener === 'start12' || this.zibEvent === 'start12' && this.zibT > 0)) return;
    if (!force && this.zibCd > 0) return;
    // flavour lines wait their turn: they don't cut a line the player is still reading
    if (force && !panic && FLAVOUR.has(evt) && this.zibT > 0 && this.zibFor - this.zibT < FRESH_LINE_SECONDS) return;
    this.zibEvent = evt;
    this.zibText = deepZibLine(evt, this.zibN++ + this.run.spotted);
    this.zibFor = this.zibT = readSeconds(this.zibText);
    this.zibCd = this.zibT + 0.4;
    this.zibPanic = panic;
  }

  /** v4 easter eggs: a scenery line, said like any other. */
  private sayLine(text: string): void {
    this.zibEvent = undefined;
    this.zibText = text;
    this.zibFor = this.zibT = readSeconds(text);
    this.zibCd = this.zibT + 0.4;
    this.zibPanic = false;
  }

  update(dt: number): void {
    const p = this.ctx.pointer;
    const audio = this.ctx.audio;
    this.zibT = Math.max(0, this.zibT - dt);
    this.collectibleToastT = Math.max(0, this.collectibleToastT - dt);
    this.queueBarkT = Math.max(0, this.queueBarkT - dt);
    this.zibCd = Math.max(0, this.zibCd - dt);
    this.shake = Math.max(0, this.shake - dt * 3);
    this.flashT = Math.max(0, this.flashT - dt);
    this.bannerT = Math.max(0, this.bannerT - dt);
    // v4 story: Zib's shift opener lands once the dispatch banner clears
    if (this.pendingOpener && this.bannerT <= 0.4) {
      const opener = this.pendingOpener;
      this.pendingOpener = null;
      if (this.zibT <= 0 && this.state === 'fly') this.say(opener, true);
    }
    this.deliverT = Math.max(0, this.deliverT - dt);
    if (this.cpT >= 0 && (this.cpT += dt) > 1.7) this.cpT = -1;
    for (let i = 0; i < this.lineFlash.length; i++) this.lineFlash[i] = Math.max(0, this.lineFlash[i]! - dt * 3);
    this.st += dt;
    this.fx.update(dt);
    this.ambient.update(dt, this.sim.saucer.x, this.sim.saucer.y);

    if (this.done) return;
    // the sunrise clock runs through everything, the SPOTTED freeze included (up to SPOT_HOLD)
    const car = this.sim.collectible?.timeCar;
    const beforeCarTime = car?.elapsed ?? 0;
    const charged = this.state !== 'spotted' || this.st < SPOT_HOLD;
    const wasWarning = this.run.deadlineWarning > 0;
    if (!this.practice && charged && this.run.tick(dt)) {
      this.done = true;
      audio.sfx('sunrise');
      this.opts.onSunrise();
      return;
    }
    if (!wasWarning && this.run.deadlineWarning > 0) {
      this.say(this.level.id === 'level12' ? 'demolition' : this.level.id === 'level9' ? 'stormClosing' : 'dawn', true, true);
      audio.sfx('sunrise', 0.6);
    }
    if (car?.visible && this.state === 'fly') {
      if (beforeCarTime < TIME_CAR.launch && car.phase === 'rolling') this.say('timeCarLaunch', true);
      else if (beforeCarTime < 9 && car.elapsed >= 9 && this.zibT <= 0) this.say('timeCarWarn', true);
    }

    if (this.state === 'spotted') {
      if (this.st > SPOT_SKIP && p.pressed) this.respawn();
      return;
    }

    if (this.state === 'locking' && this.sim.phase !== 'locking') {
      this.state = 'fly';
      this.st = 0;
    }
    if (this.state !== 'locking' && this.quit.update(p, dt)) {
      this.done = true;
      this.opts.onQuit();
      return;
    }

    const sim = this.sim;
    if (this.practice && this.level.id === 'level12' && Math.abs(sim.saucer.x - GRIMSBY_SET.practice.x) >= GRIMSBY_SET.practice.laneDx) {
      this.done = true;
      this.opts.onQuit();
      return;
    }
    const previousTime = sim.st.t;
    sim.update(dt, p, !this.quit.pressedDown);
    if (sim.justCollected && sim.collectible) {
      this.collectibleToastT = mapPickupFeedback(this.ctx, this.fx, sim.collectible.position);
      if (car) this.say('timeCarCaught', true);
    }
    if (car && beforeCarTime < TIME_CAR.strike && car.elapsed >= TIME_CAR.strike && sim.phase !== 'spotted') {
      audio.sfx('stamp', 1.1);
      audio.sfx('crash', 0.36);
      if (this.state === 'fly' && (this.zibEvent !== 'timeCarCaught' || this.zibT <= 0)) {
        this.say(car.phase === 'missed' ? 'timeCarMissed' : 'lightning', true, true);
      }
    }

    if (this.state === 'locking') {
      if (this.st >= LOCK_ANIM) {
        const ref = sim.ringRef[sim.lockedRing]!;
        if (ref.ape) {
          sim.collectApe();
          this.run.finishPickup(ref.target, sim.saucer);
          audio.sfx('pickup');
          this.state = 'fly';
          this.st = 0;
          if (this.run.phase === 'done') {
            this.done = true;
            this.opts.onQuotaMet?.();
          }
          return;
        }
        this.done = true;
        this.opts.onLocked(ref.target, ref.entry);
      }
      return;
    }

    const st = sim.st;
    const s = sim.saucer;
    const field = sim.field;
    const rm = this.ctx.reducedMotion;
    if (this.level.map.theme === 'badlands' && nearHumOnset(field.defs, s.x, s.y, previousTime, st.t)) audio.sfx('monolith_hum');
    if (this.level.id === 'level12') {
      for (let i = 0; this.poetsUnseen && i < field.defs.length; i++) {
        const d = field.defs[i]!;
        // 50 px: the guard sprite shows before its origin does
        if (d.type !== 'camera' || d.x < sim.camX - 50 || d.x > sim.camX + VIEW_W + 50 || d.y < sim.camY - 50 || d.y > sim.camY + VIEW_H + 50) continue;
        this.poetsUnseen = false;
        this.say('start12', true);
      }
      this.verseT = Math.max(0, this.verseT - dt);
      let speaker = -1;
      let distance = Infinity;
      for (let i = 0; i < field.defs.length; i++) {
        const d = field.defs[i]!;
        if (d.type !== 'camera' || d.skin !== 'reciter2199_top') continue;
        const r = Math.hypot(s.x - d.x, s.y - d.y);
        if (r >= distance || (r > 220 && !pointInCone(s.x, s.y, d.x, d.y, field.a[i]!, d.half + 0.24, d.range + 145))) continue;
        speaker = i;
        distance = r;
      }
      if (st.cause >= 0 && field.defs[st.cause]?.type === 'camera') speaker = st.cause;
      if (speaker !== this.reciterIndex) this.versePending = speaker >= 0;
      this.reciterIndex = speaker;
      if (speaker >= 0 && this.versePending && !this.pendingOpener && this.zibCd === 0 && this.verseT === 0) {
        const verses = tr().dispatch2199.verses;
        this.verse = verses[this.run.recitalVerse++ % verses.length]!;
        this.verseT = readSeconds(this.verse);
        this.zibCd = this.verseT + 0.4;
        this.versePending = false;
      }
    }
    // ---- events
    if (st.click >= 0) {
      audio.sfx('porch_light');
      if (!this.seen.has('porch')) {
        this.seen.add('porch');
        this.say(this.level.id === 'birch_bakery' ? 'birchHandprint' : 'porch', true, true);
      }
      // a ring snaps out to the edge of the light
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
      audio.sfx('camera_focus');
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
    if (this.level.id === 'birch_neighbours' && !this.seen.has('birchBinLid') &&
        !this.pendingOpener && this.zibCd <= 0 && Math.hypot(s.x - binLid.x, s.y - binLid.y) < 185) {
      this.seen.add('birchBinLid');
      this.say('birchBinLid', true);
    }
    // v4 easter eggs: a film cameo on the map, once per run, never over a hazard line or the opener
    this.eggs ??= new EggCues(this.level.map.props, this.run);
    const egg = this.eggs.check(s.x, s.y, sim.camX, sim.camY, this.zibCd <= 0 && !this.pendingOpener && st.cause < 0 && sim.suspicion === 0);
    if (egg) this.sayLine(egg);

    const grail = this.run.grail;
    if (grail) {
      grail.update(this.run.elapsed, s.x, s.y, sim.phase === 'spotted' && field.defs[st.cause]?.type === 'camera',
        !!field.on[field.rabbitIndex], !!sim.collectible?.collectedId);
      grail.sound(field, previousTime, audio, s.x, s.y);
    }
    // v4 1953: Zib recognizes the first pilot as the east wing comes into view.
    // v4 openings: the launch sits by the queue, so the bark waits for the launch banner to clear.
    if (this.level.id === 'level11' && st.cause < 0 && this.bannerT <= 0 && !greetedPilotQueues.has(this.run) &&
        Math.hypot(s.x - PILOT_QUEUE.x, s.y - PILOT_QUEUE.y) < 265) {
      greetedPilotQueues.add(this.run);
      const line = deepZibLine('queue1953', 0);
      this.queueBarkT = readSeconds(line);
    }

    // ---- the fuse
    const exposed = st.cause >= 0;
    if (exposed) {
      this.exposedT += dt;
      const cause = field.spotCause(st.cause);
      if (!this.seen.has(cause)) {
        this.seen.add(cause);
        if (cause !== 'poetry' || this.zibT <= 0 && this.verseT <= 0) this.say(cause, true, true);
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

    if (sim.inRing >= 0 && !sim.ringRef[sim.inRing]!.ape && !this.seen.has('ring')) {
      this.seen.add('ring');
      this.say('nearRing', true);
    }
    if (sim.justLocked) {
      this.state = 'locking';
      this.st = 0;
      audio.sfx('lock_on');
      audio.sfx('beam_on', 0.6);
      if (!sim.ringRef[sim.lockedRing]!.ape) {
        this.say('locked', true);
        this.lockBurst(sim.rings[sim.lockedRing]!);
      }
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
    this.say(this.level.id === 'birch_bakery' ? 'birchRetry' : 'respawn', true);
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
