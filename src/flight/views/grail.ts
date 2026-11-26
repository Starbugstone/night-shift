import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../../contracts';
import { Label, Paragraph, measure } from '../../core/gfx/text';
import { tr } from '../../i18n';
import { artSprite } from '../../ui/views/art';
import { C } from '../../ui/theme';
import type { DeepFlightScene } from '../deep-scene';
import type { HazardField } from '../hazards';
import { CLOP, COW, END_RUN_RUTS, GRAIL_LAUNCH, NI_KNIGHTS, RABBIT, type GrailHazard } from '../grail';
import { dashedArc, sectorPath } from './tells';
import type { Box } from './clear-of';
import type { CameraView } from './world';

export function grailTerrain(g: CanvasRenderingContext2D): void {
  const stroke = (d: string, color: string, width: number) => {
    g.strokeStyle = color; g.lineWidth = width; g.stroke(new Path2D(d));
  };
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const moat = 'M-120 600Q420 410 540 706T1050 889Q1310 887 1260 665T1860 475';
  stroke(moat, '#756d56', 170); stroke(moat, '#354e55', 156); stroke(moat, '#345e68', 133);
  const roads = [
    'M-120 2068L180 2060L265 1930L265 1210L330 920L330 310H1530L1530 660L1515 1230L1525 1900Q1200 1975 900 2150L774 2057Q610 2010 265 1930',
    'M265 1010H1530', 'M900 2150V310',
  ];
  for (const d of roads) {
    stroke(d, '#504e44', 79); stroke(d, '#766d58', 66); stroke(d, '#716750', 42);
  }
  for (const d of ['M' + END_RUN_RUTS.map(([x, y]) => `${x} ${y}`).join('L'), 'M785 855L1030 930L1010 1090L1190 1010H1370L1530 660']) {
    stroke(d, '#625e4c', 48); stroke(d, '#948169', 29); stroke(d, '#655f4e', 22);
  }
  // Old hoofprints survive between drops so a pilot can identify the landing site while waiting.
  g.fillStyle = '#483d34';
  for (const [x, y] of [[460, 1125], [1010, 1090]] as const) {
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      g.beginPath();
      g.ellipse(x + 77 * Math.cos(angle), y + 69 * Math.sin(angle), 8, 5, angle, 0, 2 * Math.PI);
      g.fill();
    }
  }
  // The empty hitching rail at the west launch, with the coconut halves hung from its reins.
  const { x: lx, y: ly } = GRAIL_LAUNCH;
  for (const x of [lx - 72, lx - 9]) {
    g.fillStyle = '#6b493c'; g.fillRect(x, ly + 55, 9, 39);
  }
  stroke(`M${lx - 71} ${ly + 61}h66`, '#a37c59', 8);
  stroke(`M${lx - 52} ${ly + 64}l6 14m13 -14l-3 13`, '#c6b58e', 2);
  g.restore();
}

export class GrailDetectorView {
  readonly root = new Container();
  private readonly rim: Graphics;
  private readonly tell: Graphics;
  private readonly actor: Container;
  private readonly shadow = new Graphics().ellipse(0, 0, 39, 15).fill({ color: 0x17182b, alpha: 0.46 });
  private readonly gesture = new Graphics();

  constructor(assets: Assets, private readonly d: GrailHazard) {
    const radius = d.type === 'cow' ? COW.radius : d.type === 'squire' ? CLOP.radius : RABBIT.radius;
    const half = d.type === 'rabbit';
    this.tell = dashedArc(new Graphics(), radius, 0, half ? Math.PI : 2 * Math.PI, 13, 9);
    if (half) this.tell.moveTo(-radius, 0).lineTo(radius, 0);
    this.tell.stroke({ color: C.amber, width: 4 });
    this.rim = half ? sectorPath(new Graphics(), radius, 0, Math.PI) : new Graphics().circle(0, 0, radius);
    this.rim.fill({ color: 0xffffff, alpha: 0.10 }).stroke({ color: 0xffffff, width: 3 });
    this.actor = artSprite(assets, 'flight/grail_' + d.type + '_top') ??
      new Graphics().ellipse(0, 0, d.type === 'cow' ? 41 : 17, d.type === 'rabbit' ? 10 : 20)
        .fill(d.type === 'squire' ? '#92a575' : '#f1eadb').stroke({ color: C.ink, width: 3 });
    if (half) this.gesture.ellipse(-3, -13, 4, 12).ellipse(6, -13, 4, 11).fill('#ffeadb').stroke({ color: C.ink, width: 2 });
    if (d.type === 'squire') this.gesture.ellipse(-19, -20, 6, 8).ellipse(19, -20, 6, 8).fill('#a5724a').stroke({ color: C.ink, width: 2 });
    this.root.addChild(this.tell, this.rim, this.shadow, this.actor, this.gesture);
  }

