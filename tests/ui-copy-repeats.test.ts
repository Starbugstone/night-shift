// Repeated gags and local-only references in the string tables. Player reports behind these rules
// (2026-11-25/26):
//   "'thanks for the fish' is used three times", "'explain the receipt to Accounting' three times",
//   "manure jokes about seven times in one level", "probe / 'a year older' jokes in most specimen notes.
//   Surely we can find other jokes…", "the 'say Ni' pun twice".
// User rules: vary the jokes and cap repeats; running jokes stay 2–3 at a time (docs/story/decisions.md,
// docs/story/continuity-review.md §4). References must be known worldwide: English is the main audience,
// French a small one, so French copy may adapt a pun but not lean on France-only institutions, and English
// copy does not lean on US-only legal idioms (AGENTS.md v4).
//
// A. No phrase of PHRASE_WORDS consecutive words appears in three or more different English strings, except
//    the phrases in REPEAT_BASELINE (a deliberate running joke with its reason, or 'pending': a real repeat).
// B. Tracked gags stay under a cap, globally or per level. `now` records today's count where it is over the
//    design cap; it may only go down.
// C. A blocklist of France-only (FR) and US-only (EN) references. PENDING_LOCAL lists today's hits.
//
// Every baseline or pending entry must still be true: one that no longer fires fails the test until it is
// taken off its list, so the lists only shrink.
import { afterEach, describe, expect, it } from 'vitest';
import { setLang, TABLES } from '../src/i18n';
import { leaves, tiedStrings, words, type TiedString } from './ui-copy-helpers';

afterEach(() => setLang('en'));

// ── A. repeated phrases ────────────────────────────────────────────────────────────────────────────

/** Four words catch the reported repeats ("so long and thanks", "nobody saw a thing") without tripping on grammar. */
const PHRASE_WORDS = 4;
/** In this many different strings, a phrase is a repeated gag. */
const PHRASE_MAX_STRINGS = 2;

const REPEAT_BASELINE: Readonly<Record<string, string>> = {
  'a souvenir from every': 'per-level souvenir verdict opener; the joke is the sentence after it',
  'not one souvenir from': 'per-level souvenir verdict opener; the joke is the sentence after it',
  'one souvenir from the': 'per-level souvenir verdict opener; the joke is the sentence after it',
  'save the clock tower': 'the 1955 flyer\'s printed slogan, quoted on its own souvenir and shelf card',
  'it in the morning': 'everyday phrase in three unrelated jokes',
  'still on the shelf': 'pending',
  'it was the only': 'pending',
  'nobody saw a thing': 'pending',
};

function repeatedPhrases(): Map<string, string[]> {
  // item names repeat in their own lines by design ("ship in a bottle")
  const names = Object.keys(TABLES.en.items).map((n) => words(n).join(' '));
  const byPhrase = new Map<string, string[]>();
  const seen = new Set<string>();
  for (const { path, value } of leaves(TABLES.en)) {
    if (seen.has(value) || path.startsWith('meta.')) continue;
    seen.add(value);
    const w = words(value);
    const grams = new Set<string>();
    for (let i = 0; i + PHRASE_WORDS <= w.length; i++) grams.add(w.slice(i, i + PHRASE_WORDS).join(' '));
    for (const g of grams) {
      if (names.some((n) => n.includes(g))) continue;
      const list = byPhrase.get(g) ?? [];
      list.push(path);
      byPhrase.set(g, list);
    }
  }
  return new Map([...byPhrase].filter(([, paths]) => paths.length > PHRASE_MAX_STRINGS));
}

