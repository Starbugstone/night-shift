// v3 report additions (docs/GDD-3-new-shifts.md "Report additions"): Vrell's cover story and the
// tabloid headline. Pure text selection, DOM-free; strings live in `tr().reportExtras`.
import { fmt, gt, tr } from '../i18n';
import type { MapCollectibleId } from '../contracts';

export function mapCollectibleReport(
  id: MapCollectibleId,
  pickup: MapCollectibleId | undefined,
  seed = 0,
): {
  row: [string, string];
  comment: string;
} {
  const words = tr().mapCollectibles;
  const { name, comment, missedComment } = words.items[id];
  const collected = id === pickup;
  return {
    row: [words.row, fmt(collected ? words.found : words.missed, { name })],
    comment: collected ? comment : id === 'cherry_pie' || id === 'garden_gnome' || Math.abs(Math.floor(seed)) % 3 === 0 ? missedComment : '',
  };
}

/** Sightings from which the local paper runs the story. */
export const TABLOID_SPOTTED = 2;

export interface CoverInput {
  levelId: string;
  /** Souvenir ids (English item names), in the order stolen. */
  items: readonly string[];
  spotted: number;
  /** The shift ended at sunrise (deep levels). */
  sunrise: boolean;
  firstClear?: boolean;
  /** Rotation (reports filed so far) so repeat runs read differently. */
  seed: number;
}

function pickLine(list: readonly string[], seed: number): string {
  return list[Math.abs(Math.floor(seed)) % list.length]!;
}

/** "slipper" for item id 'slipper', in the current language, without a count. */
export function itemNoun(id: string): string {
  const forms = tr().items as Readonly<Record<string, { one: string; other: string }>>;
  const f = forms[id];
  return f ? fmt(f.one, { n: '' }).trim() : gt(id);
}

/** Vrell's one-line cover story, keyed to level, souvenir and sightings. */
export function coverStory(c: CoverInput): string {
  if (c.firstClear && !c.sunrise) {
    if (c.levelId === 'birch_bakery') return tr().birch.bakeryCover;
    if (c.levelId === 'birch_neighbours') return tr().birch.neighboursCover;
  }
  const x = tr().reportExtras;
  const causes = x.causes[c.levelId] ?? x.causes.generic!;
  const cause = pickLine(causes, c.seed);
  const item = c.items[c.items.length - 1];
  const kind = c.sunrise ? (c.levelId === 'level9' ? 'storm' : 'sunrise') : c.spotted >= TABLOID_SPOTTED ? 'spotted' : item ? 'item' : 'clean';
  const line = pickLine(x.cover[kind], Math.floor(c.seed / causes.length));
  return fmt(line, { cause, item: item ? itemNoun(item) : '', n: c.spotted });
}

/** The tabloid headline, or null when the saucer was seen fewer than twice. */
export function tabloidHeadline(levelId: string, spotted: number, seed: number): string | null {
  if (spotted < TABLOID_SPOTTED) return null;
  const h = tr().reportExtras.headlines;
  if (levelId === 'birch_bakery' || levelId === 'birch_neighbours') return h[levelId]![0]!;
  const own = h[levelId] ?? [];
  const all = [...own, ...h.generic!];
  // the level's own headlines come up first, the generic ones on later runs
  const s = Math.abs(Math.floor(seed));
  return own.length > 0 && s % 3 !== 2 ? pickLine(own, s) : pickLine(all, s);
}
