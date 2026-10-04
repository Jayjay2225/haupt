/**
 * Datenmodell und Validierung des Rechner-Assistenten (Prompt 12, 3.2 –
 * umgebaut nach Prompt 14, Abschnitt 2): elf Schritte, eine Frage je
 * Bildschirm, der letzte Schritt ist die Bestellung. „Weiß ich nicht“ ist
 * überall erlaubt außer beim Rückkaufswert; jede solche Antwort wird im
 * Gutachten als Annahme ausgewiesen (lib/berechnung.ts).
 *
 * `CaseDraft` ist ein reines UI-Modell (alle Felder mit Leerwert-Default): Es
 * sammelt die Angaben, die der Rechenkern (`ContractInput`) auswertet; die
 * Abbildung steht in lib/berechnung.ts. In der Kanzlei-Variante (Modell C)
 * kommt vor dem Schritt „Über Sie“ der Eignungs-Check (Belehrungsfragen) dazu.
 *
 * Zwischenspeicherung: localStorage im Browser; an den Server geht nur die
 * zustandslose Vorschau-Anfrage (nichts wird gespeichert).
 */
import { BRAND } from '@/config/brand';
import { VARIANTE } from '@/config/variante';
import type { HilfeFeld } from '@/content/hilfetexte';
import { parseDatumDe, parseDecimalDe, parseProzentDe } from './format';

export const DRAFT_STORAGE_KEY = 'rueckab.rechner.entwurf.v2';

export type Vertragsart =
  | ''
  | 'kapital-lv'
  | 'private-rv'
  | 'fonds-lv'
  | 'fonds-rv'
  | 'rueckdeckung'
  | 'risiko-lv'
  | 'unbekannt';

export type Vertragsstatus = '' | 'laufend' | 'beitragsfrei' | 'gekuendigt' | 'abgelaufen';

export type Zahlweise =
  | ''
  | 'monatlich'
  | 'vierteljaehrlich'
  | 'halbjaehrlich'
  | 'jaehrlich'
  | 'einmalbeitrag';

export type JaNeinUnbekannt = '' | 'ja' | 'nein' | 'unbekannt';

export type Zustandekommen = '' | 'policenmodell' | 'antragsmodell' | 'unbekannt';

export type BelehrungFrist = '' | '14-tage' | '30-tage' | 'andere' | 'unbekannt';

export type BelehrungForm = '' | 'schriftform' | 'textform' | 'andere' | 'unbekannt';

export type Waehrung = 'EUR' | 'DM';

export type Anrede = '' | 'frau' | 'herr' | 'keine';

/** Schalter „heutiger Beitrag“ (Prompt 14, Schritt 5). */
export type BeitragArt = 'erster' | 'heutiger';

export type StartAmpel = '' | 'gruen' | 'gelb';

export interface AuszahlungsEintrag {
  /** ISO YYYY-MM. */
  monat: string;
  /** Betrag als Eingabetext (de-DE). */
  betrag: string;
}

