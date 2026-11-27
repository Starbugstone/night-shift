# GDD-14 · Your Town Is in the Way (Grimsby, 2199)

Grimsby is in the way of a hyperspace bypass. Dodge the demolition fleet’s poetry guards and get three sleeping residents onto the census before the fleet can flatten the town.

## The shift

**Work Order #0014** with the Birch Lane orders included. Stable ID `level12`. The season finale becomes selectable after a delivery in both [1122](GDD-12-1122-grail.md) and [1953](GDD-13-1953-tripods.md), in either order. Use Artie’s portrait on the card. After the finale the dial goes quiet and delivered dates stay replayable.

Krix sold the right of way for a hyperspace bypass through OBELISK™ and listed Grimsby as vacant. From the porthole tank by Vrell’s desk in the present, Bubbles pulls the planning notice from the 2199 records and forwards it to Dispatch. Vrell recognizes Krix’s docket from 1122. Three local census entries overturn the sale. Every delivery counts toward the quota, even after a sighting or a room retry. The ruling closes OBELISK™’s Dispatch claims and sends Krix the bill.

Zib flies from present-day Dispatch to Grimsby’s harbour bend in 2199. The **DON’T PANIC** sign stands above the fork on arrival. Back at the Bureau after the shift, Zib finds the empty porthole and Bubbles’ farewell. Keep the sign, towel, answer display and goodbye in their own moments. [Film synopsis](https://d23.com/a-to-z/hitchhikers-guide-to-the-galaxy/) · [English publisher’s guide](https://www.panmacmillan.com/blogs/science-fiction-and-fantasy/hitchhikers-guide-to-the-galaxy-book-series)

## Flight

Greybox **1800 × 2320** logical px with the origin at the top left. Retain the familiar Grimsby harbour bend and the lighthouse silhouette beyond the west seawall. Put the demolition barges in the sky beyond the playable streets. The three rooftops, the wide fork and the ring markings should read before the painted fleet does.

**Openings rework (2026-11-26).** Zib now slips in from the north under the two barges and flies south. The launch used to face the opening recital across every straight line out of the spawn; that recital now stands at the far end of the avenue, guarding Moe's bureau, out of the opening screen. A flagged bypass cordon across the middle gardens leaves the avenue as the only gap, so every blind run into Moe's block meets the poet (`tests/levels-spawn-variety.test.ts`, AGENTS.md "no spawn gate"). From under the west barge the garden door is the natural first stop, so planned runs keep the old room mix (garden door, ticket loft, side returns). A centre launch made Artie's bathroom hatch the nearest ring, which shifted the room mix and made the shift easier than its bands. The flight is a few seconds longer than before, so the demolition clock moved from **188 s** to **192 s**, with the same **26 s** Night owl margin.

| Place | Centre | Rings and approaches |
| --- | --- | --- |
| Launch under the west barge | (300, 250) | On the west lane just south of the quay street (**y = 130**), clear of the HUD. The **DON’T PANIC** sign stands over the lane at **(310, 590)**, below the start banner. Artie's garden door is straight down the lane; the quay street leads east to the avenue (**x = 900**), which runs south to the recital at Moe's door, and to the east lane (**x = 1490**). |
| Artie’s house | (425, 795) | **Garden door** (270, 795), recommended and labelled below. **Bathroom hatch** (530, 675), labelled above. |
| Transit office | (1375, 795) | **Service door** (1530, 795), recommended and labelled below. **Ticket loft** (1270, 675), labelled above. |
| Complaint bureau | (900, 1935) | **Side returns** (1080, 1950), recommended and labelled above. **Voice vent** (900, 2040), labelled below. |
| Connector streets | **y = 130**, **y = 1700** | The quay street along **y = 130** joins the launch to both outer lanes and the tops of Artie's and Penny's blocks. Moe's rail along **y = 1700** runs behind the avenue recital and joins both lanes. East approach to Side returns uses **(1490, 1700) → (1080, 1700) → (1080, 1950)**. From the west, join the same rail. |
| Bypass cordon | **y = 1240** | Flagged cable (`wire`, `bunting`) from **x = 400–760** and **1040–1400**. It leaves both outer lanes open and a gap at the avenue, inside the recital's cone. |
| Harbour towel rack | (175, 480) | Towel ring at **(180, 430)**. The bay branches west off the west lane at (310, 518), between the launch and Artie's garden door, then opens back onto the same road. |

### Poetry guards and the demolition dozer

The fleet’s Recital Division reads from fixed lecterns. A recital sweeps a defined sector. On the ground, a trapped listener passes out. In the air, a full dose sends Zib fleeing back to the checkpoint. The three sleepers are indoors and use the normal room rules. Zib gives the player the line under **Copy** once, when the first poet comes on screen. The memo practice starts on the avenue at **(900, 850)**, 130 px outside the avenue recital's reach, and ends at either outer lane. It files no delivery, star or pickup.

Use existing `camera` detection and its sinusoidal heading, `base + amp × sin(rate × t + phase)`, on the shared hazard clock. East is 0 rad, south is +π/2. A `reciter2199` camera skin and a poetry sighting cause carry the fiction through the map and report. Keep the shared fuse, checkpoint, collision and lock rules. Start `map.fuseSec` at **0.72 s** (0.80 s before the 2026-11-26 fuse staircase). Origins below are also the guard sprite centres. The lectern stays put and the guard turns with the sampled heading.

| Reciter | Origin | Range | Half angle | Base | Amp | Rate | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Avenue recital (Moe's door) | (900, 1640) | 660 px | 0.91 | −1.57 | 0.14 | 0.65 rad/s | 0.35 |
| West lectern | (655, 965) | 340 px | 0.36 | −2.17 | 0.55 | 0.70 rad/s | 0.4 |
| Complaints lectern | (900, 2260) | 285 px | 0.32 | −1.36 | 0.58 | 0.70 rad/s | 4.3 |

- The active cone has a hard pale edge. Show a dashed **amber** edge at the cone heading sampled **0.45 s ahead** whenever the predicted edge advances into clear space. Use the exact sampled shape for the preview with faint fill confined to that shape. The current edge and saucer fuse turn **red** on live exposure. **Mint** is reserved for Zib, entries and the towel lock. A static sign, floor arrows and lamp spill have no detector edges. All cues retain their geometry and timing in reduced motion and with muted audio.
- Place one of the two listeners at **(660, 1425)** on the edge of the avenue recital. Keep the other at **(831, 2092)** by the complaints lectern. Each slumps when the live edge reaches its anchor and straightens when it clears. Sample the same cone predicate and clock in the view. Use a static pose swap in reduced motion. Both listeners are scenery. On the first approach to the opening recital, play the numbered ode under **Copy**. Subsequent approaches use the next verse in the three-line rotation, wrapping after the third and respecting the existing speech cooldown. Use `FLIGHT_BUBBLES`, `readSeconds()` and alien babble. Let Zib’s first-leg line finish before the verse starts. A full fuse uses the standard spot delay and flight respawn, with the poetry caption. It cancels the interrupted lock and preserves the timer, last delivered ring and earlier deliveries.
- Pose Zib with fingers in their ears when the saucer enters the existing amber preview. Hold that pose in reduced motion. The live edge and fuse still show the actual exposure. Use the existing cockpit rig and test the pose at phone size.
- **East demolition dozer.** Use the existing `steward` route and cone with a dozer skin. The blade turns with the chassis, and the lamp uses the cone’s **18 px** forward offset. Run the dozer on the street north of the ticket office, **(1270, 400) ↔ (1270, 600)** at **72 px/s**, **1.0 s** turn dwell, **195 px** range, **0.80 rad** half angle and zero torch sweep. Show the next turn’s bounded cone in amber, with a hard live edge and red on exposure. Mark the southwest approach from the Ticket loft turnout and show where the southbound lamp crosses it. The lower street, outside lane and Service door stay clear at all phases. The dozer’s lamp uses standard sighting and recovery.
- Target starting safe pockets for the fast rings are **(535, 565)**, **(1490, 560)** and **(760, 375)**. Measure their entire usable hover area against the sweep envelope. Players can wait outside the cone until the amber edge moves away, make the short approach, brake and lock. At each fast entry leave a quiet interval of **at least 2.2 s** for braking and hovering. Leave the entire usable area of each recommended ring clear over a full cycle. The return from each fast entry must reach a safe pocket within the standard checkpoint grace once the player starts to steer.

**Ticket loft exposure.** The lock disc has radius **48 px** and is centred at **(1270, 675)**. On the southbound pass, the lamp is at `y + 18` for chassis position `y`. The entire disc comes into range at `y = 675 + 48 − 18 − 195 = 510`. Both cone edges contain the whole disc until `y = 675 − 18 − 48 / sin(0.80) ≈ 590.09`. Every lock point is exposed together for `(590.09 − 510) / 72 ≈ 1.11 s`, longer than both the **0.72 s** base fuse and the **0.90 s** Hush Drive fuse (`0.72 / 0.8`).

The patrol cycle is `2 × (200 / 72 + 1.0) ≈ 7.56 s`. Measured from the start of the southbound pass, the cone overlaps some of the disc from about **0.19 s** through **3.19 s**, including the turn. This leaves `7.56 − (3.19 − 0.19) ≈ 4.56 s` of shared clear time. The 48 px turnout pocket at **(1490, 560)** starts **172 px** east of the patrol. Straight passes and the west-facing south turn reach at most `195 × sin(0.80) ≈ 140 px` east. At the north turn, the nearest point of the pocket is `√(220² + 160²) − 48 ≈ 224 px` from the chassis, beyond the **213 px** maximum reach including the lamp offset. Verify a real-pointer approach, one-second hover and exit within the shared clear window in the greybox.

**Quay crossing exposure.** At the old crossing **(1270, 250)**, a hovering saucer enters range when the northbound chassis reaches `y = 250 + 18 + 195 = 463`. It stays lit for `(463 − 400) / 72 = 0.875 s` on the straight. At the turn the saucer is **150 px** from the chassis. With the **18 px** lamp offset, the cone turns through `0.80 − asin((18 / 150) × sin(0.80))` before its edge clears the saucer. At **π rad/s** that adds **0.227 s**, for **1.102 s** of continuous exposure against the **0.72 s** base fuse and **0.90 s** Hush Drive fuse. The lamp reaches north to `400 − 18 − 195 = 187`. At **y = 130** the rail has **57 px** of clearance, leaving **9 px** at the edge of a **48 px** pocket and **0 s** of exposure across the full cycle.

**No straight-line win.** The launch is open: no fixed detector covers every line out of it. The rule is the every-ring matrix (v0.2, 2026-11-27): a thumb held straight from the launch at **each** of the six entry rings must be spotted or fail to lock at **0, 2.5, 5 and 8 s** (`directApproaches` in `tests/difficulty/beeline.ts`). It replaces the earlier standard, which only asked that the blind shortest-path controller's whole itinerary be caught at Moe's. That itinerary check still runs: the controller takes the nearest rings first (Artie's bathroom hatch and Penny's ticket loft, under the west lectern and the dozer), then heads for Moe, and the cordon funnels every blind run into Moe's block, from the launch or either fast door, through the avenue gap and into the recital (`flight-2199` proves it with the recital and the cordon alone). Both of Moe's rings meet the every-ring rule. Artie's and Penny's four rings do not yet: straight holds lock cleanly at 14 of their 16 entry/delay pairs (Artie's garden and Penny's service door at all four delays, the bathroom hatch at 0, 2.5 and 5 s, the ticket loft at 0, 2.5 and 8 s). They are pinned in `PENDING_DIRECT` and wait for a rework. The garden is 545 px straight down the lane from the launch, on the opening screen. Timed door guards that catch every tested delay (lamps lighting a ring 75–80% of each cycle, with 2.5–3.1 s quiet windows) cut casual Ghost to 2–5/20 against the 7/20 target below. The rework needs a launch further from those rings, or pressure on the way that a careful route can wait out in a quiet pocket. Keep both outside lanes, the quay street and Moe's rail free of exposure over a full cycle: they are the clear way round after a sighting or a delivery. Time the inner lecterns and the east dozer to save travel.

## Three sleepers and six exits

All three use the standard humanoid ragdoll and deep wake rules. Moe’s standby sparks, frown and reboot sounds dress the same physics. The two rooms for each specimen start on the same settled pose in a quiet bay. The recommended route adds travel and lets the player recover from a swinging limb. The fast route removes a bend and puts its timing decision after the first visible obstacle.

| Sleeper and sleep excuse | Route | Drag and souvenir |
| --- | --- | --- |
| **Artie Duvet** fell asleep on his front-room sofa in the dressing gown he wore lying in the mud in front of a bulldozer to save his house. | **Garden door** · `artie_garden` | Steer around the end of a parked demolition blade and settle above the shoe bench before lowering through the garden door. The blade’s static collider catches the direct pull. Lift the **bowl of petunias** from the bench shelf. |
| Artie | **Bathroom hatch** · `artie_bath` | Pull sideways clear of the tall airing cupboard, then lift into the bathroom shaft. Let the hanging shower rail swing away before raising his trailing feet. The cupboard catches a straight lift. Collect the **spare dressing gown** from the peg on the turn. |
| **Penny Thumb**, stranded travel-guide writer and habitual hitchhiker, stuck out her thumb at the last shuttle. The driver waved back. She dozed on a transit-office bench. | **Service door** · `penny_service` | Lift past the ticket counter and stop in the empty queue bay. Let the baggage cart roll under, then bring Penny along the landing and out the side door. The counter blocks a straight drag. Collect the **ear fish** off the counter’s far ledge. It sits in a clear jar. |
| Penny | **Ticket loft** · `penny_loft` | Round the ticket cabinet and hold over the locker bank. Lead feet through a timed luggage shutter before climbing to the roof. Start with a **7.8 s** gate cycle and **4.2 s** of full crossing clearance. The cabinet blocks a direct lift at every phase. Collect Penny’s chunky **electronic travel guide** at the loft turn. Typeset **GRIMSBY ★☆☆☆☆** on its screen. |
| **Moe Dread**, the complaint bureau’s robot, put himself into standby while waiting to complain about his own standby mode. | **Side returns** · `moe_returns` | Lift off the dock and go over the return counter. Settle past it while a stamp counterweight travels down its guide, then go behind it to the exit. The counter blocks the direct pull. Collect the **complaint stamp** from the shelf above the return tray. Typeset **HOME ADDRESS: THIS DESK** / **DOMICILE : CE BUREAU** on the existing tray. |
| Moe | **Voice vent** · `moe_vent` | Drag around the tall voice cabinet and pause where a moving fan is in view. Take the clear side of the duct during the slow part of its cycle. The cabinet obstructs the straight ascent. Collect the **answer display** on the maintenance rest. |

Use a **740 × 700** starting bay per sleeper as in [the 1955 rooms](../src/abduct/rooms/deep-1955.ts). Initial staging for greybox measurements follows. Coords are room-local and distinct from the map.

| Sleeper | Shared support and starting neck | First bend, side and upper |
| --- | --- | --- |
| Artie | Sofa platform at **y = 582**, spanning **x = 48–290**. Start with `BED_POSE` around **(140, 550)**. | Guide right and up to **(370, 335)** on the side route or **(490, 290)** on the upper branch. |
| Penny | Reclined bench at **y = 584**, spanning **x = 52–300**. Start with `BED_POSE` around **(148, 552)**. | Early hold around **(365, 300)**, with the cabinet or counter between that turn and the exit line. |
| Moe | Padded charge cradle at **y = 595**, spanning **x = 55–298**. Start with `BED_POSE` around **(150, 563)**. | Approach the returns from above the counter around **(465, 300)**. Stage for the vent to the right of the cabinet around **(565, 285)**. |

For side routes, begin with a **300 px** tall bay opening at **x = 740** and the exit near **x = 1450**. For upper routes, start with a **225 px** opening at **y = 0** and the exit around **y = −430**. Put a body-length settling pocket before each moving obstacle and at least **20 px** of clearance around the fully settled body along the intended line. Use existing furniture, `swing`, `castor` or `patrol`, `gate` and `fan` mechanics. The fan blades, rail and cart show their physical positions. The gate uses the existing amber cycle cue and visible gap. Leave the spawn bay outside their full swept volumes, with only a quiet support touching the body. Verify each spawn for **10 s** without input and demand zero bonks and zero wake. Adjust supports and pose if it fails. Verify every direct room drag at all evaluator delays and every intended exit with autopilot. On the timed paths size the opening for feet, hands and torso through the entire movement window.

- **Penny’s thumb.** After beam input, use the first upward crossing of **55/100** wake to pose her thumb toward the exit for **0.5 s**. Reuse Rodney’s view-side pose hook. In reduced motion, hold a static thumb silhouette for the same beat. Change the view only. The body, beam and wake meter follow the normal simulation.
- **Moe’s sulk.** Use the Black Knight’s per-bonk speech rotation for the three sulks under **Copy**, keeping the latest pending line and the normal speech cadence. Keep ordinary sleep talk on the existing snore cue. The sulks are speech only.

## The towel and the trophies

**Town pickup** `bypass_towel` at the west harbour rack. Use the stationary mint hover lock and optional fourth star. A sighting clears the partial lock and keeps the collected flag. File the towel on any filed report, including demolition. Award the fourth star for delivering all three with the towel aboard in the same run. The detour stays clear of the opening cone. Draw a thick butter-yellow towel with violet bands and a fat stitched hem. The undraped portion reads as one **96 × 72 logical px** cloth silhouette in flight and in Field Finds. Give the open rack its own scenery sprite. [Town pickup rules](GDD-8-map-collectibles.md)

| Town trophy field | EN | FR |
| --- | --- | --- |
| Name | Bypass towel | Serviette de la déviation |
| Status | Issue standard. Laundering optional. | Modèle réglementaire. Lavage facultatif. |
| `memoHint` | `your towel` | `votre serviette` |
| Unfound hint | On the west harbour rack. | Sur le portant à l’ouest du port. |
| Catalogue | The most useful thing a traveller can carry. Zib has used it as a cape, a pillow and a white flag. All tonight. | L’objet le plus utile en voyage. Zib s’en est servi comme cape, oreiller et drapeau blanc. Tout ça ce soir. |
| Vrell, collected on a repeat | “Good. For once the emergency equipment is machine washable.” | « Parfait. Pour une fois, le matériel de secours passe en machine. » |

Put each room souvenir on the natural line through the first hold, clear of moving geometry. Use the existing beam pickup and matching item ID from the EN name in lowercase. Each gets its own Souvenirs shelf slot and localized singular/plural counts. Use the existing wing paging for the Dispatch cases. The bridge reaches 47 souvenir slots and the three eras add 18, for 65 slots in all. [Trophy Room scaling](GDD-9-trophy-room.md#scaling--multi-room-threshold)

| Route | Item · EN / FR | Trophy description · EN | Trophy description · FR |
| --- | --- | --- | --- |
| `artie_garden` | Bowl of petunias / Pot de pétunias | Fell from a great height. Its only comment: “Oh no, not again.” | Pot tombé de très haut. Son seul commentaire : « Oh non, pas encore. » |
| `artie_bath` | Spare dressing gown / Robe de chambre de rechange | Artie’s formal one. Identical to the other, but he’s ironed the belt. | La tenue de cérémonie d’Artie. La même que l’autre, mais il a repassé la ceinture. |
| `penny_service` | Ear fish / Poisson d’oreille | Fits in one ear. Zib tried it at a recital. It translated three stanzas as ‘Move your car.’ | Se glisse dans l’oreille. Au récital, il a traduit trois strophes par « Déplacez votre véhicule. » |
| `penny_loft` | Electronic travel guide / Guide de voyage électronique | Grimsby’s entry reads, in full: “Mostly harmless.” The author was trying to leave when she wrote it. | La fiche de Grimsby, en entier : « Globalement inoffensive. » L’autrice essayait de quitter la ville quand elle l’a rédigée. |
| `moe_returns` | Complaint stamp / Tampon à réclamations | Worn smooth on the side that says RECEIVED. The reply side is pristine. | La face REÇU est complètement usée. La face RÉPONDU est intacte. |
| `moe_vent` | Answer display / Afficheur de réponses | It displays 42. The customer is expected to supply the question. | Il affiche 42. Au client de fournir la question. |

### Specimen Archive

Use archive IDs `artie`, `penny` and `moe`. The dossier and repeat addenda fit the existing card, with these fixed vitals. Use names from the heading in both locales and metric only in FR. Save the normal route and repeat counts through specimen delivery. Probe status stays cosmetic under the current Archive rules.

| Name | Age | Height · EN / FR | Weight · EN / FR |
| --- | --- | --- | --- |
| Artie Duvet | 39 | 5′10″ · 178 cm / 178 cm | 161 lb · 73 kg / 73 kg |
| Penny Thumb | 33 | 5′7″ · 170 cm / 170 cm | 143 lb · 65 kg / 65 kg |
| Moe Dread | 16 | 5′5″ · 165 cm / 165 cm | 229 lb · 104 kg / 104 kg |

| ID · field | EN | FR |
| --- | --- | --- |
| `artie` · `desc` | Asked our machine for tea. Got something almost, but not quite, entirely unlike tea. | A demandé du thé à notre distributeur. Il a reçu quelque chose de presque, mais pas tout à fait, complètement différent du thé. |
| `artie` · `at3` | Complained that the demolition fleet parked on his rhubarb. The fleet replied. In verse. | S’est plaint que la flotte de démolition s’était garée sur sa rhubarbe. La flotte a répondu. En vers. |
| `artie` · `at10` | Still in the dressing gown. Says he’ll change when the universe makes sense. | Toujours en robe de chambre. Il se changera quand l’univers aura un sens. |
| `penny` · `desc` | Hitchhiked to her own driving test. The examiner made her get out and walk back. | Est venue à son permis en stop. L’examinateur l’a fait descendre et revenir à pied. |
| `penny` · `at3` | Reviewed our saucer. Two stars. Said the minibar was full of evidence. | A testé notre soucoupe. Deux étoiles. Le minibar était plein de pièces à conviction. |
| `penny` · `at10` | Thumbs a lift off every saucer that passes. Ours has started taking the long way round. | Fait du stop dès qu’une soucoupe passe. La nôtre fait désormais un détour. |
| `moe` · `desc` | His off switch is labelled NOT NOW. It is the only part of the manual he agrees with. | Son interrupteur porte la mention PAS MAINTENANT. C’est le seul point du manuel sur lequel il est d’accord. |
| `moe` · `at3` | Filed a noise complaint against his own reboot chime. Refuses to meet with the accused. | A porté plainte contre sa propre sonnerie de redémarrage. Refuse de rencontrer l’accusé. |
| `moe` · `at10` | “I live at this desk. They still make me book it.” | « Je vis à ce bureau. Ils m’obligent quand même à le réserver. » |

## The clock and the stars

The fleet’s demolition timer starts at **3:12** (**192 s**; the greybox proposal was 4:00, and the openings rework moved the shipped clock from 188 s to 192 s) and counts down in both flight and rooms. Drive it from `DeepRun.remaining` and reuse the countdown HUD and the last **30 s** deadline warning. Use a steady amber HUD at 30 s even in reduced motion. Keep the sky dark. The barges’ running lights pick up a charge at the warning, using the same elapsed time. They are scenery. At zero, show the demolition seal closing over the map and cut to the failure report. The retry choice pauses the clock as usual. A whole-shift restart resets the clock, the hazard phases and all run-local progress. Success requires the third room result to reach the runner before the timer hits zero. The last second has the same rules in either phase.

| Star | Rule |
| --- | --- |
| Delivered / Livré | File all three residents before the fleet’s deadline. |
| Ghost / Fantôme | Deliver with zero full sightings and zero failed room attempts. Partial suspicion can drain. |
| Night owl / Oiseau de nuit | Deliver with **26 s** left (**166 s** elapsed, **2:46**). `parMarginSec` is 26 (the greybox proposal was 102 s left at 2:18 elapsed). |
| Towel / Serviette | Take the towel and complete the shift on that run. |

Greybox targets over **20 matched no-upgrade seeds**, out of all whole-shift attempts. Measure ordinary runs and towel detour runs separately. Make this the hardest of the three new dates by asking for more timing decisions per flight and a tighter clean-run recovery budget. Aim for a **120–140 s** casual independent shift estimate. Check the ordering against the two earlier dates on the same seeds. Use actual Ghost rates, par headroom and where players fail to tune that ordering. Retain the earlier dates’ easy opening approach and reserve the demanding timing for the faster branches. [Progression curve](GDD-5-progression.md#target-curve) · [Difficulty evaluator](../.claude/skills/evaluate-difficulty/SKILL.md)

| Model | Delivered | Ghost | Night owl | Towel on detour runs |
| --- | --- | --- | --- | --- |
| Casual | 75–85% | 33–38% | 50–55% | 55–75% |
| Skilled | 85–92% | 50–65% | 67–75% | 80–95% |

At six seeds, require Delivered / Ghost / Night owl of **4/6, 2/6, 3/6** casual and **5/6, 3/6, 4/6** skilled. Skilled Ghost must exceed casual Ghost. The casual Ghost ceiling stays **90%**. Per room require at least **75% skilled / 40% casual** delivery, with one **≥65% casual** route per sleeper. Keep ≥80% flight completion for both models, median sightings ≤1 skilled and ≤2 casual, and casual room median peak wake averaging ≥20. Bring the casual estimate under 80% of the 192 s budget. These are proposed targets. The greybox needs full-route evidence before the clock and geometry are set for release.

## Copy

**Shift memo · Work Order #0014 · Your Town Is in the Way**

> Agent Zib, Bubbles found Krix’s hyperspace bypass notice. He sold Grimsby as vacant. File Artie, Penny and Moe before the fleet starts digging. Always know where your towel is. Yours is on the west harbour rack.
>
> The plans were on display at the planning office in Alpha Centauri. For fifty years.
>
> — Vrell. On Form 12-C, tick WHOLE TOWN.

**Ordre n°0014 · Votre ville gêne le passage**

> Agent Zib, Bubulle a trouvé l’avis de déviation hyperspatiale. Krix a vendu Grimsby, soi-disant vide. Vite, recensez Artie, Penny et Moe. Sachez toujours où est votre serviette. La vôtre est sur le portant à l’ouest du port.
>
> Les plans étaient affichés au bureau de l’urbanisme d’Alpha du Centaure. Depuis cinquante ans.
>
> — Vrell. Sur le formulaire 12-C, cochez VILLE ENTIÈRE.

Override the memo’s Delivered and Night owl goals. Use the demolition timer of **3:12** and the required margin of **0:26**, respectively, for `{time}` (the shipped `budgetSec` and `parMarginSec`).

| Memo goal | EN | FR |
| --- | --- | --- |
| Delivered | `{star} — all 3 before demolition ({time})` | `{star} — les trois avant la démolition ({time})` |
| Night owl | `{star} — {time} left before demolition` | `{star} — {time} de marge avant la démolition` |

| Where | EN | FR |
| --- | --- | --- |
| Work Orders card | Artie’s house was in the way. Then they zoomed out. | La maison d’Artie gênait. Puis ils ont dézoomé. |
| Zib, first leg | “They’ve sent poets. Vrell, are their books loaded?” | « Ils ont envoyé des poètes. Vrell, leurs livres sont chargés ? » |
| Opening reciter, first approach | “Ode, verse 1 of 300: / O squat and crumbly house of brown, / I’ll pave you flat. And all the town.” | « Ode, strophe 1 sur 300 : / Ô maison trapue et marron, / je vous aplatis. Et le canton. » |
| Opening reciter, next verse | “O bypass, gleaming slab of tar. / I paved my heart. There’s room for a car.” | « Ô déviation, mon beau goudron. / J’ai bitumé mon cœur. Garez-vous donc. » |
| Opening reciter, third verse | “Roses are red, your roof is slate. / Kindly vacate by half past eight.” | « Roses rouges, toit d’ardoise. / À huit heures et demie, on vous rase. » |
| Poetry sighting | “I’ll take my chances in the airlock.” | « Je préfère tenter ma chance dans le sas. » |
| Dozer sighting | “Artie stopped one of those in his dressing gown. Is that what I was supposed to wear?” | « Artie en a arrêté un en robe de chambre. C’était la tenue réglementaire ? » |
| Deadline report | “The demolition went ahead. We’ve been invited to comment on the rubble.” | « La démolition a eu lieu. On nous invite à donner notre avis sur les gravats. » |
| Vrell, first clear | “Three residents. Grimsby stays. Your mother called, Zib. I told her: adequate.” | « Trois habitants. Grimsby reste. Votre mère a appelé, Zib. Je lui ai dit : convenable. » |
| Cover story, ordinary delivery | **TOWN FOUND IN AREA MARKED VACANT** | **UNE VILLE DÉCOUVERTE EN ZONE DÉCLARÉE INHABITÉE** |
| Cover story, Ghost | **POETRY GUARDS PRAISE AUDIENCE FOR SITTING VERY STILL.** | **LES GARDES-POÈTES SALUENT UN PUBLIC IMMOBILE.** |
| Gazette, deadline with two or more sightings | **WITNESSES SAW SAUCER. WITNESSES WOULD NOW LIKE A LIFT.** | **DES TÉMOINS ONT VU LA SOUCOUPE. ILS FONT DU STOP.** |
| Artie mumbles | “Tea first. Then the end of the world.” / “I’m decent. It’s a dressing gown.” | « D’abord le thé. La fin du monde après. » / « Je suis habillé. C’est une robe de chambre. » |
| Penny mumbles | “Ch. 1: Leave Grimsby. Ch. 2: See ch. 1…” / “Local delicacy… bring your own…” | « Ch. 1 : partir. Ch. 2 : voir ch. 1… » / « Spécialité locale… à apporter… » |
| Moe mumbles | “Life. Don’t talk to me about life.” / “Brain the size of a planet. They want me to nap.” | « La vie… ne me parlez pas de la vie. » / « Un cerveau gros comme une planète. Et on me demande de faire la sieste. » |
| Moe, first / second / third and later bonks | “Ow.” → “That’s all right. I’m used to it.” → “Don’t pretend you care.” | « Aïe. » → « C’est rien. J’ai l’habitude. » → « Faites pas semblant de vous en faire pour moi. » |

Use the existing cover-story row for ordinary and Ghost deliveries, with Ghost first if both qualify. The Gazette still needs two sightings. A clean deadline loss uses the deadline report line.

### Season finale

After Vrell’s first-clear line, show a skippable three-panel Bureau epilogue with time to read each panel in its locale. Trigger it from the first delivery, store a stable seen beat ID (`dispatch2199Finale`) on presentation, and offer replay from the delivered order’s memo. The epilogue lives outside the shift timer and grants no extra pay. Return to the 2199 report or Dispatch with its delivered stamp. Subsequent clears use the existing souvenir and outcome lines. The delivery upgrades the stable-ID Dispatch headers in [the on-ramp spec](GDD-11-onramp.md#order-numbers-and-saved-progress) to “TO: Agent Zib” / « À : Agent Zib ».

| Panel | Action | EN | FR |
| --- | --- | --- | --- |
| 1 | Vrell stamps the bypass plan void. Zib’s signature goes above Vrell’s countersignature. Vrell slides the separate, headed bill to Krix, whose pen hovers over its receipt mark. Krix’s toaster pops on the desk after the bill is readable. Use one retained shape for the toast and show it already raised in reduced motion. | **ORDER VOID** · **DEMOLITION CHARGES · BILL TO KRIX** · **RECEIVED** | **ORDRE ANNULÉ** · **FRAIS DE DÉMOLITION · À PAYER PAR KRIX** · **REÇU** |
| 2 | Bubbles’ porthole is empty. A damp note rests against the glass. The parking transfer underneath has her finprint and a handwritten “Nobody coached me. I’m just that good.” / « Personne ne m’a donné de cours. Je suis douée, c’est tout. » | “So long, and thanks for all the fish.” | « Salut, et encore merci pour le poisson. » |
| 3 | Vrell stamps his retirement form **PENSION VESTED** / **DROITS À LA RETRAITE ACQUIS** and files it in **LATER** / **PLUS TARD**. He clips the transferred permit to Zib’s old lanyard and hands it back. Outside, **ZIB** appears above the mint ring and the saucer floats in Bubbles’ pool. | Zib: “It has a POOL.” | Zib : « Il y a une PISCINE. » |

Use the French edition’s **« Pas de panique »** on the sign and its farewell wording on the note. **42** appears on Moe’s answer display in both locales. Keep it off the countdown and the parking ring so each beat lands on its own. Use **Bubulle** in French labels. Translate “returns” as **retours** in route names and use **déviation hyperspatiale** consistently. Garden door / Porte du jardin, Bathroom hatch / Trappe de la salle de bains, Service door / Porte de service, Ticket loft / Mezzanine des billets, Side returns / Accès aux retours, Voice vent / Conduit vocal. Use **gardes-poètes** throughout and give the two longest route labels a phone-width pass. Typeset signs, stamps and display numerals in the view, styling them as local props with original designs.

## Art and build split

The base pack proposes **33 new manifest keys**. Draw room surfaces and roofs from the established Night Shift palette. Give the barges a squat filing-cabinet silhouette and the reciters a lectern and large open folio. Use an oversized robe silhouette for Artie, worn commuter jacket for Penny, and a round, drooping head for Moe. Use original faces, silhouettes and props. Keep labels out of SVGs. Build primitive fallbacks for every key, including the detector origin, towel, room supports and trophy close-ups. [Art brief](ART_BRIEF.md) · [Pixi view guide](PIXI-MIGRATION.md)

| Pack | Keys and size in logical px |
| --- | --- |
| Flight | `flight/ground_grimsby2199` **540 × 540** seamless, `flight/duvet_house2199_top` **270 × 220**, `flight/transit2199_top` **300 × 230**, `flight/complaints2199_top` **320 × 248**, `flight/reciter2199_top` **72 × 68**, `flight/recital_listener2199` **38 × 36**, `flight/demolition_barge2199_top` **360 × 186**, `flight/demolition_dozer2199_top` **100 × 78**, `flight/towel_rack2199_top` **108 × 88**, `flight/pickup_bypass_towel` **96 × 72**. Reuse town roads, lighthouse silhouette and standard entry rings. |
| Rooms | `room/bg_duvet2199`, `room/bg_transit2199`, `room/bg_complaints2199` at **540 × 960** each. `room/robe_sofa2199` **256 × 113**, `room/luggage_shutter2199` **240 × 30**, `room/charge_cradle2199` **244 × 112**, `room/voice_cabinet2199` **114 × 268**, `room/demolition_blade2199` **246 × 115**. Fill the static blocker silhouette. Reuse shelf, tracks, desk, fan, cart and exit art. Use a retained label for the address on Moe’s returns tray. |
| Specimens | `human/artie_head`, `human/penny_head`, `human/moe_head` and matching `_head_awake` keys, **64 × 66** each. `human/artie_torso`, `human/penny_torso`, `human/moe_torso`, **80 × 120** each, like every humanoid torso: the ragdoll hangs the torso from the neck and it must reach the pelvis 108 px below, or the legs float free. Use shared humanoid joints and donor limbs in the base pack. |
| Souvenirs | `room/petunias2199` **56 × 62**, `room/spare_robe2199` **64 × 76**, `room/ear_fish2199` **54 × 48**, `room/electronic_guide2199` **74 × 84**, `room/complaint_stamp2199` **54 × 64**, `room/answer_display2199` **70 × 42**. Give the Guide a big empty screen and chunky buttons. Typeset **GRIMSBY ★☆☆☆☆** and **42** on their respective displays in room and trophy views. |
| Finale | Existing Vrell, Zib, Krix and saucer art with retained prop shapes for the pen and bill, empty porthole, damp note, finprint, permit, **LATER** drawer, pension stamp and pool in the ring. Typeset the note, stamp and labels in both locales. |

| Build pass | Ownership and proof |
| --- | --- |
| 1. Flight and clock greybox | Flight owner drafts `src/levels/deep-2199.ts`, approaches, recap cause, reciter and dozer skins, and the countdown presentation for the deadline. Play the verse rotation through existing speech and drive Zib’s ear-cover pose from the existing amber preview. Use the camera and steward cone sims in live play and autopilot. Check cone/preview agreement, zero exposure in the outside approach pockets, all six entry locks and safe departures with no upgrades. Prove the four beeline catches before adding scenery. |
| 2. Room greyboxes | Abduction owner puts the six routes in `src/abduct/rooms/deep-2199.ts` and stages the guide display and returns-tray label. Test idle spawns, naive drags and all exits with the production ragdoll, plus snag recovery and retries. Verify the stage where each souvenir enters the beam. |
| 3. Dispatch and copy | Coordinator binds stable level, route, specimen and town IDs, deadline copy, EN/FR catalogue entries and the combined 1122 and 1953 prerequisite. Route the report and memo through Dispatch and build the finale’s prop and stamp beats in the three existing panels. Verify full-shift restart, loss at zero in either phase, towel filing after demolition and its fourth star on delivery, epilogue replay and reload, the gnome’s 2199 postcard, junior-label removal and waitlisted rank wording. Reserve the four film anchors for 2199 by applying the L4, L5 and L7 copy handoff in the story bible. |
| 4. Art and tuning | Art owner delivers the manifest-size pack after the greybox proves the flight lanes and exits. Run the shared headless autopilot proofs, `npm run difficulty` with 6 and 20 seeds, and the existing real-pointer journey at **375 × 690** in EN/FR. Inspect readability with sound off and reduced motion, check the three trophy wings, and run typecheck, tests and build. |

Placement, safe windows and finish rates are design targets pending greybox proof.
