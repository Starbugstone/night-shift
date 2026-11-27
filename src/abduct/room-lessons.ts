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

/** The room prompt for a chest at (x, y), or ''. `pad` widens the zone of the prompt already showing. */
export function roomHazardLesson(room: Room, x: number, y: number, pad: number): string {
  const kinds = roomTeaches(room);
  if (kinds.size === 0) return '';
  let best = '';
  let nearest = ROOM_LESSON_NEAR;
  for (const h of room.interior?.building.hazards ?? []) {
    if (!kinds.has(h.kind)) continue;
    const reach = hazardReach(h, x, y);
    if (reach < nearest + pad) {
      nearest = reach;
      best = ROOM_HAZARD_LESSONS[h.kind]!();
    }
  }
  return best;
}
