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

- **Copy-Deck integriert:** Startseite komplett neu (Hero A/B/C per `NEXT_PUBLIC_HERO_VARIANTE`, Rückkaufswert-Schock, „Das ist keine Meinung. Das ist Rechtsprechung.“ mit BGH-Kachel (Az. IV ZR 76/11, sinngemäß), Musterfall-Kachel aus dem Rechenkern (vorsichtiges Szenario), Rot-Ehrlichkeits-Kachel, Tempo-Block, Zukunftsbild, Preis-Block mit Fußnote, Ankauf-Block, Deck-Transparenz-Kasten, FAQ im neuen Ton); Ampel-Texte nach Deck (Grün mit Größenordnungs-Zeile in Worten, Gelb „Knapp.“, Rot mit Verkaufs-Hinweis und Knopf „Ankaufsangebot ansehen“); Gegenposition-Block wieder sichtbar; Produktname durchgehend **„Prüfbericht“** (nie „Gutachten“); Knöpfe „Ja, ich will die Zahl. 89 €“ / „Genau wissen. 89 €“; E-Mails im neuen Ton inkl. „Drucken … zum Anwalt oder zur Rechtsschutzversicherung“.
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
- [ ] Freigabe-Dateien für Manfred/Ulla nach `docs/freigaben/` → `verified: true` (docs/freigaben/README.md).
- [ ] `[[ANSATZPUNKTE: von Jack/Kanzlei]]` in `config/ansatzpunkte.json` füllen (sonst bleibt der Kasten ungedruckt).
- [ ] Anwaltliche Abnahme des Prompt-12-Pakets (LEGAL-OPEN-QUESTIONS **Nr. 21**: Ampeldefinition/Schwellen, Rechtsweg-Satz, Methodikabsatz, Zeitraum 1980–2020 in der Werbung, Kundenstimmen, Website-Texte, SEPA, Anfrage-Formulare); Banner/Beta bleiben bis dahin.
- [ ] Branchen-Lücken 1981–84/1986–89 (Spuren in `data/DATA_REPORT.md`); `[[ANKAUF-PRIVAT]]`-Konditionen; Vercel-/Stripe-Einrichtung wie gehabt (docs/DEPLOY-VERCEL.md).