  sync(cam: CameraView, f: HazardField, i: number, hot: number, rm: boolean): void {
    const x = f.x[i]!, y = f.y[i]!, age = f.b[i]!, tell = !!f.tell[i], live = !!f.on[i];
    this.root.position.set(x, y);
    this.root.visible = cam.sees(x, y, 220);
    if (!this.root.visible) return;
    this.tell.visible = tell;
    this.rim.visible = live;
    this.rim.tint = hot ? '#ff5d73' : '#eed8b5';
    this.rim.scale.set(this.d.type === 'squire' ? f.a[i]! / CLOP.radius : 1);
    this.gesture.visible = tell && this.d.type !== 'cow';
    this.shadow.visible = this.d.type === 'cow' && (tell || live);
    if (this.d.type === 'cow') {
      const walk = Math.max(0, age - COW.warning - COW.impact);
      this.actor.visible = tell || live || walk < 1.15;
      this.actor.position.set(rm ? 0 : walk * 85, rm || !tell ? 0 : -150 * (1 - age / COW.warning));
      this.actor.alpha = walk ? Math.max(0, 1 - walk / 1.15) : 1;
      this.shadow.scale.set(tell && !rm ? 0.4 + 0.6 * age / COW.warning : 1);
    } else if (this.d.type === 'squire') {
      this.actor.rotation = age + Math.PI / 2;
      this.actor.y = rm ? 0 : -Math.abs(Math.sin(f.t * 8)) * 3;
      this.gesture.rotation = this.actor.rotation;
    } else {
      this.actor.y = live && !rm ? Math.sin(Math.PI * (age - RABBIT.arm) / RABBIT.lunge) * 88 : 0;
    }
  }
}

export class GrailSpeechView {
  readonly root = new Container();
  private readonly card = new Container();
  private readonly plate = new Graphics();
  private width = 252;
  private height = 60;
  private readonly words = new Paragraph({ size: 17, weight: 750, color: C.paperInk, align: 'center' });
  private readonly board = new Container();
  private line = '';

  constructor() {
    this.card.addChild(this.plate, this.words);
    this.board.position.set(NI_KNIGHTS.x + 2, NI_KNIGHTS.y - 43);
    this.board.addChild(new Graphics().rect(-4, 4, 8, 33).fill('#90654a').roundRect(-47, -12, 94, 26, 4).fill('#e4c68d').stroke({ color: C.ink, width: 2 }),
      new Label({ size: 15, weight: 900, color: C.ink }).set(tr().grail.board, 0, 1, 89));
    this.root.addChild(this.board, this.card);
  }

  sync(s: DeepFlightScene): void {
    const cue = s.run.grail;
    this.board.visible = !!s.sim.collectible?.collectedId;
    this.card.visible = !!cue && cue.until > s.run.elapsed;
    if (!cue || !this.card.visible) return;
    if (cue.text !== this.line) {
      this.line = cue.text;
      this.width = Math.max(72, Math.min(260, measure(this.line, 17, 750) + 28));
      const height = this.words.setBlock(this.line, -this.width / 2 + 12, 0, this.width - 24);
      this.words.y = -height / 2;
      this.height = height + 20;
      this.plate.clear().roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 12)
        .fill(C.paper).stroke({ color: C.ink, width: 3 });
    }
    const pad = this.width / 2 + 6;
    this.card.position.set(Math.max(s.sim.camX + pad, Math.min(s.sim.camX + 540 - pad, cue.x)),
      Math.max(s.sim.camY + 196, Math.min(s.sim.camY + 760, cue.y)));
  }

  avoid(box: Box, cam: CameraView): boolean {
    if (!this.card.visible) return false;
    box.x = this.card.x - cam.x - this.width / 2 - 4;
    box.y = this.card.y - cam.y - this.height / 2 - 4;
    box.w = this.width + 8;
    box.h = this.height + 8;
    return true;
  }
}
