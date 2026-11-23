# Title, Work Orders and memos

Clock in from the title to choose a shift, inspect your progress, or open the Beam Shop. The list holds four work orders (L1 and L2 training, L3 and L4 deep shifts with three specimens each) and three locked teasers. A memo introduces the target before each shift. The title also carries the EN/FR toggle ([language](language.md)).

## Sub-features

- `title-clock-in` lists the work orders.
- `title-mute` toggles sound and remembers it.
- `orders-locks` shows locked and playable cards (each locked order names who to deliver first), plus the locked teasers (a rotating Vrell notice).
- `orders-scroll` reveals lower work orders and teasers.
- `orders-memo` opens a playable order's memo and returns to the list.

## How to get to it (user POV)

- Open the game at `/` and choose **Clock in**. Use the speaker button at the lower right `(482,902)` to toggle mute; **EN** `(324,902)` and **FR** `(400,902)` sit to its left.
- Return to the list from Flight's quit button, the tutorial abort screen, a failed report, the deep choice screen's **Abandon shift**, and the Beam Shop's back arrow.
- Pick a playable card to open a memo. A delivered report's **Next** opens the next level's memo (L1 → L2 → L3 → L4).

## Driving it with Playwright

Preconditions:

- Start at the title with an empty save. For an unlocked L2 card, first deliver Doyle via a [tutorial shift](tutorial-shifts.md).

- **Mute and reload.** Run `await game.tap(482, 902)`. Check `(await game.stored()).muted === true`. Run `await game.open()` and confirm the muted title icon and `(await game.save()).muted === true`. Tap again and verify the stored value becomes false.
- **Clock in.** Run `await game.tap(270, 686); await game.expectScene('workorders')`. At baseline the list shows Intern, `★ 0/12`, no Glorbs, and a playable Farmer Doyle. Capture `await game.capture('fresh-orders')`.
- **Check the locked cards.** Tap `(270,558)`, `(270,762)` and `(270,910)` (L2, L3, L4 at zero scroll). The scene stays `workorders` and `active.toast` reads `Deliver Farmer Doyle first.`, `Deliver Larry first.` and `Deliver Dave, Barb & Gary first.`. Capture the deep cards with their three mugshots.
- **Scroll.** Run `await game.drag(270, 900, 270, 300, 30); await game.step(150)` and capture `await game.capture('lower-orders')`. The list glides after release and settles near its maximum (`active.scroll`). Tap a teaser: the notice is a Vrell line, not a delivery requirement. Use `await game.tap(48, 48); await game.expectScene('title')` then Clock in again to restore scroll 0.
- **Open a memo.** Run `await game.tap(270, 354); await game.expectScene('memo')`. Tap the memo body at `(270, 420)` to finish the text reveal. Capture the Farmer Doyle work-order memo. Tap `(48, 48)` to return to the list.
- **Check L2 after delivery.** From the reloaded Work Orders after the tutorial delivery, verify the L1 card's stars and best time. Run `await game.tap(270, 558); await game.expectScene('memo')` and capture the Larry memo.

## Gotchas

- Work order card positions above assume zero scroll. A drag can continue scrolling after release.
- `?unlock=1` opens every work order (L1–L4), raises Glorbs to at least 999 and saves `allUnlocked`, so the unlock persists in that context until `?reset=1`. It invalidates fresh-save lock and rank checks.
- `?level=1..4` opens a memo without proving the card is unlocked through Work Orders.
- The title, Work Orders and memo checks above were driven together with the [language](language.md) checks at `7d2bd29`.
