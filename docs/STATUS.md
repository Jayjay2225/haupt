# Umsetzungsstand

Grundlage ist das Prompt-Set in `docs/PROMPTS.md` (Stand 11.09.2026) sowie die Prompts 8–9 („Renten-Rettung Privat“, 18.09.2026). Nach jedem abgeschlossenen Prompt wird diese Tabelle aktualisiert.

| Prompt | Inhalt | Artefakte | Status |
|---|---|---|---|
| 0 | Projektkontext | `CLAUDE.md`, Repo-Grundgerüst | ✅ umgesetzt (11.09.2026) |
| 1 | Rechtsrahmen als Regelwerk | `docs/LEGAL.md`, `data/legal-rules.json` (27 Regeln, Version 0.2.0), `docs/LEGAL-OPEN-QUESTIONS.md` (12 Punkte) | ✅ umgesetzt (18.09.2026); Primärquellen-Abgleich der Zitate offen (Open Question Nr. 1) |
| 2 | Versicherer-Datenbank | `data/insurers.json` (data.version 0.5.1), `data/COVERAGE.md`, `scripts/update-insurers.ts` (`pnpm data:check`), `scripts/import-bafin.ts` (`pnpm data:bafin`) | 🟡 erweitert (18.09.2026): Branchendurchschnitt-Nettoverzinsung 1980/1985/1990–2024 (GDV) und laufende Durchschnittsverzinsung 2011–2024 (BaFin), Basiszins § 247 BGB komplett (Bundesbank), Einlagenzins-Jahresmittel ab 2003 (Bundesbank MFI), Höchstzillmersatz 40‰/25‰, Höchstrechnungszins (DAV), 27 Gesellschaften; **Unternehmenskennzahlen 2011–2024 aus BaFin Tabelle 160** (1.344 Werte: Netto-/laufende Verzinsung, Verwaltungskostenquote, Abschlussaufwendungen). Offen: Unternehmenswerte 1990–2010 (Prompt 9), Nettoverzinsung Branche 2025 (1981–84/1986–89 bewusst offen, s. `data/DATA_REPORT.md`); Altjahre 1980/1985/1990–1998 seit data.version 0.5.0 belegt |
| 3 | Rechenkern | `packages/calc` (calc.version 0.3.0), `docs/CALC-SPEC.md` inkl. Golden-Ergebnissen, `data/risk-defaults.json` | ✅ umgesetzt (18.09.2026): Beitragsreihe (Zahlweise/Dynamik/DM/Skalierung), Zillmer-Aufteilung, Nutzungen auf Sparanteil, 3 Szenarien, Gegenrechnung, Jahrestabelle; 36 Tests inkl. Property- und Golden-Tests gegen data/insurers.json |
| 4 | Eignungs- und Belehrungs-Check | `packages/eligibility` (0.3.0) | ✅ umgesetzt (18.09.2026): Ampel aus legal-rules.json, 16 Konstellationen getestet; offen: optionaler OCR/Vision-Baustein |
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
- E-Mail-Versand austauschbar (`lib/versand.ts`): Resend-API mit `RESEND_API_KEY`, sonst Protokoll-Modus (Datei statt Versand; seit 29.09.2026 nur lokal – auf Vercel ist der Schlüssel Pflicht). Alle Umgebungsvariablen in `apps/web/.env.example`.
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

## Stand 21.09.2026 – renten-rettung.de wird die Privatkunden-Seite; Spam-Schutz; Vertragsbestätigung

**Entscheidungen des Auftraggebers (21.09.2026):**
- Die heutige Startseite (Geschäftsführer-Bereich) wird durch die neue Privatkunden-Seite **ersetzt**; das B2B-Modell läuft vorerst nicht, dafür wird später eine andere Website gefunden. Gelieferte Original-`index.html` als Archiv unter `sites/unternehmer/archiv/`, kein B2B-Umzug (`b2bDomain` leer, `/unternehmer` und „Für Unternehmer“ aus), Umstellungs-Checkliste neu geschrieben (`docs/DOMAIN-UMZUG.md`).
- USt-IdNr. DE815896163 und Telefon 01573 7634466 (vorerst) im Impressum; Anbieterkennzeichnung damit vollständig.
- Rechtstexte laut Auftraggeber anwaltlich abgenommen; Warnhinweise ebenfalls. **Achtung:** Datenschutz, AGB und Widerrufsbelehrung liegen im Repo weiterhin nur als Entwurf/Platzhalter vor – die abgenommenen Fassungen müssen geliefert und eingebaut werden (dann `EntwurfHinweis` entfernen). Die Datenschutzerklärung wurde als sachlicher Entwurf auf den heutigen Stand gebracht (Stripe, E-Mail-Dienst, Ratenbegrenzung, Ankauf-Einwilligung) – nicht Teil der Abnahme.

**Umgesetzt:**
- Spam-Schutz: E-Mail-Adressen werden erst im Browser zusammengesetzt (`KontaktAdresse`, kein `mailto:` im HTML), Ratenbegrenzung je Client auf `/api/vorschau` (60/10 min) und `/api/bestellung` (10/h), Honigtopf-Feld und Mindest-Ausfüllzeit im Bestellformular; das captcha-lose formsubmit-Formular der alten Seite fällt mit der Umstellung weg (`lib/ratenlimit.ts`).
- Vertragsbestätigung nach § 312f BGB als E-Mail **vor** Beginn der Berichtserstellung (Inhalt, Preis, Anbieter, abgegebene Zustimmung, Links zu Widerrufsbelehrung und AGB), einmalig je Bestellung.
- Indexierung schaltbar: `NEXT_PUBLIC_INDEXIERUNG=1` erst zum Go-live.

**Offen:**
- [ ] Abgenommene Rechtstexte (Datenschutz, AGB, Widerrufsbelehrung) liefern und einbauen; Datenschutz-Ergänzungen (Stripe, E-Mail-Dienst, Speicherdauern) vom Anwalt bestätigen lassen.
- [ ] Einordnung des Berichts als Dienstleistung oder digitaler Inhalt für Widerrufsbelehrung und Zustimmungstext (docs/LEGAL-OPEN-QUESTIONS.md Nr. 13) – Frage des Auftraggebers vom 21.09.2026 dort beantwortet.
- [ ] `auxinum-Logo-W.png` und übrige Dateien des alten Webspace sichern; `/einkehr`-Weg klären (docs/DOMAIN-UMZUG.md, Abschnitt 1).

## Stand 21.09.2026 (2) – Bereitstellung bei Vercel vorbereitet

- Entscheidung: Hosting bei Vercel (united-domains-Webspace kann kein Node.js; Domain bleibt dort, nur Web-DNS-Einträge zeigen auf Vercel). Anleitung `docs/DEPLOY-VERCEL.md`.
- Code: Chromium in Serverless-Umgebungen aus `@sparticuz/chromium` (`apps/report/src/pdf.ts`), Webhook `maxDuration = 60`, Region `fra1` (`apps/web/vercel.json`), Auslieferungsordner auf Vercel `/tmp`, dauerhafte „ausgeliefert“-Markierung in den Stripe-PaymentIntent-Metadaten (idempotent ohne Dateisystem), Test dafür ergänzt.
- Offen: Vercel-Projekt anlegen und Variablen setzen (Auftraggeber), Stripe-Webhook, Testbestellung unter der Vorschauadresse, dann DNS-Umstellung.

## Stand 21.09.2026 (3) – Monatseingabe im Rechner korrigiert

Die Monatsfelder (Beginn, Ende, Status-Datum, Beitragszahlung bis, Schnellcheck) waren `input type="month"`. Browser ohne Monatsauswahl (u. a. Safari) zeigen dafür ein leeres Textfeld, das stillschweigend nur die ISO-Form „2000-03“ annahm – die Eingabe war damit praktisch nicht zu treffen (im Test des Auftraggebers gescheitert).

