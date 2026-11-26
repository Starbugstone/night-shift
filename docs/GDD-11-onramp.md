# Night Shift · Two orders before Maple Court

Put **Baker Mabel’s First Batch** and **While the Hendersons Are Away** after Spin City. Vrell takes Zib off training at Larry’s report, offers the existing Field Check, then sends Zib up Birch Lane on two short live calls. The first has one specimen, a motion light and a sleeping cat. The second has two specimens, a shared sunrise clock and room to practise waiting out a detector. Cul-de-Sac Sweep follows as Work Order #0005. It is still the first three-specimen shift and the first with a live cruiser.

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
| #0004 · While the Hendersons Are Away | The Hendersons’ garage and Len’s bike workshop at the Maple Court turn. The Hendersons are away. Mrs. Pruitt and Gary from Neighbourhood Watch make their first appearances. | Two specimens and the first live dawn budget. Wait for the binoculars to move on, then for a gap in one indoor laser. Return from the first room and choose the next ring. |
| #0005 · Cul-de-Sac Sweep | Full Maple Court circuit. The real neighbourhood-watch job goes live. | Three specimens. Manage several detectors on the same leg, the cruiser, and indoor hazards across a larger route. |

Park Spin City’s van at the Birch Lane turn. Larry’s report grants the temporary lanyard even if practice is skipped. Head Office can still order the Maple Court sweep after Larry. Vrell assigns two live calls before signing off on it. Normal deep-shift Glorbs can fund upgrades. Zib earns a staff salary at L8.

| Handoff | EN | FR |
| --- | --- | --- |
| Larry, first clear | “Larry is logged and Accounting traced forty socks to your saucer. Temporary lanyard’s in the tray. Two calls on Birch Lane, then the bulk order.” | « Larry est recensé. La compta a remonté la piste de quarante chaussettes jusqu’à votre soucoupe. Votre badge provisoire est dans le bac. Deux missions chemin des Bouleaux, puis la commande en gros. » |
| Field Check body | “Head Office wants a bulk order in Maple Court. First, a drill on Birch Lane. Trip a porch sensor, clear a door lip and let the decoy sleep.” | « Le siège veut une commande en gros à l’allée des Érables. D’abord, un exercice chemin des Bouleaux. Déclenchez un détecteur, franchissez un seuil et laissez dormir le leurre. » |
| Field Check skip / continue | “Skip to the bakery” / “Start the bakery call” | « Passer à la boulangerie » / « Partir pour la boulangerie » |
| Field Check completed | “One logged. On a live shift the clock keeps running in every room. First live call: Birch Lane Bakery.” | « Un spécimen recensé. En mission, le chrono tourne dans toutes les pièces. Première vraie mission à la boulangerie du chemin des Bouleaux. » |
| Maple Court memo | “Three before dawn this time, Zib. Dentist Dave, Coach Barb and Gary from Neighbourhood Watch. Watch for the cruiser. Mrs. Pruitt has binoculars trained on the street from her window. Gary’s been shopping.” | « Trois avant l’aube cette fois, Zib. Dave le dentiste, Barb la coach et Gary de la surveillance du quartier. Gare à la voiture de police. Mme Pruitt surveille la rue aux jumelles depuis sa fenêtre. Gary a fait des achats. » |
| Maple Court laser joke | “Gary’s new lasers have caught him eleven times. A volunteer astronomer is on Birch Lane with a SETI dish, if you fancy a detour.” | « Les lasers de Gary l’ont piégé onze fois. Un astronome bénévole veille chemin des Bouleaux avec sa parabole SETI, si le détour vous tente. » |
| Maple Court laser failure (`garyFail`, record-books variant) | “{by}. Gary’s system has caught Gary eleven times and you once. You’re in the record books. Gary’s.” | « {by}. Le système de Gary a attrapé Gary onze fois, et vous une fois. Vous entrez dans le livre des records. Celui de Gary. » |

The Maple Court memo keeps the astronomer as its sole pickup. The two laser lines refer to the same tally on Gary’s new system. In the loading tip rotation, show Pruitt’s wave-and-calibration line only after delivery of `birch_neighbours` so her first appearance stays on Birch Lane.

### Tuning targets

Whole-shift rates are over all attempts with no upgrades. Score **Delivered**, **Ghost** and **Night owl** on ordinary runs. Measure the named fourth star in a separate run set with the intended field-find detour. These are greybox targets over 20 matched seeds.

| Work Order | Model | Delivered | Ghost | Night owl | Fourth star, detour runs |
| --- | --- | --- | --- | --- | --- |
| #0003 · Baker Mabel’s First Batch | Skilled | 100% | 95–100% | 95–100% | 95–100% |
| #0003 · Baker Mabel’s First Batch | Casual | 95–100% | 85–90% | 90–100% | 90–100% |
| #0004 · While the Hendersons Are Away | Skilled | 95–100% | 90–95% | 90–100% | 90–100% |
| #0004 · While the Hendersons Are Away | Casual | 90–100% | 75–85% | 85–95% | 80–95% |

Use six seeds for the release gate. Use floors of 6/6 delivered, 6/6 skilled Ghost and 5/6 casual Ghost for #0003, with at least 5/6 Night owl for both. For #0004, require at least 5/6 delivered and Night owl for both, 5/6 skilled Ghost and 4/6 casual Ghost. Retain the casual 90% Ghost ceiling and skilled-over-casual Ghost in both levels. Judge the finer ranges over 20 seeds. Record the post-Gary Maple Court leg separately before interpreting the remaining delivery gap.