describe('A. no phrase is repeated across three strings', () => {
  const repeats = repeatedPhrases();

  it('every repeated phrase is in the baseline', () => {
    const fresh = [...repeats].filter(([g]) => !(g in REPEAT_BASELINE)).map(([g, paths]) => `"${g}" ×${paths.length}: ${paths.join(' | ')}`);
    expect(fresh, 'vary the joke, or add the phrase to REPEAT_BASELINE with the reason it is a running joke').toEqual([]);
  });

  for (const [phrase, why] of Object.entries(REPEAT_BASELINE)) {
    it(`"${phrase}" ${why === 'pending' ? 'still waits for a rewrite (drop it from REPEAT_BASELINE once fixed)' : `stays listed: ${why}`}`, () => {
      expect(repeats.has(phrase), `"${phrase}" is no longer repeated: drop it from REPEAT_BASELINE`).toBe(true);
    });
  }
});

// ── B. tracked gags ────────────────────────────────────────────────────────────────────────────────

interface Gag {
  re: RegExp;
  /** Where to count: every English string, the strings of each level, or each level's specimen notes. */
  scope: 'global' | 'perLevel' | 'specimenNotesPerLevel' | 'specimenNotes';
  cap: number;
  /** Per-level cap overrides, with the level's theme as the reason. */
  levelCaps?: Readonly<Record<string, number>>;
  /** Today's count while it is over `cap`; may only go down. */
  now?: number;
  why: string;
}

const GAGS: Readonly<Record<string, Gag>> = {
  'fish farewell': { re: /thanks for all the/i, scope: 'global', cap: 1, why: 'the 2199 finale owns "So long, and thanks for all the fish" (decisions D1)' },
  'receipt to Accounting': { re: /receipt.{0,20}accounting|explain .{0,30}receipt/i, scope: 'global', cap: 1, why: 'reported three times' },
  '"say Ni" pun': { re: /\bsay(?:s|ing)? ni\b/i, scope: 'global', cap: 1, why: 'reported twice' },
  'a year older / birthday': { re: /year older|birthday/i, scope: 'specimenNotes', cap: 1, why: 'reported in most specimen notes' },
  'probe in specimen notes': { re: /\bprob(?:e|es|ed|ing)\b/i, scope: 'specimenNotesPerLevel', cap: 2, levelCaps: { level6: 4 }, why: 'reported in most specimen notes; L6 is the probe audit' },
  'probe in all specimen notes': { re: /\bprob(?:e|es|ed|ing)\b/i, scope: 'specimenNotes', cap: 12, why: 'no new probe notes (12 today across 76 notes)' },
  manure: { re: /manure/i, scope: 'perLevel', cap: 3, why: 'reported about seven times in one level' },
  Accounting: { re: /\baccounting\b/i, scope: 'perLevel', cap: 2, why: 'running joke, 2–3 per level' },
  toaster: { re: /toaster/i, scope: 'global', cap: 11, why: 'continuity review §4: nothing new, one final callback at most' },
  '"Adequate"': { re: /\badequate\b/i, scope: 'global', cap: 5, why: 'continuity review §4: Vrell\'s word, used sparingly' },
  'X-Files': {
    re: /truth is out there|trust no one|mulder|scully|i want to believe|smoking man|x-files|under "x"|agent nigel/i,
    scope: 'global', cap: 2, now: 7, why: 'continuity review S15: keep Gary and Nigel, replace the rest',
  },
  Tuesday: { re: /\btuesday/i, scope: 'global', cap: 7, now: 8, why: 'the Tuesday gag is retired (decisions.md); S16 cut "Classic Tuesday" from the L2 time-car egg' },
};

function distinctTexts(list: readonly { text: string }[]): string[] {
  return [...new Set(list.map((s) => s.text))];
}

function gagCounts(gag: Gag, tied: readonly TiedString[]): Map<string, number> {
  const out = new Map<string, number>();
  const count = (key: string, list: readonly { text: string }[]) => out.set(key, distinctTexts(list).filter((s) => gag.re.test(s)).length);
  if (gag.scope === 'global') count('all', leaves(TABLES.en).map((l) => ({ text: l.value })));
  if (gag.scope === 'specimenNotes') count('all', tied.filter((s) => s.path.startsWith('trophies.specimens.')));
  if (gag.scope === 'perLevel' || gag.scope === 'specimenNotesPerLevel') {
    const scoped = gag.scope === 'perLevel' ? tied : tied.filter((s) => s.path.startsWith('trophies.specimens.'));
    for (const level of new Set(tied.map((s) => s.level))) count(level, scoped.filter((s) => s.level === level));
  }
  return out;
}

