import { Container, Graphics } from 'pixi.js';
import { VIEW_W, type Assets } from '../../contracts';
import { Glow, lightTexture } from '../../core/gfx/glow';
import { Label, Paragraph } from '../../core/gfx/text';
import { readSeconds } from '../../core/read-time';
import { tr } from '../../i18n';
import { artSprite } from '../../ui/views/art';
import type { CameraHazard, HazardField } from '../hazards';
import { PILOT_QUEUE, SNEEZE_SHORTCUT, TRIPOD_LEG } from '../invasion1953';
import { STEWARD_REACH, stewardPose, type StewardHazard } from '../photographer';
import { ConeView, dashedArc, dashedLine } from './tells';
import type { CameraView } from './world';

const edge = { color: '#271e39', width: 3 } as const;
const warm = '#ffc797';

function tripodShape(): Graphics {
  return new Graphics().poly([-90, 11, -119, 53, -86, 59, -56, 28, 54, 27, 102, 63, 123, 57, 88, 17])
    .fill('#a55e54').stroke(edge)
    .ellipse(0, 15, 108, 42).fill('#c77b51').stroke(edge)
    .ellipse(0, 55, 16, 11).fill('#422a3f').stroke(edge)
    .moveTo(44, 30).quadraticCurveTo(2, -8, 26, -43).quadraticCurveTo(24, -66, -18, -38).lineTo(-32, -40)
    .stroke({ color: '#efb386', width: 21, cap: 'round' });
}

function at(root: Container, node: Container, x: number, y: number): Container {
  node.position.set(x, y);
  root.addChild(node);
  return node;
}

/** v4 openings: a parked car joins the evacuation queue at the drive-in's north exit (traffic starts at its nose). */
const DEPART = { x: 1118, y: 1830, run: 130 } as const;

function sign(size: number, color: string): Label {
  return new Label({ size, color, weight: 900, align: 'center' });
}

export class DriveInDetectorView {
  readonly body = new Container();
  readonly detector = new Container();
  readonly speech = new Container();
  private readonly cone: ConeView;
  private readonly warning = new Graphics();
  private readonly pose = new Container();
  private readonly scarf: Container | null;
  private readonly cue = new Label({ size: 24, weight: 900, color: '#fff0c4', outline: '#422e45', outlineW: 4 });
  private readonly bless = sign(22, '#ffebc2');
  private readonly lines = tr().invasion1953;
  private readonly blessFor = readSeconds(this.lines.bless);

  constructor(assets: Assets, private readonly d: CameraHazard) {
    const tripod = d.burst !== undefined;
    this.body.position.set(d.x, d.y);
    this.body.addChild(this.pose);
    this.cone = new ConeView(d.half, d.range, tripod ? '255,198,155' : '218,228,255', 0.83);
    this.detector.addChild(this.cone.root, this.warning);
    this.speech.addChild(this.cue.set(this.lines.inhale, d.x - 43, d.y - 71), this.bless.set(this.lines.bless, 1081, 1748));
    if (tripod) {
      at(this.pose, artSprite(assets, 'flight/invasion_sick_tripod_top') ?? tripodShape(), 20, 35);
      at(this.pose, artSprite(assets, 'flight/invasion_ice_pack') ?? new Graphics().ellipse(0, 0, 24, 13).fill('#aabbe7').stroke(edge), 5, -28);
      this.scarf = at(this.pose, artSprite(assets, 'flight/invasion_scarf') ?? new Graphics()
        .poly([-46, -7, 43, -17, 46, 12, -45, 9]).fill('#7676b2').stroke(edge), 86, -8);
      at(this.pose, new Graphics().ellipse(0, 0, 12, 7).fill('#dfd4e8').stroke(edge), 0, 0);
      const { half, range } = d;
      const dx = range * Math.cos(half);
      const dy = range * Math.sin(half);
      dashedLine(this.warning, 0, 0, dx, -dy, 13, 10);
      dashedLine(this.warning, 0, 0, dx, dy, 13, 10);
      dashedArc(this.warning, range, -half, half, 13, 10).stroke({ color: '#ffc36a', width: 3.5 });
      this.warning.position.set(d.x, d.y);
      this.warning.rotation = d.base;
    } else {
      this.scarf = null;
      at(this.pose, artSprite(assets, 'flight/invasion_projector_top') ?? artSprite(assets, 'flight/worklamp55') ??
        new Graphics().roundRect(-28, -26, 56, 55, 12).fill('#706782').stroke(edge)
          .roundRect(-14, 18, 28, 12, 4).fill('#dcdff1').stroke(edge), 0, -33);
    }
  }