## #0003 · Baker Mabel’s First Batch

**Setting.** Mabel sits down while her dough rises. Crumb has curled around the bakery keys at the foot of the cooling rack. A missing-slipper flyer sits in the front window, with a large slipper silhouette.

**Work Order card.** *Baker Mabel’s First Batch* · *Birch Lane Bakery* · “Up before the town. Asleep before the bread.” FR *La première fournée de Mabel* · *Boulangerie du chemin des Bouleaux* · « Debout avant le quartier. Moins levée que la pâte. » Mabel’s portrait has flour on one cheek and a pencil behind her ear.

**Shift memo**

> **Work Order #0003 · Baker Mabel’s First Batch**
>
> Zib, your first live call is the bakery on Birch Lane. Collect Mabel. There’s a cherry pie cooling on the back windowsill. If it comes aboard, I’ll weigh it before Accounting does.
>
> Crumb sleeps on the bakery keys. Mabel has to ask permission to open.
>
> — Vrell. Leave the till.

> **Ordre n°0003 · La première fournée de Mabel**
>
> Zib, votre première vraie mission vous attend à la boulangerie du chemin des Bouleaux. Ramenez Mabel. Sur le rebord de la fenêtre arrière, une tarte aux cerises refroidit. Si elle monte à bord, je la pèserai avant la compta.
>
> Miettes dort sur les clés de la boulangerie. Mabel doit lui demander la permission d’ouvrir.
>
> — Vrell. Laissez la caisse.

### Flight

- Greybox a **1080 × 1440** suburb block. Start at **(540, 1250)**, with the bakery centred at **(540, 460)**. Put the Roof vent at roughly **(470, 400)** and the Stockroom door at **(615, 505)**. Use a cream roof, a wide extractor cap and a striped canopy over the loading door. Tuck the parked Spin City van out of the live approach.
- Mount the existing `porch` detector over the loading-yard gate at **(540, 910)**, with a **290 px** trigger radius, **340 px** active radius and **1.00 s** map fuse. On arm, the lamp head swivels toward the saucer and lights up a floury handprint on the gate. Keep that light local to the prop and show a static handprint reveal in reduced motion. At the 430 px/s speed cap the shorter direct approach still spends about **1.05 s** under the light after its **0.40 s** arm. The shortest paths from spawn to either ring cross its trigger. Leave a clear retreat from the edge. The lamp shows its exact arming arc in amber before the hard active boundary appears. The boundary and saucer fuse go red on actual exposure. A player who brushes the boundary can steer out while the fuse still has room, then see it drain in clear air.
- Mark the west detour from the fork via **(140, 1250) → (140, 520)**. Follow the verge until north of the gate light, then branch to either ring. The first leg stays at least **340 px** from the gate, the verge stays **400 px** away, and both branches stay more than **400 px** away. All three legs stay outside the **290 px** trigger, for **0 s** of arming.
- Keep the whole hover pocket at both rings outside the active radius. The first lesson is how far to go around a triggered hazard. Each ring has a name and a terrain landmark. No concurrent flight detector. Any pools of decorative light remain soft.
- At the fork, show “Go around the gate light” / « Contournez la lampe du portail ».
- Use the existing flight speech hook for Zib’s handprint line on the first arm visible to the player. Start it when the handprint appears, including in reduced motion.

### Specimen and rooms

**Baker Mabel** fell asleep on the break bench with her apron still on. Give her a floury plum apron over rolled-up teal sleeves and use the standard ragdoll rig. Her cat, **Crumb** (**Miettes** in French), is the only secondary sleeper and uses the existing asleep/awake cat art and second wake meter.

| Route | Room and drag | Souvenir |
| --- | --- | --- |
| **Stockroom door** (*Porte de la réserve*) · recommended · `mabel_stockroom` | Lift Mabel from the padded bench and over the cooling rack. Give her a whole-body hold pocket above the highest edge, directly over Crumb and the keys. Keep both feet clear of the metal before moving out through the wide door. A hit on the rack near Crumb feeds the existing secondary wake meter. A quiet hold above him is safe. The direct drag hits the rack. A paper bag marked **LARRY** sits beside the keys. | **Sourdough starter** on a shelf facing the safe approach. |
| **Roof vent** (*Aération du toit*) · short · `mabel_vent` | Start on the same bench. Drift sideways past the overhanging trays on the flour trolley to get under a broad vent, then lift. The overhang catches a straight lift, and a bump near the trolley can wake Crumb. Keep enough headroom for Mabel’s feet to follow into the vent. | **Kitchen timer** on the service shelf at the turn. |

Start both routes from the same settled pose. Seat the chest, hips and heels on the bench or leave them clear of the supports. Separate the paws, rack and souvenir from the initial body envelope. No timed object crosses the spawn. Use the existing hard interior rules with the normal release-to-hold behaviour. The first screen should show the sleeper and the lift direction so a player can recover by looking at the room.

The dough swells over its bowl as Mabel sleeps. Scale its sprite above a fixed bowl and use a static overflowing pose in reduced motion. Show her floury outline on the bench when the body clears it for the first time. The roll bag, dough and flour imprint are scenery with no collider, wake or pickup.

### Evidence Locker

