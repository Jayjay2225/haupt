# Prompt-Set: Rückabwicklungs-Rechner & Kurzprüfung für Lebens- und Rentenversicherungen

Stand: 11.09.2026 · Gedacht für Claude Code (oder einen anderen Coding-Agenten). Die Prompts werden nacheinander im selben Repo ausgeführt; jeder baut auf den Artefakten des vorherigen auf. Prompt 0 gehört als `CLAUDE.md` ins Repo. `[MARKE]` überall durch deinen Markennamen ersetzen.

**Warum das Set anders rechnet als die EuroProf-Berichte:** In beiden Beispielen wird der volle Jahresbeitrag mit einer „Rohüberschussrendite" von 5,5–13,4 % p.a. aufgezinst – für Provinzial und Alte Leipziger mit identischer Zahlenreihe, also nicht versichererspezifisch. Die BGH-Rechtsprechung gewährt Nutzungen nur auf den Sparanteil, gemessen am tatsächlichen Kapitalanlageergebnis (Nettoverzinsung). Dieses Set baut deshalb die belastbare Variante: Sparanteil × versichererindividuelle Nettoverzinsung, drei Szenarien, jede Zahl mit Quelle. Das ist anwaltstauglich – und genau das, was die öffentlich verfügbaren Zahlen der Versicherer hergeben.

**Reihenfolge:** 0 Kontext → 1 Rechtsregeln → 2 Versichererdaten → 3 Rechenkern → 4 Eignungs-Check → 5 PDF-Bericht → 6 Website → 7 Review

---

## Prompt 0 – Projektkontext (als `CLAUDE.md` ablegen)

```
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
```

---

## Prompt 1 – Rechtsrahmen als Regelwerk

```
Recherchiere den Rechtsrahmen für die Rückabwicklung von Lebens- und Rentenversicherungen in Deutschland und fasse ihn als maschinenlesbares Regelwerk plus Dokumentation zusammen.

Ergebnis:
- `docs/LEGAL.md`: verständliche Zusammenfassung mit Fundstellen.
- `data/legal-rules.json`: Regeln, die der Eignungs-Check (Prompt 4) und der Rechenkern (Prompt 3) auswerten.
- `docs/LEGAL-OPEN-QUESTIONS.md`: alles, was ein Anwalt bestätigen muss.

Abzudecken:
1. Die drei Regime nach Vertragsschlussdatum und Vertriebsmodell:
   a) 29.07.1994–31.12.2007, Policenmodell → Widerspruch nach § 5a VVG a.F. (EuGH C-209/12 „Endress“; BGH IV ZR 76/11).
   b) 29.07.1994–31.12.2007, Antragsmodell → Rücktritt nach § 8 Abs. 4/5 VVG a.F. (BGH IV ZR 260/11 – prüfen).
   c) ab 01.01.2008 → Widerruf nach § 8 VVG n.F. mit Rechtsfolgen aus § 9 und § 152 VVG (in der Regel deutlich geringerer Anspruch – exakt darstellen).
2. Rechtsfolgen je Regime: Was wird zurückgezahlt (Beiträge abzüglich Risikoanteil)? Worauf werden Nutzungen geschuldet (Sparanteil; Abschluss- und Verwaltungskostenanteil nur bei Nachweis)? Maßstab der Nutzungen (Kapitalanlageergebnis/Nettoverzinsung)? Darlegungs- und Beweislast des Versicherungsnehmers und sekundäre Darlegungslast des Versicherers (BGH IV ZR 384/14, IV ZR 448/14, IV ZR 513/14, IV ZR 5/19). Aktenzeichen, Entscheidungsdaten und Leitsätze ausschließlich aus Primärquellen (bundesgerichtshof.de, curia.europa.eu) übernehmen und wörtlich zitierfähig ablegen.
3. Belehrungsfehler-Katalog mit Gewichtung: fehlende Belehrung; falsche Frist (z. B. 14 statt 30 Tage bei Lebensversicherungen nach der Gesetzesänderung Ende 2004); falsche Form (Schriftform statt Textform); fehlende drucktechnische Hervorhebung; fehlender Hinweis auf Fristbeginn und erforderliche Unterlagen; unvollständige Verbraucherinformationen. Einordnung „wesentlich“ vs. „geringfügig“ nach EuGH C-355/18 u. a. („Rust-Hackner“) und BGH IV ZR 353/21 (geringfügige Fehler → kein Lösungsrecht).
4. Verwirkung und Rechtsmissbrauch: welche Fallgruppen Gerichte anerkennen (z. B. Abtretung, Beleihung, bewusste Fortführung nach Kenntnis des Fehlers) und welche nicht (bloßer Zeitablauf, Kündigung, Beitragsfreistellung).
5. Gegenrechnung: Anrechnung erhaltener Leistungen (Rückkaufswert, Teilauszahlungen, Policendarlehen) samt Nutzungen des Versicherungsnehmers daraus; Zusatzversicherungen (BUZ = reiner Risikoanteil); Kapitalertragsteuer (nur Hinweis, keine Steueraussage); Verjährung der Rückabwicklungsansprüche nach erklärtem Widerspruch.
6. Was kein Fall ist: Verträge vor dem 29.07.1994, ordnungsgemäß belehrte Verträge, reine Risikolebensversicherungen, betriebliche Altersversorgung mit Sonderregeln – jeweils mit Begründung.

Format `legal-rules.json`: pro Regel {id, regime, bedingung (strukturiert), folge, gewicht, confidence (high/medium/low), quelle[]}. Nichts aus Sekundärquellen (Kanzlei-Blogs, Ratgeberseiten) ohne Abgleich mit der Primärquelle übernehmen.
```

