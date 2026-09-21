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
  grund: 'vor-1994' | 'neu-2008' | 'ab-2017' | 'ausschluss' | 'kein-vorteil' | 'knapp' | 'vorteil' | 'kein-rueckkaufswert';
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

/**
 * Regime-Bewertung (Stand 21.09.2026, docs/RECHERCHE-ZEITRAEUME.md):
 * - vor 29.07.1994: kein Widerspruch, aber Widerruf nach § 8 Abs. 4 VVG i.d.F.
 *   1990 (ab 1991) ohne belehrungsunabhängige Erlöschensfrist; dazu die
 *   Mindestrückkaufswert-Rechtsprechung → Gelb (Partner prüfen; unsere
 *   Zahlenschätzung passt nur eingeschränkt).
 * - ab 2008 bis 2016: Widerruf nach § 8 VVG n.F.; bei fehlerhafter Belehrung
 *   läuft die Frist nicht (BGH IV ZR 384/14) → Gelb, einzelfallabhängig.
 * - ab 2017: Belehrungen praktisch durchgehend musterkonform → Rot.
 */
export function bestimmeWirtschaftlicheAmpel(
  calc: CalcResult,
  eligibility: EligibilityResult,
  beginnJahr?: number,
): WirtschaftlicheAmpel {
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
      ampel: 'gelb',
      grund: 'vor-1994',
      titel: 'Gelb: alter Vertrag, anderer Hebel.',
      text: 'Vor dem 29.07.1994 gab es den Widerspruch noch nicht – aber ein Widerrufsrecht nach altem Recht (ab 1991), das ohne korrekte Belehrung bis heute nicht erloschen ist. Dazu kommen oft zu niedrig abgerechnete Rückkaufswerte. Unsere Zahlenschätzung passt hier nur eingeschränkt – unsere Partner prüfen Ihren Jahrgang.',
    };
  }
  if (calc.regime === 'neu-2008') {
    if (beginnJahr !== undefined && beginnJahr >= 2017) {
      return {
        ampel: 'rot',
        grund: 'ab-2017',
        titel: 'Rot: Vertrag ab 2017.',
        text: 'Ab 2017 sind die Widerrufsbelehrungen praktisch durchgehend musterkonform; ein Widerruf läuft ins Leere. Kündigen oder behalten entscheiden Sie in Ruhe – teure Versprechen brauchen Sie nicht.',
      };
    }
    return {
      ampel: 'gelb',
      grund: 'neu-2008',
      titel: 'Gelb: Vertrag ab 2008 – Widerruf prüfen.',
      text: 'Auch nach 2008 waren viele Widerrufsbelehrungen fehlerhaft – dann läuft die Widerrufsfrist bis heute (BGH). Der Hebel ist meist kleiner als beim Widerspruch und hängt an Ihrer Belehrung. Prüfen lohnt, versprechen nicht – unsere Partner schauen drauf.',
    };
  }

  const basis = calc.szenarien.basis;
  const min = calc.szenarien.min;

  if (basis.mehrwertGegenKuendigung === undefined) {
    return {
      ampel: 'gelb',
      grund: 'kein-rueckkaufswert',
      titel: 'Gelb: Eine Zahl fehlt noch.',
      text: 'Ohne Ihren Rückkaufswert können wir nicht vergleichen. Er steht in der letzten Standmitteilung. Tragen Sie ihn nach – dann wird die Ampel klar.',
      groessenordnung: `Der geschätzte Rückabwicklungswert ist ${groessenordnungInWorten(basis.rueckabwicklungswert)} (Schätzung mit Bandbreite).`,
    };
  }

  if (basis.wirtschaftlichKeinVorteil === true) {
    return {
      ampel: 'rot',
      grund: 'kein-vorteil',
      titel: 'Rot. Ehrlich gesagt: Hier lohnt es nicht.',
      text: 'Nach unserer Schätzung liegt der Widerspruch unter Ihrem Rückkaufswert. Sparen Sie sich das Geld für den Prüfbericht. Wenn Sie den Vertrag loswerden wollen, ist Verkaufen vielleicht der bessere Weg.',
    };
  }

  const minMehrwert = min.mehrwertGegenKuendigung ?? 0;
  if (minMehrwert > 0) {
    return {
      ampel: 'gruen',
      grund: 'vorteil',
      titel: 'Grün. Rechnerisch ist deutlich mehr drin.',
      text: 'Bei Ihrem Vertrag ist rechnerisch mehr drin als der Rückkaufswert – in allen drei Szenarien. Wollen Sie die genaue Zahl?',
      groessenordnung: `Größenordnung: ${groessenordnungInWorten(basis.mehrwertGegenKuendigung)} über dem Rückkaufswert (Schätzung mit Bandbreite).`,
    };
  }

  return {
    ampel: 'gelb',
    grund: 'knapp',
    titel: 'Gelb. Knapp.',
    text: 'Es könnte sich lohnen, muss aber nicht: Im mittleren Szenario liegt der Widerspruch über Ihrem Rückkaufswert, im vorsichtigen nicht. Der Prüfbericht zeigt, ob es reicht.',
    groessenordnung: `Im mittleren Szenario ${groessenordnungInWorten(basis.mehrwertGegenKuendigung)} über dem Rückkaufswert – im vorsichtigen Szenario nicht.`,
  };
}
