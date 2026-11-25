# GDD-13 · The War of the Worlds (Route 9 Drive-In, 1953)

The Tripod Division’s census survey goes down with a cold. One machine staggers in front of the drive-in screen, sneezes a heat ray and gets a round of applause. Bring in the three witnesses before dawn.

## The shift

**Work Order #0013** with the [Birch Lane orders](GDD-11-onramp.md) included. Stable ID `level11`. The first [1955 delivery (#0011)](GDD-10-1955.md) opens this date and [1122](GDD-12-1122-grail.md) together. Either can be played first. [2199](GDD-14-2199-hitchhiker.md) opens when both are delivered. The Work Order card shows Clive and reads “Two invasions for the price of one.” FR *La Guerre des mondes* · « Deux invasions pour le prix d’une. »

At the Route 9 drive-in west of Grimsby, the film keeps playing while the Bureau’s copper tripod staggers into view in front of the screen. The audience thinks it’s part of the picture. The Bureau’s machine has two legs and a bare third socket. Its missing leg props up Grandpa Doyle’s chicken coop. Echo the 1953 film through the copper cobra hood, heat ray, crashed cylinder, farmhouse probe and church refuge. In the projected picture, use the film’s hovering silhouette with an original drawing. Use a steady pale projector edge and a dashed amber wind-up from the tripod’s hood so both sources read where they overlap. Present-day Vrell dispatches Zib from the Bureau. Zib alone sees rookie Vrell near the queue behind the screen.

