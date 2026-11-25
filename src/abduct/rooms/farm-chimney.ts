import { BED_POSE, CEILING, bed, prop, sprite, type Room } from './layout';

export const farmChimney: Room = {
  backdrop: 'room/bg_chimney',
  human: 'doyle',
  pose: BED_POSE,
  furniture: [
    bed(24),
    prop({ ...sprite('room/fireplace', 326, 626), w: 192 }, [{ x: 328, y: 626, w: 188, h: 216 }]),
    prop(sprite('room/pot_rack', 34, 301)),
    prop(sprite('room/shelf', 111, 425)),
  ],
  masonry: [
    { x: 332, y: CEILING, w: 18, h: 281 },
    { x: 494, y: CEILING, w: 24, h: 493 },
    { x: 350, y: 390, w: 63, h: 24 },
  ],
  flue: { x: 350, y: CEILING, w: 144, h: 493 },
  exit: sprite('room/exit_chimney_top', 344, CEILING),
  exitZone: { x: 370, y: 149, w: 88, h: 78 },
  roofExit: true,
  exitMouthY: 157,
  cat: sprite('room/cat_sleeping', 174, 380),
  item: { sprite: sprite('room/slipper', 251, 746), name: 'slipper' },
  par: 29,
  route: [
    { x: 155, y: 659, seconds: 2.2 },
    { x: 150, y: 508, seconds: 4 },
    { x: 400, y: 497, seconds: 7 },
    { x: 453, y: 456, seconds: 2.0 },
    { x: 453, y: 326, seconds: 3.2 },
    { x: 414, y: 157, seconds: 5.2 },
  ],
};
