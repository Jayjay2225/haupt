# Erstkunden-Programm (Prompt 10, Abschnitt 5)

Ziel: echte, dokumentierte Kundenstimmen in vier Wochen – ohne eine einzige erfundene Stimme.

## Mechanik

- **100 Freischaltcodes.** Erzeugen z. B. mit `for i in $(seq 1 100); do echo "RENTE-$(openssl rand -hex 3 | tr a-f A-F)"; done`, als kommagetrennte Liste in die Umgebungsvariable `ERSTKUNDEN_CODES`. Codes sind Groß-/Kleinschreibungs-unempfindlich.
- **Einlösen:** Feld „Freischaltcode“ im Bestellformular (`/bestellen`). Gültiger Code → Prüfbericht kostenlos, keine Zahlung, direkte Auslieferung per E-Mail (Vertragsbestätigung + PDF); Bestellnummer `EK-<CODE>`.
- **Gegenleistung:** (a) kurzer Feedback-Fragebogen per Antwort-Mail (Fragen in der Versand-Mail), (b) optionale Freigabe eines Zitats mit Vorname, Alter, Bundesland.
- **Verwendete Codes** werden in `<Auslieferungsordner>/erstkunden-verwendet.json` vermerkt. **Achtung Serverless:** Auf Vercel ist `/tmp` nicht dauerhaft – ein Code könnte nach einem Kaltstart erneut einlösbar sein. Für die Beta hinnehmbar (Codes nur gezielt vergeben); vor breiter Ausgabe `AUSLIEFERUNG_VERZEICHNIS` auf dauerhaften Speicher legen oder die Persistenz (Datenbank) abwarten.

## Zitate: Aufnahme-Regeln (hart)

1. Gespeichert wird je Zitat: Wortlaut (Original), ggf. gekürzte Fassung (nur Kürzung, kein Umschreiben), Einwilligung mit Zeitstempel, Zuordnung zur Bestellnummer (Nachweis Kundeneigenschaft).
2. Eintrag in `apps/web/content/testimonials.ts` erst mit `consent_id` (Ablage der Einwilligung) und `verified: true`; die Komponente rendert ausschließlich solche Einträge (Test in `test/wording.test.ts`).
3. Partner-Stimmen (Kanzlei, Versicherungsberater) nur mit schriftlicher Freigabe, Name und Funktion echt.
4. Widerruf der Einwilligung → Eintrag entfernen; Ablage behält den Vorgang.

## Nachfassen

Sechs Monate nach Berichtsversand: Nachfrage „Wie ist es ausgegangen?“ (manuell aus der Auslieferungsliste oder später automatisiert). Daraus entstehen die Geschichten – und sie sind wahr.
