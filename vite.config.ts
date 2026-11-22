import { defineConfig } from 'vitest/config';

// Relative base so the build works on GitHub Pages under /night-shift/.
export default defineConfig({
  base: './',
  test: { environment: 'node', include: ['tests/**/*.test.ts'], passWithNoTests: true },
});
