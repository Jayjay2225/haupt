/**
 * Demo-Einrichtung (?demo=1): vollständiger Kompass mit Beispielinhalten plus
 * acht Beispielwochen — zum Ausprobieren ohne Onboarding. Alles als Demo
 * markiert und über die Einstellungen rückstandsfrei entfernbar.
 */
import { BEREICHS_KATALOGE } from './daten';
import { db, holeProfil, leererBereich, meinGeraet, speichereBereich, speichereProfil } from './db';
import { erzeugeSeed } from './logik/seed';
import type { BereichId } from './logik/typen';

const DEMO_BEREICHE: { id: BereichId; woran: string; ziel?: string }[] = [
  { id: 'koerper', woran: 'Schlaf vor Mitternacht, Abendessen früher.', ziel: '10 % Körperfett bis Dezember' },
  { id: 'psyche', woran: 'Abends früher abschalten.' },
  { id: 'verwirklichung', woran: 'Vormittage für das eigene Projekt freihalten.' },
];

export async function richteDemoEin(): Promise<void> {
  const profil = await holeProfil();
  if (profil.onboardingFertig) return;
  await speichereProfil({
    ...profil,
    vision: [
      'Ich lebe wach statt im Autopiloten und entscheide selbst, was mir guttut.',
      'Mein Körper trägt mich mit Energie durch volle Tage.',
      'Arbeit hat Platz — und einen Feierabend.',
    ],
    werte: ['gesundheit', 'freiheit', 'verbundenheit', 'ruhe', 'wachstum'].slice(0, 5),
    onboardingFertig: true,
  });
  for (const eintrag of DEMO_BEREICHE) {
    const konfig = leererBereich(eintrag.id);
    konfig.aktiv = true;
    konfig.wunschbild = BEREICHS_KATALOGE[eintrag.id].wunschbild.slice(0, 3).map((o) => o.id);
    konfig.radarImpulse = BEREICHS_KATALOGE[eintrag.id].radar_impulse;
    konfig.woranIchArbeite = eintrag.woran;
    if (eintrag.ziel) konfig.ziele = [{ text: eintrag.ziel }];
    await speichereBereich(konfig);
  }
  const seed = erzeugeSeed(meinGeraet());
  await db.momente.bulkPut(seed.momente);
  await db.reflexionen.bulkPut(seed.reflexionen);
}
