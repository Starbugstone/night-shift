// Camera, foreground layers, and HUD of the multi-room abduction scene.
import { EnchanterStaffView, GrailReactionView } from './views/grail';
import { Container, Graphics, type Sprite } from 'pixi.js';
import { VIEW_H, VIEW_W, type GameContext } from '../contracts';
import { GLOW, PC, P_PUFF, P_RING, P_SPARK, P_STAR, P_TWINKLE, Particles } from '../core/fx';
import { Glow, ScreenTint, glowTexture } from '../core/gfx/glow';
import { ParticleView } from '../core/gfx/particles';
import type { SceneView } from '../core/gfx/scene';
import { Label, measure } from '../core/gfx/text';
import { gt, tr } from '../i18n';
import { HudButton, HudMeter, HudPanel, HudPrompt, HudTimer, HUD_ROW, type MeterState } from '../ui/views/hud';
import { HumanArt, RESTART, type SpecimenArt } from './draw';
import { DolphinArt } from './dolphin-art';
import { inside } from './interior';
import { EXIT_TAG, exitTagBox } from './exit-tag'; // v0.2 follow-up
import { ProbePaperwork } from './probe-draw';
import { clamp, Joint } from './ragdoll';
import type { Building, InteriorRoom, Opening } from './rooms/interior';
import { SwellView } from './swell-draw';
import { POP_SECONDS, SouvenirPop, souvenirLabel } from './souvenir';
import type { AbductSimulation } from './simulation';
import { TurnButtonsView, TurnTell } from './turn-draw';
import { WetView } from './wet-view';
import { ItemSparkle } from './views/item-sparkle'; // v4 items
import { BuildingView, DeepNight, prop } from './views/building';
import { BirchRoomDecor } from './views/birch';
import { CrestValleyRoomDecor } from './views/crest-valley';
import { DeliveryView, ExitChevrons, FuseRing, Reticle, SnoozeView, SnoreView, SpeechBubble, WakeBurst, type AbductViewInput } from './views/effects';
import { ALERT_RGB, FailureView } from './views/failure';
import { hazardView } from './views/hazards';
import { BiscuitDrops } from './views/invasion1953';
import { AMBER, DashedLine, DashedRect, INK, LIGHT, MINT, RED, TAU, box, circleInView, intersects } from './views/pieces';
import { SleeperView } from './views/sleeper';
import { RoomLessons } from './room-lessons'; // v0.2 teaching

/** Sunrise clock, between the sleeper meter and the camera fuse on row two. */
export const DEEP_HUD_SUNRISE_SLOT = { x: 202, y: 86, w: 132, h: 64 } as const;
/** Sunrise warning, beside the Snooze Ray and above the room/exit bar. */
export const DEEP_HUD_WARNING_SLOT = { x: 230, y: 831, w: 296, h: 45 } as const;

/**
 * What the shift around this abduction looks like, set each frame by the deep-shift wrapper
 * (src/ui/deep-abduct.ts): how close sunrise is (0..1) and how many specimens are already
 * aboard (-1 = not on a shift, no counter).
 */
export const deepShift = { dawn: 0, delivered: -1, total: 3, sharedTimer: false, elapsed: undefined as number | undefined };

function meets(opening: Opening, room: InteriorRoom): boolean {
  if (opening.axis === 'vertical') {
    return (opening.at === room.x || opening.at === room.x + room.w) &&
      opening.from < room.y + room.h && opening.to > room.y;
  }
  return (opening.at === room.y || opening.at === room.y + room.h) &&
    opening.from < room.x + room.w && opening.to > room.x;
}

interface Navigation {
  opening: Opening | undefined;
  room: InteriorRoom;
}

/** Route signs use the room graph, independent of the bot's exact drag line. */
function navigation(building: Building, exitX: number, exitY: number): Map<InteriorRoom, Navigation> {
  const known = new Map<InteriorRoom, Navigation>();
  const goal = building.rooms.find(room => inside(room, exitX, exitY));
  if (!goal) return known;
  const queue = [goal];
  known.set(goal, { opening: undefined, room: goal });
  for (const next of queue) {
    for (const opening of building.openings) {
      if (!meets(opening, next)) continue;
      for (const room of building.rooms) {
        if (!known.has(room) && meets(opening, room)) {
          known.set(room, { opening, room: next });
          queue.push(room);
        }
      }
    }
  }
  return known;
}

function meter(label: string, icon: MeterState['icon'] = 'sleep'): MeterState {
  return { label, icon, value: 0, warn: 0.45, danger: 0.73, t: 0, reduced: false, flash: 0, alarm: false };
}

function tickMeter(view: HudMeter, state: MeterState, value: number, alarm: boolean, x: number, y: number, w: number, time: number, rm: boolean): void {
  state.value = value;
  state.alarm = alarm;
  state.t = rm ? 0 : time;
  state.reduced = rm;
  view.sync(x, y, w, HUD_ROW.h, state);
}

