# data/raw/bafin – BaFin „Statistik der Erstversicherungsunternehmen“, Tabelle 160

Rohdaten (unverändert) der jährlichen BaFin-Statistik für Lebensversicherer, Einzelunternehmenstabelle **160** „Ausgewählte Kennzahlen der Lebensversicherungsunternehmen in der Rangfolge der verdienten Brutto-Beiträge“. Import nach `data/insurers.json` mit `node --experimental-strip-types scripts/import-bafin.ts import` (Mapping Kurzname → Gesellschaft in `mapping.json`, jahresabhängig bei Umfirmierungen).

## Herkunft

Einstiegsseite: https://www.bafin.de/DE/die-bafin/publikationen-daten/statistiken/erstversicherung/erstversicherung_node.html · Dateien: `https://www.bafin.de/SharedDocs/Downloads/DE/Statistik/Erstversicherer/<Datei>?__blob=publicationFile&v=1` · Abrufdatum aller Dateien: **18.09.2026**.

| Berichtsjahr | Datei | Format | Veröffentlicht lt. BaFin-Seite |
|---|---|---|---|
| 2024 | dl_st_24_erstvu_lv_va.xlsx | XLSX | 17.11.2025 |
| 2023 | dl_st_23_erstvu_lv_va.xlsx | XLSX | 18.11.2024 |
| 2022 | dl_st_22_erstvu_lv_va.xlsx | XLSX | 14.12.2023 |
| 2021 | dl_st_21_erstvu_lv_va.xlsx | XLSX | 30.11.2022 |
| 2020 | dl_st_20_erstvu_lv_va_xls.xlsm | XLSM | 15.11.2021 |
| 2019 | dl_st_19_erstvu_lv_va_xls.xlsm | XLSM | 10.11.2020 |
| 2018 | dl_st_18_erstvu_lv_va_xls.xlsx | XLSX | 08.11.2019 |
| 2017 | dl_st_17_erstvu_lv_va_xls.xlsx | XLSX | 06.11.2018 |
| 2016 | dl_st_16_erstvu_lv_va_xls.xlsx | XLSX | 26.01.2018 |
| 2015 | dl_st_15_erstvu_lv_va_xls.xlsx | XLSX | 04.11.2016 |
| 2014 | dl_st_14_erstvu_lv_va_xls.xlsx | XLSX | 09.11.2015 |
| 2013 | dl_st_13_erstvu_lv_va_xls.xlsx | XLSX | 24.11.2014 |
| 2012 | dl_st_12_erstvu_lv_va_xls.xlsx | XLSX | 12.11.2013 |
| 2011 | dl_st_11_erstvu_lv_va_xls.xlsx | XLSX | 06.11.2012 |

2004–2010 liegen nur als PDF vor (2004 Bildscan; 2005–2009 Zahlen als Vektorpfade; 2010 Tabellen als Bilder) – ohne OCR nicht maschinell lesbar. Sie laufen über den Scan-Weg (`docs/SCAN-ANLEITUNG.md`, `pnpm data:scans`). Tabelle-160-Seiten in den PDFs: 2004 S. 9–11, 2005/2006 S. 9–11, 2007 S. 9–11, 2008 S. 9–11, 2009 S. 9–11, 2010 S. 9–12.

## Struktur von Blatt „160“

- Kopfzeilen, dann eine Zeile mit den logischen Spaltennummern `1…n` (Zelle A = 1), darunter die Zeile **„Branche“** (Branchenwerte), dann die Unternehmen mit Rang `1…n`, danach Fußnoten. 2022/2023 sind die Spalten physisch um eine Spalte verschoben; der Import löst das über die Spaltennummern-Zeile auf.
- **Layout A (2011–2015, 15 Spalten):** … 9 lfd. Verzinsung % · 10 Reinverzinsung % · 11 Abschlussaufwendungen ‰ des modifizierten Neugeschäfts · 12 Abschlussaufwendungen % der verd. Brutto-Beiträge · 13 Verwaltungsaufwendungen % der verd. Brutto-Beiträge …
- **Layout B (2016–2024, 13 Spalten):** … 8 lfd. Verzinsung % · 9 Reinverzinsung % · 10 Abschlussaufwendungen % der verd. BB · 11 Verwaltungsaufwendungen % der verd. BB …
- Sonderwerte: „-“ (Wert gleich null), „0“ (kleiner als die Tabelleneinheit), „***“ (außerhalb des darstellbaren Bereichs) – werden nicht importiert.

## Kennzahlen-Zuordnung (Annahme, dokumentiert in docs/ASSUMPTIONS.md)

| BaFin | Fußnoten-Definition (Kurzfassung) | Feld in insurers.json |
|---|---|---|
| Reinverzinsung | Posten I.3 abzüglich Posten I.10 des Formblatts 3 RechVersV in % des mittleren Kapitalanlagenbestands (inkl. fondsgebundener Anlagen und Depotforderungen) | `nettoverzinsung` |
| lfd. Verzinsung | Posten I.3 a), b), e) in % des mittleren Kapitalanlagenbestands | `laufendeDurchschnittsverzinsung` |
| Verwaltungsaufwendungen in % der verd. Brutto-Beiträge | – | `verwaltungskostenquote` |
| Abschlussaufwendungen in % der verd. Brutto-Beiträge | – | `abschlussaufwendungenProzentBeitraege` (nachrichtlich; keine Zillmer-Quote auf die Beitragssumme) |

Die Branchenzeile liefert zusätzlich `branchendurchschnitt.laufendeDurchschnittsverzinsung` (2011–2024) für das Min-Szenario.

## Vorbehalte

- Die BaFin-Tabellen nennen nur Kurznamen in Großschreibung, keine Registernummern; Kurznamen wandern bei Umfirmierungen (z. B. „GENERALI LEBEN AG“ bis 2018 = heutige Proxalto, ab 2020 = frühere AachenMünchener). `mapping.json` bildet das jahresabhängig ab; die Zuordnung ist registerfest zu verifizieren (BaFin-Unternehmensdatenbank).
- Nicht gemappte Kurznamen stehen in `KURZNAMEN.md`; sie können bei Bedarf als weitere Gesellschaften aufgenommen werden.
- Prozentwerte sind in den Dateien mit Gleitkomma-Artefakten gespeichert und werden auf eine Nachkommastelle gerundet (Tabelleneinheit).
