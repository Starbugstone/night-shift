# L8 · Prior Contact / Premier contact, deuxième passage

Krix, the Bureau’s former toaster intern, has sent an OBELISK™ slab three million years up Grimsby’s riverbed. Its newly uplifted apes have invented patent law. Temporal Dispatch gives Zib **100 seconds** to round up four field witnesses and extract Echo before the patent clerk files at dawn. This is the short arcade shift after the cruise. The report records the finishing time and Work Orders keeps the player’s fastest clear.

## The filing run

| Objective | How it plays |
| --- | --- |
| Flint’s quarry | Collect any two of three roaming apes around the quarry at **(330, 1700)**, south-west of the picket line. Every trail stays outside the sounding belts. |
| Reed’s bandstand | Collect any two of three around the bandstand at **(1050, 1800)**, south-east of the picket line. The north-east lookout walks up close to the east slab’s belt, so a witness there is picked up at the edge of the hearing. |
| Echo’s archive | The archive sits downstream at **(760, 2040)**. Hover on its east hatch **(847, 2079)** to enter the patent office. Lift Echo past the practice toss, through the shaft’s iris and out of the appeals hatch. |

Players can take the three objectives in any order. Each moving mint ring follows one ape. As at a cave entrance, the saucer must slow to 110 px/s or less and hover within 48 logical pixels for one second. Progress drains on a missed hover. Touching the shadow makes the ape bolt about 27 pixels. It settles after a quarter-second, giving a steady thumb time to follow it. Left alone, an ape scratches, walks to a lookout, gawks, then wanders home. When a troop fills, its remaining ring leaves the map.

The minimap tracks the witnesses. Edge arrows point to the nearest available member of each troop. Two counters and Echo’s portrait show which pickups remain. The sunrise dial shows minutes and seconds remaining in both flight and the cave. A sighting returns the saucer to the last pickup. Partial troops and Echo’s delivery survive a sighting or cave visit. A fresh shift starts at zero.

## Read the rock

**Arrival (2026-11-26 openings rework).** Zib comes down the dry riverbed from upstream, out of the north-east, and stops on a quiet plateau at **(1250, 150)** (zone N-east, `tests/levels-spawn-variety.test.ts`). The opening screen shows only rock. Below it, OBELISK’s three slabs hum across the whole valley: the **picket line**, slabs at **(200, 1312)**, **(754, 1300)** and **(1180, 1314)**, inner radius **75**, outer **299**, each on its own beat (6.7 s / 5.65 s sounding, 6.8 / 6.15, 6.5 / 5.85; 0.15 s longer since v0.2 round 6, when the fixed flight model put casual Ghost over its cap), so the gaps drift along the line. Every troop and Echo’s archive sit downstream of it. A finger held straight at Echo’s hatch or at any ape crosses a belt while it sounds and is caught well past the opening, at every tested start time; the naive beeline is caught there too (`tests/levels-monolith.test.ts`). The clean way is to wait for a slab’s silence, or slip into a quiet centre and out again. Krix and his toaster wait on the west plateau at **(180, 760)**, a detour before the crossing.

The 1440 × 2200 riverbed has three humming slabs. Their exact inner and outer circles turn amber 0.55 seconds before a note. Only the annulus detects the saucer during the note. Its centre stays quiet. A belt that hears the saucer turns red and burns the shared suspicion fuse. The same boundaries and hover progress are visible with reduced motion or sound off.

Echo’s split-level cave keeps the easy `echo_appeal` route from the spatial review. The old records wing is closed. A practice bone lands on its plinth between throws. Its trajectory and warning stay visible, and the first hard collision breaks it. The ape’s stone spectacles, the swinging appeal bell and the first-edition bone souvenir carry the gag through to the specimen report.

## Scoring and proof

- **Quota met** requires both troop quotas and Echo before sunrise, which comes **100 s** into the run.
- **Ghost** requires a completed quota with zero full flight sightings. A cave retry costs clock time.
- **Night owl** requires a completed quota with at least 25 seconds remaining of the 100 s run. Finishing at exactly 75 seconds earns it. <!-- shipped clock: level8 budgetSec=100 parMarginSec=25 -->

The human-model evaluator plays the moving rings, the live countdown and the cave. Independent room scores cover the appeals hatch. The flight estimate includes the four open-air pickups. The deep route and flight bands stay in force, including a catch at every tested start time for a naive beeline. Run `DIFFICULTY_LEVELS=level8 npm run difficulty` and `npx vitest run tests/levels-monolith.test.ts`. The real-pointer playthrough accepts `ONLY=L8`.

## Art handoff

| Manifest key | Native size | Direction |
| --- | --- | --- |
| `flight/ape_roaming` | 54 × 54 | Three-quarter overhead knuckle-walker, nose north. Warm muzzle, broad hands and a readable silhouette on shale. |
| `flight/ape_beamed` | 54 × 54 | Same ape and centre, belly up with arms and toes spread. Keep the background transparent. Code draws the beam and ring. |
| `room/exit_stone_hatch` | 160 × 70 | Hand-cut shale rim at the top of the appeals shaft. |
| `room/exit_stone_door` | 160 × 240 | Open cave mouth with a carved lintel for the side-exit routes. |

The view keeps Flint’s painted chestnut and tints Reed tawny in both poses to match the HUD portraits.

Keep the badlands tile, three camp roofs and hum slab. The archive’s active hatch is at native roof coordinate (247,149). Echo uses her full rig, the patent cave backdrop, plinth, practice bone, souvenir bone, appeal chime and uplift slab. Flint and Reed’s heads remain on the HUD and Work Orders. Their completed rig art can stay in the library.

Retired room routes are `flint_split`, `flint_summit`, `reed_stage`, `reed_loft` and `echo_records`. Their layouts stay in code as `RETIRED_MONOLITH_ROOMS` (unregistered, not in `RoomId`) for future reuse. Their 13 art keys (the two cave backdrops, the understudy, `room/exit_stone_door`, and the Flint and Reed rig limbs and awake heads) moved to `RETIRED_ART`, which is not preloaded; the SVGs stay in `public/art/`. Flint's and Reed's sleeping heads stay in `ART` for the HUD and Work Orders.
