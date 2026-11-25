# GDD-12 · Ni! (Grimsby Keep, 1122)

OBELISK™ sends Krix back to patent the Holy Grail before anyone finds it, so Zib has to steal three sleeping witnesses from under a hail of cows while the Knights Who Say Ni hold out for a shrubbery.

## The shift

**Work Order #0012** after [Clocking Out at 10:04](GDD-10-1955.md), displayed as #0011 after the [two Birch Lane orders](GDD-11-onramp.md). Keep the existing 1955 save ID `level9`. Proposed stable ID for 1122 is `level10`. The first 1955 delivery makes this date selectable in Temporal Dispatch. The first 1122 delivery opens 1953 when that order ships.

Krix’s lawyers tried to patent time travel in 1955. In 1122 they take the simpler route and send Krix to get first claim on the cup itself. Rodney, the Black Knight and Tom all signed Krix’s witness roll in their sleep. Vrell brings the witnesses in and voids the filing when all three are delivered. The Grail stays a rumour. The Work Orders card uses Rodney’s portrait and the line “Three witnesses. The cows are hostile.” The two recurring beats are the OBELISK™ patent racket and the Tripod Division’s sick leave, which gets one line at the end to set up the next date. The keep sits on the harbour bend from the [earlier eras plan](GDD-7-eras.md). Film anchors are the taunting battlements, the fake horses, the Black Knight’s bridge, the enchanter and the shrubbery demand. [Monty Python’s film synopsis](https://montypython.com/film_Monty%2BPython%2Band%2Bthe%2BHoly%2BGrail%2B%281975%29/15) · [Sony’s film page](https://dev.sonypictures.com/movies/montypythonandtheholygrail)

**Shift memo**

> **Work Order #0012 · Ni!**
>
> Agent Zib, OBELISK™ sent Krix to patent the Holy Grail before anyone finds it. Bring in his three witnesses before dawn. The knights by the west hedge won’t stop shouting “Ni!” until someone brings a shrubbery.
>
> The French are throwing cows over the battlements. If one casts a shadow over the lane, kindly move out from under it.
>
> — Vrell

> **Ordre de mission n° 0012 · Ni !**
>
> Agent Zib, OBELISK™ a envoyé Krix breveter le Saint Graal avant sa découverte. Ramenez ses trois témoins avant l’aube. À l’ouest, les chevaliers crient « Ni ! » et réclament un jardinet.
>
> Les Français catapultent des vaches du haut des remparts. Si l’ombre d’une vache tombe sur vous, décalez-vous.
>
> — Vrell

## Flight

Greybox **1800 × 2320** logical px, coordinates from the top left. South launch **(900, 2150)**, where the keep’s approach road splits at the moat. Amber lanterns on the outside banks mark the two detours. The west cart track runs through **(265, 1930) → (265, 1210) → (330, 920)**. The east sheep track goes through **(1525, 1900) → (1515, 1230) → (1530, 660)**. The rear lane at **y 310** joins the two banks. Leave a crossing along **y 1010** between the bridge’s north approach and the lower end of the tower track. Keep the banks and moat edge visible as terrain landmarks. Give any collision boundary that survives greyboxing its own visible edge.

| Place | Centre | Entry rings |
| --- | --- | --- |
| Rodney’s pavilion, west market | (445, 955) | **Supply flap** (315, 990), recommended · **Banner loft** (495, 790) |
| Black Knight’s bridge gatehouse | (900, 735) | **Toll arch** (785, 855), recommended · **Portcullis loft** (1020, 650) |
| Tom’s tower, east crag | (1405, 560) | **Stone stair** (1550, 620), recommended · **Smoke hole** (1325, 390) |
| French outwork | (900, 1450) | Cow gantry looks north over the inner road. The watch slit faces the south approach. |
| Rabbit cave | (1190, 970) | Set its mouth into the crag at the tempting turn from bridge to tower. |

Draw mint entry rings, saucer fuse and pickup lock with the existing UI. Draw the real edge of each active detector, with red on exposure. Amber previews the actual next danger. Torch spill and moonlight stay soft. Build the views once. Keep the same hazard footprints and phase changes in reduced motion, and drop the shake and animated flourishes.

| Hazard | System and tell | Greybox |
| --- | --- | --- |
| **French cow barrage** | New timed impact patch using the existing circle detection and shared fuse. The catapult gives a creak and a brief “Fetchez la vache!” Zib sees a stationary, dashed amber landing mark for **1.15 s**, then the cow lands and the patch detects for **1.25 s**. The actual circle has a hard edge and goes red on exposure. The flying cow and the bounce outside the circle are spectacle. | Alternate **(650, 1230)** and **(1010, 1090)** every **3.8 s**, radius **108**. The first drop is on the obvious shortcut from the outwork to Rodney, the second cuts the bridge approach. Show where the next cow lands before it leaves the wall. Place a full saucer-sized wait pocket at about **(470, 1180)** and leave both outer banks clear. A cow gets up and walks off. |
| French sentry | Existing fixed `camera` cone with a taunter leaning out. The taunter is plainly visible above the exact hard-edged sector. The edge and fuse go red while he sees the saucer. A continuous watch has no arming phase. | Source **(900, 1510)**, facing south, range **565**, half angle **0.80 rad**, zero sweep. This is the dependable beeline stop. |
| Coconut squires | Move the emitter along an existing `steward` route and use the `dog` radial pulse shape instead of the torch. The squire raises the halves as an amber rim previews the full clop reach. After the strike, the hard current ring shows the true danger radius and goes red on contact. Animate a horseless trot. Audio can be muted and the gap remains readable. | One squire on **(605, 920) ↔ (630, 590)** at **82 px/s**, **1.0 s** turn dwell. Begin at **2.6 s** per clop, **0.45 s** amber lead, **118 px** max radius. Use the same clock and route pose in the autopilot and the view. Keep the ring’s outer extent clear of Rodney’s supply-flap lock. |
| Killer Rabbit | Local proximity detector adapted from the porch arming pattern. Slow hover within **118 px** of the mouth at **≤110 px/s** arms the lunge for **0.75 s**. Amber arc and raised ears show the coming footprint. Leaving or speeding up during arming cancels it. On commit the white rabbit lunges across the same **118 px** half-disc for **0.95 s** and its exact edge goes red on exposure. Then it retreats for **1.5 s** before it can rearm. | Use a south-facing half-disc centred on the cave. “Low” means the existing hover speed. Normal cruise passes the mouth safely and the east bank gives a route around the entire footprint. Keep all entry and pickup catchments outside it. |

Start the map fuse at **0.83 s**. Cow and clop phases come from the hazard clock. Keep the rabbit’s arming timestamp in the flight state with the other proximity detectors. A sighting clears the interrupted lock and returns Zib to the last delivered ring, or the launch fork on the first leg. Keep the shift clock and completed deliveries.

**No straight-line win.** Every direct line from spawn to a first ring goes through the fixed French view before it can lock, including the closest recommended ring. The shortest chord through the sector is about **396 px** at these coordinates, or **0.92 s** at the 430 px/s speed cap. Both initial bank turns clear the sector. Place the clops and cow marks after establishing the full sim check. West bank and east track allow clean first legs and re-entry after a sighting. From a delivery ring, follow the rear lane or time the inner crossing from the wait pocket. Cruise past the rabbit’s mouth once clear of the cow mark. Prove the straight runs at **0, 2.5, 5 and 8 s** with the actual saucer deceleration and fuse, then check the intended first approaches and returns at those phases. Timing a cow between shots is skilled play. The first-lane beeline still has to face the sentry.

## The three witnesses

Use the standard ragdoll. Start both routes of each sleeper on the same settled pose and keep the first viewport legible. The short route saves a room bend and asks for one tighter timing decision. Existing hard wake rules apply.

| Sleeper | Route | What the player does |
| --- | --- | --- |
| **Sir Rodney the Not-Quite-So-Brave.** He ran away from his own victory song, circled the pavilion twice and fell asleep in his boots on a low bench. | **Supply flap** · `rodney_flap` | Lift over an overturned shield rack, park in the space above the hay bales and lower to the wide flap. The rack blocks the direct drag. Take **coconut halves** off the staging shelf on the turn. |
| Rodney | **Banner loft** · `rodney_loft` | Swing around the tall banner chest, wait until the hanging shield passes, then lift past the loft lip. The chest overhang blocks the straight lift. Take the **stuffed swallow** off the herald’s rail. |
| **The Black Knight.** He insisted he could guard the bridge standing up for a week. He has been asleep in an upright shield stand since supper. | **Toll arch** · `black_knight_arch` | Lift him out of the stand past the toll counter. Settle above the sill before easing out under the rounded arch. The counter catches a direct pull. Take the **Black Knight’s arm** from the spare armour peg on the way out. |
| Black Knight | **Portcullis loft** · `black_knight_loft` | Steer around the winding wheel and hold in the overhead recess while the existing sliding gate opens. The wheel blocks a straight lift even when the gate is open. Start at a **7.2 s** cycle with **4.1 s** clearance. Take the **Black Knight’s shield** from the recess. |
| **Tom the Enchanter.** He fell asleep trying to light his own candle. He still sparks whenever he snores. | **Stone stair** · `tom_stair` | Lift him clear of the stone bookstand, watch the lance of sleep-sparks from the upper landing, then cross to the stair door. A low plinth blocks a direct drag. Pick up the pin-in **Holy Hand Grenade** from the near landing. |
| Tom | **Smoke hole** · `tom_smoke` | Slip past the tall flue lip, let his feet catch up under the side ledge, then rise between sleep-sparks. The flue lip blocks the straight ascent. Take **enchanter’s horns** from a peg above the wait ledge. |

### The room gags that affect the drag

- **Rodney flees in his sleep.** Use a room-local reaction keyed to the existing wake meter. The first upward crossing of **55/100** after beam input gives him a half-second of amber footprints pointing toward the pavilion’s marked retreat side, away from the room’s obstacle aisle. He takes a short **0.40 s** step with grounded feet. Tune for approximately **55 px** of open-floor travel with the standard beam still attached. In the air, use a leg scramble with no body push. Cue “Run away!” once through the room speech handler. After the step, let the beam settle him. A wake crossing can rearm after dropping below **35/100**. Full wake or delivery cancels the reaction. The sim owns the armed direction, countdown and step. Give autopilot the same reaction state. Play the line after the tell appears so the cue can be read in silence.
- **The Black Knight sheds armour.** Each registered bonk releases a loose piece from the hit side when possible. Use a small fixed visual pool for gauntlets, shoulder plates and follow-up rivets. The exposed layer is padded cloth. The pieces have no collision, wake or souvenir yield, and the archive still sees one intact mannequin rig. Rate-limit the mumble to the normal speech cadence. The peg’s souvenir is a separate spare sleeve.
- **Tom snores sparks.** Reuse the existing timed room laser and its trip result. Give the sparks a visible amber charge along the exact segment and a hard live core, with the red trip cue on contact. Start the stair at **7.4 s** with **4.6 s** clear and the smoke hole at **6.3 s** with **3.7 s** clear. Put the emitter on Tom’s unattended candle-lighting stand downrange, and sync a quiet snore and staff glint to it. The staff in his hands is decorative. Each route has a whole-body wait pocket from which the player can see the gap. Clearance includes trailing heels.

**No bump on start.** Recess Rodney’s bench into a clear bay away from the shield arc. Support the Knight’s heels and hips in the stand with the spare armour and gate sweep outside the rest envelope. Rest Tom on a stone settle, clear of the full spark segment at every phase. Test all six rooms at rest for **10 s** with zero bonks and zero wake, and check every direct drag at all four evaluator start phases. Move the pose or geometry if either proof fails.

## Evidence Locker

**Only town pickup** · **Shrubbery** (`shrubbery`), on a bare patch beside the west hedge at **(115, 1370)**. Draw an original **106 × 116 px** tiered topiary in a terracotta pot with one clipped branch. The pot and foliage read as one object against dark turf. Use the normal 48 px / one-second mint lock and the world name tag. The entire catchment sits outside both the clop reach and the south-facing sentry. The Knights’ “Ni!” is a speech pill with no fuse effect. It stops for the remainder of the shift when the shrubbery is taken. Filing and retries use the [town pickup rules](GDD-8-map-collectibles.md).

| Field Finds | English | Français |
| --- | --- | --- |
| Name / exact memo hint | Shrubbery / `a shrubbery` | Jardinet / `un jardinet` |
| Description | The knights wanted something tasteful. After the beam took it, they had to make do with a tasteful hole. | Les chevaliers voulaient quelque chose de joli. Après le rayon, il ne leur est resté qu’un joli trou. |
| Status | In quarantine. It may contain knights. | En quarantaine. Peut contenir des chevaliers. |
| Locked hint | The loudest voices on the west bank want a little greenery. | Sur la rive ouest, les plus bruyants réclament un peu de verdure. |

One optional souvenir per route, six slots in the [trophy room](GDD-9-trophy-room.md). Use each English item name as its lower-case ID, and register singular and plural in both languages.

| Item | Catalogue text | Objet et notice FR |
| --- | --- | --- |
| Coconut halves | Horse sold separately. These two have never stopped for hay. | Demi-noix de coco · Cheval vendu séparément. Ces deux-là ne réclament jamais de foin. |
| Stuffed swallow | Unladen. African or European? The taxidermist charged both rates. | Hirondelle empaillée · Sans charge. D’Afrique ou d’Europe ? Le taxidermiste a facturé les deux tarifs. |
| Black Knight’s arm | An empty gauntlet and sleeve. It still insists on shaking hands. | Bras du Chevalier noir · Un gant et une manche vides. Ils tiennent à vous serrer la main. |
| Black Knight’s shield | The front says HALT. The back is the side Rodney knows best. | Bouclier du Chevalier noir · HALTE est écrit devant. Rodney connaît surtout l’autre côté. |
| Holy Hand Grenade | Pin in. Count to three. The monk who wrote the instructions underlined it three times. | Sainte Grenade · Goupille en place. Comptez jusqu’à trois. Le moine qui a rédigé la notice l’a souligné trois fois. |
| Enchanter’s horns | Two decorative horns. One points at the nearest fire exit. The other is more optimistic. | Cornes de l’enchanteur · Deux cornes décoratives. L’une indique l’issue de secours. L’autre est plus optimiste. |

### Specimen Archive

| ID · name (EN / FR) | Age · height · weight | Description | `at3` | `at10` |
| --- | --- | --- | --- | --- |
| `rodney` · Sir Rodney the Not-Quite-So-Brave / Sire Rodney le Pas-si-Brave | 32 · 173 cm · 71 kg | His horse has two halves and more nerve than he does. | Asked the beam to carry him backwards so he could claim he was advancing. | Yells “Beam me out, Scotty!” the moment anyone says charge. |
| `black_knight` · The Black Knight / Le Chevalier noir | 41 · 188 cm · 91 kg | His armour is held on by pride. We found the spare fasteners unopened. | Declared the cargo bay a bridge. Nobody has crossed it since. | Asked for a lightsaber. We gave him a glow stick. He held the bridge for six hours. |
| `tom_enchanter` · Tom the Enchanter / Tom l’Enchanteur | 56 · 169 cm · 74 kg | Can set a mountainside alight with a twitch. Still borrows a match to light his pipe. | Brought his own lightning for the mugshot. The flash fired back. | His latest spell turns any rabbit into a perfectly ordinary rabbit. He is frightened of saying it wrong. |

| ID | Description FR | `at3` FR | `at10` FR |
| --- | --- | --- | --- |
| `rodney` | Son cheval tient en deux moitiés et a plus de cran que lui. | A demandé au rayon de le porter à reculons pour prétendre qu’il avançait. | Crie « Téléportation, Scotty ! » dès que quelqu’un ordonne de charger. |
| `black_knight` | Son armure tient par orgueil. Les attaches de rechange sont encore sous emballage. | A décrété que la soute était un pont. Plus personne ne la traverse. | A demandé un sabre laser. On lui a donné un bâton lumineux. Il a tenu le pont six heures. |
| `tom_enchanter` | Peut embraser une montagne d’un tic. Emprunte toujours une allumette pour sa pipe. | A apporté son propre éclair pour la photo. Le flash a riposté. | Son dernier sort transforme n’importe quel lapin en lapin ordinaire. Il a peur de se tromper d’un mot. |

## Lines

| Cue | Copy |
| --- | --- |
| Zib, launch | “Is the horse supposed to fit in his pockets?” |
| Vrell, first clear | “The witnesses are in. No one owns the cup. Next stop, 1953. A whole division seems to have called in sick.” |
| Gazette, ordinary | **COW FALLS FROM SKY. FRENCH DENY ALL KNOWLEDGE.** |
| Gazette, Ghost | **SILENT KNIGHT REPORTED MISSING. BRIDGE OPEN.** |
| Gazette, shrubbery filed | **KNIGHTS SAY NI TO GARDEN CENTRE PRICE HIKE** |
| Rodney, mumbles | “Run away! Run away!” / “Retreat in my sleep…” |
| Black Knight, mumbles | “‘Tis but a scratch.” / “I can still block the bridge.” |
| Tom, mumbles | “Light, you little bastard…” / “Mind the rabbit.” |
| Pickup, collected on a repeat | “You brought a shrubbery. The knights are asking for a slightly taller one. I’m hanging up.” |
| Pickup, missed rotation | “The knights are still saying it. I’ve put them on hold. They seem to think the music is a challenge.” |

**French references and wordplay.** Keep *Ni !* and **un jardinet**. Replace “SILENT KNIGHT” with **LE CHEVALIER NOIR A FILÉ. LE PONT EST LIBRE.** The English “night/knight” sound is the joke there. For the armour quip, use the short French home-video wording if the build team has the licensed track to check. **« C’est une égratignure. »** is the fallback for this script.

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
| `flight/grail_cow_top`, `flight/grail_squire_top`, `flight/grail_rabbit_top`, `flight/grail_ni_knights_top`, `flight/pickup_shrubbery` | **106×64**, **60×60**, **46×35**, **82×66**, **106×116**. Original silhouettes. Animate the landing shadow, clop pose and lunge in the retained view. |
| `room/bg_grail_pavilion`, `room/bg_grail_bridge`, `room/bg_grail_tower` | **540×720** each. Cloth, stone and dim candle-warm air. Use existing gate and obstacle silhouettes for the greybox. |
| `human/{rodney,black_knight,tom_enchanter}_{head,head_awake,torso,upper_arm,lower_arm,upper_leg,lower_leg}` | Standard humanoid sizes from the manifest. Rodney’s soft cap, a visor with a face opening, and Tom’s crooked horned hat. Compose the Knight’s detachable plates in the view. |
| `room/{coconut_halves,stuffed_swallow,black_knight_arm,black_knight_shield,holy_hand_grenade,enchanter_horns}` | Long sides **45–70 px**. Give the pin-in orb a broad pull ring and simple gold cross. Use the same silhouettes in the trophy view. |

| Pass | Owner and handoff |
| --- | --- |
| 1. Flight greybox | **Flight/level** owns the map, safe approaches, fixed sentry and candidate geometry for hazards. **Flight hazards** adds the three local behaviours and tells, with pure clock sampling for cows and clops and flight-local rabbit state. Share the data with autopilot. |
| 2. Rooms | **Abduction** owns the six routes, collision/wake proof, Rodney’s reaction and the Knight’s visual event. Reuse room timers and report plumbing. |
| 3. Registry and save | **Coordinator** registers the stable level, room, human and pickup IDs, and the predecessor gate by stable level ID. Give the 1953 dial position its matching first-clear gate. Check the migrated 1955 save and Dispatch returns from memo, abort and report. |
| 4. Art and copy | **Art** supplies the original SVG pack. **Story/UI** puts the memo, Vrell priorities, lines, two-language item names, archive and Field Find data into the existing surfaces and checks their layout. |
| 5. Tune and play | **Difficulty** adds the per-route and whole-shift bands, separate detour runs and four beeline delays. **Verification** runs the room-spawn, autopilot, trophy, memo-hint and real-pointer checks. |

[Art brief](ART_BRIEF.md) · [Pixi view guide](PIXI-MIGRATION.md) · [Next dispatch, 1953](GDD-13-1953-tripods.md)
