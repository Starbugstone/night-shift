import { ART, type ArtSpec } from '../art-manifest';
import { VIEW_H, VIEW_W, type GameContext } from '../contracts';
import {
  CachedLayer, GLOW, P_PUFF, P_RING, P_SPARK, P_STAR, P_TWINKLE, PC, Particles,
  bump, clamp01, drawEdgeTint, drawGlow, drawVignette, easeOutBack, lightSprite,
} from '../core/fx';
import { HUD_ROW, hudButton, hudMeter, hudPrompt, hudTimer, type MeterState } from '../ui/hud';
import { clamp, Joint, type Ragdoll } from './ragdoll';
import type { AbductSimulation } from './simulation';
import type { TurnControl } from './turn';
import { drawTurnButtons, drawTurnTell } from './turn-draw';
import { CEILING, FLOOR, LEFT_WALL, RIGHT_WALL, type Human, type Sprite } from './rooms/layout';
import { getLang, gt, tr } from '../i18n';

/** Art with English words painted in: other languages draw the primitive fallback instead. */
const ENGLISH_LETTERED: ReadonlySet<string> = new Set(['room/sign_no_sleeping']);

/** Restart button (top-right of the shared HUD row). */
export const RESTART = { x: 422, y: HUD_ROW.y, w: 104, h: HUD_ROW.h };
const METER = { x: 14, y: HUD_ROW.y, w: 296, h: HUD_ROW.h };
const TIMER = { x: 318, y: HUD_ROW.y, w: 96, h: HUD_ROW.h };
const INK = '#1d1631';
const MINT = '#7CFFCB';
const EXIT_DASHES = [2, 8];
const SOLID_LINE: number[] = [];
const DREAMS = ['ui/dream_sheep', 'ui/dream_sandwich', 'ui/dream_taxform'] as const;
const PARTICLE_COUNT = 32;
const MUMBLE_FONT = '600 16px system-ui';
const BUBBLE = '#e9ddd2';
const BUBBLE_EDGE = '#6c5277';
const MUMBLE_SECONDS = 1.6;
/** Night sky seen over the roof, above the room's ceiling line. */
const SKY_STARS = [22, 14, 71, 96, 118, 30, 163, 104, 214, 12, 262, 88, 301, 22, 352, 110, 398, 8, 431, 92, 476, 34, 520, 100, 96, 60, 338, 58] as const;
const HULL_LIGHTS = 7;

/** A light source in a room: warm (lamp, embers) or cool (moonlight through the exit). */
interface Light {
  x: number;
  y: number;
  r: number;
  warm: boolean;
  flicker: boolean;
}

interface Part extends ArtSpec {
  key: string;
  color: string;
}

function part(key: string, color: string): Part {
  return { key, color, ...ART[key]! };
}

function roundBox(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, fill: string, stroke?: string): void {
  g.beginPath();
  g.roundRect(x, y, w, h, radius);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.stroke();
  }
}

function ellipse(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string): void {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.stroke();
  }
}

