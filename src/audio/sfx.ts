import type { Audio, SfxName, SpeakOptions, VoiceId } from '../contracts';
import { GainRamp } from './gain-ramp';
import { SoundVoices } from './sfx-voices';
import { VoiceEngine } from './voice';
const MASTER_LEVEL = 0.55;
/** Recorded cues in public/sound/ (credits there). Until a file has loaded, or if it fails, the synth plays. */
const SAMPLES: Partial<Record<SfxName, { file: string; gain: number }>> = {
  snore: { file: 'snore.mp3', gain: 1.1 },
};

/** SFX synthesized with WebAudio, plus the few recorded cues in SAMPLES. Silent until unlocked by a gesture. */
export class SynthAudio implements Audio {
  private muted = false;
  private hidden = false;
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private masterFade: GainRamp | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private voices: SoundVoices | null = null;
  private last = new Map<SfxName, number>();
  private voice: VoiceEngine | null = null; // v4 voices
  private readonly samples = new Map<SfxName, AudioBuffer>();

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
        this.masterFade = new GainRamp(this.master.gain, this.muted ? 0 : MASTER_LEVEL);
        this.master.connect(comp);
        comp.connect(this.ac.destination);
        const len = Math.floor(this.ac.sampleRate * 1.5);
        this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        d[len - 1] = d[0]!;
        this.voices = new SoundVoices(this.ac, this.master, this.noiseBuf);
        this.loadSamples(this.ac);
      }
      if (!this.hidden) this.startAudio();
    } catch {
      this.ac = null;
    }
  }

  suspend(): void {
    this.hidden = true;
    this.hush();
    if (this.ac) void this.ac.suspend().catch(() => {});
  }

  resume(): void {
    this.hidden = false;
    this.startAudio();
  }

  private startAudio(): void {
    const ac = this.ac;
    if (ac && ac.state !== 'running') void ac.resume().catch(() => {});
  }

  private loadSamples(ac: AudioContext): void {
    if (typeof fetch !== 'function') return;
    for (const [name, sample] of Object.entries(SAMPLES) as [SfxName, { file: string }][]) {
      fetch(import.meta.env.BASE_URL + 'sound/' + sample.file)
        .then(res => res.ok ? res.arrayBuffer() : Promise.reject(new Error(String(res.status))))
        .then(bytes => ac.decodeAudioData(bytes))
        .then(buffer => { this.samples.set(name, buffer); })
        .catch(() => {});
    }
  }

  private playSample(ac: AudioContext, buffer: AudioBuffer, at: number, gain: number): void {
    if (!this.master) return;
    const source = ac.createBufferSource();
    source.buffer = buffer;
    const level = ac.createGain();
    level.gain.value = gain;
    source.connect(level).connect(this.master);
    source.onended = () => level.disconnect();
    source.start(at);
  }

  setMuted(m: boolean): void {
    if (this.muted === m) return;
    this.muted = m;
    if (this.ac) this.masterFade?.fadeTo(m ? 0 : MASTER_LEVEL, this.ac.currentTime, 0.04);
    if (m) this.hush();
  }

  // ---- v4 voices: alien babble for lines of text (src/audio/voice.ts)
  speak(text: string, voice: VoiceId, opts?: SpeakOptions): void {
    const ac = this.ac;
    if (this.muted || this.hidden || !ac || !this.master || !this.noiseBuf || ac.state !== 'running') return;
    this.voice ??= new VoiceEngine(ac, this.master, this.noiseBuf);
    this.voice.speak(text, voice, opts);
  }

  hush(voice?: VoiceId): void {
    this.voice?.stop(voice);
  }

  sfx(name: SfxName, volume = 1): void {
    const { ac, voices } = this;
    if (this.muted || this.hidden || !ac || !voices || ac.state !== 'running') return;
    const v = Math.max(0, Math.min(1.5, volume));
    if (v === 0) return;
    const now = ac.currentTime;
    const prev = this.last.get(name) ?? -1;
    if (now - prev < 0.045) return; // de-dupe same-frame spam
    this.last.set(name, now);
    const t = now + 0.005;
    const sample = this.samples.get(name);
    if (sample) {
      this.playSample(ac, sample, t, v * (SAMPLES[name]?.gain ?? 1));
      return;
    }
    switch (name) {
      // A soft low "vwoom", not a siren: narrow sweep, slow shallow wobble (2026-11-26).
      case 'beam_on':
        voices.tone('sine', 150, 260, t, 0.32, 0.11 * v, BEAM_RISE);
        voices.tone('sine', 300, 520, t + 0.06, 0.26, 0.025 * v, BEAM_RISE);
        break;
      case 'beam_off':
        voices.tone('sine', 255, 140, t, 0.28, 0.09 * v, BEAM_FALL);
        voices.tone('sine', 510, 280, t, 0.18, 0.02 * v, BEAM_FALL);
        break;
      case 'bonk':
        voices.tone('sine', 230, 88, t, 0.083, 0.3 * v);
        voices.noise('lowpass', 770, t, 0.048, 0.22 * v);
        voices.tone('triangle', 330, 247, t + 0.025, 0.14, 0.23 * v, SPRING);
        break;
      case 'clop':
        voices.tone('triangle', 480, 196, t, 0.065, 0.18 * v, WOOD);
        voices.tone('triangle', 320, 133, t + 0.077, 0.074, 0.24 * v, WOOD);
        voices.noise('bandpass', 995, t + 0.077, 0.048, 0.16 * v);
        break;
      case 'moo':
        voices.tone('triangle', 154, 105, t, 0.55, 0.135 * v, MOO);
        voices.tone('sine', 462, 315, t + 0.055, 0.46, 0.07 * v, MOO_FORMANT);
        voices.tone('sine', 770, 525, t + 0.11, 0.34, 0.038 * v, MOO_FORMANT);
        break;
      // A soft, slow cartoon snore: a low muffled breath in and a gentle sigh out, no rasp or whistle (2026-11-26).
      case 'snore':
        voices.noise('lowpass', 420, t, 0.55, 0.26 * v, SNORE_IN);
        voices.tone('sine', 92, 78, t + 0.05, 0.5, 0.09 * v, SNORE_HUM);
        voices.noise('lowpass', 520, t + 0.55, 0.5, 0.13 * v, BREATH_OUT);
        break;
      case 'mumble':
        voices.tone('triangle', 163, 193, t, 0.10, 0.16 * v, MURMUR);
        voices.tone('triangle', 192, 142, t + 0.093, 0.12, 0.19 * v, MURMUR);
        voices.tone('triangle', 148, 113, t + 0.205, 0.13, 0.17 * v, MURMUR);
        voices.tone('sine', 560, 432, t + 0.095, 0.14, 0.08 * v, SWELL);
        break;
      case 'wake':
        voices.noise('bandpass', 760, t, 0.075, 0.32 * v, GASP);
        voices.tone('triangle', 180, 460, t, 0.13, 0.25 * v, RASP);
        voices.tone('sine', 653, 510, t + 0.09, 0.16, 0.16 * v, SHIVER);
        break;
      case 'yowl':
        voices.tone('triangle', 365, 592, t, 0.17, 0.105 * v, MEOW_UP);
        voices.tone('triangle', 585, 268, t + 0.12, 0.36, 0.158 * v, MEOW_DOWN);
        voices.tone('sine', 1170, 536, t + 0.12, 0.28, 0.059 * v, SWELL);
        break;
      case 'bark':
        voices.tone('triangle', 318, 176, t, 0.10, 0.21 * v, WOOD);
        voices.noise('bandpass', 835, t, 0.086, 0.29 * v, WOOF);
        voices.tone('triangle', 272, 141, t + 0.128, 0.11, 0.20 * v, WOOD);
        voices.noise('bandpass', 740, t + 0.128, 0.074, 0.24 * v, WOOF);
        break;
      case 'spotted':
        voices.tone('triangle', 510, 455, t, 0.14, 0.14 * v, MUTED_BRASS);
        voices.tone('sine', 1030, 910, t, 0.105, 0.048 * v);
        voices.tone('triangle', 378, 245, t + 0.14, 0.31, 0.17 * v, WAH);
        voices.tone('sine', 756, 490, t + 0.14, 0.23, 0.055 * v, SWELL);
        break;
      case 'lock_progress': {
        const f = 370 + 310 * v;
        // the lock fraction sets the pitch and swells the level a little toward the lock
        voices.tone('sine', f, f * 1.10, t, 0.10, 0.155 * (0.75 + 0.25 * Math.min(1, v)), SWELL);
        break;
      }
      case 'porch_light':
        voices.tone('triangle', 228, 319, t, 0.23, 0.14 * v, LAMP);
        voices.noise('bandpass', 520, t + 0.02, 0.18, 0.20 * v, BREATH_OUT);
        break;
      case 'camera_focus':
        voices.tone('sine', 488, 398, t, 0.093, 0.145 * v);
        voices.tone('sine', 520, 592, t + 0.082, 0.109, 0.165 * v);
        break;
      case 'clock_tick':
        voices.tone('sine', 640, 470, t, 0.063, 0.36 * v);
        voices.noise('lowpass', 1120, t, 0.039, 0.21 * v);
        break;
      case 'clapper':
        voices.tone('triangle', 325, 316, t, 0.29, 0.28 * v, MUTED_BRASS);
        voices.tone('sine', 490, 485, t + 0.006, 0.21, 0.16 * v);
        voices.noise('lowpass', 1280, t, 0.043, 0.23 * v);
        break;
      case 'lock_on':
        voices.notes(LOCK, t, 0.073, 0.14, 0.14, 0.19 * v);
        for (let i = 0; i < LOCK.length; i++) {
          const f = LOCK[i]!;
          const at = t + i * 0.073;
          voices.tone('sine', f * 2, f * 2, at, 0.055, 0.045 * v);
        }
        break;
      case 'success':
        for (let i = 0; i < SUCCESS.length; i++) {
          const f = SUCCESS[i]!;
          const at = t + i * 0.082;
          voices.tone('sine', f, f, at, i === SUCCESS.length - 1 ? 0.30 : 0.15, 0.164 * v);
          voices.tone('sine', f * 2.76, f * 2.76, at, 0.051, 0.077 * v);
        }
        break;
      case 'fail':
        voices.tone('triangle', 395, 352, t, 0.21, 0.135 * v, MUTED_BRASS);
        voices.tone('sine', 1185, 1056, t, 0.11, 0.046 * v);
        voices.tone('triangle', 351, 263, t + 0.19, 0.31, 0.155 * v, WAH);
        voices.tone('sine', 1053, 789, t + 0.19, 0.26, 0.063 * v, SWELL);
        voices.tone('triangle', 260, 145, t + 0.46, 0.38, 0.147 * v, WAH);
        voices.tone('sine', 780, 435, t + 0.46, 0.31, 0.046 * v, SWELL);
        break;
      case 'stamp':
        voices.tone('sine', 208, 94, t, 0.09, 0.34 * v);
        voices.noise('lowpass', 840, t, 0.065, 0.32 * v);
        voices.noise('bandpass', 480, t + 0.042, 0.10, 0.49 * v, STAMP_PUFF);
        break;
      case 'alert': {
        // Flight passes 0.4–1.2 and room exposure passes 0.25–0.8.
        const urgency = Math.min(1, Math.max(0, (v - 0.25) / 0.95));
        const f = 405 + 470 * urgency;
        const gain = (0.065 + 0.30 * urgency) * Math.min(1, v / 0.25);
        voices.tone('sine', f, f * 1.14, t, 0.065, gain, SWELL);
        break;
      }
      case 'laser':
        voices.tone('sine', 1170, 340, t, 0.107, 0.32 * v, LASER);
        voices.noise('bandpass', 1390, t, 0.071, 0.40 * v, LASER_AIR);
        break;
      case 'alarm':
        for (let i = 0; i < 3; i++) {
          const f = i === 1 ? 313 : 420;
          const at = t + i * 0.114;
          voices.tone('triangle', f, f * 0.58, at, 0.101, 0.24 * v, MUTED_BRASS);
          voices.tone('sine', f * 2.1, f * 1.5, at, 0.072, 0.065 * v);
        }
        break;
      case 'crash':
        voices.noise('lowpass', 1470, t, 0.14, 0.40 * v, CLATTER);
        for (let i = 0; i < CLATTER_NOTES.length; i++) {
          const f = CLATTER_NOTES[i]!;
          const at = t + CLATTER_TIMES[i]!;
          voices.tone('triangle', f, f * 0.82, at, 0.092, 0.18 * v, WOOD);
          voices.tone('sine', f * 2.4, f * 2.2, at, 0.062, 0.09 * v);
        }
        break;
      case 'creak':
        voices.noise('bandpass', 750, t, 0.27, 0.37 * v, CREAK_GRAIN);
        voices.tone('triangle', 148, 384, t, 0.19, 0.18 * v, CREAK_STICK);
        voices.tone('triangle', 350, 147, t + 0.15, 0.21, 0.16 * v, CREAK_STICK);
        break;
      case 'scream':
        voices.tone('triangle', 502, 817, t, 0.11, 0.21 * v, EEK);
        voices.tone('triangle', 816, 645, t + 0.072, 0.20, 0.25 * v, EEK);
        voices.noise('bandpass', 1170, t + 0.046, 0.13, 0.19 * v, GASP);
        break;
      case 'siren':
        voices.tone('triangle', 393, 625, t, 0.18, 0.13 * v, SIREN);
        voices.tone('triangle', 625, 370, t + 0.13, 0.20, 0.15 * v, SIREN);
        voices.tone('triangle', 366, 553, t + 0.30, 0.18, 0.12 * v, SIREN);
        break;
      case 'pickup':
        voices.tone('sine', 345, 830, t, 0.14, 0.24 * v, SWELL);
        voices.tone('sine', 758, 1109, t + 0.089, 0.10, 0.095 * v);
        break;
      case 'monolith_hum':
        voices.tone('triangle', 147, 146, t, 0.84, 0.102 * v, CHOIR_LOW);
        voices.tone('triangle', 222, 220, t + 0.045, 0.77, 0.084 * v, CHOIR_HIGH);
        voices.tone('sine', 444, 440, t + 0.09, 0.70, 0.057 * v, CHOIR_HIGH);
        voices.tone('sine', 733, 730, t + 0.12, 0.64, 0.03 * v, SWELL);
        break;
      case 'lullaby':
        for (let i = 0; i < LULLABY.length; i++) {
          const f = LULLABY[i]!;
          const at = t + i * 0.16;
          voices.tone('sine', f, f, at, 0.34, 0.14 * v);
          voices.tone('sine', f * 2.01, f * 2.01, at, 0.13, 0.039 * v);
        }
        break;
      case 'checkpoint':
        voices.tone('sine', 587, 587, t, 0.31, 0.17 * v);
        voices.tone('sine', 880, 880, t + 0.076, 0.40, 0.18 * v);
        voices.tone('sine', 1762, 1758, t + 0.076, 0.19, 0.075 * v);
        break;
      case 'sunrise':
        voices.tone('triangle', 299, 391, t, 0.13, 0.125 * v, ROOSTER);
        voices.tone('triangle', 401, 367, t + 0.12, 0.10, 0.11 * v, ROOSTER);
        voices.tone('triangle', 524, 352, t + 0.24, 0.40, 0.157 * v, ROOSTER);
        voices.tone('sine', 1082, 724, t + 0.24, 0.33, 0.054 * v, SWELL);
        break;
      default: {
        const unhandled: never = name;
        return unhandled;
      }
    }
  }
}

