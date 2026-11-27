import { BED_POSE, CEILING, bed, prop, sprite, type Room } from './layout';

export const farmChimney: Room = {
  backdrop: 'room/bg_chimney',
  human: 'doyle',
  pose: BED_POSE,
  furniture: [
    bed(24),
    prop(sprite('room/fireplace_narrow', 326, 626), [{ x: 328, y: 626, w: 188, h: 216 }]),
    prop(sprite('room/pot_rack', 34, 261)),
    prop(sprite('room/shelf', 177, 410)),
  ],
  masonry: [
    // L1 is a tutorial: the flue is one open shaft. A ledge inside it (v4) snagged every
    // straight climb up the middle and flipped the body under the cap. Keep the shaft clear;
    // the shelf below is the challenge.
    { x: 332, y: CEILING, w: 18, h: 226 },
    { x: 494, y: CEILING, w: 24, h: 493 },
  ],
  flue: { x: 350, y: CEILING, w: 144, h: 493 },
  exit: sprite('room/exit_chimney_top', 344, CEILING),
  exitZone: { x: 370, y: 149, w: 88, h: 78 },
  roofExit: true,
  exitMouthY: 157,
  // No straight-line win: a beeline from the bed to the flue cracks its head on the shelf's end
  // and the flue walls until Doyle wakes; lifting first and climbing the flue touches neither.
  // The cat naps on the shelf as an optional gag (bump it and it yowls).
  cat: sprite('room/cat_sleeping', 180, 365),
  item: { sprite: sprite('room/slipper', 251, 746), name: 'slipper' },
  par: 29,
  route: [
    { x: 155, y: 659, seconds: 2.2 },
    { x: 150, y: 508, seconds: 4 },
    { x: 400, y: 497, seconds: 7 },
    { x: 417, y: 470, seconds: 2.8 },
    { x: 414, y: 157, seconds: 8 },
  ],
};
