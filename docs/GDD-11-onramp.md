# Night Shift · Two orders before Maple Court

Put **Baker Mabel’s First Batch** and **The Neighbours Are Asleep** after Spin City. Vrell takes Zib off training at Larry’s report, offers the existing Field Check, then sends Zib up Birch Lane on two small paid jobs. The first has one specimen, a motion light and a sleeping cat. The second has two specimens, a shared sunrise clock and room to practise waiting out a detector. Cul-de-Sac Sweep follows as Work Order #0005. It is still the first three-specimen shift and the first with a live cruiser.

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
| #0003 · Baker Mabel’s First Batch | A night bakery on Birch Lane off Main Street. Mabel is asleep while the dough rises. Her cat has the keys. | One specimen. Back out of a motion light, then keep a second sleeper quiet. Elapsed time and a Night owl par. No sunrise failure. |
| #0004 · The Neighbours Are Asleep | The Hendersons’ garage and Len’s bike workshop at the Maple Court turn. The Hendersons are away. Pruitt is watching their house, and Gary has lent the house-sitter a laser. | Two specimens and the first live dawn budget. Wait for the binoculars to move on, then for a gap in one indoor laser. Return from the first room and choose the next ring. |
| #0005 · Cul-de-Sac Sweep | Full Maple Court circuit. The real neighbourhood-watch job goes live. | Three specimens. Manage several detectors on the same leg, the cruiser, and indoor hazards across a larger route. |

Use Spin City’s van as a parked landmark at the Birch Lane turn, then keep the northbound road legible between jobs. Move the end of the Off Probation beat to the first paid Birch Lane memo. Head Office can still dump the triple order on Vrell after Larry. Vrell gets Zib two local calls before signing off on it. Larry’s first-clear handoff can end with “Off training, Zib. Two calls on Birch Lane, then the bulk order.” Change Maple Court’s opening to “Three before dawn this time, Zib.” Each memo makes sense to someone opening it in isolation.

### Tuning targets

Whole-shift rates are over all attempts with no upgrades. Score **Delivered**, **Ghost** and **Night owl** on ordinary runs. Measure the named fourth star in a separate run set with the intended field-find detour. These are greybox targets over 20 matched seeds.

| Work Order | Model | Delivered | Ghost | Night owl | Fourth star, detour runs |
| --- | --- | --- | --- | --- | --- |
| #0003 · Baker Mabel’s First Batch | Skilled | 100% | 95–100% | 95–100% | 95–100% |
| #0003 · Baker Mabel’s First Batch | Casual | 95–100% | 85–90% | 90–100% | 90–100% |
| #0004 · The Neighbours Are Asleep | Skilled | 95–100% | 90–95% | 90–100% | 90–100% |
| #0004 · The Neighbours Are Asleep | Casual | 90–100% | 75–85% | 85–95% | 80–95% |

Use six seeds for the release gate. Use floors of 6/6 delivered, 6/6 skilled Ghost and 5/6 casual Ghost for #0003, with at least 5/6 Night owl for both. For #0004, require at least 5/6 delivered and Night owl for both, 5/6 skilled Ghost and 4/6 casual Ghost. Retain the casual 90% Ghost ceiling and skilled-over-casual Ghost in both levels. Judge the finer ranges over 20 seeds. Record the post-Gary Maple Court leg separately before interpreting the remaining delivery gap.

## #0003 · Baker Mabel’s First Batch

**Setting.** Mabel starts the morning bread while the rest of Birch Lane is asleep. She sits down for five minutes while the dough rises. Crumb, the bakery cat, has claimed the warm corner by the cooling rack and leaves all decisions involving the oven to Mabel.

**Work Order card.** *Baker Mabel’s First Batch* · *Birch Lane Bakery* · “The dough’s rising. Mabel’s on a break.” In French, *La première fournée de Mabel* · *Boulangerie de Birch Lane* · « La pâte lève. Mabel fait une pause. » Portrait of Mabel with flour on one cheek and a pencil behind her ear.

**Shift memo.**

> **Work Order #0003 · Baker Mabel’s First Batch**
>
> Zib, your first paid call is the bakery on Birch Lane. Collect Baker Mabel. Give the motion light a wide berth and let her cat sleep. There’s a bent bread tray on the west loading apron if you want a keepsake.
>
> The cat has never baked a loaf. Naturally it’s in charge.
>
> — Vrell

