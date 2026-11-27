// First-encounter room prompts (council v0.2 item 10/11 teaching gaps): vacuums and dogs on patrol, fragile
// props, the chimney draft, Gary's camera and the Mayor's cuckoo shipped with nothing that taught them
// (tests/abduct-mechanic-taught.test.ts PENDING). src/abduct/room-lessons.ts now prompts for each of them in
// the rooms of the level that introduces it.
//
// Rule: every kind with a room prompt is taught on the first level in LEVELS order whose rooms use it, every
// room of that level with the kind gets the prompt, and wherever that room's autopilot route brings the chest
// to the hazard, the prompt showed first. (The L3 routes keep well clear of the patrols; a player who strays
// towards one gets the prompt on the way.)
import { describe, expect, it } from 'vitest';
import type { RoomId } from '../src/contracts';
import { ROOM_HAZARD_LESSONS, ROOM_LESSON_NEAR, hazardReach, roomHazardLesson, roomTeaches } from '../src/abduct/room-lessons';
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

function playRoom(id: RoomId, kind: Kind): RouteLog {
  const room = ROOMS[id];
  const sim = new AbductSimulation(room, new Set(), { sfx() {} }, () => 0.5, HARD);
  const tip = ROOM_HAZARD_LESSONS[kind]!();
  const hazards = (room.interior?.building.hazards ?? []).filter(h => h.kind === kind);
  const log: RouteLog = { shown: null, reached: null };
  let active = '';
  for (let f = 0; f < 160 * 60 && !sim.complete; f++) {
    const { dx, dy } = sim.autopilot();
    sim.moveBeam(sim.body.beamX + dx, sim.body.beamY + dy);
    sim.update(DT);
    const { chestX, chestY } = sim.body;
    if (log.reached === null && hazards.some(h => hazardReach(h, chestX, chestY) <= 0)) log.reached = sim.elapsed;
    active = roomHazardLesson(room, chestX, chestY, active ? 12 : 0);
    if (log.shown === null && active === tip) log.shown = sim.elapsed;
    if (log.shown !== null && log.reached !== null) break;
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

  it('stays out of rooms far from the hazard', () => {
    for (const kind of KINDS) {
      for (const id of introduced(kind)!.rooms) {
        const room = ROOMS[id];
        const far = (room.interior?.building.hazards ?? []).every(h => !roomTeaches(room).has(h.kind) || hazardReach(h, -5000, -5000) > ROOM_LESSON_NEAR);
        if (far) expect(roomHazardLesson(room, -5000, -5000, 0)).toBe('');
      }
    }
  });
});
