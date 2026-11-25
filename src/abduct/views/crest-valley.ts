import { Container, Graphics, Sprite } from 'pixi.js';
import type { Assets } from '../../contracts';
import { paintedTexture } from '../../core/gfx/textures';
import { artSprite } from '../../ui/views/art';
import { CrestValleyClockHands } from '../../ui/views/crest-valley-clock';
import { CLOCK_FACE_55, GYM_DOORS_55, TRUNK_55 } from '../rooms/deep-1955';
import type { Room } from '../rooms/layout';

function trunkRim(assets: Assets): Sprite {
  const { key, w, h, x, y } = TRUNK_55;
  const img = assets.get(key);
  const scaleY = h / 194;
  const top = 51 * scaleY;
  const height = Math.ceil(53 * scaleY);
  const texture = paintedTexture(`crest-valley|trunk-rim|${Boolean(img)}|${w}x${h}`, w, height, g => {
    if (img?.complete && img.naturalWidth > 0) {
      g.drawImage(img, 0, -top, w, h);
      return;
    }
    g.scale(1, scaleY);
    g.fillStyle = '#995c61';
    g.fillRect(2, 13, w - 6, 40);
    g.fillStyle = '#d9c7b8';
    g.strokeStyle = '#232437';
    g.lineWidth = 3;
    g.beginPath();
    g.roundRect(14, 3, 316, 12, 3);
    g.fill();
    g.stroke();
  });
  const rim = new Sprite(texture);
  rim.position.set(x, y + top);
  return rim;
}

function clockDial(w: number): Graphics {
  // The original reverse-side art includes hands and braces. Keep its brass rim.
  const face = new Graphics().circle(0, 0, w * 108 / 260).fill('#e5cc9f')
    .stroke({ color: '#594050', width: 2.4 })
    .circle(0, 0, w * 83 / 260).stroke({ color: '#bb9161', width: 1.5 });
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    face.circle(w * 0.38 * Math.cos(a), w * 0.38 * Math.sin(a), i % 3 === 0 ? 4 : 2.3).fill('#594050');
  }
  return face;
}

export class CrestValleyRoomDecor {
  readonly back = new Container();
  readonly front = new Container();
  private readonly clock?: CrestValleyClockHands;
  private readonly panes?: Graphics;

  constructor(assets: Assets, room: Room) {
    if (room.human === 'doc') {
      const { key, x, y, w, h } = CLOCK_FACE_55;
      const plate = new Container();
      plate.position.set(x + w / 2, y + h / 2);
      const rim = artSprite(assets, key, w, h) ?? new Graphics()
        .circle(0, 0, w / 2 - 2).fill('#ffbd68').stroke({ color: '#895e55', width: 7 });
      this.clock = new CrestValleyClockHands(0, 0, w / 82);
      plate.addChild(rim, clockDial(w), this.clock);
      this.back.addChild(plate);
    }
    if (room.human === 'marvin') {
      const { x, y } = GYM_DOORS_55;
      this.panes = new Graphics().rect(25, 44, 54, 78).rect(101, 44, 54, 78).fill('#ffe1bd');
      this.panes.position.set(x, y);
      this.back.addChild(this.panes);
      this.front.addChild(trunkRim(assets));
    }
  }

  sync(elapsed: number, reduced: boolean): void {
    this.clock?.sync(elapsed);
    if (this.panes) this.panes.alpha = reduced ? 0.1 : 0.07 + 0.14 * Math.pow(Math.max(0, Math.cos(elapsed * 4)), 3);
  }
}
