import { CHAIR_POSE, CEILING, chair, prop, sprite, type Room } from './layout';

export const laundrySkylight: Room = {
  backdrop: 'room/bg_laundry',
  human: 'larry',
  pose: CHAIR_POSE,
  furniture: [
    chair(25),
    prop(sprite('room/washer', 228, 716)),
    prop(sprite('room/washer', 390, 716)),
  ],
  exit: sprite('room/exit_skylight', 264, CEILING),
  exitZone: { x: 305, y: 148, w: 118, h: 55 },
  roofExit: true,
  exitMouthY: 172,
  fan: { x: 272, y: 417, angle: -0.52, speed: 0.52, bladeLength: 150 },
  item: { sprite: sprite('room/coffee_mug', 242, 691), name: 'coffee mug' },
  par: 30,
  route: [
    { x: 105, y: 581, seconds: 3.8 },
    { x: 72, y: 407, seconds: 3.8 },
    { x: 81, y: 219, seconds: 4.8 },
    { x: 370, y: 154, seconds: 8 },
  ],
};
