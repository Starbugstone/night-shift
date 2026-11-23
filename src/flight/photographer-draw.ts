// L7 cruise code: drawing the deck photographer, the stewards and the radar mast.
//
// The photographer's frame is drawn from the frame the field detects with: amber corner brackets and
// a closing iris while the shutter is coming (nothing sees you yet), then the exact rectangle goes
// solid red-edged for the long exposure. The steward's torch is a hard-edged cone like every other.
import type { Assets } from '../contracts';
import { GLOW, drawGlow, drawSprite } from '../core/fx';
import { C } from '../ui/theme';
import type { ConeSprites } from './draw-common';
import type { HazardField } from './hazards';
import { PHOTO, PhotoPhase, photoPhase, type PhotographerHazard, type StewardHazard } from './photographer';

const TAU = Math.PI * 2;
const RED = '#ff5d73';
const AMBER = C.amber;
const INK = C.ink;
const TORCH = '255,236,190';
const SENSOR_DASH = [4, 10];
const NO_DASH: number[] = [];
const BRACKET = 26;

/** The crew members' bodies (ground layer): photographer facing the frame, steward walking. */
export function drawShipCrew(g: CanvasRenderingContext2D, assets: Assets, f: HazardField, i: number, rm: boolean): void {
  const d = f.defs[i]!;
  const x = f.x[i]!;
  const y = f.y[i]!;
  const key = d.type === 'photographer' ? 'flight/photographer_top' : 'flight/steward_top';
  const size = d.type === 'photographer' ? 50 : 44;
  const face = d.type === 'photographer' ? f.a[i]! : f.b[i]!;
  g.save();
  g.translate(x, y);
  g.rotate(face + Math.PI / 2);
  const img = assets.get(key);
  if (img) drawSprite(g, img, -size / 2, -size / 2, size, size);
  else {
    // shoulders, a cap, and a camera or a torch held out in front
    g.fillStyle = d.type === 'photographer' ? '#5d6a8a' : '#eef0f4';
    g.beginPath();
    g.ellipse(0, 2, 15, 10, 0, 0, TAU);
    g.fill();
    g.lineWidth = 2.5;
    g.strokeStyle = INK;
    g.stroke();
    g.beginPath();
    g.arc(0, 0, 8, 0, TAU);
    g.fillStyle = d.type === 'photographer' ? '#2c2a3a' : '#f8f8ff';
    g.fill();
    g.stroke();
    g.fillStyle = d.type === 'photographer' ? '#1b1433' : '#c9a25a';
    g.fillRect(-6, -19, 12, d.type === 'photographer' ? 10 : 7);
  }
  g.restore();
  if (d.type === 'photographer') {
    // the flash charging on top of the camera while the iris closes
    const tau = f.b[i]!;
    const phase = photoPhase(tau);
    if (phase === PhotoPhase.Iris || phase === PhotoPhase.Expose) {
      const k = phase === PhotoPhase.Iris ? tau / PHOTO.iris : 1;
      const fx = x + Math.cos(face) * 16;
      const fy = y + Math.sin(face) * 16;
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, phase === PhotoPhase.Expose ? GLOW.white : GLOW.amber, fx, fy, 14 + 16 * k, 14 + 16 * k, rm ? 0.7 : 0.5 + 0.5 * k);
      g.globalCompositeOperation = 'source-over';
    }
  }
}

/** A radar mast: the mast top, and a dish that turns with its cones. */
export function drawRadarMast(g: CanvasRenderingContext2D, assets: Assets, x: number, y: number, angle: number): void {
  const img = assets.get('flight/radar_mast_top');
  if (img) drawSprite(g, img, x - 30, y - 30, 60, 60);
  else {
    g.beginPath();
    g.arc(x, y, 16, 0, TAU);
    g.fillStyle = '#8a92a8';
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = INK;
    g.stroke();
  }
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.fillStyle = '#d8dce8';
  g.fillRect(-4, -24, 8, 48);
  g.lineWidth = 2;
  g.strokeStyle = INK;
  g.strokeRect(-4, -24, 8, 48);
  g.restore();
}

/**
 * The photographer's frame. Idle: a faint dotted ring of the range it frames from. Iris: amber
 * brackets on the locked frame, an iris closing on its centre. Expose: the exact rectangle, solid,
 * red-edged, with a flash wash inside.
 */
