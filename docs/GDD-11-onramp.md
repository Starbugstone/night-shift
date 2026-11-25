# Night Shift · Two orders before Maple Court

Put **Ghosts on the Payroll** and **Mission Improbable** after Spin City. Vrell takes Zib off training at Larry’s report, offers the existing Field Check, then sends Zib up Birch Lane on two small paid jobs. The first has one specimen, a motion light and a sleeping cat. The second has two specimens, a shared sunrise clock and room to practise waiting out a detector. Cul-de-Sac Sweep follows as Work Order #0005. It is still the first three-specimen shift and the first with a live cruiser.

## Why the jump needs two shifts

Measured on preprod at `6e2adb8` with `DIFFICULTY_LEVELS=level2,level3 DIFFICULTY_SEEDS=20 npm run difficulty`. Each L2 profile runs both routes per seed. Maple Court uses one whole shift per seed. These models already know the routes and use no upgrades.

| Shift | Skilled | Casual |
| --- | --- | --- |
| Spin City · Delivered / Still asleep / Night owl | 40/40 · 40/40 · 38/40 | 40/40 · 40/40 · 40/40 |
| Field Check · Delivered / clean practice clear / stars | 20/20 · 20/20 · unscored | 20/20 · 20/20 · unscored |
| Maple Court · Delivered all three / Ghost / Night owl | 17/20 · 17/20 · 17/20 | 19/20 · 14/20 · 19/20 |

The Field Check is outside `LEVELS`. A read-only probe used the same 20 human-model seeds with the practice flight map, practice room and rules, and the actual clipboard wrapper. It paired a seeded flight attempt (0–9 s hazard-phase spread) with one room attempt per seed. Both profiles locked every time with zero sightings. Median combined sim time was 20.9 s skilled and 20.4 s casual. Both profiles reached median peak wake 22/100 on each meter. Clean here means a delivery with no sighting or full wake. The “60-second drill” is a story estimate. The live practice scene does not start sunrise. The standard Spin City and Maple runs skip detours, so both pickup stars were 0/40 and 0/20 per profile respectively. Those are skip rates.

- **The quota and clock expose a second-leg stall.** There were four sunrise losses. A replay probe confirmed all four delivered Gary through his skylight, then came to a standstill on the west side of Barb’s block (x 1320–1389, y 690–815) in the next flight leg. The three skilled misses reached that point without being spotted. The casual miss had one earlier porch sighting. Successful full shifts made the 260 s par, and the independent route-and-flight estimate was 104 s skilled and 98 s casual against a 420 s deadline. More clock would give a stall more time to stall. The new curve teaches what happens after a successful delivery before asking for three in a row.
- **The casual Ghost losses came chiefly from flight.** Six casual runs were spotted. First sightings came from Gary’s outdoor CCTV (two), porch sensors (three) and the dog by Barb’s (one). Five of those runs still delivered all three. Median peak Suspicion rose from 0% at Spin City to 74% at Maple Court. Mrs. Pruitt’s binoculars and the cruiser add sectors and timing to read, but neither logged a first sighting in this sample. Isolate the binocular sweep on Birch Lane then build on Larry’s delivery van when the cruiser appears in Maple Court.
- **Room difficulty depends on the chosen entrance.** The whole-shift sample logged zero room failures. In independent tests, five of the six routes delivered 20/20 for each profile. Barb’s back door delivered 18/20 casual, with two specimen wake-ups and a 63/100 median specimen peak. Biscuit reached 25/100 median wake on that route and never caused a failure. Dave’s roof reached 55.5/100 casual. Gary’s two rooms were both 20/20 for both profiles. The route planner knows when to wait at a laser. Watch a first-time player read it, and keep shared laser and sleeper rules for the greyboxes.

**Maple Court tuning.** Keep the district, six room routes, clock, quota, named hazards and stars for the first on-ramp build. Mark Barb’s chimney as the recommended entry, based on the independent room results. Diagnose the flight stall after Gary before changing the geometry. Test a local west-side approach to Barb or shift the detector edge that blocks it if a real-pointer repro shows the same trap. If first-time players still lose Ghost repeatedly on Gary’s approach, separate the driveway sensor edge from CCTV exposure at the safe return. Repeat the matched seeds and retain the four beeline catches. Keep binoculars and cruiser in place while testing those changes.

