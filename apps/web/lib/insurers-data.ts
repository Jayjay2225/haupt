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
  // nach der Bindestrich-Normalisierung (siehe normalisiereName)
  'versicherungs ag',
  'lebensversicherungs ag',
]);

/** Kleinschreibung, Bindestriche als Leerzeichen, Leerraum vereinheitlicht – für Eingabe und Kandidaten gleich. */
function normalisiereName(s: string): string {
  return s.trim().toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Ordnet eine Freitexteingabe einem Versicherer zu (Name oder Altname).
 * Bewusst konservativ: Gattungsbegriffe („Lebensversicherung“, „AG“) und
 * Eingaben unter drei Zeichen liefern 'unbekannt' (Branchendurchschnitt) statt
 * zufällig die erste Gesellschaft der Liste; dreistellige Kürzel (AXA, HDI,
 * LVM, HUK, R+V, DBV) nur als ganzes erstes Wort des Namens; Teiltreffer nur,
 * wenn die Eingabe im Namen enthalten ist – nie umgekehrt. Bindestriche und
 * Leerzeichen gelten als gleich („HUK Coburg“ = „HUK-Coburg“).
 */
export function findeVersichererId(eingabe: string): string {
  const gesucht = normalisiereName(eingabe);
  if (gesucht === '' || gesucht.length < 3 || GENERISCHE_EINGABEN.has(gesucht)) {
    return 'unbekannt';
  }
  // Drei Zeichen: exakt oder als erstes Wort. Ab vier Zeichen: 1. exakter
  // Name/Altname, 2. Namensanfang, 3. Teilzeichenkette (ab 6 Zeichen).
  const pruefungen: ((n: string) => boolean)[] =
    gesucht.length < 4
      ? [(n) => n === gesucht || n.startsWith(`${gesucht} `)]
      : [(n) => n === gesucht, (n) => n.startsWith(gesucht), (n) => gesucht.length >= 6 && n.includes(gesucht)];
  for (const pruefung of pruefungen) {
    for (const v of insurersDaten.insurers) {
      const kandidaten = [v.kanonischerName, ...v.altnamen].map(normalisiereName);
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

/**
 * Anzeigetitel einer Quelle für die Website: Jahrgangsvarianten derselben
 * Aufsichtsstatistik werden zu einem Eintrag zusammengefasst, Mehrfachfirmen
 * eines Geschäftsberichts auf die erste gekürzt, und die Behörde wird – wie
 * überall auf der Website – nicht beim Namen genannt (Wording-Regel,
 * docs/TEXT-REVIEW.md Nr. 12). Die vollständigen Titel je Jahr stehen
 * weiterhin in data/insurers.json.
 */
export function anzeigeTitel(titel: string): string {
  if (/^BaFin, Statistik der Erstversicherungsunternehmen \d{4}, Lebensversicherer, Tabelle 160/.test(titel)) {
    return 'Aufsichtsstatistik der Erstversicherungsunternehmen (Lebensversicherer, Tabelle 160, Reinverzinsung = Nettoverzinsung der Kapitalanlagen)';
  }
  return titel
    .replace(/^([^,/]+?) \/ [^,]+, /, '$1 u. a., ')
    .replace(/Bundesanstalt für Finanzdienstleistungsaufsicht|\bBaFin\b/g, 'Versicherungsaufsicht');
}

/** Quellen (Anzeigetitel) der Unternehmens-Nettoverzinsung, dedupliziert – für Hinweisbox und Bildunterschrift. */
export function quellenDerUnternehmensreihe(id: string): string[] {
  const v = versichererNachId(id);
  if (v === undefined) {
    return [];
  }
  const titel = new Set<string>();
  for (const [, kz] of Object.entries(v.kennzahlen).sort(([a], [b]) => Number(a) - Number(b))) {
    if (kz.nettoverzinsung) {
      titel.add(anzeigeTitel(kz.nettoverzinsung.quelle.titel));
    }
  }
  return [...titel];
}

/** Quellen (Anzeigetitel) der Branchen-Nettoverzinsung, dedupliziert, in Jahresreihenfolge – für die Bildunterschrift. */
export function quellenDerBranchenreihe(): string[] {
  const titel = new Set<string>();
  for (const [, kz] of Object.entries(insurersDaten.branchendurchschnitt.nettoverzinsung).sort(([a], [b]) => Number(a) - Number(b))) {
    titel.add(anzeigeTitel(kz.quelle.titel));
  }
  return [...titel];
}
