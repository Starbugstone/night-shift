import { Container, Graphics, Texture, TilingSprite } from 'pixi.js';
import { VIEW_H, VIEW_W, type Assets } from '../../contracts';
import { Glow, ScreenTint, glowTexture } from '../../core/gfx/glow';
import { Label } from '../../core/gfx/text';
import { paintedTexture } from '../../core/gfx/textures';
import { tr } from '../../i18n';
import { clamp } from '../../ui/draw';
import { artSprite, artTex } from '../../ui/views/art';
import { HudPanel } from '../../ui/views/hud';
import { wrapAngle } from '../geometry';
import type { HazardField } from '../hazards';
import { TIME_CAR, type TimeCar } from '../time-car';
import type { CameraView } from './world';

export const TOWER_CLOCK = { x: 824, y: 272, radius: 41 } as const;
export const TOWER_ROD = { x: 826, y: 178 } as const;
const AXLE = { x: 31, y: 45 } as const;
const TRACK_LENGTH = 324;
const REVEAL_BEFORE = 0.48;
const REVEAL_END = 1.12;
const ICE = '#d5edff';
const HOT = '#fffaf0';
const PAGE_BLUE = '225,244,255';

function unit(n: number): number {
  return clamp(n, 0, 1);
}

function ease(n: number): number {
  const p = unit(n);
  return p * p * (3 - 2 * p);
}

/** Distance to the actual detector sector, including its two rays and its far rim. */
function coneClearance(x: number, y: number, angle: number, half: number, range: number): number {
  const distance = Math.hypot(x, y);
  const outside = Math.abs(wrapAngle(Math.atan2(y, x) - angle)) - half;
  if (outside <= 0) return Math.max(0, distance - range);
  const along = distance * Math.cos(outside);
  return Math.hypot(distance * Math.sin(outside), along - clamp(along, 0, range));
}

/** Keep detectors at full scale for nearby steering and ease out of the reveal on approach. */
function detectorReveal(field: HazardField, x: number, y: number): number {
  let clearance = 100;
  for (let i = 0; i < field.defs.length; i++) {
    const d = field.defs[i]!;
    switch (d.type) {
      case 'camera':
      case 'watcher':
        clearance = Math.min(clearance, coneClearance(x - d.x, y - d.y, field.a[i]!, d.half, d.range));
        break;
      case 'car': {
        const car = field.cars[i]?.[0];
        if (!car) break;
        clearance = Math.min(clearance, coneClearance(x - car.ox, y - car.oy, car.cone, d.coneHalf, d.coneRange));
        if (d.barR > 0) clearance = Math.min(clearance, Math.hypot(x - car.x, y - car.y) - d.barR);
        break;
      }
    }
  }
  return ease((clearance - 56) / (100 - 56));
}

function sparkle(x: number, y: number, r: number): Graphics {
  const a = r * 0.15;
  const star = new Graphics().poly([0, -r, a, -a, r * 0.58, 0, a, a, 0, r, -a, a, -r * 0.58, 0, -a, -a])
    .fill(HOT).stroke({ color: ICE, width: 1.5 });
  star.position.set(x, y);
  return star;
}

function trackTexture(assets: Assets): Texture {
  return artTex(assets, 'flight/tyre_fire55') ?? paintedTexture('crest-valley|tyre-fire', 24, 96, g => {
    g.fillStyle = '#372632';
    g.fillRect(8, 0, 8, 96);
    g.fillStyle = '#e59748';
    g.beginPath();
    g.moveTo(9, 0);
    g.lineTo(19, 39);
    g.lineTo(13, 32);
    g.lineTo(18, 65);
    g.lineTo(9, 96);
    g.fill();
  });
}

/** The fixed event belongs to the shift clock. These layers only change what the camera shows. */
export class CrestValleyStrike {
  readonly sky = new Graphics().rect(0, 0, VIEW_W, VIEW_H).fill('#263143');
  readonly ground = new Container();
  readonly world = new Container();
  readonly screen = new Container();
  readonly dial = new Glow(glowTexture(PAGE_BLUE));
  private readonly bolt: Container;
  private readonly rodFlash = new Glow(glowTexture(PAGE_BLUE));
  private readonly contact = new Container();
  private readonly contactGlow = new Glow(glowTexture(PAGE_BLUE));
  private readonly carFlash = new Glow(glowTexture('244,251,255'));
  private readonly flashCore = new Glow(glowTexture('255,255,255'));
  private readonly speedFlare = new Container();
  private readonly tyres: TilingSprite[] = [];
  private readonly fireFront = new Container();
  private readonly wash = new ScreenTint(Texture.WHITE);
  private readonly edge = new Container();
  private readonly arrow = new Graphics().poly([0, -14, 13, 9, 0, 4, -13, 9])
    .fill(ICE).stroke({ color: '#273453', width: 2 });
  private readonly canWitness: boolean;
  private flashAt = -1;