function fallback(g: CanvasRenderingContext2D, key: string, x: number, y: number, w: number, h: number): void {
  g.save();
  g.translate(x, y);
  g.lineWidth = 3;
  switch (key) {
    case 'room/exit_window':
    case 'room/exit_chimney_top':
    case 'room/exit_skylight':
    case 'room/exit_loading_door':
      roundBox(g, 2, 2, w - 4, h - 4, 12, '#372d4d', '#75668c');
      roundBox(g, 15, 13, w - 30, h - 26, 7, '#12182f', '#9283a0');
      ellipse(g, w * 0.62, h * 0.28, 12, 12, '#e5daae');
      g.fillStyle = '#303653';
      g.fillRect(17, h * 0.67, w - 34, h * 0.25);
      break;
    case 'room/bed':
      roundBox(g, 10, 20, 66, 72, 6, '#8e625a', INK);
      roundBox(g, 21, 107, 15, 30, 4, '#6c4548', INK);
      roundBox(g, w - 37, 107, 15, 30, 4, '#6c4548', INK);
      roundBox(g, 16, 69, w - 31, 46, 9, '#6c4548', INK);
      roundBox(g, 27, 51, 66, 25, 10, '#c8b1a6', INK);
      roundBox(g, 76, 60, w - 91, 44, 11, '#695d88', INK);
      g.fillStyle = '#84759d';
      g.fillRect(135, 65, 9, 34);
      g.fillRect(224, 65, 9, 34);
      break;
    case 'room/nightstand':
      roundBox(g, 4, 4, w - 8, h - 8, 6, '#84564e', INK);
      roundBox(g, 10, 14, w - 20, 38, 4, '#a56d5c', INK);
      roundBox(g, 10, 56, w - 20, 36, 4, '#a56d5c', INK);
      ellipse(g, w / 2, 33, 5, 4, '#e0a775');
      ellipse(g, w / 2, 74, 5, 4, '#e0a775');
      break;
    case 'room/lamp':
      g.fillStyle = '#d99e71';
      g.fillRect(27, 31, 6, 51);
      ellipse(g, 30, 82, 24, 6, '#b2776c', INK);
      g.beginPath();
      g.moveTo(15, 4);
      g.lineTo(45, 4);
      g.lineTo(57, 43);
      g.lineTo(3, 43);
      g.closePath();
      g.fillStyle = '#edbb79';
      g.fill();
      g.strokeStyle = INK;
      g.stroke();
      break;
    case 'room/hanging_plant':
      g.fillStyle = '#998182';
      g.fillRect(38, 0, 4, 75);
      ellipse(g, 22, 74, 19, 29, '#467d69', INK);
      ellipse(g, 55, 80, 20, 24, '#4f9876', INK);
      roundBox(g, 12, 92, 56, 43, 10, '#bc7962', INK);
      break;
    case 'room/portrait_cow':
      roundBox(g, 3, 3, w - 6, h - 6, 5, '#b48766', INK);
      roundBox(g, 11, 11, w - 22, h - 22, 3, '#595774');
      ellipse(g, 28, 33, 13, 7, '#c7b2ad', INK);
      ellipse(g, 85, 33, 13, 7, '#c7b2ad', INK);
      ellipse(g, 56, 48, 25, 26, '#e9dbc7', INK);
      ellipse(g, 57, 62, 19, 11, '#bd8690', INK);
      ellipse(g, 91, 71, 8, 9, '#ecae5e');
      ellipse(g, 47, 45, 3, 3, INK);
      ellipse(g, 65, 45, 3, 3, INK);
      break;
    case 'room/fireplace':
      roundBox(g, 6, 15, w - 12, h - 17, 8, '#7b535d', INK);
      roundBox(g, 51, 62, w - 102, h - 66, 32, '#291f35', INK);
      roundBox(g, 3, 3, w - 6, 27, 4, '#a27573', INK);
      ellipse(g, w / 2, h - 12, 49, 6, '#a76862');
      break;
    case 'room/pot_rack':
      roundBox(g, 4, 5, w - 8, 14, 5, '#ad8477', INK);
      for (let i = 0; i < 4; i++) {
        g.fillStyle = '#b69088';
        g.fillRect(33 + i * 50, 15, 4, 24);
        ellipse(g, 35 + i * 50, 52 + (i % 2) * 7, 19, 17, '#ad7267', INK);
      }
      break;
    case 'room/shelf':
      roundBox(g, 2, 3, w - 4, h - 6, 5, '#936c63', INK);
      break;
    case 'room/cat_sleeping':
    case 'room/cat_awake':
      ellipse(g, w * 0.49, h * 0.70, w * 0.42, h * 0.23, '#d59268', INK);
      ellipse(g, w * 0.72, h * 0.45, 17, 15, '#e5a674', INK);
      g.fillStyle = INK;
      g.font = 'bold 13px system-ui';
      g.fillText(key === 'room/cat_awake' ? '●●' : '⌣⌣', 53, h * 0.52);
      break;
    case 'room/washer':
      roundBox(g, 3, 3, w - 6, h - 6, 10, '#a7a1b1', INK);
      g.fillStyle = '#625d7b';
      g.fillRect(7, 29, w - 14, 4);
      ellipse(g, w / 2, 78, w * 0.3, 35, '#77748e', INK);
      ellipse(g, w / 2, 78, w * 0.217, 25, '#3c3f63', INK);
      ellipse(g, w * 0.42, 69, 9, 4, '#737fa0');
      ellipse(g, w * 0.82, 17, 6, 6, '#e2bc89', INK);
      break;
    case 'room/office_chair':
      roundBox(g, 3, 3, 54, 90, 18, '#615472', INK);
      roundBox(g, 20, 69, 88, 20, 8, '#80728e', INK);
      g.fillStyle = '#a093a3';
      g.fillRect(57, 88, 7, 45);
      g.fillRect(26, 128, 70, 5);
      ellipse(g, 27, 137, 8, 7, '#494059');
      ellipse(g, 94, 137, 8, 7, '#494059');
      break;
    case 'room/towel_cart':
      roundBox(g, 3, 23, w - 6, 87, 14, '#b48d74', INK);
      for (let i = 0; i < 3; i++) {
        const inset = w * 0.16 + i * 4;
        roundBox(g, inset, 5 + i * 17, w - inset * 2, 21, 5, i % 2 ? '#9a839b' : '#b5a6be', INK);
      }
      ellipse(g, w * 0.2, 115, 10, 12, '#52455e', INK);
      ellipse(g, w * 0.8, 115, 10, 12, '#52455e', INK);
      break;
    case 'room/fan_blade':
      roundBox(g, 2, 3, w - 4, h - 6, 9, '#9b7575', INK);
      g.fillStyle = '#c09a8d';
      g.fillRect(70, 7, w - 90, 3);
      break;
    case 'room/fan_hub':
      ellipse(g, w / 2, h / 2, 23, 23, '#b0918f', INK);
      ellipse(g, w / 2, h / 2, 11, 11, '#d3b5a3', INK);
      break;
    case 'room/sign_no_sleeping':
      roundBox(g, 2, 2, w - 4, h - 4, 6, '#e0c090', INK);
      g.fillStyle = INK;
      g.font = 'bold 17px system-ui';
      g.textAlign = 'center';
      g.fillText(tr().abduct.noSleeping, w / 2, 30, w - 16);
      g.fillText(tr().abduct.onDuty, w / 2, 52, w - 16);
      break;
    case 'room/coffee_mug':
      ellipse(g, 24, 14, 5, 7, '#d6c0a5', INK);
      roundBox(g, 2, 4, 21, 23, 6, '#e4c9a9', INK);
      ellipse(g, 12, 7, 8, 3, '#674343');
      break;
    case 'room/slipper':
      roundBox(g, 2, 8, w - 4, h - 9, 5, '#9391b3', INK);
      roundBox(g, 5, 2, 21, 11, 7, '#a5a5c8', INK);
      break;
    case 'ui/zzz':
      g.fillStyle = MINT;
      g.font = 'bold 24px system-ui';
      g.fillText(tr().abduct.zzz, 1, 27);
      break;
    case 'ui/dream_sheep':
      ellipse(g, 27, 27, 21, 14, '#e8e2db', INK);
      ellipse(g, 41, 22, 11, 9, '#8c778d', INK);
      g.fillStyle = INK;
      g.fillRect(16, 38, 4, 8);
      g.fillRect(35, 38, 4, 8);
      break;
    case 'ui/dream_sandwich':
      roundBox(g, 8, 10, 44, 31, 12, '#e8ba80', INK);
      roundBox(g, 6, 25, 48, 9, 4, '#77ac83', INK);
      break;
    case 'ui/dream_taxform':
      roundBox(g, 15, 4, 30, 42, 3, '#f2ddc8', INK);
      g.fillStyle = '#8c667f';
      g.fillRect(21, 14, 18, 3);
      g.fillRect(21, 22, 18, 3);
      g.fillRect(21, 30, 13, 3);
      break;
  }
  g.restore();
}

const SHIRTS: Record<Human, string> = {
  doyle: '#ac5961', larry: '#6482a6', dave: '#a284be', barb: '#dd6269',
  gary: '#e9b258', nigel: '#416790', kev: '#ae73bd', mayor: '#575783',
};
const PANTS: Record<Human, string> = {
  doyle: '#904951', larry: '#b4977f', dave: '#76569c', barb: '#744451',
  gary: '#926861', nigel: '#374e6c', kev: '#62496d', mayor: '#443d5c',
};

