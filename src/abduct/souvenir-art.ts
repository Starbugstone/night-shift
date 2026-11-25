// v4 items & recap humour: primitive drawings for the v4 souvenir items (src/abduct/souvenir-items.ts),
// shown while their SVGs are missing. Each painter draws in the sprite's own w×h box; both room
// views call `paintSouvenir` from their fallback painters (Canvas 2D runs only inside texture painters).
import { INK } from './views/pieces';

type Painter = (g: CanvasRenderingContext2D, w: number, h: number) => void;

const TAU = Math.PI * 2;

function blob(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, rot = 0): void {
  g.beginPath();
  g.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, TAU);
  g.fillStyle = fill;
  g.fill();
  g.stroke();
}

function block(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string): void {
  g.beginPath();
  g.roundRect(x, y, Math.max(1, w), Math.max(1, h), Math.min(r, w / 2, h / 2));
  g.fillStyle = fill;
  g.fill();
  g.stroke();
}

function shine(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  g.save();
  g.globalAlpha = 0.55;
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.ellipse(x, y, w, h, -0.5, 0, TAU);
  g.fill();
  g.restore();
}

function word(g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string): void {
  g.font = `900 ${size}px system-ui`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(text, x, y);
}

export const SOUVENIR_ART: Readonly<Record<string, Painter>> = {
  // L1 farm chimney: a fat green marrow with a rosette
  'room/prize_marrow': (g, w, h) => {
    blob(g, w * 0.47, h * 0.58, w * 0.44, h * 0.36, '#5f8f4e', -0.06);
    g.strokeStyle = '#a9c77a';
    g.beginPath();
    g.moveTo(w * 0.14, h * 0.55);
    g.quadraticCurveTo(w * 0.5, h * 0.42, w * 0.84, h * 0.5);
    g.stroke();
    g.strokeStyle = INK;
    block(g, w * 0.86, h * 0.36, w * 0.1, h * 0.22, 2, '#8a6b45');
    blob(g, w * 0.3, h * 0.3, h * 0.24, h * 0.24, '#e05a6a');
    blob(g, w * 0.3, h * 0.3, h * 0.1, h * 0.1, '#ffd36e');
  },
  // L2 laundry: heart-print boxers
  'room/heart_boxers': (g, w, h) => {
    g.beginPath();
    g.moveTo(w * 0.06, h * 0.12);
    g.lineTo(w * 0.94, h * 0.12);
    g.lineTo(w * 0.98, h * 0.92);
    g.lineTo(w * 0.58, h * 0.92);
    g.lineTo(w * 0.5, h * 0.5);
    g.lineTo(w * 0.42, h * 0.92);
    g.lineTo(w * 0.02, h * 0.92);
    g.closePath();
    g.fillStyle = '#f1e6ef';
    g.fill();
    g.stroke();
    block(g, w * 0.05, h * 0.06, w * 0.9, h * 0.16, 2, '#7d8fd6');
    g.fillStyle = '#e0526e';
    for (const [x, y] of [[0.22, 0.42], [0.74, 0.42], [0.2, 0.74], [0.8, 0.72]] as const) {
      const cx = w * x, cy = h * y, s = h * 0.09;
      g.beginPath();
      g.arc(cx - s * 0.5, cy, s * 0.55, Math.PI, 0);
      g.arc(cx + s * 0.5, cy, s * 0.55, Math.PI, 0);
      g.lineTo(cx, cy + s * 1.2);
      g.closePath();
      g.fill();
    }
  },
  // L2 laundry: one lonely striped sock, lying down
  'room/odd_sock': (g, w, h) => {
    g.beginPath();
    g.moveTo(w * 0.04, h * 0.2);
    g.lineTo(w * 0.58, h * 0.2);
    g.lineTo(w * 0.62, h * 0.52);
    g.quadraticCurveTo(w * 0.98, h * 0.5, w * 0.96, h * 0.8);
    g.quadraticCurveTo(w * 0.9, h * 0.98, w * 0.6, h * 0.94);
    g.lineTo(w * 0.04, h * 0.84);
    g.closePath();
    g.fillStyle = '#e7d9b8';
    g.fill();
    g.stroke();
    g.fillStyle = '#c4566a';
    g.fillRect(w * 0.08, h * 0.32, w * 0.06, h * 0.5);
    g.fillRect(w * 0.22, h * 0.3, w * 0.06, h * 0.52);
    g.fillStyle = '#9fb7d8';
    g.fillRect(w * 0.36, h * 0.28, w * 0.06, h * 0.56);
  },
  // L3 Dave: a pink-gummed denture set
  'room/demo_dentures': (g, w, h) => {
    blob(g, w * 0.5, h * 0.36, w * 0.46, h * 0.3, '#e88a98');
    blob(g, w * 0.5, h * 0.68, w * 0.44, h * 0.28, '#e88a98');
    g.fillStyle = '#fbf6ea';
    for (let i = 0; i < 6; i++) {
      const x = w * (0.16 + i * 0.12);
      g.fillRect(x, h * 0.42, w * 0.1, h * 0.14);
      g.strokeRect(x, h * 0.42, w * 0.1, h * 0.14);
      g.fillRect(x, h * 0.56, w * 0.1, h * 0.12);
      g.strokeRect(x, h * 0.56, w * 0.1, h * 0.12);
    }
  },
  // L3 Barb: a chrome coach's whistle on a lanyard
  'room/coach_whistle': (g, w, h) => {
    g.strokeStyle = '#d6413f';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(w * 0.86, h * 0.4);
    g.quadraticCurveTo(w * 1.0, h * 0.95, w * 0.62, h * 0.9);
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    blob(g, w * 0.36, h * 0.58, h * 0.36, h * 0.36, '#c9d2dd');
    block(g, w * 0.42, h * 0.24, w * 0.48, h * 0.3, 3, '#c9d2dd');
    blob(g, w * 0.36, h * 0.58, h * 0.12, h * 0.12, '#55607a');
    shine(g, w * 0.28, h * 0.45, w * 0.06, h * 0.08);
  },
  // L3 Gary: a crumpled tinfoil hat
  'room/tinfoil_hat': (g, w, h) => {
    g.beginPath();
    g.moveTo(w * 0.04, h * 0.94);
    g.lineTo(w * 0.24, h * 0.5);
    g.lineTo(w * 0.36, h * 0.6);
    g.lineTo(w * 0.52, h * 0.06);
    g.lineTo(w * 0.66, h * 0.52);
    g.lineTo(w * 0.78, h * 0.42);
    g.lineTo(w * 0.96, h * 0.94);
    g.closePath();
    g.fillStyle = '#c5ccd8';
    g.fill();
    g.stroke();
    g.strokeStyle = '#ffffff';
    g.beginPath();
    g.moveTo(w * 0.3, h * 0.82);
    g.lineTo(w * 0.5, h * 0.3);
    g.moveTo(w * 0.62, h * 0.8);
    g.lineTo(w * 0.7, h * 0.6);
    g.stroke();
    g.strokeStyle = INK;
  },
  // L4 Nigel: a gift-shop snow globe with a tiny saucer inside
  'room/ufo_snow_globe': (g, w, h) => {
    block(g, w * 0.12, h * 0.72, w * 0.76, h * 0.24, 4, '#8a5a44');
    blob(g, w * 0.5, h * 0.42, w * 0.42, h * 0.38, '#8fb5d8');
    blob(g, w * 0.5, h * 0.44, w * 0.24, h * 0.08, '#b9c0c9');
    blob(g, w * 0.5, h * 0.37, w * 0.1, h * 0.07, '#7cffcb');
    g.fillStyle = '#ffffff';
    for (const [x, y] of [[0.3, 0.24], [0.66, 0.2], [0.24, 0.52], [0.74, 0.56], [0.5, 0.62]] as const) g.fillRect(w * x, h * y, 2, 2);
    shine(g, w * 0.32, h * 0.22, w * 0.07, h * 0.06);
  },
  // L4 Kev: a 12-inch record half out of its sleeve
  'room/vinyl_12inch': (g, w, h) => {
    blob(g, w * 0.62, h * 0.5, w * 0.36, h * 0.44, '#191522');
    blob(g, w * 0.62, h * 0.5, w * 0.1, h * 0.12, '#ff6ed2');
    block(g, w * 0.02, h * 0.04, w * 0.58, h * 0.92, 2, '#f0b84a');
    word(g, '12"', w * 0.31, h * 0.5, Math.max(8, h * 0.32), INK);
  },
  // L4 Mayor: a glossy auburn toupee
  'room/toupee': (g, w, h) => {
    g.beginPath();
    g.moveTo(w * 0.04, h * 0.92);
    g.quadraticCurveTo(w * 0.1, h * 0.1, w * 0.5, h * 0.1);
    g.quadraticCurveTo(w * 0.92, h * 0.1, w * 0.96, h * 0.92);
    g.closePath();
    g.fillStyle = '#9a5a2e';
    g.fill();
    g.stroke();
    g.strokeStyle = '#d18a4f';
    g.beginPath();
    for (let i = 0; i < 4; i++) {
      g.moveTo(w * (0.2 + i * 0.18), h * 0.86);
      g.quadraticCurveTo(w * (0.3 + i * 0.16), h * 0.3, w * (0.46 + i * 0.12), h * 0.22);
    }
    g.stroke();
    g.strokeStyle = INK;
  },
  // L5 Bubbles: a yellow rubber duck
  'room/rubber_duck': (g, w, h) => {
    blob(g, w * 0.46, h * 0.68, w * 0.42, h * 0.28, '#ffd34e');
    blob(g, w * 0.66, h * 0.34, w * 0.22, h * 0.26, '#ffd34e');
    g.beginPath();
    g.moveTo(w * 0.84, h * 0.32);
    g.lineTo(w * 1.0, h * 0.42);
    g.lineTo(w * 0.84, h * 0.48);
    g.closePath();
    g.fillStyle = '#f08a3e';
    g.fill();
    g.stroke();
    g.fillStyle = INK;
    g.beginPath();
    g.arc(w * 0.7, h * 0.28, Math.max(1.2, h * 0.05), 0, TAU);
    g.fill();
  },
  // L5 Pete: a ship in a bottle, lying on its side
  'room/ship_bottle': (g, w, h) => {
    block(g, w * 0.04, h * 0.12, w * 0.78, h * 0.8, h * 0.36, 'rgba(160,210,200,0.55)');
    block(g, w * 0.82, h * 0.34, w * 0.14, h * 0.34, 2, '#b98a58');
    block(g, w * 0.18, h * 0.6, w * 0.46, h * 0.18, 3, '#7a4f33');
    g.fillStyle = '#f4ecd8';
    g.beginPath();
    g.moveTo(w * 0.4, h * 0.58);
    g.lineTo(w * 0.4, h * 0.22);
    g.lineTo(w * 0.58, h * 0.56);
    g.closePath();
    g.fill();
    g.stroke();
  },
  // L5 Sal: a dented green petty-cash tin
  'room/cash_tin': (g, w, h) => {
    block(g, w * 0.04, h * 0.3, w * 0.92, h * 0.64, 4, '#3f7a5c');
    block(g, w * 0.02, h * 0.16, w * 0.96, h * 0.22, 4, '#4f9470');
    block(g, w * 0.4, h * 0.04, w * 0.2, h * 0.14, 2, '#c9d2dd');
    blob(g, w * 0.5, h * 0.6, h * 0.1, h * 0.1, '#ffd36e');
  },
  // L6 Hank (Internal Affairs corridor): a polished silver plug, standing on its flared base
  'room/silver_plug': (g, w, h) => {
    blob(g, w * 0.5, h * 0.9, w * 0.48, h * 0.09, '#9aa3b4');
    block(g, w * 0.42, h * 0.62, w * 0.16, h * 0.26, 3, '#b8c1cf');
    g.beginPath();
    g.moveTo(w * 0.5, h * 0.03);
    g.bezierCurveTo(w * 0.98, h * 0.3, w * 0.86, h * 0.6, w * 0.5, h * 0.66);
    g.bezierCurveTo(w * 0.14, h * 0.6, w * 0.02, h * 0.3, w * 0.5, h * 0.03);
    g.closePath();
    g.fillStyle = '#d5dbe5';
    g.fill();
    g.stroke();
    shine(g, w * 0.36, h * 0.3, w * 0.08, h * 0.1);
  },
  // L6 Osei: a latex glove blown up into a "chicken" with a drawn-on face
  'room/glove_balloon': (g, w, h) => {
    g.fillStyle = '#9fd1e0';
    for (let i = 0; i < 4; i++) blob(g, w * (0.2 + i * 0.2), h * 0.18, w * 0.08, h * 0.16, '#9fd1e0');
    blob(g, w * 0.88, h * 0.5, w * 0.1, h * 0.12, '#9fd1e0');
    blob(g, w * 0.5, h * 0.58, w * 0.42, h * 0.34, '#9fd1e0');
    g.fillStyle = INK;
    g.beginPath();
    g.arc(w * 0.38, h * 0.52, Math.max(1.2, h * 0.04), 0, TAU);
    g.arc(w * 0.58, h * 0.52, Math.max(1.2, h * 0.04), 0, TAU);
    g.fill();
    g.beginPath();
    g.arc(w * 0.48, h * 0.62, h * 0.1, 0.2, Math.PI - 0.2);
    g.stroke();
  },
  // L6 Pemberton: a steel bedpan
  'room/bedpan': (g, w, h) => {
    blob(g, w * 0.42, h * 0.58, w * 0.38, h * 0.36, '#c3cad6');
    blob(g, w * 0.42, h * 0.5, w * 0.22, h * 0.16, '#8e97a8');
    block(g, w * 0.76, h * 0.42, w * 0.22, h * 0.28, 3, '#c3cad6');
    shine(g, w * 0.24, h * 0.46, w * 0.05, h * 0.08);
  },
  // L7 Captain: a literal log with a little brass "LOG" plaque
  'room/captains_log': (g, w, h) => {
    block(g, w * 0.04, h * 0.14, w * 0.84, h * 0.76, h * 0.3, '#8a5a36');
    blob(g, w * 0.86, h * 0.52, w * 0.1, h * 0.38, '#d9b07a');
    g.strokeStyle = '#a7774d';
    g.beginPath();
    g.ellipse(w * 0.86, h * 0.52, w * 0.04, h * 0.18, 0, 0, TAU);
    g.stroke();
    g.strokeStyle = INK;
    block(g, w * 0.26, h * 0.3, w * 0.34, h * 0.42, 2, '#e0b24f');
    word(g, 'LOG', w * 0.43, h * 0.52, Math.max(7, h * 0.32), INK);
  },
  // L7 Marco: a giant wooden pepper mill, lying down
  'room/pepper_mill': (g, w, h) => {
    block(g, w * 0.02, h * 0.3, w * 0.1, h * 0.4, 2, '#c9d2dd');
    g.beginPath();
    g.moveTo(w * 0.1, h * 0.18);
    g.quadraticCurveTo(w * 0.5, h * 0.36, w * 0.8, h * 0.1);
    g.lineTo(w * 0.8, h * 0.9);
    g.quadraticCurveTo(w * 0.5, h * 0.64, w * 0.1, h * 0.82);
    g.closePath();
    g.fillStyle = '#6e3f2a';
    g.fill();
    g.stroke();
    blob(g, w * 0.88, h * 0.5, w * 0.1, h * 0.36, '#8b5537');
    blob(g, w * 0.98, h * 0.5, w * 0.03, h * 0.12, '#c9d2dd');
  },
  // L7 Greg: a lime-green mankini, laid flat
  'room/mankini': (g, w, h) => {
    g.strokeStyle = '#a8f04a';
    g.lineWidth = Math.max(2, w * 0.07);
    g.beginPath();
    g.moveTo(w * 0.2, h * 0.08);
    g.lineTo(w * 0.46, h * 0.74);
    g.moveTo(w * 0.8, h * 0.08);
    g.lineTo(w * 0.54, h * 0.74);
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(w * 0.34, h * 0.66);
    g.lineTo(w * 0.66, h * 0.66);
    g.lineTo(w * 0.5, h * 0.98);
    g.closePath();
    g.fillStyle = '#a8f04a';
    g.fill();
    g.stroke();
    for (const x of [0.2, 0.8]) blob(g, w * x, h * 0.08, w * 0.05, h * 0.06, '#a8f04a');
  },
  // v4 easter eggs — L7 Captain (mast): a squat blue enamel heart on a gold chain, resting on its point
  'room/blue_heart_pendant': (g, w, h) => {
    // the chain, looped up behind the heart
    g.strokeStyle = '#e0b24f';
    g.lineWidth = Math.max(1.5, w * 0.05);
    g.beginPath();
    g.moveTo(w * 0.5, h * 0.36);
    g.bezierCurveTo(w * 0.06, h * 0.3, w * 0.12, h * 0.02, w * 0.5, h * 0.06);
    g.bezierCurveTo(w * 0.88, h * 0.02, w * 0.94, h * 0.3, w * 0.5, h * 0.36);
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    // the heart: two lobes and a point on the floor
    const cx = w * 0.5, top = h * 0.4, s2 = w * 0.2;
    g.beginPath();
    g.moveTo(cx, top + s2 * 0.35);
    g.bezierCurveTo(cx - s2 * 0.2, top - s2 * 0.3, cx - s2 * 1.9, top - s2 * 0.1, cx - s2 * 1.2, top + s2 * 1.4);
    g.lineTo(cx, h * 0.98);
    g.lineTo(cx + s2 * 1.2, top + s2 * 1.4);
    g.bezierCurveTo(cx + s2 * 1.9, top - s2 * 0.1, cx + s2 * 0.2, top - s2 * 0.3, cx, top + s2 * 0.35);
    g.closePath();
    g.fillStyle = '#2f6fd6';
    g.fill();
    g.stroke();
    // gold rim and bail
    g.strokeStyle = '#e0b24f';
    g.lineWidth = 1.5;
    g.stroke();
    g.strokeStyle = INK;
    blob(g, cx, top + s2 * 0.2, w * 0.06, h * 0.06, '#e0b24f');
    shine(g, cx - s2 * 0.7, top + s2 * 0.6, w * 0.06, h * 0.04);
  },
};

/** Draws the souvenir's fallback when `key` is a v4 souvenir; false otherwise. */
export function paintSouvenir(g: CanvasRenderingContext2D, key: string, w: number, h: number): boolean {
  const paint = SOUVENIR_ART[key];
  if (!paint) return false;
  g.save();
  g.lineWidth = 2.5;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.strokeStyle = INK;
  paint(g, w, h);
  g.restore();
  return true;
}
