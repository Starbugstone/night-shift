// The player's sound rules (2026-11-26: "I hate the clicking noise in the menus… I also hate that our
// little alien has sound when playing"; "all those ambiant sounds are awful"). Commits 07bc4ef and
// 863b6a7 took them out; this file keeps them out:
// 1. no UI click or tap sound: buttons never get the audio, menu screens play no sound on a tap;
// 2. Zib never speaks: no `speak(..., 'zib')` anywhere, and no voice at all during flight or abduction
//    play (only Vrell on the memo, report, abort and deep-choice screens);
// 3. no ambient bed: no `ambient` API, no looping background, silence between cues.
// tests/audio-scenes.test.ts already bans the old 'click' sfx and `audio.speak` in the play folders.
import { afterEach, describe, expect, it, vi } from 'vitest';
import contractsSource from '../src/contracts.ts?raw';
import { SynthAudio } from '../src/audio/sfx';
import type { AbductResult, GameContext, PointerState, RoomId } from '../src/contracts';
import { createAbductScene } from '../src/abduct';
import type { AbductSimulation } from '../src/abduct/simulation';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { FlightScene } from '../src/flight/scene';
import { isDeep, LEVELS, workOrderNumber } from '../src/levels/levels';
import { DeepRun } from '../src/levels/run';
import { Button } from '../src/ui/widgets';

