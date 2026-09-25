import { describe, expect, it } from 'vitest';
import { baueBeitragsreihe } from '../src/beitragsreihe';
import { teileBeitraegeAuf } from '../src/aufteilung';
import { riskDefaults, testDaten, vertrag } from './fixtures';

const daten = testDaten();
const defaults = riskDefaults();

describe('Beitragsaufteilung', () => {
  it('tilgt Abschlusskosten vor 2008 aus den ersten Beiträgen (Zillmerung)', () => {
    const input = vertrag({ beginn: '2000-01', stichtag: '2001-12', beitragszahlungBis: '2001-12' });
    const reihe = baueBeitragsreihe(input).reihe; // 24 × 100 €
    const { monate, warnungen, risikoanteilProzent } = teileBeitraegeAuf(reihe, input, daten, defaults, 'basis');

    // kapital-lv, Eintrittsalter 40 → Band bis 50, mid = 6 %
    expect(risikoanteilProzent).toBe(6);
    const abschlussGesamt = monate.reduce((a, m) => a + m.abschluss, 0);
    expect(abschlussGesamt).toBeCloseTo(0.04 * 2400, 6); // 40 ‰ der Beitragssumme
    // Erster Beitrag: 100 − 6 Risiko = 94 → vollständig Abschlusskosten, Sparanteil 0.
    expect(monate[0]!.abschluss).toBeCloseTo(94, 6);
    expect(monate[0]!.sparanteil).toBe(0);
    expect(warnungen.some((w) => w.code === 'SPARANTEIL_NEGATIV')).toBe(true);
    // Später: keine Abschlusskosten mehr, Verwaltung 3 % (mid), Rest Sparanteil.
    const spaet = monate[5]!;
    expect(spaet.abschluss).toBe(0);
    expect(spaet.verwaltung).toBeCloseTo(3, 6);
    expect(spaet.sparanteil).toBeCloseTo(100 - 6 - 3, 6);
  });

  it('verteilt Abschlusskosten ab 2008 gleichmäßig auf die ersten 60 Monate', () => {
    const input = vertrag({ beginn: '2010-01', stichtag: '2016-12', beitragszahlungBis: '2016-12' });
    const reihe = baueBeitragsreihe(input).reihe;
    const { monate } = teileBeitraegeAuf(reihe, input, daten, defaults, 'basis');
    const beitragssumme = reihe.reduce((a, b) => a + b.betrag, 0);
    // 40 ‰ (Abschlussjahr 2010) gleichmäßig: je Beitrag der ersten 60 Monate.
    const proMonat = (0.04 * beitragssumme) / 60;
    expect(monate[0]!.abschluss).toBeCloseTo(proMonat, 6);
    expect(monate[59]!.abschluss).toBeCloseTo(proMonat, 6);
    expect(monate[60]!.abschluss).toBe(0);
  });

  it('behandelt BUZ-Anteile zu 100 % als Risikoanteil', () => {
    const input = vertrag({ buzBeitragsanteilProzent: 10, szenarioOverrides: { abschlusskostenNull: true } });
    const reihe = baueBeitragsreihe(input).reihe;
    const { monate } = teileBeitraegeAuf(reihe, input, daten, defaults, 'basis');
    const m = monate[10]!;
    expect(m.buz).toBeCloseTo(10, 8);
    expect(m.risiko).toBeCloseTo(90 * 0.06, 8);
  });

  it('variiert den Risikoanteil je Szenario (Min oben, Max unten)', () => {
    const input = vertrag();
    const reihe = baueBeitragsreihe(input).reihe;
    expect(teileBeitraegeAuf(reihe, input, daten, defaults, 'min').risikoanteilProzent).toBe(10);
    expect(teileBeitraegeAuf(reihe, input, daten, defaults, 'basis').risikoanteilProzent).toBe(6);
    expect(teileBeitraegeAuf(reihe, input, daten, defaults, 'max').risikoanteilProzent).toBe(3);
  });
});