| Slot | EN name and catalogue text | FR name and catalogue text |
| --- | --- | --- |
| Souvenir · `sourdough starter` | **Sourdough starter.** Mabel’s oldest employee. Fed twice a day, never paid. Zib says they relate. | **Levain.** Le plus ancien employé de Mabel. Nourri deux fois par jour, jamais payé. Zib connaît ça. |
| Souvenir · `kitchen timer` | **Kitchen timer.** Goes off at four and wakes the whole street. Except Mabel. The street has asked us to keep it. | **Minuteur de cuisine.** Sonne à quatre heures et réveille toute la rue. Sauf Mabel. Les voisins nous ont demandé de le garder. |
| Field Finds · `cherry_pie` | **Cherry pie.** Its steam curled into a little finger and beckoned. Zib followed it by the nose. | **Tarte aux cerises.** Un petit doigt de vapeur a fait signe à Zib. Son nez a fait le reste. |

The **cherry pie** is the only town pickup. Set it on a back windowsill at the west loading apron near **(180, 660)**. Draw a short outbuilding wall and sill behind the pickup so the lattice and tin read in full against them. Use a **112 × 96 logical px** silhouette with a broad lattice, dark-red filling and a contrasting tin. Curl the soft steam like a beckoning finger, with a static pose in reduced motion. Keep the entire 48 px hover catchment beyond detector coverage. Use the one-second mint lock. File the pie on any filed report and award its fourth star on delivery with the pie aboard. [Town pickup rules](GDD-8-map-collectibles.md)

| Pickup copy | EN | FR |
| --- | --- | --- |
| `memoHint` | `a cherry pie` | `une tarte aux cerises` |
| Unfound hint | Cooling on the bakery’s back windowsill. | Refroidit à l’arrière de la boulangerie, sur un rebord de fenêtre. |
| Found status | Half eaten. Vrell denies everything. There’s cherry on his clipboard. | À moitié mangée. Vrell nie tout. Son porte-bloc est taché de cerise. |

| Archive ID | Name | Age | Height | Weight | Description | At 3 deliveries | At 10 deliveries |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| `mabel` · EN | Baker Mabel | 55 | 163 cm | 71 kg | Bakes a breakfast roll for Larry from the laundromat every morning. He has never been awake to collect it. | Poked the saucer wall and said it needed another ten minutes. | Tried our complimentary biscuit. Sent it back. Called it a cracker with ambitions. |
| `mabel` · FR | Mabel la boulangère | 55 | 163 cm | 71 kg | Prépare chaque matin un petit pain pour Larry, de la laverie. Il dort toujours à l’heure de venir le chercher. | A tâté la paroi de la soucoupe et dit qu’il lui fallait encore dix minutes. | A goûté le biscuit offert. L’a renvoyé. « Un biscuit apéro qui se prend pour un sablé. » |

### Lines

| Cue | EN | FR |
| --- | --- | --- |
| Zib, first on-screen motion-light arm | “Caught white-handed. And it isn’t even my hand.” | « Pris la main dans le sac. De farine. Et c’est même pas ma main. » |
| Vrell, first delivery | “Crumb opened at five. He knocked the card reader off the counter. Cash only.” | « Miettes a ouvert à cinq heures. Il a fait tomber le terminal de paiement. Espèces uniquement. » |
| Gazette, two or more sightings | **BAKER’S BUNS SEEN RISING INTO NIGHT SKY** | **LES MICHES DE MABEL S’ENVOLENT EN PLEINE NUIT** |
| Mabel, mumble | “I knead five more minutes…” | « Encore cinq minutes… je suis pas encore levée… » |
| Pickup, collected on a repeat | “There’s a note under the pie. ‘Bring back the tin.’” | « Il y a un mot sous la tarte. “Rendez le moule.” » |
| Pickup, left behind | “You left the pie. Crumb sat in it.” | « Vous avez laissé la tarte. Miettes s’est assis dedans. » |
| Zib, sighting retry | “Around the lamp this time. It knows what I look like now.” | « Je contourne la lampe, cette fois. Elle sait à quoi je ressemble. » |

Use the existing first-clear cover-story row for “The first loaf clocked in. Mabel is still listed as out on delivery.” / « Le premier pain a pointé. Mabel est encore « en livraison ». » Show a floury paw print on the **OPEN** / **OUVERT** sign in the report art. The sign sets up Crumb’s cash-only punchline.

### Clock and proof

One delivery ends the shift. Show elapsed time without a countdown or dawn wash. **Night owl by 56 s**, with an initial clean casual median of **32–44 s**. Keep enough room for a quiet stop and the **6–10 s** pickup branch. A full sighting or failed room loses Ghost for that run. Retrying from the live checkpoint can still earn Delivered. Start with at least 95% skilled and 85% casual delivery on each room route over 20 seeds. The recommended Stockroom door should reach 95% casual.

Override the memo’s Delivered and Night owl goals. Use the elapsed par of **0:56** for `{time}`.

| Memo goal | EN | FR |
| --- | --- | --- |
| Delivered | `{star} — bring Mabel aboard` | `{star} — embarquer Mabel` |
| Night owl | `{star} — finish in {time} or less` | `{star} — {time} ou moins` |

Test both flight beelines at 0, 2.5, 5 and 8 s. Each must be spotted by the motion light or fail to lock within a **60 s test window**. That cap is for the test. Each room’s direct 270 px/s drag must fail a clean delivery within 45 s at all four phases. The ordinary route, pickup route and ten-second idle proof all use the same collision and wake rules.

## #0004 · While the Hendersons Are Away

