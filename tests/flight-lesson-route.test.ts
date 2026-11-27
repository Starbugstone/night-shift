// First-encounter flight lessons follow the hazards (council v0.2 item 3, Neon finding 3): after the spawn
// rework the lesson triggers still used the old maps' y-bands and `defs[0]`, so L4, L7 and L8 never showed
// theirs, L3 missed the porches near the new spawn and L6 showed the ambulance tip at spawn, far from any bay.
//
// Rule: for every deep level in LEVELS with a flight lesson, the lesson's hazard is on the map, the lesson
// shows on the level's first playable approach (the autopilot shift, the dispatch banner included) no later
// than the frame the saucer first meets that hazard, and it never shows at the spawn while the spawn is far
// from every hazard of its kind.
// Round 3 (Fable F3): tips retired correctly but a single showing could flash (L10 rabbit 1.30 s, L4 0.28 s, L3
// 0.25 s, L8 0.38 s). Once up, a tip stays for `lessonHoldSeconds` (FRESH_LINE_SECONDS, or its read time when
// shorter) unless the saucer is spotted, the leg ends or the lesson retires; checked on every lesson level's
// autopilot shift, in English and French.
// Round 4 (Fable F3): a leg starting inside the zone of a lesson already met and read flashed it for 0.3–1.5 s (L3, L5,
// L8, L10). Such a lesson is no longer raised, a showing never ends at its retirement before its hold, and the check
// no longer excuses showings that ended because the lesson retired.
// Round 5 (Opus 1): nothing guarded that rule, so the hold check also fails any showing that starts after
// flightLessonState() reported the hazard met and the tip read for its reading time.
import { describe, expect, it } from 'vitest';
import type { PointerState } from '../src/contracts';
import { FlightAutopilot } from '../src/flight/autopilot';
import type { DeepFlightScene } from '../src/flight/deep-scene';
import { DeepFlightSim, SAFE_WINDOW } from '../src/flight/deep-sim';
import { FLIGHT_LESSONS, flightLesson, flightLessonState, lessonHoldSeconds, type FlightLesson } from '../src/flight/views/progression-hint';
import { readSeconds } from '../src/core/read-time';
import { getLang, LANGS, setLang } from '../src/i18n';
import { FRESH_LINE_SECONDS } from '../src/core/read-time';
import { LEVELS, isDeep } from '../src/levels/levels';
import type { DeepLevelDef } from '../src/levels/types';

/** The dispatch banner hides lessons for the first seconds of a shift (DeepFlightScene). */
const BANNER_SEC = 3;
/** A spawn this far from every point where the hazard can meet the saucer is "far from its hazard". */
const FAR = 450;

interface RouteLog {
  /** Seconds into the shift when the lesson first showed, or null. */
  shown: number | null;
  /** Seconds into the shift when the saucer first met the hazard, or null. */
  met: number | null;
  where: string;
}

function fakeScene(level: DeepLevelDef, sim: DeepFlightSim, run: { legs: number }): DeepFlightScene & { bannerT: number } {
  return { state: 'fly', bannerT: 0, practice: false, run, level, sim } as unknown as DeepFlightScene & { bannerT: number };
}

function meetsAny(lesson: FlightLesson, level: DeepLevelDef, x: number, y: number, t: number): boolean {
  return level.map.hazards.some(d => d.type === lesson.hazard && lesson.meets(d, x, y, t));
}

/** Plays the whole shift with the autopilot, as the scene would show lessons to it. */
function playRoute(level: DeepLevelDef, lesson: FlightLesson, limitSec = 400): RouteLog {
  const sim = new DeepFlightSim(level.map, new Set(), 0);
  sim.place(level.map.start.x, level.map.start.y, 0.4);
  const ap = new FlightAutopilot(sim);
  const run = { legs: 0 };
  const scene = fakeScene(level, sim, run);
  scene.bannerT = BANNER_SEC;
  const p: PointerState = { down: false, x: 0, y: 0, pressed: false, released: false };
  const dt = 1 / 60;
  const tip = lesson.tip();
  const log: RouteLog = { shown: null, met: null, where: '' };
  let active = '';
  let lockT = -1;
  let spotT = -1;
  let checkpoint = { ...level.map.start };
  for (let f = 0; f < limitSec * 60; f++) {
    const t = f * dt;
    if (sim.phase === 'fly') {
      const it = ap.intent();
      p.pressed = it.down && !p.down;
      p.released = !it.down && p.down;
      p.down = it.down;
      p.x = it.x;
      p.y = it.y;
    } else {
      p.pressed = false;
      p.released = p.down;
      p.down = false;
    }
    sim.update(dt, p);
    scene.bannerT = Math.max(0, scene.bannerT - dt);
    (scene as { state: string }).state = sim.phase === 'spotted' ? 'spotted' : sim.phase === 'fly' ? 'fly' : 'locking';
    const { x, y } = sim.saucer;
    if (log.met === null && sim.phase === 'fly' && meetsAny(lesson, level, x, y, sim.t)) {
      log.met = t;
      log.where = `${Math.round(x)},${Math.round(y)} leg ${run.legs}`;
    }
    active = flightLesson(scene, active);
    if (active === tip && log.shown === null) log.shown = t;
    if (log.shown !== null && log.met !== null) break;
    if (sim.phase === 'spotted' && spotT < 0) spotT = t;
    if (spotT >= 0 && t - spotT > 1.2) {
      spotT = -1;
      sim.place(checkpoint.x, checkpoint.y, SAFE_WINDOW);
    }
    if (sim.justLocked) lockT = t;
    if (lockT >= 0 && t - lockT > 0.9) {
      lockT = -1;
      const ref = sim.ringRef[sim.lockedRing]!;
      const ring = { ...sim.rings[sim.lockedRing]! };
      if (ref.ape) sim.collectApe();
      else sim.markDelivered(ref.target);
      checkpoint = ring;
      if (sim.delivered.every(Boolean)) break;
      if (!ref.ape) {
        // a new flight scene for the next leg: no banner, same run
        sim.place(ring.x, ring.y, SAFE_WINDOW);
        run.legs++;
      }
    }
  }
  return log;
}

