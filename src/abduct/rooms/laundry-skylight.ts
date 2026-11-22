import { CHAIR_POSE, prop, sprite, type Room } from './layout';

export const laundrySkylight: Room = {
  backdrop: 'room/bg_laundry',
  human: 'larry',
  pose: CHAIR_POSE,
  furniture: [
    prop('room/office_chair', 48, 696),
    prop('room/washer', 238, 716),
    prop('room/washer', 390, 716),
  ],
  exit: sprite('room/exit_skylight', 264, 140),
  exitZone: { x: 312, y: 158, w: 127, h: 69 },
  fan: { x: 272, y: 350, angle: -0.52, speed: 0.52 },
  item: { sprite: sprite('room/coffee_mug', 144, 630), name: 'coffee mug' },
  par: 30,
  route: [
    { x: 128, y: 622, seconds: 0.8 },
    { x: 190, y: 538, seconds: 3.2 },
    { x: 483, y: 582, seconds: 9 },
    { x: 483, y: 582, seconds: 0.9 },
    { x: 483, y: 166, seconds: 3.4 },
    { x: 406, y: 159, seconds: 3.5 },
  ],
};
