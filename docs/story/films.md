# Night Shift: Season 1 films

Storyboards, cast sheet and image prompts for the five films of Season 1. Written by the film director (Fable) on 2026-11-28 under [the storytelling rules](rules.md) §6. An image generator paints the keyframes from the prompts here; an engineer builds the films from the shot blocks. Film 1 is approved and painted; films 2 to 5 are new and wait for review before anything is rendered.

## The five films

| # | ID | Title (EN / FR) | Plays | Shots | Hands over to |
| --- | --- | --- | --- | --- | --- |
| 1 | `opening` | The Opening / L’ouverture | Before L1: the first time Work Order #0001 opens its memo, on a save where L1 is not delivered. | 6 | the L1 memo ("Last quarter's intern returned a man still clutching his toaster") and the farmhouse on Route 9. |
| 2 | `probation` | Off Probation / Fin de période d’essai | After the first delivery report of L2 (Spin City), before the Field Check offer. | 6 | the Field Check offer, then Work Order #0003 (the bakery) and #0004 (the garage). |
| 3 | `prior_art` | Prior Art / Antériorité | After the first delivery report of L7 (SS Buffet Royale). It unlocks L8. | 6 | Work Order #0010, Patent Valley. Echo and her stamp are shown but not named; the L8 memo names the apes. |
| 4 | `adequate` | Adequate / Correct | After the first delivery report of L8 (Patent Valley). It opens Work Order #0011 (1955). | 6 | Work Order #0011, Crest Valley, 12 November 1955. |
| 5 | `outro` | The Parking Ring / L’anneau | After the first delivery report of the 2199 shift (`level12`). Same seen-beat as today: `dispatch2199Finale`. | 7 | Dispatch, with the dial quiet and every delivered order replayable. The ring in the last frame is the one named in `dispatch2199.parking`. |

Rules for all five:
- A film plays once per save, the first time its trigger is met. Store a seen-beat per film (film 5 keeps the existing `dispatch2199Finale`).
- Skip is always on screen. A tap moves to the next shot once its caption has had its reading time.
- Every film can be replayed. Where the replay entry sits is the engineer's call; the shipped finale replays from the delivered order's memo ("Bureau epilogue"), which would suit all five.
- A film grants nothing and sits outside every timer. Films 2 to 5 play after the report's first-clear line, never instead of it.
- With reduced motion: half-second dissolves between shots, a static frame at each shot's `holdAt` camera, no shake, flash, jolt or bloom, and a fade to black in place of the iris. Reading times do not change.

## Technical frame

- **Keyframes** are 3:4 portrait, 896×1200. In game they cover a 540×960 screen: at scale 1 the full height shows and the middle 75% of the width.
- **Camera keys** are `[t, focusX, focusY, scale, rollDeg, ease]`, with `t` in authored seconds from the start of the shot and the focus as a fraction of the image. At scale `s` the focus must stay within x `0.375/s … 1 − 0.375/s` and y `0.5/s … 1 − 0.5/s`, or an edge shows. Every key of films 2 to 5 is inside those bounds (checked by script). Film 1's keys were authored on the 3:4 preview and are transcribed as approved; the engine's clamp covers the three keys noted in its section, as the animatic's did.
- **Captions** cover about the bottom 25% of the screen. At each shot's `holdAt`, the subject of the shot sits above the caption (checked by script for films 2 to 5).
- **Reading time.** Each block gives `read`: `readSeconds()` of the longer of the two displayed lines, quotes included. The engine holds the caption fully visible for that long. When `read` is longer than `capOut − capIn`, it slows the shot around `holdAt`, where the camera is calm and can keep creeping. A caption never crosses a cut.
- **Action length** is the authored length of the shot before any reading hold: 2.5 to 4 s.
- **Transitions in:** cut, smash (white flash and a two-frame shake), dissolve, iris (endings only). The first shot of each film fades from black.
- **Effects:** flash, shake, stamp (a small vertical jolt), bloom at an image point.
- **Endings.** In the last shot of films 2 to 5 the caption's `capOut` falls before the iris starts, so the line is read on the calm plateau at `holdAt` and the iris closes on a clean picture.
- **Keyframe files** are named by shot id (`probation_1` … `outro_7`).
- **Sound cues** use only the game's existing names. No voices and no UI clicks. Times are authored seconds from the start of the shot.
- **Speaker labels:** `narration` shows "Bureau file" / « Dossier du Bureau »; `vrell` shows "Vrell" / « Vrell »; `zib` shows "Zib" / « Zib »; `krix` shows "Krix" / « Krix »; `bubbles (written note)` shows "Bubbles’ note" / « Mot de Bubulle ». Speech is shown in quotes (“…” / « … »); the Bureau file and Bubbles' written notes are shown plain.

### Typeset props

