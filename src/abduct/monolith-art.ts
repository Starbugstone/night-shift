import { type Container, Graphics, Sprite } from 'pixi.js';
import { Joint, type Ragdoll } from './ragdoll';
import { ART, RETIRED_ART } from '../art-manifest';
import { paintedTexture } from '../core/gfx/textures';

// Across-body distances from the midline in a three-quarter view. The two chains
// meet at the same simulated shoulder and hip when the beam holds a specimen still.
const HALF_WIDTH: Readonly<Record<Joint, number>> = {
  [Joint.Head]: 0, [Joint.Neck]: 23, [Joint.NearElbow]: 38, [Joint.FarElbow]: 38, [Joint.NearHand]: 48, [Joint.FarHand]: 48,
  [Joint.Pelvis]: 12, [Joint.NearKnee]: 16, [Joint.FarKnee]: 16, [Joint.NearFoot]: 19, [Joint.FarFoot]: 19,
};

export class ApeLimbProjection {
  private acrossX = 1;
  private acrossY = 0;

  sync(body: Ragdoll): void {
    const tilt = body.tilt;
    this.acrossX = Math.cos(tilt);
    this.acrossY = Math.sin(tilt) * 0.45;
  }

  place(sprite: Container, joint: Joint, end: Joint, far: boolean, x: number, y: number, endX: number, endY: number): void {
    const side = far ? -1 : 1;
    const root = side * HALF_WIDTH[joint];
    const spread = side * HALF_WIDTH[end] - root;
    const dx = endX - x, dy = endY - y;
    const vx = dx + this.acrossX * spread, vy = dy + this.acrossY * spread;
    sprite.position.set(x + this.acrossX * root, y + this.acrossY * root);
    sprite.rotation = Math.atan2(vy, vx) - Math.PI / 2;
    sprite.scale.y = Math.hypot(vx, vy) / Math.max(1, Math.hypot(dx, dy));
  }
}

type Brush = CanvasRenderingContext2D;
const INK = '#231c2e';

function oval(g: Brush, x: number, y: number, rx: number, ry: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  g.fill();
}

function stone(g: Brush, points: number[], color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(points[0]!, points[1]!);
  for (let i = 2; i < points.length; i += 2) g.lineTo(points[i]!, points[i + 1]!);
  g.closePath();
  g.fill();
}

/** In room sprite coordinates, independent of its world scale. */
export function paintCaveProp(g: Brush, key: string, w: number, h: number): boolean {
  if (key === 'room/patent_bone' || key === 'room/practice_bone') {
    g.fillStyle = '#e2c7a0';
    g.fillRect(w * 0.13, h * 0.33, w * 0.74, h * 0.34);
    for (const x of [0.13, 0.87]) for (const y of [0.29, 0.71])
      oval(g, w * x, h * y, w * 0.13, h * 0.28, '#e9d1ab');
    if (key === 'room/patent_bone') oval(g, w * 0.62, h / 2, 4, 3, '#a36243');
  } else if (key === 'room/exit_stone_hatch' || key === 'room/exit_stone_door') {
    const rim = key === 'room/exit_stone_hatch' ? 9 : 18;
    stone(g, [2,h, 0,h * 0.22, rim,2, w - rim,0, w,h * 0.18, w - 2,h], '#665868');
    stone(g, [rim,h - rim, rim + 3,rim * 2, w - rim * 2,rim, w - rim,h - rim], '#211b32');
    stone(g, [1,rim * 2, rim,2, w - rim,0, w,rim, rim + 3,rim + 3], '#ba9d89');
  } else if (key === 'room/stone_plinth' || key === 'room/stone_plinth_low') {
    stone(g, [0,6, w * 0.08,0, w - 6,0, w,h * 0.17, w - 4,h, 5,h], '#715b60');
    stone(g, [0,6,w * 0.08,0,w - 6,0,w,h * 0.17,w * 0.22,h * 0.22,0,h * 0.14], '#b89983');
    stone(g, [0,h * 0.63,w * 0.48,h * 0.46,w * 0.76,h * 0.55,w,h * 0.42,w,h * 0.54,w * 0.73,h * 0.65,w * 0.43,h * 0.6,0,h * 0.76], '#514453');
  } else if (key === 'room/uplift_slab') {
    g.fillStyle = '#15131e';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#857b90';
    g.fillRect(0, h - 8, w, 8);
    stone(g, [0,0,w,0,w - 6,5,4,5,4,h,0,h], '#91879e');
  } else if (key === 'room/stone_chime') {
    stone(g, [0,3,w*0.52,0,w-1,3,w,h-7,w*0.65,h,w*0.33,h-4,1,h], '#6c5965');
    stone(g, [w/2,0,w*0.46,h*0.3,0,h*0.58,w*0.32,h,w*0.54,h*0.62,w*0.67,h*0.94,w,h*0.53,w*0.59,h*0.33], '#c3a391');
  } else if (key.startsWith('room/understudy_')) {
    oval(g, w*0.52,h*0.77,w*0.45,h*0.23,'#a07152');
    oval(g, w*0.45,h*0.48,w*0.38,h*0.4,'#514453');
    oval(g, w*0.71,h*0.41,w*0.23,h*0.23,'#9c7966');
    oval(g, w*0.74,h*0.32,4,key.endsWith('awake') ? 5 : 1.4,INK);
  } else return false;
  return true;
}

