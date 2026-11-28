// Story films (docs/story/rules.md §6, REGRESSIONS C22/C23). Walks every film in FILMS.
// Player reports behind these rules (2026-11-27/28): the first cut had no storyboard and the captions
// "must stay on screen long enough for the player to read the text".
//
// 1. Every caption is fully visible for readSeconds() of its longer language (EN or FR), never crosses
//    a cut, and fits two lines (about 80 characters).
// 2. The film clock runs forward without jumps; shots are 4–8 per film, one keyframe each, on disk.
// 3. Every film plays somewhere (before a level's memo or after a first delivery) and has its title card
//    and lines in both languages.
// 4. In play: a tap never skips a line before it could be read, the end card waits for a tap, Skip leaves.
import { describe, expect, it } from 'vitest';
import { authoredLocal, CAP_IN, CAP_OUT, captionAlpha, shotAt } from '../src/core/film-time';
import { FRESH_LINE_SECONDS, readSeconds } from '../src/core/read-time';
import type { Shell } from '../src/core/shell';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import { LEVELS } from '../src/levels/levels';
import { defaultSave, validateSave } from '../src/levels/save';
import { FilmScene } from '../src/ui/film';
import { framePath } from '../src/ui/film-art';
import { FILM_AFTER, FILM_BEFORE, FILMS, filmClock, spokenLine } from '../src/ui/films';

const EPS = 1e-6;
/** Keyframes on disk, as `film/<film>/<shot>.webp`. */
const FRAMES = new Set(Object.keys(import.meta.glob('../public/film/**/*.webp')).map((p) => p.replace('../public/', '')));

describe('every film caption can be read', () => {
  for (const film of FILMS) {
    const clock = filmClock(film.id);
    film.shots.forEach((shot, i) => {
      const lines = [spokenLine(en, film.id, shot), spokenLine(fr, film.id, shot)];
      const timed = clock.shots[i]!;
      it(`${film.id}/${shot.id}: on screen for its reading time, inside its shot`, () => {
        expect(lines[0]!.length > 0, 'EN and FR both have the line, or neither').toBe(lines[1]!.length > 0);
        if (!lines[0]) {
          expect(timed.capInF).toBeNull();
          return;
        }
        expect(shot.capIn, 'a captioned shot has a caption window').toBeDefined();
        const need = Math.max(...lines.map((l) => readSeconds(l)));
        const full = timed.capOutF! - (timed.capInF! + CAP_IN);
        expect(full, `fully visible ${full.toFixed(2)} s, needs ${need.toFixed(2)} s`).toBeGreaterThanOrEqual(need - EPS);
        expect(timed.capOutF! + CAP_OUT, 'the caption is gone before the cut').toBeLessThanOrEqual(timed.end - timed.start + EPS);
        for (const l of lines) expect(l.length, `"${l}" fits two lines`).toBeLessThanOrEqual(82);
      });
    });
  }
});

