/**
 * Auslieferung in zwei Phasen (Prompt 13, Abschnitt 3; Prompt 14: Gutachten,
 * Annahmen-Kasten, Postversand mit Druckvorlage, Rückfrage bei unbekannter
 * Vertragsart):
 *
 * Phase A (Webhook, sofort): Vertragsbestätigung (§ 312f BGB), ggf. Rückfrage
 * zur Vertragsart, Gutachten erzeugen und plausibilisieren (Kennzeichen für
 * die Freigabe-Liste), Marker `erzeugt` setzen – das Gutachten wird NICHT
 * sofort versendet.
 *
 * Phase B (Freigabe im Admin ODER automatisch nach `autoVersandNachStunden`,
 * angestoßen vom Cron /api/auslieferung/cron): Gutachten versenden, Marker
 * `ausgeliefert`. So werden die zugesagten 12 Stunden immer gehalten. Ist der
 * Postversand gewählt, geht zusätzlich die Druckvorlage (Deckblatt mit
 * Anschrift, Gutachten, Beileger) als Druckauftrag an den Anbieter; der Stand
 * (gewünscht → gedruckt → versendet) steht als Marker `post_status`/`post_am`.
 *
 * Erstkunden (EK-…) werden weiterhin direkt beliefert (erfuelleBestellung).
 * Der Stand je Bestellung liegt als status.json im Auslieferungsordner;
 * dauerhafte Marker (Serverless) liegen in den Stripe-PaymentIntent-Metadaten.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type Stripe from 'stripe';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { RiskDefaults } from '@rueckab/calc';
import { pruefeEignung } from '@rueckab/eligibility';
import type { Regelwerk } from '@rueckab/eligibility';
import { formatDatum, htmlZuPdf, renderBerichtHtml, renderDruckvorlageHtml } from '@rueckab/report';
import type { BerichtInput, KopfzeilenDaten } from '@rueckab/report';
import riskJson from '../../../data/risk-defaults.json';
import rulesJson from '../../../data/legal-rules.json';
import { AMPEL } from '@/config/ampel';
import { BRAND } from '@/config/brand';
import { BERICHT_VERSAND } from '@/config/business';
import { KONDITIONEN_PLATZHALTER } from '@/config/durchsetzung';
import { VARIANTE } from '@/config/variante';
import { draftZuEingaben } from './berechnung';
import { versandadresse, type Versandadresse } from './bestellung';
import {
  berichtVerzoegert,
  berichtVersand,
  druckauftrag,
  internerFehlerHinweis,
  rueckfrageVertragsart,
  vertragsbestaetigung,
} from './emails';
import { fallAusMetadaten } from './fall-kodierung';
import { heuteBerlin } from './format';
import { findeVersichererId, insurersDaten, versichererNachId } from './insurers-data';
import { sendeMail } from './versand';
import { basisUrl } from './zahlung';

const riskDefaults = riskJson as unknown as RiskDefaults;
const regelwerk = rulesJson as unknown as Regelwerk;

export interface AuslieferungsStatus {
  bestellnummer: string;
  sitzung: string;
  email: string;
  kundenname: string;
  bezahltAm: string;
  berichtDatei?: string;
  /** Druckvorlage für den Postversand (nur wenn gewählt). */
  druckDatei?: string;
  berichtErstelltAm?: string;
  rechnungLink?: string;
  bestaetigungGesendetAm?: string;
  mailVersendetAm?: string;
  mailWeg?: string;
  druckauftragGesendetAm?: string;
  verzoegerungGemeldetAm?: string;
  fehler?: string[];
}

export interface SitzungsDaten {
  id: string;
  bestellnummer: string;
  kundenname: string;
  email: string;
  metadata: Record<string, string>;
  /** Gedruckte Fassung per Post gewählt (Metadatum `post` = '1'). */
  postversand: boolean;
  rechnungId?: string;
  zahlungId?: string;
}

export interface Berichtsdatei {
  pfad: string;
  dateiname: string;
  /** Druckvorlage (A4, beidseitig) – nur bei Postversand. */
  druckPfad?: string;
  druckDateiname?: string;
}

/** Stand des Postversands (Admin-Spalte „Post“, Prompt 14, 3). */
export type PostStand = 'gewuenscht' | 'gedruckt' | 'versendet';

export const POST_STAENDE: readonly PostStand[] = ['gewuenscht', 'gedruckt', 'versendet'];

export const POST_STAND_LABEL: Record<PostStand, string> = {
  gewuenscht: 'gewünscht',
  gedruckt: 'gedruckt',
  versendet: 'versendet',
};

/** Dauerhafte Marker außerhalb des Dateisystems (Serverless: /tmp überlebt den Aufruf nicht). */
export interface AuslieferungsMarker {
  ausgeliefert?: string;
  bestaetigt?: string;
  verzoegert?: string;
  /** Phase A abgeschlossen: Gutachten erzeugt und plausibilisiert (ISO-Zeit). */
  erzeugt?: string;
  /** Menschliche Freigabe im Admin (ISO-Zeit) – löst den Versand aus. */
  freigegeben?: string;
  /** Kennzeichen der Plausibilisierung, „;“-getrennt (Freigabe-Liste). */
  kennzeichen?: string;
  /** Lead-Status im Admin (Prompt 13, 2.3). */
  leadStatus?: string;
  /** Postversand: gewünscht / gedruckt / versendet (Prompt 14, 3). */
  post?: PostStand;
  /** Zeitpunkt der letzten Post-Änderung (ISO). */
  postAm?: string;
  /** Versand begonnen (ISO-Zeit) – Sperre gegen parallelen Versand (Cron + Freigabe, zwei Zeitplaner). */
  versandBegonnen?: string;
}

