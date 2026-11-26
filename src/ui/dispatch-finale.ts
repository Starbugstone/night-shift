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
    this.parkingName = lettering('ZIB', 270, 186, 155, 28, C.mint);
    const [desk, port, pool] = this.panels as [Container, Container, Container];
    this.root.addChild(new Graphics().rect(0, 0, 540, 960).fill('#242039')
      .roundRect(16, 100, 508, 701, 20).fill('#414357').stroke({ color: '#747186', width: 4 })
      .rect(18, 370, 504, 420).fill('#594653'));
    desk.addChild(face(assets, 'ui/vrell_portrait', 130, 272, 174, '#aaa289'),
      face(assets, 'ui/zib_portrait', 290, 282, 140, '#8cb771'),
      face(assets, 'flight/pickup_krix_head', 432, 289, 100, '#9889aa'),
      new Graphics().ellipse(417, 300, 5, 7).ellipse(444, 299, 5, 7).fill('#242039')
        .moveTo(427, 316).lineTo(439, 315).stroke({ color: '#242039', width: 2 }),
      paper(43, 375, 250, 300));
    this.planStamp.addChild(new Graphics().roundRect(65, 417, 206, 46, 4).stroke({ color: '#994758', width: 4 }),
      lettering(w.void, 168, 441, 190, 24, '#933f51'));
    desk.addChild(this.planStamp, new Graphics().moveTo(67, 548).lineTo(266, 548).moveTo(67, 612).lineTo(266, 612)
        .stroke({ color: '#ae9c8a', width: 2 }),
      lettering('Zib', 128, 525, 106, 30, '#3a7169'),
      lettering('Vrell', 150, 588, 106, 22, '#4a4561'));
    this.bill.addChild(paper(300, 405, 201, 266), note(w.bill, 400, 427, 169, 20),
      lettering(w.received, 401, 620, 140, 18, '#8e4d53'),
      new Graphics().moveTo(467, 524).lineTo(427, 593).lineTo(422, 602).lineTo(423, 590).lineTo(458, 520).closePath().fill('#534c73'));
    desk.addChild(this.bill);
    this.toast.position.x = 425;
    desk.addChild(this.toast, new Graphics().roundRect(381, 709, 90, 53, 10).fill('#99a3ae').stroke({ color: C.ink, width: 3 })
      .roundRect(390, 717, 72, 5, 2).fill('#53505d').circle(452, 741, 6).fill('#d4b888'));
    port.addChild(new Graphics().circle(270, 318, 165).fill('#9b96a8').circle(270, 318, 148).fill('#253d52')
      .ellipse(270, 377, 129, 54).fill('#426477').circle(164, 236, 5).fill('#d2c8b6')
      .circle(378, 234, 5).fill('#d2c8b6'), paper(62, 504, 418, 233),
      lettering(w.permit, 272, 539, 369, 22, C.paperInk), note(w.transfer, 262, 583, 330, 20),
      new Graphics().moveTo(365, 706).quadraticCurveTo(374, 680, 409, 667).quadraticCurveTo(412, 702, 365, 706).fill('#38797b'),
      paper(76, 352, 385, 135),
      new Graphics().ellipse(97, 459, 13, 7).ellipse(114, 467, 4, 3).ellipse(436, 377, 9, 5)
        .fill({ color: '#5e9295', alpha: 0.29 }), note(w.note, 268, 379, 345, 25));
    this.pension.addChild(paper(40, 431, 286, 175), note(w.vested, 183, 456, 245, 23));
    pool.addChild(new Graphics().roundRect(40, 142, 460, 268, 22).fill('#22283d').ellipse(270, 334, 160, 46)
      .fill('#426879').stroke({ color: C.mint, width: 7 }), this.parkingName,
      face(assets, 'flight/saucer_top', 270, 300, 117, C.mint), this.pension, new Graphics().roundRect(53, 551, 255, 54, 8).fill('#777185'),
      lettering(w.later, 181, 580, 225, 22, '#f5dec7'), face(assets, 'ui/vrell_pleased', 389, 507, 114, '#aaa289'),
      this.permit.moveTo(390, 553).quadraticCurveTo(359, 639, 400, 657).quadraticCurveTo(430, 626, 404, 556)
      .stroke({ color: '#c39ad0', width: 7 }).roundRect(375, 640, 55, 38, 6).fill('#e6d09e'),
      face(assets, 'ui/zib_portrait', 102, 687, 103, '#8cb771'), lettering(w.pool, 299, 715, 305, 25, C.mint));
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
    this.bill.x = (1 - slide) * -125;
    this.bill.alpha = slide;
    this.toast.y = 734 - 32 * Math.min(1, Math.max(0, (t - this.popAt) * 5));
    this.pension.y = 19 * Math.min(1, Math.max(0, t - 1.6));
    const handoff = Math.min(1, Math.max(0, (t - 2.2) * 0.9));
    this.permit.x = -193 * handoff;
    this.permit.y = 24 * handoff;
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