  constructor(assets: Assets, private readonly car: TimeCar) {
    this.canWitness = car.elapsed < TIME_CAR.strike;
    this.bolt = artSprite(assets, 'flight/tower_bolt55') ?? new Graphics()
      .moveTo(-22, -112).lineTo(4, -45).lineTo(-14, -1).lineTo(19, 7).lineTo(0, 112)
      .stroke({ color: '#f5fbff', width: 7, join: 'round' });
    // Both the sprite and the fallback end at y=112 in their centred coordinates.
    this.bolt.pivot.y = 112;
    this.bolt.position.set(TOWER_ROD.x, TOWER_ROD.y);
    this.bolt.scale.set(1.45, 1.75);
    this.bolt.rotation = -0.38;
    this.world.addChild(this.bolt, this.rodFlash);

    const contactPath = [0, TIME_CAR.cable.south - TIME_CAR.bay.y, -9, 105, 12, 73, -9, 42, 9, 22, 0, 0];
    const arc = new Graphics().poly(contactPath, false)
      .stroke({ color: '#86bdff', width: 7, alpha: 0.62, join: 'round' })
      .poly(contactPath, false)
      .stroke({ color: HOT, width: 2.6, join: 'round' });
    this.contact.addChild(this.contactGlow, arc, sparkle(0, 0, 24));
    this.speedFlare.addChild(sparkle(-32, -AXLE.x, 20), sparkle(-32, AXLE.x, 20),
      new Label({ size: 27, weight: 900, color: HOT, outline: '#395785', outlineW: 4 }).set('88', 0, -52));
    this.world.addChild(this.carFlash, this.flashCore, this.contact, this.speedFlare);

    const texture = trackTexture(assets);
    // The long axis points east. The short fixed segment covers the tyre print under the vanishing car.
    this.ground.rotation = -Math.PI / 2;
    for (const x of [-AXLE.x, AXLE.x]) {
      const under = new TilingSprite({ texture, width: 24, height: AXLE.y });
      under.anchor.x = 0.5;
      under.position.set(x, -AXLE.y);
      const strip = new TilingSprite({ texture, width: 24, height: TRACK_LENGTH });
      strip.anchor.x = 0.5;
      strip.x = x;
      this.tyres.push(strip);
      this.ground.addChild(under, strip);
      this.fireFront.addChild(new Glow(glowTexture('255,189,95')).place(x, 0, 21, 32));
    }
    this.ground.addChild(this.fireFront);

    this.wash.tint = ICE;
    const badge = new HudPanel().set(126, 42, ICE);
    badge.position.set(-63, -21);
    const glyph = new Graphics().poly([-35, -13, -48, 2, -39, 2, -43, 13, -28, -4, -37, -4]).fill(ICE);
    glyph.x = -9;
    this.edge.addChild(badge, glyph, new Label({ size: 19, weight: 900, color: HOT })
      .set(tr().crestValley.strikeTime, 12, 0, 84), this.arrow);
    this.screen.addChild(this.wash, this.edge);
  }

  get age(): number { return this.car.elapsed - TIME_CAR.strike; }

  /** Pull back only if the tower can be exposed in a modest reveal. Screen-space input stays anchored. */
  revealScale(camX: number, camY: number, saucerX: number, saucerY: number, field: HazardField): number {
    const age = this.age;
    const holdingCar = this.car.phase === 'open' && this.car.matching;
    if (!this.canWitness || age < -REVEAL_BEFORE || age >= REVEAL_END || holdingCar) return 1;
    const sx = saucerX - camX, sy = saucerY - camY;
    const rx = TOWER_ROD.x - camX, ry = TOWER_ROD.y - camY;
    let target = 1;
    if (ry < 240 && sy > 240) target = Math.min(target, (sy - 240) / (sy - ry));
    if (rx < 112 && sx > 112) target = Math.min(target, (sx - 112) / (sx - rx));
    if (rx > 426 && sx < 426) target = Math.min(target, (426 - sx) / (rx - sx));
    if (target < 0.55 || target === 1) return 1;
    const amount = ease((age + REVEAL_BEFORE) / REVEAL_BEFORE) * (1 - ease((age - 0.58) / (REVEAL_END - 0.58)));
    return 1 - (1 - target) * amount * detectorReveal(field, saucerX, saucerY);
  }

