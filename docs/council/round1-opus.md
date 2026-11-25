# Council review, round 1: Claude Opus

Reviewer: Claude Opus. Scope: the five planned levels in `docs/GDD-11-onramp.md` (#0003, #0004), `docs/GDD-12-1122-grail.md`,
`docs/GDD-13-1953-tripods.md` and `docs/GDD-14-2199-hitchhiker.md`, read against `docs/GDD-6-story.md`, `docs/GDD-10-1955.md`,
`AGENTS.md`, the live copy in `src/i18n/en.ts`, `docs/story/continuity-review.md` and `docs/story/decisions.md`. Read-only; no game
file was changed.

The continuity blockers and should-fixes (B1–B7, S1–S16) are in `docs/story/continuity-review.md`. They are repeated here only when
they affect humour or references. The settled decisions (D1–D7 and the notes in `docs/story/decisions.md`) aren't marked down; where a
doc still disagrees with them, that's listed under "Doc updates to match the decisions".

## Scores

The Callbacks column scores how well each level's callbacks fit and how subtle they are. The user asked for one or two per level, so a
level with few callbacks doesn't lose points, and a level with none can still score well if it starts a good new arc.

| Level | Humour | Ideas | References | Callbacks (as written → with fixes) |
| --- | :-: | :-: | :-: | :-: |
| #0003 Baker Mabel's First Batch | 6 | 7 | 8 | 4 → 9 |
| #0004 The Neighbours Are Asleep | 6 | 6 | 8 | 6 → 9 |
| 1122 Ni! (Holy Grail) | 7 | 9 | 8 | 5 → 9 |
| 1953 The War of the Worlds | 7 | 6 | 5 | 6 → 10 |
| 2199 Your Town Is in the Way (Hitchhiker's) | 7 | 7 | 7 | 7 → 9 |

**The pattern across all five.** The docs are written mechanics-first. The jokes are mostly gentle observations ("Mabel uses it to
scrape exact change off the counter") rather than punchlines. Almost nothing uses the PG-13 room the tone section allows. Each level
needs two or three lines a player would quote. The fixes below go for those, most important first in each level.

---

## #0003 · Baker Mabel's First Batch (H6 / I7 / R8 / C4→9)

Keeping it generic is right. The cat-management joke is the right running joke. But a bakery is the easiest innuendo setting in the
game, and the doc doesn't use it.

1. **Use the buns joke, once in each place (cap it there).**
   - **Gazette.** Replace "BAKERY DENIES USING UFO TO SPEED UP FIRST BATCH" with **BAKER'S BUNS SEEN RISING INTO NIGHT SKY**. It also
     stops repeating the shipped "COWS DENY ALL KNOWLEDGE" pattern, which 1122 now uses as a deliberate callback.
   - **FR Gazette:** **LES MICHES DE LA BOULANGÈRE MONTENT AU SEPTIÈME CIEL**. *Miche* means both a round loaf and a buttock, so the
     French gets a pun of its own.
   - **Zib, launch:** "Vrell, am I allowed to look at her buns? The bread ones. I'm asking about the bread."
   - **FR launch:** « Vrell, j'ai le droit de regarder ses miches ? Les pains. Je parle des pains. »
2. **Replace the bent bread tray.** It's a dull object, and its joke ("the pouring corner") doesn't land. Use a **cherry pie cooling on
   the back step**, the cartoon trope everyone knows. It reads at phone size as a lattice disc with steam lines.
   - **memoHint:** "a cherry pie". Memo sentence: "A cherry pie is cooling on the back step. Cartoon law says that makes it fair game."
   - **Catalogue:** "Cherry pie. Left to cool on the back step, which under cartoon law is an open invitation."
   - **Found status:** "Half eaten. Vrell denies everything. There's cherry on his clipboard."
   - **Left behind:** "You left the pie. Crumb sat in it."
   - **Collected on a repeat:** "Another pie. Mabel now bakes one extra and leaves it facing the sky."
3. **Callback: Larry's standing order.** Replace Mabel's archive description with: "Has baked Larry from the laundromat a breakfast roll
   every morning for six years. He has never been awake to collect it." It works cold as a sleepy-customer joke, and anyone who played
   L2 recognises Larry's six years asleep on duty.
   - Optional extra, art only: Crumb sleeps on an odd sock in the room art, with no copy. It's a quiet nod to the sock hoard and stays
     out of the running-joke cap.
4. **Replace the dough scraper with a sourdough starter in a jar.** It ties in Zib's unpaid-intern joke without naming it. Catalogue:
   "Sourdough starter. Mabel's oldest employee. Fed twice a day, never paid. Zib says they relate."
5. **Vrell, first delivery:** "Mabel's aboard. Crumb is running the bakery now. Prices are up, and everything comes with fur."
6. **Mabel's mumble:** "Five more minutes… the buns are still proving themselves…"
7. **Optional, cheap room gag:** the dough slowly puffs up over the bowl while the player is in the room. It's a cosmetic sprite scale,
   static under reduced motion. It's the visual payoff of "she fell asleep while the dough rose".

## #0004 · The Neighbours Are Asleep (H6 / I6 / R8 / C6→9)

The best line is Pruitt logging the saucer "as an extension without planning permission". Keep it. It also quietly sets up the 2199
planning-notice joke. The weak spots are Len and Nora, who are bland. Per the decisions, this level now introduces Pruitt and Gary from
scratch, which puts it at the running-joke cap (Pruitt, Gary, the Hendersons).

1. **Give Gary his core joke cleanly: he fitted the Hendersons' alarm laser.** Replace "Nora asked for a stepladder. Gary lent her a
   laser." with:
   > "The Hendersons left Nora the alarm code. She wrote it on a list. The list is inside the house, behind the alarm. Gary fitted that
   > alarm for free. It has caught Gary four times."

   L3's "eleven times" then raises it. New signoff: "— Vrell. Don't water the fern. It's plastic."
2. **Introduce Pruitt here.** Zib, launch: "Does Mrs. Pruitt ever blink?" Vrell: "Not since 1994." The L3 memo then builds on her
   instead of introducing her.
3. **Make Len the man who borrowed everything the Hendersons own.** This turns the unseen-scapegoat joke around: here the Hendersons are
   the ones who get used.
   - **Len, archive description:** "Has been borrowing the Hendersons' tools since 1998. Calls it 'storage'. They are too polite to ask."
   - **Bicycle bell:** "The only thing in Len's workshop that belongs to Len. He thinks."
   - **Replace the magnetic parts dish with the Hendersons' spare key:** "Under the doormat, where everyone keeps theirs. Nora has been
     looking for it all week."
4. **Replace the bin lid with the Hendersons' garden gnome.** A red hat reads at phone size, and it allows one line in the spirit of
   *Amélie*'s travelling gnome.
   - **memoHint:** "their garden gnome". Memo sentence: "The Hendersons didn't take their garden gnome on holiday. He's sulking by Len's
     east drive."
   - **Catalogue:** "Garden gnome. The Hendersons didn't take him on holiday. Now he sends them postcards from the saucer."
   - **Status:** "On holiday at last."
5. **New arc: the gnome's postcards.** Pay off the gnome quietly in its Field Finds status, which changes after each later clear. It
   shows only if the gnome was collected. It sits in the trophy room, so it never crowds a level, and each postcard is funny on its own.
   - After 1122: "Postcard: 'Wet. Cows. Wish you were here.'"
   - After 1953: "Postcard: 'Saw a film. It came true.'"
   - After 2199: "Postcard: 'Home. The Hendersons didn't notice.'"
6. **Callback: Pruitt's binder remembers earlier nights.** Gazette, two or more sightings, replacing the indicator line: **MRS. PRUITT
   REPORTS LOW-FLYING SAUCER. ALSO A FLYING SLIPPER, LAST WEEK.** This calls back to Doyle's slipper from L1/L2 and works cold as
   absurdity. Move "fails to indicate" into Vrell's first clear, after the planning-permission line, if you want to keep it.
7. **Nora, at10:** "Found out the fern is plastic. Watered it anyway, out of respect." This pays off the fern joke.
8. **Len's mumble:** "Righty-tighty… lefty… no, righty…"
9. **Title.** "The Neighbours Are Asleep" says nothing. Use **Minding the Hendersons'**, with the card line "Two sleepers. One nosy
   neighbour." FR: *On garde chez les Henderson* · « Deux dormeurs. Une voisine curieuse. »

## 1122 · Ni! (H7 / I9 / R8 / C5→9)

This is the strongest idea of the five. Cow shadows, the coconut-clop pulse, a Killer Rabbit that lunges on slow hover, a shrubbery that
silences the knights, and Rodney stepping away in his sleep all put the joke into the mechanic. The lines are softer than the ideas.

1. **Black Knight bonk mumbles should escalate instead of repeating.**
   - First bonk: "'Tis but a dent."
   - Second: "Merely a flesh wound."
   - Third and later: "Fine. We'll call it a draw."

   With the armour-shedding visual, this becomes the scene people talk about.
2. **"Tom the Enchanter" throws away the film's best Tim joke. Make the rename the gag.**
   - **Archive:** "There are some who call him… Tim. He's stopped correcting them."
   - **Mumble:** "There are some who call me… Tom."
3. **Change Krix's racket.** It's the fourth patent scheme in a row (L8 patents, L9 time travel, 1122 the Grail, then the 2199 land
   sale). New memo sentence:
   > "OBELISK™ wants the Grail so it can sell eternal life as a monthly subscription. Bring in the three knights who signed up in their
   > sleep, and the sale is void."

   **Vrell, first clear** (also drops "Next stop, 1953", see D7): "Witnesses filed. Krix's subscription is cancelled. The Grail stays
   lost, which is how the humans like it."
4. **The taunter's sighting bark** (once, in `FLIGHT_BUBBLES`): "I fart in your general direction, you flying saucepan!" This is the
   film's most quoted insult, bent with a saucer pun, and it's the right butt-joke register. FR: check the dub's wording before writing
   it.
5. **Zib, launch** (replaces "Is the horse supposed to fit in his pockets?"): "Those knights are banging coconuts together. Is that how
   humans flirt?" FR: « Ces chevaliers tapent des noix de coco. C'est comme ça que les humains draguent ? »
6. **Callback: the cows, in another age.** Gazette, ordinary: **COWS STILL DENY ALL KNOWLEDGE** (1122 archive treatment). It's the L1
   headline nine centuries earlier and works cold. Nothing else; the film leads.
   - If the callback is not wanted, the fallback ordinary headline is: "LOCAL COW AIRBORNE AGAIN. FRENCH: 'NOT OUR COW.'"
7. **Holy Hand Grenade:** "Pin in. Count to three. Zib counted to five, so the hold has a skylight now."
8. **Black Knight's shield:** "NONE SHALL PASS on the front. On the back, in smaller letters: OPENING HOURS 9–5."
9. **Memo:** replace the cow sentence with "The French are throwing cows. If a cow-shaped shadow gets bigger, move."
10. **Remove the Star Trek and Star Wars addenda** (S14, D4). Rodney `at10`: "Wrote a victory song about his abduction. All eleven verses
    are about running away." Black Knight `at10`: "Lost both arms at cards with the crew. Called it a draw."
11. **FR card:** use the French release title, *Sacré Graal !*

## 1953 · The War of the Worlds (H7 / I6 / R5 / C6→10)

The premise is great: the invaders are beaten by the common cold, the Tripod Division is the Bureau's own crew, and rookie Vrell invents
the thermometer. The Gazette line "MARTIANS INVADE. MARTIANS CATCH COLD. MARTIANS GO HOME." is a 10.

The references aim at film buffs:
- The 1953 film's swan-necked machines and three-colour eye.
- Sleeper names (Forester, Van Bell, Collier) that echo characters nobody remembers.
- A "tripod leg" pickup that the doc has to explain away as a landing strut.

1. **Use tripods outright.** Wells's tripods are public domain and are the image everyone knows. Drop the swan-neck machines, the
   three-colour eye and the "removable landing strut" explanation. Then the memo, the pickup and the "claims a limp" status all read
   without explanation.
2. **Make the signature hazard the Bureau's own sick tripod, sneezing heat rays.** It's down to two legs, and its missing leg is the
   pickup.
   - Amber "Ah… ah…" shows the cone that's about to fire.
   - Red "CHOO!" marks the live burst.

   Build it as a timed cone with an arming lead, like the Grail's cow patch. It replaces the press flashbulb, which reuses L7's
   photographer. The hazard, the pickup, the twist and the running joke all become one picture.
3. **Pay the thermometer off once, at the first clear** (decisions: brass thermometer).
   - **Memo, second paragraph:** "I was a rookie pilot that night. Half the division had colds. I'll tell you what I did about it when
     you get back."
   - **Vrell, first clear:** "The tripods had colds, Zib. I found a brass thermometer and took everyone's temperature. From behind.
     That's where humans got the probe idea."
   - **FR first clear:** « Les tripodes étaient enrhumés, Zib. J'ai trouvé un thermomètre en laiton et j'ai pris la température de tout
     le monde. Par derrière. C'est de là que vient cette histoire de sondes. »
4. **Callback: the farm is Doyle Farm, run by Grandpa Doyle.** Two heirlooms follow from the film:
   - **Thermometer:** add to Clive's or the farmhouse copy: "Grandpa Doyle lent us the thermometer. He never asked for it back. After
     that night, nobody would."
   - **Tripod leg:** the missed-pickup line already says "propping up the chicken coop". Add a rusty copper strut by the coop on the
     shipped L1 Doyle Farm map, as scenery with no detector. Players who meet the leg in 1953 will recognise it; players who don't will
     just see a farmyard.
   - Optional third, art only: in one of the panicking-spectator groups, **a little girl with opera glasses writing in a notebook**
     (young Pruitt). Mention her in one line only, Peg's `at3`: "Says a little girl in the front row wrote down every word the Martians
     said. In a binder."
5. **Replace Sylvie with Peg the projectionist.** "Peg has watched the invasion picture 312 times. She dozed off during the real one."
   Her booth route already sits in the projection booth, and her character ties into the projector hazard. Mumble: "Reel two… the
   Martians die at the end… they always die at the end…"
6. **Make Pastor Matt the welcome committee.** That's the film's walk toward the machines, as the trope everyone knows.
   - Sleep excuse: "walked up to the tripod with a WELCOME sign and a plate of biscuits."
   - Souvenir: replace the bell clapper with "WELCOME sign. Slightly scorched. The biscuits survived."
   - Mumble: "We come in peace… mind the step…"
7. **Zib, launch:** "Vrell, one of ours is sneezing heat rays. Do I say bless you?"
8. **Archive fixes** (S14, D4): remove the E.T., men-in-black and mashed-potato addenda.
   - Clive `at10`: "Wrote the sequel paper, 'Do Martians Catch Colds?' The answer was one word long."
   - Sylvie's men-in-black `at10` goes with her; if she stays: "Now keeps a Martian-only row at the drive-in. Headlights off, antennae
     down."
   - Matt `at10`: "Keeps tissues by the font for visitors from Mars. Every one of them has said thank you."
9. **Give it its own look.** "Reuse the 1955 map palette" makes it look like L9 again. Use dark farm fields, the glow of the drive-in
   screen, and the green spill from the tripod's cockpit.

## 2199 · Your Town Is in the Way (H7 / I7 / R7 / C7→9)

This is the right property for a finale. Poetry as the detector is a real joke built into the mechanic. "He got to the second stanza. I
had to leave." is good. "Tea first. Then the end of the world." is good. What holds it back: only one flight hazard type, and the two
most famous gags are missing. D1 settles the pre-spent anchors once the shipped L4, L5 and L7 lines are rewritten.

1. **Use the famous version of the planning-notice joke.** "The plans were on display at the planning office in Alpha Centauri. For
   fifty years. Panicking requires Form 12-C."
2. **Make the poem properly awful.** The joke is that it hurts to hear.
   > "O Grimsby, thou art damp and small, / Thy gulls are loud, thy bins are tall. / I'd wrap thee in my verse all night, / But thou art
   > in the way. Goodnight."

   FR: « Ô Grimsby, ville humide et naine, / Tes goélands crient, tes poubelles sont pleines. / Je te chanterais toute la nuit, / Mais
   tu gênes. Bonne nuit. »
3. **Give Moe Marvin's line, bent.** "Moe Dread" doesn't read as Marvin, and the name Marvin is taken by L9. Mumble: "Brain the size of
   a planet, and they want me to nap."
4. **The whale and the petunias.** Add them as the Gazette on delivery: **WHALE AND BOWL OF PETUNIAS FOUND IN HARBOUR. PETUNIAS: "OH NO,
   NOT AGAIN."**
5. **Artie's sleep excuse should be the opening scene.** "Spent the day lying in the mud in front of a bulldozer, in his dressing gown,
   to save his house. Went to bed in the same dressing gown."
6. **Flight variety.** Replace the east lectern with a bulldozer on an existing `steward` route, with a headlight cone ("still looking
   for Artie's house"). Four copies of the same cone are the thinnest hazard set of the three eras.
7. **Vrell, first clear (D5):** "Three residents. Grimsby stays. Krix gets the bill. And Zib: your mother called. I told her: adequate."
8. **Panel 3 (D6):** Vrell slips his signed retirement form into a drawer marked **LATER**. That pre-spends Moe's line "His off switch is
   labelled LATER" in the same level. Change Moe's description to: "His off switch is labelled NOT NOW. It is the only part of the
   manual he agrees with."
9. **Callback: the complaints bureau is still processing Gary.** Moe `at3`: "Still working through Gary's CCTV complaints from the
   2020s. He's on page four. Gary filed eleven pages." Moe's job is complaints, so this sits naturally. The finale already carries Krix,
   Bubbles, the parking ring, Mum and the pension; don't add more callbacks.
10. **Artie `at10`** (S16, retired Tuesday): "Has asked the saucer to come back on bin day. The bins won't take themselves out." FR:
    « le jour des poubelles ».

---

## Doc updates to match the decisions

These aren't scoring points, only places where the text disagrees with `docs/story/decisions.md`.

**GDD-11**
- "two small paid jobs" (line 3) and "your first paid call" (line 58) should say **live**; FR « ta première mission payée » to match.
  The cherry-pie memo sentence replaces line 58's second half anyway.
- #0004 must introduce Pruitt and Gary from scratch (fixes 1 and 2 above). L3's memo then needs rewording so it builds on Pruitt rather
  than introducing her.

**GDD-12**
- The first clear says "Next stop, 1953". D7 says first-clear lines never name the next date. Use the replacement in 1122 fix 3.
- Remove "Tripod Division's sick leave gets one line at the end to set up the next date", and "The first 1122 delivery opens 1953".
- B4: GDD-12 still numbers itself two ways.

**GDD-13**
- Remove "after Ni!" and the unanswered 2199 return ping. Under D7, 2199 opens once both dates are delivered, so the ping would fire in
  the wrong order half the time. L9's "Why is it blinking two more dates?" now does that job.
- The memo must not spend the thermometer before the first clear (1953 fix 3).

**GDD-14**
- Change "lights up after any 1953 delivery" to **after both 1122 and 1953**.
- "Bubbles forwarded a copy… that was the return ping at the end of 1953" goes with the ping.
- Add D5 to Vrell's first clear and D6 to panel 3 (2199 fixes 7 and 8).

## Era order

Settled by D7: once L9 is delivered, 1122 and 1953 can be played in either order, and 2199 opens once both are delivered. Each era
level therefore has to work cold in either order. The fixes above keep 1122 and 1953 free of references to each other; the gnome
postcards in the trophy room are keyed per level, so they read fine in either order.

## Bold calls under the artistic-freedom brief

All within the hard rules and the agreed scope. Of the fixes above, these are the ones I'd push hardest:
1. **1953: the Bureau's own sick tripod, sneezing heat rays.** It's down to two legs, and the missing leg is the pickup. It turns the
   twist, the hazard, the pickup and the thermometer payoff into one picture.
2. **1122: the Black Knight's armour falls off as you bonk him, with escalating mumbles** ("'Tis but a dent." → "Merely a flesh
   wound." → "Fine. We'll call it a draw.").
3. **#0003: a cherry pie** instead of the bent bread tray, plus the buns innuendo.
4. **2199: Artie asleep in the dressing gown he wore lying in front of the bulldozer**, plus the whale-and-petunias Gazette.
