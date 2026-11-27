// What each screen calls a deep level's deadline, and how its HUD clock looks. One place, keyed on the level's
// `clockMode` (never its id), so a new level with a storm, demolition or time-trial clock gets the right words
// and look everywhere, and `tests/ui-copy-continuity.test.ts` can check every level in node.
// L8 keeps its in-story dawn (Echo files at dawn), but its HUD counts down "LEFT", so its labels count
// down too (2026-11-26 decision, docs/REGRESSIONS.md C8).
import { fmt, tr } from '../i18n';
import { endsAtSunrise } from '../levels/run';
import type { DeepLevelDef } from '../levels/types';

/** `card`: the Work Orders card, showing the whole budget. `retry`: the retry screen, showing what is left. */
export type DeadlineScreen = 'card' | 'retry';

export function deadlineLabel(lv: DeepLevelDef, time: string, screen: DeadlineScreen): string {
  const t = tr();
  const card = screen === 'card';
  const label = lv.clockMode === 'demolition' ? t.dispatch2199.duration
    : lv.clockMode === 'storm' ? (card ? t.crestValley.duration : t.deepChoice.stormIn)
    : lv.clockMode === 'countdown' ? (card ? t.timeTrial.duration : t.timeTrial.timeLeft)
    : card ? t.workOrders.sunriseIn : t.deepChoice.sunriseIn;
  return fmt(label, { time });
}

/** The flashing warning in the abduction HUD as the deadline nears. */
export function deadlineWarning(lv: DeepLevelDef): string {
  const t = tr();
  return lv.clockMode === 'demolition' ? t.dispatch2199.deadline
    : lv.clockMode === 'storm' ? t.crestValley.deadline
    : lv.clockMode === 'countdown' ? t.timeTrial.warning
    : t.hud.sunComing;
}

/** How the shift clock looks in both HUDs (flight `src/flight/views/deep-hud.ts`, rooms `src/ui/deep-abduct.ts`). */
export interface ClockLook {
  /** A plain stopwatch: the shift has no deadline. */
  timer: boolean;
  /** The sunrise-clock face art: only when the shift ends at sunrise. */
  sunFace: boolean;
  /** Caption over the digits; undefined keeps a dawn clock's own SHIFT / SUNRISE caption. */
  label: string | undefined;
  /** No sunrise warmth or rays as the deadline nears. */
  noDawnGlow: boolean;
  /** The clock and its deadline warning hold steady instead of blinking (the demolition countdown). */
  steady: boolean;
}

export function clockLook(lv: DeepLevelDef): ClockLook {
  const t = tr();
  const mode = lv.clockMode;
  return {
    timer: mode === 'elapsed',
    sunFace: endsAtSunrise(lv),
    label: mode === 'demolition' ? t.dispatch2199.deadline : mode === 'storm' ? t.crestValley.left : mode === 'countdown' ? t.timeTrial.left : undefined,
    noDawnGlow: mode === 'storm' || mode === 'demolition',
    steady: mode === 'demolition',
  };
}
