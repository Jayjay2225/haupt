/**
 * Bestellung des schriftlichen Berichts (Entscheidung 20.09.2026): Zahlung
 * vorab über Stripe Checkout (Karte, PayPal, Klarna), danach Rechnung und PDF
 * per E-Mail. Hier liegen die formularseitigen Regeln, die Browser und Server
 * gleich anwenden; alles mit Stripe-Anbindung steht in lib/zahlung.ts.
 */
import type { CaseDraft } from './draft';
import { validiereBis } from './draft';

export interface Bestellformular {
  name: string;
  email: string;
  /** AGB und Widerrufsbelehrung gelesen. */
  agbGelesen: boolean;
  /** Ausdrücklicher Wunsch, sofort zu beginnen, mit Kenntnis der Folge für das Widerrufsrecht. */
  ausfuehrungZugestimmt: boolean;
}

export type BestellFeld = keyof Bestellformular | 'fall';
export type BestellFehler = Partial<Record<BestellFeld, string>>;

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Bestellnummer: RR-<Jahr>-<6 Zeichen ohne 0/O/1/I>. */
export const BESTELLNUMMER_MUSTER = /^RR-\d{4}-[A-HJ-NP-Z2-9]{6}$/;

export const FEHLER_FALL_UNVOLLSTAENDIG =
  'Die Angaben zur Police sind noch unvollständig. Bitte den Rechner bis zum Schritt „Werte“ ausfüllen.';

export function bestellformularAusDraft(draft: CaseDraft): Bestellformular {
  return { name: draft.name, email: draft.email, agbGelesen: false, ausfuehrungZugestimmt: false };
}

export function pruefeBestellformular(formular: Bestellformular, draft: CaseDraft): BestellFehler {
  const fehler: BestellFehler = {};
  if (formular.name.trim() === '') {
    fehler.name = 'Bitte Ihren Namen eintragen – er steht auf Bericht und Rechnung.';
  }
  if (!EMAIL_MUSTER.test(formular.email.trim())) {
    fehler.email = 'Bitte eine gültige E-Mail-Adresse eintragen – dorthin schicken wir Rechnung und Bericht.';
  }
  if (!formular.agbGelesen) {
    fehler.agbGelesen = 'Bitte bestätigen, dass Sie AGB und Widerrufsbelehrung gelesen haben.';
  }
  if (!formular.ausfuehrungZugestimmt) {
    fehler.ausfuehrungZugestimmt = 'Ohne diese Zustimmung dürfen wir den Bericht nicht sofort erstellen.';
  }
  if (Object.keys(validiereBis('auszahlungen', draft)).length > 0) {
    fehler.fall = FEHLER_FALL_UNVOLLSTAENDIG;
  }
  return fehler;
}
