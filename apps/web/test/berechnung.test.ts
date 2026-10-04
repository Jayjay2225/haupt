/**
 * Abbildung Formular-Entwurf → Rechenkern (lib/berechnung.ts): heutiger
 * Beitrag mit Dynamik wird zurückgerechnet (keine doppelte Dynamisierung),
 * unbekannter Erstbeitrag aus der Beitragssumme ohne Abweichungs-Warnung,
 * Beitragsfreistellung endet im Vormonat, stehengebliebene Datumsfelder
 * reisen nicht mit, DM nur vor 2002, Jahresangabe geht als Jahr in den
 * Eignungs-Check.
 */
import { describe, expect, it } from 'vitest';
import { baueBeitragsreihe, berechneRueckabwicklung } from '@rueckab/calc';
import type { RiskDefaults } from '@rueckab/calc';
import riskJson from '../../../data/risk-defaults.json';
import { draftZuEingaben } from '../lib/berechnung';
import { leererDraft, type CaseDraft } from '../lib/draft';
import { findeVersichererId, insurersDaten } from '../lib/insurers-data';

const riskDefaults = riskJson as unknown as RiskDefaults;
const STICHTAG = '2026-09';

function draft(anpassung: Partial<CaseDraft>): CaseDraft {
  return {
    ...leererDraft(),
    vertragsart: 'kapital-lv',
    status: 'laufend',
    versicherer: 'Allianz Lebensversicherungs-AG',
    beginn: '2004-01',
    zahlweise: 'monatlich',
    erstbeitrag: '100',
    erstbeitragWaehrung: 'EUR',
    dynamik: 'nein',
    rueckkaufswert: '20.000',
    auszahlungenErhalten: 'nein',
    ...anpassung,
  };
}

