// v3 report additions: Bureau ID photo capture, Vrell's cover story, the tabloid headline, the
// Form 7-B readings, and a layout that still fits the 540×960 card in English and French.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AbductResult, FlightResult } from '../src/contracts';
import { VIEW_H, VIEW_W } from '../src/contracts';
import { PHOTO_DELAY, PhotoCapture } from '../src/abduct/photo';
import { ROOMS } from '../src/abduct/rooms';
import { AbductSimulation } from '../src/abduct/simulation';
import { STEP } from '../src/abduct/ragdoll';
import { setLang, TABLES, tr, type Lang } from '../src/i18n';
import { LEVELS } from '../src/levels/levels';
import { DeepRun } from '../src/levels/run';
import { defaultSave } from '../src/levels/save';
import type { RunOutcome } from '../src/levels/progress';
import { RANKS } from '../src/levels/progress';
import { coverStory, tabloidHeadline } from '../src/ui/report-extras';
import { BAND_BOTTOM, BAND_TOP, CW, CX, CY, STAR_Y, layoutReport, type Box, type Measure } from '../src/ui/report-layout';
import { fitPhoto, WINDOW } from '../src/ui/report-photo';
import { reportContent } from '../src/ui/report-content';
import { deepReport, tutorialReport } from '../src/ui/report';
import type { DeepLevelDef } from '../src/levels/types';

const LANGS: Lang[] = ['en', 'fr'];
const LEVEL_IDS = ['level1', 'level2', 'level3', 'level4', 'level5', 'level6', 'level7'];

afterEach(() => setLang('en'));

/** Generous width estimate for the system sans (bold caps are the widest). */
const measure: Measure = (s, size, weight) => {
  let w = 0;
  for (const ch of s) {
    const caps = ch >= 'A' && ch <= 'Z' || 'ÀÂÉÈÊÎÔÛÇ'.includes(ch);
    w += size * (ch === ' ' ? 0.28 : caps ? 0.7 : 'il.,:;\'’!|'.includes(ch) ? 0.3 : 0.56);
  }
  return w * (weight >= 800 ? 1.08 : 1);
};

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

describe('Bureau ID photo capture', () => {
  const body = (n: number) => ({ x: new Float64Array(n), y: new Float64Array(n), chestX: 0, chestY: 0 });

  it('keeps the wildest pose after the first second, relative to the chest', () => {
    const b = body(11);
    const cap = new PhotoCapture(11);
    let t = 0;
    const step = (wild: number, tag: number) => {
      t += STEP;
      b.chestX += 5; // the beam drags the whole body: not "wild" on its own
      for (let i = 0; i < 11; i++) {
        b.x[i] = b.chestX + tag + Math.sin(t * 50 + i) * wild;
        b.y[i] = b.chestY + i;
      }
      cap.sample(b, t);
    };
    // a huge flail before the first second never counts
    for (let i = 0; i < 100; i++) step(90, 1);
    expect(t).toBeLessThan(PHOTO_DELAY);
    for (let i = 0; i < 60; i++) step(2, 2);
    for (let i = 0; i < 30; i++) step(40, 3);
    for (let i = 0; i < 60; i++) step(4, 4);
    expect(cap.bestAt).toBeGreaterThan(PHOTO_DELAY + 0.33);
    expect(cap.bestAt).toBeLessThan(PHOTO_DELAY + 0.75 + 1e-9);
    const photo = cap.result('dave')!;
    expect(photo.human).toBe('dave');
    expect(photo.x.length).toBe(11);
    // relative to the chest: the tag-3 offset, not the world position
    expect(Math.abs(photo.x[0]! - 3)).toBeLessThanOrEqual(40);
  });

  it('works for any joint count and falls back to the last pose on a short attempt', () => {
    const b = body(7);
    const cap = new PhotoCapture(7);
    expect(cap.result('bubbles')).toBeUndefined();
    for (let i = 0; i < 7; i++) b.x[i] = i * 10;
    cap.sample(b, 0.1);
    const photo = cap.result('bubbles')!;
    expect(photo.x).toEqual([0, 10, 20, 30, 40, 50, 60]);
  });

  it('a real abduction fills AbductResult.photo with finite joints', () => {
    for (const id of ['farm_window', 'dave_roof'] as const) {
      const sim = new AbductSimulation(ROOMS[id], new Set(), { sfx: vi.fn() }, () => 0.5);
      sim.moveBeam(sim.body.beamX, sim.body.beamY - 40);
      for (let i = 0; i < 240; i++) {
        sim.moveBeam(sim.body.beamX + Math.sin(i / 8) * 30, sim.body.beamY);
        sim.update(1 / 60);
      }
      const r = sim.result();
      expect(r.photo, id).toBeDefined();
      expect(r.photo!.x.length).toBe(sim.body.x.length);
      expect(r.photo!.x.every(Number.isFinite) && r.photo!.y.every(Number.isFinite)).toBe(true);
      expect(sim.photo.bestAt).toBeGreaterThanOrEqual(PHOTO_DELAY);
      const fit = fitPhoto(r.photo!, WINDOW.w, WINDOW.h);
      expect(fit.scale).toBeGreaterThan(0.1);
    }
  });
});