export const LEAD_STATUS = ['Gutachten gekauft', 'Übernahme angefragt', 'Mandat', 'Vergleich/Urteil'] as const;

export interface ErfuellungsAbhaengigkeiten {
  erzeugeBericht: (daten: SitzungsDaten, ordner: string, jetzt: Date) => Promise<Berichtsdatei>;
  sendeMail: typeof sendeMail;
  rechnungLink: (rechnungId: string) => Promise<string | undefined>;
  holeMarker: (daten: SitzungsDaten) => Promise<AuslieferungsMarker>;
  setzeMarker: (daten: SitzungsDaten, patch: AuslieferungsMarker) => Promise<void>;
  jetzt: () => Date;
}

export function auslieferungsVerzeichnis(): string {
  const konfiguriert = process.env['AUSLIEFERUNG_VERZEICHNIS'];
  if (konfiguriert !== undefined && konfiguriert !== '') {
    return konfiguriert;
  }
  // Serverless (Vercel): nur /tmp ist beschreibbar, und nur für die Dauer eines Aufrufs.
  // Die dauerhafte „schon ausgeliefert“-Markierung liegt deshalb bei Stripe (PaymentIntent-Metadaten).
  return process.env['VERCEL'] !== undefined ? '/tmp/auslieferungen' : resolve(process.cwd(), 'var/auslieferungen');
}

function statusPfad(ordner: string): string {
  return resolve(ordner, 'status.json');
}

export function ladeStatus(ordner: string): AuslieferungsStatus | undefined {
  const pfad = statusPfad(ordner);
  if (!existsSync(pfad)) {
    return undefined;
  }
  return JSON.parse(readFileSync(pfad, 'utf8')) as AuslieferungsStatus;
}

function speichereStatus(ordner: string, status: AuslieferungsStatus): void {
  mkdirSync(ordner, { recursive: true });
  writeFileSync(statusPfad(ordner), `${JSON.stringify(status, null, 2)}\n`);
}

/** Zieht die für die Auslieferung nötigen Felder aus der Checkout-Sitzung. */
export function sitzungsDaten(sitzung: Stripe.Checkout.Session): SitzungsDaten {
  const metadata = (sitzung.metadata ?? {}) as Record<string, string>;
  const bestellnummer = metadata['bestellnummer'];
  if (bestellnummer === undefined || bestellnummer === '') {
    throw new Error('Checkout-Sitzung ohne Bestellnummer.');
  }
  const email = sitzung.customer_details?.email ?? sitzung.customer_email ?? '';
  if (email === '') {
    throw new Error(`Bestellung ${bestellnummer}: keine E-Mail-Adresse in der Sitzung.`);
  }
  const rechnung = sitzung.invoice;
  const rechnungId = typeof rechnung === 'string' ? rechnung : rechnung?.id;
  const zahlung = sitzung.payment_intent;
  const zahlungId = typeof zahlung === 'string' ? zahlung : zahlung?.id;
  return {
    id: sitzung.id,
    bestellnummer,
    kundenname: metadata['kundenname'] ?? sitzung.customer_details?.name ?? '',
    email,
    metadata,
    postversand: metadata['post'] === '1',
    ...(rechnungId !== undefined ? { rechnungId } : {}),
    ...(zahlungId !== undefined ? { zahlungId } : {}),
  };
}

export interface GutachtenDaten {
  bericht: BerichtInput;
  adresse: Versandadresse;
  kopf: KopfzeilenDaten;
  /** Vertragsart „Weiß ich nicht“ – Rückfrage per E-Mail (Prompt 14, Schritt 1). */
  rueckfrageVertragsart: boolean;
}

