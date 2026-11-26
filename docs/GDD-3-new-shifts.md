# Night Shift: design v3, "New Shifts" (L5–L7)

This extends `docs/GDD-2-deeper.md` (read it first; every v2 deep-level rule applies unchanged:
1 s detection fuse, 3 specimens, 2 routes per building, sunrise clock, waking = failure,
second sleepers, autopilot proofs and difficulty bands). Merged from a three-agent brainstorm
(Astra: visual identity, Fable: scene composition, Neon: writing), picked by the designer on
2026-11-23. Expect tuning after playtests.

## Shared rules for L5–L7

- **Plain drag is enough.** Every flight and every route must be completable without any upgrade.
  (The Afterburner upgrade has since been withdrawn.) Size open crossings and shadow hops for ordinary drag.
- **Tell language stays honest** (AGENTS.md): mint = you and your goals, amber = about to happen,
  red = it has you right now. Water is dark Pine with Mist/Ice surface lines and lit tanks glow UV
  lilac, never cyan next to the mint beam. A "not done yet" exit shows an amber/empty checkbox,
  never red. Shadows are plain dark, never mint.
- **No real brands or protected emblems.** No red-cross symbol on hospital art (use a crescent moon
  or a Zzz pillow sign). No real hospital names.
- **References are short homage lines only.** A Douglas Adams nod for the dolphin and Star Trek nods
  (the designer approved them) live in single lines: memos, mumbles, report quips. No characters,
  logos, ship designs, uniforms or copied text.
- **PG-13, leaning 16** (raised from PG in v4, see AGENTS.md "v4 Deeper Jokes"). The probe joke is
  still bureaucratic medical comedy at heart: forms, a thermometer, a reflex hammer, a tickle
  feather, signage. On top of that, innuendo, butt and probe jokes, mild swearing and short
  pop-culture or sci-fi nods are fine: the Endoscopy corridor hides a silver butt plug souvenir
  ("Zib, that is not a very good probe"). Nothing sexually explicit, nothing anatomical drawn, no
  slurs, nobody real mocked.
- Deep levels unlock from the start like L3/L4. Ranks extend to 21 stars (see Progression).

## L5 "Pier Pressure" / « Dauphin de quart » (Barnacle Bay, seaside)

Map ~2160×3360, theme `pier`. Sunrise budget 450 s, Night owl par margin 140 s. Half the map is sea.

**Look.** Dark Pine sea tile with sparse twinkles, desaturated Ochre sand, a Wood boardwalk. Amber
lives in exactly two places, the lighthouse lamp and a chip kiosk. Interiors: UV-lilac jellyfish
hall, deep Pine show pool with a wavy Ice surface line, whitewashed lighthouse rooms.

**Flight signature: the lighthouse.** A map-wide hard-edged beam turns from a fixed point (one turn
≈ 7 s). Tall props (boat masts, the harbour crane, the marine-park wall, the fish market) cast plain
dark **shadow wedges** that the beam does not reach; the shadow wedges are precomputed (fixed origin).
An amber ghost line leads the beam edge by 0.5 s. The drawn beam is the hit area. Shadows are close
enough together for plain drag, and every entry ring has a full second of cover or a beam gap.
Also: gull flocks (solid, bumping), a harbour patrol boat with a headlight (`car` on a water path),
bunting (`wire`), one `neon` chip-kiosk sign.

**Abduction signature: the dolphin.**
- **Body plan.** The ragdoll gets a per-specimen body plan. The dolphin plan: 7 joints, 6 bones
  (snout, chest [beam holds this], belly, tail stock, fluke, near and far flipper; starting radii,
  bone lengths and bend limits: chest r34 root; snout r20, 62 from chest, ±0.5; belly r30, 84 from
  chest, 0.7 ventral / 0.25 dorsal; tail stock r16, 70 from belly, 0.8 / 0.3; fluke r20, 46 from tail,
  ±0.9; flippers r10, 44 from chest, ±1.4 loose). Total length ≈ 260 px (a human is ≈ 275), so v2
  doorway widths still fit. Asymmetric limits make it droop into a croissant in the beam. Slippery
  (low friction), bonks are a wet "thwap" worth ~20% less wake. Humans keep the existing plan unchanged.
- **Moisture sheath.** Drawn on the joints: two fat round-capped strokes along the spine (Ice outer,
  pale water blue inner), width shrinking with moisture. No physics. Moisture drains over ~14 s in air,
  each bonk splashes a chunk off. Below 25 % a dashed **amber** outline pulses; at 0 the standard **red**
  1 s fuse runs round the specimen, then she wakes squeaking (fail reason `woke`). Refills (pool
  surface, mop bucket, sink, a cycling ceiling sprinkler) are marked with a small mint droplet chevron;
  putting the body in one refills to full. Drips from the lowest joint leave fading floor rings.
