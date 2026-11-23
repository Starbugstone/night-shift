import { ART } from '../art-manifest';
import { VIEW_H, VIEW_W, type GameContext } from '../contracts';
import { GLOW, PC, P_SPARK, P_STAR, Particles, drawEdgeTint, drawGlow } from '../core/fx';
import { HUD_ROW, hudButton, hudMeter, hudPanel, hudTimer, type MeterState } from '../ui/hud';
import { HumanArt, RESTART } from './draw';
import { inside, type HazardState, type SleeperState } from './interior';
import { clamp, Joint, type Blade, type Circle, type Rect, type SwingingRect } from './ragdoll';
import type { Building, InteriorRoom, Opening } from './rooms/interior';
import type { Area, Sprite } from './rooms/layout';
import type { AbductSimulation } from './simulation';

/** Sunrise clock, between the sleeper meter and the camera fuse on row two. */
export const DEEP_HUD_SUNRISE_SLOT = { x: 202, y: 86, w: 132, h: 64 } as const;
/** Sunrise warning, beside the Snooze Ray and above the room/exit bar. */
export const DEEP_HUD_WARNING_SLOT = { x: 230, y: 831, w: 296, h: 45 } as const;

const TAU = Math.PI * 2;
const INK = '#1a162b';
const MINT = '#7cffcb';
const AMBER = '#ffd081';
const RED = '#ff697d';
const RED_RGB = '255,105,125';
const LIGHT = '#f1eeff';
const MUTED = '#bdb3d9';
const EMPTY_DASH: number[] = [];
const WARNING_DASH = [5, 7];
const EXIT_DASH = [4, 9];
const STAR_COUNT = 39;
const SLEEPER_CAPTIONS: Record<string, string> = {
  Brenda: 'Brenda was promised one night off.',
  Biscuit: 'The dog would like a word with the management.',
  Tiny: 'Your names are officially off the guest list.',
};
const WALL_COLORS = ['#423354', '#5b4b70', '#322943'] as const;
const PALETTES: Record<string, readonly [string, string]> = {
  'room/bg_suburb_bedroom': ['#332749', '#615071'],
  'room/bg_hallway': ['#372c47', '#59486b'],
  'room/bg_stairwell': ['#25384b', '#4c606d'],
  'room/bg_attic': ['#302638', '#564158'],
  'room/bg_living_room': ['#283448', '#475878'],
  'room/bg_kitchen': ['#304153', '#5f717c'],
  'room/bg_utility': ['#30384b', '#62677c'],
  'room/bg_garage': ['#263342', '#535d6c'],
  'room/bg_museum': ['#243745', '#4d6375'],
  'room/bg_vault': ['#273445', '#4d5674'],
  'room/bg_club': ['#2c2143', '#633960'],
  'room/bg_duct': ['#24353b', '#495d67'],
  'room/bg_office': ['#302e45', '#635069'],
  'room/bg_corridor': ['#272d44', '#4d5577'],
  'room/bg_clocktower': ['#302b3e', '#664f63'],
  'room/bg_shaft': ['#282c3c', '#4a5065'],
};
const FALLBACK_NAMES = new Map(Object.keys(ART).filter(key => key.startsWith('room/')).map(key => [key, key.slice(5).replaceAll('_', ' ')]));
const DEFAULT_PALETTE = ['#273347', '#4e5972'] as const;

function meter(label: string, icon: MeterState['icon'] = 'sleep'): MeterState {
  return { label, icon, value: 0, warn: 0.45, danger: 0.73, t: 0, reduced: false, flash: 0, alarm: false };
}

function label(g: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, style: string, maxWidth: number): void {
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = style;
  g.fillText(text, x, y, maxWidth);
}

function ring(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, width: number): void {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.lineWidth = width;
  g.strokeStyle = color;
  g.stroke();
}

function fits(area: Area, x: number, y: number, w: number, h: number): boolean {
  return area.x < x + w && area.x + area.w > x && area.y < y + h && area.y + area.h > y;
}

function meets(opening: Opening, room: InteriorRoom): boolean {
  if (opening.axis === 'vertical') {
    return (opening.at === room.x || opening.at === room.x + room.w) &&
      opening.from < room.y + room.h && opening.to > room.y;
  }
  return (opening.at === room.y || opening.at === room.y + room.h) &&
    opening.from < room.x + room.w && opening.to > room.x;
}

interface Navigation {
  opening: Opening | undefined;
  room: InteriorRoom;
}

/** Route signs use the room graph, independent of the bot's exact drag line. */
function navigation(building: Building, exitX: number, exitY: number): Map<InteriorRoom, Navigation> {
  const known = new Map<InteriorRoom, Navigation>();
  const goal = building.rooms.find(room => inside(room, exitX, exitY));
  if (!goal) return known;
  const queue = [goal];
  known.set(goal, { opening: undefined, room: goal });
  for (const next of queue) {
    for (const opening of building.openings) {
      if (!meets(opening, next)) continue;
      for (const room of building.rooms) {
        if (!known.has(room) && meets(opening, room)) {
          known.set(room, { opening, room: next });
          queue.push(room);
        }
      }
    }
  }
  return known;
}

export function drawFailure(g: CanvasRenderingContext2D, sim: AbductSimulation, reducedMotion: boolean): void {
  const { failure } = sim;
  if (!failure) return;
  const tint = reducedMotion ? 0.38 : 0.35 + Math.max(0, 0.28 - sim.failureTime * 1.8);
  drawEdgeTint(g, RED_RGB, tint);
  const heading = failure.reason === 'alarm' ? 'ALARM TRIPPED' : failure.reason === 'sleeper' ? 'LIGHT SLEEPER WOKE' : 'SPECIMEN WOKE';
  hudPanel(g, 26, 620, 488, 146, RED);
  label(g, heading, 270, 647, '900 15px system-ui', RED, 448);
  label(g, failure.by, 270, 681, '900 30px system-ui', LIGHT, 448);
  const caption = SLEEPER_CAPTIONS[failure.by] ?? sim.room.interior?.caption ?? 'Unscheduled human feedback received.';
  label(g, caption, 270, 727, '650 17px system-ui', MUTED, 448);
}

