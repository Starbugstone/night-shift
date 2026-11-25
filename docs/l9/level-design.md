# L9 · Temporal Dispatch, 1955

## Work order

Saturday, November 12, 1955. Temporal Dispatch sends Zib to the town
square at **10:03:40 p.m.** Collect three sleeping witnesses in any order. A
time car is about to make a run up Main Street. Lead it and match its pace to
beam it aboard before lightning hits the courthouse clock at **10:04:00 p.m.**

L9 (`level9`) is the first paid Temporal Dispatch order after **Prior Contact**.
Any L8 clear opens it, including an existing clear on reload. Use the next
Work Orders card and the existing report-to-memo handoff. Legacy access still
covers L3–L7. Retain the L8 replay and the player's rank, Glorbs and upgrades.
This order takes the first playable Dispatch slot proposed for Cold Storage in
[GDD-7](../GDD-7-eras.md). The 1953 docks, 1122 and 2199 remain future dates.

After Echo's patent review, the Bureau audits Krix's files and finds another
prior-art claim bookmarked **10:04 p.m., 1955**. Zib gets a first assignment
as paid staff: reconcile the date against three people who were there. Vrell
co-signs from Basement B-4. The town clock verifies the timestamp even if
the car comes home. The first-clear line can log the clock as the Bureau's
first witness that was right exactly once. The L2 Spin City cameo gives the
missed car a possible destination. Use original art, music, voices and
dialogue. The inventor, bully, bandleader and time car are working labels
for the naming pass. [Story and names](story-and-names.md)

| Shift rule | Initial values |
| --- | --- |
| Shared shift clock | **260 active seconds**, one real second per local second. Start at 10:03:40 p.m., strike at elapsed 20 s, close at **10:08:00 p.m.** |
| Deadline | Dispatch closes the extraction window before the post-strike street sweep. Show the local time to the second in flight and rooms, a remaining-time dial, and a closure warning in the last 30 s. Keep the night palette. |
| Clock and recovery | Flight, room play, lock animations and the usual spotted interval spend time. Memo, pause and room retry choice follow the existing pause behavior. A sighting returns to the normal last-delivery checkpoint. Room retry keeps the chosen entry and the clock already spent. |
| Delivered | All three specimens out before the deadline. The last extraction immediately files the report. |
| Ghost | Delivered with zero full flight sightings and zero failed room attempts, using ordinary deep-shift failure accounting. Partial Suspicion is allowed. |
| Night owl | Delivered with **75 s left** (elapsed **≤185 s**, 10:06:45 p.m.). The detour, sightings and retries spend their usual time. |
| Fourth star | Delivered with the **time car** picked up in the same shift. Room souvenirs belong to the trophy room and leave scoring unchanged. |

A 20-second strike deadline offers the car a distinct opening window. A further
four minutes gives a first-time player space for room decisions and a retry.
If a player enters a room before 10:04, the street event continues on the same
clock. Both the straight-to-rooms journey and a clean four-star replay must
work with zero upgrades.

## Flight map

Use **1760 × 2240 logical px**, north up, with the usual 540 × 960 camera.
Coordinates in this section are world centres unless given as spans. Start at
**(1050, 2010)** on the residential verge. The courthouse is the north
landmark, the café and its awning anchor the west side, and the theatre and
school form the east side. Show a dance banner on the school and an original
double-feature marquee on the theatre. Keep people and vehicle silhouettes
readable in rain at 375 × 690 CSS px.

| Landmark | Position and footprint | Approach |
| --- | --- | --- |
| Courthouse and clock | (820, 310), 360 × 300. Square spans x490–1150, y455–805. | Main Street meets the square at the working lamp. Use either flank past the cable ends. |
| Café | (390, 1100), 272 × 210. Booth windows face the southwest pavement. | West Alley leads into the delivery yard. The shorter awning approach crosses the café watcher's sidewalk. |
| Movie theatre | (1270, 820), 236 × 190. | The marquee is a landmark on the eastern loop. |
| High school and dance | Gym at (1380, 1320), 320 × 232. A sedan sits in the rear lot, between the two rings. | The eastern service lane reaches the loading canopy. The direct approach from the residential verge crosses the dance beam. |
| Residential edge and turnout | Low roofs behind hedges below y1830. West turnout centred at (650, 1550), with an open pocket of at least 130 × 150. | The spawn-to-turnout route bends near (650, 2010). Keep the corner clear of poles and roof props. Paint an old kerb arrow northbound at the merge. |

