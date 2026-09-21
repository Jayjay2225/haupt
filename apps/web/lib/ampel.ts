/**
 * Wirtschaftliche Ampel für das Verbraucherprodukt (Prompt 8, Entscheidung 3):
 * Sie vergleicht die Schätzung des Rechenkerns mit dem Rückkaufswert und
 * spricht in Worten – ohne Euro-Beträge. Reine Funktionen, testbar.
 *
 * Grün  = in allen drei Szenarien mehr drin als bei Kündigung
 * Gelb  = knapp, offen oder ohne Rückkaufswert nicht vergleichbar
 * Rot   = kein Vorteil erkennbar oder kein Anwendungsfall (vor 1994, ab 2008,
 *         reine Risikopolice) – „das sagen wir Ihnen auch“
 */
import type { CalcResult } from '@rueckab/calc';
import type { EligibilityResult } from '@rueckab/eligibility';

export type AmpelFarbe = 'gruen' | 'gelb' | 'rot';

export interface WirtschaftlicheAmpel {
  ampel: AmpelFarbe;
  /** Kurze Überschrift, höchstens acht Wörter. */
  titel: string;
  /** Erklärung in zwei bis drei kurzen Sätzen, ohne Euro-Beträge. */
  text: string;
  /** Größenordnung in Worten (Basis) mit Bandbreite, falls berechenbar. */
  groessenordnung?: string;
  grund: 'vor-1994' | 'neu-2008' | 'ausschluss' | 'kein-vorteil' | 'knapp' | 'vorteil' | 'kein-rueckkaufswert';
}

/** Größenordnung eines Betrags in Worten – bewusst ohne Ziffern. */
export function groessenordnungInWorten(betrag: number): string {
  const b = Math.abs(betrag);
  if (b < 500) {
    return 'wenige hundert Euro';
  }
  if (b < 1000) {
    return 'einige hundert Euro';
  }
  if (b < 5000) {
    return 'ein niedriger vierstelliger Betrag';
  }
  if (b < 10000) {
    return 'ein hoher vierstelliger Betrag';
  }
  if (b < 30000) {
    return 'ein niedriger fünfstelliger Betrag';
  }
  if (b < 70000) {
    return 'ein mittlerer fünfstelliger Betrag';
  }
  if (b < 100000) {
    return 'ein hoher fünfstelliger Betrag';
  }
  if (b < 300000) {
    return 'ein niedriger sechsstelliger Betrag';
  }
  if (b < 700000) {
    return 'ein mittlerer sechsstelliger Betrag';
  }
  if (b < 1000000) {
    return 'ein hoher sechsstelliger Betrag';
  }
  return 'ein siebenstelliger Betrag';
}

export function bestimmeWirtschaftlicheAmpel(calc: CalcResult, eligibility: EligibilityResult): WirtschaftlicheAmpel {
  if (eligibility.angewendeteRegeln.includes('R-AUS-RISIKO-LV')) {
    return {
      ampel: 'rot',
      grund: 'ausschluss',
      titel: 'Rot: reine Risikopolice.',
      text: 'Eine Risikolebensversicherung hat keinen Sparanteil. Da gibt es nichts zurückzurechnen. Finger weg von teuren Versprechen.',
    };
  }
  if (calc.regime === 'vor-1994') {
    return {
      ampel: 'rot',
      grund: 'vor-1994',
      titel: 'Rot: zu alt für diesen Weg.',
      text: 'Verträge vor dem 29. Juli 1994 kennen den Widerspruch nach altem Recht nicht. Der Widerspruch bringt hier nichts. Kündigen oder behalten entscheiden Sie in Ruhe.',
    };
  }
  if (calc.regime === 'neu-2008') {
    return {
      ampel: 'rot',
      grund: 'neu-2008',
      titel: 'Rot: Vertrag ab 2008.',
      text: 'Für Verträge ab 2008 gilt das neue Widerrufsrecht. Es bringt meist kaum mehr als die Kündigung. Das sagen wir Ihnen auch.',
    };
  }

  const basis = calc.szenarien.basis;
  const min = calc.szenarien.min;
  const max = calc.szenarien.max;

  if (basis.mehrwertGegenKuendigung === undefined) {
    return {
      ampel: 'gelb',
      grund: 'kein-rueckkaufswert',
      titel: 'Gelb: Rückkaufswert fehlt.',
      text: 'Ohne Ihren Rückkaufswert können wir nicht vergleichen. Er steht in der letzten Standmitteilung. Tragen Sie ihn nach, dann wird die Ampel klar.',
      groessenordnung: `Der geschätzte Rückabwicklungswert ist ${groessenordnungInWorten(basis.rueckabwicklungswert)} (Schätzung mit Bandbreite).`,
    };
  }

  if (basis.wirtschaftlichKeinVorteil === true) {
    return {
      ampel: 'rot',
      grund: 'kein-vorteil',
      titel: 'Rot: Kündigen bringt hier nicht weniger.',
      text: 'Nach unserer Schätzung liegt der Widerspruch unter Ihrem Rückkaufswert. Ein Anwalt kostet Geld und bringt hier voraussichtlich nichts. Finger weg – das sagen wir Ihnen auch.',
    };
  }

  const minMehrwert = min.mehrwertGegenKuendigung ?? 0;
  const maxMehrwert = max.mehrwertGegenKuendigung ?? basis.mehrwertGegenKuendigung;
  if (minMehrwert > 0) {
    return {
      ampel: 'gruen',
      grund: 'vorteil',
      titel: 'Grün: Da liegt richtig was drin.',
      text: 'In allen drei Szenarien liegt der Widerspruch über Ihrem Rückkaufswert. Der Bericht liefert die Zahlen, danach der Weg über uns zu Ihrem Geld.',
      groessenordnung: `Mehr als bei Kündigung: voraussichtlich ${groessenordnungInWorten(basis.mehrwertGegenKuendigung)} (Schätzung mit Bandbreite: von ${groessenordnungInWorten(minMehrwert)} bis ${groessenordnungInWorten(maxMehrwert)}).`,
    };
  }

  return {
    ampel: 'gelb',
    grund: 'knapp',
    titel: 'Gelb: knapp. Rechnen lohnt, versprechen nicht.',
    text: 'Im mittleren Szenario etwas mehr als bei Kündigung, im vorsichtigen nicht. Ob es sich lohnt, entscheidet der Blick in Ihre Unterlagen.',
    groessenordnung: `Im mittleren Szenario ${groessenordnungInWorten(basis.mehrwertGegenKuendigung)} mehr als bei Kündigung – im vorsichtigen Szenario nicht.`,
  };
}
