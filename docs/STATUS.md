# Umsetzungsstand

Grundlage ist das Prompt-Set in `docs/PROMPTS.md` (Stand 11.09.2026) sowie die Prompts 8–9 („Renten-Rettung Privat“, 18.09.2026). Nach jedem abgeschlossenen Prompt wird diese Tabelle aktualisiert.

| Prompt | Inhalt | Artefakte | Status |
|---|---|---|---|
| 0 | Projektkontext | `CLAUDE.md`, Repo-Grundgerüst | ✅ umgesetzt (11.09.2026) |
| 1 | Rechtsrahmen als Regelwerk | `docs/LEGAL.md`, `data/legal-rules.json` (24 Regeln), `docs/LEGAL-OPEN-QUESTIONS.md` (12 Punkte) | ✅ umgesetzt (18.09.2026); Primärquellen-Abgleich der Zitate offen (Open Question Nr. 1) |
| 2 | Versicherer-Datenbank | `data/insurers.json` (data.version 0.2.0), `data/COVERAGE.md`, `scripts/update-insurers.ts` (`pnpm data:check`), `scripts/import-bafin.ts` (`pnpm data:bafin`) | 🟡 erweitert (18.09.2026): Branchendurchschnitt-Nettoverzinsung 1995/1999–2024 (GDV) und laufende Durchschnittsverzinsung 2011–2024 (BaFin), Basiszins § 247 BGB komplett (Bundesbank), Einlagenzins-Jahresmittel ab 2003 (Bundesbank MFI), Höchstzillmersatz 40‰/25‰, Höchstrechnungszins (DAV), 24 Gesellschaften; **Unternehmenskennzahlen 2011–2024 aus BaFin Tabelle 160** (1.344 Werte: Netto-/laufende Verzinsung, Verwaltungskostenquote, Abschlussaufwendungen). Offen: Unternehmenswerte 1990–2010 (Prompt 9), Nettoverzinsung Branche 1994/1996–1998/2025 |
| 3 | Rechenkern | `packages/calc` (calc.version 0.2.0), `docs/CALC-SPEC.md` inkl. Golden-Ergebnissen, `data/risk-defaults.json` | ✅ umgesetzt (18.09.2026): Beitragsreihe (Zahlweise/Dynamik/DM/Skalierung), Zillmer-Aufteilung, Nutzungen auf Sparanteil, 3 Szenarien, Gegenrechnung, Jahrestabelle; 36 Tests inkl. Property- und Golden-Tests gegen data/insurers.json |
| 4 | Eignungs- und Belehrungs-Check | `packages/eligibility` (0.2.0) | ✅ umgesetzt (18.09.2026): Ampel aus legal-rules.json, 16 Konstellationen getestet; offen: optionaler OCR/Vision-Baustein |
| 5 | PDF-Kurzprüfung | `apps/report`, Beispielberichte in `examples/` (`pnpm --filter @rueckab/report beispiele`) | ✅ umgesetzt (18.09.2026): 7 Abschnitte, Inline-SVG-Diagramme (validierte Palette), Kopf-/Fußzeile, de-DE, beide Golden-Beispiele erzeugt; offen: PDF/A-2b (Chromium liefert kein PDF/A), echtes Branding aus `brand/`, Regime-C-Berichtsvariante |
| 6 | Website und Funnel | `apps/web`, `apps/web/config/business.ts` | 🟡 teilweise (18.09.2026, s. u.); durch Prompt 8 auf Renten-Rettung umgestellt |
| 7 | Compliance- und Plausibilitäts-Review | `docs/REVIEW.md` | ✅ umgesetzt (18.09.2026): drei Rollen (RDG/UWG/Aktuar der Gegenseite) mit Fundstellen, Gegengutachten beider Beispielverträge, Modellempfehlung; vier Textkorrekturen direkt eingebaut (Gegenposition-Warnblock in Bericht und Vorschau, modellneutrale CTA, FAQ, Chart-Kennzeichnung). Offene Punkte priorisiert in REVIEW.md |
| 8 | Renten-Rettung Privat: Marke, Hybrid-Modell, Tonalität, Seiten, Design, Umzug | `apps/web/config/{brand,business,variante}.ts`, `docs/DESIGN.md`, `docs/DOMAIN-UMZUG.md`, `sites/unternehmer/`, `apps/web/test/{wording,ampel}.test.ts` | ✅ umgesetzt (18.09.2026, s. u.); offen: Freigabe Gestaltungsplan, Original-`index.html` der B2B-Seite, Anbieter-GmbH und B2B-Domain, Ankauf-Konditionen, Zahlung/Persistenz, anwaltliche Abnahme |
| 9 | Altjahres-Kennzahlen 1990–2003 (Recherche, Scan-Pipeline, Sensitivität) | `data/raw/bafin/`, `scripts/import-bafin.ts`, `scripts/data-scans.ts` (`pnpm data:scans`), `docs/SCAN-ANLEITUNG.md`, `docs/SENSITIVITAET-ALTJAHRE.md`, COVERAGE-Matrix 1990–2003 | 🟡 teilweise (18.09.2026, s. u.): Voraussetzung BaFin 2011–2024 erfüllt; Scan-Pipeline und Sensitivitätsbericht fertig; Unternehmenswerte 1990–2003 noch nicht belegt – Recherche läuft, Abnahme „≥ 10 von 20 Gesellschaften 1998–2003“ offen |

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

