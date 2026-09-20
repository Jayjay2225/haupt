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
| 9 | Altjahres-Kennzahlen 1990–2003 (Recherche, Scan-Pipeline, Sensitivität) | `data/raw/bafin/`, `scripts/import-bafin.ts`, `scripts/data-scans.ts` (`pnpm data:scans`), `docs/SCAN-ANLEITUNG.md`, `docs/SENSITIVITAET-ALTJAHRE.md`, COVERAGE-Matrix 1990–2003 | ✅ umgesetzt (18.09.2026, s. u.): BaFin 2011–2024 importiert; Altjahres-Recherche mit 94 belegten Unternehmenswerten (13 von 20 Gesellschaften mit Werten 1998–2003, 7 mit dokumentiertem Grund – `data/raw/altjahre/RECHERCHE.md`); Scan-Pipeline, Sensitivitätsbericht, Datenbasis-Ausweis, Unternehmenskurven. Offen: Lücken 1990–1997 und 2004–2010 (Bibliothek/Lesungspfad), Registerabgleich der drei neuen Gesellschaften |

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
- [x] Freigabe des Gestaltungsplans (`docs/DESIGN.md`) – erteilt am 20.09.2026, unverändert übernommen.
- [ ] Original-`index.html` von renten-rettung.de für `sites/unternehmer/` (Jack) und Ersatz für formsubmit.co (eigener Endpunkt oder Auftragsverarbeiter).
- [x] Anbieter: Kaufmannsladen Gebhard GmbH (20.09.2026, s. u.); offen bleiben USt-IdNr. und Telefon, B2B-Domain, Ankauf-Konditionen (Vertragsarten, Mindest-Rückkaufswert, Ablauf).
- [x] Zahlung und Bestellprozess: Bestellstrecke mit Stripe Checkout gebaut (20.09.2026, s. u.); offen: Stripe-Konto und Schlüssel, E-Mail-Dienst, Persistenz (Postgres/Prisma), Double-Opt-in, Fortsetzen-Link.
- [ ] Anwaltliche Abnahme von `data/legal-rules.json`, Rechtstexten und allen Berichtstexten vor dem Go-live; bis dahin Beta mit Passwort und `noindex`.

## Stand 20.09.2026 – Anbieter, Design-Freigabe, Bestellung und Zahlung

**Entscheidungen des Auftraggebers (20.09.2026):**
- Gestaltungsplan `docs/DESIGN.md` freigegeben („so übernehmen“).
- Anbieter ist die **Kaufmannsladen Gebhard GmbH**, Helmkrautstraße 35 A, 13503 Berlin, Geschäftsführer Jerome Gebhard, Amtsgericht Charlottenburg (Berlin) HRB 223190 B, Stammkapital 25.100 €, eingetragen 17.11.2020 (Handelsregister-Abruf 20.09.2026 über online-handelsregister.de, einen Spiegel des Registerportals; vor Go-live gegen handelsregister.de prüfen). Nicht im Register und daher nachzutragen: USt-IdNr., Telefonnummer (`apps/web/config/brand.ts`).
- Zahlung **vorab**; danach erhält die Kundin bzw. der Kunde **Rechnung und PDF-Auswertung**; Zahlungsarten **Karte, PayPal, Klarna**.