export interface CaseDraft {
  version: 2;
  // 1 – „Um welchen Vertrag geht es?“ („Weiß ich nicht“ → Kapital-LV, Annahme, Rückfrage)
  vertragsart: Vertragsart;
  // 2 – „Läuft der Vertrag noch?“ (beitragsfrei: seit wann; beendet: wann – für die Gegenrechnung)
  status: Vertragsstatus;
  statusDatum: string; // ISO YYYY-MM, freiwillig
  // 3 – „Wer ist der Versicherer?“
  versicherer: string;
  // 4 – „Wann hat der Vertrag begonnen?“ (BRAND.range); „Weiß nicht genau“ → nur Jahr
  beginn: string; // ISO YYYY-MM
  beginnUngefaehr: boolean;
  // 5 – „Wie hoch war der erste Beitrag?“ (je Zahlungsperiode; DM/€-Schalter vor 2002, Schalter „heutiger Beitrag“)
  erstbeitrag: string;
  erstbeitragWaehrung: Waehrung;
  beitragArt: BeitragArt;
  /** „Weiß ich nicht“ – nur zusammen mit der Beitragssumme (Schritt 7) rechenbar. */
  erstbeitragUnbekannt: boolean;
  zahlweise: Zahlweise;
  // 6 – „Gab es eine Dynamik?“ (ja/nein/unbekannt)
  dynamik: JaNeinUnbekannt;
  dynamikSatz: string; // Prozent, z. B. „5“
  // 7 – „Was steht als eingezahlte Beiträge in der Standmitteilung?“ (überspringbar)
  gesamtsummeLautMitteilung: string;
  // 8 – „Wie hoch ist der Rückkaufswert?“ (Pflicht, kein „Weiß nicht“)
  rueckkaufswert: string;
  // 9 – „Gab es Auszahlungen?“ (ja/nein/unbekannt)
  auszahlungenErhalten: JaNeinUnbekannt;
  auszahlungenListe: AuszahlungsEintrag[];
  // 10 – „Über Sie“ (Rechnung, Postversand, Risikoanteil)
  anrede: Anrede;
  vorname: string;
  nachname: string;
  geburtsdatum: string; // ISO YYYY-MM-DD
  strasse: string;
  plz: string;
  ort: string;
  email: string;
  telefon: string;
  // 11 – „Ihre Bestellung“
  postversand: boolean;
  einwilligungDatenschutz: boolean;
  agbGelesen: boolean;
  ausfuehrungZugestimmt: boolean;
  /** Einstieg über den grünen Knopf der Startseiten-Ampel (Prompt 14, 2). */
  startAmpel: StartAmpel;
  // Weitere Angaben ohne eigenen Bildschirm (Kanzlei-Variante, Gutachten).
  ende: string;
  beitragszahlungBis: string;
  aktuellerBeitrag: string;
  policendarlehen: JaNeinUnbekannt;
  buzEnthalten: JaNeinUnbekannt;
  // Eignungs-Check (nur Kanzlei-Variante, eigener Schritt)
  zustandekommen: Zustandekommen;
  belehrungVorhanden: JaNeinUnbekannt;
  belehrungFrist: BelehrungFrist;
  belehrungForm: BelehrungForm;
  hervorhebung: JaNeinUnbekannt;
  abgetretenOderBeliehen: JaNeinUnbekannt;
  /** Eigener, nie vorangekreuzter Block der Verkaufen-Karte (Ankauf). */
  einwilligungAnkaufKontakt: boolean;
  /** ISO-Zeitpunkt des Absendens (Kanzlei-Ergebnisseite); leer = noch nicht abgesendet. */
  eingereichtAm: string;
}

export function leererDraft(): CaseDraft {
  return {
    version: 2,
    vertragsart: '',
    status: '',
    statusDatum: '',
    versicherer: '',
    beginn: '',
    beginnUngefaehr: false,
    erstbeitrag: '',
    erstbeitragWaehrung: 'EUR',
    beitragArt: 'erster',
    erstbeitragUnbekannt: false,
    zahlweise: 'monatlich',
    dynamik: '',
    dynamikSatz: '',
    gesamtsummeLautMitteilung: '',
    rueckkaufswert: '',
    auszahlungenErhalten: '',
    auszahlungenListe: [],
    anrede: '',
    vorname: '',
    nachname: '',
    geburtsdatum: '',
    strasse: '',
    plz: '',
    ort: '',
    email: '',
    telefon: '',
    postversand: false,
    einwilligungDatenschutz: false,
    agbGelesen: false,
    ausfuehrungZugestimmt: false,
    startAmpel: '',
    ende: '',
    beitragszahlungBis: '',
    aktuellerBeitrag: '',
    policendarlehen: '',
    buzEnthalten: '',
    zustandekommen: '',
    belehrungVorhanden: '',
    belehrungFrist: '',
    belehrungForm: '',
    hervorhebung: '',
    abgetretenOderBeliehen: '',
    einwilligungAnkaufKontakt: false,
    eingereichtAm: '',
  };
}

