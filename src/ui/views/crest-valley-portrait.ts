import { Graphics } from 'pixi.js';
import { C } from '../theme';

/** Small, centred face for the L9 dispatch card and flight HUD while the rigs are missing. */
export function crestValleyPortrait(key: string, w: number, h: number): Graphics | null {
  const doc = key === 'human/doc_head';
  const buff = key === 'human/buff_head';
  const marvin = key === 'human/marvin_head';
  if (!doc && !buff && !marvin) return null;
  const face = new Graphics()
    .roundRect(-25, -23, 50, 58, buff ? 12 : 20).fill(marvin ? '#a7684f' : '#dbac87')
    .stroke({ color: C.ink, width: 3 });
  if (doc) {
    face.ellipse(-22, -20, 11, 15).ellipse(18, -23, 14, 12).ellipse(-4, -31, 14, 9).fill('#f2e6d2');
  } else {
    face.ellipse(0, -22, 26, 14).fill(C.ink).ellipse(marvin ? -9 : 8, -28, 16, 8).fill('#594258');
  }
  face.moveTo(-16, 0).lineTo(-7, 0).moveTo(7, 0).lineTo(16, 0)
    .stroke({ color: C.ink, width: 3, cap: 'round' });
  face.ellipse(4, 19, 8, 4).fill('#743f43');
  face.scale.set(w / 70, h / 80);
  return face;
}