**Umgesetzt:**
- Impressum vollständig aus `config/brand.ts` (Firma, Anschrift, Vertretung, Register, E-Mail; USt-IdNr. und Telefon als sichtbare Platzhalter), Entwurfshinweis angepasst, VSBG-Satz als Entwurf; kein Link zur eingestellten EU-ODR-Plattform.
- Bestellstrecke: `/bestellen` (Police aus dem Rechner, Name und E-Mail für Rechnung/Versand, Bestätigung AGB + Widerrufsbelehrung, ausdrückliche Zustimmung zur sofortigen Ausführung – beides nicht vorangekreuzt –, Button „Zahlungspflichtig bestellen – 89 €“) → `POST /api/bestellung` (Formular- und Fallprüfung; Bericht nur für Altverträge im Policenmodell, sonst klare Absage ohne Zahlung; Stripe-Checkout-Sitzung mit Karte/PayPal/Klarna, Rechnungsadresse und Rechnung durch Stripe; Fall komprimiert in den Sitzungs-Metadaten, keine eigene Speicherung) → Stripe → `/bestellen/danke` → Webhook `POST /api/stripe/webhook` (Signaturprüfung; bei Zahlungseingang rechnen, PDF erzeugen, Rechnungslink holen, E-Mail mit PDF; Stand je Bestellung in `var/auslieferungen/<Bestellnummer>/status.json`; Stripe-Wiederholungen ohne Doppelversand; bei Fehlern Kundeninfo einmal, interne Meldung jedes Mal).
- E-Mail-Versand austauschbar (`lib/versand.ts`): Resend-API mit `RESEND_API_KEY`, sonst Protokoll-Modus (Datei statt Versand). Alle Umgebungsvariablen in `apps/web/.env.example`.
- Tests: Formularprüfung, Fall-Kodierung gegen Stripe-Grenzen, Bestellnummer, Auslieferung (Erfolg, Wiederholung, Fehlerpfad) – 109 Tests grün.

**Offen (Bestellung und Zahlung):**
- [ ] Stripe-Konto der Kaufmannsladen Gebhard GmbH: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (Webhook-Ziel `/api/stripe/webhook`, Ereignisse `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`), PayPal und Klarna im Dashboard aktivieren, Steuersatz „Umsatzsteuer 19 %“ (inklusiv) anlegen → `STRIPE_STEUERSATZ_ID`, Rechnungsangaben (Firma, Anschrift, Steuernummer/USt-IdNr., Nummernkreis) hinterlegen; Testlauf mit Stripe-Testkarten sowie PayPal-/Klarna-Test.
- [ ] E-Mail-Dienst entscheiden (Resend vorbereitet) und Absenderdomain authentifizieren (SPF/DKIM nur ergänzen – bestehende Mail-Einträge laut `docs/DOMAIN-UMZUG.md` unangetastet).
- [ ] Hosting mit Chromium für die PDF-Erzeugung im Webhook oder Auslieferung in einen Hintergrundjob; `var/` durch dauerhaften Speicher ersetzen (Persistenz weiterhin offen).
- [ ] Anwaltliche Abnahme der Bestelltexte: Widerrufsbelehrung und Zustimmungstext (§ 356 Abs. 4 oder 5 BGB), AGB, Rechnungsangaben (§ 14 UStG, mit Steuerberatung), Impressum (§ 5 DDG, VSBG), Datenschutzerklärung um Stripe und E-Mail-Dienst ergänzen (`docs/LEGAL-OPEN-QUESTIONS.md` Nr. 13–15).
- [ ] USt-IdNr. und Telefonnummer eintragen; Registerdaten gegen handelsregister.de prüfen.

## Stand Prompt 9 (Altjahres-Kennzahlen) – 18.09.2026

