/**
 * Ergebnis-Link / „Später weitermachen“ (Prompt 12, Abschnitt 3.3 und 3.4):
 * Der Link trägt den Zwischenstand selbst – komprimiert (deflate) und
 * base64url-kodiert, mit Ablaufdatum. Keine serverseitige Speicherung.
 *
 * Nur serverseitig verwenden (node:zlib).
 */
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { FORTSETZEN_TAGE } from '@/config/business';
import type { CaseDraft } from './draft';
import { uebernehmeBekannteFelder } from './draft';

export const FORTSETZEN_PARAMETER = 'f';

export function erzeugeFortsetzenToken(draft: CaseDraft, jetzt: Date = new Date()): string {
  const kompakt: Record<string, unknown> = {};
  for (const [schluessel, wert] of Object.entries(draft)) {
    if (wert !== '' && wert !== false && wert !== undefined && wert !== null) {
      kompakt[schluessel] = wert;
    }
  }
  const bis = new Date(jetzt.getTime() + FORTSETZEN_TAGE * 24 * 60 * 60 * 1000).toISOString();
  const nutzlast = JSON.stringify({ d: kompakt, bis });
  return deflateRawSync(Buffer.from(nutzlast, 'utf8')).toString('base64url');
}

export type FortsetzenErgebnis =
  | { stand: 'ok'; draft: CaseDraft }
  | { stand: 'abgelaufen' }
  | { stand: 'ungueltig' };

export function leseFortsetzenToken(token: string, jetzt: Date = new Date()): FortsetzenErgebnis {
  try {
    if (token.length > 20000) {
      return { stand: 'ungueltig' };
    }
    const json = inflateRawSync(Buffer.from(token, 'base64url')).toString('utf8');
    const roh: unknown = JSON.parse(json);
    if (typeof roh !== 'object' || roh === null) {
      return { stand: 'ungueltig' };
    }
    const { d, bis } = roh as { d?: unknown; bis?: unknown };
    if (typeof bis !== 'string' || typeof d !== 'object' || d === null) {
      return { stand: 'ungueltig' };
    }
    if (new Date(bis).getTime() < jetzt.getTime()) {
      return { stand: 'abgelaufen' };
    }
    return { stand: 'ok', draft: uebernehmeBekannteFelder(d as Record<string, unknown>) };
  } catch {
    return { stand: 'ungueltig' };
  }
}

export function fortsetzenLink(basisUrl: string, token: string): string {
  return `${basisUrl}/rechner/fortsetzen?${FORTSETZEN_PARAMETER}=${token}`;
}
