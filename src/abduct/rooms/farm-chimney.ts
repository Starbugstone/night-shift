import { BED_POSE, CEILING, bed, prop, sprite, type Room } from './layout';

export const farmChimney: Room = {
  backdrop: 'room/bg_chimney',
  human: 'doyle',
  pose: BED_POSE,
  furniture: [
    bed(24),
    prop({ ...sprite('room/fireplace', 326, 626), w: 192 }, [{ x: 328, y: 626, w: 188, h: 216 }]),
    prop(sprite('room/pot_rack', 34, 301)),
    prop(sprite('room/shelf', 111, 466)),
  ],
  masonry: [
    { x: 332, y: CEILING, w: 18, h: 226 },
    { x: 478, y: CEILING, w: 24, h: 493 },
  ],
  flue: { x: 350, y: CEILING, w: 128, h: 493 },
  exit: sprite('room/exit_chimney_top', 344, CEILING),
  exitZone: { x: 370, y: 149, w: 88, h: 78 },
  roofExit: true,
  exitMouthY: 157,
  cat: sprite('room/cat_sleeping', 174, 421),
  item: { sprite: sprite('room/slipper', 251, 746), name: 'slipper' },
  par: 29,
  route: [
    { x: 155, y: 659, seconds: 2.2 },
    { x: 150, y: 568, seconds: 4 },
    { x: 390, y: 555, seconds: 7 },
    { x: 417, y: 470, seconds: 2.8 },
    { x: 414, y: 157, seconds: 8 },
  ],
};
