import { afterEach, describe, expect, it, vi } from 'vitest';
import { SynthAudio } from '../src/audio/sfx';
import { VoiceEngine } from '../src/audio/voice';

class Param {
  value = 1;
  events: [kind: string, time: number, value?: number][] = [];
  setValueAtTime(value: number, time: number) { this.events.push(['set', time, value]); }
  linearRampToValueAtTime(value: number, time: number) { this.events.push(['ramp', time, value]); }
  exponentialRampToValueAtTime(value: number, time: number) { this.events.push(['exp', time, value]); }
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

function setup() {
  const ac = new Context();
  const openContext = vi.fn(function () { return ac; });
  vi.stubGlobal('window', { AudioContext: openContext });
  return { ac, audio: new SynthAudio(), openContext };
}

describe('game sound effects', () => {
  it('waits for unlock, starts silent, and gates cues when muted or hidden', () => {
    const { ac, audio, openContext } = setup();
    audio.setMuted(true);
    audio.resume();
    audio.sfx('bark');
    expect(openContext).not.toHaveBeenCalled();
    audio.unlock();
    expect(openContext).toHaveBeenCalledTimes(1);
    expect(ac.gains[0]!.gain.value).toBe(0);
    audio.sfx('bark');
    expect(ac.sources).toHaveLength(0);

    audio.setMuted(false);
    expect(ac.gains[0]!.gain.events.at(-1)).toEqual(['ramp', 0.04, 0.55]);
    audio.suspend();
    audio.sfx('bark');
    expect(ac.suspend).toHaveBeenCalledTimes(1);
    expect(ac.sources).toHaveLength(0);

    audio.resume();
    audio.sfx('bark');
    expect(ac.sources).toHaveLength(1);
    audio.setMuted(true);
    expect(ac.gains[0]!.gain.events.at(-1)).toEqual(['ramp', 0.04, 0]);
  });

  it('reuses tone and noise nodes and coalesces same-frame repeats', () => {
    const { ac, audio } = setup();
    audio.unlock();
    audio.sfx('bark');
    expect(ac.sources).toHaveLength(1);
    expect(ac.oscillators).toHaveLength(1);
    const bark = ac.gains[1]!.gain.events;
    const firstEvents = bark.length;
    audio.sfx('bark');
    expect(bark).toHaveLength(firstEvents);
    ac.currentTime = 1;
    audio.sfx('bark');
    expect(bark).toHaveLength(firstEvents * 2);
    expect(ac.sources).toHaveLength(1);
    expect(ac.oscillators).toHaveLength(1);
  });

  it('raises the fuse tick pitch and gain through room and flight urgency', () => {
    const { ac, audio } = setup();
    audio.unlock();
    let lastPitch = 0;
    let lastGain = 0;
    // Room exposure runs from 0.25 to 0.8 and flight suspicion runs from 0.4 to 1.2.
    for (const volume of [0.25, 0.4, 0.55, 0.8, 1, 1.2]) {
      audio.sfx('alert', volume);
      const pitch = ac.oscillators[0]!.frequency.events.at(-2)![2]!;
      const envelope = ac.gains[1]!.gain.events.slice(-4);
      const gain = envelope[1]![2]!;
      expect(pitch).toBeGreaterThan(lastPitch);
      expect(gain).toBeGreaterThan(lastGain);
      expect(envelope[0]![2]).toBe(0);
      expect(envelope[1]![1]).toBeGreaterThan(envelope[0]![1]);
      expect(envelope[3]![2]).toBe(0);
      lastPitch = pitch;
      lastGain = gain;
      ac.currentTime += 0.2;
    }
    expect(ac.oscillators).toHaveLength(1);
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
