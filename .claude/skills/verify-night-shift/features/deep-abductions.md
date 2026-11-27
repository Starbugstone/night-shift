# Deep shifts

Every order after the two tutorials is a live shift. Zib flies a large map with one to three specimens, hovers in a
ring to lock on, then drags each sleeper through a multi-room interior to its exit. Detectors (cones, cameras,
lights, poets, cows…) fill the Suspicion fuse; a full fuse shows the SPOTTED card and sends the saucer back. The
shift has a clock: a sunrise, storm or demolition deadline, or (the bakery) an elapsed time against par. Each map
has one optional town pickup, hinted in the memo.

## Sub-features

- `deep-flight`: HUD clock, specimen tracker, rings with route labels, minimap, the quit button at (46, 47).
- `deep-spotted`: the SPOTTED card waits for a tap (skippable after 0.9 s, `SPOT_SKIP`); the clock is charged only for the first 1.35 s (`SPOT_HOLD`).
- `deep-rooms`: scrolling interiors with timed doors, second sleepers, lasers, cameras, moisture (Bubbles), probes (L6), the swell (L7), the 1122 time window and the 1953 heat ray.
- `deep-choice`: after a failed or abandoned room, **Retry** at (270, 598), **Back to flight** at (270, 714), **Abandon** at (270, 802).
- `deep-pickup`: the town pickup. Hover on it like a ring (the 1955 time car moves; L8's Krix is an outdoor catch).
- `deep-deadline`: running out of clock files a failed report (stamp `sunrise`, `storm` or `demolition`).
- `deep-practice`: the bakery memo offers the **Field Check** practice and the 2199 memo a recital practice, at (142, 894); on those memos **Start shift** moves to (394, 894).
- `deep-finale`: the first 2199 delivery's report opens the `dispatch-finale` scene (on **Next**, or by itself after Vrell's comment) (Skip (118, 879), Next (371, 879)); afterwards the 2199 memo shows Replay (88, 894), Practice (248, 894) and Start shift (430, 894).

## How to get to it (user POV)

- Clock in, scroll the Work Orders, tap an unlocked deep card, then **Start shift** (at (270, 894), or where `deep-practice` says).
- The eras unlock in order: the first 1955 delivery opens 1122 and 1953 (either order); 2199 needs both.
- `?unlock=1&flight=N` opens order N's flight directly; `?room=<id>` opens one room with zero flight time.

## Driving it with Playwright

Preconditions: an e2e preview build (`npm run build -- --mode e2e --outDir review/e2e-build`, then `npm run preview -- --outDir review/e2e-build --port <port> --strictPort`) and the media tooling's Playwright.

- **Whole shift.** `BASE=http://127.0.0.1:<port>/ ONLY=<level id> node scripts/e2e-playthrough.cjs`. It drives the flight autopilot and every room through real pointer input, taps through SPOTTED cards and the choice screen, and fails unless the report is stamped *delivered*, the save gains one report and one attempt, and the level record survives a reload. Captures land in `review/e2e/`.
- **Town pickup.** Add `PICKUP=1` for Birch Lane (corridor plus the live pickup position), 1955 (time car pilot) or 1953 (tripod leg pilot). The run must then earn all four stars.
- **One room.** `.claude/skills/verify-night-shift/scripts/verify.mjs <port> <run> <room id>` opens `?room=<id>`, pilots it and checks the report and save. Inside a journey use `game.goto('abduct', '<room id>')` to stay in the loaded page.
- **A failure on purpose.** In a journey, open a room and drive into its hazard (a laser, a camera, a sleeper's wake radius). Read `active.debug.result()` before the scene changes and compare its `failReason` with the warning on screen, then check the choice screen.
- **Headless proofs.** `tests/flight-autopilot.test.ts` flies every deep map in `LEVELS` (Birch Lane, L8 and L11 have their own drivers, named in the test); `tests/abduct-*.test.ts` and `npm run difficulty` cover rooms, hard rules and difficulty bands.

## Gotchas

- A held pointer never closes the SPOTTED card: release, then press again after 0.9 s.
- `run.phase` is gone by the time the report shows (the run is cleared); read the report's `model.stamp` and `outcome.stars` instead.
- `?unlock=1` opens every order, so it cannot prove era unlocks; play the prerequisite shift in the same context for that.
- The 1955 time car only appears part-way into the shift; the pickup pilot waits for it.
- The L12 practice recital and the Field Check write no report.
