import type { AmbientBed } from '../contracts';
import type { LevelId } from '../levels/save';
import { GainRamp } from './gain-ramp';

export const BED_FADE_SECONDS = 1.5;

export function nightBed(level: LevelId): AmbientBed {
  switch (level) {
    case 'level5': case 'level7': return 'night-coast';
    case 'level8': return 'night-primate';
    case 'level9': return 'night-storm';
    case 'level10': return 'night-medieval';
    case 'level11': return 'night-1953';
    case 'level12': return 'night-2199';
    default: return 'night';
  }
}

type Air = readonly [highpass: number, lowpass: number, gain: number, driftHz: number, depth: number];
type Hum = readonly [frequency: number, gain: number];
type Accent = readonly [at: number, duration: number, fromHz: number, toHz: number, gain: number, grit?: number];

interface Profile {
  air: readonly Air[];
  hum: readonly Hum[];
  accents?: readonly Accent[];
}

const profiles: Record<AmbientBed, Profile> = {
  menu: {
    air: [[115, 510, 0.26, 0.11, 0.22]],
    hum: [[144, 0.055], [215, 0.026], [288.8, 0.014]],
  },
  night: {
    air: [[240, 880, 0.38, 0.13, 0.39]],
    hum: [[127, 0.039], [193, 0.017]],
    accents: [
      [5.7, 0.21, 1550, 1520, 0.025, 0.16], [6.04, 0.14, 1560, 1535, 0.016, 0.18],
      [13.4, 0.49, 391, 369, 0.036], [14.07, 0.30, 365, 343, 0.023],
      [19.3, 0.22, 1730, 1695, 0.023, 0.12], [19.61, 0.17, 1710, 1680, 0.015, 0.14],
      [34.7, 0.68, 370, 342, 0.023], [41.9, 0.19, 1520, 1490, 0.019, 0.14],
    ],
  },
  'night-coast': {
    air: [[150, 620, 0.33, 0.17, 0.68], [400, 1150, 0.20, 0.113, 0.69]],
    hum: [[132, 0.035], [201, 0.013]],
  },
  'night-primate': {
    air: [[190, 830, 0.36, 0.097, 0.32], [470, 1380, 0.09, 0.21, 0.58]],
    hum: [[112, 0.044], [225.4, 0.016]],
    accents: [
      [7.2, 0.55, 260, 237, 0.035], [8, 0.37, 235, 213, 0.022],
      [17.1, 0.31, 620, 545, 0.021], [33.9, 0.68, 271, 232, 0.026],
      [36.2, 0.24, 587, 550, 0.02],
    ],
  },
  'night-storm': {
    air: [[100, 570, 0.39, 0.087, 0.58], [390, 1090, 0.14, 0.24, 0.48]],
    hum: [[124, 0.035], [186, 0.012]],
    accents: [[9.4, 2.8, 105, 60, 0.033, 0.25], [30.3, 3.4, 124, 64, 0.032, 0.3]],
  },
  'night-medieval': {
    air: [[180, 720, 0.37, 0.11, 0.36]],
    hum: [[140, 0.034], [210, 0.017]],
    accents: [
      [5.2, 0.50, 388, 364, 0.036], [5.87, 0.31, 361, 334, 0.025],
      [14.6, 2.7, 275, 275, 0.033], [14.6, 1.4, 413, 412, 0.012],
      [37.1, 0.85, 384, 347, 0.025],
    ],
  },
  'night-1953': {
    air: [[210, 800, 0.33, 0.12, 0.45], [640, 1540, 0.14, 0.078, 0.72]],
    hum: [[120, 0.041], [242, 0.017]],
  },
  'night-2199': {
    air: [[200, 685, 0.33, 0.071, 0.38], [460, 1110, 0.13, 0.16, 0.46]],
    hum: [[156, 0.046], [234, 0.018], [236.2, 0.015]],
  },
  room: {
    air: [[115, 490, 0.31, 0.079, 0.22]],
    hum: [[119, 0.043], [239, 0.022]],
    accents: [
      [2.6, 0.087, 575, 410, 0.022], [6.6, 0.081, 501, 368, 0.019],
      [10.6, 0.087, 575, 410, 0.022], [14.6, 0.081, 501, 368, 0.019],
      [18.6, 0.087, 575, 410, 0.023], [24.6, 0.081, 501, 368, 0.017],
      [28.6, 0.087, 575, 410, 0.022], [32.6, 0.081, 501, 368, 0.019],
      [36.6, 0.087, 575, 410, 0.022], [40.6, 0.081, 501, 368, 0.019],
    ],
  },
};

