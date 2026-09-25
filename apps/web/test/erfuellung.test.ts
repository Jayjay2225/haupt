import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type Stripe from 'stripe';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  bereiteBestellungVor,
  entscheideVersand,
  erfuelleBestellung,
  ladeStatus,
  sitzungsDaten,
  verarbeiteStripeEreignis,
  versendeBericht,
} from '../lib/erfuellung';
import type { AuslieferungsMarker, ErfuellungsAbhaengigkeiten, SitzungsDaten } from '../lib/erfuellung';
import { fallAlsMetadaten } from '../lib/fall-kodierung';
import type { MailNachricht } from '../lib/versand';
import { vollstaendigerDraft } from './bestellung.test';

const JETZT = new Date('2026-09-20T10:00:00.000Z');

function fakeSitzung(payment_status: 'paid' | 'unpaid' = 'paid'): Stripe.Checkout.Session {
  return {
    id: 'cs_test_123',
    object: 'checkout.session',
    payment_status,
    invoice: 'in_123',
    customer_email: 'muster@example.org',
    customer_details: { email: 'muster@example.org', name: 'Muster Person' },
    payment_intent: 'pi_123',
    metadata: { bestellnummer: 'RR-2026-ABCDEF', kundenname: 'Muster Person', ...fallAlsMetadaten(vollstaendigerDraft()) },
  } as unknown as Stripe.Checkout.Session;
}

function ereignis(typ: string, sitzung: Stripe.Checkout.Session): Stripe.Event {
  return { id: 'evt_1', type: typ, data: { object: sitzung } } as unknown as Stripe.Event;
}

interface Protokoll {
  mails: MailNachricht[];
  berichte: number;
  marker: AuslieferungsMarker;
}

function fakeAbhaengigkeiten(protokoll: Protokoll, berichtFehler?: string): ErfuellungsAbhaengigkeiten {
  return {
    erzeugeBericht: async (_daten: SitzungsDaten, ordner: string) => {
      if (berichtFehler !== undefined) {
        throw new Error(berichtFehler);
      }
      protokoll.berichte += 1;
      const pfad = join(ordner, 'Pruefbericht_RR-2026-ABCDEF.pdf');
      writeFileSync(pfad, '%PDF-1.4 test');
      return { pfad, dateiname: 'Pruefbericht_RR-2026-ABCDEF.pdf' };
    },
    sendeMail: async (nachricht) => {
      protokoll.mails.push(nachricht);
      return { weg: 'protokoll', kennung: `t${protokoll.mails.length}` };
    },
    rechnungLink: async () => 'https://rechnung.example/in_123',
    holeMarker: async () => ({ ...protokoll.marker }),
    setzeMarker: async (_daten, patch) => {
      Object.assign(protokoll.marker, patch);
    },
    jetzt: () => JETZT,
  };
}

let verzeichnis: string;
const vorher = process.env['AUSLIEFERUNG_VERZEICHNIS'];

beforeEach(() => {
  verzeichnis = mkdtempSync(join(tmpdir(), 'rr-auslieferung-'));
  process.env['AUSLIEFERUNG_VERZEICHNIS'] = verzeichnis;
});

afterEach(() => {
  if (vorher === undefined) {
    delete process.env['AUSLIEFERUNG_VERZEICHNIS'];
  } else {
    process.env['AUSLIEFERUNG_VERZEICHNIS'] = vorher;
  }
});

