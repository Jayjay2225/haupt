/**
 * Übernahme-Ampel (Prompt 13, Abschnitt 1): Kommt der Vertrag für unser
 * Verfahren in Frage? Reihenfolge der Prüfung: Status → Rückkaufswert-
 * Schwelle → Rechnung. Schwellen aus config/ampel.ts.
 *
 * Grün = wir übernehmen · Gelb = knapp · Rot = kommt nicht in Frage
 * (Rechnung oder beendeter Vertrag) · Grau = für unser Verfahren zu klein.
 *
 * Die Gratis-Ansicht zeigt nur die Ampel – keine Beträge, keine Wortbänder,
 * keine Spanne (Prompt 13, 0.4).
 */
import type { CalcResult } from '@rueckab/calc';
import { AMPEL } from '@/config/ampel';

export type AmpelFarbe = 'gruen' | 'gelb' | 'rot' | 'grau';

export type AmpelVertragsstatus = 'laufend' | 'beitragsfrei' | 'gekuendigt' | 'abgelaufen';

export interface UebernahmeAmpel {
  ampel: AmpelFarbe;
  /** Überschrift der Ergebnis-Seite (Prompt 13, 2.2). */
  titel: string;
  /** Eine Zeile unter der Überschrift. */
  zeile: string;
  grund: 'uebernahme' | 'knapp' | 'kein-vorteil' | 'status' | 'zu-klein' | 'kein-rueckkaufswert';
}

/** Kaufknopf nur, wenn der Bericht zum Verfahren führen kann (Grün/Gelb). */
export function berichtKaufbar(ampel: UebernahmeAmpel): boolean {
  if (ampel.grund === 'zu-klein') {
    return AMPEL.uebernahme.berichtUnterSchwelle;
  }
  return ampel.grund === 'uebernahme' || ampel.grund === 'knapp';
}

const STATUS_MAP: Record<AmpelVertragsstatus, string> = {
  laufend: 'laeuft',
  beitragsfrei: 'beitragsfrei',
  gekuendigt: 'gekuendigt',
  abgelaufen: 'ausgezahlt',
};

export function bestimmeUebernahmeAmpel(
  calc: CalcResult,
  vertragsstatus: AmpelVertragsstatus | undefined,
  rueckkaufswert: number | undefined,
): UebernahmeAmpel {
  // 1. Status: gekündigte oder ausgezahlte Verträge übernehmen wir nicht.
  const status = STATUS_MAP[vertragsstatus ?? 'laufend'];
  if (!(AMPEL.uebernahme.statusErlaubt as readonly string[]).includes(status)) {
    return {
      ampel: 'rot',
      grund: 'status',
      titel: 'Rot. Gekündigte oder ausgezahlte Verträge übernehmen wir nicht.',
      zeile: 'Lassen Sie sich dazu anwaltlich beraten.',
    };
  }

  const mehrwert = calc.szenarien.basis.mehrwertGegenKuendigung;
  if (rueckkaufswert === undefined || mehrwert === undefined) {
    return {
      ampel: 'gelb',
      grund: 'kein-rueckkaufswert',
      titel: 'Gelb. Eine Zahl fehlt noch.',
      zeile: 'Ohne Ihren Rückkaufswert können wir nicht prüfen, ob wir übernehmen. Er steht in der letzten Standmitteilung.',
    };
  }

  // 2. Rückkaufswert-Schwelle: darunter ist der Fall für unser Verfahren zu
  //    klein (Grau) – sofern die Rechnung überhaupt positiv ist, sonst Rot.
  if (rueckkaufswert < AMPEL.uebernahme.minRueckkaufswert && mehrwert > 0) {
    return {
      ampel: 'grau',
      grund: 'zu-klein',
      titel: 'Ihr Vertrag ist für unser Verfahren zu klein.',
      zeile:
        'Wir übernehmen Fälle ab 30.000 € Rückkaufswert. Lassen Sie sich von einem Anwalt Ihrer Wahl oder der Verbraucherzentrale beraten.',
    };
  }

  // 3. Rechnung.
  if (mehrwert >= AMPEL.gruen.mehrwertMinAbsolut) {
    return {
      ampel: 'gruen',
      grund: 'uebernahme',
      titel: 'Ihr Vertrag kommt für unser Verfahren in Frage.',
      zeile: 'Der Prüfbericht nennt Ihre Zahl – innerhalb von 12 Stunden per E-Mail.',
    };
  }
  if (mehrwert > AMPEL.gelb.mehrwertMin) {
    return {
      ampel: 'gelb',
      grund: 'knapp',
      titel: 'Gelb. Knapp.',
      zeile: 'Der Prüfbericht entscheidet, ob wir übernehmen.',
    };
  }
  return {
    ampel: 'rot',
    grund: 'kein-vorteil',
    titel: 'Rot. Rechnerisch ist hier nicht mehr drin als der Rückkaufswert.',
    zeile: 'Für unser Verfahren kommt der Vertrag nicht in Frage.',
  };
}
