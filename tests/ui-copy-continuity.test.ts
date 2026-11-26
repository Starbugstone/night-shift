// Story copy must not contradict the player's progress or spend a payoff early. Player reports behind
// these rules (2026-11-25/26):
//   "the L9 memo still says Intern Zib after the L8 promotion", "the Birch Lane memos call Zib paid before
//   L8", "a rank promised a salary before the L8 payoff", "L8 is a time trial with no dawn deadline but says
//   SUNRISE AT 6:00", "'Sunrise in 0:05' on a 10:10 pm deadline", "era first-clear lines name the next
//   era's year", "'#000{num}' printed #00010 at level 10".
// Facts: docs/story/continuity-review.md (timeline, cast, B1–B7, S1–S25), docs/story/decisions.md, docs/GDD-6-story.md.
//
// Each string is tied to the level where the player first reads it (tests/ui-copy-helpers.ts: memos, map
// and room copy, Zib's openers, report headlines, first-clear lines, souvenirs, specimen notes, town
// pickups, loading tips by their unlock gate, ranks by the stars on offer).
//
// 1. Story tokens: a `notBefore` token never shows up in copy the player reads before its story moment; a
//    `notAfter` token never shows up from that moment on.
// 2. Deadline words (sunrise, dawn…) appear only in levels whose clock runs to dawn, in the copy and in the
//    labels the game picks at run time (flight banner, retry screen, report). Time trials (L8) keep their
//    in-story dawn but every deadline label counts down like their HUD (src/ui/deadline.ts).
// 3. An era level names another era's year only when that era is a prerequisite of it (eras play in any order).
// 4. Work order numbers always print four digits.
//
// PENDING lists today's violations. They are real bugs and may only shrink: an entry that already passes
// fails the test until it is removed.
//
// Not automated (no data field to tie them to; check them by reading):
// - The L8 promotion happens in the first-clear line; whether a rank flavour ("Salary pending") reads as a
//   promise is judgement, so ranks only fail on affirmative pay words.
// - Callbacks must work cold (decisions.md): the token table only covers names and payoffs with a known
//   introduction point (Bubbles, Krix, OBELISK™, the Hitchhiker's anchors, the thermometer origin).
// - Pronouns (Zib they/them, Bubbles she/her...), ages and Doris/Dorothy (continuity review §2, N1).
// - "One film per era" and "Grimsby levels stay generic" (decisions D4, level-pitch backlog).
// - The 2199 epilogue playing once (dispatch2199Finale) and replays using ordinary lines.
// - The memo goals line, built inside a canvas view (the card, retry and HUD warning labels come from
//   src/ui/deadline.ts and are checked here).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { fmt, setLang, TABLES, tr, type Lang } from '../src/i18n';
import { formatOrderNumber, isDeep, LEVELS, workOrderNumber } from '../src/levels/levels';
import { isLevelUnlocked, RANKS, type RunOutcome } from '../src/levels/progress';
import { DeepRun } from '../src/levels/run';
import { defaultSave, type LevelId } from '../src/levels/save';
import type { DeepLevelDef } from '../src/levels/types';
import type { Shell } from '../src/core/shell';
import { DeepChoiceScene } from '../src/ui/deep-choice';
import { deadlineLabel, deadlineWarning } from '../src/ui/deadline';
import { deepReport } from '../src/ui/report';
import { leaves, momentOf, tiedStrings, type TiedString, type When } from './ui-copy-helpers';

afterEach(() => setLang('en'));

const LANGS: Lang[] = ['en', 'fr'];

// ── 1. story tokens ────────────────────────────────────────────────────────────────────────────────

interface StoryToken {
  en: RegExp;
  fr: RegExp;
  kind: 'notBefore' | 'notAfter';
  level: LevelId;
  when: When;
  why: string;
}

