# Sensitivität der Altjahre (vor 2004)

Automatisch erzeugt von `scripts/sensitivitaet-altjahre.ts` am 2026-09-18 aus `data/insurers.json` (data.version 0.4.0). Frage: Wie stark ändern sich die Nutzungen des **Basis-Szenarios**, wenn alle Zinswerte der Jahre vor 2004 um ±1 Prozentpunkt verschoben werden? Das misst, wie viel an der Beschaffung unternehmensindividueller Altjahres-Werte hängt.

| Vertrag | Nutzungen Basis | −1 Pp vor 2004 | +1 Pp vor 2004 | Änderung | Anteil Nutzungen aus Jahren vor 2004* |
|---|---|---|---|---|---|
| Golden (a): private RV 12/2004, 1.200 €/Jahr, laufend | 11.474 € | 11.474 € | 11.474 € | ±0,0 % | 0,0 % |
| Golden (b): Kapital-LV 10/1995, Dynamik, laufend (Allianz) | 246.463 € | 243.386 € | 249.648 € | ±1,3 % | 2,5 % |
| Laufend mit Dynamik: Kapital-LV 03/1996, 200 DM/Monat, 3 % Dynamik | 35.059 € | 34.431 € | 35.712 € | ±1,9 % | 3,9 % |
| Laufend ohne Dynamik: Kapital-LV 09/1999, 150 €/Monat | 28.307 € | 28.092 € | 28.525 € | ±0,8 % | 1,5 % |
| Beitragsfrei seit 2006: Kapital-LV 01/1997, 300 DM/Monat | 26.095 € | 24.975 € | 27.266 € | ±4,5 % | 9,4 % |
| Einmalbeitrag 1995: Kapital-LV 06/1995, 50.000 DM | 72.717 € | 65.017 € | 81.089 € | ±11,5 % | 23,3 % |

\* Zinsertrag, der in den Kalenderjahren vor 2004 gutgeschrieben wurde, in % der gesamten Nutzungen. Die Verschiebung wirkt darüber hinaus, weil früher gutgeschriebene Zinsen bis zum Stichtag weiterverzinst werden.

## Einordnung

- Größte Empfindlichkeit: ±11,5 % der Nutzungen beim Mustertyp „Einmalbeitrag 1995: Kapital-LV 06/1995, 50.000 DM“. Je früher das Kapital eingezahlt wurde und je weniger später nachfließt, desto stärker wiegen die Altjahre: Einmalbeitrag und beitragsfreie Verträge reagieren am stärksten.
- Bei laufend bezahlten Verträgen mit Beginn in den 1990er-Jahren liegt der Anteil der vor 2004 gutgeschriebenen Nutzungen bei 1,5–3,9 %; eine Verschiebung aller Altjahres-Zinsen um einen Prozentpunkt ändert die Nutzungen um ±0,8–1,9 %. Der Grund: Mit Dynamik und über 30 Jahren Laufzeit liegt der Großteil des verzinsten Sparkapitals in den Jahren ab 2004, für die Unternehmenswerte (ab 2011: BaFin-Tabelle 160) vorliegen oder beschafft werden können.
- Verträge ab 2004 (Golden a) reagieren erwartungsgemäß nicht auf die Altjahre.
- Konsequenz: Die Beschaffung unternehmensindividueller Altjahres-Werte (docs/SCAN-ANLEITUNG.md, data/COVERAGE.md Matrix 1990–2003) ist für Einmalbeiträge und früh beitragsfrei gestellte Verträge wichtig, für laufend bezahlte Verträge zweitrangig gegenüber den Jahren 2004–2010 (BaFin-PDFs, noch nicht ingestiert). Der Bericht weist den Anteil der Nutzungen aus Branchen-/Näherungswerten aus (Abschnitt „Datenbasis der Nutzungen“).
- Ein Prozentpunkt ist eine plausible Größenordnung für den Abstand zwischen Branchendurchschnitt und Einzelunternehmen in den 1990er-Jahren; die tatsächliche Streuung ist nach Beschaffung der Werte nachzumessen.
