import type { RoomId } from '../../contracts';
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
};
