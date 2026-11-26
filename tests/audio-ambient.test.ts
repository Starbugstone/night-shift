import { afterEach, describe, expect, it, vi } from 'vitest';
import { AmbientMixer, BED_FADE_SECONDS } from '../src/audio/ambient';
import { SynthAudio } from '../src/audio/sfx';
import { VoiceEngine } from '../src/audio/voice';

class Param {
  value = 1;
  events: [kind: string, time: number, value?: number][] = [];
  setValueAtTime(value: number, time: number) { this.events.push(['set', time, value]); }
  linearRampToValueAtTime(value: number, time: number) { this.events.push(['ramp', time, value]); }
  exponentialRampToValueAtTime() {}
  setTargetAtTime() {}
  cancelScheduledValues(time: number) { this.events.push(['cancel', time]); }
}

class Node {
  gain = new Param();
  frequency = new Param();
  offset = new Param();
  Q = new Param();
  threshold = new Param();
  ratio = new Param();
  start = vi.fn();
  stop = vi.fn();
  disconnect = vi.fn();
  connect<T>(destination: T): T { return destination; }
}

class Context {
  currentTime = 0;
  sampleRate = 8000;
  destination = new Node();
  state: 'suspended' | 'running' = 'suspended';
  gains: Node[] = [];
  oscillators: Node[] = [];
  sources: Node[] = [];

  resume = vi.fn(async () => { this.state = 'running'; });
  suspend = vi.fn(async () => { this.state = 'suspended'; });
  createDynamicsCompressor() { return new Node(); }
  createBiquadFilter() { return new Node(); }
  createConstantSource() { return new Node(); }
  createGain() { const n = new Node(); this.gains.push(n); return n; }
  createOscillator() { const n = new Node(); this.oscillators.push(n); return n; }
  createBufferSource() { const n = new Node(); this.sources.push(n); return n; }
  createBuffer(_channels: number, length: number, rate: number) {
    const samples = new Float32Array(length);
    return { getChannelData: () => samples, duration: length / rate };
  }
}

afterEach(() => vi.unstubAllGlobals());

describe('ambient mixer', () => {
  it('cross-fades over 1.5 seconds and holds an interrupted ramp at its current gain', () => {
    const ac = new Context();
    const mixer = new AmbientMixer(ac as unknown as BaseAudioContext, ac.destination as unknown as AudioNode);
    mixer.select('menu');
    const menu = ac.gains[0]!.gain;
    expect(menu.value).toBe(0);
    expect(menu.events).toEqual([['cancel', 0], ['set', 0, 0], ['ramp', BED_FADE_SECONDS, 1]]);
    const gains = ac.gains.length;
    mixer.select('menu');
    expect(ac.gains).toHaveLength(gains);

    ac.currentTime = BED_FADE_SECONDS / 2;
    mixer.select('night');
    expect(menu.events.slice(-3)).toEqual([['cancel', 0.75], ['set', 0.75, 0.5], ['ramp', 2.25, 0]]);
    expect(ac.sources[0]!.stop).toHaveBeenCalledExactlyOnceWith(2.25);
    const night = ac.gains[gains]!.gain;
    expect(night.events).toEqual([['cancel', 0.75], ['set', 0.75, 0], ['ramp', 2.25, 1]]);

    ac.currentTime = 1.5;
    mixer.select(null);
    expect(night.events.slice(-3)).toEqual([['cancel', 1.5], ['set', 1.5, 0.5], ['ramp', 3, 0]]);
    expect(ac.sources[1]!.stop).toHaveBeenCalledExactlyOnceWith(3);
  });

  it('defers playback to a gesture and suspends in the background', async () => {
    const ac = new Context();
    const openContext = vi.fn(function () { return ac; });
    vi.stubGlobal('window', { AudioContext: openContext });
    const audio = new SynthAudio();

    audio.setMuted(true);
    audio.ambient('menu');
    audio.resume();
    expect(openContext).not.toHaveBeenCalled();
    audio.unlock();
    await Promise.resolve();
    expect(openContext).toHaveBeenCalledTimes(1);
    expect(ac.sources).toHaveLength(0);
    expect(ac.gains[0]!.gain.value).toBe(0);

    audio.setMuted(false);
    expect(ac.sources).toHaveLength(1);
    expect(ac.gains[0]!.gain.events.at(-1)).toEqual(['ramp', 0.04, 0.55]);
    audio.suspend();
    audio.ambient('night-2199');
    expect(ac.suspend).toHaveBeenCalledTimes(1);
    expect(ac.sources).toHaveLength(1);
    audio.resume();
    await Promise.resolve();
    expect(ac.sources).toHaveLength(2);
    audio.setMuted(true);
    expect(ac.gains[0]!.gain.events.at(-1)).toEqual(['ramp', 0.04, 0]);
    expect(ac.sources[1]!.stop).toHaveBeenCalledExactlyOnceWith(BED_FADE_SECONDS);
  });

  it('reuses the tone and noise nodes for repeated effects after their envelopes end', async () => {
    const ac = new Context();
    vi.stubGlobal('window', { AudioContext: function () { return ac; } });
    const audio = new SynthAudio();
    audio.unlock();
    await Promise.resolve();
    audio.sfx('bark');
    const { sources, oscillators, gains } = ac;
    const initial = [sources.length, oscillators.length, gains.length];
    expect(initial).toEqual([1, 1, 3]);
    ac.currentTime = 1;
    audio.sfx('bark');
    expect([sources.length, oscillators.length, gains.length]).toEqual(initial);
  });
});

it('ends Vrell by the reveal deadline and fades the previous line before starting its replacement', () => {
  const ac = new Context();
  const voice = new VoiceEngine(
    ac as unknown as BaseAudioContext, ac.destination as unknown as AudioNode,
    ac.createBuffer(1, 8000, 8000) as unknown as AudioBuffer,
  );
  voice.speak('Bring all the sleepers back in time for the audit.', 'vrell', { within: 0.8 });
  const old = ac.oscillators[0]!;
  expect(old.stop.mock.calls[0]![0]).toBeLessThanOrEqual(0.8);
  ac.currentTime = 0.1;
  const previousOscillators = ac.oscillators.length;
  voice.speak('Back to work.', 'vrell');
  const replacement = ac.oscillators[previousOscillators]!;
  expect(old.stop.mock.calls.at(-1)![0]).toBeLessThan(replacement.start.mock.calls[0]![0]);
});
