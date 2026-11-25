// v4 items & recap humour: which Earth item lies about on each route. A building's two routes
// carry different items so replays of a level vary; the room files say where the item rests and
// this table says what it is. A swapped item keeps the room's spot: same centre x, same bottom
// (so it sits on the same floor or cushion), unless `dx`/`dy` nudge it clear of the sleeper's limbs
// at spawn. Names are ids into `tr().items` and `tr().souvenirs`.
// Pure data, DOM-free; the drawings for the new keys are in ./souvenir-art.ts.
import { ART } from '../art-manifest';
import type { RoomId } from '../contracts';
import type { Room } from './rooms/layout';

export interface Souvenir {
  /** Art key (`room/...`), sized by the manifest. */
  key: string;
  /** Item id: its English name. */
  name: string;
  /** Nudge from the old item's spot (px), when the sleeper's spawn pose would hide it. */
  dx?: number;
  dy?: number;
}

/** Routes whose souvenir is not the one their room file places. */
export const SOUVENIR_SWAPS: Readonly<Partial<Record<RoomId, Souvenir>>> = {
  // L1 Farmer Doyle (window keeps its slipper)
  farm_chimney: { key: 'room/prize_marrow', name: 'prize marrow' },
  // L2 Larry
  laundry_loading: { key: 'room/heart_boxers', name: 'heart-print boxers', dx: 85, dy: -81 },
  laundry_skylight: { key: 'room/odd_sock', name: 'odd sock' },
  // L3 suburbia
  // v4 easter eggs: nudged out from behind the sleeper's leg (Dave: under his raised knee; Barb: off
  // the couch end, on the floor by the telly)
  dave_patio: { key: 'room/demo_dentures', name: 'demo dentures', dx: -48 },
  barb_backdoor: { key: 'room/coach_whistle', name: "coach's whistle", dx: 56 },
  gary_garagedoor: { key: 'room/tinfoil_hat', name: 'tinfoil hat' },
  // L4 downtown
  nigel_loading: { key: 'room/ufo_snow_globe', name: 'UFO snow globe' },
  kev_fireescape: { key: 'room/vinyl_12inch', name: '12-inch remix' },
  mayor_elevator: { key: 'room/toupee', name: 'mayoral toupee' },
  // L5 Barnacle Bay
  bubbles_tunnel: { key: 'room/rubber_duck', name: 'rubber duck' },
  pete_slipway: { key: 'room/ship_bottle', name: 'ship in a bottle' },
  sal_dock: { key: 'room/cash_tin', name: 'petty cash tin' },
  // L6 St. Mildred's: the rear route runs down the Endoscopy ("Internal Affairs") corridor
  hank_rear: { key: 'room/silver_plug', name: 'silver butt plug' },
  osei_pharmacy: { key: 'room/glove_balloon', name: 'inflated rubber glove' },
  pemberton_chute: { key: 'room/bedpan', name: 'bedpan' },
  // L7 SS Buffet Royale
  // v4 easter eggs (Titanic): on his chair seat (the floor past his boots is the open hatch)
  captain_mast: { key: 'room/blue_heart_pendant', name: 'blue heart pendant', dx: -95 },
  captain_funnel: { key: 'room/captains_log', name: "captain's log" },
  marco_promenade: { key: 'room/pepper_mill', name: 'giant pepper mill' },
  greg_cabin: { key: 'room/mankini', name: 'lime mankini' },
};

/** `room` with its item replaced by `s`, resting where the old item rested. */
export function withSouvenir(room: Room, s: Souvenir): Room {
  const old = room.item.sprite;
  const spec = ART[s.key];
  if (!spec) throw new Error(`souvenir art key not in the manifest: ${s.key}`);
  const { w, h } = spec;
  return {
    ...room,
    item: { name: s.name, sprite: { key: s.key, x: Math.round(old.x + old.w / 2 - w / 2) + (s.dx ?? 0), y: old.y + old.h - h + (s.dy ?? 0), w, h } },
  };
}

/** The room table with every swap applied. */
export function withSouvenirs<T extends Readonly<Record<RoomId, Room>>>(rooms: T): T {
  const out = { ...rooms } as Record<RoomId, Room>;
  for (const id of Object.keys(SOUVENIR_SWAPS) as RoomId[]) {
    const s = SOUVENIR_SWAPS[id];
    if (s && out[id]) out[id] = withSouvenir(out[id], s);
  }
  return out as T;
}
