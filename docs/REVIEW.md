# Compliance- und Plausibilitäts-Review (Prompt 7)

Stand: 18.09.2026 · Reviewgegenstand: gesamtes Repo (Commits bis `f3d6f2c`). Drei Rollen nacheinander; Fundstellen als Datei-Verweise. Als **[UMGESETZT]** markierte Änderungsvorschläge wurden im Zuge dieses Reviews direkt eingebaut; alles andere ist Entscheidungs- bzw. Kanzleivorbehalt.

---

## Rolle 1: Fachanwalt für Versicherungsrecht (RDG-Blick)

### 1.1 Wo bewegt sich das Tool Richtung Rechtsdienstleistung?

Rechtsdienstleistung (§ 2 Abs. 1 RDG) ist jede Tätigkeit in konkreten fremden Angelegenheiten, die eine rechtliche Prüfung des Einzelfalls erfordert. Kritisch sind drei Bausteine:

1. **Belehrungsbewertung im Eignungs-Check** (`packages/eligibility`, `data/legal-rules.json`): Die Zuordnung „wesentlich/geringfügig" ist eine abstrakte Regelanwendung, aber aus Nutzersicht eine Aussage über *seinen* Fall. Entschärfend wirken: (a) durchgängiges Einordnungs-Wording („Merkmale, die Gerichte als wesentlich bewertet haben"), per Test abgesichert (`packages/eligibility/test/eligibility.test.ts`, Wording-Test); (b) „unbekannt" nie grün; (c) jede Aussage mit Regel-ID statt Einzelfall-Subsumtion; (d) obligatorischer Verweis auf anwaltliche Prüfung. **Restrisiko bleibt**: Die Grenze zur unzulässigen Rechtsdienstleistung ist höchstrichterlich nicht trennscharf; die Ampel sollte vertraglich als von der Partnerkanzlei verantworteter Baustein abgesichert oder als bloße „Dokumenten-Checkliste" ohne Gewichtungsanzeige degradiert werden können (Schalter empfohlen, s. 1.3).
2. **Verjährungs- und Verwirkungshinweise** (`data/legal-rules.json` R-FOLGE-VERJAEHRUNG, R-VERW-*): als abstrakte Rechtsinformation zulässig; keine Fristberechnung im Einzelfall einbauen (derzeit nicht vorhanden – so belassen).
3. **Formulierungen**: Verbotene Muster („Anspruch", „steht Ihnen zu", Erfolgsgarantie) kommen weder auf der Website noch im Bericht vor (Tests in `apps/report/test/template.test.ts` und `packages/eligibility`). Der Bericht nennt konsequent „geschätzt", „unter Annahmen", „keine Rechtsberatung". ✔︎

### 1.2 Fundstellen mit Änderungsbedarf

