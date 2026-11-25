# Council review, round 3: Claude Opus

Reviewer: Claude Opus. This is a fresh read of the docs as revised after `6973afd`:
- `docs/GDD-11-onramp.md`
- `docs/GDD-12-1122-grail.md`
- `docs/GDD-13-1953-tripods.md`, now titled "The War of the Colds"
- `docs/GDD-14-2199-hitchhiker.md`

I checked them against:
- `docs/story/decisions.md`
- `docs/council/round1-*` and `round2-*`, with both arbitration files
- the live copy in `src/i18n/en.ts`

This was a read-only review. This file is the only one I created.

## Scores

| Level | Humour | Ideas | References | Callbacks |
| --- | :-: | :-: | :-: | :-: |
| #0003 Baker Mabel's First Batch | 9 | 10 | 10 | 10 |
| #0004 While the Hendersons Are Away | 9 | 9 | 10 | 9 |
| #0012 · 1122 Ni! | 9 | 10 | 9 | 10 |
| #0013 · 1953 The War of the Colds | 8 | 10 | 10 | 9 |
| #0014 · 2199 Your Town Is in the Way | 9 | 9 | 9 | 10 |

**Overall.** The round-2 arbitration was applied faithfully. Some of the changes clearly worked:
- The bakery now reads from the first screen: the floury handprint, the cat on the keys, the pie on the sill, the rising dough.
- 1953 now has a joke title, a marked shortcut through the sneeze, and room gags.
- 2199's poem is properly bad.

Most of what is left under 10 is single lines. Three issues matter more than the rest:

1. **The 1953 thermometer payoff is muddled in English.** This is the season's one-time reveal, and the EN line reads as a riddle ("Temperatures: none by mouth"). The FR line is clearer than the EN. This is the most important fix in the review.
2. **The Holy Hand Grenade line has regressed.** "Zib counted to five" was on every reviewer's keep list. The revision swapped it for a weaker line and lost the film's "five is right out".
3. **2199 contradicts itself on "Mostly harmless".** Grimsby's guide entry is "Mostly harmless" in one place and "less so" in another. Penny also gets three star-rating jokes.

Every fix below swaps one line, one pose or one piece of scenery. None adds a system, a cast member or a level. Two of the fixes are cosmetic room reactions, and both reuse hooks the docs already specify (the Black Knight's per-bonk mumble rotation and Rodney's pose tell). In each level the fixes are listed most important first.

---

## #0003 · Baker Mabel's First Batch (H9 / I10 / R10 / C10)

**What works.** I would ship the level design as it stands:
- The handprint under the motion light and Crumb sleeping on the keys.
- The LARRY bag and the dough rising over its bowl.
- The floury outline Mabel leaves on the bench, and the pie steam curling into a beckoning finger.

The two callbacks (the LARRY bag and the slipper flyer) are the right size. Both are visible on screen and both work cold.

1. **The cover-story row repeats the first-clear joke.** The report shows "Crumb opened at five… Cash only." and, in the same report, "The cat runs the bakery now. Nobody has questioned it." That makes three beats of the cat-in-charge joke, with the memo, in one level, and the cover story only restates it. Give the row a different everyday angle. The paw-printed OPEN sign stays as it is.
   - EN: "Bakery opens without its baker. Customers praise the best service in years."
   - FR: « La boulangerie ouvre sans sa boulangère. Les clients saluent le meilleur service depuis des années. »
2. **The kitchen timer's catalogue text describes gameplay.** "Mabel wakes when it falls off the shelf" is a room note, not a joke.
   - EN: "Kitchen timer. Goes off at four and wakes the whole street. Except Mabel. The street has asked us to keep it."
   - FR: « Minuteur de cuisine. Sonne à quatre heures et réveille toute la rue. Sauf Mabel. La rue nous demande de le garder. »
3. **The repeat-pickup line is sweet but not funny** ("Mabel's started baking one for the sky"). Let Mabel react to the theft, which is in character and works cold.
   - EN: "Another pie. This one had a note under it: 'Bring back the tin.'"
   - FR: « Encore une tarte. Avec un mot dessous : "Rendez le moule." »
4. **The French mumble is clunky.** « Laissez-moi lever encore un peu… je me lève après… » trips over *lever* and *se lever*. The round-2 version puts the pun in one word: *levée* means both "risen", as dough, and "up", as a person.
   - FR: « Encore cinq minutes… je suis pas encore levée… »
5. **The French card tagline loses the joke.** « Endormie avant la pâte » doesn't say she fell asleep before the bread was done. Use the same pun.
   - FR: « Debout avant le quartier. Moins levée que la pâte. »

## #0004 · While the Hendersons Are Away (H9 / I9 / R10 / C9)

**What works.** Keep these:
- Pruitt's binder and "she's one of us"
- the bin-lid decoy
- the four flash photos
- the fern that Nora waters "out of respect"
- the BOLTS biscuit tin
- Len's "storage"
- "Tomorrow he's trying the bus"

Pruitt and Gary are now introduced cleanly, as the decisions require.

