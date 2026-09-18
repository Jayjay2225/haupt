/**
 * Regelbasierte Interpretation freier Eingaben (Konzept Kapitel 10) — ohne jede KI.
 * Krisen-Check zuerst (Kapitel 11): bei Treffer endet der Flow ohne Scoring.
 */
import type { Interpretation } from './typen';
import type { Impuls, KriseKategorie } from '../daten';

export function normalisiere(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function pruefeKrise(text: string, kategorien: KriseKategorie[]): boolean {
  const norm = normalisiere(text);
  return kategorien.some((k) => k.muster.some((m) => norm.includes(normalisiere(m))));
}

/**
 * Keyword-Matching gegen die Impuls-Bibliothek. Mehrfach-Treffer: höchste Trefferzahl
 * gewinnt; Gleichstand oder kein Treffer → Konfidenz niedrig, die App fragt statt zu raten.
 */
export function interpretiere(
  text: string,
  impulse: Impuls[],
  krise: KriseKategorie[],
): Interpretation {
  if (pruefeKrise(text, krise)) {
    return { freitext: text, bereiche: [], beduerfnisse: [], konfidenz: 'niedrig', krise: true };
  }
  const norm = ' ' + normalisiere(text) + ' ';
  let beste: { impuls: Impuls; treffer: number }[] = [];
  for (const imp of impulse) {
    const treffer = imp.keywords.filter((k) => norm.includes(normalisiere(k))).length;
    if (treffer > 0) beste.push({ impuls: imp, treffer });
  }
  beste = beste.sort((a, b) => b.treffer - a.treffer);
  const top = beste[0];
  const gleichstand = beste.length > 1 && beste[1].treffer === top?.treffer;

  if (!top || gleichstand) {
    return { freitext: text, bereiche: [], beduerfnisse: [], konfidenz: 'niedrig', krise: false };
  }
  return {
    impulsId: top.impuls.id,
    freitext: text,
    bereiche: top.impuls.bereiche,
    beduerfnisse: top.impuls.beduerfnisse,
    konfidenz: 'hoch',
    krise: false,
  };
}