Road centre lines and approximate widths:

- **Main Street** runs north on x820, y540–2240, width 200. The last 70 px
  becomes square paving beneath the wire. The car stays on this centre line.
- **Courthouse Row** runs east–west on y755, x200–1730, width 140. Keep both
  flanks of the courthouse within reach of open square paving.
- **Market Street** runs east–west on y1140, x530–1730, width 150.
- **West Alley** runs north on x590, y755–2060, width 120, with a driveway spur
  west into the café rear yard and a turnout between it and Main.
- **School Lane** runs on x1640, y755–2130, width 140. A service spur follows
  y1545 from x1250 to the lane. Residential Cross runs on y2050 from x420
  to x1710. Leave at least 90 px of manoeuvring space around turns and
  check kerbs with the shared junction renderer.

| Specimen | Recommended ring | Shorter ring |
| --- | --- | --- |
| Inventor | **Service Door** at (620, 350), `inventor_service`. Approach from the west of x620. | **Clock Balcony** at (1040, 330), `inventor_balcony`. Approach along the east flank. |
| Bully | **Kitchen Door** at (235, 1020), `bully_kitchen`. Loop around the café's west wall. | **Awning Transom** at (430, 1245), `bully_transom`. Cross the sidewalk after the watcher turns. |
| Bandleader | **Loading Canopy** at (1570, 1520), `bandleader_loading`. Come north up School Lane. | **Bandstand Hatch** at (1250, 1550), `bandleader_bandstand`. Approach from the west or skirt the spotlight's tip. |

Keep 1 s of safe hover and braking space at every ring, at least a 60 px
radius around its centre once on the authored approach. Labels face away from
the nearer route and the busiest roadway. Confirm separation across both
languages at phone size. Allow the slower branches to cost enough travel or
room time that the faster entries offer a real par advantage.

### Detectors, wire and light

These are greybox values. Angles use +x east and +y south. All detection
uses the shared fuse, initially **1.2 s** with zero upgrades. Give each
fixed source an era-appropriate silhouette and a source name for spotting.

| Source | Starting placement and behavior |
| --- | --- |
| Lot marshal's flashlight | At (1030, 1940), range 330 px, base −2.32 rad, half-angle 0.38 rad, gentle sweep ±0.07 rad. Reuse the camera cone geometry with a flashlight source. It covers the straight line to the parked car. The spawn verge and the west turnout are outside the cone. |
| Dance spotlight | At (1400, 1550), range 465 px, base 2.32 rad, half-angle 0.37 rad, gentle sweep ±0.05 rad. Reuse the fixed camera cone with a dance lamp skin. It crosses the diagonal from spawn to the Bandstand Hatch. Both rings have safe hover pockets. |
| Courthouse work lamp | At (820, 755), facing south, range **540 px**, half-angle 0.52 rad. Reuse the steady cone. It occupies the obvious straight route up Main to the clock and the late part of a pursuit. Both flanks have a continuous way around it. |
| Police cruiser | Single era sedan, 150 px/s, 240 px headlights, 0.32 rad half-angle, no siren or beacon radius. Loop clockwise around the theatre on (1140, 755) → (1605, 755) → (1605, 1030) → (1140, 1030). Put the east crossing's holding point below y1140. |
| Café watcher | Counter regular at (555, 1100), range 190 px, cone half-angle 0.32 rad, turns between south-southwest and east every 3.2 s with the standard 0.45 s amber preview. The window source and broad sidewalk give the player a place to read the turn. |
| Lightning cable | Ordinary wire capsule from (675, 540) to (965, 540), with posts and matching drawn geometry. Use x≤620 or x≥1020 to clear the ends. It stuns on collision at any time. The car's forward receiver reaches (820, 540) while the car centre is at (820, 600). |

Use the normal soft ambient lamps around the square, marquee, café windows
and school doors. A cream-green marquee glow, sidewalk reflections and pairs
of dance-goers near the gym doors can dress the map. People who detect the
player have an actual cone with a hard edge. Ambient pools soften out into
the ground and have no gameplay effect. Keep the road markings and spawn
exit clear of clutter.

