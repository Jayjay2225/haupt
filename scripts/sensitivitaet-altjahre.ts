/**
 * Sensitivitätsbericht Altjahre (Prompt 9, Teil C.1): Wie stark ändern sich
 * die Nutzungen, wenn ALLE Zinswerte vor 2004 (Unternehmens- und
 * Branchenwerte) um ±1 Prozentpunkt verschoben werden?
 *
 * Aufruf: pnpm exec tsx scripts/sensitivitaet-altjahre.ts
 * Schreibt docs/SENSITIVITAET-ALTJAHRE.md aus der echten data/insurers.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { berechneRueckabwicklung } from '../packages/calc/src/index.ts';
import type { CalcResult, ContractInput, InsurersDaten, Kennzahl, RiskDefaults } from '../packages/calc/src/index.ts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const daten = JSON.parse(readFileSync(resolve(REPO, 'data/insurers.json'), 'utf8')) as InsurersDaten;
const defaults = JSON.parse(readFileSync(resolve(REPO, 'data/risk-defaults.json'), 'utf8')) as RiskDefaults;

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const prozent = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

interface Mustertyp {
  name: string;
  contract: ContractInput;
}

const MUSTER: Mustertyp[] = [
  {
    name: 'Golden (a): private RV 12/2004, 1.200 €/Jahr, laufend',
    contract: { versichererId: 'unbekannt', vertragsart: 'private-rv', beginn: '2004-12', zahlweise: 'jaehrlich', erstbeitrag: { betrag: 1200, waehrung: 'EUR' }, dynamik: { aktiv: false }, gesamtsummeLautMitteilung: 25600, status: 'laufend', rueckkaufswert: { betrag: 39857 }, eintrittsalter: 40, stichtag: '2026-09' },
  },
  {
    name: 'Golden (b): Kapital-LV 10/1995, Dynamik, laufend (Allianz)',
    contract: { versichererId: 'allianz-leben', vertragsart: 'kapital-lv', beginn: '1995-10', zahlweise: 'monatlich', erstbeitrag: { betrag: 1000, waehrung: 'DM' }, dynamik: { aktiv: true, satzProzent: 5 }, gesamtsummeLautMitteilung: 439455, status: 'laufend', rueckkaufswert: { betrag: 310658 }, eintrittsalter: 35, stichtag: '2026-09' },
  },
  {
    name: 'Laufend mit Dynamik: Kapital-LV 03/1996, 200 DM/Monat, 3 % Dynamik',
    contract: { versichererId: 'unbekannt', vertragsart: 'kapital-lv', beginn: '1996-03', zahlweise: 'monatlich', erstbeitrag: { betrag: 200, waehrung: 'DM' }, dynamik: { aktiv: true, satzProzent: 3 }, status: 'laufend', eintrittsalter: 30, stichtag: '2026-09' },
  },
  {
    name: 'Laufend ohne Dynamik: Kapital-LV 09/1999, 150 €/Monat',
    contract: { versichererId: 'unbekannt', vertragsart: 'kapital-lv', beginn: '1999-09', zahlweise: 'monatlich', erstbeitrag: { betrag: 150, waehrung: 'EUR' }, dynamik: { aktiv: false }, status: 'laufend', eintrittsalter: 35, stichtag: '2026-09' },
  },
  {
    name: 'Beitragsfrei seit 2006: Kapital-LV 01/1997, 300 DM/Monat',
    contract: { versichererId: 'unbekannt', vertragsart: 'kapital-lv', beginn: '1997-01', zahlweise: 'monatlich', erstbeitrag: { betrag: 300, waehrung: 'DM' }, dynamik: { aktiv: false }, status: 'beitragsfrei', statusDatum: '2006-01', eintrittsalter: 40, stichtag: '2026-09' },
  },
  {
    name: 'Einmalbeitrag 1995: Kapital-LV 06/1995, 50.000 DM',
    contract: { versichererId: 'unbekannt', vertragsart: 'kapital-lv', beginn: '1995-06', zahlweise: 'einmalbeitrag', erstbeitrag: { betrag: 50000, waehrung: 'DM' }, dynamik: { aktiv: false }, status: 'laufend', eintrittsalter: 45, stichtag: '2026-09' },
  },
];

/** Kopie der Datenbasis mit allen Zinswerten vor 2004 um `delta` Prozentpunkte verschoben. */
function verschoben(delta: number): InsurersDaten {
  const kopie = JSON.parse(JSON.stringify(daten)) as InsurersDaten;
  const anpassen = (reihe: Record<string, Kennzahl> | undefined) => {
    if (!reihe) {
      return;
    }
    for (const [jahr, kz] of Object.entries(reihe)) {
      if (Number(jahr) < 2004) {
        kz.wert = Math.round((kz.wert + delta) * 100) / 100;
      }
    }
  };
  anpassen(kopie.branchendurchschnitt.nettoverzinsung);
  anpassen(kopie.branchendurchschnitt.laufendeDurchschnittsverzinsung);
  for (const v of kopie.insurers) {
    for (const [jahr, kz] of Object.entries(v.kennzahlen)) {
      if (Number(jahr) < 2004) {
        if (kz.nettoverzinsung) {
          kz.nettoverzinsung.wert = Math.round((kz.nettoverzinsung.wert + delta) * 100) / 100;
        }
        if (kz.laufendeDurchschnittsverzinsung) {
          kz.laufendeDurchschnittsverzinsung.wert = Math.round((kz.laufendeDurchschnittsverzinsung.wert + delta) * 100) / 100;
        }
      }
    }
  }
  return kopie;
}

