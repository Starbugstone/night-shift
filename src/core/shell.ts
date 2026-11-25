import type { TrophyRoomTab } from '../ui/trophy-data';
import type { AbductResult, FlightResult, GameContext, RoomId, UpgradeId } from '../contracts';
import type { SaveData } from '../levels/save';
import type { Lang } from '../i18n';
import type { SynthAudio } from '../audio/sfx';
import type { PointerInput } from './input';
import type { AssetLoader } from './assets';

export interface MutableContext extends GameContext {
  upgrades: Set<UpgradeId>;
}

/** What UI / flight scenes may use from the game shell. */
export interface Shell {
  readonly ctx: MutableContext;
  readonly save: SaveData;
  readonly audio: SynthAudio;
  readonly input: PointerInput;
  readonly assets: AssetLoader;
  /** Running on the preprod deploy (/night-shift/preprod/): testing tools show. */
  readonly preprod: boolean;
  /** Replace the save (and persist). */
  setSave(s: SaveData): void;
  toggleMute(): void;
  /** Switch the display language (saved; clears a `?lang=` override). */
  setLanguage(lang: Lang): void;
  /** v4 reset: erase all progress (a fresh save), keeping sound and language. */
  resetProgress(): void;

  toTitle(): void;
  toWorkOrders(): void;
  toUpgrades(): void;
  /** `view`: preprod's preview of every exhibit, and the room to open on. */
  toTrophies(from?: 'title' | 'workorders', view?: { preview: boolean; room: TrophyRoomTab }): void;
  toMemo(levelIndex: number): void;
  toFlight(levelIndex: number, spotted?: number): void;
  toAbduct(levelIndex: number, room: RoomId, flight: FlightResult): void;
  toReport(levelIndex: number, abduct: AbductResult, flight: FlightResult): void;
  toAbortChoice(levelIndex: number, room: RoomId, flight: FlightResult): void;
}
