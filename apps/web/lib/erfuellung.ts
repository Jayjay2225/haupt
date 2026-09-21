/**
 * Auslieferung nach Zahlungseingang (Stripe-Webhook): Fall aus den Metadaten
 * lesen, rechnen, Bericht als PDF erzeugen, Rechnungslink holen und beides
 * per E-Mail schicken. Der Stand je Bestellung liegt als status.json im
 * Auslieferungsordner – damit ist der Ablauf wiederholbar (Stripe sendet
 * Ereignisse mehrfach) und ohne Datenbank nachvollziehbar.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type Stripe from 'stripe';
import { berechneRueckabwicklung } from '@rueckab/calc';
import type { CalcResultAlt, RiskDefaults } from '@rueckab/calc';
import { pruefeEignung } from '@rueckab/eligibility';
import type { Regelwerk } from '@rueckab/eligibility';
import { formatDatum, htmlZuPdf, renderBerichtHtml } from '@rueckab/report';
import riskJson from '../../../data/risk-defaults.json';
import rulesJson from '../../../data/legal-rules.json';
import { BRAND } from '@/config/brand';
import { draftZuEingaben } from './berechnung';
import { berichtVerzoegert, berichtVersand, internerFehlerHinweis, vertragsbestaetigung } from './emails';
import { fallAusMetadaten } from './fall-kodierung';
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
  berichtErstelltAm?: string;
  rechnungLink?: string;
  bestaetigungGesendetAm?: string;
  mailVersendetAm?: string;
  mailWeg?: string;
  verzoegerungGemeldetAm?: string;
  fehler?: string[];
}

export interface SitzungsDaten {
  id: string;
  bestellnummer: string;
  kundenname: string;
  email: string;
  metadata: Record<string, string>;
  rechnungId?: string;
  zahlungId?: string;
}

export interface Berichtsdatei {
  pfad: string;
  dateiname: string;
}

export interface ErfuellungsAbhaengigkeiten {
  erzeugeBericht: (daten: SitzungsDaten, ordner: string, jetzt: Date) => Promise<Berichtsdatei>;
  sendeMail: typeof sendeMail;
  rechnungLink: (rechnungId: string) => Promise<string | undefined>;
  /** Dauerhafte Markierung außerhalb des Dateisystems (Serverless): schon ausgeliefert? */
  istAusgeliefert: (daten: SitzungsDaten) => Promise<boolean>;
  markiereAusgeliefert: (daten: SitzungsDaten, zeitpunkt: string) => Promise<void>;
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
    ...(rechnungId !== undefined ? { rechnungId } : {}),
    ...(zahlungId !== undefined ? { zahlungId } : {}),
  };
}

/** Rechnet den Fall und schreibt HTML + PDF des Berichts in den Bestellordner. */
export async function erzeugeBericht(daten: SitzungsDaten, ordner: string, jetzt: Date): Promise<Berichtsdatei> {
  const draft = fallAusMetadaten(daten.metadata);
  if (draft === undefined) {
    throw new Error('Falldaten fehlen in der Zahlungssitzung.');
  }
  const heute = jetzt.toISOString().slice(0, 10);
  const abbildung = draftZuEingaben(draft, findeVersichererId, heute.slice(0, 7));
  if (abbildung.fehler.length > 0) {
    throw new Error(`Falldaten unvollständig: ${abbildung.fehler.join(' ')}`);
  }
  const calc = berechneRueckabwicklung(abbildung.contract, insurersDaten, riskDefaults);
  if (calc.regime !== 'alt-policenmodell') {
    throw new Error(`Für das Regime „${calc.regime}“ gibt es noch keine Berichtsvorlage.`);
  }
  const eligibility = pruefeEignung(abbildung.eligibility, regelwerk);
  const versicherer = versichererNachId(abbildung.contract.versichererId);
  const html = renderBerichtHtml({
    marke: BRAND.name,
    aktenzeichen: daten.bestellnummer,
    kundenname: daten.kundenname,
    erstelltAm: heute,
    versichererAnzeigename: versicherer?.kanonischerName ?? 'nicht benannt (Branchendurchschnitt)',
    contract: abbildung.contract,
    calc: calc as CalcResultAlt,
    eligibility,
  });
  mkdirSync(ordner, { recursive: true });
  const basisname = `${BRAND.produktname.replace(/\s+/g, '-')}_${daten.bestellnummer}`;
  writeFileSync(resolve(ordner, `${basisname}.html`), html);
  const pfad = resolve(ordner, `${basisname}.pdf`);
  await htmlZuPdf(html, pfad, {
    marke: BRAND.name,
    aktenzeichen: daten.bestellnummer,
    kundenname: daten.kundenname,
    datum: formatDatum(heute),
  });
  return { pfad, dateiname: `${basisname}.pdf` };
}

