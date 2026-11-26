# Council review, round 4: Claude Opus

Reviewer: Claude Opus. This is a fresh read of the four docs as they stand at `bf3aad1`, after the round-3 revision:
- `docs/GDD-11-onramp.md` (#0003 and #0004)
- `docs/GDD-12-1122-grail.md`
- `docs/GDD-13-1953-tripods.md`
- `docs/GDD-14-2199-hitchhiker.md`

I checked them against `docs/story/decisions.md`, the three earlier rounds and their arbitrations, `docs/GDD-6-story.md`, the
live copy in `src/i18n/en.ts` and the memo-hint test (`tests/flight-collectible.test.ts:120`). This was a read-only review, and this
file is the only one I created.

## Scores

| Level | Humour | Ideas | References | Callbacks |
| --- | :-: | :-: | :-: | :-: |
| #0003 · Baker Mabel's First Batch | 10 | 10 | 10 | 10 |
| #0004 · While the Hendersons Are Away | 9 | 10 | 10 | 10 |
| #0012 · 1122 Ni! | 10 | 10 | 10 | 10 |
| #0013 · 1953 The War of the Colds | 9 | 10 | 10 | 9 |
| #0014 · 2199 Your Town Is in the Way | 9 | 10 | 10 | 10 |

**Overall.** The round-3 arbitration landed in full:
- The Holy Hand Grenade has "Zib counted to five" again, and the rabbit sighting line is "Run away!".
- The 1953 first clear now says "From behind", and the sick pilots in the queue hold their hatches shut to set it up.
- 2199 uses "Mostly harmless" once. Moe now has "Life. Don't talk to me about life." and his sulks, and Penny sticks out her thumb.
- #0004 has Pruitt's page turn and a visible hedge.
- The cat and gnome repeats are gone.

I would ship #0003 and 1122 as they are. Four small items are left, one line or one placement each:

1. **1953:** the thermometer reveal says "in front of a full drive-in", but the doc puts the queue behind the screen. Move the queue.
2. **1953:** the new Gazette headline is the weakest line in the level. The parking joke has nothing to do with the film.
3. **2199:** the memo says "towel" three times in two sentences.
4. **#0004:** a pronoun in the memo makes it unclear what Gary fitted.

None of these fixes adds a system, a cast member or a level. Each level's fixes are listed most important first.

---

## #0003 · Baker Mabel's First Batch (10 / 10 / 10 / 10)

No changes. Every round-3 fix is in:
- the new cover story ("best service in years")
- the kitchen timer text
- "Bring back the tin."
- the *levée* pun in both French lines

Players will quote "I knead five more minutes…", BAKER'S BUNS SEEN RISING INTO NIGHT SKY and "a cracker with ambitions". The French
headline (*miches*, *septième ciel*) is a sharper innuendo than the English. It stays within PG-13 leaning 16, so keep it.

The callbacks are the right size:
- **Larry:** the LARRY bag sits beside the keys, and Mabel's dossier explains it.
- **Doyle:** the slipper flyer.
- **The sock hoard:** "forty socks" in the handoff.

All three show on screen or work cold.

## #0004 · While the Hendersons Are Away (9 / 10 / 10 / 10)

The page turn turns Pruitt into a character tell without moving the cone. With the hedge on the map, the 1122 shrubbery status pays
off. The ideas and callbacks are complete.

1. **The memo's "it" is ambiguous in English.** "The list is inside, behind the laser. Gary from Neighbourhood Watch fitted it for
   free. It has caught Gary four times." The nearest noun is the list, so on a first read Gary fitted the list. The French is already
   clear, because *installé* is masculine and so refers to the laser. Change only the English:
   - EN: "Nora wrote the alarm code on a list. The list is inside, behind the laser. Gary from Neighbourhood Watch fitted the laser
     for free. It has caught Gary four times."
   - FR: no change.
2. **Optional, and it reopens a line arbitrated in round 2:** Len's mumble "It's not the wheel ticking… it's me…" is the one line in
   the level a player has to puzzle over. It doesn't say whether the tick is his knees or his heart, and if it's his heart, the joke
   is a little grim. A plain sleep joke fits his "listening for a tick" excuse and works cold.
   - EN: "There's the tick… oh. It's my watch…"
   - FR: « Le voilà, ce tic-tac… ah non. C'est ma montre… »

## #0012 · 1122 Ni! (10 / 10 / 10 / 10)

No changes. These now land in the film's own words:
- the Grenade ("Five is right out. Zib counted to five.")
- "Run away! Run away!"
- "Look at the bones!"
- the coconut migration with the swallow refusing to comment

"Pin-in" is gone from the route row. The sentry rotation runs fart, "We've already got one!", hamster. Sol's census reply ("Is that
a species correction? I'll need a form.") is a better Bureau gag than the Head Office one, and it doesn't stack a third callback on
the toaster and the hedge.

Before the French copy is final, confirm « Fuyez ! Fuyez ! » against the French dub, as round 3 asked.

## #0013 · 1953 The War of the Colds (9 / 10 / 10 / 9)

The reveal now works as intended:
1. The sick pilots hold their hatches shut.
2. Rookie Vrell stands at the front of the queue with his clipboard.
3. The first clear: "From behind. In front of a full drive-in."

This also squares the shipped L6 memo ("we're insulted by their other theories"). The new Clive, Sylvie and Matt lines all have
punchlines.

1. **Callbacks: the reveal contradicts its own staging.** The setting paragraph puts rookie Vrell "at the front of the queue behind
   the screen". A drive-in screen is opaque, so nobody in the audience can see behind it. "In front of a full drive-in" is the
   punchline of the season's one-time payoff, and a player who saw the queue at spawn will notice. Move the queue so the line is
   literally true. This only moves scenery, and the queue is still visible from the spawn camera:
   - Replace "at the front of the queue behind the screen" with "at the front of the queue in the screen's east wing, in full view
     of the front rows". Keep the queue outside the projector cone and the sneeze, with no detector. This is the side where the sick
     tripod enters.
   - The first-clear text doesn't change.
2. **Humour: the Gazette headline is off-film.** "DRIVE-IN CHARGES SAUCER FOR TWO PARKING SPACES" replaced round 3's "AUDIENCE
   APPLAUDS AS INVASION LEAVES EARLY". It is a generic parking joke: it doesn't touch the film, the cold or the B-movie era, and it
   blurs the parking-ring arc, which belongs to 2199. Headlines fire on two or more sightings, so the joke should be the saucer being
   seen at a screening. In 1953 a hit B-movie means a sequel:
   - EN: **SAUCER SEEN OVER DRIVE-IN. AUDIENCE DEMANDS SEQUEL.**
   - FR: **UNE SOUCOUPE AU-DESSUS DU DRIVE-IN. LE PUBLIC RÉCLAME UNE SUITE.**

## #0014 · 2199 Your Town Is in the Way (9 / 10 / 10 / 10)

Every room has a film gag now: the thumb, the sulks, Marvin's line and the "Mostly harmless" entry. The finale panels give each arc
its own beat. "Then they zoomed out" and "In my experience that's a weapon" are still the best lines across the five docs.

1. **Humour: the memo is clunky about the towel.** "Always know where your towel is. There's a towel on the west harbour rack."
   That's three towels in two sentences, and the second sentence flattens the quote. Turn it into a payoff. The memo-hint test
   requires the memo to contain `memoHint`, so change the hint to the phrase the quote already uses:
   - EN memo: "…Always know where your towel is. Yours is on the west harbour rack." `memoHint`: `your towel`.
   - FR memo: « …Sachez toujours où est votre serviette. La vôtre est sur le portant à l'ouest du port. » `memoHint`:
     `votre serviette`.
   - The unfound hint, the catalogue text and the towel's name stay as they are.
2. **Optional:** Penny's mumble "Breakfast included… if you catch it…" is the only line in the level that doesn't read as a joke
   straight away. Her other mumble and the guide entry already make the "wants to leave" joke. This replacement draws on her travel
   writing:
   - EN: "Note to self… the bench is the best thing here…"
   - FR: « Note pour plus tard… le banc est ce qu'il y a de mieux ici… »

## Continuity checks that passed

I checked these; none needs a change.

- **The Mum thread.** The 1122 hamster reply no longer sets up Mum. The 2199 first clear ("Your mother called, Zib. I told her:
  adequate.") still stands on the shipped thread: the Zib bubbles in L1–L4, the Clock-In interlude and her calls after a perfect
  report (GDD-6). It also works cold. D5 holds.
- **D7.** 2199 says "Vrell recognizes Krix's docket from 1122", which is safe because 2199 opens only after both 1122 and 1953. No
  era first clear names a next date.
- **Memo hints.** Each memo contains its exact lower-case hint in both locales: `a cherry pie`, `garden gnome`, `a shrubbery`,
  `a tripod leg` and `a towel`. The last one changes only if fix 1 for 2199 is applied, together with the new hint.
- **Character budgets.** The 1953 first clear is 128 characters in EN and 134 in FR, within the 135 budget.
- **Ancestors and the brass thermometer.** Grandpa Doyle and the coop match the rusty strut on L1, the "Brass thermometers since
  1953" lines (`src/i18n/en.ts:269`, `:476`) and the Form 7-B cover story.
- **Gary's counts.** He is caught four times in #0004, then eleven times on the Maple Court lasers and in the record books. No era
  doc repeats a Gary tally.
- **D1.** DON'T PANIC, 42, the towel and the fish appear only in 2199. Krix's pen over **RECEIVED** echoes the worn RECEIVED side
  of the complaint stamp. That echo is good, so keep it.
- **Gnome postcards.** The three postcards (Wet. Cows. / the main feature needed a tissue / saved by paperwork) each read in
  either era order and don't repeat the gnome's catalogue text.
