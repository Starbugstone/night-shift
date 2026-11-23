// Souvenirs: the loose Earth item in each room (a slipper, a mug) sticks to the specimen when the
// body swings past it. Both views pop a "+1 slipper" label and a sound when it is grabbed; the
// training rooms (levels 1 and 2) also point it out with a hint after the first lift.
import { drawGlow, GLOW } from '../core/fx';
import { C } from '../ui/theme';
import { outlinedText } from '../ui/draw';
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

/** The label rising from where the item was grabbed (world coords); `age` in seconds. */
export function drawSouvenirPop(g: CanvasRenderingContext2D, x: number, y: number, age: number, label: string, reduced: boolean): void {
  if (age <= 0 || age >= POP_SECONDS) return;
  const k = age / POP_SECONDS;
  const pop = reduced ? 1 : Math.min(1, age / 0.12) * (1 + 0.25 * Math.max(0, 1 - age / 0.25));
  g.save();
  g.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
  g.translate(x, y - 40 - (reduced ? 0 : k * 46));
  g.scale(pop, pop);
  outlinedText(g, label, 0, 0, 24, C.mint, C.ink, 900, 'center', 300);
  g.restore();
}

/**
 * While the hint is up: the item glints (a soft mint halo and a turning four-point twinkle) and a
 * bobbing mint chevron points down at it. `cy` is the item's centre, `top` its top edge.
 */
export function drawSouvenirMarker(g: CanvasRenderingContext2D, x: number, cy: number, top: number, time: number, reduced: boolean): void {
  const pulse = reduced ? 0.7 : 0.55 + 0.35 * Math.sin(time * 5);
  g.save();
  g.globalCompositeOperation = 'lighter';
  drawGlow(g, GLOW.mint, x, cy, 46, 46, pulse);
  g.globalCompositeOperation = 'source-over';
  // the glint: a four-point star at the item's shoulder
  const s = 9 + (reduced ? 0 : 3 * Math.sin(time * 7));
  g.translate(x + 14, cy - 8);
  if (!reduced) g.rotate(time * 1.5);
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 ? s * 0.28 : s;
    const a = (i * Math.PI) / 4;
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.fillStyle = '#ffffff';
  g.fill();
  g.restore();

  const bob = reduced ? 0 : Math.sin(time * 6) * 6;
  const y = top - 16 + bob;
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x - 18, y - 16);
  g.lineTo(x, y);
  g.lineTo(x + 18, y - 16);
  g.lineWidth = 12;
  g.strokeStyle = C.ink;
  g.stroke();
  g.lineWidth = 6;
  g.strokeStyle = C.mint;
  g.stroke();
  g.restore();
}