/** Rechnet den Fall aus den Sitzungs-Metadaten und baut die Eingaben des Gutachtens. */
export function gutachtenDaten(daten: SitzungsDaten, jetzt: Date): GutachtenDaten {
  const draft = fallAusMetadaten(daten.metadata);
  if (draft === undefined) {
    throw new Error('Falldaten fehlen in der Zahlungssitzung.');
  }
  // Kalendertag in deutscher Zeit (Serverless läuft in UTC): Stichtag und „Erstellt am“.
  const heute = heuteBerlin(jetzt);
  const abbildung = draftZuEingaben(draft, findeVersichererId, heute.slice(0, 7));
  if (abbildung.fehler.length > 0) {
    throw new Error(`Falldaten unvollständig: ${abbildung.fehler.join(' ')}`);
  }
  const calc = berechneRueckabwicklung(abbildung.contract, insurersDaten, riskDefaults);
  const eligibility = pruefeEignung(abbildung.eligibility, regelwerk);
  const versicherer = versichererNachId(abbildung.contract.versichererId);
  // Nicht zugeordnete Eingabe trotzdem als Kundenangabe ausweisen (Kennzahlen: Branchendurchschnitt).
  const eingabeVersicherer = draft.versicherer.trim().slice(0, 80);
  const a = BRAND.anbieterAnschrift;
  const bericht: BerichtInput = {
    marke: BRAND.name,
    aktenzeichen: daten.bestellnummer,
    kundenname: daten.kundenname,
    erstelltAm: heute,
    versichererAnzeigename:
      versicherer?.kanonischerName ??
      (eingabeVersicherer !== ''
        ? `${eingabeVersicherer} (nicht zugeordnet – Kennzahlen: Branchendurchschnitt)`
        : 'nicht benannt (Branchendurchschnitt)'),
    contract: abbildung.contract,
    calc,
    eligibility,
    // Verbraucherprodukt ohne Belehrungsbewertung; Übernahme-Schwellen aus config/ampel.ts.
    belehrungsCheck: VARIANTE.belehrungsCheck,
    ampelSchwellen: {
      mehrwertMinAbsolut: AMPEL.gruen.mehrwertMinAbsolut,
      minRueckkaufswert: AMPEL.uebernahme.minRueckkaufswert,
    },
    durchsetzungUrl: `${basisUrl()}/durchsetzung`,
    verkaufenUrl: `${BRAND.domain}/verkaufen`,
    konditionenText: KONDITIONEN_PLATZHALTER,
    // Prompt 14, 3: alle „Weiß ich nicht“-Annahmen im Kasten „Ihre Angaben und unsere Annahmen“.
    annahmenKunde: abbildung.zusatzAnnahmen,
    ankaufHinweis: VARIANTE.ankaufHinweis,
    absender: `${BRAND.name} · ${BRAND.anbieter} · ${a.strasse} · ${a.plz} ${a.ort}`,
  };
  return {
    bericht,
    adresse: versandadresse(draft),
    kopf: { marke: BRAND.name, aktenzeichen: daten.bestellnummer, kundenname: daten.kundenname, datum: formatDatum(heute) },
    rueckfrageVertragsart: abbildung.rueckfrageVertragsart,
  };
}

function basisname(bestellnummer: string): string {
  return `${BRAND.produktname.replace(/\s+/g, '-')}_${bestellnummer}`;
}

/**
 * Rechnet den Fall und schreibt HTML + PDF des Gutachtens in den Bestellordner –
 * bei Postversand zusätzlich die Druckvorlage (Deckblatt, Gutachten, Beileger).
 */
export async function erzeugeBericht(daten: SitzungsDaten, ordner: string, jetzt: Date): Promise<Berichtsdatei> {
  const { bericht, adresse, kopf } = gutachtenDaten(daten, jetzt);
  mkdirSync(ordner, { recursive: true });
  const name = basisname(daten.bestellnummer);
  const html = renderBerichtHtml(bericht);
  writeFileSync(resolve(ordner, `${name}.html`), html);
  const pfad = resolve(ordner, `${name}.pdf`);
  await htmlZuPdf(html, pfad, kopf);
  const ergebnis: Berichtsdatei = { pfad, dateiname: `${name}.pdf` };
  if (daten.postversand) {
    const druckHtml = renderDruckvorlageHtml(bericht, adresse);
    writeFileSync(resolve(ordner, `${name}_Druck.html`), druckHtml);
    const druckPfad = resolve(ordner, `${name}_Druck.pdf`);
    await htmlZuPdf(druckHtml, druckPfad, kopf);
    ergebnis.druckPfad = druckPfad;
    ergebnis.druckDateiname = `${name}_Druck.pdf`;
  }
  return ergebnis;
}

/** Druckvorlage auf Abruf (Admin: erneut herunterladen) – unabhängig vom Metadatum `post`. */
export async function erzeugeDruckvorlage(daten: SitzungsDaten, jetzt: Date): Promise<Berichtsdatei> {
  const { bericht, adresse, kopf } = gutachtenDaten(daten, jetzt);
  const ordner = resolve(auslieferungsVerzeichnis(), daten.bestellnummer);
  mkdirSync(ordner, { recursive: true });
  const name = `${basisname(daten.bestellnummer)}_Druck`;
  const html = renderDruckvorlageHtml(bericht, adresse);
  const pfad = resolve(ordner, `${name}.pdf`);
  await htmlZuPdf(html, pfad, kopf);
  return { pfad, dateiname: `${name}.pdf` };
}

