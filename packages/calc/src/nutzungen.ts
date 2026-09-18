/**
 * Aufzinsung (CALC-SPEC Abschnitt 4 und 5): monatliche Verzinsung r/12,
 * Einzahlung wirkt ab dem Folgemonat (Konvention „Einzahlung zum
 * Monatsende"): V_m = V_{m−1} · (1 + r(m)/12) + a_m.
 */
import { indexZuIso, jahrVonIndex } from './monat';
import type { JahresZins, ZinsEintrag } from './types';
import { stufenwertFuerMonat } from './zinsreihe';

export interface AufzinsungsErgebnis {
  endwert: number;
  summeEinzahlungen: number;
  nutzungen: number;
  /** Zinsertrag je Kalenderjahr. */
  nutzungenProJahr: Map<number, number>;
  /** Kontostand am Ende jedes Kalenderjahres. */
  standProJahr: Map<number, number>;
}

/**
 * Zinst eine Reihe monatlicher Einzahlungen bis `bisIndex` (einschließlich)
 * mit den Jahressätzen aus `zinsen` auf.
 */
export function zinseAuf(
  einzahlungen: Map<number, number>,
  zinsen: Map<number, number>,
  vonIndex: number,
  bisIndex: number,
): AufzinsungsErgebnis {
  let wert = 0;
  let summe = 0;
  const nutzungenProJahr = new Map<number, number>();
  const standProJahr = new Map<number, number>();

  for (let m = vonIndex; m <= bisIndex; m += 1) {
    const jahr = jahrVonIndex(m);
    if (m > vonIndex) {
      const satz = (zinsen.get(jahr) ?? 0) / 100;
      const zins = wert * (satz / 12);
      wert += zins;
      nutzungenProJahr.set(jahr, (nutzungenProJahr.get(jahr) ?? 0) + zins);
    }
    const einzahlung = einzahlungen.get(m) ?? 0;
    wert += einzahlung;
    summe += einzahlung;
    if (m === bisIndex || jahrVonIndex(m + 1) !== jahr) {
      standProJahr.set(jahr, wert);
    }
  }

  return { endwert: wert, summeEinzahlungen: summe, nutzungen: wert - summe, nutzungenProJahr, standProJahr };
}

/** Zinsreihe als Map Jahr → Satz (Prozent). */
export function zinsMap(jahre: JahresZins[]): Map<number, number> {
  return new Map(jahre.map((j) => [j.jahr, j.satzProzent]));
}

/**
 * Gegenverzinsung einer erhaltenen Leistung mit einem Stufenzins
 * (Referenz-Einlagenzins) vom Auszahlungsmonat bis zum Stichtag.
 * Liefert den aufgezinsten Betrag; Monate ohne Referenzwert werden mit 0 %
 * verzinst (Aufrufer setzt dafür eine Annahme).
 */
export function zinseLeistungAuf(
  betrag: number,
  vonIndex: number,
  bisIndex: number,
  referenz: ZinsEintrag[],
): { aufgezinst: number; monateOhneReferenz: number } {
  let wert = betrag;
  let ohne = 0;
  for (let m = vonIndex + 1; m <= bisIndex; m += 1) {
    const satz = stufenwertFuerMonat(referenz, indexZuIso(m));
    if (satz === undefined) {
      ohne += 1;
      continue;
    }
    wert *= 1 + satz / 100 / 12;
  }
  return { aufgezinst: wert, monateOhneReferenz: ohne };
}