  sync(cam: CameraView, reduced: boolean): void {
    const age = this.age;
    const active = this.canWitness && age >= 0;
    const pulse = active ? 1 - unit(age / 0.92) : 0;
    this.bolt.visible = active && age < (reduced ? 0.56 : 0.53) && cam.sees(TOWER_ROD.x, TOWER_ROD.y, 260);
    this.bolt.alpha = reduced ? 0.44 : 1 - unit((age - 0.16) / 0.37);
    this.dial.place(0, 0, 62, 57, pulse * (reduced ? 0.38 : 0.98));
    this.rodFlash.place(TOWER_ROD.x, TOWER_ROD.y, 39, 42, this.bolt.visible ? this.bolt.alpha * 0.86 : 0);
    if (active && age < 0.38 && this.flashAt < 0) this.flashAt = age;
    this.wash.strength = !active ? 0 : reduced ? 0.11 * (1 - ease(age / 0.56)) :
      age === this.flashAt ? 0.72 : 0.37 * (1 - ease(age / 0.37));

    const rx = cam.screenX(TOWER_CLOCK.x), ry = cam.screenY(TOWER_CLOCK.y);
    const radius = TOWER_CLOCK.radius * cam.world.scale.x;
    const clockInView = rx + radius > 0 && rx - radius < VIEW_W && ry + radius > 0 && ry - radius < VIEW_H;
    this.edge.visible = active && age < REVEAL_END && !clockInView;
    if (this.edge.visible) {
      const dx = rx - VIEW_W / 2, dy = ry - VIEW_H / 2;
      const k = Math.max(1, Math.abs(dx) / 188, Math.abs(dy) / 270);
      const y = VIEW_H / 2 + dy / k;
      this.edge.position.set(Math.min(VIEW_W / 2 + dx / k, y < 240 ? 382 : VIEW_W - 70), y);
      this.edge.alpha = 1 - ease((age - 0.69) / 0.43);
      this.arrow.rotation = Math.atan2(dy, dx) + Math.PI / 2;
      this.arrow.position.set(Math.sin(this.arrow.rotation) * 38, -Math.cos(this.arrow.rotation) * 32);
    }

    const { x, y } = this.car.position;
    const missed = this.car.phase === 'missed';
    const contactOn = missed && active && age < 0.52 && cam.sees(x, y, 240);
    this.contact.visible = this.speedFlare.visible = contactOn;
    const bloom = contactOn ? 1 - ease(age / 0.29) : 0;
    this.carFlash.place(x, y, 170, 112, bloom * (reduced ? 0.34 : 1));
    this.flashCore.place(x + 5, y, 113, 64, reduced ? 0 : bloom * bloom);
    if (contactOn) {
      this.contact.position.set(x - TIME_CAR.hookOffset, y);
      this.contact.alpha = (reduced ? 0.54 : 1) * (1 - ease((age - 0.12) / 0.26));
      this.contactGlow.place(0, 0, 57, 53);
      this.speedFlare.position.set(x + (reduced ? 0 : 52 * ease(age / 0.52)), y);
      this.speedFlare.alpha = (reduced ? 0.56 : 1) * (1 - ease((age - 0.19) / 0.33));
    }

    const burn = active ? ease((age - 0.055) / 0.4) : 1;
    this.ground.visible = missed && burn > 0 && cam.sees(x + (TRACK_LENGTH - AXLE.y) / 2, y, (TRACK_LENGTH + AXLE.y) / 2);
    if (!this.ground.visible) return;
    this.ground.position.set(x, y);
    this.ground.alpha = reduced ? 0.82 * Math.min(1, burn * 2) : 0.82 + 0.18 * (1 - unit(age));
    // Inverse tile scale keeps the texture's repeat at 96 px as the strip unfurls at its far end.
    const length = reduced ? 1 : Math.max(0.005, burn);
    for (const strip of this.tyres) {
      strip.scale.y = length;
      strip.tileScale.y = 1 / length;
    }
    this.fireFront.visible = !reduced && burn < 1;
    this.fireFront.y = TRACK_LENGTH * length;
    this.fireFront.alpha = 1 - burn * 0.55;
  }
}