describe('draftZuEingaben', () => {
  it('„heutiger Beitrag“ + Dynamik: rechnet auf den ersten Beitrag zurück, der Rechenkern landet wieder beim heutigen', () => {
    const e = draftZuEingaben(draft({ beitragArt: 'heutiger', erstbeitrag: '100', dynamik: 'ja', dynamikSatz: '5' }), findeVersichererId, STICHTAG);
    expect(e.fehler).toEqual([]);
    // 01/2004 bis 09/2026: 273 Monate → 22 Erhöhungstermine ab dem 2. Vertragsjahr.
    const termine = 22;
    expect(e.contract.erstbeitrag.betrag).toBeCloseTo(100 / Math.pow(1.05, termine), 2);
    expect(e.contract.aktuellerBeitrag).toBeUndefined();
    expect(e.contract.dynamik).toEqual({ aktiv: true, satzProzent: 5 });
    expect(e.zusatzAnnahmen.join(' ')).toContain(`über ${termine} jährliche Dynamik-Erhöhungen zurückgerechnet`);
    const reihe = baueBeitragsreihe(e.contract).reihe;
    expect(reihe[reihe.length - 1]!.betrag).toBeCloseTo(100, 1);
    // Ohne Dynamik gilt der heutige Beitrag als konstant.
    const konstant = draftZuEingaben(draft({ beitragArt: 'heutiger', erstbeitrag: '100' }), findeVersichererId, STICHTAG);
    expect(konstant.contract.erstbeitrag.betrag).toBe(100);
    expect(konstant.zusatzAnnahmen.join(' ')).toContain('als von Beginn an konstant unterstellt');
  });

  it('„Weiß ich nicht“ beim Beitrag gewinnt gegen einen vorher eingetippten Wert', () => {
    const e = draftZuEingaben(
      draft({ beitragArt: 'heutiger', erstbeitrag: '999', erstbeitragUnbekannt: true, gesamtsummeLautMitteilung: '27.300' }),
      findeVersichererId,
      STICHTAG,
    );
    expect(e.fehler).toEqual([]);
    expect(e.contract.erstbeitrag.betrag).toBeCloseTo(100, 2); // 273 Monate × 100 €
    expect(e.zusatzAnnahmen.join(' ')).toContain('Der erste Beitrag war nicht bekannt');
  });

  it('unbekannter Erstbeitrag mit Dynamik: Reihe aus der Beitragssumme ohne Abweichungs-Warnung', () => {
    const e = draftZuEingaben(
      draft({ erstbeitragUnbekannt: true, erstbeitrag: '', dynamik: 'ja', dynamikSatz: '3', gesamtsummeLautMitteilung: '40.000' }),
      findeVersichererId,
      STICHTAG,
    );
    expect(e.fehler).toEqual([]);
    const calc = berechneRueckabwicklung(e.contract, insurersDaten, riskDefaults);
    expect(calc.warnungen.some((w) => w.code === 'BEITRAGSREIHE_ABWEICHUNG')).toBe(false);
    expect(calc.szenarien.basis.summeBeitraege).toBeCloseTo(40000, 0);
  });

  it('Beitragsfreistellung: letzter Beitrag im Vormonat; Datum nur bei beendeten/beitragsfreien Verträgen', () => {
    const frei = draftZuEingaben(draft({ status: 'beitragsfrei', statusDatum: '2015-01' }), findeVersichererId, STICHTAG);
    expect(frei.contract.beitragszahlungBis).toBe('2014-12');
    expect(frei.contract.statusDatum).toBe('2015-01');
    // Ein stehengebliebenes Datum aus einem früheren Statuswechsel reist bei „Läuft“ nicht mit.
    const laufend = draftZuEingaben(draft({ status: 'laufend', statusDatum: '2015-01' }), findeVersichererId, STICHTAG);
    expect(laufend.contract.statusDatum).toBeUndefined();
    expect(laufend.contract.beitragszahlungBis).toBeUndefined();
    // Beendet ohne Datum: Annahme benennt die Wirkung.
    const ohne = draftZuEingaben(draft({ status: 'gekuendigt', statusDatum: '' }), findeVersichererId, STICHTAG);
    expect(ohne.zusatzAnnahmen.join(' ')).toContain('bis zum Stichtag weitergezahlt');
    // Beitragsfrei ohne Datum: dieselbe Rechenweise – mit Annahme.
    const freiOhne = draftZuEingaben(draft({ status: 'beitragsfrei', statusDatum: '' }), findeVersichererId, STICHTAG);
    expect(freiOhne.zusatzAnnahmen.join(' ')).toContain('beitragsfrei, aber ohne Datum');
    // Ein Datum nach dem Stichtag zählt wie der Stichtag (Rechenkern deckelt ebenso).
    const zukunft = draftZuEingaben(
      draft({ beitragArt: 'heutiger', erstbeitrag: '200', dynamik: 'ja', dynamikSatz: '5', status: 'beitragsfrei', statusDatum: '2027-05' }),
      findeVersichererId,
      STICHTAG,
    );
    const reihe = baueBeitragsreihe(zukunft.contract).reihe;
    expect(reihe[reihe.length - 1]!.betrag).toBeCloseTo(200, 1);
  });

  it('unbekannter Erstbeitrag: Zahlungszählung wie der Rechenkern für alle Zahlweisen, Einmalbeitrag = eine Zahlung', () => {
    const faelle: [CaseDraft['zahlweise'], string, string][] = [
      ['jaehrlich', '2010-12', '2015-01'],
      ['halbjaehrlich', '2010-12', '2015-01'],
      ['vierteljaehrlich', '1995-10', '2018-03'],
      ['jaehrlich', '1995-10', '2018-03'],
    ];
    for (const [zahlweise, beginn, statusDatum] of faelle) {
      const e = draftZuEingaben(
        draft({ zahlweise, beginn, status: 'beitragsfrei', statusDatum, dynamik: 'ja', dynamikSatz: '5', erstbeitragUnbekannt: true, erstbeitrag: '', gesamtsummeLautMitteilung: '40.000' }),
        findeVersichererId,
        STICHTAG,
      );
      expect(e.fehler).toEqual([]);
      const calc = berechneRueckabwicklung(e.contract, insurersDaten, riskDefaults);
      expect(calc.warnungen.some((w) => w.code === 'BEITRAGSREIHE_ABWEICHUNG'), `${zahlweise} ${beginn}`).toBe(false);
      const skaliert = calc.annahmen.find((a) => a.code === 'REIHE_SKALIERT')?.text ?? '';
      expect(skaliert, `${zahlweise} ${beginn}: ${skaliert}`).toMatch(/Faktor (1,0000|0,9999|1,0001)\)/);
    }
    const einmal = draftZuEingaben(
      draft({ zahlweise: 'einmalbeitrag', erstbeitragUnbekannt: true, erstbeitrag: '', gesamtsummeLautMitteilung: '50.000' }),
      findeVersichererId,
      STICHTAG,
    );
    expect(einmal.contract.erstbeitrag.betrag).toBe(50000);
    const calcEinmal = berechneRueckabwicklung(einmal.contract, insurersDaten, riskDefaults);
    expect(calcEinmal.warnungen.some((w) => w.code === 'BEITRAGSREIHE_ABWEICHUNG')).toBe(false);
  });

  it('DM-Kennzeichen gilt nur für Verträge vor 2002', () => {
    expect(draftZuEingaben(draft({ beginn: '1999-01', erstbeitragWaehrung: 'DM' }), findeVersichererId, STICHTAG).contract.erstbeitrag.waehrung).toBe('DM');
    expect(draftZuEingaben(draft({ beginn: '2005-01', erstbeitragWaehrung: 'DM' }), findeVersichererId, STICHTAG).contract.erstbeitrag.waehrung).toBe('EUR');
  });

  it('Dynamiksatz mit Prozentzeichen; ohne Satz ohne Erhöhungen mit Annahme', () => {
    expect(draftZuEingaben(draft({ dynamik: 'ja', dynamikSatz: '5 %' }), findeVersichererId, STICHTAG).contract.dynamik).toEqual({ aktiv: true, satzProzent: 5 });
    const ohne = draftZuEingaben(draft({ dynamik: 'ja', dynamikSatz: '' }), findeVersichererId, STICHTAG);
    expect(ohne.contract.dynamik).toEqual({ aktiv: true });
    expect(ohne.zusatzAnnahmen.join(' ')).toContain('gerechnet wurde ohne Erhöhungen');
  });

  it('nur Jahr bekannt: Jahresmitte in die Rechnung, Jahr in den Eignungs-Check', () => {
    const e = draftZuEingaben(draft({ beginn: '1994-06', beginnUngefaehr: true }), findeVersichererId, STICHTAG);
    expect(e.contract.beginn).toBe('1994-06');
    expect(e.eligibility.vertragsschluss).toBe('1994');
    expect(e.zusatzAnnahmen.join(' ')).toContain('nur ungefähr bekannt (Jahr 1994)');
    expect(draftZuEingaben(draft({ beginn: '1994-06' }), findeVersichererId, STICHTAG).eligibility.vertragsschluss).toBe('1994-06');
  });
});