Neu: eigene Komponente `MonatsFeld` (Textfeld, Platzhalter `MM/JJJJ`, Ziffern-Tastatur). Getippt wird deutsch, gespeichert ISO. `parseMonatDe` (apps/web/lib/format.ts) liest „03/2000“, „3/2000“, „03.2000“, „03-2000“, „03 2000“, „032000“, „2000-03“, „200003“ und zweistellige Jahre („10/95“ → 1995; bis 30 → 20xx). Unter dem Feld erscheint der erkannte Monat ausgeschrieben („März 2000“), die Fehlermeldungen nennen ein Beispiel. Sieben neue Tests; im Browser gegen den Produktionsbuild geprüft.

## Stand 21.09.2026 (4) – Monatsauswahl, verkaufsstärkere Ergebnis-Seite, „So verdienen wir alle“

**Anweisungen des Auftraggebers (21.09.2026):** Monatsfelder mit Auswahl UND Tippen in einem Feld; Kanzlei-Framing („Weg zur Kanzlei“, „zum Mitnehmen in die Kanzlei“) raus aus dem Verbraucherprodukt – Durchsetzung läuft über uns/Partner (Kanzlei-/Auxinum-Version später als eigene Variante bzw. Webintegration); Ergebnis-Seite auf Verkauf des Berichts zuspitzen („Wollen Sie wissen, was für Sie drin ist?“), Gegenposition/Annahmen nicht mehr sichtbar in der Übersicht; Grün soll langsam pulsieren; statt „So verdienen wir“ → „So verdienen wir alle“ mit drei Schritten (anteiliger Rückkaufswert in 18 Werktagen über Partner, mögliche Steuererstattung, Durchsetzung durch Partnerkanzleien – Zusatzerlös gehört dem Kunden).

**Umgesetzt:**
- `MonatsFeld` mit aufklappbarer Monatsauswahl (Jahr blättern 1960–2035, Monatsraster, Startjahr je Feld, Escape/Blur schließt), Tippen unverändert möglich; im Browser getestet.
- Grünes Ampellicht pulsiert langsam (2,4 s, Leucht-Schein); bei `prefers-reduced-motion` statisch mit dezentem Schein.
- Ergebnis-Seite (privat): Grün-Titel „Da liegt richtig was drin“, Größenordnung größer, Bericht-Block „Wollen Sie wissen, was für Sie drin ist?“, danach „Und danach? So verdienen wir alle.“ mit den drei Schritten und der bestehenden, nicht vorangekreuzten Einwilligung; Gegenposition und Annahmen nur noch eingeklappt („Wie wir rechnen“); Transparenz-Kasten der Ergebnis-Seite dadurch ersetzt (Startseite behält ihn in neuer Fassung).
- Kanzlei-Framing ersetzt auf Startseite, /bericht, /so-verdienen-wir (neu: „Ihr Weg zum Geld – in drei Schritten“), Unterlagen-Schritt, Berichts-E-Mail (Upsell: „Antworten Sie einfach auf diese E-Mail“), Footer.

**Rechtliche Leitplanken (bewusst beibehalten, Abweichungen vom Diktat):** „Mehrerlös“ und „Ansprüche durchsetzen“ vermieden (Verbotsliste Prompt 8: „Mehrerlös“, „Anspruch“ nur verneint) → „Was dabei zusätzlich herauskommt, gehört allein Ihnen“ / „Rückabwicklung durchsetzen“; kein Großbuchstaben-Geschrei („ACHTUNG ES LOHNT“ → pulsierendes Grün + „Da liegt richtig was drin“); Steuererstattung nur als Möglichkeit mit Verweis auf die Steuerberatung. **Offen/anwaltlich zu prüfen:** Zusage „innerhalb von 18 Werktagen“ (stammt aus dem Partnermodell; Konditionen `[[ANKAUF-PRIVAT]]` weiter offen), Beschreibung „Partnerkanzleien setzen die Rückabwicklung durch“ (RDG/Modell C), neue Ergebnis-/Verkaufstexte insgesamt (docs/LEGAL-OPEN-QUESTIONS.md Nr. 16).

## Stand 21.09.2026 (5) – Ergebnis-Seite nachgeschärft (Vorgaben des Auftraggebers)

- Größenordnungs-Karte komplett entfernt (die Worte-Formel doppelte sich bei gleicher Stufe ohnehin unschön); Zahlen gibt es nur noch im Bericht.
- Grün-Text gekürzt auf: „In allen drei Szenarien liegt der Widerspruch über Ihrem Rückkaufswert. Der Bericht liefert die Zahlen, danach der Weg über uns zu Ihrem Geld.“
- Bericht-Block: „Der Bericht nennt die Zahlen, Jahr für Jahr, jede mit Quelle. Einführungspreis: nur 89 € statt 119 € …“; bei Grün „Es lohnt sich – unsere Partner übernehmen den Rest.“, bei Gelb konditional („Und wenn es sich lohnt …“). Streichpreis 119 € neu in `config/business.ts` (`BERICHT_PREIS_REGULAER_EUR`), auch auf /bericht, im Bestellformular und im Startseiten-Preistext; berechnet werden weiterhin 89 €.
- Upsell-Block heißt „Und danach? Das Rund-um-Sorglos-Paket.“; Schritt 2 „…auch dabei unterstützen Sie unsere Partner“, Schritt 3 „Jeglicher Mehrerlös bleibt bei Ihnen – ohne Abzüge.“ (gleichlautend auf /so-verdienen-wir). Wording-Test entsprechend gelockert: „Mehrerlös“ ist erlaubt; verboten bleiben Prozentangaben und die Nennung des Aufkäufers.
- Klappentext „Wie wir rechnen …*“ enthält nur noch den Hinweis auf AGB und Datenschutzerklärung (plus Versionszeile); die Grundsätze stehen jetzt als verlinkter Abschnitt „So rechnen wir – Annahmen und Datenherkunft“ in den AGB (`/agb#rechenweg`), die Einzelfall-Annahmen und die Gegenposition vollständig im Bericht (Kanzlei-Variante unverändert mit sichtbarer Gegenposition).
- **Abweichung vom Diktat, bewusst:** „kurzfristiges Angebot“ nicht übernommen (Verbotsliste Prompt 8: Zeitdruck/Verknappung; UWG-Risiko) – stattdessen „Einführungspreis“. Der Streichpreis 119 € ist nur zulässig, wenn er der echte künftige Regulärpreis ist (docs/LEGAL-OPEN-QUESTIONS.md Nr. 17).

## Stand 21.09.2026 (6) – Startseite nach Vorgabe des Auftraggebers

- Hero: „Alte Lebensversicherung? Erst rechnen. **Dann handeln.**“ (auch als Marken-Claim in `config/brand.ts`), Untertitel „Kündigen bringt Ihnen maximal den Rückkaufswert. Ein Widerspruch bringt häufig mehr. Kostenlose Einschätzung, mit klarer Ampel.“, Zielgruppe erweitert auf **„Vertrag zwischen 1990 und 2016?“** (auch auf den Versichererseiten). Die Ampel filtert weiterhin ehrlich: vor 29.07.1994 und ab 2008 zeigt sie Rot mit Begründung – die breitere Ansprache führt also mehr Fälle in den kostenlosen Check, verspricht ihnen aber nichts.
- „So läuft es“: Schritt 2 „Grün, Gelb oder Rot. So wissen Sie Bescheid.“; Schritt 3 statt „Bericht holen. Oder lassen.“ jetzt „**Was ist für Sie drin?** Anspruch errechnen lassen … Und dann durchsetzen: unsere Partner stehen für Sie bereit.“
- Wording-Regel gelockert (Entscheidung des Auftraggebers, zweimal bekräftigt): „Anspruch errechnen“/„Ansprüche durchsetzen“ sind erlaubt; verboten bleiben bezifferte Zusagen („Anspruch in Höhe von … €“, „steht Ihnen zu“). Anwaltlich zu prüfen: LEGAL-OPEN-QUESTIONS Nr. 18.