function markerAusMetadaten(m: Record<string, string>): AuslieferungsMarker {
  const post = m['post_status'];
  return {
    ...((m['ausgeliefert_am'] ?? '') !== '' ? { ausgeliefert: m['ausgeliefert_am'] } : {}),
    ...((m['bestaetigt_am'] ?? '') !== '' ? { bestaetigt: m['bestaetigt_am'] } : {}),
    ...((m['verzoegert_am'] ?? '') !== '' ? { verzoegert: m['verzoegert_am'] } : {}),
    ...((m['erzeugt_am'] ?? '') !== '' ? { erzeugt: m['erzeugt_am'] } : {}),
    ...((m['freigegeben_am'] ?? '') !== '' ? { freigegeben: m['freigegeben_am'] } : {}),
    ...((m['kennzeichen'] ?? '') !== '' ? { kennzeichen: m['kennzeichen'] } : {}),
    ...((m['lead_status'] ?? '') !== '' ? { leadStatus: m['lead_status'] } : {}),
    ...(post !== undefined && (POST_STAENDE as readonly string[]).includes(post) ? { post: post as PostStand } : {}),
    ...((m['post_am'] ?? '') !== '' ? { postAm: m['post_am'] } : {}),
    ...((m['versand_begonnen_am'] ?? '') !== '' ? { versandBegonnen: m['versand_begonnen_am'] } : {}),
  };
}

export function standardAbhaengigkeiten(stripe: Stripe): ErfuellungsAbhaengigkeiten {
  return {
    erzeugeBericht,
    sendeMail,
    rechnungLink: async (rechnungId) => {
      const rechnung = await stripe.invoices.retrieve(rechnungId);
      return rechnung.hosted_invoice_url ?? rechnung.invoice_pdf ?? undefined;
    },
    holeMarker: async (daten) => {
      if (daten.zahlungId === undefined) {
        return {};
      }
      const zahlung = await stripe.paymentIntents.retrieve(daten.zahlungId);
      return markerAusMetadaten(zahlung.metadata);
    },
    setzeMarker: async (daten, patch) => {
      if (daten.zahlungId === undefined) {
        return;
      }
      await stripe.paymentIntents.update(daten.zahlungId, {
        metadata: {
          ...(patch.ausgeliefert !== undefined ? { ausgeliefert_am: patch.ausgeliefert } : {}),
          ...(patch.bestaetigt !== undefined ? { bestaetigt_am: patch.bestaetigt } : {}),
          ...(patch.verzoegert !== undefined ? { verzoegert_am: patch.verzoegert } : {}),
          ...(patch.erzeugt !== undefined ? { erzeugt_am: patch.erzeugt } : {}),
          ...(patch.freigegeben !== undefined ? { freigegeben_am: patch.freigegeben } : {}),
          ...(patch.kennzeichen !== undefined ? { kennzeichen: patch.kennzeichen.slice(0, 480) } : {}),
          ...(patch.leadStatus !== undefined ? { lead_status: patch.leadStatus } : {}),
          ...(patch.post !== undefined ? { post_status: patch.post } : {}),
          ...(patch.postAm !== undefined ? { post_am: patch.postAm } : {}),
          ...(patch.versandBegonnen !== undefined ? { versand_begonnen_am: patch.versandBegonnen } : {}),
        },
      });
    },
    jetzt: () => new Date(),
  };
}

/**
 * Plausibilisierungs-Kennzeichen für die Freigabe-Liste (Prompt 13, 3):
 * Datenabdeckung, Ausreißer, Fondsanteil, Vertrag vor 1994; seit Prompt 14
 * auch die Zahl der „Weiß ich nicht“-Annahmen und die Rückfrage zur
 * Vertragsart. Kein Kennzeichen heißt: unauffällig.
 */
export function berechneKennzeichen(daten: SitzungsDaten, jetzt: Date): string[] {
  const draft = fallAusMetadaten(daten.metadata);
  if (draft === undefined) {
    return ['Falldaten fehlen'];
  }
  const abbildung = draftZuEingaben(draft, findeVersichererId, heuteBerlin(jetzt).slice(0, 7));
  const kennzeichen: string[] = [];
  if (abbildung.rueckfrageVertragsart) {
    kennzeichen.push('Vertragsart unbekannt – Rückfrage per E-Mail');
  }
  if (abbildung.zusatzAnnahmen.length > 0) {
    kennzeichen.push(`Annahmen: ${abbildung.zusatzAnnahmen.length}`);
  }
  if (abbildung.contract.vertragsart === 'fonds-lv' || abbildung.contract.vertragsart === 'fonds-rv') {
    kennzeichen.push('Fondsgebunden');
  }
  if (Number(abbildung.contract.beginn.slice(0, 4)) < 1994) {
    kennzeichen.push('Vertrag vor 1994');
  }
  try {
    const calc = berechneRueckabwicklung(abbildung.contract, insurersDaten, riskDefaults);
    const basis = calc.szenarien.basis;
    const reihe = basis.zinsreihe;
    const geschaetzt = reihe.filter((j) => j.kennzeichen === 'estimated_branch').length;
    if (reihe.length > 0) {
      const anteil = Math.round((geschaetzt / reihe.length) * 100);
      kennzeichen.push(`Branchenwerte ${anteil} %`);
    }
    const rkw = abbildung.contract.rueckkaufswert?.betrag;
    if (rkw !== undefined && rkw > 0 && basis.mehrwertGegenKuendigung !== undefined && basis.mehrwertGegenKuendigung > 2 * rkw) {
      kennzeichen.push('Ausreißer: Mehrwert über 200 % des Rückkaufswerts');
    }
    const summe = abbildung.contract.gesamtsummeLautMitteilung;
    if (summe !== undefined && summe > 0) {
      const abweichung = Math.abs(basis.summeBeitraege - summe) / summe;
      if (abweichung > 0.05) {
        kennzeichen.push(`Beitragssumme weicht ${Math.round(abweichung * 100)} % vom Beitragsstrom ab`);
      }
    }
  } catch (fehler) {
    kennzeichen.push(`Rechnung fehlgeschlagen: ${(fehler as Error).message.slice(0, 120)}`);
  }
  return kennzeichen;
}

