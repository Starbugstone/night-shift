import { Container, Graphics } from 'pixi.js';
import { VIEW_W, type Assets, type MapCollectibleId } from '../../contracts';
import { batched, panelPath } from '../../core/gfx/shapes';
import { Label, measure, type LabelStyle } from '../../core/gfx/text';
import { fmt, tr } from '../../i18n';
import { C } from '../../ui/theme';
import { artSprite } from '../../ui/views/art';
import { HudPanel } from '../../ui/views/hud';
import type { MapCollectible } from '../collectible';
import { figurePose, figureSeed, newFigurePose } from '../pickup-pose';
import { PERSON_RIGS, PICKUP_SIZE, pickupKey, type PartMove, type PersonRig, type RigPart } from '../pickup-rig';
import type { Box } from './clear-of';
import { arc } from './tells';
import type { CameraView } from './world';
import { timeCarWedge } from './time-car';

const TOAST = { size: 20, color: C.mint, weight: 800 } as const;
const SEGMENTS = 12;

function sparkle(r: number): Graphics {
  return new Graphics().poly([0, -r, r * 0.28, -r * 0.28, r, 0, r * 0.28, r * 0.28,
    0, r, -r * 0.28, r * 0.28, -r, 0, -r * 0.28, -r * 0.28]).fill(C.mint);
}

// ---------------------------------------------------------------- primitive fallbacks
// Drawn when the art is missing: small top-down sketches in their own px (about 48 across, centre
// at the origin). `pickupFallback` scales one up to the art's footprint.

function slipperFlyer(): Graphics {
  const g = batched(new Graphics());
  const frame = { color: C.ink, width: 2.5 } as const;
  // Soft drop shadow on the dark pavement
  g.roundRect(-18, -21, 42, 50, 3).fill('rgba(14,10,35,0.48)');
  // Cream paper sheet with tear-off contact tabs along the bottom (one tab already torn off)
  g.moveTo(-21, -24).lineTo(21, -24).lineTo(21, 25)
    .lineTo(13, 25).lineTo(13, 19).lineTo(11, 19).lineTo(11, 25)
    .lineTo(3, 25).lineTo(3, 19).lineTo(-5, 19).lineTo(-5, 25) // missing middle-left tab
    .lineTo(-13, 25).lineTo(-13, 19).lineTo(-15, 19).lineTo(-15, 25)
    .lineTo(-21, 25).closePath()
    .fill('#fff6dc').stroke(frame);
  // Perforation line above the tear-off tabs
  g.moveTo(-19, 17).lineTo(19, 17).stroke({ color: '#c9ba96', width: 1.5 });
  // Bold crimson LOST banner across the top
  g.roundRect(-17, -18, 34, 11, 2).fill('#d93f56');
  // Doyle's coral-red fuzzy slipper doodle in the centre (matches room/slipper.svg)
  g.moveTo(-14, 1).quadraticCurveTo(-10, -2, -5, 0)
    .lineTo(0, -4).quadraticCurveTo(3, -6, 9, -5).quadraticCurveTo(14, -4, 16, 2)
    .quadraticCurveTo(17, 6, 12, 6).lineTo(-9, 7).quadraticCurveTo(-14, 7, -14, 3).closePath()
    .fill('#dc6866').stroke({ color: C.ink, width: 2 });
  g.moveTo(-11, 1).quadraticCurveTo(-7, -1, -3, 0).lineTo(-4, 3).lineTo(-11, 3).closePath().fill('#594050');
  g.moveTo(2, -2).quadraticCurveTo(6, -4, 10, -2).stroke({ color: '#ebaa89', width: 1.5, cap: 'round' });
  // Tiny scribbled "REWARD" lines under the slipper
  g.moveTo(-12, 11).lineTo(12, 11).moveTo(-8, 14).lineTo(8, 14).stroke({ color: '#6b5c7a', width: 1.8, cap: 'round' });
  // Red thumbtack pinning the flyer at the top centre
  g.circle(0, -23, 4.5).fill('#e6485c').stroke({ color: C.ink, width: 2 });
  g.circle(-1.2, -24.2, 1.3).fill('#ffd8de');
  return g;
}