/** Name für Rechnung, Gutachten und Anschrift. */
export function kundenname(draft: CaseDraft): string {
  return `${draft.vorname.trim()} ${draft.nachname.trim()}`.trim();
}

/** Prompt 14, Abschnitt 2: elf Schritte, der letzte ist die Bestellung. */
const SCHRITTE_PRIVAT = [
  'typ',
  'status',
  'versicherer',
  'beginn',
  'beitrag',
  'dynamik',
  'beitragssumme',
  'rueckkaufswert',
  'auszahlungen',
  'person',
  'bestellung',
] as const;

/** Kanzlei-Variante (Modell C): Eignungs-Check statt Bestellung, Ergebnis-Seite bleibt. */
const SCHRITTE_KANZLEI = [
  'typ',
  'status',
  'versicherer',
  'beginn',
  'beitrag',
  'dynamik',
  'beitragssumme',
  'rueckkaufswert',
  'auszahlungen',
  'eignung',
  'person',
] as const;

export type Schritt = (typeof SCHRITTE_PRIVAT)[number] | (typeof SCHRITTE_KANZLEI)[number];

export const SCHRITTE: readonly Schritt[] = VARIANTE.belehrungsCheck
  ? SCHRITTE_KANZLEI
  : SCHRITTE_PRIVAT;

/** Die Frage je Bildschirm (Prompt 12, 3.2 / Prompt 14, 2). */
export const SCHRITT_FRAGE: Record<Schritt, string> = {
  typ: 'Um welchen Vertrag geht es?',
  status: 'Läuft der Vertrag noch?',
  versicherer: 'Wer ist der Versicherer?',
  beginn: 'Wann hat der Vertrag begonnen?',
  beitrag: 'Wie hoch war der erste Beitrag?',
  dynamik: 'Gab es eine Dynamik?',
  beitragssumme: 'Was steht als eingezahlte Beiträge in der Standmitteilung?',
  rueckkaufswert: 'Wie hoch ist der Rückkaufswert?',
  auszahlungen: 'Gab es Auszahlungen?',
  eignung: 'Fragen zur Belehrung (Kanzlei-Check)',
  person: 'Über Sie',
  bestellung: 'Ihre Bestellung',
};

/** Ein Hilfesatz je Schritt (Prompt 14, 2). */
export const SCHRITT_HILFESATZ: Record<Schritt, string> = {
  typ: 'Steht oben auf der Police. „Weiß ich nicht“ ist eine gültige Antwort.',
  status: 'So, wie es heute ist: läuft, beitragsfrei, gekündigt oder ausgezahlt.',
  versicherer: 'Der Name auf Ihrem Papier reicht – wir ordnen ihn zu.',
  beginn: 'Versicherungsbeginn, nicht Antragsdatum. Wenn Sie nur das Jahr wissen: reicht.',
  beitrag: 'Der Beitrag aus dem ersten Vertragsjahr – oder Ihr heutiger Beitrag.',
  dynamik: 'Dynamik heißt: Der Beitrag stieg jedes Jahr automatisch.',
  beitragssumme: 'Falls die Standmitteilung sie nennt – sonst einfach überspringen.',
  rueckkaufswert: 'Die wichtigste Zahl. Steht in der letzten Standmitteilung.',
  auszahlungen: 'Teilauszahlungen, Vorschüsse oder ein Policendarlehen.',
  eignung: 'Angaben zur Belehrung aus Ihren Vertragsunterlagen.',
  person: 'Adresse für Rechnung und Postversand. Geburtsdatum für die Rechnung Ihres Risikoanteils.',
  bestellung: 'Angaben prüfen, ankreuzen, bestellen – danach geht es zur Zahlungsseite.',
};

