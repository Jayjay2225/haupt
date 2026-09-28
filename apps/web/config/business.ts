/**
 * Geschäftsmodell und Zugang (Prompt 12, Abschnitt 2; Prompt 14: Post-Option,
 * Videocall, Preisblock ohne Streichpreis): Hybrid.
 *
 * - ACCESS_MODE = 'lead': Ampel kostenlos, Gutachten 89 €.
 * - Freischaltcodes (lib/erstkunden.ts) überspringen die Zahlung.
 * - Modell C (Kanzlei-Lizenz) bleibt im Code und wird über
 *   NEXT_PUBLIC_PRODUKT_VARIANTE=kanzlei aktiviert (siehe variante.ts).
 */
import { PRODUKT_VARIANTE } from './variante';

/** Zugangsmodell: Ampel kostenlos, Gutachten kostenpflichtig. */
export const ACCESS_MODE = 'lead' as const;

/** Bruttopreis des Gutachtens in Euro (wird berechnet). Kein Streichpreis (Prompt 14, 0.5). */
export const BERICHT_PREIS_BRUTTO_EUR = 89;

/** Enthaltene Umsatzsteuer, nur für die Preisangabe („inkl. MwSt.“). */
export const BERICHT_PREIS_HINWEIS = 'inkl. gesetzlicher Umsatzsteuer';

/**
 * „Später weitermachen“-Link per E-Mail: aktiv. Der Link trägt den
 * Zwischenstand selbst (komprimiert, 30 Tage gültig) – keine Persistenz nötig.
 */
export const FORTSETZEN_AKTIV = true;

/** Gültigkeit des Weitermachen-Links in Tagen. */
export const FORTSETZEN_TAGE = 30;

/**
 * Postversand (Prompt 14, 0.3 und 3): kostenlose Zusatzoption zur E-Mail,
 * 2–7 Werktage, mit Beileger zum Ankauf. Versand über einen Druckdienstleister
 * mit Auftragsverarbeitungsvertrag (Platzhalter [[DRUCKDIENST]]). Die Kosten
 * je Sendung dienen der Kalkulation und werden erst mit dem Angebot des
 * Dienstleisters eingetragen – kein geschätzter Wert (Prinzip 1).
 */
export const POST_VERSAND = {
  aktiv: true,
  werktageVon: 2,
  werktageBis: 7,
  kostenlosFuerKunden: true,
  druckdienst: '[[DRUCKDIENST: Druck- und Versanddienstleister mit AV-Vertrag]]',
  postKosten: { jeSendungEur: null as number | null, quelle: '[[DRUCKDIENST: Preis je Sendung laut Angebot]]' },
} as const;

/** „2–7 Werktage“ – ein Ort für die Formulierung. */
export const POST_WERKTAGE_TEXT = `${POST_VERSAND.werktageVon}–${POST_VERSAND.werktageBis} Werktage`;

/**
 * Kostenloser Videocall bei Rückfragen (Prompt 14, 0.7 und 1.8): ein Satz im
 * FAQ, auf /durchsetzung und als letzte Zeile der Gutachten-E-Mail. Der Link
 * zeigt auf ein Buchungstool; ohne Adresse bleibt der Platzhalter sichtbar.
 */
export const VIDEOCALL = {
  satz: 'Fragen? 15 Minuten am Bildschirm, kostenlos.',
  linkText: 'Termin wählen',
  url: process.env['NEXT_PUBLIC_VIDEOCALL_URL'] ?? '',
  platzhalter: '[[VIDEOCALL-URL: Buchungstool]]',
} as const;

/**
 * Preisvergleich im Preisblock (Prompt 14, Abschnitt 4): Der Satz darf nur
 * mit Quelle in docs/QUELLEN.md erscheinen – ohne Quelle wird er gestrichen.
 * NEXT_PUBLIC_PREISVERGLEICH_QUELLE trägt die Kennung des Quelleneintrags.
 */
export const PREISVERGLEICH = {
  satz: 'Zum Vergleich: Einzelgutachten von Versicherungsmathematikern kosten mehrere hundert Euro.',
  quelle: process.env['NEXT_PUBLIC_PREISVERGLEICH_QUELLE'] ?? '',
} as const;

/**
 * Zahlung (Entscheidung 20.09.2026, erweitert Prompt 12/14): vorab, über
 * Stripe Checkout; danach erhält die Kundin oder der Kunde Rechnung und
 * Gutachten (PDF) per E-Mail, auf Wunsch zusätzlich gedruckt per Post. Ob die
 * Bestellung technisch freigeschaltet ist, entscheidet serverseitig
 * `bestellungAktiv()` in lib/zahlung.ts (Stripe-Schlüssel vorhanden). SEPA
 * und Klarna müssen im Stripe-Dashboard aktiviert sein.
 */
export const ZAHLUNG = {
  vorab: true,
  abwicklung: 'Stripe',
  wege: ['Kreditkarte oder Debitkarte', 'SEPA-Lastschrift', 'PayPal', 'Klarna'],
  lieferung: `Nach Zahlungseingang erhalten Sie die Rechnung sofort und das Gutachten innerhalb von 12 Stunden per E-Mail – auf Wunsch zusätzlich kostenlos per Post (${POST_WERKTAGE_TEXT}).`,
} as const;

/**
 * Versand des Gutachtens (Prompt 13, Abschnitt 3): Es wird nach Zahlung
 * erzeugt, vor dem Versand plausibilisiert (Freigabe-Liste im Admin) und
 * spätestens nach `autoVersandNachStunden` automatisch versendet, damit die
 * zugesagten `maxStunden` immer gehalten werden.
 */
export const BERICHT_VERSAND = {
  maxStunden: 12,
  autoVersandNachStunden: 10,
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
    name: 'Hybrid: kostenlose Ampel, kostenpflichtiges Gutachten',
    beschreibung:
      'Die Ampel ist kostenlos. Wer die genaue Zahl will – Jahr für Jahr, mit Quellen –, bestellt das Gutachten zum Festpreis.',
    preisHinweis: `Die Ampel kostet nichts. Das Gutachten: ${BERICHT_PREIS_BRUTTO_EUR} € einmalig, ${BERICHT_PREIS_HINWEIS}. Kein Abo, keine Folgekosten.`,
  },
  kanzlei: {
    id: 'kanzlei',
    name: 'Kanzlei-Lizenz (Modell C)',
    beschreibung:
      'Eigener Zugang für Kanzleien und Versicherungsberater: Belehrungs-Check, Beträge, Gutachten als White-Label. Markenneutral.',
    preisHinweis: 'Lizenzkonditionen nach Vereinbarung.',
  },
};

export const ACTIVE_MODEL: BusinessModelId = PRODUKT_VARIANTE === 'kanzlei' ? 'kanzlei' : 'hybrid';

export const activeModel: BusinessModel = BUSINESS_MODELS[ACTIVE_MODEL];