| Fundstelle | Problem | Vorschlag |
|---|---|---|
| `apps/web/app/page.tsx` FAQ („… und macht sie effizienter") | unbelegte Effizienzbehauptung, zugleich Nähe zur Beratungsleistung | neutral: „bereitet sie vor" **[UMGESETZT]** |
| `apps/web/app/lebensversicherung/[versicherer]/page.tsx` CTA „Jetzt kostenlos prüfen" | „kostenlos" ist modellabhängig (Modell A wäre kostenpflichtig) → Irreführungs- und Pflegefehler-Risiko | modellneutral „Jetzt unverbindlich prüfen" **[UMGESETZT]** |
| `data/legal-rules.json` R-OK-BELEHRUNG (Ampel Rot) | Verneinung eines Lösungsrechts allein aus Nutzerangaben | Formulierung enthält bereits „auf dieser Grundlage nicht erkennbar" + Anwaltsvorbehalt; von Kanzlei abnehmen lassen (LEGAL-OPEN-QUESTIONS Nr. 12) |
| `docs/LEGAL.md` gesamt | Zitate überwiegend aus Spiegelquellen | Wort-für-Wort-Primärabgleich vor Go-live (Open Question Nr. 1); bis dahin Offenlegung im Bericht (vorhanden) beibehalten |

### 1.3 Modellwahl (A/B/C) aus RDG-Sicht

- **Am wenigsten riskant: Modell C** (B2B/White-Label): Die Kanzlei bzw. der Versicherungsberater erbringt die Bewertung selbst; das Tool ist reines Werkzeug. RDG-Risiko verlagert sich fast vollständig.
- **Modell B** (aktiv, kostenlose Vorschau): vertretbar, wenn (a) die Belehrungsbewertung als unverbindliche Vorprüfung gerahmt bleibt, (b) die Weitergabe nur mit ausdrücklicher Einwilligung erfolgt, (c) mit der Partnerkanzlei vertraglich geregelt ist: fachliche Verantwortung/Abnahme des Regelwerks, Haftung, Erlaubnisumfang, keine Erfolgsvergütungs-Kopplung des Tools, Datenfluss (AVV bzw. gemeinsame Verantwortlichkeit), Umgang mit „Rot"-Fällen.
- **Modell A** (Festpreis-Kurzprüfung an Verbraucher) trägt das höchste Risiko, sofern die Belehrungsbewertung Teil des bezahlten Produkts ist. Empfehlung: für Modell A die Belehrungsprüfung abschaltbar machen (nur Berechnung + Dokumentenliste) – vgl. `docs/PROMPTS.md`, Entscheidungsliste.

### 1.4 § 34d GewO (Versicherungsvermittlung/-beratung)

Kommunikation enthält keine Empfehlung, den Vertrag zu kündigen, beitragsfrei zu stellen oder zu ersetzen; der Bericht sagt ausdrücklich „keine Empfehlung, den Vertrag zu kündigen oder zu behalten" und listet auf, was bei Rückabwicklung aufgegeben würde. ✔︎ Beibehalten; künftige Marketingtexte gegen diese Linie prüfen.

---

## Rolle 2: Wettbewerbsrechtler (UWG § 5)

Prüfmaßstab: Eignung zur Täuschung relevanter Verkehrskreise; jede Angabe braucht Beleg.

1. **Startseite** (`apps/web/app/page.tsx`): keine Zahlen, keine Superlative, keine Erfolgsversprechen; Methodik-Abschnitt beschreibt bewusst die vorsichtige Rechenweise. ✔︎ Einzelfund FAQ-Effizienzsatz **[UMGESETZT]** (s. o.).
2. **Ergebnis-Vorschau** (`apps/web/components/funnel/ErgebnisAnsicht.tsx`): „geschätzt" unmittelbar am Wert, Spanne stets sichtbar, Rückkaufswert-Vergleich nie unterdrückt (auch das Negativ-Ergebnis „kein Vorteil erkennbar" prominent), Annahmen einsehbar, Versionsstände ausgewiesen. ✔︎ Ergänzt um die Gegenposition des Versicherers **[UMGESETZT]**, damit die Vorschau nicht einseitig wirkt.
3. **Bericht** (`apps/report/src/template.ts`): „Nutzungen in % der Beiträge" nur neben der Zinsreihe (Vorgabe eingehalten); kein Vergleich mit Anlageklassen (mangels echter Indexreihen korrekt weggelassen); Beispielberichte als „Musterfall (anonymisiert)" gekennzeichnet. ✔︎ Neu: Gegenposition-Warnblock **[UMGESETZT]**.
4. **Versicherer-Seiten** (`apps/web/app/lebensversicherung/`): Risiko, dass Branchenwerte als Unternehmenswerte gelesen werden. Vorhandene Hinweisbox und Quellen-Caption sind gut; zusätzlich wurde die Diagramm-Überschrift um „Branchendurchschnitt – kein Unternehmenswert" geschärft **[UMGESETZT]**. Rechtsnachfolge-Angaben tragen den Vermerk „wird registerfest verifiziert" – vor Go-live tatsächlich verifizieren, sonst streichen.
5. **Vorabversion**: Banner + `robots: noindex` verhindern, dass Entwurfs-Rechtstexte oder Platzhalter öffentlich wirken. Vor Livegang: Impressum/Datenschutz/AGB final, sonst Abmahnrisiko unabhängig von UWG § 5.

---

## Rolle 3: Versicherungsmathematiker der Gegenseite (Gegengutachten)

