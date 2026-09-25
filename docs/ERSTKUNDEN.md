# Erstkunden-Programm (Prompt 10, Abschnitt 5)

Ziel: echte, dokumentierte Kundenstimmen in vier Wochen – ohne eine einzige erfundene Stimme.

## Mechanik

- **Freischaltcodes (seit Prompt 12 mit Attributen).** Erzeugen z. B. mit `for i in $(seq 1 100); do echo "RENTE-$(openssl rand -hex 3 | tr a-f A-F)"; done`, als kommagetrennte Liste in die Umgebungsvariable `ERSTKUNDEN_CODES`. Codes sind Groß-/Kleinschreibungs-unempfindlich. Ein Eintrag ist entweder nur der Code (= einmalig, ohne Ablauf) oder `CODE|ART|ABLAUF|PARTNER` mit ART `einmalig`/`mehrfach`, ABLAUF als ISO-Datum (letzter gültiger Tag) und einer freien Partnerkennung – z. B. `RENTE-A1B2C3|einmalig|2026-12-31|newsletter` oder `KANZLEI-X|mehrfach||kanzlei-x`. Mehrfach-Codes erzeugen je Einlösung eine eigene Bestellnummer (`EK-<CODE>-<Suffix>`).
- **Einlösen:** Feld „Freischaltcode“ im Bestellformular (`/bestellen`). Gültiger Code → Prüfbericht kostenlos, keine Zahlung, direkte Auslieferung per E-Mail (Vertragsbestätigung + PDF); Bestellnummer `EK-<CODE>`. Der Zwölf-Stunden-Versand aus Prompt 13 gilt nur für bezahlte Bestellungen – **Erstkunden-Einlösungen liefern weiterhin sofort aus** (kein Webhook, keine Freigabeliste).
- **Gegenleistung:** (a) kurzer Feedback-Fragebogen per Antwort-Mail (Fragen in der Versand-Mail), (b) optionale Freigabe eines Zitats mit Vorname, Alter, Bundesland.
- **Verwendete Codes** werden in `<Auslieferungsordner>/erstkunden-verwendet.json` vermerkt. **Achtung Serverless:** Auf Vercel ist `/tmp` nicht dauerhaft – ein Code könnte nach einem Kaltstart erneut einlösbar sein. Für die Beta hinnehmbar (Codes nur gezielt vergeben); vor breiter Ausgabe `AUSLIEFERUNG_VERZEICHNIS` auf dauerhaften Speicher legen oder die Persistenz (Datenbank) abwarten.

## Zitate: Aufnahme-Regeln (hart)

1. Gespeichert wird je Zitat: Wortlaut (Original), ggf. gekürzte Fassung (nur Kürzung, kein Umschreiben), Einwilligung mit Zeitstempel, Zuordnung zur Bestellnummer (Nachweis Kundeneigenschaft).
2. Eintrag in `data/testimonials.json` (Felder u. a. `quote_display`, `quote_original`, `consent_text`, `consent_at`, `consent_channel`, `customer_ref`) erst mit dokumentierter Freigabe unter `docs/freigaben/` und `verified: true`; die Komponente rendert ausschließlich Einträge mit `verified` UND gefülltem `consent_at` (Test in `test/wording.test.ts`).
3. Partner-Stimmen (Kanzlei, Versicherungsberater) nur mit schriftlicher Freigabe, Name und Funktion echt.
4. Widerruf der Einwilligung → Eintrag entfernen; Ablage behält den Vorgang.

## Nachfassen

Sechs Monate nach Berichtsversand: Nachfrage „Wie ist es ausgegangen?“ (manuell aus der Auslieferungsliste oder später automatisiert). Daraus entstehen die Geschichten – und sie sind wahr.
