import { ART } from '../art-manifest';
import { VIEW_H, VIEW_W, type AbductAutopilotIntent, type AbductResult, type AbductRules, type Audio, type UpgradeId } from '../contracts';
import { AbductPilot } from './autopilot';
import { bodyPlanFor } from './body-plan';
import { WitnessReactions } from './invasion1953';
import { MoistureSim } from './moisture';
import { PhotoCapture } from './photo';
import { POINT, pointReach } from './point';
import { InteriorSimulation, type InteriorFailure } from './interior';
import { clamp, Contact, Ragdoll, STEP, type Blade, type Circle, type Rect, type Solid, type SwingingRect } from './ragdoll';
import { CEILING, FLOOR, LEFT_WALL, RIGHT_WALL, type Area, type Room } from './rooms/layout';
import { GrailExit, GrailReaction } from './grail';
import { AWAKE_SECONDS, WakeMeter } from './wake';
import { tr } from '../i18n';
import { readSeconds } from '../core/read-time';

export const BEAM_BOUNDS = { left: 47, top: 146, right: 491, bottom: 800 };
const FAN_BLADE_RADIUS = 14;
const SLURP_SECONDS = 0.56;
const FAILURE_SECONDS = 0.85;
const SNOOZE_AMOUNT = 40;
const SNOOZE_SECONDS = 0.65;
const QUIET_RULES: AbductRules = { hard: false, wakeFails: false };
const HUMAN_NAMES = {
  mabel: 'Baker Mabel', nora: 'Nora Finch', len: 'Len Briggs',
  doyle: 'Farmer Doyle', larry: 'Larry', dave: 'Dentist Dave', barb: 'Coach Barb',
  gary: 'Gary', nigel: 'Night Guard Nigel', kev: 'DJ Kev', mayor: 'Mayor Whitlock',
  // L5 pier code
  bubbles: 'Bubbles', pete: 'Harbourmaster Pete', sal: 'Sal',
  // v4 L8
  flint: 'Flint', reed: 'Reed', echo: 'Echo',
  // L7 cruise code
  sterling: 'Captain Sterling', marco: 'Chef Marco', greg: 'Greg',
  // L6 clinic code
  hank: 'Hank', osei: 'Dr. Osei', pemberton: 'Mr. Pemberton',
  // v4 L9 1955
  rodney: 'Sir Rodney the Not-Quite-So-Brave', black_knight: 'The Black Knight', tom_enchanter: 'Tom the Enchanter',
  artie: 'Artie Duvet', penny: 'Penny Thumb', moe: 'Moe Dread',
  doc: 'Doc', buff: 'Buff Tanner', marvin: 'Marvin Cherry',
  // v4 1953
  forester: 'Clive Forester', van_bell: 'Sylvie Van Bell', collier: 'Pastor Matt Collier',
} as const;
const HOLD_INTENT: AbductAutopilotIntent = { dx: 0, dy: 0 };
/** Pop-culture decor and the sleep-talk it sets off when the specimen floats past it (once). */
const PROP_CUES: Readonly<Record<string, string>> = {
  'room/saucer_poster': 'The truth is out there. Lock the back door.',
  'room/pilot_bobblehead': 'July 4th speech first. Then upload the virus.',
  'room/potato_butte': 'The mash needs more altitude.',
  'room/roswell_pennant': 'Go Saucers! Defence!',
  'room/lost_umbrella': "Lost property. One umbrella. Still wet.",
  'room/tripod_single': 'This one goes out to the Martians.',
  // L6 clinic code
  'room/ticket_sign': 'Now serving… me?',
};
/** The cue plays this long after the lift, while the specimen is still in the prop's room. */
const PROP_CUE_DELAY = 1.2;
const GRIP_STRAIN = 132;
/** Bonk speed of squashing a snagged body against a wall. */
const SQUASH_SPEED = 140;
const CAT_LIFT = ART['room/cat_awake']!.h - ART['room/cat_sleeping']!.h;
const MUMBLES = [
  'Five more minutes…',
  'Not the geese, Linda.',
  'I’m the captain of the pudding.',
  'The moon owes me six dollars.',
  'That’s my emergency lasagna.',
  'Put the hamster on payroll.',
  'No, the barn is wearing ME.',
  'I already folded Tuesday.',
  'The soup needs a seat belt.',
  'Tell the mayor I’m a sandwich.',
  'Where’s my formal slipper?',
  'I did the taxes in crayon.',
  'Don’t iron the waffles.',
  'The cheese knows what it did.',
  'Sir, this is a pillow.',
] as const;

