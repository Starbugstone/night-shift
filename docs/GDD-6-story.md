# Night Shift: narrative design (v4, Season 1 & beyond)

This document defines the story bible, season arc, mobile delivery rules, drop-in English copy, and phased implementation plan for **Night Shift**. It extends [`docs/GDD.md`](GDD.md), [`docs/GDD-2-deeper.md`](GDD-2-deeper.md), [`docs/GDD-3-new-shifts.md`](GDD-3-new-shifts.md), [`docs/GDD-4-monolith.md`](GDD-4-monolith.md), and aligns directly with the progression and Grimsby dispatch route in [`docs/GDD-5-progression.md`](GDD-5-progression.md).

**Tone & audience (AGENTS.md v4):** **PG-13, leaning 16.** Workplace satire, bureaucratic absurdity, mild swearing (*damn, hell, crap, ass*), cheeky innuendo, probe/butt gags, and internationally known film/pop-culture nods (sci-fi and beyond). Nothing sexually explicit, no slurs, nobody real mocked. English is the primary audience; French is a small part and adapts puns where needed, never carrying French-only premises. Rights hygiene follows [`docs/research/scifi-references.md`](research/scifi-references.md): original phrasing, original art, no copied catchphrases or protected branding.

---

## 1. Story bible

### The premise

The **Galactic Census Bureau (Abductions Dept.)** has been quietly auditing Earth since 1947. Not to conquer it — conquering requires an environmental impact study — just to keep the paperwork current, check whether humans are still the smartest thing on the rock, and log the occasional brass-thermometer reading.

The entire Grimsby night beat is staffed by two people: an exhausted middle manager who wants an uneventful quarter before retirement, and an unpaid intern flying a hand-me-down saucer with one thumb. Over one escalating season of night shifts, a routine rural census snowballs into a town-wide tabloid scandal, an internal Compliance audit, and a corporate turf war with a slick rival contractor trying to patent humanity before dawn.

### Main cast

#### Intern Zib (the player)
- **Who:** A wide-eyed, green, over-caffeinated junior intern on their first solo night rotation. Flies with their tongue poking out, picks their nose when parked (`src/flight/pilot.ts`), and treats Earth like a weird, fragile thrift shop.
- **What Zib wants:** **A permanent badge, a paid contract, and their own parking ring** — mostly so their mother stops phoning Head Office to ask if Zib is eating enough and whether saucers have airbags.
- **Comic flaw:** Enthusiastic, polite, and mildly kleptomaniac. Zib cries over a stolen UFO snow globe, puts a hospital bedpan on their head, names a set of stolen dentures "Gary," and polishes a silver butt plug assuming it is a decorative probe.
- **Arc:** Starts terrified of headlights and desperate for Vrell's approval (L1–L2) → discovers genuine pride in pulling off impossible shifts while leaving a chaotic trail of souvenirs (L3–L5) → realizes the Bureau's rules are ridiculous *and* that Vrell is secretly covering for them (L6–L7) → outsmarts a billion-glorb rival firm with sheer stubbornness and wins real respect and an actual salary (L8) → saves Grimsby and gets their own parking ring (2199).

#### Supervisor Vrell (the tutor)
- **Who:** A purple, bespectacled, permanently tired middle-management blob welded to a clipboard (`ui/vrell_portrait` / `ui/vrell_furious`). Motto: *"Adequate. My favourite word. It means I don't have to talk to anyone."*
- **What Vrell wants:** To survive his final quarter before his pension vests without Head Office, Accounting, or Compliance opening a file with his name on it.
- **Secret:** Vrell *was* a field pilot in 1953, the night he borrowed a farm’s brass thermometer and devised the log that became Form 7-B. He still cares about doing a clean abduction — he just hides it behind passive-aggressive HR memos.
- **Arc (from supervisor → nervous co-signer → reluctant mentor):**
  - **L1–L2:** Distant, jaded HR voice. Treats Zib as replaceable (*"Last quarter's intern…"*).
  - **Field Check–L4:** Grudgingly takes Zib off training, then panics as Grimsby's sightings pile up on *his* signature line.
  - **L5–L6:** Realizes Head Office and Compliance are setting him up as the fall guy. Starts subtly coaching Zib and signing off on sketchy expense forms (*"Budget approved by nobody"*).
  - **L7–L8:** Full co-conspirator. Breaks into the Bureau's mothballed **Temporal Dispatch** basement with Zib to stop the rival from burying their department — and, for the first time, puts Zib's name *ahead* of his own on a memo.
  - **2199:** His pension vests. He files the form in LATER and stays on as Zib’s mentor.

#### The Galactic Census Bureau
A sprawling cosmic civil service running on 1950s hardware and triplicate forms:
- **Abductions Dept. (Night Shift):** Underfunded, understaffed, blamed for everything.
- **Head Office:** Distant executives who send vague mandates (*"vertical slice of civic life"*, *"check if dolphins are smarter"*) and take credit when things go right.
- **Compliance & Internal Affairs:** Terrifying clipboard zealots obsessed with **Form 7-B** (Probes) and **Form 27-B/6** (Specimen Intake).
- **Accounting:** Remembers every stolen toaster, disputes every sardine tin, refuses to explain what decaf is.
- **The Tuesday Crew:** The frat-boy day/Tuesday shift who leave sloppy crop circles everywhere and blame Zib.
- **The Tripod Division:** Still on sick leave since catching an Earth cold.
- **Temporal Dispatch (Basement B-4):** Mothballed in 1985 after an expense-report paradox. Holds one dusty chrono-dial (Form 88-MPH) — the dial used at L8 and through the rest of the season.

