/**
 * Validierung des Rechner-Assistenten (Prompt 12, 3.2 – umgebaut nach
 * Prompt 14, Abschnitt 2): elf Schritte, eine Frage je Bildschirm, „Weiß ich
 * nicht“ überall außer beim Rückkaufswert, Schritt „Über Sie“ mit Anschrift
 * und Geburtsdatum, letzter Schritt „Ihre Bestellung“.
 */
import { describe, expect, it } from 'vitest';
import {
  BEGINN_MAX,
  BEGINN_MIN,
  SCHRITTE,
  SCHRITT_FRAGE,
  SCHRITT_HILFEFELD,
  SCHRITT_HILFESATZ,
  eintrittsalter,
  kundenname,
  leererDraft,
  uebernehmeBekannteFelder,
  validiereBis,
  validiereSchritt,
  vertragBeendet,
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
    anrede: 'herr',
    vorname: 'Erik',
    nachname: 'Beispiel',
    geburtsdatum: '1962-03-14',
    strasse: 'Beispielweg 2',
    plz: '10115',
    ort: 'Berlin',
    email: 'erik@example.org',
    einwilligungDatenschutz: true,
    agbGelesen: true,
    ausfuehrungZugestimmt: true,
    zustandekommen: 'policenmodell',
    belehrungVorhanden: 'unbekannt',
    abgetretenOderBeliehen: 'nein',
  };
}

describe('Elf Schritte (Prompt 14, Abschnitt 2)', () => {
  it('Reihenfolge: Vertragsart … Auszahlungen, Über Sie, Bestellung – keine Kontakt-Frage, keine Ergebnis-Seite', () => {
    expect(SCHRITTE).toEqual([
      'typ',
      'status',
      'versicherer',
      'beginn',
      'beitrag',
      'dynamik',
      'beitragssumme',
      'rueckkaufswert',
      'auszahlungen',
      'person',
      'bestellung',
    ]);
    expect(SCHRITTE).toHaveLength(11);
    expect((SCHRITTE as readonly string[]).includes('kontakt')).toBe(false);
  });

  it('jeder Schritt hat Frage und Hilfesatz; „Wo finde ich das?“ an allen Sachfragen und beim Geburtsdatum', () => {
    for (const schritt of SCHRITTE) {
      expect(SCHRITT_FRAGE[schritt].trim()).not.toBe('');
      expect(SCHRITT_HILFESATZ[schritt].trim()).not.toBe('');
    }
    expect(SCHRITT_FRAGE.person).toBe('Über Sie');
    expect(SCHRITT_FRAGE.bestellung).toBe('Ihre Bestellung');
    expect(SCHRITT_HILFESATZ.person).toBe('Adresse für Rechnung und Postversand. Geburtsdatum für die Rechnung Ihres Risikoanteils.');
    expect(Object.keys(SCHRITT_HILFEFELD).sort()).toEqual(
      ['typ', 'status', 'versicherer', 'beginn', 'beitrag', 'dynamik', 'beitragssumme', 'rueckkaufswert', 'auszahlungen', 'person'].sort(),
    );
    expect(SCHRITT_HILFEFELD.person).toBe('geburtsdatum');
  });
});

