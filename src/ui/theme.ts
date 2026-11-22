export const C = {
  night: '#120d2b',
  night2: '#1e1747',
  night3: '#2b2262',
  panel: '#2a2160',
  panelHi: '#3b3088',
  ink: '#1b1433',
  mint: '#7CFFCB',
  mintDeep: '#2fbf8f',
  mintDark: '#1d7a5e',
  amber: '#FFB347',
  amberHi: '#FFD27A',
  text: '#F1EEFF',
  muted: '#A9A2D6',
  red: '#FF5D73',
  paper: '#F4EFE2',
  paperLine: '#d9d0ea',
  paperInk: '#2b2350',
} as const;

const STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const cache = new Map<number, string>();

/** Cached CSS font string for the system stack. */
export function font(size: number, weight = 600, italic = false): string {
  const key = size * 10000 + weight * 2 + (italic ? 1 : 0);
  let f = cache.get(key);
  if (!f) {
    f = `${italic ? 'italic ' : ''}${weight} ${size}px ${STACK}`;
    cache.set(key, f);
  }
  return f;
}
