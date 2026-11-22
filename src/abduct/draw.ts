import { ART, type ArtSpec } from '../art-manifest';
import { VIEW_H, VIEW_W, type GameContext } from '../contracts';
import { clamp, Joint, type Ragdoll } from './ragdoll';
import { BEAM_ORIGIN_Y, FLOOR, SAUCER_X, type AbductSimulation } from './simulation';
import type { Human, Sprite } from './rooms/layout';

export const RESTART = { x: 422, y: 28, w: 94, h: 60 };
const INK = '#1d1631';
const MINT = '#8effce';
const EXIT_DASHES = [2, 8];
const SOLID_LINE: number[] = [];
const DREAMS = ['ui/dream_sheep', 'ui/dream_sandwich', 'ui/dream_taxform'] as const;
const PARTICLE_COUNT = 32;

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
      roundBox(g, 4, 27, w - 8, h - 29, 14, '#6c4548', INK);
      roundBox(g, 4, 13, 21, 118, 6, '#8e625a');
      roundBox(g, 23, 5, 72, 32, 12, '#c8b1a6', INK);
      roundBox(g, 88, 6, w - 94, 64, 11, '#695d88', INK);
      g.fillStyle = '#84759d';
      g.fillRect(135, 9, 9, 58);
      g.fillRect(224, 9, 9, 58);
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
      ellipse(g, 60, 78, 36, 35, '#77748e', INK);
      ellipse(g, 60, 78, 26, 25, '#3c3f63', INK);
      ellipse(g, 50, 69, 9, 4, '#737fa0');
      ellipse(g, 98, 17, 6, 6, '#e2bc89', INK);
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
        roundBox(g, 23 + i * 6, 5 + i * 17, 98 - i * 5, 21, 5, i % 2 ? '#9a839b' : '#b5a6be', INK);
      }
      ellipse(g, 28, 115, 10, 12, '#52455e', INK);
      ellipse(g, 112, 115, 10, 12, '#52455e', INK);
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
      g.fillText('NO SLEEPING', w / 2, 30);
      g.fillText('ON DUTY', w / 2, 52);
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
      g.fillText('Zzz', 1, 27);
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

class HumanArt {
  private readonly head: Part;
  private readonly awakeHead: Part;
  private readonly torso: Part;
  private readonly upperArm: Part;
  private readonly lowerArm: Part;
  private readonly upperLeg: Part;
  private readonly lowerLeg: Part;

  constructor(human: Human, private readonly ctx: GameContext) {
    const key = 'human/' + human;
    const shirt = human === 'doyle' ? '#ac5961' : '#6482a6';
    const pants = human === 'doyle' ? '#904951' : '#b4977f';
    this.head = part(key + '_head', '#d5a182');
    this.awakeHead = part(key + '_head_awake', '#d5a182');
    this.torso = part(key + '_torso', shirt);
    this.upperArm = part(key + '_upper_arm', shirt);
    this.lowerArm = part(key + '_lower_arm', '#c18b77');
    this.upperLeg = part(key + '_upper_leg', pants);
    this.lowerLeg = part(key + '_lower_leg', pants);
  }

  draw(g: CanvasRenderingContext2D, body: Ragdoll, awake: boolean): void {
    g.save();
    g.globalAlpha *= 0.73;
    this.bone(g, body, this.upperArm, Joint.Neck, Joint.FarElbow);
    this.bone(g, body, this.lowerArm, Joint.FarElbow, Joint.FarHand);
    this.bone(g, body, this.upperLeg, Joint.Pelvis, Joint.FarKnee);
    this.bone(g, body, this.lowerLeg, Joint.FarKnee, Joint.FarFoot);
    g.restore();

    this.bone(g, body, this.torso, Joint.Neck, Joint.Pelvis);
    this.bone(g, body, this.upperLeg, Joint.Pelvis, Joint.NearKnee);
    this.bone(g, body, this.lowerLeg, Joint.NearKnee, Joint.NearFoot);
    this.bone(g, body, this.upperArm, Joint.Neck, Joint.NearElbow);
    this.bone(g, body, this.lowerArm, Joint.NearElbow, Joint.NearHand);
    this.bone(g, body, awake ? this.awakeHead : this.head, Joint.Neck, Joint.Head, true, awake);
  }