const TOKENS: Readonly<Record<string, StoryToken>> = {
  'intern address': {
    en: /\bintern zib\b/i, fr: /stagiaire zib/i, kind: 'notAfter', level: 'level8', when: 'after',
    why: 'Zib is hired at the L8 first clear; from L9 the memos say Agent Zib',
  },
  'agent title': {
    en: /\bagent zib\b/i, fr: /\bagent zib\b/i, kind: 'notBefore', level: 'level9', when: 'during',
    why: 'Agent Zib (junior) starts with the L9 memo',
  },
  pay: {
    en: /\b(?:hired|salaried|on the payroll|actual salary|paid (?:staff|job|call|shift|position|contract|work))\b|\bsalary\b(?! pending)/i,
    fr: /embauch|vrai salaire|salarié|(?:mission|boulot|poste|travail) payée?|salaire(?!\s+à\s+l)/i,
    kind: 'notBefore', level: 'level8', when: 'after',
    why: 'Zib is unpaid until the L8 payoff ("You\'re hired, Zib. Actual salary.")',
  },
  "Zib's parking ring": {
    en: /parking ring: zib|(?:your|zib['’]s|my) own parking ring|(?<!her |his )\bown parking ring/i,
    fr: /anneau de (?:parking|stationnement)\s*:\s*zib|votre propre anneau/i,
    kind: 'notBefore', level: 'level12', when: 'during',
    why: 'Bubbles signs her ring over to Zib in the 2199 finale (continuity review B1)',
  },
  'fish farewell': {
    en: /thanks for all the fish|so long, and thanks/i, fr: /merci pour le poisson/i, kind: 'notBefore', level: 'level12', when: 'during',
    why: 'the 2199 finale owns Bubbles\' farewell (decisions D1, review B6)',
  },
  "DON'T PANIC": {
    en: /don['’]t panic/i, fr: /pas de panique/i, kind: 'notBefore', level: 'level12', when: 'during',
    why: 'the 2199 finale owns the Hitchhiker\'s anchors (decisions D1)',
  },
  '42': { en: /(?<![\d#.,])42(?![\d%])/, fr: /(?<![\d#.,])42(?![\d%])/, kind: 'notBefore', level: 'level12', when: 'during', why: 'decisions D1' },
  'towel quote': {
    en: /know where (?:your|his|her|my) towel|where['’]s my towel/i, fr: /toujours où est (?:sa|votre|ma) serviette|où est ma serviette/i,
    kind: 'notBefore', level: 'level12', when: 'during', why: 'decisions D1: the towel swan stays a towel joke without the quote',
  },
  Bubbles: {
    en: /\bbubbles\b/i, fr: /\bbubulle\b/i, kind: 'notBefore', level: 'level5', when: 'during',
    why: 'Bubbles is met at Barnacle Bay; earlier copy must work cold',
  },
  Krix: { en: /\bkrix\b/i, fr: /\bkrix\b/i, kind: 'notBefore', level: 'level7', when: 'after', why: 'the L7 manifest reveals Krix ("We do not speak his name" before it)' },
  'OBELISK™': {
    en: /obelisk/i, fr: /obelisk/i, kind: 'notBefore', level: 'level7', when: 'after',
    why: 'the L7 manifest names the rival firm; L4 only says "an offshore consultancy"',
  },
  'Temporal Dispatch': {
    en: /temporal dispatch/i, fr: /dispatch temporel/i, kind: 'notBefore', level: 'level7', when: 'after',
    why: 'the L7 first clear opens Temporal Dispatch in the basement',
  },
  tripods: {
    en: /\btripod/i, fr: /tripode/i, kind: 'notBefore', level: 'level11', when: 'during',
    why: 'the War of the Worlds twist belongs to 1953 (review S2); 1122 may be played first',
  },
  'thermometer origin': {
    en: /(?:grandpa|grandfather) doyle.{0,60}thermometer|thermometer.{0,60}(?:grandpa|grandfather) doyle/i,
    fr: /(?:grand-père|papi|pépé) doyle.{0,60}thermomètre|thermomètre.{0,60}(?:grand-père|papi|pépé) doyle/i,
    kind: 'notBefore', level: 'level11', when: 'after', why: 'paid off once, at the 1953 first clear (decisions.md)',
  },
  'temporary lanyard': {
    en: /temporary lanyard|lanyard['’]s in the tray/i, fr: /badge provisoire/i, kind: 'notBefore', level: 'level2', when: 'after',
    why: 'the L2 first clear hands over the lanyard (review S7)',
  },
};

/** `${token} ${path}` occurrences allowed on purpose, with the reason. */
const TOKEN_ALLOWED: Readonly<Record<string, string>> = {
  'Bubbles ranks.3.flavour': 'decisions.md wording for the rank ("Parking ring: waitlisted. Behind Bubbles."): a tease L5 pays off',
};

/** `${lang} ${token} ${path}` violations waiting for a fix. */
const PENDING_TOKENS = new Set<string>([
  // L4 Mayor's 3rd-visit addendum needs Bubbles, whom a player meets only at L5
  'en Bubbles trophies.specimens.repeats.mayor.at3',
  'fr Bubbles trophies.specimens.repeats.mayor.at3',
  // the L5 town pickup is named "OBELISK™ crate", two shifts before the L7 manifest names the firm
  'en OBELISK™ mapCollectibles.items.obelisk_crate.name',
  'fr OBELISK™ mapCollectibles.items.obelisk_crate.name',
]);

function tokenViolations(lang: Lang, tied: readonly TiedString[]): string[] {
  const out: string[] = [];
  for (const [name, tok] of Object.entries(TOKENS)) {
    const at = momentOf(tok.level, tok.when);
    const re = tok[lang];
    for (const s of tied) {
      const wrong = tok.kind === 'notBefore' ? s.pos < at : s.pos >= at;
      if (!wrong || !re.test(s.text)) continue;
      const key = `${name} ${s.path}`;
      if (!(key in TOKEN_ALLOWED)) out.push(`${lang} ${key}`);
    }
  }
  return [...new Set(out)];
}

describe('1. story tokens respect the order the player meets them in', () => {
  const found = LANGS.flatMap((lang) => tokenViolations(lang, tiedStrings(lang)));

  it('the token table points at real levels', () => {
    for (const tok of Object.values(TOKENS)) expect(LEVELS.some((l) => l.id === tok.level), tok.level).toBe(true);
  });

  it('no story token shows up before (or after) its moment', () => {
    expect(found.filter((v) => !PENDING_TOKENS.has(v))).toEqual([]);
  });

  it('every pending token violation is still there (drop fixed ones from PENDING_TOKENS)', () => {
    expect([...PENDING_TOKENS].filter((p) => !found.includes(p))).toEqual([]);
  });

  it('every allowed exception still matches its token', () => {
    const en = tiedStrings('en');
    for (const key of Object.keys(TOKEN_ALLOWED)) {
      const name = Object.keys(TOKENS).find((n) => key.startsWith(`${n} `))!;
      const path = key.slice(name.length + 1);
      expect(en.some((s) => s.path === path && TOKENS[name]!.en.test(s.text)), key).toBe(true);
    }
  });
});

// ── 2. deadline words ──────────────────────────────────────────────────────────────────────────────

const DAWN_WORDS: Record<Lang, RegExp> = {
  en: /\b(?:sunrise|dawn|sun ?up|sun['’]s coming up|daybreak)\b/i,
  fr: /(?<!\p{L})aube(?!\p{L})|lever du soleil|soleil (?:se lève|levé)|aurore|petit jour/iu,
};

/** Levels whose clock runs to 6:00 but whose deadline is not dawn. */
const NOT_DAWN: Readonly<Record<string, string>> = {};

/**
 * Time trials: the story keeps its dawn (L8: Echo files at dawn), but the HUD counts down "LEFT", so every
 * screen's deadline label counts down too (2026-11-26 decision, src/ui/deadline.ts).
 */
const TIME_TRIAL: Readonly<Record<string, string>> = {
  level8: 'HUD counts down LEFT; Echo files at dawn in the story',
};

function dawnDeadline(id: string): boolean {
  const lv = LEVELS.find((l) => l.id === id)!;
  return isDeep(lv) && lv.clockMode !== 'elapsed' && lv.hours[1] === 6 && !(id in NOT_DAWN);
}

/** `${lang} ${path}` copy with a deadline word in a level without a dawn deadline. */
const PENDING_DAWN_COPY = new Set<string>([]);

/** `${lang} ${screen} ${level}` run-time labels that still say sunrise on a level without a dawn deadline. */
const PENDING_DAWN_UI = new Set<string>([]);

function stubCtx() {
  return {
    pointer: { x: 0, y: 0, down: false, pressed: false, released: false },
    assets: { get: () => undefined },
    audio: { sfx() {}, speak() {}, hush() {} },
    upgrades: new Set(),
    reducedMotion: true,
    tutorial: false,
    time: 0,
  };
}

function outcome(): RunOutcome {
  return { save: defaultSave(), stars: [false, false, false, false], newStarFlags: [false, false, false, false], glorbs: 0, rankBefore: RANKS[0]!, rankAfter: RANKS[0]!, unlockedNext: false };
}

/** The deadline labels each screen shows for a deep level, in the current language. */
function deadlineLabels(lv: DeepLevelDef): Record<string, string> {
  const index = workOrderNumber(lv.id) - 1;
  const scene = new DeepFlightScene({ run: new DeepRun(lv, index), level: lv, onLocked: vi.fn(), onSunrise: vi.fn(), onQuit: vi.fn(), ctx: stubCtx() } as never);
  const failed = new DeepRun(lv, index);
  const target = lv.map.targets.findIndex((tg) => tg.entries.length > 0);
  const tg = lv.map.targets[target]!;
  failed.lastFail = { target, entry: 0, roomId: tg.entries[0]!.roomId, reason: 'woke', by: tg.short };
  const choice = new DeepChoiceScene({} as Shell, failed, { retry() {}, backToFlight() {}, quit() {} } as never);
  const late = new DeepRun(lv, index);
  late.phase = 'sunrise';
  const report = deepReport(late, outcome());
  return { 'flight banner': scene.bannerHeading, 'retry screen': choice.status, 'report time': report.rows[0]![1] };
}

describe('2. sunrise and dawn only where the deadline is dawn', () => {
  const tied = LANGS.flatMap((lang) => tiedStrings(lang).map((s) => ({ ...s, lang })));
  const copy = tied.filter((s) => !dawnDeadline(s.level) && DAWN_WORDS[s.lang].test(s.text)).map((s) => `${s.lang} ${s.path}`);

  it('NOT_DAWN only lists levels whose clock would otherwise read as dawn', () => {
    for (const id of Object.keys(NOT_DAWN)) {
      const lv = LEVELS.find((l) => l.id === id)!;
      expect(isDeep(lv) && lv.clockMode !== 'elapsed' && lv.hours[1] === 6, id).toBe(true);
    }
  });

  it('copy for levels without a dawn deadline never mentions sunrise or dawn', () => {
    expect([...new Set(copy)].filter((c) => !PENDING_DAWN_COPY.has(c))).toEqual([]);
  });

  it('every pending dawn line is still there (drop fixed ones from PENDING_DAWN_COPY)', () => {
    expect([...PENDING_DAWN_COPY].filter((p) => !copy.includes(p))).toEqual([]);
  });

  it('the flight banner, retry screen and report only say sunrise on dawn levels', () => {
    const wrong: string[] = [];
    const stale: string[] = [];
    for (const lang of LANGS) {
      setLang(lang);
      for (const lv of LEVELS) {
        if (!isDeep(lv)) continue;
        for (const [screen, label] of Object.entries(deadlineLabels(lv))) {
          const key = `${lang} ${screen} ${lv.id}`;
          const bad = !dawnDeadline(lv.id) && DAWN_WORDS[lang].test(label);
          if (bad && !PENDING_DAWN_UI.has(key)) wrong.push(`${key}: ${label}`);
          if (!bad && PENDING_DAWN_UI.has(key)) stale.push(key);
        }
      }
    }
    expect(wrong).toEqual([]);
    expect(stale, 'fixed: drop from PENDING_DAWN_UI').toEqual([]);
  });

  it('time trials count down on every screen, never "sunrise"', () => {
    const wrong: string[] = [];
    for (const lang of LANGS) {
      setLang(lang);
      for (const id of Object.keys(TIME_TRIAL)) {
        const lv = LEVELS.find((l) => l.id === id)!;
        if (!isDeep(lv)) { wrong.push(`${id} is not a deep level`); continue; }
        const labels = {
          card: deadlineLabel(lv, '1:40', 'card'),
          retry: deadlineLabel(lv, '1:40', 'retry'),
          warning: deadlineWarning(lv),
          'retry screen': deadlineLabels(lv)['retry screen']!,
        };
        for (const [screen, label] of Object.entries(labels)) {
          if (DAWN_WORDS[lang].test(label)) wrong.push(`${lang} ${screen} ${id}: ${label}`);
        }
        if (labels.retry !== fmt(tr().timeTrial.timeLeft, { time: '1:40' })) wrong.push(`${lang} retry ${id}: ${labels.retry}`);
      }
    }
    expect(wrong).toEqual([]);
  });
});

// ── 3. era years ───────────────────────────────────────────────────────────────────────────────────

/** Era levels: deep levels whose English location carries a year (Crest Valley · Nov 12, 1955). */
function eras(): Map<string, string> {
  const out = new Map<string, string>();
  for (const lv of LEVELS) {
    const year = /\b(\d{4})\b/.exec(TABLES.en.levels[lv.id as LevelId].location)?.[1];
    if (isDeep(lv) && year) out.set(lv.id, year);
  }
  return out;
}

/** True when `other` must be delivered before `era` can be played. */
function prerequisite(era: string, other: string): boolean {
  const save = defaultSave();
  for (const lv of LEVELS) if (lv.id !== era && lv.id !== other) save.levels[lv.id as LevelId].delivered = true;
  return !isLevelUnlocked(save, LEVELS.findIndex((l) => l.id === era));
}

/** `${lang} ${path}` era copy naming a year the player may not have visited yet. */
const PENDING_ERA = new Set<string>([]);

describe('3. era levels only name the years of eras they require', () => {
  it('finds the four eras', () => {
    expect([...eras().values()].sort()).toEqual(['1122', '1953', '1955', '2199']);
  });

  it('no era copy names another era that may still be ahead', () => {
    const era = eras();
    const found: string[] = [];
    for (const lang of LANGS) {
      for (const s of tiedStrings(lang)) {
        if (!era.has(s.level)) continue;
        for (const [other, year] of era) {
          if (other === s.level || prerequisite(s.level, other)) continue;
          if (new RegExp(`(?<!\\d)${year}(?!\\d)`).test(s.text)) found.push(`${lang} ${s.path}`);
        }
      }
    }
    expect(found.filter((f) => !PENDING_ERA.has(f))).toEqual([]);
    expect([...PENDING_ERA].filter((p) => !found.includes(p)), 'fixed: drop from PENDING_ERA').toEqual([]);
  });

  it('first-clear lines never name another era at all (they read in any order, S24)', () => {
    const era = eras();
    for (const lang of LANGS) {
      setLang(lang);
      for (const [id, own] of era) {
        const line = (tr().humor.storyFirstClear as Record<string, string>)[id] ?? '';
        for (const year of era.values()) if (year !== own) expect(line, `${lang} ${id}`).not.toMatch(new RegExp(`(?<!\\d)${year}(?!\\d)`));
      }
    }
  });
});

// ── 4. work order numbers ──────────────────────────────────────────────────────────────────────────

describe('4. work order numbers print four digits', () => {
  it('no string pads the number itself', () => {
    for (const lang of LANGS) {
      for (const { path, value } of leaves(TABLES[lang])) expect(value, `${lang}:${path}`).not.toMatch(/(?:#|n°\s*)0+\{num\}|\{num\}-?0/);
    }
  });

  it('formatOrderNumber pads to four digits up to #9999', () => {
    for (const n of [1, 9, 10, 99, 100, 999, 1000, 9999]) expect(formatOrderNumber(n)).toMatch(/^\d{4}$/);
    LEVELS.forEach((lv, i) => expect(formatOrderNumber(workOrderNumber(lv.id))).toBe(String(i + 1).padStart(4, '0')));
  });

  it('every work order heading shows #NNNN for every level', () => {
    for (const lang of LANGS) {
      setLang(lang);
      const t = tr();
      for (const lv of LEVELS) {
        const num = formatOrderNumber(workOrderNumber(lv.id));
        const templates = [t.workOrders.orderNo, t.flight.orderNo, t.flight.banner, t.levels[lv.id as LevelId].re];
        if (lv.id === 'level9') templates.push(t.crestValley.order);
        for (const tpl of templates) {
          const out = fmt(tpl, { num, h: 6 });
          expect(out, `${lang} ${lv.id}: ${tpl}`).toContain(num);
          expect(out, `${lang} ${lv.id}: ${tpl}`).not.toMatch(/(?:#|n°\s*)\d{5}/i);
        }
      }
      if (isDeep(LEVELS[LEVELS.length - 1]!)) {
        const last = LEVELS[LEVELS.length - 1] as DeepLevelDef;
        const scene = new DeepFlightScene({ run: new DeepRun(last, LEVELS.length - 1), level: last, onLocked: vi.fn(), onSunrise: vi.fn(), onQuit: vi.fn(), ctx: stubCtx() } as never);
        expect(scene.bannerHeading, lang).toContain(formatOrderNumber(LEVELS.length));
      }
    }
  });
});
