// Retained room art falls back to these small texture painters until the L9 SVGs land.
import { INK } from './views/pieces';

function roundBox(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke: string): void {
  g.beginPath();
  g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = stroke;
  g.stroke();
}

function ellipse(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string): void {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.stroke();
  }
}

const CREAM = '#e5cca1';
const TEAL = '#4e7b7d';
const OXIDE = '#9d5861';
const METAL = '#8da2ad';

export function paintRoom55(g: CanvasRenderingContext2D, key: string, w: number, h: number): boolean {
  const block = (x: number, y: number, width: number, height: number, color: string) =>
    roundBox(g, x * w, y * h, width * w, height * h, Math.min(9, height * h / 4), color, INK);
  g.lineWidth = 3;
  switch (key) {
    case 'room/tower_ledge55':
      block(0.05, 0.25, 0.9, 0.73, '#696075');
      block(0.01, 0.03, 0.98, 0.35, CREAM);
      return true;
    case 'room/tower_cable55':
      g.strokeStyle = INK;
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(4, 12);
      g.quadraticCurveTo(w / 2, h * 1.45, w - 4, 7);
      g.stroke();
      ellipse(g, 10, 12, 9, 10, CREAM);
      ellipse(g, w - 10, 8, 9, 7, CREAM);
      return true;
    case 'room/booth55':
      block(0.02, 0.02, 0.43, 0.91, OXIDE);
      block(0.06, 0.18, 0.33, 0.62, '#b56b70');
      block(0.03, 0.82, 0.93, 0.17, OXIDE);
      return true;
    case 'room/counter55':
      block(0.035, 0.11, 0.93, 0.88, TEAL);
      block(0.015, 0.035, 0.97, 0.15, METAL);
      return true;
    case 'room/stool55':
      block(0.42, 0.16, 0.16, 0.78, METAL);
      ellipse(g, w / 2, h * 0.88, w * 0.35, h * 0.08, METAL, INK);
      ellipse(g, w / 2, h * 0.17, w * 0.46, h * 0.12, OXIDE, INK);
      return true;
    case 'room/jukebox55':
      roundBox(g, 2, 2, w - 4, h - 4, 37, '#5b435f', INK);
      roundBox(g, 9, 10, w - 18, h * 0.55, 32, '#e19c5f', INK);
      block(0.25, 0.59, 0.5, 0.31, METAL);
      for (let i = 0; i < 3; i++) block(0.27, 0.63 + i * 0.085, 0.45, 0.02, '#495566');
      return true;
    case 'room/pie_case55':
      block(0.04, 0.09, 0.92, 0.88, '#6d8799');
      block(0.14, 0.2, 0.72, 0.48, '#9eb7ba');
      g.fillStyle = '#d5a472';
      g.beginPath();
      g.moveTo(w * 0.27, h * 0.62);
      g.lineTo(w * 0.73, h * 0.61);
      g.lineTo(w * 0.56, h * 0.33);
      g.fill();
      return true;
    case 'room/trunk_body55':
      block(0.01, 0.39, 0.98, 0.51, '#565e76');
      block(0.04, 0.4, 0.8, 0.17, '#39293d');
      block(0.8, 0.13, 0.18, 0.56, OXIDE);
      ellipse(g, w * 0.64, h * 0.79, w * 0.115, h * 0.2, INK);
      ellipse(g, w * 0.64, h * 0.79, w * 0.055, h * 0.098, CREAM);
      return true;
    case 'room/trunk_lid55':
      g.save();
      g.translate(w * 0.36, h * 0.94);
      g.rotate(-0.29);
      roundBox(g, -12, -h * 0.87, 22, h * 0.89, 8, METAL, INK);
      g.restore();
      return true;
    case 'room/gym_doors55':
      block(0.02, 0, 0.96, 0.99, CREAM);
      block(0.07, 0.05, 0.42, 0.91, TEAL);
      block(0.51, 0.05, 0.42, 0.91, TEAL);
      block(0.13, 0.13, 0.31, 0.48, '#516177');
      block(0.56, 0.13, 0.31, 0.48, '#516177');
      block(0.14, 0.64, 0.72, 0.045, METAL);
      return true;
    case 'room/amp_case55':
      block(0.01, 0.03, 0.98, 0.94, '#403d51');
      ellipse(g, w * 0.5, h * 0.52, w * 0.28, h * 0.36, '#524b5d', METAL);
      block(0.09, 0.1, 0.13, 0.14, METAL);
      block(0.78, 0.76, 0.13, 0.14, METAL);
      return true;
    default:
      return false;
  }
}

export function paintSouvenir55(g: CanvasRenderingContext2D, key: string, w: number, h: number): boolean {
  const block = (x: number, y: number, width: number, height: number, color: string) =>
    roundBox(g, x * w, y * h, width * w, height * h, Math.min(5, height * h / 3), color, INK);
  g.lineWidth = 2;
  switch (key) {
    case 'room/flex_capacitor':
      block(0.045, 0.05, 0.91, 0.91, METAL);
      block(0.16, 0.17, 0.68, 0.66, '#2c324a');
      g.strokeStyle = '#ffe1a8';
      g.beginPath();
      g.moveTo(w * 0.28, h * 0.32);
      g.lineTo(w * 0.5, h * 0.52);
      g.lineTo(w * 0.72, h * 0.32);
      g.moveTo(w * 0.5, h * 0.52);
      g.lineTo(w * 0.5, h * 0.73);
      g.stroke();
      return true;
    case 'room/hazmat_suit':
      block(0.12, 0.3, 0.76, 0.66, '#efd05f');
      block(0.27, 0.035, 0.46, 0.5, '#ecbe46');
      block(0.34, 0.14, 0.32, 0.25, '#563f5b');
      block(0.43, 0.54, 0.14, 0.34, '#fff0b5');
      return true;
    case 'room/retro_skateboard':
      ellipse(g, w * 0.26, h * 0.7, w * 0.08, h * 0.22, CREAM, INK);
      ellipse(g, w * 0.75, h * 0.7, w * 0.08, h * 0.22, CREAM, INK);
      block(0.025, 0.2, 0.95, 0.39, '#9065c2');
      block(0.31, 0.23, 0.14, 0.31, '#efc254');
      return true;
    case 'room/clock_flyer':
      block(0.075, 0.05, 0.85, 0.9, CREAM);
      ellipse(g, w * 0.5, h * 0.43, w * 0.24, h * 0.22, '#f6ddac', OXIDE);
      block(0.24, 0.75, 0.52, 0.07, OXIDE);
      return true;
    case 'room/cherry_guitar':
      block(0.34, 0.33, 0.63, 0.24, CREAM);
      ellipse(g, w * 0.27, h * 0.53, w * 0.24, h * 0.38, '#bb544f', INK);
      ellipse(g, w * 0.31, h * 0.53, w * 0.08, h * 0.13, INK);
      return true;
    case 'room/puffy_vest':
      block(0.12, 0.04, 0.76, 0.91, '#c66360');
      block(0.42, 0.09, 0.16, 0.7, '#964a54');
      for (let i = 0; i < 3; i++) {
        block(0.18, 0.34 + i * 0.16, 0.21, 0.05, '#e28b70');
        block(0.61, 0.34 + i * 0.16, 0.21, 0.05, '#e28b70');
      }
      return true;
    default:
      return false;
  }
}
