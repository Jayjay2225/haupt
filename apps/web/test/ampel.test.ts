/**
 * Übernahme-Ampel (Prompt 13, Abschnitte 1 und 7): vier Zustände aus der
 * Konfiguration, Reihenfolge Status → Schwelle → Rechnung; Grau und beide
 * Rot-Varianten ohne Kaufknopf; Gratis-Ansicht ohne Beträge, Wortbänder
 * oder Spanne. Dazu die Pflichtfälle aus Prompt 12, 1.6.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { CalcResult, ContractInput, RiskDefaults, SzenarioErgebnis } from '@rueckab/calc';
import riskJson from '../../../data/risk-defaults.json';
import { AMPEL, RECHTSWEG_SATZ } from '../config/ampel';
import { berichtKaufbar, bestimmeUebernahmeAmpel } from '../lib/ampel';
import { insurersDaten } from '../lib/insurers-data';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const riskDefaults = riskJson as unknown as RiskDefaults;

function szenario(mehrwert: number | undefined): SzenarioErgebnis {
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
    nettoanspruch: 12500,
    ...(mehrwert !== undefined ? { mehrwertGegenKuendigung: mehrwert, wirtschaftlichKeinVorteil: mehrwert <= 0 } : {}),
    nutzungenProzentDerBeitraege: 30,
    nutzungenNachHerkunft: { insurer: 0, branche: 3000, fallback: 0, override: 0 },
    anteilUnternehmenswerteProzent: 0,
    zinsreihe: [],
  };
}

function calcMit(mehrwert: number | undefined): CalcResult {
  const s = szenario(mehrwert);
  return {
    szenarien: { min: s, basis: s, max: s },
    jahrestabelle: [],
    annahmen: [],
    warnungen: [],
    meta: { calcVersion: 'test', dataVersion: 'test', stichtag: '2026-09' },
  };
}

describe('Übernahme-Ampel: vier Zustände aus config/ampel.ts', () => {
  const rkwGross = AMPEL.uebernahme.minRueckkaufswert;

  it('Grün ab 5.000 € Mehrwert bei erlaubtem Status und Rückkaufswert über der Schwelle', () => {
    const ampel = bestimmeUebernahmeAmpel(calcMit(AMPEL.gruen.mehrwertMinAbsolut), 'laufend', rkwGross);
    expect(ampel.ampel).toBe('gruen');
    expect(ampel.titel).toBe('Ihr Vertrag kommt für unser Verfahren in Frage.');
    expect(ampel.zeile).toContain('12 Stunden');
    expect(berichtKaufbar(ampel)).toBe(true);
  });

  it('Gelb zwischen 0 und der Grün-Schwelle', () => {
    const ampel = bestimmeUebernahmeAmpel(calcMit(AMPEL.gruen.mehrwertMinAbsolut - 1), 'beitragsfrei', rkwGross);
    expect(ampel.ampel).toBe('gelb');
    expect(ampel.zeile).toBe('Der Prüfbericht entscheidet, ob wir übernehmen.');
    expect(berichtKaufbar(ampel)).toBe(true);
  });

  it('Rot (Rechnung): Basis nicht über dem Rückkaufswert – kein Kaufknopf', () => {
    const ampel = bestimmeUebernahmeAmpel(calcMit(0), 'laufend', rkwGross);
    expect(ampel.ampel).toBe('rot');
    expect(ampel.grund).toBe('kein-vorteil');
    expect(berichtKaufbar(ampel)).toBe(false);
  });

  it('Rot (Status) hat Vorrang: gekündigte/ausgezahlte Verträge übernehmen wir nicht', () => {
    for (const status of ['gekuendigt', 'abgelaufen'] as const) {
      const ampel = bestimmeUebernahmeAmpel(calcMit(50000), status, rkwGross);
      expect(ampel.ampel).toBe('rot');
      expect(ampel.grund).toBe('status');
      expect(ampel.zeile).toBe('Lassen Sie sich dazu anwaltlich beraten.');
      expect(berichtKaufbar(ampel)).toBe(false);
    }
  });

  it('Grau: Rechnung positiv, aber Rückkaufswert unter der Mindestgrenze – kein Kaufknopf', () => {
    const ampel = bestimmeUebernahmeAmpel(calcMit(50000), 'laufend', rkwGross - 1);
    expect(ampel.ampel).toBe('grau');
    expect(ampel.grund).toBe('zu-klein');
    expect(berichtKaufbar(ampel)).toBe(AMPEL.uebernahme.berichtUnterSchwelle);
    expect(AMPEL.uebernahme.berichtUnterSchwelle).toBe(false);
  });

  it('unter der Schwelle UND ohne Rechnungs-Vorteil bleibt es Rot', () => {
    const ampel = bestimmeUebernahmeAmpel(calcMit(-100), 'laufend', rkwGross - 1);
    expect(ampel.ampel).toBe('rot');
    expect(ampel.grund).toBe('kein-vorteil');
  });

  it('der neue Rechtsweg-Satz nennt die Anwälte, nicht den Bericht in der Hand', () => {
    expect(RECHTSWEG_SATZ).toContain('spezialisierten Anwälte');
    expect(RECHTSWEG_SATZ).not.toContain('mit dem Bericht in der Hand');
  });
});

describe('Gratis-Ansicht: nur die Ampel (Prompt 13, 0.4 und 7)', () => {
  it('keine Beträge und keine Wortbänder in Titel/Zeile (außer der festen Grau-Grenze)', () => {
    const faelle = [
      bestimmeUebernahmeAmpel(calcMit(10000), 'laufend', 50000),
      bestimmeUebernahmeAmpel(calcMit(1000), 'laufend', 50000),
      bestimmeUebernahmeAmpel(calcMit(0), 'laufend', 50000),
      bestimmeUebernahmeAmpel(calcMit(10000), 'gekuendigt', 50000),
    ];
    for (const ampel of faelle) {
      expect(ampel.titel).not.toMatch(/€|\d/);
      expect(ampel.zeile).not.toMatch(/€/);
      expect(`${ampel.titel} ${ampel.zeile}`).not.toMatch(/stelligen Bereich|Größenordnung|Spanne/);
    }
    // Grau nennt die feste Mindestgrenze (Deck-Wortlaut) – aber kein Fall-Ergebnis.
    const grau = bestimmeUebernahmeAmpel(calcMit(10000), 'laufend', 10000);
    expect(grau.zeile).toContain('30.000 €');
    expect(grau.zeile).not.toMatch(/stelligen Bereich|Größenordnung|Spanne/);
  });

  it('die Ergebnis-Seite rendert Kaufknopf nur über das kaufbar-Flag und kennt keine Größenordnung', () => {
    const quelle = readFileSync(join(WEB, 'components', 'funnel', 'ErgebnisAnsicht.tsx'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(quelle.match(/href="\/bestellen"/g) ?? []).toHaveLength(1);
    const kaufblock = quelle.indexOf('vorschau.kaufbar &&');
    expect(kaufblock).toBeGreaterThan(-1);
    expect(quelle.indexOf('href="/bestellen"')).toBeGreaterThan(kaufblock);
    expect(quelle).not.toMatch(/groessenordnung|Größenordnung/i);
    // Keine Spannen-Anzeige im Privat-Teil; die Gegenposition DARF das Wort
    // „Spanne“ erklären (unverändert laut Prompt 13, 2.2), Beträge zeigt nur
    // die Kanzlei-Variante („Spanne Min–Max“).
    const privatTeil = quelle.slice(0, quelle.indexOf("variante === 'kanzlei'"));
    expect(privatTeil).not.toMatch(/Spanne Min|Spanne der Szenarien/);
    expect(quelle).not.toContain('So verdienen wir');
    expect(quelle).not.toContain('Lieber persönlich?');
  });

  it('die Vorschau-API liefert keine Größenordnung mehr', () => {
    const quelle = readFileSync(join(WEB, 'app', 'api', 'vorschau', 'route.ts'), 'utf8');
    expect(quelle).not.toMatch(/groessenordnung/i);
  });
});

describe('Pflichtfälle aus Prompt 12, 1.6 (echte Datenbasis)', () => {
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
    const ampel = bestimmeUebernahmeAmpel(calc, contract.status, contract.rueckkaufswert?.betrag);
    const mehrwert = calc.szenarien.basis.mehrwertGegenKuendigung ?? 0;
    const erwartet =
      mehrwert >= AMPEL.gruen.mehrwertMinAbsolut ? 'gruen' : mehrwert > AMPEL.gelb.mehrwertMin ? 'gelb' : 'rot';
    expect(ampel.ampel).toBe(erwartet);
  });

  it('Vertrag 03/2015, 100 €, Rückkaufswert nahe Beitragssumme: Gelb, Rot oder Grau (unter 30.000 €)', () => {
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
    const ampel = bestimmeUebernahmeAmpel(calc, contract.status, contract.rueckkaufswert?.betrag);
    expect(['gelb', 'rot', 'grau']).toContain(ampel.ampel);
    expect(berichtKaufbar(ampel)).toBe(ampel.grund === 'knapp' || ampel.grund === 'uebernahme');
  });

  it('kein Test und keine Ampel-Logik verweist mehr auf Vertragsbeginn-Zonen', () => {
    const quelle = readFileSync(join(WEB, 'lib', 'ampel.ts'), 'utf8');
    expect(quelle).not.toMatch(/vor-1994|neu-2008|ab-2017|beginnJahr/);
  });
});