**Setting.** The Hendersons are away. Nora Finch is house-sitting and Len Briggs is fixing a bicycle next door. Gary from Neighbourhood Watch fitted the garage alarm. Mrs. Pruitt has her binoculars and binder out across the lane. The Hendersons stay offscreen.

**Work Order card.** *While the Hendersons Are Away* · *Birch Lane, Maple Court turn* · “Two sleepers. One neighbour who isn’t.” FR *En l’absence des Henderson* · *Chemin des Bouleaux, angle de l’allée des Érables* · « Deux dorment. La voisine, elle, veille. » Nora wears her quilted vest, with Len in work overalls just behind her.

**Shift memo**

> **Work Order #0004 · While the Hendersons Are Away**
>
> Bring in Nora from the Hendersons’ garage and Len from next door before dawn. Mrs. Pruitt across the lane hasn’t slept since 1994. The Hendersons left their garden gnome behind. He’s sulking by Len’s east drive.
>
> The alarm code is behind the laser. Gary from Neighbourhood Watch fitted the laser for free. It’s caught him four times.
>
> — Vrell. Don’t water the fern. It’s plastic.

> **Ordre n°0004 · En l’absence des Henderson**
>
> Ramenez Nora du garage des Henderson et Len de l’atelier voisin avant l’aube. Mme Pruitt, en face, n’a pas dormi depuis 1994. Les Henderson ont oublié leur nain de jardin. Il boude près de l’allée de Len, côté est.
>
> Le code est derrière le laser. Gary, de la surveillance du quartier, l’a installé gratuitement. Il s’est fait prendre quatre fois.
>
> — Vrell. N’arrosez pas la fougère. Elle est en plastique.

### Flight

- Greybox a **1440 × 1680** block. Start at **(720, 1570)**. The northbound Birch Lane frontage splits into two drives by a low brick wall. Line the Hendersons’ front garden with a tall clipped hedge in view from their drive. Keep the hedge as scenery and leave the low wall visible as the drive divider. Put the Hendersons’ garage near **(460, 620)** and Len’s workshop near **(1020, 760)**. Give the garage a shallow tiled roof with a raised loft hatch, and the workshop a corrugated lean-to with a wide skylight and a parked bicycle. Start the Nora ring centres at **(560, 675)** and **(450, 565)**, and Len’s at **(915, 775)** and **(1025, 675)**, in recommended-first order. Connect the drives by an open cross lane north of the detector, so a first delivery leaves the saucer on the safer side. Place both approaches in view of their respective ring landmarks.
- Angle a blue bin lid against the fence like a parked saucer, with the handle showing. Draw a soft shadow under it. Put Mrs. Pruitt and her binder in one upstairs window near **(720, 950)** using the existing `watcher` detector and house. Start at **590 px** range, **0.88 rad** half angle and a **0.90 s** fuse. Use south-facing bearings **π/2 ± 0.20 rad**, sweep amplitude **0.06 rad** and a **3 s** hold at each bearing. The shared sector covers at least **412 px** of each straight line to a first ring, about **0.96 s** at the speed cap. Only the watcher raises Suspicion.
- From the west turnout **(125, 1420)**, mark a diagonal through a gap in the brick frontage to **(430, 1200)**, then follow the drive north. Mirror it from **(1315, 1420)** through **(1010, 1200)**. Put the crossing prompt beside each marked cut. Each cut clears during the opposite hold. The outer verge skirts the entire sweep and the north cross lane stays clear. At greybox, verify the full width and timing of both cuts, including the northbound bend, and the beeline overlap at all four start delays.
- Use the existing proximity bark on the first approach to the bin lid. Reuse the amber binocular glint and future sector. During that same preview, show Pruitt turn a page just before she pans. In reduced motion, hold the page still and keep the same amber timing and geometry. Show the current cone as a hard edge at its actual angle, and turn its edge and the fuse red on exposure. Keep the two cones distinct through the transition. From either delivery ring, the next valid rings and the route back stay visible through the same minimap and labels. Leave the cruiser for Maple Court.

### Specimens and rooms

**Nora Finch** fell asleep on a folding cot in the garage while waiting for Gary to come switch the laser off. A watering can sits beside the cot. She wears a rust-coloured quilted vest over a striped jumper. **Len Briggs** sat down in his workshop to listen for a tick in a bicycle wheel. His ear is inches from the free-spinning wheel. The slow rotation is scenery and holds still under reduced motion. Give him blue work overalls and a wool cap. Both use the standard ragdoll.

| Specimen | Route | Room and drag | Souvenir |
| --- | --- | --- | --- |
| Nora | **Side door** (*Porte latérale*) · recommended · `nora_side` | Lift Nora above the garage workbench. There’s room to park her whole body, see the emitter and cross the laser perpendicularly when it drops. Keep the side door wide and clear. The workbench stops a straight drag even when the laser starts off. | **House-sitting checklist**, headed **ALARM CODE** / **CODE DE L’ALARME**, on the far shelf beyond the laser. Make it visible from the wait pocket and reachable on the natural line to the exit. |
| Nora | **Loft hatch** (*Trappe du grenier*) · short · `nora_loft` | Lift sideways out of the cot bay, then hold Nora horizontally above a low tool chest before the last lift. The chest and loft fascia are solid. The same loaned laser covers the opening into the loft bay. The high wait pocket is tighter and the hatch itself is clear. | **Magnetic parts dish** on the pegboard shelf just beyond the crossing. |
| Len | **Workshop door** (*Porte de l’atelier*) · recommended · `len_workshop` | Lift Len over the repair counter, let the feet catch up in the gap above the vice, then move out the wide door. A counter return blocks the direct drag. The furniture is the only obstacle in this building. | **Bicycle bell** on the counter’s open end. |
| Len | **Skylight** (*Lucarne*) · short · `len_skylight` | Take Len feet-first around the handlebars of an upside-down bicycle on the repair stand, then up through the skylight. Match the static collider to the obstruction and give his feet room to settle beyond it. | **Biscuit tin** on the open shelf above the stand. |

