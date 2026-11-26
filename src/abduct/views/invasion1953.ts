import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../../contracts';
import { artSprite } from '../../ui/views/art';

const COUNT = 8;
const LIFE = 1.45;

export class BiscuitDrops {
  readonly root = new Container();
  private readonly drops: { sprite: Container; born: number; x: number; y: number; vx: number }[];
  private lastBonk = 0;

  constructor(assets: Assets) {
    this.drops = Array.from({ length: COUNT }, () => {
      const sprite = artSprite(assets, 'room/invasion_biscuit') ?? new Graphics()
        .roundRect(-10, -6, 20, 12, 4).fill('#daa76e').stroke({ color: '#69475b', width: 2 })
        .circle(-4, -2, 1.4).circle(4, 1, 1.4).fill('#9b704e');
      this.root.addChild(sprite);
      return { sprite, born: -Infinity, x: 0, y: 0, vx: 0 };
    });
  }

  sync(time: number, sequence: number, x: number, y: number, reduced: boolean): void {
    if (sequence !== this.lastBonk) {
      this.lastBonk = sequence;
      const drop = this.drops[sequence % COUNT]!;
      drop.born = time;
      drop.x = x;
      drop.y = y;
      drop.vx = sequence % 2 ? 64 : -57;
    }
    for (const drop of this.drops) {
      const age = time - drop.born;
      const s = drop.sprite;
      s.visible = age < LIFE;
      if (!s.visible) continue;
      const a = reduced ? 0 : age;
      s.position.set(drop.x + a * drop.vx, drop.y - a * 66 + 155 * a * a);
      s.rotation = a * drop.vx / 30;
      s.alpha = Math.min(1, LIFE - age);
    }
  }
}
