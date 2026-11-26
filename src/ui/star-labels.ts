// The star captions a level shows (report, memo): its three, plus the town pickup star named after
// the pickup where the map has one (every level after L1).
import { tr } from '../i18n';
import { isDeep } from '../levels/levels';
import type { LevelDef } from '../levels/types';

export function shownStarLabels(lv: LevelDef): string[] {
  const { starLabels, timeTrial } = tr();
  const base = lv.id === 'level8' ? timeTrial.stars
    : isDeep(lv) && lv.map.targets.length < 3 ? [starLabels.tutorial[0]!, starLabels.deep[1]!, starLabels.deep[2]!]
    : isDeep(lv) ? starLabels.deep : starLabels.tutorial;
  const id = lv.map.collectible?.id;
  return id ? [...base, tr().mapCollectibles.items[id].name] : [...base];
}
