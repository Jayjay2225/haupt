/**
 * Musterfälle: Zahlen kommen aus dem eigenen Rechenkern mit der echten
 * Datenbasis, werden GERUNDET ausgegeben und tragen den Zusatz „Musterfall,
 * Schätzung mit Bandbreite“. Seit Prompt 12 dient der erste Fall vor allem
 * der Berichtsvorschau (scripts/bericht-vorschau.ts) und den Tests.
 * Serverseitig verwenden (importiert die Datenbank).
 */
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { ContractInput, RiskDefaults } from '@rueckab/calc';
import riskJson from '../../../data/risk-defaults.json';
import { insurersDaten } from './insurers-data';
import { bestimmeWirtschaftlicheAmpel, type WirtschaftlicheAmpel } from './ampel';

const riskDefaults = riskJson as unknown as RiskDefaults;

export interface Musterfall {
  id: string;
  titel: string;
  beschreibung: string;
  /** Eingezahlte Beiträge laut Mitteilung, gerundet. */
  eingezahlt: number;
  rueckkaufswert: number;
  basis: number;
  min: number;
  max: number;
  ampel: WirtschaftlicheAmpel;
  contract: ContractInput;
}

/** Rundet auf 10.000 € (ab 100.000 €) bzw. 1.000 €. */
export function rundeMusterwert(betrag: number): number {
  const schritt = betrag >= 100000 ? 10000 : 1000;
  return Math.round(betrag / schritt) * schritt;
}

const VERTRAEGE: { id: string; titel: string; beschreibung: string; contract: ContractInput }[] = [
  {
    id: 'kapital-lv-1995',
    titel: 'Kapitallebensversicherung, seit 1995',
    beschreibung: 'Monatsbeitrag mit jährlicher Steigerung, Vertrag läuft noch, Kennzahlen: Branchendurchschnitt.',
    contract: {
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
    },
  },
  {
    id: 'renten-2004',
    titel: 'Private Rentenversicherung, seit 2004',
    beschreibung: 'Jahresbeitrag ohne Steigerung, Vertrag läuft noch, Kennzahlen: Branchendurchschnitt.',
    contract: {
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
    },
  },
];

export function musterfaelle(): Musterfall[] {
  return VERTRAEGE.map(({ id, titel, beschreibung, contract }) => {
    const calc = berechneRueckabwicklung(contract, insurersDaten, riskDefaults);
    return {
      id,
      titel,
      beschreibung,
      eingezahlt: rundeMusterwert(contract.gesamtsummeLautMitteilung ?? 0),
      rueckkaufswert: rundeMusterwert(contract.rueckkaufswert!.betrag),
      basis: rundeMusterwert(calc.szenarien.basis.rueckabwicklungswert),
      min: rundeMusterwert(calc.szenarien.min.rueckabwicklungswert),
      max: rundeMusterwert(calc.szenarien.max.rueckabwicklungswert),
      ampel: bestimmeWirtschaftlicheAmpel(calc, contract.status),
      contract,
    };
  });
}
