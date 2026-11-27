// The alien babble, part 2: plays a `SpeechPlan` (voice-plan.ts) through WebAudio. A buzz
// (sawtooth + sub-octave fry), ring-modulated, runs through three formant band-passes into a VCA;
// a noise loop makes the pops, clicks and hisses. One small graph per line, every syllable is
// AudioParam automation (no nodes per syllable, nothing per frame). At most MAX_LINES at once.
import type { SpeakOptions, VoiceId } from '../contracts';
import { GainRamp } from './gain-ramp';
import { VOICES, VOWELS, planSpeech, type SpeechPlan, type VoiceProfile } from './voice-plan';

/** Lines that may babble at once; the oldest stops when a new one would go over. */
const MAX_LINES = 2;
/** Overall voice level into the master bus: under the SFX, it plays for every line. */
const LEVEL = 0.5;
const PLAY_LEAD = 0.02;
const STOP_FADE = 0.014;
const Q = [7, 10, 13] as const;
const FORMANT_GAIN = [1, 0.62, 0.3] as const;

interface Line {
  voice: VoiceId;
  fade: GainRamp;
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  end: number;
  done: boolean;
}

export class VoiceEngine {
  private readonly lines: Line[] = [];
  private paCurve: Float32Array<ArrayBuffer> | null = null;

  constructor(
    private readonly ac: BaseAudioContext,
    private readonly out: AudioNode,
    private readonly noise: AudioBuffer,
  ) {}

  /** Babble `text` in `voice`; replaces that voice's current line. */
  speak(text: string, voice: VoiceId, opts: SpeakOptions = {}): SpeechPlan | null {
    const within = voice === 'vrell' && opts.within !== undefined ? opts.within - PLAY_LEAD : opts.within;
    const plan = planSpeech(text, voice, { within, panic: opts.panic });
    if (plan.syllables.length === 0) return null;
    this.stop(voice);
    this.prune();
    while (this.lines.length >= MAX_LINES) this.kill(this.lines.shift()!);
    this.lines.push(this.play(plan, VOICES[voice], Math.max(0, Math.min(1.5, opts.volume ?? 1))));
    return plan;
  }

