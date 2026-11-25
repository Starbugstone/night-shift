import { Container, Graphics } from 'pixi.js';
import { TIME_CAR, crestValleyClock } from '../../flight/time-car';

const INK = '#232437';

/** Both clock faces keep local time until the strike. The shift HUD keeps counting. */
export class CrestValleyClockHands extends Container {
  private readonly hour = new Graphics().moveTo(0, 4).lineTo(0, -22)
    .stroke({ color: INK, width: 5, cap: 'round' });
  private readonly minute = new Graphics().moveTo(0, 6).lineTo(0, -32)
    .stroke({ color: INK, width: 3, cap: 'round' });

  constructor(x: number, y: number, scale = 1) {
    super();
    this.position.set(x, y);
    this.scale.set(scale);
    this.addChild(this.hour, this.minute, new Graphics().circle(0, 0, 4).fill(INK));
  }

  sync(elapsed: number): void {
    const clock = crestValleyClock(Math.min(elapsed, TIME_CAR.strike));
    this.hour.rotation = (clock % 43200) * Math.PI / 21600;
    this.minute.rotation = (clock % 3600) * Math.PI / 1800;
  }
}