interface LooseItem {
  x: number;
  y: number;
  vx: number;
  vy: number;
  captured: boolean;
  side: number;
  stolen: boolean;
}

function rectangle(area: Area, inset = 0): Rect {
  return {
    kind: 'rect',
    x: area.x + inset, y: area.y + inset,
    w: area.w - inset * 2, h: area.h - inset * 2,
    vx: 0, vy: 0,
  };
}

function contains(area: Area, x: number, y: number, margin = 0): boolean {
  return x >= area.x - margin && x <= area.x + area.w + margin &&
    y >= area.y - margin && y <= area.y + area.h + margin;
}

export class AbductSimulation {
  readonly body: Ragdoll;
  /** v3 report: Bureau ID photo pose (src/abduct/photo.ts). */
  readonly photo: PhotoCapture;
  readonly grail?: GrailReaction;
  readonly grailExit?: GrailExit;
  readonly wake: WakeMeter;
  readonly item: LooseItem;
  readonly fanBlades: readonly Blade[];
  readonly sign: SwingingRect | undefined;
  readonly emitterX: number;
  readonly exitX: number;
  readonly exitY: number;
  readonly cart: Rect | undefined;
  readonly solids: readonly Solid[];
  readonly interior: InteriorSimulation | undefined;
  /** L5: moisture sheath and water zones, when the room has any. */
  readonly wet: MoistureSim | undefined;
  readonly subjectName: string;
  readonly snoozeOwned: boolean;
  readonly camera = { x: 0, y: 0 };
  private readonly pilot: AbductPilot;
  readonly wallCount: number;
  failure: InteriorFailure | undefined;
  failureTime = 0;
  snoozeUsed = false;
  snoozePulse = 0;
  snoozeX = 0;
  snoozeY = 0;
  elapsed = 0;
  private sparkCharge = false;
  snores = 0;
  snoreFx = 0;
  mumble = '';
  mumbleFx = 0;
  /** How long the current mumble stays up (s): its reading time. */
  mumbleFor = 0;
  catAwake = 0;
  shake = 0;
  slurp = 0;
  delivered = false;
  /** Visual events for the view: each counter only ever goes up. */
  bonkSeq = 0;
  bonkX = 0;
  bonkY = 0;
  /** 0.3..1, how hard the last bonk was. */
  bonkPower = 0;
  wakeSeq = 0;
  catSeq = 0;
  /** Goes up when the loose item (a souvenir) is sucked into the beam. */
  itemSeq = 0;

  private accumulator = 0;
  private nextSnore = 1.2;
  private nextFlail = 0;
  private flailEnds = 0;
  private grabbed = false;
  private strain = 0;
  private grip: Rect | undefined;
  private gripOffsetX = 0;
  private gripOffsetY = 0;
  private strainX = 0;
  private strainY = 0;
  private readonly cat: Rect | undefined;
  private catIndex = -1;
  private signIndex = -1;
  private catCooldown = 0;
  private readonly grabSurfaces: Rect[] = [];
  private readonly contact = new Contact();
  private readonly itemRadius: number;
  private beamMoved = false;
  /** The room's pop-culture prop (centre) and its line, until it has been said. */
  private propCue: { room: Area; line: string } | undefined;
  private pendingSulk = -1;
  private liftAt = -1;
  private squashed = false;
  private readonly witness?: WitnessReactions;
  private lift = 0;