1. **The gnome "facing the drive" appears three times.** The memo says the Hendersons left him behind. The catalogue says "He's been facing the drive ever since." The repeat line says "He's faced the same drive his whole life." Keep the repeat line, which is the best of the three, and give the catalogue its own picture. This needs one art change: add a little fishing rod to the gnome sprite, which also helps the silhouette read at phone size.
   - EN: "Garden gnome. Holds a fishing rod over a pond that was filled in years ago. Still hopeful."
   - FR: « Nain de jardin. Tient une canne à pêche au-dessus d'une mare comblée depuis des années. Toujours plein d'espoir. »
2. **The 1953 postcard is the weakest of the three.** "Saw a film. It came true." explains rather than lands. Tie it to the cold, which is that level's main joke.
   - EN: "Drive-in. The main feature sneezed on me."
   - FR: « Drive-in. Le film m'a éternué dessus. »
3. **Ideas to 10: give Pruitt a character tell.** Have Pruitt turn a page in her binder in the beat before she swings to the next bearing. This decorates the existing amber preview without moving it, so the tell stays honest. It makes the level's only detector a character rather than a generic cone, and players will learn "page turn, then she looks". Hold the page still in reduced motion.
4. **Callbacks to 10: put the Hendersons' hedge on the map.** The 1122 shrubbery status ("The Hendersons will spend nine hundred years growing a hedge in this exact spot") and the shipped "The Hendersons moved the hedge again." both lean on a hedge the player has never seen. Line the Hendersons' front garden with a tall clipped hedge. It is scenery only. Keep the low brick wall as the drive divider and landmark.
5. **Minor: the return line misstates the record.** "One aboard. That's already my record." It only ties the record, since Zib delivered one per shift before this. The French line already says *égale*.
   - EN: "One aboard. That ties my record. Next house."

## #0012 · 1122 Ni! (H9 / I10 / R9 / C10)

**What works.** This is still the best level of the five, and I would ship its ideas unchanged:
- the cows that land and walk off
- the sentry rotation, in this order: fart, "We've already got one!", hamster and Mum
- Rodney fleeing in his sleep
- the Black Knight's armour coming off as you bonk him
- TIM on the sign
- the TOO HIGH board
- "Accounting is saying it back"

The callbacks are well judged:
- The toaster.
- The hamster line, which feeds the Mum payoff in 2199.
- The Hendersons' hedge, which item 4 of #0004 makes visible.

1. **Restore the Holy Hand Grenade joke.** "Zib asked if that meant out loud" replaced "Zib counted to five", which every reviewer asked to keep. The new line drops the film's best-known instruction. Use the version with the film's rule.
   - EN: "Count to three. Five is right out. Zib counted to five. The hold has a skylight now."
   - FR: « Comptez jusqu'à trois. Cinq, c'est exclu. Zib a compté jusqu'à cinq. La soute a maintenant une lucarne. »