## The dispatch curve

| Order | Place and story | Live job |
| --- | --- | --- |
| #0002 · Spin City | Main Street. Larry is filed and Vrell hands Zib the temporary lanyard. | One specimen. Drag, hover and get a body round furniture. |
| Field Check #0002-B | Birch Lane training frontage. Offer from Larry’s first clear and replay from #0003’s memo. Skip and the drill’s completion both lead to #0003. | Rehearse the porch, door lip and second wake meter with a practice decoy. No deadline, pay, attempt, archive entry or unlock gate. Preserve `fieldCheckSeen`. |
| #0003 · Ghosts on the Payroll | Birch Lane off Main Street. Vrell sends Zib to investigate a private ghost-removal outfit that bills by the haunting. | One specimen. Back out of a motion light, then keep a second sleeper quiet. Elapsed time and a Night owl par. No sunrise failure. |
| #0004 · Mission Improbable | Farther up Birch Lane, at the turn into Maple Court. The escape-room crew borrowed a security system from Gary and Pruitt volunteered to watch the rehearsal. | Two specimens and the first live dawn budget. Learn the wait–cross rhythm once outdoors and again at one indoor laser. Return from the first room and choose the next ring. |
| #0005 · Cul-de-Sac Sweep | Full Maple Court circuit. The real neighbourhood-watch job goes live. | Three specimens. Manage several detectors on the same leg, the cruiser, and indoor hazards across a larger route. |

Use Spin City’s van as a parked landmark at the Birch Lane turn, then keep the northbound road legible between jobs. Move the end of the Off Probation beat to the first paid Birch Lane memo. Head Office can still dump the triple order on Vrell after Larry. Vrell gets Zib two local calls before signing off on it. Larry’s first-clear handoff can end with “Off training, Zib. Two calls on Birch Lane, then the bulk order.” Change Maple Court’s opening to “Three before dawn this time, Zib.” Each memo makes sense to someone opening it in isolation.

### Tuning targets

Whole-shift rates are over all attempts with no upgrades. Score **Delivered**, **Ghost** and **Night owl** on ordinary runs. Measure the named fourth star in a separate run set with the intended field-find detour. These are greybox targets over 20 matched seeds.

| Work Order | Model | Delivered | Ghost | Night owl | Fourth star, detour runs |
| --- | --- | --- | --- | --- | --- |
| #0003 · Ghosts | Skilled | 100% | 95–100% | 95–100% | 95–100% |
| #0003 · Ghosts | Casual | 95–100% | 85–90% | 90–100% | 90–100% |
| #0004 · Mission | Skilled | 95–100% | 90–95% | 90–100% | 90–100% |
| #0004 · Mission | Casual | 90–100% | 75–85% | 85–95% | 80–95% |

Use six seeds for the release gate. Use floors of 6/6 delivered, 6/6 skilled Ghost and 5/6 casual Ghost for #0003, with at least 5/6 Night owl for both. For #0004, require at least 5/6 delivered and Night owl for both, 5/6 skilled Ghost and 4/6 casual Ghost. Retain the casual 90% Ghost ceiling and skilled-over-casual Ghost in both levels. Judge the finer ranges over 20 seeds. Record the post-Gary Maple Court leg separately before interpreting the remaining delivery gap.

## #0003 · Ghosts on the Payroll

**Film pitch.** A *Ghostbusters*–style ghost-removal outfit gets paid per haunting, so Pete Vexler sets his equipment to catch anything that glows, then falls asleep waiting for a customer who can see the ghosts on the invoice.

**Work Order card.** *Ghosts on the Payroll* · *Birch Lane, west end* · “One ghost hunter. His cat runs the business.” Mugshot of Pete with his goggles on his forehead.

**Shift memo.**

> **Work Order #0003 · Ghosts on the Payroll**
>
> Zib, your first paid call is a ghost-removal shop on Birch Lane. Collect Pete Vexler. Go wide of the motion light and let his cat sleep. There’s an oversized ghost invoice on the west loading apron if you want to see what they charge for a haunting.
>
> The cat is listed as management. This is the first Earth record I’ve been able to verify.
>
> — Vrell

