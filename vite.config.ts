import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// Relative base so the build works on GitHub Pages under /night-shift/.
export default defineConfig({
  base: './',
  // The title's build label reads this (src/core/version.ts).
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  test: { environment: 'node', include: ['tests/**/*.test.ts'], passWithNoTests: true },
});
