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
import { parseDecimalDe, parseProzentDe } from './format';

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

/** Vormonat eines ISO-Monats (YYYY-MM). */
function vormonat(iso: string): string {
  const jahr = Number(iso.slice(0, 4));
  const monat = Number(iso.slice(5, 7));
  return monat <= 1 ? `${jahr - 1}-12` : `${jahr}-${String(monat - 1).padStart(2, '0')}`;
}

/**
 * Letzter Monat mit Beitragszahlung laut Entwurf – dieselbe Regel wie der
 * Rechenkern (beitragsreihe.ts): beitragsfrei/gekündigt → Vormonat des
 * Datums, ausgezahlt → der Monat selbst, sonst Stichtag.
 */
function letzterZahlmonat(draft: CaseDraft, stichtag: string): string {
  if (draft.beitragszahlungBis !== '') {
    return draft.beitragszahlungBis;
  }
  if (draft.statusDatum !== '' && (draft.status === 'beitragsfrei' || draft.status === 'gekuendigt')) {
    return vormonat(draft.statusDatum);
  }
  if (draft.statusDatum !== '' && draft.status === 'abgelaufen') {
    return draft.statusDatum;
  }
  return stichtag;
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

  const gesamtsumme = parseDecimalDe(draft.gesamtsummeLautMitteilung);
  const dynamikSatz = parseProzentDe(draft.dynamikSatz);
  // Zahlungen je Jahr (leere Zahlweise gilt im Kern als monatlich, Einmalbeitrag als eine Zahlung).
  const jeJahr = draft.zahlweise === '' || draft.zahlweise === 'einmalbeitrag' ? 12 : ZAHLUNGEN_JE_JAHR[draft.zahlweise];
  // Dynamiksatz als Dezimalzahl – bei Einmalbeitrag ohne Wirkung, wie im Rechenkern.
  const satz =
    draft.dynamik === 'ja' && draft.zahlweise !== 'einmalbeitrag' && dynamikSatz !== null && dynamikSatz > 0
      ? dynamikSatz / 100
      : 0;

  // Beitrag: erster Beitrag, heutiger Beitrag (Schalter) oder unbekannt (nur mit Beitragssumme).
  // „Weiß ich nicht“ blendet das Feld nur aus – ein zuvor eingetippter Wert zählt dann nicht mehr.
  const eingegeben = parseDecimalDe(draft.erstbeitrag);
  const heutiger = draft.beitragArt === 'heutiger' && !draft.erstbeitragUnbekannt;
  const erst = draft.erstbeitragUnbekannt || heutiger ? null : eingegeben;
  const aktuell = heutiger ? eingegeben : parseDecimalDe(draft.aktuellerBeitrag);
  let erstbeitrag: ContractInput['erstbeitrag'];
  if (erst !== null && erst > 0) {
    // Ab 2002 gibt es keine DM-Beiträge; ein DM-Kennzeichen aus einem älteren Entwurf
    // (Startseiten-Karte, nachträglich korrigierter Beginn) gilt dann nicht mehr.
    erstbeitrag = { betrag: erst, waehrung: draft.beginn >= '2002-01' ? 'EUR' : draft.erstbeitragWaehrung };
  } else if (aktuell !== null && aktuell > 0) {
    // Heutiger Beitrag: bei bekannter Dynamik über die bisherigen Erhöhungstermine (ab dem
    // 2. Vertragsjahr, wie beitragsreihe.ts) auf den ersten Beitrag zurückrechnen – sonst
    // würde der Rechenkern den heutigen Beitrag noch einmal über die ganze Laufzeit dynamisieren.
    const termine =
      satz > 0 && draft.beginn !== ''
        ? Math.max(0, Math.floor((monateZwischen(draft.beginn, letzterZahlmonat(draft, stichtag)) - 1) / 12))
        : 0;
    const erstAusHeute = Math.round((aktuell / Math.pow(1 + satz, termine)) * 100) / 100;
    erstbeitrag = { betrag: erstAusHeute, waehrung: 'EUR' };
    zusatzAnnahmen.push(
      termine > 0
        ? `Annahme: Angegeben wurde der heutige Beitrag; der erste Beitrag wurde daraus über ${termine} jährliche Dynamik-Erhöhungen zurückgerechnet. Mit dem ersten Beitrag aus der Police wird die Zahl präziser.`
        : 'Annahme: Angegeben wurde der heutige Beitrag; er wurde als von Beginn an konstant unterstellt. Mit dem ersten Beitrag aus der Police wird die Zahl präziser.',
    );
  } else if (draft.erstbeitragUnbekannt && gesamtsumme !== null && gesamtsumme > 0 && draft.beginn !== '') {
    // Beitragsreihe aus der Beitragssumme ableiten: über die Laufzeit verteilt, bei Dynamik mit
    // demselben Wachstum wie im Rechenkern – so bleibt dessen Skalierung nahe Faktor 1 und es
    // entsteht kein unberechtigter Abweichungs-Warnhinweis.
    const monate = monateZwischen(draft.beginn, letzterZahlmonat(draft, stichtag));
    const zahlungen = Math.max(1, Math.round((monate / 12) * jeJahr));
    const periode = 12 / jeJahr;
    let faktoren = 0;
    for (let k = 0; k < zahlungen; k += 1) {
      const vertragsjahr = Math.floor((k * periode) / 12) + 1;
      faktoren += Math.pow(1 + satz, vertragsjahr - 1);
    }
    erstbeitrag = { betrag: Math.round((gesamtsumme / faktoren) * 100) / 100, waehrung: 'EUR' };
    zusatzAnnahmen.push(
      'Annahme: Der erste Beitrag war nicht bekannt; die Beitragsreihe wurde aus der Summe der gezahlten Beiträge laut Standmitteilung abgeleitet (über die Laufzeit verteilt, bei Dynamik entsprechend ansteigend). Mit dem ersten Beitrag aus der Police wird die Zahl präziser.',
    );
  } else {
    fehler.push('Es fehlt ein verwertbarer Beitrag (erster Beitrag oder Beitragssumme laut Standmitteilung).');
    erstbeitrag = { betrag: 0, waehrung: 'EUR' };
  }

  const dynamik: ContractInput['dynamik'] =
    draft.dynamik === 'ja'
      ? dynamikSatz !== null && dynamikSatz > 0
        ? { aktiv: true, satzProzent: dynamikSatz }
        : { aktiv: true }
      : { aktiv: false };
  if (draft.dynamik === 'ja' && (dynamikSatz === null || dynamikSatz <= 0)) {
    zusatzAnnahmen.push(
      'Annahme: Eine Dynamik wurde angegeben, aber ohne Satz; gerechnet wurde ohne Erhöhungen (konservativ). Mit dem Satz aus Police oder Nachträgen wird die Zahl präziser.',
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
    // „Beitragsfrei seit …“ (Prompt 14, Schritt 2): letzter Beitrag im Vormonat – wie die Kern-Regel.
    contract.beitragszahlungBis = vormonat(draft.statusDatum);
  }
  // Ein Datum gehört nur zu beitragsfrei/gekündigt/ausgezahlt; ein stehengebliebener Wert
  // aus einem früheren Statuswechsel („Läuft“) reist nicht in Rechnung und Gutachten.
  if (draft.statusDatum !== '' && draft.status !== '' && draft.status !== 'laufend') {
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
      'Annahme: Der Vertrag ist beendet, aber ohne Datum; gerechnet wurde so, als wären die Beiträge bis zum Stichtag weitergezahlt worden, und die erhaltenen Beträge wurden ohne Gegenverzinsung angesetzt. Beides lässt die Schätzung eher zu hoch ausfallen – mit dem Datum der Beendigung wird sie deutlich genauer.',
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
    // Nur Jahr bekannt: als YYYY weiterreichen, damit der Eignungs-Check die Grenzjahre 1994/2004 als offen behandelt.
    vertragsschluss: draft.beginnUngefaehr && draft.beginn !== '' ? draft.beginn.slice(0, 4) : draft.beginn || '2000-01',
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
