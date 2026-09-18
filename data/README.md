# data/

Alle fachlichen Datensätze des Projekts. Grundregel (`CLAUDE.md`, Prinzip 1): **Jede Zahl hat eine Quelle** – URL oder Dokument, ggf. Seite, und Abrufdatum. Fehlende Werte werden als Schätzung bzw. Branchendurchschnitt markiert, nie erfunden.

Dateien (siehe `docs/PROMPTS.md`):

| Datei | Inhalt | Stand |
|---|---|---|
| `legal-rules.json` | maschinenlesbares Regelwerk zum Rechtsrahmen: Regime, Rechtsfolgen, Belehrungsfehler-Katalog, Verwirkung – je Regel `{id, regime, bedingung, folge, gewicht, confidence, quelle[]}` | ✅ (Prompt 1) |
| `insurers.json` | Versicherer-Stammdaten inkl. Altnamen/Rechtsnachfolge, Branchendurchschnitt Nettoverzinsung (GDV), Referenzzinsen (Basiszins § 247 BGB, Einlagenzins Bundesbank), Rechnungsgrundlagen (Höchstzillmersatz, Höchstrechnungszins); `data.version` mit Changelog. Unternehmensindividuelle Kennzahlen je Jahr: in Beschaffung | 🟡 (Prompt 2) |
| `COVERAGE.md` | Vollständigkeitsreport, automatisch erzeugt von `pnpm data:check`: welche Gesellschaft/Jahr-Kombination fehlt und welcher Beschaffungsweg dokumentiert ist | ✅ generiert |
| `risk-defaults.json` | pauschale Aufteilungs-Defaults (Risikoanteil-Bänder, Verwaltungskosten-Fallback) als gekennzeichnete Modellannahmen (`estimate`) mit Begründung | ✅ (für Prompt 3) |

Pflege: `pnpm data:check` validiert Schema, Quellenpflicht und Plausibilität und schreibt `COVERAGE.md` neu; `node --experimental-strip-types scripts/update-insurers.ts bump <patch|minor|major> "…"` erhöht `data.version` mit Änderungshistorie.

Qualitätsfelder je Wert: `source_type` (`primary` / `secondary` / `estimate`), `confidence`, Quelle mit Abrufdatum. Plausibilitätsregel: Nettoverzinsung außerhalb −2 bis 9 % → Warnung und manuelle Prüfung.