const raw = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const files = Object.entries(raw).map(([p, text]) => ({ path: p.replace(/^\.\.\//, ''), text }));
const strip = (text: string): string => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

// ------------------------------------------------------------------ 1. no UI clicks

/** Screens outside play that may play a sound, and the only cues each may play (none is a tap). */
const SCREEN_SFX: Readonly<Record<string, readonly string[]>> = {
  // the purchase jingle when an upgrade is installed
  'src/ui/upgrades.ts': ['success'],
  // the report's stamps, star and outcome cues, timed by its reveal animation
  'src/ui/report.ts': ['stamp', 'fail', 'lock_on', 'success'],
  'src/ui/dispatch-finale.ts': ['stamp'],
  // the Field Check card's crash on a failed practice
  'src/ui/field-check.ts': ['crash'],
};
/** Button and HUD widgets: the audio never reaches them. */
const WIDGETS = ['src/ui/widgets.ts', 'src/ui/views/button.ts', 'src/ui/views/hud.ts', 'src/ui/hud.ts'];
const UI_NAME = /click|tap|press|button|blip|menu|hover|select|swipe|tick_ui|ui_/i;

function sfxNames(): string[] {
  const start = contractsSource.indexOf('export type SfxName =');
  const union = contractsSource.slice(start, contractsSource.indexOf(';\n', start));
  return [...strip(union).matchAll(/'(\w+)'/g)].map(m => m[1]!);
}

describe('no UI click or tap sounds', () => {
  it('keeps UI sounds out of the sound palette', () => {
    const names = sfxNames();
    expect(names.length).toBeGreaterThan(20);
    expect(names.filter(n => UI_NAME.test(n))).toEqual([]);
  });

  it('never hands the audio to a button', () => {
    expect(Button.prototype.update.length).toBeLessThanOrEqual(2);
    for (const path of WIDGETS) {
      const text = raw[`../${path}`];
      expect(text, path).toBeDefined();
      expect(strip(text!), path).not.toMatch(/\baudio\b|\.sfx\s*\(|\bAudio\b/);
    }
    // no update(pointer, dt, audio) call left anywhere
    for (const f of files) expect(strip(f.text), f.path).not.toMatch(/\.update\(\s*\w+\s*,\s*dt\s*,\s*[\w.]*audio\b/);
  });

  it('plays no sound on a pointer press', () => {
    const game = raw['../src/core/game.ts']!;
    const hook = /onAnyDown\(\s*\(\)\s*=>\s*([^\n]*)/.exec(game);
    expect(hook, 'the unlock hook in src/core/game.ts').not.toBeNull();
    expect(hook![1]).not.toMatch(/sfx|speak/);
    for (const path of ['src/core/input.ts', 'src/core/scenes.ts']) expect(strip(raw[`../${path}`]!), path).not.toMatch(/\.sfx\s*\(/);
  });

  it('plays only the listed cues on the screens outside play', () => {
    for (const f of files.filter(f => f.path.startsWith('src/ui/'))) {
      const calls = [...strip(f.text).matchAll(/\.sfx\s*\(\s*([^,)]*)/g)].map(m => m[1]!.trim());
      const allowed = SCREEN_SFX[f.path] ?? [];
      for (const call of calls) expect(allowed, `${f.path} plays ${call}`).toContain(call.replace(/^['"]|['"]$/g, ''));
    }
  });
});

// ------------------------------------------------------------------ 2. Zib is silent in play

/** The screens where Vrell (and only Vrell) still talks. */
const VOICE_FILES = new Set(['src/ui/memo.ts', 'src/ui/report.ts', 'src/ui/abort.ts', 'src/ui/deep-choice.ts', 'src/audio/sfx.ts', 'src/audio/voice.ts']);

/** Each `.speak(` call on something other than `this` (a scene's own `speak` helper is not audio). */
function speakCalls(text: string): string[] {
  const out: string[] = [];
  const re = /(\w+)\s*\??\.\s*speak\s*(\?\.)?\s*\(/g;
  for (const m of text.matchAll(re)) {
    if (m[1] === 'this') continue;
    let depth = 0;
    let end = m.index! + m[0].length - 1;
    for (; end < text.length; end++) {
      if (text[end] === '(') depth++;
      else if (text[end] === ')' && --depth === 0) break;
    }
    out.push(text.slice(m.index!, end + 1));
  }
  return out;
}

describe('Zib has no voice in play', () => {
  it('never voices Zib', () => {
    for (const f of files.filter(f => !f.path.startsWith('src/audio/'))) {
      for (const call of speakCalls(strip(f.text))) expect(call, f.path).not.toMatch(/['"]zib['"]/);
    }
  });

  it('only speaks on the memo, report, abort and deep-choice screens', () => {
    const speaking = files.filter(f => speakCalls(strip(f.text)).length > 0).map(f => f.path);
    expect(speaking.filter(p => !VOICE_FILES.has(p))).toEqual([]);
    expect(speaking.filter(p => p.startsWith('src/ui/')).sort()).toEqual([...VOICE_FILES].filter(p => p.startsWith('src/ui/')).sort());
  });

  const CLOSED: PointerState = { x: 270, y: 480, down: false, pressed: false, released: false };
  function context(speak: () => void): GameContext {
    return {
      pointer: { ...CLOSED }, assets: { get: () => undefined }, audio: { sfx() {}, speak, hush() {} },
      upgrades: new Set(), reducedMotion: true, tutorial: false, time: 0,
    };
  }

  let levelsWithLines = 0;
  it.each(LEVELS.map(l => [l.id, l] as const))('says Zib lines on screen but never aloud in flight (%s)', (_id, level) => {
    const speak = vi.fn();
    const ctx = context(speak);
    const scene = isDeep(level)
      ? new DeepFlightScene({ ctx, level, run: new DeepRun(level, workOrderNumber(level.id) - 1), onLocked: vi.fn(), onSunrise: vi.fn(), onQuit: vi.fn() })
      : new FlightScene({ ctx, level, spotted: 0, onLocked: vi.fn(), onQuit: vi.fn() });
    const lines = new Set<string>();
    for (let i = 0; i < 8 * 60; i++) {
      ctx.time += 1 / 60;
      scene.update(1 / 60);
      if (scene.zibT > 0) lines.add(scene.zibText);
    }
    expect(speak).not.toHaveBeenCalled();
    if (lines.size > 0) levelsWithLines++;
  });

  it('reached Zib lines on most of those flights (the check is not vacuous)', () => {
    expect(levelsWithLines).toBeGreaterThan(LEVELS.length / 2);
  });

  it('keeps the sleepers mumbling on screen but never voices anyone in an abduction', () => {
    const speak = vi.fn();
    const rooms = [...new Set(LEVELS.flatMap(l => isDeep(l) ? l.map.targets.flatMap(t => t.entries.map(e => e.roomId)) : l.map.entries.map(e => e.roomId)))];
    let mumbles = 0;
    for (const roomId of rooms.slice(0, 8) as RoomId[]) {
      const ctx = context(speak);
      const scene = createAbductScene(ctx, { roomId, levelId: 'headless', rules: { wakeFails: false, hard: false } }, (_r: AbductResult) => {});
      const sim = (scene as unknown as { debug: AbductSimulation }).debug;
      const p = ctx.pointer;
      const frame = (): void => { ctx.time += 1 / 60; scene.update(1 / 60); p.pressed = p.released = false; };
      frame();
      Object.assign(p, { x: sim.body.chestX, y: sim.body.chestY, down: true, pressed: true });
      // shake the specimen about: bonks make sleepers talk in their sleep
      for (let f = 0; f < 4 * 60 && !sim.complete && !sim.failure; f++) {
        p.x = 270 + Math.sin(f / 4) * 240;
        p.y = 480 + Math.cos(f / 5) * 380;
        frame();
        if (sim.mumbleFx > 0 && sim.mumbleFor === sim.mumbleFx) mumbles++;
      }
    }
    expect(speak).not.toHaveBeenCalled();
    expect(mumbles).toBeGreaterThan(0);
  });
});

// ------------------------------------------------------------------ 3. no ambient bed

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
  gain = new Param(); frequency = new Param(); offset = new Param(); Q = new Param(); threshold = new Param(); ratio = new Param();
  type = ''; buffer: unknown = null; loop = false;
  /** What this node feeds (the master, a filter, or an AudioParam for modulation). */
  to: unknown = null;
  start = vi.fn(); stop = vi.fn(); disconnect = vi.fn();
  connect<T>(destination: T): T { this.to = destination; return destination; }
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
  createConstantSource() { const n = new Node(); this.sources.push(n); return n; }
  createGain() { const n = new Node(); this.gains.push(n); return n; }
  createOscillator() { const n = new Node(); this.oscillators.push(n); return n; }
  createBufferSource() { const n = new Node(); this.sources.push(n); return n; }
  createBuffer(_channels: number, length: number, rate: number) {
    const samples = new Float32Array(length);
    return { getChannelData: () => samples, duration: length / rate };
  }
}

afterEach(() => vi.unstubAllGlobals());

describe('no ambient bed', () => {
  it('has no ambient API, module or call', () => {
    expect(files.some(f => /^src\/audio\/ambien/.test(f.path))).toBe(false);
    const audioIface = contractsSource.slice(contractsSource.indexOf('export interface Audio {'));
    expect(audioIface.slice(0, audioIface.indexOf('\n}'))).not.toMatch(/ambien|\bbed\b|\bloop\b|music/i);
    expect(contractsSource).not.toMatch(/AmbientBed/);
    for (const f of files) expect(strip(f.text), f.path).not.toMatch(/\.ambien\w*\s*(\?\.)?\s*\(|\bAmbientBed\b/);
    const api = Object.getOwnPropertyNames(SynthAudio.prototype).filter(n => n !== 'constructor').sort();
    expect(api.filter(n => /ambien|bed|music|loop|drone/i.test(n))).toEqual([]);
  });

  it('is silent between cues: unlocking starts nothing and every cue fades back to zero', async () => {
    const ac = new Context();
    vi.stubGlobal('window', { AudioContext: vi.fn(function () { return ac; }) });
    const audio = new SynthAudio();
    audio.unlock();
    await Promise.resolve();
    ac.state = 'running';
    // unlocking (a scene change, the title, a first tap) starts no sound source at all
    expect(ac.oscillators.filter(o => o.start.mock.calls.length > 0)).toEqual([]);
    expect(ac.sources.filter(s => s.start.mock.calls.length > 0)).toEqual([]);
    for (const name of sfxNames()) {
      ac.currentTime += 1;
      audio.sfx(name as Parameters<SynthAudio['sfx']>[0]);
    }
    // every voice that feeds the master ends each cue at silence (vibrato depths feed a pitch, not the mix)
    const master = ac.gains[0]!;
    const voices = ac.gains.filter(g => g.to === master);
    expect(voices.length).toBeGreaterThan(4);
    for (const g of voices) {
      const events = g.gain.events;
      if (events.length === 0) {
        expect(g.gain.value, 'an idle voice').toBe(0);
        continue;
      }
      const last = events.reduce((a, b) => (b[1] >= a[1] ? b : a));
      expect(last[2], `a voice left at ${last[2]} after ${last[1]} s`).toBe(0);
    }
  });
});
