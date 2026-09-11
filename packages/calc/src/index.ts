/**
 * @rueckab/calc – Rechenkern für die Rückabwicklung von Lebens- und
 * Rentenversicherungen (Widerspruch § 5a VVG a.F., Rücktritt § 8 VVG a.F.,
 * Widerruf § 8 VVG n.F.).
 *
 * Reine Funktionen, keine I/O (Grundprinzip 7 in CLAUDE.md). Die fachliche
 * Implementierung erfolgt mit Prompt 3 (docs/PROMPTS.md): erst Spezifikation
 * in docs/CALC-SPEC.md und Testfälle, dann Implementierung.
 */

/** Version des Rechenkerns; erscheint als `calc.version` in jedem Bericht. */
export const CALC_VERSION = '0.1.0';
