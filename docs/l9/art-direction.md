# L9 · The night the clock stopped

November 12, 1955. A wet bonnet reflects the courthouse clock. The minute hand is nearly upright. Across Main Street, a cable comes down from the tower to a single porcelain insulator. When the steel car reaches it at 10:04 pm, the clock stops and two lines of fire carry on without the car.

Design handoff for the 540 × 960 portrait game. Asset names below are proposed internal keys. Localized character, dance and venue names belong to the story table. Use unlettered art masters throughout.

## What reads from the air

L3 has little roofs separated by lawns. L4 stacks tall blocks, roof machinery and bright signage. Give the 1955 town a long view down one dark street. The low continuous shopfronts have projecting awnings, the theatre marquee sticks out over the kerb, and the courthouse steps open onto a broad square. Across town the gym roof is barrel-shaped, with the parked trunk car beside its back steps. Let these three landmarks identify the choices before a route pill opens.

| Swatch | Use |
| --- | --- |
| Ink `#1B1433`, rain slate `#303849`, asphalt `#263441` | Round 3–4 px ink silhouette, blue-black undercarriage, storm ceiling. Wet asphalt is the darkest broad shape. |
| Patinated teal `#456F73`, enamel `#719898` | Theatre tubes, diner fascia, painted wheel rims. One muted line per sign and a broken reflection directly below. |
| Tobacco `#93705A`, limestone `#C4A788`, custard `#FFEDC9` | Town masonry, ivory clock disc, shirt collars. Save the palest cream for faces, clock and chrome. |
| Oxide `#995C61`, aubergine `#60516F`, steel `#A7B7CE` | Vinyl booths, prom clothes and the unpainted time car. One bevel and one flat shadow per shape. |
| Mint `#7CFFCB`, amber `#FFC36A`, lock red `#FF635F` | Mint pickup and entry marks, amber imminent launch or other arming tell, red live detection. The vest's muted tomato fabric and the cruiser's glass dome stay inside their ink silhouettes. |

**Phone proof.** At normal camera scale on a 375 × 690 CSS px viewport, each logical px covers about 0.694 CSS px. Measure the *placed* sprite after prop scaling. Target ≥32 CSS px across the clock disc, ≥40 along the time car, ≥25 across a person's shoulders, and ≥22 along a room item's longest dimension. Give identity details at least 3 logical px of ink or a 5 px change in silhouette. Test at 100% screenshot size with the HUD, rain, speech and actual camera crop. A player should be able to point out clock, pickup car, café, dance entrance and all three sleepers without reading, zooming or waiting for an animation.

## Flight plates and registration

All sizes in the next two tables are native logical px. Sprites face north with a shallow south-facing cornice on buildings. Anchors are local coordinates from each sprite's top left. Transform them along with the sprite. Give actionable entries a clear patch for the existing mint marker. The world speech layer goes above map objects and below the saucer.

