// Zib in the cockpit, drawn from primitives (no art needed) and animated from `Pilot`
// (src/flight/pilot.ts). Built once; `sync` only moves, rotates, scales and toggles. Local
// coordinates have the dome's centre at the origin and fit inside the glass (radius DOME_R).
import { Container, Graphics } from 'pixi.js';
import { GLOW, glowTexture, Glow } from '../core/gfx/glow';
import { batched } from '../core/gfx/shapes';
import { C } from '../ui/theme';
import type { Pilot, PilotEyes, PilotMouth } from './pilot';

/** Radius of the cockpit glass the pilot sits under. */
export const DOME_R = 33;

const SKIN = '#86d97a';
const SKIN_DARK = '#5aa856';
const INK = C.ink;
const TONGUE = '#ff7aa8';
const MOUTH = '#3a1830';
const BLUSH = '#ff8fb1';

const HEAD_Y = -5;
const WHEEL_Y = 16;
const WHEEL_R = 10;
const SHOULDER_X = 9;
const SHOULDER_Y = 12;
/** Grip angles on the wheel rim at ten-to-two. */
const GRIP_L = -Math.PI * 5 / 6;
const GRIP_R = -Math.PI / 6;
const ARM_LEN = 10;

class Eye {
  readonly root = new Container();
  private readonly white: Graphics;
  private readonly pupil = new Container();
  private readonly spiral = new Container();
  private readonly cross: Graphics;
  private readonly shut: Graphics;
  private readonly squeeze: Graphics;
  private readonly happy: Graphics;
  private readonly lid: Graphics;
  private readonly open = new Container();

  constructor(x: number, y: number, private readonly rx: number, private readonly ry: number, side: 1 | -1) {
    this.root.position.set(x, y);
    this.white = new Graphics().ellipse(0, 0, rx, ry).fill(0xffffff).stroke({ color: INK, width: 1.8 });
    this.pupil.addChild(new Graphics().circle(0, 0, rx * 0.42).fill(INK).circle(-rx * 0.15, -rx * 0.17, rx * 0.14).fill(0xffffff));
    const sp = new Graphics();
    // a three-turn spiral, drawn once and spun
    sp.moveTo(0, 0);
    for (let i = 1; i <= 36; i++) {
      const a = i * 0.52;
      const r = (i / 36) * rx * 0.78;
      sp.lineTo(Math.cos(a) * r, Math.sin(a) * r * (ry / rx));
    }
    sp.stroke({ color: INK, width: 1.4, cap: 'round' });
    this.spiral.addChild(sp);
    const k = rx * 0.55;
    this.cross = new Graphics().moveTo(-k, -k).lineTo(k, k).moveTo(k, -k).lineTo(-k, k).stroke({ color: INK, width: 2.2, cap: 'round' });
    this.shut = new Graphics().moveTo(-rx * 0.9, 0).quadraticCurveTo(0, ry * 0.55, rx * 0.9, 0).stroke({ color: INK, width: 2.2, cap: 'round' });
    // > <  screwed shut
    this.squeeze = new Graphics().moveTo(-side * rx * 0.7, -ry * 0.5).lineTo(side * rx * 0.6, 0).lineTo(-side * rx * 0.7, ry * 0.5)
      .stroke({ color: INK, width: 2.2, cap: 'round', join: 'round' });
    this.happy = new Graphics().moveTo(-rx * 0.85, ry * 0.25).quadraticCurveTo(0, -ry * 0.75, rx * 0.85, ry * 0.25).stroke({ color: INK, width: 2.4, cap: 'round' });
    // heavy upper lid: skin over the top half of the eye
    this.lid = new Graphics().moveTo(-rx - 0.6, 0).arc(0, 0, rx + 0.6, Math.PI, 0).closePath().fill(SKIN_DARK)
      .moveTo(-rx - 0.6, 0).lineTo(rx + 0.6, 0).stroke({ color: INK, width: 1.8, cap: 'round' });
    this.lid.scale.y = ry / rx;
    this.open.addChild(this.white, this.pupil, this.spiral, this.lid);
    this.root.addChild(this.open, this.cross, this.shut, this.squeeze, this.happy);
  }

  sync(mode: PilotEyes, lookX: number, lookY: number, spin: number): void {
    const opened = mode === 'open' || mode === 'wide' || mode === 'spin' || mode === 'lid';
    this.open.visible = opened;
    this.cross.visible = mode === 'x';
    this.shut.visible = mode === 'shut';
    this.squeeze.visible = mode === 'squeeze';
    this.happy.visible = mode === 'happy';
    if (!opened) return;
    const wide = mode === 'wide';
    this.open.scale.set(wide ? 1.22 : 1);
    this.pupil.visible = mode !== 'spin';
    this.spiral.visible = mode === 'spin';
    this.spiral.rotation = spin;
    this.lid.visible = mode === 'lid';
    this.pupil.scale.set(wide ? 0.62 : 1);
    this.pupil.position.set(lookX * this.rx * 0.42, lookY * this.ry * 0.38 + (mode === 'lid' ? this.ry * 0.25 : 0));
  }
}

