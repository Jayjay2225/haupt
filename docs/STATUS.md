# Umsetzungsstand

Grundlage ist das Prompt-Set in `docs/PROMPTS.md` (Stand 11.09.2026). Nach jedem abgeschlossenen Prompt wird diese Tabelle aktualisiert.

| Prompt | Inhalt | Artefakte | Status |
|---|---|---|---|
| 0 | Projektkontext | `CLAUDE.md`, Repo-Grundgerüst | ✅ umgesetzt (11.09.2026) |
| 1 | Rechtsrahmen als Regelwerk | `docs/LEGAL.md`, `data/legal-rules.json`, `docs/LEGAL-OPEN-QUESTIONS.md` | ⬜ offen |
| 2 | Versicherer-Datenbank | `data/insurers.json`, `data/COVERAGE.md`, `scripts/update-insurers.ts` | ⬜ offen |
| 3 | Rechenkern | `packages/calc`, `docs/CALC-SPEC.md`, `data/risk-defaults.json` | ⬜ offen (Paket-Gerüst vorhanden) |
| 4 | Eignungs- und Belehrungs-Check | `packages/eligibility` | ⬜ offen (Paket-Gerüst vorhanden) |
| 5 | PDF-Kurzprüfung | `apps/report`, Beispielberichte in `examples/` | ⬜ offen (benötigt `brand/`) |
| 6 | Website und Funnel | `apps/web`, `config/business.ts` | ⬜ offen (benötigt Entscheidungen, s. u.) |
| 7 | Compliance- und Plausibilitäts-Review | `docs/REVIEW.md` | ⬜ offen |

## Vor Prompt 6 zu entscheiden (aus `docs/PROMPTS.md`)

- [ ] Marke, Domain und Absender (welche GmbH) – bis dahin bleibt „[MARKE]“ Platzhalter.
- [ ] Geschäftsmodell A, B oder C; bei B und C: welche Kanzlei bzw. welcher Versicherungsberater die rechtliche Bewertung übernimmt.
- [ ] Ob die Belehrungsprüfung Teil des Angebots ist oder nur die Berechnung (deutlich weniger RDG-Risiko).
- [ ] Anwaltliche Abnahme von `data/legal-rules.json` und aller Berichtstexte vor dem Go-live.
