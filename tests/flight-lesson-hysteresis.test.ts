import { describe, expect, it } from 'vitest';
import { setLang, tr } from '../src/i18n';
import type { DeepFlightScene } from '../src/flight/deep-scene';
import { LESSON_EXIT_PAD, flightLesson } from '../src/flight/views/progression-hint';

function scene(levelId: string, x: number, y: number, extra: Partial<{ practice: boolean; inRing: number }> = {}): DeepFlightScene {
  return {
    state: 'fly', bannerT: 0, practice: extra.practice ?? false,
    run: { legs: 0 }, level: { id: levelId },
    sim: { saucer: { x, y }, suspicion: 0, inRing: extra.inRing ?? -1, field: { defs: [] } },
  } as unknown as DeepFlightScene;
}

describe('flight lessons', () => {
  setLang('en');
  const { traffic } = tr().lessons;

  it('enter on the hard edge and leave only 12 px past it', () => {
    expect(LESSON_EXIT_PAD).toBe(12);
    // outside the L4 traffic band: no lesson until the edge is crossed
    expect(flightLesson(scene('level4', 270, 3395))).toBe('');
    expect(flightLesson(scene('level4', 270, 3401))).toBe(traffic);
    // drifting back out across the edge keeps it up within the pad, then drops it
    expect(flightLesson(scene('level4', 270, 3395), traffic)).toBe(traffic);
    expect(flightLesson(scene('level4', 270, 3389), traffic)).toBe(traffic);
    expect(flightLesson(scene('level4', 270, 3387), traffic)).toBe('');
    // a lesson that isn't showing gets no pad
    expect(flightLesson(scene('level4', 270, 3395), '')).toBe('');
  });

  it('holds the Field Check prompt on either side of its switch line', () => {
    const { ring, porch } = tr().fieldCheck.prompts;
    expect(flightLesson(scene('level3', 540, 580, { practice: true }))).toBe(porch);
    expect(flightLesson(scene('level3', 540, 570, { practice: true }))).toBe(ring);
    expect(flightLesson(scene('level3', 540, 580, { practice: true }), ring)).toBe(ring);
    expect(flightLesson(scene('level3', 540, 570, { practice: true }), porch)).toBe(porch);
    expect(flightLesson(scene('level3', 540, 560, { practice: true }), porch)).toBe(ring);
  });
});