Auftrag: die Schätzung so angreifen, wie es ein Versicherer im Prozess täte. Ergebnis fließt als Warnhinweis in Bericht und Vorschau ein **[UMGESETZT]**.

### 3.1 Generelle Angriffslinien gegen das Basis-Szenario

1. **Darlegungslast/Unternehmensbezug (stärkster Angriff):** BGH IV ZR 513/14 verlangt Vortrag „mit Bezug zur Ertragslage des jeweiligen Versicherers". Beide Beispielrechnungen nutzen den **Branchendurchschnitt** (Unternehmenswerte noch nicht beschafft, `data/COVERAGE.md`). Ein Versicherer wird einwenden, damit sei die Vermutungsbasis nicht tragfähig. Konsequenz fürs Produkt: Vor anwaltlicher Verwendung sind die unternehmensindividuellen Nettoverzinsungen zwingend nachzuziehen; die Schätzung weist das als Annahme aus (gut), bleibt aber bis dahin verhandlungs-, nicht prozesstauglich.
2. **Nettoverzinsung überzeichnet die „gezogenen Nutzungen":** Die GDV-Reihe enthält ab 2012 „Sondereffekte durch verstärkte Realisierung von Bewertungsreserven" (Fußnote der Quelle, in `data/insurers.json` hinterlegt) und realisierte Abgangsgewinne. Gegenposition: Maßstab seien die laufenden Erträge (laufende Durchschnittsverzinsung), nicht Einmaleffekte. Unser Min-Szenario ist genau dafür konstruiert – ist aber derzeit zahnlos, weil die laufende-Durchschnittsverzinsungs-Reihe noch fehlt (nur Einzeljahre belegt, s. COVERAGE); **bis zur Beschaffung gilt: Min ≈ Basis abzüglich Risikoband. Diese Schwäche ist offen auszuweisen** (im Gegenposition-Block umgesetzt).
3. **Sparanteil zu hoch angesetzt:** Risikoanteile stammen aus Modellbändern (`data/risk-defaults.json`, estimate) statt aus der Tarifkalkulation; Verwaltungskostenquote als Fallback. Gegenseite wird höhere Risiko-/Kostenanteile (insb. bei älteren Eintrittsaltern, BUZ) vortragen. Abhilfe: Kostenausweis/Police als Override (vorgesehen), aktuariat-seitige Validierung der Bänder (offen).
4. **Gegenverzinsung erhaltener Leistungen zu niedrig:** Auszahlungen werden nur mit dem Tagesgeld-Referenzzins aufgezinst. Gegenseite: Der VN habe höhere Nutzungen gezogen bzw. Verzugsgesichtspunkte seien anders zu bemessen. Konservative Alternative (höherer Abzug) wäre der jeweils höhere Wert aus Einlagenzins und Basiszins – Entscheidung mit Kanzlei.
5. **Fondsgebundene Verträge:** Nettoverzinsungslogik passt nur eingeschränkt (IV ZR 384/14, 513/14: Fondsverluste anrechnen, kaum Versicherer-Nutzungen). Regelwerk warnt (R-FOLGE-FONDS); für Fondspolicen sollte die Wert-Vorschau bis zur Klärung (LEGAL-OPEN-QUESTIONS Nr. 11) unterdrückt oder doppelt gewarnt werden.

### 3.2 Gegengutachten Vertrag (a) – private RV 12/2004 (Basis 36.818 €, RKW 39.857 €)

