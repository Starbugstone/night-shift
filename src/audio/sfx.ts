import type { AmbientBed, Audio, SfxName, SpeakOptions, VoiceId } from '../contracts';
import { AmbientMixer } from './ambient';
import { GainRamp } from './gain-ramp';
import { SoundVoices } from './sfx-voices';
import { VoiceEngine } from './voice';
const MASTER_LEVEL = 0.55;

/** All SFX synthesized with WebAudio; no files. Silent until unlocked by a gesture. */
export class SynthAudio implements Audio {
  private muted = false;
  private hidden = false;
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private masterFade: GainRamp | null = null;
  private mixer: AmbientMixer | null = null;
  private requestedBed: AmbientBed | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private voices: SoundVoices | null = null;
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
        this.masterFade = new GainRamp(this.master.gain, this.muted ? 0 : MASTER_LEVEL);
        this.master.connect(comp);
        comp.connect(this.ac.destination);
        this.mixer = new AmbientMixer(this.ac, this.master);
        const len = Math.floor(this.ac.sampleRate * 1.5);
        this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        d[len - 1] = d[0]!;
        this.voices = new SoundVoices(this.ac, this.master, this.noiseBuf);
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
    if (!ac) return;
    if (ac.state === 'running') this.syncAmbient();
    else void ac.resume().then(() => this.syncAmbient(), () => {});
  }

  ambient(bed: AmbientBed | null): void {
    this.requestedBed = bed;
    this.syncAmbient();
  }

  private syncAmbient(): void {
    if (!this.hidden && this.ac?.state === 'running') this.mixer?.select(this.muted ? null : this.requestedBed);
  }

  setMuted(m: boolean): void {
    if (this.muted === m) return;
    this.muted = m;
    if (this.ac) this.masterFade?.fadeTo(m ? 0 : MASTER_LEVEL, this.ac.currentTime, 0.04);
    if (m) this.hush();
    this.syncAmbient();
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
    switch (name) {
      case 'beam_on':
        voices.tone('sine', 225, 690, t, 0.32, 0.24 * v, { vibrato: 7, depth: 12 });
        voices.tone('triangle', 130, 345, t, 0.32, 0.12 * v);
        break;
      case 'beam_off':
        voices.tone('sine', 650, 190, t, 0.25, 0.2 * v, { vibrato: 7, depth: 9 });
        break;
      case 'bonk':
        voices.tone('sine', 510, 135, t, 0.21, 0.43 * v);
        voices.tone('triangle', 720, 265, t, 0.085, 0.16 * v);
        voices.noise('lowpass', 950, t, 0.065, 0.23 * v);
        voices.tone('sine', 275, 320, t + 0.055, 0.26, 0.12 * v, { vibrato: 17, depth: 28 });
        break;
      case 'clop':
        voices.tone('triangle', 530, 185, t, 0.075, 0.33 * v);
        voices.tone('triangle', 445, 154, t + 0.07, 0.09, 0.36 * v);
        break;
      case 'moo':
        voices.tone('triangle', 144, 88, t, 0.7, 0.23 * v, { vibrato: 4, depth: 5, swell: true, cutoff: 570 });
        voices.tone('sine', 288, 177, t + 0.02, 0.62, 0.13 * v, { swell: true });
        voices.noise('bandpass', 490, t + 0.08, 0.52, 0.11 * v, { q: 2.5, end: 265, swell: true });
        break;
      case 'snore':
        voices.noise('bandpass', 380, t, 0.9, 0.34 * v, { q: 2.5, end: 220, swell: true });
        voices.tone('triangle', 85, 62, t, 0.9, 0.095 * v, { swell: true, cutoff: 300 });
        voices.tone('sine', 155, 105, t + 0.19, 0.65, 0.048 * v, { swell: true, vibrato: 11, depth: 6 });
        break;
      case 'mumble':
        for (let i = 0; i < 4; i++) {
          const f = 145 + Math.random() * 72;
          voices.tone('triangle', f, f * 0.83, t + i * 0.11, 0.12, 0.11 * v, { cutoff: 780 });
        }
        break;
      case 'wake':
        voices.noise('bandpass', 790, t, 0.16, 0.23 * v, { q: 0.8, end: 360 });
        voices.tone('triangle', 235, 590, t, 0.18, 0.21 * v);
        voices.tone('sine', 610, 765, t + 0.145, 0.15, 0.16 * v);
        break;
      case 'yowl':
        voices.tone('triangle', 440, 895, t, 0.25, 0.23 * v, { vibrato: 9, depth: 26 });
        voices.tone('triangle', 895, 455, t + 0.21, 0.42, 0.21 * v, { vibrato: 9, depth: 36 });
        voices.tone('sine', 237, 458, t + 0.03, 0.35, 0.075 * v, { swell: true });
        break;
      case 'bark':
        for (let i = 0; i < 2; i++) {
          const at = t + i * 0.145;
          voices.tone('triangle', 322 - i * 43, 155, at, 0.095, 0.18 * v, { cutoff: 920 });
          voices.noise('bandpass', 765, at, 0.084, 0.25 * v, { q: 1.2, end: 530 });
        }
        break;
      case 'spotted':
        voices.tone('triangle', 280, 165, t, 0.16, 0.21 * v, { cutoff: 860 });
        voices.tone('triangle', 255, 142, t + 0.15, 0.16, 0.19 * v, { cutoff: 860 });
        voices.tone('sine', 465, 690, t + 0.27, 0.27, 0.13 * v, { vibrato: 8, depth: 24, swell: true });
        break;
      case 'lock_progress': {
        const f = 385 + 300 * v;
        voices.tone('sine', f, f * 1.18, t, 0.13, 0.089, { swell: true });
        break;
      }
      case 'porch_light':
        voices.tone('triangle', 232, 309, t, 0.22, 0.087, { swell: true, cutoff: 850 });
        voices.noise('bandpass', 450, t, 0.17, 0.11, { q: 1.1, swell: true });
        break;
      case 'camera_focus':
        voices.tone('sine', 535, 386, t, 0.15, 0.090);
        voices.tone('sine', 440, 575, t + 0.085, 0.14, 0.069);
        break;
      case 'clock_tick':
        voices.tone('sine', 640, 455, t, 0.085, 0.045);
        break;
      case 'clapper':
        voices.tone('triangle', 324, 315, t, 0.35, 0.100, { cutoff: 940 });
        voices.tone('sine', 487, 482, t + 0.007, 0.23, 0.039);
        break;
      case 'lock_on':
        voices.tone('sine', 494, 494, t, 0.14, 0.21 * v);
        voices.tone('sine', 659, 659, t + 0.09, 0.14, 0.21 * v);
        voices.tone('sine', 988, 988, t + 0.18, 0.26, 0.20 * v, { vibrato: 5, depth: 6 });
        break;
      case 'success':
        voices.notes(SUCCESS, t, 0.09, 0.16, 0.45, 0.23 * v);
        break;
      case 'fail':
        voices.notes(FAIL, t, 0.17, 0.22, 0.58, 0.18 * v, { bend: 0.92, vibrato: 6, depth: 8, cutoff: 1000 });
        break;
      case 'stamp':
        voices.noise('lowpass', 610, t, 0.13, 0.43 * v);
        voices.tone('sine', 138, 65, t, 0.17, 0.43 * v);
        break;
      case 'alert': {
        // Volume also encodes how far the fuse has filled.
        const intensity = Math.min(1, Math.max(0, (volume - 0.4) / 0.8));
        const f = 460 + intensity * 530;
        voices.tone('sine', f, f * 1.18, t, 0.064, (0.086 + intensity * 0.080) * Math.min(1, v));
        break;
      }
      case 'laser':
        voices.tone('triangle', 1120, 410, t, 0.10, 0.105 * v, { cutoff: 1250 });
        voices.noise('bandpass', 1320, t, 0.065, 0.13 * v, { q: 1.2, end: 610 });
        break;
      case 'alarm':
        for (let i = 0; i < 3; i++) {
          const from = i % 2 === 0 ? 620 : 478;
          voices.tone('triangle', from, from * 0.93, t + i * 0.125, 0.11, 0.14 * v, { cutoff: 1320 });
        }
        break;
      case 'crash':
        voices.noise('lowpass', 1750, t, 0.39, 0.64 * v, { q: 0.6, end: 540 });
        voices.noise('bandpass', 1460, t, 0.16, 0.34 * v, { q: 1.0, end: 800 });
        for (let i = 0; i < 4; i++) {
          const f = 1180 + Math.random() * 1300;
          voices.tone('sine', f, f * 0.93, t + 0.03 + i * 0.045, 0.12, 0.056 * v);
        }
        break;
      case 'creak':
        voices.tone('triangle', 147, 237, t, 0.32, 0.12 * v, { vibrato: 11, depth: 17, swell: true, cutoff: 850 });
        voices.noise('bandpass', 575, t, 0.3, 0.13 * v, { q: 4.6, swell: true });
        break;
      case 'scream':
        voices.tone('triangle', 530, 1020, t, 0.25, 0.21 * v, { vibrato: 7, depth: 40, cutoff: 2050 });
        voices.tone('triangle', 1020, 715, t + 0.19, 0.48, 0.19 * v, { vibrato: 9, depth: 51, cutoff: 2050 });
        voices.noise('bandpass', 870, t + 0.05, 0.38, 0.14 * v, { q: 2.2, swell: true });
        break;
      case 'siren':
        voices.tone('triangle', 470, 635, t, 0.24, 0.16 * v, { swell: true, cutoff: 1050 });
        voices.tone('triangle', 605, 425, t + 0.21, 0.25, 0.14 * v, { swell: true, cutoff: 1050 });
        break;
      case 'pickup':
        voices.tone('sine', 315, 955, t, 0.16, 0.24 * v);
        voices.tone('sine', 920, 1190, t + 0.11, 0.16, 0.17 * v);
        break;
      case 'monolith_hum':
        voices.tone('triangle', 147, 147, t, 0.8, 0.17 * v, { swell: true });
        voices.tone('sine', 220, 220, t + 0.12, 0.72, 0.13 * v, { swell: true });
        voices.tone('sine', 294, 291, t + 0.24, 0.58, 0.09 * v, { swell: true });
        break;
      case 'lullaby':
        for (let i = 0; i < LULLABY.length; i++) {
          const f = LULLABY[i]!;
          voices.tone('sine', f, f, t + i * 0.22, 0.4, 0.14 * v, { vibrato: 5, depth: 3, swell: true });
        }
        break;
      case 'checkpoint':
        voices.notes(CHECKPOINT, t, 0.08, 0.13, 0.36, 0.19 * v);
        break;
      case 'sunrise':
        voices.notes(SUNRISE, t, 0.15, 0.18, 0.52, 0.16 * v, { bend: 0.96, vibrato: 6, depth: 8, cutoff: 1340 });
        break;
      default: {
        const unhandled: never = name;
        return unhandled;
      }
    }
  }
}

const SUCCESS = [440, 554, 659, 880];
const FAIL = [392, 370, 349, 330];
const LULLABY = [784, 659, 698, 587, 659, 523];
const CHECKPOINT = [494, 740, 988];
const SUNRISE = [392, 494, 587, 554];