2. **References to 10: give the Killer Rabbit sighting the film's own reaction.** "Why does it have a body count?" is fine, but every player who knows the film hears "Run away!" when the rabbit strikes. The saucer is fleeing to its checkpoint at that moment, so the line matches the action. Keep "Aw, a bunny!" for the approach.
   - EN: "Run away! RUN AWAY!"
   - FR: « Fuyons ! FUYONS ! » (check this against the French dub's wording)
3. **Tom's 10-delivery line isn't about Tim.** "His latest spell makes anything disappear…" could be any wizard. Use his warning from the cave scene.
   - EN: "Points at the canteen and whispers 'Look at the bones!' It's chicken night."
   - FR: « Montre la cantine du doigt et chuchote : "Regardez les os !" C'est soirée poulet. »
4. **The second sentence of the coconut text is filler** ("These two have never stopped for hay."). Use the film's debate about how coconuts reached England, which links to the swallow on the next shelf.
   - EN: "Coconut halves. Horse sold separately. Nobody can explain how they got to England. The swallow refuses to comment."
   - FR: « Demi-noix de coco. Cheval vendu séparément. Personne ne sait comment elles sont arrivées en Angleterre. L'hirondelle refuse de commenter. »
5. **Nit: the Grenade is still called pin-in.** The route text and art still say "pin-in", while the catalogue says it went off. With item 1 the story is clear (Zib pulled the pin), so keep the pull ring in the art and drop "pin-in" from the route row.

## #0013 · 1953 The War of the Colds (H8 / I10 / R10 / C9)

**What works.** The title is now a joke and says the film's ending outright. The level design is complete:
- the sneeze with its "Ah… ah…" wind-up across a marked shortcut
- the 3-D glasses in the front rows
- the leg propping up Grandpa Doyle's coop, with the rusty strut on L1
- Sylvie's scream, Matt's biscuits and Clive's Geiger counter

These references now land, each one in its own line:
- the probe eye
- the cylinder
- "the Martians lose to germs" on the reel
- the pastor's white flag
- the church refuge

1. **The thermometer first clear is muddled in English, and this is the review's most important fix.** "Temperatures: none by mouth, in front of a full drive-in. I told Compliance we had no idea." asks the player to work out what "none by mouth" means. It then ends on a line that only makes sense if you remember the L6 memo. The FR line (« Par derrière, devant un drive-in bondé ») says it plainly and is funnier. Keep the arbitration's ingredients (Grandpa Doyle, the full drive-in, Compliance) and say "from behind" outright. Both versions fit the 135-character budget.
   - EN (124 characters): "Borrowed Grandpa Doyle's brass thermometer. From behind. In front of a full drive-in. Compliance still thinks humans made it up."
   - FR: « Thermomètre en laiton de papy Doyle. Par derrière. Devant un drive-in bondé. La Conformité croit encore que les humains l'ont inventé. »
   - The ending squares the shipped L6 memo ("we're insulted by their other theories"). The humans' probe theory turns out to be Vrell.
2. **Sylvie's 3-delivery line belongs to nobody.** "A child asked if the real invasion would be back for the matinee." is about a child the player never meets. Tie it to Sylvie's scream instead.
   - EN: "Screamed when she saw the probe. Screamed again when she saw the form."
   - FR: « A hurlé en voyant la sonde. Puis encore en voyant le formulaire. »
3. **Clive's second mumble isn't a joke** ("The rock has a pulse."). Pay off his sleep excuse, the staring contest with the Martian eye.
   - EN: "It blinked first… I win…"
   - FR: « Il a cligné en premier… j'ai gagné… »
4. **Matt's 3-delivery line has no punchline** ("Three fingers and a very firm grip."). Give him a light probe joke in character.
   - EN: "Blessed our probe. Lab 4 says it's never worked better."
   - FR: « A béni notre sonde. Le labo 4 dit qu'elle n'a jamais aussi bien marché. »

## #0014 · 2199 Your Town Is in the Way (H9 / I9 / R9 / C10)

**What works.** The finale's arcs all pay off, and each beat is in its own moment:
- Bubbles' "So long…"
- Mum and "adequate"
- PENSION VESTED filed in LATER, then "It has a POOL."
- Krix's pen hovering over "Received"

These lines are quotable as they stand:
- "Then they zoomed out"
- "In my experience that's a weapon"
- "verse 1 of 300"
- "Kindly vacate by half past eight"
- "He got to the second stanza"

1. **"Mostly harmless" contradicts itself, and Penny has three star-rating jokes.**
   - The guide's catalogue gives Grimsby's entry as "Mostly harmless", in full. Penny's 10-delivery line says "Mostly harmless. Grimsby: less so."
   - The guide screen shows ★☆☆☆☆, and her 3-delivery line is also a star rating.
   - Keep the catalogue, the screen and the 3-delivery line, and give the 10-delivery line a different hitchhiking joke.
   - EN: "Thumbs a lift off every saucer that passes. Ours has started taking the long way round."
   - FR: « Fait du stop à chaque soucoupe qui passe. La nôtre a commencé à faire le détour. »
2. **Moe is missing Marvin's best-known line.** "An unexpected lift. How disappointing." is mild. The robot's most-quoted line fits a robot being moved in his sleep.
   - EN: "Life. Don't talk to me about life."
   - FR: « La vie… Ne me parlez pas de la vie. » (check this against the French edition's wording)
3. **Ideas to 10: the finale's rooms have no film gag, while 1122 and 1953 have three each.** Both fixes below are cosmetic and reuse hooks the docs already specify.
   - **Moe sulks on bonks.** Reuse the Black Knight's per-bonk mumble rotation (latest line kept, normal speech cadence), with no physics change.
     - EN: "Ow." → "That's all right. I'm used to it." → "Don't pretend you care."
     - FR: « Aïe. » → « Ce n'est rien. J'ai l'habitude. » → « Ne faites pas semblant de vous en soucier. »
   - **Penny hitchhikes in her sleep.** On the first upward crossing of 55/100 wake, she sticks out a thumb at the exit for half a second. Use a pose like Rodney's tell, with no body push and no change to the wake rules.
4. **Artie's 3-delivery line is flat** ("It parked on his rhubarb."). Add a beat that ties it to the poetry guards.
   - EN: "Complained that the demolition fleet parked on his rhubarb. The fleet replied. In verse."
   - FR: « S'est plaint que la flotte de démolition s'était garée sur sa rhubarbe. La flotte a répondu. En vers. »

## Continuity checks that passed

These are only facts I checked; none needs a change:
- The 1953 cover story "Fever log filed. Adopted as Form 7-B." matches the shipped L6 memo and the "Brass thermometers since 1953" lines. No era first clear names a next date (D7).
- The Mum thread runs from the 1122 hamster line to the 2199 first clear (D5). The parking ring goes from "waitlisted, behind Bubbles" (`src/i18n/en.ts:518`) to "It has a POOL." The tip at `en.ts:316` sets up the pool.
- Bubbles' note answers L5's "Someone has been coaching her" (`en.ts:981`) and still reads cold.
- Gary's counts are consistent: caught four times in #0004, eleven on the new Maple Court lasers, and the record-books `garyFail` line. No other Gary "eleven" remains in the era docs.
- D1's references (DON'T PANIC, 42, the towel, the fish) appear only in 2199.
- The retired "Tuesday" gag doesn't appear in any doc.
- The gnome postcards (dial order, gated on the find) cover all three eras and work in either order.
