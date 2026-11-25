import type { Audio, SfxName, SpeakOptions, VoiceId } from '../contracts';
import { VoiceEngine } from './voice'; // v4 voices

type Wave = OscillatorType;

/** All SFX synthesized with WebAudio; no files. Silent until unlocked by a gesture. */
export class SynthAudio implements Audio {
  muted = false;
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private last = new Map<SfxName, number>();
  private voice: VoiceEngine | null = null; // v4 voices

  /** Create/resume the AudioContext. Must be called from a user gesture. */
  unlock(): void {
    try {
      if (!this.ac) {
        const Ctor: typeof AudioContext | undefined =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ac = new Ctor();
        const comp = this.ac.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 6;
        this.master = this.ac.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(comp);
        comp.connect(this.ac.destination);
        const len = Math.floor(this.ac.sampleRate * 1.5);
        this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ac.state === 'suspended') void this.ac.resume();
    } catch {
      this.ac = null;
    }
  }

  suspend(): void {
    if (this.ac && this.ac.state === 'running') void this.ac.suspend();
  }

  resume(): void {
    if (this.ac && this.ac.state === 'suspended') void this.ac.resume();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (m) this.hush(); // v4 voices
  }

  // ---- v4 voices: alien babble for lines of text (src/audio/voice.ts)
  speak(text: string, voice: VoiceId, opts?: SpeakOptions): void {
    const ac = this.ac;
    if (this.muted || !ac || !this.master || !this.noiseBuf || ac.state !== 'running') return;
    this.voice ??= new VoiceEngine(ac, this.master, this.noiseBuf);
    this.voice.speak(text, voice, opts);
  }

  hush(voice?: VoiceId): void {
    this.voice?.stop(voice);
  }

