import { tr } from '../i18n';
import { hudButton } from '../ui/hud';
import type { TurnControl } from './turn';

const INK = '#1d1631';
const MINT = '#7CFFCB';
const TELL_HALF = 0.95;

/** Both rotate buttons from the HUD kit; a held one draws pushed in. */
export function drawTurnButtons(g: CanvasRenderingContext2D, turn: TurnControl): void {
  const held = turn.primaryHold + turn.secondHold;
  const label = tr().abduct.turn;
  hudButton(g, turn.buttons.left, 'turn_left', label, held < 0);
  hudButton(g, turn.buttons.right, 'turn_right', label, held > 0);
}

/**
 * The mint turn tell: an arrowed arc outside the reticle ring, pointing the way the body turns.
 * It sits over the specimen's head (`tilt`), so it turns with the body; with reduced motion it
 * stays fixed at the top. Fades out ~0.4 s after turning stops.
 */
export function drawTurnTell(
  g: CanvasRenderingContext2D, x: number, y: number, ringRadius: number,
  turn: TurnControl, tilt: number, reduced: boolean,
): void {
  if (turn.tell <= 0.01 || turn.dir === 0) return;
  const r = ringRadius + 17;
  const mid = (reduced ? 0 : tilt) - Math.PI / 2;
  const a0 = mid - TELL_HALF;
  const a1 = mid + TELL_HALF;
  const end = turn.dir > 0 ? a1 : a0;
  const cos = Math.cos(end);
  const sin = Math.sin(end);
  // tangent in the turning direction, and the outward normal
  const tx = -sin * turn.dir;
  const ty = cos * turn.dir;
  const hx = x + cos * r;
  const hy = y + sin * r;
  g.save();
  g.globalAlpha = Math.min(1, turn.tell * 1.4);
  g.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    g.lineWidth = pass === 0 ? 7 : 3;
    g.strokeStyle = pass === 0 ? INK : MINT;
    g.beginPath();
    g.arc(x, y, r, a0, a1);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(hx + tx * 10, hy + ty * 10);
  g.lineTo(hx - tx * 3 + cos * 7.5, hy - ty * 3 + sin * 7.5);
  g.lineTo(hx - tx * 3 - cos * 7.5, hy - ty * 3 - sin * 7.5);
  g.closePath();
  g.fillStyle = MINT;
  g.lineWidth = 2;
  g.strokeStyle = INK;
  g.lineJoin = 'round';
  g.stroke();
  g.fill();
  g.restore();
}