  sync(cam: CameraView, f: HazardField, i: number, hot: number, reduced: boolean): void {
    const { x, y, range, burst } = this.d;
    const near = cam.sees(x, y, range);
    const t = f.t;
    const live = f.on[i] === 1;
    const warn = f.tell[i] === 1;
    const stagger = burst && !reduced ? Math.max(0, 1 - t / 4) ** 2 : 0;
    this.body.visible = cam.sees(x + 535 * stagger, y + 241 * stagger, 155);
    this.detector.visible = near;
    this.cone.root.visible = live;
    this.warning.visible = warn;
    if (near && live) this.cone.sync(x, y, f.a[i]!, hot);
    if (burst) {
      this.pose.position.set(535 * stagger, 241 * stagger);
      this.pose.rotation = reduced ? 0 : Math.sin(t * 13) * stagger * 0.17;
      if (this.scarf) this.scarf.rotation = reduced ? 0 : Math.sin(t * 8) * (warn ? 0.22 : 0.09);
      this.warning.alpha = reduced ? 1 : 0.78 + 0.22 * Math.sin(t * 22) ** 2;
      this.cue.visible = cam.sees(x, y, 140) && (warn || live);
      if (warn || live) this.cue.set(live ? this.lines.sneeze : this.lines.inhale, x - 46, y - 64);
      this.bless.visible = t >= burst.period && t < burst.period + this.blessFor && cam.sees(1081, 1748, 92);
    } else this.speech.visible = false;
  }
}

export class SpectatorView {
  readonly body = new Container();
  readonly detectors = new Container();
  private readonly cone: ConeView;
  private readonly preview: ConeView;
  private readonly next = { x: 0, y: 0, heading: 0, torch: 0 };
  private readonly scratch = { x: 0, y: 0 };

  constructor(assets: Assets, private readonly spec: StewardHazard) {
    this.body.addChild(artSprite(assets, 'flight/invasion_crowd_top') ?? new Graphics()
      .circle(13, -7, 12).circle(-9, 12, 11).circle(-17, -14, 10).fill('#b28389').stroke(edge));
    this.cone = new ConeView(spec.coneHalf, spec.coneRange, '224,218,249', 0.7);
    this.preview = new ConeView(spec.coneHalf, spec.coneRange, '255,193,101', 0.59);
    this.detectors.addChild(this.preview.root, this.cone.root);
  }

  sync(cam: CameraView, f: HazardField, i: number, hot: number): void {
    const x = f.x[i]!;
    const y = f.y[i]!;
    const a = f.a[i]!;
    this.body.visible = cam.sees(x, y, 52);
    this.detectors.visible = cam.sees(x, y, this.spec.coneRange + STEWARD_REACH);
    if (this.body.visible) {
      this.body.position.set(x, y);
      this.body.rotation = a;
    }
    if (!this.detectors.visible) return;
    this.cone.sync(f.x2[i]!, f.y2[i]!, a, hot);
    stewardPose(this.spec, f.routes[i]!, f.t + 0.33, this.next, this.scratch);
    const turn = Math.abs(Math.atan2(Math.sin(this.next.torch - a), Math.cos(this.next.torch - a)));
    this.preview.root.visible = turn > 0.16;
    if (this.preview.root.visible) this.preview.sync(
      this.next.x + Math.cos(this.next.torch) * STEWARD_REACH,
      this.next.y + Math.sin(this.next.torch) * STEWARD_REACH, this.next.torch, 0);
  }
}

export class DriveInScenery {
  readonly root = new Container();
  readonly bubbles = new Container();
  readonly ground = new Container();
  private readonly coop: Container;
  private readonly car: Container;
  private readonly child: Container;
  private readonly screenFrames: Graphics[];
  private readonly applause: Container;
  private collectedAt = -1;