/** Zib: head, googly eyes, wobbly antennae, a mouth for every mood and both hands on the wheel. */
export class PilotView {
  readonly root = new Container();
  private readonly body = new Container();
  private readonly head = new Container();
  private readonly antL = new Container();
  private readonly antR = new Container();
  // normal blend: an additive 7 px halo between the stalk and the bobble split the saucer's batch
  private readonly tipL = new Glow(glowTexture(GLOW.mint));
  private readonly tipR = new Glow(glowTexture(GLOW.mint));
  private readonly eyeL = new Eye(-6.5, -2.5, 6.6, 7.6, 1);
  private readonly eyeR = new Eye(6.8, -2, 5.3, 6.3, -1);
  private readonly cheekL: Graphics;
  private readonly cheekR: Graphics;
  private readonly mouths: Record<PilotMouth, Container>;
  private readonly tongueTip = new Container();
  private readonly openMouth = new Container();
  private readonly wheel = new Container();
  private readonly armL: Graphics;
  private readonly armR: Graphics;
  private readonly handL: Graphics;
  private readonly handR: Graphics;
  private readonly sweat: Graphics;
  private readonly note: Graphics;
  private readonly stars: Graphics[] = [];
  coverEars = false;
  private mouthOn: PilotMouth = 'tongue';

