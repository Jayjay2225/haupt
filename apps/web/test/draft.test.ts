/**
 * Validierung des Rechner-Assistenten (Prompt 12, Abschnitt 3.2):
 * eine Frage je Schritt, Zeitraum aus BRAND.range, DM-Beiträge,
 * Auszahlungsliste, Kontakt-Schritt mit Datenschutz-Häkchen.
 */
import { describe, expect, it } from 'vitest';
import {
  BEGINN_MAX,
  BEGINN_MIN,
  SCHRITTE,
  leererDraft,
  uebernehmeBekannteFelder,
  validiereBis,
  validiereSchritt,
  type CaseDraft,
} from '../lib/draft';

/** Vollständig und gültig ausgefüllter Entwurf als Testgrundlage. */
function gueltigerDraft(): CaseDraft {
  return {
    ...leererDraft(),
    vertragsart: 'kapital-lv',
    status: 'laufend',
    versicherer: 'Hamburg-Mannheimer',
    beginn: '1995-10',
    erstbeitrag: '250',
    erstbeitragWaehrung: 'DM',
    zahlweise: 'monatlich',
    dynamik: 'ja',
    dynamikSatz: '5',
    rueckkaufswert: '310.658,00',
    auszahlungenErhalten: 'nein',
    email: 'erika@example.org',
    kontaktWunsch: 'email',
    einwilligungDatenschutz: true,
    zustandekommen: 'policenmodell',
    belehrungVorhanden: 'unbekannt',
    abgetretenOderBeliehen: 'nein',
  };
}

