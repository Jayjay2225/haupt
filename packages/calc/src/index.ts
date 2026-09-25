/**
 * @rueckab/calc – Rechenkern für die Rückabwicklung von Lebens- und
 * Rentenversicherungen (Widerspruch § 5a VVG a.F., Rücktritt § 8 VVG a.F.,
 * Widerruf § 8 VVG n.F.).
 *
 * Reine Funktionen, keine I/O (Grundprinzip 7 in CLAUDE.md); alle Daten
 * (insurers.json, risk-defaults.json) werden als Parameter übergeben.
 * Spezifikation: docs/CALC-SPEC.md. Methodik: Nutzungen nur auf den
 * Sparanteil (Max-Szenario zusätzlich Verwaltungskostenanteil), Maßstab
 * Nettoverzinsung des jeweiligen Versicherers (docs/LEGAL.md Abschnitt 2).
 */
export { CALC_VERSION } from './version';
export { berechneRueckabwicklung } from './rueckabwicklung';
export { baueBeitragsreihe, DM_KURS } from './beitragsreihe';
export { teileBeitraegeAuf } from './aufteilung';
export { loeseZinsreihe, stufenwertFuerMonat } from './zinsreihe';
export { zinseAuf, zinseLeistungAuf, zinsMap } from './nutzungen';
export { monatsIndex, indexZuIso, jahrVonIndex, parseMonat } from './monat';
export type * from './types';
