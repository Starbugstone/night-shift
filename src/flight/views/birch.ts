import { Container, Graphics } from 'pixi.js';
import { bakeryGate, bakeryLaunch } from '../../levels/deep-birch-bakery';
import { binLid, BIRCH_CUT, birchWatcher } from '../../levels/deep-birch-neighbours';
import type { DeepFlightScene } from '../deep-scene';

export class BirchFlightDecor {
  readonly ground = new Container();
  readonly foreground = new Container();
  private readonly lamp?: Container;
  private readonly flour?: Graphics;
  private readonly page?: Graphics;

  constructor(private readonly scene: DeepFlightScene) {
    if (scene.level.id === 'birch_bakery') {
      const lamp = this.lamp = new Container();
      lamp.position.set(bakeryGate.x, bakeryGate.y);
      lamp.addChild(new Graphics().roundRect(-15, -11, 27, 22, 5).fill('#36344c')
        .stroke({ color: '#19132c', width: 3 }).roundRect(4, -8, 11, 16, 4).fill('#f4c593'));
      const flour = this.flour = new Graphics().ellipse(0, 6, 10, 9).ellipse(0, -4, 7, 9)
        .ellipse(-11, -1, 3, 7).ellipse(-5, -11, 3, 8).ellipse(2, -15, 3, 8)
        .ellipse(9, -11, 3, 7).ellipse(14, -5, 3, 6).fill('#f1dbb1');
      flour.position.set(bakeryGate.x + 40, bakeryGate.y + 10);
      flour.rotation = 0.4;
      flour.visible = false;
      this.foreground.addChild(lamp, flour);
      // The west verge round the gate light, from the Main Street turn up Birch Lane (2026-11-26 openings).
      this.ground.addChild(new Graphics().moveTo(bakeryLaunch.x - 20, bakeryLaunch.y - 70).lineTo(140, bakeryLaunch.y - 160).lineTo(140, 920)
        .stroke({ color: '#959582', width: 4, alpha: 0.55, join: 'round' }));
    } else {
      const wall = new Graphics();
      for (const [from, to] of [[82, 220], [425, 655], [785, 1015], [1220, 1358]] as const) {
        wall.roundRect(from, 1297, to - from, 16, 3).fill('#a98787')
          .stroke({ color: '#40394c', width: 3 });
        for (let x = from + 18; x < to; x += 24) wall.moveTo(x, 1299).lineTo(x, 1311);
      }
      wall.stroke({ color: '#694f63', width: 2 });
      // 2026-11-26 openings: the east verge from Birch Lane, then the cut into Len's yard
      // that clears while Mrs. Pruitt looks south (BIRCH_CUT).
      const drives = new Graphics();
      const { from, to } = BIRCH_CUT;
      for (const [ax, ay, bx, by] of [[1620, 1490, 1615, 720], [1615, 720, from.x, from.y], [from.x, from.y, to.x, to.y]]) {
        drives.moveTo(ax!, ay!).lineTo(bx!, by!)
          .stroke({ color: '#5b6571', width: 71, alpha: 0.84, cap: 'round' })
          .moveTo(ax!, ay!).lineTo(bx!, by!)
          .stroke({ color: '#b1a895', width: 3, alpha: 0.72, cap: 'round' });
      }
      const lid = new Graphics().ellipse(2, 9, 36, 15).fill({ color: '#221c36', alpha: 0.56 })
        .ellipse(0, 0, 33, 16).fill('#537eb4').stroke({ color: '#222b47', width: 3 })
        .ellipse(0, -4, 26, 10).stroke({ color: '#91adc8', width: 2 })
        .roundRect(-7, -12, 14, 9, 2).stroke({ color: '#253850', width: 4 });
      lid.position.set(binLid.x, binLid.y);
      lid.rotation = -0.35;
      const binder = new Graphics().roundRect(-17, -8, 34, 17, 3).fill('#835369')
        .stroke({ color: '#2a2036', width: 2 })
        .rect(-14, -6, 12, 12).rect(1, -6, 13, 12).fill('#c7ac96');
      binder.position.set(birchWatcher.x - 25, birchWatcher.y - 9);
      this.page = new Graphics().rect(0, -6, 14, 12).fill('#f7dcb2')
        .moveTo(2, -2).lineTo(11, -2).moveTo(2, 1).lineTo(10, 1).stroke({ color: '#9c7568', width: 1 });
      this.page.position.copyFrom(binder.position);
      this.ground.addChild(drives, wall, lid);
      this.foreground.addChild(binder, this.page);
    }
  }

  sync(t: number, reduced: boolean): void {
    const { sim } = this.scene;
    if (this.lamp && this.flour) {
      const lit = sim.st.porchLit[0]! > 0;
      this.flour.visible = lit;
      const { x, y } = sim.saucer;
      this.lamp.rotation = lit && !reduced ? Math.atan2(y - bakeryGate.y, x - bakeryGate.x) : Math.PI / 2;
    }
    if (this.page) this.page.scale.x = sim.field.tell[0] && !reduced ? Math.cos(t * 14) : 1;
  }
}