/** Vertragsart „Weiß ich nicht“ gewählt? Dann geht mit der Bestätigung eine Rückfrage raus. */
export function rueckfrageNoetig(daten: SitzungsDaten): boolean {
  return fallAusMetadaten(daten.metadata)?.vertragsart === 'unbekannt';
}

/** Anschrift als eine Zeile (Druckauftrag). */
function anschriftZeile(adresse: Versandadresse): string {
  return `${adresse.strasse}, ${adresse.plz} ${adresse.ort}`;
}

export type VersandEntscheidung = 'erledigt' | 'senden' | 'warten' | 'unbereit';

/** Nach dieser Frist gilt eine Versand-Sperre als verwaist (abgebrochener Lauf) und wird ignoriert. */
export const VERSAND_SPERRE_MS = 10 * 60 * 1000;

/** Ein anderer Aufruf (Cron, Freigabe, zweiter Zeitplaner) versendet gerade? */
export function versandLaeuft(marker: AuslieferungsMarker, jetzt: Date): boolean {
  if (marker.versandBegonnen === undefined) {
    return false;
  }
  const seit = jetzt.getTime() - new Date(marker.versandBegonnen).getTime();
  return Number.isFinite(seit) && seit >= 0 && seit < VERSAND_SPERRE_MS;
}

/**
 * Versand-Entscheidung (Prompt 13, 3): frühestens nach Freigabe, spätestens
 * `autoVersandNachStunden` nach der Erzeugung – so halten die 12 Stunden.
 */
export function entscheideVersand(
  marker: AuslieferungsMarker,
  jetzt: Date,
  autoVersandNachStunden: number = BERICHT_VERSAND.autoVersandNachStunden,
): VersandEntscheidung {
  if (marker.ausgeliefert !== undefined) {
    return 'erledigt';
  }
  if (versandLaeuft(marker, jetzt)) {
    return 'warten';
  }
  if (marker.erzeugt === undefined) {
    return 'unbereit';
  }
  if (marker.freigegeben !== undefined) {
    return 'senden';
  }
  const erzeugtVor = jetzt.getTime() - new Date(marker.erzeugt).getTime();
  return erzeugtVor >= autoVersandNachStunden * 60 * 60 * 1000 ? 'senden' : 'warten';
}

/**
 * Vertragsbestätigung (§ 312f BGB) und ggf. Rückfrage zur Vertragsart – genau einmal.
 * `sofort`: das Gutachten wird im selben Durchlauf erzeugt und versendet (kein
 * Plausibilisierungs-Versprechen im Text).
 */
async function sendeBestaetigung(
  daten: SitzungsDaten,
  deps: ErfuellungsAbhaengigkeiten,
  ordner: string,
  preisText: string | undefined,
  sofort: boolean,
): Promise<void> {
  const basis = basisUrl();
  const bestaetigung = vertragsbestaetigung(
    daten.kundenname,
    daten.bestellnummer,
    { agb: `${basis}/agb`, widerruf: `${basis}/widerrufsbelehrung` },
    preisText,
    daten.postversand,
    sofort,
  );
  await deps.sendeMail({ an: daten.email, betreff: bestaetigung.betreff, text: bestaetigung.text }, ordner);
  if (rueckfrageNoetig(daten)) {
    const rueckfrage = rueckfrageVertragsart(daten.kundenname, daten.bestellnummer);
    await deps.sendeMail({ an: daten.email, betreff: rueckfrage.betreff, text: rueckfrage.text }, ordner);
  }
}

/**
 * Liefert eine bezahlte Bestellung aus. Wiederholte Zustellungen (der Webhook
 * antwortet bei Fehlern mit 500, sodass Stripe automatisch erneut zustellt)
 * überspringen bereits erledigte Schritte; Fehler werden im Status festgehalten,
 * die Kundin bzw. der Kunde einmal informiert und der Anbieter benachrichtigt.
 */
