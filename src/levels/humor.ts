// All the jokes in one place. DOM-free so comment selection is testable.
import type { AbductResult, FlightResult } from '../contracts';

export const LOADING_TIPS: readonly string[] = [
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
];

export const SPOTTED_CAPTIONS: readonly string[] = [
  'Witness describes "a big rude frisbee".',
  'Local man calls his mum. She does not believe him either.',
  'Pyjama-clad human now has a podcast about this.',
  'Blurry photo posted. 3 likes. One is his mum.',
  'Sighting logged by the Neighbourhood Watch (one guy).',
  'Witness yells "MARGE". There is no Marge.',
  'Local paper headline: "Lights. Again. Probably Gary."',
];

export const SPOTTED_SHOUTS: readonly string[] = ['MAAARGE!', "IT'S THEM!", 'I KNEW IT!', 'Not again…', 'HONEY, CAMERA!'];

export type ZibEvent =
  | 'start'
  | 'cone'
  | 'bark'
  | 'neon'
  | 'powerline'
  | 'highSus'
  | 'nearRing'
  | 'locked'
  | 'respawn';

export const ZIB_LINES: Record<ZibEvent, readonly string[]> = {
  start: ['Okay. Okay okay okay. Be cool, Zib.', "Deep breaths. Don't throw up. Again."],
  cone: ['Headlights! Act natural!', 'Look like a cloud. LOOK LIKE A CLOUD.'],
  bark: ['Good doggy… sleepy doggy…', "Shh! Shhh! Who's a quiet boy?"],
  neon: ['The buzzy light is scrambling my brain!', 'Ooh, pretty. Ow, steering.'],
  powerline: ['OW. Who puts string in the SKY?', 'Power line! Earth is so badly designed.'],
  highSus: ["They're looking! THEY'RE LOOKING!", 'Think innocent thoughts!'],
  nearRing: ['Hover… hover… don\'t sneeze…', 'That\'s the one. Hold still…'],
  locked: ['Locked on! Mom would be so proud.', 'Beam time. Gently, Zib. Gently.'],
  respawn: ['Nobody saw that. Nobody saw anything.', 'Take two. Totally fine. Totally.'],
};

export type CommentKey =
  | 'rejected'
  | 'woke'
  | 'perfect'
  | 'spotted'
  | 'bonks'
  | 'stole'
  | 'dignity'
  | 'slow'
  | 'clean'
  | 'default';

export const VRELL_COMMENTS: Record<CommentKey, readonly string[]> = {
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
  dignity: ['Dignity at {dignity}%. Honestly, about average for a human.'],
  slow: ['Delivered, eventually. Overtime is unpaid, by the way.', 'That took a while. I aged. I do not age.'],
  clean: ['Zero bonks. Are you even trying to make my day interesting?'],
  default: [
    "Adequate. My favourite word. It means I don't have to talk to anyone.",
    'Specimen received. Please wipe down the beam.',
  ],
};

export interface CommentInput {
  abduct: AbductResult;
  flight: FlightResult;
  parSec: number;
  stars: number;
}

export function commentKey(r: CommentInput): CommentKey {
  const a = r.abduct;
  if (!a.delivered) return 'rejected';
  if (a.woke) return 'woke';
  if (r.stars >= 3) return 'perfect';
  if (r.flight.spotted >= 2) return 'spotted';
  if (a.bonks >= 5) return 'bonks';
  if (a.itemsStolen.length > 0) return 'stole';
  if (a.dignity < 40) return 'dignity';
  if (r.flight.timeSec + a.timeSec > r.parSec) return 'slow';
  if (a.bonks === 0) return 'clean';
  return 'default';
}

export function itemsPhrase(items: readonly string[]): string {
  if (items.length === 0) return 'none';
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1);
  return [...counts].map(([name, n]) => `${n} ${name}${n > 1 ? 's' : ''}`).join(', ');
}

/** Pick a comment for the outcome; `rotation` cycles through the lines. */
export function vrellComment(r: CommentInput, rotation: number): string {
  const key = commentKey(r);
  const lines = VRELL_COMMENTS[key];
  const line = lines[Math.abs(Math.floor(rotation)) % lines.length]!;
  return line
    .replace('{bonks}', String(r.abduct.bonks))
    .replace('{spotted}', String(r.flight.spotted))
    .replace('{dignity}', String(Math.round(r.abduct.dignity)))
    .replace('{item}', itemsPhrase(r.abduct.itemsStolen));
}

