// Localisation: language state, lookups, interpolation and plurals. DOM-free (node-testable).
//
// Add a string: put it in `en.ts` (the source of truth), then in `fr.ts` (TypeScript fails
// until you do). Read it with `tr().section.key`; fill `{placeholders}` with `fmt()`, pick a
// plural with `plural()`. Write French with plain spaces and ASCII apostrophes: `frenchTypography`
// turns " ?" / " !" / " :" / " ;" / « » spacing and ' into the right characters when the table loads.
import { en, type Strings } from './en';
import { fr } from './fr';

export type { Strings } from './en';

export const LANGS = ['en', 'fr'] as const;
export type Lang = (typeof LANGS)[number];
/** What the player chose; `auto` follows the browser. */
export type LangPref = 'auto' | Lang;

export function isLang(v: unknown): v is Lang {
  return v === 'en' || v === 'fr';
}

export function isLangPref(v: unknown): v is LangPref {
  return v === 'auto' || isLang(v);
}

/** `fr`, `fr-FR`, `fr_CA`… → French; everything else → English. */
export function langFromLocale(locale: string | null | undefined): Lang {
  return typeof locale === 'string' && /^fr\b|^fr[-_]/i.test(locale.trim()) ? 'fr' : 'en';
}

/** URL override (`?lang=fr`) beats the saved choice, which beats the browser language. */
export function resolveLang(pref: LangPref, locale: string | null | undefined, urlParam?: string | null): Lang {
  if (isLang(urlParam)) return urlParam;
  if (isLang(pref)) return pref;
  return langFromLocale(locale);
}

const NNBSP = ' '; // narrow no-break space: before ? ! ; and %
const NBSP = ' '; // no-break space: before : and inside « »

/** French typesetting on one string: no-break spaces before high punctuation, % and inside guillemets; curly apostrophes. */
export function frenchTypo(s: string): string {
  return s
    .replace(/'/g, '’')
    .replace(/[   ]*([?!;])/g, (_m, p: string, off: number, all: string) => {
      // nothing at the start, after an opening bracket or after another mark ("?!" stays together)
      const prev = all[off - 1];
      if (off === 0 || prev === undefined || /[(\[«?!…\n]/.test(prev)) return p;
      return NNBSP + p;
    })
    .replace(/[   ]*:(?!\d)/g, (_m, off: number) => (off === 0 ? ':' : NBSP + ':'))
    .replace(/(\d|\})[   ]*%/g, (_m, d: string) => d + NNBSP + '%')
    // a number stays with its unit or noun ("58 ans", "3 h")
    .replace(/(\d) (?=[a-zà-ÿ])/g, (_m, d: string) => d + NBSP)
    .replace(/«[  ]*/g, '«' + NBSP)
    .replace(/[  ]*»/g, NBSP + '»');
}

type Deep = string | readonly Deep[] | { readonly [k: string]: Deep };

function mapStrings<T>(v: T, fn: (s: string) => string): T {
  const d = v as unknown as Deep;
  if (typeof d === 'string') return fn(d) as unknown as T;
  if (Array.isArray(d)) return d.map((x) => mapStrings(x, fn)) as unknown as T;
  if (typeof d === 'object' && d !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(d)) out[k] = mapStrings(x, fn);
    return out as T;
  }
  return v;
}

export const TABLES: Record<Lang, Strings> = {
  en,
  fr: mapStrings(fr, frenchTypo),
};

let current: Lang = 'en';
let version = 0;

export function getLang(): Lang {
  return current;
}

export function setLang(l: Lang): void {
  if (l === current) return;
  current = l;
  version++;
}

/** Bumps on every language change: screens that cache text compare it to re-layout. */
export function langVersion(): number {
  return version;
}

/**
 * Art key for the current language: art with lettering in it has a `<key>_<lang>` variant
 * (see scripts/art-fr.mjs). English is the plain key. Callers keep their own fallback.
 */
export function localArt(key: string): string {
  return current === 'en' ? key : `${key}_${current}`;
}

/** The string table for the current language. */
export function tr(): Strings {
  return TABLES[current];
}

/** The string table for a given language. */
export function table(l: Lang): Strings {
  return TABLES[l];
}

/** Fill `{name}` placeholders. Unknown placeholders are left as they are. */
export function fmt(s: string, vars: Readonly<Record<string, string | number>>): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export interface PluralForms {
  one: string;
  other: string;
}

/** English: 1 is singular. French: 0 and 1 are singular. */
export function isSingular(n: number, l: Lang = current): boolean {
  const a = Math.abs(n);
  return l === 'fr' ? a < 2 : a === 1;
}

/** Pick the plural form for `n` and fill `{n}` (plus any other vars). */
export function plural(n: number, forms: PluralForms, vars: Readonly<Record<string, string | number>> = {}, l: Lang = current): string {
  return fmt(isSingular(n, l) ? forms.one : forms.other, { n, ...vars });
}

/** Placeholder names in a string, sorted (tests compare en and fr with this). */
export function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();
}

/** Display text for a string that lives in level / room data, keyed by its English source text. */
export function gt(source: string): string {
  const d = tr().data as Readonly<Record<string, string>>;
  const hit = d[source];
  if (hit !== undefined) return hit;
  // tutorial sleep-talk is a list: same index in every language
  const i = en.mumbles.indexOf(source);
  return i >= 0 ? (tr().mumbles[i] ?? source) : source;
}

/** Look up a per-id record in the table (missing ids fall back to English, then to the id). */
export function byId<T>(pick: (s: Strings) => Readonly<Record<string, T>>, id: string): T | undefined {
  return pick(tr())[id] ?? pick(en)[id];
}

/** A number with the language's decimal mark ("1.25" / "1,25"). */
export function num(n: number, digits: number): string {
  const s = n.toFixed(digits);
  return current === 'fr' ? s.replace('.', ',') : s;
}
