/**
 * Abbildung des Formular-Entwurfs (CaseDraft) auf die Eingaben des
 * Rechenkerns (ContractInput) und – für die Kanzlei-Variante – des
 * Eignungs-Checks (EligibilityInput). Reine Funktionen; jede getroffene
 * Zusatzannahme wird als Text zurückgegeben und in der Vorschau ausgewiesen.
 */
import type { ContractInput, Vertragsart } from '@rueckab/calc';
import type { EligibilityInput } from '@rueckab/eligibility';
import { FONDS_MODE } from '@/config/ampel';
import type { CaseDraft } from './draft';
import { parseDecimalDe } from './format';

export interface MappingErgebnis {
  contract: ContractInput;
  eligibility: EligibilityInput;
  zusatzAnnahmen: string[];
  /** Fehler, die eine Berechnung verhindern (leer = ok). */
  fehler: string[];
  /** Fondsgebundener Vertrag im Anfrage-Modus: nicht rechnen, individuell prüfen. */
  fondsAnfrage: boolean;
}

const VERTRAGSART_MAP: Record<CaseDraft['vertragsart'], Vertragsart | 'risiko-lv' | 'unbekannt'> = {
  '': 'unbekannt',
  'kapital-lv': 'kapital-lv',
  'private-rv': 'private-rv',
  'fonds-lv': 'fonds-lv',
  'fonds-rv': 'fonds-rv',
  rueckdeckung: 'rueckdeckung',
  'risiko-lv': 'risiko-lv',
  unbekannt: 'unbekannt',
};

function jnu(wert: string): 'ja' | 'nein' | 'unbekannt' {
  return wert === 'ja' || wert === 'nein' ? wert : 'unbekannt';
}

