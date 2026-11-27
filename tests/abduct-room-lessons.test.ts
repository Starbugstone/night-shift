// First-encounter room prompts (council v0.2 item 10/11 teaching gaps): vacuums and dogs on patrol, fragile
// props, the chimney draft, Gary's camera and the Mayor's cuckoo shipped with nothing that taught them
// (tests/abduct-mechanic-taught.test.ts PENDING). src/abduct/room-lessons.ts now prompts for each of them in
// the rooms of the level that introduces it.
//
// Rule: every kind with a room prompt is taught on the first level in LEVELS order whose rooms use it, every
// room of that level with the kind gets the prompt, and wherever that room's autopilot route brings the chest
// to the hazard, the prompt showed first. Every kind also shows on at least one of those autopilot routes
// (v0.2 follow-up: the L3 patrol prompt never did), and where two zones overlap a kind not yet shown this
// attempt takes the slot from a nearer one already taught.
import { describe, expect, it } from 'vitest';
import type { RoomId } from '../src/contracts';
import { ROOM_HAZARD_LESSONS, RoomLessons, hazardReach, lessonNear, roomHazardLesson, roomTeaches } from '../src/abduct/room-lessons';
import { ROOMS } from '../src/abduct/rooms/index';
import type { Hazard } from '../src/abduct/rooms/interior';
import { AbductSimulation } from '../src/abduct/simulation';
import { setLang } from '../src/i18n';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import { LEVELS, levelRooms } from '../src/levels/levels';

type Kind = Hazard['kind'];
const HARD = { wakeFails: true, hard: true };
const DT = 1 / 60;
const KINDS = Object.keys(ROOM_HAZARD_LESSONS) as Kind[];

const kindsOf = (id: RoomId): Set<Kind> => new Set((ROOMS[id].interior?.building.hazards ?? []).map(h => h.kind));

/** The first level in LEVELS order with the kind in one of its rooms, and those rooms. */
function introduced(kind: Kind): { level: string; rooms: RoomId[] } | null {
  for (const level of LEVELS) {
    const rooms = levelRooms(level).filter(id => kindsOf(id).has(kind));
    if (rooms.length) return { level: level.id, rooms };
  }
  return null;
}

interface RouteLog { shown: number | null; reached: number | null }

/** A point on the hazard, to search around. */
function anchor(h: Hazard): { x: number; y: number } {
  if ('sprite' in h) return h.sprite;
  if ('area' in h) return h.area;
  return 'x' in h ? h : { x: 0, y: 0 };
}

/** v0.2 follow-up: plays the room's autopilot route with one RoomLessons, as the room view does. */
function playRoom(id: RoomId, kind: Kind, whole = false): RouteLog {
  const room = ROOMS[id];
  const sim = new AbductSimulation(room, new Set(), { sfx() {} }, () => 0.5, HARD);
  const tip = ROOM_HAZARD_LESSONS[kind]!();
  const hazards = (room.interior?.building.hazards ?? []).filter(h => h.kind === kind);
  const log: RouteLog = { shown: null, reached: null };
  const lessons = new RoomLessons(room);
  let active = '';
  for (let f = 0; f < 160 * 60 && !sim.complete; f++) {
    const { dx, dy } = sim.autopilot();
    sim.moveBeam(sim.body.beamX + dx, sim.body.beamY + dy);
    sim.update(DT);
    const { chestX, chestY } = sim.body;
    if (log.reached === null && hazards.some(h => hazardReach(h, chestX, chestY) <= 0)) log.reached = sim.elapsed;
    active = lessons.tip(chestX, chestY, active ? 12 : 0);
    if (log.shown === null && active === tip) log.shown = sim.elapsed;
    if (!whole && log.shown !== null && log.reached !== null) break;
  }
  return log;
}

describe('room hazard prompts teach where the hazard is introduced', () => {
  setLang('en');

  for (const kind of KINDS) {
    describe(kind, () => {
      const intro = introduced(kind);

      it('is used by a level, with the prompt in EN and FR', () => {
        expect(intro, `no level uses ${kind} any more`).not.toBeNull();
        for (const table of [en, fr]) expect((table.lessons as unknown as Record<string, string | undefined>)[kind]?.trim().length).toBeGreaterThan(10);
      });

      it('prompts in every room of its first level that has it, and in no later level', () => {
        for (const id of intro!.rooms) expect(roomTeaches(ROOMS[id]).has(kind), `${intro!.level} ${id}`).toBe(true);
        const later = LEVELS.slice(LEVELS.findIndex(l => l.id === intro!.level) + 1)
          .flatMap(l => levelRooms(l)).filter(id => !intro!.rooms.includes(id) && roomTeaches(ROOMS[id]).has(kind));
        expect(later).toEqual([]);
      });

      it('shows on the autopilot route before the chest reaches the hazard', () => {
        const logs = intro!.rooms.map(id => ({ id, ...playRoom(id, kind) }));
        for (const l of logs) {
          if (l.reached !== null) expect(l.shown, `${l.id} reached the ${kind} at ${l.reached.toFixed(2)} s with no prompt`).not.toBeNull();
          if (l.reached !== null) expect(l.shown!, `${l.id}: prompt after the ${kind}`).toBeLessThanOrEqual(l.reached);
        }
      }, 60_000);
    });
  }

  // v0.2 follow-up: the L3 patrol prompt never showed, because a nearer fragile, draft or camera hazard always
  // took the slot. A kind not yet shown this attempt now beats a nearer one already taught.
  it('every prompt kind shows on the autopilot route of at least one room of its first level', () => {
    const missing = KINDS.filter(kind => !introduced(kind)!.rooms.some(id => playRoom(id, kind, true).shown !== null));
    expect(missing).toEqual([]);
  }, 120_000);

  it('prefers a kind not yet shown this attempt over a nearer one already taught', () => {
    let checked = 0;
    for (const kind of KINDS) {
      for (const id of introduced(kind)!.rooms) {
        const room = ROOMS[id];
        const hazards = room.interior!.building.hazards;
        const mine = hazards.find(h => h.kind === kind)!;
        // a point inside both zones where another taught kind is nearest: once that kind has shown, this one wins
        found: for (const other of hazards.filter(h => h.kind !== kind && roomTeaches(room).has(h.kind))) {
          const at = anchor(mine);
          for (let x = at.x - 400; x < at.x + 400; x += 10) {
            for (let y = at.y - 400; y < at.y + 400; y += 10) {
              if (hazardReach(mine, x, y) >= lessonNear(kind) || roomHazardLesson(room, x, y, 0) !== ROOM_HAZARD_LESSONS[other.kind]!()) continue;
              expect(roomHazardLesson(room, x, y, 0, new Set([other.kind])), `${id} at ${x},${y}`).toBe(ROOM_HAZARD_LESSONS[kind]!());
              checked++;
              break found;
            }
          }
        }
      }
    }
    expect(checked, 'found rooms where two prompt zones overlap').toBeGreaterThan(0);
  });

  it('stays out of rooms far from the hazard', () => {
    for (const kind of KINDS) {
      for (const id of introduced(kind)!.rooms) {
        const room = ROOMS[id];
        const far = (room.interior?.building.hazards ?? []).every(h => !roomTeaches(room).has(h.kind) || hazardReach(h, -5000, -5000) > lessonNear(h.kind));
        if (far) expect(roomHazardLesson(room, -5000, -5000, 0)).toBe('');
      }
    }
  });
});
