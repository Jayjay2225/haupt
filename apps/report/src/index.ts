/**
 * Programmatische Schnittstelle des Berichtsgenerators – genutzt von der
 * Website (Auslieferung nach Zahlungseingang) und von den Beispielskripten.
 */
export { renderBerichtHtml } from './template';
export type { BerichtInput } from './template';
export { htmlZuPdf } from './pdf';
export type { KopfzeilenDaten } from './pdf';
export { formatDatum, formatEuro } from './format';