## Stand Prompt 8 (Renten-Rettung Privat) – 18.09.2026

**Entscheidungen umgesetzt:**
- Marke **Renten-Rettung** (renten-rettung.de), Produktname **Policen-Check**, Anbieter `[[ANBIETER]]`, Geschäftsführer-Bereich wandert auf `[[B2B-DOMAIN]]` – alles in `apps/web/config/brand.ts`; kein „[MARKE]“ mehr in der UI (Test).
- **Hybrid-Modell:** kostenlose wirtschaftliche Ampel **ohne Eurobeträge** (Größenordnung in Worten, Gegenposition, Unterlagen-Checkliste) + kostenpflichtiger Bericht ab **89 € brutto** (`config/business.ts`; Bestellung bis zur Zahlungsentscheidung deaktiviert).
- **Belehrungsbewertung aus** im Verbraucherprodukt → neutrale Unterlagen-Checkliste im Funnel und Ergebnis. **Modell C (Kanzlei-Lizenz)** bleibt im Code: `NEXT_PUBLIC_PRODUKT_VARIANTE=kanzlei` schaltet Belehrungs-Check, Eurobeträge und neutrale Optik (`data-optik="neutral"`) ein, ohne Renten-Rettung-Marke.
- **Tonalität:** Boulevard-Form, Warentest-Inhalt; Verbotsliste als Test (`wording.test.ts` prüft Seiten-Quelltexte, E-Mail-Texte, statische h1 ≤ 8 Wörter, Ankaufsseite ohne Prozent-/Aufkäuferangaben, kein „[MARKE]“). Musterfälle gerundet und als „Musterfall, Schätzung mit Bandbreite“ gekennzeichnet; das negative Ergebnis wird auf der Startseite genauso groß gezeigt.
- **Seiten:** `/` mit Schnellcheck (4 Felder → Funnel), großer Ampel, „So läuft es“, zwei Musterfälle (Grün/Rot), „Was kostet es“, Transparenz-Kasten, Fragen · `/verkaufen` (Platzhalter `[[ANKAUF-PRIVAT: …]]`, fünf Wege nebeneinander mit dem, was man jeweils aufgibt, Organisationspartner-Wording, keine Aufsichts-/Erlaubnisnennung) · `/so-verdienen-wir` · `/unternehmer` (Brücke, Link „Für Unternehmer“ in Kopf und Fuß) · `/bericht` · Ergebnis-Seite mit Ankauf-Block und **separater, nicht vorangekreuzter** Einwilligung · „Später am Rechner fortsetzen“ vorbereitet, aber aus (`FORTSETZEN_AKTIV = false`).
- **Beta-Schutz:** `robots: noindex` + Basic-Auth-Middleware (`BETA_PASSWORT`).
- **Design:** Gestaltungsplan `docs/DESIGN.md` (Freigabe offen), Farb-/Schrift-Tokens in `globals.css`, Archivo ExtraBold + Source Sans 3 self-hosted über `next/font`, Ampel-Komponente mit „springt an“ im Schnellcheck, sticky Hauptknopf, reduzierte Bewegung, gemessene Kontraste (WCAG AA).
- **`sites/unternehmer/`:** Struktur, README und Anpassungsliste; `index.html` ist eine neutrale Platzhalterseite (noindex) – die heutige statische Seite liefert Jack, sie wird nicht aus dem Netz nachgebaut.
- **`docs/DOMAIN-UMZUG.md`:** Umzugs-Checkliste (nur A/AAAA/CNAME, Mail-Einträge unverändert, Sicherung, Reihenfolge B2B live → Umschalten → TLS → alte Startseite als Backup, Go-live-Kriterien). Nichts davon ausgeführt.
- E-Mail-Texte (Adressbestätigung, Ampel fertig, Berichtsversand, Erinnerung, Später weitermachen) in `apps/web/lib/emails.ts`, Versand nicht angebunden.