/** L3: volunteer astronomer camped on Birch Lane with a portable SETI dish, chair, thermos & sign. */
function volunteerAstronomer(): Graphics {
  const g = batched(new Graphics());
  const outline = { color: C.ink, width: 2.2 } as const;
  // Soft ground shadow under the camp spot
  g.ellipse(0, 3, 27, 22).fill('rgba(14,10,35,0.44)');
  // Groundsheet / folding-chair mat on the grass
  g.roundRect(-22, -16, 44, 34, 6).fill('#394c5c').stroke(outline);
  // Tripod legs & portable parabolic SETI dish (west side, angled north-east)
  g.moveTo(-12, -5).lineTo(-20, 6).moveTo(-12, -5).lineTo(-4, 6).moveTo(-12, -5).lineTo(-14, -17)
    .stroke({ color: '#9aa8bd', width: 2.4, cap: 'round' });
  g.ellipse(-11, -7, 13, 10).fill('#eef4ff').stroke(outline);
  g.ellipse(-11, -7, 8, 6).stroke({ color: '#9fb4d4', width: 1.4 });
  // Feed horn pointing skyward-right with a tiny red tip
  g.moveTo(-11, -7).lineTo(-3, -15).stroke({ color: C.ink, width: 3, cap: 'round' });
  g.circle(-3, -15, 2.6).fill('#ff5d73').stroke({ color: C.ink, width: 1.4 });
  // Red-and-silver thermos sitting beside the chair
  g.circle(-16, 11, 4.5).fill('#d94a5a').stroke({ color: C.ink, width: 1.8 });
  g.circle(-16, 11, 2).fill('#dce6f2');
  // Folding cardboard sign ("waves" doodle) propped at south-east
  g.roundRect(7, 8, 15, 10, 2).fill('#fff4d8').stroke({ color: C.ink, width: 1.8 });
  g.moveTo(10, 13).lineTo(19, 13).stroke({ color: '#5b4b73', width: 1.6, cap: 'round' });
  // Top-down volunteer figure (parka shoulders, arms, teal beanie with pom-pom, headphones)
  g.ellipse(11, 1, 11, 8).fill('#d48d46').stroke(outline);
  g.circle(3, -3, 3.2).circle(15, -6, 3.2).fill('#f0c29e').stroke({ color: C.ink, width: 1.6 });
  g.circle(11, 0, 6.8).fill('#3b8d8a').stroke(outline);
  // Contact headphones band across the beanie
  g.moveTo(4.5, -1).quadraticCurveTo(11, -6, 17.5, -1).stroke({ color: '#1b1433', width: 2.4, cap: 'round' });
  g.circle(11, 2.5, 2.1).fill('#fff4d8');
  return g;
}

/** L4: Mrs. Pruitt's blurry saucer photo pinned on City Hall's exterior municipal noticeboard. */
function saucerPhoto(): Graphics {
  const g = batched(new Graphics());
  const outline = { color: C.ink, width: 2.4 } as const;
  // Drop shadow on the plaza pavement
  g.roundRect(-22, -17, 48, 40, 4).fill('rgba(14,10,35,0.5)');
  // Mahogany municipal noticeboard frame & warm cork backing
  g.roundRect(-24, -20, 48, 40, 4).fill('#7c4b36').stroke(outline);
  g.roundRect(-19, -15, 38, 30, 2).fill('#c49862').stroke({ color: '#593324', width: 1.5 });
  // Tiny "Missing Cat" slip pinned on the left (matches Vrell's report quip)
  g.roundRect(-16, -12, 11, 14, 1.5).fill('#fff6dc').stroke({ color: C.ink, width: 1.4 });
  g.circle(-10.5, -6, 2.3).fill('#6b5c7a');
  g.circle(-10.5, -11, 1.8).fill('#4a8fe7');
  // Prominent tilted glossy Polaroid photo of the blurry saucer
  g.roundRect(-4, -13, 21, 25, 2).fill('#fff9ee').stroke({ color: C.ink, width: 2 });
  g.rect(-1.5, -10.5, 16, 15).fill('#1e2246');
  // Blurry glowing mint-and-amber UFO smudge in the night sky
  g.ellipse(6.5, -3.5, 6.5, 2.8).fill({ color: C.mint, alpha: 0.45 });
  g.ellipse(6.5, -3.5, 4.4, 1.8).fill(C.mint);
  g.circle(6.5, -4.4, 1.4).fill(C.amberHi);
  // Tiny scribbled caption under the Polaroid + crimson pushpin at top
  g.moveTo(0, 8).lineTo(13, 8).stroke({ color: '#7a6c8e', width: 1.5, cap: 'round' });
  g.circle(6.5, -12.5, 3.2).fill('#e6485c').stroke({ color: C.ink, width: 1.6 });
  g.circle(5.6, -13.4, 0.9).fill('#ffd8de');
  return g;
}

/** L5: the unaccounted OBELISK™ shipping crate on the fish-market boardwalk slip. */
function obeliskCrate(): Graphics {
  const g = batched(new Graphics());
  const outline = { color: C.ink, width: 2.5 } as const;
  // Shadow on the boardwalk decking
  g.roundRect(-20, -15, 46, 38, 3).fill('rgba(10,8,28,0.55)');
  // Timber shipping crate body with diagonal slats
  g.roundRect(-22, -18, 44, 36, 3).fill('#c99a5b').stroke(outline);
  g.rect(-17, -13, 34, 26).fill('#b07f43').stroke({ color: '#6b4720', width: 1.5 });
  g.moveTo(-17, -13).lineTo(17, 13).moveTo(-17, 13).lineTo(17, -13)
    .stroke({ color: '#d7aa6c', width: 3.5 });
  g.moveTo(-17, -13).lineTo(17, 13).moveTo(-17, 13).lineTo(17, -13)
    .stroke({ color: '#6b4720', width: 1.2 });
  // Pried-open top-right corner revealing a glossy black basalt monolith sliver with a lilac bevel
  g.poly([4, -18, 22, -18, 22, -2, 6, -4]).fill('#181326').stroke(outline);
  g.moveTo(7, -15).lineTo(19, -15).lineTo(19, -5).stroke({ color: '#a58ef0', width: 2 });
  // Corner iron brackets
  for (const [bx, by] of [[-22, -18], [-22, 12], [16, 12]] as const) {
    g.rect(bx, by, 6, 6).fill('#6d758c').stroke({ color: C.ink, width: 1.4 });
  }
  // Red customs tag / undeclared stripe across the lower left
  g.roundRect(-19, 3, 24, 11, 2).fill('#d93f56').stroke({ color: C.ink, width: 1.6 });
  return g;
}

