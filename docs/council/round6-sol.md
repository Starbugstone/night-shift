# Night Shift council review · Round 6 · Sol

| Work order | Humour /10 | Ideas /10 | References /10 | Callbacks /10 |
| --- | ---: | ---: | ---: | ---: |
| #0003 · Baker Mabel’s First Batch | 10 | 10 | 10 | 10 |
| #0004 · While the Hendersons Are Away | 10 | 10 | 10 | 10 |
| #0012 · 1122 · Ni! | 9 | 10 | 10 | 9 |
| #0013 · 1953 · The War of the Colds | 9 | 10 | 10 | 10 |
| #0014 · 2199 · Your Town Is in the Way | 9 | 9 | 10 | 10 |

## Round-five fixes

- **#0003–#0004.** The bakery’s marked legs miss the trigger by at least 50 px. The memo gives the 56 s par and the pie note works on a first pickup. No new Hendersons changes. Gary’s photo strip pays off the memo and Pruitt’s binder earns its own punchlines. [Birch Lane design](../GDD-11-onramp.md#flight)
- **1122.** Both ruts cross live cow body bumps, with the bank detours open. The company-car opener names the shells in frame at the empty hitching rail. [Flight and launch](../GDD-12-1122-grail.md#flight)
- **1953.** The fox headline fits the coop drop, the clapper belongs to the Division, both hints are lowercase, and the fever log becomes Form 7-B / Cerfa 7-B. The clapper’s “Half the Division” echo adds a closing-time joke. [Evidence Locker and lines](../GDD-13-1953-tripods.md#evidence-locker)
- **2199.** The memo names demolition, the opener introduces weaponised books from the fork, and the Gazette trades the rubble joke for hitchhiking witnesses. The new airlock line works after any completed verse. All five memo hints match in both languages. The gnome’s postcards, thermometer, Mum, toaster and pool each deliver a distinct payoff. [Finale copy](../GDD-14-2199-hitchhiker.md#copy)

## 1122 · Two shelf lines

- **Humour.** The new company-car line spends the missing-horse joke at launch. “Horse sold separately” spends it again on the coconut shelf. Keep the migration joke. **EN** “Nobody can explain how these got to England. The swallow refuses to comment.” **FR** « Personne ne sait comment elles sont arrivées en Angleterre. L’hirondelle refuse de se prononcer. » [Coconut halves](../GDD-12-1122-grail.md#evidence-locker)
- **Callbacks.** The pickup board says **TOO HIGH**, then the shelf says the same knights want it higher. Give the Hendersons’ hedge a fresh job. **EN** “The knights are interviewing replacements. Nobody tell them about the Hendersons’ hedge.” **FR** « Les chevaliers cherchent un remplaçant. Que personne ne leur parle de la haie des Henderson. » [Shrubbery](../GDD-12-1122-grail.md#evidence-locker)

## 1953 · Gate the fox headline

**Humour.** The cover-story instruction says to use the fox line on repeat runs. A repeat that leaves the leg in place can then say the coop lost it. **EN** “After the first clear, use the fox cover story only on a delivery with the tripod leg aboard.” **FR** « Après la première réussite, utilisez la brève sur le renard uniquement si la livraison ramène aussi la patte de tripode. » [Report instructions](../GDD-13-1953-tripods.md#lines)

## 2199 · Keep the quay rail clear

- **Ideas.** Ticket loft’s arithmetic holds. The whole 48 px disc is lit from chassis y = 510 to 590.09, giving 1.112 s against the 1.00 s Hush Drive fuse. Sampling the production cone geometry every 0.1 ms gave any overlap from 0.1945 to 3.1875 s of the 7.5556 s cycle, leaving 4.563 s clear. The turnout and Service door discs stay clear. But at the advertised quay crossing **(1270, 250)** the widened lamp catches a stationary saucer for **1.102 s**, enough even with Hush Drive. Its northern reach is y = 187. **EN** “Move the quay rail to y = 130. Approach Side returns via (1490, 130) → (1080, 130) → (1080, 380), joining the same rail from the west.” **FR** « Déplacez la voie du quai à y = 130. Rejoignez l’accès aux retours par (1490, 130) → (1080, 130) → (1080, 380). Depuis l’ouest, empruntez la même voie. » [Flight layout](../GDD-14-2199-hitchhiker.md#flight) · [Production lamp geometry](../../src/flight/photographer.ts#L129)
- **Humour.** “One more stanza” can still fire before a verse. The opener holds the opening recital back, and the side lecterns have no scripted verses. **EN** “I’ll take my chances in the airlock.” **FR** « Je préfère tenter ma chance dans le sas. » [Recital cues](../GDD-14-2199-hitchhiker.md#poetry-guards-and-the-demolition-dozer)

Geometry checked against the written coordinates and production detector rules. The pointer approach, braking and departure remain greybox checks.
