/**
 * Einsichten — neutral formulierte Beobachtungen (Konzept Kapitel 5.5).
 * Schwellen nach Kapitel 13: frühestens ab rund zehn Momenten, höchstens eine
 * Beobachtung pro Tag, nie als Push. Sprache: „fällt zusammen mit“, nie „weil“.
 */
import type { Einsicht, Moment } from './typen';
import { GEFUEHLE, IMPULSE, BEDUERFNISSE } from '../daten';

const MIN_MOMENTE = 10;

function label(liste: { id: string; label: string }[], id?: string): string {
  return liste.find((e) => e.id === id)?.label ?? id ?? '';
}

function stundenFenster(stunde: number): string {
  if (stunde < 11) return 'am Vormittag';
  if (stunde < 15) return 'um die Mittagszeit';
  if (stunde < 19) return 'nach 16 Uhr';
  return 'am Abend';
}

export interface Beobachtung {
  typ: Einsicht['typ'];
  aussage: string;
  schluessel: string; // verhindert Wiederholungen derselben Beobachtung
}

/** Uhrzeit × Gefühl × Impuls: der Kern der Muster-Ansicht. */
export function findeMuster(momente: Moment[]): Beobachtung[] {
  const gezaehlt = momente.filter((m) => m.punkte.achtsamkeit === 1);
  if (gezaehlt.length < MIN_MOMENTE) return [];
  const ergebnis: Beobachtung[] = [];

  // Je Impuls: dominantes Zeitfenster und dominantes Gefühl
  const jeImpuls = new Map<string, Moment[]>();
  for (const m of gezaehlt) {
    if (!m.impulsId) continue;
    const liste = jeImpuls.get(m.impulsId) ?? [];
    liste.push(m);
    jeImpuls.set(m.impulsId, liste);
  }
  for (const [impulsId, liste] of jeImpuls) {
    if (liste.length < 5) continue;
    const fenster = new Map<string, number>();
    const gefuehle = new Map<string, number>();
    for (const m of liste) {
      const f = stundenFenster(new Date(m.zeitpunkt).getHours());
      fenster.set(f, (fenster.get(f) ?? 0) + 1);
      if (m.gefuehl && m.gefuehl !== 'weiss-nicht') {
        gefuehle.set(m.gefuehl, (gefuehle.get(m.gefuehl) ?? 0) + 1);
      }
    }
    const topFenster = [...fenster.entries()].sort((a, b) => b[1] - a[1])[0];
    const topGefuehl = [...gefuehle.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topFenster && topFenster[1] / liste.length >= 0.5) {
      const impulsName = label(IMPULSE, impulsId);
      let aussage = `${impulsName} taucht bei dir meist ${topFenster[0]} auf`;
      if (topGefuehl && topGefuehl[1] / liste.length >= 0.4) {
        aussage += `, oft zusammen mit „${label(GEFUEHLE, topGefuehl[0])}“`;
      }
      aussage += '.';
      ergebnis.push({ typ: 'zeitmuster', aussage, schluessel: `zeit:${impulsId}:${topFenster[0]}` });
    }
  }

  // Bedürfnis-Verteilung
  const jeBeduerfnis = new Map<string, number>();
  let mitBeduerfnis = 0;
  for (const m of gezaehlt) {
    if (!m.beduerfnis) continue;
    mitBeduerfnis += 1;
    jeBeduerfnis.set(m.beduerfnis, (jeBeduerfnis.get(m.beduerfnis) ?? 0) + 1);
  }
  const topB = [...jeBeduerfnis.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topB && mitBeduerfnis >= MIN_MOMENTE && topB[1] / mitBeduerfnis >= 0.35) {
    ergebnis.push({
      typ: 'beduerfnis-verteilung',
      aussage: `Hinter deinen Momenten ruft am häufigsten: ${label(BEDUERFNISSE, topB[0])}.`,
      schluessel: `beduerfnis:${topB[0]}`,
    });
  }

  // Welche Alternativen tatsächlich funktioniert haben
  const wirkt = new Map<string, number>();
  for (const m of gezaehlt) {
    if (m.entscheidung === 'alternative' && m.gewaehlteAlternative && m.punkte.kompass === 1) {
      wirkt.set(m.gewaehlteAlternative, (wirkt.get(m.gewaehlteAlternative) ?? 0) + 1);
    }
  }
  const topA = [...wirkt.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topA && topA[1] >= 3) {
    ergebnis.push({
      typ: 'alternative-wirkt',
      aussage: `„${topA[0]}“ war zuletzt ${topA[1]}-mal deine Wahl — das fällt zusammen mit Momenten in deine Richtung.`,
      schluessel: `alternative:${topA[0]}`,
    });
  }

  return ergebnis;
}

/** Folgetag-Nachfrage: „Hat der Spaziergang gestern geholfen?“ */
export function folgetagKandidat(momente: Moment[], jetzt: Date): Moment | undefined {
  const gesternStart = new Date(jetzt);
  gesternStart.setDate(gesternStart.getDate() - 1);
  gesternStart.setHours(0, 0, 0, 0);
  const gesternEnde = new Date(jetzt);
  gesternEnde.setHours(0, 0, 0, 0);
  return momente.find(
    (m) =>
      m.entscheidung === 'alternative' &&
      m.gewaehlteAlternative &&
      m.zeitpunkt >= gesternStart.toISOString() &&
      m.zeitpunkt < gesternEnde.toISOString(),
  );
}
