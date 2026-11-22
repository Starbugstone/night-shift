# Night Shift — Spatial Review

**Scope:** Read-only spatial audit of flight, abduction rooms, ragdoll/hitbox alignment, scale/proportions, level geometry, and UI readability at `375×690` CSS px (`deviceScaleFactor: 2`, `540×960` logical canvas).  
**Screenshots & measurements:** [/home/stone/dev/night-shift/review/neon/](/home/stone/dev/night-shift/review/neon/) ([metrics.json](/home/stone/dev/night-shift/review/neon/metrics.json)).

---

## P1 — Breaks Play or Looks Clearly Wrong

### 1. Humans spawn floating 55–100 px above beds & office chairs in all 4 rooms (and `farm_chimney` spawns Doyle in `CHAIR_POSE` above his bed)
- **Where:** [simulation.ts:109-114](/home/stone/dev/night-shift/src/abduct/simulation.ts:109), [layout.ts:59-75](/home/stone/dev/night-shift/src/abduct/rooms/layout.ts:59), [farm-window.ts:6-16](/home/stone/dev/night-shift/src/abduct/rooms/farm-window.ts:6), [farm-chimney.ts:6-20](/home/stone/dev/night-shift/src/abduct/rooms/farm-chimney.ts:6), [laundry-skylight.ts:6-8](/home/stone/dev/night-shift/src/abduct/rooms/laundry-skylight.ts:6), [laundry-loading.ts:6-8](/home/stone/dev/night-shift/src/abduct/rooms/laundry-loading.ts:6).
- **What's wrong & evidence:**
  - `AbductSimulation` wraps every solid furniture item in `rectangle(sprite, 5)` over its full sprite bounding box.
  - **`room/bed`** (`300×140` at `y = 706..846`) has a tall headboard starting at `svg y = 3`, so its solid collider top is **`y = 711`** across the entire 290 px width — **57 px above the mattress surface** (`svg y = 62` → `world y = 768`). Doyle rests on invisible air at `y = 711` (settled chest `(162.1, 654.1)`, pelvis `y = 680`, hands `y = 700`), floating 57 px above his quilt with his feet extending past the footboard (`x = 352` vs bed right `x = 326`). His slipper (`y = 685`) also floats 55 px above the quilt in `farm_chimney` and gets captured behind his belly on frame 1 in `farm_window`.
  - **`farm_chimney`** uses `{ ...CHAIR_POSE, neckX: 109, neckY: 620 }` over a bed, so Doyle hovers ~80–100 px above the mattress in a seated office-chair posture.
  - **`room/office_chair`** (`110×150` at `x = 48..158, y = 696..846`) has a solid brick collider `x = 53..153, y = 701..841`, sealing off the empty space above the seat cushion (`svg y = 75` → `world y = 771`). Larry hovers ~100 px above the seat (settled pelvis `y = 670`, hands resting on the invisible `y = 701` top), and in `laundry_loading` his feet stand on top of the left washing machine (`x = 170..290, y = 716`; feet at `x = 204..225, y = 707`). His coffee mug (`144, 630`) starts hidden behind his torso/hip and is immediately beam-captured on spawn.
  - **Screenshots:** [abduct-01-farm_window-clean.png](/home/stone/dev/night-shift/review/neon/abduct-01-farm_window-clean.png), [abduct-05-farm_window-hitbox.png](/home/stone/dev/night-shift/review/neon/abduct-05-farm_window-hitbox.png), [abduct-02-farm_chimney-clean.png](/home/stone/dev/night-shift/review/neon/abduct-02-farm_chimney-clean.png), [abduct-06-farm_chimney-hitbox.png](/home/stone/dev/night-shift/review/neon/abduct-06-farm_chimney-hitbox.png), [abduct-03-laundry_skylight-clean.png](/home/stone/dev/night-shift/review/neon/abduct-03-laundry_skylight-clean.png), [abduct-07-laundry_skylight-hitbox.png](/home/stone/dev/night-shift/review/neon/abduct-07-laundry_skylight-hitbox.png), [abduct-04-laundry_loading-clean.png](/home/stone/dev/night-shift/review/neon/abduct-04-laundry_loading-clean.png), [abduct-08-laundry_loading-hitbox.png](/home/stone/dev/night-shift/review/neon/abduct-08-laundry_loading-hitbox.png).
- **Concrete fix:**
  - Support custom collider rects (`colliders?: Area[]`) on `Furniture` in `layout.ts` and `simulation.ts`:
    - `room/bed`: mattress collider `{ x: bed.x + 12, y: bed.y + 62, w: 276, h: 74 }` (plus optional headboard `{ x: bed.x + 3, y: bed.y + 10, w: 20, h: 126 }`).
    - `room/office_chair`: seat/base collider `{ x: chair.x + 8, y: chair.y + 76, w: 94, h: 70 }` (plus optional backrest `{ x: chair.x + 8, y: chair.y + 8, w: 48, h: 68 }`).
  - Lower `BED_POSE.neckY` from `660` to `~725` so Doyle lies directly on the pillow/quilt (`y = 768`); switch `farm_chimney` from `CHAIR_POSE` to `BED_POSE`.
  - Lower `CHAIR_POSE` to `neckX: 98, neckY: 655` so Larry's pelvis settles onto the seat cushion (`y = 771`) with knees clear of the washer.
  - Move Doyle's slipper to the quilt (`y = 748`) or floor (`y = 826`), and place Larry's mug slightly in front of his hands (`x = 160, y = 700`) or on top of the washer (`x = 245, y = 686`).

