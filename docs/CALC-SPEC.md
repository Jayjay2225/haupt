# CALC-SPEC – Spezifikation des Rechenkerns `packages/calc`

Stand: 18.09.2026 · Gilt für `calc.version` 0.2.x. Reine Funktionen, keine I/O; alle Daten (Versichererkennzahlen, Referenzzinsen, Risiko-Defaults, Rechtsregeln) werden als Parameter übergeben. Ergebnis ist deterministisch: gleiche Eingaben → gleiches Ergebnis; `calc.version` und `data.version` stehen im Ergebnis.

Methodische Leitplanken (CLAUDE.md, Prinzip 2): Nutzungen nur auf den Sparanteil (im Max-Szenario zusätzlich auf den Verwaltungskostenanteil), Maßstab ist die Nettoverzinsung der Kapitalanlagen des jeweiligen Versicherers. Keine Aufzinsung des Vollbeitrags, keine Rohüberschussquoten. Rechtliche Fundstellen: `docs/LEGAL.md` und `data/legal-rules.json`.

## 1. Eingaben

### 1.1 `ContractInput`

| Feld | Typ | Pflicht | Bemerkung |
|---|---|---|---|
| `versichererId` | string | ja* | id aus `insurers.json`; `"unbekannt"` erlaubt → Branchendurchschnitt, als Schätzung markiert |
| `vertragsart` | `kapital-lv \| private-rv \| fonds-lv \| fonds-rv \| rueckdeckung` | ja | reine Risiko-LV ist kein Anwendungsfall (Eignungs-Check) |
| `beginn` | ISO-Monat | ja | Monat der Vertragsschließung/Versicherungsbeginn |
| `ende` | ISO-Monat | nein | planmäßiger Ablauf |
| `beitragszahlungVon` | ISO-Monat | nein | Default = `beginn` |
| `beitragszahlungBis` | ISO-Monat | nein | Default = min(Stichtag, Statuswechsel, `ende`) |
| `zahlweise` | `monatlich \| vierteljaehrlich \| halbjaehrlich \| jaehrlich \| einmalbeitrag` | ja | |
| `erstbeitrag` | { betrag, waehrung: EUR\|DM } | ja** | Beitrag je Zahlungsperiode zu Beginn |
| `aktuellerBeitrag` | number (EUR) | nein** | je Zahlungsperiode; ** mind. eines von Erst-/aktuellem Beitrag |
| `dynamik` | { aktiv, satzProzent?, ausgesetzteJahre?[] } | ja | Satz optional → Herleitung aus Erst-/aktuellem Beitrag (s. 2.2) |
| `gesamtsummeLautMitteilung` | number (EUR) | nein | skaliert die Reihe (s. 2.3) |
| `status` | `laufend \| beitragsfrei \| gekuendigt \| abgelaufen` + `statusDatum` (ISO-Monat, außer laufend) | ja | |
| `rueckkaufswert` | { betrag, standMonat? } | nein | aktueller RKW (laufend) bzw. Auszahlbetrag (gekündigt) |
| `auszahlungen` | { monat, betrag }[] | nein | Teilauszahlungen, Gewinnentnahmen, ausgezahlter RKW |
| `policendarlehen` | { monat, betrag }[] | nein | wie Auszahlung behandelt (s. 5) |
| `buzBeitragsanteilProzent` | number | nein | Anteil des Gesamtbeitrags für BUZ; 100 % Risikoanteil |
| `eintrittsalter` | number | ja*** | *** wenn unbekannt: 40 (Default aus risk-defaults, markiert) |
| `stichtag` | ISO-Monat | ja | Widerspruchsdatum oder „heute“ |
| `szenarioOverrides` | partiell | nein | z. B. fester Zinssatz, Risikoanteil – für Tests/Sensitivität |

### 1.2 Datenpakete (als Parameter)

- `InsurersDaten` (aus `data/insurers.json`): je Versicherer & Jahr Nettoverzinsung, laufende Durchschnittsverzinsung, Kostenquoten; Branchendurchschnitts-Reihe; Referenzzinsen (Einlagenzins, Basiszins § 247 BGB); Rechnungsgrundlagen (Höchstzillmersatz, Höchstrechnungszins).
- `RiskDefaults` (aus `data/risk-defaults.json`): pauschale Risikoanteile nach Vertragsart und Eintrittsalter-Band mit `low`/`mid`/`high` sowie Verwaltungskosten-Fallback. Alle Defaults sind als `estimate` gekennzeichnet und im Ergebnis als Annahme ausgewiesen.

## 2. Beitragsreihe (monatsgenau)

