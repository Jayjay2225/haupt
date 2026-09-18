# Annahmen und Festlegungen

Laufende Liste gemäß Grundprinzip 8 (`CLAUDE.md`). Jede fachliche oder technische Annahme wird hier mit Datum geführt; überholte Einträge werden als „ersetzt am …“ markiert, nicht gelöscht.

## 11.09.2026 – Projektaufsatz (Prompt 0)

1. **Marke offen.** „[MARKE]“ bleibt Platzhalter in `CLAUDE.md` und allen Texten, bis Marke, Domain und Absender entschieden sind (laut Prompt-Set vor Prompt 6). Interner Arbeitsname des Monorepos: `lv-rueckabwicklung`; npm-Scope vorläufig `@rueckab/*` – wird bei der Branding-Entscheidung umbenannt.
2. **Werkzeuge.** pnpm-Workspaces (pnpm 10, über `packageManager` im Root-`package.json` gepinnt), Node ≥ 20, durchgängig ESM. TypeScript strikt (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) – bewusst streng, weil der Rechenkern Geldbeträge deterministisch verarbeiten muss. Tests mit Vitest über eine Root-Konfiguration (`vitest.config.ts`).
3. **Struktur.** `packages/calc` und `packages/eligibility` sind nur als Paket-Gerüste angelegt (Versionskonstante + Smoke-Test), damit Tooling und Tests von Anfang an laufen. Die fachliche Implementierung folgt strikt Prompt 3 bzw. 4: erst Spezifikation und Testfälle, dann Implementierung. `apps/report` und `apps/web` werden erst mit Prompt 5/6 angelegt, weil dafür `brand/` bzw. die Marken- und Geschäftsmodell-Entscheidungen nötig sind.
4. **Versionierung.** `calc.version` startet mit `0.1.0` (Konstante `CALC_VERSION` in `packages/calc`); `data.version` wird mit Prompt 2 in `data/insurers.json` eingeführt. Beide erscheinen laut Grundprinzip 7 in jedem Bericht.
5. **Postgres/Prisma.** Datenbank und Prisma werden erst eingerichtet, wenn die erste Persistenz gebraucht wird (spätestens mit `apps/web`, Prompt 6). Der Rechenkern bleibt frei von I/O.

## 18.09.2026 – Website-Grundgerüst (Prompt 6, vorgezogen)

6. **Reihenfolge-Abweichung auf Nutzerwunsch.** Das Website-Grundgerüst wurde vor den Prompts 1–5 gebaut („webseite weiter bauen“). Alles, was die fehlenden Artefakte braucht, ist als offener Punkt in `docs/STATUS.md` geführt; die Ergebnis-Seite zeigt bewusst keine Zahlen und keine Ampel, bis Regelwerk, Versichererdaten und Rechenkern belastbar vorliegen (Prinzip 1: nie Werte erfinden).
7. **Geschäftsmodell B vorläufig aktiv.** `apps/web/config/business.ts` legt alle drei Modelle an; aktiv ist vorläufig B (kostenlose Vorschau), weil es ohne Zahlungsintegration lauffähig ist. Die Entscheidung A/B/C bleibt offen und ändert nur die Konfiguration, nicht den Code.
8. **Vorabversion nicht indexierbar.** `robots: noindex, nofollow` im Layout, dazu ein sichtbarer Vorabversions-Banner, solange Marke, Rechtstexte und Berechnung nicht stehen.
9. **Kein externes Font-/Asset-Hosting.** Systemschriften und eigenes CSS ohne Framework – Datenminimierung, EU-Hosting-Vorgabe, keine Drittanbieter-Requests.
10. **Versicherer-Starterliste nur Namen.** `apps/web/data/insurers-starter.ts` enthält ausschließlich Namen (inkl. gängiger Altnamen) für die Eingabehilfe, keine Kennzahlen und keine als geprüft ausgegebene Rechtsnachfolge. Wird durch `data/insurers.json` aus Prompt 2 ersetzt; Freitext bleibt möglich.
11. **Vorabversion speichert nur lokal.** Der Rechner speichert Eingaben ausschließlich im Browser (localStorage) und überträgt nichts an einen Server; das steht sichtbar im Formular und in der Datenschutz-Entwurfsseite. Persistenz, E-Mail-Versand und Admin folgen mit der Backend-Umsetzung (Postgres/Prisma).
## 18.09.2026 – Prompts 1–5 (Regelwerk, Daten, Rechenkern, Eignungs-Check, Bericht)

13. **Zitat-Quellenlage.** Leitsätze/Tenores stammen überwiegend aus frei zugänglichen Volltext-Spiegeln (nur die BGH-PM zu IV ZR 353/21 direkt primär); der Wort-für-Wort-Primärabgleich ist Pflichtpunkt vor Go-live (docs/LEGAL-OPEN-QUESTIONS.md Nr. 1) und wird im Bericht offengelegt.
14. **Höchstzillmersatz korrigiert.** Recherche ergab 40 ‰ bis Ende 2014 und 25 ‰ ab 01.01.2015 (LVRG; § 4 DeckRV) – abweichend vom Beispielwert „35 ‰ / ab 2008“ im Prompt-Set. Die 5-Jahres-Verteilung der Abschlusskosten gilt weiterhin für Vertragsschlüsse ab 2008 (CALC-SPEC 3).
15. **Golden-Tests gegen echte Daten.** Die Golden-Snapshots frieren data.version 0.1.0 ein; Datenänderungen brechen die Tests bewusst. Beide Beispielverträge rechnen mangels Unternehmenskennzahlen mit dem Branchendurchschnitt (markiert).
16. **PDF-Bericht.** Kopfzeile „Seite x von y“ statt fix „von 7“ (lange Jahrestabellen können umbrechen; die sieben inhaltlichen Abschnitte bleiben). PDF/A-2b ist mit Chromium nicht erreichbar – Konvertierung (z. B. Ghostscript/veraPDF im Deploy) offen. Diagrammfarben aus der validierten dataviz-Referenzpalette, bis `brand/` entschieden ist; TS-Skripte laufen über `tsx`.

12. **Rechtsseiten als gekennzeichnete Entwürfe.** Impressum, Datenschutz, AGB und Widerrufsbelehrung existieren als Platzhalter mit deutlichem Entwurfs-Hinweis und ohne erfundene Anbieterdaten; endgültige Texte entstehen anwaltlich nach der Marken-/Gesellschafts- und Modellentscheidung.
