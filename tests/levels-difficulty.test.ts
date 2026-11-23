// Difficulty gate: each deep level must stay inside its target band for human-model players, not only be
// solvable by the perfect autopilot. See .claude/skills/evaluate-difficulty/SKILL.md.
//   DIFFICULTY_SEEDS=20   more seeds per cell (slower, steadier numbers)
//   DIFFICULTY_LEVELS=level3,level4   which levels to evaluate (default: every level with a band)
//   DIFFICULTY_OUT=review/difficulty   also write <level>.md and <level>.json there
import { describe, expect, it } from 'vitest';
import { LEVEL3, LEVEL4 } from '../src/levels/deep-levels';
// L5 pier code
import { LEVEL5 } from '../src/levels/deep-pier';
// L6 clinic code
import { LEVEL6 } from '../src/levels/deep-clinic';
// L7 cruise code
import { LEVEL7 } from '../src/levels/deep-ship';
import { evaluateLevel, formatReport } from './difficulty/evaluate';

declare const process: { stdout: { write(s: string): void }; env: Record<string, string | undefined> };

const seeds = Number(process.env.DIFFICULTY_SEEDS ?? 6);
// Every level with a band is checked by default (L4 has none yet: reported only on request).
const wanted = (process.env.DIFFICULTY_LEVELS ?? 'level3,level5,level6,level7').split(',');
const out = process.env.DIFFICULTY_OUT;

describe('difficulty bands (human-model players)', () => {
  for (const level of [LEVEL3, LEVEL4, LEVEL5, LEVEL6, LEVEL7].filter((l) => wanted.includes(l.id))) {
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
    }, 240_000);
  }
});
