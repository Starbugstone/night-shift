import type { BoneToss } from '../monolith';
import type { Wetness } from '../moisture';
import type { ProbeDrone } from '../probe';
import type { Area, Furniture, Sprite } from './layout';

export interface InteriorRoom extends Area {
  name: string;
  backdrop: string;
  wallOnly?: boolean;
  decor: readonly Sprite[];
  furniture: readonly Sprite[];
  supports: readonly Furniture[];
  mounts: readonly Sprite[];
}

export interface Opening {
  /** The wall's axis; at is the fixed coordinate along the other axis. */
  axis: 'vertical' | 'horizontal';
  at: number;
  from: number;
  to: number;
  trim: 'door' | 'stairs' | 'ladder' | 'flue' | 'vent' | 'shaft';
}

export interface Cycle {
  period: number;
  open: number;
  phase: number;
}

export type Hazard =
  | BoneToss
  | { kind: 'swing'; name: string; sprite: Sprite; amplitude: number; speed: number; phase: number; mountY?: number }
  | { kind: 'fan'; name: string; x: number; y: number; length: number; speed: number; phase: number; duct: boolean; mountY?: number }
  | { kind: 'laser'; name: string; area: Area; cycle: Cycle; mountY?: number; skin?: 'invasion' }
  | { kind: 'gate'; name: string; artKey?: string; area: Area; axis: 'x' | 'y'; cycle: Cycle; hinged?: boolean; dialX?: number }
  | { kind: 'patrol'; name: string; sprite: Sprite; dx: number; dy: number; speed: number; phase: number; barks?: boolean }
  | { kind: 'pop'; name: string; area: Area; cycle: Cycle; artKey?: string }
  | { kind: 'camera'; name: string; x: number; y: number; mountY?: number; angle: number; spread: number; range: number; sweep: number; speed: number; phase: number; skin?: 'invasion'
    /** L5 pier code: a lighthouse lens, drawn as the lens's light (no CCTV body or REC light). */
    lens?: boolean }
  | { kind: 'fragile'; name: string; sprite: Sprite }
  | { kind: 'creak'; name: string; area: Area }
  | { kind: 'speaker'; name: string; sprite: Sprite; radius: number; period: number }
  | { kind: 'draft'; name: string; area: Area; ax: number; ay: number }
  | { kind: 'gear'; name: string; sprite: Sprite; speed: number }
  // L7 cruise code (src/abduct/swell.ts): the ship's roll, and things on castors that slide with it
  | { kind: 'swell'; name: string; period: number; pull: number; phase: number }
  | { kind: 'castor'; name: string; sprite: Sprite; travel: number; period: number; phase: number; lag: number };

export interface Sleeper {
  name: string;
  asleep: Sprite;
  awake: Sprite;
  radius: number;
}

export interface Building {
  rooms: readonly InteriorRoom[];
  openings: readonly Opening[];
  walls: readonly Area[];
  bounds: Area;
  hazards: readonly Hazard[];
  sleepers: readonly Sleeper[];
}

export interface Checkpoint {
  x: number;
  y: number;
  /** A hazard at the previous point that needs a clear approach interval. */
  cross?: string;
  /** Beam speed while committing to the crossing. */
  speed?: number;
  /** L6: on reaching this point, hold the body for probe drone n (index into the route's probes) until its reading is taken. */
  probe?: number;
}

export interface InteriorRoute {
  building: Building;
  checkpoints: readonly Checkpoint[];
  caption: string;
  mumbles: readonly string[];
  exitName: string;
  /** L5: water zones and refill points (src/abduct/moisture.ts). */
  wet?: Wetness;
  /** L6: Form 7-B probe drones (src/abduct/probe.ts); the exit stays shut until every reading is taken. */
  probes?: readonly ProbeDrone[];
}

export function building(
  rooms: readonly InteriorRoom[], openings: readonly Opening[],
  hazards: readonly Hazard[], sleepers: readonly Sleeper[] = [],
): Building {
  const walls: Area[] = [];
  function edge(axis: Opening['axis'], at: number, start: number, end: number, offset: number): void {
    const thickness = 14;
    function segment(from: number, to: number): void {
      if (to <= from) return;
      walls.push(axis === 'vertical'
        ? { x: at + offset, y: from, w: thickness, h: to - from }
        : { x: from, y: at + offset, w: to - from, h: thickness });
    }
    let cursor = start;
    const gaps = openings.filter(gap => gap.axis === axis && gap.at === at && gap.from < end && gap.to > start)
      .sort((a, b) => a.from - b.from);
    for (const gap of gaps) {
      segment(cursor, Math.min(end, gap.from));
      cursor = Math.max(cursor, gap.to);
    }
    segment(cursor, end);
  }

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const room of rooms) {
    const { x, y, w, h } = room;
    edge('vertical', x, y, y + h, 0);
    edge('vertical', x + w, y, y + h, -14);
    edge('horizontal', y, x + 14, x + w - 14, 0);
    edge('horizontal', y + h, x + 14, x + w - 14, -14);
    left = Math.min(left, x);
    right = Math.max(right, x + w);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y + h);
  }
  for (const hazard of hazards) {
    if (hazard.kind !== 'gate') continue;
    const { area, axis } = hazard;
    const vertical = axis === 'y';
    const at = vertical ? area.x : area.y;
    if (openings.some(gap => gap.axis === (vertical ? 'vertical' : 'horizontal') &&
      gap.at >= at && gap.at <= at + (vertical ? area.w : area.h) &&
      gap.from === (vertical ? area.y : area.x))) continue;
    const host = rooms.find(room => area.x >= room.x && area.y >= room.y &&
      area.x + area.w <= room.x + room.w && area.y + area.h <= room.y + room.h);
    if (!host) continue;
    // Continue the wall on both sides of the moving panel so the visible
    // aperture is the only way through the partition.
    if (vertical) {
      const top = area.y - host.y;
      const bottom = host.y + host.h - area.y - area.h;
      if (top > 0) walls.push({ x: area.x, y: host.y, w: area.w, h: top });
      if (bottom > 0) walls.push({ x: area.x, y: area.y + area.h, w: area.w, h: bottom });
    } else {
      const left = area.x - host.x;
      const right = host.x + host.w - area.x - area.w;
      if (left > 0) walls.push({ x: host.x, y: area.y, w: left, h: area.h });
      if (right > 0) walls.push({ x: area.x + area.w, y: area.y, w: right, h: area.h });
    }
  }
  return { rooms, openings, walls, hazards, sleepers, bounds: { x: left, y: top, w: right - left, h: bottom - top } };
}