/** L6: stray hospital defibrillator trolley marked IT'S ALIVE! (Frankenstein nod). */
function strayDefibrillator(): Graphics {
  const g = batched(new Graphics());
  const outline = { color: C.ink, width: 2.3 } as const;
  // Shadow on the campus lawn
  g.roundRect(-21, -14, 46, 34, 6).fill('rgba(14,10,35,0.48)');
  // Four dark caster wheels + push handle on the left
  for (const [wx, wy] of [[-18, -16], [14, -16], [-18, 13], [14, 13]] as const) {
    g.roundRect(wx, wy, 6, 4, 1.5).fill('#28253d');
  }
  g.moveTo(-23, -11).lineTo(-23, 11).stroke({ color: '#9eb0c7', width: 3.5, cap: 'round' });
  // Pale steel hospital trolley deck
  g.roundRect(-21, -15, 42, 30, 5).fill('#cfd8e6').stroke(outline);
  // Bright yellow defibrillator casing
  g.roundRect(-16, -11, 22, 22, 3).fill('#ffd147').stroke({ color: C.ink, width: 2 });
  // Dark ECG monitor window with a glowing mint heartbeat trace
  g.roundRect(-13, -8, 16, 10, 2).fill('#162436');
  g.moveTo(-12, -3).lineTo(-8, -3).lineTo(-6, -7).lineTo(-4, 0).lineTo(-2, -3).lineTo(2, -3)
    .stroke({ color: C.mint, width: 1.8, join: 'round', cap: 'round' });
  // Bold red lightning bolt tag under the screen ("IT'S ALIVE!")
  g.poly([-6, 3, -9, 7, -5, 7, -7, 10, -1, 5.5, -5, 5.5]).fill('#d93f56');
  // Twin crimson shock paddles with coiled leads on the right side of the trolley
  g.moveTo(6, -5).quadraticCurveTo(10, -9, 13, -6).moveTo(6, 5).quadraticCurveTo(10, 9, 13, 6)
    .stroke({ color: C.ink, width: 1.8 });
  g.roundRect(10, -11, 8, 9, 2.5).fill('#e6485c').stroke({ color: C.ink, width: 1.8 });
  g.roundRect(10, 2, 8, 9, 2.5).fill('#e6485c').stroke({ color: C.ink, width: 1.8 });
  return g;
}

/** L7: the shrimp tower on an aft promenade buffet cart (deep plum cloth frames silver + coral shrimp). */
function shrimpTower(): Graphics {
  const g = batched(new Graphics());
  const outline = { color: C.ink, width: 2.3 } as const;
  // Crisp dark shadow so the cart stands out cleanly on the pale ship planks
  g.roundRect(-22, -17, 48, 40, 7).fill('rgba(20,16,40,0.52)');
  // Deep plum linen buffet trolley with brass corner trim
  g.roundRect(-23, -19, 46, 38, 6).fill('#542c5c').stroke(outline);
  g.roundRect(-19, -15, 38, 30, 4).stroke({ color: '#e6b95c', width: 1.6 });
  // Lower silver ice platter + crushed ice sparkle
  g.circle(0, 0, 16.5).fill('#dce6f2').stroke(outline);
  g.circle(0, 0, 13).fill('#eef7ff');
  // Ring of curled coral-pink jumbo shrimp around the lower tier
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8;
    const sx = Math.cos(a) * 11.5;
    const sy = Math.sin(a) * 11.5;
    g.circle(sx, sy, 3.6).fill('#ff7362').stroke({ color: C.ink, width: 1.4 });
    g.circle(sx * 0.88, sy * 0.88, 1.3).fill('#ffd8c4');
  }
  // Upper silver tier + crimson cocktail sauce bowl + bright yellow lemon wedge
  g.circle(0, -1, 8.5).fill('#cfdbe8').stroke({ color: C.ink, width: 1.8 });
  g.circle(0, -1, 5).fill('#d92d46').stroke({ color: C.ink, width: 1.4 });
  g.poly([1, -2, 7, -6, 6, 1]).fill('#ffe066').stroke({ color: C.ink, width: 1.2 });
  return g;
}