  private bone(
    g: CanvasRenderingContext2D, body: Ragdoll, part: Part,
    a: Joint, b: Joint, head = false, awake = false,
  ): void {
    const x = body.x[a]!;
    const y = body.y[a]!;
    g.save();
    g.translate(x, y);
    g.rotate(Math.atan2(body.y[b]! - y, body.x[b]! - x) + (head ? Math.PI / 2 : -Math.PI / 2));
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
  private lastSecond = -1;
  private clock = '0:00';

  constructor(private readonly sim: AbductSimulation, private readonly ctx: GameContext) {
    this.human = new HumanArt(sim.room.human, ctx);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.particles[i * 2] = (i * 0.61803398875) % 1;
      this.particles[i * 2 + 1] = (i * 0.38196601125 + i * i * 0.013) % 1 - 0.5;
    }
  }

  render(g: CanvasRenderingContext2D, tutorial: boolean, dragging: boolean): void {
    const { sim, ctx } = this;
    const { room, body } = sim;
    g.save();
    const backdrop = ctx.assets.get(room.backdrop);
    if (backdrop) {
      g.drawImage(backdrop, 0, 0, VIEW_W, VIEW_H);
    } else {
      g.fillStyle = room.human === 'doyle' ? '#2c233f' : '#232c45';
      g.fillRect(0, 0, VIEW_W, VIEW_H);
      g.fillStyle = room.human === 'doyle' ? '#362943' : '#28344c';
      for (let x = 25; x < VIEW_W; x += 44) g.fillRect(x, 120, 2, FLOOR - 120);
    }

    g.save();
    if (!ctx.reducedMotion && sim.shake > 0) {
      g.translate(Math.sin(sim.elapsed * 94) * sim.shake * 5, Math.cos(sim.elapsed * 116) * sim.shake * 3);
    }
    this.structure(g);
    this.drawSprite(g, room.exit);
    this.exitMarker(g);
    for (const box of room.masonry ?? []) this.masonry(g, box.x, box.y, box.w, box.h);
    for (const furniture of room.furniture) this.drawSprite(g, furniture.sprite);
    if (sim.cart && room.cart) this.drawSprite(g, room.cart.sprite, sim.cart.x - 5, room.cart.sprite.y);
    if (room.cat) {
      const key = sim.catAwake > 0 ? 'room/cat_awake' : room.cat.key;
      const { w, h } = ART[key]!;
      this.sprite(g, key, room.cat.x, room.cat.y + room.cat.h - h, w, h);
    }
    this.hazards(g);
    this.beam(g);

    const p = sim.slurp * sim.slurp;
    g.save();
    if (sim.delivered) {
      g.translate(body.chestX + (SAUCER_X - body.chestX) * p, body.chestY + (BEAM_ORIGIN_Y - 10 - body.chestY) * p);
      g.scale(1 - p * 0.83, 1 - p * 0.83);
      g.translate(-body.chestX, -body.chestY);
      g.globalAlpha = 1 - p;
    }
    const item = room.item.sprite;
    if (!sim.delivered || sim.item.stolen) this.drawSprite(g, item, sim.item.x - item.w * 0.5, sim.item.y - item.h * 0.5);
    this.human.draw(g, body, sim.wake.awake > 0);
    g.restore();

    if (sim.delivered && !sim.item.stolen) this.drawSprite(g, item, sim.item.x - item.w * 0.5, sim.item.y - item.h * 0.5);
    if (!sim.delivered) {
      this.sleepEffects(g);
      this.reticle(g, dragging);
    }
    g.restore();
    this.hud(g, tutorial);
    g.restore();
  }

  private sprite(g: CanvasRenderingContext2D, key: string, x: number, y: number, w: number, h: number): void {
    const image = this.ctx.assets.get(key);
    if (image) g.drawImage(image, x, y, w, h);
    else fallback(g, key, x, y, w, h);
  }

  private drawSprite(g: CanvasRenderingContext2D, sprite: Sprite, x = sprite.x, y = sprite.y): void {
    this.sprite(g, sprite.key, x, y, sprite.w, sprite.h);
  }

  private structure(g: CanvasRenderingContext2D): void {
    g.fillStyle = 'rgba(17,15,34,0.48)';
    g.fillRect(0, 119, 20, FLOOR - 119);
    g.fillRect(520, 119, 20, FLOOR - 119);
    g.fillRect(0, FLOOR, VIEW_W, VIEW_H - FLOOR);
    g.fillStyle = '#514362';
    g.fillRect(16, 133, 4, FLOOR - 133);
    g.fillRect(520, 133, 4, FLOOR - 133);
    g.fillRect(20, FLOOR, 500, 4);
    g.fillStyle = 'rgba(172,142,173,0.15)';
    g.fillRect(20, 838, 500, 4);
    g.fillRect(20, 133, 500, 3);
  }

