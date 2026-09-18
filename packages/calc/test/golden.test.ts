/**
 * Golden-Tests (CALC-SPEC Abschnitt 9.3) mit der ECHTEN Datenbasis
 * data/insurers.json (data.version wird mit eingefroren): die beiden
 * Beispielverträge aus docs/PROMPTS.md. Ändert sich die Datenbasis,
 * schlagen diese Tests bewusst fehl und die Snapshots sind nach fachlicher
 * Prüfung zu aktualisieren.
 */
import { describe, expect, it } from 'vitest';
import { berechneRueckabwicklung } from '../src/rueckabwicklung';
import type { CalcResultAlt, ContractInput, InsurersDaten, RiskDefaults } from '../src/types';
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

function alt(input: ContractInput): CalcResultAlt {
  const ergebnis = berechneRueckabwicklung(input, daten, defaults);
  if (ergebnis.regime !== 'alt-policenmodell') {
    throw new Error(`Unerwartetes Regime: ${ergebnis.regime}`);
  }
  return ergebnis;
}

function szenarienKompakt(e: CalcResultAlt) {
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
          "mehrwertGegenKuendigung": -3561.75,
          "nutzungen": 11207.25,
          "nutzungenProzent": 43.8,
          "rueckabwicklungswert": 36295.25,
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
          "mehrwertGegenKuendigung": 313490.3,
          "nutzungen": 211060.6,
          "nutzungenProzent": 48,
          "rueckabwicklungswert": 624148.3,
        },
        "max": {
          "erstattung": 426271.35,
          "mehrwertGegenKuendigung": 341953.42,
          "nutzungen": 226340.07,
          "nutzungenProzent": 51.5,
          "rueckabwicklungswert": 652611.42,
        },
        "min": {
          "erstattung": 395509.5,
          "mehrwertGegenKuendigung": 282589.53,
          "nutzungen": 197738.03,
          "nutzungenProzent": 45,
          "rueckabwicklungswert": 593247.53,
        },
      }
    `);
  });

  it('hält die Plausibilitätsgrenzen ein (keine PLAUSIBILITAET-Warnung)', () => {
    expect(ergebnis.warnungen.every((w) => w.code !== 'PLAUSIBILITAET_NUTZUNGEN')).toBe(true);
  });
});
