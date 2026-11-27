// The title's build label shows the package version (major.minor) in every language, and the
// lockfile agrees with package.json, so a release cannot ship saying it is the previous one.
import { describe, expect, it } from 'vitest';
import { APP_VERSION, RELEASE_LABEL } from '../src/core/version';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import packageJson from '../package.json?raw';
import packageLock from '../package-lock.json?raw';

const read = (raw: string): { version: string; packages: Record<string, { version?: string }> } => JSON.parse(raw);

describe('release version', () => {
  const pkg = read(packageJson);

  it('comes from package.json, and the lockfile agrees', () => {
    expect(APP_VERSION).toBe(pkg.version);
    const lock = read(packageLock);
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages['']?.version).toBe(pkg.version);
  });

  it('labels the title build with major.minor in EN and FR', () => {
    const label = `v${pkg.version.split('.').slice(0, 2).join('.')}`;
    expect(RELEASE_LABEL).toBe(label.slice(1));
    for (const strings of [en, fr]) expect(strings.title.build.startsWith(`${label} · `), strings.title.build).toBe(true);
  });
});
