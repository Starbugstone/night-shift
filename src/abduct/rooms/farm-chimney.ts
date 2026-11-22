import { CHAIR_POSE, prop, sprite, type Room } from './layout';

export const farmChimney: Room = {
  backdrop: 'room/bg_chimney',
  human: 'doyle',
  pose: { ...CHAIR_POSE, neckX: 109, neckY: 620 },
  furniture: [
    prop('room/bed', 22, 706),
    prop('room/fireplace', 256, 626),
    prop('room/pot_rack', 34, 301),
    prop('room/shelf', 111, 462),
  ],
  masonry: [
    { x: 264, y: 253, w: 33, h: 137 },
    { x: 491, y: 253, w: 32, h: 373 },
  ],
  exit: sprite('room/exit_chimney_top', 332, 144),
  exitZone: { x: 343, y: 160, w: 113, h: 70 },
  cat: sprite('room/cat_sleeping', 204, 412),
  item: { sprite: sprite('room/slipper', 123, 685), name: 'slipper' },
  par: 29,
  route: [
    { x: 131, y: 651, seconds: 1 },
    { x: 142, y: 555, seconds: 5 },
    { x: 409, y: 550, seconds: 8 },
    { x: 404, y: 173, seconds: 8 },
  ],
};
