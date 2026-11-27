// The 2199 verse card stays up for its reading time and goes at expiry (council v0.2 item 4, Fable F3).
// Before the fix the card followed whichever poet's widened cone held the saucer this frame: parked at
// (385,936) it showed for 2.9-3.1 s of verses owed 5.5-7 s, and at (966,1953) for 3.7 s of 7 s, then came
// back mid-verse. This drives the real scene and the real RecitalView, not just the timer.
// v0.2 council round 5 (Sol): every level whose map registers a reciter, found from its hazards, not L12 by name.
import { describe, expect, it } from 'vitest';
import { DeepRun } from '../src/levels/run';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { RecitalView } from '../src/flight/views/recital';
import { CameraView } from '../src/flight/views/world';
import { isDeep, LEVELS } from '../src/levels/levels';
import type { DeepLevelDef } from '../src/levels/types';
import type { CameraHazard, HazardDef } from '../src/flight/hazards';
import { readSeconds } from '../src/core/read-time';
import { setLang, type Lang } from '../src/i18n';

const DT = 1 / 60;
const isReciter = (d: HazardDef): d is CameraHazard => d.type === 'camera' && d.skin === 'reciter2199_top';
/** Every level whose map has a poet reading verses. */
const RECITAL_LEVELS = (LEVELS.filter(isDeep) as DeepLevelDef[]).filter(l => l.map.hazards.some(isReciter));

function ctx() {
  return {
    pointer: { down: false, x: 0, y: 0, pressed: false, released: false }, assets: { get: () => undefined },
    audio: { sfx() {}, speak() {}, hush() {} }, upgrades: new Set<never>(), tutorial: false, time: 0, reducedMotion: true,
  };
}

interface Showing { start: number; end: number; verse: string }

/** Hover at (x, y) for `secs`, safe from capture, and list every showing of the verse card. */
function hover(level: DeepLevelDef, x: number, y: number, secs: number) {
  const scene = new DeepFlightScene({ ctx: ctx() as never, level, run: new DeepRun(level, LEVELS.indexOf(level)), onLocked() {}, onSunrise() {}, onQuit() {} });
  const view = new RecitalView(scene);
  const cam = new CameraView();
  const shows: Showing[] = [];
  const stale: string[] = [];
  let open: { start: number; verse: string } | null = null;
  for (let i = 0; i < secs * 60; i++) {
    const t = i * DT;
    scene.sim.place(x, y, 3);
    scene.update(DT);
    cam.sync(scene.sim.camX, scene.sim.camY, 0, 0, 0, 0, t, true);
    view.sync(cam);
    const up = view.bubble.visible;
    if (up && scene.verseT <= 0) stale.push(`${t.toFixed(2)} s`);
    // a new verse may start the frame the old one expires: that is a new showing
    if (open && (!up || scene.verse !== open.verse)) { shows.push({ ...open, end: t }); open = null; }
    if (up && !open) open = { start: t, verse: scene.verse };
  }
  const step = (park = true) => {
    if (park) scene.sim.place(x, y, 3);
    scene.update(DT);
    cam.sync(scene.sim.camX, scene.sim.camY, 0, 0, 0, 0, 0, true);
    view.sync(cam);
  };
  return { shows, stale, scene, view, cam, step };
}

/** Hover spots round every poet: inside, at the edge of and outside its widened listening cone. */
function spots(level: DeepLevelDef): [number, number][] {
  const out: [number, number][] = [];
  for (const d of level.map.hazards) {
    if (d.type !== 'camera' || !isReciter(d)) continue;
    for (const r of [160, 260, d.range, d.range + 120]) {
      for (let k = 0; k < 8; k++) {
        const a = d.base + (k - 3.5) * 0.3;
        out.push([Math.round(d.x + Math.cos(a) * r), Math.round(d.y + Math.sin(a) * r)]);
      }
    }
  }
  return out;
}

/** The point of the map farthest from every poet (a coarse grid), where no verse can start. */
function farFromPoets(level: DeepLevelDef): [number, number] {
  const poets = level.map.hazards.filter(isReciter);
  let best: [number, number] = [0, 0];
  let bestR = -1;
  for (let x = 60; x <= level.map.w - 60; x += 60) {
    for (let y = 60; y <= level.map.h - 60; y += 60) {
      const r = Math.min(...poets.map(d => Math.hypot(x - d.x, y - d.y)));
      if (r > bestR) { bestR = r; best = [x, y]; }
    }
  }
  return best;
}

describe('verse card on every recital level', () => {
  it('finds the recital levels from their hazards', () => {
    expect(RECITAL_LEVELS.length).toBeGreaterThanOrEqual(1);
    expect(RECITAL_LEVELS.some(l => l.id === 'level12')).toBe(true);
  });

  it.each(RECITAL_LEVELS.flatMap(level => (['en', 'fr'] as Lang[]).map(lang => [level.id, lang, level] as const)))('%s stays up for readSeconds() and hides at expiry (%s)', (_id, lang, level) => {
    setLang(lang);
    const short: string[] = [];
    const late: string[] = [];
    let total = 0;
    for (const [x, y] of spots(level)) {
      const { shows, stale } = hover(level, x, y, 24);
      total += shows.length;
      for (const s of shows) {
        const owed = readSeconds(s.verse);
        const shown = s.end - s.start;
        if (shown < owed - 2 * DT) short.push(`(${x},${y}) ${shown.toFixed(2)} s of ${owed.toFixed(1)} s`);
        if (shown > owed + 2 * DT) late.push(`(${x},${y}) ${shown.toFixed(2)} s of ${owed.toFixed(1)} s`);
      }
      if (stale.length) late.push(`(${x},${y}) up with no reading time left at ${stale[0]}`);
    }
    setLang('en');
    expect(total, 'no verse was read: the spots no longer reach a poet').toBeGreaterThan(20);
    expect(short, 'hidden with reading time left').toEqual([]);
    expect(late, 'still up after the reading time').toEqual([]);
  });

  it.each(RECITAL_LEVELS.map(level => [level.id, level] as const))('%s: a sighting drops the verse instead of resuming it after the respawn', (_id, level) => {
    // the first hover spot where a poet starts reading
    let reading: ReturnType<typeof hover> | null = null;
    for (const [x, y] of spots(level)) {
      const h = hover(level, x, y, 0);
      for (let i = 0; i < 20 * 60 && h.scene.verseT === 0; i++) h.step();
      if (h.scene.verseT > 0) { reading = h; break; }
    }
    expect(reading, 'no spot starts a verse').not.toBeNull();
    const { scene, view, cam, step } = reading!;
    expect(scene.verseT).toBeGreaterThan(0);
    expect(view.bubble.visible).toBe(true);
    scene.sim.phase = 'spotted';
    step(false);
    expect(scene.state).toBe('spotted');
    expect(view.bubble.visible).toBe(false);
    for (let i = 0; i < 120; i++) step(false);
    const c = scene.ctx.pointer as { down: boolean; pressed: boolean };
    c.down = c.pressed = true;
    step(false);
    c.down = c.pressed = false;
    expect(scene.state).toBe('fly');
    scene.sim.place(...farFromPoets(level), 3);
    step(false);
    view.sync(cam);
    expect(view.bubble.visible).toBe(false);
  });
});