### Flight

- Greybox a **1080 × 1440** suburb block. Start at **(540, 1250)**, with Pete’s converted repair shop centred at **(540, 460)**. Put the Roof vent at roughly **(470, 400)** and the Stockroom door at **(615, 570)**. A long cream roof, a violet exhaust hose and a squat trap-shaped loading bay establish the film premise from above. Keep the parked Spin City van off the live approach.
- Start with one existing `porch` detector on a yard post at **(540, 910)**, trigger radius **215 px**, active radius **290 px** and map fuse **1.35 s**. The post is Pete’s “apparition searchlight.” The shortest paths from spawn to either ring cross its trigger. The obvious wide approach goes via the west verge near **(190, 910)**. Leave an equally legible retreat from the edge. The lamp shows its arming arc in amber before the hard active boundary appears. The boundary and saucer fuse go red on actual exposure. A player who brushes the boundary can steer out while the fuse still has room, then see it drain in clear air.
- Keep the whole hover pocket at both rings outside the active radius. The first lesson is how far to go around a triggered hazard. Each ring has a name and a terrain landmark. No concurrent flight detector. Any pools of decorative light remain soft.

### Specimen and rooms

**Pete Vexler** fell asleep testing whether his dramatic goggles would detect his own body heat. The goggles have registered one extremely profitable ghost. Give him an original accent-colour jumpsuit with rolled cuffs and oversize goggles, using the standard ragdoll rig. His cat, **Management**, is the only secondary sleeper and uses the existing asleep/awake cat art and second wake meter.

| Route | Room and drag | Souvenir |
| --- | --- | --- |
| **Stockroom door** · recommended · `vexler_stockroom` | Pete is on a padded bench. Lift up and over the bank of bulky traps, hold above the open gap, then guide him out the wide stockroom door. The direct drag hits the rack. Management sleeps down by the floor-level rack. A collision there ripples to the cat and fills its labelled meter. The upper path gives clearance to settle the body before the final opening. | **Ghost trap** on a shelf facing the safe approach. |
| **Roof vent** · short · `vexler_vent` | Same bench, shorter route through an equipment alcove. Drift sideways past a tilted coil cart to get under a broad vent, then lift. The straight lift catches the cart overhang. Management can hear a drop against the cart. Keep enough headroom for the legs to follow into the vent. | **Ectoplasm sample** on the service shelf at the turn. |

Start both routes from the same settled pose. Seat the chest, hips and heels on the bench or leave them clear of the supports. Separate the paws, rack and souvenir from the initial body envelope. No timed object crosses the spawn. Use the existing hard interior rules with the normal release-to-hold behaviour. The first screen should show the sleeper and the lift direction so a player can recover by looking at the room.

### Evidence Locker

| Slot | Name | Catalogue text |
| --- | --- | --- |
| Souvenir · `ghost trap` | Ghost trap | Came with a foot pedal and a warning about crossing the beam. The ghost inside has requested a window. |
| Souvenir · `ectoplasm sample` | Ectoplasm sample | One jar of luminous green goo. The label says “organic.” Lab staff are arguing over which end it came out of. |
| Field Finds · `ghost_invoice` | Oversized ghost invoice | Two cold spots, one complaint from beyond the grave and a call-out fee that will haunt the next of kin. |

The **oversized ghost invoice** is the only town pickup. The rigid sandwich-board receipt has clipped corners, curled paper and a heavy red seal. Draw it at about **96 × 112 logical px** and put it on the dark west loading apron near **(180, 660)**, off the road and west of the ring approach. The whole 48 px hover catchment stays outside detector coverage. Use the one-second lock and mint marker from GDD-8. A filed invoice goes to Field Finds, and its star requires Pete’s delivery on that same shift. French can move the “haunt” pun to a bill that gives the next of kin chills.

| Archive ID | Name | Age | Height | Weight | Description | At 3 deliveries | At 10 deliveries |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| `vexler` | Pete Vexler | 43 | 178 cm | 86 kg | Owns four ghost detectors. The fifth is a cat who won’t return his calls. | Submitted a paranormal call-out bill for three trips in our hold. Attached a photo of his own arse. | Offered to remove Zib from the saucer for a flat fee. Vrell is weighing it against payroll. |