| Proposed `flight/` key | Size | Paint and anchor |
| --- | --- | --- |
| `ground_storm55` | 540 × 540 | Seamless slate ground with a few open dashes of reflected light. Use the existing road and junction painters for continuous kerbs. |
| `courthouse_square55` | 400 × 300 | Low-contrast sepia paving, four clipped lawn corners, a broad empty centre and clear step approach. Bake into ground. |
| `courthouse55_top` | 360 × 300 | Stepped limestone portico, pitched wings. Cheat the front clock face towards camera, 82 px disc centred (184,112). Paint four principal ticks and eight minor ticks. Eastern stone balcony (270,170), western service portal (56,144). Lightning rod tip (186,18). |
| `contact_lamp55_top` | 64 × 80 | Gooseneck lamp with a doubled ceramic spool centred (42,22). Draw the cable between this pin and the rod in world space. The car carries the matching receiver hook. |
| `streetlamp55_top` | 38 × 52 | Short shepherd's crook, fluted base and custard bulb. Ordinary lamps have plain caps. |
| `cafe55_top` | 272 × 210 | Cream awning, scalloped edge, giant side-on cup above the south bay window (80,177). Transom above the awning and rear service door (216,44). |
| `picture_house55_top` | 236 × 190 | Stepped vertical fin and a projecting wedge marquee with three rows of bulbs. A blank face and a reel pictogram carry the Essex-era theatre nod. |
| `dress_shop55_top` | 196 × 168 | Striped canopy, broad skirt on a wire dress form in the south window. |
| `school55_top` | 312 × 224 | Low brick academic wing with a cream cornice, paired chimneys and broad central steps. |
| `dance_gym55_top` | 320 × 232 | Ribbed gym roof, double doors (194,194). Leave a quiet south wall for the banner. Place the parked trunk car in the adjoining lot as its own sprite and give the back-lot entrance a clear sightline to the trunk. Give the west bandstand hatch and east loading canopy separate approaches. |
| `dance_banner55` | 224 × 48 | Rolled paper ends and two small shell cutouts. Central 188 × 36 px clear. Use a cached EN/FR label from the story table, up to two lines. The shell-and-wave emblem on the gym door also works from a distance. |
| `sedan55_top`, `wagon55_top` | 80 × 150 each | Two-tone pontoon bonnet and tail fins on the sedan, contrasting long roof and square tailgate on the wagon. Wheels and whitewalls peek out sideways. |
| `police55_top` | 80 × 150 | Two-tone patrol saloon, single centred glass beacon and ivory door shields. Code owns the sight cone and its active edge. |
| `trunk_sedan55_top` | 92 × 160 | Dance-lot saloon. Lid raised on the south end, narrow pale lining inside. Trunk latch (46,137), side door (76,79) for route alignment. |
| `pickup_time_car`, `pickup_time_car_coils` | 96 × 172 each | Plan view and a registered blue-white charge overlay. Body occupies x12–84, y4–162, with the extended rear receiver at (48,168). Tyre centres (30,130) and (66,130) match the greybox track spacing. |

### The DMC-12 reference sheet

**Match the DeLorean time machine seen in the 1985 film.** Use the first film's clock-run conversion, including the rear pickup pole and hook. Keep the grille and four headlamps intact. Leave the grille badge and licence plate unlettered. The localized pickup name remains a separate copy choice. [Two-angle drawing study](concepts/time-car.svg)

| View / key | Direction to the vehicle artist |
| --- | --- |
| Flight master and coil overlay, 96 × 172 | Measure the proportions against photographs of the hero car in plan and side elevation. The stainless body is roughly 2.3 times as long as it is wide. Preserve the nearly rectangular nose, four inset rectangular headlamps, low bonnet, steeply raked glass, narrow roof spine and straight waist. Both gull-wing doors are shut on the road. Keep wheel arches in the same longitudinal positions across views. |
| `flight/time_car_display`, 320 × 200 | Dedicated three-quarter front-left master for trophy slot, detail card and close-ups. Show the raised driver-side gull-wing from its centre-roof hinge, its framed window, the open sill and the time-circuit stack visible inside. Choose sufficient elevation to see behind the black back-window louvres into the rear deck. Use this master at both UI sizes. |
| Rear three-quarter and side elevation, reference-only | Inspect the hero car from behind to register the two raised rectangular vent boxes, the central reactor hardware, silver ribbed hoses, tie-downs and cable bundles. Check the wedge, wheels and roof hinge in side elevation. Keep the clock-run hook attached to the aft assembly. |
| Colour and surface | Satin stainless midtone `#A7B0B5`, light brushed facet `#D4D9D9`, cool side plane `#87949B`, rubber/black louvres `#303440`. Use fine parallel brush marks and hairline panel seams in the close-up. Keep three continuous values across the phone sprite. Trace the body-side light bands around the wings. Use ice blue `#90CDFF` with a narrow white core when charging. Inside, three small bands of red, green and amber suggest the instrument displays. |
| Close-up checks | In a front-left overlay compare wheel centres, bumper corners, windscreen base, door hinge and roof height against the reference. In the top view check rear-vent spacing, visible louvres, external roof/side cabling and reactor placement. Select a still from the lightning run for the removable hook. Review both silhouettes with the blue light off and at actual display size. |

