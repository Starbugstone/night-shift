# Council review, round 5: Claude Opus

Reviewer: Claude Opus. This is a fresh, read-only read of the four docs as they stand after `793bcdc`, the round-4 revision:
- `docs/GDD-11-onramp.md` (#0003 and #0004)
- `docs/GDD-12-1122-grail.md`
- `docs/GDD-13-1953-tripods.md`
- `docs/GDD-14-2199-hitchhiker.md`

I checked them against `docs/story/decisions.md`, rounds 1–4 and their arbitrations, and the memo-hint test
(`tests/flight-collectible.test.ts:115–120`). This file is the only one I created.

## Scores

| Level | Humour | Ideas | References | Callbacks |
| --- | :-: | :-: | :-: | :-: |
| #0003 · Baker Mabel’s First Batch | 10 | 10 | 10 | 10 |
| #0004 · While the Hendersons Are Away | 10 | 10 | 10 | 10 |
| #0012 · 1122 Ni! | 9 | 10 | 10 | 10 |
| #0013 · 1953 The War of the Colds | 9 | 10 | 10 | 10 |
| #0014 · 2199 Your Town Is in the Way | 9 | 10 | 10 | 10 |

**Overall.** The round-4 arbitration landed in full:
- **1953:** Sol's thermometer line is in, and the queue is in the screen's east wing in view of the front rows. The flag now says "We're
  not from Mars", and the Gazette has SEQUEL.
- **2199:** "Yours is on the west harbour rack" with the `your towel` hint, the moved dozer, the dressing-gown sighting, the BILL TO KRIX
  heading and the ear-fish recital gag are all in.
- **#0004:** "fitted the laser" is in.
- **Bakery:** "Caught white-handed" is in.

I would ship both Birch Lane orders as they are. Three lines are left, one per era level. Two of them were introduced by round-4
edits: one dangles because its setup was cut, and one now contradicts what the player just did. None of the fixes adds a system, a
cast member or a level.

---

## #0003 · Baker Mabel’s First Batch (10 / 10 / 10 / 10)

No changes. The new lines landed:
- "Caught white-handed. And it isn't even my hand." The joke is in the picture, so no decoding is needed.
- The cover story "The first loaf clocked in. Mabel is still listed as out on delivery."
- The French headline *miches* … *s'envolent*.

The cat-runs-the-shop thread stays at one setup, one payoff and one picture. Larry's roll, the slipper flyer and the forty socks all
work cold.

## #0004 · While the Hendersons Are Away (10 / 10 / 10 / 10)

No changes. "Gary from Neighbourhood Watch fitted the laser for free. It's caught him four times." now reads at once. Len's watch line
works cold. Each running thread has its own setup and payoff, and none repeats:
- **The gnome's holiday:** sulking, then the passport, the window seat, the bus and the postcards.
- **The fern:** the sign-off, then Nora at 10.
- **Pruitt:** "one of us", then the 37th report, then planning permission.

In the French memo, « l'a installé » follows *le laser*, the nearest masculine noun, so it reads correctly even though *le code* is
masculine too. No change.

## #0012 · 1122 Ni! (9 / 10 / 10 / 10)

1. **Humour: Zib's launch line has lost its setup.** "They don't have horses. Just coconuts. Vrell, I'd like to expense the other
   half." In round 4 the memo sign-off was changed from Vrell expensing half a coconut to "No jousting on Bureau time", as Sol asked.
   Nothing on screen now says which half was expensed, so "the other half" points at nothing, and a player meeting it cold won't
   know what it means. Keep the sign-off and give the launch line its own Bureau punchline, aimed at the squire banging coconuts that
   the player can see:
   - EN: “No horses. Just a squire banging coconuts. Vrell, is that what you meant by a company car?”
   - FR: « Pas de chevaux. Juste un écuyer qui tape des noix de coco. Vrell, c’est ça, votre voiture de fonction ? »

Everything else ships:
- the sentry rotation: fart, "We've already got one!", hamster and the species-correction form
- "Run away!" with « Fuyons ! Fuyons ! »
- the Black Knight's dent, then flesh wound, then draw
- TIM on the sign
- "Look at the bones!"
- the herring
- "Five is right out. Zib counted to five."

## #0013 · 1953 The War of the Colds (9 / 10 / 10 / 10)

The thermometer payoff finally works:
1. The memo promises the story.
2. The sick pilots hold their hatches shut in a queue that the front rows can see.
3. Rookie Vrell stands there with his clipboard.
4. The first clear names the act: "I took temperatures from behind. The whole drive-in thought it was a probe." It is 120 characters
   in EN and 127 in FR, within the 135 budget, and it answers the shipped L6 memo.

1. **Humour: the tripod-leg cover story contradicts the run it reports.** “The chickens refused to evacuate. They own the tripod now.”
   This row shows when the leg is aboard, right after the player took the leg out from under the coop and watched the coop drop onto
   its block. The headline says the chickens kept it. Give the town's explanation of the missing leg, which is the joke a cover story
   exists to make. It works cold and uses the tilt the player just saw:
   - EN: “Coop loses a leg overnight. Farmer blames a very tall fox.”
   - FR: « Le poulailler perd un pied dans la nuit. Le fermier accuse un renard très grand. »
2. **Optional: the clapper speaks of the Bureau as "the Martians".** In the same catalogue, the flag says "We're not from Mars". The
   clapper's "The Martians thought it was last orders" then reads as the Bureau calling its own pilots Martians. The reel ("The
   Martians lose to germs") describes the film, and Matt's lines are in his own voice, so both stay. A small fix also calls back to
   the memo's "Half the division had colds":
   - EN: “Rang all night. Half the Division thought it was last orders.”
   - FR: « A sonné toute la nuit. La moitié de la division a cru que le bar fermait. »

## #0014 · 2199 Your Town Is in the Way (9 / 10 / 10 / 10)

The memo now delivers the towel quote and its answer in two sentences. Each of the finale's three panels has its own beat. "Then they
zoomed out", "In my experience that's a weapon", the petunias and "almost, but not quite, entirely unlike tea" are still the best
lines across the five docs.

1. **Humour: the poetry sighting goes stale after the first verse.** “If there's a second stanza, I'll take the airlock.” The joke is
   Zib's denial after "verse 1 of 300", and it lands on a first-approach sighting. Later approaches play verses 2 and 3 first, so a
   player caught on a repeat approach has just heard the second stanza and then hears Zib wonder whether one exists. Keep the airlock
   joke from the film, but make it true after any verse:
   - EN: “One more stanza and I'm taking the airlock.”
   - FR: « Encore une strophe et je prends le sas. »

Penny's new first mumble, "Ch. 1: Leave Grimsby. Ch. 2: See ch. 1…", fixes the one line that didn't decode last round.

## Continuity checks

I checked these. Only the first needs a change, and it is a copy nit that doesn't change any score.

- **1953 memo-hint case.** The Field Finds table changed the hint to `A tripod leg` / `Une patte de tripode`. The test lowercases both
  sides (`tests/flight-collectible.test.ts:115,120`), so it passes. But the trophy fallback quotes the hint verbatim (`Shift memo
  mentions "{hint}".`, `src/i18n/en.ts:2444`), and every other hint is lower case. Use `a tripod leg` / `une patte de tripode`.
- **Memo hints.** Each memo contains its hint in both locales: `a cherry pie`, `garden gnome`, `a shrubbery`, the tripod leg and
  `your towel` / `votre serviette`.
- **Coconut thread after the fix.** The launch line, the coconut halves ("The swallow refuses to comment"), the squires and the
  swallow are one film anchor seen from four angles. With the expense joke gone, nothing in the level repeats a punchline.
- **D5, D6 and D7.** Mum is paid off once, in the 2199 first clear. In finale panel 3, PENSION VESTED goes into LATER. 2199 says
  "Vrell recognizes Krix's docket from 1122", which is safe because 2199 opens only after both 1122 and 1953. No era first clear names
  a next date.
- **The lanyard.** In panel 3 the permit is clipped to "Zib's old lanyard", which pays off the temporary lanyard from Larry's report
  in GDD-11 and GDD-6. The junior address drops after the first 2199 delivery, as in the on-ramp spec.
- **D1.** DON'T PANIC, 42, the towel and the fish appear only in 2199.
- **The thermometer.** Grandpa Doyle, the coop on its weathered block with the three-toed print on L1, and Form 7-B agree with the
  shipped "Brass thermometers since 1953" lines.
- **Gnome postcards.** All three read in either era order and don't repeat the gnome's catalogue text.