export async function erfuelleBestellung(daten: SitzungsDaten, deps: ErfuellungsAbhaengigkeiten): Promise<AuslieferungsStatus> {
  const ordner = resolve(auslieferungsVerzeichnis(), daten.bestellnummer);
  const status: AuslieferungsStatus = ladeStatus(ordner) ?? {
    bestellnummer: daten.bestellnummer,
    sitzung: daten.id,
    email: daten.email,
    kundenname: daten.kundenname,
    bezahltAm: deps.jetzt().toISOString(),
  };
  if (status.mailVersendetAm !== undefined) {
    return status;
  }
  // Serverless: Dateistatus überlebt den Aufruf nicht – dauerhafte Marker beim Zahlungsdienst prüfen.
  let marker: AuslieferungsMarker = {};
  try {
    marker = await deps.holeMarker(daten);
  } catch {
    // Marker nicht lesbar → weiter mit Dateistatus; schlimmstenfalls doppelte Bestätigung.
  }
  if (marker.ausgeliefert !== undefined) {
    status.mailVersendetAm = marker.ausgeliefert;
    speichereStatus(ordner, status);
    return status;
  }
  if (versandLaeuft(marker, deps.jetzt())) {
    // Ein paralleler Aufruf (Cron + Freigabe, zwei Zeitplaner) versendet gerade – nicht doppelt senden.
    return status;
  }
  if (status.bestaetigungGesendetAm === undefined && marker.bestaetigt !== undefined) {
    status.bestaetigungGesendetAm = marker.bestaetigt;
  }
  if (status.verzoegerungGemeldetAm === undefined && marker.verzoegert !== undefined) {
    status.verzoegerungGemeldetAm = marker.verzoegert;
  }
  // Phase B rechnet auf Serverless neu: mit dem Zeitpunkt der Phase A, damit Stichtag und
  // „Erstellt am“ der plausibilisierten Fassung entsprechen (sonst Abweichung am Monatswechsel).
  const erzeugtLautMarker = marker.erzeugt !== undefined ? new Date(marker.erzeugt) : undefined;
  const erstellzeit =
    erzeugtLautMarker !== undefined && !Number.isNaN(erzeugtLautMarker.getTime()) ? erzeugtLautMarker : deps.jetzt();
  mkdirSync(ordner, { recursive: true });
  const erstkunde = daten.bestellnummer.startsWith('EK-');
  try {
    // Vertragsbestätigung (§ 312f BGB) vor Beginn der Ausführung, genau einmal. Auf diesem
    // Pfad folgt das Gutachten sofort (Erstkunden, Nachholung) – kein Plausibilisierungs-Versprechen.
    if (status.bestaetigungGesendetAm === undefined) {
      await sendeBestaetigung(
        daten,
        deps,
        ordner,
        erstkunde ? 'kostenlos im Erstkunden-Programm – als Dank bitten wir nach dem Gutachten um Ihr kurzes Feedback' : undefined,
        true,
      );
      status.bestaetigungGesendetAm = deps.jetzt().toISOString();
      speichereStatus(ordner, status);
      try {
        await deps.setzeMarker(daten, { bestaetigt: status.bestaetigungGesendetAm });
      } catch {
        // Marker optional; Dateistatus trägt innerhalb der Instanz.
      }
    }
    // Versand reservieren: die Stripe-Metadaten sind der einzige gemeinsame Zustand (Serverless).
    // Kein Compare-and-Set → ein Restfenster von einer Roundtrip-Zeit bleibt (docs/ASSUMPTIONS.md).
    const sperre = deps.jetzt().toISOString();
    try {
      await deps.setzeMarker(daten, { versandBegonnen: sperre });
      const aktuell = await deps.holeMarker(daten);
      if (aktuell.ausgeliefert !== undefined) {
        status.mailVersendetAm = aktuell.ausgeliefert;
        speichereStatus(ordner, status);
        return status;
      }
      if (aktuell.versandBegonnen !== undefined && aktuell.versandBegonnen !== sperre) {
        return status; // ein anderer Aufruf war schneller
      }
    } catch {
      // Marker nicht erreichbar → weiter mit Dateistatus (wie bisher).
    }
    if (
      status.berichtDatei === undefined ||
      !existsSync(status.berichtDatei) ||
      (daten.postversand && (status.druckDatei === undefined || !existsSync(status.druckDatei)))
    ) {
      const bericht = await deps.erzeugeBericht(daten, ordner, erstellzeit);
      status.berichtDatei = bericht.pfad;
      if (bericht.druckPfad !== undefined) {
        status.druckDatei = bericht.druckPfad;
      }
      status.berichtErstelltAm = deps.jetzt().toISOString();
      speichereStatus(ordner, status);
    }
    if (status.rechnungLink === undefined && daten.rechnungId !== undefined) {
      try {
        const link = await deps.rechnungLink(daten.rechnungId);
        if (link !== undefined) {
          status.rechnungLink = link;
          speichereStatus(ordner, status);
        }
      } catch {
        // Rechnungslink ist optional – die Auslieferung darf daran nicht scheitern.
      }
    }
    const vorlage = berichtVersand(
      daten.kundenname,
      daten.bestellnummer,
      status.rechnungLink,
      erstkunde,
      `${basisUrl()}/durchsetzung`,
      daten.postversand,
    );
    const dateiname = status.berichtDatei.split('/').pop() ?? `${daten.bestellnummer}.pdf`;
    const ergebnis = await deps.sendeMail(
      {
        an: daten.email,
        betreff: vorlage.betreff,
        text: vorlage.text,
        anhaenge: [{ dateiname, inhalt: readFileSync(status.berichtDatei), typ: 'application/pdf' }],
      },
      ordner,
    );
    status.mailVersendetAm = deps.jetzt().toISOString();
    status.mailWeg = ergebnis.weg;
    speichereStatus(ordner, status);
    try {
      await deps.setzeMarker(daten, {
        ausgeliefert: status.mailVersendetAm,
        // Postversand: Stand „gewünscht“ sicherstellen (Erstkunden-Weg hat keinen Checkout-Marker).
        ...(daten.postversand && marker.post === undefined ? { post: 'gewuenscht', postAm: status.mailVersendetAm } : {}),
      });
    } catch (grund) {
      // Ohne dauerhaften Marker sieht der nächste Cron-Lauf (andere Instanz, /tmp weg) „senden“ → intern melden.
      const meldung = `Marker ausgeliefert_am nicht gesetzt: ${(grund as Error).message}`;
      status.fehler = [...(status.fehler ?? []), `${deps.jetzt().toISOString()}: ${meldung}`];
      speichereStatus(ordner, status);
      try {
        await deps.sendeMail(
          {
            an: BRAND.kontaktEmail,
            betreff: `[${BRAND.name}] Marker fehlt nach Versand: ${daten.bestellnummer}`,
            text: `Bestellnummer ${daten.bestellnummer}: Das Gutachten wurde um ${status.mailVersendetAm} versendet, aber ${meldung}.\n\nBitte am PaymentIntent ${daten.zahlungId ?? '(unbekannt)'} im Stripe-Dashboard das Metadatum ausgeliefert_am = ${status.mailVersendetAm} eintragen – sonst versendet der nächste Cron-Lauf Gutachten und Druckauftrag erneut.`,
          },
          ordner,
        );
      } catch {
        // Letzte Instanz ist das Protokoll (status.json).
      }
    }
    // Druckauftrag (Prompt 14, 0.3): Druckvorlage an den Anbieter – bestmöglich, ohne den Versand zu gefährden.
    if (daten.postversand && status.druckDatei !== undefined && status.druckauftragGesendetAm === undefined) {
      try {
        const { adresse } = gutachtenDaten(daten, erstellzeit);
        const auftrag = druckauftrag(daten.bestellnummer, daten.kundenname, anschriftZeile(adresse));
        const druckname = status.druckDatei.split('/').pop() ?? `${daten.bestellnummer}_Druck.pdf`;
        await deps.sendeMail(
          {
            an: BRAND.kontaktEmail,
            betreff: auftrag.betreff,
            text: auftrag.text,
            anhaenge: [{ dateiname: druckname, inhalt: readFileSync(status.druckDatei), typ: 'application/pdf' }],
          },
          ordner,
        );
        status.druckauftragGesendetAm = deps.jetzt().toISOString();
        speichereStatus(ordner, status);
      } catch (grund) {
        const meldung = `Druckauftrag nicht gesendet: ${(grund as Error).message}`;
        status.fehler = [...(status.fehler ?? []), `${deps.jetzt().toISOString()}: ${meldung}`];
        speichereStatus(ordner, status);
        // Kein Marker, kein Wiederanlauf (jeder weitere Aufruf endet an `ausgeliefert`) → Anbieter informieren.
        try {
          await deps.sendeMail(
            {
              an: BRAND.kontaktEmail,
              betreff: `[${BRAND.name}] Druckauftrag fehlgeschlagen: ${daten.bestellnummer}`,
              text: `Bestellnummer ${daten.bestellnummer}: Das Gutachten ist per E-Mail versendet, aber ${meldung}.\n\nDruckvorlage im Admin neu abrufen (Spalte „Post“ → „Druckvorlage (PDF)“, Sitzung ${daten.id}) und danach den Post-Stand weiterführen.`,
            },
            ordner,
          );
        } catch {
          // Letzte Instanz ist das Protokoll (status.json).
        }
      }
    }
    return status;
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : String(fehler);
    status.fehler = [...(status.fehler ?? []), `${deps.jetzt().toISOString()}: ${text}`];
    speichereStatus(ordner, status);
    // Verzögerungs-Mail an die Kundin bzw. den Kunden – Erstkunden bekommen ihre Antwort direkt im
    // Browser („Code bleibt gültig“) und haben keinen automatischen Wiederholungsweg.
    if (status.verzoegerungGemeldetAm === undefined && !erstkunde) {
      try {
        const info = berichtVerzoegert(daten.kundenname, daten.bestellnummer, erstkunde);
        await deps.sendeMail({ an: daten.email, betreff: info.betreff, text: info.text }, ordner);
        status.verzoegerungGemeldetAm = deps.jetzt().toISOString();
        speichereStatus(ordner, status);
        try {
          await deps.setzeMarker(daten, { verzoegert: status.verzoegerungGemeldetAm });
        } catch {
          // Marker optional.
        }
      } catch {
        // Der Fehler steht bereits im Status; der Anbieter wird unten informiert.
      }
    }
    try {
      const intern = internerFehlerHinweis(daten.bestellnummer, text, erstkunde ? 'erstkunde' : 'versand');
      await deps.sendeMail({ an: BRAND.kontaktEmail, betreff: intern.betreff, text: intern.text }, ordner);
    } catch {
      // Letzte Instanz ist das Protokoll (status.json).
    }
    return status;
  }
}

