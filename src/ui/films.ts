// The Season 1 story films: what plays, when, and how each shot is shot. Storyboards, cast sheet and
// image prompts: docs/story/films.md. Rules: docs/story/rules.md §6. Lines live in `films` in
// src/i18n/en.ts + fr.ts; keyframes are public/film/<film>/<shot>.webp (896×1200, loaded on demand
// by src/ui/film-art.ts).
import type { SfxName } from '../contracts';
import type { CamKey, FilmClock, ShotClock } from '../core/film-time';
import { timeFilm } from '../core/film-time';
import type { LevelId, SaveData } from '../levels/save';
import { en } from '../i18n/en';
import { fr } from '../i18n/fr';

export type FilmId = 'opening' | 'probation' | 'prior_art' | 'adequate' | 'outro';

/** Who speaks a caption: narration (the Bureau file) and written notes are shown plain; speech is quoted. */
export type Speaker = keyof typeof en.films.speakers;

/** A one-off effect at an authored time in the shot. Points are fractions of the image. */
export type FilmFx =
  | { readonly at: number; readonly kind: 'flash' | 'shake' | 'stamp' }
  | { readonly at: number; readonly kind: 'bloom'; readonly x: number; readonly y: number };

export interface FilmShot extends ShotClock {
  /** Keyframe file and line key. */
  readonly id: string;
  readonly who?: Speaker;
  readonly cam: readonly CamKey[];
  /** How the shot comes in: a cut (default), a smash cut (flash + shake), a dissolve (s) or a fade from black. */
  readonly enter?: 'cut' | 'smash' | 'fade' | { readonly dissolve: number };
  readonly fx?: readonly FilmFx[];
  /** [authored time, sound, volume]. */
  readonly sfx?: readonly (readonly [number, SfxName, number?])[];
  /** Closing iris onto an image point (the film's hand-off), authored times. */
  readonly iris?: { readonly from: number; readonly to: number; readonly x: number; readonly y: number };
}

export interface FilmDef {
  readonly id: FilmId;
  readonly shots: readonly FilmShot[];
}