/** L8: Krix, the ex-intern in a black turtleneck clutching his gleaming toaster, on the east ridge. */
function krixIntern(): Graphics {
  const g = batched(new Graphics());
  const outline = { color: C.ink, width: 2.3 } as const;
  // Ground shadow on the badlands rock
  g.ellipse(1, 5, 19, 17).fill('rgba(16,10,28,0.48)');
  // Gleaming chrome two-slot toaster held tightly out in front (north)
  g.roundRect(-10, -22, 20, 13, 3).fill('#dce6f2').stroke(outline);
  g.rect(-7, -19, 14, 2.5).rect(-7, -14.5, 14, 2.5).fill('#2a233d');
  // Golden corner of toast peeking from the top slot + red push lever
  g.roundRect(-5, -20.5, 7, 3, 1).fill('#e8a84a');
  g.rect(10, -17, 3, 3.5).fill('#e6485c').stroke({ color: C.ink, width: 1.2 });
  // Mint alien hands clutching the sides of the toaster
  g.circle(-11, -13, 3.6).circle(11, -13, 3.6).fill(C.mint).stroke({ color: C.ink, width: 1.8 });
  // Signature black turtleneck shoulders (with crisp rim highlight so it reads on dark ground)
  g.ellipse(0, 4, 16, 10).fill('#1a1824').stroke({ color: '#6b6588', width: 2 });
  g.ellipse(0, 4, 16, 10).stroke(outline);
  // Swept alien antennae
  g.moveTo(-4, 4).lineTo(-10, 12).moveTo(4, 4).lineTo(10, 12).stroke({ color: C.ink, width: 3.4, cap: 'round' });
  g.moveTo(-4, 4).lineTo(-10, 12).moveTo(4, 4).lineTo(10, 12).stroke({ color: C.mint, width: 1.8, cap: 'round' });
  g.circle(-10, 12, 2.2).circle(10, 12, 2.2).fill(C.mint).stroke({ color: C.ink, width: 1.2 });
  // Mint alien head + tiny round spectacles rim
  g.circle(0, 0, 8.8).fill(C.mint).stroke(outline);
  g.circle(-3.2, -5.5, 2.3).circle(3.2, -5.5, 2.3).fill('#1b1433').stroke({ color: '#eef4ff', width: 1 });
  return g;
}

/** Each sketch, its own bounding box and its tilt. */
const FALLBACK: Record<MapCollectibleId, { draw: () => Graphics; w: number; h: number; rot: number }> = {
  cherry_pie: { draw: () => new Graphics().ellipse(0, 6, 50, 30).fill('#b4d7db')
    .ellipse(0, -4, 44, 25).fill('#ad3e58').stroke({ color: '#dea359', width: 6 })
    .moveTo(-31, -17).lineTo(8, 16).moveTo(-12, -23).lineTo(29, 12)
    .moveTo(-30, 11).lineTo(10, -23).moveTo(-8, 16).lineTo(31, -16).stroke({ color: '#f3bd67', width: 5 }), w: 112, h: 96, rot: 0 },
  garden_gnome: { draw: () => new Graphics().roundRect(-31, 18, 46, 26, 8).fill('#367f73')
    .circle(-8, 1, 18).fill('#e8a48c').poly([-26, 1, -8, 34, 11, 3, -9, 11]).fill('#fff1d6')
    .poly([-29, -8, 4, -50, 14, -8]).fill('#d64c62').moveTo(13, 23)
    .quadraticCurveTo(38, -30, 44, -23).lineTo(44, 24).stroke({ color: '#ac876f', width: 3 }), w: 91, h: 113, rot: 0 },
  time_car: { draw: () => timeCarWedge(true), w: 96, h: 172, rot: 0 },
  slipper_flyer: { draw: slipperFlyer, w: 46, h: 58, rot: -0.14 },
  astronomer: { draw: volunteerAstronomer, w: 56, h: 46, rot: 0 },
  saucer_photo: { draw: saucerPhoto, w: 50, h: 44, rot: 0.08 },
  obelisk_crate: { draw: obeliskCrate, w: 48, h: 42, rot: -0.1 },
  defibrillator: { draw: strayDefibrillator, w: 50, h: 38, rot: 0.06 },
  shrimp_tower: { draw: shrimpTower, w: 50, h: 42, rot: 0 },
  krix: { draw: krixIntern, w: 42, h: 46, rot: -0.35 },
};

function fallbackScale(id: MapCollectibleId): number {
  const [w, h] = PICKUP_SIZE[id];
  const f = FALLBACK[id];
  return Math.min(w / f.w, h / f.h);
}

/**
 * The primitive drawing of a pickup, scaled up to the footprint of its art (`PICKUP_SIZE`) and
 * centred on the origin: what the map and the trophy room show when `flight/pickup_<id>` is missing.
 */
export function pickupFallback(id: MapCollectibleId): Graphics {
  const g = FALLBACK[id].draw();
  g.scale.set(fallbackScale(id));
  g.rotation = FALLBACK[id].rot;
  return g;
}

// ---------------------------------------------------------------- the figure

/**
 * Words written on a pickup by code (art carries no text): where they sit on the art, in the art's
 * px from its centre, and on the fallback sketch, in the sketch's own px.
 */