> **Ordre de mission #0003 · La première fournée de Mabel**
>
> Zib, ta première mission payée t’attend à la boulangerie de Birch Lane. Récupère Mabel la boulangère. Contourne largement le projecteur à détecteur de mouvement et laisse son chat dormir. Si tu veux un souvenir, il y a une plaque à pain tordue sur l’aire de livraison à l’ouest.
>
> Le chat n’a jamais fait un pain de sa vie. Évidemment, c’est lui qui dirige.
>
> — Vrell

### Flight

- Greybox a **1080 × 1440** suburb block. Start at **(540, 1250)**, with the bakery centred at **(540, 460)**. Put the Roof vent at roughly **(470, 400)** and the Stockroom door at **(615, 570)**. Use a cream roof, a wide extractor cap and a striped canopy over the loading door. Tuck the parked Spin City van out of the live approach.
- Start with one existing `porch` detector on a loading-yard post at **(540, 910)**, trigger radius **215 px**, active radius **290 px** and map fuse **1.35 s**. The shortest paths from spawn to either ring cross its trigger. The obvious wide approach goes via the west verge near **(190, 910)**. Leave an equally legible retreat from the edge. The lamp shows its arming arc in amber before the hard active boundary appears. The boundary and saucer fuse go red on actual exposure. A player who brushes the boundary can steer out while the fuse still has room, then see it drain in clear air.
- Keep the whole hover pocket at both rings outside the active radius. The first lesson is how far to go around a triggered hazard. Each ring has a name and a terrain landmark. No concurrent flight detector. Any pools of decorative light remain soft.

### Specimen and rooms

**Baker Mabel** fell asleep on the break bench with her apron still on. Give her a floury plum apron over rolled-up teal sleeves and use the standard ragdoll rig. Her cat, **Crumb** (**Miettes** in French), is the only secondary sleeper and uses the existing asleep/awake cat art and second wake meter.

| Route | Room and drag | Souvenir |
| --- | --- | --- |
| **Stockroom door** (*Porte de la réserve*) · recommended · `mabel_stockroom` | Mabel is on a padded bench. Lift her over the cooling rack, hold above the open gap, then guide her out the wide door. The direct drag hits the rack. Crumb sleeps at its foot. A collision near the cat raises its labelled wake meter. The upper path gives clearance to settle Mabel before the final opening. | **Dough scraper** on a shelf facing the safe approach. |
| **Roof vent** (*Aération du toit*) · short · `mabel_vent` | Start on the same bench. Drift sideways past the overhanging trays on the flour trolley to get under a broad vent, then lift. The overhang catches a straight lift, and a bump near the trolley can wake Crumb. Keep enough headroom for Mabel’s feet to follow into the vent. | **Kitchen timer** on the service shelf at the turn. |

Start both routes from the same settled pose. Seat the chest, hips and heels on the bench or leave them clear of the supports. Separate the paws, rack and souvenir from the initial body envelope. No timed object crosses the spawn. Use the existing hard interior rules with the normal release-to-hold behaviour. The first screen should show the sleeper and the lift direction so a player can recover by looking at the room.

### Evidence Locker

| Slot | EN name and catalogue text | FR name and catalogue text |
| --- | --- | --- |
| Souvenir · `dough scraper` | **Dough scraper.** Worn down on one side. Mabel also uses it to scrape exact change off the counter. | **Coupe-pâte.** Usé d’un côté. Mabel s’en sert aussi pour décoller la monnaie du comptoir. |
| Souvenir · `kitchen timer` | **Kitchen timer.** It rings at five. Mabel trained herself to sleep until it falls off the shelf. | **Minuteur de cuisine.** Il sonne à cinq heures. Mabel a appris à dormir jusqu’à ce qu’il tombe de l’étagère. |
| Field Finds · `bent_bread_tray` | **Bent bread tray.** Mabel calls that end the pouring corner. The bakery has never served anything that pours. | **Plaque à pain tordue.** Mabel appelle ce coin le bec verseur. La boulangerie ne vend que du solide. |

The **bent bread tray** is the only town pickup. Lean the floured metal pan against a low curb with one corner visibly curled. Draw it at about **96 × 112 logical px** and put it on the dark west loading apron near **(180, 660)**, off the road and west of the ring approach. The whole 48 px hover catchment stays outside detector coverage. Use the one-second lock and mint marker from GDD-8. A filed tray goes to Field Finds, and its star requires Mabel’s delivery on that same shift.

