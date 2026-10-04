# Datenbasis-Report (Prompt 12, Abschnitt 1.5)

Stand: 25.09.2026 · data.version **0.5.0** · 27 Gesellschaften · Zeitraum der Rechnung: Verträge mit Beginn 1980–2020, Zinsreihen bis zum Stichtag.

Der Bericht weist je Vertrag aus, welcher Anteil der Nutzungen auf Unternehmens- und welcher auf Branchenwerten beruht (Seite 5/6 des Prüfberichts; Feld `anteilUnternehmenswerteProzent` und `nutzungenNachHerkunft`). Branchen- und Näherungsjahre tragen das Datenkennzeichen **`estimated_branch`**.

## Abdeckungsmatrix 1980–2025

| Jahrzehnt | Branchen-Nettoverzinsung belegt | Unternehmenswerte (Nettoverzinsung, Summe über alle Gesellschaften) | Charakter |
|---|---|---|---|
| 1980–1989 | **2/10** (1980, 1985) | 0 | fast vollständig Schätzung: Lückenjahre werden mit dem nächstliegenden Branchenwert überbrückt (`estimated_branch` + Warnung) |
| 1990–1999 | **10/10** | 16 | überwiegend Branchenwert (GDV, jahrgenau belegt), einzelne Unternehmenswerte aus der Altjahres-Recherche |
| 2000–2009 | **10/10** | 68 | Branchenwert plus wachsender Unternehmensanteil |
| 2010–2019 | **10/10** | 235 | überwiegend Unternehmenswerte (BaFin Tabelle 160 ab 2011) |
| 2020–2025 | **5/6** (2025 offen) | 125 | Unternehmenswerte (BaFin), Branche bis 2024 |

**Bewusste Lücken (Prinzip 1: lieber Lücke als geratener Wert):** 1981–1984 und 1986–1989 – die Branchen-Nettoverzinsung ist in allen zugänglichen GDV-/BAV-Publikationen vor 1990 nur im 5-Jahres-Raster (1980/1985/1990) ausgewiesen. Der Rechenkern überbrückt diese Jahre mit dem zeitlich nächstliegenden Branchenwert (1981–1984 → 1980 = 6,71 %; 1986–1989 → 1985 = 8,12 %), gekennzeichnet als `estimated_branch` mit Warnung im Ergebnis.

## Quellen der neuen Altjahre (Import: `pnpm data:branche1980`)

- **Branchen-Nettoverzinsung 1980, 1985, 1990–1998** (1995 war bereits belegt): GDV, „Geschäftsentwicklung … – Die deutsche Lebensversicherung in Zahlen“, Ausgaben 2001–2004 – frei zugängliche Archiv-PDFs der Deutschen Nationalbibliothek (u. a. http://d-nb.info/1213842107/34, Tabelle „Nettoverzinsung der Kapitalanlagen 1980 bis 2000“, Druckseite 25). Werte über 3–4 Ausgaben kreuzgeprüft; 1997/1998 mit GDV-Fußnote zur Bestandsübertragung 01.01.1998. Abruf 25.09.2026. Details je Wert in `data/insurers.json` (Quelle mit Fundstelle).
- **Referenz-Einlagenzins 1980–2002** (Gegenverzinsung erhaltener Leistungen, konservatives Minimum): Deutsche Bundesbank, Habenzinsen „Spareinlagen mit dreimonatiger Kündigungsfrist“ („Spareckzins“, historische Reihe SU0022; heutiger SDMX-Schlüssel `BBIB1.M.DE.B.H.DNB.SPM.K3M.A.N1.11A`). Jahresmittel aus Monatswerten, Rohdaten unter `data/raw/bundesbank/su0022_bbib1.csv`; Stichproben (1981, 1987, 1988) gegen die Bundesbank-Tabelle Blob 615016 nachgerechnet. Verkettung: alte Zinsstatistik bis 2002, MFI-Statistik ab 2003 (bestehende Einträge unverändert). Abruf 25.09.2026.

## Offene Spuren zum Schließen der 1980er-Lücken

1. GDV „Die deutsche Lebensversicherung in Zahlen“, Print-Ausgaben ca. 1982–2000 (DNB-Katalog, nur Print – Bibliotheksbestellung; Lesungspfad `pnpm data:scans`).
2. BAV-Geschäftsberichte Teil A (nicht online; BaFin stellt ältere Jahresberichte auf Anfrage bereit).
3. Statista-Studie 190555 („1980 bis 2024“, Quelle GDV; Paywall).
4. P. Albrecht (Uni Mannheim), Artikelreihe „Kapitalanlageperformance der deutschen Lebensversicherer“ (Versicherungswirtschaft; Volltexte via wiso-net/GENIOS).

## Hinweis zur Aussagekraft

Je höher der Unternehmensanteil an den Nutzungen, desto belastbarer ist die Schätzung gegenüber dem Versicherer (Gegenposition: „Branchenschnitt genügt der Darlegungslast nicht“). Für Verträge mit Beginn in den 1980ern gilt: Die Nutzungen der ersten Jahre beruhen fast vollständig auf Branchen- bzw. Näherungswerten – der Bericht weist das aus, die Sensitivität (±1 Prozentpunkt vor 2004) steht in `docs/SENSITIVITAET-ALTJAHRE.md`.
