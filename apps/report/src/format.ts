/** de-DE-Formatierung für den Bericht (CLAUDE.md, Prinzip 6). */

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const zahl2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const zahl1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatEuro(betrag: number): string {
  return euro.format(betrag);
}

export function formatZahl(betrag: number): string {
  return zahl2.format(betrag);
}

export function formatProzent(wert: number): string {
  return `${zahl1.format(wert)} %`;
}

export function formatMonat(isoMonat: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(isoMonat);
  return m ? `${m[2]}/${m[1]}` : isoMonat;
}

export function formatDatum(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

/** Einfache HTML-Escapes für Nutzereingaben im Template. */
export function esc(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
