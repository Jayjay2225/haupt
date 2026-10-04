/**
 * de-DE-Format und deutsche Beschriftungen für nutzersichtbare Annahme- und
 * Warntexte des Rechenkerns (CLAUDE.md, Prinzip 6): Zahlen 1.234,56, Monate
 * MM/JJJJ. Intern bleiben Werte Zahlen und Daten ISO – die Helfer werden
 * ausschließlich in Texten verwendet. Keine UI-Abhängigkeit (Intl ist
 * Sprach-Builtin).
 */
import { parseMonat } from './monat';
import type { Vertragsart, Vertragsstatus, Zahlweise } from './types';

const formate = new Map<string, Intl.NumberFormat>();

/** Zahl im de-DE-Format mit min./max. Nachkommastellen (Standard: genau zwei). */
export function zahlDe(x: number, nachkommastellen = 2, maxNachkommastellen = nachkommastellen): string {
  const schluessel = `${nachkommastellen}:${maxNachkommastellen}`;
  let format = formate.get(schluessel);
  if (format === undefined) {
    format = new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: nachkommastellen,
      maximumFractionDigits: maxNachkommastellen,
    });
    formate.set(schluessel, format);
  }
  const text = format.format(x);
  // Werte, die auf 0 runden, ohne Minuszeichen („-0,00“ → „0,00“).
  return /^-0(?:,0+)?$/.test(text) ? text.slice(1) : text;
}

/** Betrag in Euro (1.234,56 €). */
export function euroDe(x: number): string {
  return `${zahlDe(x, 2)} €`;
}

/** ISO-Monat (YYYY-MM) → MM/JJJJ. */
export function monatDe(iso: string): string {
  const { jahr, monat } = parseMonat(iso);
  return `${String(monat).padStart(2, '0')}/${jahr}`;
}

/** Deutsche Beschriftungen der internen Feldwerte (auch vom Gutachten verwendet). */
export const VERTRAGSART_TEXT: Record<Vertragsart, string> = {
  'kapital-lv': 'Kapitallebensversicherung',
  'private-rv': 'Private Rentenversicherung',
  'fonds-lv': 'Fondsgebundene Lebensversicherung',
  'fonds-rv': 'Fondsgebundene Rentenversicherung',
  rueckdeckung: 'Rückdeckungsversicherung',
};

export const STATUS_TEXT: Record<Vertragsstatus, string> = {
  laufend: 'laufend',
  beitragsfrei: 'beitragsfrei',
  gekuendigt: 'gekündigt',
  abgelaufen: 'abgelaufen/ausgezahlt',
};

/** Bezeichnung des Betrags im Feld `rueckkaufswert` je Vertragsstand (Gutachten, Angabentabelle). */
export const RUECKKAUFSWERT_TEXT: Record<Vertragsstatus, string> = {
  laufend: 'Aktueller Rückkaufswert',
  beitragsfrei: 'Aktueller Rückkaufswert',
  gekuendigt: 'Ausgezahlter Rückkaufswert',
  abgelaufen: 'Ausgezahlte Ablaufleistung',
};

export const ZAHLWEISE_TEXT: Record<Zahlweise, string> = {
  monatlich: 'monatlich',
  vierteljaehrlich: 'vierteljährlich',
  halbjaehrlich: 'halbjährlich',
  jaehrlich: 'jährlich',
  einmalbeitrag: 'Einmalbeitrag',
};
