/**
 * Anzeige-Beschriftungen (deutsch, Sie-Form) für die intern englisch/ASCII
 * gehaltenen Feldwerte des CaseDraft.
 */
import type {
  BelehrungForm,
  BelehrungFrist,
  JaNeinUnbekannt,
  Vertragsart,
  Vertragsstatus,
  Zahlweise,
  Zustandekommen,
} from './draft';

export const VERTRAGSART_LABEL: Record<Exclude<Vertragsart, ''>, string> = {
  'kapital-lv': 'Kapitallebensversicherung',
  'private-rv': 'Private Rentenversicherung',
  'fonds-lv': 'Fondsgebundene Lebensversicherung',
  'fonds-rv': 'Fondsgebundene Rentenversicherung',
  rueckdeckung: 'Rückdeckungsversicherung',
  'risiko-lv': 'Risikolebensversicherung (ohne Sparanteil)',
  unbekannt: 'Weiß ich nicht',
};

export const STATUS_LABEL: Record<Exclude<Vertragsstatus, ''>, string> = {
  laufend: 'Läuft noch',
  beitragsfrei: 'Beitragsfrei gestellt',
  gekuendigt: 'Gekündigt',
  abgelaufen: 'Abgelaufen / ausgezahlt',
};

export const ZAHLWEISE_LABEL: Record<Exclude<Zahlweise, ''>, string> = {
  monatlich: 'Monatlich',
  vierteljaehrlich: 'Vierteljährlich',
  halbjaehrlich: 'Halbjährlich',
  jaehrlich: 'Jährlich',
  einmalbeitrag: 'Einmalbeitrag',
};

export const JNU_LABEL: Record<Exclude<JaNeinUnbekannt, ''>, string> = {
  ja: 'Ja',
  nein: 'Nein',
  unbekannt: 'Weiß ich nicht',
};

export const ZUSTANDEKOMMEN_LABEL: Record<Exclude<Zustandekommen, ''>, string> = {
  policenmodell:
    'Antrag unterschrieben, Police und Unterlagen kamen erst später (Policenmodell)',
  antragsmodell:
    'Alle Unterlagen lagen schon bei der Antragstellung vor (Antragsmodell)',
  unbekannt: 'Weiß ich nicht mehr',
};

export const BELEHRUNG_FRIST_LABEL: Record<Exclude<BelehrungFrist, ''>, string> = {
  '14-tage': '14 Tage',
  '30-tage': '30 Tage',
  andere: 'Eine andere Frist',
  unbekannt: 'Weiß ich nicht',
};

export const BELEHRUNG_FORM_LABEL: Record<Exclude<BelehrungForm, ''>, string> = {
  schriftform: 'Schriftform (Unterschrift verlangt)',
  textform: 'Textform (z. B. Brief, Fax, E-Mail genügt)',
  andere: 'Etwas anderes',
  unbekannt: 'Weiß ich nicht',
};

export function labelOderLeer<T extends string>(
  wert: T | '',
  labels: Record<T, string>,
): string {
  return wert === '' ? '–' : labels[wert];
}
