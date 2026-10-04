Du arbeitest an „[MARKE]“ – einem Web-Tool, das für Inhaber deutscher Lebens- und Rentenversicherungen (Kapital-LV, private RV, fondsgebundene LV/RV, Rückdeckungsversicherungen) eine schriftliche Kurzprüfung erstellt: Wie hoch wäre der bereicherungsrechtliche Rückabwicklungsanspruch nach einem wirksamen Widerspruch (§ 5a VVG a.F.), Rücktritt (§ 8 VVG a.F.) oder Widerruf (§ 8 VVG n.F.) – und lohnt sich das gegenüber dem aktuellen Rückkaufswert?

Grundprinzipien – gelten für jeden Prompt, jede Datei, jeden Text:
1. Jede Zahl hat eine Quelle. Renditen, Kostenquoten und Zinssätze kommen aus `data/insurers.json` mit URL/Dokument und Abrufdatum. Fehlt ein Wert, wird der Branchendurchschnitt verwendet und im Ergebnis als Schätzung markiert. Nie Werte erfinden.
2. Methodik folgt der BGH-Rechtsprechung: Nutzungen nur auf den Sparanteil (Beitrag abzüglich Risiko-, Abschluss- und Verwaltungskostenanteil); Maßstab ist die Nettoverzinsung der Kapitalanlagen des jeweiligen Versicherers. Keine Aufzinsung des Vollbeitrags, keine Rohüberschussquoten als Zinssatz.
3. Immer drei Szenarien (Min / Basis / Max) und immer der Vergleich mit dem Rückkaufswert bzw. den bereits erhaltenen Leistungen. Bringt der Widerspruch wirtschaftlich nichts, sagt das Tool das klar.
4. Keine Rechtsberatung im Einzelfall: Das Tool rechnet und liefert eine strukturierte Vorprüfung der Belehrung als Hinweis; die rechtliche Bewertung obliegt einem Rechtsanwalt. Keine Erfolgsgarantien, keine Formulierungen wie „Ihnen stehen X € zu“ – immer „geschätzt“, „könnte“, „unter der Annahme“.
5. Keine Übernahme fremder Texte, Layouts oder Marken (auch nicht von EuroProf). Design und Wording sind eigenständig.
6. Sprache Deutsch (Sie-Form), Zahlenformat de-DE (1.234,56 €), Daten intern ISO, im Frontend deutsch.
7. Stack: Next.js (App Router) + TypeScript, Postgres (Prisma), Rechenkern als eigenständiges Paket `packages/calc` ohne UI-Abhängigkeiten, PDF aus HTML via Playwright, Tests mit Vitest. Alles deterministisch und versioniert – `calc.version` und `data.version` erscheinen in jedem Bericht.
8. Arbeitsweise: Erst Plan zeigen, dann umsetzen. Annahmen in `docs/ASSUMPTIONS.md` führen. Nichts stillschweigend weglassen; offene Punkte als Liste zurückmelden.

---

Repo-Navigation (für jede Arbeitssitzung):
- `docs/PROMPTS.md`: das vollständige Prompt-Set (Reihenfolge 0 Kontext → 1 Rechtsregeln → 2 Versichererdaten → 3 Rechenkern → 4 Eignungs-Check → 5 PDF-Bericht → 6 Website → 7 Review). Die Prompts werden nacheinander umgesetzt; jeder baut auf den Artefakten des vorherigen auf.
- `docs/STATUS.md`: welcher Prompt umgesetzt ist und was offen ist – nach jedem abgeschlossenen Schritt aktualisieren.
- `docs/ASSUMPTIONS.md`: laufende Annahmenliste (Pflicht laut Grundprinzip 8).
- „[MARKE]“ ist bewusst Platzhalter: Marke, Domain und Geschäftsmodell werden laut Prompt-Set vor Prompt 6 entschieden.
