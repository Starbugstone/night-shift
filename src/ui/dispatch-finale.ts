import { Container, Graphics } from 'pixi.js';
import type { Assets, Scene } from '../contracts';
import type { Shell } from '../core/shell';
import { ViewSlot } from '../core/gfx/scene';
import { Label, Paragraph } from '../core/gfx/text';
import { readSeconds } from '../core/read-time';
import { tr } from '../i18n';
import { artSprite } from './views/art';
import { ButtonView } from './views/button';
import { Button } from './widgets';
import { C } from './theme';

export const FINALE_BEAT = 'dispatch2199Finale';

function lettering(text: string, x: number, y: number, width: number, size: number, color: string) {
  return new Label({ size, weight: 850, color }).set(text, x, y, width);
}
function note(text: string, x: number, y: number, width: number, size: number) {
  const p = new Paragraph({ size, lineHeight: size + 6, weight: 700, color: C.paperInk });
  p.setBlock(text, x - width / 2, y, width);
  return p;
}
function face(assets: Assets, key: string, x: number, y: number, size: number, tint: string) {
  const figure = artSprite(assets, key, size, size) ?? new Graphics()
    .ellipse(0, 0, size / 3, size * 0.44).fill(tint).stroke({ color: C.ink, width: 4 })
    .ellipse(-size * 0.1, -4, 5, 8).fill(C.ink).ellipse(size * 0.1, -4, 5, 8).fill(C.ink);
  figure.position.set(x, y);
  return figure;
}
function paper(x: number, y: number, w: number, h: number) {
  return new Graphics().roundRect(x + 4, y + 7, w, h, 8).fill('#232036')
    .roundRect(x, y, w, h, 8).fill('#ecdfc7').stroke({ color: '#ac998e', width: 3 });
}

function porthole() {
  const g = new Graphics().circle(270, 315, 166).fill('#797789').stroke({ color: C.ink, width: 6 })
    .circle(270, 315, 148).fill('#20354a').stroke({ color: '#c4bbc1', width: 5 })
    .moveTo(126, 348).bezierCurveTo(174, 326, 254, 363, 314, 342).quadraticCurveTo(365, 326, 413, 344)
    .arc(270, 315, 146, 0.21, Math.PI - 0.23).closePath().fill('#467586')
    .moveTo(137, 344).bezierCurveTo(198, 326, 241, 360, 312, 342).quadraticCurveTo(365, 327, 407, 342)
    .stroke({ color: '#9abfc0', width: 4 }).moveTo(164, 277).quadraticCurveTo(183, 227, 222, 213)
    .moveTo(171, 296).lineTo(178, 281).stroke({ color: '#7897aa', width: 6, cap: 'round' });
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5;
    const x = 270 + 157 * Math.cos(angle), y = 315 + 157 * Math.sin(angle);
    g.circle(x, y, 4).fill('#ded0b6').moveTo(x - 2, y + 1).lineTo(x + 2, y - 1).stroke({ color: '#675c69', width: 1.5 });
  }
  return g;
}

function parkingWindow() {
  const g = new Graphics().roundRect(34, 121, 472, 280, 23).fill('#777588').stroke({ color: C.ink, width: 5 })
    .roundRect(44, 131, 452, 258, 18).fill('#252d46')
    .poly([48, 312, 140, 249, 401, 249, 493, 311, 493, 374, 480, 383, 60, 383, 48, 374]).fill('#4b5367');
  for (const [x, y, r] of [[76, 178, 2], [151, 154, 3], [395, 176, 3], [462, 158, 2], [115, 213, 2], [341, 144, 2]] as const)
    g.circle(x, y, r).fill('#f6ddbc');
  g.moveTo(69, 369).lineTo(170, 253).moveTo(465, 369).lineTo(370, 253).stroke({ color: '#72798a', width: 3 })
    .ellipse(270, 311, 169, 54).fill('#294b62').stroke({ color: '#86ebbc', width: 8 })
    .ellipse(270, 305, 156, 45).fill('#4394a1').stroke({ color: '#a6dfca', width: 3 });
  for (const [x, y, w] of [[147, 307, 39], [190, 330, 54], [321, 308, 57], [274, 338, 40]] as const)
    g.moveTo(x, y).quadraticCurveTo(x + w / 2, y + 7, x + w, y).stroke({ color: '#a0d9cd', width: 3, cap: 'round' });
  for (const x of [362, 382])
    g.moveTo(x, 314).lineTo(x, 279).bezierCurveTo(x, 266, x + 9, 264, x + 13, 273).stroke({ color: '#d9d0bd', width: 5 });
  return g.moveTo(362, 292).lineTo(382, 292).moveTo(362, 303).lineTo(382, 303).stroke({ color: '#d9d0bd', width: 4 })
    .roundRect(224, 149, 92, 41, 7).fill('#303645').stroke({ color: '#6ca69d', width: 2 });
}

