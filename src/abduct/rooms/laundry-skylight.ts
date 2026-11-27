import { CHAIR_POSE, CEILING, chair, prop, shelfFit, sprite, type Room } from './layout';

export const laundrySkylight: Room = {
  backdrop: 'room/bg_laundry',
  human: 'larry',
  pose: CHAIR_POSE,
  furniture: [
    chair(25),
    prop(sprite('room/washer', 228, 716)),
    prop(sprite('room/washer', 390, 716)),
    // The plank the room always had (a flat room insets a bare sprite by 5 px), under shelf art of its own length.
    prop(shelfFit(205, 348, 125, 24), [{ x: 210, y: 353, w: 115, h: 14 }]),
  ],
  exit: sprite('room/exit_skylight', 264, CEILING),
  exitZone: { x: 305, y: 148, w: 118, h: 65 },
  roofExit: true,
  exitMouthY: 172,
  fan: { x: 272, y: 417, angle: -0.52, speed: 0.52, bladeLength: 150 },
  item: { sprite: sprite('room/coffee_mug', 242, 691), name: 'coffee mug' },
  par: 30,
  route: [
    { x: 105, y: 581, seconds: 3.8 },
    { x: 72, y: 407, seconds: 3.8 },
    { x: 81, y: 186, seconds: 4.8 },
    { x: 392, y: 147, seconds: 8 },
  ],
};
