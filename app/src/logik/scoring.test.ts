import { describe, expect, it } from 'vitest';
import { berechnePunkte, istBewusstesJa, reflexionsStreak, wochenbilanz } from './scoring';
import type { Moment } from './typen';

const basis = {
  id: 'x', createdAt: '', updatedAt: '', deviceId: 'g',
  zeitpunkt: '2026-08-24T16:00:00.000Z', eingabeart: 'kachel' as const,
  bereiche: ['koerper' as const], dauerSekunden: 40,
};

function moment(teil: Partial<Moment>): Moment {
  return { ...basis, punkte: { achtsamkeit: 1, kompass: 0 }, ...teil } as Moment;
}

describe('berechnePunkte — Regeltabelle aus Kapitel 6', () => {
  it('Alternative gewählt: Achtsamkeit + Kompass', () => {
    expect(berechnePunkte({ gefuehlAbgeschlossen: true, entscheidung: 'alternative', bereicheZugeordnet: true }))
      .toEqual({ achtsamkeit: 1, kompass: 1 });
  });
  it('Warten hat gereicht: Achtsamkeit + Kompass', () => {
    expect(berechnePunkte({ gefuehlAbgeschlossen: true, entscheidung: 'warten', wartenErgebnis: 'vorbei', bereicheZugeordnet: true }))
      .toEqual({ achtsamkeit: 1, kompass: 1 });
  });
  it('Bewusst ja: voller Achtsamkeitspunkt, kein Kompasspunkt — nie negativ', () => {
    expect(berechnePunkte({ gefuehlAbgeschlossen: true, entscheidung: 'bewusst-ja', bereicheZugeordnet: true }))
      .toEqual({ achtsamkeit: 1, kompass: 0 });
  });
  it('Grenzfall: Warten, dann trotzdem bewusst ja — kein Kompasspunkt', () => {
    expect(berechnePunkte({ gefuehlAbgeschlossen: true, entscheidung: 'warten', wartenErgebnis: 'bewusst-ja', bereicheZugeordnet: true }))
      .toEqual({ achtsamkeit: 1, kompass: 0 });
  });
  it('Grenzfall: Abbruch nach dem Gefühl-Schritt — Achtsamkeitspunkt bleibt', () => {
    expect(berechnePunkte({ gefuehlAbgeschlossen: true, entscheidung: 'abbruch', bereicheZugeordnet: true }))
      .toEqual({ achtsamkeit: 1, kompass: 0 });
  });
  it('Grenzfall: Abbruch vor dem Gefühl-Schritt — kein Punkt', () => {
    expect(berechnePunkte({ gefuehlAbgeschlossen: false, entscheidung: 'abbruch', bereicheZugeordnet: true }))
      .toEqual({ achtsamkeit: 0, kompass: 0 });
  });
  it('Grenzfall: ohne Bereichszuordnung entfällt der Kompasspunkt', () => {
    expect(berechnePunkte({ gefuehlAbgeschlossen: true, entscheidung: 'alternative', bereicheZugeordnet: false }))
      .toEqual({ achtsamkeit: 1, kompass: 0 });
  });
});

describe('wochenbilanz — Wochenansicht in Worten', () => {
  it('zählt Momente, Richtung und bewusste Ja wie das Konzeptbeispiel', () => {
    const momente: Moment[] = [
      ...Array.from({ length: 7 }, (_, i) => moment({ id: 'a' + i, punkte: { achtsamkeit: 1, kompass: 1 }, entscheidung: 'alternative' })),
      ...Array.from({ length: 3 }, (_, i) => moment({ id: 'j' + i, entscheidung: 'bewusst-ja' })),
      moment({ id: 'ab', entscheidung: 'abbruch' }),
    ];
    expect(wochenbilanz(momente)).toEqual({ momente: 11, inDeineRichtung: 7, bewussteJa: 3 });
  });
  it('warten → bewusst ja zählt als bewusstes Ja', () => {
    expect(istBewusstesJa({ entscheidung: 'warten', wartenErgebnis: 'bewusst-ja' })).toBe(true);
  });
});

describe('reflexionsStreak — einziger Streak der App', () => {
  const davor = (w: string) => {
    const [j, n] = w.split('-W').map(Number);
    return n > 1 ? `${j}-W${String(n - 1).padStart(2, '0')}` : `${j - 1}-W52`;
  };
  it('zählt zusammenhängende Wochen rückwärts', () => {
    const wochen = new Set(['2026-W33', '2026-W34', '2026-W35']);
    expect(reflexionsStreak(wochen, '2026-W35', davor)).toBe(3);
  });
  it('bricht bei einer Lücke ab, ohne etwas abzuziehen', () => {
    const wochen = new Set(['2026-W31', '2026-W33']);
    expect(reflexionsStreak(wochen, '2026-W33', davor)).toBe(1);
  });
});
