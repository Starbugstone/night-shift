// The v0.2 release notes match the game (council round 4, Neon P5 and Opus O6): the title version line followed the
// release label in v0.1 too, so "shows the version again" was wrong; the Saves section must name the damaged-save
// notice and the confirmation-gated reset in the game's own words, and must not promise more than the loader does.
import { describe, expect, it } from 'vitest';
import enNotes from '../docs/RELEASE-NOTES-0.2.md?raw';
import frNotes from '../docs/RELEASE-NOTES-0.2.fr.md?raw';
import { RELEASE_LABEL } from '../src/core/version';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';

/** One section's text, whitespace (line wraps, no-break spaces) folded to single spaces. */
const section = (notes: string, title: string): string => {
  const at = notes.indexOf(`\n## ${title}\n`);
  if (at < 0) throw new Error(`no section ${title}`);
  const end = notes.indexOf('\n## ', at + 4);
  return fold(notes.slice(at, end < 0 ? undefined : end));
};
const fold = (s: string): string => s.replace(/\s+/g, ' ');
const bullets = (s: string): number => s.split(' - ').length - 1;

const NOTES = [
  { lang: 'en', notes: enNotes, saves: 'Saves', fixed: 'Fixed', reset: en.title.reset },
  { lang: 'fr', notes: frNotes, saves: 'Sauvegardes', fixed: 'Corrections', reset: fr.title.reset },
] as const;

describe('the v0.2 release notes match the game', () => {
  it.each(NOTES)('$lang: Saves names the damaged-save notice and the confirmed reset in the game\'s words', ({ notes, saves, reset }) => {
    const text = section(notes, saves);
    for (const line of [reset.damagedKept, reset.damagedLost, reset.button]) expect(text).toContain(fold(line));
    expect(text).toMatch(/confirm/i);
    // the loader keeps what it can read; it does not always find a whole good save (Opus O6)
    expect(text).not.toMatch(/finds the last good one|retrouve automatiquement la dernière/);
  });

  it.each(NOTES)('$lang: the version line says the title follows the release label', ({ notes, fixed }) => {
    const text = section(notes, fixed);
    expect(text).toContain(`**v${RELEASE_LABEL}**`);
    expect(text).not.toMatch(/version again|de nouveau la version/);
    expect(text).toMatch(/automatically|automatiquement/);
  });

  it('EN and FR list the same number of fixes', () => {
    expect(bullets(section(frNotes, 'Corrections'))).toBe(bullets(section(enNotes, 'Fixed')));
  });
});
