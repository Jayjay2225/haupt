import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ErgebnisAnsicht } from '@/components/funnel/ErgebnisAnsicht';
import { VARIANTE } from '@/config/variante';

export const metadata: Metadata = {
  title: 'Ergebnis',
};

/**
 * Ergebnis-Seite nur in der Kanzlei-Variante (Modell C). Das
 * Verbraucherprodukt hat seit Prompt 14 keine Ergebnis-Seite mehr: Die Ampel
 * steht auf der Startseite, der Funnel endet in der Bestellung.
 */
export default function ErgebnisSeite() {
  if (!VARIANTE.belehrungsCheck) {
    notFound();
  }
  return (
    <div className="container schmal abschnitt">
      <ErgebnisAnsicht />
    </div>
  );
}