  constructor() {
    // torso, mostly hidden behind the wheel
    this.body.addChild(new Graphics().ellipse(0, 15, 11, 8).fill(SKIN).stroke({ color: INK, width: 2 }));

    // antennae: a bent stalk and a glowing bobble, pivoting at the scalp
    for (const [ant, tip, x] of [[this.antL, this.tipL, -5.5], [this.antR, this.tipR, 5.5]] as const) {
      ant.position.set(x, -10);
      const stalk = new Graphics().moveTo(0, 0).quadraticCurveTo(x * 0.3, -6, 0, -10.5).stroke({ color: INK, width: 3.6, cap: 'round' })
        .moveTo(0, 0).quadraticCurveTo(x * 0.3, -6, 0, -10.5).stroke({ color: SKIN, width: 1.8, cap: 'round' });
      tip.place(0, -12.5, 7, 7, 0.55);
      ant.addChild(stalk, tip, new Graphics().circle(0, -12.5, 3.3).fill(C.mint).stroke({ color: INK, width: 1.6 }));
    }

    // head: a lumpy wide bulb with a highlight, a button nose and blush
    const skull = new Graphics()
      .ellipse(0, 0, 16, 13.5).fill(SKIN).stroke({ color: INK, width: 2.4 })
      .ellipse(-6, -8, 6, 2.6).fill({ color: 0xffffff, alpha: 0.35 });
    this.cheekL = new Graphics().ellipse(0, 0, 3.4, 2.2).fill({ color: BLUSH, alpha: 0.7 });
    this.cheekR = new Graphics().ellipse(0, 0, 3.4, 2.2).fill({ color: BLUSH, alpha: 0.7 });
    this.cheekL.position.set(-11.5, 4.5);
    this.cheekR.position.set(11.5, 4.5);
    const nose = new Graphics().ellipse(0, 3.6, 2.4, 1.8).fill(SKIN_DARK).stroke({ color: INK, width: 1.2 });

    // mouths
    const tongue = new Container();
    tongue.addChild(new Graphics().moveTo(-5, 0).quadraticCurveTo(0, 2.6, 5, 0).stroke({ color: INK, width: 1.8, cap: 'round' }));
    this.tongueTip.addChild(new Graphics().roundRect(-2.2, -0.5, 4.4, 5.6, 2.2).fill(TONGUE).stroke({ color: INK, width: 1.3 })
      .moveTo(0, 0.8).lineTo(0, 3.4).stroke({ color: '#d14f80', width: 0.9 }));
    tongue.addChild(this.tongueTip);
    const grin = new Container();
    grin.addChild(new Graphics().moveTo(-7.5, -0.5).quadraticCurveTo(0, 10, 7.5, -0.5).closePath().fill(MOUTH).stroke({ color: INK, width: 1.8, join: 'round' })
      .rect(-5.5, -0.3, 11, 2.2).fill(0xffffff)
      .ellipse(0, 5, 3, 1.6).fill(TONGUE));
    this.openMouth.addChild(new Graphics().ellipse(0, 0, 4.2, 4.8).fill(MOUTH).stroke({ color: INK, width: 1.8 })
      .ellipse(0, 2.6, 2.6, 1.6).fill(TONGUE));
    const open = new Container();
    open.addChild(this.openMouth);
    const teeth = new Container();
    teeth.addChild(new Graphics().roundRect(-6.5, -2.6, 13, 5.2, 2).fill(0xffffff).stroke({ color: INK, width: 1.6 })
      .moveTo(-6, 0).lineTo(6, 0).moveTo(-3, -2.4).lineTo(-3, 2.4).moveTo(0, -2.4).lineTo(0, 2.4).moveTo(3, -2.4).lineTo(3, 2.4)
      .stroke({ color: INK, width: 0.9 }));
    const wavy = new Container();
    wavy.addChild(new Graphics().moveTo(-6, 0).quadraticCurveTo(-4.5, -2, -3, 0).quadraticCurveTo(-1.5, 2, 0, 0)
      .quadraticCurveTo(1.5, -2, 3, 0).quadraticCurveTo(4.5, 2, 6, 0).stroke({ color: INK, width: 1.7, cap: 'round' }));
    const whistle = new Container();
    whistle.addChild(new Graphics().circle(2, 0.5, 2).fill(MOUTH).stroke({ color: INK, width: 1.5 }));
    const puff = new Container();
    puff.addChild(new Graphics().moveTo(-2.5, 0.5).lineTo(2.5, 0.5).stroke({ color: INK, width: 1.8, cap: 'round' }));
    this.mouths = { tongue, grin, open, teeth, wavy, whistle, puff };
    const mouth = new Container();
    mouth.position.set(0, 8.2);
    for (const k of Object.keys(this.mouths) as PilotMouth[]) {
      const m = this.mouths[k];
      m.visible = k === this.mouthOn;
      mouth.addChild(m);
    }

    this.head.position.set(0, HEAD_Y);
    this.head.addChild(this.antL, this.antR, skull, this.cheekL, this.cheekR, this.eyeL.root, this.eyeR.root, nose, mouth);
    this.body.addChild(this.head);

    // dizzy stars round the head
    for (let i = 0; i < 3; i++) {
      const s = new Graphics();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + k * Math.PI / 5;
        const r = k % 2 === 0 ? 3.2 : 1.4;
        if (k === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      s.closePath().fill(C.amberHi).stroke({ color: INK, width: 1 });
      this.stars.push(s);
    }

    // sweat drop and a whistled note
    this.sweat = new Graphics().moveTo(0, -3.2).quadraticCurveTo(2.6, 0.6, 0, 2.2).quadraticCurveTo(-2.6, 0.6, 0, -3.2)
      .fill('#bfe8ff').stroke({ color: INK, width: 1.1 });
    this.note = new Graphics().ellipse(0, 0, 2, 1.5).fill(C.mint).moveTo(1.8, 0).lineTo(1.8, -6).lineTo(4.2, -4.6)
      .stroke({ color: C.mint, width: 1.3, cap: 'round', join: 'round' });

    // the steering wheel: rim, three spokes and a horn button
    this.wheel.position.set(0, WHEEL_Y);
    const rim = batched(new Graphics()).circle(0, 0, WHEEL_R).stroke({ color: INK, width: 4.4 }).circle(0, 0, WHEEL_R).stroke({ color: '#a06a4a', width: 2.4 })
      .moveTo(0, 0).lineTo(0, WHEEL_R).moveTo(0, 0).lineTo(-WHEEL_R * 0.87, -WHEEL_R * 0.5).moveTo(0, 0).lineTo(WHEEL_R * 0.87, -WHEEL_R * 0.5)
      .stroke({ color: INK, width: 2 })
      .circle(0, 0, 3).fill(C.amberHi).stroke({ color: INK, width: 1.4 });
    this.wheel.addChild(rim);

    const arm = (): Graphics => new Graphics().roundRect(0, -2.1, ARM_LEN, 4.2, 2.1).fill(SKIN).stroke({ color: INK, width: 1.5 });
    this.armL = arm();
    this.armR = arm();
    const hand = (): Graphics => new Graphics().circle(0, 0, 3.3).fill(SKIN).stroke({ color: INK, width: 1.6 })
      .circle(-1.4, -2.4, 1.4).fill(SKIN).stroke({ color: INK, width: 1 });
    this.handL = hand();
    this.handR = hand();
    this.handR.scale.x = -1;

    this.root.addChild(this.body, this.wheel, this.armL, this.armR, this.handL, this.handR, this.sweat, this.note, ...this.stars);
  }

  sync(p: Pilot, t: number, rm: boolean): void {
    const bx = p.lean * 3.2 + p.shake;
    const by = p.duck * 8 + p.hop;
    this.body.position.set(bx, by);
    this.head.rotation = p.lean * 0.16;
    const sq = p.squash;
    // caught: the long face of a scream
    const long = p.palms * 0.16;
    this.head.scale.set(1 + sq * 0.14 - long * 0.5, 1 - sq * 0.1 + long);
    this.antL.rotation = -0.48 + p.antL;
    this.antR.rotation = 0.48 + p.antR;
    const glow = 0.35 + (rm ? 0 : 0.2 * Math.sin(t * 5));
    this.tipL.alpha = glow;
    this.tipR.alpha = glow;

    this.eyeL.sync(p.eyes, p.lookX, p.lookY, p.spin);
    this.eyeR.sync(p.eyes, p.lookX, p.lookY, -p.spin * 1.3);
    const puff = p.mouth === 'puff' ? 1.7 : 1;
    this.cheekL.scale.set(puff * (1 - sq * 0.35), puff * (1 + sq * 0.25));
    this.cheekR.scale.set(puff * (1 - sq * 0.35), puff * (1 + sq * 0.25));
    this.cheekL.x = -11.5 + sq * 1.5;
    this.cheekR.x = 11.5 - sq * 1.5;

    if (p.mouth !== this.mouthOn) {
      this.mouths[this.mouthOn].visible = false;
      this.mouthOn = p.mouth;
      this.mouths[p.mouth].visible = true;
    }
    this.tongueTip.position.set(p.tongue * 3.2, 0.6);
    this.tongueTip.rotation = p.tongue * 0.35;
    this.openMouth.scale.set(1 - p.palms * 0.15, (0.2 + 0.8 * p.mouthOpen) * (1 + p.palms * 0.5));

    this.wheel.rotation = p.wheel;

    // hands: on the rim at ten-to-two (they turn with the wheel), up in the air, or up the nose
    const up = p.handsUp;
    const pick = p.pick;
    const noseX = bx + Math.sin(this.head.rotation) * -3.6;
    const noseY = by + HEAD_Y + 4.5;
    let lx = Math.cos(GRIP_L + p.wheel) * WHEEL_R;
    let ly = WHEEL_Y + Math.sin(GRIP_L + p.wheel) * WHEEL_R;
    let rx = Math.cos(GRIP_R + p.wheel) * WHEEL_R;
    let ry = WHEEL_Y + Math.sin(GRIP_R + p.wheel) * WHEEL_R;
    const palms = p.palms;
    const wave = rm ? 0 : Math.sin(t * 18) * 1.5 * up;
    lx += (bx - 19 - lx) * up;
    ly += (by - 14 + wave - ly) * up;
    rx += (bx + 19 - rx) * up;
    ry += (by - 14 - wave - ry) * up;
    lx += (bx - 14.5 - lx) * palms;
    ly += (by + HEAD_Y + 5 - ly) * palms;
    rx += (bx + 14.5 - rx) * palms;
    ry += (by + HEAD_Y + 5 - ry) * palms;
    const dig = rm ? 0 : Math.sin(t * 15) * 0.7 * pick;
    lx += (noseX - 2 - lx) * pick;
    ly += (noseY + 3 + dig - ly) * pick;
    if (this.coverEars) {
      lx = bx - 17; rx = bx + 17;
      ly = ry = by + HEAD_Y - 1;
    }
    this.handL.position.set(lx, ly);
    this.handR.position.set(rx, ry);
    this.handL.rotation = pick * -0.6;
    this.reach(this.armL, bx - SHOULDER_X, by + SHOULDER_Y, lx, ly);
    this.reach(this.armR, bx + SHOULDER_X, by + SHOULDER_Y, rx, ry);

    this.sweat.visible = p.sweat >= 0;
    if (this.sweat.visible) {
      this.sweat.position.set(bx + 14, by + HEAD_Y - 8 + p.sweat * 9);
      this.sweat.alpha = 1 - p.sweat * 0.7;
    }
    this.note.visible = p.mouth === 'whistle';
    if (this.note.visible) {
      const k = rm ? 0.5 : (t * 0.9) % 1;
      this.note.position.set(bx + 11 + k * 6, by + HEAD_Y + 6 - k * 14);
      this.note.alpha = rm ? 1 : 1 - k;
    }
    const dizzy = p.mood === 'dizzy';
    for (let i = 0; i < 3; i++) {
      const s = this.stars[i]!;
      s.visible = dizzy;
      if (!dizzy) continue;
      const a = p.stars + i * (Math.PI * 2 / 3);
      s.position.set(bx + Math.cos(a) * 17, by + HEAD_Y - 13 + Math.sin(a) * 4);
      s.rotation = a;
    }
  }

  /** Stretch an arm from its shoulder (sx, sy) to the hand (hx, hy). */
  private reach(arm: Graphics, sx: number, sy: number, hx: number, hy: number): void {
    const dx = hx - sx;
    const dy = hy - sy;
    arm.position.set(sx, sy);
    arm.rotation = Math.atan2(dy, dx);
    arm.scale.x = Math.max(0.2, Math.hypot(dx, dy) / ARM_LEN);
  }
}