export function drawPhotoFrame(g: CanvasRenderingContext2D, f: HazardField, i: number, t: number, rm: boolean, hot: number): void {
  const d = f.defs[i] as PhotographerHazard;
  const k = f.photoSlot[i]! * PHOTO.stride;
  const tau = f.b[i]!;
  const phase = photoPhase(tau);
  if (phase === PhotoPhase.Idle || phase === PhotoPhase.Rest) {
    g.setLineDash(SENSOR_DASH);
    g.lineDashOffset = rm ? 0 : -t * 12;
    g.lineWidth = 2;
    g.strokeStyle = 'rgba(255,210,122,0.28)';
    g.beginPath();
    g.arc(d.x, d.y, d.range, 0, TAU);
    g.stroke();
    g.setLineDash(NO_DASH);
    g.lineDashOffset = 0;
    return;
  }
  const fx = f.photo[k + 1]!;
  const fy = f.photo[k + 2]!;
  const x0 = fx - d.halfW;
  const y0 = fy - d.halfH;
  const w = d.halfW * 2;
  const h = d.halfH * 2;
  if (phase === PhotoPhase.Iris) {
    const p = tau / PHOTO.iris;
    // corner brackets: the frame is fixed, this is exactly where the shot will be
    g.lineWidth = 4;
    g.lineCap = 'round';
    g.strokeStyle = AMBER;
    g.globalAlpha = 0.75 + 0.25 * p;
    g.beginPath();
    for (let c = 0; c < 4; c++) {
      const cx = c & 1 ? x0 + w : x0;
      const cy = c & 2 ? y0 + h : y0;
      const sx = c & 1 ? -1 : 1;
      const sy = c & 2 ? -1 : 1;
      g.moveTo(cx + sx * BRACKET, cy);
      g.lineTo(cx, cy);
      g.lineTo(cx, cy + sy * BRACKET);
    }
    g.stroke();
    // the iris closes on the frame's centre: when it shuts, the shutter opens
    const r = Math.hypot(d.halfW, d.halfH) * (1 - p) + 6;
    g.lineWidth = 2.5;
    g.globalAlpha = 0.55;
    g.beginPath();
    g.arc(fx, fy, r, 0, TAU);
    g.stroke();
    if (!rm) {
      // six blades of the iris turning in
      g.beginPath();
      for (let b = 0; b < 6; b++) {
        const a = (b * TAU) / 6 + p * 1.4;
        g.moveTo(fx + Math.cos(a) * r, fy + Math.sin(a) * r);
        g.lineTo(fx + Math.cos(a + 1.2) * r * 0.55, fy + Math.sin(a + 1.2) * r * 0.55);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
    g.lineCap = 'butt';
    // dotted sight line from the camera to the frame
    g.setLineDash(SENSOR_DASH);
    g.lineWidth = 1.5;
    g.strokeStyle = 'rgba(255,210,122,0.5)';
    g.beginPath();
    g.moveTo(d.x, d.y);
    g.lineTo(fx, fy);
    g.stroke();
    g.setLineDash(NO_DASH);
    return;
  }
  // exposing: the frame is the detector, hard-edged
  const e = (tau - PHOTO.iris) / PHOTO.expose;
  g.fillStyle = '#ffffff';
  g.globalAlpha = (rm ? 0.12 : 0.22 * (1 - e) + 0.08) + hot * 0.08;
  g.fillRect(x0, y0, w, h);
  g.globalAlpha = 1;
  g.lineWidth = hot > 0 ? 5 : 3.5;
  g.strokeStyle = hot > 0 ? RED : 'rgba(255,120,140,0.95)';
  g.strokeRect(x0, y0, w, h);
  // the exposure running down along the top edge
  g.lineWidth = 5;
  g.strokeStyle = RED;
  g.beginPath();
  g.moveTo(x0, y0 - 9);
  g.lineTo(x0 + w * (1 - e), y0 - 9);
  g.stroke();
}

/** A steward's torch: a hard-edged cone. */
export function drawStewardTorch(g: CanvasRenderingContext2D, cones: ConeSprites, f: HazardField, i: number, hot: number, lead: number): void {
  const d = f.defs[i] as StewardHazard;
  cones.draw(g, f.x2[i]!, f.y2[i]!, f.a[i]!, d.coneHalf, d.coneRange, TORCH, 0.5, hot, lead);
  g.globalCompositeOperation = 'lighter';
  drawGlow(g, GLOW.warm, f.x2[i]!, f.y2[i]!, 20, 20, 0.8);
  g.globalCompositeOperation = 'source-over';
}

/** Index of a photographer that half-pressed since last frame (`prev` = last frame's phase per hazard), or -1. */
export function photoHalfPressed(f: HazardField, prev: Uint8Array): number {
  let first = -1;
  for (let i = 0; i < f.defs.length; i++) {
    if (f.defs[i]!.type !== 'photographer') continue;
    const phase = photoPhase(f.b[i]!);
    if (phase === PhotoPhase.Iris && prev[i] !== PhotoPhase.Iris && first < 0) first = i;
    prev[i] = phase;
  }
  return first;
}