  constructor(
    readonly room: Room,
    upgrades: ReadonlySet<UpgradeId>,
    private readonly audio: Audio,
    private readonly random: () => number = Math.random,
    readonly rules: AbductRules = QUIET_RULES,
  ) {
    if (room.human === 'rodney' || room.human === 'black_knight') this.grail = new GrailReaction(room.human === 'black_knight');
    this.exitX = room.exitZone.x + room.exitZone.w / 2;
    this.exitY = room.exitMouthY ?? room.exitZone.y + room.exitZone.h / 2;
    this.emitterX = room.roofExit ? room.exit.x + room.exit.w / 2 : VIEW_W / 2;
    const solids: Solid[] = room.interior ? room.interior.building.walls.map(wall => rectangle(wall)) : [
      rectangle({ x: LEFT_WALL - 140, y: CEILING, w: 140, h: FLOOR - CEILING }),
      rectangle({ x: RIGHT_WALL, y: CEILING, w: 140, h: FLOOR - CEILING }),
      rectangle({ x: 0, y: 3, w: VIEW_W, h: CEILING - 3 }),
      rectangle({ x: 0, y: FLOOR, w: VIEW_W, h: 180 }),
    ];

    this.wallCount = solids.length;
    for (const masonry of room.masonry ?? []) solids.push(rectangle(masonry));
    for (const { sprite, colliders, grabbable } of room.furniture) {
      const shapes = colliders ? colliders.map(area => rectangle(area)) : [rectangle(sprite, room.interior ? 0 : 5)];
      solids.push(...shapes);
      if (grabbable) this.grabSurfaces.push(...shapes);
    }

    if (room.cat) {
      this.catIndex = solids.length;
      this.cat = rectangle(room.cat, 6);
      solids.push(this.cat);
    }

    const { fan } = room;
    this.fanBlades = fan ? [fan.angle, fan.angle + Math.PI].map(angle => ({
      kind: 'blade', x: fan.x, y: fan.y, angle,
      from: 19, to: fan.bladeLength - FAN_BLADE_RADIUS, r: FAN_BLADE_RADIUS, omega: fan.speed,
    })) : [];
    if (fan) {
      const hub: Circle = { kind: 'circle', x: fan.x, y: fan.y, r: 24, vx: 0, vy: 0 };
      solids.push(hub, ...this.fanBlades);
    }

    if (room.cart) {
      this.cart = rectangle(room.cart.sprite, 5);
      this.grabSurfaces.push(this.cart);
      solids.push(this.cart);
    }
    if (room.sign) {
      this.sign = {
        kind: 'swingingRect',
        x: room.sign.x + room.sign.w / 2, y: room.sign.y,
        w: room.sign.w, h: room.sign.h, angle: 0, omega: 0,
      };
      this.signIndex = solids.length;
      solids.push(this.sign);
    }
    const hush = upgrades.has('hush_drive');
    this.interior = room.interior
      ? new InteriorSimulation(room.interior.building, solids, room.pose.neckX, room.pose.neckY, audio, hush, room.interior.probes)
      : undefined;
    this.solids = solids;
    const plan = bodyPlanFor(room.human);
    this.body = new Ragdoll(room.pose, solids, upgrades.has('beam_dampener'), plan);
    if (room.exitSettleSec) this.grailExit = new GrailExit(this.body.chestX, this.body.chestY, room.exitSettleSec);
    // L5: moisture sheath (the dolphin) and water zones (src/abduct/moisture.ts)
    const wet = room.interior?.wet;
    this.wet = wet || plan.kind === 'dolphin'
      ? new MoistureSim(wet ?? { water: [], refills: [] }, plan.kind === 'dolphin', plan.joints, room.interior?.building.rooms ?? [])
      : undefined;
    this.photo = new PhotoCapture(this.body.x.length);
    this.wake = new WakeMeter(hush, rules.hard, plan.bonkGain);
    this.subjectName = HUMAN_NAMES[room.human];
    if (room.human === 'forester' || room.human === 'van_bell' || room.human === 'collier') {
      this.witness = new WitnessReactions(room.human, audio, room.interior?.exitName === 'Bell hatch');
    }
    this.snoozeOwned = upgrades.has('snooze_ray');
    this.pilot = new AbductPilot(room);
    if (this.interior) {
      this.camera.x = this.body.chestX - VIEW_W * 0.5 + (room.spawnLookAhead ?? 0);
      this.camera.y = this.body.chestY - VIEW_H * 0.49;
    }
    const item = room.item.sprite;
    this.item = { x: item.x + item.w * 0.5, y: item.y + item.h * 0.5, vx: 0, vy: 0, captured: false, side: 1, stolen: false };
    this.itemRadius = item.h * 0.5;
    this.strainX = this.body.beamX;
    this.strainY = this.body.beamY;
    for (const section of room.interior?.building.rooms ?? []) {
      for (const prop of section.decor) {
        const line = PROP_CUES[prop.key];
        if (line && room.interior!.mumbles.includes(line)) this.propCue = { room: section, line };
      }
    }
  }

  /** The player has moved the beam (the specimen has been lifted). */
  get moved(): boolean { return this.beamMoved; }