export class HumanArt {
  private readonly head: Part;
  private readonly awakeHead: Part;
  private readonly torso: Part;
  private readonly upperArm: Part;
  private readonly lowerArm: Part;
  private readonly upperLeg: Part;
  private readonly lowerLeg: Part;
  private breath = 0;

  constructor(human: Human, private readonly ctx: GameContext) {
    const key = 'human/' + human;
    const shirt = SHIRTS[human];
    const pants = PANTS[human];
    this.head = part(key + '_head', '#d5a182');
    this.awakeHead = part(key + '_head_awake', '#d5a182');
    this.torso = part(key + '_torso', shirt);
    this.upperArm = part(key + '_upper_arm', shirt);
    this.lowerArm = part(key + '_lower_arm', '#c18b77');
    this.upperLeg = part(key + '_upper_leg', pants);
    this.lowerLeg = part(key + '_lower_leg', pants);
  }

  /** `breath` (0..1) swells the chest; the torso sprite is scaled across its width. */
  draw(g: CanvasRenderingContext2D, body: Ragdoll, awake: boolean, breath = 0): void {
    this.breath = breath;
    g.save();
    g.globalAlpha *= 0.73;
    this.bone(g, body, this.upperArm, Joint.Neck, Joint.FarElbow);
    this.bone(g, body, this.lowerArm, Joint.FarElbow, Joint.FarHand);
    this.bone(g, body, this.upperLeg, Joint.Pelvis, Joint.FarKnee);
    this.bone(g, body, this.lowerLeg, Joint.FarKnee, Joint.FarFoot);
    g.restore();

    this.bone(g, body, this.upperLeg, Joint.Pelvis, Joint.NearKnee);
    this.bone(g, body, this.lowerLeg, Joint.NearKnee, Joint.NearFoot);
    this.bone(g, body, this.torso, Joint.Neck, Joint.Pelvis);
    this.bone(g, body, this.upperArm, Joint.Neck, Joint.NearElbow);
    this.bone(g, body, this.lowerArm, Joint.NearElbow, Joint.NearHand);
    this.bone(g, body, awake ? this.awakeHead : this.head, Joint.Neck, Joint.Head, true, awake);
  }

  private bone(
    g: CanvasRenderingContext2D, body: Ragdoll, part: Part,
    a: Joint, b: Joint, head = false, awake = false,
  ): void {
    let x = body.x[a]!;
    let y = body.y[a]!;
    if (part === this.upperArm) {
      x += (body.x[Joint.Pelvis]! - x) * 0.15;
      y += (body.y[Joint.Pelvis]! - y) * 0.15;
    }
    g.save();
    g.translate(x, y);
    g.rotate(Math.atan2(body.y[b]! - y, body.x[b]! - x) + (head ? Math.PI / 2 : -Math.PI / 2));
    if (part === this.torso && this.breath !== 0) g.scale(1 + this.breath * 0.07, 1 - this.breath * 0.012);
    const image = this.ctx.assets.get(part.key);
    const left = -part.w * 0.5;
    const top = head ? -part.h : -5;
    if (image) {
      g.drawImage(image, left, top, part.w, part.h);
    } else {
      g.lineWidth = 3;
      roundBox(g, left + 2, top + 2, part.w - 4, part.h - 4, head ? 26 : 12, part.color, INK);
      if (head) {
        ellipse(g, -12, -47, 4, awake ? 6 : 1.2, INK);
        ellipse(g, 12, -47, 4, awake ? 6 : 1.2, INK);
        ellipse(g, 6, -27, 6, awake ? 8 : 4, '#76434c');
      }
    }
    g.restore();
  }
}

export class AbductView {
  private readonly human: HumanArt;
  private readonly particles = new Float64Array(PARTICLE_COUNT * 2);
  /** Bonk stars, wake sparks, delivery sparkles: one fixed pool for the whole room. */
  private readonly fx = new Particles(96);
  private lastSecond = -1;
  private clock = '0:00';
  private measuredMumble = '';
  private mumbleWidth = 0;
  /** The mumble in the current language (the sim keeps the English line as its id). */
  private shownMumble = '';
  private readonly lights: Light[] = [];
  private warmGlow: HTMLCanvasElement | null = null;
  private coolGlow: HTMLCanvasElement | null = null;
  private mintGlow: HTMLCanvasElement | null = null;
  private beamGrad: CanvasGradient | null = null;
  private skyGrad: CanvasGradient | null = null;
  /** Backdrop art + walls + sky band: static, so painted once and blitted. */
  private readonly backdrop = new CachedLayer();
  private readonly paintBackdrop = (g: CanvasRenderingContext2D): void => {
    const image = this.ctx.assets.get(this.sim.room.backdrop);
    if (image) g.drawImage(image, 0, 0, VIEW_W, VIEW_H);
    this.structure(g);
  };
  private readonly meter: MeterState = {
    label: 'WAKE', value: 0, warn: 0.45, danger: 0.73, icon: 'sleep', t: 0, reduced: false, flash: 0, alarm: false,
  };

  private lastTime = -1;
  private seenBonk = 0;
  private seenWake = 0;
  private seenCat = 0;
  private seenDelivered = false;
  /** 0..1 after a bonk, decays fast: tiny squash on the specimen. */
  private squash = 0;
  private meterFlash = 0;
  /** Seconds since the specimen woke (0 = asleep). */
  private wakeAge = 0;
  /** Eased 0..1 red alarm while awake. */
  private alarm = 0;
  private sweat = 0;
  private lastDream = 0;
  private dreamPop = 1;

