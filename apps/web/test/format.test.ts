import { describe, expect, it } from 'vitest';
import { formatDatumDe, formatEuro, formatMonatDe, parseDecimalDe } from '../lib/format';

describe('parseDecimalDe', () => {
  it('liest deutsche Beträge mit Tausenderpunkt und Komma', () => {
    expect(parseDecimalDe('1.234,56')).toBe(1234.56);
    expect(parseDecimalDe('439.455')).toBe(439455);
    expect(parseDecimalDe('1200')).toBe(1200);
    expect(parseDecimalDe('0,5')).toBe(0.5);
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
