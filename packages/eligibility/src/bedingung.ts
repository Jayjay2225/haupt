/**
 * Auswertung der Bedingungs-Syntax aus data/legal-rules.json:
 * {alle: [...]}/{eine: [...]} mit Blättern {feld, ist|in} und
 * Datumsvergleichen {feld, vor|ab|zwischen}.
 */
import type { Bedingung, BedingungsKnoten, EligibilityInput } from './types';

/**
 * Normalisiert die Vertragsschluss-Angabe für Datumsvergleiche.
 * Ist nur der Monat bekannt (YYYY-MM), wird die Monatsmitte angesetzt;
 * Grenzmonate behandelt der Aufrufer gesondert (Hinweis „Tag entscheidet").
 */
export function vergleichsdatum(vertragsschluss: string): string {
  if (/^\d{4}-\d{2}$/.test(vertragsschluss)) {
    return `${vertragsschluss}-15`;
  }
  return vertragsschluss;
}

function feldwert(input: EligibilityInput, feld: string): string | undefined {
  if (feld === 'vertragsschluss') {
    return vergleichsdatum(input.vertragsschluss);
  }
  const wert = (input as unknown as Record<string, unknown>)[feld];
  return typeof wert === 'string' ? wert : undefined;
}

export function erfuellt(input: EligibilityInput, knoten: BedingungsKnoten): boolean {
  if ('alle' in knoten) {
    return knoten.alle.every((k) => erfuellt(input, k));
  }
  if ('eine' in knoten) {
    return knoten.eine.some((k) => erfuellt(input, k));
  }
  const wert = feldwert(input, knoten.feld);
  if (wert === undefined) {
    return false;
  }
  if ('ist' in knoten) {
    return wert === knoten.ist;
  }
  if ('in' in knoten) {
    return knoten.in.includes(wert);
  }
  if ('vor' in knoten) {
    return wert < knoten.vor;
  }
  if ('ab' in knoten) {
    return wert >= knoten.ab;
  }
  if ('zwischen' in knoten) {
    return wert >= knoten.zwischen[0] && wert <= `${knoten.zwischen[1]}￿`;
  }
  return false;
}

export function erfuelltBedingung(input: EligibilityInput, bedingung: Bedingung): boolean {
  return erfuellt(input, bedingung);
}