---

## Prompt 2 – Versicherer-Datenbank

```
Baue den Datensatz `data/insurers.json` mit den öffentlich verfügbaren Kennzahlen aller deutschen Lebensversicherer, die seit 1994 Verträge geführt haben – einschließlich nicht mehr existierender Gesellschaften.

1. Stammdaten je Gesellschaft: kanonischer Name, frühere Namen, Rechtsnachfolger und Bestandsübertragungen mit Datum (z. B. Volksfürsorge / Aachener und Münchener → Generali Deutschland → Proxalto/Viridium; Hamburg-Mannheimer / Victoria → ERGO; Deutscher Herold → Zurich; Heidelberger Leben, Skandia → Viridium; Provinzial Rheinland → Provinzial). Ziel: Jeder Name, der auf einer alten Police stehen kann, wird eindeutig auf die Gesellschaft gemappt, deren Kapitalanlageergebnis im jeweiligen Jahr gilt.
2. Kennzahlen je Gesellschaft und Jahr 1994–2025:
   - Nettoverzinsung der Kapitalanlagen (Pflicht)
   - laufende Durchschnittsverzinsung
   - Abschlusskostenquote (% der Beitragssumme) und Verwaltungskostenquote (% der Bruttobeiträge)
   - deklarierte laufende Verzinsung / Gesamtverzinsung (nur für den Vergleich)
   - Rohüberschuss und dessen Verwendung nur nachrichtlich – nie als Zinssatz
3. Quellen in dieser Priorität, jede Zahl mit URL oder Dokument, Seite und Abrufdatum: Geschäftsberichte der Versicherer bzw. Bundesanzeiger; BaFin-Statistik der Erstversicherungsunternehmen (Einzelunternehmenstabellen, davor BAV-Jahresberichte); Kennzahlenseiten der Versicherer (Branchen-Kennzahlenkatalog); GDV-Statistiken; Fachpublikationen (Map-Report/Franke & Bornberg, Assekurata, Zielke Research, Morgen & Morgen) als Sekundärquelle mit Kennzeichnung. Für Jahre, die nicht online verfügbar sind (typisch vor ca. 2005): Beschaffungsweg dokumentieren (Archiv, Bibliothek, Anfrage beim Versicherer) statt schätzen.
4. Branchendurchschnitt je Jahr (GDV/BaFin) als Fallback-Reihe mit Quelle.
5. Referenzzinsen je Jahr: Einlagenzins privater Haushalte / Spareinlagenzins (Bundesbank MFI-Zinsstatistik) für die Gegenverzinsung erhaltener Auszahlungen; Basiszinssatz nach § 247 BGB.
6. Qualitätsregeln: `source_type` (primary / secondary / estimate), `confidence`, Plausibilitätsprüfung (Nettoverzinsung außerhalb −2 bis 9 % → Warnung und manuelle Prüfung), Vollständigkeitsreport `data/COVERAGE.md` (welche Gesellschaft/Jahr fehlt, welche Quelle noch beschafft werden muss).
7. Ein wiederholbares Skript `scripts/update-insurers.ts`, das neue Jahrgänge nachträgt, plus Änderungshistorie (`data.version`).

Beginne mit den 25 größten Gesellschaften nach Bestand sowie allen Run-off-Plattformen, dann der Rest. Lege je Gesellschaft fest, welche Reihe das Basis-Szenario speist (Nettoverzinsung) und welche das Min-Szenario (je Jahr der niedrigere Wert aus Nettoverzinsung und laufender Durchschnittsverzinsung).
```

