import { Container } from 'pixi.js';
import { Shape, keyOf, panelPath, roundRect } from '../../core/gfx/shapes';
import { Label, type LabelStyle } from '../../core/gfx/text';
import { C } from '../theme';
import type { Button, ButtonKind } from '../widgets';

const KINDS: Record<ButtonKind, number> = { primary: 0, secondary: 1, ghost: 2, amber: 3 };
const looks = new Map<string, LabelStyle>();

/** One shared label look per (size, colour). */
function lookOf(size: number, color: string): LabelStyle {
  const key = size + color;
  let l = looks.get(key);
  if (!l) {
    l = { size, color, weight: 800 };
    looks.set(key, l);
  }
  return l;
}

/** Draws a `Button` (the logic stays in the Button). Call `sync()` each frame. */
export class ButtonView extends Container {
  private readonly body = new Shape();
  private readonly flash = new Shape();
  private readonly caption: Label;
  private fg = '';
  private size = 0;

  constructor(private readonly b: Button) {
    super();
    this.caption = new Label(lookOf(b.size, C.ink));
    this.flash.alpha = 0;
    this.addChild(this.body, this.caption, this.flash);
  }

  sync(): void {
    const b = this.b;
    this.visible = b.visible;
    if (!b.visible) return;
    const push = b.pressedDown ? 4 : 0;
    const { x, w, h } = b;
    const y = b.y + push;
    let fill: string = C.mint;
    let fg: string = C.ink;
    let stroke: string = C.ink;
    if (b.kind === 'secondary') {
      fill = C.panelHi;
      fg = C.mint;
    } else if (b.kind === 'ghost') {
      fill = 'rgba(20,14,50,0.7)';
      fg = C.text;
      stroke = 'rgba(170,160,220,0.6)';
    } else if (b.kind === 'amber') {
      fill = C.amber;
    }
    if (!b.enabled) {
      fill = '#4a4470';
      fg = '#a09bc4';
    }
    const r = Math.min(22, h / 2);
    this.body.draw(keyOf(x, y, w, h, KINDS[b.kind], b.enabled ? 1 : 0), (g) => {
      panelPath(g, x, y, w, h, { fill, r, stroke, lineW: 4, shadow: b.kind === 'ghost' ? 0 : 6 - push });
      if (b.kind === 'primary' && b.enabled) roundRect(g, x + 10, y + 6, w - 20, h * 0.28, h * 0.14).fill('rgba(255,255,255,0.28)');
    });
    // squeeze long labels (French runs longer) instead of spilling past the edges
    if (fg !== this.fg || b.size !== this.size) {
      this.fg = fg;
      this.size = b.size;
      this.caption.restyle(lookOf(b.size, fg));
    }
    this.caption.set(b.label, x + w / 2, y + h / 2 + 1, Math.max(10, w - 20));
    const f = b.flashLevel;
    this.flash.visible = f > 0;
    if (f > 0) {
      this.flash.draw(keyOf(x, y, w, h), (g) => roundRect(g, x, y, w, h, r).fill('#ffffff'));
      this.flash.alpha = f * 0.35;
    }
  }
}
