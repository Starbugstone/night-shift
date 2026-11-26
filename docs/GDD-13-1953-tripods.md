# GDD-13 · The War of the Colds (Route 9 Drive-In, 1953)

The Tripod Division’s census survey goes down with a cold. One machine staggers in front of the drive-in screen, sneezes a heat ray and gets a round of applause. Bring in the three witnesses before dawn.

## The shift

**Work Order #0013** with the [Birch Lane orders](GDD-11-onramp.md) included. Stable ID `level11`. The first [1955 delivery (#0011)](GDD-10-1955.md) opens this date and [1122](GDD-12-1122-grail.md) together. Either can be played first. [2199](GDD-14-2199-hitchhiker.md) opens when both are delivered. The Work Order card shows Clive and reads “Please remain seated for the evacuation.” FR *La Guerre des rhumes* · « Veuillez rester assis pendant l’évacuation. »

At the Route 9 drive-in west of Grimsby, a copper craft hovers in profile on the screen. The Bureau’s machine staggers across the foreground with the same broad, low hull and high cobra hood. Its two short braces touch down, the bare third socket tips into view, and the hood winds up for a sneeze. The missing leg props up Grandpa Doyle’s chicken coop. Seat the audience in cardboard 3-D glasses in the front rows so their applause reads as part of the screening. Echo the film through the copper silhouettes, heat ray, crashed cylinder, farmhouse probe and church refuge. Use a steady pale projector edge and a dashed amber wind-up from the tripod’s hood so both sources read where they overlap. Present-day Vrell dispatches Zib from the Bureau. Zib recognises rookie Vrell by his clipboard at the front of the queue in the screen’s east wing, in full view of the front rows. Pose the sick pilots already in line holding their rear hatches shut. Use the retained silhouettes and leave the thermometer for the report.