| Pickup copy | EN | FR |
| --- | --- | --- |
| `memoHint` | `bent bread tray` | `plaque à pain tordue` |
| Unfound hint | Where the bakery takes deliveries | Du côté des livraisons de la boulangerie |
| Found status | Wedged under the wobbly end of Vrell’s desk | Calée sous le pied bancal du bureau de Vrell |

| Archive ID | Name | Age | Height | Weight | Description | At 3 deliveries | At 10 deliveries |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| `mabel` · EN | Baker Mabel | 55 | 163 cm | 71 kg | Can tell what time it is by poking a loaf. Poked the saucer wall and said it needed another ten minutes. | Sent up six rolls for the crew. Crumb sent an invoice for seven. | Has put the saucer down as a standing order. Thursday, three crusty rolls, no knocking. |
| `mabel` · FR | Mabel la boulangère | 55 | 163 cm | 71 kg | Sait l’heure qu’il est en tâtant un pain. Elle a tâté la paroi de la soucoupe et demandé dix minutes de plus. | A envoyé six petits pains à l’équipage. Miettes en a facturé sept. | A ouvert un abonnement pour la soucoupe. Le jeudi, trois petits pains croustillants, prière de ne pas frapper. |

### Lines

| Cue | EN | FR |
| --- | --- | --- |
| Zib, launch | “I’ll go wide of the light. Do we get a staff discount?” | « Je vais contourner le projecteur. On a une remise pour le personnel ? » |
| Vrell, first delivery | “Mabel’s aboard. The cat can open up. It’s been sitting on the keys all week.” | « Mabel est à bord. Le chat peut ouvrir la boutique. Il couve les clés depuis une semaine. » |
| Gazette, two or more sightings | **BAKERY DENIES USING UFO TO SPEED UP FIRST BATCH** | **LA BOULANGERIE DÉMENT AVOIR FAIT APPEL À UN OVNI POUR SA PREMIÈRE FOURNÉE** |
| Mabel, mumble | “The dough’s resting. I’m supervising…” | « La pâte repose. Je surveille… » |
| Pickup, collected on a repeat | “The tray fits our oven if you shut the door with your hip.” | « La plaque rentre dans notre four si tu fermes la porte avec la hanche. » |
| Pickup, left behind | “Leave the tray. It’s keeping that bit of pavement out of the rain.” | « La plaque peut rester là. Grâce à elle, ce petit bout de trottoir est au sec. » |
| Zib, sighting retry | “Wide around the lamp this time.” | « Cette fois, je contourne le projecteur de loin. » |

### Clock and proof

One delivery ends the shift. Show elapsed time without a countdown or dawn wash. **Night owl by 56 s**, with an initial clean casual median of **32–44 s**. Keep enough room for a quiet stop and the **6–10 s** pickup branch. A full sighting or failed room loses Ghost for that run. Retrying from the live checkpoint can still earn Delivered. Start with at least 95% skilled and 85% casual delivery on each room route over 20 seeds. The recommended Stockroom door should reach 95% casual.

Test both flight beelines at 0, 2.5, 5 and 8 s. Each must be spotted by the motion light or fail to lock within a **60 s test window**. That cap is for the test. Each room’s direct 270 px/s drag must fail a clean delivery within 45 s at all four phases. The ordinary route, pickup route and ten-second idle proof all use the same collision and wake rules.

## #0004 · The Neighbours Are Asleep

**Setting.** The Hendersons are away. Nora Bell is house-sitting on the corner and Len Briggs is fixing a bicycle in his workshop next door. Gary has wired one of his spare garage lasers into the Hendersons’ garage, and Mrs. Pruitt is keeping her own watch from across the lane. The Hendersons’ drawn curtains and parked bins are all Zib sees of them.

**Work Order card.** *The Neighbours Are Asleep* · *Birch Lane, Maple Court turn* · “Two sleepers before dawn. Mrs. Pruitt is still up.” In French, *Les voisins dorment* · *Birch Lane, angle de Maple Court* · « Deux dormeurs à récupérer avant l’aube. Mme Pruitt veille encore. » Portrait of Nora in her quilted vest, with Len in work overalls just behind her.

**Shift memo.**

> **Work Order #0004 · The Neighbours Are Asleep**
>
> Bring back Nora Bell from the Hendersons’ garage and Len Briggs from the workshop next door before dawn. Mrs. Pruitt is watching both drives. When her lenses glint, see where she’s about to look and cross when she turns away. There’s a runaway bin lid by Len’s east drive if you fancy a detour.
>
> Nora asked for a stepladder. Gary lent her a laser. Wait until the line goes out, then give her feet time to follow. After the first delivery, head back out and pick a ring for the other sleeper.
>
> — Vrell, who keeps a perfectly good stepladder

