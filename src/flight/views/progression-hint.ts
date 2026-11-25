import { tr } from '../../i18n';
import type { DeepFlightScene } from '../deep-scene';
import { inLighthouseShadow } from '../lighthouse';

/** How far past its entry edge a lesson that is already showing stays up (same as the room lessons). */
export const LESSON_EXIT_PAD = 12;

/**
 * The flight lesson for this frame, or ''. `active` is the lesson shown last frame: it keeps its
 * zone LESSON_EXIT_PAD px wider, so a saucer drifting along a zone edge doesn't make it flicker.
 */
export function flightLesson(scene: DeepFlightScene, active = ''): string {
  const { sim, run, level } = scene;
  if (scene.state !== 'fly' || scene.bannerT > 0 || run.legs > 0) return '';
  const { x, y } = sim.saucer;
  const { lessons } = tr();
  const pad = (tip: string): number => (tip === active ? LESSON_EXIT_PAD : 0);
  if (scene.practice) {
    if (sim.suspicion > 0) return lessons.coolOff;
    const { ring, porch } = tr().fieldCheck.prompts;
    return sim.inRing >= 0 || y < 575 + pad(ring) - pad(porch) ? ring : porch;
  }
  switch (level.id) {
    case 'level3':
      for (const hazard of sim.field.defs) {
        if (hazard.type !== 'porch') continue;
        const d = Math.hypot(x - hazard.x, y - hazard.y);
        if (d < hazard.r + 85 + pad(lessons.coolOff) && sim.suspicion > 0) return lessons.coolOff;
        const p = pad(lessons.porch);
        if (d > hazard.r - p && d < hazard.r + 85 + p && y < 1120 + p && sim.inRing < 0) return lessons.porch;
      }
      break;
    case 'level4': {
      const p = pad(lessons.traffic);
      if (y > 3400 - p && y < 3600 + p) return lessons.traffic;
      break;
    }
    case 'level5': {
      const beam = sim.field.defs[0];
      if (beam?.type === 'lighthouse' && y > 2920 - pad(lessons.lighthouse) && inLighthouseShadow(beam, x, y)) return lessons.lighthouse;
      break;
    }
    case 'level6': {
      const p = pad(lessons.ambulance);
      if (y > 2720 - p && y < 2980 + p) return lessons.ambulance;
      break;
    }
    case 'level7': {
      const p = pad(lessons.shutter);
      if (y > 3030 - p && y < 3400 + p && sim.inRing < 0) return lessons.shutter;
      break;
    }
    case 'level8': {
      const slab = sim.field.defs[0];
      if (slab?.type === 'hum' && sim.inRing < 0) {
        const p = pad(lessons.hum);
        const distance = Math.hypot(x - slab.x, y - slab.y);
        if (distance > slab.outer - p && distance < slab.outer + 135 + p) return lessons.hum;
      }
      break;
    }
  }
  return '';
}
