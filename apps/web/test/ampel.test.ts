/**
 * Die eine, wirtschaftliche Ampel (Prompt 12, Abschnitt 1.3 und 1.6):
 * Schwellen aus config/ampel.ts, Größenordnung in Worten, keine
 * Vertragsbeginn-Zonen. Dazu die beiden Pflichtfälle aus 1.6:
 * Vertrag 05/1986 (150 DM) rechnet mit estimated_branch-Kennzeichen durch;
 * Vertrag 03/2015 mit Rückkaufswert nahe der Beitragssumme wird Gelb oder
 * Rot – und Rot rendert keinen Kaufknopf.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { CalcResult, ContractInput, RiskDefaults, SzenarioErgebnis } from '@rueckab/calc';
import riskJson from '../../../data/risk-defaults.json';
import { AMPEL, RECHTSWEG_SATZ } from '../config/ampel';
import { bestimmeWirtschaftlicheAmpel, groessenordnungInWorten } from '../lib/ampel';
import { insurersDaten } from '../lib/insurers-data';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const riskDefaults = riskJson as unknown as RiskDefaults;

function szenario(mehrwert: number | undefined, nettoanspruch = 0): SzenarioErgebnis {
  return {
    name: 'basis',
    summeBeitraege: 10000,
    summeBuz: 0,
    summeRisiko: 500,
    summeAbschluss: 400,
    summeVerwaltung: 300,
    summeSparanteil: 8800,
    erstattungsfaehigeBeitraege: 9500,
    nutzungen: 3000,
    rueckabwicklungswert: 12500,
    erhalteneLeistungenAufgezinst: 0,
    nettoanspruch,
    ...(mehrwert !== undefined ? { mehrwertGegenKuendigung: mehrwert, wirtschaftlichKeinVorteil: mehrwert <= 0 } : {}),
    nutzungenProzentDerBeitraege: 30,
    nutzungenNachHerkunft: { insurer: 0, branche: 3000, fallback: 0, override: 0 },
    anteilUnternehmenswerteProzent: 0,
    zinsreihe: [],
  };
}

function calcMit(mehrwert: number | undefined, nettoanspruch = 0): CalcResult {
  const s = szenario(mehrwert, nettoanspruch);
  return {
    szenarien: { min: s, basis: s, max: s },
    jahrestabelle: [],
    annahmen: [],
    warnungen: [],
    meta: { calcVersion: 'test', dataVersion: 'test', stichtag: '2026-09' },
  };
}

describe('Ampel-Schwellen (config/ampel.ts)', () => {
  it('Grün ab 2.000 € Mehrwert im Basis-Szenario', () => {
    const ampel = bestimmeWirtschaftlicheAmpel(calcMit(AMPEL.gruen.mehrwertMinAbsolut), 'laufend');
    expect(ampel.ampel).toBe('gruen');
    expect(ampel.zeile).toContain('Größenordnung');
    expect(ampel.zeile).toContain('geschätzt, mit Bandbreite');
  });

  it('Gelb zwischen 0 und der Grün-Schwelle', () => {
    const ampel = bestimmeWirtschaftlicheAmpel(calcMit(AMPEL.gruen.mehrwertMinAbsolut - 1), 'laufend');
    expect(ampel.ampel).toBe('gelb');
    expect(ampel.titel).toBe('Gelb. Knapp – es könnte sich lohnen.');
    expect(ampel.zeile).toBe('Der Prüfbericht zeigt, ob es reicht.');
  });

  it('Rot, wenn das Basis-Szenario nicht über dem Rückkaufswert liegt – ehrlich formuliert', () => {
    const ampel = bestimmeWirtschaftlicheAmpel(calcMit(0), 'laufend');
    expect(ampel.ampel).toBe('rot');
    expect(ampel.zeile).toBe('Sparen Sie sich den Bericht.');
  });

  it('Gelb ohne Rückkaufswert (laufender Vertrag)', () => {
    const ampel = bestimmeWirtschaftlicheAmpel(calcMit(undefined), 'laufend');
    expect(ampel.ampel).toBe('gelb');
    expect(ampel.grund).toBe('kein-rueckkaufswert');
  });

  it('beendete Verträge: dieselben Schwellen auf den Netto-Wert', () => {
    expect(bestimmeWirtschaftlicheAmpel(calcMit(undefined, 2500), 'gekuendigt').ampel).toBe('gruen');
    expect(bestimmeWirtschaftlicheAmpel(calcMit(undefined, 500), 'abgelaufen').ampel).toBe('gelb');
    expect(bestimmeWirtschaftlicheAmpel(calcMit(undefined, -100), 'gekuendigt').ampel).toBe('rot');
  });

  it('der Rechtsweg-Satz ist konfiguriert (Prompt 12, 1.4)', () => {
    expect(RECHTSWEG_SATZ).toContain('prüft Ihr Anwalt mit dem Bericht in der Hand');
  });
});

describe('Größenordnung in Worten (Wortbänder aus config/ampel.ts)', () => {
  it('folgt den konfigurierten Stufen', () => {
    expect(groessenordnungInWorten(2500)).toBe('im niedrigen vierstelligen Bereich');
    expect(groessenordnungInWorten(7500)).toBe('im hohen vierstelligen Bereich');
    expect(groessenordnungInWorten(25000)).toBe('im fünfstelligen Bereich');
    expect(groessenordnungInWorten(75000)).toBe('im hohen fünfstelligen Bereich');
    expect(groessenordnungInWorten(250000)).toBe('im sechsstelligen Bereich');
  });
});

describe('Pflichtfälle aus Prompt 12, Abschnitt 1.6 (echte Datenbasis)', () => {
  it('Vertrag 05/1986, 150 DM monatlich: rechnet durch, estimated_branch 1986–2003 vorhanden, Ampel aus Config', () => {
    const contract: ContractInput = {
      versichererId: 'unbekannt',
      vertragsart: 'kapital-lv',
      beginn: '1986-05',
      zahlweise: 'monatlich',
      erstbeitrag: { betrag: 150, waehrung: 'DM' },
      dynamik: { aktiv: false },
      status: 'laufend',
      rueckkaufswert: { betrag: 32000 },
      stichtag: '2026-09',
    };
    const calc = berechneRueckabwicklung(contract, insurersDaten, riskDefaults);
    expect(calc.szenarien.basis.rueckabwicklungswert).toBeGreaterThan(0);
    const markiert = calc.szenarien.basis.zinsreihe
      .filter((j) => j.jahr >= 1986 && j.jahr <= 2003)
      .filter((j) => j.kennzeichen === 'estimated_branch');
    expect(markiert.length).toBe(2003 - 1986 + 1);
    const ampel = bestimmeWirtschaftlicheAmpel(calc, contract.status);
    const mehrwert = calc.szenarien.basis.mehrwertGegenKuendigung ?? 0;
    const erwartet =
      mehrwert >= AMPEL.gruen.mehrwertMinAbsolut ? 'gruen' : mehrwert > AMPEL.gelb.mehrwertMin ? 'gelb' : 'rot';
    expect(ampel.ampel).toBe(erwartet);
  });

  it('Vertrag 03/2015, 100 €, Rückkaufswert nahe Beitragssumme: Gelb oder Rot', () => {
    const contract: ContractInput = {
      versichererId: 'unbekannt',
      vertragsart: 'kapital-lv',
      beginn: '2015-03',
      zahlweise: 'monatlich',
      erstbeitrag: { betrag: 100, waehrung: 'EUR' },
      dynamik: { aktiv: false },
      status: 'laufend',
      gesamtsummeLautMitteilung: 13800,
      rueckkaufswert: { betrag: 13500 },
      stichtag: '2026-09',
    };
    const calc = berechneRueckabwicklung(contract, insurersDaten, riskDefaults);
    const ampel = bestimmeWirtschaftlicheAmpel(calc, contract.status);
    expect(['gelb', 'rot']).toContain(ampel.ampel);
  });

  it('Rot wird in der Oberfläche ohne Kaufknopf gerendert (Ergebnis-Seite)', () => {
    const quelle = readFileSync(join(WEB, 'components', 'funnel', 'ErgebnisAnsicht.tsx'), 'utf8');
    // Der Kaufknopf existiert genau einmal – im Nicht-Rot-Zweig des Ternärs.
    const kaufknopf = quelle.match(/href="\/bestellen"/g) ?? [];
    expect(kaufknopf).toHaveLength(1);
    const rotZweig = quelle.indexOf("ampel.ampel === 'rot' ? (");
    const kaufPosition = quelle.indexOf('href="/bestellen"');
    expect(rotZweig).toBeGreaterThan(-1);
    // Der Kaufknopf steht nach dem Rot-Zweig (im Else-Teil), nie davor.
    expect(kaufPosition).toBeGreaterThan(rotZweig);
    expect(quelle.slice(rotZweig, kaufPosition)).toContain('VerkaufenKarte');
  });

  it('kein Test und keine Ampel-Logik verweist mehr auf Vertragsbeginn-Zonen', () => {
    const quelle = readFileSync(join(WEB, 'lib', 'ampel.ts'), 'utf8');
    expect(quelle).not.toMatch(/vor-1994|neu-2008|ab-2017|beginnJahr/);
  });
});