class DeepHud {
  readonly root = new Container();
  private readonly wake = new HudMeter();
  private readonly wakeMeter = meter(tr().abduct.wake);
  private readonly camera = new HudMeter();
  private readonly cameraMeter = meter(tr().abduct.cameraFuse, 'eye');
  private readonly moisture = new HudMeter();
  private readonly moistureMeter = meter(gt('Moisture').toLocaleUpperCase());
  private readonly dryLabel = gt('Drying out!').toLocaleUpperCase();
  private readonly wetLabel = gt('Moisture').toLocaleUpperCase();
  private readonly sleepers: { meter: MeterState; view: HudMeter }[];
  private readonly timer = new HudTimer();
  private readonly restart = new HudButton('restart');
  private readonly turns = new TurnButtonsView();
  private readonly roomName = new Label({ size: 18, weight: 850, color: LIGHT });
  private readonly exitName = new Label({ size: 14, weight: 900, color: MINT });
  private readonly pips: { on: Graphics; off: Graphics }[] = [];
  private readonly divider = box(284, 898, 2, 32, '#695b92');
  private readonly snooze = new Container();
  private readonly snoozeLabel = new Label({ size: 13, weight: 750, color: '#ffffff' });
  private readonly lesson = new HudPrompt();
  private readonly roomLessons: RoomLessons; // v0.2 follow-up: each prompt kind gets its turn
  private lessonActive = false;
  private second = -1;

  constructor(private readonly sim: AbductSimulation, private readonly ctx: GameContext, paperwork: ProbePaperwork | undefined) {
    this.roomLessons = new RoomLessons(sim.room);
    this.restart.sync(RESTART, tr().common.restart, false);
    this.root.addChild(this.wake, this.timer, this.restart, this.turns.root);
    this.sleepers = sim.interior!.sleepers.map(s => ({
      meter: meter(gt(s.spec.name).toLocaleUpperCase()),
      view: new HudMeter(),
    }));
    for (const { view } of this.sleepers) this.root.addChild(view);
    this.moistureMeter.warn = 0.75;
    this.moistureMeter.danger = 0.999;
    this.root.addChild(this.moisture, this.camera);
    if (paperwork) this.root.addChild(paperwork.clipboard);

    const bar = new HudPanel().set(372, 56);
    bar.position.set(84, 887);
    this.exitName.set(gt(sim.room.interior!.exitName), 372, 914, 150);
    this.root.addChild(bar, this.roomName, this.divider, this.exitName);
    for (let i = 0; i < 3; i++) {
      const y = 902 + i * 12.5;
      const on = new Graphics().circle(285, y, 4.2).fill(MINT).stroke({ color: MINT, width: 1.5 });
      const off = new Graphics().circle(285, y, 4.2).fill('#16102e').stroke({ color: '#695b92', width: 1.5 });
      this.root.addChild(on, off);
      this.pips.push({ on, off });
    }
    this.snooze.position.set(14, 831);
    this.snooze.addChild(new HudPanel().set(204, 45, '#c8a4ff'), this.snoozeLabel);
    this.root.addChild(this.snooze, this.lesson);
  }