Keep each room to one short cutaway, at most two screen widths. Pegboard, exposed rafters and a bare bulb set the rooms apart from the bakery. For Nora, start with the existing laser cycle at **7.5 s** with **4.5 s off**. Use an amber rearming line and a sharply drawn live beam whose rendered segment matches its collision area. A strike trips the alarm and shows the red failure cue. Place the early warning, crossing and safe waiting space in view together. Use “Wait for the line to go dark” / « Attendez que la ligne s’éteigne » at the garage wait pocket and “Cross when she looks away” / « Passez quand elle regarde ailleurs » at the flight turnout. Keep the laser as the only timed obstacle and put the emitter well beyond the idle body envelope. Keep Nora supported by the cot and Len in a settled chair pose with all limbs clear. The souvenir spots and actor supports must pass the idle test before tuning anything else.

In both garage routes, pin a strip of four flash photos next to the alarm panel. Every frame shows Gary caught in his own laser. In the last photo he is still holding the installer’s manual. The strip is scenery without text. Show the checklist’s alarm-code header from both wait pockets. In the loft route the checklist is scenery and the parts dish stays the souvenir.

### Evidence Locker

| Slot | EN name and catalogue text | FR name and catalogue text |
| --- | --- | --- |
| Souvenir · `house-sitting checklist` | **House-sitting checklist.** Bring the bins in. If Gary drops by, pretend to be on the phone. | **Liste de gardiennage.** Rentrer les poubelles. Si Gary passe, faire semblant d’être au téléphone. |
| Souvenir · `magnetic parts dish` | **Magnetic parts dish.** Contains one screw. The household is waiting to find out what wobbles. | **Coupelle aimantée.** Contient une vis. Tout le monde attend de voir ce qui va prendre du jeu. |
| Souvenir · `bicycle bell` | **Bicycle bell.** The only thing in Len’s workshop that belongs to Len. He thinks. | **Sonnette de vélo.** La seule chose dans l’atelier de Len qui lui appartient. Enfin, il croit. |
| Souvenir · `biscuit tin` | **Biscuit tin.** Contains bolts. The tin marked BOLTS contains biscuits. Len says the system works. | **Boîte à biscuits.** Contient des boulons. La boîte marquée BOULONS contient des biscuits. Len dit que ça marche très bien comme ça. |
| Field Finds · `garden_gnome` | **Garden gnome.** Holds a fishing rod over a pond that was filled in years ago. Still hopeful. | **Nain de jardin.** Pêche au-dessus d’une mare comblée depuis des années. Il y croit encore. |

The **garden gnome** is the only town pickup. Put him on the east apron by Len’s drive around **(1255, 610)**. Draw him at **96 × 120 logical px**, with a pointed red hat, white beard, chunky boots and a fishing rod that reads against open ground. Keep art and hover circle beyond the watcher’s whole fan and clear of roads and roofs. Use the standard mint marker, minimap diamond and hover. File him on any filed report. Both specimens and the gnome aboard in the same run earn the fourth star. [Town pickup rules](GDD-8-map-collectibles.md)

| Pickup copy | EN | FR |
| --- | --- | --- |
| `memoHint` | `garden gnome` | `nain de jardin` |
| Unfound hint | By Len’s east drive. Bring a passport. | Près de l’allée de Len, côté est. Prenez votre passeport. |
| Found status | On holiday at last. | Enfin en vacances. |

The gnome sends postcards in his Field Finds status. The existing found flag gates the set. Read the era delivery flags when the catalogue opens and show one short status entry per delivered era, in dial order. Each clear reveals its own card whichever way the player travels. Put the dated lines in a wrapped status block in the existing detail modal. Keep the shelf label short. Replays and reloads use those same flags.

| First delivery | EN | FR |
| --- | --- | --- |
| 1122 | “Wet. Cows. Wish you were here.” | « Pluie. Vaches. Dommage que vous ne soyez pas là. » |
| 1953 | “Drive-in. The main feature needed a tissue.” | « Drive-in. Le film aurait bien eu besoin d’un mouchoir. » |
| 2199 | “The future. Nearly a road. Saved by paperwork. Typical.” | « L’avenir. J’ai failli finir sous une route. Sauvé par la paperasse. Évidemment. » |