### 2. `farm_chimney`: bed clips 66 px into the fireplace, masonry & chimney pot float detached, and cat overhangs shelf by 23 px
- **Where:** [farm-chimney.ts:8-19](/home/stone/dev/night-shift/src/abduct/rooms/farm-chimney.ts:8).
- **What's wrong & evidence:**
  - `bed` (`x = 22..322, y = 706..846`) overlaps `fireplace` (`x = 256..516, y = 626..846`) by **66 px** (`x = 256..322`); the bed footboard disappears behind the fireplace bricks.
  - Left masonry `{ x: 264, y: 253, w: 33, h: 137 }` floats 120 px below the ceiling (`y = 133`), 35 px left of `exit_chimney_top` (`x = 332..472, y = 144..264`), and ends abruptly in mid-air at `y = 390` — 236 px above the fireplace mantel (`y = 626`). Right masonry `{ x: 491, y: 253, w: 32, h: 373 }` sits 19 px right of `exit_chimney_top` and overlaps the right room wall (`x = 520`) by 3 px.
  - `pot_rack` (`x = 34, y = 301`) floats 168 px below the ceiling with two 10 px black stub hooks hanging in empty air.
  - `cat` (`x = 204..294`) overhangs the right end of `shelf` (`x = 111..271`) by **23 px**, leaving its hindquarters and tail floating in air (and only 2 px below the floating left masonry when awake).
  - **Screenshots:** [abduct-02-farm_chimney-clean.png](/home/stone/dev/night-shift/review/neon/abduct-02-farm_chimney-clean.png), [abduct-06-farm_chimney-hitbox.png](/home/stone/dev/night-shift/review/neon/abduct-06-farm_chimney-hitbox.png), [abduct-11-chimney-cat-awake.png](/home/stone/dev/night-shift/review/neon/abduct-11-chimney-cat-awake.png).
- **Concrete fix:**
  - Eliminate bed/fireplace overlap: use a narrower fireplace (`w = 196` at `x = 322`) or scale bed to `230 px` wide (`x = 22..252`) with fireplace at `x = 260..516`.
  - Seat `exit_chimney_top` flush with the ceiling (`y = 133`) and align the flue masonry walls directly under its brick neck (`x = 344..460`): e.g. left masonry `{ x: 312, y: 245, w: 32, h: 145 }` and right masonry `{ x: 460, y: 245, w: 32, h: 381 }` (staying clear of wall `x = 520`), or connect the chimney breast visually to the fireplace.
  - Move `cat` from `x = 204` to `x = 176` (`x = 176..266`, centered cleanly inside `shelf` `111..271`).
  - Draw ceiling chains from `y = 133` down to `pot_rack`'s two mount hooks (`x = 63` and `x = 224`, `y = 306`).

