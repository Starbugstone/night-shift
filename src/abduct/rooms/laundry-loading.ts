import { CHAIR_POSE, FLOOR, chair, prop, sprite, type Room } from './layout';

export const laundryLoading: Room = {
  backdrop: 'room/bg_laundry',
  human: 'larry',
  pose: CHAIR_POSE,
  furniture: [
    chair(25),
    // Both machines share a solid face so a trailing foot cannot snag on the seam.
    prop({ ...sprite('room/washer', 205, 612), w: 108, h: 117 }, [{ x: 220, y: 623, w: 86, h: 218 }]),
    prop({ ...sprite('room/washer', 205, 729), w: 108, h: 117 }, []),
  ],
  exit: sprite('room/exit_loading_door', 334, FLOOR - 240),
  exitZone: { x: 441, y: 643, w: 50, h: 137 },
  cart: { sprite: { ...sprite('room/towel_cart', 326, 716), w: 95 }, travel: 13, speed: 0.74 },
  sign: sprite('room/sign_no_sleeping', 296, 360),
  item: { sprite: sprite('room/coffee_mug', 124, 674), name: 'coffee mug' },
  par: 38,
  route: [
    { x: 115, y: 650, seconds: 1.5 },
    { x: 160, y: 648, seconds: 2 },
    { x: 165, y: 576, seconds: 4 },
    { x: 173, y: 462, seconds: 4 },
    { x: 470, y: 471, seconds: 7 },
    { x: 470, y: 672, seconds: 4 },
    { x: 470, y: 672, seconds: 1.8 },
  ],
};
