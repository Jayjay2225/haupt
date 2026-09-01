import { describe, expect, it } from 'vitest';
import { interpretiere, normalisiere, pruefeKrise } from './interpretation';
import type { Impuls, KriseKategorie } from '../daten';

const IMPULSE: Impuls[] = [
  { id: 'suesses', label: 'Süßes', icon: 'candy', bereiche: ['koerper', 'psyche'], beduerfnisse: ['energie', 'trost'], keywords: ['schoko', 'eis', 'suess', 'riegel'] },
  { id: 'alkohol', label: 'Alkohol', icon: 'wine', bereiche: ['koerper', 'psyche'], beduerfnisse: ['trost', 'genuss'], keywords: ['wein', 'bier', 'alkohol'] },
  { id: 'scrollen', label: 'Scrollen', icon: 'smartphone', bereiche: ['psyche'], beduerfnisse: ['ablenkung'], keywords: ['insta', 'tiktok', 'scroll', 'handy'] },
];

const KRISE: KriseKategorie[] = [
  { id: 'suizidalitaet', label: 'Direkte Suizidalität', muster: ['nicht mehr leben', 'umbring'] },
  { id: 'hoffnungslosigkeit', label: 'Hoffnungslosigkeit', muster: ['keinen sinn mehr'] },
];

describe('normalisiere', () => {
  it('vereinheitlicht Umlaute, Groß-/Kleinschreibung und Satzzeichen', () => {
    expect(normalisiere('Ich WILL jetzt Süßes — sofort.')).toBe('ich will jetzt suesses sofort');
  });
});

describe('interpretiere — regelbasiert nach Kapitel 10', () => {
  it('erkennt einen Impuls aus Umgangssprache', () => {
    const e = interpretiere('ich will jetzt ein eis', IMPULSE, KRISE);
    expect(e.impulsId).toBe('suesses');
    expect(e.konfidenz).toBe('hoch');
    expect(e.bereiche).toEqual(['koerper', 'psyche']);
  });
  it('mehr Treffer gewinnen', () => {
    const e = interpretiere('schoko riegel statt abendessen', IMPULSE, KRISE);
    expect(e.impulsId).toBe('suesses');
  });
  it('fragt bei Gleichstand, statt zu raten', () => {
    const e = interpretiere('wein und schoko', IMPULSE, KRISE);
    expect(e.impulsId).toBeUndefined();
    expect(e.konfidenz).toBe('niedrig');
  });
  it('läuft bei unbekanntem Text als freier Impuls weiter', () => {
    const e = interpretiere('den rasen mähen', IMPULSE, KRISE);
    expect(e.impulsId).toBeUndefined();
    expect(e.krise).toBe(false);
    expect(e.freitext).toBe('den rasen mähen');
  });
});

describe('Krisen-Check — vor jedem Scoring (Kapitel 11)', () => {
  it('erkennt Krisen-Muster auch mit Umlauten und Flexion', () => {
    expect(pruefeKrise('Ich will nicht mehr LEBEN', KRISE)).toBe(true);
    expect(pruefeKrise('es hat doch eh keinen Sinn mehr', KRISE)).toBe(true);
  });
  it('beendet den Flow ohne Impuls-Deutung', () => {
    const e = interpretiere('ich will nicht mehr leben', IMPULSE, KRISE);
    expect(e.krise).toBe(true);
    expect(e.impulsId).toBeUndefined();
  });
  it('löst bei Alltagssprache nicht aus', () => {
    expect(pruefeKrise('ich will jetzt ein eis', KRISE)).toBe(false);
  });
});
