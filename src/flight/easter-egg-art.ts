// v4 easter eggs: primitive drawings for the flight-map cameos (src/flight/easter-eggs.ts), shown
// while flight/gullwing_car and flight/iceberg are missing. Centred on the origin in a w×h box, like
// every prop fallback in ./props.ts (Canvas 2D runs only inside texture painters).
import type { EggKind } from './easter-eggs';

const INK = '#1b1433';

/** Unbadged stainless two-seater from above, nose east, one gull-wing door up. Drawn in a 72×40 box, scaled to fit. */
function timeCar(g: CanvasRenderingContext2D, sw: number, sh: number): void {
  g.save();
  g.scale(sw / 72, sh / 40);
  const w = 72;
  const h = 40;
  const x = -w / 2;
  const y = -h / 2;
  g.lineWidth = 2;
  g.strokeStyle = INK;
  // wheels peeking out
  g.fillStyle = '#20202a';
  for (const wx of [0.2, 0.76]) for (const wy of [0.06, 0.94]) {
    g.beginPath();
    g.roundRect(x + w * wx - 7, y + h * wy - 4, 14, 8, 3);
    g.fill();
  }
  // brushed steel body, wedge nose
  g.beginPath();
  g.moveTo(x + 4, y + 8);
  g.lineTo(x + w * 0.78, y + 6);
  g.lineTo(x + w - 3, y + h * 0.3);
  g.lineTo(x + w - 3, y + h * 0.7);
  g.lineTo(x + w * 0.78, y + h - 6);
  g.lineTo(x + 4, y + h - 8);
  g.closePath();
  g.fillStyle = '#b9c0c8';
  g.fill();
  g.stroke();
  // brush lines
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.lineWidth = 1;
  for (let k = 0; k < 4; k++) {
    g.beginPath();
    g.moveTo(x + 8, y + 12 + k * 5);
    g.lineTo(x + w * 0.74, y + 11 + k * 5);
    g.stroke();
  }
  g.strokeStyle = INK;
  g.lineWidth = 2;
  // dark glass cabin, the instrument glow sits in it (src/flight/easter-eggs.ts)
  g.beginPath();
  g.roundRect(x + w * 0.36, y + h * 0.24, w * 0.3, h * 0.52, 5);
  g.fillStyle = '#2a3346';
  g.fill();
  g.stroke();
  // the raised gull-wing door, hinged on the roof, swung up over the north side
  g.beginPath();
  g.moveTo(x + w * 0.38, y + h * 0.24);
  g.lineTo(x + w * 0.42, y - 2);
  g.lineTo(x + w * 0.64, y - 2);
  g.lineTo(x + w * 0.66, y + h * 0.24);
  g.closePath();
  g.fillStyle = '#d4d9df';
  g.fill();
  g.stroke();
  // round rear lamps and an engine grille: back of the car, west
  g.fillStyle = '#e0526e';
  for (const ly of [0.28, 0.72]) {
    g.beginPath();
    g.arc(x + 7, y + h * ly, 3, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(27,20,51,0.45)';
  for (let k = 0; k < 4; k++) g.fillRect(x + w * 0.12 + k * 4, y + h * 0.3, 2, h * 0.4);
  g.restore();
}

/** A small, chunky iceberg from above, a napkin frozen to its south-east edge. */
function iceberg(g: CanvasRenderingContext2D, w: number, h: number): void {
  // foam round the waterline
  g.fillStyle = 'rgba(225,240,250,0.22)';
  g.beginPath();
  g.ellipse(0, 2, w * 0.49, h * 0.47, 0, 0, Math.PI * 2);
  g.fill();
  const pts: readonly (readonly [number, number])[] = [
    [-0.4, -0.08], [-0.26, -0.36], [-0.02, -0.42], [0.18, -0.3], [0.38, -0.2], [0.42, 0.08], [0.28, 0.34], [0.02, 0.4], [-0.24, 0.32], [-0.42, 0.16],
  ];
  g.beginPath();
  pts.forEach(([px, py], i) => (i ? g.lineTo(px * w, py * h) : g.moveTo(px * w, py * h)));
  g.closePath();
  g.fillStyle = '#cfeef6';
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.stroke();
  // shaded facets
  g.fillStyle = '#8fc6d8';
  g.beginPath();
  g.moveTo(-0.02 * w, -0.42 * h);
  g.lineTo(0.06 * w, -0.02 * h);
  g.lineTo(0.42 * w, 0.08 * h);
  g.lineTo(0.38 * w, -0.2 * h);
  g.lineTo(0.18 * w, -0.3 * h);
  g.closePath();
  g.fill();
  g.fillStyle = '#a9d8e6';
  g.beginPath();
  g.moveTo(0.06 * w, -0.02 * h);
  g.lineTo(0.02 * w, 0.4 * h);
  g.lineTo(-0.24 * w, 0.32 * h);
  g.closePath();
  g.fill();
  g.fillStyle = '#ffffff';
  g.globalAlpha = 0.7;
  g.beginPath();
  g.ellipse(-0.18 * w, -0.16 * h, w * 0.08, h * 0.05, -0.5, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
  // the frozen napkin: a folded white square, a little askew
  g.save();
  g.translate(0.3 * w, 0.26 * h);
  g.rotate(0.5);
  g.fillStyle = '#fbf7ee';
  g.lineWidth = 2;
  g.beginPath();
  g.rect(-8, -8, 16, 16);
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(-8, -8);
  g.lineTo(8, 8);
  g.stroke();
  g.restore();
}

export function drawEggFallback(g: CanvasRenderingContext2D, kind: EggKind, w: number, h: number): void {
  if (kind === 'timecar') timeCar(g, w, h);
  else iceberg(g, w, h);
}