---

## Prompt 3 – Rechenkern

```
Implementiere das Paket `packages/calc` (TypeScript, reine Funktionen, keine I/O) mit Spezifikation in `docs/CALC-SPEC.md` und vollständigen Tests. Erst Spezifikation und Testfälle vorlegen, dann implementieren.

Eingaben (`ContractInput`): Versicherer-ID aus insurers.json, Vertragsart, Vertragsbeginn, Vertragsende, Beitragszahlung von/bis, Zahlweise, Erstbeitrag (EUR oder DM), aktueller Beitrag, Dynamik (ja/nein, Satz, ausgesetzte Jahre), Gesamtsumme laut Standmitteilung (optional), Status (laufend / beitragsfrei seit / gekündigt am / abgelaufen am), aktueller Rückkaufswert, erhaltene Auszahlungen [{datum, betrag}], Policendarlehen, Zusatzversicherungen (BUZ-Beitragsanteil), Eintrittsalter, Stichtag (Widerspruchsdatum oder heute), Szenario-Overrides.

Rechenlogik auf Monatsbasis:
1. Beitragsreihe monatsgenau aufbauen: Zahlweise, Dynamik ab dem zweiten Vertragsjahr, DM→EUR mit 1,95583 bis 31.12.2001. Liegt eine Gesamtsumme laut Mitteilung vor, Reihe proportional darauf skalieren; Abweichung über 5 % als Warnung ausgeben.
2. Jeden Beitrag aufteilen:
   - Risikoanteil: aus Vertragsunterlagen, sonst pauschal nach Vertragsart und Eintrittsalter (`data/risk-defaults.json` mit Quelle und Begründung; BUZ-Beiträge zu 100 %).
   - Abschlusskostenanteil: Zillmerung nach DeckRV (Höchstzillmersatz des jeweiligen Jahres, ab 2008 auf fünf Jahre verteilt), gedeckelt durch die Abschlusskostenquote des Versicherers.
   - Verwaltungskostenanteil: Verwaltungskostenquote des Versicherers im jeweiligen Jahr.
   - Sparanteil = Rest.
3. Nutzungen: Sparanteil vom Zahlungsmonat bis zum Stichtag mit dem Jahressatz des Szenarios monatlich aufzinsen (r/12). Sätze aus insurers.json unter Beachtung der Rechtsnachfolge; fehlende Jahre → Branchendurchschnitt, markiert.
   - Min: niedrigerer Wert aus Nettoverzinsung und laufender Durchschnittsverzinsung, Risikoanteil am oberen Rand, keine Nutzungen auf Kostenanteile.
   - Basis: Nettoverzinsung, Risikoanteil Mittelwert, keine Nutzungen auf Kostenanteile.
   - Max: Nettoverzinsung, Risikoanteil am unteren Rand, Nutzungen zusätzlich auf den Verwaltungskostenanteil – als vertretbare Obergrenze begründen.
4. Bereits erhaltene Leistungen (Rückkaufswert bei gekündigtem Vertrag, Teilauszahlungen, Darlehen) abziehen, jeweils mit Gegenverzinsung zum Referenzzins vom Auszahlungsdatum bis zum Stichtag.
5. Ergebnis je Szenario: erstattungsfähige Beiträge, Nutzungen, Rückabwicklungswert, abzüglich erhaltener Leistungen = Nettoanspruch. Bei laufendem Vertrag zusätzlich „Mehrwert gegenüber Kündigung“ = Rückabwicklungswert − aktueller Rückkaufswert, und ein Hinweis, was mit dem Widerspruch aufgegeben wird (Garantiezins, Versicherungsschutz, Ablaufleistung).
6. Ausgabe (`CalcResult`): Jahrestabelle (Beitrag, Risiko, Abschluss, Verwaltung, Sparanteil, Zinssatz mit Quelle, Nutzungen, kumuliert), alle Szenarien, Annahmenliste, Datenherkunft, Warnungen, `calc.version`, `data.version`.

Tests:
- Unit-Tests je Schritt. Property-Tests: höherer Zinssatz → höhere Nutzungen; ohne Kosten und Risiko entspricht das Ergebnis der Annuitätenformel; Skalierung der Beitragsreihe verändert Verhältnisse nicht.
- Golden-Tests mit zwei Beispielverträgen: (a) private Rentenversicherung, Beginn 12/2004, 1.200 € jährlich, 25.600 € eingezahlt, laufend, Rückkaufswert 39.857 €; (b) Lebensversicherung, Beginn 10/1995, Dynamik, 439.455 € eingezahlt, laufend, Rückkaufswert 310.658 €. Dokumentiere alle drei Szenarien und bewerte, ob ein Mehrwert entsteht. Für (a) erwarte ich, dass das Basis-Szenario nahe am oder unter dem Rückkaufswert liegt – das Tool muss dann „wirtschaftlich kein Vorteil erkennbar“ ausgeben.
- Plausibilitätsgrenzen: Nutzungen in % der Beiträge außerhalb der aus den Datenreihen ableitbaren Bandbreite → Test schlägt fehl.
```

