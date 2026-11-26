import { ApeLimbProjection, apeFallback } from './monolith-art';
import { Container, FillGradient, Graphics, Sprite } from 'pixi.js';
import { ART, type ArtSpec } from '../art-manifest';
import { VIEW_H, VIEW_W, type Assets, type GameContext } from '../contracts';
import { GLOW, PC, P_PUFF, P_RING, P_SPARK, P_STAR, P_TWINKLE, Particles, clamp01, easeOutBack } from '../core/fx';
import { Glow, ScreenTint, glowTexture, lightTexture } from '../core/gfx/glow';
import { ParticleView } from '../core/gfx/particles';
import type { SceneView } from '../core/gfx/scene';
import { Shape, ellipseArc, keyOf } from '../core/gfx/shapes';
import { HudButton, HudMeter, HudPrompt, HudTimer, HUD_ROW, type MeterState } from '../ui/views/hud';
import { artSprite } from '../ui/views/art';
import { getLang, tr } from '../i18n';
import { clamp, Joint, type Ragdoll } from './ragdoll';
import type { AbductSimulation } from './simulation';
import { TurnButtonsView, TurnTell } from './turn-draw';
import { CEILING, FLOOR, LEFT_WALL, RIGHT_WALL, type Human, type Room, type Sprite as RoomSprite } from './rooms/layout';
import { POP_SECONDS, SOUVENIR_HINT, SouvenirMarker, SouvenirPop, souvenirLabel } from './souvenir';
import { paintSouvenir } from './souvenir-art';
import { DeliveryView, ExitChevrons, Reticle, SnoozeView, SnoreView, SpeechBubble, WakeBurst, roundedZone, type AbductViewInput } from './views/effects';
import { FailureView } from './views/failure';
import { ItemSparkle } from './views/item-sparkle'; // v4 items
import { INK, MINT, Segment, bitmap, box } from './views/pieces';

export const RESTART = { x: 422, y: HUD_ROW.y, w: 104, h: HUD_ROW.h };
const DREAMS = ['ui/dream_sheep', 'ui/dream_sandwich', 'ui/dream_taxform'] as const;
const PARTICLE_COUNT = 32;
const BUBBLE = '#e9ddd2';
const SKY_STARS = [22, 14, 71, 96, 118, 30, 163, 104, 214, 12, 262, 88, 301, 22, 352, 110, 398, 8, 431, 92, 476, 34, 520, 100, 96, 60, 338, 58] as const;
const HULL_LIGHTS = 7;

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

function fallback(g: CanvasRenderingContext2D, key: string, x: number, y: number, w: number, h: number, labels: ReturnType<typeof tr>['abduct']): void {
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
      g.fillText(labels.noSleeping, w / 2, 30, w - 16);
      g.fillText(labels.onDuty, w / 2, 52, w - 16);
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
      g.fillText(labels.zzz, 1, 27);
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
    default:
      paintSouvenir(g, key, w, h); // v4 items & recap humour
  }
  g.restore();
}

const SHIRTS: Record<Human, string> = {
  mabel: '#8f567a', nora: '#b46a52', len: '#53749f',
  doyle: '#ac5961', larry: '#6482a6', dave: '#a284be', barb: '#dd6269',
  gary: '#e9b258', nigel: '#416790', kev: '#ae73bd', mayor: '#575783',
  // L5 pier code (bubbles is drawn by src/abduct/dolphin-art.ts)
  bubbles: '#6f86a8', pete: '#3f5b7a', sal: '#8a6f9a',
  // v4 L8
  flint: '#855944', reed: '#a87e56', echo: '#62617d',
  // L7 cruise code
  sterling: '#eef0f4', marco: '#f4f1ea', greg: '#e36a8c',
  // L6 clinic code
  hank: '#b98b5e', osei: '#4f8f8a', pemberton: '#c9cfe0',
  // v4 L9 1955
  doc: '#e0d6b1', buff: '#533752', marvin: '#88516c',
};
const PANTS: Record<Human, string> = {
  mabel: '#514965', nora: '#555b71', len: '#53749f',
  doyle: '#904951', larry: '#b4977f', dave: '#76569c', barb: '#744451',
  gary: '#926861', nigel: '#374e6c', kev: '#62496d', mayor: '#443d5c',
  // L5 pier code
  bubbles: '#dfe8f0', pete: '#e2c25a', sal: '#4c4a62',
  // v4 L8
  flint: '#855944', reed: '#a87e56', echo: '#62617d',
  // L7 cruise code
  sterling: '#2c3550', marco: '#3a3a44', greg: '#5aa6c8',
  // L6 clinic code
  hank: '#7f8aa8', osei: '#3f7773', pemberton: '#c9cfe0',
  // v4 L9 1955
  doc: '#8b7258', buff: '#5b536b', marvin: '#39304e',
};