### 2.1 Raster
Monate `m = 0 … T` von `beginn` bis `stichtag` (einschließlich). Beiträge fließen am Periodenbeginn: monatlich → jeden Monat; vierteljährlich → alle 3 Monate ab `beitragszahlungVon`; usw.; `einmalbeitrag` → genau ein Beitrag im Startmonat. Beitragsfluss endet mit `beitragszahlungBis` bzw. `statusDatum` bei `beitragsfrei`/`gekuendigt`.

### 2.2 Dynamik
Erhöhung jeweils zum Jahrestag des Vertragsbeginns, erstmals zu Beginn des 2. Vertragsjahres; ausgesetzte Jahre überspringen die Erhöhung. Ist `dynamik.satzProzent` nicht angegeben, aber Erst- und aktueller Beitrag vorhanden, wird der Satz geometrisch hergeleitet: `satz = (aktuell/erst)^(1/n) − 1` über die `n` erfolgten Erhöhungstermine; Herleitung erscheint als Annahme. Ist nur ein Beitrag bekannt, gilt er konstant (Annahme, Warnung wenn `dynamik.aktiv`).

### 2.3 DM und Skalierung
DM-Beträge werden mit 1,95583 in EUR umgerechnet (amtlicher Kurs; betrifft Beiträge mit Fälligkeit bis 31.12.2001, praktisch die gesamte Reihe, da der nominale DM-Beitrag ab 2002 als identischer EUR-Gegenwert weiterläuft). Liegt `gesamtsummeLautMitteilung` vor: Skalierungsfaktor `f = Mitteilung / Σ Reihe` auf alle Beiträge; bei `|f − 1| > 5 %` Warnung `BEITRAGSREIHE_ABWEICHUNG` (Reihe wird trotzdem skaliert – die Mitteilung des Versicherers ist die bessere Evidenz).

## 3. Aufteilung jedes Beitrags

Reihenfolge je Beitrag `b_m` (Monat `m`, Kalenderjahr `j`):

1. **BUZ:** `buz_m = b_m · buzBeitragsanteil` → zu 100 % Risikoanteil.
2. **Risikoanteil Hauptversicherung:** `risiko_m = (b_m − buz_m) · r_risiko`; `r_risiko` aus Vertragsunterlagen (Override) oder `risk-defaults` nach Vertragsart und Eintrittsalter-Band; szenarioabhängig `high` (Min) / `mid` (Basis) / `low` (Max).
3. **Abschlusskostenanteil (Zillmerung):** Gesamtbetrag `AK = min(zillmersatz(j₀) · Beitragssumme, akQuote(Versicherer, j₀) · Beitragssumme)` mit `j₀` = Abschlussjahr, Beitragssumme = Σ der planmäßigen Beiträge (vor Skalierung auf den Stichtag, gedeckelt auf die tatsächlich betrachtete Reihe). Verteilung: Vertragsschluss **bis 2007** → Tilgung aus den ersten Beiträgen (je Beitrag max. der nach Risikoanteil verbleibende Teil, bis `AK` verbraucht ist); **ab 2008** → gleichmäßig auf die ersten 60 Monate. Fehlt die versichererindividuelle Abschlusskostenquote, gilt der Höchstzillmersatz allein (Annahme, markiert).
4. **Verwaltungskostenanteil:** `vw_m = (b_m − buz_m) · vwQuote(Versicherer, j)`; fehlt die Quote, Fallback aus `risk-defaults` (estimate, markiert).
5. **Sparanteil:** `spar_m = b_m − buz_m − risiko_m − ak_m − vw_m`, mindestens 0 (bei Unterschreitung Warnung `SPARANTEIL_NEGATIV`, Kostenanteile werden anteilig gekürzt: erst Verwaltung, dann Abschluss).

## 4. Nutzungen

Für jeden Monat `m` wächst `spar_m` (im Max-Szenario zusätzlich `vw_m`) bis zum Stichtag `T`:

```
wert_m(T) = anteil_m · Π über k = m+1 … T von (1 + r(jahr(k)) / 12)
Nutzungen = Σ wert_m(T) − Σ anteil_m
```

`r(j)` ist der Jahressatz des Szenarios für Kalenderjahr `j` (in Dezimalform):

| Szenario | Zinsreihe | Risikoanteil | Nutzungsbasis |
|---|---|---|---|
| **Min** | je Jahr min(Nettoverzinsung, laufende Durchschnittsverzinsung) | oberes Band (`high`) | nur Sparanteil |
| **Basis** | Nettoverzinsung | Mittelwert (`mid`) | nur Sparanteil |
| **Max** | Nettoverzinsung | unteres Band (`low`) | Sparanteil + Verwaltungskostenanteil |