  sync(room: InteriorRoom, input: AbductViewInput, flash: number, sleepers: readonly SleeperView[]): void {
    const { sim, ctx } = this;
    const { elapsed, wet } = sim;
    const rm = ctx.reducedMotion;
    const { chestX, chestY } = sim.body;
    const tips = tr().lessons;
    // Keep the current hint while the suspended chest sways across its entry edge.
    const pad = this.lessonActive ? 12 : 0;
    let tip = '';
    if (sim.room.wrapperLessons) tip = '';
    else if (sim.grailExit?.inside && (sim.grailExit.steady || !input.dragging)) tip = sim.grailExit.steady ? tr().grail.steady : tr().grail.wobble;
    else if (sim.grailExit && input.dragging && nearZone(sim.room.exitZone, chestX, chestY, 90 + pad)) tip = tr().grail.settle;
    else if (wet?.sheathed && wet.level < 0.9 && wet.refilling === -1) tip = tips.refill;
    else if (sim.room.human === 'nora' && chestX > 295 - pad && chestX < 510 + pad && chestY < 445) tip = tr().birch.crossLaser;
    else if (sim.room.human === 'gary' && chestX > 270 - pad && chestX < 505 + pad && chestY > 175 - pad) tip = tips.laser;
    else if (sim.room.human === 'dave' && chestX > 280 - pad && chestX < 480 + pad && chestY < 490 + pad) tip = tips.settle;
    else if ((sim.room.human === 'sterling' || sim.room.human === 'marco' || sim.room.human === 'greg') && chestX < 390 + pad && chestY > -pad && chestY < 680 + pad && elapsed < 10) tip = tips.roll;
    else tip = this.roomLessons.tip(chestX, chestY, pad); // v0.2 teaching
    this.lessonActive = tip.length > 0;
    this.lesson.visible = this.lessonActive && !sim.delivered && !sim.failure;
    if (this.lesson.visible) this.lesson.sync(VIEW_W / 2, 756, 49, tip, 20, 'release', elapsed, rm);
    const { watching, exposure, sleepers: states } = sim.interior!;
    this.timer.visible = !deepShift.sharedTimer;
    const second = Math.floor(elapsed);
    if (second !== this.second) {
      this.second = second;
      const clock = Math.floor(second / 60) + ':' + String(second % 60).padStart(2, '0');
      this.timer.sync(318, HUD_ROW.y, 96, HUD_ROW.h, clock);
    }
    this.turns.sync(input.turn, !sim.delivered && !sim.failure);
    const { wake: w, awake, onCamera, cameraFuse, snoozeHint } = tr().abduct;
    const aw = sim.wake.awake > 0;
    this.wakeMeter.flash = flash;
    this.wakeMeter.label = aw ? awake : w;
    tickMeter(this.wake, this.wakeMeter, sim.wake.value / 100, aw, 14, HUD_ROW.y, 296, elapsed, rm);
    for (let i = 0; i < this.sleepers.length; i++) {
      const { meter, view } = this.sleepers[i]!;
      const wake = states[i]!.wake;
      meter.flash = sleepers[i]!.hop * 0.7;
      tickMeter(view, meter, wake / 100, wake >= 100, 14, 86, 180, elapsed, rm);
    }
    this.moisture.visible = !!wet?.sheathed && !watching && exposure <= 0;
    if (wet && this.moisture.visible) {
      this.moistureMeter.label = wet.level <= 0 ? this.dryLabel : this.wetLabel;
      tickMeter(this.moisture, this.moistureMeter, 1 - wet.level, wet.level <= 0, 342, 86, 184, elapsed, rm);
    }
    this.camera.visible = !!watching || exposure > 0;
    if (this.camera.visible) {
      this.cameraMeter.label = watching ? onCamera : cameraFuse;
      tickMeter(this.camera, this.cameraMeter, exposure, exposure >= 1 || !!watching, 342, 86, 184, elapsed, rm);
    }
    this.roomName.set(gt(room.name), 183, 914, 180);
    const have = deepShift.delivered;
    this.divider.visible = have < 0;
    for (let i = 0; i < this.pips.length; i++) {
      const { on, off } = this.pips[i]!;
      on.visible = have > i;
      off.visible = have >= 0 && have <= i && i < deepShift.total;
    }
    this.snooze.visible = sim.snoozeOwned && !sim.snoozeUsed && !sim.failure && !sim.delivered;
    if (this.snooze.visible) {
      this.snoozeLabel.set(snoozeHint, 102, 22, 188);
      this.snoozeLabel.tint = rm ? LIGHT : '#ddc8ff';
    }
  }
}

function nearZone(z: { x: number; y: number; w: number; h: number }, x: number, y: number, pad: number): boolean {
  return x > z.x - pad && x < z.x + z.w + pad && y > z.y - pad && y < z.y + z.h + pad;
}

class DeepExit {
  readonly root = new Container();
  private readonly unlocked = new Container();
  private readonly settleBar?: Sprite;
  private readonly glow = new Glow(glowTexture(GLOW.mint), true);
  private readonly fill: Sprite;
  private readonly arrows = new ExitChevrons();
  private readonly dashes: DashedRect;
  // v0.2 follow-up: the exit tag slides along the view edge instead of running off it (exit-tag.ts)
  private readonly tagPanel = new HudPanel();
  private readonly tagLabel = new Label({ size: EXIT_TAG.size, weight: EXIT_TAG.weight, color: MINT });
  private readonly tagTextW: number;

  constructor(private readonly sim: AbductSimulation, ctx: GameContext, private readonly paperwork?: ProbePaperwork) {
    const { room, exitX, exitY } = sim;
    const { exitZone: a, exit: s } = room;
    this.fill = box(a.x, a.y, a.w, a.h, MINT);
    this.dashes = new DashedRect(a, 4, 9, MINT);
    const title = gt(sim.room.interior!.exitName);
    this.tagTextW = measure(title, EXIT_TAG.size, EXIT_TAG.weight);
    const tag = exitTagBox(room, exitX, this.tagTextW, sim.camera.x, sim.camera.y);
    this.tagPanel.set(tag.w, tag.h);
    this.tagLabel.set(title, 0, 0, tag.w - 12);
    this.placeTag(sim.camera.x, sim.camera.y);
    this.unlocked.addChild(this.fill, this.dashes.root, this.arrows.root, this.tagPanel, this.tagLabel);
    if (sim.grailExit) {
      // An empty track shows from the start that this opening has a bar to fill.
      const track = box(a.x - 2, a.y + a.h - 12, a.w + 4, 12, INK, 0.75);
      this.settleBar = box(a.x, a.y + a.h - 10, 0, 8, MINT);
      this.unlocked.addChild(track, this.settleBar);
    }
    this.arrows.root.position.set(exitX, exitY);
    this.root.addChild(this.glow, prop(ctx.assets, s), this.unlocked);
    if (paperwork) this.root.addChild(paperwork.lock);
  }

