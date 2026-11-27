// Rate bands judged by sample size (user decision 2026-11-27: "6-seed sanity + 20-seed release").
//
// A rate band (a floor or a ceiling on k successes out of n attempts) is exact from EXACT_FROM attempts:
// k/n must sit inside the band. Below that, the default six-seed sweep is a sanity check: a cell fails
// only when its count is too far from the band to be seed luck, by a one-sided exact binomial test.
//   floor p0:   fail when P(X <= k | n, p0) < ALPHA   (a true rate of p0 would give k or fewer < 5% of the time)
//   ceiling p1: fail when P(X >= k | n, p1) < ALPHA
// That is the same as failing when the one-sided 95% Clopper-Pearson bound of the rate excludes the band.
// "Skilled earns Ghost more often than casual" compares two rates: below EXACT_FROM it fails only when a
// one-sided Fisher exact test says casual beats skilled (p < ALPHA). See the evaluate-difficulty skill.

/** Attempts from which a rate band is judged exactly. */
export const EXACT_FROM = 20;
/** One-sided significance of the sanity check below EXACT_FROM attempts. */
export const ALPHA = 0.05;
const EPS = 1e-9;

export interface RateBand {
  min?: number;
  max?: number;
}

export interface RateCheck {
  /** What is counted, e.g. `Ghost (casual)` or `sal_loft (skilled) delivers`. */
  label: string;
  k: number;
  n: number;
  min?: number;
  max?: number;
  /** Order checks: the low row's count and attempts, which k/n must beat. */
  against?: [number, number];
  mode: 'exact' | 'sanity';
  /** k/n sits inside the band. */
  inBand: boolean;
  /** The check passes: inBand when exact, the binomial test when sanity. */
  pass: boolean;
  /** Sanity mode, outside the band: the one-sided p-value against the nearer edge. */
  p?: number;
}

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let i = 1; i <= Math.min(k, n - k); i++) c = c * (n - Math.min(k, n - k) + i) / i;
  return c;
}

/** P(X = k) for X ~ Binomial(n, p). */
export function binomPmf(k: number, n: number, p: number): number {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return choose(n, k) * p ** k * (1 - p) ** (n - k);
}

/** P(X <= k) for X ~ Binomial(n, p). */
export function binomCdf(k: number, n: number, p: number): number {
  let s = 0;
  for (let i = 0; i <= Math.min(k, n); i++) s += binomPmf(i, n, p);
  return Math.min(1, s);
}

/** P(X >= k) for X ~ Binomial(n, p). */
export function binomSf(k: number, n: number, p: number): number {
  let s = 0;
  for (let i = Math.max(0, k); i <= n; i++) s += binomPmf(i, n, p);
  return Math.min(1, s);
}

/** Judge k successes out of n attempts against a band (see the header for the rule). */
export function judgeRate(label: string, k: number, n: number, band: RateBand): RateCheck {
  if (!Number.isInteger(k) || !Number.isInteger(n) || n <= 0 || k < 0 || k > n) throw new Error(`${label}: bad count ${k}/${n}`);
  const low = band.min !== undefined && k < band.min * n - EPS;
  const high = band.max !== undefined && k > band.max * n + EPS;
  const inBand = !low && !high;
  const mode = n >= EXACT_FROM ? 'exact' : 'sanity';
  const check: RateCheck = { label, k, n, ...band, mode, inBand, pass: inBand };
  if (mode === 'sanity' && !inBand) {
    check.p = low ? binomCdf(k, n, band.min!) : binomSf(k, n, band.max!);
    check.pass = check.p >= ALPHA;
  }
  return check;
}

/**
 * One-sided Fisher exact test: the chance, with both rows' totals fixed, that the second row (n2 attempts)
 * gets k2 or more of the k1 + k2 successes when both rows share one rate.
 */
export function fisherGreater(k1: number, n1: number, k2: number, n2: number): number {
  const total = k1 + k2;
  const all = choose(n1 + n2, total);
  let s = 0;
  for (let j = k2; j <= Math.min(n2, total); j++) s += choose(n2, j) * choose(n1, total - j) / all;
  return Math.min(1, s);
}

/** Judge "the high row earns more often than the low row" (skilled Ghost above casual Ghost). */
export function judgeOrder(label: string, kHigh: number, nHigh: number, kLow: number, nLow: number): RateCheck {
  const inBand = kHigh / nHigh > kLow / nLow + EPS;
  const n = Math.min(nHigh, nLow);
  const mode = n >= EXACT_FROM ? 'exact' : 'sanity';
  const check: RateCheck = { label, k: kHigh, n: nHigh, against: [kLow, nLow], mode, inBand, pass: inBand };
  if (mode === 'sanity' && !inBand) {
    check.p = fisherGreater(kHigh, nHigh, kLow, nLow);
    check.pass = check.p >= ALPHA;
  }
  return check;
}

const pct = (x: number): string => `${Math.round(x * 100)}%`;

/** The band as text: `≥ 83%`, `≤ 90%`, `33–38%` or `> 4/6`. */
export function bandText(c: Pick<RateCheck, 'min' | 'max' | 'against'>): string {
  if (c.against) return `> ${c.against[0]}/${c.against[1]}`;
  if (c.min !== undefined && c.max !== undefined) return `${pct(c.min)}–${pct(c.max)}`;
  if (c.min !== undefined) return `≥ ${pct(c.min)}`;
  if (c.max !== undefined) return `≤ ${pct(c.max)}`;
  return '–';
}

/** Collects a level's rate checks and turns failed ones into violation sentences. */
export class RateLedger {
  readonly checks: RateCheck[] = [];
  constructor(private readonly violations: string[]) {}

  /** Judge a floor and/or ceiling; `detail` is appended to a violation (e.g. the fail causes). */
  rate(label: string, k: number, n: number, band: RateBand, detail = ''): RateCheck {
    const c = judgeRate(label, k, n, band);
    this.checks.push(c);
    if (!c.pass) this.violations.push(`${label} ${k}/${n} (${pct(k / n)}), band wants ${bandText(c)}${sanityNote(c)}${detail ? `; ${detail}` : ''}`);
    return c;
  }

  /** Judge `high` above `low` (two rates). */
  order(label: string, kHigh: number, nHigh: number, kLow: number, nLow: number): RateCheck {
    const c = judgeOrder(label, kHigh, nHigh, kLow, nLow);
    this.checks.push(c);
    if (!c.pass) this.violations.push(`${label}: ${kHigh}/${nHigh} against ${kLow}/${nLow}${sanityNote(c)}`);
    return c;
  }
}

function sanityNote(c: RateCheck): string {
  return c.mode === 'sanity' && c.p !== undefined ? ` (outside even the ${c.n}-attempt tolerance: p = ${c.p.toFixed(3)} < ${ALPHA})` : '';
}

/** Checks outside their exact band that the sanity tolerance lets through (worth a 20-seed look). */
export function tolerated(checks: readonly RateCheck[]): RateCheck[] {
  return checks.filter(c => c.pass && !c.inBand);
}
