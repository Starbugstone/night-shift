// Speech timers read the line (AGENTS.md: "Speech timers use readSeconds() (src/core/read-time.ts),
// never a fixed duration"). Player reports this guards against: Zib's lines had a fixed 2.8 s and the
// sleepers' mumbles 1.6 s, too short to read; a flavour line cut the L2 time-car joke after 0.4 s.
//
// 1. Every known speech timer (Zib's bubble, verses, barks, mumbles, knights' taunts...) is set from
//    readSeconds(), or from a helper that returns readSeconds().
// 2. Views that cycle a line on their own clock time it with readSeconds().
// 3. No new speech-like timer (`quipT`, `shoutFor`, `LINE_SECONDS`...) is set to a number literal,
//    except the listed non-speech cues.
// 4. Flavour lines wait FRESH_LINE_SECONDS before replacing a line, never a literal.
//
// PENDING_* name today's violations (bugs). They only shrink: a pending entry that passes fails.
import { describe, expect, it } from 'vitest';
import { FRESH_LINE_SECONDS, readSeconds } from '../src/core/read-time';

const raw = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const strip = (text: string): string => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
const files = Object.entries(raw)
  .map(([p, text]) => ({ path: p.replace(/^\.\.\//, ''), text: strip(text) }))
  .filter(f => !f.path.startsWith('src/i18n/') && f.path !== 'src/core/read-time.ts');
const source = (path: string): string => {
  const f = files.find(f => f.path === path);
  if (!f) throw new Error(`missing ${path}`);
  return f.text;
};

// ------------------------------------------------------------------ 1. known speech timers

/** Fields that hold how long a line of speech stays up, by file. */
const SPEECH_TIMERS: Readonly<Record<string, readonly string[]>> = {
  'src/flight/scene.ts': ['zibT', 'zibFor', 'collectibleToastT'],
  'src/flight/deep-scene.ts': ['zibT', 'zibFor', 'verseT', 'queueBarkT', 'collectibleToastT'],
  'src/flight/grail.ts': ['until'],
  'src/flight/views/invasion1953.ts': ['blessFor'],
  'src/abduct/simulation.ts': ['mumbleFor', 'mumbleFx'],
  'src/ui/title.ts': ['shreddedT'],
  'src/ui/workorders.ts': ['toastT'],
};
/** Helpers whose return value is a line's time on screen: they must return readSeconds(). */
const SPEECH_TIME_HELPERS: Readonly<Record<string, string>> = {
  mapPickupFeedback: 'src/flight/collectible.ts',
};
/** Known timers still set to a fixed duration (`file:field`). Bugs: fix them and remove the entry. */
const PENDING_TIMERS = new Set<string>([]);

function assignments(text: string, field: string): string[] {
  const re = new RegExp(`(?:\\.|\\b)${field}\\s*(?:=(?!=)|\\+=)\\s*([^;\\n]+)`, 'g');
  return [...text.matchAll(re)].map(m => m[1]!.trim());
}

function helperReadsTheLine(name: string): boolean {
  const text = source(SPEECH_TIME_HELPERS[name]!);
  const start = text.search(new RegExp(`function ${name}\\b`));
  if (start < 0) throw new Error(`helper ${name} not found`);
  const body = text.slice(start, text.indexOf('\n}\n', start));
  const returns = [...body.matchAll(/\breturn\b([^;]*);/g)].map(m => m[1]!);
  return returns.length > 0 && returns.every(r => /readSeconds\(/.test(r));
}

function timerOk(field: string, rhs: string): boolean {
  if (/readSeconds\(/.test(rhs)) return true;
  if (/^0(\.0+)?$/.test(rhs)) return true;
  // counting down
  if (new RegExp(`^Math\\.max\\(\\s*0\\s*,\\s*(this\\.)?${field}\\s*-`).test(rhs)) return true;
  const call = /^(\w+)\(/.exec(rhs);
  if (call && SPEECH_TIME_HELPERS[call[1]!]) return helperReadsTheLine(call[1]!);
  return false;
}

function timerViolations(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [path, fields] of Object.entries(SPEECH_TIMERS)) {
    const text = source(path);
    for (const field of fields) {
      const set = assignments(text, field);
      expect(set.length, `${path}: ${field} is never set (renamed? update SPEECH_TIMERS)`).toBeGreaterThan(0);
      const bad = set.filter(rhs => !timerOk(field, rhs));
      if (bad.length > 0) out.set(`${path}:${field}`, bad);
    }
  }
  return out;
}

// ------------------------------------------------------------------ 2. self-timed lines in views

/** Views that show a line on their own clock (a quip that comes and goes), by class. */
const SELF_TIMED: ReadonlyArray<{ path: string; cls: string; what: string }> = [
  { path: 'src/flight/grail.ts', cls: 'GrailSpeech', what: 'the knights, the rabbit and the Ni! shout' },
  { path: 'src/flight/views/invasion1953.ts', cls: 'DriveInDetectorView', what: 'the "Bless you!" sign' },
  { path: 'src/flight/views/collectible.ts', cls: 'PickupShout', what: 'the window shout about the town pickup' },
  { path: 'src/flight/views/deep.ts', cls: 'DeepTargetView', what: "a cleared house's left-behind quip" },
];
/** Self-timed views still on a fixed cycle. Bugs: fix them and remove the entry. */
const PENDING_SELF_TIMED = new Set<string>([]);

function classBody(text: string, cls: string): string {
  const start = text.search(new RegExp(`class ${cls}\\b`));
  if (start < 0) throw new Error(`class ${cls} not found`);
  const end = text.indexOf('\n}\n', start);
  return text.slice(start, end < 0 ? text.length : end);
}

// ------------------------------------------------------------------ 3. new speech-like timers

const SPEECHY = /zib|say|said|line|quip|mumble|verse|speech|shout|taunt|bubble|caption|joke|bless|toast|talk|chat|reply|excuse|bark|sulk|cue|tip|banner|word|pill|deliver|greet|hint|lesson|prompt|message|msg|story|opener|memo/i;
const CAMEL_TIMER = /^(\w*[a-z0-9])(T|For|Until|Timer|Left|Hold|Secs|Seconds|Time|Dur|Duration|Life|Stay)$/;
const CONST_TIMER = /^([A-Z0-9_]+?)_(T|FOR|UNTIL|SECONDS|SECS|HOLD|TIME|DUR|DURATION|LIFE|STAY)$/;
/** Speech-sounding timers that are not speech, with the reason (`file:name`). */
const NOT_SPEECH: Readonly<Record<string, string>> = {
  'src/flight/scene.ts:barkT': 'how often the dog bark sfx repeats while it sees you',
  'src/flight/deep-scene.ts:barkT': 'how often the dog bark sfx repeats while it sees you',
  'src/flight/deep-scene.ts:bannerT': 'the work-order title card; the opener line waits on it, and the line itself uses readSeconds',
  'src/flight/deep-scene.ts:deliverT': 'the delivered-count pop animation on the HUD',
  'src/abduct/index.ts:TURN_HINT_SECONDS': 'the turn gesture hint: up until the player turns once, at most 7 s (readSeconds\' own maximum)',
};
/** New-style speech timers still set to a literal (`file:name`). Bugs. */
const PENDING_LITERAL = new Set<string>([]);

function literalTimers(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const re = /(?:\.|\b(?:const|let|readonly|private|public|static)?\s*)\b([A-Za-z_]\w*)\s*(?:=(?!=)|:)\s*(?:(?:this\.)?(?:t|time|elapsed|now)\s*\+\s*)?(\d+(?:\.\d+)?)\s*[;,)\n}]/g;
  for (const f of files) {
    for (const m of f.text.matchAll(re)) {
      const [, name, value] = m;
      if (Number(value) === 0) continue;
      const camel = CAMEL_TIMER.exec(name!);
      const constant = CONST_TIMER.exec(name!);
      const base = camel?.[1] ?? constant?.[1];
      if (!base || !SPEECHY.test(base)) continue;
      const key = `${f.path}:${name}`;
      if (NOT_SPEECH[key]) continue;
      out.set(key, [...(out.get(key) ?? []), value!]);
    }
  }
  return out;
}

// ------------------------------------------------------------------ tests

describe('speech timers read the line', () => {
  it('reads longer lines for longer than the old fixed timers', () => {
    // a typical Zib line used to vanish after 2.8 s, a mumble after 1.6 s
    expect(readSeconds('Mrs. Pruitt locked on faster than my tractor beam. Respect, honestly.')).toBeGreaterThan(2.8);
    expect(readSeconds('Five more minutes, Mum…')).toBeGreaterThan(1.6);
    expect(FRESH_LINE_SECONDS).toBeGreaterThan(0.4);
  });

  it('sets every known speech timer from readSeconds()', () => {
    const bad = timerViolations();
    const unexpected = [...bad].filter(([k]) => !PENDING_TIMERS.has(k)).map(([k, v]) => `${k} = ${v.join(' | ')}`);
    expect(unexpected, 'use readSeconds(text) for a line on screen').toEqual([]);
    const fixed = [...PENDING_TIMERS].filter(k => !bad.has(k));
    expect(fixed, 'fixed: remove from PENDING_TIMERS').toEqual([]);
  });

  it('times self-cycling lines in views with readSeconds()', () => {
    const offenders = SELF_TIMED.filter(v => !/readSeconds\(/.test(classBody(source(v.path), v.cls))).map(v => v.cls);
    expect(offenders.filter(c => !PENDING_SELF_TIMED.has(c)), 'time the line with readSeconds(text)').toEqual([]);
    expect([...PENDING_SELF_TIMED].filter(c => !offenders.includes(c)), 'fixed: remove from PENDING_SELF_TIMED').toEqual([]);
  });

  it('sets no speech-like timer to a fixed number', () => {
    const found = literalTimers();
    const unexpected = [...found].filter(([k]) => !PENDING_LITERAL.has(k)).map(([k, v]) => `${k} = ${v.join(', ')}`);
    expect(unexpected, 'speech: use readSeconds(text); not speech: add it to NOT_SPEECH with a reason').toEqual([]);
    expect([...PENDING_LITERAL].filter(k => !found.has(k)), 'fixed: remove from PENDING_LITERAL').toEqual([]);
    for (const key of Object.keys(NOT_SPEECH)) {
      const [path, name] = key.split(':') as [string, string];
      expect(source(path), `${key} is gone: remove it from NOT_SPEECH`).toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  it('lets a flavour line wait FRESH_LINE_SECONDS before it replaces a line', () => {
    for (const path of ['src/flight/scene.ts', 'src/flight/deep-scene.ts']) {
      const guards = source(path).split('\n').filter(l => /FLAVOUR\.has\(/.test(l));
      expect(guards.length, path).toBeGreaterThan(0);
      // the line on screen has been up for less than FRESH_LINE_SECONDS: the flavour line waits
      for (const g of guards) expect(g, path).toMatch(/zibFor\s*-\s*this\.zibT\s*<\s*FRESH_LINE_SECONDS\b/);
    }
  });
});