---

## Prompt 4 – Eignungs- und Belehrungs-Check

```
Implementiere `packages/eligibility`: einen fragebogengestützten Vorab-Check, der aus `data/legal-rules.json` eine Ampel (grün / gelb / rot) mit Begründung erzeugt.

Fragen (maximal acht, für Laien verständlich, mit Erklärtexten und Beispielabbildungen aus eigenem Design): Vertragsschlussdatum; Vertragsart; Zustandekommen des Vertrags (Antrag unterschrieben, Police und Unterlagen erst später erhalten = Policenmodell / alle Unterlagen bei Antragstellung erhalten = Antragsmodell / unbekannt); Belehrung über Widerspruchs-, Rücktritts- oder Widerrufsrecht vorhanden? (Upload oder Foto der Police, sonst Auswahl); Frist und Form laut Belehrung; drucktechnische Hervorhebung; Status (laufend / beitragsfrei / gekündigt / abgetreten / beliehen); erhaltene Auszahlungen.

Logik: Regime bestimmen → Belehrungsfehler bewerten (wesentlich / geringfügig / unbekannt) → Verwirkungsindikatoren → Ampel. „Unbekannt“ führt nie zu grün, sondern zu gelb mit klarer Angabe, welches Dokument gebraucht wird. Jede Begründung nennt die Regel-IDs aus legal-rules.json.

Optionaler Baustein: Belehrungstext aus der hochgeladenen Police per OCR/Vision extrahieren und gegen den Fehlerkatalog prüfen – Ergebnis immer nur als „Hinweis, anwaltlich zu prüfen“.

Wording-Regel: Die Ausgabe trifft keine Rechtsaussage im Einzelfall („Ihr Widerspruch ist wirksam“ ist verboten), sondern ordnet ein („Die Belehrung weist Merkmale auf, die Gerichte als wesentlich bewertet haben“).

Tests mit mindestens zwölf Konstellationen: je Regime mit und ohne Fehler, geringfügiger Fehler, Verwirkungsfall, Vertrag vor 1994, unbekannte Belehrung, Vertrag ab 2008 mit ordnungsgemäßer Belehrung.
```

---

## Prompt 5 – PDF-Kurzprüfung

