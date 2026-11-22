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