describe('validiereSchritt (Assistent)', () => {
  it('akzeptiert einen vollständig ausgefüllten Entwurf in jedem Schritt', () => {
    const draft = gueltigerDraft();
    for (const schritt of SCHRITTE) {
      expect(validiereSchritt(schritt, draft)).toEqual({});
    }
    expect(validiereBis('kontakt', draft)).toEqual({});
  });

  it('verlangt je Frage genau die Pflichtangabe', () => {
    const leer = leererDraft();
    expect(Object.keys(validiereSchritt('typ', leer))).toEqual(['vertragsart']);
    expect(Object.keys(validiereSchritt('status', leer))).toEqual(['status']);
    expect(Object.keys(validiereSchritt('versicherer', leer))).toEqual(['versicherer']);
    expect(Object.keys(validiereSchritt('beginn', leer))).toEqual(['beginn']);
    expect(Object.keys(validiereSchritt('beitrag', leer))).toEqual(['erstbeitrag']);
    expect(Object.keys(validiereSchritt('dynamik', leer))).toEqual(['dynamik']);
    expect(Object.keys(validiereSchritt('rueckkaufswert', leer))).toEqual(['rueckkaufswert']);
    expect(Object.keys(validiereSchritt('auszahlungen', leer))).toEqual(['auszahlungenErhalten']);
    // Beitragssumme ist überspringbar – keine Pflicht.
    expect(validiereSchritt('beitragssumme', leer)).toEqual({});
  });

  it('hält den Zeitraum aus BRAND.range ein (1980–2020)', () => {
    expect(BEGINN_MIN).toBe('1980-01');
    expect(BEGINN_MAX).toBe('2020-12');
    const zuAlt = { ...gueltigerDraft(), beginn: '1979-12' };
    expect(validiereSchritt('beginn', zuAlt)['beginn']).toMatch(/1980 bis 2020/);
    const zuNeu = { ...gueltigerDraft(), beginn: '2021-01' };
    expect(validiereSchritt('beginn', zuNeu)['beginn']).toMatch(/1980 bis 2020/);
    const grenzen = { ...gueltigerDraft(), beginn: '1980-01' };
    expect(validiereSchritt('beginn', grenzen)).toEqual({});
    expect(validiereSchritt('beginn', { ...gueltigerDraft(), beginn: '2020-12' })).toEqual({});
  });

  it('verlangt bei Dynamik „ja“ einen plausiblen Satz', () => {
    const ohneSatz = { ...gueltigerDraft(), dynamik: 'ja' as const, dynamikSatz: '' };
    expect(validiereSchritt('dynamik', ohneSatz)['dynamikSatz']).toMatch(/3, 5 oder 10/);
    const zuHoch = { ...gueltigerDraft(), dynamikSatz: '25' };
    expect(Object.keys(validiereSchritt('dynamik', zuHoch))).toEqual(['dynamikSatz']);
  });

  it('prüft die Auszahlungsliste je Eintrag (Datum, Betrag, Chronologie)', () => {
    const mit = {
      ...gueltigerDraft(),
      auszahlungenErhalten: 'ja' as const,
      auszahlungenListe: [
        { monat: '2005-06', betrag: '5.000' },
        { monat: '1990-01', betrag: 'abc' },
      ],
    };
    const fehler = validiereSchritt('auszahlungen', mit);
    expect(fehler['auszahlung-0-monat']).toBeUndefined();
    expect(fehler['auszahlung-1-monat']).toMatch(/vor dem Vertragsbeginn/);
    expect(fehler['auszahlung-1-betrag']).toMatch(/Betrag/);
    const leer = { ...gueltigerDraft(), auszahlungenErhalten: 'ja' as const, auszahlungenListe: [] };
    expect(validiereSchritt('auszahlungen', leer)['auszahlungenListe']).toMatch(/mindestens eine/);
  });

  it('verlangt im Kontakt-Schritt E-Mail, Kontaktweg und Datenschutz-Häkchen', () => {
    const ohne = { ...gueltigerDraft(), email: '', kontaktWunsch: '' as const, einwilligungDatenschutz: false };
    const fehler = validiereSchritt('kontakt', ohne);
    expect(Object.keys(fehler).sort()).toEqual(['einwilligungDatenschutz', 'email', 'kontaktWunsch']);
    expect(validiereSchritt('kontakt', { ...gueltigerDraft(), email: 'kaputt@' })['email']).toMatch(/vollständig/);
    // Kontaktweg Telefon verlangt eine Nummer (Prompt 13, §4).
    const tel = { ...gueltigerDraft(), kontaktWunsch: 'telefon' as const, telefon: '' };
    expect(validiereSchritt('kontakt', tel)['telefon']).toMatch(/Telefonnummer/);
  });

  it('meldet ein Beendet-Datum vor dem Beginn (Jahr vierstellig?)', () => {
    const draft = { ...gueltigerDraft(), status: 'gekuendigt' as const, statusDatum: '1935-01' };
    expect(validiereSchritt('status', draft)['statusDatum']).toMatch(/vor dem Vertragsbeginn/);
    // Ohne Datum bleibt der Schritt gültig (Datum ist freiwillig).
    expect(validiereSchritt('status', { ...gueltigerDraft(), status: 'gekuendigt', statusDatum: '' })).toEqual({});
  });
});

describe('uebernehmeBekannteFelder', () => {
  it('übernimmt nur bekannte Felder mit passendem Typ', () => {
    const draft = uebernehmeBekannteFelder({
      beginn: '1995-10',
      email: 'a@b.de',
      boese: 'ignorieren',
      einwilligungDatenschutz: 'ja', // falscher Typ
    });
    expect(draft.beginn).toBe('1995-10');
    expect(draft.email).toBe('a@b.de');
    expect(draft.einwilligungDatenschutz).toBe(false);
    expect((draft as unknown as Record<string, unknown>)['boese']).toBeUndefined();
  });

  it('bereinigt die Auszahlungsliste und deckelt sie', () => {
    const draft = uebernehmeBekannteFelder({
      auszahlungenListe: [
        { monat: '2005-06', betrag: '5.000' },
        { monat: 7, betrag: null },
        'unsinn',
        ...Array.from({ length: 30 }, () => ({ monat: '2010-01', betrag: '1' })),
      ],
    });
    expect(draft.auszahlungenListe.length).toBeLessThanOrEqual(20);
    expect(draft.auszahlungenListe[0]).toEqual({ monat: '2005-06', betrag: '5.000' });
    expect(draft.auszahlungenListe[1]).toEqual({ monat: '', betrag: '' });
  });
});