interface Caption {
  text: () => string;
  color: string;
  art: { x: number; y: number; size: number; maxW: number; rot: number };
  sketch: { x: number; y: number; size: number; maxW: number };
}

const CAPTIONS: Partial<Record<MapCollectibleId, Caption>> = {
  // the header is LOST or PERDU
  slipper_flyer: {
    text: () => tr().mapCollectibles.flyerHeader,
    color: '#fff8e8',
    art: { x: -1, y: -20, size: 11, maxW: 33, rot: 0 },
    sketch: { x: 0, y: -12.5, size: 9, maxW: 32 },
  },
  obelisk_crate: {
    text: () => 'O™',
    color: '#fff4d8',
    art: { x: -6, y: 19, size: 15, maxW: 34, rot: -0.087 },
    sketch: { x: -7, y: 8.5, size: 9, maxW: 22 },
  },
};

/** The whole art is drawn upright; these pickups sit at a tilt on the map. */
const ART_TILT: Partial<Record<MapCollectibleId, number>> = { slipper_flyer: -0.1 };

const MOUTH = '#3a1830';
const TONGUE = '#d3827c';

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Eyes, lids and mouth of a person, drawn by code on the head layer so they can move. */
class Face {
  private readonly eyes: Graphics[] = [];
  private readonly lids: Graphics[] = [];
  private readonly shut: Graphics[] = [];
  private readonly smile: Graphics;
  private readonly open: Graphics;
  private readonly ex: number[] = [];
  private readonly ey: number[] = [];

  /** `head` is the layer the face rides on; `k` the figure's scale. */
  constructor(private readonly rig: PersonRig, head: RigPart, into: Container, private readonly k: number) {
    const ink = { color: C.ink, width: 2.2 * k, cap: 'round' } as const;
    for (const e of rig.eyes) {
      const x = (e.x - head.px) * k;
      const y = (e.y - head.py) * k;
      this.ex.push(x);
      this.ey.push(y);
      const p = rig.pupil;
      const eye = batched(new Graphics());
      if (p) eye.ellipse(0, 0, p.rx * k, p.ry * k).fill(C.ink).circle(-p.rx * 0.3 * k, -p.ry * 0.38 * k, 1.5 * k).fill('#d8ffdf');
      else eye.ellipse(0, 0, e.rx * k, e.ry * k).fill(C.ink);
      eye.position.set(x, y);
      this.eyes.push(eye);
      into.addChild(eye);
      if (!p) continue;
      // a lid that comes down from the top of the eye, and the line of a shut eye
      const lid = batched(new Graphics()).ellipse(0, e.ry * k, (e.rx + 0.4) * k, (e.ry + 0.4) * k).fill(rig.lid).stroke({ color: C.ink, width: 2.4 * k });
      lid.position.set(x, y - e.ry * k);
      const line = batched(new Graphics()).moveTo(-e.rx * 0.7 * k, 0).quadraticCurveTo(0, e.ry * 0.45 * k, e.rx * 0.7 * k, 0).stroke(ink);
      line.position.set(x, y + e.ry * 0.1 * k);
      this.lids.push(lid);
      this.shut.push(line);
      into.addChild(lid, line);
    }
    const m = rig.mouth;
    const half = (m.w / 2) * k;
    this.smile = batched(new Graphics()).moveTo(-half, -0.5 * k).quadraticCurveTo(0, half * 0.75, half, -0.5 * k).stroke(ink);
    this.open = batched(new Graphics())
      .ellipse(0, 0, m.w * 0.36 * k, m.w * 0.5 * k).fill(MOUTH).stroke({ color: C.ink, width: 2 * k })
      .ellipse(0, m.w * 0.24 * k, m.w * 0.2 * k, m.w * 0.16 * k).fill(TONGUE);
    this.smile.position.set((m.x - head.px) * k, (m.y - head.py) * k);
    this.open.position.set(this.smile.x, this.smile.y + m.w * 0.12 * k);
    this.open.alpha = 0;
    into.addChild(this.smile, this.open);
    this.sync(0, 0, 0, 0);
  }

  sync(lookX: number, lookY: number, lid: number, yawn: number): void {
    const { rig, k } = this;
    const p = rig.pupil;
    for (let i = 0; i < this.eyes.length; i++) {
      const eye = this.eyes[i]!;
      if (p) {
        eye.position.set(this.ex[i]! + lookX * p.travelX * k, this.ey[i]! + lookY * p.travelY * k);
        const cover = this.lids[i]!;
        cover.scale.y = lid;
        cover.alpha = lid > 0.03 ? 1 : 0;
        this.shut[i]!.alpha = clamp01((lid - 0.6) / 0.3);
      } else {
        // dot eyes: the dot itself glances and squashes shut
        eye.position.set(this.ex[i]! + lookX * 1.5 * k, this.ey[i]! + lookY * k);
        eye.scale.y = 1 - 0.8 * lid;
      }
    }
    const gape = clamp01(yawn * 2.5);
    this.smile.alpha = 1 - gape;
    this.open.alpha = gape;
    this.open.scale.set(0.45 + 0.55 * yawn);
  }
}

