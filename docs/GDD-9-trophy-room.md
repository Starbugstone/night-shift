# Night Shift · Trophy Room (Evidence Locker)

The **Trophy Room** (*Bureau Evidence Locker · Warehouse 4* / *Scellés du Bureau · Entrepôt 4*) has two wings switched by a one-thumb tab bar at the top:

1. **Room 1 — Souvenirs** (*Warehouse 4* / *Entrepôt 4*): every abduction souvenir hauled back to the saucer from building interiors (35 exhibits across L1–L8).
2. **Room 2 — Field finds** (*Field Detours Annex · Warehouse 4B* / *Annexe Terrain · Entrepôt 4B*): every optional town object or cameo character picked up outdoors on flight maps (7 exhibits across L2–L8, iterated dynamically from `LEVELS`).

## Design goals

- **Phone first (540×960 logical, tuned for 375×690 CSS px):** one-thumb vertical scrolling with momentum, a top two-tab room switcher (`Souvenirs · N/35` | `Field finds · N/7`), big tap targets (`148 × 120` logical px in Room 1, `492 × 118` full-width showcase cards in Room 2), and a single-tap exhibit card with no awkward tiny close icons.
- **Bureau tone (v4 PG-13 leaning 16):** every exhibit carries a dry, cheeky Bureau catalogue description in English and idiomatic French (distinct from Vrell's shift-report comments, adapting puns and international pop-culture nods rather than translating literally).
- **Honest collection progress:** unfound items display a crisp dark silhouette of the real prop, `???`, and a non-spoiling location/memo hint.
- **Living cameos in Room 2:** found town pickups render through `PickupFigure`, so people (the volunteer astronomer, Krix & his toaster) stay animated in their display vitrines and detail cards (blinking, glancing sideways, yawning — disabled cleanly under `reducedMotion`); unfound silhouettes remain still.
- **Zero-friction scaling:** Room 1 fits all 35 souvenirs in one wing (`ROOM_CAPACITY = 48` before automatic wing paging). Room 2 iterates `LEVELS` and `map.collectible`, so future levels' pickups appear automatically.

## Navigation & entry points

- **Title screen (`src/ui/title.ts`):** a secondary `Trophy room · N/42` button (combined souvenirs + town finds) sits directly beneath `Clock in`, clear of the bottom utility bar.
- **Work Orders (`src/ui/workorders.ts`):** a compact trophy-cup icon button sits top-right (symmetrical with the top-left `‹` back button) so players can check newly filed souvenirs and field finds immediately after a shift.
- **Back button:** returns to whichever screen opened the Trophy Room (`title` or `workorders`).
- **Debug hook:** `window.__nightShift.goto('trophies')` opens the room directly; `debug.setRoom('town')` and `debug.selectTown(id)` inspect Room 2 for automated checks and evidence capture.

## Layout & visual hierarchy

### 1. Fixed header (`y = 0..216`)

- Top-left: `‹` back button (`16, 16, 64, 58`).
- Title (`TROPHY ROOM` / `SALLE DES TROPHÉES`) and room-aware subtitle (`Bureau Evidence Locker · Warehouse 4` in Room 1; `Field Detours Annex · Warehouse 4B` in Room 2).
- **Room switcher (`y = 88..136`, two `240 × 48` pill tabs):**
  - Left: `Souvenirs · N/35` / `Scellés · N/35`
  - Right: `Field finds · N/7` / `Trouvailles · N/7`
  - Active tab uses the bright mint `'primary'` pill; inactive tab uses dark `'ghost'`.
- **Summary bar (`x = 24, y = 146, w = 492, h = 58`):**
  - Room 1: trophy-cup icon, `N / 35 FILED` (gold `35 / 35 COMPLETE!` at 100%), progress bar, total hauls or empty hint + tap hint.
  - Room 2: 4-point mint glint badge, `N / 7 LOGGED` (gold `7 / 7 COMPLETE!` at 100%), progress bar, remaining count / empty hint / completion line + tap hint.

### 2. Scrollable display cases (`y = 180..960`, masked)

Exhibits are grouped into **Display Cases** by level/town in `LEVELS` order (`L1` through `L8`):

- Each case (`x = 24, w = 492`) has a dark glass-cabinet header strip (`#01 · Doyle Farm · Route 9` on the left, `2/2` completion pill on the right) and a **3-column shelf grid** (`3 × 148 px` slots + `12 px` gaps inside `12 px` inner padding).
- Behind each row sits a subtle shelf ledge so exhibits read as physical items sitting in illuminated Bureau lockers.
- **Found slot:** mint-rimmed dark recess, soft mint showcase glow, full-colour souvenir art scaled proportionally into `104 × 56` px, repeat count pill (`×3` in amber) top-right when `count > 1`, and the localized item title along the bottom.
- **Unfound slot:** dimmed indigo recess, crisp dark-lavender silhouette of the real souvenir art, `???`, and the short town/location label underneath (e.g. `Doyle Farm`, `St. Mildred's General`).

### 3. Exhibit detail modal (on tap)

Tapping any slot freezes background scroll and opens a Bureau Exhibit Tag modal over a dark scrim (tapping `Close` or tapping outside the card dismisses it):

- **Found exhibit:**
  - Header badges: `EXHIBIT #NN` (1-based shelf number) + level location.
  - Illuminated showcase stage (`220 × 132` px) with large item art (gentle bob unless `reducedMotion`).
  - Localized item title (`tr().items[id]`) and Neon's 1–2 line catalogue description (`tr().trophies.descriptions[id]`).
  - Provenance inset panel:
    - **Taken from:** `{specimen} · {route}` (resolved from `TrophyEntry.room`, e.g. `Hank · Rear entrance`).
    - **Filed on:** `Report #{first + 1}` (`SaveData.reports` is 0-based when `recordTrophies` runs, so the first filed report displays as `#1`).
    - **Taken home:** `{count} time(s)`.
- **Unfound exhibit:**
  - Header badge: `UNFILED EXHIBIT` + level location.
  - Showcase stage with the dark silhouette.
  - Title `???` and a shift hint naming the Work Order number and location without spoiling the joke.
  - Provenance inset showing `Status: Still on Earth — grab it during this shift`.

## Save data & Town pickups

- **Room 1 (Souvenirs)** reads `SaveData.trophies` (`Record<string, TrophyEntry>` in `src/levels/save.ts`, populated by `recordTrophies` in `src/levels/progress.ts`). Unknown or retired item ids are already stripped by `validateSave`.
- **Room 2 (Field finds)** reads `SaveData.levels[levelId].mapCollectible` (`docs/GDD-8-map-collectibles.md`) read-only: a town pickup counts as found when `save.levels[levelId].mapCollectible === pickup.id`.
- **Title screen counter:** `trophyProgress(save)` sums both rooms (`souvenirs + town finds`, e.g. `N/42`), while the top room switcher inside the Trophy Room breaks them out per wing (`Souvenirs · N/35` | `Field finds · N/7`).

## Room 2 — Field Finds Annex (`Warehouse 4B`)

Displays every level's optional map collectible (`LEVELS` iterated dynamically, ordered by level L2–L8; L1 has none):

- **Full-width display cards (`x = 24, w = 492, h = 118`, `12 px` gap):**
  - Left illuminated vitrine (`114 × 94` px): found pickups render through `PickupFigure` (people such as Krix and the volunteer astronomer stay animated — blinking, looking sideways, yawning; objects stay still or have a subtle effect; `reducedMotion` keeps everything still). Unfound pickups render as a still dark-lavender silhouette.
  - Right info column:
    - Found: `#0N · <location>`, localized pickup name (`tr().mapCollectibles.items[id].name`), and the funny Bureau status line (`tr().trophies.town.statuses[id]`).
    - Unfound: `#0N · <location>`, `???`, and a vague, non-spoiling memo hint (`tr().trophies.town.hints[id]`).
- **Detail card (on tap):**
  - Enlarged illuminated vitrine (`284 × 166` px) showcasing the larger animated `PickupFigure` (or still silhouette when unfound).
  - Header badge (`FIELD FIND #01`..`#07` / `UNFILED FIND`) + level title.
  - Localized name (or `???`) and catchy EN + FR Bureau catalogue description (distinct from Vrell's shift-report comments).
  - Two-row provenance inset (no star status shown):
    - **Found in:** `#0N · <location>`
    - **Status:** funny Bureau status line (or *Still out in town — hover to collect* when unfound).

### Complete Field Finds catalogue (L2–L8 · 7 items)

| # | Level | ID | Art key | Bureau status (EN) | EN catalogue note |
| --- | --- | --- | --- | --- | --- |
| 01 | L2 · Spin City | `slipper_flyer` | `flight/pickup_slipper_flyer` | Pinned to Vrell's corkboard | Photocopied in frantic Comic Sans with one tear-off tab already missing. Whoever took that number is about to be very disappointed. |
| 02 | L3 · Maple Court | `astronomer` | `flight/pickup_astronomer` | Debriefed; refuses to leave | Spent twelve years waiting for a cosmic signal; got beamed up mid-sip of lukewarm cocoa. Still insists we check out Vega next. |
| 03 | L4 · Grimsby Centre | `saucer_photo` | `flight/pickup_saucer_photo` | Redacted · Eyes Only | Out of focus, tilted twenty degrees, and somehow still clearer than every UFO tabloid since 1947. Legal paid cash to bury the negatives. |
| 04 | L5 · Barnacle Bay | `obelisk_crate` | `flight/pickup_obelisk_crate` | Impounded · Mildly humming | Stencilled "FRAGILE — DO NOT EVOLVE NEAR". Emits a faint choir hum whenever anyone walks past with a crowbar or a bone. |
| 05 | L6 · St. Mildred's | `defibrillator` | `flight/pickup_defibrillator` | Charged · Rubber gloves only | Stolen off a crash cart and relabelled "FOR THE MACHINE" in red marker. Propulsion swears it jump-started a dead saucer battery. |
| 06 | L7 · SS Buffet Royale | `shrimp_tower` | `flight/pickup_shrimp_tower` | Refrigerated, under protest | Three tiers of all-you-can-eat crustacean arrogance on crushed ice. Zib claims it jumped into the tractor beam of its own free will. |
| 07 | L8 · Patent Valley | `krix` | `flight/pickup_krix` | Under HR review | Turned an unpaid Bureau internship into a three-million-year tech monopoly. Still insists the toaster is a "paradigm-shifting monolith". |

## Scaling & multi-room threshold

- **Threshold: `ROOM_CAPACITY = 48` exhibits per Souvenirs wing** (up to 16 rows of 3, ~3.4 portrait screens of scroll).
- At **35** souvenirs (L1–L8), Room 1 fits comfortably in **1 wing** (~2.75 screens of scroll) with no pagination clutter.
- `buildTrophyPages(sections, ROOM_CAPACITY)` packs whole level cases sequentially into wings so a level is never split across two pages. As soon as future levels push Souvenirs past **48**, Room 1 automatically reveals a compact `‹ Wing 1/2 ›` switcher bar under the summary bar (`souvenirListTop` shifts from `216` to `260`).

## Hard rule for new levels and items

Enforced automatically by **`tests/ui-trophies.test.ts`**:

1. **Every souvenir any room can yield** — iterating `ROOMS` (with `SOUVENIR_SWAPS` applied) and `FIELD_CHECK_ROOM`, never a hard-coded list — **must have:**
   - a slot in the Room 1 catalogue (`buildTrophyCatalog()`),
   - a non-empty singular/plural entry in `tr().items` (EN & FR),
   - a non-empty catchy description in `tr().trophies.descriptions` (EN & FR, short enough to fit the detail card cleanly),
   - a valid art key in `ART` (with a primitive/painted fallback in `src/ui/views/trophy-art.ts`).
2. **Every level's map collectible** — iterating `LEVELS`, never a hard-coded list — **must have:**
   - a slot in the Room 2 catalogue (`buildTownCatalog()`),
   - a non-empty EN & FR name in `tr().mapCollectibles.items[id]`,
   - a non-empty catchy EN & FR description in `tr().trophies.town.descriptions[id]` (distinct from shift-report comments and fitting cleanly in the detail card),
   - a non-empty funny Bureau status line in `tr().trophies.town.statuses[id]` and a vague non-spoiling hint in `tr().trophies.town.hints[id]`.
3. **Room capacity & geometry:** every page produced by `buildTrophyPages` respects `ROOM_CAPACITY`, stays within one wing while `total <= 48`, and both Room 1 and Room 2 have zero overlapping slots and keep every slot inside the 540 px portrait width.

## Complete exhibit catalogue (L1–L8 · 35 items)

| # | Level | Route | Item id | Art key | EN catalogue note |
| --- | --- | --- | --- | --- | --- |
| 01 | L1 · Doyle Farm | `farm_window` | `slipper` | `room/slipper` | Left foot only. Somewhere in Grimsby, one very stubborn farmer is hopping to the barn. |
| 02 | L1 · Doyle Farm | `farm_chimney` | `prize marrow` | `room/prize_marrow` | Eleven pounds of village envy. Doyle whispers sweet nothings to it; Lab 4 refuses to touch it. |
| 03 | L2 · Spin City | `laundry_skylight` | `odd sock` | `room/odd_sock` | The great laundromat mystery, solved. Warehouse 4 holds 40,000 singles and not one match. |
| 04 | L2 · Spin City | `laundry_loading` | `heart-print boxers` | `room/heart_boxers` | Tumble-dried to a romantic crisp. Larry calls them his lucky pair; the stats disagree. |
| 05 | L3 · Maple Court | `dave_roof` | `orthodontic slipper` | `room/slipper` | Fitted with tiny braces and a retainer bill. Even Dave's footwear gets a six-month check-up. |
| 06 | L3 · Maple Court | `dave_patio` | `demo dentures` | `room/demo_dentures` | Oversized clinic chompers. They still snap shut whenever an intern reaches past them. |
| 07 | L3 · Maple Court | `barb_chimney` | `team-issued slipper` | `room/slipper` | Number 9, non-slip sole, smells faintly of pep talks and victorious liniment. |
| 08 | L3 · Maple Court | `barb_backdoor` | `coach's whistle` | `room/coach_whistle` | One sharp blast in the hangar and three alien flight crews dropped for twenty push-ups. |
| 09 | L3 · Maple Court | `gary_skylight` | `neighbourhood watch mug` | `room/coffee_mug` | Reads "I SAW SOMETHING" in bold. Ironically abducted right under Gary's own blinking lens. |
| 10 | L3 · Maple Court | `gary_garagedoor` | `tinfoil hat` | `room/tinfoil_hat` | Hand-crimped for maximum paranoia. Blocks mind rays, boosts FM radio, zero protection against beams. |
| 11 | L4 · Grimsby Centre | `nigel_skylight` | `fossilized coffee` | `room/coffee_mug` | Older than half the museum's Mesozoic wing. Lab 4 uses a chisel to take samples. |
| 12 | L4 · Grimsby Centre | `nigel_loading` | `UFO snow globe` | `room/ufo_snow_globe` | Unlicensed Bureau merch from the gift shop. Shake it for glitter and a cease-and-desist. |
| 13 | L4 · Grimsby Centre | `kev_vent` | `limited-edition DJ mug` | `room/coffee_mug` | Number 1 of 1. Keeps lukewarm energy drink at the exact temperature of a 3 AM club floor. |
| 14 | L4 · Grimsby Centre | `kev_fireescape` | `12-inch remix` | `room/vinyl_12inch` | Kev swears it's a full twelve inches of pure bass. Accounting measured; Accounting disagrees. |
| 15 | L4 · Grimsby Centre | `mayor_clocktower` | `municipal mug` | `room/coffee_mug` | Expensed as "civic infrastructure". Somehow the most productive object in City Hall. |
| 16 | L4 · Grimsby Centre | `mayor_elevator` | `mayoral toupee` | `room/toupee` | Aerodynamic auburn weave. Tested in our wind tunnel; refused to budge up to Mach 2. |
| 17 | L5 · Barnacle Bay | `bubbles_roof` | `sardine tin` | `room/sardine_tin` | Pried open with suspiciously neat flipper-work. So long, and thanks for all the snacks. |
| 18 | L5 · Barnacle Bay | `bubbles_tunnel` | `rubber duck` | `room/rubber_duck` | Bubbles' rubber-duck debugger for marine law. Squeaks louder than a hull breach alarm. |
| 19 | L5 · Barnacle Bay | `pete_gallery` | `harbourmaster mug` | `room/coffee_mug` | Salt-crusted stoneware that survives force-nine gales and Pete's industrial-strength tea. |
| 20 | L5 · Barnacle Bay | `pete_slipway` | `ship in a bottle` | `room/ship_bottle` | Nine years of tweezers and swearing. We beamed it out faster than Pete got the mast in. |
| 21 | L5 · Barnacle Bay | `sal_loft` | `accounts mug` | `room/coffee_mug` | Double-entry ceramic. Sal already billed the Bureau for depreciation and emotional distress. |
| 22 | L5 · Barnacle Bay | `sal_dock` | `petty cash tin` | `room/cash_tin` | Fourteen quid, two paperclips, and a stern IOU signed with a paw print by Kipper. |
| 23 | L6 · St. Mildred's | `hank_front` | `jug of prep drink` | `room/prep_jug` | Four litres of lemon-flavoured hubris. Classified as rocket propellant by Propulsion. |
| 24 | L6 · St. Mildred's | `hank_rear` | `silver butt plug` | `room/silver_plug` | Seized in Internal Affairs. Flared base, mirror polish—still failed Form 7-B probe certification. |
| 25 | L6 · St. Mildred's | `osei_helipad` | `on-call coffee` | `room/coffee_mug` | Darker than deep space, thick enough to hold a spoon upright. Handle with lead gloves. |
| 26 | L6 · St. Mildred's | `osei_pharmacy` | `inflated rubber glove` | `room/glove_balloon` | Five-fingered night-shift mascot with a Sharpie grin. Morale in the hold jumped 14%. |
| 27 | L6 · St. Mildred's | `pemberton_window` | `hospital sock` | `room/slipper` | Treaded on both sides for peak hallway traction. Zero style, maximum dignity loss. |
| 28 | L6 · St. Mildred's | `pemberton_chute` | `bedpan` | `room/bedpan` | Brushed steel, suspiciously gleaming. Zib insists it's a Viking helmet; HR disagrees. |
| 29 | L7 · SS Buffet Royale | `captain_mast` | `blue heart pendant` | `room/blue_heart_pendant` | Souvenir-deck enamel on a gold-ish chain. Please don't toss it overboard; Accounting is watching. |
| 30 | L7 · SS Buffet Royale | `captain_funnel` | `captain's log` | `room/captains_log` | A literal timber log with a brass plaque. Stardate classified; splinters very real. |
| 31 | L7 · SS Buffet Royale | `marco_skylight` | `chocolate éclair` | `room/eclair` | Stasis-sealed to preserve the glaze. Only two bite marks—Zib blames turbulence. |
| 32 | L7 · SS Buffet Royale | `marco_promenade` | `giant pepper mill` | `room/pepper_mill` | Three feet of walnut-turned intimidation. Say when, or spend eternity sneezing. |
| 33 | L7 · SS Buffet Royale | `greg_awning` | `complimentary towel swan` | `room/complimentary_towel` | Origami terrycloth that survived re-entry. Always know where your towel is—ours is labelled. |
| 34 | L7 · SS Buffet Royale | `greg_cabin` | `lime mankini` | `room/mankini` | Radioactive-lime sling stored behind double blast glass. Very nice—from two parsecs away. |
| 35 | L8 · Patent Valley | `echo_appeal` | `first-edition bone` | `room/patent_bone` | Thumbprint-notarised femur, seized before dawn. One toss away from inventing orbital lawsuits. |