describe('cover story and tabloid', () => {
  it('has a cover story for every level, souvenir and sighting case, in both languages', () => {
    for (const lang of LANGS) {
      setLang(lang);
      for (const levelId of [...LEVEL_IDS, 'level99']) {
        for (const items of [[], ['slipper'], ['municipal mug', 'mystery thing']]) {
          for (const spotted of [0, 1, 2, 5]) {
            for (const sunrise of [false, true]) {
              for (let seed = 0; seed < 7; seed++) {
                const line = coverStory({ levelId, items, spotted, sunrise, seed });
                expect(line, `${lang} ${levelId}`).not.toMatch(/[{}]/);
                expect(line.length).toBeGreaterThan(10);
              }
            }
          }
        }
      }
    }
    setLang('en');
    expect(coverStory({ levelId: 'level1', items: ['slipper'], spotted: 0, sunrise: false, seed: 0 })).toBe('Filed as: swamp gas off one disputed slipper.');
    setLang('fr');
    expect(coverStory({ levelId: 'level1', items: ['slipper'], spotted: 0, sunrise: false, seed: 0 })).toContain('chausson');
  });

  it('runs a headline only from two sightings, with per-level and generic headlines', () => {
    expect(tabloidHeadline('level6', 1, 0)).toBeNull();
    expect(tabloidHeadline('level6', 2, 0)).toBe('LOCAL MAN PROBED WITH GOOSE FEATHER, RATES EXPERIENCE 4/5');
    expect(tabloidHeadline('level5', 3, 0)).toBe('FLYING HUBCAP STEALS DOLPHIN, LEAVES POLITE NOTE');
    expect(tabloidHeadline('level99', 2, 0)).toBeTruthy();
    for (const lang of LANGS) {
      const h = TABLES[lang].reportExtras.headlines;
      const all = Object.values(h).flat();
      expect(all.length).toBeGreaterThanOrEqual(8);
      for (const id of LEVEL_IDS) expect(h[id]?.length, `${lang} ${id}`).toBeGreaterThan(0);
      for (const line of all) expect(line, line).toBe(line.toUpperCase());
    }
    // the generic ones come round too
    const seen = new Set<string>();
    for (let s = 0; s < 12; s++) seen.add(tabloidHeadline('level1', 2, s)!);
    expect([...seen].some((x) => TABLES.en.reportExtras.headlines.generic!.includes(x))).toBe(true);
  });
});

