/**
 * Programmatische Schnittstelle des Gutachten-Generators – genutzt von der
 * Website (Auslieferung nach Zahlungseingang) und von den Beispielskripten.
 */
export { renderBerichtHtml, renderDruckvorlageHtml, uebernahmeMoeglich, GUTACHTEN_UNTERZEILE } from './template';
export type { BerichtInput, Anschrift } from './template';
export { htmlZuPdf } from './pdf';
export type { KopfzeilenDaten } from './pdf';
export { formatDatum, formatEuro } from './format';