function alt(input: ContractInput, d: InsurersDaten): CalcResult {
  return berechneRueckabwicklung(input, d, defaults);
}

const plus = verschoben(1);
const minus = verschoben(-1);
const zeilen: string[] = [];
zeilen.push('# Sensitivität der Altjahre (vor 2004)');
zeilen.push('');
zeilen.push(`Automatisch erzeugt von \`scripts/sensitivitaet-altjahre.ts\` am ${new Date().toISOString().slice(0, 10)} aus \`data/insurers.json\` (data.version ${daten.data.version}). Frage: Wie stark ändern sich die Nutzungen des **Basis-Szenarios**, wenn alle Zinswerte der Jahre vor 2004 um ±1 Prozentpunkt verschoben werden? Das misst, wie viel an der Beschaffung unternehmensindividueller Altjahres-Werte hängt.`);
zeilen.push('');
zeilen.push('| Vertrag | Nutzungen Basis | −1 Pp vor 2004 | +1 Pp vor 2004 | Änderung | Anteil Nutzungen aus Jahren vor 2004* |');
zeilen.push('|---|---|---|---|---|---|');

interface Messung {
  name: string;
  aenderungProzent: number;
  anteilVor2004: number;
}
const messungen: Messung[] = [];
for (const m of MUSTER) {
  const b = alt(m.contract, daten);
  const p = alt(m.contract, plus);
  const n = alt(m.contract, minus);
  const nb = b.szenarien.basis.nutzungen;
  const np = p.szenarien.basis.nutzungen;
  const nn = n.szenarien.basis.nutzungen;
  const aenderungProzent = nb > 0 ? ((np - nb) / nb) * 100 : 0;
  const vor2004 = b.jahrestabelle.filter((z) => z.jahr < 2004).reduce((a, z) => a + z.nutzungenImJahr, 0);
  const anteilVor2004 = nb > 0 ? (vor2004 / nb) * 100 : 0;
  messungen.push({ name: m.name, aenderungProzent: Math.abs(aenderungProzent), anteilVor2004 });
  zeilen.push(
    `| ${m.name} | ${euro.format(nb)} | ${euro.format(nn)} | ${euro.format(np)} | ±${prozent.format(Math.abs(aenderungProzent))} % | ${prozent.format(anteilVor2004)} % |`,
  );
}
const staerkste = messungen.reduce((a, b) => (b.aenderungProzent > a.aenderungProzent ? b : a));
const laufend = messungen.filter((m) => /Laufend|Golden \(b\)/.test(m.name));
const spanne = (werte: number[]) => `${prozent.format(Math.min(...werte))}–${prozent.format(Math.max(...werte))} %`;
zeilen.push('');
zeilen.push('\\* Zinsertrag, der in den Kalenderjahren vor 2004 gutgeschrieben wurde, in % der gesamten Nutzungen. Die Verschiebung wirkt darüber hinaus, weil früher gutgeschriebene Zinsen bis zum Stichtag weiterverzinst werden.');
zeilen.push('');
zeilen.push('## Einordnung');
zeilen.push('');
zeilen.push(`- Größte Empfindlichkeit: ±${prozent.format(staerkste.aenderungProzent)} % der Nutzungen beim Mustertyp „${staerkste.name}“. Je früher das Kapital eingezahlt wurde und je weniger später nachfließt, desto stärker wiegen die Altjahre: Einmalbeitrag und beitragsfreie Verträge reagieren am stärksten.`);
zeilen.push(`- Bei laufend bezahlten Verträgen mit Beginn in den 1990er-Jahren liegt der Anteil der vor 2004 gutgeschriebenen Nutzungen bei ${spanne(laufend.map((m) => m.anteilVor2004))}; eine Verschiebung aller Altjahres-Zinsen um einen Prozentpunkt ändert die Nutzungen um ±${spanne(laufend.map((m) => m.aenderungProzent))}. Der Grund: Mit Dynamik und über 30 Jahren Laufzeit liegt der Großteil des verzinsten Sparkapitals in den Jahren ab 2004, für die Unternehmenswerte (ab 2011: BaFin-Tabelle 160) vorliegen oder beschafft werden können.`);
zeilen.push('- Verträge ab 2004 (Golden a) reagieren erwartungsgemäß nicht auf die Altjahre.');
zeilen.push('- Konsequenz: Die Beschaffung unternehmensindividueller Altjahres-Werte (docs/SCAN-ANLEITUNG.md, data/COVERAGE.md Matrix 1990–2003) ist für Einmalbeiträge und früh beitragsfrei gestellte Verträge wichtig, für laufend bezahlte Verträge zweitrangig gegenüber den Jahren 2004–2010 (BaFin-PDFs, noch nicht ingestiert). Der Bericht weist den Anteil der Nutzungen aus Branchen-/Näherungswerten aus (Abschnitt „Datenbasis der Nutzungen“).');
zeilen.push('- Ein Prozentpunkt ist eine plausible Größenordnung für den Abstand zwischen Branchendurchschnitt und Einzelunternehmen in den 1990er-Jahren; die tatsächliche Streuung ist nach Beschaffung der Werte nachzumessen.');
writeFileSync(resolve(REPO, 'docs/SENSITIVITAET-ALTJAHRE.md'), `${zeilen.join('\n')}\n`);
console.log(zeilen.slice(4, 4 + MUSTER.length + 2).join('\n'));
