/**
 * Ampel-Schwellen (Prompt 12, Abschnitt 1.3) – alle Werte konfigurierbar.
 *
 * Es gibt genau EINE Ampel, und sie ist wirtschaftlich: Sie vergleicht das
 * Basis-Szenario des Rechenkerns mit dem Rückkaufswert – für alle Jahrgänge
 * (1980–2020) und alle klassischen Vertragsarten mit derselben Formel.
 *
 * Grün  = Basis-Szenario über dem Rückkaufswert UND mindestens
 *         `mehrwertMinAbsolut` Euro Mehrwert.
 * Gelb  = Basis-Szenario über dem Rückkaufswert, aber unter der Grün-Schwelle.
 * Rot   = Basis-Szenario nicht über dem Rückkaufswert.
 *
 * Der konservative Wert steht im Bericht, nicht in der Gratis-Ansicht.
 * Ampeldefinition und Schwellen gehen mit in die anwaltliche Abnahme
 * (docs/LEGAL-OPEN-QUESTIONS.md).
 */

export interface GroessenordnungsStufe {
  /** Obergrenze in Euro (exklusiv); null = alles darüber. */
  bis: number | null;
  text: string;
}

export const AMPEL = {
  gruen: { szenario: 'basis', mehrwertMin: 0, mehrwertMinAbsolut: 2000 }, // Basis > RKW und mind. 2.000 € Mehrwert
  gelb: { szenario: 'basis', mehrwertMin: 0 }, // Basis > RKW, aber unter Grün-Schwelle
  // Rot: Basis <= RKW
  groessenordnung: [
    // Mehrwert in Worten, nie als Betrag in der Gratis-Ansicht.
    { bis: 5000, text: 'im niedrigen vierstelligen Bereich' },
    { bis: 10000, text: 'im hohen vierstelligen Bereich' },
    { bis: 50000, text: 'im fünfstelligen Bereich' },
    { bis: 100000, text: 'im hohen fünfstelligen Bereich' },
    { bis: null, text: 'im sechsstelligen Bereich' },
  ] as GroessenordnungsStufe[],
} as const;

/**
 * Der eine Satz zum Rechtsweg (Prompt 12, Abschnitt 1.4) – steht auf der
 * Ergebnis-Seite unter der Ampel. Rechtsgrundlagen sind Sache der Kanzlei.
 */
export const RECHTSWEG_SATZ =
  'Ob und auf welchem Weg sich das durchsetzen lässt, hängt von Ihrem Vertrag ab – das prüft Ihr Anwalt mit dem Bericht in der Hand.';

/**
 * Fondsgebundene Verträge und Riester (Prompt 12, Abschnitt 1.1): Die
 * klassische Rückabwicklungsformel passt dort rechnerisch nicht – Standard
 * ist deshalb das Anfrage-Formular (individuelle Prüfung). Umstellbar über
 * die Umgebungsvariable FONDS_MODE=berechnen.
 */
export const FONDS_MODE: 'anfrage' | 'berechnen' =
  process.env['FONDS_MODE'] === 'berechnen' ? 'berechnen' : 'anfrage';
