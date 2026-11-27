// v0.2 damaged save (council round 4): the save the Game plays on and what the title may say about the file.
// DOM-free so tests/ui-reset-title-damaged.test.ts drives the same rules the Game runs.
import { loadSaveWithStatus, writeSave, type KeyValueStore, type SaveData, type SaveStatus } from '../levels/save';

/**
 * The loaded save and the loader's status. The status lasts until progress is written over the file (Neon 4: a
 * played shift, a purchase, a reset), not through sound or language toggles. Dismissing the notice hides it for this
 * session and writes nothing (Sol P2), so an `unreadable` value stays on disk until the player confirms the shred or
 * saves real progress; settings changed meanwhile are kept in memory only.
 */
export class SaveSession {
  private current: SaveData;
  private loaded: SaveStatus;
  private dismissed = false;

  constructor(private readonly storage: KeyValueStore | null) {
    const { save, status } = loadSaveWithStatus(storage);
    this.current = save;
    this.loaded = status;
  }

  get save(): SaveData {
    return this.current;
  }

  /** What the title reports: the loader's status, or 'ok' once progress was saved or the notice dismissed. */
  get status(): SaveStatus {
    return this.dismissed ? 'ok' : this.loaded;
  }

  /** Progress (a run, a purchase, a story beat, a reset): stored, and the file is sound again. */
  writeProgress(s: SaveData): void {
    this.current = s;
    this.loaded = 'ok';
    writeSave(this.storage, s);
  }

  /** Sound and language: stored, except over an unreadable file nobody chose to shred yet. */
  writeSettings(s: SaveData): void {
    this.current = s;
    if (this.loaded !== 'unreadable') writeSave(this.storage, s);
  }

  /** The player read the notice: hidden until the next boot, nothing written. */
  dismiss(): void {
    this.dismissed = true;
  }
}
