# GDD-13 · The War of the Worlds (Grimsby Drive-In, 1953)

A drive-in crowd mistakes the Bureau’s botched Martian invasion for the second feature, and Zib has to recover three sleeping witnesses before rookie Vrell’s entire Tripod Division calls in sick.

## The shift

**Work Order #0013**, after [Ni!](GDD-12-1122-grail.md) at #0012 and [Clocking Out at 10:04](GDD-10-1955.md) at #0011 with the [Birch Lane orders](GDD-11-onramp.md) included. Proposed stable ID `level11`. The 1122 report opens this date in Temporal Dispatch when it ships. Use Clive’s portrait on the Work Orders card and the line “Two invasions for the price of one.” The 2199 signal remains visible. On first 1953 clear, the console receives an unanswered return ping from 2199 and holds the date in its pending state. Leave the sender and the reason for the ping open for the finale.

The drive-in by Grimsby’s west farm road is showing an alien-invasion picture. The audience cheers when a real copper war machine settles behind the screen, right up until its crew starts sneezing. Clive, Sylvie and Pastor Matt were the last people on the scene. Vrell dispatches Zib from the present while his rookie self is off-camera shepherding the Tripod Division home. Young Vrell borrowed a brass thermometer from the farm, took every pilot’s temperature and filed the first Form 7-B. That is why the brass thermometer and clipboard in [Probe Compliance](GDD-6-story.md#6-running-jokes) have been policy since 1953. These are the two running jokes here: the division’s sick leave and Form 7-B.

Keep the 1953 film’s copper, swan-necked hovering war machines, meteor-like arrival, three-colour alien eye, farmhouse and church refuge as visual anchors. The drive-in is Grimsby’s setting for those beats. The tripod leg is a removable landing strut from the Bureau’s equipment. Show the disabled machine resting on its remaining service supports in the field and other machines hovering in the film’s silhouette. [Paramount’s film page](https://www.paramountmovies.com/movies/the-war-of-the-worlds-1953) · [AFI’s film catalogue](https://catalog.afi.com/Film/51100-THE-WAR-OF-THE-WORLDS)

**Shift memo**

> **Work Order #0013 · The War of the Worlds**
>
> Agent Zib, the drive-in is showing an invasion. The one behind the screen is ours. Bring in three witnesses before dawn. A tripod leg is lying in the west farmyard. Give the projector beam a wide berth.
>
> I was a rookie pilot that night. Half the division had fevers. I found a brass thermometer and made the mistake of writing it down.
>
> — Vrell

> **Ordre de mission n° 0013 · La Guerre des mondes**
>
> Agent Zib, le ciné-parc projette une invasion. Derrière l’écran, elle est à nous. Ramenez trois témoins avant l’aube. Une patte de tripode traîne dans la cour de la ferme, à l’ouest. Évitez le faisceau du projecteur.
>
> J’étais jeune pilote, ce soir-là. La moitié de la division avait de la fièvre. J’ai trouvé un thermomètre en laiton et j’ai eu le tort de prendre des notes.
>
> — Vrell

## Flight

Greybox **1800 × 2280** logical px, north up. Spawn **(900, 2185)** behind the drive-in screen. The projector stands on the north rim of the parking bowl and throws its beam south across the occupied rows. The road fork behind the screen offers two visible ways to get around. West Farm Road follows **(250, 2060) → (255, 1430) → (310, 930)**. East Service Road follows **(1580, 2070) → (1620, 1250) → (1620, 820)**. Church Lane at **y 295** joins the two approaches across the back. Leave a shadowed cross lane near **y 1180** west of the spectator queue. Reuse the [1955 map palette](GDD-10-1955.md), with dusty turnouts, the wide screen and a field full of abandoned headlights.

| Place | Centre | Entry rings |
| --- | --- | --- |
| Farmhouse lab, on the crater’s rim | (430, 720) | **Kitchen window** (285, 750), recommended · **Attic hatch** (485, 515) |
| Drive-in ticket office, now the evacuation desk | (1435, 1050) | **Staff door** (1595, 1070), recommended · **Booth vent** (1440, 850) |
| Church at the north end of the lane | (930, 510) | **Vestry door** (755, 535), recommended · **Bell hatch** (1060, 385) |
| Drive-in screen and projection booth | (900, 2030) and (900, 1440) | Low opaque screen seen from the top and front edge. From the south fork the two kerbs show how to skirt the beam. |
| Crater and disabled swan-neck war machine | (475, 1280) | Scorched earth, copper hull and exposed service socket. Soft green light stays inside the broken hood. |
| West farmyard, behind the barn | (135, 1230) | Dark open patch for the tripod leg. A low fence visually separates it from the crater lip. |

| Hazard | System and tell | Greybox |
| --- | --- | --- |
| **Drive-in projector** | Existing fixed `camera` cone. Its exact hard edge is visible across the parking rows. The edge and fuse go red on exposure as silhouetted patrons point through the light. Keep the beam on during the shift. Frame changes play on the screen with no effect on detection. The joke is that staying in the film’s light gets you spotted by the audience. | Projector at **(900, 1460)**, aimed south, range **640 px**, half angle **0.76 rad**, zero sweep. Align the beam with the screen, show the true detector cap and leave outer kerbs in darkness. |
| Panicking spectators | Two existing `steward` routes with groups of two or three as their sprites. Their moving cones are the line of sight of whoever is leading. A raised hand or turning torch previews the next heading in amber near the turn. The hard cone tracks the current real heading and goes red on exposure. | First group **(1195, 1370) ↔ (1355, 1290)** at **94 px/s**, range **178**, half angle **0.34 rad**. Second group **(1140, 795) ↔ (1120, 600)** at **82 px/s**, range **165**, same half angle. Start at **1.0 s** turn dwell with the paths offset. Keep the silhouettes together and use only one cone per group. |
| Press flashbulb | Existing `photographer` long exposure. The amber rectangle marks the frame as soon as the bulb is armed, and the closing iris gives **0.9 s** to leave it. The same rectangle detects for **1.0 s**, with a red edge on exposure. Reuse the **1.4 s** winding time. The bulb lights the reporter and nearest parked car. Reduce the flash to a local change in brightness under reduced motion. | One reporter at **(690, 940)**, trigger range **260**, half-width **82**, half-height **65**. Put a shadowed wait pocket around **(480, 1010)** and mark the field boundary so the west route reads at a glance. |

Start the fuse at **0.80 s**. Mint remains reserved for the saucer, goals and pickup. Put abduction prompts and panic lines in the shared speech-bubble layer and time them with `readSeconds()`. Use colour plus edge changes and arming animation so the route is readable without sound. Any moving crowd markers are visual previews of the shared route pose. The projector runs continuously. Reuse the flight rules with era art and tells.

**No straight-line win.** A direct drag from launch to any first entry takes the saucer through the parking-bowl cone before it can lock. Keep the fallout from a sighting on the normal last-delivered-ring or launch return, with the clock still live. The West Farm Road and East Service Road approaches both go outside the projector. The shortest direct chord is about **413 px**, or **0.96 s** at the 430 px/s speed cap. For the later legs, approach Church Lane from either edge and cross north of the two crowd paths. Confirm every direct first approach at **0, 2.5, 5 and 8 s**, including the staff door nearest the right-hand edge of the cone. The photographer adds pressure after the first fork. The beeline proof should stand with the camera alone.

## The three witnesses

Give each sleeper two exits and one souvenir per route. Use a standard humanoid rig and hard wake rules. A slower route offers a longer wait pocket or a wide turn. The short route gives up that space.

| Sleeper | Route | What the player does |
| --- | --- | --- |
| **Clive Forester**, a scientist who stayed up trying to make the Martian eye blink. It blinked once. He closed both of his. | **Kitchen window** · `forester_kitchen` | Lift from a kitchen daybed, clear the low lab trolley and settle on the far side before moving out through the window. A raised counter corner blocks the diagonal. A creaky patch under the trolley penalizes a fast drop. The **meteor fragment** sits on a sample tray at the bend. |
| Clive | **Attic hatch** · `forester_attic` | Slip around an attic shelf and wait in the broad bay below the hatch until the three-colour Martian probe looks away. Use the existing room camera, with its normal hard-edged cone and exposure fuse. The shelf lip blocks a direct ascent. The **three-colour Martian lens** is a spare on the upper bench. |
| **Sylvie Van Bell**, running the evacuation desk. She took one minute to rest her eyes after directing the same cars out of the lot twice. | **Staff door** · `van_bell_staff` | Lift her from a ticket-office bench, arc over the fallen queue rail and past the film-can trolley on castors. The rail fouls the direct drag. Lift early to keep trailing legs out of the castor lane. The **drive-in programme** is on the ticket window shelf. |
| Sylvie | **Booth vent** · `van_bell_vent` | Go round the projector plinth, hold with her feet clear of the sprocket case and cross the booth’s inspection lamp when its shutter drops. The plinth blocks a straight lift. Grab the **invasion reel** from the shelf just beyond the crossing. |
| **Pastor Matt Collier**, who spent the evacuation waving people into his church, then fell asleep in the first pew still holding his tea. | **Vestry door** · `collier_vestry` | Lift over the high-backed end of the pew and glide above the loose boards. Use the plain room creak zone at floor level. The end of the pew blocks a direct pull. Collect the **white truce flag** by the vestry threshold. |
| Pastor Matt | **Bell hatch** · `collier_bell` | Carry him sideways round the belfry stair header, pause in an alcove, then pass the swinging clapper to reach the hatch. Use the existing pivoting hazard and keep its visible swing aligned with its collider. The stair header blocks a straight lift. A **church bell clapper** from the old bell lies in the repair alcove. |

**Booth shutter.** Reuse the timed room laser and alarm result, with a narrow inspection-light skin. Amber charges along the actual crossing segment. The lit segment has a hard edge and shows the red trip cue if a body crosses it. Start at **7.0 s** per cycle, **4.2 s** clear. The actor-sized wait pocket makes the whole tell and exit visible at once. The swinging clapper gives a sharp mechanical click at the top of its arc and always shows where it can go. The three-colour lab lens uses the ordinary camera exposure rule. Give its current view an edge and let the full exposure continue to behave like a camera.

**No bump on start.** Settle Clive’s shoulders and heels on the daybed outside the probe’s full sweep. Keep Sylvie’s bench outside the queue rail, shutter segment and trolley travel. Support Matt’s hips, heels and back against the pew, well below the clapper’s lowest swing. Use these poses in both routes per character. Verify each room sits **10 s** at zero bonks and zero wake. Use all four start phases for straight drags. Put the first meaningful turn within view of the resting body. Change pose or obstacles if an idle or straight-drag check fails.

## Evidence Locker

**Only town pickup** · **Tripod leg** (`tripod_leg`), at **(135, 1230)** in the west farmyard. Use **104 × 124 logical px** art with a jointed copper strut, torn socket and broad three-toed pad. Put it at an angle with clear negative space under the knee so it reads as a leg at phone size. Give it the ordinary mint glint, name tag and 48 px / one-second catchment. The full pocket is clear of the crashed hull, traffic lanes, camera range and spectator paths. The extra flight out to the farm costs time. The ordinary approach to the kitchen follows the farm road farther north. Use the [town pickup rules](GDD-8-map-collectibles.md) for filing, retry and the fourth star.

| Field Finds | English | Français |
| --- | --- | --- |
| Name / exact memo hint | Tripod leg / `A tripod leg` | Patte de tripode / `Une patte de tripode` |
| Description | Found in a farmyard. The other two are still attached to a very embarrassed Division vehicle. | Retrouvée dans une cour de ferme. Les deux autres sont toujours fixées à un véhicule de la Division qui préférerait se faire oublier. |
| Status | Tripod Division claims a limp. | La division Tripodes dit qu’elle boite. |
| Locked hint | Check the quiet side of the farm after the crash. | Après le crash, cherchez du côté tranquille de la ferme. |

One slot per souvenir in the [trophy room](GDD-9-trophy-room.md). Use each English item name as its lower-case ID, and register names and plurals in both languages.

| Item | Catalogue text | Objet et notice FR |
| --- | --- | --- |
| Meteor fragment | For three hours it was the biggest thing to hit Grimsby. Then the thing inside it got out. | Fragment de météore · Pendant trois heures, c’était la plus grosse chose jamais tombée sur Grimsby. Puis ce qu’elle renfermait est sorti. |
| Three-colour Martian lens | Shows every frequency except the one in which this was a good idea. | Lentille martienne tricolore · Capte toutes les fréquences, sauf celle où c’était une bonne idée. |
| Drive-in programme | The second feature promised an invasion. The audience asked for a refund when it actually arrived. | Programme du ciné-parc · Le deuxième film promettait une invasion. Quand elle a commencé pour de vrai, le public a demandé à être remboursé. |
| Invasion reel | At the good bit an usher runs across the screen to tell everyone the car park is on fire. | Bobine de l’invasion · Au meilleur moment, un ouvreur traverse l’écran pour annoncer que le parking brûle. |
| White truce flag | Nobody shot the flag. They were having trouble aiming between sneezes. | Drapeau blanc · Personne n’a tiré sur le drapeau. C’était déjà assez dur de viser entre deux éternuements. |
| Church bell clapper | Rang three times. On the third, even the Martians pulled over. | Battant de cloche · Trois coups. Au troisième, même les Martiens se sont rangés sur le bas-côté. |

### Specimen Archive

| ID · name (EN / FR) | Age · height · weight | Description | `at3` | `at10` |
| --- | --- | --- | --- | --- |
| `forester` · Clive Forester / Clive Forester | 38 · 181 cm · 79 kg | Published the first scientific paper to ask a meteor what the hell it wanted. | Brought a handkerchief to his intake interview. It was for us. | Sculpted the crash site in mashed potatoes. His dinner guests had to eat around the crater. |
| `van_bell` · Sylvie Van Bell / Sylvie Van Bell | 29 · 164 cm · 58 kg | Can evacuate a car park in eight minutes, including the car that always wants its money back. | Started a lost-property box for coats people abandoned during the end of the world. | Sat two men in black in the front row. They kept forgetting where they’d parked. |
| `collier` · Pastor Matt Collier / Pasteur Matt Collier | 57 · 176 cm · 83 kg | Offered sanctuary to everybody in town. Set out one extra chair in case a Martian came in peace. | Took a collection for the saucer crew. We sent back the money and kept the biscuits. | Let a visitor with a glowing finger use the vestry phone. He only wanted to call home. |

| ID | Description FR | `at3` FR | `at10` FR |
| --- | --- | --- | --- |
| `forester` | A publié le premier article scientifique à demander à un météore ce qu’il foutait là. | A apporté un mouchoir à son entretien. C’était pour nous. | A sculpté le site du crash dans sa purée. Ses invités ont dû manger autour du cratère. |
| `van_bell` | Évacue un parking en huit minutes, y compris le râleur qui veut toujours se faire rembourser. | A créé un service d’objets trouvés pour les manteaux abandonnés pendant la fin du monde. | A installé deux hommes en noir au premier rang. Ils ne savaient plus où ils s’étaient garés. |
| `collier` | A ouvert son église à toute la ville. A prévu une chaise de plus au cas où un Martien viendrait en paix. | A fait la quête pour l’équipage de la soucoupe. On a rendu l’argent et gardé les biscuits. | A prêté le téléphone de la sacristie à un visiteur au doigt lumineux. Il voulait juste appeler chez lui. |

## Lines

| Cue | Copy |
| --- | --- |
| Zib, launch | “I think that saucer just sneezed through the good bit.” |
| Vrell, first clear | “The tripods caught a cold. I took their temperatures. One clipboard later, every backside gets a Form 7-B.” |
| Dispatch after first clear | **2199 · RETURN SIGNAL RECEIVED** |
| Gazette, ordinary | **MARTIANS INVADE. MARTIANS CATCH COLD. MARTIANS GO HOME.** |
| Gazette, spotted | **DRIVE-IN AUDIENCE DEMANDS LESS REALISTIC SEQUEL** |
| Gazette, tripod leg filed | **MARTIAN LANDING GEAR FOUND IN LOST PROPERTY** |
| Clive, mumbles | “Don’t poke the meteor…” / “The rock has a pulse.” |
| Sylvie, mumbles | “The second feature can wait…” / “That’s the exit, sir.” |
| Matt, mumbles | “There’s room in the back…” / “I waved the clean flag.” |
| Pickup, collected on a repeat | “You brought a tripod leg. It was a write-off until you turned it into a spare part.” |
| Pickup, missed rotation | “You left the tripod leg in the farmyard. They’re using it to prop up the chicken coop.” |

**French references and wordplay.** Keep **Cerfa 7-B** from the clinic copy. For “every backside gets a Form 7-B,” use **« Depuis, chaque fesse a son Cerfa 7-B. »** Translate the Gazette’s three short sentences in the same rhythm. Use the French release title **La Guerre des mondes** on the card and memo.

## Clock, stars and proof

The last screening runs until dawn, **315 s** on the shared clock. **Night owl** requires **190 s** left (**125 s** elapsed, as in 1955, here with tighter approaches). **Delivered** needs all three witnesses before dawn. **Ghost** also needs zero full sightings and zero failed room attempts. The **Tripod leg** star needs the find and all three deliveries in the same shift. Keep the standard room retry choice and filed-find rules. A 2199 ping carries neither a star nor an unlock for an unshipped level.

Use the [1955 baseline in the Grail spec](GDD-12-1122-grail.md#clock-stars-and-proof) and the same [GDD-5 progression checks](GDD-5-progression.md). Start at a **110–125 s** casual independent shift estimate. Make a clean run harder primarily through the two timed room crossings and the tighter flight fuse. Preserve the extra time for a player who loses a room, takes the longer road or goes back for the leg.

| Model | Delivered | Ghost | Night owl | Tripod leg star on detour runs |
| --- | --- | --- | --- | --- |
| Skilled | 85–95% | 55–70% | 70–80% | 85–95% |
| Casual | 75–90% | 35–40% | 50–55% | 70–85% |

Proposed ranges over 20 matched seeds, with no upgrades and a separate set for detour runs. Six-seed gate floors are **5/6, 3/6, 4/6** skilled and **4/6, 2/6, 3/6** casual for the first three stars. Skilled Ghost must beat casual Ghost, with the existing 90% casual ceiling. Target at least **75% skilled / 40% casual** on each route, and give each sleeper a route at **65% casual** or better. Evaluate each leg and the full shift alongside 1122 before setting final clocks. Prove each entry, every room, full shift and the detour with perfect autopilot. Preserve all four beeline checks, room straight-drag checks and the 10 s idle checks. Use real pointer input to inspect leaving the amber flashbulb frame, returning to the east pocket after a sighting and choosing a room after a delivery, at **375 × 690** in EN, FR and reduced motion. Exact footprints, clocks and bands are provisional until the greybox runs.

## Art and build split

Reuse 1955 ground tint, period saloons, road assets, projector-facing streetlight fallback and HUD. Reuse farm dirt tracks, `flight/barn_top`, camera and shutter timing art, `flight/photographer_top` and the existing flash frame. Indoors reuse the trolley/castors, window, roof hatch, doors, camera mount, laser emitter geometry and antique timber props. Fade the farm’s glow under reduced motion and keep all real light edges and timing visible.

| Proposed keys | Size and reason |
| --- | --- |
| `flight/invasion_screen_top`, `flight/invasion_projector_top`, `flight/invasion_booth_top` | **540×112**, **84×78**, **222×152**. An original painted invasion picture sits on the screen mesh. Give the projector’s front lens room for the live cone. No dip to black across the whole viewport. |
| `flight/invasion_farm_top`, `flight/invasion_church_top`, `flight/invasion_warmachine_top` | **260×220**, **320×226**, **300×200**. Pitched roof, silhouette of a steeple, and copper hull with a crooked swan neck. Use painted earth or existing terrain for the crater. |
| `flight/invasion_crowd_top`, `flight/pickup_tripod_leg` | **78×68**, **104×124**. Crowd group facing north in sprite coordinates. Reuse the same sprite on both paths. The leg carries no text and doubles as the trophy icon. |
| `room/bg_invasion_farm`, `room/bg_invasion_booth`, `room/bg_invasion_church` | **540×720** each. Faded wallpaper, acoustic tile, dark stone. Keep gameplay silhouettes out of textures. |
| `room/invasion_probe_eye`, `room/invasion_bell_clapper` | **76×72**, **42×124**. Three contrasting lenses in an asymmetrical probe head, and a long pendulum for the bell with an explicit pivot. |
| `human/{forester,van_bell,collier}_{head,head_awake,torso,upper_arm,lower_arm,upper_leg,lower_leg}` | Standard humanoid sizes. Give Clive his own lab coat silhouette, Sylvie a swept scarf and Matt a tired face above a low collar. No actor likenesses. |
| `room/{invasion_meteor_fragment,invasion_martian_lens,invasion_programme,invasion_reel,invasion_truce_flag,invasion_clapper_souvenir}` | Long sides **45–70 px**. Original silhouettes carrying the same shape cues on the shelf as in the cutaway. |

| Pass | Owner and handoff |
| --- | --- |
| 1. Flight and level | **Flight/level** owns the map, screen and audience logic, camera geometry, comfortable wait pockets, fallback art and the new skin hooks. Use current hazard state for all three tells. |
| 2. Rooms | **Abduction** owns all six rooms, the stock timer and sight-line variants, room-local props and the no-input and direct-drag proofs. |
| 3. Registry and save | **Coordinator** owns the level ID, Dispatch gate and return paths, append-only room, specimen and pickup registries and the pending 2199 label. Reuse story facts from 1953 without changing the clinic’s Form 7-B tasks. |
| 4. Art and copy | **Art** supplies the original vector pack and tests prop legibility with final scale. **Story/UI** owns the EN/FR memo hints, report priorities, Gazette, line hooks and all three Evidence Locker sections. |
| 5. Tune and play | **Difficulty** owns the per-route and whole-shift runs plus the separate pickup scoring. **Verification** runs the room, map and pickup autopilots, memo-hint and trophy tests, then the real-pointer replay through Dispatch and reload. |

[Art brief](ART_BRIEF.md) · [Pixi view guide](PIXI-MIGRATION.md)
