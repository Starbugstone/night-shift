// v0.2 follow-up: where an interior room's exit tag ("ROOF HATCH", "TRAPPE DU TOIT") sits. The tag
// belongs over (or, for a roof exit, under) the exit, but the camera follows the specimen, so near
// the edge of the view the tag slides along the edge instead of running off it. DOM-free geometry,
// shared by the room view and tests/abduct-exit-tag.test.ts.
import { VIEW_H, VIEW_W } from '../contracts';
import { HUD_ROW } from '../ui/hud';
import type { Room } from './rooms/layout';

export const EXIT_TAG = { size: 14, weight: 900, padX: 22, h: 24 } as const;
/** Gap kept between the tag and the screen edge. */
const MARGIN = 6;
/** Top of the bottom HUD bar (room name and exit name), in screen px. */
const BOTTOM_BAR = 887;

export interface TagBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The exit tag's box in world px for camera (cx, cy): centred on the exit, then kept inside the view
 * between the top HUD row and the bottom bar. `textW` is the measured title width. The view passes its own
 * `out` box every frame (no per-frame allocation, tests/shell-hot-alloc.test.ts).
 */
export function exitTagBox(
  room: Pick<Room, 'exit' | 'exitZone' | 'roofExit'>, exitX: number, textW: number, cx: number, cy: number,
  out: TagBox, // required (v0.2 council round 3, Opus O3): a default box allocated every frame when a caller left it out
): TagBox {
  const { exit: s, exitZone: a } = room;
  const w = textW + EXIT_TAG.padX;
  const h = EXIT_TAG.h;
  const midY = room.roofExit ? Math.max(s.y + s.h, a.y + a.h) + 17 : s.y - 17;
  const x = clampTo(exitX - w / 2, cx + MARGIN, cx + VIEW_W - MARGIN - w);
  const y = clampTo(midY - h / 2, cy + HUD_ROW.y + HUD_ROW.h + MARGIN, cy + Math.min(VIEW_H, BOTTOM_BAR) - MARGIN - h);
  out.x = x;
  out.y = y;
  out.w = w;
  out.h = h;
  return out;
}

/** Like clamp, but a box wider than the room it is kept in keeps its left/top edge on screen. */
function clampTo(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
