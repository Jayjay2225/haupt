import { describe, expect, it } from 'vitest';
import { berechneRueckabwicklung } from '../src/rueckabwicklung';
import { zinseAuf } from '../src/nutzungen';
import { monatsIndex } from '../src/monat';
import { riskDefaults, testDaten, vertrag } from './fixtures';
import type { CalcResultAlt, ContractInput } from '../src/types';

const daten = testDaten();
const defaults = riskDefaults();

function alt(input: ContractInput): CalcResultAlt {
  const ergebnis = berechneRueckabwicklung(input, daten, defaults);
  if (ergebnis.regime !== 'alt-policenmodell') {
    throw new Error(`Unerwartetes Regime: ${ergebnis.regime}`);
  }
  return ergebnis;
}

describe('Regime-Bestimmung', () => {
  it('lehnt Verträge vor dem 29.07.1994 ab', () => {
    const ergebnis = berechneRueckabwicklung(vertrag({ beginn: '1994-06' }), daten, defaults);
    expect(ergebnis.regime).toBe('vor-1994');
  });

  it('warnt beim Grenzmonat Juli 1994', () => {
    const ergebnis = alt(vertrag({ beginn: '1994-07', stichtag: '2000-01' }));
    expect(ergebnis.warnungen.some((w) => w.code === 'GRENZMONAT')).toBe(true);
  });

  it('liefert für Verträge ab 2008 die vereinfachte Widerrufs-Darstellung', () => {
    const ergebnis = berechneRueckabwicklung(
      vertrag({ beginn: '2010-01', stichtag: '2020-01', rueckkaufswert: { betrag: 5000 } }),
      daten,
      defaults,
    );
    expect(ergebnis.regime).toBe('neu-2008');
    if (ergebnis.regime === 'neu-2008') {
      expect(ergebnis.vergleich.praemienErstesJahr).toBeCloseTo(1200, 2);
      expect(ergebnis.vergleich.rueckkaufswert).toBe(5000);
    }
  });
});

