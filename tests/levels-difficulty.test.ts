// Difficulty gate: star bands for every level and route/flight bands for the deep levels.
// See .claude/skills/evaluate-difficulty/SKILL.md.
//   DIFFICULTY_SEEDS=20   more seeds per cell (slower, steadier numbers)
//   DIFFICULTY_LEVELS=level3,level4   which levels to evaluate (default: all levels)
//   DIFFICULTY_OUT=review/difficulty   also write <level>.md and <level>.json there
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels/levels';
import { evaluateLevel, formatReport } from './difficulty/evaluate';

declare const process: { stdout: { write(s: string): void }; env: Record<string, string | undefined> };

const seeds = Number(process.env.DIFFICULTY_SEEDS ?? 6);
const levels = LEVELS;
const wanted = process.env.DIFFICULTY_LEVELS?.split(',').map((id) => id.trim());
for (const id of wanted ?? []) {
  if (!levels.some((level) => level.id === id)) throw new Error(`Unknown level in DIFFICULTY_LEVELS: ${id}`);
}
const out = process.env.DIFFICULTY_OUT;
const timeoutMs = Number.isSafeInteger(seeds) && seeds > 6 ? seeds * 40_000 : 240_000;

describe('difficulty bands (human-model players)', () => {
  for (const level of levels) {
    if (wanted && !wanted.includes(level.id)) continue;
    it(`${level.id} ${level.title} sits in its band`, async () => {
      const report = evaluateLevel(level, seeds);
      const text = formatReport(report);
      process.stdout.write(`\n${text}\n`);
      if (out) {
        // No Node typings in this project: type just the two calls used.
        const name = 'node:fs';
        const fs = (await import(/* @vite-ignore */ name)) as {
          mkdirSync(path: string, options: { recursive: boolean }): void;
          writeFileSync(path: string, data: string): void;
        };
        fs.mkdirSync(out, { recursive: true });
        fs.writeFileSync(`${out}/${level.id}.md`, `${text}\n`);
        fs.writeFileSync(`${out}/${level.id}.json`, `${JSON.stringify(report, null, 2)}\n`);
      }
      expect(report.violations, text).toEqual([]);
    }, timeoutMs);
  }
});
