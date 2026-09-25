/**
 * Die eine, wirtschaftliche Ampel (Prompt 12, Abschnitt 0.2 und 1.3):
 * Sie vergleicht das Basis-Szenario des Rechenkerns mit dem Rückkaufswert –
 * für alle Jahrgänge (1980–2020) und alle klassischen Vertragsarten mit
 * derselben Formel. Schwellen und Wortbänder kommen aus config/ampel.ts.
 *
 * Grün  = Basis über RKW und mindestens 2.000 € Mehrwert.
 * Gelb  = Basis über RKW, aber unter der Grün-Schwelle.
 * Rot   = Basis nicht über RKW – „das sagen wir Ihnen auch“.
 *
 * Beendete Verträge (gekündigt/ausgezahlt): Es gibt keine Kündigung mehr,
 * mit der man vergleichen könnte – Maßstab ist der Netto-Wert über das
 * bereits Erhaltene hinaus, mit denselben Schwellen.
 */
import type { CalcResult } from '@rueckab/calc';
import { AMPEL } from '@/config/ampel';

export type AmpelFarbe = 'gruen' | 'gelb' | 'rot';

export type AmpelVertragsstatus = 'laufend' | 'beitragsfrei' | 'gekuendigt' | 'abgelaufen';

export interface WirtschaftlicheAmpel {
  ampel: AmpelFarbe;
  /** Überschrift der Ergebnis-Seite (Deck 3.3). */
  titel: string;
  /** Eine Zeile unter der Überschrift, ohne Euro-Beträge. */
  zeile: string;
  grund: 'vorteil' | 'knapp' | 'kein-vorteil' | 'kein-rueckkaufswert' | 'beendet';
}

/** Mehrwert in Worten nach den Stufen aus config/ampel.ts – nie als Betrag. */
export function groessenordnungInWorten(betrag: number): string {
  const b = Math.abs(betrag);
  for (const stufe of AMPEL.groessenordnung) {
    if (stufe.bis === null || b < stufe.bis) {
      return stufe.text;
    }
  }
  return AMPEL.groessenordnung[AMPEL.groessenordnung.length - 1]?.text ?? '';
}

export function bestimmeWirtschaftlicheAmpel(
  calc: CalcResult,
  vertragsstatus?: AmpelVertragsstatus,
): WirtschaftlicheAmpel {
  const basis = calc.szenarien.basis;
  const beendet = vertragsstatus === 'gekuendigt' || vertragsstatus === 'abgelaufen';

  // Beendete Verträge: Vergleichsmaßstab ist der Netto-Wert über das bereits
  // Erhaltene hinaus (Rückkaufswert bzw. Ablaufleistung sind gegengerechnet).
  if (basis.mehrwertGegenKuendigung === undefined && beendet) {
    const offen = basis.nettoanspruch;
    if (offen >= AMPEL.gruen.mehrwertMinAbsolut) {
      return {
        ampel: 'gruen',
        grund: 'beendet',
        titel: 'Rechnerisch ist deutlich mehr drin, als Sie erhalten haben.',
        zeile: `Größenordnung: ${groessenordnungInWorten(offen)} über dem bereits Erhaltenen – geschätzt, mit Bandbreite.`,
      };
    }
    if (offen > AMPEL.gelb.mehrwertMin) {
      return {
        ampel: 'gelb',
        grund: 'beendet',
        titel: 'Gelb. Knapp – es könnte sich lohnen.',
        zeile: 'Der Prüfbericht zeigt, ob es reicht.',
      };
    }
    return {
      ampel: 'rot',
      grund: 'kein-vorteil',
      titel: 'Rot. Rechnerisch ist hier nicht mehr drin, als Sie erhalten haben.',
      zeile: 'Sparen Sie sich den Bericht.',
    };
  }

  if (basis.mehrwertGegenKuendigung === undefined) {
    return {
      ampel: 'gelb',
      grund: 'kein-rueckkaufswert',
      titel: 'Gelb. Eine Zahl fehlt noch.',
      zeile: 'Ohne Ihren Rückkaufswert können wir nicht vergleichen. Er steht in der letzten Standmitteilung.',
    };
  }

  const mehrwert = basis.mehrwertGegenKuendigung;

  if (mehrwert > AMPEL.gruen.mehrwertMin && mehrwert >= AMPEL.gruen.mehrwertMinAbsolut) {
    return {
      ampel: 'gruen',
      grund: 'vorteil',
      titel: 'Rechnerisch ist deutlich mehr drin als der Rückkaufswert.',
      zeile: `Größenordnung: ${groessenordnungInWorten(mehrwert)} über dem Rückkaufswert – geschätzt, mit Bandbreite.`,
    };
  }

  if (mehrwert > AMPEL.gelb.mehrwertMin) {
    return {
      ampel: 'gelb',
      grund: 'knapp',
      titel: 'Gelb. Knapp – es könnte sich lohnen.',
      zeile: 'Der Prüfbericht zeigt, ob es reicht.',
    };
  }

  return {
    ampel: 'rot',
    grund: 'kein-vorteil',
    titel: 'Rot. Rechnerisch ist hier nicht mehr drin als der Rückkaufswert.',
    zeile: 'Sparen Sie sich den Bericht.',
  };
}
