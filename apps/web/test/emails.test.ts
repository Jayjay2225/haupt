/**
 * E-Mail-Vorlagen (lib/emails.ts): Anrede gegen Missbrauch als Relay,
 * Lieferzusage je Pfad (sofort vs. plausibilisiert), Erstkunden-Varianten
 * ohne Zahlungsbehauptung, interner Rettungsweg je Auslöser.
 */
import { describe, expect, it } from 'vitest';
import { berichtVersand, berichtVerzoegert, internerFehlerHinweis, spaeterWeitermachen, vertragsbestaetigung } from '../lib/emails';

const LINKS = { agb: 'https://x.example/agb', widerruf: 'https://x.example/w' };

describe('Anrede', () => {
  it('nimmt keine Links, Adressen oder überlange Namen in die Anrede', () => {
    expect(spaeterWeitermachen('Erika Beispiel', 'https://x.example/f').text.startsWith('Guten Tag Erika Beispiel,')).toBe(true);
    expect(spaeterWeitermachen('http://boese.example/gewinn', 'https://x.example/f').text.startsWith('Guten Tag,')).toBe(true);
    expect(spaeterWeitermachen('www.boese.example', 'https://x.example/f').text.startsWith('Guten Tag,')).toBe(true);
    expect(spaeterWeitermachen('jemand@boese.example', 'https://x.example/f').text.startsWith('Guten Tag,')).toBe(true);
    expect(spaeterWeitermachen('', 'https://x.example/f').text.startsWith('Guten Tag,')).toBe(true);
    const lang = spaeterWeitermachen(`Erika ${'x'.repeat(200)}`, 'https://x.example/f').text.split('\n')[0]!;
    expect(lang.length).toBeLessThanOrEqual('Guten Tag ,'.length + 80);
    expect(spaeterWeitermachen('Erika\nNeue Zeile', 'https://x.example/f').text.split('\n')[0]).toBe('Guten Tag Erika Neue Zeile,');
  });
});

describe('Vertragsbestätigung', () => {
  it('verspricht die Plausibilisierung nur, wenn sie stattfindet (Phase A/B), sonst „in wenigen Minuten“', () => {
    const zweiphasig = vertragsbestaetigung('M', 'RR-1', LINKS).text;
    expect(zweiphasig).toContain('innerhalb von 12 Stunden; es wird vor dem Versand plausibilisiert');
    const sofort = vertragsbestaetigung('M', 'EK-1', LINKS, 'kostenlos im Erstkunden-Programm', false, true).text;
    expect(sofort).toContain('in wenigen Minuten');
    expect(sofort).not.toContain('plausibilisiert');
    expect(sofort).toContain('Preis: kostenlos im Erstkunden-Programm');
    expect(sofort).not.toContain('vorab bezahlt');
  });

  it('gibt die Kundenerklärung wie in Schritt 11 wieder (Erlöschen mit Beginn der Erstellung)', () => {
    const text = vertragsbestaetigung('M', 'RR-1', LINKS).text;
    expect(text).toContain('Ihr Widerrufsrecht mit Beginn der Erstellung erlischt');
    expect(text).not.toContain('vollständig geliefert');
  });
});

describe('Gutachten-Mail', () => {
  it('bietet die Übernahme nur an, wenn das Gutachten sie anbietet', () => {
    const mit = berichtVersand('M', 'RR-1', 'https://x.example/r', false, 'https://x.example/d', false, true).text;
    expect(mit).toContain('Nächster Schritt: Wir übernehmen.');
    expect(mit).toContain('https://x.example/d');
    const ohne = berichtVersand('M', 'RR-1', 'https://x.example/r', false, 'https://x.example/d', false, false).text;
    expect(ohne).not.toContain('Wir übernehmen');
    expect(ohne).not.toContain('Durchsetzung beauftragen');
    expect(ohne).toContain('letzten Seite des Gutachtens');
    // Standard (ohne Angabe) bleibt das Übernahme-Angebot – wie bisherige Aufrufer.
    expect(berichtVersand('M', 'RR-1').text).toContain('Wir übernehmen');
  });
});

describe('Verzögerung und interner Hinweis', () => {
  it('Erstkunden-Verzögerung ohne Zahlungsbehauptung und ohne feste Frist', () => {
    const ek = berichtVerzoegert('M', 'EK-CODE1', true);
    expect(ek.betreff).not.toContain('Zahlung');
    expect(ek.text).not.toMatch(/Zahlung|Werktag/);
    expect(ek.text).toContain('Freischaltcode bleibt gültig');
    const bezahlt = berichtVerzoegert('M', 'RR-1');
    expect(bezahlt.betreff).toContain('Zahlung ist eingegangen');
    expect(bezahlt.text).toContain('nächsten Werktag');
  });

  it('interner Hinweis nennt den Rettungsweg des jeweiligen Pfads', () => {
    expect(internerFehlerHinweis('RR-1', 'Chromium fehlt', 'webhook').text).toContain('erneut zu');
    expect(internerFehlerHinweis('RR-1', 'Chromium fehlt', 'versand').text).toContain('Kein Stripe-Retry');
    expect(internerFehlerHinweis('RR-1', 'Chromium fehlt', 'versand').text).toContain('/admin');
    const ek = internerFehlerHinweis('EK-1', 'Chromium fehlt', 'erstkunde').text;
    expect(ek).toContain('Erstkunden-Code eingelöst (kostenlos)');
    expect(ek).toContain('Freischaltcode ist wieder freigegeben');
    expect(ek).not.toContain('Zahlung eingegangen');
  });
});
