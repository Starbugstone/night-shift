# Title, Work Orders and memos

Clock in from the title to choose a shift, inspect your progress, or open the Beam Shop. A memo introduces the target before each shift.

## Sub-features

- `title-clock-in` lists the work orders.
- `title-mute` toggles sound and remembers it.
- `orders-locks` shows locked and playable cards, plus the locked teasers.
- `orders-scroll` reveals lower work orders and teasers.
- `orders-memo` opens a playable order's memo and returns to the list.

## How to get to it (user POV)

- Open the game at `/` and choose **Clock in**. Use the speaker button at the lower right to toggle mute.
- Return to the list from Flight's quit button, the abort and applicable report choices, and the Beam Shop's back arrow.
- Pick a playable card to open a memo. A successful L1 report's **Next** button also opens the L2 memo.

## Driving it with Playwright

Preconditions:

- Start at the title with an empty save. For an unlocked L2 card, first deliver Doyle via a [tutorial shift](tutorial-shifts.md).

- **Mute and reload.** Run `await game.tap(482, 902)`. Check `(await game.stored()).muted === true`. Run `await game.open()` and confirm the muted title icon and `(await game.save()).muted === true`. Tap again and verify the stored value becomes false.
- **Clock in.** Run `await game.tap(270, 686); await game.expectScene('workorders')`. At baseline the list shows Intern, no stars, no Glorbs, and a playable Farmer Doyle. Capture `await game.capture('fresh-orders')`.
- **Check the locked card.** Run `await game.tap(270, 558)`. The scene stays `workorders` and a notice asks you to deliver Farmer Doyle first. Capture `await game.capture('larry-locked')`.
- **Scroll.** Run `await game.drag(270, 790, 270, 390, 30)` and capture `await game.capture('lower-orders')`. Check that the lower teaser cards are visible and locked. Use `await game.tap(48, 48); await game.expectScene('title')` then Clock in again to restore the starting scroll position.
- **Open a memo.** Run `await game.tap(270, 354); await game.expectScene('memo')`. Tap the memo body at `(270, 420)` to finish the text reveal. Capture the Farmer Doyle work-order memo. Tap `(48, 48)` to return to the list.
- **Check L2 after delivery.** From the reloaded Work Orders after the tutorial delivery, verify the L1 card's stars and best time. Run `await game.tap(270, 558); await game.expectScene('memo')` and capture the Larry memo.

## Gotchas

- Work order card positions above assume zero scroll. A drag can continue scrolling after release.
- `?unlock=1` overrides the L2 lock and adds currency. It invalidates fresh-save lock and rank checks.
- `?level=2` opens the memo without proving the L2 card is unlocked through Work Orders.
