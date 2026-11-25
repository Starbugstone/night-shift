// English strings: the source of truth. `fr.ts` must have every key (TypeScript checks it).
// Sections are by screen / system; add yours at the end of the section it belongs to.
// Placeholders are `{name}` (fill with `fmt`), plurals are `{ one, other }` (pick with `plural`).
import type { RoomId, UpgradeId } from '../contracts';
import type { CommentKey, DeepZibEvent, ZibEvent } from '../levels/humor';

type Lines = readonly string[];
type Plural = { one: string; other: string };

const routes = {
  farm_window: { route: 'Window', difficulty: 'easy' },
  farm_chimney: { route: 'Chimney', difficulty: 'fast & risky' },
  laundry_skylight: { route: 'Skylight', difficulty: 'short & risky' },
  laundry_loading: { route: 'Loading door', difficulty: 'long & safe' },
  dave_roof: { route: 'Roof hatch', difficulty: 'attic, swingy' },
  dave_patio: { route: 'Patio door', difficulty: 'creaky stairs' },
  barb_chimney: { route: 'Chimney', difficulty: 'short, sooty' },
  barb_backdoor: { route: 'Back door', difficulty: 'long, Biscuit' },
  gary_skylight: { route: 'Skylight', difficulty: 'lasers' },
  gary_garagedoor: { route: 'Garage door', difficulty: 'timed door' },
  nigel_skylight: { route: 'Skylight', difficulty: 'dino maze, lasers' },
  nigel_loading: { route: 'Loading bay', difficulty: 'gift shop' },
  kev_vent: { route: 'Roof vent', difficulty: 'bass & fans' },
  kev_fireescape: { route: 'Fire escape', difficulty: 'past Tiny' },
  mayor_clocktower: { route: 'Clock tower', difficulty: 'gears' },
  mayor_elevator: { route: 'Elevator shaft', difficulty: 'moving car' },
  // L5 pier code
  bubbles_roof: { route: 'Roof panel', difficulty: 'sea lion, keep damp' },
  bubbles_tunnel: { route: 'Service tunnel', difficulty: 'flooded, jellyfish' },
  pete_gallery: { route: 'Lamp gallery', difficulty: 'turning lens' },
  pete_slipway: { route: 'Down the tower', difficulty: 'stairs & slipway' },
  sal_loft: { route: 'Ice chute', difficulty: 'climb the draught' },
  sal_dock: { route: 'Cold store', difficulty: 'Kipper & crates' },
  // L6 clinic code
  hank_front: { route: 'Front doors', difficulty: 'revolving door' },
  hank_rear: { route: 'Rear entrance', difficulty: 'laundry cart' },
  osei_helipad: { route: 'Roof helipad', difficulty: 'lift shaft' },
  osei_pharmacy: { route: 'Pharmacy hatch', difficulty: 'pill shelves' },
  pemberton_window: { route: 'Recovery window', difficulty: 'past Roland' },
  pemberton_chute: { route: 'Laundry chute', difficulty: 'chute draft' },
  // L7 cruise code
  captain_mast: { route: 'Mast hatch', difficulty: 'chart room, timed hatch' },
  captain_funnel: { route: 'Funnel', difficulty: 'engine room, sooty' },
  marco_skylight: { route: 'Galley skylight', difficulty: 'hood fans' },
  marco_promenade: { route: 'Promenade door', difficulty: 'dessert trolley' },
  greg_awning: { route: 'Sun-deck awning', difficulty: 'deckchair stack' },
  // v4 L8
  echo_appeal: { route: "Appeals hatch", difficulty: "shaft, hanging bell" },
  greg_cabin: { route: 'Porthole', difficulty: 'cabins, camera' },
} satisfies Record<RoomId, { route: string; difficulty: string }>;

const upgrades = {
  beam_dampener: {
    name: 'Beam Dampener',
    effect: 'Less limb swing',
    desc: 'Specimens arrive 30% less noodly. Warranty void if used on actual noodles.',
  },
  hush_drive: {
    name: 'Hush Drive',
    effect: 'Spotting fuse 1.25 s · Wake fills slower',
    desc: 'A tiny muffler for your anti-gravity. Dogs now hear only a faint, polite hum.',
  },

  snooze_ray: {
    name: 'Snooze Ray',
    effect: 'Double-tap: calm every sleeper',
    desc: 'Once per building, a double-tap hums a lullaby that knocks 40 off every wake meter. Side effects: yawning.',
  },
} satisfies Record<UpgradeId, { name: string; effect: string; desc: string }>;

const zib = {
  start: ['Okay. Okay okay okay. Be cool, Zib.', "Deep breaths. Don't throw up. Again."],
  cone: ['Headlights! Act natural!', 'Look like a cloud. LOOK LIKE A CLOUD.'],
  bark: ['Good doggy… sleepy doggy…', "Shh! Shhh! Who's a quiet boy?"],
  neon: ['The buzzy light is scrambling my brain!', 'Ooh, pretty. Ow, steering.'],
  powerline: ['OW. Who puts string in the SKY?', 'Power line! Earth is so badly designed.'],
  highSus: ["They're looking! THEY'RE LOOKING!", 'Think innocent thoughts!'],
  nearRing: ["Hover… hover… don't sneeze…", "That's the one. Hold still…"],
  locked: ['Locked on! Mom would be so proud.', 'Beam time. Gently, Zib. Gently.'],
  respawn: ['Nobody saw that. Nobody saw anything.', 'Take two. Totally fine. Totally.'],
} satisfies Record<ZibEvent, Lines>;

const vrell = {
  rejected: [
    "Specimen not delivered. I've filed this under 'learning experiences'.",
    'No specimen. Just vibes. Vibes do not count toward quota.',
    "The hatch was right there. It's a very big hatch.",
  ],
  woke: [
    'The specimen woke up and saw your face. HR has questions.',
    "He's awake and telling everyone. Next time: gentler. Like a sigh.",
    "'Gentle beam' does not mean 'beam while screaming'.",
  ],
  perfect: [
    'Flawless. I will be taking credit for this at the quarterly review.',
    "Three stars. Don't let it go to your antenna.",
    "Textbook. We're putting you in the textbook. As a footnote.",
  ],
  spotted: [
    'Spotted {spotted} times. The town has a WhatsApp group about you now.',
    "You're a local legend. That is the opposite of the job.",
  ],
  bonks: [
    '{bonks} bonks. The specimen is now more bruise than human.',
    'I asked for a specimen, not a piñata.',
    'Every bonk is a form. You owe me {bonks} forms.',
  ],
  stole: [
    'You also brought back {item}. Accounting is thrilled. Accounting is never thrilled.',
    '{item}, logged as "Earth artefact". Please stop shoplifting from planets.',
  ],
  dignity: ['Dignity at {dignity}%. Honestly, about average for a human.', 'Dignity at {dignity}%. Do not worry, they will blame it on the mattress.'],
  slow: ['Delivered, eventually. Overtime is unpaid, by the way.', 'That took a while. I aged. I do not age.'],
  clean: ['Zero bonks. Are you even trying to make my day interesting?', 'Zero bonks. I had already pre-filled the bruise forms. Thanks for nothing.'],
  default: [
    "Adequate. My favourite word. It means I don't have to talk to anyone.",
    'Specimen received. Please wipe down the beam.',
  ],
} satisfies Record<CommentKey, Lines>;

const deepZib = {
  start3: ['Three houses before dawn. Suburbia: ring doorbells, dogs, and grudges.', "Three specimens before sunrise. That's one more than I've ever done. Total."],
  start4: ['Downtown Grimsby. Mom said cities are where saucers go to get towed.', 'Okay. Downtown. Be cool. Act like a pigeon.'],
  // v4 story
  start5: ["Barnacle Bay! Wait—I'm abducting a DOLPHIN? Do I need a towel?", 'Seaside shift. Hide from the lighthouse. Keep the mammal damp.'],
  start6: ["St. Mildred's. Humans pay to get probed here? Earth is deeply weird.", 'Form 7-B audit. Brass thermometer ready. Please nobody wake up.'],
  start7: ['A whole cruise ship, off-books. Vrell is definitely getting us both fired.', 'SS Buffet Royale. Grab the captain, dodge the camera, ignore the shrimp.'],
  start8: ["Three million years ago and it's STILL Grimsby. Beat Echo's deadline!", "Roaming apes, black slabs, and a filing clock. Where's Krix?!"],
  twoOfThree: [
    "Two in the hold! One more and I'm basically a real employee.",
    "Two down, one to go. Please don't sneeze on the beam, Zib.",
    "Almost done! Vrell might actually call this 'adequate'!",
  ],
  police: ['Police cruiser! Look like weather!', "That's a COP. Do I have my licence? Do saucers HAVE licences?"],
  patrol: ['Patrol car! Act like a streetlight. A tall, wobbly streetlight.', 'Another police car. This town has more cops than crimes. Until now.'],
  traffic: ['Traffic! Why is anyone driving at 3 AM? Go HOME.', "Taxi headlights! He's seen weirder. Probably."],
  porch: ["The porch light clicked! Motion sensor! I MOVE, that's my whole thing!", "Porch light! Freeze! No, don't freeze, that's worse!"],
  watcher: ['Mrs. Pruitt has BINOCULARS. Who has binoculars at 3 AM?!', "The lady in the window. She's writing something down. Is it me?"],
  dog: ['Yard dog! Good boy. Sleepy boy. Boy who has seen nothing.', "The dog's awake! Act like a squirrel. A big, round, glowing squirrel."],
  heli: ["That's a POLICE helicopter. Mom said if I get arrested I'm walking home.", 'Searchlight! Stay out of the circle! Everything bad is in the circle!'],
  camera: ["Rooftop camera! Smile! No! Don't smile! We don't have faces on record!", 'Rooftop CCTV! Blink! Wait, do cameras care if you blink?'],
  window: ["Someone's working late! Why is anyone working late? Oh. Right. Me.", 'Office light! Wait for it to flicker off!'],
  neon: ['Billboard! My steering is full of BURGERS.', 'The neon is in my brain again. Left is right. Right is lunch.'],
  wire: ['OW. Power line. Earth has strings everywhere.', 'Bonk! Who strings cables over a whole street?!'],
  tram: ['Tram wire! Ow! Why does a city need a ceiling?', 'Bonk. The tram people really should label these.'],
  bat: ['BATS! Bats bats bats! Sorry! Sorry, bats!', "A bat hit me. Or I hit a bat. Either way, it's my fault, apparently."],
  pigeon: ["Pigeons! They don't move! Why don't they MOVE?", "Pigeon strike! Mom said they're just rats with a pilot's licence."],
  crane: ["The crane! It's a giant metal arm and it HATES me.", 'Crane boom! Duck! Can saucers duck?'],
  sprinkler: ["It's a sprinkler. Just a sprinkler. I knew that.", 'The sprinkler is unbothered by me. I respect the sprinkler.'],
  cropcircle: ["Hey, I didn't make that one! That's the Tuesday crew's handwriting.", 'Crop circle! Vrell says that counts as one signature on a probe form.'],
  tripwire: ["Gary's tripwire. Rings a bell by his bed. He's slept through it every time.", 'Another Gary tripwire. It only catches Gary. Gary is the threat.'],
  checkpoint: ['One in the hold! Nobody saw a thing. Hopefully.', 'Specimen secured. Back to the sky, Zib. Act natural.'],
  dawn: ["The sky's going orange! That's the bad colour!", 'Sunrise in thirty seconds! The humans will be AWAKE. On PURPOSE.'],
  nearRing: ["Hover… hover… don't sneeze…", "That's the one. Hold still…"],
  locked: ['Locked on! Beam time. Gently.', 'Going in. Shoes off. Do I have shoes?'],
  respawn: ['Nobody saw that. Nobody saw anything.', 'Take two. Totally fine. Totally.', 'Okay. Again. From the last specimen. Like a professional.'],
  // L5 pier code: the lighthouse beam sees you, a gull flock bumps you
  lighthouse: ["Lighthouse! I'm not a boat! I'm a very small, very guilty cloud!", "The lighthouse beam! Hide behind something tall! Mom always said I'm not tall enough!"],
  gull: ['GULLS! They want my chips! I do not have chips!', 'A gull hit the saucer. The gull is fine. The gull is always fine.'],
  // L6 clinic code
  ambulance: ["The ambulance sees me! Do I look like an emergency? Don't answer that.", 'Headlights AND a beacon! That is two kinds of looking!'],
  scramble: ["The bay door's going up! They're scrambling an ambulance! For ME?", "Flashing arrows! That ambulance is coming OUT! Get out of the lane!"],
  // L7 cruise code
  // v4 L8
  hum: ["The rock just put me on hold. Out of the belt!"],
  photographer: ["The ship photographer! Mom said never end up on a souvenir mug!", 'Shutter! Inside the frame is bad! Outside the frame is where I should be!'],
  framed: ["He's lining up a shot! Move before the iris closes!", "Amber frame! Say cheese! No! Don't say cheese! LEAVE!"],
  steward: ['A steward with a torch! Act like a seagull. A big, round seagull.', 'Torch beam! Stewards check everything. Even the sky, apparently.'],
} satisfies Record<DeepZibEvent, Lines>;

