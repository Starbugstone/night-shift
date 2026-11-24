// The camera and HUD stay level. These views read the same roll and reversal as the sim.
import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../contracts';
import { GLOW, Glow, glowTexture } from '../core/gfx/glow';
import { HudPanel } from '../ui/views/hud';
import { artSprite } from '../ui/views/art';
import type { Rect } from './ragdoll';
import type { Building } from './rooms/interior';
import type { Sprite } from './rooms/layout';
import { DIAL_SWING, SWELL_TELL, castorHeading, castorTell, findSwell, swellShape, toReversal, type CastorSpec } from './swell';
import { AMBER, INK, box, disc, intersects } from './views/pieces';

const ICE = '#d8ecff';
const BRASS = '#c9a25a';
const BRASS_DARK = '#7a5a2a';
const SOUP = '#e0a45a';

export const SWELL_DIAL = { x: 458, y: 140, w: 68, h: 85 } as const;
const PIVOT_Y = SWELL_DIAL.h * 0.24;
const R = SWELL_DIAL.w * 0.575;

export class SwellView {
  readonly dial = new Container();
  readonly world = new Container();
  private readonly swell: ReturnType<typeof findSwell>;
  private readonly needle = new Container();
  private readonly warning = new Container();
  private readonly warningGlow = new Glow(glowTexture(GLOW.amber), true);
  private readonly chevrons: Graphics[] = [];
  private readonly surfaces: { sprite: Sprite; tilt: Container; root: Container }[] = [];

  constructor(building: Building, assets: Assets) {
    this.swell = findSwell(building);
    this.dial.visible = !!this.swell;
    if (!this.swell) return;
    const { x, y, w, h } = SWELL_DIAL;
    this.dial.position.set(x, y);
    const face = artSprite(assets, 'room/plumb_dial', w, h);
    if (face) {
      face.anchor.set(0);
      this.dial.addChild(face);
    } else this.dial.addChild(new HudPanel().set(w, h, BRASS));
    const marks = new Graphics().arc(w / 2, PIVOT_Y, R, Math.PI / 2 - DIAL_SWING - 0.08, Math.PI / 2 + DIAL_SWING + 0.08);
    for (let k = -1; k <= 1; k++) {
      const a = k * DIAL_SWING;
      const sx = Math.sin(a);
      const cy = Math.cos(a);
      marks.moveTo(w / 2 + sx * (R - 7), PIVOT_Y + cy * (R - 7)).lineTo(w / 2 + sx * (R + 5), PIVOT_Y + cy * (R + 5));
    }
    marks.stroke({ color: face ? BRASS_DARK : BRASS, width: 3, cap: 'round' });
    this.warning.addChild(this.warningGlow.place(0, 0, 26, 26, 0.8), new Graphics().circle(0, 0, 6).fill(AMBER).stroke({ color: INK, width: 2 }));
    this.needle.position.set(w / 2, PIVOT_Y);
    this.needle.addChild(new Graphics().moveTo(0, 0).lineTo(0, R - 4).stroke({ color: INK, width: 4, cap: 'round' })
      .moveTo(0, 0).lineTo(0, R - 4).stroke({ color: ICE, width: 2, cap: 'round' })
      .circle(0, R - 4, 6.5).fill(ICE).stroke({ color: INK, width: 2 })
      .circle(0, 0, 4).fill(BRASS).stroke({ color: INK, width: 2 }));
    this.dial.addChild(marks, this.warning, this.needle);
    for (let i = 0; i < 3; i++) {
      const arrow = new Graphics().moveTo(-4, -6).lineTo(2, 0).lineTo(-4, 6).stroke({ color: ICE, width: 3, cap: 'round' });
      arrow.y = h + 10;
      this.chevrons.push(arrow);
      this.dial.addChild(arrow);
    }
    for (const room of building.rooms) {
      for (const s of room.decor) {
        if (s.key !== 'room/soup_pot' && s.key !== 'room/porthole') continue;
        const root = new Container();
        const tilt = new Container();
        root.addChild(tilt);
        root.position.set(s.x + s.w / 2, s.key === 'room/soup_pot' ? s.y + 30 : s.y + s.h / 2);
        if (s.key === 'room/soup_pot') {
          const half = s.w / 2 - 16;
          tilt.addChild(box(-half, -3, half * 2, 9, SOUP, 0.9),
            new Graphics().moveTo(-half, -3).lineTo(half, -3).stroke({ color: '#fff0c8', width: 2.5 }));
        } else {
          const r = s.w / 2 - 12;
          const mask = disc(r);
          root.addChild(mask);
          tilt.mask = mask;
          tilt.addChild(box(-r - 4, 4, 2 * r + 8, r, '#1e3c46', 0.85),
            new Graphics().moveTo(-r - 4, 4).lineTo(r + 4, 4).stroke({ color: ICE, width: 2 }));
        }
        this.world.addChild(root);
        this.surfaces.push({ sprite: s, root, tilt });
      }
    }
  }

