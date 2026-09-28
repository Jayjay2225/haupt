import { describe, expect, it } from 'vitest';
import { BESTELLNUMMER_MUSTER, FEHLER_FALL_UNVOLLSTAENDIG, pruefeBestellung, versandadresse } from '../lib/bestellung';
import { kundenname, leererDraft, validiereBis } from '../lib/draft';
import type { CaseDraft } from '../lib/draft';
import { TEIL_LAENGE, dekodiereFall, fallAlsMetadaten, fallAusMetadaten, kodiereFall } from '../lib/fall-kodierung';
import { neueBestellnummer } from '../lib/zahlung';

/**
 * Entwurf, der bis zum Schritt „Auszahlungen“ vollständig ist (Golden b als
 * Vorlage), dazu „Über Sie“ (Prompt 14, Schritt 10) und die Bestätigungen
 * des Schritts „Ihre Bestellung“.
 */
export function vollstaendigerDraft(): CaseDraft {
  return {
    ...leererDraft(),
    versicherer: 'Allianz Lebensversicherungs-AG',
    vertragsart: 'kapital-lv',
    beginn: '1995-10',
    status: 'laufend',
    zahlweise: 'monatlich',
    erstbeitrag: '1.000',
    erstbeitragWaehrung: 'DM',
    aktuellerBeitrag: '1.200',
    dynamik: 'ja',
    dynamikSatz: '5',
    gesamtsummeLautMitteilung: '439.455',
    rueckkaufswert: '310.658',
    auszahlungenErhalten: 'nein',
    policendarlehen: 'nein',
    buzEnthalten: 'nein',
    anrede: 'frau',
    vorname: 'Muster',
    nachname: 'Person',
    geburtsdatum: '1960-03-14',
    strasse: 'Musterstraße 1',
    plz: '12345',
    ort: 'Musterstadt',
    email: 'muster@example.org',
    einwilligungDatenschutz: true,
    agbGelesen: true,
    ausfuehrungZugestimmt: true,
  };
}

describe('Bestellung (Prompt 14, Schritt 11)', () => {
  it('der Testentwurf ist bis „Auszahlungen“ vollständig', () => {
    expect(validiereBis('auszahlungen', vollstaendigerDraft())).toEqual({});
  });

  it('meldet Fall, Angaben zur Person und Bestätigungen einzeln', () => {
    const fehler = pruefeBestellung(leererDraft());
    expect(Object.keys(fehler).sort()).toEqual(
      ['agbGelesen', 'anrede', 'ausfuehrungZugestimmt', 'einwilligungDatenschutz', 'email', 'fall', 'geburtsdatum', 'nachname', 'ort', 'plz', 'strasse', 'vorname'].sort(),
    );
    expect(fehler.fall).toBe(FEHLER_FALL_UNVOLLSTAENDIG);
  });

  it('akzeptiert einen vollständigen Entwurf', () => {
    expect(pruefeBestellung(vollstaendigerDraft())).toEqual({});
    expect(kundenname(vollstaendigerDraft())).toBe('Muster Person');
  });

  it('der Rückkaufswert ist Pflicht – ohne ihn keine Bestellung', () => {
    expect(pruefeBestellung({ ...vollstaendigerDraft(), rueckkaufswert: '' }).fall).toBe(FEHLER_FALL_UNVOLLSTAENDIG);
  });

  it('liefert die Versandadresse für die Druckvorlage aus dem Entwurf', () => {
    expect(versandadresse(vollstaendigerDraft())).toEqual({
      name: 'Muster Person',
      strasse: 'Musterstraße 1',
      plz: '12345',
      ort: 'Musterstadt',
    });
  });
});

describe('Fall-Kodierung für Zahlungs-Metadaten', () => {
  it('kommt nach Kodieren und Dekodieren unverändert zurück', () => {
    const draft = vollstaendigerDraft();
    const teile = kodiereFall(draft);
    expect(teile.length).toBeGreaterThan(0);
    for (const teil of teile) {
      expect(teil.length).toBeLessThanOrEqual(TEIL_LAENGE);
      expect(teil).toMatch(/^[A-Za-z0-9_-]+$/);
    }
    expect(dekodiereFall(teile)).toEqual(draft);
  });

  it('bleibt mit allen Feldern (inkl. Anschrift und Postwunsch) unter der Stripe-Grenze von 50 Metadaten-Schlüsseln', () => {
    const draft: CaseDraft = {
      ...vollstaendigerDraft(),
      telefon: '+49 30 1234567',
      ende: '2030-10',
      beitragszahlungBis: '2030-10',
      postversand: true,
      beginnUngefaehr: true,
      auszahlungenErhalten: 'ja',
      auszahlungenListe: [
        { monat: '2005-06', betrag: '12.345,67' },
        { monat: '2015-01', betrag: '2.000' },
      ],
      zustandekommen: 'policenmodell',
      belehrungVorhanden: 'ja',
      belehrungFrist: '14-tage',
      belehrungForm: 'schriftform',
    };
    const meta = fallAlsMetadaten(draft);
    expect(Object.keys(meta).length).toBeLessThanOrEqual(6);
    expect(fallAusMetadaten(meta)).toEqual(draft);
  });

  it('liefert ohne oder mit unvollständigen Metadaten undefined', () => {
    expect(fallAusMetadaten(undefined)).toBeUndefined();
    expect(fallAusMetadaten({ fall_teile: '2', fall_1: 'abc' })).toBeUndefined();
  });
});

describe('Bestellnummer', () => {
  it('folgt dem Muster RR-<Jahr>-<6 Zeichen> und wiederholt sich praktisch nicht', () => {
    const nummern = new Set(Array.from({ length: 200 }, () => neueBestellnummer(new Date('2026-09-20'))));
    for (const nummer of nummern) {
      expect(nummer).toMatch(BESTELLNUMMER_MUSTER);
      expect(nummer.startsWith('RR-2026-')).toBe(true);
    }
    expect(nummern.size).toBe(200);
  });
});
