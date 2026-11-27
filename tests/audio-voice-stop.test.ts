// VoiceEngine.kill() stops sources that play() already scheduled to stop. A strict WebAudio (older
// Safari) throws InvalidStateError on that second stop(), and the throw escaped into a scene's update or
// dispose (tapping a memo to skip the typing, rapid flight barks). Council v0.2, Neon 9.
import { describe, expect, it } from 'vitest';
import { VoiceEngine } from '../src/audio/voice';

/** A node or AudioParam that accepts every call; scheduled sources reject a second stop(). */
function fakeNode(): unknown {
  let stops = 0;
  const target: Record<string | symbol, unknown> = {
    stop() {
      if (++stops > 1) throw new DOMException('stop() called twice', 'InvalidStateError');
    },
    connect: (next: unknown) => next,
  };
  return new Proxy(target, {
    get(t, key) {
      if (key in t) return t[key];
      if (key === 'then') return undefined;
      if (key === 'value' || key === 'length') return 0;
      return t[key] = typeof key === 'string' && /^[a-z]+[A-Z]|^(start|disconnect)$/.test(key) ? () => fakeNode() : fakeNode();
    },
    set(t, key, v) { t[key] = v; return true; },
  });
}

function strictContext(): BaseAudioContext {
  const ac = fakeNode() as Record<string, unknown>;
  ac.currentTime = 0;
  ac.sampleRate = 44100;
  return ac as unknown as BaseAudioContext;
}

describe('voice engine on a strict WebAudio', () => {
  it('replacing or stopping a line never throws', () => {
    const ac = strictContext();
    const voices = new VoiceEngine(ac, fakeNode() as AudioNode, fakeNode() as AudioBuffer);
    expect(voices.speak('Mrs. Pruitt locked on faster than my tractor beam.', 'zib')).not.toBeNull();
    expect(() => voices.speak('Respect, honestly.', 'zib')).not.toThrow();
    expect(() => voices.stop()).not.toThrow();
  });
});
