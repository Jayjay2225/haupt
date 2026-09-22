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
  // Ein einzelner Punkt mit ein bis zwei Nachkommastellen ist ein (englischer)
  // Dezimalpunkt, kein Tausendertrennzeichen: „12345.67“ → 12345,67.
  if (/^-?\d+\.\d{1,2}$/.test(bereinigt)) {
    const direkt = Number(bereinigt);
    return Number.isFinite(direkt) ? direkt : null;
  }
  if (!/^-?[\d.]*,?\d*$/.test(bereinigt) || !/\d/.test(bereinigt)) {
    return null;
  }
  const normalisiert = bereinigt.replace(/\./g, '').replace(',', '.');
  const wert = Number(normalisiert);
  return Number.isFinite(wert) ? wert : null;
}

/**
 * Liest eine Monatsangabe in den Schreibweisen, die Menschen tatsächlich
 * eintippen: „03/2000“, „3/2000“, „03.2000“, „03-2000“, „03 2000“, „032000“,
 * zweistelliges Jahr („03/95“) sowie die ISO-Form „2000-03“, die Browser mit
 * Monatsauswahl liefern. Ergebnis ist immer ISO (YYYY-MM); nicht lesbare oder
 * unvollständige Eingaben ergeben null.
 *
 * Zweistellige Jahreszahlen: bis 30 → 20xx, darüber → 19xx (Verträge laufen
 * seit den 1970ern, der Rechner prüft die Spanne anschließend selbst).
 */
export function parseMonatDe(eingabe: string): string | null {
  const text = eingabe.trim();
  if (text === '') {
    return null;
  }
  const fertig = (jahr: number, monat: number): string | null =>
    monat >= 1 && monat <= 12 && jahr >= 1900 && jahr <= 2100
      ? `${String(jahr).padStart(4, '0')}-${String(monat).padStart(2, '0')}`
      : null;

  const iso = /^(\d{4})[-/. ](\d{1,2})$/.exec(text);
  if (iso) {
    return fertig(Number(iso[1]), Number(iso[2]));
  }
  const deutsch = /^(\d{1,2})[-/. ](\d{4})$/.exec(text);
  if (deutsch) {
    return fertig(Number(deutsch[2]), Number(deutsch[1]));
  }
  const kurz = /^(\d{1,2})[-/. ](\d{2})$/.exec(text);
  if (kurz) {
    const jj = Number(kurz[2]);
    return fertig(jj <= 30 ? 2000 + jj : 1900 + jj, Number(kurz[1]));
  }
  const kompakt = /^(\d{6})$/.exec(text);
  if (kompakt) {
    const alsIso = fertig(Number(text.slice(0, 4)), Number(text.slice(4)));
    return alsIso ?? fertig(Number(text.slice(2)), Number(text.slice(0, 2)));
  }
  return null;
}

/** ISO-Monat (YYYY-MM) → ausgeschriebene Anzeige („März 2000“); sonst Leerstring. */
export function monatNameDe(isoMonat: string): string {
  const treffer = /^(\d{4})-(\d{2})$/.exec(isoMonat);
  if (!treffer) {
    return '';
  }
  const datum = new Date(Number(treffer[1]), Number(treffer[2]) - 1, 1);
  return new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(datum);
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
