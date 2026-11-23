# Deep shifts (L3 and L4)

A deep shift is one big flight map with three specimens, each in a house with two entry rings, collected in any order before a sunrise clock runs out (L3 "Cul-de-Sac Sweep" 420 s, L4 "Downtown Graveyard Shift" 480 s). Being seen fills a suspicion fuse (L3 1.3 s, L4 1.0 s, longer with Hush Drive); a full fuse shows a SPOTTED photo and puts the saucer back at the last checkpoint (the start, or the ring of the last delivery). Locking on a ring dives into that house's [deep abduction](deep-abductions.md); a delivery returns to flight at that ring, a failure opens a choice screen. The shift ends on a deep report after the third delivery, or at sunrise.

## Sub-features

- `deep-entry` L3/L4 work orders, memo, Start shift; the opening banner ("Seen for 1.3 s = spotted").
- `deep-hud` fuse with its length caption ("1.30 s fuse", French « mèche 1,30 s »), sun clock, specimen chips, minimap, off-screen target arrows, Zib's lines.
- `deep-spotted` fuse full → SPOTTED photo card (witness, caption) → respawn at the checkpoint after ~1.35 s (tap to skip after 0.4 s).
- `deep-hazards` L3: police cruiser, porch and yard lights, Mrs. Pruitt, yard dogs, Gary's camera, bats, power lines, gags (sprinkler, Gary's tripwire, the crop-circle field). L4: helicopter, patrol cars, traffic, roof cameras, office windows, crane, pigeons, tram wires, neon billboards (BURGERS, DON'T PANIC) that scramble steering.
- `deep-legs` ring lock → abduction → back to flight with "SPECIMEN SECURED n of 3" and CHECKPOINT at that ring.
- `deep-choice` after a failed or abandoned room: **Retry** `(270,598)`, **Back to flight** `(270,714)`, **Abandon shift** `(270,802)` (to Work Orders).
- `deep-report` stars: Delivered all 3, Ghost (no sightings and no failed abductions), Night owl (at least the par margin left: 160 s on L3, 170 s on L4). Seven rows, pay ×2, SUNRISE stamp and a Vrell memo when the clock runs out.

## How to get to it (user POV)

- Work Orders → L3 card `(270,762)` (unlocked after L2, or with `?unlock=1`) → memo → **Start shift** `(270,894)`. L4 sits below and needs a scroll.
- Fixtures: `?flight=3|4`, `?level=3|4`, or `page.evaluate(() => window.__nightShift.goto('flight', 3))` (1-based level number).

## Driving it with Playwright

Preconditions: a fresh context with `?unlock=1` for the Work Orders entry, or a fixture. The scene's debug handle is `active.debug` = `{ autopilot(), sim, run, state, ap }`; `window.__nightShift.run` is the shift runner.

- **Enter and read the HUD.** From `/?unlock=1`: Clock in, tap `(270,762)`, expect `memo`, tap `(270,894)`, expect `flight`. Check `run.level.id === 'level3'`, `run.budget === 420`, `active.fuse.seconds` ≈ 1.3. Capture the banner, then step 200 frames and capture the idle HUD ("1.30 s fuse").
- **Fuse and respawn.** Fixture: `active.debug.sim.place(760, 968, 0)` parks the saucer in Dave's yard dog's bark radius. Step one frame at a time until `debug.state === 'spotted'`: about 78 frames (1.3 s) at `7d2bd29`, cause `dog`. Step ~20 frames before capturing the SPOTTED card (the first frames are a white photo flash). Step ~100 more: `state === 'fly'`, `run.spotted === 1`, saucer back at the start `(1080,2700)`.
- **Fly to a ring with the autopilot.** Each step, read `active.debug.autopilot()` (`{down, x, y}` in logical screen px). When `down` and `state === 'fly'`, press or move the mouse there (clamp y ≥ 84, clear of the quit button); otherwise release and step. Capture `state === 'locking'`; the scene becomes `abduct` with `run.current.roomId` set (Gary's garage door at `7d2bd29`).
- **Do the leg.** Hold the mouse at `active.debug.autopilotFinger(3 / 60)` each step until the scene leaves `abduct`. On `choice`, tap Retry and continue. Expect `flight` with `run.deliveredCount === 1`, `run.legs === 1`, the checkpoint at the delivered ring, and the "1 of 3" banner.
- **Sunrise (fixture).** `await game.page.evaluate(() => { const r = window.__nightShift.run; r.elapsed = r.budget - 2; })`, then `await game.expectScene('report', 400)` and step ~240 frames: the deep report shows `0/3`, the SUNRISE stamp, +0 Glorbs and **Work orders**; the save has `level3.attempts === 1`, `delivered === false`, `reports === 1`.
- **Full shift.** The headless proofs (`tests/flight-autopilot.test.ts`, `tests/levels-deep.test.ts`, `npm run difficulty`) cover all three legs, both levels, and the difficulty band. `scripts/e2e-playthrough.cjs` plays whole shifts in a real browser in real time (about 30 minutes).

Entry, HUD, fuse length (79 frames), the SPOTTED card, respawn, autopilot ring lock, one leg, the return to flight and the sunrise report were driven at `7d2bd29`.

## Gotchas

- `sim.place` and `run.elapsed` are fixtures; record them as such.
- `run.spotted` increments on respawn, not at the moment the state turns `spotted`.
- After a delivery the saucer returns inside a short safe window, even when a detector sweeps the ring.
- `flyRing` and the tutorial `approaches` table do not cover deep maps; use the scene autopilot.
- A whole shift is 13–25k frames on the virtual clock; budget the run time accordingly.
