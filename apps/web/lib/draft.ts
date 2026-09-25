/**
 * Datenmodell und Validierung des Rechner-Assistenten (Prompt 12, 3.2):
 * eine Frage je Bildschirm, zehn Schritte, Fortschrittsbalken.
 *
 * `CaseDraft` ist ein reines UI-Modell (alle Felder mit Leerwert-Default): Es
 * sammelt die Angaben, die der Rechenkern (`ContractInput`) auswertet; die
 * Abbildung steht in lib/berechnung.ts. In der Kanzlei-Variante (Modell C)
 * kommt vor dem Kontakt-Schritt der Eignungs-Check (Belehrungsfragen) dazu.
 *
 * Zwischenspeicherung: localStorage im Browser; an den Server geht nur die
 * zustandslose Vorschau-Anfrage (nichts wird gespeichert).
 */
import { BRAND } from '@/config/brand';
import { VARIANTE } from '@/config/variante';
import { parseDecimalDe } from './format';

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

export interface AuszahlungsEintrag {
  /** ISO YYYY-MM. */
  monat: string;
  /** Betrag als Eingabetext (de-DE). */
  betrag: string;
}

export interface CaseDraft {
  version: 2;
  // 1 – „Um welchen Vertrag geht es?“
  vertragsart: Vertragsart;
  // 2 – „Läuft der Vertrag noch?“ (+ seit wann, falls beendet – für die Gegenrechnung)
  status: Vertragsstatus;
  statusDatum: string; // ISO YYYY-MM, optional
  // 3 – „Wer ist der Versicherer?“
  versicherer: string;
  // 4 – „Wann hat der Vertrag begonnen?“ (BRAND.range)
  beginn: string; // ISO YYYY-MM
  // 5 – „Wie hoch war der erste Monatsbeitrag?“ (DM/€-Schalter vor 2002)
  erstbeitrag: string;
  erstbeitragWaehrung: Waehrung;
  zahlweise: Zahlweise;
  // 6 – „Gab es eine Dynamik?“
  dynamik: JaNeinUnbekannt;
  dynamikSatz: string; // Prozent, z. B. „5“
  // 7 – „Was steht als eingezahlte Beiträge in der Standmitteilung?“ (überspringbar)
  gesamtsummeLautMitteilung: string;
  // 8 – „Wie hoch ist der Rückkaufswert?“
  rueckkaufswert: string;
  // 9 – „Gab es Auszahlungen?“
  auszahlungenErhalten: JaNeinUnbekannt;
  auszahlungenListe: AuszahlungsEintrag[];
  // 10 – „Wohin sollen wir das Ergebnis schicken?“
  email: string;
  telefon: string;
  einwilligungDatenschutz: boolean;
  rechtsschutz: boolean;
  // Bestellung (Rechnung) – wird erst im Bestellformular erfragt.
  name: string;
  // Weitere Angaben ohne eigenen Bildschirm (Kanzlei-Variante, Bericht).
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
  /** Eigener, nie vorangekreuzter Block auf der Ergebnis-Seite (Ankauf). */
  einwilligungAnkaufKontakt: boolean;
  /** ISO-Zeitpunkt des Absendens; leer = noch nicht abgesendet. */
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
    erstbeitrag: '',
    erstbeitragWaehrung: 'EUR',
    zahlweise: 'monatlich',
    dynamik: '',
    dynamikSatz: '',
    gesamtsummeLautMitteilung: '',
    rueckkaufswert: '',
    auszahlungenErhalten: '',
    auszahlungenListe: [],
    email: '',
    telefon: '',
    einwilligungDatenschutz: false,
    rechtsschutz: false,
    name: '',
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
  'kontakt',
] as const;

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
  'kontakt',
] as const;

export type Schritt = (typeof SCHRITTE_KANZLEI)[number];

export const SCHRITTE: readonly Schritt[] = VARIANTE.belehrungsCheck
  ? SCHRITTE_KANZLEI
  : SCHRITTE_PRIVAT;

/** Die Frage je Bildschirm (Prompt 12, Abschnitt 3.2). */
export const SCHRITT_FRAGE: Record<Schritt, string> = {
  typ: 'Um welchen Vertrag geht es?',
  status: 'Läuft der Vertrag noch?',
  versicherer: 'Wer ist der Versicherer?',
  beginn: 'Wann hat der Vertrag begonnen?',
  beitrag: 'Wie hoch war der erste Monatsbeitrag?',
  dynamik: 'Gab es eine Dynamik?',
  beitragssumme: 'Was steht als eingezahlte Beiträge in der Standmitteilung?',
  rueckkaufswert: 'Wie hoch ist der Rückkaufswert?',
  auszahlungen: 'Gab es Auszahlungen?',
  eignung: 'Fragen zur Belehrung (Kanzlei-Check)',
  kontakt: 'Wohin sollen wir das Ergebnis schicken?',
};