```
Erstelle den Berichtsgenerator `apps/report`: HTML-Template → PDF via Playwright. Eingabe = CalcResult + Eligibility-Ergebnis + Kundendaten. Eigenes Design für [MARKE] (Farben, Typografie, Logo aus `brand/`), nicht an fremde Berichte angelehnt.

Aufbau (sieben Seiten; Kopfzeile mit Aktenzeichen, Name, Datum, Seite x von 7):
1. Deckblatt: „Geschätzter Rückabwicklungswert (Basis-Szenario)“ als Hauptzahl, darunter die Spanne Min–Max, der aktuelle Rückkaufswert zum Vergleich und ein Satz, ob ein Mehrwert erkennbar ist. Ampel des Eignungs-Checks.
2. Grundlage und Einordnung: Zweck, Regime des Vertrags, die zwei bis drei einschlägigen Entscheidungen mit korrektem Aktenzeichen und wörtlichem Leitsatz aus legal-rules.json, was der Bericht ist und was nicht.
3. Ihre Angaben: alle Eingaben tabellarisch, DM-Umrechnungshinweis, Aufforderung zur Prüfung auf Richtigkeit.
4. Methodik: Aufteilung des Beitrags als Grafik (Risiko / Abschluss / Verwaltung / Sparanteil), Aufzinsung in Worten und als Formel, verwendete Zinsreihe mit Quelle je Jahr, Definition der drei Szenarien, alle Annahmen und Vereinfachungen mit erwarteter Abweichung.
5.–6. Jahresweise Aufschlüsselung (Basis-Szenario) und Gesamtrechnung: Beiträge − Risikoanteil + Nutzungen = Rückabwicklungswert; abzüglich erhaltener Leistungen inkl. Gegenverzinsung = Nettoanspruch; Vergleich mit dem Rückkaufswert. Die Kennzahl „Nutzungen in % der Einzahlungen“ nur mit der Zinsreihe daneben, nie als Schlagzeile.
7. Einordnung und nächste Schritte: Balkendiagramm Rückkaufswert vs. Min / Basis / Max. Vergleich mit Alternativanlagen nur, wenn echte historische Indexreihen (Bundesanleihen-Index, DAX, MSCI World net in EUR) über exakt den Vertragszeitraum verwendet werden – keine pauschalen Durchschnittsrenditen. Hinweise zu Steuer, Verlust von Garantiezins und Versicherungsschutz, Verjährung. Empfohlene nächste Schritte (benötigte Unterlagen, anwaltliche Prüfung). Disclaimer: keine Rechtsberatung im Sinne des RDG, Schätzung mit Bandbreite, Datenstand, `calc.version` / `data.version`.

Anforderungen: de-DE-Formate, barrierearme Tabellen, PDF/A-2b, Dateiname `Kurzpruefung_[AZ]_[Datum].pdf`, Personendaten in Logs maskiert. Erzeuge Beispielberichte für beide Golden-Test-Verträge und lege sie unter `examples/` ab.
```

---

## Prompt 6 – Website und Funnel