/** Welcher Hilfetext („Wo finde ich das?“) zu welchem Schritt gehört. */
export const SCHRITT_HILFEFELD: Partial<Record<Schritt, HilfeFeld>> = {
  typ: 'vertragsart',
  status: 'status',
  versicherer: 'versicherer',
  beginn: 'beginn',
  beitrag: 'beitrag',
  dynamik: 'dynamik',
  beitragssumme: 'beitragssumme',
  rueckkaufswert: 'rueckkaufswert',
  auszahlungen: 'auszahlungen',
  person: 'geburtsdatum',
};

export type Fehlerliste = Partial<Record<string, string>>;

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MONAT_MUSTER = /^\d{4}-\d{2}$/;
const PLZ_MUSTER = /^\d{5}$/;

export const BEGINN_MIN = `${BRAND.range.from}-01`;
export const BEGINN_MAX = `${BRAND.range.to}-12`;

/** Monat, mit dem ein nur ungefähr bekanntes Beginn-Jahr gerechnet wird (Jahresmitte). */
export const UNGEFAEHR_MONAT = '06';

/** Ist der Vertrag beendet (gekündigt/ausgezahlt)? Dann endet der Funnel mit dem Rot-Text. */
export function vertragBeendet(draft: CaseDraft): boolean {
  return draft.status === 'gekuendigt' || draft.status === 'abgelaufen';
}

/** Eintrittsalter in vollen Jahren aus Geburtsdatum (ISO) und Vertragsbeginn (YYYY-MM). */
export function eintrittsalter(geburtsdatum: string, beginn: string): number | undefined {
  // ISO oder deutsches Datum (TT.MM.JJJJ) – gleiche Lesart wie die Validierung und berechnung.ts.
  const iso = parseDatumDe(geburtsdatum);
  if (iso === null || !MONAT_MUSTER.test(beginn)) {
    return undefined;
  }
  const gJahr = Number(iso.slice(0, 4));
  const gMonat = Number(iso.slice(5, 7));
  const bJahr = Number(beginn.slice(0, 4));
  const bMonat = Number(beginn.slice(5, 7));
  const alter = bJahr - gJahr - (bMonat < gMonat ? 1 : 0);
  return alter >= 0 && alter <= 120 ? alter : undefined;
}

function pruefeBetragsfeld(
  fehler: Fehlerliste,
  feld: string,
  wert: string,
  pflicht: boolean,
  pflichtText: string,
): void {
  if (wert.trim() === '') {
    if (pflicht) {
      fehler[feld] = pflichtText;
    }
    return;
  }
  const betrag = parseDecimalDe(wert);
  if (betrag === null) {
    fehler[feld] = 'Bitte als Betrag schreiben, zum Beispiel 1.234,56.';
  } else if (betrag < 0) {
    fehler[feld] = 'Ein Betrag kann nicht negativ sein.';
  }
}