export function drawSnooze(g: CanvasRenderingContext2D, sim: AbductSimulation, reducedMotion: boolean): void {
  if (sim.snoozePulse <= 0) return;
  g.save();
  const k = 1 - sim.snoozePulse;
  g.globalAlpha = Math.min(1, sim.snoozePulse * 1.8);
  const radius = reducedMotion ? 112 : 26 + k * 210;
  ring(g, sim.snoozeX, sim.snoozeY, radius, '#c8a4ff', 5);
  ring(g, sim.snoozeX, sim.snoozeY, radius * 0.74, MINT, 2.5);
  label(g, '♪', sim.snoozeX, sim.snoozeY - radius * 0.68, '900 37px system-ui', LIGHT, 60);
  g.restore();
}

export class DeepAbductView {
  private readonly human: HumanArt;
  private readonly roomPaths: Map<InteriorRoom, Navigation>;
  private readonly wakeMeter = meter('WAKE');
  private readonly cameraMeter = meter('CAMERA FUSE', 'eye');
  private readonly sleeperMeters: readonly MeterState[];
  private readonly fx = new Particles(56);
  private readonly stars = new Float32Array(STAR_COUNT * 2);
  private lastTime = 0;
  private lastSecond = -1;
  private lastBonk = 0;
  private clock = '0:00';
  private exitTitleWidth = 0;
  private currentRoom: InteriorRoom;
  private cameraX = 0;
  private cameraY = 0;

  constructor(private readonly sim: AbductSimulation, private readonly ctx: GameContext) {
    const { building, sleepers } = sim.interior!;
    this.human = new HumanArt(sim.room.human, ctx);
    this.currentRoom = building.rooms[0]!;
    this.roomPaths = navigation(building, sim.exitX, sim.exitY);
    this.sleeperMeters = sleepers.map(sleeper => meter(sleeper.spec.name.toUpperCase()));
    for (let i = 0; i < STAR_COUNT; i++) {
      this.stars[i * 2] = (i * 0.61803398875 % 1) * VIEW_W;
      this.stars[i * 2 + 1] = (i * 0.38196601125 + i * i * 0.013) % 1 * VIEW_H;
    }
  }

  render(g: CanvasRenderingContext2D, _tutorial: boolean, dragging: boolean): void {
    const { sim, ctx } = this;
    const interior = sim.interior!;
    const { building } = interior;
    const dt = this.lastTime === 0 ? 0 : clamp(ctx.time - this.lastTime, 0, 0.05);
    this.lastTime = ctx.time;
    this.cameraX = sim.camera.x;
    this.cameraY = sim.camera.y;
    const { chestX, chestY } = sim.body;
    if (!inside(this.currentRoom, chestX, chestY)) {
      for (const room of building.rooms) {
        if (inside(room, chestX, chestY)) {
          this.currentRoom = room;
          break;
        }
      }
    }

    this.drawNight(g);
    g.save();
    g.translate(-this.cameraX, -this.cameraY);
    for (const room of building.rooms) {
      if (!this.visible(room)) continue;
      this.backdrop(g, room);
      for (const prop of room.mounts) {
        const centerX = prop.x + prop.w / 2;
        const anchors = prop.key === 'room/dino_skull' ? 49 : 0;
        this.mount(g, centerX - anchors, room.y + 14, centerX - anchors, prop.y + (anchors ? 28 : 17));
        if (anchors) this.mount(g, centerX + anchors, room.y + 14, centerX + anchors, prop.y + 28);
        if (!room.furniture.includes(prop)) this.asset(g, prop);
      }
      for (const prop of room.decor) if (prop !== sim.room.exit) this.asset(g, prop);
      for (const { sprite } of room.supports) this.asset(g, sprite);
      for (const prop of room.furniture) this.asset(g, prop);
    }
    for (const wall of building.walls) {
      if (!this.visible(wall)) continue;
      g.fillStyle = WALL_COLORS[0];
      g.fillRect(wall.x, wall.y, wall.w, wall.h);
      g.fillStyle = WALL_COLORS[1];
      g.fillRect(wall.x, wall.y, Math.max(2, wall.w - 10), 3);
      g.fillStyle = WALL_COLORS[2];
      g.fillRect(wall.x + wall.w - 3, wall.y + 3, 3, wall.h - 3);
    }
    for (const opening of building.openings) this.trim(g, opening);
    this.exit(g);
    for (const state of interior.hazards) this.hazard(g, state);
    for (const sleeper of interior.sleepers) this.sleeper(g, sleeper);
    const { beamX, beamY } = sim.body;
    const beamViewX = clamp(beamX, this.cameraX + 27, this.cameraX + VIEW_W - 27);
    const beamViewY = clamp(beamY, this.cameraY + 102, this.cameraY + VIEW_H - 93);
    if (!sim.delivered) this.beam(g, beamViewX, beamViewY, dragging);
    this.subject(g);
    if (!sim.delivered) this.reticle(g, beamViewX, beamViewY, dragging);
    this.moments(g, dt);
    drawSnooze(g, sim, ctx.reducedMotion);
    g.restore();

    if (!sim.failure && !sim.delivered) this.direction(g);
    if (interior.exposure > 0) drawEdgeTint(g, RED_RGB, interior.exposure * 0.63);
    this.hud(g);
    drawFailure(g, sim, ctx.reducedMotion);
  }