export interface SpecimenArt {
  readonly root: Container;
  sync(body: Ragdoll, awake: boolean, breath: number): void;
}

function boneArt(ctx: GameContext, p: Part, head: boolean, awake: boolean): Sprite {
  const image = artSprite(ctx.assets, p.key, p.w, p.h) ?? apeFallback(p.key, p.w, p.h);
  if (image) {
    image.anchor.set(0.5, head ? 1 : 5 / p.h);
    return image;
  }
  const top = head ? -p.h : -5;
  return bitmap(p.key, -p.w / 2, top, p.w, p.h, (g) => {
    g.translate(p.w / 2, -top);
    g.lineWidth = 3;
    roundBox(g, -p.w / 2 + 2, top + 2, p.w - 4, p.h - 4, head ? 26 : 12, p.color, INK);
    if (head) {
      if (p.key.startsWith('human/doc_')) {
        ellipse(g, -19, -63, 13, 14, '#e8ddcc', INK);
        ellipse(g, 14, -67, 15, 11, '#f1e5d3', INK);
        ellipse(g, 0, -72, 14, 7, '#f1e5d3');
      } else if (p.key.startsWith('human/buff_') || p.key.startsWith('human/marvin_')) {
        ellipse(g, -4, -66, 25, 11, INK);
        ellipse(g, 11, -69, 15, 9, p.key.startsWith('human/marvin_') ? '#4a303c' : '#474258');
      }
      ellipse(g, -12, -47, 4, awake ? 6 : 1.2, INK);
      ellipse(g, 12, -47, 4, awake ? 6 : 1.2, INK);
      ellipse(g, 6, -27, 6, awake ? 8 : 4, '#76434c');
    }
  });
}

export class HumanArt implements SpecimenArt {
  readonly root = new Container();
  private readonly bones: { joint: Joint; end: Joint; arm: boolean; torso: boolean; far: boolean; sprite: Container }[] = [];
  private readonly ape: ApeLimbProjection | null; // v4 L8
  private readonly sleeping: Sprite;
  private readonly awake: Sprite;

  constructor(human: Human, ctx: GameContext) {
    const key = 'human/' + human;
    const skin = human === 'marvin' ? '#9e6047' : '#d5a182';
    const head = part(key + '_head', skin);
    const awakeHead = part(key + '_head_awake', skin);
    const torso = part(key + '_torso', SHIRTS[human]);
    const upperArm = part(key + '_upper_arm', SHIRTS[human]);
    const lowerArm = part(key + '_lower_arm', human === 'marvin' ? skin : '#c18b77');
    const upperLeg = part(key + '_upper_leg', PANTS[human]);
    const lowerLeg = part(key + '_lower_leg', PANTS[human]);
    this.ape = human === 'echo' || human === 'flint' || human === 'reed' ? new ApeLimbProjection() : null; // v4 L8
    const parts = [
      [upperArm, Joint.Neck, Joint.FarElbow], [lowerArm, Joint.FarElbow, Joint.FarHand],
      [upperLeg, Joint.Pelvis, Joint.FarKnee], [lowerLeg, Joint.FarKnee, Joint.FarFoot],
      [upperLeg, Joint.Pelvis, Joint.NearKnee], [lowerLeg, Joint.NearKnee, Joint.NearFoot],
      [torso, Joint.Neck, Joint.Pelvis], [upperArm, Joint.Neck, Joint.NearElbow],
      [lowerArm, Joint.NearElbow, Joint.NearHand],
    ] as const;
    for (const [p, joint, end] of parts) {
      const sprite = new Container();
      sprite.addChild(boneArt(ctx, p, false, false));
      const far = this.bones.length < 4;
      if (far && this.ape) sprite.tint = 0x9c9bb2; // v4 L8
      else if (far) sprite.alpha = 0.73;
      this.bones.push({ joint, end, arm: p === upperArm, torso: p === torso, far, sprite });
      this.root.addChild(sprite);
    }
    this.sleeping = boneArt(ctx, head, true, false);
    this.awake = boneArt(ctx, awakeHead, true, true);
    const neck = new Container();
    neck.addChild(this.sleeping, this.awake);
    this.bones.push({ joint: Joint.Neck, end: Joint.Head, arm: false, torso: false, far: false, sprite: neck });
    this.root.addChild(neck);
  }

