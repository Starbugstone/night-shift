// The star captions a level shows (report, memo): its three, plus the town pickup star named after
// the pickup where the map has one (every level after L1).
import { tr } from '../i18n';
import { isDeep } from '../levels/levels';
import type { LevelDef } from '../levels/types';

export function shownStarLabels(lv: LevelDef): string[] {
  const base = lv.id === 'level8' ? tr().timeTrial.stars : isDeep(lv) ? tr().starLabels.deep : tr().starLabels.tutorial;
  const id = lv.map.collectible?.id;
  return id ? [...base, tr().mapCollectibles.items[id].name] : [...base];
}
