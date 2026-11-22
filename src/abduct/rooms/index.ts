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

export const ROOMS: Readonly<Record<RoomId, Room>> = {
  farm_window: farmWindow,
  farm_chimney: farmChimney,
  laundry_skylight: laundrySkylight,
  laundry_loading: laundryLoading,
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
};
