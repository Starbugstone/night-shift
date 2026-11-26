// What each screen calls a deep level's deadline. One place, so a new deadline kind (storm, demolition,
// time trial) is added once and `tests/ui-copy-continuity.test.ts` can check every level in node.
// L8 keeps its in-story dawn (Echo files at dawn), but its HUD counts down "LEFT", so its labels count
// down too (2026-11-26 decision, docs/REGRESSIONS.md C8).
import { fmt, tr } from '../i18n';
import type { DeepLevelDef } from '../levels/types';

/** `card`: the Work Orders card, showing the whole budget. `retry`: the retry screen, showing what is left. */
export type DeadlineScreen = 'card' | 'retry';

export function deadlineLabel(lv: DeepLevelDef, time: string, screen: DeadlineScreen): string {
  const t = tr();
  const label = lv.id === 'level12' ? t.dispatch2199.duration
    : lv.id === 'level9' ? (screen === 'card' ? t.crestValley.duration : t.deepChoice.stormIn)
    : lv.id === 'level8' ? (screen === 'card' ? t.timeTrial.duration : t.timeTrial.timeLeft)
    : screen === 'card' ? t.workOrders.sunriseIn : t.deepChoice.sunriseIn;
  return fmt(label, { time });
}

/** The flashing warning in the abduction HUD as the deadline nears. */
export function deadlineWarning(lv: DeepLevelDef): string {
  const t = tr();
  return lv.id === 'level12' ? t.dispatch2199.deadline
    : lv.id === 'level9' ? t.crestValley.deadline
    : lv.id === 'level8' ? t.timeTrial.warning
    : t.hud.sunComing;
}
