import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type Stripe from 'stripe';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { erfuelleBestellung, ladeStatus, sitzungsDaten, verarbeiteStripeEreignis } from '../lib/erfuellung';
import type { ErfuellungsAbhaengigkeiten, SitzungsDaten } from '../lib/erfuellung';
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
  markiert?: string;
}

function fakeAbhaengigkeiten(protokoll: Protokoll, berichtFehler?: string): ErfuellungsAbhaengigkeiten {
  return {
    erzeugeBericht: async (_daten: SitzungsDaten, ordner: string) => {
      if (berichtFehler !== undefined) {
        throw new Error(berichtFehler);
      }
      protokoll.berichte += 1;
      const pfad = join(ordner, 'Policen-Check_RR-2026-ABCDEF.pdf');
      writeFileSync(pfad, '%PDF-1.4 test');
      return { pfad, dateiname: 'Policen-Check_RR-2026-ABCDEF.pdf' };
    },
    sendeMail: async (nachricht) => {
      protokoll.mails.push(nachricht);
      return { weg: 'protokoll', kennung: `t${protokoll.mails.length}` };
    },
    rechnungLink: async () => 'https://rechnung.example/in_123',
    istAusgeliefert: async () => protokoll.markiert !== undefined,
    markiereAusgeliefert: async (_daten, zeitpunkt) => {
      protokoll.markiert = zeitpunkt;
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

describe('Auslieferung nach Zahlungseingang', () => {
  it('liest Bestellnummer, E-Mail und Rechnung aus der Sitzung', () => {
    const daten = sitzungsDaten(fakeSitzung());
    expect(daten).toMatchObject({ id: 'cs_test_123', bestellnummer: 'RR-2026-ABCDEF', email: 'muster@example.org', rechnungId: 'in_123', zahlungId: 'pi_123' });
  });

  it('erzeugt den Bericht, hängt ihn an und nennt den Rechnungslink – nur einmal', async () => {
    const protokoll: Protokoll = { mails: [], berichte: 0 };
    const deps = fakeAbhaengigkeiten(protokoll);
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.completed', fakeSitzung()), deps)).toBe('ausgeliefert');
    expect(protokoll.berichte).toBe(1);
    // Erst die Vertragsbestätigung (§ 312f BGB), dann der Bericht.
    expect(protokoll.mails).toHaveLength(2);
    expect(protokoll.mails[0]?.betreff).toContain('Bestätigung');
    expect(protokoll.mails[0]?.text).toContain('Widerrufsbelehrung: http://localhost:3000/widerrufsbelehrung');
    expect(protokoll.mails[0]?.text).toContain('sofort erstellen');
    const mail = protokoll.mails[1]!;
    expect(mail.an).toBe('muster@example.org');
    expect(mail.text).toContain('RR-2026-ABCDEF');
    expect(mail.text).toContain('https://rechnung.example/in_123');
    expect(mail.anhaenge?.[0]?.dateiname).toBe('Policen-Check_RR-2026-ABCDEF.pdf');
    expect(mail.anhaenge?.[0]?.inhalt.toString()).toBe('%PDF-1.4 test');

    const status = ladeStatus(join(verzeichnis, 'RR-2026-ABCDEF'));
    expect(status?.mailVersendetAm).toBe(JETZT.toISOString());
    expect(status?.rechnungLink).toBe('https://rechnung.example/in_123');

    // Stripe schickt Ereignisse mehrfach: kein zweiter Bericht, keine zweite Mail.
    expect(protokoll.markiert).toBe(JETZT.toISOString());
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.async_payment_succeeded', fakeSitzung()), deps)).toBe('ausgeliefert');
    expect(protokoll.berichte).toBe(1);
    expect(protokoll.mails).toHaveLength(2);
  });

  it('verlässt sich auf die Stripe-Markierung, wenn der Dateistatus fehlt (Serverless)', async () => {
    const protokoll: Protokoll = { mails: [], berichte: 0, markiert: '2026-09-21T09:00:00.000Z' };
    const deps = fakeAbhaengigkeiten(protokoll);
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.completed', fakeSitzung()), deps)).toBe('ausgeliefert');
    expect(protokoll.berichte).toBe(0);
    expect(protokoll.mails).toHaveLength(0);
  });

  it('hält Fehler fest, informiert Kundin und Anbieter und wiederholt die Kundeninfo nicht', async () => {
    const protokoll: Protokoll = { mails: [], berichte: 0 };
    const deps = fakeAbhaengigkeiten(protokoll, 'Chromium nicht gefunden');
    const daten = sitzungsDaten(fakeSitzung());
    const status = await erfuelleBestellung(daten, deps);
    expect(status.mailVersendetAm).toBeUndefined();
    expect(status.fehler).toHaveLength(1);
    expect(status.fehler?.[0]).toContain('Chromium nicht gefunden');
    // Bestätigung, dann Verzögerungsinfo an die Kundin, dann interne Meldung.
    expect(protokoll.mails.map((m) => m.an)).toEqual(['muster@example.org', 'muster@example.org', 'info@renten-rettung.de']);
    expect(protokoll.mails[1]?.betreff).toContain('Zahlung ist eingegangen');
    expect(existsSync(join(verzeichnis, 'RR-2026-ABCDEF', 'status.json'))).toBe(true);

    const zweiter = await erfuelleBestellung(daten, deps);
    expect(zweiter.fehler).toHaveLength(2);
    // Kundin nur einmal informiert, Anbieter bei jedem Fehlschlag.
    expect(protokoll.mails.map((m) => m.an)).toEqual([
      'muster@example.org',
      'muster@example.org',
      'info@renten-rettung.de',
      'info@renten-rettung.de',
    ]);
    expect(JSON.parse(readFileSync(join(verzeichnis, 'RR-2026-ABCDEF', 'status.json'), 'utf8')).verzoegerungGemeldetAm).toBe(JETZT.toISOString());
  });

  it('liefert bei ausstehender Zahlung und fremden Ereignissen nicht aus', async () => {
    const protokoll: Protokoll = { mails: [], berichte: 0 };
    const deps = fakeAbhaengigkeiten(protokoll);
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.completed', fakeSitzung('unpaid')), deps)).toBe('zahlung-ausstehend');
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.async_payment_failed', fakeSitzung('unpaid')), deps)).toBe('zahlung-fehlgeschlagen');
    expect(await verarbeiteStripeEreignis(ereignis('payment_intent.created', fakeSitzung()), deps)).toBe('ignoriert');
    expect(protokoll.berichte).toBe(0);
    expect(protokoll.mails).toHaveLength(0);
  });
});
