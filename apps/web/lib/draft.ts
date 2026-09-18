/**
 * Datenmodell und Validierung des mehrstufigen Rechner-Formulars.
 *
 * `CaseDraft` ist ein reines UI-Modell (alle Felder mit Leerwert-Default): Es
 * sammelt die Angaben, die Rechenkern (`ContractInput`) und Eignungs-Check
 * (`EligibilityInput`) auswerten; die Abbildung steht in lib/berechnung.ts.
 *
 * Produktvarianten (config/variante.ts): Im Verbraucherprodukt ist die
 * Belehrungsbewertung abgeschaltet – Schritt 5 ist dann eine neutrale
 * Unterlagen-Checkliste; in der Kanzlei-Variante bleibt der Eignungs-Check.
 *
 * Zwischenspeicherung: localStorage im Browser; an den Server geht nur die
 * zustandslose Vorschau-Anfrage (nichts wird gespeichert).
 */
import { VARIANTE } from '@/config/variante';
import { parseDecimalDe } from './format';

export const DRAFT_STORAGE_KEY = 'rueckab.rechner.entwurf.v1';

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

export interface CaseDraft {
  version: 1;
  // Schritt 1 – Kontakt
  name: string;
  email: string;
  telefon: string;
  // Schritt 2 – Vertrag
  versicherer: string;
  vertragsart: Vertragsart;
  beginn: string; // ISO YYYY-MM
  ende: string; // ISO YYYY-MM, optional
  status: Vertragsstatus;
  statusDatum: string; // ISO YYYY-MM, bei beitragsfrei/gekündigt/abgelaufen
  // Schritt 3 – Beiträge
  zahlweise: Zahlweise;
  erstbeitrag: string;
  erstbeitragWaehrung: Waehrung;
  aktuellerBeitrag: string;
  dynamik: JaNeinUnbekannt;
  gesamtsummeLautMitteilung: string;
  beitragszahlungBis: string; // ISO YYYY-MM, optional
  // Schritt 4 – Werte
  rueckkaufswert: string;
  auszahlungenErhalten: JaNeinUnbekannt;
  auszahlungenSumme: string;
  policendarlehen: JaNeinUnbekannt;
  buzEnthalten: JaNeinUnbekannt;
  // Schritt 5a – Eignungs-Check (nur Kanzlei-Variante)
  zustandekommen: Zustandekommen;
  belehrungVorhanden: JaNeinUnbekannt;
  belehrungFrist: BelehrungFrist;
  belehrungForm: BelehrungForm;
  hervorhebung: JaNeinUnbekannt;
  abgetretenOderBeliehen: JaNeinUnbekannt;
  // Schritt 5b – Unterlagen-Checkliste (Verbraucherprodukt)
  unterlagePolice: boolean;
  unterlageBegleitschreiben: boolean;
  unterlageBedingungen: boolean;
  unterlageStandmitteilung: boolean;
  unterlageAbrechnung: boolean;
  // Schritt 6 – Zusammenfassung & Einwilligungen
  einwilligungDatenschutz: boolean;
  einwilligungKontakt: boolean;
  /** Eigener, nie vorangekreuzter Block auf der Ergebnis-Seite (Ankauf). */
  einwilligungAnkaufKontakt: boolean;
  /** ISO-Zeitpunkt des Absendens; leer = noch nicht abgesendet. */
  eingereichtAm: string;
}

export function leererDraft(): CaseDraft {
  return {
    version: 1,
    name: '',
    email: '',
    telefon: '',
    versicherer: '',
    vertragsart: '',
    beginn: '',
    ende: '',
    status: '',
    statusDatum: '',
    zahlweise: '',
    erstbeitrag: '',
    erstbeitragWaehrung: 'EUR',
    aktuellerBeitrag: '',
    dynamik: '',
    gesamtsummeLautMitteilung: '',
    beitragszahlungBis: '',
    rueckkaufswert: '',
    auszahlungenErhalten: '',
    auszahlungenSumme: '',
    policendarlehen: '',
    buzEnthalten: '',
    zustandekommen: '',
    belehrungVorhanden: '',
    belehrungFrist: '',
    belehrungForm: '',
    hervorhebung: '',
    abgetretenOderBeliehen: '',
    unterlagePolice: false,
    unterlageBegleitschreiben: false,
    unterlageBedingungen: false,
    unterlageStandmitteilung: false,
    unterlageAbrechnung: false,
    einwilligungDatenschutz: false,
    einwilligungKontakt: false,
    einwilligungAnkaufKontakt: false,
    eingereichtAm: '',
  };
}

export const SCHRITTE = [
  'kontakt',
  'vertrag',
  'beitraege',
  'werte',
  'eignung',
  'zusammenfassung',
] as const;

export type Schritt = (typeof SCHRITTE)[number];

export const SCHRITT_TITEL: Record<Schritt, string> = {
  kontakt: 'Kontakt',
  vertrag: 'Police',
  beitraege: 'Beiträge',
  werte: 'Werte',
  eignung: VARIANTE.belehrungsCheck ? 'Eignungs-Check' : 'Unterlagen',
  zusammenfassung: 'Prüfen',
};