- **Water zones.** Inside a water zone the dolphin floats up gently (push down to duck under a
  divider) and refills. For humans a water zone is a splash: noise.

**Specimens.**
1. **Bubbles** (FR « Bubulle »), the marine park's show dolphin. "Sleeps with half her brain. Still
   outperforms the intern." Second sleeper: **Barnacle** the sea lion, snoring on the rocks.
   - `bubbles_roof` *Show-pool roof*: show pool (hoops on `swing`, a floating beach ball) → sea-lion
     rocks (Barnacle) → retractable roof panel (`gate`).
   - `bubbles_tunnel` *Service tunnel*: flooded viewing tunnel (water zone) → jellyfish hall (jellies on
     slow `patrol`, the mop bucket refill) → loading dock door (`gate`).
2. **Pete**, harbourmaster and lighthouse keeper, asleep in a rocking chair in the lamp room.
   - `pete_gallery` *Lamp gallery*: lamp room, whose turning lens sweeps a light cone through the room
     on the same clock as the flight beam (`camera`) → gallery window.
   - `pete_slipway` *Down the tower*: spiral stairs (`creak`) → weight shaft (counterweight `patrol`) →
     boat shed, slipway door on a cycle (`gate`).
3. **Sal**, the fish market's accountant, asleep on the ledger open at "one outstanding".
   Second sleeper: **Kipper**, the harbour cat.
   - `sal_loft` *Ice chute*: market floor (hanging scales `swing`, crab pots `swing`) → ice chute
     (`draft` down; climb against it) → loft hatch.
   - `sal_dock` *Cold store*: cold store (freezer hooks `patrol`, a fish-crate tower `fragile`, Kipper)
     → dock door (`gate`).

**Jokes.** Dolphin report quip (the homage): *"The dolphin left a damp note thanking us for the
fish. We did not give it any fish. Accounting has opened a file."* Vrell memo: *"Head Office tried
this with whales once. The paperwork ran to four volumes."* Zib insists it is a fish; Vrell: *"It is
a mammal, intern. It outranks you."* Delivery picture: Bubbles in a round Bureau porthole tank,
fin over the rim. Souvenir item: a sardine tin.

## L6 "Probe Compliance" / « Contrôle technique » (St. Mildred's General, Endoscopy Wing)

Map ~2160×3120, theme `clinic`. Sunrise budget 450 s, par margin 190 s (was 140; difficulty curve, Neon P5).

**Arrival (2026-11-26 openings rework).** Zib comes in along the entry road from the east, at **(2060, 2780)**
(zone E-south), from Barnacle Bay's townward road. The opening screen shows the east service road, an annex
and pines, with no detector. Every straight run at a ring is caught on the way, beyond the opening:
the A&E scramble races to Hank's front doors, a camera on the Endoscopy Wing's north-east corner looks
along the way to his rear entrance, a camera on the on-call block's south-east corner looks back down the
east lawn at Osei's two doors, and a pole on the ward's front lawn watches the diagonal to Pemberton. The
old ward bay is now the **east bay** at (2030, 1900): it races north up the new east service road
(x 1860, from the entry road) to the pharmacy drive.

**Premise (the probe joke, PG-13).** Bureau Compliance has noticed zero probes logged this quarter.
Worse, intelligence reports that **humans queue up to be probed. Voluntarily.** They book
appointments, fast the night before, bring a friend to drive them home and leave four-star
reviews. The Endoscopy Wing is signposted **"Department of Internal Affairs"** (FR « Service des
Affaires internes »). Vrell is professionally insulted. Tonight: three specimens, each signed off
on **Form 7-B** (FR « Cerfa 7-B ») en route: temperature, reflexes, ticklishness. *"The Bureau's
probe has been a brass thermometer and a clipboard since 1953. We have no idea where the humans
got their other theories."*

**Look.** The first cool, pale interior set: Mist walls with a Teal dado stripe, Lav shadows, dimmed
strip lights. Indoors the only amber is heart monitors and a vending machine, so every amber tell
reads. Outside: dark pines, a lit crescent-moon canopy (no red cross), white road arrows.