const LOCK = [494, 659, 784];
const SUCCESS = [392, 494, 587, 784, 988];
const LULLABY = [659, 784, 659, 587, 523, 392, 523];
const CLATTER_NOTES = [350, 590, 468, 261, 198];
const CLATTER_TIMES = [0, 0.05, 0.105, 0.165, 0.24];

const SWELL = { swell: true };
const BEAM_RISE = { vibrato: 5, depth: 6, swell: true, cutoff: 900 };
const BEAM_FALL = { vibrato: 5, depth: 5, swell: true, cutoff: 800 };
const SPRING = { vibrato: 23, depth: 54, cutoff: 1050 };
const WOOD = { cutoff: 960 };
const MOO = { vibrato: 5, depth: 7, swell: true, cutoff: 660 };
const MOO_FORMANT = { vibrato: 5, depth: 17, swell: true };
const SNORE_IN = { q: 0.8, end: 300, swell: true };
const SNORE_HUM = { vibrato: 12, depth: 4, swell: true, cutoff: 360 };
const RASP = { vibrato: 24, depth: 14, cutoff: 870 };
const BREATH_OUT = { q: 1.5, end: 360, swell: true };
const MURMUR = { vibrato: 19, depth: 8, cutoff: 680 };
const GASP = { q: 1.4, end: 540 };
const SHIVER = { vibrato: 15, depth: 45 };
const MEOW_UP = { vibrato: 8, depth: 16, cutoff: 1300 };
const MEOW_DOWN = { vibrato: 7, depth: 22, cutoff: 1350, swell: true };
const WOOF = { q: 1.0, end: 455 };
const MUTED_BRASS = { cutoff: 1160 };
const WAH = { cutoff: 920, vibrato: 7, depth: 26, swell: true };
const LAMP = { cutoff: 860, swell: true };
const STAMP_PUFF = { q: 1.1, end: 380, swell: true };
const LASER = { vibrato: 16, depth: 22 };
const LASER_AIR = { q: 1.4, end: 520 };
const CLATTER = { end: 690 };
const CREAK_GRAIN = { q: 2.3, end: 410, swell: true };
const CREAK_STICK = { vibrato: 24, depth: 27, swell: true, cutoff: 1090 };
const EEK = { vibrato: 11, depth: 22, cutoff: 1540 };
const SIREN = { swell: true, cutoff: 880 };
const CHOIR_LOW = { vibrato: 4.3, depth: 2.5, cutoff: 1200, swell: true };
const CHOIR_HIGH = { vibrato: 5.1, depth: 4.5, cutoff: 1360, swell: true };
const ROOSTER = { vibrato: 11, depth: 22, cutoff: 1220, swell: true };