describe('report layout', () => {
  const longest = (xs: readonly string[]) => xs.reduce((a, b) => (b.length > a.length ? b : a), '');
  const READINGS = {
    en: ['Temperature: lukewarm ✓', 'Reflexes: brisk ✓', 'Ticklishness: extreme ✓', 'Temperature: suspicious ✓', 'Reflexes: decorative ✓', 'Ticklishness: 4/5 ✓'],
    fr: ['Température : tiédasse ✓', 'Réflexes : vifs ✓', 'Chatouillabilité : extrême ✓', 'Température : suspecte ✓', 'Réflexes : décoratifs ✓', 'Chatouillabilité : 4/5 ✓'],
  };

  for (const lang of LANGS) {
    it(`fits the card without overlaps (${lang}, longest strings, readings, tabloid)`, () => {
      setLang(lang);
      const x = tr().reportExtras;
      const covers: string[] = [];
      for (const levelId of LEVEL_IDS) {
        for (let seed = 0; seed < 12; seed++) {
          for (const spotted of [0, 3]) covers.push(coverStory({ levelId, items: ['neighbourhood watch mug'], spotted, sunrise: seed % 2 === 0, seed }));
        }
      }
      const headline = longest(Object.values(x.headlines).flat());
      const cases = [
        { rows: 6, readings: [], cover: longest(covers), headline: null },
        { rows: 6, readings: READINGS[lang].slice(0, 2), cover: longest(covers), headline },
        { rows: 7, readings: READINGS[lang], cover: longest(covers), headline },
        { rows: 7, readings: [], cover: longest(covers), headline },
      ];
      for (const c of cases) {
        const L = layoutReport(measure, c);
        const rowsEnd = L.readings ? L.readings.y + L.readings.lines * L.readings.lh : L.rowY[L.rowY.length - 1]! + L.rowLine + 2;
        expect(L.rowY[0], 'rows start under the title rule').toBe(CY + 128);
        expect(L.rowGap, 'rows stay readable').toBeGreaterThanOrEqual(27);
        expect(L.rowSize).toBeGreaterThanOrEqual(16);
        const band = [L.photo.box, L.stamp.box, L.cover];
        for (const b of band) {
          expect(b.y, 'band below rows').toBeGreaterThanOrEqual(rowsEnd);
          expect(b.y + b.h, 'band above the stars and their NEW! badges').toBeLessThanOrEqual(BAND_BOTTOM);
          expect(b.x).toBeGreaterThanOrEqual(CX);
          expect(b.x + b.w).toBeLessThanOrEqual(CX + CW);
        }
        expect(overlaps(L.photo.box, L.stamp.box)).toBe(false);
        expect(overlaps(L.photo.box, L.cover)).toBe(false);
        expect(overlaps(L.stamp.box, L.cover)).toBe(false);
        // the cover story fits its box without being cut
        expect(L.cover.lines.join(' ')).toBe(c.cover);
        expect(L.cover.lines.length * L.cover.lh).toBeLessThanOrEqual(L.cover.h);
        for (const l of L.cover.lines) expect(measure(l, L.cover.size, 600, true)).toBeLessThanOrEqual(L.cover.w);
        expect(L.cover.size).toBeGreaterThanOrEqual(12);
        expect(BAND_BOTTOM).toBeLessThanOrEqual(STAR_Y - 47);
        // APPROVED stays on the ID card
        expect(L.approved.x - L.approved.w / 2).toBeGreaterThanOrEqual(L.photo.x);
        expect(L.approved.x + L.approved.w / 2).toBeLessThanOrEqual(L.photo.x + L.photo.box.w + 4);
        if (c.readings.length > 0) {
          const rd = L.readings!;
          expect(rd.cells).toEqual(c.readings);
          expect(rd.lines).toBeLessThanOrEqual(3);
          expect(rd.y).toBeGreaterThan(L.readingsY);
          expect(L.photo.y).toBeGreaterThan(BAND_TOP);
          for (const cell of rd.cells) expect(measure(cell, rd.size, 700, false), cell).toBeLessThanOrEqual(rd.colW);
          expect(rd.cols * rd.colW).toBeLessThanOrEqual(CW - 52);
        }
        if (c.headline) {
          const t = L.tabloid!;
          expect(t.lines.join(' ')).toBe(c.headline);
          expect(t.lines.length).toBeLessThanOrEqual(2);
          expect(t.y + t.lines.length * t.lh).toBeLessThanOrEqual(L.clip!.y + L.clip!.h);
          expect(L.clip!.y + L.clip!.h, 'clipping stays above the first row').toBeLessThanOrEqual(L.rowY[0]! - 6);
        }
      }
    });
  }
});