  get complete(): boolean { return this.failure ? this.failureTime >= FAILURE_SECONDS : this.delivered && this.slurp >= 1; }

  autopilot(): AbductAutopilotIntent {
    if (this.grail?.retreat) { this.pilot.speed = 0; return HOLD_INTENT; }
    return this.delivered || this.failure ? HOLD_INTENT : this.pilot.move(this.body, this.elapsed, this.interior);
  }

  /**
   * Where to hold a pointer (screen px) so pointing moves the beam the way the autopilot plans:
   * ahead of the beam by the reach for the planned speed, or on the aim point for the last step.
   * Drives the headless touch proofs and the browser bots. Advances the pilot like autopilot().
   */
  autopilotFinger(dt = 1 / 60): { x: number; y: number } {
    this.autopilot();
    const { body } = this;
    const cx = this.interior ? this.camera.x : 0;
    const cy = this.interior ? this.camera.y : 0;
    let x = body.beamX;
    let y = body.beamY;
    const pilot = this.pilot;
    if (pilot.speed > 0 && !this.delivered && !this.failure) {
      const dx = pilot.aimX - x;
      const dy = pilot.aimY - y;
      const d = Math.hypot(dx, dy);
      if (d > 0) {
        // Planned speed, but never past the aim point this frame: pointing at the reach for d/dt
        // lands the beam on it exactly (pointStep), without easing in.
        const speed = Math.min(pilot.speed, d / dt);
        const reach = speed < POINT.min ? POINT.dead + d : pointReach(speed);
        x += (dx / d) * reach;
        y += (dy / d) * reach;
      }
    }
    return { x: x - cx, y: y - cy };
  }

  snooze(): void {
    if (!this.snoozeOwned || this.snoozeUsed || this.delivered || this.failure) return;
    this.snoozeUsed = true;
    this.wake.calm(SNOOZE_AMOUNT);
    this.interior?.calm(SNOOZE_AMOUNT);
    this.snoozeX = this.body.chestX;
    this.snoozeY = this.body.chestY;
    this.snoozePulse = 1;
    this.audio.sfx('lullaby');
  }

  moveBeam(x: number, y: number): void {
    if (this.failure || this.delivered) return;
    const a = this.interior?.building.bounds;
    const beamX = a ? clamp(x, a.x + 21, a.x + a.w - 21) : clamp(x, BEAM_BOUNDS.left, BEAM_BOUNDS.right);
    const beamY = a ? clamp(y, a.y + 21, a.y + a.h - 21) : clamp(y, BEAM_BOUNDS.top, BEAM_BOUNDS.bottom);
    if (beamX !== this.body.beamX || beamY !== this.body.beamY) this.beamMoved = true;
    this.body.beamX = beamX;
    this.body.beamY = beamY;
  }

  update(dt: number): void {
    this.accumulator += clamp(dt, 0, 0.1);
    while (this.accumulator + 1e-9 >= STEP && !this.complete) {
      this.accumulator -= STEP;
      if (this.failure) {
        this.failureTime += STEP;
      } else if (this.delivered) {
        this.slurp = Math.min(1, this.slurp + STEP / SLURP_SECONDS);
      } else {
        this.step();
      }
    }
  }

  result(aborted = false): AbductResult {
    return {
      delivered: this.delivered && !aborted,
      woke: this.wake.woke,
      timeSec: this.elapsed,
      bonks: this.wake.bonks,
      dignity: Math.round(this.wake.dignity),
      snores: this.snores,
      itemsStolen: this.item.stolen && !aborted ? [this.room.item.name] : [],
      aborted,
      photo: this.photo.result(this.room.human),
      // L6 clinic code: Form 7-B
      ...(this.interior?.probes ? { probeReadings: this.interior.probes.readings() } : {}),
      ...(!aborted && this.failure ? { failReason: this.failure.reason, failBy: this.failure.by } : {}),
    };
  }

