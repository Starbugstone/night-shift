// The 2199 verse card stays up for its reading time and goes at expiry (council v0.2 item 4, Fable F3).
// Before the fix the card followed whichever poet's widened cone held the saucer this frame: parked at
// (385,936) it showed for 2.9-3.1 s of verses owed 5.5-7 s, and at (966,1953) for 3.7 s of 7 s, then came
// back mid-verse. This drives the real scene and the real RecitalView, not just the timer.
import { describe, expect, it } from 'vitest';
import { LEVEL12 } from '../src/levels/deep-2199';
import { DeepRun } from '../src/levels/run';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { RecitalView } from '../src/flight/views/recital';
import { CameraView } from '../src/flight/views/world';
import { LEVELS } from '../src/levels/levels';
import { readSeconds } from '../src/core/read-time';
import { setLang, type Lang } from '../src/i18n';

const index = LEVELS.findIndex(l => l.id === 'level12');
const DT = 1 / 60;

function ctx() {
  return {
    pointer: { down: false, x: 0, y: 0, pressed: false, released: false }, assets: { get: () => undefined },
    audio: { sfx() {}, speak() {}, hush() {} }, upgrades: new Set<never>(), tutorial: false, time: 0, reducedMotion: true,
  };
}

interface Showing { start: number; end: number; verse: string }

/** Hover at (x, y) for `secs`, safe from capture, and list every showing of the verse card. */
function hover(x: number, y: number, secs: number) {
  const scene = new DeepFlightScene({ ctx: ctx() as never, level: LEVEL12, run: new DeepRun(LEVEL12, index), onLocked() {}, onSunrise() {}, onQuit() {} });
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
function spots(): [number, number][] {
  const out: [number, number][] = [];
  for (const d of LEVEL12.map.hazards) {
    if (d.type !== 'camera' || d.skin !== 'reciter2199_top') continue;
    for (const r of [160, 260, d.range, d.range + 120]) {
      for (let k = 0; k < 8; k++) {
        const a = d.base + (k - 3.5) * 0.3;
        out.push([Math.round(d.x + Math.cos(a) * r), Math.round(d.y + Math.sin(a) * r)]);
      }
    }
  }
  return out;
}

describe('2199 verse card', () => {
  it.each(['en', 'fr'] as Lang[])('stays up for readSeconds() and hides at expiry (%s)', lang => {
    setLang(lang);
    const short: string[] = [];
    const late: string[] = [];
    let total = 0;
    for (const [x, y] of spots()) {
      const { shows, stale } = hover(x, y, 24);
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

  it('a sighting drops the verse instead of resuming it after the respawn', () => {
    const { scene, view, cam, step } = hover(385, 936, 0);
    for (let i = 0; i < 20 * 60 && scene.verseT === 0; i++) step();
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
    scene.sim.place(2000, 2000, 3); // far from every poet
    step(false);
    view.sync(cam);
    expect(view.bubble.visible).toBe(false);
  });
});
