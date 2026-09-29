/**
 * Preisblock (Prompt 14, Abschnitt 4) – ein Ort für Startseite, Schritt 11
 * und die Gutachten-E-Mail. Kein Streichpreis: Ein durchgestrichener Preis,
 * der nie verlangt wurde, wäre ein unzulässiger Referenzpreis (§ 11 PAngV).
 * Der Vergleichssatz erscheint nur mit Quelle (docs/QUELLEN.md).
 */
import { BERICHT_PREIS_BRUTTO_EUR, PREISVERGLEICH } from '@/config/business';
import { PREIS_ANRECHNUNG } from '@/config/durchsetzung';

export interface PreisblockZeile {
  /** Fett gesetzter Teil (leer = ganze Zeile normal). */
  fett: string;
  rest: string;
}

export function preisblockZeilen(): PreisblockZeile[] {
  const zeilen: PreisblockZeile[] = [
    {
      fett: `${BERICHT_PREIS_BRUTTO_EUR} € einmalig.`,
      rest: 'Ihr Gutachten mit Ihrer Zahl, Jahr für Jahr, mit allen Quellen.',
    },
  ];
  if (PREIS_ANRECHNUNG) {
    zeilen.push({ fett: 'Bei Beauftragung angerechnet: dann 0 €.', rest: '' });
  }
  if (PREISVERGLEICH.quelle !== '') {
    zeilen.push({ fett: '', rest: PREISVERGLEICH.satz });
  }
  return zeilen;
}

/** Reintext-Fassung für E-Mails. */
export function preisblockText(): string {
  return preisblockZeilen()
    .map((z) => [z.fett, z.rest].filter((t) => t !== '').join(' '))
    .join('\n');
}