/** Validiert einen einzelnen Schritt und liefert Fehlermeldungen je Feld. */
export function validiereSchritt(
  schritt: Schritt,
  draft: CaseDraft,
  belehrungsCheck: boolean = VARIANTE.belehrungsCheck,
  bestellpflichten: boolean = VARIANTE.berichtKostenpflichtig,
): Fehlerliste {
  const fehler: Fehlerliste = {};

  switch (schritt) {
    case 'typ': {
      if (draft.vertragsart === '') {
        fehler['vertragsart'] = 'Bitte auswählen – „Weiß ich nicht“ ist eine gültige Antwort.';
      }
      break;
    }
    case 'status': {
      if (draft.status === '') {
        fehler['status'] = 'Bitte auswählen, wie es um den Vertrag steht.';
      } else if (
        draft.status !== 'laufend' &&
        draft.statusDatum !== '' &&
        MONAT_MUSTER.test(draft.beginn) &&
        MONAT_MUSTER.test(draft.statusDatum) &&
        draft.statusDatum < draft.beginn
      ) {
        fehler['statusDatum'] = 'Dieses Datum liegt vor dem Vertragsbeginn – bitte prüfen (Jahr vierstellig?).';
      }
      break;
    }
    case 'versicherer': {
      if (draft.versicherer.trim() === '') {
        fehler['versicherer'] = 'Bitte den Versicherer eintragen – der Name auf der Police reicht.';
      }
      break;
    }
    case 'beginn': {
      if (!MONAT_MUSTER.test(draft.beginn)) {
        fehler['beginn'] = draft.beginnUngefaehr
          ? 'Bitte das Jahr vierstellig angeben, zum Beispiel 1998.'
          : 'Bitte Monat und Jahr angeben, zum Beispiel 03/2000.';
      } else if (draft.beginn < BEGINN_MIN || draft.beginn > BEGINN_MAX) {
        fehler['beginn'] =
          `Wir rechnen Verträge mit Beginn ${BRAND.range.from} bis ${BRAND.range.to}. Für andere Jahrgänge nutzen Sie bitte die individuelle Anfrage.`;
      }
      break;
    }
    case 'beitrag': {
      if (draft.erstbeitragUnbekannt) {
        break;
      }
      pruefeBetragsfeld(
        fehler,
        'erstbeitrag',
        draft.erstbeitrag,
        true,
        'Bitte den Beitrag eintragen – er steht in der Police. Oder „Weiß ich nicht“ wählen.',
      );
      const wert = parseDecimalDe(draft.erstbeitrag);
      if (fehler['erstbeitrag'] === undefined && wert !== null && wert <= 0) {
        fehler['erstbeitrag'] = 'Der Beitrag muss größer als null sein.';
      }
      break;
    }
    case 'dynamik': {
      if (draft.dynamik === '') {
        fehler['dynamik'] = 'Bitte angeben, ob der Beitrag jedes Jahr gestiegen ist – „Weiß ich nicht“ geht auch.';
      } else if (draft.dynamik === 'ja') {
        const satz = parseProzentDe(draft.dynamikSatz);
        if (draft.dynamikSatz.trim() === '' || satz === null || satz <= 0 || satz > 15) {
          fehler['dynamikSatz'] = 'Bitte den Satz in Prozent angeben – meist 3, 5 oder 10.';
        }
      }
      break;
    }
    case 'beitragssumme': {
      pruefeBetragsfeld(fehler, 'gesamtsummeLautMitteilung', draft.gesamtsummeLautMitteilung, false, '');
      // Ohne ersten Beitrag trägt nur die Beitragssumme die Rechnung (Prompt 14, Schritt 5).
      if (draft.erstbeitragUnbekannt && fehler['gesamtsummeLautMitteilung'] === undefined) {
        const summe = parseDecimalDe(draft.gesamtsummeLautMitteilung);
        if (summe === null || summe <= 0) {
          fehler['gesamtsummeLautMitteilung'] =
            'Ohne ersten Beitrag brauchen wir die Summe der gezahlten Beiträge aus der Standmitteilung – oder bitte den Beitrag in der Police nachsehen.';
        }
      }
      break;
    }
    case 'rueckkaufswert': {
      pruefeBetragsfeld(
        fehler,
        'rueckkaufswert',
        draft.rueckkaufswert,
        true,
        'Bitte den Betrag eintragen – er steht in der letzten Standmitteilung bzw. Abrechnung.',
      );
      const rkw = parseDecimalDe(draft.rueckkaufswert);
      if (fehler['rueckkaufswert'] === undefined && rkw !== null && rkw <= 0) {
        fehler['rueckkaufswert'] = 'Der Rückkaufswert muss größer als null sein.';
      }
      break;
    }
    case 'auszahlungen': {
      if (draft.auszahlungenErhalten === '') {
        fehler['auszahlungenErhalten'] = 'Bitte auswählen – „Weiß ich nicht“ ist eine gültige Antwort.';
      } else if (draft.auszahlungenErhalten === 'ja') {
        if (draft.auszahlungenListe.length === 0) {
          fehler['auszahlungenListe'] = 'Bitte mindestens eine Auszahlung mit Datum und Betrag eintragen.';
        }
        draft.auszahlungenListe.forEach((eintrag, index) => {
          if (!MONAT_MUSTER.test(eintrag.monat)) {
            fehler[`auszahlung-${index}-monat`] = 'Bitte Monat und Jahr angeben, zum Beispiel 03/2015.';
          } else if (MONAT_MUSTER.test(draft.beginn) && eintrag.monat < draft.beginn) {
            fehler[`auszahlung-${index}-monat`] = 'Dieses Datum liegt vor dem Vertragsbeginn – bitte prüfen.';
          }
          pruefeBetragsfeld(
            fehler,
            `auszahlung-${index}-betrag`,
            eintrag.betrag,
            true,
            'Bitte den Betrag eintragen.',
          );
        });
      }
      break;
    }
    case 'eignung': {
      if (!belehrungsCheck) {
        break;
      }
      if (draft.zustandekommen === '') {
        fehler['zustandekommen'] = 'Bitte auswählen – „weiß ich nicht“ ist eine gültige Antwort.';
      }
      if (draft.belehrungVorhanden === '') {
        fehler['belehrungVorhanden'] = 'Bitte auswählen – „weiß ich nicht“ ist eine gültige Antwort.';
      }
      if (draft.belehrungVorhanden === 'ja') {
        if (draft.belehrungFrist === '') {
          fehler['belehrungFrist'] = 'Bitte die Frist laut Belehrung auswählen.';
        }
        if (draft.belehrungForm === '') {
          fehler['belehrungForm'] = 'Bitte die Form laut Belehrung auswählen.';
        }
        if (draft.hervorhebung === '') {
          fehler['hervorhebung'] = 'Bitte auswählen – „weiß ich nicht“ ist eine gültige Antwort.';
        }
      }
      if (draft.abgetretenOderBeliehen === '') {
        fehler['abgetretenOderBeliehen'] = 'Bitte auswählen – „weiß ich nicht“ ist eine gültige Antwort.';
      }
      break;
    }
    case 'person': {
      if (draft.vorname.trim() === '') {
        fehler['vorname'] = 'Bitte Ihren Vornamen eintragen.';
      }
      if (draft.nachname.trim() === '') {
        fehler['nachname'] = 'Bitte Ihren Nachnamen eintragen – er steht auf Gutachten und Rechnung.';
      }
      if (draft.email.trim() === '') {
        fehler['email'] = 'Bitte Ihre E-Mail-Adresse eintragen – dorthin geht das Gutachten.';
      } else if (!EMAIL_MUSTER.test(draft.email.trim())) {
        fehler['email'] = 'Diese E-Mail-Adresse sieht nicht vollständig aus.';
      }
      if (bestellpflichten) {
        if (draft.anrede === '') {
          fehler['anrede'] = 'Bitte eine Anrede wählen – „Keine Anrede“ geht auch.';
        }
        const alter = eintrittsalter(draft.geburtsdatum, draft.beginn);
        // Intern strikt ISO (steps.tsx speichert so); parseDatumDe liefert bei gültigem ISO exakt die Eingabe.
        if (draft.geburtsdatum === '' || parseDatumDe(draft.geburtsdatum) !== draft.geburtsdatum) {
          fehler['geburtsdatum'] = 'Bitte Ihr Geburtsdatum angeben, zum Beispiel 14.03.1962.';
        } else if (MONAT_MUSTER.test(draft.beginn) && (alter === undefined || alter < 14 || alter > 90)) {
          fehler['geburtsdatum'] = 'Bitte das Geburtsdatum prüfen – es passt nicht zum Vertragsbeginn.';
        }
        if (draft.strasse.trim() === '') {
          fehler['strasse'] = 'Bitte Straße und Hausnummer eintragen.';
        }
        if (!PLZ_MUSTER.test(draft.plz.trim())) {
          fehler['plz'] = 'Bitte eine fünfstellige Postleitzahl eintragen.';
        }
        if (draft.ort.trim() === '') {
          fehler['ort'] = 'Bitte den Ort eintragen.';
        }
      }
      break;
    }
    case 'bestellung': {
      if (!draft.einwilligungDatenschutz) {
        fehler['einwilligungDatenschutz'] = 'Ohne dieses Ja dürfen wir nicht rechnen.';
      }
      if (!draft.agbGelesen) {
        fehler['agbGelesen'] = 'Bitte bestätigen, dass Sie AGB und Widerrufsbelehrung gelesen haben.';
      }
      if (!draft.ausfuehrungZugestimmt) {
        fehler['ausfuehrungZugestimmt'] = 'Ohne diese Zustimmung dürfen wir das Gutachten nicht sofort erstellen.';
      }
      break;
    }
  }

  return fehler;
}