/** Keyed by spot cause (police, patrol, traffic, porch, watcher, dog, heli, camera, window). */
const spotCaptions = {
  police: ['Officer Dobbs radios in "a large hubcap, airborne". Dispatch asks if he has eaten.', "The cruiser's dashcam got a clip. It will be shown at the station party. Twice."],
  patrol: ['Patrol car logs "unusual lights". The report will be filed under "Thursday".', 'An officer spills coffee on his own lap in shock. He will blame the Mayor.'],
  traffic: ['A taxi driver sees you, shrugs, and adds a 20% surcharge for the sighting.', 'A delivery van films you at a red light. Five stars. Would see again.'],
  porch: ['The porch light caught you. Then the doorbell camera caught the porch light.', 'Motion light, doorbell camera, neighbourhood app. 41 comments by breakfast.'],
  watcher: ['Mrs. Pruitt adds you to her logbook, between "suspicious cat" and "the Hendersons\' bins".', 'Mrs. Pruitt calls the council. The council knows her voice. The council hangs up. You are still seen.'],
  dog: ['The dog barks. A light goes on. A man in a dressing gown says "what IS that".', 'The yard dog has finally barked at something real. He is so proud.'],
  heli: ['"Unidentified aircraft, state your call sign." "Zib" was not the right answer.', "The helicopter's searchlight finds you. The pilot asks for a photo. Then for backup."],
  camera: ['Rooftop CCTV saves a clip. Security will watch it on Tuesday, at 4× speed.', "Camera footage sent to the cloud. You were briefly a cloud. It didn't take."],
  window: ['An accountant working late sees you. He tells nobody. He has nobody to tell.', 'A night-shift clerk sees you, waves, and goes back to the spreadsheet. Still counts.'],
  // L5 pier code
  lighthouse: ['Pete\'s lighthouse logs "one saucer, low, no lights, rude". The coastguard frames it.', 'The lighthouse beam sweeps over you. Somewhere, a trawler captain says "huh".'],
  // L6 clinic code
  ambulance: ['The paramedics log "one saucer, conscious, breathing". They give it a four-hour wait.', 'An ambulance crew photographs you for the staff newsletter. Caption: "Not our busiest night".'],
  // L7 cruise code
  // v4 L8
  hum: ["The monolith recorded your flyby in a very permanent format."],
  photographer: ['The ship photographer gets the shot. It will be on sale at the gift shop by breakfast, £14.99 framed.', 'Long exposure, perfect focus. The cruise line puts you on next year\'s brochure.'],
  steward: ['A steward logs "one unauthorised deck light". It is the third this week. Nobody can explain the other two.', 'The torch finds you. The steward asks to see your boarding card.'],
};

