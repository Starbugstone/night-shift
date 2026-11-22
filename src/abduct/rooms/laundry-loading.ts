import { CHAIR_POSE, prop, sprite, type Room } from './layout';

export const laundryLoading: Room = {
  backdrop: 'room/bg_laundry',
  human: 'larry',
  pose: CHAIR_POSE,
  furniture: [
    prop('room/office_chair', 48, 696),
    prop('room/washer', 170, 716),
    prop('room/washer', 294, 716),
  ],
  exit: sprite('room/exit_loading_door', 344, 521),
  exitZone: { x: 444, y: 553, w: 71, h: 113 },
  cart: { sprite: sprite('room/towel_cart', 366, 716), travel: 20, speed: 0.74 },
  sign: sprite('room/sign_no_sleeping', 294, 388),
  item: { sprite: sprite('room/coffee_mug', 144, 630), name: 'coffee mug' },
  par: 38,
  route: [
    { x: 126, y: 625, seconds: 1.3 },
    { x: 150, y: 510, seconds: 6 },
    { x: 321, y: 507, seconds: 7 },
    { x: 478, y: 565, seconds: 8 },
  ],
};