Versicherer-Sicht: Ergebnis bestätigt sogar die eigene Position („kein Vorteil"), würde aber ergänzen: (i) Nutzungen 11.474 € beruhen auf Branchenwerten inkl. Sondereffekten – mit laufender Verzinsung läge der Wert niedriger; (ii) 2025/2026 sind mit 2,37 % fortgeschrieben (Warnung ZINSREIHE_LUECKE) – vertretbar, da konservativ; (iii) Risikoanteil 1 % bei RV mit Beitragsrückgewähr eher zu hoch als zu niedrig → für den VN günstig, für die Schätzgüte unkritisch. Fazit: Ausgabe „wirtschaftlich kein Vorteil erkennbar" ist robust; genau so kommunizieren (geschieht).

### 3.3 Gegengutachten Vertrag (b) – Kapital-LV 10/1995 (Basis 624.148 €, RKW 310.658 €)

Angreifbarste Punkte: (i) 1999 nur als „rund 7,6 %" aus GDV-PM (Sekundärquelle), 1996–1998 per Fallback auf 7,37 % – gerade die Hochzinsjahre tragen einen erheblichen Teil der 211.061 € Nutzungen; Primärbelege (BAV-Berichte) sind zwingend zu beschaffen, sonst Abschlag zu erwarten; (ii) Dynamik-Reihe rekonstruiert und auf 439.455 € skaliert – die zeitliche Verteilung der Beiträge (früh vs. spät) verschiebt die Zinsgewichtung, Standmitteilungs-Historie anfordern; (iii) Zillmerung mit 40 ‰ als Obergrenze angesetzt – Versicherer könnte niedrigere tatsächliche Abschlusskosten belegen, was den Sparanteil *erhöht* (für den VN günstig – Angriff unwahrscheinlich); (iv) ohne BUZ-/Risikodaten aus der Police bleibt das Risikoband Modellannahme. Fazit: Größenordnung („deutlich über RKW") plausibel, absolute Zahl mit ± spürbarer Bandbreite; Min–Max-Spanne (593–653 T€) unterschätzt die echte Unsicherheit, solange Punkt 3.1.2 offen ist – der neue Warnblock sagt das ausdrücklich.

---

## Überarbeitete Textbausteine

1. **Gegenposition-Warnblock (Bericht Seite „Gesamtrechnung" und Web-Vorschau)** – umgesetzt in `apps/report/src/template.ts` und `ErgebnisAnsicht.tsx`:
   > „**Gegenposition des Versicherers (typische Einwände):** Nutzungen seien nur aus den konkreten Zahlen des jeweiligen Unternehmens herzuleiten – ein Branchendurchschnitt genüge der Darlegungslast nicht; die Nettoverzinsung enthalte Einmaleffekte (z. B. realisierte Bewertungsreserven ab 2012) und überzeichne die laufenden Erträge; Risiko- und Kostenanteile seien höher als pauschal angesetzt. Diese Einwände betreffen die Höhe, nicht das Ob der Methodik; sie sind der Grund, warum diese Kurzprüfung eine Schätzung mit Bandbreite ist und die anwaltliche Prüfung mit Unternehmenszahlen der nächste Schritt bleibt."
2. **FAQ-Schlusssatz (statt „macht sie effizienter")** – umgesetzt:
   > „Unsere Kurzprüfung bereitet diese Prüfung strukturiert vor."
3. **CTA Versicherer-Seiten (modellneutral)** – umgesetzt: „Jetzt unverbindlich prüfen".
4. **Disclaimer-Kern (Bericht/Website, bestehend – bestätigt):** „strukturierte Berechnung, keine Rechtsdienstleistung im Sinne des RDG; Schätzung mit Bandbreite; keine Zusage eines Anspruchs in bestimmter Höhe; Datenstand und Versionen ausgewiesen."

## Offene Punkte aus diesem Review (Reihenfolge = Priorität)

1. Unternehmensindividuelle Nettoverzinsungen + laufende Durchschnittsverzinsung beschaffen (`data/COVERAGE.md`) – hebt zugleich den stärksten Einwand (3.1.1/3.1.2).
2. Anwaltliche Abnahme: `data/legal-rules.json`, alle Berichts-/Websitetexte, Modellentscheidung inkl. Kanzleivertrag (1.3), R-OK-Rot-Formulierung.
3. Primärabgleich aller Zitate (LEGAL-OPEN-QUESTIONS Nr. 1) und der Einzeltermine (30-Tage-Frist, Textform-Stichtag).
4. Fondspolicen-Behandlung entscheiden (Wert-Vorschau unterdrücken vs. Doppelwarnung).
5. Gegenverzinsungs-Maßstab erhaltener Leistungen mit Kanzlei festlegen (3.1.4).
6. Aktuarielle Validierung der `risk-defaults`-Bänder.