  constructor(assets: Assets) {
    const { x, y } = TRIPOD_LEG;
    const track = new Graphics().moveTo(255, 1300);
    for (const p of SNEEZE_SHORTCUT.slice(0, 3)) track.lineTo(p.x, p.y);
    track.stroke({ color: '#54465c', width: 57, cap: 'round', join: 'round' });
    const markings = new Graphics();
    for (let i = 1; i < SNEEZE_SHORTCUT.length; i++) {
      const a = SNEEZE_SHORTCUT[i - 1]!;
      const b = SNEEZE_SHORTCUT[i]!;
      dashedLine(markings, a.x, a.y, b.x, b.y, 13, 21);
    }
    markings.stroke({ color: '#ad8e82', width: 2.5, cap: 'round' });
    const screenSpill = new Glow(lightTexture('136,149,201', 0.21)).place(900, 1845, 580, 338);
    this.ground.addChild(screenSpill, track, markings, new Graphics()
      .roundRect(271, 1271, 58, 58, 21).stroke({ color: '#8e7582', width: 2.5 })
      .moveTo(225, 1158).lineTo(226, 1293).stroke({ color: '#776373', width: 9 })
      .moveTo(225, 1318).lineTo(222, 1371).stroke({ color: '#776373', width: 9 }));
    for (const yy of [1174, 1203, 1232, 1261, 1289, 1344, 1369]) {
      at(this.ground, new Graphics().circle(0, 0, 6).fill('#ad8a78').stroke(edge), 225, yy);
    }
    at(this.root, artSprite(assets, 'flight/doyle_coop_block_top') ?? new Graphics()
      .roundRect(-31, -13, 61, 27, 4).fill('#937867').stroke(edge), x - 20, y - 54);
    this.coop = at(this.root, artSprite(assets, 'flight/doyle_coop_top') ?? new Graphics()
      .poly([-62, 15, -43, -31, 24, -42, 60, 7, 45, 35, -40, 42]).fill('#89727b').stroke(edge), x - 41, y - 92);
    this.screenFrames = [
      new Graphics().rect(0, 0, 512, 76).fill({ color: '#d8dcf1', alpha: 0.13 }),
      new Graphics().rect(0, 0, 512, 76).fill({ color: '#e3c9b0', alpha: 0.1 }),
      new Graphics().rect(0, 0, 512, 76).fill({ color: '#302a58', alpha: 0.12 }),
    ];
    for (const frame of this.screenFrames) at(this.root, frame, 644, 1991);
    const booth = new Graphics().roundRect(-75, -37, 150, 74, 10).fill('#54465e').stroke(edge)
      .rect(-63, -22, 126, 14).fill('#78698e').moveTo(-65, 15).lineTo(64, 15).stroke({ color: '#b4979b', width: 3 });
    at(this.root, booth, 900, 1401);
    this.applause = at(this.root, new Container(), 1080, 1895);
    for (const [px, py] of [[635, 1927], [755, 1951], [822, 1923], [1062, 1915], [1240, 1889]]) {
      const seated = new Graphics().roundRect(-21, -5, 42, 25, 7).fill('#524165').stroke(edge)
        .circle(0, -8, 12).fill('#927685').stroke(edge);
      const glasses = artSprite(assets, 'flight/invasion_3d_glasses') ??
        new Graphics().roundRect(-14, -4, 28, 8, 2).fill('#f0e2c7').stroke({ color: '#555067', width: 2 });
      at(seated, glasses, 0, -8);
      at(this.root, seated, px!, py!);
    }
    this.applause.addChild(new Graphics().moveTo(-12, 10).lineTo(-28, -13).moveTo(12, 10).lineTo(27, -12)
      .stroke({ color: warm, width: 6, cap: 'round' }));
    const recognition = new Paragraph({ size: 17, color: '#3b3052', weight: 800, lineHeight: 20 });
    const height = recognition.setBlock(tr().humor.deepZib.queue1953[0]!, -148, 0, 296);
    recognition.y = -height / 2;
    const bottom = height / 2 + 12;
    this.bubbles.addChild(new Graphics().roundRect(-165, -bottom, 330, bottom * 2, 17)
      .fill('#fff1d9').stroke(edge).poly([-7, bottom - 1, 3, bottom + 12, 16, bottom - 1]).fill('#fff1d9')
      .moveTo(-7, bottom).lineTo(3, bottom + 12).lineTo(16, bottom).stroke(edge), recognition);
    this.bubbles.visible = false;
    this.child = at(this.root, artSprite(assets, 'flight/invasion_child_clap_top') ?? new Graphics()
      .ellipse(0, 7, 15, 11).fill('#7775a6').stroke(edge).circle(0, -9, 8).fill('#c79073').stroke(edge), 1130, 1915);
    this.car = at(this.root, artSprite(assets, 'flight/sedan55_top', 58, 106) ?? new Graphics()
      .roundRect(-28, -49, 56, 98, 12).fill('#6b8299').stroke(edge).rect(-21, -24, 42, 42).fill('#413c57'), DEPART.x, DEPART.y); // v4 openings: pulls out for the north exit
    for (let i = 0; i < 3; i++) {
      const parked = new Graphics()
        .moveTo(0, 2).lineTo(-17, 11).moveTo(0, 2).lineTo(16, 12).moveTo(0, 0).lineTo(1, 16)
        .stroke({ color: '#af7a6a', width: 3.5, cap: 'round' })
        .ellipse(0, 0, 14, 4.5).fill('#ae7869').stroke(edge)
        .moveTo(5, 0).quadraticCurveTo(2, -13, -4, -11).stroke({ color: '#cb9a83', width: 4.5, cap: 'round' });
      at(this.root, parked, PILOT_QUEUE.x + i * 39, PILOT_QUEUE.y + 22 - i * 2);
      const pilot = new Graphics()
        .moveTo(-10, -5).lineTo(-17, 8).moveTo(10, -5).lineTo(17, 8).moveTo(0, -6).lineTo(0, -20)
        .stroke({ color: '#bf8c77', width: 5, cap: 'round' })
        .ellipse(0, -2, 13, 10).fill('#72658b').stroke(edge)
        .circle(2, -7, 7).fill('#d5bbac').stroke(edge)
        .roundRect(-8, 2, 16, 10, 3).fill('#4c3d61').stroke(edge)
        .moveTo(-12, 0).lineTo(-5, 6).moveTo(12, 0).lineTo(6, 6).stroke({ color: '#d5bbac', width: 3.5 });
      if (i === 0) pilot.roundRect(-6, 3, 13, 10, 2).fill('#ebd8ae').stroke(edge).moveTo(-3, 7).lineTo(3, 7).stroke(edge);
      at(this.root, pilot, PILOT_QUEUE.x + i * 39, PILOT_QUEUE.y - i * 2);
    }
  }

