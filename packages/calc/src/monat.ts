/**
 * Monatsarithmetik auf ISO-Monaten ("YYYY-MM"). Intern wird mit einem
 * fortlaufenden Monatsindex gerechnet (Jahr × 12 + Monat − 1), damit alle
 * Datumsrechnungen deterministisch und zeitzonenfrei sind.
 */

export interface Monat {
  jahr: number;
  monat: number; // 1–12
}

const ISO_MONAT = /^(\d{4})-(\d{2})$/;

export function parseMonat(iso: string): Monat {
  const treffer = ISO_MONAT.exec(iso);
  if (!treffer) {
    throw new Error(`Ungültiger ISO-Monat: "${iso}" (erwartet YYYY-MM).`);
  }
  const jahr = Number(treffer[1]);
  const monat = Number(treffer[2]);
  if (monat < 1 || monat > 12) {
    throw new Error(`Ungültiger Monat in "${iso}".`);
  }
  return { jahr, monat };
}

export function monatsIndex(iso: string): number {
  const { jahr, monat } = parseMonat(iso);
  return jahr * 12 + (monat - 1);
}

export function indexZuIso(index: number): string {
  const jahr = Math.floor(index / 12);
  const monat = (index % 12) + 1;
  return `${String(jahr).padStart(4, '0')}-${String(monat).padStart(2, '0')}`;
}

export function jahrVonIndex(index: number): number {
  return Math.floor(index / 12);
}