export function pick<T>(list: readonly T[], seed: number): T {
  return list[Math.abs(Math.floor(seed)) % list.length]!;
}

// ====================================================================== v2: deep levels

/** Zib's first-contact panic, one set per hazard / event in the deep levels. */
export type DeepZibEvent =
  | 'start3'
  | 'start4'
  | 'police'
  | 'patrol'
  | 'traffic'
  | 'porch'
  | 'watcher'
  | 'dog'
  | 'heli'
  | 'camera'
  | 'window'
  | 'neon'
  | 'wire'
  | 'tram'
  | 'bat'
  | 'pigeon'
  | 'crane'
  | 'sprinkler'
  | 'tripwire'
  | 'dash'
  | 'checkpoint'
  | 'dawn'
  | 'nearRing'
  | 'locked'
  | 'respawn';

export const DEEP_ZIB: Record<DeepZibEvent, readonly string[]> = {
  start3: ['Three specimens before sunrise. That\'s one more than I\'ve ever done. Total.', 'Suburbia. Everyone here owns a ring doorbell and a grudge.'],
  start4: ['A whole city. Mom said cities are where saucers go to get towed.', 'Okay. Downtown. Be cool. Be a pigeon.'],
  police: ['Police cruiser! Look like weather!', 'That\'s a COP. Do I have my licence? Do saucers HAVE licences?'],
  patrol: ['Patrol car! Act like a streetlight. A tall, wobbly streetlight.', 'Another police car. This town has more cops than crimes. Until now.'],
  traffic: ['Traffic! Why is anyone driving at 3 AM? Go HOME.', 'Taxi headlights! He\'s seen weirder. Probably.'],
  porch: ['The porch light clicked! Motion sensor! I MOVE, that\'s my whole thing!', 'Porch light! Freeze! No, don\'t freeze, that\'s worse!'],
  watcher: ['Mrs. Pruitt has BINOCULARS. Who has binoculars at 3 AM?!', 'The lady in the window. She\'s writing something down. Is it me?'],
  dog: ['Yard dog! Good boy. Sleepy boy. Boy who has seen nothing.', 'The dog\'s awake! Act like a squirrel. A big, round, glowing squirrel.'],
  heli: ['That\'s a POLICE helicopter. Mom said if I get arrested I\'m walking home.', 'Searchlight! Stay out of the circle! Everything bad is in the circle!'],
  camera: ['Rooftop camera! Smile! No! Don\'t smile! We don\'t have faces on record!', 'CCTV. Somewhere a security guard is about to have a very interesting Tuesday.'],
  window: ['Someone\'s working late! Why is anyone working late? Oh. Right. Me.', 'Office light! Wait for it to flicker off!'],
  neon: ['Billboard! My steering is full of BURGERS.', 'The neon is in my brain again. Left is right. Right is lunch.'],
  wire: ['OW. Power line. Earth has strings everywhere.', 'Bonk! Who strings cables over a whole street?!'],
  tram: ['Tram wire! Ow! Why does a city need a ceiling?', 'Bonk. The tram people really should label these.'],
  bat: ['BATS! Bats bats bats! Sorry! Sorry, bats!', 'A bat hit me. Or I hit a bat. Either way, it\'s my fault, apparently.'],
  pigeon: ['Pigeons! They don\'t move! Why don\'t they MOVE?', 'Pigeon strike! Mom said they\'re just rats with a pilot\'s licence.'],
  crane: ['The crane! It\'s a giant metal arm and it HATES me.', 'Crane boom! Duck! Can saucers duck?'],
  sprinkler: ['It\'s a sprinkler. Just a sprinkler. I knew that.', 'The sprinkler is unbothered by me. I respect the sprinkler.'],
  tripwire: ['Gary\'s tripwire. It\'s wired to a doorbell in Gary\'s bedroom. He\'s slept through it 400 times.', 'Another Gary tripwire. It only catches Gary. Gary is the threat.'],
  dash: ['Zoom!', 'Afterburner! Mom would say slow down. Mom isn\'t here.'],
  checkpoint: ['One in the hold! Nobody saw a thing. Hopefully.', 'Specimen secured. Back to the sky, Zib. Act natural.'],
  dawn: ['The sky\'s going orange! That\'s the bad colour!', 'Sunrise in thirty seconds! The humans will be AWAKE. On PURPOSE.'],
  nearRing: ['Hover… hover… don\'t sneeze…', 'That\'s the one. Hold still…'],
  locked: ['Locked on! Beam time. Gently.', 'Going in. Shoes off. Do I have shoes?'],
  respawn: ['Nobody saw that. Nobody saw anything.', 'Take two. Totally fine. Totally.', 'Okay. Again. From the last specimen. Like a professional.'],
};