/** Prüft alle Schritte bis einschließlich `bisSchritt`. */
export function validiereBis(
  bisSchritt: Schritt,
  draft: CaseDraft,
  belehrungsCheck: boolean = VARIANTE.belehrungsCheck,
  bestellpflichten: boolean = VARIANTE.berichtKostenpflichtig,
): Fehlerliste {
  const fehler: Fehlerliste = {};
  for (const schritt of SCHRITTE) {
    Object.assign(fehler, validiereSchritt(schritt, draft, belehrungsCheck, bestellpflichten));
    if (schritt === bisSchritt) {
      break;
    }
  }
  return fehler;
}

/** Lädt den Entwurf aus localStorage; robust gegen fehlende/kaputte Daten. */
export function ladeDraft(): CaseDraft {
  if (typeof window === 'undefined') {
    return leererDraft();
  }
  try {
    const roh = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (roh === null) {
      return leererDraft();
    }
    const geparst: unknown = JSON.parse(roh);
    if (typeof geparst !== 'object' || geparst === null) {
      return leererDraft();
    }
    return uebernehmeBekannteFelder(geparst as Record<string, unknown>);
  } catch {
    return leererDraft();
  }
}

/**
 * Längenschranken bei der Übernahme (localStorage, API): begrenzen die
 * Fall-Kodierung für die Zahlungs-Metadaten (Stripe: 50 Schlüssel je Objekt)
 * deterministisch. Legitime Werte sind deutlich kürzer.
 */