  sync(body: Ragdoll, awake: boolean, breath: number): void {
    this.awake.visible = awake;
    this.sleeping.visible = !awake;
    this.ape?.sync(body); // v4 L8
    for (const { joint, end, arm, torso, far, sprite } of this.bones) {
      let x = body.x[joint]!;
      let y = body.y[joint]!;
      if (arm) {
        x += (body.x[Joint.Pelvis]! - x) * 0.15;
        y += (body.y[Joint.Pelvis]! - y) * 0.15;
      }
      if (this.ape && !torso && end !== Joint.Head) { // v4 L8
        this.ape.place(sprite, joint, end, far, x, y, body.x[end]!, body.y[end]!);
        continue;
      }
      sprite.position.set(x, y);
      sprite.rotation = Math.atan2(body.y[end]! - y, body.x[end]! - x) + (end === Joint.Head ? Math.PI / 2 : -Math.PI / 2);
      if (torso) sprite.scale.set(1 + breath * 0.07, 1 - breath * 0.012);
    }
  }
}

function art(ctx: GameContext, key: string, x: number, y: number, w: number, h: number): Container {
  const lang = getLang();
  const sprite = lang !== 'en' && key === 'room/sign_no_sleeping' ? null : artSprite(ctx.assets, key, w, h);
  if (sprite) {
    sprite.anchor.set(0);
    sprite.position.set(x, y);
    return sprite;
  }
  const labels = tr().abduct;
  return bitmap(key + '|' + lang + '|' + w + '|' + h, x, y, w, h, g => fallback(g, key, 0, 0, w, h, labels));
}

function prop(ctx: GameContext, s: RoomSprite): Container {
  return art(ctx, s.key, s.x, s.y, s.w, s.h);
}

class TutorialBeam {
  readonly root = new Container();
  private readonly passes = [new Shape(), new Shape()];
  private readonly dust: Sprite[] = [];
  private readonly landing = new Glow(lightTexture('124,255,203', 0.4), true);
  private readonly mouth = new Glow(lightTexture('124,255,203', 0.4), true);
  private readonly gradient = new FillGradient({
    start: { x: 0, y: CEILING },
    end: { x: 0, y: FLOOR },
    textureSpace: 'global',
    colorStops: [
      { offset: 0, color: 'rgba(124,255,203,0.42)' },
      { offset: 0.5, color: 'rgba(124,255,203,0.2)' },
      { offset: 1, color: 'rgba(124,255,203,0.1)' },
    ],
  });
  private x = 0;
  private y = 0;
  private pull = 0;
  private readonly wide = (g: Graphics): void => this.cone(g, 1);
  private readonly narrow = (g: Graphics): void => this.cone(g, 0.42);

  constructor(private readonly emitter: number) {
    for (const pass of this.passes) {
      pass.blendMode = 'add';
      this.root.addChild(pass);
    }
    this.root.addChild(this.landing, this.mouth);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const size = i % 4 === 0 ? 3 : 2;
      const mote = box(0, 0, size, size, i % 4 === 0 ? '#edffe7' : MINT);
      mote.blendMode = 'add';
      this.dust.push(mote);
      this.root.addChild(mote);
    }
  }

  private cone(g: Graphics, k: number): void {
    const x = this.x;
    const y = this.y;
    const e = this.emitter;
    const spread = 59 * this.pull * k;
    g.moveTo(e - 23 * k, CEILING).lineTo(e + 23 * k, CEILING)
      .lineTo(x + spread, y + 28 * this.pull).quadraticCurveTo(x, y + 46 * this.pull, x - spread, y + 28 * this.pull)
      .closePath().fill(this.gradient);
  }

  sync(sim: AbductSimulation, dragging: boolean, rm: boolean): void {
    const { body, elapsed, slurp, exitX, exitY } = sim;
    const p = slurp * slurp;
    this.pull = 1 - p;
    this.x = body.chestX + (exitX - body.chestX) * p;
    this.y = body.chestY + (exitY - body.chestY) * p;
    const key = keyOf(this.x, this.y, this.pull * 236);
    const power = this.pull * (dragging ? 1 : 0.72);
    this.passes[0]!.draw(key, this.wide).alpha = power;
    this.passes[1]!.draw(key, this.narrow).alpha = power * 0.55;
    this.landing.place(this.x, this.y + 8, 95, 62, power);
    this.mouth.place(this.emitter, CEILING, 60, 30, power);
    const phase = rm ? 0 : elapsed;
    for (let i = 0; i < this.dust.length; i++) {
      const mote = this.dust[i]!;
      mote.visible = !rm || i < 12;
      if (!mote.visible) continue;
      const k = ((i * 0.61803398875) % 1 + phase * (0.22 + (i % 3) * 0.025)) % 1;
      const offset = ((i * 0.38196601125 + i * i * 0.013) % 1 - 0.5) * (43 + (118 * this.pull - 43) * k);
      mote.position.set(this.emitter + (this.x - this.emitter) * k + offset, CEILING + (this.y - CEILING) * k);
      mote.alpha = (0.3 + (1 - k) * 0.5) * this.pull;
    }
  }

  dispose(): void {
    this.gradient.destroy();
  }
}

