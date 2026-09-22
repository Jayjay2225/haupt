import { describe, expect, it } from 'vitest';
import { formatDatumDe, formatEuro, formatMonatDe, monatNameDe, parseDecimalDe, parseMonatDe } from '../lib/format';

describe('parseDecimalDe', () => {
  it('liest deutsche Beträge mit Tausenderpunkt und Komma', () => {
    expect(parseDecimalDe('1.234,56')).toBe(1234.56);
    expect(parseDecimalDe('439.455')).toBe(439455);
    expect(parseDecimalDe('1200')).toBe(1200);
    expect(parseDecimalDe('0,5')).toBe(0.5);
    // englischer Dezimalpunkt (1–2 Nachkommastellen) wird als Komma gelesen
    expect(parseDecimalDe('12345.67')).toBe(12345.67);
    expect(parseDecimalDe('89.5')).toBe(89.5);
    // drei Ziffern nach dem Punkt bleiben Tausendertrennung
    expect(parseDecimalDe('439.455')).toBe(439455);
  });

  it('toleriert €-Zeichen und Leerzeichen', () => {
    expect(parseDecimalDe(' 39.857,00 € ')).toBe(39857);
  });

  it('liefert null bei leeren oder unlesbaren Eingaben', () => {
    expect(parseDecimalDe('')).toBeNull();
    expect(parseDecimalDe('   ')).toBeNull();
    expect(parseDecimalDe('abc')).toBeNull();
    expect(parseDecimalDe('12,34,56')).toBeNull();
    expect(parseDecimalDe('€')).toBeNull();
  });
});

describe('formatEuro', () => {
  it('formatiert nach de-DE mit €-Zeichen', () => {
    const ergebnis = formatEuro(1234.56);
    expect(ergebnis).toMatch(/1\.234,56/);
    expect(ergebnis).toMatch(/€/);
  });
});

describe('Datumsanzeige', () => {
  it('zeigt ISO-Monate als MM/JJJJ', () => {
    expect(formatMonatDe('2004-12')).toBe('12/2004');
    expect(formatMonatDe('')).toBe('');
  });

  it('zeigt ISO-Daten als TT.MM.JJJJ', () => {
    expect(formatDatumDe('1995-10-01')).toBe('01.10.1995');
  });
});

describe('parseMonatDe', () => {
  it('liest die üblichen deutschen Schreibweisen', () => {
    for (const eingabe of ['03/2000', '3/2000', '03.2000', '3.2000', '03-2000', '03 2000', '032000', ' 03/2000 ']) {
      expect(parseMonatDe(eingabe)).toBe('2000-03');
    }
  });

  it('liest die ISO-Form, die Browser mit Monatsauswahl liefern', () => {
    expect(parseMonatDe('2000-03')).toBe('2000-03');
    expect(parseMonatDe('2000-3')).toBe('2000-03');
    expect(parseMonatDe('200003')).toBe('2000-03');
  });

  it('ergänzt zweistellige Jahreszahlen (bis 30 → 20xx, sonst 19xx)', () => {
    expect(parseMonatDe('03/26')).toBe('2026-03');
    expect(parseMonatDe('10/95')).toBe('1995-10');
    expect(parseMonatDe('12/00')).toBe('2000-12');
  });

  it('lehnt unvollständige und unsinnige Eingaben ab', () => {
    for (const eingabe of ['', '2000', 'März 2000', '13/2000', '00/2000', '03/', '03/12345', 'abc']) {
      expect(parseMonatDe(eingabe)).toBeNull();
    }
  });

  it('ist umkehrbar zur deutschen Anzeige', () => {
    expect(parseMonatDe(formatMonatDe('1995-10'))).toBe('1995-10');
    expect(formatMonatDe('1995-10')).toBe('10/1995');
  });
});

describe('monatNameDe', () => {
  it('schreibt den Monat aus', () => {
    expect(monatNameDe('2000-03')).toBe('März 2000');
    expect(monatNameDe('1995-10')).toBe('Oktober 1995');
  });

  it('gibt bei ungültiger Eingabe einen Leerstring zurück', () => {
    expect(monatNameDe('')).toBe('');
    expect(monatNameDe('03/2000')).toBe('');
  });
});
