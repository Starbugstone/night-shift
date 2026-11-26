type Wave = 'sine' | 'triangle';

interface ToneOptions {
  vibrato?: number;
  depth?: number;
  swell?: boolean;
  cutoff?: number;
}

interface NoiseOptions {
  q?: number;
  end?: number;
  swell?: boolean;
}

interface ToneVoice {
  osc: OscillatorNode;
  filter: AudioParam;
  level: AudioParam;
  availableAt: number;
  vibrato?: { speed: AudioParam; depth: AudioParam };
}

interface NoiseVoice {
  filter: BiquadFilterNode;
  level: AudioParam;
  availableAt: number;
}

/** Reuse silent oscillators and filtered noise, adding a voice only when sounds overlap. */
export class SoundVoices {
  private readonly tones: Record<Wave, ToneVoice[]> = { sine: [], triangle: [] };
  private readonly noises = new Map<BiquadFilterType, NoiseVoice[]>();

  constructor(private readonly ac: BaseAudioContext, private readonly out: AudioNode, private readonly wind: AudioBuffer) {}

  tone(
    wave: Wave, f0: number, f1: number, at: number, duration: number, gain: number,
    { vibrato = 0, depth = 0, swell = false, cutoff = 2500 }: ToneOptions = {},
  ): void {
    if (gain <= 0.0001) return;
    const pool = this.tones[wave];
    const voice = firstAvailable(pool, at) ?? this.addTone(wave);
    const end = at + duration;
    voice.availableAt = end;
    voice.osc.frequency.setValueAtTime(f0, at);
    voice.osc.frequency.exponentialRampToValueAtTime(f1, end);
    voice.filter.setValueAtTime(cutoff, at);
    if (vibrato > 0) voice.vibrato ??= this.addVibrato(voice.osc);
    voice.vibrato?.speed.setValueAtTime(vibrato, at);
    voice.vibrato?.depth.setValueAtTime(depth, at);
    envelope(voice.level, at, end, gain, swell);
  }

  private addTone(wave: Wave): ToneVoice {
    const osc = this.ac.createOscillator();
    osc.type = wave;
    const filter = this.ac.createBiquadFilter();
    filter.type = 'lowpass';
    const level = this.ac.createGain();
    level.gain.value = 0;
    osc.connect(filter).connect(level).connect(this.out);
    osc.start(this.ac.currentTime);
    const voice = { osc, filter: filter.frequency, level: level.gain, availableAt: 0 };
    this.tones[wave].push(voice);
    return voice;
  }

  private addVibrato(osc: OscillatorNode): NonNullable<ToneVoice['vibrato']> {
    const lfo = this.ac.createOscillator();
    const amount = this.ac.createGain();
    amount.gain.value = 0;
    lfo.connect(amount).connect(osc.frequency);
    lfo.start(this.ac.currentTime);
    return { speed: lfo.frequency, depth: amount.gain };
  }

  noise(
    type: BiquadFilterType, frequency: number, at: number, duration: number, gain: number,
    { q = 0.7, end = frequency, swell = false }: NoiseOptions = {},
  ): void {
    if (gain <= 0.0001) return;
    let pool = this.noises.get(type);
    if (!pool) this.noises.set(type, pool = []);
    const voice = firstAvailable(pool, at) ?? this.addNoise(type, pool);
    const stop = at + duration;
    voice.availableAt = stop;
    voice.filter.frequency.setValueAtTime(frequency, at);
    voice.filter.frequency.exponentialRampToValueAtTime(end, stop);
    voice.filter.Q.setValueAtTime(q, at);
    envelope(voice.level, at, stop, gain, swell);
  }

  private addNoise(type: BiquadFilterType, pool: NoiseVoice[]): NoiseVoice {
    const source = this.ac.createBufferSource();
    source.buffer = this.wind;
    source.loop = true;
    const filter = this.ac.createBiquadFilter();
    filter.type = type;
    const level = this.ac.createGain();
    level.gain.value = 0;
    source.connect(filter).connect(level).connect(this.out);
    source.start(this.ac.currentTime, Math.random() * this.wind.duration);
    const voice = { filter, level: level.gain, availableAt: 0 };
    pool.push(voice);
    return voice;
  }

  notes(
    frequencies: readonly number[], at: number, gap: number, duration: number, tail: number, gain: number,
    ending?: ToneOptions & { bend: number },
  ): void {
    for (let i = 0; i < frequencies.length; i++) {
      const f = frequencies[i]!;
      const last = i === frequencies.length - 1;
      this.tone('triangle', f, last ? f * (ending?.bend ?? 1) : f, at + i * gap, last ? tail : duration, gain, last ? ending : undefined);
    }
  }
}

function firstAvailable<T extends { availableAt: number }>(pool: readonly T[], at: number): T | undefined {
  for (const voice of pool) if (voice.availableAt <= at) return voice;
  return undefined;
}

function envelope(level: AudioParam, at: number, end: number, gain: number, swell: boolean): void {
  const attack = swell ? (end - at) * 0.45 : 0.012;
  level.setValueAtTime(0, at);
  level.linearRampToValueAtTime(gain, at + attack);
  level.exponentialRampToValueAtTime(0.0001, end - 0.006);
  level.linearRampToValueAtTime(0, end);
}