## Stand 21.09.2026 (7) – Jahrgänge 1990–2016: Recherche und neue Regime-Ampel

Auftrag: Begründung der bisherigen Rot-Schaltung liefern und Urteile recherchieren, welche Zeiträume tragfähig sind (Partneraussage: „bis 2016, so alt wie möglich“; zweiter Strang: versprochene, nicht ausgezahlte Überschüsse). Ergebnis in `docs/RECHERCHE-ZEITRAEUME.md` (mit Quellen und Abrufdatum): vor-1994 trägt über den Widerruf nach § 8 Abs. 4 VVG i.d.F. 1990 (ab 1991, ohne belehrungsunabhängiges Erlöschen) plus Mindestrückkaufswert-Rechtsprechung (BGH 12.10.2005 IV ZR 162/03; 26.06.2013 IV ZR 39/10; BVerfG 1 BvR 80/95); 2008–2016 über den Widerruf n.F. bei fehlerhafter Belehrung (BGH 29.07.2015 IV ZR 384/14; Grenzen IV ZR 132/18, IV ZR 32/20). Umgesetzt: Ampel vor-1994 → Gelb, 2008–2016 → Gelb, ab 2017 → Rot (`bestimmeWirtschaftlicheAmpel` mit Beginn-Jahr); Ergebnis-Seite zeigt für die neuen Gelb-Jahrgänge den Partner-Hinweis statt des Berichtskaufs (Bestell-API lehnt diese Regime weiterhin ab). Anwaltliche Abnahme: LEGAL-OPEN-QUESTIONS Nr. 19.

## Stand 21.09.2026 (8) – Prompt 10: Verkaufstexte, Erstkunden-Programm, neue Verbotslisten

- **Copy-Deck integriert:** Startseite komplett neu (Hero A/B/C per `NEXT_PUBLIC_HERO_VARIANTE`, Rückkaufswert-Schock, „Das ist keine Meinung. Das ist Rechtsprechung.“ mit BGH-Kachel (Az. IV ZR 76/11, sinngemäß), Musterfall-Kachel aus dem Rechenkern (vorsichtiges Szenario), Rot-Ehrlichkeits-Kachel, Tempo-Block, Zukunftsbild, Preis-Block mit Fußnote, Ankauf-Block, Deck-Transparenz-Kasten, FAQ im neuen Ton); Ampel-Texte nach Deck (Grün mit Größenordnungs-Zeile in Worten, Gelb „Knapp.“, Rot mit Verkaufs-Hinweis und Knopf „Ankaufsangebot ansehen“); Gegenposition-Block wieder sichtbar; Produktname durchgehend **„Prüfbericht“** (nie „Gutachten“); Knöpfe „Ja, ich will die Zahl. 89 €“ / „Genau wissen. 89 €“; E-Mails im neuen Ton inkl. „Drucken … zum Anwalt“ (der Zusatz zur Kostenschutz-Police ist seit Prompt 14 überall entfernt).
- **Anzeigen** in `apps/web/content/anzeigen.ts` (Google ≤ 30/90 – zwei Deck-Zeilen mussten dafür minimal gekürzt werden, s. docs/TEXT-REVIEW.md; Meta-Haupttext), laufen durch den Wording-Test.
- **Fünf harte Linien** als neuer Website-/E-Mail-/Anzeigen-Test (Betrugs-Vokabular, Ergebnisversprechen, Prozent-Versprechen, Verknappung, „Gutachten“; plus fortgeltende Ankauf-Regeln); alte strenge Liste jetzt separat für den PDF-Bericht (`apps/report/test/wording-bericht.test.ts`). 120 Tests grün.
- **Erstkunden-Programm:** Freischaltcode-Feld im Bestellformular, `ERSTKUNDEN_CODES`, kostenlose Direkt-Auslieferung (`EK-…`), Feedback-Bitte in der Versand-Mail, Danke-Seite-Variante; `Testimonials`-Komponente rendert ausschließlich `verified` + `consent_id` (Test), Liste leer; Ablauf und Grenzen in `docs/ERSTKUNDEN.md`.
- **Tempo belegt:** Vorschau-Route 10–28 ms (drei Messungen am Produktions-Build), PDF-Erzeugung lokal < 2 s, Webhook `maxDuration` 60 s mit E-Mail-Fallback.
- **Jacks Textstellen** gegen die fünf Linien: vollständige Liste mit Fundstellen, Bewertung und Alternativen in `docs/TEXT-REVIEW.md` (Kernpunkte: „Mehrerlös … ohne Abzüge“ und „18 Werktage“ belassen und zur anwaltlichen Prüfung markiert; „Anspruch errechnen“ durch Deck-Wortwahl ersetzt, Original dokumentiert).
- Offen: LEGAL-OPEN-QUESTIONS Nr. 20 (BGH-Wortlaut, Vertragszahl mit Quelle, 0-€-AGB fürs Erstkunden-Programm, Bestätigung der gelockerten Liste).

## Stand 22.09.2026 – Ultracode-Code-Checkup: 22 bestätigte Funde behoben

Sechs Prüf-Dimensionen, jede Meldung dreifach adversarial verifiziert (78 Agenten). Alle 22 bestätigten Funde behoben, dazu die eindeutigen aus der Rest-Liste – vollständige Tabelle in `docs/CHECKUP-2026-09-22.md`. Schwerste Punkte: Basic-Auth hätte den Stripe-Webhook blockiert; `@sparticuz/chromium` wäre auf Vercel falsch gebündelt gewesen (PDF-Erzeugung tot); kein automatischer Retry bei Auslieferungsfehlern; Erstkunden-Code-Race; Zinsreihen-Fallback nutzte 2010er-Branchenwert für 2025/26 (**Golden (b) korrigiert**: Basis-Rückabwicklungswert jetzt 639.595,68 €, CALC-SPEC §10, Beispiele und Sensitivität regeneriert); Mehrwert rechnet erhaltene Auszahlungen gegen; beendete Verträge haben einen eigenen Ampel-Zweig; Verträge vor 29.07.1994 sind auch im Eignungs-Check Gelb. 122 Tests, Typecheck und Build grün; Externalisierung des Chromium-Pakets im Build-Output nachgewiesen.

## Stand 25.09.2026 – Prompt 12: eine Ampel für 1980–2020, Design B, alle Texte

Prompt 12 (Upload 25.09.2026) ersetzt die Prompts 8–11, wo sie widersprechen. Vollständig umgesetzt in der Reihenfolge von Abschnitt 8:

**0. Entscheidungen:**
- [x] Zeitraum **1980 bis 2020**, einheitlich, ohne Zonen (`BRAND.range`, überall referenziert; Startseite, Versichererseiten, Anzeigen, Funnel-Validierung).
- [x] Genau **eine wirtschaftliche Ampel** (Basis-Szenario gegen Rückkaufswert; beendete Verträge: gegen das bereits Erhaltene) – gleiche Formel für alle Jahrgänge.
- [x] Keine Pflicht-Handprüfung; individuelle Prüfung als Angebot (`/anfrage`, Karte „Lieber persönlich?“, Fonds-Weg).
- [x] Rechtsgrundlagen von der Website entfernt (kein § 5a, kein „1994 bis 2007“ – Wording-Test erzwingt das); `RECHTSWEG_SATZ` + Methodikabsatz 1.4 wörtlich im Bericht; optionaler Ansatzpunkte-Kasten aus `config/ansatzpunkte.json` (leer = ungedruckt).
- [x] Design B „Nachtblau & Salbei“ (Token in `config/brand.ts`, `globals.css`, Bericht; Schriften Newsreader/Manrope vendored `brand/fonts/`, Bericht Base64-eingebettet; Kontraste gemessen in `docs/DESIGN.md`).
- [x] Hybrid/`ACCESS_MODE='lead'`; Streichpreis 119 € entfernt → „89 € einmalig“; Freischaltcodes mit einmalig/mehrfach/Ablauf/Partner; SEPA als Zahlungsart ergänzt.
- [x] Kundenstimmen Manfred/Ulla in `data/testimonials.json` angelegt – **verified erst mit Freigabe-Dateien** unter `docs/freigaben/` (fehlen noch; Prinzip 1 – siehe TEXT-REVIEW Nr. 16).