describe('validiereSchritt (Assistent)', () => {
  it('akzeptiert einen vollständig ausgefüllten Entwurf in jedem Schritt', () => {
    const draft = gueltigerDraft();
    for (const schritt of SCHRITTE) {
      expect(validiereSchritt(schritt, draft), schritt).toEqual({});
    }
    expect(validiereBis('bestellung', draft)).toEqual({});
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
    expect(Object.keys(validiereSchritt('person', leer)).sort()).toEqual(
      ['anrede', 'email', 'geburtsdatum', 'nachname', 'ort', 'plz', 'strasse', 'vorname'].sort(),
    );
    expect(Object.keys(validiereSchritt('bestellung', leer)).sort()).toEqual(
      ['agbGelesen', 'ausfuehrungZugestimmt', 'einwilligungDatenschutz'].sort(),
    );
  });

  it('„Weiß ich nicht“ ist überall gültig – außer beim Rückkaufswert', () => {
    const basis = gueltigerDraft();
    expect(validiereSchritt('typ', { ...basis, vertragsart: 'unbekannt' })).toEqual({});
    // Beginn: „Weiß nicht genau“ → nur das Jahr (als Jahresmitte kodiert).
    expect(validiereSchritt('beginn', { ...basis, beginn: '1998-06', beginnUngefaehr: true })).toEqual({});
    expect(validiereSchritt('beginn', { ...basis, beginn: '', beginnUngefaehr: true })['beginn']).toMatch(/Jahr vierstellig/);
    // Beitrag: „Weiß ich nicht“ nur zusammen mit der Beitragssumme.
    const ohneBeitrag = { ...basis, erstbeitrag: '', erstbeitragUnbekannt: true };
    expect(validiereSchritt('beitrag', ohneBeitrag)).toEqual({});
    expect(validiereSchritt('beitragssumme', ohneBeitrag)['gesamtsummeLautMitteilung']).toMatch(/Police nachsehen/);
    expect(validiereSchritt('beitragssumme', { ...ohneBeitrag, gesamtsummeLautMitteilung: '50.000' })).toEqual({});
    expect(validiereSchritt('dynamik', { ...basis, dynamik: 'unbekannt', dynamikSatz: '' })).toEqual({});
    expect(validiereSchritt('auszahlungen', { ...basis, auszahlungenErhalten: 'unbekannt' })).toEqual({});
    // Rückkaufswert: Pflicht, kein „Weiß nicht“.
    expect(validiereSchritt('rueckkaufswert', { ...basis, rueckkaufswert: '' })['rueckkaufswert']).toMatch(/Standmitteilung/);
  });

  it('Schalter „heutiger Beitrag“ (Schritt 5) ist ein gültiger Beitrag', () => {
    expect(validiereSchritt('beitrag', { ...gueltigerDraft(), beitragArt: 'heutiger', erstbeitrag: '150', erstbeitragWaehrung: 'EUR' })).toEqual({});
  });

  it('hält den Zeitraum aus BRAND.range ein (1980–2020)', () => {
    expect(BEGINN_MIN).toBe('1980-01');
    expect(BEGINN_MAX).toBe('2020-12');
    const zuAlt = { ...gueltigerDraft(), beginn: '1979-12' };
    expect(validiereSchritt('beginn', zuAlt)['beginn']).toMatch(/1980 bis 2020/);
    const zuNeu = { ...gueltigerDraft(), beginn: '2021-01' };
    expect(validiereSchritt('beginn', zuNeu)['beginn']).toMatch(/1980 bis 2020/);
    expect(validiereSchritt('beginn', { ...gueltigerDraft(), beginn: '1980-01' })).toEqual({});
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

  it('„Über Sie“: Anrede, Name, Anschrift, E-Mail und ein zum Vertrag passendes Geburtsdatum', () => {
    const basis = gueltigerDraft();
    expect(validiereSchritt('person', { ...basis, email: 'kaputt@' })['email']).toMatch(/vollständig/);
    expect(validiereSchritt('person', { ...basis, plz: '1234' })['plz']).toMatch(/fünfstellig/);
    expect(validiereSchritt('person', { ...basis, anrede: '' })['anrede']).toMatch(/Keine Anrede/);
    // Geburtsdatum 1990 bei Vertragsbeginn 1995: Eintrittsalter 5 → unplausibel.
    expect(validiereSchritt('person', { ...basis, geburtsdatum: '1990-01-01' })['geburtsdatum']).toMatch(/passt nicht zum Vertragsbeginn/);
    // Intern strikt ISO (das Datumsfeld speichert so); ein anderes Format kann nur über einen manipulierten Link kommen.
    expect(validiereSchritt('person', { ...basis, geburtsdatum: '14.03.1962' })['geburtsdatum']).toMatch(/Geburtsdatum angeben/);
    expect(validiereSchritt('person', { ...basis, geburtsdatum: 'abc' })['geburtsdatum']).toMatch(/zum Beispiel 14\.03\.1962/);
    expect(validiereSchritt('person', { ...basis, geburtsdatum: '1962-03-14' })).toEqual({});
    // Telefon bleibt freiwillig.
    expect(validiereSchritt('person', { ...basis, telefon: '' })).toEqual({});
    expect(kundenname(basis)).toBe('Erik Beispiel');
  });

  it('übernimmt fremde Entwürfe nur feldweise mit Längenbegrenzung (Link, Stripe-Metadaten)', () => {
    const draft = uebernehmeBekannteFelder({
      versicherer: 'x'.repeat(1000),
      beginn: '1995-10',
      erstbeitrag: 250, // falscher Typ → ignoriert
      unbekanntesFeld: 'egal',
      auszahlungenListe: [{ monat: 'm'.repeat(100), betrag: '1.000' }, 'kaputt', null],
    });
    expect(draft.versicherer).toHaveLength(300);
    expect(draft.beginn).toBe('1995-10');
    expect(draft.erstbeitrag).toBe('');
    expect('unbekanntesFeld' in draft).toBe(false);
    expect(draft.auszahlungenListe).toEqual([{ monat: 'm'.repeat(40), betrag: '1.000' }]);
    expect(draft.version).toBe(2);
  });

  it('Eintrittsalter aus Geburtsdatum und Vertragsbeginn (volle Jahre)', () => {
    expect(eintrittsalter('1960-03-14', '1995-10')).toBe(35);
    expect(eintrittsalter('1960-11-14', '1995-10')).toBe(34);
    expect(eintrittsalter('14.03.1960', '1995-10')).toBe(35);
    expect(eintrittsalter('', '1995-10')).toBeUndefined();
  });

  it('meldet ein Beendet-Datum vor dem Beginn (Jahr vierstellig?) und erkennt beendete Verträge', () => {
    const draft = { ...gueltigerDraft(), status: 'gekuendigt' as const, statusDatum: '1935-01' };
    expect(validiereSchritt('status', draft)['statusDatum']).toMatch(/vor dem Vertragsbeginn/);
    // Ohne Datum bleibt der Schritt gültig (Datum ist freiwillig).
    expect(validiereSchritt('status', { ...gueltigerDraft(), status: 'gekuendigt', statusDatum: '' })).toEqual({});
    // Ein stehengebliebenes Datum blockiert einen laufenden Vertrag nicht (das Feld ist dort unsichtbar).
    expect(validiereSchritt('status', { ...gueltigerDraft(), status: 'laufend', statusDatum: '1935-01' })).toEqual({});
    expect(vertragBeendet({ ...gueltigerDraft(), status: 'gekuendigt' })).toBe(true);
    expect(vertragBeendet({ ...gueltigerDraft(), status: 'abgelaufen' })).toBe(true);
    expect(vertragBeendet({ ...gueltigerDraft(), status: 'beitragsfrei' })).toBe(false);
  });
});

describe('uebernehmeBekannteFelder', () => {
  it('übernimmt nur bekannte Felder mit passendem Typ', () => {
    const draft = uebernehmeBekannteFelder({
      beginn: '1995-10',
      email: 'a@b.de',
      boese: 'ignorieren',
      einwilligungDatenschutz: 'ja', // falscher Typ
      postversand: 'ja', // falscher Typ
      startAmpel: 'gruen',
    });
    expect(draft.beginn).toBe('1995-10');
    expect(draft.email).toBe('a@b.de');
    expect(draft.einwilligungDatenschutz).toBe(false);
    expect(draft.postversand).toBe(false);
    expect(draft.startAmpel).toBe('gruen');
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