```
Baue `apps/web` (Next.js) für [MARKE].

Seiten: Startseite (Nutzenversprechen ohne Zahlenversprechen, Ablauf, Preis bzw. Modell, FAQ, Über uns); Rechner-Formular; Ergebnis-Seite; Versicherer-Seiten `/lebensversicherung/[versicherer]` programmatisch aus insurers.json (Kennzahlen, Nettoverzinsungsverlauf als Chart, Rechtsnachfolge, CTA) für SEO; Impressum, Datenschutz, AGB, Widerrufsbelehrung.

Rechner-Formular (mehrstufig, mobil-first, Zwischenspeicherung): Kontakt (E-Mail, Name, Telefon optional) → Vertrag (Versicherer mit Autocomplete inkl. Altnamen, Vertragsart, Beginn/Ende, Status) → Beiträge (Erstbeitrag EUR/DM, aktueller Beitrag, Zahlweise, Dynamik, Gesamtsumme laut Standmitteilung, Beitragszahlung bis) → Werte (Rückkaufswert, Auszahlungen, Darlehen) → Fragen des Eignungs-Checks → Upload Police/Standmitteilung (optional, mit OCR-Vorbefüllung) → Einwilligungen (DSGVO, AGB, Widerrufsbelehrung bei kostenpflichtigem Angebot) → Zusammenfassung → Absenden. Rechtsschutz- und Bankdaten nur abfragen, wenn das Geschäftsmodell sie braucht, und nie im ersten Schritt.

Modell-Schalter in `config/business.ts` – alle drei anlegen, per Konfiguration aktivieren:
A) Kurzprüfung gegen Festpreis (Zahlung vor Erstellung, Rechnung per E-Mail).
B) Kostenlose Vorschau (Ampel und Spanne) + Weitergabe an Partnerkanzlei nur mit ausdrücklicher Einwilligung.
C) B2B-Zugang für Kanzleien und Versicherungsberater mit eigenem Login, Mandantenverwaltung und White-Label-Bericht.

Ergebnis-Seite: Ampel, Spanne Min–Max, Vergleich mit Rückkaufswert, PDF-Download (bei Modell A nach Zahlung), nächste Schritte. E-Mails (Bestätigung, Bericht, Erinnerung) mit Double-Opt-in. Admin-Bereich: Fälle, Status, Bericht neu erzeugen, Datenexport, Löschung nach DSGVO.

Nichtfunktional: Hosting in der EU, Datenminimierung, Löschfristen, Liste der Auftragsverarbeiter, Rate-Limiting, Spam-Schutz, Consent-Management, keine Tracking-Cookies ohne Einwilligung, Ladezeit unter 2 s. Texte verständlich, ohne Superlative und ohne Erfolgsversprechen; jede Zahl auf der Startseite hat eine Quelle oder ist ein anonymisiertes Beispiel mit offengelegten Annahmen.
```

---

## Prompt 7 – Compliance- und Plausibilitäts-Review

```
Führe ein kritisches Review des gesamten Repos durch – nacheinander aus drei Rollen: (1) auf Versicherungsrecht spezialisierter Anwalt, (2) Wettbewerbsrechtler, (3) Versicherungsmathematiker der Gegenseite. Ergebnis in `docs/REVIEW.md` mit konkreten Fundstellen und Änderungsvorschlägen.

Prüfpunkte:
- RDG: Wo bewegt sich das Tool von der Berechnung in Richtung Rechtsdienstleistung (Belehrungsbewertung, Wörter wie „Anspruch“, „steht Ihnen zu“)? Welches Modell (A/B/C) ist am wenigsten riskant, und was muss vertraglich mit einer Kanzlei geregelt sein?
- UWG § 5: jede Zahl, Grafik und Aussage auf Website und im Bericht – belegt? irreführend (Vergleich mit Anlageklassen, Prozent-Schlagzeilen, nicht abgezogener Rückkaufswert, Beispielrechnungen ohne Annahmen)?
- § 34d GewO: Enthält die Kommunikation Beratung zum Umgang mit dem Vertrag (kündigen, behalten, beitragsfrei stellen)?
- DSGVO: Datenflüsse, Speicherdauer, Uploads, KI-OCR, Auftragsverarbeiter, Löschkonzept.
- Mathematik: Erstelle ein Gegengutachten für beide Beispielverträge, wie es ein Versicherer vorlegen würde, und benenne die angreifbarsten Annahmen des Basis-Szenarios. Das Ergebnis wird als Warnhinweis in den Bericht übernommen.
- Liefere überarbeitete Textbausteine (Disclaimer, Ergebnisformulierungen, Startseiten-Copy), die die gefundenen Probleme beheben.
```

---

## Vor Prompt 6 zu entscheiden

- Marke, Domain und Absender (welche GmbH).
- Geschäftsmodell A, B oder C – bei B und C: welche Kanzlei bzw. welcher Versicherungsberater die rechtliche Bewertung übernimmt.
- Ob die Belehrungsprüfung Teil des Angebots ist oder nur die Berechnung (deutlich weniger RDG-Risiko).
- Anwaltliche Abnahme von `legal-rules.json` und aller Berichtstexte vor dem Go-live.
