// L7 cruise code: drawing the swell's tells (src/abduct/swell.ts has the physics).
//
// The camera and the HUD stay level. The tells are a fixed plumb dial in the bottom-right corner
// (needle = the pull right now, amber bead on the side it is about to swing to), soup surfaces that
// tilt with the pull, and an amber chevron over a castor that is about to start rolling. All of it
// reads the same pure functions the simulation collides with; none of it moves a hazard.
import type { Assets } from '../contracts';
import { GLOW, drawGlow, drawSprite } from '../core/fx';
import { hudPanel } from '../ui/hud';
import type { Rect } from './ragdoll';
import type { Building } from './rooms/interior';
import {
  DIAL_SWING, SWELL_TELL, castorHeading, castorTell, findSwell, swellShape, toReversal, type CastorSpec,
} from './swell';

const INK = '#1a162b';
const AMBER = '#ffd081';
const ICE = '#d8ecff';
const BRASS = '#c9a25a';
const BRASS_DARK = '#7a5a2a';
const SOUP = '#e0a45a';
const TAU = Math.PI * 2;

/** Where the dial sits on screen: top right, under the second HUD row (ceilings, not sleepers, live there). */
export const SWELL_DIAL = { x: 458, y: 140, w: 68, h: 85 } as const;

/** The plumb dial (screen space). Drawn whenever the building rolls. */
export function drawSwellDial(g: CanvasRenderingContext2D, building: Building, time: number, assets: Assets, reducedMotion: boolean): void {
  const swell = findSwell(building);
  if (!swell) return;
  const { x, y, w, h } = SWELL_DIAL;
  const shape = swellShape(swell.period, swell.phase, time);
  const soon = toReversal(swell.period, swell.phase, time);
  const img = assets.get('room/plumb_dial');
  if (img) drawSprite(g, img, x, y, w, h);
  else {
    hudPanel(g, x, y, w, h, BRASS);
  }
  const px = x + w / 2;
  const py = y + h * 0.24;
  const r = w * 0.575;
  // the scale: centre tick and the two outer ticks (full roll)
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.strokeStyle = img ? BRASS_DARK : BRASS;
  g.beginPath();
  g.arc(px, py, r, Math.PI / 2 - DIAL_SWING - 0.08, Math.PI / 2 + DIAL_SWING + 0.08);
  g.stroke();
  for (let k = -1; k <= 1; k++) {
    const a = k * DIAL_SWING;
    const sx = Math.sin(a);
    const cy = Math.cos(a);
    g.beginPath();
    g.moveTo(px + sx * (r - 7), py + cy * (r - 7));
    g.lineTo(px + sx * (r + 5), py + cy * (r + 5));
    g.stroke();
  }
  // the amber bead: the roll turns within SWELL_TELL, towards the other outer tick
  if (soon <= SWELL_TELL && Math.abs(shape) > 0.02) {
    const side = shape > 0 ? -1 : 1;
    const a = side * DIAL_SWING;
    const bx = px + Math.sin(a) * (r + 1);
    const by = py + Math.cos(a) * (r + 1);
    const pulse = reducedMotion ? 1 : 0.7 + 0.3 * Math.sin(time * 26);
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.amber, bx, by, 26, 26, 0.8 * pulse);
    g.globalCompositeOperation = 'source-over';
    g.beginPath();
    g.arc(bx, by, 6, 0, TAU);
    g.fillStyle = AMBER;
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = INK;
    g.stroke();
  }
  // the plumb line and bob, hanging the way everything slides
  const a = shape * DIAL_SWING;
  const ex = px + Math.sin(a) * (r - 4);
  const ey = py + Math.cos(a) * (r - 4);
  g.lineWidth = 4;
  g.strokeStyle = INK;
  g.beginPath();
  g.moveTo(px, py);
  g.lineTo(ex, ey);
  g.stroke();
  g.lineWidth = 2;
  g.strokeStyle = ICE;
  g.stroke();
  g.beginPath();
  g.arc(ex, ey, 6.5, 0, TAU);
  g.fillStyle = ICE;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = INK;
  g.stroke();
  g.beginPath();
  g.arc(px, py, 4, 0, TAU);
  g.fillStyle = BRASS;
  g.fill();
  g.stroke();
  // which way it pushes, and how hard: chevrons under the dial
  const n = Math.round(Math.abs(shape) * 3);
  if (n > 0) {
    const dir = shape > 0 ? 1 : -1;
    g.lineWidth = 3;
    g.strokeStyle = ICE;
    for (let k = 0; k < n; k++) {
      const cx = px + dir * (6 + k * 9);
      g.beginPath();
      g.moveTo(cx - dir * 4, y + h + 4);
      g.lineTo(cx + dir * 2, y + h + 10);
      g.lineTo(cx - dir * 4, y + h + 16);
      g.stroke();
    }
  }
  g.lineCap = 'butt';
}