**Flight signature: the ambulance scramble.** Ambulances wait dark in their bays, then launch down
the access road with a headlight cone and a beacon radius. They are **triggered** (the saucer
coming within range of a bay, deterministic) rather than looping. Tell: the bay door rolls up and the
lane arrows flash amber 0.9 s before launch (was 1.2 s). Also: a medevac `heli` on a loop, rooftop `camera`s,
insomniac patient `window`s, one `neon` sign ("NOW SERVING 12").

**Abduction signature: Form 7-B probe drones.** Each route has **two** small mint Bureau drones from
{thermometer → HEAD, reflex hammer → KNEE, tickle feather → FOOT}. Put the named joint inside the
drone's ring and hold it there for 0.8 s; the ring fills in mint like the flight lock-on. Drones
are static (generous rings, tuned with the difficulty evaluator). The **feather** sets off a giggle
(a small noise burst) and a **reflex kick**: an amber arrow beside the foot shows the impulse
direction 0.35 s before it fires, then one ragdoll impulse; steer so the foot doesn't hit a fragile
prop. The **hammer** gives a smaller knee kick with the same tell. The exit stays shut with an amber
empty checkbox per missing reading until both tick mint; a tiny clipboard in the HUD lists them
("Temperature: lukewarm ✓"). The report prints the readings.

**Specimens.**
1. **Hank**, in the waiting room, asleep across three chairs holding ticket 347 under a sign reading
   "Now serving: 12", a jug of prep drink in his lap. Second sleeper: **Nurse Gladys** at the station.
   - `hank_front` *Front doors*: waiting room → lobby → revolving door (timed, `fan`-style blades).
   - `hank_rear` *Rear entrance*: corridor → supply room (laundry cart `patrol`) → rear service door
     (`gate`). The route name is the joke; nothing else is.
2. **Dr. Osei**, gastroenterologist on call, asleep in the on-call bunk. "Awake for 31 hours. Has
   seen things. Will not notice us."
   - `osei_helipad` *Roof helipad*: on-call room (her pager buzzes on a cycle, `speaker`) → lift shaft
     (car `patrol`) → roof hatch.
   - `osei_pharmacy` *Pharmacy hatch*: corridor (`camera`) → pharmacy (pill-bottle shelves `fragile`)
     → hatch (`gate`).
3. **Mr. Pemberton**, Recovery Bay 3, still sedated after his procedure. "Slept through his own
   procedure. Will sleep through ours." Second sleeper: **Roland**, a health-and-safety auditor in
   Bay 4, asleep clutching a rubber stamp.
   - `pemberton_window` *Recovery window*: recovery bay (privacy curtains, Roland, heart monitor) →
     corridor → window.
   - `pemberton_chute` *Laundry chute*: ward → linen room → chute (`draft` down).

**Jokes.** "Rear entrance" route. Sign gags (lettered art with FR variants): "DEPT. OF INTERNAL
AFFAIRS", "NOW SERVING: 12". Report: *"Form 7-B filed in triplicate. Temperatures normal, reflexes
brisk, zero dignity complaints."* Roland mumbles *"Initial here to continue dreaming."*

## L7 "A Whole Cruise Ship" / « Vogue la soucoupe ! » (the SS Buffet Royale, at sea)

Map ~2160×3600, theme `ship`. Sunrise budget 480 s, par margin 134 s (346 s elapsed, including the galley duct and
Cabin 404 approaches). Graduates the "A Whole Cruise Ship" mission concept card. The ship runs bow-north down the middle of the map; open sea around it.

**Look.** Cream bow against ink-blue sea, moonlit Mist decks, a Teal lido pool, strings of deck bulbs
(decor only), a foam wake trailing south. Interiors in ballroom Brick and Gold with brass rails.

**Flight signature: the deck photographer.** A photographer half-presses: an amber rectangular frame
locks onto where the saucer is *now* and a closing iris previews the shutter (~1.0 s). Then the
frame's exact border goes solid for a 1 s long exposure; being inside it counts as detector exposure
(red edge + fuse). You break sideways after the frame fixes, then come back between shots. Each
entry ring gets a full lock-on interval after a dodge. Also: a radar mast whose two opposite cones
sweep (`camera`-style), deck patrol stewards, gulls, `wire` for the bunting, one `neon` casino sign.

**Abduction signature: the swell.** A slow roll gives the whole building a signed, time-varying
sideways pull (period ≈ 7 s, ramps in and out). The camera and HUD stay level (no rotation: it
causes nausea and skews touch). Tells: a fixed plumb dial and the soup/water surfaces show the current
pull; an amber bead at the dial's outer tick warns ~0.5 s before each reversal. Things on castors
(dessert trolley, deckchair stack) slide with the roll as moving solids. Every route has at least one
passage longer than half a roll, so a lucky start cannot carry you across.