> **Ordre de mission #0004 · Les voisins dorment**
>
> Avant l’aube, récupère Nora Bell dans le garage des Henderson et Len Briggs dans l’atelier d’à côté. Mme Pruitt surveille les deux allées. Quand ses jumelles brillent, repère où elle va regarder et passe quand elle tourne la tête. Si tu veux faire un détour, un couvercle de poubelle en cavale traîne près de l’allée est de Len.
>
> Nora a demandé un escabeau. Gary lui a prêté un laser. Attends que le faisceau s’éteigne, puis laisse le temps à ses pieds de suivre. Après la première livraison, ressors et choisis un anneau pour l’autre dormeur.
>
> — Vrell, qui a un escabeau en parfait état

### Flight

- Greybox a **1440 × 1680** block. Start at **(720, 1570)**. The northbound Birch Lane frontage splits into two drives by a low brick wall. Put the Hendersons’ garage near **(460, 620)** and Len’s workshop near **(1020, 760)**. Give the garage a shallow tiled roof with a raised loft hatch, and the workshop a corrugated lean-to with a wide skylight and a parked bicycle. Connect the drives by an open cross lane north of the detector, so a first delivery leaves the saucer on the safer side. Place both approaches in view of their respective ring landmarks.
- Put Mrs. Pruitt in one upstairs window near **(720, 1090)** using the existing `watcher` detector and house, with a **roughly 460 px** range and **1.45 s** map fuse to start. Restrict the sweep to two bearings and hold each for **about 3 s**. Put their shared region on the direct central approach. At either flank a broad turnout exposes the future cone long enough to release, let her look away, then cross. Put a permanent clear return along the north cross lane. Greybox the angular overlap and the two turnouts against all four start delays before locking the roof positions. Only the watcher raises Suspicion.
- Reuse the amber binocular glint and future sector. Show the current cone as a hard edge at its actual angle, and turn its edge and the fuse red on exposure. Keep the two cones distinct through the transition. From either delivery ring, the next valid rings and the route back stay visible through the same minimap and labels. Leave the cruiser for Maple Court.

### Specimens and rooms

**Nora Bell** fell asleep on a folding cot in the garage while waiting for Gary to come switch the laser off. She wears a rust-coloured quilted vest over a striped jumper. **Len Briggs** sat down in his workshop to listen for a tick in a bicycle wheel. The tick is still there. Give him blue work overalls and a wool cap. Both use the standard ragdoll.

| Specimen | Route | Room and drag | Souvenir |
| --- | --- | --- | --- |
| Nora | **Side door** (*Porte latérale*) · recommended · `nora_side` | Lift Nora above the garage workbench. There’s room to park her whole body, see the emitter and cross the laser perpendicularly when it drops. Keep the side door wide and clear. The workbench stops a straight drag even when the laser starts off. | **House-sitting checklist** on the near shelf just before the wait pocket. |
| Nora | **Loft hatch** (*Trappe du grenier*) · short · `nora_loft` | Lift sideways out of the cot bay, then hold Nora horizontally above a low tool chest before the last lift. The chest and loft fascia are solid. The same loaned laser covers the opening into the loft bay. The high wait pocket is tighter and the hatch itself is clear. | **Magnetic parts dish** on the pegboard shelf just beyond the crossing. |
| Len | **Workshop door** (*Porte de l’atelier*) · recommended · `len_workshop` | Lift Len over the repair counter, let the feet catch up in the gap above the vice, then move out the wide door. A counter return blocks the direct drag. The furniture is the only obstacle in this building. | **Bicycle bell** on the counter’s open end. |
| Len | **Skylight** (*Lucarne*) · short · `len_skylight` | Carry Len around the side of the repair stand and up into the skylight. The clamped bicycle wheel blocks a straight lift. Hold for the trailing legs before the last ascent. | **Bicycle bell** on the shelf above the stand, reachable from this approach. |

Keep each room to one short cutaway, at most two screen widths. Pegboard, exposed rafters and a bare bulb set the rooms apart from the bakery. For Nora, start with the existing laser cycle at **7.5 s** with **4.5 s off**. Use an amber rearming line and a sharply drawn live beam whose rendered segment matches its collision area. A strike trips the alarm and shows the red failure cue. Place the early warning, crossing and safe waiting space in view together. Keep the laser as the only timed obstacle and put the emitter well beyond the idle body envelope. Keep Nora supported by the cot and Len in a settled chair pose with all limbs clear. The souvenir spots and actor supports must pass the idle test before tuning anything else.