### Lines

| Cue | Copy |
| --- | --- |
| Zib, launch | “I’m glowing. Is that billable?” |
| Vrell, first delivery | “One ghost hunter in the hold. His cat has already invoiced us for the chair.” |
| Gazette, two or more sightings | **GHOST SHOP CHARGES UFO FOR TRESPASSING IN ITS OWN LIGHT** |
| Pete, mumble | “Put it on the ghost’s tab…” |
| Pickup, collected on a repeat | “They charge ghosts by the hour. Finally, a business model with no refunds.” |
| Zib, sighting retry | “Wide around the lamp this time.” |

### Clock and proof

One delivery ends the shift. Show elapsed time without a countdown or dawn wash. **Night owl by 56 s**, with an initial clean casual median of **32–44 s**. Keep enough room for a quiet stop and the **6–10 s** pickup branch. A full sighting or failed room loses Ghost for that run. Retrying from the live checkpoint can still earn Delivered. Start with at least 95% skilled and 85% casual delivery on each room route over 20 seeds. The recommended Stockroom door should reach 95% casual.

Test both flight beelines at 0, 2.5, 5 and 8 s. Each must be spotted by the motion light or fail to lock within a **60 s test window**. That cap is for the test. Each room’s direct 270 px/s drag must fail a clean delivery within 45 s at all four phases. The ordinary route, pickup route and ten-second idle proof all use the same collision and wake rules.

## #0004 · Mission Improbable

**Film pitch.** An escape-room crew built a *Mission: Impossible* vault to make customers sweat, then fell asleep rehearsing the break-in, leaving Zib to pull off the ceiling stunt for the price of two adult tickets.

**Work Order card.** *Mission Improbable* · *Birch Lane, Maple Court turn* · “Two sleepers. One dawn deadline. The laser is included in the ticket price.” Mugshot of Ethan with his padded harness and the buckle up by his chin.

**Shift memo.**

> **Work Order #0004 · Mission Improbable**
>
> Collect Ethan Hunch and Benji Dusk from the escape-room complex before dawn. Mrs. Pruitt volunteered to watch their rehearsal. When her lenses glint, watch where she’s about to look. The oversized briefing cassette is on the east ticket apron if you feel like taking the briefing with you.
>
> Gary lent them one laser. Wait until the line goes out, then give the feet time to follow.
>
> — Vrell, who has already paid your deposit

### Flight

- Greybox a **1440 × 1680** block. Start at **(720, 1570)**. The northbound Birch Lane frontage splits into two service courts beyond a theatre marquee. Put Ethan’s mock vault near **(460, 620)** and Benji’s control booth near **(1020, 760)**. Give the vault a circular door motif large enough to see on the roof, and Benji’s booth a broad ventilation grille with a dish-shaped cable reel. Connect the courts by an open cross lane north of the detector, so a first delivery leaves the saucer on the safer side. Place both approaches in view of their respective ring landmarks.
- Put Mrs. Pruitt in one upstairs window near **(720, 1090)** using the existing `watcher` detector and house, with a **roughly 460 px** range and **1.45 s** map fuse to start. Restrict the sweep to two bearings and hold each for **about 3 s**. Put their shared region on the direct central approach. At either flank a broad turnout exposes the future cone long enough to release, let her look away, then cross. Put a permanent clear return along the north cross lane. Greybox the angular overlap and the two turnouts against all four start delays before locking the roof positions. Only the watcher raises Suspicion.
- Reuse the amber binocular glint and future sector. Show the current cone as a hard edge at its actual angle, and turn its edge and the fuse red on exposure. Keep the two cones distinct through the transition. From either delivery ring, the next valid rings and the route back stay visible through the same minimap and labels. Leave the cruiser for Maple Court.

### Specimens and rooms

**Ethan Hunch** fell asleep on a stunt rehearsal mat after asking the staff for “one more take” eleven times. He wears a padded harness over a charcoal rehearsal suit. **Benji Dusk** fell asleep in the control booth after telling every customer that the laser alarm is “very immersive.” Put Benji in a loose tech vest with his headset over one ear. Both use the standard ragdoll.