  private step(): void {
    this.elapsed += STEP;
    this.snoozePulse = Math.max(0, this.snoozePulse - STEP / SNOOZE_SECONDS);
    const beforeWake = this.wake.value;
    this.wake.tick(STEP, this.body.gripActive);
    this.catCooldown = Math.max(0, this.catCooldown - STEP);
    this.catAwake = Math.max(0, this.catAwake - STEP);
    this.snoreFx = Math.max(0, this.snoreFx - STEP);
    this.mumbleFx = Math.max(0, this.mumbleFx - STEP);
    this.shake = Math.max(0, this.shake - STEP * 6);
    this.moveHazards();
    this.updateGrip();
    if (this.beamMoved) this.lift = Math.min(1, this.lift + STEP * 2);
    const interior = this.interior;
    interior?.prepare(this.elapsed, this.body.chestX, this.body.chestY);
    this.wet?.prepare(this.body);
    this.body.step(this.lift, interior?.draftX, interior?.draftY);
    this.photo.sample(this.body, this.elapsed);

    if (this.sign && this.body.impacts[this.signIndex]! > 55) {
      this.sign.omega = clamp(this.sign.omega + this.body.impacts[this.signIndex]! * 0.004, -1.5, 1.5);
    }
    if (this.catIndex >= 0 && this.catCooldown === 0 && this.body.touched[this.catIndex]) {
      this.catCooldown = 2.2;
      this.catAwake = 1.7;
      this.audio.sfx('yowl');
      this.catSeq++;
      const cat = this.cat!;
      this.onBonk(335, true, clamp(this.body.chestX, cat.x, cat.x + cat.w), cat.y);
    }

    let speed = 0;
    let hardest = -1;
    let wallContact = false;
    for (let i = 0; i < this.body.impacts.length; i++) {
      if (i < this.wallCount && this.body.touched[i]) wallContact = true;
      if (i !== this.catIndex && this.body.impacts[i]! > speed) {
        speed = this.body.impacts[i]!;
        hardest = i;
      }
    }
    if (interior) {
      const wasAwake = this.wake.awake > 0;
      this.wake.noise(interior.step(this.body, this.elapsed, wallContact));
      if (this.wet) this.stepWet(interior);
      this.onWake(wasAwake);
      if (interior.failure) this.failure ??= interior.failure;
      if (this.failure) return;
      // Dragging a snagged body into a wall squashes it: one bonk per snag, not one per
      // bonk cooldown. The amber beam (strain > 0.24) is the tell; easing off clears it.
      if (interior.strain > 0.55 && !this.squashed) {
        this.squashed = true;
        if (speed < SQUASH_SPEED) this.onBonk(SQUASH_SPEED, false, this.body.chestX, this.body.chestY);
      } else if (interior.strain < 0.15) this.squashed = false;
      const smooth = 1 - Math.exp(-STEP * 5.4);
      const lookAhead = this.moved ? 0 : this.room.spawnLookAhead ?? 0;
      this.camera.x += (this.body.chestX - VIEW_W * 0.5 + lookAhead - this.camera.x) * smooth;
      this.camera.y += (this.body.chestY - VIEW_H * 0.49 - this.camera.y) * smooth;
    }
    if (hardest >= 0) this.onBonk(speed, false, this.body.impactX[hardest]!, this.body.impactY[hardest]!);
    if (interior?.failure) this.failure ??= interior.failure;
    if (this.failure) return;

    const grailLine = this.grail?.step(this.body, this.beamMoved, this.wake.value, this.mumbleFx > 0);
    if (grailLine) this.sleepTalk(grailLine);
    if (this.pendingSulk >= 0 && this.wake.awake === 0 && this.mumbleFx === 0) {
      this.sleepTalk(tr().dispatch2199.sulks[this.pendingSulk]);
      this.pendingSulk = -1;
    }
    const reaction = this.witness?.step(this.elapsed, beforeWake, this.wake.value, this.beamMoved);
    if (reaction) this.sleepTalk(reaction);

    const cue = this.propCue;
    if (this.beamMoved && this.liftAt < 0) this.liftAt = this.elapsed;
    if (cue && this.liftAt >= 0 && this.elapsed - this.liftAt >= PROP_CUE_DELAY && this.wake.awake === 0 && this.mumbleFx === 0) {
      this.propCue = undefined;
      if (contains(cue.room, this.body.chestX, this.body.chestY)) this.sleepTalk(cue.line);
    }

    const charge = this.room.human === 'tom_enchanter' && !!interior?.hazards[0]?.tell;
    const snore = this.room.human === 'tom_enchanter' ? charge && !this.sparkCharge : this.elapsed >= this.nextSnore;
    this.sparkCharge = charge;
    if (this.wake.awake === 0 && snore) {
      this.snores++;
      this.snoreFx = 1.1;
      this.nextSnore = this.elapsed + 1.85 + this.random() * 0.65;
      if (interior && !this.grail?.knight && this.snores % 5 === 0 && this.mumbleFx === 0) this.sleepTalk();
      this.audio.sfx('snore', this.room.human === 'doyle' ? 0.75 : 0.53);
    }

    this.updateItem();
    // L6 clinic code: the exit stays shut until Form 7-B is complete
    const { chestX, chestY } = this.body;
    const inExit = !this.body.gripActive && contains(this.room.exitZone, chestX, chestY);
    const ready = this.grailExit?.step(chestX, chestY, inExit) ?? inExit;
    if (ready && (this.interior?.probes?.done ?? true)) {
      this.grail?.cancel();
      this.delivered = true;
      // A captured item still with the body goes home with it. It trails the chest by up to ~70 px
      // when the body enters the exit fast, so it is not asked to be inside the exit zone too.
      this.item.stolen = this.item.captured &&
        Math.hypot(this.body.chestX - this.item.x, this.body.chestY - this.item.y) < 108;
      this.audio.sfx('success');
    }
  }

