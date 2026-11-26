import { expect, it } from 'vitest';

const sources = import.meta.glob<string>('../src/**/*.ts', { query: '?raw', import: 'default', eager: true });

it('keeps click out of the sound palette and all call sites', () => {
  for (const [path, source] of Object.entries(sources)) {
    expect(source, path).not.toMatch(/sfx\s*\(\s*['"]click['"]|case\s+['"]click['"]\s*:/);
  }
});

it('keeps alien voices out of flight and abduction scenes', () => {
  for (const [path, source] of Object.entries(sources)) {
    if (/src\/(flight\/|abduct\/|ui\/(deep-abduct|field-check)\.ts)/.test(path)) {
      expect(source, path).not.toMatch(/\baudio\.speak(?:\?\.)?\s*\(/);
    }
  }
});
