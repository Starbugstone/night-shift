# Trophy room

The Bureau Evidence Locker (design: `docs/GDD-9-trophy-room.md`) has three wings, switched by tabs: **Souvenirs**
(items stolen in rooms, Field Check included), **Field finds** (each level's town pickup) and **Specimens** (the
Specimen Archive: every sleeper ever delivered, with a cosmetic "probed" stamp and per-specimen probe notes). A
wing pages itself (`‹ Wing 1/2 ›`) past 48 exhibits. The title button shows the total, `Trophy room · found/113`
in the v0.2 build (65 souvenirs, 13 field finds, 35 specimens).

## Sub-features

- `trophies-open`: from the title (270, 777) or the Work Orders trophy icon (508, 48); back at (48, 45).
- `trophies-tabs`: **Souvenirs** (103, 112), **Field finds** (270, 112), **Specimens** (437, 112).
- `trophies-detail`: tap an exhibit for its card (name, catchy description, provenance); swipe or use the arrows to move between exhibits.
- `trophies-hunt`: a missing souvenir or field find whose shift is playable shows **Go get it**, which opens that shift's memo with the hunt target (deep shifts start at the right building).

## How to get to it (user POV)

- Title → **Trophy room**, or Work Orders → trophy icon.
- Exhibits fill from reports: a souvenir when a delivered room's item is filed, a field find when the town pickup is on a report, a specimen on first delivery.

## Driving it with Playwright

- **Open and tabs.** `await game.tap(270, 777); await game.expectScene('trophies')`, then tap each tab and capture. On a fresh save every count is 0 and the silhouettes read **Not yet collected** or `???` with the memo hint.
- **After a delivery.** Deliver a room through a journey (for example `game.pilotRoom('farm_chimney')`), open the room again and check the souvenir and Doyle's archive card appear, with the stored `trophies` and `specimens` entries in `game.stored()`. Reload and check the counts stay.
- **Go get it.** Open a missing exhibit whose shift is unlocked; tap **Go get it** and expect `memo` for that shift.
- **Inspect without a long run.** `window.__nightShift.goto('trophies')`, then `active.debug.setRoom('town')`, `debug.select(itemId)`, `debug.selectTown(id)` or `debug.selectSpecimen(id)` open a wing or a card directly; `debug.foundCount`, `townFoundCount` and `specimensFound` read the counts.
- **Headless proofs.** `tests/ui-trophies*.test.ts` walk every room and level: every souvenir, town pickup and specimen has a slot with EN and FR text.

## Gotchas

- The probed stamp is rolled once at first delivery and is cosmetic: it never touches stars, Glorbs or unlocks.
- A field find seen on a failed report still counts as found; the fourth star needs the pickup on a successful run.
