// L6: drawing the ambulance scramble (logic in ./ambulance.ts). Everything that can see you is
// read from the sampled HazardField, so the drawn cone and beacon are the hit shapes.
//   parked + ready: the bay's dotted sensor range (neutral, like a porch sensor)
//   tell (1.2 s):   door rolls up, amber lane arrows run out along the route, amber ghost beacon
//   driving:        headlight cone + hard-edged beacon disc; red when it is the one seeing you
import { VIEW_H, VIEW_W, type Assets } from '../contracts';
import { GLOW, drawGlow, drawShadow, drawSprite } from '../core/fx';
import { roundRectPath } from '../ui/draw';
import { C } from '../ui/theme';
import { AMBULANCE, ambulanceReady, ambulanceTrip, type AmbulanceHazard } from './ambulance';
import type { ConeSprites } from './draw-common';
import type { HazardField } from './hazards';

const TAU = Math.PI * 2;
const INK = '#1b1433';
const RED = '#ff5d73';
const BLUE = '90,140,255';
const CONE_HEAD = '255,236,170';
const BAY_W = 200;
const BAY_H = 120;
const DOOR_W = 74;
const NO_DASH: number[] = [];
const DASH_SENSOR = [4, 10];
const DASH_GHOST = [14, 10];
/** Lane arrows: one every ARROW_GAP px along the route, out to ARROW_RUN px past the door. */
const ARROW_GAP = 64;
const ARROW_RUN = 420;
const tmp = { x: 0, y: 0 };

function bayAngle(d: AmbulanceHazard): number {
  const a = d.path[0]!;
  const b = d.path[1] ?? a;
  // the art's roll doors are on its south (+y) edge
  return Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;
}

/** How far the roll door is up, 0..1, from the seconds since the trigger. */
function doorUp(d: AmbulanceHazard, f: HazardField, i: number): number {
  const tau = f.b[i]!;
  if (!(tau >= 0)) return 0;
  const back = ambulanceTrip(d, f.routes[i]!);
  if (tau < back) return Math.min(1, tau / 0.45);
  return Math.max(0, 1 - (tau - back) / AMBULANCE.doorDown);
}

/** Ground layer: lane arrows, the ambulance, then the bay roof over it (it parks under its roof). */
export function drawAmbulance(g: CanvasRenderingContext2D, assets: Assets, f: HazardField, i: number, t: number, rm: boolean): void {
  const d = f.defs[i] as AmbulanceHazard;
  const tell = f.tell[i] === 1;
  const driving = f.on[i] === 1;
  if (tell) drawLaneArrows(g, f, i, t, rm);
  const x = f.x[i]!;
  const y = f.y[i]!;
  const h = f.a[i]!;
  // the ambulance (hidden under the roof while parked)
  if (driving || f.b[i]! < ambulanceTrip(d, f.routes[i]!) + AMBULANCE.doorDown) {
    const img = assets.get('flight/ambulance_top');
    const w = AMBULANCE.w;
    const l = AMBULANCE.len;
    g.save();
    g.translate(x + 6, y + 8);
    g.rotate(h + Math.PI / 2);
    drawShadow(g, img, w, l, 0.3);
    g.restore();
    g.save();
    g.translate(x, y);
    g.rotate(h + Math.PI / 2);
    if (img) drawSprite(g, img, -w / 2, -l / 2, w, l);
    else ambulanceFallback(g, w, l);
    if (driving) {
      // beacon on the roof: blue and white, never red (red means it has you)
      const blue = rm || Math.floor(t * 6) % 2 === 0;
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, blue ? BLUE : GLOW.white, -12, -18, 22, 22, 0.9);
      drawGlow(g, blue ? GLOW.white : BLUE, 12, -18, 22, 22, 0.9);
      g.globalCompositeOperation = 'source-over';
    }
    g.restore();
  }
  // the bay roof
  const img = assets.get('flight/ambulance_bay_top');
  const ang = bayAngle(d);
  g.save();
  g.translate(d.bayX + 12, d.bayY + 14);
  g.rotate(ang);
  drawShadow(g, img, BAY_W, BAY_H, 0.36);
  g.restore();
  g.save();
  g.translate(d.bayX, d.bayY);
  g.rotate(ang);
  if (img) drawSprite(g, img, -BAY_W / 2, -BAY_H / 2, BAY_W, BAY_H);
  else bayFallback(g);
  // this lane's roll door: in local bay coords, at the parked ambulance's x on the south edge
  const p0 = d.path[0]!;
  const ca = Math.cos(-ang);
  const sa = Math.sin(-ang);
  const lx = (p0.x - d.bayX) * ca - (p0.y - d.bayY) * sa;
  const up = doorUp(d, f, i);
  if (up > 0) {
    // the open door: dark garage, lit from inside while it waits
    g.fillStyle = '#0b0920';
    g.fillRect(lx - DOOR_W / 2, BAY_H / 2 - 10, DOOR_W, 10 * up + 2);
    if (tell) {
      g.globalCompositeOperation = 'lighter';
      drawGlow(g, GLOW.warm, lx, BAY_H / 2 + 6, 46 * up, 30 * up, 0.8);
      g.globalCompositeOperation = 'source-over';
    }
  }
  g.restore();
}

