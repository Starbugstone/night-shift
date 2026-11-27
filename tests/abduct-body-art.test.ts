// Nobody wears borrowed art (docs/REGRESSIONS.md A4, the "borrowed" half; council v0.2 round 2): the 2199
// residents Artie, Penny and Moe shipped with their own heads and torsos on Doc's, Larry's and Buff's limbs.
//
// Rule: every part of every specimen any room in ROOMS abducts is that specimen's own art key, sized in the
// manifest. A character may wear another's limbs only through SHARED_PARTS (src/abduct/human-parts.ts) with the
// story's reason; a head or a torso is never shared. Limb keys are built only by `humanPartKey`, so no view can
// remap them on the side. Sleepers follow the same rule: one art family per named sleeper, both states from it.
import { describe, expect, it } from 'vitest';
import { ART } from '../src/art-manifest';
import { bodyPlanFor } from '../src/abduct/body-plan';
import { HUMAN_PARTS, SHARED_PARTS, humanPartKey, type HumanPart, type SharedParts } from '../src/abduct/human-parts';
import { ROOM_ENTRIES } from './abduct-guard-helpers';

const CODE = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const RESOLVER = '/abduct/human-parts.ts';

/** The dolphin rig's parts (src/abduct/dolphin-art.ts). */
const DOLPHIN_PARTS = ['head', 'head_awake', 'torso', 'tail', 'fluke', 'flipper'] as const;
/** Parts that make a character who they are. */
const OWN_ONLY: readonly HumanPart[] = ['head', 'head_awake', 'torso'];

/**
 * Art one drawing serves for more than one named animal, with why. A new sleeper gets their own art; add a
 * family here only when the story says the two look alike.
 */
const SHARED_SLEEPER_ART: Readonly<Record<string, string>> = {
  'room/cat': 'the one house-cat drawing: the farm cat on Doyle\'s shelf (farm_chimney) and Crumb, Mabel\'s bakery cat, are both plain tabbies',
};

/** Every ragdoll specimen a room abducts, once. */
const SPECIMENS = [...new Set(ROOM_ENTRIES.map(([, r]) => r.human))];
/** Those on the human rig (the dolphin has its own parts). */
const HUMANS = SPECIMENS.filter((human) => bodyPlanFor(human).kind === 'human');

/** What is wrong with the art of `human`'s parts, given how keys resolve and what is declared shared. */
function borrowed(human: string, resolve: (human: string, part: HumanPart) => string, shared: Readonly<Record<string, SharedParts>>): string[] {
  const out: string[] = [];
  const share = shared[human];
  for (const part of HUMAN_PARTS) {
    const key = resolve(human, part);
    if (!ART[key]) out.push(`${human}: ${key} is not in the manifest`);
    if (key === `human/${human}_${part}`) continue;
    if (!share?.parts.includes(part) || key !== `human/${share.from}_${part}`) out.push(`${human} wears ${key} (undeclared)`);
  }
  return out;
}

/** What is wrong with a SHARED_PARTS table. */
function badShares(shared: Readonly<Record<string, SharedParts>>, specimens: readonly string[]): string[] {
  const out: string[] = [];
  for (const [human, share] of Object.entries(shared)) {
    if (!specimens.includes(human)) out.push(`${human} is in SHARED_PARTS but no room abducts them`);
    if (share.from === human || shared[share.from]) out.push(`${human} shares from ${share.from}, who has no art of their own`);
    if (share.reason.trim().length < 30) out.push(`${human} shares ${share.from}'s parts without a written reason`);
    if (share.parts.length === 0) out.push(`${human} shares nothing: remove the entry`);
    for (const part of share.parts) if (OWN_ONLY.includes(part)) out.push(`${human} shares a ${part}: heads and torsos are never shared`);
  }
  return out;
}

const stripComments = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

/**
 * Places outside the resolver that build a `human/…` key from a variable. Allowed: a literal head or torso
 * suffix on the id itself (`human/${id}_head`), which cannot borrow, and a literal name (`'human/bubbles_' + part`).
 */
function sideKeys(sources: Readonly<Record<string, string>>): string[] {
  const out: string[] = [];
  const own = /^(?:'human\/'\s*\+\s*[\w.!?[\]()]+\s*\+\s*'_(?:head|head_awake|torso)'|`human\/\$\{[^}]+\}_(?:head|head_awake|torso)`)/;
  for (const [path, raw] of Object.entries(sources)) {
    if (path.endsWith(RESOLVER) || path.endsWith('/art-manifest.ts')) continue;
    const src = stripComments(raw);
    for (const m of src.matchAll(/'human\/'\s*\+|`human\/\$\{/g)) {
      const at = src.slice(m.index!, m.index! + 120);
      if (!own.test(at)) out.push(`${path}: ${at.split('\n')[0]!.slice(0, 60)}`);
    }
    // a limb suffix glued onto anything: limbs + '_upper_arm', `${base}_lower_leg`
    for (const m of src.matchAll(/(?:\+\s*['"`]|\})_(?:upper|lower)_(?:arm|leg)/g)) out.push(`${path}: …${m[0]}`);
  }
  return out;
}