/**
 * Phase A (Prompt 13, 3): Vertragsbestätigung (+ Rückfrage zur Vertragsart),
 * Gutachten erzeugen und plausibilisieren, Marker `erzeugt` + Kennzeichen
 * setzen – KEIN Versand. Bei Fehlern wirft die Funktion nicht, sondern meldet
 * 'fehler' (der Webhook antwortet dann mit 500, Stripe stellt erneut zu).
 */
export async function bereiteBestellungVor(
  daten: SitzungsDaten,
  deps: ErfuellungsAbhaengigkeiten,
): Promise<'vorbereitet' | 'erledigt' | 'fehler'> {
  const ordner = resolve(auslieferungsVerzeichnis(), daten.bestellnummer);
  const status: AuslieferungsStatus = ladeStatus(ordner) ?? {
    bestellnummer: daten.bestellnummer,
    sitzung: daten.id,
    email: daten.email,
    kundenname: daten.kundenname,
    bezahltAm: deps.jetzt().toISOString(),
  };
  let marker: AuslieferungsMarker = {};
  try {
    marker = await deps.holeMarker(daten);
  } catch {
    // Marker nicht lesbar → weiter mit Dateistatus.
  }
  if (marker.ausgeliefert !== undefined) {
    return 'erledigt';
  }
  mkdirSync(ordner, { recursive: true });
  try {
    // Vertragsbestätigung (§ 312f BGB) vor Beginn der Ausführung, genau einmal.
    if (status.bestaetigungGesendetAm === undefined && marker.bestaetigt === undefined) {
      await sendeBestaetigung(daten, deps, ordner, undefined, false);
      status.bestaetigungGesendetAm = deps.jetzt().toISOString();
      speichereStatus(ordner, status);
      try {
        await deps.setzeMarker(daten, {
          bestaetigt: status.bestaetigungGesendetAm,
          leadStatus: 'Gutachten gekauft',
          ...(daten.postversand && marker.post === undefined ? { post: 'gewuenscht', postAm: status.bestaetigungGesendetAm } : {}),
        });
      } catch {
        // Marker optional; Dateistatus trägt innerhalb der Instanz.
      }
    }
    if (marker.erzeugt !== undefined) {
      return 'vorbereitet';
    }
    // Gutachten probeweise erzeugen (Validierung) und plausibilisieren – EIN Zeitpunkt für
    // Erzeugung, Marker und Kennzeichen; Phase B rechnet mit demselben Zeitpunkt neu.
    const erstellzeit = deps.jetzt();
    const bericht = await deps.erzeugeBericht(daten, ordner, erstellzeit);
    status.berichtDatei = bericht.pfad;
    if (bericht.druckPfad !== undefined) {
      status.druckDatei = bericht.druckPfad;
    }
    status.berichtErstelltAm = erstellzeit.toISOString();
    speichereStatus(ordner, status);
    const kennzeichen = berechneKennzeichen(daten, erstellzeit);
    try {
      await deps.setzeMarker(daten, {
        erzeugt: status.berichtErstelltAm,
        kennzeichen: kennzeichen.join('; '),
      });
    } catch {
      // Ohne Marker kann der Cron nicht ausliefern → als Fehler behandeln,
      // damit Stripe erneut zustellt.
      return 'fehler';
    }
    return 'vorbereitet';
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : String(fehler);
    status.fehler = [...(status.fehler ?? []), `${deps.jetzt().toISOString()}: ${text}`];
    speichereStatus(ordner, status);
    try {
      const intern = internerFehlerHinweis(daten.bestellnummer, text, 'webhook');
      await deps.sendeMail({ an: BRAND.kontaktEmail, betreff: intern.betreff, text: intern.text }, ordner);
    } catch {
      // Letzte Instanz ist das Protokoll (status.json).
    }
    return 'fehler';
  }
}