/** `afterRead`: it came up after the lesson was met and read (round 5, Opus 1: it must not be raised again). */
interface Showing { start: number; len: number; end: 'flight' | 'cut' | 'open'; afterRead: boolean }

/** Every showing of the tip on the whole autopilot shift: how long, and whether it ended in flight or was cut (spotted, leg end, retired, cool-off). */
function showings(level: DeepLevelDef, lesson: FlightLesson, limitSec = 400): Showing[] {
  const sim = new DeepFlightSim(level.map, new Set(), 0);
  sim.place(level.map.start.x, level.map.start.y, 0.4);
  const ap = new FlightAutopilot(sim);
  const run = { legs: 0 };
  const scene = fakeScene(level, sim, run);
  scene.bannerT = BANNER_SEC;
  const p: PointerState = { down: false, x: 0, y: 0, pressed: false, released: false };
  const dt = 1 / 60;
  const tip = lesson.tip();
  const out: Showing[] = [];
  let active = '';
  let start = -1;
  let afterRead = false;
  // when flightLessonState first reported the hazard met and the tip read for its reading time
  let readAt = -1;
  const need = readSeconds(tip);
  let lockT = -1;
  let spotT = -1;
  let checkpoint = { ...level.map.start };
  for (let f = 0; f < limitSec * 60; f++) {
    const t = f * dt;
    if (sim.phase === 'fly') {
      const it = ap.intent();
      p.pressed = it.down && !p.down;
      p.released = !it.down && p.down;
      p.down = it.down;
      p.x = it.x;
      p.y = it.y;
    } else {
      p.pressed = false;
      p.released = p.down;
      p.down = false;
    }
    sim.update(dt, p);
    scene.bannerT = Math.max(0, scene.bannerT - dt);
    (scene as { state: string }).state = sim.phase === 'spotted' ? 'spotted' : sim.phase === 'fly' ? 'fly' : 'locking';
    active = flightLesson(scene, active);
    const on = active === tip;
    if (on && start < 0) {
      start = t;
      afterRead = readAt >= 0;
    }
    const st = flightLessonState(run);
    if (readAt < 0 && st?.met && st.shownSec >= need) readAt = t;
    if (!on && start >= 0) {
      // round 4 (Fable F3): a lesson retiring is no excuse for a short showing; only the leg ending or another tip cuts one
      const cut = scene.state !== 'fly' || active !== '';
      out.push({ start, len: t - start, end: cut ? 'cut' : 'flight', afterRead });
      start = -1;
    }
    if (sim.phase === 'spotted' && spotT < 0) spotT = t;
    if (spotT >= 0 && t - spotT > 1.2) {
      spotT = -1;
      sim.place(checkpoint.x, checkpoint.y, SAFE_WINDOW);
    }
    if (sim.justLocked) lockT = t;
    if (lockT >= 0 && t - lockT > 0.9) {
      lockT = -1;
      const ref = sim.ringRef[sim.lockedRing]!;
      const ring = { ...sim.rings[sim.lockedRing]! };
      if (ref.ape) sim.collectApe();
      else sim.markDelivered(ref.target);
      checkpoint = ring;
      if (sim.delivered.every(Boolean)) break;
      if (!ref.ape) {
        sim.place(ring.x, ring.y, SAFE_WINDOW);
        run.legs++;
      }
    }
  }
  if (start >= 0) out.push({ start, len: limitSec - start, end: 'open', afterRead });
  return out;
}

