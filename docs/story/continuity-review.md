# Night Shift: story continuity review

Story editor's pass over the shipped story (L1–L9) and the planned shifts (GDD-11 to GDD-14), done on
`preprod` after `ae14562` on 2026-11-25. Sources: `docs/GDD-6-story.md`, `GDD-7-eras.md`, `GDD-10-1955.md`,
`GDD-11-onramp.md`, `GDD-12-1122-grail.md`, `GDD-13-1953-tripods.md`, `GDD-14-2199-hitchhiker.md`,
`docs/research/level-pitch-backlog.md`, `docs/l9/story-and-names.md`, `src/i18n/en.ts` (with spot checks in
`fr.ts`), `src/ui/memo.ts`, `src/levels/*.ts` and the room props in `src/abduct/`. Line numbers are
taken from that commit. No game file was changed.

**Count: 7 blockers, 23 should-fix, 14 nits.**

---

## 1. Canonical timeline

### Play order (once the on-ramp ships)

| # shown | Save ID | Shift | Where | Story job |
| --- | --- | --- | --- | --- |
| #0001 | `level1` | Farmer Doyle Sleeps Like a Log | Doyle Farm, Route 9 | Zib's first solo night, unpaid and on probation. The toaster intern is set up. |
| #0002 | `level2` | Laundromat Larry | Spin City, Main St | Socks, power lines, Doyle's flyer. Zib comes off training. |
| #0002-B | (practice) | Field Check | Birch Lane frontage | An unpaid drill. **Temporary lanyard.** |
| #0003 | `birch_bakery` | Baker Mabel's First Batch | Birch Lane, off Main St | One specimen. Cats are management (Crumb). |
| #0004 | `birch_neighbours` | The Neighbours Are Asleep | Birch Lane, Maple Court turn | Two specimens. First sunrise clock. **Pruitt and Gary are introduced here now.** |
| #0005 | `level3` | Cul-de-Sac Sweep | Maple Court | Three specimens. Gary's complaint and Pruitt's photo go to City Hall. |
| #0006 | `level4` | Downtown Graveyard Shift | City Centre | First OBELISK clue: the black rock leaves the museum. |
| #0007 | `level5` | Pier Pressure | Barnacle Bay | The crate. Bubbles outranks Zib. Pete's log starts the audit. |
| #0008 | `level6` | Probe Compliance | St. Mildred's | Form 7-B and the thermometer "since 1953". |
| #0009 | `level7` | A Whole Cruise Ship | SS Buffet Royale | The manifest. **Krix revealed.** |
| #0010 | `level8` | Prior Contact | Patent Valley, 3,000,000 BC | Basement B-4 is broken open. Patents voided. **Zib is hired, with a salary.** |
| #0011 | `level9` | Clocking Out at 10:04 | Crest Valley, 12 Nov 1955 | Krix can't patent time travel. Zib is now **Agent (junior)**. |
| #0012 | `level10` | Ni! | Grimsby Keep, 1122 | Krix tries to patent the Grail. The first tease of the Tripod Division's sick leave. |
| #0013 | `level11` | The War of the Worlds | Grimsby drive-in, 1953 | Rookie Vrell writes the first Form 7-B. A return ping comes in from 2199. |
| #0014 | `level12` | Your Town Is in the Way | Grimsby, 2199 | Finale. The census voids the bypass and Krix is billed. Bubbles leaves. **Zib gets a parking ring.** |

### In-universe chronology

| When | Event | Source |
| --- | --- | --- |
| ~3,000,000 BC | Krix's OBELISK™ slab uplifts Flint, Reed and Echo. Zib voids the patent. | L8 |
| 1122 | Krix files on the Grail. Zib collects the witnesses. | GDD-12 |
| 1947 | The Bureau starts auditing Earth. | title tagline, GDD-6 §1 |
| 1953 | The Tripod Division lands at the Grimsby drive-in and catches a cold. Rookie Vrell borrows a farm's brass thermometer and files the first Form 7-B. | GDD-13 (canonical; see S3) |
| 12 Nov 1955, 22:04 | Lightning hits the Crest Valley clock. The time car is either impounded or leaves for 1985. | L9 |
| 1985 | Temporal Dispatch is mothballed after an "expense-report paradox". The missed time car leaves scorch marks behind Spin City. | GDD-6 §1, `en.ts:146–149`, L2 easter egg |
| 1994 | Mrs. Pruitt stops sleeping. | L3 memo |
| 1998 | Spin City's odd socks start going to Warehouse 4. | tier tip `afterL2` |
| present − 11 yrs | Gary installs his garage lasers. | L3 memo |
| last quarter | Krix returns a man still clutching his toaster, hits a power line, is fired and defects to OBELISK™. | L1/L2 memos |
| present, one season | L1 → L9 and every Dispatch trip leave from the present-day Basement B-4. Vrell's pension is "eleven weeks away" at the Field Check. | all |
| 2199 | The hyperspace bypass is voided and Grimsby stays. | GDD-14 |