Use the restored hero car to resolve the body and conversion hardware, and the 1985 clock sequence for the precise dress of the pole, the active side coils and the twin tyre fires. The production notes identify the vents, dashboard and side coils among the conversion's defining pieces. [Petersen Automotive Museum hero-car reference](https://kumquat-disc-ty3a.squarespace.com/vehicle-spotlights/1981-delorean-back-to-the-future) · [1985 production notes](https://www.backtothefuture.com/movies/production-notes-1985)

The L2 cameo, `flight/gullwing_car`, is a parked 144 × 80 east-facing car with an open wing. The L9 car runs nose-first with a closed door, a visible catch hook and a clear rear axle. Place the contact line to cross the lane at the simulation's crossing, then place the receiver tip at the contact coordinate at the deadline and derive the tyre span from the same transform. Use the three-quarter display master for the town-room slot, with the charging effects off.

| Proposed `flight/` key | Size | Use |
| --- | --- | --- |
| `usher55_body`, `dancer55_body` | 66 × 78 each | Three-quarter south-facing map figures as in the town pickup rigs. Usher has sloped coat shoulders and a ticket wallet. Dancer has a circle skirt and pale gloves. Swap clothing shades between repeats. |
| `usher55_head`, `dancer55_head` | 42 × 40 each | Peaked cap or broad rolled fringe, near ear and cheek. Head centre sits at (33,22) in the body box. Leave the face clear for retained pupils, lids and mouth. |
| `marshal55_torch`, `dance_spot55`, `worklamp55` | 32 × 24, 52 × 60, 52 × 60 | Torch fits the usher’s hand for the marshal. Dance lamp has a barn-door hood, work lamp a wire guard. Fit fixtures to the simulation source. Reuse a crowd head and collar for the café watcher. Fallback uses a barrel and handle or disc on yoke. |
| `storm_cloud55` | 540 × 200 | Broad low banks and soft wisps. Park along the top edge or use as low-opacity cloud shadow on open paving. |
| `rain_stitch55` | 144 × 144 | Sparse seamless clusters of short blue-grey diagonal dashes, transparent gaps on every side. |
| `tower_bolt55` | 96 × 224 | Cold ivory fork on transparent ground. Main branch ends at (48,224) on the conductor. |
| `tyre_fire55` | 24 × 96 | One wheel's tile, running along the long axis. Broken plum char, copper tongues, a few cream tips. Keep gaps in the silhouette and match the long-axis seam. |

Use the pickup face-layer approach for every visible person on the map. Stagger phases by instance. Blink for ~120 ms every 3–5 s, slide the gaze towards the passing car and back, then open the mouth into a yawn every 8–12 s. Turn the head a few degrees with the eyes so a glance reads on the phone. Give the usher a slow nod and the dancer a small shoulder lift. Keep all map people on animated layers. Reduced motion holds the pose with an occasional slow blink.

## The run to 10:04

