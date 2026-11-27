import { paintedTexture } from '../core/gfx/textures';
import { gt } from '../i18n';
import { Label } from '../core/gfx/text';
import { batched } from '../core/gfx/shapes';
import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../contracts';
import { artSprite } from '../ui/views/art';
import { C } from '../ui/theme';
import { RING_R } from './sim';
import type { RoamingApe } from './roam';
import { ProgressArc } from './views/tells';

function apeShape(lifting: boolean, reed: boolean): Graphics {
  const g = new Graphics();
  const hand = lifting ? -21 : 11;
  return g.ellipse(-7, 16, 6, 7).ellipse(7, 16, 6, 7).fill('#553d49')
    .ellipse(0, 0, 16, 19).fill(reed ? '#d49283' : '#895e55')
    .ellipse(-19, hand, 7, 11).ellipse(19, hand, 7, 11).fill('#b48667')
    .ellipse(0, -12, 12, 13).fill(reed ? '#946e71' : '#533c47')
    .ellipse(0, -17, 8, 5).fill('#e0ac80');
}

function troopPose(assets: Assets, key: 'flight/ape_roaming' | 'flight/ape_beamed', reed: boolean): Container {
  const sprite = artSprite(assets, key);
  const pose = sprite ?? apeShape(key === 'flight/ape_beamed', reed);
  if (reed) {
    if (sprite) {
      const img = assets.get(key)!;
      // Pixi tint multiplies. Lift the chestnut base before tinting it to Reed's lighter HUD fur.
      sprite.texture = paintedTexture('reed|' + key, sprite.width, sprite.height, (g, w, h) => {
        g.save();
        g.filter = 'brightness(1.55)';
        g.drawImage(img, 0, 0, w, h);
        g.restore();
      });
    }
    pose.tint = 0xe1febc;
  }
  return pose;
}

export class RoamView {
  readonly root = new Container();
  private readonly body: Container;
  private readonly lifted: Container;
  private readonly arc = new ProgressArc(RING_R + 4, 7);
  private readonly ring = batched(new Graphics()).circle(0, 0, RING_R).stroke({ color: C.mint, width: 3 });

  constructor(assets: Assets, private readonly ape: RoamingApe, troopName: string, light: boolean) {
    this.body = troopPose(assets, 'flight/ape_roaming', light);
    this.lifted = troopPose(assets, 'flight/ape_beamed', light);
    const badge = new Label({ size: 15, weight: 800, color: C.mint, outline: C.ink });
    this.root.addChild(this.ring, this.body, this.lifted, this.arc.root, badge.set(gt(troopName), 0, RING_R + 12));
  }

  sync(_i: number, t: number, rm: boolean, active: boolean, fraction: number, locked: boolean, st: number): void {
    const ape = this.ape;
    this.root.position.set(ape.x, ape.y);
    this.body.visible = !locked;
    this.lifted.visible = locked;
    this.ring.alpha = active || locked ? 1 : 0.65;
    this.arc.sync(active && !locked ? fraction : 0);
    if (locked) {
      const k = rm ? 0 : Math.min(1, st / 0.8);
      this.lifted.y = -k * 30;
      this.lifted.scale.set(1 - k * 0.65);
    } else {
      const scratch = !rm && ape.pose === 'scratch' ? Math.sin(t * 19) * 0.14 : 0;
      this.body.rotation = ape.facing + scratch;
      this.body.y = !rm && ape.pose === 'bolt' ? -4 * Math.abs(Math.sin(t * 30)) : 0;
    }
  }
}