  private visible(a: Area): boolean {
    return fits(a, this.cameraX - 18, this.cameraY - 18, VIEW_W + 36, VIEW_H + 36);
  }

  private visibleCircle(x: number, y: number, r: number): boolean {
    return x + r >= this.cameraX && x - r <= this.cameraX + VIEW_W &&
      y + r >= this.cameraY && y - r <= this.cameraY + VIEW_H;
  }

  private drawNight(g: CanvasRenderingContext2D): void {
    g.fillStyle = '#111023';
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    g.fillStyle = '#756794';
    for (let i = 0; i < STAR_COUNT; i++) {
      const x = ((this.stars[i * 2]! - this.cameraX * 0.16) % VIEW_W + VIEW_W) % VIEW_W;
      const y = ((this.stars[i * 2 + 1]! - this.cameraY * 0.13) % VIEW_H + VIEW_H) % VIEW_H;
      g.fillRect(x, y, i % 7 === 0 ? 2.5 : 1.4, i % 7 === 0 ? 2.5 : 1.4);
    }
  }

  private backdrop(g: CanvasRenderingContext2D, room: InteriorRoom): void {
    const { x, y, w, h } = room;
    const image = this.ctx.assets.get(room.backdrop);
    if (image) {
      const spec = ART[room.backdrop]!;
      const left = x;
      const width = w;
      const top = y;
      const floor = y + h - 14;
      const floorDepth = 32;
      const baseboard = floor - floorDepth;
      // All deep-room art has a wall above source y=600. Keep the wall and
      // baseboard separate so a shaft can repeat the wall without adding floors.
      const wallSlice = 600;
      const scale = Math.min(1, width / spec.w);
      const tileW = spec.w * scale;
      const span = baseboard - top;
      // The stairwell SVG has a painted bannister that cannot follow relocated stairs.
      const stairwell = room.backdrop === 'room/bg_stairwell';
      const sourceH = stairwell ? 150 : wallSlice;
      const tileH = stairwell || h > 800 ? sourceH * scale : span;
      for (let tileX = left, col = 0; tileX < left + width; tileX += tileW, col++) {
        if (tileX + tileW < this.cameraX || tileX > this.cameraX + VIEW_W) continue;
        const drawW = Math.min(tileW, left + width - tileX);
        g.save();
        g.translate(col % 2 ? tileX + drawW : tileX, 0);
        if (col % 2) g.scale(-1, 1);
        const sourceX = col % 2 ? spec.w - drawW / scale : 0;
        for (let tileY = top, row = 0; tileY < baseboard; tileY += tileH, row++) {
          const drawH = Math.min(tileH, baseboard - tileY);
          if (tileY + drawH < this.cameraY || tileY > this.cameraY + VIEW_H) continue;
          const slice = sourceH * drawH / tileH;
          if (row % 2) {
            g.save();
            g.translate(0, tileY + drawH);
            g.scale(1, -1);
            g.drawImage(image, sourceX, sourceH - slice, drawW / scale, slice, 0, 0, drawW, drawH);
            g.restore();
          } else {
            g.drawImage(image, sourceX, 0, drawW / scale, slice, 0, tileY, drawW, drawH);
          }
        }
        g.drawImage(image, sourceX, wallSlice, drawW / scale, 67, 0, baseboard, drawW, floorDepth + 14);
        g.restore();
      }
      return;
    }

    const palette = PALETTES[room.backdrop] ?? DEFAULT_PALETTE;
    g.fillStyle = palette[0];
    g.fillRect(x, y, w, h);
    g.fillStyle = palette[1];
    g.globalAlpha = 0.14;
    const start = Math.max(x + 25, x + 25 + Math.floor((this.cameraX - x - 25) / 58) * 58);
    for (let line = start; line < x + w - 15 && line < this.cameraX + VIEW_W; line += 58) g.fillRect(line, y, 2, h);
    g.fillRect(x, y + h - 46, w, 32);
    g.globalAlpha = 0.6;
    g.fillRect(x, y + h - 46, w, 3);
    g.globalAlpha = 1;
  }

  private asset(g: CanvasRenderingContext2D, s: Sprite, solid = false): void {
    if (!this.visible(s)) return;
    if (s.key === 'room/ladder') {
      this.ladder(g, s);
      return;
    }
    this.drawArt(g, s.key, s.x, s.y, s.w, s.h, solid);
  }

  private ladder(g: CanvasRenderingContext2D, { x, y, w, h }: Area): void {
    g.fillStyle = INK;
    g.fillRect(x, y, 12, h);
    g.fillRect(x + w - 12, y, 12, h);
    g.fillStyle = '#bb9161';
    g.fillRect(x + 2, y, 8, h);
    g.fillRect(x + w - 10, y, 8, h);
    const first = Math.max(16, 16 + Math.floor((this.cameraY - y - 16) / 28) * 28);
    for (let rung = first; rung < h - 6 && y + rung < this.cameraY + VIEW_H; rung += 28) {
      g.fillStyle = INK;
      g.fillRect(x + 9, y + rung, w - 18, 8);
      g.fillStyle = '#e5cc9f';
      g.fillRect(x + 10, y + rung + 2, w - 20, 3);
    }
  }

  private mount(g: CanvasRenderingContext2D, x: number, y: number, endX: number, endY: number, width = 4): void {
    g.fillStyle = '#756986';
    g.fillRect(x - 10, y, 20, 6);
    g.beginPath();
    g.moveTo(x, y + 5);
    g.lineTo(endX, endY);
    g.lineWidth = width;
    g.strokeStyle = INK;
    g.stroke();
    g.lineWidth = Math.max(1, width - 3);
    g.strokeStyle = '#a398ad';
    g.stroke();
  }

