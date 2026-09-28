/**
 * Hilfetexte „Wo finde ich das?“ (Prompt 14, Abschnitt 1.4) – ein Text je
 * Feld, Wortlaut aus dem Deck. Auf der Startseite öffnet ein Info-Symbol ein
 * Info-Fenster mit Text und Skizze (components/Hilfe.tsx, components/Skizze.tsx);
 * im Funnel erscheint derselbe Text als aufklappbare Zeile unter dem Feld.
 * Die Skizzen sind schematisch (keine echten Versicherer-Dokumente).
 */

export type HilfeFeld =
  | 'versicherer'
  | 'beginn'
  | 'beitrag'
  | 'rueckkaufswert'
  | 'dynamik'
  | 'beitragssumme'
  | 'vertragsart'
  | 'status'
  | 'auszahlungen'
  | 'geburtsdatum';

/** Welche schematische Skizze das Info-Fenster zeigt. */
export type SkizzenArt = 'standmitteilung' | 'police' | 'nachtrag' | 'schreiben';

export interface Hilfetext {
  titel: string;
  text: string;
  skizze: SkizzenArt;
  /** Zeile der Skizze, die markiert wird (Beschriftung laut components/Skizze.tsx). */
  markierung: string;
}

export const HILFETEXTE: Record<HilfeFeld, Hilfetext> = {
  versicherer: {
    titel: 'Versicherer',
    text: 'Steht oben auf jeder Standmitteilung und auf der ersten Seite Ihrer Police. Der Name kann sich geändert haben (z. B. Hamburg-Mannheimer → ERGO). Geben Sie den Namen ein, der auf Ihrem Papier steht – wir ordnen ihn zu.',
    skizze: 'police',
    markierung: 'Kopf',
  },
  beginn: {
    titel: 'Vertragsbeginn',
    text: 'Police, erste Seite: „Versicherungsbeginn“ oder „Beginn der Versicherung“. Nicht das Datum des Antrags oder Ihrer Unterschrift.',
    skizze: 'police',
    markierung: 'Versicherungsbeginn',
  },
  beitrag: {
    titel: 'Monatsbeitrag',
    text: 'Police: „Beitrag“ oder „Prämie“. Wenn Sie nur Ihren heutigen Beitrag kennen: eingeben und „heutiger Beitrag“ wählen. Vor 2002 in DM? Schalter umstellen.',
    skizze: 'police',
    markierung: 'Beitrag',
  },
  rueckkaufswert: {
    titel: 'Rückkaufswert',
    text: 'Steht in der letzten Standmitteilung, die einmal im Jahr kommt: „Rückkaufswert“, „Rückvergütung“ oder „Wert bei Kündigung zum …“. Achtung: „Garantiewert“ oder „Ablaufleistung“ sind etwas anderes. Keine Standmitteilung zur Hand? Fordern Sie sie beim Versicherer an, meist in ein bis zwei Wochen da. Mustertext zum Kopieren: „Bitte senden Sie mir eine aktuelle Standmitteilung mit Rückkaufswert und Summe der gezahlten Beiträge zum Vertrag Nr. …“',
    skizze: 'standmitteilung',
    markierung: 'Rückkaufswert',
  },
  dynamik: {
    titel: 'Dynamik',
    text: 'Police oder Nachträge: „Dynamik“, „planmäßige Erhöhung“, „Beitragsanpassung“. Meist 3, 5 oder 10 % pro Jahr. Ist Ihr Beitrag heute deutlich höher als am Anfang, hatten Sie eine Dynamik.',
    skizze: 'nachtrag',
    markierung: 'Dynamik',
  },
  beitragssumme: {
    titel: 'Beitragssumme',
    text: 'Standmitteilung: „Summe der gezahlten Beiträge“ oder „eingezahlte Beiträge“. Nicht jeder Versicherer weist sie aus – dann einfach überspringen.',
    skizze: 'standmitteilung',
    markierung: 'Summe der gezahlten Beiträge',
  },
  vertragsart: {
    titel: 'Vertragsart',
    text: 'Police, erste Seite: „Kapitallebensversicherung“, „Rentenversicherung“, „fondsgebunden“ oder „Fondspolice“.',
    skizze: 'police',
    markierung: 'Vertragsart',
  },
  status: {
    titel: 'Status',
    text: 'Läuft: Sie zahlen noch. Beitragsfrei: Sie zahlen nicht mehr, der Vertrag besteht. Gekündigt oder ausgezahlt: der Vertrag ist beendet.',
    skizze: 'standmitteilung',
    markierung: 'Stand des Vertrags',
  },
  auszahlungen: {
    titel: 'Auszahlungen',
    text: 'Teilauszahlungen, Vorschüsse oder ein Policendarlehen. Datum und Betrag stehen im Schreiben des Versicherers.',
    skizze: 'schreiben',
    markierung: 'Auszahlung',
  },
  geburtsdatum: {
    titel: 'Geburtsdatum',
    text: 'Für den Risikoanteil in Ihrem Beitrag: Je jünger Sie beim Abschluss waren, desto mehr davon war Sparanteil.',
    skizze: 'police',
    markierung: 'Geburtsdatum',
  },
};

export const HILFE_ZEILE = 'Wo finde ich das?';
