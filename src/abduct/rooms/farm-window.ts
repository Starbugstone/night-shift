import { BED_POSE, bed, prop, sprite, type Room } from './layout';

export const farmWindow: Room = {
  backdrop: 'room/bg_bedroom',
  human: 'doyle',
  pose: BED_POSE,
  furniture: [
    prop(sprite('room/portrait_cow', 28, 367)),
    prop(sprite('room/hanging_plant', 265, 188), [{ x: 272, y: 258, w: 68, h: 64 }]),
    bed(24),
    prop(sprite('room/nightstand', 360, 736)),
    prop(sprite('room/lamp', 377, 646)),
  ],
  exit: sprite('room/exit_window', 356, 269),
  exitZone: { x: 391, y: 376, w: 100, h: 59 },
  item: { sprite: sprite('room/slipper', 251, 746), name: 'slipper' },
  par: 35,
  route: [
    { x: 227, y: 740, seconds: 3.4 },
    { x: 208, y: 510, seconds: 8 },
    { x: 315, y: 462, seconds: 6 },
    { x: 450, y: 390, seconds: 6 },
  ],
};
