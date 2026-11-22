import { BED_POSE, prop, sprite, type Room } from './layout';

export const farmWindow: Room = {
  backdrop: 'room/bg_bedroom',
  human: 'doyle',
  pose: BED_POSE,
  furniture: [
    prop('room/portrait_cow', 28, 367),
    prop('room/hanging_plant', 265, 188),
    prop('room/bed', 26, 706),
    prop('room/nightstand', 360, 736),
    prop('room/lamp', 377, 646),
  ],
  exit: sprite('room/exit_window', 365, 269),
  exitZone: { x: 404, y: 301, w: 87, h: 117 },
  item: { sprite: sprite('room/slipper', 187, 685), name: 'slipper' },
  par: 35,
  route: [
    { x: 169, y: 650, seconds: 1.4 },
    { x: 182, y: 453, seconds: 8 },
    { x: 316, y: 407, seconds: 7 },
    { x: 452, y: 357, seconds: 8 },
  ],
};
