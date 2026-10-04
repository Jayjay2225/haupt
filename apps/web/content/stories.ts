/**
 * Geschichten von Verkäufern (Prompt 14, Abschnitt 5): Quelle ist
 * data/stories.json. Datensatz und Freigabeprozess wie bei den Kundenstimmen;
 * gerendert werden ausschließlich Einträge mit Prüfvermerk (verified) UND
 * gefülltem Einwilligungs-Zeitstempel (consent_at). Beträge und Prozentwerte
 * gehören nicht in eine Geschichte (Test).
 */
import daten from '../../../data/stories.json';

export interface Geschichte {
  title: string;
  /** Höchstens 90 Wörter; nur Kürzung des Originals, kein Umschreiben. */
  story_display: string;
  story_original: string;
  name_display: string;
  age: number;
  /** z. B. „Kapitallebensversicherung, verkauft 2026“. */
  context: string;
  consent_text: string;
  /** ISO-Zeitstempel der dokumentierten Einwilligung (Pflicht fürs Rendern). */
  consent_at: string;
  consent_channel: string;
  customer_ref: string;
  verified: boolean;
}

export const GESCHICHTEN: Geschichte[] = (daten as { geschichten: Geschichte[] }).geschichten;

/** Nur Einträge mit Prüfvermerk UND dokumentierter Einwilligung. */
export function nurFreigegebene(liste: Geschichte[]): Geschichte[] {
  return liste.filter((g) => g.verified && g.consent_at.trim() !== '');
}

/** Wortzahl der Anzeigefassung (Grenze 90). */
export function wortzahl(text: string): number {
  const bereinigt = text.trim();
  return bereinigt === '' ? 0 : bereinigt.split(/\s+/).length;
}

/** Initialen für den Avatar („Manfred K.“ → „MK“). */
export function initialen(name: string): string {
  return name
    .split(/\s+/)
    .filter((t) => t !== '')
    .slice(0, 2)
    .map((t) => t[0]?.toUpperCase() ?? '')
    .join('');
}
