import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../../contracts';
import { Label } from '../../core/gfx/text';
import { tr } from '../../i18n';
import { artSprite } from '../../ui/views/art';
import type { AbductSimulation } from '../simulation';

function piece(assets: Assets, key: string, x: number, y: number, fallback: () => Graphics): Container {
  const layer = artSprite(assets, 'room/' + key) ?? fallback();
  layer.position.set(x, y);
  return layer;
}

export class BirchRoomDecor {
  readonly root = new Container();
  private readonly dough?: Container;
  private readonly imprint?: Container;
  private readonly wheel?: Graphics;
  private cleared = false;

  constructor(private readonly sim: AbductSimulation, assets: Assets) {
    const { human, item, roofExit } = sim.room;
    if (human === 'mabel') {
      this.imprint = piece(assets, 'bakery_flour_imprint', 148, 572, () =>
        new Graphics().ellipse(-49, 6, 25, 10).ellipse(15, 2, 56, 12).fill('#dcbda7'));
      this.imprint.visible = false;
      const bowl = piece(assets, 'bakery_dough_bowl', 338, 635, () =>
        new Graphics().ellipse(0, 0, 38, 15).fill('#a36484'));
      this.dough = piece(assets, 'bakery_dough', 338, 614, () =>
        new Graphics().ellipse(0, 0, 32, 15).fill('#e6c997'));
      // a wooden spoon left in the dough, so the bowl reads as baking and not as a pie
      const spoon = new Graphics().moveTo(344, 618).lineTo(381, 576).stroke({ color: '#3a2a3c', width: 7, cap: 'round' })
        .moveTo(344, 618).lineTo(381, 576).stroke({ color: '#c99a62', width: 4, cap: 'round' })
        .ellipse(341, 621, 8, 5).fill('#c99a62').stroke({ color: '#3a2a3c', width: 2 });
      const keys = new Graphics().circle(510, 663, 7).stroke({ color: '#f0cc8a', width: 3 })
        .moveTo(515, 664).lineTo(532, 657).lineTo(533, 662).moveTo(525, 661).lineTo(527, 666)
        .stroke({ color: '#f0cc8a', width: 4 });
      const bag = new Label({ size: 11, weight: 900, color: '#624555' }).set('LARRY', 552, 644, 42);
      this.root.addChild(this.imprint, bowl, spoon, this.dough, keys, bag);
    } else if (human === 'nora') {
      const { x, y } = roofExit ? { x: 685, y: 177 } : item.sprite;
      const note = new Label({ size: 9, weight: 900, color: '#503547' }).set(tr().birch.alarm, x + 24, y + 11, 34);
      const can = new Graphics().roundRect(65, 632, 44, 29, 6).fill('#8198a1').stroke({ color: '#372a46', width: 3 })
        .moveTo(69, 647).quadraticCurveTo(46, 616, 73, 625).moveTo(106, 647).lineTo(125, 627)
        .stroke({ color: '#8198a1', width: 6 });
      this.root.addChild(note, can);
    } else {
      const wheel = this.wheel = new Graphics().circle(0, 0, 36).stroke({ color: '#211e34', width: 7 })
        .circle(0, 0, 31).stroke({ color: '#a4a6ac', width: 2 });
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        wheel.moveTo(0, 0).lineTo(Math.cos(a) * 29, Math.sin(a) * 29);
      }
      wheel.stroke({ color: '#879ba9', width: 2 }).circle(0, 0, 5).fill('#d2a674');
      wheel.position.set(233, 520);
      this.root.addChild(wheel);
    }
  }

  sync(reduced: boolean): void {
    const { elapsed, body } = this.sim;
    if (this.imprint && this.dough) {
      if (!this.cleared && (body.chestY < 478 || body.chestX > 260)) this.cleared = true;
      this.imprint.visible = this.cleared;
      const rise = reduced ? 1 : Math.min(1, (elapsed % 7) / 6.8);
      this.dough.scale.set(0.78 + rise * 0.28, 0.70 + rise * 0.33);
    }
    if (this.wheel) this.wheel.rotation = reduced ? 0 : elapsed * 0.55;
  }
}