| Archive ID | Name | Age | Height | Weight | Description | At 3 deliveries | At 10 deliveries |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| `nora` · EN | Nora Finch | 46 | 168 cm | 73 kg | Sorts her key list by the door each key ought to open. There’s a column for surprises. | Took the spare saucer key home for safekeeping. She says it’s on the list. She won’t say which list. | Found out the fern was plastic. Watered it anyway, out of respect. |
| `nora` · FR | Nora Finch | 46 | 168 cm | 73 kg | Classe les clés par porte sur sa liste. Elle a prévu une colonne pour les surprises. | A emporté la clé de secours de la soucoupe pour la mettre à l’abri. Elle dit que c’est sur la liste. Elle ne dit pas laquelle. | A découvert que la fougère était en plastique. L’a arrosée quand même, par respect. |
| `len` · EN | Len Briggs | 62 | 177 cm | 81 kg | Has borrowed the Hendersons’ tools for so long he calls it ‘storage’. They’re too polite to ask. | Serviced the saucer while in the hold. It now has a bell. Nobody knows where he got the bell. | Fitted the saucer with stabilisers. Now it turns like a pram. |
| `len` · FR | Len Briggs | 62 | 177 cm | 81 kg | Ça fait si longtemps qu’il emprunte les outils des Henderson qu’il dit les « garder en dépôt ». Ils sont trop polis pour les réclamer. | A révisé la soucoupe pendant le trajet. Elle a maintenant une sonnette. Personne ne sait d’où elle sort. | A monté des petites roues sur la soucoupe. Elle tourne comme une poussette. |

### Lines

| Cue | EN | FR |
| --- | --- | --- |
| Zib, launch | “Binoculars and a binder. Vrell, I think she’s one of us.” | « Des jumelles et un classeur. Vrell, je crois qu’elle est des nôtres. » |
| Zib, first approach to the bin lid | “Is that one of ours? …It’s a bin lid. Nice lines, though.” | « C’est un des nôtres ?… Ah, un couvercle de poubelle. Belle ligne, quand même. » |
| Vrell, first clear | “Both aboard. Mrs. Pruitt has logged the saucer as an extension without planning permission.” | « Les deux sont à bord. Mme Pruitt a inscrit la soucoupe dans son registre comme extension sans permis de construire. » |
| Gazette, two or more sightings | **MRS. PRUITT REPORTS SAUCER FOR 37TH TIME. FIRST TIME SHE’S RIGHT.** | **MME PRUITT SIGNALE UNE SOUCOUPE POUR LA 37ᵉ FOIS. ET CETTE FOIS, ELLE A RAISON.** |
| Nora, mumble | “I’m asleep for security reasons…” | « Je dors pour des raisons de sécurité… » |
| Len, mumble | “There’s the tick… oh. It’s my watch…” | « Ce tic-tac… ah, c’est ma montre… » |
| Pickup, collected on a repeat | “He’s requested a window seat. And a little umbrella in his drink.” | « Il a demandé une place côté hublot. Et une petite ombrelle dans son verre. » |
| Pickup, left behind | “The gnome stayed. Tomorrow he’s trying the bus.” | « Le nain est resté. Demain, il tente le bus. » |
| Zib, return to flight | “One aboard. That ties my record. They’re making me do it twice.” | « Un à bord. J’égale mon record. Et ils veulent que je recommence. » |

### Clock and proof

Start the shared clock at **2:00**, with dawn at **6:00** after **210 real seconds**. Night owl requires **110 s left**, so **par is 100 s**. The clock is live in flight and abduction and keeps its value through the retry choice, using the same charge rules as Maple Court. A delivered first specimen stays aboard on a sighting or failed second room. Aim for a **62–85 s** clean casual median and **8–14 s** for the pickup branch. Sunrise can be reached in a deliberately slow run. Keep the existing dawn warning and one familiar timer in both HUDs. The first flight return shows **1/2** and points the camera at traversable space near the checkpoint.

Over 20 seeds, each room should deliver at least **90% skilled** and **80% casual**, with the recommended route for each sleeper at **90% casual** or better. Test both delivery orders with the bot, plus the recommended approaches under human input. At each of the four start delays the existing shortest-open-path flight pilot must get spotted or time out before the full quota. Also test direct holds from spawn to each initial ring, to keep the lesson on the first leg. If an untimed route slips through, move the detector or the throat before reducing the fuse. Each room must reject the direct 270 px/s drag within 45 s at all four start phases. Catch the straight drag on the visible set geometry even in a favourable laser phase.

## Shared implementation details

### Flight, clocks and reports

- Register both maps as deep levels with one and two targets. Add the two-target tuple to `DeepMap`. Use the map’s target count for completion copy, counters, report stamp and the Delivered condition in `computeDeepStars`. `DeepRun` already completes from its target array. Preserve L8’s troop tallies and distinct Ghost rule and L9’s time-car and deadline. Read the cap and labels from the level config in both HUDs and in the whole-shift evaluator.
- Give #0003 an explicit par-only clock mode. Keep accumulating active shift time and growing detector phase, with no sunrise deadline. Use the existing elapsed-time presentation and make the spare-time row read as elapsed time against par. Replace tests that assume a finite sunrise budget with a harness time cap for this mode. Pass through #0004’s 210 s config via the ordinary sunrise HUD and report path. Retain the current checkpoint, sighting and room-choice behaviour.
- Add both memo, route and star families to `en.ts` and `fr.ts`, including exact localized `memoHint` strings. Place the motion-light instruction at #0003’s fork. Put the binocular and laser instructions at #0004’s first safe turnouts. Flight lines use the shared speech layer and `readSeconds()`. At 375 × 690, check the first screenshot for a readable hazard, ring entrances, prop silhouettes and a single clear next action even if the player skipped practice and the memo.
- Add first-clear, retry, ambient, pickup collected/left behind and souvenir copy through the existing `humor`, `report` and `report-extras` paths. Reuse the Gazette threshold of two sightings. Give each order one level-specific cover story and headline family. Use the existing found/left-behind row, preserve the first-clear and sunrise priorities, and keep second-leg return chatter local to #0004.
- Give each room its own base item. The proposed catalogue rises from 41 to 47 souvenirs, eight to ten field finds and 23 to 26 specimens. Register all six items, both finds in `PICKUP_SIZE` and all three Archive dossiers, with EN/FR names, plurals, descriptions and statuses. Keep the cosmetic probe status. Verify the gnome’s postcards before collection, after each possible era order and after reload.