  sync(cx: number, cy: number, rm: boolean): void {
    const { sim, paperwork } = this;
    this.root.visible = intersects(sim.room.exit, cx - 18, cy - 18, VIEW_W + 36, VIEW_H + 36);
    if (!this.root.visible) return;
    this.unlocked.visible = this.glow.visible = !paperwork || !!sim.interior!.probes?.done;
    if (!this.unlocked.visible) return;
    this.placeTag(cx, cy);
    const { exitX: x, exitY: y, elapsed, body } = sim;
    const pulse = rm ? 0.5 : 0.5 + 0.5 * Math.sin(elapsed * 3.2);
    const near = 1 - clamp((Math.hypot(body.chestX - x, body.chestY - y) - 60) / 300, 0, 1);
    this.glow.place(x, y, 170, 170, 0.3 + 0.12 * pulse + 0.3 * near);
    if (this.settleBar) this.settleBar.width = sim.room.exitZone.w * sim.grailExit!.progress;
    this.fill.alpha = 0.07 + 0.07 * pulse + 0.1 * near;
    this.dashes.sync(3 + near, rm ? 0 : -elapsed * 14);
    this.arrows.root.y = y - pulse * (5 + near * 4);
  }

  private placeTag(cx: number, cy: number): void {
    const tag = exitTagBox(this.sim.room, this.sim.exitX, this.tagTextW, cx, cy);
    this.tagPanel.position.set(tag.x, tag.y);
    this.tagLabel.position.set(tag.x + tag.w / 2, tag.y + tag.h / 2);
  }
}

class DeepBeam {
  readonly root = new Container();
  private readonly shaft = new Glow(glowTexture(GLOW.mint), true);
  private readonly base = new Glow(glowTexture(GLOW.mint), true);
  private readonly mint = glowTexture(GLOW.mint);
  private readonly amber = glowTexture(GLOW.amber);
  private readonly motes: Sprite[] = [];
  private readonly line = new DashedLine(Math.hypot(VIEW_W, VIEW_H) + 150, 4, 9, 2.5);

  constructor() {
    this.root.addChild(this.shaft, this.base);
    for (let i = 0; i < 12; i++) {
      const size = i % 4 === 0 ? 3.5 : 2.5;
      const mote = box(0, 0, size, size, '#ffffff');
      mote.blendMode = 'add';
      this.motes.push(mote);
      this.root.addChild(mote);
    }
    this.root.addChild(this.line.root);
  }

  sync(sim: AbductSimulation, x: number, y: number, cy: number, dragging: boolean, rm: boolean): void {
    this.root.visible = !sim.delivered;
    if (!this.root.visible) return;
    const { chestX, chestY } = sim.body;
    const hot = sim.interior!.strain > 0.24;
    const texture = hot ? this.amber : this.mint;
    this.shaft.texture = this.base.texture = texture;
    const top = cy + 96;
    const power = dragging ? 1 : 0.62;
    const h = (chestY - top) / 2;
    this.shaft.place(chestX, top + h - 30, 62, h + 90, h > 20 ? 0.28 * power : 0);
    this.base.place(chestX, chestY, 119, 188, dragging ? 0.57 : 0.31);
    const phase = rm ? 0.3 : sim.elapsed;
    for (let i = 0; i < this.motes.length; i++) {
      const mote = this.motes[i]!;
      const k = (phase * (0.24 + (i % 3) * 0.05) + i * 0.083) % 1;
      mote.position.set(chestX + Math.sin(i * 2.4 + k * 3) * (46 - 22 * k),
        chestY + 50 - k * Math.min(520, chestY - top + 60));
      mote.tint = hot ? AMBER : '#d9fff0';
      mote.alpha = (0.7 - k * 0.6) * power;
    }
    this.line.root.alpha = dragging ? 0.6 : 0.36;
    this.line.root.scale.y = hot ? 1.6 : 1;
    this.line.sync(x, y, chestX, chestY, hot ? AMBER : MINT);
  }
}

class Direction {
  readonly root = new Container();
  private readonly arrow = new Container();

  constructor() {
    this.arrow.addChild(new Glow(glowTexture(GLOW.mint), true).place(2, 0, 26, 26, 0.45),
      new Graphics().poly([20, 0, -10, 14, -6, 0, -10, -14]).stroke({ color: INK, width: 4, join: 'round' }).fill(MINT));
    this.root.addChild(this.arrow);
  }