class RoomSaucer {
  readonly root = new Container();
  private readonly hull = new Container();
  private readonly nozzle = new Container();
  private readonly beam = new Glow(glowTexture(GLOW.mint), true);
  private readonly glows: Glow[] = [];
  private readonly lamps: Graphics[] = [];

  constructor(x: number) {
    this.root.position.set(x, CEILING);
    this.nozzle.addChild(new Graphics().poly([-15, -25, 15, -25, 25, -3, -25, -3])
      .fill('#56648c').stroke({ color: INK, width: 3, join: 'round' }));
    this.root.addChild(this.nozzle, new Graphics().ellipse(0, -4, 23, 5).fill(MINT).stroke({ color: INK, width: 3 }), this.hull, this.beam);
    const ship = new Graphics().ellipse(0, 0, 84, 15).fill('#9fb3d6').stroke({ color: INK, width: 3 });
    ellipseArc(ship, 0, 3, 76, 10, 0, Math.PI).closePath().fill('#7b8db3');
    ship.ellipse(0, -5, 58, 5).fill('rgba(255,255,255,0.28)');
    this.hull.addChild(ship);
    for (let i = 0; i < HULL_LIGHTS; i++) {
      const lx = (i - 3) * 22;
      const ly = 5 - Math.abs(i - 3) * 1.4;
      const lamp = new Graphics().circle(lx, ly, 4.2).fill(0xffffff);
      const light = new Glow(glowTexture(GLOW.amber), true).place(lx, ly, 13, 13, 0.7);
      this.lamps.push(lamp);
      this.glows.push(light);
    }
    // all lamps, then all glows: interleaved, each additive glow split the batch twice
    this.hull.addChild(...this.lamps, ...this.glows);
  }

  sync(t: number, dragging: boolean, rm: boolean): void {
    const bob = rm ? 0 : Math.sin(t * 2.1) * 1.8;
    this.nozzle.pivot.y = -3;
    this.nozzle.y = -3;
    this.nozzle.scale.y = 1 - bob / 22;
    this.hull.y = -31 + bob;
    const head = Math.floor(t * 7) % HULL_LIGHTS;
    for (let i = 0; i < HULL_LIGHTS; i++) {
      const on = rm ? i % 2 === 0 : i === head || (dragging && (i + 1) % HULL_LIGHTS === head);
      this.lamps[i]!.tint = on ? '#ffd27a' : '#4a4470';
      // blink with alpha: a visible flip rebuilds the render group
      this.glows[i]!.alpha = on ? 0.7 : 0;
    }
    this.beam.place(0, -2, 46, 16, dragging ? 0.9 : 0.6);
  }
}

class TutorialExit {
  readonly root = new Container();
  private readonly glow = new Glow(glowTexture(GLOW.mint), true);
  private readonly fill: Graphics;
  private readonly rings: Sprite[] = [];
  private readonly arrows = new ExitChevrons();

  constructor(private readonly sim: AbductSimulation) {
    const { x, y, w, h } = sim.room.exitZone;
    this.fill = roundedZone(sim.room.exitZone, 12);
    this.root.addChild(this.glow, this.fill);
    for (let i = 0; i < 4; i++) {
      const stroke = bitmap(`tutorial-exit|${w}|${h}|${i}`, x - 3, y - 3, w + 6, h + 6, (g) => {
        g.setLineDash([2, 8]);
        g.lineWidth = 2.5 + i / 3;
        g.strokeStyle = MINT;
        g.beginPath();
        g.roundRect(3, 3, w, h, 12);
        g.stroke();
      });
      this.rings.push(stroke);
      this.root.addChild(stroke);
    }
    this.root.addChild(this.arrows.root);
  }

  sync(rm: boolean): void {
    const { sim } = this;
    const { exitX: x, exitY: y, body } = sim;
    const { w, h } = sim.room.exitZone;
    const pulse = rm ? 0.5 : 0.5 + 0.5 * Math.sin(sim.elapsed * 3.2);
    const near = 1 - clamp01((Math.hypot(body.chestX - x, body.chestY - y) - 60) / 300);
    this.glow.place(x, y, w * 0.75, h * 0.75, (0.1 + pulse * 0.08) * (1 + near * 2.2));
    this.fill.alpha = 0.1 + pulse * 0.1 + near * 0.1;
    const stroke = Math.round(near * 3);
    for (let i = 0; i < this.rings.length; i++) {
      this.rings[i]!.visible = i === stroke;
      this.rings[i]!.alpha = 0.7 + pulse * 0.3;
    }
    this.arrows.root.position.set(x, y - pulse * (5 + near * 4));
  }
}