describe('B. tracked gags stay under their caps', () => {
  const tied = tiedStrings('en');
  for (const [name, gag] of Object.entries(GAGS)) {
    it(`${name}: ${gag.why}`, () => {
      const over: string[] = [];
      for (const [key, n] of gagCounts(gag, tied)) {
        const cap = gag.levelCaps?.[key] ?? gag.cap;
        if (gag.now !== undefined && key === 'all') {
          expect(gag.now, `${name}: \`now\` must be over the cap, or drop it`).toBeGreaterThan(cap);
          expect(n, `${name} is at ${n}: lower \`now\` to ${n}${n <= cap ? ' (or drop it: it is within the cap)' : ''}`).toBe(gag.now);
        } else if (n > cap) {
          over.push(`${key}: ${n} > ${cap}`);
        }
      }
      expect(over).toEqual([]);
    });
  }
});

// ── C. local-only references ───────────────────────────────────────────────────────────────────────

/** France-only institutions and money in the French table. Write "formulaire", "impôts", "€", or the joke without them. */
const FR_LOCAL: Readonly<Record<string, RegExp>> = {
  Cerfa: /(?<!\p{L})cerfa(?!\p{L})/iu,
  URSSAF: /(?<!\p{L})urssaf(?!\p{L})/iu,
  'France Inter': /france inter(?!\p{L})/iu,
  'Sécu': /(?<!\p{L})s[ée]cu(?!\p{L})|s[ée]curit[ée] sociale/iu,
  CAF: /(?<!\p{L})CAF(?!\p{L})/u,
  'Pôle emploi': /p[ôo]le emploi|france travail|(?<!\p{L})assedic(?!\p{L})/iu,
  'pounds (£ / livres)': /£|\d\s*livres?(?!\p{L})|livres? sterling/iu,
  'other French brands': /(?<!\p{L})(?:sncf|ratp|tf1|minitel)(?!\p{L})|carte vitale/iu,
};

/** US-only idioms in the English table. */
const EN_LOCAL: Readonly<Record<string, RegExp>> = {
  'plead the Fifth': /plead(?:s|ed|ing)? the fifth|fifth amendment/i,
  'Miranda rights': /miranda (?:rights|warning)/i,
  'US agencies': /\bdmv\b|\birs\b|social security number|\b401\(?k\)?/i,
};

/** `${lang} ${term} ${path}` hits waiting for a rewrite. */
const PENDING_LOCAL = new Set<string>([
  // 2026-11-26: the 23 « Cerfa » lines became « formulaire » (« FORM. 7-B » on the clinic badge).
]);

function localHits(): string[] {
  const hits: string[] = [];
  const scan = (lang: 'en' | 'fr', terms: Readonly<Record<string, RegExp>>) => {
    for (const { path, value } of leaves(TABLES[lang])) {
      for (const [term, re] of Object.entries(terms)) if (re.test(value)) hits.push(`${lang} ${term} ${path}`);
    }
  };
  scan('fr', FR_LOCAL);
  scan('en', EN_LOCAL);
  return hits;
}

describe('C. references are international', () => {
  const hits = localHits();

  it('no new France-only or US-only reference', () => {
    expect(hits.filter((h) => !PENDING_LOCAL.has(h)), 'use the international equivalent (e.g. "formulaire 7-B", "€")').toEqual([]);
  });

  it('every pending local reference is still there (drop fixed ones from PENDING_LOCAL)', () => {
    const now = new Set(hits);
    expect([...PENDING_LOCAL].filter((p) => !now.has(p))).toEqual([]);
  });
});