export function standardAbhaengigkeiten(stripe: Stripe): ErfuellungsAbhaengigkeiten {
  return {
    erzeugeBericht,
    sendeMail,
    rechnungLink: async (rechnungId) => {
      const rechnung = await stripe.invoices.retrieve(rechnungId);
      return rechnung.hosted_invoice_url ?? rechnung.invoice_pdf ?? undefined;
    },
    istAusgeliefert: async (daten) => {
      if (daten.zahlungId === undefined) {
        return false;
      }
      const zahlung = await stripe.paymentIntents.retrieve(daten.zahlungId);
      return (zahlung.metadata['ausgeliefert_am'] ?? '') !== '';
    },
    markiereAusgeliefert: async (daten, zeitpunkt) => {
      if (daten.zahlungId !== undefined) {
        await stripe.paymentIntents.update(daten.zahlungId, { metadata: { ausgeliefert_am: zeitpunkt } });
      }
    },
    jetzt: () => new Date(),
  };
}

/**
 * Liefert eine bezahlte Bestellung aus. Wiederholte Aufrufe (Stripe-Retries)
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
  // Serverless: Dateistatus überlebt den Aufruf nicht – dauerhafte Markierung bei Stripe prüfen.
  if (await deps.istAusgeliefert(daten)) {
    status.mailVersendetAm = status.mailVersendetAm ?? 'laut Zahlungsdienst bereits ausgeliefert';
    speichereStatus(ordner, status);
    return status;
  }
  mkdirSync(ordner, { recursive: true });
  try {
    // Vertragsbestätigung (§ 312f BGB) vor Beginn der Ausführung, genau einmal.
    if (status.bestaetigungGesendetAm === undefined) {
      const basis = basisUrl();
      const erstkunde = daten.bestellnummer.startsWith('EK-');
      const bestaetigung = vertragsbestaetigung(
        daten.kundenname,
        daten.bestellnummer,
        { agb: `${basis}/agb`, widerruf: `${basis}/widerrufsbelehrung` },
        erstkunde ? 'kostenlos im Erstkunden-Programm (gegen Feedback, siehe docs/ERSTKUNDEN)' : undefined,
      );
      await deps.sendeMail({ an: daten.email, betreff: bestaetigung.betreff, text: bestaetigung.text }, ordner);
      status.bestaetigungGesendetAm = deps.jetzt().toISOString();
      speichereStatus(ordner, status);
    }
    if (status.berichtDatei === undefined || !existsSync(status.berichtDatei)) {
      const bericht = await deps.erzeugeBericht(daten, ordner, deps.jetzt());
      status.berichtDatei = bericht.pfad;
      status.berichtErstelltAm = deps.jetzt().toISOString();
      speichereStatus(ordner, status);
    }
    if (status.rechnungLink === undefined && daten.rechnungId !== undefined) {
      const link = await deps.rechnungLink(daten.rechnungId);
      if (link !== undefined) {
        status.rechnungLink = link;
        speichereStatus(ordner, status);
      }
    }
    const vorlage = berichtVersand(daten.kundenname, daten.bestellnummer, status.rechnungLink, daten.bestellnummer.startsWith('EK-'));
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
      await deps.markiereAusgeliefert(daten, status.mailVersendetAm);
    } catch {
      // Markierung fehlgeschlagen: Dateistatus verhindert Doppelversand innerhalb der Instanz.
    }
    return status;
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : String(fehler);
    status.fehler = [...(status.fehler ?? []), `${deps.jetzt().toISOString()}: ${text}`];
    speichereStatus(ordner, status);
    if (status.verzoegerungGemeldetAm === undefined) {
      try {
        const info = berichtVerzoegert(daten.kundenname, daten.bestellnummer);
        await deps.sendeMail({ an: daten.email, betreff: info.betreff, text: info.text }, ordner);
        status.verzoegerungGemeldetAm = deps.jetzt().toISOString();
        speichereStatus(ordner, status);
      } catch {
        // Der Fehler steht bereits im Status; der Anbieter wird unten informiert.
      }
    }
    try {
      const intern = internerFehlerHinweis(daten.bestellnummer, text);
      await deps.sendeMail({ an: BRAND.kontaktEmail, betreff: intern.betreff, text: intern.text }, ordner);
    } catch {
      // Letzte Instanz ist das Protokoll (status.json).
    }
    return status;
  }
}

export type EreignisErgebnis = 'ausgeliefert' | 'fehler' | 'zahlung-ausstehend' | 'zahlung-fehlgeschlagen' | 'ignoriert';

/** Verteilt Stripe-Ereignisse; nur Zahlungseingänge lösen die Auslieferung aus. */
export async function verarbeiteStripeEreignis(ereignis: Stripe.Event, deps: ErfuellungsAbhaengigkeiten): Promise<EreignisErgebnis> {
  switch (ereignis.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const sitzung = ereignis.data.object as Stripe.Checkout.Session;
      if (sitzung.payment_status !== 'paid') {
        return 'zahlung-ausstehend';
      }
      const status = await erfuelleBestellung(sitzungsDaten(sitzung), deps);
      return status.mailVersendetAm !== undefined ? 'ausgeliefert' : 'fehler';
    }
    case 'checkout.session.async_payment_failed':
      return 'zahlung-fehlgeschlagen';
    default:
      return 'ignoriert';
  }
}
