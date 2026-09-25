/**
 * Kundenstimmen (Prompt 12, Abschnitt 5): Quelle ist data/testimonials.json.
 * Es werden AUSSCHLIESSLICH Einträge mit Prüfvermerk (verified) UND gefülltem
 * Einwilligungs-Zeitstempel (consent_at) gerendert. Wortlaut exakt aus der
 * Freigabe (docs/freigaben/); Bearbeitungen nur als Kürzung, das Original
 * bleibt in quote_original gespeichert.
 */
import daten from '../../../data/testimonials.json';

export interface Testimonial {
  quote_display: string;
  quote_original: string;
  name_display: string;
  age: number;
  contract_type: string;
  consent_text: string;
  /** ISO-Zeitstempel der dokumentierten Einwilligung (Pflicht fürs Rendern). */
  consent_at: string;
  consent_channel: string;
  customer_ref: string;
  verified: boolean;
}

export const TESTIMONIALS: Testimonial[] = (daten as { stimmen: Testimonial[] }).stimmen;
