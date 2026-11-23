# Title, Work Orders and memos

Clock in from the title to choose a shift, inspect your progress, or open the Beam Shop. A memo introduces the target before each shift.

## Sub-features

- `title-clock-in` lists the work orders.
- `title-mute` toggles sound and remembers it.
- `orders-locks` opens the deep shifts on a fresh save and opens the second training shift after Doyle's delivery.
- `orders-scroll` reveals lower work orders and non-playable mission concepts.
- `orders-memo` opens a playable order's memo and returns to the list.

## How to get to it (user POV)

- Open the game at `/` and choose **Clock in**. Use the speaker button at the lower right to toggle mute.
- Return to the list from Flight's quit button, the abort and applicable report choices, and the Beam Shop's back arrow.
- Pick a playable card to open a memo. A successful L1 report's **Next** button also opens the L2 memo.
- Select L3 or L4 directly from Work Orders, even with no deliveries or upgrades.

## Driving it with Playwright

Preconditions:

- Start at the title with an empty save. For an unlocked L2 card, first deliver Doyle via a [tutorial shift](tutorial-shifts.md).

- **Mute and reload.** Run `await game.tap(482, 902)`. Check `(await game.stored()).muted === true`. Run `await game.open()` and confirm the muted title icon and `(await game.save()).muted === true`. Tap again and verify the stored value becomes false.
- **Clock in.** Run `await game.tap(270, 686); await game.expectScene('workorders')`. At baseline the list shows Intern, no stars, no Glorbs, and a playable Farmer Doyle. Capture `await game.capture('fresh-orders')`.
- **Check the locked card.** Run `await game.tap(270, 558)`. The scene stays `workorders` and a notice asks you to deliver Farmer Doyle first. Capture `await game.capture('larry-locked')`.
- **Start a deep shift.** On a fresh list at zero scroll, tap `(270, 762)` for L3 or the visible top of L4 at `(270, 918)`. Expect `memo`, tap **Start shift** at `(270, 894)`, then expect `flight`. Check `window.__nightShift.run.level.id` for the chosen level and verify that `await game.stored()` is still null.
- **Scroll to the concepts.** Twice, run `await game.drag(270, 850, 270, 330, 30); await game.step(90)`. Capture the three cards and check for **MISSION CONCEPT · NOT PLAYABLE** or **PROJET DE MISSION · NON JOUABLE**. Tap `(270, 400)`, `(270, 604)` and `(270, 808)`. Each tap stays on Work Orders, with no save written.
- **Open a memo.** Run `await game.tap(270, 354); await game.expectScene('memo')`. Tap the memo body at `(270, 420)` to finish the text reveal. Capture the Farmer Doyle work-order memo. Tap `(48, 48)` to return to the list.
- **Check L2 after delivery.** From the reloaded Work Orders after the tutorial delivery, verify the L1 card's stars and best time. Run `await game.tap(270, 558); await game.expectScene('memo')` and capture the Larry memo.

## Gotchas

- Work order card positions above assume zero scroll. A drag can continue scrolling after release.
- `?unlock=1` overrides the L2 lock and adds currency. It invalidates fresh-save lock and rank checks.
- `?level=2` opens the memo without proving the L2 card is unlocked through Work Orders.