**Specimens.**
1. **Captain Sterling**, asleep at the wheel ("Autopilot: the captain"). Second sleeper: **Anchovy**,
   the ship's cat, on the radar console.
   - `captain_mast` *Mast hatch*: bridge (brass compass, swinging chart lamp) → chart-room stairs →
     mast hatch.
   - `captain_funnel` *Funnel*: bridge → engine casing → funnel (steam updraft `draft`, soot damper
     `gate`).
2. **Chef Marco**, asleep beside the 24-hour dessert trolley, toque still upright.
   - `marco_skylight` *Galley skylight*: galley (hanging ladles `swing`, the dessert trolley sliding) →
     galley hood (duct `fan`s) → skylight.
   - `marco_promenade` *Promenade door*: galley → dining room (chocolate fountain `fragile`, chandelier
     `swing`, a busboy bot `patrol`) → promenade door (`gate`).
3. **Greg**, the all-inclusive tourist, asleep on a lido lounger in three stolen towels and sunglasses.
   - `greg_awning` *Sun-deck awning*: lido bar (deckchair stack sliding, a swinging lifebuoy) →
     sun-deck awning.
   - `greg_cabin` *Porthole*: cabin corridor (steward `camera`) → cabin → porthole.

**Jokes.** Captain mumbles (Star Trek nods): *"Make it so… comfy."*, *"Engage the snooze button."*,
*"Set a course for the buffet. Warp nine."* Greg: *"Is the tractor beam all-inclusive?"* Vrell:
*"Budget approved by nobody. We are billing this as maritime research."* Report: *"The cruise line
will assume they went to early yoga. Nobody checks early yoga."*

## Report additions (all levels)

- **A. Bureau ID photo.** The abduction records the ragdoll pose at its wildest moment (highest limb
  speed, after the first second) and the report redraws it as a passport photo in an official frame.
  Every run gives a different picture. No new art beyond the frame.
- **B. Vrell's cover story.** One line on the report keyed to level, souvenir and sightings:
  *"Filed as: swamp gas off one disputed sardine tin."*
- **C. Tabloid headline.** When the player was spotted twice or more, a one-line headline stamps
  across the report: *"LOCAL MAN PROBED WITH GOOSE FEATHER, RATES EXPERIENCE 4/5"*.

## Progression

- 7 levels × 3 stars = 21. Ranks: Intern 0 → Probationary 3 → Abductor 5 → Senior Abductor 8 →
  Abduction Lead 11 → Head of Internal Affairs 15 → Fleet Admiral of Naps 19.
- Mission concept cards after L7: The Gym Bro, Grandma's Bingo Night, Area 51 Gift Shop.

## Feel targets and proof

- Each new level: a good run ≈ 4–5 min; every route has a timing commit.
- Every route has a headless autopilot proof (`tests/abduct-*.test.ts`), every map a flight
  autopilot proof, and each level has a difficulty band in `tests/difficulty/evaluate.ts`: skilled
  delivers ≥ 75 % and casual ≥ 40 % on every route, median flight sightings skilled ≤ 1, casual ≤ 2.
- 60 fps on a mid-range phone; cull off-screen props; no per-frame allocation in new hot paths.

## As built (2026-11-23) and open tuning notes

- **L5:** moisture also dries faster under a fast drag (×(1 + (speed/110)²), capped at 4×; 14 s held
  still), so flat-out dragging costs water. Bonks splash 0.05 + 0.12 × power off. Routes run 41–65 s for
  the proof bot. Human-model players see amber on the roof route every run but never dry out; real
  dawdling and bonks will. Lighthouse turn 7 s, half-angle 0.6 rad, ten shadow-casting props.
- **L6:** drone rings 54/56/60 px (thermometer/hammer/feather), hold 0.8 s, leaving drains twice as fast.
  Feather kick 300 px/s, hammer 170 px/s. Ambulances: 0.9 s tell, 230 px trigger (A&E bay 350 px, east bay 260 px), 4 s
  rest. Human-model players deliver every route: tighten after playtests if it feels soft.
- **L7:** photographer iris 0.9 s (1.0 s never threatened a crisp stop), exposure 1.0 s, 1.4 s wind-on.
  Swell 7 s period, 230 px/s² pull. Castors roll up to a doorway and park there rather than across a corridor.
- Difficulty (6 seeds, casual mean peak wake / casual shift estimate): L3 36 / 100 s, L5 38 / 83 s,
  L6 39 / 105 s, L7 36 / 117 s. `npm test` checks the bands of L3, L5, L6 and L7.