Zinsquelle je Jahr: Kennzahl des Versicherers unter Beachtung der Rechtsnachfolge (`kennzahlenVon`); fehlt das Jahr → Branchendurchschnitt (`estimate`-Markierung im Jahresprotokoll und in den Annahmen); fehlt auch der → letzter verfügbarer Branchenwert mit Warnung `ZINSREIHE_LUECKE`. Begründung Max-Szenario: Nutzungen auf den Verwaltungskostenanteil werden von der Rechtsprechung nur bei konkretem Nachweis zuerkannt – das Max-Szenario beziffert diese vertretbare Obergrenze und wird im Bericht ausdrücklich so eingeordnet (kein Erwartungswert).

## 5. Gegenrechnung erhaltener Leistungen

Jede erhaltene Leistung `L` (ausgezahlter Rückkaufswert bei `gekuendigt`, Teilauszahlungen, Policendarlehen) wird vom Auszahlungsmonat bis zum Stichtag mit dem Referenz-Einlagenzins (Bundesbank-Reihe aus `insurers.json`; monatlich `r/12`) aufgezinst und vom Rückabwicklungswert abgezogen (Nutzungen, die der Versicherungsnehmer selbst aus erhaltenen Geldern ziehen konnte). Policendarlehen werden wie Auszahlungen behandelt; die Rückzahlungsseite (Zins/Tilgung an den Versicherer) ist nicht modelliert → Hinweis im Ergebnis, Einzelfallprüfung.

## 6. Ergebnis je Szenario

```
erstattungsfaehigeBeitraege = Σ b_m − Σ buz_m − Σ risiko_m
rueckabwicklungswert        = erstattungsfaehigeBeitraege + Nutzungen
nettoanspruch               = rueckabwicklungswert − Σ aufgezinste erhaltene Leistungen
mehrwertGegenKuendigung     = rueckabwicklungswert − aktueller Rückkaufswert   (nur laufend/beitragsfrei)
```

Abschluss- und Verwaltungskostenanteile mindern die **Rückzahlung nicht** (sie bleiben in `erstattungsfaehigeBeitraege` enthalten); sie steuern nur die **Nutzungsbasis** (s. 4). Ist `mehrwertGegenKuendigung ≤ 0` im Basis-Szenario, setzt der Kern das Flag `wirtschaftlichKeinVorteil` („wirtschaftlich kein Vorteil erkennbar“) – der Bericht muss das prominent ausgeben.

**Regime ab 01.01.2008 (Widerruf § 8/§ 9/§ 152 VVG n.F.):** Der Kern rechnet die § 5a-Methodik nicht; er liefert eine vereinfachte Gegenüberstellung (Rückkaufswert nach § 169 VVG als Anker, ggf. zzgl. Prämien des ersten Jahres bei fehlender Belehrung) mit dem Hinweis, dass der Anspruch in der Regel deutlich geringer ausfällt; Details `docs/LEGAL.md` Abschnitt C.

## 7. Ausgabe `CalcResult`

- `szenarien.{min,basis,max}`: Beträge aus Abschnitt 6 + `nutzungenProzentDerBeitraege` (nur zusammen mit der Zinsreihe auszuweisen, nie als Schlagzeile).
- `jahrestabelle[]` (Basis-Szenario): Jahr, Beiträge, BUZ, Risiko, Abschluss, Verwaltung, Sparanteil, verwendeter Zinssatz + Quellenherkunft (`insurer | branche | fallback`), Nutzungen des Jahres, kumulierter Stand.
- `annahmen[]`: jede getroffene Annahme mit Grund (Risiko-Default, Zins-Fallback, Dynamik-Herleitung, Skalierung …).
- `datenherkunft`: verwendete Zinsreihe je Jahr mit Quelle/`source_type`/`confidence` (aus insurers.json durchgereicht).
- `warnungen[]`: Codes s. o. plus `PLAUSIBILITAET_NUTZUNGEN` (s. 8).
- `meta`: `calcVersion`, `dataVersion`, `stichtag`, `regime`.

Rundung: intern volle Gleitkommagenauigkeit, Ausgabefelder auf Cent gerundet; die Jahrestabelle summiert sich nach Rundung konsistent (Restdifferenz ≤ 1 Cent pro Zeile wird der letzten Spalte zugeschlagen).

## 8. Plausibilitätsgrenzen

`nutzungenProzentDerBeitraege` muss innerhalb der Bandbreite liegen, die sich aus der verwendeten Zinsreihe ergibt: Obergrenze = hypothetische Vollbeitrags-Aufzinsung mit dem Maximum der Reihe, Untergrenze = 0. Verletzung → Warnung `PLAUSIBILITAET_NUTZUNGEN` und Testfehler in der CI.

