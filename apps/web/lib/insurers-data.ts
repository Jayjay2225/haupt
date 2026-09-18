/**
 * Serverseitiger Zugriff auf data/insurers.json – einzige Namens- und
 * Kennzahlenquelle der Website (ersetzt die frühere Starterliste).
 * Nur aus Server-Komponenten/Route-Handlern importieren; Client-Komponenten
 * erhalten abgeleitete Props (z. B. die Namensliste fürs Autocomplete).
 */
import type { InsurersDaten } from '@rueckab/calc';
import insurersJson from '../../../data/insurers.json';

export const insurersDaten = insurersJson as unknown as InsurersDaten;

export interface VersichererEintrag {
  id: string;
  kanonischerName: string;
  altnamen: string[];
}

export function alleVersicherer(): VersichererEintrag[] {
  return insurersDaten.insurers.map((v) => ({
    id: v.id,
    kanonischerName: v.kanonischerName,
    altnamen: v.altnamen,
  }));
}

/** Alle Namen (aktuelle und frühere) für die Autocomplete-Datalist. */
export function alleVersichererNamen(): string[] {
  const namen = new Set<string>();
  for (const v of insurersDaten.insurers) {
    namen.add(v.kanonischerName);
    for (const alt of v.altnamen) {
      namen.add(alt);
    }
  }
  return [...namen].sort((a, b) => a.localeCompare(b, 'de'));
}

/** Ordnet eine Freitexteingabe einem Versicherer zu (Name oder Altname). */
export function findeVersichererId(eingabe: string): string {
  const gesucht = eingabe.trim().toLowerCase();
  if (gesucht === '') {
    return 'unbekannt';
  }
  for (const v of insurersDaten.insurers) {
    const kandidaten = [v.kanonischerName, ...v.altnamen].map((n) => n.toLowerCase());
    if (kandidaten.some((n) => n === gesucht || n.includes(gesucht) || gesucht.includes(n))) {
      return v.id;
    }
  }
  return 'unbekannt';
}

export function versichererNachId(id: string) {
  return insurersDaten.insurers.find((v) => v.id === id);
}

/** Branchendurchschnitts-Reihe als sortierte Punkte (für Diagramme). */
export function branchenNettoReihe(): { jahr: number; wert: number }[] {
  return Object.entries(insurersDaten.branchendurchschnitt.nettoverzinsung)
    .map(([jahr, kz]) => ({ jahr: Number(jahr), wert: kz.wert }))
    .sort((a, b) => a.jahr - b.jahr);
}