The storm gathers visually. Flags lean first, light rain begins around
**10:03:48**, and a quiet amber pulse marks the *tower and cable* during the
last 2 s before impact. At 10:04, use a single local strike and a soft wash
with a brief tail. Reduced motion uses a steady tower highlight and retained
road marks. The flash leaves steering, visibility, Suspicion and wake
untouched. A global detector would make the safest route depend on a
whole-map cover rule and could punish a player's timing while the camera is
elsewhere. The three readable cones and wire put the challenge on the
obvious line from the start. Tune those placements until the ordinary flight
beeline is stopped at all four tested delays. Keep rain low contrast and
keep active detector outlines visible over its reflections.

## Time car

### Opening run

| Elapsed | Local time | Player sees and does |
| --- | --- | --- |
| 0 s | 10:03:40 | The camera frames the verge and the car bay at **(820, 1740)**. Headlights and a steady countdown chip show the approaching launch. The minimap uses the town-pickup diamond. A short Zib line and the kerb arrow point to the west turnout. |
| 13 s | 10:03:53 | The car launches north at **70 px/s**. The countdown switches from launch to the strike deadline. Hold ahead at the turnout before merging. |
| 15 s | 10:03:55 | At **(820, 1600)** the receiver clears the bay and the moving mint ring opens. The car begins accelerating at **52 px/s²**. The recommended intercept follows the ring from the west between y1560 and y1370. |
| 20 s | 10:04:00 | The tower takes the strike and its hands stop in either outcome. An uncollected car's centre reaches **(820, 600)** at **330 px/s**, its receiver contacts the cable and the car vanishes. Two fire trails stick to the roadway. Zib's HUD clock keeps running. |

Use the existing steering, the L8 moving-ring presentation and the town
pickup's fill and drain pattern. A bigger ring with a **64 px centre
tolerance** (80 px drawn radius if retaining the 0.8 ratio) and **0.85 s of
lock progress** gives a thumb margin during acceleration. Check **relative
velocity** in both axes, initially ≤**55 px/s** between car and saucer.
Absolute saucer speed still uses the normal flight cap of 430 px/s. In a
flat chase a stationary saucer misses the relative-speed threshold even at
the car's slowest. A player can dip into the ring from ahead, then follow it
with a small held drag. Use the existing 2× drain on a missed hover. The ring
is mint from activation, with segmented progress only while eligible.
If the ship is in the ring but moving too differently, an unobtrusive
`Match speed` prompt explains the missing fill. Stun and specimen-ring
priority apply. A sighting interrupts the lock.

The 70 px/s rollout covers 140 px in 2 s. The acceleration phase covers
1,000 px in 5 s. It puts the car at y1451 around t=16.4, with speed about
143 px/s, comfortably below the saucer cap. From the verge the approach via
(650, 2010) to (650, 1550) is about 860 px before braking and merging. Flight
models can therefore include starts delayed by as much as 8–9 s. These are
kinematic estimates. Pointer lag, camera movement and detector clearance
need the greybox proof below.

The west approach has an open waiting pocket, then a window in which the
entire lock area clears the marshal cone. The late run towards the courthouse is
more exposed. Telegraph an interception, since trying to follow the bumper
from behind the car's starting position leads into the marshal's flashlight.
The first low-pressure exercise is watching the two-second rollout from
outside the cone, with the normal three-specimen run as a
fallback. Put the instruction in the memo so it can be read before the clock
starts. Both localisations must use the same pickup phrase as their
`memoHint`: working copy **“time car”** / **« voiture temporelle »**.
Suggested instruction: *“Optional: the time car leaves Main Street at
10:03:53. Take the west turnout, then match its pace before the clock
strikes.”* / *« En option : la voiture temporelle s’élance dans la rue
principale à 22:03:53. Passez par le renfoncement à l’ouest, puis suivez-la à
la même vitesse avant que la foudre frappe l’horloge. »* The Zib line can be
as short as *“West turnout. Meet it up the road!”* Use the existing
`readSeconds()` and bubble layers.

### Outcome and ownership

- On collection, log the ordinary town collectible ID `time_car` and play
  one mint beam lift and pickup chime at its live position. Control stays
  active. The car disappears immediately. The clock still takes the strike
  at 10:04. The wire stays in place and the road has no fire trails.
