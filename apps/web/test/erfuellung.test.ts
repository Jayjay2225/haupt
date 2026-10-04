import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type Stripe from 'stripe';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  LEAD_STATUS,
  POST_STAENDE,
  VERSAND_SPERRE_MS,
  bereiteBestellungVor,
  berechneKennzeichen,
  entscheideVersand,
  erfuelleBestellung,
  gutachtenDaten,
  ladeStatus,
  rueckfrageNoetig,
  sitzungsDaten,
  verarbeiteStripeEreignis,
  versandLaeuft,
  versendeBericht,
} from '../lib/erfuellung';
import type { AuslieferungsMarker, ErfuellungsAbhaengigkeiten, SitzungsDaten } from '../lib/erfuellung';
import type { CaseDraft } from '../lib/draft';
import { fallAlsMetadaten } from '../lib/fall-kodierung';
import type { MailNachricht } from '../lib/versand';
import { vollstaendigerDraft } from './helfer';

const JETZT = new Date('2026-09-20T10:00:00.000Z');

interface SitzungsOptionen {
  post?: boolean;
  draft?: CaseDraft;
  bestellnummer?: string;
}

function fakeSitzung(payment_status: 'paid' | 'unpaid' = 'paid', optionen: SitzungsOptionen = {}): Stripe.Checkout.Session {
  const draft = optionen.draft ?? vollstaendigerDraft();
  return {
    id: 'cs_test_123',
    object: 'checkout.session',
    payment_status,
    invoice: 'in_123',
    customer_email: 'muster@example.org',
    customer_details: { email: 'muster@example.org', name: 'Muster Person' },
    payment_intent: 'pi_123',
    metadata: {
      bestellnummer: optionen.bestellnummer ?? 'RR-2026-ABCDEF',
      kundenname: 'Muster Person',
      post: optionen.post === true ? '1' : '0',
      ...fallAlsMetadaten(draft),
    },
  } as unknown as Stripe.Checkout.Session;
}

function ereignis(typ: string, sitzung: Stripe.Checkout.Session): Stripe.Event {
  return { id: 'evt_1', type: typ, data: { object: sitzung } } as unknown as Stripe.Event;
}

interface Protokoll {
  mails: MailNachricht[];
  berichte: number;
  druckvorlagen: number;
  marker: AuslieferungsMarker;
  /** Zeitpunkte, mit denen erzeugeBericht aufgerufen wurde (Stichtag/„Erstellt am“). */
  erstellzeiten: Date[];
}

function neuesProtokoll(): Protokoll {
  return { mails: [], berichte: 0, druckvorlagen: 0, marker: {}, erstellzeiten: [] };
}