| Specimen | Route | Room and drag | Souvenir |
| --- | --- | --- | --- |
| Ethan | **Service hatch** · recommended · `hunch_service` | Lift Ethan above the broad vault plinth. There’s room to park his whole body, see the emitter and cross the laser perpendicularly when it drops. Keep the last hatch wide and clear. The plinth stops a straight drag even when the laser starts off. | **Stunt harness buckle** on the near shelf just before the wait pocket. |
| Ethan | **Ceiling vent** · short · `hunch_vent` | Lift sideways out of the mat bay, then lower him horizontally over the mock pressure-floor dais. His torso dangles a few inches above the floor before the final lift. The dais and vent fascia are solid. The same loaned laser covers the exit to the vent bay. The high wait pocket is tighter, and the vent itself is clear. | **Practice diamond** in a foam display just beyond the crossing. |
| Benji | **Ticket door** · recommended · `dusk_ticket` | Lift Benji over the ticket counter, let the feet catch up above the register, then move out the wide door. A counter return blocks the direct drag. No laser in this building. | **Operator headset** on the counter’s open end. |
| Benji | **Cable hatch** · short · `dusk_cable` | Carry Benji around the side of the coiled cable cart and up into a broad hatch. The wheel arch under the hatch blocks a straight lift. Hold for the trailing legs before the last ascent. | **Operator headset** on the shelf over the cart, reachable from this approach. |

Keep each room to one short cutaway, at most two screen widths. Matte black panels, brass stanchions and a rubber crash mat make the heist gag read before the laser does. For Ethan, start with the existing laser cycle at **7.5 s** with **4.5 s off**. Use an amber rearming line and a sharply drawn live beam whose rendered segment matches its collision area. A strike trips the alarm and shows the red failure cue. Place the early warning, crossing and safe waiting space in view together. Avoid a timed second obstacle and put the emitter well beyond the idle body envelope. Keep Ethan supported by the crash mat and Benji in a settled chair pose with all limbs clear. The souvenir spots and actor supports must pass the idle test before tuning anything else.

### Evidence Locker

| Slot | Name | Catalogue text |
| --- | --- | --- |
| Souvenir · `stunt harness buckle` | Stunt harness buckle | Rated for one adult and the complete weight of his own bullshit. |
| Souvenir · `practice diamond` | Practice diamond | Looks priceless at dramatic lighting levels. Under Bureau fluorescents the sticker says ABS. |
| Souvenir · `operator headset` | Operator headset | Left channel connects to the booth. Right channel connects to Benji breathing directly into your ear. |
| Field Finds · `briefing_cassette` | Oversized briefing cassette | Marked SELF-DESTRUCT. After five seconds it clicks twice and asks you to turn it over. |

The **oversized briefing cassette** is the only town pickup. Put it on a stand on the east ticket apron around **(1255, 610)**. Use a **112 × 86 logical px** shell with a clear twin-reel silhouette, oversized tape label and one folded corner. Let the code render any label. Keep both the sprite and hover circle beyond the watcher’s entire fan, any roof and ticket apron traffic. Use the standard mint marker, minimap diamond and hover. The pickup earns the fourth star when both specimens are delivered that shift. Both new pickups are objects. Reuse the current animated rig convention for any person pickup added in a later pass.

| Archive ID | Name | Age | Height | Weight | Description | At 3 deliveries | At 10 deliveries |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| `hunch` | Ethan Hunch | 39 | 173 cm | 74 kg | Insists he did every stunt himself. Technically true of the nap. | Requested another take on the probe. The first one didn’t show his good side. | Has learned to hang perfectly still in the beam. It’s the landing that bruises his ego. |
| `dusk` | Benji Dusk | 34 | 181 cm | 78 kg | Escape-room tech. His emergency button opens the door and charges you for a hint. | Asked for the beam’s admin password. Offered to reset it to his birthday. | Has started narrating the probe on comms. Nobody wants the director’s commentary. |

### Lines

