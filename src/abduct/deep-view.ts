// The multi-room abduction view (deep shifts): the camera follows the specimen through a building.
//
// Every hazard is drawn from the state the simulation collides with this frame (interior.prepare),
// so the drawn shape is the hit shape. The tells on top (charge-up, countdown dials, the ring that
// burns round the specimen while a camera has it) are decoration and never move a hazard.
import { ART } from '../art-manifest';
import { VIEW_H, VIEW_W, type Assets, type GameContext } from '../contracts';
import {
  GLOW, PC, P_PUFF, P_RING, P_SPARK, P_STAR, P_TWINKLE, Particles, bitmapOf, bitmapPx, bump, drawEdgeTint, drawGlow, drawSprite,
  drawVignette, drawWash, easeOutBack,
} from '../core/fx';
import { HUD_ROW, hudButton, hudMeter, hudPanel, hudTimer, type MeterState } from '../ui/hud';
import { HumanArt, RESTART } from './draw';
import { DolphinArt, type SpecimenArt } from './dolphin-art';
import { WetView } from './wet-view';
import { getLang, gt, localArt, tr } from '../i18n';
import { wrap as wrapText } from '../ui/draw';
import type { TurnControl } from './turn';
import { drawTurnButtons, drawTurnTell } from './turn-draw';
import { drawSouvenirPop, POP_SECONDS, souvenirLabel } from './souvenir';
import { LASER_TELL, inside, type HazardState, type SleeperState } from './interior';
import { clamp, Joint, type Blade, type Circle, type Rect, type SwingingRect } from './ragdoll';
import type { Building, Cycle, InteriorRoom, Opening } from './rooms/interior';
import type { Area, Sprite } from './rooms/layout';
import type { AbductSimulation } from './simulation';
// L6 clinic code: Form 7-B drones, the shut exit and the clipboard
import { drawClipboard, drawExitLock, drawProbes, letteredKey } from './probe-draw';
// L7 cruise code: the swell's dial, soup and castor tells
import { drawCastorTell, drawSwellDial, drawSwellSoup } from './swell-draw';

/** Sunrise clock, between the sleeper meter and the camera fuse on row two. */
export const DEEP_HUD_SUNRISE_SLOT = { x: 202, y: 86, w: 132, h: 64 } as const;
/** Sunrise warning, beside the Snooze Ray and above the room/exit bar. */
export const DEEP_HUD_WARNING_SLOT = { x: 230, y: 831, w: 296, h: 45 } as const;

/**
 * What the shift around this abduction looks like, set each frame by the deep-shift wrapper
 * (src/ui/deep-abduct.ts): how close sunrise is (0..1) and how many specimens are already
 * aboard (-1 = not on a shift, no counter).
 */
export const deepShift = { dawn: 0, delivered: -1 };

const TAU = Math.PI * 2;
const INK = '#1a162b';
const MINT = '#7cffcb';
const AMBER = '#ffd081';
const RED = '#ff697d';
const RED_RGB = '255,105,125';
const LIGHT = '#f1eeff';
const MUTED = '#bdb3d9';
const BUBBLE = '#e9ddd2';
const BUBBLE_EDGE = '#6c5277';
const NIGHT = '#0a0828';
const EMPTY_DASH: number[] = [];
const WARNING_DASH = [5, 7];
const EXIT_DASH = [4, 9];
const LASER_DASH = [3, 9];
const RING_DASH = [9, 8];
const STAR_COUNT = 39;
const MUMBLE_SECONDS = 1.6;
/** Radius of the ring that burns round the specimen while a camera can see it. */
const SEEN_R = 70;
/** A second sleeper's caption and wake-up shout, by name (lines in src/i18n: abduct). */
function sleeperCaption(name: string): string | undefined {
  return (tr().abduct.sleeperCaptions as Record<string, string>)[name];
}
function sleeperShout(name: string): string | undefined {
  return (tr().abduct.sleeperShouts as Record<string, string>)[name];
}
const WALL_COLORS = ['#423354', '#5b4b70', '#322943'] as const;
const PALETTES: Record<string, readonly [string, string]> = {
  'room/bg_suburb_bedroom': ['#332749', '#615071'],
  'room/bg_hallway': ['#372c47', '#59486b'],
  'room/bg_stairwell': ['#25384b', '#4c606d'],
  'room/bg_attic': ['#302638', '#564158'],
  'room/bg_living_room': ['#283448', '#475878'],
  'room/bg_kitchen': ['#304153', '#5f717c'],
  'room/bg_utility': ['#30384b', '#62677c'],
  'room/bg_garage': ['#263342', '#535d6c'],
  'room/bg_museum': ['#243745', '#4d6375'],
  'room/bg_vault': ['#273445', '#4d5674'],
  'room/bg_club': ['#2c2143', '#633960'],
  'room/bg_duct': ['#24353b', '#495d67'],
  'room/bg_office': ['#302e45', '#635069'],
  'room/bg_corridor': ['#272d44', '#4d5577'],
  'room/bg_clocktower': ['#302b3e', '#664f63'],
  'room/bg_shaft': ['#282c3c', '#4a5065'],
};
const FALLBACK_NAMES = new Map(Object.keys(ART).filter(key => key.startsWith('room/')).map(key => [key, key.slice(5).replaceAll('_', ' ')]));
const DEFAULT_PALETTE = ['#273347', '#4e5972'] as const;
/** Swinging props that are lamps: their pool of light swings with them. */
const SWING_LAMPS = new Set(['room/hanging_bulb', 'room/work_lamp', 'room/chandelier']);
/** The five screens on room/monitor_bank.svg, in its 200x140 box: x, y, w, h. */
const MONITORS = [[36, 3, 62, 37], [102, 3, 62, 37], [6, 41, 60, 49], [68, 41, 63, 50], [133, 41, 60, 49]] as const;
const DISCO = ['255,110,210', '124,255,203', '255,210,122', '120,170,255', '255,110,210', '124,255,203'] as const;

/** A fixed light in a room. flicker: 0 steady, 1 fire, 2 television, 3 screens. */
interface Light {
  x: number;
  y: number;
  r: number;
  rgb: string;
  alpha: number;
  flicker: 0 | 1 | 2 | 3;
}

/** Something small that moves on a piece of furniture, for fun. */
interface Gag {
  kind: 'tv' | 'monitors' | 'booth' | 'cooler';
  x: number;
  y: number;
  w: number;
  h: number;
}

function meter(label: string, icon: MeterState['icon'] = 'sleep'): MeterState {
  return { label, icon, value: 0, warn: 0.45, danger: 0.73, t: 0, reduced: false, flash: 0, alarm: false };
}

function label(g: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, style: string, maxWidth: number): void {
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = style;
  g.fillText(text, x, y, maxWidth);
}

