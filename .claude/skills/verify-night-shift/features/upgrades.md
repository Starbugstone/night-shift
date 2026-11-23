# Upgrades

In the Beam Shop, players spend Glorbs on four upgrades: Beam Dampener (25), Hush Drive (35), Afterburner (60) and Snooze Ray (80). Each card shows where it works, an effect line and a button that reads **Buy · N** or a greyed **Need N**. A purchase swaps the button for an **INSTALLED** stamp and persists between shifts and reloads.

## Sub-features

- `upgrades-open` opens the Beam Shop from Work Orders.
- `upgrades-funds` blocks purchases a player cannot afford.
- `upgrades-buy` installs an upgrade once and debits the cost.
- `upgrades-effects`:
  - Beam Dampener damps limb swing in rooms.
  - Hush Drive stretches the flight fuse (×0.8 fill: 1.0 → 1.25 s) and slows wake, camera and sleeper meters in rooms (×0.75 / ×0.8).
  - Afterburner: a finger flick of at least 900 px/s fires a 0.35 s dash at 2.2× speed, then a 2.5 s cooldown ring.
  - Snooze Ray: double-tap in a room knocks 40 off every wake meter, once per room.

## How to get to it (user POV)

- Choose **Clock in**, then **Upgrades** at the top right of Work Orders `(426,216)`.
- The four cards stack in one column with no scrolling. Buy button centres: `(416,326)` Dampener, `(416,510)` Hush Drive, `(416,694)` Afterburner, `(416,878)` Snooze Ray. The back arrow is `(48,48)`.

## Driving it with Playwright

Preconditions: a fresh context for the insufficient-funds check. For purchases, earn Glorbs through reports or use `/?unlock=1` (at least 999 Glorbs) solely for shopping setup.

- **Open and check funds.** `await game.tap(270, 686); await game.expectScene('workorders'); await game.tap(426, 216); await game.expectScene('upgrades')`. On an empty save tap all four Buy positions: `glorbs` stays 0 and `upgrades` stays `[]`.
- **Buy each.** After `/?unlock=1`, tap each Buy button and step 90 frames: the stored balance drops by 25, 35, 60 and 80, each id appears once in `upgrades`, and a second tap charges nothing. Capture the four **INSTALLED** stamps.
- **Reload.** `await game.open('/')` (not `?unlock=1`), reopen the shop, and compare balance and list with the stored values.
- **Afterburner.** Open `/?flight=3`, drag 200 px in 8 frames from the saucer's screen position: without the upgrade `debug.sim.st.dash.cool` stays 0; with it, the cooldown is running (dash fired).
- **Snooze Ray.** Open `/?room=dave_roof` with the upgrade: the double-tap hint shows at (14,831). Tap twice near the beam: after the first tap `snoozeUsed` is false, after the second it is true and `snoozePulse > 0`.

All five bullets were driven together in one journey at `7d2bd29`.

## Gotchas

- `?unlock=1` raises currency to at least 999 every time that URL loads and saves `allUnlocked`. Navigate to `/` for the persistence check.
- When the wake meters are at 0 the Snooze Ray's −40 is invisible in the numbers; prove it with `snoozeUsed`, `snoozePulse` and the hint disappearing.
- Compare effects between two runs that receive the same timed input; capture both before any meter saturates.
