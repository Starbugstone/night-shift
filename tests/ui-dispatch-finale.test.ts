// The 2199 finale turns its pages by itself, but the last page waits for a tap instead of dropping the
// player on Work Orders mid-read (council v0.2, Fable P3).
import { describe, expect, it, vi } from 'vitest';
import type { Shell } from '../src/core/shell';
import { DispatchFinale } from '../src/ui/dispatch-finale';

const DT = 1 / 60;

describe('2199 finale', () => {
  it('auto-advances the first pages and holds the last one until Next', () => {
    const pointer = { x: 0, y: 0, down: false, pressed: false, released: false };
    const shell = { ctx: { pointer, audio: { sfx() {} } } } as unknown as Shell;
    const finish = vi.fn();
    const finale = new DispatchFinale(shell, finish);
    for (let i = 0; i < 40 * 60 && finale.page < 2; i++) finale.update(DT);
    expect(finale.page).toBe(2);
    for (let i = 0; i < 60 * 60; i++) finale.update(DT);
    expect(finish).not.toHaveBeenCalled();
    const next = finale.next;
    Object.assign(pointer, { x: next.x + next.w / 2, y: next.y + next.h / 2, down: true, pressed: true });
    finale.update(DT);
    Object.assign(pointer, { down: false, pressed: false, released: true });
    finale.update(DT);
    expect(finish).toHaveBeenCalledOnce();
  });
});
