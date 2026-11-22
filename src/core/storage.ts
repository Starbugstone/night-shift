import type { KeyValueStore } from '../levels/save';

/** localStorage, or null when blocked (private mode, sandboxed iframe…). */
export function browserStorage(): KeyValueStore | null {
  try {
    const s = window.localStorage;
    const probe = '__ns_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function watchReducedMotion(onChange: (reduced: boolean) => void): boolean {
  try {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener?.('change', () => onChange(mq.matches));
    return mq.matches;
  } catch {
    return false;
  }
}
