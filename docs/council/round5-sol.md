# Night Shift council review · Round 5 · Sol

| Level | Humour /10 | Ideas /10 | References /10 | Callbacks /10 |
| --- | ---: | ---: | ---: | ---: |
| #0003 · Baker Mabel’s First Batch | 9 | 9 | 10 | 10 |
| #0004 · While the Hendersons Are Away | 10 | 10 | 10 | 10 |
| #0012 · 1122 · Ni! | 10 | 9 | 10 | 10 |
| #0013 · 1953 · The War of the Colds | 10 | 10 | 10 | 9 |
| #0014 · 2199 · Your Town Is in the Way | 10 | 9 | 10 | 10 |

The closest thing to a release blocker is the Ticket loft. The revised dozer catches a saucer parked in the middle, but a player following the marked approach can complete the lock on the near edge with the lamp running. I checked the current drafts against the settled decisions, the four arbitrations and the shipped copy. The flight findings use the design coordinates and the production detector geometry. Room and whole-shift behaviour still need the playable greyboxes. [Story decisions](../story/decisions.md) · [Round 4 arbitration](round4-arbitration.md)

## #0003 · Baker Mabel’s First Batch

1. **Ideas · The marked way around the gate can switch the lamp on.** A straight leg from spawn to the stated west verge at (140, 910) spends about 261 px in the trigger circle. Even at top speed that is 0.61 s, enough to arm the lamp after 0.40 s. A beginner doing what the prompt says sees the light turn on. The direct line from the verge to the recommended Stockroom door also cuts back through the trigger. Give the fork an actual route around the lamp. Keep the existing handprint cue on the first arm. [Flight layout and prompt](../GDD-11-onramp.md#flight) · [Porch arming](../../src/flight/hazards.ts#L743)

   - EN spec “Mark the west detour from the fork via (140, 1250) and (140, 520). Keep the route on the verge until it is north of the gate light. Branch to either ring above the light.”
   - FR spec « Baliser le détour ouest depuis la bifurcation par (140, 1250) et (140, 520). Longer le bas-côté jusqu’au nord de la lampe du portail, puis bifurquer vers l’un ou l’autre accès. »

2. **Ideas · The bakery’s performance goals need the par-only wording.** The live deep memo says delivery is due before sunrise and describes Night owl as time to spare. The bakery has no deadline and scores elapsed time against par. Name Mabel in the first goal and give the player the actual time target in the third. [Clock and proof](../GDD-11-onramp.md#clock-and-proof) · [Memo goal selection](../../src/ui/memo.ts#L205)

   | Goal | EN | FR |
   | --- | --- | --- |
   | Delivered | {star} — bring Mabel aboard | {star} — embarquer Mabel |
   | Night owl | {star} — finish in {time} or less | {star} — terminer en {time} maximum |

3. **Humour · “Another pie” can be the player’s first pie.** The repeat cue means a repeat delivery. A player who skipped the detour on their first clear can still get this line when they bring in their first pie. The note is the punchline. [Pickup line](../GDD-11-onramp.md#L134) · [Report priority](../../src/ui/report.ts#L129)

   - EN “There’s a note under the pie. ‘Bring back the tin.’”
   - FR « Il y a un mot sous la tarte. “Rendez le moule.” »

## #0004 · While the Hendersons Are Away

I would ship the design and copy as written. Pruitt’s page turn makes the timing readable, and Gary’s four catches explain themselves in the photo strip behind his laser. The two routes introduce distinct skills while the gnome gets a quiet arc of his own. The Maple Court warning about Pruitt works for an imported save as well as for a player who just flew past her. [Birch Lane design and copy](../GDD-11-onramp.md#0004--while-the-hendersons-are-away) · [Maple Court handoff](../GDD-11-onramp.md#L41)

## #0012 · 1122 · Ni!

1. **Ideas · The cow lands in the shortcut without getting in the way of a fast saucer.** The first marked line spends about 0.45 s in the live circle at top speed. Even a centre hit across the full 216 px diameter lasts only 0.50 s against a 0.83 s fuse. A player arriving with a clear fuse can fly through the landed cow at speed and lose nothing on that route. Make the cow’s body give a normal flight bump for the short landing beat. The sentry still handles the initial beeline and the rabbit still handles a slow approach to its cave. [Shortcut and cow barrage](../GDD-12-1122-grail.md#L43) · [Existing circular bump](../../src/flight/hazards.ts#L768)

   - EN spec “Run each shortcut’s ruts through its cow mark. During the live landing beat, use the existing circular flight bump on the cow’s body. Keep the 108 px detector and its tell. Release the bump and the detector together when the cow walks off. Leave the bank detours open.”
   - FR spec « Faire passer les ornières de chaque raccourci par son point de chute. Pendant la phase active, utiliser le choc circulaire de vol existant au contact du corps de la vache. Garder le détecteur de 108 px et son signal. Désactiver le choc et le détecteur ensemble quand la vache quitte le passage. Laisser les détours par les berges ouverts. »

## #0013 · 1953 · The War of the Colds

1. **Callbacks · The French report names the clinic form differently.** The shipped clinic calls it **Cerfa 7-B** in the memo, HUD and first-clear report. The 1953 cover says **formulaire 7-B**, and “filed as” makes it sound as though the form already existed. Say that the fever log became the form. Vrell’s first-clear thermometer line and the queue’s new staging already land the reveal. [1953 cover story](../GDD-13-1953-tripods.md#L145) · [Shipped French clinic memo](../../src/i18n/fr.ts#L241) · [Shipped French first clear](../../src/i18n/fr.ts#L973)

   - EN “The fever log became Form 7-B. Compliance classified the method.”
   - FR « Le relevé est devenu le Cerfa 7-B. La Conformité a mis la méthode sous scellés. »

## #0014 · 2199 · Your Town Is in the Way

1. **Ideas · The Ticket loft still has a permanent opening on the near edge.** At (1316, 675), the saucer is 46 px from the ring centre and can lock. The dozer’s straight passes reach at most `148 × sin(0.30) ≈ 43.7 px` to either side. Its south turn sweeps west, and the north turn is out of reach of the entire line from the east turnout to that hover point. Keep the revised patrol and widen the lamp enough to make the whole usable ring a timing decision. I sampled a 195 px range and 0.80 rad half angle at 5 ms intervals across the lock disc. They give about 1.11 s of simultaneous exposure, 4.56 s with the entire ring clear, and no exposure in the sampled 48 px turnout pocket. Verify the approach and departure with the actual saucer controls. [Ticket loft and dozer](../GDD-14-2199-hitchhiker.md#L41) · [Torch origin and turn](../../src/flight/photographer.ts#L129) · [Lock radius](../../src/flight/sim.ts#L155)

   - EN spec “Keep the new dozer patrol and turnout. Set the lamp to 195 px range and 0.80 rad half angle. Check that every point in the 48 px Ticket loft lock disc is exposed together for longer than the Hush Drive fuse, then verify a clean approach, hover and exit in the shared clear window.”
   - FR spec « Garder le nouveau trajet du bulldozer et la zone d’attente. Régler le phare à 195 px de portée et à 0,80 rad de demi-angle. Vérifier que tout le disque de verrouillage de 48 px est exposé en même temps plus longtemps que le délai du Moteur Feutré, puis vérifier une approche, un survol et une sortie pendant l’accalmie commune. »

2. **Ideas · Give the memo the fleet’s deadline.** The star table and demolition report use the right event. The shared memo still tells deep-shift players to deliver before sunrise and save some of the night. The sky stays dark in 2199, and the fleet’s countdown is the threat the player has to read. Use the same event in the memo’s first and third goals. [Finale clock and stars](../GDD-14-2199-hitchhiker.md#the-clock-and-the-stars) · [Shipped memo goals](../../src/i18n/en.ts#L392)

   | Goal | EN | FR |
   | --- | --- | --- |
   | Delivered | {star} — file all three before demolition ({time}) | {star} — recenser les trois habitants avant la démolition ({time}) |
   | Night owl | {star} — {time} to spare before demolition | {star} — {time} de marge avant la démolition |

The towel hint, recital, ear fish and answer display each get their own beat. Krix’s bill is readable before the toaster pops, and Bubbles’ finprint gives the pool reveal a clear owner. Mum’s line and Vrell’s LATER drawer can land at their own pace. [Finale copy and panels](../GDD-14-2199-hitchhiker.md#season-finale)
