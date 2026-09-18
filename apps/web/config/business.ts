/**
 * Geschäftsmodell-Schalter laut Prompt 6 (docs/PROMPTS.md): alle drei Modelle
 * sind angelegt und werden per Konfiguration aktiviert. Die Entscheidung für
 * A, B oder C ist offen (docs/STATUS.md); bis dahin ist B vorläufig aktiv,
 * weil es ohne Zahlungsintegration lauffähig ist – Begründung in
 * docs/ASSUMPTIONS.md.
 */
export type BusinessModelId = 'A' | 'B' | 'C';

export interface BusinessModel {
  id: BusinessModelId;
  name: string;
  /** Kurzbeschreibung für interne Zwecke und den Preis-/Modell-Abschnitt. */
  beschreibung: string;
  /** Text für den Abschnitt „Preis bzw. Modell“ auf der Startseite. */
  preisHinweis: string;
}

export const BUSINESS_MODELS: Record<BusinessModelId, BusinessModel> = {
  A: {
    id: 'A',
    name: 'Kurzprüfung gegen Festpreis',
    beschreibung:
      'Schriftliche Kurzprüfung als PDF gegen Festpreis; Zahlung vor Erstellung, Rechnung per E-Mail.',
    preisHinweis:
      'Die schriftliche Kurzprüfung wird zum Festpreis erstellt. Der Preis wird vor der Beauftragung klar angezeigt; bezahlt wird vor Erstellung, die Rechnung kommt per E-Mail.',
  },
  B: {
    id: 'B',
    name: 'Kostenlose Vorschau',
    beschreibung:
      'Kostenlose Ersteinschätzung (Ampel und Spanne); Weitergabe an eine Partnerkanzlei nur mit ausdrücklicher Einwilligung.',
    preisHinweis:
      'Die Ersteinschätzung (Ampel und Wertspanne) ist kostenlos. Eine Weitergabe Ihrer Daten an eine Partnerkanzlei erfolgt ausschließlich mit Ihrer ausdrücklichen Einwilligung – niemals automatisch.',
  },
  C: {
    id: 'C',
    name: 'B2B-Zugang für Kanzleien und Versicherungsberater',
    beschreibung:
      'Eigener Login, Mandantenverwaltung und White-Label-Bericht für Kanzleien und Versicherungsberater.',
    preisHinweis:
      'Zugang für Kanzleien und Versicherungsberater mit eigenem Login, Mandantenverwaltung und White-Label-Bericht. Konditionen auf Anfrage.',
  },
};

/** Vorläufig aktives Modell – Entscheidung offen, siehe docs/ASSUMPTIONS.md. */
export const ACTIVE_MODEL: BusinessModelId = 'B';

export const activeModel: BusinessModel = BUSINESS_MODELS[ACTIVE_MODEL];