  private masonry(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    roundBox(g, x, y, w, h, 3, '#5b4357', '#372942');
    g.fillStyle = '#79596a';
    for (let dy = 15; dy < h - 3; dy += 23) g.fillRect(x + 2, y + dy, w - 4, 2);
  }

  private exitMarker(g: CanvasRenderingContext2D): void {
    const zone = this.sim.room.exitZone;
    g.save();
    g.globalAlpha = 0.61;
    g.strokeStyle = MINT;
    g.lineWidth = 2;
    g.setLineDash(EXIT_DASHES);
    g.beginPath();
    g.roundRect(zone.x, zone.y, zone.w, zone.h, 12);
    g.stroke();
    g.setLineDash(SOLID_LINE);
    const x = zone.x + zone.w * 0.5;
    const y = zone.y + zone.h * 0.5;
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x - 10, y + 3);
    g.lineTo(x, y - 7);
    g.lineTo(x + 10, y + 3);
    g.stroke();
    g.restore();
  }

  private hazards(g: CanvasRenderingContext2D): void {
    for (const blade of this.sim.fanBlades) {
      g.save();
      g.translate(blade.x, blade.y);
      g.rotate(blade.angle);
      this.sprite(g, 'room/fan_blade', 0, -14, 220, 28);
      g.restore();
    }
    const fan = this.sim.room.fan;
    if (fan) this.sprite(g, 'room/fan_hub', fan.x - 25, fan.y - 25, 50, 50);

    const { sign } = this.sim;
    const sprite = this.sim.room.sign;
    if (sign && sprite) {
      g.strokeStyle = '#9f8c9e';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(sign.x, sprite.y - 27);
      g.lineTo(sign.x, sign.y - 14);
      g.stroke();
      g.save();
      g.translate(sign.x, sign.y);
      g.rotate(sign.angle);
      this.drawSprite(g, sprite, 0, -sprite.h * 0.5);
      g.restore();
    }
  }

  private beam(g: CanvasRenderingContext2D): void {
    const { body, elapsed, slurp } = this.sim;
    const p = slurp * slurp;
    const x = body.chestX + (SAUCER_X - body.chestX) * p;
    const y = Math.max(BEAM_ORIGIN_Y + 5, body.chestY + (BEAM_ORIGIN_Y - body.chestY) * p);
    const spread = 59 * (1 - p);
    g.save();
    g.beginPath();
    g.moveTo(SAUCER_X - 23, BEAM_ORIGIN_Y);
    g.lineTo(SAUCER_X + 23, BEAM_ORIGIN_Y);
    g.lineTo(x + spread, y + 28 * (1 - p));
    g.quadraticCurveTo(x, y + 46 * (1 - p), x - spread, y + 28 * (1 - p));
    g.closePath();
    g.fillStyle = 'rgba(105,249,178,0.14)';
    g.fill();
    g.strokeStyle = 'rgba(133,255,199,0.21)';
    g.lineWidth = 1.5;
    g.stroke();

    const phase = this.ctx.reducedMotion ? 0 : elapsed;
    const count = this.ctx.reducedMotion ? 12 : PARTICLE_COUNT;
    for (let i = 0; i < count; i++) {
      const t = (this.particles[i * 2]! + phase * (0.22 + (i % 3) * 0.025)) % 1;
      const offset = this.particles[i * 2 + 1]! * (43 + (spread * 2 - 43) * t);
      g.globalAlpha = (0.23 + (1 - t) * 0.35) * (1 - p);
      const size = i % 4 === 0 ? 3 : 2;
      g.fillStyle = i % 4 === 0 ? '#edffe7' : MINT;
      g.fillRect(SAUCER_X + (x - SAUCER_X) * t + offset, BEAM_ORIGIN_Y + (y - BEAM_ORIGIN_Y) * t, size, size);
    }
    g.globalAlpha = 1;
    ellipse(g, SAUCER_X, BEAM_ORIGIN_Y - 12, 38, 10, '#596683', '#9ba0c1');
    ellipse(g, SAUCER_X, BEAM_ORIGIN_Y - 5, 23, 5, MINT);
    g.restore();
  }

  private reticle(g: CanvasRenderingContext2D, dragging: boolean): void {
    const { beamX, beamY } = this.sim.body;
    const radius = dragging ? 17 : 13;
    g.lineWidth = 3.5;
    ellipse(g, beamX, beamY, radius, radius, '#80ffbd24', INK);
    g.lineWidth = 1.5;
    ellipse(g, beamX, beamY, radius, radius, '#80ffbd18', MINT);
    g.fillStyle = MINT;
    g.fillRect(beamX - 2, beamY - 2, 4, 4);
  }

  private sleepEffects(g: CanvasRenderingContext2D): void {
    const { body, snoreFx, mumbleFx, mumble, wake } = this.sim;
    const x = body.x[Joint.Head]!;
    const y = body.y[Joint.Head]!;
    const above = clamp(y - 113, 137, 756);
    if (mumbleFx > 0) {
      const textX = clamp(x, 148, 392);
      roundBox(g, textX - 138, above + 7, 276, 42, 15, '#e9ddd2', '#6c5277');
      g.fillStyle = INK;
      g.textAlign = 'center';
      g.font = '600 16px system-ui';
      g.fillText(mumble, textX, above + 34);
    } else if (wake.awake === 0) {
      const dreamX = clamp(x - 37, 27, 410);
      g.globalAlpha = 0.91;
      ellipse(g, dreamX + 34, above + 24, 34, 27, '#e9ddd2', '#8b7597');
      ellipse(g, dreamX + 40, above + 55, 5, 4, '#e9ddd2');
      this.sprite(g, DREAMS[wake.bonks % DREAMS.length]!, dreamX + 4, above - 1, 60, 50);
      g.globalAlpha = 1;
    }
    if (snoreFx > 0) {
      const drift = this.ctx.reducedMotion ? 0 : (1.1 - snoreFx) * 31;
      g.globalAlpha = Math.min(1, snoreFx * 2.6);
      this.sprite(g, 'ui/zzz', clamp(x + 36, 37, 467), clamp(y - 62 - drift, 136, 807), 40, 40);
      g.globalAlpha = 1;
    }
  }

  private hud(g: CanvasRenderingContext2D, tutorial: boolean): void {
    g.save();
    g.fillStyle = '#15172bec';
    g.fillRect(0, 0, VIEW_W, 106);
    const { wake, elapsed, body } = this.sim;
    const second = Math.floor(elapsed);
    if (second !== this.lastSecond) {
      this.lastSecond = second;
      this.clock = Math.floor(second / 60) + ':' + String(second % 60).padStart(2, '0');
    }
    g.textAlign = 'left';
    g.fillStyle = '#d3c4df';
    g.font = '700 16px system-ui';
    g.fillText(body.gripActive ? 'GRABBING ON' : wake.awake > 0 ? 'AWAKE' : 'WAKE', 25, 39);
    roundBox(g, 24, 53, 248, 18, 9, '#332b48');
    if (wake.value > 0.3) {
      roundBox(g, 24, 53, 248 * wake.value / 100, 18, 8, wake.value > 73 ? '#ff907e' : '#91e8bb');
    }
    g.fillStyle = '#c7b6d8';
    g.fillText('TIME', 295, 39);
    g.fillStyle = '#f1e8f4';
    g.font = '600 26px monospace';
    g.fillText(this.clock, 294, 69);
    g.lineWidth = 1.5;
    roundBox(g, RESTART.x, RESTART.y, RESTART.w, RESTART.h, 13, '#322942', '#6a5578');
    g.fillStyle = '#f1e8f4';
    g.textAlign = 'center';
    g.font = '700 15px system-ui';
    g.fillText('Restart', RESTART.x + RESTART.w / 2, RESTART.y + 36);

    if (tutorial || body.gripActive) {
      roundBox(g, 40, 883, 460, 52, 14, '#1e2239', '#73608b');
      g.fillStyle = MINT;
      if (body.gripActive) {
        g.font = '600 21px system-ui';
        g.fillText('Shake the beam to break their grip!', 270, 917, 410);
      } else {
        g.font = '600 19px system-ui';
        g.textAlign = 'left';
        g.fillText('Drag to move the beam — gently!', 119, 917, 345);
        g.translate(-16, 0);
        g.strokeStyle = MINT;
        g.lineWidth = 2.4;
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.beginPath();
        g.moveTo(105, 916);
        g.lineTo(102, 909);
        g.lineTo(106, 906);
        g.lineTo(110, 911);
        g.lineTo(110, 899);
        g.quadraticCurveTo(113, 896, 116, 899);
        g.lineTo(116, 905);
        g.lineTo(124, 908);
        g.lineTo(124, 915);
        g.lineTo(120, 922);
        g.lineTo(110, 922);
        g.closePath();
        g.stroke();
      }
    }
    g.restore();
  }
}