  sync(x: number, y: number, atExit: boolean, t: number, rm: boolean): void {
    const bottom = DEEP_HUD_WARNING_SLOT.y - 20;
    const dx = x - VIEW_W / 2;
    const dy = y - VIEW_H / 2;
    this.root.visible = (!atExit || x < 42 || x > VIEW_W - 42 || y < 155 || y >= bottom) && Math.hypot(dx, dy) >= 48;
    if (!this.root.visible) return;
    this.root.position.set(clamp(x, 42, VIEW_W - 42), clamp(y, 168, bottom));
    this.root.rotation = Math.atan2(dy, dx);
    this.arrow.x = rm ? 0 : Math.sin(t * 6) * 4;
  }
}

class ExposureView {
  readonly root = new Container();
  private readonly fuse = new FuseRing(true);
  private readonly line = new DashedLine(Math.hypot(VIEW_W, VIEW_H) * 1.5, 3, 9, 3.5);

  constructor() {
    this.root.addChild(this.fuse.root, this.line.root);
  }

  sync(sim: AbductSimulation, rm: boolean): void {
    const i = sim.interior!;
    const v = i.exposure;
    this.root.visible = v > 0.01 && !sim.failure && !sim.delivered;
    if (!this.root.visible) return;
    const { chestX: x, chestY: y } = sim.body;
    this.fuse.sync(x, y, 1 - v, !!i.watching);
    const spec = i.watching?.spec;
    const camera = spec?.kind === 'camera' ? spec : null;
    const dx = camera ? camera.x - x : 0;
    const dy = camera ? camera.y - y : 0;
    const d = Math.hypot(dx, dy);
    // set once to its final value: a visible flip rebuilds the render group
    this.line.root.visible = camera !== null && d >= 100;
    if (!camera || d < 100) return;
    this.line.root.alpha = 0.5 + 0.5 * v;
    this.line.sync(x + dx / d * 79, y + dy / d * 79, camera.x - dx / d * 14, camera.y - dy / d * 14, RED, rm ? 0 : sim.elapsed * 70);
  }
}

export class DeepAbductView implements SceneView {
  readonly root = new Container();
  private readonly world = new Container({ isRenderGroup: true });
  private readonly specimen: SpecimenArt;
  private readonly subject = new Container();
  private readonly item: Container;
  private readonly sparkle = new ItemSparkle(); // v4 items
  private readonly wet?: WetView;
  private readonly paperwork?: ProbePaperwork;
  private readonly night: DeepNight;
  private readonly building: BuildingView;
  private readonly birch?: BirchRoomDecor;
  private readonly staff?: EnchanterStaffView;
  private readonly grail?: GrailReactionView;
  private readonly crestValley?: CrestValleyRoomDecor;
  private readonly exit: DeepExit;
  private readonly swell: SwellView;
  private readonly hazards: NonNullable<ReturnType<typeof hazardView>>[] = [];
  private readonly sleepers: SleeperView[];
  private readonly beam = new DeepBeam();
  private readonly turn = new TurnTell(18);
  private readonly reticle = new Reticle(true);
  private readonly delivery = new DeliveryView();
  private readonly exposure = new ExposureView();
  private readonly thumb?: Graphics;
  private thumbUntil = -1;
  private readonly speech = new SpeechBubble(true);
  private readonly bang = new WakeBurst(true);
  private readonly snore: SnoreView;
  private readonly twitch = new Label({ size: 24, weight: 900, color: RED }, '. . .');
  private readonly fx = new Particles(96);
  private readonly particles = new ParticleView(this.fx);
  private readonly popup = new SouvenirPop();
  private readonly snooze = new SnoozeView();
  private readonly direction = new Direction();
  private readonly dawn = ScreenTint.wash(GLOW.dawn, 0.05, 1, 0.95, 0);
  private readonly vignette = ScreenTint.vignette();
  private readonly alarm = ScreenTint.edge(ALERT_RGB);
  private readonly failure: FailureView;
  private readonly hud: DeepHud;
  private readonly roomPaths: Map<InteriorRoom, Navigation>;
  private currentRoom: InteriorRoom;
  private lastTime = 0;
  private lastBonk = 0;
  private lastItem = 0;
  private popAge = 0;
  private popX = 0;
  private popY = 0;
  private popLabel = '';
  private lastWake = 0;
  private wasDelivered = false;
  private squash = 0;
  private meterFlash = 0;
  private wakeAge = 0;
  private sweat = 0;