Rule to keep: **every Dispatch trip leaves from the present.** Zib never lives in the past, and Vrell
never meets his 1953 self on screen (GDD-13 already does this).

---

## 2. Cast sheet (facts that must stay fixed)

| Character | Fixed facts |
| --- | --- |
| **Zib** | Green intern, **they/them**. Over-caffeinated and mildly kleptomaniac. Calls their mother **"Mom"** in live text (see N2). Career: unpaid intern → temporary lanyard (Field Check) → **paid staff at L8** → "Agent Zib (junior)" from L9 (`memo.toAgent`) → own parking ring (2199). |
| **Vrell** | Purple, bespectacled middle-manager blob, **he/him**. Motto: "Adequate. My favourite word." Wants his pension to vest; it is "eleven weeks away" at the Field Check. Was a **rookie pilot in 1953** and wrote the thermometer rule. Arc: supervisor → co-signer → mentor. |
| **Krix** | "Last quarter's intern", **he/him**. Returned a man clutching a toaster and hit a power line. Fired by Vrell, now OBELISK™'s Senior VP of Disruptive Contact. Signs the L7 manifest, is beaten at L8 (and is an optional pickup, "Under HR review"), and loses on time travel at L9. Planned: the Grail (1122) and the bypass sale (2199). |
| **OBELISK™** | Rival consultancy of matte-black slabs and dramatic music. Holds no Census permits. Racket: prior-art patents, then land sales (2199). |
| **Bubbles** | Bottlenose dolphin, **she/her**, **age 14**, 248 cm, 190 kg. Sleeps with half her brain, outranks Zib and negotiated her own parking ring. Left a polite note in L5: "who taught a dolphin to write?" Planned: leaves with "So long, and thanks for all the fish" and signs her ring over to Zib. |
| **Zib's Mum** | Off-screen. Phones Head Office to ask whether Zib is eating enough (`en.ts:964`). Her payoff is still owed (S8). |
| **Head Office / Compliance / Accounting / Legal** | Head Office sends vague mandates and Compliance enforces Form 7-B. Accounting remembers every toaster, Legal argues with tablets, and Lab 4 handles specimens. |
| **Tripod Division** | The Bureau's own division. One Earth cold put the whole fleet on sick leave (`en.ts:951`), and the 1953 shift shows that night. |
| **Tuesday Crew** | The Bureau's sloppy day shift who make crop circles (`en.ts:186`). The Tuesday cadence is **retired**. |
| Farmer Doyle | 58, 185 cm, 108 kg. Snores, owns a prize marrow, and lost a slipper that ends up on a flyer at Spin City. |
| Laundromat Larry | 34, six years on night shift, heart-print boxers. |
| Mrs. Pruitt | Hasn't slept since 1994. Binoculars and a binder or logbook. Her photo ends up at City Hall. Shouts "DOROTHY! THE BOOK!" |
| Doris (Dorothy) | Mrs. Pruitt's sister. Carries the same binder on the cruise (L7). One name, please (N1). |
| Gary | 47. One-man Neighbourhood Watch. His lasers have caught him eleven times. Tinfoil hat. Blames the Hendersons. |
| Dentist Dave & Brenda | Dave is 44. Brenda is the second sleeper at Dave's. |
| Coach Barb & Biscuit | Barb is 52 and owns a whistle. Biscuit is the dog. |
| The Hendersons | **Never seen.** The suburb's eternal scapegoats. In #0004 they are away and Nora house-sits. |
| Officer Dobbs | Unit 4. "A large hubcap, airborne". |
| Nigel, Kev, Mayor Whitlock | Nigel (63) guards the museum. DJ Kev (26) plays the Bassment. The Mayor (61) has a toupee. Tiny is the Bassment's bouncer. |
| Harbourmaster Pete | 67, **he**. Lighthouse, tea, "rude weather". His log triggers the audit. |
| Sal | 49, **she/her**. Fish-market accountant. "One outstanding". |
| Kipper | Dock cat; management. |
| Hank, Dr. Osei, Mr. Pemberton | Hank (54) holds ticket 347. Dr. Osei (39) is **she**. Mr. Pemberton (71). Gladys and Roland are the second sleepers. |
| Capt. Sterling, Chef Marco, Greg | Sterling (56) has a hammock. Marco (43) has the pepper mill. Greg (46) wears the lime mankini. Anchovy, the cat, runs the bridge. |
| Flint, Reed, Echo | Apes. Echo is **she** and a patent clerk. |
| Doc, Buff Tanner, Marvin Cherry | Doc (65), Buff (18), Marvin (29). Lyle runs Lyle's Coffee Shop. Crest Valley, 1955. |
| Volunteer astronomer | Camps on **Birch Lane** with a SETI dish. A field find in L3. |
| *Planned* Mabel & Crumb | Mabel (55) is a baker. Crumb (FR Miettes) is the bakery cat. |
| *Planned* Nora Bell, Len Briggs | Nora (46) house-sits for the Hendersons. Len (62) fixes bikes and has grandchildren. |
| *Planned* Rodney, Black Knight, Tom | Rodney is 32, the Black Knight 41 and Tom the Enchanter 56. |
| *Planned* Clive Forester, Sylvie Van Bell, Pastor Matt Collier | Ages 38, 29 and 57. |
| *Planned* Artie Duvet, Penny Thumb, Moe Dread | Artie (39) lives in a dressing gown. Penny (33) hitchhikes. Moe (16) is a robot. |