- On a miss, resolve the car at the cable on the first clock crossing of
  20 s. It leaves two soft orange-and-charcoal tracks aligned to the rear
  tyres, initially x794 and x846 from y990 to y654. The flames settle into a
  low glow and scorch marks for the rest of the shift, including after a
  sighting or room visit. Use retained
  decor under the world objects. Entering the tracks adds zero Suspicion,
  stun or collision.
- A lock must finish **before** the strike. At exactly 20 s the deadline
  takes priority. Crossing during a room, room transition or spotted
  interval still resolves the event. If the player returns to flight after
  missing the strike, show the existing aftermath and the missed pickup
  status without replaying the flash. A room may show a small local lighting
  cue if it is active when the strike happens.
- One event per shift. Leaving the ring drains partial progress and the
  player can rejoin before 10:04. A checkpoint, room retry or renewed flight
  scene keeps the outcome and time already spent. A fresh shift offers a
  fresh chase. Collection never creates a checkpoint, grants grace, clears
  Suspicion or starts an abduction.
- Keep `map.collectible` as the one identity and catalogue entry. Make the
  launch anchor in that definition immutable and sample the moving centre
  separately. `DeepRun` owns the event outcome and advances it by shared
  shift elapsed time, including while outside flight. `DeepFlightSim`
  applies a lock only during live control and after checking sightings.
  Read the same elapsed-time sample for lock geometry, the mint ring, the
  minimap and pickup effects. Reuse the ordinary pickup summary and save
  field. Filing after a deadline loss still gives the catalogue find if
  collected. A later miss preserves a filed find, and quitting without
  filing discards the run's cargo.
- The report shows the current shift's collected or missed row. Add the
  car to the Town room of the trophy room, with its silhouette, names,
  descriptions, status and clue in EN and FR. Keep the fourth-star label
  derived from this same pickup. The 96 × 156 road sprite and the matching
  static trophy silhouette share the same outline. [Art direction](art-direction.md)

A stationary interception pad would have been easier to implement and
learn. It would remove the need to beam the car while it speeds down Main,
so this design uses a relative-speed variant of the existing hover. Keep
the rules local to the timed collectible and share the lock math where the
interfaces fit. The chosen tolerances and path are provisional until tested
with the normal pointer controller.

## Abduction cutaways

Room coordinates below are local world px, distinct from flight positions.
Use each pair's shared start at about **740 × 700** with a branch above and
a branch to the side. Coordinates for spawns are target **settled chests**;
author the actual neck position and limb pose against the supports. Floors
and walls use the existing interior builder. Prompt once from the safe
holding space, and let the obstacle demonstrate its motion before the
player commits. Each branch should take roughly **16–36 s** once understood,
including the exit settle. Start with at least 20 px of body clearance from
solids on the planned line and 170–220 px open exits. Deliver via the normal
chest-in-zone and release rule.

### Inventor · courthouse clock

The inventor dozed on the sheltered ledge waiting for the storm. Start
chest around **(180, 515)**, with a settled lying pose on a broad canvas
pad atop the ledge (support top y580). The clock casing at **x345–550,
y405–585** forces an initial lift around its top rather than a direct
eastward drag. Hold at **(300, 285)** to see the wind ribbons and cable
motion through the branch opening.

- **Clock Balcony.** Open the room ceiling at x488–708 into the riser
  (x390–740, y−620–0). A bounded side draft in the first section
  (x468–705, y−235 to −35) nudges the body east at about 105 px/s². The
  lightning cable end is a slow swing, about ±0.35 rad at 1.2 rad/s, with
  its effective tip around y−265 beyond the draft. Teach the draft first
  on the wide lower landing. An L4-style gear with an approximately
  110 px diameter sits left of the line near (500, −410). Leave a rest
  pocket at about (606, −345) and a 200 px clear balcony aperture across
  x500–700 at the top. No timed live electricity in the cutaway. The
  **spare flux capacitor** sits on an insulated shelf near x460, resting
  at y−325. Collect it by dipping to the left from the pocket, then
  returning to the climb.