  constructor(private readonly sim: AbductSimulation, private readonly ctx: GameContext, private readonly input: AbductViewInput) {
    const interior = sim.interior!;
    const { building, hazards, sleepers, probes } = interior;
    const { assets } = ctx;
    this.currentRoom = building.rooms[0]!;
    this.roomPaths = navigation(building, sim.exitX, sim.exitY);
    this.specimen = sim.body.plan.kind === 'dolphin' ? new DolphinArt(ctx, sim.wet) : new HumanArt(sim.room.human, ctx);
    this.item = prop(assets, sim.room.item.sprite);
    if (sim.room.human === 'penny') {
      this.thumb = new Graphics().moveTo(-6, 5).lineTo(-6, -3).lineTo(-1, -4).lineTo(2, -15)
        .quadraticCurveTo(8, -17, 7, -7).lineTo(7, -3).quadraticCurveTo(13, -3, 12, 2)
        .lineTo(9, 7).closePath().fill('#c78e70').stroke({ color: INK, width: 2 });
      this.thumb.visible = false;
    }
    this.subject.addChild(this.specimen.root);
    if (this.thumb) this.subject.addChild(this.thumb);
    if (sim.wet) this.wet = new WetView(sim.wet);
    if (probes) this.paperwork = new ProbePaperwork(probes, assets, sim.room.exitZone);
    this.night = new DeepNight(building.bounds.y + building.bounds.h - 14);
    this.building = new BuildingView(building, hazards, sim.room.exit, assets);
    if (sim.room.human === 'doc' || sim.room.human === 'marvin') this.crestValley = new CrestValleyRoomDecor(assets, sim.room);
    if (sim.room.human === 'mabel' || sim.room.human === 'nora' || sim.room.human === 'len') this.birch = new BirchRoomDecor(sim, assets);
    this.exit = new DeepExit(sim, ctx, this.paperwork);
    this.swell = new SwellView(building, assets);
    this.snore = new SnoreView(ctx, true);
    this.failure = new FailureView(sim, assets);
    this.hud = new DeepHud(sim, ctx, this.paperwork);
    this.hud.root.label = 'hud'; // v4 council: the Field Check clipboard goes just under it
    this.vignette.strength = 0.85;
    this.sleepers = sleepers.map((s, i) => new SleeperView(s, assets, i));

    const world = this.world;
    world.addChild(this.building.root, this.exit.root);
    if (sim.room.item.name === 'complaint stamp') world.addChild(new Label({ size: 13, color: '#ffe3bb', weight: 700 })
      .set(tr().dispatch2199.tray, 473, 460, 210));
    if (this.crestValley) world.addChild(this.crestValley.back);
    if (this.birch) world.addChild(this.birch.root);
    for (let i = 0; i < hazards.length; i++) {
      const view = hazardView(building, hazards[i]!, assets, i);
      if (view) {
        this.hazards.push(view);
        world.addChild(view.root);
      }
    }
    world.addChild(this.swell.world);
    this.biscuits = sim.room.human === 'collier' ? new BiscuitDrops(ctx.assets) : null;
    if (this.biscuits) world.addChild(this.biscuits.root);
    for (const view of this.sleepers) world.addChild(view.root);
    world.addChild(this.beam.root);
    if (this.wet) world.addChild(this.wet.back);
    world.addChild(this.sparkle.root, this.item, this.subject);
    if (sim.room.human === 'tom_enchanter') {
      this.staff = new EnchanterStaffView();
      world.addChild(this.staff.root);
    }
    if (sim.grail) {
      this.grail = new GrailReactionView(sim.grail);
      world.addChild(this.grail.root);
    }
    if (this.crestValley) world.addChild(this.crestValley.front);
    world.addChild(this.snore.root, this.twitch, this.speech.root, this.bang.root);
    if (this.paperwork) world.addChild(this.paperwork.world);
    if (this.wet) world.addChild(this.wet.front);
    world.addChild(this.turn.root, this.reticle.root, this.exposure.root, this.delivery.world, this.particles, this.popup.root, this.snooze.root);
    this.root.addChild(this.night.root, world, this.dawn, this.vignette, this.direction.root, this.alarm, this.delivery.flash, this.hud.root,
      this.swell.dial, this.failure.root);
  }

  private readonly biscuits: BiscuitDrops | null;

