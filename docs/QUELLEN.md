# Quellen für Aussagen auf der Website (Prompt 14, Abschnitt 4)

Zahlen und Vergleiche auf Web-Flächen brauchen einen Beleg in dieser Datei
(CLAUDE.md, Grundprinzip 1; Prompt 13: „Zahlen und Namen nur mit Beleg; Platzhalter
nicht durch Schätzungen ersetzen“). Die Kennzahlen des Rechenkerns haben ihre Quellen in
`data/insurers.json` und `data/DATA_REPORT.md`; hier stehen nur Aussagen der Website.

## Q-01 – Preisvergleich „Einzelgutachten von Versicherungsmathematikern kosten mehrere hundert Euro“

- **Verwendung:** Preisblock (Startseite, Schritt 11) als dritte Zeile, nur wenn
  `NEXT_PUBLIC_PREISVERGLEICH_QUELLE=Q-01` gesetzt ist (`config/business.ts`,
  `lib/preisblock.ts`).
- **Beleg:** `[[QUELLE: Preisliste oder Honorarangabe eines Versicherungsmathematikers /
  Sachverständigenbüros mit URL und Abrufdatum – oder zwei unabhängige Angebote als PDF
  unter docs/freigaben/]]`
- **Status:** **kein Beleg vorhanden → Satz ist gestrichen** (die Umgebungsvariable bleibt
  leer). Der Satz erscheint erst, wenn hier ein Beleg mit URL/Dokument und Abrufdatum
  steht und Jack die Freigabe erteilt.
- Hinweis: Der Vergleich darf keinen Streichpreis und keine Anmutung eines eigenen
  Sachverständigengutachtens erzeugen (Prompt 14, 0.5/0.6). Formulierung bleibt wörtlich
  wie in `config/business.ts`.

## Q-02 – Zahl geprüfter Policen („Erfahrung“-Karte)

- **Verwendung:** `NEXT_PUBLIC_GEPRUEFTE_POLICEN` (Prompt 13); ohne Wert steht der
  Platzhalter `[[ZAHL, belegbar]]` auf der Seite.
- **Beleg:** interne Auswertung der Bestellungen (Admin-CSV) zum Stichtag, Ablage unter
  `docs/freigaben/`.
- **Status:** offen.

## Q-03 – Partnerkanzlei

- **Verwendung:** `NEXT_PUBLIC_PARTNERKANZLEI` (Name, Ort) in „Wir übernehmen“.
- **Beleg:** Kooperationsvereinbarung (siehe `docs/LEGAL-OPEN-QUESTIONS.md`, Durchsetzungsstruktur).
- **Status:** offen.

Neue Aussagen mit Zahl oder Vergleich: Eintrag hier anlegen (Q-nn), Beleg ablegen,
erst dann den Text freischalten.