/** Caption on the SPOTTED! card, by what caught you. */
export const SPOT_CAPTIONS: Record<string, readonly string[]> = {
  police: ['Officer Dobbs radios in "a large hubcap, airborne". Dispatch asks if he has eaten.', 'The cruiser\'s dashcam got a clip. It will be shown at the station party. Twice.'],
  patrol: ['Patrol car logs "unusual lights". The report will be filed under "Thursday".', 'An officer spills coffee on his own lap in shock. He will blame the Mayor.'],
  traffic: ['A taxi driver sees you, shrugs, and adds a 20% surcharge for the sighting.', 'A delivery van films you at a red light. Five stars. Would see again.'],
  porch: ['The porch light caught you. Then the doorbell camera caught the porch light.', 'Motion light, doorbell camera, neighbourhood app. 41 comments by breakfast.'],
  watcher: ['Mrs. Pruitt adds you to her logbook, between "suspicious cat" and "the Hendersons\' bins".', 'Mrs. Pruitt calls the council. The council knows her voice. The council hangs up. You are still seen.'],
  dog: ['The dog barks. A light goes on. A man in a dressing gown says "what IS that".', 'The yard dog has finally barked at something real. He is so proud.'],
  heli: ['"Unidentified aircraft, you are in restricted airspace." You are, technically, an aircraft.', 'The helicopter\'s searchlight finds you. The pilot asks for a photo. Then for backup.'],
  camera: ['Rooftop CCTV saves a clip. Security will watch it on Tuesday, at 4× speed.', 'Camera footage sent to the cloud. You were briefly a cloud. It didn\'t take.'],
  window: ['An accountant working late sees you. He tells nobody. He has nobody to tell.', 'A night-shift clerk sees you, waves, and goes back to the spreadsheet. Still counts.'],
};

export function spotCaption(cause: string, seed: number): string {
  return pick(SPOT_CAPTIONS[cause] ?? SPOTTED_CAPTIONS, seed);
}

/** The witness's shout on the SPOTTED! card, by cause. */
export const SPOT_SHOUTS: Record<string, readonly string[]> = {
  police: ['UNIT 4, UFO!', 'FREEZE! …PLEASE?'],
  patrol: ['10-4, SAUCER!', 'BACKUP!'],
  watcher: ['I KNEW IT!', 'DOROTHY! THE BOOK!'],
  heli: ['GOT A VISUAL!', 'TALLY-HO!'],
  dog: ['WOOF!', 'MAAARGE!'],
};

export function spotShout(cause: string, seed: number): string {
  return pick(SPOT_SHOUTS[cause] ?? SPOTTED_SHOUTS, seed);
}

/** Zib's line under the SPOTTED! card in deep levels, by cause. */
export const SPOT_ZIB: Record<string, readonly string[]> = {
  police: ['The cop saw me. Respawning at the last specimen. Act like it was a different saucer.'],
  patrol: ['Patrol car got me. Back to the checkpoint. Different saucer, different saucer.'],
  traffic: ['A TAXI saw me. Of all the things to be seen by.'],
  porch: ['Motion sensor. I was moving. That\'s on me.'],
  watcher: ['Mrs. Pruitt. Of course. She sees everything. She saw the moon landing coming.'],
  dog: ['The dog told. Dogs always tell.'],
  heli: ['The circle got me. I said stay out of the circle.'],
  camera: ['Camera. I\'m on the internet now. Mom\'s going to see this.'],
  window: ['The office light. I should\'ve waited for the flicker.'],
};

/** Lines for a failed abduction, by fail reason. `{by}` = what caused it (AbductResult.failBy). */
export const ABDUCT_FAIL_LINES: Record<string, readonly string[]> = {
  woke: [
    '{by} woke up and saw everything. {by} is now "processing it" on a forum.',
    '{by} opened one eye. Then the other. Then their mouth. It went downhill from there.',
    '{by} is awake. Specimens are meant to be asleep. It\'s in the name. Well, it isn\'t, but it should be.',
  ],
  sleeper: [
    '{by} woke up. Nobody told {by} this was a two-person job.',
    '{by} is awake and has opinions. Loud ones. Retry, quietly.',
    'You woke {by}. {by} was not on the work order. {by} is now on a different work order.',
  ],
  alarm: [
    'Tripped by {by}. Security has logged it as "a moth". A very large moth.',
    '{by} went off. Somewhere a monitor is beeping at a man who is asleep.',
    '{by}. The alarm works perfectly, it turns out. It just never works on its owner.',
  ],
  aborted: [
    'Abduction abandoned. I have been notified. I am always notified.',
    'You walked away. The specimen, blissfully, did not notice.',
  ],
};