export function draftZuEingaben(
  draft: CaseDraft,
  findeVersichererId: (name: string) => string,
  stichtag: string,
): MappingErgebnis {
  const zusatzAnnahmen: string[] = [];
  const fehler: string[] = [];

  const artRoh = VERTRAGSART_MAP[draft.vertragsart] ?? 'unbekannt';
  let vertragsart: Vertragsart;
  if (artRoh === 'unbekannt') {
    vertragsart = 'kapital-lv';
    zusatzAnnahmen.push(
      'Die Vertragsart ist nicht eindeutig angegeben; gerechnet wurde wie für eine Kapitallebensversicherung.',
    );
  } else if (artRoh === 'risiko-lv') {
    vertragsart = 'kapital-lv'; // Reine Risikopolicen haben keinen Sparanteil; Wert dient nur der Typsicherheit.
  } else {
    vertragsart = artRoh;
  }

  const fondsAnfrage =
    FONDS_MODE === 'anfrage' && (vertragsart === 'fonds-lv' || vertragsart === 'fonds-rv');

  const erst = parseDecimalDe(draft.erstbeitrag);
  const aktuell = parseDecimalDe(draft.aktuellerBeitrag);
  let erstbeitrag: ContractInput['erstbeitrag'];
  if (erst !== null && erst > 0) {
    erstbeitrag = { betrag: erst, waehrung: draft.erstbeitragWaehrung };
  } else if (aktuell !== null && aktuell > 0) {
    erstbeitrag = { betrag: aktuell, waehrung: 'EUR' };
    zusatzAnnahmen.push(
      'Ohne Erstbeitrag wurde der aktuelle Beitrag als von Beginn an konstant unterstellt.',
    );
  } else {
    fehler.push('Es fehlt ein verwertbarer Beitrag (erster Monatsbeitrag).');
    erstbeitrag = { betrag: 0, waehrung: 'EUR' };
  }

  if (draft.beginn === '') {
    fehler.push('Der Vertragsbeginn fehlt.');
  }

  const dynamikSatz = parseDecimalDe(draft.dynamikSatz);
  const dynamik: ContractInput['dynamik'] =
    draft.dynamik === 'ja'
      ? dynamikSatz !== null && dynamikSatz > 0
        ? { aktiv: true, satzProzent: dynamikSatz }
        : { aktiv: true }
      : { aktiv: false };
  if (draft.dynamik === 'ja' && (dynamikSatz === null || dynamikSatz <= 0)) {
    zusatzAnnahmen.push(
      'Eine Dynamik wurde angegeben, aber ohne Satz; gerechnet wurde mit dem üblichen Näherungswert des Rechenkerns.',
    );
  }

  const contract: ContractInput = {
    versichererId: findeVersichererId(draft.versicherer),
    vertragsart,
    beginn: draft.beginn || '2000-01',
    zahlweise: draft.zahlweise === '' ? 'monatlich' : draft.zahlweise,
    erstbeitrag,
    dynamik,
    status: draft.status === '' ? 'laufend' : draft.status,
    stichtag,
  };
  if (aktuell !== null && aktuell > 0 && erst !== null && erst > 0) {
    contract.aktuellerBeitrag = aktuell;
  }
  if (draft.ende !== '') {
    contract.ende = draft.ende;
  }
  if (draft.beitragszahlungBis !== '') {
    contract.beitragszahlungBis = draft.beitragszahlungBis;
  }
  if (draft.statusDatum !== '') {
    contract.statusDatum = draft.statusDatum;
  }
  const gesamtsumme = parseDecimalDe(draft.gesamtsummeLautMitteilung);
  if (gesamtsumme !== null && gesamtsumme > 0) {
    contract.gesamtsummeLautMitteilung = gesamtsumme;
  }
  const rkw = parseDecimalDe(draft.rueckkaufswert);
  if (rkw !== null && rkw > 0) {
    contract.rueckkaufswert = { betrag: rkw };
  }
  if (
    (draft.status === 'gekuendigt' || draft.status === 'abgelaufen') &&
    draft.statusDatum === ''
  ) {
    zusatzAnnahmen.push(
      'Der Vertrag ist beendet, aber ohne Datum; erhaltene Beträge wurden ohne Gegenverzinsung angesetzt – mit Datum wird die Schätzung genauer.',
    );
  }

  if (draft.auszahlungenErhalten === 'ja' && draft.auszahlungenListe.length > 0) {
    const auszahlungen: NonNullable<ContractInput['auszahlungen']> = [];
    for (const eintrag of draft.auszahlungenListe) {
      const betrag = parseDecimalDe(eintrag.betrag);
      if (betrag !== null && betrag > 0 && /^\d{4}-\d{2}$/.test(eintrag.monat)) {
        auszahlungen.push({ monat: eintrag.monat, betrag });
      }
    }
    if (auszahlungen.length > 0) {
      contract.auszahlungen = auszahlungen;
    }
  }
  if (draft.policendarlehen === 'ja') {
    zusatzAnnahmen.push(
      'Ein Policendarlehen wurde angegeben, aber ohne Betrag/Datum – es ist in der Vorschau nicht eingerechnet und im Bericht nachzutragen.',
    );
  }
  if (draft.buzEnthalten === 'ja') {
    zusatzAnnahmen.push(
      'Eine BUZ ist enthalten; ihr Beitragsanteil ist nicht angegeben und wurde nicht herausgerechnet – der tatsächliche Wert liegt eher niedriger. Anteil laut Police nachtragen.',
    );
  }

  const eligibility: EligibilityInput = {
    vertragsschluss: draft.beginn || '2000-01',
    vertragsart: artRoh === 'unbekannt' ? 'unbekannt' : artRoh,
    zustandekommen: draft.zustandekommen === '' ? 'unbekannt' : draft.zustandekommen,
    belehrungVorhanden: jnu(draft.belehrungVorhanden),
    belehrungFrist: draft.belehrungFrist === '' ? 'unbekannt' : draft.belehrungFrist,
    belehrungForm: draft.belehrungForm === '' ? 'unbekannt' : draft.belehrungForm,
    hervorhebung: jnu(draft.hervorhebung),
    status: draft.status === '' ? 'laufend' : draft.status,
    abgetretenOderBeliehen: jnu(draft.abgetretenOderBeliehen),
    auszahlungenErhalten: jnu(draft.auszahlungenErhalten),
  };

  return { contract, eligibility, zusatzAnnahmen, fehler, fondsAnfrage };
}
