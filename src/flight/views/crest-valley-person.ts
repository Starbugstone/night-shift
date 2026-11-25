import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../../contracts';
import { C } from '../../ui/theme';
import { artSprite } from '../../ui/views/art';
import { figurePose, figureSeed, newFigurePose, type FigureBeat } from '../pickup-pose';
import type { CameraView } from './world';

const BEATS: readonly FigureBeat[] = ['look', 'actA', 'look', 'yawn'];
const SKIN = '#eab593';

export class CrestValleyPerson {
  readonly root = new Container();
  private readonly body = new Container();
  private readonly head = new Container();
  private readonly eyes = new Graphics().ellipse(-5, 0, 2.1, 2.9).ellipse(5, 0, 2.1, 2.9).fill(C.ink);
  private readonly lids = new Graphics().roundRect(-7.1, -0.8, 4.2, 1.6, 0.8)
    .roundRect(2.9, -0.8, 4.2, 1.6, 0.8).fill(C.ink);
  private readonly smile = new Graphics().moveTo(-3, -5).quadraticCurveTo(0, -2, 3, -5)
    .stroke({ color: C.ink, width: 1.6, cap: 'round' });
  private readonly yawn = new Graphics().ellipse(0, -5, 3.2, 3.6).fill('#633b47');
  private readonly pose = newFigurePose();
  private readonly seed: number;

  constructor(assets: Assets, private readonly dancer: boolean, x: number, y: number, mirror = false) {
    this.root.position.set(x, y);
    this.root.scale.x = mirror ? -1 : 1;
    this.seed = figureSeed(`${x},${y}`);
    this.body.position.set(0, -39);
    const key = dancer ? 'flight/dancer55' : 'flight/usher55';
    const coat = dancer ? '#ac7477' : '#4e6376';
    const body = artSprite(assets, key + '_body') ?? new Graphics()
      .ellipse(0, 34, 28, 4).fill({ color: C.ink, alpha: 0.5 })
      .roundRect(-10, 13, 7, 20, 3).roundRect(4, 13, 7, 20, 3).fill(C.ink)
      .roundRect(-16, -9, 32, 32, 6).fill(coat).stroke({ color: C.ink, width: 2.5 });
    const head = artSprite(assets, key + '_head') ?? new Graphics()
      .ellipse(0, -1, 15, 16).fill(SKIN).stroke({ color: C.ink, width: 2.5 })
      .roundRect(-16, -17, 32, 12, 5).fill(dancer ? '#604253' : coat);
    head.position.set(0, -15);
    this.head.y = -2;
    this.eyes.y = this.lids.y = -12;
    this.head.addChild(head, this.eyes, this.lids, this.smile, this.yawn);
    this.body.addChild(body, this.head);
    this.root.addChild(this.body);
  }

  sync(cam: CameraView, time: number, reduced: boolean): void {
    this.root.visible = cam.sees(this.root.x, this.root.y - 39, 45);
    if (!this.root.visible) return;
    const { lid, lookX, yawn, actA } = figurePose(time, this.seed, reduced, this.pose, BEATS);
    this.head.rotation = lookX * 0.12 - yawn * 0.12 + (this.dancer ? 0 : actA * 0.1);
    this.body.y = -39 - (this.dancer ? actA * 2 : 0);
    this.eyes.x = this.lids.x = lookX * 2;
    this.eyes.scale.y = 1 - lid;
    this.eyes.alpha = 1 - lid;
    this.lids.alpha = lid;
    this.smile.alpha = 1 - yawn;
    this.yawn.alpha = yawn;
  }
}