describe('Eigenschaften der Berechnung', () => {
  const basisInput = vertrag({
    beginn: '2000-01',
    stichtag: '2009-12',
    beitragszahlungBis: '2009-12',
    szenarioOverrides: { risikoanteilProzent: 0, verwaltungskostenProzent: 0, abschlusskostenNull: true },
  });

  it('entspricht ohne Kosten und Risiko der Annuitätenformel (monatliche Verzinsung)', () => {
    // Direkt auf der Aufzinsungsfunktion, volle Gleitkommagenauigkeit:
    const einzahlungen = new Map<number, number>();
    const von = monatsIndex('2000-01');
    const bis = monatsIndex('2009-12');
    for (let m = von; m <= bis; m += 1) {
      einzahlungen.set(m, 100);
    }
    const i = 0.04 / 12;
    const n = bis - von + 1;
    const erwartet = 100 * ((Math.pow(1 + i, n) - 1) / i);
    const konstanteZinsen = new Map<number, number>();
    for (let jahr = 2000; jahr <= 2009; jahr += 1) {
      konstanteZinsen.set(jahr, 4);
    }
    const ergebnis = zinseAuf(einzahlungen, konstanteZinsen, von, bis);
    expect(Math.abs(ergebnis.endwert - erwartet) / erwartet).toBeLessThan(1e-10);

    // Und über den Orchestrator (Cent-Rundung):
    const kern = alt({ ...basisInput, szenarioOverrides: { ...basisInput.szenarioOverrides, zinssatzProzent: 4 } });
    expect(kern.szenarien.basis.rueckabwicklungswert).toBeCloseTo(erwartet, 1);
    expect(kern.szenarien.basis.erstattungsfaehigeBeitraege).toBeCloseTo(100 * n, 6);
  });

  it('höherer Zinssatz ⇒ höhere Nutzungen', () => {
    const niedrig = alt({ ...basisInput, szenarioOverrides: { ...basisInput.szenarioOverrides, zinssatzProzent: 3 } });
    const hoch = alt({ ...basisInput, szenarioOverrides: { ...basisInput.szenarioOverrides, zinssatzProzent: 5 } });
    expect(hoch.szenarien.basis.nutzungen).toBeGreaterThan(niedrig.szenarien.basis.nutzungen);
  });

  it('Skalierung der Beitragsreihe skaliert das Ergebnis proportional', () => {
    const einfach = alt(vertrag({ stichtag: '2007-12', gesamtsummeLautMitteilung: 9600 }));
    const doppelt = alt(vertrag({ stichtag: '2007-12', gesamtsummeLautMitteilung: 19200 }));
    // Toleranz: Cent-Rundung der Ausgabefelder erlaubt Abweichungen ~1e-5.
    expect(doppelt.szenarien.basis.rueckabwicklungswert / einfach.szenarien.basis.rueckabwicklungswert).toBeCloseTo(2, 4);
    expect(doppelt.szenarien.basis.nutzungen / einfach.szenarien.basis.nutzungen).toBeCloseTo(2, 4);
  });

  it('ordnet die Szenarien: Min ≤ Basis ≤ Max', () => {
    const ergebnis = alt(vertrag({ versichererId: 'test-vers', stichtag: '2009-12' }));
    expect(ergebnis.szenarien.min.rueckabwicklungswert).toBeLessThanOrEqual(ergebnis.szenarien.basis.rueckabwicklungswert);
    expect(ergebnis.szenarien.basis.rueckabwicklungswert).toBeLessThanOrEqual(ergebnis.szenarien.max.rueckabwicklungswert);
  });

  it('rechnet erhaltene Leistungen mit Gegenverzinsung an', () => {
    const ohne = alt(vertrag({ stichtag: '2009-12' }));
    const mit = alt(vertrag({ stichtag: '2009-12', auszahlungen: [{ monat: '2005-01', betrag: 1000 }] }));
    expect(mit.szenarien.basis.erhalteneLeistungenAufgezinst).toBeGreaterThan(1000); // 1,2 % p. a. ab 2005
    expect(mit.szenarien.basis.nettoanspruch).toBeCloseTo(
      ohne.szenarien.basis.nettoanspruch - mit.szenarien.basis.erhalteneLeistungenAufgezinst,
      1,
    );
  });

  it('rechnet bei gekündigten Verträgen den Rückkaufswert als erhaltene Leistung an', () => {
    const ergebnis = alt(
      vertrag({
        status: 'gekuendigt',
        statusDatum: '2008-01',
        rueckkaufswert: { betrag: 5000 },
        stichtag: '2009-12',
      }),
    );
    expect(ergebnis.annahmen.some((a) => a.code === 'RKW_ALS_LEISTUNG')).toBe(true);
    expect(ergebnis.szenarien.basis.erhalteneLeistungenAufgezinst).toBeGreaterThan(5000);
    expect(ergebnis.szenarien.basis.mehrwertGegenKuendigung).toBeUndefined();
  });

  it('setzt das Kein-Vorteil-Flag, wenn der Basiswert unter dem Rückkaufswert liegt', () => {
    const ergebnis = alt(
      vertrag({ stichtag: '2004-12', rueckkaufswert: { betrag: 1000000 } }),
    );
    expect(ergebnis.szenarien.basis.wirtschaftlichKeinVorteil).toBe(true);
    expect(ergebnis.szenarien.basis.mehrwertGegenKuendigung).toBeLessThan(0);
  });

  it('liefert eine konsistente Jahrestabelle (Summen entsprechen dem Szenario Basis)', () => {
    const ergebnis = alt(vertrag({ versichererId: 'test-vers', stichtag: '2009-12' }));
    const summeBeitraege = ergebnis.jahrestabelle.reduce((a, z) => a + z.beitraege, 0);
    const summeNutzungen = ergebnis.jahrestabelle.reduce((a, z) => a + z.nutzungenImJahr, 0);
    expect(summeBeitraege).toBeCloseTo(ergebnis.szenarien.basis.summeBeitraege, 1);
    expect(summeNutzungen).toBeCloseTo(ergebnis.szenarien.basis.nutzungen, 1);
  });
});
