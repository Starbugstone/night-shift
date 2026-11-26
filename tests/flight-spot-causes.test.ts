// Every detector on every map resolves to a spot cause that the SPOTTED card can show, in the level's
// own era. Player reports this guards against:
// - the L9 era detectors were missing from the SPOTTED card's cause list: an empty card, then a crash
//   about 85 times a second;
// - the 1953 crowds were labelled with the 2199 "dozer" caption (a steward skin fell through to the
//   wrong era's cause).
// tests/flight-spotted-art.test.ts already checks that every SPOT_CAUSES entry draws a lens, a witness
// and a caption. This file walks the maps: which cause each real hazard gives, that the cause has
// its own lines (no silent fallback to the police or the generic card), and that it belongs to the
// level's era.
import { describe, expect, it } from 'vitest';
import hazardsSource from '../src/flight/hazards.ts?raw';
import { HazardField, SPOT_CAUSES, type HazardDef, type SpotCause } from '../src/flight/hazards';
import { LANGS, table } from '../src/i18n';
import { isDeep, LEVELS } from '../src/levels/levels';
import type { DeepLevelDef, DeepMap } from '../src/levels/types';

type Theme = DeepMap['theme'];

/** Hazard types that can spot the saucer: the `case`s of `HazardField.detect`, read from the source. */
function detectorTypes(): Set<HazardDef['type']> {
  const start = hazardsSource.indexOf('detect(x: number, y: number');
  expect(start, 'HazardField.detect not found').toBeGreaterThan(0);
  const body = hazardsSource.slice(start, hazardsSource.indexOf('\n  }\n', start));
  return new Set([...body.matchAll(/case '(\w+)'/g)].map(m => m[1] as HazardDef['type']));
}

/** Present-day maps: the modern causes (police, porch lights, CCTV...) belong here. */
const MODERN: ReadonlySet<Theme> = new Set(['suburb', 'city', 'pier', 'clinic', 'ship']);
/** Period maps: only their own causes (and timeless ones) may catch the saucer there. */
const PERIOD: ReadonlySet<Theme> = new Set(['badlands', 'storm55', 'grail', 'grimsby2199', 'invasion53']);

/** Causes from the present day. They may only appear on MODERN maps. */
const MODERN_CAUSES: ReadonlySet<SpotCause> = new Set(['police', 'patrol', 'traffic', 'porch', 'watcher', 'dog', 'heli', 'camera', 'window']);
/** Causes that read right in any era. */
const TIMELESS: ReadonlySet<SpotCause> = new Set(['dog']);
/** Each level-specific cause and the map theme(s) it belongs to. */
const HOME: Readonly<Partial<Record<SpotCause, readonly Theme[]>>> = {
  lighthouse: ['pier'],
  ambulance: ['clinic'],
  photographer: ['ship'],
  steward: ['ship'],
  hum: ['badlands'],
  poetry: ['grimsby2199'],
  dozer: ['grimsby2199'],
  eraLight: ['storm55'],
  eraWatcher: ['storm55'],
  eraPolice: ['storm55'],
  grailSentry: ['grail'],
  cow: ['grail'],
  clop: ['grail'],
  rabbit: ['grail'],
  projector1953: ['invasion53'],
  sneeze1953: ['invasion53'],
  evacuees1953: ['invasion53'],
  spotter1953: ['invasion53'],
  cruisers1955: ['storm55'],
};

interface Spot { level: DeepLevelDef; index: number; type: HazardDef['type']; skin: string; cause: SpotCause }

function spots(): Spot[] {
  const types = detectorTypes();
  return LEVELS.filter(isDeep).flatMap(level => {
    const field = new HazardField(level.map.hazards);
    return level.map.hazards.flatMap((h, index) => types.has(h.type)
      ? [{ level, index, type: h.type, skin: (h as { skin?: string }).skin ?? '', cause: field.spotCause(index) }]
      : []);
  });
}

const where = (s: Spot): string => `${s.level.id} hazard ${s.index} (${s.type}${s.skin ? ':' + s.skin : ''} -> ${s.cause})`;

describe('spot causes on the maps', () => {
  it('finds the detectors and every deep map in LEVELS', () => {
    const types = detectorTypes();
    for (const t of ['car', 'watcher', 'camera', 'steward', 'dog'] as const) expect(types.has(t), t).toBe(true);
    const all = spots();
    expect(new Set(all.map(s => s.level.id)).size).toBe(LEVELS.filter(isDeep).length);
  });

  it('classifies every cause and every map theme', () => {
    for (const cause of SPOT_CAUSES) {
      expect(MODERN_CAUSES.has(cause) || HOME[cause] !== undefined, `${cause}: add it to MODERN_CAUSES or HOME`).toBe(true);
    }
    for (const level of LEVELS.filter(isDeep)) {
      expect(MODERN.has(level.map.theme) || PERIOD.has(level.map.theme), `${level.id}: classify theme ${level.map.theme}`).toBe(true);
    }
  });

  it('resolves every detector to a cause the SPOTTED card knows, never the window fallback', () => {
    const known = new Set<string>(SPOT_CAUSES);
    for (const s of spots()) {
      expect(known.has(s.cause), where(s)).toBe(true);
      if (s.type !== 'window') expect(s.cause, `${where(s)}: spotCause fell through to its default`).not.toBe('window');
    }
  });

  it('keeps each cause in its own era', () => {
    for (const s of spots()) {
      const theme = s.level.map.theme;
      const home = HOME[s.cause];
      if (home) expect(home, `${where(s)} belongs to ${home.join('/')}, not ${theme}`).toContain(theme);
      else if (!TIMELESS.has(s.cause)) expect(MODERN.has(theme), `${where(s)}: a present-day cause on a ${theme} map`).toBe(true);
    }
  });

  it.each(LANGS)('gives every cause on a map its own card text and Zib lines (%s)', (lang) => {
    const words = table(lang);
    const humor = words.humor as unknown as Record<string, Record<string, readonly string[] | undefined>>;
    const labels = words.flight.photo.labels as Record<string, string | undefined>;
    const filled = (lines: readonly string[] | undefined): boolean => !!lines && lines.length > 0 && lines.every(l => l.trim().length > 0);
    for (const s of spots()) {
      expect(labels[s.cause]?.trim(), `${where(s)}: flight.photo.labels`).toBeTruthy();
      // the caption, Zib's excuse and Zib's first-sight line have no safe fallback
      expect(filled(humor.spotCaptions![s.cause]), `${where(s)}: humor.spotCaptions`).toBe(true);
      expect(filled(humor.spotZib![s.cause]), `${where(s)}: humor.spotZib (falls back to the police)`).toBe(true);
      expect(filled(humor.deepZib![s.cause]), `${where(s)}: humor.deepZib (Zib's first-sight line)`).toBe(true);
      // the witness may shout the generic lines in the present day, never in another era
      if (HOME[s.cause]) expect(filled(humor.spotShouts![s.cause]), `${where(s)}: humor.spotShouts`).toBe(true);
    }
  });
});