export const FILMS: readonly FilmDef[] = [
  {
    // Before the first Route 9 shift: the toaster intern, his firing, the new intern, the keys.
    id: 'opening',
    shots: [
      {
        id: 'incident', action: 3.2, who: 'narration', enter: 'fade', capIn: 0.55, capOut: 2.95, holdAt: 2.6,
        cam: [[0, 0.47, 0.3, 1.56], [3.2, 0.57, 0.55, 1.14, 0, 'drift']],
        sfx: [[1.05, 'clock_tick', 0.5], [1.45, 'clock_tick', 0.5]],
      },
      {
        id: 'zap', action: 2.8, who: 'narration', enter: 'smash', capIn: 0.5, capOut: 2.55, holdAt: 2.3,
        cam: [[0, 0.3, 0.34, 1.62], [0.45, 0.31, 0.35, 1.58, 0, 'linear'], [1.8, 0.56, 0.62, 1.12, 0, 'inOutCubic'], [2.8, 0.57, 0.627, 1.09, 0, 'linear']],
        fx: [{ at: 2.0, kind: 'bloom', x: 0.815, y: 0.645 }],
        sfx: [[0, 'crash', 0.7], [0.55, 'pickup', 0.5], [2.0, 'camera_focus', 0.7]],
      },
      {
        id: 'fired', action: 3.5, who: 'narration', enter: { dissolve: 0.6 }, capIn: 0.9, capOut: 3.25, holdAt: 2.9,
        cam: [[0, 0.34, 0.54, 1.5], [0.95, 0.345, 0.545, 1.48, 0, 'linear'], [3.15, 0.632, 0.56, 1.36, 0, 'inOutSine'], [3.5, 0.632, 0.56, 1.35, 0, 'linear']],
        fx: [{ at: 0.78, kind: 'stamp' }],
        sfx: [[0.78, 'stamp']],
      },
      {
        id: 'arrives', action: 3.0, who: 'narration', capIn: 0.35, capOut: 2.75, holdAt: 2.4,
        cam: [[0, 0.5, 0.5, 1.04], [3.0, 0.555, 0.5, 1.45, 0, 'outSine']],
      },
      {
        id: 'keys', action: 3.1, who: 'vrell', capIn: 0.35, capOut: 2.85, holdAt: 2.5,
        cam: [[0, 0.5, 0.56, 1.2], [1.0, 0.505, 0.565, 1.22, 0, 'linear'], [3.1, 0.545, 0.632, 1.36, 0, 'inOutSine']],
        sfx: [[1.0, 'pickup', 0.4]],
      },
      {
        id: 'launch', action: 3.9, who: 'vrell', capIn: 0.35, capOut: 1.8, holdAt: 1.4,
        cam: [[0, 0.56, 0.4, 1.75, -4], [1.9, 0.5, 0.5, 1.0, 0, 'outCubic'], [2.05, 0.5, 0.5, 1.0, 0, 'linear'], [3.3, 0.645, 0.6875, 1.6, 0, 'inOutCubic'], [3.9, 0.645, 0.6875, 1.6, 0, 'linear']],
        sfx: [[0.02, 'beam_on', 0.6]],
        iris: { from: 2.05, to: 3.3, x: 0.645, y: 0.775 },
      },
    ],
  },
  {
    // After L2's first delivery: no grounds to fire Zib, Head Office wants three sleepers, the lanyard, two small calls first.
    id: 'probation',
    shots: [
      {
        id: 'hold', action: 3.2, who: 'narration', enter: 'fade', capIn: 0.5, capOut: 2.78, holdAt: 2.6,
        cam: [[0, 0.76, 0.53, 1.6], [2.5, 0.5, 0.5, 1, 0, 'inOutSine'], [3.2, 0.5, 0.5, 1.02, 0, 'linear']],
        sfx: [[0.6, 'snore']],
      },
      {
        id: 'nothing_to_stamp', action: 3, who: 'vrell', capIn: 0.5, capOut: 2.76, holdAt: 2.66,
        cam: [[0, 0.47, 0.42, 1.5], [1, 0.475, 0.425, 1.48, 0, 'linear'], [2.8, 0.725, 0.57, 1.4, 0, 'inOutSine'], [3, 0.725, 0.57, 1.41, 0, 'linear']],
        sfx: [[0.3, 'clock_tick']],
      },
      {
        id: 'tube', action: 3, who: 'narration', capIn: 0.6, capOut: 2.68, holdAt: 2.58,
        cam: [[0, 0.58, 0.5, 1.2], [0.5, 0.58, 0.5, 1.21, 0, 'linear'], [2.8, 0.63, 0.44, 1.7, 0, 'inOutSine'], [3, 0.63, 0.44, 1.71, 0, 'linear']],
        fx: [{ at: 0.1, kind: 'stamp' }],
        sfx: [[0.1, 'stamp'], [0.9, 'alert']],
      },
      {
        id: 'lanyard', action: 3.4, who: 'zib', capIn: 0.4, capOut: 2.98, holdAt: 2.88,
        cam: [[0, 0.56, 0.5, 1.25], [3.2, 0.68, 0.55, 1.6, 0, 'inOutSine'], [3.4, 0.68, 0.55, 1.61, 0, 'linear']],
        sfx: [[1.4, 'pickup']],
      },
      {
        id: 'two_calls_first', action: 3.2, who: 'vrell', capIn: 0.5, capOut: 2.96, holdAt: 2.86,
        cam: [[0, 0.79, 0.28, 1.8], [0.8, 0.785, 0.285, 1.8, 0, 'linear'], [2.8, 0.56, 0.4, 1.45, 0, 'inOutSine'], [3.2, 0.56, 0.4, 1.44, 0, 'linear']],
        sfx: [[2.6, 'clock_tick']],
      },
      {
        id: 'birch_lane', action: 3.8, who: 'vrell', capIn: 0.4, capOut: 2.48, holdAt: 1.7,
        cam: [[0, 0.33, 0.29, 1.8, -3], [1.6, 0.5, 0.5, 1, 0, 'outCubic'], [1.75, 0.5, 0.5, 1, 0, 'linear'], [3, 0.76, 0.6, 1.6, 0, 'inOutCubic'], [3.8, 0.76, 0.6, 1.6, 0, 'linear']],
        fx: [{ at: 2.9, kind: 'bloom', x: 0.827, y: 0.565 }],
        sfx: [[0.05, 'beam_on'], [2.9, 'porch_light']],
        iris: { from: 3, to: 3.8, x: 0.82, y: 0.575 },
      },
    ],
  },
  {
    // After L7's first delivery: the manifest names OBELISK™ and Krix, the royalty bills, Basement B-4.
    id: 'prior_art',
    shots: [
      {
        id: 'jacket', action: 3.2, who: 'narration', enter: 'fade', capIn: 0.5, capOut: 2.78, holdAt: 2.68,
        cam: [[0, 0.27, 0.34, 1.55], [3, 0.52, 0.45, 1.4, 0, 'inOutSine'], [3.2, 0.52, 0.45, 1.41, 0, 'linear']],
        sfx: [[0.3, 'snore']],
      },
      {
        id: 'signature', action: 3, who: 'vrell', capIn: 0.5, capOut: 2.68, holdAt: 2.58,
        cam: [[0, 0.55, 0.4, 1.4], [0.6, 0.55, 0.4, 1.42, 0, 'linear'], [2.7, 0.5, 0.66, 1.55, 0, 'inOutSine'], [3, 0.5, 0.66, 1.57, 0, 'linear']],
        sfx: [[0.9, 'camera_focus'], [2.5, 'alert']],
      },
      {
        id: 'racket', action: 3.6, who: 'narration', enter: { dissolve: 0.6 }, capIn: 0.9, capOut: 3.18, holdAt: 3.08,
        cam: [[0, 0.74, 0.36, 1.6], [0.9, 0.735, 0.36, 1.58, 0, 'linear'], [3.2, 0.35, 0.4, 1.3, 0, 'inOutSine'], [3.6, 0.35, 0.4, 1.29, 0, 'linear']],
        sfx: [[1.6, 'beam_on']],
      },
      {
        id: 'royalties', action: 3, who: 'vrell', capIn: 0.5, capOut: 2.68, holdAt: 2.58,
        cam: [[0, 0.68, 0.36, 1.4], [2.6, 0.36, 0.44, 1.5, 0, 'inOutSine'], [3, 0.36, 0.44, 1.51, 0, 'linear']],
        sfx: [[0.1, 'alert'], [1.2, 'stamp']],
      },
      {
        id: 'basement', action: 3.4, who: 'vrell', capIn: 0.4, capOut: 3.08, holdAt: 2.98,
        cam: [[0, 0.56, 0.46, 1.2], [2.3, 0.56, 0.45, 1.45, 0, 'inCubic'], [3.4, 0.56, 0.45, 1.4, 0, 'outSine']],
        fx: [{ at: 2.3, kind: 'stamp' }],
        sfx: [[0.4, 'creak'], [2.3, 'crash']],
      },
      {
        id: 'three_million_years', action: 3.9, who: 'vrell', capIn: 0.35, capOut: 2.48, holdAt: 2,
        cam: [[0, 0.33, 0.52, 1.7], [1.9, 0.45, 0.5, 1.02, 0, 'outCubic'], [2.05, 0.45, 0.5, 1.02, 0, 'linear'], [3.3, 0.7, 0.36, 1.7, 0, 'inOutCubic'], [3.9, 0.7, 0.36, 1.7, 0, 'linear']],
        sfx: [[0.2, 'clock_tick'], [0.7, 'clock_tick'], [1.9, 'beam_on']],
        iris: { from: 2.9, to: 3.9, x: 0.72, y: 0.37 },
      },
    ],
  },
  {
    // After L8's first delivery: the claim struck out, Krix billed for the bone, Zib hired, the dial hums 1955.
    id: 'adequate',
    shots: [
      {
        id: 'witnesses', action: 3, who: 'narration', enter: 'fade', capIn: 0.5, capOut: 2.68, holdAt: 2.58,
        cam: [[0, 0.27, 0.4, 1.5], [3, 0.73, 0.4, 1.5, 0, 'drift']],
        sfx: [[0.4, 'pickup']],
      },
      {
        id: 'void', action: 2.8, who: 'narration', enter: 'smash', capIn: 0.5, capOut: 2.48, holdAt: 2.38,
        cam: [[0, 0.48, 0.46, 1.7], [0.4, 0.48, 0.465, 1.68, 0, 'linear'], [2.6, 0.53, 0.555, 1.2, 0, 'inOutSine'], [2.8, 0.53, 0.555, 1.19, 0, 'linear']],
        sfx: [[0, 'stamp'], [0.15, 'crash']],
      },
      {
        id: 'bone_bill', action: 3.2, who: 'narration', capIn: 0.5, capOut: 2.78, holdAt: 2.68,
        cam: [[0, 0.26, 0.37, 1.6], [0.6, 0.265, 0.372, 1.6, 0, 'linear'], [3, 0.6, 0.37, 1.5, 0, 'inOutSine'], [3.2, 0.6, 0.37, 1.5, 0, 'linear']],
        sfx: [[0.3, 'stamp']],
      },
      {
        id: 'hand_it_over', action: 3, who: 'vrell', capIn: 0.4, capOut: 2.68, holdAt: 2.58,
        cam: [[0, 0.53, 0.46, 1.12], [0.7, 0.53, 0.46, 1.13, 0, 'linear'], [2.8, 0.68, 0.52, 1.45, 0, 'inOutSine'], [3, 0.68, 0.52, 1.46, 0, 'linear']],
      },
      {
        id: 'hired', action: 3.2, who: 'vrell', capIn: 0.4, capOut: 2.88, holdAt: 2.78,
        cam: [[0, 0.6, 0.52, 1.7], [0.5, 0.6, 0.52, 1.68, 0, 'linear'], [3, 0.52, 0.5, 1.12, 0, 'outSine'], [3.2, 0.52, 0.5, 1.12, 0, 'linear']],
        sfx: [[0.6, 'success']],
      },
      {
        id: 'dial', action: 3.8, who: 'zib', capIn: 0.35, capOut: 2.58, holdAt: 2.2,
        cam: [[0, 0.7, 0.4, 1.5], [0.5, 0.7, 0.4, 1.5, 0, 'linear'], [1.7, 0.22, 0.275, 1.85, 0, 'inOutCubic'], [2.3, 0.22, 0.275, 1.87, 0, 'linear'], [3.2, 0.21, 0.27, 2.1, 0, 'inOutSine'], [3.8, 0.21, 0.27, 2.1, 0, 'linear']],
        sfx: [[1.7, 'clock_tick'], [2.2, 'clock_tick'], [2.6, 'clock_tick'], [2.9, 'clock_tick']],
        iris: { from: 3, to: 3.8, x: 0.21, y: 0.33 },
      },
    ],
  },
  {
    // After the 2199 shift's first delivery: the season finale (it takes over the three-panel DispatchFinale's route).
    id: 'outro',
    shots: [
      {
        id: 'order_void', action: 3, who: 'narration', enter: 'fade', capIn: 0.6, capOut: 2.68, holdAt: 2.58,
        cam: [[0, 0.5, 0.42, 1.3], [0.7, 0.5, 0.42, 1.3, 0, 'linear'], [2.8, 0.56, 0.62, 1.6, 0, 'inOutSine'], [3, 0.56, 0.62, 1.61, 0, 'linear']],
        fx: [{ at: 0.35, kind: 'stamp' }],
        sfx: [[0.35, 'stamp']],
      },
      {
        id: 'bill', action: 3.2, who: 'krix', capIn: 0.4, capOut: 2.88, holdAt: 2.78,
        cam: [[0, 0.44, 0.5, 1.5], [2, 0.6, 0.38, 1.5, 0, 'inOutSine'], [2.2, 0.6, 0.38, 1.5, 0, 'linear'], [3.2, 0.72, 0.39, 1.45, 0, 'outSine']],
        fx: [{ at: 2.2, kind: 'stamp' }],
        sfx: [[2.2, 'pickup']],
      },
      {
        id: 'empty_tank', action: 3.4, who: 'bubbles', capIn: 0.9, capOut: 3.08, holdAt: 2.98,
        cam: [[0, 0.42, 0.5, 1.25], [0.6, 0.425, 0.5, 1.25, 0, 'linear'], [3, 0.62, 0.38, 1.75, 0, 'inOutSine'], [3.4, 0.62, 0.38, 1.76, 0, 'linear']],
      },
      {
        id: 'transfer', action: 3, who: 'bubbles', capIn: 0.4, capOut: 2.68, holdAt: 2.58,
        cam: [[0, 0.52, 0.6, 1.6], [0.8, 0.52, 0.6, 1.6, 0, 'linear'], [2.8, 0.5, 0.44, 1.25, 0, 'inOutSine'], [3, 0.5, 0.437, 1.25, 0, 'linear']],
        sfx: [[0.5, 'pickup']],
      },
      {
        id: 'vested', action: 3, who: 'narration', capIn: 0.5, capOut: 2.68, holdAt: 2.58,
        cam: [[0, 0.72, 0.335, 1.5], [0.5, 0.72, 0.335, 1.5, 0, 'linear'], [1.8, 0.48, 0.47, 1.32, 0, 'inOutSine'], [3, 0.48, 0.48, 1.3, 0, 'linear']],
        fx: [{ at: 2, kind: 'stamp' }],
        sfx: [[2, 'stamp']],
      },
      {
        id: 'later', action: 3.2, who: 'vrell', capIn: 0.4, capOut: 2.78, holdAt: 2.68,
        cam: [[0, 0.46, 0.58, 1.6], [0.6, 0.46, 0.58, 1.6, 0, 'linear'], [2.8, 0.55, 0.46, 1.1, 0, 'outSine'], [3.2, 0.55, 0.46, 1.1, 0, 'linear']],
        sfx: [[0.3, 'creak']],
      },
      {
        id: 'pool', action: 3.9, who: 'zib', capIn: 0.35, capOut: 2.38, holdAt: 2,
        cam: [[0, 0.775, 0.35, 1.7], [1.9, 0.44, 0.5, 1.02, 0, 'outCubic'], [2.05, 0.44, 0.5, 1.02, 0, 'linear'], [3.3, 0.49, 0.42, 1.5, 0, 'inOutCubic'], [3.9, 0.49, 0.42, 1.5, 0, 'linear']],
        sfx: [[1.9, 'success'], [2.9, 'lullaby']],
        iris: { from: 2.9, to: 3.9, x: 0.49, y: 0.42 },
      },
    ],
  },
];

