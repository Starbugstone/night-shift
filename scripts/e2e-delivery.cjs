// v0.2 council round 5 (Sol P2): what the browser playthrough (scripts/e2e-playthrough.cjs) accepts as a delivered
// shift, as pure functions so tests/shell-e2e-runner.test.ts can feed them rejected reports, failed or missing
// deliveries and failed reloads for every registered level (docs/REGRESSIONS.md P6).
//
// `before` and `progress` are the runner's progressOf() reads: { reports, level } with `level` the save's record
// for the shift's level. `end` is { scene, report, progress } with `report` the report model on screen
// ({ stamp, delivered, stars }) or null.

/**
 * Why the shift's end is not a fresh, successful delivery: a report stamped 'delivered' whose own stars include
 * Delivered (not sunrise, storm, demolition or failed), one more report and attempt than before, and the level
 * delivered with a best time. `extra` carries the run's own problems. Empty when it is one.
 */
function deliveryProblems(before, end, extra = []) {
  const problems = [...extra];
  const after = end && end.progress;
  if (!end || end.scene !== 'report') problems.push(`ended on ${end ? end.scene : 'nothing'}, not report`);
  const report = end ? end.report : null;
  if (!report) problems.push('no report model');
  else if (report.stamp !== 'delivered' || report.delivered !== true || !Array.isArray(report.stars) || report.stars[0] !== true) problems.push(`report ${JSON.stringify(report)}`);
  if (!after || !after.level) {
    problems.push('no saved progress');
    return problems;
  }
  if (after.reports !== before.reports + 1) problems.push(`reports ${before.reports} -> ${after.reports}`);
  if (after.level.attempts !== before.level.attempts + 1) problems.push(`attempts ${before.level.attempts} -> ${after.level.attempts}`);
  if (after.level.delivered !== true || after.level.bestTimeSec === null || after.level.bestTimeSec === undefined) problems.push('level not delivered');
  return problems;
}

/** Why the save read after a reload is not the one the shift ended with. Empty when it persisted. */
function reloadProblems(after, reloaded) {
  if (!reloaded || JSON.stringify(reloaded) !== JSON.stringify(after)) return ['save changed on reload: ' + JSON.stringify({ after, reloaded })];
  return [];
}

module.exports = { deliveryProblems, reloadProblems };