  private onBonk(speed: number, cat: boolean, x: number, y: number): void {
    const wasAwake = this.wake.awake > 0;
    if (!this.wake.impact(speed, cat)) return;
    this.bonkSeq++;
    this.bonkX = x;
    this.bonkY = y;
    this.bonkPower = clamp(speed / 320, 0.3, 1);
    this.audio.sfx('bonk', clamp(speed / 320, 0.3, 1));
    this.wet?.bonk(this.bonkPower);
    if (speed >= 195) this.shake = clamp(speed / 300, 0.6, 1.6);

    this.interior?.noise((cat ? 46 : clamp((speed - 40) * 0.29, 0, 70)), x, y);
    this.grail?.impact(this.body, x, this.elapsed);
    this.onWake(wasAwake);
    const line = this.witness?.bonkLine(this.bonkSeq);
    if (this.room.human === 'moe') this.pendingSulk = Math.min(2, this.bonkSeq - 1);
    else if (!this.grail?.knight && this.wake.awake === 0 && !cat && (line || speed >= 120)) this.sleepTalk(line);
  }

  /** L5: splashes wake people up; a dolphin that dries out wakes squeaking. */
  private stepWet(interior: InteriorSimulation): void {
    const wet = this.wet!;
    const splash = wet.step(this.body, this.elapsed, STEP);
    if (splash > 0) {
      this.wake.noise(splash);
      interior.noise(splash * 2.1, wet.splashX, wet.splashY);
      this.audio.sfx('bonk', 0.35 + wet.splashPower * 0.4);
    }
    if (wet.dried && !this.failure) {
      this.failure = { reason: 'woke', by: this.subjectName };
      this.wakeSeq++;
      this.audio.sfx('scream');
    }
  }

  private sleepTalk(line?: string): void {
    const mumbles = this.room.interior?.mumbles ?? MUMBLES;
    this.mumble = line ?? mumbles[Math.floor(this.random() * mumbles.length)]!;
    this.mumbleFor = this.mumbleFx = readSeconds(this.mumble);
    this.audio.sfx('mumble');
  }

  private onWake(wasAwake: boolean): void {
    if (this.wake.awake === 0 || wasAwake) return;
    this.grail?.cancel();
    this.wakeSeq++;
    this.mumbleFx = 0;
    this.snoreFx = 0;
    if (this.rules.wakeFails) {
      this.failure = { reason: 'woke', by: this.subjectName };
      this.audio.sfx('scream');
      return;
    }
    this.audio.sfx('wake');
    this.nextSnore = this.elapsed + 3.5;
    this.grabbed = false;
    this.flailEnds = this.elapsed + AWAKE_SECONDS;
    this.nextFlail = this.elapsed;
  }

  private moveHazards(): void {
    for (const blade of this.fanBlades) blade.angle += blade.omega * STEP;
    if (this.cart && this.room.cart) {
      const { sprite, travel, speed } = this.room.cart;
      const phase = this.elapsed * speed;
      this.cart.x = sprite.x + 5 + travel * Math.sin(phase);
      this.cart.vx = travel * speed * Math.cos(phase);
    }
    if (this.cat && this.room.cat) {
      const lift = this.catAwake > 0 ? CAT_LIFT : 0;
      this.cat.y = this.room.cat.y + 6 - lift;
      this.cat.h = this.room.cat.h - 12 + lift;
    }
    if (this.sign) {
      this.sign.omega += (-this.sign.angle * 15 - this.sign.omega * 3.1) * STEP;
      this.sign.angle += this.sign.omega * STEP;
    }
  }

