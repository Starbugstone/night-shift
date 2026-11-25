# Council review, round 2: Claude Opus

Reviewer: Claude Opus. This is a fresh read of the docs as revised in commit 53deeb7:
- `docs/GDD-11-onramp.md`
- `docs/GDD-12-1122-grail.md`
- `docs/GDD-13-1953-tripods.md`
- `docs/GDD-14-2199-hitchhiker.md`

I checked them against:
- `docs/story/decisions.md` (D1–D7 and the callbacks rule)
- `docs/council/round1-*.md`
- `docs/GDD-6-story.md`
- `docs/GDD-10-1955.md`
- the live copy in `src/i18n/en.ts`

This was a read-only review. I edited no game file.

## Scores

| Level | Humour | Ideas | References | Callbacks |
| --- | :-: | :-: | :-: | :-: |
| #0003 Baker Mabel's First Batch | 8 | 8 | 10 | 9 |
| #0004 While the Hendersons Are Away | 8 | 8 | 10 | 8 |
| 1122 Ni! | 9 | 9 | 9 | 9 |
| 1953 The War of the Worlds | 8 | 9 | 8 | 9 |
| 2199 Your Town Is in the Way | 8 | 9 | 9 | 9 |

**Overall.** The revision fixed what round 1 asked for. The 1953 sick tripod sneezing at a drive-in that claps for it is now the strongest single idea of the five, up from the weakest.

Most of what keeps the scores under 10 is single lines:
- Some lines describe instead of landing a punchline.
- Some jokes cover the same ground as another line in the same level, or name the same subject twice.
- A few callbacks only make sense if you remember the earlier level.

Every fix below swaps one line or one piece of scenery. None adds a system, a cast member or a level. In each level the fixes are listed most important first.

---

## #0003 · Baker Mabel's First Batch (H8 / I8 / R10 / C9)

The generic, character-led tone is right. Keep these:
- the cherry pie
- "Crumb opened on time…"
- BAKER'S BUNS
- "needed another ten minutes"
- the sourdough starter

1. **Zib's launch line doesn't land.** "I've got one thing going for me and it's motion" trips over its own logic.
   - EN: "Motion light. Brilliant. I'm a flying saucer. Moving is my whole personality."
   - FR: « Un détecteur de mouvement. Génial. Je suis une soucoupe volante. Bouger, c'est toute ma personnalité. »
2. **Mabel's mumble isn't a joke.** "Charge extra. Call it crust…" reads as a stray thought. A pun works here, and the French version gets a pun of its own (*levée* means both "risen" and "out of bed").
   - EN: "I knead five more minutes…"
   - FR: « Encore cinq minutes… je suis pas encore levée… »
3. **The pie's catalogue text is unclear.** In "The Bureau failed it for having too many fingerprints", it isn't clear what was failed. Use the cartoon image of steam that beckons, which the map art can also draw.
   - EN: "Cherry pie. Its steam curled into a little finger and beckoned. Zib followed it by the nose."
   - FR: « Tarte aux cerises. Sa vapeur s'est enroulée en petit doigt et a fait signe. Zib l'a suivie par le bout du nez. »
4. **Mabel's 10-delivery line is weak.** "A hundred grams of holes" asks the reader to work it out. Use the Bureau's complimentary biscuit from GDD-6, which also works cold.
   - EN: "Tried our complimentary biscuit. Sent it back. Called it a cracker with ambitions."
   - FR: « A goûté notre biscuit offert. L'a renvoyé : "un cracker qui se prend pour un sablé." »
5. **Show the Larry callback on screen (Callbacks to 10).** Put a paper bag marked **LARRY** on the counter in the stockroom room art, typeset in the view. The archive line about his breakfast roll then pays off something the player has already seen. The bag is scenery: no collision, no wake.
6. **Ideas to 10, as free scenery.** Let the dough rise over its bowl while the player is in the room (a sprite scale, held still in reduced motion). When Mabel is lifted, leave a floury outline of her on the bench. This shows "asleep before the bread" instead of telling it.

## #0004 · While the Hendersons Are Away (H8 / I8 / R10 / C8)

Keep these:
- "extension without planning permission"
- the BOLTS biscuit tin
- Len's "storage"
- the gnome's window seat
- "Tomorrow he's trying the bus"
- the plastic fern

1. **The memo's "Their garden gnome" points at the wrong people.** The nearest name is Mrs. Pruitt, so it reads as her gnome.
   - EN: "The Hendersons left their garden gnome behind. He's sulking by Len's east drive."
   - FR: « Les Henderson ont oublié leur nain de jardin. Il boude près de l'allée est de Len. »
   - The `memoHint` (`garden gnome` / `nain de jardin`) stays the same.
