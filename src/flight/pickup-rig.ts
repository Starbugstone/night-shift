// Town pickup art: the footprint of each pickup and, for the people, the layers that move.
// Data only (no DOM, no Pixi): `scripts/art-pickups.mjs` cuts the part SVGs from these boxes and
// `PickupFigure` (src/flight/views/collectible.ts) places and animates them. All numbers are in the
// figure's own px, origin at the top-left of `flight/pickup_<id>` (the whole figure, standing still).
import type { MapCollectibleId } from '../contracts';
import type { FigureBeat } from './pickup-pose';

/** Manifest key of a pickup's whole art (a complete still picture, also for the trophy room). */
export function pickupKey(id: MapCollectibleId): string {
  return `flight/pickup_${id}`;
}

/** Size of `flight/pickup_<id>` in logical px: how big the pickup is on the map. */
export const PICKUP_SIZE: Record<MapCollectibleId, readonly [w: number, h: number]> = {
  slipper_flyer: [58, 86],
  astronomer: [128, 112],
  saucer_photo: [100, 108],
  obelisk_crate: [112, 108],
  defibrillator: [116, 84],
  shrimp_tower: [104, 116],
  krix: [92, 116],
  // v4 L9 1955
  time_car: [96, 172],
};

/** How far one channel moves a part at full strength: px, radians, and extra scale (0.05 = +5 %). */
export interface PartMove {
  dx?: number;
  dy?: number;
  rot?: number;
  scale?: number;
}

/** One layer of a person: an SVG cut from the figure, turning about its pivot. */
export interface RigPart {
  /** Manifest key of the layer. */
  key: string;
  /** The layer's box in the figure (the SVG's viewBox is `0 0 w h`). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Pivot (neck, elbow, mount) in figure px. */
  px: number;
  py: number;
  /** The eyes and mouth ride on this layer. */
  face?: boolean;
  /** Glance sideways (signed: -1 left, 1 right). */
  look?: PartMove;
  yawn?: PartMove;
  /** The figure's own first beat (sip, hug) and second beat (adjust the dish, toast pops). */
  actA?: PartMove;
  actB?: PartMove;
  /** The damped shake that starts the second beat. */
  wobble?: PartMove;
}

export interface RigEye {
  x: number;
  y: number;
  /** The eye white, or the dot itself when the face has dot eyes. */
  rx: number;
  ry: number;
}

/** A person who idles on the map: blinks, glances, yawns and has two beats of their own. */
export interface PersonRig {
  /** Layers in draw order. */
  parts: readonly RigPart[];
  eyes: readonly RigEye[];
  /** Pupil radii and how far a glance moves it; null = dot eyes (the eye itself moves and squashes shut). */
  pupil: { rx: number; ry: number; travelX: number; travelY: number } | null;
  /** Eyelid colour (skin); only for eyes with whites. */
  lid: string;
  mouth: { x: number; y: number; w: number };
  /** Where the eyes go during the second beat (the dish, the toast). */
  actBLook: { x: number; y: number };
  /** How shut the eyes are while the first beat holds (a sip, a hug). */
  actALid: number;
  /** The beats, in order; the timeline walks it from a per-pickup offset. */
  pattern: readonly FigureBeat[];
}

export const PERSON_RIGS: Partial<Record<MapCollectibleId, PersonRig>> = {
  // L3: sips from the thermos cup, fiddles with the dish
  astronomer: {
    parts: [
      { key: 'flight/pickup_astronomer_body', x: 0, y: 0, w: 128, h: 112, px: 64, py: 100 },
      {
        key: 'flight/pickup_astronomer_dish', x: 2, y: 0, w: 82, h: 68, px: 38, py: 58,
        actB: { rot: -0.24 }, wobble: { rot: 0.16 },
      },
      {
        key: 'flight/pickup_astronomer_head', x: 74, y: 10, w: 48, h: 48, px: 98, py: 54, face: true,
        look: { dx: 1.6, rot: 0.06 }, yawn: { rot: -0.16, dy: -1 }, actA: { rot: -0.1 },
      },
      {
        key: 'flight/pickup_astronomer_arm', x: 70, y: 50, w: 36, h: 36, px: 80, py: 70,
        actA: { dx: 3, dy: -17, rot: 0.3 }, yawn: { dy: 2 },
      },
    ],
    eyes: [{ x: 92.5, y: 43.5, rx: 2, ry: 2.5 }, { x: 103.5, y: 43.5, rx: 2, ry: 2.5 }],
    pupil: null,
    lid: '#ffc9a1',
    mouth: { x: 98, y: 50, w: 10 },
    actBLook: { x: -1, y: 0 },
    actALid: 1,
    pattern: ['look', 'actA', 'actB', 'look', 'yawn', 'actA'],
  },
  // L8: hugs the toaster; now and then the toast pops
  krix: {
    parts: [
      { key: 'flight/pickup_krix_body', x: 0, y: 56, w: 92, h: 60, px: 46, py: 108 },
      {
        key: 'flight/pickup_krix_head', x: 6, y: 0, w: 80, h: 68, px: 46, py: 62, face: true,
        look: { dx: 1.5, rot: 0.05 }, yawn: { rot: -0.14, dy: -1.5 }, actA: { rot: 0.1, dy: 2.5 }, wobble: { dy: -1.2 },
      },
      {
        key: 'flight/pickup_krix_toast', x: 28, y: 68, w: 36, h: 32, px: 46, py: 94,
        actA: { dy: -3 }, actB: { dy: -11 }, wobble: { dy: -4 },
      },
      {
        key: 'flight/pickup_krix_front', x: 12, y: 70, w: 68, h: 42, px: 46, py: 92,
        actA: { dy: -3, scale: 0.05 }, wobble: { dy: 1 },
      },
    ],
    eyes: [{ x: 35, y: 40, rx: 9.5, ry: 11 }, { x: 57, y: 39, rx: 9, ry: 11 }],
    pupil: { rx: 4.4, ry: 5.8, travelX: 3.4, travelY: 3 },
    lid: '#468c89',
    mouth: { x: 46, y: 57, w: 12 },
    actBLook: { x: 0, y: 1 },
    actALid: 1,
    pattern: ['look', 'actB', 'actA', 'look', 'yawn', 'actB'],
  },
};

/** Every art key the pickups use: the whole figures, then the people's layers. */
export function pickupArtKeys(): string[] {
  const ids = Object.keys(PICKUP_SIZE) as MapCollectibleId[];
  return [...ids.map(pickupKey), ...ids.flatMap((id) => PERSON_RIGS[id]?.parts.map((p) => p.key) ?? [])];
}