function part(m: PartMove | undefined, f: keyof PartMove): number {
  return m?.[f] ?? 0;
}

/**
 * A town pickup as it stands on the map, centred on `root`'s origin and `PICKUP_SIZE[id] × scale`
 * big: its art (or the primitive sketch when the art is missing) and the words written on it.
 * People (`PERSON_RIGS`) are built from layers and idle: they blink, glance sideways, yawn and have
 * two beats of their own (`figurePose`). Objects stand still. Built once; `sync` only moves, turns,
 * scales and fades. The trophy room reuses it at a larger `scale`.
 */
export class PickupFigure {
  readonly root = new Container();
  /** Footprint in px at this scale. */
  readonly w: number;
  readonly h: number;
  /** True when the figure has moving layers (a person whose art loaded). */
  readonly alive: boolean;
  private readonly rig: PersonRig | null = null;
  private readonly layers: Container[] = [];
  private readonly baseX: number[] = [];
  private readonly baseY: number[] = [];
  private readonly face: Face | null = null;
  private readonly pose = newFigurePose();
  private readonly seed: number;
  private readonly caption: LabelStyle | null = null;

  constructor(assets: Assets, id: MapCollectibleId, private readonly k = 1) {
    const [w, h] = PICKUP_SIZE[id];
    this.w = w * k;
    this.h = h * k;
    this.seed = figureSeed(id);
    const rig = PERSON_RIGS[id];
    const words = CAPTIONS[id];
    if (rig && rig.parts.every((p) => assets.get(p.key))) {
      this.rig = rig;
      for (const p of rig.parts) {
        const layer = new Container();
        const sprite = artSprite(assets, p.key, p.w * k, p.h * k)!;
        sprite.position.set((p.x + p.w / 2 - p.px) * k, (p.y + p.h / 2 - p.py) * k);
        layer.addChild(sprite);
        layer.position.set((p.px - w / 2) * k, (p.py - h / 2) * k);
        this.layers.push(layer);
        this.baseX.push(layer.x);
        this.baseY.push(layer.y);
        if (p.face) this.face = new Face(rig, p, layer, k);
        this.root.addChild(layer);
      }
    } else {
      const sprite = artSprite(assets, pickupKey(id), this.w, this.h);
      if (sprite) {
        this.root.addChild(sprite);
        this.root.rotation = ART_TILT[id] ?? 0;
        if (words) {
          this.caption = { size: words.art.size * k, color: words.color, weight: 900 };
          const label = new Label(this.caption).set(words.text(), words.art.x * k, words.art.y * k, words.art.maxW * k);
          label.rotation = words.art.rot;
          this.root.addChild(label);
        }
      } else {
        const sketch = pickupFallback(id);
        const f = sketch.scale.x * k;
        sketch.scale.set(f);
        this.root.addChild(sketch);
        if (words) {
          // the sketch is tilted as a whole: turn the words with it
          const cos = Math.cos(sketch.rotation);
          const sin = Math.sin(sketch.rotation);
          const { x, y } = words.sketch;
          this.caption = { size: words.sketch.size * f, color: words.color, weight: 900 };
          const label = new Label(this.caption).set(words.text(), (x * cos - y * sin) * f, (x * sin + y * cos) * f, words.sketch.maxW * f);
          label.rotation = sketch.rotation;
          this.root.addChild(label);
        }
      }
    }
    this.alive = !!this.rig;
  }

  /** `t` is any clock in seconds that only runs forward (the game's `ctx.time`). */
  sync(t: number, reducedMotion: boolean): void {
    const rig = this.rig;
    if (!rig) return;
    const k = this.k;
    const pose = figurePose(t, this.seed, reducedMotion, this.pose, rig.pattern);
    const lookX = Math.max(-1, Math.min(1, pose.lookX + rig.actBLook.x * pose.actB));
    const lookY = rig.actBLook.y * pose.actB;
    const { yawn, actA, actB, wobble } = pose;
    for (let i = 0; i < this.layers.length; i++) {
      const p = rig.parts[i]!;
      const layer = this.layers[i]!;
      layer.x = this.baseX[i]! + k * (part(p.look, 'dx') * lookX + part(p.yawn, 'dx') * yawn + part(p.actA, 'dx') * actA + part(p.actB, 'dx') * actB + part(p.wobble, 'dx') * wobble);
      layer.y = this.baseY[i]! + k * (part(p.look, 'dy') * lookX + part(p.yawn, 'dy') * yawn + part(p.actA, 'dy') * actA + part(p.actB, 'dy') * actB + part(p.wobble, 'dy') * wobble);
      layer.rotation = part(p.look, 'rot') * lookX + part(p.yawn, 'rot') * yawn + part(p.actA, 'rot') * actA + part(p.actB, 'rot') * actB + part(p.wobble, 'rot') * wobble;
      layer.scale.set(1 + part(p.yawn, 'scale') * yawn + part(p.actA, 'scale') * actA + part(p.actB, 'scale') * actB + part(p.wobble, 'scale') * wobble);
    }
    this.face?.sync(lookX, lookY, Math.max(pose.lid, rig.actALid * actA), yawn);
  }
}