  sync(cam: CameraView, t: number, reduced: boolean, collected: boolean, exposed: boolean, queueBark: number): void {
    this.bubbles.visible = queueBark > 0 && cam.sees(PILOT_QUEUE.x, PILOT_QUEUE.y, 86);
    if (this.bubbles.visible) {
      const textX = Math.max(cam.x + 176, Math.min(cam.x + VIEW_W - 176, PILOT_QUEUE.x));
      this.bubbles.position.set(textX, PILOT_QUEUE.y - 110);
    }
    if (collected && this.collectedAt < 0) this.collectedAt = t;
    const settle = collected ? (reduced ? 1 : Math.min(1, (t - this.collectedAt) * 3)) : 0;
    this.coop.y = TRIPOD_LEG.y - 92 + settle * 11;
    this.coop.rotation = 0.105 * settle;
    const frame = reduced ? 0 : Math.floor(t * 2.3) % this.screenFrames.length;
    for (let i = 0; i < this.screenFrames.length; i++) this.screenFrames[i]!.visible = i === frame;
    this.child.rotation = reduced ? 0 : 0.12 * Math.sin(t * 10);
    this.applause.alpha = exposed ? 1 : 0.42;
    this.applause.rotation = reduced ? 0 : 0.15 * Math.sin(t * 12);
    this.car.y = DEPART.y - (reduced ? 0 : Math.max(0, Math.min(1, (t - 4) / 6)) * DEPART.run);
  }
}