### Evidence Locker

| Slot | EN name and catalogue text | FR name and catalogue text |
| --- | --- | --- |
| Souvenir · `house-sitting checklist` | **House-sitting checklist.** Water the fern. Bring the bins in. If Gary drops by, pretend to be watering the fern. | **Liste de gardiennage.** Arroser la fougère. Rentrer les poubelles. Si Gary passe, faire semblant d’arroser la fougère. |
| Souvenir · `magnetic parts dish` | **Magnetic parts dish.** Contains one screw. The household is waiting to find out what wobbles. | **Coupelle aimantée.** Contient une vis. Tout le monde attend de voir ce qui va prendre du jeu. |
| Souvenir · `bicycle bell` | **Bicycle bell.** Len tuned it so he could tell which grandchild was on the pavement. The neighbours can now tell from indoors. | **Sonnette de vélo.** Len l’a réglée pour reconnaître lequel de ses petits-enfants roule sur le trottoir. Les voisins le savent aussi, fenêtres fermées. |
| Field Finds · `runaway_bin_lid` | **Runaway bin lid.** Blue on top, black underneath. Mrs. Pruitt has a photograph of both sides and won’t say how she got the second one. | **Couvercle de poubelle en cavale.** Bleu dessus, noir dessous. Mme Pruitt a photographié les deux faces et refuse de dire comment elle a pris la deuxième. |

The **runaway bin lid** is the only town pickup. Put it on the east apron by Len’s drive around **(1255, 610)**. Use a **112 × 86 logical px** moulded blue lid with a thick handle and two snapped hinge tabs. Keep both the sprite and hover circle beyond the watcher’s entire fan, clear of roofs and the driveway. Use the standard mint marker, minimap diamond and hover. The pickup earns the fourth star when both specimens are delivered that shift. Both new pickups are objects. Reuse the current animated rig convention for any person pickup added in a later pass.

| Pickup copy | EN | FR |
| --- | --- | --- |
| `memoHint` | `runaway bin lid` | `couvercle de poubelle en cavale` |
| Unfound hint | Somewhere by the east drive | Quelque part près de l’allée est |
| Found status | Bureau airworthiness decision pending | Avis du Bureau sur l’aptitude au vol en attente |

| Archive ID | Name | Age | Height | Weight | Description | At 3 deliveries | At 10 deliveries |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| `nora` · EN | Nora Bell | 46 | 168 cm | 73 kg | Keeps a list of keys, with another list of where she put the first list. Asked who was watering the fern before we got through the first question. | Left the fern in the hold so the crew could see what she means by “barely damp.” | Took the spare saucer key home by mistake. Hung it on the Hendersons’ peg for “miscellaneous.” |
| `nora` · FR | Nora Bell | 46 | 168 cm | 73 kg | Tient une liste des clés et une autre pour se rappeler où elle range la première. A demandé qui arrosait la fougère avant la fin de notre première question. | A laissé la fougère en soute pour montrer à l’équipage ce qu’elle appelle « à peine humide ». | A rapporté par erreur la clé de secours de la soucoupe. Elle l’a accrochée chez les Henderson, au crochet « divers ». |
| `len` · EN | Len Briggs | 62 | 177 cm | 81 kg | Fixes punctures for tea and a biscuit. Identified a loose bolt in the beam housing by ear and asked for another biscuit. | Oiled the hangar door. The crew now misses the afternoon delivery because nobody can hear it open. | Fitted a bell to the saucer. Four streets can now hear Zib changing lanes. |
| `len` · FR | Len Briggs | 62 | 177 cm | 81 kg | Répare les crevaisons contre un thé et un biscuit. A repéré à l’oreille un boulon desserré dans le carter du rayon et réclamé un deuxième biscuit. | A huilé la porte du hangar. L’équipage rate la livraison de l’après-midi depuis que plus personne ne l’entend s’ouvrir. | A monté une sonnette sur la soucoupe. On entend Zib changer de voie à quatre rues de là. |

### Lines

