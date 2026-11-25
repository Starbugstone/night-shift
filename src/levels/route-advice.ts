import type { RoomId } from '../contracts';
import { tr } from '../i18n';

export function routeAdvice(room: RoomId): string {
  const advice: Partial<Record<RoomId, string>> = tr().routeAdvice;
  return advice[room] ?? tr().routes[room].difficulty;
}
