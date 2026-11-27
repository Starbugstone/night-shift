import type { LevelReport } from './evaluate';
import { RateLedger } from './rates';

/** The count a star band judges, shared by a tier floor and a design band on the same star. */
export const starKey = (profile: string, star: number): string => `star ${star} (${profile})`;

// The finale's design bands use twenty matched shifts per profile. The fourth star
// belongs to the separate towel-first run, which still has to file all three residents.
// v0.2 council round 2 (user decision 2026-11-27): bands that admitted one or two counts out of 20 are
// widened about their centre to three or more (rates.ts MIN_BAND_COUNTS): casual Ghost 33–38% → 30–40%,
// casual Night owl 50–55% → 45–60%, skilled Delivered 85–92% → 85–95%, skilled Night owl 67–75% → 65–75%.
// At 20 seeds they replace the late-tier star floors (evaluate.ts DESIGN_BANDS).
export const FINALE_BANDS = {
  casual: [[0.75, 0.85], [0.30, 0.40], [0.45, 0.60], [0.55, 0.75]],
  skilled: [[0.85, 0.95], [0.50, 0.65], [0.65, 0.75], [0.80, 0.95]],
} as const;
const bands = FINALE_BANDS;

export function checkDispatchFinale(report: LevelReport, ledger = new RateLedger([])): string[] {
  const failures: string[] = [];
  if (report.seeds !== 20) return failures;
  const rates = new RateLedger(failures);
  for (const row of report.stars) {
    if (row.profile !== 'casual' && row.profile !== 'skilled') continue;
    const towel = report.towelFirst!.find(detour => detour.profile === row.profile)!;
    const counts = [...row.earned, towel.fourthStars];
    for (const [index, [min, max]] of bands[row.profile].entries()) {
      ledger.checks.push(rates.rate(`Finale band: ${report.starLabels[index]} (${row.profile})`, counts[index]!, row.attempts, { min, max }, '', starKey(row.profile, index)));
    }
  }
  const seconds = report.shiftEstimate.casual;
  if (seconds !== undefined && (seconds < 120 || seconds > 140))
    failures.push(`casual shift estimate ${seconds} s, band wants 120–140 s`);
  return failures;
}
