# Scan-Anleitung: Kennzahlen der Lebensversicherer 1994–2003 aus der Bibliothek

Für die Hilfskraft. Ziel: Für jedes Jahr 1994–2003 die Tabelle mit den Kennzahlen **je Lebensversicherungsunternehmen** (Nettoverzinsung/„Reinverzinsung“ und, wo vorhanden, laufende Durchschnittsverzinsung) so fotografieren und abschreiben, dass wir jede Zahl mit Band, Seite und Zeile belegen können. **Lieber eine Lücke als ein geratener Wert.**

## 1. Welche Bände

| Berichtsjahre | Band | Herausgeber | Wo suchen |
|---|---|---|---|
| 1994–2001 | „Geschäftsbericht des Bundesaufsichtsamtes für das Versicherungswesen“, jeweils **Teil B** (Statistik) | Bundesaufsichtsamt für das Versicherungswesen (BAV), Berlin/Bonn | Universitäts- und Landesbibliotheken, ZBW Kiel/Hamburg, Deutsche Nationalbibliothek; Signatur über den Katalog („Bundesaufsichtsamt für das Versicherungswesen Geschäftsbericht Teil B“) |
| 2002–2003 | „Statistik der Bundesanstalt für Finanzdienstleistungsaufsicht – Erstversicherungsunternehmen“ | BaFin | wie oben; teils auch als Print im BaFin-Archiv |

Erscheinungsjahr ist jeweils das Folgejahr (Bericht 1997 erscheint 1998).

## 2. Welche Tabelle

Im Teil B gibt es je Versicherungszweig Einzelunternehmenstabellen. Gesucht ist für die **Lebensversicherung** die Tabelle mit Kennzahlen je Unternehmen, in der Spalten wie „Nettoverzinsung der Kapitalanlagen“ oder „Reinverzinsung“ (in %) und „laufende Durchschnittsverzinsung“ vorkommen – in den BaFin-Bänden 2002/2003 heißt sie „Tabelle 160“. Fotografieren Sie **alle Seiten** dieser Tabelle (meist 3–4 Seiten, alphabetisch oder nach Größe sortiert) **und** die Seite mit den Fußnoten/Spaltendefinitionen (steht am Tabellenanfang oder -ende).

Nicht gemeint: Branchen-Summentabellen (nur eine Zeile „Lebensversicherung insgesamt“) – die fotografieren Sie bitte trotzdem einmal als Zweitbeleg, aber separat benannt (siehe unten).

## 3. Wie fotografieren

- Buch flach auflegen, Seite **gerade** (Kanten parallel zum Bildrand), **ganze Seite** im Bild, **Seitenzahl sichtbar**.
- Tageslicht oder gleichmäßige Beleuchtung, kein Blitz (Glanz), keine Schatten der Hand.
- Scharf stellen auf die kleinsten Zahlen; Kontrolle: Zoom auf eine Zahl – ist „3“ von „8“ und „6“ von „5“ unterscheidbar? Sonst neu fotografieren.
- Auflösung mindestens 12 Megapixel oder Scanner mit 300 dpi. Format JPG oder PNG.
- Zusätzlich ein Foto der **Titelseite des Bands** (Nachweis Band/Jahrgang) pro Ordner: `titel.jpg`.

## 4. Wie benennen und ablegen

Ordner `data/raw/scans/<Berichtsjahr>/`, Dateien:

```
1997/titel.jpg
1997/teilB-1997-s0123.jpg        (Tabellenseite, Seitenzahl vierstellig)
1997/teilB-1997-s0124.jpg
1997/teilB-1997-fussnoten-s0126.jpg
1997/branche-1997-s0087.jpg      (Branchen-Summentabelle als Zweitbeleg)
```

Für 2002/2003: `bafin-2002-s0123.jpg` usw.

## 5. Wie abschreiben (zwei Durchgänge)

Jede Tabellenseite wird **zweimal unabhängig** abgeschrieben – von zwei Personen oder von einer Person an zwei verschiedenen Tagen, **ohne** in die erste Fassung zu schauen. Dateien: `<bildname>.lesung1.json` und `<bildname>.lesung2.json`, Aufbau wie `data/raw/scans/VORLAGE.lesung.json`:

- `band`, `seite`, `tabelle`, `jahr` genau so eintragen, wie sie im Buch stehen.
- `kurzname`: der Unternehmensname **exakt wie gedruckt** (Großschreibung, Abkürzungen, Punkte). Nicht „modernisieren“.
- `nettoverzinsung` und `laufendeDurchschnittsverzinsung`: Zahl mit Punkt als Dezimaltrenner (`7,2` im Buch → `7.2`). Fehlt der Wert oder ist er unleserlich: `null`. Nichts schätzen.
- Steht in der Tabelle „Reinverzinsung“, tragen Sie sie in `nettoverzinsung` ein (gleiche Kennzahl; Definition aus den Fußnoten fotografieren).

Danach `pnpm data:scans` ausführen (oder ausführen lassen): Das Skript vergleicht beide Lesungen, prüft die Plausibilität (0–15 %, Sprung zum Vorjahr über 3 Prozentpunkte) und schreibt Abweichungen in `data/raw/scans/REVIEW.md`. Abweichungen werden **am Bild** geklärt, nicht durch Abstimmung zwischen den Lesenden; die korrigierte Lesung ersetzt dann die falsche.

## 6. Was noch hilft

- Notieren Sie im Ordner eine `NOTIZ.md`: Bibliothek, Signatur, Datum, Besonderheiten (fehlende Seiten, Bindung verdeckt Zahlen).
- Wenn ein Band nicht auffindbar ist: Fernleihe anfragen oder das BaFin-Archiv anschreiben; das Ergebnis der Anfrage ebenfalls in `NOTIZ.md`.
