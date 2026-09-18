/**
 * Scoring — Variante A (Konzept Kapitel 6): zwei Zähler, kein Minus, keine Verlust-Streaks.
 * Achtsamkeitspunkt: +1 je Moment ab abgeschlossenem Gefühl-Schritt, unabhängig vom Ausgang.
 * Kompasspunkt: +1, wenn die Entscheidung dem Wunschbild dient (Alternative oder Warten hat gereicht)
 * und mindestens ein Bereich zugeordnet ist.
 */
import type { Entscheidung, Moment } from './typen';

export interface PunkteEingabe {
  gefuehlAbgeschlossen: boolean;
  entscheidung?: Entscheidung;
  wartenErgebnis?: 'vorbei' | 'bewusst-ja';
  bereicheZugeordnet: boolean;
}

export function berechnePunkte(e: PunkteEingabe): { achtsamkeit: 0 | 1; kompass: 0 | 1 } {
  const achtsamkeit: 0 | 1 = e.gefuehlAbgeschlossen ? 1 : 0;
  const kompassKonform =
    e.entscheidung === 'alternative' ||
    (e.entscheidung === 'warten' && e.wartenErgebnis === 'vorbei');
  const kompass: 0 | 1 = achtsamkeit === 1 && kompassKonform && e.bereicheZugeordnet ? 1 : 0;
  return { achtsamkeit, kompass };
}

export function istBewusstesJa(m: Pick<Moment, 'entscheidung' | 'wartenErgebnis'>): boolean {
  return m.entscheidung === 'bewusst-ja' || m.wartenErgebnis === 'bewusst-ja';
}

export interface Wochenbilanz {
  momente: number;
  inDeineRichtung: number;
  bewussteJa: number;
}

/** „11 Momente, 7 davon in deine Richtung, 3 bewusste Ja.“ — in Zahlen. */
export function wochenbilanz(momente: Moment[]): Wochenbilanz {
  const gezaehlt = momente.filter((m) => m.punkte.achtsamkeit === 1 && !m.deletedAt);
  return {
    momente: gezaehlt.length,
    inDeineRichtung: gezaehlt.filter((m) => m.punkte.kompass === 1).length,
    bewussteJa: gezaehlt.filter((m) => istBewusstesJa(m)).length,
  };
}

/** Einziger Streak: Wochen mit ausgefüllter Reflexion, rückwärts ab `abWoche` gezählt. */
export function reflexionsStreak(reflektierteWochen: Set<string>, abWoche: string, wocheDavor: (w: string) => string): number {
  let n = 0;
  let woche = abWoche;
  while (reflektierteWochen.has(woche)) {
    n += 1;
    woche = wocheDavor(woche);
    if (n > 520) break; // Sicherheitsgrenze
  }
  return n;
}