### Order numbers and saved progress

| Work Order | Save key | Card |
| --- | --- | --- |
| #0001–#0002 | `level1`, `level2` | Doyle Farm, Spin City |
| #0003 | `birch_bakery` | Baker Mabel’s First Batch |
| #0004 | `birch_neighbours` | While the Hendersons Are Away |
| #0005–#0011 | `level3` through `level9` | Maple Court through Crest Valley |
| #0012 / #0013 / #0014 | `level10` / `level11` / `level12` | 1122 / 1953 / 2199 |

Insert the two IDs in `LEVEL_IDS` and the matching definitions in `LEVELS`. Array order drives card numbering and the default single predecessor. The era orders use their explicit prerequisites. Format `num` with `String(num).padStart(4, "0")` and pass the padded value to the existing EN and FR format token. Use stable IDs for level-specific logic. Audit the Field Check’s hard-coded index and return/skip labels, `num - 1` in the evaluator, memo addressees, e2e selection, and difficulty-tier and legacy unlock tests tied to displayed numbers. Key Dispatch headers by stable ID. From `level9` (#0011) through `level12`, use “TO: Agent Zib (junior)” / « À : Agent Zib (junior) » until the first 2199 delivery. After that delivery, use “TO: Agent Zib” / « À : Agent Zib » on those same orders. Keep the pre-hire address on `level7` (#0009). Renumber the English and French card, memo subject and other player-facing order labels, including the #0002-B drill’s destination. Keep the content IDs for Dave, Gary, Pruitt and every existing room, find and trophy. The old `legacyDispatch` grant applies to the stable ID set `level3` through `level7`.

Use a `night-shift-save-v3` storage key so an older build on the same origin can still write its own v2 format. On first v3 load, import valid v2, with v1 as the legacy source when needed, and write the migrated save. Keep the two old keys available to those builds. Existing level progress, fourth stars, best times, attempts, found IDs, Glorbs, upgrades, reports, language, debug unlocks, practice flag, specimen/probe counts and trophy provenance keep their values. Both new level records begin empty.

- A fresh save unlocks #0003 from Spin City, #0004 from #0003, then Maple Court from #0004. A v2 import with only Spin City delivered follows the same path.
- Give imported saves that attempted Maple Court or delivered any original `level3`–`level9` order a persisted access flag for both new orders and Maple Court. Also preserve any pre-existing legacy unlocks. The flag grants access to the whole bridge without making up deliveries, rewards or finds. Returning players with a cleared original deep order keep their next forward dispatch highlighted and can find the bridge from Work Orders. A player whose furthest progress was an attempt on Maple Court sees the bridge as their recommended next stop and can still retry Maple Court. Preserve the progression successor for old out-of-order clears.
- Make the access import idempotent. A reset writes an empty v3 save so an old record stays ignored. Verify a production/preprod reopen, rerun of each import, and a reload after earning a bridge star.

`MAX_STARS` goes from **35 to 43**, with two new sets of four, and reaches **55** once all three era orders ship. Keep the rank thresholds at **0 / 3 / 5 / 8 / 11 / 15 / 19** so saved ranks carry over and the earlier shifts can pay for equipment. A full clear of the first four cards brings 15 stars, and Fleet Admiral of Naps first becomes possible at Maple Court. Use the normal deep pay for both orders. That makes upgrades available earlier, so tune and prove the on-ramp with zero upgrades.

### Art pack

Use original vector designs and primitive fallbacks. Reuse suburb tiles and roofs for background houses, roads, kerbs, the Spin City van, Pruitt’s house/window, the porch mount, cat poses, bench and chair poses, exit trims, shelves, the workbench, sleeper tells, laser hardware and the existing HUD. Check final sprite footprints against greybox colliders and art sizes. Global rules for detectors, wake, beam and backdrop lighting stay shared.

| New keys | Count | Suggested native size and silhouette |
| --- | ---: | --- |
| `flight/birch_bakery_top`, `flight/henderson_garage_top`, `flight/len_workshop_top` | 3 | 300×240, 320×240, 260×200. Extractor cap, loft hatch and corrugated lean-to read from overhead. |
| `flight/pickup_cherry_pie`, `flight/pickup_garden_gnome` | 2 | 112×96, 96×120. Three-quarter angles and clear profiles on the ground and in Field Finds. |
| `flight/bakery_loading_gate_top`, `flight/bakery_back_windowsill_top` | 2 | 150×86, 160×108. Gate and lamp mount with a handprint layer revealed by the porch arm. Short rear wall with a broad sill. The pie has its own sprite. |
| `human/{mabel,nora,len}_{head,head_awake,torso,upper_arm,lower_arm,upper_leg,lower_leg}` | 21 | Standard L1–L3 rig and manifest sizes. Flour and pencil, quilted vest and wool cap distinguish the three portraits. |
| `room/bg_birch_bakery`, `room/bg_birch_workshop` | 2 | 540×960 each. Atmosphere and wall treatments only. |
| `room/cooling_rack`, `room/flour_trolley`, `room/bike_repair_stand`, `room/folding_cot` | 4 | 220×120, 140×120, 180×110, 240×36. Match outlines to the colliders and leave space to read the tell. Reuse the existing workbench and counter, and a low cabinet for the tool chest where it fits. |
| `room/sourdough_starter`, `room/kitchen_timer`, `room/house_sitting_checklist`, `room/magnetic_parts_dish`, `room/bicycle_bell`, `room/biscuit_tin` | 6 | 48×55, 40×52, 48×32, 46×36, 48×44, 56×38. Read from the route and in the trophy silhouette. |
| `room/bakery_roll_bag`, `room/bakery_dough_bowl`, `room/bakery_dough`, `room/bakery_flour_imprint`, `room/gary_flash_strip` | 5 | 56×68, 80×36, 72×42, 190×64, 104×38. Leave the bag blank for the retained **LARRY** label. Separate dough from bowl for scaling. Draw the flour imprint flat on the bench and give each flash frame a distinct Gary pose. |
| `ui/bakery_open_sign` | 1 | 96×54. Floury paw print and room for the localized sign text. |

Total first-pass cost is **46 SVG keys, two maps, six playable room routes and three specimen rigs**. The four level/room data modules are the main new code. Existing detectors cover both shifts. Use retained shapes for the handprint, steam, keys at Crumb’s paws, wheel and bin-lid decoy. Place the slipper flyer in the front window and use a retained localized header on the checklist behind the laser. Add the icons to the art contact sheet and use the two field-find models at normal flier scale when checking the phone view.

## Build split and acceptance

| Pass | Owner and scope | Proof |
| --- | --- | --- |
| 1. Dispatch and scoring | **Coordinator** owns `levels/{types,levels,run,save,progress}.ts`, IDs in `contracts.ts`, the clock mode, target-count stars/reports, Field Check routing and numbers. | Fresh, L2-only import, Maple attempt, later delivery including sparse/out-of-order saves, v1 legacy, reset and reload. Verify 1/1, 2/2, 3/3 and L8 troop counts, deadline and par boundaries, skip/replay, next dispatch and fourth star versus filed pickup. |
| 2. Flight greyboxes | **Flight** owns `src/levels/deep-birch-bakery.ts` and `deep-birch-neighbours.ts`. Reuse porch and watcher fields. Stage the gate, windowsill and false saucer with the existing prop and speech views. Author road junctions, ring positions, lookout timing, pickup pockets and a clean pointer approach to each exit. | `flight-autopilot`, `flight-roads`, layout and pickup-figure tests, both new maps in `scripts/pixi/check-bubbles.mjs`, four beeline start delays, flight restart and next-leg checkpoint. |
| 3. Room greyboxes | **Rooms** owns `src/abduct/rooms/deep-birch-bakery.ts` and `deep-birch-neighbours.ts`, the six exits, Crumb’s keyring hold, Len’s handlebars and every souvenir placement. Set the checklist past the laser and stage the bag, dough, flour imprint and photo strip in the retained room view. | `abduct-spawn` across `ROOMS` and Field Check, `abduct-deep`, souvenir reach, direct-drag regressions, mouse/touch jitter and release-to-hold with the authored exits. Both wake meters start at zero. |
| 4. Art | **Art** owns the keys above, with final sizes agreed with the flight and room owners, plus the contact sheet. | Real phone previews of pickups, roofs, sleeper portraits and cutaways, including missing SVGs and reduced-motion tells. |
| 5. Copy and catalogue | **Story/UI** owns EN/FR work orders, lanyard and Maple Court handoffs, the Pruitt tip gate, radio and report jokes, the bakery’s paw-print sign, Gazette and both Evidence Locker entries, including the three gnome postcards. | `flight-collectible` covers unique pickups and both memo hints, `ui-trophies*` covers items, finds and specimen entries, and `ui-report*` covers the report rows, Vrell comment priorities and localized wrapping. |
| 6. Tune and play | **Difficulty** owns the two new bands, standard and pickup-first samples and seeded beelines. **Verification** drives the phone build. | Run `DIFFICULTY_LEVELS=birch_bakery,birch_neighbours,level3 npm run difficulty` at 6 and 20 seeds, then `npm test`, typecheck and build. Extend the real-pointer playthrough and bubble script to enumerate from stable IDs. |

Measure skip and detour runs via `DeepRun`, live flight and simulated abduction. Record all four beeline phases, first sighting source, time per leg and peak Suspicion, room failures, secondary-sleeper wake, clearance, retries and all four star rates. Keep the existing early deep gates for par usage (30% minimum), casual median peak Suspicion (5% minimum), average route median peak wake (20 minimum) and 80 px obstacle-or-mechanic approach. For each level, prove one four-star detour with the bot and at least one per model over 20 seeds. Keep the room-route samples separate from whole-shift samples. A high result from the route-aware model needs a real-thumb check.

Use the project’s [browser verification recipes](../.claude/skills/verify-night-shift/SKILL.md) with a fresh save at **375 × 690**. Watch first-time players after the Spin City report, including a group that skips practice. Record whether they see the warning before crossing, which ring they choose, whether they regain control after exposure, where they stall in the room, whether they find the second target and whether they finish Maple Court. Verify both languages, muted and reduced-motion tells, and the four-star report plus Trophy Room reload. Retain the Field Check as optional practice and target the post-Gary approach for diagnosis before changing Maple Court’s clock or challenge. The timings and targets are proposals for greybox review.
