import { describe, expect, it } from 'vitest';
import { ROOMS } from '../src/abduct/rooms';
import { TABLES } from '../src/i18n';
import { FIELD_CHECK_ROOM } from '../src/levels/field-check';
import { LEVELS, levelRooms } from '../src/levels/levels';

const STARDATE = /(?:stardate|date stellaire)\s*:?\s*(\d{4,5}\.\d+)/i;

describe('souvenir references survive translation', () => {
  const playableRooms = LEVELS.flatMap(level => levelRooms(level).map(id => ROOMS[id]));
  const rooms = [
    ...Object.values(ROOMS), FIELD_CHECK_ROOM,
    ...playableRooms,
  ];
  const referenceItems = new Set(rooms.map(room => room.item.name));

  it('keeps the captain’s log collectible and its science-fiction name in French', () => {
    expect(referenceItems.has("captain's log")).toBe(true);
    expect(playableRooms.some(room => room.item.name === "captain's log")).toBe(true);
    for (const room of rooms) {
      if (room.item.name !== "captain's log") continue;
      expect(room.item.sprite.key).toBe('room/captains_log');
      expect(TABLES.fr.items[room.item.name].one).toBe('{n} log du capitaine');
      expect(TABLES.fr.items[room.item.name].other).toBe('{n} logs du capitaine');
    }
  });

  it('prints the same numeric stardate in both descriptions and report lines', () => {
    for (const item of referenceItems) {
      if (item !== "captain's log") continue;
      const dates = [];
      for (const words of Object.values(TABLES)) {
        const date = words.trophies.descriptions[item].match(STARDATE)?.[1];
        expect(date, words.items[item].one).toBeDefined();
        dates.push(date);
        const report = words.souvenirs.items[item].got.find(line => STARDATE.test(line));
        expect(report?.match(STARDATE)?.[1]).toBe(date);
      }
      expect(new Set(dates).size).toBe(1);
    }
  });
});