**Rechenkern/Daten:** Regime-Sonderpfade entfernt (CalcResult einheitlich; `estimated_branch`-Kennzeichen je Branchen-/Näherungsjahr); Fallback am Reihenanfang auch vorwärts. **data.version 0.5.0**: Branchen-Nettoverzinsung 1980/1985/1990–1998 aus GDV-Primärquellen (DNB-Archiv, kreuzgeprüft), Lücken 1981–84/1986–89 bewusst offen; Einlagenzins 1980–2002 aus Bundesbank-Spareckzins (SU0022, Rohdaten `data/raw/bundesbank/`). Abdeckungsmatrix: `data/DATA_REPORT.md`. Golden (b) Basis jetzt 639.598,15 € (1996–98 belegt statt Näherung; CALC-SPEC §10). Sensitivität regeneriert.

**Website:** Startseite exakt nach 3.1 (Hero, Einstiegskarte „Vier Angaben. Ergebnis sofort.“ mit live anspringender Ampel über /api/vorschau, Vertrauenszeile, „So läuft es“, Berichtsvorschau = Seite 1 des echten Musterfall-PDFs (`pnpm vorschau:bild` → `public/bericht-vorschau.png`), Preis, Kundenstimmen (leer bis Freigaben), Verkaufen, Transparenz-Kasten, 6 FAQ, Fußzeile). Funnel = Assistent mit 10 Fragen (3.2; Kanzlei-Variante +1 Eignungs-Schritt), Fortschrittsbalken, festem Weiter-Knopf, DM/€-Schalter vor 2002, Auszahlungs-Liste, E-Mail-Schritt; Ergebnis-Link per Mail (Link trägt die Daten selbst, 30 Tage – `/rechner/fortsetzen`, `FORTSETZEN_AKTIV=true`). Ergebnis-Seite nach 3.3 (≤ 40 Wörter über dem Knopf – Test; Rot ohne Kaufknopf mit Verkaufen-Karte zuerst; vier Accordions; Einwilligungs-Karte; „Lieber persönlich?“). `/verkaufen` (drei Wege + Formular + `[[ANKAUF-PRIVAT]]`), `/so-verdienen-wir` (drei Absätze), `/anfrage` neu; E-Mails nach 3.4. Anzeigen nach Abschnitt 6 (`docs/ADS.md`; drei Zeilen wegen Google-Limits gekürzt – gemeldet in TEXT-REVIEW Nr. 9–11).

**Bericht:** Design B (Kopfbalken, Newsreader/Manrope eingebettet, Zebra-Tabellen, Beträge rechtsbündig, Mehrwert-Balken in CTA), Methodikabsatz 1.4, wirtschaftliche Ampel auf dem Deckblatt, Belehrungsteil nur noch in der Kanzlei-Variante (`belehrungsCheck`), Methodik-Zitate (IV ZR 76/11, IV ZR 513/14) statt Belehrungs-Zitaten, Datenbasis-Ausweis samt `estimated_branch`. Beispiele regeneriert (`examples/Pruefbericht_BSP-2026-{A,B,C}…`, C = Vertrag 05/1986, 150 DM).

**Abnahme (Abschnitt 8):** 1986er- und 2015er-Vertrag laufen ohne Sonderpfad durch (Tests); Ampel aus `config/ampel.ts`; Rot ohne Kaufknopf (Test); Startseite zeigt „1980 bis 2020“, nirgends § 5a/„1994 bis 2007“ (Test); Textbudgets ≤ 8/25/40/40 (Test, Auslegung ASSUMPTIONS Nr. 53); Bericht mit Methodikabsatz, Anteils-Ausweis, Design B, eingebetteten Schriften (Tests); Kundenstimmen nur mit Freigabe-Feldern (Test); Kontraste dokumentiert; mobil 360 px geprüft (Screenshots); **Typecheck, 135 Tests, Build (48 Seiten) grün**.

**Offen aus Prompt 12:**
- [x] Freigabe-Dateien für Manfred/Ulla nach `docs/freigaben/` → `verified: true` – erledigt mit Prompt 13 (0.7); Original-Kundeneinwilligungen nachzureichen, s. u.
- [ ] `[[ANSATZPUNKTE: von Jack/Kanzlei]]` in `config/ansatzpunkte.json` füllen (sonst bleibt der Kasten ungedruckt).
- [ ] Anwaltliche Abnahme des Prompt-12-Pakets (LEGAL-OPEN-QUESTIONS **Nr. 21**: Ampeldefinition/Schwellen, Rechtsweg-Satz, Methodikabsatz, Zeitraum 1980–2020 in der Werbung, Kundenstimmen, Website-Texte, SEPA, Anfrage-Formulare); Banner/Beta bleiben bis dahin.
- [ ] Branchen-Lücken 1981–84/1986–89 (Spuren in `data/DATA_REPORT.md`); `[[ANKAUF-PRIVAT]]`-Konditionen; Vercel-/Stripe-Einrichtung wie gehabt (docs/DEPLOY-VERCEL.md).

## Stand 25.09.2026 (2) – Prompt 13: Übernahme-Positionierung, Übernahme-Ampel, Bericht in 12 Stunden

Prompt 13 (Upload 25.09.2026) ändert Prompt 12, wo beide sich widersprechen; sonst gilt Prompt 12 weiter. Vollständig umgesetzt:

**Positionierung und Ampel:**
- Neues Selbstverständnis: Renten-Rettung **organisiert die Durchsetzung** mit spezialisierten Anwälten (Partnerkanzlei). Die rechtliche Struktur ist bewusst offen (`[[DURCHSETZUNGSSTRUKTUR]]`, LEGAL-OPEN Nr. 22a); bis zur Entscheidung überall die neutrale Fassung „Wir organisieren die Durchsetzung mit spezialisierten Anwälten, mit denen wir zusammenarbeiten“.
- **Übernahme-Ampel** statt Wirtschaftlichkeits-Ampel (`config/ampel.ts`, `lib/ampel.ts`): Grün (Mehrwert ≥ 5.000 €), Gelb (0 < Mehrwert < 5.000 €), Rot (kein rechnerischer Vorteil ODER Vertrag gekündigt/ausgezahlt), **Grau** (Rechnung positiv, aber Rückkaufswert unter 30.000 €). Reihenfolge: Status → Schwelle → Rechnung. Übernahme-Kriterien: Vertrag läuft oder beitragsfrei UND Rückkaufswert ≥ 30.000 €.
- **Gratis-Ansicht zeigt nur noch die Ampel** – keine Größenordnung, keine Wortbänder, keine Spanne (Tests). Kaufknopf („Prüfbericht bestellen · 89 €“) nur bei Grün/Gelb; die Bestell-API lehnt Rot/Grau serverseitig ab (422). Grau nennt die feste 30.000-€-Grenze, Rot-Status verweist auf anwaltliche Beratung, Rot-Rechnung auf die Verkaufen-Karte.

