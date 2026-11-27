// A prop is always solid or always decor (2026-11-26 player report, thread "Clarify Abduction Object
// Collisions": the player could not tell the solid props from the decor, and the shelf and the 1950s
// counter were decor in some rooms and solid in others).
//
// 1. One role per art key. Across every room, an art key is drawn either only as a solid prop (it has
//    colliders: Room.furniture, the cat, the cart, the sign) or only as decor (interior decor, mounts that
//    are not furniture). A player learns "shelves hold you" once, and it stays true in every room.
// 2. Drawn and solid agree. In a building, every solid the simulation builds from Room.furniture is drawn
//    as a solid section piece (with the cream rim), and every rimmed section piece is solid.
// 3. Colliders sit on the art. A collider lies mostly inside the art it belongs to (or a stack of the same
//    art, like the two washers in laundry_loading): no invisible wall beside a drawn prop.
//
// PENDING lists the art keys still waiting for their fix. It shrinks to empty: a pending key that already
// has one role fails the test until it is taken off the list.
import { describe, expect, it } from 'vitest';
import type { RoomId } from '../src/contracts';
import type { Area, Furniture, Room, Sprite } from '../src/abduct/rooms/layout';
import { distanceTo, overlap, ROOM_ENTRIES } from './abduct-guard-helpers';

/** Art keys that are still solid in some rooms and decor in others. */
const PENDING_ROLE = new Set<string>();

/** A collider may poke this far (px) past its art, and leave at most this share of its area off the art. */
const MAX_OVERHANG = 8;
const MAX_OFF_ART = 0.1;

type Role = 'solid' | 'decor';

/** Furniture with no shapes (`colliders: []`) counts as solid when another collider covers half of it. */
function furnitureRole(f: Furniture, all: readonly Furniture[]): Role {
  if (!f.colliders || f.colliders.length > 0) return 'solid';
  const s = f.sprite;
  const covered = all.flatMap(o => o.colliders ?? []).reduce((sum, c) => sum + overlap(s, c), 0);
  return covered >= 0.5 * s.w * s.h ? 'solid' : 'decor';
}

function isExit(room: Room, s: Sprite): boolean {
  const e = room.exit;
  return s === e || (s.key === e.key && s.x === e.x && s.y === e.y);
}

/** Every (key, role) use in a room. */
function roles(room: Room): { key: string; role: Role; where: string }[] {
  const out: { key: string; role: Role; where: string }[] = [];
  room.furniture.forEach((f, i) => out.push({ key: f.sprite.key, role: furnitureRole(f, room.furniture), where: `furniture #${i}` }));
  for (const [where, s] of [['cat', room.cat], ['cart', room.cart?.sprite], ['sign', room.sign]] as const) {
    if (s) out.push({ key: s.key, role: 'solid', where });
  }
  const solidSprites = new Set(room.furniture.map(f => f.sprite));
  for (const section of room.interior?.building.rooms ?? []) {
    for (const d of section.decor) {
      if (!isExit(room, d)) out.push({ key: d.key, role: 'decor', where: `${section.name} decor` });
    }
    for (const m of section.mounts) {
      if (!section.furniture.includes(m) && !solidSprites.has(m)) out.push({ key: m.key, role: 'decor', where: `${section.name} mount` });
    }
  }
  return out;
}

describe('a prop is always solid or always decor', () => {
  const uses = new Map<string, Map<Role, Set<RoomId>>>();
  for (const [id, room] of ROOM_ENTRIES) {
    for (const { key, role } of roles(room)) {
      const byRole = uses.get(key) ?? new Map<Role, Set<RoomId>>();
      uses.set(key, byRole);
      const rooms = byRole.get(role) ?? new Set<RoomId>();
      byRole.set(role, rooms);
      rooms.add(id);
    }
  }
  const mixed = (key: string): boolean => (uses.get(key)?.size ?? 0) > 1;

  it('gives every art key one role in every room', () => {
    const bad = [...uses.keys()].filter(k => mixed(k) && !PENDING_ROLE.has(k)).map(k => {
      const by = uses.get(k)!;
      return `${k}: solid in ${[...by.get('solid')!].join(', ')}; decor in ${[...by.get('decor')!].join(', ')}`;
    });
    expect(bad).toEqual([]);
  });

  for (const key of PENDING_ROLE) {
    it(`${key} still waits for its fix (remove it from PENDING_ROLE once it has one role)`, () => {
      expect(mixed(key), `${key} has one role now: drop it from PENDING_ROLE`).toBe(true);
    });
  }
});

describe('a building draws exactly its solids with the solid rim', () => {
  for (const [id, room] of ROOM_ENTRIES) {
    const b = room.interior?.building;
    if (!b) continue;
    it(id, () => {
      const rimmed = new Set<Sprite>(b.rooms.flatMap(s => [...s.furniture, ...s.supports.map(f => f.sprite)]));
      const solid = new Set<Sprite>(room.furniture.filter(f => furnitureRole(f, room.furniture) === 'solid').map(f => f.sprite));
      const unseen = [...solid].filter(s => !rimmed.has(s)).map(s => `${s.key} at ${s.x},${s.y} is solid but not drawn as a section piece`);
      const ghost = [...rimmed].filter(s => !solid.has(s)).map(s => `${s.key} at ${s.x},${s.y} wears the solid rim but has no collider`);
      expect([...unseen, ...ghost]).toEqual([]);
    });
  }
});

describe('colliders sit on their art', () => {
  for (const [id, room] of ROOM_ENTRIES) {
    it(id, () => {
      const bad: string[] = [];
      room.furniture.forEach((f, i) => {
        // The art this collider may sit on: its own sprite, or a stack of the same art in this room.
        const art: Area[] = room.furniture.filter(o => o.sprite.key === f.sprite.key).map(o => o.sprite);
        for (const c of f.colliders ?? []) {
          let off = 0;
          let total = 0;
          let worst = 0;
          for (let y = c.y + 1; y < c.y + c.h; y += 2) {
            for (let x = c.x + 1; x < c.x + c.w; x += 2) {
              total++;
              const d = Math.min(...art.map(a => distanceTo(a, x, y)));
              if (d > 0) off++;
              worst = Math.max(worst, d);
            }
          }
          if (total > 0 && (worst > MAX_OVERHANG || off / total > MAX_OFF_ART)) {
            bad.push(`${f.sprite.key} #${i} collider ${c.x},${c.y} ${c.w}x${c.h}: ${Math.round(100 * off / total)}% off the art, up to ${Math.round(worst)} px out`);
          }
        }
      });
      expect(bad).toEqual([]);
    });
  }
});
