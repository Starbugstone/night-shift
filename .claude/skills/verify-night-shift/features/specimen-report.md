# Specimen Report and save

A finished attempt files a Specimen Report with time, bonks, dignity, snores, items taken, sightings, earned stars and Glorbs. Work Orders show accumulated stars and the best delivery time when you return or reload.

## Sub-features

- `report-stats` shows the attempt's stamp and statistics.
- `report-stars` scores Delivered, Still asleep, and Night owl.
- `report-save` keeps stars, best time, attempts, balance and unlocks.
- `report-actions` continues to the next memo or Work Orders, or starts a retry.

## How to get to it (user POV)

- Complete abduction following a [tutorial shift](tutorial-shifts.md). A room fixture can also produce a genuine report with zero flight time and sightings.
- Use **Retry** to start the same flight over. On a successful L1 report, **Next** opens the L2 memo. L2 offers **Work orders**. An in-room **Restart** opens abort choices and leaves the report count untouched.

## Driving it with Playwright

Preconditions:

- Start with an empty save for first-time star pay. For repeat rewards, deliver the same level again in the same browser context.
- Use a full shift when asserting combined flight and abduction time against par (L1 42 s, L2 48 s).

- **Capture and score.** Run `await game.pilotRoom(id, { keepReport: true })` from an active room, or complete the route with a manual pointer drag. For a manual run, wait for `report` then run `await game.step(210); await game.capture('report')`. To check skip during a manual run, tap `(270, 430)` during the reveal and capture the completed report. Check the stamp, six statistics and star positions. Delivered earns the first star; delivery without waking earns the second; delivery at or under par earns the third.
- **Check the save.** Read `const saved = await game.stored()` and compare it with `await game.save()`. A successful first attempt increments `reports` and that level's `attempts`, sets `delivered`, and records the best time. Compare the `glorbs` increase to 5 for delivery plus 10 per newly earned star or 2 per repeated star. On a slower repeat, the prior best time and prior stars remain in the save.
- **Check navigation.** After the reveal, use `await game.tap(140, 888); await game.expectScene('flight')` for Retry. In an independent repeat, tap `(394, 888)` for Next or Work orders and expect `memo` after an L1 delivery or `workorders` after L2.
- **Reload and check the second view.** Run `await game.open(); await game.tap(270, 686); await game.expectScene('workorders')`. Compare `await game.save()` with `saved`, capture the visible stars, time, rank and balance, and verify L2 is playable after L1 delivery. The room helper performs this persistence sequence automatically.
- **Check abort side effects.** Record `await game.stored()` before tapping the current room's Restart button. After the abort screen appears, assert that the storage value equals the pre-abort value.

## Gotchas

- The room helper's default follows the report with a reload check and returns to Work Orders. For report buttons, use `{ keepReport: true }`. To check tap-to-finish, capture the report while its reveal is still in progress.
- The rendered stars score this attempt. The Work Orders stars are cumulative for the level.
- A report opened by the debug `goto` provides demo statistics by default. Use actual gameplay for scoring and persistence checks.
