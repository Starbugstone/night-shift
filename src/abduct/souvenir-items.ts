// v4 items & recap humour: which Earth item lies about on each route, and where. A building's two routes
// carry different items so replays of a level vary; the room files say where the item rests and
// this table says what it is. A swapped item keeps the room's spot: same centre x, same bottom
// (so it sits on the same floor or cushion), unless `dx`/`dy` nudge it clear of the sleeper's limbs
// at spawn, or `at` puts it somewhere else in the building. Names are ids into `tr().items` and
// `tr().souvenirs`. tests/abduct-souvenir-reach.test.ts proves every spot can be reached and taken home.
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
  /** Rest somewhere else instead: centre x and the top of the surface it lies on (world px). */
  at?: { x: number; bottom: number };
}

/** Routes whose souvenir is not the one their room file places, or rests somewhere else. */
export const SOUVENIR_SWAPS: Readonly<Partial<Record<RoomId, Souvenir>>> = {
  // L1 Farmer Doyle (window keeps its slipper)
  // on the hearth, under the flue (at the bed's end it lay under Doyle's feet)
  farm_chimney: { key: 'room/prize_marrow', name: 'prize marrow', at: { x: 358, bottom: 626 } },
  // L2 Larry
  laundry_loading: { key: 'room/heart_boxers', name: 'heart-print boxers', dx: 85, dy: -81 },
  laundry_skylight: { key: 'room/odd_sock', name: 'odd sock' },
  // L3 suburbia
  // v4 items: on the upstairs-hall bookcase by the attic ladder (the Field Check keeps it on the bed)
  dave_roof: { key: 'room/slipper', name: 'orthodontic slipper', at: { x: 1350, bottom: 466 } },
  // v4 items: on the downstairs couch, a dip off the route (Dave's slipper is at the foot of his bed)
  dave_patio: { key: 'room/demo_dentures', name: 'demo dentures', at: { x: 1170, bottom: 1266 } },
  // v4 items: on top of the kitchen fridge (on the floor by the telly no body could reach it)
  barb_backdoor: { key: 'room/coach_whistle', name: "coach's whistle", at: { x: 1400, bottom: 486 } },
  // v4 items: on the top crate in the side workshop, between Gary's camera and the watch dog
  gary_garagedoor: { key: 'room/tinfoil_hat', name: 'tinfoil hat', at: { x: 1566, bottom: 576 } },
  // L4 downtown
  // v4 items: on the gift-shop bookcase, a short detour at the foot of the ladder
  nigel_loading: { key: 'room/ufo_snow_globe', name: 'UFO snow globe', at: { x: 475, bottom: 1166 } },
  // v4 items: on the green-room couch by the fire escape
  kev_fireescape: { key: 'room/vinyl_12inch', name: '12-inch remix', at: { x: 2168, bottom: 626 } },
  // v4 items: hung on the top of the flag stand
  mayor_elevator: { key: 'room/toupee', name: 'mayoral toupee', at: { x: 604, bottom: 466 } },
  // L5 Barnacle Bay
  bubbles_tunnel: { key: 'room/rubber_duck', name: 'rubber duck', at: { x: 96, bottom: 686 } },
  // v4 items: on the boat-shed floor on the way to the slipway door
  pete_slipway: { key: 'room/ship_bottle', name: 'ship in a bottle', at: { x: 1650, bottom: 1786 } },
  // v4 items: on the fish crates by the crate tower and Kipper, near the dock door
  sal_dock: { key: 'room/cash_tin', name: 'petty cash tin', at: { x: 1570, bottom: 586 } },
  // L6 St. Mildred's: the rear route runs down the Endoscopy ("Internal Affairs") corridor
  // v4 items: on the top crate in the supply room, by the rear entrance
  hank_rear: { key: 'room/silver_plug', name: 'silver butt plug', at: { x: -1258, bottom: 576 } },
  osei_pharmacy: { key: 'room/glove_balloon', name: 'inflated rubber glove' },
  pemberton_chute: { key: 'room/bedpan', name: 'bedpan' },
  // L7 SS Buffet Royale
  // v4 easter eggs (Titanic): on the chart-room bookcase, on the way to the mast
  captain_mast: { key: 'room/blue_heart_pendant', name: 'blue heart pendant', at: { x: 1390, bottom: 466 } },
  // v4 items: on the bridge counter beside the brass compass (a detour off the funnel route; mind the compass)
  captain_funnel: { key: 'room/captains_log', name: "captain's log", at: { x: 665, bottom: 576 } },
  // v4 items: on the dining-room counter past the chocolate fountain, by the promenade door
  marco_promenade: { key: 'room/pepper_mill', name: 'giant pepper mill', at: { x: 1669, bottom: 576 } },
  // v4 items: on the bar, a detour back up from the stairs (further along, the steward camera
  // catches the late descent: tests/abduct-souvenir-reach.test.ts)
  greg_cabin: { key: 'room/mankini', name: 'lime mankini', at: { x: 640, bottom: 576 } },
};

/** `room` with its item replaced by `s`, resting where the old item rested. */
export function withSouvenir(room: Room, s: Souvenir): Room {
  const old = room.item.sprite;
  const spec = ART[s.key];
  if (!spec) throw new Error(`souvenir art key not in the manifest: ${s.key}`);
  const { w, h } = spec;
  const x = s.at ? Math.round(s.at.x - w / 2) : Math.round(old.x + old.w / 2 - w / 2) + (s.dx ?? 0);
  const y = s.at ? s.at.bottom - h : old.y + old.h - h + (s.dy ?? 0);
  return { ...room, item: { name: s.name, sprite: { key: s.key, x, y, w, h } } };
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