**Bericht in 12 Stunden (zweiphasige Auslieferung, `lib/erfuellung.ts`):**
- Phase A im Stripe-Webhook: § 312f-Bestätigung sofort, Bericht wird probeweise erzeugt (Plausibilisierung), Auffälligkeits-Kennzeichen berechnet (Fonds, Beginn vor 1994, hoher Branchenwert-Anteil, Mehrwert > 200 % des Rückkaufswerts, Beitragssummen-Abweichung > 5 %), Markierung `erzeugt_am` + Kennzeichen + Lead-Status in den Stripe-Metadaten.
- Phase B: Versand nach Freigabe in der Admin-Liste **oder automatisch nach 10 Stunden** über den Cron `GET /api/auslieferung/cron` (stündlich per `apps/web/vercel.json`; Auth: Bearer `CRON_SECRET` oder `?schluessel=ADMIN_PASSWORT`). **Achtung: Vercel-Hobby erlaubt nur tägliche Crons** – für die 12-Stunden-Zusage Pro-Tarif oder externer Zeitplaner nötig (docs/DEPLOY-VERCEL.md, Abschnitt 4). Erstkunden-Codes liefern weiterhin sofort.
- **Admin-Liste** `/admin?schluessel=…`: bezahlte Bestellungen der letzten 30 Tage mit Kennzeichen, „Freigeben & senden“, Lead-Status (Bericht gekauft / Übernahme angefragt / Mandat / Vergleich oder Urteil), CSV-Export (`/api/admin/leads.csv`); der Cron holt sich die Sitzungen der letzten 3 Tage.

**Texte und Seiten:**
- Startseite nach 2.1: Mikrozeile „Kostenlos in 5 Minuten. Bericht in 12 Stunden per E-Mail.“, vier Schritte, neuer Block „Warum über uns“ (Platzhalter `[[KANZLEI: Name, Ort]]` → `NEXT_PUBLIC_PARTNERKANZLEI`, `[[ZAHL, belegbar]]` → `NEXT_PUBLIC_GEPRUEFTE_POLICEN`), FAQ mit 7 Fragen (inkl. 30.000-€-Frage; die FAQ „Ist das Rechtsberatung?“ ist laut Deck entfallen – gemeldet, TEXT-REVIEW Nr. 20).
- Ergebnis-Seite nach 2.2 mit den vier Zuständen im Deck-Wortlaut; drei Accordions (Warum diese Einschätzung / Gegenposition / Unterlagen-Liste).
- **„So verdienen wir“ ersatzlos entfernt** (Seite, Header-/Footer-Links, Transparenz-Kasten); Offenlegung der Vergütung jetzt in der Ankauf-Einwilligung, im Datenschutz („Vergütung“, Abschnitt Durchsetzung) und im Impressum („Offenlegung wirtschaftlicher Verbindungen“, mit `[[DURCHSETZUNGSSTRUKTUR]]`).
- Neu **`/durchsetzung`**: „Wir übernehmen.“, drei Schritte, Konditionen-Platzhalter (`[[KONDITIONEN]]`, `config/durchsetzung.ts`), Formular mit Unterlagen-Upload (≤ 5 Dateien à 8 MB, PDF/JPG/PNG, gesamt ≤ 20 MB), Frage nach einer Kostenschutz-Police (seit Prompt 14 entfernt), zwei nicht vorangekreuzten Einwilligungen; Unterlagen gehen als Mail-Anhang an info@, keine Server-Speicherung (Datenschutz ergänzt).
- E-Mails: Berichtsversand „Ihr Prüfbericht ist da“ mit CTA „Durchsetzung beauftragen“ (Link auf `/durchsetzung`); neue Bestätigung „Übernahme angefragt“; Vertragsbestätigung nennt 12 Stunden + Plausibilisierung.
- Bericht: Übernahme-Kasten auf Seite 7 (Kriterien, Konditionen, Durchsetzungs-URL); Methodikabsatz nennt die spezialisierten Anwälte.
- Funnel: beendete Verträge werden bis zum Ergebnis geführt (die Ampel filtert, keine Schwellen-Hinweise im Fragebogen); neue Frage „Wie möchten Sie kontaktiert werden?“ (E-Mail/Telefon; Telefon → Pflichtnummer).
- **Kundenstimmen live** (`verified: true`): Freigabe durch den Auftraggeber in Prompt 13 (0.7), dokumentiert in `docs/freigaben/freigabe-{manfred,ulla}-2026.md`; die Original-Kundeneinwilligungen sind dort ausdrücklich **nachzureichen**.
- Anzeigen: neu „Bericht in 12 Stunden“, „Wir übernehmen Ihren Fall“; „Ergebnis sofort …“ gestrichen (docs/ADS.md).
- Verbotsliste erweitert (Wording-Test): kein „nur wir“/„die einzige …“, kein „garantiert durchsetzen“, keine Zahlen zu Erfolgen/Policen ohne Beleg, keine Behauptung einer Prüfung, die nicht stattfindet („plausibilisiert“, nicht „von Gutachtern geprüft“); Anwalts-Mitnahme-Phrasen („Zum Mitnehmen …“) verboten.

**Abnahme (Prompt 13, §7):** Alle sieben Prüfpunkte erfüllt (vier Ampel-Zustände aus Config; Grau/Rot ohne Kaufknopf, serverseitig abgelehnt; Gratis-Ansicht ohne Beträge/Wortbänder; „So verdienen wir“ nirgends verlinkt, Offenlegung vorhanden; 12-h-Mechanik mit Marker/Idempotenz getestet; Kontaktweg-Pflicht; Anzeigen ohne „sofort“). **Typecheck, 141 Tests, Build (53 Seiten) grün**; Beispielberichte A/B/C und `bericht-vorschau.png` regeneriert.

**Offen aus Prompt 13:**
- [ ] `[[DURCHSETZUNGSSTRUKTUR]]` entscheiden (RDG-Frage!) und Impressum/Datenschutz/Einwilligungen konkretisieren (LEGAL-OPEN Nr. 22a).
- [ ] Partnerkanzlei benennen (`NEXT_PUBLIC_PARTNERKANZLEI`), belegbare Policen-Zahl (`NEXT_PUBLIC_GEPRUEFTE_POLICEN`), Konditionen der Übernahme (`config/durchsetzung.ts`), Entscheidung Preis-Anrechnung (`NEXT_PUBLIC_PREIS_ANRECHNUNG`).
- [ ] Original-Kundeneinwilligungen (Manfred, Ulla) in `docs/freigaben/` ablegen (LEGAL-OPEN Nr. 22e).
- [ ] 12-h-Betrieb absichern: Vercel Pro (stündlicher Cron) oder externer Zeitplaner; `ADMIN_PASSWORT`/`CRON_SECRET` setzen (docs/DEPLOY-VERCEL.md, Abschnitt 4).

## Stand 25.09.2026 (3) – Bereitstellung auf Vercel-Hobby lauffähig gemacht

Der erste Bereitstellungsversuch von Prompt 13 ist bei Vercel mit „Deployment failed“ gescheitert (GitHub-Status des Commits `3fbcc4f`). Ursache zweifach in `apps/web/vercel.json`: der neu eingeführte stündliche Cron-Zeitplan (`0 * * * *`) und die Regionsvorgabe `"regions": ["fra1"]` sind beides Pro-Funktionen, die im Hobby-Tarif die gesamte Bereitstellung scheitern lassen (nicht nur den einzelnen Punkt).

**Auf Wunsch des Auftraggebers testweise auf Hobby angepasst:** Cron auf **einmal täglich, 06:00 UTC** (`"0 6 * * *"`) gestellt, Regionsvorgabe entfernt. Das unterschreitet die 12-Stunden-Versandzusage (im ungünstigsten Fall fast 24 Stunden Verzug) und ist ausdrücklich eine **Testkonfiguration zum Prüfen der Bereitstellung** – **für die Live-Version muss dies neu angepasst werden** (Vercel Pro mit stündlichem Cron, oder externer Zeitplaner plus Entfernen des `crons`-Blocks; beide Wege in docs/DEPLOY-VERCEL.md Abschnitt 4 beschrieben). Bis dahin bezahlte Bestellungen zeitnah unter `/admin` von Hand freigeben, damit die 12-Stunden-Zusage trotzdem eingehalten wird.
- [ ] Anwaltliche Abnahme des Prompt-13-Pakets (LEGAL-OPEN **Nr. 22**: Durchsetzungsstruktur/RDG, 30.000-€-Schwelle, 12-h-Zusage, Entfall der Rechtsberatungs-FAQ, Kundenstimmen-Originale, Konditionen, Datenschutz-Ergänzungen).