export function filmById(id: FilmId): FilmDef {
  const film = FILMS.find((f) => f.id === id);
  if (!film) throw new Error(`no film ${id}`);
  return film;
}

type FilmStrings = { readonly lines: Readonly<Record<string, string>>; readonly title: string; readonly sub: string };
type Dict = {
  readonly films: Readonly<Record<FilmId, FilmStrings>> & { readonly quote: { readonly open: string; readonly close: string } };
  readonly dispatch2199: { readonly note: string; readonly transfer: string; readonly pool: string };
};

/** Outro lines that are the shipped 2199 epilogue's own words: read from there, so they can never drift. */
const SHARED_LINES: Readonly<Record<string, keyof Dict['dispatch2199']>> = {
  'outro/empty_tank': 'note',
  'outro/transfer': 'transfer',
  'outro/pool': 'pool',
};

const UNQUOTED: ReadonlySet<Speaker> = new Set<Speaker>(['narration', 'bubbles']);

/** The caption as shown: speech is quoted in the language's marks, narration is not. */
export function spokenLine(dict: Dict, film: FilmId, shot: FilmShot): string {
  const shared = SHARED_LINES[`${film}/${shot.id}`];
  const line = shared ? dict.dispatch2199[shared] : dict.films[film].lines[shot.id] ?? '';
  if (!line || !shot.who || UNQUOTED.has(shot.who)) return line;
  return dict.films.quote.open + line + dict.films.quote.close;
}