export type Fehlerliste = Partial<Record<string, string>>;

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MONAT_MUSTER = /^\d{4}-\d{2}$/;

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

/**
 * Validiert einen einzelnen Schritt und liefert Fehlermeldungen je Feld.
 * `belehrungsCheck` steuert, ob Schritt 5 die Eignungs-Fragen (Kanzlei) oder
 * die Unterlagen-Checkliste (Verbraucher, keine Pflichtfelder) enthält.
 */
export function validiereSchritt(
  schritt: Schritt,
  draft: CaseDraft,
  belehrungsCheck: boolean = VARIANTE.belehrungsCheck,
): Fehlerliste {
  const fehler: Fehlerliste = {};

  switch (schritt) {
    case 'kontakt': {
      if (draft.name.trim() === '') {
        fehler['name'] = 'Bitte Ihren Namen eintragen.';
      }
      if (draft.email.trim() === '') {
        fehler['email'] = 'Bitte Ihre E-Mail-Adresse eintragen.';
      } else if (!EMAIL_MUSTER.test(draft.email.trim())) {
        fehler['email'] = 'Diese E-Mail-Adresse sieht nicht vollständig aus.';
      }
      break;
    }
    case 'vertrag': {
      if (draft.versicherer.trim() === '') {
        fehler['versicherer'] = 'Bitte den Versicherer eintragen – der Name auf der Police reicht.';
      }
      if (draft.vertragsart === '') {
        fehler['vertragsart'] = 'Bitte die Vertragsart auswählen.';
      }
      if (!MONAT_MUSTER.test(draft.beginn)) {
        fehler['beginn'] = 'Bitte Monat und Jahr des Beginns angeben.';
      }
      if (draft.ende !== '' && !MONAT_MUSTER.test(draft.ende)) {
        fehler['ende'] = 'Bitte Monat und Jahr angeben oder das Feld leer lassen.';
      }
      if (draft.status === '') {
        fehler['status'] = 'Bitte auswählen, wie es um den Vertrag steht.';
      } else if (draft.status !== 'laufend' && !MONAT_MUSTER.test(draft.statusDatum)) {
        fehler['statusDatum'] = 'Bitte angeben, seit wann bzw. zu wann das gilt (Monat und Jahr).';
      }
      break;
    }
    case 'beitraege': {
      if (draft.zahlweise === '') {
        fehler['zahlweise'] = 'Bitte die Zahlweise auswählen.';
      }
      const erstbeitragPflicht = draft.aktuellerBeitrag.trim() === '';
      pruefeBetragsfeld(
        fehler,
        'erstbeitrag',
        draft.erstbeitrag,
        erstbeitragPflicht,
        'Bitte den ersten oder den heutigen Beitrag eintragen – einer reicht.',
      );
      pruefeBetragsfeld(fehler, 'aktuellerBeitrag', draft.aktuellerBeitrag, false, '');
      if (draft.dynamik === '') {
        fehler['dynamik'] = 'Bitte angeben, ob der Beitrag jedes Jahr steigt.';
      }
      pruefeBetragsfeld(fehler, 'gesamtsummeLautMitteilung', draft.gesamtsummeLautMitteilung, false, '');
      if (draft.beitragszahlungBis !== '' && !MONAT_MUSTER.test(draft.beitragszahlungBis)) {
        fehler['beitragszahlungBis'] = 'Bitte Monat und Jahr angeben oder das Feld leer lassen.';
      }
      break;
    }
    case 'werte': {
      pruefeBetragsfeld(fehler, 'rueckkaufswert', draft.rueckkaufswert, false, '');
      if (draft.auszahlungenErhalten === '') {
        fehler['auszahlungenErhalten'] = 'Bitte auswählen, ob Sie schon Geld ausgezahlt bekommen haben.';
      } else if (draft.auszahlungenErhalten === 'ja') {
        pruefeBetragsfeld(
          fehler,
          'auszahlungenSumme',
          draft.auszahlungenSumme,
          true,
          'Bitte die Summe der Auszahlungen eintragen – geschätzt reicht.',
        );
      }
      if (draft.policendarlehen === '') {
        fehler['policendarlehen'] = 'Bitte auswählen, ob ein Policendarlehen besteht oder bestand.';
      }
      if (draft.buzEnthalten === '') {
        fehler['buzEnthalten'] = 'Bitte auswählen, ob ein Berufsunfähigkeitsschutz enthalten ist.';
      }
      break;
    }
    case 'eignung': {
      if (!belehrungsCheck) {
        break; // Unterlagen-Checkliste: keine Pflichtfelder.
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
    case 'zusammenfassung': {
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
    const wert = quelle[schluessel];
    if (typeof wert === typeof basis[schluessel]) {
      (basis as unknown as Record<string, unknown>)[schluessel] = wert;
    }
  }
  basis.version = 1;
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