| Cue | Copy |
| --- | --- |
| Zib, launch | “I accept the mission. I decline the group photo.” |
| Vrell, first delivery | “Two agents extracted. Gary wants his laser back. Pruitt wants a copy of the footage.” |
| Gazette, two or more sightings | **UFO FAILS TO ESCAPE ESCAPE ROOM UNDER THE TIME LIMIT** |
| Ethan, mumble | “Lower me another inch…” |
| Benji, mumble | “Have you tried unplugging it?” |
| Zib, return to flight | “One aboard. Same clock. Next ring.” |

For French, carry the mission-title cadence with a short rhyme such as *Mission improbable* and keep the plain-language warning independent of the film nod.

### Clock and proof

Start the shared clock at **2:00**, with dawn at **6:00** after **210 real seconds**. Night owl requires **110 s left**, so **par is 100 s**. The clock is live in flight and abduction and keeps its value through the retry choice, using the same charge rules as Maple Court. A delivered first specimen stays aboard on a sighting or failed second room. Aim for a **62–85 s** clean casual median and **8–14 s** for the pickup branch. Sunrise can be reached in a deliberately slow run. Keep the existing dawn warning and one familiar timer in both HUDs. The first flight return shows **1/2** and points the camera at traversable space near the checkpoint.

Over 20 seeds, each room should deliver at least **90% skilled** and **80% casual**, with the recommended route for each sleeper at **90% casual** or better. Test both delivery orders with the bot, plus the recommended approaches under human input. At each of the four start delays the existing shortest-open-path flight pilot must get spotted or time out before the full quota. Also test direct holds from spawn to each initial ring, to keep the lesson on the first leg. If an untimed route slips through, move the detector or the throat before reducing the fuse. Each room must reject the direct 270 px/s drag within 45 s at all four start phases. Catch the straight drag on the visible set geometry even in a favourable laser phase.

## Shared implementation details

### Flight, clocks and reports

- Register both maps as deep levels with one and two targets. Add the two-target tuple to `DeepMap`. Use the map’s target count for completion copy, counters, report stamp and the Delivered condition in `computeDeepStars`. `DeepRun` already completes from its target array. Preserve L8’s troop tallies and distinct Ghost rule and L9’s time-car and deadline. Read the cap and labels from the level config in both HUDs and in the whole-shift evaluator.
- Give #0003 an explicit par-only clock mode. Keep accumulating active shift time and growing detector phase, with no sunrise deadline. Use the existing elapsed-time presentation and make the spare-time row read as elapsed time against par. Replace tests that assume a finite sunrise budget with a harness time cap for this mode. Pass through #0004’s 210 s config via the ordinary sunrise HUD and report path. Retain the current checkpoint, sighting and room-choice behaviour.
- Add both memo, route and star families to `en.ts` and `fr.ts`, including exact localized `memoHint` strings. The Work Order #0003 launch line can teach “Go wide of the motion light.” #0004’s opener can point out the binocular cue and put the first readable laser instruction at the wait pocket. Flight lines use the shared speech layer and `readSeconds()`. At 375 × 690, check the first screenshot for a readable hazard, ring entrances, prop silhouettes and a single clear next action even if the player skipped practice and the memo.
- Add first-clear, retry, ambient, pickup collected/left behind and souvenir copy through the existing `humor`, `report` and `report-extras` paths. Reuse the Gazette threshold of two sightings. Give each order one level-specific cover story and headline family. Use the existing found/left-behind row, preserve the first-clear and sunrise priorities, and keep second-leg return chatter local to #0004.
- Each room gets a base item directly. The two Benji routes deliberately share an item ID. The current catalogue has 41 souvenirs, eight field finds and 23 specimens. The proposed additions bring those counts to 46, 10 and 26. All 46 souvenirs fit in the current 48-slot wing. Check both Benji routes against `ROOMS`, `SOUVENIR_SWAPS` and the shared catalogue slot. Register both field finds in `PICKUP_SIZE` and all three Archive dossiers with `at3` and `at10` lines. Translate all names, plurals, descriptions, statuses and hints into EN and FR. Use the existing cosmetic probe behaviour for these three specimens.

### Order numbers and saved progress

| Work Order | Save key | Card |
| --- | --- | --- |
| #0001–#0002 | `level1`, `level2` | Doyle Farm, Spin City |
| #0003 | `birch_ghosts` | Ghosts on the Payroll |
| #0004 | `birch_mission` | Mission Improbable |
| #0005–#0011 | `level3` through `level9` | Maple Court through Crest Valley |