export type Fehlerliste = Partial<Record<string, string>>;

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MONAT_MUSTER = /^\d{4}-\d{2}$/;

export const BEGINN_MIN = `${BRAND.range.from}-01`;
export const BEGINN_MAX = `${BRAND.range.to}-12`;

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
        fehler['beginn'] = 'Bitte Monat und Jahr angeben, zum Beispiel 03/2000.';
      } else if (draft.beginn < BEGINN_MIN || draft.beginn > BEGINN_MAX) {
        fehler['beginn'] =
          `Wir rechnen Verträge mit Beginn ${BRAND.range.from} bis ${BRAND.range.to}. Für andere Jahrgänge nutzen Sie bitte die individuelle Anfrage.`;
      }
      break;
    }
    case 'beitrag': {
      pruefeBetragsfeld(
        fehler,
        'erstbeitrag',
        draft.erstbeitrag,
        true,
        'Bitte den ersten Beitrag eintragen – er steht in der Police.',
      );
      const wert = parseDecimalDe(draft.erstbeitrag);
      if (fehler['erstbeitrag'] === undefined && wert !== null && wert <= 0) {
        fehler['erstbeitrag'] = 'Der Beitrag muss größer als null sein.';
      }
      break;
    }
    case 'dynamik': {
      if (draft.dynamik === '') {
        fehler['dynamik'] = 'Bitte angeben, ob der Beitrag jedes Jahr gestiegen ist.';
      } else if (draft.dynamik === 'ja') {
        const satz = parseDecimalDe(draft.dynamikSatz);
        if (draft.dynamikSatz.trim() === '' || satz === null || satz <= 0 || satz > 15) {
          fehler['dynamikSatz'] = 'Bitte den Satz in Prozent angeben – meist 3, 5 oder 10.';
        }
      }
      break;
    }
    case 'beitragssumme': {
      pruefeBetragsfeld(fehler, 'gesamtsummeLautMitteilung', draft.gesamtsummeLautMitteilung, false, '');
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
      break;
    }
    case 'auszahlungen': {
      if (draft.auszahlungenErhalten === '') {
        fehler['auszahlungenErhalten'] = 'Bitte auswählen, ob Sie schon Geld ausgezahlt bekommen haben.';
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
    case 'kontakt': {
      if (draft.email.trim() === '') {
        fehler['email'] = 'Bitte Ihre E-Mail-Adresse eintragen – dorthin geht der Ergebnis-Link.';
      } else if (!EMAIL_MUSTER.test(draft.email.trim())) {
        fehler['email'] = 'Diese E-Mail-Adresse sieht nicht vollständig aus.';
      }
      if (!draft.einwilligungDatenschutz) {
        fehler['einwilligungDatenschutz'] = 'Ohne dieses Ja dürfen wir nicht rechnen.';
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
): Fehlerliste {
  const fehler: Fehlerliste = {};
  for (const schritt of SCHRITTE) {
    Object.assign(fehler, validiereSchritt(schritt, draft, belehrungsCheck));
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

/** Nur bekannte Felder mit passendem Typ übernehmen (localStorage, API). */
export function uebernehmeBekannteFelder(quelle: Record<string, unknown>): CaseDraft {
  const basis = leererDraft();
  for (const schluessel of Object.keys(basis) as (keyof CaseDraft)[]) {
    if (schluessel === 'auszahlungenListe') {
      continue; // eigene Prüfung unten
    }
    const wert = quelle[schluessel];
    if (typeof wert === typeof basis[schluessel]) {
      (basis as unknown as Record<string, unknown>)[schluessel] = wert;
    }
  }
  const liste = quelle['auszahlungenListe'];
  if (Array.isArray(liste)) {
    basis.auszahlungenListe = liste
      .filter(
        (e): e is { monat: unknown; betrag: unknown } => typeof e === 'object' && e !== null,
      )
      .map((e) => ({
        monat: typeof e.monat === 'string' ? e.monat : '',
        betrag: typeof e.betrag === 'string' ? e.betrag : '',
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