| Sim beat | Picture on Main Street |
| --- | --- |
| Waiting | Pale clock, dark hands. Place each hand on the hub and turn it with the shift clock. The moving pickup owns the normal mint glint and minimap diamond. Its lock arc stays attached to its eligibility and progress. A narrow ink cable with a porcelain sleeve sags from tower to lamp. |
| About to roll | Light rain begins at 10:03:48. The car rolls at 10:03:53. An amber tell appears at the car on the authored warning beat. A lamp filament warms. Keep the cue visible through the rain. The road ahead stays clear to read. |
| Accelerating | The blue-white side-coil overlay rises with actual speed. Give the time circuits a restrained cabin glow. At the 88 mph event, show one ivory four-point sparkle at each rear corner. Its short horizontal pair distinguishes it from the persistent mint pickup glint. |
| Contact at 10:04 | The tower and cable warn amber during the final two seconds. From one simulation timestamp, the hook meets the cable, one fork touches the rod, the hands settle at 10:04 (hour hand just past ten, minute hand on minute four) and an uncaught car disappears. Use one low-strength cool wash, roughly 80 ms in and 220 ms out. The clock face remains readable. A captured car leaves in the beam. At 10:04 the tower still takes the strike, with an empty road beneath. |
| After the miss | Leave two world-anchored, continuous runs of broken flame along the car's final straight approach, one under each tyre. Keep the char and visible flame for the rest of the shift, including after a room visit or sighting. The tracks lie at x = 802 and 838, from y = 990 to 604. Draw above asphalt, below gameplay overlays. The saucer can cross both. Their edges have irregular gaps, their light has no radius and no alert arc attaches to the craft. |
| Reduced motion | Same event times, positions, marks and persistent tracks. Hold the clouds and rain tile still, use a steady restrained engine tint, show the bolt once as a held low-contrast contact mark and omit the whole-screen wash. |

Build the sagging tower feed once. Stretch the road wire along its straight collision capsule between (675,600) and (965,600), with the hook touching at (820,600). Bake wet highlights, lamp reflections and plaza paving into ground chunks. Use a scrolling tiled rain sprite, a single cloud plate, a prebuilt bolt, a retained wash and two preallocated tiled strips for the tracks. Rotate and size each strip to the final tyre segment. A few existing pooled sparks can mark contact. Reuse a unit tick and two hand sprites for the clocks. A wind cue can be a loose cable tail or ribbon that leans in the wind. Puddles are open strokes and fuzzy reflections. The cones draw above the scenery. The strike leaves detection and steering alone.

## Three side-view sets

The drawings use one 540 × 960 frame each. The playable cutaway lies between x = 20 and 520, y = 133 and 846 (`LEFT_WALL`, `RIGHT_WALL`, `CEILING`, `FLOOR`). Keep the HUD margins quiet. The sketches are portrait composition studies. Use the world registration table below for actual greybox placement in 740 × 700 start rooms with a branch above and another to the side. Mint brackets indicate the direction of a branch. The selected route gets the live marker.

**Clock ledge.** The inventor's white hair hangs a little over the left end of the ledge. A giant clock takes up the wall above him. The exposed gear pair sits across the clock-room opening. Wind lifts a strip of tape on the overhead lightning cable. [Clock ledge layout](concepts/clock-ledge.svg)

| Piece | Placement in logical px |
| --- | --- |
| Support and sleeper | Flat stone ledge at (28,664), 322 × 72. Use a left-head reclining pose, neck near (104,634), ankles pointing right. Put the slab's collision top on its pale lip. |
| Clock, gears, cable | Clock plate (36,248), 260 × 260. Gear hubs (331,370) and (402,426), drawn at diameters 120 and 66. Cable cleats (44,187) and (462,224). Dress the slack behind the figures. |
| Exits | Up towards Clock Balcony through x = 304–464 at y = 133. Right towards Service Door via x = 520, y = 455–655. |
| Souvenir seat | Service shelf (362,724), 148 × 24. Centre x = 436, bottom y = 724 for the capacitor or suit. A replacement clock hand can rest here too. |

**Café booth.** A black pompadour and jacket collar rise from a custard vinyl booth. The long empty service counter, round stools and glowing jukebox identify the room even with the art text layer off. [Café layout](concepts/cafe-booth.svg)

| Piece | Placement in logical px |
| --- | --- |
| Support and sleeper | Booth at (28,638), 300 × 192. Its long cushion starts at y = 726. Recline the bully left-to-right, neck near (103,696), head beside the high back. |
| Furniture | Counter (332,622), 178 × 120. Pie case (420,558), 84 × 64. Stools at (350,758) and (438,758), each 56 × 80. Jukebox (40,420), 92 × 160 against the rear wall. |
| Exits | Up towards Awning Transom at x = 246–446, y = 133. Right towards Kitchen Door on x = 520, y = 284–504. |
| Souvenir seat | Free stretch of counter, centre x = 373, bottom y = 622. One board or folded flyer fits beside the pie case. |