Insert the two IDs in `LEVEL_IDS` and the matching definitions in `LEVELS`. Array order drives the sequence. Use `num` for the displayed order and stable IDs for old level-specific logic. Audit the Field Check’s hard-coded index and return/skip labels, `num - 1` in the evaluator, memo addressees, e2e selection, and difficulty-tier and legacy unlock tests tied to displayed numbers. In particular, the Crest Valley “Agent” addressee and archive header belong to `level9`, now #0011. Renumber the English and French card, memo subject and other player-facing order labels, including the #0002-B drill’s destination. Keep the content IDs for Dave, Gary, Pruitt and every existing room, find and trophy. The old `legacyDispatch` grant applies to the stable ID set `level3` through `level7`.

Use a `night-shift-save-v3` storage key so an older build on the same origin can still write its own v2 format. On first v3 load, import valid v2, with v1 as the legacy source when needed, and write the migrated save. Keep the two old keys available to those builds. Existing level progress, fourth stars, best times, attempts, found IDs, Glorbs, upgrades, reports, language, debug unlocks, practice flag, specimen/probe counts and trophy provenance keep their values. Both new level records begin empty.

- A fresh save unlocks #0003 from Spin City, #0004 from #0003, then Maple Court from #0004. A v2 import with only Spin City delivered follows the same path.
- Give imported saves that attempted Maple Court or delivered any original `level3`–`level9` order a persisted access flag for both new orders and Maple Court. Also preserve any pre-existing legacy unlocks. The flag grants access to the whole bridge without making up deliveries, rewards or finds. Returning players with a cleared original deep order keep their next forward dispatch highlighted and can find the bridge from Work Orders. A player whose furthest progress was an attempt on Maple Court sees the bridge as their recommended next stop and can still retry Maple Court. Preserve the progression successor for old out-of-order clears.
- Make the access import idempotent. A reset writes an empty v3 save so an old record stays ignored. Verify a production/preprod reopen, rerun of each import, and a reload after earning a bridge star.

`MAX_STARS` goes from **35 to 43**, with two new sets of four. Keep the rank thresholds at **0 / 3 / 5 / 8 / 11 / 15 / 19** so saved ranks carry over and the earlier shifts can pay for equipment. A full clear of the first four cards brings 15 stars, and Fleet Admiral of Naps first becomes possible at Maple Court. Use the normal deep pay for both orders. That makes upgrades available earlier, so tune and prove the on-ramp with zero upgrades.

### Art pack

Use original vector designs and primitive fallbacks. Reuse suburb tiles, roads, kerbs, Spin City van, Pruitt’s house/window, the porch mount, cat poses, bench and chair poses, exit trims, shelves, sleeper tells, laser hardware and the existing HUD. Check final sprite footprints against greybox colliders and art sizes. Global rules for detectors, wake, beam and backdrop lighting stay shared.

| New keys | Count | Suggested native size and silhouette |
| --- | ---: | --- |
| `flight/vexler_shop_top`, `flight/hunch_vault_top`, `flight/dusk_booth_top` | 3 | 300×240, 320×240, 260×200. Exhaust hose, vault disc and cable reel read from overhead. |
| `flight/pickup_ghost_invoice`, `flight/pickup_briefing_cassette` | 2 | 96×112, 112×86. Three-quarter angles and clear profiles on the ground and in Field Finds. |
| `human/{vexler,hunch,dusk}_{head,head_awake,torso,upper_arm,lower_arm,upper_leg,lower_leg}` | 21 | Standard L1–L3 rig and manifest sizes. Goggles, padded straps and one-ear headset distinguish the three portraits. |
| `room/bg_ghost_shop`, `room/bg_escape_room` | 2 | 540×960 each. Atmosphere and wall treatments only. |
| `room/ghost_trap_rack`, `room/ghost_coil_cart`, `room/vault_plinth`, `room/stunt_mat` | 4 | 220×120, 140×120, 180×110, 240×36. Match outlines to the colliders and leave space to read the tell. Reuse existing counter and cable-sized cart art where it fits. |
| `room/ghost_trap`, `room/ectoplasm_sample`, `room/stunt_buckle`, `room/practice_diamond`, `room/operator_headset` | 5 | 56×42, 40×52, 48×32, 46×36, 48×44. Read from the route and in the trophy silhouette. |

