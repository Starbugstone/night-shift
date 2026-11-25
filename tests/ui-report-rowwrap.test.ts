// "Items stolen from Earth" with three souvenirs used to shrink to an unreadable line.
import { expect, it } from 'vitest';
import { stackedRowValue } from '../src/ui/report-layout';

const measure = (s: string, size: number) => s.length * size * 0.55;

it('keeps a short value beside its label', () => {
  expect(stackedRowValue(measure, '1 slipper', 176, 440, 19)).toBeNull();
});

it('stacks three souvenirs on a full-width line at a readable size', () => {
  const value = '1 UFO snow globe, 1 mayoral toupee, 1 limited-edition DJ mug';
  const size = stackedRowValue(measure, value, 176, 440, 19)!;
  expect(size).toBeGreaterThanOrEqual(11);
  expect(size).toBeLessThanOrEqual(14);
  expect(measure(value, size)).toBeLessThanOrEqual(440);
});