## Stand 28.09.2026 – Prompt 14: Startseite mit Verkehrsampel, Funnel in 11 Schritten, Gutachten, Postversand

Prompt 14 (Upload 28.09.2026) ändert Prompt 12 und 13, wo sie sich widersprechen; sonst gelten beide weiter. Vollständig umgesetzt (Reihenfolge des Prompts):

**0. Entscheidungen:**
- [x] **Ampel nur noch auf der Startseite** (`components/AmpelKarte.tsx`): vier Felder mit Info-Symbol, die Verkehrsampel springt 400 ms nach der letzten gültigen Eingabe an (`/api/vorschau`, zustandslos); keine zweite Ampel, keine Ergebnis-Seite in der Privatkunden-Variante (`/rechner/ergebnis` → `notFound`, nur Kanzlei-Variante). Der grüne Knopf setzt `startAmpel` und übernimmt die vier Werte; `/rechner` ohne Startseiten-Ampel zeigt „Erst die Ampel, dann der Rechner“.
- [x] **Versicherung für Rechtskosten überall entfernt** (Funnel, /durchsetzung-Formular und -API, E-Mails, Konditionen-Platzhalter, Docs); Test scannt das ganze Repo (Ausnahmen: Quellentitel in `data/`, Prompt-Archiv).
- [x] **Postversand als kostenlose Zusatzoption** (2–7 Werktage, `config/business.ts` `POST_VERSAND`): Häkchen in Schritt 11, Metadatum `post`, Druckvorlage (Deckblatt mit Anschrift, Gutachten, Beileger) beim Versand als Druckauftrag an info@, Admin-Spalte „Post“ mit gedruckt/versendet + Datum, `/api/admin/druck` zum erneuten Erzeugen, CSV-Spalten `post`/`post_am`; Kosten je Sendung `null` bis Angebot (`[[DRUCKDIENST]]`).
- [x] **Kaufknopf grün** `#1B7D45` (Hover `#155F35`, weiß 19 px fett; Kontrast 5,16:1 bzw. 7,72:1 in `docs/DESIGN.md`), Text „Detailliertes Gutachten bestellen · 89 €“, darunter „Innerhalb von 12 Stunden per E-Mail. Auf Wunsch zusätzlich per Post, kostenlos.“
- [x] **Kein Streichpreis** (Test auf 119/`<s>`/`line-through` in den Preisbausteinen); Preisblock nach Abschnitt 4 (`lib/preisblock.ts`): Anrechnungszeile nur mit `PREIS_ANRECHNUNG`, Vergleichssatz nur mit Quelle in `docs/QUELLEN.md` (Q-01: **kein Beleg → gestrichen**).
- [x] **Produktname „Gutachten“** (`config/brand.ts`): Website, Funnel, E-Mails („Ihr Gutachten ist da“), Rechtstexte, Stripe (Produkt, Rechnung), Bericht mit Unterzeile auf Seite 1 („Automatisierte versicherungsmathematische Auswertung … – kein Sachverständigengutachten.“), `/bericht` → `/gutachten` (Redirect); Wording-Test gedreht: „Gutachten“ erlaubt, verboten „Sachverständigengutachten“ (außer verneint), „öffentlich bestellt“, „vereidigt“, „staatlich anerkannt“, „Prüfbericht“.
- [x] Videocall-Satz dezent (FAQ, /durchsetzung, letzte Zeile der Gutachten-Mail; `NEXT_PUBLIC_VIDEOCALL_URL`, sonst Platzhalter); Bilder als Stimmungsbilder mit Platzhalterrahmen bis Lizenz (`docs/LIZENZEN.md`); Geschichten (`data/stories.json`, `docs/GESCHICHTEN-LEITFADEN.md`) nur mit Freigabe, sonst ausgeblendet.

**1. Startseite** (`app/page.tsx`): Hero links Vorzeile, H1 „Der Rückkaufswert ist nicht das letzte Wort.“, Unterzeile, Erklärvideo-Platzhalter 16:9 (`docs/VIDEO.md`, Drehbuch 85 s), „Jetzt prüfen“, Mikrozeile „Ampel kostenlos · Gutachten 89 € · in 12 Stunden per E-Mail“; rechts Ampel-Karte. Verkehrsampel als Inline-SVG (`components/Ampel.tsx`, Variante `verkehr`: Gehäuse `#1E2A33`, Blende, Mast; 120×300 / 96×240; matt `#3A4A55`; Glow 45 % Alpha, 300 ms, reduced-motion; Grau mit Salbei-Rahmen und Etikett). Hilfetexte „Wo finde ich das?“ (`content/hilfetexte.ts`, zehn Texte wörtlich; Info-Fenster mit schematischer Skizze `components/Skizze.tsx`; im Funnel als aufklappbare Zeile). Sektion „Das steckt in Ihrem Gutachten“ (Seite 1 des Musterfalls links, sechs Punkte, Schlusszeile). Zwei Stimmungsbild-Platzhalter (Ruhestand bei „Wir übernehmen“, Enkel bei „Verkaufen statt kündigen“) – nie neben Kundenstimmen, Geschichten oder Beträgen (Test). FAQ mit acht Fragen (neu: „Bekomme ich das Gutachten auch auf Papier?“).

**2. Funnel** (`lib/draft.ts`, `components/funnel/*`): elf Schritte (Vertragsart, Status, Versicherer, Vertragsbeginn, erster Monatsbeitrag, Dynamik, Beitragssumme, Rückkaufswert, Auszahlungen, Über Sie, Ihre Bestellung), „Schritt x von 11“, je Schritt Frage + Hilfesatz + „Wo finde ich das?“. „Weiß ich nicht“ überall außer beim Rückkaufswert; jede solche Antwort als „Annahme: …“ im Gutachten-Kasten „Ihre Angaben und unsere Annahmen“ (Vertragsart → Kapital-LV + Rückfrage per E-Mail; Beginn ungefähr → Jahresmitte; Beitrag unbekannt → aus Beitragssumme, sonst „bitte in der Police nachsehen“; Schalter „heutiger Beitrag“; Dynamik/Auszahlungen unbekannt → ohne). Status gekündigt/ausgezahlt beendet den Funnel mit dem Rot-Text. Schritt 10 „Über Sie“ (Anrede, Vor-/Nachname, Geburtsdatum → Eintrittsalter für den Risikoanteil, Straße, PLZ, Ort, E-Mail, Telefon optional). Schritt 11: änderbare Zusammenfassung, Preisblock, Post-Häkchen, Einwilligungen (Datenschutz; digitaler Inhalt mit Erlöschen des Widerrufsrechts), grüner Knopf „Zahlungspflichtig bestellen · 89 €“ → Stripe Checkout; Danke-Text mit E-Mail-Adresse und ggf. Post-Satz. „Später weitermachen – Link per E-Mail“ ab Schritt 3.

**3. Gutachten** (`apps/report`): Annahmen-Kasten nach den Vertragsdaten; letzte Seite oben „Nächster Schritt: Wir übernehmen.“, darunter „Verkaufen statt kämpfen“ mit renten-rettung.de/verkaufen (Wortlaut gemeldet, TEXT-REVIEW Nr. 23); Druckvorlage `renderDruckvorlageHtml` (A4 beidseitig: Deckblatt mit Anschriftfeld, Seiten, einseitiger Beileger). Beispiele regeneriert: `examples/Gutachten_BSP-2026-{A,B,C}_2026-09-28.{html,pdf}` + `…B…_Druck` (C mit Annahmen-Kasten); `public/bericht-vorschau.png` aus Musterfall B.

