/**
 * Geschäftsmodell und Zugang (Prompt 12, Abschnitt 2): Hybrid.
 *
 * - ACCESS_MODE = 'lead': Ampel und Größenordnung kostenlos, Bericht 89 €.
 * - Freischaltcodes (lib/erstkunden.ts) überspringen die Zahlung.
 * - Modell C (Kanzlei-Lizenz) bleibt im Code und wird über
 *   NEXT_PUBLIC_PRODUKT_VARIANTE=kanzlei aktiviert (siehe variante.ts).
 */
import { PRODUKT_VARIANTE } from './variante';

/** Zugangsmodell: Ampel + Größenordnung kostenlos, Bericht kostenpflichtig. */
export const ACCESS_MODE = 'lead' as const;

/** Bruttopreis des schriftlichen Prüfberichts in Euro (wird berechnet). */
export const BERICHT_PREIS_BRUTTO_EUR = 89;

/** Enthaltene Umsatzsteuer, nur für die Preisangabe („inkl. MwSt.“). */
export const BERICHT_PREIS_HINWEIS = 'inkl. gesetzlicher Umsatzsteuer';

/**
 * „Später weitermachen“ / Ergebnis-Link per E-Mail: aktiv. Der Link trägt den
 * Zwischenstand selbst (komprimiert, 30 Tage gültig) – keine Persistenz nötig.
 */
export const FORTSETZEN_AKTIV = true;

/** Gültigkeit des Ergebnis-Links in Tagen. */
export const FORTSETZEN_TAGE = 30;

/**
 * Zahlung (Entscheidung 20.09.2026, erweitert Prompt 12): vorab, über Stripe
 * Checkout; danach erhält die Kundin oder der Kunde Rechnung und Bericht (PDF)
 * per E-Mail. Ob die Bestellung technisch freigeschaltet ist, entscheidet
 * serverseitig `bestellungAktiv()` in lib/zahlung.ts (Stripe-Schlüssel
 * vorhanden). SEPA und Klarna müssen im Stripe-Dashboard aktiviert sein.
 */
export const ZAHLUNG = {
  vorab: true,
  abwicklung: 'Stripe',
  wege: ['Kreditkarte oder Debitkarte', 'SEPA-Lastschrift', 'PayPal', 'Klarna'],
  lieferung:
    'Nach Zahlungseingang erhalten Sie Rechnung und Bericht als PDF per E-Mail – in der Regel innerhalb weniger Minuten.',
} as const;

export type BusinessModelId = 'hybrid' | 'kanzlei';

export interface BusinessModel {
  id: BusinessModelId;
  name: string;
  beschreibung: string;
  /** Text für den Preis-Abschnitt. */
  preisHinweis: string;
}

export const BUSINESS_MODELS: Record<BusinessModelId, BusinessModel> = {
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid: kostenlose Ampel, kostenpflichtiger Bericht',
    beschreibung:
      'Die Ampel und die Größenordnung in Worten sind kostenlos. Wer die genaue Zahl will – Jahr für Jahr, mit Quellen –, bestellt den Prüfbericht zum Festpreis.',
    preisHinweis: `Die Ampel kostet nichts. Der Prüfbericht: ${BERICHT_PREIS_BRUTTO_EUR} € einmalig, ${BERICHT_PREIS_HINWEIS}. Kein Abo, keine Folgekosten.`,
  },
  kanzlei: {
    id: 'kanzlei',
    name: 'Kanzlei-Lizenz (Modell C)',
    beschreibung:
      'Eigener Zugang für Kanzleien und Versicherungsberater: Belehrungs-Check, Beträge, Bericht als White-Label. Markenneutral.',
    preisHinweis: 'Lizenzkonditionen nach Vereinbarung.',
  },
};

export const ACTIVE_MODEL: BusinessModelId = PRODUKT_VARIANTE === 'kanzlei' ? 'kanzlei' : 'hybrid';

export const activeModel: BusinessModel = BUSINESS_MODELS[ACTIVE_MODEL];