#### The Rival: **OBELISK™ (Uplift & Branding Solutions)**
- **Who:** The black-monolith people from L8 (`docs/GDD-4-monolith.md`). While the Bureau uses clunky saucers, floppy tractor beams, and brass thermometers, OBELISK™ is a smug, venture-funded cosmic consultancy: minimalist matte-black slabs, pretentious three-note chimes, zero Census permits, and aggressive intellectual-property lawyers.
- **Their racket:** Instead of doing honest census work, they drop black slabs on primitive worlds, teach one ape to throw a femur, help them open a patent office on Tuesday, and claim **prior-art royalties on every tool, vehicle, and tractor beam ever invented afterward** — effectively privatizing Earth out from under the Bureau.
- **The twist (pays off L1's running gag):** OBELISK's shiny new Senior VP of Disruptive Contact is **Krix — "last quarter's intern,"** the guy who returned a man still holding his toaster, hit a power line, got fired by Vrell, and walked across the street to the Monolith people with the Bureau's Grimsby client list.

### Running mysteries & gags

| Thread | Setup | Escalation | Payoff |
| --- | --- | --- | --- |
| **What happens to the specimens?** | L1 memo: *"undamaged, unbruised and ideally unaware."* | Specimens are weighed, measured, given a complimentary biscuit, memory-dusted, and dropped back in bed minus one slipper. | They *remember fragments* as weird dreams — and slowly realize half of Grimsby had the exact same dream. |
| **Last quarter's intern** | L1 memo: returned a man holding a toaster; loading tip: hit power lines. | L7 memo: Accounting still brings up the toaster. | L8 reveal: he didn't quit the industry — he defected to OBELISK™ and tipped them off about Grimsby's museum slab. |
| **Zib's Mum** | L1–L4 Zib bubbles: warned Zib about cops, cities, pigeons, souvenir mugs. | L3+ perfect report: she phones Head Office to ask if Zib is eating enough. | 2199 first clear: Vrell tells Zib he called their work adequate when their mother phoned. |
| **Cats are management** | Loading tip: *"Cats are not specimens. Cats are management."* | Crumb (#0003), Kipper (L5) and Anchovy (L7) outrank or boss the humans around. | Anchovy literally runs the SS Buffet Royale bridge after Sterling is beamed up; Kipper takes a cut of Sal's petty cash. |
| **The Missing Sock Hoard** | L2 odd sock: *"So that's where they go. It's us. It was always us."* | Every level leaves a bizarre souvenir in the hold; Zib hoards them like a magpie. | Vrell's cover stories keep blaming swamp gas on increasingly absurd stolen objects (toupee, silver plug, lime mankini). |
| **The Hendersons** | #0004: The Hendersons are away. Nora house-sits and their gnome finally leaves. | Zib wears Gary's tinfoil hat and claims he can hear the Hendersons. | The Hendersons stay offscreen. The collected gnome sends them three era postcards. |
| **The 1953 Probe Protocol** | L6: *"a brass thermometer and a clipboard since 1953."* | Humans voluntarily queue for endoscopies and rate them 4/5, humiliating the Bureau. | The first [1953 delivery](GDD-13-1953-tripods.md) reveals why rookie Vrell borrowed the brass thermometer and how his fever log became Form 7-B. |

### Recurring humans & Grimsby continuity

Grimsby ties Season 1 together. The route runs from Route 9 through Birch Lane, Maple Court and City Centre to Barnacle Bay, St. Mildred’s, the cruise liner and the prehistoric riverbed. Crest Valley is the next valley over. The Gazette covered it in 1955 and runs the clipping under “From our archives”.

- **Laundromat Larry (Recurring Specimen / Cameo):** Beamed out of Spin City in L2 → gets a breakfast roll set aside by Mabel (#0003). A proposed L6 scenery cameo would show him asleep across the waiting-room chairs with ticket #346.
- **Farmer Doyle (Recurring Offscreen Complainant):** L1 specimen → his missing slipper ends up pinned to Spin City's "Lost & Found" noticeboard in L2; by L3/L4 his angry letters appear in *The Grimsby Gazette* blaming the Hendersons.
- **Gary, Neighbourhood Watch (Escalating Nemesis):** #0004 introduces his alarm, which has already caught him four times. L3’s new laser raises the count to eleven → files a formal CCTV complaint to City Hall (L4 hook) → his tinfoil hat and "I SAW SOMETHING" newsletter keep feeding *The Grimsby Gazette* through L7.
- **Mrs. Pruitt & Sister Dorothy "Doris" (The Binoculars Ring):** Mrs. Pruitt hasn't slept since 1994 (#0004 watcher). In L3 she shouts *"DOROTHY! THE BOOK!"* in `en.ts`. Her blurry photo lands on City Hall's noticeboard (L4) → her sister **Doris** takes the same logbook on holiday aboard the *SS Buffet Royale* (L7 watcher), closing the loop between Maple Court and open water.
- **Officer Dobbs / Unit 4 (Recurring Witness):** L3 cruiser cop who radios in *"a large hubcap, airborne"* → transferred to L4 downtown patrol after the station party replays his dashcam clip twice.
- **Bubbles the Dolphin (Recurring Bureau Rival):** L5 specimen who sleeps with half her brain and still outranks Zib → audits Accounting from the Bureau’s porthole tank. For the 2199 shift she forwards the planning notice from her present-day tank and signs her ring over to Zib.
- **Greg (Recurring Tourist Hazard):** L7 all-inclusive menace in three stolen towels and a lime mankini → prime cameo candidate for any future beach, festival, or hotel level (*"Is this era all-inclusive?"*).
- ***The Grimsby Gazette* (Town Panic Meter):** Already rendered as a newspaper clipping on the Report whenever Zib is spotted ≥2 times (`reportExtras.masthead`). Across L1→L8 its tone escalates from rural eccentricity (*"COWS DENY ALL KNOWLEDGE"*) to civic denial (*"MAYOR BEAMED UP, CITY HALL RUNS AS NORMAL"*) to full absurdity (*"LOCAL APE THROWS BONE, LAWYERS CLAIM AIRSPACE"*).

---

## 2. Season 1 arc through 2199

### Acts I–III and the Dispatch finale

- **Act I — Probation (L1 → L2 → optional Field Check → Birch Lane):** Zib learns to fly, gets a temporary lanyard at Larry’s report and takes two live calls before Maple Court. See [Birch Lane](GDD-11-onramp.md).
- **Act II — The Grimsby Paper Trail (L3 → L4 → L5):** One messy night in the suburbs leaks to City Hall, which leaks to the harbour. *The Grimsby Gazette* starts connecting the dots, and the first weird clue appears: a dolphin smarter than the census report said she should be, plus an unaccounted crate on the Mayor's desk.
- **Act III — The Audit & The Slab (L6 → L7 → L8):** Compliance ambushes Vrell over zero logged probes, forcing the humiliating hospital audit; then a manifest snag leads Zib onto a cruise ship carrying a stolen black stone exhibit from Grimsby Museum. Tracing its provenance exposes **OBELISK™** (and last quarter's intern) trying to retroactively patent human tool-use three million years upstream. Vrell cracks open Temporal Dispatch and sends Zib back before dawn to settle the score.

- **Temporal Dispatch (1955 → 1122 and 1953 → 2199):** Zib starts the era orders as junior staff. Both historical deliveries clear the way for the 2199 finale.

### Beat-by-beat map through the Act III climax

Compatible with Sol's fresh-save delivery unlock order (`GDD-5-progression.md`) **and** legacy saves where L3–L7 are already unlocked: every memo stands on its own punchline if read out of order, while sequential play builds a clean cause-and-effect chain.

| Order | Act & District | Story beat (what changes) | Callback to previous | Hook into next |
| --- | --- | --- | --- | --- |
| **L1** | **Act I · Doyle Farm (Route 9)** | Zib's first solo shift. Unpaid, terrified, flying a borrowed saucer. Vrell expects Zib to crash like last quarter's intern (the toaster guy). | *Opening:* Interlude #1 (Clock-In) establishes Zib's Mum, Vrell's clipboard, and the missing predecessor. | Doyle's pickup heads down Route 9 toward town — and Doyle's lost slipper/missing-pet flyer reaches Spin City's noticeboard. |
| **L2** | **Act I · Spin City Laundromat (Main St)** | First taste of town hazards (neon, wires, fan). Zib discovers the Bureau is why Earth loses single socks. | Memo cites Doyle's clean(ish) intake and the flyer pinned above Larry's coffee mug. | The van points to Birch Lane. Head Office orders a Maple Court sweep. Vrell issues the lanyard and assigns two smaller live calls first. |
| **Field Check** | **Act I→II · Birch Lane / Maple Court edge** | Unpaid 60-second graduation drill before the real clock starts (Sol's `GDD-5` exercise). Vrell nervously tests whether Zib can survive a porch sensor and a second sleeper without getting him fired. | Vrell has already issued the lanyard on Larry’s report. | Either skip or complete the drill to continue to the bakery. |
| **#0003** | **Act I · Birch Lane Bakery** | First live call. Mabel’s feet pass over the keys under Crumb. | Mabel keeps Larry’s breakfast roll waiting. | The Hendersons’ turn is next. |
| **#0004** | **Act I · Hendersons’ garage and Len’s workshop** | First live sunrise clock. Mrs. Pruitt and Gary are introduced. | Doyle’s flying slipper makes the Gazette. | The gnome can send postcards from the eras. |
| **L3** | **Act II · Maple Court (Suburbia)** | First three-specimen shift under a sunrise clock. Mrs. Pruitt is still watching and Gary has expanded his garage arsenal. | Reuses the Birch Lane van landmark from L2 and the porch/sleeper rules from Field Check. | Gary files a furious CCTV complaint and Mrs. Pruitt mails her blurry saucer photo straight to **City Hall** — forcing Head Office to audit downtown Grimsby next. |
| **L4** | **Act II · Grimsby City Centre** | Stakes go municipal: a police helicopter, a museum, a nightclub, and Mayor Whitlock. **First rival clue:** Nigel's museum manifest has a redacted entry for *"One (1) matte-black slab, riverbed dig — sold to private maritime buyer."* | Pruitt's photo is pinned to City Hall's noticeboard; Officer Dobbs (Unit 4) is back on patrol; Gary's complaint sits on the Mayor's desk. | The Mayor's desk ledger flags an unaccounted fish-market shipment at **Barnacle Bay** — and a postcard of the lighthouse sits in Nigel's gift shop. |
| **L5** | **Act II · Barnacle Bay (Seaside)** | Species shock: Head Office suspects humans are only third-smartest. Zib beams up Bubbles the dolphin, Harbourmaster Pete, and Sal. Bubbles leaves a polite note that rattles Vrell — someone has been *coaching* Earth's wildlife? | Follows the harbour road from L4; Sal's ledger ("one outstanding") matches the Mayor's missing crate. | Pete's lighthouse log and a local broadcast about a "flying hubcap at the aquarium" trigger a **Compliance audit** at Head Office. Zero probes logged all quarter. |
| **L6** | **Act III · St. Mildred's General (Endoscopy Wing)** | Humiliation peak. Compliance forces Vrell and Zib to log Form 7-B probe readings on three specimens — in a hospital where humans *queue voluntarily* to be probed and leave 4-star reviews. Vrell is personally offended and starts siding with Zib against Compliance. | Service road shares Barnacle Bay's townward sign; **Larry** cameos asleep in the waiting room in his Spin City polo; Pete's log is cited as the audit trigger. | Form 7-B flags an anomaly: a passenger who listed *"buffet"* as emergency contact is boarding the **SS Buffet Royale** — the exact ship carrying the museum's missing black stone exhibit. |
| **L7** | **Act III · SS Buffet Royale (Open Water)** | High-seas caper. Vrell approves the mission *without* Head Office's budget ("maritime research"). Zib dodges the deck photographer and Doris (Mrs. Pruitt's sister, wielding the same logbook), grabs Captain Sterling, Chef Marco, and Greg. The shipping manifest rides along in the Captain's jacket, and the Bureau finds it at debrief. | Departs from Pete's dock (lighthouse silhouette); Captain keeps a photo of Pete & Anchovy by the compass; Doris shouts back to Pruitt's logbook. | **Twist (Interlude #3):** The manifest's buyer is **OBELISK™**, signed by **Krix** (last quarter's toaster intern!). They didn't just steal a rock — they sent a live slab *back* to Grimsby's dry riverbed three million years ago to patent the tractor beam as "prior art." |
| **L8** | **Act III · Patent Valley (Prehistoric Grimsby)** | Act III climax. Vrell breaks the padlock on **Temporal Dispatch (Basement B-4)** and sends Zib up the dry riverbed before dawn — three million years early — to abduct three newly-uplifted apes (Flint, Reed, Echo) before Echo stamps the Bureau out of business. | Echo's patent claim directly calls back to Zib's L1 beam and Nigel's missing museum slab; Krix's OBELISK™ branding is stamped on the monolith's bevel. | **Adequate.** The patents are voided and Vrell hires Zib. The first new date is **1955**. |

### Temporal Dispatch through the season finale

| Work order | When it opens | Story |
| --- | --- | --- |
| #0011 · 1955 | L8 delivery | [Clocking Out at 10:04](GDD-10-1955.md) takes Zib to Crest Valley, the next valley over. Use the Grimsby Gazette’s 1955 archive treatment. |
| #0012 · 1122 | First 1955 delivery | [Ni!](GDD-12-1122-grail.md) voids Krix’s claim to the Holy Grail. Suggested first dispatch. |
| #0013 · 1953 | First 1955 delivery | [The War of the Worlds](GDD-13-1953-tripods.md) shows rookie Vrell and the Tripod Division at the Route 9 drive-in. |
| #0014 · 2199 | Deliveries in both 1122 and 1953 | [Your Town Is in the Way](GDD-14-2199-hitchhiker.md) saves Grimsby, bills Krix and gives Zib the parking ring. |

1122 and 1953 work in either play order. All Dispatch trips leave from the present. Vrell’s first-clear lines stay with the date just played. Keep the dial quiet once the finale has played and offer replay of delivered orders. See the [chronology](story/continuity-review.md#1-canonical-timeline) and [settled decisions](story/decisions.md).

## 3. Narrative delivery & mobile readability

The comic sketches and proposed UI in this section describe unshipped work. The season finale uses the sequence in [GDD-14](GDD-14-2199-hitchhiker.md#season-finale).

### The Three-Depth Rule (respecting text-skippers)

Players on a 375×690 phone tap through blocks of prose. The story therefore works at three independent layers:
1. **Zero-Reader Layer (visuals & props only):** Zib's animated cockpit expressions (`pilot.ts`), Vrell's normal vs. furious portrait, mugshots on cards, *The Grimsby Gazette* clipping slapping onto the Report, the missing-slipper flyer in Mabel’s window, the lighthouse silhouette linking L4→L5→L7, and souvenirs carried in the beam.
2. **Skimmer Layer (≤ 12 words per glance):** Work Order card title + blurb, Memo `RE:` line + yellow joke callout, Zib's 1-line flight bubbles, *Gazette* ALL-CAPS headlines, Vrell's Memo sign-off line.
3. **Reader Layer (full comedy payoff):** Memo body (35–42 words), Vrell's Report comment + cover story, progress-gated Loading Tips, and the skippable three-panel 2199 epilogue.

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
| **3-Panel Comic Interludes** | **NEW** `src/ui/interlude.ts` + hook in `src/core/game.ts` | 3 stacked panels on 540×960; **≤18 words per panel**, 1–2 speech bubbles each | Unshipped sketches for Clock-In, post-L2, post-L7 and the Act III climax. The 2199 epilogue has its own script. Plays once per save (flag in `SaveData`), instant `tap to skip`, panels pop in one by one like a webcomic. | **New UI** · **Medium** (~180 LOC Pixi scene reusing `NightSky`, `VrellPortrait`, `ZibBubble` art, `panelPath`, `Label` + 4–6 small panel props). |

### Designing the two new UI pieces (mobile-first)

1. **Work Orders Route Strip (Small → Medium, shared with `GDD-5-progression.md`):**
   - Draw a subtle dotted mint transit line running down the left margin behind the level cards (`CARD_X - 10`), connecting `L1 → L2 → [Field Check] → #0003 → #0004 → L3 → L4 → L5 → L6 → L7` with a dashed amber "TEMPORAL JUMP" kink into `L8`.
   - Show each card's existing `lt.blurb` (already written in `en.ts`!) in a compact italic line or tooltip when unlocked, and badge the **Next Dispatch** card in mint.
   - For Dispatch dates, use a two-tab bar (`GRIMSBY · NOW` | `TEMPORAL DISPATCH`) right below the rank header (`y = 252`), zero layout rewrite required.

2. **Proposed three-panel scene**
   - **Layout (540×960 portrait):** Three horizontal comic panels stacked vertically (`w = 492`, `h = 224` each, `gap = 16`, cream paper borders on `NightSky`), with a large `Continue` button at `y = 852` (exact match to `MemoScene.start`) and `tap to skip` at the bottom.
   - **Pacing:** Panel 1 lands immediately; tapping anywhere reveals Panel 2, then Panel 3 (or auto-advances every 2.4 s if untouched; tapping twice skips straight out). Total runtime: **7–10 seconds** if read, **1 second** if skipped.
   - **Art budget:** Built mostly from existing assets (Vrell portrait, Zib portrait, side saucer, mugshots, monolith sprite, toaster/clipboard icons) plus 1 simple composition per panel. No heavy cutscenes, no voice-over, 60 fps WebGL.
   - **Persistence:** `seenInterludes: string[]` in `SaveData` (`src/levels/save.ts`, defaults to `[]` on migration). Never replays automatically once seen; optionally replayable via a tiny `CASE FILE` badge on the Memo header.

---

## 4. Drafted English copy

Validate proposed copy in both locales at 540×960 and at phone scale. Existing strong jokes in `src/i18n/en.ts` are preserved and stitched into the season arc.

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

- **Field Check (optional between L2 and #0003)** (`Birch Lane · Maple Court edge`)
  - `re`: `Field Check #0002-B — Off Training`
  - See the [Field Check handoff](GDD-11-onramp.md#the-dispatch-curve) for the body and both routes to the bakery.
  - `joke`: `No stars, no Glorbs, no permanent record—unless you break the saucer. My pension is eleven weeks away, Zib. Please don't ruin it.`
  - `signoff`: `— Vrell. Unpaid drill, paid expectations.`

- **L3 — Cul-de-Sac Sweep** (`Maple Court · suburbia`)
  - `re`: `Work Order #0005 — Maple Court (bulk order)`
  - See the [Maple Court handoff](GDD-11-onramp.md#the-dispatch-curve) for the memo body and Gary’s eleven catches.
  - `signoff`: `— Vrell. Co-signed under mild protest.`

- **L4 — Downtown Graveyard Shift** (`Grimsby city centre`)
  - `re`: `Work Order #0006 — Grimsby Centre (containment)`
  - `body`: `Thanks to Gary's CCTV complaint and Mrs. Pruitt's photo on City Hall's board, Head Office wants a civic audit: Night Guard Nigel at the museum, DJ Kev at the Bassment, and Mayor Whitlock. Watch the police chopper, traffic, and neon.`
  - `joke`: `The Mayor is an elected official, so file Form 9-V (Votes, Alien). Also check Nigel's ledger—someone shipped an unlisted black rock out of that museum last week.`
  - `signoff`: `— Vrell. My eye is twitching.`

- **L5 — Pier Pressure** (`Barnacle Bay · seaside`)
  - `re`: `Work Order #0007 — Barnacle Bay (species revision)`
  - `body`: `The Mayor's desk flagged an unaccounted crate down at Barnacle Bay—and Head Office now doubts humans are even the second-smartest species here. Grab Bubbles the dolphin, Harbourmaster Pete, and Sal. Hide behind tall things from the lighthouse. Keep the mammal damp.`
  - `joke`: `We tried whales once; the paperwork ran four volumes. If Bubbles offers legal advice, ignore her—you are not authorised to lose an argument to a mammal who outranks you.`
  - `signoff`: `— Vrell. Smells like fish in here.`

- **L6 — Probe Compliance** (`St. Mildred's General · Endoscopy Wing`)
  - `re`: `Work Order #0008 — Mandatory Form 7-B Audit`
  - `body`: `Pete's lighthouse log reached Head Office, and Compliance noticed zero probes logged all quarter. Worse: humans queue voluntarily to be probed here and leave four-star reviews. Collect Hank, Dr. Osei and Mr. Pemberton with Form 7-B ticked en route.`
  - `joke`: `Our probe has been a brass thermometer and a clipboard since 1953. We have no idea where humans got their other theories. Frankly, we are insulted.`
  - `signoff`: `— Vrell. Co-signed in triplicate (send help).`

- **L7 — A Whole Cruise Ship** (`The SS Buffet Royale · at sea`)
  - `re`: `Work Order #0009 — SS Buffet Royale (off-books)`
  - `body`: `Form 7-B flagged a passenger boarding out of Pete's harbour—on the exact ship carrying Grimsby Museum's missing black stone. Grab Captain Sterling, Chef Marco and all-inclusive Greg. The Captain naps with the manifest in his jacket; we'll check his pockets at debrief. Dodge the deck photographer and brace for the swell.`
  - `joke`: `Budget approved by nobody; we're billing this as maritime research. Mrs. Pruitt's sister Doris is on deck with the same binder. Do not beam up the shrimp tower.`
  - `signoff`: `— Vrell. Burn this memo after reading.`

- **L8 — Prior Contact** (`Patent Valley · before dawn`) — 100-second time trial (`GDD-4-monolith.md`): two apes from each roaming troop, then Echo's cave.
  - `re`: `Work Order #0010 — Prior Art (Deadline)`
  - `body`: `Temporal Dispatch found Krix—our old toaster intern—three million years upstream. His OBELISK™ slab taught apes to patent our beam. Hover over two apes from Flint’s troop and two from Reed’s, then lift Echo from the archive before she files at dawn. A slab’s centre is quiet.`
  - `joke`: `I broke into Temporal Dispatch for this, Zib. If a bone flies in Echo's cave, duck—Legal says catching it counts as signing their licence.`
  - `signoff`: `— Vrell. Don't tell Head Office. Good luck, kid.`

---

### 4.2 Vrell's first-delivery arc lines (`src/i18n/en.ts` → new `humor.storyFirstClear`)

Plays in Vrell's Report bubble **only on the first successful delivery of each level** (`outcome.newStarFlags[0] === true`), before normal souvenir/outcome rotation takes over on replays. Start from the report’s comment budget and check both locales on a phone. Era first clears resolve their own shifts.

- **L1 first clear:** `"Not dead, not fired, and Doyle is still snoring. Take Route 9 into town—Spin City's night clerk is next."`
- **L2 first clear:** See the Larry handoff in [Birch Lane](GDD-11-onramp.md#the-dispatch-curve).
- **L3 first clear:** `"Suburbia cleared, though Gary filed a complaint and Mrs. Pruitt mailed your photo to City Hall. Grab your helmet—we're going downtown."`
- **L4 first clear:** `"Mayor returned, mostly intact. Nigel's ledger has a black rock sold to a 'maritime buyer', and the Mayor's desk logged its crate to Barnacle Bay."`
- **L5 first clear:** `"Bubbles left a damp note. Pete's log triggered a Compliance audit. Pack the brass thermometer."`
- **L6 first clear:** `"Form 7-B passed, dignity barely bruised. Wait—one patient's chart names the cruise ship carrying Grimsby's missing rock. Set sail."`
- **L7 first clear:** `"The manifest was in the Captain's jacket. The buyer is OBELISK™—signed by… Krix. Basement B-4. Bring a crowbar."`
- **L8 first clear:** `"Patents voided, Krix is getting audited, and Head Office thinks I'm a genius. You're hired, Zib. Actual salary. Don't touch the time dial."`

---

### 4.3 Zib's shift-opener & mid-shift banter (`src/i18n/en.ts` → `humor.deepZib`)

Each line fits the 340 px `ZibBubble` in ≤2 lines (45–82 chars) so it reads in a glance during flight.

- `start3` (keep/tighten): `"Three houses before dawn. Suburbia: ring doorbells, dogs, and grudges."`
- `start4` (keep/tighten): `"Downtown Grimsby. Mom said cities are where saucers go to get towed."`
- `start5` *(new)*: `"Barnacle Bay! Wait—I'm abducting a DOLPHIN? Do I need a bucket?"`
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
  - `"Tip: Vrell flew field shifts in 1953. He says the uniform was warmer then."`
- **Unlocked after L7:**
  - `"Tip: OBELISK™ charges by the note. Our beam plays zero notes and costs nothing."`
  - `"Tip: Temporal Dispatch runs on Form 88-MPH. File expenses before yesterday."`
  - `"Tip: Bubbles now audits Accounting from the porthole tank by Vrell’s desk. Knock twice."`

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

### 4.6 Comic-strip interlude sketches (unshipped)

Each sketch assumes three panels at 540×960, at most 18 words per panel, with a single skip action and one automatic presentation per save.

#### Interlude #1 — *Clock-In* (plays once on first tap of `Clock in` before L1)
- **Panel 1** *(Bureau hangar: a dented saucer with a glowing "L" plate; Vrell holds a clipboard next to a smoking toaster in a glass evidence box.)*
  - **Vrell:** `"This is your saucer. Last quarter's intern left us that toaster and a lawsuit."`
- **Panel 2** *(Close-up on Zib gripping a tiny intern badge, phone buzzing with a text: "MUM: Wear a scarf!! Don't get towed!!".)*
  - **Zib:** `"Unpaid, one thumb, no witnesses. Got it! How hard can a sleeping farmer be?"`
- **Panel 3** *(Wide shot of sleepy Grimsby from orbit, a tiny red dot blinking over Route 9.)*
  - **Vrell:** `"Don't bonk him, don't wake him, and if you take his slippers, log them."`

#### Interlude #2 — *Off Probation* (plays once after L2 Report, leading into Field Check or #0003)
- **Panel 1** *(Vrell's desk buried in forms; a sticky note reads "QUOTA ×3 — HEAD OFFICE".)*
  - **Vrell:** `"Good news: you survived Spin City. Bad news: Head Office thinks you're ready for suburbia."`
- **Panel 2** *(Vrell slides a cheap lanyard across the desk.)*
  - **Zib:** `"A real lanyard! Is it supposed to say TEMPORARY on both sides?"`
- **Panel 3** *(Saucer hovering over Birch Lane at dusk; a single porch light clicks amber.)*
  - **Vrell:** `"Sixty-second Field Check first. Screw this up and we're both auditing algae."`

#### Interlude #3 — *Prior Art* (plays once after L7 Report, unlocking L8)
- **Panel 1** *(Bureau debrief room: Zib holds the SS Buffet Royale shipping manifest; Vrell's glasses slide down his nose.)*
  - **Vrell:** `"Grimsby Museum's missing black slab… bought by OBELISK Consulting. Signed by… Krix?!"`
- **Panel 2** *(Insert flashback card: smug alien in a black turtleneck holding a sleek basalt slab—and Krix's toaster under one arm.)*
  - **Zib:** `"Wait—THE toaster intern?! What are they doing with a shiny rock?"`
  - **Vrell:** `"Sending it back three million years to patent the tractor beam before we invented it."`
- **Panel 3** *(Vrell snaps a padlock off a dusty door marked "BASEMENT B-4: TEMPORAL DISPATCH — DO NOT TOUCH".)*
  - **Vrell:** `"Head Office won't authorise this. Which means we leave before dawn. Get in the saucer, kid."`

#### Interlude #4 — *Adequate* (Act III climax after L8)

- **Panel 1** (Galactic Legal stamps OBELISK™’s invoice. Krix’s turtleneck looks deflated.)
  - **Vrell:** `"Three apes, zero royalties, and Krix’s lawyers just billed him for the bone."`
- **Panel 2** (Vrell hands Zib a mint staff badge.)
  - **Vrell:** `"You’re hired, Zib. Actual salary."`
- **Panel 3** (The Temporal Dispatch console blinks **1955**.)
  - **Zib:** `"Uh, Vrell? The time dial is humming."`

The L9 first-clear handoff adds the line “Why is it blinking two more dates?” The dial opens **1122** and **1953** at that point. **2199** unlocks after both. The 2199 script owns Vrell’s reply to Zib’s mother, the vested retirement form, Bubbles’ farewell and the parking ring.

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
| **Tier 5 · 3-Panel Comic Interludes** | **Medium** (~180 LOC + 4–6 small panel art pieces) | Create `src/ui/interlude.ts` (`InterludeScene`, Pixi `ViewSlot`, 3 stacked panels, tap-to-advance / tap-to-skip, reduced-motion safe). Add `seenInterludes: string[]` to `SaveData` (`src/levels/save.ts`, backwards-compatible default `[]`). Trigger the 4 interludes from `src/core/game.ts` (`clockIn`, post-L2, post-L7, post-L8). | Add `interludes: { intro, probation, priorArt, adequate }` in `src/i18n/{en,fr}.ts`. | Save migration test in `tests/levels-save.test.ts`; E2E check verifying one-tap skip, never replays on second run, and zero impact on headless playthrough scripts. |
| **Tier 6 · Temporal Dispatch** | **Medium** | Connect Dispatch to the stable order IDs. Open 1955 after L8, then 1122 and 1953 after 1955, then 2199 after both. | Add `workOrders.eraTabs` and per-era dispatch headers in `src/i18n/{en,fr}.ts`. | Save compatibility + phone layout check on tab switch. |

---

## 6. Running jokes

**Rules (user guidance, 2026-11-25):**
- **At most 2–3 running jokes active** in any single level or screen.
- **Clear setup first:** every running joke must be introduced plainly where it first appears so a new player can follow it without reading outside lore.
- **Obvious references only:** no deep cuts, no stacking two references in one line, and every line should still make sense cold to someone who hasn't seen the film.

### Active running jokes (kept & tracked)

| Running joke | Where it is set up | Where it pays off | Active levels |
| --- | --- | --- | --- |
| **Krix & the toaster** ("last quarter's intern") | L1 memo joke (*"returned a man still clutching his toaster"*); L2 memo joke (*"power lines right before the toaster incident"*) | L7 first clear (OBELISK™ manifest signed by Krix); L8 memo, `krix` Field Find, L8 first clear; L9 first clear | L1, L2, L7, L8, L9 (peak 1–2 per shift) |
| **Bureau paperwork & forms** (Form 7-B, Form 88-MPH, Accounting/Legal/HR) | L1–L2 memos & Vrell report comments; Form 7-B formally introduced in L6 memo (*"brass thermometer and a clipboard since 1953"*); Form 88-MPH introduced in L8–L9 | L6 probe audit & clinic souvenirs; L9 1955 time-car permit gag; Warehouse 4 / 4B trophy catalogue voice | All shifts (background voice; max 1 specific form per shift) |
| **Unpaid intern, lanyard & parking ring** | L1 memo (*"Pass probation and we might even issue you a lanyard"*); Ranks ladder | L2 report (temporary lanyard); L5 (Bubbles gets a ring first); L8 (staff salary); 2199 (Zib gets the ring) | L1, L2, Birch Lane, L5, L8, 2199 |
| **Mrs. Pruitt's binoculars & binder** | #0004 memo and watcher (awake since 1994, binder in the window) | L4 memo & `saucer_photo` Field Find; L7 memo (her sister Doris carries the same binder on the cruise ship) | #0004, L3, L4, L7, 1953 |
| **Gary's neighbourhood watch & lasers** | #0004’s alarm has caught Gary four times | L3 memo raises the count to eleven. L4 follows his CCTV complaint, and Moe reads it in 2199. | #0004, L3, L4, 2199 |
| **The Grimsby odd-sock hoard** | L2 `odd sock` souvenir (*"So that's where they go. It's us."*) & L2 first clear | Loading tip (`afterL2`), Warehouse 4 trophy room | L2, loading tips |
| **Cats are management** | Base loading tip (*"Cats are not specimens. Cats are management."*) | L5 Kipper (sleeper & petty cash tin); L7 Anchovy (takes command of the bridge) | Loading tips, L5, L7 |
| **OBELISK™ patent racket** | L4 memo (*"unlisted black rock"*); L5 `obelisk_crate` Field Find; L7 memo & first clear | L8 memo, rooms, `first-edition bone`, first clear; L9 first clear (can't patent time travel) | L4, L5, L7, L8, L9 |
| **Zib's Mum** | L1–L4 Zib bubbles (*"Mom would be so proud"*, *"cities are where saucers go to get towed"*) | Perfect deep-shift report (she phones Head Office to ask if Zib is eating enough). Vrell answers her in the 2199 first clear. | Earlier flight and perfect reports, 2199 |

### Trimmed, simplified, or retired

| Joke / reference | Why it was trimmed | Change made |
| --- | --- | --- |
| **Bone-turns-into-spaceship / "orbital lawsuits" (*2001* match-cut)** | Even fans of *2001* didn't decode the match-cut compressed with patent lawsuits (`first-edition bone` trophy, L8 causes, L8 headline, L8 missed-bone quip). | Replaced with the universally recognised *2001* image (first tool ever made, booming dramatic drums, shiny black boulder) + plain Bureau jokes that work cold. |
| **Deep-cut *Contact* nods ("check out Vega", "three prime numbers")** | Too obscure for players who haven't seen *Contact* (1997). | Replaced with universal Mars / thermos-of-cocoa astronomy gags (`trophies.town.descriptions.astronomer`, `mapCollectibles.items.astronomer.comment`). |
| **Unexplained "FOR THE MACHINE" defibrillator label** | Required knowing the hidden shout to decode the Frankenstein joke. | Changed to explicit `"IT'S ALIVE!"` / `« IL EST VIVANT ! »` in the Room 2 trophy card (L6 memo sync in `src/levels/deep-clinic.ts` flagged for coordinator). |
| **Coder & accounting jargon in Trophy Room** ("rubber-duck debugger for marine law", "double-entry ceramic", "control thumb", "understudy solo") | Insider jargon that failed the cold-read clarity test. | Rewritten in plain comedic language (`rubber duck`, `accounts mug`, `flight.missed.Flint`, `flight.missed.Reed`). |
| **France-only references in FR copy** (`France Inter`, `URSSAF`) | Violated the international-legibility rule in `AGENTS.md`. | Replaced with `la radio FM` and `la fiche de paie`. |
| **"Tuesday" throwaway cadence** | Appeared 9 times across unrelated screens (crop circle, CCTV, coffee, museum, time car, defibrillator) without being a real arc. | Kept existing natural idioms ("last Tuesday"), capped — do not add new Tuesday gags in future levels. |

### Copy handoff for the Dispatch release

Keep these replacements with the release that depends on them. The numbers and localized address rules are in [the Birch Lane spec](GDD-11-onramp.md#order-numbers-and-saved-progress).

| Surface | Copy or prop change |
| --- | --- |
| Ranks | Senior Abductor reads “Parking ring: waitlisted. Behind Bubbles.” FR « Place de parking : en attente, derrière Bubulle. » Staff salary starts at L8. |
| L4 billboard and Nigel’s room | Use OPEN 24 HRS. Nigel’s prop becomes a lost-property umbrella with “Lost property: one umbrella. Again.” His mumble becomes “The dinosaurs are on my break.” |
| General loading tip and L5 launch | Replace the panic tip with “Screaming voids the saucer’s third-party insurance.” Zib asks for a bucket at Barnacle Bay. |
| L5 farewell and tin | Save the fish farewell for the 2199 note. The Barnacle Bay note is about the census. The sardine tin has been licked clean and invoiced. |
| L7 cruise towel | Keep the swan. Its catalogue describes origami terrycloth that survived re-entry, with Greg asking for it back. The missed-item line says Greg took the other towels. |
| L5 crate | The impounded crate is a decoy full of straw. Its forwarding label points to the SS Buffet Royale, which carries the real slab. |
| L7 Sterling’s ten-delivery addendum | “Taught Anchovy to ring the ship’s bell whenever our green light hits. Anchovy now rings it for dinner.” |
| L2 time-car easter egg | Replace the retired Tuesday line with “Free parking, apparently.” |
| L9 archive and first clear | Use “Crest Valley, the next valley over from Grimsby” and the Gazette’s “From our archives” treatment. End the report with “Why is it blinking two more dates?” |

Use both locales. [Story decisions](story/decisions.md) · [Continuity review](story/continuity-review.md)