### 3. `laundry_loading`: towel cart passes 48–68 px through the second washer and clips the right wall; loading door floats 85 px above the floor behind them
- **Where:** [laundry-loading.ts:9-15](/home/stone/dev/night-shift/src/abduct/rooms/laundry-loading.ts:9).
- **What's wrong & evidence:**
  - Second `washer` spans `x = 294..414, y = 716..846`. `towel_cart` (`x = 366, w = 140, travel = ±20`) sweeps `x = 346..526, y = 716..846` — overlapping the second washer by **48 px at rest and 68 px (57% of the washer's width) at left extreme**, and poking **6 px into the right wall (`x = 520`)** at right extreme (`x = 526`).
  - `exit_loading_door` (`x = 344..524, y = 521..761`) floats **85 px above `FLOOR = 846`**, clips 4 px into the right wall (`524 > 520`), and has its bottom 45 px occluded behind the second washer and towel cart.
  - **Screenshots:** [abduct-04-laundry_loading-clean.png](/home/stone/dev/night-shift/review/neon/abduct-04-laundry_loading-clean.png), [abduct-08-laundry_loading-hitbox.png](/home/stone/dev/night-shift/review/neon/abduct-08-laundry_loading-hitbox.png), [abduct-10-loading-sign-cart.png](/home/stone/dev/night-shift/review/neon/abduct-10-loading-sign-cart.png).
- **Concrete fix:**
  - Ground `exit_loading_door` at `y = FLOOR - 240 = 606`, `x = 340` (`340..520`, moving `exitZone` to `{ x: 440, y: 638, w: 72, h: 120 }`), or draw a concrete loading dock under `y = 761`.
  - Give the patrolling `towel_cart` clear floor space that never intersects a washer or wall: e.g., place `office_chair` at `x = 26`, one `washer` at `x = 148` (`148..268`) — or two narrower washers (`w = 96` at `x = 144` and `x = 244`, ending at `340`) — and put a `110 px` cart patrolling `x = 360..405` (`travel = 22`, max right `515 < 520`), or move the door above a raised dock with the cart patrolling `x = 290..360` between a single washer (`x = 152`) and the dock wall.

### 4. Flight entry rings mismatch building art, and L2's NE power line intrudes into the Loading door ring
- **Where:** [levels.ts:56-60](/home/stone/dev/night-shift/src/levels/levels.ts:56), [levels.ts:131-135](/home/stone/dev/night-shift/src/levels/levels.ts:131), [levels.ts:154-159](/home/stone/dev/night-shift/src/levels/levels.ts:154), [farmhouse_top.svg](/home/stone/dev/night-shift/public/art/flight/farmhouse_top.svg), [laundromat_top.svg](/home/stone/dev/night-shift/public/art/flight/laundromat_top.svg).
- **What's wrong & evidence:**
  - **Level 1 Farmhouse** (centered `(420, 560)`, `260×220` → world `290..550, 450..670`):
    - `farm_window` ring at **`(292, 610)`** (`local (2, 160)`) sits on a blank west roof edge with **no window**. The sprite's actual windows are on the south wall at world `(332, 648)` and `(506, 648)` (56 px away) and the central dormer at `(415, 605)` (123 px away).
    - `farm_chimney` ring at **`(480, 495)`** (`local (190, 45)`) is **19 px SW** of the chimney sprite center at world **`(492, 481)`** (`local (202, 31)`).
  - **Level 2 Laundromat** (centered `(790, 560)`, `300×240` → world `640..940, 440..680`):
    - `laundromat_top.svg` has **neither a skylight nor a loading bay** (unlike `house_top.svg` and the primitive fallback in [props.ts:133-134](/home/stone/dev/night-shift/src/flight/props.ts:133)). Its roof instead displays a giant washer logo (`local 27..114, 36..136`), an HVAC vent (`174..264, 40..94`), and a chimney (`218..243, 127..161`). As a result, `laundry_skylight` ring `(760, 570)` sits on empty grey roof overlapping the washer logo, and `laundry_loading` ring `(870, 420)` floats **20 px north of the building** in empty yard.
    - **Collision intrusion:** NE power line `{ ax: 940, ay: 455, bx: 1070, by: 330 }` puts pole A only **78.3 px** from `laundry_loading` ring center `(870, 420)`. With saucer power-line radius `SAUCER.radius * 0.8 = 35.2 px`, the collision capsule reaches **43.1 px from ring center** — **5 px inside the 48 px lock-on circle and 17 px inside the 60 px visual ring** (`hitAtRingEdge: true`). Hovering on the east side of the ring bounces and stuns the saucer.
  - **Screenshots:** [flight-L1-zoom-farmhouse.png](/home/stone/dev/night-shift/review/neon/flight-L1-zoom-farmhouse.png), [flight-L2-zoom-laundromat-diner.png](/home/stone/dev/night-shift/review/neon/flight-L2-zoom-laundromat-diner.png), [flight-L1-02-target.png](/home/stone/dev/night-shift/review/neon/flight-L1-02-target.png), [flight-L2-03-target.png](/home/stone/dev/night-shift/review/neon/flight-L2-03-target.png).
- **Concrete fix:**
  - **L1:** Move `farm_chimney` ring from `(480, 495)` to **`(492, 481)`**. For `farm_window`, either paint a glowing west bedroom window on `farmhouse_top.svg` at `local (4, 145..175)` (keeping the ring at `(292, 610)` cleanly outside the dog's `rMax = 165`), OR move `farm_window` ring to the south-west window `(332, 648)` and shift the dog from `(400, 740)` to `(430, 775)` (or lower `rMax` to `145`) so the ring center stays clear of the bark circle.
  - **L2:** Update `laundromat_top.svg` to add a glass skylight at `local (110..185, 105..150)` (world center `(788, 568)`) and a north-side loading dock/canopy at `local (190..265, 0..24)` (world center `(868, 444)`). Move `laundry_skylight` ring to `(788, 568)` and `laundry_loading` ring to `(865, 436)`, and relocate/remove the NE power line pole `(940, 455)` so minimum clearance from the Loading door ring center is ≥ 120 px.

### 5. `SPOTTED!` overlay: witness shout bubble completely obscures `"Tap to try again"`
- **Where:** [scene.ts:806](/home/stone/dev/night-shift/src/flight/scene.ts:806), [scene.ts:823](/home/stone/dev/night-shift/src/flight/scene.ts:823), [scene.ts:922-925](/home/stone/dev/night-shift/src/flight/scene.ts:922).
- **What's wrong & evidence:** At rest (`k = 1`), the pyjama witness stands at `y = 650`, placing the white shout bubble (`"HONEY, CAMERA!"`, `56 px` tall) at `y = 440..496, x = 196..524`. `"Tap to try again"` renders at `(270, 460)` directly behind it, leaving only `"Ta"` visible on the left.
- **Screenshot:** [flight-L1-03-spotted.png](/home/stone/dev/night-shift/review/neon/flight-L1-03-spotted.png).
- **Concrete fix:** Render `"Tap to try again"` in a bottom pill at `y = 890` (drawn after `drawPyjamaHuman`), OR move the witness down (`980 - k * 270` → `y = 710`, shout bubble `y = 500..556`) and place `"Tap to try again"` at `y = 452` with a 48 px gap.

### 6. Work Orders header: rank flavour text overflows 35–111 px underneath the `Upgrades` button
- **Where:** [workorders.ts:41](/home/stone/dev/night-shift/src/ui/workorders.ts:41), [workorders.ts:158](/home/stone/dev/night-shift/src/ui/workorders.ts:158).
- **What's wrong & evidence:** The `Upgrades` button occupies `x = 336..516, y = 186..246`, leaving only **284 px** (`x = 44..328`) for the rank subtext at `y = 234`. Measured text widths ([metrics.json](/home/stone/dev/night-shift/review/neon/metrics.json)):
  - At 3–4 stars: `"Next rank at ★5 · Promising, if bonky."` = **319 px** (**+35 px overflow**, clipped to `"Promising, if bon"`).
  - At 5 stars: `"Next rank at ★6 · Lanyard privileges unlocked."` = **395 px** (**+111 px overflow**, clipped to `"Lanyard privileg"`).
- **Screenshots:** [ui-04-workorders-unlocked-probationary.png](/home/stone/dev/night-shift/review/neon/ui-04-workorders-unlocked-probationary.png), [ui-04b-workorders-5stars-toast.png](/home/stone/dev/night-shift/review/neon/ui-04b-workorders-5stars-toast.png).
- **Concrete fix:** At `y = 234`, display only `Next rank at ★${nr.minStars}` (when `nr` exists) or move `rank.flavour` inside the rank panel below `rank.title` (or pass `maxWidth = 280` / wrap to 2 lines at `13 px`).

### 7. `laundry_skylight` ceiling fan slices 3 px above the ceiling and across the skylight frame, and leaves only 29–33 px wall gaps
- **Where:** [laundry-skylight.ts:12-14](/home/stone/dev/night-shift/src/abduct/rooms/laundry-skylight.ts:12), [simulation.ts:122-125](/home/stone/dev/night-shift/src/abduct/simulation.ts:122), [draw.ts:403-411](/home/stone/dev/night-shift/src/abduct/draw.ts:403).
- **What's wrong & evidence:**
  - Hub is at `(272, 350)` with blade length `220 px` (`to: 207, r: 11` → `218 px` physics tip). At `angle = ±90°`, the upper blade tip reaches **`y = 130`**, poking **3 px above the visual ceiling (`y = 133`)** and slicing right across `exit_skylight` (`x = 264..464, y = 140..220`) and the beam emitter (`x = 270, y = 127`).
  - At `angle = 0°`, tips reach `x = 52` and `x = 492`, leaving only **33 px** from the left wall (`x = 19`) and **29 px** from the right wall (`x = 521`) — narrower than Larry's head (`64 px`) and torso (`68 px`). Even the room's own reference `route` racks up **9 bonks** (`dignity: 62%`, [metrics.json](/home/stone/dev/night-shift/review/neon/metrics.json)).
- **Screenshots:** [abduct-09-skylight-fan-sweep.png](/home/stone/dev/night-shift/review/neon/abduct-09-skylight-fan-sweep.png), [abduct-07-laundry_skylight-hitbox.png](/home/stone/dev/night-shift/review/neon/abduct-07-laundry_skylight-hitbox.png).
- **Concrete fix:** Lower hub to `(272, 415)` and shorten blades from `220 px` (`to: 207`) to **`175 px`** (`to: 164`, draw `175×28`). Upper tip stops at `y = 240` (20 px below skylight `y = 220`), lower tip stops at `y = 590` (126 px above washers `y = 716`), and horizontal wall clearance widens to `78 px` (`> 68 px` torso diameter) for clean timed passes.

### 8. Abduction mumble bubbles overflow the fixed 276 px box width on 5 of 15 lines
- **Where:** [draw.ts:481-487](/home/stone/dev/night-shift/src/abduct/draw.ts:481), [simulation.ts:15-31](/home/stone/dev/night-shift/src/abduct/simulation.ts:15).
- **What's wrong & evidence:** `draw.ts:483` hardcodes `w = 276` with no `maxWidth` argument to `fillText`. Measured widths at `600 16px system-ui` ([metrics.json](/home/stone/dev/night-shift/review/neon/metrics.json)):
  - `"I’m the captain of the pudding."` = **282 px** (spills outside both left & right borders).
  - `"The moon owes me six dollars."` = **278 px** (spills outside borders).
  - `"That’s my emergency lasagna."` = **276 px**, `"Tell the mayor I’m a sandwich."` = **275 px**, `"The cheese knows what it did."` = **274 px** (0–1 px padding, touching the stroke).
- **Screenshot:** [abduct-15-mumble-overflow.png](/home/stone/dev/night-shift/review/neon/abduct-15-mumble-overflow.png).
- **Concrete fix:** Size the pill dynamically from `g.measureText(mumble).width`: `const w = Math.min(460, Math.max(180, g.measureText(mumble).width + 36)); const textX = clamp(x, 22 + w / 2, VIEW_W - 22 - w / 2);`.

### 9. Delivery "slurp" animation yanks the human out of the exit and back through obstacles & solid ceiling toward `(270, 127)`
- **Where:** [draw.ts:328-333](/home/stone/dev/night-shift/src/abduct/draw.ts:328), [draw.ts:430-462](/home/stone/dev/night-shift/src/abduct/draw.ts:430), [simulation.ts:7-8](/home/stone/dev/night-shift/src/abduct/simulation.ts:7).
- **What's wrong & evidence:** `SAUCER_X = 270, BEAM_ORIGIN_Y = 127` is hardcoded at top-center for all rooms. Upon delivery, `draw.ts:329` translates the shrinking human toward `(270, 117)` regardless of exit location — in `laundry_loading`, Larry leaves the loading door (`479, 609`) and flies diagonally up-left **through the "NO SLEEPING ON DUTY" sign and solid ceiling**; in `farm_window`, Doyle flies out of the window back through the hanging plant and ceiling.
- **Screenshot:** [abduct-16-loading-slurp.png](/home/stone/dev/night-shift/review/neon/abduct-16-loading-slurp.png).
- **Concrete fix:** Interpolate the slurp destination to the exit opening center `(exitZone.x + exitZone.w / 2, exitZone.y + exitZone.h / 2)` (clipped to `room.exit` so the human vanishes into the window/door/chimney/skylight), and move the beam emitter X above the exit for roof exits (`farm_chimney` `x = 402`, `laundry_skylight` `x = 364`).

---

## P2 — Noticeable Issues

### 10. Flight spawn framing: tutorial pill and Zib bubble cover the saucer on start
- **Where:** [levels.ts:26](/home/stone/dev/night-shift/src/levels/levels.ts:26), [levels.ts:103](/home/stone/dev/night-shift/src/levels/levels.ts:103), [scene.ts:154](/home/stone/dev/night-shift/src/flight/scene.ts:154), [scene.ts:761](/home/stone/dev/night-shift/src/flight/scene.ts:761), [scene.ts:780](/home/stone/dev/night-shift/src/flight/scene.ts:780).
- **What's wrong & evidence:** Starting at `y = 1790` with `camY` clamped to `960` places the `120×120` saucer at screen `y = 770..890`. On Level 1 start, `"Drag anywhere to fly"` (`y = 740..800`) covers the top 30 px of the saucer while Zib's speech bubble (`y = 860..932`) covers the bottom 30 px. On Level 2 start, Zib's bubble covers the bottom third of the saucer.
- **Screenshots:** [flight-L1-01-start.png](/home/stone/dev/night-shift/review/neon/flight-L1-01-start.png), [flight-L2-01-start.png](/home/stone/dev/night-shift/review/neon/flight-L2-01-start.png).
- **Concrete fix:** Spawn the saucer at `y = 1660` (screen `y = 700`, spanning `640..760` — clear of both the tutorial pill at `y = 770` and Zib's bubble at `y = 860`) or move the tutorial pill to `y = 660`.

### 11. Level 2 flight geometry: upper diagonal power lines eliminate flanking to Loading door; middle poles disconnect from streetlights & sag diverges 12 px from hitbox
- **Where:** [levels.ts:124-129](/home/stone/dev/night-shift/src/levels/levels.ts:124), [levels.ts:154-159](/home/stone/dev/night-shift/src/levels/levels.ts:154), [scene.ts:252](/home/stone/dev/night-shift/src/flight/scene.ts:252), [scene.ts:486-511](/home/stone/dev/night-shift/src/flight/scene.ts:486).
- **What's wrong & evidence:**
  - Middle power-line poles at `(0, 1010)`, `(400, 995)`, `(680, 995)`, `(1080, 1010)` sit 45–60 px below the 4 streetlights at `y = 950` (with the outer poles half-clipped off the map edges at `x = 0` and `x = 1080`).
  - Quadratic wire sag (`midy + 14`, lower wire `+5`) places the drawn bottom wire **12 px south** of the straight physics segment at the span midpoint.
  - Upper diagonal lines `(160, 475)-(30, 340)` (30 px from left wall) and `(940, 455)-(1070, 330)` (10 px from right wall) block both flanks (`< SAUCER.radius 44`), forcing both `Skylight` and `Loading door` through the exact same central Main St approach.
- **Screenshots:** [flight-L2-fullmap-overlay.png](/home/stone/dev/night-shift/review/neon/flight-L2-fullmap-overlay.png), [flight-L2-zoom-powerlines.png](/home/stone/dev/night-shift/review/neon/flight-L2-zoom-powerlines.png), [flight-L2-02-mid.png](/home/stone/dev/night-shift/review/neon/flight-L2-02-mid.png).
- **Concrete fix:** Snap middle power-line poles to the streetlights `(90, 950)-(455, 950)` and `(625, 950)-(990, 950)` (extending to `x = 16` / `x = 1064` if full width is desired), tighten sag from `+14` to `+4`, and remove or shorten the NE diagonal line so an east flanking corridor (`≥ 130 px` wide) makes `Loading door` a genuinely distinct approach.

### 12. Floating hanging props (`farm_window` plant & `laundry_loading` sign) and side-hinged gate swing on the sign
- **Where:** [farm-window.ts:9](/home/stone/dev/night-shift/src/abduct/rooms/farm-window.ts:9), [laundry-loading.ts:15](/home/stone/dev/night-shift/src/abduct/rooms/laundry-loading.ts:15), [simulation.ts:136-144](/home/stone/dev/night-shift/src/abduct/simulation.ts:136), [draw.ts:413-427](/home/stone/dev/night-shift/src/abduct/draw.ts:413).
- **What's wrong & evidence:**
  - `hanging_plant` (`265, 188`) ring floats **63 px below the ceiling (`y = 133`)** with no cord, and its full `70×130` rectangle collider makes the empty space beside its top macramé strings solid.
  - `sign_no_sleeping` (`294, 388, 200×70`) hangs from a single 48 px wire stub (`y = 361..409`) floating **228 px below the ceiling** on its left edge (`x = 294`). Because its physics pivot is mid-left `(294, 423)`, bumps swing it downward like a boom gate into the top of the loading door while the vertical wire stays detached.
- **Screenshots:** [abduct-01-farm_window-clean.png](/home/stone/dev/night-shift/review/neon/abduct-01-farm_window-clean.png), [abduct-05-farm_window-hitbox.png](/home/stone/dev/night-shift/review/neon/abduct-05-farm_window-hitbox.png), [abduct-10-loading-sign-cart.png](/home/stone/dev/night-shift/review/neon/abduct-10-loading-sign-cart.png).
- **Concrete fix:** Draw a ceiling cord from `y = 133` to `y = 196` at `x = 305` for `hanging_plant` (and restrict its solid rect to the pot/leaves `{ x: 270, y: 256, w: 70, h: 66 }`). For `sign_no_sleeping`, connect two wires to the ceiling (`y = 133`) and pivot around top-center `(394, 388)` (or mount it to the right wall `x = 520` with a bracket).

### 13. Abduction room ceiling/floor visual trim misaligned with physics bounds and backdrop art
- **Where:** [simulation.ts:9,104](/home/stone/dev/night-shift/src/abduct/simulation.ts:9), [draw.ts:359-371,460](/home/stone/dev/night-shift/src/abduct/draw.ts:359), [bg_bedroom.svg](/home/stone/dev/night-shift/public/art/room/bg_bedroom.svg), [bg_chimney.svg](/home/stone/dev/night-shift/public/art/room/bg_chimney.svg), [bg_laundry.svg](/home/stone/dev/night-shift/public/art/room/bg_laundry.svg).
- **What's wrong & evidence:**
  - Physics ceiling ends at `y = 120`, whereas `structure()` draws the room ceiling trim at **`y = 133`** (`13 px` gap) and the saucer emitter at `y = 105..125`. The ragdoll's head sprite can protrude up to `y = 112` (21 px above the visual ceiling).
  - All 3 room backdrop SVGs place the baseboard at **`y = 807..821`**, while `draw.ts:363-369` draws a second baseboard at `y = 838`, a floor line at `y = 846`, and a dark band `y = 846..960` over the SVG floorboards.
- **Screenshots:** [abduct-05-farm_window-hitbox.png](/home/stone/dev/night-shift/review/neon/abduct-05-farm_window-hitbox.png), [abduct-07-laundry_skylight-hitbox.png](/home/stone/dev/night-shift/review/neon/abduct-07-laundry_skylight-hitbox.png).
- **Concrete fix:** Set the physics ceiling bottom to `y = 133` (`h: 130` from `y = 3`) and seat the emitter flush at `y = 133` (or raise the visual ceiling trim to `y = 120`). Remove the redundant `y = 838` baseboard line in `structure()` so only the SVG's baseboard reads.

### 14. Ragdoll arms attach at `Joint.Neck` (collar) and `nearLeg` draws over `torso`
- **Where:** [ragdoll.ts:65-71](/home/stone/dev/night-shift/src/abduct/ragdoll.ts:65), [draw.ts:236-251](/home/stone/dev/night-shift/src/abduct/draw.ts:236).
- **What's wrong & evidence:**
  - Both upper arms pivot from `Joint.Neck`, causing lifted arms to emerge from the chin/collar and Larry's far upper arm to protrude behind his upper back like a hump.
  - `draw.ts:245-247` draws `torso` before `nearLeg` (contrary to [PALETTE.md:40](/home/stone/dev/night-shift/public/art/PALETTE.md:40)), placing the thigh top in front of Doyle's belly and Larry's belt.
- **Screenshots:** [abduct-12-ragdoll-joints.png](/home/stone/dev/night-shift/review/neon/abduct-12-ragdoll-joints.png), [abduct-03-laundry_skylight-clean.png](/home/stone/dev/night-shift/review/neon/abduct-03-laundry_skylight-clean.png).
- **Concrete fix:** Draw `nearLeg` (lines 246–247) before `torso` (line 245). Offset the arm draw origin ~16 px down the torso axis (`lerp(Neck, Pelvis, 0.15)`) so sleeves originate at the shoulder rather than the throat.

### 15. Dream bubble clamps onto the human's face near top exits, and `Zzz` stamps over mumble text
- **Where:** [draw.ts:476-501](/home/stone/dev/night-shift/src/abduct/draw.ts:476).
- **What's wrong & evidence:**
  - When `Joint.Head.y < 250` (every delivery at `farm_chimney` and `laundry_skylight`), `above = clamp(y - 113, 137, 756)` puts the dream bubble (`y = 134..188`) directly over the human's head.
  - `snoreFx` draws `ui/zzz` simultaneously with `mumbleFx`, stamping `"Zzz"` across the mumble speech text.
- **Screenshots:** [abduct-13-mumble-awake-grip.png](/home/stone/dev/night-shift/review/neon/abduct-13-mumble-awake-grip.png), [abduct-14-exit-fit.png](/home/stone/dev/night-shift/review/neon/abduct-14-exit-fit.png).
- **Concrete fix:** Hide `ui/zzz` when `mumbleFx > 0`, and flip the dream bubble horizontally beside the head (`x ± 82`, clamped to `40..460`) when `y < 250`.

---

## P3 — Nitpicks

### 16. Level 1 `lamps: [{ x: 560, y: 700 }]` glows in empty grass with no fixture sprite
- **Where:** [levels.ts:81](/home/stone/dev/night-shift/src/levels/levels.ts:81).
- **Evidence:** [flight-L1-02-target.png](/home/stone/dev/night-shift/review/neon/flight-L1-02-target.png), [flight-L1-fullmap-overlay.png](/home/stone/dev/night-shift/review/neon/flight-L1-fullmap-overlay.png). Unlike Level 2 (where every lamp matches a `flight/streetlight_top` prop), Level 1 has no prop at `(560, 700)`.
- **Fix:** Add `{ key: 'flight/streetlight_top', kind: 'streetlight', x: 560, y: 700 }` to L1 `props`, or move the glow onto the farmhouse porch/window.

### 17. Flight road intersection seams (L1 & L2) and paved road art on L1 farm
- **Where:** [levels.ts:27-30](/home/stone/dev/night-shift/src/levels/levels.ts:27), [scene.ts:553-585](/home/stone/dev/night-shift/src/flight/scene.ts:553).
- **Evidence:** L1 driveway `{ dir: 'v', at: 620, from: 700, to: 1185 }` overlaps `road_h` (`y = 1180..1300`) by 5 px ([flight-L1-01-start.png](/home/stone/dev/night-shift/review/neon/flight-L1-01-start.png)); L2's `road_v` draws curb lines straight through both horizontal streets ([flight-L2-01-start.png](/home/stone/dev/night-shift/review/neon/flight-L2-01-start.png), [flight-L2-02-mid.png](/home/stone/dev/night-shift/review/neon/flight-L2-02-mid.png)); L1 farm uses town asphalt sprites instead of a dirt road (`GDD.md:71`).
- **Fix:** Set L1 driveway `to: 1180`, paint a `120×120` plain asphalt square over each `(road_h, road_v)` intersection in L2, and optionally provide dirt road sprites for L1.

### 18. Title screen perspective clash & skyline window clutter behind footer/mute button
- **Where:** [title.ts:36-86](/home/stone/dev/night-shift/src/ui/title.ts:36), [widgets.ts:187-201](/home/stone/dev/night-shift/src/ui/widgets.ts:187).
- **Evidence:** [ui-02-title.png](/home/stone/dev/night-shift/review/neon/ui-02-title.png). `title.ts:59` draws top-down `flight/saucer_top` with a side-view beam over a side-view skyline; the logo's built-in saucer overlaps the moon at `(430, 130)`; `"v0.1 · night shift build"` (`y = 930`) and the mute button (`x = 448..516, y = 868..936`) sit on top of lit yellow skyline windows (`[180, 60]` and `[510, 70]`).
- **Fix:** Move the moon to `(110, 125)`, use a side-view saucer graphic on the title screen, and move the bottom skyline windows above `y = 890` / away from `x = 448..516`.

### 19. `laundry_loading` `exitZone` right edge (`x = 515`) extends 24 px past `moveBeam` clamp (`x = 491`)
- **Where:** [laundry-loading.ts:13](/home/stone/dev/night-shift/src/abduct/rooms/laundry-loading.ts:13), [simulation.ts:159](/home/stone/dev/night-shift/src/abduct/simulation.ts:159).
- **Evidence:** [abduct-08-laundry_loading-hitbox.png](/home/stone/dev/night-shift/review/neon/abduct-08-laundry_loading-hitbox.png). Delivery still succeeds cleanly (zone center `479.5 < 491`), but the rightmost 24 px of the dashed target box cannot be directly targeted by the reticle.
- **Fix:** Raise `moveBeam` max X to `500` or trim `exitZone` right edge to `≤ 500`.

### 20. `farm_window` shows a closed paned sash; `SPOTTED!` leaves Zib's bubble drawn underneath the witness
- **Where:** [exit_window.svg](/home/stone/dev/night-shift/public/art/room/exit_window.svg), [scene.ts:520-521](/home/stone/dev/night-shift/src/flight/scene.ts:520).
- **Evidence:** [abduct-01-farm_window-clean.png](/home/stone/dev/night-shift/review/neon/abduct-01-farm_window-clean.png) (intact wooden crossbars across the exit opening); [flight-L1-03-spotted.png](/home/stone/dev/night-shift/review/neon/flight-L1-03-spotted.png) (Zib's bubble partially occluded behind the pyjama human).
- **Fix:** Draw the lower window sash raised open in `exit_window.svg`, and skip rendering Zib's bubble in `drawHud` when `this.state === 'spotted'`.

---

## Checked & Verified Correct (No Changes Needed)

- **All 72 SVG assets match manifest dimensions & fill their boxes tightly:** Every key in [art-manifest.ts](/home/stone/dev/night-shift/src/art-manifest.ts) exists with exact matching `width`, `height`, and `viewBox="0 0 w h"`; measured alpha bounds stay within `0–5 px` of all four edges ([metrics.json](/home/stone/dev/night-shift/review/neon/metrics.json)).
- **Viewport scaling & letterboxing at `375×690` (DPR 2):** `540×960` scales by `0.6944` to `375×666.7 CSS px` (`750×1380` backing store, `offX = 0`, `offY = 11.67 CSS px`). Nothing important is clipped by the letterbox.
- **Touch targets ≥ 56 logical px everywhere:** All buttons pass comfortably — Title (`320×92`, `68×68`), Work Orders (`64×60`, `180×60`, cards `492×184`), Memo (`64×60`, `360×84`), Upgrades (`64×60`, `200×64`), Flight (`64×64`), Abduct (`RESTART 94×60`), Report (`232×84`, `244×84`), Abort (`400×84`, `400×76`, `400×68`).
- **UI text fit on Loading, Memo, Upgrades, Report, Abort, and Work Order cards/toasts:** Verified visually and programmatically with longest strings and worst-case states — zero clipping on [ui-01-loading.png](/home/stone/dev/night-shift/review/neon/ui-01-loading.png), [ui-05-memo-1-full.png](/home/stone/dev/night-shift/review/neon/ui-05-memo-1-full.png), [ui-05b-memo-2-full.png](/home/stone/dev/night-shift/review/neon/ui-05b-memo-2-full.png), [ui-06-upgrades-locked.png](/home/stone/dev/night-shift/review/neon/ui-06-upgrades-locked.png), [ui-06b-upgrades-affordable.png](/home/stone/dev/night-shift/review/neon/ui-06b-upgrades-affordable.png), [ui-06c-upgrades-owned.png](/home/stone/dev/night-shift/review/neon/ui-06c-upgrades-owned.png), [ui-07-report-1-delivered-full.png](/home/stone/dev/night-shift/review/neon/ui-07-report-1-delivered-full.png), [ui-07b-report-1-rejected-full.png](/home/stone/dev/night-shift/review/neon/ui-07b-report-1-rejected-full.png), [ui-07c-report-2-longtext-full.png](/home/stone/dev/night-shift/review/neon/ui-07c-report-2-longtext-full.png), [ui-08-abort.png](/home/stone/dev/night-shift/review/neon/ui-08-abort.png), [ui-03b-workorders-scrolled.png](/home/stone/dev/night-shift/review/neon/ui-03b-workorders-scrolled.png).
- **Flight headlight origins & headings:** On both `pickup_top` and `van_top`, `(v.ox, v.oy)` (`0.45 * h` forward from center) sits squarely between the two headlight lenses and cones project cleanly along vehicle heading ([flight-vehicles-closeup.png](/home/stone/dev/night-shift/review/neon/flight-vehicles-closeup.png)).
- **Flight camera look-ahead, HUD clearance, and label clamping:** Top HUD occupies only `y = 14..78`; cruising north at `maxSpeed = 430` gives `608 px` (~1.41 s) of sightline ahead (`479 px` hovering, `399 px` sideways); off-screen `"specimen"` arrow sits cleanly below the work-order banner (`y = 210`); entry ring pills clamp horizontally into the viewport ([flight-L2-03-target.png](/home/stone/dev/night-shift/review/neon/flight-L2-03-target.png)).
- **Flight Level 1 route distinction & ring/saucer scale:** L1 Window vs Chimney present distinct timing challenges (dog bark vs pickup driveway cone); saucer (`120×120`) matches entry rings (`120×120`, lock radius `48`) nicely.
- **Abduction fan blade & awake cat collider tracking:** Rotating fan blade capsules (`from: 19, to: 207, r: 11`) and hub (`r: 22`) track the drawn sprites accurately across 0°–90° ([abduct-09-skylight-fan-sweep.png](/home/stone/dev/night-shift/review/neon/abduct-09-skylight-fan-sweep.png)); `cat_awake` raises its solid rect cleanly by `CAT_LIFT = 20 px` ([abduct-11-chimney-cat-awake.png](/home/stone/dev/night-shift/review/neon/abduct-11-chimney-cat-awake.png)); static colliders on `nightstand`, `lamp`, `portrait_cow`, `shelf`, `washer`, `fireplace`, and `pot_rack` match their sprites tightly (`inset = 5`).
- **Ragdoll limb joint continuity & bone error:** Elbows, knees, hips, and neck stay seamless with zero gaps even under 90°–120° sharp bends ([abduct-12-ragdoll-joints.png](/home/stone/dev/night-shift/review/neon/abduct-12-ragdoll-joints.png)); `maxBoneError <= 0.02 px` across all rooms, and zero bonks occur during idle spawn settling.
- **Beam reachability & route completion:** All 4 `exitZone` centers lie inside `moveBeam`'s `[47..491, 146..800]` clamp, and all 4 rooms deliver reliably under par following `room.route` without waking the specimen (`farm_window` 21.9s / 0 bonks, `farm_chimney` 21.3s / 1 bonk, `laundry_skylight` 20.7s / 9 bonks, `laundry_loading` 21.0s / 0 bonks).
- **Moonlight & shadow direction:** Flight saucer shadow (`+22, +34`), room moonlight shafts (top-left → bottom-right), and top-down sprite highlights/shadows are consistent with upper-left moonlight.