2. **The level breaks the 2–3 running-joke cap.** Pruitt, Gary and the gnome arc all start here, and the Gazette adds Doyle's slipper as a fourth. The slipper is already in #0003's window as art.
   - EN Gazette: **MRS. PRUITT REPORTS SAUCER FOR 37TH TIME. FIRST TIME SHE'S RIGHT.**
   - FR Gazette: **MME PRUITT SIGNALE UNE SOUCOUPE POUR LA 37E FOIS. ET CETTE FOIS, C'EST VRAI.**
3. **The 2199 gnome postcard misfires.** "Home. The Hendersons didn't notice." is set 175 years later, so it reads as a dark joke about the Hendersons being dead. It also ignores what happens in 2199.
   - EN: "The future. Nearly a road. Saved by paperwork. Typical."
   - FR: « L'avenir. Presque une autoroute. Sauvé par la paperasse. Typique. »
4. **Zib's launch line describes the scene.** "She's opened a fresh page. I can hear the binder rings." Use one that introduces Pruitt as a character.
   - EN: "Binoculars and a binder. Vrell, I think she's one of us."
   - FR: « Des jumelles et un classeur. Vrell, je crois qu'elle est des nôtres. »
5. **Len's 3-delivery line is convoluted** (the oiled door and the missed delivery). Tie it to his bicycle bell.
   - EN: "Serviced the saucer while in the hold. It now has a bell. Nobody knows where he got the bell."
   - FR: « A révisé la soucoupe pendant le trajet. Elle a maintenant une sonnette. Personne ne sait d'où elle sort. »
6. **Show Gary's catch count (Ideas and Callbacks).** Next to the garage alarm panel, add scenery of a strip of four flash photos, each of Gary caught in the beam. That makes "four times" visible, and L3's "eleven" builds on it. The strip is art only, with no text.
7. **Continuity nit.** The shipped `garyFail` line (`src/i18n/en.ts:939`) says "In eleven years Gary's system has caught Gary eleven times and you once." That now clashes with four catches here and eleven on the new L3 laser a few nights later.
   - EN: "{by}. Gary's system has caught Gary eleven times and you once. You're in the record books. Gary's."
   - Match the French string to it.

## 1122 · Ni! (H9 / I9 / R9 / C9)

This is the closest to shipping. Its mechanics come straight out of the film: the cows, the clops, the rabbit, the armour coming off, Rodney's retreat. Keep these:
- "Count to three. Zib counted to five."
- TIM on Tom's tower sign
- "charge by the month for eternal life"
- "If the road moos, move"
- the toaster first clear
- the NONE SHALL PASS / OPENING HOURS shield
- COWS STILL DENY ALL KNOWLEDGE

1. **The Ghost cover story stacks a second reference.** "Silent knight" is a Christmas-carol pun on top of the film, which breaks the one-reference-per-line rule.
   - EN: "Bridge reopens. Black Knight's post 'temporarily unarmed'."
   - FR: « Le pont rouvre. Le poste du Chevalier noir est "provisoirement désarmé". »
2. **Zib's launch line gets the film wrong.** The squires bang the coconuts, not the knights. "Is that how humans flirt?" also comes from nowhere. Pay off the memo's coconut sign-off instead.
   - EN: "They don't have horses. Just coconuts. Vrell, is this what you meant by half?"
   - FR: « Ils n'ont pas de chevaux. Juste des noix de coco. Vrell, c'est ça, votre moitié ? »
3. **Rodney's 10-delivery line is aimed at the wrong target.** In "The drummer had to play it from a safe distance", the drummer is beside the point. The joke in the film is the minstrels who sing about him.
   - EN: "Commissioned a victory song. The minstrels keep adding verses about the running away."
   - FR: « A commandé une chanson de victoire. Les ménestrels n'arrêtent pas d'ajouter des couplets sur la fuite. »
4. **Tom's 3-delivery line is flat** ("Brought his own lightning for the mugshot. The flash fired back."). Use his warning about the rabbit from the film.
   - EN: "Warned the intake nurse about the rabbit. Twice. Showed her the size of the teeth with his hands."
   - FR: « A mis l'infirmière en garde contre le lapin. Deux fois. En mimant la taille des dents. »
5. **The missed-pickup line is weak** ("They seem to think the music is a challenge.").
   - EN: "No shrubbery. The knights are saying Ni to Accounting. Accounting is saying it back."
   - FR: « Pas de jardinet. Les chevaliers disent Ni à la compta. La compta répond Ni. »
6. **The Black Knight's arm text is fine but not quotable.**
   - EN: "Black Knight's arm. Spare. He says he has another one somewhere. He said that last time."
   - FR: « Bras du Chevalier noir. De rechange. Il dit qu'il en a un autre quelque part. Il a dit ça la dernière fois. »