| Cue | EN | FR |
| --- | --- | --- |
| Zib, launch | “Watch for the glint. I’ll cross when she looks away.” | « Je guette le reflet des jumelles. Je passe quand elle regarde ailleurs. » |
| Vrell, first clear | “Both aboard. Mrs. Pruitt has logged the saucer as an extension without planning permission.” | « Les deux sont à bord. Mme Pruitt a inscrit la soucoupe dans son registre comme extension sans permis de construire. » |
| Gazette, two or more sightings | **LOW-FLYING SAUCER FAILS TO INDICATE, SAYS MRS. PRUITT** | **UNE SOUCOUPE A OUBLIÉ SON CLIGNOTANT, SELON MME PRUITT** |
| Nora, mumble | “The fern had a drink. Ask the fern…” | « La fougère a bu. Demandez à la fougère… » |
| Len, mumble | “Mind the back wheel. It remembers…” | « Méfiez-vous de la roue arrière. Elle a de la mémoire… » |
| Pickup, collected on a repeat | “Gary will want a better photo once he hears this one can fly.” | « Gary voudra une meilleure photo quand il apprendra que celui-ci vole. » |
| Pickup, left behind | “The bin lid can stay. Mrs. Pruitt knows where it lives.” | « Le couvercle peut rester là. Mme Pruitt sait où il habite. » |
| Zib, return to flight | “One aboard. Same clock. Next ring.” | « Une livraison. Le chrono tourne. Prochain anneau. » |

### Clock and proof

Start the shared clock at **2:00**, with dawn at **6:00** after **210 real seconds**. Night owl requires **110 s left**, so **par is 100 s**. The clock is live in flight and abduction and keeps its value through the retry choice, using the same charge rules as Maple Court. A delivered first specimen stays aboard on a sighting or failed second room. Aim for a **62–85 s** clean casual median and **8–14 s** for the pickup branch. Sunrise can be reached in a deliberately slow run. Keep the existing dawn warning and one familiar timer in both HUDs. The first flight return shows **1/2** and points the camera at traversable space near the checkpoint.

Over 20 seeds, each room should deliver at least **90% skilled** and **80% casual**, with the recommended route for each sleeper at **90% casual** or better. Test both delivery orders with the bot, plus the recommended approaches under human input. At each of the four start delays the existing shortest-open-path flight pilot must get spotted or time out before the full quota. Also test direct holds from spawn to each initial ring, to keep the lesson on the first leg. If an untimed route slips through, move the detector or the throat before reducing the fuse. Each room must reject the direct 270 px/s drag within 45 s at all four start phases. Catch the straight drag on the visible set geometry even in a favourable laser phase.

## Shared implementation details

### Flight, clocks and reports

- Register both maps as deep levels with one and two targets. Add the two-target tuple to `DeepMap`. Use the map’s target count for completion copy, counters, report stamp and the Delivered condition in `computeDeepStars`. `DeepRun` already completes from its target array. Preserve L8’s troop tallies and distinct Ghost rule and L9’s time-car and deadline. Read the cap and labels from the level config in both HUDs and in the whole-shift evaluator.
- Give #0003 an explicit par-only clock mode. Keep accumulating active shift time and growing detector phase, with no sunrise deadline. Use the existing elapsed-time presentation and make the spare-time row read as elapsed time against par. Replace tests that assume a finite sunrise budget with a harness time cap for this mode. Pass through #0004’s 210 s config via the ordinary sunrise HUD and report path. Retain the current checkpoint, sighting and room-choice behaviour.
- Add both memo, route and star families to `en.ts` and `fr.ts`, including exact localized `memoHint` strings. The Work Order #0003 launch line can teach “Go wide of the motion light.” #0004’s opener can point out the binocular cue and put the first readable laser instruction at the wait pocket. Flight lines use the shared speech layer and `readSeconds()`. At 375 × 690, check the first screenshot for a readable hazard, ring entrances, prop silhouettes and a single clear next action even if the player skipped practice and the memo.
- Add first-clear, retry, ambient, pickup collected/left behind and souvenir copy through the existing `humor`, `report` and `report-extras` paths. Reuse the Gazette threshold of two sightings. Give each order one level-specific cover story and headline family. Use the existing found/left-behind row, preserve the first-clear and sunrise priorities, and keep second-leg return chatter local to #0004.
- Each room gets a base item directly. Both of Len’s routes share the `bicycle bell` ID. The current catalogue has 41 souvenirs, eight field finds and 23 specimens. The proposed additions bring those counts to 46, 10 and 26. All 46 souvenirs fit in the current 48-slot wing. Check both of Len’s routes against `ROOMS`, `SOUVENIR_SWAPS` and the shared catalogue slot. Register both field finds in `PICKUP_SIZE` and all three Archive dossiers with `at3` and `at10` lines. Translate all names, plurals, descriptions, statuses and hints into EN and FR. Use the existing cosmetic probe behaviour for these three specimens.