describe('every specimen wears their own art', () => {
  it('walks every room', () => {
    expect(ROOM_ENTRIES.length).toBeGreaterThan(60);
    expect(SPECIMENS.length).toBeGreaterThan(30);
  });

  for (const human of SPECIMENS) {
    it(`${human}: every part is their own, in the manifest`, () => {
      if (bodyPlanFor(human).kind === 'dolphin') {
        for (const part of DOLPHIN_PARTS) expect(ART[`human/${human}_${part}`], `human/${human}_${part} is not in the manifest`).toBeDefined();
        // the dolphin view names its art by a literal: a second dolphin must not be drawn as this one
        const view = stripComments(CODE['../src/abduct/dolphin-art.ts']!);
        expect(view, `src/abduct/dolphin-art.ts does not draw human/${human}_*`).toContain(`'human/${human}_'`);
        return;
      }
      expect(borrowed(human, humanPartKey, SHARED_PARTS)).toEqual([]);
    });
  }

  it('declares every shared part set with a reason, limbs only', () => {
    expect(badShares(SHARED_PARTS, SPECIMENS)).toEqual([]);
  });

  it('builds limb keys only in the resolver (no remap on the side)', () => {
    expect(Object.keys(CODE).some((path) => path.endsWith(RESOLVER))).toBe(true);
    expect(sideKeys(CODE)).toEqual([]);
  });

  it('catches the v0.2 mapping, an undeclared share and a side remap (mutation check)', () => {
    // the mapping src/abduct/draw.ts shipped with until v0.2
    const LIMBS: readonly HumanPart[] = ['upper_arm', 'lower_arm', 'upper_leg', 'lower_leg'];
    const old: Readonly<Record<string, string>> = { artie: 'doc', penny: 'larry', moe: 'buff' };
    const v02 = (human: string, part: HumanPart): string => `human/${LIMBS.includes(part) ? old[human] ?? human : human}_${part}`;
    expect(HUMANS.flatMap((human) => borrowed(human, v02, {}))).toEqual([
      'artie wears human/doc_upper_arm (undeclared)', 'artie wears human/doc_lower_arm (undeclared)',
      'artie wears human/doc_upper_leg (undeclared)', 'artie wears human/doc_lower_leg (undeclared)',
      'penny wears human/larry_upper_arm (undeclared)', 'penny wears human/larry_lower_arm (undeclared)',
      'penny wears human/larry_upper_leg (undeclared)', 'penny wears human/larry_lower_leg (undeclared)',
      'moe wears human/buff_upper_arm (undeclared)', 'moe wears human/buff_lower_arm (undeclared)',
      'moe wears human/buff_upper_leg (undeclared)', 'moe wears human/buff_lower_leg (undeclared)',
    ]);
    // a declared share passes, through the real resolver
    const twins: Record<string, SharedParts> = { artie: { from: 'doc', parts: LIMBS, reason: 'Artie borrowed the inventor\'s spare coat and trousers for the trip' } };
    expect(borrowed('artie', (h, p) => humanPartKey(h, p, twins), twins)).toEqual([]);
    expect(badShares(twins, SPECIMENS)).toEqual([]);
    // …but not a head, not without a reason, not from someone who shares, not for nobody
    expect(badShares({ artie: { from: 'doc', parts: ['head'], reason: 'x' }, nobody: { from: 'artie', parts: LIMBS, reason: twins.artie!.reason } }, SPECIMENS)).toEqual([
      'artie shares doc\'s parts without a written reason', 'artie shares a head: heads and torsos are never shared',
      'nobody is in SHARED_PARTS but no room abducts them', 'nobody shares from artie, who has no art of their own',
    ]);
    // a character with no limb art at all
    expect(borrowed('nobody', humanPartKey, {})).toHaveLength(HUMAN_PARTS.length);
    // a view that remaps on the side, the way draw.ts did
    const remap = { '../src/abduct/fake.ts': `const limbs = human === 'artie' ? 'human/doc' : key;\nconst arm = part(limbs + '_upper_arm', c);` };
    expect(sideKeys(remap)).toHaveLength(1);
    const concat = { '../src/ui/fake.ts': `const base = 'human/' + photo.human + '_';\nconst leg = \`\${base}lower_leg\`;` };
    expect(sideKeys(concat)).toHaveLength(1);
    const fine = { '../src/ui/fake.ts': `const a = 'human/' + sim.room.human + '_head_awake';\nconst b = \`human/\${id}_torso\`;\nconst c = 'human/bubbles_' + part;` };
    expect(sideKeys(fine)).toEqual([]);
  });
});

describe('every sleeper wears their own art', () => {
  /** Art family (the key without its state) → who is drawn with it. */
  const wearers = new Map<string, Set<string>>();
  const family = (key: string): string => key.replace(/_(?:asleep|awake|sleeping)$/, '');
  const wear = (key: string, who: string): void => {
    wearers.set(family(key), (wearers.get(family(key)) ?? new Set()).add(who));
  };
  const split: string[] = [];
  let count = 0;
  for (const [id, r] of ROOM_ENTRIES) {
    if (r.cat) wear(r.cat.key, 'the farm cat');
    for (const s of r.interior?.building.sleepers ?? []) {
      count++;
      wear(s.asleep.key, s.name);
      wear(s.awake.key, s.name);
      if (family(s.asleep.key) !== family(s.awake.key)) split.push(`${id}: ${s.name} sleeps as ${s.asleep.key} and wakes as ${s.awake.key}`);
    }
  }

  it('finds the sleepers', () => {
    expect(count).toBeGreaterThan(15);
  });

  it('draws both states of a sleeper from one art family', () => {
    expect(split).toEqual([]);
  });

  it('gives each named sleeper their own art family, unless the share is declared with a reason', () => {
    const shared = [...wearers].filter(([key, who]) => who.size > 1 && !SHARED_SLEEPER_ART[key]).map(([key, who]) => `${key}: ${[...who].join(', ')}`);
    expect(shared).toEqual([]);
    for (const [key, reason] of Object.entries(SHARED_SLEEPER_ART)) {
      expect(wearers.get(key)?.size ?? 0, `${key} is no longer shared: take it off SHARED_SLEEPER_ART`).toBeGreaterThan(1);
      expect(reason.trim().length, key).toBeGreaterThan(30);
    }
  });
});
