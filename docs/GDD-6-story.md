# Night Shift: narrative design (v4, Season 1 & beyond)

This document defines the story bible, season arc, mobile delivery rules, drop-in English copy, and phased implementation plan for **Night Shift**. It extends [`docs/GDD.md`](GDD.md), [`docs/GDD-2-deeper.md`](GDD-2-deeper.md), [`docs/GDD-3-new-shifts.md`](GDD-3-new-shifts.md), [`docs/GDD-4-monolith.md`](GDD-4-monolith.md), and aligns directly with the progression and Grimsby dispatch route in [`docs/GDD-5-progression.md`](GDD-5-progression.md).

**Tone & audience (AGENTS.md v4):** **PG-13, leaning 16.** Workplace satire, bureaucratic absurdity, mild swearing (*damn, hell, crap, ass*), cheeky innuendo, probe/butt gags, and internationally known film/pop-culture nods (sci-fi and beyond). Nothing sexually explicit, no slurs, nobody real mocked. English is the primary audience; French is a small part and adapts puns where needed, never carrying French-only premises. Rights hygiene follows [`docs/research/scifi-references.md`](research/scifi-references.md): original phrasing, original art, no copied catchphrases or protected branding.

---

## 1. Story bible

### The premise

The **Galactic Census Bureau (Abductions Dept.)** has been quietly auditing Earth since 1947. Not to conquer it — conquering requires an environmental impact study — just to keep the paperwork current, check whether humans are still the smartest thing on the rock, and log the occasional brass-thermometer reading.

The entire Grimsby night beat is staffed by two people: an exhausted middle manager who wants an uneventful quarter before retirement, and an unpaid intern flying a hand-me-down saucer with one thumb. Over one escalating week of night shifts, a routine rural census snowballs into a town-wide tabloid scandal, an internal Compliance audit, and a corporate turf war with a slick rival contractor trying to patent humanity before dawn.

### Main cast

#### Intern Zib (the player)
- **Who:** A wide-eyed, green, over-caffeinated junior intern on their first solo night rotation. Flies with their tongue poking out, picks their nose when parked (`src/flight/pilot.ts`), and treats Earth like a weird, fragile thrift shop.
- **What Zib wants:** **A permanent badge, a paid contract, and their own parking ring** — mostly so their mother stops phoning Head Office to ask if Zib is eating enough and whether saucers have airbags.
- **Comic flaw:** Enthusiastic, polite, and mildly kleptomaniac. Zib cries over a stolen UFO snow globe, puts a hospital bedpan on their head, names a set of stolen dentures "Gary," and polishes a silver butt plug assuming it is a decorative probe.
- **Arc:** Starts terrified of headlights and desperate for Vrell's approval (L1–L2) → discovers genuine pride in pulling off impossible shifts while leaving a chaotic trail of souvenirs (L3–L5) → realizes the Bureau's rules are ridiculous *and* that Vrell is secretly covering for them (L6–L7) → outsmarts a billion-glorb rival firm with sheer stubbornness and wins real respect (L8).

#### Supervisor Vrell (the tutor)
- **Who:** A purple, bespectacled, permanently tired middle-management blob welded to a clipboard (`ui/vrell_portrait` / `ui/vrell_furious`). Motto: *"Adequate. My favourite word. It means I don't have to talk to anyone."*
- **What Vrell wants:** To survive his final quarter before his pension vests without Head Office, Accounting, or Compliance opening a file with his name on it.
- **Secret:** Vrell *was* a field pilot in 1953 (back when the brass thermometer was cutting-edge tech). He still cares about doing a clean abduction — he just hides it behind passive-aggressive HR memos.
- **Arc (from supervisor → nervous co-signer → reluctant mentor):**
  - **L1–L2:** Distant, jaded HR voice. Treats Zib as replaceable (*"Last quarter's intern…"*).
  - **Field Check–L4:** Grudgingly takes Zib off training, then panics as Grimsby's sightings pile up on *his* signature line.
  - **L5–L6:** Realizes Head Office and Compliance are setting him up as the fall guy. Starts subtly coaching Zib and signing off on sketchy expense forms (*"Budget approved by nobody"*).
  - **L7–L8:** Full co-conspirator. Breaks into the Bureau's mothballed **Temporal Dispatch** basement with Zib to stop the rival from burying their department — and, for the first time, puts Zib's name *ahead* of his own on a memo.

#### The Galactic Census Bureau
A sprawling cosmic civil service running on 1950s hardware and triplicate forms:
- **Abductions Dept. (Night Shift):** Underfunded, understaffed, blamed for everything.
- **Head Office:** Distant executives who send vague mandates (*"vertical slice of civic life"*, *"check if dolphins are smarter"*) and take credit when things go right.
- **Compliance & Internal Affairs:** Terrifying clipboard zealots obsessed with **Form 7-B** (Probes) and **Form 27-B/6** (Specimen Intake).
- **Accounting:** Remembers every stolen toaster, disputes every sardine tin, refuses to explain what decaf is.
- **The Tuesday Crew:** The frat-boy day/Tuesday shift who leave sloppy crop circles everywhere and blame Zib.
- **The Tripod Division:** Still on sick leave since catching an Earth cold.
- **Temporal Dispatch (Basement B-4):** Mothballed in 1985 after an expense-report paradox. Holds one dusty chrono-dial (Form 88-MPH) — the hook into L8 and any future era packs.

