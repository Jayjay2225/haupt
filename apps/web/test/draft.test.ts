import { describe, expect, it } from 'vitest';
import {
  SCHRITTE,
  leererDraft,
  validiereBis,
  validiereSchritt,
  type CaseDraft,
} from '../lib/draft';

/** Vollständig und gültig ausgefüllter Entwurf als Testgrundlage. */
function gueltigerDraft(): CaseDraft {
  return {
    ...leererDraft(),
    name: 'Erika Musterfrau',
    email: 'erika@example.org',
    versicherer: 'Hamburg-Mannheimer',
    vertragsart: 'kapital-lv',
    beginn: '1995-10',
    status: 'laufend',
    zahlweise: 'monatlich',
    erstbeitrag: '250',
    erstbeitragWaehrung: 'DM',
    dynamik: 'ja',
    rueckkaufswert: '310.658,00',
    auszahlungenErhalten: 'nein',
    policendarlehen: 'nein',
    buzEnthalten: 'unbekannt',
    zustandekommen: 'policenmodell',
    belehrungVorhanden: 'unbekannt',
    abgetretenOderBeliehen: 'nein',
    einwilligungDatenschutz: true,
  };
}

describe('validiereSchritt', () => {
  it('akzeptiert einen vollständig ausgefüllten Entwurf in jedem Schritt', () => {
    const draft = gueltigerDraft();
    for (const schritt of SCHRITTE) {
      expect(validiereSchritt(schritt, draft)).toEqual({});
    }
  });

  it('verlangt Name und gültige E-Mail im Kontakt-Schritt', () => {
    const fehler = validiereSchritt('kontakt', leererDraft());
    expect(fehler['name']).toBeDefined();
    expect(fehler['email']).toBeDefined();

    const tippfehler = validiereSchritt('kontakt', {
      ...gueltigerDraft(),
      email: 'erika@example',
    });
    expect(tippfehler['email']).toBeDefined();
  });

  it('verlangt ein Datum, wenn der Vertrag nicht mehr läuft', () => {
    const draft: CaseDraft = { ...gueltigerDraft(), status: 'gekuendigt', statusDatum: '' };
    expect(validiereSchritt('vertrag', draft)['statusDatum']).toBeDefined();

    draft.statusDatum = '2020-06';
    expect(validiereSchritt('vertrag', draft)).toEqual({});
  });

  it('verlangt Erstbeitrag oder aktuellen Beitrag – eines genügt', () => {
    const ohneBeitraege: CaseDraft = { ...gueltigerDraft(), erstbeitrag: '', aktuellerBeitrag: '' };
    expect(validiereSchritt('beitraege', ohneBeitraege)['erstbeitrag']).toBeDefined();

    const nurAktuell: CaseDraft = { ...ohneBeitraege, aktuellerBeitrag: '100,00' };
    expect(validiereSchritt('beitraege', nurAktuell)).toEqual({});
  });

  it('weist unlesbare und negative Beträge zurück', () => {
    const draft: CaseDraft = { ...gueltigerDraft(), rueckkaufswert: 'dreitausend' };
    expect(validiereSchritt('werte', draft)['rueckkaufswert']).toBeDefined();

    draft.rueckkaufswert = '-5';
    expect(validiereSchritt('werte', draft)['rueckkaufswert']).toBeDefined();
  });

  it('verlangt die Auszahlungssumme nur bei erhaltenen Auszahlungen', () => {
    const mitAuszahlung: CaseDraft = {
      ...gueltigerDraft(),
      auszahlungenErhalten: 'ja',
      auszahlungenSumme: '',
    };
    expect(validiereSchritt('werte', mitAuszahlung)['auszahlungenSumme']).toBeDefined();

    mitAuszahlung.auszahlungenSumme = '10.000';
    expect(validiereSchritt('werte', mitAuszahlung)).toEqual({});
  });

  it('fragt Belehrungsdetails nur ab, wenn eine Belehrung gefunden wurde', () => {
    const ohneBelehrung: CaseDraft = { ...gueltigerDraft(), belehrungVorhanden: 'nein' };
    expect(validiereSchritt('eignung', ohneBelehrung)).toEqual({});

    const mitBelehrung: CaseDraft = { ...gueltigerDraft(), belehrungVorhanden: 'ja' };
    const fehler = validiereSchritt('eignung', mitBelehrung);
    expect(fehler['belehrungFrist']).toBeDefined();
    expect(fehler['belehrungForm']).toBeDefined();
    expect(fehler['hervorhebung']).toBeDefined();
  });

  it('verlangt die Datenschutz-Einwilligung vor dem Absenden', () => {
    const draft: CaseDraft = { ...gueltigerDraft(), einwilligungDatenschutz: false };
    expect(validiereSchritt('zusammenfassung', draft)['einwilligungDatenschutz']).toBeDefined();
  });
});

describe('validiereBis', () => {
  it('sammelt Fehler über alle Schritte bis zur Zusammenfassung', () => {
    const fehler = validiereBis('zusammenfassung', leererDraft());
    expect(fehler['name']).toBeDefined();
    expect(fehler['versicherer']).toBeDefined();
    expect(fehler['zahlweise']).toBeDefined();
    expect(fehler['einwilligungDatenschutz']).toBeDefined();
  });
});
