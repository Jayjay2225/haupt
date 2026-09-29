/**
 * Durchsetzung über Renten-Rettung (Prompt 13, Abschnitte 0.1, 2.3 und 6).
 *
 * Rechtliche Struktur offen (`[[DURCHSETZUNGSSTRUKTUR]]`): (a) Mandat direkt
 * zwischen Kunde und Partnerkanzlei, wir organisieren – oder (b) eigene
 * Registrierung als Rechtsdienstleister. Bis zur Entscheidung gilt überall
 * die in beiden Strukturen zutreffende Fassung: „Wir organisieren die
 * Durchsetzung mit spezialisierten Anwälten.“
 *
 * Zahlen und Namen nur mit Beleg – Platzhalter werden NICHT durch
 * Schätzungen ersetzt (Prompt 13, 2.1).
 */

/** Partnerkanzlei (Name, Ort) – erst mit Beleg füllen (Umgebungsvariable). */
export const KANZLEI_NAME = process.env['NEXT_PUBLIC_PARTNERKANZLEI'] ?? '[[KANZLEI: Name, Ort]]';

/** Belegbare Zahl geprüfter Policen; leer = Platzhalter wird angezeigt. */
export const GEPRUEFTE_POLICEN = process.env['NEXT_PUBLIC_GEPRUEFTE_POLICEN'] ?? '';

/**
 * Unterlagen-Upload auf /durchsetzung: Vercel Functions nehmen Request-Bodies
 * nur bis 4,5 MB an (413 FUNCTION_PAYLOAD_TOO_LARGE, noch vor dem Code); die
 * Grenze gilt für alle Dateien zusammen samt Multipart-Rahmen. Formular und
 * API nennen deshalb dieselbe Summe. Größere Unterlagen reicht die Kundin
 * bzw. der Kunde als Antwort auf die Bestätigungs-E-Mail nach.
 */
export const UNTERLAGEN_MAX_DATEIEN = 5;
export const UNTERLAGEN_MAX_GESAMT = 4 * 1024 * 1024;
export const UNTERLAGEN_MAX_GESAMT_TEXT = '4 MB';

/** Konditionen der Durchsetzung (Erfolgsbeteiligung, Kostenübernahme). */
export const KONDITIONEN_PLATZHALTER =
  '[[KONDITIONEN: Erfolgsbeteiligung, Kostenübernahme – von Jack/Kanzlei, vor Beauftragung anwaltlich abgenommen]]';

/**
 * Preis-Anrechnung (Prompt 13, 2.1 / Prompt 14, 4): „Bei Beauftragung
 * angerechnet: dann 0 €.“ erscheint nur, wenn Jack das entscheidet
 * (PREIS_ANRECHNUNG=1).
 */
export const PREIS_ANRECHNUNG = process.env['NEXT_PUBLIC_PREIS_ANRECHNUNG'] === '1';

/**
 * Ankauf-Mindestwert (Grau-Zustand: Verkaufen-Karte nur, wenn erreicht).
 * null = Konditionen `[[ANKAUF-PRIVAT]]` noch offen → Karte wird bei Grau
 * nicht gezeigt (konservativ).
 */
export const ANKAUF_MIN_RUECKKAUFSWERT: number | null = null;