## 1953 · The War of the Worlds (H8 / I9 / R8 / C9)

The concept is strong now:
- The Bureau's own tripod has a cold, and the crowd says "Bless you!" when it sneezes.
- The heat-ray sneeze gets an amber "Ah… ah…" before it fires.
- The tripod's missing leg props up Grandpa Doyle's coop.
- Young Pruitt takes notes in the crowd.
- The thermometer pays off once, at the first clear, as a butt joke.

References score 8 for two reasons:
- The film's best-known element, invaders beaten by germs, is only implied.
- The doc never owns the mismatch between the film's hovering machines and the tripod players expect.

1. **Zib's launch line describes the scene** ("The picture's still playing. That thing just walked out in front of it."). Use it to own the hover-versus-legs mismatch and the sick joke in one go.
   - EN: "In the film they hover. Ours has legs. Well. Two."
   - FR: « Dans le film, ils flottent. Le nôtre a des pattes. Enfin. Deux. »
2. **Make the germs ending explicit, once, on the invasion reel.** The current reel text (an usher announcing a fire) is weak.
   - EN: "Invasion reel, the last one. Spoiler: the Martians lose to a cold. Vrell won't let us show it at the Bureau."
   - FR: « Bobine de l'invasion, la dernière. Attention, divulgâchage : les Martiens perdent contre un rhume. Vrell interdit de la projeter au Bureau. »
3. **Rookie Vrell is a visual nobody will notice.** Add one Zib bark when Zib first gets near the queue, in `FLIGHT_BUBBLES` and timed with `readSeconds()`.
   - EN: "Is that… Vrell? With a clipboard? Of course it's Vrell."
   - FR: « C'est… Vrell ? Avec un porte-bloc ? Évidemment que c'est Vrell. »
4. **Too many sneeze jokes.** "Bless you", the seat, the handkerchief and the flag all hit the cold. Move the flag to the film's pastor.
   - EN: "White truce flag. Pastor Matt waved it at the Martians. They waved back. With the heat ray."
   - FR: « Le pasteur Matt l'a agité vers les Martiens. Ils ont fait coucou. Au rayon ardent. »
5. **The rooms lack a film gag; 1122 has three.** Give Sylvie the film's scream. On her first wake crossing above 55/100, she gives a sleep-scream mumble through the existing room speech handler. It's speech only, so the hard wake rules don't change. It also replaces her weak popcorn mumble as the line players will remember.
   - EN: "AAAAH— …oh, it's you."
   - FR: « AAAAH— …ah, c'est vous. »
6. **The heat-ray sighting line has an unclear speaker.** "Zib, it just sneezed through your seat." starts "Zib, …" but Vrell is at Dispatch. Give it to Zib.
   - EN: "A war machine just sneezed on me. Does that count as a sick day?"
   - FR: « Une machine de guerre vient de m'éternuer dessus. Ça compte comme arrêt maladie ? »
7. **Sylvie's 10-delivery line has no punchline** ("They kept shining their lights over the screen."). Use the drive-in back row, at PG-13.
   - EN: "Put the saucers in the back row. Then had to go and tell them to stop steaming up the windows."
   - FR: « A envoyé les soucoupes au dernier rang. Puis a dû leur dire d'arrêter d'embuer les vitres. »
8. **The tripod-leg cover story is flat** ("Martian hardware repurposed as farm equipment."), and it should match the coop settling in the scene.
   - EN: "Doyle coop drops two inches. Hens blame Martians."
   - FR: « Le poulailler des Doyle s'affaisse de cinq centimètres. Les poules accusent les Martiens. »
9. **The repeat-pickup line is too clever** ("Try finding a left one in the parts catalogue.").
   - EN: "You brought the leg back. The tripod has stopped limping and started complaining."
   - FR: « Vous avez rapporté la patte. Le tripode a arrêté de boiter et commencé à se plaindre. »
10. **The three-colour lens line is abstract** ("Shows every frequency except the one in which this was a good idea.").
    - EN: "Three-colour Martian lens. Red means stop. Green means go. Blue means it's already behind you."
    - FR: « Lentille martienne tricolore. Rouge, on s'arrête. Vert, on passe. Bleu, il est déjà derrière vous. »

## 2199 · Your Town Is in the Way (H8 / I9 / R9 / C9)

The finale's structure works. Bubbles leaving with "So long, and thanks for all the fish" is the best payoff of the season. Keep these:
- the petunias' "Oh no, not again"
- "His house was in the way. Then they zoomed out"
- "He's opened a book. In my experience that's a weapon"
- "Brain the size of a planet. They want me to nap"
- the 42 answer display
- the RECEIVED stamp
- RUBBLE ENTERS PUBLIC CONSULTATION
- "It has a POOL."