export const en = {
  meta: {
    /** Browser tab title. */
    docTitle: 'Night Shift — Abductions Dept.',
    /** Shown on the language toggle. */
    short: 'EN',
    name: 'English',
  },

  common: {
    back: '‹',
    retry: 'Retry',
    next: 'Next',
    workOrders: 'Work orders',
    backToFlight: 'Back to flight',
    quit: 'QUIT',
    restart: 'RESTART',
    tapToSkip: 'tap to skip',
    glorbs: 'Glorbs',
    dash: '—',
  },

  title: {
    clockIn: 'Clock in',
    logo: 'NIGHT SHIFT',
    logoSub: 'Abductions Dept.',
    bureau: 'GALACTIC CENSUS BUREAU',
    taglines: [
      'One thumb. No witnesses.',
      'Now hiring: interns with steady thumbs.',
      'Abducting responsibly since 1947.',
      'Your specimen is our priority.',
      'We never sleep. Well, they do.',
      'Five notes. Zero witnesses.',
      // v4 story
      'Grimsby night beat. Unpaid.',
      'Brass thermometers since 1953.',
      'Zero notes. Zero royalties.',
    ],
    build: 'v0.1 · night shift build',
    language: 'Language',
  },

  loading: {
    clockingIn: 'Clocking in…',
    calibrating: 'Calibrating tractor beam · {pct}%',
    tips: [
      'Tip: humans are 60% water and 40% complaints.',
      'Tip: a sleeping human weighs the same as an awake one, but complains less.',
      'Tip: dogs can smell fear. And saucers.',
      'Tip: headlights are just angry flashlights.',
      'Tip: if the human wakes up, act casual. Hum something.',
      'Tip: power lines are not decorative. Ask the last intern.',
      'Tip: cats are not specimens. Cats are management.',
      'Tip: dignity cannot be refunded.',
      'Tip: Glorbs are not edible. Please stop trying.',
      'Tip: "gently" is a beam setting, not a suggestion.',
      "Tip: probe requests need two signatures. A crop circle counts as one.",
      'Tip: if a human starts sculpting mashed potatoes, you hovered too low.',
      "Tip: don't panic. Panic voids the saucer's third-party insurance.",
    ],
    // v4 story: progress-gated loading tips (unlocked by delivered milestones)
    tierTips: {
      afterL2: [
        'Tip: every odd sock lost in Spin City since 1998 is in Bureau Warehouse 4.',
        'Tip: if Mrs. Pruitt waves at you, she is not being friendly. She is calibrating.',
      ],
      afterL4: [
        'Tip: The Grimsby Gazette pays £20 for blurry saucer photos. Do not subsidise them.',
        'Tip: Mayor Whitlock has still not noticed his toupee is in orbit.',
      ],
      afterL5: [
        'Tip: Bubbles the dolphin has her own Bureau parking ring. Hers comes with a pool.',
        'Tip: Form 7-B is strictly medical. Stop giggling in the Endoscopy wing.',
      ],
      afterL7: [
        'Tip: OBELISK™ charges by the note. Our beam plays zero notes and costs nothing.',
        'Tip: Temporal Dispatch runs on Form 88-MPH. File expenses before yesterday.',
      ],
    },
  },

  // v4 progression
  routeAdvice: {
    farm_window: 'open lift',
    farm_chimney: 'tight flue',
    laundry_skylight: 'one slow fan',
    laundry_loading: 'longer, moving cart',
  },
  // v4 progression
  lessons: {
    farmVerge: 'Cross the road behind the pickup',
    wireGap: 'Fly between the two streetlights',
    porch: 'Pause outside the sensor. Watch the light arm.',
    coolOff: 'Move into shadow and let the fuse clear',
    traffic: 'Cross one lane at a time',
    lighthouse: 'Wait in shadow, then cross after the beam',
    ambulance: 'Leave the lane when the arrows turn amber',
    shutter: 'When the frame appears, slide out of it',
    hum: 'Wait outside the ring or slip into its quiet centre',
    settle: 'Let go to settle before the opening',
    laser: 'Wait here. An active laser trips on contact.',
    refill: 'Dip to refill',
    roll: 'Watch one roll, then move with it',
    probe: 'Hold {joint} in the ring for {seconds} s',
    // v4 council: {joint} in the probe prompt, with its article
    probeJoint: { thermo: 'the head', hammer: 'the knee', feather: 'the foot' },
  },
  // v4 progression
  fieldCheckControls: {
    short: 'Field Check',
    checkpoint: 'First checkpoint logged',
  },
  workOrders: {
    // v4 progression
    nextDispatch: 'NEXT DISPATCH',
    title: 'WORK ORDERS',
    subtitle: "Tonight's specimens · tap to open",
    rank: 'RANK',
    upgrades: 'Upgrades',
    stars: '★ {n}/{max}',
    nextRank: 'Next rank at ★{n}',
    deliverFirst: 'Deliver {name} first.',
    lastSpecimen: 'the last specimen',
    orderNo: 'WORK ORDER #000{num}',
    training: 'TRAINING',
    learner: 'L',
    deepShift: 'DEEP SHIFT ×3',
    locked: 'LOCKED',
    par: 'Par {time}',
    best: 'Best {time}',
    notAttempted: 'Not yet attempted',
    deliverToUnlock: 'Deliver {name} to unlock',
    missionConcept: 'MISSION CONCEPT · NOT PLAYABLE',
    sunriseIn: 'Sunrise in {time}',
  },

  memo: {
    // v4 progression
    recommended: 'Start with {route} · {tip}',
    incoming: 'INCOMING MEMO',
    to: 'TO: Intern Zib',
    from: 'FROM: Supervisor Vrell',
    re: 'RE: {re}',
    goals: 'PERFORMANCE GOALS',
    deepGoals: ['{star} — before sunrise ({time})', '{star} — never spotted, no failed jobs', '{star} — {time} of night to spare'],
    tutorialGoals: ['{star} — specimen through the hatch', '{star} — never wakes up', '{star} — whole job under {time}'],
    signoff: '— Vrell. Sent from my clipboard.',
    startShift: 'Start shift',
  },

  /** Work order text per level id. */
  levels: {
    level1: {
      title: 'Farmer Doyle Sleeps Like a Log',
      location: 'Doyle Farm · Route 9',
      blurb: 'Big man. Bigger snore. Light-sleeper dog.',
      human: 'Farmer Doyle',
      collect: 'Farmer Doyle',
      re: 'Work Order #0001 — Farmer Doyle (Probation)',
      body: "Welcome to the night shift, Zib. Your first specimen is Farmer Doyle, 58: sleeps like a log, snores like a chainsaw. Dodge the pickup's headlights and the yard dog. Pass probation and we might even issue you a lanyard.",
      joke: "Reminder: specimens must arrive undamaged, unbruised and ideally unaware. Last quarter's intern returned a man still clutching his toaster. We do not speak his name.",
      signoff: '— Vrell. Sent from my clipboard.', // v4 story
    },
    level2: {
      title: 'Laundromat Larry, Night Attendant',
      location: 'Spin City Laundromat · Main St',
      blurb: 'Asleep in a rolling chair. Boxers in the dryer.',
      human: 'Larry',
      collect: 'Laundromat Larry',
      re: 'Work Order #0002 — Laundromat Larry',
      body: "Doyle's pickup headed into town, and his missing-slipper flyer is already pinned up at Spin City Laundromat. Grab Larry, the night attendant—six years asleep on duty, a Bureau role model. Watch the van, the diner neon, and the power lines.",
      joke: "Power lines are solid. Last quarter's intern learned that right before the toaster incident. If anything from the dryer comes along—boxers, an odd sock—use tongs.",
      signoff: '— Vrell. Still watching.', // v4 story
    },
    level3: {
      title: 'Cul-de-Sac Sweep',
      location: 'Maple Court · suburbia',
      blurb: 'Three specimens. One cruiser. One Mrs. Pruitt.',
      human: 'Dave, Barb & Gary',
      collect: 'Dave, Barb & Gary',
      re: 'Work Order #0003 — Maple Court (bulk order)',
      body: "Training is over. Maple Court has three targets before dawn: Dentist Dave, Coach Barb, and Gary from Neighbourhood Watch. Dodge the cruiser and Mrs. Pruitt's binoculars—she hasn't slept since 1994 and logs everything in a binder.",
      joke: 'Gary rigged his garage with laser tripwires to catch prowlers. In eleven years they have caught Gary eleven times. Do not become entry twelve.',
      signoff: '— Vrell. Co-signed under mild protest.', // v4 story
    },
    level4: {
      title: 'Downtown Graveyard Shift',
      location: 'Grimsby city centre',
      blurb: 'A museum, a nightclub and City Hall. A helicopter.',
      human: 'Nigel, Kev & the Mayor',
      collect: 'Nigel, Kev & the Mayor',
      re: 'Work Order #0004 — Grimsby Centre (containment)',
      body: "Thanks to Gary's CCTV complaint and Mrs. Pruitt's photo on City Hall's board, Head Office wants a civic audit: Night Guard Nigel at the museum, DJ Kev at the Bassment, and Mayor Whitlock. Watch the police chopper, traffic, and neon.",
      joke: "The Mayor is an elected official, so file Form 9-V (Votes, Alien). Also check Nigel's ledger—someone shipped an unlisted black rock out of that museum last week.",
      signoff: '— Vrell. My eye is twitching.', // v4 story
    },
    level5: {
      title: 'Pier Pressure',
      location: 'Barnacle Bay · seaside',
      blurb: 'A dolphin, a lighthouse and a fish accountant.',
      human: 'Bubbles, Pete & Sal',
      collect: 'Bubbles, Pete & Sal',
      re: 'Work Order #0005 — Barnacle Bay (species revision)',
      body: "The Mayor's desk flagged an unaccounted crate down at Barnacle Bay—and Head Office now doubts humans are even the second-smartest species here. Grab Bubbles the dolphin, Harbourmaster Pete, and Sal. Hide behind tall things from the lighthouse. Keep the mammal damp.",
      joke: 'We tried whales once; the paperwork ran four volumes. If Bubbles offers legal advice, ignore her—you are not authorised to lose an argument to a mammal who outranks you.',
      signoff: '— Vrell. Smells like fish in here.', // v4 story
    },
    level6: {
      title: 'Probe Compliance',
      location: "St. Mildred's General · Endoscopy Wing",
      blurb: 'Form 7-B. Two readings each. Nobody wakes up.',
      human: 'Hank, Dr. Osei & Mr. Pemberton',
      collect: 'Hank, Dr. Osei & Mr. Pemberton',
      re: 'Work Order #0006 — Mandatory Form 7-B Audit',
      body: "Pete's lighthouse log reached Head Office, and Compliance noticed zero probes logged all quarter. Worse: humans queue voluntarily to be probed here and leave four-star reviews. Collect Hank, Dr. Osei and Mr. Pemberton with Form 7-B ticked en route.",
      joke: 'Our probe has been a brass thermometer and a clipboard since 1953. We have no idea where humans got their other theories. Frankly, we are insulted.',
      signoff: '— Vrell. Co-signed in triplicate (send help).', // v4 story
    },
    // v4 L8
    level8: {
      title: "Prior Contact",
      location: "Patent Valley · before dawn",
      blurb: "Four field witnesses and one patent clerk before dawn.",
      human: "Flint, Reed & Echo",
      collect: "Four field witnesses and Echo",
      re: "Work Order #0008 — Prior Art (Deadline)",
      body: "Temporal Dispatch found Krix—our old toaster intern—three million years upstream. His OBELISK™ slab taught apes to patent our beam. Hover over two apes from Flint's troop and two from Reed's, then lift Echo from the archive before she files at dawn. A slab's centre is quiet.",
      joke: "I broke into Temporal Dispatch for this, Zib. If a bone flies in Echo's cave, duck—Legal says catching it counts as signing their licence.",
      signoff: "— Vrell. Don't tell Head Office. Good luck, kid.", // v4 story
    },
    level7: {
      title: 'A Whole Cruise Ship',
      location: 'The SS Buffet Royale · at sea',
      blurb: 'The captain, the chef and Greg. The ship rolls.',
      human: 'Captain Sterling, Chef Marco & Greg',
      collect: 'Captain Sterling, Chef Marco & Greg',
      re: 'Work Order #0007 — SS Buffet Royale (off-books)',
      body: "Form 7-B flagged a passenger boarding out of Pete's harbour—on the exact ship carrying Grimsby Museum's missing black stone. Grab Captain Sterling, Chef Marco and all-inclusive Greg. The Captain naps with the manifest in his jacket; we'll check his pockets at debrief. Dodge the deck photographer and brace for the swell.",
      joke: "Budget approved by nobody; we're billing this as maritime research. Mrs. Pruitt's sister Doris is on deck with the same binder. Do not beam up the shrimp tower.",
      signoff: '— Vrell. Burn this memo after reading.', // v4 story
    },
  },

  missionConcepts: [
    { title: 'The Gym Bro', blurb: 'Bench-presses 140 kg. Mostly protein shake by weight.' },
    { title: "Grandma's Bingo Night", blurb: 'Forty grandmas. One of them is armed with a dabber.' },
    { title: 'Area 51 Gift Shop', blurb: 'They sell plush Vrells. Vrell did not sign a likeness release.' },
  ],

  /** Entry labels on the flight map ("Window — easy"). */
  routes,

  /** In RANKS order. */
  ranks: [
    { title: 'Intern', flavour: 'Unpaid. Zero parking ring.' },
    { title: 'Probationary Abductor', flavour: 'Promising, if bonky. No toasters.' },
    { title: 'Abductor', flavour: 'Lanyard privileges unlocked.' },
    { title: 'Senior Abductor', flavour: 'Own parking ring. Still behind Bubbles.' },
    { title: 'Abduction Lead', flavour: "Signs other people's forms. Rarely reads them." },
    { title: 'Head of Internal Affairs', flavour: 'Trusted with the 1953 brass thermometer.' },
    { title: 'Fleet Admiral of Naps', flavour: 'Salary pending. Vrell is "looking into it".' },
  ],

  // v4 L8 time trial
  timeTrial: {
    // v4 council
    left: "LEFT",
    banner: "Two from each troop + Echo",
    hover: "Hover for a second to beam up an ape",
    ghost: "{star} — never spotted",
    count: "{n}/5 apes",
    stars: ["Quota met", "Ghost", "Night owl"],
    ranOut: "ran out: time's up",
    badge: "TIME TRIAL ×5",
  },

  starLabels: {
    tutorial: ['Delivered', 'Still asleep', 'Night owl'],
    deep: ['Delivered all 3', 'Ghost', 'Night owl'],
  },

  shop: {
    title: 'BEAM SHOP',
    subtitle: 'Supplies for the discerning abductor',
    whereRoom: 'IN THE ROOM',
    whereBoth: 'FLIGHT + ROOM',
    whereFlight: 'IN FLIGHT',
    buy: 'Buy · {price}',
    need: 'Need {price}',
    installed: 'INSTALLED',
    salesFinal: 'All sales final. Refunds are a human concept.',
    snoozeIcon: 'Zz',
    hushIcon: 'shh',
    upgrades,
  },

  abort: {
    title: 'SHIFT PAUSED',
    lines: [
      'Abduction abandoned. I have been notified. I am always notified.',
      'Walking away is allowed. Once. I am writing it down.',
      'You gave up. The specimen, blissfully, did not notice.',
    ],
    pick: 'Pick an option. Any option. Quickly.',
    retryRoom: 'Retry room',
  },

  deepChoice: {
    titles: { woke: 'SPECIMEN AWAKE', sleeper: 'SOMEONE WOKE UP', alarm: 'ALARM!', aborted: 'SHIFT PAUSED' },
    failed: 'FAILED',
    building: '{name} · {route}',
    retry: 'Retry ({name})',
    abandon: 'Abandon shift',
    sunriseIn: 'Sunrise in {time}',
  },

  report: {
    title: 'SPECIMEN REPORT',
    subtitle: 'Form 27-B/6 · Subject: {name} · Via: {route}',
    subtitleDeep: 'Form 27-B/6 (bulk) · {location}',
    totalTime: 'Total time',
    totalTimeValue: '{total}  (fly {fly} · beam {beam})',
    bonked: 'Times bonked',
    dignity: 'Dignity remaining',
    snores: 'Snores recorded',
    items: 'Items stolen from Earth',
    spotted: 'Times spotted',
    shiftTime: 'Shift time',
    ranOut: 'ran out: sun up at {h}:00 AM',
    usedSpare: '{used} used · {left} to spare',
    delivered: 'Specimens delivered',
    deliveredValue: '{n}/3',
    deliveredNames: '{n}/3  ({names})',
    failedAbductions: 'Failed abductions',
    avgDignity: 'Avg. dignity remaining',
    percent: '{n}%',
    stampDelivered: 'DELIVERED',
    stampSunrise: 'SUNRISE',
    stampRejected: 'REJECTED',
    newStar: 'NEW!',
    plusGlorbs: '+{n} Glorbs',
    promoted: 'PROMOTED: {rank}!',
    unlocked: 'New work order unlocked!',
    /** Joins name lists: "Dave, Barb". */
    listSep: ', ',
  },

  /** v3 report additions (docs/GDD-3-new-shifts.md): ID photo, cover story, tabloid. Report code. */
  reportExtras: {
    approved: 'APPROVED',
    masthead: 'THE GRIMSBY GAZETTE',
    readings: 'Form 7-B readings',
    /** Vrell's cover story. {cause} from `causes`, {item} one souvenir, {n} sightings. */
    cover: {
      item: ['Filed as: {cause} off one disputed {item}.', 'Filed as: {cause}. Also missing: one {item}. Unrelated.', 'Filed as: {cause}. Only clue: one {item}.'],
      spotted: ['Filed as: {cause}. {n} witnesses, all reclassified as dreaming.', 'Filed as: {cause}. {n} sightings, mostly by people in dressing gowns.'],
      clean: ['Filed as: {cause}. Nobody saw a thing. Nobody ever does.', 'Filed as: {cause}. Case closed before it opened.'],
      sunrise: ['Filed as: {cause}, at dawn. Head Office is not buying it.', 'Filed as: {cause}. The sunrise made it hard to argue.'],
    },
    causes: {
      level1: ['swamp gas', 'a very tall barn owl', 'a combine harvester with ambitions'],
      level2: ['a washing machine on spin', 'reflections off the diner sign', 'static from a lost sock'],
      level3: ['a weather balloon', "Gary's neighbourhood watch drone", 'Venus, again'],
      level4: ['a drone show nobody booked', "the Mayor's new streetlight scheme", 'a lost blimp'],
      level5: ['a glowing jellyfish', 'the lighthouse having a funny turn', 'unusually assertive sea mist'],
      level6: ['an air ambulance', 'a routine fire drill', 'the vending machine'],
      // v4 L8
      level8: ["a bone in low orbit", "a timpani solo"],
      level7: ['a fireworks display', "the captain's karaoke spotlight", 'a very large seagull'],
      generic: ['swamp gas', 'a weather balloon', 'Venus'],
    } as Record<string, Lines>,
    /** Stamped on the report when the saucer was spotted twice or more. All caps, PG. */
    headlines: {
      level1: ['FARMER FLOATS OUT OF PYJAMAS, DOG "SAW NOTHING"', 'COWS DENY ALL KNOWLEDGE OF SAUCER'],
      level2: ['LAUNDROMAT MAN VANISHES MID-SPIN, COFFEE STILL WARM', 'SOCK SHORTAGE: ALIENS BLAMED AT LAST'],
      level3: ['BLURRY HUBCAP MOVES FROM FARM TO SUBURBS — GARY DEMANDS LASER BUDGET', 'CUL-DE-SAC "TOO QUIET", SAYS WOMAN WITH BINOCULARS', 'GARY WAS RIGHT, SAYS GARY'],
      level4: ['PRUITT PHOTO HITS CITY HALL AS MAYOR VANISHES MID-NAP', 'MAYOR BEAMED UP, CITY HALL RUNS AS NORMAL', 'HELICOPTER CHASES "HUBCAP WITH HEADLIGHTS" FOR TWO HOURS'],
      level5: ['FLYING HUBCAP STEALS DOLPHIN, LEAVES POLITE NOTE', 'HUBCAP SPOTTED AT PIER — AQUARIUM DOLPHIN LEAVES NOTE, QUITS', 'LIGHTHOUSE KEEPER: "IT WASN\'T A BOAT"'],
      level6: ['LOCAL MAN PROBED WITH GOOSE FEATHER, RATES EXPERIENCE 4/5', "ST. MILDRED'S PATIENTS PROBED BY FEATHER, RATE WAIT TIME 'FASTER'", 'HOSPITAL WAITING TIMES DROP AS PATIENTS VANISH'],
      // v4 L8
      level8: ['PREHISTORIC APE PATENTS SKY — FILING DEADLINE MISSED BY SECONDS', 'LOCAL APE THROWS BONE, LAWYERS CLAIM AIRSPACE', 'SLAB INVOKES RIGHT TO REMAIN SILENT, HUMS ANYWAY'],
      level7: ["CRUISE GUESTS SNAP UFO — MRS. PRUITT'S SISTER CLAIMS £14.99 BOUNTY", 'CRUISE GUESTS REPORT UFO, ALSO FREE SHRIMP', 'CAPTAIN MISSING, SHIP SAILS ON, NOBODY NOTICES'],
      generic: ['SAUCER SEEN AGAIN, COUNCIL "LOOKING INTO IT"', 'ALIENS SPOTTED: "THEY WAVED"', 'LOCAL SKY HAS "A THING IN IT", EXPERTS CONFIRM'],
    } as Record<string, Lines>,
  },

  hud: {
    time: 'TIME',
    seen: 'SEEN!',
    cooling: 'COOLING…',
    suspicion: 'SUSPICION',
    seconds: 's',
    fuse: '{s} s fuse',
    sunrise: 'SUNRISE!',
    shift: 'SHIFT',
    sunComing: "SUN'S COMING UP!",
  },

  flight: {
    woof: 'WOOF!',
    woofQ: 'woof?',
    specimen: 'specimen',
    orderNo: 'WORK ORDER #000{num}',
    collect: 'Collect: {name}',
    tutDrag: 'Drag anywhere to fly',
    tutRelease: 'Let go to hover',
    tutHold: 'Hover in a ring for 1 s to lock on',
    spotted: 'SPOTTED!',
    timesSpotted: 'Times spotted tonight: {n}',
    tapRetry: 'Tap to try again',
    collected: 'COLLECTED',
    checkpoint: 'CHECKPOINT',
    collectAll: 'Collect all three before dawn',
    seenRule: 'Seen for {s} s = spotted',
    banner: 'WORK ORDER #000{num} · SUNRISE AT {h}:00',
    secured: 'SPECIMEN SECURED',
    backToCheckpoint: 'back to the last checkpoint…',
    countOf: '{n} of 3',
    /** "Window — easy" on the map. */
    entrySep: ' — ',
    spinCity: 'SPIN CITY',
    /** A delivered specimen is missed, eventually (by short name). */
    missed: {
      Dave: ['Dave? DAVE?', 'He sleepwalks. It is fine.', 'Did the Hendersons take Dave?'],
      Barb: ['Coach? ...Coach?', 'Biscuit, where did she go?'],
      Gary: ['HQ, come in. HQ?', 'Watch log: Gary has left the chair.'],
      Nigel: ['Nigel? The desk is empty.', 'The dinosaurs are unsupervised.'],
      Kev: ['No DJ. No refunds.', 'Who is playing this silence?'],
      Mayor: ['Mr. Mayor? Sir?', 'His tea is still warm.'],
      // L5 pier code
      Bubbles: ['Bubbles? Who left a damp note?', 'The sea lion is running the show now.'],
      Pete: ['Pete? Who is minding the lamp?', 'The kettle is on, where is Pete?'],
      Sal: ['Sal? The ledger says one missing.', 'Kipper, where did she go?'],
      // L6 clinic code
      Hank: ['Now serving… 347? Anyone?', 'Hank left his prep jug behind.'],
      Osei: ['Paging Dr. Osei. Still paging.', 'Her pager is buzzing by itself.'],
      Pemberton: ['Bay 3 is empty. He left four stars.', 'Mr. Pemberton? Did he float out?'],
      // L7 cruise code
      // v4 L8
      Flint: ["Who took the control thumb?"],
      Reed: ["The understudy demands a solo."],
      Echo: ["The clerk is missing."],
      Captain: ['Bridge to Captain? Anyone?', 'The ship is steering itself. Act calm.'],
      Marco: ['Chef? The soufflé is asking for you.', 'The dessert trolley is unsupervised.'],
      Greg: ['Anyone seen Greg? His towels are here.', 'Lounger 14 is free! Greg is gone!'],
    } satisfies Record<string, Lines>,
    /** The "Exhibit A" photo on the SPOTTED! card. */
    photo: {
      labels: {
        police: 'Exhibit A · Unit 4 dashcam',
        patrol: 'Exhibit A · patrol car dashcam',
        traffic: 'Exhibit A · taxi dashcam (1 star)',
        porch: 'Exhibit A · doorbell camera',
        watcher: "Exhibit A · Mrs. Pruitt's binoculars",
        dog: 'Exhibit A · photo taken by a dog',
        heli: 'Exhibit A · Air Unit 1, nose camera',
        camera: 'Exhibit A · CCTV, camera 3',
        window: 'Exhibit A · phone, 14th floor',
        // L5 pier code
        lighthouse: 'Exhibit A · lighthouse logbook',
        // L6 clinic code
        ambulance: 'Exhibit A · ambulance dashcam, Unit 7',
        // L7 cruise code
        // v4 L8
        hum: "Exhibit A · fossilised vibration",
        photographer: 'Exhibit A · official cruise photo, £14.99',
        steward: "Exhibit A · steward's phone, deck 9",
      },
      fare: 'FARE 12.40',
      unit4: 'UNIT 4',
      patrol2: 'PATROL 2',
      rec: 'REC',
      motion: 'MOTION AT YOUR DOOR',
      cam: 'CAM 03',
      air: 'AIR-1 · TARGET: UNCLEAR',
      alt: 'ALT 300 FT',
      live: 'LIVE',
      watching: '2 watching',
      clock: '{clock} AM',
    },
  },

  abduct: {
    wake: 'WAKE',
    awake: 'AWAKE!',
    holdingOn: 'HOLDING ON!',
    cameraFuse: 'CAMERA FUSE',
    onCamera: 'ON CAMERA!',
    shakeGrip: 'Shake the beam to break their grip!',
    /** The beam heads for a held finger or mouse button. */
    pointBeam: 'Hold where they should go — gently!',
    /** Training rooms, after the first lift: the loose item can come along. */
    souvenirHint: 'Souvenir! Swing past the glinting item.',
    /** Caption under both rotate buttons (the arrow icon shows the direction). */
    turn: 'TURN',
    turnHintMouse: 'Wheel or Q / E to turn them',
    turnHintTouch: 'Twist two fingers to turn them',
    snoozeHint: 'Double-tap · Snooze Ray',
    alarmTripped: 'ALARM TRIPPED',
    sleeperWoke: 'LIGHT SLEEPER WOKE',
    specimenWoke: 'SPECIMEN WOKE',
    defaultCaption: 'Unscheduled human feedback received.',
    /** By sleeper name. */
    sleeperCaptions: {
      Brenda: 'Brenda was promised one night off.',
      Biscuit: 'The dog would like a word with the management.',
      Tiny: 'Your names are officially off the guest list.',
      // L5 pier code
      Barnacle: 'Barnacle demands fish, an apology and a louder clap.',
      Kipper: 'Kipper is management. You have woken management.',
      // L6 clinic code
      Gladys: 'Nurse Gladys has moved you to the back of the queue.',
      Roland: 'Roland has stamped your abduction NON-COMPLIANT.',
      // L7 cruise code
      // v4 L8
      Anchovy: 'Anchovy is now in command of the bridge.',
    } satisfies Record<string, string>,
    sleeperShouts: {
      Brenda: 'DAVE?! Who is THAT?',
      Biscuit: 'WOOF! WOOF! WOOF!',
      Tiny: 'NOT ON THE LIST!',
      // L5 pier code
      Barnacle: 'ARF! ARF! ARF!',
      Kipper: 'MRROW?!',
      // L6 clinic code
      Gladys: 'TAKE A TICKET!',
      Roland: 'OUT OF CODE!',
      // L7 cruise code
      // v4 L8
      Anchovy: 'MEOW! ALL HANDS!',
    } satisfies Record<string, string>,
    noSleeping: 'NO SLEEPING',
    onDuty: 'ON DUTY',
    zzz: 'Zzz',
    woof: 'WOOF!',
    crash: 'CRASH!',
    cuckoo: 'CUCKOO!',
  },

  humor: {
    spottedCaptions: [
      'Witness describes "a big rude frisbee".',
      'Local man calls his mum. She does not believe him either.',
      'Pyjama-clad human now has a podcast about this.',
      'Blurry photo posted. 3 likes. One is his mum.',
      'Sighting logged by the Neighbourhood Watch (one guy).',
      'Witness yells "MARGE". There is no Marge.',
      'Local paper headline: "Lights. Again. Probably Gary."',
      "Witness demands to see your probe permit. Vrell did not mention a permit.",
    ],
    spottedShouts: ['MAAARGE!', "IT'S THEM!", 'I KNEW IT!', 'Not again…', 'HONEY, CAMERA!'],
    zib,
    vrell,
    /** Stolen-items list when nothing came along. */
    itemsNone: 'none',
    deepZib,
    spotCaptions: spotCaptions satisfies Record<string, Lines>,
    spotShouts: {
      police: ['UNIT 4, UFO!', 'FREEZE! …PLEASE?'],
      patrol: ['10-4, SAUCER!', 'BACKUP!'],
      watcher: ['I KNEW IT!', 'DOROTHY! THE BOOK!'],
      heli: ['GOT A VISUAL!', 'TALLY-HO!'],
      dog: ['WOOF!', 'MAAARGE!'],
      // L5 pier code
      lighthouse: ['NOT A BOAT!', 'LIGHTS ON, MATE!'],
      // L6 clinic code
      ambulance: ['CLEAR THE LANE!', 'CODE… SAUCER?!'],
      // L7 cruise code
      // v4 L8
      hum: ["I HEAR YOU."],
      photographer: ['SAY CHEESE!', 'HOLD THAT POSE!'],
      steward: ['BOARDING CARD!', 'SIR! SIR!'],
    } satisfies Record<string, Lines>,
    spotZib: {
      police: ['The cop saw me. Respawning at the last specimen. Act like it was a different saucer.', 'Unit 4 again! At this point we should exchange Christmas cards.'],
      patrol: ['Patrol car got me. Back to the checkpoint. Different saucer, different saucer.'],
      traffic: ['A TAXI saw me. Of all the things to be seen by.'],
      porch: ["Motion sensor. I was moving. That's on me.", 'Motion light again. Maybe if I hover VERY slowly? No. Tried that.'],
      watcher: ['Mrs. Pruitt. Of course. She sees everything. She saw the moon landing coming.', 'Mrs. Pruitt locked on faster than my tractor beam. Respect, honestly.'],
      dog: ['The dog told. Dogs always tell.'],
      heli: ['The circle got me. I said stay out of the circle.', 'Helicopter again! Why does this town have an air force?!'],
      camera: ["Camera. I'm on the internet now. Mom's going to see this.", 'Caught on CCTV. At least the resolution is terrible.'],
      window: ["The office light. I should've waited for the flicker."],
      // L7 cruise code
      // v4 L8
      hum: ["Aim for the middle, Zib. The rock is deaf in there."],
      photographer: ['Photographed. I blinked. I definitely blinked.', "The frame got me. Leave BEFORE the iris closes, Zib."],
      steward: ['The steward saw me. I am now a "deck incident".', 'Caught by a steward. I do NOT have a boarding card!'],
      // L5 pier code
      lighthouse: ['The lighthouse got me. Hide behind the TALL things, Zib.', 'Lit up like a buoy. Stay in the shadows of the masts.'],
      // L6 clinic code
      ambulance: ['An ambulance got me. Now I really need to lie down.', 'Siren AND headlights. Watch the bay arrows before it launches, Zib.'],
    } satisfies Record<string, Lines>,
    /** `{by}` = what failed you (already translated). */
    abductFail: {
      woke: [
        '{by} woke up and saw everything. {by} is now "processing it" on a forum.',
        '{by} opened one eye. Then the other. Then their mouth. It went downhill from there.',
        "{by} is awake. Specimens are meant to be asleep. It's in the name. Well, it isn't, but it should be.",
      ],
      sleeper: [
        '{by} woke up. Nobody told {by} this was a two-person job.',
        '{by} is awake and has opinions. Loud ones. Retry, quietly.',
        'You woke {by}. {by} was not on the work order. {by} is now on a different work order.',
      ],
      alarm: [
        '{by} triggered. Security has logged it as "a moth". A very large moth.',
        '{by}: alert triggered. Somewhere a monitor is beeping at a man who is asleep.',
        '{by}. Turns out the night security budget was not entirely wasted.',
      ],
      aborted: ['Abduction abandoned. I have been notified. I am always notified.', 'You walked away. The specimen, blissfully, did not notice.'],
    } satisfies Record<string, Lines>,
    garyFail: [
      "{by}. Gary's security system catches its first real intruder. Gary sleeps through it, as tradition demands.",
      "{by}. In eleven years Gary's system has caught Gary eleven times and you once. You're in the record books. Gary's.",
    ],
    /** Who failed you when nobody is named. */
    failAlarm: 'The alarm',
    failSleeper: 'The other sleeper',
    failSpecimen: 'The specimen',
    sunriseMemos: [
      'The sun has come up. On Earth this happens every day. Every. Single. Day. Please plan for it.',
      'Sunrise. The humans are now waking up on their own, which is the opposite of the service we provide.',
      'You ran out of night. Please return the night to the supply cupboard, and fill in the night-return form.',
      'Dawn. I have rescheduled you for tomorrow night. I have rescheduled myself for a lie-down.',
      "It is now morning. The specimens are making toast. We cannot abduct people who are making toast. It's in the treaty.",
      "Dawn. Still beats the tripod division: one Earth cold and the whole fleet called in sick.",
    ],
    deepComments: {
      perfect: [
        'Three specimens, no sightings, home before dawn. I have nothing to complain about and I resent it.',
        'Flawless shift. I have forwarded your report to Head Office with my name on it. Standard procedure.',
        "Flawless. Your mother called Head Office to ask if you're eating enough. Please tell her to stop.",
      ],
      ghost: ['Nobody saw you. Nobody woke up. You are the rumour other interns tell each other.', "One witness did phone the radio. They assumed it was a radio play and hung up."],
      spotted: [
        'All three delivered, and spotted {spotted} times. The local paper ran a special edition. You are on page one.',
        'Delivered. Also: {spotted} sightings. Please stop becoming folklore on company time.',
      ],
      failed: [
        "{failed} failed attempts. The specimens didn't notice. Their neighbours did.",
        'All three, eventually. After {failed} retries. Persistence is a virtue. Efficiency is a bigger one.',
      ],
      close: ["Delivered with {remaining} seconds of night to spare. I watched the clock. I don't have a heart, but if I did."],
      default: ['Three specimens. Adequate. My favourite word, as you know.', 'Shift complete. Please wipe down the beam. Thrice.'],
      gary: ["Gary's own cameras recorded the whole abduction. He'll review the tape in the morning and blame the Hendersons.", "Gary has already filed a neighbourhood alert about a 'suspiciously polite breeze'."],
      mayor: ['You abducted an elected official. On a weeknight. Head Office would like it noted that we did not vote for him.', 'The Mayor slept through the whole abduction. Honestly, an improvement on his council meetings.'],
      // L5 pier code
      pier: [
        'The dolphin left a damp note in perfect cursive. Someone has been coaching her. Accounting has opened a file.',
        'You insisted she is a fish. She is a mammal, intern, and she outranks you.',
      ],
      // L6 clinic code
      clinic: [
        'Form 7-B filed in triplicate. Temperatures normal, reflexes brisk, zero dignity complaints.',
        'Roland graded our clipboard ergonomics 8.5 out of 10 in his sleep. Frame this.',
      ],
      // L7 cruise code
      cruise: ['The cruise line will assume they went to early yoga. Nobody checks early yoga.', 'Captain, chef and Greg, beamed up. The ship is now run by the cat. Engage.'],
      // v4 council: L8 time trial (four apes and Echo, against the clock)
      monolith: [
        'Four witnesses, one patent clerk, {remaining} s to spare. OBELISK™ has filed a complaint. Late.',
        "Prior art seized. The apes are now 'consultants'. Flint wants a parking ring. Flint can wait.",
        "Echo is in the hold, still filing. I stamped every one of her forms 'VOID'. It felt wonderful.",
      ],
      monolithSpotted: [
        'Done, but the apes saw you {spotted} times. They are already painting it on the cave wall.',
        "{spotted} sightings, three million years ago. Historians will call it the first UFO. Thanks, Zib.",
      ],
    },
    // v4 story: Vrell's scripted arc lines on a level's first delivery
    storyFirstClear: {
      level1: "Not dead, not fired, and Doyle is in the hold. Take Route 9 into town—Spin City's night clerk is next.",
      level2: 'Larry is logged, and Accounting traced forty missing socks to your saucer. Off training, Zib—Maple Court awaits.',
      level3: "Suburbia cleared, though Gary filed a complaint and Mrs. Pruitt mailed your photo to City Hall. We're going downtown.",
      level4: "Mayor returned, mostly intact. Nigel's ledger has a black rock sold to a 'maritime buyer', and the Mayor's desk logged its crate to Barnacle Bay. Follow the coast.",
      level5: "Bubbles left a polite note—who taught a dolphin to write?—and Pete's log triggered a Compliance audit. Pack the brass thermometer.",
      level6: "Form 7-B passed, dignity barely bruised. Wait—one chart names the cruise ship carrying Grimsby's missing rock. Set sail.",
      level7: "The manifest was in the Captain's jacket. The buyer is OBELISK™—signed by our old toaster intern, Krix. Basement B-4. Bring a crowbar.",
      level8: "Deadline beaten, patents voided, and Krix is getting audited. You're hired, Zib. Actual salary. Don't touch the time dial.",
    },
  },

  /** Tutorial sleep-talk (rooms without their own mumbles). */
  mumbles: [
    'Five more minutes…',
    'Not the geese, Linda.',
    'I’m the captain of the pudding.',
    'The moon owes me six dollars.',
    'That’s my emergency lasagna.',
    'Put the hamster on payroll.',
    'No, the barn is wearing ME.',
    'I already folded Tuesday.',
    'The soup needs a seat belt.',
    'Tell the mayor I’m a sandwich.',
    'Where’s my formal slipper?',
    'I did the taxes in crayon.',
    'Don’t iron the waffles.',
    'The cheese knows what it did.',
    'Sir, this is a pillow.',
  ],

  /** Stolen items, by the item's id (its English name in the room data). */
  items: {
    slipper: { one: '{n} slipper', other: '{n} slippers' },
    'coffee mug': { one: '{n} coffee mug', other: '{n} coffee mugs' },
    'orthodontic slipper': { one: '{n} orthodontic slipper', other: '{n} orthodontic slippers' },
    'team-issued slipper': { one: '{n} team-issued slipper', other: '{n} team-issued slippers' },
    'neighbourhood watch mug': { one: '{n} neighbourhood watch mug', other: '{n} neighbourhood watch mugs' },
    'fossilized coffee': { one: '{n} fossilized coffee', other: '{n} fossilized coffees' },
    'limited-edition DJ mug': { one: '{n} limited-edition DJ mug', other: '{n} limited-edition DJ mugs' },
    'municipal mug': { one: '{n} municipal mug', other: '{n} municipal mugs' },
    // L5 pier code
    'sardine tin': { one: '{n} sardine tin', other: '{n} sardine tins' },
    'harbourmaster mug': { one: '{n} harbourmaster mug', other: '{n} harbourmaster mugs' },
    'accounts mug': { one: '{n} accounts mug', other: '{n} accounts mugs' },
    // L6 clinic code
    'jug of prep drink': { one: '{n} jug of prep drink', other: '{n} jugs of prep drink' },
    'on-call coffee': { one: '{n} on-call coffee', other: '{n} on-call coffees' },
    'hospital sock': { one: '{n} hospital sock', other: '{n} hospital socks' },
    // L7 cruise code
    "captain's mug": { one: "{n} captain's mug", other: "{n} captain's mugs" },
    'chocolate éclair': { one: '{n} chocolate éclair', other: '{n} chocolate éclairs' },
    // v4 L8
    'first-edition bone': { one: "{n} first-edition bone", other: "{n} first-edition bones" },
    'complimentary towel swan': { one: '{n} complimentary towel swan', other: '{n} complimentary towel swans' },
    // v4 items & recap humour
    'prize marrow': { one: '{n} prize marrow', other: '{n} prize marrows' },
    'heart-print boxers': { one: '{n} pair of heart-print boxers', other: '{n} pairs of heart-print boxers' },
    'odd sock': { one: '{n} odd sock', other: '{n} odd socks' },
    'demo dentures': { one: '{n} set of demo dentures', other: '{n} sets of demo dentures' },
    "coach's whistle": { one: "{n} coach's whistle", other: "{n} coach's whistles" },
    'tinfoil hat': { one: '{n} tinfoil hat', other: '{n} tinfoil hats' },
    'UFO snow globe': { one: '{n} UFO snow globe', other: '{n} UFO snow globes' },
    '12-inch remix': { one: '{n} 12-inch remix', other: '{n} 12-inch remixes' },
    'mayoral toupee': { one: '{n} mayoral toupee', other: '{n} mayoral toupees' },
    'rubber duck': { one: '{n} rubber duck', other: '{n} rubber ducks' },
    'ship in a bottle': { one: '{n} ship in a bottle', other: '{n} ships in bottles' },
    'petty cash tin': { one: '{n} petty cash tin', other: '{n} petty cash tins' },
    'silver butt plug': { one: '{n} silver butt plug', other: '{n} silver butt plugs' },
    'inflated rubber glove': { one: '{n} inflated rubber glove', other: '{n} inflated rubber gloves' },
    bedpan: { one: '{n} bedpan', other: '{n} bedpans' },
    "captain's log": { one: "{n} captain's log", other: "{n} captain's logs" },
    'giant pepper mill': { one: '{n} giant pepper mill', other: '{n} giant pepper mills' },
    'lime mankini': { one: '{n} lime mankini', other: '{n} lime mankinis' },
    // v4 easter eggs
    'blue heart pendant': { one: '{n} blue heart pendant', other: '{n} blue heart pendants' },
  } satisfies Record<string, Plural>,

  // v4 items & recap humour
  /**
   * Vrell on the souvenir in the recap (src/levels/souvenir-quips.ts). By item id: `got` = it came
   * back with the specimen, `missed` = it was on that route and stayed behind.
   */
  souvenirs: {
    items: {
      // v4 L8
      'first-edition bone': {
        got: ["A first-edition throwing bone. Keep the receipt. Flint charges royalties every time you drop it.",
          "I asked the slab what this bone does. It played me three notes and put me through to Sales.",
          // v4 easter eggs
          "A first-edition bone, seized before filing. OBELISK™ wanted it as prior art. Now it's OUR prior art.",
          "Bone recovered with seconds to spare. Krix had already stamped it 'PATENT PENDING'. Pending denied."],
        missed: ["The bone stayed on Earth. Three million years from now it'll be in orbit. Let's get it then.",
          "Zib left the bone with Flint's lawyer. Good luck prising anything loose from that grip.",
          // v4 easter eggs
          'The bone stayed in the cave. Echo files it at dawn: one patent, three million years of royalties. To OBELISK™.'],
      },
      // v4 easter eggs: the Captain's mast souvenir (L7)
      'blue heart pendant': {
        got: [
          "A blue heart pendant from the mast. Zib swears they will never, ever let go of it. Let go of it, Zib. It's evidence.",
          'An ocean-blue heart, gift-shop edition: PREMIUM DECK PASS. Mostly enamel. The markup is real.',
          'Zib asked me to sketch them on the sofa wearing only the pendant, like an old French painting. Request denied.',
          'Heart pendant, logged. The Captain will get over it. His heart will carry on. And on. Stop humming, Zib.',
        ],
        missed: [
          'You left the heart pendant on the mast. One day an old sailor will drop it in the sea, and nobody will understand why.',
          'No pendant. The Captain keeps his ocean-blue heart. And a deep, lasting fear of the sky.',
          "The pendant stayed aboard. Good. Zib would have clung to it like driftwood, and there's only room for one.",
        ],
      },
      // L1 Farmer Doyle
      slipper: {
        got: [
          'One slipper. Farmer Doyle now owns a single slipper and a deep suspicion of the sky.',
          'A slipper. Left foot. Head Office has requested the right one by Friday.',
          'Cinderella, but backwards: we kept the slipper AND the man.',
        ],
        missed: [
          'The slipper stayed on the rug. Somewhere a lonely slipper is wondering where its human went.',
          'No slipper? Doyle arrives in one sock and total disbelief. Accounting wanted the full outfit.',
        ],
      },
      'prize marrow': {
        got: [
          "Farmer Doyle's prize marrow. Eleven pounds. He will be inconsolable. Zib, stop giggling.",
          "A prize-winning marrow. Our scientists call it 'impressive'. Our scientists need to get out more.",
          "He measured that marrow every night. Proudly. Out loud. We've filed it under 'agriculture'.",
        ],
        missed: [
          'You left the prize marrow by the hearth. Doyle will be relieved. He cuddles it at night. We saw.',
          'No marrow. Shame. Head Office wanted to know what the whole village keeps whispering about.',
        ],
      },
      // L2 Larry
      'heart-print boxers': {
        got: [
          'Heart-print boxers, fresh from the dryer. Still warm. Put them down, Zib.',
          "Larry's lucky boxers. Judging by Larry, they have never worked.",
          "Boxers, logged as 'Earth flag, small, romantic'. Wash your tentacles.",
        ],
        missed: [
          'You left the boxers in the dryer. Larry gets them back warm and fluffy. Larry wins this round.',
          'No boxers. The dryer kept them. The dryer always keeps something.',
        ],
      },
      'odd sock': {
        got: [
          "One odd sock. So that's where they go. It's us. It was always us.",
          'A single sock. Its partner vanished in 1998. We have that one too. Reunion on Thursday.',
          'The lost sock. Every laundromat on Earth will sleep better tonight. Except this one.',
        ],
        missed: [
          'You left the odd sock. Larry will blame the machine. The machine is innocent. We are not.',
          "No sock. The Bureau's sock collection stays one short of a pair. As always.",
        ],
      },
      // L3 suburbia
      'orthodontic slipper': {
        got: [
          'An orthodontic slipper. It has braces. Of course it has braces.',
          "Dave's orthodontic slipper. He will bill us for the fitting.",
          'Logged: one slipper, straightened. Dave flosses it. We checked.',
        ],
        missed: [
          'You left the orthodontic slipper. Dave arrives with one bare foot and perfect teeth. Small mercies.',
          'No slipper. Brenda will find it and assume he finally ran away. She seemed fine with that.',
        ],
      },
      'demo dentures': {
        got: [
          "Dave's demo dentures. They chatter when you shake them. Zib has named them Gary.",
          'A set of demo dentures. They grinned the whole way up. Deeply unsettling.',
          'Dentures, logged. Head Office asks if humans often remove their teeth. Only the clever ones.',
        ],
        missed: [
          'You left the demo dentures grinning on the side. They saw everything. They will tell no one.',
          'No dentures. Pity. The probe division wanted a closer look at the bite.',
        ],
      },
      'team-issued slipper': {
        got: [
          'A team-issued slipper. Coach Barb will make the whole squad run laps until it turns up.',
          'Team-issued slipper, number 9. The mothership finally has a home kit.',
        ],
        missed: [
          'You left the team slipper. Barb counts her kit every morning. She will blame the mascot.',
          'No slipper. The squad thanks you: one less thing Barb can throw.',
        ],
      },
      "coach's whistle": {
        got: [
          "Barb's whistle. She will have to shout now. She was already shouting.",
          'A whistle. Zib blew it in the corridor. Three departments are now doing push-ups.',
          'Whistle confiscated. Foul on the specimen. Yellow card for the intern.',
        ],
        missed: [
          'You left the whistle. Tomorrow Barb blows it at the sky. Indefinitely.',
          "No whistle. Fine. We'd only have blown it at Zib.",
        ],
      },
      'neighbourhood watch mug': {
        got: [
          "Gary's watch mug: 'I SAW SOMETHING'. Well. Now he has.",
          "The watch mug. Gary's only reliable witness is now in our cupboard.",
        ],
        missed: [
          'You left the watch mug. Tomorrow it sits on his desk, judging him. It was always judging him.',
          'No mug. Gary keeps proof that he has a hobby. Unfortunate.',
        ],
      },
      'tinfoil hat': {
        got: [
          "Gary's tinfoil hat. It works, by the way. Against everyone except us.",
          'A tinfoil hat, handmade. It picks up three radio stations and one of our pilots.',
          'Tinfoil hat, logged. Zib is wearing it. Zib says they can hear the Hendersons.',
        ],
        missed: [
          'You left the tinfoil hat. Gary will wake up, put it on and feel completely vindicated.',
          "No hat. Head Office wanted one for the museum: 'Humans who almost figured it out'.",
        ],
      },
      // L4 downtown
      'fossilized coffee': {
        got: [
          "Nigel's fossilized coffee. Carbon-dated to last Tuesday. Still more awake than Nigel.",
          'A coffee old enough for its own display case. The museum may want it back.',
        ],
        missed: [
          'You left the fossilized coffee. Good. It was the only thing in that museum still on duty.',
          "No coffee. Nigel's cup stays put, slowly becoming an exhibit.",
        ],
      },
      'UFO snow globe': {
        got: [
          'A gift-shop snow globe of a saucer. Wildly inaccurate: ours has cupholders.',
          'A UFO snow globe. Zib shook it and cried a little. Homesick, apparently.',
          "The museum sells snow globes of us. We've never seen a penny. Legal is on it.",
        ],
        missed: [
          'You left the snow globe. A tiny plastic saucer stays on Earth, doing a better job than you.',
          'No snow globe. Shame. It was the only accurate exhibit in the building.',
        ],
      },
      'limited-edition DJ mug': {
        got: [
          "Kev's limited-edition mug. Edition of one. On Earth, now an edition of none.",
          "The DJ mug says 'DROP THE BASS'. We dropped the DJ instead.",
        ],
        missed: [
          'You left the DJ mug. Kev keeps the vibe. The vibe is lukewarm tea.',
          'No mug. His fans can fight over it at auction. Both of them.',
        ],
      },
      '12-inch remix': {
        got: [
          "Kev's 12-inch. He says it's a remix. They always say it's a remix.",
          "A 12-inch remix. Zib played it backwards. It says 'go to bed, Kev'.",
          'One 12-inch, logged. Head Office asks if it is really twelve. The sleeve says so. Sleeves lie.',
        ],
        missed: [
          "You left the 12-inch on the decks. Kev will tell everyone it was abducted. It wasn't. He was.",
          'No 12-inch. Kev arrives empty-handed. Which is, frankly, his usual set.',
        ],
      },
      'municipal mug': {
        got: [
          'The municipal mug. Paid for by taxpayers. Technically we now owe your town a mug.',
          "A municipal mug: 'WORLD'S OKAYEST MAYOR'. Accurate.",
        ],
        missed: [
          'You left the municipal mug. It will outlast his term. Most things will.',
          'No mug. The council will vote on whether to miss him. The motion is not expected to pass.',
        ],
      },
      'mayoral toupee': {
        got: [
          "The Mayor's toupee. He will tell the press it was a hostile takeover.",
          'A mayoral toupee. Zib thought it was a pet and fed it. It is now our pet.',
          'Toupee, logged. For once the Mayor is being transparent. On top.',
        ],
        missed: [
          'You left the toupee on the desk. The Mayor arrives bald and furious. Mostly bald.',
          'No toupee. Fine. It had more charisma than he does, and we only had room for one.',
        ],
      },
      // L5 Barnacle Bay
      'sardine tin': {
        got: [
          'An empty sardine tin, fished off the pool floor. So long, and thanks for all the tin.',
          'A sardine tin. Bubbles ate them in 1997. She still brings it up.',
        ],
        missed: [
          'You left the sardine tin on the pool floor. Bubbles will notice. Half of her, anyway.',
          "No tin. You'd have had to dive for it. Zib can't swim. Zib can barely fly.",
        ],
      },
      'rubber duck': {
        got: [
          "A rubber duck. Bubbles' emotional-support duck. She is furious. In two halves.",
          'A rubber duck. Zib squeaked it all the way home. The pilots have filed a grievance.',
          "A rubber duck bobbed up behind the specimen. Zib screamed 'we're gonna need a bigger saucer'.",
        ],
        missed: [
          'You left the rubber duck bobbing in the pool. It saw everything. Ducks always see everything.',
          'No duck. Bubbles is relieved. She lets it win the races.',
        ],
      },
      'harbourmaster mug': {
        got: [
          "The harbourmaster's mug. Still half full of tea. The tea is half full of gull.",
          "Pete's mug. One cup a night, very slowly, staring at the sea. We get it now.",
        ],
        missed: [
          "You left Pete's mug. The tea keeps the kettle company. Pete would want that.",
          'No mug. The gulls will finish his tea. They always do.',
        ],
      },
      'ship in a bottle': {
        got: [
          "Pete's ship in a bottle. Nine years' work. We'll never know how he got it in. Neither does he.",
          "A ship in a bottle. Zib asked how they get in. I said: like specimens, carefully, at night.",
          'Ship in a bottle, logged. Zib held it out at the bow, arms wide, and crowned themself king of the hold.',
        ],
        missed: [
          'You left the ship in a bottle. Good. Pete would have gone down with it.',
          'No bottle. Pity. It was the only ship in the bay that never ran aground.',
        ],
      },
      'accounts mug': {
        got: [
          "Sal's accounts mug, logged under 'assets'. Sal would be proud. Then Sal would invoice us.",
          "The accounts mug: 'I LOVE SPREADSHEETS'. Nobody has ever meant it more.",
        ],
        missed: [
          'You left the accounts mug. One outstanding. Sal will balance it in the morning.',
          'No mug. The ledger stays tidy. The only tidy thing in Barnacle Bay.',
        ],
      },
      'petty cash tin': {
        got: [
          "Sal's petty cash. Fourteen pounds and a button. We're now the most solvent department in the Bureau.",
          'Petty cash tin, logged. Sal\'s ledger now reads "two outstanding".',
          'The petty cash. Kipper says it was never petty. Kipper is a cat. Kipper has opinions.',
        ],
        missed: [
          'You left the petty cash. Good. Sal counts it twice a night, and once more in her sleep.',
          'No cash tin. Kipper will guard it. Kipper takes a cut.',
        ],
      },
      // L6 St. Mildred's
      'jug of prep drink': {
        got: [
          "Hank's prep drink. Four litres. We asked what it's for. The answer was redacted. Twice.",
          'Prep drink: humans drink this voluntarily, the night before. Then they queue. Then they leave a review.',
          "Prep drink, logged. Don't let Zib drink it. Too late. Clear the corridor.",
        ],
        missed: [
          'You left the prep jug. Hank finishes it in the morning. The whole waiting room will hear about it.',
          'No jug. Hank stays fasted and grumpy. Procedurally, he is ready.',
        ],
      },
      'silver butt plug': {
        got: [
          'A silver butt plug from the Internal Affairs corridor. Zib, that is not a very good probe.',
          "That's not a very good probe, Zib. It doesn't even take a temperature. Stop polishing it.",
          "One silver 'device', logged as lost property, Internal Affairs. Nobody will be claiming it.",
          "Silver plug, Form 7-B annex. Under 'purpose' Zib wrote 'decorative?'. Oh, Zib. No.",
        ],
        missed: [
          'You left the silver… item in the corridor. Wise. Some matters are best left to Internal Affairs.',
          'The shiny thing in Endoscopy stays on Earth. Head Office breathes a sigh of relief. Then a second one.',
          'No silver plug. Good. I was not ready to explain that receipt to Accounting.',
        ],
      },
      'on-call coffee': {
        got: [
          "Dr. Osei's on-call coffee. Reheated eleven times. Technically a medical event.",
          'Her coffee. She will look for it before she looks for us. Priorities.',
        ],
        missed: [
          "You left the on-call coffee. Good. Taking a doctor's coffee is how wars start.",
          'No coffee. Dr. Osei keeps the one thing she actually needs. We took the rest of her.',
        ],
      },
      'inflated rubber glove': {
        got: [
          'A rubber glove blown up into a chicken at 4 AM. The happiest thing in the hospital.',
          'An inflated glove. Zib asked what the other gloves are for. I changed the subject. Firmly.',
          "Glove balloon, logged. Fun fact: it's never lupus. Sometimes it's a glove.",
        ],
        missed: [
          'You left the glove balloon. Somewhere in the pharmacy a latex chicken keeps watch. Respect.',
          "No glove. Fine. I don't want to know where that glove has been. I know where that glove has been.",
        ],
      },
      'hospital sock': {
        got: [
          'A hospital sock, grippy dots on both sides. In case he walks on the ceiling. We will test that.',
          "Pemberton's hospital sock. One size fits nobody.",
          'Hospital sock, logged. It still smells of sedative and regret.',
        ],
        missed: [
          "You left the hospital sock. He'll keep his grip on the floor. And, briefly, on reality.",
          'No sock. Pemberton arrives with one cold foot and four stars to give.',
        ],
      },
      bedpan: {
        got: [
          'A bedpan. Unused, Head Office sincerely hopes. Zib, take it off your head.',
          "One bedpan, logged under 'ceremonial helmets'. Zib filed that. Zib may no longer file.",
          'The bedpan came down the laundry chute with us. Some journeys you do not choose.',
        ],
        missed: [
          'You left the bedpan. The right call. The one right call of the shift.',
          "No bedpan. Good. We have our own. Don't ask what for.",
        ],
      },
      // L7 SS Buffet Royale
      "captain's log": {
        got: [
          "The captain's log. A literal log. Stardate: tonight. Don't open it, Zib. Don't sniff it, Zib.",
          "Captain's log, supplemental. Found in the funnel. We chose not to ask how it got there.",
          "One captain's log, logged. Yes, I hear it. No, I'm not changing the form.",
        ],
        missed: [
          "You left the captain's log in the funnel. Good. Some logs are better left unread. And untouched.",
          'No log. The ship keeps its records on board. Downwind, ideally.',
        ],
      },
      'chocolate éclair': {
        got: [
          "One éclair from Marco's trolley. It did not survive the debrief. Neither did my diet.",
          'An éclair. Zib licked it to claim it. Apparently that is how Earth works.',
        ],
        missed: [
          'You left the éclair. Marco will count them. Marco always counts them.',
          "No éclair. I'm not angry. I'm hungry. It's worse.",
        ],
      },
      'giant pepper mill': {
        got: [
          "Marco's giant pepper mill. He says size matters in a kitchen. Zib has been grinding it all night.",
          "A giant pepper mill. Waiters wave it over plates and say 'say when'. Nobody ever says when.",
          "Pepper mill, logged. Head Office has classed it as a light weapon. Marco calls it 'seasoning'.",
        ],
        missed: [
          'You left the giant pepper mill. Marco keeps his dignity. And his pepper. Mostly his pepper.',
          "No pepper mill. Fine. Everything on that ship is giant except the cabins.",
        ],
      },
      'complimentary towel swan': {
        got: [
          'A complimentary towel swan. Greg took three. We took one. Greg would like to speak to the manager.',
          'A towel swan. Zib unfolded it to see how it works. It is now a towel. Zib is grieving.',
        ],
        missed: [
          'You left the towel swan. Greg will complain it was looking at him.',
          'No swan. Fine. Always know where your towel is: ours is in the hold.',
        ],
      },
      'lime mankini': {
        got: [
          "Greg's lime-green mankini. We have quarantined it. It keeps trying to escape.",
          "A mankini. Greg wore it to the captain's dinner. Twice. Very nice. Not nice.",
          "Mankini, logged under 'hazardous textiles'. Do not try it on, Zib. ZIB.",
        ],
        missed: [
          'You left the mankini. The cruise ship will have to live with it. It deserves that.',
          'No mankini. Thank you. Truly. The hold smells of fish already.',
        ],
      },
    } satisfies Record<string, { got: Lines; missed: Lines }>,
    /** Deep levels: every delivered specimen came with its souvenir (`all`), or none did (`none`). */
    levels: {
      level3: {
        all: [
          'A souvenir from every house. The Neighbourhood Watch will call it a crime wave. For once, Gary is right.',
          "Three houses, three souvenirs. The street's group chat has never been so busy.",
        ],
        none: [
          'Three specimens and not one souvenir. The suburb keeps its slippers. I keep my disappointment.',
          'Nothing from the cul-de-sac? You were in their houses, Zib. Their HOUSES.',
        ],
      },
      level4: {
        all: [
          'A souvenir from every stop. The city calls it a crime spree. The museum calls it Tuesday.',
          'Three souvenirs from downtown. Zib has opened a gift shop. Zib is charging me.',
        ],
        none: [
          'Not one souvenir from the whole city. You had a museum, a nightclub and City Hall. A MUSEUM.',
          'Nothing from downtown. The city keeps its stuff, we keep its Mayor. Fair trade.',
        ],
      },
      level5: {
        all: [
          'A souvenir from every building on the pier. The gift shop is filing for bankruptcy.',
          'Three souvenirs, all damp. The hold smells like a harbour. The harbour smells like us.',
        ],
        none: [
          'Not one souvenir from the seaside. Not a tin, not a mug. Just a lot of sand in the hatch.',
          'Nothing from the pier. Head Office wanted a postcard. I sent them the dolphin instead.',
        ],
      },
      level6: {
        all: [
          'A souvenir from every ward. Compliance has opened an inquiry. Internal Affairs, specifically.',
          'Three souvenirs from a hospital. Wash all of them. Some of them twice.',
        ],
        none: [
          "Not one souvenir from St. Mildred's. Hygienic of you. Suspiciously hygienic.",
          'Nothing from the clinic. Wise. Nothing in a hospital should be touched without gloves. Or a form.',
        ],
      },
      level7: {
        all: [
          'A souvenir from every deck. The cruise line calls it theft. We call it all-inclusive.',
          "Three souvenirs from the ship. Greg wants a word with our complaints department. We don't have one.",
        ],
        none: [
          'Not one souvenir from the cruise. All-inclusive, Zib. ALL. INCLUSIVE.',
          'Nothing from the ship. Even Greg takes the towels, and Greg is an amateur.',
        ],
      },
    } satisfies Record<string, { all: Lines; none: Lines }>,
  },

  // v4 easter eggs
  /** Film cameos on the flight maps (src/flight/easter-eggs.ts): Zib's line, once per run. */
  easterEggs: {
    zib: {
      // L2: the time car in Spin City's back lot
      timeCar: [
        'Someone parked a time machine in a laundromat lot. Classic Tuesday.',
        'Scorch marks, gull-wing door, no plates. Whoever owns it is late. Or early.',
        "If that car hits 88 miles per hour, I'm not doing the paperwork.",
      ],
      // L7: the iceberg off the bow
      iceberg: [
        'Iceberg, dead ahead. The buffet will be fine. The buffet is always fine.',
        "Pretty sure that's just the first-class ice bucket.",
        'Small iceberg off the bow. Somebody tell the band to keep playing.',
      ],
    },
  },

  /**
   * Display text for strings that live in level and room data (names, rooms, hazards, exits,
   * captions, mumbles, signs), keyed by that English source text. Game logic keeps using the
   * source text as an id; only drawing goes through `gt()`.
   */
  data: {
    // v4 progression
    'Practice decoy': 'Practice decoy',
    Landing: 'Landing',
    // people
    'Farmer Doyle': 'Farmer Doyle',
    Larry: 'Larry',
    'Dentist Dave': 'Dentist Dave',
    'Coach Barb': 'Coach Barb',
    Gary: 'Gary',
    'Gary, Neighbourhood Watch': 'Gary, Neighbourhood Watch',
    'Night Guard Nigel': 'Night Guard Nigel',
    'DJ Kev': 'DJ Kev',
    'Mayor Whitlock': 'Mayor Whitlock',
    'Mrs. Pruitt': 'Mrs. Pruitt',
    Dave: 'Dave',
    Barb: 'Barb',
    Nigel: 'Nigel',
    Kev: 'Kev',
    Mayor: 'Mayor',
    Brenda: 'Brenda',
    Biscuit: 'Biscuit',
    Tiny: 'Tiny',
    // signs on the flight maps
    EAT: 'EAT',
    BURGERS: 'BURGERS',
    "DON'T PANIC": "DON'T PANIC",
    // Dave's house
    'Master bedroom': 'Master bedroom',
    'Upstairs hall': 'Upstairs hall',
    Attic: 'Attic',
    Stairwell: 'Stairwell',
    'Living room': 'Living room',
    'Grandfather clock': 'Grandfather clock',
    'Hall vacuum': 'Hall vacuum',
    'Attic ladder hatch': 'Attic ladder hatch',
    'Attic bulb': 'Attic bulb',
    'Dental trophy': 'Dental trophy',
    'Creaky stairs': 'Creaky stairs',
    'Living room chandelier': 'Living room chandelier',
    'Living room fan': 'Living room fan',
    'Fish tank': 'Fish tank',
    'Patio screen': 'Patio screen',
    'ROOF HATCH': 'ROOF HATCH',
    'PATIO DOOR': 'PATIO DOOR',
    // Barb's house
    'Fireplace flue': 'Fireplace flue',
    Kitchen: 'Kitchen',
    'Utility room': 'Utility room',
    'Soot draft': 'Soot draft',
    'Soot damper': 'Soot damper',
    'Hanging pans': 'Hanging pans',
    'Dinner plates': 'Dinner plates',
    'Kitchen vacuum': 'Kitchen vacuum',
    'Swinging back door': 'Swinging back door',
    CHIMNEY: 'CHIMNEY',
    'BACK DOOR': 'BACK DOOR',
    // Gary's garage
    "Gary's laser": "Gary's laser",
    'Garage HQ': 'Garage HQ',
    'Loft storage': 'Loft storage',
    'Side workshop': 'Side workshop',
    'Work lamp': 'Work lamp',
    "Gary's camera": "Gary's camera",
    'Watch dog': 'Watch dog',
    'Garage door': 'Garage door',
    'GARAGE SKYLIGHT': 'GARAGE SKYLIGHT',
    'GARAGE DOOR': 'GARAGE DOOR',
    // museum
    'Security office': 'Security office',
    'Dinosaur hall': 'Dinosaur hall',
    'Laser vault': 'Laser vault',
    'Gift shop': 'Gift shop',
    'Loading bay': 'Loading bay',
    Pterodactyl: 'Pterodactyl',
    'Vault grid': 'Vault grid',
    'Skylight grid': 'Skylight grid',
    'Snow globe': 'Snow globe',
    'Cargo shutter': 'Cargo shutter',
    'MUSEUM SKYLIGHT': 'MUSEUM SKYLIGHT',
    'LOADING BAY': 'LOADING BAY',
    // club
    'DJ booth': 'DJ booth',
    'Dance floor': 'Dance floor',
    'Vent duct': 'Vent duct',
    'Green room': 'Green room',
    'Disco ball': 'Disco ball',
    'Bass stack': 'Bass stack',
    'Duct fan': 'Duct fan',
    'Vent updraft': 'Vent updraft',
    'Roof vent flap': 'Roof vent flap',
    'Champagne tower': 'Champagne tower',
    'Fire-escape sash': 'Fire-escape sash',
    'ROOF VENT': 'ROOF VENT',
    'FIRE ESCAPE': 'FIRE ESCAPE',
    // city hall
    'City hall camera': 'City hall camera',
    'Mayor’s office': 'Mayor’s office',
    'City hall corridor': 'City hall corridor',
    'Clock tower': 'Clock tower',
    'Elevator shaft': 'Elevator shaft',
    Vase: 'Vase',
    'Elevator lobby camera': 'Elevator lobby camera',
    'Drive gear': 'Drive gear',
    'Idle gear': 'Idle gear',
    'Tower pendulum': 'Tower pendulum',
    'Clock service hatch': 'Clock service hatch',
    'Shaft safety shutter': 'Shaft safety shutter',
    'Elevator car': 'Elevator car',
    Counterweight: 'Counterweight',
    'Cuckoo bird': 'Cuckoo bird',
    'CLOCK TOWER': 'CLOCK TOWER',
    'ELEVATOR ROOF': 'ELEVATOR ROOF',
    // specimen captions (shown when one wakes)
    'The dentist will be billing for this wake-up call.': 'The dentist will be billing for this wake-up call.',
    'Coach is calling a mandatory time-out.': 'Coach is calling a mandatory time-out.',
    'Gary finally caught something. It was his own abduction.': 'Gary finally caught something. It was his own abduction.',
    'The museum has added you to its Incident Collection.': 'The museum has added you to its Incident Collection.',
    'The beat dropped. So did the performance review.': 'The beat dropped. So did the performance review.',
    'You’ve been added to next Tuesday’s agenda.': 'You’ve been added to next Tuesday’s agenda.',
    // deep-level sleep-talk
    'Floss the moon, please.': 'Floss the moon, please.',
    'That’s a load-bearing molar.': 'That’s a load-bearing molar.',
    'The plaque has a lawyer.': 'The plaque has a lawyer.',
    'No, the drill dreams about me.': 'No, the drill dreams about me.',
    'Give me twenty more naps.': 'Give me twenty more naps.',
    'That’s a foul on the pillow.': 'That’s a foul on the pillow.',
    'Stop stretching the mascot.': 'Stop stretching the mascot.',
    'Everybody hydrate the couch.': 'Everybody hydrate the couch.',
    'That squirrel is casing us.': 'That squirrel is casing us.',
    'Put the begonias on the watchlist.': 'Put the begonias on the watchlist.',
    'Enhance the wheelie bin.': 'Enhance the wheelie bin.',
    'The cul-de-sac needs a password.': 'The cul-de-sac needs a password.',
    'The mummy has a parking pass.': 'The mummy has a parking pass.',
    'Stop feeding the fossils.': 'Stop feeding the fossils.',
    'The T. rex owes me a tenner.': 'The T. rex owes me a tenner.',
    'Please don’t tap on the sarcophagus.': 'Please don’t tap on the sarcophagus.',
    'Next track: ten hours of white noise.': 'Next track: ten hours of white noise.',
    'Drop the bass gently.': 'Drop the bass gently.',
    'My headphones are in a union.': 'My headphones are in a union.',
    'This one goes out to the duvet.': 'This one goes out to the duvet.',
    'I hereby declare it bedtime.': 'I hereby declare it bedtime.',
    'Motion to table the blanket.': 'Motion to table the blanket.',
    'The potholes are polling well.': 'The potholes are polling well.',
    'My pillow has diplomatic immunity.': 'My pillow has diplomatic immunity.',
    'The truth is out there. Lock the back door.': 'The truth is out there. Lock the back door.',
    'The mash needs more altitude.': 'The mash needs more altitude.',
    'Go Saucers! Defence!': 'Go Saucers! Defence!',
    "Don't panic. Where's my towel?": "Don't panic. Where's my towel?",
    'This one goes out to the Martians.': 'This one goes out to the Martians.',
    'The Hendersons moved the hedge again.': 'The Hendersons moved the hedge again.',
    'July 4th speech first. Then upload the virus.': 'July 4th speech first. Then upload the virus.',
    // ---- L5 pier code
    Bubbles: 'Bubbles',
    'Harbourmaster Pete': 'Harbourmaster Pete',
    Pete: 'Pete',
    Sal: 'Sal',
    Barnacle: 'Barnacle',
    Kipper: 'Kipper',
    CHIPS: 'CHIPS',
    Moisture: 'Moisture',
    'Drying out!': 'Drying out!',
    'Show pool': 'Show pool',
    'Sea-lion rocks': 'Sea-lion rocks',
    'Service roof': 'Service roof',
    'Viewing tunnel': 'Viewing tunnel',
    'Jellyfish hall': 'Jellyfish hall',
    'Show hoop': 'Show hoop',
    'Beach ball': 'Beach ball',
    'Roof panel': 'Roof panel',
    Jellyfish: 'Jellyfish',
    'Loading dock door': 'Loading dock door',
    'ROOF PANEL': 'ROOF PANEL',
    'LOADING DOCK': 'LOADING DOCK',
    'Lamp room': 'Lamp room',
    'Lamp gallery': 'Lamp gallery',
    'Spiral stairs': 'Spiral stairs',
    'Weight shaft': 'Weight shaft',
    'Boat shed': 'Boat shed',
    'Lighthouse lens': 'Lighthouse lens',
    'Storm lantern': 'Storm lantern',
    'Spare lamp bulbs': 'Spare lamp bulbs',
    'Creaky spiral stairs': 'Creaky spiral stairs',
    'Clockwork weight': 'Clockwork weight',
    'Slipway door': 'Slipway door',
    'GALLERY WINDOW': 'GALLERY WINDOW',
    'SLIPWAY DOOR': 'SLIPWAY DOOR',
    'Market floor': 'Market floor',
    'Ice chute': 'Ice chute',
    'Cold store': 'Cold store',
    'Hanging scales': 'Hanging scales',
    'Crab pots': 'Crab pots',
    'Ice chute draught': 'Ice chute draught',
    'Chute flap': 'Chute flap',
    'Freezer hook': 'Freezer hook',
    'Fish-crate tower': 'Fish-crate tower',
    'Cold-store dock door': 'Cold-store dock door',
    'Squeaky wet tiles': 'Squeaky wet tiles',
    'Wet duckboards': 'Wet duckboards',
    'Frosty floor': 'Frosty floor',
    'LOFT HATCH': 'LOFT HATCH',
    'DOCK DOOR': 'DOCK DOOR',
    'Bubbles woke the other half of her brain. She is filing a complaint.': 'Bubbles woke the other half of her brain. She is filing a complaint.',
    'The lighthouse has logged you as a hazard to shipping.': 'The lighthouse has logged you as a hazard to shipping.',
    'Sal has entered you in the ledger under "one outstanding".': 'Sal has entered you in the ledger under "one outstanding".',
    'Eee-ee. Tell the penguins I am busy.': 'Eee-ee. Tell the penguins I am busy.',
    'The intern thinks I am a fish. Adorable.': 'The intern thinks I am a fish. Adorable.',
    'Two more laps, then the herring.': 'Two more laps, then the herring.',
    'Half my brain is asleep. Still ahead.': 'Half my brain is asleep. Still ahead.',
    'The bucket is half full. Of fish.': 'The bucket is half full. Of fish.',
    'Ships ahoy… ships asleep.': 'Ships ahoy… ships asleep.',
    'Who moved the sea again?': 'Who moved the sea again?',
    "Light's on, nobody's home.": "Light's on, nobody's home.",
    'Fog’s rolling in. Lovely.': 'Fog’s rolling in. Lovely.',
    'Keep the kettle lit for the gulls.': 'Keep the kettle lit for the gulls.',
    'One outstanding. Always one outstanding.': 'One outstanding. Always one outstanding.',
    'The cod does not balance.': 'The cod does not balance.',
    'Carry the haddock.': 'Carry the haddock.',
    'Kipper, that is not petty cash.': 'Kipper, that is not petty cash.',
    "Receipts or it didn't swim.": "Receipts or it didn't swim.",
    // ---- L6 clinic code
    'Hank': 'Hank',
    'Dr. Osei': 'Dr. Osei',
    'Mr. Pemberton': 'Mr. Pemberton',
    'Osei': 'Osei',
    'Pemberton': 'Pemberton',
    'Gladys': 'Gladys',
    'Roland': 'Roland',
    'NOW SERVING 12': 'NOW SERVING 12',
    'Supply room': 'Supply room',
    'Endoscopy corridor': 'Endoscopy corridor',
    'Waiting room': 'Waiting room',
    'Lobby': 'Lobby',
    'Vestibule': 'Vestibule',
    'Lift shaft': 'Lift shaft',
    'On-call room': 'On-call room',
    'On-call corridor': 'On-call corridor',
    'Pharmacy': 'Pharmacy',
    'Laundry chute': 'Laundry chute',
    'Linen room': 'Linen room',
    'Recovery bay': 'Recovery bay',
    'Ward corridor': 'Ward corridor',
    'Laundry cart': 'Laundry cart',
    'Rear service door': 'Rear service door',
    'Water cooler': 'Water cooler',
    'Revolving door': 'Revolving door',
    'Pager': 'Pager',
    'Lift car': 'Lift car',
    'Lift safety gate': 'Lift safety gate',
    'Corridor camera': 'Corridor camera',
    'Pill shelf': 'Pill shelf',
    'Pharmacy hatch': 'Pharmacy hatch',
    'Ward camera': 'Ward camera',
    'Squeaky lino': 'Squeaky lino',
    'Laundry flap': 'Laundry flap',
    'Chute draft': 'Chute draft',
    'FRONT DOORS': 'FRONT DOORS',
    'REAR ENTRANCE': 'REAR ENTRANCE',
    'ROOF HELIPAD': 'ROOF HELIPAD',
    'PHARMACY HATCH': 'PHARMACY HATCH',
    'RECOVERY WINDOW': 'RECOVERY WINDOW',
    'LAUNDRY CHUTE': 'LAUNDRY CHUTE',
    'Hank has lost his place in the queue.': 'Hank has lost his place in the queue.',
    'Dr. Osei has seen things. Now she has seen us.': 'Dr. Osei has seen things. Now she has seen us.',
    'Mr. Pemberton slept through his own procedure. He will not sleep through this.': 'Mr. Pemberton slept through his own procedure. He will not sleep through this.',
    'Is it my turn yet?': 'Is it my turn yet?',
    'Ticket three-four-seven, present.': 'Ticket three-four-seven, present.',
    'I fasted for this.': 'I fasted for this.',
    'Four stars. The chairs were comfy.': 'Four stars. The chairs were comfy.',
    'Now serving… me?': 'Now serving… me?',
    'Page me if it’s interesting.': 'Page me if it’s interesting.',
    'That is not where the appendix goes.': 'That is not where the appendix goes.',
    'My coffee needs a second opinion.': 'My coffee needs a second opinion.',
    'Hand me the… sandwich.': 'Hand me the… sandwich.',
    'Thirty-one hours. Thirty-two.': 'Thirty-one hours. Thirty-two.',
    'Is it over? Lovely.': 'Is it over? Lovely.',
    'Tell the nurse I was brave.': 'Tell the nurse I was brave.',
    'Four stars. Would sleep again.': 'Four stars. Would sleep again.',
    'No, the other arm.': 'No, the other arm.',
    'Initial here to continue dreaming.': 'Initial here to continue dreaming.',
    'FORM 7-B': 'FORM 7-B',
    'Form 7-B first': 'Form 7-B first',
    'Temperature': 'Temperature',
    'Reflexes': 'Reflexes',
    'Ticklishness': 'Ticklishness',
    'Temperature: lukewarm': 'Temperature: lukewarm',
    'Reflexes: brisk': 'Reflexes: brisk',
    'Ticklishness: extreme': 'Ticklishness: extreme',
    'Temperature: running on coffee': 'Temperature: running on coffee',
    'Reflexes: on call': 'Reflexes: on call',
    'Ticklishness: professionally denied': 'Ticklishness: professionally denied',
    'Temperature: sedated': 'Temperature: sedated',
    'Reflexes: eventually': 'Reflexes: eventually',
    'Ticklishness: unbothered': 'Ticklishness: unbothered',
    // ---- L7 cruise code
    // v4 L8
    "Flint": "Flint",
    "Reed": "Reed",
    "Echo": "Echo",
    "Practice toss": "Practice toss",
    "Loose shale": "Loose shale",
    "Iris stone": "Iris stone",
    "Appeal bell": "Appeal bell",
    "Patent office": "Patent office",
    "Appeal shaft": "Appeal shaft",
    "APPEALS HATCH": "APPEALS HATCH",
    "Echo has filed a claim on the beam.": "Echo has filed a claim on the beam.",
    "Patent pending. Gravity contested.": "Patent pending. Gravity contested.",
    "Please initial the rock.": "Please initial the rock.",
    "Prior art is still art.": "Prior art is still art.",
    "The slab declines to comment.": "The slab declines to comment.",
    Doris: 'Doris',
    'Captain Sterling': 'Captain Sterling',
    'Chef Marco': 'Chef Marco',
    Greg: 'Greg',
    Captain: 'Captain',
    Marco: 'Marco',
    Anchovy: 'Anchovy',
    CASINO: 'CASINO',
    Bridge: 'Bridge',
    'Chart room': 'Chart room',
    Mast: 'Mast',
    'Engine casing': 'Engine casing',
    Funnel: 'Funnel',
    Galley: 'Galley',
    'Galley hood': 'Galley hood',
    'Dining room': 'Dining room',
    'Lido bar': 'Lido bar',
    'Sun deck': 'Sun deck',
    'Cabin corridor': 'Cabin corridor',
    'Cabin 404': 'Cabin 404',
    'Ship roll': 'Ship roll',
    'Chart lamp': 'Chart lamp',
    'Brass compass': 'Brass compass',
    'Chart-room stairs': 'Chart-room stairs',
    'Mast hatch': 'Mast hatch',
    'Engine fan': 'Engine fan',
    'Steam updraft': 'Steam updraft',
    'Dessert trolley': 'Dessert trolley',
    'Hanging ladles': 'Hanging ladles',
    'Hood fan': 'Hood fan',
    'Upper hood fan': 'Upper hood fan',
    'Hood damper': 'Hood damper',
    Chandelier: 'Chandelier',
    'Busboy bot': 'Busboy bot',
    'Chocolate fountain': 'Chocolate fountain',
    'Promenade door': 'Promenade door',
    'Deckchair stack': 'Deckchair stack',
    Lifebuoy: 'Lifebuoy',
    'Awning flap': 'Awning flap',
    'Steward camera': 'Steward camera',
    'Room-service trolley': 'Room-service trolley',
    'MAST HATCH': 'MAST HATCH',
    FUNNEL: 'FUNNEL',
    'GALLEY SKYLIGHT': 'GALLEY SKYLIGHT',
    'PROMENADE DOOR': 'PROMENADE DOOR',
    'SUN-DECK AWNING': 'SUN-DECK AWNING',
    PORTHOLE: 'PORTHOLE',
    'The captain has gone down with the nap.': 'The captain has gone down with the nap.',
    'The chef has sent your compliments back to the kitchen.': 'The chef has sent your compliments back to the kitchen.',
    'Greg would like to speak to the manager of the sky.': 'Greg would like to speak to the manager of the sky.',
    'Make it so… comfy.': 'Make it so… comfy.',
    'Engage the snooze button.': 'Engage the snooze button.',
    'Set a course for the buffet. Warp nine.': 'Set a course for the buffet. Warp nine.',
    'Iceberg? Tell it to make an appointment.': 'Iceberg? Tell it to make an appointment.',
    'All hands to the hammocks.': 'All hands to the hammocks.',
    'More butter. No. More.': 'More butter. No. More.',
    'The soufflé can hear us.': 'The soufflé can hear us.',
    'Yes chef. No chef. Nap chef.': 'Yes chef. No chef. Nap chef.',
    'Fold the meringue, not the captain.': 'Fold the meringue, not the captain.',
    'The jelly wobbles for no one.': 'The jelly wobbles for no one.',
    'Is the tractor beam all-inclusive?': 'Is the tractor beam all-inclusive?',
    'I paid for the premium sunset.': 'I paid for the premium sunset.',
    'Three towels is the legal limit.': 'Three towels is the legal limit.',
    'Is there a buffet on the mothership?': 'Is there a buffet on the mothership?',
    'I want a refund on gravity.': 'I want a refund on gravity.',
    // ---- report code
  } satisfies Record<string, string>,

  // v4 story: Field Check copy (between L2 and L3; Sol owns the screen & logic)
  fieldCheck: {
    badge: 'FIELD CHECK · UNPAID',
    title: 'Field Check — Off Training',
    location: 'Birch Lane · Maple Court edge',
    blurb: 'One porch light, one door lip, zero clock.',
    re: 'Field Check #0002-B — Off Training',
    body: "The laundromat van turned into Maple Court, and Head Office just dumped a three-specimen shift on my desk. Before sunrise goes live, run one unpaid drill on Birch Lane: trip a porch sensor, clear a door lip, and don't wake the decoy.",
    joke: "No stars, no Glorbs, no permanent record—unless you break the saucer. My pension is eleven weeks away, Zib. Please don't ruin it.",
    signoff: '— Vrell. Unpaid drill, paid expectations.',
    start: 'Run Field Check',
    skip: 'Skip to Maple Court',
    replay: 'Replay Field Check',
    continueToL3: 'Start Maple Court',
    prompts: {
      porch: 'Pass the porch sensor — slide out to cool the fuse.',
      ring: 'Hover in the mint ring to lock on.',
      doorLip: 'Lift past the door lip — let go to settle the swing.',
      // v4 council: the clatter demo, a clipboard dropped down the beam
      clatter: 'A clipboard fell! Watch both meters.',
      retry: 'Retries reset this room, not your whole shift.',
      complete: '1 of 3 logged. Live shifts share one sunrise clock.',
    },
    completeTitle: 'FIELD CHECK PASSED',
    completeComment: "Adequate. Your temporary lanyard is in the tray. Sunrise starts on Maple Court—don't get seen by Mrs. Pruitt.",
  },
};

export type Strings = typeof en;