**Backend:** `lib/zahlung.ts` (Produkt „Gutachten“, `post`-Metadatum, `post_status=gewuenscht` am PaymentIntent), `lib/erfuellung.ts` (Gutachten-Daten zentral in `gutachtenDaten`, Druckvorlage, Rückfrage-Mail bei unbekannter Vertragsart, Kennzeichen „Vertragsart unbekannt – Rückfrage per E-Mail“ und „Annahmen: n“, Druckauftrag, Marker `post`/`postAm`, Lead-Status „Gutachten gekauft“), `lib/emails.ts` (neu: `rueckfrageVertragsart`, `druckauftrag`; `ergebnisLink` entfernt), `/api/bestellung` prüft `pruefeBestellung(draft)` inkl. Person, `/api/admin/post`, `/api/admin/druck`, `/api/ergebnis-link` = Weitermachen-Link.

**Abnahme (Prompt 14, §6):** alle Punkte als Tests (`apps/web/test/prompt14.test.ts`, angepasste `wording/ampel/textbudget/draft/bestellung/erfuellung`-Tests, `apps/report/test/template.test.ts`): Ampel hochkant und Anspringen bei vier Feldern; Kaufknopf grün nur Grün/Gelb; Info-Fenster mit Skizze an allen zehn Feldern; elf Schritte, „Weiß ich nicht“ außer Rückkaufswert, Übernahme der vier Werte, Ende in Stripe Checkout, keine zweite Ampel/Ergebnis-Seite; kein Vorkommen des Kostenschutz-Begriffs im Repo außer Git-Historie/Allowlist; kein Streichpreis; Gutachten mit Annahmen-Kasten, letzter Seite und Druckvorlage; Post-Option, Admin-Spalte, Beileger; Video-Platzhalter, `docs/VIDEO.md`, Videocall-Satz mit Konfigurations-Link; Kundenstimmen/Geschichten nur freigegeben. **Typecheck, 196 Tests, Build grün.**

**Gemeldete Abweichungen und offene Punkte (Prompt 14):**
- [ ] „Verkaufen statt kämpfen“: Deck-Wortlaut „Wir kaufen … an“ durch „… können verkauft werden – mit einem Angebot …, das wir für Sie organisieren“ ersetzt (Renten-Rettung kauft nicht selbst; TEXT-REVIEW Nr. 23, LEGAL-OPEN Nr. 23g) – Deck-Fassung einsetzbar, sobald ein Ankauf im eigenen Namen bestätigt ist.
- [ ] Preisvergleichssatz gestrichen, bis ein Beleg in `docs/QUELLEN.md` (Q-01) liegt; Anrechnungszeile wartet auf `NEXT_PUBLIC_PREIS_ANRECHNUNG`.
- [ ] `[[DRUCKDIENST]]` (Druck- und Versanddienstleister mit AV-Vertrag) auswählen, `postKosten.jeSendungEur` aus dem Angebot eintragen, Datenschutzerklärung (Platzhalter) konkretisieren; bis dahin Druck von Hand aus dem Druckauftrag.
- [ ] Bilder lizenzieren (`docs/LIZENZEN.md`), Erklärvideo produzieren (`docs/VIDEO.md`), Videocall-Buchungstool wählen (`NEXT_PUBLIC_VIDEOCALL_URL`).
- [ ] Anwaltliche Abnahme des Prompt-14-Pakets (LEGAL-OPEN **Nr. 23**: Produktname „Gutachten“, Preisblock, Postversand/Beileger, Datenerhebung Schritt 10, Einwilligungstexte Schritt 11, Rückfrage-Mail, Verkaufen-Wortlaut, Videocall/RDG, Bilder/Video, Geschichten). Beta bleibt noindex + Passwort.
- [ ] Vercel-Hobby-Cron weiterhin nur täglich (Stand 25.09.2026 (3)) – für die 12-Stunden-Zusage Pro-Tarif oder externer Zeitplaner.

**Nachtrag 28.09.2026 (Prüfung der Seiten-Tour):** Im Musterfall-Gutachten wurde der Kasten „Verkaufen statt kämpfen“ auf der vorletzten Seite über den Seitenumbruch geteilt, und „Nächster Schritt: Wir übernehmen“ stand unten statt – wie in Prompt 14, 3 verlangt – oben auf der letzten Seite. Behoben in `apps/report/src/template.ts`: der Übernahme-Kasten beginnt jetzt die letzte Seite (`break-before: page`), Übernahme-, Verkaufen-, Annahmen- und Rechtshinweis-Kasten sind nicht mehr teilbar; die festen Seitenverweise „Seite 7“ / „Kasten unten“ heißen jetzt „letzte Seite“. Test ergänzt, Beispiele `examples/Gutachten_BSP-2026-*` regeneriert.

## Stand 29.09.2026 – Ultracode-Code-Prüfung: 122 bestätigte Funde behoben

Auftrag: „überprüfe den gesamten code auf fehler und korrigiere diese“. Ablauf: Workflow mit 13 Lesern über alle Pakete, adversarische Gegenprüfung je Fund (drei Prüfer), zweite Runde für ungelesene Dateien und Querschnittslinsen; danach Umsetzung aller bestätigten Funde, neue Tests, Doku, adversarisches Gegenlesen des Diffs. Ergebnis der Prüfung: **122 bestätigt** (3 hoch, 40 mittel, 79 niedrig), 4 unklar (nur gemeldet), 5 widerlegt, 9 Duplikate. **Typecheck aller Pakete, 232 Tests in 24 Dateien, Build grün.**

**Hoch (behoben):**
- Upload `/durchsetzung`: Grenzen kollidierten mit dem 4,5-MB-Body-Limit von Vercel → höchstens 5 Dateien, zusammen 4 MB, Typ per Dateikopf (PDF/JPEG/PNG) statt Client-MIME; abgelehnte Dateien werden benannt (422), 413 wird erklärt.
- Weitermachen-Link setzte die Datenschutz-Einwilligung in Schritt 11 voran → die vier Einwilligungen reisen nie im Link mit und werden beim Lesen immer auf `false` gesetzt; Link-Häkchen ist eine eigene Einwilligung (`linkEinwilligung`) für den Versand.
- „Heutiger Beitrag“ + Dynamik wurde doppelt dynamisiert → Rückrechnung auf den ersten Beitrag über die bisherigen Erhöhungstermine (gleiche Zählung wie der Rechenkern), „Weiß ich nicht“ gewinnt gegen einen vorher eingetippten Wert.

**Rechenkern (calc.version 0.3.0):** Verträge vor 1994 bekommen Abschlusskosten mit dem frühesten hinterlegten Höchstzillmersatz (40 ‰, gültig ab 1994) statt 0 – Näherung, anspruchsmindernd, Warnung `ZILLMER_NAEHERUNG` (Musterfall C Basis jetzt 35.635,00 € € erstattungsfähig, 55.905,02 € € Nutzungen, 91.540,02 € € Rückabwicklungswert; Golden (a)/(b) unverändert); Status „abgelaufen“ rechnet die Ablaufleistung im Feld `rueckkaufswert` wie den Rückkaufswert bei Kündigung gegen; Plausibilitätsprüfung ohne Fehlalarm bei negativer Zinsreihe; gleiche Erst-/aktuelle Beiträge bei aktiver Dynamik → 0 % mit Warnung `DYNAMIK_OHNE_ERHOEHUNG` statt „nicht verwertbar“; alle Annahme-/Warntexte de-DE (neue `packages/calc/src/format.ts`, auch Beschriftungen `VERTRAGSART_TEXT`/`STATUS_TEXT`/`ZAHLWEISE_TEXT` für das Gutachten); `VERWALTUNG_FALLBACK` zählt Kalenderjahre.

**Eignungs-Check (0.3.0, Regelwerk 0.2.0):** Jahresangaben („nur Jahr bekannt“) lassen die Grenzjahre 1994/2004 offen (Jahresmitte im Vergleich; Dez-2004-Kappung nur bei 14-Tage-Belehrung); globale Ausschlüsse (Risiko-LV, abgetreten) greifen auch vor 1994; Fehlerregeln nur bei `belehrungVorhanden = ja`; drei neue Regeln für Frist „andere/unbekannt“ und Form „unbekannt“ (Gewicht unbekannt, Dokument nachfordern); Regelwerk versioniert und datiert.