/** Painted once for each ragdoll piece. The input origin is its sprite's top left. */
function paintApe(g: Brush, id: string, part: string, w: number, h: number): void {
  const fur = id === 'flint' ? '#946548' : id === 'reed' ? '#a78b60' : '#68637a';
  const skin = id === 'echo' ? '#bd9b92' : '#d1a57f';
  if (part.startsWith('head')) {
    const awake = part.endsWith('awake');
    oval(g,w*0.49,h*0.49,w*0.48,h*0.48,INK);
    oval(g,w*0.49,h*0.48,w*0.44,h*0.44,fur);
    oval(g,w*0.15,h*0.53,w*0.12,h*0.13,skin);
    oval(g,w*0.62,h*0.69,w*0.36,h*0.23,skin);
    oval(g,w*0.65,h*0.53,w*0.15,h*0.09,INK);
    for (const x of [0.42,0.78]) {
      oval(g,w*x,h*0.4,w*0.11,h*(awake ? 0.09 : 0.023),awake ? '#f1dfbf' : INK);
      if (awake) oval(g,w*x,h*0.4,2,3,INK);
      if (id === 'echo') {
        g.strokeStyle = '#b7adb9'; g.lineWidth = 2;
        g.beginPath(); g.arc(w*x,h*0.4,w*0.14,0,2*Math.PI); g.stroke();
      }
    }
    oval(g,w*0.66,h*0.8,w*0.12,h*(awake ? 0.07 : 0.023),INK);
    if (id === 'reed') stone(g,[5,31,1,3,12,13,10,33], '#c9bc77');
    if (id === 'flint') stone(g,[4,26,15,12,45,10,66,20,48,23], '#706c76');
  } else if (part === 'torso') {
    oval(g,w/2,h*0.5,w*0.48,h*0.49,fur);
    oval(g,w*0.54,h*0.33,w*0.37,h*0.3,skin);
  } else {
    oval(g,w*0.49,h*0.47,w*0.48,h*0.46,fur);
    if (part.startsWith('lower')) oval(g,w/2,h*0.83,w*0.49,h*0.17,skin);
  }
}

/** The same rig in the room, the flight chips, the work orders and the Bureau ID photo. */
export function apeFallback(key: string, width: number, height: number): Sprite | null {
  const match = /^human\/(flint|reed|echo)_(.+)$/.exec(key);
  if (!match) return null;
  const spec = ART[key] ?? RETIRED_ART[key];
  if (!spec) return null;
  const { w, h } = spec;
  const texture = paintedTexture('ape|' + key, w, h, g => paintApe(g, match[1]!, match[2]!, w, h));
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.width = width;
  sprite.height = height;
  return sprite;
}

const CAVE_COLORS: Record<string, readonly [number, number]> = {
  'room/bg_quarry_cave': [0x473643, 0x745456],
  'room/bg_reed_cave': [0x3c304a, 0x66516a],
  'room/bg_patent_cave': [0x323347, 0x54526b],
};

export function caveBackdrop(key: string, w: number, h: number): Graphics | null {
  const palette = CAVE_COLORS[key];
  if (!palette) return null;
  const g = new Graphics().rect(0, 0, w, h).fill(palette[0]);
  for (let y = 64; y < h - 36; y += 123) {
    g.moveTo(0,y);
    for (let x = 0; x <= w + 90; x += 88) g.lineTo(Math.min(x,w), y + Math.sin(x*0.009 + y)*15);
    g.stroke({color: palette[1], width: 6, alpha: 0.45});
  }
  // The early patent record: hand stencils and their accompanying tally marks.
  for (let x = 195; x < w - 40; x += 330) {
    const y = h - 420 + (x % 54);
    g.ellipse(x, y, 12, 16).fill({ color: 0xceaa86, alpha: 0.28 });
    for (let i = -2; i < 3; i++) g.moveTo(x+i*5,y-4).lineTo(x+i*8,y-33+Math.abs(i)*5);
    g.stroke({color: 0xceaa86, width: 4, alpha: 0.28, cap:'round'});
  }
  return g;
}
