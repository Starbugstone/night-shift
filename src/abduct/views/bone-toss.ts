import { Container, Graphics } from 'pixi.js';
import { VIEW_H, VIEW_W, type Assets } from '../../contracts';
import type { HazardState } from '../interior';
import type { BoneToss } from '../monolith';
import type { Rect } from '../ragdoll';
import { roomArt } from './building';
import { intersects } from './pieces';

export function boneTossView(state: HazardState, spec: BoneToss, assets: Assets) {
  const { sprite, height } = spec;
  const root = new Container();
  const shape = state.shapes[0] as Rect;
  const art = roomArt(assets, sprite.key, sprite.x, sprite.y, sprite.w, sprite.h);
  const apex = sprite.y - height;
  const extent = { x: sprite.x, y: apex, w: sprite.w, h: height + sprite.h };
  const trace = new Graphics();
  const cx = sprite.x + sprite.w / 2;
  for (let y = apex + 9; y < sprite.y; y += 19) trace.moveTo(cx, y).lineTo(cx, y + 6);
  trace.moveTo(sprite.x, apex + 5).lineTo(sprite.x, apex).lineTo(sprite.x + sprite.w, apex)
    .lineTo(sprite.x + sprite.w, apex + 5).stroke({ color: 0xffffff, width: 2.5 });
  const scraps = new Graphics().poly([3,0,15,-7,26,-6,22,-1,32,1,5,4]).fill('#debf9d')
    .poly([49,-2,56,-8,69,-11,74,-6,67,1,56,4]).fill('#efcca4');
  scraps.position.set(sprite.x, sprite.y + sprite.h - 5);
  root.addChild(trace, art, scraps);
  return {
    root,
    sync(_t: number, _rm: boolean, x: number, y: number) {
      root.visible = intersects(extent, x - 12, y - 12, VIEW_W + 24, VIEW_H + 24);
      scraps.visible = state.broken;
      art.visible = trace.visible = !state.broken;
      if (state.broken) return;
      art.y = shape.y;
      trace.tint = state.tell ? 0xffc36a : 0xf2dab8;
      trace.alpha = state.tell ? 0.95 : 0.4;
      art.tint = state.tell ? 0xffc36a : 0xffffff;
    },
  };
}
