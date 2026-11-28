# Night Shift verification map

Read the [skill](../SKILL.md) for launch, doctor, pointer coordinates, and evidence. The map follows the v0.2 build
(preprod `c6b483a` plus the v0.2 fix round, 2026-11-27): fourteen work orders, the Field Check practice, the
three-wing trophy room and the 2199 Dispatch finale. When the game changes, update the file for that feature.

## Baseline preconditions

- Start the skill's isolated Vite and Chromium run on a free loopback port.
- Require `Doctor passed` with a fresh, empty save (`SAVE_KEY` from `src/levels/save.ts`) and the expected checkout revision.
- Use a fresh run ID and an empty context for each independent case. Use the same context across navigation and reload within a persistence case.

## Driving conventions

- Aim at visible labels on `#game` using logical 540×960 coordinates. The helper handles letterboxing and separate pointer frames.
- Use title, Work Orders, reports and memos to prove player progression. Use URL fixtures (`?reset=1`, `?unlock=1`, `?level=N`, `?flight=N`, `?room=<id>`) to target a shift or room or to provide a shopping balance when the recipe calls for one. N is the play-order number in `window.__nightShift.workOrders`.
- In the driving bullets, `game` is the argument of the journey module described in the skill. Commands using `verify.mjs` run from the repository root. Replace the sample port and run ID as needed.
- Whole deep shifts run in `scripts/e2e-playthrough.cjs` against an e2e preview build (`ONLY=<level id>`); `verify.mjs` covers menus, single rooms and the tutorial journeys on a virtual clock.

## Proof and skip reporting

- Keep a PNG (`game.capture`) of the action and the result, plus the input and observed state in the run's trace. Confirm save changes after a same-context reload.
- When a URL or an unlock blocks a path, record the exact entry and observed scene. A headless test covers its own assertion and leaves browser entry unverified.
- Mark which routes and cases were driven. Run each affected entry point when verifying a change shared among them.

## Play order

| # | Level id | Work order | Kind | Rooms (specimen) | Town pickup |
| --- | --- | --- | --- | --- | --- |
| 1 | `level1` | Farmer Doyle Sleeps Like a Log | tutorial | `farm_window`, `farm_chimney` (Doyle) | none |
| 2 | `level2` | Laundromat Larry, Night Attendant | tutorial | `laundry_skylight`, `laundry_loading` (Larry) | `slipper_flyer` |
| 3 | `birch_bakery` | Baker Mabel's First Batch | deep, elapsed clock, 1 specimen | `mabel_stockroom`, `mabel_vent` | `cherry_pie` |
| 4 | `birch_neighbours` | While the Hendersons Are Away | deep, 210 s, 2 specimens | `nora_side`, `nora_loft`, `len_workshop`, `len_skylight` | `garden_gnome` |
| 5 | `level3` | Cul-de-Sac Sweep | deep, 420 s | Dave, Barb, Gary (two routes each) | `astronomer` |
| 6 | `level4` | Downtown Graveyard Shift | deep, 480 s | Nigel, Kev, the Mayor | `saucer_photo` |
| 7 | `level5` | Pier Pressure | deep, 450 s | Bubbles (dolphin), Pete, Sal | `obelisk_crate` |
| 8 | `level6` | Probe Compliance | deep, 450 s | Hank, Dr. Osei, Mr. Pemberton | `defibrillator` |
| 9 | `level7` | A Whole Cruise Ship | deep, 480 s | Captain Sterling, Chef Marco, Greg | `shrimp_tower` |
| 10 | `level8` | Prior Contact | time trial, 100 s | outdoor apes plus `echo_appeal` (Echo) | `krix` |
| 11 | `level9` | Clocking Out at 10:04 (1955) | deep, 380 s, storm clock | Doc, Buff, Marvin | `time_car` (moving) |
| 12 | `level10` | Ni! (1122) | deep, 183 s, needs `level9` | Rodney, the Black Knight, Tom the Enchanter | `shrubbery` |
| 13 | `level11` | The War of the Colds (1953) | deep, 292 s, needs `level9` | the forester, Van Bell, Collier | `tripod_leg` |
| 14 | `level12` | Your Town Is in the Way (2199) | deep, 220 s demolition clock, needs `level10` + `level11` | Artie, Penny, Moe | `bypass_towel` |

`levelRooms(level)` in `src/levels/levels.ts` lists the exact room ids; the table is a reading aid.

## Features

- [Title, Work Orders and memos](title-work-orders.md): Clock in, sound and language, reset, the fourteen cards, era locks, memos with their practice buttons.
- [Tutorial flight and abduction](tutorial-shifts.md): L1 and L2 steering, ring handoff, four room exits, restart choices.
- [Deep shifts](deep-abductions.md): live shifts with one to three specimens, clocks, sightings, the failed-room choice, town pickups, Field Check and the 2199 recital practice, the Dispatch finale.
- [Specimen Report and save](specimen-report.md): the four stars, pay, rank, the report stamps, saved progression.
- [Upgrades](upgrades.md): the Beam Shop's three upgrades and persistence.
- [Trophy room](trophy-room.md): the Souvenirs, Town finds and Specimen Archive wings, and **Go get it**.