/** Soup surfaces in the building's pots tilt with the pull (world space). */
export function drawSwellSoup(g: CanvasRenderingContext2D, building: Building, time: number, viewX: number, viewY: number, viewW: number, viewH: number): void {
  const swell = findSwell(building);
  if (!swell) return;
  const tilt = -swellShape(swell.period, swell.phase, time) * 0.24;
  for (const room of building.rooms) {
    for (const s of room.decor) {
      if (s.key !== 'room/soup_pot' && s.key !== 'room/porthole') continue;
      if (s.x > viewX + viewW || s.x + s.w < viewX || s.y > viewY + viewH || s.y + s.h < viewY) continue;
      const cx = s.x + s.w / 2;
      if (s.key === 'room/soup_pot') {
        // the soup line inside the pot's mouth
        const cy = s.y + 30;
        const half = s.w / 2 - 16;
        g.save();
        g.translate(cx, cy);
        g.rotate(tilt);
        g.fillStyle = SOUP;
        g.globalAlpha = 0.9;
        g.fillRect(-half, -3, half * 2, 9);
        g.globalAlpha = 1;
        g.lineWidth = 2.5;
        g.strokeStyle = '#fff0c8';
        g.beginPath();
        g.moveTo(-half, -3);
        g.lineTo(half, -3);
        g.stroke();
        g.restore();
      } else {
        // the sea through a porthole: a horizon that tilts
        const cy = s.y + s.h / 2;
        const rr = s.w / 2 - 12;
        g.save();
        g.beginPath();
        g.arc(cx, cy, rr, 0, TAU);
        g.clip();
        g.translate(cx, cy);
        g.rotate(tilt);
        g.fillStyle = 'rgba(30,60,70,0.85)';
        g.fillRect(-rr - 4, 4, rr * 2 + 8, rr);
        g.lineWidth = 2;
        g.strokeStyle = ICE;
        g.beginPath();
        g.moveTo(-rr - 4, 4);
        g.lineTo(rr + 4, 4);
        g.stroke();
        g.restore();
      }
    }
  }
}

/** Over a castor: an amber chevron pointing the way it is about to roll. */
export function drawCastorTell(g: CanvasRenderingContext2D, spec: CastorSpec, shape: Rect, time: number, reducedMotion: boolean): void {
  // the lane it rolls in, so its reach reads
  const left = spec.sprite.x - spec.travel;
  const right = spec.sprite.x + spec.sprite.w + spec.travel;
  const floor = shape.y + shape.h + 3;
  g.fillStyle = 'rgba(255,208,129,0.28)';
  g.fillRect(left, floor, right - left, 4);
  g.fillStyle = AMBER;
  g.fillRect(left, floor - 6, 3, 10);
  g.fillRect(right - 3, floor - 6, 3, 10);
  const k = castorTell(spec, time);
  if (k <= 0) return;
  const dir = castorHeading(spec, time);
  const cx = shape.x + shape.w / 2;
  const cy = shape.y - 18 - (reducedMotion ? 0 : Math.sin(time * 18) * 2);
  g.globalAlpha = Math.min(1, 0.35 + k);
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = INK;
  for (let pass = 0; pass < 2; pass++) {
    g.beginPath();
    for (let c = 0; c < 2; c++) {
      const ox = cx + dir * (c * 14 - 4);
      g.moveTo(ox - dir * 7, cy - 9);
      g.lineTo(ox + dir * 3, cy);
      g.lineTo(ox - dir * 7, cy + 9);
    }
    g.stroke();
    g.lineWidth = 2.5;
    g.strokeStyle = AMBER;
  }
  g.globalAlpha = 1;
  g.lineCap = 'butt';
  g.lineJoin = 'miter';
}
