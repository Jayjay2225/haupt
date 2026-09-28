/**
 * Bestellung des Gutachtens (Entscheidung 20.09.2026, Prompt 14 Schritt 11):
 * Zahlung vorab über Stripe Checkout, danach Rechnung und PDF per E-Mail,
 * auf Wunsch zusätzlich per Post. Hier liegen die Regeln, die Browser und
 * Server gleich anwenden; alles mit Stripe-Anbindung steht in lib/zahlung.ts.
 */
import type { CaseDraft } from './draft';
import { kundenname, validiereBis } from './draft';

export type BestellFeld = 'vorname' | 'nachname' | 'email' | 'agbGelesen' | 'ausfuehrungZugestimmt' | 'einwilligungDatenschutz' | 'fall';
export type BestellFehler = Partial<Record<BestellFeld | string, string>>;

/** Bestellnummer: RR-<Jahr>-<6 Zeichen ohne 0/O/1/I>. */
export const BESTELLNUMMER_MUSTER = /^RR-\d{4}-[A-HJ-NP-Z2-9]{6}$/;

export const FEHLER_FALL_UNVOLLSTAENDIG =
  'Die Angaben zur Police sind noch unvollständig. Bitte den Rechner bis zum Schritt „Auszahlungen“ ausfüllen.';

export const FEHLER_PERSON_UNVOLLSTAENDIG =
  'Die Angaben zu Ihrer Person (Name, Adresse, Geburtsdatum, E-Mail) sind noch unvollständig.';

/**
 * Prüft den Fall (bis „Auszahlungen“), den Schritt „Über Sie“ und die
 * Bestätigungen des Schritts „Ihre Bestellung“.
 */
export function pruefeBestellung(draft: CaseDraft): BestellFehler {
  const fehler: BestellFehler = {};
  if (Object.keys(validiereBis('auszahlungen', draft)).length > 0) {
    fehler['fall'] = FEHLER_FALL_UNVOLLSTAENDIG;
  }
  const person = validiereBis('person', draft);
  for (const feld of ['anrede', 'vorname', 'nachname', 'email', 'geburtsdatum', 'strasse', 'plz', 'ort'] as const) {
    if (person[feld] !== undefined) {
      fehler[feld] = person[feld];
    }
  }
  if (!draft.einwilligungDatenschutz) {
    fehler['einwilligungDatenschutz'] = 'Ohne dieses Ja dürfen wir nicht rechnen.';
  }
  if (!draft.agbGelesen) {
    fehler['agbGelesen'] = 'Bitte bestätigen, dass Sie AGB und Widerrufsbelehrung gelesen haben.';
  }
  if (!draft.ausfuehrungZugestimmt) {
    fehler['ausfuehrungZugestimmt'] = 'Ohne diese Zustimmung dürfen wir das Gutachten nicht sofort erstellen.';
  }
  if (kundenname(draft) === '') {
    fehler['nachname'] = fehler['nachname'] ?? 'Bitte Ihren Namen eintragen – er steht auf Gutachten und Rechnung.';
  }
  return fehler;
}

/** Versandadresse für den Postversand (Deckblatt der Druckvorlage). */
export interface Versandadresse {
  name: string;
  strasse: string;
  plz: string;
  ort: string;
}

export function versandadresse(draft: CaseDraft): Versandadresse {
  return {
    name: kundenname(draft),
    strasse: draft.strasse.trim(),
    plz: draft.plz.trim(),
    ort: draft.ort.trim(),
  };
}
