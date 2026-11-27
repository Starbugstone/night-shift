# Specimen Report and save

A finished attempt files a Specimen Report: a stamp, the run's statistics, up to four stars, Glorbs, a rank line,
Vrell's comment and (deep shifts) a cover story and tabloid headline. Work Orders show accumulated stars and the
best time when you return or reload.

## Sub-features

- `report-stamp`: `delivered`, `failed`, or the deadline that ran out (`sunrise`, `storm` for 1955, `demolition` for 2199). The model is `active.model` while the scene is `report`.
- `report-stars`: four stars, scored by `computeStars` (tutorials) and `computeDeepStars` (deep shifts) in `src/levels/progress.ts`, in this order:
  1. **Delivered** (deep: every specimen delivered before the deadline; L8: quota met).
  2. **Still asleep** (tutorial: nobody woke) or **Ghost** (deep: no sighting and no failed room; L8 counts sightings only).
  3. **Night owl**: within par (tutorial, bakery) or with at least `parMarginSec` left on the clock.
  4. The town pickup star, named after the pickup (L1 has none): the pickup taken on a delivered run.
- `report-pay`: no Glorbs without delivery; otherwise delivery pay plus new-star pay, and a smaller repeat pay per star already owned.
- `report-save`: one more `reports` and level `attempts`; `delivered`, the best time and the union of stars; the souvenirs, town find and specimens go to the trophy room.
- `report-actions`: **Retry** (140, 888) and **Next** / **Work orders** (394, 888). At an era fork the report returns to Work Orders. After the first 2199 delivery, **Next** opens the Dispatch finale, and the report opens it by itself once Vrell's comment has had its read time.

## How to get to it (user POV)

- Finish a tutorial room, or the last specimen of a deep shift, or let a deep shift's clock run out.
- A room fixture (`?room=<id>`) files a genuine tutorial report with zero flight time and sightings.

## Driving it with Playwright

- **Capture and score.** Run `await game.pilotRoom(id, { keepReport: true })` from an active room, or let `scripts/e2e-playthrough.cjs` finish a shift. While the scene is `report`, read `active.model.stamp`, `active.model.delivered` and `active.outcome.stars` (this attempt's stars, not the save's). Wait about 210 frames for the reveal, or tap (270, 430) to skip it, then capture.
- **Check the save.** Compare `await game.stored()` with `await game.save()`. Check that `reports` and the level's `attempts` each went up by one, and the Glorb change matches the pay rule above.
- **Reload.** Run `await game.open(); await game.tap(270, 686); await game.expectScene('workorders')`, then compare the level record and capture the card's stars and best time. `pilotRoom` and the e2e runner do this themselves.
- **Navigation.** After the reveal, tap Retry and expect `flight` (a new attempt of the same shift); in another run, tap Next and expect the next memo or `workorders`.
- **Abort side effects.** Record `await game.stored()`, tap a room's Restart at (474, 47), and check the abort screen leaves storage unchanged.

## Gotchas

- The Work Orders stars are cumulative; the report's are this attempt's. A delivered level stays delivered after a later failed attempt.
- The deep run (`__nightShift.run`) is cleared when the report opens; read the report model, not `run.phase`.
- Read a 2199 first-clear report as soon as the scene is `report`: it moves on to `dispatch-finale` without a tap.
- `goto('report', …)` shows demo statistics and writes no save unless `persist: true`; use real play for scoring and persistence checks.
