# data/

Alle fachlichen Datensätze des Projekts. Grundregel (`CLAUDE.md`, Prinzip 1): **Jede Zahl hat eine Quelle** – URL oder Dokument, ggf. Seite, und Abrufdatum. Fehlende Werte werden als Schätzung bzw. Branchendurchschnitt markiert, nie erfunden.

Geplante Dateien (entstehen mit den jeweiligen Prompts, siehe `docs/PROMPTS.md`):

| Datei | Inhalt | entsteht mit |
|---|---|---|
| `legal-rules.json` | maschinenlesbares Regelwerk zum Rechtsrahmen: Regime, Rechtsfolgen, Belehrungsfehler-Katalog, Verwirkung – je Regel `{id, regime, bedingung, folge, gewicht, confidence, quelle[]}` | Prompt 1 |
| `insurers.json` | Versicherer-Stammdaten inkl. Altnamen und Rechtsnachfolge, Kennzahlen je Gesellschaft und Jahr 1994–2025 (Nettoverzinsung, laufende Durchschnittsverzinsung, Kostenquoten), Branchendurchschnitt, Referenzzinsen; enthält `data.version` | Prompt 2 |
| `COVERAGE.md` | Vollständigkeitsreport: welche Gesellschaft/Jahr-Kombination fehlt und welcher Beschaffungsweg dokumentiert ist | Prompt 2 |
| `risk-defaults.json` | pauschale Risikoanteile nach Vertragsart und Eintrittsalter, mit Quelle und Begründung | Prompt 3 |

Qualitätsfelder je Wert: `source_type` (`primary` / `secondary` / `estimate`), `confidence`, Quelle mit Abrufdatum. Plausibilitätsregel: Nettoverzinsung außerhalb −2 bis 9 % → Warnung und manuelle Prüfung.
