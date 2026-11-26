import type { RoomId } from '../../contracts';
import {
  barbBackdoor, barbChimney, davePatio, daveRoof, garyGaragedoor, garySkylight, kevFireescape, kevVent,
  mayorClocktower, mayorElevator, nigelLoading, nigelSkylight,
} from './deep';
import { farmChimney } from './farm-chimney';
import { farmWindow } from './farm-window';
import { laundryLoading } from './laundry-loading';
import { laundrySkylight } from './laundry-skylight';
import type { Room } from './layout';
// v4 items & recap humour: per-route souvenirs
import { withSouvenirs } from '../souvenir-items';
// L5 pier code
import { bubblesRoof, bubblesTunnel, peteGallery, peteSlipway, salDock, salLoft } from './deep-pier';
// L6 clinic code
import { hankFront, hankRear, oseiHelipad, oseiPharmacy, pembertonChute, pembertonWindow } from './deep-clinic';
// v4 L9 1955
import { ROOMS_2199 } from './deep-2199';
import { ROOMS_1955 } from './deep-1955';
// v4 Birch Lane
import { BAKERY_ROOMS } from './deep-birch-bakery';
import { NEIGHBOUR_ROOMS } from './deep-birch-neighbours';
// v4 1122
import { GRAIL_ROOMS } from './deep-grail';
// v4 1953
import { ROOMS_1953 } from './deep-1953';
// v4 L8
import { MONOLITH_ROOMS } from './deep-monolith';
// L7 cruise code
import { captainFunnel, captainMast, gregAwning, gregCabin, marcoPromenade, marcoSkylight } from './deep-ship';

export const ROOMS: Readonly<Record<RoomId, Room>> = withSouvenirs({
  farm_window: farmWindow,
  farm_chimney: farmChimney,
  laundry_skylight: laundrySkylight,
  laundry_loading: laundryLoading,
  // v4 Birch Lane
  ...BAKERY_ROOMS,
  ...NEIGHBOUR_ROOMS,
  dave_roof: daveRoof,
  dave_patio: davePatio,
  barb_chimney: barbChimney,
  barb_backdoor: barbBackdoor,
  gary_skylight: garySkylight,
  gary_garagedoor: garyGaragedoor,
  nigel_skylight: nigelSkylight,
  nigel_loading: nigelLoading,
  kev_vent: kevVent,
  kev_fireescape: kevFireescape,
  mayor_clocktower: mayorClocktower,
  mayor_elevator: mayorElevator,
  // L5 pier code
  bubbles_roof: bubblesRoof,
  bubbles_tunnel: bubblesTunnel,
  pete_gallery: peteGallery,
  pete_slipway: peteSlipway,
  sal_loft: salLoft,
  sal_dock: salDock,
  // L6 clinic code
  hank_front: hankFront,
  hank_rear: hankRear,
  osei_helipad: oseiHelipad,
  osei_pharmacy: oseiPharmacy,
  pemberton_window: pembertonWindow,
  pemberton_chute: pembertonChute,
  // v4 L8
  ...MONOLITH_ROOMS,
  // v4 L9 1955
  ...ROOMS_1955,
  // v4 1122
  ...GRAIL_ROOMS,
  // v4 1953
  ...ROOMS_1953,
  // v4 2199
  ...ROOMS_2199,
  // L7 cruise code
  captain_mast: captainMast,
  captain_funnel: captainFunnel,
  marco_skylight: marcoSkylight,
  marco_promenade: marcoPromenade,
  greg_awning: gregAwning,
  greg_cabin: gregCabin,
});
