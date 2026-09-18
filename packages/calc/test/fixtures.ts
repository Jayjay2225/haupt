/**
 * SYNTHETISCHE Testdaten für Unit- und Property-Tests. Diese Reihen sind
 * ausdrücklich KEINE echten Kennzahlen (CALC-SPEC Abschnitt 9) – sie sind
 * frei gewählt, damit die Rechenwege deterministisch prüfbar sind.
 * Die Golden-Tests verwenden dagegen die echte data/insurers.json.
 */
import type { ContractInput, InsurersDaten, Kennzahl, Quelle, RiskDefaults } from '../src/types';
import risikoDefaultsJson from '../../../data/risk-defaults.json';

const Q_TEST: Quelle = {
  typ: 'estimate',
  titel: 'Synthetische Testdaten (keine echten Kennzahlen)',
  dokument: 'packages/calc/test/fixtures.ts',
};

function kz(wert: number): Kennzahl {
  return { wert, einheit: '%', quelle: Q_TEST, confidence: 'low' };
}

export function testDaten(): InsurersDaten {
  const branchenNetto: Record<string, Kennzahl> = {};
  for (let jahr = 1994; jahr <= 2026; jahr += 1) {
    const wert =
      jahr <= 1999 ? 7.0 : jahr === 2000 ? 7.5 : jahr === 2001 ? 6.0 : jahr <= 2007 ? 5.0 : jahr === 2008 ? 3.5 : jahr <= 2017 ? 4.2 : jahr <= 2021 ? 3.6 : 2.3;
    branchenNetto[String(jahr)] = kz(wert);
  }
  // Lücke für Fallback-Tests:
  delete branchenNetto['2012'];

  return {
    data: { version: '0.0.0-test', stand: '2026-09-18' },
    branchendurchschnitt: { nettoverzinsung: branchenNetto },
    referenzzinsen: {
      basiszinsBGB247: { werte: [{ gueltigAb: '2002-01-01', wert: 2.57, quelle: Q_TEST }] },
      einlagenzins: { werte: [{ gueltigAb: '2003-01-01', wert: 1.2, quelle: Q_TEST }] },
    },
    rechnungsgrundlagen: {
      hoechstzillmersatz: {
        werte: [
          { gueltigAb: '1994-01-01', wert: 40, quelle: Q_TEST },
          { gueltigAb: '2015-01-01', wert: 25, quelle: Q_TEST },
        ],
      },
      hoechstrechnungszins: { werte: [{ gueltigAb: '1994-07-01', wert: 4, quelle: Q_TEST }] },
    },
    insurers: [
      {
        id: 'test-vers',
        kanonischerName: 'Test Lebensversicherung AG (synthetisch)',
        altnamen: [],
        kennzahlen: Object.fromEntries(
          Array.from({ length: 11 }, (_, i) => 2000 + i).map((jahr) => [
            String(jahr),
            { nettoverzinsung: kz(6.0), laufendeDurchschnittsverzinsung: kz(5.5) },
          ]),
        ),
      },
      {
        id: 'alt-vers',
        kanonischerName: 'Alt Versicherung (synthetisch, Bestand übertragen)',
        altnamen: ['Uralt Leben'],
        kennzahlenVon: { insurerId: 'test-vers', abJahr: 2005, begruendung: 'Bestandsübertragung (Testszenario)' },
        kennzahlen: { '2003': { nettoverzinsung: kz(3.3) } },
      },
    ],
  };
}

export function riskDefaults(): RiskDefaults {
  return risikoDefaultsJson as unknown as RiskDefaults;
}

/** Einfacher Standardvertrag; Felder per Override anpassbar. */
export function vertrag(anpassung: Partial<ContractInput> = {}): ContractInput {
  return {
    versichererId: 'unbekannt',
    vertragsart: 'kapital-lv',
    beginn: '2000-01',
    zahlweise: 'monatlich',
    erstbeitrag: { betrag: 100, waehrung: 'EUR' },
    dynamik: { aktiv: false },
    status: 'laufend',
    eintrittsalter: 40,
    stichtag: '2010-01',
    ...anpassung,
  };
}