**Checked and consistent:** Sal, Echo, Dr. Osei and Bubbles are "she" everywhere. Krix and Vrell are "he"
everywhere, and Zib is never gendered. Doyle's age matches in the memo and the Archive. Hank's 347 sits
next to Larry's 346 in GDD-5. Every planned pickup is named in its memo. There's no duplicate first name
among the specimens. **Marvin** stays unique because 2199 uses Moe, and **Pete** has no clash.
One surname repeats: see N3.

---

## 3. Issues

### Blockers

**B1 · A rank gives Zib a parking ring years before the finale.**
`src/i18n/en.ts:518` reads `Senior Abductor: 'Own parking ring. Still behind Bubbles.'`, which a player
reaches at ★8, around Maple Court. The 2199 finale (GDD-14 §Season finale, panel 3) pays off "Your own
parking ring, Zib. She signed it over." The intern rank (`:515`) also says "Zero parking ring".
*Fix:* `{ title: 'Senior Abductor', flavour: 'Parking ring: waitlisted. Behind Bubbles.' }` (FR to match).
Keep the ring out of every rank line.

**B2 · The on-ramp calls the Birch Lane jobs "paid".**
GDD-11:3 says "two small paid jobs" and the #0003 memo (GDD-11:58) says "Zib, your first paid call is the
bakery…". The FR text (`:66`) says « ta première mission payée ». This contradicts the "Unpaid" tagline
(`en.ts:268`), the intern rank (`:515`) and the L8 payoff "You're hired, Zib. Actual salary." (`:1013`).
*Fix:* "Zib, your first **live** call is the bakery on Birch Lane." FR: « Zib, votre première vraie mission
vous attend à la boulangerie du chemin des Bouleaux. » Use "live" in GDD-11 §intro and §dispatch curve too.

**B3 · Order numbers and the "Agent" addressee break once the on-ramp lands.**
- `'#000{num}'` produces "#00010" from #0010 on. It appears at `en.ts:368, 703, 715, 2134, 2151, 2443` and
  `fr.ts:139, 530, 542, 2073`. *Fix:* pass a padded `{no}` (`String(num).padStart(4, '0')`).
