# Night Shift · Trophy Room (Evidence Locker)

The **Trophy Room** (*Bureau Evidence Locker · Warehouse 4* / *Scellés du Bureau · Entrepôt 4*) displays every abduction souvenir the player has hauled back to the saucer across all shifts. It turns the funny loose props scattered through rooms into a browseable collection with Bureau catalogue notes.

## Design goals

- **Phone first (540×960 logical, tuned for 375×690 CSS px):** one-thumb vertical scrolling with momentum, big tap targets (`148 × 120` logical px ≈ `103 × 82` CSS px), and a single-tap exhibit card with no awkward tiny close icons.
- **Bureau tone (v4 PG-13 leaning 16):** every exhibit carries a dry, cheeky Bureau catalogue description in English and idiomatic French (adapting puns and international pop-culture nods rather than translating literally).
- **Honest collection progress:** unfound items display a crisp dark silhouette of the real prop, `???`, and the shift location they come from, so players can hunt missing souvenirs by trying the alternate entry route into each building.
- **Zero-friction scaling:** one room for now (35 exhibits across L1–L8); automatic wing paging once the catalogue exceeds `ROOM_CAPACITY = 48`.

## Navigation & entry points

- **Title screen (`src/ui/title.ts`):** a secondary `Trophy room · N/35` button sits directly beneath `Clock in`, clear of the bottom utility bar.
- **Work Orders (`src/ui/workorders.ts`):** a compact trophy-cup icon button sits top-right (symmetrical with the top-left `‹` back button) so players can check newly filed souvenirs immediately after a shift.
- **Back button:** returns to whichever screen opened the Trophy Room (`title` or `workorders`).
- **Debug hook:** `window.__nightShift.goto('trophies')` opens the room directly for automated checks and evidence capture.

## Layout & visual hierarchy

### 1. Fixed header (`y = 0..176`)

- Top-left: `‹` back button (`16, 18, 64, 60`).
- Title (`TROPHY ROOM` / `SALLE DES TROPHÉES`) and subtitle (`Bureau Evidence Locker · Warehouse 4` / `Scellés du Bureau · Entrepôt 4`).
- Summary bar (`x = 24, y = 102, w = 492, h = 58`):
  - Left: collection counter (`12 / 35 FILED`, switching to amber gold `35 / 35 COMPLETE!` at 100%).
  - Right: progress bar (mint fill, gold at 100%) and secondary caption showing total items hauled across runs (`29 hauls total`) or a tap/hunt prompt when empty.

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

The Trophy Room reads `SaveData.trophies` (`Record<string, TrophyEntry>` in `src/levels/save.ts`, populated by `recordTrophies` in `src/levels/progress.ts`). Unknown or retired item ids are already stripped by `validateSave`.

Town pickups (`LevelProgress.mapCollectible`, `docs/GDD-8-map-collectibles.md`) remain a separate system reported on the shift form; keeping Warehouse 4 focused on abduction souvenirs keeps the `N/35` locker count 1-to-1 with `SaveData.trophies`. A future "Field Detours" annex shelf can be added beneath L8 if wanted.

## Scaling & multi-room threshold

- **Threshold: `ROOM_CAPACITY = 48` exhibits per room** (up to 16 rows of 3, ~3.4 portrait screens of scroll).
- At **35** souvenirs (L1–L8), everything fits comfortably in **1 room** (~2.75 screens of scroll) with no pagination clutter.
- `buildTrophyPages(sections, ROOM_CAPACITY)` packs whole level cases sequentially into wings so a level is never split across two rooms. As soon as future levels push the total past **48**, the Trophy Room automatically reveals a compact `‹ Wing 1/2 ›` switcher bar in the header (`LIST_TOP` shifts from `180` to `224`) and keeps every wing within the single-room scroll budget.

## Hard rule for new levels and items

Enforced automatically by **`tests/ui-trophies.test.ts`**:

1. **Every souvenir any room can yield** — iterating `ROOMS` (with `SOUVENIR_SWAPS` applied) and `FIELD_CHECK_ROOM`, never a hard-coded list — **must have:**
   - a slot in the Trophy Room catalogue (`buildTrophyCatalog()`),
   - a non-empty singular/plural entry in `tr().items` (EN & FR),
   - a non-empty catchy description in `tr().trophies.descriptions` (EN & FR, distinct in FR and short enough to fit the detail card cleanly),
   - a valid art key in `ART` (with a primitive/painted fallback in `src/ui/views/trophy-art.ts`).
2. **Room capacity & geometry:** every page produced by `buildTrophyPages` respects `ROOM_CAPACITY`, stays within one room while `total <= 48`, has zero overlapping slots, and keeps every slot inside the 540 px portrait width.

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