- **Service Door.** Continue into the winch gallery (x740–1500,
  y0–700) through y245–515. A drip tray sits low under the preferred
  lift. One rolling counterweight crosses high and low on its track,
  visible from a pocket near (905, 320). Time a service swing gate
  near x1140 with a 6.5 s cycle and about 3.8 s open. Leave at least
  200 px between the weight track and gate, and clean space at the
  exit on the east wall (y335–545). The **yellow hazmat suit** rests
  folded on a dry bench at x910, bottom y510. Lower off the high line
  into the bench pocket, then lift back before the gate.

Reuse the L4 clock-tower gear and swing, Barb's draft, and the L4 lift
branch's patrol and gate. Make the cable's sway and the draft different
nearby shapes so players can distinguish a solid from a force zone.

### Bully · café

The bully was knocked out cold and slumped in a booth. Start chest around
**(175, 505)** in a settled seated pose, with the booth seat near y590.
Keep the table lip outside the resting limbs. The counter island at
**x360–550, y400–620** forces a lift and a turn. A jukebox lets out a
quiet beat at (590, 540) with roughly 135 px of reach every 2.4 s.
At **(285, 300)** the player can watch the first beat and slide past the
counter before either branch. Use the existing bass-stack rule.

- **Awning Transom.** Climb through x465–685 at y0 into a shallow transom
  gallery (x355–740, y−455–0). A hinged sash near y−210 opens for
  3.2 s on a 5.8 s cycle. Stage at about (565, −100), then lift
  through the opening and turn toward the high awning exit. Keep the
  last 140 px free of trim, sockets and signs. The **purple-and-yellow
  skateboard** lies on a low display rack near x405, bottom y365.
  Dip off the counter lift to take it before climbing to the sash.
- **Kitchen Door.** Continue east into x740–1510 through y230–530.
  Pass a rolling bus cart and fragile glassware on different stretches
  of the room. The owner naps in a pantry chair at about (1280, 575),
  nominal hearing radius **155 px**. The route stays high and has a
  clear place to settle at (1060, 290). Pass the owner slowly or go above
  the hearing radius. The **clock-tower fundraiser flyer** rests on a
  tray at x1180, bottom y490, below the high line and close enough to
  the owner that a fast dip risks a crash. The east service opening
  spans y260–470, with room to release after the dip.

Reuse rolling carts from Larry's loading room, one hinged gate from
Barb, fragile props from L4, and the existing second-sleeper meter. Keep
impact sounds distinct from the first slow jukebox beat.

### Bandleader · behind the school dance

The bandleader was shut unconscious in a separate parked sedan's trunk.
The cutaway opens with its latch sprung for extraction. Show the lid held
up and the silhouette of the trunk well. Start chest around **(210, 525)**
in a laid-back pose on flat luggage (support top y590). The sill around
x310 has a 55 px rise and gives the player a visible reason to lift first.
Keep the head and feet away from both ends at rest. Use the regular
interior builder for the parking bay and adjacent overhangs. Backdrop
fence, open sky and rows of cars give it an outdoor look. The scene needs
no moving car, terrain physics or new beam control.

- **Bandstand Hatch.** Lift to **(370, 295)**, cross above the sedan's
  quarter panel, and go up through x480–700 at y0 into a rigging bay
  (x390–740, y−520–0). The direct diagonal meets the edge of a raised
  bandstand and a swinging mic stand. From the parking bay the player
  can see its first swing; leave a rest pocket near (590, −100) and
  about 215 px of clearance in the final opening. The **guitar** rests
  in an open case on the stage edge near x440, bottom y410, to one
  side of the lift. Approach its glint before taking the high hatch.
- **Loading Canopy.** Continue east through y255–535 into a covered
  service bay (x740–1520). One rolling amplifier trolley crosses the
  path near x1030. Teach the crossing from **(865, 315)**, outside the
  trolley's sweep. Floorboards near the service door creak with fast
  movement (roughly x1200–1350, y380–600). One couple asleep in a nearby
  sedan can serve as a single second-sleeper meter, nominal 150 px
  hearing radius, at about (1280, 565). Put the **red puffy vest** on a
  prop crate at x1170, bottom y520, as a low detour before the creak
  patch. Leave the service opening at x1520, y290–505 clear.

Reuse L7 castor or patrol movement, L3 creak noise and the existing
second-sleeper rule. A warm glow on the couple's car can stay purely
decorative. Draw the trunk sill and the rolling obstacles as individual
sprites with matching colliders.

### Spawn and souvenirs

