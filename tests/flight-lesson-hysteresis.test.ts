import { describe, expect, it } from 'vitest';
import { setLang, tr } from '../src/i18n';
import type { DeepFlightScene } from '../src/flight/deep-scene';
import { LESSON_EXIT_PAD, flightLesson, lessonHoldSeconds } from '../src/flight/views/progression-hint';
import { readSeconds } from '../src/core/read-time';
import { LEVELS } from '../src/levels/levels';
import type { HazardDef } from '../src/flight/hazards';

const hazardsOf = (levelId: string): readonly HazardDef[] => {
  const level = LEVELS.find(l => l.id === levelId);
  return level?.kind === 'deep' ? level.map.hazards : [];
};

function scene(levelId: string, x: number, y: number, extra: Partial<{ practice: boolean; inRing: number }> = {}): DeepFlightScene {
  return {
    state: 'fly', bannerT: 0, practice: extra.practice ?? false,
    run: { legs: 0 }, level: { id: levelId },
    sim: { saucer: { x, y }, suspicion: 0, inRing: extra.inRing ?? -1, t: 0, field: { defs: hazardsOf(levelId) } },
  } as unknown as DeepFlightScene;
}

describe('flight lessons', () => {
  setLang('en');
  const { traffic } = tr().lessons;

  it('enter on the hard edge and leave only 12 px past it', () => {
    expect(LESSON_EXIT_PAD).toBe(12);
    // the L4 traffic zone's north edge above the Old Town lanes, wherever the map puts them
    let edge = 0;
    for (let y = 900; y < 1600 && !edge; y++) if (flightLesson(scene('level4', 270, y)) === traffic) edge = y;
    expect(edge, 'the traffic lesson shows somewhere north of the lanes').toBeGreaterThan(900);
    // outside the band: no lesson until the edge is crossed
    expect(flightLesson(scene('level4', 270, edge - 1))).toBe('');
    expect(flightLesson(scene('level4', 270, edge))).toBe(traffic);
    // drifting back out across the edge keeps it up within the pad, then drops it
    expect(flightLesson(scene('level4', 270, edge - 6), traffic)).toBe(traffic);
    expect(flightLesson(scene('level4', 270, edge - 11), traffic)).toBe(traffic);
    expect(flightLesson(scene('level4', 270, edge - 13), traffic)).toBe('');
    // a lesson that isn't showing gets no pad
    expect(flightLesson(scene('level4', 270, edge - 6), '')).toBe('');
  });

  it('teaches each hazard once a run: it waits for the encounter, then retires after it', () => {
    const run = { legs: 0 };
    let t = 0;
    const at = (y: number, state = 'fly'): string => {
      const s = scene('level4', 270, y);
      (s as unknown as { run: object; state: string }).run = run;
      (s as unknown as { state: string }).state = state;
      (s.sim as { t: number }).t = (t += 1 / 60);
      return flightLesson(s);
    };
    const near = 1460;
    // v0.2 council R3 (Fable F3): a tip that is up stays for its hold once the saucer leaves; then it goes
    const away = (): string => {
      expect(at(900), 'held just after leaving').toBe(traffic);
      let last = '';
      for (let i = 0; i < lessonHoldSeconds(traffic) * 60 + 2; i++) last = at(900);
      return last;
    };
    expect(at(near)).toBe(traffic);
    expect(away(), 'left before meeting the lanes: not spent').toBe('');
    run.legs = 1;
    expect(at(near), 'still waiting on a later leg').toBe(traffic);
    expect(at(1568), 'on the lane').toBe(traffic);
    // spotted on the lane: the tip comes down at once, and its hold with it
    expect(at(1568, 'spotted')).toBe('');
    expect(at(900), 'out of the zone after the sighting: no hold').toBe('');
    // v0.2 council R2: met but cut short before its reading time, so it is still owed
    expect(at(near), 'met and flown clear too soon: still owed').toBe(traffic);
    for (let i = 0; i < readSeconds(traffic) * 60 + 2; i++) at(1568);
    expect(at(900)).toBe('');
    expect(at(near), 'met, read in full and flown clear: retired').toBe('');
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