### Order numbers and saved progress

| Work Order | Save key | Card |
| --- | --- | --- |
| #0001–#0002 | `level1`, `level2` | Doyle Farm, Spin City |
| #0003 | `birch_bakery` | Baker Mabel’s First Batch |
| #0004 | `birch_neighbours` | The Neighbours Are Asleep |
| #0005–#0011 | `level3` through `level9` | Maple Court through Crest Valley |

Insert the two IDs in `LEVEL_IDS` and the matching definitions in `LEVELS`. Array order drives the sequence. Use `num` for the displayed order and stable IDs for old level-specific logic. Audit the Field Check’s hard-coded index and return/skip labels, `num - 1` in the evaluator, memo addressees, e2e selection, and difficulty-tier and legacy unlock tests tied to displayed numbers. In particular, the Crest Valley “Agent” addressee and archive header belong to `level9`, now #0011. Renumber the English and French card, memo subject and other player-facing order labels, including the #0002-B drill’s destination. Keep the content IDs for Dave, Gary, Pruitt and every existing room, find and trophy. The old `legacyDispatch` grant applies to the stable ID set `level3` through `level7`.

Use a `night-shift-save-v3` storage key so an older build on the same origin can still write its own v2 format. On first v3 load, import valid v2, with v1 as the legacy source when needed, and write the migrated save. Keep the two old keys available to those builds. Existing level progress, fourth stars, best times, attempts, found IDs, Glorbs, upgrades, reports, language, debug unlocks, practice flag, specimen/probe counts and trophy provenance keep their values. Both new level records begin empty.

- A fresh save unlocks #0003 from Spin City, #0004 from #0003, then Maple Court from #0004. A v2 import with only Spin City delivered follows the same path.
- Give imported saves that attempted Maple Court or delivered any original `level3`–`level9` order a persisted access flag for both new orders and Maple Court. Also preserve any pre-existing legacy unlocks. The flag grants access to the whole bridge without making up deliveries, rewards or finds. Returning players with a cleared original deep order keep their next forward dispatch highlighted and can find the bridge from Work Orders. A player whose furthest progress was an attempt on Maple Court sees the bridge as their recommended next stop and can still retry Maple Court. Preserve the progression successor for old out-of-order clears.
- Make the access import idempotent. A reset writes an empty v3 save so an old record stays ignored. Verify a production/preprod reopen, rerun of each import, and a reload after earning a bridge star.

`MAX_STARS` goes from **35 to 43**, with two new sets of four. Keep the rank thresholds at **0 / 3 / 5 / 8 / 11 / 15 / 19** so saved ranks carry over and the earlier shifts can pay for equipment. A full clear of the first four cards brings 15 stars, and Fleet Admiral of Naps first becomes possible at Maple Court. Use the normal deep pay for both orders. That makes upgrades available earlier, so tune and prove the on-ramp with zero upgrades.

### Art pack

Use original vector designs and primitive fallbacks. Reuse suburb tiles and roofs for background houses, roads, kerbs, the Spin City van, Pruitt’s house/window, the porch mount, cat poses, bench and chair poses, exit trims, shelves, the workbench, sleeper tells, laser hardware and the existing HUD. Check final sprite footprints against greybox colliders and art sizes. Global rules for detectors, wake, beam and backdrop lighting stay shared.

| New keys | Count | Suggested native size and silhouette |
| --- | ---: | --- |
| `flight/birch_bakery_top`, `flight/henderson_garage_top`, `flight/len_workshop_top` | 3 | 300×240, 320×240, 260×200. Extractor cap, loft hatch and corrugated lean-to read from overhead. |
| `flight/pickup_bent_bread_tray`, `flight/pickup_runaway_bin_lid` | 2 | 96×112, 112×86. Three-quarter angles and clear profiles on the ground and in Field Finds. |
| `human/{mabel,nora,len}_{head,head_awake,torso,upper_arm,lower_arm,upper_leg,lower_leg}` | 21 | Standard L1–L3 rig and manifest sizes. Flour and pencil, quilted vest and wool cap distinguish the three portraits. |
| `room/bg_birch_bakery`, `room/bg_birch_workshop` | 2 | 540×960 each. Atmosphere and wall treatments only. |
| `room/cooling_rack`, `room/flour_trolley`, `room/bike_repair_stand`, `room/folding_cot` | 4 | 220×120, 140×120, 180×110, 240×36. Match outlines to the colliders and leave space to read the tell. Reuse the existing workbench and counter, and a low cabinet for the tool chest where it fits. |
| `room/dough_scraper`, `room/kitchen_timer`, `room/house_sitting_checklist`, `room/magnetic_parts_dish`, `room/bicycle_bell` | 5 | 56×42, 40×52, 48×32, 46×36, 48×44. Read from the route and in the trophy silhouette. |