For each of the six layouts, run the 10 s no-input proof with hard wake
rules and verify **zero bonks and zero wake** for every sleeper. Also run
the four phase offsets. Bounds for swinging hazards, wind and noise must
stay clear of resting bodies for their entire cycles. Adjust the support
or settled pose if any run fails. Prove all six standard deliveries and
a clean souvenir detour for each. Leave a visible glint and a stable
support outside the initial limbs and away from the final aperture. Use
the existing loose-item physics and trophy catalogue, including names
in `tr().items` and six distinct EN/FR descriptions. Each souvenir can
belong directly to its authored route. Register an item swap only if a
shared route builder requires it.

## Difficulty gates

Treat L9 as a **chapter opener** for room delivery. Use the current late
deep star bands for the mandatory loop.

| Mode, zero upgrades | Skilled | Casual |
| --- | --- | --- |
| Standard shift · Delivered | ≥5/6 | ≥2/3 |
| Standard shift · Ghost | 50–100% | 33–90% |
| Standard shift · Night owl | ≥2/3 | ≥1/2 |
| Per route · delivery | ≥80% on each of six | ≥50% on each, one route per specimen ≥80% |
| Independent flight | ≥80% finish, median ≤1 full sighting | ≥80% finish, median ≤2 full sightings |
| Car-first · actual catches per attempt, six-seed gate | ≥5/6 | ≥4/6 |
| Car-first · actual catches per attempt, 20-seed tuning | ≥90% | ≥60% |

Use six seeds for the release gate and at least 20 matched seeds for
greybox tuning. Aim for 90–100% skilled and 85–100% casual delivery in the
standard mode over 20 seeds. Require skilled Ghost above casual Ghost
and preserve the casual median estimates already used in the evaluator:
shift ≤208 s, ≥55.5 s median par used by successful runs, ≥5% peak
Suspicion, ≥20 average across room median peak wake, and an obstacle
within 80 px or an active mechanic witnessed on at least one casual run
per route. Keep the standard loop coverage independent of the detour.

- **Standard.** Drive live `DeepRun` and `DeepFlightScene` with the normal
  human inputs and actual simulated room results. Skip the optional car
  deliberately. Retain ordinary sightings, delays and retries. Report the
  same metrics as the other deep levels.
- **Car-first.** Every seed commits from the verge to the optional car
  before the first room. Use the existing human profiles' reaction lag,
  steering lag, wobble and drift, with their seeded 0–9 s start spread.
  A planner may take the west turnout and lead from the visible heading,
  speed and countdown. Drive ordinary finger intents through the actual
  lock. Sample the car state through its live sim. Count stalls, sightings,
  late arrivals and choice to head on after poor positioning as attempted
  misses. Continue the normal shift after either outcome and report catches,
  deliveries, fourth stars and all-four clears separately. Prove at least
  one zero-upgrade full four-star detour for each human profile in the
  20-seed set and one deterministic bot replay. Record contact,
  qualifying time, best progress, miss reason and first detector. A good
  catch rate needs margin on arrivals near the end of the start spread.
- **Beelines.** At **0, 2.5, 5 and 8 s**, require the existing shortest-open
  flight path to be spotted or fail to deliver its quota and all six
  straight 270 px/s room drags to fail clean delivery within 45 s. For the
  car, add a direct chase aimed at the current position with standard
  direct steering and no intercept or exposure timing. Exercise both
  immediate pursuit and pursuit beginning at launch where possible.
  Also check a stationary hover positioned directly on the car's intended
  path. Require zero catches by each naive controller across the four
  delays. If the lazy chase wins, tune approach geometry and the readable
  speed-match window, then repeat the skilled and casual runs on the same
  seeds.
- **Browser.** At 375 × 690, drive the memo-to-turnout-to-intercept sequence
  with touch and measure first-time comprehension. Verify a clean catch,
  a miss in flight, a miss while in a room, and a four-star report and
  catalogue reload. Exercise English, French, muted and reduced-motion
  cues. Make sure the countdown survives camera movement, room transitions
  and the existing HUD safe areas. Confirm the impact remains readable
  without the screen wash.

## Build and ownership

