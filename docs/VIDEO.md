# Erklärvideo (Prompt 14, Abschnitt 1.9)

Platz: Hero der Startseite, links unter der Unterzeile, 16:9, Poster mit Play-Symbol
und der Beschriftung „Erklärvideo (90 Sekunden)“ (`components/Platzhalter.tsx`).
Eingebunden wird eine **selbst gehostete MP4** über `NEXT_PUBLIC_VIDEO_URL`
(Poster: `NEXT_PUBLIC_VIDEO_POSTER`) – keine Einbettung fremder Videoplattformen
ohne Einwilligung. Solange keine Datei vorliegt, zeigt die Seite den Platzhalterrahmen
mit dem Hinweis `[[VIDEO: eigenes Hosting als MP4 – Drehbuch in docs/VIDEO.md]]`.

Regeln (gelten für Bild und Ton): keine Beträge, keine Prozentwerte, keine
Ergebnisversprechen, keine Nennung von Behörden, keine erfundenen Kunden. Die fünf
harten Linien aus Prompt 10 und die Verbotsliste des Wording-Tests gelten wörtlich.
Sprache: Sie-Form, ruhig, konkret.

## Drehbuch – 85 Sekunden

| Zeit | Bild | Ton (Sprecherin/Sprecher) | Einblendung |
|---|---|---|---|
| 0–10 s | Küchentisch, ein Brief wird geöffnet; Hand legt die Standmitteilung ab. Ruhiges Licht, keine Gesichter in Nahaufnahme. | „Der Brief kommt. Die Standmitteilung. Und die Zahl darin ist kleiner, als Sie gedacht haben.“ | – |
| 10–25 s | Standmitteilung liegt neben der Police; ein Finger tippt auf die Zeile „Rückkaufswert“. | „Der Rückkaufswert ist nicht das letzte Wort. Er ist das, was der Versicherer beim Kündigen auszahlen würde – nicht das, was Ihr Vertrag rechnerisch wert sein kann.“ | „Der Rückkaufswert ist nicht das letzte Wort.“ |
| 25–40 s | Bildschirm: die Startseiten-Karte. Vier Felder werden ausgefüllt, die Ampel springt an (Grün). | „Vier Angaben – Versicherer, Vertragsbeginn, Monatsbeitrag, Rückkaufswert. Alles steht in Ihren Unterlagen. Dann springt die Ampel an. Kostenlos, ohne Anmeldung.“ | „Vier Angaben, die Ampel springt an.“ |
| 40–55 s | Ein gedrucktes Gutachten wird durchgeblättert: Seite 1 mit Ampel, dann die Jahrestabelle. | „Wer es genau wissen will, bestellt das Gutachten: Ihre Zahl, Jahr für Jahr, jede Rendite mit Quelle. Innerhalb von zwölf Stunden per E-Mail – auf Wunsch auch gedruckt.“ | „Ihre Zahl, Jahr für Jahr, in 12 Stunden.“ |
| 55–75 s | Zwei Menschen am Tisch, Unterlagen werden in einen Umschlag gelegt; Schnitt auf einen Schreibtisch mit Aktenordner. | „Und dann? Wir übernehmen. Wir organisieren die Durchsetzung mit spezialisierten Anwälten für Versicherungsrecht. Sie haben einen Ansprechpartner und müssen nichts selbst verhandeln.“ | „Wir übernehmen – mit spezialisierten Anwälten.“ |
| 75–85 s | Zurück zur Startseite; der Mauszeiger liegt auf „Jetzt prüfen“. Abblende auf die Marke. | „Jetzt prüfen. Vier Angaben, fünf Minuten.“ | „Jetzt prüfen · renten-rettung.de“ |

## Produktionshinweise

- Länge 85 Sekunden, Beschriftung auf der Seite sagt „90 Sekunden“ (gerundet).
- Untertitel einbrennen oder als WebVTT mitliefern (Barrierefreiheit); der Ton darf nie die
  einzige Informationsquelle sein.
- Menschen im Bild: nur lizenzierte Aufnahmen oder eigene Dreharbeiten mit schriftlicher
  Einwilligung; keine Darstellung als Kundinnen oder Kunden (Prompt 14, 0.8). Nachweise in
  `docs/LIZENZEN.md`.
- Bildschirmaufnahmen aus der Beta ohne echte Daten (Musterwerte, keine Beträge lesbar).
- Vor Veröffentlichung: Textfassung durch den Wording-Test laufen lassen (Sprechtext in
  eine Datei unter `apps/web/content/` legen) und anwaltliche Abnahme wie für alle Texte.
- Datei: H.264/AAC, 1920×1080, ≤ 25 MB; Poster als JPG 1280×720 aus dem ersten Bild der Szene 25–40 s.
