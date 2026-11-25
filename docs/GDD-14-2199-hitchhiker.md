# GDD-14 · Your Town Is in the Way (Grimsby, 2199)

Grimsby is in the way of a hyperspace bypass. Dodge the demolition fleet’s poetry guards and get three sleeping residents onto the census before the fleet can flatten the town.

## The shift

**Work Order #0014** with the Birch Lane orders included. Stable ID `level12`. The season finale becomes selectable after a delivery in both [1122](GDD-12-1122-grail.md) and [1953](GDD-13-1953-tripods.md), in either order. Use Artie’s portrait on the card. After the finale the dial goes quiet and delivered dates stay replayable.

Krix sold the right of way for a hyperspace bypass through OBELISK™ and listed Grimsby as vacant. From the porthole tank by Vrell’s desk in the present, Bubbles pulls the planning notice from the 2199 records and forwards it to Dispatch. Vrell recognizes Krix’s docket from 1122. Three local census entries overturn the sale. Every delivery counts toward the quota, even after a sighting or a room retry. The ruling closes OBELISK™’s Dispatch claims and sends Krix the bill.

Zib flies from present-day Dispatch to Grimsby’s harbour bend in 2199. The **DON’T PANIC** sign stands above the fork on arrival. Back at the Bureau after the shift, Zib finds the empty porthole and Bubbles’ farewell. Keep the sign, towel, answer display and goodbye in their own moments. [Film synopsis](https://d23.com/a-to-z/hitchhikers-guide-to-the-galaxy/) · [English publisher’s guide](https://www.panmacmillan.com/blogs/science-fiction-and-fantasy/hitchhikers-guide-to-the-galaxy-book-series)

## Flight

Greybox **1800 × 2320** logical px with the origin at the top left. Retain the familiar Grimsby harbour bend and the lighthouse silhouette beyond the west seawall. Put the demolition barges in the sky beyond the playable streets. The three rooftops, the wide fork and the ring markings should read before the painted fleet does.

| Place | Centre | Rings and approaches |
| --- | --- | --- |
| Launch at the **DON’T PANIC** fork | (900, 2140) | Centre lane heads straight into the opening recital. West exit goes via **(310, 2110) → (310, 1440)**. East exit goes via **(1490, 2110) → (1490, 1440)**. Show the split with left and right arrows in the spawn camera. |
| Artie’s house | (425, 795) | **Garden door** (270, 795), recommended and labelled below. **Bathroom hatch** (530, 675), labelled above. |
| Transit office | (1375, 795) | **Service door** (1530, 795), recommended and labelled below. **Ticket loft** (1270, 675), labelled above. |
| Complaint bureau | (900, 365) | **Side returns** (1080, 380), recommended and labelled above. **Voice vent** (900, 470), labelled below. |
| Connector streets | **y = 1130**, **y = 250** | The lower street joins the outer lanes between the launch cone and the inner hazards. The quay rail along **y = 250** connects the outside of all three blocks. East approach to Side returns uses **(1490, 250) → (1080, 250) → (1080, 380)**. From the west, cross the quay rail on the same line. |
| Harbour towel rack | (180, 1430) | Towel ring at **(190, 1380)**. The bay branches west off the outer lane at (310, 1440), then opens back onto the same road. |

### Poetry guards and the demolition dozer

The fleet’s Recital Division reads from fixed lecterns. A recital sweeps a defined sector. On the ground, a trapped listener passes out. In the air, a full dose sends Zib fleeing back to the checkpoint. The three sleepers are indoors and use the normal room rules. From the fork, Zib gives the player the line under **Copy** once. The player can inspect the first cone from outside its reach before moving. Reuse that fork for a short untimed memo practice that ends at either outer lane. It files no delivery, star or pickup.

Use existing `camera` detection and its sinusoidal heading, `base + amp × sin(rate × t + phase)`, on the shared hazard clock. East is 0 rad, south is +π/2. A `reciter2199` camera skin and a poetry sighting cause carry the fiction through the map and report. Keep the shared fuse, checkpoint, collision and lock rules. Start `map.fuseSec` at **0.80 s**. Origins below are also the guard sprite centres. The lectern stays put and the guard turns with the sampled heading.

| Reciter | Origin | Range | Half angle | Base | Amp | Rate | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Opening recital | (900, 1350) | 660 px | 0.91 | +1.57 | 0.14 | 0.72 rad/s | 0.0 |
| West lectern | (655, 965) | 340 px | 0.36 | −2.11 | 0.55 | 0.84 rad/s | 0.2 |
| Complaints lectern | (900, 690) | 285 px | 0.32 | −1.57 | 0.58 | 0.82 rad/s | 4.4 |

- The active cone has a hard pale edge. Show a dashed **amber** edge at the cone heading sampled **0.45 s ahead** whenever the predicted edge advances into clear space. Use the exact sampled shape for the preview with faint fill confined to that shape. The current edge and saucer fuse turn **red** on live exposure. **Mint** is reserved for Zib, entries and the towel lock. A static sign, floor arrows and lamp spill have no detector edges. All cues retain their geometry and timing in reduced motion and with muted audio.
- One fixed listener beside each inner lectern slumps whenever its anchor enters that live cone and straightens when it clears. The view samples the same cone predicate and clock. The listener is scenery with no movement through the map, wake, collision or extra beams. On the first approach to the opening recital, play its two-line verse as a `FLIGHT_BUBBLES` bark with `readSeconds()` and alien babble. Let Zib’s first-leg line finish before the verse starts. The edge and fuse communicate the hazard on their own. A full fuse uses the standard spot delay and flight respawn, with the poetry caption. It cancels the interrupted lock and preserves the timer, last delivered ring and earlier deliveries.
- **East demolition dozer.** Use the existing `steward` route and cone with a dozer skin. The blade turns with the chassis, and the lamp uses the same origin offset as the cone. Start the route at **(1170, 955) ↔ (1170, 780)** at **72 px/s**, **1.0 s** turn dwell, **148 px** range, **0.30 rad** half angle and zero torch sweep. Show the next turn’s bounded cone in amber, with a hard live edge and red on exposure. The lower street, outside lane and service door stay clear at all phases. The north turn can catch the fast loft approach until the blade turns away. The dozer’s lamp uses standard sighting and recovery.
- Target starting safe pockets for the fast rings are **(535, 565)**, **(1265, 565)** and **(760, 375)**. Measure their entire usable hover area against the sweep envelope. Players can wait outside the cone until the amber edge moves away, make the short approach, brake and lock. At each fast entry leave a quiet interval of **at least 2.2 s** for braking and hovering. Leave the entire usable area of each recommended ring clear over a full cycle. The return from each fast entry must reach a safe pocket within the standard checkpoint grace once the player starts to steer.

**No straight-line win.** Leave the south approach in open air so a blind shortest-path controller heads into the opening recital. On the nominal direct rays from the launch to all six rings, the slice from about **y = 1980 to y = 1610** lies in the cone’s overlap across its full sweep. The shortest guaranteed chord across the cone is about **441 px**, or **1.03 s** at the 430 px/s speed cap before braking. Compare it with the **0.80 s** starting fuse. Prove the full controller runs at **0, 2.5, 5 and 8 s**, including the real nearest-ring choice and the follow-up legs. Run the manual direct drags too. Keep the y = 1130 connector and both outside lanes free of collision and exposure over a full cycle. The lower street gives players a clear route across town after a sighting or a delivery. Time the inner lecterns and the east dozer to save travel, or take the quay rail.

## Three sleepers and six exits

All three use the standard humanoid ragdoll and deep wake rules. Moe’s standby sparks, frown and reboot sounds dress the same physics. The two rooms for each specimen start on the same settled pose in a quiet bay. The recommended route adds travel and lets the player recover from a swinging limb. The fast route removes a bend and puts its timing decision after the first visible obstacle.

| Sleeper and sleep excuse | Route | Drag and souvenir |
| --- | --- | --- |
| **Artie Duvet** fell asleep on his front-room sofa in the dressing gown he wore lying in the mud in front of a bulldozer to save his house. | **Garden door** · `artie_garden` | Steer around the end of a parked demolition blade and settle above the shoe bench before lowering through the garden door. The blade’s static collider catches the direct pull. Lift the **bowl of petunias** from the bench shelf. |
| Artie | **Bathroom hatch** · `artie_bath` | Pull sideways clear of the tall airing cupboard, then lift into the bathroom shaft. Let the hanging shower rail swing away before raising his trailing feet. The cupboard catches a straight lift. Collect the **spare dressing gown** from the peg on the turn. |
| **Penny Thumb**, stranded travel-guide writer and habitual hitchhiker, gave the last shuttle two stars as it pulled away. She dozed on a transit-office bench. | **Service door** · `penny_service` | Lift past the ticket counter and stop in the empty queue bay. Let the baggage cart roll under, then bring Penny along the landing and out the side door. The counter blocks a straight drag. Collect the **ear fish** off the counter’s far ledge. It sits in a clear jar. |
| Penny | **Ticket loft** · `penny_loft` | Round the ticket cabinet and hold over the locker bank. Lead feet through a timed luggage shutter before climbing to the roof. Start with a **7.8 s** gate cycle and **4.2 s** of full crossing clearance. The cabinet blocks a direct lift at every phase. Collect Penny’s **pocket travel guide** on the loft landing. |
| **Moe Dread**, the complaint bureau’s robot, put himself into standby while waiting to complain about his own standby mode. | **Side returns** · `moe_returns` | Lift off the dock and go over the return counter. Settle past it while a stamp counterweight travels down its guide, then go behind it to the exit. The counter blocks the direct pull. Collect the **complaint stamp** from the shelf above the return tray. |
| Moe | **Voice vent** · `moe_vent` | Drag around the tall voice cabinet and pause where a moving fan is in view. Take the clear side of the duct during the slow part of its cycle. The cabinet obstructs the straight ascent. Collect the **answer display** on the maintenance rest. |

Use a **740 × 700** starting bay per sleeper as in [the 1955 rooms](../src/abduct/rooms/deep-1955.ts). Initial staging for greybox measurements follows. Coords are room-local and distinct from the map.

| Sleeper | Shared support and starting neck | First bend, side and upper |
| --- | --- | --- |
| Artie | Sofa platform at **y = 582**, spanning **x = 48–290**. Start with `BED_POSE` around **(140, 550)**. | Guide right and up to **(370, 335)** on the side route or **(490, 290)** on the upper branch. |
| Penny | Reclined bench at **y = 584**, spanning **x = 52–300**. Start with `BED_POSE` around **(148, 552)**. | Early hold around **(365, 300)**, with the cabinet or counter between that turn and the exit line. |
| Moe | Padded charge cradle at **y = 595**, spanning **x = 55–298**. Start with `BED_POSE` around **(150, 563)**. | Approach the returns from above the counter around **(465, 300)**. Stage for the vent to the right of the cabinet around **(565, 285)**. |

For side routes, begin with a **300 px** tall bay opening at **x = 740** and the exit near **x = 1450**. For upper routes, start with a **225 px** opening at **y = 0** and the exit around **y = −430**. Put a body-length settling pocket before each moving obstacle and at least **20 px** of clearance around the fully settled body along the intended line. Use existing furniture, `swing`, `castor` or `patrol`, `gate` and `fan` mechanics. The fan blades, rail and cart show their physical positions. The gate uses the existing amber cycle cue and visible gap. Leave the spawn bay outside their full swept volumes, with only a quiet support touching the body. Verify each spawn for **10 s** without input and demand zero bonks and zero wake. Adjust supports and pose if it fails. Verify every direct room drag at all evaluator delays and every intended exit with autopilot. On the timed paths size the opening for feet, hands and torso through the entire movement window.

## The towel and the trophies

**Town pickup** `bypass_towel` at the west harbour rack. Use the stationary mint hover lock and optional fourth star. A sighting clears the partial lock and keeps the collected flag. File the towel on any filed report, including demolition. Award the fourth star for delivering all three with the towel aboard in the same run. The detour stays clear of the opening cone. Draw a thick butter-yellow towel with violet bands and a fat stitched hem. The undraped portion reads as one **96 × 72 logical px** cloth silhouette in flight and in Field Finds. Give the open rack its own scenery sprite. [Town pickup rules](GDD-8-map-collectibles.md)

| Town trophy field | EN | FR |
| --- | --- | --- |
| Name | Bypass towel | Serviette de la déviation |
| Status | Issue standard. Laundering optional. | Modèle réglementaire. Lavage facultatif. |
| `memoHint` | `a towel` | `une serviette` |
| Unfound hint | Drying on the west harbour rack. | Sèche sur le portant à l’ouest du port. |
| Catalogue | Standard issue for emergency hitchhiking. Under “destination” somebody wrote “away”. | Équipement réglementaire pour l’auto-stop d’urgence. À la rubrique « destination », quelqu’un a écrit « ailleurs ». |
| Vrell, collected on a repeat | “Good. For once the emergency equipment is machine washable.” | « Parfait. Pour une fois, le matériel de secours passe en machine. » |

Put each room souvenir on the natural line through the first hold, clear of moving geometry. Use the existing beam pickup and matching item ID from the EN name in lowercase. Each gets its own Souvenirs shelf slot and localized singular/plural counts. Use the existing wing paging for the Dispatch cases. The bridge reaches 47 souvenir slots and the three eras add 18, for 65 slots in all. [Trophy Room scaling](GDD-9-trophy-room.md#scaling--multi-room-threshold)

| Route | Item · EN / FR | Trophy description · EN | Trophy description · FR |
| --- | --- | --- | --- |
| `artie_garden` | Bowl of petunias / Pot de pétunias | Fell from a great height. Its only comment: “Oh no, not again.” | Pot tombé de très haut. Son seul commentaire : « Oh non, pas encore. » |
| `artie_bath` | Spare dressing gown / Robe de chambre de rechange | Artie packed it as formal wear in the unlikely event of lunch. | Artie l’a pliée comme tenue de cérémonie, au cas peu probable où il faudrait déjeuner. |
| `penny_service` | Ear fish / Poisson d’oreille | Translates anything. Zib tried it on a tax return. The fish asked to be let out. | Traduit tout. Zib l’a essayé sur une déclaration d’impôts. Le poisson a demandé à sortir. |
| `penny_loft` | Pocket travel guide / Guide de voyage de poche | “Grimsby, one star.” The author was trying to leave when she wrote it. | « Grimsby, une étoile. » L’autrice essayait de partir quand elle a écrit ça. |
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
| `artie` · `desc` | Dozed through lift-off. Filed a noise complaint about the teaspoon in his own mug. | A dormi au décollage. S’est plaint du bruit de sa propre petite cuillère. |
| `artie` · `at3` | Submitted a complaint about the demolition fleet. It parked on his rhubarb. | A déposé une réclamation contre la flotte de démolition. Elle s’était garée sur sa rhubarbe. |
| `artie` · `at10` | Has asked the saucer to come back on bin day. The bins won’t take themselves out. | A demandé à la soucoupe de revenir le jour des poubelles. Les poubelles ne vont pas se sortir toutes seules. |
| `penny` · `desc` | Hitchhiked to her own driving test. The examiner made her get out and walk back. | Est venue à son permis en stop. L’examinateur l’a fait descendre et revenir à pied. |
| `penny` · `at3` | Hitched a lift out of town. The driver lived next door and was on his way home. | A trouvé un chauffeur pour sortir de la ville. Il habitait à côté et rentrait chez lui. |
| `penny` · `at10` | Was hitchhiking on a roundabout. After the third lift she was still on it. | Faisait du stop sur un rond-point. Après trois trajets, elle y était toujours. |
| `moe` · `desc` | His off switch is labelled NOT NOW. It is the only part of the manual he agrees with. | Son interrupteur porte la mention PAS MAINTENANT. C’est le seul point du manuel sur lequel il est d’accord. |
| `moe` · `at3` | Still working through Gary’s CCTV complaints. He’s on page four. Gary filed eleven pages. | Traite encore les plaintes de Gary sur la vidéosurveillance. Il en est à la page quatre. Gary en a déposé onze. |
| `moe` · `at10` | “I’ve lived at this desk for sixteen years. They still call it hot-desking.” | « Ça fait seize ans que je vis à ce bureau. Pour eux, il est toujours en libre-service. » |

## The clock and the stars

The fleet’s demolition timer starts at **4:00** (**240 s**) and counts down in both flight and rooms. Drive it from `DeepRun.remaining` and reuse the countdown HUD and the last **30 s** deadline warning. Use a steady amber HUD at 30 s even in reduced motion. Keep the sky dark. The barges’ running lights pick up a charge at the warning, using the same elapsed time. They are scenery. At zero, show the demolition seal closing over the map and cut to the failure report. The retry choice pauses the clock as usual. A whole-shift restart resets the clock, the hazard phases and all run-local progress. Success requires the third room result to reach the runner before the timer hits zero. The last second has the same rules in either phase.

| Star | Rule |
| --- | --- |
| Delivered / Livré | File all three residents before the fleet’s deadline. |
| Ghost / Fantôme | Deliver with zero full sightings and zero failed room attempts. Partial suspicion can drain. |
| Night owl / Oiseau de nuit | Deliver with **102 s** left (**138 s** elapsed). Start `parMarginSec` at 102. |
| Towel / Serviette | Take the towel and complete the shift on that run. |

Greybox targets over **20 matched no-upgrade seeds**, out of all whole-shift attempts. Measure ordinary runs and towel detour runs separately. Make this the hardest of the three new dates by asking for more timing decisions per flight and a tighter clean-run recovery budget. Aim for a **120–140 s** casual independent shift estimate. Check the ordering against the two earlier dates on the same seeds. Use actual Ghost rates, par headroom and where players fail to tune that ordering. Retain the earlier dates’ easy opening approach and reserve the demanding timing for the faster branches. [Progression curve](GDD-5-progression.md#target-curve) · [Difficulty evaluator](../.claude/skills/evaluate-difficulty/SKILL.md)

| Model | Delivered | Ghost | Night owl | Towel on detour runs |
| --- | --- | --- | --- | --- |
| Casual | 75–85% | 33–38% | 50–55% | 55–75% |
| Skilled | 85–92% | 50–65% | 67–75% | 80–95% |

At six seeds, require Delivered / Ghost / Night owl of **4/6, 2/6, 3/6** casual and **5/6, 3/6, 4/6** skilled. Skilled Ghost must exceed casual Ghost. The casual Ghost ceiling stays **90%**. Per room require at least **75% skilled / 40% casual** delivery, with one **≥65% casual** route per sleeper. Keep ≥80% flight completion for both models, median sightings ≤1 skilled and ≤2 casual, and casual room median peak wake averaging ≥20. Bring the casual estimate under 80% of the 240 s budget. These are proposed targets. The greybox needs full-route evidence before the clock and geometry are set for release.

## Copy

**Shift memo · Work Order #0014 · Your Town Is in the Way**

> Agent Zib, Grimsby’s down as vacant. The fleet is clearing it for a hyperspace bypass. File Artie, Penny and Moe before demolition. There’s a towel on the west harbour rack.
>
> The plans were on display at the planning office in Alpha Centauri. For fifty years.
>
> — Vrell. On Form 12-C, tick WHOLE TOWN.

**Ordre n°0014 · Votre ville gêne le passage**

> Agent Zib, Grimsby est déclarée inhabitée. La flotte va la raser pour une déviation hyperspatiale. Recensez Artie, Penny et Moe avant la démolition. Il y a une serviette sur le portant à l’ouest du port.
>
> Les plans étaient affichés au bureau de l’urbanisme d’Alpha du Centaure. Depuis cinquante ans.
>
> — Vrell. Sur le formulaire 12-C, cochez VILLE ENTIÈRE.

| Where | EN | FR |
| --- | --- | --- |
| Work Orders card | His house was in the way. Then they zoomed out. | Sa maison gênait. Puis ils ont dézoomé. |
| Zib, first leg | “He’s opened a book. In my experience that’s a weapon.” | « Il a ouvert un livre. D’expérience, c’est une arme. » |
| Opening reciter | “O demolition, sweet and free. / Your house is where my road will be.” | « Ô démolition, si douce et si belle. / Ta maison sera ma bretelle. » |
| Poetry sighting | “He got to the second stanza. I had to leave.” | « Il a attaqué la deuxième strophe. J’ai dû partir. » |
| Dozer sighting | “That thing signals for the turns and demolishes the straights.” | « Il met le clignotant dans les virages et rase tout en ligne droite. » |
| Deadline report | “The demolition went ahead. We’ve been invited to comment on the rubble.” | « La démolition a eu lieu. On nous invite à donner notre avis sur les gravats. » |
| Vrell, first clear | “Three residents. Grimsby stays. Krix gets the bill. Your mother called, Zib. I told her: adequate.” | « Trois habitants. Grimsby reste. Krix reçoit la facture. Votre mère a appelé, Zib. Je lui ai dit : convenable. » |
| Cover story, ordinary delivery | **TOWN FOUND IN AREA MARKED VACANT** | **UNE VILLE DÉCOUVERTE EN ZONE INHABITÉE** |
| Cover story, Ghost | **POETRY GUARDS REPORT PERFECT SILENCE** | **LES GARDES-POÈTES SIGNALENT UN SILENCE PARFAIT** |
| Gazette, deadline with two or more sightings | **RUBBLE ENTERS PUBLIC CONSULTATION** | **LES GRAVATS SOUMIS À CONSULTATION PUBLIQUE** |
| Artie mumbles | “Tea first. Then the end of the world.” / “I’m decent. It’s a dressing gown.” | « D’abord le thé. La fin du monde après. » / « Je suis habillé. C’est une robe de chambre. » |
| Penny mumbles | “Anywhere’s fine. I can change at the moon.” / “If you’re going my way, blink twice.” | « N’importe où. Je changerai sur la Lune. » / « Si c’est sur votre route, clignez deux fois des yeux. » |
| Moe mumbles | “An unexpected lift. How disappointing.” / “Brain the size of a planet. They want me to nap.” | « On vient me chercher. Quelle déception. » / « Un cerveau gros comme une planète. Et on me demande de faire la sieste. » |

Use the existing cover-story row for ordinary and Ghost deliveries, with Ghost first if both qualify. The Gazette still needs two sightings. A clean deadline loss uses the deadline report line.

### Season finale

After Vrell’s first-clear line, show a skippable three-panel Bureau epilogue with time to read each panel in its locale. Trigger it from the first delivery, store a stable seen beat ID (`dispatch2199Finale`) on presentation, and offer replay from the delivered order’s memo. The epilogue lives outside the shift timer and grants no extra pay. Return to the 2199 report or Dispatch with its delivered stamp. Subsequent clears use the existing souvenir and outcome lines. From then on the memo address is “Agent Zib”, with the junior qualifier removed.

| Panel | Action | EN | FR |
| --- | --- | --- | --- |
| 1 | Vrell stamps the bypass plan void. Zib’s signature goes above Vrell’s countersignature. Vrell slides the bill to Krix, whose pen hovers over “Received.” | **ORDER VOID** | **ORDRE ANNULÉ** |
| 2 | Bubbles’ porthole is empty. A damp note rests against the glass. The parking transfer underneath has her finprint and a handwritten “Nobody taught me.” / « J’ai appris toute seule. » | “So long, and thanks for all the fish.” | « Salut, et encore merci pour le poisson. » |
| 3 | Vrell files his vested retirement form in the drawer marked **LATER** / **PLUS TARD**. He clips the transferred permit onto Zib’s old lanyard. Outside, **ZIB** appears above the mint ring. The saucer floats in Bubbles’ pool. | Zib: “It has a POOL.” | Zib : « Il y a une PISCINE. » |

Use the French edition’s **« Pas de panique »** on the sign and its farewell wording on the note. **42** appears on Moe’s answer display in both locales. Keep it off the countdown and the parking ring so each beat lands on its own. Use **Bubulle** in French labels. Translate “returns” as **retours** in route names and use **déviation hyperspatiale** consistently. Garden door / Porte du jardin, Bathroom hatch / Trappe de la salle de bains, Service door / Porte de service, Ticket loft / Mezzanine des billets, Side returns / Accès aux retours, Voice vent / Conduit vocal. Use **gardes-poètes** throughout and give the two longest route labels a phone-width pass. Typeset signs, stamps and display numerals in the view, styling them as local props with original designs.

## Art and build split

The base pack proposes **33 new manifest keys**. Draw room surfaces and roofs from the established Night Shift palette. Give the barges a squat filing-cabinet silhouette and the reciters a lectern and large open folio. Use an oversized robe silhouette for Artie, worn commuter jacket for Penny, and a round, drooping head for Moe. Use original faces, silhouettes and props. Keep labels out of SVGs. Build primitive fallbacks for every key, including the detector origin, towel, room supports and trophy close-ups. [Art brief](ART_BRIEF.md) · [Pixi view guide](PIXI-MIGRATION.md)

| Pack | Keys and size in logical px |
| --- | --- |
| Flight | `flight/ground_grimsby2199` **540 × 540** seamless, `flight/duvet_house2199_top` **270 × 220**, `flight/transit2199_top` **300 × 230**, `flight/complaints2199_top` **320 × 248**, `flight/reciter2199_top` **72 × 68**, `flight/recital_listener2199` **38 × 36**, `flight/demolition_barge2199_top` **360 × 186**, `flight/demolition_dozer2199_top` **100 × 78**, `flight/towel_rack2199_top` **108 × 88**, `flight/pickup_bypass_towel` **96 × 72**. Reuse town roads, lighthouse silhouette and standard entry rings. |
| Rooms | `room/bg_duvet2199`, `room/bg_transit2199`, `room/bg_complaints2199` at **540 × 960** each. `room/robe_sofa2199` **256 × 113**, `room/luggage_shutter2199` **240 × 30**, `room/charge_cradle2199` **244 × 112**, `room/voice_cabinet2199` **114 × 268**, `room/demolition_blade2199` **246 × 115**. Fill the static blocker silhouette. Reuse shelf, tracks, desk, fan, cart and exit art. |
| Specimens | `human/artie_head`, `human/penny_head`, `human/moe_head` and matching `_head_awake` keys, **64 × 66** each. `human/artie_torso`, `human/penny_torso`, `human/moe_torso`, **76 × 88** each. Use shared humanoid joints and donor limbs in the base pack. |
| Souvenirs | `room/petunias2199` **56 × 62**, `room/spare_robe2199` **64 × 76**, `room/ear_fish2199` **54 × 48**, `room/pocket_travel_guide2199` **54 × 68**, `room/complaint_stamp2199` **54 × 64**, `room/answer_display2199` **70 × 42**. Typeset **42** on the display in the room and trophy views. |
| Finale | Existing Vrell, Zib, Krix and saucer art with simple retained prop shapes for the empty porthole, letter, permit, drawer, vested form and pool in the ring. Typeset the note and labels through the same locale strings used in the report. |

| Build pass | Ownership and proof |
| --- | --- |
| 1. Flight and clock greybox | Flight owner drafts `src/levels/deep-2199.ts`, approaches, recap cause, reciter and dozer skins, and a reusable countdown presentation for the deadline. Use the camera and steward cone sims in live play and autopilot. Check cone/preview agreement, zero exposure in the outside approach pockets, all six entry locks and safe departures with no upgrades. Prove the four beeline catches before adding scenery. |
| 2. Room greyboxes | Abduction owner puts the six routes in `src/abduct/rooms/deep-2199.ts`. Test idle spawns, naive drags and all exits with the production ragdoll, plus snag recovery and retries. Verify the stage where each souvenir enters the beam. |
| 3. Dispatch and copy | Coordinator binds stable level, route, specimen and town IDs, deadline copy, EN/FR catalogue entries and the combined 1122 and 1953 prerequisite. Route the report and memo through Dispatch. Verify full-shift restart, loss at zero in either phase, towel filing after demolition and its fourth star on delivery, epilogue replay and reload, the gnome’s 2199 postcard, junior-label removal and waitlisted rank wording. Reserve the four film anchors for 2199 by applying the L4, L5 and L7 copy handoff in the story bible. |
| 4. Art and tuning | Art owner delivers the manifest-size pack after the greybox proves the flight lanes and exits. Run the shared headless autopilot proofs, `npm run difficulty` with 6 and 20 seeds, and the existing real-pointer journey at **375 × 690** in EN/FR. Inspect readability with sound off and reduced motion, check the three trophy wings, and run typecheck, tests and build. |

Placement, safe windows and finish rates are design targets pending greybox proof.