## 9. Tests (Prompt 3)

1. **Unit** je Schritt: Raster/Zahlweise, Dynamik (inkl. ausgesetzter Jahre und Herleitung), DM-Umrechnung, Skalierung + Warnung, Zillmer-Verteilung vor/ab 2008, Kostenkürzung bei negativem Sparanteil, Zinsquellen-Auflösung inkl. Rechtsnachfolge und Fallback, Gegenverzinsung erhaltener Leistungen.
2. **Property:** (a) höherer Zinssatz ⇒ Nutzungen steigen monoton; (b) ohne Kosten/Risiko und bei konstantem Satz entspricht der Endwert der Formel für die Annuität mit monatlicher Verzinsung (Toleranz 1e-8 relativ); (c) Skalierung der Beitragsreihe mit Faktor f skaliert Sparanteile, Nutzungen und Rückabwicklungswert mit f (Verhältnisse konstant).
3. **Golden:** die zwei Beispielverträge aus `docs/PROMPTS.md` (private RV 12/2004; LV 10/1995 mit Dynamik) gegen eine eingefrorene Fixture-Datenbasis (`test/fixtures/`); alle drei Szenarien dokumentiert; Vertrag (a) muss im Basis-Szenario `wirtschaftlichKeinVorteil` setzen, solange der Rückabwicklungswert ≤ Rückkaufswert ist.
4. **Plausibilität:** Grenzen aus Abschnitt 8 als Test.

Fixture-Daten sind ausdrücklich Testdaten (synthetische, als solche gekennzeichnete Reihen) – sie sind **nicht** Teil von `data/insurers.json` und erscheinen in keinem Bericht. Die Golden-Tests laufen dagegen gegen die echte `data/insurers.json` und frieren deren Stand ein (Snapshot bricht bei Datenänderung bewusst).

## 10. Golden-Ergebnisse (Stand data.version 0.1.0, calc.version 0.2.0, Stichtag 09/2026)

Beide Verträge rechnen mangels Unternehmenskennzahlen mit dem **Branchendurchschnitt** (als Schätzung markiert); fehlende Jahre 1996–1998 und 2025–2026 werden per Fallback überbrückt (Warnung `ZINSREIHE_LUECKE`).

**Vertrag (a) – private RV, Beginn 12/2004, 1.200 € jährlich, 25.600 € eingezahlt, Rückkaufswert 39.857 €:**

| Szenario | erstattungsfähige Beiträge | Nutzungen | Rückabwicklungswert | Mehrwert ggü. Kündigung |
|---|---|---|---|---|
| Min | 25.088,00 € | 11.207,25 € | 36.295,25 € | −3.561,75 € |
| Basis | 25.344,00 € | 11.474,21 € | 36.818,21 € | **−3.038,79 €** |
| Max | 25.600,00 € | 12.008,14 € | 37.608,14 € | −2.248,86 € |

Bewertung: In allen drei Szenarien liegt der Rückabwicklungswert **unter** dem Rückkaufswert → das Tool setzt `wirtschaftlichKeinVorteil` und muss „wirtschaftlich kein Vorteil erkennbar" ausgeben (Erwartung aus `docs/PROMPTS.md` erfüllt). Plausibel: Der Rückkaufswert einer bis 2026 laufenden RV enthält Überschussbeteiligung; die bereicherungsrechtliche Schätzung auf Branchenniveau bleibt darunter.

**Vertrag (b) – Kapital-LV, Beginn 10/1995, Dynamik 5 %, 439.455 € eingezahlt, Rückkaufswert 310.658 €:**

| Szenario | erstattungsfähige Beiträge | Nutzungen | Rückabwicklungswert | Mehrwert ggü. Kündigung |
|---|---|---|---|---|
| Min | 395.509,50 € | 197.738,03 € | 593.247,53 € | +282.589,53 € |
| Basis | 413.087,70 € | 211.060,60 € | 624.148,30 € | **+313.490,30 €** |
| Max | 426.271,35 € | 226.340,07 € | 652.611,42 € | +341.953,42 € |

Bewertung: Deutlicher rechnerischer Mehrwert in allen Szenarien (Nutzungen 45–51,5 % der Beiträge – getragen von den hohen Nettoverzinsungen der 1990er/2000er). Im Bericht zwingend mit Annahmenliste (pauschaler Risikoanteil, Branchendurchschnitt statt Unternehmenswert, Zins-Lücken) und ohne Anspruchszusage auszuweisen.