**Dance parking lot.** Catch the story beat as the seized trunk latch gives way. The opening pose shows the loose lock on the bumper, the raised lid in profile and the unconscious bandleader on the lining. His face, bow tie and hands are always visible. His suit has a small guitar-pick pocket square. A separate guitar can be carried away. [Dance lot layout](concepts/dance-trunk.svg)

| Piece | Placement in logical px |
| --- | --- |
| Car and sleeper | Side-on rear of a long sedan at (24,638), 336 × 194. Trunk bed x = 43–349, top y = 692. Lid at (26,490), 88 × 160, hinge (54,648). Recline the bandleader with neck near (118,662), feet to the right. Draw lining behind the doll and keep the near rim below it. |
| Dance beyond | Gym doors (314,398), 180 × 196. Three dim cream/lilac rectangles behind the panes pulse gently on the beat. A painted treble clef on the door and a ribbon tell the same story when the light is still. |
| Exits | Up towards Bandstand Hatch above x = 210–410 at y = 133. Right towards Loading Canopy at x = 520, y = 596–816. Lit public gym doors remain closed. |
| Souvenir seat | Amp case (369,742), 122 × 84. Centre x = 430, bottom y = 742. Lay the guitar across the case or place the folded vest there. |

For each room, fit the full ragdoll on its support, then run the existing ten-second idle spawn check. Keep the souvenir reachable by a small deliberate detour from the sleeping figure. Each sketch illustrates the surface and silhouette. The scrolling routes have six individual item seats.

### Route registration for the scrolling build

