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

/**
 * Einwilligungen und Bestätigungen des Bestellschritts reisen nicht im Link
 * mit – sie werden in Schritt 11 aktiv gesetzt, nie vorangekreuzt (auch auf
 * einem anderen Gerät, auch Wochen später). `eingereichtAm` bleibt drin
 * (Kanzlei-Weiterleitung).
 */
const NICHT_IM_LINK: ReadonlySet<string> = new Set<keyof CaseDraft>([
  'einwilligungDatenschutz',
  'agbGelesen',
  'ausfuehrungZugestimmt',
  'einwilligungAnkaufKontakt',
]);

/** Ein echter Zwischenstand ist kleiner als 10 KB; die Grenze verhindert Dekompressionsbomben. */
const MAX_ENTPACKT_BYTES = 64 * 1024;

export function erzeugeFortsetzenToken(draft: CaseDraft, jetzt: Date = new Date()): string {
  const kompakt: Record<string, unknown> = {};
  for (const [schluessel, wert] of Object.entries(draft)) {
    if (NICHT_IM_LINK.has(schluessel)) {
      continue;
    }
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
    const json = inflateRawSync(Buffer.from(token, 'base64url'), { maxOutputLength: MAX_ENTPACKT_BYTES }).toString('utf8');
    const roh: unknown = JSON.parse(json);
    if (typeof roh !== 'object' || roh === null) {
      return { stand: 'ungueltig' };
    }
    const { d, bis } = roh as { d?: unknown; bis?: unknown };
    if (typeof bis !== 'string' || typeof d !== 'object' || d === null) {
      return { stand: 'ungueltig' };
    }
    const ablauf = Date.parse(bis);
    if (!Number.isFinite(ablauf)) {
      return { stand: 'ungueltig' };
    }
    if (ablauf < jetzt.getTime()) {
      return { stand: 'abgelaufen' };
    }
    const draft = uebernehmeBekannteFelder(d as Record<string, unknown>);
    // Auch für früher verschickte Links: Einwilligungen nie aus dem Link übernehmen.
    for (const schluessel of NICHT_IM_LINK) {
      (draft as unknown as Record<string, unknown>)[schluessel] = false;
    }
    return { stand: 'ok', draft };
  } catch {
    return { stand: 'ungueltig' };
  }
}

export function fortsetzenLink(basisUrl: string, token: string): string {
  return `${basisUrl}/rechner/fortsetzen?${FORTSETZEN_PARAMETER}=${token}`;
}
