import { en } from '../../i18n/en';
import { birchRoom, birchSection, roomArt, roomFit } from './deep-birch-bakery';
import { building, type Hazard, type Opening } from './interior';
import { BED_POSE, CHAIR_POSE, prop, type Area, type Room } from './layout';

const noraPose = { ...BED_POSE, neckX: 114, neckY: 550 };
const lenPose = { ...CHAIR_POSE, neckX: 120, neckY: 507 };
const cot = prop(roomFit('folding_cot', 42, 576, 295, 36), [{ x: 49, y: 576, w: 282, h: 15 }]);
const chair = prop(roomArt('office_chair', 93, 536), [{ x: 103, y: 614, w: 90, h: 17 }, { x: 138, y: 631, w: 20, h: 48 }]);
const phase = { period: 7.5, open: 4.5, phase: 0.4 };
const loanedLaser = 'Garage laser';
const laser = (area: Area): Hazard => ({ kind: 'laser', name: loanedLaser, area, cycle: phase });
const sideExit = roomFit('door_frame', 806, 365, 112, 285);
const photos = roomArt('gary_flash_strip', 356, 279);
const sideGarage = birchSection('Henderson garage', 'workshop', { x: 0, y: 0, w: 918, h: 700 }, [
  cot,
  prop(roomFit('workbench', 301, 471, 238, 110)),
  prop(roomFit('shelf', 692, 459, 94, 20)),
], [sideExit, photos]);

const loftExit = roomFit('exit_roof_hatch', 537, 10, 204, 76);
const loftGarage = birchSection('Henderson loft', 'workshop', { x: 0, y: 0, w: 782, h: 700 }, [
  cot,
  prop(roomFit('workbench', 172, 626, 112, 55)),
  prop(roomFit('shelf', 334, 14, 40, 390)),
  prop(roomFit('shelf', 685, 508, 78, 20)),
  prop(roomFit('shelf', 689, 159, 73, 15)),
], [loftExit, photos, roomArt('house_sitting_checklist', 685, 177)]);

const workshopExit = roomFit('door_frame', 680, 318, 110, 248);
const workshop = birchSection('Len’s workshop', 'workshop', { x: 0, y: 0, w: 790, h: 700 }, [
  chair,
  prop(roomFit('workbench', 334, 476, 222, 126)),
  prop(roomFit('counter', 548, 506, 67, 114)),
], [workshopExit]);

const skylightExit = roomFit('exit_skylight', 488, 10, 200, 80);
const skylight = birchSection('Len’s skylight', 'workshop', { x: 0, y: 0, w: 730, h: 700 }, [
  chair,
  prop(roomFit('bike_repair_stand', 349, 251, 173, 153), [{ x: 352, y: 256, w: 160, h: 138 }]),
  prop(roomFit('shelf', 350, 14, 32, 250)),
  prop(roomFit('shelf', 648, 512, 70, 20)),
  prop(roomFit('shelf', 659, 300, 60, 17)),
], [skylightExit]);

const opening = (axis: Opening['axis'], at: number, from: number, to: number): Opening => ({
  axis, at, from, to, trim: axis === 'vertical' ? 'door' : 'shaft',
});

export const NEIGHBOUR_ROOMS = {
  nora_side: birchRoom(
    building([sideGarage], [opening('vertical', 918, 365, 650)], [laser({ x: 583, y: 14, w: 10, h: 672 })]),
    'nora', noraPose, 'nora_side', en.birch.noraMumble, sideExit, { x: 832, y: 500, w: 80, h: 115 },
    [{ x: 165, y: 325 }, { x: 420, y: 293 }, { x: 470, y: 290 }, { x: 741, y: 290, cross: loanedLaser, speed: 185 }, { x: 865, y: 538 }],
    'house-sitting checklist', 'house_sitting_checklist', 729, 459,
  ),
  nora_loft: birchRoom(
    building([loftGarage], [opening('horizontal', 0, 537, 741)], [laser({ x: 372, y: 235, w: 396, h: 10 })]),
    'nora', noraPose, 'nora_loft', en.birch.noraMumble, loftExit, { x: 553, y: 26, w: 164, h: 64 },
    [{ x: 176, y: 485 }, { x: 443, y: 514, speed: 35 }, { x: 656, y: 503 }, { x: 646, y: 386 }, { x: 646, y: 73, cross: loanedLaser, speed: 155 }, { x: 645, y: 61 }],
    'magnetic parts dish', 'magnetic_parts_dish', 724, 159, true,
  ),
  len_workshop: birchRoom(
    building([workshop], [opening('vertical', 790, 318, 566)], []),
    'len', lenPose, 'len_workshop', en.birch.lenMumble, workshopExit, { x: 704, y: 366, w: 80, h: 144 },
    [{ x: 171, y: 475 }, { x: 192, y: 358 }, { x: 325, y: 344 }, { x: 508, y: 351 }, { x: 746, y: 414 }],
    'bicycle bell', 'bicycle_bell', 515, 476,
  ),
  len_skylight: birchRoom(
    building([skylight], [opening('horizontal', 0, 488, 688)], []),
    'len', lenPose, 'len_skylight', en.birch.lenMumble, skylightExit, { x: 504, y: 25, w: 164, h: 64 },
    [{ x: 173, y: 478 }, { x: 262, y: 445 }, { x: 607, y: 450 }, { x: 602, y: 60 }],
    'biscuit tin', 'biscuit_tin', 688, 300, true,
  ),
} satisfies Record<string, Room>;