#### The Rival: **OBELISK™ (Uplift & Branding Solutions)**
- **Who:** The black-monolith people from L8 (`docs/GDD-4-monolith.md`). While the Bureau uses clunky saucers, floppy tractor beams, and brass thermometers, OBELISK™ is a smug, venture-funded cosmic consultancy: minimalist matte-black slabs, pretentious three-note chimes, zero Census permits, and aggressive intellectual-property lawyers.
- **Their racket:** Instead of doing honest census work, they drop black slabs on primitive worlds, teach one ape to throw a femur, help them open a patent office on Tuesday, and claim **prior-art royalties on every tool, vehicle, and tractor beam ever invented afterward** — effectively privatizing Earth out from under the Bureau.
- **The twist (pays off L1's running gag):** OBELISK's shiny new Senior VP of Disruptive Contact is **Krix — "last quarter's intern,"** the guy who returned a man still holding his toaster, hit a power line, got fired by Vrell, and walked across the street to the Monolith people with the Bureau's Grimsby client list.

### Running mysteries & gags

| Thread | Setup | Escalation | Payoff |
| --- | --- | --- | --- |
| **What happens to the specimens?** | L1 memo: *"undamaged, unbruised and ideally unaware."* | Specimens are weighed, measured, given a complimentary biscuit, memory-dusted, and dropped back in bed minus one slipper. | They *remember fragments* as weird dreams — and slowly realize half of Grimsby had the exact same dream. |
| **Last quarter's intern** | L1 memo: returned a man holding a toaster; loading tip: hit power lines. | L7 memo: Accounting still brings up the toaster. | L8 reveal: he didn't quit the industry — he defected to OBELISK™ and tipped them off about Grimsby's museum slab. |
| **Zib's Mum** | L1–L4 Zib bubbles: warned Zib about cops, cities, pigeons, souvenir mugs. | L3+ perfect report: she phones Head Office to ask if Zib is eating enough. | Finale: Vrell finally answers her call himself and tells her Zib did adequate work (high praise). |
| **Cats are management** | Loading tip: *"Cats are not specimens. Cats are management."* | Doyle's cat (L1), Kipper (L5), Anchovy (L7) all outrank or boss the humans around. | Anchovy literally runs the SS Buffet Royale bridge after Sterling is beamed up; Kipper takes a cut of Sal's petty cash. |
| **The Missing Sock Hoard** | L2 odd sock: *"So that's where they go. It's us. It was always us."* | Every level leaves a bizarre souvenir in the hold; Zib hoards them like a magpie. | Vrell's cover stories keep blaming swamp gas on increasingly absurd stolen objects (toupee, silver plug, lime mankini). |
| **The Hendersons** | L3: Brenda and Gary blame the Hendersons for everything. | Zib wears Gary's tinfoil hat and claims he can hear the Hendersons. | Never seen on screen — eternal suburban scapegoats across Grimsby. |
| **The 1953 Probe Protocol** | L6: *"a brass thermometer and a clipboard since 1953."* | Humans voluntarily queue for endoscopies and rate them 4/5, humiliating the Bureau. | Cleanly seeds a future **1950s Mob-Town era** (the night in 1953 when the Bureau wrote the thermometer rule in the first place). |

### Recurring humans & Grimsby continuity

Everything in Season 1 happens in and around one damp, mildly cursed coastal town: **Grimsby** (farm belt on Route 9 → Main Street → Maple Court suburbs → City Centre → Barnacle Bay pier → St. Mildred's hospital → the cruise liner sailing out of Barnacle Bay → the dry riverbed above town, three million years earlier).

- **Laundromat Larry (Recurring Specimen / Cameo):** Beamed out of Spin City in L2 → reappears as background scenery asleep across chairs in St. Mildred's waiting room in L6 wearing his Spin City polo, clutching ticket #346 (per `GDD-5-progression.md`). Still hasn't woken up properly.
- **Farmer Doyle (Recurring Offscreen Complainant):** L1 specimen → his missing slipper ends up pinned to Spin City's "Lost & Found" noticeboard in L2; by L3/L4 his angry letters appear in *The Grimsby Gazette* blaming the Hendersons' tractor.
- **Gary, Neighbourhood Watch (Escalating Nemesis):** L3 specimen whose own lasers keep catching him → files a formal CCTV complaint to City Hall (L4 hook) → his tinfoil hat and "I SAW SOMETHING" newsletter keep feeding *The Grimsby Gazette* through L7.
- **Mrs. Pruitt & Sister Dorothy "Doris" (The Binoculars Ring):** Mrs. Pruitt hasn't slept since 1994 (L3 watcher, shouts *"DOROTHY! THE BOOK!"* in `en.ts`) → her blurry photo lands on City Hall's noticeboard (L4) → her sister **Doris** takes the same logbook on holiday aboard the *SS Buffet Royale* (L7 watcher), closing the loop between Maple Court and open water.
- **Officer Dobbs / Unit 4 (Recurring Witness):** L3 cruiser cop who radios in *"a large hubcap, airborne"* → transferred to L4 downtown patrol after the station party replays his dashcam clip twice.
- **Bubbles the Dolphin (Recurring Bureau Rival):** L5 specimen who sleeps with half her brain and still outranks Zib → remains in the Bureau's porthole tank filing sarcastic memos and sending Accounting into meltdown.
- **Greg (Recurring Tourist Hazard):** L7 all-inclusive menace in three stolen towels and a lime mankini → prime cameo candidate for any future beach, festival, or hotel level (*"Is this era all-inclusive?"*).
- ***The Grimsby Gazette* (Town Panic Meter):** Already rendered as a newspaper clipping on the Report whenever Zib is spotted ≥2 times (`reportExtras.masthead`). Across L1→L8 its tone escalates from rural eccentricity (*"COWS DENY ALL KNOWLEDGE"*) to civic denial (*"MAYOR BEAMED UP, CITY HALL RUNS AS NORMAL"*) to full absurdity (*"LOCAL APE THROWS BONE, LAWYERS CLAIM AIRSPACE"*).

---

## 2. Season 1 arc (L1–L8) & beyond

### Three-act overview

- **Act I — Probation (L1 → L2 → Field Check):** Zib learns to fly without hitting power lines, steals a slipper and a mug, and gets bumped off training because Vrell is short-staffed.
- **Act II — The Grimsby Paper Trail (L3 → L4 → L5):** One messy night in the suburbs leaks to City Hall, which leaks to the harbour. *The Grimsby Gazette* starts connecting the dots, and the first weird clue appears: a dolphin smarter than the census report said she should be, plus an unaccounted crate on the Mayor's desk.
- **Act III — The Audit & The Slab (L6 → L7 → L8):** Compliance ambushes Vrell over zero logged probes, forcing the humiliating hospital audit; then a manifest snag leads Zib onto a cruise ship carrying a stolen black stone exhibit from Grimsby Museum. Tracing its provenance exposes **OBELISK™** (and last quarter's intern) trying to retroactively patent human tool-use three million years upstream. Vrell cracks open Temporal Dispatch and sends Zib back before dawn to settle the score.

### Beat-by-beat map (L1 to L8)

Compatible with Sol's fresh-save delivery unlock order (`GDD-5-progression.md`) **and** legacy saves where L3–L7 are already unlocked: every memo stands on its own punchline if read out of order, while sequential play builds a clean cause-and-effect chain.

| Order | Act & District | Story beat (what changes) | Callback to previous | Hook into next |
| --- | --- | --- | --- | --- |
| **L1** | **Act I · Doyle Farm (Route 9)** | Zib's first solo shift. Unpaid, terrified, flying a borrowed saucer. Vrell expects Zib to crash like last quarter's intern (the toaster guy). | *Opening:* Interlude #1 (Clock-In) establishes Zib's Mum, Vrell's clipboard, and the missing predecessor. | Doyle's pickup heads down Route 9 toward town — and Doyle's lost slipper/missing-pet flyer reaches Spin City's noticeboard. |
| **L2** | **Act I · Spin City Laundromat (Main St)** | First taste of town hazards (neon, wires, fan). Zib discovers the Bureau is why Earth loses single socks. | Memo cites Doyle's clean(ish) intake and the flyer pinned above Larry's coffee mug. | Delivery van turns down Birch Lane into Maple Court. Head Office dumps a triple-specimen quota on Vrell; he pulls Zib off training. |
| **Field Check** | **Act I→II · Birch Lane / Maple Court edge** | Unpaid 60-second graduation drill before the real clock starts (Sol's `GDD-5` exercise). Vrell nervously tests whether Zib can survive a porch sensor and a second sleeper without getting him fired. | Interlude #2 (Off Probation): Vrell hands Zib a temporary lanyard and warns them about Mrs. Pruitt. | Practice specimen clears the lip → live sunrise clock arms for the full Maple Court sweep. |
| **L3** | **Act II · Maple Court (Suburbia)** | First real 3-specimen shift under a sunrise clock. Zib meets Grimsby's real apex predators: Mrs. Pruitt's binoculars and Gary's paranoid garage HQ. | Reuses the Birch Lane van landmark from L2 and the porch/sleeper rules from Field Check. | Gary files a furious CCTV complaint and Mrs. Pruitt mails her blurry saucer photo straight to **City Hall** — forcing Head Office to audit downtown Grimsby next. |
| **L4** | **Act II · Grimsby City Centre** | Stakes go municipal: a police helicopter, a museum, a nightclub, and Mayor Whitlock. **First rival clue:** Nigel's museum manifest has a redacted entry for *"One (1) matte-black slab, riverbed dig — sold to private maritime buyer."* | Pruitt's photo is pinned to City Hall's noticeboard; Officer Dobbs (Unit 4) is back on patrol; Gary's complaint sits on the Mayor's desk. | The Mayor's desk ledger flags an unaccounted fish-market shipment at **Barnacle Bay** — and a postcard of the lighthouse sits in Nigel's gift shop. |
| **L5** | **Act II · Barnacle Bay (Seaside)** | Species shock: Head Office suspects humans are only third-smartest. Zib beams up Bubbles the dolphin, Harbourmaster Pete, and Sal. Bubbles leaves a polite note that rattles Vrell — someone has been *coaching* Earth's wildlife? | Follows the harbour road from L4; Sal's ledger ("one outstanding") matches the Mayor's missing crate. | Pete's lighthouse log and a local broadcast about a "flying hubcap at the aquarium" trigger a **Compliance audit** at Head Office. Zero probes logged all quarter. |
| **L6** | **Act III · St. Mildred's General (Endoscopy Wing)** | Humiliation peak. Compliance forces Vrell and Zib to log Form 7-B probe readings on three specimens — in a hospital where humans *queue voluntarily* to be probed and leave 4-star reviews. Vrell is personally offended and starts siding with Zib against Compliance. | Service road shares Barnacle Bay's townward sign; **Larry** cameos asleep in the waiting room in his Spin City polo; Pete's log is cited as the audit trigger. | Form 7-B flags an anomaly: a passenger who listed *"buffet"* as emergency contact is boarding the **SS Buffet Royale** — the exact ship carrying the museum's missing black stone exhibit. |
| **L7** | **Act III · SS Buffet Royale (Open Water)** | High-seas caper. Vrell approves the mission *without* Head Office's budget ("maritime research"). Zib dodges the deck photographer and Doris (Mrs. Pruitt's sister, wielding the same logbook), grabs Captain Sterling, Chef Marco, and Greg. The shipping manifest rides along in the Captain's jacket, and the Bureau finds it at debrief. | Departs from Pete's dock (lighthouse silhouette); Captain keeps a photo of Pete & Anchovy by the compass; Doris shouts back to Pruitt's logbook. | **Twist (Interlude #3):** The manifest's buyer is **OBELISK™**, signed by **Krix** (last quarter's toaster intern!). They didn't just steal a rock — they sent a live slab *back* to Grimsby's dry riverbed three million years ago to patent the tractor beam as "prior art." |
| **L8** | **Act III · Patent Valley (Prehistoric Grimsby)** | Season climax. Vrell breaks the padlock on **Temporal Dispatch (Basement B-4)** and sends Zib up the dry riverbed before dawn — three million years early — to abduct three newly-uplifted apes (Flint, Reed, Echo) before Echo stamps the Bureau out of business. | Echo's patent claim directly calls back to Zib's L1 beam and Nigel's missing museum slab; Krix's OBELISK™ branding is stamped on the monolith's bevel. | **Finale (Interlude #4):** Patents voided, OBELISK™ fined by Galactic Legal, Vrell promotes Zib to *actual paid staff* — and accidentally leaves the Temporal Dispatch dial blinking on **1122 AD**, **1953 AD**, and **2199 AD**. |

### Beyond L8: slot-in architecture for undecided ideas

None of the ideas below are locked in yet, so the Season 1 story is written to **close cleanly at L8** while leaving three clean, zero-friction expansion sockets:

1. **If L8 is reworked into an Ape Time Trial:**
   - The narrative wrapper *actually gets punchier*. Instead of a standard 3-building shift, Echo's patent clerk stamp comes down at dawn: Zib runs a tight, high-tempo **Patent Filing Countdown** ("Beat the Filing Window!") where grabbing Flint, Reed, and Echo (or racing through one continuous valley gauntlet) cancels OBELISK's claim before the ink dries. Same characters, same rival, same Temporal Dispatch payoff.
2. **If Temporal Eras become Season 2 ("Every Era Is Still Grimsby"):**
   - Because Temporal Dispatch locks onto the **same planetary coordinates (Grimsby)** at different dates, recurring families, landmarks, and Bureau paperwork tie every era together for free:
     - **Prehistoric Grimsby (3,000,000 BC):** Patent Valley (L8). Riverbed before there was a town.
     - **Medieval Grimsby (1122 AD — *Checkout, 900 Years Late*):** Grimsby Keep, later converted into a budget hotel; OBELISK™ tried to patent the drawbridge. Ancestor of Farmer Doyle is asleep in the hayloft.
     - **1950s Mob-Era Grimsby (1953 AD — *The Godfather* / Noir Docks):** "An Offer You Can't Sleep Through." Fedoras, speakeasy backrooms, dockside tommy-gun lookouts, a sleeping crime boss ("Don Corle-snore" / **Don Vittorio**, asleep in a barber's chair clutching a cannoli souvenir) — and **the historical night young Field Pilot Vrell accidentally established the 1953 Brass Thermometer Protocol** after dropping his clipboard in a harbourside fish warehouse! (International nod: *The Godfather*, 1950s noir — no character likenesses or exact film lines, pure genre comedy.)
     - **Present-Day Grimsby Expansions (Outdoor & Skyscraper):** Slot into Season 1.5 as "Overtime Orders" without touching the main L1–L8 arc:
       - *Double Feature* (O1 drive-in on Route 9, next door to Doyle's farm — Mrs. Pruitt's favourite haunt, 1950s B-movie on screen).
       - *Overtime* (T1 40-storey Grimsby Insurance Tower — **Derek from Compliance** is literally the human equivalent of the Bureau's Compliance wing).
       - *The Morning After* (O2 festival outside Barnacle Bay — Greg is definitely asleep in a tent there).
     - **Future Grimsby (2199 AD — *Quiet Hours in Orbit*):** Orbital hotel above Neo-Grimsby where the *SS Buffet Royale* has been retrofitted into a space cruiser and Zib finds a sticky note signed by *Future Vrell* ("Still waiting on Form 7-B").

---

## 3. Narrative delivery & mobile readability

### The Three-Depth Rule (respecting text-skippers)

Players on a 375×690 phone tap through blocks of prose. The story therefore works at three independent layers:
1. **Zero-Reader Layer (visuals & props only):** Zib's animated cockpit expressions (`pilot.ts`), Vrell's normal vs. furious portrait, mugshots on cards, *The Grimsby Gazette* clipping slapping onto the Report, Larry asleep in L6's waiting room, the lighthouse silhouette linking L4→L5→L7, and souvenirs carried in the beam.
2. **Skimmer Layer (≤ 12 words per glance):** Work Order card title + blurb, Memo `RE:` line + yellow joke callout, Zib's 1-line flight bubbles, *Gazette* ALL-CAPS headlines, Vrell's Memo sign-off line.
3. **Reader Layer (full comedy payoff):** Memo body (35–42 words), Vrell's Report comment + cover story, progress-gated Loading Tips, and 4 short skippable 3-panel Comic Interludes (~10 seconds each).

### Screen-by-screen delivery matrix

Measured directly against the live 540×960 logical layout (`src/ui/*.ts`, `src/flight/views/overlays.ts`):

| Surface | Files | Phone text budget | Story job | UI status & cost |
| --- | --- | --- | --- | --- |
| **Title screen** | `src/ui/title.ts`, `en.ts` (`title.taglines`) | 1 line, ≤45 chars | Establishes tone & Bureau vibe on launch. | **Existing UI** · Zero code cost. |
| **Loading screen** | `src/ui/loading.ts`, `en.ts` (`loading.tips`) | 1–2 lines, 45–90 chars (`TIP_W = 392`) | World-building & lore crumbs; gating tips by highest delivered level lets tips react to your progress without spoilers. | **Existing UI** · **Tiny** (~8 LOC in `loading.ts` to read `save`). |
| **Work Orders / Dispatch** | `src/ui/workorders.ts`, `en.ts` (`levels.*.blurb`, `ranks`) | Title ≤32 chars, location ≤36 chars, **unused `blurb` field** (≤55 chars) | Shows the Grimsby route, rank climb, and next objective. Phase A: add route line + district arrow + 1-line Vrell dispatch status. Phase B: transit-map strip / Temporal tab. | **Reuse + Small/Medium UI** (aligned with `GDD-5` steps 5–6). |
| **Incoming Memo** | `src/ui/memo.ts`, `en.ts` (`levels.*`) | `re` ≤42 chars · `body` 180–230 chars (stays 19–20 px) · `joke` 90–140 chars · `signoff` ≤50 chars | **Primary story carrier.** Opens every shift with callback + stakes + Vrell's evolving voice. Making `signoff` per-level tracks Vrell's arc in 6 words! | **Existing UI** · **Tiny** (~5 LOC in `memo.ts` for per-level `signoff` + portrait mood). |
| **In-Flight Zib Bubble** | `src/flight/views/overlays.ts`, `src/flight/deep-scene.ts`, `humor.ts` | 1–2 lines, 45–85 chars (`340 px` wide, shown `2.8 s`) | Zib's emotional arc in real time: shift-opener (`start1`–`start8`), hazard panic, 2/3-delivered banter. Currently `start3`/`start4` exist in `en.ts` but are never triggered in `deep-scene.ts`! | **Existing UI** · **Tiny** (~12 LOC in `deep-scene.ts` + `humor.ts`). |
| **Specimen Report** | `src/ui/report.ts`, `report-extras.ts`, `humor.ts` | Comment 85–135 chars · Cover 55–85 chars · *Gazette* headline 38–56 chars | **Primary payoff & hook.** On a level's **first delivery**, Vrell's comment delivers the scripted arc beat + next-level hook; subsequent runs rotate souvenir & outcome quips as today. | **Existing UI** · **Small** (~15 LOC in `report.ts` / `humor.ts` using `outcome.newStarFlags[0]` — already computed!). |
| **Abduction Room Props & Mumbles** | `src/abduct/rooms/**`, `src/abduct/souvenir-items.ts`, `en.ts` (`data`) | Mumbles ≤40 chars; zero-text visual props | Environmental storytelling: Doyle's slipper on Spin City wall, Larry asleep in L6 waiting room, tiny monolith crate on L4/L7 manifests, sleep-talk cross-references. | **Existing UI** · **Small** (data/prop placement + 1–2 art sprites). |
| **Beam Shop & Ranks** | `src/ui/upgrades.ts`, `src/levels/progress.ts` | Rank flavour ≤45 chars; shop footer ≤55 chars | Mirrors Zib's promotion from unpaid temp to Fleet Admiral of Naps; footer line can evolve once L6/L8 clears. | **Existing UI** · **Tiny** (copy swap + optional 3-line progress check). |
| **3-Panel Comic Interludes** | **NEW** `src/ui/interlude.ts` + hook in `src/core/game.ts` | 3 stacked panels on 540×960; **≤18 words per panel**, 1–2 speech bubbles each | High-impact season turning points (4 total: Intro, Post-L2, Post-L7, Post-L8). Plays once per save (flag in `SaveData`), instant `tap to skip`, panels pop in one by one like a webcomic. | **New UI** · **Medium** (~180 LOC Pixi scene reusing `NightSky`, `VrellPortrait`, `ZibBubble` art, `panelPath`, `Label` + 4–6 small panel props). |

### Designing the two new UI pieces (mobile-first)

1. **Work Orders Route Strip (Small → Medium, shared with `GDD-5-progression.md`):**
   - Draw a subtle dotted mint transit line running down the left margin behind the level cards (`CARD_X - 10`), connecting `L1 → L2 → [Field Check] → L3 → L4 → L5 → L6 → L7` with a dashed amber "TEMPORAL JUMP" kink into `L8`.
   - Show each card's existing `lt.blurb` (already written in `en.ts`!) in a compact italic line or tooltip when unlocked, and badge the **Next Dispatch** card in mint.
   - If Season 2 Eras ship later, add a 2-pill tab bar (`GRIMSBY · NOW` | `TEMPORAL DISPATCH`) right below the rank header (`y = 252`), zero layout rewrite required.

2. **3-Panel Comic Interlude Scene (`src/ui/interlude.ts`, Medium):**
   - **Layout (540×960 portrait):** Three horizontal comic panels stacked vertically (`w = 492`, `h = 224` each, `gap = 16`, cream paper borders on `NightSky`), with a large `Continue` button at `y = 852` (exact match to `MemoScene.start`) and `tap to skip` at the bottom.
   - **Pacing:** Panel 1 lands immediately; tapping anywhere reveals Panel 2, then Panel 3 (or auto-advances every 2.4 s if untouched; tapping twice skips straight out). Total runtime: **7–10 seconds** if read, **1 second** if skipped.
   - **Art budget:** Built mostly from existing assets (Vrell portrait, Zib portrait, side saucer, mugshots, monolith sprite, toaster/clipboard icons) plus 1 simple composition per panel. No heavy cutscenes, no voice-over, 60 fps WebGL.
   - **Persistence:** `seenInterludes: string[]` in `SaveData` (`src/levels/save.ts`, defaults to `[]` on migration). Never replays automatically once seen; optionally replayable via a tiny `CASE FILE` badge on the Memo header.

---

## 4. Drafted English copy (ready to drop in)

All lines below are sized for their exact pixel boxes at 540×960. Existing strong jokes in `src/i18n/en.ts` are preserved and stitched into the season arc.

### 4.1 Per-level Memos (`src/i18n/en.ts` → `levels.*` + new `signoff` field)

- **L1 — Farmer Doyle Sleeps Like a Log** (`Doyle Farm · Route 9`)
  - `re`: `Work Order #0001 — Farmer Doyle (Probation)`
  - `body`: `Welcome to the night shift, Zib. Your first specimen is Farmer Doyle, 58: sleeps like a log, snores like a chainsaw. Dodge the pickup's headlights and the yard dog. Pass probation and we might even issue you a lanyard.`
  - `joke`: `Reminder: specimens must arrive undamaged, unbruised and ideally unaware. Last quarter's intern returned a man still clutching his toaster. We do not speak his name.`
  - `signoff`: `— Vrell. Sent from my clipboard.`

- **L2 — Laundromat Larry, Night Attendant** (`Spin City Laundromat · Main St`)
  - `re`: `Work Order #0002 — Laundromat Larry`
  - `body`: `Doyle's pickup headed into town, and his missing-slipper flyer is already pinned up at Spin City Laundromat. Grab Larry, the night attendant—six years asleep on duty, a Bureau role model. Watch the van, the diner neon, and the power lines.`
  - `joke`: `Power lines are solid. Last quarter's intern learned that right before the toaster incident. If Larry's mug comes along, do not drink it—we still don't know what decaf is.`
  - `signoff`: `— Vrell. Still watching.`

- **Field Check (GDD-5 transition between L2 and L3)** (`Birch Lane · Maple Court edge`)
  - `re`: `Field Check #0002-B — Off Training`
  - `body`: `The laundromat van turned into Maple Court, and Head Office just dumped a three-specimen shift on my desk. Before sunrise goes live, run one unpaid drill on Birch Lane: trip a porch sensor, clear a door lip, and don't wake the decoy.`
  - `joke`: `No stars, no Glorbs, no permanent record—unless you break the saucer. My pension is eleven weeks away, Zib. Please don't ruin it.`
  - `signoff`: `— Vrell. Unpaid drill, paid expectations.`

- **L3 — Cul-de-Sac Sweep** (`Maple Court · suburbia`)
  - `re`: `Work Order #0003 — Maple Court (bulk order)`
  - `body`: `Training is over. Maple Court has three targets before dawn: Dentist Dave, Coach Barb, and Gary from Neighbourhood Watch. Dodge the cruiser and Mrs. Pruitt's binoculars—she hasn't slept since 1994 and logs everything in a binder.`
  - `joke`: `Gary rigged his garage with laser tripwires to catch prowlers. In eleven years they have caught Gary eleven times. Do not become entry twelve.`
  - `signoff`: `— Vrell. Co-signed under mild protest.`

- **L4 — Downtown Graveyard Shift** (`Grimsby city centre`)
  - `re`: `Work Order #0004 — Grimsby Centre (containment)`
  - `body`: `Thanks to Gary's CCTV complaint and Mrs. Pruitt's photo on City Hall's board, Head Office wants a civic audit: Night Guard Nigel at the museum, DJ Kev at the Bassment, and Mayor Whitlock. Watch the police chopper, traffic, and neon.`
  - `joke`: `The Mayor is an elected official, so file Form 9-V (Votes, Alien). Also check Nigel's ledger—someone shipped an unlisted black rock out of that museum last week.`
  - `signoff`: `— Vrell. My eye is twitching.`

- **L5 — Pier Pressure** (`Barnacle Bay · seaside`)
  - `re`: `Work Order #0005 — Barnacle Bay (species revision)`
  - `body`: `The Mayor's desk flagged an unaccounted crate down at Barnacle Bay—and Head Office now doubts humans are even the second-smartest species here. Grab Bubbles the dolphin, Harbourmaster Pete, and Sal. Hide behind tall things from the lighthouse. Keep the mammal damp.`
  - `joke`: `We tried whales once; the paperwork ran four volumes. If Bubbles offers legal advice, ignore her—you are not authorised to lose an argument to a mammal who outranks you.`
  - `signoff`: `— Vrell. Smells like fish in here.`

- **L6 — Probe Compliance** (`St. Mildred's General · Endoscopy Wing`)
  - `re`: `Work Order #0006 — Mandatory Form 7-B Audit`
  - `body`: `Pete's lighthouse log reached Head Office, and Compliance noticed zero probes logged all quarter. Worse: humans queue voluntarily to be probed here and leave four-star reviews. Collect Hank, Dr. Osei and Mr. Pemberton with Form 7-B ticked en route.`
  - `joke`: `Our probe has been a brass thermometer and a clipboard since 1953. We have no idea where humans got their other theories. Frankly, we are insulted.`
  - `signoff`: `— Vrell. Co-signed in triplicate (send help).`

- **L7 — A Whole Cruise Ship** (`The SS Buffet Royale · at sea`)
  - `re`: `Work Order #0007 — SS Buffet Royale (off-books)`
  - `body`: `Form 7-B flagged a passenger boarding out of Pete's harbour—on the exact ship carrying Grimsby Museum's missing black stone. Grab Captain Sterling, Chef Marco and all-inclusive Greg. The Captain naps with the manifest in his jacket; we'll check his pockets at debrief. Dodge the deck photographer and brace for the swell.`
  - `joke`: `Budget approved by nobody; we're billing this as maritime research. Mrs. Pruitt's sister Doris is on deck with the same binder. Do not beam up the shrimp tower.`
  - `signoff`: `— Vrell. Burn this memo after reading.`

- **L8 — Prior Contact** (`Patent Valley · before dawn`) — 100-second time trial (`GDD-4-monolith.md`): two apes from each roaming troop, then Echo's cave.
  - `re`: `Work Order #0008 — Prior Art (Deadline)`
  - `body`: `Temporal Dispatch found Krix—our old toaster intern—three million years upstream. His OBELISK™ slab taught apes to patent our beam. Hover over two apes from Flint’s troop and two from Reed’s, then lift Echo from the archive before she files at dawn. A slab’s centre is quiet.`
  - `joke`: `I broke into Temporal Dispatch for this, Zib. If a bone flies in Echo's cave, duck—Legal says catching it counts as signing their licence.`
  - `signoff`: `— Vrell. Don't tell Head Office. Good luck, kid.`

---

### 4.2 Vrell's first-delivery arc lines (`src/i18n/en.ts` → new `humor.storyFirstClear`)

Plays in Vrell's Report bubble **only on the first successful delivery of each level** (`outcome.newStarFlags[0] === true`), before normal souvenir/outcome rotation takes over on replays. Every line is 95–135 chars (fits 16 px cleanly) and hooks directly into the next shift.

- **L1 first clear:** `"Not dead, not fired, and Doyle is still snoring. Take Route 9 into town—Spin City's night clerk is next."`
- **L2 first clear:** `"Larry is logged, and Accounting just traced forty missing socks to your saucer. Off training, Zib—Maple Court awaits."`
- **L3 first clear:** `"Suburbia cleared, though Gary filed a complaint and Mrs. Pruitt mailed your photo to City Hall. Grab your helmet—we're going downtown."`
- **L4 first clear:** `"Mayor returned, mostly intact. Nigel's ledger has a black rock sold to a 'maritime buyer', and the Mayor's desk logged its crate to Barnacle Bay."`
- **L5 first clear:** `"Bubbles left a damp note thanking us for the fish—and Pete's log triggered a Compliance audit. Pack the brass thermometer."`
- **L6 first clear:** `"Form 7-B passed, dignity barely bruised. Wait—one patient's chart names the cruise ship carrying Grimsby's missing rock. Set sail."`
- **L7 first clear:** `"The manifest was in the Captain's jacket. The buyer is OBELISK™—signed by… Krix. Basement B-4. Bring a crowbar."`
- **L8 first clear:** `"Patents voided, Krix is getting audited, and Head Office thinks I'm a genius. You're hired, Zib. Actual salary. Don't touch the time dial."`

---

### 4.3 Zib's shift-opener & mid-shift banter (`src/i18n/en.ts` → `humor.deepZib`)

Each line fits the 340 px `ZibBubble` in ≤2 lines (45–82 chars) so it reads in a glance during flight.

- `start3` (keep/tighten): `"Three houses before dawn. Suburbia: ring doorbells, dogs, and grudges."`
- `start4` (keep/tighten): `"Downtown Grimsby. Mom said cities are where saucers go to get towed."`
- `start5` *(new)*: `"Barnacle Bay! Wait—I'm abducting a DOLPHIN? Do I need a towel?"`
- `start6` *(new)*: `"St. Mildred's. Humans pay to get probed here? Earth is deeply weird."`
- `start7` *(new)*: `"A whole cruise ship, off-books. Vrell is definitely getting us both fired."`
- `start8` *(new)*: `"Three million years ago and it's STILL Grimsby. Where's that damn slab?"`
- `twoOfThree` *(new — plays once when 2/3 specimens are in the hold)*:
  - `"Two in the hold! One more and I'm basically a real employee."`
  - `"Two down, one to go. Please don't sneeze on the beam, Zib."`
  - `"Almost done! Vrell might actually call this 'adequate'!"`

---

### 4.4 Progress-gated loading tips (`src/i18n/en.ts` → `loading.tips` tiers)

Existing 13 tips stay in Tier 0 (always available). Unlock 2 new story-reactive tips per milestone as the player progresses:

- **Unlocked after L2:**
  - `"Tip: every odd sock lost in Spin City since 1998 is in Bureau Warehouse 4."`
  - `"Tip: if Mrs. Pruitt waves at you, she is not being friendly. She is calibrating."`
- **Unlocked after L4:**
  - `"Tip: The Grimsby Gazette pays £20 for blurry saucer photos. Do not subsidise them."`
  - `"Tip: Mayor Whitlock has still not noticed his toupee is in orbit."`
- **Unlocked after L5:**
  - `"Tip: Bubbles the dolphin now has her own Bureau parking ring. You still don't."`
  - `"Tip: Form 7-B is strictly medical. Stop giggling in the Endoscopy wing."`
- **Unlocked after L7:**
  - `"Tip: OBELISK™ charges by the note. Our beam plays zero notes and costs nothing."`
  - `"Tip: Temporal Dispatch runs on Form 88-MPH. File expenses before yesterday."`

---

### 4.5 Escalating *Grimsby Gazette* headlines (continuity additions)

Can sit at the front of `reportExtras.headlines[levelId]` so the first time a player gets spotted ≥2 times on a shift, the paper remembers earlier shifts:

- **L3:** `"BLURRY HUBCAP MOVES FROM FARM TO SUBURBS — GARY DEMANDS LASER BUDGET"`
- **L4:** `"PRUITT PHOTO HITS CITY HALL AS MAYOR VANISHES MID-NAP"`
- **L5:** `"HUBCAP SPOTTED AT PIER — AQUARIUM DOLPHIN LEAVES NOTE, QUITS"`
- **L6:** `"ST. MILDRED'S PATIENTS PROBED BY GOOSE FEATHER, RATE WAIT TIME 'FASTER'"`
- **L7:** `"CRUISE GUESTS PHOTOGRAPH UFO — MRS. PRUITT'S SISTER CLAIMS £14.99 BOUNTY"`
- **L8:** `"PREHISTORIC APE PATENTS SKY — LOCAL COUNCIL APPEALS TO MONDAY"`

---

### 4.6 Comic-strip interlude scripts (4 beats, 3 panels each)

Vertical 3-panel comic strip (`src/ui/interlude.ts`), 540×960 portrait, ≤18 words per panel. All four are one-tap skippable and play once per save.

#### Interlude #1 — *Clock-In* (plays once on first tap of `Clock in` before L1)
- **Panel 1** *(Bureau hangar: a dented saucer with a glowing "L" plate; Vrell holds a clipboard next to a smoking toaster in a glass evidence box.)*
  - **Vrell:** `"This is your saucer. Last quarter's intern left us that toaster and a lawsuit."`
- **Panel 2** *(Close-up on Zib gripping a tiny intern badge, phone buzzing with a text: "MUM: Wear a scarf!! Don't get towed!!".)*
  - **Zib:** `"Unpaid, one thumb, no witnesses. Got it! How hard can a sleeping farmer be?"`
- **Panel 3** *(Wide shot of sleepy Grimsby from orbit, a tiny red dot blinking over Route 9.)*
  - **Vrell:** `"Don't bonk him, don't wake him, and if you take his slippers, log them."`

#### Interlude #2 — *Off Probation* (plays once after L2 Report, leading into Field Check / L3)
- **Panel 1** *(Vrell's desk buried in forms; a sticky note reads "QUOTA ×3 — HEAD OFFICE".)*
  - **Vrell:** `"Good news: you survived Spin City. Bad news: Head Office thinks you're ready for suburbia."`
- **Panel 2** *(Vrell slides a cheap lanyard and a blurry photo of Mrs. Pruitt peering through binoculars across the desk.)*
  - **Zib:** `"A real lanyard! Wait—who's the lady with the spy gear?"`
  - **Vrell:** `"Mrs. Pruitt. She hasn't blinked since 1994."`
- **Panel 3** *(Saucer hovering over Birch Lane at dusk; a single porch light clicks amber.)*
  - **Vrell:** `"Sixty-second Field Check first. Screw this up and we're both auditing algae."`

#### Interlude #3 — *Prior Art* (plays once after L7 Report, unlocking L8)
- **Panel 1** *(Bureau debrief room: Zib holds the SS Buffet Royale shipping manifest; Vrell's glasses slide down his nose.)*
  - **Vrell:** `"Grimsby Museum's missing black slab… bought by OBELISK Consulting. Signed by… Krix?!"`
- **Panel 2** *(Insert flashback card: smug alien in a black turtleneck holding a sleek basalt slab—and Farmer Doyle's old toaster under one arm.)*
  - **Zib:** `"Wait—THE toaster intern?! What are they doing with a shiny rock?"`
  - **Vrell:** `"Sending it back three million years to patent the tractor beam before we invented it."`
- **Panel 3** *(Vrell snaps a padlock off a dusty door marked "BASEMENT B-4: TEMPORAL DISPATCH — DO NOT TOUCH".)*
  - **Vrell:** `"Head Office won't authorise this. Which means we leave before dawn. Get in the saucer, kid."`

#### Interlude #4 — *Season Finale: Adequate* (plays once after L8 Report)
- **Panel 1** *(Galactic Legal stamp slams "PATENT REJECTED — PRIOR ART CONFISCATED" over OBELISK's invoice; Krix's turtleneck looks deflated in a tiny inset.)*
  - **Vrell:** `"Three apes, zero royalties, and Krix's lawyers just billed *him* for the bone."`
- **Panel 2** *(Vrell hands Zib a shiny mint staff badge AND answers a ringing Bureau phone labelled "ZIB'S MUM".)*
  - **Vrell:** `"Paid staff. Own parking ring. Yes, madam, Zib is eating—and yes, they were… adequate."`
- **Panel 3** *(Behind them, the dusty Temporal Dispatch console sparks alive on its own, blinking three dates over Grimsby: **1122 AD · 1953 AD · 2199 AD**.)*
  - **Zib:** `"Uh, Vrell? The time dial is humming. And I think 1953 just ordered a thermometer."`

---

### 4.7 French adaptation notes (English-dependent jokes only)

Most jokes translate straight (corporate deadpan, *2001*, *Star Trek*, *The Godfather*, *Back to the Future*, *Hitchhiker's Guide*). Only adapt these specific English wordplays in `src/i18n/fr.ts`:

| English line / term | Why it depends on English | Recommended French adaptation |
| --- | --- | --- |
| **L1: "sleeps like a log"** | Idiom mismatch (*dormir comme une bûche* works, or *comme un loir*). | « dort comme une souche, ronfle comme une tronçonneuse » (keeps the rural timber rhythm). |
| **L5 title: "Pier Pressure"** | Pun on *peer pressure* / *pier*. Already localised in `GDD-3`. | Keep existing « Dauphin de quart » (or « Pression à quai » for subtitle). |
| **L6: "Form 7-B"** | British/US bureaucratic number. | Keep existing « Cerfa 7-B » (lands the bureaucratic joke instantly in FR). |
| **L6: "Rear entrance" route** | Double-entendre on back door / endoscopy. | « Accès par l'arrière » or « Porte de derrière » (preserves the dry PG-13 wink without getting crude). |
| **L8: "Prior Art" / "Prior Contact"** | Patent-law term *prior art* (*antériorité*) + *first contact*. | « Antériorité de contact » / « Premier contact, deuxième passage » (keep GDD-4 title; use « brevet d'antériorité » in `re`). |
| **L8: "The rock just put me on hold."** | Phone-queue idiom (*put on hold*). | « Le caillou vient de me mettre sur liste d'attente. » / « Le rocher m'a mis en attente musicale. » |
| **Interlude #4: "1953 just ordered a thermometer"** | Callback to L6's 1953 probe rule. | Keep literal (« 1953 vient de commander un thermomètre ») — works cleanly in FR. |
| **Loading tip: "Form 88-MPH"** | *Back to the Future* uses 88 mph in the French dub too (« 88 miles à l'heure »!). | Keep « Formulaire 88-MPH » (French dub audiences know "88 miles à l'heure" verbatim). |

---

## 5. Ordered implementation list (cheapest first)

Designed so every tier ships cleanly on its own without blocking other work (and aligns with the steps in [`docs/GDD-5-progression.md`](GDD-5-progression.md)).

| Tier | Cost | Scope & exact files | Existing strings / keys replaced or added | Verification |
| --- | --- | --- | --- | --- |
| **Tier 1 · Pure Copy Stitch** | **Tiny** (copy only, 0 code risk) | Rewrite memos & add continuity headlines in `src/i18n/en.ts` and `src/i18n/fr.ts` (matching keys checked by TypeScript). | Replace `levels.level1..level8.{re,body,joke}`; prepend continuity headlines to `reportExtras.headlines.level3..level8`; refine `ranks[*].flavour` and `title.taglines`. | `npm run typecheck`, `npm test` (existing `report-layout` & i18n parity tests catch any overflow in EN/FR). |
| **Tier 2 · Micro-Hooks on Existing UI** | **Small** (~40 LOC total) | 1. Per-level memo sign-off in `src/ui/memo.ts` (`lt.signoff ?? m.signoff`).<br>2. Fire shift-opener Zib bubble on first leg in `src/flight/deep-scene.ts` + add `start5`..`start8` & `twoOfThree` in `src/levels/humor.ts` and `src/i18n/{en,fr}.ts`.<br>3. First-clear arc beat in `src/levels/humor.ts` & `src/ui/report.ts` using existing `outcome.newStarFlags[0]`.<br>4. Progress-gated loading tips in `src/ui/loading.ts` (pass `save` from `src/core/game.ts`). | Add `levels.*.signoff`; add `humor.storyFirstClear[levelId]`; extend `humor.deepZib` (`start5`–`start8`, `twoOfThree`); add `loading.tierTips`. Keep all existing fallback pools intact. | Unit tests in `tests/levels-humor.test.ts` (first-clear triggers once, replays fall back to souvenir/outcome rotation); phone screenshot check on Memo & Report. |
| **Tier 3 · Dispatch Route Strip & Field Check Copy** | **Small–Medium** (merges with `GDD-5` steps 4–5) | Connect `L1 → L8` visually on `src/ui/workorders.ts` (left-margin transit line, "NEXT DISPATCH" pill, display existing `levels.*.blurb` on unlocked cards). Wire Field Check memo copy into `GDD-5`'s practice scenario. | Uses existing `levels.*.blurb` (already in `en.ts`/`fr.ts`, currently unused on `LevelCard`!); adds `levels.fieldCheck` & `workOrders.nextDispatch`. | `tests/levels-progress.test.ts` + 375×690 pointer pass through Work Orders scroll and card tap. |
| **Tier 4 · Environmental Cameos (Zero-Text Story)** | **Small–Medium** (data + 2–3 small sprites) | Place recurring props/cameos inside existing maps & rooms:<br>• Doyle's slipper flyer on Spin City wall (`src/abduct/rooms/index.ts`).<br>• Pruitt's blurry saucer photo on City Hall corridor wall (`src/abduct/rooms/deep.ts`).<br>• Larry asleep in L6 waiting room background (`src/abduct/rooms/deep-clinic.ts`).<br>• Redacted OBELISK™ shipping crate in L4 museum loading bay & L7 bridge (`deep.ts`, `deep-ship.ts`). | Zero required text (optional 1-line mumble in `en.ts`/`fr.ts` `data`). Pure scenery props (non-colliding, never alter hitboxes or difficulty bands). | `npm run difficulty` (confirm zero change to collision/route pass rates) + visual check at 375×690. |
| **Tier 5 · 3-Panel Comic Interludes** | **Medium** (~180 LOC + 4–6 small panel art pieces) | Create `src/ui/interlude.ts` (`InterludeScene`, Pixi `ViewSlot`, 3 stacked panels, tap-to-advance / tap-to-skip, reduced-motion safe). Add `seenInterludes: string[]` to `SaveData` (`src/levels/save.ts`, backwards-compatible default `[]`). Trigger the 4 interludes from `src/core/game.ts` (`clockIn`, post-L2, post-L7, post-L8). | Add `interludes: { intro, probation, priorArt, finale }` in `src/i18n/{en,fr}.ts`. | Save migration test in `tests/levels-save.test.ts`; E2E check verifying one-tap skip, never replays on second run, and zero impact on headless playthrough scripts. |
| **Tier 6 · Temporal Dispatch Tab (Future-Proof Stub, Only If Eras Are Greenlit)** | **Medium** (when Season 2 starts) | Add `GRIMSBY · NOW` / `TEMPORAL DISPATCH` era switcher to `src/ui/workorders.ts` after L8 clears, unlocking era packs (Prehistoric Time Trial, 1122 Keep, 1953 Mob Docks, 2199 Orbit) on the same save format. | Add `workOrders.eraTabs` and per-era dispatch headers in `src/i18n/{en,fr}.ts`. | Save compatibility + phone layout check on tab switch. |