function fakeAbhaengigkeiten(protokoll: Protokoll, berichtFehler?: string): ErfuellungsAbhaengigkeiten {
  return {
    erzeugeBericht: async (daten: SitzungsDaten, ordner: string, jetzt: Date) => {
      if (berichtFehler !== undefined) {
        throw new Error(berichtFehler);
      }
      protokoll.berichte += 1;
      protokoll.erstellzeiten.push(jetzt);
      const pfad = join(ordner, 'Gutachten_RR-2026-ABCDEF.pdf');
      writeFileSync(pfad, '%PDF-1.4 test');
      if (daten.postversand) {
        protokoll.druckvorlagen += 1;
        const druckPfad = join(ordner, 'Gutachten_RR-2026-ABCDEF_Druck.pdf');
        writeFileSync(druckPfad, '%PDF-1.4 druck');
        return { pfad, dateiname: 'Gutachten_RR-2026-ABCDEF.pdf', druckPfad, druckDateiname: 'Gutachten_RR-2026-ABCDEF_Druck.pdf' };
      }
      return { pfad, dateiname: 'Gutachten_RR-2026-ABCDEF.pdf' };
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

describe('Zweiphasige Auslieferung (Prompt 13, Abschnitt 3; Prompt 14: Gutachten, Post)', () => {
  it('liest Bestellnummer, E-Mail, Rechnung und Postwunsch aus der Sitzung', () => {
    const daten = sitzungsDaten(fakeSitzung());
    expect(daten).toMatchObject({ id: 'cs_test_123', bestellnummer: 'RR-2026-ABCDEF', email: 'muster@example.org', rechnungId: 'in_123', zahlungId: 'pi_123', postversand: false });
    expect(sitzungsDaten(fakeSitzung('paid', { post: true })).postversand).toBe(true);
  });

  it('Phase A (Webhook): Bestätigung + Erzeugung + Kennzeichen, aber KEIN Versand des Gutachtens', async () => {
    const protokoll = neuesProtokoll();
    const deps = fakeAbhaengigkeiten(protokoll);
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.completed', fakeSitzung()), deps)).toBe('vorbereitet');
    expect(protokoll.berichte).toBe(1);
    expect(protokoll.druckvorlagen).toBe(0);
    // Nur die Vertragsbestätigung (§ 312f BGB) geht sofort raus.
    expect(protokoll.mails).toHaveLength(1);
    expect(protokoll.mails[0]?.betreff).toContain('Bestätigung');
    expect(protokoll.mails[0]?.text).toContain('innerhalb von 12 Stunden');
    expect(protokoll.mails[0]?.text).toContain('kein Sachverständigengutachten');
    expect(protokoll.mails[0]?.text).not.toContain('gedruckte Fassung');
    expect(protokoll.marker.bestaetigt).toBe(JETZT.toISOString());
    expect(protokoll.marker.erzeugt).toBe(JETZT.toISOString());
    expect(protokoll.marker.leadStatus).toBe('Gutachten gekauft');
    expect(protokoll.marker.post).toBeUndefined();
    expect(typeof protokoll.marker.kennzeichen).toBe('string');
    expect(protokoll.marker.ausgeliefert).toBeUndefined();

    // Wiederholte Zustellung: keine zweite Bestätigung, keine zweite Erzeugung.
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.async_payment_succeeded', fakeSitzung()), deps)).toBe('vorbereitet');
    expect(protokoll.mails).toHaveLength(1);
    expect(protokoll.berichte).toBe(1);
  });

  it('Phase A mit Postwunsch: Bestätigung nennt die gedruckte Fassung, Marker „gewünscht“, Druckvorlage erzeugt', async () => {
    const protokoll = neuesProtokoll();
    const deps = fakeAbhaengigkeiten(protokoll);
    expect(await bereiteBestellungVor(sitzungsDaten(fakeSitzung('paid', { post: true })), deps)).toBe('vorbereitet');
    expect(protokoll.mails[0]?.text).toContain('gedruckte Fassung per Post, kostenlos (2–7 Werktage)');
    expect(protokoll.marker.post).toBe('gewuenscht');
    expect(protokoll.marker.postAm).toBe(JETZT.toISOString());
    expect(protokoll.druckvorlagen).toBe(1);
  });

  it('Vertragsart „Weiß ich nicht“: Rückfrage per E-Mail mit der Bestätigung, Kennzeichen in der Freigabe-Liste', async () => {
    const protokoll = neuesProtokoll();
    const deps = fakeAbhaengigkeiten(protokoll);
    const sitzung = fakeSitzung('paid', { draft: { ...vollstaendigerDraft(), vertragsart: 'unbekannt', dynamik: 'unbekannt', dynamikSatz: '' } });
    const daten = sitzungsDaten(sitzung);
    expect(rueckfrageNoetig(daten)).toBe(true);
    expect(await bereiteBestellungVor(daten, deps)).toBe('vorbereitet');
    expect(protokoll.mails.map((m) => m.betreff)).toEqual(['Ihre Bestellung RR-2026-ABCDEF: Bestätigung', 'Kurze Rückfrage zu Ihrer Bestellung RR-2026-ABCDEF']);
    expect(protokoll.mails[1]?.text).toContain('Kapitallebensversicherung');
    const kennzeichen = berechneKennzeichen(daten, JETZT);
    expect(kennzeichen).toContain('Vertragsart unbekannt – Rückfrage per E-Mail');
    expect(kennzeichen).toContain('Annahmen: 2');
    expect(protokoll.marker.kennzeichen).toContain('Rückfrage per E-Mail');
    // Ohne „Weiß ich nicht“ keine Rückfrage.
    expect(rueckfrageNoetig(sitzungsDaten(fakeSitzung()))).toBe(false);
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

  it('Phase B: versendet das Gutachten mit Anhang, Rechnungslink, Durchsetzungs-Link und Videocall-Zeile – genau einmal', async () => {
    const protokoll = neuesProtokoll();
    const deps = fakeAbhaengigkeiten(protokoll);
    const daten = sitzungsDaten(fakeSitzung());
    expect(await bereiteBestellungVor(daten, deps)).toBe('vorbereitet');
    const status = await versendeBericht(daten, deps);
    expect(status.mailVersendetAm).toBe(JETZT.toISOString());
    const mail = protokoll.mails.at(-1)!;
    expect(mail.an).toBe('muster@example.org');
    expect(mail.betreff).toBe('Ihr Gutachten ist da');
    expect(mail.text).toContain('Wir übernehmen');
    expect(mail.text).toContain('/durchsetzung');
    expect(mail.text).toContain('https://rechnung.example/in_123');
    expect(mail.text.trim().split('\n').at(-1)).toContain('Termin wählen');
    expect(mail.text).not.toContain('gedruckte Fassung');
    expect(mail.anhaenge?.[0]?.dateiname).toBe('Gutachten_RR-2026-ABCDEF.pdf');
    expect(mail.anhaenge?.[0]?.inhalt.toString()).toBe('%PDF-1.4 test');
    expect(protokoll.marker.ausgeliefert).toBe(JETZT.toISOString());
    expect(protokoll.marker.post).toBeUndefined();
    // Zweiter Versandversuch (Cron + Freigabe gleichzeitig): kein Doppelversand.
    const mailsVorher = protokoll.mails.length;
    await versendeBericht(daten, deps);
    expect(protokoll.mails).toHaveLength(mailsVorher);
    expect(entscheideVersand(protokoll.marker, JETZT)).toBe('erledigt');
  });

  it('Phase B mit Postwunsch: Hinweis in der Gutachten-Mail, Druckauftrag mit Druckvorlage an den Anbieter', async () => {
    const protokoll = neuesProtokoll();
    const deps = fakeAbhaengigkeiten(protokoll);
    const daten = sitzungsDaten(fakeSitzung('paid', { post: true }));
    expect(await bereiteBestellungVor(daten, deps)).toBe('vorbereitet');
    const status = await versendeBericht(daten, deps);
    expect(status.mailVersendetAm).toBe(JETZT.toISOString());
    expect(status.druckDatei).toContain('_Druck.pdf');
    const kunde = protokoll.mails.find((m) => m.betreff === 'Ihr Gutachten ist da')!;
    expect(kunde.text).toContain('gedruckte Fassung');
    expect(kunde.text).toContain('2–7 Werktage');
    const auftrag = protokoll.mails.find((m) => m.betreff.startsWith('[Post] Druckvorlage'))!;
    expect(auftrag.an).toBe('info@renten-rettung.de');
    expect(auftrag.text).toContain('Musterstraße 1, 12345 Musterstadt');
    expect(auftrag.anhaenge?.[0]?.dateiname).toBe('Gutachten_RR-2026-ABCDEF_Druck.pdf');
    expect(auftrag.anhaenge?.[0]?.inhalt.toString()).toBe('%PDF-1.4 druck');
    expect(status.druckauftragGesendetAm).toBe(JETZT.toISOString());
    expect(protokoll.marker.post).toBe('gewuenscht');
    // Nur ein Druckauftrag, auch bei erneutem Aufruf.
    await versendeBericht(daten, deps);
    expect(protokoll.mails.filter((m) => m.betreff.startsWith('[Post]'))).toHaveLength(1);
  });

  it('Post-Stände und Lead-Status (Admin-Spalten)', () => {
    expect(POST_STAENDE).toEqual(['gewuenscht', 'gedruckt', 'versendet']);
    expect(LEAD_STATUS[0]).toBe('Gutachten gekauft');
    expect(LEAD_STATUS).not.toContain('Bericht gekauft');
  });

  it('Erstkunden-Weg (EK-…) bleibt direkt: sofortige Auslieferung mit Erstkunden-Texten statt Preis', async () => {
    const protokoll = neuesProtokoll();
    const deps = fakeAbhaengigkeiten(protokoll);
    const status = await erfuelleBestellung(sitzungsDaten(fakeSitzung('paid', { bestellnummer: 'EK-CODE1' })), deps);
    expect(status.mailVersendetAm).toBe(JETZT.toISOString());
    expect(protokoll.mails).toHaveLength(2);
    expect(protokoll.mails[0]?.text).toContain('Erstkunden-Programm');
    expect(protokoll.mails[0]?.text).not.toContain('vorab bezahlt');
    expect(protokoll.mails[1]?.betreff).toBe('Ihr Gutachten ist da');
    expect(protokoll.mails[1]?.text).toContain('Als Erstkunde zahlen Sie nichts');
  });

  it('Erstkunden-Fehlerpfad: keine Zahlungs-Mail an den Gratis-Kunden, interner Hinweis nennt den Erstkunden-Weg', async () => {
    const protokoll = neuesProtokoll();
    const deps = fakeAbhaengigkeiten(protokoll, 'Chromium nicht gefunden');
    const status = await erfuelleBestellung(sitzungsDaten(fakeSitzung('paid', { bestellnummer: 'EK-CODE1' })), deps);
    expect(status.mailVersendetAm).toBeUndefined();
    expect(status.fehler?.[0]).toContain('Chromium nicht gefunden');
    // Bestätigung an den Kunden, dann die Erstkunden-Verzögerung (ohne Zahlungs-/Fristbehauptung), dann die interne Meldung.
    expect(protokoll.mails.map((m) => m.an)).toEqual(['muster@example.org', 'muster@example.org', 'info@renten-rettung.de']);
    expect(protokoll.mails[0]?.text).toContain('in wenigen Minuten');
    expect(protokoll.mails[1]?.betreff).toBe('Ihre Bestellung EK-CODE1: Gutachten folgt');
    expect(protokoll.mails[1]?.text).toContain('Freischaltcode bleibt gültig');
    expect(protokoll.mails[1]?.text).not.toMatch(/Zahlung|Werktag/);
    expect(protokoll.mails[2]?.text).toContain('Erstkunden-Code eingelöst (kostenlos)');
    expect(protokoll.mails[2]?.text).toContain('Freischaltcode ist wieder freigegeben');
    expect(status.verzoegerungGemeldetAm).toBe(JETZT.toISOString());
  });

  it('Versand-Mail folgt dem Gutachten: ohne Übernahme-Angebot kein „Wir übernehmen“', async () => {
    const protokoll = neuesProtokoll();
    const basis = fakeAbhaengigkeiten(protokoll);
    const deps: ErfuellungsAbhaengigkeiten = {
      ...basis,
      erzeugeBericht: async (daten, ordner, jetzt) => ({ ...(await basis.erzeugeBericht(daten, ordner, jetzt)), uebernahme: false }),
    };
    const daten = sitzungsDaten(fakeSitzung());
    expect(await bereiteBestellungVor(daten, deps)).toBe('vorbereitet');
    const status = await versendeBericht(daten, deps);
    expect(status.uebernahme).toBe(false);
    const mail = protokoll.mails.at(-1)!;
    expect(mail.betreff).toBe('Ihr Gutachten ist da');
    expect(mail.text).not.toContain('Wir übernehmen');
    expect(mail.text).toContain('letzten Seite des Gutachtens');
  });

  it('Versand-Sperre: ein laufender paralleler Versand wird nicht wiederholt, eine verwaiste Sperre schon', async () => {
    const protokoll = neuesProtokoll();
    const deps = fakeAbhaengigkeiten(protokoll);
    const daten = sitzungsDaten(fakeSitzung());
    expect(await bereiteBestellungVor(daten, deps)).toBe('vorbereitet');
    protokoll.marker.versandBegonnen = new Date(JETZT.getTime() - 60 * 1000).toISOString();
    expect(versandLaeuft(protokoll.marker, JETZT)).toBe(true);
    expect(entscheideVersand({ ...protokoll.marker, freigegeben: JETZT.toISOString() }, JETZT)).toBe('warten');
    const mails = protokoll.mails.length;
    const status = await versendeBericht(daten, deps);
    expect(status.mailVersendetAm).toBeUndefined();
    expect(protokoll.mails).toHaveLength(mails);
    // Sperre älter als VERSAND_SPERRE_MS gilt als abgebrochener Lauf.
    protokoll.marker.versandBegonnen = new Date(JETZT.getTime() - VERSAND_SPERRE_MS - 1000).toISOString();
    expect(versandLaeuft(protokoll.marker, JETZT)).toBe(false);
    const nachher = await versendeBericht(daten, deps);
    expect(nachher.mailVersendetAm).toBe(JETZT.toISOString());
    expect(protokoll.marker.versandBegonnen).toBe(JETZT.toISOString());
    expect(protokoll.marker.ausgeliefert).toBe(JETZT.toISOString());
  });

  it('Phase B rechnet mit dem Zeitpunkt der Phase A (Marker erzeugt_am), nicht mit „jetzt“', async () => {
    const protokoll = neuesProtokoll();
    const deps = fakeAbhaengigkeiten(protokoll);
    const daten = sitzungsDaten(fakeSitzung());
    expect(await bereiteBestellungVor(daten, deps)).toBe('vorbereitet');
    expect(protokoll.erstellzeiten[0]?.toISOString()).toBe(JETZT.toISOString());
    // Andere Instanz: Dateistatus weg, Marker aus Phase A liegt in der Vergangenheit.
    const phaseA = '2026-08-31T21:00:00.000Z';
    protokoll.marker.erzeugt = phaseA;
    process.env['AUSLIEFERUNG_VERZEICHNIS'] = mkdtempSync(join(tmpdir(), 'rr-instanz2-'));
    const spaeter = { ...deps, jetzt: () => new Date('2026-09-01T09:00:00.000Z') };
    const status = await versendeBericht(daten, spaeter);
    expect(status.mailVersendetAm).toBe('2026-09-01T09:00:00.000Z');
    expect(protokoll.erstellzeiten[1]?.toISOString()).toBe(phaseA);
  });

  it('fehlender Marker nach dem Versand wird intern gemeldet (kein stiller Doppelversand-Risiko)', async () => {
    const protokoll = neuesProtokoll();
    const basis = fakeAbhaengigkeiten(protokoll);
    const deps: ErfuellungsAbhaengigkeiten = {
      ...basis,
      setzeMarker: async (daten, patch) => {
        if (patch.ausgeliefert !== undefined) {
          throw new Error('Stripe nicht erreichbar');
        }
        await basis.setzeMarker(daten, patch);
      },
    };
    const daten = sitzungsDaten(fakeSitzung());
    expect(await bereiteBestellungVor(daten, deps)).toBe('vorbereitet');
    const status = await versendeBericht(daten, deps);
    expect(status.mailVersendetAm).toBe(JETZT.toISOString());
    expect(status.fehler?.[0]).toContain('Marker ausgeliefert_am nicht gesetzt');
    const intern = protokoll.mails.at(-1)!;
    expect(intern.an).toBe('info@renten-rettung.de');
    expect(intern.betreff).toContain('Marker fehlt nach Versand');
    expect(intern.text).toContain('pi_123');
  });

  it('gutachtenDaten: Kalendertag in Europe/Berlin, Versichererangabe auch ohne Zuordnung', () => {
    const spaetAbends = new Date('2026-06-30T22:30:00.000Z'); // 00:30 Berliner Zeit am 1. Juli
    const zugeordnet = gutachtenDaten(sitzungsDaten(fakeSitzung()), spaetAbends);
    expect(zugeordnet.bericht.erstelltAm).toBe('2026-07-01');
    expect(zugeordnet.bericht.calc.meta.stichtag).toBe('2026-07');
    expect(zugeordnet.kopf.datum).toBe('01.07.2026');
    expect(zugeordnet.bericht.versichererAnzeigename).toBe('Allianz Lebensversicherungs-AG');
    expect(zugeordnet.bericht.contract.versichererId).toBe('allianz-leben');
    const fremd = gutachtenDaten(
      sitzungsDaten(fakeSitzung('paid', { draft: { ...vollstaendigerDraft(), versicherer: 'Unbekannte Kasse 123' } })),
      JETZT,
    );
    expect(fremd.bericht.contract.versichererId).toBe('unbekannt');
    expect(fremd.bericht.versichererAnzeigename).toBe('Unbekannte Kasse 123 (nicht zugeordnet – Kennzahlen: Branchendurchschnitt)');
  });

  it('Phase-A-Fehler: interne Meldung, keine Kunden-Störung, Webhook meldet fehler (Stripe-Retry)', async () => {
    const protokoll = neuesProtokoll();
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
    const protokoll = neuesProtokoll();
    const deps = fakeAbhaengigkeiten(protokoll);
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.completed', fakeSitzung('unpaid')), deps)).toBe('zahlung-ausstehend');
    expect(await verarbeiteStripeEreignis(ereignis('checkout.session.async_payment_failed', fakeSitzung('unpaid')), deps)).toBe('zahlung-fehlgeschlagen');
    expect(await verarbeiteStripeEreignis(ereignis('payment_intent.created', fakeSitzung()), deps)).toBe('ignoriert');
    expect(protokoll.berichte).toBe(0);
    expect(protokoll.mails).toHaveLength(0);
  });

  it('der Status liegt als Datei im Bestellordner (Protokoll)', async () => {
    const protokoll = neuesProtokoll();
    const deps = fakeAbhaengigkeiten(protokoll);
    await erfuelleBestellung(sitzungsDaten(fakeSitzung()), deps);
    const roh = readFileSync(join(verzeichnis, 'RR-2026-ABCDEF', 'status.json'), 'utf8');
    expect(JSON.parse(roh)).toMatchObject({ bestellnummer: 'RR-2026-ABCDEF', mailWeg: 'protokoll' });
  });
});
