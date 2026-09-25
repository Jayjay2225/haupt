import { describe, expect, it } from 'vitest';
import { loeseZinsreihe } from '../src/zinsreihe';
import { testDaten } from './fixtures';

describe('Zinsreihe', () => {
  const daten = testDaten();

  it('nutzt Unternehmenswerte, im Min-Szenario den niedrigeren Wert aus Netto- und laufender Verzinsung', () => {
    const basis = loeseZinsreihe(daten, 'test-vers', 2004, 2006, 'basis');
    expect(basis.jahre.map((j) => [j.jahr, j.satzProzent, j.herkunft])).toEqual([
      [2004, 6.0, 'insurer'],
      [2005, 6.0, 'insurer'],
      [2006, 6.0, 'insurer'],
    ]);

    const min = loeseZinsreihe(daten, 'test-vers', 2004, 2004, 'min');
    expect(min.jahre[0]!.satzProzent).toBe(5.5);
  });

  it('folgt der Rechtsnachfolge (kennzahlenVon ab Jahr X)', () => {
    const ergebnis = loeseZinsreihe(daten, 'alt-vers', 2003, 2006, 'basis');
    expect(ergebnis.jahre.map((j) => [j.jahr, j.satzProzent, j.herkunft])).toEqual([
      [2003, 3.3, 'insurer'], // eigener Wert
      [2004, 5.0, 'branche'], // vor Bestandsübertragung, kein eigener Wert
      [2005, 6.0, 'insurer'], // Nachfolger test-vers
      [2006, 6.0, 'insurer'],
    ]);
  });

  it('fällt für unbekannte Versicherer auf den Branchendurchschnitt zurück (markiert)', () => {
    const ergebnis = loeseZinsreihe(daten, 'gibt-es-nicht', 2000, 2001, 'basis');
    expect(ergebnis.jahre.every((j) => j.herkunft === 'branche')).toBe(true);
    expect(ergebnis.annahmen.some((a) => a.code === 'VERSICHERER_UNBEKANNT')).toBe(true);
  });

  it('überbrückt Lücken mit dem letzten Branchenwert und warnt', () => {
    const ergebnis = loeseZinsreihe(daten, 'unbekannt', 2011, 2013, 'basis'); // 2012 fehlt in den Testdaten
    expect(ergebnis.jahre.map((j) => j.herkunft)).toEqual(['branche', 'fallback', 'branche']);
    expect(ergebnis.jahre[1]!.satzProzent).toBe(4.2);
    expect(ergebnis.warnungen.some((w) => w.code === 'ZINSREIHE_LUECKE')).toBe(true);
  });

  it('verwendet einen Override-Zins für alle Jahre', () => {
    const ergebnis = loeseZinsreihe(daten, 'test-vers', 2000, 2002, 'basis', 3.5);
    expect(ergebnis.jahre.every((j) => j.satzProzent === 3.5 && j.herkunft === 'override')).toBe(true);
  });
});
