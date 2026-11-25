import { BED_POSE, bed, prop, sprite, type Room } from './layout';

export const farmWindow: Room = {
  backdrop: 'room/bg_bedroom',
  human: 'doyle',
  pose: BED_POSE,
  furniture: [
    prop({ ...sprite('room/portrait_cow', 27, 204), w: 82, h: 70 }),
    prop({ ...sprite('room/hanging_plant', 455, 135), w: 62, h: 109 }, [{ x: 462, y: 194, w: 50, h: 47 }]),
    bed(24),
    prop(sprite('room/nightstand', 360, 736)),
    prop(sprite('room/shelf', 202, 563)),
    prop(sprite('room/lamp', 377, 646)),
  ],
  exit: sprite('room/exit_window', 356, 269),
  exitZone: { x: 391, y: 376, w: 100, h: 59 },
  item: { sprite: sprite('room/slipper', 207, 543), name: 'slipper' },
  par: 35,
  route: [
    { x: 150, y: 585, seconds: 5 },
    { x: 155, y: 173, seconds: 7 },
    { x: 415, y: 173, seconds: 7 },
    { x: 445, y: 382, seconds: 5 },
  ],
};
