// The alien babble, part 1: text -> syllables. Pure and DOM-free (tests/audio-voice.test.ts).
// `src/audio/voice.ts` plays a plan through WebAudio. A line always makes the same plan: every
// choice comes from a hash of the syllable or a PRNG seeded from the line and the voice.
import type { SpeakOptions, VoiceId } from '../contracts';

/** How a syllable starts. Plosives pop, k/c/q/x click (the alien tongue click), fricatives hiss. */
export type Onset = 'vowel' | 'stop' | 'click' | 'fric' | 'nasal' | 'liquid';

/** What ends a word: a pause and a pitch shape. */
export type Punct = 'none' | 'comma' | 'dash' | 'stop' | 'ask' | 'bang' | 'trail';

export interface Syllable {
  /** Start, seconds from the start of the line. */
  t: number;
  /** Voiced length, seconds. */
  dur: number;
  /** Pitch at the start and the end of the syllable, Hz. */
  f0: number;
  f1: number;
  /** Index into `VOWELS`. */
  vowel: number;
  onset: Onset;
  /** Centre of the hiss / pop / click band for the onset, Hz (0 = none). */
  hiss: number;
  /** 0..1.5 */
  amp: number;
  /** The second formant swoops through the vowel ("wow"). */
  warble: boolean;
  /** Phrase end: Vrell's rubber stamp lands here, Zib's "!" bursts here. */
  accent: boolean;
  /** A throat gurgle under the vowel (sub-octave fry). */
  gurgle: boolean;
  /** The next syllable is in the same word: the voice only dips between them. */
  join: boolean;
}

export interface SpeechPlan {
  voice: VoiceId;
  seed: number;
  /** Seconds of chime before the first syllable (the Bureau PA's ding-dong). */
  lead: number;
  syllables: Syllable[];
  /** When the last syllable has finished, seconds. */
  duration: number;
}

export interface VoiceProfile {
  /** Base pitch, Hz. */
  pitch: number;
  /** Lexical tone spread, semitones (each syllable's own pitch, from its hash). */
  range: number;
  /** Fall across a sentence, semitones. */
  declination: number;
  /** Rise on the last syllable of a question, semitones. */
  ask: number;
  /** Lift for a whole "!" sentence, semitones. */
  bang: number;
  /** Base syllable length, seconds. */
  syl: number;
  /** Random spread on syllable length, fraction. */
  jitter: number;
  /** Gap between words, seconds. */
  wordGap: number;
  /** Syllables snap to this beat when > 0 (Vrell's rubber-stamp cadence). */
  beat: number;
  /** Pauses for punctuation, seconds. */
  comma: number;
  stop: number;
  trail: number;
  /** Fastest the line may be played when it has to fit, as a time scale. */
  minScale: number;
  /** Syllables kept per word before thinning. */
  maxSylPerWord: number;
  /** Longest a line may babble with no `within`, seconds. */
  maxDur: number;
  /** Chance per syllable of a nervous pitch yelp. */
  yelp: number;
  /** Chance per syllable of a throat gurgle. */
  gurgle: number;
  /** Chime before speaking (seconds of lead), 0 = none. */
  chime: number;
  // ---- the synth (read by voice.ts)
  /** Formant scale: > 1 = smaller head. */
  formant: number;
  /** Vibrato, Hz and fraction of the pitch. */
  vibHz: number;
  vibDepth: number;
  /** Ring modulation: amount 0..1 and carrier as a ratio of the pitch (0 = fixed `ringHz`). */
  ring: number;
  ringRatio: number;
  ringHz: number;
  /** Sub-octave throat fry, 0..1. */
  fry: number;
  /** Hiss / pop level for consonants. */
  noise: number;
  /** Output band, Hz. */
  lo: number;
  hi: number;
  /** PA horn: soft clip + slapback echo. */
  pa: boolean;
  /** Output level. */
  gain: number;
}

/** Three formants per vowel (an adult human head), scaled by the voice. Two are not English. */
export const VOWELS: readonly (readonly [number, number, number])[] = [
  [730, 1090, 2440], // a
  [530, 1840, 2480], // e
  [270, 2290, 3010], // i
  [570, 840, 2410], // o
  [300, 870, 2240], // u
  [400, 1500, 2500], // ɨ (alien)
  [660, 1700, 2400], // æ (alien)
];

