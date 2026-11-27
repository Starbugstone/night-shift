import type { LevelReport } from './evaluate';
import { RateLedger } from './rates';

// The finale's design bands use twenty matched shifts per profile. The fourth star
// belongs to the separate towel-first run, which still has to file all three residents.
const bands = {
  casual: [[0.75, 0.85], [0.33, 0.38], [0.50, 0.55], [0.55, 0.75]],
  skilled: [[0.85, 0.92], [0.50, 0.65], [0.67, 0.75], [0.80, 0.95]],
} as const;

export function checkDispatchFinale(report: LevelReport, ledger = new RateLedger([])): string[] {
  const failures: string[] = [];
  if (report.seeds !== 20) return failures;
  const rates = new RateLedger(failures);
  for (const row of report.stars) {
    if (row.profile !== 'casual' && row.profile !== 'skilled') continue;
    const towel = report.towelFirst!.find(detour => detour.profile === row.profile)!;
    const counts = [...row.earned, towel.fourthStars];
    for (const [index, [min, max]] of bands[row.profile].entries()) {
      ledger.checks.push(rates.rate(`Finale band: ${report.starLabels[index]} (${row.profile})`, counts[index]!, row.attempts, { min, max }));
    }
  }
  const seconds = report.shiftEstimate.casual;
  if (seconds !== undefined && (seconds < 120 || seconds > 140))
    failures.push(`casual shift estimate ${seconds} s, band wants 120–140 s`);
  return failures;
}