// ---------------------------------------------------------------- on the map

const TAG = { size: 14, color: C.paperInk, weight: 800, align: 'left' } as const;
const TAG_H = 26;
/** The name tag shows within this distance of the saucer, fading in over the last `TAG_FADE` px. */
const TAG_NEAR = 260;
const TAG_FADE = 40;

/**
 * What a pickup is called: a small paper tag under it while the saucer is near. The flight view
 * puts it in its FLIGHT_BUBBLES layer (above the map, under the saucer).
 */
class NameTag {
  readonly root = new Container();
  readonly w: number;
  readonly h = TAG_H + 8;
  /** The pill and its words: slid sideways when the pickup is near the edge of the screen. */
  private readonly plate = new Container();

  constructor(private readonly x: number, y: number, name: string) {
    const text = Math.min(190, measure(name, TAG.size, TAG.weight));
    const w = this.w = text + 40;
    this.root.position.set(x, y);
    this.plate.addChild(
      panelPath(batched(new Graphics()), -w / 2, 8, w, TAG_H, { fill: C.paper, r: TAG_H / 2, lineW: 2.5, shadow: 3 })
        // the mint diamond of the minimap mark
        .poly([-w / 2 + 16, 14.5, -w / 2 + 22.5, 21, -w / 2 + 16, 27.5, -w / 2 + 9.5, 21]).fill(C.mintDeep).stroke({ color: C.ink, width: 1.5 }),
      new Label(TAG).set(name, -w / 2 + 28, 8 + TAG_H / 2, text),
    );
    // a notch pointing up at the pickup
    this.root.addChild(this.plate, batched(new Graphics()).poly([-6, 9.5, 0, 1, 6, 9.5]).fill(C.paper));
    this.root.alpha = 0;
    this.root.visible = false;
  }

  /** How far the pill is slid from under the pickup. */
  get shift(): number {
    return this.plate.x;
  }

  /**
   * `d` is how far the saucer is; `lock` the hover progress (the tag gives way to the lock ring);
   * `camX` the left edge of the view, so the pill stays on screen.
   */
  sync(present: boolean, d: number, lock: number, reduced: boolean, camX: number): void {
    const near = reduced ? Number(d < TAG_NEAR - TAG_FADE / 2) : clamp01((TAG_NEAR - d) / TAG_FADE);
    const a = present ? near * clamp01(1 - lock * 4) : 0;
    const on = a > 0.01;
    // shown or not is a real state change; the fade is alpha
    if (this.root.visible !== on) this.root.visible = on;
    if (!on) return;
    this.root.alpha = a;
    const half = this.w / 2 + 6;
    const free = this.w / 2 - 16; // the notch stays on the pill
    const want = Math.max(camX + half, Math.min(camX + VIEW_W - half, this.x)) - this.x;
    this.plate.x = Math.max(-free, Math.min(free, want));
  }
}

const SHOUT = { size: 16, color: C.paperInk, weight: 900, italic: true } as const;

/**
 * Someone shouting about the pickup from a window: a paper bubble whose tail points at the window.
 * The flight view puts `root` in its FLIGHT_BUBBLES layer. It speaks for ~4 s, rests ~3 s, while the
 * pickup is still there and the window is on screen.
 */
class PickupShout {
  readonly root = new Container();

  constructor(private readonly at: { x: number; y: number }, text: string) {
    const w = Math.min(300, measure(text, 16, 900, true) + 30);
    this.root.position.set(at.x, at.y);
    // the bubble sits below the window (over the street), its tail pointing up at it
    this.root.addChild(panelPath(new Graphics(), -w / 2 + 40, 20, w, 36, { fill: C.paper, r: 18, lineW: 2.5, shadow: 3 })
      .poly([-6, 21, 0, 4, 10, 21]).fill(C.paper), new Label(SHOUT).set(text, 40, 39, w - 20));
    this.root.alpha = 0;
  }

  sync(cam: CameraView, t: number, reduced: boolean, present: boolean): void {
    const on = present && cam.sees(this.at.x, this.at.y + 40, 200);
    if (this.root.visible !== on) this.root.visible = on;
    if (!on) return;
    const k = (t % 7) / 4;
    // fade in and out with alpha (the cycle is not a state change)
    this.root.alpha = k >= 1 ? 0 : Math.min(1, k * 10, (1 - k) * 8);
    this.root.y = this.at.y + (reduced || k >= 1 ? 0 : -Math.sin(k * Math.PI) * 4);
  }
}

export class MapCollectibleView {
  readonly root = new Container();
  /** The window shout (see PickupShout) and the name tag, for the flight's bubble layer. */
  readonly bubbles = new Container();
  private readonly figure: PickupFigure;
  private readonly shouter: PickupShout | null;
  private readonly tag: NameTag;
  private readonly glint = sparkle(15);
  private readonly steam: Graphics | null;
  private readonly lock = new Container();
  private readonly progress: Graphics[] = [];
  /** How far the prop, its lock ring and its tag reach from the pickup's centre (culling). */
  private readonly reach: number;