1. **The poem isn't bad enough.** The joke with this poetry is that it's dreadful, and "O demolition, sweet and free" is a clean, competent couplet. Number the verse as well, so the threat sets up "He got to the second stanza".
   - EN: "Ode, verse 1 of 300: / O squat and crumbly house of brown, / I'll pave you flat. And all the town."
   - FR: « Ode, strophe 1 sur 300 : / Ô maison trapue et marron, / je t'aplatis. Et le canton. »
2. **The Krix-billed gag appears three times.** It's in L8's epilogue ("billed him for the bone"), in this first clear and again in panel 1. Cut it from the first clear and let panel 1 show it, with Krix's pen hovering over "Received". D5 is kept.
   - EN: "Three residents. Grimsby stays. Your mother called, Zib. I told her: adequate."
   - FR: « Trois habitants. Grimsby reste. Votre mère a appelé, Zib. Je lui ai dit : convenable. »
3. **Bubbles' note "Nobody taught me." is cryptic cold.** It answers L5's "Someone has been coaching her" (`src/i18n/en.ts:981`), but only for players who remember that line.
   - EN: "Nobody coached me. I'm just that good."
   - FR: « Personne ne m'a entraînée. Je suis douée, c'est tout. »
4. **Penny's three dossier lines are all hitchhiking jokes.** Keep the driving test (description) and the roundabout (10-delivery line). Replace the 3-delivery line.
   - EN: "Hitched a lift on our saucer. Gave it two stars. Docked one for the probe."
   - FR: « A fait du stop sur notre soucoupe. Deux étoiles. Une de moins pour la sonde. »
5. **Put the Guide's most famous verdict on Penny's guide book.**
   - EN: "Pocket travel guide. Grimsby's entry reads, in full: 'Mostly harmless.' The author was trying to leave when she wrote it."
   - FR: « Guide de voyage de poche. L'entrée sur Grimsby dit, en entier : "Globalement inoffensive." L'autrice essayait de partir quand elle l'a écrite. »
6. **Artie's lines don't draw on the film.** He is Arthur Dent with tea and nothing else.
   - Description ("Filed a noise complaint about the teaspoon"), replace:
     - EN: "Asked our machine for tea. Got something almost, but not quite, entirely unlike tea."
     - FR: « A demandé du thé à notre distributeur. A obtenu un liquide presque, mais pas tout à fait, entièrement différent du thé. »
   - 10-delivery line ("bin day"), replace:
     - EN: "Still in the dressing gown. Says he'll change when the universe makes sense."
     - FR: « Toujours en robe de chambre. Il se changera quand l'univers aura un sens. »
7. **The towel's catalogue line misses the towel joke the finale is meant to own (D1).** The current line is "Under 'destination' somebody wrote 'away'."
   - EN: "The most useful thing a traveller can carry. Zib has used it as a cape, a pillow and a white flag. All tonight."
   - FR: « L'objet le plus utile qu'un voyageur puisse emporter. Zib s'en est servi comme cape, oreiller et drapeau blanc. Cette nuit. »
8. **The dozer sighting is a generic wordplay line** ("signals for the turns"). Tie it to Artie.
   - EN: "Artie lay down in front of one of those. I'm not lying down in front of anything."
   - FR: « Artie s'est couché devant un de ces engins. Moi, je ne me couche devant rien. »
9. **The Ghost cover story is limp** (POETRY GUARDS REPORT PERFECT SILENCE).
   - EN: **POETRY GUARDS PERFORM TO EMPTY TOWN. BEST RECEPTION YET.**
   - FR: **LES GARDES-POÈTES JOUENT DEVANT UNE VILLE VIDE. LEUR MEILLEUR ACCUEIL À CE JOUR.**
10. **Gary's number repeats again.** Moe's "Gary filed eleven pages" adds another eleven to Gary's catch count and to the shipped lines that already use eleven (the marrow, the coffee).
    - EN: "Still working through Gary's CCTV complaints. He's on page four. Gary filed three hundred."
    - FR: « Traite encore les plaintes de Gary sur la vidéosurveillance. Il en est à la page quatre. Gary en a déposé trois cents. »

## Continuity checks that passed

These are only facts I checked; none needs a change:
- The 2199 "(junior)" memo qualifier matches the live `toAgent` string ("TO: Agent Zib (junior)").
- Bubbles' "Hers comes with a pool." loading tip sets up "It has a POOL."
- Young Pruitt as a child in 1953 makes her about 80 now, which fits "hasn't slept since 1994".
- Grandpa Doyle and the Route 9 drive-in match L1.
- The L6 memo ("a brass thermometer and a clipboard since 1953") sets up the 1953 first clear.
- No first-clear line names the next date (D7).
- D1's references (DON'T PANIC, 42, the towel, the fish) stay inside 2199.
