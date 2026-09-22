import { describe, expect, it } from 'vitest';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { ContractInput, InsurersDaten, RiskDefaults } from '@rueckab/calc';
import { pruefeEignung } from '@rueckab/eligibility';
import type { EligibilityInput, Regelwerk } from '@rueckab/eligibility';
import insurersJson from '../../../data/insurers.json';
import riskJson from '../../../data/risk-defaults.json';
import rulesJson from '../../../data/legal-rules.json';
import { bestimmeWirtschaftlicheAmpel, groessenordnungInWorten } from '../lib/ampel';

const daten = insurersJson as unknown as InsurersDaten;
const defaults = riskJson as unknown as RiskDefaults;
const regelwerk = rulesJson as unknown as Regelwerk;

function vertrag(anpassung: Partial<ContractInput> = {}): ContractInput {
  return {
    versichererId: 'unbekannt',
    vertragsart: 'kapital-lv',
    beginn: '1995-10',
    zahlweise: 'monatlich',
    erstbeitrag: { betrag: 1000, waehrung: 'DM' },
    dynamik: { aktiv: true, satzProzent: 5 },
    gesamtsummeLautMitteilung: 439455,
    status: 'laufend',
    rueckkaufswert: { betrag: 310658 },
    eintrittsalter: 35,
    stichtag: '2026-09',
    ...anpassung,
  };
}

function eignung(anpassung: Partial<EligibilityInput> = {}) {
  return pruefeEignung(
    {
      vertragsschluss: '1995-10',
      vertragsart: 'kapital-lv',
      zustandekommen: 'policenmodell',
      belehrungVorhanden: 'unbekannt',
      belehrungFrist: 'unbekannt',
      belehrungForm: 'unbekannt',
      hervorhebung: 'unbekannt',
      status: 'laufend',
      abgetretenOderBeliehen: 'nein',
      auszahlungenErhalten: 'nein',
      ...anpassung,
    },
    regelwerk,
  );
}

function ampelFuer(c: ContractInput, e = eignung({ vertragsschluss: c.beginn, vertragsart: c.vertragsart as EligibilityInput['vertragsart'] })) {
  return bestimmeWirtschaftlicheAmpel(berechneRueckabwicklung(c, daten, defaults), e, Number(c.beginn.slice(0, 4)), c.status);
}

describe('Größenordnung in Worten', () => {
  it('enthält nie Ziffern und wächst mit dem Betrag', () => {
    const werte = [120, 700, 3000, 8000, 15000, 50000, 90000, 200000, 500000, 900000, 2000000];
    const worte = werte.map(groessenordnungInWorten);
    for (const w of worte) {
      expect(w).not.toMatch(/\d/);
    }
    expect(new Set(worte).size).toBe(worte.length);
  });
});

describe('Wirtschaftliche Ampel', () => {
  it('Grün, wenn alle Szenarien über dem Rückkaufswert liegen (Golden-Vertrag b)', () => {
    const a = ampelFuer(vertrag());
    expect(a.ampel).toBe('gruen');
    expect(a.grund).toBe('vorteil');
    expect(a.groessenordnung).toBeDefined();
  });

  it('Rot bei „kein Vorteil“ (Golden-Vertrag a) – und sagt es laut', () => {
    const a = ampelFuer(
      vertrag({
        vertragsart: 'private-rv',
        beginn: '2004-12',
        zahlweise: 'jaehrlich',
        erstbeitrag: { betrag: 1200, waehrung: 'EUR' },
        dynamik: { aktiv: false },
        gesamtsummeLautMitteilung: 25600,
        rueckkaufswert: { betrag: 39857 },
        eintrittsalter: 40,
      }),
    );
    expect(a.ampel).toBe('rot');
    expect(a.grund).toBe('kein-vorteil');
    expect(a.text).toMatch(/Sparen Sie sich das Geld/);
  });

  it('Gelb ohne Rückkaufswert, mit Größenordnung des Rückabwicklungswerts', () => {
    const c = vertrag();
    delete c.rueckkaufswert;
    const a = ampelFuer(c);
    expect(a.ampel).toBe('gelb');
    expect(a.grund).toBe('kein-rueckkaufswert');
    expect(a.groessenordnung).toMatch(/sechsstelliger Betrag/);
  });

  it('Gelb für Verträge vor dem 29.07.1994 und 2008–2016, Rot erst ab 2017', () => {
    const alt1993 = ampelFuer(vertrag({ beginn: '1993-05' }));
    expect(alt1993.ampel).toBe('gelb');
    expect(alt1993.grund).toBe('vor-1994');

    const neu2010 = ampelFuer(vertrag({ beginn: '2010-05', erstbeitrag: { betrag: 100, waehrung: 'EUR' } }));
    expect(neu2010.ampel).toBe('gelb');
    expect(neu2010.grund).toBe('neu-2008');

    const neu2016 = ampelFuer(vertrag({ beginn: '2016-12', erstbeitrag: { betrag: 100, waehrung: 'EUR' } }));
    expect(neu2016.ampel).toBe('gelb');

    const neu2017 = ampelFuer(vertrag({ beginn: '2017-01', erstbeitrag: { betrag: 100, waehrung: 'EUR' } }));
    expect(neu2017.ampel).toBe('rot');
    expect(neu2017.grund).toBe('ab-2017');
  });

  it('Gelb für gekündigte Verträge mit offenem Netto-Anspruch (kein Kündigungs-Vergleich mehr)', () => {
    const a = ampelFuer(
      vertrag({ status: 'gekuendigt', statusDatum: '2020-06', rueckkaufswert: { betrag: 310658, standMonat: '2020-06' } }),
    );
    expect(a.ampel).toBe('gelb');
    expect(a.grund).toBe('beendet');
    expect(a.text).toContain('bereits bekommen');
  });

  it('Rot für reine Risikopolicen (Ausschluss)', () => {
    const e = eignung({ vertragsart: 'risiko-lv' });
    const a = bestimmeWirtschaftlicheAmpel(berechneRueckabwicklung(vertrag(), daten, defaults), e);
    expect(a.grund).toBe('ausschluss');
    expect(a.ampel).toBe('rot');
  });

  it('spricht ohne Euro-Beträge und mit kurzen Überschriften', () => {
    const faelle = [ampelFuer(vertrag()), ampelFuer(vertrag({ beginn: '2010-05', erstbeitrag: { betrag: 100, waehrung: 'EUR' } }))];
    for (const a of faelle) {
      expect(a.titel.split(/\s+/).length).toBeLessThanOrEqual(8);
      expect(`${a.titel} ${a.text} ${a.groessenordnung ?? ''}`).not.toContain('€');
      expect(a.groessenordnung ?? '').not.toMatch(/\d/);
    }
  });
});
