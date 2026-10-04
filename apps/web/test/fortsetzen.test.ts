/**
 * „Später weitermachen“-Link (lib/fortsetzen.ts): Der Token trägt den
 * Zwischenstand selbst. Geprüft werden Rundreise, Ablauf, die vier
 * Einwilligungen (reisen nie mit, werden nie aus dem Link übernommen),
 * die Längenbegrenzung der Felder und der Schutz vor Dekompressionsbomben.
 */
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { FORTSETZEN_TAGE } from '../config/business';
import { leererDraft } from '../lib/draft';
import { erzeugeFortsetzenToken, fortsetzenLink, leseFortsetzenToken } from '../lib/fortsetzen';
import { vollstaendigerDraft } from './helfer';

const JETZT = new Date('2026-09-29T12:00:00.000Z');

function roh(nutzlast: unknown): string {
  return deflateRawSync(Buffer.from(JSON.stringify(nutzlast), 'utf8')).toString('base64url');
}

describe('Fortsetzen-Token', () => {
  it('Rundreise: Vertragsdaten kommen unverändert zurück, Einwilligungen nie', () => {
    const draft = { ...vollstaendigerDraft(), einwilligungAnkaufKontakt: true };
    const token = erzeugeFortsetzenToken(draft, JETZT);
    const ergebnis = leseFortsetzenToken(token, JETZT);
    expect(ergebnis.stand).toBe('ok');
    if (ergebnis.stand !== 'ok') {
      return;
    }
    expect(ergebnis.draft.versicherer).toBe('Allianz Lebensversicherungs-AG');
    expect(ergebnis.draft.beginn).toBe('1995-10');
    expect(ergebnis.draft.rueckkaufswert).toBe('310.658');
    expect(ergebnis.draft.email).toBe('muster@example.org');
    expect(ergebnis.draft.geburtsdatum).toBe('1960-03-14');
    // Die vier Einwilligungen/Bestätigungen werden in Schritt 11 aktiv gesetzt – nie vorangekreuzt.
    expect(ergebnis.draft.einwilligungDatenschutz).toBe(false);
    expect(ergebnis.draft.agbGelesen).toBe(false);
    expect(ergebnis.draft.ausfuehrungZugestimmt).toBe(false);
    expect(ergebnis.draft.einwilligungAnkaufKontakt).toBe(false);
    // Und sie stehen auch nicht in der Nutzlast des Tokens (entpackt geprüft, nicht am base64-Text).
    const nutzlast = JSON.parse(inflateRawSync(Buffer.from(token, 'base64url')).toString('utf8')) as { d: Record<string, unknown> };
    for (const feld of ['einwilligungDatenschutz', 'agbGelesen', 'ausfuehrungZugestimmt', 'einwilligungAnkaufKontakt']) {
      expect(feld in nutzlast.d, feld).toBe(false);
    }
    expect(nutzlast.d['versicherer']).toBe('Allianz Lebensversicherungs-AG');
    expect(fortsetzenLink('https://renten-rettung.de', token)).toBe(`https://renten-rettung.de/rechner/fortsetzen?f=${token}`);
  });

  it('übernimmt Einwilligungen auch aus älteren Links nicht', () => {
    const alt = roh({ d: { ...leererDraft(), versicherer: 'Muster', einwilligungDatenschutz: true, agbGelesen: true }, bis: '2099-01-01T00:00:00.000Z' });
    const ergebnis = leseFortsetzenToken(alt, JETZT);
    expect(ergebnis.stand).toBe('ok');
    if (ergebnis.stand === 'ok') {
      expect(ergebnis.draft.versicherer).toBe('Muster');
      expect(ergebnis.draft.einwilligungDatenschutz).toBe(false);
      expect(ergebnis.draft.agbGelesen).toBe(false);
    }
  });

  it('läuft nach FORTSETZEN_TAGE ab; unlesbares Ablaufdatum gilt als ungültig', () => {
    const token = erzeugeFortsetzenToken(vollstaendigerDraft(), JETZT);
    const kurzVorher = new Date(JETZT.getTime() + (FORTSETZEN_TAGE * 24 - 1) * 60 * 60 * 1000);
    const danach = new Date(JETZT.getTime() + (FORTSETZEN_TAGE * 24 + 1) * 60 * 60 * 1000);
    expect(leseFortsetzenToken(token, kurzVorher).stand).toBe('ok');
    expect(leseFortsetzenToken(token, danach).stand).toBe('abgelaufen');
    expect(leseFortsetzenToken(roh({ d: {}, bis: 'irgendwann' }), JETZT).stand).toBe('ungueltig');
    expect(leseFortsetzenToken(roh({ d: {} }), JETZT).stand).toBe('ungueltig');
    expect(leseFortsetzenToken(roh('text'), JETZT).stand).toBe('ungueltig');
    expect(leseFortsetzenToken('', JETZT).stand).toBe('ungueltig');
    expect(leseFortsetzenToken('nicht-base64-deflate!!', JETZT).stand).toBe('ungueltig');
  });

  it('begrenzt Feldlängen und weist Dekompressionsbomben ab', () => {
    const lang = roh({ d: { versicherer: 'x'.repeat(5000), auszahlungenListe: [{ monat: 'y'.repeat(200), betrag: '1' }] }, bis: '2099-01-01T00:00:00.000Z' });
    const ergebnis = leseFortsetzenToken(lang, JETZT);
    expect(ergebnis.stand).toBe('ok');
    if (ergebnis.stand === 'ok') {
      expect(ergebnis.draft.versicherer).toHaveLength(300);
      expect(ergebnis.draft.auszahlungenListe[0]?.monat).toHaveLength(40);
    }
    // 1 MB Nullen komprimieren auf wenige KB – entpackt über der 64-KB-Grenze → ungültig statt Speicherfresser.
    const bombe = deflateRawSync(Buffer.alloc(1024 * 1024, 0x30)).toString('base64url');
    expect(bombe.length).toBeLessThan(20000);
    expect(leseFortsetzenToken(bombe, JETZT).stand).toBe('ungueltig');
    expect(leseFortsetzenToken('A'.repeat(20001), JETZT).stand).toBe('ungueltig');
  });
});
