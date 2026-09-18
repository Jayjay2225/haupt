/**
 * „Später am Rechner fortsetzen“ – vorbereitet, aber abgeschaltet
 * (config/business.ts FORTSETZEN_AKTIV), bis Persistenz existiert.
 *
 * Zielbild: Der Zwischenstand wird serverseitig unter einer zufälligen ID
 * gespeichert (Ablauf nach 30 Tagen), die E-Mail enthält den Link
 * /rechner?fortsetzen=<id>; beim Aufruf wird der Entwurf wiederhergestellt.
 * Bis dahin liefert diese Datei nur die Vertragsschicht und einen Hinweis.
 */
import type { CaseDraft } from './draft';

export const FORTSETZEN_PARAMETER = 'fortsetzen';

export interface FortsetzenAnfrage {
  /** Sobald Persistenz existiert: gespeicherte ID; solange leer. */
  id: string;
  hinweis: string;
  /** E-Mail-Adresse, an die der Link gehen soll (aus dem Entwurf). */
  email: string;
}

export function erzeugeFortsetzenAnfrage(draft: CaseDraft): FortsetzenAnfrage {
  return {
    id: '',
    email: draft.email,
    hinweis:
      'Der Link zum Weitermachen kommt, sobald wir Zwischenstände speichern dürfen. Bis dahin bleiben Ihre Angaben auf diesem Gerät.',
  };
}

export function fortsetzenLink(basisUrl: string, id: string): string {
  return `${basisUrl}/rechner?${FORTSETZEN_PARAMETER}=${encodeURIComponent(id)}`;
}