/** Can the hazard meet the saucer anywhere within FAR of the spawn (over one minute of hazard time)? */
function nearSpawn(level: DeepLevelDef, lesson: FlightLesson): boolean {
  const { x, y } = level.map.start;
  for (let r = 0; r <= FAR; r += 15) {
    const steps = Math.max(1, Math.ceil((2 * Math.PI * r) / 15));
    for (let k = 0; k < steps; k++) {
      const a = (2 * Math.PI * k) / steps;
      for (let t = 0; t < 60; t += 0.25) if (meetsAny(lesson, level, x + r * Math.cos(a), y + r * Math.sin(a), t)) return true;
    }
  }
  return false;
}

const DEEP = LEVELS.filter(isDeep);

describe('flight lessons follow their hazards', () => {
  setLang('en');

  it('every lesson belongs to a deep level in LEVELS', () => {
    const ids = new Set(DEEP.map(l => l.id as string));
    expect(Object.keys(FLIGHT_LESSONS).filter(id => !ids.has(id))).toEqual([]);
  });

  for (const level of DEEP) {
    const lesson = FLIGHT_LESSONS[level.id];
    if (!lesson) continue;
    describe(`${level.id}: ${lesson.tip()}`, () => {
      it(`has a ${lesson.hazard} on its map`, () => {
        expect(level.map.hazards.some(d => d.type === lesson.hazard)).toBe(true);
      });

      it('shows on the first playable approach, before the saucer meets the hazard', () => {
        const log = playRoute(level, lesson);
        expect(log.shown, `never shown on the autopilot shift (met at ${log.met?.toFixed(2)} s, ${log.where})`).not.toBeNull();
        if (log.met !== null) expect(log.shown!, `met at ${log.met.toFixed(2)} s (${log.where}) before the tip showed`).toBeLessThanOrEqual(log.met);
      });

      // v0.2 council R2 (Fable): L5 spawns in a lighthouse shadow, so the tip flashed for 0.48 s and retired
      it('never retires before its tip has been on screen for its reading time', () => {
        const sim = new DeepFlightSim(level.map, new Set(), 0);
        sim.place(level.map.start.x, level.map.start.y, 0.4);
        const ap = new FlightAutopilot(sim);
        const run = { legs: 0 };
        const scene = fakeScene(level, sim, run);
        const p: PointerState = { down: false, x: 0, y: 0, pressed: false, released: false };
        const need = readSeconds(lesson.tip());
        let active = '';
        for (let f = 0; f < 240 * 60 && sim.phase !== 'locking'; f++) {
          const it = ap.intent();
          p.pressed = it.down && !p.down;
          p.released = !it.down && p.down;
          p.down = it.down;
          p.x = it.x;
          p.y = it.y;
          sim.update(1 / 60, p);
          (scene as { state: string }).state = sim.phase === 'fly' ? 'fly' : 'locking';
          active = flightLesson(scene, active);
          const st = flightLessonState(run);
          if (st?.spent) {
            expect(st.shownSec, `retired after ${st.shownSec.toFixed(2)} s of ${need.toFixed(1)} s`).toBeGreaterThanOrEqual(need - 0.05);
            return;
          }
        }
      });

      it('a tip that comes up stays for its hold: no showing ends in flight sooner (EN, FR)', () => {
        const lang = getLang();
        const short: string[] = [];
        const repeats: string[] = [];
        try {
          for (const l of LANGS) {
            setLang(l);
            const hold = lessonHoldSeconds(lesson.tip());
            expect(hold).toBe(Math.min(FRESH_LINE_SECONDS, readSeconds(lesson.tip())));
            const shows = showings(level, lesson);
            expect(shows.length, l).toBeGreaterThan(0);
            for (const s of shows) if (s.end === 'flight' && s.len < hold - 1 / 60) short.push(`${l}: shown at ${s.start.toFixed(1)} s for ${s.len.toFixed(2)} s (hold ${hold.toFixed(1)} s)`);
            // round 5 (Opus 1): a lesson met and read for its reading time is never raised again (deleting the
            // `read && seen.lastT < 0` clause brought it back on later legs on birch_neighbours, L3, L5, L8 and L10)
            for (const s of shows) if (s.afterRead) repeats.push(`${l}: raised again at ${s.start.toFixed(1)} s for ${s.len.toFixed(2)} s after it was met and read`);
            // the first showing, unless it was cut, lasts its hold
            const first = shows[0]!;
            if (first.end !== 'cut') expect(first.len, `${l}: first showing`).toBeGreaterThanOrEqual(hold - 1 / 60);
          }
        } finally {
          setLang(lang);
        }
        expect(short).toEqual([]);
        expect(repeats).toEqual([]);
      });

      it('stays quiet at the spawn when the spawn is far from the hazard', () => {
        if (nearSpawn(level, lesson)) return;
        const sim = new DeepFlightSim(level.map, new Set(), 0);
        sim.place(level.map.start.x, level.map.start.y, 0.4);
        expect(flightLesson(fakeScene(level, sim, { legs: 0 }))).toBe('');
      });
    });
  }
});
