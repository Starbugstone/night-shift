# Council round 4: comedy writing and visual gags (Fable)

Read-only review of GDD-11 to GDD-14 as they stand after `bf3aad1`. I checked them against
`docs/story/decisions.md`, the three earlier rounds and their arbitrations, and the shipped copy in
`src/i18n/en.ts`. I did not reopen settled choices, with one exception: the 1953 first-clear line, which
is broken as written (see below).

## Scores

| Level | Humour | Ideas | References | Callbacks |
| --- | :-: | :-: | :-: | :-: |
| #0003 Baker Mabel's First Batch | 9 | 10 | 10 | 10 |
| #0004 While the Hendersons Are Away | 10 | 10 | 10 | 10 |
| 1122 Ni! | 10 | 10 | 10 | 10 |
| 1953 The War of the Colds | 9 | 9 | 10 | 9 |
| 2199 Your Town Is in the Way | 9 | 10 | 10 | 10 |

Fifteen of twenty scores are at 10. The five below 10 come down to six line swaps, and no fix touches
geometry, cast or systems. The only one that matters is the 1953 first clear: it is the single payoff of
the thermometer thread, and its sentence has lost its verb.

## #0003 · Baker Mabel's First Batch

One line holds Humour at 9.

1. **Zib's motion-light line makes the player work out whose prints they are.** "Why are they taking my
   fingerprints?" needs three steps: the lamp lit a handprint, a handprint looks like fingerprinting, and
   Zib thinks it is about him. The handprint is Mabel's and it is made of flour, which is the joke the
   picture already shows. Say that.
   - EN: "Caught white-handed. And it isn't even my hand."
   - FR: « Pris la main dans le sac. De farine. Et c'est même pas ma main. »

Everything else ships: the cherry on Vrell's clipboard, "Bring back the tin", "Crumb sat in it", the
cracker with ambitions, the LARRY bag and the paw print on the OPEN sign. The cat-runs-the-shop thread
now reads as one setup (memo), one payoff (first clear) and one picture (the sign), which is within the cap.

## #0004 · While the Hendersons Are Away

I would ship this as is. One optional polish, which does not affect the score:

- **Nora's three-delivery line is the only one on her card that doesn't use her lists.** Her description
  sets up the lost list, and the line can pay it off.
  - EN: "Took the spare saucer key home for safekeeping. She says it's on the list. She won't say which list."
  - FR: « A emporté la clé de secours de la soucoupe "pour la mettre en sécurité". Elle dit que c'est noté
    sur la liste. Elle ne dit pas laquelle. »

## 1122 · Ni!

I would ship this as is. Every film anchor has its own moment, the Black Knight's three bonk lines land,
and "Is that a species correction? I'll need a form." is a better Bureau gag than the line it replaced.

- **One check before the French is locked.** Zib is alone when he says « Fuyez ! Fuyez ! », and that is an
  order to someone else. « Fuyons ! Fuyons ! » includes the speaker. I could not confirm the French dub's
  wording from here, so the round-3 instruction to check it still stands. If the dub does not settle it,
  use « Fuyons ! Fuyons ! ».

## 1953 · The War of the Colds

1. **The first-clear line has no verb, so "From behind" attaches to "Borrowed"** (Humour 9, Callbacks 9).
   "Borrowed Grandpa Doyle's brass thermometer. From behind." reads as Vrell sneaking up on Grandpa Doyle.
   The line never says temperatures were taken, and the French has the same gap. The memo promises "what I
   did about it", so the answer has to name the act. Round 3's arbitration chose this wording, and I am
   reopening it only because the sentence fails cold. This version keeps its shape, keeps Compliance and
   still squares the shipped L6 memo. It fits the 135-character budget (128 EN, 134 FR).
   - EN: "Took forty temperatures with Grandpa Doyle's brass thermometer. From behind. Full drive-in.
     Compliance thinks humans made it up."
   - FR: « Quarante températures au thermomètre en laiton de papy Doyle. Par derrière. Drive-in complet. La
     Conformité accuse encore les humains. »
2. **"The Martians" is never pinned down** (Ideas 9). The memo says the machine out front is ours, but the
   flag, the clapper and Matt's ten-delivery line all say "the Martians" did things on the night. A player
   reading the catalogue cold cannot tell whether there was a second invasion. One line can turn that into
   a joke: the humans call us Martians. Put it on the flag, which already has the best gag.
   - EN: "**White truce flag.** Pastor Matt waved it at 'the Martians'. We're not from Mars. We waved back
     anyway. With the heat ray."
   - FR: « **Drapeau blanc.** Le pasteur Matt l'a agité devant "les Martiens". On ne vient pas de Mars. On
     lui a fait signe quand même. Au rayon thermique. »
3. **The missed-pickup line can be read backwards** (Humour). "Leave the leg. The hens have finally stopped
   laying on a slope" takes a moment to work out which state is the level one. Give it a picture.
   - EN: "Leave the leg, then. Without it, every egg rolls into the crater."
   - FR: « Laissez la patte, alors. Sans elle, tous les œufs roulent dans le cratère. »

The rest ships: "Bless you!", the 3-D line, the sick day, the bipod that "leans on things", the hatches
held shut in the queue, the biscuits and "It was for us."

## 2199 · Your Town Is in the Way

Two lines hold Humour at 9.

1. **Penny's first mumble does not decode.** "Breakfast included… if you catch it…" has no setup in the
   room or the film. She is a guide writer who cannot leave, so use that.
   - EN: "Chapter one: leaving Grimsby… chapter two: see chapter one…"
   - FR: « Chapitre un : quitter Grimsby… chapitre deux : voir chapitre un… »
2. **The memo says "towel" twice in a row and steps on the film's line.** "Always know where your towel is.
   There's a towel on the west harbour rack." reads as a repeat. Let the second sentence answer the first.
   It keeps the exact `a towel` / `une serviette` hint.
   - EN: "Always know where your towel is. There's a towel on the west harbour rack. Now you know."
   - FR: « Sachez toujours où est votre serviette. Il y a une serviette sur le portant à l'ouest du port.
     Voilà, vous savez. »

The finale panels are right: the toaster pop, the finprint, PENSION VESTED into LATER and "It has a
POOL." each get their own beat, and "Mostly harmless" now appears once.

## Continuity

- **Zib's Mum.** The 1122 hamster reply no longer mentions her. The 2199 first clear still works cold, and
  the shipped flawless-run comment (`src/i18n/en.ts:964`) already sets her up. No change needed.
- **Thermometer.** With fix 1 for 1953, the reveal agrees with the shipped L6 memo ("a brass thermometer and
  a clipboard since 1953… insulted by their other theories").
- **Era order.** No first clear names a next date. The three gnome postcards and the shrubbery's hedge
  status work whichever of 1122 and 1953 is played first.
- **Running-joke cap.** Each level stays at two or three active threads.
- **Order numbers.** #0003–#0004, #0005–#0011 and #0012–#0014 agree across the four docs and GDD-10.