export const VOICES: Record<VoiceId, VoiceProfile> = {
  /** Intern Zib: high, nervous, fast; yelps and warbles, a metallic ring edge. */
  zib: {
    pitch: 290, range: 4, declination: 3, ask: 7, bang: 3,
    syl: 0.068, jitter: 0.35, wordGap: 0.03, beat: 0,
    comma: 0.12, stop: 0.2, trail: 0.34,
    minScale: 0.75, maxSylPerWord: 3, maxDur: 2.4, yelp: 0.1, gurgle: 0.05, chime: 0,
    formant: 1.28, vibHz: 10, vibDepth: 0.028, ring: 0.32, ringRatio: 1.48, ringHz: 0,
    fry: 0.05, noise: 0.5, lo: 220, hi: 6500, pa: false, gain: 0.62,
  },
  /** Supervisor Vrell: low, dry, bureaucratic monotone on a stamp beat; a gurgly sub-ring. */
  vrell: {
    pitch: 96, range: 1.2, declination: 2.5, ask: 3, bang: 1.5,
    syl: 0.1, jitter: 0.06, wordGap: 0.05, beat: 0.12,
    comma: 0.2, stop: 0.3, trail: 0.45,
    minScale: 1, maxSylPerWord: 1, maxDur: 1.4, yelp: 0, gurgle: 0.04, chime: 0,
    formant: 0.84, vibHz: 4.5, vibDepth: 0.008, ring: 0.16, ringRatio: 0.5, ringHz: 0,
    fry: 0.15, noise: 0.19, lo: 90, hi: 2700, pa: false, gain: 0.40,
  },
  /** The Bureau's PA announcer: flat, even, band-limited horn with a hum-ring and an echo. */
  bureau: {
    pitch: 138, range: 1.8, declination: 1.5, ask: 3, bang: 1,
    syl: 0.085, jitter: 0.08, wordGap: 0.045, beat: 0,
    comma: 0.16, stop: 0.26, trail: 0.4,
    minScale: 0.8, maxSylPerWord: 2, maxDur: 3, yelp: 0, gurgle: 0, chime: 0.62,
    formant: 1, vibHz: 0, vibDepth: 0, ring: 0.42, ringRatio: 0, ringHz: 55,
    fry: 0, noise: 0.3, lo: 420, hi: 2900, pa: true, gain: 0.72,
  },
};

/** `within`: the babble must be over by then (the reveal time); thinned or sped up to fit. */
export type PlanOptions = Pick<SpeakOptions, 'within' | 'panic'>;

// ---------------------------------------------------------------- text

/** A word: its syllable chunks ("far", "mer") and the punctuation after it. */
export interface Word {
  chunks: string[];
  end: Punct;
}

const VOWEL = /[aeiouy]/;
const LETTER = /[a-z]/;
const DIGIT = /[0-9]/;
const PUNCT_RANK: Record<Punct, number> = { none: 0, comma: 1, dash: 2, stop: 3, trail: 4, bang: 5, ask: 6 };

/** Lower-case, accents stripped, "..." as one ellipsis. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\.{3,}/g, '…');
}

/**
 * Split a word into syllable chunks, one per vowel group: a lone consonant between vowels starts
 * the next chunk, a cluster gives its first consonant to the chunk before ("far-mer"), the end of
 * the word joins the last chunk. Digits are a chunk each; a word without vowels is one chunk.
 */
export function chunkWord(word: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < word.length) {
    if (DIGIT.test(word[i]!)) {
      out.push(word[i]!);
      i++;
      continue;
    }
    let j = i;
    while (j < word.length && !DIGIT.test(word[j]!) && !VOWEL.test(word[j]!)) j++; // onset
    while (j < word.length && VOWEL.test(word[j]!)) j++; // nucleus
    let k = j;
    while (k < word.length && !DIGIT.test(word[k]!) && !VOWEL.test(word[k]!)) k++; // cluster
    const more = k < word.length && VOWEL.test(word[k]!);
    // no vowel after: the cluster is this chunk's coda; else a cluster of 2+ gives one consonant
    const cut = !more ? k : k - j >= 2 ? j + 1 : j;
    out.push(word.slice(i, cut));
    i = cut;
  }
  return out;
}

/** Words with their punctuation. Anything that isn't a letter, digit or punctuation is a space. */
export function tokenize(text: string): Word[] {
  const s = normalize(text);
  const words: Word[] = [];
  let buf = '';
  const flush = (): void => {
    if (buf) words.push({ chunks: chunkWord(buf), end: 'none' });
    buf = '';
  };
  const mark = (p: Punct): void => {
    flush();
    const last = words[words.length - 1];
    if (last && PUNCT_RANK[p] > PUNCT_RANK[last.end]) last.end = p;
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (LETTER.test(c) || DIGIT.test(c)) buf += c;
    else if (c === "'" || c === '’') {
      if (!buf) continue; // a quote, not an apostrophe
    } else if (c === '?') mark('ask');
    else if (c === '!') mark('bang');
    else if (c === '…') mark('trail');
    else if (c === '.') {
      // "Dr." / "3.5" read on; a full stop needs a space or the end after it
      const next = s[i + 1];
      if (next === undefined || next === ' ' || next === '\n' || next === '"' || next === ')') mark('stop');
    } else if (c === ',' || c === ';' || c === ':') mark('comma');
    else if (c === '—' || c === '–') mark('dash');
    else flush();
  }
  flush();
  return words;
}

