# Upgrades

In the Beam Shop, players spend Glorbs on three upgrades. The installed card replaces the Buy button and the
purchase persists between shifts and reloads.

| Upgrade | Price | Where | Effect |
| --- | --- | --- | --- |
| Beam Dampener (`beam_dampener`) | 25 | in the room | specimens swing 30% less |
| Hush Drive (`hush_drive`) | 35 | flight and room | longer spotting fuse, wake fills slower |
| Snooze Ray (`snooze_ray`) | 80 | in the room | once per building, a double-tap knocks 40 off every wake meter |

## Sub-features

- `upgrades-open` opens the Beam Shop from Work Orders.
- `upgrades-funds` blocks purchases a player cannot afford (**Need N**).
- `upgrades-buy` installs an upgrade once and debits the cost.
- `upgrades-effects` changes limb swing, the Suspicion and Wake build-up, or (Snooze Ray) wake on a double-tap.

## How to get to it (user POV)

- Choose **Clock in**, then **Upgrades** at (426, 216) on Work Orders.
- Earn Glorbs from deliveries and stars, then tap **Buy** on the card. Use the back arrow at (48, 48) to return to Work Orders and check the balance there.

## Driving it with Playwright

Preconditions:

- Use a fresh context for the insufficient-funds check. For a purchase, earn Glorbs through reports, or use the built-in `/?unlock=1` fixture (999 Glorbs) solely for shopping setup.

- **Open.** Run `await game.tap(270, 686); await game.expectScene('workorders'); await game.tap(426, 216); await game.expectScene('upgrades')`. Capture the shop and its three cards.
- **Check insufficient funds.** On an empty save, check **Need 25**, **Need 35** and **Need 80**. Tap the buttons at (416, 326), (416, 510) and (416, 694) and assert the stored value is unchanged.
- **Buy and confirm.** With funds, tap the card's button. Capture **INSTALLED** and the updated balance. Check the saved `upgrades` list holds the id once and the debit matches the price. Tap again and check that it charges nothing.
- **Reload.** Run `await game.open()` and repeat the Open steps to see **INSTALLED** and the same saved balance. Return with `await game.tap(48, 48); await game.expectScene('workorders')`.
- **Compare effects.** Start two independent room or flight runs on the same route, with the upgrade bought in only one. Send the same timed `game.down`, `game.move`, `game.step` and `game.up` commands to both. Compare limb swing (Dampener), the meter rise under the same hazard (Hush Drive), or the wake meters after a double-tap (Snooze Ray), and capture both runs before either meter saturates.

## Gotchas

- `?unlock=1` raises currency to at least 999 every time that URL loads. Navigate to `/` for the persistence check.
- The Afterburner was withdrawn (2026-11-23); a save that owns it is refunded 60 Glorbs on load.