function outcome(): RunOutcome {
  return { save: defaultSave(), stars: [true, false, true], newStarFlags: [true, false, false], glorbs: 40, rankBefore: RANKS[0]!, rankAfter: RANKS[0]!, unlockedNext: false };
}

describe('report scene', () => {
  const photo = { human: 'doyle', x: [0, 0, 0, 10, 20, -10, -20, 5, 5, -5, -5].map((v, i) => v + i), y: [-80, -40, 60, -20, 0, -20, 0, 110, 170, 110, 170] };
  const abduct: AbductResult = { delivered: true, woke: false, timeSec: 20, bonks: 2, dignity: 80, snores: 3, itemsStolen: ['slipper'], aborted: false, photo, probeReadings: ['Temperature: lukewarm'] };
  const flight: FlightResult = { timeSec: 30, spotted: 2, roomId: 'farm_window' } as FlightResult;

  for (const lang of LANGS) {
    it(`draws the photo, cover story, headline and readings on a tutorial report (${lang})`, () => {
      setLang(lang);
      const model = tutorialReport(0, abduct, flight, outcome());
      expect(model.photo).toBe(photo);
      expect(model.headline).toBeTruthy();
      const content = reportContent(model, outcome(), measure);
      expect(content.layout.tabloid?.lines.some((t) => t.length > 3 && model.headline!.startsWith(t))).toBe(true);
      expect(content.layout.cover.lines.some((t) => model.cover.startsWith(t))).toBe(true);
      expect(content.readingsHeading).toBe(tr().reportExtras.readings);
      expect(content.layout.readings?.cells).toEqual([lang === 'fr' ? 'Température\u00a0: tiède' : 'Temperature: lukewarm']);
      expect(content.approved).toBe(tr().reportExtras.approved);
    });
  }

  it('deep reports carry the run photo, readings and a headline, on every deep level (L5–L7 included)', () => {
    for (let li = 0; li < LEVELS.length; li++) {
      const lv = LEVELS[li]!;
      if (lv.kind !== 'deep') continue;
      const run = new DeepRun(lv as DeepLevelDef, li);
      for (let target = 0; target < 3; target++) {
        run.startAbduct(target, 0);
        run.finishAbduct({ ...abduct, probeReadings: ['Reflexes: brisk ✓'] });
      }
      run.spotted = 3;
      const model = deepReport(run, outcome());
      expect(model.photo, lv.id).toBe(photo);
      expect(model.readings.length).toBe(3);
      expect(model.headline).toBeTruthy();
      expect(model.cover).toMatch(/3/);
      const { layout } = reportContent(model, outcome(), measure);
      expect(layout.cover.lines.some((t) => model.cover.startsWith(t)), lv.id).toBe(true);
    }
  });

  it('a quiet run has no headline and the card still renders without a photo', () => {
    const model = tutorialReport(1, { ...abduct, photo: undefined, delivered: false } as AbductResult, { ...flight, spotted: 1 }, outcome());
    expect(model.headline).toBeNull();
    expect(model.photo).toBeUndefined();
    const content = reportContent(model, outcome(), measure);
    expect(content.approved).toBeNull();
    expect(content.layout.tabloid).toBeNull();
    expect(VIEW_W).toBe(540);
    expect(VIEW_H).toBe(960);
  });
});
