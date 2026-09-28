/**
 * Abbildung des Formular-Entwurfs (CaseDraft) auf die Eingaben des
 * Rechenkerns (ContractInput) und – für die Kanzlei-Variante – des
 * Eignungs-Checks (EligibilityInput). Reine Funktionen; jede getroffene
 * Zusatzannahme wird als Text zurückgegeben und im Gutachten im Kasten
 * „Ihre Angaben und unsere Annahmen“ ausgewiesen (Prompt 14, Abschnitt 2/3).
 */
import type { ContractInput, Vertragsart } from '@rueckab/calc';
import type { EligibilityInput } from '@rueckab/eligibility';
import { FONDS_MODE } from '@/config/ampel';
import type { CaseDraft } from './draft';
import { eintrittsalter } from './draft';
import { parseDecimalDe } from './format';

export interface MappingErgebnis {
  contract: ContractInput;
  eligibility: EligibilityInput;
  /** Annahmen aus „Weiß ich nicht“-Antworten und fehlenden Angaben (Kennzeichen „Annahme“). */
  zusatzAnnahmen: string[];
  /** Fehler, die eine Berechnung verhindern (leer = ok). */
  fehler: string[];
  /** Fondsgebundener Vertrag im Anfrage-Modus: nicht rechnen, individuell prüfen. */
  fondsAnfrage: boolean;
  /** Vertragsart unbekannt: Rückfrage per E-Mail (Prompt 14, Schritt 1). */
  rueckfrageVertragsart: boolean;
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

const ZAHLUNGEN_JE_JAHR: Record<Exclude<CaseDraft['zahlweise'], '' | 'einmalbeitrag'>, number> = {
  monatlich: 12,
  vierteljaehrlich: 4,
  halbjaehrlich: 2,
  jaehrlich: 1,
};

function jnu(wert: string): 'ja' | 'nein' | 'unbekannt' {
  return wert === 'ja' || wert === 'nein' ? wert : 'unbekannt';
}

/** Monate zwischen zwei ISO-Monaten (inklusive Startmonat). */
function monateZwischen(von: string, bis: string): number {
  const v = Number(von.slice(0, 4)) * 12 + Number(von.slice(5, 7));
  const b = Number(bis.slice(0, 4)) * 12 + Number(bis.slice(5, 7));
  return Math.max(1, b - v + 1);
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
  const rueckfrageVertragsart = artRoh === 'unbekannt';
  if (artRoh === 'unbekannt') {
    vertragsart = 'kapital-lv';
    zusatzAnnahmen.push(
      'Annahme: Die Vertragsart war nicht bekannt; gerechnet wurde wie für eine Kapitallebensversicherung. Wir fragen per E-Mail nach.',
    );
  } else if (artRoh === 'risiko-lv') {
    vertragsart = 'kapital-lv'; // Reine Risikopolicen haben keinen Sparanteil; Wert dient nur der Typsicherheit.
  } else {
    vertragsart = artRoh;
  }

  const fondsAnfrage =
    FONDS_MODE === 'anfrage' && (vertragsart === 'fonds-lv' || vertragsart === 'fonds-rv');

  if (draft.beginn === '') {
    fehler.push('Der Vertragsbeginn fehlt.');
  } else if (draft.beginnUngefaehr) {
    zusatzAnnahmen.push(
      `Annahme: Der Vertragsbeginn ist nur ungefähr bekannt (Jahr ${draft.beginn.slice(0, 4)}); gerechnet wurde mit der Jahresmitte. Mit dem genauen Monat aus der Police wird die Zahl präziser.`,
    );
  }

  // Beitrag: erster Beitrag, heutiger Beitrag (Schalter) oder unbekannt (nur mit Beitragssumme).
  const eingegeben = parseDecimalDe(draft.erstbeitrag);
  const heutiger = draft.beitragArt === 'heutiger';
  const erst = draft.erstbeitragUnbekannt || heutiger ? null : eingegeben;
  const aktuell = heutiger ? eingegeben : parseDecimalDe(draft.aktuellerBeitrag);
  const gesamtsumme = parseDecimalDe(draft.gesamtsummeLautMitteilung);
  let erstbeitrag: ContractInput['erstbeitrag'];
  if (erst !== null && erst > 0) {
    erstbeitrag = { betrag: erst, waehrung: draft.erstbeitragWaehrung };
  } else if (aktuell !== null && aktuell > 0) {
    erstbeitrag = { betrag: aktuell, waehrung: 'EUR' };
    zusatzAnnahmen.push(
      'Annahme: Angegeben wurde der heutige Beitrag; er wurde als von Beginn an konstant unterstellt. Mit dem ersten Beitrag aus der Police wird die Zahl präziser.',
    );
  } else if (draft.erstbeitragUnbekannt && gesamtsumme !== null && gesamtsumme > 0 && draft.beginn !== '') {
    // Beitragsreihe aus der Beitragssumme ableiten: gleichmäßig über die Laufzeit;
    // der Rechenkern skaliert die Reihe ohnehin exakt auf die Summe.
    const bis = draft.beitragszahlungBis !== '' ? draft.beitragszahlungBis : draft.statusDatum !== '' && draft.status !== 'laufend' ? draft.statusDatum : stichtag;
    const monate = monateZwischen(draft.beginn, bis);
    const jeJahr = draft.zahlweise === '' || draft.zahlweise === 'einmalbeitrag' ? 12 : ZAHLUNGEN_JE_JAHR[draft.zahlweise];
    const zahlungen = Math.max(1, Math.round((monate / 12) * jeJahr));
    erstbeitrag = { betrag: Math.round((gesamtsumme / zahlungen) * 100) / 100, waehrung: 'EUR' };
    zusatzAnnahmen.push(
      'Annahme: Der erste Beitrag war nicht bekannt; die Beitragsreihe wurde aus der Summe der gezahlten Beiträge laut Standmitteilung abgeleitet (gleichmäßig über die Laufzeit). Mit dem ersten Beitrag aus der Police wird die Zahl präziser.',
    );
  } else {
    fehler.push('Es fehlt ein verwertbarer Beitrag (erster Monatsbeitrag oder Beitragssumme laut Standmitteilung).');
    erstbeitrag = { betrag: 0, waehrung: 'EUR' };
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
      'Annahme: Eine Dynamik wurde angegeben, aber ohne Satz; gerechnet wurde mit dem üblichen Näherungswert des Rechenkerns.',
    );
  }
  if (draft.dynamik === 'unbekannt') {
    zusatzAnnahmen.push(
      'Annahme: Ob eine Dynamik vereinbart war, ist nicht bekannt; gerechnet wurde ohne Dynamik. Mit Dynamik läge die Zahl höher – bitte in Police oder Nachträgen nachsehen.',
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
  } else if (draft.status === 'beitragsfrei' && draft.statusDatum !== '') {
    // „Beitragsfrei seit …“ (Prompt 14, Schritt 2): Beitragszahlung endete dort.
    contract.beitragszahlungBis = draft.statusDatum;
  }
  if (draft.statusDatum !== '' && draft.status !== 'beitragsfrei') {
    contract.statusDatum = draft.statusDatum;
  }
  if (gesamtsumme !== null && gesamtsumme > 0) {
    contract.gesamtsummeLautMitteilung = gesamtsumme;
  }
  const rkw = parseDecimalDe(draft.rueckkaufswert);
  if (rkw !== null && rkw > 0) {
    contract.rueckkaufswert = { betrag: rkw };
  }
  const alter = eintrittsalter(draft.geburtsdatum, draft.beginn);
  if (alter !== undefined && alter >= 10 && alter <= 90) {
    contract.eintrittsalter = alter;
  }
  if (
    (draft.status === 'gekuendigt' || draft.status === 'abgelaufen') &&
    draft.statusDatum === ''
  ) {
    zusatzAnnahmen.push(
      'Annahme: Der Vertrag ist beendet, aber ohne Datum; erhaltene Beträge wurden ohne Gegenverzinsung angesetzt – mit Datum wird die Schätzung genauer.',
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
  if (draft.auszahlungenErhalten === 'unbekannt') {
    zusatzAnnahmen.push(
      'Annahme: Ob Auszahlungen erfolgten, ist nicht bekannt; gerechnet wurde ohne Auszahlungen. Teilauszahlungen oder Vorschüsse würden den Wert mindern – bitte Schreiben des Versicherers prüfen.',
    );
  }
  if (draft.policendarlehen === 'ja') {
    zusatzAnnahmen.push(
      'Annahme: Ein Policendarlehen wurde angegeben, aber ohne Betrag/Datum – es ist nicht eingerechnet und im Gutachten nachzutragen.',
    );
  }
  if (draft.buzEnthalten === 'ja') {
    zusatzAnnahmen.push(
      'Annahme: Eine BUZ ist enthalten; ihr Beitragsanteil ist nicht angegeben und wurde nicht herausgerechnet – der tatsächliche Wert liegt eher niedriger. Anteil laut Police nachtragen.',
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

  return { contract, eligibility, zusatzAnnahmen, fehler, fondsAnfrage, rueckfrageVertragsart };
}
