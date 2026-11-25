import { Container, Graphics } from 'pixi.js';
import { VIEW_W, type MapCollectibleId } from '../../contracts';
import { batched } from '../../core/gfx/shapes';
import { Label } from '../../core/gfx/text';
import { fmt, tr } from '../../i18n';
import { C } from '../../ui/theme';
import { HudPanel } from '../../ui/views/hud';
import type { MapCollectible } from '../collectible';
import { RING_R } from '../sim';
import { arc } from './tells';
import type { CameraView } from './world';

const TOAST = { size: 20, color: C.mint, weight: 800 } as const;
export const PICKUP_VIEW_R = RING_R + 16;
const SEGMENTS = 12;

function sparkle(r: number): Graphics {
  return new Graphics().poly([0, -r, r * 0.28, -r * 0.28, r, 0, r * 0.28, r * 0.28,
    0, r, -r * 0.28, r * 0.28, -r, 0, -r * 0.28, -r * 0.28]).fill(C.mint);
}

const FLYER_HDR = { size: 9, color: '#fff8e8', weight: 900 } as const;

function slipperFlyer(): Container {
  const root = new Container();
  const g = batched(new Graphics());
  const frame = { color: C.ink, width: 2.5 } as const;
  // Soft drop shadow on the dark pavement
  g.roundRect(-18, -21, 42, 50, 3).fill('rgba(14,10,35,0.48)');
  // Cream paper sheet with tear-off contact tabs along the bottom (one tab already torn off)
  g.moveTo(-21, -24).lineTo(21, -24).lineTo(21, 25)
    .lineTo(13, 25).lineTo(13, 19).lineTo(11, 19).lineTo(11, 25)
    .lineTo(3, 25).lineTo(3, 19).lineTo(-5, 19).lineTo(-5, 25) // missing middle-left tab
    .lineTo(-13, 25).lineTo(-13, 19).lineTo(-15, 19).lineTo(-15, 25)
    .lineTo(-21, 25).closePath()
    .fill('#fff6dc').stroke(frame);
  // Perforation line above the tear-off tabs
  g.moveTo(-19, 17).lineTo(19, 17).stroke({ color: '#c9ba96', width: 1.5 });
  // Bold crimson LOST banner across the top
  g.roundRect(-17, -18, 34, 11, 2).fill('#d93f56');
  // Doyle's coral-red fuzzy slipper doodle in the centre (matches room/slipper.svg)
  g.moveTo(-14, 1).quadraticCurveTo(-10, -2, -5, 0)
    .lineTo(0, -4).quadraticCurveTo(3, -6, 9, -5).quadraticCurveTo(14, -4, 16, 2)
    .quadraticCurveTo(17, 6, 12, 6).lineTo(-9, 7).quadraticCurveTo(-14, 7, -14, 3).closePath()
    .fill('#dc6866').stroke({ color: C.ink, width: 2 });
  g.moveTo(-11, 1).quadraticCurveTo(-7, -1, -3, 0).lineTo(-4, 3).lineTo(-11, 3).closePath().fill('#594050');
  g.moveTo(2, -2).quadraticCurveTo(6, -4, 10, -2).stroke({ color: '#ebaa89', width: 1.5, cap: 'round' });
  // Tiny scribbled "REWARD" lines under the slipper
  g.moveTo(-12, 11).lineTo(12, 11).moveTo(-8, 14).lineTo(8, 14).stroke({ color: '#6b5c7a', width: 1.8, cap: 'round' });
  // Red thumbtack pinning the flyer at the top centre
  g.circle(0, -23, 4.5).fill('#e6485c').stroke({ color: C.ink, width: 2 });
  g.circle(-1.2, -24.2, 1.3).fill('#ffd8de');
  const header = new Label(FLYER_HDR).set(tr().mapCollectibles.flyerHeader, 0, -12.5, 32);
  root.addChild(g, header);
  root.rotation = -0.14;
  return root;
}

const makeProp: Record<MapCollectibleId, () => Container> = { slipper_flyer: slipperFlyer };

export class MapCollectibleView {
  readonly root = new Container();
  private readonly glint = sparkle(15);
  private readonly lock = new Container();
  private readonly progress: Graphics[] = [];

  constructor(private readonly pickup: MapCollectible) {
    const { id, x, y } = pickup.def;
    this.root.position.set(x, y);
    this.glint.position.set(29, -30);
    this.root.addChild(makeProp[id](), this.glint, this.lock);
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / SEGMENTS;
      const end = angle + 0.39;
      const slot = arc(batched(new Graphics()), PICKUP_VIEW_R - 4, angle, end)
        .stroke({ color: C.ink, width: 8, cap: 'round' });
      const fill = arc(batched(new Graphics()), PICKUP_VIEW_R - 4, angle, end)
        .stroke({ color: C.mint, width: 4, cap: 'round' });
      this.progress.push(fill);
      this.lock.addChild(slot, fill);
    }
  }

  sync(cam: CameraView, t: number, reduced: boolean): void {
    const { x, y } = this.pickup.def;
    // collected or off-screen is a real state change: `visible` (alpha 0 would still batch and draw)
    const show = !this.pickup.collected && cam.sees(x, y, PICKUP_VIEW_R);
    if (this.root.visible !== show) this.root.visible = show;
    if (!show) return;
    this.glint.alpha = reduced ? 0.85 : 0.72 + 0.22 * Math.sin(t * 4);
    const filled = this.pickup.progress * SEGMENTS;
    this.lock.alpha = Math.min(1, filled);
    for (let i = 0; i < SEGMENTS; i++) {
      this.progress[i]!.alpha = 0.25 + 0.75 * Math.max(0, Math.min(1, filled - i));
    }
  }
}

export class MapCollectibleToast extends Container {
  constructor(id: MapCollectibleId) {
    super();
    const words = tr().mapCollectibles;
    const panel = new HudPanel().set(316, 44, C.mint);
    this.position.set(VIEW_W / 2 - 158, 216);
    this.addChild(panel, new Label(TOAST).set(fmt(words.toast, { name: words.items[id].name }), 158, 22, 290));
  }

  sync(remaining: number, reduced: boolean): void {
    this.alpha = reduced ? Number(remaining > 0) : Math.min(1, remaining * 4);
  }
}

export function mapCollectibleMinimapMark(pickup: MapCollectible, scale: number): Graphics {
  const mark = new Graphics().poly([0, -5, 5, 0, 0, 5, -5, 0]).fill(C.mint).stroke({ color: C.ink, width: 1.5 });
  mark.position.set(pickup.def.x * scale, pickup.def.y * scale);
  return mark;
}