  sync(): void {
    const { sim, ctx, input } = this;
    const { body, elapsed: t, delivered } = sim;
    const { building, exposure, strain } = sim.interior!;
    const rm = ctx.reducedMotion;
    const dt = this.lastTime === 0 ? 0 : clamp(ctx.time - this.lastTime, 0, 0.05);
    this.lastTime = ctx.time;
    this.moments(dt);
    const { x: cx, y: cy } = sim.camera;
    const { chestX, chestY } = body;
    if (!inside(this.currentRoom, chestX, chestY)) {
      for (const room of building.rooms) {
        if (inside(room, chestX, chestY)) {
          this.currentRoom = room;
          break;
        }
      }
    }
    const shake = rm ? 0 : sim.shake;
    this.world.position.set(-cx + Math.sin(t * 94) * shake * 4, -cy + Math.cos(t * 116) * shake * 2.5);
    this.night.sync(cx, cy, deepShift.dawn);
    this.building.sync(cx, cy, t, rm, deepShift.dawn);
    this.building.scan(body.x, body.y);
    this.staff?.sync(body, !!sim.interior?.hazards[0]?.tell, !!sim.failure || sim.delivered);
    this.grail?.sync(body, sim.elapsed, rm, !!sim.failure || sim.delivered);
    this.crestValley?.sync(deepShift.elapsed ?? t, rm);
    this.birch?.sync(rm);
    this.exit.sync(cx, cy, rm);
    for (const view of this.hazards) view.sync(t, rm, cx, cy, body);
    this.swell.sync(t, rm, cx, cy, VIEW_W, VIEW_H);
    for (const view of this.sleepers) view.sync(t, dt, rm, cx, cy);
    const { beamX, beamY } = body;
    const x = clamp(beamX, cx + 27, cx + VIEW_W - 27);
    const y = clamp(beamY, cy + 102, cy + VIEW_H - 93);
    this.beam.sync(sim, x, y, cy, input.dragging, rm);
    this.wet?.sync(cx, cy, t, rm);
    this.biscuits?.sync(t, sim.bonkSeq, chestX, chestY, rm);
    this.syncSpecimen(cx, cy);
    this.paperwork?.sync(body, t, rm, cx, cy);
    this.reticle.root.visible = !delivered;
    if (delivered) this.turn.root.visible = false;
    else {
      this.turn.sync(x, y, input.dragging, input.turn, body.tilt, rm);
      this.reticle.sync(x, y, beamX, beamY, input.dragging, strain > 0.24, rm ? 0 : t * 1.4);
    }
    this.exposure.sync(sim, rm);
    this.delivery.sync(sim, rm);
    this.particles.visible = this.fx.active > 0;
    if (this.particles.visible) this.particles.sync();
    this.popup.sync(this.popX, this.popY, this.popAge, this.popLabel, rm);
    this.snooze.sync(sim, rm);
    this.dawn.strength = deepShift.dawn * 0.4;
    this.syncDirection(cx, cy, rm);
    this.alarm.strength = exposure * 0.63;
    this.hud.sync(this.currentRoom, input, this.meterFlash, this.sleepers);
    this.failure.sync(sim, rm);
  }

  private syncSpecimen(cx: number, cy: number): void {
    const { sim } = this;
    const { item, body, wake, delivered, slurp, snoreFx, mumbleFx, elapsed } = sim;
    const { sprite } = sim.room.item;
    const rm = this.ctx.reducedMotion;
    const p = slurp * slurp;
    const { chestX, chestY } = body;
    this.item.visible = circleInView(item.x, item.y, sprite.w, cx, cy, VIEW_W, VIEW_H) && (!delivered || item.stolen);
    if (this.item.visible) this.item.position.set(
      item.x + (sim.exitX - item.x) * p - sprite.w / 2,
      item.y + (sim.exitY - item.y) * p - sprite.h / 2,
    );
    this.sparkle.sync(this.item.visible && !item.captured && !delivered, item.x, item.y, sprite.w, sprite.h, elapsed, rm, this.ctx.hunt?.kind === 'souvenir' && this.ctx.hunt.itemId === sim.room.item.name); // v4 items
    this.subject.pivot.set(chestX, chestY);
    this.subject.position.set(chestX + (sim.exitX - chestX) * p, chestY + (sim.exitY - chestY) * p);
    const q = rm ? 0 : this.squash * 0.1;
    this.subject.scale.set(delivered ? 1 - p * 0.87 : 1 + q, delivered ? 1 - p * 0.87 : 1 - q);
    this.subject.alpha = 1 - p;
    const awake = wake.awake > 0;
    const breath = rm ? 0 : awake ? 0.5 + 0.5 * Math.sin(elapsed * 15)
      : snoreFx > 0 ? Math.sin(Math.PI * clamp((1.1 - snoreFx) / 1.1, 0, 1)) : 0;
    if (this.thumb) {
      if (this.thumbUntil < 0 && sim.moved && wake.value >= 55) this.thumbUntil = elapsed + 0.5;
      this.thumb.visible = this.thumbUntil > elapsed && !delivered;
      if (this.thumb.visible) {
        const hx = body.x[Joint.NearHand]!, hy = body.y[Joint.NearHand]!;
        this.thumb.position.set(hx, hy);
        this.thumb.rotation = Math.atan2(sim.exitY - hy, sim.exitX - hx) + Math.PI / 2;
      }
    }
    this.specimen.sync(body, awake, breath);
    const x = body.x[Joint.Head]!;
    const y = body.y[Joint.Head]!;
    this.bang.sync(!delivered && awake, x, y, this.wakeAge, rm);
    this.speech.sync(sim.mumble, !delivered && !awake ? mumbleFx : 0, x, y, cx, cy, rm, sim.mumbleFor);
    const sleeping = !delivered && !awake && mumbleFx <= 0;
    this.snore.sync(sleeping ? snoreFx : 0, x, y, rm);
    this.twitch.visible = sleeping && wake.value >= 73;
    if (this.twitch.visible) {
      this.twitch.position.set(x - 30, y - 52);
      this.twitch.alpha = rm ? 1 : 0.6 + 0.4 * Math.sin(elapsed * 14);
    }
  }

