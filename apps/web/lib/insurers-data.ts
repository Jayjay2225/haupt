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

/** Gattungsbegriffe, die niemals eine bestimmte Gesellschaft meinen. */
const GENERISCHE_EINGABEN = new Set([
  'leben',
  'lebensversicherung',
  'lebensversicherungen',
  'rentenversicherung',
  'versicherung',
  'versicherungen',
  'versicherung ag',
  'lebensversicherung ag',
  'ag',
  'gmbh',
  'se',
  'a.g.',
  'aktiengesellschaft',
  'lv',
  'rv',
  'police',
  'vertrag',
]);

/**
 * Ordnet eine Freitexteingabe einem Versicherer zu (Name oder Altname).
 * Bewusst konservativ: Gattungsbegriffe („Lebensversicherung“, „AG“) und sehr
 * kurze Eingaben liefern 'unbekannt' (Branchendurchschnitt) statt zufällig die
 * erste Gesellschaft der Liste; Teiltreffer nur, wenn die Eingabe im Namen
 * enthalten ist – nie umgekehrt.
 */
export function findeVersichererId(eingabe: string): string {
  const gesucht = eingabe.trim().toLowerCase().replace(/\s+/g, ' ');
  if (gesucht === '' || gesucht.length < 4 || GENERISCHE_EINGABEN.has(gesucht)) {
    return 'unbekannt';
  }
  // 1. exakter Name/Altname, 2. Namensanfang, 3. Teilzeichenkette (ab 6 Zeichen).
  for (const pruefung of [
    (n: string) => n === gesucht,
    (n: string) => n.startsWith(gesucht),
    (n: string) => gesucht.length >= 6 && n.includes(gesucht),
  ]) {
    for (const v of insurersDaten.insurers) {
      const kandidaten = [v.kanonischerName, ...v.altnamen].map((n) => n.toLowerCase());
      if (kandidaten.some(pruefung)) {
        return v.id;
      }
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

/** Unternehmensreihe der Nettoverzinsung (nur Jahre mit eigenem Wert), sortiert. */
export function unternehmensNettoReihe(id: string): { jahr: number; wert: number }[] {
  const v = versichererNachId(id);
  if (v === undefined) {
    return [];
  }
  return Object.entries(v.kennzahlen)
    .flatMap(([jahr, kz]) => (kz.nettoverzinsung ? [{ jahr: Number(jahr), wert: kz.nettoverzinsung.wert }] : []))
    .sort((a, b) => a.jahr - b.jahr);
}

/** Quellen (Titel) der Unternehmens-Nettoverzinsung, dedupliziert – für die Bildunterschrift. */
export function quellenDerUnternehmensreihe(id: string): string[] {
  const v = versichererNachId(id);
  if (v === undefined) {
    return [];
  }
  const titel = new Set<string>();
  for (const kz of Object.values(v.kennzahlen)) {
    if (kz.nettoverzinsung) {
      titel.add(kz.nettoverzinsung.quelle.titel);
    }
  }
  return [...titel];
}
