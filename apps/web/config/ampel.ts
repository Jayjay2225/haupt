/**
 * Übernahme-Ampel (Prompt 13, Abschnitt 1 – ersetzt Prompt 12, 1.3).
 *
 * Die Ampel beantwortet: Kommt der Vertrag für unser Verfahren in Frage?
 * Reihenfolge der Prüfung: Status → Rückkaufswert-Schwelle → Rechnung.
 *
 * Grün  = Übernahme-Kriterien erfüllt UND Basis-Szenario mindestens
 *         `mehrwertMinAbsolut` über dem Rückkaufswert.
 * Gelb  = Kriterien erfüllt, Basis über dem Rückkaufswert, aber knapp.
 * Rot   = Basis nicht über dem Rückkaufswert ODER Vertrag gekündigt/ausgezahlt.
 * Grau  = Rechnung positiv, aber Rückkaufswert unter der Mindestgrenze
 *         (für unser Verfahren zu klein; kein Berichtsverkauf, solange
 *         `berichtUnterSchwelle` false ist).
 *
 * Ampeldefinition und Schwellen gehen mit in die anwaltliche Abnahme
 * (docs/LEGAL-OPEN-QUESTIONS.md Nr. 21/22).
 */

export const AMPEL = {
  uebernahme: {
    minRueckkaufswert: 30000,
    statusErlaubt: ['laeuft', 'beitragsfrei'], // gekuendigt, ausgezahlt → Rot
    berichtUnterSchwelle: false, // Grau: kein Berichtsverkauf (umschaltbar)
  },
  gruen: { szenario: 'basis', mehrwertMinAbsolut: 5000 }, // Basis > RKW um mind. 5.000 €
  gelb: { szenario: 'basis', mehrwertMin: 0 }, // Basis > RKW, aber unter Grün-Schwelle
  // Rot:  Basis <= RKW  ODER  Status gekuendigt/ausgezahlt
  // Grau: Basis > RKW, aber RKW < minRueckkaufswert
} as const;

/**
 * Der eine Satz zum Rechtsweg (Prompt 13, 2.2) – nur bei Grün und Gelb.
 */
export const RECHTSWEG_SATZ =
  'Ob und auf welchem Weg sich das durchsetzen lässt, prüfen die spezialisierten Anwälte, mit denen wir arbeiten, anhand Ihrer Unterlagen.';

/**
 * Größenordnungs-Wortbänder (Prompt 12, 1.3): seit Prompt 13 aus der
 * Oberfläche entfernt – die Gratis-Ansicht zeigt nur die Ampel. Die Bänder
 * bleiben ausschließlich für den Bericht verfügbar.
 */
export interface GroessenordnungsStufe {
  /** Obergrenze in Euro (exklusiv); null = alles darüber. */
  bis: number | null;
  text: string;
}

export const GROESSENORDNUNG_BERICHT: GroessenordnungsStufe[] = [
  { bis: 5000, text: 'im niedrigen vierstelligen Bereich' },
  { bis: 10000, text: 'im hohen vierstelligen Bereich' },
  { bis: 50000, text: 'im fünfstelligen Bereich' },
  { bis: 100000, text: 'im hohen fünfstelligen Bereich' },
  { bis: null, text: 'im sechsstelligen Bereich' },
];

/**
 * Fondsgebundene Verträge und Riester (Prompt 12, 1.1 – bleibt): Standard
 * ist das Anfrage-Formular; FONDS_MODE=berechnen schaltet die Formel frei.
 */
export const FONDS_MODE: 'anfrage' | 'berechnen' =
  process.env['FONDS_MODE'] === 'berechnen' ? 'berechnen' : 'anfrage';