  constructor(private readonly sim: AbductSimulation, private readonly ctx: GameContext) {
    this.human = new HumanArt(sim.room.human, ctx);
    for (const { sprite } of sim.room.furniture) {
      if (sprite.key === 'room/lamp') this.lights.push({ x: sprite.x + sprite.w / 2, y: sprite.y + 26, r: 190, warm: true, flicker: false });
      if (sprite.key === 'room/fireplace') this.lights.push({ x: sprite.x + sprite.w / 2, y: sprite.y + sprite.h - 50, r: 170, warm: true, flicker: true });
    }
    const { exit } = sim.room;
    this.lights.push({ x: exit.x + exit.w / 2, y: exit.y + exit.h / 2, r: 230, warm: false, flicker: false });
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.particles[i * 2] = (i * 0.61803398875) % 1;
      this.particles[i * 2 + 1] = (i * 0.38196601125 + i * i * 0.013) % 1 - 0.5;
    }
  }

  render(g: CanvasRenderingContext2D, tutorial: boolean, dragging: boolean, turn?: TurnControl, turnHint?: string): void {
    const { sim, ctx } = this;
    const { room, body } = sim;
    const dt = this.lastTime < 0 ? 0 : clamp(ctx.time - this.lastTime, 0, 0.05);
    this.lastTime = ctx.time;
    this.moments(dt);

    g.save();
    if (!this.beamGrad) {
      this.warmGlow = lightSprite('255,189,104', 0.34);
      this.coolGlow = lightSprite('150,170,255', 0.2);
      this.mintGlow = lightSprite('124,255,203', 0.4);
      this.beamGrad = g.createLinearGradient(0, CEILING, 0, FLOOR);
      this.beamGrad.addColorStop(0, 'rgba(124,255,203,0.42)');
      this.beamGrad.addColorStop(0.5, 'rgba(124,255,203,0.2)');
      this.beamGrad.addColorStop(1, 'rgba(124,255,203,0.1)');
      this.skyGrad = g.createLinearGradient(0, 0, 0, CEILING);
      this.skyGrad.addColorStop(0, '#0b0820');
      this.skyGrad.addColorStop(1, '#221a52');
    }
    if (ctx.assets.get(room.backdrop)) {
      this.backdrop.draw(g, this.paintBackdrop);
    } else {
      // art still loading (or missing): plain wallpaper, not cached
      g.fillStyle = room.human === 'doyle' ? '#2c233f' : '#232c45';
      g.fillRect(0, 0, VIEW_W, VIEW_H);
      g.fillStyle = room.human === 'doyle' ? '#362943' : '#28344c';
      for (let x = 25; x < VIEW_W; x += 44) g.fillRect(x, CEILING, 2, FLOOR - CEILING);
      this.structure(g);
    }

    // everything loose in the room rattles with a hard bonk; the walls stay put
    g.save();
    if (!ctx.reducedMotion && sim.shake > 0) {
      g.translate(Math.sin(sim.elapsed * 94) * sim.shake * 5, Math.cos(sim.elapsed * 116) * sim.shake * 3);
    }
    if (!sim.delivered) this.floorShadow(g);
    if (room.flue) {
      const { x, y, w, h } = room.flue;
      g.fillStyle = '#211c32';
      g.fillRect(x, y, w, h);
    }
    for (const box of room.masonry ?? []) this.masonry(g, box.x, box.y, box.w, box.h);
    this.drawSprite(g, room.exit);
    this.exitMarker(g);
    for (const { sprite } of room.furniture) {
      this.suspension(g, sprite);
      this.drawSprite(g, sprite);
    }
    if (sim.cart && room.cart) this.drawSprite(g, room.cart.sprite, sim.cart.x - 5, room.cart.sprite.y);
    if (room.cat) this.cat(g, room.cat);
    this.hazards(g);
    this.lighting(g);
    this.beam(g, dragging);
    this.saucer(g, dragging);

    const p = sim.slurp * sim.slurp;
    g.save();
    if (sim.delivered) {
      const { x, y, w, h } = room.exit;
      const margin = Math.max(VIEW_W, VIEW_H) * (1 - p);
      g.beginPath();
      g.rect(x - margin, y - margin, w + margin * 2, h + margin * 2);
      g.clip();
      g.translate(body.chestX + (sim.exitX - body.chestX) * p, body.chestY + (sim.exitY - body.chestY) * p);
      g.scale(1 - p * 0.83, 1 - p * 0.83);
      g.translate(-body.chestX, -body.chestY);
      g.globalAlpha = 1 - p;
    } else if (this.squash > 0) {
      const q = this.squash * 0.11;
      g.translate(body.chestX, body.chestY);
      g.scale(1 + q, 1 - q);
      g.translate(-body.chestX, -body.chestY);
    }
    const item = room.item.sprite;
    if (!sim.delivered || sim.item.stolen) this.drawSprite(g, item, sim.item.x - item.w * 0.5, sim.item.y - item.h * 0.5);
    this.human.draw(g, body, sim.wake.awake > 0, this.breath());
    g.restore();

    if (sim.delivered && !sim.item.stolen) this.drawSprite(g, item, sim.item.x - item.w * 0.5, sim.item.y - item.h * 0.5);
    if (sim.delivered) {
      // the exit swallows the specimen in a bloom of beam light
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.mint, sim.exitX, sim.exitY, 60 + 170 * p, 60 + 170 * p, 0.25 + 0.75 * bump(sim.slurp));
      drawGlow(g, GLOW.white, sim.exitX, sim.exitY, 30 + 60 * p, 30 + 60 * p, bump(sim.slurp));
      g.globalCompositeOperation = 'source-over';
    } else {
      this.sleepEffects(g);
      this.reticle(g, dragging, turn);
    }
    this.fx.draw(g);
    g.restore();
    drawVignette(g);
    drawEdgeTint(g, GLOW.red, this.alarm * (ctx.reducedMotion ? 0.5 : 0.5 + 0.25 * Math.sin(ctx.time * 9)));
    if (sim.delivered) {
      g.globalAlpha = p * p * (ctx.reducedMotion ? 0.25 : 0.6);
      g.fillStyle = '#d9fff0';
      g.fillRect(0, 0, VIEW_W, VIEW_H);
      g.globalAlpha = 1;
    }
    this.hud(g, tutorial, turn, turnHint);
    g.restore();
  }

  /** Turn simulation events into particles and short timers. */
  private moments(dt: number): void {
    const { sim, fx } = this;
    const { body } = sim;
    const rm = this.ctx.reducedMotion;
    const awake = sim.wake.awake > 0 && !sim.delivered;
    const headX = body.x[Joint.Head]!;
    const headY = body.y[Joint.Head]!;
    this.squash = Math.max(0, this.squash - dt * 5);
    this.meterFlash = Math.max(0, this.meterFlash - dt * 3);
    this.dreamPop = Math.min(1, this.dreamPop + dt * 4.5);
    this.alarm += ((awake ? 1 : 0) - this.alarm) * Math.min(1, dt * 7);
    this.wakeAge = awake ? this.wakeAge + dt : 0;

    if (sim.bonkSeq !== this.seenBonk) {
      this.seenBonk = sim.bonkSeq;
      const { bonkX: x, bonkY: y, bonkPower: power } = sim;
      this.meterFlash = Math.max(this.meterFlash, 0.35 + power * 0.4);
      fx.burst(P_STAR, x, y, rm ? 2 : 2 + Math.round(power * 3), 110, 200 + power * 110, 0.62, 9 + power * 4, PC.amber, 300, 1.4, -Math.PI / 2, Math.PI * 1.3);
      fx.spawn(P_RING, x, y, 0, 0, 0.3, 24 + power * 30, PC.white);
      if (!rm) {
        this.squash = power;
        fx.burst(P_PUFF, x, y, 3, 20, 80, 0.42, 12 + power * 6, PC.dust, -30, 2);
        fx.burst(P_SPARK, x, y, 4, 170, 320, 0.24, 3, PC.white, 0, 3);
      }
    }
    if (sim.catSeq !== this.seenCat) {
      this.seenCat = sim.catSeq;
      const cat = sim.room.cat;
      if (cat) {
        const x = cat.x + cat.w / 2;
        fx.burst(P_STAR, x, cat.y, rm ? 2 : 4, 140, 260, 0.6, 10, PC.red, 320, 1.4, -Math.PI / 2, Math.PI);
        fx.spawn(P_RING, x, cat.y + 10, 0, 0, 0.36, 70, PC.red);
      }
    }
    if (sim.wakeSeq !== this.seenWake) {
      this.seenWake = sim.wakeSeq;
      this.meterFlash = 1;
      this.wakeAge = 0.0001;
      fx.spawn(P_RING, headX, headY, 0, 0, 0.45, 100, PC.red);
      if (!rm) fx.burst(P_SPARK, headX, headY, 10, 240, 400, 0.3, 4, PC.red, 0, 2.5);
    }
    if (awake && !rm) {
      this.sweat -= dt;
      if (this.sweat <= 0) {
        this.sweat = 0.13;
        const side = fx.rnd() < 0.5 ? -1 : 1;
        fx.spawn(P_SPARK, headX + side * 24, headY - 16, side * (50 + fx.rnd() * 70), -130 - fx.rnd() * 60, 0.45, 3.4, PC.sweat, 640, 0.5);
      }
    }
    if (sim.delivered && !this.seenDelivered) {
      this.seenDelivered = true;
      const { exitX, exitY } = sim;
      fx.spawn(P_RING, exitX, exitY, 0, 0, 0.5, 130, PC.mint);
      fx.spawn(P_RING, exitX, exitY, 0, 0, 0.34, 70, PC.white);
      const count = rm ? 6 : 18;
      for (let i = 0; i < count; i++) {
        const a = fx.rnd() * Math.PI * 2;
        const d = 34 + fx.rnd() * 80;
        const index = fx.spawn(
          P_TWINKLE, body.chestX + Math.cos(a) * d, body.chestY + Math.sin(a) * d,
          Math.cos(a) * 150, Math.sin(a) * 150, 0.42 + fx.rnd() * 0.16, 7 + fx.rnd() * 7,
          i % 3 === 0 ? PC.white : PC.mint, 0, 3.5,
        );
        fx.home(index, exitX, exitY, 55);
      }
    }
    fx.update(dt);
  }

  /** Chest swell: a slow rise with every snore, quick panting once awake. */
  private breath(): number {
    const { sim } = this;
    if (this.ctx.reducedMotion || sim.delivered) return 0;
    if (sim.wake.awake > 0) return 0.5 + 0.5 * Math.sin(sim.elapsed * 15);
    return sim.snoreFx > 0 ? Math.sin(Math.PI * clamp01((1.1 - sim.snoreFx) / 1.1)) : 0;
  }

  private sprite(g: CanvasRenderingContext2D, key: string, x: number, y: number, w: number, h: number): void {
    // art lettered in English gives way to the drawn fallback in other languages
    const image = getLang() !== 'en' && ENGLISH_LETTERED.has(key) ? undefined : this.ctx.assets.get(key);
    if (image) g.drawImage(image, x, y, w, h);
    else fallback(g, key, x, y, w, h);
  }

  private drawSprite(g: CanvasRenderingContext2D, sprite: Sprite, x = sprite.x, y = sprite.y): void {
    this.sprite(g, sprite.key, x, y, sprite.w, sprite.h);
  }

  private structure(g: CanvasRenderingContext2D): void {
    // the night over the roof (the HUD floats on it) and the roof slab the beam comes through
    g.fillStyle = this.skyGrad!;
    g.fillRect(0, 0, VIEW_W, CEILING - 14);
    g.fillStyle = '#ffffff';
    g.globalAlpha = 0.6;
    for (let i = 0; i < SKY_STARS.length; i += 2) g.fillRect(SKY_STARS[i]!, SKY_STARS[i + 1]!, 2, 2);
    g.globalAlpha = 1;
    g.fillStyle = '#2b2242';
    g.fillRect(0, CEILING - 16, VIEW_W, 16);
    g.fillStyle = '#4a3d68';
    g.fillRect(0, CEILING - 16, VIEW_W, 3);

    g.fillStyle = 'rgba(17,15,34,0.48)';
    g.fillRect(0, CEILING, LEFT_WALL, FLOOR - CEILING);
    g.fillRect(RIGHT_WALL, CEILING, VIEW_W - RIGHT_WALL, FLOOR - CEILING);
    g.fillRect(0, FLOOR, VIEW_W, VIEW_H - FLOOR);
    g.fillStyle = '#514362';
    g.fillRect(LEFT_WALL - 4, CEILING, 4, FLOOR - CEILING);
    g.fillRect(RIGHT_WALL, CEILING, 4, FLOOR - CEILING);
    g.fillStyle = 'rgba(172,142,173,0.22)';
    g.fillRect(LEFT_WALL, CEILING - 3, RIGHT_WALL - LEFT_WALL, 3);
  }

  /** Soft contact shadow on the floor under the specimen; fades as they rise. */
  private floorShadow(g: CanvasRenderingContext2D): void {
    const { chestX, chestY } = this.sim.body;
    const height = clamp((FLOOR - chestY) / 560, 0, 1);
    drawGlow(g, GLOW.dark, chestX, FLOOR - 3, 96 - height * 40, 13 - height * 5, 0.62 * (1 - height * 0.7));
  }

  /** Additive pools of lamp light, ember glow and moonlight from the exit. */
  private lighting(g: CanvasRenderingContext2D): void {
    const t = this.sim.elapsed;
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const light of this.lights) {
      const pool = light.warm ? this.warmGlow : this.coolGlow;
      if (!pool) continue;
      g.globalAlpha = light.flicker && !this.ctx.reducedMotion ? 0.82 + 0.18 * Math.sin(t * 9) * Math.sin(t * 5.3) : 1;
      g.drawImage(pool, light.x - light.r, light.y - light.r, light.r * 2, light.r * 2);
    }
    g.restore();
  }

  private suspension(g: CanvasRenderingContext2D, sprite: Sprite): void {
    g.strokeStyle = '#9f8c9e';
    g.lineWidth = 2;
    if (sprite.key === 'room/hanging_plant') {
      const x = sprite.x + sprite.w / 2;
      g.beginPath();
      g.moveTo(x, CEILING);
      g.lineTo(x, sprite.y + 5);
      g.stroke();
    } else if (sprite.key === 'room/pot_rack') {
      g.beginPath();
      for (let y = CEILING + 3; y < sprite.y + 7; y += 6) {
        g.moveTo(sprite.x + 31, y);
        g.ellipse(sprite.x + 29, y, 2, 4, 0, 0, Math.PI * 2);
        g.moveTo(sprite.x + 192, y);
        g.ellipse(sprite.x + 190, y, 2, 4, 0, 0, Math.PI * 2);
      }
      g.stroke();
    }
  }

  private masonry(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    g.lineWidth = 3;
    roundBox(g, x, y, w, h, 3, '#5b4357', '#372942');
    g.fillStyle = '#79596a';
    for (let dy = 15; dy < h - 3; dy += 23) g.fillRect(x + 2, y + dy, w - 4, 2);
  }

  /** The cat breathes in its sleep (art only; its collider is unchanged). */
  private cat(g: CanvasRenderingContext2D, cat: Sprite): void {
    const awake = this.sim.catAwake > 0;
    const key = awake ? 'room/cat_awake' : cat.key;
    const { w, h } = ART[key]!;
    const rise = awake || this.ctx.reducedMotion ? 0 : (0.5 + 0.5 * Math.sin(this.sim.elapsed * 1.9)) * 2.5;
    this.sprite(g, key, cat.x, cat.y + cat.h - h - rise, w, h + rise);
  }

  private exitMarker(g: CanvasRenderingContext2D): void {
    const { sim } = this;
    const zone = sim.room.exitZone;
    const pulse = this.ctx.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(sim.elapsed * 3.2);
    // the closer the specimen, the louder the exit
    const near = 1 - clamp01((Math.hypot(sim.body.chestX - sim.exitX, sim.body.chestY - sim.exitY) - 60) / 300);
    g.save();
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.mint, sim.exitX, sim.exitY, zone.w * 0.75, zone.h * 0.75, (0.1 + pulse * 0.08) * (1 + near * 2.2));
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 0.1 + pulse * 0.1 + near * 0.1;
    g.fillStyle = MINT;
    g.beginPath();
    g.roundRect(zone.x, zone.y, zone.w, zone.h, 12);
    g.fill();
    g.globalAlpha = 0.7 + pulse * 0.3;
    g.strokeStyle = MINT;
    g.lineWidth = 2.5 + near;
    g.setLineDash(EXIT_DASHES);
    g.beginPath();
    g.roundRect(zone.x, zone.y, zone.w, zone.h, 12);
    g.stroke();
    g.setLineDash(SOLID_LINE);
    const { exitX: x } = sim;
    g.lineWidth = 3.5;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    // two chevrons climbing into the exit
    for (let i = 0; i < 2; i++) {
      const y = sim.exitY + 4 + i * 11 - pulse * (5 + near * 4);
      g.moveTo(x - 10, y + 3);
      g.lineTo(x, y - 7);
      g.lineTo(x + 10, y + 3);
    }
    g.stroke();
    g.restore();
  }

  private hazards(g: CanvasRenderingContext2D): void {
    const { fan, sign: sprite } = this.sim.room;
    if (fan) {
      g.fillStyle = '#495374';
      g.fillRect(fan.x - 3, CEILING, 6, fan.y - CEILING);
      for (const blade of this.sim.fanBlades) {
        g.save();
        g.translate(blade.x, blade.y);
        g.rotate(blade.angle);
        this.sprite(g, 'room/fan_blade', 0, -blade.r, blade.to + blade.r, blade.r * 2);
        g.restore();
      }
      this.sprite(g, 'room/fan_hub', fan.x - 25, fan.y - 25, 50, 50);
    }

    const { sign } = this.sim;
    if (sign && sprite) {
      const cos = Math.cos(sign.angle);
      const sin = Math.sin(sign.angle);
      const anchor = sprite.w / 2 - 15;
      const mountY = 16;
      g.strokeStyle = '#9f8c9e';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(sign.x - anchor, CEILING);
      g.lineTo(sign.x - anchor * cos - mountY * sin, sign.y - anchor * sin + mountY * cos);
      g.moveTo(sign.x + anchor, CEILING);
      g.lineTo(sign.x + anchor * cos - mountY * sin, sign.y + anchor * sin + mountY * cos);
      g.stroke();
      g.save();
      g.translate(sign.x, sign.y);
      g.rotate(sign.angle);
      this.drawSprite(g, sprite, -sprite.w / 2, 0);
      g.restore();
    }
  }

  private beam(g: CanvasRenderingContext2D, dragging: boolean): void {
    const { body, elapsed, slurp, emitterX, exitX, exitY } = this.sim;
    const p = slurp * slurp;
    const x = body.chestX + (exitX - body.chestX) * p;
    const y = body.chestY + (exitY - body.chestY) * p;
    const spread = 59 * (1 - p);
    const power = (1 - p) * (dragging ? 1 : 0.72);
    g.save();
    g.globalCompositeOperation = 'lighter';
    // wide soft cone, then a brighter core
    for (let pass = 0; pass < 2; pass++) {
      const k = pass === 0 ? 1 : 0.42;
      g.beginPath();
      g.moveTo(emitterX - 23 * k, CEILING);
      g.lineTo(emitterX + 23 * k, CEILING);
      g.lineTo(x + spread * k, y + 28 * (1 - p));
      g.quadraticCurveTo(x, y + 46 * (1 - p), x - spread * k, y + 28 * (1 - p));
      g.closePath();
      g.globalAlpha = power * (pass === 0 ? 1 : 0.55);
      g.fillStyle = this.beamGrad!;
      g.fill();
    }
    // glow where the beam lands and at the emitter
    g.globalAlpha = power;
    if (this.mintGlow) {
      g.drawImage(this.mintGlow, x - 95, y + 8 - 62, 190, 124);
      g.drawImage(this.mintGlow, emitterX - 60, CEILING - 30, 120, 60);
    }

    const phase = this.ctx.reducedMotion ? 0 : elapsed;
    const count = this.ctx.reducedMotion ? 12 : PARTICLE_COUNT;
    for (let i = 0; i < count; i++) {
      const t = (this.particles[i * 2]! + phase * (0.22 + (i % 3) * 0.025)) % 1;
      const offset = this.particles[i * 2 + 1]! * (43 + (spread * 2 - 43) * t);
      g.globalAlpha = (0.3 + (1 - t) * 0.5) * (1 - p);
      const size = i % 4 === 0 ? 3 : 2;
      g.fillStyle = i % 4 === 0 ? '#edffe7' : MINT;
      g.fillRect(emitterX + (x - emitterX) * t + offset, CEILING + (y - CEILING) * t, size, size);
    }
    g.restore();
  }

  /** The saucer parked over the roof: hull, chasing rim lights and the beam nozzle. */
  private saucer(g: CanvasRenderingContext2D, dragging: boolean): void {
    const { emitterX: x } = this.sim;
    const rm = this.ctx.reducedMotion;
    const t = this.ctx.time;
    const y = CEILING - 31 + (rm ? 0 : Math.sin(t * 2.1) * 1.8);
    g.save();
    g.lineWidth = 3;
    g.lineJoin = 'round';
    // nozzle through the roof
    g.beginPath();
    g.moveTo(x - 15, y + 6);
    g.lineTo(x + 15, y + 6);
    g.lineTo(x + 25, CEILING - 3);
    g.lineTo(x - 25, CEILING - 3);
    g.closePath();
    g.fillStyle = '#56648c';
    g.fill();
    g.strokeStyle = INK;
    g.stroke();
    ellipse(g, x, CEILING - 4, 23, 5, MINT, INK);
    // hull
    ellipse(g, x, y, 84, 15, '#9fb3d6', INK);
    g.beginPath();
    g.ellipse(x, y + 3, 76, 10, 0, 0, Math.PI);
    g.fillStyle = '#7b8db3';
    g.fill();
    g.beginPath();
    g.ellipse(x, y - 5, 58, 5, 0, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,0.28)';
    g.fill();
    const head = Math.floor(t * 7) % HULL_LIGHTS;
    for (let i = 0; i < HULL_LIGHTS; i++) {
      const lx = x + (i - 3) * 22;
      const ly = y + 5 - Math.abs(i - 3) * 1.4;
      const on = rm ? i % 2 === 0 : i === head || (dragging && (i + 1) % HULL_LIGHTS === head);
      g.beginPath();
      g.arc(lx, ly, 4.2, 0, Math.PI * 2);
      g.fillStyle = on ? '#FFD27A' : '#4a4470';
      g.fill();
      if (on) {
        g.globalCompositeOperation = 'lighter';
        drawGlow(g, GLOW.amber, lx, ly, 13, 13, 0.7);
        g.globalCompositeOperation = 'source-over';
      }
    }
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.mint, x, CEILING - 2, 46, 16, dragging ? 0.9 : 0.6);
    g.restore();
  }

  private reticle(g: CanvasRenderingContext2D, dragging: boolean, turn: TurnControl | undefined): void {
    const { beamX, beamY } = this.sim.body;
    const radius = dragging ? 24 : 19;
    if (turn) drawTurnTell(g, beamX, beamY, radius, turn, this.sim.body.tilt, this.ctx.reducedMotion);
    const spin = this.ctx.reducedMotion ? 0 : this.sim.elapsed * 1.4;
    g.save();
    g.translate(beamX, beamY);
    g.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      g.lineWidth = pass === 0 ? 6 : 2.6;
      g.strokeStyle = pass === 0 ? INK : MINT;
      g.beginPath();
      g.arc(0, 0, radius, 0, Math.PI * 2);
      for (let i = 0; i < 4; i++) {
        const a = spin + i * Math.PI / 2;
        g.moveTo(Math.cos(a) * (radius + 4), Math.sin(a) * (radius + 4));
        g.lineTo(Math.cos(a) * (radius + 11), Math.sin(a) * (radius + 11));
      }
      g.stroke();
    }
    g.fillStyle = dragging ? '#7CFFCB40' : '#7CFFCB22';
    g.beginPath();
    g.arc(0, 0, radius, 0, Math.PI * 2);
    g.fill();
    ellipse(g, 0, 0, 3.5, 3.5, MINT);
    g.restore();
  }

  private sleepEffects(g: CanvasRenderingContext2D): void {
    const { body, snoreFx, mumbleFx, wake, elapsed } = this.sim;
    const rm = this.ctx.reducedMotion;
    const x = body.x[Joint.Head]!;
    const y = body.y[Joint.Head]!;
    if (wake.awake > 0) {
      this.bang(g, x, y);
      return;
    }
    if (mumbleFx > 0) {
      this.speech(g, x, y);
      return;
    }

    // dream bubble: a thought trail leads from the head to the cloud
    const dream = wake.bonks % DREAMS.length;
    if (dream !== this.lastDream) {
      this.lastDream = dream;
      this.dreamPop = 0;
    }
    const beside = y < 258;
    const direction = x < VIEW_W / 2 ? 1 : -1;
    const dreamX = clamp(x + (beside ? direction * 92 : 10), 56, VIEW_W - 56);
    const dreamY = clamp(y - (beside ? 22 : 98), CEILING + 31, FLOOR - 65) + (rm ? 0 : Math.sin(elapsed * 1.6) * 2.5);
    const dx = dreamX - x;
    const dy = dreamY - y;
    const d = Math.hypot(dx, dy) || 1;
    const from = 39;
    const to = d - 31;
    g.lineWidth = 2;
    g.globalAlpha = 0.93;
    if (to > from + 4) {
      for (let i = 0; i < 3; i++) {
        const s = from + (to - from) * ((i + 0.6) / 3.2);
        ellipse(g, x + (dx / d) * s, y + (dy / d) * s, 3 + i * 2.2, 2.6 + i * 1.9, BUBBLE, '#8b7597');
      }
    }
    const pop = rm ? 1 : easeOutBack(this.dreamPop);
    g.save();
    g.translate(dreamX, dreamY);
    g.scale(pop, pop);
    g.lineWidth = 2.5;
    ellipse(g, 0, 0, 36, 29, BUBBLE, '#8b7597');
    this.sprite(g, DREAMS[dream]!, -30, -25, 60, 50);
    g.restore();
    g.globalAlpha = 1;

    if (snoreFx > 0) {
      // Zzz drifts up and swells as the snore goes on
      const k = clamp01((1.1 - snoreFx) / 1.1);
      const drift = rm ? 0 : k * 34;
      const size = 40 * (rm ? 1 : 0.7 + 0.5 * k);
      g.globalAlpha = Math.min(1, snoreFx * 2.6);
      const snoreX = y < 250 && x < VIEW_W / 2 ? x - 78 : x + 36;
      this.sprite(g, 'ui/zzz', clamp(snoreX, 25, VIEW_W - 65), clamp(y - 62 - drift, CEILING + 3, FLOOR - 39) - (size - 40), size, size);
      g.globalAlpha = 1;
    }
  }

  /** Sleep-talk bubble with a tail pointing at the speaker's head. */
  private speech(g: CanvasRenderingContext2D, x: number, y: number): void {
    const { mumble, mumbleFx } = this.sim;
    const pad = 18;
    const h = 42;
    g.font = MUMBLE_FONT;
    if (mumble !== this.measuredMumble) {
      this.measuredMumble = mumble;
      this.shownMumble = gt(mumble);
      this.mumbleWidth = Math.min(VIEW_W - 44, Math.ceil(g.measureText(this.shownMumble).width) + pad * 2);
    }
    const w = this.mumbleWidth;
    const left = clamp(x - w / 2, 22, VIEW_W - 22 - w);
    const top = clamp(y < 226 ? y + 58 : y - 116, CEILING + 6, FLOOR - 49);
    const below = top > y;
    const baseX = clamp(x, left + 26, left + w - 26);
    const baseY = below ? top + 2 : top + h - 2;
    const dx = x - baseX;
    const dy = y - baseY;
    const d = Math.hypot(dx, dy) || 1;
    const reach = Math.min(d - 34, 40);
    const pop = this.ctx.reducedMotion ? 1 : easeOutBack((MUMBLE_SECONDS - mumbleFx) / 0.22);
    g.save();
    g.globalAlpha = clamp01(mumbleFx / 0.18);
    g.translate(baseX, baseY);
    g.scale(pop, pop);
    g.translate(-baseX, -baseY);
    g.lineJoin = 'round';
    g.lineWidth = 5;
    g.strokeStyle = BUBBLE_EDGE;
    g.fillStyle = BUBBLE;
    // outline both shapes first, then fill both, so no line shows where the tail joins
    g.beginPath();
    g.roundRect(left, top, w, h, 15);
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
    g.roundRect(left, top, w, h, 15);
    g.fill();
    g.fillStyle = INK;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.fillText(this.shownMumble, left + w / 2, top + 27, w - pad * 2);
    g.restore();
  }

  /** Wide-awake "!" burst over the head. */
  private bang(g: CanvasRenderingContext2D, x: number, y: number): void {
    const rm = this.ctx.reducedMotion;
    const age = this.wakeAge;
    const pop = rm ? 1 : easeOutBack(age / 0.24, 3.2);
    const wobble = rm ? 0 : Math.sin(age * 34) * 0.14 * Math.max(0, 1 - age * 1.4) + Math.sin(age * 9) * 0.04;
    g.save();
    g.translate(clamp(x + 34, 50, VIEW_W - 50), clamp(y - 74, CEILING + 40, FLOOR - 60));
    g.rotate(0.2 + wobble);
    g.scale(pop, pop);
    g.beginPath();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = i % 2 === 0 ? 34 : 23;
      if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    g.lineJoin = 'round';
    g.lineWidth = 4;
    g.fillStyle = '#FF5D73';
    g.fill();
    g.strokeStyle = INK;
    g.stroke();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.roundRect(-4.5, -19, 9, 22, 3.5);
    g.arc(0, 12, 5, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  private hud(g: CanvasRenderingContext2D, tutorial: boolean, turn: TurnControl | undefined, turnHint: string | undefined): void {
    const { wake, elapsed, body } = this.sim;
    const { ctx } = this;
    const second = Math.floor(elapsed);
    if (second !== this.lastSecond) {
      this.lastSecond = second;
      this.clock = Math.floor(second / 60) + ':' + String(second % 60).padStart(2, '0');
    }
    const m = this.meter;
    const ab = tr().abduct;
    m.label = body.gripActive ? ab.holdingOn : wake.awake > 0 ? ab.awake : ab.wake;
    m.value = wake.value / 100;
    m.alarm = wake.awake > 0;
    m.flash = this.meterFlash;
    m.t = ctx.time;
    m.reduced = ctx.reducedMotion;
    hudMeter(g, METER.x, METER.y, METER.w, METER.h, m);
    hudTimer(g, TIMER.x, TIMER.y, TIMER.w, TIMER.h, this.clock);
    hudButton(g, RESTART, 'restart', tr().common.restart, false);
    if (turn && !this.sim.delivered) drawTurnButtons(g, turn);

    if (body.gripActive) hudPrompt(g, VIEW_W / 2, 909, 54, ab.shakeGrip, 20, 'shake', ctx.time, ctx.reducedMotion, 480);
    else if (tutorial) hudPrompt(g, VIEW_W / 2, 909, 54, ab.dragBeam, 21, 'drag', ctx.time, ctx.reducedMotion, 480);
    else if (turnHint) hudPrompt(g, VIEW_W / 2, 909, 54, turnHint, 21, 'drag', ctx.time, ctx.reducedMotion, 480);
  }
}
