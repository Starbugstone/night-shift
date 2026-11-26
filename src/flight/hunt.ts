import type { MapCollectibleId, RoomId, Vec2 } from '../contracts';
import { deepSlot, LEVELS, levelRooms } from '../levels/levels';
import type { LevelDef } from '../levels/types';
import type { TrophySlot, TownTrophySlot } from '../ui/trophy-data';

export type HuntTarget =
  | { kind: 'souvenir'; room: RoomId; itemId: string }
  | { kind: 'town'; id: MapCollectibleId };

export function trophyHunt(slot: TrophySlot | TownTrophySlot, playable: (index: number) => boolean) {
  if ('rooms' in slot) {
    for (const room of slot.rooms) {
      const index = LEVELS.findIndex(level => levelRooms(level).includes(room));
      if (index >= 0 && playable(index)) {
        const target: HuntTarget = { kind: 'souvenir', room, itemId: slot.itemId };
        return { index, target };
      }
    }
    return null;
  }
  const index = LEVELS.findIndex(level => level.id === slot.levelId && level.map.collectible?.id === slot.id);
  if (index < 0 || !playable(index)) return null;
  const target: HuntTarget = { kind: 'town', id: slot.id };
  return { index, target };
}

export function huntEntry(level: LevelDef, hunt: HuntTarget | undefined): Vec2 | undefined {
  if (hunt?.kind !== 'souvenir') return;
  if (level.kind !== 'deep') return level.map.entries.find(entry => entry.roomId === hunt.room);
  const slot = deepSlot(level, hunt.room);
  if (slot) return level.map.targets[slot.target]?.entries[slot.entry];
}

export function huntPickup(
  hunt: HuntTarget | undefined,
  pickup: { def: { id: MapCollectibleId }; available: boolean; position: Vec2 } | null | undefined,
): Vec2 | undefined {
  if (hunt?.kind === 'town' && pickup?.available && pickup.def.id === hunt.id) return pickup.position;
}
