import { fmt, gt, tr } from '../i18n';
import { RANKS, type RunOutcome } from '../levels/progress';
import type { ReportModel } from './report';
import { layoutReport, type Measure, type ReportLayout } from './report-layout';

export interface ReportContent {
  layout: ReportLayout;
  approved: string | null;
  readingsHeading: string | null;
  payoutExtra: string;
}

/** Content shown by the report, with translated readings and its fitted cover and headline. */
export function reportContent(model: ReportModel, outcome: RunOutcome, measure: Measure): ReportContent {
  const strings = tr();
  const readings = model.readings.map((x) => gt(x));
  let payoutExtra = '';
  if (outcome.rankAfter.title !== outcome.rankBefore.title) {
    const rank = strings.ranks[RANKS.indexOf(outcome.rankAfter)] ?? outcome.rankAfter;
    payoutExtra = fmt(strings.report.promoted, { rank: rank.title });
  } else if (outcome.unlockedNext) payoutExtra = strings.report.unlocked;
  return {
    layout: layoutReport(measure, { rows: model.rows.length, readings, cover: model.cover, headline: model.headline }),
    approved: model.delivered && model.photo ? strings.reportExtras.approved : null,
    readingsHeading: readings.length ? strings.reportExtras.readings : null,
    payoutExtra,
  };
}
