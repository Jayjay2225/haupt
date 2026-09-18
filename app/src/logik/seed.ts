/**
 * Seed-Modul: acht Beispielwochen (Konzept Kapitel 10), als Demo markiert und
 * mit einem Tap rückstandsfrei entfernbar. Deterministisch, damit Screens und
 * Screenshots reproduzierbar sind.
 */
import type { BeduerfnisId, BereichId, GefuehlId, Moment, Wochenreflexion } from './typen';
import { berechnePunkte } from './scoring';
import { isoWoche, wochenstart } from './wochen';
import { ulid } from './ulid';

function rng(seedWert: number): () => number {
  let a = seedWert;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ImpulsProfilEintrag {
  impulsId: string;
  bereiche: BereichId[];
  gefuehle: GefuehlId[];
  beduerfnisse: BeduerfnisId[];
  stunden: number[];
  gewicht: number;
}

const PROFIL: ImpulsProfilEintrag[] = [
  { impulsId: 'suesses', bereiche: ['koerper', 'psyche'], gefuehle: ['muede', 'gestresst'], beduerfnisse: ['energie', 'trost'], stunden: [15, 16, 17], gewicht: 4 },
  { impulsId: 'scrollen', bereiche: ['psyche'], gefuehle: ['unruhig', 'gelangweilt'], beduerfnisse: ['ablenkung', 'pause'], stunden: [12, 21, 22], gewicht: 3 },
  { impulsId: 'serien', bereiche: ['koerper', 'psyche'], gefuehle: ['muede', 'gut'], beduerfnisse: ['belohnung', 'genuss'], stunden: [22, 23], gewicht: 2 },
  { impulsId: 'alkohol', bereiche: ['koerper', 'psyche'], gefuehle: ['traurig', 'gestresst'], beduerfnisse: ['trost', 'genuss'], stunden: [19, 20], gewicht: 2 },
  { impulsId: 'arbeiten-statt-pause', bereiche: ['verwirklichung', 'psyche'], gefuehle: ['unruhig', 'gestresst'], beduerfnisse: ['pause'], stunden: [13, 14], gewicht: 2 },
];

const ALTERNATIV_TEXTE: Record<string, string[]> = {
  energie: ['Ein Apfel und ein Glas Wasser', '5 Minuten vor die Tür'],
  trost: ['Jemanden anrufen, der dir guttut', 'Deine Lieblingsmusik, laut oder leise'],
  pause: ['3 Minuten atmen am Fenster', 'Ein kurzer Spaziergang'],
  ablenkung: ['Kurz aufräumen', 'Raus vor die Tür'],
  belohnung: ['Ein Lieblingssong', 'Kaffee draußen trinken'],
  genuss: ['Eine kleine Portion, ohne Bildschirm'],
};

const NOTIZEN: Record<string, string[]> = {
  koerper: ['Zweimal hat der Spaziergang gereicht. Der Abend bleibt die offene Stelle.', 'Mehr Wasser, weniger Nachmittagstief.', 'Der Schlaf war das Thema der Woche.'],
  psyche: ['Auf dem Stand der Vorwoche.', 'Ruhigere Vormittage, die Abende ziehen noch.', 'Zweimal klar Nein gesagt. Das trägt.'],
  verwirklichung: ['Fällt zusammen mit ruhigeren Vormittagen.', 'Zwei gute Arbeitsblöcke, der Rest zerlief.', 'Das eigene Projekt hatte diese Woche Platz.'],
};

const NAECHSTE: Record<string, string[]> = {
  koerper: ['Schlaf vor Mitternacht, Abendessen früher.', 'Nachmittags ohne Zuckertief durchkommen.'],
  psyche: ['Abends früher abschalten.', 'Drei Abende ohne Bildschirm wären ein Anfang.'],
  verwirklichung: ['Vormittage für das eigene Projekt freihalten.', 'Feierabend um 18 Uhr.'],
};

export interface SeedErgebnis {
  momente: Moment[];
  reflexionen: Wochenreflexion[];
}

export function erzeugeSeed(geraet: string, heute: Date = new Date()): SeedErgebnis {
  const zufall = rng(20260831);
  const momente: Moment[] = [];
  const reflexionen: Wochenreflexion[] = [];
  const bereiche: BereichId[] = ['koerper', 'psyche', 'verwirklichung'];

  const startDieserWoche = wochenstart(heute);

  for (let w = 8; w >= 1; w--) {
    const wochenBeginn = new Date(startDieserWoche);
    wochenBeginn.setDate(wochenBeginn.getDate() - w * 7);
    const woche = isoWoche(wochenBeginn);

    const anzahl = 8 + Math.floor(zufall() * 6); // 8–13 Momente je Woche
    const bilanzJeBereich: Record<string, number> = {};

    for (let i = 0; i < anzahl; i++) {
      const wahl = gewichteteWahl(zufall);
      const tag = Math.floor(zufall() * 7);
      const stunde = wahl.stunden[Math.floor(zufall() * wahl.stunden.length)];
      const minute = Math.floor(zufall() * 60);
      const zeit = new Date(wochenBeginn);
      zeit.setDate(zeit.getDate() + tag);
      zeit.setHours(stunde, minute, 0, 0);

      const gefuehl = wahl.gefuehle[Math.floor(zufall() * wahl.gefuehle.length)];
      const beduerfnis = wahl.beduerfnisse[Math.floor(zufall() * wahl.beduerfnisse.length)];

      const wurf = zufall();
      let entscheidung: Moment['entscheidung'];
      let wartenErgebnis: Moment['wartenErgebnis'];
      if (wurf < 0.42) entscheidung = 'alternative';
      else if (wurf < 0.58) { entscheidung = 'warten'; wartenErgebnis = 'vorbei'; }
      else if (wurf < 0.64) { entscheidung = 'warten'; wartenErgebnis = 'bewusst-ja'; }
      else if (wurf < 0.86) entscheidung = 'bewusst-ja';
      else entscheidung = 'abbruch';

      const punkte = berechnePunkte({
        gefuehlAbgeschlossen: true,
        entscheidung,
        wartenErgebnis,
        bereicheZugeordnet: wahl.bereiche.length > 0,
      });
      for (const b of wahl.bereiche) {
        bilanzJeBereich[b] = (bilanzJeBereich[b] ?? 0) + punkte.kompass;
      }

      const iso = zeit.toISOString();
      momente.push({
        id: ulid(zeit.getTime()),
        createdAt: iso,
        updatedAt: iso,
        deviceId: geraet,
        zeitpunkt: iso,
        eingabeart: zufall() < 0.5 ? 'kachel' : 'text',
        impulsId: wahl.impulsId,
        gefuehl,
        intensitaet: zufall() < 0.3 ? 'stark' : zufall() < 0.6 ? 'mittel' : 'leicht',
        beduerfnis,
        kompassSpiegelTyp: zufall() < 0.5 ? 'ziel' : 'wunschbild',
        entscheidung,
        gewaehlteAlternative:
          entscheidung === 'alternative'
            ? (ALTERNATIV_TEXTE[beduerfnis] ?? ALTERNATIV_TEXTE.pause)[0]
            : undefined,
        wartenErgebnis,
        bereiche: wahl.bereiche,
        punkte,
        dauerSekunden: 35 + Math.floor(zufall() * 40),
        demo: true,
      });
    }

    // Wochenreflexion: leichter Aufwärtstrend über die acht Wochen, mit Schwankung.
    const basis = 4.6 + (8 - w) * 0.28;
    const iso = new Date(wochenBeginn.getTime() + 6 * 86400000).toISOString();
    reflexionen.push({
      id: ulid(wochenBeginn.getTime() + 6 * 86400000),
      createdAt: iso,
      updatedAt: iso,
      deviceId: geraet,
      woche,
      bereiche: bereiche.map((b, idx) => ({
        bereichId: b,
        punkte: Math.max(2, Math.min(9, Math.round(basis + idx * 0.4 + (zufall() - 0.5) * 2))),
        notiz: NOTIZEN[b][Math.floor(zufall() * NOTIZEN[b].length)],
        naechsteWoche: NAECHSTE[b][Math.floor(zufall() * NAECHSTE[b].length)],
      })),
      streakRelevant: true,
      demo: true,
    });
  }

  return { momente, reflexionen };
}

function gewichteteWahl(zufall: () => number): ImpulsProfilEintrag {
  const summe = PROFIL.reduce((s, p) => s + p.gewicht, 0);
  let r = zufall() * summe;
  for (const p of PROFIL) {
    r -= p.gewicht;
    if (r <= 0) return p;
  }
  return PROFIL[0];
}
