import type { Assets } from '../contracts';
import { PRELOAD_ART } from '../art-manifest';

/** Preloads every manifest key that has a file (PRELOAD_ART); a file that fails still stays undefined. */
export class AssetLoader implements Assets {
  private readonly images = new Map<string, HTMLImageElement>();
  private settled = 0;
  private loadedCount = 0;
  readonly total: number;

  constructor(base: string = import.meta.env.BASE_URL) {
    const keys = PRELOAD_ART;
    this.total = keys.length;
    for (const key of keys) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (img.naturalWidth > 0 || img.width > 0) {
          this.images.set(key, img);
          this.loadedCount++;
        }
        this.settled++;
      };
      img.onerror = () => {
        this.settled++;
      };
      img.src = `${base}art/${key}.svg`;
    }
  }

  get(key: string): HTMLImageElement | undefined {
    return this.images.get(key);
  }

  /** 0..1 of files finished (loaded or failed). */
  get progress(): number {
    return this.total === 0 ? 1 : this.settled / this.total;
  }

  get done(): boolean {
    return this.settled >= this.total;
  }

  get loaded(): number {
    return this.loadedCount;
  }
}
