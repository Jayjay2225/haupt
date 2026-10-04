# Kundenstimmen-Freigaben

Hier liegen die dokumentierten Freigaben der Kundenstimmen (Prompt 12, Abschnitt 5).
Vorlage: `docs/FREIGABE-KUNDENSTIMME.md`. Je Stimme eine Datei
(`freigabe-<vorname>-<jahr>.md` plus ggf. Scan/E-Mail-Ausdruck).

**Stand 25.09.2026: Die Freigaben für Manfred (65) und Ulla (59) sind laut
Auftraggeber erteilt, die Dateien liegen aber noch nicht hier.** Bis sie
abgelegt sind, stehen die beiden Stimmen in `data/testimonials.json` mit
`verified: false` und leerem `consent_at` – sie werden auf der Website
**nicht** angezeigt (Prinzip 1: keine erfundenen Einwilligungsdaten).

Sobald die Freigabe-Dateien hier liegen:

1. Wortlaut prüfen – **es gilt die Freigabe**, nicht der Entwurf; `quote_display`
   und `quote_original` in `data/testimonials.json` entsprechend setzen.
2. `consent_text`, `consent_at` (ISO-Zeitstempel), `consent_channel`
   (z. B. „E-Mail vom …“), `customer_ref` (interne Bestell-/Kundenkennung)
   aus der Freigabe übernehmen.
3. `verified: true` setzen – erst dann rendert die Website die Stimme.