  private syncDirection(cx: number, cy: number, rm: boolean): void {
    const { sim } = this;
    const entry = this.roomPaths.get(this.currentRoom);
    if (!entry || sim.failure || sim.delivered) {
      this.direction.root.visible = false;
      return;
    }
    const gap = entry.opening;
    const center = gap ? (gap.from + gap.to) / 2 : 0;
    const x = gap ? gap.axis === 'vertical' ? gap.at : center : sim.exitX;
    const y = gap ? gap.axis === 'vertical' ? center : gap.at : sim.exitY;
    this.direction.sync(x - cx, y - cy, !gap, sim.elapsed, rm);
  }

  /** Turn simulation events into particles and short timers. */
  private moments(dt: number): void {
    const { sim, ctx, fx } = this;
    const rm = ctx.reducedMotion;
    const { body } = sim;
    this.squash = Math.max(0, this.squash - dt * 5);
    this.meterFlash = Math.max(0, this.meterFlash - dt * 3);
    const awake = sim.wake.awake > 0 && !sim.delivered;
    this.wakeAge = awake ? this.wakeAge + (dt > 0 ? dt : 1 / 60) : 0;
    // a souvenir joins the trip: "+1 slipper" and a mint pop where it was grabbed
    if (this.popAge > 0) this.popAge = this.popAge + dt < POP_SECONDS ? this.popAge + dt : 0;
    if (this.lastItem !== sim.itemSeq) {
      this.lastItem = sim.itemSeq;
      this.popAge = 0.0001;
      this.popX = sim.item.x;
      this.popY = sim.item.y;
      this.popLabel = souvenirLabel(sim.room.item.name);
      fx.spawn(P_RING, sim.item.x, sim.item.y, 0, 0, 0.4, 56, PC.mint);
      if (!rm) fx.burst(P_TWINKLE, sim.item.x, sim.item.y, 6, 60, 140, 0.5, 7, PC.mint, 0, 3);
    }
    if (this.lastBonk !== sim.bonkSeq) {
      this.lastBonk = sim.bonkSeq;
      const { bonkX: x, bonkY: y, bonkPower: power } = sim;
      this.meterFlash = Math.max(this.meterFlash, 0.35 + power * 0.4);
      fx.burst(P_STAR, x, y, rm ? 2 : 2 + Math.round(power * 3), 110, 200 + power * 110, 0.6, 9 + power * 4, PC.amber, 300, 1.4, -Math.PI / 2, Math.PI * 1.3);
      fx.spawn(P_RING, x, y, 0, 0, 0.3, 24 + power * 30, PC.white);
      if (!rm) {
        this.squash = power;
        fx.burst(P_PUFF, x, y, 3, 20, 80, 0.42, 12 + power * 6, PC.dust, -30, 2);
        fx.burst(P_SPARK, x, y, 4, 170, 320, 0.24, 3, PC.white, 0, 3);
      }
    }
    if (this.lastWake !== sim.wakeSeq) {
      this.lastWake = sim.wakeSeq;
      this.meterFlash = 1;
      const hx = body.x[Joint.Head]!;
      const hy = body.y[Joint.Head]!;
      fx.spawn(P_RING, hx, hy, 0, 0, 0.45, 100, PC.red);
      if (!rm) fx.burst(P_SPARK, hx, hy, 10, 240, 400, 0.3, 4, PC.red, 0, 2.5);
    }
    if (awake && !rm) {
      this.sweat -= dt;
      if (this.sweat <= 0) {
        this.sweat = 0.13;
        const side = fx.rnd() < 0.5 ? -1 : 1;
        fx.spawn(P_SPARK, body.x[Joint.Head]! + side * 24, body.y[Joint.Head]! - 16, side * (50 + fx.rnd() * 70), -130 - fx.rnd() * 60, 0.45, 3.4, PC.sweat, 640, 0.5);
      }
    }
    if (sim.delivered && !this.wasDelivered) {
      this.wasDelivered = true;
      const { exitX, exitY } = sim;
      fx.spawn(P_RING, exitX, exitY, 0, 0, 0.5, 130, PC.mint);
      fx.spawn(P_RING, exitX, exitY, 0, 0, 0.34, 70, PC.white);
      const count = rm ? 6 : 18;
      for (let i = 0; i < count; i++) {
        const a = fx.rnd() * TAU;
        const d = 34 + fx.rnd() * 80;
        const index = fx.spawn(
          P_TWINKLE, body.chestX + Math.cos(a) * d, body.chestY + Math.sin(a) * d,
          Math.cos(a) * 150, Math.sin(a) * 150, 0.42 + fx.rnd() * 0.16, 7 + fx.rnd() * 7,
          i % 3 === 0 ? PC.white : PC.mint, 0, 3.5,
        );
        fx.home(index, exitX, exitY, 55);
      }
    }
    // a failure freezes the room: the stars hang where they were
    if (!sim.failure) fx.update(dt);
  }

}
