// The alien voices (src/audio/voice-plan.ts): text -> syllables, punctuation shapes, speakers,
// fitting a reveal, and the same line always sounding the same.
import { describe, expect, it } from 'vitest';
import { chunkWord, hashText, planSpeech, tokenize, VOICES, type SpeechPlan } from '../src/audio/voice-plan';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';

const last = (p: SpeechPlan) => p.syllables[p.syllables.length - 1]!;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('voice text mapping', () => {
  it('splits words into one chunk per vowel group', () => {
    expect(chunkWord('farmer')).toEqual(['far', 'mer']);
    expect(chunkWord('specimen')).toEqual(['spe', 'ci', 'men']);
    expect(chunkWord('strength')).toEqual(['strength']);
    expect(chunkWord('hmm')).toEqual(['hmm']);
    expect(chunkWord('a')).toEqual(['a']);
  });

  it('reads digits one by one', () => {
    expect(chunkWord('0001')).toEqual(['0', '0', '0', '1']);
    expect(chunkWord('l8r')).toEqual(['l', '8', 'r']);
  });

  it('turns punctuation into word endings', () => {
    const words = tokenize('Oh no... Is that a dog? STOP! Wait, look — there.');
    expect(words.map((w) => w.end)).toEqual(['none', 'trail', 'none', 'none', 'none', 'ask', 'bang', 'comma', 'dash', 'stop']);
    expect(tokenize('Really?!')[0]!.end).toBe('ask');
    expect(tokenize('Wait…')[0]!.end).toBe('trail');
  });

  it('ignores accents, case, quotes and symbols', () => {
    expect(tokenize('Été')).toEqual(tokenize('ete'));
    expect(tokenize('"Hello" (there) #3 · ★')).toEqual(tokenize('hello there 3'));
    expect(tokenize("l'été")[0]!.chunks.join('')).toBe('lete');
    expect(tokenize('3.5 and Dr.Who').map((w) => w.end)).toEqual(['none', 'none', 'none']);
  });

  it('says nothing for an empty or punctuation-only line', () => {
    expect(planSpeech('', 'zib').syllables).toHaveLength(0);
    expect(planSpeech('?! … —', 'vrell').syllables).toHaveLength(0);
  });
});