/** Amber chevrons along the first stretch of the route: where it is about to go. */
function drawLaneArrows(g: CanvasRenderingContext2D, f: HazardField, i: number, t: number, rm: boolean): void {
  const route = f.routes[i]!;
  const tau = f.b[i]!;
  const k = Math.min(1, tau / AMBULANCE.tell);
  const flash = rm ? 1 : Math.floor(t * 8) % 2 === 0 ? 1 : 0.45;
  // the arrows run out along the road as the launch nears
  const run = Math.min(route.total, 60 + (ARROW_RUN - 60) * Math.min(1, k * 1.6));
  g.lineWidth = 7;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = C.amber;
  for (let s = 60; s <= run; s += ARROW_GAP) {
    const h = route.at(s, tmp, 40);
    const x = tmp.x;
    const y = tmp.y;
    const c = Math.cos(h);
    const n = Math.sin(h);
    g.globalAlpha = flash * (0.55 + 0.45 * (1 - s / ARROW_RUN));
    g.beginPath();
    g.moveTo(x - c * 10 - n * 18, y - n * 10 + c * 18);
    g.lineTo(x + c * 12, y + n * 12);
    g.lineTo(x - c * 10 + n * 18, y - n * 10 - c * 18);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.lineCap = 'butt';
}

/**
 * Detector layer. `hot` (0..1) = this ambulance is the one seeing the saucer.
 */
export function drawAmbulanceLights(g: CanvasRenderingContext2D, cones: ConeSprites, f: HazardField, i: number, t: number, rm: boolean, hot: number): void {
  const d = f.defs[i] as AmbulanceHazard;
  const x = f.x[i]!;
  const y = f.y[i]!;
  if (f.on[i] === 1) {
    cones.draw(g, f.x2[i]!, f.y2[i]!, f.a[i]!, d.coneHalf, d.coneRange, CONE_HEAD, 0.5, hot);
    g.globalCompositeOperation = 'lighter';
    drawGlow(g, GLOW.warm, f.x2[i]!, f.y2[i]!, 34, 34, 0.85);
    g.globalCompositeOperation = 'source-over';
    const blue = rm || Math.floor(t * 6) % 2 === 0;
    g.beginPath();
    g.arc(x, y, d.beaconR, 0, TAU);
    g.fillStyle = blue ? 'rgba(90,140,255,0.15)' : 'rgba(220,232,255,0.12)';
    g.fill();
    g.lineWidth = hot > 0 ? 4.5 : 3;
    g.strokeStyle = hot > 0 ? RED : blue ? 'rgba(120,170,255,0.85)' : 'rgba(220,232,255,0.8)';
    g.stroke();
    if (!rm) {
      const a = t * 9;
      g.beginPath();
      g.moveTo(x, y);
      g.arc(x, y, d.beaconR, a, a + 0.6);
      g.closePath();
      g.fillStyle = 'rgba(90,140,255,0.2)';
      g.fill();
    }
    return;
  }
  if (f.tell[i] === 1) {
    // about to happen: the beacon it will launch with, ghosted in amber at the door, closing in
    const k = Math.min(1, f.b[i]! / AMBULANCE.tell);
    const out = d.path[1] ?? d.path[0]!;
    g.setLineDash(DASH_GHOST);
    g.lineDashOffset = rm ? 0 : -t * 90;
    g.lineWidth = 3.5;
    g.strokeStyle = C.amber;
    g.globalAlpha = 0.4 + 0.5 * k;
    g.beginPath();
    g.arc(out.x, out.y, d.beaconR, 0, TAU);
    g.stroke();
    g.setLineDash(NO_DASH);
    g.lineDashOffset = 0;
    // countdown arc round the bay sensor
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.globalAlpha = 0.9;
    g.beginPath();
    g.arc(d.bayX, d.bayY, d.trigger, -Math.PI / 2, -Math.PI / 2 + TAU * k);
    g.stroke();
    g.lineCap = 'butt';
    g.globalAlpha = 1;
    return;
  }
  // parked: the bay's motion sensor range, dotted, only while it can be scrambled
  if (!ambulanceReady(d, f.routes[i]!, f.t - f.b[i]!, f.t)) return;
  g.setLineDash(DASH_SENSOR);
  g.lineWidth = 2;
  g.strokeStyle = '#ffe296';
  g.globalAlpha = 0.3;
  g.beginPath();
  g.arc(d.bayX, d.bayY, d.trigger, 0, TAU);
  g.stroke();
  g.setLineDash(NO_DASH);
  g.globalAlpha = 1;
}

function ambulanceFallback(g: CanvasRenderingContext2D, w: number, l: number): void {
  roundRectPath(g, -w / 2 + 4, -l / 2 + 4, w - 8, l - 8, 12);
  g.fillStyle = '#eef0f6';
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.stroke();
  // windscreen at the nose (north), a teal stripe, a crescent moon on the roof (no cross)
  roundRectPath(g, -w / 2 + 12, -l / 2 + 14, w - 24, 22, 6);
  g.fillStyle = '#9fd3e6';
  g.fill();
  g.fillStyle = '#3f9a9a';
  g.fillRect(-w / 2 + 6, 6, w - 12, 10);
  g.beginPath();
  g.arc(0, 40, 14, 0, TAU);
  g.fillStyle = '#5a6aa0';
  g.fill();
  g.beginPath();
  g.arc(6, 36, 12, 0, TAU);
  g.fillStyle = '#eef0f6';
  g.fill();
}

function bayFallback(g: CanvasRenderingContext2D): void {
  roundRectPath(g, -BAY_W / 2 + 4, -BAY_H / 2 + 4, BAY_W - 8, BAY_H - 8, 8);
  g.fillStyle = '#7a8296';
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.stroke();
  g.fillStyle = '#c9ccd8';
  for (const x of [-50, 50]) g.fillRect(x - DOOR_W / 2, BAY_H / 2 - 14, DOOR_W, 10);
  g.fillStyle = 'rgba(0,0,0,0.2)';
  g.fillRect(-BAY_W / 2 + 18, -BAY_H / 2 + 18, 40, 26);
}

/** Index of an ambulance whose tell started since the last call (bay door going up), or -1. `prev` holds last frame's flags. */
export function ambulanceScrambled(f: HazardField, prev: Uint8Array): number {
  let hit = -1;
  for (let i = 0; i < f.defs.length; i++) {
    if (f.defs[i]!.type !== 'ambulance') continue;
    const now = f.tell[i]!;
    if (now && !prev[i] && hit < 0) hit = i;
    prev[i] = now;
  }
  return hit;
}

/**
 * The L6 campus lawn: `flight/ground_campus` tiled, or a cool dark lawn with pine needles.
 * `speckles` = x, y, size triples spread over the map (the scene's own).
 */
export function drawCampusGround(g: CanvasRenderingContext2D, assets: Assets, cx: number, cy: number, speckles: Float32Array): void {
  const img = assets.get('flight/ground_campus');
  if (img) {
    const T = 540;
    const x0 = Math.floor(cx / T) * T;
    const y0 = Math.floor(cy / T) * T;
    for (let y = y0; y < cy + VIEW_H; y += T) for (let x = x0; x < cx + VIEW_W; x += T) drawSprite(g, img, x, y, T + 0.5, T + 0.5, true);
    return;
  }
  g.fillStyle = '#263f3c';
  g.fillRect(cx - 20, cy - 20, VIEW_W + 40, VIEW_H + 40);
  g.fillStyle = '#2e4b46';
  for (let i = 0; i < speckles.length; i += 3) {
    const x = speckles[i]!;
    const y = speckles[i + 1]!;
    if (x < cx - 10 || x > cx + VIEW_W + 10 || y < cy - 10 || y > cy + VIEW_H + 10) continue;
    const r = speckles[i + 2]!;
    // pine needles: short slanted strokes
    g.fillRect(x, y, r * 2.2, 2);
    g.fillRect(x + r, y + 3, 2, r * 1.6);
  }
}
