// v0.2 teaching: first-encounter prompts for room hazards that no route label or memo line teaches.
// A prompt shows in every room of the level that introduces its hazard kind (the first level in LEVELS
// order with that kind in one of its rooms), while the chest is near one of those hazards. It is
// worked out from the level and room data, so a moved hazard or a reordered level carries its prompt.
// tests/abduct-room-lessons.test.ts plays each of those rooms on its autopilot route.
import { tr } from '../i18n';
import { LEVELS, levelRooms } from '../levels/levels';
import { ROOMS } from './rooms/index';
import type { Hazard } from './rooms/interior';
import type { Area, Room } from './rooms/layout';

type Kind = Hazard['kind'];

/** The prompt for each taught kind (EN + FR in `lessons`). */
export const ROOM_HAZARD_LESSONS: Partial<Record<Kind, () => string>> = {
  patrol: () => tr().lessons.patrol,
  fragile: () => tr().lessons.fragile,
  draft: () => tr().lessons.draft,
  camera: () => tr().lessons.camera,
  pop: () => tr().lessons.pop,
};

/** The prompt comes up this many px from the hazard's footprint. */
export const ROOM_LESSON_NEAR = 170;
/**
 * v0.2 follow-up: a patrol walks towards you, so its prompt comes up further out. At 170 px no L3 autopilot
 * route ever showed it: the closest pass, over the watch dog's beat in Gary's garage, is about 200 px out.
 */
const NEAR_BY_KIND: Partial<Record<Kind, number>> = { patrol: 240 };

/** How far from a hazard of this kind its prompt comes up, px. */
export function lessonNear(kind: Kind): number {
  return NEAR_BY_KIND[kind] ?? ROOM_LESSON_NEAR;
}

function outside(a: Area, x: number, y: number): number {
  return Math.hypot(Math.max(a.x - x, 0, x - a.x - a.w), Math.max(a.y - y, 0, y - a.y - a.h));
}

/** px from (x, y) to where the hazard acts: what it sweeps, covers or sees. */
export function hazardReach(h: Hazard, x: number, y: number): number {
  switch (h.kind) {
    case 'patrol': {
      const dx = Math.abs(h.dx);
      const dy = Math.abs(h.dy);
      return outside({ x: h.sprite.x - dx, y: h.sprite.y - dy, w: h.sprite.w + dx * 2, h: h.sprite.h + dy * 2 }, x, y);
    }
    case 'fragile': return outside(h.sprite, x, y);
    case 'draft':
    case 'pop': return outside(h.area, x, y);
    case 'camera': return Math.max(0, Math.hypot(x - h.x, y - h.y) - h.range);
    default: return Infinity;
  }
}

let teaching: Map<Room, ReadonlySet<Kind>> | null = null;

/** The kinds each room teaches: the rooms of each kind's first level. */
export function roomTeaches(room: Room): ReadonlySet<Kind> {
  if (!teaching) {
    teaching = new Map();
    const done = new Set<Kind>();
    for (const level of LEVELS) {
      const fresh = new Set<Kind>();
      for (const id of levelRooms(level)) {
        for (const h of ROOMS[id].interior?.building.hazards ?? []) if (ROOM_HAZARD_LESSONS[h.kind] && !done.has(h.kind)) fresh.add(h.kind);
      }
      for (const id of levelRooms(level)) {
        const kinds = new Set((ROOMS[id].interior?.building.hazards ?? []).map(h => h.kind).filter(k => fresh.has(k)));
        if (kinds.size) teaching.set(ROOMS[id], new Set([...(teaching.get(ROOMS[id]) ?? []), ...kinds]));
      }
      for (const k of fresh) done.add(k);
    }
  }
  return teaching.get(room) ?? EMPTY;
}

const EMPTY: ReadonlySet<Kind> = new Set();

/**
 * The hazard kind whose prompt shows for a chest at (x, y), or null. `pad` widens the zone of the prompt
 * already showing. v0.2 follow-up: among the kinds in range, the nearest one not yet in `shown` wins over a
 * nearer kind already taught, so a patrol beside a fragile vase still gets its turn.
 */
export function roomHazardKind(room: Room, x: number, y: number, pad: number, shown: ReadonlySet<Kind> = EMPTY): Kind | null {
  const kinds = roomTeaches(room);
  if (kinds.size === 0) return null;
  let best: Kind | null = null;
  let bestFresh = false;
  let nearest = Infinity;
  for (const h of room.interior?.building.hazards ?? []) {
    if (!kinds.has(h.kind)) continue;
    const reach = hazardReach(h, x, y);
    if (reach >= lessonNear(h.kind) + pad) continue;
    const fresh = !shown.has(h.kind);
    if ((fresh && !bestFresh) || (fresh === bestFresh && reach < nearest)) {
      best = h.kind;
      bestFresh = fresh;
      nearest = reach;
    }
  }
  return best;
}

/** The room prompt for a chest at (x, y), or ''. `pad` widens the zone of the prompt already showing. */
export function roomHazardLesson(room: Room, x: number, y: number, pad: number, shown?: ReadonlySet<Kind>): string {
  const kind = roomHazardKind(room, x, y, pad, shown);
  return kind ? ROOM_HAZARD_LESSONS[kind]!() : '';
}

/** v0.2 follow-up: one room attempt's prompts, remembering which kinds have shown so each gets its turn. */
export class RoomLessons {
  private readonly shown = new Set<Kind>();
  /** The prompt on screen: it stays until the chest leaves its zone, then counts as shown (no one-frame flips). */
  private active: Kind | null = null;

  constructor(private readonly room: Room) {}

  /** This frame's prompt for a chest at (x, y), or ''. */
  tip(x: number, y: number, pad: number): string {
    if (this.active) {
      if (this.inZone(this.active, x, y, pad)) return ROOM_HAZARD_LESSONS[this.active]!();
      this.shown.add(this.active);
      this.active = null;
    }
    this.active = roomHazardKind(this.room, x, y, 0, this.shown);
    return this.active ? ROOM_HAZARD_LESSONS[this.active]!() : '';
  }

  private inZone(kind: Kind, x: number, y: number, pad: number): boolean {
    return (this.room.interior?.building.hazards ?? []).some(h => h.kind === kind && hazardReach(h, x, y) < lessonNear(kind) + pad);
  }
}
