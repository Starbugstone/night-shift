import { Container, Graphics } from 'pixi.js';
import { VIEW_W, type MapCollectibleId } from '../../contracts';
import { batched } from '../../core/gfx/shapes';
import { Label } from '../../core/gfx/text';
import { fmt, tr } from '../../i18n';
import { C } from '../../ui/theme';
import { HudPanel } from '../../ui/views/hud';
import type { MapCollectible } from '../collectible';
import { RING_R } from '../sim';
import { arc } from './tells';
import type { CameraView } from './world';

const TOAST = { size: 20, color: C.mint, weight: 800 } as const;
export const PICKUP_VIEW_R = RING_R + 16;
const SEGMENTS = 12;

function sparkle(r: number): Graphics {
  return new Graphics().poly([0, -r, r * 0.28, -r * 0.28, r, 0, r * 0.28, r * 0.28,
    0, r, -r * 0.28, r * 0.28, -r, 0, -r * 0.28, -r * 0.28]).fill(C.mint);
}

const FLYER_HDR = { size: 9, color: '#fff8e8', weight: 900 } as const;

function slipperFlyer(): Container {
  const root = new Container();
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
  const header = new Label(FLYER_HDR).set(tr().mapCollectibles.flyerHeader, 0, -12.5, 32);
  root.addChild(g, header);
  root.rotation = -0.14;
  return root;
}

const CRATE_MARK = { size: 9, color: '#fff4d8', weight: 900 } as const;

/** L3: volunteer astronomer camped on Birch Lane with a portable SETI dish, chair, thermos & sign. */
function volunteerAstronomer(): Container {
  const root = new Container();
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
  root.addChild(g);
  return root;
}

/** L4: Mrs. Pruitt's blurry saucer photo pinned on City Hall's exterior municipal noticeboard. */
function saucerPhoto(): Container {
  const root = new Container();
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
  root.addChild(g);
  root.rotation = 0.08;
  return root;
}

/** L5: the unaccounted OBELISK™ shipping crate on the fish-market boardwalk slip. */
function obeliskCrate(): Container {
  const root = new Container();
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
  const mark = new Label(CRATE_MARK).set('O™', -7, 8.5, 22);
  root.addChild(g, mark);
  root.rotation = -0.1;
  return root;
}

/** L6: stray hospital defibrillator trolley marked FOR THE MACHINE (Frankenstein nod). */
function strayDefibrillator(): Container {
  const root = new Container();
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
  // Bold red lightning bolt tag under the screen ("FOR THE MACHINE")
  g.poly([-6, 3, -9, 7, -5, 7, -7, 10, -1, 5.5, -5, 5.5]).fill('#d93f56');
  // Twin crimson shock paddles with coiled leads on the right side of the trolley
  g.moveTo(6, -5).quadraticCurveTo(10, -9, 13, -6).moveTo(6, 5).quadraticCurveTo(10, 9, 13, 6)
    .stroke({ color: C.ink, width: 1.8 });
  g.roundRect(10, -11, 8, 9, 2.5).fill('#e6485c').stroke({ color: C.ink, width: 1.8 });
  g.roundRect(10, 2, 8, 9, 2.5).fill('#e6485c').stroke({ color: C.ink, width: 1.8 });
  root.addChild(g);
  root.rotation = 0.06;
  return root;
}

/** L7: the shrimp tower on an aft promenade buffet cart (deep plum cloth frames silver + coral shrimp). */
function shrimpTower(): Container {
  const root = new Container();
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
  root.addChild(g);
  return root;
}

/** L8: Krix, the ex-intern in a black turtleneck clutching his gleaming toaster, on the east ridge. */
function krixIntern(): Container {
  const root = new Container();
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
  root.addChild(g);
  root.rotation = -0.35;
  return root;
}

const makeProp: Record<MapCollectibleId, () => Container> = {
  slipper_flyer: slipperFlyer,
  astronomer: volunteerAstronomer,
  saucer_photo: saucerPhoto,
  obelisk_crate: obeliskCrate,
  defibrillator: strayDefibrillator,
  shrimp_tower: shrimpTower,
  krix: krixIntern,
};

export class MapCollectibleView {
  readonly root = new Container();
  private readonly glint = sparkle(15);
  private readonly lock = new Container();
  private readonly progress: Graphics[] = [];

  constructor(private readonly pickup: MapCollectible) {
    const { id, x, y } = pickup.def;
    this.root.position.set(x, y);
    this.glint.position.set(29, -30);
    this.root.addChild(makeProp[id](), this.glint, this.lock);
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / SEGMENTS;
      const end = angle + 0.39;
      const slot = arc(batched(new Graphics()), PICKUP_VIEW_R - 4, angle, end)
        .stroke({ color: C.ink, width: 8, cap: 'round' });
      const fill = arc(batched(new Graphics()), PICKUP_VIEW_R - 4, angle, end)
        .stroke({ color: C.mint, width: 4, cap: 'round' });
      this.progress.push(fill);
      this.lock.addChild(slot, fill);
    }
  }

  sync(cam: CameraView, t: number, reduced: boolean): void {
    const { x, y } = this.pickup.def;
    // collected or off-screen is a real state change: `visible` (alpha 0 would still batch and draw)
    const show = !this.pickup.collected && cam.sees(x, y, PICKUP_VIEW_R);
    if (this.root.visible !== show) this.root.visible = show;
    if (!show) return;
    this.glint.alpha = reduced ? 0.85 : 0.72 + 0.22 * Math.sin(t * 4);
    const filled = this.pickup.progress * SEGMENTS;
    this.lock.alpha = Math.min(1, filled);
    for (let i = 0; i < SEGMENTS; i++) {
      this.progress[i]!.alpha = 0.25 + 0.75 * Math.max(0, Math.min(1, filled - i));
    }
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