The pictures never contain letters or digits. Everything a picture needs to say is said by shape and colour (a red barred circle for "void", a gold starburst for "vested", a fin-print for Bubbles' signature, a scarf-striped pennant for "this ring is Zib's") and the caption says the words. If the engineer wants the shipped typeset props back (ORDER VOID, PENSION VESTED, LATER, the year on the dial), they can be laid over the image at an image point and move with the camera, in both languages, using the existing `dispatch2199` strings. That is optional: every shot reads without it.

## Cast sheet

For the image generator and for review. The six approved frames of film 1 lock the look; they are in `/home/stone/.t3/userdata/providers/antigravity/ac0a3dfd6dddb20962cecff6ee5fe65e19d3923be20e52c5ab52ff877f7e4c32/antigravity-acp/brain/30523260-acaf-4ffc-befb-41ecbe06ee97/`. Where a frame and this sheet differ, this sheet wins for new frames.

| Who or what | Look |
| --- | --- |
| **Zib** | The player. A small, eager mint-green alien (#64c5a1), about half as tall as Vrell, they/them. Round head, no nose, two curved antennae ending in glowing mint bulbs (#7CFFCB), huge round cream-white eyes with big dark pupils and one highlight, a small open smile. Teal uniform shirt (#468c89) with a cream collar, burgundy necktie, and an oversized pink-and-gold striped knitted scarf with fringed ends (their mother knitted it; it is in every frame). Three-fingered hands. Always a little too happy to be here; antennae droop when worried and stand straight when thrilled. Reference frames: `shot5_keys` (face and scale), `shot6_launch_v3` (in the dome). |
| **Vrell** | The supervisor. A tall, slumped lavender-purple blob (#a387b1, shadow #604569), he/him. Smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair, no clothes. Two stubby arms with mitten-like hands. Heavy half-lidded eyes, small dark rectangular glasses that sit low, a flat unimpressed mouth. Usually holds a wooden clipboard or a steaming cream mug. Tired in every frame; a smile is rare, small and looks away. Reference frames: `shot5_keys` (proportions and face), `shot3_fired` (at his desk). Where the two differ, `shot5_keys` wins. |
| **Krix** | Last quarter's intern, now at OBELISK™, he/him. An adult mint-green alien (#64c5a1) of Zib's species, a head taller and slimmer than Zib, with pointed ears, two antennae with mint bulbs, large round gold-rimmed glasses, a sleek charcoal turtleneck (#262640) and dark trousers. Smug half-smile and a wristwatch he likes to check. His props: the scorched chrome two-slice toaster from the incident, and the rolled cream map scroll (the Bureau's Grimsby client list) he walked out with. Reference frames: `shot1_incident`, `shot3_fired`; in-game art `flight/pickup_krix.svg`. |
| **The saucer** | A hand-me-down retro 1950s flying saucer in teal and mint metal (#64c5a1, #468c89): riveted panels, a clear glass dome over a one-seat cockpit, alternating amber and mint rim lights, three short landing legs. A dent on the right of the rim is covered by two crossed beige sticking plasters (the "load-bearing bandage"). It sputters mint smoke rings. Reference frames: `shot5_keys`, `shot6_launch_v3`; in-game art `flight/saucer_top.svg`. |
| **Vrell's office** | A cluttered 1950s retro-futurist Bureau office in smoky plum-slate. A wooden desk with cream folders and an amber gooseneck lamp at its left end. On the right corner of the desk, a glass evidence box holding the scorched chrome toaster. A cork board with blank notes, grey filing cabinets, a round wall clock with no numerals. A brass pneumatic tube comes down from the ceiling over the desk (Head Office mail). A brass-rimmed porthole tank is set into the wall beside the desk (Bubbles' tank, from film 5). A heavy riveted metal door on the right leads to the hangar; a plain stairwell door in the back wall leads down to Basement B-4. Reference frames: `shot3_fired`, `shot4_zib_arrives`. |
| **The evidence box** | A clear glass display box on the corner of Vrell's desk with the scorched, lightly smoking chrome two-slice toaster inside. It is the Bureau's monument to Krix and appears in every office shot until Krix carries the toaster himself. |
| **The hangar bay** | A curved dark-indigo orbital bay with round amber ceiling lights, a wide window, amber strip lights around the bay doors and glowing mint docking rings on the floor. Earth's night side is below. Reference frames: `shot5_keys`, `shot6_launch_v3`. |
| **Basement B-4 (Temporal Dispatch)** | Under the office, mothballed since 1985. A low concrete-and-rivet corridor with pipes, cobwebs and one bare amber bulb, ending in a round-cornered vault door painted with amber-and-black hazard chevrons, a brass hourglass emblem at its centre, a chain and a big padlock. Inside: dust sheets, and the chrono console, a waist-high bakelite-and-brass cabinet with one big round dial like an oversized kitchen timer (mint glowing rim, one brass needle), a blank dark display window above the dial and a brass lever. Behind the console stands the time gate: an upright mint ring as wide as the saucer. The dial and its window never show digits in the picture; the caption carries the year (see "Typeset props"). |
| **The OBELISK™ slab** | A tall matte-black rectangular slab, about three apes high, with sharp edges and a thin lilac glow along one bevel. No logo or lettering: the lilac edge is the brand. On paper it is drawn as an upright black rectangle; the OBELISK seal is a lilac wax seal in the same upright-rectangle shape. In-game art: `room/uplift_slab.svg`, `flight/hum_slab_top.svg`. |
| **The OBELISK™ limo** | A sleek matte-black space limousine with one glowing lilac upright rectangle on its side. Seen in film 1 and behind Krix in film 3. Reference frame: `shot3_fired`. |
| **Larry** | Spin City's night attendant, the L2 specimen. A human man in his thirties with messy brown hair, a pointed nose and a slate-blue polo shirt with a small blank name tag. Always asleep with his mouth open, and holding a coffee mug. In-game art: `human/larry_head.svg`, `human/larry_torso.svg`. |
| **Captain Sterling** | Captain of the SS Buffet Royale, an L7 specimen. An older human man with white hair and a neat white moustache, in a white cruise captain's uniform with gold epaulettes and buttons. His peaked cap has left his head by the time we see him. In-game art: `human/sterling_*.svg`. |
| **Flint, Reed and Echo** | The three uplifted apes of Patent Valley (L8), stocky cartoon apes with cream muzzles and big round eyes. **Flint**: chestnut-brown fur, a grey stone flake worn like a flat cap. **Reed**: tawny-gold fur, a small bone drumstick tucked behind one ear (he is the valley's drummer). **Echo**: slate-blue fur, round spectacles carved from stone with thick grey rims, the valley's patent clerk, she/her; her tools are a stone tablet and a chunky stone stamp. In-game art: `human/flint_head.svg`, `human/reed_head.svg`, `human/echo_head.svg`. |
| **Bubbles and her tank** | A bottlenose dolphin (L5 specimen), she/her: slate blue (#647899) with a pale belly (#a7b7ce), big round cream eyes and a permanent smirk. She audits Accounting from a brass-rimmed round porthole tank set into the office wall beside Vrell's desk; a tiny in-tray and a tiny desk lamp are clipped to its rim. In film 5 she is only seen in a small framed photo: the tank is empty. Her signature is a wet fin-print. In-game art: `human/bubbles_head.svg`. |
| **The temporary lanyard** | Issued on Larry's report (film 2), returned at L8 (film 4), kept as a keepsake in film 5. The cheapest lanyard in the galaxy: a ribbon of amber-and-black hazard tape, a blank cream card and a paperclip instead of a clasp. Zib wears it over the scarf from film 2 to film 4. |
| **The staff badge** | From film 4 on, Zib wears a small shiny mint enamel badge in the shape of a saucer, pinned to the scarf. |
| **The parking ring** | A private docking ring in the hangar: a glowing mint ring on the floor with a short post beside it. Bubbles' ring is the only one filled with water, a round turquoise pool lit from below. In film 5 the post carries a pennant in Zib's pink-and-gold scarf stripes (that is how the picture says "ZIB" without letters). |

Scale, left to right in a line-up: Zib (1), Krix (1.5), the apes (1.3, stocky), Larry and Captain Sterling (2), Vrell (2, and twice as wide as Zib). The saucer is about four Zibs wide.

Minor recurring props: the **pneumatic tube** (brass, from the office ceiling; Head Office orders in film 2, OBELISK™ bills in film 3), the **wall map** (film 2), the **complimentary biscuit** (small, square, pale; films 3 and 4), the **OBELISK™ seal** (a lilac wax seal shaped like an upright rectangle; films 3 and 4), **Krix's gold pen** (his signature in film 3, the bill in film 5).

## Style bible

Paste this paragraph at the top of every image prompt. It is the locked style of the approved frames, with the framing rules added.

> High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

Hard rule: no text, letters or numbers in any picture. Anything that needs words (a stamp, a door sign, a note, a dial) reads from shape and colour alone, or is left blank.

## Film 1: The Opening (`opening`)

- **Title card:** The Opening / L’ouverture. Sub-line: Season 1 · Route 9, tonight / Saison 1 · Route 9, cette nuit.
- **Trigger:** Before L1: the first time Work Order #0001 opens its memo, on a save where L1 is not delivered. It plays after the title, never on top of it.
- **Logline:** Last quarter's intern (Krix, not yet named) wrecks a routine pickup, is fired and walks off with the client list to a nameless rival in a lilac limo; Zib, his unpaid replacement, is handed the patched saucer and sent to Route 9.
- **Status:** Approved and painted. Built in `src/ui/films.ts`. Its lines were changed on 2026-11-28 to keep the L7 twist: no name and no firm before L7 (see Decisions).
- **Length:** 6 shots, 20.1 s authored, about 39.467 s with the reading holds.

### Storyboard

| Shot | We see | What changes | Why now | Line (EN / FR) | Camera and sound |
| --- | --- | --- | --- | --- | --- |
| 1. The Incident | A quiet street at night. Krix in the saucer dome admires his wristwatch. Below him the beam holds a snoring man in striped pyjamas who hugs a chrome toaster, drifting towards the power lines. | Krix is not looking where he flies. | Opening image: a routine pickup about to go wrong. | **Bureau file:** Incident report: last quarter’s intern. Routine pickup. Eyes on his watch.<br>**Dossier du Bureau :** Rapport d’incident : le stagiaire d’avant. Routine. Les yeux sur sa montre. | Open on the watch, drift down-right to the sleeper and the wires. Two soft ticks. Cut on the move. |
| 2. The Zap | The saucer rim hits the wires in a burst of amber sparks. The beam shatters. The sleeper lands in a bush, still asleep; two slices of toast pop out of the toaster. A neighbour in a bathrobe takes a flash photo. | The pickup fails, and there is a witness with a photo. | Because Krix was not looking. | **Bureau file:** The power lines were solid. The bread was toast. So was he.<br>**Dossier du Bureau :** Les lignes électriques étaient solides. Le pain était grillé. Lui aussi. | Smash cut on the spark, whip down to the sleeper as the toast pops, flash from the neighbour's camera. Crash, pop, shutter. Dissolve out. |
| 3. Fired | Vrell's office. Vrell, furious, slams a rubber stamp on a clipboard. The scorched toaster sits in a glass box on his desk. Krix strolls out of the door with a rolled map hidden behind his back, towards a black limo with a lilac slab emblem. | Krix loses his job and leaves with the client list for a rival. | Because of the wreck and the photo. | **Bureau file:** Vrell fired him. Someone else snapped him up before the ink dried.<br>**Dossier du Bureau :** Vrell l’a viré. Quelqu’un d’autre l’a récupéré avant que l’encre sèche. | Dissolve in. The stamp lands with a thud and a small jolt, then pan right past the toaster to Krix and the limo. Cut. |
| 4. The Recruit | Seen from behind Vrell and his coffee: Zib stands in the bright doorway with a battered suitcase, the scarf, and an envelope held out proudly. | The replacement arrives: small, keen and unpaid. | Because the post is now empty. | **Bureau file:** The replacement: Zib. Unpaid. Their only reference is from their mum.<br>**Dossier du Bureau :** La relève : Zib. Non payé. Seule référence : sa maman. | Hard cut, slow push-in on Zib from behind Vrell's shoulder. A two-note hello. Cut. |
| 5. The Keys | Hangar. Vrell, mug in hand, drops a keyring with a tiny saucer fob into Zib's cupped hands. Behind them the dented saucer sits in its mint ring with a sticking plaster on the rim. | Zib gets the saucer, such as it is. | Because someone has to fly tonight. | **Vrell:** “The keys. That bandage is load-bearing. Do not peel it.”<br>**Vrell :** « Voici les clés. Ce pansement est porteur. N’y touchez pas. » | Cut. Hold the two-shot, then a small push onto the keys and the patched saucer. Key jingle. Cut. |
| 6. The Launch | From inside the bay doors: the saucer flies crookedly out towards Earth, Zib in the dome, scarf fluttering out, mint smoke rings behind. Far below, one farmhouse window glows amber. | Zib leaves on their first shift. | Because the keys are theirs now. | **Vrell:** “Route 9. One farmer, fast asleep. Mind the power lines, Zib.”<br>**Vrell :** « Route 9. Un fermier qui dort. Évitez les lignes électriques, Zib. » | Cut tight on Zib, sweep back and roll level as the saucer sputters out, then iris in on the farmhouse. Sputter, then the iris tone. Hands over to L1. |

### Shots

#### `opening_1` · The Incident

- **Cue:** Open on Krix admiring his watch. Slow drift down and right reveals the sleeper, the toaster and the power lines he is not looking at. Cut on the move.
- **Who:** `narration`
- **Line EN:** Incident report: last quarter’s intern. Routine pickup. Eyes on his watch. (72 characters)
- **Line FR:** Rapport d’incident : le stagiaire d’avant. Routine. Les yeux sur sa montre. (77 characters)
- **Caption:** `capIn` 0.55, `capOut` 3.05, `holdAt` 2.6, `read` 6.1 s
- **Action length:** 3.2 s
- **Camera keys:** `[[0, 0.47, 0.3, 1.56, 0], [3.2, 0.57, 0.55, 1.14, 0, 'drift']]`
- **Transition in:** fade from black, 0.45 s
- **Effects:** none
- **Sound cues:** `clock_tick` at 1.05, `clock_tick` at 1.45
- **Keyframe (painted):** `/home/stone/.t3/userdata/providers/antigravity/ac0a3dfd6dddb20962cecff6ee5fe65e19d3923be20e52c5ab52ff877f7e4c32/antigravity-acp/brain/30523260-acaf-4ffc-befb-41ecbe06ee97/shot1_incident_1795820658703.jpg`

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

KRIX: a slim adult mint-green alien (#64c5a1), a head taller than Zib, with pointed ears, two antennae ending in mint bulbs, large round gold-rimmed glasses, a sleek charcoal turtleneck, dark trousers and a wristwatch.
THE SAUCER: a battered retro 1950s flying saucer in teal and mint riveted metal with a clear glass dome, alternating warm amber and mint rim lights, three short landing legs, and a dent on its rim covered by two crossed beige sticking plasters.

THE FRAME: Wide low-angle night shot of a quiet small-town street: cosy houses with lit porches, picket fences, dark trees, wooden utility poles with overhead power lines crossing the frame. The saucer hovers crookedly in the upper half. Through its dome, smug Krix glances at his wristwatch instead of watching where he flies. A translucent mint tractor beam shines down from the saucer and holds a snoring middle-aged man in striped pyjamas in mid-air, tightly hugging a shiny chrome two-slice toaster in his sleep, drifting perilously close to the power lines. Krix sits at about 45% across and 28% down; the sleeper at about 62% across and 55% down.
```

#### `opening_2` · The Zap

- **Cue:** Smash cut into the spark: white-amber flash and a two-frame shake. Whip down to the sleeper, still asleep, as the toast pops. The neighbour gets the photo.
- **Who:** `narration`
- **Line EN:** The power lines were solid. The bread was toast. So was he. (61 characters)
- **Line FR:** Les lignes électriques étaient solides. Le pain était grillé. Lui aussi. (73 characters)
- **Caption:** `capIn` 0.5, `capOut` 2.6, `holdAt` 2.4, `read` 5.9 s
- **Action length:** 2.8 s, plus a 0.6 s hold before the next shot
- **Camera keys:** `[[0, 0.3, 0.34, 1.62, 0], [0.45, 0.31, 0.35, 1.58, 0, 'linear'], [1.8, 0.56, 0.62, 1.12, 0, 'inOutCubic'], [3.4, 0.575, 0.63, 1.07, 0, 'linear']]`
- **Transition in:** smash
- **Effects:** flash + shake (part of the smash cut) at 0; bloom at (0.815, 0.645), the neighbour's camera at 2
- **Sound cues:** `crash` at 0, `pickup` at 0.55, `camera_focus` at 2
- **Keyframe (painted):** `/home/stone/.t3/userdata/providers/antigravity/ac0a3dfd6dddb20962cecff6ee5fe65e19d3923be20e52c5ab52ff877f7e4c32/antigravity-acp/brain/30523260-acaf-4ffc-befb-41ecbe06ee97/shot2_zap_1795820694689.jpg`

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

KRIX: a slim adult mint-green alien (#64c5a1), a head taller than Zib, with pointed ears, two antennae ending in mint bulbs, large round gold-rimmed glasses, a sleek charcoal turtleneck, dark trousers and a wristwatch.
THE SAUCER: a battered retro 1950s flying saucer in teal and mint riveted metal with a clear glass dome, alternating warm amber and mint rim lights, three short landing legs, and a dent on its rim covered by two crossed beige sticking plasters.

THE FRAME: Dynamic medium action shot at night on the same street. The saucer tilts sharply as its metal rim slams into the overhead power lines in a bright burst of golden-amber sparks and arcs at the upper left. Inside the dome, Krix is startled, eyes wide behind his round gold glasses. Below, the mint tractor beam breaks into shards and cuts out as the pyjama-clad sleeping man lands softly in a front-yard bush at the lower left, still asleep and still hugging his chrome toaster; two golden slices of toast pop out of it with little puffs of smoke. On the right edge, a warm porch light is on over a front door and a startled neighbour in a checked bathrobe raises a vintage camera with a bright white flash going off. The spark sits at about 26% across and 32% down; the sleeper at 40% across and 78% down; the camera flash at 81% across and 64% down.
```

#### `opening_3` · Fired

- **Cue:** Dissolve to the office. The stamp lands with a thud. Pan right from a furious Vrell, past the charred toaster, to Krix strolling out to the OBELISK™ limo with the client list.
- **Who:** `narration`
- **Line EN:** Vrell fired him. Someone else snapped him up before the ink dried. (57 characters)
- **Line FR:** Vrell l’a viré. Quelqu’un d’autre l’a récupéré avant que l’encre sèche. (62 characters)
- **Caption:** `capIn` 0.9, `capOut` 3.3, `holdAt` 3.2, `read` 5.1 s
- **Action length:** 3.5 s
- **Camera keys:** `[[0, 0.34, 0.54, 1.5, 0], [0.95, 0.345, 0.545, 1.48, 0, 'linear'], [3.15, 0.632, 0.56, 1.36, 0, 'inOutSine'], [3.5, 0.632, 0.56, 1.35, 0, 'linear']]`
- **Transition in:** dissolve, 0.6 s
- **Effects:** stamp at 0.78
- **Sound cues:** `stamp` at 0.78
- **Keyframe (painted):** `/home/stone/.t3/userdata/providers/antigravity/ac0a3dfd6dddb20962cecff6ee5fe65e19d3923be20e52c5ab52ff877f7e4c32/antigravity-acp/brain/30523260-acaf-4ffc-befb-41ecbe06ee97/shot3_fired_1795820705212.jpg`

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
KRIX: a slim adult mint-green alien (#64c5a1), a head taller than Zib, with pointed ears, two antennae ending in mint bulbs, large round gold-rimmed glasses, a sleek charcoal turtleneck, dark trousers and a wristwatch.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.
THE EVIDENCE BOX: a clear glass display box holding a scorched chrome two-slice toaster with faint smoke stains.
THE LIMO: a sleek matte-black futuristic space limousine with one small glowing lilac upright rectangle on its side.

THE FRAME: Medium interior shot of the office. On the left, behind the desk and under the amber lamp, a furious Vrell (glasses crooked, brow furrowed) slams a heavy wooden rubber stamp down onto a clipboard. The evidence box with the scorched, lightly smoking toaster sits on the near right corner of the desk. On the right, smug Krix walks nonchalantly out through the open metal hangar door, hiding a rolled-up cream map scroll behind his back. Through the doorway, in the dark outside, waits the limo. Vrell sits at about 34% across and 50% down; Krix at 78% across and 48% down; the toaster at 62% across and 80% down.
```

#### `opening_4` · The Recruit

- **Cue:** Hard cut. From behind Vrell's coffee, a slow push-in on Zib in the doorway: suitcase, scarf, envelope, far too happy to be here.
- **Who:** `narration`
- **Line EN:** The replacement: Zib. Unpaid. Their only reference is from their mum. (69 characters)
- **Line FR:** La relève : Zib. Non payé. Seule référence : sa maman. (58 characters)
- **Caption:** `capIn` 0.35, `capOut` 2.85, `holdAt` 2.5, `read` 5.6 s
- **Action length:** 3 s
- **Camera keys:** `[[0, 0.5, 0.5, 1.04, 0], [3, 0.555, 0.5, 1.45, 0, 'outSine']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** `pickup` at 0.12
- **Keyframe (painted):** `/home/stone/.t3/userdata/providers/antigravity/ac0a3dfd6dddb20962cecff6ee5fe65e19d3923be20e52c5ab52ff877f7e4c32/antigravity-acp/brain/30523260-acaf-4ffc-befb-41ecbe06ee97/shot4_zib_arrives_1795820683866.jpg`

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.

THE FRAME: Warm backlit medium shot from inside the office, looking towards the tall metal hangar doorway. Backlit by cool mint corridor light, Zib steps eagerly over the threshold, holding a battered cardboard suitcase in one hand and holding out a cream manila envelope with the other. In the lower-left foreground, as a soft silhouette, Vrell's purple shoulder, the edge of his glasses and a coffee mug on the desk frame the shot like a reverse angle. Zib stands at about 56% across and 50% down.
```

#### `opening_5` · The Keys

- **Cue:** Cut. Hold the two-shot: tired eyes against huge ones. Then a small push onto the dangling keys and the patched saucer behind them.
- **Who:** `vrell`
- **Line EN:** “The keys. That bandage is load-bearing. Do not peel it.” (55 characters)
- **Line FR:** « Voici les clés. Ce pansement est porteur. N’y touchez pas. » (58 characters)
- **Caption:** `capIn` 0.35, `capOut` 2.95, `holdAt` 2.7, `read` 5.1 s
- **Action length:** 3.1 s
- **Camera keys:** `[[0, 0.5, 0.56, 1.2, 0], [1, 0.505, 0.565, 1.22, 0, 'linear'], [3.1, 0.545, 0.632, 1.36, 0, 'inOutSine']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** `pickup` at 1
- **Keyframe (painted):** `/home/stone/.t3/userdata/providers/antigravity/ac0a3dfd6dddb20962cecff6ee5fe65e19d3923be20e52c5ab52ff877f7e4c32/antigravity-acp/brain/30523260-acaf-4ffc-befb-41ecbe06ee97/shot5_keys_1795820641555.jpg`

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE SAUCER: a battered retro 1950s flying saucer in teal and mint riveted metal with a clear glass dome, alternating warm amber and mint rim lights, three short landing legs, and a dent on its rim covered by two crossed beige sticking plasters.
THE HANGAR: a curved dark-indigo orbital hangar bay with round amber ceiling lights, amber strip lights around its doors and a glowing mint docking ring on the floor.

THE FRAME: Expressive close two-shot inside the hangar. On the left, a profoundly tired Vrell (deadpan sigh, glasses low, steaming coffee mug in one hand) drops a dangling metal keyring with a tiny saucer-shaped fob into Zib's eagerly cupped hands on the right; Zib beams. Through a wide window directly behind them sits the saucer in its glowing mint docking ring, its crossed sticking plasters clearly visible. Vrell's face is at about 28% across and 48% down; Zib's at 76% across and 66% down; the keys at 55% across and 72% down; the saucer at 62% across and 40% down.
```

#### `opening_6` · The Launch

- **Cue:** Cut tight on Zib and sweep back, rolling level, as the saucer sputters out of the bay. Iris in on the one lit farmhouse on Route 9 and hold it.
- **Who:** `vrell`
- **Line EN:** “Route 9. One farmer, fast asleep. Mind the power lines, Zib.” (60 characters)
- **Line FR:** « Route 9. Un fermier qui dort. Évitez les lignes électriques, Zib. » (65 characters)
- **Caption:** `capIn` 0.35, `capOut` 2.55, `holdAt` 2, `read` 5.6 s
- **Action length:** 3.9 s
- **Camera keys:** `[[0, 0.56, 0.4, 1.75, -4], [1.9, 0.5, 0.5, 1, 0, 'outCubic'], [2.05, 0.5, 0.5, 1, 0, 'linear'], [3.3, 0.645, 0.688, 1.6, 0, 'inOutCubic'], [3.9, 0.645, 0.688, 1.6, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** iris onto (0.645, 0.775), the farmhouse, closing by 3.3 at 2.05
- **Sound cues:** `beam_on` at 0.02, `beam_off` at 2.05
- **Keyframe (painted):** `/home/stone/.t3/userdata/providers/antigravity/ac0a3dfd6dddb20962cecff6ee5fe65e19d3923be20e52c5ab52ff877f7e4c32/antigravity-acp/brain/30523260-acaf-4ffc-befb-41ecbe06ee97/shot6_launch_v3_1795820693260.jpg`

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE SAUCER: a battered retro 1950s flying saucer in teal and mint riveted metal with a clear glass dome, alternating warm amber and mint rim lights, three short landing legs, and a dent on its rim covered by two crossed beige sticking plasters.
THE HANGAR: a curved dark-indigo orbital hangar bay with round amber ceiling lights, amber strip lights around its doors and a glowing mint docking ring on the floor.

THE FRAME: Dramatic wide shot looking out from inside the open orbital hangar bay doors (amber strip lights around the opening) towards the dark, starry curve of Earth below. The saucer flies crookedly and enthusiastically out of the bay towards Earth, tiny excited Zib visible inside the glowing dome, one end of their pink-and-gold scarf fluttering out from under the dome edge. It sputters a trail of glowing mint smoke rings and sparkles. Far below, in dark green-blue countryside, a single farmhouse glows warm amber. The saucer sits at about 58% across and 42% down; the farmhouse at 64% across and 77% down.
```

### Continuity check

- Sets up: Krix by face only (the captions say "last quarter's intern"), the toaster, the power lines, the client list (the rolled map), a nameless rival (the black limo with its lilac upright-rectangle emblem), the evidence box, Zib's scarf and mother, the bandage, Route 9.
- Tokens: no `Krix`, no `OBELISK™`, no pay word. Film 1 is tied to L1 (during) in `tests/ui-copy-helpers.ts`, so `tests/ui-copy-continuity.test.ts` checks it.
- Pays off later: the face and the limo pay off in `prior_art_3`, where Krix stands by the same limo with the client list and the toaster; that is the first time the films name him and the firm.
- The neighbour with the camera in `opening_2` is deliberately unrecognisable (bathrobe, back-lit, face hidden by the camera). It is not Mrs. Pruitt: she is introduced cleanly in #0004.
- "The bread was toast" does not match the `toaster` gag counter (cap 11, already at 11). No line in any film may contain the word "toaster"; the picture carries it.
- Hands over to: the L1 memo ("Last quarter's intern returned a man still clutching his toaster") and the farmhouse on Route 9.

Film 1 notes for the build: the sound names above map the animatic's own cues (tick, zap, pop, shutter, thud, hello, keys, sputter, iris) onto the game's sounds and are a proposal; the lines, timings and camera keys are the approved ones. `holdAt` is new (the animatic had none). Three keys sit outside the vertical bounds and rely on the engine's clamp, exactly as they did in the approved animatic, which clamped them the same way: the start of `opening_1` (y 0.30 at ×1.56, limit 0.321) and the last two keys of `opening_2` (y 0.62 at ×1.12 and y 0.63 at ×1.07, limits 0.554 and 0.533). Film 1 is already being built in `src/ui/films.ts`; where its caption windows and `holdAt` values differ from the animatic's (for instance the last caption ending before the iris starts), the built values stand.

## Film 2: Off Probation (`probation`)

- **Title card:** Off Probation / Fin de période d’essai. Sub-line: Season 1 · Birch Lane, next / Saison 1 · Chemin des Bouleaux.
- **Trigger:** After the first delivery report of L2 (Spin City), before the Field Check offer.
- **Logline:** Zib delivers Larry so cleanly that Vrell has nothing to stamp; Head Office answers by asking for three sleepers in one night, so Vrell issues the cheapest lanyard in the galaxy and two small calls on Birch Lane first.
- **Status:** Painted (2026-11-28) and built in `src/ui/films.ts`. Camera fitted to the painted frames by the director.
- **Length:** 6 shots, 19.6 s authored, about 41.233 s with the reading holds.

### Storyboard

| Shot | We see | What changes | Why now | Line (EN / FR) | Camera and sound |
| --- | --- | --- | --- | --- | --- |
| 1. The Hold | Hangar. The saucer is docked with its belly hatch open; odd socks pour out in a slide. Larry sleeps on top of the heap, mug in hand. Zib stands beside it and salutes. | Zib's second delivery arrived asleep and unharmed (plus the laundromat's socks). | Opening image: the result of the shift the player just flew. | **Bureau file:** Shift two. One laundromat clerk, delivered asleep. Plus forty odd socks.<br>**Dossier du Bureau :** Deuxième nuit. Un veilleur de laverie, livré endormi. Et quarante chaussettes. | Open on Zib's salute, drift left and out to reveal the sock slide and Larry. One snore. Cut. |
| 2. Nothing to Stamp | Office. Vrell holds his stamp in the air over a clean, blank form and cannot find a reason to bring it down. On the desk, next to the box with Krix's toaster, stands a second glass box: empty, polished, with a little cushion. | Vrell expected to fire a second intern and has no grounds. | Because the delivery was clean. | **Vrell:** “No bruises. No lawsuit. And I had a display case ready for you.”<br>**Vrell :** « Ni bleus, ni procès. Dire que je vous avais préparé une vitrine. » | Cut. Hold on the hovering stamp, then pan right past the toaster to the empty box. One clock tick. Cut. |
| 3. The Tube | A brass canister has just dropped out of the pneumatic tube onto the desk. Vrell reads the order from it: a sheet with three little houses drawn in a row and a red star seal. His glasses slide; his mug tips. Zib peeks in, delighted. | Head Office raises the quota to three sleepers in one night. | But a clean report gets noticed upstairs. | **Bureau file:** Head Office read the report. Now it wants three sleepers in one night.<br>**Dossier du Bureau :** Le siège a lu le rapport. Il veut maintenant trois dormeurs en une nuit. | Cut on the canister landing: a thud and a small jolt, then a soft alert. Push in on the three houses. Cut. |
| 4. The Lanyard | Vrell lowers a lanyard over Zib's bowed head like a medal: hazard tape, a blank card, a paperclip. Zib glows. | Zib is off probation, with the cheapest badge the Bureau has. | Because of that, a trainee can't fly it: Vrell has to promote them. | **Zib:** “A real lanyard! Should it say TEMPORARY on both sides?”<br>**Zib :** « Un vrai badge ! C’est normal, PROVISOIRE écrit des deux côtés ? » | Cut. Start on the two-shot, push in on the card and Zib's face. A soft pickup chime as it lands. Cut. |
| 5. Two Calls First | The wall map of the town, drawn with no words. At the top, three red pins in a ring of houses. Vrell's pointer taps two small amber pins on the lane below them: a loaf and a garage door. Zib looks up, lanyard on. | Vrell hedges: two small calls before the big order. | But he doesn't trust a two-shift pilot with three houses. | **Vrell:** “The suburbs can wait. First, two small live calls: a baker and a garage.”<br>**Vrell :** « La banlieue attendra. D’abord deux missions : une boulangère, un garage. » | Cut. Start on the three red pins, tilt down-left to the two amber pins as the pointer taps them. Cut. |
| 6. Birch Lane | Dusk over a quiet lane. The saucer hangs small in the sky. Below: Larry's laundromat van parked at the turn, a bakery with a warm window and a cat on its roof, and a porch whose light has just come on, throwing a hard-edged cone on the path. | Zib is over Birch Lane; the first new hazard is lit. | Because that is where the two calls are. | **Vrell:** “Birch Lane. The porch lights bite. Take the practice drill. Or don't.”<br>**Vrell :** « Chemin des Bouleaux. Les lampes mordent. Faites l’exercice. Ou pas. » | Cut tight on the saucer, sweep down the lane, push in on the porch as its light snaps on, iris onto the light. Hands over to the Field Check offer. |

### Shots

#### `probation_1` · The Hold

- **Cue:** Fade in on Zib's proud salute (Zib stands at 78% across, 53% down). Drift left and widen to the whole frame by 2.5 s: the sock slide from the hatch, Larry asleep on the heap at the left with his mug, Zib still saluting at the right. Creep in a touch and cut while still moving.
- **Who:** `narration`
- **Line EN:** Shift two. One laundromat clerk, delivered asleep. Plus forty odd socks. (72 characters)
- **Line FR:** Deuxième nuit. Un veilleur de laverie, livré endormi. Et quarante chaussettes. (78 characters)
- **Caption:** `capIn` 0.5, `capOut` 2.78, `holdAt` 2.6, `read` 6.2 s
- **Action length:** 3.2 s
- **Camera keys:** `[[0, 0.76, 0.53, 1.6, 0], [2.5, 0.5, 0.5, 1, 0, 'inOutSine'], [3.2, 0.5, 0.5, 1.02, 0, 'linear']]`
- **Transition in:** fade from black, 0.45 s
- **Effects:** none
- **Sound cues:** `snore` at 0.6

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
LARRY: a human man in his thirties with messy brown hair and a pointed nose, in a slate-blue polo shirt with a small blank name tag, fast asleep with his mouth open and a coffee mug in his hand.
THE SAUCER: a battered retro 1950s flying saucer in teal and mint riveted metal with a clear glass dome, alternating warm amber and mint rim lights, three short landing legs, and a dent on its rim covered by two crossed beige sticking plasters.
THE HANGAR: a curved dark-indigo orbital hangar bay with round amber ceiling lights, amber strip lights around its doors and a glowing mint docking ring on the floor.

THE FRAME: Medium-wide shot inside the hangar. The saucer is docked in its mint ring in the upper centre-right of the frame, its round belly hatch open. A slide of mismatched odd socks in many colours pours out of the hatch down to a soft heap on the floor at centre-left. Larry lies on top of the heap on his back, still asleep and still holding his mug upright. To the right of the heap, Zib stands at attention and salutes with huge pride, one stray sock hanging from an antenna. The saucer sits at about 55% across and 26% down; Larry at 40% across and 50% down; Zib at 72% across and 50% down. The floor in the bottom quarter is empty and dark.
```

#### `probation_2` · Nothing to Stamp

- **Cue:** Cut to Vrell, the stamp raised in his fist (56% across, 35% down) and the blank form under his other hand. Hold a beat on his search for a fault, then pan right and down and settle on the two boxes: the toaster in the middle of the screen, the empty box with its cushion and sparkle on the right (it is painted against the right edge, so it cannot sit centre).
- **Who:** `vrell`
- **Line EN:** “No bruises. No lawsuit. And I had a display case ready for you.” (63 characters)
- **Line FR:** « Ni bleus, ni procès. Dire que je vous avais préparé une vitrine. » (64 characters)
- **Caption:** `capIn` 0.5, `capOut` 2.76, `holdAt` 2.66, `read` 5.5 s
- **Action length:** 3 s
- **Camera keys:** `[[0, 0.47, 0.42, 1.5, 0], [1, 0.475, 0.425, 1.48, 0, 'linear'], [2.8, 0.725, 0.57, 1.4, 0, 'inOutSine'], [3, 0.725, 0.57, 1.41, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** `clock_tick` at 0.3

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.
THE EVIDENCE BOX: a clear glass display box holding a scorched chrome two-slice toaster with faint smoke stains.

THE FRAME: Medium shot across the desk. Vrell sits behind it at centre-left under the amber lamp, holding a heavy wooden rubber stamp raised in the air above a clipboard with a clean, completely blank cream form; he squints at the form, looking for something wrong and finding nothing. On the right half of the desk stand two glass display boxes side by side: the nearer one is the evidence box with the scorched toaster, and beside it a second identical box that is empty, freshly polished, with a small plum velvet cushion inside and a sparkle on its glass. Vrell's face is at about 36% across and 34% down; the raised stamp at 46% across and 30% down; the toaster box at 62% across and 52% down; the empty box at 80% across and 52% down.
```

#### `probation_3` · The Tube

- **Cue:** Cut on the canister on the desk under the tube mouth, with Vrell, the sheet and Zib's peek all in frame. After the jolt, push in on the order sheet (the three houses are at 63% across, 43% down) until it fills the middle of the screen, Zib still peeking at the right edge.
- **Who:** `narration`
- **Line EN:** Head Office read the report. Now it wants three sleepers in one night. (70 characters)
- **Line FR:** Le siège a lu le rapport. Il veut maintenant trois dormeurs en une nuit. (72 characters)
- **Caption:** `capIn` 0.6, `capOut` 2.68, `holdAt` 2.58, `read` 5.8 s
- **Action length:** 3 s
- **Camera keys:** `[[0, 0.58, 0.5, 1.2, 0], [0.5, 0.58, 0.5, 1.21, 0, 'linear'], [2.8, 0.63, 0.44, 1.7, 0, 'inOutSine'], [3, 0.63, 0.44, 1.71, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** stamp at 0.1
- **Sound cues:** `stamp` at 0.1, `alert` at 0.9

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.

THE FRAME: Medium shot of the desk from the front. The brass pneumatic tube comes down from the top centre of the frame; a brass canister with its lid popped open has just landed on the desk below it, with a puff of dust. Vrell, at centre-left, holds up the cream order sheet that came out of it: on the sheet, three simple little house pictograms in a row and a round red wax seal with a star. His glasses are sliding down, his eyes are wide for once, and the mug in his other hand is tipping and spilling. At the right edge, Zib peeks in from behind a filing cabinet, thrilled. The tube mouth is at about 50% across and 18% down; Vrell's face at 36% across and 42% down; the order sheet at 58% across and 40% down; Zib at 84% across and 50% down.
```

#### `probation_4` · The Lanyard

- **Cue:** Cut to the ceremony. Push slowly from the two-shot onto the card, which hangs between them just before it lands (61% across, 63% down), and Zib's bowed, shining face beside it (74% across, 53% down).
- **Who:** `zib`
- **Line EN:** “A real lanyard! Should it say TEMPORARY on both sides?” (54 characters)
- **Line FR:** « Un vrai badge ! C’est normal, PROVISOIRE écrit des deux côtés ? » (63 characters)
- **Caption:** `capIn` 0.4, `capOut` 2.98, `holdAt` 2.88, `read` 5.5 s
- **Action length:** 3.4 s
- **Camera keys:** `[[0, 0.56, 0.5, 1.25, 0], [3.2, 0.68, 0.55, 1.6, 0, 'inOutSine'], [3.4, 0.68, 0.55, 1.61, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** `pickup` at 1.4

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE LANYARD: a cheap lanyard made of amber-and-black hazard tape with a blank cream card held on by a paperclip.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.

THE FRAME: Close two-shot in the office, composed like a medal ceremony. On the left, Vrell, expressionless, lowers the lanyard with both stubby hands over Zib's head. On the right, Zib bows their head to receive it, eyes shining, hands clasped, antennae straight up. The lanyard is plainly the cheapest object in the room: hazard-tape ribbon, a blank cream card with an amber band along its top edge, a paperclip. Behind Vrell, at the left edge of the desk, an open wooden in-tray it came from. Vrell's face is at about 30% across and 34% down; Zib's face at 66% across and 44% down; the card at 66% across and 56% down.
```

#### `probation_5` · Two Calls First

- **Cue:** Cut to the three red pins and their string triangle (81% across, 17% down). Hold, then tilt down and left along the lane and ease out to the two amber pins (the loaf at 56%, 32%; the garage at 64%, 39%) with the pointer's tip on the loaf pin. The red ring stays in the top right corner; Zib's antennae rise into the bottom of the frame.
- **Who:** `vrell`
- **Line EN:** “The suburbs can wait. First, two small live calls: a baker and a garage.” (72 characters)
- **Line FR:** « La banlieue attendra. D’abord deux missions : une boulangère, un garage. » (76 characters)
- **Caption:** `capIn` 0.5, `capOut` 2.96, `holdAt` 2.86, `read` 6.6 s
- **Action length:** 3.2 s
- **Camera keys:** `[[0, 0.79, 0.28, 1.8, 0], [0.8, 0.785, 0.285, 1.8, 0, 'linear'], [2.8, 0.56, 0.4, 1.45, 0, 'inOutSine'], [3.2, 0.56, 0.4, 1.44, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** `clock_tick` at 2.6

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE LANYARD: a cheap lanyard made of amber-and-black hazard tape with a blank cream card held on by a paperclip.

THE FRAME: Close shot of a large cork wall map that fills the top two thirds of the frame: a hand-drawn bird's-eye plan of a small town in cream and ink, with no labels at all. Along the bottom of the map runs a main street with one green pin on a washing-machine pictogram, an odd sock hanging from the pin. From it a lane climbs to the upper right, with two small amber pins on it: one on a loaf-of-bread pictogram, one on a garage-door pictogram. At the top right the lane ends in a ring of little houses holding three red pins joined by red string. From the left edge, Vrell's stubby arm holds a wooden pointer whose tip rests on the two amber pins; only his arm and the edge of his body are in frame. In the lower right corner, small, Zib looks up at the map with the lanyard round their neck. The washing-machine pin is at about 30% across and 56% down; the loaf pin at 48% across and 40% down; the garage pin at 56% across and 31% down; the three red pins at 70% across and 16% down; Zib's head at 80% across and 66% down.
```

#### `probation_6` · Birch Lane

- **Cue:** Cut tight on the saucer, rolled a little (33% across, 17% down). Sweep down and back to the whole frame: the van at the bottom left, the bakery and its cat in the middle, the lit porch at the right. Hold, then push in on the porch (its lamp is at 83% across, 57% down). The lamp flares and the iris closes on it. The porch is painted lit from the first frame, so the bloom is a flare, not a switch-on.
- **Who:** `vrell`
- **Line EN:** “Birch Lane. The porch lights bite. Take the practice drill. Or don't.” (69 characters)
- **Line FR:** « Chemin des Bouleaux. Les lampes mordent. Faites l’exercice. Ou pas. » (67 characters)
- **Caption:** `capIn` 0.4, `capOut` 2.48, `holdAt` 1.7, `read` 5.7 s
- **Action length:** 3.8 s
- **Camera keys:** `[[0, 0.33, 0.29, 1.8, -3], [1.6, 0.5, 0.5, 1, 0, 'outCubic'], [1.75, 0.5, 0.5, 1, 0, 'linear'], [3, 0.76, 0.6, 1.6, 0, 'inOutCubic'], [3.8, 0.76, 0.6, 1.6, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** bloom at (0.827, 0.565), the painted porch lamp, at 2.9; iris onto (0.82, 0.575), the lamp and the lit doorway, from 3, closed by 3.8
- **Sound cues:** `beam_on` at 0.05, `porch_light` at 2.9

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE SAUCER: a battered retro 1950s flying saucer in teal and mint riveted metal with a clear glass dome, alternating warm amber and mint rim lights, three short landing legs, and a dent on its rim covered by two crossed beige sticking plasters.

THE FRAME: High-angle dusk view of a quiet suburban lane that runs from the bottom left of the frame up to the right, under a deep indigo sky with a last amber band on the horizon. At the upper left, small, the saucer hovers with Zib visible in the dome. At the bottom-left turn of the lane, a boxy laundromat delivery van is parked, with a washing-machine pictogram on its side. Half-way up the lane stands a small bakery with a warm amber shop window and a cat sitting on its roof ridge in silhouette. Further right, a house with a front porch: its porch lamp is lit and throws a cone of amber light with a clear hard edge onto the garden path. Every other window in the lane is dark. The saucer is at about 30% across and 17% down; the van at 22% across and 66% down; the bakery at 56% across and 44% down; the cat at 58% across and 36% down; the porch lamp at 74% across and 50% down.
```

### Continuity check

- Pays off: Larry and the odd-sock hoard from the L2 shift and its report ("Accounting traced forty socks to your saucer"); the toaster box from film 1 (the empty second box is the same joke, turned on Zib); the L1 memo's "Pass probation and we might even issue you a lanyard".
- Sets up: the pneumatic tube (it comes back in film 3), the lanyard (returned in film 4, kept in film 5), the wall map.
- Canon: the lanyard is issued on Larry's report whether or not the Field Check is taken (GDD-11). Zib is still unpaid: the lines say "live calls", never "paid". The Field Check stays optional ("Take the practice drill. Or don't.").
- Tokens: `temporary lanyard` (EN "temporary lanyard", FR "badge provisoire") is `notBefore level2 after`, so it is allowed here; the lines do not need the exact phrase anyway. `pay` is not matched in EN or FR. No `Krix`, no `OBELISK™`, no `Bubbles`: the film plays before L5 and L7. No "toaster" in a line.
- Running jokes on screen: the lanyard, the toaster box, the socks (picture only). The "cats are management" gag is left to the bakery itself; the cat on the roof is only a picture.
- Hands over to: the Field Check offer, then Work Order #0003 (the bakery) and #0004 (the garage).

## Film 3: Prior Art (`prior_art`)

- **Title card:** Prior Art / Antériorité. Sub-line: Season 1 · Patent Valley, very early / Saison 1 · Vallée des brevets, très tôt.
- **Trigger:** After the first delivery report of L7 (SS Buffet Royale). It unlocks L8.
- **Logline:** The manifest in the Captain's jacket is signed by Krix: he has sent an OBELISK™ slab three million years back so that apes patent the Bureau's beam, the royalty bills are already arriving, and Vrell breaks open Basement B-4 to send Zib after him.
- **Status:** Painted (Astra, 2026-11-28) and reviewed by the director; cameras fitted to the painted frames. Built in `src/ui/films.ts`.
- **Length:** 6 shots, 20.1 s authored, about 43.6 s with the reading holds.

### Storyboard

| Shot | We see | What changes | Why now | Line (EN / FR) | Camera and sound |
| --- | --- | --- | --- | --- | --- |
| 1. The Jacket | Bureau intake bench. Captain Sterling sleeps sitting up. Zib, wearing his captain's cap, lifts a folded paper out of his jacket with two fingers. | The Bureau has the ship's manifest. | Opening image: the debrief the L7 memo promised ("we'll check his pockets"). | **Bureau file:** Debrief. The Captain slept through it. His jacket had more to say.<br>**Dossier du Bureau :** Débriefing. Le commandant a dormi tout du long. Sa veste, elle, a parlé. | Open on the snoring Captain, slide right to Zib's fingers and the paper. One snore. Cut. |
| 2. The Signature | Close on the manifest in Vrell's hands under the lamp: a drawing of a black slab in a crate, a lilac seal shaped like the slab, and a signature that is a one-stroke doodle of a smug face with antennae and round glasses. Behind it, out of focus, the toaster in its box. | The buyer of the museum's stone is OBELISK™, and Krix signed for it. | Because of the paper in the jacket. | **Vrell:** “The museum's black rock. Bought by OBELISK™. Signed… Krix.”<br>**Vrell :** « La pierre noire du musée. Achetée par OBELISK™. Signé… Krix. » | Cut. Start on the drawn slab and its seal, push down and in on the doodle signature. A soft focus click, then an alert. Dissolve out. |
| 3. The Racket | A dry riverbed long before people. Krix leans on the black limo with the client-list map unrolled and the toaster under his arm, checking his watch. Beside him the black slab stands upright; three apes crowd round it, and the one in stone spectacles already holds a tablet and a stamp. | We learn what Krix did with the stone and the client list: he made apes the owners of the beam. | Because his signature raises the question: what did he want a rock for? | **Bureau file:** His slab went back three million years. The apes just patented our beam.<br>**Dossier du Bureau :** Sa dalle a remonté trois millions d’années. Les singes ont breveté notre rayon. | Dissolve in on Krix checking his watch (as in film 1). Pan left to the slab and the apes. A low hum. Cut. |
| 4. The Royalties | The office. The pneumatic tube spews a fountain of bills, each with the lilac slab seal. Vrell is buried to the chest, one bill stuck to his glasses. Zib has one on an antenna. Through the window, a bill is stuck across the saucer's bandage. | The patent is already costing the Bureau: it will be billed for every beam it ever fired. | Because the apes own the beam and Krix owns the apes' lawyers. | **Vrell:** “Royalties. On every beam we ever fired. Backdated to the Stone Age.”<br>**Vrell :** « Des droits sur chaque rayon tiré. Rétroactifs jusqu’à l’âge de pierre. » | Cut on the tube erupting, with a soft alert. Drop from the tube mouth to Vrell buried in paper. Cut. |
| 5. Basement B-4 | A basement corridor. Vrell heaves on a crowbar wedged in the padlock of a hazard-striped vault door with a brass hourglass on it. Zib holds his mug for him with both hands. The padlock snaps. | Vrell breaks a rule himself: he opens the sealed time department. | Because the only way to stop a patent filed three million years ago is to get there first. | **Vrell:** “Temporal Dispatch. Sealed since 1985. Head Office must never know.”<br>**Vrell :** « Le Dispatch temporel. Scellé depuis 1985. Le siège ne doit jamais le savoir. » | Cut. Slow push on the padlock while the door creaks; it snaps with a crash and a jolt, then the frame settles. Cut. |
| 6. Three Million Years | Inside B-4. Dust sheets on the floor. Vrell at the chrono console, hand on the lever, the big dial glowing. Behind it the time gate is lit, and in it the riverbed with the black slab. The patched saucer tips into the gate with Zib in the dome. | Zib is sent back in time, off the books. | Because the door is open and the patent is filed before the night is out. | **Vrell:** “Get in, kid. Three million years back, and home before my coffee's cold.”<br>**Vrell :** « Montez, Zib. Trois millions d’années aller-retour. Mon café refroidit. » | Cut tight on the dial and the lever, sweep back to the gate, push through it and iris onto the slab. Ticks, then the gate's hum. Hands over to L8. |

### Shots

#### `prior_art_1` · The Jacket

- **Cue:** Fade in on the Captain's sleeping face. Slide right and down to the two green fingers easing the folded paper out of the jacket, with Zib under the Captain's cap.
- **Who:** `narration`
- **Line EN:** Debrief. The Captain slept through it. His jacket had more to say. (66 characters)
- **Line FR:** Débriefing. Le commandant a dormi tout du long. Sa veste, elle, a parlé. (72 characters)
- **Caption:** `capIn` 0.5, `capOut` 2.78, `holdAt` 2.68, `read` 5.8 s
- **Action length:** 3.2 s
- **Camera keys:** `[[0, 0.27, 0.34, 1.55, 0], [3, 0.52, 0.45, 1.4, 0, 'inOutSine'], [3.2, 0.52, 0.45, 1.41, 0, 'linear']]`
- **Transition in:** fade from black, 0.45 s
- **Effects:** none
- **Sound cues:** `snore` at 0.3
- **Keyframe (painted):** `public/film/prior_art/jacket.webp` (full size: `review/film-frames/prior_art_1.png`). Measured: the Captain's face (0.22, 0.30), the folded paper (0.45, 0.44), Zib's face (0.63, 0.43), the biscuit (0.53, 0.59), the saucer (0.55, 0.24). On model.

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
CAPTAIN STERLING: an older human man with white hair and a neat white moustache in a white cruise-ship captain's uniform with gold epaulettes and gold buttons.
THE LANYARD: a cheap lanyard made of amber-and-black hazard tape with a blank cream card held on by a paperclip.
THE HANGAR: a curved dark-indigo orbital hangar bay with round amber ceiling lights, amber strip lights around its doors and a glowing mint docking ring on the floor.

THE FRAME: Medium shot of a metal intake bench at the edge of the hangar, under one amber ceiling light. Captain Sterling sits on the bench at centre-left, asleep sitting up, head tilted back, mouth open under his moustache, bare-headed, a small square biscuit balanced on his knee. On the right, Zib, wearing the Captain's white peaked cap far too big over their antennae and the lanyard over the scarf, leans in on tiptoe and, with two fingers, delicately lifts a folded cream paper out of the inside pocket of the Captain's jacket. The Captain's face is at about 40% across and 34% down; the folded paper at 52% across and 50% down; Zib's face at 70% across and 46% down.
```

#### `prior_art_2` · The Signature

- **Cue:** Cut to the paper. Start on the drawing of the slab and the lilac seal, then push down the sheet until the doodled signature sits just above the caption.
- **Who:** `vrell`
- **Line EN:** “The museum's black rock. Bought by OBELISK™. Signed… Krix.” (58 characters)
- **Line FR:** « La pierre noire du musée. Achetée par OBELISK™. Signé… Krix. » (60 characters)
- **Caption:** `capIn` 0.5, `capOut` 2.68, `holdAt` 2.58, `read` 5.3 s
- **Action length:** 3 s
- **Camera keys:** `[[0, 0.55, 0.4, 1.4, 0], [0.6, 0.55, 0.4, 1.42, 0, 'linear'], [2.7, 0.5, 0.66, 1.55, 0, 'inOutSine'], [3, 0.5, 0.66, 1.57, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** `camera_focus` at 0.9, `alert` at 2.5
- **Keyframe (painted):** `public/film/prior_art/signature.webp` (full size: `review/film-frames/prior_art_2.png`). Measured: the slab drawing (0.42, 0.37), the lilac seal (0.70, 0.42), the doodle signature (0.52, 0.72, down to 0.77), the toaster box (0.84, 0.17). The signature is painted lower than the prompt asked, so the push ends at focus y 0.66 and holds it just above the caption.

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.
THE EVIDENCE BOX: a clear glass display box holding a scorched chrome two-slice toaster with faint smoke stains.
THE SLAB: a tall matte-black rectangular monolith with sharp edges and a thin lilac glow along one bevel, with no logo and no markings.

THE FRAME: Over-the-shoulder close-up of a cream shipping manifest held in Vrell's two stubby purple hands under the amber desk lamp. The sheet fills the middle of the frame and carries only blank ruled lines and three pictures: at its upper left, a small ink drawing of a tall black slab standing in an open wooden crate; at its upper right, a lilac wax seal in the shape of an upright rectangle; and at the bottom of the sheet, in gold ink, a signature that is a single-flourish doodle of a smug little face with two antennae and round glasses. In the upper-left foreground, out of focus, the edge of Vrell's head and glasses. In the upper-right background, out of focus, the evidence box with the toaster. The slab drawing is at about 38% across and 34% down; the lilac seal at 62% across and 36% down; the doodle signature at 55% across and 52% down; the toaster box at 80% across and 16% down.
```

#### `prior_art_3` · The Racket

- **Cue:** Dissolve to Krix in the same pose as the opening: eyes on his watch. Pan left, away from him, and settle on the slab with the three apes and the raised stamp.
- **Who:** `narration`
- **Line EN:** His slab went back three million years. The apes just patented our beam. (72 characters)
- **Line FR:** Sa dalle a remonté trois millions d’années. Les singes ont breveté notre rayon. (79 characters)
- **Caption:** `capIn` 0.9, `capOut` 3.18, `holdAt` 3.08, `read` 6.3 s
- **Action length:** 3.6 s
- **Camera keys:** `[[0, 0.74, 0.36, 1.6, 0], [0.9, 0.735, 0.36, 1.58, 0, 'linear'], [3.2, 0.35, 0.4, 1.3, 0, 'inOutSine'], [3.6, 0.35, 0.4, 1.29, 0, 'linear']]`
- **Transition in:** dissolve, 0.6 s
- **Effects:** none
- **Sound cues:** `beam_on` at 1.6
- **Keyframe (painted):** `public/film/prior_art/racket.webp` (full size: `review/film-frames/prior_art_3.png`). Measured: Krix's face (0.75, 0.25) and watch (0.80, 0.31), the slab (0.28, 0.08 to 0.58), Flint (0.17, 0.36), Reed (0.44, 0.26), Echo (0.46, 0.39), her tablet (0.47, 0.47) and stamp (0.55, 0.38), the limo's lilac mark (0.94, 0.36). Reed's bone sits in his hair, as in `adequate_1`.

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

KRIX: a slim adult mint-green alien (#64c5a1), a head taller than Zib, with pointed ears, two antennae ending in mint bulbs, large round gold-rimmed glasses, a sleek charcoal turtleneck, dark trousers and a wristwatch.
THE SLAB: a tall matte-black rectangular monolith with sharp edges and a thin lilac glow along one bevel, with no logo and no markings.
THE APES: three stocky cartoon apes with cream muzzles and big round eyes. FLINT has chestnut-brown fur and wears a grey stone flake like a flat cap. REED has tawny-gold fur and a small bone drumstick tucked behind one ear (he is the valley's drummer). ECHO has slate-blue fur and round spectacles carved from grey stone.
THE LIMO: a sleek matte-black futuristic space limousine with one small glowing lilac upright rectangle on its side.

THE FRAME: Wide shot of a dry prehistoric riverbed before sunrise: cracked ochre ground, bare rock ridges, giant ferns, a violet sky with a thin amber line on the horizon. At centre-left the slab stands upright, planted in the riverbed, three apes high. The three apes crowd around it: Flint presses a palm against it, Reed peers at it from behind, and Echo stands in front holding a flat stone tablet in one hand and a chunky stone stamp raised in the other. On the right, Krix leans against the front of the limo with the cream map scroll unrolled in one hand and a scorched chrome two-slice toaster tucked under the other arm, smugly checking his wristwatch and ignoring the apes. The slab is at about 36% across and 32% down; Flint at 22% across and 50% down; Echo at 46% across and 48% down; Reed at 30% across and 56% down; Krix at 74% across and 40% down; the limo at 88% across and 52% down.
```

#### `prior_art_4` · The Royalties

- **Cue:** Cut to the tube mouth as the bills burst out, with the saucer and the bill on its bandage in the window. Follow the bills down and left, past Zib, and settle on Vrell, chest-deep, with one stuck to his glasses.
- **Who:** `vrell`
- **Line EN:** “Royalties. On every beam we ever fired. Backdated to the Stone Age.” (67 characters)
- **Line FR:** « Des droits sur chaque rayon tiré. Rétroactifs jusqu’à l’âge de pierre. » (74 characters)
- **Caption:** `capIn` 0.5, `capOut` 2.68, `holdAt` 2.58, `read` 5.9 s
- **Action length:** 3 s
- **Camera keys:** `[[0, 0.68, 0.36, 1.4, 0], [2.6, 0.36, 0.44, 1.5, 0, 'inOutSine'], [3, 0.36, 0.44, 1.51, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** `alert` at 0.1, `stamp` at 1.2
- **Keyframe (painted):** `public/film/prior_art/royalties.webp` (full size: `review/film-frames/prior_art_4.png`). Measured: the tube mouth (0.50, 0.14), Vrell's face (0.30, 0.42) with the bill on his lens (0.39, 0.41), Zib's face (0.76, 0.44), the saucer in the window (0.86, 0.19) and the bill on its bandage (0.92, 0.19).

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.
THE SAUCER: a battered retro 1950s flying saucer in teal and mint riveted metal with a clear glass dome, alternating warm amber and mint rim lights, three short landing legs, and a dent on its rim covered by two crossed beige sticking plasters.
THE LANYARD: a cheap lanyard made of amber-and-black hazard tape with a blank cream card held on by a paperclip.

THE FRAME: Medium shot of the office in chaos. The brass pneumatic tube at the top centre of the frame spews a fountain of cream bills that fill the air and bury the desk; every bill is blank except for a small lilac wax seal in the shape of an upright rectangle. Vrell, at centre-left, is buried up to his chest in paper, arms pinned, one bill stuck flat across one lens of his glasses, more tired than alarmed. On the right, Zib, lanyard on, catches a bill in both hands with another speared on an antenna. Through the hangar window at the upper right, the saucer sits in its ring with a bill stuck across its crossed sticking plasters. The tube mouth is at about 50% across and 10% down; Vrell's face at 38% across and 42% down; Zib at 72% across and 50% down; the saucer at 76% across and 22% down. The bottom quarter is a drift of paper in shadow.
```

#### `prior_art_5` · Basement B-4

- **Cue:** Cut to the door, framed right of centre on the padlock. Push in as Vrell strains. On the snap, a small jolt; ease back a touch and hold on the chain.
- **Who:** `vrell`
- **Line EN:** “Temporal Dispatch. Sealed since 1985. Head Office must never know.” (66 characters)
- **Line FR:** « Le Dispatch temporel. Scellé depuis 1985. Le siège ne doit jamais le savoir. » (76 characters)
- **Caption:** `capIn` 0.4, `capOut` 3.08, `holdAt` 2.98, `read` 6.3 s
- **Action length:** 3.4 s
- **Camera keys:** `[[0, 0.56, 0.46, 1.2, 0], [2.3, 0.56, 0.45, 1.45, 0, 'inCubic'], [3.4, 0.56, 0.45, 1.4, 0, 'outSine']]`
- **Transition in:** cut
- **Effects:** stamp at 2.3
- **Sound cues:** `creak` at 0.4, `crash` at 2.3
- **Keyframe (painted):** `public/film/prior_art/basement.webp` (full size: `review/film-frames/prior_art_5.png`). Measured: the hourglass (0.57, 0.26), the padlock (0.57, 0.46), Vrell's face (0.31, 0.43), Zib's face (0.79, 0.46), the mug (0.69, 0.56). The painter put a chrono console in the corridor at the left edge (x 0.02 to 0.22), which belongs inside the vault: the camera never shows anything left of x 0.247, so it stays out of the film.

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
BASEMENT B-4: a low concrete-and-rivet basement with pipes, cobwebs and one bare amber bulb. Its chrono console is a waist-high bakelite-and-brass cabinet with one big round dial like an oversized kitchen timer (glowing mint rim, one brass needle, no numerals), a blank dark display window above the dial and a brass lever.
THE LANYARD: a cheap lanyard made of amber-and-black hazard tape with a blank cream card held on by a paperclip.

THE FRAME: Symmetrical medium shot down a low basement corridor lit by one bare amber bulb at the top of the frame. The corridor ends in a heavy round-cornered vault door painted with amber-and-black hazard chevrons, with a brass hourglass emblem at its centre, thick with dust and cobwebs, and held shut by a chain and one big padlock at its middle. On the left, Vrell heaves with both stubby arms on a long crowbar wedged into the padlock, straining, glasses askew: the only time we see him exert himself. On the right, Zib holds Vrell's steaming mug carefully with both hands and watches with enormous eyes. The hourglass emblem is at about 50% across and 30% down; the padlock at 50% across and 50% down; Vrell's face at 26% across and 42% down; Zib's face at 74% across and 52% down.
```

#### `prior_art_6` · Three Million Years

- **Cue:** Cut tight on the dial and Vrell's hand on the lever. Sweep up and back to show Vrell, the gate and the saucer tipping in, hold, then push through the ring. Iris onto the slab in the valley.
- **Who:** `vrell`
- **Line EN:** “Get in, kid. Three million years back, and home before my coffee's cold.” (72 characters)
- **Line FR:** « Montez, Zib. Trois millions d’années aller-retour. Mon café refroidit. » (70 characters)
- **Caption:** `capIn` 0.35, `capOut` 2.48, `holdAt` 2, `read` 5.9 s
- **Action length:** 3.9 s
- **Camera keys:** `[[0, 0.33, 0.52, 1.7, 0], [1.9, 0.45, 0.5, 1.02, 0, 'outCubic'], [2.05, 0.45, 0.5, 1.02, 0, 'linear'], [3.3, 0.7, 0.36, 1.7, 0, 'inOutCubic'], [3.9, 0.7, 0.36, 1.7, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** iris onto (0.72, 0.37), the slab seen through the gate, closing by 3.9 at 2.9
- **Sound cues:** `clock_tick` at 0.2, `clock_tick` at 0.7, `beam_on` at 1.9
- **Keyframe (painted):** `public/film/prior_art/three_million_years.webp` (full size: `review/film-frames/prior_art_6.png`). Measured: the dial (0.35, 0.57), the lever knob (0.33, 0.42), Vrell's face (0.18, 0.36), the gate's centre (0.66, 0.33), the saucer (0.54, 0.28), Zib in the dome (0.53, 0.19), the slab in the gate (0.72, 0.37).

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE SAUCER: a battered retro 1950s flying saucer in teal and mint riveted metal with a clear glass dome, alternating warm amber and mint rim lights, three short landing legs, and a dent on its rim covered by two crossed beige sticking plasters.
BASEMENT B-4: a low concrete-and-rivet basement with pipes, cobwebs and one bare amber bulb. Its chrono console is a waist-high bakelite-and-brass cabinet with one big round dial like an oversized kitchen timer (glowing mint rim, one brass needle, no numerals), a blank dark display window above the dial and a brass lever.
THE SLAB: a tall matte-black rectangular monolith with sharp edges and a thin lilac glow along one bevel, with no logo and no markings.

THE FRAME: Wide shot inside the basement chamber, dust sheets pulled to the floor. In the left foreground stands the chrono console, its big dial blazing mint; Vrell stands at it with one hand on the brass lever and his mug in the other. In the centre-right of the frame stands the time gate, an upright glowing mint ring as wide as the saucer. Inside the ring, instead of the basement wall, we see a dry prehistoric riverbed under a violet pre-dawn sky with one small black slab standing in it. The saucer is tipping nose-first into the ring, Zib in the dome leaning forward, one end of the scarf trailing out from under the dome. The dial is at about 26% across and 56% down; Vrell's face at 22% across and 38% down; the centre of the gate at 60% across and 38% down; the saucer at 55% across and 32% down; the small slab inside the gate at 63% across and 37% down.
```

### Continuity check

- Pays off film 1: Krix (shot 3 repeats his watch-checking pose), the toaster (in his arm, and in the box behind the manifest), the client list (the same rolled map, now unrolled in the riverbed), the OBELISK™ limo and its lilac slab.
- Pays off the levels: the black rock missing from Grimsby Museum (L4), the crate at Barnacle Bay (L5), the manifest in the Captain's jacket (L7 memo), "Bring a crowbar" (L7 first-clear line), the pneumatic tube from film 2.
- Reference: the apes round the black monolith (2001: A Space Odyssey), carried by the picture only. One reference in the film.
- Tokens: `Krix`, `OBELISK™` and `Temporal Dispatch` are all `notBefore level7 after`; this film plays after L7's first delivery, so they are allowed. `pay` not matched. No "toaster" in a line. No dawn or sunrise word (L8's clock is a countdown).
- Hands over to: Work Order #0010, Patent Valley. Echo and her stamp are shown but not named; the L8 memo names the apes.

## Film 4: Adequate (`adequate`)

- **Title card:** Hired / Embauché (working title: Adequate; Vrell's word is « correct » in French). Sub-line: Season 1 · Temporal Dispatch / Saison 1 · Dispatch temporel.
- **Trigger:** After the first delivery report of L8 (Patent Valley). It opens Work Order #0011 (1955).
- **Logline:** Three ape witnesses and two biscuits void the patent, OBELISK™'s own lawyers bill Krix for the bone, Vrell takes back the lanyard only to pin on a staff badge, and then the time dial starts humming by itself.
- **Status:** Painted (Astra, 2026-11-28) and reviewed by the director; cameras fitted to the painted frames. Built in `src/ui/films.ts`.
- **Length:** 6 shots, 19 s authored, about 40.2 s with the reading holds.

### Storyboard

| Shot | We see | What changes | Why now | Line (EN / FR) | Camera and sound |
| --- | --- | --- | --- | --- | --- |
| 1. The Witnesses | The intake bench. Flint, Reed and Echo sit in a row, each with a paper tag on the wrist and a square biscuit. Flint bites his, Reed sniffs his, Echo studies hers through her stone spectacles like a contract. | The three witnesses are in the Bureau, and they can be bought with biscuits. | Opening image: the result of the shift the player just flew. | **Bureau file:** Star witnesses, three million years old. One biscuit each.<br>**Dossier du Bureau :** Témoins clés, vieux de trois millions d’années. Un biscuit chacun. | Open on Flint, pan right along the bench to Echo and her biscuit. Cut on the move. |
| 2. Void | Echo brings her stone stamp down on a stone tablet carved with a saucer and its beam. The tablet cracks in two. She has one biscuit in her teeth and another in her free hand. | The patent on the beam is void, struck out by its own clerk. | Because the clerk who filed it is sitting on the Bureau's bench, eating its biscuits. | **Bureau file:** The patent clerk struck out the claim herself. The second biscuit helped.<br>**Dossier du Bureau :** La greffière a rayé le brevet elle-même. Le deuxième biscuit a aidé. | Smash cut on the stamp landing: flash, shake, a stamp thud. Drift down to the cracked tablet. Cut. |
| 3. The Bone Bill | A tall Bureau counter. On it, a big bone with an evidence tag. A bill unrolls from the counter, through Krix's hands and across the floor. Krix reads it: antennae limp, collar sagging, the toaster under his arm. | Krix loses: his own firm hands him the bill. | Because with the patent void, somebody has to pay for the slab, the apes and the bone. | **Bureau file:** OBELISK™ paid the costs. Then its lawyers billed Krix for the bone.<br>**Dossier du Bureau :** OBELISK™ a payé les frais. Puis ses avocats ont facturé l’os à Krix. | Cut. Start on the tagged bone, follow the bill down to Krix's face. A soft stamp. Cut. |
| 4. Hand It Over | The office. Vrell holds out a flat hand, stern. Zib clutches the hazard-tape lanyard to their chest with both hands, eyes huge and wobbling, antennae down. A small closed cream box sits on the desk between them. | It looks as if Zib is being let go. | But the win was run off the books, and Vrell's face gives nothing away. | **Vrell:** “Hand over the lanyard, Zib. It was only ever temporary.”<br>**Vrell :** « Rendez le badge, Zib. Il n’a jamais été que provisoire. » | Cut. Hold the two-shot, then a slow push onto Zib's worried face. No sound. Cut. |
| 5. Hired | Vrell pins a shiny mint saucer badge on Zib's scarf. The box is open and empty; the lanyard lies in the in-tray. Zib cries happy tears and holds a pay envelope with a glowing coin in it. Vrell looks away to hide a very small smile. | Zib is hired, with pay. Vrell said "adequate" and meant the opposite. | Because the lanyard had to go to make room for the real badge. | **Vrell:** “You're on the payroll. Head Office said genius. I said adequate.”<br>**Vrell :** « Vous voilà salarié. Le siège a dit : génial. Moi, j’ai dit : correct. » | Cut tight on the badge going on, pull back and up to both faces. The success chime. Cut. |
| 6. The Dial | Zib and Vrell freeze mid-celebration and look left. Through the open stairwell door, down the steps, the chrono console is awake: the dial blazes, its needle spinning, dust jumping off it. Nobody is near it. | Temporal Dispatch has a new date, and nobody asked for it. | But the dial they used once has not been switched off. | **Zib:** “Uh, Vrell? The time dial is humming. It says 1955.”<br>**Zib :** « Euh, Vrell ? Le cadran s’est mis à ronronner. Il affiche 1955. » | Cut on their frozen faces, whip left to the stairwell, push in on the dial, iris onto it. Ticks that speed up. Hands over to Work Order #0011. |

### Shots

#### `adequate_1` · The Witnesses

- **Cue:** Fade in on Flint chewing. Pan right along the bench, past Reed, and arrive on Echo reading her biscuit.
- **Who:** `narration`
- **Line EN:** Star witnesses, three million years old. One biscuit each. (70 characters)
- **Line FR:** Témoins clés, vieux de trois millions d’années. Un biscuit chacun. (68 characters)
- **Caption:** `capIn` 0.5, `capOut` 2.68, `holdAt` 2.58, `read` 5.4 s
- **Action length:** 3 s
- **Camera keys:** `[[0, 0.27, 0.4, 1.5, 0], [3, 0.73, 0.4, 1.5, 0, 'drift']]`
- **Transition in:** fade from black, 0.45 s
- **Effects:** none
- **Sound cues:** `pickup` at 0.4
- **Keyframe (painted):** `public/film/adequate/witnesses.webp` (full size: `review/film-frames/adequate_1.png`). Measured: Flint's face (0.22, 0.33), Reed's (0.44, 0.31), Echo's (0.75, 0.33), her biscuit (0.86, 0.30).

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

THE APES: three stocky cartoon apes with cream muzzles and big round eyes. FLINT has chestnut-brown fur and wears a grey stone flake like a flat cap. REED has tawny-gold fur and a small bone drumstick tucked behind one ear (he is the valley's drummer). ECHO has slate-blue fur and round spectacles carved from grey stone.
THE HANGAR: a curved dark-indigo orbital hangar bay with round amber ceiling lights, amber strip lights around its doors and a glowing mint docking ring on the floor.

THE FRAME: Medium shot of the metal intake bench at the edge of the hangar, under one amber ceiling light. The three apes sit side by side on the bench, feet not reaching the floor, each with a blank cream paper tag tied to one wrist and each holding a small square biscuit. On the left, Flint takes a huge bite of his. In the middle, Reed sniffs his suspiciously. On the right, Echo holds hers up at arm's length and examines it through her stone spectacles like a legal document. Flint is at about 26% across and 44% down; Reed at 50% across and 42% down; Echo at 74% across and 42% down.
```

#### `adequate_2` · Void

- **Cue:** Smash cut onto the stamp as it lands. After the shake, drift down and ease out to show the tablet split in two, Echo's face and the second biscuit.
- **Who:** `narration`
- **Line EN:** The patent clerk struck out the claim herself. The second biscuit helped. (73 characters)
- **Line FR:** La greffière a rayé le brevet elle-même. Le deuxième biscuit a aidé. (68 characters)
- **Caption:** `capIn` 0.5, `capOut` 2.48, `holdAt` 2.38, `read` 5.9 s
- **Action length:** 2.8 s
- **Camera keys:** `[[0, 0.48, 0.46, 1.7, 0], [0.4, 0.48, 0.465, 1.68, 0, 'linear'], [2.6, 0.53, 0.555, 1.2, 0, 'inOutSine'], [2.8, 0.53, 0.555, 1.19, 0, 'linear']]`
- **Transition in:** smash
- **Effects:** flash + shake (part of the smash cut) at 0
- **Sound cues:** `stamp` at 0, `crash` at 0.15
- **Keyframe (painted):** `public/film/adequate/void.webp` (full size: `review/film-frames/adequate_2.png`). Measured: Echo's face (0.52, 0.27), the stamp (0.47, 0.50), the cracked tablet (0.52, 0.64, down to 0.73), the second biscuit (0.75, 0.26). The tablet is painted lower than the prompt asked, so the drift ends wider (scale 1.2) to keep it above the caption.

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

THE APES: three stocky cartoon apes with cream muzzles and big round eyes. FLINT has chestnut-brown fur and wears a grey stone flake like a flat cap. REED has tawny-gold fur and a small bone drumstick tucked behind one ear (he is the valley's drummer). ECHO has slate-blue fur and round spectacles carved from grey stone.

THE FRAME: Close shot of Echo alone at a Bureau desk under the amber lamp (the slate-blue ape with the round stone spectacles; the other two apes are not in this frame). She brings a chunky stone stamp down hard with one fist onto a flat stone tablet lying on the desk. The tablet is carved with a simple pictogram of a flying saucer and its beam, and it is cracking cleanly in two under the stamp, with a burst of stone dust and chips. A square biscuit is clamped between her teeth and a second biscuit is held up in her other hand. Her face is at about 50% across and 28% down; the stamp and the cracking tablet at 50% across and 52% down; the second biscuit at 76% across and 38% down.
```

#### `adequate_3` · The Bone Bill

- **Cue:** Cut to the bone on the counter. Follow the bill as it runs off the counter and down, and stop on Krix's face as he reaches the total.
- **Who:** `narration`
- **Line EN:** OBELISK™ paid the costs. Then its lawyers billed Krix for the bone. (67 characters)
- **Line FR:** OBELISK™ a payé les frais. Puis ses avocats ont facturé l’os à Krix. (68 characters)
- **Caption:** `capIn` 0.5, `capOut` 2.78, `holdAt` 2.68, `read` 5.5 s
- **Action length:** 3.2 s
- **Camera keys:** `[[0, 0.26, 0.37, 1.6, 0], [0.6, 0.265, 0.372, 1.6, 0, 'linear'], [3, 0.6, 0.37, 1.5, 0, 'inOutSine'], [3.2, 0.6, 0.37, 1.5, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** `stamp` at 0.3
- **Keyframe (painted):** `public/film/adequate/bone_bill.webp` (full size: `review/film-frames/adequate_3.png`). Measured: the bone (0.22, 0.36), the lilac seal on the bill (0.50, 0.37), Krix's face (0.62, 0.29), the toaster (0.76, 0.44).

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

KRIX: a slim adult mint-green alien (#64c5a1), a head taller than Zib, with pointed ears, two antennae ending in mint bulbs, large round gold-rimmed glasses, a sleek charcoal turtleneck, dark trousers and a wristwatch.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.

THE FRAME: Medium shot at a tall wooden Bureau counter that fills the left third of the frame. On the counter top lies a large pale thigh bone with a blank cream evidence tag tied to it. A very long cream bill, blank except for one small lilac wax seal in the shape of an upright rectangle at its top, unrolls from the counter, passes through Krix's hands and runs on across the floor towards the camera. Krix stands at centre-right reading it, utterly deflated: antennae limp, round glasses askew, the collar of his turtleneck sagging, a scorched chrome two-slice toaster held under one arm. The bone is at about 30% across and 30% down; Krix's face at 58% across and 36% down; his hands and the bill at 54% across and 50% down; the toaster at 72% across and 46% down.
```

#### `adequate_4` · Hand It Over

- **Cue:** Cut to the two-shot, with Bubbles watching from her tank, and hold it a beat longer than is comfortable. Then push slowly onto Zib and the lanyard in their hands.
- **Who:** `vrell`
- **Line EN:** “Hand over the lanyard, Zib. It was only ever temporary.” (55 characters)
- **Line FR:** « Rendez le badge, Zib. Il n’a jamais été que provisoire. » (55 characters)
- **Caption:** `capIn` 0.4, `capOut` 2.68, `holdAt` 2.58, `read` 4.9 s
- **Action length:** 3 s
- **Camera keys:** `[[0, 0.53, 0.46, 1.12, 0], [0.7, 0.53, 0.46, 1.13, 0, 'linear'], [2.8, 0.68, 0.52, 1.45, 0, 'inOutSine'], [3, 0.68, 0.52, 1.46, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** none
- **Keyframe (painted):** `public/film/adequate/hand_it_over.webp` (full size: `review/film-frames/adequate_4.png`). Measured: Vrell's face (0.33, 0.37), his open hand (0.55, 0.48), Zib's face (0.74, 0.43), the lanyard (0.69, 0.56) and its card (0.67, 0.63), the closed box (0.48, 0.63), Bubbles' tank (0.52, 0.26).

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE LANYARD: a cheap lanyard made of amber-and-black hazard tape with a blank cream card held on by a paperclip.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.

THE FRAME: Two-shot across the desk in the office, lit low by the amber lamp. On the left, Vrell holds out one flat, open hand, palm up, face stern and unreadable. On the right, Zib clutches the lanyard against their chest with both hands, eyes enormous and glistening, antennae drooping, the scarf slipping off one shoulder. On the desk between them sits a small closed cream cardboard box. In the background on the office wall behind the desk, Bubbles the dolphin (slate blue, pale belly, big round cream eyes, a permanent smirk) watches from a brass-rimmed round porthole tank, a tiny desk lamp clipped to its rim. Vrell's face is at about 32% across and 36% down; his open hand at 46% across and 48% down; Zib's face at 68% across and 44% down; the lanyard in Zib's hands at 68% across and 54% down; the closed box at 50% across and 58% down.
```

#### `adequate_5` · Hired

- **Cue:** Cut tight on the mint badge as the pin goes into the scarf. Pull back until both faces are in frame, the tears and the hidden smile, with the lanyard in the in-tray just above the caption.
- **Who:** `vrell`
- **Line EN:** “You're on the payroll. Head Office said genius. I said adequate.” (64 characters)
- **Line FR:** « Vous voilà salarié. Le siège a dit : génial. Moi, j’ai dit : correct. » (77 characters)
- **Caption:** `capIn` 0.4, `capOut` 2.88, `holdAt` 2.78, `read` 5.9 s
- **Action length:** 3.2 s
- **Camera keys:** `[[0, 0.6, 0.52, 1.7, 0], [0.5, 0.6, 0.52, 1.68, 0, 'linear'], [3, 0.52, 0.5, 1.12, 0, 'outSine'], [3.2, 0.52, 0.5, 1.12, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** `success` at 0.6
- **Keyframe (painted):** `public/film/adequate/hired.webp` (full size: `review/film-frames/adequate_5.png`). Measured: the badge (0.60, 0.54), Vrell's face (0.30, 0.34), Zib's face (0.65, 0.42), the coin (0.82, 0.47), the open box (0.43, 0.67), the lanyard in the tray (0.72, 0.69), Bubbles' tank (0.52, 0.26).

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE STAFF BADGE: a small shiny mint enamel pin in the shape of a flying saucer.
THE LANYARD: a cheap lanyard made of amber-and-black hazard tape with a blank cream card held on by a paperclip.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.

THE FRAME: Close two-shot in the office, warmer than the shot before. On the left, Vrell pins the staff badge onto Zib's scarf with one stubby hand while looking away to the upper left, the corner of his mouth lifted in a very small smile he is trying to hide. On the right, Zib beams with happy tears streaming, mouth wide open, antennae straight up, and holds in one hand a cream pay envelope with a glowing mint coin poking out of it. On the desk behind them, the small cream box now open and empty, and the lanyard dropped in the wooden in-tray. Behind them on the office wall, Bubbles the dolphin smirks from her brass-rimmed round porthole tank and raises one flipper. Vrell's face is at about 30% across and 34% down; Zib's face at 64% across and 38% down; the badge on the scarf at 60% across and 52% down; the pay envelope at 80% across and 54% down.
```

#### `adequate_6` · The Dial

- **Cue:** Cut to the two faces, frozen, Zib pointing. Whip left through the open stairwell door and land tight on the console, so the caption covers the steps; creep in on the spinning dial. Iris onto the dial.
- **Who:** `zib`
- **Line EN:** “Uh, Vrell? The time dial is humming. It says 1955.” (50 characters)
- **Line FR:** « Euh, Vrell ? Le cadran s’est mis à ronronner. Il affiche 1955. » (62 characters)
- **Caption:** `capIn` 0.35, `capOut` 2.58, `holdAt` 2.2, `read` 5.4 s
- **Action length:** 3.8 s
- **Camera keys:** `[[0, 0.7, 0.4, 1.5, 0], [0.5, 0.7, 0.4, 1.5, 0, 'linear'], [1.7, 0.22, 0.275, 1.85, 0, 'inOutCubic'], [2.3, 0.22, 0.275, 1.87, 0, 'linear'], [3.2, 0.21, 0.27, 2.1, 0, 'inOutSine'], [3.8, 0.21, 0.27, 2.1, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** iris onto (0.21, 0.33), the dial, closing by 3.8 at 3
- **Sound cues:** `clock_tick` at 1.7, `clock_tick` at 2.2, `clock_tick` at 2.6, `clock_tick` at 2.9
- **Keyframe (painted):** `public/film/adequate/dial.webp` (full size: `review/film-frames/adequate_6.png`). Measured: Zib's face (0.58, 0.42), Vrell's face (0.80, 0.31), the dial (0.21, 0.33), the steps (y 0.41 to 0.55). The painter drew the steps rising from the office to the console; canon has them going down (Decisions 6). The whip lands tight on the console so the caption covers the steps, and the iris closes on the dial.

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE STAFF BADGE: a small shiny mint enamel pin in the shape of a flying saucer.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.
BASEMENT B-4: a low concrete-and-rivet basement with pipes, cobwebs and one bare amber bulb. Its chrono console is a waist-high bakelite-and-brass cabinet with one big round dial like an oversized kitchen timer (glowing mint rim, one brass needle, no numerals), a blank dark display window above the dial and a brass lever.

THE FRAME: Wide shot of the office looking towards its back wall. On the right, Zib (staff badge on the scarf, pay envelope in hand) and Vrell (mug stopped half-way to his mouth) have frozen mid-celebration and both stare to the left; Zib points. On the left, the plain stairwell door stands open: a few concrete steps lead down, and at the bottom, framed by the doorway, stands the chrono console with its big dial blazing mint and amber, the brass needle a spinning blur, the blank display window above it glowing amber, dust jumping off the cabinet. Mint light spills up the steps and across the office floor. Nobody is near the console. The dial is at about 30% across and 40% down; Zib's face at 68% across and 52% down; Vrell's face at 82% across and 38% down.
```

### Continuity check

- Pays off: the complimentary biscuit every specimen gets (story bible); Echo as the valley's patent clerk and the bone (L8); Krix and the toaster (films 1 and 3); the lanyard from film 2 and "Pass probation and we might even issue you a lanyard" (L1); "You're hired, Zib. Actual salary. Don't touch the time dial." (L8 first-clear line: nobody touches it, it starts by itself).
- Krix is shown at a Bureau counter, not in the saucer's hold or on the ridge, so the shot is true whether or not the player picked him up in L8.
- Tokens: `pay` ("on the payroll", "salarié") is `notBefore level8 after`: allowed here and nowhere earlier. `Krix`, `OBELISK™` allowed since L7. The line still says "Zib", never "Agent Zib" (`agent title` starts with the L9 memo).
- "Adequate" gag counter: cap 5, at 4 today. Shot 5 is the fifth and last. If the film's title is put in the string table it must not be "Adequate": use "Hired" / « Embauché » for the in-game title card, or raise the cap (open question 3).
- The year 1955 is named by Zib in shot 6. L8 is not an era level, so the era-year rule does not apply, and GDD-6 has this exact beat ("The Temporal Dispatch console blinks 1955"). No dawn or sunrise word.
- Hands over to: Work Order #0011, Crest Valley, 12 November 1955.

## Film 5: The Parking Ring (`outro`)

- **Title card:** The Parking Ring / L’anneau. Sub-line: Season 1 · The end / Saison 1 · Fin.
- **Trigger:** After the first delivery report of the 2199 shift (`level12`). Same seen-beat as today: `dispatch2199Finale`.
- **Logline:** The bypass is voided with Zib's signature first, Krix gets the bill, Bubbles is gone and has left Zib her ring, Vrell's pension vests and goes in the drawer marked Later, and Zib's saucer floats in its own pool.
- **Status:** Painted (Astra, 2026-11-28) and reviewed by the director; cameras fitted to the painted frames. Built in `src/ui/films.ts`; it took over the route of the three-panel `DispatchFinale`, which stays in the tree. Replaces the three panels of `DispatchFinale` and keeps their beats.
- **Length:** 7 shots, 22.7 s authored, about 44.4 s with the reading holds.

### Storyboard

| Shot | We see | What changes | Why now | Line (EN / FR) | Camera and sound |
| --- | --- | --- | --- | --- | --- |
| 1. Order Void | Vrell's desk. A blueprint: a wide road drawn dead straight through a cluster of tiny houses and a lighthouse. Vrell's stamp lands on it and leaves a red barred circle. Under it, two signatures: a loopy mint one on top, a tight purple one below. Zib holds the pen. | The bypass is cancelled, and Zib's name is above Vrell's. | Opening image: the result of the shift the player just flew. | **Bureau file:** The hyperspace bypass: void. Zib signed first. Vrell countersigned.<br>**Dossier du Bureau :** Déviation hyperspatiale : annulée. Zib a signé en premier. Vrell a contresigné. | Open on the stamp landing (thud, small jolt), slide down-right to the two signatures. Cut. |
| 2. The Bill | Across the desk sits Krix. Vrell's arm slides a very long bill towards him. Krix's gold pen hovers; one lens has fogged. On the desk, his toaster pops two slices. | Krix pays for the demolition he sold. | Because with the order void, the charges go back to the seller. | **Krix:** “All this, for selling one small town? …Do you take toast?”<br>**Krix :** « Tout ça pour une petite ville vendue ? … Vous prenez les tartines ? » | Cut. Start on the bill and the hovering pen, rise to Krix's face; the toast pops with a jolt and a soft pop, and the frame nudges right to it. Cut. |
| 3. The Empty Tank | The porthole tank in the wall beside the desk. The water still ripples, but the tank is empty. A damp note is stuck to the glass. Wet fin-prints lead across the floor and out. Zib stands with one hand on the glass, antennae down. | Bubbles has left the Bureau. | But when Zib turns to tell the colleague who found the planning notice, she is not there. | **Bubbles’ note:** So long, and thanks for all the fish.<br>**Mot de Bubulle :** Salut, et encore merci pour le poisson. | Cut. Start on Zib's back, push past them onto the note on the glass. No sound: let the room go quiet. Cut. |
| 4. The Transfer | Close on Zib's hands. Behind the note there was a card: a parking permit with a mint ring drawn on it, signed with a wet fin-print. Above it, Zib's eyes widen and their antennae lift. | Bubbles has signed her parking ring over to Zib. | Because the note had something behind it. | **Bubbles’ note:** Nobody coached me. I’m just that good.<br>**Mot de Bubulle :** Personne ne m’a donné de cours. Je suis douée, c’est tout. | Cut tight on the card and the fin-print, tilt up to Zib's face as it lights mint. A soft pickup chime. Cut. |
| 5. Vested | Vrell at his desk. Behind him a wall calendar with every square crossed out. He brings a gold stamp down on a cream form with a little deckchair drawn on it, and for once he is smiling. | Vrell's pension is his. He can leave. | Because the quarter he had to survive ended tonight. | **Bureau file:** That night Vrell's pension vested. He'd had the form filled in since 1953.<br>**Dossier du Bureau :** Retraite acquise pour Vrell, cette nuit-là. Formulaire rempli depuis 1953. | Cut. Start on the crossed-out calendar, come down to the form; the gold stamp lands (thud, small jolt). Cut. |
| 6. Later | The bottom drawer of the desk is open: a folded deckchair, a flat beach ball and a dusty party hat are already in it. Vrell slides the stamped form in on top, and looks over his glasses at Zib, who is waving the permit at the hangar window. | Vrell chooses to stay and keeps the retirement for later. | But across the room is the reason not to leave yet. | **Vrell:** “I'll file it under Later. Somebody has to sign your forms.”<br>**Vrell :** « Je le classe à Plus tard. Il faut bien quelqu’un pour signer vos formulaires. » | Cut on the open drawer (a creak), rise and ease back to Vrell's glance across the room. Cut. |
| 7. The Pool | The hangar. Bubbles' ring is a round pool, lit from below. The patched saucer floats in it like a bath toy, Zib in the dome with both arms up. On the ring's post: a pennant in Zib's scarf stripes, with the permit hanging from the old lanyard. Far behind the window, Vrell and his mug. | Zib has their own parking ring. It has a pool. | Because the permit is in their name now. | **Zib:** “It has a POOL.”<br>**Zib :** « Il y a une PISCINE. » | Cut tight on the pennant and the permit, sweep back to the whole ring, push in on the saucer, iris onto it. The success chime, then the lullaby under the iris. Hands back to Dispatch. |

### Shots

#### `outro_1` · Order Void

- **Cue:** Fade in on the stamp just landed, Vrell and Zib either side. After the jolt, push in and slide down-right to the two signatures, the mint one above the purple one.
- **Who:** `narration`
- **Line EN:** The hyperspace bypass: void. Zib signed first. Vrell countersigned. (67 characters)
- **Line FR:** Déviation hyperspatiale : annulée. Zib a signé en premier. Vrell a contresigné. (79 characters)
- **Caption:** `capIn` 0.6, `capOut` 2.68, `holdAt` 2.58, `read` 6.3 s
- **Action length:** 3 s
- **Camera keys:** `[[0, 0.5, 0.42, 1.3, 0], [0.7, 0.5, 0.42, 1.3, 0, 'linear'], [2.8, 0.56, 0.62, 1.6, 0, 'inOutSine'], [3, 0.56, 0.62, 1.61, 0, 'linear']]`
- **Transition in:** fade from black, 0.45 s
- **Effects:** stamp at 0.35
- **Sound cues:** `stamp` at 0.35
- **Keyframe (painted):** `public/film/outro/order_void.webp` (full size: `review/film-frames/outro_1.png`). Measured: the stamp (0.47, 0.47), the red barred circle (0.47, 0.57), the mint signature (0.62, 0.67) above the purple one (0.63, 0.705), Vrell's face (0.27, 0.30), Zib's face (0.74, 0.31), the empty tank (0.82, 0.14) and Bubbles' photo (0.61, 0.11).

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE STAFF BADGE: a small shiny mint enamel pin in the shape of a flying saucer.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.
THE TANK: a brass-rimmed round porthole aquarium set into the office wall, with a tiny in-tray and a tiny desk lamp clipped to its rim. BUBBLES, seen only in a small framed photo, is a slate-blue bottlenose dolphin with a pale belly, big round cream eyes and a smirk.

THE FRAME: Three-quarter high-angle shot over the desk under the amber lamp. A large pale blueprint lies on the desk: on it, a wide grey road drawn dead straight through a cluster of tiny houses and one small lighthouse. Vrell, at the upper left, has just slammed a big wooden stamp onto the road, leaving a bold red circle with a diagonal bar across it. At the bottom of the blueprint are two signature scribbles on two ruled lines: a big loopy mint-green one on the upper line and a small tight purple one on the line below. Zib, at the upper right with the staff badge on the scarf, proudly holds a pen. In the far upper-right background, dim, the porthole tank in the wall. The stamp mark is at about 50% across and 42% down; Vrell's face at 28% across and 26% down; Zib's face at 76% across and 32% down; the two signatures at 60% across and 60% down; the tank at 84% across and 12% down.
```

#### `outro_2` · The Bill

- **Cue:** Cut to the bill and the pen above it. Rise to Krix's face as the smirk goes. On the pop, a small jolt and a nudge right to the toast in the air.
- **Who:** `krix`
- **Line EN:** “All this, for selling one small town? …Do you take toast?” (57 characters)
- **Line FR:** « Tout ça pour une petite ville vendue ? … Vous prenez les tartines ? » (67 characters)
- **Caption:** `capIn` 0.4, `capOut` 2.88, `holdAt` 2.78, `read` 5.7 s
- **Action length:** 3.2 s
- **Camera keys:** `[[0, 0.44, 0.5, 1.5, 0], [2, 0.6, 0.38, 1.5, 0, 'inOutSine'], [2.2, 0.6, 0.38, 1.5, 0, 'linear'], [3.2, 0.72, 0.39, 1.45, 0, 'outSine']]`
- **Transition in:** cut
- **Effects:** stamp at 2.2
- **Sound cues:** `pickup` at 2.2
- **Keyframe (painted):** `public/film/outro/bill.webp` (full size: `review/film-frames/outro_2.png`). Measured: Krix's face (0.57, 0.33), the pen (0.42, 0.42), the bill (0.42, 0.50 and down), Vrell's arm (0.15, 0.58), the toaster (0.84, 0.51), the toast (0.83, 0.32).

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

KRIX: a slim adult mint-green alien (#64c5a1), a head taller than Zib, with pointed ears, two antennae ending in mint bulbs, large round gold-rimmed glasses, a sleek charcoal turtleneck, dark trousers and a wristwatch.
VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.

THE FRAME: Medium shot across the desk from Vrell's side. Krix sits on the far side at centre-right, a gold pen hovering in his hand above a very long cream bill that covers the desk and spills off its front edge; the bill is blank except for a column of small red tick marks. From the left edge, Vrell's stubby purple arm slides the bill towards him; only the arm is in frame. Krix's smugness is cracking: one lens of his round glasses is fogged, a sweat drop on his brow, a fixed smile. On the desk to his right stands the scorched chrome two-slice toaster (out of its glass box at last), and two golden slices of toast have just popped out of it and hang in the air above. Krix's face is at about 60% across and 36% down; the pen and the bill at 46% across and 52% down; the toaster at 80% across and 50% down; the toast in the air at 80% across and 34% down.
```

#### `outro_3` · The Empty Tank

- **Cue:** Cut to Zib from behind, small in front of the tank, the wet fin-prints on the floor. Push slowly past their shoulder until the damp note fills the frame.
- **Who:** `bubbles (written note)` (existing string `dispatch2199.note`, reused word for word)
- **Line EN:** So long, and thanks for all the fish. (37 characters)
- **Line FR:** Salut, et encore merci pour le poisson. (39 characters)
- **Caption:** `capIn` 0.9, `capOut` 3.08, `holdAt` 2.98, `read` 3.6 s
- **Action length:** 3.4 s
- **Camera keys:** `[[0, 0.42, 0.5, 1.25, 0], [0.6, 0.425, 0.5, 1.25, 0, 'linear'], [3, 0.62, 0.38, 1.75, 0, 'inOutSine'], [3.4, 0.62, 0.38, 1.76, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** none
- **Keyframe (painted):** `public/film/outro/empty_tank.webp` (full size: `review/film-frames/outro_3.png`). Measured: Zib's head (0.28, 0.48), their hand on the glass (0.45, 0.48), the tank's centre (0.53, 0.32), the note (0.64, 0.38), the photo (0.21, 0.26), the fin-prints (0.57 to 0.95, 0.64 to 0.76).

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE STAFF BADGE: a small shiny mint enamel pin in the shape of a flying saucer.
THE TANK: a brass-rimmed round porthole aquarium set into the office wall, with a tiny in-tray and a tiny desk lamp clipped to its rim. BUBBLES, seen only in a small framed photo, is a slate-blue bottlenose dolphin with a pale belly, big round cream eyes and a smirk.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.

THE FRAME: Medium shot of the office wall beside the desk. The porthole tank fills the upper centre of the frame: its water still ripples and a few bubbles rise, but it is empty. A small damp cream note is stuck to the outside of the glass, dripping; the note is blank. Beside the tank hangs the small framed photo of Bubbles with a little ribbon rosette. Wet fin-prints lead from under the tank across the floor to the right and out of the frame. In the lower left, seen from behind in three-quarter view, Zib stands with one hand flat on the glass, antennae drooping. The tank's centre is at about 50% across and 34% down; the note at 56% across and 40% down; the framed photo at 22% across and 28% down; Zib's head at 28% across and 56% down; the fin-prints run from 60% across and 62% down to the right edge.
```

#### `outro_4` · The Transfer

- **Cue:** Cut tight on the permit and the fin-print. Tilt up and ease back to Zib's face as the mint of the ring on the card lights their eyes; the ring stays in frame.
- **Who:** `bubbles (written note)` (existing string `dispatch2199.transfer`, reused word for word)
- **Line EN:** Nobody coached me. I’m just that good. (38 characters)
- **Line FR:** Personne ne m’a donné de cours. Je suis douée, c’est tout. (58 characters)
- **Caption:** `capIn` 0.4, `capOut` 2.68, `holdAt` 2.58, `read` 4.9 s
- **Action length:** 3 s
- **Camera keys:** `[[0, 0.52, 0.6, 1.6, 0], [0.8, 0.52, 0.6, 1.6, 0, 'linear'], [2.8, 0.5, 0.44, 1.25, 0, 'inOutSine'], [3, 0.5, 0.437, 1.25, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** `pickup` at 0.5
- **Keyframe (painted):** `public/film/outro/transfer.webp` (full size: `review/film-frames/outro_4.png`). Measured: Zib's face (0.47, 0.30), the card (0.54, 0.60, from 0.50 to 0.70), the ring on it (0.52, 0.58), the fin-print (0.63, 0.66), the badge (0.29, 0.50). The card is painted lower than the prompt asked, so the tilt up ends wider (scale 1.25) and keeps the ring above the caption.

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE STAFF BADGE: a small shiny mint enamel pin in the shape of a flying saucer.

THE FRAME: Close-up of Zib from the chest up, facing us, in front of the softly rippling glass of the tank. In both hands, held up at chest height, Zib holds a damp cream card the size of a postcard: on it, a simple pictogram of a glowing mint ring and, in its lower corner, a wet slate-blue fin-print for a signature. The card glows faintly mint and lights Zib's face from below. Zib's eyes are widening, mouth a small "o", antennae lifting; the staff badge is on the scarf. Zib's face is at about 50% across and 22% down; the card at 50% across and 48% down; the fin-print at 56% across and 52% down.
```

#### `outro_5` · Vested

- **Cue:** Cut to the calendar, every day crossed. Come down and left to the form just before the gold stamp lands on it, and stay on Vrell's smile.
- **Who:** `narration`
- **Line EN:** That night Vrell's pension vested. He'd had the form filled in since 1953. (74 characters)
- **Line FR:** Retraite acquise pour Vrell, cette nuit-là. Formulaire rempli depuis 1953. (74 characters)
- **Caption:** `capIn` 0.5, `capOut` 2.68, `holdAt` 2.58, `read` 5.9 s
- **Action length:** 3 s
- **Camera keys:** `[[0, 0.72, 0.335, 1.5, 0], [0.5, 0.72, 0.335, 1.5, 0, 'linear'], [1.8, 0.48, 0.47, 1.32, 0, 'inOutSine'], [3, 0.48, 0.48, 1.3, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** stamp at 2
- **Sound cues:** `stamp` at 2
- **Keyframe (painted):** `public/film/outro/vested.webp` (full size: `review/film-frames/outro_5.png`). Measured: the calendar (0.76, 0.18), Vrell's face (0.38, 0.35), the stamp (0.57, 0.53), the gold mark (0.59, 0.61), the deckchair (0.45, 0.61).

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.

THE FRAME: Medium shot of Vrell at his desk under the amber lamp. On the wall at the upper right hangs a calendar: a plain grid in which every single square is crossed out with a red X, with no numbers or words. Vrell, at centre-left, brings down a brass stamp onto a cream form on the desk; the form carries only blank ruled lines, a tiny pictogram of a deckchair under a sun, and the fresh gold starburst mark of the stamp. Vrell wears an open, unfamiliar, slightly crooked smile, eyes for once fully open. Vrell's face is at about 38% across and 32% down; the calendar at 72% across and 18% down; the form and the gold mark at 50% across and 52% down.
```

#### `outro_6` · Later

- **Cue:** Cut to the open drawer and the form going in. Rise and ease back until Vrell's sideways look and Zib at the window share the frame.
- **Who:** `vrell`
- **Line EN:** “I'll file it under Later. Somebody has to sign your forms.” (58 characters)
- **Line FR:** « Je le classe à Plus tard. Il faut bien quelqu’un pour signer vos formulaires. » (77 characters)
- **Caption:** `capIn` 0.4, `capOut` 2.78, `holdAt` 2.68, `read` 6.4 s
- **Action length:** 3.2 s
- **Camera keys:** `[[0, 0.46, 0.58, 1.6, 0], [0.6, 0.46, 0.58, 1.6, 0, 'linear'], [2.8, 0.55, 0.46, 1.1, 0, 'outSine'], [3.2, 0.55, 0.46, 1.1, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** none
- **Sound cues:** `creak` at 0.3
- **Keyframe (painted):** `public/film/outro/later.webp` (full size: `review/film-frames/outro_6.png`). Measured: the form in the drawer (0.42, 0.57), Vrell's face (0.36, 0.29), Zib (0.77, 0.24), the lanyard and permit (0.61, 0.27), the empty in-tray (0.60, 0.43).

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
THE STAFF BADGE: a small shiny mint enamel pin in the shape of a flying saucer.
THE OFFICE: a cluttered 1950s retro-futurist alien civil-service office in smoky plum-slate, with a wooden desk piled with cream folders, an amber gooseneck desk lamp, a cork board of blank notes, grey filing cabinets, a round wall clock with no numerals and a brass pneumatic mail tube coming down from the ceiling.
THE LANYARD: a cheap lanyard made of amber-and-black hazard tape with a blank cream card held on by a paperclip.

THE FRAME: Low-angle shot from beside the desk. The deep bottom drawer of the desk stands open in the centre of the frame: inside, a folded striped deckchair, a deflated beach ball and a dusty paper party hat with a cobweb; the drawer front has an empty brass label holder and a small hourglass sticker. Vrell leans down from the upper left and slides the cream form with its gold starburst mark into the drawer on top of them, while looking sideways over his glasses towards the right. At the upper right, in the background by the hangar window, Zib bounces on the spot, waving the damp permit card, which Zib has just clipped to the old hazard-tape lanyard picked up from Vrell's wooden in-tray (the empty in-tray sits on the desk edge between them). Vrell's face is at about 36% across and 28% down; the open drawer and the form at 44% across and 54% down; Zib at 76% across and 32% down.
```

#### `outro_7` · The Pool

- **Cue:** Cut tight on the scarf-striped pennant and the permit on its lanyard. Sweep back and left to show the pool, the floating saucer and Vrell at the window, hold, then push in on Zib in the dome. Iris onto the saucer.
- **Who:** `zib` (existing string `dispatch2199.pool`, reused word for word)
- **Line EN:** “It has a POOL.” (14 characters)
- **Line FR:** « Il y a une PISCINE. » (19 characters)
- **Caption:** `capIn` 0.35, `capOut` 2.38, `holdAt` 2, `read` 2.5 s
- **Action length:** 3.9 s
- **Camera keys:** `[[0, 0.775, 0.35, 1.7, 0], [1.9, 0.44, 0.5, 1.02, 0, 'outCubic'], [2.05, 0.44, 0.5, 1.02, 0, 'linear'], [3.3, 0.49, 0.42, 1.5, 0, 'inOutCubic'], [3.9, 0.49, 0.42, 1.5, 0, 'linear']]`
- **Transition in:** cut
- **Effects:** iris onto (0.49, 0.42), the saucer, closing by 3.9 at 2.9
- **Sound cues:** `success` at 1.9, `lullaby` at 2.9
- **Keyframe (painted):** `public/film/outro/pool.webp` (full size: `review/film-frames/outro_7.png`). Measured: the pennant (0.86, 0.27), the permit on the lanyard (0.87, 0.44), the saucer (0.48, 0.48), Zib in the dome (0.49, 0.36), Vrell at the window (0.14, 0.26), the pool's near rim (y 0.67). The pennant and Vrell are too far apart for one phone frame: the shot opens on the pennant, and the wide frame keeps Vrell.

**Image prompt**

```text
High-craft 2D animated feature-film cel illustration (Gravity Falls meets Futurama, stylised nocturnal cartoon cinema). Bold, clean dark-indigo (#1b1433) ink outlines, expressive painterly cel shading, atmospheric lighting with soft rim light. Palette: deep midnight indigo (#120d2b, #242039), smoky plum-slate interiors (#414357, #594653), warm cream paper (#ecdfc7), glowing mint (#7CFFCB) for alien technology and beams, warm amber (#FFB347) for lamps and lit windows, lilac (#c8a4ff) only for OBELISK property. One single film frame in 3:4 portrait (896×1200), painted edge to edge with no border, no panel frame and no vignette. Keep the key action in the top 70% of the frame; the bottom quarter stays calm, darker and uncluttered. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO SPEECH BUBBLES, NO WATERMARKS anywhere: every paper, sign, stamp mark, badge, dial, label and screen is blank or carries a simple pictogram only.

ZIB: a small, eager mint-green alien (#64c5a1), about half as tall as Vrell, with a round head, no nose, two curved antennae ending in glowing mint bulbs, huge round cream-white eyes with big dark pupils, a teal uniform shirt (#468c89) with a cream collar, a burgundy necktie and an oversized pink-and-gold striped knitted scarf with fringed ends, and three-fingered hands.
VRELL: a tall, slumped lavender-purple blob alien (#a387b1, darker shadow #604569) with a smooth pill-shaped body that widens into a soft ruffled base, no legs, no hair and no clothes, two stubby arms with mitten-like hands, heavy half-lidded tired eyes, small dark rectangular glasses sitting low on his face and a flat unimpressed mouth.
THE SAUCER: a battered retro 1950s flying saucer in teal and mint riveted metal with a clear glass dome, alternating warm amber and mint rim lights, three short landing legs, and a dent on its rim covered by two crossed beige sticking plasters.
THE HANGAR: a curved dark-indigo orbital hangar bay with round amber ceiling lights, amber strip lights around its doors and a glowing mint docking ring on the floor.
THE PARKING RING: a glowing mint docking ring on the hangar floor, filled with a round turquoise pool lit from below, with a short post beside it.
THE LANYARD: a cheap lanyard made of amber-and-black hazard tape with a blank cream card held on by a paperclip.

THE FRAME: Wide shot inside the hangar at night. In the centre of the frame, the parking ring: a glowing mint ring on the floor filled with a round turquoise pool lit from below, throwing rippling light on the ceiling. The saucer floats in the pool like a bath toy, tilted a little, small waves around it; inside the dome, Zib throws both arms in the air in pure joy, the scarf flying. On the short post beside the ring, at the upper right, flies a small pennant in pink-and-gold stripes (the same stripes as Zib's scarf), and from the post hangs the hazard-tape lanyard with the damp permit card clipped to it. Far in the background at the upper left, behind the hangar window, small, Vrell watches with his steaming mug. The saucer is at about 50% across and 42% down; the pennant and the permit at 74% across and 32% down; Vrell at 20% across and 20% down. The bottom quarter is dark hangar floor with soft mint reflections.
```

### Continuity check

- Keeps every beat of the shipped three-panel finale: void (shot 1), bill and the toast pop (shot 2), note (shot 3), permit and transfer (shot 4), vested (shot 5), later (shot 6), pool (shot 7). "Received" becomes Krix's pen hovering over the bill.
- Pays off the season: Zib's name ahead of Vrell's (story bible, Vrell's arc); Krix, the toaster and the toast from film 1; "who taught a dolphin to write?" (L5 first-clear line) answered by Bubbles herself; "Parking ring: waitlisted. Behind Bubbles." (rank flavour); Vrell's pension, "eleven weeks away" at the Field Check (decision D6: he files the form under Later and stays); the lanyard from film 2, kept to hold the permit.
- Reused strings, word for word, so no gag counter moves: shot 3 is `dispatch2199.note`, shot 4 is `dispatch2199.transfer`, shot 7 is `dispatch2199.pool`. The `fish farewell` gag has a global cap of 1: the film must show the existing key, never a second copy of the sentence.
- Tokens: `fish farewell` and `Zib's parking ring` are `notBefore level12 during`: allowed. `tripods`/`thermometer origin` are not used. The year 1953 in shot 5 is allowed: the 1953 shift is a prerequisite of 2199 (decision D7) and the story bible makes Vrell a rookie that year. No "toaster", no "adequate" (the report's first-clear line, just before this film, has Vrell's "adequate" for Zib's mother).
- Reference: one, the dolphins' goodbye from The Hitchhiker's Guide to the Galaxy, in the French edition's wording in FR.
- Hands over to: Dispatch, with the dial quiet and every delivered order replayable. The ring in the last frame is the one named in `dispatch2199.parking`.

## Running jokes across the films

| Joke | Set up | Paid off | Films |
| --- | --- | --- | --- |
| Krix and the toaster | Film 1: the incident, the evidence box | Film 3: his signature and the toaster under his arm; film 4: the bone bill; film 5: the toast pops as he pays | 1, 2 (box only), 3, 4, 5 |
| The lanyard and the parking ring | Film 2: the temporary lanyard | Film 4: handed back for a staff badge; film 5: it holds the parking permit | 2, 4, 5 |
| Vrell's stamp | Film 1: he stamps Krix out | Film 2: nothing to stamp; film 5: he stamps the bypass void, then his own pension | 1, 2, 5 |
| The biscuit | Film 3: on the Captain's knee | Film 4: the witnesses' price | 3, 4 |

No film carries more than three of these, and none is needed to follow the picture.

## Decisions (coordinator, 2026-11-28)

1. **Film 1 keeps the L7 twist.** No guard is loosened. The captions name neither Krix nor OBELISK™ and use no pay word (EN and FR above). The picture still shows his face and the limo, so `prior_art` pays them off.
2. **Film strings are tied to their levels** in `tests/ui-copy-helpers.ts`: `opening` to L1 during, `probation` to L2 after, `prior_art` to L7 after, `adequate` to L8 after, `outro` to `level12` after.
3. **Film 4's in-game title card is "Hired" / « Embauché »**, and "Adequate" stays the working title.
4. **No film line uses the word "toaster".** The picture carries it.
5. **The shipped finale stays in the code** (`src/ui/dispatch-finale.ts`, with its guards) while the v0.2 branch is open; the `outro` film takes over its route in `src/core/game.ts`. The stamp strings stay. The pictures carry the stamps by shape.
6. **Basement B-4 is reached by a stairwell door in the back wall of Vrell's office**, with the vault door at the bottom. This is canon.
7. **Zib has pupils.** `shot4_zib_arrives` stays as approved.
