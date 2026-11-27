# Title, Work Orders and memos

Clock in from the title to choose a shift, inspect your progress, open the Beam Shop or the trophy room. A memo
introduces the target before each shift.

## Sub-features

- `title-clock-in` lists the work orders. The title also opens the trophy room and shows the build label (`v0.2 · night shift build`, from `package.json`).
- `title-sound-language` toggles mute and switches EN/FR; both are remembered.
- `title-reset` (**Reset progress**, shown only once there is progress) asks for confirmation, then shreds the save except sound and language.
- `orders-locks`: each order unlocks once the previous one is delivered ("Deliver Farmer Doyle to unlock"); the first 1955 delivery opens both 1122 and 1953; 2199 needs both.
- `orders-scroll`: fourteen cards; the list scrolls itself to the recommended order once that is the third or later.
- `orders-memo` opens a playable order's memo and returns to the list.

## How to get to it (user POV)

- Title (logical px): **Clock in** (270, 686), **Trophy room** (270, 777), **EN** (324, 902), **FR** (400, 902), mute (482, 902), **Reset progress** (142, 894) when shown.
- Work Orders: back (48, 48), trophy room (508, 48), **Upgrades** (426, 216). Card *i* (0-based, play order) is centred at y = 364 + 224·*i* − scroll: Doyle (270, 364), Larry (270, 588), the bakery (270, 812) at zero scroll.
- Memo: tap the body to finish the typewriter, back at (48, 48), **Start shift** at (270, 894) (see [deep shifts](deep-abductions.md) for the memos with a practice button).

## Driving it with Playwright

Preconditions: start at the title with an empty save. For later cards, deliver the earlier orders in the same context, or use `?unlock=1` when the lock itself is not under test.

- **Mute and reload.** Run `await game.tap(482, 902)`. Check `(await game.stored()).muted === true`. Run `await game.open()` and confirm the muted icon and `(await game.save()).muted === true`. Tap again and check the stored value becomes false.
- **Clock in.** Run `await game.tap(270, 686); await game.expectScene('workorders')`. A fresh list shows Intern, 0/55 stars, 0 Glorbs, a playable Farmer Doyle marked NEXT DISPATCH, and locked cards below. Capture it.
- **Check a locked card.** Run `await game.tap(270, 588)`. The scene stays `workorders` and the card asks you to deliver Farmer Doyle first.
- **Scroll.** Run `await game.drag(270, 850, 270, 330, 30); await game.step(90)` and capture; repeat to reach 2199 at the bottom.
- **Open a memo.** Run `await game.tap(270, 364); await game.expectScene('memo')`. Tap the memo body at (270, 420) to finish the reveal. Capture the memo, then tap (48, 48) to return.
- **Era unlocks.** With a save that has delivered 1955 only, check that 1122 and 1953 open a memo and 2199 stays locked; deliver one era and check 2199 is still locked.

## Gotchas

- Card positions above assume zero scroll. A drag can keep scrolling after release, and the list scrolls itself to the recommended order.
- `?unlock=1` opens every order and adds currency; it invalidates fresh-save lock and rank checks.
- `?level=N` opens a memo without proving the card is unlocked through Work Orders.