**Gutachten:** deutsche Begriffe statt Codes in „Ihre Angaben“; Abschnitts- statt Seitenverweise (Deckblatt verschob alle Seiten); Szenario-Diagramm zeigt Netto-Werte (Basis − Rückkaufswert = Mehrwert-Balken), Platz für siebenstellige Beträge; bei Rot/Grau „Nächster Schritt: anwaltliche Beratung“ statt Übernahme-Angebot (Kasten, Schrittliste, Deckblatt); Beileger und Deckblatt-Satz nur mit Ankauf-Hinweis (Kanzlei-Variante ohne); Beendet-Satz statt „mangels Angabe“; Musterfall B ohne falsche „Branchendurchschnitt“-Angabe; `CHROMIUM_PATH` leer = Standard; Vorschau-Skript nutzt `findeChromium` (kein `CHROMIUM_PFAD` mehr); `pnpm --filter @rueckab/report schriften` existiert; `scripts/` im Typecheck. Beispiele und `public/bericht-vorschau.png` regeneriert.

**Website/Funnel:** Startseiten-Karte mit DM/Euro-Wahl vor 2002, Bereichshinweis außerhalb 1980–2020, abgebrochene Vorschau-Anfragen (AbortController), ehrlicher Datenschutzsatz; Statuswechsel löscht ein altes Datum; Währung folgt einem korrigierten Beginn; Fondsverträge bekommen in Schritt 1 den Anfrage-Hinweis; Fokus wandert zur neuen Frage; Felder mit leerem Label haben `aria-labelledby`; „Angaben auf diesem Gerät löschen“; Weitermachen-Link zeigt echte Fehler (429/422); Direkteinstieg `/bestellen` endet bei beendeten Verträgen im Rot-Schritt; Frage 5 „Wie hoch war der erste Beitrag?“ mit Begriff je Zahlweise; Hilfetext für die Startseite ohne Verweis auf fehlende Schalter; Dynamiksatz „5 %“ lesbar; Geburtsdatum strikt ISO mit klarer Meldung; Feldlängen begrenzt (Stripe-Metadaten); Zusammenfassung ohne stehengebliebenes Datum; Mindestgrenze der Ampel aus `config/ampel.ts`; Versicherer-Kürzel (AXA, HDI, LVM, HUK, R+V, DBV) und Bindestrich/Leerzeichen werden zugeordnet; Startseite „… wert sein könnte – als Schätzung mit Bandbreite“ statt „auf den Euro“; Versichererseiten mit dynamischer Bildunterschrift (echte Quellen und Lücken), Nullachse für negative Werte, Quellenangaben als Anzeigetitel ohne Behördennamen; Rechtsseiten: Widerrufsbelehrung/AGB ohne „Modell noch offen“, Datenschutz mit Weitermachen-Link, Ampel-Anfrage und vollständigen Stripe-Metadaten-Kategorien (zur Abnahme, LEGAL-OPEN Nr. 24).

**Backend:** Admin-Anmeldung per Formular und HttpOnly-Cookie (HMAC-Ableitung, zeitkonstante Vergleiche) – das Passwort steht in keiner URL mehr; Cron akzeptiert nur `Authorization: Bearer <CRON_SECRET>` oder die Admin-Sitzung; Cron-Fenster 30 Tage, älteste zuerst, `unbereit` erst nach Ablauf der Auto-Frist; Versand-Sperre `versand_begonnen_am` (10 Minuten) gegen Doppelversand durch Cron + Freigabe; Phase B rechnet mit dem Zeitpunkt der Phase A (kein Monatswechsel zwischen Plausibilisierung und Versand); Stichtag/„Erstellt am“/Code-Ablauf in Europe/Berlin; fehlender Marker nach Versand und fehlgeschlagener Druckauftrag werden intern gemeldet; Erstkunden-Fehlerpfad ohne Zahlungs-Mail und mit eigenem Rettungsweg; Vertragsbestätigung verspricht die Plausibilisierung nur, wenn sie stattfindet, und gibt die Kundenerklärung (§ 356 Abs. 5) wörtlich wieder; interner Fehlerhinweis nennt den Rettungsweg je Phase; Anrede gegen Relay-Missbrauch; nicht zugeordneter Versicherername erscheint als Kundenangabe im Gutachten; Protokoll-Modus nur lokal (auf Vercel ist `RESEND_API_KEY` Pflicht), Protokolldateien kollisionsfrei, `MAIL_ABSENDER` leer = Standard; `basisUrl()` fällt auf die Vercel-URL zurück; CSV mit BOM, Formel-Injektion entschärft, „Bezahlt“ aus dem Bestätigungs-Marker; Admin-Zeiten in Berliner Zeit; Basic-Auth mit UTF-8-Passwörtern und zeitkonstantem Vergleich; `ergebnis-link` verlangt die Link-Einwilligung und begrenzt den Namen.

**Daten und Skripte (data.version 0.5.1):** `bayern-versicherung-leben` heißt jetzt „Bayern-Versicherung Lebensversicherung AG (Versicherungskammer Bayern)“ – „die Bayerische“ ist ein anderer Versicherer und fällt bis zur eigenen Aufnahme auf den Branchendurchschnitt (offener Punkt); Einlagenzins 1991 = 2,83 (kaufmännische Rundung von 2,825, Regel in der Fundstelle); Fundstellen der Branchen-lfd.-Verzinsung mit echter Excel-Zeile statt „Zeile -1“; Changelog 0.5.0 nachgetragen; `import-branche-1980.ts` versioniert mit Changelog; `data-scans.ts` prüft das Berichtsjahr beider Lesungen gegen den Ordner und überschreibt keine vorhandenen Werte; `data/COVERAGE.md` regeneriert; `engines.node >= 22.6`.

**Tests:** neue Suiten `fortsetzen`, `admin`, `admin-liste`, `emails`, `berechnung`, `insurers-data`; Golden-Test leitet die Lückenjahre aus den Daten ab; Ampel-Pflichtfall 1986 mit fester Erwartung; Erstkunden-Test mit EK-Nummer; gemeinsame Helfer in `apps/web/test/helfer.ts` (keine doppelt laufenden Suiten mehr); Wording-Test fängt „steht/stehen Ihnen … zu“ und bezifferte Zusagen, scannt API-Routen, `erfuellung.ts`, `fortsetzen.ts` und die Quellenangaben aus `insurers.json`.

**Nur gemeldet (unklar, Entscheidung des Auftraggebers):**
- [ ] Gutachten-Kasten „Jede dieser Annahmen ist im Gutachten so gekennzeichnet“ – die Annahmen stehen im Kasten, aber nicht zusätzlich an den Zahlen; Satz ggf. auf „im Kasten aufgeführt“ ändern.
- [ ] Druckvorlage beim Duplexdruck: der Beileger kann auf der Rückseite der letzten Gutachtenseite landen (kein eigenes Blatt) – Leerseite einfügen oder einseitig drucken.
- [ ] FAQ „Danach melden wir uns.“ – es gibt keinen Schritt, der sich nach dem Gutachten von sich aus meldet (nur Antwort-Mail/Durchsetzung).
- [ ] Eintrittsalter im Geburtsmonat: der Tag des Geburtsdatums wird ignoriert (Alter im Geburtsmonat um ein Jahr zu hoch – wirkt nur auf das Risiko-Band).

**Bewusst nicht geändert (Designentscheidungen, dokumentiert):** Fortsetzen-Link bleibt unsigniert (ASSUMPTIONS Nr. 56); Höchstzillmersatz vor 1994 ohne Primärquelle nicht in `insurers.json` aufgenommen (Näherung im Code, LEGAL-OPEN Nr. 24g); „die Bayerische“ als eigene Gesellschaft ist ein registerfest zu prüfender Folgeschritt.
