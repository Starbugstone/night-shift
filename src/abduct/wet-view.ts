// L5: drawing for water zones, refill points and drips (src/abduct/moisture.ts). Water is dark
// Pine with a wavy Ice surface line; refills carry a small mint droplet chevron (a goal), a
// sprinkler between sprays shows the droplet dim. Allocation-free per frame.
import { VIEW_H, VIEW_W } from '../contracts';
import { DRIPS, sprinklerOn, type MoistureSim } from './moisture';
import type { Area } from './rooms/layout';

const PINE = '#1f3d3a';
const ICE = '#d4ecf5';
const WATER = '#8fc3e0';
const MINT = '#7cffcb';
const DIM = '#6f7d96';
const INK = '#1a162b';
const RING_SECONDS = 2.4;

function onScreen(a: Area, cx: number, cy: number): boolean {
  return a.x + a.w >= cx - 20 && a.x <= cx + VIEW_W + 20 && a.y + a.h >= cy - 20 && a.y <= cy + VIEW_H + 20;
}

/** Wavy surface line along the top of a water area. */
function surface(g: CanvasRenderingContext2D, a: Area, t: number, rm: boolean, cx: number): void {
  const left = Math.max(a.x, cx - 20);
  const right = Math.min(a.x + a.w, cx + VIEW_W + 20);
  g.beginPath();
  for (let x = left; x <= right; x += 12) {
    const y = a.y + (rm ? 0 : Math.sin(x * 0.045 + t * 2.2) * 3 + Math.sin(x * 0.11 - t * 1.4) * 1.5);
    if (x === left) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.lineWidth = 3;
  g.strokeStyle = ICE;
  g.globalAlpha = 0.85;
  g.stroke();
  g.globalAlpha = 1;
}

/** Mint droplet with a chevron under it pointing at the refill. */
export function droplet(g: CanvasRenderingContext2D, x: number, y: number, live: boolean, bob: number): void {
  const color = live ? MINT : DIM;
  y += bob;
  g.beginPath();
  g.moveTo(x, y - 15);
  g.quadraticCurveTo(x + 11, y - 1, x + 9, y + 4);
  g.arc(x, y + 3, 9, 0.1, Math.PI - 0.1);
  g.quadraticCurveTo(x - 11, y - 1, x, y - 15);
  g.closePath();
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.stroke();
  g.fillStyle = color;
  g.globalAlpha = live ? 1 : 0.6;
  g.fill();
  g.globalAlpha = 1;
  g.beginPath();
  g.moveTo(x - 9, y + 19);
  g.lineTo(x, y + 27);
  g.lineTo(x + 9, y + 19);
  g.lineWidth = 3.5;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = color;
  g.stroke();
  g.lineCap = 'butt';
}

export class WetView {
  constructor(private readonly wet: MoistureSim) {}

  /** Behind the specimen: the water body, drip rings on the floor, refill markers and spray. */
  drawBack(g: CanvasRenderingContext2D, cx: number, cy: number, time: number, rm: boolean): void {
    const { spec } = this.wet;
    for (const zone of spec.water) {
      if (!onScreen(zone.area, cx, cy)) continue;
      g.globalAlpha = 0.5;
      g.fillStyle = PINE;
      g.fillRect(zone.area.x, zone.area.y, zone.area.w, zone.area.h);
      g.globalAlpha = 1;
    }
    const wet = this.wet;
    for (let k = 0; k < DRIPS; k++) {
      const age = time - wet.dripAt[k]!;
      if (age < 0 || age > RING_SECONDS) continue;
      const x = wet.dripX[k]!;
      const y = wet.dripY[k]!;
      if (x < cx - 40 || x > cx + VIEW_W + 40 || y < cy - 40 || y > cy + VIEW_H + 40) continue;
      const p = age / RING_SECONDS;
      g.globalAlpha = (1 - p) * 0.7;
      g.strokeStyle = WATER;
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(x, y, 6 + p * 22, 2 + p * 5, 0, 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;
    for (let r = 0; r < spec.refills.length; r++) {
      const point = spec.refills[r]!;
      const a = point.area;
      if (!onScreen(a, cx, cy)) continue;
      const live = point.kind !== 'sprinkler' || sprinklerOn(point.cycle, time);
      if (point.kind === 'sprinkler' && live) {
        // spray fanning down from the head
        g.strokeStyle = WATER;
        g.lineWidth = 2;
        g.globalAlpha = 0.55;
        g.beginPath();
        const mid = a.x + a.w / 2;
        for (let i = -3; i <= 3; i++) {
          const off = rm ? 0 : ((time * 260 + i * 37) % 60);
          g.moveTo(mid + i * 3, a.y + off * 0.2);
          g.lineTo(mid + i * (a.w / 7), a.y + a.h * 0.6 + off);
        }
        g.stroke();
        g.globalAlpha = 1;
      }
      const using = wet.refilling === r;
      const bob = rm ? 0 : Math.sin(time * 3 + r) * 3;
      droplet(g, a.x + a.w / 2, a.y - 30, live, using ? -4 : bob);
    }
  }

  /** In front of the specimen: the water's tint over whatever is in it, and the surface line. */
  drawFront(g: CanvasRenderingContext2D, cx: number, cy: number, time: number, rm: boolean): void {
    for (const zone of this.wet.spec.water) {
      if (!onScreen(zone.area, cx, cy)) continue;
      g.globalAlpha = 0.3;
      g.fillStyle = PINE;
      g.fillRect(zone.area.x, zone.area.y, zone.area.w, zone.area.h);
      g.globalAlpha = 1;
      surface(g, zone.area, time, rm, cx);
    }
  }
}
