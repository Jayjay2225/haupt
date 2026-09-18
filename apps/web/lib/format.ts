/**
 * Zahlen- und Datumsformatierung nach de-DE (CLAUDE.md, Prinzip 6):
 * Anzeige 1.234,56 €, intern ISO bzw. number.
 */

const euroFormat = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

export function formatEuro(betrag: number): string {
  return euroFormat.format(betrag);
}

/**
 * Liest eine deutsche Betragseingabe („1.234,56“, „1234,56“, „2400“,
 * auch mit €-Zeichen oder Leerzeichen). Punkte gelten als
 * Tausendertrennzeichen, das Komma als Dezimaltrennzeichen.
 * Gibt bei leerer oder nicht lesbarer Eingabe null zurück.
 */
export function parseDecimalDe(eingabe: string): number | null {
  const bereinigt = eingabe.replace(/[€\s]/g, '');
  if (bereinigt === '') {
    return null;
  }
  if (!/^-?[\d.]*,?\d*$/.test(bereinigt) || !/\d/.test(bereinigt)) {
    return null;
  }
  const normalisiert = bereinigt.replace(/\./g, '').replace(',', '.');
  const wert = Number(normalisiert);
  return Number.isFinite(wert) ? wert : null;
}

/** ISO-Monat (YYYY-MM) → deutsche Anzeige (MM/YYYY). */
export function formatMonatDe(isoMonat: string): string {
  const treffer = /^(\d{4})-(\d{2})$/.exec(isoMonat);
  if (!treffer) {
    return isoMonat;
  }
  return `${treffer[2]}/${treffer[1]}`;
}

/** ISO-Datum (YYYY-MM-DD) → deutsche Anzeige (TT.MM.JJJJ). */
export function formatDatumDe(isoDatum: string): string {
  const treffer = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDatum);
  if (!treffer) {
    return isoDatum;
  }
  return `${treffer[3]}.${treffer[2]}.${treffer[1]}`;
}