**Offen (Prompt 8):**
- [ ] Freigabe des Gestaltungsplans (`docs/DESIGN.md`).
- [ ] Original-`index.html` von renten-rettung.de für `sites/unternehmer/` (Jack) und Ersatz für formsubmit.co (eigener Endpunkt oder Auftragsverarbeiter).
- [ ] Anbieter (GmbH, Impressum), B2B-Domain, Ankauf-Konditionen (Vertragsarten, Mindest-Rückkaufswert, Ablauf).
- [ ] Zahlung und Bestellprozess für den Bericht, Persistenz (Postgres/Prisma), E-Mail-Versand mit Double-Opt-in, Fortsetzen-Link.
- [ ] Anwaltliche Abnahme von `data/legal-rules.json`, Rechtstexten und allen Berichtstexten vor dem Go-live; bis dahin Beta mit Passwort und `noindex`.

## Stand Prompt 9 (Altjahres-Kennzahlen) – 18.09.2026

- **Voraussetzung erfüllt:** BaFin „Statistik der Erstversicherungsunternehmen – Lebensversicherung“, Tabelle 160, Excel 2011–2024 in `data/raw/bafin/` (Provenienz, Layouts A/B und Kennzahlen-Zuordnung in `data/raw/bafin/README.md`). Importer `scripts/import-bafin.ts` (eigener ZIP-/XML-Leser, jahresabhängige Zuordnung Kurzname → id in `mapping.json`) schreibt je Wert Quelle mit URL, Blatt/Zeile/Spalte und Abrufdatum → **1.344 Werte, data.version 0.2.0**. 105 BaFin-Kurznamen sind noch nicht zugeordnet (`KURZNAMEN.md`).
- **PDFs 2004–2010:** im Container kein PDF-Text-Werkzeug; Erfassung über den Lesungspfad (Teil B) vorgesehen.
- **Teil A (Selbstbeschaffung 1990–2003):** Recherche über Wayback-CDX (höflich, mit Pausen), Mehrjahresübersichten in Geschäftsberichten und Pressemitteilungen läuft für die 20 größten Altbestands-Gesellschaften (inkl. Altnamen); es werden nur Werte mit URL/Dokument, Seite und Abrufdatum übernommen. Stand je Jahr in `data/COVERAGE.md`, Matrix 1990–2003.
- **Teil B (Scan-Pipeline):** `scripts/data-scans.ts` (`pnpm data:scans`) vergleicht zwei unabhängige Lesungen je Seite, prüft 0–15 % und Sprünge > 3 Prozentpunkte, schreibt Abweichungen nach `data/raw/scans/REVIEW.md`; Anleitung für die Hilfskraft in `docs/SCAN-ANLEITUNG.md` (Bände, Tabelle, Fotografieren, Benennung, zwei Durchgänge).
- **Teil C (Sensitivität):** `docs/SENSITIVITAET-ALTJAHRE.md` (±1 Prozentpunkt auf alle Werte vor 2004: laufend bezahlte 1990er-Verträge ±0,8–1,9 %, beitragsfrei ±4,5 %, Einmalbeitrag ±11,5 %). Bericht weist die **Datenbasis der Nutzungen** aus (Anteil Unternehmens-/Branchen-/Näherungswerte); Versichererseiten zeigen die Unternehmenskurve (marine, durchgezogen) neben dem Branchendurchschnitt (grau, gestrichelt) und markieren Branchenjahre in der Tabelle.
- Rechenkern: Min-Szenario nutzt für Branchenjahre ab 2011 den kleineren Wert aus Netto- und laufender Verzinsung; Golden-Snapshots auf data.version 0.2.0 aktualisiert (`docs/CALC-SPEC.md` §10).

**Offen (Prompt 9):**
- [ ] Abnahme „≥ 10 von 20 Gesellschaften mit Werten 1998–2003 oder dokumentiert, warum nicht“ – hängt am laufenden Rechercheergebnis; Ergebnis wird in `data/insurers.json` (mit Quelle) bzw. COVERAGE-Matrix („nicht gefunden“, Weg über Scan) nachgetragen.
- [ ] BaFin-PDFs 2004–2010 erfassen (Lesungspfad) und importieren.
- [ ] Restliche BaFin-Kurznamen zuordnen; Namenszuordnungen registerfest verifizieren.

## Entscheidungen aus dem Prompt-Set (Stand nach Prompt 8)

- [x] Marke, Domain: Renten-Rettung / renten-rettung.de. Absender (GmbH) weiterhin `[[ANBIETER]]`.
- [x] Geschäftsmodell: Hybrid (kostenlose Ampel + kostenpflichtiger Bericht); Modell C (Kanzlei-Lizenz) als Code-Variante. Welche Kanzlei ggf. die rechtliche Bewertung übernimmt: offen.
- [x] Belehrungsprüfung im Verbraucherprodukt aus (nur Berechnung + Unterlagen-Checkliste); in der Kanzlei-Variante an.
- [ ] Anwaltliche Abnahme von `data/legal-rules.json` und aller Berichts- und Rechtstexte vor dem Go-live.