Total first-pass cost is **37 SVG keys, two maps, six playable room routes and three specimen rigs**. The four level/room data modules are the main new code. Existing detectors cover both shifts. Use retained Pixi views for any bespoke props. Add the icons to the art contact sheet and use the two field-find models at normal flier scale when checking the phone view.

## Build split and acceptance

| Pass | Owner and scope | Proof |
| --- | --- | --- |
| 1. Dispatch and scoring | **Coordinator** owns `levels/{types,levels,run,save,progress}.ts`, IDs in `contracts.ts`, the clock mode, target-count stars/reports, Field Check routing and numbers. | Fresh, L2-only import, Maple attempt, later delivery including sparse/out-of-order saves, v1 legacy, reset and reload. Verify 1/1, 2/2, 3/3 and L8 troop counts, deadline and par boundaries, skip/replay, next dispatch and fourth star versus filed pickup. |
| 2. Flight greyboxes | **Flight** owns `src/levels/deep-birch-ghosts.ts` and `deep-birch-mission.ts`. Reuse porch and watcher fields. Author road junctions, ring positions, lookout timing and pickup pockets, with a clean pointer approach to each exit. | `flight-autopilot`, `flight-roads`, layout and pickup-figure tests, both new maps in `scripts/pixi/check-bubbles.mjs`, four beeline start delays, flight restart and next-leg checkpoint. |
| 3. Room greyboxes | **Rooms** owns `src/abduct/rooms/deep-birch-ghosts.ts` and `deep-birch-mission.ts`, the six exits, poses, routes and item placement. | `abduct-spawn` across `ROOMS` and Field Check, `abduct-deep`, souvenir reach, direct-drag regressions, mouse/touch jitter and release-to-hold with the authored exits. Both wake meters start at zero. |
| 4. Art | **Art** owns the keys above, with final sizes agreed with the flight and room owners, plus the contact sheet. | Real phone previews of pickups, roofs, sleeper portraits and cutaways, including missing SVGs and reduced-motion tells. |
| 5. Copy and catalogue | **Story/UI** owns EN/FR work orders, memos, jokes, radio and report hooks, Gazette variants and new Evidence Locker entries. | `flight-collectible` covers unique pickups and both memo hints, `ui-trophies*` covers items, finds and specimen entries, and `ui-report*` covers the report rows, Vrell comment priorities and localized wrapping. |
| 6. Tune and play | **Difficulty** owns the two new bands, standard and pickup-first samples and seeded beelines. **Verification** drives the phone build. | Run `DIFFICULTY_LEVELS=birch_ghosts,birch_mission,level3 npm run difficulty` at 6 and 20 seeds, then `npm test`, typecheck and build. Extend the real-pointer playthrough and bubble script to enumerate from stable IDs. |

Measure skip and detour runs via `DeepRun`, live flight and simulated abduction. Record all four beeline phases, first sighting source, time per leg and peak Suspicion, room failures, secondary-sleeper wake, clearance, retries and all four star rates. Keep the existing early deep gates for par usage (30% minimum), casual median peak Suspicion (5% minimum), average route median peak wake (20 minimum) and 80 px obstacle-or-mechanic approach. For each level, prove one four-star detour with the bot and at least one per model over 20 seeds. Keep the room-route samples separate from whole-shift samples. A high result from the route-aware model needs a real-thumb check.

Use the project’s [browser verification recipes](../.claude/skills/verify-night-shift/SKILL.md) with a fresh save at **375 × 690**. Watch first-time players after the Spin City report, including a group that skips practice. Record whether they see the warning before crossing, which ring they choose, whether they regain control after exposure, where they stall in the room, whether they find the second target and whether they finish Maple Court. Verify both languages, muted and reduced-motion tells, and the four-star report plus Trophy Room reload. Retain the Field Check as optional practice and target the post-Gary approach for diagnosis before changing Maple Court’s clock or challenge. The two pitches, timing and targets are proposals for greybox review.
