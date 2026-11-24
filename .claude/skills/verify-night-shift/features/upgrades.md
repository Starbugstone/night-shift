# Upgrades

In the Beam Shop, players spend Glorbs on the Beam Dampener or Hush Drive. The installed card replaces the Buy button and the purchase persists between shifts and reloads.

## Sub-features

- `upgrades-open` opens the Beam Shop from Work Orders.
- `upgrades-funds` blocks purchases a player cannot afford.
- `upgrades-buy` installs an upgrade once and debits the cost.
- `upgrades-effects` reduces limb swing with the Beam Dampener and slows Suspicion and Wake buildup with the Hush Drive.

## How to get to it (user POV)

- Choose **Clock in**, then **Upgrades** at the top of Work Orders.
- Earn Glorbs from deliveries and stars, then tap **Buy** on the desired card. Use the back arrow to return to Work Orders and check the balance there.

## Driving it with Playwright

Preconditions:

- Use a fresh context for the insufficient-funds check. For a purchase, earn 25 or 35 Glorbs through reports, or use the built-in `/?unlock=1` fixture (999 Glorbs) solely for shopping setup.

- **Open.** Run `await game.tap(270, 686); await game.expectScene('workorders'); await game.tap(426, 216); await game.expectScene('upgrades')`. Capture the Beam Shop and the two cards.
- **Check insufficient funds.** On an empty save, check **Need 25** and **Need 35**. Run `await game.tap(394, 458); await game.tap(394, 782)` and assert the stored value is unchanged.
- **Buy and confirm.** With funds, tap `(394, 458)` for Beam Dampener or `(394, 782)` for Hush Drive. Capture **INSTALLED** and the updated balance. Check the saved `upgrades` list contains `beam_dampener` or `hush_drive` once and the debit is 25 or 35 respectively. Tap the same location again and check that it charges nothing.
- **Reload.** Run `await game.open()` and repeat the Open steps to see **INSTALLED** and the same saved balance. Return to Work Orders with `await game.tap(48, 48); await game.expectScene('workorders')`.
- **Compare effects.** Start two independent room or flight runs on the same route. Equip one upgrade through the shop in only one run. Send the same timed `game.down`, `game.move`, `game.step`, and `game.up` commands to both. For the Dampener, compare limb swing in corresponding room frames. For Hush Drive, compare the increase while exposed to the same hazard using the Suspicion or Wake meter, and capture both runs before either meter saturates.

## Gotchas

- `?unlock=1` raises currency to at least 999 every time that URL loads. Navigate to `/` for the persistence check.
- The shop sells Beam Dampener, Hush Drive and Snooze Ray. The Afterburner was withdrawn (2026-11-23); a save that owns it is refunded 60 Glorbs on load.
