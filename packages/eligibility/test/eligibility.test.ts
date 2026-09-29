/**
 * Konstellationstests des Eignungs-Checks (Prompt 4: mindestens zwölf)
 * gegen das echte Regelwerk data/legal-rules.json.
 */
import { describe, expect, it } from 'vitest';
import { pruefeEignung } from '../src/eligibility';
import type { EligibilityInput, Regelwerk } from '../src/types';
import regelwerkJson from '../../../data/legal-rules.json';

const regelwerk = regelwerkJson as unknown as Regelwerk;

function frage(anpassung: Partial<EligibilityInput> = {}): EligibilityInput {
  return {
    vertragsschluss: '2000-05-15',
    vertragsart: 'kapital-lv',
    zustandekommen: 'policenmodell',
    belehrungVorhanden: 'nein',
    belehrungFrist: 'unbekannt',
    belehrungForm: 'unbekannt',
    hervorhebung: 'unbekannt',
    status: 'laufend',
    abgetretenOderBeliehen: 'nein',
    auszahlungenErhalten: 'nein',
    ...anpassung,
  };
}

function regelIds(ergebnis: ReturnType<typeof pruefeEignung>): string[] {
  return ergebnis.angewendeteRegeln;
}

describe('Eignungs-Check – Konstellationen', () => {
  it('1. Policenmodell ohne Belehrung → grün (wesentlicher Fehler)', () => {
    const e = pruefeEignung(frage(), regelwerk);
    expect(e.regime).toBe('alt-policenmodell');
    expect(e.ampel).toBe('gruen');
    expect(regelIds(e)).toContain('R-FEHLER-KEINE-BELEHRUNG');
  });

  it('2. Policenmodell mit ordnungsgemäßer Belehrung (2005, 30 Tage, Textform, hervorgehoben) → rot', () => {
    const e = pruefeEignung(
      frage({
        vertragsschluss: '2005-06-01',
        belehrungVorhanden: 'ja',
        belehrungFrist: '30-tage',
        belehrungForm: 'textform',
        hervorhebung: 'ja',
      }),
      regelwerk,
    );
    expect(e.ampel).toBe('rot');
    expect(regelIds(e)).toContain('R-OK-BELEHRUNG');
  });

  it('3. Antragsmodell ohne Belehrung → grün im Regime Rücktritt (§ 8 VVG a.F.)', () => {
    const e = pruefeEignung(frage({ zustandekommen: 'antragsmodell' }), regelwerk);
    expect(e.regime).toBe('alt-antragsmodell');
    expect(e.ampel).toBe('gruen');
    expect(regelIds(e)).toContain('R-REGIME-B');
  });

  it('4. Antragsmodell mit ordnungsgemäßer Belehrung (1999, 14 Tage, Schriftform) → rot', () => {
    const e = pruefeEignung(
      frage({
        vertragsschluss: '1999-03-15',
        zustandekommen: 'antragsmodell',
        belehrungVorhanden: 'ja',
        belehrungFrist: '14-tage',
        belehrungForm: 'schriftform',
        hervorhebung: 'ja',
      }),
      regelwerk,
    );
    expect(e.ampel).toBe('rot');
    expect(regelIds(e)).toContain('R-OK-BELEHRUNG');
  });

  it('5. Geringfügiger Fehler (Schriftform statt Textform, 2003) → rot mit IV-ZR-353/21-Regel', () => {
    const e = pruefeEignung(
      frage({
        vertragsschluss: '2003-03-15',
        belehrungVorhanden: 'ja',
        belehrungFrist: '14-tage',
        belehrungForm: 'schriftform',
        hervorhebung: 'ja',
      }),
      regelwerk,
    );
    expect(e.ampel).toBe('rot');
    expect(regelIds(e)).toContain('R-FEHLER-FORM-SCHRIFT-STATT-TEXT');
  });

  it('6. Verwirkungsfall: wesentlicher Fehler, aber Abtretung → gelb mit Indikator-Regel', () => {
    const e = pruefeEignung(frage({ abgetretenOderBeliehen: 'ja' }), regelwerk);
    expect(e.ampel).toBe('gelb');
    expect(regelIds(e)).toContain('R-VERW-ABTRETUNG');
  });

  it('7. Vertrag vor dem 29.07.1994 → gelb (anderer Hebel: Widerruf a.F./Rückkaufswert), kein Policenmodell-Regime', () => {
    const e = pruefeEignung(frage({ vertragsschluss: '1993-01-15' }), regelwerk);
    expect(e.ampel).toBe('gelb');
    expect(e.regime).toBe('keins');
    expect(regelIds(e)).toContain('R-REGIME-VOR1994');
    expect(e.benoetigteDokumente.join(' ')).toContain('§ 8 Abs. 4');
  });

  it('7b. Grenzmonat Dezember 2004 (nur Monat bekannt) mit 14-Tage-Belehrung → höchstens gelb, Datumsdokument nötig', () => {
    const e = pruefeEignung(
      frage({ vertragsschluss: '2004-12', belehrungVorhanden: 'ja', belehrungFrist: '14-tage', belehrungForm: 'textform', hervorhebung: 'ja' }),
      regelwerk,
    );
    expect(e.ampel).toBe('gelb');
    expect(regelIds(e)).toContain('R-FEHLER-FRIST-ZU-KURZ');
    expect(e.benoetigteDokumente.join(' ')).toContain('Policierungsdatum');
  });

  it('7c. Dezember 2004 ohne Belehrung → grün; der genaue Tag ändert nichts, kein Datumsdokument', () => {
    const e = pruefeEignung(frage({ vertragsschluss: '2004-12' }), regelwerk);
    expect(e.ampel).toBe('gruen');
    expect(e.benoetigteDokumente).toEqual([]);
    expect(e.hinweise.some((h) => h.regelIds.includes('R-FEHLER-FRIST-ZU-KURZ'))).toBe(false);
  });

  it('7d. Nur Jahr 2004 mit 14-Tage-Belehrung → gelb statt rot; mit 30 Tagen weiter rot', () => {
    const b = { belehrungVorhanden: 'ja', belehrungForm: 'textform', hervorhebung: 'ja' } as const;
    expect(pruefeEignung(frage({ vertragsschluss: '2004', belehrungFrist: '14-tage', ...b }), regelwerk).ampel).toBe('gelb');
    expect(pruefeEignung(frage({ vertragsschluss: '2004', belehrungFrist: '30-tage', ...b }), regelwerk).ampel).toBe('rot');
  });

  it('8. Unbekannte Belehrung → gelb, nie grün, mit benötigtem Dokument', () => {
    const e = pruefeEignung(frage({ belehrungVorhanden: 'unbekannt' }), regelwerk);
    expect(e.ampel).toBe('gelb');
    expect(e.benoetigteDokumente.length).toBeGreaterThan(0);
    expect(regelIds(e)).toContain('R-FEHLER-BELEHRUNG-UNBEKANNT');
  });

  it('9. Vertrag ab 2008 mit ordnungsgemäßer Belehrung → rot', () => {
    const e = pruefeEignung(
      frage({ vertragsschluss: '2015-04-10', belehrungVorhanden: 'ja' }),
      regelwerk,
    );
    expect(e.regime).toBe('neu-2008');
    expect(e.ampel).toBe('rot');
  });

  it('10. Vertrag ab 2008 ohne auffindbare Belehrung → gelb mit Hinweis auf geringere Rechtsfolgen', () => {
    const e = pruefeEignung(frage({ vertragsschluss: '2010-04-10' }), regelwerk);
    expect(e.regime).toBe('neu-2008');
    expect(e.ampel).toBe('gelb');
    expect(e.hinweise.some((h) => h.regelIds.includes('R-FOLGE-NEU2008'))).toBe(true);
  });

  it('11. Reine Risikolebensversicherung → rot (Ausschluss)', () => {
    const e = pruefeEignung(frage({ vertragsart: 'risiko-lv' }), regelwerk);
    expect(e.ampel).toBe('rot');
    expect(regelIds(e)).toContain('R-AUS-RISIKO-LV');
  });

  it('11b. Reine Risikolebensversicherung vor dem 29.07.1994 → rot (globaler Ausschluss vor dem Regime-Ausschluss)', () => {
    const e = pruefeEignung(frage({ vertragsart: 'risiko-lv', vertragsschluss: '1990-01' }), regelwerk);
    expect(e.ampel).toBe('rot');
    expect(e.regime).toBe('keins');
    expect(regelIds(e)).toContain('R-AUS-RISIKO-LV');
    expect(e.benoetigteDokumente).toEqual([]);
  });

  it('11c. Rückdeckungsversicherung vor 1994 erhält den regimeunabhängigen Hinweis', () => {
    const e = pruefeEignung(frage({ vertragsart: 'rueckdeckung', vertragsschluss: '1990-01' }), regelwerk);
    expect(e.ampel).toBe('gelb');
    expect(e.hinweise.some((h) => h.regelIds.includes('R-HIN-RUECKDECKUNG'))).toBe(true);
  });

  it('12. Zustandekommen unbekannt (Altvertrag) → höchstens gelb plus Dokumentbedarf', () => {
    const e = pruefeEignung(frage({ zustandekommen: 'unbekannt' }), regelwerk);
    expect(e.regime).toBe('alt-unbekannt');
    expect(e.ampel).toBe('gelb');
    expect(e.benoetigteDokumente.some((d) => d.includes('Antrag'))).toBe(true);
  });

  it('13. Zu kurze Fristangabe (14 statt 30 Tage, Vertrag 2005) → grün', () => {
    const e = pruefeEignung(
      frage({
        vertragsschluss: '2005-06-01',
        belehrungVorhanden: 'ja',
        belehrungFrist: '14-tage',
        belehrungForm: 'textform',
        hervorhebung: 'ja',
      }),
      regelwerk,
    );
    expect(e.ampel).toBe('gruen');
    expect(regelIds(e)).toContain('R-FEHLER-FRIST-ZU-KURZ');
  });

  it('14. Fehlende drucktechnische Hervorhebung → grün (wesentlich)', () => {
    const e = pruefeEignung(
      frage({
        belehrungVorhanden: 'ja',
        belehrungFrist: '14-tage',
        belehrungForm: 'schriftform',
        hervorhebung: 'nein',
      }),
      regelwerk,
    );
    expect(e.ampel).toBe('gruen');
    expect(regelIds(e)).toContain('R-FEHLER-HERVORHEBUNG');
  });

  it('15. Grenzmonat Juli 1994 (nur Monat bekannt) → höchstens gelb, Dokument zum Datum nötig', () => {
    const e = pruefeEignung(frage({ vertragsschluss: '1994-07' }), regelwerk);
    expect(e.ampel).toBe('gelb');
    expect(e.benoetigteDokumente.some((d) => d.includes('Vertragsschluss'))).toBe(true);
    expect(e.regime).toBe('alt-policenmodell');
  });

  it('15b. Nur Jahr 1994 → höchstens gelb, vorsorglich § 5a-Regime, Datum nachzuweisen', () => {
    const e = pruefeEignung(frage({ vertragsschluss: '1994' }), regelwerk);
    expect(e.ampel).toBe('gelb');
    expect(e.regime).toBe('alt-policenmodell');
    expect(e.benoetigteDokumente.join(' ')).toContain('Policierungsdatum');
    expect(regelIds(e)).not.toContain('R-REGIME-VOR1994');
  });

  it('15c. Nur Jahr außerhalb der Grenzjahre verhält sich wie der Monat der Jahresmitte', () => {
    expect(pruefeEignung(frage({ vertragsschluss: '2008', belehrungVorhanden: 'ja' }), regelwerk).regime).toBe('neu-2008');
    expect(pruefeEignung(frage({ vertragsschluss: '1998' }), regelwerk).ampel).toBe(
      pruefeEignung(frage({ vertragsschluss: '1998-06' }), regelwerk).ampel,
    );
  });

  it('17. Belehrung unbekannt mit veralteten Unterangaben (Hervorhebung nein, 14 Tage, 2005) → gelb, keine Unterregeln', () => {
    const e = pruefeEignung(
      frage({ vertragsschluss: '2005-06-01', belehrungVorhanden: 'unbekannt', belehrungFrist: '14-tage', hervorhebung: 'nein' }),
      regelwerk,
    );
    expect(e.ampel).toBe('gelb');
    expect(regelIds(e)).not.toContain('R-FEHLER-HERVORHEBUNG');
    expect(regelIds(e)).not.toContain('R-FEHLER-FRIST-ZU-KURZ');
    expect(e.benoetigteDokumente.length).toBeGreaterThan(0);
  });

  it('18. Belehrung vorhanden, aber Frist „andere“ → gelb mit Begründung und Dokument', () => {
    const e = pruefeEignung(
      frage({ belehrungVorhanden: 'ja', hervorhebung: 'ja', belehrungFrist: 'andere', belehrungForm: 'textform' }),
      regelwerk,
    );
    expect(e.ampel).toBe('gelb');
    expect(regelIds(e)).toContain('R-FEHLER-FRIST-SONST');
    expect(e.benoetigteDokumente.length).toBeGreaterThan(0);
  });

  it('19. Belehrung vorhanden, Frist/Form unbekannt → gelb, nie ohne Dokument', () => {
    const e = pruefeEignung(
      frage({ belehrungVorhanden: 'ja', hervorhebung: 'ja', belehrungFrist: 'unbekannt', belehrungForm: 'unbekannt' }),
      regelwerk,
    );
    expect(e.ampel).toBe('gelb');
    expect(regelIds(e)).toEqual(expect.arrayContaining(['R-FEHLER-FRIST-UNBEKANNT', 'R-FEHLER-FORM-UNBEKANNT']));
    expect(e.benoetigteDokumente.length).toBeGreaterThan(0);
  });

  it('Regelwerk: versioniert, kein Quellen-Abrufdatum liegt nach dem Stand', () => {
    expect(regelwerk.version).not.toBe('0.1.0');
    expect(regelwerk.stand).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const r of regelwerk.regeln) {
      for (const q of r.quelle) {
        if (q.abrufdatum !== undefined) {
          expect(q.abrufdatum <= regelwerk.stand).toBe(true);
        }
      }
    }
  });

  it('16. Kündigung/Zeitablauf ist kein Verwirkungsindikator; Fondsvertrag erhält Methodik-Hinweis', () => {
    const e = pruefeEignung(frage({ status: 'gekuendigt', vertragsart: 'fonds-lv', auszahlungenErhalten: 'ja' }), regelwerk);
    expect(e.ampel).toBe('gruen');
    expect(e.hinweise.some((h) => h.regelIds.includes('R-VERW-ZEITABLAUF-NEGATIV'))).toBe(true);
    expect(e.hinweise.some((h) => h.regelIds.includes('R-FOLGE-FONDS'))).toBe(true);
    expect(e.hinweise.some((h) => h.regelIds.includes('R-FOLGE-KAPEST'))).toBe(true);
  });

  it('formuliert ohne Rechtszusage: keine Begründung enthält „steht Ihnen zu" oder „ist wirksam"', () => {
    const e = pruefeEignung(frage(), regelwerk);
    const texte = [...e.begruendungen, ...e.hinweise].map((b) => b.text).join(' ');
    expect(texte).not.toMatch(/steht Ihnen zu|ist wirksam|garantiert/i);
  });

  it('nennt in jeder Begründung mindestens eine Regel-ID', () => {
    const e = pruefeEignung(frage({ belehrungVorhanden: 'unbekannt', abgetretenOderBeliehen: 'ja' }), regelwerk);
    for (const b of [...e.begruendungen, ...e.hinweise]) {
      expect(b.regelIds.length).toBeGreaterThan(0);
    }
  });
});
