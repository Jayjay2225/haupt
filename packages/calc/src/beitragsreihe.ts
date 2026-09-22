/**
 * Aufbau der monatsgenauen Beitragsreihe (CALC-SPEC Abschnitt 2):
 * Zahlweise, Dynamik ab dem zweiten Vertragsjahr, DM→EUR mit 1,95583,
 * optionale Skalierung auf die Gesamtsumme laut Standmitteilung.
 */
import { monatsIndex } from './monat';
import type { Annahme, ContractInput, Warnung } from './types';

export const DM_KURS = 1.95583;

export interface BeitragsMonat {
  /** Fortlaufender Monatsindex (siehe monat.ts). */
  index: number;
  betrag: number;
}

export interface BeitragsreihenErgebnis {
  reihe: BeitragsMonat[];
  annahmen: Annahme[];
  warnungen: Warnung[];
  /** Dynamiksatz in Prozent, sofern aktiv (ggf. hergeleitet). */
  dynamiksatzProzent?: number;
}

const PERIODEN: Record<Exclude<ContractInput['zahlweise'], 'einmalbeitrag'>, number> = {
  monatlich: 1,
  vierteljaehrlich: 3,
  halbjaehrlich: 6,
  jaehrlich: 12,
};

export function baueBeitragsreihe(input: ContractInput): BeitragsreihenErgebnis {
  const annahmen: Annahme[] = [];
  const warnungen: Warnung[] = [];

  const beginn = monatsIndex(input.beginn);
  const stichtag = monatsIndex(input.stichtag);
  if (stichtag < beginn) {
    throw new Error('Stichtag liegt vor Vertragsbeginn.');
  }

  const von = input.beitragszahlungVon !== undefined ? monatsIndex(input.beitragszahlungVon) : beginn;

  // Ende der Beitragszahlung: frühester der relevanten Endpunkte.
  let bis = stichtag;
  if (input.beitragszahlungBis !== undefined) {
    bis = Math.min(bis, monatsIndex(input.beitragszahlungBis));
  }
  if (input.ende !== undefined) {
    bis = Math.min(bis, monatsIndex(input.ende));
  }
  if ((input.status === 'beitragsfrei' || input.status === 'gekuendigt') && input.statusDatum !== undefined) {
    // Bis zum Monat vor der Beitragsfreistellung/Kündigung wird gezahlt.
    bis = Math.min(bis, monatsIndex(input.statusDatum) - 1);
  }
  if (input.status === 'abgelaufen' && input.statusDatum !== undefined) {
    bis = Math.min(bis, monatsIndex(input.statusDatum));
  }

  // Erstbeitrag in EUR.
  let erst = input.erstbeitrag.betrag;
  if (input.erstbeitrag.waehrung === 'DM') {
    erst = erst / DM_KURS;
    annahmen.push({
      code: 'DM_UMRECHNUNG',
      text: `Erstbeitrag in DM angegeben; Umrechnung mit dem amtlichen Kurs 1 € = ${DM_KURS} DM. Der nominale DM-Beitrag läuft ab 2002 als identischer Euro-Gegenwert weiter.`,
    });
  }
  if (erst <= 0) {
    throw new Error('Erstbeitrag muss größer 0 sein.');
  }

  // Dynamiksatz bestimmen.
  let satz = 0;
  let satzProzent: number | undefined;
  const ausgesetzt = new Set(input.dynamik.ausgesetzteVertragsjahre ?? []);
  if (input.dynamik.aktiv && input.zahlweise !== 'einmalbeitrag') {
    if (input.dynamik.satzProzent !== undefined) {
      satzProzent = input.dynamik.satzProzent;
    } else if (input.aktuellerBeitrag !== undefined && input.aktuellerBeitrag > 0) {
      // Zahl der bis zum Zahlungsende erfolgten Erhöhungstermine (ab 2. Vertragsjahr).
      const volleJahre = Math.max(0, Math.floor((bis - beginn) / 12));
      let termine = 0;
      for (let vertragsjahr = 2; vertragsjahr <= volleJahre + 1; vertragsjahr += 1) {
        if (!ausgesetzt.has(vertragsjahr)) {
          termine += 1;
        }
      }
      if (termine > 0 && input.aktuellerBeitrag !== erst) {
        satzProzent = (Math.pow(input.aktuellerBeitrag / erst, 1 / termine) - 1) * 100;
        annahmen.push({
          code: 'DYNAMIK_HERGELEITET',
          text: `Dynamiksatz aus Erst- und aktuellem Beitrag über ${termine} Erhöhungstermine geometrisch hergeleitet: ${satzProzent.toFixed(2)} % p. a.`,
        });
      }
    }
    if (satzProzent === undefined) {
      warnungen.push({
        code: 'DYNAMIK_UNBEKANNT',
        text: 'Dynamik ist aktiv, aber weder Satz noch aktueller Beitrag verwertbar – die Reihe wird ohne Erhöhungen gerechnet (konservativ).',
      });
      satzProzent = 0;
    }
    satz = satzProzent / 100;
  } else if (!input.dynamik.aktiv && input.aktuellerBeitrag !== undefined && input.aktuellerBeitrag !== erst) {
    annahmen.push({
      code: 'BEITRAG_KONSTANT',
      text: 'Ohne Dynamik wird der Erstbeitrag als konstant angesetzt; der abweichende aktuelle Beitrag blieb unberücksichtigt.',
    });
  }

  // Reihe aufbauen.
  const reihe: BeitragsMonat[] = [];
  if (input.zahlweise === 'einmalbeitrag') {
    if (von <= bis) {
      reihe.push({ index: von, betrag: erst });
    }
  } else {
    const periode = PERIODEN[input.zahlweise];
    for (let index = von; index <= bis; index += periode) {
      const vertragsjahr = Math.floor((index - beginn) / 12) + 1;
      let erhoehungen = 0;
      for (let jahr = 2; jahr <= vertragsjahr; jahr += 1) {
        if (!ausgesetzt.has(jahr)) {
          erhoehungen += 1;
        }
      }
      const betrag = erst * Math.pow(1 + satz, erhoehungen);
      reihe.push({ index, betrag });
    }
  }

  // Skalierung auf Gesamtsumme laut Standmitteilung.
  if (input.gesamtsummeLautMitteilung !== undefined && reihe.length > 0) {
    const summe = reihe.reduce((acc, b) => acc + b.betrag, 0);
    if (summe > 0) {
      const faktor = input.gesamtsummeLautMitteilung / summe;
      if (Math.abs(faktor - 1) > 0.05) {
        warnungen.push({
          code: 'BEITRAGSREIHE_ABWEICHUNG',
          text: `Die rekonstruierte Beitragsreihe weicht um ${((faktor - 1) * 100).toFixed(1)} % von der Gesamtsumme laut Standmitteilung ab; die Reihe wurde auf die Mitteilung skaliert. Bitte Zahlweise, Dynamik und Beitragshöhe prüfen.`,
        });
      }
      for (const b of reihe) {
        b.betrag *= faktor;
      }
      annahmen.push({
        code: 'REIHE_SKALIERT',
        text: `Beitragsreihe proportional auf die Gesamtsumme laut Standmitteilung skaliert (Faktor ${faktor.toFixed(4)}).`,
      });
    }
  }

  const ergebnis: BeitragsreihenErgebnis = { reihe, annahmen, warnungen };
  if (satzProzent !== undefined && input.dynamik.aktiv) {
    ergebnis.dynamiksatzProzent = satzProzent;
  }
  return ergebnis;
}