// ---------------------------------------------------------------- hashing

/** FNV-1a, 32 bit. */
export function hashText(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a small seeded PRNG. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VOICE_SEED: Record<VoiceId, number> = { zib: 0x2b1, vrell: 0x7e11, bureau: 0xb0e };

function onsetOf(chunk: string): { onset: Onset; hiss: number } {
  const c = chunk[0]!;
  if (DIGIT.test(c)) return { onset: 'click', hiss: 3600 + Number(c) * 140 };
  if (VOWEL.test(c)) return { onset: 'vowel', hiss: 0 };
  switch (c) {
    case 'p': case 'b': return { onset: 'stop', hiss: 1100 };
    case 't': case 'd': return { onset: 'stop', hiss: 3600 };
    case 'g': return { onset: 'stop', hiss: 1800 };
    case 'k': case 'c': case 'q': case 'x': return { onset: 'click', hiss: 4300 };
    case 's': case 'z': return { onset: 'fric', hiss: chunk[1] === 'h' ? 3000 : 5600 };
    case 'f': case 'v': return { onset: 'fric', hiss: 2600 };
    case 'h': return { onset: 'fric', hiss: 1400 };
    case 'j': return { onset: 'fric', hiss: 3100 };
    case 'm': case 'n': return { onset: 'nasal', hiss: 0 };
    default: return { onset: 'liquid', hiss: 0 }; // l r w
  }
}

const VOWEL_OF: Record<string, number> = { a: 0, e: 1, i: 2, o: 3, u: 4, y: 5 };

/**
 * The alien cipher: the vowel heard is the letter's vowel shifted by its onset, so "ba" and "da"
 * keep different vowels and nothing sounds like English. Fixed per chunk: a word always sounds
 * the same in every line.
 */
function vowelOf(chunk: string): number {
  let v = -1;
  for (let i = 0; i < chunk.length; i++) {
    const k = VOWEL_OF[chunk[i]!];
    if (k !== undefined) { v = k; break; }
  }
  const onset = chunk.charCodeAt(0);
  if (v < 0) return onset % VOWELS.length;
  return (v * 3 + onset) % VOWELS.length;
}

// ---------------------------------------------------------------- layout

interface LayoutOpts {
  maxSyl: number;
  scale: number;
  /** Word keep mask (thinning); null keeps all. */
  keep: boolean[] | null;
}

function pauseFor(p: Punct, v: VoiceProfile): number {
  switch (p) {
    case 'comma': return v.comma;
    case 'dash': return v.comma * 1.2;
    case 'stop': case 'ask': case 'bang': return v.stop;
    case 'trail': return v.trail;
    default: return v.wordGap;
  }
}

const SENTENCE_END: ReadonlySet<Punct> = new Set(['stop', 'ask', 'bang', 'trail']);

function layout(words: readonly Word[], id: VoiceId, v: VoiceProfile, seed: number, o: LayoutOpts, panic: boolean): SpeechPlan {
  const rnd = prng(seed);
  const syllables: Syllable[] = [];
  const pitch = v.pitch * (panic ? 1.12 : 1);
  const speed = o.scale * (panic ? 0.86 : 1);
  let t = v.chime;
  // sentence spans, for declination and the "!" lift
  let w = 0;
  while (w < words.length) {
    let end = w;
    while (end < words.length - 1 && !SENTENCE_END.has(words[end]!.end)) end++;
    const kind = words[end]!.end;
    // the kept syllables of this sentence, so the contour spans what is actually said
    let total = 0;
    for (let i = w; i <= end; i++) if (!o.keep || o.keep[i]) total += Math.min(o.maxSyl, words[i]!.chunks.length);
    let n = 0;
    const lift = kind === 'bang' ? v.bang : 0;
    for (let i = w; i <= end; i++) {
      const word = words[i]!;
      if (o.keep && !o.keep[i]) continue;
      const chunks = word.chunks;
      const count = Math.min(o.maxSyl, chunks.length);
      for (let k = 0; k < count; k++) {
        // keep the first syllables and the last one (the word's ending carries its shape)
        const chunk = k === count - 1 ? chunks[chunks.length - 1]! : chunks[k]!;
        const h = hashText(chunk) ^ VOICE_SEED[id];
        const lastOfWord = k === count - 1;
        const lastOfSentence = lastOfWord && i === end;
        const { onset, hiss } = onsetOf(chunk);
        const progress = total > 1 ? n / (total - 1) : 0;
        let semis = v.range * (((h >>> 8) & 255) / 255 - 0.5) * 2 + v.declination * (0.5 - progress) + lift;
        if (k === 0) semis += 0.8; // word stress
        let glide = -0.4;
        if (lastOfWord) {
          if (word.end === 'comma' || word.end === 'dash') glide = 1.5;
          if (lastOfSentence) {
            if (kind === 'ask') glide = v.ask;
            else if (kind === 'bang') glide = -3;
            else if (kind === 'trail') glide = -2;
            else glide = -2.5;
          }
        }
        const yelp = v.yelp > 0 && rnd() < v.yelp;
        if (yelp) semis += 6;
        let dur = v.syl * (0.85 + Math.min(4, chunk.length) * 0.06) * (1 + v.jitter * (rnd() * 2 - 1));
        if (lastOfWord) dur *= 1.15;
        if (lastOfSentence) dur *= kind === 'ask' ? 1.5 : 1.3;
        if (kind === 'bang') dur *= 0.88;
        dur *= speed;
        if (v.beat > 0 && k === 0) t = Math.ceil(t / (v.beat * speed) - 1e-6) * (v.beat * speed); // words land on the beat
        const f0 = pitch * Math.pow(2, semis / 12);
        let amp = (0.75 + 0.25 * (((h >>> 16) & 255) / 255)) * (k === 0 ? 1 : 0.9);
        if (kind === 'bang') amp *= 1.25;
        if (kind === 'trail' && lastOfSentence) amp *= 0.7;
        syllables.push({
          t, dur, f0, f1: f0 * Math.pow(2, glide / 12),
          vowel: vowelOf(chunk), onset, hiss, amp,
          warble: (h & 7) === 3,
          accent: lastOfWord && (word.end !== 'none' || (v.beat > 0 && i === end)),
          gurgle: v.gurgle > 0 && rnd() < v.gurgle,
          join: !lastOfWord,
        });
        n++;
        t += dur;
      }
      t += pauseFor(word.end, v) * speed;
    }
    w = end + 1;
  }
  const last = syllables[syllables.length - 1];
  return { voice: id, seed, lead: v.chime, syllables, duration: last ? last.t + last.dur : 0 };
}

/** Keep about `ratio` of the words, evenly; always the first word and each sentence's last. */
function thin(words: readonly Word[], ratio: number): boolean[] {
  const keep: boolean[] = [];
  let acc = 0;
  for (let i = 0; i < words.length; i++) {
    acc += ratio;
    const must = i === 0 || SENTENCE_END.has(words[i]!.end) || i === words.length - 1;
    if (must || acc >= 1) {
      keep.push(true);
      if (!must) acc -= 1;
    } else keep.push(false);
  }
  return keep;
}

/**
 * Plan the babble for a line. Natural speed when it fits; otherwise one syllable per word, then
 * quicker (down to the voice's `minScale`), then fewer words, then cut at the limit.
 */
export function planSpeech(text: string, id: VoiceId, opts: PlanOptions = {}): SpeechPlan {
  const v = VOICES[id];
  const words = tokenize(text);
  const seed = (hashText(normalize(text)) ^ VOICE_SEED[id]) >>> 0;
  const panic = opts.panic === true;
  // Vrell gives a short impression of the memo even when the text takes longer to reveal.
  const limit = id === 'vrell'
    ? Math.max(0, Math.min(opts.within ?? v.maxDur, v.maxDur))
    : Math.max(0.2, Math.min(opts.within ?? v.maxDur, v.maxDur * 2));
  let plan = layout(words, id, v, seed, { maxSyl: v.maxSylPerWord, scale: 1, keep: null }, panic);
  if (plan.duration > limit) plan = layout(words, id, v, seed, { maxSyl: 1, scale: 1, keep: null }, panic);
  if (plan.duration > limit) {
    const scale = Math.max(v.minScale, (limit - v.chime) / Math.max(1e-3, plan.duration - v.chime));
    plan = layout(words, id, v, seed, { maxSyl: 1, scale, keep: null }, panic);
    if (plan.duration > limit) {
      const ratio = (limit - v.chime) / Math.max(1e-3, plan.duration - v.chime);
      plan = layout(words, id, v, seed, { maxSyl: 1, scale, keep: thin(words, ratio) }, panic);
    }
  }
  if (plan.duration > limit) {
    const kept = plan.syllables.filter((s) => s.t + s.dur <= limit);
    const last = kept[kept.length - 1];
    plan = { ...plan, syllables: kept, duration: last ? last.t + last.dur : 0 };
  }
  return plan;
}