// Each silhouette is drawn in the native coordinates of its room prop.
const DECOR_FALLBACKS: Readonly<Record<string, (g: CanvasRenderingContext2D) => void>> = {
  'room/potato_butte': g => {
    g.fillStyle = '#a7b7ce';
    g.beginPath();
    g.ellipse(43, 49, 40, 11, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#e5cc9f';
    g.beginPath();
    g.moveTo(12, 49);
    g.lineTo(26, 33);
    g.lineTo(33, 12);
    g.lineTo(53, 11);
    g.lineTo(61, 34);
    g.lineTo(73, 49);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#ffbd68';
    g.fillRect(39, 7, 12, 6);
  },
  'room/roswell_pennant': g => {
    g.fillStyle = '#426f73';
    g.beginPath();
    g.moveTo(20, 5);
    g.lineTo(181, 40);
    g.lineTo(20, 81);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#e5cc9f';
    g.fillRect(20, 6, 7, 74);
    label(g, 'ROSWELL', 80, 43, 'bold 18px system-ui', '#ffedc9', 88);
  },
  'room/saucer_poster': g => {
    g.fillStyle = '#d6bb94';
    g.fillRect(5, 4, 134, 114);
    g.fillStyle = '#425664';
    g.fillRect(12, 11, 120, 58);
    g.fillStyle = '#c4c7b6';
    g.beginPath();
    g.ellipse(75, 36, 25, 7, -0.18, 0, TAU);
    g.fill();
    const french = getLang() === 'fr';
    label(g, french ? 'LA VÉRITÉ' : 'I WANT TO', 72, 80, 'bold 16px system-ui', INK, 123);
    label(g, french ? 'S’EST TIRÉE' : 'BE LEAVING', 72, 101, 'bold 20px system-ui', INK, 123);
  },
  'room/towel_42': g => {
    g.fillStyle = '#bb9161';
    g.beginPath();
    g.arc(43, 12, 8, 0, TAU);
    g.fill();
    g.fillStyle = '#b86f69';
    g.beginPath();
    g.moveTo(37, 20);
    g.quadraticCurveTo(48, 10, 54, 32);
    g.lineTo(66, 91);
    g.quadraticCurveTo(42, 103, 12, 92);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#ffdfac';
    g.fillRect(17, 84, 44, 4);
    label(g, '42', 39, 59, 'bold 28px system-ui', '#ffedc9', 38);
  },
  'room/tripod_single': g => {
    g.fillStyle = '#26263f';
    g.beginPath();
    g.arc(82, 51, 47, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#e5cc9f';
    g.fillRect(5, 8, 82, 88);
    g.fillStyle = '#c77670';
    g.fillRect(10, 13, 72, 78);
    g.beginPath();
    g.moveTo(20, 66);
    g.lineTo(43, 40);
    g.lineTo(46, 72);
    g.moveTo(43, 40);
    g.lineTo(73, 58);
    g.stroke();
    g.fillStyle = '#81a49b';
    g.beginPath();
    g.arc(43, 37, 13, 0, TAU);
    g.fill();
    g.stroke();
  },
  'room/pilot_bobblehead': g => {
    g.fillStyle = '#895e55';
    g.fillRect(7, 64, 39, 7);
    g.fillStyle = '#648b82';
    g.fillRect(17, 45, 18, 18);
    g.fillStyle = '#a7b7ce';
    g.fillRect(23, 29, 5, 16);
    g.fillStyle = '#e5cc9f';
    g.beginPath();
    g.ellipse(27, 20, 19, 17, 0.12, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#495374';
    g.fillRect(16, 17, 30, 8);
  },
};

function ring(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, width: number): void {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.lineWidth = width;
  g.strokeStyle = color;
  g.stroke();
}

function fits(area: Area, x: number, y: number, w: number, h: number): boolean {
  return area.x < x + w && area.x + area.w > x && area.y < y + h && area.y + area.h > y;
}

function meets(opening: Opening, room: InteriorRoom): boolean {
  if (opening.axis === 'vertical') {
    return (opening.at === room.x || opening.at === room.x + room.w) &&
      opening.from < room.y + room.h && opening.to > room.y;
  }
  return (opening.at === room.y || opening.at === room.y + room.h) &&
    opening.from < room.x + room.w && opening.to > room.x;
}

/** Seconds into a timed hazard's cycle (the same arithmetic interior.prepare uses). */
function cyclePhase(cycle: Cycle, time: number): number {
  return (time + cycle.phase) % cycle.period;
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

/**
 * The failure card, slammed on like a stamp, with whoever (or whatever) caught you on it. An
 * alarm also sweeps a red beacon round the room.
 */
export function drawFailure(g: CanvasRenderingContext2D, sim: AbductSimulation, reducedMotion: boolean, assets?: Assets): void {
  const { failure } = sim;
  if (!failure) return;
  const age = sim.failureTime;
  const tint = reducedMotion ? 0.38 : 0.35 + Math.max(0, 0.28 - age * 1.8);
  drawEdgeTint(g, RED_RGB, tint);
  const alarm = failure.reason === 'alarm';
  if (alarm && !reducedMotion) {
    // the beacon: two red wedges turning about the middle of the screen
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.translate(VIEW_W / 2, VIEW_H * 0.42);
    g.rotate(age * 9);
    g.fillStyle = RED;
    g.globalAlpha = 0.13;
    for (let i = 0; i < 2; i++) {
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, 1100, i * Math.PI - 0.32, i * Math.PI + 0.32);
      g.fill();
    }
    g.restore();
  }
  const ab = tr().abduct;
  const heading = alarm ? ab.alarmTripped : failure.reason === 'sleeper' ? ab.sleeperWoke : ab.specimenWoke;
  const slam = reducedMotion ? 1 : 1 + 0.4 * Math.max(0, 1 - age / 0.13);
  const cx = 270;
  const cy = 693;
  g.save();
  g.translate(cx, cy);
  g.rotate(reducedMotion ? 0 : -0.012 * Math.max(0, 1 - age / 0.3) * 6);
  g.scale(slam, slam);
  g.globalAlpha = Math.min(1, age / 0.05 + (reducedMotion ? 1 : 0));
  hudPanel(g, -244, -73, 488, 146, RED);
  g.beginPath();
  g.roundRect(-240, -69, 480, 34, [15, 15, 0, 0]);
  g.fillStyle = RED;
  g.globalAlpha *= 0.2;
  g.fill();
  g.globalAlpha = Math.min(1, age / 0.05 + (reducedMotion ? 1 : 0));

  // who did it
  const ix = -190;
  g.beginPath();
  g.arc(ix, 18, 40, 0, TAU);
  g.fillStyle = '#16102e';
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = RED;
  g.stroke();
  g.save();
  g.clip();
  let drawn = false;
  if (failure.reason === 'sleeper' && sim.interior && assets) {
    for (const sleeper of sim.interior.sleepers) {
      if (sleeper.spec.name !== failure.by) continue;
      const image = assets.get(sleeper.spec.awake.key);
      if (!image) break;
      const { w, h } = sleeper.spec.awake;
      const k = 84 / Math.max(w, h);
      drawSprite(g, image, ix - (w * k) / 2, 18 - (h * k) / 2, w * k, h * k);
      drawn = true;
    }
  } else if (failure.reason === 'woke' && assets) {
    const image = assets.get('human/' + sim.room.human + '_head_awake');
    if (image) {
      const wob = reducedMotion ? 0 : Math.sin(age * 40) * 2;
      drawSprite(g, image, ix - 35 + wob, 18 - 42, 70, 80);
      drawn = true;
    }
  }
  if (!drawn) {
    if (alarm && failure.by.toLowerCase().includes('camera')) {
      // a camera, looking right at you
      g.fillStyle = '#c9cbd8';
      g.strokeStyle = INK;
      g.lineWidth = 3;
      g.beginPath();
      g.roundRect(ix - 24, 4, 44, 26, 6);
      g.fill();
      g.stroke();
      g.beginPath();
      g.roundRect(ix + 18, 9, 12, 16, 3);
      g.fillStyle = '#2a2438';
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(ix - 12, 12, 4, 0, TAU);
      g.fillStyle = Math.floor(age * 10) % 2 === 0 || reducedMotion ? '#ff3355' : '#6a2030';
      g.fill();
    } else if (alarm) {
      // a klaxon
      g.fillStyle = RED;
      g.strokeStyle = INK;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(ix, 26, 20, Math.PI, 0);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#6b63a3';
      g.fillRect(ix - 26, 26, 52, 8);
      g.strokeRect(ix - 26, 26, 52, 8);
      g.strokeStyle = AMBER;
      g.lineCap = 'round';
      g.beginPath();
      for (let i = -1; i <= 1; i++) {
        const a = -Math.PI / 2 + i * 0.7;
        g.moveTo(ix + Math.cos(a) * 26, 26 + Math.sin(a) * 26);
        g.lineTo(ix + Math.cos(a) * 34, 26 + Math.sin(a) * 34);
      }
      g.stroke();
      g.lineCap = 'butt';
    } else label(g, '!', ix, 20, '900 50px system-ui', RED, 40);
  }
  g.restore();

  label(g, heading, 0, -52, '900 15px system-ui', '#ffd9de', 448);
  // `failure.by` and the caption are ids from the room data (English): shown in the current language
  label(g, gt(failure.by), 46, -12, '900 30px system-ui', LIGHT, 350);
  const source = sim.room.interior?.caption;
  const caption = sleeperCaption(failure.by) ?? (source ? gt(source) : ab.defaultCaption);
  // one line when it fits; a longer caption (French) wraps onto two smaller lines
  g.font = '650 16px system-ui';
  if (g.measureText(caption).width <= 356) label(g, caption, 46, 34, '650 16px system-ui', MUTED, 356);
  else {
    const lines = wrapText(g, caption, 356, 14, 650);
    for (let i = 0; i < Math.min(2, lines.length); i++) label(g, lines[i]!, 46, 25 + i * 19, '650 14px system-ui', MUTED, 356);
  }
  g.restore();
}

export function drawSnooze(g: CanvasRenderingContext2D, sim: AbductSimulation, reducedMotion: boolean): void {
  if (sim.snoozePulse <= 0) return;
  g.save();
  const k = 1 - sim.snoozePulse;
  g.globalAlpha = Math.min(1, sim.snoozePulse * 1.8);
  const radius = reducedMotion ? 112 : 26 + k * 210;
  g.globalCompositeOperation = 'lighter';
  drawGlow(g, '200,164,255', sim.snoozeX, sim.snoozeY, radius * 1.1, radius * 1.1, 0.35);
  g.globalCompositeOperation = 'source-over';
  ring(g, sim.snoozeX, sim.snoozeY, radius, '#c8a4ff', 5);
  ring(g, sim.snoozeX, sim.snoozeY, radius * 0.74, MINT, 2.5);
  // a lullaby, drifting off in three directions
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i - 1) * 0.9;
    label(g, i === 1 ? '♪' : '♫', sim.snoozeX + Math.cos(a) * radius * 0.7, sim.snoozeY + Math.sin(a) * radius * 0.7, '900 34px system-ui', LIGHT, 60);
  }
  g.restore();
}

export class DeepAbductView {
  private readonly human: SpecimenArt;
  /** L5: water zones, refills and drips (src/abduct/wet-view.ts). */
  private readonly wetView: WetView | undefined;
  private readonly moistureMeter = meter(gt('Moisture').toLocaleUpperCase());
  private readonly roomPaths: Map<InteriorRoom, Navigation>;
  private readonly posterKey = localArt('room/saucer_poster');
  private readonly wakeMeter = meter(tr().abduct.wake);
  private readonly cameraMeter = meter(tr().abduct.cameraFuse, 'eye');
  private readonly sleeperMeters: readonly MeterState[];
  private readonly fx = new Particles(96);
  private readonly stars = new Float32Array(STAR_COUNT * 2);
  private readonly lights: Light[] = [];
  private readonly gags: Gag[] = [];
  /** Per hazard: last drawn camera angle and which way it is sweeping. */
  private readonly prevAngle: Float32Array;
  private readonly lead: Int8Array;
  /** Per sleeper: seconds awake, and a little hop when a noise reaches them. */
  private readonly sleeperAwake: Float32Array;
  private readonly sleeperHop: Float32Array;
  private readonly sleeperHeard: Float32Array;
  private skyGrad: CanvasGradient | null = null;
  private lastTime = 0;
  private lastSecond = -1;
  private lastBonk = 0;
  private lastItem = 0;
  /** Seconds since the souvenir was grabbed (0 = no label up). */
  private popAge = 0;
  private popX = 0;
  private popY = 0;
  private popLabel = '';
  private lastWake = 0;
  private wasDelivered = false;
  private clock = '0:00';
  private exitTitleWidth = 0;
  private measuredMumble = '';
  private mumbleWidth = 0;
  /** The mumble in the current language (the sim keeps the English line as its id). */
  private shownMumble = '';
  private currentRoom: InteriorRoom;
  private cameraX = 0;
  private cameraY = 0;
  private squash = 0;
  private meterFlash = 0;
  private wakeAge = 0;
  private sweat = 0;

  constructor(private readonly sim: AbductSimulation, private readonly ctx: GameContext) {
    const { building, sleepers, hazards } = sim.interior!;
    this.human = sim.body.plan.kind === 'dolphin' ? new DolphinArt(ctx, sim.wet) : new HumanArt(sim.room.human, ctx);
    this.wetView = sim.wet ? new WetView(sim.wet) : undefined;
    // amber below a quarter (the outline's tell), red only once she is dry (the fuse)
    this.moistureMeter.warn = 0.75;
    this.moistureMeter.danger = 0.999;
    this.currentRoom = building.rooms[0]!;
    this.roomPaths = navigation(building, sim.exitX, sim.exitY);
    this.sleeperMeters = sleepers.map(sleeper => meter(gt(sleeper.spec.name).toLocaleUpperCase()));
    this.prevAngle = new Float32Array(hazards.length);
    this.lead = new Int8Array(hazards.length);
    this.sleeperAwake = new Float32Array(sleepers.length);
    this.sleeperHop = new Float32Array(sleepers.length);
    this.sleeperHeard = new Float32Array(sleepers.length);
    for (let i = 0; i < STAR_COUNT; i++) {
      this.stars[i * 2] = (i * 0.61803398875 % 1) * VIEW_W;
      this.stars[i * 2 + 1] = (i * 0.38196601125 + i * i * 0.013) % 1 * VIEW_H;
    }
    for (const room of building.rooms) {
      for (const sprite of room.furniture) this.furnish(sprite);
      for (const { sprite } of room.supports) this.furnish(sprite);
      for (const sprite of room.decor) this.furnish(sprite);
    }
    const { exit } = sim.room;
    this.lights.push({ x: exit.x + exit.w / 2, y: exit.y + exit.h / 2, r: 250, rgb: '150,170,255', alpha: 0.5, flicker: 0 });
  }

  /** Light sources and small animations that come with a piece of furniture. */
  private furnish(s: Sprite): void {
    const x = s.x + s.w / 2;
    const y = s.y + s.h / 2;
    switch (s.key) {
      case 'room/tv_static':
        this.lights.push({ x, y, r: 190, rgb: '140,190,255', alpha: 0.5, flicker: 2 });
        this.gags.push({ kind: 'tv', x: s.x, y: s.y, w: s.w, h: s.h });
        break;
      case 'room/fireplace':
        this.lights.push({ x, y: s.y + s.h - 50, r: 210, rgb: GLOW.warm, alpha: 0.6, flicker: 1 });
        break;
      case 'room/monitor_bank':
        this.lights.push({ x, y: s.y + 40, r: 200, rgb: '110,255,200', alpha: 0.36, flicker: 3 });
        this.gags.push({ kind: 'monitors', x: s.x, y: s.y, w: s.w, h: s.h });
        break;
      case 'room/dj_booth':
        this.lights.push({ x, y: s.y + 30, r: 180, rgb: GLOW.pink, alpha: 0.34, flicker: 3 });
        this.gags.push({ kind: 'booth', x: s.x, y: s.y, w: s.w, h: s.h });
        break;
      case 'room/security_desk':
      case 'room/mayor_desk':
        this.lights.push({ x, y: s.y + 10, r: 170, rgb: GLOW.warm, alpha: 0.36, flicker: 0 });
        break;
      case 'room/water_cooler':
        this.gags.push({ kind: 'cooler', x: s.x, y: s.y, w: s.w, h: s.h });
        break;
      // L6 clinic code: indoors the only amber is the vending machine and the heart monitors
      case 'room/vending_machine':
        this.lights.push({ x, y: s.y + 70, r: 170, rgb: GLOW.amber, alpha: 0.42, flicker: 3 });
        break;
      case 'room/heart_monitor':
        this.lights.push({ x, y: s.y + 30, r: 110, rgb: GLOW.amber, alpha: 0.36, flicker: 3 });
        break;
      default:
        break;
    }
  }

  render(g: CanvasRenderingContext2D, _tutorial: boolean, dragging: boolean, turn?: TurnControl, _turnHint?: string): void {
    const { sim, ctx } = this;
    const interior = sim.interior!;
    const { building } = interior;
    const rm = ctx.reducedMotion;
    const dt = this.lastTime === 0 ? 0 : clamp(ctx.time - this.lastTime, 0, 0.05);
    this.lastTime = ctx.time;
    this.cameraX = sim.camera.x;
    this.cameraY = sim.camera.y;
    const { chestX, chestY } = sim.body;
    if (!inside(this.currentRoom, chestX, chestY)) {
      for (const room of building.rooms) {
        if (inside(room, chestX, chestY)) {
          this.currentRoom = room;
          break;
        }
      }
    }
    this.moments(dt);

    this.drawNight(g);
    g.save();
    // a hard knock rattles the view
    if (!rm && sim.shake > 0) g.translate(Math.sin(sim.elapsed * 94) * sim.shake * 4, Math.cos(sim.elapsed * 116) * sim.shake * 2.5);
    g.translate(-this.cameraX, -this.cameraY);
    for (const room of building.rooms) {
      if (!this.visible(room)) continue;
      this.backdrop(g, room);
      for (const prop of room.mounts) {
        const centerX = prop.x + prop.w / 2;
        const anchors = prop.key === 'room/dino_skull' ? 49 : 0;
        this.mount(g, centerX - anchors, room.y + 14, centerX - anchors, prop.y + (anchors ? 28 : 17));
        if (anchors) this.mount(g, centerX + anchors, room.y + 14, centerX + anchors, prop.y + 28);
        if (!room.furniture.includes(prop)) this.asset(g, prop);
      }
      for (const prop of room.decor) if (prop !== sim.room.exit) this.asset(g, prop);
      for (const { sprite } of room.supports) this.asset(g, sprite);
      for (const prop of room.furniture) this.asset(g, prop);
    }
    for (const gag of this.gags) this.gag(g, gag);
    for (const wall of building.walls) {
      if (!this.visible(wall)) continue;
      g.fillStyle = WALL_COLORS[0];
      g.fillRect(wall.x, wall.y, wall.w, wall.h);
      g.fillStyle = WALL_COLORS[1];
      g.fillRect(wall.x, wall.y, Math.max(2, wall.w - 10), 3);
      g.fillStyle = WALL_COLORS[2];
      g.fillRect(wall.x + wall.w - 3, wall.y + 3, 3, wall.h - 3);
    }
    for (const opening of building.openings) this.trim(g, opening);

    // night in the house: the room dims, then whatever gives off light gives it back
    g.globalAlpha = 0.26 * (1 - deepShift.dawn * 0.6);
    g.fillStyle = NIGHT;
    g.fillRect(this.cameraX - 8, this.cameraY - 8, VIEW_W + 16, VIEW_H + 16);
    g.globalAlpha = 1;
    this.lighting(g);

    this.exit(g);
    for (let i = 0; i < interior.hazards.length; i++) this.hazard(g, interior.hazards[i]!, i);
    drawSwellSoup(g, building, sim.elapsed, this.cameraX, this.cameraY, VIEW_W, VIEW_H); // L7 cruise code
    for (let i = 0; i < interior.sleepers.length; i++) this.sleeper(g, interior.sleepers[i]!, i, dt);
    const { beamX, beamY } = sim.body;
    const beamViewX = clamp(beamX, this.cameraX + 27, this.cameraX + VIEW_W - 27);
    const beamViewY = clamp(beamY, this.cameraY + 102, this.cameraY + VIEW_H - 93);
    if (!sim.delivered) this.beam(g, beamViewX, beamViewY, dragging);
    this.wetView?.drawBack(g, this.cameraX, this.cameraY, sim.elapsed, rm);
    this.subject(g);
    // L6 clinic code
    if (interior.probes) drawProbes(g, interior.probes, sim.body, ctx.assets, sim.elapsed, rm);
    this.wetView?.drawFront(g, this.cameraX, this.cameraY, sim.elapsed, rm);
    if (!sim.delivered) {
      if (turn) drawTurnTell(g, beamViewX, beamViewY, dragging ? 23 : 18, turn, sim.body.tilt, ctx.reducedMotion);
      this.reticle(g, beamViewX, beamViewY, dragging);
    }
    this.seen(g);
    if (sim.delivered) {
      // the exit swallows the specimen in a bloom of beam light
      const p = sim.slurp * sim.slurp;
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.mint, sim.exitX, sim.exitY, 60 + 170 * p, 60 + 170 * p, 0.25 + 0.75 * bump(sim.slurp));
      drawGlow(g, GLOW.white, sim.exitX, sim.exitY, 30 + 60 * p, 30 + 60 * p, bump(sim.slurp));
      g.globalCompositeOperation = 'source-over';
    }
    this.fx.draw(g);
    drawSouvenirPop(g, this.popX, this.popY, this.popAge, this.popLabel, rm);
    drawSnooze(g, sim, rm);
    g.restore();

    if (deepShift.dawn > 0) drawWash(g, GLOW.dawn, 0.05, 1, 0.95, 0, deepShift.dawn * 0.4);
    drawVignette(g, 0.85);
    if (!sim.failure && !sim.delivered) this.direction(g);
    if (interior.exposure > 0) drawEdgeTint(g, RED_RGB, interior.exposure * 0.63);
    if (sim.delivered) {
      const p = sim.slurp * sim.slurp;
      g.globalAlpha = p * p * (rm ? 0.25 : 0.6);
      g.fillStyle = '#d9fff0';
      g.fillRect(0, 0, VIEW_W, VIEW_H);
      g.globalAlpha = 1;
    }
    this.hud(g, turn);
    drawSwellDial(g, building, sim.elapsed, ctx.assets, rm); // L7 cruise code
    drawFailure(g, sim, rm, ctx.assets);
  }

  private visible(a: Area): boolean {
    return fits(a, this.cameraX - 18, this.cameraY - 18, VIEW_W + 36, VIEW_H + 36);
  }

  private visibleCircle(x: number, y: number, r: number): boolean {
    return x + r >= this.cameraX && x - r <= this.cameraX + VIEW_W &&
      y + r >= this.cameraY && y - r <= this.cameraY + VIEW_H;
  }

  /** Outside the building: night sky above the ground line, earth below it. */
  private drawNight(g: CanvasRenderingContext2D): void {
    if (!this.skyGrad) {
      this.skyGrad = g.createLinearGradient(0, 0, 0, VIEW_H);
      this.skyGrad.addColorStop(0, '#0d0a24');
      this.skyGrad.addColorStop(1, '#1d1746');
    }
    g.fillStyle = this.skyGrad;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    const dawn = deepShift.dawn;
    if (dawn > 0) drawWash(g, '255,150,110', 0.5, 0.1, 0.5, 1, dawn * 0.75);
    g.fillStyle = '#8f83b4';
    g.globalAlpha = 1 - dawn * 0.8;
    for (let i = 0; i < STAR_COUNT; i++) {
      const x = ((this.stars[i * 2]! - this.cameraX * 0.16) % VIEW_W + VIEW_W) % VIEW_W;
      const y = ((this.stars[i * 2 + 1]! - this.cameraY * 0.13) % VIEW_H + VIEW_H) % VIEW_H;
      g.fillRect(x, y, i % 7 === 0 ? 2.5 : 1.4, i % 7 === 0 ? 2.5 : 1.4);
    }
    g.globalAlpha = 1;
    // the ground the building stands on
    const { bounds } = this.sim.interior!.building;
    const ground = this.groundLine(bounds) - this.cameraY;
    if (ground < VIEW_H) {
      // far rooftops along the horizon, drifting slower than the house
      g.fillStyle = '#17123a';
      const shift = ((this.cameraX * 0.35) % 150 + 150) % 150;
      for (let x = -shift - 150; x < VIEW_W; x += 150) {
        g.fillRect(x, ground - 46, 64, 46);
        g.fillRect(x + 78, ground - 26, 50, 26);
        g.fillRect(x + 14, ground - 60, 16, 14);
      }
      g.fillStyle = '#1c1830';
      g.fillRect(0, ground, VIEW_W, VIEW_H - ground);
      g.fillStyle = '#2d4a3c';
      g.fillRect(0, ground, VIEW_W, 7);
      g.fillStyle = '#241f3c';
      for (let y = ground + 46; y < VIEW_H; y += 58) g.fillRect(0, y, VIEW_W, 3);
    }
  }

  /** World y of street level: the floor of the lowest room that starts at or above y = 0. */
  private groundLine(bounds: Area): number {
    return bounds.y + bounds.h - 14;
  }

  private backdrop(g: CanvasRenderingContext2D, room: InteriorRoom): void {
    const { x, y, w, h } = room;
    const image = this.ctx.assets.get(room.backdrop);
    if (image) {
      const spec = ART[room.backdrop]!;
      const left = x;
      const width = w;
      const top = y;
      const floor = y + h - 14;
      const floorDepth = 32;
      const baseboard = floor - floorDepth;
      // All deep-room art has a wall above source y=600. Keep the wall and
      // baseboard separate so a shaft can repeat the wall without adding floors.
      const wallSlice = 600;
      const scale = Math.min(1, width / spec.w);
      const tileW = spec.w * scale;
      const span = baseboard - top;
      const tileH = h > 800 ? wallSlice * scale : span;
      // The backdrop is rasterised once at its tile size; every tile is cut from that bitmap.
      const bitmap = bitmapOf(image, tileW, spec.h * scale);
      const source: CanvasImageSource = bitmap ?? image;
      const kx = bitmap ? scale * bitmapPx() : 1;
      const ky = kx;
      for (let tileX = left, col = 0; tileX < left + width; tileX += tileW, col++) {
        if (tileX + tileW < this.cameraX || tileX > this.cameraX + VIEW_W) continue;
        const drawW = Math.min(tileW, left + width - tileX);
        g.save();
        g.translate(col % 2 ? tileX + drawW : tileX, 0);
        if (col % 2) g.scale(-1, 1);
        const sourceX = col % 2 ? spec.w - drawW / scale : 0;
        for (let tileY = top, row = 0; tileY < baseboard; tileY += tileH, row++) {
          const drawH = Math.min(tileH, baseboard - tileY);
          if (tileY + drawH < this.cameraY || tileY > this.cameraY + VIEW_H) continue;
          const slice = wallSlice * drawH / tileH;
          if (row % 2) {
            g.save();
            g.translate(0, tileY + drawH);
            g.scale(1, -1);
            g.drawImage(source, sourceX * kx, (wallSlice - slice) * ky, (drawW / scale) * kx, slice * ky, 0, 0, drawW, drawH);
            g.restore();
          } else {
            g.drawImage(source, sourceX * kx, 0, (drawW / scale) * kx, slice * ky, 0, tileY, drawW, drawH);
          }
        }
        if (baseboard < this.cameraY + VIEW_H && floor + 14 > this.cameraY) {
          g.drawImage(source, sourceX * kx, wallSlice * ky, (drawW / scale) * kx, 67 * ky, 0, baseboard, drawW, floorDepth + 14);
        }
        g.restore();
      }
      return;
    }

    const palette = PALETTES[room.backdrop] ?? DEFAULT_PALETTE;
    g.fillStyle = palette[0];
    g.fillRect(x, y, w, h);
    g.fillStyle = palette[1];
    g.globalAlpha = 0.14;
    const start = Math.max(x + 25, x + 25 + Math.floor((this.cameraX - x - 25) / 58) * 58);
    for (let line = start; line < x + w - 15 && line < this.cameraX + VIEW_W; line += 58) g.fillRect(line, y, 2, h);
    g.fillRect(x, y + h - 46, w, 32);
    g.globalAlpha = 0.6;
    g.fillRect(x, y + h - 46, w, 3);
    g.globalAlpha = 1;
  }

  /** Additive pools of light: screens, embers, moonlight at the exit, and every swinging lamp. */
  private lighting(g: CanvasRenderingContext2D): void {
    const t = this.sim.elapsed;
    const rm = this.ctx.reducedMotion;
    const dawn = deepShift.dawn;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.lights.length; i++) {
      const l = this.lights[i]!;
      if (!this.visibleCircle(l.x, l.y, l.r)) continue;
      let k = 1;
      if (!rm) {
        if (l.flicker === 1) k = 0.82 + 0.18 * Math.sin(t * 9) * Math.sin(t * 5.3);
        else if (l.flicker === 2) k = 0.55 + 0.45 * Math.abs(Math.sin(t * 13.1) * Math.sin(t * 4.7 + 1));
        else if (l.flicker === 3) k = 0.85 + 0.15 * Math.sin(t * 3.1 + i);
      }
      // the last light in the list is the exit: moonlight, warming to daylight as sunrise comes
      const exitLight = i === this.lights.length - 1;
      if (exitLight && dawn > 0) drawGlow(g, GLOW.dawn, l.x, l.y, l.r * 1.2, l.r * 1.2, 0.7 * dawn);
      drawGlow(g, l.rgb, l.x, l.y, l.r, l.r, l.alpha * k * (exitLight ? 1 - dawn * 0.6 : 1));
    }
    for (const state of this.sim.interior!.hazards) {
      const { spec } = state;
      if (spec.kind === 'swing') {
        const shape = state.shapes[0] as SwingingRect;
        const tipX = shape.x - Math.sin(shape.angle) * shape.h * 0.86;
        const tipY = shape.y + Math.cos(shape.angle) * shape.h * 0.86;
        if (SWING_LAMPS.has(spec.sprite.key)) {
          if (this.visibleCircle(tipX, tipY, 190)) {
            drawGlow(g, GLOW.warm, tipX, tipY + 40, 190, 190, 0.5);
            drawGlow(g, GLOW.amber, tipX, tipY, 34, 34, 0.9);
          }
        } else if (spec.sprite.key === 'room/disco_ball' && this.visibleCircle(tipX, tipY, 330)) {
          // six spots of colour wheeling round the room
          const turn = rm ? 0.4 : t * 0.7;
          for (let k = 0; k < DISCO.length; k++) {
            const a = turn * (k % 2 === 0 ? 1 : -0.8) + k * 1.05;
            const r = 150 + (k % 3) * 60;
            drawGlow(g, DISCO[k]!, tipX + Math.cos(a) * r, tipY + 80 + Math.sin(a) * r * 0.55, 34, 26, 0.5);
          }
          drawGlow(g, GLOW.white, tipX, tipY - 30, 46, 46, 0.35);
        }
      } else if (spec.kind === 'fragile' && spec.sprite.key === 'room/fish_tank' && !state.broken) {
        const s = spec.sprite;
        if (this.visibleCircle(s.x + s.w / 2, s.y + s.h / 2, 130)) drawGlow(g, '110,230,255', s.x + s.w / 2, s.y + s.h / 2, 130, 110, 0.4);
      }
    }
    g.globalCompositeOperation = 'source-over';
  }

  /** Small things that move on the furniture. Decoration only. */
  private gag(g: CanvasRenderingContext2D, gag: Gag): void {
    if (!fits(gag, this.cameraX, this.cameraY, VIEW_W, VIEW_H)) return;
    const t = this.sim.elapsed;
    const rm = this.ctx.reducedMotion;
    const { x, y, w, h } = gag;
    switch (gag.kind) {
      case 'tv': {
        // static crawling up the screen
        g.fillStyle = '#eaf4ff';
        for (let i = 0; i < 4; i++) {
          const k = rm ? i / 4 : (t * 1.7 + i / 4) % 1;
          g.globalAlpha = 0.16 + 0.12 * Math.sin(t * 31 + i * 2);
          g.fillRect(x + w * 0.16, y + h * 0.22 + h * 0.5 * (1 - k), w * 0.68, 3);
        }
        g.globalAlpha = 1;
        break;
      }
      case 'monitors': {
        // one screen at a time gets the "motion detected" frame
        const n = rm ? 2 : Math.floor(t * 0.8) % MONITORS.length;
        if (rm || (t * 0.8) % 1 < 0.6) {
          const mon = MONITORS[n]!;
          const kx = w / 200;
          const ky = h / 140;
          g.strokeStyle = RED;
          g.lineWidth = 2.5;
          g.strokeRect(x + (mon[0] + 3) * kx, y + (mon[1] + 3) * ky, (mon[2] - 6) * kx, (mon[3] - 8) * ky);
        }
        break;
      }
      case 'booth': {
        // the level meters are still bouncing
        g.fillStyle = MINT;
        for (let i = 0; i < 7; i++) {
          const k = rm ? 0.5 : 0.25 + 0.75 * Math.abs(Math.sin(t * (3 + i * 0.7) + i));
          g.globalAlpha = 0.85;
          g.fillRect(x + w * 0.62 + i * 7, y + h * 0.3 - 14 * k, 4.5, 14 * k);
        }
        g.globalAlpha = 1;
        break;
      }
      case 'cooler': {
        // glug
        const k = rm ? 0.4 : (t * 0.45) % 1;
        if (k < 0.5) {
          g.fillStyle = '#d9f4ff';
          g.globalAlpha = 0.8 * (1 - k * 2);
          g.beginPath();
          g.arc(x + w * 0.5 + Math.sin(k * 20) * 3, y + h * 0.3 - k * 44, 3 + k * 5, 0, TAU);
          g.fill();
          g.globalAlpha = 1;
        }
        break;
      }
    }
  }

  private asset(g: CanvasRenderingContext2D, s: Sprite, solid = false): void {
    if (!this.visible(s)) return;
    if (s.key === 'room/ladder') {
      this.ladder(g, s);
      return;
    }
    this.drawArt(g, s.key, s.x, s.y, s.w, s.h, solid);
  }

  private ladder(g: CanvasRenderingContext2D, { x, y, w, h }: Area): void {
    g.fillStyle = INK;
    g.fillRect(x, y, 12, h);
    g.fillRect(x + w - 12, y, 12, h);
    g.fillStyle = '#bb9161';
    g.fillRect(x + 2, y, 8, h);
    g.fillRect(x + w - 10, y, 8, h);
    const first = Math.max(16, 16 + Math.floor((this.cameraY - y - 16) / 28) * 28);
    for (let rung = first; rung < h - 6 && y + rung < this.cameraY + VIEW_H; rung += 28) {
      g.fillStyle = INK;
      g.fillRect(x + 9, y + rung, w - 18, 8);
      g.fillStyle = '#e5cc9f';
      g.fillRect(x + 10, y + rung + 2, w - 20, 3);
    }
  }

  private mount(g: CanvasRenderingContext2D, x: number, y: number, endX: number, endY: number, width = 4): void {
    g.fillStyle = '#756986';
    g.fillRect(x - 10, y, 20, 6);
    g.beginPath();
    g.moveTo(x, y + 5);
    g.lineTo(endX, endY);
    g.lineWidth = width;
    g.strokeStyle = INK;
    g.stroke();
    g.lineWidth = Math.max(1, width - 3);
    g.strokeStyle = '#a398ad';
    g.stroke();
  }

  private drawArt(g: CanvasRenderingContext2D, key: string, x: number, y: number, w: number, h: number, solid = false): void {
    const image = this.ctx.assets.get(key === 'room/saucer_poster' ? this.posterKey : letteredKey(key));
    if (image) {
      drawSprite(g, image, x, y, w, h);
    } else if (DECOR_FALLBACKS[key]) {
      g.save();
      g.translate(x, y);
      g.lineWidth = 2.5;
      g.lineJoin = 'round';
      g.strokeStyle = INK;
      DECOR_FALLBACKS[key](g);
      g.restore();
    } else if (key === 'room/watch_dog') {
      this.watchDog(g, x, y, w, h);
    } else if (key === 'room/chimney_stack') {
      this.chimney(g, x, y, w, h);
    } else {
      g.fillStyle = solid ? '#594a68' : '#554361';
      g.lineWidth = 2.5;
      g.strokeStyle = INK;
      g.beginPath();
      g.roundRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2), Math.min(8, w / 3, h / 3));
      g.fill();
      g.stroke();
      g.fillStyle = '#a592ac';
      g.globalAlpha *= 0.5;
      g.fillRect(x + w * 0.13, y + h * 0.15, w * 0.74, Math.min(5, h * 0.16));
      g.globalAlpha *= 2;
      if (w >= 87 && h >= 30) {
        const name = FALLBACK_NAMES.get(key) ?? '';
        label(g, name, x + w / 2, y + h * 0.52, '750 12px system-ui', '#e2cce3', w - 14);
      }
    }
    if (solid) {
      g.lineWidth = 1.4;
      g.strokeStyle = 'rgba(235,207,172,0.38)';
      g.strokeRect(x + 0.7, y + 0.7, w - 1.4, h - 1.4);
    }
  }

  private trim(g: CanvasRenderingContext2D, opening: Opening): void {
    const { axis, at, from, to, trim } = opening;
    const vertical = axis === 'vertical';
    const cx = vertical ? at : (from + to) / 2;
    const cy = vertical ? (from + to) / 2 : at;
    if (!this.visibleCircle(cx, cy, (to - from) / 2 + 30)) return;
    g.fillStyle = vertical ? '#a68896' : '#867e9d';
    if (vertical) {
      g.fillRect(at - 19, from - 7, 38, 7);
      g.fillRect(at - 19, to, 38, 7);
      g.fillStyle = 'rgba(62,47,74,0.52)';
      g.fillRect(at - 5, from, 10, to - from);
      g.fillStyle = 'rgba(212,181,174,0.48)';
      g.fillRect(at - 7, from, 2, to - from);
      g.fillRect(at + 5, from, 2, to - from);
    } else {
      g.fillRect(from - 7, at - 16, 7, 32);
      g.fillRect(to, at - 16, 7, 32);
      g.fillStyle = trim === 'flue' ? '#906b65' : 'rgba(152,134,185,0.2)';
      g.fillRect(from, at - 4, to - from, 8);
    }
  }

  private exit(g: CanvasRenderingContext2D): void {
    const { sim, ctx } = this;
    if (!this.visible(sim.room.exit)) return;
    const { x, y, w, h, key } = sim.room.exit;
    const zone = sim.room.exitZone;
    const rm = ctx.reducedMotion;
    // L6 clinic code: until Form 7-B is complete the exit is shut (amber, never red)
    const probes = sim.interior?.probes;
    if (probes && !probes.done) {
      this.drawArt(g, key, x, y, w, h);
      drawExitLock(g, probes, zone, sim.elapsed, rm);
      return;
    }
    const pulse = rm ? 0.5 : 0.5 + 0.5 * Math.sin(sim.elapsed * 3.2);
    // the closer the specimen, the louder the exit
    const near = 1 - clamp((Math.hypot(sim.body.chestX - sim.exitX, sim.body.chestY - sim.exitY) - 60) / 300, 0, 1);
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.mint, sim.exitX, sim.exitY, 170, 170, 0.3 + 0.12 * pulse + 0.3 * near);
    g.globalCompositeOperation = 'source-over';
    this.drawArt(g, key, x, y, w, h);
    g.fillStyle = MINT;
    g.globalAlpha = 0.07 + 0.07 * pulse + 0.1 * near;
    g.fillRect(zone.x, zone.y, zone.w, zone.h);
    g.globalAlpha = 1;
    g.setLineDash(EXIT_DASH);
    g.lineDashOffset = rm ? 0 : -sim.elapsed * 14;
    g.lineWidth = 3 + near;
    g.strokeStyle = MINT;
    g.strokeRect(zone.x, zone.y, zone.w, zone.h);
    g.setLineDash(EMPTY_DASH);
    g.lineDashOffset = 0;
    // two chevrons climbing into the exit
    g.lineWidth = 3.5;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    for (let i = 0; i < 2; i++) {
      const cy = sim.exitY + 4 + i * 11 - pulse * (5 + near * 4);
      g.moveTo(sim.exitX - 10, cy + 3);
      g.lineTo(sim.exitX, cy - 7);
      g.lineTo(sim.exitX + 10, cy + 3);
    }
    g.stroke();
    g.lineCap = 'butt';
    const title = gt(sim.room.interior!.exitName);
    if (this.exitTitleWidth === 0) {
      g.font = '900 14px system-ui';
      this.exitTitleWidth = g.measureText(title).width + 22;
    }
    const width = this.exitTitleWidth;
    const titleY = sim.room.roofExit ? Math.max(y + h, zone.y + zone.h) + 17 : y - 17;
    hudPanel(g, sim.exitX - width / 2, titleY - 12, width, 24);
    label(g, title, sim.exitX, titleY, '900 14px system-ui', MINT, width - 12);
  }

  /**
   * A small dial beside a timed hazard: how long the gap stays open (mint, amber for the last
   * moments) or how long until it opens again (red).
   */
  private dial(g: CanvasRenderingContext2D, x: number, y: number, cycle: Cycle, tell: boolean): void {
    const p = cyclePhase(cycle, this.sim.elapsed);
    const open = p < cycle.open;
    const frac = open ? (cycle.open - p) / cycle.open : (cycle.period - p) / (cycle.period - cycle.open);
    g.beginPath();
    g.arc(x, y, 13, 0, TAU);
    g.fillStyle = '#16102e';
    g.fill();
    g.beginPath();
    g.moveTo(x, y);
    g.arc(x, y, 10, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(frac, 0, 1));
    g.closePath();
    g.fillStyle = open ? (tell ? AMBER : MINT) : RED;
    g.fill();
    ring(g, x, y, 13, open ? (tell ? AMBER : '#d9fff0') : RED, 2.5);
  }

  private hazard(g: CanvasRenderingContext2D, state: HazardState, index: number): void {
    const { spec } = state;
    switch (spec.kind) {
      case 'swing': {
        const shape = state.shapes[0] as SwingingRect;
        if (!this.visibleCircle(shape.x, shape.y, Math.hypot(shape.h, shape.w / 2))) return;
        if (spec.mountY !== undefined) this.mount(g, shape.x, spec.mountY, shape.x, shape.y);
        g.save();
        g.translate(shape.x, shape.y);
        g.rotate(shape.angle);
        this.drawArt(g, spec.sprite.key, -shape.w / 2, 0, shape.w, shape.h, true);
        g.restore();
        ring(g, shape.x, shape.y, 5, AMBER, 2.5);
        break;
      }
      case 'fan': {
        if (!this.visibleCircle(spec.x, spec.y, spec.length + 18)) return;
        const hub = state.shapes[0] as Circle;
        if (spec.duct) {
          ring(g, spec.x, spec.y, spec.length + 10, '#6a7585', 4);
        } else if (spec.mountY !== undefined) {
          this.mount(g, spec.x, spec.mountY, spec.x, spec.y, 9);
        }
        // the disc the blades sweep, so their reach reads at any angle
        g.beginPath();
        g.arc(spec.x, spec.y, spec.length, 0, TAU);
        g.fillStyle = AMBER;
        g.globalAlpha = 0.07;
        g.fill();
        g.globalAlpha = 1;
        for (let i = 1; i < state.shapes.length; i++) {
          const blade = state.shapes[i] as Blade;
          g.save();
          g.translate(blade.x, blade.y);
          g.rotate(blade.angle);
          g.beginPath();
          g.roundRect(blade.from - blade.r, -blade.r, blade.to - blade.from + 2 * blade.r, 2 * blade.r, blade.r);
          g.clip();
          g.fillStyle = '#967386';
          g.fillRect(0, -blade.r, blade.to + blade.r, blade.r * 2);
          this.drawArt(g, 'room/fan_blade', 0, -blade.r, blade.to + blade.r, blade.r * 2);
          g.lineWidth = 3;
          g.strokeStyle = AMBER;
          g.stroke();
          g.restore();
        }
        this.drawArt(g, 'room/fan_hub', hub.x - hub.r, hub.y - hub.r, hub.r * 2, hub.r * 2);
        ring(g, hub.x, hub.y, hub.r - 1, AMBER, 2);
        break;
      }
      case 'gear': {
        if (!this.visible(spec.sprite)) return;
        const circle = state.shapes[0] as Circle;
        g.save();
        g.translate(circle.x, circle.y);
        g.beginPath();
        g.arc(0, 0, circle.r, 0, TAU);
        g.clip();
        g.fillStyle = '#6c536b';
        g.fill();
        g.rotate(state.angle);
        this.drawArt(g, spec.sprite.key, -circle.r, -circle.r, circle.r * 2, circle.r * 2);
        g.strokeStyle = AMBER;
        g.lineWidth = 3;
        g.stroke();
        g.restore();
        break;
      }
      case 'patrol': {
        const shape = state.shapes[0] as Rect;
        if (this.visible(shape)) {
          const facingLeft = spec.barks && shape.vx < 0;
          // a trotting dog bobs; everything else glides
          const bob = spec.barks && !this.ctx.reducedMotion ? Math.abs(Math.sin(this.sim.elapsed * 11)) * 2.5 : 0;
          if (facingLeft) {
            g.save();
            g.translate(2 * shape.x + shape.w, 0);
            g.scale(-1, 1);
          }
          this.drawArt(g, spec.sprite.key, shape.x, shape.y - bob, shape.w, shape.h);
          if (facingLeft) g.restore();
          if (spec.sprite.key === 'room/robot_vacuum') {
            // its little status light
            const on = this.ctx.reducedMotion || Math.floor(this.sim.elapsed * 2.5) % 2 === 0;
            g.globalCompositeOperation = 'lighter';
            drawGlow(g, on ? GLOW.mint : GLOW.amber, shape.x + shape.w / 2, shape.y + 4, 9, 9, 0.9);
            g.globalCompositeOperation = 'source-over';
          }
          if (spec.barks && state.pulse > 0) {
            const cx = shape.x + shape.w / 2;
            const cy = shape.y + shape.h / 2;
            ring(g, cx, cy, 20 + (1 - state.pulse) * 95, AMBER, 3);
            g.globalAlpha = Math.min(1, state.pulse * 2);
            label(g, tr().abduct.woof, cx, shape.y - 22 - (1 - state.pulse) * 14, '900 22px system-ui', AMBER, 100);
            g.globalAlpha = 1;
          }
        }
        break;
      }
      case 'fragile':
        if (!this.visible(spec.sprite)) return;
        if (state.broken) {
          const { x, y, w, h } = spec.sprite;
          this.drawArt(g, 'room/shards', x + w / 2 - 30, y + h - 20, 60, 20);
          if (state.pulse > 0) {
            ring(g, x + w / 2, y + h / 2, 23 + (1 - state.pulse) * 92, AMBER, 2);
            g.globalAlpha = Math.min(1, state.pulse * 2);
            label(g, tr().abduct.crash, x + w / 2, y - 12 - (1 - state.pulse) * 16, '900 22px system-ui', AMBER, 110);
            g.globalAlpha = 1;
          }
        } else {
          this.asset(g, spec.sprite, true);
          if (spec.sprite.key === 'room/fish_tank' && !this.ctx.reducedMotion) {
            // somebody lives in there
            const { x, y, w, h } = spec.sprite;
            const k = (this.sim.elapsed * 0.13) % 1;
            const dir = k < 0.5 ? 1 : -1;
            const fx = x + w * (0.25 + 0.5 * (k < 0.5 ? k * 2 : 2 - k * 2));
            const fy = y + h * 0.55 + Math.sin(this.sim.elapsed * 2) * 4;
            g.fillStyle = '#ffb347';
            g.beginPath();
            g.ellipse(fx, fy, 6, 3.5, 0, 0, TAU);
            g.moveTo(fx - dir * 5, fy);
            g.lineTo(fx - dir * 11, fy - 4);
            g.lineTo(fx - dir * 11, fy + 4);
            g.fill();
          }
        }
        break;
      case 'laser':
        if (this.visible(spec.area)) this.laser(g, state, spec.area, spec.cycle, spec.mountY);
        break;
      case 'gate':
      case 'pop': {
        const shape = state.shapes[0]!;
        if (spec.kind === 'gate' && shape.kind === 'swingingRect') {
          if (!this.visibleCircle(shape.x, shape.y, shape.h + shape.w)) return;
          g.save();
          g.translate(shape.x, shape.y);
          g.rotate(shape.angle);
          this.shutter(g, -shape.w / 2, 0, shape.w, shape.h, true, state.tell);
          g.restore();
          ring(g, shape.x, shape.y, 6, state.tell ? AMBER : MINT, 2.5);
          this.dial(g, shape.x, shape.y - 24, spec.cycle, state.tell);
          return;
        }
        if (shape.kind !== 'rect' || !this.visible(spec.area)) return;
        const { x, y, w, h } = spec.area;
        const flash = state.tell && (this.ctx.reducedMotion || Math.floor(this.sim.elapsed * 9) % 2 === 0);
        // the doorway the panel shuts across
        g.fillStyle = state.tell ? AMBER : '#8870ba';
        g.globalAlpha = state.tell ? (flash ? 0.3 : 0.14) : 0.14;
        g.fillRect(x, y, w, h);
        g.globalAlpha = 1;
        if (shape.active) {
          if (spec.kind === 'gate') {
            this.shutter(g, shape.x, shape.y, shape.w, shape.h, spec.axis === 'y', state.tell);
          } else {
            this.bird(g, shape, spec.area);
          }
        }
        g.lineWidth = state.tell ? 3.5 : 1.5;
        g.strokeStyle = state.tell ? AMBER : '#a791bc';
        if (shape.active && spec.kind === 'gate') g.strokeRect(shape.x, shape.y, shape.w, shape.h);
        else if (!shape.active || spec.kind === 'gate') g.strokeRect(x, y, w, h);
        if (spec.kind === 'gate') {
          g.fillStyle = '#796b89';
          if (spec.axis === 'y') {
            g.fillRect(x - 4, y - 8, w + 8, 11);
            this.dial(g, x + w / 2, y - 26, spec.cycle, state.tell);
          } else {
            g.fillRect(x - 8, y - 4, 11, h + 8);
            this.dial(g, x + 26, y - 20, spec.cycle, state.tell);
          }
        } else {
          this.cuckooHouse(g, x, y, w, h, state.tell);
          this.dial(g, x + w + 12, y - 30, spec.cycle, state.tell);
          if (shape.active && state.level > 0.6 && shape.w > w * 0.8) {
            label(g, tr().abduct.cuckoo, x + w / 2, y - 16, '900 17px system-ui', AMBER, 110);
          }
        }
        break;
      }
      case 'camera':
        this.cameraCone(g, state, index);
        break;
      case 'creak':
        if (this.visible(spec.area)) this.zone(g, spec.area, state.pulse, '#dc9e66');
        break;
      case 'draft':
        if (this.visible(spec.area)) this.draft(g, spec.area, spec.ay);
        break;
      // L7 cruise code: a trolley or deckchair stack on castors, rolling with the swell
      case 'castor': {
        const shape = state.shapes[0] as Rect;
        if (!this.visible({ x: shape.x - spec.travel, y: shape.y, w: shape.w + spec.travel * 2, h: shape.h })) return;
        this.drawArt(g, spec.sprite.key, shape.x, shape.y, shape.w, shape.h, true);
        drawCastorTell(g, spec, shape, this.sim.elapsed, this.ctx.reducedMotion);
        break;
      }
      case 'speaker': {
        this.asset(g, spec.sprite, true);
        const cx = spec.sprite.x + spec.sprite.w / 2;
        const cy = spec.sprite.y + spec.sprite.h / 2;
        if (!this.visibleCircle(cx, cy, spec.radius)) return;
        const beat = Math.max(0, 1 - (state.next - this.sim.elapsed) / 0.38);
        g.save();
        // the cone thumps on the beat
        if (state.pulse > 0) {
          g.globalCompositeOperation = 'lighter';
          drawGlow(g, '226,160,255', cx, cy, 70 + 60 * state.pulse, 70 + 60 * state.pulse, 0.5 * state.pulse);
          g.globalCompositeOperation = 'source-over';
        }
        g.globalAlpha = 0.32 + 0.58 * Math.max(beat, state.pulse);
        g.setLineDash(WARNING_DASH);
        ring(g, cx, cy, spec.radius, '#e2a0ff', 2.5);
        g.setLineDash(EMPTY_DASH);
        if (state.pulse > 0) ring(g, cx, cy, this.ctx.reducedMotion ? spec.radius * 0.75 : spec.radius * (1 - state.pulse * 0.85), '#e2a0ff', 4);
        g.restore();
        break;
      }
    }
  }

  private shutter(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, vertical: boolean, tell: boolean): void {
    g.fillStyle = '#495374';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#a7b7ce';
    const length = vertical ? h : w;
    for (let slat = 5; slat < length - 2; slat += 15) {
      if (vertical) g.fillRect(x + 3, y + slat, w - 6, 2);
      else g.fillRect(x + slat, y + 3, 2, h - 6);
    }
    // the edge that closes on you: hazard yellow, brighter when it is about to move
    g.fillStyle = tell ? '#fff0b8' : '#e8b84a';
    if (vertical) g.fillRect(x, y + Math.max(0, h - 6), w, Math.min(h, 6));
    else g.fillRect(x + Math.max(0, w - 6), y, Math.min(w, 6), h);
    g.fillStyle = INK;
    if (vertical) for (let k = 3; k < w - 4; k += 12) g.fillRect(x + k, y + Math.max(0, h - 6), 5, Math.min(h, 6));
    else for (let k = 3; k < h - 4; k += 12) g.fillRect(x + Math.max(0, w - 6), y + k, Math.min(w, 6), 5);
  }

  /** The little house the cuckoo lives in, on the wall at the right of its reach. */
  private cuckooHouse(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tell: boolean): void {
    const hx = x + w - 3;
    const rattle = tell && !this.ctx.reducedMotion ? Math.sin(this.sim.elapsed * 60) * 1.5 : 0;
    g.fillStyle = '#796b89';
    g.fillRect(hx + 24, y + h / 2 - 5, 26, 10);
    g.lineWidth = 3;
    g.strokeStyle = INK;
    g.fillStyle = '#7a4e58';
    g.beginPath();
    g.moveTo(hx + rattle, y - 4);
    g.lineTo(hx + 15 + rattle, y - 20);
    g.lineTo(hx + 30 + rattle, y - 4);
    g.lineTo(hx + 30 + rattle, y + h + 8);
    g.lineTo(hx + rattle, y + h + 8);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = tell ? AMBER : '#2a1f38';
    g.fillRect(hx + 6 + rattle, y + 6, 18, h - 10);
  }

  private chimney(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    g.fillStyle = '#545168';
    g.fillRect(x, y, w, h);
    g.strokeStyle = '#454157';
    g.lineWidth = 3;
    g.beginPath();
    for (let row = 0; row < h; row += 23) {
      g.moveTo(x, y + row);
      g.lineTo(x + w, y + row);
      const offset = row % 46 === 0 ? 26 : 57;
      for (let mortar = offset; mortar < w; mortar += 62) {
        g.moveTo(x + mortar, y + row);
        g.lineTo(x + mortar, y + Math.min(row + 23, h));
      }
    }
    g.stroke();
    g.fillStyle = '#68637a';
    g.fillRect(x + w - 11, y, 3, h);
  }

  private watchDog(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    g.save();
    g.translate(x, y);
    g.scale(w / 89, h / 62);
    g.fillStyle = '#bb9161';
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(14, 50);
    g.quadraticCurveTo(13, 35, 2, 27);
    g.quadraticCurveTo(16, 29, 22, 34);
    g.quadraticCurveTo(38, 25, 56, 34);
    g.quadraticCurveTo(60, 23, 67, 21);
    g.lineTo(68, 4);
    g.lineTo(78, 19);
    g.quadraticCurveTo(86, 20, 88, 34);
    g.lineTo(73, 39);
    g.lineTo(68, 60);
    g.lineTo(58, 60);
    g.lineTo(56, 49);
    g.lineTo(27, 49);
    g.lineTo(24, 60);
    g.lineTo(14, 60);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#594050';
    g.fillRect(58, 31, 6, 14);
    g.fillStyle = INK;
    g.fillRect(75, 25, 3, 3);
    g.fillRect(84, 29, 4, 5);
    g.restore();
  }

  /**
   * A pulsing laser. Off: a faint dotted sight line. Tell (0.35 s): the emitters charge and the
   * line flickers amber, thickening. On: a red bar with a white core and a glow. The bar drawn is
   * the bar that trips the alarm.
   */
  private laser(g: CanvasRenderingContext2D, state: HazardState, area: Area, cycle: Cycle, mountY?: number): void {
    const { x, y, w, h } = area;
    const vertical = h > w;
    const rm = this.ctx.reducedMotion;
    const t = this.sim.elapsed;
    const nearX = vertical ? x + w / 2 : x;
    const nearY = vertical ? y : y + h / 2;
    const farX = vertical ? nearX : x + w;
    const farY = vertical ? y + h : nearY;
    const on = state.level === 1;
    if (on) {
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = RED;
      g.globalAlpha = 0.16;
      if (vertical) g.fillRect(x - 12, y, w + 24, h);
      else g.fillRect(x, y - 12, w, h + 24);
      g.globalAlpha = 0.3;
      if (vertical) g.fillRect(x - 5, y, w + 10, h);
      else g.fillRect(x, y - 5, w, h + 10);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = RED;
      g.fillRect(x, y, w, h);
      g.fillStyle = '#fff1f3';
      g.fillRect(x + (vertical ? w * 0.35 : 0), y + (vertical ? 0 : h * 0.35), vertical ? w * 0.3 : w, vertical ? h : h * 0.3);
      if (!rm) {
        // beads of light running along the beam
        g.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
          const k = (t * 1.6 + i / 3) % 1;
          g.fillRect(nearX + (farX - nearX) * k - 3, nearY + (farY - nearY) * k - 3, 6, 6);
        }
      }
    } else if (state.tell) {
      const p = cyclePhase(cycle, t);
      const k = clamp((p - (cycle.open - LASER_TELL)) / LASER_TELL, 0, 1);
      const blinking = rm || Math.floor(t * 21) % 2 === 0;
      const fat = 2 + 5 * k;
      g.fillStyle = AMBER;
      g.globalAlpha = blinking ? 1 : 0.35;
      if (vertical) g.fillRect(x - fat, y, w + fat * 2, h);
      else g.fillRect(x, y - fat, w, h + fat * 2);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.amber, nearX, nearY, 18 + 26 * k, 18 + 26 * k, 0.95);
      drawGlow(g, GLOW.amber, farX, farY, 18 + 26 * k, 18 + 26 * k, 0.95);
      g.globalCompositeOperation = 'source-over';
    } else {
      // off: where it will be
      g.setLineDash(LASER_DASH);
      g.lineDashOffset = 0;
      g.lineWidth = 2;
      g.strokeStyle = MINT;
      g.globalAlpha = 0.4;
      g.beginPath();
      g.moveTo(nearX, nearY);
      g.lineTo(farX, farY);
      g.stroke();
      g.setLineDash(EMPTY_DASH);
      g.globalAlpha = 1;
    }
    if (mountY !== undefined) this.mount(g, nearX - 9, mountY, nearX - 9, nearY, 6);
    const color = on ? RED : state.tell ? AMBER : MINT;
    this.emitter(g, nearX, nearY, vertical ? Math.PI / 2 : 0, color);
    this.emitter(g, farX, farY, vertical ? -Math.PI / 2 : Math.PI, color);
    if (on) {
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.red, nearX, nearY, 26, 26, 0.9);
      drawGlow(g, GLOW.red, farX, farY, 26, 26, 0.9);
      g.globalCompositeOperation = 'source-over';
    }
    // the dial sits beside the emitter that is nearest the middle of the view
    const useFar = Math.hypot(farX - this.cameraX - VIEW_W / 2, farY - this.cameraY - VIEW_H / 2) <
      Math.hypot(nearX - this.cameraX - VIEW_W / 2, nearY - this.cameraY - VIEW_H / 2);
    const dx = useFar ? farX : nearX;
    const dy = useFar ? farY : nearY;
    if (vertical) this.dial(g, dx + 28, dy + (useFar ? -24 : 24), cycle, state.tell);
    else this.dial(g, dx + (useFar ? -24 : 24), dy - 28, cycle, state.tell);
  }

  private emitter(g: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string): void {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    this.drawArt(g, 'room/laser_emitter', -19, -14, 24, 28);
    g.restore();
    ring(g, x, y, 5, color, 2.5);
  }

  /** The cuckoo: the sprite's beak leads at the left edge of the collider, the rest follows it out. */
  private bird(g: CanvasRenderingContext2D, shape: Rect, area: Area): void {
    const { x, y, w, h } = shape;
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    const image = this.ctx.assets.get('room/cuckoo_bird');
    if (image) {
      drawSprite(g, image, x, area.y, area.w, area.h);
      g.restore();
      return;
    }
    const center = x + 23;
    g.fillStyle = '#bc795e';
    g.beginPath();
    g.ellipse(x + w * 0.6, y + h * 0.62, w * 0.55, h * 0.38, 0, 0, TAU);
    g.ellipse(center, y + 12, 15, 12, 0, 0, TAU);
    g.fill();
    g.fillStyle = AMBER;
    g.beginPath();
    g.moveTo(center - 10, y + 12);
    g.lineTo(x, y + 19);
    g.lineTo(center - 10, y + 23);
    g.fill();
    g.fillStyle = INK;
    g.fillRect(center - 10, y + 9, 4, 4);
    g.restore();
  }

  /**
   * A security camera. The polygon is the wall-clipped cone the fuse tests against. Idle it is
   * amber with a heavier edge on the side it is sweeping towards; while it has the specimen it
   * turns red and thick.
   */
  private cameraCone(g: CanvasRenderingContext2D, state: HazardState, index: number): void {
    const { spec, angle, cone } = state;
    if (spec.kind !== 'camera' || !cone || !this.visibleCircle(spec.x, spec.y, spec.range)) return;
    const watching = state.detecting;
    const rm = this.ctx.reducedMotion;
    const t = this.sim.elapsed;
    const da = angle - this.prevAngle[index]!;
    if (Math.abs(da) > 0.0003) this.lead[index] = da > 0 ? 1 : -1;
    this.prevAngle[index] = angle;
    cone.update(angle);
    g.beginPath();
    g.moveTo(cone.points[0]!, cone.points[1]!);
    for (let i = 1; i < cone.count; i++) g.lineTo(cone.points[i * 2]!, cone.points[i * 2 + 1]!);
    g.closePath();
    const beat = rm ? 1 : 0.7 + 0.3 * Math.sin(t * 22);
    g.fillStyle = watching ? RED : '#ffbc69';
    g.globalAlpha = watching ? 0.34 * beat : 0.2;
    g.fill();
    g.globalAlpha = 1;
    g.lineJoin = 'round';
    g.strokeStyle = watching ? RED : '#f0b574';
    g.lineWidth = watching ? 4.5 : 2.5;
    g.stroke();
    // the edge it is sweeping towards
    const lead = this.lead[index]!;
    if (lead !== 0 && cone.count > 2) {
      const k = lead > 0 ? cone.count - 1 : 1;
      g.beginPath();
      g.moveTo(cone.points[0]!, cone.points[1]!);
      g.lineTo(cone.points[k * 2]!, cone.points[k * 2 + 1]!);
      g.lineWidth = watching ? 6.5 : 5;
      g.lineCap = 'round';
      g.stroke();
      g.lineCap = 'butt';
    }
    if (spec.mountY !== undefined) {
      this.mount(g, spec.x, spec.mountY, spec.x - Math.cos(angle) * 36, spec.y - Math.sin(angle) * 36, 9);
    }
    if (!spec.lens) { // L5 pier code: a lighthouse lens has no camera body
      g.save();
      g.translate(spec.x, spec.y);
      g.rotate(angle);
      this.drawArt(g, 'room/security_camera', -61, -20, 67, 38);
      g.restore();
    }
    ring(g, spec.x, spec.y, 6, watching ? RED : AMBER, 3);
    // the lens glints; the REC light blinks, solid once it has you
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, watching ? GLOW.red : GLOW.amber, spec.x, spec.y, watching ? 30 * beat : 16, watching ? 30 * beat : 16, 0.95);
    if (!spec.lens && (watching || rm || Math.floor(t * 2.5 + index) % 2 === 0)) {
      drawGlow(g, GLOW.red, spec.x - Math.cos(angle) * 44, spec.y - Math.sin(angle) * 44 - 14, 11, 11, 1);
    }
    g.globalCompositeOperation = 'source-over';
  }

  /** While a camera has the specimen: the 1 s fuse burns round them and a line runs to the lens. */
  private seen(g: CanvasRenderingContext2D): void {
    const interior = this.sim.interior!;
    const v = interior.exposure;
    if (v <= 0.01 || this.sim.failure || this.sim.delivered) return;
    const rm = this.ctx.reducedMotion;
    const t = this.sim.elapsed;
    const { chestX, chestY } = this.sim.body;
    const watching = interior.watching;
    const left = 1 - v;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(chestX, chestY, SEEN_R, 0, TAU);
    g.lineWidth = 11;
    g.strokeStyle = INK;
    g.globalAlpha = 0.6;
    g.stroke();
    g.globalAlpha = 1;
    if (left > 0.003) {
      g.beginPath();
      g.arc(chestX, chestY, SEEN_R, -Math.PI / 2, -Math.PI / 2 + TAU * left);
      g.lineWidth = 7;
      g.strokeStyle = watching ? RED : AMBER;
      g.stroke();
    }
    const ea = -Math.PI / 2 + TAU * left;
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, watching ? GLOW.red : GLOW.amber, chestX + Math.cos(ea) * SEEN_R, chestY + Math.sin(ea) * SEEN_R, 20, 20, 1);
    drawGlow(g, GLOW.white, chestX + Math.cos(ea) * SEEN_R, chestY + Math.sin(ea) * SEEN_R, 8, 8, 1);
    g.globalCompositeOperation = 'source-over';
    g.lineCap = 'butt';
    if (!watching || watching.spec.kind !== 'camera') return;
    const dx = watching.spec.x - chestX;
    const dy = watching.spec.y - chestY;
    const d = Math.hypot(dx, dy);
    if (d < SEEN_R + 30) return;
    g.setLineDash(LASER_DASH);
    g.lineDashOffset = rm ? 0 : t * 70;
    g.lineWidth = 3.5;
    g.lineCap = 'round';
    g.strokeStyle = RED;
    g.globalAlpha = 0.5 + 0.5 * v;
    g.beginPath();
    g.moveTo(chestX + (dx / d) * (SEEN_R + 9), chestY + (dy / d) * (SEEN_R + 9));
    g.lineTo(watching.spec.x - (dx / d) * 14, watching.spec.y - (dy / d) * 14);
    g.stroke();
    g.setLineDash(EMPTY_DASH);
    g.lineDashOffset = 0;
    g.lineCap = 'butt';
    g.globalAlpha = 1;
  }

  private zone(g: CanvasRenderingContext2D, a: Area, pulse: number, color: string): void {
    g.save();
    g.globalAlpha = 0.16 + pulse * 0.52;
    g.strokeStyle = color;
    g.fillStyle = color;
    g.setLineDash(WARNING_DASH);
    g.strokeRect(a.x, a.y, a.w, a.h);
    g.setLineDash(EMPTY_DASH);
    const left = Math.max(a.x + 20, this.cameraX - 20);
    const top = Math.max(a.y + 20, this.cameraY - 20);
    const right = Math.min(a.x + a.w, this.cameraX + VIEW_W + 20);
    const bottom = Math.min(a.y + a.h, this.cameraY + VIEW_H + 20);
    for (let y = a.y + 22 + Math.max(0, Math.floor((top - a.y) / 78)) * 78; y < bottom; y += 78) {
      for (let x = a.x + 20 + Math.max(0, Math.floor((left - a.x) / 61)) * 61; x < right; x += 61) {
        g.fillRect(x, y, 12, 2);
        g.fillRect(x + 4, y - 4, 13, 2);
      }
    }
    if (pulse > 0.3) {
      const { chestX, chestY } = this.sim.body;
      g.globalAlpha = Math.min(1, pulse * 1.4);
      label(g, 'creeeak', chestX + 60, chestY + 96 - (1 - pulse) * 18, 'italic 800 18px system-ui', color, 120);
    }
    g.restore();
  }

  private draft(g: CanvasRenderingContext2D, a: Area, ay: number): void {
    const positive = ay > 0 ? 1 : -1;
    const offset = this.ctx.reducedMotion ? 0 : ((this.sim.elapsed * 79 * positive) % 78 + 78) % 78;
    const top = Math.max(a.y, this.cameraY - 40);
    const bottom = Math.min(a.y + a.h, this.cameraY + VIEW_H + 40);
    g.save();
    g.globalAlpha = 0.35;
    g.strokeStyle = ay < 0 ? MINT : AMBER;
    g.setLineDash(WARNING_DASH);
    g.strokeRect(a.x, a.y, a.w, a.h);
    g.setLineDash(EMPTY_DASH);
    g.beginPath();
    for (let yy = a.y + offset + Math.floor((top - a.y) / 78) * 78; yy < bottom; yy += 78) {
      if (yy <= a.y + 24 || yy >= a.y + a.h - 24) continue;
      for (let col = 1; col <= 3; col++) {
        const x = a.x + a.w * col * 0.25;
        g.moveTo(x - 7, yy - positive * 9);
        g.lineTo(x, yy);
        g.lineTo(x + 7, yy - positive * 9);
        g.moveTo(x, yy - positive * 17);
        g.lineTo(x, yy);
      }
    }
    g.lineWidth = 2.5;
    g.stroke();
    g.restore();
  }

  /**
   * A second sleeper: the ring is how far a noise reaches them. They stir when they hear one
   * ("?"), toss about once the meter is high, and sit bolt upright with a shout when it fills.
   */
  private sleeper(g: CanvasRenderingContext2D, sleeper: SleeperState, index: number, dt: number): void {
    const { x, y, wake, spec } = sleeper;
    const rm = this.ctx.reducedMotion;
    const t = this.sim.elapsed;
    const awake = wake >= 100;
    // a new noise reached them: a little start
    if (sleeper.pulse > this.sleeperHeard[index]! + 0.15) this.sleeperHop[index] = 1;
    this.sleeperHeard[index] = sleeper.pulse;
    this.sleeperHop[index] = Math.max(0, this.sleeperHop[index]! - dt * 3.2);
    this.sleeperAwake[index] = awake ? this.sleeperAwake[index]! + (dt > 0 ? dt : 1 / 60) : 0;
    if (!this.visibleCircle(x, y, spec.radius)) return;
    const hop = this.sleeperHop[index]!;
    const tone = wake >= 70 ? RED : wake >= 45 ? AMBER : '#c4a2eb';
    g.save();
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, wake >= 70 ? GLOW.red : '196,162,235', x, y, spec.radius, spec.radius, 0.05 + sleeper.pulse * 0.16);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 0.4 + sleeper.pulse * 0.6;
    g.setLineDash(RING_DASH);
    g.lineDashOffset = rm ? 0 : -t * 12;
    ring(g, x, y, spec.radius, tone, 2.5 + sleeper.pulse * 2.5);
    g.setLineDash(EMPTY_DASH);
    g.lineDashOffset = 0;
    g.restore();

    const sprite = awake ? spec.awake : spec.asleep;
    const age = this.sleeperAwake[index]!;
    g.save();
    // squash and stretch about their feet
    const baseX = sprite.x + sprite.w / 2;
    const baseY = sprite.y + sprite.h;
    g.translate(baseX, baseY);
    if (awake && !rm) {
      const k = easeOutBack(age / 0.22, 3);
      g.scale(1.25 - 0.25 * k, 0.6 + 0.4 * k);
    } else if (!rm) {
      const breath = Math.sin(t * 1.9 + index) * 0.5 + 0.5;
      const toss = wake >= 70 ? Math.sin(t * 26) * 0.02 : 0;
      g.rotate(toss);
      g.scale(1 + hop * 0.04, 1 + breath * 0.025 + hop * 0.07);
    }
    g.translate(-baseX, -baseY);
    this.asset(g, sprite);
    g.restore();
    if (!this.visibleCircle(x, y, 140)) return;

    const headX = x + spec.asleep.w / 3;
    const headY = spec.asleep.y - 21;
    if (awake) {
      // sat bolt upright, shouting
      const pop = rm ? 1 : easeOutBack(age / 0.2, 2.6);
      g.save();
      g.translate(headX, spec.awake.y - 16);
      g.scale(pop, pop);
      g.beginPath();
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        const r = i % 2 === 0 ? 26 : 17;
        if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath();
      g.lineJoin = 'round';
      g.fillStyle = RED;
      g.fill();
      g.lineWidth = 3.5;
      g.strokeStyle = INK;
      g.stroke();
      label(g, '!', 0, 1, '900 30px system-ui', '#ffffff', 30);
      g.restore();
      const shout = sleeperShout(spec.name);
      if (shout && age > 0.12) {
        const bx = clamp(x, this.cameraX + 140, this.cameraX + VIEW_W - 140);
        const by = spec.awake.y - 64;
        g.save();
        g.translate(bx, by);
        g.scale(rm ? 1 : easeOutBack((age - 0.12) / 0.2), rm ? 1 : easeOutBack((age - 0.12) / 0.2));
        g.lineWidth = 4;
        g.strokeStyle = INK;
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.roundRect(-124, -22, 248, 44, 20);
        g.fill();
        g.stroke();
        label(g, shout, 0, 1, '900 19px system-ui', '#d33a52', 228);
        g.restore();
      }
      return;
    }
    // a small gauge over their head: the same value as their HUD meter, where you are looking
    const fill = clamp(wake / 100, 0, 1);
    if (fill > 0.02) {
      g.lineCap = 'round';
      g.beginPath();
      g.arc(headX, headY + 4, 20, Math.PI, TAU);
      g.lineWidth = 8;
      g.strokeStyle = INK;
      g.stroke();
      g.beginPath();
      g.arc(headX, headY + 4, 20, Math.PI, Math.PI + Math.PI * fill);
      g.lineWidth = 4.5;
      g.strokeStyle = tone;
      g.stroke();
      g.lineCap = 'butt';
    }
    const lift = rm ? 0 : Math.sin(t * 2.5) * 3;
    if (hop > 0.25) {
      g.globalAlpha = Math.min(1, hop * 2);
      label(g, wake >= 70 ? '?!' : '?', headX, headY - 26 - (1 - hop) * 10, '900 26px system-ui', tone, 60);
      g.globalAlpha = 1;
    } else {
      const zzz = this.ctx.assets.get('ui/zzz');
      const size = 30 * (1 - fill * 0.45);
      const jitter = wake >= 70 && !rm ? Math.sin(t * 30) * 2 : 0;
      if (zzz) drawSprite(g, zzz, headX - size / 2 + jitter, headY - 22 - size + lift, size, size);
      else label(g, 'Z z z', headX, headY - 26 + lift, '900 19px system-ui', '#dcc9ff', 90);
    }
  }

  /**
   * The beam comes down through the building as a soft column of light onto the specimen, with
   * motes rising in it. The dashed line runs from the body to where the beam is being pulled.
   */
  private beam(g: CanvasRenderingContext2D, x: number, y: number, dragging: boolean): void {
    const { sim } = this;
    const { chestX, chestY } = sim.body;
    const hot = sim.interior!.strain > 0.24;
    const rm = this.ctx.reducedMotion;
    const rgb = hot ? GLOW.amber : GLOW.mint;
    const top = this.cameraY + 96;
    g.save();
    g.globalCompositeOperation = 'lighter';
    const power = dragging ? 1 : 0.62;
    if (chestY > top + 40) drawGlow(g, rgb, chestX, (top + chestY) / 2 - 30, 62, (chestY - top) / 2 + 90, 0.28 * power);
    drawGlow(g, rgb, chestX, chestY, 119, 188, dragging ? 0.57 : 0.31);
    // motes drifting up the column
    g.fillStyle = hot ? AMBER : '#d9fff0';
    const phase = rm ? 0.3 : sim.elapsed;
    for (let i = 0; i < 12; i++) {
      const k = (phase * (0.24 + (i % 3) * 0.05) + i * 0.083) % 1;
      const mx = chestX + Math.sin(i * 2.4 + k * 3) * (46 - 22 * k);
      const my = chestY + 50 - k * Math.min(520, chestY - top + 60);
      g.globalAlpha = (0.7 - k * 0.6) * power;
      g.fillRect(mx, my, i % 4 === 0 ? 3.5 : 2.5, i % 4 === 0 ? 3.5 : 2.5);
    }
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = hot ? AMBER : MINT;
    g.globalAlpha = dragging ? 0.6 : 0.36;
    g.lineWidth = hot ? 4 : 2.5;
    g.setLineDash(EXIT_DASH);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(chestX, chestY);
    g.stroke();
    g.setLineDash(EMPTY_DASH);
    g.restore();
  }

  private reticle(g: CanvasRenderingContext2D, x: number, y: number, dragging: boolean): void {
    const { beamX, beamY } = this.sim.body;
    const color = this.sim.interior!.strain > 0.24 ? AMBER : MINT;
    const radius = dragging ? 23 : 18;
    const spin = this.ctx.reducedMotion ? 0 : this.sim.elapsed * 1.4;
    g.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      g.lineWidth = pass === 0 ? 6 : 2.6;
      g.strokeStyle = pass === 0 ? INK : color;
      g.beginPath();
      g.arc(x, y, radius, 0, TAU);
      for (let i = 0; i < 4; i++) {
        const a = spin + i * Math.PI / 2;
        g.moveTo(x + Math.cos(a) * (radius + 4), y + Math.sin(a) * (radius + 4));
        g.lineTo(x + Math.cos(a) * (radius + 10), y + Math.sin(a) * (radius + 10));
      }
      g.stroke();
    }
    g.lineCap = 'butt';
    g.fillStyle = color;
    g.globalAlpha = dragging ? 0.25 : 0.13;
    g.beginPath();
    g.arc(x, y, radius, 0, TAU);
    g.fill();
    g.globalAlpha = 1;
    g.fillRect(x - 2.5, y - 2.5, 5, 5);
    if (x !== beamX || y !== beamY) {
      g.save();
      g.translate(x, y);
      g.rotate(Math.atan2(beamY - y, beamX - x));
      g.beginPath();
      g.moveTo(25, 0);
      g.lineTo(14, 8);
      g.lineTo(14, -8);
      g.closePath();
      g.fill();
      g.restore();
    }
  }

  private subject(g: CanvasRenderingContext2D): void {
    const { sim, ctx } = this;
    const { item, body, wake } = sim;
    const { sprite } = sim.room.item;
    const rm = ctx.reducedMotion;
    if (this.visibleCircle(item.x, item.y, sprite.w) && (!sim.delivered || item.stolen)) {
      const t = sim.slurp * sim.slurp;
      const ix = item.x + (sim.exitX - item.x) * t;
      const iy = item.y + (sim.exitY - item.y) * t;
      this.drawArt(g, sprite.key, ix - sprite.w / 2, iy - sprite.h / 2, sprite.w, sprite.h);
    }

    const t = sim.slurp * sim.slurp;
    const awake = wake.awake > 0;
    g.save();
    if (sim.delivered) {
      g.translate(body.chestX + (sim.exitX - body.chestX) * t, body.chestY + (sim.exitY - body.chestY) * t);
      g.scale(1 - t * 0.87, 1 - t * 0.87);
      g.translate(-body.chestX, -body.chestY);
      g.globalAlpha = 1 - t;
    } else if (this.squash > 0 && !rm) {
      const q = this.squash * 0.1;
      g.translate(body.chestX, body.chestY);
      g.scale(1 + q, 1 - q);
      g.translate(-body.chestX, -body.chestY);
    }
    // the chest swells with each snore; panting once awake
    const breath = rm ? 0 : awake ? 0.5 + 0.5 * Math.sin(sim.elapsed * 15)
      : sim.snoreFx > 0 ? Math.sin(Math.PI * clamp((1.1 - sim.snoreFx) / 1.1, 0, 1)) : 0;
    this.human.draw(g, body, awake, breath);
    g.restore();
    if (sim.delivered) return;
    const x = body.x[Joint.Head]!;
    const y = body.y[Joint.Head]!;
    if (awake) {
      this.bang(g, x, y);
    } else if (sim.mumbleFx > 0) {
      this.speech(g, x, y);
    } else {
      if (sim.snoreFx > 0) {
        const k = clamp((1.1 - sim.snoreFx) / 1.1, 0, 1);
        const lift = rm ? 0 : k * 32;
        const size = 38 * (rm ? 1 : 0.7 + 0.5 * k);
        const bubble = ctx.assets.get('ui/zzz');
        g.globalAlpha = Math.min(1, sim.snoreFx * 2.4);
        if (bubble) drawSprite(g, bubble, x + 24, y - 37 - lift - (size - 38), size, size);
        else label(g, 'Z z', x + 47, y - 25 - lift, '900 21px system-ui', '#e0cefc', 65);
        g.globalAlpha = 1;
      }
      if (wake.value >= 73) {
        // one more knock and they are up: an eyelid is twitching
        const beat = rm ? 1 : 0.6 + 0.4 * Math.sin(sim.elapsed * 14);
        g.globalAlpha = beat;
        label(g, '. . .', x - 30, y - 52, '900 24px system-ui', RED, 70);
        g.globalAlpha = 1;
      }
    }
  }

  /** Sleep-talk bubble with a tail pointing at the speaker's head. */
  private speech(g: CanvasRenderingContext2D, x: number, y: number): void {
    const { mumble, mumbleFx } = this.sim;
    const pad = 18;
    const h = 42;
    g.font = '650 16px system-ui';
    if (mumble !== this.measuredMumble) {
      this.measuredMumble = mumble;
      this.shownMumble = gt(mumble);
      this.mumbleWidth = Math.min(VIEW_W - 44, Math.ceil(g.measureText(this.shownMumble).width) + pad * 2);
    }
    const w = this.mumbleWidth;
    const left = clamp(x - w / 2, this.cameraX + 22, this.cameraX + VIEW_W - 22 - w);
    const top = Math.max(y - 116, this.cameraY + 160);
    const below = top > y - 60;
    const boxTop = below ? y + 58 : top;
    const baseX = clamp(x, left + 26, left + w - 26);
    const baseY = below ? boxTop + 2 : boxTop + h - 2;
    const dx = x - baseX;
    const dy = y - baseY;
    const d = Math.hypot(dx, dy) || 1;
    const reach = Math.min(d - 34, 40);
    const pop = this.ctx.reducedMotion ? 1 : easeOutBack((MUMBLE_SECONDS - mumbleFx) / 0.22);
    g.save();
    g.globalAlpha = clamp(mumbleFx / 0.18, 0, 1);
    g.translate(baseX, baseY);
    g.scale(pop, pop);
    g.translate(-baseX, -baseY);
    g.lineJoin = 'round';
    g.lineWidth = 5;
    g.strokeStyle = BUBBLE_EDGE;
    g.fillStyle = BUBBLE;
    // outline both shapes first, then fill both, so no line shows where the tail joins
    g.beginPath();
    g.roundRect(left, boxTop, w, h, 15);
    g.stroke();
    if (reach > 5) {
      g.beginPath();
      g.moveTo(baseX - 11, baseY);
      g.lineTo(baseX + (dx / d) * reach, baseY + (dy / d) * reach);
      g.lineTo(baseX + 11, baseY);
      g.closePath();
      g.stroke();
      g.fill();
    }
    g.beginPath();
    g.roundRect(left, boxTop, w, h, 15);
    g.fill();
    g.fillStyle = INK;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.fillText(this.shownMumble, left + w / 2, boxTop + 27, w - pad * 2);
    g.restore();
  }

  /** Wide-awake "!" burst over the specimen's head. */
  private bang(g: CanvasRenderingContext2D, x: number, y: number): void {
    const rm = this.ctx.reducedMotion;
    const age = this.wakeAge;
    const pop = rm ? 1 : easeOutBack(age / 0.24, 3.2);
    const wobble = rm ? 0 : Math.sin(age * 34) * 0.14 * Math.max(0, 1 - age * 1.4);
    g.save();
    g.translate(x + 34, y - 74);
    g.rotate(0.2 + wobble);
    g.scale(pop, pop);
    g.beginPath();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU;
      const r = i % 2 === 0 ? 34 : 23;
      if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    g.lineJoin = 'round';
    g.lineWidth = 4;
    g.fillStyle = RED;
    g.fill();
    g.strokeStyle = INK;
    g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.roundRect(-4.5, -19, 9, 22, 3.5);
    g.arc(0, 12, 5, 0, TAU);
    g.fill();
    g.restore();
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

  /** Arrow at the next doorway on the way out (or at the exit, when it is off screen). */
  private direction(g: CanvasRenderingContext2D): void {
    const entry = this.roomPaths.get(this.currentRoom);
    if (!entry) return;
    const gap = entry.opening;
    const center = gap ? (gap.from + gap.to) / 2 : 0;
    const x = (gap ? gap.axis === 'vertical' ? gap.at : center : this.sim.exitX) - this.cameraX;
    const y = (gap ? gap.axis === 'vertical' ? center : gap.at : this.sim.exitY) - this.cameraY;
    const bottom = DEEP_HUD_WARNING_SLOT.y - 20;
    if (!gap && x >= 42 && x <= VIEW_W - 42 && y >= 155 && y < bottom) return;
    const cx = clamp(x, 42, VIEW_W - 42);
    const cy = clamp(y, 168, bottom);
    if (Math.hypot(x - VIEW_W / 2, y - VIEW_H / 2) < 48) return;
    const angle = Math.atan2(y - VIEW_H / 2, x - VIEW_W / 2);
    const nudge = this.ctx.reducedMotion ? 0 : Math.sin(this.sim.elapsed * 6) * 4;
    g.save();
    g.translate(cx, cy);
    g.rotate(angle);
    g.translate(nudge, 0);
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.mint, 2, 0, 26, 26, 0.45);
    g.globalCompositeOperation = 'source-over';
    g.beginPath();
    g.moveTo(20, 0);
    g.lineTo(-10, 14);
    g.lineTo(-6, 0);
    g.lineTo(-10, -14);
    g.closePath();
    g.fillStyle = MINT;
    g.strokeStyle = INK;
    g.lineWidth = 4;
    g.lineJoin = 'round';
    g.stroke();
    g.fill();
    g.restore();
  }

  private hud(g: CanvasRenderingContext2D, turn: TurnControl | undefined): void {
    const { sim, ctx } = this;
    const interior = sim.interior!;
    const second = Math.floor(sim.elapsed);
    if (second !== this.lastSecond) {
      this.lastSecond = second;
      this.clock = Math.floor(second / 60) + ':' + String(second % 60).padStart(2, '0');
    }
    this.wakeMeter.flash = this.meterFlash;
    this.wakeMeter.label = sim.wake.awake > 0 ? tr().abduct.awake : tr().abduct.wake;
    this.drawMeter(g, this.wakeMeter, sim.wake.value / 100, sim.wake.awake > 0, 14, HUD_ROW.y, 296);
    hudTimer(g, 318, HUD_ROW.y, 96, HUD_ROW.h, this.clock);
    hudButton(g, RESTART, 'restart', tr().common.restart, false);
    if (turn && !sim.delivered && !sim.failure) drawTurnButtons(g, turn);
    for (let i = 0; i < interior.sleepers.length; i++) {
      const sleeper = interior.sleepers[i]!;
      const state = this.sleeperMeters[i]!;
      state.flash = this.sleeperHop[i]! * 0.7;
      this.drawMeter(g, state, sleeper.wake / 100, sleeper.wake >= 100, 14, 86, 180);
    }
    const wet = sim.wet;
    if (wet?.sheathed && !interior.watching && interior.exposure <= 0) {
      // L5: the moisture sheath drains like a fuse; amber below a quarter, red when dry
      this.moistureMeter.label = gt(wet.level <= 0 ? 'Drying out!' : 'Moisture').toLocaleUpperCase();
      this.drawMeter(g, this.moistureMeter, 1 - wet.level, wet.level <= 0, 342, 86, 184);
    }
    if (interior.watching || interior.exposure > 0) {
      this.cameraMeter.label = interior.watching ? tr().abduct.onCamera : tr().abduct.cameraFuse;
      this.drawMeter(g, this.cameraMeter, interior.exposure, interior.exposure >= 1 || !!interior.watching, 342, 86, 184);
    }
    // L6 clinic code: the Form 7-B clipboard
    if (interior.probes) drawClipboard(g, interior.probes, ctx.assets, 312, 158, 214);

    // room / exit bar, between the two TURN buttons in the bottom corners
    hudPanel(g, 84, 887, 372, 56);
    label(g, gt(this.currentRoom.name), 183, 914, '850 18px system-ui', LIGHT, 180);
    // specimens aboard so far tonight: three pips where the divider was
    const have = deepShift.delivered;
    if (have >= 0) {
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.arc(285, 902 + i * 12.5, 4.2, 0, TAU);
        g.fillStyle = i < have ? MINT : '#16102e';
        g.fill();
        g.lineWidth = 1.5;
        g.strokeStyle = i < have ? MINT : '#695b92';
        g.stroke();
      }
    } else {
      g.fillStyle = '#695b92';
      g.fillRect(284, 898, 2, 32);
    }
    label(g, gt(sim.room.interior!.exitName), 372, 914, '900 14px system-ui', MINT, 150);
    if (sim.snoozeOwned && !sim.snoozeUsed && !sim.failure && !sim.delivered) {
      hudPanel(g, 14, 831, 204, 45, '#c8a4ff');
      label(g, tr().abduct.snoozeHint, 116, 853, '750 13px system-ui', ctx.reducedMotion ? LIGHT : '#ddc8ff', 188);
    }
  }

  private drawMeter(g: CanvasRenderingContext2D, state: MeterState, value: number, alarm: boolean, x: number, y: number, w: number): void {
    state.value = value;
    state.alarm = alarm;
    state.t = this.ctx.reducedMotion ? 0 : this.sim.elapsed;
    state.reduced = this.ctx.reducedMotion;
    hudMeter(g, x, y, w, HUD_ROW.h, state);
  }
}
