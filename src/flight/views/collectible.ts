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

function dish(): Graphics {
  const g = batched(new Graphics());
  const frame = { color: C.ink, width: 3 } as const;
  g.ellipse(2, 8, 25, 19).fill('rgba(14,10,35,0.45)');
  g.moveTo(-3, 4).lineTo(-18, 17).lineTo(12, 20).closePath().fill('#695a8c').stroke(frame);
  g.ellipse(-2, 1, 24, 16).fill('#777c9e').stroke(frame);
  g.ellipse(-2, -4, 24, 16).fill('#c7cfe6').stroke(frame);
  g.ellipse(-2, -4, 17, 10).fill('#949fbf');
  g.moveTo(-2, -4).lineTo(11, -18).stroke({ color: C.ink, width: 4, cap: 'round' });
  g.circle(11, -18, 4).fill('#e7cb9a').stroke({ color: C.ink, width: 2 });
  g.rotation = -0.45;
  return g;
}

const makeProp: Record<MapCollectibleId, () => Graphics> = { seti_dish: dish };

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
    this.position.set(VIEW_W / 2 - 158, 352);
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