Use these world coordinates from the [level design](level-design.md#abduction-cutaways). Item positions are (centre x, bottom y). Keep a clear view from the approach pocket to the item and its support.

| Shared set / settled chest | Upper branch and item | Side branch and item |
| --- | --- | --- |
| Clock ledge (180,515), support top 580 | Clock Balcony. Ceiling x488–708 into riser, final aperture x500–700. Capacitor on insulated shelf at (460,−325). | Service Door. East branch y245–515, exit y335–545. Suit on dry bench at (910,510). |
| Café booth (175,505), seat near 590 | Awning Transom. Ceiling x465–685 into sash gallery. Board on display rack at (405,365). | Kitchen Door. East branch y230–530, exit y260–470. Flyer on tray at (1180,490). |
| Trunk (210,525), luggage top 590 | Bandstand Hatch. Ceiling x480–700 into stage rigging. Guitar in open case at (440,410). | Loading Canopy. East branch y255–535, exit at x1520, y290–505. Vest on crate at (1170,520). |

The café sketch stretches the figure along the booth to check silhouette clearance. In the playable booth, slump him against the high back in a seated pose. For flight, use the level's six world ring positions and braking pockets. Place features to face their ring. Keep the roof cues visible from the approach.

### Room production keys

Prefix every proposed key here with `room/`. Three 540 × 720 deep-interior backdrops fit the playable panel, following the L7/L8 convention. Keep wet masonry, diner tile, gym brick and asphalt on the plates. Mount all fixtures, furniture and opening trims separately.

| Key | Native size | Silhouette / missing-art primitive |
| --- | --- | --- |
| `bg_tower55`, `bg_cafe55`, `bg_dance_lot55` | 540 × 720 each | Limestone banding, cream tile with a teal dado, brick above a wet kerb. Fallback uses two quiet bands and a few seams. |
| `tower_ledge55` | 322 × 72 | Flat pale lip over dark corbel blocks. Fallback is a capped rectangular slab. |
| `tower_cable55` | 426 × 56 | Drooping ink cord between porcelain pads. Fallback is a shallow curve and two cream ovals. |
| `booth55` | 300 × 192 | Scalloped high back at the head end, flat vinyl cushion. Two rounded blocks preserve the seat height. |
| `counter55`, `stool55` | 178 × 120, 56 × 80 | Steel edge over teal counter, disc of vinyl on one bright pedestal. Fallback uses a capped box and an oval on a post. |
| `jukebox55`, `pie_case55` | 92 × 160, 84 × 64 | Lit horseshoe and three grille bars, glass trapezoid around one large pie wedge. Use these shapes at full silhouette size in fallback. |
| `trunk_body55`, `trunk_lid55` | 336 × 194, 88 × 160 | Side cutaway of a tail fin, wheel, wide dark lining, exposed latch. Lid stands on its hinge at local (28,158). Primitive car uses a pill-shaped body, wheel, flat bed and separate tilted lid. |
| `gym_doors55`, `amp_case55` | 180 × 196, 122 × 84 | Two tall panes with push bars and a shell motif, plus a squat speaker case with two bright corners. Fallback uses double rectangles and a grille disc. |
| Existing art | Native sizes | `clock_face_back` 260 × 260, `gear_big` 240 × 240, `gear_small` 120 × 120, `shelf` 160 × 24, `exit_roof_hatch` 160 × 70, `exit_skylight` 200 × 80, `exit_window` 160 × 200, `door_frame` 120 × 220. Fit to the rectangles above. Use an opaque backing behind the antique dial. Leave the separate balcony opening clear. Show sky between the lot and the gym landing. |

### Sleeper model sheets

Use one human rig each for `doc`, `buff` and `marvin`. The 21 proposed keys are `human/<rig>_<part>`, the Cartesian product of those three IDs and the seven suffixes below. Set the target's explicit head key so a localized short name can change freely.

| Part suffix | Native size | Registration |
| --- | --- | --- |
| `head`, `head_awake` | 70 × 80 each | Neck at bottom centre. Match both outlines and pivots. Change lid, brow and mouth. |
| `torso` | 80 × 120 | Neck top centre, pelvis bottom centre. Broad lapels stay within the body. |
| `upper_arm`, `lower_arm` | 26 × 60, 24 × 60 | Shoulder and elbow at top centre. Round the ends for both near and far limbs. |
| `upper_leg`, `lower_leg` | 32 × 70, 30 × 72 | Hip and knee at top centre. Include shoe in shin. |

| Sleeper | Asleep silhouette | Awake head / chip cue |
| --- | --- | --- |
| Inventor | Three enormous white hair tufts, long oatmeal lab coat, rolled sleeve with dark cuff. | Brows lift separately under the three tufts. Put charcoal behind the hair in the portrait crop. |
| Bully | Low black quiff, broad jaw, turned-up aubergine leather collar, cream T-shirt, engineer boots. | One eye snaps wider than the other. Keep a pale plane along the quiff against the dark room. |
| Bandleader | Black musician in a plum band jacket with satin cream lapels and a bow tie, swept wave with a shaved part. His loose wrist still curls around an imaginary guitar neck. | Raised brow and a little O mouth. Preserve the hair wave in profile and give the cheek a warm lighter plane against the collar. |

Use the 70 × 80 sleeping head as the HUD/choice portrait master. Preview the three chips together at their actual UI size. The report already fits the captured joint pose into the 176 × 176 photo opening at (22,22) in `ui/id_photo_frame` (220 × 260), using the awake head when available. The fallback head keeps each signature silhouette (tufts, quiff or wave), with joint-aligned capsule limbs and a contrasting collar. The report and the room should both use those cues if a part is missing.

### Loose souvenirs

Each proposed `room/` master rests on its bottom edge with a transparent surround. Leave the top clear for a grasp and keep the identifying feature visible in the trophy-room crop. Give every active item a shelf slot and EN/FR title and description. The moving car is L9's one town pickup, with its own memo hint and Town Room slot.

| Key | Size | Read at 1× and primitive fallback |
| --- | --- | --- |
| `retro_skateboard` | 58 × 26 | Upswept purple deck, wide yellow diagonal stripe, two separated cream wheels below. |
| `cherry_guitar` | 62 × 34 | Honey double-lobed electric body, black pickguard, long cream-tipped neck at a low diagonal. |
| `flex_capacitor` | 42 × 38 | Thick lunchbox frame surrounding three bright tubes that meet at one hub. |
| `hazmat_suit` | 46 × 40 | Folded yellow coverall, large dark hood window, two loose glove ends. |
| `puffy_vest` | 46 × 38 | Tomato puffer vest with two open armholes and three bold horizontal baffles. |
| `clock_flyer` | 40 × 44 | Folded cream sheet, clock-face woodcut occupying two thirds, torn tab. A localized headline fits on its enlarged trophy detail through code. |
| `clock_hand` | 54 × 26 | Charred clock hand with an open brass hub, jagged tip and a single chip of cream enamel. |

The six route seats follow the level designer’s geometry. The [story table](story-and-names.md#51-route-to-souvenir-map) supplies item keys and localized names. Its draft café and dance assignments differ for the board, vest and flyer. Reconcile those copy rows with the approved route geometry. The struck hand is an alternate for one route and can also dress the tower after the strike. A collectible hand needs its own trophy entry.

## Build ownership and sign-off

| Owner | Delivery |
| --- | --- |
| Flight artist | Flight plates, both DMC-12 masters and coil overlay, clock registration, weather and track tiles, crowd clothing and head layers. Supply a front-left trophy comparison and a phone-size running-car proof against the hero-car reference. |
| Room and character artist | Three backdrops, room prop masters, three seven-part sleeper rigs, seven souvenir silhouettes. Supply head chips, torso poses, and a bottom-aligned item strip on the intended support colours. |
| Flight implementer | Ground chunks, anchors, car poses, pickup glint/lock, shift-clock hands, storm, contact and persistent track state. For every missing manifest image, build its primitive once through `artSprite` or a `paintedTexture` fallback. For buildings use the clock, cup, marquee, dress form, academic steps and gym shell on simple roof blocks. For cars use a divided roof, fins or beacon, and the low steel wedge, black louvres, paired rear vents and side coils for the pickup. Give the close-up fallback its raised roof-hinged door. Missing weather uses a prepainted fork and broken wheel strips. Missing figures use cap/skirt, two eyes and a jointed head. |
| Abduction and UI implementers | Support lines, selected exit, clear sleeper face, six reachable souvenir positions, stash art, HUD chips, captured pose, town slot, fallback poses and localized labels. |
| Coordinator / story | Resolve internal IDs and six item assignments with the level and copy tables before appending the manifest. Check actual cutaway and map approach at phone size in both languages. Add the new SVGs to the contact sheet through the existing workflow. |

**Render budget for the build.** Aim for 60 fps with the current DPR cap of 2. Budget L9 steady flight at or below the higher L4/L7 average draw-call count measured on the same GPU, e2e build, viewport and throttle. Allow at most **two additional WebGL draws** over that reference in a sampled contact frame. These are acceptance targets. Measure the rainy approach and post-strike road as well as the idle spawn. The five-second average can hide the single strike, so inspect its frame separately. Target p95 main-thread work under 16 ms at 6× CPU throttling and report observed fps as well as draw calls.

Stage one normal-blend weather group and at most one contiguous additive-effects group. Reuse the existing particle pool. Start with up to four animated map figures visible at a time and cull outside the camera. Prebuild clothing, eye and mouth layers. Change transforms, texture coordinates, alpha or tint during play. During a frame, L9 effects should create zero display objects, rebuild zero geometries and allocate zero objects. Keep lettered signs cached until language changes. If texture switches exceed the budget, bake fixed façades into the map chunks before cutting landmark or tell detail.

For the build handoff, run `THROTTLE=1,6 PAGES=flight=4,flight=7,flight=9 node scripts/pixi/bench-frames.mjs <e2e-url>` and inspect batch breaks with `scripts/pixi/batches.mjs`. Capture the warning, successful lift, missed crossing, panned-back tracks and one crossing with reduced motion. Check all three rooms with full and missing art, at 375 × 690. Run the spawn, souvenir-reach and difficulty checks against the actual routes.