  constructor(assets: Assets, private readonly pickup: MapCollectible) {
    const { id, x, y } = pickup.def;
    const words = tr().mapCollectibles.items[id];
    const line = (words as { shout?: string }).shout;
    this.shouter = pickup.def.shout && line ? new PickupShout(pickup.def.shout, line) : null;
    this.figure = new PickupFigure(assets, id);
    const { w, h } = this.figure;
    this.tag = new NameTag(x, y + h / 2 + 2, words.name);
    if (this.shouter) this.bubbles.addChild(this.shouter.root);
    this.bubbles.addChild(this.tag.root);
    // the lock ring goes round the whole prop
    const ringR = Math.max(56, Math.max(w, h) / 2 + 8);
    this.reach = Math.max(ringR + 8, h / 2 + 2 + this.tag.h, this.tag.w / 2);
    this.root.position.set(x, y);
    this.glint.position.set(w / 2 - 6, -h / 2 + 8);
    this.steam = id === 'cherry_pie' ? new Graphics().moveTo(12, -21).bezierCurveTo(0, -36, 26, -45, 22, -60)
      .bezierCurveTo(20, -69, 8, -65, 9, -57).stroke({ color: '#e6e3d6', alpha: 0.46, width: 3.5, cap: 'round' }) : null;
    this.root.addChild(this.figure.root, this.glint, this.lock);
    if (this.steam) this.root.addChild(this.steam);
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / SEGMENTS;
      const end = angle + 0.39;
      const slot = arc(batched(new Graphics()), ringR, angle, end)
        .stroke({ color: C.ink, width: 8, cap: 'round' });
      const fill = arc(batched(new Graphics()), ringR, angle, end)
        .stroke({ color: C.mint, width: 4, cap: 'round' });
      this.progress.push(fill);
      this.lock.addChild(slot, fill);
    }
  }

  /** `sx`, `sy`: where the saucer is (the name tag shows when it is near). */
  sync(cam: CameraView, t: number, reduced: boolean, sx: number, sy: number): void {
    const { x, y } = this.pickup.def;
    const present = !this.pickup.collected;
    this.shouter?.sync(cam, t, reduced, present);
    // collected or off-screen is a real state change: `visible` (alpha 0 would still batch and draw)
    const show = present && cam.sees(x, y, this.reach);
    if (this.root.visible !== show) this.root.visible = show;
    this.tag.sync(show, Math.hypot(sx - x, sy - y), this.pickup.progress, reduced, cam.x);
    if (!show) return;
    this.figure.sync(t, reduced);
    if (this.steam) {
      this.steam.rotation = reduced ? 0 : Math.sin(t * 2) * 0.11;
      this.steam.alpha = reduced ? 0.82 : 0.72 + Math.sin(t * 1.4) * 0.22;
    }
    this.glint.alpha = reduced ? 0.85 : 0.72 + 0.22 * Math.sin(t * 4);
    const filled = this.pickup.progress * SEGMENTS;
    this.lock.alpha = Math.min(1, filled);
    for (let i = 0; i < SEGMENTS; i++) {
      this.progress[i]!.alpha = 0.25 + 0.75 * Math.max(0, Math.min(1, filled - i));
    }
  }

  /**
   * The screen box route pills keep out of: the prop and, while it shows, its name tag. False when
   * the pickup is not on screen.
   */
  avoid(b: Box, camX: number, camY: number): boolean {
    if (!this.root.visible) return false;
    const { w, h } = this.figure;
    b.x = this.root.x - camX - w / 2 - 8;
    b.y = this.root.y - camY - h / 2 - 8;
    b.w = w + 16;
    b.h = h + 16;
    if (this.tag.root.visible) {
      // widen to the pill, wherever it slid
      const left = Math.min(b.x, this.root.x + this.tag.shift - camX - this.tag.w / 2 - 4);
      const right = Math.max(b.x + b.w, this.root.x + this.tag.shift - camX + this.tag.w / 2 + 4);
      b.x = left;
      b.w = right - left;
      b.h += this.tag.h;
    }
    return true;
  }
}

export class MapCollectibleToast extends Container {
  constructor(id: MapCollectibleId) {
    super();
    const words = tr().mapCollectibles;
    const panel = new HudPanel().set(316, 44, C.mint);
    this.position.set(VIEW_W / 2 - 158, 216);
    this.addChild(panel, new Label(TOAST).set(fmt(words.toast, { name: words.items[id].name }), 158, 22, 290));
  }

  sync(remaining: number, reduced: boolean): void {
    this.alpha = reduced ? Number(remaining > 0) : Math.min(1, remaining * 4);
  }
}

export function mapCollectibleMinimapMark(pickup: MapCollectible, scale: number): Graphics {
  const mark = new Graphics().poly([0, -5, 5, 0, 0, 5, -5, 0]).fill(C.mint).stroke({ color: C.ink, width: 1.5 });
  mark.position.set(pickup.def.x * scale, pickup.def.y * scale);
  return mark;
}