const MAX_TEXT = 300;
const MAX_LISTENWERT = 40;

/** Nur bekannte Felder mit passendem Typ übernehmen (localStorage, API), Texte gekappt. */
export function uebernehmeBekannteFelder(quelle: Record<string, unknown>): CaseDraft {
  const basis = leererDraft();
  for (const schluessel of Object.keys(basis) as (keyof CaseDraft)[]) {
    if (schluessel === 'auszahlungenListe') {
      continue; // eigene Prüfung unten
    }
    const wert = quelle[schluessel];
    if (typeof wert === typeof basis[schluessel]) {
      (basis as unknown as Record<string, unknown>)[schluessel] =
        typeof wert === 'string' ? wert.slice(0, MAX_TEXT) : wert;
    }
  }
  const liste = quelle['auszahlungenListe'];
  if (Array.isArray(liste)) {
    basis.auszahlungenListe = liste
      .filter(
        (e): e is { monat: unknown; betrag: unknown } => typeof e === 'object' && e !== null,
      )
      .map((e) => ({
        monat: typeof e.monat === 'string' ? e.monat.slice(0, MAX_LISTENWERT) : '',
        betrag: typeof e.betrag === 'string' ? e.betrag.slice(0, MAX_LISTENWERT) : '',
      }))
      .slice(0, 20);
  }
  basis.version = 2;
  return basis;
}

export function speichereDraft(draft: CaseDraft): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Speichern ist Komfort, kein Muss (z. B. privates Fenster).
  }
}

export function loescheDraft(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // siehe speichereDraft
  }
}
