# GDD-12 · Ni! (Grimsby Keep, 1122)

Krix wants exclusive rights to the Holy Grail so OBELISK™ can sell eternal life by the month. Zib has until dawn to collect the three witnesses who signed in their sleep.

## The shift

**Work Order #0012** with the [Birch Lane orders](GDD-11-onramp.md) included. Stable ID `level10`. The first delivery in [Clocking Out at 10:04 (#0011)](GDD-10-1955.md) opens both 1122 and [1953](GDD-13-1953-tripods.md). Highlight 1122 as the suggested first stop and accept either order. [2199](GDD-14-2199-hitchhiker.md) opens once both have a delivery.

Three sleeping signatures are all Krix has. Filing the witnesses voids his claim and the Grail stays a rumour. The Work Order card shows Rodney and reads “Three witnesses. The cows are hostile.” FR *Sacré Graal !* · « Trois témoins. Les vaches sont hostiles. » The keep stands on the harbour bend. The film anchors are the taunting battlements, the coconut cavalry, the Black Knight’s bridge, the Killer Rabbit and the knights’ demand for a shrubbery. [Monty Python’s film synopsis](https://montypython.com/film_Monty%2BPython%2Band%2Bthe%2BHoly%2BGrail%2B%281975%29/15)

**Shift memo**

> **Work Order #0012 · Ni!**
>
> Agent Zib, Krix is out on appeal and back with OBELISK™. Our rivals want the Holy Grail to charge by the month for eternal life. Their three witnesses signed in their sleep. Bring them in by dawn so Legal can void the signatures. The knights by the west hedge demand a shrubbery. The time window only takes still passengers: let go in the exit and wait for the bar, or they arrive in instalments.
>
> The French are throwing cows. If the road moos, move.
>
> — Vrell. No jousting on Bureau time.

> **Ordre n°0012 · Sacré Graal !**
>
> Agent Zib, Krix a fait appel et retravaille chez OBELISK™. Nos concurrents revendiquent le Saint Graal pour vendre la vie éternelle par abonnement. Leurs trois témoins ont signé en dormant. Ramenez-les avant l’aube pour que le juridique annule les signatures. À la haie ouest, des chevaliers réclament un jardinet. La fenêtre temporelle ne prend que des passagers immobiles : lâchez-les dans la sortie et attendez la jauge, sinon ils arrivent en plusieurs morceaux.
>
> Les Français lancent des vaches. Si la route meugle, dégagez.
>
> — Vrell. Pas de joute pendant le service.

## Flight

Greybox **1800 × 2320** logical px, coordinates from the top left. West launch **(180, 2060)**: the coconut cavalry trots in on a spur of the west cart track (2026-11-26 openings rework, see `tests/levels-spawn-variety.test.ts`; the old south launch at (900, 2150) opened on the sentry's cone). Warm lanterns with soft pools on the outside banks mark the two detours. The west cart track runs through **(265, 1930) → (265, 1210) → (330, 920)**. The east sheep track goes through **(1525, 1900) → (1515, 1230) → (1530, 660)**. The rear lane at **y 310** joins the two banks. Leave a crossing along **y 1010** between the bridge’s north approach and the lower end of the tower track. Keep the banks and moat edge visible as terrain landmarks. Give any collision boundary that survives greyboxing its own visible edge.

| Place | Centre | Entry rings |
| --- | --- | --- |
| Rodney’s pavilion, west market | (445, 955) | **Supply flap** / **Rabat de service** (315, 990), recommended · **Banner loft** / **Grenier aux bannières** (495, 790) |
| Black Knight’s bridge gatehouse | (900, 735) | **Toll arch** / **Arche du péage** (785, 855), recommended · **Portcullis loft** / **Combles de la herse** (1020, 650) |
| Tom’s tower, east crag | (1405, 560) | **Stone stair** / **Escalier de pierre** (1550, 620), recommended · **Smoke hole** / **Trou de fumée** (1325, 390) |
| French outwork | (762, 1065) | Mid-field, south of the bridge, with the cow gantry and two sentries back to back on its north wall (2026-11-26 pressure rework). The French have rolled their abandoned wooden rabbit on wheels up to Rodney’s tent at **(204, 1012)**, and the taunter perches on it. The wooden rabbit is scenery without a collider or detector. |
| Rabbit cave | (1190, 970) | Set its mouth into the crag at the tempting turn from bridge to tower. |

Draw the entry rings and pickup lock in mint with the existing UI. Draw the real edge of each active detector, with red on exposure. Amber previews the actual next danger. Torch spill and moonlight stay soft. Build the views once. Keep the same hazard footprints and phase changes in reduced motion, and drop the shake and animated flourishes.

At the west launch, hang two coconut halves from reins tied to an empty hitching rail just south of the spawn. Reuse the coconut souvenir art and frame the shells beside Zib when the launch line plays. The rail is scenery.

The French line faces south. Mark the way round it with wagon ruts from the south track **(560, 2045) → (900, 1540) → (1100, 1460) → (1220, 1290) → (1135, 1090) → (1020, 915)**: past the east end of the outwork, between its south sentry and the crag lookout’s sightline, then in behind the sentries. From there the moat bank leads west to Rodney (`pavilionTrack()` adds **(600, 900) → (420, 960)** to the supply flap) and north to the bridge and tower. The west cart track north of the launch is in the taunter’s view.

Mark the inner bridge-to-tower cut with cart ruts from a second wait notch at **(1030, 930)** via **(1010, 1090) → (1190, 1010) → (1370, 1010)**. The ruts cross the centre of the second cow mark and the rabbit’s lunge half-disc. Give the notch **32 px** of usable radius. Its centre is about **161 px** from the second cow mark and **165 px** from the cave mouth, leaving the full notch outside both footprints. The rut line saves the trip around the east bank. Once the cow clears, players can cruise past the cave or brake and react to the rabbit’s raised ears. Verify both the fast crossing and a steer-out from a committed lunge on the rut line.

| Hazard | System and tell | Greybox |
| --- | --- | --- |
| **French cow barrage** | New timed impact patch using the existing circle detection and shared fuse. The catapult gives a creak and the cow moos as it leaves the wall. Zib sees a stationary, dashed amber landing mark for **1.15 s**, then the cow lands and the patch detects for **1.4 s**. The actual circle has a hard edge and goes red on exposure. Use the existing circular flight bump on the cow’s body while the patch is live. Sample the warning, impact and clear phases in the sim. Clear the bump and detector together as the cow gets up and walks off. The walk-off is scenery. | Alternate **(460, 1125)** and **(1010, 1090)** every **3.5 s**, radius **108 px**. The first drop cuts the shortcut to Rodney and the second cuts the bridge approach. Show both landing marks from their safe approaches before the cows leave the wall. Keep both wait pockets and bank detours clear of the impact and bump. |
| French sentry | Existing fixed `camera` cone with a taunter leaning out. The taunter is plainly visible above the exact hard-edged sector. The edge and fuse go red while he sees the saucer. A continuous watch has no arming phase. | Four fixed cones, zero sweep, all more than 900 px from the launch. **Taunter** on the wooden rabbit at Rodney’s tent **(210, 990)**, facing **1.35 rad**, range **550**, half **0.40**: the cart track and both straight runs at Rodney. **Outwork west** **(735, 990)**, facing **2.54 rad**, range **600**, half **0.48**: the runs at Rodney’s loft and the toll arch. **Outwork south** **(790, 985)**, **1.72 rad**, range **570**, half **0.33**: the portcullis loft and the smoke hole. **Crag lookout** at the foot of Tom’s stair **(1505, 675)**, **2.34 rad**, range **390**, half **0.28**: the stone stair. Every cone tip stays under the HUD band of the first screen (y ≤ 1560). |
| Coconut squires | Move the emitter along an existing `steward` route and use the `dog` radial pulse shape instead of the torch. The squire raises the halves as an amber rim previews the full clop reach. After the strike, the hard current ring shows the true danger radius and goes red on contact. Animate a horseless trot. Audio can be muted and the gap remains readable. | One squire on **(605, 920) ↔ (630, 590)** at **82 px/s**, **1.0 s** turn dwell. Begin at **2.6 s** per clop, **0.45 s** amber lead, **118 px** max radius. Use the same clock and route pose in the autopilot and the view. Keep the ring’s outer extent clear of Rodney’s supply-flap lock. |
| Killer Rabbit | Local proximity detector adapted from the porch arming pattern. Slow hover within **118 px** of the mouth at **≤110 px/s** arms the lunge for **0.75 s**. Amber arc and raised ears show the coming footprint. Leaving or speeding up during arming cancels it. On commit the white rabbit lunges across the same **118 px** half-disc for **0.95 s** and its exact edge goes red on exposure. Play Zib’s retreat bark on the first committed lunge of the run, even if Zib escapes. Then the rabbit retreats for **1.5 s** before it can rearm. | Use a south-facing half-disc centred on the cave. Normal cruise passes the mouth safely and the east bank gives a route around the entire footprint. Keep all entry and pickup catchments outside it. |

The map fuse lasts **0.80 s** (the game-wide staircase in the [difficulty curve review](../review/difficulty-curve-neon.md), P1). At the 430 px/s speed cap, even a centre pass through a cow’s live patch would give `216 / 430 ≈ 0.50 s` of exposure. The body bump interrupts that crossing. Cow and clop phases come from the hazard clock. Keep the rabbit’s arming timestamp in the flight state with the other proximity detectors. A sighting clears the interrupted lock and returns Zib to the last delivered ring, or the launch fork on the first leg. Keep the shift clock and completed deliveries.

**No straight-line win.** A straight run from the launch at any of the six doors is caught by the French line at every tested start time (0, 2.5, 5 and 8 s), more than 800 px out and above the first screen (`tests/flight-grail.test.ts`). The taunter catches both runs at Rodney and the grid beeline that climbs the cart track. At 0 s the first cow can land on the loft run just before his fuse fills. The outwork sentries catch the toll arch, portcullis loft and smoke hole runs, and the crag lookout catches the stone stair run at Tom’s door. The clean way round is the east end of the outwork: a corridor between the south sentry’s cone and the crag lookout’s sightline, then in behind the line. Humans brush the cone edges there and on the moat-bank return west to Rodney (casual median peak Suspicion **34%** over 20 seeds). Timing a cow or a clop on the way is skilled play.

## The three witnesses

Use the standard ragdoll. Start both routes of each sleeper on the same settled pose and keep the first viewport legible. The short route saves a room bend and asks for one tighter timing decision. Existing hard wake rules apply. At each exit, release the beam to settle the witness. The mint bar fills in **1.25 s** while their torso stays steady and recedes while it swings. Leaving the opening clears the bar.

**Why, and how it is taught.** Each exit is a Temporal Dispatch time window, and it only locks on a still passenger (anything that swings arrives in instalments). The shift memo gives this reason. In the room, an empty dark track sits under every exit from the start. While the beam still holds the witness near the opening, the prompt reads “Let go in the time window”. After release it reads “Steady… the time window is locking on” while the bar fills, or “Too wobbly. Let the swing die down” while it drains.

| Sleeper | Route | What the player does |
| --- | --- | --- |
| **Sir Rodney the Not-Quite-So-Brave.** He marched all afternoon at the back of a one-man parade and fell asleep in his boots on a low bench. | **Supply flap** · `rodney_flap` | Lift over an overturned shield rack, park in the space above the hay bales and lower to the wide flap. The rack blocks the direct drag. Take **coconut halves** off the staging shelf on the turn. |
| Rodney | **Banner loft** · `rodney_loft` | Swing around the tall banner chest, wait until the hanging shield passes, then lift past the loft lip. The chest overhang blocks the straight lift. Take the **stuffed swallow** off the herald’s rail. |
| **The Black Knight.** He insisted he could guard the bridge standing up for a week. He has been asleep in an upright shield stand since supper. | **Toll arch** · `black_knight_arch` | Lift him out of the stand past the toll counter. Settle above the sill before easing out under the rounded arch. The counter catches a direct pull. Take the **Black Knight’s arm** from the spare armour peg on the way out. |
| Black Knight | **Portcullis loft** · `black_knight_loft` | Steer around the winding wheel and hold in the overhead recess while the existing sliding gate opens. The wheel blocks a straight lift even when the gate is open. Start at a **7.2 s** cycle with **4.1 s** clearance. Take the **Black Knight’s shield** from the recess. |
| **Tom the Enchanter.** He can light an entire hillside. He fell asleep waiting for one damn candle. | **Stone stair** · `tom_stair` | Lift him clear of the stone bookstand, watch the lance of sleep-sparks from the upper landing, then cross to the stair door. A low plinth blocks a direct drag. Pick up the **Holy Hand Grenade** from the near landing. |
| Tom | **Smoke hole** · `tom_smoke` | Slip past the tall flue lip, let his feet catch up under the side ledge, then rise between sleep-sparks. The flue lip blocks the straight ascent. Take **enchanter’s horns** from a peg above the wait ledge. |

### The room gags that affect the drag

- **Rodney flees in his sleep.** Use a room-local reaction keyed to the existing wake meter. The first upward crossing of **55/100** after beam input gives him a half-second of amber footprints pointing toward the pavilion’s marked retreat side, away from the room’s obstacle aisle. He takes a short **0.40 s** step with grounded feet. Tune for approximately **55 px** of open-floor travel with the standard beam still attached. In the air, use a leg scramble with no body push. Cue the retreat mumble once through the room speech handler. After the step, let the beam settle him. A wake crossing can rearm after dropping below **35/100**. Full wake or delivery cancels the reaction. The sim owns the armed direction, countdown and step. Give autopilot the same reaction state. Play the line after the tell appears so the cue can be read in silence.
- **The Black Knight sheds armour.** Each registered bonk sheds a loose armour piece from the hit side where possible. Advance the three mumbles below on registered bonks. Keep the latest pending line if bonks land faster than speech can clear. Verify all three beats with isolated bonks. Use a small fixed visual pool for gauntlets, shoulder plates and follow-up rivets. The exposed layer is padded cloth. The pieces have no collision, wake or souvenir yield, and the archive still sees one intact mannequin rig. Rate-limit the mumble to the normal speech cadence. The peg’s souvenir is a separate spare sleeve.
- **Tom snores sparks.** Reuse the existing timed room laser and its trip result. Give the sparks a visible amber charge along the exact segment and a hard live core, with the red trip cue on contact. Start the stair at **7.4 s** with **4.6 s** clear and the smoke hole at **6.3 s** with **3.7 s** clear. Put the emitter on Tom’s unattended candle-lighting stand downrange, and sync a quiet snore and staff glint to it. The staff in his hands is decorative. Each route has a whole-body wait pocket from which the player can see the gap. Clearance includes trailing heels.

**No bump on start.** Recess Rodney’s bench into a clear bay away from the shield arc. Support the Knight’s heels and hips in the stand with the spare armour and gate sweep outside the rest envelope. Rest Tom on a stone settle, clear of the full spark segment at every phase. Test all six rooms at rest for **10 s** with zero bonks and zero wake, and check every direct drag at all four evaluator start phases. Move the pose or geometry if either proof fails.

## Evidence Locker

**Only town pickup** · **Shrubbery** (`shrubbery`), on a bare patch beside the west hedge at **(100, 805)**, north-west of Rodney’s tent with the Knights at **(185, 770)**. From Rodney’s supply flap it is a short hop west behind the lookout. Draw an original **106 × 116 px** tiered topiary in a terracotta pot with one clipped branch. The pot and foliage read as one object against dark turf. Use the normal 48 px / one-second mint lock and the world name tag. The entire catchment sits outside both the clop reach and the lookout’s sector. The Knights’ “Ni!” is a speech pill with no fuse effect. It stops for the rest of the shift when the shrubbery is taken. As it lifts, one knight holds up a **TOO HIGH** / **TROP HAUT** board. Use the existing sprite pose and retained label. The board has no collision or detector. Filing and retries use the [town pickup rules](GDD-8-map-collectibles.md).

| Field Finds | English | Français |
| --- | --- | --- |
| Name / exact memo hint | Shrubbery / `a shrubbery` | Jardinet / `un jardinet` |
| Description | The knights wanted a nice one. Not too expensive. The beam took it for free. | Les chevaliers en voulaient un joli. Pas trop cher. Le rayon l’a emporté sans payer. |
| Status | Repotted · Nicer than the Hendersons’ hedge. Don’t tell them. | Rempoté · Plus joli que la haie des Henderson. Ne leur dites rien. |
| Locked hint | The loudest voices on the west bank want a little greenery. | Sur la rive ouest, les plus bruyants réclament un peu de verdure. |

One optional souvenir per route, six slots in the [trophy room](GDD-9-trophy-room.md). Use each English item name as its lower-case ID, and register singular and plural in both languages.

| Item | Catalogue text | Objet et notice FR |
| --- | --- | --- |
| Coconut halves | Nobody can explain how these got to England. The swallow refuses to comment. | Demi-noix de coco · Personne ne sait comment elles sont arrivées en Angleterre. L’hirondelle refuse de se prononcer. |
| Stuffed swallow | Unladen. African or European? The taxidermist charged both rates. | Hirondelle empaillée · Sans charge. D’Afrique ou d’Europe ? Le taxidermiste a facturé les deux tarifs. |
| Black Knight’s arm | Spare. He says he has another one somewhere. He said that last time. | Bras du Chevalier noir · De rechange. Il dit qu’il en a un autre quelque part. Il a dit ça la dernière fois. |
| Black Knight’s shield | NONE SHALL PASS on the front. OPENING HOURS on the back. | Bouclier du Chevalier noir · NUL NE PASSERA devant. HORAIRES D’OUVERTURE derrière. |
| Holy Hand Grenade | Count to three. Five is right out. Zib counted to five. The hold has a skylight now. | Sainte Grenade · Comptez jusqu’à trois. Cinq, c’est exclu. Zib a compté jusqu’à cinq. La soute a maintenant une lucarne. |
| Enchanter’s horns | Ram’s horns on a skullcap. Slightly singed. Everything Tom owns is slightly singed. | Cornes de l’enchanteur · Des cornes de bélier sur une calotte. Un peu roussies. Chez Tom, tout est un peu roussi. |

### Specimen Archive

| ID · name (EN / FR) | Age · height · weight | Description | `at3` | `at10` |
| --- | --- | --- | --- | --- |
| `rodney` · Sir Rodney the Not-Quite-So-Brave / Sire Rodney le Pas-si-Brave | 32 · 173 cm · 71 kg | Asked the farrier to shoe his horse. The farrier fitted his squire with tiny horseshoes. | Asked the beam to carry him backwards so he could claim he was advancing. | Commissioned a victory song. The minstrels keep adding verses about the running away. |
| `black_knight` · The Black Knight / Le Chevalier noir | 41 · 188 cm · 91 kg | His armour is held on by pride. We found the spare fasteners unopened. | Declared the cargo bay a bridge. Nobody has crossed it since. | Asked for his armour back by weight. Swears we still owe him an elbow. |
| `tom_enchanter` · Tom the Enchanter / Tom l’Enchanteur | 56 · 169 cm · 74 kg | Insisted on lighting his own birthday candles. We held it outdoors. | Warned the intake nurse about the rabbit. Showed her the size of the teeth with his hands. | Points at the canteen and whispers ‘Look at the bones!’ It’s chicken night. |

| ID | Description FR | `at3` FR | `at10` FR |
| --- | --- | --- | --- |
| `rodney` | A demandé au maréchal-ferrant de ferrer son cheval. L’écuyer s’est retrouvé avec de tout petits fers aux pieds. | A demandé au rayon de le porter à reculons pour prétendre qu’il avançait. | A commandé un chant de victoire. Les ménestrels n’arrêtent pas d’ajouter des couplets sur sa fuite. |
| `black_knight` | Son armure tient par orgueil. Les attaches de rechange sont encore sous emballage. | A décrété que la soute était un pont. Plus personne ne la traverse. | A réclamé qu’on lui rende son armure au poids. Jure qu’il manque un coude. |
| `tom_enchanter` | A tenu à allumer lui-même ses bougies d’anniversaire. On a fait la fête dehors. | A mis l’infirmière en garde contre le lapin. Il lui a montré avec les mains la taille des dents. | Montre la cantine du doigt et chuchote « Regardez les os ! » Ce soir, c’est poulet. |

## Lines

| Cue | EN | FR |
| --- | --- | --- |
| Zib, launch | “No horses. Just coconuts. Vrell, is that what you meant by a company car?” | « Pas de chevaux. Des noix de coco. Vrell, c’est ça, la voiture de fonction ? » |
| French sentry, first sighting | “I fart in your general airspace, you flying saucepan!” | « Je pète dans votre espace aérien, casserole volante ! » |
| French sentry, next approach after the first sighting | “A census? We’ve already got one!” | « Un recensement ? On en a déjà un ! » |
| French sentry, next eligible approach, then Zib | “Your mother was a hamster!” / “Is that a species correction? I’ll need a form.” | « Votre mère était un hamster ! » / « Je dois corriger l’espèce ? Il va me falloir un formulaire. » |
| Zib, first approach to the Killer Rabbit / first committed lunge | “Aw, a bunny!” / “Run away! Run away!” | « Oh, un lapin ! » / « Fuyons ! Fuyons ! » |
| Vrell, first clear | “Claim denied. Krix called his toaster to the stand. The court gave it two minutes to pop.” | « Demande rejetée. Krix a appelé son grille-pain à la barre. Le tribunal lui a donné deux minutes pour sortir une tartine. » |
| Gazette, lead clipping at two or more sightings | **COW CLEARS CASTLE WALL. LANDING SCORES A FOUR.** | **UNE VACHE FRANCHIT LE REMPART. QUATRE SUR DIX À L’ATTERRISSAGE.** |
| Gazette, alternate clipping at two or more sightings | **COWS STILL DENY ALL KNOWLEDGE** | **LES VACHES NIENT TOUT EN BLOC** |
| Ghost cover story | “Bridge reopens. Black Knight’s post ‘temporarily unarmed’.” | « Le pont rouvre. Poste du Chevalier noir « provisoirement désarmé ». » |
| Pickup cover story, delivery with shrubbery | “Knights fall quiet at last. Neighbours suspect a shrubbery.” | « Les chevaliers se taisent enfin. Les voisins soupçonnent un jardinet. » |
| Rodney, retreat / ordinary mumble | “Bravely… back the way we came!” / “I’ll guard the rear… from home…” | « Courage… on repart par où on est venus ! » / « Je couvre nos arrières… de chez moi… » |
| Black Knight, first / second / third and later bonks | “‘Tis but a dent.” → “Merely a flesh wound.” → “Fine. We’ll call it a draw.” | « Ce n’est qu’une bosse. » → « Une blessure superficielle. » → « Bon. Disons match nul. » |
| Tom, mumbles | “Some call me Tim. The sign painter won’t take it back.” / “Just a pilot light… stand back… further…” | « Certains m’appellent Tim. Le peintre ne veut pas reprendre l’enseigne. » / « Juste une petite flamme… reculez… encore… » |
| Pickup, collected on a repeat | “You brought a shrubbery. Now they want a tree cut down with a herring. I’m hanging up.” | « Vous avez rapporté un jardinet. Maintenant ils veulent qu’on abatte un arbre avec un hareng. Je raccroche. » |
| Pickup, missed rotation | “No shrubbery. The knights are saying Ni to Accounting. Accounting is saying it back.” | « Pas de jardinet. Les chevaliers disent Ni à la compta. La compta répond Ni. » |

Treat both Gazette headlines as archive clippings, as in 1955, and select one through the existing headline rotation. Put the Ghost and pickup variants in the existing report cover-story row. Prefer the pickup variant if both qualify. Run the sentry taunts in order through the existing approach and sighting speech hooks. Advance when a line has played, keep the rotation at the flight checkpoint, and give Zib’s reply its own beat. Use `FLIGHT_BUBBLES` and `readSeconds()` for the taunts and rabbit lines. Keep the hazard edges readable during speech.

## Clock, stars and proof

Dawn gives **330 s** in flight and rooms. **Night owl** requires **198 s** left (**132 s** elapsed). **Delivered** needs all three witnesses in the hold before dawn. **Ghost** also needs zero full sightings and zero failed room attempts. The **Shrubbery** star needs the detour and all three deliveries in that run. The clock keeps running during the detour and pauses on the room retry choice. Filed finds follow ordinary pickup persistence. Whole orders unlock on delivery.

The [progression model](GDD-5-progression.md) measures the whole shift and independent room consistency. On preprod at `d630c5e`, the 20-seed 1955 run scored **100 / 90 / 90%** skilled and **100 / 50 / 55%** casual for Delivered / Ghost / Night owl. Its independent shift estimate was **91 s** for both. Start the Grail greybox around **105–120 s** for the casual independent estimate. The tighter flight exposure and recoverable room reactions should lower Ghost first. The clock still leaves recovery time.

| Model | Delivered | Ghost | Night owl | Shrubbery star on detour runs |
| --- | --- | --- | --- | --- |
| Skilled | 90–100% | 65–80% | 75–85% | 90–100% |
| Casual | 80–95% | 40–45% | 50–55% | 75–90% |

These are proposed ranges over 20 matched seeds, with no upgrades and the fourth star sampled separately. Six-seed gate floors are **5/6, 3/6, 4/6** skilled and **4/6, 2/6, 3/6** casual for the first three stars. Skilled Ghost must beat casual Ghost, and casual remains under the existing 90% ceiling. Each route should deliver at least **75% skilled / 40% casual**, and each witness needs a route at **65% casual** or better in the 20-seed run. Adjust approach pockets and timing at greybox. Keep the existing no-input, nontrivial room and beeline checks. Run perfect autopilot through each room and the full map, with a separate no-upgrade pickup route. Then run the real-pointer playthrough and inspect the worst missed locks at **375 × 690** in EN, FR and reduced motion. After the 2026-11-26 French-line rework (0.80 s fuse, 198 s Night owl margin), the 20-seed run earned **100 / 80 / 75 / 100%** skilled and **90 / 45 / 55 / 85%** casual. Tom’s stone stair uses an **11.5 s** spark cycle with **4.6 s** clearance.

## Art and build split

Reuse farm ground, dirt roads, sea tint, stone hatch, door frames, crates, gear, ragdoll joint sizes, HUD and lock rings. Primitive fallbacks use the same geometry as manifest art. Prove the six-room greybox before commissioning the full pack.

| Proposed keys | Size and reason |
| --- | --- |
| `flight/grail_pavilion_top`, `flight/grail_bridge_top`, `flight/grail_tower_top`, `flight/grail_battlement_top`, `flight/grail_cave_top` | **240×180**, **300×240**, **230×220**, **300×180**, **160×130**. Cloth pavilion, gatehouse and bridge deck, stone tower, square French outwork and rabbit mouth. Keep roofs and props separate from entry rings. |
| `flight/grail_cow_top`, `flight/grail_squire_top`, `flight/grail_rabbit_top`, `flight/grail_ni_knights_top`, `flight/pickup_shrubbery` | **106×64**, **60×60**, **46×35**, **82×66**, **106×116**. Original silhouettes. Animate the landing shadow, cow’s walk-off, clop pose and lunge in the retained view. Add the knights’ raised board as retained geometry with localized text. |
| `flight/grail_wooden_rabbit_top` | **112×82**. Rough planks, little cart wheels and long squared-off ears. Park at the French outwork with a soft shadow. |
| `room/bg_grail_pavilion`, `room/bg_grail_bridge`, `room/bg_grail_tower` | **540×720** each. Cloth, stone and dim candle-warm air. Use existing gate and obstacle silhouettes for the greybox. |
| `human/{rodney,black_knight,tom_enchanter}_{head,head_awake,torso,upper_arm,lower_arm,upper_leg,lower_leg}` | Standard humanoid sizes from the manifest. Rodney’s soft cap, a visor with a face opening, and Tom’s crooked horned hat. Compose the Knight’s detachable plates in the view. Typeset TIM on the tower sign. |
| `room/{coconut_halves,stuffed_swallow,black_knight_arm,black_knight_shield,holy_hand_grenade,enchanter_horns}` | Long sides **45–70 px**. Give the orb a broad pull ring and simple gold cross. Use the same silhouettes in the trophy view. |

| Pass | Owner and handoff |
| --- | --- |
| 1. Flight greybox | **Flight/level** owns the map, safe approaches, fixed sentry, and both marked shortcuts and wait pockets. Place the wooden rabbit through the existing prop view and use the existing speech rotation for the sentry. **Flight hazards** owns the three local behaviours and tells, with pure clock sampling for cows and clops and flight-local rabbit state. Share the data with autopilot. |
| 2. Rooms | **Abduction** owns the six routes, collision/wake proof, Rodney’s reaction and the Knight’s per-bonk armour pieces and escalating mumbles. Reuse room timers and report plumbing. |
| 3. Registry and save | **Coordinator** registers the stable level, room, human and pickup IDs, and the shared 1955 prerequisite by stable ID. Verify both orders through the 2199 gate and use the delivery flag for the gnome’s 1122 postcard. Check the migrated 1955 save and Dispatch returns from memo, abort and report. |
| 4. Art and copy | **Art** supplies the original SVG pack. **Story/UI** puts the memo, Vrell priorities, lines, two-language item names, archive and Field Find data into the existing surfaces and checks their layout. |
| 5. Tune and play | **Difficulty** adds the per-route and whole-shift bands, separate detour runs and four beeline delays. **Verification** runs the room-spawn, autopilot, trophy, memo-hint and real-pointer checks. |

[Art brief](ART_BRIEF.md) · [Pixi view guide](PIXI-MIGRATION.md) · [Companion dispatch, 1953](GDD-13-1953-tripods.md)