  sync(time: number, rm: boolean, cx: number, cy: number, vw: number, vh: number): void {
    const s = this.swell;
    if (!s) return;
    const shape = swellShape(s.period, s.phase, time);
    const soon = toReversal(s.period, s.phase, time);
    const dir = shape > 0 ? 1 : -1;
    this.needle.rotation = -shape * DIAL_SWING;
    this.warning.visible = soon <= SWELL_TELL && Math.abs(shape) > 0.02;
    if (this.warning.visible) {
      const a = -dir * DIAL_SWING;
      this.warning.position.set(SWELL_DIAL.w / 2 + Math.sin(a) * (R + 1), PIVOT_Y + Math.cos(a) * (R + 1));
      this.warningGlow.alpha = 0.8 * (rm ? 1 : 0.7 + 0.3 * Math.sin(time * 26));
    }
    const n = Math.round(Math.abs(shape) * 3);
    for (let i = 0; i < this.chevrons.length; i++) {
      const arrow = this.chevrons[i]!;
      arrow.visible = i < n;
      arrow.x = SWELL_DIAL.w / 2 + dir * (6 + i * 9);
      arrow.scale.x = dir;
    }
    for (const { sprite, root, tilt } of this.surfaces) {
      root.visible = intersects(sprite, cx, cy, vw, vh);
      if (root.visible) tilt.rotation = -shape * 0.24;
    }
  }
}

export class CastorTellView {
  readonly root = new Container();
  private readonly lane = new Container();
  private readonly arrows = new Graphics();

  constructor(private readonly spec: CastorSpec) {
    const w = spec.sprite.w + spec.travel * 2;
    this.lane.x = spec.sprite.x - spec.travel;
    this.lane.addChild(box(0, 0, w, 4, '#ffd081', 0.28), box(0, -6, 3, 10, AMBER), box(w - 3, -6, 3, 10, AMBER));
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 2; i++) {
        const x = i * 14 - 4;
        this.arrows.moveTo(x - 7, -9).lineTo(x + 3, 0).lineTo(x - 7, 9);
      }
      this.arrows.stroke({ color: pass ? AMBER : INK, width: pass ? 2.5 : 5, join: 'round', cap: 'round' });
    }
    this.root.addChild(this.lane, this.arrows);
  }

  sync(shape: Rect, time: number, rm: boolean): void {
    this.lane.y = shape.y + shape.h + 3;
    const k = castorTell(this.spec, time);
    this.arrows.visible = k > 0;
    if (!this.arrows.visible) return;
    this.arrows.position.set(shape.x + shape.w / 2, shape.y - 18 - (rm ? 0 : Math.sin(time * 18) * 2));
    this.arrows.scale.x = castorHeading(this.spec, time);
    this.arrows.alpha = Math.min(1, 0.35 + k);
  }
}
