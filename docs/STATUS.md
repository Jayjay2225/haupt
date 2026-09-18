# Umsetzungsstand

Grundlage ist das Prompt-Set in `docs/PROMPTS.md` (Stand 11.09.2026). Nach jedem abgeschlossenen Prompt wird diese Tabelle aktualisiert.

| Prompt | Inhalt | Artefakte | Status |
|---|---|---|---|
| 0 | Projektkontext | `CLAUDE.md`, Repo-Grundgerüst | ✅ umgesetzt (11.09.2026) |
| 1 | Rechtsrahmen als Regelwerk | `docs/LEGAL.md`, `data/legal-rules.json` (24 Regeln), `docs/LEGAL-OPEN-QUESTIONS.md` (12 Punkte) | ✅ umgesetzt (18.09.2026); Primärquellen-Abgleich der Zitate offen (Open Question Nr. 1) |
| 2 | Versicherer-Datenbank | `data/insurers.json`, `data/COVERAGE.md`, `scripts/update-insurers.ts` (`pnpm data:check`) | 🟡 Grundbestand (18.09.2026): Branchendurchschnitt-Nettoverzinsung 1995/1999–2024 (GDV), Basiszins § 247 BGB komplett (Bundesbank), Einlagenzins-Jahresmittel ab 2003 (Bundesbank MFI), Höchstzillmersatz 40‰/25‰, Höchstrechnungszins (DAV), 22 Gesellschaften Stammdaten. Offen: unternehmensindividuelle Kennzahlen je Jahr (Beschaffungsplan in COVERAGE.md), Nettoverzinsung 1994/1996–1998/2025 |
| 3 | Rechenkern | `packages/calc` (calc.version 0.2.0), `docs/CALC-SPEC.md` inkl. Golden-Ergebnissen, `data/risk-defaults.json` | ✅ umgesetzt (18.09.2026): Beitragsreihe (Zahlweise/Dynamik/DM/Skalierung), Zillmer-Aufteilung, Nutzungen auf Sparanteil, 3 Szenarien, Gegenrechnung, Jahrestabelle; 36 Tests inkl. Property- und Golden-Tests gegen data/insurers.json |
| 4 | Eignungs- und Belehrungs-Check | `packages/eligibility` (0.2.0) | ✅ umgesetzt (18.09.2026): Ampel aus legal-rules.json, 16 Konstellationen getestet; offen: optionaler OCR/Vision-Baustein |
| 5 | PDF-Kurzprüfung | `apps/report`, Beispielberichte in `examples/` (`pnpm --filter @rueckab/report beispiele`) | ✅ umgesetzt (18.09.2026): 7 Abschnitte, Inline-SVG-Diagramme (validierte Palette), Kopf-/Fußzeile, de-DE, beide Golden-Beispiele erzeugt; offen: PDF/A-2b (Chromium liefert kein PDF/A), echtes Branding aus `brand/`, Regime-C-Berichtsvariante |
| 6 | Website und Funnel | `apps/web`, `apps/web/config/business.ts` | 🟡 teilweise (18.09.2026, s. u.) |
| 7 | Compliance- und Plausibilitäts-Review | `docs/REVIEW.md` | ✅ umgesetzt (18.09.2026): drei Rollen (RDG/UWG/Aktuar der Gegenseite) mit Fundstellen, Gegengutachten beider Beispielverträge, Modellempfehlung; vier Textkorrekturen direkt eingebaut (Gegenposition-Warnblock in Bericht und Vorschau, modellneutrale CTA, FAQ, Chart-Kennzeichnung). Offene Punkte priorisiert in REVIEW.md |

## Stand Prompt 6 (Website) – auf Nutzerwunsch vorgezogen

Am 18.09.2026 wurde das Website-Grundgerüst `apps/web` auf ausdrücklichen Wunsch vor den Prompts 1–5 gebaut. Umgesetzt ist alles, was ohne die fehlenden Artefakte ehrlich möglich ist – **ohne erfundene Zahlen** (Prinzip 1):

**Fertig:**
- Startseite (Nutzenversprechen ohne Zahlenversprechen, Ablauf, Methodik, Abgrenzung, Kosten/Modell aus Konfiguration, FAQ)
- Mehrstufiger Rechner (Kontakt → Vertrag → Beiträge → Werte → Eignungs-Check-Fragen → Zusammenfassung mit Einwilligungen), mobil-first, Validierung je Schritt, Zwischenspeicherung im Browser (localStorage), DM/EUR-Eingabe, Versicherer-Autocomplete aus Starter-Namensliste
- Ergebnis-Seite: bestätigt die Erfassung und erklärt, warum noch kein Wert angezeigt wird – bewusst keine Platzhalter-Zahlen
- Rechtsseiten Impressum/Datenschutz/AGB/Widerrufsbelehrung als klar gekennzeichnete Entwürfe (Anbieterdaten offen)
- Geschäftsmodell-Schalter `apps/web/config/business.ts` (A/B/C angelegt, B vorläufig aktiv), Marken-Platzhalter `config/brand.ts`, `robots: noindex` für die Vorabversion

**Nachtrag 18.09.2026 – angebunden:**
- Ergebnis-Seite zeigt jetzt die echte kostenlose Vorschau (Modell B): Ampel mit Begründungen und Regel-IDs, Szenario-Spanne, Rückkaufswert-Vergleich inkl. „kein Vorteil erkennbar“, Annahmen/Warnungen und Versionsstände – berechnet über die zustandslose Route `/api/vorschau` (kein Speichern, keine PII-Logs)
- Versicherer-Seiten `/lebensversicherung/[versicherer]` (22 Stück, SSG) aus `data/insurers.json`: Namenshistorie, Branchendurchschnitts-Chart mit Tabellenansicht und Quellenangabe, klarer Hinweis auf laufende Kennzahlen-Beschaffung, CTA
- Versicherer-Autocomplete speist sich aus `data/insurers.json` (Starterliste entfernt)

**Weiterhin offen (Rest von Prompt 6):**
- Persistenz (Postgres/Prisma), E-Mails mit Double-Opt-in, Upload/OCR, Admin-Bereich, Zahlung (Modell A), B2B-Login (Modell C)
- Rate-Limiting, Consent-Management, Auftragsverarbeiter-Liste (mit Hosting-Entscheidung)
- PDF-Download des Berichts aus der Website (Generator existiert in `apps/report`)

## Vor Prompt 6 zu entscheiden (aus `docs/PROMPTS.md`)

- [ ] Marke, Domain und Absender (welche GmbH) – bis dahin bleibt „[MARKE]“ Platzhalter.
- [ ] Geschäftsmodell A, B oder C; bei B und C: welche Kanzlei bzw. welcher Versicherungsberater die rechtliche Bewertung übernimmt.
- [ ] Ob die Belehrungsprüfung Teil des Angebots ist oder nur die Berechnung (deutlich weniger RDG-Risiko).
- [ ] Anwaltliche Abnahme von `data/legal-rules.json` und aller Berichtstexte vor dem Go-live.
