// Pressing "Replay finale" on the 2199 memo must not count as the tap that skips the typewriter: it used
// to finish the memo and hush Vrell before the release opened the finale. Council v0.2, Neon 13.
import { describe, expect, it, vi } from 'vitest';
import type { Shell } from '../src/core/shell';
import { LEVELS } from '../src/levels/levels';
import { defaultSave } from '../src/levels/save';
import { MemoScene } from '../src/ui/memo';

describe('memo buttons', () => {
  it('pressing Replay finale leaves the typewriter running', () => {
    const pointer = { x: 0, y: 0, down: false, pressed: false, released: false };
    const hush = vi.fn();
    const shell = { ctx: { pointer, reducedMotion: true }, audio: { sfx() {}, speak() {}, hush }, save: defaultSave(), assets: { get: () => undefined } } as unknown as Shell;
    const openReplay = vi.fn();
    const memo = new MemoScene(shell, LEVELS.findIndex((l) => l.id === 'level12'), vi.fn(), openReplay);
    memo.update(1 / 60);
    const button = memo.replay!;
    Object.assign(pointer, { x: button.x + button.w / 2, y: button.y + button.h / 2, down: true, pressed: true });
    memo.update(1 / 60);
    expect(memo.chars).toBeLessThan(memo.totalChars);
    expect(hush).not.toHaveBeenCalled();
    Object.assign(pointer, { down: false, pressed: false, released: true });
    memo.update(1 / 60);
    expect(openReplay).toHaveBeenCalledOnce();
  });
});