- **Voraussetzung erfüllt:** BaFin „Statistik der Erstversicherungsunternehmen – Lebensversicherung“, Tabelle 160, Excel 2011–2024 in `data/raw/bafin/` (Provenienz, Layouts A/B und Kennzahlen-Zuordnung in `data/raw/bafin/README.md`). Importer `scripts/import-bafin.ts` (eigener ZIP-/XML-Leser, jahresabhängige Zuordnung Kurzname → id in `mapping.json`) schreibt je Wert Quelle mit URL, Blatt/Zeile/Spalte und Abrufdatum → **1.344 Werte, data.version 0.2.0**. 105 BaFin-Kurznamen sind noch nicht zugeordnet (`KURZNAMEN.md`).
- **PDFs 2004–2010:** im Container kein PDF-Text-Werkzeug; Erfassung über den Lesungspfad (Teil B) vorgesehen.
- **Teil A (Selbstbeschaffung 1990–2003) – erledigt:** zwei unabhängige Rechercheläufe (Wayback-CDX mit Pausen, Mehrjahresübersichten, Pressemitteilungen als Zweitbeleg) für die 20 größten Altbestands-Gesellschaften, anschließend Zweitlesung aller Werte per Textextraktion/Seitenbild. Ergebnis: **94 Unternehmenswerte** (Nettoverzinsung, teils laufende Verzinsung) für 14 Gesellschaften, jeder mit URL, Seitenbeleg (`data/raw/altjahre/dokumente/`), Fundstelle, Abrufdatum und Qualitätsstufe; Import über `scripts/import-altjahre.ts` (`pnpm data:altjahre`) → data.version 0.4.0. Abnahme „≥ 10 von 20 mit Werten 1998–2003 oder dokumentiert, warum nicht“: 13 belegt, 7 dokumentiert (`data/raw/altjahre/RECHERCHE.md` mit offenen Spuren). Drei Gesellschaften neu in `data/insurers.json` (HDI/Gerling, Karlsruher, DBV-Winterthur; Rechtsnachfolge registerfest zu verifizieren), damit 27 Gesellschaften und 1.440 BaFin-Werte.
- **Teil B (Scan-Pipeline):** `scripts/data-scans.ts` (`pnpm data:scans`) vergleicht zwei unabhängige Lesungen je Seite, prüft 0–15 % und Sprünge > 3 Prozentpunkte, schreibt Abweichungen nach `data/raw/scans/REVIEW.md`; Anleitung für die Hilfskraft in `docs/SCAN-ANLEITUNG.md` (Bände, Tabelle, Fotografieren, Benennung, zwei Durchgänge).
- **Teil C (Sensitivität):** `docs/SENSITIVITAET-ALTJAHRE.md` (±1 Prozentpunkt auf alle Werte vor 2004: laufend bezahlte 1990er-Verträge ±0,8–1,9 %, beitragsfrei ±4,5 %, Einmalbeitrag ±11,5 %). Bericht weist die **Datenbasis der Nutzungen** aus (Anteil Unternehmens-/Branchen-/Näherungswerte); Versichererseiten zeigen die Unternehmenskurve (marine, durchgezogen) neben dem Branchendurchschnitt (grau, gestrichelt) und markieren Branchenjahre in der Tabelle.
- Rechenkern: Min-Szenario nutzt für Branchenjahre ab 2011 den kleineren Wert aus Netto- und laufender Verzinsung; Golden-Snapshots auf data.version 0.2.0 aktualisiert (`docs/CALC-SPEC.md` §10).

**Offen (Prompt 9):**
- [x] Abnahme „≥ 10 von 20 Gesellschaften mit Werten 1998–2003 oder dokumentiert, warum nicht“ (13 belegt / 7 dokumentiert).
- [ ] Lücken 1990–1997 (alle) und 2004–2010 (teils) schließen: BAV-Teil-B-Scans und BaFin-PDFs über den Lesungspfad, offene Spuren aus `RECHERCHE.md` (Bibliothek, Anfragen bei ERGO/Talanx/Nürnberger).
- [ ] Restliche 101 BaFin-Kurznamen zuordnen; Namens- und Rechtsnachfolge-Zuordnungen (insb. HDI/Gerling, Karlsruher, DBV-Winterthur, Generali/Proxalto) registerfest verifizieren.

## Entscheidungen aus dem Prompt-Set (Stand nach Prompt 8)

- [x] Marke, Domain: Renten-Rettung / renten-rettung.de. Absender: Kaufmannsladen Gebhard GmbH (20.09.2026).
- [x] Geschäftsmodell: Hybrid (kostenlose Ampel + kostenpflichtiger Bericht); Modell C (Kanzlei-Lizenz) als Code-Variante. Welche Kanzlei ggf. die rechtliche Bewertung übernimmt: offen.
- [x] Belehrungsprüfung im Verbraucherprodukt aus (nur Berechnung + Unterlagen-Checkliste); in der Kanzlei-Variante an.
- [ ] Anwaltliche Abnahme von `data/legal-rules.json` und aller Berichts- und Rechtstexte vor dem Go-live.