Total first-pass cost is **37 SVG keys, two maps, six playable room routes and three specimen rigs**. The four level/room data modules are the main new code. Existing detectors cover both shifts. Use retained Pixi views for any bespoke props. Add the icons to the art contact sheet and use the two field-find models at normal flier scale when checking the phone view.

## Build split and acceptance

| Pass | Owner and scope | Proof |
| --- | --- | --- |
| 1. Dispatch and scoring | **Coordinator** owns `levels/{types,levels,run,save,progress}.ts`, IDs in `contracts.ts`, the clock mode, target-count stars/reports, Field Check routing and numbers. | Fresh, L2-only import, Maple attempt, later delivery including sparse/out-of-order saves, v1 legacy, reset and reload. Verify 1/1, 2/2, 3/3 and L8 troop counts, deadline and par boundaries, skip/replay, next dispatch and fourth star versus filed pickup. |
| 2. Flight greyboxes | **Flight** owns `src/levels/deep-birch-bakery.ts` and `deep-birch-neighbours.ts`. Reuse porch and watcher fields. Author road junctions, ring positions, lookout timing and pickup pockets, with a clean pointer approach to each exit. | `flight-autopilot`, `flight-roads`, layout and pickup-figure tests, both new maps in `scripts/pixi/check-bubbles.mjs`, four beeline start delays, flight restart and next-leg checkpoint. |
| 3. Room greyboxes | **Rooms** owns `src/abduct/rooms/deep-birch-bakery.ts` and `deep-birch-neighbours.ts`, the six exits, poses, routes and item placement. | `abduct-spawn` across `ROOMS` and Field Check, `abduct-deep`, souvenir reach, direct-drag regressions, mouse/touch jitter and release-to-hold with the authored exits. Both wake meters start at zero. |
| 4. Art | **Art** owns the keys above, with final sizes agreed with the flight and room owners, plus the contact sheet. | Real phone previews of pickups, roofs, sleeper portraits and cutaways, including missing SVGs and reduced-motion tells. |
| 5. Copy and catalogue | **Story/UI** owns EN/FR work orders, memos, jokes, radio and report hooks, Gazette variants and new Evidence Locker entries. | `flight-collectible` covers unique pickups and both memo hints, `ui-trophies*` covers items, finds and specimen entries, and `ui-report*` covers the report rows, Vrell comment priorities and localized wrapping. |
| 6. Tune and play | **Difficulty** owns the two new bands, standard and pickup-first samples and seeded beelines. **Verification** drives the phone build. | Run `DIFFICULTY_LEVELS=birch_bakery,birch_neighbours,level3 npm run difficulty` at 6 and 20 seeds, then `npm test`, typecheck and build. Extend the real-pointer playthrough and bubble script to enumerate from stable IDs. |

Measure skip and detour runs via `DeepRun`, live flight and simulated abduction. Record all four beeline phases, first sighting source, time per leg and peak Suspicion, room failures, secondary-sleeper wake, clearance, retries and all four star rates. Keep the existing early deep gates for par usage (30% minimum), casual median peak Suspicion (5% minimum), average route median peak wake (20 minimum) and 80 px obstacle-or-mechanic approach. For each level, prove one four-star detour with the bot and at least one per model over 20 seeds. Keep the room-route samples separate from whole-shift samples. A high result from the route-aware model needs a real-thumb check.

Use the project’s [browser verification recipes](../.claude/skills/verify-night-shift/SKILL.md) with a fresh save at **375 × 690**. Watch first-time players after the Spin City report, including a group that skips practice. Record whether they see the warning before crossing, which ring they choose, whether they regain control after exposure, where they stall in the room, whether they find the second target and whether they finish Maple Court. Verify both languages, muted and reduced-motion tells, and the four-star report plus Trophy Room reload. Retain the Field Check as optional practice and target the post-Gary approach for diagnosis before changing Maple Court’s clock or challenge. The timings and targets are proposals for greybox review.
