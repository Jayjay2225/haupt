/** ISO-Wochen-Helfer: "2026-W35" wie in der bisherigen Excel-Gewohnheit. */

export function isoWoche(datum: Date): string {
  const d = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
  const tag = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - tag);
  const jahresanfang = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const woche = Math.ceil(((d.getTime() - jahresanfang.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(woche).padStart(2, '0')}`;
}

/** Montag 00:00 lokaler Zeit der Woche, in der `datum` liegt. */
export function wochenstart(datum: Date): Date {
  const d = new Date(datum);
  const tag = d.getDay() || 7;
  d.setDate(d.getDate() - tag + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function wocheDavor(woche: string, zurueck = 1): string {
  const [jahr, w] = woche.split('-W').map(Number);
  const d = new Date(Date.UTC(jahr, 0, 4)); // 4. Januar liegt immer in W01
  d.setUTCDate(d.getUTCDate() + (w - 1 - zurueck) * 7);
  return isoWoche(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Sortierbar als String — ISO-Wochen sind lexikografisch chronologisch. */
export function wochenVergleich(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
