/**
 * Golden-Tests (CALC-SPEC Abschnitt 9.3) mit der ECHTEN Datenbasis
 * data/insurers.json (data.version wird mit eingefroren): die beiden
 * Beispielverträge aus docs/PROMPTS.md. Ändert sich die Datenbasis,
 * schlagen diese Tests bewusst fehl und die Snapshots sind nach fachlicher
 * Prüfung zu aktualisieren.
 */
import { describe, expect, it } from 'vitest';
import { berechneRueckabwicklung } from '../src/rueckabwicklung';
import type { CalcResult, ContractInput, InsurersDaten, RiskDefaults } from '../src/types';
import insurersJson from '../../../data/insurers.json';
import riskJson from '../../../data/risk-defaults.json';

const daten = insurersJson as unknown as InsurersDaten;
const defaults = riskJson as unknown as RiskDefaults;

/** Vertrag (a): private Rentenversicherung, Beginn 12/2004, 1.200 € jährlich,
 * 25.600 € eingezahlt, laufend, Rückkaufswert 39.857 €. */
const vertragA: ContractInput = {
  versichererId: 'unbekannt',
  vertragsart: 'private-rv',
  beginn: '2004-12',
  zahlweise: 'jaehrlich',
  erstbeitrag: { betrag: 1200, waehrung: 'EUR' },
  dynamik: { aktiv: false },
  gesamtsummeLautMitteilung: 25600,
  status: 'laufend',
  rueckkaufswert: { betrag: 39857 },
  eintrittsalter: 40,
  stichtag: '2026-09',
};

/** Vertrag (b): Kapitallebensversicherung, Beginn 10/1995, Dynamik,
 * 439.455 € eingezahlt, laufend, Rückkaufswert 310.658 €. */
const vertragB: ContractInput = {
  versichererId: 'allianz-leben',
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
};

function alt(input: ContractInput): CalcResult {
  return berechneRueckabwicklung(input, daten, defaults);
}

function szenarienKompakt(e: CalcResult) {
  return Object.fromEntries(
    (['min', 'basis', 'max'] as const).map((name) => {
      const s = e.szenarien[name];
      return [
        name,
        {
          erstattung: s.erstattungsfaehigeBeitraege,
          nutzungen: s.nutzungen,
          rueckabwicklungswert: s.rueckabwicklungswert,
          mehrwertGegenKuendigung: s.mehrwertGegenKuendigung,
          nutzungenProzent: s.nutzungenProzentDerBeitraege,
        },
      ];
    }),
  );
}

describe('Golden-Vertrag (a): private Rentenversicherung 12/2004', () => {
  const ergebnis = alt(vertragA);

  it('meldet im Basis-Szenario „wirtschaftlich kein Vorteil erkennbar“', () => {
    expect(ergebnis.szenarien.basis.rueckabwicklungswert).toBeLessThanOrEqual(vertragA.rueckkaufswert!.betrag);
    expect(ergebnis.szenarien.basis.wirtschaftlichKeinVorteil).toBe(true);
  });

  it('nutzt den Branchendurchschnitt (Versicherer unbekannt) und markiert das', () => {
    expect(ergebnis.annahmen.some((a) => a.code === 'VERSICHERER_UNBEKANNT')).toBe(true);
    expect(ergebnis.szenarien.basis.zinsreihe.every((j) => j.herkunft !== 'insurer')).toBe(true);
  });

  it('alle drei Szenarien (Snapshot gegen data.version ' + daten.data.version + ')', () => {
    expect(szenarienKompakt(ergebnis)).toMatchInlineSnapshot(`
      {
        "basis": {
          "erstattung": 25344,
          "mehrwertGegenKuendigung": -3038.79,
          "nutzungen": 11474.21,
          "nutzungenProzent": 44.8,
          "rueckabwicklungswert": 36818.21,
        },
        "max": {
          "erstattung": 25600,
          "mehrwertGegenKuendigung": -2248.86,
          "nutzungen": 12008.14,
          "nutzungenProzent": 46.9,
          "rueckabwicklungswert": 37608.14,
        },
        "min": {
          "erstattung": 25088,
          "mehrwertGegenKuendigung": -5535.21,
          "nutzungen": 9233.79,
          "nutzungenProzent": 36.1,
          "rueckabwicklungswert": 34321.79,
        },
      }
    `);
  });
});

describe('Golden-Vertrag (b): Kapitallebensversicherung 10/1995 mit Dynamik', () => {
  const ergebnis = alt(vertragB);

  it('bildet die Beitragssumme laut Mitteilung ab', () => {
    expect(ergebnis.szenarien.basis.summeBeitraege).toBeCloseTo(439455, 0);
  });

  it('weist einen Mehrwert gegenüber der Kündigung aus (alle Szenarien positiv)', () => {
    expect(ergebnis.szenarien.min.mehrwertGegenKuendigung).toBeGreaterThan(0);
    expect(ergebnis.szenarien.basis.wirtschaftlichKeinVorteil).toBe(false);
  });

  it('überbrückt fehlende Branchenjahre (1996–1998, 2025–2026) mit Warnung', () => {
    expect(ergebnis.warnungen.filter((w) => w.code === 'ZINSREIHE_LUECKE').length).toBeGreaterThan(0);
  });

  it('alle drei Szenarien (Snapshot gegen data.version ' + daten.data.version + ')', () => {
    expect(szenarienKompakt(ergebnis)).toMatchInlineSnapshot(`
      {
        "basis": {
          "erstattung": 413087.7,
          "mehrwertGegenKuendigung": 328940.15,
          "nutzungen": 226510.45,
          "nutzungenProzent": 51.5,
          "rueckabwicklungswert": 639598.15,
        },
        "max": {
          "erstattung": 426271.35,
          "mehrwertGegenKuendigung": 356803.91,
          "nutzungen": 241190.56,
          "nutzungenProzent": 54.9,
          "rueckabwicklungswert": 667461.91,
        },
        "min": {
          "erstattung": 395509.5,
          "mehrwertGegenKuendigung": 285902.33,
          "nutzungen": 201050.83,
          "nutzungenProzent": 45.8,
          "rueckabwicklungswert": 596560.33,
        },
      }
    `);
  });

  it('hält die Plausibilitätsgrenzen ein (keine PLAUSIBILITAET-Warnung)', () => {
    expect(ergebnis.warnungen.every((w) => w.code !== 'PLAUSIBILITAET_NUTZUNGEN')).toBe(true);
  });
});