function paintBackdrop(g: CanvasRenderingContext2D, room: Room, assets: Assets): void {
  const image = assets.get(room.backdrop);
  if (image) g.drawImage(image, 0, 0, VIEW_W, VIEW_H);
  else {
    g.fillStyle = room.human === 'doyle' ? '#2c233f' : '#232c45';
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    g.fillStyle = room.human === 'doyle' ? '#362943' : '#28344c';
    for (let x = 25; x < VIEW_W; x += 44) g.fillRect(x, CEILING, 2, FLOOR - CEILING);
  }
  const sky = g.createLinearGradient(0, 0, 0, CEILING);
  sky.addColorStop(0, '#0b0820');
  sky.addColorStop(1, '#221a52');
  g.fillStyle = sky;
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

function suspension(g: CanvasRenderingContext2D, sprite: RoomSprite): void {
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

function masonry(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  g.lineWidth = 3;
  roundBox(g, x, y, w, h, 3, '#5b4357', '#372942');
  g.fillStyle = '#79596a';
  for (let dy = 15; dy < h - 3; dy += 23) g.fillRect(x + 2, y + dy, w - 4, 2);
}


export class AbductView implements SceneView {
  readonly root = new Container();
  private readonly world = new Container();
  private readonly human: HumanArt;
  private readonly subject = new Container();
  private readonly slurpMask = new Graphics().rect(0, 0, 1, 1).fill(0xffffff);
  private readonly floorShadow = new Glow(glowTexture(GLOW.dark));
  private readonly lights: { glow: Glow; flicker: boolean }[] = [];
  private readonly catSleep: Container | undefined;
  private readonly catAwake: Container | undefined;
  private readonly cart: Container | undefined;
  private readonly blades: Container[] = [];
  private readonly sign: Container | undefined;
  private readonly chains: Segment[] = [];
  private readonly exit: TutorialExit;
  private readonly beam: TutorialBeam;
  private readonly saucer: RoomSaucer;
  private readonly item: Container;
  private readonly sparkle = new ItemSparkle(); // v4 items
  private readonly leftItem: Container;
  private readonly speech = new SpeechBubble(false);
  private readonly bang = new WakeBurst(false);
  private readonly snore: SnoreView;
  private readonly dream = new Container();
  private readonly dreams: Container[] = [];
  private readonly trail: Graphics[] = [];
  private readonly reticle = new Reticle(false);
  private readonly turnTell = new TurnTell(19);
  private readonly delivery = new DeliveryView();
  private readonly souvenir = new SouvenirMarker();
  private readonly pop = new SouvenirPop();
  private readonly snooze = new SnoozeView();
  private readonly failure: FailureView;
  private readonly alarmTint = ScreenTint.edge(GLOW.red);
  private readonly fx = new Particles(96);
  private readonly particles = new ParticleView(this.fx);
  private readonly meter = new HudMeter();
  private readonly meterState: MeterState = {
    label: 'WAKE', value: 0, warn: 0.45, danger: 0.73, icon: 'sleep', t: 0, reduced: false, flash: 0, alarm: false,
  };
  private readonly timer = new HudTimer();
  private readonly restart = new HudButton('restart');
  private readonly turns = new TurnButtonsView();
  private readonly prompt = new HudPrompt();
  private lastSecond = -1;
  private lastTime = -1;
  private seenBonk = 0;
  private seenWake = 0;
  private seenCat = 0;
  private seenItem = 0;
  private popAge = 0;
  private popX = 0;
  private popY = 0;
  private popLabel = '';
  private firstMoveAt = -1;
  private seenDelivered = false;
  private squash = 0;
  private meterFlash = 0;
  private wakeAge = 0;
  private alarm = 0;
  private sweat = 0;
  private lastDream = 0;
  private dreamPop = 1;

  constructor(private readonly sim: AbductSimulation, private readonly ctx: GameContext, private readonly input: AbductViewInput) {
    const { room } = sim;
    this.human = new HumanArt(room.human, ctx);
    this.exit = new TutorialExit(sim);
    this.beam = new TutorialBeam(sim.emitterX);
    this.saucer = new RoomSaucer(sim.emitterX);
    this.snore = new SnoreView(ctx, false);
    this.failure = new FailureView(sim);
    const { assets } = ctx;
    const backdrop = bitmap(room.backdrop, 0, 0, VIEW_W, VIEW_H, g => paintBackdrop(g, room, assets));
    const loose = this.world;
    this.root.addChild(backdrop, loose);
    loose.addChild(this.floorShadow);
    if (room.flue) {
      const { x, y, w, h } = room.flue;
      loose.addChild(box(x, y, w, h, '#211c32'));
    }
    for (const { x, y, w, h } of room.masonry ?? []) {
      loose.addChild(bitmap(`masonry|${w}|${h}`, x - 2, y - 2, w + 4, h + 4, g => masonry(g, 2, 2, w, h)));
    }
    loose.addChild(prop(ctx, room.exit), this.exit.root);
    for (const { sprite: s } of room.furniture) {
      if (s.key === 'room/hanging_plant' || s.key === 'room/pot_rack') {
        loose.addChild(bitmap(`suspension|${s.key}|${s.y}`, s.x, CEILING, s.w, s.y + 10 - CEILING, g => {
          g.translate(-s.x, -CEILING);
          suspension(g, s);
        }));
      }
      loose.addChild(prop(ctx, s));
      if (s.key === 'room/lamp') this.light(s.x + s.w / 2, s.y + 26, 190, true, false);
      if (s.key === 'room/fireplace') this.light(s.x + s.w / 2, s.y + s.h - 50, 170, true, true);
    }
    this.light(room.exit.x + room.exit.w / 2, room.exit.y + room.exit.h / 2, 230, false, false);
    if (room.cart) {
      this.cart = prop(ctx, room.cart.sprite);
      loose.addChild(this.cart);
    }
    if (room.cat) {
      const cat = room.cat;
      const awake = ART['room/cat_awake']!;
      this.catSleep = prop(ctx, cat);
      this.catAwake = art(ctx, 'room/cat_awake', cat.x, cat.y + cat.h - awake.h, awake.w, awake.h);
      loose.addChild(this.catSleep, this.catAwake);
    }
    if (room.fan) {
      const { x, y } = room.fan;
      loose.addChild(box(x - 3, CEILING, 6, y - CEILING, '#495374'));
      for (const b of sim.fanBlades) {
        const blade = new Container();
        blade.addChild(art(ctx, 'room/fan_blade', 0, -b.r, b.to + b.r, b.r * 2));
        this.blades.push(blade);
        loose.addChild(blade);
      }
      loose.addChild(art(ctx, 'room/fan_hub', x - 25, y - 25, 50, 50));
    }
    if (room.sign) {
      for (let i = 0; i < 2; i++) {
        const chain = new Segment(box(0, -1, 1, 2, '#9f8c9e'));
        this.chains.push(chain);
        loose.addChild(chain.root);
      }
      this.sign = new Container();
      this.sign.addChild(art(ctx, room.sign.key, -room.sign.w / 2, 0, room.sign.w, room.sign.h));
      loose.addChild(this.sign);
    }
    for (const { glow } of this.lights) loose.addChild(glow);
    const s = room.item.sprite;
    this.item = art(ctx, s.key, 0, 0, s.w, s.h);
    this.leftItem = art(ctx, s.key, 0, 0, s.w, s.h);
    this.subject.addChild(this.sparkle.root, this.item, this.human.root);
    this.slurpMask.renderable = false;
    loose.addChild(this.beam.root, this.saucer.root, this.slurpMask, this.subject, this.leftItem, this.delivery.world);
    for (let i = 0; i < 3; i++) {
      const dot = new Graphics().ellipse(0, 0, 3 + i * 2.2, 2.6 + i * 1.9).fill(BUBBLE).stroke({ color: '#8b7597', width: 2 });
      dot.alpha = 0.93;
      this.trail.push(dot);
      loose.addChild(dot);
    }
    this.dream.alpha = 0.93;
    this.dream.addChild(new Graphics().ellipse(0, 0, 36, 29).fill(BUBBLE).stroke({ color: '#8b7597', width: 2.5 }));
    for (const key of DREAMS) {
      const icon = art(ctx, key, -30, -25, 60, 50);
      this.dreams.push(icon);
      this.dream.addChild(icon);
    }
    loose.addChild(this.dream, this.snore.root, this.speech.root, this.bang.root, this.turnTell.root, this.reticle.root, this.particles, this.souvenir.root, this.pop.root);
    this.restart.sync(RESTART, tr().common.restart, false);
    this.root.addChild(ScreenTint.vignette(), this.alarmTint, this.delivery.flash, this.meter, this.timer, this.restart, this.turns.root, this.prompt, this.snooze.root, this.failure.root);
  }

  sync(): void {
    const { sim, ctx, input } = this;
    const { room, body, elapsed, delivered, slurp } = sim;
    const rm = ctx.reducedMotion;
    const dt = this.lastTime < 0 ? 0 : clamp(ctx.time - this.lastTime, 0, 0.05);
    this.lastTime = ctx.time;
    this.moments(dt);
    const shake = rm ? 0 : sim.shake;
    this.world.position.set(Math.sin(elapsed * 94) * shake * 5, Math.cos(elapsed * 116) * shake * 3);
    const height = clamp((FLOOR - body.chestY) / 560, 0, 1);
    this.floorShadow.place(body.chestX, FLOOR - 3, 96 - height * 40, 13 - height * 5, delivered ? 0 : 0.62 * (1 - height * 0.7));
    this.exit.sync(rm);
    this.hazards();
    for (const { glow, flicker } of this.lights) {
      glow.alpha = flicker && !rm ? 0.82 + 0.18 * Math.sin(elapsed * 9) * Math.sin(elapsed * 5.3) : 1;
    }
    this.beam.sync(sim, input.dragging, rm);
    this.saucer.sync(ctx.time, input.dragging, rm);

    const p = slurp * slurp;
    const q = this.squash * 0.11;
    const { chestX, chestY } = body;
    this.subject.alpha = 1 - p;
    this.subject.pivot.set(chestX, chestY);
    this.subject.position.set(chestX + (sim.exitX - chestX) * p, chestY + (sim.exitY - chestY) * p);
    this.subject.scale.set(delivered ? 1 - p * 0.83 : 1 + q, delivered ? 1 - p * 0.83 : 1 - q);
    if (delivered) {
      const { x, y, w, h } = room.exit;
      const margin = VIEW_H * (1 - p);
      this.slurpMask.position.set(x - margin, y - margin);
      this.slurpMask.scale.set(w + 2 * margin, h + 2 * margin);
      if (!this.subject.mask) this.subject.mask = this.slurpMask;
    }
    const item = room.item.sprite;
    this.leftItem.visible = delivered && !sim.item.stolen;
    this.item.visible = !this.leftItem.visible;
    const itemView = this.leftItem.visible ? this.leftItem : this.item;
    itemView.position.set(sim.item.x - item.w / 2, sim.item.y - item.h / 2);
    this.sparkle.sync(!sim.item.captured && !delivered, sim.item.x, sim.item.y, item.w, item.h, elapsed, rm); // v4 items
    this.human.sync(body, sim.wake.awake > 0, this.breath());
    this.delivery.sync(sim, rm);
    this.sleepEffects();
    this.reticle.root.visible = !delivered;
    if (delivered) this.turnTell.root.visible = false;
    else {
      const { beamX: x, beamY: y } = body;
      this.turnTell.sync(x, y, input.dragging, input.turn, body.tilt, rm);
      this.reticle.sync(x, y, x, y, input.dragging, false, rm ? 0 : elapsed * 1.4);
    }
    this.particles.visible = this.fx.active > 0;
    if (this.particles.visible) this.particles.sync();
    this.souvenir.sync(this.souvenirHint(), sim.item.x, sim.item.y, sim.item.y - item.h / 2, ctx.time, rm);
    this.pop.sync(this.popX, this.popY, this.popAge, this.popLabel, rm);
    this.alarmTint.strength = this.alarm * (rm ? 0.5 : 0.5 + 0.25 * Math.sin(ctx.time * 9));
    this.hud();
    this.snooze.sync(sim, rm);
    this.failure.sync(sim, rm);
  }

  dispose(): void {
    this.beam.dispose();
  }

  private light(x: number, y: number, r: number, warm: boolean, flicker: boolean): void {
    this.lights.push({ glow: new Glow(lightTexture(warm ? '255,189,104' : '150,170,255', warm ? 0.34 : 0.2), true).place(x, y, r), flicker });
  }

  private hazards(): void {
    const { sim } = this;
    const { elapsed, room } = sim;
    if (this.cart && sim.cart) this.cart.x = sim.cart.x - 5;
    if (this.catSleep && this.catAwake) {
      const awake = sim.catAwake > 0;
      this.catAwake.visible = awake;
      this.catSleep.visible = !awake;
      const cat = room.cat!;
      const rise = awake || this.ctx.reducedMotion ? 0 : (0.5 + 0.5 * Math.sin(elapsed * 1.9)) * 2.5;
      this.catSleep.y = cat.y - rise;
      this.catSleep.scale.y = 1 + rise / cat.h;
    }
    for (let i = 0; i < this.blades.length; i++) {
      const sprite = this.blades[i]!;
      const blade = sim.fanBlades[i]!;
      sprite.position.set(blade.x, blade.y);
      sprite.rotation = blade.angle;
    }
    if (this.sign && sim.sign && room.sign) {
      const { x, y, angle } = sim.sign;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const anchor = room.sign.w / 2 - 15;
      this.chains[0]!.sync(x - anchor, CEILING, x - anchor * cos - 16 * sin, y - anchor * sin + 16 * cos);
      this.chains[1]!.sync(x + anchor, CEILING, x + anchor * cos - 16 * sin, y + anchor * sin + 16 * cos);
      this.sign.position.set(x, y);
      this.sign.rotation = angle;
    }
  }

  private sleepEffects(): void {
    const { body, snoreFx, mumbleFx, wake, elapsed, delivered } = this.sim;
    const rm = this.ctx.reducedMotion;
    const x = body.x[Joint.Head]!;
    const y = body.y[Joint.Head]!;
    const dreaming = !delivered && wake.awake <= 0 && mumbleFx <= 0;
    this.bang.sync(!delivered && wake.awake > 0, x, y, this.wakeAge, rm);
    this.speech.sync(this.sim.mumble, !delivered && wake.awake <= 0 ? mumbleFx : 0, x, y, 0, 0, rm, this.sim.mumbleFor);
    this.snore.sync(dreaming ? snoreFx : 0, x, y, rm);
    this.dream.visible = dreaming;
    if (!dreaming) {
      this.showTrail(false);
      return;
    }
    const dream = wake.bonks % DREAMS.length;
    if (dream !== this.lastDream) {
      this.lastDream = dream;
      this.dreamPop = 0;
    }
    for (let i = 0; i < this.dreams.length; i++) this.dreams[i]!.visible = i === dream;
    const beside = y < 258;
    const direction = x < VIEW_W / 2 ? 1 : -1;
    const dreamX = clamp(x + (beside ? direction * 92 : 10), 56, VIEW_W - 56);
    const dreamY = clamp(y - (beside ? 22 : 98), CEILING + 31, FLOOR - 65) + (rm ? 0 : Math.sin(elapsed * 1.6) * 2.5);
    this.dream.position.set(dreamX, dreamY);
    this.dream.scale.set(rm ? 1 : easeOutBack(this.dreamPop));
    const dx = dreamX - x;
    const dy = dreamY - y;
    const distance = Math.hypot(dx, dy) || 1;
    const to = distance - 31;
    // set once per frame to the final value: a visible flip rebuilds the render group
    this.showTrail(to >= 43);
    if (to < 43) return;
    for (let i = 0; i < this.trail.length; i++) {
      const k = (39 + (to - 39) * ((i + 0.6) / 3.2)) / distance;
      this.trail[i]!.position.set(x + dx * k, y + dy * k);
    }
  }

  private showTrail(on: boolean): void {
    for (const dot of this.trail) dot.visible = on;
  }

  private hud(): void {
    const { wake, elapsed, body, delivered } = this.sim;
    const { input, ctx } = this;
    const second = Math.floor(elapsed);
    if (second !== this.lastSecond) {
      this.lastSecond = second;
      const clock = Math.floor(second / 60) + ':' + String(second % 60).padStart(2, '0');
      this.timer.sync(318, HUD_ROW.y, 96, HUD_ROW.h, clock);
    }
    const m = this.meterState;
    const ab = tr().abduct;
    m.label = body.gripActive ? ab.holdingOn : wake.awake > 0 ? ab.awake : ab.wake;
    m.value = wake.value / 100;
    m.alarm = wake.awake > 0;
    m.flash = this.meterFlash;
    m.t = ctx.time;
    m.reduced = ctx.reducedMotion;
    this.meter.sync(14, HUD_ROW.y, 296, HUD_ROW.h, m);
    this.turns.sync(input.turn, !delivered);
    const tip = body.gripActive ? ab.shakeGrip : input.tutorial ? ab.pointBeam : this.souvenirHint() ? ab.souvenirHint : input.hint;
    this.prompt.visible = !!tip;
    if (tip) this.prompt.sync(VIEW_W / 2, 909, 54, tip, body.gripActive || tip === ab.souvenirHint ? 20 : 21,
      body.gripActive ? 'shake' : 'drag', ctx.time, ctx.reducedMotion, 480);
  }

  /**
   * Training rooms (this view only draws levels 1 and 2): after the first lift, point out the loose
   * item until it is grabbed or the hint times out.
   */
  private souvenirHint(): boolean {
    const { sim } = this;
    if (this.firstMoveAt < 0 || sim.item.captured || sim.delivered || sim.failure || sim.body.gripActive) return false;
    const since = sim.elapsed - this.firstMoveAt;
    return since >= SOUVENIR_HINT.delay && since < SOUVENIR_HINT.delay + SOUVENIR_HINT.seconds;
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
    if (this.firstMoveAt < 0 && sim.moved) this.firstMoveAt = sim.elapsed;
    if (this.popAge > 0) this.popAge = this.popAge + dt < POP_SECONDS ? this.popAge + dt : 0;
    if (sim.itemSeq !== this.seenItem) {
      this.seenItem = sim.itemSeq;
      this.popAge = 0.0001;
      this.popX = sim.item.x;
      this.popY = sim.item.y;
      this.popLabel = souvenirLabel(sim.room.item.name);
      fx.spawn(P_RING, sim.item.x, sim.item.y, 0, 0, 0.4, 56, PC.mint);
      if (!rm) fx.burst(P_TWINKLE, sim.item.x, sim.item.y, 6, 60, 140, 0.5, 7, PC.mint, 0, 3);
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

}