  sfx(name: SfxName, volume = 1): void {
    const ac = this.ac;
    if (this.muted || !ac || !this.master || ac.state !== 'running') return;
    const now = ac.currentTime;
    const prev = this.last.get(name) ?? -1;
    if (now - prev < 0.045) return; // de-dupe same-frame spam
    this.last.set(name, now);
    const v = Math.max(0, Math.min(1.5, volume));
    const t = now + 0.005;
    switch (name) {
      case 'click':
        this.tone('square', 880, 660, t, 0.05, 0.12 * v);
        break;
      case 'beam_on':
        this.tone('sine', 280, 920, t, 0.32, 0.3 * v, 7, 18);
        this.tone('triangle', 140, 460, t, 0.32, 0.15 * v);
        break;
      case 'beam_off':
        this.tone('sine', 900, 240, t, 0.25, 0.25 * v, 7, 14);
        break;
      case 'bonk':
        this.tone('sine', 520, 120, t, 0.2, 0.55 * v);
        this.tone('triangle', 900, 300, t, 0.08, 0.25 * v);
        this.noise(t, 0.06, 0.35 * v, 'lowpass', 1200, 1);
        this.tone('sine', 300, 340, t + 0.05, 0.25, 0.12 * v, 18, 25); // boing tail
        break;
      case 'snore': {
        this.noise(t, 0.9, 0.35 * v, 'bandpass', 380, 2.5, 220, true);
        this.tone('sawtooth', 62, 55, t, 0.9, 0.09 * v, 0, 0, true, 300);
        break;
      }
      case 'mumble': {
        for (let i = 0; i < 4; i++) {
          const f = 170 + Math.random() * 90;
          this.tone('sawtooth', f, f * 0.9, t + i * 0.11, 0.09, 0.12 * v, 0, 0, false, 900);
        }
        break;
      }
      case 'wake':
        this.tone('square', 220, 620, t, 0.18, 0.18 * v, 0, 0, false, 2200);
        this.tone('square', 640, 820, t + 0.18, 0.14, 0.16 * v, 0, 0, false, 2200);
        break;
      case 'yowl':
        this.tone('sawtooth', 520, 1150, t, 0.25, 0.22 * v, 9, 30, false, 2600);
        this.tone('sawtooth', 1150, 620, t + 0.25, 0.45, 0.22 * v, 9, 40, false, 2600);
        break;
      case 'bark':
        for (let i = 0; i < 2; i++) {
          const s = t + i * 0.17;
          this.tone('sawtooth', 360, 190, s, 0.11, 0.3 * v, 0, 0, false, 1400);
          this.noise(s, 0.07, 0.25 * v, 'bandpass', 900, 1.5);
        }
        break;
      case 'spotted':
        this.tone('square', 196, 196, t, 0.18, 0.2 * v, 0, 0, false, 1800);
        this.tone('square', 185, 185, t + 0.22, 0.18, 0.2 * v, 0, 0, false, 1800);
        this.tone('sawtooth', 600, 1300, t + 0.45, 0.5, 0.15 * v, 6, 40, false, 3000);
        break;
      case 'lock_on':
        this.tone('sine', 660, 660, t, 0.09, 0.25 * v);
        this.tone('sine', 880, 880, t + 0.09, 0.09, 0.25 * v);
        this.tone('sine', 1320, 1320, t + 0.18, 0.22, 0.25 * v, 6, 10);
        break;
      case 'success': {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => this.tone('triangle', f, f, t + i * 0.09, i === 3 ? 0.45 : 0.14, 0.25 * v));
        break;
      }
      case 'fail': {
        const notes = [392, 370, 349, 330];
        notes.forEach((f, i) =>
          this.tone('sawtooth', f, i === 3 ? f * 0.94 : f, t + i * 0.28, i === 3 ? 0.7 : 0.25, 0.14 * v, i === 3 ? 6 : 0, 8, false, 1100),
        );
        break;
      }
      case 'stamp':
        this.noise(t, 0.12, 0.6 * v, 'lowpass', 320, 1);
        this.tone('sine', 110, 45, t, 0.18, 0.6 * v);
        break;
      case 'alert': {
        // the fuse tick: `volume` doubles as intensity, so it rises in pitch as the meter fills
        const k = Math.min(1, Math.max(0, (volume - 0.4) / 0.8));
        const f = 620 + k * 760;
        this.tone('triangle', f, f * 1.3, t, 0.07, (0.1 + k * 0.08) * Math.min(1, v));
        break;
      }
      // ---- v2
      case 'laser':
        this.tone('sawtooth', 1800, 600, t, 0.12, 0.12 * v, 0, 0, false, 4000);
        this.tone('square', 2400, 2200, t, 0.05, 0.05 * v);
        break;
      case 'alarm':
        for (let i = 0; i < 4; i++) {
          const s = t + i * 0.16;
          this.tone('square', i % 2 === 0 ? 880 : 660, i % 2 === 0 ? 880 : 660, s, 0.14, 0.14 * v, 0, 0, false, 2600);
        }
        break;
      case 'crash':
        this.noise(t, 0.45, 0.6 * v, 'highpass', 1800, 0.7, 5000);
        this.noise(t, 0.18, 0.4 * v, 'bandpass', 3200, 2);
        for (let i = 0; i < 5; i++) {
          const f = 2200 + Math.random() * 2400;
          this.tone('triangle', f, f * 0.96, t + 0.03 + i * 0.05, 0.12, 0.06 * v);
        }
        break;
      case 'creak':
        this.tone('sawtooth', 140, 230, t, 0.32, 0.12 * v, 11, 18, true, 900);
        this.noise(t, 0.3, 0.06 * v, 'bandpass', 600, 6);
        break;
      case 'scream':
        this.tone('sawtooth', 620, 1350, t, 0.25, 0.22 * v, 7, 50, false, 3200);
        this.tone('sawtooth', 1350, 1150, t + 0.25, 0.55, 0.2 * v, 9, 60, false, 3200);
        this.tone('square', 310, 675, t, 0.8, 0.05 * v, 7, 30, false, 1500);
        break;
      case 'siren':
        // two-tone "wee-woo"
        this.tone('square', 700, 700, t, 0.3, 0.1 * v, 0, 0, false, 1800);
        this.tone('square', 520, 520, t + 0.3, 0.3, 0.1 * v, 0, 0, false, 1800);
        this.tone('sine', 700, 700, t, 0.3, 0.08 * v);
        this.tone('sine', 520, 520, t + 0.3, 0.3, 0.08 * v);
        break;
      case 'pickup':
        // a quick rising slurp and a bright blip: something small just joined the trip
        this.tone('sine', 360, 1300, t, 0.14, 0.26 * v);
        this.tone('triangle', 1250, 1680, t + 0.11, 0.12, 0.16 * v);
        break;
      case 'monolith_hum':
        this.tone('triangle', 147, 147, t, 0.8, 0.19 * v);
        this.tone('sine', 220, 220, t + 0.12, 0.72, 0.14 * v);
        this.tone('sine', 294, 291, t + 0.24, 0.58, 0.1 * v);
        break;
      case 'lullaby': {
        const notes = [784, 659, 698, 587, 659, 523];
        notes.forEach((f, i) => this.tone('sine', f, f, t + i * 0.22, 0.4, 0.13 * v, 5, 4, true));
        break;
      }
      case 'checkpoint': {
        const notes = [523, 784, 1047];
        notes.forEach((f, i) => this.tone('triangle', f, f, t + i * 0.08, i === 2 ? 0.3 : 0.1, 0.2 * v));
        break;
      }
      case 'sunrise': {
        // a slightly ominous rooster-ish fanfare: rising, then a sour last note
        const notes = [392, 494, 587, 554];
        notes.forEach((f, i) => this.tone('sawtooth', f, i === 3 ? f * 0.97 : f, t + i * 0.18, i === 3 ? 0.6 : 0.16, 0.12 * v, i === 3 ? 6 : 0, 10, false, 2200));
        break;
      }
    }
  }

  private tone(
    type: Wave,
    f0: number,
    f1: number,
    t: number,
    dur: number,
    vol: number,
    vibHz = 0,
    vibDepth = 0,
    swell = false,
    lowpass = 0,
  ): void {
    const ac = this.ac!;
    const osc = ac.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const gn = ac.createGain();
    if (swell) {
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(vol, t + dur * 0.55);
    } else {
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    }
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = osc;
    if (lowpass > 0) {
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lowpass;
      osc.connect(f);
      node = f;
    }
    node.connect(gn);
    gn.connect(this.master!);
    let lfo: OscillatorNode | null = null;
    if (vibHz > 0) {
      lfo = ac.createOscillator();
      lfo.frequency.value = vibHz;
      const lg = ac.createGain();
      lg.gain.value = vibDepth;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.02);
    }
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(
    t: number,
    dur: number,
    vol: number,
    filter: BiquadFilterType,
    freq: number,
    q: number,
    freqEnd = 0,
    swell = false,
  ): void {
    const ac = this.ac!;
    if (!this.noiseBuf) return;
    const src = ac.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (freqEnd > 0) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    f.Q.value = q;
    const gn = ac.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vol, t + (swell ? dur * 0.5 : 0.005));
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(gn);
    gn.connect(this.master!);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }
}