The brass thermometer is a single reveal in the first-clear report. Rookie Vrell borrows it from Grandpa Doyle to take the sick pilots’ temperatures and starts the fever log that becomes Form 7-B. The memo sets up his story. The launch, headlines, souvenirs and archive use the cold, film or witnesses for their own jokes. [1953 film synopsis and production notes](https://catalog.afi.com/Film/51100-THE-WAR-OF-THE-WORLDS)

**Shift memo**

> **Work Order #0013 · The War of the Colds**
>
> Agent Zib, the drive-in is showing an invasion. The machine out front is ours. It was supposed to be counting people. Bring in three witnesses by dawn. In the west farmyard, a tripod leg props up the coop.
>
> I was a rookie pilot that night. Half the division had colds. I’ll tell you what I did about it when you get back.
>
> — Vrell. Keep your windows up.

> **Ordre n°0013 · La Guerre des rhumes**
>
> Agent Zib, le drive-in projette un film d’invasion. Notre engin, devant l’écran, devait compter les gens. Ramenez trois témoins avant l’aube. Dans la cour à l’ouest, une patte de tripode soutient le poulailler.
>
> J’étais jeune pilote, ce soir-là. La moitié de la division était enrhumée. Je vous raconterai ce que j’ai fait à votre retour.
>
> — Vrell. Gardez les vitres fermées.

## Flight

Greybox **1800 × 2280** logical px, north up. Spawn **(900, 2185)** behind the drive-in screen. The projector stands on the north rim of the parking bowl and throws its beam south across the occupied rows. The road fork behind the screen offers two visible ways to get around. West Farm Road follows **(250, 2060) → (255, 1430) → (310, 930)**. East Service Road follows **(1580, 2070) → (1620, 1250) → (1620, 820)**. Church Lane at **y = 295** joins the two approaches across the back and stays clear at every phase.

Mark a shorter cut from West Farm Road to the ticket-office service turn. Start it at a wait pocket around **(300, 1300)** with a view of the northwest sneeze cone. Follow **(800, 1300) → (900, 1125) → (1500, 1125)**, then join the service turn north of the spectator patrol. Keep the casing clear of the marked lane through the crater lip. Use dusty kerbs or road paint to mark the cut and the turn toward Church Lane. Use dark indigo farm fields, warm turnouts and the screen’s soft cool spill. Reuse period vehicles and roads from [1955](GDD-10-1955.md).

| Place | Centre | Entry rings |
| --- | --- | --- |
| Farmhouse lab, on the crater’s rim | (430, 720) | **Kitchen window** / **Fenêtre de la cuisine** (285, 750), recommended · **Attic hatch** / **Trappe du grenier** (485, 515) |
| Drive-in ticket office, now the evacuation desk | (1435, 1050) | **Staff door** / **Porte de service** (1595, 1070), recommended · **Booth vent** / **Aération de la cabine** (1440, 850) |
| Church at the north end of the lane | (930, 510) | **Vestry door** / **Porte de la sacristie** (755, 535), recommended · **Bell hatch** / **Trappe du clocher** (1060, 385) |
| Drive-in screen and projection booth | (900, 2030) and (900, 1440) | Low opaque screen seen from the top and front edge. From the south fork the two kerbs show how to skirt the beam. |
| Sick pilots’ queue, screen east wing | (1420, 1900) at the head | Keep the silhouettes within **x = 1400–1520, y = 1880–1940** on the front-row side of the screen. Reveal them from the south fork’s east exit. The sick tripod enters from this wing. The queue is scenery with no detector or collider. |
| Crater and split meteor casing | (475, 1280) | Scorched earth and a split copper cylinder angle toward the projection bowl. |
| Sick tripod | (900, 1650) | Staggers in from the screen wing into the playing picture’s foreground, then braces at this heat-ray origin. Its empty leg socket faces the player. |
| Grandpa Doyle’s west farmyard | (135, 1230) | The leg props up the chicken coop. Frame it against open ground. A low fence separates it from the crater lip. |

| Hazard | System and tell | Greybox |
| --- | --- | --- |
| **Drive-in projector** | Existing fixed `camera` cone. Its exact hard edge is visible across the parking rows. The edge and fuse go red on exposure as silhouetted patrons point through the light. Keep the beam on during the shift. Frame changes play on the screen with no effect on detection. The joke is that staying in the film’s light gets you spotted by the audience. | Projector at **(900, 1460)**, aimed south, range **640 px**, half angle **0.76 rad**, zero sweep. Align the beam with the screen, show the true detector cap and leave outer kerbs in darkness. |
| Panicking spectators | Two existing `steward` routes with groups of two or three as their sprites. Their moving cones are the line of sight of whoever is leading. A raised hand or turning torch previews the next heading in amber near the turn. The hard cone tracks the current real heading and goes red on exposure. | First group **(1195, 1370) ↔ (1355, 1290)** at **94 px/s**, range **178**, half angle **0.34 rad**. Second group **(1140, 795) ↔ (1120, 600)** at **82 px/s**, range **165**, same half angle. Start at **1.0 s** turn dwell with the paths offset. Use one cone per group. In the seated crowd, a child claps as the car beside her pulls out. The child and the departing car are scenery. |
| **Sick tripod’s heat-ray sneeze** | Gate an existing fixed camera cone with the charging-laser timing pattern. Show its exact cone with a dashed amber edge during “Ah… ah…” / « A… a… ». Keep the hard live edge during “CHOO!” / « TCHOUM ! » and turn it and the saucer fuse red on exposure. The ray comes from the hood’s aperture. Dress the hood with an ice pack and a trailing scarf in colours distinct from the exposure cue. | Origin **(900, 1650)**, aim northwest at **−2.25 rad**, start with **640 px** range and **0.47 rad** half angle. Try a **6.0 s** cycle with **1.2 s** amber lead and **1.22 s** live. The machine reaches its stance before the first warning and holds the aperture at the sampled origin. Keep the full west road and wait pocket outside the ray. |

Use the shared hazard clock for the tripod, with the same schedule in play and autopilot. The initial stagger is a retained pose change. In reduced motion, start at the braced pose, hold the scarf still and keep the exact warning and ray. The audience looks between the real silhouette and the playing screen.

Start the fuse at **0.80 s**. Mint remains reserved for the saucer, goals and pickup. Use the existing first-approach bark for Zib’s recognition of Vrell at the queue. Put it and the crowd barks in `FLIGHT_BUBBLES` and time them with `readSeconds()`. Use colour plus edge changes and arming animation so the route is readable without sound. Any moving crowd markers are visual previews of the shared route pose. The projector runs continuously.

**Queue exposure.** At the queue’s southern edge, the projector’s uncapped east edge is `x = 900 + (1940 − 1460) × tan(0.76) ≈ 1356`. The queue starts at **x = 1400**, leaving at least **44 px** of horizontal clearance. Its northern edge is **230 px** south of the sneeze origin, while the entire sneeze cone points north. Queue exposure is **0 s < 0.80 s** at all phases. The screen is south of both the queue and front rows, so the audience has an open sightline across the wing.

**Shortcut exposure.** The cone first meets `y = 1300` at the range cap, where `x = 900 − √(640² − 350²) ≈ 364.2`. It covers **435.8 px** to the bend at **(800, 1300)**, plus **37.7 px** on the diagonal to the exit at about **(818.7, 1267.2)**. A full-speed crossing of that continuous **473.6 px** takes **473.6 / 430 ≈ 1.10 s** and fits inside the **1.22 s** burst. This gives about **0.30 s** over the **0.80 s** fuse and **0.10 s** over the Hush Drive fuse of **0.80 / 0.8 = 1.00 s**. The wait-pocket centre has **√(600² + 350²) − 640 ≈ 55 px** of radial clearance. In the greybox, start on an empty fuse and drive at the cap into a live burst at the leading edge. Sweep the usable shortcut width and verify live catches and clear-window crossings with and without Hush Drive. Check the full hover pocket, West Farm Road and Church Lane across all phases. Check that there is room to exit the ray before the spectator patrol.

**No straight-line win.** A direct drag from launch to any first entry takes the saucer through the parking-bowl cone before it can lock. Keep the fallout from a sighting on the normal last-delivered-ring or launch return, with the clock still live. The West Farm Road and East Service Road approaches both go outside the projector. The shortest direct chord is about **413 px**, or **0.96 s** at the 430 px/s speed cap. For the later legs, approach Church Lane from either edge and cross north of the two crowd paths. Confirm every direct first approach at **0, 2.5, 5 and 8 s**, including the staff door nearest the right-hand edge of the cone. The sneeze punishes a shortcut across the film’s foreground without guarding the recommended ring locks. The beeline proof should stand with the camera alone.

## The three witnesses

Give each sleeper two exits and one souvenir per route. Use a standard humanoid rig and hard wake rules. A slower route offers a longer wait pocket or a wide turn. The short route gives up that space.

| Sleeper | Route | What the player does |
| --- | --- | --- |
| **Clive Forester**, a scientist who fell asleep during a staring contest with the Martian eye. | **Kitchen window** · `forester_kitchen` | Lift from a kitchen daybed, clear the low lab trolley and settle on the far side before moving out through the window. A raised counter corner blocks the diagonal. A creaky patch under the trolley penalizes a fast drop. The **meteor fragment** sits on a sample tray at the bend. |
| Clive | **Attic hatch** · `forester_attic` | Slip around an attic shelf and wait in the broad bay below the hatch until the three-colour Martian probe looks away. Use the existing room camera, with its normal hard-edged cone and exposure fuse. The shelf lip blocks a direct ascent. The **three-colour Martian lens** is a spare on the upper bench. |
| **Sylvie Van Bell**, running the evacuation desk. She took one minute to rest her eyes after directing the same cars out of the lot twice. | **Staff door** · `van_bell_staff` | Lift her from a ticket-office bench, arc over the fallen queue rail and past the film-can trolley on castors. The rail fouls the direct drag. Lift early to keep trailing legs out of the castor lane. The **drive-in programme** is on the ticket window shelf. |
| Sylvie | **Booth vent** · `van_bell_vent` | Go round the projector plinth, hold with her feet clear of the sprocket case and cross the booth’s inspection lamp when its shutter drops. The plinth blocks a straight lift. Grab the **invasion reel** from the shelf just beyond the crossing. |
| **Pastor Matt Collier**, who walked out with a white flag and a plate of biscuits, then fell asleep in his own church. | **Vestry door** · `collier_vestry` | Lift over the high-backed end of the pew and glide above the loose boards. Use the plain room creak zone at floor level. The end of the pew blocks a direct pull. Collect the **white truce flag** by the vestry threshold. |
| Pastor Matt | **Bell hatch** · `collier_bell` | Carry him sideways round the belfry stair header, pause in an alcove, then pass the swinging clapper to reach the hatch. Use the existing pivoting hazard and keep its visible swing aligned with its collider. The stair header blocks a straight lift. A **church bell clapper** from the old bell lies in the repair alcove. |

**Booth shutter.** Reuse the timed room laser and alarm result, with a narrow inspection-light skin. Amber charges along the actual crossing segment. The lit segment has a hard edge and shows the red trip cue if a body crosses it. Start at **7.0 s** per cycle, **4.2 s** clear. The actor-sized wait pocket makes the whole tell and exit visible at once. The swinging clapper gives a sharp mechanical click at the top of its arc and always shows where it can go. The three-colour lab lens uses the ordinary camera exposure rule. Give its current view an edge and let the full exposure continue to behave like a camera.

Use these cosmetic reactions in both routes of each witness. Keep the existing wake and collision state as their only inputs.

- **Sylvie.** Cue her sleep-scream once on the first upward crossing of **55/100** wake after beam input, through the existing room speech handler. Retain the regular mumbles for ordinary bonks. The scream is speech only.
- **Matt.** Drop a biscuit on each registered bonk using the Black Knight’s fixed visual shed pool. The first two drops use the biscuit mumbles below at the normal room speech cadence. Biscuits have no collision, wake or souvenir yield.
- **Clive.** Place his Geiger counter where the player can see it from the daybed. Use the existing room tick and let it quicken as his wake rises. The ordinary wake meter and its tells still convey the whole state in silence.

**No bump on start.** Settle Clive’s shoulders and heels on the daybed outside the probe’s full sweep. Keep Sylvie’s bench outside the queue rail, shutter segment and trolley travel. Support Matt’s hips, heels and back against the pew, well below the clapper’s lowest swing. Use these poses in both routes per character. Verify each room sits **10 s** at zero bonks and zero wake. Use all four start phases for straight drags. Put the first meaningful turn within view of the resting body. Change pose or obstacles if an idle or straight-drag check fails.

## Evidence Locker

**Only town pickup** · **Tripod leg** (`tripod_leg`), at **(135, 1230)** under Grandpa Doyle’s chicken coop in the west farmyard. Use **104 × 124 logical px** art with a jointed copper strut, torn socket and broad three-toed pad. Put it at an angle with clear negative space under the knee so it reads as a leg at phone size. Give it the ordinary mint glint, name tag and 48 px / one-second catchment. Place the coop body just outside the pickup art box, touching the top of the leg at its edge. The full pocket is clear of the casing, traffic lanes, camera, sneeze and spectator paths. When the leg leaves, the coop settles a few inches onto a timber block with a slight tilt toward the crater. The movement stays scenery. The extra flight out to the farm costs time. The ordinary approach to the kitchen follows the farm road farther north. Use the [town pickup rules](GDD-8-map-collectibles.md) for filing, retry and the fourth star.

| Field Finds | English | Français |
| --- | --- | --- |
| Name / exact memo hint | Tripod leg / `a tripod leg` | Patte de tripode / `une patte de tripode` |
| Description | Grandpa Doyle put it under a chicken coop. For years it was the only working part of the Division. | Grand-père Doyle l’a calée sous son poulailler. Des années durant, c’était la seule pièce de la division encore en service. |
| Status | The Division now fields one bipod. It leans on things. | La division compte désormais un bipode. Il s’appuie où il peut. |
| Locked hint | Look under the coop in the west farmyard. | Regardez sous le poulailler, dans la cour à l’ouest. |

On present-day L1, use the shared coop outside the active approach, resting on the weathered timber block. Add a shallow three-toed print beside it where the leg once stood. The coop, block and print are scenery. L1’s flight route and pickup rules still apply.

One slot per souvenir in the [trophy room](GDD-9-trophy-room.md). Use each English item name as its lower-case ID, and register names and plurals in both languages.

| Item | Catalogue text | Objet et notice FR |
| --- | --- | --- |
| Meteor fragment | The biggest thing ever to hit Grimsby. The drive-in billed it as a coming attraction. | Fragment de météore · Rien d’aussi gros n’était jamais tombé sur Grimsby. Le drive-in l’a mis à l’affiche sous « Prochainement ». |
| Three-colour Martian lens | Red means stop. Green means go. Blue means it’s already behind you. | Lentille martienne tricolore · Au rouge, arrêtez-vous. Au vert, avancez. Au bleu, le Martien est déjà derrière vous. |
| Drive-in programme | The bill promised an invasion. The audience asked for a refund when it actually arrived. | Programme du drive-in · L’affiche promettait une invasion. Quand elle a commencé pour de vrai, le public a demandé à être remboursé. |
| Invasion reel | The last reel. The Martians lose to germs. Vrell won’t let us show it at the Bureau. | Bobine de l’invasion · La dernière. Les microbes ont raison des Martiens. Vrell interdit de la projeter au Bureau. |
| White truce flag | Pastor Matt waved it at ‘the Martians’. We’re not from Mars. We waved back anyway. With the heat ray. | Drapeau blanc · Le pasteur Matt l’a agité devant « les Martiens ». On ne vient pas de Mars. On a répondu quand même. Au rayon thermique. |
| Church bell clapper | Rang all night. Half the Division thought it was last orders. | Battant de cloche · A sonné toute la nuit. La moitié de la division a cru que le bar fermait. |

### Specimen Archive

| ID · name (EN / FR) | Age · height · weight | Description | `at3` | `at10` |
| --- | --- | --- | --- | --- |
| `forester` · Clive Forester / Clive Forester | 38 · 181 cm · 79 kg | Published the first scientific paper to ask a meteor what the hell it wanted. | Brought a handkerchief to his intake interview. It was for us. | Asked the meteor for a second sample. It closed the lid. |
| `van_bell` · Sylvie Van Bell / Sylvie Van Bell | 29 · 164 cm · 58 kg | Got the whole drive-in to leave. Had to promise the invasion would wait until after the credits. | Screamed when she saw the probe. Screamed again when she saw the form. | Put the saucers in the back row. Then had to tell them to stop steaming up the windows. |
| `collier` · Pastor Matt Collier / Pasteur Matt Collier | 57 · 176 cm · 83 kg | Offered sanctuary to the whole town. The congregation arrived with popcorn. | Blessed our probe. Lab 4 says it’s never worked better. | Put a collection plate under the hole in the roof. We paid half. He thanked the Martians. |

| ID | Description FR | `at3` FR | `at10` FR |
| --- | --- | --- | --- |
| `forester` | A publié le premier article scientifique à demander à un météore ce qu’il foutait là. | A apporté un mouchoir à son entretien. C’était pour nous. | A demandé un deuxième échantillon au météore. Il a refermé le couvercle. |
| `van_bell` | A fait évacuer tout le drive-in. Elle a dû promettre que l’invasion attendrait la fin du générique. | A hurlé en voyant la sonde. Puis encore en voyant le formulaire. | A envoyé les soucoupes au dernier rang. Puis a dû leur dire d’arrêter d’embuer les vitres. |
| `collier` | A ouvert son église à toute la ville. Les fidèles sont arrivés avec du pop-corn. | A béni notre sonde. Le labo 4 dit qu’elle n’a jamais aussi bien marché. | A posé la corbeille de la quête sous le trou du toit. On a payé la moitié. Il a remercié les Martiens. |

## Lines

| Cue | EN | FR |
| --- | --- | --- |
| Zib, launch | “Vrell, the special effects are in the car park.” | « Vrell, les effets spéciaux sont sur le parking. » |
| Zib, first approach to the queue | “Is that… Vrell? With a clipboard? Of course it’s Vrell.” | « C’est… Vrell ? Avec un porte-bloc ? Évidemment que c’est Vrell. » |
| Spectator, first heat-ray burst | “Bless you!” | « À vos souhaits ! » |
| Zib, projector sighting | “They spotted me and clapped. They think I’m the 3-D.” | « Ils m’ont repéré et ils applaudissent. Ils croient que c’est moi, la 3D. » |
| Zib, heat-ray sighting | “A war machine just sneezed on me. Does that count as a sick day?” | « Une machine de guerre vient de m’éternuer dessus. Ça compte comme un arrêt maladie ? » |
| Vrell, first clear | “Grandpa Doyle lent me his brass thermometer. I took temperatures from behind. The whole drive-in thought it was a probe.” | « Papy Doyle m’a prêté son thermomètre en laiton. J’ai pris leur température par derrière. Tout le drive-in a cru voir une sonde. » |
| Gazette, two or more sightings | **SAUCER SEEN OVER DRIVE-IN. AUDIENCE DEMANDS SEQUEL.** | **SOUCOUPE AU DRIVE-IN. LE PUBLIC RÉCLAME UNE SUITE.** |
| Cover story, repeat delivery with tripod leg aboard on this run | “Coop loses a leg overnight. Farmer blames a very tall fox.” | « Le poulailler perd un pied dans la nuit. Le fermier accuse un renard très grand. » |
| Clive, mumbles | “It blinked first… I win…” / “It’s only a meteor… meteors don’t unscrew…” | « C’est lui qui a cligné des yeux… j’ai gagné… » / « Ce n’est qu’un météore… ça ne se dévisse pas, un météore… » |
| Sylvie, mumbles | “If the screen comes down… that’s the interval…” / “Row by row… you first, sir, you’re on fire…” | « Si l’écran s’écroule… c’est l’entracte… » / « Rangée par rangée… vous d’abord, monsieur, vous êtes en feu… » |
| Sylvie, sleep-scream | “AAAAH! …Oh, it’s you.” | « AAAAH !… Ah, c’est vous. » |
| Matt, mumbles | “We come in peace… mind the step…” | « Nous venons en paix… attention à la marche… » |
| Matt, biscuit mumbles | “That was the shortbread…” / “Those were for the Martians…” | « C’était le sablé… » / « C’était pour les Martiens… » |
| Pickup, collected on a repeat | “The leg goes in the cabinet. The Division asked if we could lend it a broom handle.” | « La patte va en vitrine. La division demande si on peut lui prêter un manche à balai. » |
| Pickup, missed rotation | “Leave the leg, then. Without it, every egg rolls into the crater.” | « Laissez la patte, alors. Sans elle, tous les œufs roulent dans le cratère. » |

In the first clear’s cover-story row, add “The fever log became Form 7-B. Compliance classified the method.” / « Le relevé est devenu le Cerfa 7-B. La Conformité a mis la méthode sous scellés. » The first-clear comment uses 120 characters in EN and 127 in FR, against a budget of 135 per locale. Check wrapping in both locales. Use the archive-clipping masthead in the Gazette and keep its two-sighting priority. After the first clear, use the tall-fox cover story only on deliveries where Zib picked up the tripod leg during that run. Use the ordinary cover story for other outcomes after the first clear. Present-day Vrell stays at Dispatch.

## Clock, stars and proof

The last screening runs until dawn, **315 s** on the shared clock. **Night owl** requires **190 s** left (**125 s** elapsed, as in 1955, here with tighter approaches). **Delivered** needs all three witnesses before dawn. **Ghost** also needs zero full sightings and zero failed room attempts. The **Tripod leg** star needs the find and all three deliveries in the same shift. Keep the standard room retry choice and filed-find rules.

Use the [1955 baseline in the Grail spec](GDD-12-1122-grail.md#clock-stars-and-proof) and the same [GDD-5 progression checks](GDD-5-progression.md). Start at a **110–125 s** casual independent shift estimate. Make a clean run harder primarily through the two timed room crossings and the tighter flight fuse. Preserve the extra time for a player who loses a room, takes the longer road or goes back for the leg.

| Model | Delivered | Ghost | Night owl | Tripod leg star on detour runs |
| --- | --- | --- | --- | --- |
| Skilled | 85–95% | 55–70% | 70–80% | 85–95% |
| Casual | 75–90% | 35–40% | 50–55% | 70–85% |

Proposed ranges over 20 matched seeds, with no upgrades and a separate set for detour runs. Six-seed gate floors are **5/6, 3/6, 4/6** skilled and **4/6, 2/6, 3/6** casual for the first three stars. Skilled Ghost must beat casual Ghost, with the existing 90% casual ceiling. Target at least **75% skilled / 40% casual** on each route, and give each sleeper a route at **65% casual** or better. Evaluate each leg and the full shift alongside 1122 before setting final clocks. Prove each entry, every room, full shift and the detour with perfect autopilot. Preserve all four beeline checks, room straight-drag checks and the 10 s idle checks. Use real pointer input to wait outside the amber sneeze cone, take the marked shortcut in one clear window, and take Church Lane from both sides. Confirm the wait pocket and Church Lane stay dark across all hazard phases. Check both routes, the projector sighting and the first-clear comment at **375 × 690** in EN, FR and reduced motion. Exact footprints, clocks and bands are provisional until the greybox runs.

## Art and build split

Reuse 1955 period saloons, roads, a projector-facing streetlight fallback and the HUD. Reuse farm dirt tracks, `flight/barn_top`, and the existing camera and charging tells. Retint farm ground to indigo. Indoors reuse the trolley/castors, window, roof hatch, doors, camera mount, laser emitter geometry and antique timber props. Fade the farm’s glow under reduced motion and keep all real light edges and timing visible.

| Proposed keys | Size and reason |
| --- | --- |
| `flight/invasion_screen_top`, `flight/invasion_projector_top`, `flight/invasion_booth_top` | **540×112**, **84×78**, **222×152**. An original painted profile of a hovering copper craft on the screen mesh. Give the projector lens room for the live cone. |
| `flight/invasion_farm_top`, `flight/invasion_church_top`, `flight/invasion_sick_tripod_top` | **260×220**, **320×226**, **276×236**. Pitched roof, steeple and sick copper machine with a cobra hood, heat-ray aperture and bare socket. Compose the short planted braces and hood at retained pivots. Paint the split casing into the crater. |
| `flight/invasion_ice_pack`, `flight/invasion_scarf`, `flight/invasion_3d_glasses` | **56×35**, **96×34**, **32×14**. Distinct ice pack and scarf layers for the sick tripod. White cardboard glasses with desaturated coloured lenses for the front-row silhouettes. |
| `flight/invasion_crowd_top`, `flight/invasion_child_clap_top`, `flight/pickup_tripod_leg`, `flight/doyle_coop_top`, `flight/doyle_coop_block_top` | **78×68**, **42×40**, **104×124**, **130×94**, **72×38**. Use a plain seated child silhouette with hands together. The copper leg doubles as the trophy icon. Reuse the coop and weather the block for L1. Paint the three-toed print into the ground. Compose the queue and rookie Vrell’s clipboard from retained silhouettes. Give the parked machines all three legs so the bare socket reads on the sick one. |
| `room/bg_invasion_farm`, `room/bg_invasion_booth`, `room/bg_invasion_church` | **540×720** each. Faded wallpaper, acoustic tile, dark stone. Keep gameplay silhouettes out of textures. |
| `room/invasion_probe_eye`, `room/invasion_bell_clapper` | **76×72**, **42×124**. Three contrasting lenses in an asymmetrical probe head, and a long pendulum for the bell with an explicit pivot. |
| `room/invasion_geiger_counter`, `room/invasion_biscuit` | **52×32**, **22×16**. Boxy meter with a needle and a shortbread biscuit silhouette for the shed pool. |
| `human/{forester,van_bell,collier}_{head,head_awake,torso,upper_arm,lower_arm,upper_leg,lower_leg}` | Standard humanoid sizes. Give Clive his own lab coat silhouette, Sylvie a swept scarf and Matt a tired face above a low collar. No actor likenesses. |
| `room/{invasion_meteor_fragment,invasion_martian_lens,invasion_programme,invasion_reel,invasion_truce_flag,invasion_clapper_souvenir}` | Long sides **45–70 px**. Original silhouettes carrying the same shape cues on the shelf as in the cutaway. |

| Pass | Owner and handoff |
| --- | --- |
| 1. Flight and level | **Flight/level** owns the marked sneeze shortcut, Church Lane, crowd clearance, camera geometry and tripod timing on the existing cone. Stage the hovering screen craft, sick-machine layers, seated crowd and rookie bark through the existing prop, pose and speech views. Reuse the sampled hazard state for tells and autopilot. Place the weathered block and print at the L1 coop and check the farm approach still works. |
| 2. Rooms | **Abduction** owns all six rooms, the stock timer and sight-line variants, the sleep-scream cue, biscuit shed pool and Geiger tick. Keep the cues cosmetic and run the no-input and direct-drag proofs. |
| 3. Registry and save | **Coordinator** owns the level ID, Dispatch gate and return paths, append-only room, specimen and pickup registries and the 1955 delivery gate shared with 1122. Use the delivery flag for the gnome’s 1953 postcard. Reuse story facts from 1953 without changing the clinic’s Form 7-B tasks. |
| 4. Art and copy | **Art** supplies the original vector pack and tests prop legibility with final scale. **Story/UI** owns the EN/FR memo hints, report priorities, Gazette, line hooks and all three Evidence Locker sections. |
| 5. Tune and play | **Difficulty** owns the per-route and whole-shift runs plus the separate pickup scoring. **Verification** runs the room, map and pickup autopilots, memo-hint and trophy tests, then the real-pointer replay through Dispatch and reload. |

[Art brief](ART_BRIEF.md) · [Pixi view guide](PIXI-MIGRATION.md)
