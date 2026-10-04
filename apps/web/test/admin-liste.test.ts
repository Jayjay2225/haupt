/**
 * CSV-Export der Bestell-Liste (lib/admin-liste.ts): UTF-8-BOM für Excel,
 * Anführungszeichen verdoppelt, Formel-Auslöser am Feldanfang entschärft
 * (Kundenname ist Nutzereingabe).
 */
import { describe, expect, it } from 'vitest';
import { bestellungenAlsCsv, type BestellZeile } from '../lib/admin-liste';

function zeile(kundenname: string): BestellZeile {
  return {
    sitzung: 'cs_1',
    bestellnummer: 'RR-2026-ABCDEF',
    kundenname,
    email: 'muster@example.org',
    bezahltAm: '2026-09-20T10:00:00.000Z',
    marker: { erzeugt: '2026-09-20T10:01:00.000Z' },
    entscheidung: 'warten',
    kennzeichen: ['Annahmen: 2', 'Branchenwerte 40 %'],
    leadStatus: 'Gutachten gekauft',
    postversand: true,
    post: 'gewuenscht',
  };
}

describe('CSV-Export', () => {
  it('beginnt mit BOM und Kopfzeile, trennt mit Semikolon, verdoppelt Anführungszeichen', () => {
    const csv = bestellungenAlsCsv([zeile('Erika "Eri" Beispiel')]);
    expect(csv.startsWith('﻿bestellnummer;kundenname;email;bezahlt_am;')).toBe(true);
    const zeilen = csv.split('\n');
    expect(zeilen).toHaveLength(2);
    expect(zeilen[1]).toContain('"Erika ""Eri"" Beispiel"');
    expect(zeilen[1]).toContain('"gewuenscht"');
    expect(zeilen[1]).toContain('"Annahmen: 2; Branchenwerte 40 %"');
  });

  it('entschärft Formel-Auslöser am Feldanfang (=, +, -, @, Tab, CR)', () => {
    for (const [eingabe, erwartet] of [
      ['=HYPERLINK("http://x")', `"'=HYPERLINK(""http://x"")"`],
      ['+1', `"'+1"`],
      ['-1', `"'-1"`],
      ['@SUM(A1)', `"'@SUM(A1)"`],
      ['\tcmd', `"'\tcmd"`],
      ['Erika Beispiel', '"Erika Beispiel"'],
    ] as const) {
      expect(bestellungenAlsCsv([zeile(eingabe)]).split('\n')[1]).toContain(erwartet);
    }
  });
});
