import { Container, Graphics } from 'pixi.js';
import { panelHighlightPath, panelPath, type PanelLook } from '../../core/gfx/shapes';
import { C } from '../theme';

export function highlightedPanel(g: Graphics, x: number, y: number, w: number, h: number, look: PanelLook, alpha = 0.14): Graphics {
  return panelHighlightPath(panelPath(g, x, y, w, h, look), x, y, w, look.r, alpha);
}

/** A sun whose rays turn round its disc. */
export class SunIcon {
  readonly root = new Container();
  private readonly rays = new Graphics();

  constructor(radius: number, rayStart: number, rayEnd: number) {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const x = Math.cos(a);
      const y = Math.sin(a);
      this.rays.moveTo(x * rayStart, y * rayStart).lineTo(x * rayEnd, y * rayEnd);
    }
    this.rays.stroke({ color: C.amberHi, width: 2, cap: 'round' });
    this.root.addChild(new Graphics().circle(0, 0, radius).fill(C.amberHi), this.rays);
  }

  sync(turn: number): void {
    this.rays.rotation = turn;
  }
}