  private drawArt(g: CanvasRenderingContext2D, key: string, x: number, y: number, w: number, h: number, solid = false): void {
    const image = this.ctx.assets.get(key);
    if (image) {
      g.drawImage(image, x, y, w, h);
    } else if (key === 'room/watch_dog') {
      this.watchDog(g, x, y, w, h);
    } else if (key === 'room/chimney_stack') {
      this.chimney(g, x, y, w, h);
    } else {
      g.fillStyle = solid ? '#594a68' : '#554361';
      g.lineWidth = 2.5;
      g.strokeStyle = INK;
      g.beginPath();
      g.roundRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2), Math.min(8, w / 3, h / 3));
      g.fill();
      g.stroke();
      g.fillStyle = '#a592ac';
      g.globalAlpha *= 0.5;
      g.fillRect(x + w * 0.13, y + h * 0.15, w * 0.74, Math.min(5, h * 0.16));
      g.globalAlpha *= 2;
      if (w >= 87 && h >= 30) {
        const name = FALLBACK_NAMES.get(key) ?? '';
        label(g, name, x + w / 2, y + h * 0.52, '750 12px system-ui', '#e2cce3', w - 14);
      }
    }
    if (solid) {
      g.lineWidth = 1.4;
      g.strokeStyle = 'rgba(235,207,172,0.38)';
      g.strokeRect(x + 0.7, y + 0.7, w - 1.4, h - 1.4);
    }
  }

  private trim(g: CanvasRenderingContext2D, opening: Opening): void {
    const { axis, at, from, to, trim } = opening;
    const vertical = axis === 'vertical';
    const cx = vertical ? at : (from + to) / 2;
    const cy = vertical ? (from + to) / 2 : at;
    if (!this.visibleCircle(cx, cy, (to - from) / 2 + 30)) return;
    g.fillStyle = vertical ? '#a68896' : '#867e9d';
    if (vertical) {
      g.fillRect(at - 19, from - 7, 38, 7);
      g.fillRect(at - 19, to, 38, 7);
      g.fillStyle = 'rgba(62,47,74,0.52)';
      g.fillRect(at - 5, from, 10, to - from);
      g.fillStyle = 'rgba(212,181,174,0.48)';
      g.fillRect(at - 7, from, 2, to - from);
      g.fillRect(at + 5, from, 2, to - from);
    } else {
      g.fillRect(from - 7, at - 16, 7, 32);
      g.fillRect(to, at - 16, 7, 32);
      g.fillStyle = trim === 'flue' ? '#906b65' : 'rgba(152,134,185,0.2)';
      g.fillRect(from, at - 4, to - from, 8);
    }
  }

  private exit(g: CanvasRenderingContext2D): void {
    const { sim, ctx } = this;
    if (!this.visible(sim.room.exit)) return;
    const { x, y, w, h, key } = sim.room.exit;
    const zone = sim.room.exitZone;
    drawGlow(g, GLOW.mint, sim.exitX, sim.exitY, 170, 170, 0.45);
    this.drawArt(g, key, x, y, w, h);
    g.setLineDash(EXIT_DASH);
    g.lineDashOffset = ctx.reducedMotion ? 0 : -sim.elapsed * 14;
    g.lineWidth = 3;
    g.strokeStyle = MINT;
    g.strokeRect(zone.x, zone.y, zone.w, zone.h);
    g.setLineDash(EMPTY_DASH);
    g.lineDashOffset = 0;
    const title = sim.room.interior!.exitName;
    if (this.exitTitleWidth === 0) {
      g.font = '900 14px system-ui';
      this.exitTitleWidth = g.measureText(title).width + 22;
    }
    const width = this.exitTitleWidth;
    const titleY = sim.room.roofExit ? Math.max(y + h, zone.y + zone.h) + 17 : y - 17;
    hudPanel(g, sim.exitX - width / 2, titleY - 12, width, 24);
    label(g, title, sim.exitX, titleY, '900 14px system-ui', MINT, width - 12);
  }

  private hazard(g: CanvasRenderingContext2D, state: HazardState): void {
    const { spec } = state;
    switch (spec.kind) {
      case 'swing': {
        const shape = state.shapes[0] as SwingingRect;
        if (!this.visibleCircle(shape.x, shape.y, Math.hypot(shape.h, shape.w / 2))) return;
        if (spec.mountY !== undefined) this.mount(g, shape.x, spec.mountY, shape.x, shape.y);
        g.save();
        g.translate(shape.x, shape.y);
        g.rotate(shape.angle);
        this.drawArt(g, spec.sprite.key, -shape.w / 2, 0, shape.w, shape.h, true);
        g.restore();
        ring(g, shape.x, shape.y, 5, AMBER, 2.5);
        break;
      }
      case 'fan': {
        if (!this.visibleCircle(spec.x, spec.y, spec.length + 18)) return;
        const hub = state.shapes[0] as Circle;
        if (spec.duct) {
          ring(g, spec.x, spec.y, spec.length + 10, '#6a7585', 4);
        } else if (spec.mountY !== undefined) {
          this.mount(g, spec.x, spec.mountY, spec.x, spec.y, 9);
        }
        for (let i = 1; i < state.shapes.length; i++) {
          const blade = state.shapes[i] as Blade;
          g.save();
          g.translate(blade.x, blade.y);
          g.rotate(blade.angle);
          g.beginPath();
          g.roundRect(blade.from - blade.r, -blade.r, blade.to - blade.from + 2 * blade.r, 2 * blade.r, blade.r);
          g.clip();
          g.fillStyle = '#967386';
          g.fillRect(0, -blade.r, blade.to + blade.r, blade.r * 2);
          this.drawArt(g, 'room/fan_blade', 0, -blade.r, blade.to + blade.r, blade.r * 2);
          g.lineWidth = 3;
          g.strokeStyle = AMBER;
          g.stroke();
          g.restore();
        }
        this.drawArt(g, 'room/fan_hub', hub.x - hub.r, hub.y - hub.r, hub.r * 2, hub.r * 2);
        ring(g, hub.x, hub.y, hub.r - 1, AMBER, 2);
        break;
      }
      case 'gear': {
        if (!this.visible(spec.sprite)) return;
        const circle = state.shapes[0] as Circle;
        g.save();
        g.translate(circle.x, circle.y);
        g.beginPath();
        g.arc(0, 0, circle.r, 0, TAU);
        g.clip();
        g.fillStyle = '#6c536b';
        g.fill();
        g.rotate(state.angle);
        this.drawArt(g, spec.sprite.key, -circle.r, -circle.r, circle.r * 2, circle.r * 2);
        g.strokeStyle = AMBER;
        g.lineWidth = 3;
        g.stroke();
        g.restore();
        break;
      }
      case 'patrol': {
        const shape = state.shapes[0] as Rect;
        if (this.visible(shape)) {
          const facingLeft = spec.barks && shape.vx < 0;
          if (facingLeft) {
            g.save();
            g.translate(2 * shape.x + shape.w, 0);
            g.scale(-1, 1);
          }
          this.drawArt(g, spec.sprite.key, shape.x, shape.y, shape.w, shape.h);
          if (facingLeft) g.restore();
          if (spec.barks && state.pulse > 0) ring(g, shape.x + shape.w / 2, shape.y + shape.h / 2, 20 + (1 - state.pulse) * 95, AMBER, 3);
        }
        break;
      }
      case 'fragile':
        if (!this.visible(spec.sprite)) return;
        if (state.broken) {
          const { x, y, w, h } = spec.sprite;
          this.drawArt(g, 'room/shards', x + w / 2 - 30, y + h - 20, 60, 20);
          if (state.pulse > 0) ring(g, x + w / 2, y + h / 2, 23 + (1 - state.pulse) * 92, AMBER, 2);
        } else {
          this.asset(g, spec.sprite, true);
        }
        break;
      case 'laser':
        if (this.visible(spec.area)) this.laser(g, state, spec.area, spec.mountY);
        break;
      case 'gate':
      case 'pop': {
        const shape = state.shapes[0]!;
        if (spec.kind === 'gate' && shape.kind === 'swingingRect') {
          if (!this.visibleCircle(shape.x, shape.y, shape.h + shape.w)) return;
          g.save();
          g.translate(shape.x, shape.y);
          g.rotate(shape.angle);
          this.shutter(g, -shape.w / 2, 0, shape.w, shape.h, true);
          g.restore();
          ring(g, shape.x, shape.y, 6, state.tell ? AMBER : MINT, 2.5);
          return;
        }
        if (shape.kind !== 'rect' || !this.visible(spec.area)) return;
        const { x, y, w, h } = spec.area;
        g.fillStyle = state.tell ? '#ffbb7240' : '#8870ba2b';
        g.fillRect(x, y, w, h);
        if (shape.active) {
          if (spec.kind === 'gate') {
            this.shutter(g, shape.x, shape.y, shape.w, shape.h, spec.axis === 'y');
          } else {
            this.bird(g, shape);
          }
        }
        g.lineWidth = state.tell ? 3 : 1.5;
        g.strokeStyle = state.tell ? AMBER : '#a791bc';
        if (shape.active) g.strokeRect(shape.x, shape.y, shape.w, shape.h);
        else g.strokeRect(x, y, w, h);
        if (spec.kind === 'gate') {
          g.fillStyle = '#796b89';
          if (spec.axis === 'y') g.fillRect(x - 4, y - 8, w + 8, 11);
          else g.fillRect(x - 8, y - 4, 11, h + 8);
        } else {
          g.fillStyle = '#796b89';
          g.fillRect(x + w, y + h / 2 - 5, 28, 10);
          g.fillStyle = '#604569';
          g.strokeStyle = INK;
          g.lineWidth = 3;
          g.fillRect(x + w - 3, y - 6, 23, h + 12);
          g.strokeRect(x + w - 3, y - 6, 23, h + 12);
        }
        break;
      }
      case 'camera':
        this.cameraCone(g, state);
        break;
      case 'creak':
        if (this.visible(spec.area)) this.zone(g, spec.area, state.pulse, '#dc9e66');
        break;
      case 'draft':
        if (this.visible(spec.area)) this.draft(g, spec.area, spec.ay);
        break;
      case 'speaker': {
        this.asset(g, spec.sprite, true);
        const cx = spec.sprite.x + spec.sprite.w / 2;
        const cy = spec.sprite.y + spec.sprite.h / 2;
        if (!this.visibleCircle(cx, cy, spec.radius)) return;
        const beat = Math.max(0, 1 - (state.next - this.sim.elapsed) / 0.38);
        g.save();
        g.globalAlpha = 0.32 + 0.58 * Math.max(beat, state.pulse);
        g.setLineDash(WARNING_DASH);
        ring(g, cx, cy, spec.radius, '#e2a0ff', 2);
        g.setLineDash(EMPTY_DASH);
        if (state.pulse > 0) ring(g, cx, cy, this.ctx.reducedMotion ? spec.radius * 0.75 : spec.radius * (1 - state.pulse * 0.85), '#e2a0ff', 4);
        g.restore();
        break;
      }
    }
  }

  private shutter(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, vertical: boolean): void {
    g.fillStyle = '#495374';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#a7b7ce';
    const length = vertical ? h : w;
    for (let slat = 5; slat < length - 2; slat += 15) {
      if (vertical) g.fillRect(x + 3, y + slat, w - 6, 2);
      else g.fillRect(x + slat, y + 3, 2, h - 6);
    }
    g.fillStyle = '#bb9161';
    if (vertical) g.fillRect(x, y + Math.max(0, h - 4), w, Math.min(h, 4));
    else g.fillRect(x + Math.max(0, w - 4), y, Math.min(w, 4), h);
  }

  private chimney(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    g.fillStyle = '#545168';
    g.fillRect(x, y, w, h);
    g.strokeStyle = '#454157';
    g.lineWidth = 3;
    g.beginPath();
    for (let row = 0; row < h; row += 23) {
      g.moveTo(x, y + row);
      g.lineTo(x + w, y + row);
      const offset = row % 46 === 0 ? 26 : 57;
      for (let mortar = offset; mortar < w; mortar += 62) {
        g.moveTo(x + mortar, y + row);
        g.lineTo(x + mortar, y + Math.min(row + 23, h));
      }
    }
    g.stroke();
    g.fillStyle = '#68637a';
    g.fillRect(x + w - 11, y, 3, h);
  }

  private watchDog(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    g.save();
    g.translate(x, y);
    g.scale(w / 89, h / 62);
    g.fillStyle = '#bb9161';
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(14, 50);
    g.quadraticCurveTo(13, 35, 2, 27);
    g.quadraticCurveTo(16, 29, 22, 34);
    g.quadraticCurveTo(38, 25, 56, 34);
    g.quadraticCurveTo(60, 23, 67, 21);
    g.lineTo(68, 4);
    g.lineTo(78, 19);
    g.quadraticCurveTo(86, 20, 88, 34);
    g.lineTo(73, 39);
    g.lineTo(68, 60);
    g.lineTo(58, 60);
    g.lineTo(56, 49);
    g.lineTo(27, 49);
    g.lineTo(24, 60);
    g.lineTo(14, 60);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#594050';
    g.fillRect(58, 31, 6, 14);
    g.fillStyle = INK;
    g.fillRect(75, 25, 3, 3);
    g.fillRect(84, 29, 4, 5);
    g.restore();
  }

  private laser(g: CanvasRenderingContext2D, state: HazardState, area: Area, mountY?: number): void {
    const { x, y, w, h } = area;
    const vertical = h > w;
    const blinking = this.ctx.reducedMotion || Math.floor(this.sim.elapsed * 21) % 2 === 0;
    g.fillStyle = state.level ? RED : state.tell && blinking ? AMBER : '#82e5bd4a';
    g.fillRect(x, y, w, h);
    if (state.level) {
      g.fillStyle = '#fff1f3';
      g.fillRect(x + (vertical ? w * 0.4 : 0), y + (vertical ? 0 : h * 0.4), vertical ? w * 0.2 : w, vertical ? h : h * 0.2);
    }
    const nearX = vertical ? x + w / 2 : x;
    const nearY = vertical ? y : y + h / 2;
    const farX = vertical ? nearX : x + w;
    const farY = vertical ? y + h : nearY;
    if (mountY !== undefined) this.mount(g, nearX - 9, mountY, nearX - 9, nearY, 6);
    const color = state.level ? RED : state.tell ? AMBER : MINT;
    this.emitter(g, nearX, nearY, vertical ? Math.PI / 2 : 0, color);
    this.emitter(g, farX, farY, vertical ? -Math.PI / 2 : Math.PI, color);
  }

  private emitter(g: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string): void {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    this.drawArt(g, 'room/laser_emitter', -19, -14, 24, 28);
    g.restore();
    ring(g, x, y, 5, color, 2.5);
  }

  private bird(g: CanvasRenderingContext2D, shape: Rect): void {
    const { x, y, w, h } = shape;
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    const center = x + 23;
    g.fillStyle = '#bc795e';
    g.beginPath();
    g.ellipse(x + w * 0.6, y + h * 0.62, w * 0.55, h * 0.38, 0, 0, TAU);
    g.ellipse(center, y + 12, 15, 12, 0, 0, TAU);
    g.fill();
    g.fillStyle = AMBER;
    g.beginPath();
    g.moveTo(center - 10, y + 12);
    g.lineTo(x, y + 19);
    g.lineTo(center - 10, y + 23);
    g.fill();
    g.fillStyle = INK;
    g.fillRect(center - 10, y + 9, 4, 4);
    g.restore();
  }

  private cameraCone(g: CanvasRenderingContext2D, state: HazardState): void {
    const { spec, angle, cone } = state;
    if (spec.kind !== 'camera' || !cone || !this.visibleCircle(spec.x, spec.y, spec.range)) return;
    const watching = state.detecting;
    cone.update(angle);
    g.beginPath();
    g.moveTo(cone.points[0]!, cone.points[1]!);
    for (let i = 1; i < cone.count; i++) g.lineTo(cone.points[i * 2]!, cone.points[i * 2 + 1]!);
    g.closePath();
    g.fillStyle = watching ? 'rgba(255,90,113,0.28)' : 'rgba(255,188,105,0.17)';
    g.fill();
    g.strokeStyle = watching ? RED : '#e5ab71';
    g.lineWidth = watching ? 2.8 : 1.7;
    g.stroke();
    if (spec.mountY !== undefined) {
      this.mount(g, spec.x, spec.mountY, spec.x - Math.cos(angle) * 36, spec.y - Math.sin(angle) * 36, 9);
    }
    g.save();
    g.translate(spec.x, spec.y);
    g.rotate(angle);
    this.drawArt(g, 'room/security_camera', -61, -20, 67, 38);
    g.restore();
    ring(g, spec.x, spec.y, 6, watching ? RED : AMBER, 3);
  }

  private zone(g: CanvasRenderingContext2D, a: Area, pulse: number, color: string): void {
    g.save();
    g.globalAlpha = 0.16 + pulse * 0.52;
    g.strokeStyle = color;
    g.fillStyle = color;
    g.setLineDash(WARNING_DASH);
    g.strokeRect(a.x, a.y, a.w, a.h);
    g.setLineDash(EMPTY_DASH);
    const left = Math.max(a.x + 20, this.cameraX - 20);
    const top = Math.max(a.y + 20, this.cameraY - 20);
    const right = Math.min(a.x + a.w, this.cameraX + VIEW_W + 20);
    const bottom = Math.min(a.y + a.h, this.cameraY + VIEW_H + 20);
    for (let y = a.y + 22 + Math.max(0, Math.floor((top - a.y) / 78)) * 78; y < bottom; y += 78) {
      for (let x = a.x + 20 + Math.max(0, Math.floor((left - a.x) / 61)) * 61; x < right; x += 61) {
        g.fillRect(x, y, 12, 2);
        g.fillRect(x + 4, y - 4, 13, 2);
      }
    }
    g.restore();
  }

  private draft(g: CanvasRenderingContext2D, a: Area, ay: number): void {
    const positive = ay > 0 ? 1 : -1;
    const offset = this.ctx.reducedMotion ? 0 : ((this.sim.elapsed * 79 * positive) % 78 + 78) % 78;
    const top = Math.max(a.y, this.cameraY - 40);
    const bottom = Math.min(a.y + a.h, this.cameraY + VIEW_H + 40);
    g.save();
    g.globalAlpha = 0.35;
    g.strokeStyle = ay < 0 ? MINT : AMBER;
    g.setLineDash(WARNING_DASH);
    g.strokeRect(a.x, a.y, a.w, a.h);
    g.setLineDash(EMPTY_DASH);
    g.beginPath();
    for (let yy = a.y + offset + Math.floor((top - a.y) / 78) * 78; yy < bottom; yy += 78) {
      if (yy <= a.y + 24 || yy >= a.y + a.h - 24) continue;
      for (let col = 1; col <= 3; col++) {
        const x = a.x + a.w * col * 0.25;
        g.moveTo(x - 7, yy - positive * 9);
        g.lineTo(x, yy);
        g.lineTo(x + 7, yy - positive * 9);
        g.moveTo(x, yy - positive * 17);
        g.lineTo(x, yy);
      }
    }
    g.lineWidth = 2.5;
    g.stroke();
    g.restore();
  }

  private sleeper(g: CanvasRenderingContext2D, sleeper: SleeperState): void {
    const { x, y, wake, spec } = sleeper;
    if (!this.visibleCircle(x, y, spec.radius)) return;
    const awake = wake >= 100;
    g.save();
    g.globalAlpha = 0.34 + sleeper.pulse * 0.5;
    g.setLineDash(WARNING_DASH);
    ring(g, x, y, spec.radius, wake >= 70 ? RED : '#c4a2eb', 2);
    g.restore();
    this.asset(g, awake ? spec.awake : spec.asleep);
    if (this.visibleCircle(x, y, 125)) {
      const lift = this.ctx.reducedMotion ? 0 : Math.sin(this.sim.elapsed * 2.5) * 3;
      label(g, awake ? '!' : 'Z z z', x + spec.asleep.w / 3, spec.asleep.y - 21 + lift, '900 19px system-ui', awake ? RED : '#dcc9ff', 90);
    }
  }

  private beam(g: CanvasRenderingContext2D, x: number, y: number, dragging: boolean): void {
    const { sim } = this;
    const { chestX, chestY } = sim.body;
    const hot = sim.interior!.strain > 0.24;
    g.save();
    g.strokeStyle = hot ? AMBER : MINT;
    g.globalAlpha = dragging ? 0.52 : 0.34;
    g.lineWidth = hot ? 4 : 2;
    g.setLineDash(EXIT_DASH);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(chestX, chestY);
    g.stroke();
    g.setLineDash(EMPTY_DASH);
    drawGlow(g, hot ? GLOW.amber : GLOW.mint, chestX, chestY, 119, 188, dragging ? 0.57 : 0.31);
    g.restore();
  }

  private reticle(g: CanvasRenderingContext2D, x: number, y: number, dragging: boolean): void {
    const { beamX, beamY } = this.sim.body;
    const color = this.sim.interior!.strain > 0.24 ? AMBER : MINT;
    const radius = dragging ? 22 : 17;
    ring(g, x, y, radius, INK, 5.5);
    ring(g, x, y, radius, color, 2.6);
    g.fillStyle = color;
    g.fillRect(x - 2.5, y - 2.5, 5, 5);
    if (x !== beamX || y !== beamY) {
      g.save();
      g.translate(x, y);
      g.rotate(Math.atan2(beamY - y, beamX - x));
      g.beginPath();
      g.moveTo(25, 0);
      g.lineTo(14, 8);
      g.lineTo(14, -8);
      g.closePath();
      g.fill();
      g.restore();
    }
  }

  private subject(g: CanvasRenderingContext2D): void {
    const { sim, ctx } = this;
    const { item, body, wake } = sim;
    const { sprite } = sim.room.item;
    if (this.visibleCircle(item.x, item.y, sprite.w) && (!sim.delivered || item.stolen)) {
      const t = sim.slurp * sim.slurp;
      const ix = item.x + (sim.exitX - item.x) * t;
      const iy = item.y + (sim.exitY - item.y) * t;
      this.drawArt(g, sprite.key, ix - sprite.w / 2, iy - sprite.h / 2, sprite.w, sprite.h);
    }

    const t = sim.slurp * sim.slurp;
    g.save();
    if (sim.delivered) {
      g.translate(body.chestX + (sim.exitX - body.chestX) * t, body.chestY + (sim.exitY - body.chestY) * t);
      g.scale(1 - t * 0.87, 1 - t * 0.87);
      g.translate(-body.chestX, -body.chestY);
      g.globalAlpha = 1 - t;
    }
    const breath = ctx.reducedMotion ? 0 : (1 + Math.sin(sim.elapsed * 3)) * 0.5;
    this.human.draw(g, body, wake.awake > 0, breath);
    if (!sim.delivered && wake.awake === 0) {
      const x = body.x[Joint.Head]!;
      const y = body.y[Joint.Head]!;
      if (sim.mumbleFx > 0) {
        const bubbleX = clamp(x, this.cameraX + 161, this.cameraX + VIEW_W - 161);
        hudPanel(g, bubbleX - 149, y - 85, 298, 46, '#a58cb0');
        label(g, sim.mumble, bubbleX, y - 62, '750 15px system-ui', LIGHT, 275);
      } else if (sim.snoreFx > 0) {
        const lift = ctx.reducedMotion ? 0 : (1.1 - sim.snoreFx) * 32;
        const bubble = ctx.assets.get('ui/zzz');
        g.globalAlpha = Math.min(1, sim.snoreFx * 2.4);
        if (bubble) g.drawImage(bubble, x + 24, y - 37 - lift, 38, 38);
        else label(g, 'Z z', x + 47, y - 25 - lift, '900 21px system-ui', '#e0cefc', 65);
      }
    }
    g.restore();
  }

  private moments(g: CanvasRenderingContext2D, dt: number): void {
    const { sim, ctx } = this;
    if (this.lastBonk !== sim.bonkSeq) {
      this.lastBonk = sim.bonkSeq;
      if (!ctx.reducedMotion) {
        this.fx.burst(P_STAR, sim.bonkX, sim.bonkY, 5, 54, 134, 0.39, 11, PC.amber, 150, 1.4);
        this.fx.burst(P_SPARK, sim.bonkX, sim.bonkY, 5, 85, 189, 0.25, 4, PC.white, 110, 1.8);
      }
    }
    if (!sim.failure) this.fx.update(dt);
    this.fx.draw(g);
  }

  private direction(g: CanvasRenderingContext2D): void {
    const entry = this.roomPaths.get(this.currentRoom);
    if (!entry) return;
    const gap = entry.opening;
    const center = gap ? (gap.from + gap.to) / 2 : 0;
    const x = (gap ? gap.axis === 'vertical' ? gap.at : center : this.sim.exitX) - this.cameraX;
    const y = (gap ? gap.axis === 'vertical' ? center : gap.at : this.sim.exitY) - this.cameraY;
    const bottom = DEEP_HUD_WARNING_SLOT.y - 20;
    if (!gap && x >= 42 && x <= VIEW_W - 42 && y >= 155 && y < bottom) return;
    const cx = clamp(x, 42, VIEW_W - 42);
    const cy = clamp(y, 168, bottom);
    if (Math.hypot(x - VIEW_W / 2, y - VIEW_H / 2) < 48) return;
    const angle = Math.atan2(y - VIEW_H / 2, x - VIEW_W / 2);
    g.save();
    g.translate(cx, cy);
    g.rotate(angle);
    g.beginPath();
    g.moveTo(16, 0);
    g.lineTo(-8, 11);
    g.lineTo(-5, 0);
    g.lineTo(-8, -11);
    g.closePath();
    g.fillStyle = MINT;
    g.strokeStyle = INK;
    g.lineWidth = 3.5;
    g.stroke();
    g.fill();
    g.restore();
  }

  private hud(g: CanvasRenderingContext2D): void {
    const { sim, ctx } = this;
    const interior = sim.interior!;
    const second = Math.floor(sim.elapsed);
    if (second !== this.lastSecond) {
      this.lastSecond = second;
      this.clock = Math.floor(second / 60) + ':' + String(second % 60).padStart(2, '0');
    }
    this.drawMeter(g, this.wakeMeter, sim.wake.value / 100, sim.wake.awake > 0, 14, HUD_ROW.y, 296);
    hudTimer(g, 318, HUD_ROW.y, 96, HUD_ROW.h, this.clock);
    hudButton(g, RESTART, 'restart', 'RESTART', false);
    for (let i = 0; i < interior.sleepers.length; i++) {
      const sleeper = interior.sleepers[i]!;
      this.drawMeter(g, this.sleeperMeters[i]!, sleeper.wake / 100, sleeper.wake >= 100, 14, 86, 180);
    }
    if (interior.watching || interior.exposure > 0) this.drawMeter(g, this.cameraMeter, interior.exposure, interior.exposure >= 1, 342, 86, 184);

    hudPanel(g, 14, 887, 512, 56);
    label(g, this.currentRoom.name, 155, 914, '850 18px system-ui', LIGHT, 251);
    g.fillStyle = '#695b92';
    g.fillRect(284, 898, 2, 32);
    label(g, sim.room.interior!.exitName, 403, 914, '900 14px system-ui', MINT, 210);
    if (sim.snoozeOwned && !sim.snoozeUsed && !sim.failure && !sim.delivered) {
      hudPanel(g, 14, 831, 204, 45);
      label(g, 'Double-tap · Snooze Ray', 116, 853, '750 13px system-ui', ctx.reducedMotion ? LIGHT : '#ddc8ff', 188);
    }
  }

  private drawMeter(g: CanvasRenderingContext2D, state: MeterState, value: number, alarm: boolean, x: number, y: number, w: number): void {
    state.value = value;
    state.alarm = alarm;
    state.t = this.ctx.reducedMotion ? 0 : this.sim.elapsed;
    state.reduced = this.ctx.reducedMotion;
    hudMeter(g, x, y, w, HUD_ROW.h, state);
  }
}
