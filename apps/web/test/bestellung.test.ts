import { describe, expect, it } from 'vitest';
import { BESTELLNUMMER_MUSTER, FEHLER_FALL_UNVOLLSTAENDIG, pruefeBestellformular } from '../lib/bestellung';
import { leererDraft, validiereBis } from '../lib/draft';
import type { CaseDraft } from '../lib/draft';
import { TEIL_LAENGE, dekodiereFall, fallAlsMetadaten, fallAusMetadaten, kodiereFall } from '../lib/fall-kodierung';
import { neueBestellnummer } from '../lib/zahlung';

/** Entwurf, der bis zum Schritt „Werte“ vollständig ist (Golden b als Vorlage). */
export function vollstaendigerDraft(): CaseDraft {
  return {
    ...leererDraft(),
    name: 'Muster Person',
    email: 'muster@example.org',
    versicherer: 'Allianz Lebensversicherungs-AG',
    vertragsart: 'kapital-lv',
    beginn: '1995-10',
    status: 'laufend',
    zahlweise: 'monatlich',
    erstbeitrag: '1.000',
    erstbeitragWaehrung: 'DM',
    aktuellerBeitrag: '1.200',
    dynamik: 'ja',
    gesamtsummeLautMitteilung: '439.455',
    rueckkaufswert: '310.658',
    auszahlungenErhalten: 'nein',
    policendarlehen: 'nein',
    buzEnthalten: 'nein',
  };
}

describe('Bestellformular', () => {
  it('der Testentwurf ist bis „Werte“ vollständig', () => {
    expect(validiereBis('werte', vollstaendigerDraft())).toEqual({});
  });

  it('meldet fehlende Angaben und Bestätigungen einzeln', () => {
    const fehler = pruefeBestellformular({ name: '', email: 'kein-mail', agbGelesen: false, ausfuehrungZugestimmt: false }, leererDraft());
    expect(Object.keys(fehler).sort()).toEqual(['agbGelesen', 'ausfuehrungZugestimmt', 'email', 'fall', 'name']);
    expect(fehler.fall).toBe(FEHLER_FALL_UNVOLLSTAENDIG);
  });

  it('akzeptiert ein vollständiges Formular mit vollständigem Fall', () => {
    const fehler = pruefeBestellformular(
      { name: 'Muster Person', email: 'muster@example.org', agbGelesen: true, ausfuehrungZugestimmt: true },
      vollstaendigerDraft(),
    );
    expect(fehler).toEqual({});
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

  it('bleibt mit allen Feldern unter der Stripe-Grenze von 50 Metadaten-Schlüsseln', () => {
    const draft: CaseDraft = {
      ...vollstaendigerDraft(),
      telefon: '+49 30 1234567',
      ende: '2030-10',
      beitragszahlungBis: '2030-10',
      auszahlungenErhalten: 'ja',
      auszahlungenSumme: '12.345,67',
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
