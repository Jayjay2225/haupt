/**
 * Geschäftsmodell (Prompt 8, Entscheidung 3): Hybrid.
 *
 * - Kostenlose wirtschaftliche Ampel ohne Euro-Beträge.
 * - Kostenpflichtiger Bericht (Startpreis 89 € brutto, hier konfiguriert).
 * - Modell C (Kanzlei-Lizenz) bleibt im Code und wird über
 *   NEXT_PUBLIC_PRODUKT_VARIANTE=kanzlei aktiviert (siehe variante.ts).
 *
 * Die früheren Modelle A/B/C bleiben nachrichtlich dokumentiert.
 */
import { PRODUKT_VARIANTE } from './variante';

/** Bruttopreis des schriftlichen Berichts in Euro – Einführungspreis, wird berechnet. */
export const BERICHT_PREIS_BRUTTO_EUR = 89;

/**
 * Regulärer Preis (Streichpreis, Entscheidung 21.09.2026). Darf nur beworben
 * werden, solange er der tatsächliche reguläre Listenpreis ist; ohne
 * Zeitdruck-Formulierungen (Verbotsliste Prompt 8).
 */
export const BERICHT_PREIS_REGULAER_EUR = 119;

/** Enthaltene Umsatzsteuer, nur für die Preisangabe („inkl. MwSt.“). */
export const BERICHT_PREIS_HINWEIS = 'inkl. gesetzlicher Umsatzsteuer';

/** Ist „Später am Rechner fortsetzen“ (Link per E-Mail) aktiv? Erst mit Persistenz. */
export const FORTSETZEN_AKTIV = false;

/**
 * Zahlung (Entscheidung 20.09.2026): vorab, über Stripe Checkout; danach erhält
 * die Kundin oder der Kunde Rechnung und Bericht (PDF) per E-Mail. Ob die
 * Bestellung technisch freigeschaltet ist, entscheidet serverseitig
 * `bestellungAktiv()` in lib/zahlung.ts (Stripe-Schlüssel vorhanden).
 */
export const ZAHLUNG = {
  vorab: true,
  abwicklung: 'Stripe',
  wege: ['Kreditkarte oder Debitkarte', 'PayPal', 'Klarna'],
  lieferung:
    'Nach Zahlungseingang erhalten Sie Rechnung und Bericht als PDF per E-Mail – in der Regel innerhalb weniger Minuten.',
} as const;

export type BusinessModelId = 'hybrid' | 'kanzlei';

export interface BusinessModel {
  id: BusinessModelId;
  name: string;
  beschreibung: string;
  /** Text für den Abschnitt „Was kostet es“. */
  preisHinweis: string;
}

export const BUSINESS_MODELS: Record<BusinessModelId, BusinessModel> = {
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid: kostenlose Ampel, kostenpflichtiger Bericht',
    beschreibung:
      'Die Ampel und die Einordnung in Worten sind kostenlos. Wer die Zahlen will – Spanne, Jahrestabelle, Quellen –, bestellt den schriftlichen Bericht zum Festpreis.',
    preisHinweis: `Die Ampel kostet nichts. Der schriftliche Bericht: Einführungspreis ${BERICHT_PREIS_BRUTTO_EUR} € statt ${BERICHT_PREIS_REGULAER_EUR} €, ${BERICHT_PREIS_HINWEIS}. Kein Abo, keine Folgekosten.`,
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