/**
 * Phase B: Gutachten versenden (nach Freigabe oder Auto-Frist). Erzeugt das
 * PDF bei Bedarf neu (Serverless: /tmp der Phase A ist weg) und setzt den
 * Marker `ausgeliefert`. Wiederholt aufrufbar.
 */
export async function versendeBericht(daten: SitzungsDaten, deps: ErfuellungsAbhaengigkeiten): Promise<AuslieferungsStatus> {
  return erfuelleBestellung(daten, deps);
}

export type EreignisErgebnis = 'vorbereitet' | 'ausgeliefert' | 'fehler' | 'zahlung-ausstehend' | 'zahlung-fehlgeschlagen' | 'ignoriert';

/**
 * Verteilt Stripe-Ereignisse. Zahlungseingang löst Phase A aus (Erzeugen +
 * Plausibilisieren); der Versand folgt über Freigabe oder Cron (Phase B).
 */
export async function verarbeiteStripeEreignis(ereignis: Stripe.Event, deps: ErfuellungsAbhaengigkeiten): Promise<EreignisErgebnis> {
  switch (ereignis.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const sitzung = ereignis.data.object as Stripe.Checkout.Session;
      if (sitzung.payment_status !== 'paid') {
        return 'zahlung-ausstehend';
      }
      const ergebnis = await bereiteBestellungVor(sitzungsDaten(sitzung), deps);
      if (ergebnis === 'fehler') {
        return 'fehler';
      }
      return ergebnis === 'erledigt' ? 'ausgeliefert' : 'vorbereitet';
    }
    case 'checkout.session.async_payment_failed':
      return 'zahlung-fehlgeschlagen';
    default:
      return 'ignoriert';
  }
}