describe('every film is cut together', () => {
  for (const film of FILMS) {
    it(`${film.id}: 4–8 shots, a clock without jumps, a keyframe per shot`, () => {
      expect(film.shots.length).toBeGreaterThanOrEqual(4);
      expect(film.shots.length).toBeLessThanOrEqual(8);
      const clock = filmClock(film.id);
      let last = 0;
      for (let t = 0; t <= clock.length; t += 0.01) {
        const i = shotAt(clock, t);
        const s = clock.shots[i]!;
        const a = s.aStart + authoredLocal(s, t - s.start);
        expect(a, `authored time runs forward at ${t.toFixed(2)} s`).toBeGreaterThanOrEqual(last - EPS);
        expect(a - last, `no jump at ${t.toFixed(2)} s`).toBeLessThan(0.05);
        last = a;
      }
      expect(last).toBeCloseTo(clock.authored, 1);
      for (const shot of film.shots) {
        expect(FRAMES.has(framePath(film.id, shot.id)), `${framePath(film.id, shot.id)} exists`).toBe(true);
        for (const k of shot.cam) expect(k[3], `${shot.id} camera never shows past the frame`).toBeGreaterThanOrEqual(1);
      }
    });
  }

  it('every film plays somewhere, once', () => {
    const levels = new Set(LEVELS.map((l) => l.id));
    const placed = [...Object.entries(FILM_BEFORE), ...Object.entries(FILM_AFTER)];
    for (const [level] of placed) expect(levels.has(level as never), `${level} is a level`).toBe(true);
    const films = placed.map(([, f]) => f);
    for (const film of FILMS) expect(films.filter((f) => f === film.id), film.id).toHaveLength(1);
  });

  it('every film has its title card in both languages', () => {
    for (const film of FILMS) {
      for (const dict of [en, fr]) {
        expect(dict.films[film.id].title.length).toBeGreaterThan(0);
        expect(dict.films[film.id].sub.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('playing a film', () => {
  function rig() {
    const pointer = { x: 270, y: 480, down: false, pressed: false, released: false };
    const sounds: string[] = [];
    const shell = {
      ctx: { pointer, reducedMotion: false },
      audio: { sfx: (name: string) => sounds.push(name) },
    } as unknown as Shell;
    let done = 0;
    const tap = (scene: FilmScene, x = 270, y = 480): void => {
      Object.assign(pointer, { x, y, down: true, pressed: true, released: false });
      scene.update(1 / 60);
      Object.assign(pointer, { down: false, pressed: false, released: true });
      scene.update(1 / 60);
      pointer.released = false;
    };
    return { shell, tap, sounds, done: () => done, then: () => { done++; } };
  }

  for (const film of FILMS) {
    it(`${film.id}: a tap waits for the line, the end card waits for a tap`, () => {
      const r = rig();
      const scene = new FilmScene(r.shell, film.id, r.then);
      scene.update(1 / 60); // frames are ready at once without a DOM
      const clock = scene.clock;
      for (let i = 0; i < clock.shots.length; i++) {
        const s = clock.shots[i]!;
        if (s.capInF !== null) {
          // halfway into the line's first read: a tap is ignored
          scene.t = s.start + s.capInF + CAP_IN + Math.min(s.read, FRESH_LINE_SECONDS) / 2;
          r.tap(scene);
          expect(scene.shotIndex, `${film.id}/${i}: tap too early`).toBe(i);
          expect(captionAlpha(s, scene.t - s.start)).toBeGreaterThan(0.99);
        }
        scene.t = s.end - 0.05;
      }
      for (let k = 0; k < 60 * 2; k++) scene.update(1 / 60);
      expect(scene.endT, 'the end card is up').toBeGreaterThanOrEqual(0);
      for (let k = 0; k < 60 * 30; k++) scene.update(1 / 60);
      expect(r.done(), 'the end card waits for a tap').toBe(0);
      r.tap(scene);
      expect(r.done()).toBe(1);
    });
  }

  it('Skip leaves at once, and only once', () => {
    const r = rig();
    const scene = new FilmScene(r.shell, FILMS[0]!.id, r.then);
    r.tap(scene, scene.skip.x + 10, scene.skip.y + 10);
    r.tap(scene, scene.skip.x + 10, scene.skip.y + 10);
    expect(r.done()).toBe(1);
  });
});

describe('films seen are saved', () => {
  it('keeps the ids, drops junk', () => {
    const save = { ...defaultSave(), filmsSeen: ['opening', 3, 'opening', null, 'probation'] };
    expect(validateSave(JSON.parse(JSON.stringify(save))).filmsSeen).toEqual(['opening', 'probation']);
    expect(validateSave({ ...defaultSave(), filmsSeen: 'opening' }).filmsSeen).toEqual([]);
    expect(validateSave({ ...defaultSave(), filmsSeen: undefined }).filmsSeen).toEqual([]);
  });
});