  /** Fade a voice (or every voice) out now. */
  stop(voice?: VoiceId): void {
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const l = this.lines[i]!;
      if (voice && l.voice !== voice) continue;
      this.kill(l);
      this.lines.splice(i, 1);
    }
  }

  private prune(): void {
    const now = this.ac.currentTime;
    for (let i = this.lines.length - 1; i >= 0; i--) if (this.lines[i]!.done || this.lines[i]!.end < now) this.lines.splice(i, 1);
  }

  private kill(l: Line): void {
    const now = this.ac.currentTime;
    if (l.done || l.end <= now) return;
    const at = Math.min(l.end, now + STOP_FADE);
    l.fade.fadeTo(0, now, at - now);
    for (const s of l.sources) {
      try {
        s.stop(at);
      } catch {
        // already stopped (a strict WebAudio rejects a second stop)
      }
    }
    l.end = at;
  }

  private play(plan: SpeechPlan, v: VoiceProfile, volume: number): Line {
    const ac = this.ac;
    const t0 = ac.currentTime + PLAY_LEAD;
    const finish = t0 + plan.duration;
    const end = plan.voice === 'vrell' ? finish : finish + 0.25;
    const sources: AudioScheduledSourceNode[] = [];
    const nodes: AudioNode[] = [];
    const keep = <T extends AudioNode>(n: T): T => {
      nodes.push(n);
      return n;
    };

    // pitch: one constant source drives the buzz, the sub-octave and the ring carrier
    const pitch = keep(ac.createConstantSource());
    pitch.offset.value = v.pitch;
    sources.push(pitch);
    const buzz = keep(ac.createOscillator());
    buzz.type = 'sawtooth';
    buzz.frequency.value = 0;
    pitch.connect(buzz.frequency);
    sources.push(buzz);
    if (v.vibHz > 0) {
      const lfo = keep(ac.createOscillator());
      lfo.frequency.value = v.vibHz;
      const depth = keep(ac.createGain());
      depth.gain.value = v.pitch * v.vibDepth;
      lfo.connect(depth).connect(pitch.offset);
      sources.push(lfo);
    }

    // ring mod folded into one gain: gain = (1 - ring) + ring * carrier
    const pre = keep(ac.createGain());
    pre.gain.value = 1 - v.ring;
    buzz.connect(pre);
    if (v.ring > 0) {
      const car = keep(ac.createOscillator());
      car.type = 'sine';
      if (v.ringRatio > 0) {
        car.frequency.value = 0;
        const ratio = keep(ac.createGain());
        ratio.gain.value = v.ringRatio;
        pitch.connect(ratio).connect(car.frequency);
      } else car.frequency.value = v.ringHz;
      const amt = keep(ac.createGain());
      amt.gain.value = v.ring;
      car.connect(amt).connect(pre.gain);
      sources.push(car);
    }

    // throat fry: a square an octave down, mixed in before the formants
    let fry: GainNode | null = null;
    if (v.fry > 0 || v.gurgle > 0) {
      const sub = keep(ac.createOscillator());
      sub.type = 'square';
      sub.frequency.value = 0;
      const half = keep(ac.createGain());
      half.gain.value = 0.5;
      pitch.connect(half).connect(sub.frequency);
      fry = keep(ac.createGain());
      fry.gain.value = v.fry;
      sub.connect(fry).connect(pre);
      sources.push(sub);
    }

    // formants -> VCA
    const vca = keep(ac.createGain());
    vca.gain.value = 0;
    const formants: BiquadFilterNode[] = [];
    for (let i = 0; i < 3; i++) {
      const bp = keep(ac.createBiquadFilter());
      bp.type = 'bandpass';
      bp.Q.value = Q[i]!;
      bp.frequency.value = VOWELS[0]![i]! * v.formant;
      const g = keep(ac.createGain());
      g.gain.value = FORMANT_GAIN[i]! * (i === 0 ? 2.2 : 3.2);
      pre.connect(bp).connect(g).connect(vca);
      formants.push(bp);
    }

    // consonants: a looping noise through a band-pass, its own VCA
    const hiss = keep(ac.createBufferSource());
    hiss.buffer = this.noise;
    hiss.loop = true;
    const hbp = keep(ac.createBiquadFilter());
    hbp.type = 'bandpass';
    hbp.Q.value = 1.6;
    const hvca = keep(ac.createGain());
    hvca.gain.value = 0;
    hiss.connect(hbp).connect(hvca);
    sources.push(hiss);

    // Vrell's rubber stamp: the same noise through a fixed low-pass, its own VCA
    let thump: GainNode | null = null;
    if (v.beat > 0) {
      const lpf = keep(ac.createBiquadFilter());
      lpf.type = 'lowpass';
      lpf.frequency.value = 220;
      thump = keep(ac.createGain());
      thump.gain.value = 0;
      hiss.connect(lpf).connect(thump);
    }

    // output band (and the PA horn)
    const hp = keep(ac.createBiquadFilter());
    hp.type = 'highpass';
    hp.frequency.value = v.lo;
    const lp = keep(ac.createBiquadFilter());
    lp.type = 'lowpass';
    lp.frequency.value = v.hi;
    vca.connect(hp);
    hvca.connect(hp);
    thump?.connect(hp);
    hp.connect(lp);
    const out = keep(ac.createGain());
    const fade = new GainRamp(out.gain, LEVEL * v.gain * volume);
    if (plan.voice === 'vrell') fade.fadeTo(0, finish - 0.025, 0.025);
    if (v.pa) {
      const shaper = keep(ac.createWaveShaper());
      shaper.curve = this.paCurve ??= softClip();
      lp.connect(shaper).connect(out);
      const echo = keep(ac.createDelay(0.3));
      echo.delayTime.value = 0.11;
      const fb = keep(ac.createGain());
      fb.gain.value = 0.28;
      shaper.connect(echo).connect(fb).connect(echo);
      fb.connect(out);
      this.chime(t0, out, keep, sources);
    } else lp.connect(out);
    out.connect(this.out);

    this.schedule(plan, v, t0, pitch.offset, formants, vca.gain, hbp.frequency, hvca.gain, fry?.gain ?? null, thump?.gain ?? null);

    for (const s of sources) {
      s.start(t0);
      s.stop(end);
    }
    const line: Line = { voice: plan.voice, fade, sources, nodes, end, done: false };
    buzz.onended = () => {
      line.done = true;
      for (const n of nodes) n.disconnect();
    };
    return line;
  }

  /** The Bureau's ding-dong before an announcement. */
  private chime(t0: number, out: AudioNode, keep: <T extends AudioNode>(n: T) => T, sources: AudioScheduledSourceNode[]): void {
    const notes = [784, 622];
    for (let i = 0; i < 2; i++) {
      const o = keep(this.ac.createOscillator());
      o.type = 'sine';
      o.frequency.value = notes[i]!;
      const g = keep(this.ac.createGain());
      const t = t0 + i * 0.24;
      g.gain.value = 0;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.32, t + 0.008);
      g.gain.setTargetAtTime(0, t + 0.02, 0.12);
      o.connect(g).connect(out);
      sources.push(o);
    }
  }

  private schedule(
    plan: SpeechPlan, v: VoiceProfile, t0: number,
    pitch: AudioParam, formants: BiquadFilterNode[], vca: AudioParam, band: AudioParam, hiss: AudioParam,
    fry: AudioParam | null, thump: AudioParam | null,
  ): void {
    const fs = v.formant;
    const noise = v.noise;
    for (const s of plan.syllables) {
      const T = t0 + s.t;
      const f = VOWELS[s.vowel]!;
      // pitch: a glide through the syllable
      pitch.setValueAtTime(s.f0, T);
      pitch.exponentialRampToValueAtTime(Math.max(30, s.f1), T + s.dur);
      // consonant
      let voiced = T;
      if (s.onset === 'stop' || s.onset === 'click') {
        const click = s.onset === 'click';
        band.setValueAtTime(s.hiss, T - 0.008); // retune before the hiss opens: no filter thump
        hiss.setValueAtTime(s.amp * noise * (click ? 0.9 : 0.55), T);
        hiss.setTargetAtTime(0, T + (click ? 0.002 : 0.006), click ? 0.003 : 0.008);
        voiced = T + (click ? 0.018 : 0.012);
      } else if (s.onset === 'fric') {
        band.setValueAtTime(s.hiss, T - 0.008);
        hiss.setTargetAtTime(s.amp * noise * 0.32, T, 0.01);
        hiss.setTargetAtTime(0, T + Math.min(0.045, s.dur * 0.45), 0.01);
        voiced = T + Math.min(0.035, s.dur * 0.4);
      }
      // vowel formants, with the onset's colour first
      const first = s.onset === 'nasal' ? [250, 1000, 2300] : s.onset === 'liquid' ? [f[0], f[1] * 0.6, f[2] * 0.85] : null;
      for (let i = 0; i < 3; i++) {
        const p = formants[i]!.frequency;
        if (first) {
          p.setTargetAtTime(first[i]! * fs, T, 0.006);
          p.setTargetAtTime(f[i]! * fs, T + 0.03, 0.018);
        } else p.setTargetAtTime(f[i]! * fs, T, 0.014);
      }
      if (s.warble) {
        formants[1]!.frequency.setTargetAtTime(f[1] * fs * 1.3, T + s.dur * 0.25, 0.02);
        formants[1]!.frequency.setTargetAtTime(f[1] * fs * 0.8, T + s.dur * 0.6, 0.02);
      }
      // the VCA
      const a = s.amp * (s.onset === 'nasal' ? 0.75 : 1);
      vca.setTargetAtTime(a, voiced, 0.006);
      if (s.onset === 'liquid' && (s.vowel & 1) === 1) {
        // an alien trill: a few fast dips
        for (let k = 1; k <= 3; k++) vca.setTargetAtTime(a * (k % 2 ? 0.35 : 1), voiced + k * 0.012, 0.003);
        vca.setTargetAtTime(a, voiced + 0.048, 0.006);
      }
      vca.setTargetAtTime(s.join ? a * 0.3 : 0, T + s.dur * (s.join ? 0.75 : 0.86), s.join ? 0.01 : 0.016);
      // gurgle and the phrase-end accent
      if (fry && s.gurgle) {
        fry.setTargetAtTime(Math.max(0.5, v.fry * 3), T, 0.01);
        fry.setTargetAtTime(v.fry, T + s.dur, 0.02);
      }
      if (s.accent && thump) {
        // Vrell's rubber stamp: a low thunk as the phrase lands
        const at = T + s.dur * 0.9;
        thump.setValueAtTime(2.4 * noise, at);
        thump.setTargetAtTime(0, at + 0.004, 0.022);
        if (fry) {
          fry.setTargetAtTime(Math.max(0.6, v.fry * 3), T + s.dur * 0.5, 0.015);
          fry.setTargetAtTime(v.fry, at + 0.03, 0.02);
        }
      }
    }
  }
}

/** A gentle tanh curve for the PA horn. */
function softClip(): Float32Array<ArrayBuffer> {
  const n = 1024;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(x * 2.2) / Math.tanh(2.2);
  }
  return c;
}