  private updateGrip(): void {
    const body = this.body;
    if (this.wake.awake > 0 && this.elapsed < this.flailEnds && this.elapsed >= this.nextFlail) {
      for (const joint of body.plan.flail) body.kick(joint, (this.random() - 0.5) * 350, (this.random() - 0.56) * 360);
      this.nextFlail = this.elapsed + 0.19 + this.random() * 0.12;
    }

    if (this.wake.awake > 0 && !this.grabbed && this.elapsed < this.flailEnds) this.tryGrab();
    if (this.grip) {
      body.gripX = this.grip.x + this.gripOffsetX;
      body.gripY = this.grip.y + this.gripOffsetY;
      const pull = Math.hypot(body.beamX - body.chestX, body.beamY - body.chestY);
      const yank = Math.hypot(body.beamX - this.strainX, body.beamY - this.strainY) / STEP;
      this.strain = Math.max(0, this.strain + (Math.max(0, pull - 45) * 2.5 + yank * 0.60 - 40) * STEP);
      if (this.strain >= GRIP_STRAIN) {
        this.grip = undefined;
        body.gripActive = false;
        body.kick(body.gripJoint, (body.beamX - body.chestX) * 1.9, (body.beamY - body.chestY) * 1.9);
      }
    }
    this.strainX = body.beamX;
    this.strainY = body.beamY;
  }

  private tryGrab(): void {
    const body = this.body;
    let distance = 77;
    for (const joint of body.plan.hands) {
      const x = body.x[joint]!;
      const y = body.y[joint]!;
      for (const surface of this.grabSurfaces) {
        const left = surface.x - 11;
        const top = surface.y - 11;
        const right = surface.x + surface.w + 11;
        const bottom = surface.y + surface.h + 11;
        let px = clamp(x, left, right);
        let py = clamp(y, top, bottom);
        const nearest = Math.min(px - left, right - px, py - top, bottom - py);
        if (nearest > 0) {
          if (nearest === px - left) px = left;
          else if (nearest === right - px) px = right;
          else if (nearest === py - top) py = top;
          else py = bottom;
        }
        const reach = Math.hypot(x - px, y - py);
        if (reach >= distance) continue;
        distance = reach;
        this.grip = surface;
        this.gripOffsetX = px - surface.x;
        this.gripOffsetY = py - surface.y;
        body.gripJoint = joint;
      }
    }
    if (this.grip) {
      this.grabbed = true;
      body.gripActive = true;
      this.strain = 0;
    }
  }

  private updateItem(): void {
    const item = this.item;
    const body = this.body;
    const dy = item.y - body.chestY;
    const t = clamp((item.y - CEILING) / Math.max(30, body.chestY - CEILING), 0, 1);
    const columnX = this.interior ? body.chestX : this.emitterX + (body.chestX - this.emitterX) * t;
    if (this.beamMoved && !item.captured && dy > -115 && dy < 78 && Math.abs(item.x - columnX) < 57) {
      item.captured = true;
      item.side = item.x < body.chestX ? -1 : 1;
      this.itemSeq++;
      this.audio.sfx('pickup');
    }

    if (item.captured) {
      const targetX = this.interior ? body.chestX + item.side * 32 : clamp(body.chestX + item.side * 32, 38, 502);
      item.vx += clamp((targetX - item.x) * 23 - item.vx * 6, -1600, 1600) * STEP;
      item.vy += clamp((body.chestY + 12 - item.y) * 24 - item.vy * 6, -1600, 1600) * STEP;
    } else {
      item.vy += 440 * STEP;
    }
    item.x += item.vx * STEP;
    item.y += item.vy * STEP;

    const c = this.contact;
    for (const solid of this.solids) {
      if (!c.find(item.x, item.y, this.itemRadius, solid)) continue;
      item.x += c.nx * c.depth;
      item.y += c.ny * c.depth;
      const inward = Math.min(0, (item.vx - c.vx) * c.nx + (item.vy - c.vy) * c.ny);
      item.vx = (item.vx - inward * 1.2 * c.nx) * 0.85;
      item.vy = (item.vy - inward * 1.2 * c.ny) * 0.85;
    }
    if (!this.interior) item.y = Math.min(item.y, FLOOR - this.itemRadius);
  }
}
