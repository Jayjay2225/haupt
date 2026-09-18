import { describe, expect, it } from 'vitest';
import { baueBeitragsreihe, DM_KURS } from '../src/beitragsreihe';
import { monatsIndex } from '../src/monat';
import { vertrag } from './fixtures';

describe('Beitragsreihe', () => {
  it('erzeugt monatliche Beiträge vom Beginn bis zum Stichtag', () => {
    const { reihe } = baueBeitragsreihe(vertrag({ beginn: '2000-01', stichtag: '2000-12' }));
    expect(reihe).toHaveLength(12);
    expect(reihe[0]).toEqual({ index: monatsIndex('2000-01'), betrag: 100 });
  });

  it('setzt die Zahlweise um (vierteljährlich, jährlich, Einmalbeitrag)', () => {
    expect(baueBeitragsreihe(vertrag({ zahlweise: 'vierteljaehrlich', stichtag: '2000-12' })).reihe).toHaveLength(4);
    expect(baueBeitragsreihe(vertrag({ zahlweise: 'jaehrlich', stichtag: '2005-06' })).reihe).toHaveLength(6);
    expect(baueBeitragsreihe(vertrag({ zahlweise: 'einmalbeitrag', stichtag: '2010-01' })).reihe).toHaveLength(1);
  });

  it('erhöht mit Dynamik ab dem zweiten Vertragsjahr und überspringt ausgesetzte Jahre', () => {
    const { reihe } = baueBeitragsreihe(
      vertrag({
        zahlweise: 'jaehrlich',
        erstbeitrag: { betrag: 1000, waehrung: 'EUR' },
        dynamik: { aktiv: true, satzProzent: 10, ausgesetzteVertragsjahre: [3] },
        stichtag: '2003-06',
      }),
    );
    expect(reihe.map((b) => Math.round(b.betrag))).toEqual([1000, 1100, 1100, 1210]);
  });

  it('rechnet DM-Erstbeiträge mit 1,95583 um und vermerkt die Annahme', () => {
    const ergebnis = baueBeitragsreihe(vertrag({ erstbeitrag: { betrag: 100, waehrung: 'DM' }, stichtag: '2000-03' }));
    expect(ergebnis.reihe[0]!.betrag).toBeCloseTo(100 / DM_KURS, 10);
    expect(ergebnis.annahmen.some((a) => a.code === 'DM_UMRECHNUNG')).toBe(true);
  });

  it('leitet den Dynamiksatz aus Erst- und aktuellem Beitrag her', () => {
    const ergebnis = baueBeitragsreihe(
      vertrag({
        beginn: '2000-01',
        stichtag: '2010-01',
        beitragszahlungBis: '2010-01',
        erstbeitrag: { betrag: 100, waehrung: 'EUR' },
        aktuellerBeitrag: 200,
        dynamik: { aktiv: true },
      }),
    );
    expect(ergebnis.dynamiksatzProzent).toBeCloseTo((Math.pow(2, 1 / 10) - 1) * 100, 6);
    expect(ergebnis.annahmen.some((a) => a.code === 'DYNAMIK_HERGELEITET')).toBe(true);
  });

  it('skaliert auf die Gesamtsumme laut Mitteilung und warnt ab 5 % Abweichung', () => {
    const mitWarnung = baueBeitragsreihe(
      vertrag({ stichtag: '2000-12', gesamtsummeLautMitteilung: 1440 }), // 12×100 → Faktor 1,2
    );
    expect(mitWarnung.reihe.reduce((a, b) => a + b.betrag, 0)).toBeCloseTo(1440, 8);
    expect(mitWarnung.warnungen.some((w) => w.code === 'BEITRAGSREIHE_ABWEICHUNG')).toBe(true);

    const ohneWarnung = baueBeitragsreihe(
      vertrag({ stichtag: '2000-12', gesamtsummeLautMitteilung: 1224 }), // Faktor 1,02
    );
    expect(ohneWarnung.warnungen).toHaveLength(0);
  });

  it('endet die Beitragszahlung im Monat vor der Beitragsfreistellung', () => {
    const { reihe } = baueBeitragsreihe(
      vertrag({ status: 'beitragsfrei', statusDatum: '2005-01', stichtag: '2010-01' }),
    );
    expect(reihe[reihe.length - 1]!.index).toBe(monatsIndex('2004-12'));
    expect(reihe).toHaveLength(60);
  });
});