| Pass | Owner and files | Proof |
| --- | --- | --- |
| 1. Flight greybox | **Level/flight** owns `src/levels/deep-1955.ts`, `src/flight/time-car.ts` and its new view. Add one opt-in timed pickup definition and reuse `collectible.ts`, `sim.ts`, `deep-sim.ts`, `deep-scene.ts` and the current minimap. Reuse retained Pixi shapes, particles and speech overlays. Extend a detector skin/source mapping for the marshal and lamps without moving their hit geometry. | `tests/flight-1955-time-car.test.ts` covers motion and lock thresholds, drain, same-frame sighting and deadline priority, lock and spot transitions, crossing 10:04 during a room, stationary expiry, success and miss aftermath, and re-entry persistence. Extend layout, road and autopilot tests and make the moving pickup branch explicit in the collectible placement tests. Keep memo, identity, no-overlap and save coverage for all levels. |
| 2. Room greybox | **Rooms** owns `src/abduct/rooms/deep-1955.ts`, six room definitions and their route/souvenir waypoints. Use the shared interior renderer and collision rules with foliage and trunk art. Add only small registry hooks, including the human rig IDs where needed. | `abduct-spawn`, `abduct-deep`, `abduct-souvenir-reach` and jitter/input-latency passes. Check every exit and optional item separately. |
| 3. Art | **Art** owns the L9 SVGs and contact sheet, coordinating native sizes with the flight and room owners before manifest registration. First pack: clock roof and face, café, theatre, school, time car, cruiser and lamp skins, three human rigs, booth and trunk, and the six items. Reuse existing gears, gates and carts with period recolours where they fit. Keep physical landmarks distinct from backdrop dressing. Follow the art brief and build primitive fallbacks before final art lands. | Review the phone-size scene, portraits and item silhouettes. Check reduced motion and missing SVGs. Prebuild rain, strike and trails into retained objects with no per-frame allocation or geometry rebuild. |
| 4. Dispatch and copy | **Story/strings** owns EN/FR names, era card and memo, instructions, bark and mumble lines, expiry and report copy, souvenir quips and Town exhibit. **Coordinator** owns the registry, new IDs and optional clock/deadline metadata in `contracts.ts`, `levels/{types,levels,run,save,progress}.ts`, integration with the shared HUD and report, and save migration. Use the version 2 key and a default L9 record. Scope the legacy access exception to L3–L7. | Progression covers fresh, legacy, imported v2 with L8 cleared, existing debug unlock and replay. Check exact clock boundaries, one-star unlock, failure filing, field-find and souvenir catalogue coverage, and that earlier levels still show their ordinary sunrise clocks. |
| 5. Tune and ship | **Difficulty** owns `tests/difficulty/{evaluate,human,stars,beeline}.ts` and a local car-intercept test driver if needed. Wire the four scored stars and car-first stats into Markdown and JSON. Coordinate changes to placements with the flight and rooms owners. | Run `DIFFICULTY_LEVELS=level9 npm run difficulty`, then with `DIFFICULTY_SEEDS=20`. Finish with `npm test`, typecheck, build, and an `ONLY=L9` real-pointer playthrough. Extend the e2e driver for a car-first option and the EN/FR overlay check. |

Integrate the greyboxes before commissioning the final room backdrops.
Coordinate the small shared-file additions with the existing preprod owners.
The design includes no implementation measurements. The first flight
prototype should compare the two approaches from identical seeds with the
live camera and real pointer input. It needs to show that the west turnout
is readable and that a direct chase misses for a reason a player can see.
The main remaining risks are late starts with a moving camera, patrol overlap
near the exit rings, trunk clearance, and an overlong room run after the
car-first detour. Tune map geometry and room staging before changing shared
handling or wake rules.

### Decisions for review

- The strike is at 10:04 exactly, with extraction ending four minutes
  later. Confirm the desired amount of aftermath if the fiction should
  end closer to the strike.
- L9 opens Temporal Dispatch immediately after L8. Confirm the 1955 card's
  display name and whether the console still shows Cold Storage as the
  next planned date.
- Final sleeper names, the car's public name and the dance title come from
  the naming pass. The road run, room layouts and trophy IDs can be
  reviewed using the working descriptions.
- Before build, reconcile the parallel drafts against the clock and route
  table here. The story draft uses dawn expiry and a different route-to-item
  assignment. Update those labels and item quips once the route table is
  approved. Use the flight placements to set the final art anchors.