describe('Zweiphasige Auslieferung (Prompt 13, Abschnitt 3)', () => {
  it('liest Bestellnummer, E-Mail und Rechnung aus der Sitzung', () => {
    const daten = sitzungsDaten(fakeSitzung());
    expect(daten).toMatchObject({ id: 'cs_test_123', bestellnummer: 'RR-2026-ABCDEF', email: 'muster@example.org', rechnungId: 'in_123', zahlungId: 'pi_123' });
  });

  it('Phase A (Webhook): Bestätigung + Erzeugung + Kennzeichen, aber KEIN Berichtsversand', async () => {
    const protokoll: Protokoll = { mails: [], berichte: 0, marker: {} };
    const deps = fakeAbhaengigkeiten(protokoll);
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.completed', fakeSitzung()), deps)).toBe('vorbereitet');
    expect(protokoll.berichte).toBe(1);
    // Nur die Vertragsbestätigung (§ 312f BGB) geht sofort raus.
    expect(protokoll.mails).toHaveLength(1);
    expect(protokoll.mails[0]?.betreff).toContain('Bestätigung');
    expect(protokoll.mails[0]?.text).toContain('innerhalb von 12 Stunden');
    expect(protokoll.marker.bestaetigt).toBe(JETZT.toISOString());
    expect(protokoll.marker.erzeugt).toBe(JETZT.toISOString());
    expect(protokoll.marker.leadStatus).toBe('Bericht gekauft');
    expect(typeof protokoll.marker.kennzeichen).toBe('string');
    expect(protokoll.marker.ausgeliefert).toBeUndefined();

    // Wiederholte Zustellung: keine zweite Bestätigung, keine zweite Erzeugung.
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.async_payment_succeeded', fakeSitzung()), deps)).toBe('vorbereitet');
    expect(protokoll.mails).toHaveLength(1);
  });

  it('entscheideVersand: Freigabe oder Auto-Frist, sonst warten', () => {
    const erzeugtVor11h = new Date(JETZT.getTime() - 11 * 60 * 60 * 1000).toISOString();
    const erzeugtVor9h = new Date(JETZT.getTime() - 9 * 60 * 60 * 1000).toISOString();
    expect(entscheideVersand({}, JETZT)).toBe('unbereit');
    expect(entscheideVersand({ erzeugt: erzeugtVor9h }, JETZT)).toBe('warten');
    expect(entscheideVersand({ erzeugt: erzeugtVor11h }, JETZT)).toBe('senden');
    expect(entscheideVersand({ erzeugt: erzeugtVor9h, freigegeben: JETZT.toISOString() }, JETZT)).toBe('senden');
    expect(entscheideVersand({ erzeugt: erzeugtVor11h, ausgeliefert: JETZT.toISOString() }, JETZT)).toBe('erledigt');
  });

  it('Phase B: versendet Bericht mit Anhang, Rechnungslink und Durchsetzungs-Link – genau einmal', async () => {
    const protokoll: Protokoll = { mails: [], berichte: 0, marker: {} };
    const deps = fakeAbhaengigkeiten(protokoll);
    const daten = sitzungsDaten(fakeSitzung());
    expect(await bereiteBestellungVor(daten, deps)).toBe('vorbereitet');
    const status = await versendeBericht(daten, deps);
    expect(status.mailVersendetAm).toBe(JETZT.toISOString());
    const mail = protokoll.mails.at(-1)!;
    expect(mail.betreff).toBe('Ihr Prüfbericht ist da');
    expect(mail.text).toContain('Wir übernehmen');
    expect(mail.text).toContain('/durchsetzung');
    expect(mail.text).toContain('https://rechnung.example/in_123');
    expect(mail.anhaenge?.[0]?.inhalt.toString()).toBe('%PDF-1.4 test');
    expect(protokoll.marker.ausgeliefert).toBe(JETZT.toISOString());
    // Zweiter Versandversuch (Cron + Freigabe gleichzeitig): kein Doppelversand.
    const mailsVorher = protokoll.mails.length;
    await versendeBericht(daten, deps);
    expect(protokoll.mails).toHaveLength(mailsVorher);
    expect(entscheideVersand(protokoll.marker, JETZT)).toBe('erledigt');
  });

  it('Erstkunden-Weg bleibt direkt (erfuelleBestellung liefert sofort aus)', async () => {
    const protokoll: Protokoll = { mails: [], berichte: 0, marker: {} };
    const deps = fakeAbhaengigkeiten(protokoll);
    const status = await erfuelleBestellung(sitzungsDaten(fakeSitzung()), deps);
    expect(status.mailVersendetAm).toBe(JETZT.toISOString());
    expect(protokoll.mails).toHaveLength(2);
  });

  it('Phase-A-Fehler: interne Meldung, keine Kunden-Störung, Webhook meldet fehler (Stripe-Retry)', async () => {
    const protokoll: Protokoll = { mails: [], berichte: 0, marker: {} };
    const deps = fakeAbhaengigkeiten(protokoll, 'Chromium nicht gefunden');
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.completed', fakeSitzung()), deps)).toBe('fehler');
    // Bestätigung ging raus, danach nur die interne Meldung – der Kunde erwartet ohnehin 12 Stunden.
    expect(protokoll.mails.map((m) => m.an)).toEqual(['muster@example.org', 'info@renten-rettung.de']);
    expect(protokoll.marker.erzeugt).toBeUndefined();
    const status = ladeStatus(join(verzeichnis, 'RR-2026-ABCDEF'));
    expect(status?.fehler?.[0]).toContain('Chromium nicht gefunden');
    expect(existsSync(join(verzeichnis, 'RR-2026-ABCDEF', 'status.json'))).toBe(true);
  });

  it('liefert bei ausstehender Zahlung und fremden Ereignissen nicht aus', async () => {
    const protokoll: Protokoll = { mails: [], berichte: 0, marker: {} };
    const deps = fakeAbhaengigkeiten(protokoll);
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.completed', fakeSitzung('unpaid')), deps)).toBe('zahlung-ausstehend');
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.async_payment_failed', fakeSitzung('unpaid')), deps)).toBe('zahlung-fehlgeschlagen');
    expect(await verarbeiteStripeEreignis(ereignis('payment_intent.created', fakeSitzung()), deps)).toBe('ignoriert');
    expect(protokoll.berichte).toBe(0);
    expect(protokoll.mails).toHaveLength(0);
  });
});