describe('voice plans', () => {
  it('are deterministic: the same line always sounds the same', () => {
    const line = 'Oh no oh no. Is that a dog? Why is it looking at me?!';
    expect(planSpeech(line, 'zib')).toEqual(planSpeech(line, 'zib'));
    expect(planSpeech(line, 'vrell', { within: 2 })).toEqual(planSpeech(line, 'vrell', { within: 2 }));
    expect(planSpeech(line, 'zib').seed).not.toBe(planSpeech(line + ' Again.', 'zib').seed);
    expect(hashText('abc')).toBe(hashText('abc'));
  });

  it('give each speaker a different voice for the same line', () => {
    const line = 'Abduction abandoned. I have been notified.';
    const zib = planSpeech(line, 'zib');
    const vrell = planSpeech(line, 'vrell');
    expect(mean(zib.syllables.map((s) => s.f0))).toBeGreaterThan(2 * mean(vrell.syllables.map((s) => s.f0)));
    expect(mean(zib.syllables.map((s) => s.dur))).toBeLessThan(mean(vrell.syllables.map((s) => s.dur)));
    expect(zib.syllables.map((s) => s.f0)).not.toEqual(vrell.syllables.map((s) => s.f0));
  });

  it('keep a word sounding the same in different lines (it is a language)', () => {
    const a = planSpeech('Glorb', 'zib').syllables[0]!;
    const b = planSpeech('The glorb', 'zib').syllables[1]!;
    expect(b.vowel).toBe(a.vowel);
    expect(b.onset).toBe(a.onset);
  });

  it('rise on a question and fall on a statement', () => {
    const ask = last(planSpeech('Is that a dog?', 'zib'));
    const stop = last(planSpeech('Is that a dog.', 'zib'));
    expect(ask.f1).toBeGreaterThan(ask.f0 * 1.3);
    expect(stop.f1).toBeLessThan(stop.f0);
    const vAsk = last(planSpeech('Are you lost?', 'vrell'));
    expect(vAsk.f1).toBeGreaterThan(vAsk.f0);
  });

  it('lift and punch a "!" sentence', () => {
    const calm = planSpeech('Act casual right now.', 'zib');
    const bang = planSpeech('Act casual right now!', 'zib');
    expect(mean(bang.syllables.map((s) => s.f0))).toBeGreaterThan(mean(calm.syllables.map((s) => s.f0)));
    expect(mean(bang.syllables.map((s) => s.amp))).toBeGreaterThan(mean(calm.syllables.map((s) => s.amp)));
    expect(last(bang).accent).toBe(true);
  });

  it('pause on commas, longer on full stops, longest on an ellipsis', () => {
    const gapAfterFirst = (text: string): number => {
      const p = planSpeech(text, 'zib');
      const first = p.syllables[0]!;
      return p.syllables[1]!.t - (first.t + first.dur);
    };
    const plain = gapAfterFirst('Bo ba');
    const comma = gapAfterFirst('Bo, ba');
    const stop = gapAfterFirst('Bo. Ba');
    const trail = gapAfterFirst('Bo… ba');
    expect(comma).toBeGreaterThan(plain + 0.05);
    expect(stop).toBeGreaterThan(comma);
    expect(trail).toBeGreaterThan(stop);
  });

  it('lands Vrell words on his rubber-stamp beat', () => {
    const p = planSpeech('Form seven. Sign here, here and here.', 'vrell');
    const beat = VOICES.vrell.beat;
    const starts = p.syllables.filter((_, i) => i === 0 || !p.syllables[i - 1]!.join).map((s) => s.t / beat);
    for (const b of starts) expect(Math.abs(b - Math.round(b))).toBeLessThan(1e-6);
    expect(p.syllables.some((s) => s.accent)).toBe(true);
  });

  it('chimes before a Bureau announcement', () => {
    const p = planSpeech('Collect all three before dawn.', 'bureau');
    expect(p.lead).toBeGreaterThan(0.3);
    expect(p.syllables[0]!.t).toBeGreaterThanOrEqual(p.lead);
  });

  it('a panicking Zib is higher and quicker', () => {
    const line = 'They saw me. Act casual.';
    const calm = planSpeech(line, 'zib');
    const panic = planSpeech(line, 'zib', { panic: true });
    expect(mean(panic.syllables.map((s) => s.f0))).toBeGreaterThan(mean(calm.syllables.map((s) => s.f0)));
    expect(panic.duration).toBeLessThan(calm.duration);
  });

  it('fit inside the reveal time and stay short with no limit', () => {
    for (const lang of [en, fr]) {
      for (const lv of Object.values(lang.levels)) {
        const text = `${lv.body} ${lv.joke}`;
        const within = text.length / 70; // the memo's typewriter speed
        const p = planSpeech(text, 'vrell', { within });
        expect(p.duration).toBeLessThanOrEqual(within + 1e-9);
        expect(p.duration).toBeLessThanOrEqual(1.4);
        expect(p.syllables.length).toBeGreaterThanOrEqual(3);
        expect(p.syllables.length).toBeLessThanOrEqual(10);
      }
      for (const line of lang.abort.lines) expect(planSpeech(line, 'vrell', { within: 3 }).duration).toBeLessThanOrEqual(3);
    }
    const ramble = 'Oh no oh no oh no '.repeat(20);
    expect(planSpeech(ramble, 'zib').duration).toBeLessThanOrEqual(VOICES.zib.maxDur);
  });

  it('keep syllables in order and inside sane ranges', () => {
    const p = planSpeech(en.loading.tips.join(' '), 'bureau', { within: 6 });
    for (let i = 0; i < p.syllables.length; i++) {
      const s = p.syllables[i]!;
      if (i > 0) expect(s.t).toBeGreaterThanOrEqual(p.syllables[i - 1]!.t);
      expect(s.dur).toBeGreaterThan(0.02);
      expect(s.f0).toBeGreaterThan(40);
      expect(s.f0).toBeLessThan(1200);
      expect(s.amp).toBeLessThanOrEqual(1.5);
    }
  });
});
