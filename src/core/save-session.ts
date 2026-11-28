// v0.2 damaged save (council round 4): the save the Game plays on and what the title may say about the file.
// DOM-free so tests/ui-reset-title-damaged.test.ts drives the same rules the Game runs.
import { loadSaveWithStatus, writeSave, type KeyValueStore, type SaveData, type SaveStatus } from '../levels/save';
import { resetSave } from './reset';

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

  /**
   * Progress (a run, a purchase, a story beat, a reset): stored, and the file is sound again. v0.2 council round 5
   * (Sol P3): only when the write lands; a store that throws keeps the damaged bytes, so the status stays. With no
   * store at all (private mode) there is no file to report on. Returns whether the progress persisted.
   */
  writeProgress(s: SaveData): boolean {
    this.current = s;
    const persisted = this.storage === null || writeSave(this.storage, s);
    if (persisted) this.loaded = 'ok';
    return persisted;
  }

  /**
   * The title's Erase: the fresh save (settings kept) is written first, and only a write that lands replaces live
   * progress and clears the status. v0.2 council round 6 (Sol P2): a jammed erase used to clear progress in memory
   * only, so the next settings write (mute, language) stored the empty save while the note said the file was still
   * here. A failed reset leaves the save, the status and the reset button exactly as they were.
   */
  reset(): boolean {
    const fresh = resetSave(this.current);
    const persisted = this.storage === null || writeSave(this.storage, fresh);
    if (!persisted) return false;
    this.current = fresh;
    this.loaded = 'ok';
    return true;
  }

  /** Sound and language: stored, except over an unreadable file nobody chose to shred yet. */
  writeSettings(s: SaveData): void {
    this.current = s;
    if (this.loaded !== 'unreadable') writeSave(this.storage, s);
  }

  /**
   * A story mark (a film seen, the Field Check offer, the 2199 epilogue) is not progress: it is stored like a
   * setting, so it never overwrites an unreadable file the player has not shredded and the notice stays. v0.2 council
   * round 7 (Opus F1): opening the first L1 memo on an unreadable save played the intro film and its seen mark
   * wrote a fresh save over the file without the Erase confirmation.
   */
  writeStoryMark(s: SaveData): void {
    this.writeSettings(s);
  }

  /** The player read the notice: hidden until the next boot, nothing written. */
  dismiss(): void {
    this.dismissed = true;
  }
}
