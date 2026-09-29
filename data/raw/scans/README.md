# data/raw/scans – Bibliotheks-Scans der Aufsichtsstatistik (1994–2003)

Ordner je Berichtsjahr (`1994/`, `1995/`, … `2003/`) mit den Fotos der Tabellenseiten und je Bild **zwei** unabhängigen Transkriptionen `<name>.lesung1.json` und `<name>.lesung2.json` (Vorlage: `VORLAGE.lesung.json`). Prüfung: `pnpm data:scans` (schreibt `REVIEW.md`); Übernahme in `data/insurers.json`: `node --experimental-strip-types scripts/data-scans.ts import` mit `mapping.json` (Kurzname → Gesellschaft).

Anleitung für die Hilfskraft: `docs/SCAN-ANLEITUNG.md`. Bilder und Lesungen sind Rohdaten – nichts daran nachträglich „korrigieren“; Abweichungen landen in der Review-Liste.