- `src/ui/memo.ts:163` checks `lv.num >= 9 ? toAgent : to`. After renumbering, L7 (#0009) would read
  "TO: Agent Zib" before Zib is hired at L8. *Fix:* key it on the level ID (`level9` and every Dispatch
  ID), or add a level flag.
- Memo subjects that would show the wrong number: `en.ts:441` (#0003→#0005), `:452`, `:463`, `:474`, `:497`
  (L7 #0007→#0009), `:486` (L8 #0008→#0010), `:408` and `:528` (#0009→#0011). The French equivalents are at
  `fr.ts:178, 189–267, 343`. GDD-11 §Order numbers asks for this, so check it at release.

**B4 · GDD-12 numbers itself twice.**
GDD-12:7 says "Work Order #0012 after Clocking Out at 10:04, displayed as #0011 after the two Birch Lane
orders". With the Birch Lane orders, #0011 is 1955 (GDD-11:231, GDD-13:7).
*Fix:* "**Work Order #0012** with the two Birch Lane orders included (#0010 without them), right after
Clocking Out at 10:04 (#0011)."

**B5 · The L5 crate is impounded, then the stone sails on the cruise ship.**
In L5 the town pickup `obelisk_crate` can be impounded ("Manifest says 'decorative basalt, do not hum
at'", `en.ts:2088`; status "Impounded · Mildly humming", `:2462`; description `:2451`). The L7 memo
(`:498`) and first clear (`:1011`) then put "Grimsby Museum's missing black stone" on the ship.
*Fix:* make the crate an empty decoy that points to L7, which turns it into a clue instead of a hole.
- Comment: "The crate's empty: straw, a three-note chime and a forwarding label for the SS Buffet
  Royale. Accounting is furious nobody paid customs."
- Status: "Impounded · Empty, still humming".
- Description: "Stencilled 'FRAGILE — DO NOT EVOLVE NEAR'. Empty except for straw and a forwarding label.
  Plays booming dramatic music whenever anyone walks past holding a tool."

**B6 · Bubbles' farewell line is already spent in L5, verbatim in French.**
The finale's emotional beat (GDD-14 panel 2: "So long, and thanks for all the fish" / « Salut, et encore
merci pour le poisson ») already appears on Bubbles' L5 souvenir:
- `en.ts:2508`: "So long, and thanks for all the snacks."
- `en.ts:1326`: "So long, and thanks for all the tin."
- `fr.ts:2447`: « Salut, et encore merci pour le poisson. », the exact finale line.

That pays the payoff twice, and the repeat lands at the climax.
*Fix:*
- `:2508`: "Pried open with suspiciously neat flipper-work. Licked clean, then filed as evidence."
- `:1326`: "An empty sardine tin, fished off the pool floor. She has already invoiced us for the contents."
- FR to match. See S1 for the rest of the *Hitchhiker's* pre-spends.

**B7 · The Field Check, L2 and L3 copy still lead straight to Maple Court.**
Once #0003 and #0004 exist, these lines become false:
- `en.ts:2034` (Field Check body): "The laundromat van turned into Maple Court… three-specimen shift".
- `:2039`: "Skip to Maple Court".
- `:2042`: "Start Maple Court".
- `:2050`: "1 of 3 logged. Live shifts share one sunrise clock." #0003 has one specimen and no sunrise.
- `:2051`: "Sunrise starts on Maple Court".
- `:1007` (L2 first clear): "Maple Court awaits".
- `:442` (L3 body): "Training is over."

*Fix (EN, then FR to match):*
- Body: "Larry's report is filed, and Head Office wants a bulk order in Maple Court soon. First, one unpaid
  drill on Birch Lane: trip a porch sensor, clear a door lip, and don't wake the decoy."
- Skip / continue: "Skip to the bakery" / "Start the bakery call".
- Complete prompt: "1 logged. On a live shift the clock keeps running in every room."
- Complete comment: "Adequate. Your temporary lanyard is in the tray. First live call: the bakery on
  Birch Lane."
- L2 first clear: see S7.
- L3 body opener: "Three before dawn this time, Zib." (GDD-11:33)

### Should-fix

**S1 · *Hitchhiker's Guide* is pre-spent in the Grimsby levels.**
All four of the finale's anchors (DON'T PANIC, the towel, 42, thanks for the fish) already appear:
- L4 map billboard `"DON'T PANIC"` (`src/levels/deep-levels.ts:451`).
- Nigel's `room/towel_42` prop, labelled "42" (`src/abduct/views/building.ts:129`, placed at
  `rooms/deep.ts:238`), with its cue "Don't panic. Where's my towel?" (`simulation.ts:42`) and the same
  Nigel mumble (`rooms/deep.ts:102`).
- Base loading tip "Tip: don't panic…" (`en.ts:301`).
- L5 opener "Do I need a towel?" (`:161`).
- L7 towel swan "Always know where your towel is" (`:2526`, `:1495`).

That also breaks "Grimsby levels stay generic" (level-pitch-backlog).

*Fix (recommended):* strip these from Grimsby and keep only the L5 memo's "second-smartest species"
(`:464`) as the finale's setup.
- Billboard: "OPEN 24 HRS".
- Nigel's prop: a lost-property umbrella, cue "Lost property: one umbrella. Again."
- Nigel's mumble: "The dinosaurs are on my break."
- Tip: "Tip: screaming voids the saucer's third-party insurance."
- L5 opener: "Do I need a bucket?"
- Swan description: "Origami terrycloth that survived re-entry. Greg has already asked for it back."
- Swan quip `:1495`: "No swan. Fine. Greg took the rest of the towels anyway."

GDD-14:70 already treats the museum towel as its own prop, so this also tidies that note.
**User decision D1.**

**S2 · An L7 specimen line pre-spends 1953.**
`en.ts:2393`, Sterling `at10`: "Saw three towering tripods wade past the bow and bet Anchovy a cold would
beat them by Tuesday." That is the War of the Worlds twist and a retired Tuesday gag in one line.
*Fix:* "Taught Anchovy to ring the ship's bell whenever our green light hits. Anchovy now rings it for
dinner."

**S3 · Three origins for the brass thermometer.**
- GDD-6 §1 table, "1953 Probe Protocol" (:60), and the Mob-Era bullet (:111): young Vrell drops his
  clipboard in a harbourside fish warehouse.
- GDD-7:32: a kitchen calibration tool proves a crate was logged as a person.
- GDD-13:9 and :19: he borrows a farm's thermometer, takes the sick pilots' temperatures and files the
  first Form 7-B.

The live lines ("since 1953", `en.ts:476`, `:269`, `:520`, `:2160`) fit all three.
*Fix:* GDD-13 is canonical. Rewrite GDD-6:60 as "Payoff: 1953, the Tripod Division's cold. Rookie Vrell
takes their temperatures with a farm's brass thermometer and files the first Form 7-B (GDD-13)." Mark
GDD-6:111 and GDD-7:32 as superseded. GDD-6:28 "back when the brass thermometer was cutting-edge tech" →
"the night he borrowed a farm's brass thermometer and invented Form 7-B".

Side note: the L6 probe puts the thermometer on "the head" (`en.ts:350`), while GDD-13:112 says "every
backside gets a Form 7-B". Either is fine as a joke, but pick one: keep the cheek in the specimen
addenda and make GDD-13's line "…every specimen since gets a Form 7-B."

**S4 · Superseded plans are still written as live in GDD-6 and GDD-7.**
- GDD-7 has no "superseded" banner. Its chapter order (1953 first, then 1122 after Double Feature, then
  2199; GDD-7:9–15), its Mob Docks, Keep & Market and Orbital stories, and its claim that L8 ends with
  "Vrell's call to Zib's mum" (:60) all disagree with GDD-12/13/14 and the live game.
- GDD-6 L8 hook (:99) and Interlude #4 panel 3 (:321) promise a dial blinking **1122 · 1953 · 2199**, with
  no 1955, and the interludes never shipped (there is no `src/ui/interlude.ts`).
- GDD-6 §2 "Beyond L8" (:101–116) still pitches Godfather 1953, the "Checkout" keep and the orbital 2199.

*Fix:* put a banner on GDD-7: "Superseded 2026-11-25 for films, order, story and 2199 by GDD-10/12/13/14
and level-pitch-backlog. Engine, registry and save notes still apply." In GDD-6, replace §2 "Beyond L8"
with a pointer to this file's timeline, and mark §3 and §4.6 (interludes) "not shipped".

**S5 · Crest Valley versus "every era is Grimsby".**
L9 is set in Crest Valley (`en.ts:405`), but its report prints **THE GRIMSBY GAZETTE** (`:641`), and its
headlines name "MAIN ST" (`:671`). The reason for leaving Grimsby, a 1.21 GW spike pulling the dial off
its coordinates (`docs/l9/story-and-names.md:43`), never appears in game. GDD-6:108 and GDD-14 still
state the "same coordinates" rule.
*Fix:* one line in game. Second `start9` line (`en.ts:132`): "Nov 12, 1955! The spike dragged us off
Grimsby. Intercept that time car from the west turnout!" Then either give L9 its own masthead or keep the
Gazette as an "archive wire clipping" (GDD-10:85). Add the exception to the GDD-6 rule.
**User decision D2.**

**S6 · #0004 uses Pruitt and Gary before L3 introduces them.**
The #0004 memo (GDD-11:138–140) says "Mrs. Pruitt is watching…" and "Gary lent her a laser" with no setup,
and L3 (`en.ts:442–443`) then introduces both as new.
*Fix:* move the introductions.
- #0004, paragraph 1: "Mrs. Pruitt across the lane hasn't slept since 1994 and is watching both drives.
  When her binoculars glint…"
- #0004, paragraph 2: "Nora asked for a stepladder. Gary from Neighbourhood Watch lent her one of his
  garage lasers."
- L3 body: "Three before dawn this time, Zib. Maple Court: Dentist Dave, Coach Barb, and Gary from
  Neighbourhood Watch. Dodge the cruiser and Mrs. Pruitt's binoculars. Yes, her again."

**S7 · The lanyard setup is lost if the player skips the Field Check.**
The only "temporary lanyard" line is the Field Check's completion comment (`en.ts:2051`), yet the 2199
finale clips the permit onto "Zib's old lanyard" (GDD-14:174), and GDD-11:27 gives the lanyard to #0002.
*Fix:* L2 first clear (`:1007`): "Larry is logged and Accounting traced forty socks to your saucer.
Temporary lanyard's in the tray. Two calls on Birch Lane, then the bulk order."

**S8 · Zib's Mum has no payoff.**
Her payoff was meant to be Interlude #4 (GDD-6:56, :320), which never shipped. GDD-7:60 claims it happened,
and GDD-14 drops her. Her only live escalation is one random perfect-report line (`en.ts:964`).
*Fix:* make the 2199 Vrell first-clear line "Three residents. Grimsby stays. Krix can keep the invoice.
Your mother called, Zib. I told her: adequate." This also pays off "Adequate". **User decision D5.**

**S9 · Vrell's two personal threads are under-set.**
- His pension ("eleven weeks away", `en.ts:2035`; GDD-6:27) never resolves.
- His 1953 past has no hint in live text before GDD-13's memo confession.

*Fix:* add an `afterL5` tier tip: "Tip: Vrell flew field shifts in 1953. Do not ask him about the
thermometer." Resolve the pension in the 2199 sign-off: "— Vrell. Pension vested last week. Still here.
Don't tell Head Office." **User decision D6** (does Vrell retire?).

**S10 · Two Bubbles threads: the "coaching" mystery and the porthole tank.**
- L5 asks who coached her: "who taught a dolphin to write?" (`en.ts:1010`) and "Someone has been coaching
  her. Accounting has opened a file." (`:981`). Nothing answers it.
- GDD-14 relies on "Bubbles's porthole tank", which no live line has set up. Her repeat addenda
  (`:2367`) show her re-abducted from the aquarium.
- GDD-14:9 has Bubbles forward a copy "from the 2199 records terminal", and GDD-14:11 says she "has
  already left" "on arrival", which blurs the present and 2199.

*Fix:*
- Add an `afterL7` tip: "Tip: Bubbles now audits Accounting from the porthole tank by Vrell's desk. Knock
  twice."
- GDD-14:9 → "From her tank, Bubbles patched the Dispatch console into the 2199 planning records. That was
  the return ping at the end of 1953."
- GDD-14:11 → "Back at the Bureau, her porthole is already empty. The player learns it on the first-clear
  report."
- Answer the mystery in the transfer slip (panel 2), e.g. "Reason for transfer: nobody coached me. —B."
  This pays off L5's "second-smartest".

**S11 · Krix is free again after L8 with no explanation.**
At L8 he is "getting audited" (`en.ts:1013`) and can sit "in the hold… Under HR review" (`:2107`,
`:2465`). GDD-12 then sends him to 1122.
*Fix:* GDD-12 memo opener: "Agent Zib, Krix made bail, and OBELISK™ sent him to patent the Holy Grail
before anyone finds it."

**S12 · Whose toaster is it?**
- L1 (`en.ts:421`): Krix "returned a man still clutching his toaster".
- Field Finds (`:2454`): Krix is "still clutching **Farmer Doyle's** toaster".
- GDD-8:63: Krix is "clutching **his** toaster".
- GDD-6:310: "Farmer Doyle's old toaster".

*Fix:* drop Doyle. `:2454`: "Our infamous ex-intern, still clutching his toaster. Insists a shiny black
appliance counts as alien technology." Leave the L1 man anonymous.

**S13 · L9's last line closes the door that 1122 needs open.**
`en.ts:1005`: "…Put the dial back, Zib." GDD-12:7 makes the 1955 delivery open 1122.
*Fix:* "Three 1955 witnesses logged, and Krix can't patent time travel now. Put the dial back, Zib. Why
is it blinking 1122?" (FR to match.)

**S14 · Era archives borrow other films, and repeat Grimsby gags.**
This breaks "one film per era level" and doubles up existing jokes.
- GDD-12:101, Rodney `at10` "Beam me out, Scotty!" repeats Sterling `at3` "Beam me up, Scotty"
  (`en.ts:2392`). → "Wrote a victory song about his abduction. All eleven verses are about running away."
- GDD-12:102, Black Knight `at10` (lightsaber). → "Lost both arms at cards with the crew. Called it a draw."
- GDD-13:98, Sylvie `at10` (men in black) repeats Larry `at3` (`:2340`). → "Now keeps a Martian-only row at
  the drive-in. Headlights off, antennae down."
- GDD-13:99, Matt `at10` (E.T. "call home") repeats Pemberton `at10` "phone home" (`:2389`). → "Keeps
  tissues by the font for visitors from Mars. Every one of them has said thank you."
- GDD-13:97, Clive `at10` (mashed potatoes) is the **fourth** use, after the tip `:300`, Marco `:2397` and
  Dave's `potato_butte` prop. → "Wrote the sequel paper, 'Do Martians Catch Colds?' The answer was one word
  long."

**User decision D4.**

**S15 · The X-Files is an untracked running joke with eight uses.**
The uses: Gary `at3` (:2352), Nigel `at3` (:2356), Mayor `at10` (:2365), Pete `at10` (:2373), Sal `at3`
(:2376), Osei `at10` (:2385), plus the `saucer_poster` prop and Gary's mumble.
*Fix:* keep Gary and Nigel, replace four.
- Pete: "His lighthouse blinks 'RUDE WEATHER' in Morse whenever we pass. Ferries flash back 'NIGHT, PETE'."
- Sal: "Taped 'COUNT TWICE' over the petty cash tin, aimed squarely at Kipper and glowing night visitors."
- Osei: "Logs our visits as continuing professional development. Claims the hours."
- Mayor: "Opens every council meeting by asking if anyone is from another planet. One hand goes up. It's
  Gary."

**S16 · The retired Tuesday cadence comes back.**
- GDD-14:105, Artie `at10`: "stop on Tuesdays too". → "Has asked the saucer to come back on bin day. The
  bins won't take themselves out." FR: « le jour des poubelles ».
- `en.ts:1576`, L2 easter egg: "Classic Tuesday." → "Free parking, apparently."
- Sterling: see S2.

**S17 · Running-joke budget overruns.**
See §4. After S1 and S2 are applied, L4, L5 and L7 come back within 3 tracked jokes. 2199 needs the
Tuesday cut (S16), and its Form 12-C stays as the umbrella for the paperwork joke.

**S18 · The French on-ramp copy uses a different register and English place names.**
- GDD-11's FR memos (:66–70, :146–150) have Vrell say *tu*. Every live memo uses *vous* (`fr.ts:190–268`).
- GDD-11 keeps "Birch Lane" and "Maple Court" in FR. Live FR says **chemin des Bouleaux** (`fr.ts:1970`)
  and **l'allée des Érables** (`fr.ts:211`).

*Fix:* use *vous*, the live place names, and "Ordre n°0003" (live format, `fr.ts:189`). GDD-12 and GDD-13
write "Ordre de mission n° 0012"; change those too, and use **Bubulle** in the GDD-14 FR text.

**S19 · 1953 says the Bureau invaded.**
GDD-13:3 calls it "the Bureau's botched Martian invasion", and the memo (:17) says "The one behind the
screen is ours." The bible premise (GDD-6:13) says the Bureau doesn't conquer: "conquering requires an
environmental impact study."
*Fix:* GDD-13:3 → "the Tripod Division's botched census survey". Memo → "The one behind the screen is ours:
a census survey with a head cold."

**S20 · 1953 explains the thermometer in the memo, then again at first clear.**
The memo (GDD-13:19) gives the origin, and the first clear (:112) repeats it.
*Fix:* turn the memo into a tease: "I was a rookie pilot that night. Half the division had fevers. Don't
ask me about the thermometer." The first clear stays the payoff.

**S21 · Two "season finales".**
GDD-6 calls L8 the "Season climax" with a "Season Finale" interlude. GDD-14 calls 2199 the season finale.
*Fix:* name them "Season 1 finale (L8)" and "Dispatch finale (2199)", or call L8 "Act III climax".
**User decision D3.**

**S22 · The pitch backlog reuses 2199.**
`docs/research/level-pitch-backlog.md:16` pitches a Matrix level with "humanity asleep in pods around
2199", but GDD-14's 2199 has people in houses and a saved town.
*Fix:* re-date the pitch (for example 2299) or set it "the night after the bypass".

**S23 · Bubbles is 14 but remembers 1997.**
`en.ts:1327`: "Bubbles ate them in 1997." Her Archive age is 14 (`:2225`), and FR `:1283` has the same
year. *Fix:* "in 2019".

### Nits

- **N1 · Doris or Dorothy.** The L7 memo says "Doris" (`en.ts:499`) while Pruitt shouts "DOROTHY! THE
  BOOK!" (`:877`). → L7: "Mrs. Pruitt's sister Dorothy".
- **N2 · Mom or Mum.** Zib says "Mom" in game (`en.ts:86, 159, 176, 183, 194, 202, 902`) and the docs say
  "Mum". Pick one: "Mum" fits Grimsby's £ and "neighbour", but it's a voice call.
- **N3 · Two "Bell" surnames.** Nora **Bell** (#0004) and Sylvie Van **Bell** (1953), next to Len's bicycle
  bell and the bell clapper. → rename Nora (for example Nora Finch).
- **N4 · Larry's L6 cameo isn't in the game.** GDD-6:66 and :125 describe it (ticket #346), but nothing in
  `src/abduct/rooms/deep-clinic.ts` places it. Hank's "Now serving… 347?" (`en.ts:739`, `:2380`) nods to
  it. Ship the cameo or mark it as a plan.
- **N5 · Rank lines after L8.** "Fleet Admiral of Naps: Salary pending" (`en.ts:521`) still reads after "Actual salary". It's harmless
  before L8; swap it once L8 is delivered, or accept it.
- **N6 · Who touched the dial?** The L9 memo blames an alarm (`:409`), while its sign-off says "I told you to
  leave the dial alone" (`:411`). Either is fine; drop the blame from one of them.
- **N7 · GDD-6 errors.** GDD-6:67 gives the suburban Hendersons a tractor, and GDD-6:57 gives Doyle a cat
  that L1 doesn't feature. Fix the doc.
- **N8 · Name the 1953 drive-in.** Call it the Route 9 drive-in in GDD-13. It reuses `flight/barn_top`,
  so the farmyard could be Doyle's grandfather's. That ties it to GDD-6's present-day drive-in, "Double
  Feature", and to L9's "DOUBLE FEATURE" marquee for free.
- **N9 · French order format.** See S18.
- **N10 · Missing sign-offs.** Every live memo has its own Vrell sign-off line. The GDD-12/13/14 memos end
  with a bare "— Vrell". Suggestions:
  - 1122: "— Vrell. Please return the coconuts."
  - 1953: "— Vrell. I was young. The thermometer was younger."
  - 2199: see S9.
- **N11 · Not one week any more.** GDD-6:15 says "one escalating week of night shifts", but there are now
  eleven present-day shifts. → "one escalating season".
- **N12 · 1122 Gazette.** GDD-12:117 "COW FALLS FROM SKY. FRENCH DENY ALL KNOWLEDGE." echoes L1's "COWS
  DENY ALL KNOWLEDGE OF SAUCER" (`en.ts:674`). → "COW FALLS FROM SKY. FRENCH CLAIM IT WAS A GIFT." Give
  1122 the same archive-clipping masthead treatment as 1955.
- **N13 · The time car outlives its impound.** L2's scorched time car still shows after the car is
  impounded in L9. Acceptable as "it was always there"; note it in GDD-10.
- **N14 · "Agent Zib (junior)" stays junior forever.** Drop "(junior)" after the 2199 clear (see §5).

---

## 4. Running-joke budget (cap: 2–3 tracked jokes per level)

Tracked jokes:
- **A** · Krix and OBELISK, merged from L7 on
- **B** · named forms
- **C** · Zib's career: lanyard, pay, parking ring
- **D** · Pruitt and Doris
- **E** · Gary
- **F** · the sock hoard
- **G** · cats are management
- **J** · the Hendersons
- **K** · Bubbles outranks Zib
- **L** · Tripod Division sick leave
- **N** · the 1953 thermometer
- **M** · "Adequate" (Vrell's voice, not counted)

| Shift | Tracked | Count | Untracked extras now | Verdict |
| --- | --- | ---: | --- | --- |
| L1 | A, C | 2 | Zib's "Mom" bubbles | OK |
| L2 | A, F | 2 | time-car egg, "Classic Tuesday" | OK after S16 |
| Field Check | C, D | 2 | pension | OK |
| #0003 | G | 1 | | OK |
| #0004 | D, E, J | 3 | | At cap; it takes over L3's setups (S6) |
| L3 | D, E, J | 3 | X-Files (Gary) | At cap |
| L4 | D, E, A, B (9-V) | 4 | *Hitchhiker's* ×3, X-Files | **Over.** After S1, D and E are one-line callbacks inside one memo sentence; treat it as 3. |
| L5 | A (crate), K, G | 3 | *Hitchhiker's* ×3, X-Files ×2 | **Over** until S1 and S15 |
| L6 | B/N | 1 | four-star reviews, X-Files | OK |
| L7 | D, A, G | 3 | *Hitchhiker's* towel, War of the Worlds tripods | **Over** until S1 and S2 |
| L8 | A, C, B (Legal) | 3 | parking ring (Flint) | At cap |
| L9 | A, B (88-MPH) | 2 | the dial | OK |
| 1122 | A, L | 2 | Star Trek and Star Wars addenda | OK after S14 |
| 1953 | L, N/B | 2 | E.T., men in black, mashed potatoes | OK after S14 |
| 2199 | A, C/K, B (12-C) | 3 | Tuesday, "panic" repeat | **Over** until S16 and S1 |

**Repeat counts:**
- **Toaster:** 9 live mentions (`en.ts:421, 432, 487, 516, 1012, 2106–2109, 2454`). Nothing new is planned.
  Allow at most one final callback in 2199.
- **"Adequate":** 4 live uses (`:123, 168, 976, 2051`). Save its fifth for the Mum payoff (S8).
- **Forms:** 27-B/6 on every report, 7-B, 9-V, 88-MPH and 12-C. That stays within "one specific form per
  shift".

---

## 5. What the 2199 finale must resolve

Checked against GDD-14 as committed (`ae14562`).

- [x] **Krix and OBELISK™ closed for the season.** The order is voided, the bill goes to Krix, and the
  ruling closes all claims (GDD-14:9, panel 1). *Still needed:* why Krix is free after L8 (S11).
- [x] **Zib's parking ring.** Bubbles signs it over (panel 3). *Needs B1*, or a rank line steals it.
- [ ] **Zib's permanent badge.** The original goal (GDD-6:21) was "permanent badge, paid contract, own
  parking ring". Pay came at L8 and the ring comes in 2199; the badge never does. After the 2199 clear,
  drop "(junior)" from `memo.toAgent` (N14), or have Vrell swap the lanyard for a badge in panel 3.
- [x] **Bubbles' farewell.** Panel 2. *Needs B6* (the line is pre-spent) and S10 (set up the porthole tank;
  fix the present/2199 wording).
- [ ] **The L5 "who coached the dolphin?" mystery.** Not resolved. Answer it on the transfer slip (S10).
- [x] **Vrell as mentor.** He clips the permit on Zib's lanyard. *Optional:* the voided order is signed
  "Zib", countersigned "Vrell", which pays off GDD-6:33 ("puts Zib's name ahead of his own").
- [ ] **Vrell's pension.** Not resolved (S9, D6).
- [x] **Vrell's 1953 past.** Paid off in 1953 (GDD-13). The finale needs nothing more.
- [ ] **Zib's Mum and "Adequate".** Missing (S8).
- [x] **Grimsby stays Grimsby.** The harbour bend and lighthouse are kept (GDD-14:15), and the census saves
  the town, which pays off the premise.
- [x] **Dispatch after the finale.** Replayable (GDD-14:7). *Decide* what the console shows afterwards. A
  quiet dial is cleanest; the Matrix pitch is a later season (S22).
- [ ] **Tuesday.** Cut it from Artie's addendum (S16).
- [x] **The Hendersons.** Untouched; they stay unseen.
- [x] **The Tripod Division.** Closed in 1953; no 2199 mention is needed.
- [ ] *Optional:* GDD-6's thread "specimens remember fragments as the same dream" was never paid off. A
  single Gazette variant would do it: "HALF OF GRIMSBY HAD THE SAME DREAM AGAIN".

## 6. Decisions for the user

- **D1** (S1): strip *Hitchhiker's* from L4, L5 and L7 so the finale owns it (recommended), or cut the
  finale's repeats instead.
- **D2** (S5): keep Crest Valley and explain the spike in one line, or rename it "Grimsby, 1955". And
  which masthead does L9 use?
- **D3** (S21): is L8 the Season 1 finale with 2199 as the Dispatch finale, or is it one season ending
  in 2199?
- **D4** (S14): enforce "one film per era" in the specimen addenda as well, or exempt the `at10` addenda.
- **D5** (S8): the Mum payoff goes in Vrell's 2199 first-clear line (recommended) or a fourth panel.
- **D6** (S9): does Vrell's pension vest? Does he retire, or stay on as the mentor?
