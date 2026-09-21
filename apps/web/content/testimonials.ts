/**
 * Kundenstimmen (Prompt 10, Abschnitt 5): Es werden AUSSCHLIESSLICH echte,
 * dokumentierte Stimmen gerendert – mit Einwilligungs-Kennung und Prüfvermerk.
 * Bis es sie gibt, bleibt diese Liste leer und der Block erscheint nicht
 * (der Beweis-Block der Startseite übernimmt seine Rolle).
 *
 * Aufnahme nur über das Erstkunden-Programm (docs/ERSTKUNDEN.md): Wortlaut,
 * Einwilligung mit Zeitstempel und Zuordnung zum Bericht werden abgelegt;
 * Bearbeitungen nur als Kürzung, Original bleibt gespeichert.
 */
export interface Testimonial {
  /** Kennung der dokumentierten Einwilligung (Pflicht). */
  consent_id: string;
  /** Von uns geprüft: Person war Kundin/Kunde, Zitat unverändert bzw. nur gekürzt. */
  verified: boolean;
  zitat: string;
  vorname: string;
  alter: number;
  bundesland: string;
  /** Ungekürzter Originalwortlaut (intern, wird nicht gerendert). */
  original?: string;
}

export const TESTIMONIALS: Testimonial[] = [];