class DispatchFinaleView {
  readonly root = new Container();
  private readonly controls: ButtonView[];
  private readonly panels = [new Container(), new Container(), new Container()];
  private readonly planStamp = new Container();
  private readonly bill = new Container();
  private readonly permit = new Graphics();
  private readonly pension = new Container();
  private readonly parkingName: Label;
  private readonly popAt: number;
  private readonly toast = new Graphics().roundRect(-24, -22, 48, 42, 10).fill('#c68f55')
    .roundRect(-17, -16, 34, 29, 6).fill('#f1ca89');

  constructor(private readonly scene: DispatchFinale) {
    const w = tr().dispatch2199;
    const assets = scene.shell.assets;
    this.popAt = 1.35 + readSeconds(w.bill);
    this.parkingName = lettering('ZIB', 270, 168, 76, 26, C.mint);
    const [desk, port, pool] = this.panels as [Container, Container, Container];
    this.root.addChild(new Graphics().rect(0, 0, 540, 960).fill('#242039')
      .roundRect(16, 100, 508, 701, 20).fill('#414357').stroke({ color: '#747186', width: 4 })
      .rect(18, 370, 504, 420).fill('#594653'));
    desk.addChild(new Graphics().roundRect(50, 144, 440, 200, 20).fill('#303044')
      .moveTo(46, 366).lineTo(494, 366).stroke({ color: '#b08675', width: 6 }), face(assets, 'ui/vrell_portrait', 130, 272, 174, '#aaa289'),
      face(assets, 'ui/zib_portrait', 290, 282, 140, '#8cb771'),
      new Graphics().moveTo(382, 365).quadraticCurveTo(380, 325, 416, 319).lineTo(450, 319)
        .quadraticCurveTo(483, 328, 484, 365).closePath().fill('#514568').stroke({ color: C.ink, width: 4 })
        .poly([412, 322, 450, 322, 435, 355]).fill('#edceab')
        .poly([426, 327, 438, 327, 435, 342, 430, 345]).fill('#ac6479'),
      face(assets, 'flight/pickup_krix_head', 432, 289, 100, '#9889aa'),
      new Graphics().ellipse(417, 300, 5, 7).ellipse(444, 299, 5, 7).fill('#242039')
        .moveTo(427, 316).lineTo(439, 315).stroke({ color: '#242039', width: 2 }),
      paper(43, 375, 250, 300), new Graphics()
        .moveTo(60, 397).lineTo(130, 397).lineTo(156, 414).lineTo(272, 393)
        .moveTo(60, 406).lineTo(128, 406).lineTo(153, 424).lineTo(272, 402)
        .stroke({ color: '#899b97', width: 2 }));
    this.planStamp.addChild(new Graphics().roundRect(65, 417, 206, 46, 4).stroke({ color: '#994758', width: 4 }),
      lettering(w.void, 168, 441, 190, 24, '#933f51'));
    desk.addChild(this.planStamp, new Graphics().moveTo(67, 548).lineTo(266, 548).moveTo(67, 612).lineTo(266, 612)
        .stroke({ color: '#ae9c8a', width: 2 }),
      lettering('Zib', 128, 525, 106, 30, '#3a7169'),
      lettering('Vrell', 150, 588, 106, 22, '#4a4561'));
    this.bill.addChild(paper(300, 405, 201, 266), note(w.bill, 400, 427, 169, 20),
      lettering(w.received, 401, 620, 140, 18, '#8e4d53'),
      new Graphics().moveTo(319, 566).lineTo(385, 566).moveTo(319, 577).lineTo(366, 577)
      .stroke({ color: '#bba691', width: 3 }).moveTo(467, 524).lineTo(427, 593).lineTo(422, 602).lineTo(423, 590).lineTo(458, 520).closePath().fill('#534c73'));
    desk.addChild(this.bill);
    this.toast.position.x = 425;
    desk.addChild(new Graphics().moveTo(381, 747).bezierCurveTo(350, 744, 360, 769, 322, 757)
      .stroke({ color: '#31263d', width: 4, cap: 'round' }), this.toast, new Graphics()
      .roundRect(373, 707, 105, 55, 14).fill('#a0b0bd').stroke({ color: C.ink, width: 4 })
      .roundRect(383, 711, 85, 6, 3).fill('#4b4356').moveTo(385, 724).lineTo(424, 724)
      .stroke({ color: '#e3daca', width: 3 }).circle(453, 742, 8).fill('#e4c39c').stroke({ color: '#665365', width: 2 })
      .moveTo(453, 742).lineTo(457, 738).stroke({ color: '#665365', width: 2 })
      .roundRect(475, 724, 12, 7, 3).fill('#65576b').roundRect(381, 759, 13, 7, 3).roundRect(456, 759, 13, 7, 3).fill(C.ink));
    port.addChild(porthole(), paper(62, 504, 418, 233),
      lettering(w.permit, 272, 539, 369, 22, C.paperInk), note(w.transfer, 262, 583, 330, 20),
      new Graphics().moveTo(96, 699).lineTo(307, 699).stroke({ color: '#af9b8e', width: 2 })
        .moveTo(325, 682).bezierCurveTo(350, 675, 373, 674, 418, 651)
        .bezierCurveTo(405, 682, 373, 710, 340, 710).quadraticCurveTo(328, 701, 325, 682).fill('#407f82')
        .moveTo(336, 686).bezierCurveTo(350, 685, 376, 679, 399, 664)
        .moveTo(339, 693).bezierCurveTo(364, 691, 382, 677, 394, 672)
        .moveTo(343, 700).quadraticCurveTo(365, 698, 384, 679).stroke({ color: '#9ac3ba', width: 2.5 })
        .ellipse(322, 699, 3, 2).ellipse(328, 707, 2, 1.5).fill('#689c97'),
      paper(76, 352, 385, 135),
      new Graphics().ellipse(97, 459, 13, 7).ellipse(114, 467, 4, 3).ellipse(436, 377, 9, 5)
        .fill({ color: '#5e9295', alpha: 0.29 }), note(w.note, 268, 379, 345, 25));
    pool.addChild(parkingWindow(), this.parkingName, face(assets, 'flight/saucer_top', 255, 264, 105, C.mint));
    // The sheet travels behind the raised drawer front. The handoff stays to its right.
    pool.addChild(new Graphics().roundRect(41, 470, 236, 213, 10).fill('#555268').stroke({ color: C.ink, width: 5 })
      .roundRect(50, 479, 216, 80, 5).fill('#2e2c42')
      .poly([52, 501, 263, 501, 248, 571, 37, 571]).fill('#373248').stroke({ color: '#9a8c9a', width: 4 })
      .roundRect(49, 619, 218, 55, 5).fill('#676479').stroke({ color: '#373142', width: 3 })
      .roundRect(128, 632, 58, 11, 4).fill('#c0a99c'));
    const stampText = new Paragraph({ size: 18, lineHeight: 20, weight: 850, color: '#803e51', align: 'center' });
    const stampHeight = stampText.setBlock(w.vested, 71, 0, 168);
    const stampBoxH = stampHeight + 12;
    stampText.y = 440;
    const rulingY = 434 + stampBoxH + 8;
    this.pension.addChild(paper(57, 426, 196, 117), new Graphics().roundRect(66, 434, 178, stampBoxH, 4)
      .stroke({ color: '#826263', width: 2 }), stampText,
      new Graphics().moveTo(77, rulingY).lineTo(195, rulingY).moveTo(77, rulingY + 10).lineTo(160, rulingY + 10).stroke({ color: '#af9b8e', width: 3 }));
    pool.addChild(this.pension, new Graphics().roundRect(34, 544, 220, 72, 6).fill('#888195').stroke({ color: C.ink, width: 4 })
      .moveTo(40, 550).lineTo(247, 550).stroke({ color: '#beb2b3', width: 3 })
      .roundRect(75, 562, 139, 34, 3).fill('#dcc7a5').stroke({ color: '#554956', width: 3 })
      .circle(83, 580, 2.5).circle(206, 580, 2.5).fill('#807065'), lettering(w.later, 145, 579, 112, 20, '#443b4c'),
      face(assets, 'ui/vrell_pleased', 432, 474, 116, '#aaa289'), face(assets, 'ui/zib_portrait', 329, 631, 100, '#8cb771'));
    this.permit.moveTo(-15, -30).bezierCurveTo(-31, -72, 29, -73, 17, -31).lineTo(1, 2).closePath()
      .stroke({ color: '#dfb1d3', width: 6 }).roundRect(-4, -1, 9, 11, 2).fill('#bdb5ab')
      .roundRect(-20, 8, 42, 32, 5).fill('#eed3a4').stroke({ color: C.ink, width: 3 })
      .ellipse(0, 23, 12, 5).stroke({ color: '#508d83', width: 3 });
    pool.addChild(this.permit, new Graphics().poly([332, 704, 346, 678, 367, 704]).fill('#ffeacf')
      .roundRect(88, 700, 363, 67, 19).fill('#ffeacf').stroke({ color: C.ink, width: 4 }),
      lettering(w.pool, 270, 733, 329, 29, '#393047'));
    this.controls = [new ButtonView(scene.skip), new ButtonView(scene.next)];
    this.root.addChild(...this.panels, ...this.controls);
    this.sync();
  }
  sync(): void {
    for (const control of this.controls) control.sync();
    for (let i = 0; i < this.panels.length; i++) this.panels[i]!.visible = this.scene.page === i;
    const t = this.scene.shell.ctx.reducedMotion ? Infinity : this.scene.age;
    const stamp = Math.min(1, t * 3);
    this.planStamp.y = -36 * (1 - stamp);
    this.planStamp.alpha = stamp;
    const slide = Math.min(1, Math.max(0, (t - 0.65) * 1.6));
    this.bill.y = (1 - slide) * 24;
    this.bill.alpha = slide;
    this.toast.y = 734 - 32 * Math.min(1, Math.max(0, (t - this.popAt) * 5));
    this.pension.y = 19 * Math.min(1, Math.max(0, t - 1.6));
    const handoff = Math.min(1, Math.max(0, (t - 2.2) * 0.9));
    this.permit.x = 438 - 37 * handoff;
    this.permit.y = 595 + 24 * handoff;
    this.parkingName.alpha = Math.min(1, Math.max(0, t - 2.8));
  }
}

export class DispatchFinale implements Scene {
  page = 0;
  age = 0;
  readonly skip = new Button(24, 838, 187, 82, tr().dispatch2199.skip, 'ghost', 25);
  readonly next = new Button(226, 838, 290, 82, tr().common.next, 'primary', 26);
  private readonly look = new ViewSlot(() => new DispatchFinaleView(this));
  private readonly timings: number[];
  constructor(readonly shell: Shell, private readonly finish: () => void) {
    const w = tr().dispatch2199;
    this.timings = [[w.void, w.bill, w.received], [w.note, w.permit, w.transfer], [w.vested, w.later, w.pool]]
      .map(lines => readSeconds(lines.join(' '), 6, 16));
  }
  get view() { return this.look.get().root; }
  update(dt: number): void {
    this.age += dt;
    const { pointer, audio } = this.shell.ctx;
    if (this.skip.update(pointer, dt, audio)) return this.finish();
    if (!this.next.update(pointer, dt, audio) && this.age < this.timings[this.page]!) return;
    if (this.page === 2) return this.finish();
    this.page++;
    this.age = 0;
    audio.sfx('stamp');
  }
  render(): void { this.look.peek()?.sync(); }
  dispose(): void { this.look.destroy(); }
}
