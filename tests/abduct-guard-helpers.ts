// Shared walkers for the abduction-room guard tests (tests/abduct-prop-roles.test.ts,
// tests/abduct-sprite-aspect.test.ts). Pure data, no DOM.
import type { RoomId } from '../src/contracts';
import { ROOMS } from '../src/abduct/rooms/index';
import type { Area, Room, Sprite } from '../src/abduct/rooms/layout';

export const ROOM_ENTRIES = Object.entries(ROOMS) as [RoomId, Room][];

/** One drawn sprite in a room, with where it came from. */
export interface Placement {
  room: RoomId;
  /** furniture, exit, item, cat, cart, sign, decor, section-furniture, support, mount, sleeper, hazard:<kind>, area:<kind> */
  role: string;
  sprite: Sprite;
}

/**
 * Every sprite a room draws from its data: the flat-room parts, every interior section's pieces,
 * hazard sprites, gate and pop art (drawn into their area) and the sleepers in both states.
 * The section backdrops are left out: they tile (src/abduct/views/building.ts `backdrop`).
 */
export function placements(): Placement[] {
  const out: Placement[] = [];
  for (const [room, r] of ROOM_ENTRIES) {
    const add = (role: string, sprite: Sprite | undefined): void => {
      if (sprite) out.push({ room, role, sprite });
    };
    for (const f of r.furniture) add('furniture', f.sprite);
    add('exit', r.exit);
    add('item', r.item.sprite);
    add('cat', r.cat);
    add('cart', r.cart?.sprite);
    add('sign', r.sign);
    const b = r.interior?.building;
    if (!b) continue;
    for (const s of b.rooms) {
      for (const d of s.decor) add('decor', d);
      for (const f of s.furniture) add('section-furniture', f);
      for (const f of s.supports) add('support', f.sprite);
      for (const m of s.mounts) add('mount', m);
    }
    for (const h of b.hazards) {
      if ('sprite' in h) add(`hazard:${h.kind}`, h.sprite);
      if ((h.kind === 'gate' || h.kind === 'pop') && h.artKey) add(`area:${h.kind}`, { key: h.artKey, ...h.area });
    }
    for (const s of b.sleepers) {
      add('sleeper', s.asleep);
      add('sleeper', s.awake);
    }
  }
  return out;
}

/** Area of `a` inside `b`. */
export function overlap(a: Area, b: Area): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Distance from (x, y) to the nearest point of `a` (0 inside). */
export function distanceTo(a: Area, x: number, y: number): number {
  const dx = Math.max(a.x - x, 0, x - a.x - a.w);
  const dy = Math.max(a.y - y, 0, y - a.y - a.h);
  return Math.hypot(dx, dy);
}