The brass thermometer is a single reveal in the first-clear report. Rookie Vrell borrows it from Grandpa Doyle to take the sick pilots’ temperatures and starts the fever log that becomes Form 7-B. The memo sets up his story. The launch, headlines, souvenirs and archive use the cold, film or witnesses for their own jokes. [1953 film synopsis and production notes](https://catalog.afi.com/Film/51100-THE-WAR-OF-THE-WORLDS)

**Shift memo**

> **Work Order #0013 · The War of the Worlds**
>
> Agent Zib, the drive-in is showing an invasion. The machine out front is ours. It was supposed to be counting people. Bring in three witnesses by dawn. A tripod leg props up the coop in the west farmyard.
>
> I was a rookie pilot that night. Half the division had colds. I’ll tell you what I did about it when you get back.
>
> — Vrell. Keep your windows up.

> **Ordre n°0013 · La Guerre des mondes**
>
> Agent Zib, le ciné-parc projette un film d’invasion. Notre engin, devant l’écran, devait compter les gens. Ramenez trois témoins avant l’aube. Une patte de tripode soutient le poulailler dans la cour ouest.
>
> J’étais jeune pilote, ce soir-là. La moitié de la division était enrhumée. Je vous raconterai ce que j’ai fait à votre retour.
>
> — Vrell. Gardez les vitres fermées.

## Flight

Greybox **1800 × 2280** logical px, north up. Spawn **(900, 2185)** behind the drive-in screen. The projector stands on the north rim of the parking bowl and throws its beam south across the occupied rows. The road fork behind the screen offers two visible ways to get around. West Farm Road follows **(250, 2060) → (255, 1430) → (310, 930)**. East Service Road follows **(1580, 2070) → (1620, 1250) → (1620, 820)**. Church Lane at **y 295** joins the two approaches across the back. Leave a shadowed cross lane near **y 1180** west of the spectator queue. Use dark indigo farm fields, warm dusty turnouts and the wide screen’s cool spill. Soft green cockpit light stays in the tripod’s hood. Reuse period vehicles and roads from [1955](GDD-10-1955.md). Add a queue of scarfed tripod silhouettes behind the screen, led by rookie Vrell with a clipboard. The queue and its green lights are scenery.

| Place | Centre | Entry rings |
| --- | --- | --- |
| Farmhouse lab, on the crater’s rim | (430, 720) | **Kitchen window** (285, 750), recommended · **Attic hatch** (485, 515) |
| Drive-in ticket office, now the evacuation desk | (1435, 1050) | **Staff door** (1595, 1070), recommended · **Booth vent** (1440, 850) |
| Church at the north end of the lane | (930, 510) | **Vestry door** (755, 535), recommended · **Bell hatch** (1060, 385) |
| Drive-in screen and projection booth | (900, 2030) and (900, 1440) | Low opaque screen seen from the top and front edge. From the south fork the two kerbs show how to skirt the beam. |
| Crater and split meteor casing | (475, 1280) | Scorched earth and a split copper cylinder angle toward the projection bowl. |
| Sick tripod | (900, 1650) | Staggers in from the screen wing into the playing picture’s foreground, then braces at this heat-ray origin. Its empty leg socket faces the player. |
| Grandpa Doyle’s west farmyard | (135, 1230) | The leg props up the chicken coop. Frame it against open ground. A low fence separates it from the crater lip. |

| Hazard | System and tell | Greybox |
| --- | --- | --- |
| **Drive-in projector** | Existing fixed `camera` cone. Its exact hard edge is visible across the parking rows. The edge and fuse go red on exposure as silhouetted patrons point through the light. Keep the beam on during the shift. Frame changes play on the screen with no effect on detection. The joke is that staying in the film’s light gets you spotted by the audience. | Projector at **(900, 1460)**, aimed south, range **640 px**, half angle **0.76 rad**, zero sweep. Align the beam with the screen, show the true detector cap and leave outer kerbs in darkness. |
| Panicking spectators | Two existing `steward` routes with groups of two or three as their sprites. Their moving cones are the line of sight of whoever is leading. A raised hand or turning torch previews the next heading in amber near the turn. The hard cone tracks the current real heading and goes red on exposure. | First group **(1195, 1370) ↔ (1355, 1290)** at **94 px/s**, range **178**, half angle **0.34 rad**. Second group **(1140, 795) ↔ (1120, 600)** at **82 px/s**, range **165**, same half angle. Start at **1.0 s** turn dwell with the paths offset. Put young Pruitt in the first group, with opera glasses and a notebook. Keep the silhouettes together and use one cone per group. |
| **Sick tripod’s heat-ray sneeze** | Gate an existing fixed camera cone with the charging-laser timing pattern. Show its exact cone with a dashed amber edge while the hood rocks through “Ah… ah…”. Keep the hard live edge during “CHOO!” and turn it and the saucer fuse red on exposure. The heat ray comes from the aperture. | Origin **(900, 1650)**, aim northwest at **−2.25 rad**, start with **560 px** range and **0.24 rad** half angle. Try a **6.0 s** clock cycle with **1.2 s** amber lead and **1.05 s** live. The tripod reaches its stance before the first warning. Once braced, the aperture stays at the sampled cone origin. Put a wait pocket near **(480, 1010)** and keep the whole west road and return pocket clear. |

Use the shared hazard clock for the tripod, with the same schedule in play and autopilot. The initial stagger is a retained pose change in the screen foreground. Keep the eventual origin and exact warning visible in reduced motion. The audience looks between the real silhouette and the playing screen. No global flash or camera shake is needed.

Start the fuse at **0.80 s**. Mint remains reserved for the saucer, goals and pickup. Put abduction prompts and panic lines in the shared speech-bubble layer and time them with `readSeconds()`. Use colour plus edge changes and arming animation so the route is readable without sound. Any moving crowd markers are visual previews of the shared route pose. The projector runs continuously. Reuse the flight rules with era art and tells.

**No straight-line win.** A direct drag from launch to any first entry takes the saucer through the parking-bowl cone before it can lock. Keep the fallout from a sighting on the normal last-delivered-ring or launch return, with the clock still live. The West Farm Road and East Service Road approaches both go outside the projector. The shortest direct chord is about **413 px**, or **0.96 s** at the 430 px/s speed cap. For the later legs, approach Church Lane from either edge and cross north of the two crowd paths. Confirm every direct first approach at **0, 2.5, 5 and 8 s**, including the staff door nearest the right-hand edge of the cone. The sneeze punishes a shortcut across the film’s foreground without guarding the recommended ring locks. The beeline proof should stand with the camera alone.

## The three witnesses

Give each sleeper two exits and one souvenir per route. Use a standard humanoid rig and hard wake rules. A slower route offers a longer wait pocket or a wide turn. The short route gives up that space.

| Sleeper | Route | What the player does |
| --- | --- | --- |
| **Clive Forester**, a scientist who stayed up trying to make the Martian eye blink. It blinked once. He closed both of his. | **Kitchen window** · `forester_kitchen` | Lift from a kitchen daybed, clear the low lab trolley and settle on the far side before moving out through the window. A raised counter corner blocks the diagonal. A creaky patch under the trolley penalizes a fast drop. The **meteor fragment** sits on a sample tray at the bend. |
| Clive | **Attic hatch** · `forester_attic` | Slip around an attic shelf and wait in the broad bay below the hatch until the three-colour Martian probe looks away. Use the existing room camera, with its normal hard-edged cone and exposure fuse. The shelf lip blocks a direct ascent. The **three-colour Martian lens** is a spare on the upper bench. |
| **Sylvie Van Bell**, running the evacuation desk. She took one minute to rest her eyes after directing the same cars out of the lot twice. | **Staff door** · `van_bell_staff` | Lift her from a ticket-office bench, arc over the fallen queue rail and past the film-can trolley on castors. The rail fouls the direct drag. Lift early to keep trailing legs out of the castor lane. The **drive-in programme** is on the ticket window shelf. |
| Sylvie | **Booth vent** · `van_bell_vent` | Go round the projector plinth, hold with her feet clear of the sprocket case and cross the booth’s inspection lamp when its shutter drops. The plinth blocks a straight lift. Grab the **invasion reel** from the shelf just beyond the crossing. |
| **Pastor Matt Collier**, who walked out with a white flag and a plate of biscuits, then fell asleep in his own church. | **Vestry door** · `collier_vestry` | Lift over the high-backed end of the pew and glide above the loose boards. Use the plain room creak zone at floor level. The end of the pew blocks a direct pull. Collect the **white truce flag** by the vestry threshold. |
| Pastor Matt | **Bell hatch** · `collier_bell` | Carry him sideways round the belfry stair header, pause in an alcove, then pass the swinging clapper to reach the hatch. Use the existing pivoting hazard and keep its visible swing aligned with its collider. The stair header blocks a straight lift. A **church bell clapper** from the old bell lies in the repair alcove. |

**Booth shutter.** Reuse the timed room laser and alarm result, with a narrow inspection-light skin. Amber charges along the actual crossing segment. The lit segment has a hard edge and shows the red trip cue if a body crosses it. Start at **7.0 s** per cycle, **4.2 s** clear. The actor-sized wait pocket makes the whole tell and exit visible at once. The swinging clapper gives a sharp mechanical click at the top of its arc and always shows where it can go. The three-colour lab lens uses the ordinary camera exposure rule. Give its current view an edge and let the full exposure continue to behave like a camera.

**No bump on start.** Settle Clive’s shoulders and heels on the daybed outside the probe’s full sweep. Keep Sylvie’s bench outside the queue rail, shutter segment and trolley travel. Support Matt’s hips, heels and back against the pew, well below the clapper’s lowest swing. Use these poses in both routes per character. Verify each room sits **10 s** at zero bonks and zero wake. Use all four start phases for straight drags. Put the first meaningful turn within view of the resting body. Change pose or obstacles if an idle or straight-drag check fails.

## Evidence Locker

**Only town pickup** · **Tripod leg** (`tripod_leg`), at **(135, 1230)** under Grandpa Doyle’s chicken coop in the west farmyard. Use **104 × 124 logical px** art with a jointed copper strut, torn socket and broad three-toed pad. Put it at an angle with clear negative space under the knee so it reads as a leg at phone size. Give it the ordinary mint glint, name tag and 48 px / one-second catchment. Place the coop body just outside the pickup art box, touching the top of the leg at its edge. The full pocket is clear of the casing, traffic lanes, camera, sneeze and spectator paths. The coop settles a few inches onto a timber block when the leg leaves. The movement stays scenery. The extra flight out to the farm costs time. The ordinary approach to the kitchen follows the farm road farther north. Use the [town pickup rules](GDD-8-map-collectibles.md) for filing, retry and the fourth star.

| Field Finds | English | Français |
| --- | --- | --- |
| Name / exact memo hint | Tripod leg / `A tripod leg` | Patte de tripode / `Une patte de tripode` |
| Description | Grandpa Doyle put it under a chicken coop. For years it was the only working part of the Division. | Grand-père Doyle l’a calée sous son poulailler. Des années durant, c’était la seule pièce de la division encore en service. |
| Status | The Division now fields one bipod. It leans on things. | La division compte désormais un bipode. Il s’appuie où il peut. |
| Locked hint | Look under the coop in the west farmyard. | Regardez sous le poulailler, dans la cour à l’ouest. |

On present-day L1, use the shared coop outside the active approach, with the same strut shape beside it, rusty and half buried. Use a dull silhouette without mint, map marker or lock. L1’s coop and strut are scenery and leave its flight route and pickup rules intact.

One slot per souvenir in the [trophy room](GDD-9-trophy-room.md). Use each English item name as its lower-case ID, and register names and plurals in both languages.

| Item | Catalogue text | Objet et notice FR |
| --- | --- | --- |
| Meteor fragment | For three hours it was the biggest thing to hit Grimsby. Then the thing inside it got out. | Fragment de météore · Pendant trois heures, c’était la plus grosse chose jamais tombée sur Grimsby. Puis ce qu’elle renfermait est sorti. |
| Three-colour Martian lens | Shows every frequency except the one in which this was a good idea. | Lentille martienne tricolore · Capte toutes les fréquences, sauf celle où c’était une bonne idée. |
| Drive-in programme | The second feature promised an invasion. The audience asked for a refund when it actually arrived. | Programme du ciné-parc · Le deuxième film promettait une invasion. Quand elle a commencé pour de vrai, le public a demandé à être remboursé. |
| Invasion reel | At the good bit an usher runs across the screen to tell everyone the car park is on fire. | Bobine de l’invasion · Au meilleur moment, un ouvreur traverse l’écran pour annoncer que le parking brûle. |
| White truce flag | Nobody shot the flag. They were having trouble aiming between sneezes. | Drapeau blanc · Personne n’a tiré sur le drapeau. C’était déjà assez dur de viser entre deux éternuements. |
| Church bell clapper | Rang all night. The Martians thought it was last orders. | Battant de cloche · A sonné toute la nuit. Les Martiens ont cru que le bar fermait. |

### Specimen Archive

| ID · name (EN / FR) | Age · height · weight | Description | `at3` | `at10` |
| --- | --- | --- | --- | --- |
| `forester` · Clive Forester / Clive Forester | 38 · 181 cm · 79 kg | Published the first scientific paper to ask a meteor what the hell it wanted. | Brought a handkerchief to his intake interview. It was for us. | Asked the meteor for a second sample. It closed the lid. |
| `van_bell` · Sylvie Van Bell / Sylvie Van Bell | 29 · 164 cm · 58 kg | Can empty a drive-in in eight minutes. It takes nine if she lets them stay for the credits. | Says a girl in the front row took down every word the Martians said. She asked them to spell their names. | Put the saucers in the back row. They kept shining their lights over the screen. |
| `collier` · Pastor Matt Collier / Pasteur Matt Collier | 57 · 176 cm · 83 kg | Offered sanctuary to the whole town. The congregation arrived with popcorn. | A Martian tried to shake his hand. It had three fingers and a very firm grip. | Put a collection plate beneath the hole in the roof. The Martians paid for half the repairs. |

| ID | Description FR | `at3` FR | `at10` FR |
| --- | --- | --- | --- |
| `forester` | A publié le premier article scientifique à demander à un météore ce qu’il foutait là. | A apporté un mouchoir à son entretien. C’était pour nous. | A demandé un deuxième échantillon au météore. Il a refermé le couvercle. |
| `van_bell` | Vide un ciné-parc en huit minutes. Neuf si elle les laisse regarder le générique. | Dit qu’une petite du premier rang a noté chaque mot des Martiens. Elle leur a demandé d’épeler leurs noms. | A envoyé les soucoupes au dernier rang. Elles n’arrêtaient pas d’éclairer l’écran. |
| `collier` | A ouvert son église à toute la ville. Les fidèles sont arrivés avec du pop-corn. | Un Martien a voulu lui serrer la main. Trois doigts, une sacrée poigne. | A posé la corbeille de la quête sous le trou du toit. Les Martiens ont payé la moitié des réparations. |

## Lines

| Cue | EN | FR |
| --- | --- | --- |
| Zib, launch | “The picture’s still playing. That thing just walked out in front of it.” | « Le film continue. Ce truc vient de passer devant l’écran. » |
| Spectator, first heat-ray burst | “Bless you!” | « À vos souhaits ! » |
| Projector sighting | “Down in front! You can see the strings!” | « Baissez-vous devant ! On voit les ficelles ! » |
| Heat-ray sighting | “Zib, it just sneezed through your seat.” | « Zib, il vient de trouer votre siège en éternuant. » |
| Vrell, first clear | “I borrowed Grandpa Doyle’s brass thermometer. Took their temperatures. From behind. That’s where humans got the probe idea.” | « J’ai emprunté le thermomètre en laiton de grand-père Doyle. Pris leur température. Par derrière. Voilà l’origine des sondes. » |
| Gazette, two or more sightings | **AUDIENCE APPLAUDS AS INVASION LEAVES EARLY** | **LE PUBLIC APPLAUDIT LE DÉPART PRÉCIPITÉ DE L’INVASION** |
| Tripod leg cover story | “Martian hardware repurposed as farm equipment.” | « Du matériel martien recyclé en outillage agricole. » |
| Clive, mumbles | “Don’t poke the meteor…” / “The rock has a pulse.” | « Ne touchez pas au météore… » / « La pierre a un pouls. » |
| Sylvie, mumbles | “You can finish the popcorn in the car.” | « Vous pouvez finir votre pop-corn dans la voiture. » |
| Matt, mumbles | “We come in peace… mind the step…” | « Nous venons en paix… attention à la marche… » |
| Pickup, collected on a repeat | “You brought a tripod leg. Try finding a left one in the parts catalogue.” | « Vous avez rapporté une patte de tripode. Allez trouver la gauche dans le catalogue des pièces. » |
| Pickup, missed rotation | “Leave the leg. The hens have finally stopped laying on a slope.” | « Laissez la patte. Les poules ont enfin arrêté de pondre en pente. » |

In the first clear’s cover-story row, add “Fever log filed. Adopted as Form 7-B.” / « Relevé de température archivé. Adopté comme Cerfa 7-B. » That ties the report to the clinic. Use the archive-clipping masthead in the Gazette. Keep the two-sighting priority and use the leg line in the existing cover-story row on repeat runs. Young Pruitt appears in the crowd and in Sylvie’s one addendum. Present-day Vrell stays at Dispatch.

## Clock, stars and proof

The last screening runs until dawn, **315 s** on the shared clock. **Night owl** requires **190 s** left (**125 s** elapsed, as in 1955, here with tighter approaches). **Delivered** needs all three witnesses before dawn. **Ghost** also needs zero full sightings and zero failed room attempts. The **Tripod leg** star needs the find and all three deliveries in the same shift. Keep the standard room retry choice and filed-find rules.

Use the [1955 baseline in the Grail spec](GDD-12-1122-grail.md#clock-stars-and-proof) and the same [GDD-5 progression checks](GDD-5-progression.md). Start at a **110–125 s** casual independent shift estimate. Make a clean run harder primarily through the two timed room crossings and the tighter flight fuse. Preserve the extra time for a player who loses a room, takes the longer road or goes back for the leg.

| Model | Delivered | Ghost | Night owl | Tripod leg star on detour runs |
| --- | --- | --- | --- | --- |
| Skilled | 85–95% | 55–70% | 70–80% | 85–95% |
| Casual | 75–90% | 35–40% | 50–55% | 70–85% |

Proposed ranges over 20 matched seeds, with no upgrades and a separate set for detour runs. Six-seed gate floors are **5/6, 3/6, 4/6** skilled and **4/6, 2/6, 3/6** casual for the first three stars. Skilled Ghost must beat casual Ghost, with the existing 90% casual ceiling. Target at least **75% skilled / 40% casual** on each route, and give each sleeper a route at **65% casual** or better. Evaluate each leg and the full shift alongside 1122 before setting final clocks. Prove each entry, every room, full shift and the detour with perfect autopilot. Preserve all four beeline checks, room straight-drag checks and the 10 s idle checks. Use real pointer input to inspect waiting outside the amber sneeze cone and crossing after it clears, returning to the east pocket after a sighting and choosing a room after a delivery, at **375 × 690** in EN, FR and reduced motion. Exact footprints, clocks and bands are provisional until the greybox runs.

## Art and build split

Reuse 1955 period saloons, roads, a projector-facing streetlight fallback and the HUD. Reuse farm dirt tracks, `flight/barn_top`, and the existing camera and charging tells. Retint farm ground to indigo. Indoors reuse the trolley/castors, window, roof hatch, doors, camera mount, laser emitter geometry and antique timber props. Fade the farm’s glow under reduced motion and keep all real light edges and timing visible.

| Proposed keys | Size and reason |
| --- | --- |
| `flight/invasion_screen_top`, `flight/invasion_projector_top`, `flight/invasion_booth_top` | **540×112**, **84×78**, **222×152**. An original painted invasion picture sits on the screen mesh. Give the projector’s front lens room for the live cone. No dip to black across the whole viewport. |
| `flight/invasion_farm_top`, `flight/invasion_church_top`, `flight/invasion_sick_tripod_top` | **260×220**, **320×226**, **276×236**. Pitched roof, steeple and two-legged copper machine with a cobra hood, heat-ray aperture and visible empty socket. Compose two planted legs and the moving hood at retained pivots. Paint the split casing into the crater. |
| `flight/invasion_crowd_top`, `flight/invasion_crowd_pruitt_top`, `flight/pickup_tripod_leg`, `flight/doyle_coop_top`, `flight/doyle_coop_strut_top` | **78×68**, **78×68**, **104×124**, **130×94**, **72×38**. Crowd variant with the child’s opera glasses and notebook. The clean copper leg doubles as the trophy icon. Reuse the coop in L1 alongside the smaller rusty strut. Compose the scarfed queue and rookie Vrell from retained silhouettes. Give the parked machines all three legs so the empty socket reads on the sick one. |
| `room/bg_invasion_farm`, `room/bg_invasion_booth`, `room/bg_invasion_church` | **540×720** each. Faded wallpaper, acoustic tile, dark stone. Keep gameplay silhouettes out of textures. |
| `room/invasion_probe_eye`, `room/invasion_bell_clapper` | **76×72**, **42×124**. Three contrasting lenses in an asymmetrical probe head, and a long pendulum for the bell with an explicit pivot. |
| `human/{forester,van_bell,collier}_{head,head_awake,torso,upper_arm,lower_arm,upper_leg,lower_leg}` | Standard humanoid sizes. Give Clive his own lab coat silhouette, Sylvie a swept scarf and Matt a tired face above a low collar. No actor likenesses. |
| `room/{invasion_meteor_fragment,invasion_martian_lens,invasion_programme,invasion_reel,invasion_truce_flag,invasion_clapper_souvenir}` | Long sides **45–70 px**. Original silhouettes carrying the same shape cues on the shelf as in the cutaway. |

| Pass | Owner and handoff |
| --- | --- |
| 1. Flight and level | **Flight/level** owns the map, screen and audience logic, camera geometry, comfortable wait pockets and the tripod timing on the existing cone. Reuse the sampled hazard state for tells and autopilot. Place the L1 strut as scenery and check it leaves L1 play intact. |
| 2. Rooms | **Abduction** owns all six rooms, the stock timer and sight-line variants, room-local props and the no-input and direct-drag proofs. |
| 3. Registry and save | **Coordinator** owns the level ID, Dispatch gate and return paths, append-only room, specimen and pickup registries and the 1955 delivery gate shared with 1122. Use the delivery flag for the gnome’s 1953 postcard. Reuse story facts from 1953 without changing the clinic’s Form 7-B tasks. |
| 4. Art and copy | **Art** supplies the original vector pack and tests prop legibility with final scale. **Story/UI** owns the EN/FR memo hints, report priorities, Gazette, line hooks and all three Evidence Locker sections. |
| 5. Tune and play | **Difficulty** owns the per-route and whole-shift runs plus the separate pickup scoring. **Verification** runs the room, map and pickup autopilots, memo-hint and trophy tests, then the real-pointer replay through Dispatch and reload. |

[Art brief](ART_BRIEF.md) · [Pixi view guide](PIXI-MIGRATION.md)
