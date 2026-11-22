/** Longest step handed to scenes; slower frames run in slow motion instead of tunnelling. */
export const MAX_DT = 1 / 20;

export interface LoopHandle {
  readonly paused: boolean;
}

/**
 * requestAnimationFrame loop with a clamped variable dt (scenes may sub-step
 * internally). Stops while the tab is hidden and resumes without a dt spike.
 */
export function startLoop(
  frame: (dt: number) => void,
  onVisibility?: (visible: boolean) => void,
): LoopHandle {
  let last: number | null = null;
  let raf = 0;
  let paused = false;

  const tick = (now: number): void => {
    raf = requestAnimationFrame(tick);
    const dt = last === null ? 1 / 60 : Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
    last = now;
    frame(dt);
  };

  const onVis = (): void => {
    if (document.hidden) {
      if (!paused) {
        paused = true;
        cancelAnimationFrame(raf);
        onVisibility?.(false);
      }
    } else if (paused) {
      paused = false;
      last = null;
      raf = requestAnimationFrame(tick);
      onVisibility?.(true);
    }
  };
  document.addEventListener('visibilitychange', onVis);
  raf = requestAnimationFrame(tick);

  return {
    get paused() {
      return paused;
    },
  };
}