const clocks = new Map<FilmId, FilmClock>();

/** The film's timeline. Every language is timed together: the longer line sets each caption's time. */
export function filmClock(id: FilmId): FilmClock {
  let clock = clocks.get(id);
  if (!clock) {
    const film = filmById(id);
    clock = timeFilm(film.shots, film.shots.map((s) => [spokenLine(en, id, s), spokenLine(fr, id, s)]));
    clocks.set(id, clock);
  }
  return clock;
}

/** Films that play once after a level's first delivery, by level. */
export const FILM_AFTER: Partial<Record<LevelId, FilmId>> = { level2: 'probation', level7: 'prior_art', level8: 'adequate', level12: 'outro' };
/** Films that play once before a level's first memo, by level. */
export const FILM_BEFORE: Partial<Record<LevelId, FilmId>> = { level1: 'opening' };

export function filmSeen(save: SaveData, id: FilmId): boolean {
  // the outro took over the 2199 Bureau epilogue: a save that saw the epilogue has seen the finale
  return save.filmsSeen.includes(id) || (id === 'outro' && save.dispatch2199Finale === true);
}

/** The save with the film marked seen (a story mark: write it with Game.setStoryMark, never setSave). */
export function markFilmSeen(save: SaveData, id: FilmId): SaveData {
  const seen = save.filmsSeen.includes(id) ? save : { ...save, filmsSeen: [...save.filmsSeen, id] };
  return id === 'outro' && seen.dispatch2199Finale !== true ? { ...seen, dispatch2199Finale: true } : seen;
}

/** The film tied to a level, for the memo's replay button: the one before it, else the one after. */
export function filmOfLevel(id: LevelId): FilmId | undefined {
  return FILM_BEFORE[id] ?? FILM_AFTER[id];
}

export const FILM_IDS: readonly FilmId[] = FILMS.map((f) => f.id);