/** Gary-specific fail lines (L3 running joke): his own tripwires. */
export const GARY_FAIL_LINES: readonly string[] = [
  '{by}. Gary\'s security system catches its first real intruder. Gary sleeps through it, as tradition demands.',
  '{by} tripped. In eleven years it has caught Gary eleven times and you once. You are in the record books. Gary\'s.',
];

export function abductFailLine(reason: string | undefined, by: string | undefined, roomId: string, seed: number): string {
  const name = by && by.length > 0 ? by : reason === 'alarm' ? 'The alarm' : reason === 'sleeper' ? 'The other sleeper' : 'The specimen';
  const gary = roomId.startsWith('gary') && reason === 'alarm';
  const list = gary ? GARY_FAIL_LINES : ABDUCT_FAIL_LINES[reason ?? 'aborted'] ?? ABDUCT_FAIL_LINES.aborted!;
  return pick(list, seed).replace(/\{by\}/g, name);
}

/** Vrell's sunrise memos (level failed), rotating. */
export const SUNRISE_MEMOS: readonly string[] = [
  'The sun has come up. On Earth this happens every day. Every. Single. Day. Please plan for it.',
  'Sunrise. The humans are now waking up on their own, which is the opposite of the service we provide.',
  'You ran out of night. Please return the night to the supply cupboard, and fill in the night-return form.',
  'Dawn. I have rescheduled you for tomorrow night. I have rescheduled myself for a lie-down.',
  'It is now morning. The specimens are making toast. We cannot abduct people who are making toast. It\'s in the treaty.',
];

export function sunriseMemo(rotation: number): string {
  return pick(SUNRISE_MEMOS, rotation);
}

export interface DeepCommentInput {
  levelId: string;
  stars: number;
  spotted: number;
  failed: number;
  bonks: number;
  remaining: number;
  order: readonly number[];
}

/** Vrell on a delivered deep shift. */
export const DEEP_COMMENTS = {
  perfect: [
    'Three specimens, no sightings, home before dawn. I have nothing to complain about and I resent it.',
    'Flawless shift. I have forwarded your report to Head Office with my name on it. Standard procedure.',
  ],
  ghost: [
    'Nobody saw you. Nobody woke up. You are the rumour other interns tell each other.',
  ],
  spotted: [
    'All three delivered, and spotted {spotted} times. Maple Court has a group chat now. It is all about you.',
    'Delivered. Also: {spotted} sightings. Please stop becoming folklore on company time.',
  ],
  failed: [
    '{failed} failed attempts. The specimens didn\'t notice. Their neighbours did.',
    'All three, eventually. After {failed} retries. Persistence is a virtue. Efficiency is a bigger one.',
  ],
  close: [
    'Delivered with {remaining} seconds of night to spare. I watched the clock. I don\'t have a heart, but if I did.',
  ],
  default: [
    'Three specimens. Adequate. My favourite word, as you know.',
    'Shift complete. Please wipe down the beam. Thrice.',
  ],
  gary: [
    'Gary\'s own cameras recorded the whole abduction. He\'ll review the tape in the morning and blame the Hendersons.',
  ],
  mayor: [
    'You abducted an elected official. On a weeknight. Head Office would like it noted that we did not vote for him.',
  ],
} as const;

export function deepComment(r: DeepCommentInput, rotation: number): string {
  let list: readonly string[];
  if (r.stars >= 3) list = DEEP_COMMENTS.perfect;
  else if (r.spotted === 0 && r.failed === 0) list = DEEP_COMMENTS.ghost;
  else if (r.spotted >= 3) list = DEEP_COMMENTS.spotted;
  else if (r.failed >= 2) list = DEEP_COMMENTS.failed;
  else if (r.remaining < 20) list = DEEP_COMMENTS.close;
  else if (r.levelId === 'level3' && rotation % 2 === 0) list = DEEP_COMMENTS.gary;
  else if (r.levelId === 'level4' && rotation % 2 === 0) list = DEEP_COMMENTS.mayor;
  else list = DEEP_COMMENTS.default;
  return pick(list, rotation)
    .replace('{spotted}', String(r.spotted))
    .replace('{failed}', String(r.failed))
    .replace('{remaining}', String(Math.round(r.remaining)));
}