interface Layer {
  fade: GainRamp;
  sources: AudioScheduledSourceNode[];
}

/** Keep the current bed playing continuously and retire outgoing graphs after their fades. */
export class AmbientMixer {
  private bed: AmbientBed | null = null;
  private layer: Layer | null = null;
  private noise: AudioBuffer | null = null;
  private readonly accentLoops = new Map<AmbientBed, AudioBuffer>();

  constructor(private readonly ac: BaseAudioContext, private readonly out: AudioNode) {}

  select(bed: AmbientBed | null): void {
    if (bed === this.bed) return;
    const incoming = bed === null ? null : this.build(bed);
    this.bed = bed;
    const now = this.ac.currentTime;
    if (this.layer) {
      this.layer.fade.fadeTo(0, now, BED_FADE_SECONDS);
      for (const source of this.layer.sources) source.stop(now + BED_FADE_SECONDS);
    }
    this.layer = incoming;
    this.layer?.fade.fadeTo(1, now, BED_FADE_SECONDS);
  }

  private build(bed: AmbientBed): Layer {
    const { air, hum, accents } = profiles[bed];
    const ac = this.ac;
    const output = ac.createGain();
    const fade = new GainRamp(output.gain, 0);
    output.connect(this.out);
    const sources: AudioScheduledSourceNode[] = [];
    const nodes: AudioNode[] = [output];
    const airSource = ac.createBufferSource();
    this.noise ??= makeWind(ac);
    airSource.buffer = this.noise;
    airSource.loop = true;
    sources.push(airSource);

    for (const [low, high, volume, speed, depth] of air) {
      const hp = ac.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = low;
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = high;
      const airGain = ac.createGain();
      airGain.gain.value = volume;
      airSource.connect(hp).connect(lp).connect(airGain).connect(output);
      const drift = ac.createOscillator();
      drift.frequency.value = speed;
      const amount = ac.createGain();
      amount.gain.value = volume * depth;
      drift.connect(amount).connect(airGain.gain);
      sources.push(drift);
      nodes.push(hp, lp, airGain, amount);
    }
    for (const [frequency, volume] of hum) {
      const tone = ac.createOscillator();
      tone.frequency.value = frequency;
      const gain = ac.createGain();
      gain.gain.value = volume;
      tone.connect(gain).connect(output);
      sources.push(tone);
      nodes.push(gain);
    }
    if (accents) {
      const source = ac.createBufferSource();
      let loop = this.accentLoops.get(bed);
      if (!loop) {
        loop = makeAccents(ac, accents);
        this.accentLoops.set(bed, loop);
      }
      source.buffer = loop;
      source.loop = true;
      source.connect(output);
      sources.push(source);
    }
    const start = ac.currentTime;
    for (const source of sources) source.start(start);
    airSource.onended = () => {
      for (const node of nodes) node.disconnect();
      for (const source of sources) source.disconnect();
    };
    return { fade, sources };
  }
}

function makeWind(ac: BaseAudioContext): AudioBuffer {
  const rate = ac.sampleRate;
  const wind = ac.createBuffer(1, Math.round(rate * 17.3), rate);
  const samples = wind.getChannelData(0);
  let state = 12857;
  for (let i = 0; i < samples.length; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    samples[i] = state / 2 ** 31 - 1;
  }
  // Match the boundary samples. The live filters carry their state across the seam.
  samples[samples.length - 1] = samples[0]!;
  return wind;
}

function makeAccents(ac: BaseAudioContext, accents: readonly Accent[]): AudioBuffer {
  const rate = 8000;
  const loop = ac.createBuffer(1, rate * 47, rate);
  const samples = loop.getChannelData(0);
  for (const [at, duration, f0, f1, volume, grit = 0] of accents) {
    const offset = Math.round(at * rate);
    const count = Math.round(duration * rate);
    let phase = 0;
    for (let i = 0; i < count; i++) {
      const portion = i / count;
      phase += (f0 + (f1 - f0) * portion) * 2 * Math.PI / rate;
      const window = Math.sin(Math.PI * portion) ** 2;
      const overtones = Math.sin(phase * 2) * 0.16 + Math.sin(phase * 2.71) * grit;
      const index = offset + i;
      samples[index] = samples[index]! + (Math.sin(phase) + overtones) * volume * window;
    }
  }
  return loop;
}
