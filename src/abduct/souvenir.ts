// Souvenirs: the loose Earth item in each room (a slipper, a mug) sticks to the specimen when the
// body swings past it. Both views pop a "+1 slipper" label and a sound when it is grabbed; the
// training rooms (levels 1 and 2) also point it out with a hint after the first lift.
import { Container, Graphics } from 'pixi.js';
import { GLOW, Glow, glowTexture } from '../core/gfx/glow';
import { Label } from '../core/gfx/text';
import { C } from '../ui/theme';
import { plural, tr } from '../i18n';

/** How long the "+1 slipper" label floats. */
export const POP_SECONDS = 1.4;
/** Training-room hint: starts this long after the first lift and stays up this long (or until grabbed). */
export const SOUVENIR_HINT = { delay: 0.6, seconds: 8 } as const;

/** "+1 slipper" / « +1 chausson », from the report's item names. */
export function souvenirLabel(itemId: string): string {
  const forms = (tr().items as Readonly<Record<string, { one: string; other: string }>>)[itemId];
  return '+' + (forms ? plural(1, forms) : `1 ${itemId}`);
}

/** The label rises from where the item was grabbed, in world coordinates. */
export class SouvenirPop {
  readonly root = new Container();
  private readonly caption = new Label({ size: 24, color: C.mint, outline: C.ink, weight: 900 });

  constructor() {
    this.root.addChild(this.caption);
  }

  sync(x: number, y: number, age: number, label: string, reduced: boolean): void {
    this.root.visible = age > 0 && age < POP_SECONDS;
    if (!this.root.visible) return;
    const k = age / POP_SECONDS;
    const pop = reduced ? 1 : Math.min(1, age / 0.12) * (1 + 0.25 * Math.max(0, 1 - age / 0.25));
    this.caption.set(label, 0, 0, 300);
    this.root.position.set(x, y - 40 - (reduced ? 0 : k * 46));
    this.root.alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    this.root.scale.set(pop);
  }
}

export class SouvenirMarker {
  readonly root = new Container();
  private readonly glow = new Glow(glowTexture(GLOW.mint), true);
  private readonly glint = new Graphics();
  private readonly chevron = new Graphics()
    .moveTo(-18, -16).lineTo(0, 0).lineTo(18, -16).stroke({ color: C.ink, width: 12, join: 'round', cap: 'round' })
    .moveTo(-18, -16).lineTo(0, 0).lineTo(18, -16).stroke({ color: C.mint, width: 6, join: 'round', cap: 'round' });

  constructor() {
    this.glint.moveTo(1, 0);
    for (let i = 1; i < 8; i++) {
      const r = i % 2 ? 0.28 : 1;
      const a = i * Math.PI / 4;
      this.glint.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    this.glint.closePath().fill(0xffffff);
    this.root.addChild(this.glow, this.glint, this.chevron);
  }

  sync(on: boolean, x: number, cy: number, top: number, time: number, reduced: boolean): void {
    this.root.visible = on;
    if (!on) return;
    this.glow.place(x, cy, 46, 46, reduced ? 0.7 : 0.55 + 0.35 * Math.sin(time * 5));
    this.glint.position.set(x + 14, cy - 8);
    this.glint.rotation = reduced ? 0 : time * 1.5;
    this.glint.scale.set(9 + (reduced ? 0 : 3 * Math.sin(time * 7)));
    this.chevron.position.set(x, top - 16 + (reduced ? 0 : Math.sin(time * 6) * 6));
  }
}
