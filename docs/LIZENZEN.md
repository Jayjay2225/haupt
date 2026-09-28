# Bild- und Medienlizenzen (Prompt 14, Abschnitte 0.8 und 1.7)

Jedes Bild und jedes Video auf renten-rettung.de braucht einen Eintrag in dieser Datei,
bevor es eingebunden wird. Ohne Eintrag bleibt der Platzhalterrahmen
(`components/Platzhalter.tsx`) stehen. Es werden ausschließlich lizenzierte Aufnahmen
oder eigene Aufnahmen mit schriftlicher Einwilligung der abgebildeten Personen verwendet.

## Regeln

- Bilder von Menschen im Ruhestand sind als **Stimmungsbilder** erlaubt, **nie als
  Kunden**: keine Bildunterschrift, die Personen als Kundinnen oder Kunden ausgibt;
  Alt-Text neutral (z. B. „Paar im Ruhestand am Küchentisch“).
- Bilder stehen nie neben Kundenstimmen, Geschichten oder Beträgen (Platzierung nur in den
  Abschnitten „Wir übernehmen“ und „Verkaufen statt kündigen“ der Startseite; Test in
  `apps/web/test/prompt14.test.ts`).
- Keine Archivfotos mit Modellfreigabe-Lücken: Die Lizenz muss die kommerzielle Nutzung
  auf einer Website und – wenn das Bild dort eingesetzt wird – in Anzeigen abdecken.
- Fonts (Newsreader, Manrope): SIL Open Font License, Dateien unter `brand/fonts/`
  (siehe `brand/README.md`).

## Einträge

| Motiv | Datei (public/) | Quelle / Anbieter | Lizenz | Lizenznehmer | Nutzungsumfang | Abruf / Rechnung | Status |
|---|---|---|---|---|---|---|---|
| Paar im Ruhestand am Küchentisch (`NEXT_PUBLIC_BILD_RUHESTAND`) | – | `[[BILD-QUELLE]]` | `[[LIZENZ]]` | Kaufmannsladen Gebhard GmbH | Website, Anzeigen | `[[DATUM, BELEG]]` | **offen** – Platzhalterrahmen aktiv |
| Paar mit Enkelkindern im Garten (`NEXT_PUBLIC_BILD_ENKEL`) | – | `[[BILD-QUELLE]]` | `[[LIZENZ]]` | Kaufmannsladen Gebhard GmbH | Website, Anzeigen | `[[DATUM, BELEG]]` | **offen** – Platzhalterrahmen aktiv |
| Erklärvideo 85 s (`NEXT_PUBLIC_VIDEO_URL`, Poster `NEXT_PUBLIC_VIDEO_POSTER`) | – | eigene Produktion (Drehbuch `docs/VIDEO.md`) | Einwilligungen der Mitwirkenden schriftlich | Kaufmannsladen Gebhard GmbH | Website | `[[DATUM]]` | **offen** – Platzhalter aktiv |
| Vorschaubild Seite 1 des Musterfall-Gutachtens (`public/bericht-vorschau.png`) | `bericht-vorschau.png` | eigene Erzeugung (`apps/report/scripts/bericht-vorschau.ts`) | eigenes Werk | – | Website | – | in Verwendung |

Einbindung erst, wenn Spalte „Status“ auf „lizenziert“ steht und der Beleg (Rechnung,
Lizenztext) unter `docs/freigaben/` abgelegt ist. Dann die Datei unter
`apps/web/public/bilder/` ablegen und die Umgebungsvariable auf den Pfad setzen
(`/bilder/<datei>.jpg`).
