# GDD-12 · Ni! (Grimsby Keep, 1122)

Krix wants exclusive rights to the Holy Grail so OBELISK™ can sell eternal life by the month. Zib has until dawn to collect the three knights who signed the witness roll in their sleep.

## The shift

**Work Order #0012** with the [Birch Lane orders](GDD-11-onramp.md) included. Stable ID `level10`. The first delivery in [Clocking Out at 10:04 (#0011)](GDD-10-1955.md) opens both 1122 and [1953](GDD-13-1953-tripods.md). Highlight 1122 as the suggested first stop and accept either order. [2199](GDD-14-2199-hitchhiker.md) opens once both have a delivery.

Three sleeping signatures are all Krix has. Filing the witnesses voids his claim and the Grail stays a rumour. The Work Order card shows Rodney and reads “Three witnesses. The cows are hostile.” FR *Sacré Graal !* · « Trois témoins. Les vaches sont hostiles. » The keep stands on the harbour bend. The film anchors are the taunting battlements, the coconut cavalry, the Black Knight’s bridge, the Killer Rabbit and the knights’ demand for a shrubbery. [Monty Python’s film synopsis](https://montypython.com/film_Monty%2BPython%2Band%2Bthe%2BHoly%2BGrail%2B%281975%29/15)

**Shift memo**

> **Work Order #0012 · Ni!**
>
> Agent Zib, Krix made bail. OBELISK™ is claiming the Holy Grail so it can charge by the month for eternal life. Bring in the three knights who signed his witness roll in their sleep. You have until dawn. The knights by the west hedge demand a shrubbery.
>
> The French are throwing cows. If the road moos, move.
>
> — Vrell. Expenses will cover one half of a coconut.

> **Ordre n°0012 · Sacré Graal !**
>
> Agent Zib, Krix est sorti sous caution. OBELISK™ revendique le Saint Graal pour vendre la vie éternelle par abonnement. Ramenez avant l’aube les trois chevaliers qui ont signé sa déposition en dormant. Près de la haie à l’ouest, des chevaliers réclament un jardinet.
>
> Les Français lancent des vaches. Si la route meugle, dégagez.
>
> — Vrell. Les frais couvrent une demi-noix de coco.

## Flight

Greybox **1800 × 2320** logical px, coordinates from the top left. South launch **(900, 2150)**, where the keep’s approach road splits at the moat. Warm lanterns with soft pools on the outside banks mark the two detours. The west cart track runs through **(265, 1930) → (265, 1210) → (330, 920)**. The east sheep track goes through **(1525, 1900) → (1515, 1230) → (1530, 660)**. The rear lane at **y 310** joins the two banks. Leave a crossing along **y 1010** between the bridge’s north approach and the lower end of the tower track. Keep the banks and moat edge visible as terrain landmarks. Give any collision boundary that survives greyboxing its own visible edge.

| Place | Centre | Entry rings |
| --- | --- | --- |
| Rodney’s pavilion, west market | (445, 955) | **Supply flap** (315, 990), recommended · **Banner loft** (495, 790) |
| Black Knight’s bridge gatehouse | (900, 735) | **Toll arch** (785, 855), recommended · **Portcullis loft** (1020, 650) |
| Tom’s tower, east crag | (1405, 560) | **Stone stair** (1550, 620), recommended · **Smoke hole** (1325, 390) |
| French outwork | (900, 1450) | Cow gantry looks north over the inner road. The watch slit faces the south approach. |
| Rabbit cave | (1190, 970) | Set its mouth into the crag at the tempting turn from bridge to tower. |

Draw the entry rings and pickup lock in mint with the existing UI. Draw the real edge of each active detector, with red on exposure. Amber previews the actual next danger. Torch spill and moonlight stay soft. Build the views once. Keep the same hazard footprints and phase changes in reduced motion, and drop the shake and animated flourishes.

| Hazard | System and tell | Greybox |
| --- | --- | --- |
| **French cow barrage** | New timed impact patch using the existing circle detection and shared fuse. The catapult gives a creak and the cow moos as it leaves the wall. Zib sees a stationary, dashed amber landing mark for **1.15 s**, then the cow lands and the patch detects for **1.25 s**. The actual circle has a hard edge and goes red on exposure. Sample the warning, impact and clear phases in the sim. The cow gets up and walks off as the patch clears. The walk-off is scenery. | Alternate **(650, 1230)** and **(1010, 1090)** every **3.8 s**, radius **108**. The first drop is on the obvious shortcut from the outwork to Rodney, the second cuts the bridge approach. Show where the next cow lands before it leaves the wall. Place a full saucer-sized wait pocket at about **(470, 1180)** and leave both outer banks clear. The shortcut becomes clear when the landed cow gets up. |
| French sentry | Existing fixed `camera` cone with a taunter leaning out. The taunter is plainly visible above the exact hard-edged sector. The edge and fuse go red while he sees the saucer. A continuous watch has no arming phase. | Source **(900, 1510)**, facing south, range **565**, half angle **0.80 rad**, zero sweep. This is the dependable beeline stop. |
| Coconut squires | Move the emitter along an existing `steward` route and use the `dog` radial pulse shape instead of the torch. The squire raises the halves as an amber rim previews the full clop reach. After the strike, the hard current ring shows the true danger radius and goes red on contact. Animate a horseless trot. Audio can be muted and the gap remains readable. | One squire on **(605, 920) ↔ (630, 590)** at **82 px/s**, **1.0 s** turn dwell. Begin at **2.6 s** per clop, **0.45 s** amber lead, **118 px** max radius. Use the same clock and route pose in the autopilot and the view. Keep the ring’s outer extent clear of Rodney’s supply-flap lock. |
| Killer Rabbit | Local proximity detector adapted from the porch arming pattern. Slow hover within **118 px** of the mouth at **≤110 px/s** arms the lunge for **0.75 s**. Amber arc and raised ears show the coming footprint. Leaving or speeding up during arming cancels it. On commit the white rabbit lunges across the same **118 px** half-disc for **0.95 s** and its exact edge goes red on exposure. Then it retreats for **1.5 s** before it can rearm. | Use a south-facing half-disc centred on the cave. “Low” means the existing hover speed. Normal cruise passes the mouth safely and the east bank gives a route around the entire footprint. Keep all entry and pickup catchments outside it. |

Start the map fuse at **0.83 s**. Cow and clop phases come from the hazard clock. Keep the rabbit’s arming timestamp in the flight state with the other proximity detectors. A sighting clears the interrupted lock and returns Zib to the last delivered ring, or the launch fork on the first leg. Keep the shift clock and completed deliveries.

**No straight-line win.** Every direct line from spawn to a first ring goes through the fixed French view before it can lock, including the closest recommended ring. The shortest chord through the sector is about **396 px** at these coordinates, or **0.92 s** at the 430 px/s speed cap. Both initial bank turns clear the sector. Place the clops and cow marks after establishing the full sim check. West bank and east track allow clean first legs and re-entry after a sighting. From a delivery ring, follow the rear lane or time the inner crossing from the wait pocket. Cruise past the rabbit’s mouth once clear of the cow mark. Prove the straight runs at **0, 2.5, 5 and 8 s** with the actual saucer deceleration and fuse, then check the intended first approaches and returns at those phases. Timing a cow between shots is skilled play. The first-lane beeline still has to face the sentry.

## The three witnesses

Use the standard ragdoll. Start both routes of each sleeper on the same settled pose and keep the first viewport legible. The short route saves a room bend and asks for one tighter timing decision. Existing hard wake rules apply.

| Sleeper | Route | What the player does |
| --- | --- | --- |
| **Sir Rodney the Not-Quite-So-Brave.** He marched all afternoon at the back of a one-man parade and fell asleep in his boots on a low bench. | **Supply flap** · `rodney_flap` | Lift over an overturned shield rack, park in the space above the hay bales and lower to the wide flap. The rack blocks the direct drag. Take **coconut halves** off the staging shelf on the turn. |
| Rodney | **Banner loft** · `rodney_loft` | Swing around the tall banner chest, wait until the hanging shield passes, then lift past the loft lip. The chest overhang blocks the straight lift. Take the **stuffed swallow** off the herald’s rail. |
| **The Black Knight.** He insisted he could guard the bridge standing up for a week. He has been asleep in an upright shield stand since supper. | **Toll arch** · `black_knight_arch` | Lift him out of the stand past the toll counter. Settle above the sill before easing out under the rounded arch. The counter catches a direct pull. Take the **Black Knight’s arm** from the spare armour peg on the way out. |
| Black Knight | **Portcullis loft** · `black_knight_loft` | Steer around the winding wheel and hold in the overhead recess while the existing sliding gate opens. The wheel blocks a straight lift even when the gate is open. Start at a **7.2 s** cycle with **4.1 s** clearance. Take the **Black Knight’s shield** from the recess. |
| **Tom the Enchanter.** He can light an entire hillside. He fell asleep waiting for one damn candle. | **Stone stair** · `tom_stair` | Lift him clear of the stone bookstand, watch the lance of sleep-sparks from the upper landing, then cross to the stair door. A low plinth blocks a direct drag. Pick up the pin-in **Holy Hand Grenade** from the near landing. |
| Tom | **Smoke hole** · `tom_smoke` | Slip past the tall flue lip, let his feet catch up under the side ledge, then rise between sleep-sparks. The flue lip blocks the straight ascent. Take **enchanter’s horns** from a peg above the wait ledge. |

### The room gags that affect the drag

- **Rodney flees in his sleep.** Use a room-local reaction keyed to the existing wake meter. The first upward crossing of **55/100** after beam input gives him a half-second of amber footprints pointing toward the pavilion’s marked retreat side, away from the room’s obstacle aisle. He takes a short **0.40 s** step with grounded feet. Tune for approximately **55 px** of open-floor travel with the standard beam still attached. In the air, use a leg scramble with no body push. Cue the retreat mumble once through the room speech handler. After the step, let the beam settle him. A wake crossing can rearm after dropping below **35/100**. Full wake or delivery cancels the reaction. The sim owns the armed direction, countdown and step. Give autopilot the same reaction state. Play the line after the tell appears so the cue can be read in silence.
- **The Black Knight sheds armour.** Each registered bonk sheds a loose armour piece from the hit side where possible. Advance the three mumbles below on registered bonks. Keep the latest pending line if bonks land faster than speech can clear. Verify all three beats with isolated bonks. Use a small fixed visual pool for gauntlets, shoulder plates and follow-up rivets. The exposed layer is padded cloth. The pieces have no collision, wake or souvenir yield, and the archive still sees one intact mannequin rig. Rate-limit the mumble to the normal speech cadence. The peg’s souvenir is a separate spare sleeve.
- **Tom snores sparks.** Reuse the existing timed room laser and its trip result. Give the sparks a visible amber charge along the exact segment and a hard live core, with the red trip cue on contact. Start the stair at **7.4 s** with **4.6 s** clear and the smoke hole at **6.3 s** with **3.7 s** clear. Put the emitter on Tom’s unattended candle-lighting stand downrange, and sync a quiet snore and staff glint to it. The staff in his hands is decorative. Each route has a whole-body wait pocket from which the player can see the gap. Clearance includes trailing heels.

**No bump on start.** Recess Rodney’s bench into a clear bay away from the shield arc. Support the Knight’s heels and hips in the stand with the spare armour and gate sweep outside the rest envelope. Rest Tom on a stone settle, clear of the full spark segment at every phase. Test all six rooms at rest for **10 s** with zero bonks and zero wake, and check every direct drag at all four evaluator start phases. Move the pose or geometry if either proof fails.

## Evidence Locker

**Only town pickup** · **Shrubbery** (`shrubbery`), on a bare patch beside the west hedge at **(115, 1370)**. Draw an original **106 × 116 px** tiered topiary in a terracotta pot with one clipped branch. The pot and foliage read as one object against dark turf. Use the normal 48 px / one-second mint lock and the world name tag. The entire catchment sits outside both the clop reach and the south-facing sentry. The Knights’ “Ni!” is a speech pill with no fuse effect. It stops for the rest of the shift when the shrubbery is taken. As it lifts, one knight holds up a **TOO HIGH** / **TROP HAUT** board. Use the existing sprite pose and retained label. The board has no collision or detector. Filing and retries use the [town pickup rules](GDD-8-map-collectibles.md).

| Field Finds | English | Français |
| --- | --- | --- |
| Name / exact memo hint | Shrubbery / `a shrubbery` | Jardinet / `un jardinet` |
| Description | The knights wanted something tasteful. After the beam took it, they had to make do with a tasteful hole. | Les chevaliers voulaient quelque chose de joli. Après le rayon, il ne leur est resté qu’un joli trou. |
| Status | In nine hundred years this will be the Hendersons’ hedge. It’s already being blamed for things. | Dans neuf cents ans, ce sera la haie des Henderson. On lui reproche déjà des trucs. |
| Locked hint | The loudest voices on the west bank want a little greenery. | Sur la rive ouest, les plus bruyants réclament un peu de verdure. |

One optional souvenir per route, six slots in the [trophy room](GDD-9-trophy-room.md). Use each English item name as its lower-case ID, and register singular and plural in both languages.

| Item | Catalogue text | Objet et notice FR |
| --- | --- | --- |
| Coconut halves | Horse sold separately. These two have never stopped for hay. | Demi-noix de coco · Cheval vendu séparément. Ces deux-là ne réclament jamais de foin. |
| Stuffed swallow | Unladen. African or European? The taxidermist charged both rates. | Hirondelle empaillée · Sans charge. D’Afrique ou d’Europe ? Le taxidermiste a facturé les deux tarifs. |
| Black Knight’s arm | An empty gauntlet and sleeve. It still insists on shaking hands. | Bras du Chevalier noir · Un gant et une manche vides. Ils tiennent à vous serrer la main. |
| Black Knight’s shield | NONE SHALL PASS on the front. OPENING HOURS 9–5 on the back. | Bouclier du Chevalier noir · NUL NE PASSERA devant. HORAIRES 9 H–17 H derrière. |
| Holy Hand Grenade | Pin in. Count to three. Zib counted to five. The hold has a skylight now. | Sainte Grenade · Goupille en place. Comptez jusqu’à trois. Zib a compté jusqu’à cinq. On a désormais un puits de lumière dans la soute. |
| Enchanter’s horns | Two decorative horns. One points at the nearest fire exit. The other is more optimistic. | Cornes de l’enchanteur · Deux cornes décoratives. L’une indique l’issue de secours. L’autre est plus optimiste. |

### Specimen Archive

| ID · name (EN / FR) | Age · height · weight | Description | `at3` | `at10` |
| --- | --- | --- | --- | --- |
| `rodney` · Sir Rodney the Not-Quite-So-Brave / Sire Rodney le Pas-si-Brave | 32 · 173 cm · 71 kg | Asked the farrier to shoe his horse. The farrier put two tiny horseshoes on his squire. | Asked the beam to carry him backwards so he could claim he was advancing. | Commissioned a victory song. The drummer had to play it from a safe distance. |
| `black_knight` · The Black Knight / Le Chevalier noir | 41 · 188 cm · 91 kg | His armour is held on by pride. We found the spare fasteners unopened. | Declared the cargo bay a bridge. Nobody has crossed it since. | Asked for his armour back by weight. Swears we still owe him an elbow. |
| `tom_enchanter` · Tom the Enchanter / Tom l’Enchanteur | 56 · 169 cm · 74 kg | The tower sign has the wrong name on it. Tom had already paid for the sign. | Brought his own lightning for the mugshot. The flash fired back. | His latest spell turns any rabbit into a perfectly ordinary rabbit. He is frightened of saying it wrong. |

| ID | Description FR | `at3` FR | `at10` FR |
| --- | --- | --- | --- |
| `rodney` | A demandé au maréchal-ferrant de ferrer son cheval. L’écuyer s’est retrouvé avec deux tout petits fers. | A demandé au rayon de le porter à reculons pour prétendre qu’il avançait. | A commandé un chant de victoire. Le tambour a dû jouer à bonne distance. |
| `black_knight` | Son armure tient par orgueil. Les attaches de rechange sont encore sous emballage. | A décrété que la soute était un pont. Plus personne ne la traverse. | A réclamé qu’on lui rende son armure au poids. Jure qu’il manque un coude. |
| `tom_enchanter` | L’enseigne de la tour porte le mauvais nom. Tom l’avait déjà payée. | A apporté son propre éclair pour la photo. Le flash a riposté. | Son dernier sort transforme n’importe quel lapin en lapin ordinaire. Il a peur de se tromper d’un mot. |

## Lines

| Cue | EN | FR |
| --- | --- | --- |
| Zib, launch | “Those knights are banging coconuts together. Is that how humans flirt?” | « Ces chevaliers tapent des noix de coco. C’est comme ça que les humains draguent ? » |
| French sentry, first sighting | “I fart in your general direction, you flying saucepan!” | « Je pète dans votre direction, casserole volante ! » |
| Killer Rabbit, first approach / sighting | “Aw, a bunny!” / “Why does it have a body count?” | « Oh, un lapin ! » / « Pourquoi il a un tableau de chasse ? » |
| Vrell, first clear | “Claim denied. Krix called his toaster to the stand. The court gave it two minutes to pop.” | « Demande rejetée. Krix a appelé son grille-pain à la barre. Le juge lui a laissé deux minutes pour faire sauter les tartines. » |
| Gazette, default clipping at two or more sightings | **COWS STILL DENY ALL KNOWLEDGE** | **LES VACHES NIENT TOUJOURS TOUT EN BLOC** |
| Ghost cover story | “Silent knight reported missing. Bridge open.” | « Le Chevalier noir s’est volatilisé. Le pont est libre. » |
| Pickup cover story, delivery with shrubbery | “Knights say Ni to garden centre price hike.” | « Les chevaliers disent Ni à la hausse des prix en jardinerie. » |
| Rodney, retreat / ordinary mumble | “Bravely… back the way we came!” / “I’ll guard the rear… from home…” | « Courage… on repart par où on est venus ! » / « Je couvre nos arrières… de chez moi… » |
| Black Knight, first / second / third and later bonks | “‘Tis but a dent.” → “Merely a flesh wound.” → “Fine. We’ll call it a draw.” | « Ce n’est qu’une bosse. » → « Une blessure superficielle. » → « Bon. Disons match nul. » |
| Tom, mumbles | “There are some who call me… Tim.” / “Next spell… indoors voice…” | « Certains m’appellent… Tim. » / « Le prochain sort… à voix basse… » |
| Pickup, collected on a repeat | “You brought a shrubbery. The knights want a slightly taller one. I’m hanging up.” | « Vous avez rapporté un jardinet. Les chevaliers en veulent un un peu plus haut. Je raccroche. » |
| Pickup, missed rotation | “The knights are on hold. They seem to think the music is a challenge.” | « J’ai mis les chevaliers en attente. La musique, ils prennent ça pour un défi. » |

Treat the Gazette headline as an archive clipping, as in 1955. Put the Ghost and pickup variants in the existing report cover-story row so the sighting threshold still applies to the clipping. A report gets one cover-story line. Prefer the pickup variant if both qualify. Use existing flight speech timing for the taunt and rabbit lines and keep the hazard edges readable while they play.

## Clock, stars and proof

Dawn gives **330 s** in flight and rooms. **Night owl** requires **200 s** left (**130 s** elapsed). **Delivered** needs all three witnesses in the hold before dawn. **Ghost** also needs zero full sightings and zero failed room attempts. The **Shrubbery** star needs the detour and all three deliveries in that run. The clock keeps running during the detour and pauses on the room retry choice. Filed finds follow ordinary pickup persistence. Whole orders unlock on delivery.

The [progression model](GDD-5-progression.md) measures the whole shift and independent room consistency. On preprod at `d630c5e`, the 20-seed 1955 run scored **100 / 90 / 90%** skilled and **100 / 50 / 55%** casual for Delivered / Ghost / Night owl. Its independent shift estimate was **91 s** for both. Start the Grail greybox around **105–120 s** for the casual independent estimate. The tighter flight exposure and recoverable room reactions should lower Ghost first. The clock still leaves recovery time.

| Model | Delivered | Ghost | Night owl | Shrubbery star on detour runs |
| --- | --- | --- | --- | --- |
| Skilled | 90–100% | 65–80% | 75–85% | 90–100% |
| Casual | 80–95% | 40–45% | 50–55% | 75–90% |

These are proposed ranges over 20 matched seeds, with no upgrades and the fourth star sampled separately. Six-seed gate floors are **5/6, 3/6, 4/6** skilled and **4/6, 2/6, 3/6** casual for the first three stars. Skilled Ghost must beat casual Ghost, and casual remains under the existing 90% ceiling. Each route should deliver at least **75% skilled / 40% casual**, and each witness needs a route at **65% casual** or better in the 20-seed run. Adjust approach pockets and timing at greybox. Keep the existing no-input, nontrivial room and beeline checks. Run perfect autopilot through each room and the full map, with a separate no-upgrade pickup route. Then run the real-pointer playthrough and inspect the worst missed locks at **375 × 690** in EN, FR and reduced motion. The ranges are design targets pending greybox evidence.

## Art and build split

Reuse farm ground, dirt roads, sea tint, stone hatch, door frames, crates, gear, ragdoll joint sizes, HUD and lock rings. Primitive fallbacks use the same geometry as manifest art. Prove the six-room greybox before commissioning the full pack.

| Proposed keys | Size and reason |
| --- | --- |
| `flight/grail_pavilion_top`, `flight/grail_bridge_top`, `flight/grail_tower_top`, `flight/grail_battlement_top`, `flight/grail_cave_top` | **240×180**, **300×240**, **230×220**, **300×180**, **160×130**. Cloth pavilion, gatehouse and bridge deck, stone tower, square French outwork and rabbit mouth. Keep roofs and props separate from entry rings. |
| `flight/grail_cow_top`, `flight/grail_squire_top`, `flight/grail_rabbit_top`, `flight/grail_ni_knights_top`, `flight/pickup_shrubbery` | **106×64**, **60×60**, **46×35**, **82×66**, **106×116**. Original silhouettes. Animate the landing shadow, cow’s walk-off, clop pose and lunge in the retained view. Add the knights’ raised board as retained geometry with localized text. |
| `room/bg_grail_pavilion`, `room/bg_grail_bridge`, `room/bg_grail_tower` | **540×720** each. Cloth, stone and dim candle-warm air. Use existing gate and obstacle silhouettes for the greybox. |
| `human/{rodney,black_knight,tom_enchanter}_{head,head_awake,torso,upper_arm,lower_arm,upper_leg,lower_leg}` | Standard humanoid sizes from the manifest. Rodney’s soft cap, a visor with a face opening, and Tom’s crooked horned hat. Compose the Knight’s detachable plates in the view. Typeset TIM on the tower sign. |
| `room/{coconut_halves,stuffed_swallow,black_knight_arm,black_knight_shield,holy_hand_grenade,enchanter_horns}` | Long sides **45–70 px**. Give the pin-in orb a broad pull ring and simple gold cross. Use the same silhouettes in the trophy view. |

| Pass | Owner and handoff |
| --- | --- |
| 1. Flight greybox | **Flight/level** owns the map, safe approaches, fixed sentry and candidate geometry for hazards. **Flight hazards** adds the three local behaviours and tells, with pure clock sampling for cows and clops and flight-local rabbit state. Share the data with autopilot. |
| 2. Rooms | **Abduction** owns the six routes, collision/wake proof, Rodney’s reaction and the Knight’s per-bonk armour pieces and escalating mumbles. Reuse room timers and report plumbing. |
| 3. Registry and save | **Coordinator** registers the stable level, room, human and pickup IDs, and the shared 1955 prerequisite by stable ID. Verify both orders through the 2199 gate and use the delivery flag for the gnome’s 1122 postcard. Check the migrated 1955 save and Dispatch returns from memo, abort and report. |
| 4. Art and copy | **Art** supplies the original SVG pack. **Story/UI** puts the memo, Vrell priorities, lines, two-language item names, archive and Field Find data into the existing surfaces and checks their layout. |
| 5. Tune and play | **Difficulty** adds the per-route and whole-shift bands, separate detour runs and four beeline delays. **Verification** runs the room-spawn, autopilot, trophy, memo-hint and real-pointer checks. |

[Art brief](ART_BRIEF.md) · [Pixi view guide](PIXI-MIGRATION.md) · [Companion dispatch, 1953](GDD-13-1953-tripods.md)
