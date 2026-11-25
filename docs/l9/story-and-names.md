# Night Shift · L9 Narrative & Copy Spec (1955 Clock Tower Shift)

Design-only narrative, naming, and bilingual copy specification for **Level 9** (set **November 12, 1955, just before 10:04 PM**). Aligns with [`docs/GDD-6-story.md`](../GDD-6-story.md), [`docs/GDD-7-eras.md`](../GDD-7-eras.md), [`docs/GDD-8-map-collectibles.md`](../GDD-8-map-collectibles.md), [`docs/GDD-9-trophy-room.md`](../GDD-9-trophy-room.md), and [`docs/research/film-references.md`](../research/film-references.md).

**Tone & constraints:**
- **PG-13, leaning 16** (`AGENTS.md` v4): dry Bureau bureaucracy, mild swearing (*damn, hell, ass*), cheeky gags (manure, car-trunk mishaps, "life preserver" fashion), zero slurs, no real people mocked.
- **International legibility:** English is the primary script; French adapts the comedy and nods to the beloved French dub (*88 miles à l'heure*, *2,21 gigowatts*, *convecteur*, *Nom de Zeus*, *gilet de sauvetage*) without adding France-only premises.
- **Rights hygiene (swappable):** Built on affectionate nods by default per the coordinator's recommendation; every proper noun has an **Exact-name variant** column below so the user can toggle any name without rewriting the comedy.
- **Phone budgets (540×960 logical / 375×690 CSS px):** all UI strings are sized to match existing `src/i18n/en.ts` and `src/i18n/fr.ts` boxes (`title` ≤ 26 chars, `location` ≤ 36 chars, `blurb` ≤ 55 chars, `re` ≤ 42 chars, `body` ~220–255 chars, `joke` ~145–165 chars, `signoff` ≤ 50 chars, `ZibBubble` ≤ 85 chars, mumbles ≤ 40 chars, trophy descriptions ≤ 140 chars).

---

## 1. Name Table (Nod Defaults & Swappable Exact Variants)

All strings in Sections 3–5 use the **In-game nod** column. Switching any entry to the **Exact-name variant** is a clean find-and-replace.

| Film reference | Role / sleep excuse | In-game nod (EN) | In-game nod (FR) | Exact-name variant (EN / FR) |
| --- | --- | --- | --- | --- |
| **Dr. Emmett "Doc" Brown** | Wild-haired inventor, never surnamed. Dozed off on the clock-tower ledge waiting for the storm after rigging the cable. | **Doc** (full: `Doc`, short: `Doc`) | **Doc** (complet : `Doc`, court : `Doc`) | `Dr. Emmett "Doc" Brown` / `Doc Brown` |
| **Biff Tannen** | Local jock bully with a manure-truck grudge. Knocked out cold by one surprisingly clean punch in a diner booth. | **Buff Tanner** (short: `Buff`) | **Buff Tanner** (court : `Buff`) | `Biff Tannen` (short: `Biff`) |
| **Marvin Berry & the Starlighters** | School-dance bandleader. Locked unconscious in a car trunk out back after a scuffle with Buff's goons. | **Marvin Cherry & the Starliners** (short: `Marvin`) | **Marvin Cherry et les Starliners** (court : `Marvin`) | `Marvin Berry & the Starlighters` / `Marvin Berry et les Starlighters` |
| **Hill Valley** | 1955 American town centred on Courthouse Square. | **Crest Valley** | **Crest Valley** | `Hill Valley` / `Hill Valley` |
| **Hill Valley Courthouse Clock Tower** | Town clock tower due to be struck at 10:04 PM sharp. | **Courthouse Clock Tower** (short: `Clock Tower`) | **Horloge du Tribunal** (court : `Tour de l'horloge`) | `Hill Valley Clock Tower` / `Horloge de Hill Valley` |
| **Lou's Cafe** | 1955 malt-and-coffee shop on the square where Buff is out cold in a booth. | **Lyle's Coffee Shop** (short: `Lyle's`) | **Café Lyle** (court : `Chez Lyle`) | `Lou's Cafe` / `Café Lou` |
| **Hill Valley High School** | High school hosting the Saturday night dance. | **Crest Valley High** | **Lycée de Crest Valley** | `Hill Valley High` / `Lycée de Hill Valley` |
| **Enchantment Under the Sea** | School prom in the decorated gym (paper fish, blue crepe streamers). | **Enchantment Beneath the Waves** | **Féerie sous les flots** | `Enchantment Under the Sea` / `Féerie dansante des sirènes` |
| **DMC DeLorean Time Machine** | Timed town pickup: stainless gull-wing sports car speeding down Main St to hook the power line at 10:04. Connects back to the parked car in L2! | **Gull-wing time car** (UI pickup name: `Time car`) | **Voiture temporelle** (nom UI : `Voiture temporelle`) | `DeLorean time machine` / `La DeLorean` |
| **Flux Capacitor** | One-word gag rename for the glowing time-travel gizmo (spare souvenir on Doc's route). | **Flex Capacitor** *(alt: Fluke Capacitor)* | **Convecteur de flou** *(alt : Convecteur de flex)* | `Flux Capacitor` / `Convecteur temporel` |
| **D. Jones Manure** | Local manure-hauling truck (visual gag / alley hazard flavour). | **D. Piles Manure** | **Fumier D. Tas** | `D. Jones Manure` / `Fumier D. Jones` |
| **Marty McFly** *(offscreen only)* | Never abducted — only his abandoned 1985 gear (vest, skateboard, hazmat suit) turns up as room souvenirs. | *"the kid in the life preserver"* / *"the visitor from 1985"* | *« le gamin au gilet de sauvetage »* / *« le visiteur de 1985 »* | `Marty McFly` / `Marty McFly` |
| **Clock Tower Lady** *(offscreen flavour)* | Campaigner handing out "Save the Clock Tower!" flyers in the square. | **Clock-Tower Preservation Society** | **Comité de l'Horloge** | `Hill Valley Preservation Society` |
| *Optional room sleepers* *(if rooms use light sleepers)* | Suggested thematic sleepers for the rooms designer: diner busboy, prom chaperone, belfry owl. | **Busboy Gus** · **Miss Finch** · **Barnaby (belfry owl)** | **Gus (plongeur)** · **Mme Finch** · **Barnabé (hibou)** | *(original to Night Shift)* |

> **French dub notes:** In the famous French dub of *Back to the Future*, `88 mph` stays `88 miles à l'heure` (already used in `src/i18n/fr.ts` line 1358), `1.21 gigawatts` was famously translated as `2,21 gigowatts`, `Flux Capacitor` is `convecteur temporel`, and `Great Scott!` is `Nom de Zeus !`. Keeping `2,21` and `convecteur` in the FR copy lands the joke instantaneously for French players while staying faithful to the exact same international film.

---

## 2. Story Stitch (GDD-6, GDD-7 & L2 Continuity)

### Where L9 sits in the arc
- **Direct continuation of L8 (`Prior Contact`):** At the end of L8 (`storyFirstClear.level8`), Vrell promotes Zib to paid staff and ends with one warning: *"Don't touch the time dial."*
- **The Basement B-4 & Krix hook:** Per `docs/GDD-6-story.md`, **Temporal Dispatch (Basement B-4)** runs on **Form 88-MPH** and was mothballed in **1985** after an *"expense-report paradox."* While Legal audits Krix after L8's Patent Valley debacle, Accounting unearths why Basement B-4 was really shut down in 1985 — and why Krix's OBELISK™ shell file had a second target bookmarked: **November 12, 1955, 10:04 PM**.
- **Why Temporal Dispatch pulls off Grimsby to Crest Valley:** Normally Basement B-4 locks onto Grimsby (`GDD-7-eras.md`), which is why 1953 Mob Docks stays in Grimsby. This night, an **unlicensed 1.21-gigawatt power spike** rips the dial straight off Grimsby's coordinates and drags Zib's saucer to **Crest Valley, November 12, 1955, 10:00 PM**: a wild-haired human inventor has built a working time machine without filing Form 88-MPH, and Krix's lawyers are salivating to patent *human time travel* as prior art the second lightning hits the courthouse clock.
- **Why the Bureau sends Zib:** Head Office cannot know Vrell broke the padlock on Basement B-4 *again*. Vrell dispatches newly-salaried Zib from **10:03:40 PM to 10:10:00 PM** (before the storm passes and the Temporal Dispatch pass expires) to quietly pull three sleeping/unconscious 1955 witnesses for a standard Temporal Audit & memory-dusting:
  1. **Doc** — nodded off on the clock-tower ledge waiting for the storm after tying off his high-voltage cable.
  2. **Buff Tanner** — knocked out cold by a single shockingly tidy punch in a booth at Lyle's Coffee Shop (with manure still drying on his boots).
  3. **Marvin Cherry** — locked unconscious in a car trunk behind Crest Valley High's *Enchantment Beneath the Waves* dance after Buff's cronies jumped him.
- **The 10:04 PM set-piece & the L2 Time-Car Loop:**
  - During the flight phase, the **gull-wing time car** is the level's optional **town pickup** (`docs/GDD-8-map-collectibles.md`) — with a twist: unlike static town pickups, it **revs up, speeds down Main Street toward Courthouse Square, and connects with the power cable just as lightning strikes the clock tower at 10:04 PM**, disappearing in twin trails of fire if Zib doesn't intercept and beam it up in time.
  - **If Zib misses the car:** It hits 88 mph, rides the lightning bolt out of 1955, and scorches two flaming tracks down Main Street — closing the loop with the **L2 Spin City easter egg** (`src/i18n/en.ts:1400`, *"Scorch marks, gull-wing door, no plates. Whoever owns it is late. Or early."*): *that* is why it's sitting behind the laundromat decades later!
  - **If Zib impounds the car before 10:04:** The car goes straight into **Warehouse 4B (Field Finds Annex)**, and the lightning still blows the empty clock tower at 10:04 sharp so history's clock stops right on schedule and Accounting cancels the grid-damage invoice.
- **Dispatch placement note:** Works cleanly either as **Work Order #0009** right after L8 on the main Work Orders list, or as the flagship **1955 Temporal Dispatch** special alongside the 1953 Mob Docks chapter (`GDD-7-eras.md`, where `film-references.md` already parks a prototype tagged `EST. ARRIVAL 1955`!).

### First-clear arc line (`humor.storyFirstClear.level9`)
Written so it stays true whether the player caught **or** missed the time car on their first clear:

- **EN (136 chars):** `"Three 1955 witnesses logged and the timeline didn't implode. Bonus: Krix's lawyers can't patent time travel now. Put the dial back, Zib."`
- **FR (138 chars):** `"Trois témoins de 1955 classés et la chronologie tient bon. En prime, Krix ne pourra pas breveter le temps. Remettez le cadran à zéro, Zib."`

---

## 3. Level Metadata & Shift Memo (EN + FR)

> **Hard-rule check (`tests/flight-collectible.test.ts`):**
> - EN `memoHint`: `'gull-wing time car'` → appears verbatim in `levels.level9.joke`.
> - FR `memoHint`: `'voiture temporelle'` → appears verbatim in `levels.level9.joke`.

### English (`src/i18n/en.ts` → `levels.level9`)
- **`title`:** `Clocking Out at 10:04` *(21 chars)*
- **`location`:** `Crest Valley · Nov 12, 1955` *(27 chars)*
- **`blurb`:** `An inventor, a bully, a bandleader. One storm at 10:04.` *(55 chars)*
- **`human`:** `Doc, Buff & Marvin`
- **`collect`:** `Doc, Buff & Marvin`
- **`re`:** `Work Order #0009 — Nov 12, 1955 (10:04)` *(39 chars)*
- **`body`:** *(244 chars)*
  > `Basement B-4 tripped a 1.21-gigawatt alarm in 1955. Someone built a time machine without Form 88-MPH. Grab Doc off the clock tower, Buff from Lyle's Coffee Shop and Marvin Cherry behind the school dance. Be out by 10:10, when the storm passes.`
- **`joke`:** *(153 chars — contains `gull-wing time car`)*
  > `A gull-wing time car is due at the clock tower at 10:04 sharp. Wait at the west turnout, then match its speed to impound it before the lightning hits.`
- **`signoff`:** `— Vrell. I told you to leave the dial alone.` *(44 chars)*

### Français (`src/i18n/fr.ts` → `levels.level9`)
- **`title`:** `Fin de quart à 22 h 04` *(22 chars)*
- **`location`:** `Crest Valley · 12 nov. 1955` *(27 chars)*
- **`blurb`:** `Un savant, une brute, un guitariste. Orage à 22 h 04.` *(53 chars)*
- **`human`:** `Doc, Buff et Marvin`
- **`collect`:** `Doc, Buff et Marvin`
- **`re`:** `Ordre n°0009 — 12 nov. 1955 (22 h 04)` *(37 chars)*
- **`body`:** *(237 chars)*
  > `Le sous-sol B-4 a bipé sur un pic de 2,21 gigowatts en 1955 : un humain voyage dans le temps sans Cerfa 88-MPH. Embarquez Doc sur l'horloge, Buff au Café Lyle et Marvin Cherry derrière le bal. Filez avant 22 h 10, quand l'orage passe.`
- **`joke`:** *(142 chars — contains `voiture temporelle`)*
  > `Une voiture temporelle file vers l'horloge à 22 h 04 pile. Guettez-la à la sortie ouest, puis suivez son allure pour la saisir avant la foudre.`
- **`signoff`:** `— Vrell. J'avais dit : pas touche au cadran.` *(44 chars)*

### Performance Goals (`crestValley` + `memo.deepGoals[1]`)
L9 replaces all sunrise/dawn wording with the 10:10 storm deadline and 10:04 time-car window:
- **EN:**
  - `Delivered all 3 — by 10:10`
  - `Ghost — never spotted, no failed jobs`
  - `Night owl — {time} to spare`
  - `Time car — bonus, before 10:04`
- **FR:**
  - `Les 3 livrés — avant 22 h 10`
  - `Fantôme — jamais repéré, aucun échec`
  - `Oiseau de nuit — {time} de marge`
  - `Voiture temporelle — bonus avant 22 h 04`

### Bonus Loading Tip (optional `loading.tierTips.afterL8`)
- **EN:** `'Tip: if a stainless car hits 88 mph in a thunderstorm, step aside. Our hull insurance stops at 85.'`
- **FR:** `'Astuce : si une voiture en inox atteint 88 miles à l’heure sous l’orage, écartez-vous. Notre assurance plafonne à 85.'`

---

## 4. In-Game Copy: Zib, Vrell, Sleepers, Routes & 1955 Tabloid

### 4.1 Zib flight lines (`humor.deepZib`)
All lines ≤ 85 chars for crisp 1–2 line wrapping in the 340 px `ZibBubble`:

| Trigger | English (`en.ts`) | Français (`fr.ts`) |
| --- | --- | --- |
| **`start9`** *(shift opener)* | 1. `"1955! Where we're flying, we don't need roads—just the west turnout!"`<br>2. `"Nov 12, 1955! Three witnesses—and intercept that time car from the west turnout!"` | 1. `"Nom de Zeus, 1955 ! Là où on vole, pas besoin de route. File à l'ouest, Zib !"`<br>2. `"12 nov. 1955 ! Trois témoins — et coupe la route à la voiture par l'ouest !"` |
| **`timeCarWarn`** *(engine revving / staging before the run)* | 1. `"Hear that engine? Take the west turnout and meet it up the road!"`<br>2. `"Headlights revving! Cut through the west turnout to intercept it!"` | 1. `"Tu entends ce moteur ? Coupe-lui la route par la sortie à l'ouest !"`<br>2. `"Les phares s'allument ! File par l'ouest pour lui couper la route !"` |
| **`timeCarLaunch`** *(accelerating toward 88 mph)* | 1. `"It's flooring it! Match its speed before 10:04!"`<br>2. `"Sparks off the wheels! Match its pace before it hits 88!"` | 1. `"Elle fonce ! Cale-toi sur sa vitesse avant 22 h 04 !"`<br>2. `"Des étincelles ! Suis son allure avant les 88 miles à l'heure !"` |
| **`lightning`** *(10:04 lightning bolt hits the clock tower)* | 1. `"1.21 gigawatts into the clock! My antennae are standing straight up!"`<br>2. `"10:04! Lightning nailed the tower—glad I'm rubber! Wait, AM I?"` | 1. `"2,21 gigowatts en plein sur l'horloge ! Antennes au garde-à-vous !"`<br>2. `"22 h 04 ! En plein clocher — heureusement que je suis isolant ! Enfin…"` |
| **`timeCarMissed`** *(car connects and vanishes in twin fire trails)* | 1. `"Gone in twin flames! See you in 1985, I guess."`<br>2. `"88 mph and poof! Vrell's making me file Form 88-MPH by hand."` | 1. `"Volatilisée en flammes ! Rendez-vous en 1985, j'imagine."`<br>2. `"88 miles à l'heure et pouf ! Vrell va me coller le Cerfa 88-MPH."` |
| **`timeCarCaught`** *(Zib beams up the car in time)* | 1. `"Impounded at 87 mph! Does this void its warranty?"`<br>2. `"Got it! One stainless time car in the hold—take THAT, continuum!"` | 1. `"Saisie à 87 miles à l'heure ! Ça annule la garantie ?"`<br>2. `"Chopée ! Une voiture temporelle en soute — prends ÇA, le continuum !"` |
| **`stormClosing`** *(30 s before 10:10)* | `"Thirty seconds until the storm passes. After that, our pass expires!"` | `"Encore trente secondes d'orage. Après ça, notre laissez-passer expire !"` |

### 4.2 Specimen missed bubbles (`flight.missed`) & wake captions (`data`)

| Short name | `flight.missed` (EN) | `flight.missed` (FR) | Wake caption when specimen wakes (EN / FR) |
| --- | --- | --- | --- |
| **`Doc`** | 1. `"Doc? The cable's dangling—where's Doc?!"`<br>2. `"Who's supposed to plug in the lightning now?"` | 1. `"Doc ? Le câble pend dans le vide — il est où, Doc ?!"`<br>2. `"Qui va brancher la foudre maintenant ?"` | **EN:** `"Doc woke up shouting about gigawatts and drew a diagram on your hull."`<br>**FR:** `"Doc s'est réveillé en hurlant aux gigowatts et a dessiné un schéma sur votre coque."` |
| **`Buff`** | 1. `"Buff? Did somebody knock him out AGAIN?"`<br>2. `"His booth's empty! Check the manure truck!"` | 1. `"Buff ? Quelqu'un l'a ENCORE mis K.O. ?"`<br>2. `"Sa banquette est vide ! Regardez le camion de fumier !"` | **EN:** `"Buff woke up swinging. Luckily he mostly hit the jukebox."`<br>**FR:** `"Buff s'est réveillé en distribuant des coups. Heureusement, il a surtout visé le jukebox."` |
| **`Marvin`** | 1. `"Marvin? Who's taking the guitar solo?!"`<br>2. `"The trunk's empty—did the band leave without him?"` | 1. `"Marvin ? Qui assure le solo de guitare ?!"`<br>2. `"Le coffre est vide — le groupe est parti sans lui ?"` | **EN:** `"Marvin woke up, grabbed a guitar, and invented three decades of noise complaints."`<br>**FR:** `"Marvin s'est réveillé, a pris une guitare et inventé trente ans de tapage nocturne."` |

### 4.3 Vrell report comments (`humor.deepComments`, `mapCollectibles`, fail/sunrise)

| Slot | English (`en.ts`) | Français (`fr.ts`) |
| --- | --- | --- |
| **Time car collected** (`mapCollectibles.items.time_car.comment`) | `"You impounded a speeding time car mid-thunderstorm. Propulsion is stripping it for parts. Legal is pretending we never owned 1955."` | `"Vous avez saisi une voiture temporelle lancée en plein orage. La Propulsion la démonte déjà. Le juridique jure qu'on n'a jamais mis un pied en 1955."` |
| **Time car missed** (`mapCollectibles.items.time_car.missedComment`) | `"You let a sports car outrun a saucer into 1985. That explains the scorched tyres behind Spin City. And my migraine."` | `"Une voiture de sport a semé une soucoupe jusqu'en 1985. Voilà d'où viennent les pneus brûlés derrière Spin City. Et ma migraine."` |
| **Shift clear — standard** (`deepComments.clocktower`) | 1. `"Doc, Buff and Marvin logged with {remaining} s to spare. The clock stopped at 10:04 right on time."`<br>2. `"Buff blamed the saucer on a manure truck. Doc tried to patent our tractor beam in his sleep."` | 1. `"Doc, Buff et Marvin enregistrés avec {remaining} s de marge. L'horloge s'est figée à 22 h 04 pile."`<br>2. `"Buff accuse le camion de fumier. Doc a tenté de breveter notre rayon tracteur en dormant."` |
| **Shift clear — spotted** (`deepComments.clocktowerSpotted`) | `"Delivered, and spotted {spotted} times in 1955. The whole dance thinks aliens invented rock and roll."` | `"Livrés, et repéré {spotted} fois en 1955. Tout le bal croit désormais que les extraterrestres ont inventé le rock'n'roll."` |
| **Storm passes / 10:10 fail** (`deepComments.clocktowerExpired`) | 1. `"10:10. The storm passed, the town clock is stuck, and the Temporal Dispatch pass just expired."`<br>2. `"Storm's over. Your pass expired at 10:10. Zib, please return the saucer to the century you found it in."` | 1. `"22 h 10. L'orage est passé, l'horloge est bloquée et le laissez-passer temporel vient d'expirer."`<br>2. `"L'orage est fini. Votre laissez-passer a expiré à 22 h 10. Zib, ramenez la soucoupe à son siècle d'origine."` |
| **First clear** (`storyFirstClear.level9`) | `"Three 1955 witnesses logged and the timeline didn't implode. Bonus: Krix's lawyers can't patent time travel now. Put the dial back, Zib."` | `"Trois témoins de 1955 classés et la chronologie tient bon. En prime, Krix ne pourra pas breveter le temps. Remettez le cadran à zéro, Zib."` |

### 4.4 Sleep-talk mumbles (`data`, ≤ 40 chars each)

| Sleeper | English (`en.ts`) | Français (`fr.ts`) |
| --- | --- | --- |
| **Doc** *(clock-tower ledge)* | 1. `'One point two one… snoozewatts…'`<br>2. `"Where we're napping, no pillows…"`<br>3. `'Great… somebody check the clock…'` | 1. `'Deux virgule vingt-et-un… gigasiestes…'`<br>2. `"Là où on dort, pas besoin d'oreiller…"`<br>3. `"Nom de… vérifiez l'horloge…"` |
| **Buff Tanner** *(Lyle's booth)* | 1. `'Knock, knock… anybody dreaming?'`<br>2. `'Make like a pillow and… fold…'`<br>3. `'Ugh… not the manure truck again…'` | 1. `"Allô ? Y a quelqu'un au bout du rêve ?"`<br>2. `'Fais comme un oreiller et… plie-toi…'`<br>3. `'Pouah… pas encore le camion de fumier…'` |
| **Marvin Cherry** *(car trunk behind dance)* | 1. `'Chuck? Listen to this… snore…'`<br>2. `"They're not ready for this nap yet…"`<br>3. `'Play it in B-flat, boys… zzz…'` | 1. `'Chuck ? Écoute ce… ronflement…'`<br>2. `'Ils sont pas prêts pour cette sieste…'`<br>3. `'En si bémol, les gars… zzz…'` |

### 4.5 Entry Route Names & Tags (6 routes — `routes`, reconciled with GDD-10)

| `RoomId` | Specimen & building | English (`{ route, difficulty }`) | Français (`{ route, difficulty }`) | Souvenir (`items` key) |
| --- | --- | --- | --- | --- |
| **`inventor_balcony`** | Doc · Courthouse Clock Tower | `{ route: 'Clock balcony', difficulty: 'gears & cable' }` | `{ route: "Balcon de l'horloge", difficulty: 'engrenages et câble' }` | `spare flex capacitor` |
| **`inventor_service`** | Doc · Courthouse Clock Tower | `{ route: 'Service door', difficulty: 'bell & draft' }` | `{ route: 'Porte de service', difficulty: "cloche et courant d'air" }` | `yellow hazmat suit` |
| **`bully_transom`** | Buff · Lyle's Coffee Shop | `{ route: 'Awning transom', difficulty: 'jukebox & fans' }` | `{ route: "Imposte de l'auvent", difficulty: 'jukebox et ventilos' }` | `retro skateboard` |
| **`bully_kitchen`** | Buff · Lyle's Coffee Shop | `{ route: 'Kitchen door', difficulty: 'manure & crates' }` | `{ route: 'Porte de la cuisine', difficulty: 'fumier et caisses' }` | `clock-tower flyer` |
| **`band_hatch`** | Marvin · Crest Valley High Dance | `{ route: 'Bandstand hatch', difficulty: 'band & balloons' }` | `{ route: "Trappe de l'estrade", difficulty: 'orchestre et ballons' }` | `cherry electric guitar` |
| **`band_canopy`** | Marvin · Crest Valley High Dance | `{ route: 'Loading canopy', difficulty: 'headlights & trunks' }` | `{ route: 'Auvent de livraison', difficulty: 'phares et coffres' }` | `red puffy vest` |

### 4.6 Cover Story Causes & 1955 Tabloid Headlines (`reportExtras`)

- **Cover story causes (`reportExtras.causes.level9`):**
  - **EN:** `['ball lightning off the courthouse', 'a prototype tailfin reflection', 'too many chocolate malts']`
  - **FR:** `['la foudre en boule sur le tribunal', 'un reflet sur un pare-chocs chromé', 'un abus de milk-shakes au chocolat']`

- **1955 Tabloid headlines (`reportExtras.headlines.level9`):**
  - *(Shown under `THE GRIMSBY GAZETTE` / `LA GAZETTE DE GRIMSBY` with the `1955 ARCHIVE` / `ARCHIVES DE 1955` treatment per GDD-10.)*
  - **EN:**
    1. `'LIGHTNING STOPS COURTHOUSE CLOCK AT 10:04 — FLYING HUBCAP BLAMED'`
    2. `'CHROME HUBCAP OVER MAIN ST — LOCAL BULLY STILL OUT COLD IN BOOTH'`
    3. `"PROM BANDLEADER VANISHES MID-RIFF — SOUND CALLED 'OUT OF THIS WORLD'"`
  - **FR:**
    1. `"LA FOUDRE FIGE L'HORLOGE À 22 H 04 — UN ENJOLIVEUR VOLANT ACCUSÉ"`
    2. `'ENJOLIVEUR CHROMÉ GRANDE RUE — LA BRUTE LOCALE TOUJOURS K.O. AU CAFÉ'`
    3. `"CHEF D'ORCHESTRE ENLEVÉ EN PLEIN SOLO — UN SON « VENU D'AILLEURS »"`

---

## 5. Souvenirs (6 Routes) & Town Pickup (Time Car)

> **Hard-rule check (`tests/ui-trophies.test.ts` & `docs/GDD-9-trophy-room.md`):**
> - Every room souvenir has an art key, singular/plural `tr().items`, Vrell report `got`/`missed` quips, and a distinct catchy Trophy Room (Room 1) description in EN and FR.
> - With 35 existing souvenirs (L1–L8) + 6 new souvenirs (L9) = **41 total**, Room 1 still fits in **1 wing** (`ROOM_CAPACITY = 48`).
> - The Time Car automatically appears as **Field Find #08** in Room 2 (*Field Detours Annex · Warehouse 4B*) via `LEVELS` iteration.

### 5.1 Route-to-Souvenir Map

| Route (`RoomId`) | Souvenir ID (`items` key) | Art key | Exact-name swap (if chosen) |
| --- | --- | --- | --- |
| `inventor_balcony` | `spare flex capacitor` | `room/flex_capacitor` | `spare flux capacitor` |
| `inventor_service` | `yellow hazmat suit` | `room/hazmat_suit` | *(unchanged)* |
| `bully_transom` | `retro skateboard` *(purple-and-yellow)* | `room/retro_skateboard` | *(unchanged)* |
| `bully_kitchen` | `clock-tower flyer` | `room/clock_flyer` | *(unchanged)* |
| `band_hatch` | `cherry electric guitar` | `room/cherry_guitar` | *(unchanged)* |
| `band_canopy` | `red puffy vest` | `room/puffy_vest` | *(unchanged)* |

*(Backup swap option if a route needs a pure clockwork prop instead of one of the above: **`lightning-struck clock hand`** / `room/clock_hand` — EN plural `{ one: '{n} scorched clock hand', other: '{n} scorched clock hands' }`, FR `{ one: '{n} aiguille foudroyée', other: '{n} aiguilles foudroyées' }`.)*

### 5.2 Item Names (`tr().items` — singular & plural)

| Item ID | EN (`one` / `other`) | FR (`one` / `other`) |
| --- | --- | --- |
| `spare flex capacitor` | `{ one: '{n} spare flex capacitor', other: '{n} spare flex capacitors' }` | `{ one: '{n} convecteur de flou', other: '{n} convecteurs de flou' }` |
| `yellow hazmat suit` | `{ one: '{n} yellow hazmat suit', other: '{n} yellow hazmat suits' }` | `{ one: '{n} combinaison jaune', other: '{n} combinaisons jaunes' }` |
| `red puffy vest` | `{ one: '{n} red puffy vest', other: '{n} red puffy vests' }` | `{ one: '{n} doudoune rouge', other: '{n} doudounes rouges' }` |
| `retro skateboard` | `{ one: '{n} retro skateboard', other: '{n} retro skateboards' }` | `{ one: '{n} skate rétro', other: '{n} skates rétro' }` |
| `cherry electric guitar` | `{ one: '{n} cherry electric guitar', other: '{n} cherry electric guitars' }` | `{ one: '{n} guitare électrique rouge', other: '{n} guitares électriques rouges' }` |
| `clock-tower flyer` | `{ one: '{n} clock-tower flyer', other: '{n} clock-tower flyers' }` | `{ one: '{n} tract de l’horloge', other: '{n} tracts de l’horloge' }` |

> **Phone-width note on `retro skateboard`:** On the 148 px Trophy Room tile (`GDD-9-trophy-room.md`), `purple-and-yellow skateboard` (28 chars) wraps tight; keeping the item ID short (`retro skateboard` / `skate rétro`) while making the art unmistakably purple-and-yellow and calling out those colours in both the report quips and catalogue note keeps grid labels clean in EN and FR.

### 5.3 Vrell Report Souvenir Quips (`souvenirs.items` — EN + FR)

#### 1. `spare flex capacitor` *(Doc · Clock face)*
- **EN `got`:**
  1. `"A spare flex capacitor, pulsing gently in a biscuit tin. Propulsion says it shouldn't work. It's currently heating my lunch from yesterday."`
  2. `"Spare flex capacitor, logged. Three blinking tubes and zero safety certification—classic Earth engineering."`
  3. `"Doc built a time-bending capacitor out of junkyard relays. Meanwhile our Accounting server takes four hours to open a PDF."`
- **EN `missed`:**
  1. `"You left the spare capacitor on the clock ledge. Good. If Zib had dropped it, we'd have owed last Thursday's overtime."`
  2. `"No flex capacitor. Shame—Propulsion wanted to see how humans bent time without filing Form 88-MPH."`
- **FR `got`:**
  1. `"Un convecteur de flou de rechange, qui clignote dans une boîte à biscuits. La Propulsion dit que c'est impossible. Il réchauffe mon déjeuner d'hier."`
  2. `"Convecteur de flou enregistré. Trois ampoules et zéro norme de sécurité : du grand génie terrien."`
  3. `"Doc tord le temps avec des pièces de casse. Pendant ce temps, notre serveur comptable met quatre heures à ouvrir un PDF."`
- **FR `missed`:**
  1. `"Vous avez laissé le convecteur sur le rebord. Tant mieux : si Zib l'avait fait tomber, on devrait encore les heures sup de jeudi dernier."`
  2. `"Pas de convecteur de flou. Dommage, la Propulsion voulait voir comment ils plient le temps sans Cerfa 88-MPH."`

#### 2. `yellow hazmat suit` *(Doc · Belfry stairs)*
- **EN `got`:**
  1. `"A bright yellow radiation suit, complete with hairdryer tucked in the belt. Humans think we dress like this. Frankly, it's flattering."`
  2. `"Yellow hazmat suit, logged. Zib wore it into Accounting and claimed to be a visitor from Planet Vulcan. Accounting believed them."`
  3. `"Radiation suit from 1955. Smells faintly of storm ozone and terrible heavy-metal cassette tapes."`
- **EN `missed`:**
  1. `"You left the yellow hazmat suit on the stairs. Some poor 1955 farmer is going to wake up thinking we're giant bananas."`
  2. `"No hazmat suit. Pity—it was cleaner than our official Bureau uniforms."`
- **FR `got`:**
  1. `"Une combinaison jaune fluo, avec un sèche-cheveux à la ceinture. Les humains croient qu'on s'habille comme ça. C'est presque flatteur."`
  2. `"Combinaison jaune enregistrée. Zib l'a mise à la compta en se prétendant envoyé de la planète Vulcain. Ils y ont cru."`
  3. `"Tenue antiradiation de 1955. Sent légèrement l'ozone et les cassettes de hard rock mal rembobinées."`
- **FR `missed`:**
  1. `"Vous avez laissé la combinaison jaune dans l'escalier. Un fermier de 1955 va encore croire que nous sommes des bananes géantes."`
  2. `"Pas de combinaison. Dommage, elle était plus propre que nos uniformes officiels."`

#### 3. `red puffy vest` *(Marvin · Loading canopy)*
- **EN `got`:**
  1. `"A red quilted vest from a crate at the dance. Everyone in 1955 kept asking why the kid jumped ship in a life preserver. Honestly, fair question."`
  2. `"Red puffy vest, logged under 'buoyancy aids, suspiciously heavy'. Zib is wearing it over three sweaters and sweating."`
  3. `"One 1985 puffy vest, stranded in 1955. Temporal fashion crime—and we don't even have a form for that."`
- **EN `missed`:**
  1. `"You left the red puffy vest behind the gym. The chaperone will keep it handy in case the Coast Guard crashes the prom."`
  2. `"No puffy vest. Fine. Zib already has enough questionable jackets in the hold."`
- **FR `got`:**
  1. `"Une doudoune rouge sans manches prise derrière le gymnase. En 1955, tout le monde demande pourquoi le gamin porte un gilet de sauvetage. Bonne question."`
  2. `"Doudoune rouge classée en « bouée suspecte, encombrante ». Zib la porte sur trois pulls et fond sur place."`
  3. `"Une doudoune de 1985 égarée en 1955. Crime de mode temporel — et on n'a même pas de Cerfa pour ça."`
- **FR `missed`:**
  1. `"Vous avez laissé la doudoune rouge derrière le gymnase. Le chaperon la garde au cas où les garde-côtes débarquent au bal."`
  2. `"Pas de doudoune rouge. Tant mieux : Zib a déjà bien assez de vestes douteuses en soute."`

#### 4. `retro skateboard` *(Buff · Alley door — purple-and-yellow art)*
- **EN `got`:**
  1. `"A purple-and-yellow wooden skateboard, clearly snapped off a kid's crate scooter. Still has 1955 manure on the rear wheels. Wash it."`
  2. `"Retro skateboard, logged. Zib tried to ollie down the saucer ramp and invented three new bruise forms."`
  3. `"One homemade skateboard. Humans invented extreme sports purely to escape one guy in a convertible."`
- **EN `missed`:**
  1. `"You left the skateboard in the alley. Buff will trip over it in the morning and blame the sky anyway."`
  2. `"No skateboard. Good. Our medical plan does not cover alien ankle sprains."`
- **FR `got`:**
  1. `"Un skate en bois violet et jaune, visiblement arraché à une trottinette à caisse. Encore du fumier de 1955 sur les roues. Lavez ça."`
  2. `"Skate rétro enregistré. Zib a tenté un saut sur la rampe de la soucoupe et inventé trois nouvelles fiches d'hématome."`
  3. `"Une planche à roulettes maison. Les humains ont inventé la glisse juste pour semer une brute en décapotable."`
- **FR `missed`:**
  1. `"Vous avez laissé le skate dans l'allée. Buff trébuchera dessus demain matin et accusera le ciel de toute façon."`
  2. `"Pas de skate. Tant mieux : notre mutuelle ne couvre pas les entorses d'antenne."`

#### 5. `cherry electric guitar` *(Marvin · Gym roof vent)*
- **EN `got`:**
  1. `"A cherry-red hollow-body guitar, still warm from a solo that shouldn't exist for another twenty years. Accounting has confiscated the amp."`
  2. `"Electric guitar, logged. Zib played one power chord in the hangar and shattered four specimen jars. Their kids are gonna love it."`
  3. `"Marvin's cherry guitar. Half the gym fainted; the other half is still trying to figure out what happened to the prom playlist."`
- **EN `missed`:**
  1. `"You left the cherry guitar by the stage. Good—Zib would have started a band, and I cannot survive an intern tour."`
  2. `"No guitar. Marvin keeps his axe, and the timeline keeps rock and roll. Call it a draw."`
- **FR `got`:**
  1. `"Une guitare rouge cerise encore brûlante d'un solo qui ne devrait pas exister avant vingt ans. La compta a confisqué l'ampli."`
  2. `"Guitare électrique enregistrée. Zib a plaqué un accord dans le hangar et brisé quatre bocaux. Mais vos enfants adoreront ça."`
  3. `"La guitare rouge de Marvin. La moitié du gymnase a fait un malaise ; l'autre cherche encore ce qui est arrivé au slow."`
- **FR `missed`:**
  1. `"Vous avez laissé la guitare rouge sur scène. Tant mieux : Zib aurait monté un groupe, et je ne survivrais pas à une tournée."`
  2. `"Pas de guitare. Marvin garde son instrument et la chronologie garde le rock'n'roll. Match nul."`

#### 6. `clock-tower flyer` *(Marvin · Back-lot garage)*
- **EN `got`:**
  1. `"'SAVE THE CLOCK TOWER!'—and somebody scribbled a frantic phone number on the back. Keep it away from Temporal Dispatch."`
  2. `"A crumpled clock-tower flyer from 1955. Apparently the lightning hit at 10:04 sharp. Spoiler alert: we noticed."`
  3. `"Save-the-Clock-Tower leaflet, logged. Legal says donating a quarter in 1955 counts as tampering with the timeline. Put it back."`
- **EN `missed`:**
  1. `"You left the clock-tower flyer under the wiper. Someone's going to need that exact timestamp in thirty years."`
  2. `"No flyer. Fine. We already know when the lightning hits—my fillings are still humming."`
- **FR `got`:**
  1. `"« SAUVEZ L'HORLOGE ! » — avec un numéro de téléphone griffonné en panique au dos. Éloignez ça du Dispatch Temporel."`
  2. `"Un tract froissé de 1955 pour sauver l'horloge. La foudre frapperait à 22 h 04 pile. Alerte divulgâchage : on a remarqué."`
  3. `"Tract de l'horloge classé. Le juridique dit que donner une pièce en 1955 altère la chronologie. Rangez votre monnaie."`
- **FR `missed`:**
  1. `"Vous avez laissé le tract sous l'essuie-glace. Quelqu'un aura grand besoin de cette heure exacte dans trente ans."`
  2. `"Pas de tract. Peu importe : on connaît déjà l'heure de la foudre, mes plombages vibrent encore."`

#### Level-wide souvenir quips (`souvenirs.levels.level9`)
- **EN `all`:**
  1. `"A souvenir from every 1955 stop. Congratulations—you've officially turned a Temporal Audit into a vintage flea market."`
  2. `"Three 1955 artefacts in the hold. If anyone from 1985 starts fading out of family photos, I'm blaming you."`
- **EN `none`:**
  1. `"Zero souvenirs from 1955. Textbook non-interference—and deeply boring for Warehouse 4."`
  2. `"Nothing taken from Crest Valley. History stays intact, and Zib's shelf stays painfully tidy."`
- **FR `all`:**
  1. `"Un souvenir de chaque arrêt de 1955. Bravo : vous avez transformé un audit temporel en brocante vintage."`
  2. `"Trois artefacts de 1955 en soute. Si quelqu'un commence à s'effacer sur les photos de famille en 1985, je vous dénonce."`
- **FR `none`:**
  1. `"Zéro souvenir de 1955. Non-ingérence exemplaire — et terriblement ennuyeux pour l'entrepôt 4."`
  2. `"Rien emporté de Crest Valley. L'Histoire reste intacte, et l'étagère de Zib désespérément propre."`

---

### 5.4 Trophy Room — Room 1 Souvenir Catalogue Descriptions (`trophies.descriptions`)
Distinct from Vrell's shift-report quips; dry Bureau catalogue voice, sized for the detail card:

| Item ID | English (`en.ts`) | Français (`fr.ts`) |
| --- | --- | --- |
| `spare flex capacitor` | `'Three blinking tubes wired inside a metal box. Makes time travel possible—and voids every warranty in the galaxy.'` | `'Trois tubes lumineux câblés dans une boîte en fer. Rend le voyage temporel possible et annule toute garantie galactique.'` |
| `yellow hazmat suit` | `'Blinding canary vinyl with a hairdryer holster. Officially listed in Earth folklore as "typical Martian evening wear".'` | `'Vinyle jaune canari avec étui à sèche-cheveux. Officiellement classé par les humains comme « tenue de soirée martienne ».'` |
| `red puffy vest` | `'Quilted crimson waistcoat from thirty years in the future. Every 1955 local assumed its owner fell off a boat.'` | `'Doudoune rouge venue de trente ans dans le futur. Tout Crest Valley en 1955 croit son propriétaire tombé d’un bateau.'` |
| `retro skateboard` | `'Purple-and-yellow plank stripped off a crate scooter. Four steel wheels, zero brakes, trace amounts of 1955 manure.'` | `'Planche violette et jaune démontée d’une caisse à savon. Quatre roulettes en acier, zéro frein, traces de fumier d’époque.'` |
| `cherry electric guitar` | `'Semi-hollow 1950s beauty with a singed pickup. Played so loud at prom it briefly cracked the space-time continuum.'` | `'Demi-caisse rouge cerise au micro roussi. Jouée si fort au bal qu’elle a brièvement fissuré le continuum espace-temps.'` |
| `clock-tower flyer` | `'Reads "SAVE THE CLOCK TOWER!" in bold 1955 ink. Someone wrote a frantic phone number and "10:04 PM" on the back.'` | `'Affiche « SAUVEZ L’HORLOGE ! » en gras de 1955. Quelqu’un a griffonné « 22 h 04 » et un numéro paniqué au verso.'` |

---

### 5.5 Trophy Room — Room 2 Town Pickup Entry (`time_car`, Field Find #08)

- **Collectible ID:** `time_car`
- **Art key:** `flight/pickup_time_car` *(distinct stainless gull-wing two-seater silhouette with raised gull-wing door, round tail lamps, elliptical rear glow, and two warm flame-scuff streaks — following the asset boundaries in `docs/research/film-references.md#parked-time-car-l2-and-1953`)*

| Field | English (`en.ts`) | Français (`fr.ts`) |
| --- | --- | --- |
| **`mapCollectibles.items.time_car.name`** | `'Time car'` | `'Voiture temporelle'` |
| **`mapCollectibles.items.time_car.memoHint`** | `'gull-wing time car'` | `'voiture temporelle'` |
| **`trophies.town.statuses.time_car`** *(Bureau status line)* | `'Impounded · Capped at 87 mph'` | `'En fourrière · Bridée à 87 mph'` |
| **`trophies.town.descriptions.time_car`** *(Town-room catalogue note)* | `'Brushed stainless coupe with gull-wing doors, scorched tyres and zero permits. Propulsion refuses to let Zib test what happens at 88.'` | `'Coupé en inox brossé à portes papillon, pneus roussis et zéro permis du Bureau. La Propulsion interdit à Zib de tester ce qui arrive à 88.'` |
| **`trophies.town.hints.time_car`** *(Unfound vague hint)* | `'Check the shift memo for an unlicensed gull-wing coupe racing the clock tower before 10:04.'` | `"Relisez la note : un coupé papillon non déclaré fait la course avec l'horloge avant 22 h 04."` |

---

## 6. Open Decisions for the User

1. **Affectionate nods vs. exact film names:** Everything above is written with the coordinator's recommended nods (**Doc**, **Buff Tanner**, **Marvin Cherry & the Starliners**, **Crest Valley**, **Lyle's Coffee Shop**, **Enchantment Beneath the Waves**, **Time car**, **Flex Capacitor**) because the game is public. The exact-name column in Section 1 lets you flip any or all of them to the film's exact names (`Doc Brown`, `Biff Tannen`, `Marvin Berry & the Starlighters`, `Hill Valley`, `Lou's Cafe`, `DeLorean`, `Flux Capacitor`) with zero rewrite of the jokes.
2. **Town continuity — `Crest Valley` vs. `Grimsby (1955)`:** `Crest Valley` leans into classic 1955 American Courthouse Square Americana (while Temporal Dispatch explains the jump via the 1.21-GW power spike pulling the dial off Grimsby). If you prefer strict *"every era is still Grimsby"* continuity (`GDD-7-eras.md`), we can rename `Crest Valley` → `Grimsby · Nov 12, 1955` and `Crest Valley High` → `Grimsby High`.
3. **Capacitor gag word:** **`Flex Capacitor`** (universal slang pun, clean sound-alike) vs. **`Fluke Capacitor`** (dry Bureau joke about how it shouldn't work). French defaults to **`Convecteur de flou`** (nodding to the iconic FR dub *convecteur temporel*).
4. **Red puffy vest FR item name:** Literal **`doudoune rouge`** (clear on the trophy shelf) vs. the film joke **`gilet de sauvetage rouge`** (funny in-joke; currently we use `doudoune rouge` in the description/quips so the life-preserver punchline lands cleanly — recommend keeping `doudoune rouge` as the item name!).
5. **Skateboard item ID:** Short **`retro skateboard`** (`skate rétro`) for crisp wrapping on 148 px Trophy Room tiles (with purple-and-yellow colours called out in art, quips, and catalogue description) vs. full **`purple-and-yellow skateboard`**.
6. **1955 Gazette masthead:** Keep `THE GRIMSBY GAZETTE` (as an "Archive Clipping") or swap to a period 1955 masthead (`THE CREST VALLEY TELEGRAPH`) on L9's Report?
