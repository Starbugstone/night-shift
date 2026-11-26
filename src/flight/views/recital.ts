import { Container, Graphics } from 'pixi.js';
import { Label, Paragraph } from '../../core/gfx/text';
import { tr } from '../../i18n';
import { artSprite } from '../../ui/views/art';
import type { DeepFlightScene } from '../deep-scene';
import { cameraHeading, RECITAL_LOOKAHEAD, recitalAt } from '../recital';
import { stewardPose, STEWARD_REACH } from '../photographer';
import { dashedArc, dashedLine, sectorPath } from './tells';
import { CameraView } from './world';

function preview(range: number, half: number): Graphics {
  const g = sectorPath(new Graphics(), range, -half, half).fill({ color: '#ffbd64', alpha: 0.075 });
  const x = Math.cos(half) * range, y = Math.sin(half) * range;
  dashedLine(g, 0, 0, x, -y, 13, 9);
  dashedLine(g, 0, 0, x, y, 13, 9);
  return dashedArc(g, range, -half, half, 13, 9).stroke({ color: '#ffba56', width: 3 });
}

/** Decorations read from the same hazard clock as the live sectors. */
export class RecitalView {
  readonly ground = new Container();
  readonly sectors = new Container();
  readonly bubble = new Container();
  coverEars = false;
  private readonly listeners: Container[];
  private readonly previews: Graphics[];
  private readonly lamps = new Container();
  private readonly verse = new Paragraph({ size: 17, weight: 700, color: '#30243e', lineHeight: 22 });
  private readonly predicted = { x: 0, y: 0, heading: 0, torch: 0 };
  private readonly tmp = { x: 0, y: 0 };

  constructor(private readonly s: DeepFlightScene) {
    const assets = s.ctx.assets;
    this.previews = s.sim.field.defs.map(d => {
      const g = d.type === 'camera' ? preview(d.range, d.half) :
        d.type === 'steward' ? preview(d.coneRange, d.coneHalf) : new Graphics();
      this.sectors.addChild(g);
      return g;
    });
    this.listeners = [[660, 1565], [831, 522]].map(([x, y]) => {
      const figure = artSprite(assets, 'flight/recital_listener2199') ?? new Graphics().ellipse(0, 6, 17, 11)
        .fill('#88748b').circle(0, -5, 10).fill('#dbb998');
      figure.position.set(x!, y!);
      this.ground.addChild(figure);
      return figure;
    });
    const sign = new Graphics().rect(811, 1924, 8, 47).rect(982, 1924, 8, 47).fill('#817e86')
      .roundRect(793, 1900, 214, 50, 8).fill('#283a47').stroke({ color: '#d7c48e', width: 4 });
    for (const x of [765, 1035]) {
      const dir = x < 900 ? -1 : 1;
      sign.moveTo(x - dir * 37, 2110).lineTo(x + dir * 27, 2110).moveTo(x + dir * 7, 2090)
        .lineTo(x + dir * 27, 2110).lineTo(x + dir * 7, 2130).stroke({ color: '#ded3af', width: 9, cap: 'round' });
    }
    this.ground.addChild(sign, new Label({ size: 24, weight: 900, color: '#ffe6ab' }).set(tr().dispatch2199.sign, 900, 1924, 198));
    this.ground.addChild(new Graphics().moveTo(1460, 577).lineTo(1280, 667).stroke({ color: '#b7b4a1', width: 4, alpha: 0.8 }));
    for (const [x, y] of [[400, 330], [1510, 287]]) {
      for (let i = 0; i < 5; i++) this.lamps.addChild(new Graphics().circle(x! - 132 + i * 55, y! + 58 - i * 2, 7).fill('#ffd375'));
    }
    this.ground.addChild(this.lamps);
    this.bubble.addChild(new Graphics().roundRect(-167, 0, 334, 103, 15).fill('#f1e4cd')
      .stroke({ color: '#493950', width: 3 }), this.verse);
  }

  sync(cam: CameraView): void {
    const { sim, run } = this.s;
    const f = sim.field;
    const t = f.t, future = t + RECITAL_LOOKAHEAD;
    this.coverEars = false;
    this.lamps.alpha = 0.2 + 0.8 * run.deadlineWarning;
    for (let i = 0; i < f.defs.length; i++) {
      const d = f.defs[i]!, g = this.previews[i]!;
      if (d.type === 'camera') {
        const a = cameraHeading(d, future);
        g.visible = cam.sees(d.x, d.y, d.range) && Math.abs(a - f.a[i]!) > 0.001;
        g.position.set(d.x, d.y);
        g.rotation = a;
        this.coverEars ||= g.visible && recitalAt(d, future, sim.saucer.x, sim.saucer.y);
        const listener = i === 0 ? this.listeners[0] : i === 2 ? this.listeners[1] : undefined;
        if (listener) {
          const slump = recitalAt(d, t, listener.x, listener.y);
          listener.scale.y = slump ? 0.62 : 1;
          listener.rotation = slump ? -0.72 : 0;
        }
      } else if (d.type === 'steward') {
        const p = this.predicted;
        stewardPose(d, f.routes[i]!, future, p, this.tmp);
        g.visible = cam.sees(p.x, p.y, d.coneRange) && Math.abs(Math.sin((p.heading - f.b[i]!) / 2)) > 0.002;
        g.position.set(p.x + STEWARD_REACH * Math.cos(p.torch), p.y + STEWARD_REACH * Math.sin(p.torch));
        g.rotation = p.torch;
      }
    }
    this.bubble.visible = this.s.verseT > 0 && this.s.state === 'fly';
    if (this.bubble.visible) {
      this.bubble.position.set(Math.max(cam.x + 174, Math.min(cam.x + 366, 900)), Math.max(cam.y + 252, Math.min(cam.y + 680, 1260)));
      this.verse.setBlock(this.s.verse, -153, 10, 307);
    }
  }
}
